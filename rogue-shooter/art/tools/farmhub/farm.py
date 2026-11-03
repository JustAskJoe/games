import random, math, json, sys
import numpy as np
from PIL import Image, ImageDraw

def hx(s):
    s = s.lstrip('#'); return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

P = {k: hx(v) for k, v in dict(
    out='#2b1d14',
    g0='#5ea23c', g1='#529434', g2='#3f7a28', g3='#6cb046', g4='#93cf63', g5='#478a2e',
    d0='#d2a96c', d1='#b88e57', d2='#e4c48c', d3='#9c7446',
    s0='#6e4529', s1='#55331e', s2='#86573a', s3='#7c4f30',
    w0='#9a6436', w1='#6e4322', w2='#c08550', w3='#4e2e16',
    st0='#9a9aa4', st1='#6d6d78', st2='#c4c4cc', st3='#4e4e58',
    wa0='#4a98d8', wa1='#3577bb', wa2='#8ccaf2', wa3='#e6f6ff',
    sand='#e6d29a', sand1='#cdb47c', sand2='#f2e4b8',
    red0='#c0402f', red1='#8e2c22', red2='#df6448',
    white='#f2ece0', white1='#cfc6b4',
    leaf0='#3f8a34', leaf1='#2c6626', leaf2='#57a940', leaf3='#80c656', leaf4='#b6e07e',
    trunk='#7a4a28', trunk1='#5a3418',
    pu0='#7d4fb0', pu1='#58338a', pu2='#a27ad4', pu3='#3e2266',
    teal='#5fe0c8', teal1='#2fa894', glow='#fff2a8',
    orange='#f08a2a', orange1='#c85a18', yellow='#ffd447', ember='#ff5a1e',
    sl0='#56647e', sl1='#3c4760', sl2='#7686a2',
    gr0='#4f9a6a', gr1='#38734e', gr2='#74c08c',
    pk0='#f4a6c6', pk1='#d97aa6', pk2='#ffd0e2', pk3='#b65a86',
    rf0='#7a5442', rf1='#5c3c2e', rf2='#9a6c56',
    cream='#efe2c4', cream1='#d6c4a0',
    gold='#ffcc44', gold1='#c89220',
    hay='#e8c45a', hay1='#c9a03c',
    smoke='#d8d8de', smoke1='#b4b4be',
    blue='#4a78c8', blue1='#33559a',
).items()}
SH = (0.62, 0.66, 0.80)

def col(c):
    if isinstance(c, tuple): return c
    return hx(c) if c.startswith('#') else P[c]


class Cv:
    def __init__(s, w, h, seed=1):
        s.W, s.H = w, h
        s.img = Image.new('RGB', (w, h), P['g0'])
        s.d = ImageDraw.Draw(s.img)
        s.rng = random.Random(seed)
        s.labels = []

    def _sync(s, a):
        s.img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)); s.d = ImageDraw.Draw(s.img)

    def r(s, x, y, w, h, c):
        if w <= 0 or h <= 0: return
        s.d.rectangle([int(x), int(y), int(x + w - 1), int(y + h - 1)], fill=col(c))

    def p(s, x, y, c): s.d.point((int(x), int(y)), fill=col(c))

    def e(s, cx, cy, rx, ry, c):
        s.d.ellipse([int(cx - rx), int(cy - ry), int(cx + rx), int(cy + ry)], fill=col(c))

    def poly(s, pts, c, o=None):
        s.d.polygon([(int(round(a)), int(round(b))) for a, b in pts], fill=col(c), outline=col(o) if o else None)

    def line(s, pts, c, w=1):
        s.d.line([(int(round(a)), int(round(b))) for a, b in pts], fill=col(c), width=w)

    def mask(s, fn):
        m = Image.new('L', (s.W, s.H), 0); fn(ImageDraw.Draw(m)); return np.array(m) > 0

    def tint(s, m, mul=SH):
        a = np.array(s.img).astype(np.float32); a[m] *= np.array(mul); s._sync(a)

    def shadow_e(s, cx, cy, rx, ry):
        s.tint(s.mask(lambda d: d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)))

    def shadow_poly(s, pts):
        s.tint(s.mask(lambda d: d.polygon([(int(a), int(b)) for a, b in pts], fill=255)))

    def glow(s, cx, cy, r, c, k=0.45):
        a = np.array(s.img).astype(np.float32)
        y0, y1 = max(0, int(cy - r)), min(s.H, int(cy + r) + 1)
        x0, x1 = max(0, int(cx - r * 1.3)), min(s.W, int(cx + r * 1.3) + 1)
        yy, xx = np.mgrid[y0:y1, x0:x1]
        dd = np.sqrt(((xx - cx) / 1.3) ** 2 + (yy - cy) ** 2) / r
        f = np.clip(1 - dd, 0, 1)
        f = np.floor(f * 4) / 4 * k
        sub = a[y0:y1, x0:x1]
        a[y0:y1, x0:x1] = sub * (1 - f[..., None]) + np.array(col(c)) * f[..., None]
        s._sync(a)

    def spr(s, grid, pal, x, y, flip=False, k=1):
        h = len(grid); w = max(len(r) for r in grid)
        for j, row in enumerate(grid):
            for i, ch in enumerate(row):
                if ch in pal:
                    xx = x + ((w - 1 - i) if flip else i) * k
                    s.r(xx, y + j * k, k, k, pal[ch])

    def label(s, name, x, y):
        s.labels.append({'name': name, 'x': x / s.W, 'y': y / s.H})


def shift(m, dx, dy):
    o = np.zeros_like(m)
    H, W = m.shape
    ys = slice(max(dy, 0), H + min(dy, 0)); yd = slice(max(-dy, 0), H + min(-dy, 0))
    xs = slice(max(dx, 0), W + min(dx, 0)); xd = slice(max(-dx, 0), W + min(-dx, 0))
    o[ys, xs] = m[yd, xd]
    return o

def dilate(m, n=1):
    for _ in range(n): m = m | shift(m, 1, 0) | shift(m, -1, 0) | shift(m, 0, 1) | shift(m, 0, -1)
    return m

def erode(m, n=1):
    for _ in range(n): m = m & shift(m, 1, 0) & shift(m, -1, 0) & shift(m, 0, 1) & shift(m, 0, -1)
    return m

# ---------------------------------------------------------------- terrain

def grass(c, flowers=110):
    rng = c.rng
    a = np.array(c.img)
    # soft mottling
    for _ in range(int(c.W * c.H / 1100)):
        x, y = rng.randrange(c.W), rng.randrange(c.H)
        c.e(x, y, rng.randint(6, 22), rng.randint(3, 9), rng.choice(['g1', 'g3', 'g1', 'g5']))
    for _ in range(int(c.W * c.H / 120)):
        x, y = rng.randrange(2, c.W - 2), rng.randrange(3, c.H)
        k = rng.random()
        if k < 0.7:
            cc = 'g2' if rng.random() < 0.6 else 'g5'
            c.p(x, y, cc); c.p(x - 1, y - 1, cc); c.p(x + 1, y - 2, cc); c.p(x, y - 1, cc)
        else:
            c.p(x, y, 'g4'); c.p(x + 1, y - 1, 'g3')
    for _ in range(flowers):
        x, y = rng.randrange(3, c.W - 3), rng.randrange(3, c.H - 3)
        fc = rng.choice(['white', 'yellow', 'pk0', 'wa2', 'white'])
        c.p(x, y - 1, fc); c.p(x - 1, y, fc); c.p(x + 1, y, fc); c.p(x, y + 1, fc); c.p(x, y, 'yellow' if fc != 'yellow' else 'orange')


