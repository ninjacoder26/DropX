/**
 * Tiny TTL caches for hot read paths (catalog, settings, plans, popularity).
 * Rules of the road:
 * - 60s TTL: stale product *displays* for under a minute is harmless because
 *   prices, stock and totals are always re-verified server-side at checkout.
 * - Every admin write path calls the matching invalidator so the dashboard
 *   never shows its own just-saved change as stale.
 * - Never cache carts, orders, auth, or anything user-specific.
 */

export interface TTLCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  clear(): void;
}

export function createTTLCache<T>(ttlMs: number): TTLCache<T> {
  const store = new Map<string, { ts: number; value: T }>();
  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() - entry.ts > ttlMs) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T): void {
      store.set(key, { ts: Date.now(), value });
    },
    clear(): void {
      store.clear();
    },
  };
}

/** Return the cached value or run the loader once and cache successes only. */
export async function cachedFetch<T>(cache: TTLCache<T>, key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  trackStart();
  try {
    const value = await loader();
    cache.set(key, value);
    return value;
  } finally {
    trackEnd();
  }
}

/* ── Slow-data signal: any cached read hanging past 5 seconds ── */

export type SlowDataListener = (slow: boolean) => void;

const slowListeners = new Set<SlowDataListener>();
let inFlight = 0;
let slowTimer: ReturnType<typeof setTimeout> | null = null;

/** Subscribe to "data is taking a while". Returns an unsubscribe fn. */
export function onSlowData(cb: SlowDataListener): () => void {
  slowListeners.add(cb);
  return () => {
    slowListeners.delete(cb);
  };
}

function emitSlow(slow: boolean): void {
  for (const cb of [...slowListeners]) {
    try {
      cb(slow);
    } catch {
      /* listener bugs must never break fetches */
    }
  }
}

function trackStart(): void {
  if (slowListeners.size === 0) return;
  inFlight += 1;
  if (inFlight === 1 && slowTimer === null) {
    slowTimer = setTimeout(() => {
      slowTimer = null;
      if (inFlight > 0) emitSlow(true);
    }, 5000);
  }
}

function trackEnd(): void {
  if (slowListeners.size === 0) {
    inFlight = 0;
    return;
  }
  inFlight = Math.max(0, inFlight - 1);
  if (inFlight === 0) {
    if (slowTimer !== null) {
      clearTimeout(slowTimer);
      slowTimer = null;
    }
    emitSlow(false);
  }
}

/* ═══════════════ registry: one call invalidates every storefront read ═══════════════ */

const registry = new Set<{ clear(): void }>();

/** Read caches register here so a single admin write refreshes them all. */
export function registerCache(c: { clear(): void }): void {
  registry.add(c);
}

/**
 * Drop every registered storefront read cache. Called automatically by
 * logAdminAction (every admin write is logged), so the shopfront reflects
 * the dashboard instantly instead of waiting out the 60s TTL.
 * Never register carts, orders, or auth state here.
 */
export function invalidateStorefrontCaches(): void {
  for (const c of registry) {
    try {
      c.clear();
    } catch {
      // Keep clearing the rest; a failed clear just means a 60s-stale read.
    }
  }
}
