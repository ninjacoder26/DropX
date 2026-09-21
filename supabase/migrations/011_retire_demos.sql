-- DropX 2.0 — 011 retire the original demo products
-- Removes the 6 first-draft fashionware demos (superseded by the 200-item
-- catalog in 008). Both drops are repointed at real catalog items first.
-- Every statement is guarded: safe to run with or without 008 in place.
-- Order history is preserved (order_items.product_id is ON DELETE SET NULL).

-- Repoint the Ashwin monthly drop at real catalog pieces
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

-- Repoint the Dashain mega drop at real catalog pieces
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

-- Delete the 6 originals. Variants, images, carts and wishlists cascade;
-- past order items keep their snapshots with product set to null.
delete from public.products where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);
