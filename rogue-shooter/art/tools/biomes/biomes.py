"""Battle-area scenery for the six zones: a seamless ground tile, ground details (no collision),
obstacles (with collision), and a full combat-screen mock per zone built from those pieces.

Obstacles are drawn with the hero toolkit (material ramps, top-left light, colored outline).
Ground tiles wrap at every edge, so the game can repeat them. Mock screens are 427x267 art px,
which is a 1280x800 window at 3x.
"""
import os, sys, math, random, json
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'enemies'))
import ekit
from ekit import R, ramp, hx, WHITE, blob, line_dots, glow
from spritekit import Sprite

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
T = 96                       # ground tile size (art px)
SW, SH_ = 427, 267           # one screen at 3x on a 1280x800 window
SHADOW_MUL = np.array((0.62, 0.66, 0.80))

R.update({
    'bark':   ramp('#24160c', '#432a18', '#6a4628', '#90683c', '#b48c58'),
    'oak':    ramp('#173a14', '#2c6626', '#3f8a34', '#57a940', '#93cf63'),
    'pine':   ramp('#0e2a1a', '#1a4428', '#2a6036', '#3f7f44', '#62a45a'),
    'fleaf':  ramp('#0c2214', '#16361e', '#22502a', '#336c36', '#4e8c44'),
    'moss':   ramp('#1a3214', '#2e5422', '#457a30', '#66a040', '#9acc62'),
    'mcap':   ramp('#3a1a10', '#6a3018', '#9a4a24', '#c4703a', '#e8a064'),
    'water':  ramp('#1c3e74', '#2a5a9a', '#3a7cc0', '#6aaee6', '#d6f0ff'),
    'cwater': ramp('#0c1e30', '#163450', '#244e70', '#3c7096', '#8ab8d4'),
    'dirt':   ramp('#5a3e22', '#80592f', '#a07446', '#c49a64', '#e4c48c'),
    'vstone': ramp('#1c1626', '#2e263c', '#463a58', '#625478', '#8a7aa2'),
    'dead':   ramp('#0e0a12', '#1c1622', '#2c2434', '#40364a', '#5a4e64'),
    'char':   ramp('#0e0a0a', '#1e1614', '#30241e', '#46362c', '#62503e'),
    'obsid':  ramp('#06050c', '#100e1c', '#1c1a30', '#2c2a48', '#46446c'),
    'fung':   ramp('#2a1040', '#4a1c6c', '#7a34a8', '#b066dc', '#e8b4ff'),
})

ZONES = ['meadow', 'forest', 'caverns', 'volcanic', 'shadow', 'void']
NAMES = {'meadow': 'Meadow', 'forest': 'Forest', 'caverns': 'Caverns', 'volcanic': 'Volcanic', 'shadow': 'Shadow', 'void': 'Void'}

# ================================================================== ground tiles (wrap at the edges)

class Tile:
    def __init__(s, base, seed):
        s.a = np.zeros((T, T, 3), float); s.a[:] = hx(base); s.rng = random.Random(seed)
    def p(s, x, y, c, k=1.0):
        c = np.array(hx(c) if isinstance(c, str) else c, float)
        x, y = int(round(x)) % T, int(round(y)) % T
        s.a[y, x] = s.a[y, x] * (1 - k) + c * k
    def e(s, cx, cy, rx, ry, c, k=1.0):
        for y in range(int(cy - ry - 1), int(cy + ry + 2)):
            for x in range(int(cx - rx - 1), int(cx + rx + 2)):
                if ((x - cx) / max(rx, .5)) ** 2 + ((y - cy) / max(ry, .5)) ** 2 <= 1: s.p(x, y, c, k)
    def line(s, pts, c, k=1.0):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(1, int(max(abs(x1 - x0), abs(y1 - y0))))
            for i in range(n + 1): s.p(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c, k)
    def r(s): return s.rng.random()
    def xy(s): return s.rng.randrange(T), s.rng.randrange(T)
    def img(s): return Image.fromarray(np.clip(s.a, 0, 255).astype(np.uint8), 'RGB')

def tuft(t, x, y, c1, c2):
    t.p(x, y, c1); t.p(x - 1, y - 1, c1); t.p(x + 1, y - 2, c1); t.p(x, y - 1, c1); t.p(x + 1, y - 1, c2)

def crack(t, x, y, L, c, k=1.0):
    pts = [(x, y)]
    for _ in range(L):
        x += t.rng.choice((-1, 0, 1)) + 1; y += t.rng.choice((-1, 0, 1)); pts.append((x, y))
    t.line(pts, c, k)
    return pts

