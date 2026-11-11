"""Quick contact sheet for checking enemy art: python3 preview.py out.png [scale] [keys...]"""
import sys
from PIL import Image, ImageDraw
import ekit
import meadow_forest  # noqa: F401
try:
    import caverns_volcanic  # noqa: F401
except ImportError: pass
for _m in ('shadow_void', 'bosses_mini', 'bosses_major'):
    try: __import__(_m)
    except ImportError: pass

def main():
    out = sys.argv[1]; sc = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    keys = sys.argv[3:] or list(ekit.ENEMIES)
    rows = []
    for k in keys:
        e = ekit.ENEMIES[k]
        for var in e['variants']:
            for v in e['views']:
                row = []
                for anim, fr in e['anims'].items():
                    row += [ekit.render(k, v, x, var) for x in fr]
                rows.append(row)
    W = max(sum(im.width + 2 for im in r) for r in rows); H = sum(max(im.height for im in r) + 2 for r in rows)
    sheet = Image.new('RGBA', (W, H), (94, 162, 60, 255))
    y = 0
    for r in rows:
        x = 0
        for im in r:
            sheet.alpha_composite(im, (x, y)); x += im.width + 2
        y += max(im.height for im in r) + 2
    sheet = sheet.resize((W * sc, H * sc), Image.NEAREST)
    sheet.save(out)
    print(out, sheet.size)

main()
