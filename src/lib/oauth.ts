/**
 * OAuth redirect construction, isolated for auditability.
 *
 * INVARIANT: the post-login destination is ALWAYS `${browserOrigin}${path}`,
 * where `path` is a validated same-origin route. No email, profile field,
 * username, or user input can ever become (or redirect to) a host.
 *
 * SELF-HEAL: Supabase ignores our `redirectTo` when the current domain is
 * missing from its dashboard allowlist and drops the user on the dashboard
 * Site URL instead (e.g. an old *.vercel.app domain). redirectTo below is
 * hardcoded to production so the allowlist has exactly one URL to contain.
 */

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

/**
 * One true production host. Vercel keeps serving the old auto-made domain
 * next to the new one (and Supabase falls back to whichever Site URL it
 * has), so anyone arriving on a retired host is bounced here with path
 * intact. Preview deployments and localhost are NEVER touched.
 */
export const CANONICAL_HOST = 'dropxnepal.vercel.app';

/** The single origin OAuth and recovery emails point at. Hardcoded on
 * purpose: logins must always come home to production. Localhost keeps its
 * own origin so development logins keep working offline. */
export const PRODUCTION_ORIGIN = 'https://dropxnepal.vercel.app';

export function appOrigin(): string {
  if (typeof window === 'undefined') return PRODUCTION_ORIGIN;
  const o = window.location.origin;
  if (o.includes('localhost') || o.includes('127.0.0.1')) return o;
  return PRODUCTION_ORIGIN;
}

/** Retired hosts that must land on CANONICAL_HOST. Exact matches only. */
const LEGACY_HOSTS = ['dropx-ninjacoder26.vercel.app'];

/** Canonical host for a retired hostname, or null to stay put. */
export function canonicalRedirectFor(hostname: string): string | null {
  if (LEGACY_HOSTS.includes(hostname.trim().toLowerCase())) return CANONICAL_HOST;
  return null;
}
