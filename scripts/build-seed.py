#!/usr/bin/env python3
"""Build supabase/migrations/008_catalog_seed.sql from lists/starter-products.csv.

- Tags come ONLY from src/lib/tags.ts vocabulary (keyword rules, max 3).
- One default 'Standard' variant (stock 25) per product so imports are buyable.
- Idempotent: on conflict do nothing everywhere.
"""
import csv
import hashlib
import re
import sys

CSV_PATH = 'lists/starter-products.csv'
OUT_PATH = 'supabase/migrations/008_catalog_seed.sql'
BACKFILL_PATH = 'supabase/migrations/017_product_specs.sql'

VOCAB = {'writing', 'paper', 'art', 'desk', 'school', 'audio', 'charging',
         'power', 'mobile', 'laptop', 'wearable', 'apparel', 'footwear',
         'winter', 'bags', 'accessories', 'home', 'decor', 'lighting',
         'kitchen', 'fitness', 'outdoor', 'games', 'travel'}

FALLBACK = {'stationery-study': 'school', 'tech-accessories': 'mobile',
            'fashion-accessories': 'apparel', 'lifestyle-fun': 'home'}

# Ordered (pattern, tags). First matches win, capped at 3 per product.
RULES = [
    (r'earbud|speaker|\bmic\b|headphone|neckband|karaoke', ['audio']),
    (r'power bank|powerbank|battery', ['power', 'charging']),
    (r'watch', ['wearable', 'mobile']),
    (r'charg|cable|usb', ['charging']),
    (r'laptop|sleeve|mouse|\bhub\b|extender', ['laptop', 'mobile']),
    (r'phone|grip|holder|lanyard|\botg\b', ['mobile']),
    (r'lamp|fairy|strip|projector|bulb|lantern|galaxy|sunset', ['lighting', 'decor']),
    (r'hoodie|tee|shirt|jean|jacket|dress|kurti|sweater|jogger|short|skirt|vest|sweatshirt|t-shirt|sock', ['apparel']),
    (r'sneaker|shoe|slide|flip-flop', ['footwear']),
    (r'beanie|glove|muffler|\bwinter\b', ['winter', 'apparel']),
    (r'backpack|tote|pouch|wallet|\bbag\b', ['bags', 'travel']),
    (r'cap|sunglass|belt|bracelet|earring|necklace|scrunchie|claw|hat', ['accessories']),
    (r'bottle|mug|flask|lunch|tiffin|straw|oats|boba|matcha|blender', ['kitchen']),
    (r'yoga|dumbbell|rope|\bband\b|skipping|\bgym\b|\bmat\b', ['fitness']),
    (r'umbrella|picnic|frisbee|cricket|badminton|rain', ['outdoor']),
    (r'game|chess|ludo|cube|dart|card|console', ['games']),
    (r'travel|laundry|organizer', ['travel', 'home']),
    (r'notebook|diary|register|memo|flag|chart|\bbook\b', ['paper', 'school']),
    (r'pen|pencil|marker|highlighter', ['writing']),
    (r'paint|brush|sketch|crayon|colour|washi|seal', ['art']),
    (r'calculator|clip|file|folder|tape|stapler|punch|printer|board|pad|ruler|scissor|glue', ['desk']),
    (r'exam|geometry', ['school']),
    (r'clock|frame|rack|vacuum|humidifier|plant|\bpot\b', ['home']),
    (r'candle|poster|sticker|incense|grid|mirror', ['decor']),
]


def tags_for(name: str, category: str) -> list:
    text = name.lower()
    found: list = []
    for pattern, tags in RULES:
        if re.search(pattern, text):
            for t in tags:
                if t not in found:
                    found.append(t)
                if len(found) >= 3:
                    return found
    if not found:
        found.append(FALLBACK[category])
    assert all(t in VOCAB for t in found), found
    return found[:3]


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


BRAND_TOKENS = [
    'Faber-Castell', 'Soundcore', 'Stabilo', 'Staedtler', 'Faber',
    'Deli', 'Camlin', 'Doms', 'Cello', 'Kores', 'Kangaro', 'Casio',
    'Apsara', 'Tombow', 'Zebra', 'M&G', 'Anker', 'Baseus', 'Oraimo',
    'Ugreen', 'Aukey', 'Ultima', 'Boat', 'Noise', 'Redmi', 'Xiaomi',
    'Hoco', 'Remax', 'Lenovo', 'SanDisk', 'Samsung', 'Zebronics',
    'Goldstar', 'Caliber', 'HP', 'Dell', 'Mi',
]


def brand_for(name: str) -> str:
    for b in BRAND_TOKENS:
        if re.search(r'\b' + re.escape(b) + r'\b', name, re.I):
            return 'Anker' if b == 'Soundcore' else b
    return 'No Brand'


