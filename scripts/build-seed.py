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
    for r in data:
        name, slug, desc, cat, base, comp, active, feat, trend, new = r
        tags = tags_for(name, cat)
        tag_lit = sql_str('{' + ','.join(tags) + '}')
        lines.append(
            f"insert into public.products (name, slug, description, category_id, base_price, compare_at_price, is_active, is_featured, is_trending, is_new, tags) values\n"
            f"  ({sql_str(name)}, {sql_str(slug)}, {sql_str(desc)},\n"
            f"   (select id from public.categories where slug={sql_str(cat)}), {base}, {comp or 'null'}, {active}, {feat}, {trend}, {new}, {tag_lit})\n"
            f"on conflict (slug) do nothing;"
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


if __name__ == '__main__':
    sys.exit(main())
