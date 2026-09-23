/**
 * POST /api/staff-manage
 * Create / reset-password / remove staff (subadmin) accounts, plus one-time
 * login codes. The caller must be a SUPERADMIN for everything except redeem:
 * Supabase JWT verified server-side, then the profiles role is checked with
 * the service-role client. Plain admins cannot manage staff — only superadmins.
 *
 * Staff auth uses synthetic unroutable emails (<username>@staff.dropx.internal)
 * so there is no email involved anywhere — staff sign in with username +
 * password at /staff/login. Only the 'subadmin' role can be created here,
 * and only existing subadmins can be reset or removed.
 *
 * One-time codes: create/reset mint an encoded login code (dx1_…) bound to
 * the AES-encrypted password. The code is safe to send over chat and dies on
 * first redeem (or after 7 days); minting a new one kills the old. Redeem is
 * PUBLIC — the 192-bit token itself is the secret.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      STAFF_SHARE_KEY (64 hex chars; without it, accounts still work but no
 *      codes are minted — share passwords by hand instead)
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const STAFF_DOMAIN = 'staff.dropx.internal';
const SHARE_PREFIX = 'dx1_';
const SHARE_TTL_DAYS = 7;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Superadmin user id, or null. */
async function callerSuperadminId(req: Request): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!url || !serviceKey || !token) return null;
  const admin = createClient(url, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
  return (profile as { role?: string } | null)?.role === 'superadmin' ? data.user.id : null;
}

function cleanUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const u = raw.trim().toLowerCase();
  if (u.length < 3 || u.length > 24) return null;
  if (!/^[a-z0-9._-]+$/.test(u)) return null;
  if (u.startsWith('.') || u.startsWith('-') || u.endsWith('.') || u.endsWith('-')) return null;
  return u;
}

/* ── One-time login codes (server-side only; never leaves this file) ── */

