/**
 * POST /api/cloudinary-delete
 * Server-side Cloudinary asset deletion. The caller must be an admin
 * (verified Supabase JWT + profiles role check, same as cloudinary-sign).
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
  return role === 'admin' || role === 'superadmin';
}

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return json(401, { error: 'Admin sign-in required.' });
    }
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }
    const public_id = (body as { public_id?: unknown }).public_id;
    // Only our own namespaced assets, bounded length — never arbitrary ids.
    if (typeof public_id !== 'string' || public_id.length > 200 || !/^[A-Za-z0-9_/\-]+$/.test(public_id)) {
      return json(400, { error: 'Invalid public_id.' });
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      // Non-fatal: the DB row is still deleted by the client; asset orphans can
      // be cleaned in the Cloudinary dashboard. Report honestly.
      return json(200, { ok: false, warning: 'Cloudinary server credentials not configured; asset retained in Cloudinary.' });
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1').update(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    const form = new FormData();
    form.append('public_id', public_id);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: form,
    });
    const out = (await res.json().catch(() => ({}))) as { result?: string };
    return json(200, { ok: out.result === 'ok', result: out.result ?? 'unknown' });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'Delete failed.' });
  }
}

export const config = { runtime: 'nodejs' };
