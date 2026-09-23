import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG, isSupabaseConfigured } from '../config';
import { createSafeStorage } from './storage';

export { isSupabaseConfigured };

if (!isSupabaseConfigured) {
  console.warn(
    '[DropX] Supabase is not configured. Fill in supabaseUrl + supabaseAnonKey in src/config.ts. ' +
      'The app still runs — catalog sections will show setup guidance instead of products.'
  );
}

// One shared client. Auth is explicit: the session persists in localStorage
// (memory fallback when storage is blocked), refreshes itself, and survives
// OAuth redirects back to the site.
export const supabase = createClient(
  APP_CONFIG.supabaseUrl || 'https://placeholder.supabase.co',
  APP_CONFIG.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: createSafeStorage(),
    },
  }
);
