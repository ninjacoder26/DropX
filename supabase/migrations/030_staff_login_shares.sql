-- DropX 2.0 — 030 one-time staff login shares
-- Lets a superadmin hand a staff password over chat without pasting it in
-- the clear: the API mints a single-use encoded code (dx1_…) bound to the
-- AES-encrypted password. Whoever redeems it first gets the password once;
-- the code then dies (plus a 7-day expiry). Only one unused code exists per
-- staff account — minting a new one kills the old.
--
-- Locked down hard: RLS enabled with NO policies, so only the service role
-- (the /api/staff-manage endpoint) can read or write these rows. The raw
-- token is never stored — only its SHA-256 hash.

create table if not exists public.staff_login_shares (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  staff_user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  enc_password text not null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_shares_user on public.staff_login_shares(staff_user_id);
create index if not exists idx_shares_hash on public.staff_login_shares(token_hash);

alter table public.staff_login_shares enable row level security;
