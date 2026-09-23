import type { Session } from '@supabase/supabase-js';

// Refresh a bit early so the first query after a return visit never goes
// out with a dead token.
export const REFRESH_MARGIN_S = 60;

// Don't hammer refresh when focus fires repeatedly.
export const REFRESH_THROTTLE_MS = 30_000;

// True when there is no usable session or it expires within the margin.
export function sessionNeedsRefresh(s: Session | null, nowMs = Date.now(), marginS = REFRESH_MARGIN_S): boolean {
  if (!s?.access_token) return false;
  const expMs = (s.expires_at ?? 0) * 1000;
  if (!expMs) return false;
  return expMs - nowMs < marginS * 1000;
}
