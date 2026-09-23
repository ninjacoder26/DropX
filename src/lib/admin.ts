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
