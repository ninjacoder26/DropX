-- DropX 2.0 — 004 seed (Nepal-flavored demo catalog)
-- Optional: run once after 001–003 to get a working storefront.
-- All money in NPR. Image URLs below are Cloudinary demo placeholders —
-- replace with your own uploads via the admin dashboard.

-- Categories
insert into public.categories (name, slug, description, sort_order) values
  ('Stationery & Study', 'stationery-study', 'Notebooks, pens and desk essentials for students and makers.', 1),
  ('Tech & Accessories', 'tech-accessories', 'Cables, sleeves and everyday carry for your devices.', 2),
  ('Fashion & Accessories', 'fashion-accessories', 'Hoodies, tees, sneakers and finishing touches.', 3),
  ('Lifestyle & Fun', 'lifestyle-fun', 'Bottles, totes and things that make the day better.', 4)
on conflict (slug) do nothing;

-- Products (ids fixed for stable seeding)
-- Note: prices authoritative here; checkout re-reads them server-side.
insert into public.products (id, name, slug, description, category_id, base_price, compare_at_price, is_featured, is_trending, is_new) values
  ('11111111-1111-1111-1111-111111111111', 'Himalayan Heavyweight Hoodie', 'himalayan-heavyweight-hoodie',
   '480 GSM brushed fleece hoodie with tonal DropX embroidery. Built for Himalayan winters and late-night momo runs.',
   (select id from public.categories where slug='fashion-accessories'), 3499, 4299, true, true, true),
  ('22222222-2222-2222-2222-222222222222', 'Kathmandu Nights Tee', 'kathmandu-nights-tee',
   'Mid-weight 240 GSM cotton tee with back-city graphic print. Pre-shrunk, side-seamed, endlessly wearable.',
   (select id from public.categories where slug='fashion-accessories'), 1499, 1899, true, true, false),
  ('33333333-3333-3333-3333-333333333333', 'Thamel Trail Sneakers', 'thamel-trail-sneakers',
   'Grippy all-terrain sneakers with suede overlays — equally at home in Thamel alleys and Nagarkot trails.',
   (select id from public.categories where slug='fashion-accessories'), 5999, 7499, true, true, true),
  ('44444444-4444-4444-4444-444444444444', 'Everest Cap — Ember', 'everest-cap-ember',
   'Six-panel embroidered cap in signature ember orange with adjustable strap.',
   (select id from public.categories where slug='fashion-accessories'), 999, null, false, false, true),
  ('55555555-5555-5555-5555-555555555555', 'Patan Denim Jacket', 'patan-denim-jacket',
   'Washed selvedge-style denim trucker jacket with DropX chain-stitch back.',
   (select id from public.categories where slug='fashion-accessories'), 4999, 5999, false, true, false),
  ('66666666-6666-6666-6666-666666666666', 'Pokhara Canvas Tote', 'pokhara-canvas-tote',
   '16 oz canvas tote with interior pocket. Carries groceries, laptops, and lake-side novels.',
   (select id from public.categories where slug='lifestyle-fun'), 799, null, false, false, false),
  ('77777777-7777-7777-7777-777777777777', 'Kathmandu Kraft Notebook Trio', 'kathmandu-kraft-notebook-trio',
   'Three dot-grid kraft notebooks with lay-flat binding. For class notes, sketches and big plans.',
   (select id from public.categories where slug='stationery-study'), 599, 799, false, false, true),
  ('88888888-8888-8888-8888-888888888888', 'Thamel Braided USB-C Cable', 'thamel-braided-usb-c-cable',
   '1.5 m nylon-braided 60 W fast-charge cable with ember-orange connectors. Tangle-free guarantee.',
   (select id from public.categories where slug='tech-accessories'), 899, null, false, false, true),
  ('99999999-9999-9999-9999-999999999999', 'Patan 14" Laptop Sleeve', 'patan-14-laptop-sleeve',
   'Padded water-resistant sleeve for 14-inch laptops with a front pocket for cables and pens.',
   (select id from public.categories where slug='tech-accessories'), 1899, 2299, false, false, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Everest Steel Bottle 1L', 'everest-steel-bottle-1l',
   'Double-wall vacuum steel bottle. Keeps chiya hot on winter rides and water cold on summer hikes.',
   (select id from public.categories where slug='lifestyle-fun'), 1299, null, false, false, true)
on conflict (id) do nothing;

