-- DropX 2.0 — 031 staff password vault (replaces one-time codes)
-- The dx1_ code system is gone. Instead each staff account keeps one
-- AES-encrypted password row. The public /get-acc-info page looks the row up
-- by the staff member's full name (normalized: lowercase, trimmed, inner
-- spaces collapsed) and reveals it ONCE, then marks it revealed — a refresh
-- never shows it again. Resetting the password re-arms the reveal.
--
-- Locked down: RLS enabled with NO policies, service role only.

drop table if exists public.staff_login_shares;

create table if not exists public.staff_password_vault (
  staff_user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  enc_password text not null,
  revealed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

alter table public.staff_password_vault enable row level security;