def ground(zone, seed=3):
    if zone == 'meadow':
        t = Tile('#5ea23c', seed)
        for _ in range(18): t.e(*t.xy(), t.rng.randint(5, 12), t.rng.randint(3, 7), t.rng.choice(['#529434', '#6cb046', '#529434']), 0.45)
        for _ in range(150): tuft(t, *t.xy(), '#3f7a28' if t.r() < .6 else '#478a2e', '#6cb046')
        for _ in range(16): x, y = t.xy(); t.p(x, y, '#93cf63'); t.p(x + 1, y - 1, '#6cb046')
    elif zone == 'forest':
        t = Tile('#3e6a30', seed)
        for _ in range(20): t.e(*t.xy(), t.rng.randint(5, 13), t.rng.randint(3, 7), t.rng.choice(['#355e2a', '#466f34', '#2f5426']), 0.45)
        for _ in range(130): tuft(t, *t.xy(), '#2a4c22' if t.r() < .6 else '#2f5426', '#4e7a3a')
        for _ in range(14):
            x, y = t.xy(); c = t.rng.choice(['#8a5a2a', '#a8702e', '#6e4422'])
            t.p(x, y, c); t.p(x + 1, y, c); t.p(x, y + 1, '#5a3a1a')
    elif zone == 'caverns':
        t = Tile('#4a4e5a', seed)
        for _ in range(16): t.e(*t.xy(), t.rng.randint(6, 14), t.rng.randint(5, 10), t.rng.choice(['#444855', '#545866', '#40434e']), 0.45)
        for _ in range(18):
            x, y = t.xy(); pts = crack(t, x, y, t.rng.randint(5, 12), '#363944')
            for px, py in pts[1:-1:2]: t.p(px, py + 1, '#727684')
        for _ in range(26):
            x, y = t.xy(); t.p(x, y, '#3e414c'); t.p(x - 1, y - 1, '#7a7e8c')
        for _ in range(3):
            x, y = t.xy(); t.p(x, y, '#7ee0f0'); t.p(x, y - 1, '#38a8c0')
    elif zone == 'volcanic':
        t = Tile('#4a3a34', seed)
        for _ in range(18): t.e(*t.xy(), t.rng.randint(5, 13), t.rng.randint(4, 9), t.rng.choice(['#3e302c', '#56443c', '#3a2c28']), 0.45)
        for _ in range(10):
            x, y = t.xy(); pts = crack(t, x, y, t.rng.randint(5, 10), '#2a1e1c')
            for px, py in pts[2:-2]:
                if t.r() < 0.45: t.p(px, py, '#e05a10'); t.p(px, py - 1, '#2a1e1c')
        for _ in range(30): x, y = t.xy(); t.p(x, y, t.rng.choice(['#6a5a52', '#2a1e1c', '#7a6a60']))
    elif zone == 'shadow':
        t = Tile('#2e2640', seed)
        for _ in range(18): t.e(*t.xy(), t.rng.randint(5, 13), t.rng.randint(4, 8), t.rng.choice(['#28203a', '#352c4a', '#251e34']), 0.45)
        for y in (0, 24, 48, 72):
            for x in range(T): t.p(x, y, '#241c32', 0.5)
            for x in range(T): t.p(x, y + 1, '#3a3050', 0.3)
            for x in ((12, 44, 76) if y % 48 == 0 else (28, 60, 92)):
                for yy in range(y, y + 24): t.p(x, yy, '#241c32', 0.5); t.p(x + 1, yy, '#3a3050', 0.3)
        for _ in range(90): tuft(t, *t.xy(), '#3e3452', '#4a3e60')
        for _ in range(6): x, y = t.xy(); t.p(x, y, '#8a6ac8'); t.p(x, y - 1, '#5c46a0')
    else:
        t = Tile('#14161e', seed)
        for _ in range(16): t.e(*t.xy(), t.rng.randint(6, 14), t.rng.randint(4, 9), t.rng.choice(['#111219', '#181b26', '#0e0f15']), 0.45)
        for _ in range(5):
            x, y = t.xy(); pts = crack(t, x, y, t.rng.randint(6, 12), '#0a0b10')
            for px, py in pts[1:-1]:
                if t.r() < 0.6: t.p(px, py, '#00a0a0' if t.r() < .7 else '#20e0d0')
        for _ in range(16): x, y = t.xy(); t.p(x, y, t.rng.choice(['#2a3048', '#3a4466', '#c020d0']))
    return t.img()

# ================================================================== ground details (no collision, no outline)

