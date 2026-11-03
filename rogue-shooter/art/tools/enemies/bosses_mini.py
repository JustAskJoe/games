"""The 12 mini-bosses, two per zone. Each faces the camera (one view) with a 4-frame idle or
move loop and a 3-frame signature attack. Drawn at full size in art pixels (no 2x blow-up),
so they share the heroes' pixel grid."""
import math
import numpy as np
from PIL import Image
from ekit import (R, ramp, hx, EYE, WHITE, BLUSH, blob, eye2, line_dots, new, enemy, extra, ENEMIES,
                  glow, fade, flash, speckle, chain, canvas, put, disc, ring, sparkle, outline, arr, pil)

R.update({
    'sl_in':    ramp('#1e5a28', '#2e7e36', '#3e9a42', '#5aae4e', '#7cc464'),
    'amethyst': ramp('#2a0e3e', '#54207a', '#8a3cb8', '#c07ae6', '#f2d4ff'),
    'luna':     ramp('#1e3a2a', '#3c7050', '#6eb488', '#a8e4b4', '#e6ffe8'),
    'furd':     ramp('#121018', '#24202e', '#3a3446', '#58506a', '#7e7690'),
    'iron':     ramp('#14141c', '#2a2a36', '#44445a', '#686a84', '#9a9cb4'),
    'royal':    ramp('#1c0a2e', '#381458', '#5a2486', '#8440b8', '#b47ae0'),
})
YEL = hx('#f6d040'); RED = hx('#ff3a30'); MAG = hx('#ff5ae0')

