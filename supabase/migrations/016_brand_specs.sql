-- DropX 2.0 — 016 product brand + specs
-- brand: real brand name, or 'No Brand' (honest Daraz-style labelling).
-- specs: per-product details (weight, dimensions, material, …) as JSONB.
-- 017 backfills both for existing catalog rows.

alter table public.products
  add column if not exists brand text not null default '';

alter table public.products
  add column if not exists specs jsonb not null default '{}';
