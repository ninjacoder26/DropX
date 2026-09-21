-- DropX 2.0 — 013 cost price + profit margin
-- Every product carries its REAL cost (cost_price). The storefront selling
-- price (base_price) is always cost + margin %. Admin → Settings controls
-- the margin (default 20) and applies it; place_order() keeps charging
-- base_price, so no checkout logic changes.

alter table public.products
  add column if not exists cost_price numeric(12,2) not null default 0
  check (cost_price >= 0);

-- Backfill: existing selling prices assumed to carry the default 20% margin.
update public.products
set cost_price = round(base_price / 1.2, 2)
where cost_price = 0;

insert into public.store_settings (key, value) values
  ('profit_margin', '20')
on conflict (key) do nothing;
