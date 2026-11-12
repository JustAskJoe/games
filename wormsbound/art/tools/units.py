# Wormsbound unit sprites, drawn in code (the same method as Rogue Shooter's heroes: Pillow, material ramps,
# top-left light, a dark outline tinted from the object's own colour). No image model, nothing licensed.
# © 2026 justaskjoe. All rights reserved.
#
# Run: python3 units.py            writes ../sprites/units.png, ../sprites/units.json and ../concepts/units.png
#
# Sheet: one row per character (the order of CHARS in prototype/engine.js), 32 x 32 art pixels a frame, facing right.
# Columns: idle 1, idle 2 (a small bob; gear flutters), hurt. The game draws a frame at 2x and flips it to face left.
# The body is painted in three KEY colours that the game swaps for the unit's team colour at load time, so one sheet
# serves all six teams. Everything else (hats, gear) keeps its own colours.
import json, pathlib
from PIL import Image

S = 32                                   # frame size, art pixels
CX, CY, R = 16, 22, 6.4                  # body centre and radius; feet stand on row 29 (the game's ground line)
KEY = {'d': (200, 0, 200), 'm': (255, 0, 255), 'l': (255, 140, 255)}   # body shade, mid, light: swapped per team
INK = (30, 26, 43)
WHITE, CREAM = (255, 243, 224), (243, 223, 195)
STEEL = [(76, 80, 96), (140, 143, 160), (196, 200, 214)]
GOLD = [(176, 120, 20), (255, 211, 77), (255, 240, 170)]
BROWN = [(84, 52, 34), (138, 90, 60), (184, 132, 92)]
GREEN = [(40, 110, 60), (88, 190, 96), (160, 236, 150)]
BLUE = [(36, 84, 150), (90, 169, 255), (176, 220, 255)]
RED = [(140, 36, 40), (232, 72, 72), (255, 150, 130)]
CLOUD = [(150, 164, 190), (224, 232, 244), (255, 255, 255)]
SPARK = (143, 216, 255)
FLAME = [(255, 120, 40), (255, 211, 77)]


class Frame:
    def __init__(self):
        self.px = {}                      # (x, y) -> rgb
    def put(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < S and 0 <= y < S and c is not None: self.px[(x, y)] = c
    def rect(self, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1): self.put(x, y, c)
    def disc(self, cx, cy, rx, ry, ramp, lit=True):
        """An ellipse shaded from the top-left: light, mid, shade. ramp = [shade, mid, light] or one colour."""
        for y in range(int(cy - ry - 1), int(cy + ry + 2)):
            for x in range(int(cx - rx - 1), int(cx + rx + 2)):
                dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                if dx * dx + dy * dy > 1: continue
                if not isinstance(ramp, list): self.put(x, y, ramp); continue
                k = dx * 0.6 + dy * 0.8   # further down-right = darker
                self.put(x, y, ramp[2] if lit and k < -0.42 else ramp[0] if k > 0.5 else ramp[1])
    def line(self, x0, y0, x1, y1, c):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1): self.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c)
    def outline(self, c=INK):
        """A 1 px outline around everything drawn so far."""
        edge = set()
        for (x, y) in self.px:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q not in self.px and 0 <= q[0] < S and 0 <= q[1] < S: edge.add(q)
        for q in edge: self.px[q] = c
    def image(self):
        im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        for (x, y), c in self.px.items(): im.putpixel((x, y), c + (255,))
        return im


def body(f, bob=0, wide=0.0, hurt=False):
    """The round body in the team's key colours, with two feet."""
    ramp = [KEY['d'], KEY['m'], KEY['l']]
    f.disc(CX, CY + bob, R + wide, R - (0.6 if bob else 0), ramp)
    for fx in (CX - 4, CX + 2):          # feet: two dark nubs on the ground line
        f.rect(fx, 28, fx + 2, 29, INK)

def eyes(f, bob=0, hurt=False, y=0, goggles=None):
    """Two eyes looking right. hurt: squeezed shut. goggles: a ramp for the frames."""
    ey = CY + bob + y
    for ex in (CX - 2, CX + 3):
        if goggles: f.rect(ex - 1, ey - 2, ex + 2, ey + 1, goggles[0])
        if hurt:
            f.put(ex, ey - 1, INK); f.put(ex + 1, ey, INK); f.put(ex + 1, ey - 1, WHITE); f.put(ex, ey, WHITE)
        else:
            f.rect(ex, ey - 1, ex + 1, ey, WHITE); f.put(ex + 1, ey, INK)
    if hurt: f.rect(CX, ey + 3, CX + 2, ey + 3, INK)   # a wobbly mouth


