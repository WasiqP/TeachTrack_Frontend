"""Builds the Android launcher icons from the TeeTee owl used on the website.

Run from the repo root:  python teachtrack-mobile/scripts/generate-launcher-icons.py
"""
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)
OWL = os.path.join(MOBILE, 'assets', 'images', 'teetee.png')
TILE = os.path.join(MOBILE, 'assets', 'images', 'teetee-purple.png')
RES = os.path.join(MOBILE, 'android', 'app', 'src', 'main', 'res')

SIZES = {'mdpi': 48, 'xhdpi': 96, 'hdpi': 72, 'xxhdpi': 144, 'xxxhdpi': 192}
MASTER = 1024
OWL_SCALE = 0.66


def tile_colour():
    tile = Image.open(TILE).convert('RGBA')
    return tile.getpixel((tile.width // 2, 200))


def owl_layer():
    owl = Image.open(OWL).convert('RGBA')
    owl = owl.crop(owl.getbbox())
    target = int(MASTER * OWL_SCALE)
    ratio = target / max(owl.size)
    owl = owl.resize((round(owl.width * ratio), round(owl.height * ratio)), Image.LANCZOS)
    layer = Image.new('RGBA', (MASTER, MASTER), (0, 0, 0, 0))
    layer.alpha_composite(owl, ((MASTER - owl.width) // 2, (MASTER - owl.height) // 2))
    return layer


def masked(colour, owl, round_shape):
    base = Image.new('RGBA', (MASTER, MASTER), colour)
    base.alpha_composite(owl)
    mask = Image.new('L', (MASTER, MASTER), 0)
    draw = ImageDraw.Draw(mask)
    if round_shape:
        draw.ellipse((0, 0, MASTER - 1, MASTER - 1), fill=255)
    else:
        draw.rounded_rectangle((0, 0, MASTER - 1, MASTER - 1), radius=int(MASTER * 0.22), fill=255)
    out = Image.new('RGBA', (MASTER, MASTER), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out


def main():
    colour = tile_colour()
    owl = owl_layer()
    square = masked(colour, owl, round_shape=False)
    circle = masked(colour, owl, round_shape=True)
    for density, px in SIZES.items():
        folder = os.path.join(RES, f'mipmap-{density}')
        os.makedirs(folder, exist_ok=True)
        square.resize((px, px), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher.png'))
        circle.resize((px, px), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher_round.png'))
        print(f'mipmap-{density}: {px}px')
    square.resize((512, 512), Image.LANCZOS).save(os.path.join(MOBILE, 'assets', 'images', 'app-icon-512.png'))
    print('tile colour', colour)


if __name__ == '__main__':
    main()
