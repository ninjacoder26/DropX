/**
 * DropX client configuration — EDIT YOUR VALUES HERE.
 *
 * These are all PUBLIC, browser-safe values (they ship in the JS bundle):
 *  - Supabase project URL + anon (publishable) key
 *  - Cloudinary cloud name + unsigned upload preset
 *
 * They intentionally live in code, not in environment files:
 * they are identical across localhost / preview / production, and the
 * anon key is designed to be public (row-level security is what protects
 * your data — see supabase/migrations/002_rls.sql).
 *
 * PRIVATE secrets (service-role key, Cloudinary API secret, …) NEVER go
 * here. They belong in the server `.env` file / Vercel dashboard only.
 */

export const APP_CONFIG = {
  appName: 'DropX',

  // ── Supabase (required) ──────────────────────────────────
  // Create a project at https://supabase.com/dashboard, run the SQL in
  // supabase/migrations, then paste the values from Project Settings → API.
  supabaseUrl: 'https://scfplulppzfjjxggtnch.supabase.co',
  supabaseAnonKey: 'sb_publishable_Q52XAYJFdbY7Ns7byBNL9w_26wRgWgV',

  // ── Cloudinary (required for admin image uploads) ────────
  // Cloud name from your Cloudinary dashboard + an UNSIGNED upload preset
  // (Settings → Upload → Upload presets) scoped to `dropx/products`.
  cloudinaryCloudName: 'vis22j9d',
  cloudinaryUploadPreset: 'dropx',
} as const;

/** False until the two Supabase values above are filled in. */
export const isSupabaseConfigured: boolean = Boolean(
  APP_CONFIG.supabaseUrl && APP_CONFIG.supabaseAnonKey
);

/** False until the two Cloudinary values above are filled in. */
export const isCloudinaryConfigured: boolean = Boolean(
  APP_CONFIG.cloudinaryCloudName && APP_CONFIG.cloudinaryUploadPreset
);
