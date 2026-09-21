-- DropX 2.0 — 010 input length limits (defense in depth)
-- Client forms validate first; these constraints make oversized or abusive
-- payloads impossible even if someone calls the API directly.
-- All limits sit above every existing seed/demo row.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reviews_title_len') then
    alter table public.reviews add constraint reviews_title_len check (char_length(title) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_body_len') then
    alter table public.reviews add constraint reviews_body_len check (char_length(body) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_name_len') then
    alter table public.products add constraint products_name_len check (char_length(name) <= 160);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_desc_len') then
    alter table public.products add constraint products_desc_len check (char_length(description) <= 4000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_notes_len') then
    alter table public.orders add constraint orders_notes_len check (char_length(notes) <= 1000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_ship_len') then
    alter table public.orders add constraint orders_ship_len check (
      char_length(shipping_name) <= 120 and char_length(shipping_phone) <= 20 and
      char_length(shipping_city) <= 100 and char_length(shipping_street) <= 300 and
      char_length(coalesce(shipping_postal, '')) <= 20
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'addresses_fields_len') then
    alter table public.addresses add constraint addresses_fields_len check (
      char_length(label) <= 40 and char_length(full_name) <= 120 and
      char_length(phone) <= 20 and char_length(city) <= 100 and
      char_length(street) <= 300 and char_length(coalesce(postal_code, '')) <= 20
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'drops_title_len') then
    alter table public.drops add constraint drops_title_len check (
      char_length(title) <= 160 and char_length(description) <= 4000
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_name_len') then
    alter table public.profiles add constraint profiles_name_len check (
      char_length(coalesce(full_name, '')) <= 120 and char_length(coalesce(phone, '')) <= 20
    );
  end if;
end $$;