def rgba(w, h): return np.zeros((h, w, 4), np.uint8)
def put(a, x, y, c, al=255):
    x, y = int(round(x)), int(round(y)); c = hx(c) if isinstance(c, str) else c
    if 0 <= x < a.shape[1] and 0 <= y < a.shape[0]: a[y, x, :3] = c; a[y, x, 3] = al

def details(zone):
    """Small ground details for each zone: list of (name, RGBA image)."""
    out = []
    def add(name, w, h, fn):
        a = rgba(w, h); fn(a); out.append((name, Image.fromarray(a, 'RGBA')))
    def flower(c, mid='#ffd447'):
        def f(a):
            for dx, dy in ((1, 0), (0, 1), (2, 1), (1, 2)): put(a, dx + 1, dy, c)
            put(a, 2, 1, mid); put(a, 2, 4, '#3f7a28'); put(a, 2, 5, '#3f7a28'); put(a, 1, 5, '#478a2e')
        return f
    if zone == 'meadow':
        add('white flower', 5, 6, flower('#f2ece0')); add('pink flower', 5, 6, flower('#f4a6c6')); add('blue flower', 5, 6, flower('#8ccaf2', '#ffffff'))
        add('pebbles', 6, 4, lambda a: [put(a, x, y, c) for x, y, c in ((0, 2, '#6d6d78'), (1, 2, '#9a9aa4'), (1, 1, '#c4c4cc'), (4, 3, '#6d6d78'), (4, 2, '#9a9aa4'))])
        add('clover', 6, 5, lambda a: [put(a, x, y, c) for x, y, c in ((1, 1, '#6cb046'), (2, 0, '#6cb046'), (3, 1, '#6cb046'), (2, 1, '#93cf63'), (2, 2, '#3f7a28'), (2, 3, '#3f7a28'))])
        add('tall grass', 7, 7, lambda a: [put(a, x, y, c) for x, y, c in ((1, 6, '#3f7a28'), (1, 5, '#3f7a28'), (1, 4, '#6cb046'), (3, 6, '#3f7a28'), (3, 5, '#478a2e'), (3, 4, '#478a2e'), (3, 3, '#6cb046'), (3, 2, '#93cf63'), (5, 6, '#3f7a28'), (5, 5, '#6cb046'), (4, 4, '#6cb046'))])
    elif zone == 'forest':
        add('fern', 9, 7, lambda a: [put(a, 4 + s * i, 6 - i * 0.8 - (1 if j else 0), '#2f5426' if j else '#4e7a3a') for s in (-1, 1) for i in range(5) for j in (0, 1)] + [put(a, 4, y, '#2a4c22') for y in range(2, 7)])
        add('toadstools', 7, 6, lambda a: [put(a, x, y, c) for x, y, c in ((1, 2, '#c03030'), (2, 2, '#e8604a'), (3, 2, '#c03030'), (2, 1, '#e8604a'), (2, 3, '#ece2cc'), (2, 4, '#d0c4ac'), (5, 3, '#c03030'), (5, 4, '#ece2cc'), (1, 1, '#ffffff'))])
        add('fallen leaves', 8, 5, lambda a: [put(a, x, y, c) for x, y, c in ((1, 1, '#a8702e'), (2, 1, '#c88a3a'), (2, 2, '#8a5a2a'), (5, 3, '#c0602a'), (6, 3, '#8a3a1a'), (4, 0, '#a8702e'))])
        add('moss patch', 10, 5, lambda a: [put(a, x, y, '#5a8e3a' if (x + y) % 3 else '#78a848') for x in range(1, 9) for y in range(1, 4) if (x - 4.5) ** 2 / 16 + (y - 2) ** 2 / 2.2 <= 1])
    elif zone == 'caverns':
        add('glow crystal', 5, 7, lambda a: [put(a, x, y, c) for x, y, c in ((2, 1, '#e0fcff'), (2, 2, '#7ee0f0'), (1, 3, '#38a8c0'), (2, 3, '#7ee0f0'), (3, 3, '#38a8c0'), (1, 4, '#1e6a80'), (2, 4, '#38a8c0'), (3, 4, '#1e6a80'), (2, 5, '#0e3a4a'))])
        add('rubble', 8, 5, lambda a: [put(a, x, y, c) for x, y, c in ((1, 3, '#4e4e58'), (2, 3, '#6d6d78'), (2, 2, '#9a9aa4'), (5, 3, '#4e4e58'), (5, 2, '#6d6d78'), (6, 2, '#9a9aa4'), (4, 1, '#c4c4cc'))])
        add('puddle', 10, 4, lambda a: [put(a, x, y, '#3c7096' if y == 1 else '#244e70') for x in range(1, 9) for y in range(1, 3) if not (y == 2 and x in (1, 8))] + [put(a, 3, 1, '#8ab8d4')])
        add('cave moss', 6, 4, lambda a: [put(a, x, y, c) for x, y, c in ((1, 2, '#2a6a6a'), (2, 2, '#3a8a7a'), (3, 1, '#3a8a7a'), (4, 2, '#2a6a6a'), (2, 1, '#5ab0a0'))])
    elif zone == 'volcanic':
        add('embers', 7, 6, lambda a: [put(a, x, y, c) for x, y, c in ((1, 4, '#ff7a10'), (3, 2, '#ffc040'), (5, 4, '#ff7a10'), (4, 0, '#fff8c0'))])
        add('lava crack', 12, 5, lambda a: [put(a, x, y, c) for x, y, c in ((0, 3, '#2a1e1c'), (1, 3, '#e05a10'), (2, 2, '#ffa030'), (3, 2, '#e05a10'), (4, 2, '#ffa030'), (5, 1, '#e05a10'), (6, 2, '#ffa030'), (7, 2, '#e05a10'), (8, 3, '#e05a10'), (9, 3, '#2a1e1c'), (3, 1, '#2a1e1c'), (6, 1, '#2a1e1c'))])
        add('ash pile', 8, 4, lambda a: [put(a, x, y, '#8a7a72' if y == 1 else '#6a5a52') for x in range(1, 7) for y in range(1, 3) if not (y == 1 and x in (1, 6))])
        add('bones', 8, 5, lambda a: [put(a, x, y, c) for x, y, c in ((1, 2, '#e4d8bc'), (2, 2, '#c4b496'), (3, 2, '#c4b496'), (4, 2, '#e4d8bc'), (1, 1, '#e4d8bc'), (4, 3, '#e4d8bc'), (6, 3, '#c4b496'), (6, 2, '#e4d8bc'))])
    elif zone == 'shadow':
        add('dead grass', 7, 6, lambda a: [put(a, x, y, c) for x, y, c in ((1, 5, '#4a3e60'), (1, 4, '#5a4e70'), (3, 5, '#4a3e60'), (3, 4, '#5a4e70'), (3, 3, '#6a5e80'), (4, 2, '#6a5e80'), (5, 5, '#4a3e60'), (5, 4, '#5a4e70'))])
        add('ghost flower', 5, 6, flower('#b8a0ff', '#ffffff'))
        add('candle', 4, 8, lambda a: [put(a, x, y, c) for x, y, c in ((1, 0, '#ffd27a'), (1, 1, '#ff9a30'), (1, 2, '#ece2cc'), (1, 3, '#d0c4ac'), (1, 4, '#d0c4ac'), (2, 2, '#d0c4ac'), (2, 3, '#968672'), (2, 4, '#968672'), (0, 5, '#58483e'), (1, 5, '#58483e'), (2, 5, '#58483e'))])
        add('skull', 6, 5, lambda a: [put(a, x, y, c) for x, y, c in ((1, 1, '#c4b496'), (2, 0, '#e4d8bc'), (3, 0, '#e4d8bc'), (4, 1, '#c4b496'), (1, 2, '#c4b496'), (2, 2, '#1c1622'), (3, 2, '#c4b496'), (4, 2, '#1c1622'), (2, 3, '#8a7a62'), (3, 3, '#c4b496'))])
    else:
        add('neon shard', 5, 7, lambda a: [put(a, x, y, c) for x, y, c in ((2, 0, '#ffffff'), (2, 1, '#80fff0'), (1, 2, '#20e0d0'), (2, 2, '#80fff0'), (2, 3, '#20e0d0'), (3, 3, '#00a0a0'), (2, 4, '#00a0a0'))])
        add('star motes', 9, 7, lambda a: [put(a, x, y, c) for x, y, c in ((1, 2, '#ffffff'), (4, 5, '#9ffcff'), (7, 1, '#f070ff'), (6, 4, '#2a3048'))])
        add('pink crack', 10, 4, lambda a: [put(a, x, y, c) for x, y, c in ((0, 2, '#0a0b10'), (1, 2, '#c020d0'), (2, 1, '#f070ff'), (3, 1, '#c020d0'), (4, 2, '#f070ff'), (5, 2, '#c020d0'), (6, 1, '#0a0b10'))])
        add('void pebble', 6, 4, lambda a: [put(a, x, y, c) for x, y, c in ((1, 2, '#1e2c44'), (2, 2, '#34507a'), (2, 1, '#4a6a9a'), (4, 2, '#1e2c44'))])
    return out