function shareKey(): Buffer | null {
  const hex = (process.env.STAFF_SHARE_KEY ?? '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  return Buffer.from(hex, 'hex');
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function validTokenFormat(token: unknown): token is string {
  return typeof token === 'string' && new RegExp(`^${SHARE_PREFIX}[A-Za-z0-9_-]{32}$`).test(token);
}

/** Mint one active code: kills older unused ones, stores AES-GCM ciphertext. */
async function mintShare(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svc: any,
  staffUserId: string,
  username: string,
  password: string,
  createdBy: string | null
): Promise<{ code: string; expiresAt: string } | null> {
  const key = shareKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const enc = Buffer.concat([iv, tag, ct]).toString('base64');
  const code = SHARE_PREFIX + randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + SHARE_TTL_DAYS * 864e5).toISOString();
  await svc.from('staff_login_shares').delete().eq('staff_user_id', staffUserId).is('used_at', null);
  const { error } = await svc.from('staff_login_shares').insert({
    token_hash: tokenHash(code),
    staff_user_id: staffUserId,
    username,
    enc_password: enc,
    expires_at: expiresAt,
    created_by: createdBy,
  });
  if (error) return null;
  return { code, expiresAt };
}

async function redeemShare(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svc: any,
  token: string
): Promise<{ status: number; body: unknown }> {
  if (!validTokenFormat(token)) return { status: 400, body: { error: 'That code does not look right.' } };
  const key = shareKey();
  if (!key) return { status: 500, body: { error: 'Login codes are not configured.' } };
  const { data } = await svc
    .from('staff_login_shares')
    .select('username,enc_password,used_at,expires_at')
    .eq('token_hash', tokenHash(token))
    .single();
  const row = data as { username: string; enc_password: string; used_at: string | null; expires_at: string } | null;
  if (!row) return { status: 404, body: { error: 'Code not found — ask your superadmin for a fresh one.' } };
  if (row.used_at) return { status: 410, body: { error: 'Code already used — ask your superadmin for a fresh one.' } };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { status: 410, body: { error: 'Code expired — ask your superadmin for a fresh one.' } };
  }
  let password: string;
  try {
    const raw = Buffer.from(row.enc_password, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    password = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return { status: 500, body: { error: 'Code could not be read — ask for a fresh one.' } };
  }
  await svc.from('staff_login_shares').update({ used_at: new Date().toISOString() }).eq('token_hash', tokenHash(token));
  return { status: 200, body: { ok: true, username: row.username, password } };
}

export async function POST(req: Request) {
  try {
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }
    const b = body as { action?: unknown; username?: unknown; password?: unknown; user_id?: unknown; full_name?: unknown; token?: unknown };
    const url = process.env.SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) return json(500, { error: 'Server credentials missing.' });
    const svc = createClient(url, serviceKey);

    // Redeem is public — the token itself is the secret (logged-out staff
    // have no session yet). Everything else needs a superadmin.
    if (b.action === 'redeem') {
      const { status, body: out } = await redeemShare(svc, b.token as string);
      return json(status, out);
    }
    const callerId = await callerSuperadminId(req);
    if (!callerId) {
      return json(401, { error: 'Superadmin sign-in required.' });
    }

    if (b.action === 'create') {
      const username = cleanUsername(b.username);
      if (!username) return json(400, { error: 'Invalid username (3–24 chars: letters, numbers, dot, dash, underscore).' });
      if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 72) {
        return json(400, { error: 'Password must be 8–72 characters.' });
      }
      const fullName = typeof b.full_name === 'string' ? b.full_name.trim().slice(0, 120) : '';
      const email = `${username}@${STAFF_DOMAIN}`;
      const { data, error } = await svc.auth.admin.createUser({
        email,
        password: b.password,
        email_confirm: true,
        user_metadata: { full_name: fullName, staff_username: username },
      });
      if (error || !data.user) {
        const taken = /already|exists|duplicate/i.test(error?.message ?? '');
        return json(409, { error: taken ? `Username “${username}” is already taken.` : (error?.message ?? 'Could not create staff account.') });
      }
      // handle_new_user may have already inserted a customer row — force staff.
      const { error: profErr } = await svc.from('profiles').upsert(
        { id: data.user.id, email, full_name: fullName, role: 'subadmin', username },
        { onConflict: 'id' }
      );
      if (profErr) {
        await svc.auth.admin.deleteUser(data.user.id).catch(() => undefined);
        return json(500, { error: 'Staff user created but profile failed — rolled back. Try again.' });
      }
      await svc.from('admin_logs').insert({
        action: 'staff.create',
        entity: 'profiles',
        entity_id: data.user.id,
        meta: { username },
      });
      const share = await mintShare(svc, data.user.id, username, b.password, callerId);
      return json(200, {
        ok: true,
        user_id: data.user.id,
        username,
        share_code: share?.code ?? null,
        share_expires_at: share?.expiresAt ?? null,
        share_unavailable: share ? undefined : 'Set STAFF_SHARE_KEY on the server to enable one-time login codes.',
      });
    }

    if (b.action === 'reset' || b.action === 'delete') {
      if (typeof b.user_id !== 'string' || !b.user_id) return json(400, { error: 'user_id required.' });
      const { data: target } = await svc.from('profiles').select('id,role,username').eq('id', b.user_id).single();
      const t = target as { id: string; role?: string; username?: string } | null;
      if (!t || t.role !== 'subadmin') return json(404, { error: 'Staff account not found (only subadmins are managed here).' });
      if (b.action === 'reset') {
        if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 72) {
          return json(400, { error: 'Password must be 8–72 characters.' });
        }
        const { error } = await svc.auth.admin.updateUserById(b.user_id, { password: b.password });
        if (error) return json(500, { error: error.message });
        await svc.from('admin_logs').insert({
          action: 'staff.reset',
          entity: 'profiles',
          entity_id: b.user_id,
          meta: { username: t.username ?? null },
        });
        const share = await mintShare(svc, b.user_id, t.username ?? 'staff', b.password, callerId);
        return json(200, {
          ok: true,
          share_code: share?.code ?? null,
          share_expires_at: share?.expiresAt ?? null,
          share_unavailable: share ? undefined : 'Set STAFF_SHARE_KEY on the server to enable one-time login codes.',
        });
      }
      const { error } = await svc.auth.admin.deleteUser(b.user_id);
      if (error) return json(500, { error: error.message });
      await svc.from('admin_logs').insert({
        action: 'staff.delete',
        entity: 'profiles',
        entity_id: b.user_id,
        meta: { username: t.username ?? null },
      });
      return json(200, { ok: true });
    }

    return json(400, { error: 'Unknown action (create, reset, delete).' });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'Staff request failed.' });
  }
}

export const config = { runtime: 'nodejs' };
