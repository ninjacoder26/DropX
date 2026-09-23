/**
 * POST /api/cloudinary-sign
 * Returns a signature for a signed Cloudinary upload. Keeps CLOUDINARY_API_SECRET
 * strictly server-side. The caller must be staff or above: we verify the Supabase
 * JWT from the Authorization header and check the profiles role (subadmins
 * upload product images through the staff portal).
 *
 * Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
 *      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function isAdminRequest(req: Request): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!url || !serviceKey || !token) return false;
  const admin = createClient(url, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return false;
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
  const role = (profile as { role?: string } | null)?.role;
  return role === 'admin' || role === 'superadmin' || role === 'subadmin';
}

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return json(401, { error: 'Admin sign-in required.' });
    }
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }
    const folder = (body as { folder?: unknown }).folder ?? 'dropx/products';
    // Lock signing to our own upload namespace — never sign arbitrary folders.
    if (typeof folder !== 'string' || !/^dropx\/[A-Za-z0-9_-]{1,40}$/.test(folder)) {
      return json(400, { error: 'Invalid folder.' });
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return json(500, { error: 'Cloudinary server credentials are not configured.' });
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(toSign).digest('hex');
    return json(200, { signature, timestamp, apiKey, cloudName, folder });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'Signing failed.' });
  }
}

export const config = { runtime: 'nodejs' };