# ================================================================== obstacles (collision)

def S(w, h): return Sprite(w, h, 0)

def canopy(s, cx, cy, blobs, m, k=0):
    blob(s, m, [('ell', cx + dx, cy + dy, r, r * 0.9) for dx, dy, r in blobs])
    rng = random.Random(k)
    for _ in range(int(sum(r for _, _, r in blobs) * 1.2)):
        dx, dy, r = rng.choice(blobs)
        a = rng.random() * math.tau; rr = rng.random() * r * 0.8
        x, y = cx + dx + math.cos(a) * rr, cy + dy + math.sin(a) * rr * 0.8
        s.dot(x, y, (m, 4) if (y < cy and x < cx + 4) else (m, 1))

def oak(k=0):
    s = S(44, 50); cx = 22
    blob(s, 'bark', [('rect', cx - 3, 30, cx + 3, 46), ('poly', [(cx - 7, 47), (cx - 3, 40), (cx + 3, 40), (cx + 7, 47)])])
    line_dots(s, [(cx - 1, 34), (cx - 1, 44)], ('bark', 1)); s.dots([(cx - 3, 33), (cx - 3, 36)], ('bark', 4))
    canopy(s, cx, 20, [(0, 0, 14), (-11, 5, 9), (11, 5, 9), (-7, -8, 9), (7, -8, 9), (0, -12, 7)], 'oak', k)
    for x, y in ((cx - 9, 16), (cx + 4, 10), (cx + 10, 20), (cx - 3, 24)):
        s.dots([(x, y), (x + 1, y)], ('red', 3)); s.dot(x, y, ('red', 4))
    return s