-- Variants (each product needs at least one active variant with stock)
insert into public.product_variants (product_id, name, sku, size, color, price_adjustment, stock) values
  ('11111111-1111-1111-1111-111111111111', 'M / Charcoal', 'DX-HOOD-M-CHA', 'M', 'Charcoal', 0, 24),
  ('11111111-1111-1111-1111-111111111111', 'L / Charcoal', 'DX-HOOD-L-CHA', 'L', 'Charcoal', 0, 18),
  ('11111111-1111-1111-1111-111111111111', 'XL / Ember', 'DX-HOOD-XL-EMB', 'XL', 'Ember', 200, 10),
  ('22222222-2222-2222-2222-222222222222', 'M / Paper White', 'DX-TEE-M-WHT', 'M', 'Paper White', 0, 40),
  ('22222222-2222-2222-2222-222222222222', 'L / Ink Black', 'DX-TEE-L-BLK', 'L', 'Ink Black', 0, 32),
  ('33333333-3333-3333-3333-333333333333', 'UK 8 / Sand', 'DX-SNK-8-SND', 'UK 8', 'Sand', 0, 12),
  ('33333333-3333-3333-3333-333333333333', 'UK 9 / Sand', 'DX-SNK-9-SND', 'UK 9', 'Sand', 0, 9),
  ('44444444-4444-4444-4444-444444444444', 'One Size / Ember', 'DX-CAP-OS-EMB', 'OS', 'Ember', 0, 50),
  ('55555555-5555-5555-5555-555555555555', 'L / Washed Indigo', 'DX-DNM-L-IND', 'L', 'Washed Indigo', 0, 7),
  ('66666666-6666-6666-6666-666666666666', 'One Size / Natural', 'DX-TOTE-OS-NAT', 'OS', 'Natural', 0, 60),
  ('77777777-7777-7777-7777-777777777777', 'One Size / Kraft', 'DX-NOTE-OS-KFT', 'OS', 'Kraft', 0, 45),
  ('88888888-8888-8888-8888-888888888888', '1.5m / Ember', 'DX-CABL-15-EMB', '1.5m', 'Ember', 0, 60),
  ('99999999-9999-9999-9999-999999999999', '14in / Charcoal', 'DX-SLV-14-CHA', '14in', 'Charcoal', 0, 20),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1L / Ember', 'DX-BOTL-1L-EMB', '1L', 'Ember', 0, 35)
on conflict (sku) do nothing;

-- Drops
insert into public.drops (kind, title, slug, description, hero_label, theme_color, starts_at, ends_at, is_published) values
  ('monthly', 'Ashwin Drop — City After Monsoon', 'ashwin-drop-city-after-monsoon',
   'Our October edit: heavyweight fleece, washed denim and trail-ready sneakers for the clear-sky season.',
   'DROP OF THE MONTH', '#F06427', now() - interval '5 days', now() + interval '25 days', true),
  ('mega', 'Dashain Mega Drop 2026', 'dashain-mega-drop-2026',
   'The biggest DropX collection of the year. Limited festival quantities, ember-on-black artwork, and gifts with every order over NPR 5,000.',
   'MEGA DROP OF THE YEAR', '#101010', now() + interval '30 days', now() + interval '45 days', true)
on conflict (slug) do nothing;

insert into public.drop_products (drop_id, product_id, sort_order, badge) values
  ((select id from public.drops where slug='ashwin-drop-city-after-monsoon'), '11111111-1111-1111-1111-111111111111', 1, 'Hero piece'),
  ((select id from public.drops where slug='ashwin-drop-city-after-monsoon'), '22222222-2222-2222-2222-222222222222', 2, 'Essential'),
  ((select id from public.drops where slug='ashwin-drop-city-after-monsoon'), '55555555-5555-5555-5555-555555555555', 3, ''),
  ((select id from public.drops where slug='dashain-mega-drop-2026'), '33333333-3333-3333-3333-333333333333', 1, 'Mega exclusive'),
  ((select id from public.drops where slug='dashain-mega-drop-2026'), '11111111-1111-1111-1111-111111111111', 2, ''),
  ((select id from public.drops where slug='dashain-mega-drop-2026'), '44444444-4444-4444-4444-444444444444', 3, 'Gift pick')
on conflict do nothing;

-- ─── Superseded demo categories (from the previous seed) ────────────
-- No-op on fresh databases. If the old seed ran before, this moves its
-- products onto the new categories and removes the old ones.
update public.products set category_id = (select id from public.categories where slug='fashion-accessories')
where category_id in (select id from public.categories where slug in ('streetwear','sneakers','accessories'));
update public.products set category_id = (select id from public.categories where slug='lifestyle-fun')
where slug = 'pokhara-canvas-tote';
delete from public.categories where slug in ('streetwear','sneakers','accessories','new-arrivals');
