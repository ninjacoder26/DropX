#!/usr/bin/env python3
"""DropX catalog margin tool (ONE-SHOT per pricing change).

Appends any missing TRENDY_ITEMS (listed at market prices), then applies a
margin factor to EVERY row's base_price. compare_at_price is kept when it
still sits above the new base, otherwise rebuilt at +25%.

Usage:  python3 scripts/reprice.py [factor]   (default 1.2 = +20%)
Only run once per pricing change — running twice compounds the margin.
"""
import csv
import sys
from collections import Counter

PATH = 'lists/starter-products.csv'
HEADER = ['name', 'slug', 'description', 'category_slug', 'base_price',
          'compare_at_price', 'is_active', 'is_featured', 'is_trending', 'is_new']

# [name, slug, description, category, market_price, market_compare, featured, trending]
TRENDY_ITEMS = [
    # ── Stationery & Study ──
    ['Zebra Mildliner Highlighters 5-Set', 'zebra-mildliner-highlighters-5-set', 'Soft-tone markers for aesthetic notes. Set of 5.', 'stationery-study', 799, 1049, False, True],
    ['Tombow Dual Brush Pens 10-Set', 'tombow-dual-brush-pens-10-set', 'Brush plus fine tips for lettering art. Set of 10.', 'stationery-study', 1499, 1899, True, True],
    ['Mini Thermal Photo Printer', 'mini-thermal-photo-printer', 'Pocket printer for stickers and study snaps. Ink-free.', 'stationery-study', 2499, 3199, True, True],
    ['Washi Tape Rolls 12-Set', 'washi-tape-rolls-12-set', 'Twelve dreamy patterns for journals. Set of 12.', 'stationery-study', 599, 799, False, True],
    ['Wax Seal Stamp Kit Vintage', 'wax-seal-stamp-kit-vintage', 'Brass stamp with wax sticks and envelopes.', 'stationery-study', 899, 1149, False, False],
    ['Acrylic Marker Pens 24-Set', 'acrylic-marker-pens-24-set', 'Paint-like markers for rock art and shoes. Set of 24.', 'stationery-study', 1099, 1399, False, False],
    ['Muji-Style Gel Pens 9-Pack', 'muji-style-gel-pens-9-pack', 'Feather-touch 0.5mm pens in muted tones. Pack of 9.', 'stationery-study', 549, 729, False, False],
    ['Kraft Sticky Memo Roll', 'kraft-sticky-memo-roll', 'Sticky kraft roll for lists and labels.', 'stationery-study', 349, 459, False, False],
    ['Foldable Bamboo Book Stand', 'foldable-bamboo-book-stand', 'Ergonomic stand that folds flat for bags.', 'stationery-study', 749, 949, False, False],
    ['Leather Desk Pad 60cm', 'leather-desk-pad-60cm', 'Waterproof mat that upgrades any desk.', 'stationery-study', 999, 1299, False, False],
    # ── Tech & Accessories ──
    ['Sunset Projection Lamp', 'sunset-projection-lamp', 'Golden-hour glow for room selfies.', 'tech-accessories', 1099, 1399, True, True],
    ['Galaxy Star Projector', 'galaxy-star-projector', 'Nebula night light with remote control.', 'tech-accessories', 1499, 1899, True, True],
    ['USB Mini Humidifier 300ml', 'usb-mini-humidifier-300ml', 'Cool mist plus night light for desks.', 'tech-accessories', 899, 1149, False, False],
    ['Bluetooth Karaoke Mic', 'bluetooth-karaoke-mic', 'Echo mic with speaker for hostel parties.', 'tech-accessories', 1299, 1649, False, True],
    ['Retro Mini Game Console 400-in-1', 'retro-mini-game-console-400-in-1', 'Classic 8-bit games on any TV.', 'tech-accessories', 1599, 1999, False, False],
    ['Magsafe Card Wallet Leather', 'magsafe-card-wallet-leather', 'Snap-on holder for 3 cards.', 'tech-accessories', 799, 1049, False, True],
    ['Crossbody Phone Lanyard Strap', 'crossbody-phone-lanyard-strap', 'Hands-free cord in woven nylon.', 'tech-accessories', 449, 599, False, False],
    ['LED Digital Wall Clock', 'led-digital-wall-clock', 'Silent big-digit clock with temperature.', 'tech-accessories', 1099, 1399, False, False],
    ['USB Portable Blender 450ml', 'usb-portable-blender-450ml', 'Charge-and-blend shakes anywhere.', 'tech-accessories', 1199, 1499, False, False],
    ['Smart LED Bulb Colour E27', 'smart-led-bulb-colour-e27', 'App-controlled bulb with music sync.', 'tech-accessories', 749, 949, False, False],
    # ── Fashion & Accessories ──
    ['Chunky Dad Sneakers White', 'chunky-dad-sneakers-white', 'Retro thick-sole sneakers for daily fits.', 'fashion-accessories', 2199, 2799, True, True],
    ['Baggy Wide-Leg Jeans', 'baggy-wide-leg-jeans', 'Loose Y2K denim with stacked hem.', 'fashion-accessories', 2099, 2699, False, True],
    ['Claw Clips Matte 12-Set', 'claw-clips-matte-12-set', 'No-crease clips in neutral shades. Set of 12.', 'fashion-accessories', 399, 529, False, True],
    ['Silk Scrunchies 6-Set', 'silk-scrunchies-6-set', 'Frizz-free satin bands. Pack of 6.', 'fashion-accessories', 349, 459, False, False],
    ['Reversible Bucket Hat', 'reversible-bucket-hat', 'Two prints in one summer hat.', 'fashion-accessories', 549, 729, False, False],
    ['Baguette Shoulder Bag', 'baguette-shoulder-bag', '90s mini bag with adjustable strap.', 'fashion-accessories', 1299, 1649, True, False],
    ['Silver Chain Necklace', 'silver-chain-necklace', 'Tarnish-free everyday chain.', 'fashion-accessories', 599, 779, False, False],
    ['Varsity Jacket Wool Blend', 'varsity-jacket-wool-blend', 'Chenille patches with snap buttons.', 'fashion-accessories', 2399, 2999, False, True],
    ['Cargo Mini Skirt', 'cargo-mini-skirt', 'High-rise utility skirt with pockets.', 'fashion-accessories', 1099, 1399, False, False],
    ['Knit Vest Sweater', 'knit-vest-sweater', 'Grandpa-core layer for autumn fits.', 'fashion-accessories', 1199, 1499, False, False],
    # ── Lifestyle & Fun ──
    ['Insulated Mega Tumbler 1200ml', 'insulated-mega-tumbler-1200ml', 'All-day ice mega cup with straw.', 'lifestyle-fun', 1499, 1899, True, True],
    ['Matcha Ceremony Set 4-Piece', 'matcha-ceremony-set-4-piece', 'Bowl whisk and scoop for slow mornings.', 'lifestyle-fun', 1299, 1649, True, True],
    ['Crochet Tulip Bouquet', 'crochet-tulip-bouquet', 'Forever flowers that never wilt.', 'lifestyle-fun', 699, 899, False, False],
    ['Mushroom Silicone Lamp', 'mushroom-silicone-lamp', 'Squishy warm night light.', 'lifestyle-fun', 799, 1049, False, True],
    ['Mini Desk Vacuum USB', 'mini-desk-vacuum-usb', 'Crumb-buster for keyboards and drawers.', 'lifestyle-fun', 649, 849, False, False],
    ['Photo Grid Wall with Clips', 'photo-grid-wall-with-clips', '20 fairy clips for memory walls.', 'lifestyle-fun', 549, 729, False, False],
    ['DIY Boba Tea Kit', 'diy-boba-tea-kit', 'Tapioca pearls plus syrup for home cafes.', 'lifestyle-fun', 899, 1149, False, True],
    ['Overnight Oats Jars 2-Set', 'overnight-oats-jars-2-set', 'Meal-prep jars with lids and spoons. Set of 2.', 'lifestyle-fun', 599, 779, False, False],
    ['Waterproof Picnic Mat', 'waterproof-picnic-mat', 'Sand-proof fold mat for yards and trips.', 'lifestyle-fun', 849, 1099, False, False],
    ['Waterfall Incense Burner', 'waterfall-incense-burner', 'Smoky cascade cone burner for calm corners.', 'lifestyle-fun', 749, 949, False, False],
]


