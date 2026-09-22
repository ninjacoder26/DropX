/**
 * OAuth redirect construction, isolated for auditability.
 *
 * INVARIANT: the post-login destination is ALWAYS `${browserOrigin}${path}`,
 * where `path` is a validated same-origin route. No email, profile field,
 * username, or user input can ever become (or redirect to) a host.
 * If you land on a strange-looking URL after Google login, it is the page
 * you started on — typically a Vercel preview deployment whose auto-made
 * subdomain embeds your Vercel account name.
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