def pine():
    s = S(30, 48); cx = 15
    blob(s, 'bark', [('rect', cx - 2, 38, cx + 2, 46)])
    for i, (w, y0, h) in enumerate(((13, 38, 13), (11, 29, 12), (9, 21, 11), (6, 13, 10))):
        s.poly('pine', [(cx - w, y0), (cx + w, y0), (cx + w * 0.4, y0 - 2), (cx, y0 - h), (cx - w * 0.4, y0 - 2)])
        s.dots([(cx - w + 2, y0 - 1), (cx - w + 4, y0 - 2), (cx - 3, y0 - h + 3)], ('pine', 4))
    s.dot(cx, 3, ('pine', 4))
    return s

def boulder(big=True, m='stone'):
    s = S(26 if big else 18, 20 if big else 14)
    if big:
        blob(s, m, [('ell', 12, 11, 11, 7.5), ('ell', 17, 13, 7, 5)])
        s.dots([(6, 7), (7, 6), (9, 5), (5, 9)], (m, 4)); line_dots(s, [(13, 8), (15, 11), (14, 14)], (m, 1))
    else:
        s.ell(m, 8, 8, 7, 5); s.dots([(4, 6), (5, 5)], (m, 4))
    return s

def bush():
    s = S(22, 16)
    canopy(s, 11, 9, [(-4, 1, 6), (4, 1, 6), (0, -2, 6)], 'oak', 2)
    for x, y in ((6, 8), (14, 6), (10, 11), (16, 10)): s.dot(x, y, ('blue', 4)); s.dot(x + 1, y, ('blue', 2))
    return s

def pond():
    s = S(52, 30)
    blob(s, 'dirt', [('ell', 26, 15, 25, 13)])
    blob(s, 'water', [('ell', 26, 15, 22, 10.5)])
    s.ell('water', 27, 16, 16, 6.5, flat=True)
    line_dots(s, [(12, 9), (20, 6), (30, 5)], ('water', 4))
    for x, y in ((10, 15), (38, 12), (31, 20)):
        s.dots([(x, y), (x + 1, y), (x + 2, y), (x + 1, y - 1)], ('oak', 3)); s.dot(x, y - 1, ('pink', 3))
    return s

def big_tree(k=1):
    s = S(52, 58); cx = 26
    blob(s, 'bark', [('rect', cx - 4, 34, cx + 4, 54), ('poly', [(cx - 9, 55), (cx - 4, 46), (cx + 4, 46), (cx + 9, 55)])])
    line_dots(s, [(cx - 1, 38), (cx - 2, 52)], ('bark', 1)); s.dots([(cx - 4, 38), (cx - 4, 42)], ('bark', 4))
    s.ell('moss', cx - 3, 45, 3, 1.5)
    canopy(s, cx, 22, [(0, 0, 16), (-13, 6, 11), (13, 6, 11), (-9, -9, 11), (9, -9, 11), (0, -14, 9), (-18, -2, 7), (18, -2, 7)], 'fleaf', k)
    return s

