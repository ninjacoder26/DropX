-- DropX 2.0 — 027 rich product content
-- Replaces the one-line seed copy with researched descriptions plus fuller
-- specs for all 60 catalog products (matched by slug, so it applies cleanly
-- on top of 025 and re-runs safely). Facts kept to manufacturer-published
-- specs; no invented warranties or ratings.

-- ── Stationery & Study ──
update public.products set description = 'Faber-Castell''s classic hexagonal colour pencils in a sturdy tin of 24. Break-resistant SV-bonded leads lay down smooth, blendable colour for school projects and sketchbooks, and the FSC-certified cedar sharpens cleanly without splintering.',
specs = '{"model": "Classic 115824", "pieces": "24", "shape": "hexagonal", "lead": "SV-bonded, break-resistant", "wood": "FSC-certified cedar"}'::jsonb where slug = 'fc-classic-24';
update public.products set description = 'The legendary Castell 9000 graphite pencils in six drawing grades from 2B to 8B. Top-quality graphite gives deep blacks for sketching and precise greys for technical drawing, diagrams and shading practice.',
specs = '{"model": "Castell 9000", "grades": "2B, 3B, 4B, 5B, 6B, 8B", "use": "sketching and technical drawing"}'::jsonb where slug = 'fc-9000-6';
update public.products set description = 'Washable Connector felt-tip pens in 24 bright colours with caps that clip together for building. Medium tips suit colouring, charts and classroom posters, and the ink washes out of most fabrics.',
specs = '{"pieces": "24", "tip": "medium", "washable": "yes", "caps": "connectable"}'::jsonb where slug = 'fc-connector-24';
update public.products set description = 'Ergonomic triangular Grip ball pens, three per pack, shaped to hold the fingers correctly through long exam hours. Smooth 1.0 mm black-blue line with smudge-resistant, quick-drying ink.',
specs = '{"tip": "1.0 mm", "pack": "3", "grip": "triangular ergonomic"}'::jsonb where slug = 'fc-grip-3';
update public.products set description = 'Camlin Scholar geometry box with compass, divider, set squares, protractor, scale, pencil, eraser and sharpener in a crush-resistant metal case. Everything the SEE maths syllabus needs in one box.',
specs = '{"pieces": "8+", "case": "metal", "includes": "compass, divider, set squares, protractor, scale"}'::jsonb where slug = 'camlin-geometry';
update public.products set description = 'Twenty-four vivid watercolour cakes with a brush tucked in the lid. Colours dissolve evenly with water for washes and posters, and the palette box doubles as a mixing tray.',
specs = '{"shades": "24", "brush": "included", "box": "mixing palette lid"}'::jsonb where slug = 'camlin-water-24';
update public.products set description = 'Comfort-grip 0.7 mm mechanical pencil with a steady line for writing and diagrams. Ships with spare leads and a twist eraser, so it is ready for class out of the pack.',
specs = '{"lead": "0.7 mm", "grip": "rubber comfort", "spares": "leads and eraser included"}'::jsonb where slug = 'camlin-mech-07';
update public.products set description = 'Four low-odour bullet-tip whiteboard markers in black, blue, red and green. Dense ink wipes clean off whiteboards and glass without ghosting.',
specs = '{"pack": "4 colours", "tip": "bullet", "odour": "low"}'::jsonb where slug = 'camlin-wb-4';
update public.products set description = 'The fx-991ES Plus scientific calculator with 417 functions and a natural textbook display that shows fractions and roots as written. Solar-assisted power with battery backup, approved for SEE and +2 board exams.',
specs = '{"model": "fx-991ES Plus", "functions": "417", "display": "Natural-VPAM textbook", "power": "solar with battery backup"}'::jsonb where slug = 'casio-fx991es';
update public.products set description = 'Full-size desktop calculator with a big tilted 12-digit display that reads clearly across a shop counter. Tax, discount and currency keys plus a sturdy build for daily billing.',
specs = '{"model": "MJ-12D", "digits": "12", "display": "tilted", "use": "desktop billing"}'::jsonb where slug = 'casio-mj12d';
update public.products set description = 'Six quick-dry 0.5 mm black gel pens that glide without smudging — enough for a whole term of notes. Comfortable barrel and steady ink flow from first page to last.',
specs = '{"tip": "0.5 mm", "pack": "6", "ink": "quick-dry gel"}'::jsonb where slug = 'deli-gel-6';
update public.products set description = 'A4 spiral notebook with 200 thick 80 gsm ruled pages that take gel ink without bleeding through. Sturdy covers and a lay-flat spiral survive a year in a school bag.',
specs = '{"pages": "200", "size": "A4", "paper": "80 gsm ruled"}'::jsonb where slug = 'deli-notebook-a4';
update public.products set description = 'All-metal No.12 stapler with a box of pins and a remover for home-office paperwork. Pins up to 20 sheets cleanly with a soft, low-effort press.',
specs = '{"model": "No.12", "body": "all-metal", "pins": "box included"}'::jsonb where slug = 'deli-stapler-12';
update public.products set description = 'Twin pack of one-line correction tape with instant, no-dry coverage over ballpoint and gel ink. Precise applicator tip reaches single characters.',
specs = '{"pack": "2", "length": "6 m each", "dry_time": "none"}'::jsonb where slug = 'deli-correct-2';
update public.products set description = '175 mm stainless craft scissors with soft-grip handles for paper, photos and classroom craft. Sharp, rust-resistant blades stay aligned use after use.',
specs = '{"length": "175 mm", "blades": "stainless", "handles": "soft-grip"}'::jsonb where slug = 'deli-scissors-175';

