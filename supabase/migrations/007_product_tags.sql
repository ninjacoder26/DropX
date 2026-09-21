-- DropX 2.0 — 007 product tags
-- Fixed vocabulary (see src/lib/tags.ts): max 3 tags per product, enforced
-- by check constraint. Tags drive shop filter chips + recommendations.
-- Backfills the demo catalog; 008 seeds the full catalog with tags.

alter table public.products
  add column if not exists tags text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_tags_max3'
  ) then
    alter table public.products
      add constraint products_tags_max3 check (cardinality(tags) <= 3);
  end if;
end $$;

create index if not exists idx_products_tags on public.products using gin (tags);

-- Demo catalog backfill (fixed vocabulary only, max 3 each)
update public.products set tags = '{apparel,winter,accessories}' where slug = 'himalayan-heavyweight-hoodie';
update public.products set tags = '{apparel,art,accessories}' where slug = 'kathmandu-nights-tee';
update public.products set tags = '{footwear,outdoor,apparel}' where slug = 'thamel-trail-sneakers';
update public.products set tags = '{apparel,accessories,outdoor}' where slug = 'everest-cap-ember';
update public.products set tags = '{apparel,winter,accessories}' where slug = 'patan-denim-jacket';
update public.products set tags = '{bags,travel,school}' where slug = 'pokhara-canvas-tote';

-- Official support email (updates existing stores that ran 006 earlier)
update public.store_settings set value = 'dropx.nepal@gmail.com' where key = 'support_email';