def log():
    s = S(40, 18)
    blob(s, 'bark', [('rect', 4, 4, 34, 13), ('ell', 4, 8.5, 3, 4.5)])
    s.ell('dirt', 35, 8.5, 4, 5)
    s.dots([(35, 8), (36, 8), (35, 9), (34, 7), (34, 10), (36, 10), (37, 7)], ('dirt', 1)); s.dot(35, 8, ('dirt', 0))
    line_dots(s, [(8, 7), (30, 7)], ('bark', 1)); line_dots(s, [(10, 11), (28, 11)], ('bark', 1))
    blob(s, 'moss', [('ell', 15, 4, 6, 2), ('ell', 25, 4, 4, 1.5)])
    s.dots([(20, 13), (21, 14)], ('mush', 3))
    return s

def stump():
    s = S(20, 16)
    blob(s, 'bark', [('rect', 4, 6, 15, 12), ('poly', [(2, 13), (4, 10), (15, 10), (17, 13)])])
    s.ell('dirt', 9.5, 6, 5.5, 2.5)
    s.dots([(9, 6), (10, 6), (8, 5), (11, 7)], ('dirt', 1))
    s.ell('moss', 6, 9, 2, 1.2)
    return s

def giant_mushroom():
    s = S(28, 32); cx = 14
    blob(s, 'cream', [('rect', cx - 3, 16, cx + 3, 28), ('ell', cx, 29, 5, 2)])
    blob(s, 'gill', [('ell', cx, 15, 11, 2)])
    blob(s, 'mcap', [('ell', cx, 12, 13, 9), ('cut', 0, 15, 40, 40)])
    for x, y in ((cx - 7, 8), (cx + 2, 5), (cx + 7, 10), (cx - 2, 11)):
        s.dots([(x, y), (x + 1, y), (x, y + 1)], ('cream', 4))
    s.dots([(cx - 9, 8), (cx - 8, 6), (cx - 6, 5)], ('mcap', 4))
    return s

def stalagmite(h=30):
    s = S(18, h + 2); cx = 9
    blob(s, 'stone', [('poly', [(cx - 7, h), (cx - 4, h * 0.55), (cx - 1, 2), (cx + 1, 2), (cx + 4, h * 0.5), (cx + 7, h)])])
    line_dots(s, [(cx - 4, h - 2), (cx - 2, h * 0.5), (cx, 5)], ('stone', 4))
    line_dots(s, [(cx + 2, h - 3), (cx + 2, h * 0.6)], ('stone', 1))
    s.ell('stone', cx + 5, h - 2, 3, 2)
    return s

def crystal_cluster():
    s = S(28, 30)
    blob(s, 'stone', [('ell', 14, 25, 12, 4)])
    for x, h, w, l in ((14, 22, 5, 0), (8, 15, 4, -3), (20, 16, 4, 3), (11, 10, 3, -5), (18, 9, 3, 4)):
        y = 26
        pts = [(x - w / 2, y), (x - w / 2 + l * 0.6, y - h * 0.65), (x + l, y - h), (x + w / 2 + l * 0.6, y - h * 0.65), (x + w / 2, y)]
        s.poly('crystal', pts)
        line_dots(s, [(x - w / 2 + 1, y - 1), (x + l * 0.8 - 0.5, y - h + 2)], ('crystal', 4)); s.dot(x + l, y - h + 1, WHITE)
    return s

def rock_pillar():
    s = S(24, 40); cx = 12
    blob(s, 'stone', [('poly', [(cx - 10, 37), (cx - 9, 14), (cx - 7, 6), (cx - 4, 9), (cx - 1, 1), (cx + 3, 7), (cx + 6, 3), (cx + 9, 12), (cx + 10, 37)])])
    for y in (12, 20, 28): line_dots(s, [(cx - 7, y), (cx - 2, y + 1), (cx + 4, y), (cx + 8, y + 1)], ('stone', 1))
    line_dots(s, [(cx - 6, 8), (cx - 6, 34)], ('stone', 4))
    s.ell('cwater', cx + 4, 37, 4, 1.4, flat=True)
    return s

