"""Builds Android + iOS launcher icons from teetee.png (website owl).

Pixel / Android 8+ shrinks a plain PNG inside the launcher shape. This script
emits adaptive icons (foreground + background) so the owl can fill the circle,
and optically centers the face so it does not look like a tiny stamp.

Run:  python teachtrack-mobile/scripts/generate-launcher-icons.py
"""
import os
import shutil

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)
REPO = os.path.dirname(MOBILE)
WEB_OWL = os.path.join(REPO, 'teachtrack', 'src', 'assets', 'images', 'teetee.png')
OWL = os.path.join(MOBILE, 'assets', 'images', 'teetee.png')
RES = os.path.join(MOBILE, 'android', 'app', 'src', 'main', 'res')
IOS_ICONSET = os.path.join(
    MOBILE, 'ios', 'PulseBox', 'Images.xcassets', 'AppIcon.appiconset'
)

# Legacy bitmap sizes (pre-adaptive / fallback)
LEGACY = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
# Adaptive foreground is 108dp
ADAPTIVE_FG = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}

IOS_ICONS = {
    'Icon-App-20x20@2x.png': 40,
    'Icon-App-20x20@3x.png': 60,
    'Icon-App-29x29@2x.png': 58,
    'Icon-App-29x29@3x.png': 87,
    'Icon-App-40x40@2x.png': 80,
    'Icon-App-40x40@3x.png': 120,
    'Icon-App-60x60@2x.png': 120,
    'Icon-App-60x60@3x.png': 180,
    'ItunesArtwork@2x.png': 1024,
}

MASTER = 1024
# Adaptive mask shows ~66% of the 108dp layer. Scale the owl to that disc
# plus a little extra so it reads as large as Spotify/Teams on the home screen.
ADAPTIVE_OWL_FRAC = 0.72
LEGACY_OWL_FRAC = 0.90
CANVAS = (255, 255, 255, 255)

ADAPTIVE_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""

COLOR_XML = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
"""


def sync_source():
    if os.path.isfile(WEB_OWL):
        shutil.copy2(WEB_OWL, OWL)
        print('copied website teetee.png -> mobile assets')


def cropped_owl():
    owl = Image.open(OWL).convert('RGBA')
    bbox = owl.getbbox()
    if bbox:
        owl = owl.crop(bbox)
    return owl


def opaque_centroid(im):
    px = im.load()
    w, h = im.size
    sx = sy = n = 0
    step = 2
    for y in range(0, h, step):
        for x in range(0, w, step):
            if px[x, y][3] > 40:
                sx += x
                sy += y
                n += 1
    if n == 0:
        return w / 2, h / 2
    return sx / n, sy / n


def place_owl(owl_src, canvas_size, frac):
    """Scale owl so its longest side is frac * canvas, then optical-center it."""
    target = int(canvas_size * frac)
    ratio = target / max(owl_src.size)
    owl = owl_src.resize(
        (max(1, round(owl_src.width * ratio)), max(1, round(owl_src.height * ratio))),
        Image.LANCZOS,
    )
    cx, cy = opaque_centroid(owl)
    x = int(canvas_size / 2 - cx)
    y = int(canvas_size / 2 - cy)
    # Keep a few pixels of canvas so the mask does not shear ear tips unevenly
    pad = int(canvas_size * 0.04)
    x = min(max(x, pad - 8), canvas_size - owl.width - pad + 8)
    y = min(max(y, pad - 8), canvas_size - owl.height - pad + 8)
    layer = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    layer.alpha_composite(owl, (x, y))
    return layer


def save_resized(img, path, px):
    img.resize((px, px), Image.LANCZOS).save(path, 'PNG')


def write_text(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def main():
    sync_source()
    src = cropped_owl()

    fg = place_owl(src, MASTER, ADAPTIVE_OWL_FRAC)
    legacy_owl = place_owl(src, MASTER, LEGACY_OWL_FRAC)
    legacy_full = Image.new('RGBA', (MASTER, MASTER), CANVAS)
    legacy_full.alpha_composite(legacy_owl)

    circle_mask = Image.new('L', (MASTER, MASTER), 0)
    ImageDraw.Draw(circle_mask).ellipse((0, 0, MASTER - 1, MASTER - 1), fill=255)
    legacy_round = Image.new('RGBA', (MASTER, MASTER), (0, 0, 0, 0))
    legacy_round.paste(legacy_full, (0, 0), circle_mask)

    extra_android = [
        os.path.join(MOBILE, 'assets', 'android'),
        os.path.join(MOBILE, 'assets', 'images', 'newappicons'),
    ]

    for density, px in LEGACY.items():
        folder = os.path.join(RES, f'mipmap-{density}')
        os.makedirs(folder, exist_ok=True)
        save_resized(legacy_full, os.path.join(folder, 'ic_launcher.png'), px)
        save_resized(legacy_round, os.path.join(folder, 'ic_launcher_round.png'), px)
        save_resized(fg, os.path.join(folder, 'ic_launcher_foreground.png'), ADAPTIVE_FG[density])
        for extra in extra_android:
            dest = os.path.join(extra, f'mipmap-{density}')
            os.makedirs(dest, exist_ok=True)
            save_resized(legacy_full, os.path.join(dest, 'ic_launcher.png'), px)
        print(f'mipmap-{density}: legacy {px}px  fg {ADAPTIVE_FG[density]}px')

    anydpi = os.path.join(RES, 'mipmap-anydpi-v26')
    write_text(os.path.join(anydpi, 'ic_launcher.xml'), ADAPTIVE_XML)
    write_text(os.path.join(anydpi, 'ic_launcher_round.xml'), ADAPTIVE_XML)
    write_text(os.path.join(RES, 'values', 'ic_launcher_background.xml'), COLOR_XML)

    save_resized(legacy_full, os.path.join(MOBILE, 'assets', 'images', 'app-icon-512.png'), 512)

    if os.path.isdir(IOS_ICONSET):
        ios_full = Image.new('RGBA', (MASTER, MASTER), CANVAS)
        ios_full.alpha_composite(place_owl(src, MASTER, 0.86))
        for name, px in IOS_ICONS.items():
            save_resized(ios_full, os.path.join(IOS_ICONSET, name), px)
        print('ios AppIcon.appiconset updated')

    print('adaptive launcher icons ready (large optically-centered owl)')


if __name__ == '__main__':
    main()
