/**
 * OAuth redirect construction, isolated for auditability.
 *
 * INVARIANT: the post-login destination is ALWAYS `${browserOrigin}${path}`,
 * where `path` is a validated same-origin route. No email, profile field,
 * username, or user input can ever become (or redirect to) a host.
 *
 * SELF-HEAL: Supabase ignores our `redirectTo` when the current domain is
 * missing from its dashboard allowlist and drops the user on the dashboard
 * Site URL instead (e.g. an old *.vercel.app domain). We remember where the
 * login started and bounce back automatically — see remember/consume below.
 */

const LOGIN_ORIGIN_KEY = 'dropx-login-origin';

/** Allowlisted in-app path. Anything else collapses to the fallback. */
export function safeNextPath(next: unknown, fallback = '/account'): string {
  if (typeof next !== 'string') return fallback;
  const t = next.trim();
  if (t.length === 0 || t.length > 200) return fallback;
  if (!t.startsWith('/') || t.startsWith('//')) return fallback;
  // No hosts, ports, credentials, backslashes, or whitespace smuggling.
  if (/[\s\\@:]/.test(t)) return fallback;
  return t;
}

/** Full `redirectTo` for signInWithOAuth / recovery emails. */
export function oauthRedirectTo(origin: string, next?: unknown, fallback = '/account'): string {
  return `${origin}${safeNextPath(next, fallback)}`;
}

/** Stash where the login started (best-effort; storage may be blocked). */
export function rememberLoginOrigin(): void {
  try {
    sessionStorage.setItem(LOGIN_ORIGIN_KEY, window.location.origin);
  } catch {
    /* private mode etc. — the dashboard allowlist is the real fix */
  }
}

/** Read + clear the stashed origin. Null when absent or unreadable. */
export function consumeLoginOrigin(): string | null {
  try {
    const v = sessionStorage.getItem(LOGIN_ORIGIN_KEY);
    sessionStorage.removeItem(LOGIN_ORIGIN_KEY);
    return v && v.startsWith('https://') ? v : null;
  } catch {
    return null;
  }
}
