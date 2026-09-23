/**
 * Staff (subadmin) accounts: username + password, no email.
 * Under the hood Supabase Auth still owns the credential, keyed by an
 * unroutable synthetic email — staff never see it. Accounts are created
 * ONLY through the admin-verified /api/staff-manage endpoint (service role
 * stays server-side); the login page just maps username → email.
 */

export const STAFF_EMAIL_DOMAIN = 'staff.dropx.internal';

export function normalizeStaffUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** username → synthetic auth email (never shown to staff). */
export function staffEmailForUsername(username: string): string {
  return `${normalizeStaffUsername(username)}@${STAFF_EMAIL_DOMAIN}`;
}

/** synthetic auth email → username, or null for real emails. */
export function usernameFromStaffEmail(email: string): string | null {
  const at = email.trim().toLowerCase().lastIndexOf('@');
  if (at < 0) return null;
  if (email.trim().toLowerCase().slice(at + 1) !== STAFF_EMAIL_DOMAIN) return null;
  return email.trim().toLowerCase().slice(0, at);
}

export function isStaffEmail(email: string): boolean {
  return usernameFromStaffEmail(email) !== null;
}

export function validateStaffUsername(raw: string): string | null {
  const u = normalizeStaffUsername(raw);
  if (u.length < 3) return 'Username needs at least 3 characters.';
  if (u.length > 24) return 'Username must be 24 characters or less.';
  if (!/^[a-z0-9._-]+$/.test(u)) return 'Username may only use letters, numbers, dot, dash and underscore.';
  if (u.startsWith('.') || u.startsWith('-') || u.endsWith('.') || u.endsWith('-')) {
    return 'Username cannot start or end with a dot or dash.';
  }
  return null;
}

export function validateStaffPassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 72) return 'Password must be 72 characters or less.';
  return null;
}

/** True for staff portal access (role comes from profiles). */
export function isSubAdminRole(role: string | null | undefined): boolean {
  return role === 'subadmin';
}
