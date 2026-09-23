-- DropX 2.0 — 025 real-brand catalog reseed
-- Wipes the generated demo catalog and reseeds 60 real branded products
-- (15 per category) of the kind sold on Daraz Nepal, with official brand
-- websites where the brand publishes one. Prices are typical Valley street
-- prices in NPR; use_custom_price=true so margin reprices never touch them.
--
-- The wipe is safe: every product FK is ON DELETE CASCADE (variants, images,
-- reviews, wishlists, carts, drop links, plan links, requests) except
-- order_items, which keeps its rows with product_id nulled — past orders
-- stay intact. Drops themselves stay; re-curate them in Admin → Drops.

alter table public.products
  add column if not exists brand_website text;

delete from public.products;

-- Category slugs stay stable — storefront, admin and filters depend on them.
insert into public.categories (name, slug, description, sort_order) values
  ('Stationery & Study', 'stationery-study', 'Notebooks, pens and desk essentials for students and makers.', 1),
  ('Tech & Accessories', 'tech-accessories', 'Cables, sleeves and everyday carry for your devices.', 2),
  ('Fashion & Accessories', 'fashion-accessories', 'Hoodies, tees, sneakers and finishing touches.', 3),
  ('Lifestyle & Fun', 'lifestyle-fun', 'Bottles, totes and things that make the day better.', 4)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.products
  (name, slug, description, category_id, base_price, compare_at_price, cost_price,
   use_custom_price, brand, brand_website, tags, specs, is_new, is_trending, is_featured)
select
  v.name, v.slug, v.description, c.id, v.base_price, v.compare_at_price, v.cost_price,
  true, v.brand, v.brand_website, v.tags::text[], v.specs::jsonb, v.is_new, v.is_trending, v.is_featured
