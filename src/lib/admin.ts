import { supabase } from './supabase';

/** Append-only admin audit trail. Never pass secrets, tokens, or credentials in meta. */
export function logAdminAction(action: string, entity: string, entity_id?: string, meta: object = {}): void {
  supabase.from('admin_logs').insert({ action, entity, entity_id, meta }).then(
    () => undefined,
    () => undefined
  );
}