def pack_of(name: str, default: str = '1') -> str:
    m = re.search(r'(\d+)\s*[- ]?(?:pack|set|piece|deck|pair|roll|tube|sheet|pad)s?\b', name, re.I)
    return m.group(1) if m else default


def specs_for(name: str, category: str, i: int) -> dict:
    """Per-product specs: brand + physical details varying by product."""
    n = name.lower()
    s: dict = {'brand': brand_for(name)}
    g = lambda base, spread=0: f'{base + (i * 37 % (spread + 1) if spread else 0)} g'
    if category == 'stationery-study':
        if re.search(r'notebook|register|diary|drawing|chart|book|pad\b|memo', n):
            size = 'A4' if 'a4' in n else 'A5'
            s.update({'size': size, 'pages': str(100 + (i * 20 % 160)), 'paper': '80 GSM',
                       'weight': g(120, 120)})
        elif re.search(r'pen|pencil|marker|highlighter|crayon|brush', n):
            s.update({'tip': '0.5 mm' if 'gel' in n else ('HB' if 'pencil' in n else '2 mm'),
                       'pack_size': pack_of(name), 'weight': g(18, 40)})
        elif 'calculator' in n:
            s.update({'functions': '240' if 'scientific' in n else '12-digit',
                       'power': 'Solar + battery', 'weight': g(90, 60)})
        elif re.search(r'printer', n):
            s.update({'print_width': '58 mm', 'connectivity': 'Bluetooth', 'weight': g(160, 60)})
        else:
            s.update({'material': 'PP plastic' if re.search(r'file|folder|clip|tape|punch|stapler', n)
                      else ('Canvas' if 'pouch' in n or 'bag' in n else 'Metal + plastic'),
                       'weight': g(80, 200)})
    elif category == 'tech-accessories':
        if re.search(r'earbud|headphone|neckband|speaker|mic\b|karaoke', n):
            s.update({'driver': '13 mm' if 'headphone' in n else '10 mm',
                       'battery': f'{18 + (i * 5 % 22)} h playtime',
                       'bluetooth': '5.3', 'warranty': '6 months'})
        elif re.search(r'cable|charger|power bank|powerbank', n):
            if 'power bank' in n or 'powerbank' in n:
                cap = re.search(r'(\d+)\s*(k|mah)', n, re.I)
                s.update({'capacity': f"{cap.group(1)}000 mAh" if cap and len(cap.group(1)) <= 2
                          else ('20000 mAh' if '20' in n else '10000 mAh'),
                           'output': '22.5W', 'warranty': '6 months'})
            elif 'charger' in n:
                out = re.search(r'(\d+)\s*w', n, re.I)
                s.update({'output': f"{out.group(1)}W" if out else '20W', 'ports': '2',
                           'warranty': '12 months'})
            else:
                length = re.search(r'(\d+(?:\.\d+)?)\s*m\b', n)
                s.update({'length': f"{length.group(1)} m" if length else '1 m',
                           'output': '100W' if '100w' in n else '60W'})
        elif 'watch' in n:
            s.update({'display': '2.0 inch', 'battery': '7 days standby',
                       'water_resistance': 'IP67', 'warranty': '12 months'})
        elif re.search(r'lamp|projector|bulb|humidifier', n):
            s.update({'power': 'USB 5V', 'modes': '3',
                       'weight': g(220, 180)})
        else:
            s.update({'compatibility': 'Universal', 'material': 'ABS + aluminium',
                       'warranty': '6 months', 'weight': g(60, 160)})
    elif category == 'fashion-accessories':
        if re.search(r'sneaker|shoe|slide|flip', n):
            s.update({'upper': 'Canvas' if 'canvas' in n or 'classic' in n or 'white' in n else 'Knit + synthetic',
                       'sole': 'Anti-skid rubber', 'weight': g(620, 260)})
        elif re.search(r'hoodie|sweatshirt|jacket|vest|sweater', n):
            s.update({'material': '480 GSM fleece' if 'fleece' in n or 'hoodie' in n
                      else ('Wool blend' if 'varsity' in n or 'vest' in n or 'sweater' in n else 'Denim'),
                       'fit': 'Oversized' if 'oversized' in n else 'Regular',
                       'care': 'Machine wash cold'})
        elif re.search(r'tee|shirt|kurti|dress|jogger|jean|skirt|short', n):
            s.update({'material': '180 GSM cotton' if 'tee' in n or 'shirt' in n
                      else ('Stretch denim' if 'jean' in n else 'Cotton blend'),
                       'fit': 'Slim' if 'slim' in n else ('Loose' if 'baggy' in n or 'oversized' in n else 'Regular'),
                       'care': 'Machine wash cold'})
        elif re.search(r'backpack|bag\b|tote', n):
            s.update({'capacity': '25 L' if 'backpack' in n or '25l' in n else '12 L',
                       'material': 'Water-resistant polyester', 'weight': g(480, 320)})
        elif re.search(r'watch', n):
            s.update({'movement': 'Quartz', 'strap': 'Genuine leather' if 'leather' in n else 'Silicone',
                       'water_resistance': '3 ATM'})
        else:
            s.update({'material': 'Cotton blend' if re.search(r'sock|beanie|muffler|glove', n)
                      else ('Metal alloy' if re.search(r'chain|bracelet|earring', n)
                      else ('UV400 polycarbonate' if 'sunglass' in n else 'Mixed materials')),
                       'care': 'Wipe clean'})
    else:  # lifestyle-fun
        cap = re.search(r'(\d+(?:\.\d+)?)\s*(l|ml|cm|m\b)', n, re.I)
        if re.search(r'bottle|flask|tumbler|mug|sip', n):
            s.update({'capacity': f"{cap.group(1)} {cap.group(2).upper()}" if cap else '750 ml',
                       'material': 'SS304 stainless steel' if re.search(r'steel|flask|tumbler|vacuum', n) else 'Ceramic',
                       'insulation': '12 h hot / 24 h cold' if re.search(r'flask|tumbler|vacuum', n) else 'Hand wash'})
        elif re.search(r'game|chess|ludo|cube|dart|card|console', n):
            s.update({'players': '2-4' if re.search(r'ludo|chess|card', n) else '1+',
                       'material': 'Tournament-grade plastic + wood'})
        elif re.search(r'mat|rope|band|dumbbell|yoga', n):
            s.update({'material': 'TPE' if 'mat' in n else ('Coated iron' if 'dumbbell' in n else 'Latex'),
                       'weight': '1.5 kg' if 'dumbbell' in n else g(300, 500)})
        else:
            s.update({'material': 'Mixed materials',
                       'dimensions': f"{cap.group(1)} {cap.group(2)}" if cap else 'Standard',
                       'care': 'Wipe clean'})
    # Cap key count so the specs card stays scannable (brand + 4 max).
    keys = ['brand'] + [k for k in s if k != 'brand'][:4]
    return {k: s[k] for k in keys}