from (values
  -- ── Stationery & Study ──
  ('Faber-Castell Classic Colour Pencils 24', 'fc-classic-24', 'Break-resistant classic colour pencils, tin of 24 — the school art-room standard.', 'stationery-study', 2250, 2600, 1650, 'Faber-Castell', 'https://www.faber-castell.com', '{art,school}', '{"model": "Classic 115824", "pieces": "24"}', true, false, true),
  ('Faber-Castell Castell 9000 Graphite Set 6', 'fc-9000-6', 'Six grades from 2B to 8B for sketching, shading and exam diagrams.', 'stationery-study', 950, null, 700, 'Faber-Castell', 'https://www.faber-castell.com', '{art,writing}', '{"model": "Castell 9000", "grades": "2B-8B"}', false, false, false),
  ('Faber-Castell Connector Pens 24', 'fc-connector-24', 'Washable connector felt-tip pens, 24 bright colours that clip together.', 'stationery-study', 1450, null, 1050, 'Faber-Castell', 'https://www.faber-castell.com', '{art,school}', '{"pieces": "24", "washable": "yes"}', false, false, false),
  ('Faber-Castell Grip Ball Pen 3-Pack', 'fc-grip-3', 'Ergonomic triangular grip pens, smooth 1.0 mm line for long exam hours.', 'stationery-study', 650, null, 480, 'Faber-Castell', 'https://www.faber-castell.com', '{writing,school}', '{"tip": "1.0 mm", "pack": "3"}', false, false, false),
  ('Camlin Scholar Geometry Box', 'camlin-geometry', 'Compass, dividers, set squares and scale in a sturdy scholar case.', 'stationery-study', 350, null, 250, 'Kokuyo Camlin', 'https://www.kokuyocamlin.com', '{school,desk}', '{"pieces": "8", "case": "metal"}', false, false, false),
  ('Camlin Watercolour Cakes 24 Shades', 'camlin-water-24', '24 rich watercolour cakes with brush — covers a full school project.', 'stationery-study', 550, null, 400, 'Kokuyo Camlin', 'https://www.kokuyocamlin.com', '{art,school}', '{"shades": "24", "brush": "included"}', false, false, false),
  ('Camlin Mechanical Pencil 0.7', 'camlin-mech-07', 'Comfort-grip 0.7 mm mechanical pencil with spare leads and eraser.', 'stationery-study', 450, null, 320, 'Kokuyo Camlin', 'https://www.kokuyocamlin.com', '{writing,school}', '{"lead": "0.7 mm"}', false, false, false),
  ('Camlin Whiteboard Markers 4-Set', 'camlin-wb-4', 'Low-odour bullet-tip markers that wipe clean off any whiteboard.', 'stationery-study', 480, null, 350, 'Kokuyo Camlin', 'https://www.kokuyocamlin.com', '{writing,school}', '{"pack": "4", "tip": "bullet"}', false, false, false),
  ('Casio fx-991ES Plus Scientific Calculator', 'casio-fx991es', '417 functions, natural textbook display — the SEE/+2 exam favourite.', 'stationery-study', 2850, 3200, 2100, 'Casio', 'https://www.casio.com', '{school,desk}', '{"model": "fx-991ES Plus", "functions": "417"}', true, true, false),
  ('Casio MJ-12D Desktop Calculator', 'casio-mj12d', 'Big 12-digit tilt display for shop counters and office desks.', 'stationery-study', 1650, null, 1200, 'Casio', 'https://www.casio.com', '{desk,school}', '{"model": "MJ-12D", "digits": "12"}', false, false, false),
  ('Deli 0.5 mm Gel Pens 6-Pack', 'deli-gel-6', 'Quick-dry black gel pens that do not smudge — six for the whole term.', 'stationery-study', 420, null, 300, 'Deli', null, '{writing,school}', '{"tip": "0.5 mm", "pack": "6"}', false, false, false),
  ('Deli A4 Spiral Notebook 200 Pages', 'deli-notebook-a4', 'Thick 80 gsm ruled pages that take gel ink without bleeding.', 'stationery-study', 380, null, 270, 'Deli', null, '{paper,school}', '{"pages": "200", "size": "A4"}', false, false, false),
  ('Deli No.12 Metal Stapler Set', 'deli-stapler-12', 'All-metal stapler with pins and remover for home-office paperwork.', 'stationery-study', 650, null, 470, 'Deli', null, '{desk,school}', '{"model": "No.12", "pins": "included"}', false, false, false),
  ('Deli Correction Tape 2-Pack', 'deli-correct-2', 'Clean one-line correction with no drying time, twin pack.', 'stationery-study', 300, null, 210, 'Deli', null, '{school,writing}', '{"pack": "2", "length": "6 m"}', false, false, false),
  ('Deli 175 mm Craft Scissors', 'deli-scissors-175', 'Sharp stainless blades with soft handles for paper and craft.', 'stationery-study', 350, null, 250, 'Deli', null, '{desk,art}', '{"length": "175 mm"}', false, false, false),
  -- ── Tech & Accessories ──
  ('Anker Soundcore R50i True Wireless Earbuds', 'anker-r50i', 'Deep-bass buds with 30-hour case playtime and fast charge.', 'tech-accessories', 4499, 5999, 3300, 'Anker', 'https://www.anker.com', '{audio,mobile}', '{"model": "R50i", "bluetooth": "5.3", "playtime": "30 h"}', true, true, true),
  ('Anker 511 Nano 30W USB-C Charger', 'anker-511-30w', 'Pocket-size 30W fast charger for phones, buds and tablets.', 'tech-accessories', 2999, null, 2200, 'Anker', 'https://www.anker.com', '{charging,power}', '{"model": "511", "output": "30W"}', false, false, false),
  ('Anker PowerCore 10000 PD', 'anker-pc10000', 'Slim 10000 mAh bank with 20W Power Delivery for phones on the move.', 'tech-accessories', 7999, 8999, 5900, 'Anker', 'https://www.anker.com', '{power,mobile}', '{"capacity": "10000 mAh", "output": "20W PD"}', false, false, false),
  ('Mi Power Bank 3i 20000 mAh', 'mi-pb3i-20000', 'Two-day 20000 mAh backup with 18W fast charge and dual output.', 'tech-accessories', 5499, 6499, 4000, 'Xiaomi', 'https://www.mi.com', '{power,mobile}', '{"model": "PB200LZM", "capacity": "20000 mAh"}', false, true, false),
  ('Mi Smart Band 8', 'mi-band-8', 'AMOLED fitness band with 150+ modes and 16-day battery.', 'tech-accessories', 6999, null, 5200, 'Xiaomi', 'https://www.mi.com', '{wearable,mobile}', '{"display": "AMOLED", "battery": "16 days"}', true, false, false),
  ('Logitech M331 Silent Plus Mouse', 'logi-m331', 'Silent clicks, 24-month battery — the library and office pick.', 'tech-accessories', 3199, null, 2350, 'Logitech', 'https://www.logitech.com', '{laptop,accessories}', '{"model": "M331", "dpi": "1000"}', false, false, false),
  ('Logitech G102 Lightsync Gaming Mouse', 'logi-g102', '8000 DPI esports sensor with RGB — Nepal''s favourite budget gaming mouse.', 'tech-accessories', 4299, 4999, 3150, 'Logitech', 'https://www.logitech.com', '{laptop}', '{"model": "G102", "dpi": "8000"}', false, true, true),
  ('Logitech K120 Wired Keyboard', 'logi-k120', 'Spill-resistant full-size keyboard with deep, quiet keys.', 'tech-accessories', 1999, null, 1450, 'Logitech', 'https://www.logitech.com', '{laptop}', '{"model": "K120", "layout": "full-size"}', false, false, false),
  ('JBL Go 3 Portable Speaker', 'jbl-go3', 'Pocket speaker with bold JBL bass and 5-hour playtime.', 'tech-accessories', 6499, 7499, 4800, 'JBL', 'https://www.jbl.com', '{audio}', '{"playtime": "5 h", "rating": "IP67"}', false, true, false),
  ('JBL Tune 510BT Headphones', 'jbl-tune510', 'Foldable on-ears with 40-hour battery and pure-bass sound.', 'tech-accessories', 7999, null, 5900, 'JBL', 'https://www.jbl.com', '{audio}', '{"battery": "40 h", "foldable": "yes"}', false, false, false),
  ('boAt Airdopes 141 TWS', 'boat-141', 'ENx clear-call buds with 42-hour case backup and low-latency mode.', 'tech-accessories', 3499, 4299, 2500, 'boAt', 'https://www.boat-lifestyle.com', '{audio,mobile}', '{"playtime": "42 h", "drivers": "8 mm"}', true, false, false),
  ('Ugreen 100W USB-C Cable 2 m', 'ugreen-100w-2m', 'Braided 100W cable that fast-charges laptops, phones and banks.', 'tech-accessories', 1499, null, 1050, 'Ugreen', 'https://www.ugreen.com', '{charging,mobile}', '{"output": "100W", "length": "2 m"}', false, false, false),
  ('Ugreen Nexode 65W GaN Charger', 'ugreen-nexode-65', 'Three-port GaN charger that powers a laptop plus two phones.', 'tech-accessories', 6999, null, 5100, 'Ugreen', 'https://www.ugreen.com', '{charging,power}', '{"output": "65W GaN", "ports": "3"}', false, false, false),
  ('Baseus Bipow 20000 mAh 20W', 'baseus-bipow-20k', 'Digital-display 20000 mAh bank with 20W USB-C fast output.', 'tech-accessories', 4999, 5799, 3600, 'Baseus', 'https://www.baseus.com', '{power,mobile}', '{"capacity": "20000 mAh", "display": "LED"}', false, false, false),
  ('Samsung 25W Travel Adapter', 'samsung-25w', 'Official 25W super-fast charger with USB-C cable in the box.', 'tech-accessories', 2799, null, 2000, 'Samsung', 'https://www.samsung.com', '{charging,mobile}', '{"output": "25W", "cable": "included"}', false, false, false),
  -- ── Fashion & Accessories ──
  ('Casio F-91W Digital Watch', 'casio-f91w', 'The indestructible classic: alarm, stopwatch and 7-year battery.', 'fashion-accessories', 3299, null, 2400, 'Casio', 'https://www.casio.com', '{accessories}', '{"model": "F-91W", "resist": "splash"}', false, true, false),
  ('Casio A158WA Vintage Silver', 'casio-a158wa', 'Retro steel digital with daily alarm — goes with everything.', 'fashion-accessories', 4799, 5499, 3500, 'Casio', 'https://www.casio.com', '{accessories}', '{"model": "A158WA", "strap": "steel"}', true, false, false),
  ('Casio MTP-V002 Leather Analog', 'casio-mtpv002', 'Slim leather analog with date window for office wear.', 'fashion-accessories', 5499, null, 4000, 'Casio', 'https://www.casio.com', '{accessories}', '{"model": "MTP-V002", "strap": "leather"}', false, false, false),
  ('Titan Analog Leather 1823SL01', 'titan-1823sl01', 'Blue-dial Titan with date and genuine leather strap.', 'fashion-accessories', 6599, null, 4900, 'Titan', 'https://www.titan.co.in', '{accessories}', '{"model": "1823SL01", "strap": "leather"}', false, false, true),
  ('Fastrack Analog Black Leather', 'fastrack-analog-blk', 'Bold black-dial Fastrack with leather strap for daily wear.', 'fashion-accessories', 4999, 5799, 3600, 'Fastrack', 'https://www.fastrack.in', '{accessories}', '{"strap": "leather", "movement": "quartz"}', false, false, false),
  ('Fastrack Reflex Vybe Band', 'fastrack-vybe', 'Slim fitness band with 10-day battery and 10 sport modes.', 'fashion-accessories', 4499, null, 3300, 'Fastrack', 'https://www.fastrack.in', '{accessories,wearable}', '{"battery": "10 days", "modes": "10"}', true, false, false),
  ('Wildcraft 45L Travel Rucksack', 'wildcraft-45l', 'Rain-covered 45L trek pack with laptop sleeve and hip belt.', 'fashion-accessories', 7999, 9499, 5800, 'Wildcraft', 'https://www.wildcraft.com', '{bags,travel}', '{"capacity": "45 L", "raincover": "yes"}', false, true, true),
  ('American Tourister Cabin Case 55 cm', 'at-cabin-55', 'Hard-shell cabin case with spinner wheels and TSA lock.', 'fashion-accessories', 11999, 13999, 8800, 'American Tourister', 'https://www.americantourister.com', '{bags,travel}', '{"size": "55 cm", "lock": "TSA"}', false, false, false),
  ('Puma Baseball Cap', 'puma-cap', 'Classic embroidered cap in breathable twill for sun and style.', 'fashion-accessories', 2499, null, 1800, 'Puma', 'https://www.puma.com', '{apparel,accessories}', '{"fit": "adjustable"}', false, false, false),
  ('Adidas Adilette Comfort Slides', 'adidas-adilette', 'Cloudfoam slides for home, hostel and post-match feet.', 'fashion-accessories', 5499, null, 4000, 'Adidas', 'https://www.adidas.com', '{footwear}', '{"cushion": "Cloudfoam"}', false, false, false),
  ('Nike Everyday Socks 3-Pack', 'nike-socks-3', 'Cushioned crew socks with arch support for daily wear.', 'fashion-accessories', 1799, null, 1300, 'Nike', 'https://www.nike.com', '{apparel,footwear}', '{"pack": "3", "length": "crew"}', false, false, false),
  ('Puma Everyday Backpack 21L', 'puma-backpack', 'Padded 21L daypack with laptop pocket for college commutes.', 'fashion-accessories', 4999, 5999, 3600, 'Puma', 'https://www.puma.com', '{bags,travel}', '{"capacity": "21 L", "sleeve": "15 inch"}', false, false, false),
  ('Titan Aviator Sunglasses', 'titan-aviator', 'UV-protected metal aviators with spring hinges.', 'fashion-accessories', 4499, null, 3300, 'Titan', 'https://www.titan.co.in', '{accessories}', '{"uv": "100%", "frame": "metal"}', true, false, false),
  ('Fastrack Wayfarer Sunglasses', 'fastrack-wayfarer', 'Retro wayfarers with shatter-resistant UV lenses.', 'fashion-accessories', 2999, null, 2200, 'Fastrack', 'https://www.fastrack.in', '{accessories}', '{"uv": "100%", "frame": "acetate"}', false, false, false),
  ('Puma Smash Leather Sneakers', 'puma-smash', 'Clean court-profile leather sneakers for everyday rotation.', 'fashion-accessories', 8999, 10499, 6600, 'Puma', 'https://www.puma.com', '{footwear}', '{"upper": "leather"}', false, true, false),
  -- ── Lifestyle & Fun ──
  ('Rubik''s 3x3 Speed Cube', 'rubiks-3x3', 'The original 3x3 with smooth speed turning and stickers that last.', 'lifestyle-fun', 1999, 2499, 1450, 'Rubik''s', 'https://www.rubiks.com', '{games}', '{"size": "3x3", "official": "yes"}', false, true, false),
  ('LEGO Classic Creative Box', 'lego-classic', '484 bricks in 35 colours — open-ended building for ages 4+.', 'lifestyle-fun', 4999, null, 3700, 'LEGO', 'https://www.lego.com', '{games}', '{"pieces": "484", "ages": "4+"}', true, false, true),
  ('UNO Card Game', 'uno-cards', '112 cards of reverses, skips and +4s — the family game-night fix.', 'lifestyle-fun', 899, null, 650, 'Mattel', 'https://www.mattel.com', '{games}', '{"cards": "112", "players": "2-10"}', false, false, false),
  ('Monopoly Classic Board Game', 'monopoly-classic', 'Buy, trade and bankrupt the family the classic way.', 'lifestyle-fun', 3499, null, 2600, 'Hasbro', 'https://www.hasbro.com', '{games}', '{"players": "2-8", "ages": "8+"}', false, false, false),
  ('Fujifilm Instax Mini Film Twin Pack', 'instax-film-2x10', '20 credit-card prints for any Instax Mini camera.', 'lifestyle-fun', 2799, null, 2050, 'Fujifilm', 'https://www.fujifilm.com', '{travel}', '{"shots": "20", "size": "mini"}', false, false, false),
  ('Govee RGB LED Strip 5 m', 'govee-strip-5m', 'App-controlled 5 m strip with music sync for room glow-ups.', 'lifestyle-fun', 3999, 4999, 2900, 'Govee', 'https://www.govee.com', '{lighting,home}', '{"length": "5 m", "app": "yes"}', true, true, false),
  ('Milton Thermosteel Flask 1L', 'milton-thermo-1l', 'Keeps chai hot 24 hours, cold 24 — leakproof steel inside out.', 'lifestyle-fun', 3299, null, 2400, 'Milton', 'https://www.milton.in', '{kitchen,travel}', '{"capacity": "1 L", "hot": "24 h"}', false, false, false),
  ('Milton Insulated Lunch Set', 'milton-lunch-set', 'Three steel containers in one insulated carrier for office tiffin.', 'lifestyle-fun', 1999, null, 1450, 'Milton', 'https://www.milton.in', '{kitchen}', '{"containers": "3", "steel": "yes"}', false, false, false),
  ('Boldfit Yoga Mat 6 mm', 'boldfit-mat-6mm', 'Anti-slip 6 mm mat with strap for home workouts and yoga.', 'lifestyle-fun', 2499, 2999, 1800, 'Boldfit', 'https://www.boldfit.com', '{fitness}', '{"thickness": "6 mm", "strap": "yes"}', false, false, false),
  ('Boldfit Skipping Rope', 'boldfit-rope', 'Adjustable ball-bearing rope for cardio anywhere.', 'lifestyle-fun', 899, null, 650, 'Boldfit', 'https://www.boldfit.com', '{fitness}', '{"bearing": "ball", "adjustable": "yes"}', false, false, false),
  ('Boldfit Resistance Bands 5-Set', 'boldfit-bands-5', 'Stackable bands from 10 to 50 lb for full-body training.', 'lifestyle-fun', 1499, null, 1100, 'Boldfit', 'https://www.boldfit.com', '{fitness}', '{"bands": "5", "range": "10-50 lb"}', false, false, false),
  ('Cello H2O Bottles 1L 2-Pack', 'cello-h2o-2', 'Two leakproof 1L bottles for fridge, desk and gym bag.', 'lifestyle-fun', 1299, null, 950, 'Cello', 'https://www.cellworld.com', '{kitchen,travel}', '{"pack": "2", "capacity": "1 L"}', false, false, false),
  ('Quechua NH100 20L Daypack', 'quechua-nh100-20', 'Padded 20L hiker with bottle holders for Shivapuri day trips.', 'lifestyle-fun', 3999, null, 2900, 'Quechua', 'https://www.decathlon.com', '{outdoor,travel}', '{"capacity": "20 L", "padded": "yes"}', true, false, false),
  ('Naturehike LED Camping Lantern', 'naturehike-lantern', 'Rechargeable warm-light lantern for load-shedding and camps.', 'lifestyle-fun', 2499, null, 1800, 'Naturehike', 'https://www.naturehike.com', '{outdoor,lighting}', '{"battery": "USB-C", "modes": "3"}', false, false, false),
  ('Philips 9W LED Bulbs 4-Pack', 'philips-led-4', 'Bright 6500K daylight bulbs that sip power — four for the house.', 'lifestyle-fun', 1499, null, 1100, 'Philips', 'https://www.philips.com', '{lighting,home}', '{"watt": "9W", "pack": "4"}', false, false, false)
) as v(name, slug, description, cat_slug, base_price, compare_at_price, cost_price, brand, brand_website, tags, specs, is_new, is_trending, is_featured)
join public.categories c on c.slug = v.cat_slug;

