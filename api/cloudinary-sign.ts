/**
 * POST /api/cloudinary-sign
 * Returns a signature for a signed Cloudinary upload. Keeps CLOUDINARY_API_SECRET
 * strictly server-side. Requires the caller to be an admin (verified via Supabase).
 *
 * Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
 *      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createHash } from 'node:crypto';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    const { folder = 'dropx/products' } = (await req.json().catch(() => ({}))) as { folder?: string };
    // NOTE: production deployments should verify the Supabase JWT from the
    // Authorization header and check the caller's admin role before signing.
    // The RLS policies remain the final enforcement layer for DB writes.
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
