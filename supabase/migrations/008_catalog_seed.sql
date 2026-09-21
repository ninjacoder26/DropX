-- DropX 2.0 — 008 full starter catalog (generated — do not hand-edit)
-- Source: lists/starter-products.csv via scripts/build-seed.py
-- 200 products (50/category) with tags + default variants. Idempotent.

insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Graphite Pencils 12-Pack', 'deli-graphite-pencils-12-pack', 'Smooth dark HB pencils for exams and sketching. Pack of 12.',
   (select id from public.categories where slug='stationery-study'), 179, 199, true, false, false, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-graphite-pencils-12-pack'), 'Standard', 'DX-SEED-71E9A4F7', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Apsara Platinum Pencils 10-Pack', 'apsara-platinum-pencils-10-pack', 'Extra-dark premium pencils with easy sharpening. Pack of 10.',
   (select id from public.categories where slug='stationery-study'), 155, 169, true, false, false, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='apsara-platinum-pencils-10-pack'), 'Standard', 'DX-SEED-CD684A98', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('M&G Blue Ball Pens 5-Pack', 'mg-blue-ball-pens-5-pack', 'Smear-free blue ball pens for daily classwork. Pack of 5.',
   (select id from public.categories where slug='stationery-study'), 239, 249, true, false, false, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mg-blue-ball-pens-5-pack'), 'Standard', 'DX-SEED-D6470410', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Cello Butterflow Pen Set 10', 'cello-butterflow-pen-set-10', 'Feather-light pens with vibrant ink flow. Pack of 10.',
   (select id from public.categories where slug='stationery-study'), 299, 329, true, false, false, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='cello-butterflow-pen-set-10'), 'Standard', 'DX-SEED-92726CE2', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Gel Pens 0.5mm 6-Pack', 'deli-gel-pens-05mm-6-pack', 'Crisp black gel pens for neat notes. Pack of 6.',
   (select id from public.categories where slug='stationery-study'), 275, 299, true, false, true, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-gel-pens-05mm-6-pack'), 'Standard', 'DX-SEED-3E924802', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Faber-Castell Highlighters 4-Set', 'faber-castell-highlighters-4-set', 'Pastel and neon markers that never bleed. Set of 4.',
   (select id from public.categories where slug='stationery-study'), 419, 449, true, false, true, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='faber-castell-highlighters-4-set'), 'Standard', 'DX-SEED-FF2A19D9', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Sticky Notes 4-Pad Set', 'deli-sticky-notes-4-pad-set', 'Bright memo pads that stick and restick. Set of 4.',
   (select id from public.categories where slug='stationery-study'), 239, 269, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-sticky-notes-4-pad-set'), 'Standard', 'DX-SEED-E9E7BA46', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('M&G Correction Tape 2-Pack', 'mg-correction-tape-2-pack', 'Clean white cover-up with smooth rewind. Pack of 2.',
   (select id from public.categories where slug='stationery-study'), 299, 319, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mg-correction-tape-2-pack'), 'Standard', 'DX-SEED-486B1050', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Kangaro Stapler Plus Pins Combo', 'kangaro-stapler-plus-pins-combo', 'Heavy-duty stapler with 1000 pins included.',
   (select id from public.categories where slug='stationery-study'), 479, 499, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='kangaro-stapler-plus-pins-combo'), 'Standard', 'DX-SEED-7B9FDA78', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli 2-Hole Paper Punch', 'deli-2-hole-paper-punch', 'Sharp all-metal punch for files and assignments.',
   (select id from public.categories where slug='stationery-study'), 539, 549, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-2-hole-paper-punch'), 'Standard', 'DX-SEED-5E3A9B81', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Kores Glue Sticks 3-Pack', 'kores-glue-sticks-3-pack', 'Washable non-toxic glue for crafts. Pack of 3.',
   (select id from public.categories where slug='stationery-study'), 215, 229, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='kores-glue-sticks-3-pack'), 'Standard', 'DX-SEED-895C90B9', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Craft Scissors 17cm', 'deli-craft-scissors-17cm', 'Comfort-grip stainless scissors for paper and craft.',
   (select id from public.categories where slug='stationery-study'), 299, 319, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-craft-scissors-17cm'), 'Standard', 'DX-SEED-4A307A53', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Steel Ruler 30cm', 'deli-steel-ruler-30cm', 'Rust-proof steel scale with clear markings.',
   (select id from public.categories where slug='stationery-study'), 179, 199, true, false, false, true, '{apparel,desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-steel-ruler-30cm'), 'Standard', 'DX-SEED-98B8EBBB', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('M&G Geometry Box 8-Piece', 'mg-geometry-box-8-piece', 'Complete metal instrument set in a sturdy case.',
   (select id from public.categories where slug='stationery-study'), 359, 399, true, false, false, true, '{school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mg-geometry-box-8-piece'), 'Standard', 'DX-SEED-0CFF8FE9', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Spiral Notebook A5 200-Page', 'deli-spiral-notebook-a5-200-page', 'Thick ruled pages that survive backpack life.',
   (select id from public.categories where slug='stationery-study'), 299, 329, true, false, true, true, '{paper,school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-spiral-notebook-a5-200-page'), 'Standard', 'DX-SEED-A9A68D72', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Kraft Register A4 256-Page', 'deli-kraft-register-a4-256-page', 'Hard kraft cover register for long-term notes.',
   (select id from public.categories where slug='stationery-study'), 419, 449, true, false, false, true, '{paper,school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-kraft-register-a4-256-page'), 'Standard', 'DX-SEED-6323CE2D', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('M&G Dot-Grid Notebooks A5 Duo', 'mg-dot-grid-notebooks-a5-duo', 'Dotted pages for journals and planning. Pack of 2.',
   (select id from public.categories where slug='stationery-study'), 479, 519, true, false, true, true, '{paper,school,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mg-dot-grid-notebooks-a5-duo'), 'Standard', 'DX-SEED-1A0602D2', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Faber-Castell Drawing Book A4', 'faber-castell-drawing-book-a4', '36 thick sheets made for pencils and paints.',
   (select id from public.categories where slug='stationery-study'), 239, 259, true, false, false, true, '{paper,school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='faber-castell-drawing-book-a4'), 'Standard', 'DX-SEED-82D3EF07', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Camlin Colour Pencils 24-Set', 'camlin-colour-pencils-24-set', 'Rich break-resistant colours for art class.',
   (select id from public.categories where slug='stationery-study'), 539, 599, true, false, false, true, '{writing,art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='camlin-colour-pencils-24-set'), 'Standard', 'DX-SEED-97EA4466', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Wax Crayons 24-Set', 'deli-wax-crayons-24-set', 'Smooth bright crayons safe for young artists.',
   (select id from public.categories where slug='stationery-study'), 227, 249, true, false, false, true, '{art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-wax-crayons-24-set'), 'Standard', 'DX-SEED-6BF2FAB4', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Doms Sketch Markers 12-Set', 'doms-sketch-markers-12-set', 'Dual-tip markers with vivid alcohol ink.',
   (select id from public.categories where slug='stationery-study'), 1079, 1149, true, true, true, true, '{writing,art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='doms-sketch-markers-12-set'), 'Standard', 'DX-SEED-7B5F542E', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Faber-Castell Watercolours 24', 'faber-castell-watercolours-24', 'Brilliant washable cakes with a free brush.',
   (select id from public.categories where slug='stationery-study'), 899, 949, true, false, false, true, '{art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='faber-castell-watercolours-24'), 'Standard', 'DX-SEED-E6DCDD73', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Acrylic Paint 12 Tubes', 'deli-acrylic-paint-12-tubes', 'Creamy fast-drying colours for canvas and craft.',
   (select id from public.categories where slug='stationery-study'), 1199, 1299, true, false, false, true, '{art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-acrylic-paint-12-tubes'), 'Standard', 'DX-SEED-7ED97616', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Artist Brushes 10-Piece', 'deli-artist-brushes-10-piece', 'Round and flat brushes for every stroke.',
   (select id from public.categories where slug='stationery-study'), 479, 519, true, false, false, true, '{art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-artist-brushes-10-piece'), 'Standard', 'DX-SEED-1FD5F2E6', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Casio MJ-12DA Desktop Calculator', 'casio-mj-12da-desktop-calculator', 'Big-button 12-digit calculator for shop and study.',
   (select id from public.categories where slug='stationery-study'), 1559, 1599, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='casio-mj-12da-desktop-calculator'), 'Standard', 'DX-SEED-C95129D2', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Scientific Calculator 240-Function', 'deli-scientific-calculator-240-function', 'Exam-ready functions for SEE and Plus-Two maths.',
   (select id from public.categories where slug='stationery-study'), 1319, 1399, true, false, true, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-scientific-calculator-240-function'), 'Standard', 'DX-SEED-14D063AF', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Exam Clipboard A4 with Cover', 'exam-clipboard-a4-with-cover', 'Hardboard pad with storage for answer sheets.',
   (select id from public.categories where slug='stationery-study'), 299, 329, true, false, false, true, '{desk,school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='exam-clipboard-a4-with-cover'), 'Standard', 'DX-SEED-9AB3260E', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Expanding File 13-Pocket', 'deli-expanding-file-13-pocket', 'Rainbow dividers keep every subject sorted.',
   (select id from public.categories where slug='stationery-study'), 959, 999, true, true, true, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-expanding-file-13-pocket'), 'Standard', 'DX-SEED-49FC11DF', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('M&G Button Folders A4 5-Pack', 'mg-button-folders-a4-5-pack', 'Transparent snap folders for assignments. Pack of 5.',
   (select id from public.categories where slug='stationery-study'), 419, 449, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mg-button-folders-a4-5-pack'), 'Standard', 'DX-SEED-87B3A569', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Document Bag with Handle', 'deli-document-bag-with-handle', 'Water-resistant carrier for certificates.',
   (select id from public.categories where slug='stationery-study'), 599, 649, true, false, false, true, '{bags,travel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-document-bag-with-handle'), 'Standard', 'DX-SEED-4282D49C', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Mesh Desk Organizer', 'deli-mesh-desk-organizer', 'Six slots for pens files and stationery.',
   (select id from public.categories where slug='stationery-study'), 839, 899, true, false, false, true, '{travel,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-mesh-desk-organizer'), 'Standard', 'DX-SEED-B03509AA', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('M&G Canvas Pencil Pouch', 'mg-canvas-pencil-pouch', 'Zip pouch that fits a full geometry set.',
   (select id from public.categories where slug='stationery-study'), 359, 399, true, false, false, true, '{bags,travel,writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mg-canvas-pencil-pouch'), 'Standard', 'DX-SEED-4BAEDB7E', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Multi-Pocket Pencil Case', 'deli-multi-pocket-pencil-case', 'Three-zip case for pens tools and cards.',
   (select id from public.categories where slug='stationery-study'), 539, 579, true, false, false, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-multi-pocket-pencil-case'), 'Standard', 'DX-SEED-91D0C18A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Kores Whiteboard Markers 4-Set', 'kores-whiteboard-markers-4-set', 'Low-odour markers that wipe clean. Set of 4.',
   (select id from public.categories where slug='stationery-study'), 395, 429, true, false, false, true, '{writing,desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='kores-whiteboard-markers-4-set'), 'Standard', 'DX-SEED-5C0B061A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Exam Board A3 with Clip', 'deli-exam-board-a3-with-clip', 'Sturdy clip board built for exam halls.',
   (select id from public.categories where slug='stationery-study'), 479, 519, true, false, false, true, '{desk,school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-exam-board-a3-with-clip'), 'Standard', 'DX-SEED-B4AC9CB7', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Camlin Chart Papers 10-Sheet', 'camlin-chart-papers-10-sheet', 'Thick coloured sheets for projects. Pack of 10.',
   (select id from public.categories where slug='stationery-study'), 299, 319, true, false, false, true, '{paper,school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='camlin-chart-papers-10-sheet'), 'Standard', 'DX-SEED-CD351053', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Page Flags 5-Colour Set', 'deli-page-flags-5-colour-set', 'Neon tabs for marking textbooks fast.',
   (select id from public.categories where slug='stationery-study'), 191, 209, true, false, false, true, '{paper,school,art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-page-flags-5-colour-set'), 'Standard', 'DX-SEED-6817387D', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('M&G Binder Clips 25-Pack', 'mg-binder-clips-25-pack', 'Strong foldback clips for thick files. Pack of 25.',
   (select id from public.categories where slug='stationery-study'), 215, 239, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mg-binder-clips-25-pack'), 'Standard', 'DX-SEED-A36B7BEC', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Deli Tape Dispenser Plus 2 Rolls', 'deli-tape-dispenser-plus-2-rolls', 'Weighted holder with safe sharp cutter.',
   (select id from public.categories where slug='stationery-study'), 479, 519, true, false, false, true, '{writing,desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='deli-tape-dispenser-plus-2-rolls'), 'Standard', 'DX-SEED-FBEFCDC9', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Faber-Castell Eraser Sharpener Duo', 'faber-castell-eraser-sharpener-duo', 'Dust-free eraser plus double-hole sharpener.',
   (select id from public.categories where slug='stationery-study'), 119, 139, true, false, false, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='faber-castell-eraser-sharpener-duo'), 'Standard', 'DX-SEED-AA397536', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Ultima Boom 211 TWS Earbuds', 'ultima-boom-211-tws-earbuds', 'Deep-bass buds with long playtime for campus days.',
   (select id from public.categories where slug='tech-accessories'), 3359, 3499, true, true, true, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ultima-boom-211-tws-earbuds'), 'Standard', 'DX-SEED-06B01E06', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Redmi Buds Basic 2', 'redmi-buds-basic-2', 'Lightweight Bluetooth buds with clear calls.',
   (select id from public.categories where slug='tech-accessories'), 2279, 2499, true, false, true, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='redmi-buds-basic-2'), 'Standard', 'DX-SEED-660F1ADC', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Anker Soundcore P20i Earbuds', 'anker-soundcore-p20i-earbuds', 'Punchy bass and 30-hour case battery.',
   (select id from public.categories where slug='tech-accessories'), 3599, 3999, true, true, true, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='anker-soundcore-p20i-earbuds'), 'Standard', 'DX-SEED-3093F53B', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Boat Airdopes 161 TWS', 'boat-airdopes-161-tws', 'Everyday buds with fast charging and low latency.',
   (select id from public.categories where slug='tech-accessories'), 1799, 1999, true, false, false, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='boat-airdopes-161-tws'), 'Standard', 'DX-SEED-9B45EB17', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Oraimo SpaceBuds Neo TWS', 'oraimo-spacebuds-neo-tws', 'ENC calls and thumping 10mm drivers.',
   (select id from public.categories where slug='tech-accessories'), 2639, 2799, true, false, true, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='oraimo-spacebuds-neo-tws'), 'Standard', 'DX-SEED-335AB23F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Hoco EQ34 Plus Earbuds', 'hoco-eq34-plus-earbuds', 'Budget Bluetooth 5.4 buds with app control.',
   (select id from public.categories where slug='tech-accessories'), 1559, 1699, true, false, false, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='hoco-eq34-plus-earbuds'), 'Standard', 'DX-SEED-5A80F09D', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Lenovo HE05 Neckband', 'lenovo-he05-neckband', 'Magnetic sweat-proof buds for workouts.',
   (select id from public.categories where slug='tech-accessories'), 1439, 1599, true, false, false, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='lenovo-he05-neckband'), 'Standard', 'DX-SEED-B425364F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Remax Type-C Earphones', 'remax-type-c-earphones', 'Plug-and-play wired sound with deep bass.',
   (select id from public.categories where slug='tech-accessories'), 599, 699, true, false, false, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='remax-type-c-earphones'), 'Standard', 'DX-SEED-BFB0B5FE', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Oraimo Conch Wired Earphones', 'oraimo-conch-wired-earphones', 'Tangle-free cable with crisp call mic.',
   (select id from public.categories where slug='tech-accessories'), 479, 549, true, false, false, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='oraimo-conch-wired-earphones'), 'Standard', 'DX-SEED-CD256BF5', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Baseus 60W USB-C Cable 1m', 'baseus-60w-usb-c-cable-1m', 'Braided fast-charge cable with 6-month warranty.',
   (select id from public.categories where slug='tech-accessories'), 959, 999, true, false, true, true, '{charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='baseus-60w-usb-c-cable-1m'), 'Standard', 'DX-SEED-F26D6743', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Ugreen Braided USB-C Cable 2m', 'ugreen-braided-usb-c-cable-2m', 'Extra-long nylon cable for bed-to-desk charging.',
   (select id from public.categories where slug='tech-accessories'), 1199, 1299, true, false, false, true, '{charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ugreen-braided-usb-c-cable-2m'), 'Standard', 'DX-SEED-BC73A435', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Remax 3-in-1 Charging Cable', 'remax-3-in-1-charging-cable', 'One cable for Type-C Lightning and Micro USB.',
   (select id from public.categories where slug='tech-accessories'), 779, 849, true, false, false, true, '{charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='remax-3-in-1-charging-cable'), 'Standard', 'DX-SEED-6F5FEB7A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Aukey 100W C-to-C Cable', 'aukey-100w-c-to-c-cable', 'Heavy-gauge cable for laptops and phones.',
   (select id from public.categories where slug='tech-accessories'), 1799, 1899, true, false, false, true, '{charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='aukey-100w-c-to-c-cable'), 'Standard', 'DX-SEED-E0967CDD', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Anker 20W USB-C Charger', 'anker-20w-usb-c-charger', 'Pocket-size fast charger for phones and buds.',
   (select id from public.categories where slug='tech-accessories'), 2279, 2499, true, false, false, true, '{charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='anker-20w-usb-c-charger'), 'Standard', 'DX-SEED-CCD4CBD3', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Aukey 30W Wall Charger', 'aukey-30w-wall-charger', 'Dual-port charger with 1-year warranty.',
   (select id from public.categories where slug='tech-accessories'), 2999, 3249, true, false, false, true, '{charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='aukey-30w-wall-charger'), 'Standard', 'DX-SEED-D6087D11', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Baseus Mini Power Bank 10K', 'baseus-mini-power-bank-10k', 'Pocket power bank with digital display.',
   (select id from public.categories where slug='tech-accessories'), 3359, 3499, true, true, true, true, '{power,charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='baseus-mini-power-bank-10k'), 'Standard', 'DX-SEED-F14FB003', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Oraimo 10K Power Bank 15W', 'oraimo-10k-power-bank-15w', 'Slim fast-charge bank for two full phone charges.',
   (select id from public.categories where slug='tech-accessories'), 2759, 2899, true, false, false, true, '{power,charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='oraimo-10k-power-bank-15w'), 'Standard', 'DX-SEED-0D730490', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mi 18W Charger Plus Cable Combo', 'mi-18w-charger-plus-cable-combo', 'Official fast-charge brick with Type-C cable.',
   (select id from public.categories where slug='tech-accessories'), 1919, 1999, true, false, false, true, '{charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mi-18w-charger-plus-cable-combo'), 'Standard', 'DX-SEED-8EA73032', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Ugreen 4-Port USB Hub', 'ugreen-4-port-usb-hub', 'Turn one laptop port into four at hostel desks.',
   (select id from public.categories where slug='tech-accessories'), 1799, 1899, true, false, false, true, '{charging,laptop,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ugreen-4-port-usb-hub'), 'Standard', 'DX-SEED-BE753BC8', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('HP Wired Optical Mouse', 'hp-wired-optical-mouse', 'Precise silent-click mouse for study PCs.',
   (select id from public.categories where slug='tech-accessories'), 959, 999, true, false, false, true, '{laptop,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='hp-wired-optical-mouse'), 'Standard', 'DX-SEED-7FADF81F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Lenovo 2.4G Wireless Mouse', 'lenovo-24g-wireless-mouse', 'Lag-free wireless mouse with 12-month battery.',
   (select id from public.categories where slug='tech-accessories'), 1319, 1399, true, false, false, true, '{laptop,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='lenovo-24g-wireless-mouse'), 'Standard', 'DX-SEED-8C04C0B9', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Foldable Laptop Stand Aluminium', 'foldable-laptop-stand-aluminium', 'Ergonomic riser that cools and straightens posture.',
   (select id from public.categories where slug='tech-accessories'), 1559, 1699, true, false, false, true, '{laptop,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='foldable-laptop-stand-aluminium'), 'Standard', 'DX-SEED-14C57C65', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Baseus Adjustable Phone Stand', 'baseus-adjustable-phone-stand', 'Fold-flat stand for lectures and video calls.',
   (select id from public.categories where slug='tech-accessories'), 1079, 1149, true, false, false, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='baseus-adjustable-phone-stand'), 'Standard', 'DX-SEED-7FF5B1F7', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Ugreen 14-inch Laptop Sleeve', 'ugreen-14-inch-laptop-sleeve', 'Padded splash-proof sleeve with front pocket.',
   (select id from public.categories where slug='tech-accessories'), 1799, 1899, true, false, false, true, '{laptop,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ugreen-14-inch-laptop-sleeve'), 'Standard', 'DX-SEED-F5B01C77', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Oraimo Grip Stand Duo', 'oraimo-grip-stand-duo', 'Ring grip plus fold stand for one-hand use.',
   (select id from public.categories where slug='tech-accessories'), 479, 549, true, false, false, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='oraimo-grip-stand-duo'), 'Standard', 'DX-SEED-A2D5A048', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('SanDisk 64GB USB 3.0 Drive', 'sandisk-64gb-usb-30-drive', 'Fast thumb drive for notes movies and backups.',
   (select id from public.categories where slug='tech-accessories'), 1799, 1899, true, false, false, true, '{charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='sandisk-64gb-usb-30-drive'), 'Standard', 'DX-SEED-0387DCD7', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Samsung USB-C OTG Adapter', 'samsung-usb-c-otg-adapter', 'Plug pen drives into your phone in seconds.',
   (select id from public.categories where slug='tech-accessories'), 659, 749, true, false, false, true, '{charging,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='samsung-usb-c-otg-adapter'), 'Standard', 'DX-SEED-3787BB71', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mi Rechargeable Desk Lamp', 'mi-rechargeable-desk-lamp', 'Eye-care light with three colour modes.',
   (select id from public.categories where slug='tech-accessories'), 2159, 2299, true, false, false, true, '{charging,lighting,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mi-rechargeable-desk-lamp'), 'Standard', 'DX-SEED-DBD5385A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Ultima Nova Mini Speaker', 'ultima-nova-mini-speaker', 'Room-filling sound in a hostel-friendly size.',
   (select id from public.categories where slug='tech-accessories'), 2399, 2599, true, false, true, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ultima-nova-mini-speaker'), 'Standard', 'DX-SEED-56D566F8', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Boat 5W Stone Speaker', 'boat-5w-stone-speaker', 'Splash-proof speaker with 10-hour playtime.',
   (select id from public.categories where slug='tech-accessories'), 2999, 3199, true, false, false, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='boat-5w-stone-speaker'), 'Standard', 'DX-SEED-243F2C75', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Zebronics Thunder Headphones', 'zebronics-thunder-headphones', 'Over-ear comfort with deep bass for long sessions.',
   (select id from public.categories where slug='tech-accessories'), 2159, 2299, true, false, false, true, '{audio,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='zebronics-thunder-headphones'), 'Standard', 'DX-SEED-27804D58', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Hoco Y19 Smart Watch', 'hoco-y19-smart-watch', 'Big display with calling and health tracking.',
   (select id from public.categories where slug='tech-accessories'), 2999, 3299, true, false, false, true, '{wearable,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='hoco-y19-smart-watch'), 'Standard', 'DX-SEED-22B28670', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Oraimo Watch 5 Lite', 'oraimo-watch-5-lite', '2-inch display with wireless calling support.',
   (select id from public.categories where slug='tech-accessories'), 2399, 2699, true, true, true, true, '{wearable,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='oraimo-watch-5-lite'), 'Standard', 'DX-SEED-53274998', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Noise Twist Neckband', 'noise-twist-neckband', '140-hour standby neckband for all-week use.',
   (select id from public.categories where slug='tech-accessories'), 1679, 1799, true, false, false, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='noise-twist-neckband'), 'Standard', 'DX-SEED-C03D760E', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Baseus Encok Wired Earbuds', 'baseus-encok-wired-earbuds', 'Hi-fi wired buds with in-line controls.',
   (select id from public.categories where slug='tech-accessories'), 839, 899, true, false, false, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='baseus-encok-wired-earbuds'), 'Standard', 'DX-SEED-81F713A3', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Remax 20000mAh Power Bank', 'remax-20000mah-power-bank', 'Four phone charges for load-shedding days.',
   (select id from public.categories where slug='tech-accessories'), 3959, 4199, true, false, false, true, '{power,charging}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='remax-20000mah-power-bank'), 'Standard', 'DX-SEED-0BCD7BE4', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Anker Cable Organizer 3-Pack', 'anker-cable-organizer-3-pack', 'Silicone ties that end cable spaghetti.',
   (select id from public.categories where slug='tech-accessories'), 599, 649, true, false, false, true, '{charging,travel,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='anker-cable-organizer-3-pack'), 'Standard', 'DX-SEED-E6B4A17A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mi WiFi Extender N300', 'mi-wifi-extender-n300', 'Stretch hostel WiFi to every corner.',
   (select id from public.categories where slug='tech-accessories'), 2279, 2399, true, false, false, true, '{laptop,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mi-wifi-extender-n300'), 'Standard', 'DX-SEED-FE5F90B8', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Hoco 360 Phone Holder', 'hoco-360-phone-holder', 'Stable desk mount for study timers and reels.',
   (select id from public.categories where slug='tech-accessories'), 419, 499, true, false, false, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='hoco-360-phone-holder'), 'Standard', 'DX-SEED-57EEFF11', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Baseus Screen Cleaner Kit', 'baseus-screen-cleaner-kit', 'Spray plus microfiber for phones and laptops.',
   (select id from public.categories where slug='tech-accessories'), 539, 599, true, false, false, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='baseus-screen-cleaner-kit'), 'Standard', 'DX-SEED-8E5EEB6E', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Goldstar Classic White Sneakers', 'goldstar-classic-white-sneakers', 'Nepal''s iconic canvas sneakers. Goes with everything.',
   (select id from public.categories where slug='fashion-accessories'), 1799, 1899, true, true, true, true, '{footwear}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='goldstar-classic-white-sneakers'), 'Standard', 'DX-SEED-DAF365C4', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Goldstar Grey Running Shoes', 'goldstar-grey-running-shoes', 'Lightweight daily trainers with grippy soles.',
   (select id from public.categories where slug='fashion-accessories'), 2159, 2299, true, false, true, true, '{footwear}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='goldstar-grey-running-shoes'), 'Standard', 'DX-SEED-A95BD062', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Air-Style White Sneakers', 'air-style-white-sneakers', 'Clean court look at a student price.',
   (select id from public.categories where slug='fashion-accessories'), 1439, 1599, true, false, false, true, '{footwear}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='air-style-white-sneakers'), 'Standard', 'DX-SEED-16B2EB87', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Caliber Black Street Sneakers', 'caliber-black-street-sneakers', 'Bold street silhouette with cushioned insole.',
   (select id from public.categories where slug='fashion-accessories'), 2399, 2599, true, false, false, true, '{footwear}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='caliber-black-street-sneakers'), 'Standard', 'DX-SEED-85ED727D', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Cotton T-Shirts 3-Pack', 'cotton-t-shirts-3-pack', 'Breathable everyday tees in assorted colours.',
   (select id from public.categories where slug='fashion-accessories'), 1079, 1199, true, false, true, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='cotton-t-shirts-3-pack'), 'Standard', 'DX-SEED-8DEA3915', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Oversized Graphic Tee Ember', 'oversized-graphic-tee-ember', 'Drop-shoulder statement tee with back print.',
   (select id from public.categories where slug='fashion-accessories'), 779, 849, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='oversized-graphic-tee-ember'), 'Standard', 'DX-SEED-92E8A388', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Polo Collar Tee Navy', 'polo-collar-tee-navy', 'Smart casual polo for college and outings.',
   (select id from public.categories where slug='fashion-accessories'), 959, 999, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='polo-collar-tee-navy'), 'Standard', 'DX-SEED-86CCC9EB', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Full-Sleeve Henley Tee', 'full-sleeve-henley-tee', 'Button-placket classic for cooler evenings.',
   (select id from public.categories where slug='fashion-accessories'), 899, 949, true, false, false, true, '{laptop,mobile,apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='full-sleeve-henley-tee'), 'Standard', 'DX-SEED-454560F0', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Antipilling Hoodie Charcoal', 'antipilling-hoodie-charcoal', 'Thick fleece hoodie that never pills.',
   (select id from public.categories where slug='fashion-accessories'), 1620, 1750, true, true, true, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='antipilling-hoodie-charcoal'), 'Standard', 'DX-SEED-26A1B2DF', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Half-Zip Hoodie Black', 'half-zip-hoodie-black', 'Sporty zip neck with kangaroo pocket.',
   (select id from public.categories where slug='fashion-accessories'), 1740, 1850, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='half-zip-hoodie-black'), 'Standard', 'DX-SEED-FE638139', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Fleece Sweatshirt Dirtywash', 'fleece-sweatshirt-dirtywash', 'Vintage wash crewneck for layering season.',
   (select id from public.categories where slug='fashion-accessories'), 1380, 1499, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='fleece-sweatshirt-dirtywash'), 'Standard', 'DX-SEED-D20834DF', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Classic Wash Denim Jacket', 'classic-wash-denim-jacket', 'Timeless trucker jacket that ages well.',
   (select id from public.categories where slug='fashion-accessories'), 2759, 2899, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='classic-wash-denim-jacket'), 'Standard', 'DX-SEED-9592AB70', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Slim Stretch Jeans Indigo', 'slim-stretch-jeans-indigo', 'All-day comfort denim with flex.',
   (select id from public.categories where slug='fashion-accessories'), 2279, 2399, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='slim-stretch-jeans-indigo'), 'Standard', 'DX-SEED-527A9F52', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Olive Cargo Joggers', 'olive-cargo-joggers', 'Six-pocket utility pants with tapered fit.',
   (select id from public.categories where slug='fashion-accessories'), 1679, 1799, true, false, true, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='olive-cargo-joggers'), 'Standard', 'DX-SEED-E999810E', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Floral Cotton Kurti', 'floral-cotton-kurti', 'Breezy festive-ready kurti with pockets.',
   (select id from public.categories where slug='fashion-accessories'), 1559, 1699, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='floral-cotton-kurti'), 'Standard', 'DX-SEED-3547430C', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Summer Midi Dress', 'summer-midi-dress', 'Twirl-approved dress for sunny days.',
   (select id from public.categories where slug='fashion-accessories'), 1799, 1899, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='summer-midi-dress'), 'Standard', 'DX-SEED-C9FF8B7D', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Flannel Check Shirt', 'flannel-check-shirt', 'Soft brushed shirt for winter layering.',
   (select id from public.categories where slug='fashion-accessories'), 1319, 1399, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='flannel-check-shirt'), 'Standard', 'DX-SEED-0C68880F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('White Oxford Casual Shirt', 'white-oxford-casual-shirt', 'Crisp shirt for presentations and events.',
   (select id from public.categories where slug='fashion-accessories'), 1199, 1299, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='white-oxford-casual-shirt'), 'Standard', 'DX-SEED-A3ABCC05', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Gym Shorts 2-Pack', 'gym-shorts-2-pack', 'Quick-dry shorts for sports and home. Pack of 2.',
   (select id from public.categories where slug='fashion-accessories'), 959, 999, true, false, false, true, '{apparel,fitness}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='gym-shorts-2-pack'), 'Standard', 'DX-SEED-371A6284', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Ankle Socks 5-Pair Set', 'ankle-socks-5-pair-set', 'Cushioned socks that stay up all day. Pack of 5.',
   (select id from public.categories where slug='fashion-accessories'), 479, 549, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ankle-socks-5-pair-set'), 'Standard', 'DX-SEED-12A5C219', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Everest Embroidered Cap', 'everest-embroidered-cap', 'Six-panel cap with mountain stitch.',
   (select id from public.categories where slug='fashion-accessories'), 659, 749, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='everest-embroidered-cap'), 'Standard', 'DX-SEED-D93B9D7A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Woollen Winter Beanie', 'woollen-winter-beanie', 'Extra-warm knit for morning classes.',
   (select id from public.categories where slug='fashion-accessories'), 479, 549, true, false, false, true, '{winter,apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='woollen-winter-beanie'), 'Standard', 'DX-SEED-45589F8B', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Reversible Leather Belt', 'reversible-leather-belt', 'Black and brown in one smart buckle.',
   (select id from public.categories where slug='fashion-accessories'), 779, 849, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='reversible-leather-belt'), 'Standard', 'DX-SEED-18EB825F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Military Canvas Belt', 'military-canvas-belt', 'Tough webbing belt with metal buckle.',
   (select id from public.categories where slug='fashion-accessories'), 419, 499, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='military-canvas-belt'), 'Standard', 'DX-SEED-4FA299C3', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Tan Bifold Wallet', 'tan-bifold-wallet', 'Six cards plus cash in slim leather.',
   (select id from public.categories where slug='fashion-accessories'), 959, 1049, true, false, false, true, '{bags,travel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='tan-bifold-wallet'), 'Standard', 'DX-SEED-6E2A12F0', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Slim Card Holder', 'slim-card-holder', 'Front-pocket holder for cards and ID.',
   (select id from public.categories where slug='fashion-accessories'), 479, 549, true, false, false, true, '{mobile,games}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='slim-card-holder'), 'Standard', 'DX-SEED-AA10C4BF', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Aviator Sunglasses UV400', 'aviator-sunglasses-uv400', 'Polarized lenses with hard case included.',
   (select id from public.categories where slug='fashion-accessories'), 839, 949, true, false, true, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='aviator-sunglasses-uv400'), 'Standard', 'DX-SEED-44F4B8C5', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Retro Round Sunglasses', 'retro-round-sunglasses', 'Vintage frames with spring hinges.',
   (select id from public.categories where slug='fashion-accessories'), 659, 749, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='retro-round-sunglasses'), 'Standard', 'DX-SEED-203D8021', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('School Backpack 25L', 'school-backpack-25l', 'Padded straps plus laptop sleeve inside.',
   (select id from public.categories where slug='fashion-accessories'), 1799, 1899, true, true, true, true, '{bags,travel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='school-backpack-25l'), 'Standard', 'DX-SEED-8054E5C7', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('USB Laptop Backpack 15-inch', 'usb-laptop-backpack-15-inch', 'Anti-theft zips with outside USB charging port.',
   (select id from public.categories where slug='fashion-accessories'), 2399, 2599, true, false, false, true, '{charging,laptop,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='usb-laptop-backpack-15-inch'), 'Standard', 'DX-SEED-A83962B1', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Drawstring Gym Bag', 'drawstring-gym-bag', 'Light carry for shoes and kits.',
   (select id from public.categories where slug='fashion-accessories'), 599, 699, true, false, false, true, '{bags,travel,fitness}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='drawstring-gym-bag'), 'Standard', 'DX-SEED-04D48E03', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Leather-Strap Analog Watch', 'leather-strap-analog-watch', 'Minimal dial with genuine strap.',
   (select id from public.categories where slug='fashion-accessories'), 2159, 2299, true, false, false, true, '{wearable,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='leather-strap-analog-watch'), 'Standard', 'DX-SEED-1A8FA06E', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Digital Sports Watch', 'digital-sports-watch', 'Stopwatch alarm and 50m water resist.',
   (select id from public.categories where slug='fashion-accessories'), 1559, 1699, true, false, false, true, '{wearable,mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='digital-sports-watch'), 'Standard', 'DX-SEED-34817B0F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Bead Bracelets Set of 3', 'bead-bracelets-set-of-3', 'Stackable bands for daily wear.',
   (select id from public.categories where slug='fashion-accessories'), 359, 429, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='bead-bracelets-set-of-3'), 'Standard', 'DX-SEED-FD0C9B04', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Silver Stud Earrings 6-Pair', 'silver-stud-earrings-6-pair', 'Hypoallergenic studs for sensitive ears.',
   (select id from public.categories where slug='fashion-accessories'), 419, 499, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='silver-stud-earrings-6-pair'), 'Standard', 'DX-SEED-708BD579', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Anti-Skid Slides', 'anti-skid-slides', 'Cloud-soft sliders for home and hostel.',
   (select id from public.categories where slug='fashion-accessories'), 719, 799, true, false, false, true, '{footwear}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='anti-skid-slides'), 'Standard', 'DX-SEED-B8CCB6D5', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Comfort Flip-Flops', 'comfort-flip-flops', 'Feather-light pair with arch support.',
   (select id from public.categories where slug='fashion-accessories'), 419, 499, true, false, false, true, '{footwear}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='comfort-flip-flops'), 'Standard', 'DX-SEED-F4DD619F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Wool-Blend Winter Muffler', 'wool-blend-winter-muffler', 'Long warm wrap for foggy mornings.',
   (select id from public.categories where slug='fashion-accessories'), 539, 599, true, false, false, true, '{winter,apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='wool-blend-winter-muffler'), 'Standard', 'DX-SEED-396E5250', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Winter Gloves Touchscreen Pair', 'winter-gloves-touchscreen-pair', 'Warm knit that still works on phones.',
   (select id from public.categories where slug='fashion-accessories'), 359, 429, true, false, false, true, '{winter,apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='winter-gloves-touchscreen-pair'), 'Standard', 'DX-SEED-09D751A3', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Packable Rain Jacket', 'packable-rain-jacket', 'Folds into its own pocket for monsoon.',
   (select id from public.categories where slug='fashion-accessories'), 1919, 1999, true, false, false, true, '{apparel,outdoor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='packable-rain-jacket'), 'Standard', 'DX-SEED-828EEC6A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Steel Vacuum Flask 1L', 'steel-vacuum-flask-1l', 'Hot 12 hours and cold 24 hours steel build.',
   (select id from public.categories where slug='lifestyle-fun'), 1559, 1699, true, true, true, true, '{apparel,kitchen,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='steel-vacuum-flask-1l'), 'Standard', 'DX-SEED-45580414', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Motivational Sip Bottle 750ml', 'motivational-sip-bottle-750ml', 'Time-marked bottle that reminds you to hydrate.',
   (select id from public.categories where slug='lifestyle-fun'), 779, 849, true, false, false, true, '{kitchen}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='motivational-sip-bottle-750ml'), 'Standard', 'DX-SEED-A452080C', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Ceramic Mugs 350ml Duo', 'ceramic-mugs-350ml-duo', 'Glossy chiya-ready mugs. Pack of 2.',
   (select id from public.categories where slug='lifestyle-fun'), 659, 749, true, false, false, true, '{kitchen}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ceramic-mugs-350ml-duo'), 'Standard', 'DX-SEED-81270F6F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Colour-Changing Magic Mug', 'colour-changing-magic-mug', 'Pour hot tea and watch the print appear.',
   (select id from public.categories where slug='lifestyle-fun'), 599, 699, true, false, false, true, '{kitchen,art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='colour-changing-magic-mug'), 'Standard', 'DX-SEED-546BB9AB', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Steel Lunch Box 3-Layer', 'steel-lunch-box-3-layer', 'Leak-proof tiffin that keeps dal bhat warm.',
   (select id from public.categories where slug='lifestyle-fun'), 1079, 1149, true, false, false, true, '{apparel,kitchen}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='steel-lunch-box-3-layer'), 'Standard', 'DX-SEED-A30F13BE', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Tiffin Carrier 4-Tier Round', 'tiffin-carrier-4-tier-round', 'Classic stacked carrier for family lunches.',
   (select id from public.categories where slug='lifestyle-fun'), 1439, 1499, true, false, false, true, '{kitchen}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='tiffin-carrier-4-tier-round'), 'Standard', 'DX-SEED-5E7400E6', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Natural Canvas Tote', 'natural-canvas-tote', '16 oz carry-all for books and groceries.',
   (select id from public.categories where slug='lifestyle-fun'), 539, 599, true, false, false, true, '{bags,travel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='natural-canvas-tote'), 'Standard', 'DX-SEED-51A7D9FA', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Foldable Shopping Bag', 'foldable-shopping-bag', 'Pocket-size bag that holds 10 kg.',
   (select id from public.categories where slug='lifestyle-fun'), 299, 349, true, false, false, true, '{bags,travel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='foldable-shopping-bag'), 'Standard', 'DX-SEED-F503A661', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Windproof Auto Umbrella', 'windproof-auto-umbrella', 'One-press open built for monsoon gusts.',
   (select id from public.categories where slug='lifestyle-fun'), 1199, 1299, true, false, true, true, '{outdoor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='windproof-auto-umbrella'), 'Standard', 'DX-SEED-14561B9F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mini Capsule Umbrella', 'mini-capsule-umbrella', 'Palm-size cover for sudden showers.',
   (select id from public.categories where slug='lifestyle-fun'), 899, 949, true, false, false, true, '{accessories,outdoor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mini-capsule-umbrella'), 'Standard', 'DX-SEED-A49217DA', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('USB Fairy Lights 10m', 'usb-fairy-lights-10m', 'Warm glow for hostel rooms and Dashain.',
   (select id from public.categories where slug='lifestyle-fun'), 719, 799, true, false, true, true, '{charging,lighting,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='usb-fairy-lights-10m'), 'Standard', 'DX-SEED-7B3DB818', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('RGB LED Strip 5m Remote', 'rgb-led-strip-5m-remote', 'Music-sync backlight for desks and beds.',
   (select id from public.categories where slug='lifestyle-fun'), 1199, 1399, true, false, false, true, '{lighting,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='rgb-led-strip-5m-remote'), 'Standard', 'DX-SEED-8E10D634', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Aroma Candle Set of 3', 'aroma-candle-set-of-3', 'Sandalwood vanilla and coffee soy candles.',
   (select id from public.categories where slug='lifestyle-fun'), 959, 1049, true, false, false, true, '{decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='aroma-candle-set-of-3'), 'Standard', 'DX-SEED-E964C2B2', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('KTM Wall Posters Set of 6', 'ktm-wall-posters-set-of-6', 'Art prints of Boudha Patan and Thamel.',
   (select id from public.categories where slug='lifestyle-fun'), 839, 949, true, false, false, true, '{decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ktm-wall-posters-set-of-6'), 'Standard', 'DX-SEED-9FE2404C', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Vinyl Wall Stickers Pack', 'vinyl-wall-stickers-pack', 'Peel-and-stick decor with zero wall damage.',
   (select id from public.categories where slug='lifestyle-fun'), 479, 549, true, false, false, true, '{decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='vinyl-wall-stickers-pack'), 'Standard', 'DX-SEED-60A8D566', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Speed Cube 3x3 Magnetic', 'speed-cube-3x3-magnetic', 'Buttery turns for cubing practice.',
   (select id from public.categories where slug='lifestyle-fun'), 539, 599, true, false, false, true, '{games}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='speed-cube-3x3-magnetic'), 'Standard', 'DX-SEED-C37FC617', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Family Ludo Board Game', 'family-ludo-board-game', 'Big foldable board with chunky tokens.',
   (select id from public.categories where slug='lifestyle-fun'), 659, 749, true, false, false, true, '{games,desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='family-ludo-board-game'), 'Standard', 'DX-SEED-002635A4', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Magnetic Chess Set Foldable', 'magnetic-chess-set-foldable', 'Travel chess that survives bus rides.',
   (select id from public.categories where slug='lifestyle-fun'), 1079, 1149, true, false, true, true, '{games}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='magnetic-chess-set-foldable'), 'Standard', 'DX-SEED-F3EE984F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Waterproof Playing Cards 2-Deck', 'waterproof-playing-cards-2-deck', 'Tear-proof cards for chiya breaks. Pack of 2.',
   (select id from public.categories where slug='lifestyle-fun'), 419, 499, true, false, false, true, '{games}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='waterproof-playing-cards-2-deck'), 'Standard', 'DX-SEED-2179E19F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Dart Board 15-inch Plus Darts', 'dart-board-15-inch-plus-darts', 'Bristle board with six steel darts.',
   (select id from public.categories where slug='lifestyle-fun'), 1559, 1699, true, false, false, true, '{games,desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='dart-board-15-inch-plus-darts'), 'Standard', 'DX-SEED-8D467676', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Badminton Set 2 Rackets', 'badminton-set-2-rackets', 'Alloy rackets with shuttles and grip tape.',
   (select id from public.categories where slug='lifestyle-fun'), 1919, 1999, true, true, true, true, '{outdoor,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='badminton-set-2-rackets'), 'Standard', 'DX-SEED-30AC7856', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Pro Bearing Skipping Rope', 'pro-bearing-skipping-rope', 'Smooth ball-bearing spin for fast cardio.',
   (select id from public.categories where slug='lifestyle-fun'), 479, 549, true, false, false, true, '{fitness}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='pro-bearing-skipping-rope'), 'Standard', 'DX-SEED-BA006A9B', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Anti-Skid Yoga Mat 6mm', 'anti-skid-yoga-mat-6mm', 'Cushioned mat with carry strap.',
   (select id from public.categories where slug='lifestyle-fun'), 1559, 1699, true, false, true, true, '{fitness}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='anti-skid-yoga-mat-6mm'), 'Standard', 'DX-SEED-84C54730', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Coated Dumbbell Pair 3kg', 'coated-dumbbell-pair-3kg', 'Rust-proof pair for hostel workouts.',
   (select id from public.categories where slug='lifestyle-fun'), 1799, 1999, true, false, false, true, '{fitness}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='coated-dumbbell-pair-3kg'), 'Standard', 'DX-SEED-CAB96BB1', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Resistance Bands Set of 5', 'resistance-bands-set-of-5', 'Stackable bands from easy to beast mode.',
   (select id from public.categories where slug='lifestyle-fun'), 1079, 1149, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='resistance-bands-set-of-5'), 'Standard', 'DX-SEED-B35224A8', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Vault Piggy Bank with Lock', 'vault-piggy-bank-with-lock', 'Combination locker for Dashain dakshina.',
   (select id from public.categories where slug='lifestyle-fun'), 779, 849, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='vault-piggy-bank-with-lock'), 'Standard', 'DX-SEED-E1783DB5', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('LED Digital Alarm Clock', 'led-digital-alarm-clock', 'Mirror display with dual alarms for 6 am classes.',
   (select id from public.categories where slug='lifestyle-fun'), 959, 1049, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='led-digital-alarm-clock'), 'Standard', 'DX-SEED-1C337422', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Photo Frames 3-Pack', 'photo-frames-3-pack', '6x8 frames for desk memories. Set of 3.',
   (select id from public.categories where slug='lifestyle-fun'), 539, 599, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='photo-frames-3-pack'), 'Standard', 'DX-SEED-B3D32A02', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('KTM Charm Keychains Set of 5', 'ktm-charm-keychains-set-of-5', 'Temple and mountain metal charms.',
   (select id from public.categories where slug='lifestyle-fun'), 359, 429, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='ktm-charm-keychains-set-of-5'), 'Standard', 'DX-SEED-43462DB3', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mini Succulent Pots 3-Set', 'mini-succulent-pots-3-set', 'Live plants in ceramic pots for desks.',
   (select id from public.categories where slug='lifestyle-fun'), 719, 799, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mini-succulent-pots-3-set'), 'Standard', 'DX-SEED-370D688C', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Incense Holder Plus 20 Sticks', 'incense-holder-plus-20-sticks', 'Brass holder with sandalwood sticks.',
   (select id from public.categories where slug='lifestyle-fun'), 419, 499, true, false, false, true, '{mobile,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='incense-holder-plus-20-sticks'), 'Standard', 'DX-SEED-EFF48056', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Steel Straws 4-Set with Brush', 'steel-straws-4-set-with-brush', 'Reusable sippers with cleaning brush.',
   (select id from public.categories where slug='lifestyle-fun'), 359, 429, true, false, false, true, '{apparel,kitchen,art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='steel-straws-4-set-with-brush'), 'Standard', 'DX-SEED-E9A5E206', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Bamboo Toothbrushes 4-Pack', 'bamboo-toothbrushes-4-pack', 'Soft charcoal bristles. Pack of 4.',
   (select id from public.categories where slug='lifestyle-fun'), 299, 349, true, false, false, true, '{art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='bamboo-toothbrushes-4-pack'), 'Standard', 'DX-SEED-71C51E4C', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Cotton Handkerchiefs 6-Pack', 'cotton-handkerchiefs-6-pack', 'Soft everyday hankies. Pack of 6.',
   (select id from public.categories where slug='lifestyle-fun'), 359, 429, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='cotton-handkerchiefs-6-pack'), 'Standard', 'DX-SEED-CA2D9551', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Travel Organizer Pouch Set', 'travel-organizer-pouch-set', 'Three sizes for cables and toiletries.',
   (select id from public.categories where slug='lifestyle-fun'), 839, 949, true, false, false, true, '{bags,travel,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='travel-organizer-pouch-set'), 'Standard', 'DX-SEED-1CB1530B', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Foldable Laundry Bag Large', 'foldable-laundry-bag-large', 'Hostel laundry essential with drawstring.',
   (select id from public.categories where slug='lifestyle-fun'), 479, 549, true, false, false, true, '{bags,travel,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='foldable-laundry-bag-large'), 'Standard', 'DX-SEED-40BD0A12', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Stackable Shoe Rack 4-Tier', 'stackable-shoe-rack-4-tier', 'Holds 12 pairs in hostel corners.',
   (select id from public.categories where slug='lifestyle-fun'), 1799, 1899, true, false, false, true, '{footwear,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='stackable-shoe-rack-4-tier'), 'Standard', 'DX-SEED-3942560D', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mini Whiteboard 40cm Plus Markers', 'mini-whiteboard-40cm-plus-markers', 'Revision board with duster and 3 pens.',
   (select id from public.categories where slug='lifestyle-fun'), 959, 1049, true, false, false, true, '{writing,desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mini-whiteboard-40cm-plus-markers'), 'Standard', 'DX-SEED-1BFC173E', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Sport Frisbee 27cm', 'sport-frisbee-27cm', 'Park-ready disc with steady flight.',
   (select id from public.categories where slug='lifestyle-fun'), 539, 599, true, false, false, true, '{outdoor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='sport-frisbee-27cm'), 'Standard', 'DX-SEED-515DD758', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Tennis Cricket Balls 6-Pack', 'tennis-cricket-balls-6-pack', 'Heavy tennis balls for gully cricket. Pack of 6.',
   (select id from public.categories where slug='lifestyle-fun'), 599, 699, true, false, false, true, '{outdoor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='tennis-cricket-balls-6-pack'), 'Standard', 'DX-SEED-7248E0E1', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Zebra Mildliner Highlighters 5-Set', 'zebra-mildliner-highlighters-5-set', 'Soft-tone markers for aesthetic notes. Set of 5.',
   (select id from public.categories where slug='stationery-study'), 959, 1049, true, false, true, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='zebra-mildliner-highlighters-5-set'), 'Standard', 'DX-SEED-A536E031', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Tombow Dual Brush Pens 10-Set', 'tombow-dual-brush-pens-10-set', 'Brush plus fine tips for lettering art. Set of 10.',
   (select id from public.categories where slug='stationery-study'), 1799, 1899, true, true, true, true, '{writing,art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='tombow-dual-brush-pens-10-set'), 'Standard', 'DX-SEED-0FE8DCF5', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mini Thermal Photo Printer', 'mini-thermal-photo-printer', 'Pocket printer for stickers and study snaps. Ink-free.',
   (select id from public.categories where slug='stationery-study'), 2999, 3199, true, true, true, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mini-thermal-photo-printer'), 'Standard', 'DX-SEED-AAA84963', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Washi Tape Rolls 12-Set', 'washi-tape-rolls-12-set', 'Twelve dreamy patterns for journals. Set of 12.',
   (select id from public.categories where slug='stationery-study'), 719, 799, true, false, true, true, '{art,desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='washi-tape-rolls-12-set'), 'Standard', 'DX-SEED-27B4ADE7', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Wax Seal Stamp Kit Vintage', 'wax-seal-stamp-kit-vintage', 'Brass stamp with wax sticks and envelopes.',
   (select id from public.categories where slug='stationery-study'), 1079, 1149, true, false, false, true, '{art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='wax-seal-stamp-kit-vintage'), 'Standard', 'DX-SEED-D4AEE994', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Acrylic Marker Pens 24-Set', 'acrylic-marker-pens-24-set', 'Paint-like markers for rock art and shoes. Set of 24.',
   (select id from public.categories where slug='stationery-study'), 1319, 1399, true, false, false, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='acrylic-marker-pens-24-set'), 'Standard', 'DX-SEED-551096B9', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Muji-Style Gel Pens 9-Pack', 'muji-style-gel-pens-9-pack', 'Feather-touch 0.5mm pens in muted tones. Pack of 9.',
   (select id from public.categories where slug='stationery-study'), 659, 729, true, false, false, true, '{writing}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='muji-style-gel-pens-9-pack'), 'Standard', 'DX-SEED-76BAE2D2', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Kraft Sticky Memo Roll', 'kraft-sticky-memo-roll', 'Sticky kraft roll for lists and labels.',
   (select id from public.categories where slug='stationery-study'), 419, 459, true, false, false, true, '{paper,school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='kraft-sticky-memo-roll'), 'Standard', 'DX-SEED-5C336F86', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Foldable Bamboo Book Stand', 'foldable-bamboo-book-stand', 'Ergonomic stand that folds flat for bags.',
   (select id from public.categories where slug='stationery-study'), 899, 949, true, false, false, true, '{paper,school}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='foldable-bamboo-book-stand'), 'Standard', 'DX-SEED-039953F8', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Leather Desk Pad 60cm', 'leather-desk-pad-60cm', 'Waterproof mat that upgrades any desk.',
   (select id from public.categories where slug='stationery-study'), 1199, 1299, true, false, false, true, '{desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='leather-desk-pad-60cm'), 'Standard', 'DX-SEED-54A510B1', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Sunset Projection Lamp', 'sunset-projection-lamp', 'Golden-hour glow for room selfies.',
   (select id from public.categories where slug='tech-accessories'), 1319, 1399, true, true, true, true, '{lighting,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='sunset-projection-lamp'), 'Standard', 'DX-SEED-1F196407', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Galaxy Star Projector', 'galaxy-star-projector', 'Nebula night light with remote control.',
   (select id from public.categories where slug='tech-accessories'), 1799, 1899, true, true, true, true, '{lighting,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='galaxy-star-projector'), 'Standard', 'DX-SEED-CE9BF0FF', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('USB Mini Humidifier 300ml', 'usb-mini-humidifier-300ml', 'Cool mist plus night light for desks.',
   (select id from public.categories where slug='tech-accessories'), 1079, 1149, true, false, false, true, '{charging,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='usb-mini-humidifier-300ml'), 'Standard', 'DX-SEED-AE48CA0C', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Bluetooth Karaoke Mic', 'bluetooth-karaoke-mic', 'Echo mic with speaker for hostel parties.',
   (select id from public.categories where slug='tech-accessories'), 1559, 1649, true, false, true, true, '{audio}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='bluetooth-karaoke-mic'), 'Standard', 'DX-SEED-838F1E76', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Retro Mini Game Console 400-in-1', 'retro-mini-game-console-400-in-1', 'Classic 8-bit games on any TV.',
   (select id from public.categories where slug='tech-accessories'), 1919, 1999, true, false, false, true, '{games}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='retro-mini-game-console-400-in-1'), 'Standard', 'DX-SEED-DBB4EE6A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Magsafe Card Wallet Leather', 'magsafe-card-wallet-leather', 'Snap-on holder for 3 cards.',
   (select id from public.categories where slug='tech-accessories'), 959, 1049, true, false, true, true, '{bags,travel,games}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='magsafe-card-wallet-leather'), 'Standard', 'DX-SEED-8A313348', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Crossbody Phone Lanyard Strap', 'crossbody-phone-lanyard-strap', 'Hands-free cord in woven nylon.',
   (select id from public.categories where slug='tech-accessories'), 539, 599, true, false, false, true, '{mobile}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='crossbody-phone-lanyard-strap'), 'Standard', 'DX-SEED-F7B06D4A', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('LED Digital Wall Clock', 'led-digital-wall-clock', 'Silent big-digit clock with temperature.',
   (select id from public.categories where slug='tech-accessories'), 1319, 1399, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='led-digital-wall-clock'), 'Standard', 'DX-SEED-AF6E81CF', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('USB Portable Blender 450ml', 'usb-portable-blender-450ml', 'Charge-and-blend shakes anywhere.',
   (select id from public.categories where slug='tech-accessories'), 1439, 1499, true, false, false, true, '{charging,kitchen}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='usb-portable-blender-450ml'), 'Standard', 'DX-SEED-96C7E2B6', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Smart LED Bulb Colour E27', 'smart-led-bulb-colour-e27', 'App-controlled bulb with music sync.',
   (select id from public.categories where slug='tech-accessories'), 899, 949, true, false, false, true, '{lighting,decor,art}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='smart-led-bulb-colour-e27'), 'Standard', 'DX-SEED-33930EED', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Chunky Dad Sneakers White', 'chunky-dad-sneakers-white', 'Retro thick-sole sneakers for daily fits.',
   (select id from public.categories where slug='fashion-accessories'), 2639, 2799, true, true, true, true, '{footwear}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='chunky-dad-sneakers-white'), 'Standard', 'DX-SEED-5AF5F29B', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Baggy Wide-Leg Jeans', 'baggy-wide-leg-jeans', 'Loose Y2K denim with stacked hem.',
   (select id from public.categories where slug='fashion-accessories'), 2519, 2699, true, false, true, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='baggy-wide-leg-jeans'), 'Standard', 'DX-SEED-E8E67587', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Claw Clips Matte 12-Set', 'claw-clips-matte-12-set', 'No-crease clips in neutral shades. Set of 12.',
   (select id from public.categories where slug='fashion-accessories'), 479, 529, true, false, true, true, '{accessories,desk}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='claw-clips-matte-12-set'), 'Standard', 'DX-SEED-1DBE9A69', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Silk Scrunchies 6-Set', 'silk-scrunchies-6-set', 'Frizz-free satin bands. Pack of 6.',
   (select id from public.categories where slug='fashion-accessories'), 419, 459, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='silk-scrunchies-6-set'), 'Standard', 'DX-SEED-417ADEDA', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Reversible Bucket Hat', 'reversible-bucket-hat', 'Two prints in one summer hat.',
   (select id from public.categories where slug='fashion-accessories'), 659, 729, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='reversible-bucket-hat'), 'Standard', 'DX-SEED-9A66EDE3', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Baguette Shoulder Bag', 'baguette-shoulder-bag', '90s mini bag with adjustable strap.',
   (select id from public.categories where slug='fashion-accessories'), 1559, 1649, true, true, false, true, '{bags,travel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='baguette-shoulder-bag'), 'Standard', 'DX-SEED-7E624010', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Silver Chain Necklace', 'silver-chain-necklace', 'Tarnish-free everyday chain.',
   (select id from public.categories where slug='fashion-accessories'), 719, 779, true, false, false, true, '{accessories}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='silver-chain-necklace'), 'Standard', 'DX-SEED-66E096BC', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Varsity Jacket Wool Blend', 'varsity-jacket-wool-blend', 'Chenille patches with snap buttons.',
   (select id from public.categories where slug='fashion-accessories'), 2879, 2999, true, false, true, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='varsity-jacket-wool-blend'), 'Standard', 'DX-SEED-19650FCC', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Cargo Mini Skirt', 'cargo-mini-skirt', 'High-rise utility skirt with pockets.',
   (select id from public.categories where slug='fashion-accessories'), 1319, 1399, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='cargo-mini-skirt'), 'Standard', 'DX-SEED-7E535443', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Knit Vest Sweater', 'knit-vest-sweater', 'Grandpa-core layer for autumn fits.',
   (select id from public.categories where slug='fashion-accessories'), 1439, 1499, true, false, false, true, '{apparel}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='knit-vest-sweater'), 'Standard', 'DX-SEED-1746BF35', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Insulated Mega Tumbler 1200ml', 'insulated-mega-tumbler-1200ml', 'All-day ice mega cup with straw.',
   (select id from public.categories where slug='lifestyle-fun'), 1799, 1899, true, true, true, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='insulated-mega-tumbler-1200ml'), 'Standard', 'DX-SEED-8A168924', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Matcha Ceremony Set 4-Piece', 'matcha-ceremony-set-4-piece', 'Bowl whisk and scoop for slow mornings.',
   (select id from public.categories where slug='lifestyle-fun'), 1559, 1649, true, true, true, true, '{kitchen}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='matcha-ceremony-set-4-piece'), 'Standard', 'DX-SEED-91EC1ACC', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Crochet Tulip Bouquet', 'crochet-tulip-bouquet', 'Forever flowers that never wilt.',
   (select id from public.categories where slug='lifestyle-fun'), 839, 899, true, false, false, true, '{home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='crochet-tulip-bouquet'), 'Standard', 'DX-SEED-AEB6FC73', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mushroom Silicone Lamp', 'mushroom-silicone-lamp', 'Squishy warm night light.',
   (select id from public.categories where slug='lifestyle-fun'), 959, 1049, true, false, true, true, '{lighting,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mushroom-silicone-lamp'), 'Standard', 'DX-SEED-057D9970', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Mini Desk Vacuum USB', 'mini-desk-vacuum-usb', 'Crumb-buster for keyboards and drawers.',
   (select id from public.categories where slug='lifestyle-fun'), 779, 849, true, false, false, true, '{charging,home}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='mini-desk-vacuum-usb'), 'Standard', 'DX-SEED-3CE84F4F', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Photo Grid Wall with Clips', 'photo-grid-wall-with-clips', '20 fairy clips for memory walls.',
   (select id from public.categories where slug='lifestyle-fun'), 659, 729, true, false, false, true, '{desk,decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='photo-grid-wall-with-clips'), 'Standard', 'DX-SEED-EAE92BE4', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('DIY Boba Tea Kit', 'diy-boba-tea-kit', 'Tapioca pearls plus syrup for home cafes.',
   (select id from public.categories where slug='lifestyle-fun'), 1079, 1149, true, false, true, true, '{kitchen}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='diy-boba-tea-kit'), 'Standard', 'DX-SEED-DDA9C63D', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Overnight Oats Jars 2-Set', 'overnight-oats-jars-2-set', 'Meal-prep jars with lids and spoons. Set of 2.',
   (select id from public.categories where slug='lifestyle-fun'), 719, 779, true, false, false, true, '{kitchen}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='overnight-oats-jars-2-set'), 'Standard', 'DX-SEED-A75B72FD', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Waterproof Picnic Mat', 'waterproof-picnic-mat', 'Sand-proof fold mat for yards and trips.',
   (select id from public.categories where slug='lifestyle-fun'), 1019, 1099, true, false, false, true, '{fitness,outdoor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='waterproof-picnic-mat'), 'Standard', 'DX-SEED-2E1AF615', 25)
on conflict (sku) do nothing;
insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values
  ('Waterfall Incense Burner', 'waterfall-incense-burner', 'Smoky cascade cone burner for calm corners.',
   (select id from public.categories where slug='lifestyle-fun'), 899, 949, true, false, false, true, '{decor}')
on conflict (slug) do nothing;
insert into public.product_variants (product_id, name, sku, stock) values
  ((select id from public.products where slug='waterfall-incense-burner'), 'Standard', 'DX-SEED-608B31FC', 25)
on conflict (sku) do nothing;
