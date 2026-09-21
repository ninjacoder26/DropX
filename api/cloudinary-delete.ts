/**
 * POST /api/cloudinary-delete
 * Server-side Cloudinary asset deletion (admin only in production — verify the
 * Supabase JWT + admin role here before destroying assets).
 *
 * Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
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
    const { public_id } = (await req.json()) as { public_id?: string };
    if (!public_id) return json(400, { error: 'public_id is required.' });
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
