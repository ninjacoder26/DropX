#!/usr/bin/env python3
"""Generate DropX PWA icons (ember rounded square + paper DX mark)."""
from PIL import Image, ImageDraw, ImageFont

EMBER = (240, 100, 39, 255)
PAPER = (247, 245, 240, 255)

FONTS = [
    '/System/Library/Fonts/Helvetica.ttc',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
]


def font_for(size: int):
    for path in FONTS:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make(size: int, path: str) -> Image.Image:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * 0.24)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=EMBER)
    f = font_for(int(size * 0.42))
    text = 'DX'
    bbox = d.textbbox((0, 0), text, font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1] - size * 0.02),
           text, font=f, fill=PAPER)
    img.convert('RGB').save(path, 'PNG')
    print('wrote', path)
    return img


if __name__ == '__main__':
    make(192, 'public/icons/icon-192.png')
    make(512, 'public/icons/icon-512.png')
    make(512, 'public/icons/icon-maskable-512.png')
    make(180, 'public/icons/apple-touch-icon.png')
    # Multi-size .ico kills the /favicon.ico console 404 on all browsers.
    fav = make(64, 'public/favicon-64.png')
    fav.save('public/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    print('wrote public/favicon.ico')