def boss(key, name, zone, size, fn, note, behavior, attack_name, timing, oy=0, floats=False):
    enemy(key, name, zone, size, ['front'], fn, {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
          note, behavior, oy=oy, timing=timing)
    ENEMIES[key].update(tier='mini', attack_name=attack_name, floats=floats)

def crown(s, cx, base, w=7, h=6, gem=RED):
    pts = [(cx - w, base), (cx - w, base - h + 2), (cx - w + 2, base - h + 4), (cx - w / 2, base - h), (cx - 1, base - h + 3),
           (cx, base - h - 1), (cx + 1, base - h + 3), (cx + w / 2, base - h), (cx + w - 2, base - h + 4), (cx + w, base - h + 2), (cx + w, base)]
    s.poly('gold', pts)
    s.dots([(cx - 2, base - 2), (cx + 2, base - 2)], ('gold', 1)); s.dot(cx, base - 2, gem); s.dot(cx, base - 3, WHITE)
    s.dots([(cx - w, base - h + 2), (cx - w / 2, base - h), (cx, base - h - 1), (cx + w / 2, base - h), (cx + w, base - h + 2)], ('gold', 4))

def afterimages(dx, color, al=0.35):
    """Clone afterimages: tinted, faded copies of the sprite to each side."""
    col = np.array(hx(color), float)
    def f(im):
        a = arr(im); out = np.zeros_like(a)
        for sx in (-dx, dx):
            b = np.roll(a, sx, axis=1)
            if sx > 0: b[:, :sx] = 0
            else: b[:, sx:] = 0
            m = b[..., 3] > 0
            out[m, :3] = (b[m, :3] * 0.3 + col * 0.7).astype(np.uint8); out[m, 3] = int(255 * al)
        base = pil(out); base.alpha_composite(im); return base
    return f

# ================================================================== MEADOW

def giant_slime(view, f, var=None):
    s = new('giant_slime'); cx = 32
    rx, ry, lift = {'m0': (23, 19, 0), 'm1': (25.5, 16.5, 0), 'm2': (21.5, 21, 3), 'm3': (24.5, 17.5, 0),
                    'a0': (28, 13.5, 0), 'a1': (19, 24, 5), 'a2': (30, 11, 0)}[f]
    base = 50 - lift; cy = base - ry * 0.72; top = cy - ry
    m = 'sl_meadow'
    blob(s, m, [('ell', cx, cy, rx, ry), ('cut', 0, base + 1, 80, 80)])
    for dx, dy, r in ((-9, 7, 4.5), (8, 8, 4), (0, 11, 3.5)):
        if cy + dy + r < base:
            ix, iy = cx + dx * rx / 23, cy + dy * ry / 19
            blob(s, 'sl_in', [('ell', ix, iy, r * rx / 23, r * 0.8 * ry / 19), ('cut', 0, iy + r * 0.5, 80, 80)], flat=True)
            s.dot(ix - r * rx / 23 * 0.5, iy - 1, R['sl_meadow'][4])
    ey = round(cy - ry * 0.25)
    for ex in (cx - 9, cx + 5):
        for yy in range(4):
            for xx in range(3): s.dot(ex + xx, ey + yy, EYE)
        s.dots([(ex, ey), (ex + 1, ey), (ex, ey + 1)], WHITE)
    s.dots([(cx - 11, ey - 3), (cx - 10, ey - 3), (cx - 9, ey - 2), (cx - 8, ey - 2), (cx - 7, ey - 1)], (m, 0))
    s.dots([(cx + 9, ey - 3), (cx + 8, ey - 3), (cx + 7, ey - 2), (cx + 6, ey - 2), (cx + 5, ey - 1)], (m, 0))
    my = ey + 7
    if f in ('a1', 'a2'):
        blob(s, 'black', [('ell', cx, my + 1, 4, 2.5)], flat=True); s.dots([(cx - 2, my - 1), (cx + 2, my - 1)], WHITE)
    else:
        s.dots([(cx + d, my - (1 if abs(d) > 3 else 0)) for d in range(-5, 6)], (m, 0)); s.dot(cx + 2, my + 1, WHITE)
    tx, ty = round(cx - rx + 5), round(top + 4)
    s.dots([(tx, ty + 2), (tx + 1, ty + 1), (tx + 2, ty), (tx + 3, ty), (tx, ty + 3), (tx + 1, ty + 2)], WHITE)
    s.dots([(round(cx + rx - 5), round(cy + 3)), (round(cx + rx - 6), round(cy + 5))], (m, 4))
    crown(s, cx + 3, round(top + 2), 7, 7)
    s.dots([(round(cx - rx + 3), base), (round(cx + rx - 4), base), (cx - 4, base)], (m, 1))
    pose = None
    if f == 'a2':
        for x, y in ((cx - 30, base - 8), (cx + 29, base - 9), (cx - 24, base - 16), (cx + 22, base - 17)):
            s.ell(m, x, y, 2.5, 2)
    return s, pose

boss('giant_slime', 'Giant Slime', 'meadow', (64, 54), giant_slime,
     'A huge meadow slime wearing a little gold crown, with three swallowed slimes floating inside and an angry brow.',
     'Splits into 4 Slimes when it dies.', 'Bellyflop: squashes wide, springs up tall, then splats down and flings gel.',
     {'move': 200, 'attack': [320, 260, 360]}, oy=4)

def _bat(s, cx, cy, ang, sc, mouth=False):
    for side in (-1, 1):
        sh = (cx + side * 4 * sc, cy - 1)
        tips = []
        for da, L in ((-30, 13.5), (-8, 13), (16, 11.5), (38, 8.5)):
            a = math.radians(ang + da)
            tips.append((sh[0] + side * math.cos(a) * L * sc, sh[1] + math.sin(a) * L * sc))
        pts = [sh, tips[0]]
        for t0, t1 in zip(tips, tips[1:]):
            mx, my = (t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2
            pts += [(mx + (sh[0] - mx) * 0.4, my + (sh[1] - my) * 0.4), t1]
        pts += [(cx + side * 3 * sc, cy + 5 * sc)]
        s.poly('batwing', pts)
        for t in tips: line_dots(s, [sh, t], ('bat', 1))
        s.dot(tips[0][0], tips[0][1], ('horn', 4)); s.dot(tips[0][0] + side, tips[0][1] - 1, ('horn', 3))
    # torn notch in the left wing
    a = math.radians(ang - 8)
    nx, ny = cx - 4 * sc - math.cos(a) * 9 * sc, cy - 1 + math.sin(a) * 9 * sc
    s.dots([(nx, ny), (nx + 1, ny), (nx, ny + 1)], (0, 0, 0))
    s.poly('bat', [(cx - 7, cy - 3), (cx - 8, cy - 12), (cx - 2, cy - 5)])
    s.poly('bat', [(cx + 7, cy - 3), (cx + 9, cy - 11), (cx + 6, cy - 9), (cx + 6, cy - 7), (cx + 2, cy - 5)])
    s.ell('bat', cx, cy + 1, 7, 7.5)
    blob(s, 'furl', [('ell', cx, cy + 5, 4.5, 3.5)])
    s.dots([(cx - 7, cy - 9), (cx - 6, cy - 7), (cx + 7, cy - 8)], ('pink', 2))
    s.dots([(cx - 1, cy - 6), (cx, cy - 7), (cx + 1, cy - 6), (cx, cy - 5)], ('cream', 4))
    for ex in (cx - 5, cx + 2):
        s.dots([(ex, cy - 1), (ex + 1, cy - 1), (ex + 2, cy - 1), (ex, cy), (ex + 1, cy), (ex + 2, cy)], RED); s.dot(ex, cy - 1, hx('#ffd0a0'))
    s.dots([(cx - 6, cy - 3), (cx - 4, cy - 2), (cx - 3, cy + 1), (cx - 2, cy + 2)], ('pink', 3))   # scar
    if mouth:
        blob(s, 'black', [('ell', cx, cy + 4, 2.5, 2)], flat=True)
        s.dots([(cx - 2, cy + 3), (cx + 2, cy + 3), (cx - 2, cy + 4), (cx + 2, cy + 4)], WHITE)
    else:
        s.dots([(cx - 2, cy + 3), (cx + 2, cy + 3), (cx - 2, cy + 4), (cx + 2, cy + 4)], WHITE); s.dot(cx, cy + 2, ('bat', 0))
    s.dots([(cx - 3, cy + 9), (cx - 2, cy + 9), (cx + 2, cy + 9), (cx + 3, cy + 9)], ('horn', 3))

def alpha_bat(view, f, var=None):
    s = new('alpha_bat'); cx = 34
    ang, dy, mouth = {'m0': (-58, 1, 0), 'm1': (-15, 0, 0), 'm2': (32, -1, 0), 'm3': (-15, 0, 0),
                      'a0': (-65, 2, 0), 'a1': (-5, -1, 1), 'a2': (15, 0, 1)}[f]
    _bat(s, cx, 18 + dy, ang, 1.9, mouth)
    return s, None, glow('#ff3a30', steps=((1, 50),)) if f[0] == 'a' else None

boss('alpha_bat', 'Alpha Bat', 'meadow', (68, 44), alpha_bat,
     'A battle-scarred giant bat: torn wing, scar across one eye, white tuft and a pale ruff.',
     'Screeches to call a swarm of Bats.', 'Screech: wings back, mouth open, a ring of sound rolls out.',
     {'move': 110, 'attack': [260, 380, 260]}, oy=2, floats=True)

def screech_rings():
    out = []
    for k in range(3):
        a = canvas(72, 48)
        for i in range(k + 1):
            r = 8 + i * 9 + k * 2
            for t in range(60):
                ang = math.pi * (0.15 + 0.7 * t / 60)
                put(a, 36 + math.cos(ang) * r * 1.3, 6 + math.sin(ang) * r, R['red'][4] if i == k else R['red'][3], 230 - i * 60)
                put(a, 36 + math.cos(ang) * (r - 1) * 1.3, 6 + math.sin(ang) * (r - 1), R['red'][2], 160 - i * 40)
        out.append(a)
    return out

extra('alpha_bat', 'Screech', 'Rolls out below the bat; each ring that reaches you calls more bats.', screech_rings())

# ================================================================== FOREST

def mushroom_king(view, f, var=None):
    s = new('mushroom_king'); cx = 32
    atk = int(f[1]) if f[0] == 'a' else None
    s.g('cape'); s.poly('royal', [(cx - 11, 32), (cx + 11, 32), (cx + 15, 56), (cx + 9, 54), (cx, 57), (cx - 9, 54), (cx - 15, 56)]); s.g('body')
    s.dots([(cx - 13, 54), (cx - 7, 55), (cx + 7, 55), (cx + 13, 54)], ('gold', 3))
    s.g('feet'); s.ell('gill', cx - 6, 56, 4, 2.5); s.ell('gill', cx + 6, 56, 4, 2.5); s.g('body')
    s.ell('cream', cx, 44, 10, 11)
    s.poly('gill', [(cx - 8, 44), (cx + 8, 44), (cx + 6, 51), (cx + 3, 49), (cx, 53), (cx - 3, 49), (cx - 6, 51)])
    line_dots(s, [(cx - 4, 45), (cx - 3, 50)], ('gill', 1)); line_dots(s, [(cx + 4, 45), (cx + 3, 50)], ('gill', 1))
    for ex in (cx - 6, cx + 3):
        s.dots([(ex, 38), (ex + 1, 38), (ex + 2, 38), (ex, 39), (ex + 1, 39), (ex + 2, 39), (ex + 1, 40)], EYE); s.dot(ex, 38, WHITE)
    s.dots([(cx - 7, 36), (cx - 6, 36), (cx - 5, 37), (cx + 5, 37), (cx + 6, 36), (cx + 7, 36)], ('cream', 0))
    s.dots([(cx - 8, 42), (cx + 8, 42)], BLUSH)
    s.rect('gill', cx - 19, 29, cx + 19, 32)
    s.dots([(x, 32) for x in range(cx - 18, cx + 19, 2)], ('gill', 1))
    blob(s, 'mush', [('ell', cx, 20, 21, 14), ('cut', 0, 30, 80, 80)])
    for x, y, big in ((cx - 14, 18, 1), (cx - 5, 12, 1), (cx + 6, 14, 1), (cx + 14, 21, 1), (cx - 18, 25, 0), (cx - 6, 23, 0), (cx + 3, 24, 0), (cx + 17, 13, 0), (cx - 11, 10, 0)):
        cells = [(x, y), (x + 1, y), (x + 2, y), (x, y + 1), (x + 1, y + 1), (x + 2, y + 1), (x + 1, y - 1)] if big else [(x, y), (x + 1, y), (x, y + 1)]
        s.dots(cells, ('cream', 4)); s.dot(x + 2 if big else x + 1, y + 1, ('cream', 2))
    s.dots([(cx - 15, 12), (cx - 13, 10), (cx - 11, 9), (cx - 17, 15)], ('mush', 4))
    crown(s, cx, 8, 8, 7, gem=hx('#72dc6e'))
    # scepter: a stalk topped with a little purple toadstool
    sx = cx + 16
    if atk is None:
        s.g('arm'); s.ell('cream', cx + 11, 45, 2.5, 3); s.line('wood', [(sx, 30), (sx, 56)], 2)
        s.ell('robe', sx, 29, 4, 2.5); s.dots([(sx - 1, 28), (sx + 2, 29)], ('cream', 4)); s.g('body')
        s.ell('cream', cx - 11, 45, 2.5, 3)
    elif atk == 0:
        s.ell('cream', cx + 12, 38, 2.5, 3); s.line('wood', [(sx + 1, 14), (sx - 1, 44)], 2)
        s.ell('robe', sx + 1, 13, 4, 2.5); s.dots([(sx, 12), (sx + 3, 13)], ('cream', 4)); s.ell('cream', cx - 11, 45, 2.5, 3)
    else:
        s.ell('cream', cx + 11, 47, 2.5, 3); s.line('wood', [(sx - 2, 36), (sx + 2, 58)], 2)
        s.ell('robe', sx - 2, 35, 4, 2.5); s.ell('cream', cx - 11, 45, 2.5, 3)
        if atk == 1:
            for i in range(14):
                ang = i * 0.45; r = 23 + (i % 3) * 3
                s.dot(cx + math.cos(ang) * r, 18 + math.sin(ang) * r * 0.55, hx('#c8e890') if i % 2 else hx('#b07ac0'))
    k = int(f[1])
    if atk is None:
        pose = [{}, {'body': (0, 1), 'feet': (0, 0), 'cape': (0, 1), 'arm': (0, 1)}, {'body': (0, -1), 'feet': (0, 0), 'cape': (0, 0), 'arm': (0, -2)}, {}][k]
    else:
        pose = [{'body': (0, 1), 'feet': (0, 0)}, {'body': (0, -1), 'feet': (0, 0)}, {'body': (0, 2), 'feet': (0, 0)}][atk]
    return s, pose

boss('mushroom_king', 'Mushroom King', 'forest', (64, 62), mushroom_king,
     'An old toadstool king: wide red cap with a gold crown, a beard of gills, a purple cape and a toadstool scepter.',
     'Fills the area with spores and calls Shroomlings.', 'Spore Storm: raises the scepter, the cap bursts with spores, then slams the scepter down.',
     {'move': 180, 'attack': [320, 380, 300]}, oy=0)

def spore_storm():
    out = []
    pal = [hx('#8a4a9a'), hx('#b07ac0'), hx('#7ab05a'), hx('#c8e890')]
    for k in range(3):
        a = canvas(96, 64); rng = np.random.default_rng(4 + k)
        for i in range(10 + k * 6):
            x, y = rng.integers(8, 88), rng.integers(8, 56)
            r = 3 + rng.random() * (2 + k * 1.5)
            disc(a, x, y, r, pal[1], 150 - k * 25, 0.8); disc(a, x - 1, y - 1, r * 0.6, pal[3] if i % 3 == 0 else pal[1], 170 - k * 30, 0.8)
        for i in range(30):
            put(a, rng.integers(0, 96), rng.integers(0, 64), pal[3] if i % 2 else pal[2])
        out.append(a)
    return out

extra('mushroom_king', 'Spore storm', 'Spreads out around him on the strike; the clouds slow and poison.', spore_storm())

def pack_leader(view, f, var=None):
    s = new('pack_leader'); cx = 28
    atk = int(f[1]) if f[0] == 'a' else None
    howl = atk == 1
    s.g('legR'); s.rect('furd', cx - 10, 32, cx - 7, 41); s.ell('furd', cx - 8.5, 42, 2.5, 1.2)
    s.g('legL'); s.rect('furd', cx + 7, 32, cx + 10, 41); s.ell('furd', cx + 8.5, 42, 2.5, 1.2)
    s.g('body')
    s.ell('furd', cx, 31, 10.5, 8.5)
    s.dots([(cx - 8, 30), (cx - 7, 33), (cx + 7, 31), (cx + 8, 34)], ('furd', 3))
    s.g('legL'); s.rect('furd', cx - 6, 33, cx - 3, 43); s.ell('furd', cx - 4.5, 44, 2.8, 1.3); s.dots([(cx - 6, 44), (cx - 4, 44)], ('furd', 0))
    s.g('legR'); s.rect('furd', cx + 3, 33, cx + 6, 43); s.ell('furd', cx + 4.5, 44, 2.8, 1.3); s.dots([(cx + 3, 44), (cx + 5, 44)], ('furd', 0))
    s.g('body')
    blob(s, 'furl', [('poly', [(cx - 12, 18), (cx - 14, 24), (cx - 10, 23), (cx - 9, 28), (cx - 6, 26), (cx - 3, 30), (cx, 27),
                               (cx + 3, 30), (cx + 6, 26), (cx + 9, 28), (cx + 10, 23), (cx + 14, 24), (cx + 12, 18)])])
    s.dots([(cx - 9, 24), (cx - 5, 25), (cx + 4, 25), (cx + 8, 24), (cx - 1, 26), (cx + 1, 26)], ('furl', 2))
    for x in range(cx - 6, cx + 7, 3):
        y = 25 + (2 if abs(x - cx) < 3 else 1 if abs(x - cx) < 5 else 0)
        s.dots([(x, y), (x, y + 1)], ('bone', 4)); s.dot(x, y + 2, ('bone', 2))
    s.g('head')
    if howl:
        s.poly('furd', [(cx - 7, 13), (cx - 11, 7), (cx - 4, 10)]); s.poly('furd', [(cx + 7, 13), (cx + 11, 7), (cx + 4, 10)])
        blob(s, 'furd', [('ell', cx, 15, 9, 6), ('poly', [(cx - 9, 14), (cx - 14, 20), (cx - 6, 19)]), ('poly', [(cx + 9, 14), (cx + 14, 20), (cx + 6, 19)])])
        blob(s, 'furl', [('poly', [(cx - 4, 15), (cx + 4, 15), (cx + 3, 6), (cx + 2, 2), (cx - 2, 2), (cx - 3, 6)])])
        s.dots([(cx - 1, 2), (cx, 2), (cx + 1, 2), (cx, 3)], EYE)
        blob(s, 'black', [('ell', cx, 9, 1.6, 2.4)], flat=True); s.dots([(cx - 1, 7), (cx + 1, 7)], WHITE)
        s.dots([(cx - 6, 14), (cx - 5, 13), (cx - 4, 13), (cx + 4, 13), (cx + 5, 13), (cx + 6, 14)], ('furd', 0))
    else:
        s.poly('furd', [(cx - 6, 9), (cx - 10, 0), (cx - 2, 5)]); s.poly('furd', [(cx + 6, 9), (cx + 10, 0), (cx + 2, 5)])
        blob(s, 'furd', [('ell', cx, 10.5, 8.5, 6.5), ('poly', [(cx - 8, 10), (cx - 14, 17), (cx - 6, 16)]), ('poly', [(cx + 8, 10), (cx + 14, 17), (cx + 6, 16)])])
        blob(s, 'furl', [('poly', [(cx - 3, 11), (cx + 3, 11), (cx + 3, 17), (cx + 2, 20), (cx - 2, 20), (cx - 3, 17)])])
        s.dots([(cx - 1, 17), (cx, 17), (cx + 1, 17), (cx, 18)], EYE); s.dot(cx - 1, 17, ('furl', 4))
        s.dots([(cx - 5, 9), (cx - 4, 9), (cx + 4, 9), (cx + 5, 9)], RED); s.dots([(cx - 4, 9), (cx + 4, 9)], EYE)
        s.dots([(cx - 6, 8), (cx - 5, 8), (cx - 4, 8), (cx + 4, 8), (cx + 5, 8), (cx + 6, 8)], ('furd', 0))
        if atk is not None: s.dots([(cx - 2, 20), (cx - 1, 21), (cx, 20), (cx + 1, 21), (cx + 2, 20)], WHITE)
        else: s.dots([(cx - 1, 20), (cx + 1, 20)], ('furd', 0))
        line_dots(s, [(cx, 4), (cx, 10)], ('furd', 1))
        s.dots([(cx - 6, 5), (cx - 5, 7), (cx - 4, 9), (cx - 3, 11)], ('pink', 3))      # scar over the eye
        s.dots([(cx - 8, 2), (cx - 7, 4), (cx + 8, 2), (cx + 7, 4)], ('pink', 2))
    s.dots([(cx - 12, 16), (cx - 11, 15), (cx + 11, 15), (cx + 12, 16)], ('furl', 3))
    s.g('body')
    k = int(f[1])
    if atk is None:
        pose = [{'legL': (0, -1)}, {'body': (0, -1), 'head': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'legR': (0, -1)},
                {'body': (0, -1), 'head': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}][k]
    else:
        pose = [{'body': (0, 1), 'head': (0, 3), 'legL': (0, 0), 'legR': (0, 0)}, {'head': (0, -1)}, {'body': (0, 1), 'head': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}][atk]
    return s, pose, (glow('#ff9a40', steps=((1, 120), (2, 50))) if howl else None)

boss('pack_leader', 'Pack Leader Wolf', 'forest', (56, 48), pack_leader,
     'A huge dark wolf with a white mane, red eyes, a scar over one eye and a necklace of teeth.',
     'Howls to speed up every enemy on the field.', 'Howl: lowers its head, throws it back and howls, then drops into a crouch.',
     {'move': 110, 'attack': [300, 520, 260]}, oy=2)

def howl_rings():
    out = []
    for k in range(3):
        a = canvas(80, 56)
        for i in range(k + 1):
            r = 10 + i * 10 + k * 2
            ring(a, 40, 30, r, 2, R['orange'][3] if i == k else R['orange'][2], 230 - i * 70, 0.7)
        for i in range(6):
            ang = i * 1.05 + k * 0.3; rr = 14 + k * 8
            put(a, 40 + math.cos(ang) * rr, 30 + math.sin(ang) * rr * 0.7, R['orange'][4])
        out.append(a)
    return out

extra('pack_leader', 'Howl', 'Rolls out from the wolf; every enemy it touches speeds up.', howl_rings())

# ================================================================== CAVERNS

def ccrystal(s, x, y, h, w=3, lean=0, m='amethyst'):
    pts = [(x - w / 2, y), (x - w / 2 + lean * 0.6, y - h * 0.65), (x + lean, y - h), (x + w / 2 + lean * 0.6, y - h * 0.65), (x + w / 2, y)]
    s.poly(m, pts)
    line_dots(s, [(x - w / 2 + 1 + lean * 0.1, y - 1), (x + lean * 0.8 - 0.5, y - h + 2)], (m, 4))
    s.dot(x + lean, y - h + 1, WHITE)

def crystal_titan(view, f, var=None):
    s = new('crystal_titan'); cx = 34
    atk = int(f[1]) if f[0] == 'a' else None
    s.g('legL'); blob(s, 'basalt', [('rect', cx - 12, 46, cx - 4, 58), ('ell', cx - 8, 59, 6, 2.5)])
    s.g('legR'); blob(s, 'basalt', [('rect', cx + 4, 46, cx + 12, 58), ('ell', cx + 8, 59, 6, 2.5)])
    s.g('body')
    for x, y, h, w, l in ((cx, 18, 12, 5, 0), (cx - 8, 21, 9, 4, -3), (cx + 8, 21, 9, 4, 3), (cx - 14, 25, 7, 3, -4), (cx + 14, 25, 7, 3, 4)):
        ccrystal(s, x, y, h, w, l)
    s.ell('basalt', cx, 35, 17, 15)
    line_dots(s, [(cx - 12, 30), (cx - 9, 34), (cx - 11, 39)], ('basalt', 1)); line_dots(s, [(cx + 13, 36), (cx + 10, 40), (cx + 12, 44)], ('basalt', 1))
    s.dots([(cx - 15, 27), (cx - 14, 26), (cx - 13, 25), (cx - 16, 29)], ('basalt', 4))
    ccrystal(s, cx, 44, 9, 7, 0, 'crystal')
    s.ell('basalt', cx, 23, 7, 5.5)
    s.dots([(cx - 5, 21), (cx - 4, 21), (cx - 3, 21), (cx + 3, 21), (cx + 4, 21), (cx + 5, 21)], ('basalt', 0))
    s.dots([(cx - 4, 22), (cx - 3, 22), (cx + 3, 22), (cx + 4, 22)], R['amethyst'][4]); s.dots([(cx - 4, 23), (cx + 3, 23)], R['amethyst'][3])
    s.dots([(cx - 2, 26), (cx - 1, 26), (cx, 26), (cx + 1, 26), (cx + 2, 26)], ('basalt', 1))
    crown_y = {None: 0, 0: -10, 1: 12, 2: 10}[atk]
    for side, ax in ((-1, cx - 21), (1, cx + 21)):
        s.g('armL' if side < 0 else 'armR')
        fy = 46 + crown_y
        blob(s, 'basalt', [('ell', ax, 33 + crown_y * 0.5, 6, 8), ('ell', ax, fy, 7, 6)])
        ccrystal(s, ax + side * 2, fy - 4, 8, 4, side * 3); ccrystal(s, ax - side * 2, fy - 3, 6, 3, -side)
        ccrystal(s, ax + side, 27 + crown_y * 0.5, 9, 4, side * 3)
        s.dots([(ax - 3, fy + 3), (ax, fy + 4), (ax + 3, fy + 3)], ('basalt', 1))
    s.g('body')
    k = int(f[1])
    if atk is None:
        pose = [{'legL': (0, -2), 'armL': (0, 1), 'armR': (0, -1)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)},
                {'legR': (0, -2), 'armL': (0, -1), 'armR': (0, 1)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}][k]
        return s, pose
    pose = [{'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'body': (0, 2), 'legL': (0, 0), 'legR': (0, 0)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}][atk]
    return s, pose, (glow('#c07ae6', steps=((1, 140), (2, 60))) if atk == 1 else None)

boss('crystal_titan', 'Crystal Titan', 'caverns', (68, 64), crystal_titan,
     'A dark basalt giant crowned with violet amethyst, crystal-studded fists and a cyan heart crystal.',
     'Slams the ground to send waves of crystal spikes.', 'Ground Slam: both fists overhead, a violet-flashing slam, then spikes burst out.',
     {'move': 260, 'attack': [420, 200, 420]}, oy=2)

def spike_wave():
    out = []
    for k in range(3):
        a = canvas(96, 40)
        for i in range(6):
            x = 8 + i * 15
            h = [0, 6, 14, 18, 14, 8][min(5, max(0, (k + 1) * 2 - i))] if i <= (k + 1) * 2 else 0
            if not h:
                for t in range(-3, 4): put(a, x + t, 34, R['amethyst'][1], 140)
                continue
            for t in range(h):
                w = max(1, int((h - t) / h * 4))
                for o in range(-w, w + 1):
                    c = R['amethyst'][4] if o < -w + 2 else R['amethyst'][3] if o < 1 else R['amethyst'][2]
                    put(a, x + o, 34 - t, c)
            put(a, x, 34 - h + 1, WHITE)
        out.append(outline(a, '#2a0e3e'))
    return out

extra('crystal_titan', 'Spike wave', 'Rows of crystal spikes rise along the slam direction; points right, rotate to aim.', spike_wave())

def moth_queen(view, f, var=None):
    s = new('moth_queen'); cx = 36
    k = int(f[1])
    atk = k if f[0] == 'a' else None
    sc, up = ((1.0, 0.85, 0.62, 0.85)[k], (-1, 0, 2, 0)[k]) if atk is None else ((1.08, 1.0, 0.9)[atk], (-3, -1, 1)[atk])
    def X(x): return cx + (x - cx) * sc
    for side in (-1, 1):
        def P(x, y): return (X(cx + side * x), y)
        s.g('wings')
        s.poly('luna', [P(3, 28), P(13, 31), P(18, 38), P(21, 46 - up // 2), P(17, 46), P(11, 40), P(5, 36)])
        s.poly('luna', [P(3, 20), P(15, 5 + up), P(26, 6 + up), P(31, 14 + up // 2), P(26, 24), P(13, 29), P(4, 28)])
        for (ex, ey, r) in ((16, 15, 2), (24, 13, 1)):
            x0, y0 = P(ex, ey + up // 2)
            s.dots([(x0 + dx, y0 + dy) for dx in range(-r, r + 1) for dy in range(-r, r + 1) if abs(dx) + abs(dy) <= r + 1], ('pink', 3))
            s.dot(x0, y0, ('pink', 4)); s.dot(x0, y0 - 1 if r > 1 else y0, WHITE)
            s.dots([(x0 - r - 1, y0), (x0 + r + 1, y0), (x0, y0 - r - 1), (x0, y0 + r + 1)], ('luna', 0))
        line_dots(s, [P(4, 20), P(26, 7 + up)], ('luna', 1)); line_dots(s, [P(4, 24), P(30, 14 + up // 2)], ('luna', 1))
        line_dots(s, [P(26, 6 + up), P(31, 14 + up // 2), P(26, 24)], ('gold', 3))
        x0, y0 = P(18, 44 - up // 2); s.dot(x0, y0, ('pink', 3))
    s.g('body')
    s.ell('mothb', cx, 28, 5, 10)
    s.ell('mothb', cx, 15, 5.5, 4.5)
    s.dots([(cx - 3, 19), (cx + 3, 19), (cx - 2, 20), (cx + 2, 20), (cx, 19), (cx - 4, 21), (cx + 4, 21)], ('mothb', 4))
    for y in (27, 31, 35): s.dots([(cx - 3, y), (cx - 2, y + 1), (cx + 2, y + 1), (cx + 3, y)], ('mothb', 1))
    s.dots([(cx - 3, 15), (cx - 2, 15), (cx + 2, 15), (cx + 3, 15), (cx - 3, 16), (cx + 3, 16)], EYE); s.dots([(cx - 3, 14), (cx + 2, 14)], WHITE)
    for side in (-1, 1):
        line_dots(s, [(cx + side * 2, 11), (cx + side * 6, 5), (cx + side * 9, 1)], ('mothb', 2))
        s.dots([(cx + side * 4, 6), (cx + side * 6, 7), (cx + side * 6, 3), (cx + side * 8, 4), (cx + side * 9, 0), (cx + side * 10, 2)], ('mothb', 3))
    crown(s, cx, 11, 4, 4, gem=hx('#72dc6e'))
    bob = (0, -1, -1, 0)[k] if atk is None else (-1, -2, -1)[atk]
    post = glow('#72dc6e', steps=((1, 60),)) if atk != 1 else glow('#a8ffb0', steps=((1, 170), (2, 100), (3, 50)))
    return s, {'body': (0, bob), 'wings': (0, bob)}, post

boss('moth_queen', 'Moth Queen', 'caverns', (72, 50), moth_queen,
     'A regal luna moth: pale green wings with long tails, pink eyespots edged in gold, a fluffy body and a tiny crown.',
     'Heals herself and calls Healer Moths.', 'Royal Bloom: spreads her wings, flares green, then sweeps them down.',
     {'move': 120, 'attack': [300, 420, 300]}, oy=2, floats=True)

def bloom():
    out = []
    g = R['vial_g']
    for k in range(3):
        a = canvas(80, 56)
        ring(a, 40, 30, 10 + k * 9, 2, g[3], 230 - k * 50, 0.6)
        for i in range(10):
            ang = i * 0.63 + k * 0.25; rr = 8 + k * 9
            x, y = 40 + math.cos(ang) * rr, 30 + math.sin(ang) * rr * 0.6 - k * 2
            for dd in (-1, 0, 1): put(a, x + dd, y, g[3]); put(a, x, y + dd, g[3])
            put(a, x, y, WHITE)
        out.append(a)
    return out

extra('moth_queen', 'Royal bloom', 'Plays around her when she heals; Healer Moths appear on the last frame.', bloom())

# ================================================================== VOLCANIC

def magma_wyrm(view, f, var=None):
    s = new('magma_wyrm'); cx = 32
    atk = int(f[1]) if f[0] == 'a' else None
    k = int(f[1])
    sway = (0, 1, 0, -1)[k] if atk is None else 0
    s.ell('lava', cx, 54, 26, 6, flat=True)
    s.dots([(cx - 18, 54), (cx - 6, 56), (cx + 9, 53), (cx + 20, 55)], ('lava', 4))
    s.dots([(cx - 22, 53), (cx + 15, 57)], ('lava', 3))
    blob(s, 'basalt', [('ell', cx - 8, 51, 14, 5), ('ell', cx + 10, 52, 12, 4.5)])
    blob(s, 'basalt', [('line', [(cx + 8, 50), (cx + 12, 42), (cx + 9 + sway, 32), (cx + 3 + sway, 26)], 11)])
    line_dots(s, [(cx + 5, 50), (cx + 8, 42), (cx + 5 + sway, 33), (cx + sway, 28)], ('lava', 3))
    line_dots(s, [(cx + 6, 50), (cx + 9, 42), (cx + 6 + sway, 33), (cx + 1 + sway, 28)], ('lava', 2))
    for y in (46, 40, 34): s.dot(cx + 10 + (sway if y < 40 else 0), y, ('lava', 4))
    for x, y in ((cx + 15, 40), (cx + 15, 34), (cx + 13, 29)):
        s.poly('basalt', [(x + sway, y), (x + 5 + sway, y - 2), (x + sway, y - 3)])
    s.g('head')
    hx_, hy = cx + sway, 18
    s.poly('horn', [(hx_ - 5, hy - 3), (hx_ - 11, hy - 10), (hx_ - 9, hy - 4)]); s.poly('horn', [(hx_ + 5, hy - 3), (hx_ + 11, hy - 10), (hx_ + 9, hy - 4)])
    s.dots([(hx_ - 11, hy - 10), (hx_ + 11, hy - 10)], ('horn', 4))
    open_ = atk in (1, 2)
    blob(s, 'basalt', [('ell', hx_, hy, 9, 7), ('poly', [(hx_ - 6, hy + 2), (hx_ + 6, hy + 2), (hx_ + 4, hy + 9), (hx_ - 4, hy + 9)])])
    if open_:
        blob(s, 'lava', [('poly', [(hx_ - 4, hy + 5), (hx_ + 4, hy + 5), (hx_ + 3, hy + 12), (hx_ - 3, hy + 12)])])
        s.dots([(hx_ - 3, hy + 5), (hx_ - 1, hy + 5), (hx_ + 1, hy + 5), (hx_ + 3, hy + 5)], WHITE)
        s.dots([(hx_ - 1, hy + 9), (hx_, hy + 8), (hx_ + 1, hy + 9)], ('lava', 4))
        blob(s, 'basalt', [('poly', [(hx_ - 5, hy + 11), (hx_ + 5, hy + 11), (hx_ + 3, hy + 14), (hx_ - 3, hy + 14)])])
    s.dots([(hx_ - 5, hy - 1), (hx_ - 4, hy - 1), (hx_ + 4, hy - 1), (hx_ + 5, hy - 1)], ('lava', 4)); s.dots([(hx_ - 5, hy - 1), (hx_ + 4, hy - 1)], WHITE)
    s.dots([(hx_ - 6, hy - 2), (hx_ - 5, hy - 2), (hx_ + 5, hy - 2), (hx_ + 6, hy - 2)], ('basalt', 0))
    s.dots([(hx_ - 2, hy + 7), (hx_ + 2, hy + 7)], ('lava', 3))
    line_dots(s, [(hx_, hy - 6), (hx_, hy - 2)], ('lava', 3))
    s.dots([(hx_ - 7, hy - 4), (hx_ - 6, hy - 5), (hx_ - 8, hy - 2)], ('basalt', 4))
    s.g('body')
    if atk is None: pose = {'head': (sway, (0, -1, 0, 1)[k])}
    else: pose = {'head': [(0, -4), (0, -1), (0, 3)][atk]}
    return s, pose, glow('#ff7a10', steps=((1, 90), (2, 40)) if not open_ else ((1, 160), (2, 80), (3, 30)))

boss('magma_wyrm', 'Magma Wyrm', 'volcanic', (64, 62), magma_wyrm,
     'A horned basalt serpent rising out of its own lava pool, with a molten belly, glowing eyes and back fins.',
     'Sweeps fire breath across the arena and leaves lava pools.', 'Fire Breath: rears back, the jaw opens glowing, then it lunges and breathes.',
     {'move': 200, 'attack': [360, 300, 420]}, oy=0)

def breath_cone():
    out = []
    E = R['ember']
    for k in range(3):
        a = canvas(48, 72); L = (24, 48, 66)[k]
        for t in range(L):
            w = 2 + t * 0.32
            for o in range(-int(w), int(w) + 1):
                d = abs(o) / w
                c = E[4] if d < 0.25 and t < L * 0.7 else E[3] if d < 0.6 else E[2]
                if (t * 7 + o * 3 + k) % 11 == 0: continue
                put(a, 24 + o + math.sin(t * 0.4 + k) * 1.5, 2 + t, c, 255 if t < L - 6 else 150)
        out.append(a)
    return out

extra('magma_wyrm', 'Fire breath', 'Comes out of the open jaw and sweeps; points down, rotate to aim.', breath_cone())

def inferno_golem(view, f, var=None):
    s = new('inferno_golem'); cx = 32
    atk = int(f[1]) if f[0] == 'a' else None
    s.g('legL'); blob(s, 'iron', [('rect', cx - 11, 44, cx - 4, 56), ('ell', cx - 7.5, 57, 6, 2.5)]); s.rect('gold', cx - 11, 48, cx - 4, 49)
    s.g('legR'); blob(s, 'iron', [('rect', cx + 4, 44, cx + 11, 56), ('ell', cx + 7.5, 57, 6, 2.5)]); s.rect('gold', cx + 4, 48, cx + 11, 49)
    s.g('body')
    blob(s, 'iron', [('poly', [(cx - 16, 20), (cx + 16, 20), (cx + 14, 44), (cx - 14, 44)])])
    for x in (cx - 14, cx - 7, cx + 7, cx + 14):
        s.dots([(x, 23), (x, 41)], ('iron', 4))
    s.rect('gold', cx - 16, 20, cx + 16, 21)
    blob(s, 'lava', [('rect', cx - 8, 26, cx + 8, 38)])
    for x in range(cx - 7, cx + 8, 3): s.rect('iron', x, 26, x, 38)
    s.dots([(cx - 4, 33), (cx + 2, 30), (cx + 5, 35), (cx - 1, 28)], ('ember', 4))
    s.rect('gold', cx - 9, 25, cx + 9, 25); s.rect('gold', cx - 9, 39, cx + 9, 39)
    # head: a furnace helm with flames pouring out
    s.ell('ember', cx, 9, 6, 6); s.poly('ember', [(cx - 5, 8), (cx - 3, 0), (cx - 1, 5), (cx + 1, -2), (cx + 3, 5), (cx + 5, 1), (cx + 6, 8)])
    s.dots([(cx - 1, 6), (cx, 4), (cx + 1, 6), (cx, 8)], ('ember', 4))
    blob(s, 'iron', [('rect', cx - 7, 11, cx + 7, 20), ('ell', cx, 11, 7, 3)])
    s.rect('black', cx - 5, 14, cx + 5, 15, flat=True)
    s.dots([(cx - 4, 14), (cx - 3, 14), (cx + 3, 14), (cx + 4, 14)], ('ember', 4))
    s.dots([(cx - 6, 12), (cx - 5, 11)], ('iron', 4)); s.rect('gold', cx - 7, 18, cx + 7, 18)
    lift = {None: 0, 0: -12, 1: 9, 2: 9}[atk]
    for side, ax in ((-1, cx - 21), (1, cx + 21)):
        s.g('armL' if side < 0 else 'armR')
        blob(s, 'iron', [('ell', ax + side * -1, 24, 6, 5), ('rect', ax - 4, 26 + lift * 0.4, ax + 4, 34 + lift * 0.6), ('ell', ax, 39 + lift, 6.5, 5.5)])
        s.rect('gold', ax - 4, 30 + lift * 0.5, ax + 4, 31 + lift * 0.5)
        s.dots([(ax - 3, 42 + lift), (ax, 43 + lift), (ax + 3, 42 + lift)], ('ember', 3))
    s.g('body')
    k = int(f[1])
    if atk is None:
        pose = [{'legL': (0, -2), 'armL': (0, 1), 'armR': (0, -1)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)},
                {'legR': (0, -2), 'armL': (0, -1), 'armR': (0, 1)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}][k]
    else:
        pose = [{'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'body': (0, 2), 'legL': (0, 0), 'legR': (0, 0)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}][atk]
    return s, pose, glow('#ff7a10', steps=((1, 70),) if atk != 1 else ((1, 170), (2, 90), (3, 40)))

boss('inferno_golem', 'Inferno Golem', 'volcanic', (64, 62), inferno_golem,
     'A walking iron furnace with brass bands, a grated chest full of fire and a helm that pours flame.',
     'Pounds the ground to send out a ring of fire.', 'Ground Pound: fists raised, a blazing slam, then a fire ring spreads.',
     {'move': 240, 'attack': [400, 180, 400]}, oy=4)

def fire_ring():
    out = []
    E = R['ember']
    for k in range(3):
        a = canvas(112, 72); r = (14, 30, 46)[k]
        for i in range(64):
            ang = i * 2 * math.pi / 64
            x, y = 56 + math.cos(ang) * r, 38 + math.sin(ang) * r * 0.6
            h = 3 + (i * 7 + k) % 5
            for t in range(h):
                put(a, x, y - t, E[4] if t == 0 else E[3] if t < h * 0.6 else E[2], 255 if k < 2 else 170)
        out.append(a)
    return out

extra('inferno_golem', 'Fire ring', 'Spreads out from the slam; you have to step through or outrun it.', fire_ring())

# ================================================================== SHADOW

def phantom_lord(view, f, var=None):
    s = new('phantom_lord'); cx = 28
    k = int(f[1])
    atk = k if f[0] == 'a' else None
    wave = (0, 1, 0, -1)[k] if atk is None else 0
    tips = [(cx - 14 + wave, 56), (cx - 8 - wave, 59), (cx - 2 + wave, 55), (cx + 4 - wave, 59), (cx + 10 + wave, 55), (cx + 15 - wave, 58)]
    pts = [(cx - 9, 20), (cx - 15, 36), tips[0], (cx - 10, 50), tips[1], (cx - 5, 51), tips[2], (cx + 1, 51), tips[3], (cx + 7, 51), tips[4], (cx + 12, 50), tips[5], (cx + 15, 36), (cx + 9, 20)]
    s.poly('royal', pts)
    line_dots(s, [(cx - 5, 26), (cx - 7, 48)], ('royal', 1)); line_dots(s, [(cx + 5, 26), (cx + 6, 48)], ('royal', 1))
    s.poly('gold', [(cx - 2, 24), (cx + 2, 24), (cx + 1, 48), (cx - 1, 48)])
    s.dots([(cx, 30), (cx, 36), (cx, 42)], ('vial_p', 4))
    blob(s, 'royal', [('ell', cx, 15, 9, 9), ('poly', [(cx - 9, 13), (cx, 4), (cx + 9, 13)])])
    s.poly('wraith', [(cx - 11, 20), (cx - 6, 17), (cx, 21), (cx + 6, 17), (cx + 11, 20), (cx + 8, 25), (cx, 24), (cx - 8, 25)])
    s.ell('shadow', cx, 16, 5.5, 5, flat=True)
    s.dots([(cx - 3, 15), (cx - 2, 15), (cx + 2, 15), (cx + 3, 15), (cx - 3, 16), (cx + 2, 16)], MAG)
    s.dots([(cx - 3, 15), (cx + 2, 15)], WHITE)
    crown(s, cx, 7, 6, 6, gem=MAG)
    s.dots([(cx - 7, 11), (cx - 6, 9), (cx - 4, 7)], ('royal', 4))
    if atk == 0:
        s.g('armR'); s.poly('royal', [(cx + 8, 22), (cx + 16, 12), (cx + 18, 14), (cx + 12, 26)]); s.ell('ghost', cx + 17, 11, 2, 2)
        s.dots([(cx + 16, 8), (cx + 18, 8), (cx + 19, 9)], ('ghost', 4)); s.g('body')
        s.g('armL'); s.poly('royal', [(cx - 8, 22), (cx - 15, 31), (cx - 13, 34), (cx - 7, 27)]); s.ell('ghost', cx - 14, 35, 2, 2); s.g('body')
    else:
        for side in (-1, 1):
            s.g('arm' + ('L' if side < 0 else 'R'))
            s.poly('royal', [(cx + side * 8, 22), (cx + side * 15, 31), (cx + side * 13, 34), (cx + side * 7, 27)])
            s.ell('ghost', cx + side * 14, 35, 2, 2); s.dots([(cx + side * 13, 38), (cx + side * 14, 38), (cx + side * 15, 38)], ('ghost', 4))
        s.g('body')
    bob = (0, -1, -2, -1)[k] if atk is None else -1
    if atk == 1:
        return s, {'body': (0, bob)}, chain(afterimages(16, '#b47ae0', 0.45), glow('#ff5ae0', steps=((1, 60),)))
    if atk == 2:
        return s, {'body': (0, bob)}, chain(afterimages(24, '#8440b8', 0.25), glow('#ff5ae0', steps=((1, 60),)))
    return s, {'body': (0, bob)}, glow('#b47ae0', steps=((1, 80), (2, 30)))

boss('phantom_lord', 'Phantom Lord', 'shadow', (56, 62), phantom_lord,
     'A crowned specter in a royal purple shroud with a gold stole, a ghostly collar and magenta eyes.',
     'Splits into clones; only the real one takes damage.', 'Mirror Court: raises a hand, splits into two copies, which slide apart.',
     {'move': 160, 'attack': [320, 260, 420]}, oy=2, floats=True)

def nightmare_king(view, f, var=None):
    s = new('nightmare_king'); cx = 34
    k = int(f[1])
    atk = k if f[0] == 'a' else None
    for i, x0 in enumerate(range(10, 60, 6)):
        sway = ((i + k) % 4) - 1.5
        s.line('shadow', [(x0, 46), (x0 + sway, 52), (x0 - sway, 58)], 3)
    blob(s, 'shadow', [('ell', cx, 37, 23, 15), ('poly', [(cx - 25, 34), (cx - 31, 50), (cx - 18, 46)]), ('poly', [(cx + 25, 34), (cx + 31, 50), (cx + 18, 46)])])
    # crown of horns
    for side in (-1, 1):
        s.poly('horn', [(cx + side * 12, 24), (cx + side * 21, 15), (cx + side * 24, 4), (cx + side * 19, 11), (cx + side * 9, 19)])
        s.poly('horn', [(cx + side * 6, 18), (cx + side * 9, 8), (cx + side * 8, 4), (cx + side * 4, 14)])
        s.dots([(cx + side * 24, 4), (cx + side * 8, 4)], ('gold', 4)); s.dots([(cx + side * 23, 6), (cx + side * 8, 5)], ('gold', 3))
    blob(s, 'nightm', [('ell', cx, 27, 14, 10)])
    s.rect('gold', cx - 11, 20, cx + 11, 21); s.dots([(cx - 6, 20), (cx, 20), (cx + 6, 20)], MAG)
    s.dots([(cx - 10, 23), (cx - 9, 22), (cx - 7, 22)], ('nightm', 4))
    mh = 6 if atk in (1, 2) else 3
    blob(s, 'black', [('poly', [(cx - 10, 36), (cx + 10, 36), (cx + 7, 36 + mh + 3), (cx - 7, 36 + mh + 3)])], flat=True)
    for x in range(cx - 9, cx + 10, 2):
        s.dot(x, 36, ('bone', 4)); s.dot(x, 37, ('bone', 3)); s.dot(x + 1, 36 + mh + 2, ('bone', 3))
    if atk in (1, 2): s.dots([(cx - 2, 40), (cx, 41), (cx + 2, 40)], ('demon', 3))
    eyes = [(cx - 8, 26, 2), (cx + 6, 26, 2), (cx - 1, 23, 2), (cx - 14, 31, 1), (cx + 13, 31, 1), (cx - 4, 31, 1), (cx + 3, 31, 1), (cx - 18, 38, 1), (cx + 17, 38, 1)]
    closed = {0: [], 1: [3], 2: [5, 6], 3: [2]}[k] if atk is None else []
    for i, (x, y, sz) in enumerate(eyes):
        if i in closed: s.dots([(x + d, y) for d in range(sz + 1)], ('nightm', 0)); continue
        sz2 = sz + (1 if atk == 1 and sz > 1 else 0)
        cells = [(x + dx, y + dy) for dx in range(sz2) for dy in range(sz2)] if sz2 > 1 else [(x, y), (x + 1, y)]
        s.dots(cells, MAG); s.dot(x, y, WHITE)
    bob = (0, -1, -1, 0)[k] if atk is None else (1, -1, 0)[atk]
    post = glow('#5c2e86', steps=((1, 130), (2, 70), (3, 28))) if atk != 1 else glow('#ff5ae0', steps=((1, 170), (2, 90), (3, 40)))
    return s, {'body': (0, bob)}, post

boss('nightmare_king', 'Nightmare King', 'shadow', (68, 60), nightmare_king,
     'A huge shadow beast with a crown of gold-tipped horns, nine magenta eyes and a mantle of shadow that drags on the ground.',
     'Its fear aura is twice as strong, and it calls Shade Assassins.', 'Dread Roar: hunches, every eye widens as the maw opens, then the roar.',
     {'move': 220, 'attack': [300, 420, 320]}, oy=2, floats=True)

def dread_wave():
    out = []
    for k in range(3):
        a = canvas(112, 72)
        for i in range(k + 1):
            r = 14 + i * 14 + k * 3
            ring(a, 56, 38, r, 2, MAG if i == k else R['nightm'][3], 220 - i * 70, 0.6)
        out.append(a)
    return out

extra('nightmare_king', 'Dread roar', 'Rolls out on the roar; while it passes you attack slower.', dread_wave())

# ================================================================== VOID

def void_hydra(view, f, var=None):
    s = new('void_hydra'); cx = 40
    k = int(f[1])
    atk = k if f[0] == 'a' else None
    heads = [(-22, 20), (0, 12), (22, 20)]
    bobs = [(0, (0, -1, 0, 1)[k]), (0, (1, 0, -1, 0)[k]), (0, (0, 1, 0, -1)[k])] if atk is None else [(0, 0)] * 3
    strike = [None] * 3
    if atk is not None: strike[atk] = True
    for i, ((hx0, hy0), (bx, by)) in enumerate(zip(heads, bobs)):
        dy = by + (12 if strike[i] else 0)
        hxp, hyp = cx + hx0, hy0 + dy
        s.g('neck%d' % i)
        blob(s, 'void', [('line', [(cx + hx0 * 0.4, 46), (cx + hx0 * 0.8, 34), (hxp, hyp + 4)], 9)])
        line_dots(s, [(cx + hx0 * 0.4 - 1, 46), (cx + hx0 * 0.8 - 1, 34), (hxp - 1, hyp + 5)], ('neon', 1))
        s.g('body')
    s.ell('void', cx, 50, 22, 11)
    line_dots(s, [(cx - 18, 52), (cx - 10, 49), (cx - 6, 54)], ('neon', 2)); line_dots(s, [(cx + 17, 51), (cx + 9, 48), (cx + 5, 55)], ('neon', 2))
    s.dots([(cx - 15, 44), (cx - 14, 43), (cx - 12, 42)], ('void', 4))
    for i, ((hx0, hy0), (bx, by)) in enumerate(zip(heads, bobs)):
        dy = by + (12 if strike[i] else 0)
        hxp, hyp = cx + hx0, hy0 + dy
        s.g('head%d' % i)
        for side in (-1, 1):
            s.poly('void', [(hxp + side * 5, hyp - 1), (hxp + side * 11, hyp - 3), (hxp + side * 9, hyp), (hxp + side * 12, hyp + 1), (hxp + side * 6, hyp + 3)])
            s.dots([(hxp + side * 11, hyp - 3), (hxp + side * 12, hyp + 1)], ('neon', 3))
        s.poly('void', [(hxp - 1, hyp - 4), (hxp, hyp - 9), (hxp + 1, hyp - 4)]); s.dot(hxp, hyp - 8, ('neon', 3))
        blob(s, 'void', [('ell', hxp, hyp, 6, 4.5), ('poly', [(hxp - 4, hyp + 2), (hxp + 4, hyp + 2), (hxp + 2, hyp + 10), (hxp - 2, hyp + 10)])])
        if strike[i]:
            blob(s, 'neonp', [('poly', [(hxp - 3, hyp + 5), (hxp + 3, hyp + 5), (hxp + 2, hyp + 12), (hxp - 2, hyp + 12)])])
            s.dots([(hxp - 2, hyp + 4), (hxp + 2, hyp + 4)], WHITE)
        s.dots([(hxp - 3, hyp - 1), (hxp - 2, hyp - 1), (hxp + 2, hyp - 1), (hxp + 3, hyp - 1)], R['neon'][3]); s.dots([(hxp - 3, hyp - 1), (hxp + 2, hyp - 1)], WHITE)
        s.dots([(hxp - 1, hyp + 6), (hxp + 1, hyp + 6)], ('neon', 2))
        s.dots([(hxp - 4, hyp - 3), (hxp - 3, hyp - 4)], ('void', 4))
        s.g('body')
    return s, None, glow(R['neon'][2], steps=((1, 110), (2, 40)))

boss('void_hydra', 'Void Hydra', 'void', (80, 64), void_hydra,
     'Three horned void serpents on one body, with neon eyes, neon lines down each neck and cracks of light in the body.',
     'Three heads attack on their own; each can be targeted.', 'Triple Strike: left, middle and right heads lunge one after another, jaws glowing pink.',
     {'move': 180, 'attack': [260, 260, 260]}, oy=2)

def reality_breaker(view, f, var=None):
    s = new('reality_breaker'); cx = 28
    k = int(f[1])
    atk = k if f[0] == 'a' else None
    gap = 1 + (1 if atk == 0 else 0)
    # floating armor plates with neon light between them
    blob(s, 'neon', [('poly', [(cx - 11, 23), (cx + 11, 23), (cx + 9, 45), (cx - 9, 45)])])
    s.poly('void', [(cx - 12 - gap, 21), (cx - 1 - gap, 21), (cx - 2 - gap, 33), (cx - 11 - gap, 34)])
    s.poly('void', [(cx + 1 + gap, 21), (cx + 12 + gap, 21), (cx + 11 + gap, 32), (cx + 2 + gap, 33)])
    s.poly('void', [(cx - 10 - gap, 36 + gap), (cx - 1, 35 + gap), (cx - 1, 47 + gap), (cx - 8 - gap, 46 + gap)])
    s.poly('void', [(cx + 1, 35 + gap), (cx + 10 + gap, 36 + gap), (cx + 8 + gap, 46 + gap), (cx + 1, 47 + gap)])
    s.dots([(cx - 10, 23), (cx - 9, 22), (cx + 3, 23)], ('void', 4))
    s.g('legL'); s.poly('void', [(cx - 8, 49), (cx - 2, 49), (cx - 3, 60), (cx - 9, 60)]); s.dot(cx - 6, 54, ('neon', 3))
    s.g('legR'); s.poly('void', [(cx + 2, 49), (cx + 8, 49), (cx + 9, 60), (cx + 3, 60)]); s.dot(cx + 6, 54, ('neon', 3))
    s.g('body')
    # head: a cracked helm with one huge eye
    blob(s, 'void', [('ell', cx, 12, 8, 8), ('poly', [(cx - 2, 5), (cx, -2), (cx + 2, 5)])])
    for side in (-1, 1):
        s.poly('void', [(cx + side * 6, 2), (cx + side * 8, -2), (cx + side * 9, 3), (cx + side * 7, 5)]); s.dot(cx + side * 8, 1, ('neon', 3))
    s.ell('cream', cx, 13, 4.5, 3.5, flat=True)
    s.dots([(cx - 1, 12), (cx, 12), (cx + 1, 12), (cx - 1, 13), (cx, 13), (cx + 1, 13), (cx, 14)], R['neonp'][3]); s.dots([(cx, 12), (cx, 13)], EYE); s.dot(cx - 1, 12, WHITE)
    line_dots(s, [(cx + 3, 5), (cx + 1, 8), (cx + 4, 10)], ('neon', 3)); line_dots(s, [(cx - 6, 16), (cx - 3, 18)], ('neon', 2))
    # hands
    for side in (-1, 1):
        s.g('arm' + ('L' if side < 0 else 'R'))
        hxp = cx + side * 19
        s.poly('void', [(cx + side * 12, 22), (cx + side * 18, 26), (cx + side * 17, 33), (cx + side * 13, 30)])
        s.ell('neonp', hxp, 37, 4, 4); s.dots([(hxp - 1, 36), (hxp, 35)], WHITE)
        s.dots([(hxp - 3, 41), (hxp, 42), (hxp + 3, 41)], ('neonp', 4))
    s.g('body')
    for i, (x, y) in enumerate(((cx - 24, 14), (cx + 23, 10), (cx - 22, 52), (cx + 24, 50))):
        dy = ((i + k) % 3) - 1
        s.poly('void', [(x - 2, y + 1 + dy), (x, y - 3 + dy), (x + 2, y + 1 + dy), (x, y + 3 + dy)]); s.dot(x, y + dy, ('neon', 3))
    bob = (0, -1, -2, -1)[k] if atk is None else 0
    if atk == 1:
        return s, {'body': (0, bob)}, chain(speckle(0.55, 11), fade(0.6), glow(R['neonp'][3], steps=((1, 120),)))
    if atk == 2:
        return s, {'body': (0, bob)}, chain(flash('#ffe0ff', 0.4), glow(R['neonp'][3], steps=((1, 200), (2, 110), (3, 50))))
    return s, {'body': (0, bob)}, glow(R['neon'][2], steps=((1, 110), (2, 40)))

boss('reality_breaker', 'Reality Breaker', 'void', (56, 62), reality_breaker,
     'A void knight whose armor plates float apart with neon light between them; one huge pink eye, glowing pink hands and drifting shards.',
     'Teleports around the arena and opens Reality Tears.', 'Break Step: its plates spread, it shatters into static, then snaps back in a pink flash.',
     {'move': 170, 'attack': [300, 300, 300]}, oy=2, floats=True)
