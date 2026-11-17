# Wormsbound background pictures, step 2 of 2: FIT the raw generated pictures to the game's pixel look.
# © 2026 justaskjoe. All rights reserved.
#
# Run: python3 backgrounds.py RAW_DIR      reads RAW_DIR/<theme>.png (from gen_backgrounds.py), writes
#   ../backgrounds/<theme>.png (680 x 380, a few dozen colours: what the build inlines) and ../concepts/backgrounds.png
#
# What it does to each picture, and why:
#   - shrinks it to 680 x 380, the size the game paints its backdrop at (shown at 2x, so its pixels match the ground's);
#   - pulls its colours towards the theme's own sky colours (prototype/mapgen.js), keeping each pixel's brightness, so
#     ground and backdrop belong together and the ten themes don't all end up the same pink;
#   - dims and flattens it slightly, more towards the bottom: the backdrop must sit BEHIND the fight, never compete;
#   - cuts it to 40 colours with no dithering, which is what makes it read as pixel art, not a shrunken painting.
import json, pathlib, subprocess, sys
from PIL import Image, ImageDraw, ImageEnhance

W, H, COLOURS = 680, 380, 40
PULL = 0.38   # how far each pixel's colour moves to the theme's sky colour at that height, keeping its own brightness
here = pathlib.Path(__file__).resolve().parent


def theme_skies():
    """Each theme's four sky colours, read from the game's own theme table."""
    js = "const M=require('./mapgen.js');const o={};for(const k of M.THEME_IDS)o[k]=M.THEMES[k].look.sky;console.log(JSON.stringify(o))"
    out = subprocess.run(['node', '-e', js], cwd=here.parent.parent / 'prototype', capture_output=True, text=True, check=True).stdout
    return {k: [tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in v] for k, v in json.loads(out).items()}


def sky_at(sky, t):
    def mix(a, b, k): return tuple(a[i] + (b[i] - a[i]) * k for i in range(3))
    return mix(sky[0], sky[1], t / 0.42) if t < 0.42 else mix(sky[1], sky[2], (t - 0.42) / 0.28) if t < 0.7 else mix(sky[2], sky[3], (t - 0.7) / 0.3)


def fit(src, sky):
    im = Image.open(src).convert('RGB')
    k = max(W / im.width, H / im.height); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2; im = im.crop((x, y, x + W, y + H))
    im = ImageEnhance.Contrast(im).enhance(0.92)
    px = im.load()
    for yy in range(H):
        t = yy / (H - 1); s = sky_at(sky, t); ls = max(40, 0.3 * s[0] + 0.59 * s[1] + 0.11 * s[2]); dim = 0.9 - 0.16 * max(0, (t - 0.55) / 0.45)   # darker towards the bottom
        for xx in range(W):
            r, g, b = px[xx, yy]; k = min(2.2, (0.3 * r + 0.59 * g + 0.11 * b) / ls)       # this pixel's brightness against the theme's sky here
            px[xx, yy] = tuple(int(min(255, (c + (min(255, s[i] * k) - c) * PULL)) * dim) for i, c in enumerate((r, g, b)))
    return im.quantize(COLOURS, method=Image.MEDIANCUT, dither=Image.NONE)   # kept as a palette picture: a fraction of the file size


def main():
    raw = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not raw or not raw.is_dir(): sys.exit('usage: python3 backgrounds.py RAW_DIR   (the folder gen_backgrounds.py wrote)')
    skies = theme_skies(); out = here.parent / 'backgrounds'; out.mkdir(exist_ok=True); done = []
    for th, sky in skies.items():
        src = raw / f'{th}.png'
        if not src.exists(): print('no raw picture for', th); continue
        im = fit(src, sky); im.save(out / f'{th}.png', optimize=True); done.append((th, im)); print('wrote', th, (out / f'{th}.png').stat().st_size, 'bytes')
    if done:  # contact sheet: every background at game size, two to a row
        cols = 2; rows = (len(done) + 1) // 2; sheet = Image.new('RGB', (cols * (W + 12) + 12, rows * (H + 30) + 12), (27, 24, 38)); d = ImageDraw.Draw(sheet)
        for i, (th, im) in enumerate(done):
            x, y = 12 + (i % cols) * (W + 12), 12 + (i // cols) * (H + 30); sheet.paste(im.convert('RGB'), (x, y + 18)); d.text((x, y + 2), th, fill=(255, 243, 224))
        sheet.save(here.parent / 'concepts' / 'backgrounds.png'); print('wrote concepts/backgrounds.png')


if __name__ == '__main__':
    main()