def main() -> None:
    factor = float(sys.argv[1]) if len(sys.argv) > 1 else 1.2
    with open(PATH, encoding='utf-8') as f:
        rows = list(csv.reader(f))
    assert rows[0] == HEADER, f'bad header: {rows[0]}'
    data = rows[1:]
    have = {r[1] for r in data}
    added = 0
    for name, slug, desc, cat, price, comp, feat, trend in TRENDY_ITEMS:
        if slug in have:
            continue
        data.append([name, slug, desc, cat, str(price), str(comp),
                     'true', str(feat).lower(), str(trend).lower(), 'true'])
        added += 1

    out = []
    for r in data:
        base = round(float(r[4]) * factor)
        comp = float(r[5])
        comp = int(comp) if comp > base else round(base * 1.25)
        r[4], r[5] = str(base), str(comp)
        out.append(r)

    # Validate like Admin → Import CSV does
    assert len(out) == 200, f'expected 200 rows, got {len(out)}'
    assert Counter(r[3] for r in out) == {
        'stationery-study': 50, 'tech-accessories': 50,
        'fashion-accessories': 50, 'lifestyle-fun': 50}, Counter(r[3] for r in out)
    slugs = [r[1] for r in out]
    assert len(set(slugs)) == 200, 'duplicate slugs'
    for r in out:
        assert len(r) == 10 and float(r[4]) >= 0 and float(r[5]) > float(r[4]), r[1]

    with open(PATH, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        w.writerows(out)
    print(f'OK: +{added} trendy items, margin x{factor} applied to {len(out)} rows.')


if __name__ == '__main__':
    main()
