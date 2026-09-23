/**
 * POST /api/staff-manage
 * Create / reset-password / remove staff (subadmin) accounts, plus the
 * one-time account lookup. The caller must be a SUPERADMIN for everything
 * except lookup: Supabase JWT verified server-side, then the profiles role
 * is checked with the service-role client. Plain admins cannot manage
 * staff — only superadmins.
 *
 * Staff auth uses synthetic unroutable emails (<username>@staff.dropx.internal)
 * so there is no email involved anywhere — staff sign in with username +
 * password at /staff/login. Only the 'subadmin' role can be created here,
 * and only existing subadmins can be reset or removed.
 *
 * One-time reveal: create/reset store the AES-encrypted password in
 * staff_password_vault. The public /get-acc-info page looks it up by the
 * staff member's full name (lowercased, trimmed, inner spaces collapsed)
 * and shows it ONCE — the reveal is marked server-side, so a refresh never
 * shows it again. Resetting re-arms it.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (the vault encryption key is
 *      derived from the service key — no extra env vars needed)
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const STAFF_DOMAIN = 'staff.dropx.internal';

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

/* ── Password vault (server-side only; never leaves this file) ── */

function vaultKey(): Buffer | null {
  // Derived from the service-role key already on the server — no extra env
  // var to configure. Rotating the service key retires stored passwords
  // (reset them afterwards to re-arm the reveal).
  const master = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (master.length < 16) return null;
  return createHash('sha256').update(`dropx-staff-vault-v1:${master}`).digest();
}

function encryptPassword(password: string): string | null {
  const key = vaultKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}

function decryptPassword(enc: string): string | null {
  const key = vaultKey();
  if (!key) return null;
  try {
    const raw = Buffer.from(enc, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** Same canonical form as normalizeFullName() in src/lib/staff.ts. */
function canonicalName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const n = raw.toLowerCase().trim().replace(/\s+/g, ' ');
  if (!n) return null;
  return n;
}

/** Store (or refresh) one staff member's retrievable password. Never throws. */
async function saveVault(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svc: any,
  staffUserId: string,
  username: string,
  password: string,
  createdBy: string | null
): Promise<boolean> {
  try {
    const enc = encryptPassword(password);
    if (!enc) return false;
    const { error } = await svc.from('staff_password_vault').upsert(
      {
        staff_user_id: staffUserId,
        username,
        enc_password: enc,
        revealed_at: null,
        updated_at: new Date().toISOString(),
        created_by: createdBy,
      },
      { onConflict: 'staff_user_id' }
    );
    return !error;
  } catch {
    return false;
  }
}

/** Public one-time reveal by full name. Generic errors — never leaks why. */
async function lookupVault(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svc: any,
  fullName: unknown
): Promise<{ status: number; body: unknown }> {
  const name = canonicalName(fullName);
  if (!name) return { status: 400, body: { error: 'Type your full name as given to your superadmin.' } };
  const { data: profiles } = await svc
    .from('profiles')
    .select('id,username,full_name')
    .eq('role', 'subadmin');
  const norm = (v: string | null) =>
    (v ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
  const hits = ((profiles ?? []) as { id: string; username: string; full_name: string | null }[])
    .filter((p) => norm(p.full_name) === name && (p.username ?? '') !== '');
  if (hits.length !== 1) {
    return { status: 404, body: { error: 'No account found for that name — check the spelling with your superadmin.' } };
  }
  const staff = hits[0];
  const { data: vault } = await svc
    .from('staff_password_vault')
    .select('enc_password,revealed_at')
    .eq('staff_user_id', staff.id)
    .single();
  const row = vault as { enc_password: string; revealed_at: string | null } | null;
  if (!row) {
    return { status: 404, body: { error: 'No login saved for that name — ask your superadmin to reset it.' } };
  }
  if (row.revealed_at) {
    return { status: 410, body: { error: 'Already shown once — ask your superadmin to reset it for a fresh reveal.' } };
  }
  const password = decryptPassword(row.enc_password);
  if (!password) {
    return { status: 500, body: { error: 'Could not read the saved login — ask your superadmin.' } };
  }
  await svc.from('staff_password_vault').update({ revealed_at: new Date().toISOString() }).eq('staff_user_id', staff.id);
  return { status: 200, body: { ok: true, username: staff.username, password } };
}

export async function POST(req: Request) {
  try {
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }
    const b = body as { action?: unknown; username?: unknown; password?: unknown; user_id?: unknown; full_name?: unknown };
    const url = process.env.SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) return json(500, { error: 'Server credentials missing.' });
    const svc = createClient(url, serviceKey);

    // Lookup is public — fullname auth happens via the one-time reveal.
    // (Logged-out staff have no session yet.) Everything else needs a superadmin.
    if (b.action === 'lookup') {
      const { status, body: out } = await lookupVault(svc, b.full_name);
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
      const share = await saveVault(svc, data.user.id, username, b.password, callerId);
      return json(200, {
        ok: true,
        user_id: data.user.id,
        username,
        vault_ready: share,
        vault_unavailable: share ? undefined : 'One-time reveal unavailable (run migration 031). Share the password by hand instead.',
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
        const saved = await saveVault(svc, b.user_id, t.username ?? 'staff', b.password, callerId);
        return json(200, {
          ok: true,
          vault_ready: saved,
          vault_unavailable: saved ? undefined : 'One-time reveal unavailable (run migration 031). Share the password by hand instead.',
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

    return json(400, { error: 'Unknown action (create, reset, delete, lookup).' });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'Staff request failed.' });
  }
}

export const config = { runtime: 'nodejs' };