-- One orderable variant per product (stock lives on variants — a product
-- with no variant cannot be ordered), colour/size splits where natural.
insert into public.product_variants (product_id, name, sku, size, color, price_adjustment, stock)
select p.id, v.name, v.sku, v.size, v.color, v.price_adj, v.stock
from (values
  ('fc-classic-24', 'Standard', 'DX-STA-01', null, null, 0, 40),
  ('fc-9000-6', 'Standard', 'DX-STA-02', null, null, 0, 35),
  ('fc-connector-24', 'Standard', 'DX-STA-03', null, null, 0, 30),
  ('fc-grip-3', 'Standard', 'DX-STA-04', null, null, 0, 60),
  ('camlin-geometry', 'Standard', 'DX-STA-05', null, null, 0, 80),
  ('camlin-water-24', 'Standard', 'DX-STA-06', null, null, 0, 45),
  ('camlin-mech-07', 'Standard', 'DX-STA-07', null, null, 0, 55),
  ('camlin-wb-4', 'Standard', 'DX-STA-08', null, null, 0, 50),
  ('casio-fx991es', 'Standard', 'DX-STA-09', null, null, 0, 25),
  ('casio-mj12d', 'Standard', 'DX-STA-10', null, null, 0, 30),
  ('deli-gel-6', 'Standard', 'DX-STA-11', null, null, 0, 100),
  ('deli-notebook-a4', 'Standard', 'DX-STA-12', null, null, 0, 90),
  ('deli-stapler-12', 'Standard', 'DX-STA-13', null, null, 0, 45),
  ('deli-correct-2', 'Standard', 'DX-STA-14', null, null, 0, 70),
  ('deli-scissors-175', 'Standard', 'DX-STA-15', null, null, 0, 50),
  ('anker-r50i', 'Black', 'DX-TEC-01-BLK', null, 'Black', 0, 30),
  ('anker-r50i', 'Blue', 'DX-TEC-01-BLU', null, 'Blue', 0, 20),
  ('anker-511-30w', 'Standard', 'DX-TEC-02', null, null, 0, 35),
  ('anker-pc10000', 'Standard', 'DX-TEC-03', null, null, 0, 20),
  ('mi-pb3i-20000', 'Black', 'DX-TEC-04-BLK', null, 'Black', 0, 25),
  ('mi-band-8', 'Black', 'DX-TEC-05-BLK', null, 'Black', 0, 22),
  ('logi-m331', 'Black', 'DX-TEC-06-BLK', null, 'Black', 0, 40),
  ('logi-g102', 'Black', 'DX-TEC-07-BLK', null, 'Black', 0, 18),
  ('logi-g102', 'White', 'DX-TEC-07-WHT', null, 'White', 0, 12),
  ('logi-k120', 'Standard', 'DX-TEC-08', null, null, 0, 35),
  ('jbl-go3', 'Black', 'DX-TEC-09-BLK', null, 'Black', 0, 15),
  ('jbl-go3', 'Teal', 'DX-TEC-09-TEAL', null, 'Teal', 0, 10),
  ('jbl-tune510', 'Black', 'DX-TEC-10-BLK', null, 'Black', 0, 18),
  ('boat-141', 'Black', 'DX-TEC-11-BLK', null, 'Black', 0, 25),
  ('boat-141', 'White', 'DX-TEC-11-WHT', null, 'White', 0, 15),
  ('ugreen-100w-2m', 'Standard', 'DX-TEC-12', null, null, 0, 60),
  ('ugreen-nexode-65', 'Standard', 'DX-TEC-13', null, null, 0, 20),
  ('baseus-bipow-20k', 'Standard', 'DX-TEC-14', null, null, 0, 25),
  ('samsung-25w', 'Standard', 'DX-TEC-15', null, null, 0, 45),
  ('casio-f91w', 'Standard', 'DX-FAS-01', null, null, 0, 30),
  ('casio-a158wa', 'Standard', 'DX-FAS-02', null, null, 0, 22),
  ('casio-mtpv002', 'Standard', 'DX-FAS-03', null, null, 0, 18),
  ('titan-1823sl01', 'Standard', 'DX-FAS-04', null, null, 0, 12),
  ('fastrack-analog-blk', 'Standard', 'DX-FAS-05', null, null, 0, 15),
  ('fastrack-vybe', 'Black', 'DX-FAS-06-BLK', null, 'Black', 0, 20),
  ('wildcraft-45l', 'Black', 'DX-FAS-07-BLK', null, 'Black', 0, 10),
  ('wildcraft-45l', 'Olive', 'DX-FAS-07-OLV', null, 'Olive', 0, 8),
  ('at-cabin-55', 'Standard', 'DX-FAS-08', null, null, 0, 10),
  ('puma-cap', 'Standard', 'DX-FAS-09', null, null, 0, 40),
  ('adidas-adilette', 'UK 8', 'DX-FAS-10-8', 'UK 8', null, 0, 8),
  ('adidas-adilette', 'UK 9', 'DX-FAS-10-9', 'UK 9', null, 0, 8),
  ('adidas-adilette', 'UK 10', 'DX-FAS-10-10', 'UK 10', null, 0, 9),
  ('nike-socks-3', 'Standard', 'DX-FAS-11', null, null, 0, 50),
  ('puma-backpack', 'Standard', 'DX-FAS-12', null, null, 0, 22),
  ('titan-aviator', 'Standard', 'DX-FAS-13', null, null, 0, 18),
  ('fastrack-wayfarer', 'Standard', 'DX-FAS-14', null, null, 0, 25),
  ('puma-smash', 'UK 8', 'DX-FAS-15-8', 'UK 8', null, 0, 7),
  ('puma-smash', 'UK 9', 'DX-FAS-15-9', 'UK 9', null, 0, 7),
  ('puma-smash', 'UK 10', 'DX-FAS-15-10', 'UK 10', null, 0, 6),
  ('rubiks-3x3', 'Standard', 'DX-LIF-01', null, null, 0, 45),
  ('lego-classic', 'Standard', 'DX-LIF-02', null, null, 0, 15),
  ('uno-cards', 'Standard', 'DX-LIF-03', null, null, 0, 70),
  ('monopoly-classic', 'Standard', 'DX-LIF-04', null, null, 0, 25),
  ('instax-film-2x10', 'Standard', 'DX-LIF-05', null, null, 0, 40),
  ('govee-strip-5m', 'Standard', 'DX-LIF-06', null, null, 0, 30),
  ('milton-thermo-1l', 'Steel', 'DX-LIF-07-STL', null, 'Steel', 0, 20),
  ('milton-thermo-1l', 'Black', 'DX-LIF-07-BLK', null, 'Black', 0, 15),
  ('milton-lunch-set', 'Standard', 'DX-LIF-08', null, null, 0, 40),
  ('boldfit-mat-6mm', 'Blue', 'DX-LIF-09-BLU', null, 'Blue', 0, 18),
  ('boldfit-mat-6mm', 'Purple', 'DX-LIF-09-PUR', null, 'Purple', 0, 12),
  ('boldfit-rope', 'Standard', 'DX-LIF-10', null, null, 0, 60),
  ('boldfit-bands-5', 'Standard', 'DX-LIF-11', null, null, 0, 35),
  ('cello-h2o-2', 'Standard', 'DX-LIF-12', null, null, 0, 55),
  ('quechua-nh100-20', 'Standard', 'DX-LIF-13', null, null, 0, 25),
  ('naturehike-lantern', 'Standard', 'DX-LIF-14', null, null, 0, 30),
  ('philips-led-4', 'Standard', 'DX-LIF-15', null, null, 0, 50)
) as v(pslug, name, sku, size, color, price_adj, stock)
join public.products p on p.slug = v.pslug;