-- ── Tech & Accessories ──
update public.products set description = 'Anker Soundcore R50i true-wireless earbuds with custom 10 mm drivers for deep BassUp sound. Bluetooth 5.3, AI clear calls, IPX5 sweat resistance and 30 hours of total playtime with the pocketable case.',
specs = '{"drivers": "10 mm dynamic", "bluetooth": "5.3", "playtime": "30 h with case", "rating": "IPX5", "calls": "AI clear-call mics"}'::jsonb where slug = 'anker-r50i';
update public.products set description = 'Anker 511 Nano 30W pocket charger that fast-charges phones, buds and tablets from a single USB-C port. GaN circuitry keeps it half the size of stock bricks while running cool and safe.',
specs = '{"model": "511 Nano 3", "output": "30W USB-C", "tech": "GaN", "protection": "ActiveShield"}'::jsonb where slug = 'anker-511-30w';
update public.products set description = 'Slim 10000 mAh Anker bank with high-speed USB-C output for phones on the move — roughly two full charges for most handsets. Airline-safe capacity with surge and short-circuit protection.',
specs = '{"capacity": "10000 mAh", "output": "high-speed USB-C", "protection": "surge and short-circuit"}'::jsonb where slug = 'anker-pc10000';
update public.products set description = 'Xiaomi Power Bank 3i with a huge 20000 mAh cell, 18W fast charging and dual USB output for two devices at once. Twelve-layer circuit protection and a low-power mode for bands and buds.',
specs = '{"model": "PB200LZM", "capacity": "20000 mAh", "output": "18W dual USB", "protection": "12-layer circuit"}'::jsonb where slug = 'mi-pb3i-20000';
update public.products set description = 'Mi Smart Band 8 with a bright 1.62-inch AMOLED display, 150+ sport modes and a 16-day typical battery. Tracks heart rate, SpO2, sleep and stress, and survives swims at 5 ATM.',
specs = '{"display": "1.62 inch AMOLED", "battery": "16-day typical", "modes": "150+", "sensors": "HR, SpO2, sleep, stress", "rating": "5 ATM"}'::jsonb where slug = 'mi-band-8';
update public.products set description = 'Logitech M331 Silent Plus wireless mouse with 90%-quieter clicks, 1000 DPI precision and a 24-month battery from one AA cell. Plug-and-forget nano receiver works up to 10 metres.',
specs = '{"model": "M331", "dpi": "1000", "battery": "24 months, 1xAA", "range": "10 m", "clicks": "Silent Plus"}'::jsonb where slug = 'logi-m331';
update public.products set description = 'Logitech G102 Lightsync gaming mouse with an 8000 DPI gaming-grade sensor, customisable RGB and six programmable buttons. Nepal''s favourite budget esports mouse — accurate, light and built to click for millions of presses.',
specs = '{"model": "G102", "sensor": "up to 8000 DPI", "lighting": "LIGHTSYNC RGB", "buttons": "6 programmable"}'::jsonb where slug = 'logi-g102';
update public.products set description = 'Full-size Logitech K120 wired keyboard with deep, quiet keys and a spill-resistant design that shrugs off tea accidents. Plug-and-play USB with zero setup on any computer.',
specs = '{"model": "K120", "layout": "full-size USB", "keys": "deep-profile quiet", "spill": "resistant"}'::jsonb where slug = 'logi-k120';
update public.products set description = 'Pocket-size JBL Go 3 with 4.2W of surprisingly big JBL Pro Sound, IP67 waterproofing and 5 hours of playtime. Bluetooth 5.1, fabric finish and a carry loop — built for bags, bikes and monsoon.',
specs = '{"output": "4.2W", "bluetooth": "5.1", "playtime": "5 h", "rating": "IP67", "weight": "209 g"}'::jsonb where slug = 'jbl-go3';
update public.products set description = 'Foldable JBL Tune 510BT on-ears with 40 hours of battery, JBL Pure Bass and hands-free calls. Flat-folds into a backpack and quick-charges hours of playback in minutes.',
specs = '{"battery": "40 h", "bluetooth": "5.0", "sound": "JBL Pure Bass", "fold": "flat-folding", "calls": "hands-free"}'::jsonb where slug = 'jbl-tune510';
update public.products set description = 'boAt Airdopes 141 true-wireless buds with 8 mm drivers, 42 hours of total backup and ENx clear-call mics. ASAP fast charging and instant pairing make them a daily-driver favourite.',
specs = '{"drivers": "8 mm", "playtime": "42 h with case", "calls": "ENx mics", "charging": "ASAP fast charge", "pairing": "instant"}'::jsonb where slug = 'boat-141';
update public.products set description = 'Braided 2-metre Ugreen USB-C cable rated for 100W Power Delivery — fast-charges laptops, phones and power banks alike. Nylon jacket and reinforced necks survive bag abuse.',
specs = '{"output": "100W PD", "length": "2 m", "jacket": "braided nylon", "ports": "USB-C to USB-C"}'::jsonb where slug = 'ugreen-100w-2m';
update public.products set description = 'Ugreen Nexode 65W GaN charger with two USB-C ports plus USB-A — enough for a laptop and two phones from one wall socket. Gallium-nitride tech keeps it small and cool under load.',
specs = '{"output": "65W GaN", "ports": "2x USB-C + USB-A", "tech": "GaN II"}'::jsonb where slug = 'ugreen-nexode-65';
update public.products set description = 'Baseus Bipow 20000 mAh bank with 20W USB-C fast output and an LED percentage display, so the remaining charge is always visible. Triple output shares power across three devices.',
specs = '{"capacity": "20000 mAh", "output": "20W USB-C", "display": "LED percentage", "outputs": "3"}'::jsonb where slug = 'baseus-bipow-20k';
update public.products set description = 'Official Samsung 25W Super-Fast travel adapter with a USB-C cable in the box. Charges Galaxy phones at full Super-Fast speed and safely tops up any USB-C device.',
specs = '{"output": "25W Super-Fast", "cable": "USB-C included", "ports": "USB-C"}'::jsonb where slug = 'samsung-25w';