def paint_path(c, m):
    rng = c.rng
    # rough edges
    noise = np.array([[rng.random() for _ in range(c.W)] for _ in range(c.H)])
    m = m | (dilate(m) & (noise < 0.35))
    m = m & ~(m & ~erode(m) & (noise > 0.85))
    a = np.array(c.img).astype(np.float32)
    lip = dilate(m) & ~m
    edge = m & ~erode(m)
    a[m] = P['d0']
    sp = m & (noise < 0.07); a[sp] = P['d1']
    sp = m & (noise > 0.95); a[sp] = P['d2']
    a[edge] = P['d1']
    a[lip] = P['g2']
    c._sync(a)
    ys, xs = np.nonzero(erode(m, 2))
    for i in rng.sample(range(len(ys)), min(len(ys), len(ys) // 140)):
        x, y = xs[i], ys[i]
        c.r(x, y, 2, 2, 'd3'); c.p(x, y, 'd2')
    return m


def paint_water(c, m):
    rng = c.rng
    a = np.array(c.img).astype(np.float32)
    bank = dilate(m, 2) & ~m
    shallow = m & ~erode(m, 3)
    deep = erode(m, 9)
    a[bank] = P['d1']
    a[dilate(m, 1) & ~m] = P['d3']
    a[m] = P['wa0']
    a[shallow] = P['wa2']
    a[m & ~erode(m, 1)] = P['wa3']
    a[deep] = P['wa1']
    c._sync(a)
    ys, xs = np.nonzero(erode(m, 4))
    for i in rng.sample(range(len(ys)), min(len(ys), len(ys) // 90)):
        x, y = xs[i], ys[i]
        L = rng.randint(3, 6)
        c.line([(x, y), (x + L, y)], 'wa2')
        if rng.random() < 0.3: c.p(x + L // 2, y - 1, 'wa3')


def lily(c, x, y):
    c.e(x, y, 4, 3, 'leaf1'); c.e(x, y - 1, 3, 2, 'leaf2'); c.p(x + 1, y - 2, 'leaf3')
    c.line([(x, y), (x + 3, y - 1)], 'wa1')
    if c.rng.random() < 0.5:
        c.p(x - 1, y - 2, 'pk2'); c.p(x - 2, y - 2, 'pk0'); c.p(x - 1, y - 3, 'pk0')

# ---------------------------------------------------------------- nature

def tree(c, x, y, kind='oak', s=1.0):
    rng = c.rng
    pal = {
        'oak': ('out', 'leaf1', 'leaf0', 'leaf2', 'leaf3', 'leaf4'),
        'blossom': ('pk3', 'pk1', 'pk0', 'pk0', 'pk2', 'white'),
        'dark': ('out', '#21501f', '#2f6a2a', '#3f8a34', '#57a940', '#80c656'),
        'fruit': ('out', 'leaf1', 'leaf0', 'leaf2', 'leaf3', 'leaf4'),
    }[kind]
    pal = tuple(col(p) if isinstance(p, str) and p in P else hx(p) if isinstance(p, str) else p for p in pal)
    R = 14 * s
    c.shadow_e(x + 5 * s, y + 1, R + 2, 6 * s)
    c.r(x - 3 * s, y - 13 * s, 7 * s, 14 * s, 'trunk1')
    c.r(x - 2 * s, y - 13 * s, 5 * s, 14 * s, 'trunk')
    c.r(x - 2 * s, y - 13 * s, 1, 14 * s, '#9a6236')
    c.r(x - 6 * s, y - 2, 4, 3, 'trunk1'); c.r(x + 3 * s, y - 2, 4, 3, 'trunk1')
    cy = y - 28 * s
    blobs = [(0, 0, 14), (-11, 5, 10), (11, 5, 10), (-7, -9, 10), (7, -9, 10), (0, -14, 8), (0, 8, 10)]
    for dx, dy, r in blobs: c.e(x + dx * s, cy + dy * s, r * s + 1, r * s + 1, pal[0])
    for dx, dy, r in blobs: c.e(x + dx * s, cy + dy * s, r * s, r * s, pal[1])
    for dx, dy, r in blobs: c.e(x + (dx - 1) * s, cy + (dy - 2) * s, (r - 2) * s, (r - 2) * s, pal[2])
    for dx, dy, r in blobs:
        if r > 8: c.e(x + (dx - 3) * s, cy + (dy - 4) * s, (r - 6) * s, (r - 6) * s, pal[3])
    for _ in range(int(16 * s)):
        a = rng.random() * math.pi * 2; rr = rng.random() * 14 * s
        px, py = x + math.cos(a) * rr - 3, cy + math.sin(a) * rr * 0.8 - 4
        c.p(px, py, pal[4]); c.p(px + 1, py, pal[3])
    for _ in range(int(14 * s)):
        a = rng.random() * math.pi * 2; rr = 6 * s + rng.random() * 9 * s
        px, py = x + math.cos(a) * rr, cy + math.sin(a) * rr * 0.8 + 3
        c.p(px, py, pal[1]); c.p(px + 1, py + 1, pal[1])
    if kind == 'blossom':
        for _ in range(10):
            c.p(x + rng.randint(-18, 18), y + rng.randint(-2, 6), 'pk0')
    if kind == 'fruit':
        for _ in range(7):
            a = rng.random() * math.pi * 2; rr = rng.random() * 12 * s
            px, py = x + math.cos(a) * rr, cy + math.sin(a) * rr * 0.8
            c.r(px, py, 2, 2, 'red0'); c.p(px, py, 'red2')


def pine(c, x, y, s=1.0):
    c.shadow_e(x + 5, y + 1, 12 * s, 5 * s)
    c.r(x - 2, y - 8, 5, 9, 'trunk1'); c.r(x - 1, y - 8, 3, 9, 'trunk')
    tiers = [(15, 14, -6), (13, 13, -15), (10, 12, -24), (7, 10, -32)]
    for w, h, yo in tiers:
        w *= s; h *= s; yo *= s
        c.poly([(x - w - 1, y + yo + 1), (x + w + 1, y + yo + 1), (x, y + yo - h - 1)], 'out')
        c.poly([(x - w, y + yo), (x + w, y + yo), (x, y + yo - h)], '#2f6a2a')
        c.poly([(x - w + 2, y + yo - 1), (x, y + yo - 1), (x, y + yo - h + 2)], '#3f8a34')
        c.line([(x - w + 3, y + yo - 1), (x - 2, y + yo - h + 5)], '#57a940')


def bush(c, x, y, berries=False):
    c.shadow_e(x + 3, y + 1, 9, 3)
    for dx, dy, r in [(-5, -4, 5), (5, -4, 5), (0, -7, 6)]: c.e(x + dx, y + dy, r + 1, r + 1, 'out')
    for dx, dy, r in [(-5, -4, 5), (5, -4, 5), (0, -7, 6)]: c.e(x + dx, y + dy, r, r, 'leaf1')
    for dx, dy, r in [(-5, -4, 5), (5, -4, 5), (0, -7, 6)]: c.e(x + dx - 1, y + dy - 1, r - 2, r - 2, 'leaf2')
    c.p(x - 3, y - 10, 'leaf4'); c.p(x - 7, y - 7, 'leaf3'); c.p(x + 3, y - 8, 'leaf3')
    if berries:
        for dx, dy in [(-4, -5), (3, -6), (0, -9), (6, -3), (-7, -3)]: c.p(x + dx, y + dy, 'blue'); c.p(x + dx + 1, y + dy, 'wa2')


def rock(c, x, y, big=False):
    w, h = (9, 6) if big else (6, 4)
    c.shadow_e(x + 2, y + 1, w, 3)
    c.e(x, y - h, w + 1, h + 1, 'out'); c.e(x, y - h, w, h, 'st1'); c.e(x - 1, y - h - 1, w - 2, h - 2, 'st0'); c.r(x - w + 3, y - 2 * h + 2, 3, 1, 'st2')


def stump(c, x, y):
    c.shadow_e(x + 2, y + 1, 7, 3)
    c.r(x - 5, y - 6, 10, 7, 'trunk1'); c.r(x - 4, y - 6, 8, 6, 'trunk'); c.e(x, y - 7, 5, 2, 'w2'); c.e(x, y - 7, 2, 1, 'w0')


def flowers_patch(c, x, y, n=8, cols=('pk0', 'yellow', 'white')):
    for _ in range(n):
        px, py = x + c.rng.randint(-8, 8), y + c.rng.randint(-5, 5)
        fc = c.rng.choice(cols)
        c.p(px, py + 1, 'leaf1'); c.p(px, py, fc); c.p(px - 1, py, fc); c.p(px + 1, py, fc); c.p(px, py - 1, fc)

# ---------------------------------------------------------------- props

def fence_h(c, x0, x1, y, step=12):
    xs = list(range(int(x0), int(x1) + 1, step))
    if xs[-1] != int(x1): xs.append(int(x1))
    for a, b in zip(xs, xs[1:]):
        c.r(a, y - 8, b - a, 2, 'w0'); c.r(a, y - 6, b - a, 1, 'w1')
        c.r(a, y - 4, b - a, 2, 'w0'); c.r(a, y - 2, b - a, 1, 'w1')
    for a in xs: fence_post(c, a, y)


def fence_post(c, x, y):
    c.r(x - 2, y - 11, 4, 12, 'w3'); c.r(x - 1, y - 11, 2, 11, 'w2'); c.r(x - 1, y - 11, 2, 1, '#e0a670')


def fence_v(c, x, y0, y1, step=10):
    y0, y1 = int(y0), int(y1)
    for yy in range(int(y0), int(y1), step):
        c.r(x - 1, yy - 6, 2, step, 'w0'); c.r(x + 1, yy - 6, 1, step, 'w1')
        fence_post(c, x, yy)
    fence_post(c, x, y1)


def lamp(c, x, y):
    c.shadow_e(x + 3, y + 1, 4, 2)
    c.r(x - 1, y - 20, 3, 21, 'st3'); c.r(x, y - 20, 1, 20, 'st1')
    c.r(x - 3, y - 26, 7, 7, 'out'); c.r(x - 2, y - 25, 5, 5, 'yellow'); c.p(x - 1, y - 24, 'glow')
    c.r(x - 3, y - 27, 7, 2, 'st3')
    c.glow(x, y - 22, 16, 'glow', 0.35)


def well(c, x, y):
    c.shadow_e(x + 5, y + 1, 15, 5)
    c.e(x, y - 6, 12, 7, 'out'); c.e(x, y - 6, 11, 6, 'st1'); c.e(x, y - 8, 11, 5, 'st0'); c.e(x, y - 8, 8, 3, 'wa1'); c.e(x - 2, y - 9, 3, 1, 'wa2')
    c.r(x - 11, y - 28, 2, 20, 'w3'); c.r(x + 9, y - 28, 2, 20, 'w3')
    c.poly([(x - 15, y - 26), (x + 15, y - 26), (x + 10, y - 36), (x - 10, y - 36)], 'rf1', 'out')
    c.poly([(x - 13, y - 27), (x + 13, y - 27), (x + 9, y - 34), (x - 9, y - 34)], 'rf0')
    c.line([(x - 9, y - 31), (x + 9, y - 31)], 'rf2')
    c.line([(x, y - 26), (x, y - 15)], 'st3'); c.r(x - 2, y - 15, 5, 4, 'w0')


def scarecrow(c, x, y):
    c.shadow_e(x + 3, y + 1, 6, 2)
    c.r(x - 1, y - 24, 3, 25, 'w1')
    c.r(x - 10, y - 18, 21, 2, 'w1')
    c.r(x - 5, y - 20, 11, 10, 'blue1'); c.r(x - 4, y - 20, 9, 9, 'blue'); c.r(x - 1, y - 16, 2, 2, 'yellow')
    c.r(x - 10, y - 17, 3, 3, 'hay'); c.r(x + 8, y - 17, 3, 3, 'hay')
    c.r(x - 4, y - 28, 9, 8, 'cream1'); c.r(x - 3, y - 27, 7, 6, 'cream'); c.p(x - 1, y - 25, 'out'); c.p(x + 2, y - 25, 'out'); c.line([(x - 1, y - 22), (x + 2, y - 22)], 'w1')
    c.r(x - 8, y - 29, 17, 2, 'hay1'); c.r(x - 4, y - 33, 9, 4, 'hay'); c.r(x - 4, y - 30, 9, 1, 'red0')


def barrel(c, x, y, water=True):
    c.shadow_e(x + 3, y + 1, 6, 2)
    c.r(x - 5, y - 11, 10, 11, 'w3'); c.r(x - 4, y - 11, 8, 10, 'w0'); c.r(x - 4, y - 8, 8, 1, 'st3'); c.r(x - 4, y - 3, 8, 1, 'st3')
    c.e(x, y - 11, 4, 2, 'wa1' if water else 'w1'); c.p(x - 2, y - 12, 'wa2' if water else 'w2')


def crate(c, x, y):
    c.shadow_e(x + 3, y + 1, 6, 2)
    c.r(x - 5, y - 10, 10, 10, 'w3'); c.r(x - 4, y - 9, 8, 8, 'w2'); c.line([(x - 4, y - 9), (x + 3, y - 2)], 'w1'); c.r(x - 4, y - 9, 8, 1, '#e0a670')


def haybale(c, x, y):
    c.shadow_e(x + 3, y + 1, 9, 3)
    c.r(x - 8, y - 9, 16, 9, 'hay1'); c.r(x - 7, y - 9, 14, 8, 'hay'); c.r(x - 7, y - 9, 14, 2, '#f6dc86')
    c.line([(x - 3, y - 9), (x - 3, y - 1)], 'w1'); c.line([(x + 3, y - 9), (x + 3, y - 1)], 'w1')


def trough(c, x, y):
    c.shadow_e(x + 3, y + 1, 12, 3)
    c.r(x - 11, y - 7, 22, 7, 'w3'); c.r(x - 10, y - 7, 20, 6, 'w0'); c.r(x - 9, y - 6, 18, 3, 'wa0'); c.r(x - 8, y - 6, 6, 1, 'wa2')


# ---------------------------------------------------------------- crops & animals
CROPS = {
    'sprout': (['.g.g.', '..g..', '..d..'], {'g': 'leaf3', 'd': 'leaf1'}),
    'leafy': (['.gg.gg.', 'gGggGgg', '.gGgGg.', '..ggg..', '...d...'], {'g': 'leaf2', 'G': 'leaf3', 'd': 'leaf1'}),
    'tomato': (['..g.g..', '.gRgRg.', 'gRrgggR', '.gggRg.', 'gRgggg.', '.g.d.g.', '...d...'], {'g': 'leaf0', 'R': 'red0', 'r': 'red2', 'd': 'leaf1'}),
    'pumpkin': (['...g...', '..gd...', '.OOOOO.', 'OoOoOoO', 'OOoOoOO', '.OOOOO.'], {'g': 'leaf2', 'd': 'leaf1', 'O': 'orange1', 'o': 'orange'}),
    'wheat': (['y.y.y.y', 'Y.Y.Y.Y', 'y.y.y.y', 'g.g.g.g', 'g.g.g.g', 'g.g.g.g'], {'y': 'hay', 'Y': '#f6dc86', 'g': 'leaf2'}),
    'cabbage': (['..ggg..', '.gWWWg.', 'gWwWwWg', 'gWWwWWg', '.gWWWg.', '..ggg..'], {'g': 'leaf1', 'W': 'leaf3', 'w': 'leaf4'}),
    'berry': (['.ggggg.', 'gBgBggB', 'ggbgBgg', 'gBgggBg', '.ggBgg.', '...d...'], {'g': 'leaf0', 'B': 'blue', 'b': 'wa2', 'd': 'leaf1'}),
    'herb': (['p.p.p', 'gpgpg', '.ggg.', '..g..'], {'p': 'pu2', 'g': 'gr0'}),
}

def crop(c, kind, x, y):
    g, pal = CROPS[kind]
    pal = {k: col(v) for k, v in pal.items()}
    w = len(g[0])
    c.shadow_e(x + 2, y, w, 2)
    c.spr(g, pal, x - w, y - len(g) * 2, k=2)


def plot_bed(c, x, y, sz=18):
    c.r(x - 1, y - 1, sz + 2, sz + 2, 'w3'); c.r(x, y, sz, sz, 'w0'); c.r(x, y, sz, 1, 'w2')
    c.r(x + 2, y + 2, sz - 4, sz - 4, 's0')
    for k in range(4, sz - 3, 4): c.r(x + 3, y + k, sz - 6, 1, 's1')
    c.r(x + 2, y + 2, sz - 4, 1, 's3'); c.p(x + 4, y + 6, 's2'); c.p(x + sz - 6, y + 10, 's2')


ANIMALS = {
    'cow': (['.OOOOOOOOOO....', 'OWWBBWWWWWWOOO.', 'OWBBBWWWBBWOWWO', 'OWWBWWWWBBWOeWP', 'OWWWWWWWWWWOWPP', '.OWWWWWWWWWOOO.', '.OOOOOOOOOOO...', '..OL.OL..OL.OL.', '..OL.OL..OL.OL.', '..OO.OO..OO.OO.'],
            {'O': 'out', 'W': 'white', 'B': '#3a2e2a', 'e': 'out', 'P': 'pk1', 'L': 'white1'}),
    'cowb': (['.OOOOOOOOOO....', 'OBBWWBBBBBBOOO.', 'OBBBBBBWWBBOBBO', 'OBWWBBBBBBBOeBP', 'OBBBBBBBBBBOBPP', '.OBBBBBBBBBOOO.', '.OOOOOOOOOOO...', '..OL.OL..OL.OL.', '..OL.OL..OL.OL.', '..OO.OO..OO.OO.'],
             {'O': 'out', 'W': 'white', 'B': '#8a5a36', 'e': 'out', 'P': 'pk1', 'L': '#6e4322'}),
    'chick': (['...RR..', '..OWWO.', '..OWeWY', 'OOWWWO.', 'OWWWWO.', '.OWWO..', '..Y.Y..'], {'O': 'out', 'W': 'white', 'R': 'red0', 'e': 'out', 'Y': 'orange'}),
    'chickb': (['...RR..', '..OBBO.', '..OBeBY', 'OOBBBO.', 'OBBBBO.', '.OBBO..', '..Y.Y..'], {'O': 'out', 'B': '#c07a3a', 'R': 'red0', 'e': 'out', 'Y': 'orange'}),
    'sheep': (['.OOOOOOO....', 'OwwwwwwwOOO.', 'OwWwwWwwODDO', 'OwwwwwwwODeD', 'OwwWwwwwwODO', '.OwwwwwwO...', '..OD.OD.....', '..OD.OD.....'],
              {'O': 'out', 'w': 'white', 'W': 'white1', 'D': '#4a3a34', 'e': 'white'}),
    'pig': (['..O.....O..', '.OPO...OPO.', 'OPPPPPPPPPO', 'OPPPPPPPePO', 'OPPPPPPPPpp', '.OPPPPPPPO.', '..OP.OP.O..'],
            {'O': 'out', 'P': 'pk0', 'p': 'pk1', 'e': 'out'}),
}

def animal(c, kind, x, y, flip=False):
    g, pal = ANIMALS[kind]
    pal = {k: col(v) for k, v in pal.items()}
    w = len(g[0])
    c.shadow_e(x + 3, y, w, 3)
    c.spr(g, pal, x - w, y - len(g) * 2, flip, k=2)

# ---------------------------------------------------------------- building helpers

def roof_side(c, x, y, w, h, base, dark, light, outline='out', step=5):
    x, y, w, h = int(x), int(y), int(w), int(h)
    c.r(x - 1, y - 1, w + 2, h + 2, outline)
    c.r(x, y, w, h, base)
    for k, yy in enumerate(range(y + step, y + h, step)):
        c.r(x, yy, w, 1, dark)
        off = 3 if k % 2 else 0
        for xx in range(x + off, x + w, 7): c.r(xx, yy - step + 1, 1, step - 1, dark)
    c.r(x, y, w, 2, light)
    c.r(x, y + h - 1, w, 1, dark)


def wall_planks(c, x, y, w, h, base, dark, light=None):
    x, y, w, h = int(x), int(y), int(w), int(h)
    c.r(x, y, w, h, base)
    for xx in range(x + 3, x + w, 4): c.r(xx, y, 1, h, dark)
    if light: c.r(x, y, 1, h, light)


def wall_stone(c, x, y, w, h, base='st0', dark='st1', light='st2'):
    x, y, w, h = int(x), int(y), int(w), int(h)
    c.r(x, y, w, h, base)
    for k, yy in enumerate(range(y, y + h, 5)):
        c.r(x, yy, w, 1, dark)
        off = 4 if k % 2 else 0
        for xx in range(x + off, x + w, 8):
            c.r(xx, yy, 1, 5, dark)
            if c.rng.random() < 0.5: c.r(xx + 1, yy + 1, 2, 1, light)


def window(c, x, y, w=8, h=8, glass='wa2', lit=None):
    c.r(x - 1, y - 1, w + 2, h + 2, 'out'); c.r(x, y, w, h, 'w1')
    c.r(x + 1, y + 1, w - 2, h - 2, lit or glass)
    c.r(x + w // 2, y + 1, 1, h - 2, 'w1'); c.r(x + 1, y + h // 2, w - 2, 1, 'w1')
    c.p(x + 1, y + 1, 'wa3' if not lit else 'glow')
    c.r(x - 1, y + h, w + 2, 2, 'w2')


def door(c, x, y, w=10, h=14, base='w0', dark='w1'):
    c.r(x - 1, y - 1, w + 2, h + 1, 'out'); c.r(x, y, w, h, base)
    for xx in range(x + 3, x + w, 3): c.r(xx, y, 1, h, dark)
    c.p(x + w - 3, y + h // 2, 'gold')


def eave_shadow(c, x, y, w, n=3):
    x, y, w = int(x), int(y), int(w)
    c.tint(c.mask(lambda d: d.rectangle([x, y, x + w - 1, y + n - 1], fill=255)))


def side_building(c, x, y, w, wall_h, roof_h, roof, wall_fn):
    """x,y = front-left ground point."""
    c.shadow_poly([(x + w, y), (x + w + 10, y - 6), (x + w + 10, y - wall_h - roof_h + 4), (x + w, y - wall_h - roof_h)])
    c.shadow_e(x + w / 2 + 4, y + 1, w / 2 + 4, 4)
    yw = y - wall_h
    c.r(x - 1, yw - 1, w + 2, wall_h + 1, 'out')
    wall_fn(x, yw, w, wall_h)
    roof_side(c, x - 4, yw - roof_h, w + 8, roof_h + 1, *roof)
    eave_shadow(c, x, yw + 1, w, 3)
    return yw

# ---------------------------------------------------------------- buildings

def b_barn(c, x, y):
    w, wh = 76, 36
    yw = y - wh
    prof = [(0, 0), (10, -16), (38, -27), (66, -16), (76, 0)]
    depth = 24
    pts = [(x + px, yw + py) for px, py in prof]
    c.shadow_poly([(x + w, y), (x + w + 12, y - 8), (x + w + 12, yw - 30), (x + w - 4, yw - 8)])
    c.shadow_e(x + w / 2 + 4, y + 1, w / 2 + 6, 4)
    # roof planes behind the facade
    roof = [('rf2', 'rf0'), ('rf0', 'rf1'), ('rf1', 'rf1'), ('rf1', 'rf1')]
    ext = [(pts[0][0] - 4, pts[0][1] + 3)] + [(a, b - 2) for a, b in pts[1:-1]] + [(pts[-1][0] + 4, pts[-1][1] + 3)]
    for i in range(4):
        (ax, ay), (bx, by) = ext[i], ext[i + 1]
        poly = [(ax, ay), (bx, by), (bx, by - depth), (ax, ay - depth)]
        c.poly([(px, py) for px, py in poly], roof[i][1], 'out')
        cc = 'rf2' if i < 2 else 'rf0'
        for k in range(4, depth, 4):
            c.line([(ax + 1, ay - k), (bx - 1, by - k)], 'rf1' if i < 2 else 'out')
        c.line([(ax, ay - depth + 1), (bx, by - depth + 1)], cc)
    # facade
    face = [(x, y)] + pts + [(x + w, y)]
    c.poly(face, 'red0', 'out')
    m = c.mask(lambda d: d.polygon([(int(a), int(b)) for a, b in face], fill=255))
    a = np.array(c.img)
    for xx in range(x + 3, x + w, 4): a[:, xx][m[:, xx]] = P['red1']
    c._sync(a)
    c.line(ext, 'white', 2)
    c.line([(x, yw + 1), (x, y - 1)], 'white', 2); c.line([(x + w - 1, yw + 1), (x + w - 1, y - 1)], 'white', 2)
    # loft
    c.r(x + 31, yw - 14, 14, 11, 'white'); c.r(x + 33, yw - 12, 10, 8, '#3a2618'); c.r(x + 33, yw - 7, 10, 3, 'hay'); c.p(x + 35, yw - 8, 'hay')
    # door
    dx, dw, dh = x + 23, 30, 26
    c.r(dx - 2, y - dh - 2, dw + 4, dh + 2, 'white')
    c.r(dx, y - dh, dw, dh, 'red1')
    for half in (0, 1):
        hx0 = dx + half * dw // 2
        c.line([(hx0 + 1, y - dh + 1), (hx0 + dw // 2 - 2, y - 2)], 'white', 2)
        c.line([(hx0 + dw // 2 - 2, y - dh + 1), (hx0 + 1, y - 2)], 'white', 2)
        c.r(hx0, y - dh, 1, dh, 'white') if half else None
    c.r(dx, y - dh, dw, 2, 'white'); c.r(dx, y - dh // 2, dw, 1, 'white')
    window(c, x + 7, yw + 8, 9, 8); window(c, x + 60, yw + 8, 9, 8)
    eave_shadow(c, x + 2, yw + 1, w - 4, 2)
    # lantern
    c.r(x + 38, yw - 20, 1, 1, 'out')
    c.label('Barn', x + w / 2, yw - 60)
    return (x + 38, y)


def b_forge(c, x, y):
    w, wh, rh = 78, 30, 26
    yw = y - wh
    # chimney back
    cx = x + 56
    c.shadow_poly([(x + w, y), (x + w + 10, y - 6), (x + w + 10, yw - rh - 20), (cx + 12, yw - rh - 26)])
    yw = side_building(c, x, y, w, wh, rh, ('sl0', 'sl1', 'sl2'), lambda X, Y, W_, H_: wall_stone(c, X, Y, W_, H_))
    c.r(cx - 1, yw - rh - 22, 16, 30, 'out'); wall_stone(c, cx, yw - rh - 21, 14, 28, 'st1', 'st3', 'st0')
    c.r(cx - 2, yw - rh - 24, 18, 4, 'out'); c.r(cx - 1, yw - rh - 23, 16, 2, 'st3')
    c.r(cx + 2, yw - rh - 23, 10, 1, 'ember')
    for i, (dx, dy, r) in enumerate([(7, -30, 4), (4, -38, 5), (9, -47, 6), (5, -57, 6)]):
        c.e(cx + dx, yw - rh + dy - 4, r + 1, r, 'smoke1'); c.e(cx + dx - 1, yw - rh + dy - 5, r, r - 1, 'smoke')
    # furnace arch
    fx, fw, fh = x + 10, 26, 22
    c.r(fx - 3, y - fh - 3, fw + 6, fh + 3, 'st3')
    c.e(fx + fw / 2, y - fh, fw / 2 + 3, 6, 'st3')
    c.r(fx, y - fh, fw, fh, 'orange1'); c.e(fx + fw / 2, y - fh, fw / 2, 4, 'orange1')
    c.r(fx + 3, y - fh + 4, fw - 6, fh - 4, 'orange'); c.r(fx + 7, y - fh + 9, fw - 14, fh - 9, 'yellow')
    c.r(fx + 10, y - 9, fw - 20, 5, 'glow')
    c.r(fx, y - 4, fw, 4, 'out'); [c.r(fx + 2 + k * 5, y - 4, 3, 2, 'ember') for k in range(5)]
    door(c, x + 52, y - 18, 12, 18)
    window(c, x + 41, yw + 8, 7, 7, lit='orange')
    c.glow(fx + fw / 2, y - 6, 26, 'orange', 0.4)
    c.label('Forge', x + w / 2, yw - rh - 10)
    return (x + 58, y)


def anvil(c, x, y):
    c.shadow_e(x + 3, y + 1, 9, 3)
    c.r(x - 5, y - 8, 10, 8, 'trunk1'); c.r(x - 4, y - 8, 8, 7, 'trunk'); c.e(x, y - 9, 5, 2, 'w2')
    c.r(x - 7, y - 16, 15, 5, 'out'); c.r(x - 6, y - 15, 13, 3, 'st1'); c.r(x - 6, y - 15, 13, 1, 'st0')
    c.r(x - 10, y - 15, 4, 2, 'st1'); c.r(x - 2, y - 12, 4, 3, 'st3')
    c.r(x + 1, y - 19, 7, 1, 'st0'); c.r(x + 7, y - 21, 2, 4, 'w1')


def ore_pile(c, x, y):
    c.shadow_e(x + 2, y + 1, 10, 3)
    for dx, dy, cc in [(-5, -3, 'st1'), (3, -3, 'st0'), (-1, -7, 'st1'), (5, -6, '#8a6a52'), (-6, -6, '#8a6a52')]:
        c.e(x + dx, y + dy, 4, 3, 'out'); c.e(x + dx, y + dy, 3, 2, cc)
    c.p(x - 1, y - 8, 'teal'); c.p(x + 4, y - 4, 'gold'); c.p(x - 5, y - 4, 'gold')


def b_alchemy(c, x, y):
    w, wh, rh = 62, 32, 24
    def wall(X, Y, W_, H_):
        c.r(X, Y, W_, H_, 'cream')
        for xx in range(X, X + W_, 15): c.r(xx, Y, 3, H_, 'w1')
        c.r(X, Y + H_ // 2 - 1, W_, 3, 'w1'); c.r(X, Y, W_, 2, 'w1'); c.r(X + W_ - 3, Y, 3, H_, 'w1')
        c.r(X, Y + H_ - 3, W_, 3, 'st1')
    yw = side_building(c, x, y, w, wh, rh, ('pu0', 'pu1', 'pu2'), wall)
    window(c, x + 7, yw + 7, 9, 9, lit='teal'); window(c, x + 46, yw + 7, 9, 9, lit='teal')
    door(c, x + 26, y - 18, 11, 18, 'pu1', 'pu3')
    c.r(x + 25, y - 21, 13, 2, 'teal1')
    # chimney with colored smoke
    c.r(x + 8, yw - rh - 6, 7, 10, 'out'); c.r(x + 9, yw - rh - 5, 5, 9, 'st1')
    for dx, dy, r, cc in [(12, -12, 3, 'teal'), (10, -19, 4, 'gr2'), (14, -27, 4, 'pu2')]:
        c.e(x + dx, yw - rh + dy, r, r - 1, cc)
    # tower
    tx, tw, th = x - 20, 24, 58
    c.shadow_e(tx + tw / 2 + 4, y + 1, 14, 4)
    c.r(tx - 1, y - th - 1, tw + 2, th + 1, 'out')
    for k in range(tw):
        f = k / tw
        cc = 'st2' if f < 0.25 else 'st0' if f < 0.7 else 'st1'
        c.r(tx + k, y - th, 1, th, cc)
    for yy in range(y - th + 6, y, 6): c.r(tx, yy, tw, 1, 'st1')
    c.e(tx + tw / 2, y - th + 18, 4, 5, 'out'); c.e(tx + tw / 2, y - th + 18, 3, 4, 'teal'); c.p(tx + tw / 2 - 1, y - th + 16, 'white')
    c.e(tx + tw / 2, y - 22, 4, 5, 'out'); c.e(tx + tw / 2, y - 22, 3, 4, 'teal')
    c.poly([(tx - 5, y - th + 1), (tx + tw + 5, y - th + 1), (tx + tw / 2, y - th - 30)], 'pu1', 'out')
    c.poly([(tx - 2, y - th - 1), (tx + tw / 2, y - th - 1), (tx + tw / 2, y - th - 27)], 'pu0')
    c.poly([(tx + 1, y - th - 3), (tx + 7, y - th - 3), (tx + tw / 2 - 1, y - th - 22)], 'pu2')
    c.r(tx + tw / 2 - 1, y - th - 36, 3, 6, 'gold1'); c.p(tx + tw / 2, y - th - 37, 'gold'); c.p(tx + tw / 2 - 2, y - th - 34, 'gold'); c.p(tx + tw / 2 + 2, y - th - 34, 'gold')
    c.glow(x + 11, yw + 11, 14, 'teal', 0.25); c.glow(x + 50, yw + 11, 14, 'teal', 0.25)
    c.label('Alchemy Lab', x + 20, y - th - 46)
    return (x + 31, y)


def cauldron(c, x, y):
    c.shadow_e(x + 3, y + 1, 10, 3)
    c.r(x - 9, y - 3, 3, 3, 'out'); c.r(x + 6, y - 3, 3, 3, 'out')
    c.e(x, y - 7, 10, 7, 'out'); c.e(x, y - 7, 9, 6, '#3a3442'); c.e(x - 3, y - 9, 3, 2, '#5a5468')
    c.e(x, y - 12, 9, 3, 'out'); c.e(x, y - 12, 7, 2, 'gr2'); c.p(x - 3, y - 13, 'leaf4')
    for dx, dy in [(-2, -17), (3, -20), (0, -24)]: c.e(x + dx, y + dy, 1, 1, 'gr2')
    c.r(x - 4, y - 2, 8, 2, 'ember'); c.p(x, y - 3, 'yellow')
    c.glow(x, y - 12, 14, 'gr2', 0.3)


def potion_shelf(c, x, y):
    c.shadow_e(x + 3, y + 1, 10, 3)
    c.r(x - 10, y - 20, 20, 20, 'w3'); c.r(x - 9, y - 19, 18, 18, 'w1')
    for sy in (y - 11, y - 2): c.r(x - 9, sy, 18, 2, 'w2')
    for i, cc in enumerate(['red0', 'teal', 'pu2', 'gold', 'gr2']):
        c.r(x - 8 + i * 4, y - 16, 2, 5, cc); c.p(x - 8 + i * 4, y - 17, 'cream')
    for i, cc in enumerate(['wa0', 'pk0', 'orange', 'teal']):
        c.r(x - 7 + i * 4, y - 7, 3, 5, cc)


def b_shrine(c, cx, y):
    pw, pd = 52, 26
    # platform
    c.shadow_e(cx + 5, y + 1, pw / 2 + 6, 5)
    c.r(cx - pw / 2 - 1, y - 12 - pd - 1, pw + 2, pd + 14, 'out')
    c.r(cx - pw / 2, y - 12 - pd, pw, pd, 'st2')
    for yy in range(y - 12 - pd + 6, y - 12, 6): c.r(cx - pw / 2, yy, pw, 1, 'st0')
    for xx in range(int(cx - pw / 2) + 8, int(cx + pw / 2), 8): c.r(xx, y - 12 - pd, 1, pd, 'st0')
    wall_stone(c, cx - pw / 2, y - 12, pw, 12, 'st1', 'st3', 'st0')
    for k in range(3):
        c.r(cx - 9 + k, y - 12 + k * 4, 18 - 2 * k, 4, 'st2' if k % 2 == 0 else 'st0'); c.r(cx - 9 + k, y - 9 + k * 4, 18 - 2 * k, 1, 'st1')
    # shrine house
    sy = y - 12 - 6
    sw = 30
    c.r(cx - sw / 2, sy - 26, sw, 26, 'st3')
    c.r(cx - sw / 2 + 2, sy - 24, sw - 4, 22, '#2a2a3a')
    for px in (cx - sw / 2, cx + sw / 2 - 4):
        c.r(px - 1, sy - 27, 6, 28, 'out'); c.r(px, sy - 26, 4, 26, 'white'); c.r(px + 3, sy - 26, 1, 26, 'white1')
    c.r(cx - 5, sy - 8, 10, 8, 'st0'); c.r(cx - 5, sy - 8, 10, 1, 'st2')
    c.e(cx, sy - 14, 5, 5, 'out'); c.e(cx, sy - 14, 4, 4, 'teal'); c.e(cx - 1, sy - 15, 2, 2, 'wa3')
    c.glow(cx, sy - 14, 22, 'teal', 0.5)
    roof_side(c, cx - sw / 2 - 6, sy - 38, sw + 12, 12, 'gr0', 'gr1', 'gr2')
    c.r(cx - sw / 2 - 8, sy - 28, 3, 2, 'gr1'); c.r(cx + sw / 2 + 5, sy - 28, 3, 2, 'gr1')
    c.r(cx - 1, sy - 45, 3, 7, 'gold1'); c.r(cx - 3, sy - 43, 7, 2, 'gold'); c.p(cx, sy - 46, 'gold')
    # braziers
    for bx in (cx - pw / 2 + 5, cx + pw / 2 - 5):
        c.r(bx - 3, y - 20, 6, 8, 'st3'); c.r(bx - 4, y - 22, 8, 3, 'st1')
        c.r(bx - 2, y - 26, 4, 4, 'orange'); c.r(bx - 1, y - 28, 2, 3, 'yellow'); c.p(bx, y - 29, 'glow')
        c.glow(bx, y - 24, 12, 'orange', 0.35)
    c.label('Shrine', cx, sy - 56)
    return (cx, y)


def b_training(c, x, y, w=118, h=74):
    # yard
    yt = y - h
    m = c.mask(lambda d: d.rounded_rectangle([x, yt, x + w, y], radius=10, fill=255))
    a = np.array(c.img).astype(np.float32)
    a[dilate(m) & ~m] = P['d3']; a[m] = P['sand']; a[m & ~erode(m, 2)] = P['sand1']
    c._sync(a)
    for _ in range(60):
        px, py = x + c.rng.randint(6, w - 6), yt + c.rng.randint(6, h - 6)
        c.p(px, py, c.rng.choice(['sand1', 'sand2']))
    # pavilion (back-left)
    px0, pw = x + 8, 46
    side_building(c, px0, yt + 34, pw, 18, 14, ('gr0', 'gr1', 'gr2'), lambda X, Y, W_, H_: (c.r(X, Y, W_, H_, '#3c3022'), c.r(X, Y + H_ - 4, W_, 4, 'w1')))
    for ppx in (px0, px0 + pw - 4):
        c.r(ppx, yt + 16, 4, 18, 'w3'); c.r(ppx + 1, yt + 16, 2, 18, 'w0')
    # weapon rack inside pavilion
    rx = px0 + 10
    c.r(rx, yt + 22, 26, 2, 'w2'); c.r(rx, yt + 30, 26, 2, 'w0')
    for k in range(5):
        xx = rx + 2 + k * 5
        c.r(xx, yt + 18, 1, 14, 'st2')
        c.r(xx - 1, yt + 27, 3, 1, 'gold1')
    c.p(rx + 2, yt + 17, 'st2'); c.p(rx + 12, yt + 16, 'st2'); c.r(rx + 21, yt + 16, 3, 2, 'st0')
    c.label('Training Grounds', x + w / 2, yt - 14)
    return (x + w / 2, y)


def dummy(c, x, y):
    c.shadow_e(x + 3, y + 1, 6, 2)
    c.r(x - 1, y - 24, 3, 25, 'w1')
    c.r(x - 9, y - 18, 19, 3, 'w1'); c.r(x - 9, y - 18, 19, 1, 'w0')
    c.e(x, y - 13, 6, 7, 'out'); c.e(x, y - 13, 5, 6, 'hay'); c.r(x - 5, y - 13, 11, 2, 'red0')
    for k in (-3, 0, 3): c.r(x + k, y - 18, 1, 3, 'hay1')
    c.e(x, y - 24, 4, 4, 'out'); c.e(x, y - 24, 3, 3, '#c9a77a'); c.p(x - 1, y - 25, 'out'); c.p(x + 1, y - 25, 'out')


def target(c, x, y):
    c.shadow_e(x + 3, y + 1, 7, 2)
    c.r(x - 6, y - 10, 2, 11, 'w1'); c.r(x + 4, y - 10, 2, 11, 'w1')
    c.e(x, y - 16, 9, 9, 'out'); c.e(x, y - 16, 8, 8, 'white'); c.e(x, y - 16, 6, 6, 'red0'); c.e(x, y - 16, 4, 4, 'white'); c.e(x, y - 16, 2, 2, 'gold')
    c.line([(x + 2, y - 17), (x + 7, y - 20)], 'w1'); c.p(x + 7, y - 21, 'white')
    c.line([(x - 3, y - 13), (x - 8, y - 15)], 'w1'); c.p(x - 8, y - 16, 'white')


def b_arena(c, cx, cy, rx=62, ry=40):
    wh = 12
    c.shadow_e(cx + 8, cy + wh + 2, rx + 6, ry + 4)
    c.e(cx, cy + wh, rx + 1, ry + 1, 'out')
    c.e(cx, cy + wh, rx, ry, 'st1')
    m = c.mask(lambda d: d.ellipse([cx - rx, cy + wh - ry, cx + rx, cy + wh + ry], fill=255)) & ~c.mask(lambda d: d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255))
    a = np.array(c.img)
    ys, xs = np.nonzero(m)
    for yy, xx in zip(ys, xs):
        if (xx + (yy // 4) * 4) % 8 == 0 or yy % 4 == 0: a[yy, xx] = P['st3']
    c._sync(a)
    c.e(cx, cy, rx + 1, ry + 1, 'out'); c.e(cx, cy, rx, ry, 'st2'); c.e(cx, cy, rx - 3, ry - 2, 'st0')
    c.e(cx, cy, rx - 8, ry - 6, 'out'); c.e(cx, cy, rx - 9, ry - 7, 'st3')
    m2 = c.mask(lambda d: d.ellipse([cx - rx + 9, cy - ry + 7, cx + rx - 9, cy + ry - 7], fill=255))
    m3 = c.mask(lambda d: d.ellipse([cx - rx + 10, cy - ry + 13, cx + rx - 10, cy + ry - 6], fill=255)) & m2
    a = np.array(c.img); a[m3] = P['sand']; c._sync(a)
    for _ in range(80):
        px, py = cx + c.rng.randint(-rx + 14, rx - 14), cy + c.rng.randint(-ry + 14, ry - 10)
        if m3[int(py), int(px)]: c.p(px, py, c.rng.choice(['sand1', 'sand2', 'sand1']))
    c.e(cx, cy + 4, 14, 8, 'sand1'); c.e(cx, cy + 4, 12, 7, 'sand'); c.e(cx, cy + 4, 2, 1, 'red1')
    # gate
    gx = cx - 9
    c.r(gx - 4, cy + ry - 6, 26, wh + 8, 'out'); c.r(gx - 3, cy + ry - 5, 24, wh + 6, 'st1')
    c.r(gx, cy + ry - 2, 18, wh + 3, 'w1'); [c.r(gx + k, cy + ry - 2, 1, wh + 3, 'w3') for k in range(3, 18, 4)]
    c.r(gx, cy + ry + 3, 18, 1, 'st3')
    for tx in (gx - 6, gx + 23):
        c.r(tx, cy + ry - 2, 2, 8, 'w3'); c.r(tx - 1, cy + ry - 5, 4, 3, 'orange'); c.p(tx, cy + ry - 6, 'yellow')
    # banners on rim
    for ang, cc in [(200, 'red0'), (235, 'gold'), (270, 'blue'), (305, 'gold'), (340, 'red0'), (160, 'blue'), (20, 'blue')]:
        t = math.radians(ang)
        bx, by = cx + math.cos(t) * (rx - 2), cy + math.sin(t) * (ry - 2)
        c.r(bx, by - 16, 1, 16, 'out')
        c.r(bx + 1, by - 16, 6, 7, cc); c.p(bx + 6, by - 10, (0, 0, 0)) if False else None
        c.p(bx + 4, by - 9, cc); c.p(bx + 2, by - 9, cc)
        c.p(bx, by - 17, 'gold')
    for gx2, gy2 in [(cx - 20, cy - 6), (cx + 22, cy + 10)]:
        c.r(gx2, gy2, 6, 1, 'st2'); c.p(gx2 - 1, gy2 - 1, 'st2')
    c.label('Arena', cx, cy - ry - 30)
    return (cx, cy + ry + wh)


def pen(c, x, y, w, h, gate_x=None, gate_w=18, top_gate=None):
    for _ in range(6):
        px, py = x + c.rng.randint(10, w - 10), y + c.rng.randint(10, h - 10)
        c.e(px, py, c.rng.randint(4, 9), c.rng.randint(2, 4), 'd1')
        c.e(px - 1, py - 1, c.rng.randint(2, 5), 1, 'd0')
    objs = []
    if top_gate is None:
        objs.append((y, lambda: fence_h(c, x, x + w, y)))
    else:
        objs.append((y, lambda: (fence_h(c, x, top_gate, y), fence_h(c, top_gate + gate_w, x + w, y))))
    if gate_x is None:
        objs.append((y + h, lambda: fence_h(c, x, x + w, y + h)))
    else:
        objs.append((y + h, lambda: (fence_h(c, x, gate_x, y + h), fence_h(c, gate_x + gate_w, x + w, y + h))))
    for yy in range(int(y), int(y + h), 10):
        objs.append((yy + 6, (lambda yy=yy: fence_v(c, x, yy + 6, min(yy + 16, y + h), 10))))
        objs.append((yy + 6, (lambda yy=yy: fence_v(c, x + w, yy + 6, min(yy + 16, y + h), 10))))
    return objs

# ---------------------------------------------------------------- scene

def field(c, x0, y0, rng, plots_out):
    sz, gap = 18, 6
    kinds = ['tomato', 'pumpkin', 'wheat', 'cabbage', 'berry', 'leafy', 'sprout', 'herb']
    objs = []
    for row in range(5):
        for colm in range(6):
            x, y = x0 + colm * (sz + gap), y0 + row * (sz + gap)
            plot_bed(c, x, y, sz)
            plots_out.append({'n': row * 6 + colm + 1, 'x': (x + sz / 2) / c.W, 'y': (y + sz / 2) / c.H, 'w': sz / c.W, 'h': sz / c.H})
            r = rng.random()
            if r < 0.14: continue
            k = kinds[(row + colm * 2 + int(r * 3)) % len(kinds)] if row < 4 else 'sprout' if r < 0.5 else 'leafy'
            objs.append((y + sz - 2, (lambda k=k, x=x, y=y: crop(c, k, x + sz // 2, y + sz - 2))))
    return objs, (x0 + 3 * (sz + gap), y0 - 10)


def scene(layout, seed=7, W=640, H=448):
    W, H = layout.get('W', W), layout.get('H', H)
    c = Cv(W, H, seed)
    rng = c.rng
    grass(c, flowers=layout.get('flowers', 120))
    pm = c.mask(lambda d: [(
        d.line(seg['pts'], fill=255, width=seg.get('w', 22)),
        [d.ellipse([px - seg.get('w', 22) / 2, py - seg.get('w', 22) / 2, px + seg.get('w', 22) / 2, py + seg.get('w', 22) / 2], fill=255) for px, py in seg['pts']]
    ) for seg in layout['paths']])
    paint_path(c, pm)
    for st in layout.get('stones', []):
        for k, (sx, sy) in enumerate(st):
            c.e(sx, sy, 5, 3, 'out'); c.e(sx, sy, 4, 2, 'st0'); c.p(sx - 2, sy - 1, 'st2')
    wm = None
    if layout.get('water'):
        def wdraw(d):
            for kind, *args in layout['water']:
                if kind == 'ellipse':
                    cx_, cy_, rx_, ry_ = args; d.ellipse([cx_ - rx_, cy_ - ry_, cx_ + rx_, cy_ + ry_], fill=255)
                if kind == 'line':
                    pts, w_ = args; d.line(pts, fill=255, width=w_)
                    for px, py in pts: d.ellipse([px - w_ / 2, py - w_ / 2, px + w_ / 2, py + w_ / 2], fill=255)
        wm = c.mask(wdraw)
        paint_water(c, wm)
        for lx, ly in layout.get('lilies', []): lily(c, lx, ly)
    if layout.get('cliffs'):
        paint_cliffs(c, layout['cliffs'], wm if wm is not None else np.zeros((H, W), bool))
    for st in layout.get('stairs', []): stairs(c, *st)
    objs = []
    labels_extra = []
    # ground-level buildings
    plots = []
    fx, fy = layout['field']
    fo, flab = field(c, fx, fy, rng, plots)
    objs += fo
    c.label('Crop Field (6×5)', flab[0], flab[1] - 6)
    tx, ty = layout['training']
    b_training(c, tx, ty)
    for i, (dx, dy) in enumerate([(70, -44), (88, -38), (104, -44)]):
        objs.append((ty + dy, (lambda dx=dx, dy=dy: dummy(c, tx + dx, ty + dy))))
    objs.append((ty - 12, lambda: target(c, tx + 92, ty - 12)))
    objs.append((ty - 10, lambda: (haybale(c, tx + 26, ty - 10))))
    objs.append((ty - 12, lambda: crate(c, tx + 44, ty - 12)))
    px_, py_, pw_, ph_, gx_, tg_ = layout['pen']
    objs += pen(c, px_, py_, pw_, ph_, gx_, 20, tg_)
    for kind, ax, ay, fl in layout['animals']:
        objs.append((ay, (lambda kind=kind, ax=ax, ay=ay, fl=fl: animal(c, kind, ax, ay, fl))))
    objs.append((py_ + 22, lambda: trough(c, px_ + 18, py_ + 22)))
    objs.append((py_ + ph_ - 8, lambda: haybale(c, px_ + pw_ - 16, py_ + ph_ - 8)))
    c.label('Animal Pen', px_ + pw_ / 2, py_ + ph_ + 14)
    # buildings
    bx, by = layout['barn']; objs.append((by, lambda: b_barn(c, bx, by)))
    fx2, fy2 = layout['forge']; objs.append((fy2, lambda: b_forge(c, fx2, fy2)))
    objs.append((fy2 + 14, lambda: anvil(c, fx2 + 92, fy2 + 14)))
    objs.append((fy2 + 6, lambda: barrel(c, fx2 + 84, fy2 + 6)))
    objs.append((fy2 + 16, lambda: ore_pile(c, fx2 - 8, fy2 + 16)))
    ax2, ay2 = layout['alchemy']; objs.append((ay2, lambda: b_alchemy(c, ax2, ay2)))
    objs.append((ay2 + 12, lambda: cauldron(c, ax2 + 76, ay2 + 12)))
    objs.append((ay2 + 2, lambda: potion_shelf(c, ax2 + 92, ay2 + 2)))
    sx2, sy2 = layout['shrine']; objs.append((sy2, lambda: b_shrine(c, sx2, sy2)))
    ar = layout['arena']; objs.append((ar[1] + 40, lambda: b_arena(c, *ar)))
    if layout.get('cabin'):
        cx_, cy_ = layout['cabin']; objs.append((cy_, lambda: b_cabin(c, cx_, cy_)))
    for seg in layout.get('pickets', []):
        objs.append((seg[2], (lambda seg=seg: picket_h(c, *seg))))
    for kind, x, y in layout['props']:
        fn = {'tree': lambda x=x, y=y: tree(c, x, y), 'blossom': lambda x=x, y=y: tree(c, x, y, 'blossom'), 'fruit': lambda x=x, y=y: tree(c, x, y, 'fruit'),
              'dark': lambda x=x, y=y: tree(c, x, y, 'dark'), 'pine': lambda x=x, y=y: pine(c, x, y), 'bush': lambda x=x, y=y: bush(c, x, y),
              'berrybush': lambda x=x, y=y: bush(c, x, y, True), 'rock': lambda x=x, y=y: rock(c, x, y), 'bigrock': lambda x=x, y=y: rock(c, x, y, True),
              'stump': lambda x=x, y=y: stump(c, x, y), 'lamp': lambda x=x, y=y: lamp(c, x, y), 'well': lambda x=x, y=y: well(c, x, y),
              'scarecrow': lambda x=x, y=y: scarecrow(c, x, y), 'flowers': lambda x=x, y=y: flowers_patch(c, x, y), 'barrel': lambda x=x, y=y: barrel(c, x, y),
              'crate': lambda x=x, y=y: crate(c, x, y), 'hay': lambda x=x, y=y: haybale(c, x, y),
              'tallgrass': lambda x=x, y=y: tallgrass(c, x, y), 'log': lambda x=x, y=y: log(c, x, y), 'shroom': lambda x=x, y=y: mushrooms(c, x, y),
              'firewood': lambda x=x, y=y: firewood(c, x, y), 'bench': lambda x=x, y=y: bench(c, x, y), 'flowerbed': lambda x=x, y=y: flowerbed(c, x, y),
              'boulder': lambda x=x, y=y: rock(c, x, y, True), 'sapling': lambda x=x, y=y: tree(c, x, y, 'oak', 0.7), 'pinesm': lambda x=x, y=y: pine(c, x, y, 0.75)}[kind]
        objs.append((y, fn))
    for seg in layout.get('fences', []):
        kind, *args = seg
        if kind == 'h': objs.append((args[2], lambda args=args: fence_h(c, *args)))
        else:
            x, y0, y1 = args
            for yy in range(int(y0), int(y1), 10):
                objs.append((yy + 6, (lambda yy=yy, x=x, y1=y1: fence_v(c, x, yy + 6, min(yy + 16, y1), 10))))
    if layout.get('bridge'):
        bx0, by0, bw0, bh0 = layout['bridge']
        c.shadow_e(bx0 + bw0 / 2 + 3, by0 + bh0 + 1, bw0 / 2 + 2, 3)
        c.r(bx0 - 1, by0 - 1, bw0 + 2, bh0 + 2, 'out'); c.r(bx0, by0, bw0, bh0, 'w0')
        for k in range(bx0 + 4, bx0 + bw0, 5): c.r(k, by0, 1, bh0, 'w1')
        c.r(bx0, by0, bw0, 2, 'w2'); c.r(bx0, by0 + bh0 - 2, bw0, 2, 'w3')
        objs.append((by0 + 1, lambda: fence_h(c, bx0, bx0 + bw0, by0 + 1, 8)))
        objs.append((by0 + bh0 + 2, lambda: fence_h(c, bx0, bx0 + bw0, by0 + bh0 + 2, 8)))
    objs.sort(key=lambda o: o[0])
    for _, fn in objs: fn()
    return c, plots


def frame(c, scale=2):
    return c.img.resize((c.W * scale, c.H * scale), Image.NEAREST)


# ---------------------------------------------------------------- cliffs & extras
CL = {k: hx(v) for k, v in dict(c0='#a07c58', c1='#86643f', c2='#6a4c30', c3='#bf9a72', c4='#4e3824', moss='#4f8a34').items()}

def paint_cliffs(c, cliffs, wm):
    H_, W_ = c.H, c.W
    colnoise = np.array([c.rng.random() for _ in range(W_)])
    colnoise2 = np.array([c.rng.random() for _ in range(W_)])
    for pts, h in cliffs:
        M = c.mask(lambda d: d.polygon([(int(x), int(y)) for x, y in pts], fill=255))
        depth = np.zeros((H_, W_), int); F = np.zeros_like(M)
        for k in range(1, h + 1):
            s_ = shift(M, 0, k) & ~M & ~F
            depth[s_] = k; F |= s_
        a = np.array(c.img).astype(np.float32)
        S = (shift(F, 0, 1) | shift(F, 0, 2) | shift(F, 0, 3) | shift(F, 0, 4) | shift(F, 3, 2)) & ~F & ~M
        a[S] *= np.array(SH)
        ys, xs = np.nonzero(F)
        k = depth[ys, xs]
        cn = colnoise[xs]; cn2 = colnoise2[xs]
        out = np.tile(np.array(CL['c0'], np.float32), (len(ys), 1))
        band = (k + (cn2 * 3).astype(int)) % 7
        out[band == 0] = CL['c1']
        out[(band == 1) & (cn > 0.5)] = CL['c3']
        out[cn < 0.14] = CL['c2']
        out[(cn > 0.88) & (band < 3)] = CL['c3']
        lower = k > h * 0.7
        out[lower] = out[lower] * 0.86
        out[k <= 2] = P['g2']
        out[(k == 3) & (cn < 0.35)] = P['g2']
        out[(k == 3) & (cn >= 0.35)] = CL['c4']
        bottom = ~F[np.minimum(ys + 1, H_ - 1), xs]
        out[bottom] = CL['c4']
        a[ys, xs] = out
        top = M & shift(F, 0, -1)
        a[top] = P['g3']
        # waterfall
        cur = wm & M & shift(F, 0, -1)
        fall = np.zeros_like(F)
        for kk in range(1, h + 1):
            cur = shift(cur, 0, 1) & F; fall |= cur
        if fall.any():
            fy, fx = np.nonzero(fall)
            fo = np.tile(np.array(P['wa2'], np.float32), (len(fy), 1))
            fo[(fx % 4) == 0] = P['wa3']; fo[(fx % 5) == 2] = P['wa0']
            a[fy, fx] = fo
            foam = dilate(shift(fall, 0, 1) & ~F, 2) & ~F & ~M
            a[foam & wm] = P['wa3']
        c._sync(a)
        if fall.any():
            fy, fx = np.nonzero(shift(fall, 0, 1) & ~F)
            for i in range(0, len(fx), 3):
                c.e(fx[i] + c.rng.randint(-2, 2), fy[i] + c.rng.randint(1, 4), 2, 1, 'white')


def stairs(c, x, y, w, h):
    c.r(x - 2, y, w + 4, h, CL['c4'])
    for k, yy in enumerate(range(y, y + h, 4)):
        c.r(x, yy, w, 3, 'st2' if k % 2 == 0 else 'st0'); c.r(x, yy + 3, w, 1, 'st1')
    c.r(x - 2, y, 2, h, 'st1'); c.r(x + w, y, 2, h, 'st3')


def picket_h(c, x0, x1, y):
    c.r(x0, y - 7, x1 - x0, 1, 'white1'); c.r(x0, y - 3, x1 - x0, 1, 'white1')
    for xx in range(int(x0), int(x1) + 1, 4):
        c.r(xx - 1, y - 9, 3, 10, 'white1'); c.r(xx, y - 10, 1, 10, 'white'); c.p(xx, y - 11, 'white')


def tallgrass(c, x, y):
    for i in range(6):
        bx = x + c.rng.randint(-6, 6); hh = c.rng.randint(5, 10); lean = c.rng.randint(-2, 2)
        c.line([(bx, y), (bx + lean, y - hh)], 'g2' if i % 2 else 'leaf1')
        c.p(bx + lean, y - hh, 'g4' if i % 3 == 0 else 'g3')


def log(c, x, y):
    c.shadow_e(x + 3, y + 1, 13, 3)
    c.r(x - 12, y - 7, 22, 7, 'trunk1'); c.r(x - 11, y - 7, 20, 5, 'trunk'); c.r(x - 11, y - 7, 20, 1, '#9a6236')
    c.e(x + 10, y - 4, 3, 4, 'trunk1'); c.e(x + 10, y - 4, 2, 3, 'w2'); c.p(x + 10, y - 4, 'w0')
    c.p(x - 6, y - 8, 'leaf2'); c.p(x - 5, y - 8, 'leaf3')


def mushrooms(c, x, y):
    for dx, dy in [(0, 0), (5, 2), (-4, 3)]:
        c.r(x + dx, y + dy - 3, 2, 3, 'cream'); c.r(x + dx - 2, y + dy - 5, 6, 2, 'red0'); c.p(x + dx - 1, y + dy - 5, 'white'); c.p(x + dx + 2, y + dy - 4, 'white')


def firewood(c, x, y):
    c.shadow_e(x + 3, y + 1, 10, 3)
    for row, n in enumerate([4, 3, 2]):
        for i in range(n):
            px, py = x - n * 3 + 3 + i * 6, y - 3 - row * 5
            c.e(px, py, 3, 3, 'trunk1'); c.e(px, py, 2, 2, 'w2'); c.p(px, py, 'w0')


def bench(c, x, y):
    c.shadow_e(x + 3, y + 1, 10, 2)
    c.r(x - 9, y - 6, 2, 6, 'w3'); c.r(x + 7, y - 6, 2, 6, 'w3')
    c.r(x - 10, y - 8, 20, 3, 'w0'); c.r(x - 10, y - 8, 20, 1, 'w2'); c.r(x - 10, y - 13, 20, 2, 'w0'); c.r(x - 9, y - 11, 1, 3, 'w3'); c.r(x + 8, y - 11, 1, 3, 'w3')


def flowerbed(c, x, y):
    c.r(x - 12, y - 6, 24, 7, 'w3'); c.r(x - 11, y - 5, 22, 5, 's0')
    for i in range(6):
        fx = x - 9 + i * 4; fc = ['pk0', 'yellow', 'red2', 'pu2', 'white', 'pk0'][i]
        c.p(fx, y - 5, 'leaf1'); c.p(fx, y - 7, fc); c.p(fx - 1, y - 6, fc); c.p(fx + 1, y - 6, fc); c.p(fx, y - 6, 'yellow')


def b_cabin(c, x, y):
    w, wh, rh = 72, 30, 24
    def logs(X, Y, W_, H_):
        c.r(X, Y, W_, H_, '#9a6a42')
        for yy in range(Y + 1, Y + H_ - 3, 5):
            c.r(X, yy + 3, W_, 1, '#5e3a1e'); c.r(X, yy, W_, 1, '#b88456')
        for ex in (X, X + W_ - 4):
            for yy in range(Y + 2, Y + H_ - 3, 5):
                c.r(ex, yy, 4, 4, '#5e3a1e'); c.r(ex + 1, yy, 2, 3, '#d8a26c'); c.p(ex + 1, yy + 1, '#9a6a42')
        c.r(X, Y + H_ - 4, W_, 4, 'st1'); c.r(X, Y + H_ - 4, W_, 1, 'st0')
    # chimney (left end)
    chx = x + 6
    yw = y - wh
    c.r(chx - 1, yw - rh - 16, 13, 18, 'out')
    yw = side_building(c, x, y, w, wh, rh, ('#a8523a', '#74301f', '#c8735a'), logs)
    c.r(chx - 1, yw - rh - 16, 13, 18, 'out'); wall_stone(c, chx, yw - rh - 15, 11, 17, 'st0', 'st1', 'st2')
    c.r(chx - 2, yw - rh - 18, 15, 3, 'st3')
    for dx, dy, r in [(5, -24, 3), (3, -31, 4), (7, -39, 5)]:
        c.e(chx + dx, yw - rh + dy, r + 1, r, 'smoke1'); c.e(chx + dx - 1, yw - rh + dy - 1, r, r - 1, 'smoke')
    # moss tufts on the roof
    for dx in (12, 30, 51, 64):
        c.r(x + dx, yw - 3, 4, 2, 'leaf2'); c.p(x + dx + 1, yw - 4, 'leaf3')
    # windows with flower boxes
    for wx in (x + 8, x + 54):
        window(c, wx, yw + 8, 10, 9, lit='#ffd27a')
        c.r(wx - 1, yw + 18, 12, 3, 'w1')
        for i, fc in enumerate(['red2', 'pk0', 'yellow', 'pk0', 'red2']):
            c.p(wx + i * 2 + 1, yw + 17, fc); c.p(wx + i * 2, yw + 18, 'leaf2')
        c.glow(wx + 5, yw + 12, 10, 'glow', 0.25)
    # porch
    c.r(x + 18, y - 1, 38, 6, 'w3'); c.r(x + 19, y - 1, 36, 4, 'w2'); [c.r(xx, y - 1, 1, 4, 'w0') for xx in range(x + 22, x + 55, 4)]
    door(c, x + 31, y - 19, 12, 18, '#7a4a28', '#5a3418')
    c.r(x + 32, y - 15, 3, 3, '#ffd27a')
    for px in (x + 19, x + 53):
        c.r(px, y - 26, 3, 28, 'w3'); c.r(px, y - 26, 1, 28, 'w2')
    roof_side(c, x + 14, y - 32, 46, 7, '#a8523a', '#74301f', '#c8735a', step=4)
    c.r(x + 26, y - 24, 1, 3, 'out'); c.r(x + 25, y - 21, 3, 3, 'yellow'); c.glow(x + 26, y - 20, 12, 'glow', 0.3)
    c.r(x + 20, y + 5, 34, 2, 'st1'); c.r(x + 30, y + 5, 14, 4, 'st0'); c.r(x + 30, y + 7, 14, 1, 'st2')
    c.label('Cabin', x + w / 2, yw - rh - 40)
    return (x + 37, y)
