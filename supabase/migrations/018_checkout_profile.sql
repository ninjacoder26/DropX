-- DropX 2.0 — 018 checkout profile
-- Remembers each shopper's checkout details (name, phone, guided address,
-- preferred shipping method) so returning customers never re-type them.
-- Covered by the existing "users update own profile (not role)" policy —
-- no RLS change needed. Checkout prefill order: profile → address book → blank.

alter table public.profiles
  add column if not exists checkout_name text not null default '',
  add column if not exists checkout_phone text not null default '',
  add column if not exists checkout_district text not null default '',
  add column if not exists checkout_area text not null default '',
  add column if not exists checkout_street text not null default '',
  add column if not exists checkout_postal text,
  add column if not exists preferred_shipping text not null default 'standard'
    check (preferred_shipping in ('standard', 'express'));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_checkout_len') then
    alter table public.profiles add constraint profiles_checkout_len check (
      char_length(checkout_name) <= 120 and char_length(checkout_phone) <= 20 and
      char_length(checkout_district) <= 40 and char_length(checkout_area) <= 100 and
      char_length(checkout_street) <= 300 and char_length(coalesce(checkout_postal, '')) <= 20
    );
  end if;
end $$;
