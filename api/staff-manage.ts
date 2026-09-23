/**
 * POST /api/staff-manage
 * Create / reset-password / remove staff (subadmin) accounts. The caller
 * must be a SUPERADMIN: Supabase JWT verified server-side, then the profiles
 * role is checked with the service-role client. Plain admins cannot manage
 * staff — only superadmins.
 *
 * Staff auth uses synthetic unroutable emails (<username>@staff.dropx.internal)
 * so there is no email involved anywhere — staff sign in with username +
 * password at /staff/login. Only the 'subadmin' role can be created here,
 * and only existing subadmins can be reset or removed.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';

const STAFF_DOMAIN = 'staff.dropx.internal';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function callerIsSuperadmin(req: Request): Promise<boolean> {
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
  return (profile as { role?: string } | null)?.role === 'superadmin';
}

function cleanUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const u = raw.trim().toLowerCase();
  if (u.length < 3 || u.length > 24) return null;
  if (!/^[a-z0-9._-]+$/.test(u)) return null;
  if (u.startsWith('.') || u.startsWith('-') || u.endsWith('.') || u.endsWith('-')) return null;
  return u;
}

export async function POST(req: Request) {
  try {
    if (!(await callerIsSuperadmin(req))) {
      return json(401, { error: 'Superadmin sign-in required.' });
    }
    const url = process.env.SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }
    const b = body as { action?: unknown; username?: unknown; password?: unknown; user_id?: unknown; full_name?: unknown };
    const svc = createClient(url, serviceKey);

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
      return json(200, { ok: true, user_id: data.user.id, username });
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
        return json(200, { ok: true });
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