def basalt_columns():
    s = S(30, 38)
    for x, top, w in ((5, 14, 7), (12, 6, 7), (19, 11, 7), (24, 20, 5)):
        blob(s, 'basalt', [('rect', x - w // 2, top, x + w // 2, 34)])
        s.ell('basalt', x, top, w / 2, 1.6)
        s.dots([(x - w // 2 + 1, top + 2), (x - w // 2 + 1, top + 6)], ('basalt', 4))
    s.dots([(11, 22), (12, 23), (18, 28)], ('lava', 3))
    return s

def lava_pool():
    s = S(52, 28)
    blob(s, 'basalt', [('ell', 26, 14, 25, 12.5)])
    blob(s, 'lava', [('ell', 26, 14, 21, 9.5)])
    s.ell('lava', 27, 15, 14, 5.5, flat=True)
    for x, y in ((14, 12), (30, 9), (36, 17), (22, 18)):
        s.dots([(x, y), (x + 1, y), (x, y - 1)], ('lava', 4))
    s.dots([(10, 9), (12, 7), (16, 6)], ('lava', 4))
    return s

def charred_tree():
    s = S(32, 44); cx = 16
    blob(s, 'char', [('poly', [(cx - 3, 42), (cx - 2, 20), (cx - 8, 10), (cx - 12, 6), (cx - 9, 6), (cx - 2, 14), (cx, 4), (cx + 2, 4), (cx + 2, 14),
                                (cx + 9, 8), (cx + 13, 9), (cx + 3, 20), (cx + 3, 42), (cx + 7, 44), (cx - 7, 44)])])
    s.dots([(cx - 1, 30), (cx + 1, 24), (cx, 36), (cx - 8, 9)], ('lava', 3)); s.dots([(cx - 2, 22), (cx - 2, 26)], ('char', 4))
    return s

def obsidian():
    s = S(24, 18)
    s.poly('obsid', [(2, 15), (5, 6), (10, 2), (16, 4), (21, 10), (22, 15)])
    line_dots(s, [(6, 8), (10, 4)], ('obsid', 4)); s.dot(9, 4, WHITE); line_dots(s, [(13, 5), (15, 14)], ('obsid', 1))
    return s

def dead_tree():
    s = S(36, 46); cx = 18
    blob(s, 'dead', [('poly', [(cx - 3, 44), (cx - 2, 26), (cx - 10, 16), (cx - 15, 14), (cx - 13, 11), (cx - 7, 14), (cx - 2, 18), (cx - 3, 8), (cx - 6, 3),
                                (cx - 3, 3), (cx, 10), (cx + 2, 4), (cx + 4, 5), (cx + 2, 16), (cx + 9, 10), (cx + 13, 4), (cx + 15, 6), (cx + 10, 14),
                                (cx + 3, 24), (cx + 4, 44), (cx + 8, 45), (cx - 8, 45)])])
    s.dots([(cx - 2, 28), (cx - 2, 33), (cx - 11, 14)], ('dead', 4))
    s.dots([(cx - 1, 30), (cx, 30)], hx('#b8a0ff'))      # two pale eyes in the bark
    return s

def broken_pillar():
    s = S(20, 36); cx = 10
    blob(s, 'vstone', [('rect', cx - 6, 8, cx + 6, 32), ('rect', cx - 8, 30, cx + 8, 34), ('poly', [(cx - 6, 8), (cx - 6, 4), (cx - 2, 7), (cx + 2, 2), (cx + 6, 6), (cx + 6, 8)])])
    for x in (cx - 3, cx + 1, cx + 4): line_dots(s, [(x, 10), (x, 29)], ('vstone', 1))
    s.dots([(cx - 5, 10), (cx - 5, 16), (cx - 5, 22)], ('vstone', 4))
    s.ell('moss', cx - 4, 31, 3, 1.2)
    return s

def gravestone():
    s = S(16, 22); cx = 8
    blob(s, 'vstone', [('rect', cx - 5, 7, cx + 5, 19), ('ell', cx, 7, 5, 4)])
    s.rect('dirt', cx - 6, 19, cx + 6, 20)
    line_dots(s, [(cx - 2, 9), (cx + 2, 9)], ('vstone', 1)); line_dots(s, [(cx, 7), (cx, 13)], ('vstone', 1))
    s.dots([(cx - 4, 5), (cx - 3, 4)], ('vstone', 4))
    return s

def ruined_arch():
    s = S(36, 40)
    blob(s, 'vstone', [('rect', 3, 12, 9, 36), ('rect', 27, 20, 33, 36), ('poly', [(3, 12), (8, 5), (16, 2), (22, 4), (21, 8), (14, 8), (9, 14)])])
    blob(s, 'vstone', [('rect', 1, 35, 11, 38), ('rect', 25, 35, 35, 38)])
    for y in (18, 24, 30): line_dots(s, [(3, y), (9, y)], ('vstone', 1)); line_dots(s, [(27, y + 2), (33, y + 2)], ('vstone', 1))
    s.dots([(4, 14), (4, 20), (9, 6), (12, 4)], ('vstone', 4))
    s.dots([(18, 36), (20, 37), (22, 36)], ('vstone', 2))
    return s

def float_rock():
    s = S(32, 28)
    blob(s, 'void', [('poly', [(3, 10), (8, 4), (18, 3), (28, 7), (29, 12), (22, 20), (14, 25), (9, 20)])])
    s.ell('dirt', 16, 7, 11, 2.6)
    line_dots(s, [(7, 11), (12, 14), (18, 13), (23, 16)], ('neon', 2)); s.dots([(12, 14), (18, 13)], ('neon', 4))
    s.dots([(6, 8), (8, 6)], ('void', 4))
    return s

def void_pit():
    s = S(48, 26)
    blob(s, 'neon', [('ell', 24, 13, 23, 11.5)])
    s.ell('black', 24, 13, 21.5, 10.4, flat=True)
    rng = random.Random(4)
    for _ in range(18):
        x, y = rng.uniform(8, 40), rng.uniform(6, 20)
        if ((x - 24) / 19) ** 2 + ((y - 13) / 8.5) ** 2 < 1: s.dot(x, y, rng.choice([WHITE, hx('#9ffcff'), hx('#f070ff'), hx('#3a4466')]))
    return s

def monolith():
    s = S(16, 40); cx = 8
    blob(s, 'obsid', [('poly', [(cx - 5, 38), (cx - 5, 10), (cx - 1, 2), (cx + 4, 8), (cx + 5, 38)])])
    for y in (12, 19, 26, 33): s.dots([(cx, y), (cx - 1, y + 1), (cx + 1, y + 1), (cx, y + 2)], ('neon', 3))
    line_dots(s, [(cx - 4, 10), (cx - 4, 34)], ('obsid', 4))
    return s

def debris():
    s = S(26, 14)
    s.poly('void', [(2, 10), (6, 4), (13, 3), (15, 8), (11, 12)]); s.poly('void', [(15, 11), (19, 5), (24, 7), (22, 12)])
    s.dots([(6, 6), (8, 5)], ('void', 4)); s.dots([(9, 8), (19, 9)], ('neon', 3))
    return s

OBSTACLES = {
    'meadow':   [('Oak', oak, 9), ('Pine', pine, 8), ('Boulder', boulder, 10), ('Bush', bush, 8), ('Pond', pond, 0)],
    'forest':   [('Old tree', big_tree, 10), ('Fallen log', log, 0), ('Stump', stump, 7), ('Giant mushroom', giant_mushroom, 8), ('Mossy boulder', lambda: boulder(True, 'stone'), 10)],
    'caverns':  [('Stalagmite', stalagmite, 7), ('Crystal cluster', crystal_cluster, 10), ('Rock pillar', rock_pillar, 10), ('Rock', lambda: boulder(False), 7)],
    'volcanic': [('Basalt columns', basalt_columns, 12), ('Lava pool', lava_pool, 0), ('Charred tree', charred_tree, 6), ('Obsidian', obsidian, 9)],
    'shadow':   [('Dead tree', dead_tree, 7), ('Broken pillar', broken_pillar, 8), ('Gravestone', gravestone, 6), ('Ruined arch', ruined_arch, 0)],
    'void':     [('Floating rock', float_rock, 12), ('Void pit', void_pit, 0), ('Monolith', monolith, 6), ('Debris', debris, 8)],
}
# radius 0 means a ground hazard or walk-under shape: see GROUND_HAZARDS
GROUND_HAZARDS = {'Pond': 'blocks movement (water)', 'Fallen log': 'blocks movement (long box)', 'Lava pool': 'burns while you stand in it',
                  'Ruined arch': 'walk under the middle; the two pillars block', 'Void pit': 'pulls you in slowly; standing in it hurts'}
GLOWS = {'Crystal cluster': '#7ee0f0', 'Lava pool': '#ffa030', 'Monolith': '#20e0d0', 'Void pit': '#20e0d0', 'Floating rock': '#20e0d0', 'Basalt columns': None}

def obstacle_images(zone):
    out = []
    for name, fn, rad in OBSTACLES[zone]:
        im = fn().render()
        if name in GLOWS and GLOWS[name]: im = glow(GLOWS[name], steps=((1, 120), (2, 50)))(pad(im, 3))
        out.append((name, im, rad))
    return out

def pad(im, n):
    o = Image.new('RGBA', (im.width + 2 * n, im.height + 2 * n), (0, 0, 0, 0)); o.alpha_composite(im, (n, n)); return o
