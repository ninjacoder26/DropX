-- DropX 2.0 — 026 staff subadmin role
-- A limited staff role for product photography: subadmins sign in with a
-- username + password (no email) through the separate /staff portal and may
-- ONLY add/remove rows in product_images. They cannot delete, edit, or read
-- anything else — RLS simply grants them nothing elsewhere.
--
-- Staff auth still runs on Supabase Auth (no custom crypto, no edge
-- functions): each staff account owns an unroutable synthetic email
-- <username>@staff.dropx.internal, created ONLY via the admin-verified
-- /api/staff-manage endpoint (service role, server-side). Self-signup keeps
-- the default 'customer' role via handle_new_user, so nobody can promote
-- themselves by registering a staff-looking email.

-- 1) Widen the role check (inline CHECK from 001 is named profiles_role_check).
do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('customer', 'admin', 'superadmin', 'subadmin'));
  end if;
end $$;

-- 2) Staff display handle (auth identity stays the synthetic email).
alter table public.profiles
  add column if not exists username text unique;

-- 3) Staff check for RLS (mirrors is_admin, SECURITY DEFINER).
create or replace function public.is_staff()
returns boolean
language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'subadmin'
  );
$$;

-- 4) Product images: the ONE thing staff may change. SELECT stays public;
-- admins keep full control; staff get insert + delete only (no update).
drop policy if exists "staff insert images" on public.product_images;
create policy "staff insert images" on public.product_images
  for insert with check (public.is_staff());

drop policy if exists "staff delete images" on public.product_images;
create policy "staff delete images" on public.product_images
  for delete using (public.is_staff());
