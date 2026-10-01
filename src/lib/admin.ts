import { supabase } from './supabase';
import { invalidateStorefrontCaches } from './cache';

/** Append-only admin audit trail. Never pass secrets, tokens, or credentials in meta. */
export function logAdminAction(action: string, entity: string, entity_id?: string, meta: object = {}): void {
  // Every logged call is an admin write (product/category/drop/review save,
  // settings, plans, margin reprice, request triage…): drop the cached
  // storefront reads so the shop reflects the dashboard instantly instead
  // of waiting out the 60s TTL. Over-invalidation (orders, roles) is harmless.
  invalidateStorefrontCaches();
  supabase.from('admin_logs').insert({ action, entity, entity_id, meta }).then(
    () => undefined,
    () => undefined
  );
}

/* ── Admin list cache: tab switches feel instant, never a full reload ── */
// Sections mount fresh on every tab visit. This 45s memory holds the last
// rows so the list paints immediately, then each section silently refreshes
// behind it. Writes always reload for real (see callers), so edits never
// go stale. Tab state itself lives in the URL (see edit params), so a
// browser refresh restores the exact view instead of dropping to the list.
const LIST_TTL_MS = 45_000;
const listCache = new Map<string, { ts: number; data: unknown }>();

export function getAdminList<T>(key: string): T | null {
  const e = listCache.get(key);
  if (!e || Date.now() - e.ts > LIST_TTL_MS) {
    if (e) listCache.delete(key);
    return null;
  }
  return e.data as T;
}

export function setAdminList(key: string, data: unknown): void {
  listCache.set(key, { ts: Date.now(), data });
}

export function dropAdminList(key: string): void {
  listCache.delete(key);
}