def main() -> None:
    with open(CSV_PATH, encoding='utf-8') as f:
        rows = list(csv.reader(f))
    header, data = rows[0], rows[1:]
    assert len(data) == 200, len(data)
    lines = [
        '-- DropX 2.0 — 008 full starter catalog (generated — do not hand-edit)',
        '-- Source: lists/starter-products.csv via scripts/build-seed.py',
        '-- 200 products (50/category) with tags + default variants. Idempotent.',
        '',
    ]
    skus = set()
    backfill = [
        '-- DropX 2.0 — 017 brand + specs backfill (generated — do not hand-edit)',
        '-- Source: lists/starter-products.csv via scripts/build-seed.py',
        '-- Fills brand + specs for catalog rows inserted by an older 008.',
        '-- Idempotent: plain UPDATEs by slug.',
        '',
    ]
    for idx, r in enumerate(data):
        import json as _json
        name, slug, desc, cat, base, comp, active, feat, trend, new = r
        tags = tags_for(name, cat)
        tag_lit = sql_str('{' + ','.join(tags) + '}')
        specs = specs_for(name, cat, idx)
        specs_lit = sql_str(_json.dumps(specs, ensure_ascii=False))
        brand_lit = sql_str(specs['brand'])
        lines.append(
            f"insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values\n"
            f"  ({sql_str(name)}, {sql_str(slug)}, {sql_str(desc)},\n"
            f"   (select id from public.categories where slug={sql_str(cat)}), {base}, {comp or 'null'}, {active}, {feat}, {trend}, {new}, {tag_lit})\n"
            f"on conflict (slug) do nothing;"
        )
        backfill.append(
            f"update public.products set brand = {brand_lit}, specs = {specs_lit}::jsonb where slug = {sql_str(slug)};"
        )
        sku = 'DX-SEED-' + hashlib.md5(slug.encode()).hexdigest()[:8].upper()
        assert sku not in skus, sku
        skus.add(sku)
        lines.append(
            f"insert into public.product_variants (product_id, name, sku, stock) values\n"
            f"  ((select id from public.products where slug={sql_str(slug)}), 'Standard', '{sku}', 25)\n"
            f"on conflict (sku) do nothing;"
        )
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f'OK: {len(data)} products + variants written to {OUT_PATH}')
    with open(BACKFILL_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(backfill) + '\n')
    print(f'OK: {len(data)} brand/specs backfills written to {BACKFILL_PATH}')


if __name__ == '__main__':
    sys.exit(main())
