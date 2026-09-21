import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG, isSupabaseConfigured } from '../config';

export { isSupabaseConfigured };

if (!isSupabaseConfigured) {
  console.warn(
    '[DropX] Supabase is not configured. Fill in supabaseUrl + supabaseAnonKey in src/config.ts. ' +
      'The app still runs — catalog sections will show setup guidance instead of products.'
  );
}

export const supabase = createClient(
  APP_CONFIG.supabaseUrl || 'https://placeholder.supabase.co',
  APP_CONFIG.supabaseAnonKey || 'placeholder-anon-key'
);