# ---- the ten characters: each draws back gear, body, then hat and front gear ----
def brick(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    body(f, bob, wide=1.4); f.rect(CX - 4, CY + bob + 2, CX + 4, CY + bob + 4, STEEL[1]); f.rect(CX - 4, CY + bob + 4, CX + 4, CY + bob + 4, STEEL[0])
    f.rect(CX - 8, CY + bob - 7, CX + 8, CY + bob - 4, STEEL[1]); f.rect(CX - 8, CY + bob - 7, CX + 8, CY + bob - 7, STEEL[2]); f.rect(CX - 8, CY + bob - 4, CX + 8, CY + bob - 4, STEEL[0])
    for rx in (-6, 0, 6): f.put(CX + rx, CY + bob - 5, INK)
    eyes(f, bob, hurt)

def tusk(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    body(f, bob, wide=1.0)
    f.disc(CX, CY + bob - 5, 7, 3.2, BROWN)                                  # a leather cap
    for sx in (-1, 1):                                                       # two tusks curving up
        f.line(CX + sx * 7, CY + bob - 4, CX + sx * 9, CY + bob - 8, CREAM); f.put(CX + sx * 9, CY + bob - 9, WHITE); f.put(CX + sx * 8, CY + bob - 4, CREAM)
    f.rect(CX + 4, CY + bob + 1, CX + 7, CY + bob + 4, STEEL[1]); f.rect(CX + 7, CY + bob + 1, CX + 7, CY + bob + 4, STEEL[0])   # a ram plate out front
    eyes(f, bob, hurt)

def zip_(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    w = 1 if i == 1 else 0                                                   # the scarf flutters
    for k in range(7): f.rect(CX - 6 - k, CY + bob + 1 + (k // 2 + w) % 2, CX - 6 - k, CY + bob + 3 + (k // 2 + w) % 2, GOLD[1] if k % 3 else GOLD[2])
    body(f, bob)
    f.rect(CX - 5, CY + bob + 1, CX + 5, CY + bob + 2, GOLD[1])              # scarf round the neck
    f.disc(CX, CY + bob - 4, 6.2, 3.4, RED); f.rect(CX - 6, CY + bob - 3, CX + 6, CY + bob - 3, RED[0])   # a cap
    f.rect(CX + 5, CY + bob - 3, CX + 10, CY + bob - 2, RED[1]); f.rect(CX + 5, CY + bob - 2, CX + 10, CY + bob - 2, RED[0])   # its visor
    eyes(f, bob, hurt, y=1)

def hopper(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    body(f, bob)
    f.disc(CX, CY + bob - 4, 6.6, 3.6, GREEN)                                # a frog hood
    for sx in (-4, 3):                                                       # with eyes on top
        f.disc(CX + sx + 0.5, CY + bob - 8, 2, 2, GREEN); f.put(CX + sx + (1 if sx > 0 else 0), CY + bob - 8, INK)
    f.rect(CX - 6, 28, CX - 2, 29, GREEN[0]); f.rect(CX + 2, 28, CX + 7, 29, GREEN[0])   # big springy feet
    if i == 1: f.rect(CX + 2, 27, CX + 7, 27, GREEN[1])
    eyes(f, bob, hurt, y=1)

def volt(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    body(f, bob)
    f.disc(CX, CY + bob - 4, 6.6, 3.4, BLUE); f.rect(CX - 7, CY + bob - 3, CX + 7, CY + bob - 3, BLUE[0])     # helmet
    f.line(CX, CY + bob - 8, CX, CY + bob - 13, GOLD[1])                                                  # lightning rod
    f.disc(CX + 0.5, CY + bob - 14, 1.6 if i != 1 else 2.3, 1.6 if i != 1 else 2.3, SPARK)               # its spark pulses
    for (x, y) in ((0, 2), (1, 2), (0, 3), (-1, 4), (0, 4), (1, 4), (0, 5)): f.put(CX + x, CY + bob + y, GOLD[1])   # a bolt on the chest
    eyes(f, bob, hurt, y=0)

def flint(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    body(f, bob)
    f.rect(CX - 9, CY + bob - 4, CX + 9, CY + bob - 3, BROWN[1]); f.rect(CX - 9, CY + bob - 3, CX + 9, CY + bob - 3, BROWN[0])   # wide brim
    f.disc(CX, CY + bob - 6, 4.6, 3, BROWN); f.rect(CX - 4, CY + bob - 5, CX + 4, CY + bob - 5, RED[1])                       # crown and band
    f.put(CX + 5, CY + bob - 9, FLAME[0]); f.put(CX + 5, CY + bob - 10, FLAME[1] if i != 1 else FLAME[0]); f.put(CX + 6, CY + bob - 10, FLAME[1]) # a lit match in the band
    if i == 1: f.put(CX + 6, CY + bob - 11, FLAME[1])
    f.line(CX - 5, CY + bob + 1, CX + 4, CY + bob + 5, BROWN[0])                                                                  # bandolier
    for k in range(3): f.put(CX - 3 + k * 3, CY + bob + 2 + k, GOLD[1])
    eyes(f, bob, hurt, y=1)

def digger(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    body(f, bob)
    f.disc(CX, CY + bob - 4, 6.8, 3.6, GOLD); f.rect(CX - 8, CY + bob - 3, CX + 8, CY + bob - 3, GOLD[0])     # hard hat with a brim
    f.rect(CX + 3, CY + bob - 7, CX + 5, CY + bob - 5, WHITE); f.put(CX + 6, CY + bob - 6, GOLD[2])           # its lamp
    if i != 2:                                                                                             # and the lamp's beam
        for k in range(1, 5): f.put(CX + 6 + k, CY + bob - 6 + (k // 2), GOLD[2] if (k + i) % 2 else None)
    eyes(f, bob, hurt, y=1)

def patch(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    f.line(CX - 8, CY + bob - 6, CX - 5, CY + bob + 4, STEEL[1]); f.rect(CX - 10, CY + bob - 8, CX - 7, CY + bob - 6, STEEL[1]); f.put(CX - 8, CY + bob - 8, None)   # a wrench on the back
    f.px.pop((CX - 8, CY + bob - 8), None)
    body(f, bob)
    f.rect(CX - 5, CY + bob + 1, CX - 2, CY + bob + 4, BLUE[1]); f.put(CX - 5, CY + bob + 1, CREAM); f.put(CX - 2, CY + bob + 4, CREAM); f.put(CX - 2, CY + bob + 1, CREAM); f.put(CX - 5, CY + bob + 4, CREAM)   # a stitched patch
    f.rect(CX - 6, CY + bob - 6, CX + 6, CY + bob - 5, BROWN[1])                                                                                                   # goggle strap
    for gx in (CX - 3, CX + 2):                                                                                                                                    # welding goggles pushed up
        f.rect(gx, CY + bob - 8, gx + 2, CY + bob - 5, STEEL[1]); f.rect(gx + 1, CY + bob - 7, gx + 1, CY + bob - 6, GREEN[1] if i != 1 else GREEN[2])
    eyes(f, bob, hurt, y=1)

def gale(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    ky = 5 + (1 if i == 1 else 0)                                            # a kite on a string, bobbing
    f.line(CX - 4, CY + bob - 2, 5, ky + 3, CREAM)
    for (x, y, c) in ((4, ky - 2, GREEN[2]), (3, ky - 1, GREEN[1]), (4, ky - 1, GREEN[2]), (5, ky - 1, GREEN[1]), (2, ky, GREEN[1]), (3, ky, GREEN[1]), (4, ky, GREEN[1]), (5, ky, GREEN[0]), (6, ky, GREEN[0]), (3, ky + 1, GREEN[1]), (4, ky + 1, GREEN[0]), (5, ky + 1, GREEN[0]), (4, ky + 2, GREEN[0])): f.put(x, y, c)
    body(f, bob)
    f.disc(CX, CY + bob - 5, 6.4, 2.8, BROWN)                                # aviator cap
    for sx in (-7, 6): f.rect(CX + sx, CY + bob - 4, CX + sx + 1, CY + bob - 1, BROWN[1])   # short ear flaps
    for gx in (CX - 3, CX + 2): (f.rect(gx, CY + bob - 7, gx + 2, CY + bob - 5, STEEL[2]), f.put(gx + 1, CY + bob - 6, SPARK))   # goggles pushed up
    eyes(f, bob, hurt, y=1)

def nimbus(f, i):
    bob, hurt = (1 if i == 1 else 0), i == 2
    body(f, bob)
    f.disc(CX, CY + bob - 4, 6.6, 3.6, BLUE)                                 # a raincoat hood
    f.rect(CX - 6, CY + bob - 2, CX - 5, CY + bob + 2, BLUE[1]); f.rect(CX + 5, CY + bob - 2, CX + 6, CY + bob + 2, BLUE[0])
    cy = 8 + (1 if i == 1 else 0)                                            # her own small cloud overhead
    for (dx, r) in ((-3, 2.2), (0, 2.9), (3.4, 2.1)): f.disc(CX + dx, cy, r, r * 0.9, CLOUD)
    f.rect(CX - 5, cy + 1, CX + 5, cy + 2, CLOUD[1]); f.rect(CX - 4, cy + 2, CX + 4, cy + 2, CLOUD[0])
    for k, dx in enumerate((-3, 0, 3)): f.put(CX + dx, cy + 4 + (k + i) % 2, SPARK)   # and its drizzle
    eyes(f, bob, hurt, y=1)


CHARS = [('brick', brick), ('zip', zip_), ('volt', volt), ('digger', digger), ('gale', gale),
         ('tusk', tusk), ('hopper', hopper), ('flint', flint), ('patch', patch), ('nimbus', nimbus)]
FRAMES = ['idle1', 'idle2', 'hurt']

def render(fn, i):
    f = Frame(); fn(f, i); f.outline()
    if i == 2:                           # hurt: knocked a little off balance
        return f.image().rotate(-12, resample=Image.NEAREST, center=(CX, CY))
    return f.image()

def swap(im, team):
    """What the game does at load time: swap the three key colours for a team's."""
    c, c2 = team; light = tuple(min(255, int(v + (255 - v) * 0.45)) for v in c)
    table = {KEY['d']: c2, KEY['m']: c, KEY['l']: light}
    out = im.copy(); px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in table: px[x, y] = table[(r, g, b)] + (255,)
    return out

if __name__ == '__main__':
    here = pathlib.Path(__file__).resolve().parent
    sprites = here.parent / 'sprites'; concepts = here.parent / 'concepts'
    sprites.mkdir(exist_ok=True); concepts.mkdir(exist_ok=True)
    sheet = Image.new('RGBA', (S * len(FRAMES), S * len(CHARS)), (0, 0, 0, 0))
    for r, (name, fn) in enumerate(CHARS):
        for c in range(len(FRAMES)): sheet.paste(render(fn, c), (c * S, r * S))
    sheet.save(sprites / 'units.png')
    (sprites / 'units.json').write_text(json.dumps({
        'frame': [S, S], 'scale': 2, 'foot': [CX, 30], 'rows': [n for n, _ in CHARS], 'columns': FRAMES,
        'key': {k: '#%02X%02X%02X' % v for k, v in KEY.items()},
        'note': 'Facing right; flip for left. The game swaps key.d / key.m / key.l for the team colour shade, colour and light.',
    }, indent=1) + '\n', encoding='utf-8')
    # a contact sheet for people: every character in two team colours, on a light and a dark ground, at 1x and 4x
    TEAMS = [((255, 122, 48), (201, 72, 26)), ((34, 195, 181), (14, 124, 123))]
    Z = 4; W = len(CHARS) * S * Z; con = Image.new('RGB', (W, S * Z * 4 + S * 2), (30, 26, 43))
    for band, (bg, team) in enumerate([((200, 222, 240), TEAMS[0]), ((42, 30, 46), TEAMS[1]), ((200, 222, 240), TEAMS[1]), ((42, 30, 46), TEAMS[0])]):
        con.paste(bg, (0, band * S * Z, W, (band + 1) * S * Z))
        for r, (name, fn) in enumerate(CHARS):
            im = swap(render(fn, band % 3), team).resize((S * Z, S * Z), Image.NEAREST)
            con.paste(im, (r * S * Z, band * S * Z), im)
    con.paste((120, 170, 110), (0, S * Z * 4, W, S * Z * 4 + S * 2))      # the bottom strip: real game size (2x)
    for r, (name, fn) in enumerate(CHARS):
        for k, team in enumerate(TEAMS):
            im = swap(render(fn, 0), team).resize((S * 2, S * 2), Image.NEAREST)
            con.paste(im, (r * S * Z + k * S * 2, S * Z * 4), im)
    con.save(concepts / 'units.png')
    print('wrote', sprites / 'units.png', sheet.size, 'and', concepts / 'units.png', con.size)