-- ── Fashion & Accessories ──
update public.products set description = 'The indestructible Casio F-91W digital: alarm, stopwatch, calendar and a ~7-year battery in a feather-light resin case. An icon that outlives trends — and most other watches.',
specs = '{"model": "F-91W", "battery": "approx 7 years", "features": "alarm, stopwatch, calendar", "resist": "splash-proof"}'::jsonb where slug = 'casio-f91w';
update public.products set description = 'Retro Casio A158WA with a polished stainless case and band, daily alarm and stopwatch. Slim on the wrist and sharp with everything from kurtas to blazers.',
specs = '{"model": "A158WA", "case": "stainless steel", "features": "alarm, stopwatch, calendar"}'::jsonb where slug = 'casio-a158wa';
update public.products set description = 'Slim Casio MTP-V002 analog with a clean dial, date window and genuine leather strap. Quietly formal — the office and wedding watch that never tries too hard.',
specs = '{"model": "MTP-V002", "strap": "genuine leather", "date": "yes", "style": "slim analog"}'::jsonb where slug = 'casio-mtpv002';
update public.products set description = 'Titan 1823SL01 with a deep-blue dial, date display and genuine leather strap. Quartz accuracy with Titan''s finish and service backing, boxed for gifting.',
specs = '{"model": "1823SL01", "dial": "blue with date", "strap": "genuine leather", "movement": "quartz"}'::jsonb where slug = 'titan-1823sl01';
update public.products set description = 'Bold black-dial Fastrack analog on a leather strap — young, loud and built for daily wear. Quartz movement with splash resistance for everyday life.',
specs = '{"strap": "leather", "movement": "quartz", "resist": "splash-proof", "style": "bold analog"}'::jsonb where slug = 'fastrack-analog-blk';
update public.products set description = 'Slim Fastrack Reflex Vybe fitness band tracking 10 sport modes plus heart rate, SpO2 and sleep, with a week-plus battery. Light on the wrist, loud on looks.',
specs = '{"modes": "10 sport", "sensors": "HR, SpO2, sleep", "battery": "week-plus", "faces": "100+"}'::jsonb where slug = 'fastrack-vybe';
update public.products set description = 'Wildcraft 45L travel rucksack with rain cover, padded laptop sleeve and load-balancing hip belt. Built for Annapurna circuits and semester-abroad moves alike.',
specs = '{"capacity": "45 L", "raincover": "included", "sleeve": "padded laptop", "belt": "load-balancing hip"}'::jsonb where slug = 'wildcraft-45l';
update public.products set description = 'American Tourister 55 cm hard-shell cabin case with smooth spinner wheels and a TSA lock. Scratch-tough shell sized for airline overhead bins.',
specs = '{"size": "55 cm cabin", "shell": "hard", "wheels": "4 spinner", "lock": "TSA"}'::jsonb where slug = 'at-cabin-55';
update public.products set description = 'Classic Puma baseball cap in breathable cotton twill with an embroidered cat logo. Adjustable strap fits most heads; shields sun on rides and matches.',
specs = '{"fit": "adjustable strap", "fabric": "cotton twill", "logo": "embroidered"}'::jsonb where slug = 'puma-cap';
update public.products set description = 'Adidas Adilette Comfort slides with a Cloudfoam footbed that cushions every step. Single-bandage synthetic upper dries fast — home, hostel and post-match feet sorted.',
specs = '{"sole": "Cloudfoam", "upper": "synthetic single-bandage", "use": "slides"}'::jsonb where slug = 'adidas-adilette';
update public.products set description = 'Three pairs of Nike Everyday cushioned crew socks with arch support and Dri-FIT sweat control. Reinforced heels and toes survive daily wear and wash cycles.',
specs = '{"pack": "3 pairs", "length": "crew", "fabric": "Dri-FIT cushioned", "support": "arch band"}'::jsonb where slug = 'nike-socks-3';
update public.products set description = 'Puma everyday backpack with a padded 15-inch laptop sleeve, bottle pockets and cushioned straps for college commutes. Zips and fabric built for daily overloading.',
specs = '{"sleeve": "padded 15 inch laptop", "pockets": "bottle + front", "straps": "padded"}'::jsonb where slug = 'puma-backpack';
update public.products set description = 'Titan metal aviators with full UV protection and spring hinges that flex instead of snapping. Timeless pilot shape that suits most Nepali face shapes.',
specs = '{"uv": "100% protected", "frame": "metal aviator", "hinges": "spring"}'::jsonb where slug = 'titan-aviator';
update public.products set description = 'Retro Fastrack wayfarers in acetate with shatter-resistant UV lenses. Light, bold and hard to lose — the everyday sunglasses that go with everything.',
specs = '{"uv": "100% protected", "frame": "acetate wayfarer", "lenses": "shatter-resistant"}'::jsonb where slug = 'fastrack-wayfarer';
update public.products set description = 'Puma Smash leather sneakers with a clean court profile, cushioned tongue and grippy rubber cupsole. Full-grain leather that ages well with daily rotation.',
specs = '{"upper": "full-grain leather", "sole": "rubber cupsole", "style": "court"}'::jsonb where slug = 'puma-smash';

