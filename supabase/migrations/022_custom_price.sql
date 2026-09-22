-- DropX 2.0 — 022 manual selling-price override
-- Normally selling = cost × (1 + margin). Setting use_custom_price keeps a
-- hand-picked base_price through margin reprices and hides the "+X% margin"
-- note on the product page (the math would no longer hold).

alter table public.products
  add column if not exists use_custom_price boolean not null default false;
