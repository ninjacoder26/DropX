import { supabase, isSupabaseConfigured } from './supabase';

export type ShopEvent = 'view' | 'search' | 'wishlist_add' | 'cart_add' | 'rec_click';

/** Normalize free-text queries so "  Blue HOODIE " and "blue hoodie" count as one demand. */
export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
}

/** Random per-tab-session id. Not a login, not a fingerprint — just lets
 *  co-viewed products be grouped without knowing who viewed them. */
export function analyticsSessionId(): string {
  try {
    let sid = sessionStorage.getItem('dropx-sid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('dropx-sid', sid);
    }
    return sid;
  } catch {
    return 'nosession';
  }
}

interface EventInput {
  event: ShopEvent;
  userId?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  query?: string;
  meta?: Record<string, unknown>;
}

/** Fire-and-forget, never throws, no-ops without a backend. */
export function logEvent(input: EventInput): void {
  if (!isSupabaseConfigured) return;
  try {
    supabase
      .from('product_events')
      .insert({
        user_id: input.userId ?? null,
        session_id: analyticsSessionId(),
        event: input.event,
        product_id: input.productId ?? null,
        category_id: input.categoryId ?? null,
        query: input.query ?? null,
        meta: input.meta ?? {},
      })
      .then(
        () => undefined,
        () => undefined
      );
  } catch {
    /* analytics must never break shopping */
  }
}

/** Views log at most once per product per tab-session (no write spam). */
function alreadyLoggedView(productId: string): boolean {
  try {
    const key = 'dropx-logged-views';
    const arr = JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[];
    if (arr.includes(productId)) return true;
    arr.push(productId);
    sessionStorage.setItem(key, JSON.stringify(arr.slice(-60)));
    return false;
  } catch {
    return false;
  }
}

export function logView(userId: string | null, productId: string, categoryId?: string | null): void {
  if (alreadyLoggedView(productId)) return;
  logEvent({ event: 'view', userId, productId, categoryId });
}

export function logSearch(
  userId: string | null,
  query: string,
  resultCount: number,
  categorySlug?: string | null
): void {
  const q = normalizeQuery(query);
  if (q.length < 2) return;
  logEvent({ event: 'search', userId, query: q, meta: { results: resultCount, category: categorySlug ?? null } });
}

export function logWishlistAdd(userId: string | null, productId: string, categoryId?: string | null): void {
  logEvent({ event: 'wishlist_add', userId, productId, categoryId });
}

export function logCartAdd(
  userId: string | null,
  productId: string,
  categoryId?: string | null,
  quantity = 1
): void {
  logEvent({ event: 'cart_add', userId, productId, categoryId, meta: { quantity } });
}

export function logRecClick(
  userId: string | null,
  productId: string,
  source: string,
  categoryId?: string | null
): void {
  logEvent({ event: 'rec_click', userId, productId, categoryId, meta: { source } });
}
