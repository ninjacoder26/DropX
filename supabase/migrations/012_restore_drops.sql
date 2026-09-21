-- DropX 2.0 — 012 restore signature drops (one-time repair)
-- Recreates the Drop of the Month + Mega Drop of the Year if they were
-- deleted, and links real catalog products to them.
-- Fully guarded: inserts only missing slugs and existing products.
-- Safe to run any number of times.

insert into public.drops (kind, title, slug, description, hero_label, theme_color, starts_at, ends_at, is_published)
select 'monthly', 'Ashwin Drop — City After Monsoon', 'ashwin-drop-city-after-monsoon',
  'Our October edit: heavyweight fleece, washed denim and trail-ready sneakers for the clear-sky season.',
  'DROP OF THE MONTH', '#F06427',
  now() - interval '5 days', now() + interval '25 days', true
where not exists (select 1 from public.drops where slug = 'ashwin-drop-city-after-monsoon');

insert into public.drops (kind, title, slug, description, hero_label, theme_color, starts_at, ends_at, is_published)
select 'mega', 'Dashain Mega Drop 2026', 'dashain-mega-drop-2026',
  'The biggest DropX collection of the year. Limited festival quantities, ember-on-black artwork, and gifts with every order over NPR 5,000.',
  'MEGA DROP OF THE YEAR', '#101010',
  now() + interval '30 days', now() + interval '45 days', true
where not exists (select 1 from public.drops where slug = 'dashain-mega-drop-2026');

-- Link real catalog products (same guarded pattern as 011)
delete from public.drop_products
where drop_id = (select id from public.drops where slug = 'ashwin-drop-city-after-monsoon');

insert into public.drop_products (drop_id, product_id, sort_order, badge)
select
  (select id from public.drops where slug = 'ashwin-drop-city-after-monsoon'),
  (select id from public.products where slug = 'antipilling-hoodie-charcoal'),
  1, 'Hero piece'
where exists (select 1 from public.drops where slug = 'ashwin-drop-city-after-monsoon')
  and exists (select 1 from public.products where slug = 'antipilling-hoodie-charcoal');

insert into public.drop_products (drop_id, product_id, sort_order, badge)
select
  (select id from public.drops where slug = 'ashwin-drop-city-after-monsoon'),
  (select id from public.products where slug = 'classic-wash-denim-jacket'),
  2, 'Essential'
where exists (select 1 from public.drops where slug = 'ashwin-drop-city-after-monsoon')
  and exists (select 1 from public.products where slug = 'classic-wash-denim-jacket');

insert into public.drop_products (drop_id, product_id, sort_order, badge)
select
  (select id from public.drops where slug = 'ashwin-drop-city-after-monsoon'),
  (select id from public.products where slug = 'air-style-white-sneakers'),
  3, ''
where exists (select 1 from public.drops where slug = 'ashwin-drop-city-after-monsoon')
  and exists (select 1 from public.products where slug = 'air-style-white-sneakers');

delete from public.drop_products
where drop_id = (select id from public.drops where slug = 'dashain-mega-drop-2026');

insert into public.drop_products (drop_id, product_id, sort_order, badge)
select
  (select id from public.drops where slug = 'dashain-mega-drop-2026'),
  (select id from public.products where slug = 'chunky-dad-sneakers-white'),
  1, 'Mega exclusive'
where exists (select 1 from public.drops where slug = 'dashain-mega-drop-2026')
  and exists (select 1 from public.products where slug = 'chunky-dad-sneakers-white');

insert into public.drop_products (drop_id, product_id, sort_order, badge)
select
  (select id from public.drops where slug = 'dashain-mega-drop-2026'),
  (select id from public.products where slug = 'varsity-jacket-wool-blend'),
  2, ''
where exists (select 1 from public.drops where slug = 'dashain-mega-drop-2026')
  and exists (select 1 from public.products where slug = 'varsity-jacket-wool-blend');

insert into public.drop_products (drop_id, product_id, sort_order, badge)
select
  (select id from public.drops where slug = 'dashain-mega-drop-2026'),
  (select id from public.products where slug = 'baguette-shoulder-bag'),
  3, ''
where exists (select 1 from public.drops where slug = 'dashain-mega-drop-2026')
  and exists (select 1 from public.products where slug = 'baguette-shoulder-bag');