-- ── Lifestyle & Fun ──
update public.products set description = 'The original Rubik''s 3x3 speed cube with smoother, faster turning and durable stickerless tiles. Official 56 mm tournament size — the puzzle every desk deserves.',
specs = '{"size": "3x3, 56 mm", "tiles": "stickerless", "official": "yes"}'::jsonb where slug = 'rubiks-3x3';
update public.products set description = 'LEGO Classic medium box with 484 bricks in 35 colours plus windows, doors and baseplate ideas for open-ended building. The perfect first big LEGO set for ages 4 and up.',
specs = '{"pieces": "484", "colours": "35", "ages": "4+", "play": "open-ended building"}'::jsonb where slug = 'lego-classic';
update public.products set description = '112 cards of reverses, skips, wilds and dreaded +4s — the family game-night fix that fits in a pocket. For 2 to 10 players; grudges guaranteed.',
specs = '{"cards": "112", "players": "2-10", "playtime": "15-30 min"}'::jsonb where slug = 'uno-cards';
update public.products set description = 'Monopoly Classic: buy streets, build houses, bankrupt the family the traditional way. Eight tokens, full board and paper money for 2 to 8 players, ages 8+.',
specs = '{"players": "2-8", "ages": "8+", "tokens": "8", "money": "classic paper"}'::jsonb where slug = 'monopoly-classic';
update public.products set description = 'Twin pack of Fujifilm Instax Mini film — 20 credit-card-size instant prints for any Instax Mini camera. Weddings, trips and room walls start here.',
specs = '{"shots": "20", "size": "54 x 86 mm", "fits": "all Instax Mini cameras"}'::jsonb where slug = 'instax-film-2x10';
update public.products set description = 'Five metres of app-controlled Govee RGB strip light with a built-in mic that pulses to music. Timers, dimming and millions of colours for room glow-ups and Dashain decor.',
specs = '{"length": "5 m", "control": "app + mic music sync", "features": "timer, dimming", "use": "room decor"}'::jsonb where slug = 'govee-strip-5m';
update public.products set description = 'Milton Thermosteel 1-litre flask in food-grade stainless that keeps chai hot (or water icy) for 24 hours. Leakproof, sweat-free exterior for bags and bike holders.',
specs = '{"capacity": "1 L", "keeps": "24 h hot and cold", "steel": "food-grade stainless", "leak": "proof"}'::jsonb where slug = 'milton-thermo-1l';
update public.products set description = 'Three stainless Milton containers in one insulated carrier — the office tiffin that keeps lunch warm till 1 pm. Leakproof lids survive crowded micro rides.',
specs = '{"containers": "3 stainless", "carrier": "insulated", "lids": "leakproof"}'::jsonb where slug = 'milton-lunch-set';
update public.products set description = 'Boldfit 6 mm anti-skid yoga mat with dual-texture grip and a carry strap. Thick enough for knees on concrete floors, grippy enough for power flows.',
specs = '{"thickness": "6 mm", "grip": "dual-texture anti-skid", "strap": "carry included"}'::jsonb where slug = 'boldfit-mat-6mm';
update public.products set description = 'Adjustable Boldfit skipping rope with smooth ball bearings and foam grips for cardio anywhere — terrace, park or hostel corridor. Trims to your height in seconds.',
specs = '{"bearings": "smooth ball", "grips": "foam", "length": "adjustable"}'::jsonb where slug = 'boldfit-rope';
update public.products set description = 'Five stackable Boldfit latex bands from 10 to 50 lb for full-body training without a gym. Includes handles and door anchor for presses, rows and curls.',
specs = '{"bands": "5", "range": "10-50 lb", "material": "natural latex", "kit": "handles + door anchor"}'::jsonb where slug = 'boldfit-bands-5';
update public.products set description = 'Two leakproof 1-litre Cello H2O bottles for fridge, desk and gym bag. Food-grade plastic with flip caps you can open one-handed mid-ride.',
specs = '{"pack": "2", "capacity": "1 L each", "caps": "one-hand flip", "grade": "food-safe"}'::jsonb where slug = 'cello-h2o-2';
update public.products set description = 'Quechua NH100 20-litre daypack with padded back, straps and bottle holders — sized for Shivapuri day hikes and daily college carry alike.',
specs = '{"capacity": "20 L", "back": "padded", "holders": "2 bottle", "use": "day hikes"}'::jsonb where slug = 'quechua-nh100-20';
update public.products set description = 'Rechargeable Naturehike warm-light lantern with three brightness modes for load-shedding nights and campsites. USB-C charging plus a hook for tents and wires.',
specs = '{"light": "warm LED, 3 modes", "charging": "USB-C", "mount": "hanging hook"}'::jsonb where slug = 'naturehike-lantern';
update public.products set description = 'Four Philips 9W daylight LED bulbs that brighten whole rooms while sipping power and staying cool. Standard bayonet fitting, instant full brightness.',
specs = '{"watt": "9W", "tone": "6500K daylight", "pack": "4", "fitting": "bayonet"}'::jsonb where slug = 'philips-led-4';
