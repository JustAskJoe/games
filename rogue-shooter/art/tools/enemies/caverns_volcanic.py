"""Caverns and Volcanic enemies: Crystal Golem, Shadow Crawler, Healer Moth, Magma Slime,
Fire Imp and Lava Brute."""
import math
from ekit import (R, hx, EYE, WHITE, BLUSH, blob, eye2, line_dots, new, enemy, extra,
                  glow, fade, flash, speckle, chain, canvas, put, disc, ring, sparkle, outline)

EMBER = hx('#ffd27a')

def crystal(s, x, y, h, w=3, lean=0, m='crystal'):
    """A crystal growing up from (x, y) with its tip leaning `lean` px."""
    pts = [(x - w / 2, y), (x - w / 2 + lean * 0.6, y - h * 0.65), (x + lean, y - h),
           (x + w / 2 + lean * 0.6, y - h * 0.65), (x + w / 2, y)]
    s.poly(m, pts)
    line_dots(s, [(x - w / 2 + 1 + lean * 0.1, y - 1), (x + lean * 0.8 - 0.5, y - h + 2)], (m, 4))
    s.dot(round(x + lean), round(y - h + 1), WHITE)

def walk_heavy(view, k):
    if view == 'side':
        return [{'legF': (2, -1), 'legB': (-2, 0), 'armF': (-1, 0)}, {'body': (0, 1), 'legF': (0, 0), 'legB': (0, 0)},
                {'legF': (-2, 0), 'legB': (2, -1), 'armF': (1, 0)}, {'body': (0, 1), 'legF': (0, 0), 'legB': (0, 0)}][k]
    return [{'legL': (0, -2), 'armL': (0, 1), 'armR': (0, -1)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)},
            {'legR': (0, -2), 'armL': (0, -1), 'armR': (0, 1)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}][k]

# ------------------------------------------------------------------ CRYSTAL GOLEM

def golem(view, f, var=None):
    s = new('golem'); cx = 22
    eyes = R['crystal'][4]
    if view in ('front', 'back'):
        s.g('legL'); blob(s, 'stone', [('rect', 13, 33, 19, 40), ('ell', 16, 41, 4.5, 2.2)])
        s.g('legR'); blob(s, 'stone', [('rect', 25, 33, 31, 40), ('ell', 28, 41, 4.5, 2.2)])
        s.g('body')
        if view == 'front':
            crystal(s, 22, 12, 9, 4, 0); crystal(s, 17, 14, 6, 3, -2); crystal(s, 27, 14, 6, 3, 2)
        else:
            s.ell('stone', cx, 13, 5.5, 4)
        s.ell('stone', cx, 25, 12.5, 11)
        line_dots(s, [(14, 22), (16, 25), (15, 28)], ('stone', 1)); line_dots(s, [(30, 27), (28, 30), (29, 32)], ('stone', 1))
        s.dots([(13, 18), (14, 17), (15, 16), (12, 20)], ('stone', 4))
        if view == 'front':
            crystal(s, 22, 32, 7, 5, 0)
            s.ell('stone', cx, 16, 6, 4.5)
            s.dots([(18, 14), (19, 14), (20, 14), (24, 14), (25, 14), (26, 14)], ('stone', 0))
            s.dots([(19, 15), (20, 15), (24, 15), (25, 15)], eyes); s.dots([(19, 16), (25, 16)], R['crystal'][2])
            s.dots([(21, 19), (22, 19), (23, 19)], ('stone', 1))
            s.dots([(18, 13), (17, 14)], ('stone', 4))
        else:
            for x, y, h, w, l in ((22, 25, 10, 4, 0), (16, 27, 7, 3, -2), (28, 27, 7, 3, 2), (19, 19, 6, 3, -1), (26, 20, 6, 3, 1)):
                crystal(s, x, y, h, w, l)
        for side, ax in ((-1, 8), (1, 36)):
            s.g('armL' if side < 0 else 'armR')
            blob(s, 'stone', [('ell', ax, 24, 5, 6.5), ('ell', ax, 34, 5.5, 4.5)])
            crystal(s, ax + side * 1, 19, 8, 3, side * 2)
            if view == 'front': s.dots([(ax - 2, 36), (ax, 37), (ax + 2, 36)], ('stone', 1))
            s.dots([(ax - 3, 31), (ax - 2, 30)], ('stone', 4))
        s.g('body')
    else:
        s.g('armB'); blob(s, 'stone', [('ell', 15, 33, 4, 3.5)])
        s.g('legB'); blob(s, 'stone', [('rect', 15, 33, 20, 40), ('ell', 18, 41, 4, 2.2)])
        s.g('legF'); blob(s, 'stone', [('rect', 22, 33, 27, 40), ('ell', 26, 41, 4.5, 2.2)])
        s.g('body')
        crystal(s, 11, 18, 9, 4, -3); crystal(s, 15, 14, 9, 3, -1); crystal(s, 9, 25, 6, 3, -4)
        s.ell('stone', 20, 25, 11, 11)
        line_dots(s, [(12, 22), (14, 26), (13, 30)], ('stone', 1))
        s.dots([(12, 18), (13, 17), (14, 16)], ('stone', 4))
        s.ell('stone', 29, 18, 5, 4.5)
        s.dots([(30, 16), (31, 16), (32, 16), (33, 16)], ('stone', 0)); s.dots([(32, 17), (33, 17)], eyes)
        s.dots([(31, 21), (32, 21)], ('stone', 1))
        crystal(s, 26, 15, 5, 3, 1)
        s.g('armF')
        blob(s, 'stone', [('ell', 22, 26, 4.5, 6), ('ell', 25, 35, 5, 4.5)])
        crystal(s, 21, 21, 7, 3, -1)
        s.dots([(27, 37), (28, 35)], ('stone', 1))
        s.g('body')
    return s, walk_heavy(view, int(f[1]))

enemy('golem', 'Crystal Golem', 'caverns', (44, 48), ['front', 'side', 'back'], golem,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 240}, oy=2,
      note='A boulder of cave stone with huge fists and cyan crystals growing from its shoulders and back, glowing eyes and a gem in its chest. Slow, heavy stomp.',
      behavior='Very high HP, very slow. Shatters into 3 damaging crystal shards when it dies.')

def shard_frames():
    out = []
    for k in range(4):
        a = canvas(12, 12)
        ang = k * math.pi / 4
        dx, dy = math.cos(ang), math.sin(ang)
        for t in range(-4, 5):
            w = 1 if abs(t) > 2 else 2
            for o in range(-w // 2, w - w // 2):
                c = R['crystal'][4] if t < -1 else R['crystal'][3] if t < 2 else R['crystal'][2]
                put(a, 6 + dx * t - dy * o, 6 + dy * t + dx * o, c)
        put(a, 6 - dx * 3, 6 - dy * 3, WHITE)
        out.append(outline(a, '#0e3a4a'))
    return out

extra('golem', 'Crystal shard', 'Three fly out when it dies and spin as they travel.', shard_frames())

# ------------------------------------------------------------------ SHADOW CRAWLER

CRAWL_LEGS = [((-3, 12), (-9, 7), (-13, 9)), ((-3, 14), (-11, 11), (-15, 14)),
              ((-3, 16), (-11, 17), (-15, 21)), ((-3, 18), (-9, 21), (-12, 25))]

def crawler(view, f, var=None):
    s = new('crawler'); cx = 17
    for i, leg in enumerate(CRAWL_LEGS):
        for side in (-1, 1):
            grp = 'legA' if (i % 2 == 0) == (side < 0) else 'legB'
            s.g(grp)
            pts = [(cx + side * x, y) for x, y in leg]
            s.line('nightm', pts[:2], 2); s.line('nightm', pts[1:], 1)
            s.dot(*pts[1], ('nightm', 4))
    s.g('body')
    s.ell('shadow', cx, 7, 6.5, 6)
    s.dots([(cx, 3), (cx - 1, 4), (cx + 1, 4), (cx, 5), (cx, 8), (cx - 1, 9), (cx + 1, 9), (cx, 10)], ('nightm', 3))
    s.dots([(cx - 4, 4), (cx - 3, 3)], ('shadow', 4))
    s.ell('shadow', cx, 16, 4.6, 4.2)
    s.dots([(cx - 3, 13), (cx - 2, 13)], ('shadow', 4))
    pink, pk2 = hx('#ff4aa0'), hx('#ffa0d0')
    s.dots([(cx - 2, 17), (cx - 1, 17), (cx + 1, 17), (cx + 2, 17)], pink); s.dots([(cx - 2, 17), (cx + 1, 17)], pk2)
    s.dots([(cx - 3, 15), (cx + 3, 15), (cx - 1, 15), (cx + 1, 15)], pink)
    s.dots([(cx - 1, 20), (cx + 1, 20)], ('bone', 3))
    k = int(f[1])
    if f[0] == 'm':
        pose = [{'legA': (0, -1)}, {}, {'legB': (0, -1)}, {}][k]
        return s, pose, glow('#3c1c5c', steps=((1, 90),))
    post = [chain(speckle(0.86, 5), fade(0.45)), chain(speckle(0.45, 7), fade(0.8)),
            glow('#c040ff', steps=((1, 150), (2, 60)))][k]
    return s, {}, post

enemy('crawler', 'Shadow Crawler', 'caverns', (34, 30), ['front'], crawler,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 80, 'attack': [300, 200, 300]},
      note='A long-legged cave spider of living shadow with an hourglass mark and a cluster of pink eyes. Seen from above, one direction. Reveal: hidden shimmer, half visible, then it flares purple.',
      behavior='Low HP, fast. Invisible until you are close; the shimmer is the warning.')

# ------------------------------------------------------------------ HEALER MOTH

def moth(view, f, var=None):
    s = new('moth'); cx = 17
    k = int(f[1])
    sc, up = (1.0, 0.85, 0.62, 0.85)[k], (-1, 0, 2, 0)[k]
    def X(x): return cx + (x - cx) * sc
    for side in (-1, 1):
        def P(x, y): return (X(cx + side * x), y)
        s.g('wings')
        s.poly('mothw', [P(2, 16), P(9, 19), P(11, 24 - up // 2), P(6, 26), P(2, 21)])
        s.poly('mothw', [P(2, 12), P(10, 4 + up), P(15, 6 + up), P(16, 11 + up // 2), P(12, 16), P(3, 17)])
        ex, ey = P(9, 10 + up // 2)
        ex = round(ex)
        s.dots([(ex - 1, ey), (ex + 1, ey), (ex, ey - 1), (ex, ey + 1)], ('vial_g', 3)); s.dot(ex, ey, ('vial_g', 4))
        s.dots([(ex - 1, ey - 1), (ex + 1, ey - 1), (ex - 1, ey + 1), (ex + 1, ey + 1)], ('mothw', 0))
        fx_, fy = P(7, 22); s.dot(round(fx_), fy, ('vial_g', 3))
        s.dots([(round(X(cx + side * 13)), 7 + up), (round(X(cx + side * 14)), 9 + up)], ('mothw', 4))
    s.g('body')
    s.ell('mothb', cx, 16, 3, 6)
    s.ell('mothb', cx, 9, 3.4, 2.8)
    s.dots([(cx - 2, 12), (cx + 2, 12), (cx - 1, 13), (cx + 1, 13), (cx, 12)], ('mothb', 4))
    s.dots([(cx - 1, 17), (cx, 19), (cx + 1, 21)], ('mothb', 1)); s.dots([(cx, 15), (cx + 1, 17), (cx - 1, 19)], ('mothb', 1))
    s.dots([(cx - 2, 9), (cx + 2, 9)], EYE); s.dots([(cx - 2, 8), (cx + 2, 8)], WHITE)
    for side in (-1, 1):
        line_dots(s, [(cx + side, 6), (cx + side * 3, 3), (cx + side * 5, 1)], ('mothb', 2))
        s.dots([(cx + side * 3, 2), (cx + side * 4, 4), (cx + side * 5, 0), (cx + side * 6, 2)], ('mothb', 3))
    return s, {'body': (0, (0, -1, -1, 0)[k]), 'wings': (0, (0, -1, -1, 0)[k])}, glow('#72dc6e', steps=((1, 60),))

enemy('moth', 'Healer Moth', 'caverns', (34, 30), ['front'], moth,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 110}, oy=2,
      note='A fluffy cream moth with lilac wings, feathery antennae and glowing green eyespots, with a faint green aura. Four-frame flap.',
      behavior='Low HP, never attacks. Heals nearby enemies 2% HP per second. Kill it first.')

def heal_pulse():
    out = []
    g = R['vial_g']
    for k in range(3):
        a = canvas(44, 44); r = 8 + k * 7
        ring(a, 22, 24, r, 2, g[3], (220, 170, 110)[k], 0.8)
        ring(a, 22, 24, r - 2, 1, g[4], (160, 110, 70)[k], 0.8)
        for i, (px, py) in enumerate(((10, 18), (32, 14), (22, 8), (14, 30), (30, 30))):
            y = py - k * 3
            if (i + k) % 2 == 0 or k == 1:
                for d in (-1, 0, 1): put(a, px + d, y, g[3]); put(a, px, y + d, g[3])
                put(a, px, y, WHITE)
        out.append(a)
    return out

extra('moth', 'Heal pulse', 'Plays around the moth each time it heals; the plus signs drift up.', heal_pulse())

# ------------------------------------------------------------------ MAGMA SLIME

def magma(view, f, var=None):
    s = new('magma'); cx = 15
    rx, ry, lift = {'m0': (10.5, 8.5, 0), 'm1': (12, 7.2, 0), 'm2': (9.5, 9.6, 1), 'm3': (11.4, 7.8, 0)}[f]
    base = 22 - lift; cy = base - ry * 0.72; top = cy - ry
    blob(s, 'lava', [('ell', cx, cy, rx, ry), ('cut', 0, base + 1, 40, 40)])
    blob(s, 'basalt', [('ell', cx - 0.5, cy - 1, rx - 1.2, ry - 1.2), ('cut', 0, base - 2, 40, 40)])
    L3, L4 = R['lava'][3], R['lava'][4]
    line_dots(s, [(cx - rx + 3, cy), (cx - 5, cy - 2), (cx - 3, cy - 5), (cx - 4, round(top + 2))], L3)
    line_dots(s, [(cx + 2, round(top + 1)), (cx + 3, cy - 4), (cx + 7, cy - 3), (cx + rx - 2, cy)], L3)
    line_dots(s, [(cx - 2, cy + 3), (cx + 1, cy + 2), (cx + 4, cy + 4)], L3)
    s.dots([(cx - 5, cy - 2), (cx + 3, cy - 4), (cx + 1, cy + 2)], L4)
    ey = round(cy - 1)
    for ex in (cx - 4, cx + 2):
        s.dots([(ex, ey), (ex + 1, ey), (ex, ey + 1), (ex + 1, ey + 1)], L4); s.dot(ex, ey, WHITE)
    s.dots([(cx - 5, ey - 1), (cx - 4, ey - 2), (cx + 3, ey - 2), (cx + 4, ey - 1)], ('basalt', 0))
    s.dots([(cx - 2, ey + 3), (cx - 1, ey + 4), (cx, ey + 4), (cx + 1, ey + 3)], L3)
    s.dots([(round(cx - rx + 3), round(top + 3)), (round(cx - rx + 4), round(top + 2))], ('basalt', 4))
    drips = [(round(cx - rx + 2), base + 1), (round(cx + rx - 3), base + 1), (cx + 1, base + 1)]
    s.dots(drips[:1 + int(f[1]) % 3], L3)
    return s, None, glow('#ff7a10', steps=((1, 120), (2, 50)))

enemy('magma', 'Magma Slime', 'volcanic', (30, 27), ['front'], magma,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 200},
      note='A heavier slime with a black basalt crust split by glowing lava cracks, molten eyes and a dripping rim. Glows orange.',
      behavior='Medium HP. Leaves a fire trail behind it that burns for 3 seconds.')

def fire_patch():
    out = []
    for k in range(3):
        a = canvas(22, 14)
        disc(a, 11, 10, 8, R['basalt'][1], 200, 0.4)
        disc(a, 11, 10, 6, R['lava'][1], 220, 0.4)
        for i, (x, h) in enumerate(((5, 5), (9, 8), (13, 6), (17, 4), (11, 3))):
            hh = h + ((i + k) % 3) - 1
            for t in range(hh):
                c = R['ember'][4] if t < 1 else R['ember'][3] if t < hh * 0.5 else R['ember'][2]
                put(a, x, 11 - t, c)
                if t < hh - 2: put(a, x + 1, 11 - t, R['ember'][2])
        out.append(outline(a))
    return out

extra('magma', 'Fire trail', 'Left on the ground behind it; flickers for 3 seconds, then fades.', fire_patch())

# ------------------------------------------------------------------ FIRE IMP

def fireball_dots(s, x, y, big):
    r = 3.5 if big else 2
    s.ell('ember', x, y, r, r)
    s.dots([(x - 1, y - 1), (x, y - 1)], WHITE)
    if big: s.dots([(x - 1, y - 5), (x + 1, y - 6), (x, y - 5), (x + 2, y - 4)], ('ember', 3))

def imp(view, f, var=None):
    s = new('imp'); cx = 15
    atk = int(f[1]) if f[0] == 'a' else None
    gold = R['ember'][3]
    if view == 'front' or view == 'back':
        if view == 'front':
            s.g('wings')
            s.poly('demon', [(cx - 3, 16), (cx - 11, 9), (cx - 12, 14), (cx - 10, 13), (cx - 10, 17), (cx - 8, 16), (cx - 5, 20)])
            s.poly('demon', [(cx + 3, 16), (cx + 11, 9), (cx + 12, 14), (cx + 10, 13), (cx + 10, 17), (cx + 8, 16), (cx + 5, 20)])
            s.g('body')
            s.line('imp', [(cx + 3, 25), (cx + 8, 25), (cx + 10, 21)], 1); s.poly('imp', [(cx + 9, 21), (cx + 12, 18), (cx + 11, 22)])
        s.g('legL'); s.rect('imp', cx - 3, 25, cx - 2, 28); s.dots([(cx - 4, 29), (cx - 3, 29), (cx - 2, 29)], ('horn', 1))
        s.g('legR'); s.rect('imp', cx + 2, 25, cx + 3, 28); s.dots([(cx + 2, 29), (cx + 3, 29), (cx + 4, 29)], ('horn', 1))
        s.g('body')
        s.ell('imp', cx, 22, 4.5, 4.5)
        if view == 'front':
            s.dots([(cx - 1, 22), (cx, 21), (cx + 1, 22), (cx, 23)], ('imp', 4))
        s.poly('imp', [(cx - 6, 13), (cx - 11, 10), (cx - 6, 16)]); s.poly('imp', [(cx + 6, 13), (cx + 11, 10), (cx + 6, 16)])
        s.ell('imp', cx, 13, 6.5, 5.5)
        s.poly('horn', [(cx - 5, 10), (cx - 8, 6), (cx - 8, 2), (cx - 6, 5), (cx - 3, 8)])
        s.poly('horn', [(cx + 5, 10), (cx + 8, 6), (cx + 8, 2), (cx + 6, 5), (cx + 3, 8)])
        s.dots([(cx - 8, 2), (cx + 8, 2)], ('horn', 4))
        s.dots([(cx, 7), (cx - 1, 8), (cx + 1, 8), (cx, 6)], ('ember', 3)); s.dot(cx, 8, ('ember', 4))
        if view == 'front':
            s.dots([(cx - 4, 12), (cx - 3, 12), (cx + 2, 12), (cx + 3, 12)], gold); s.dots([(cx - 3, 12), (cx + 2, 12)], EYE)
            s.dots([(cx - 5, 11), (cx - 4, 11), (cx + 3, 11), (cx + 4, 11)], ('imp', 0))
            s.dots([(cx - 3, 15), (cx - 2, 16), (cx - 1, 16), (cx, 16), (cx + 1, 16), (cx + 2, 16), (cx + 3, 15)], ('imp', 0))
            s.dots([(cx - 2, 15), (cx + 2, 15)], WHITE)
        else:
            s.dots([(cx - 1, 15), (cx, 16), (cx + 1, 17), (cx, 19), (cx - 1, 20)], ('imp', 1))
            s.g('wings')
            s.poly('demon', [(cx - 2, 17), (cx - 11, 10), (cx - 12, 15), (cx - 10, 14), (cx - 10, 18), (cx - 8, 17), (cx - 4, 21)])
            s.poly('demon', [(cx + 2, 17), (cx + 11, 10), (cx + 12, 15), (cx + 10, 14), (cx + 10, 18), (cx + 8, 17), (cx + 4, 21)])
            s.g('body')
            s.line('imp', [(cx, 25), (cx - 1, 28), (cx + 2, 30)], 1); s.poly('imp', [(cx + 2, 29), (cx + 5, 30), (cx + 2, 32)])
        if atk is None:
            s.g('armL'); s.rect('imp', cx - 6, 19, cx - 5, 23); s.g('armR'); s.rect('imp', cx + 5, 19, cx + 6, 23); s.g('body')
        elif atk < 2:
            s.rect('imp', cx - 6, 14, cx - 5, 19); s.rect('imp', cx + 5, 14, cx + 6, 19)
            fireball_dots(s, cx, 3 if atk else 5, atk == 1)
        else:
            s.rect('imp', cx - 6, 19, cx - 5, 23)
            s.rect('imp', cx + 5, 20 if view == 'front' else 12, cx + 6, 23 if view == 'front' else 17)
            if view == 'front': s.dots([(cx + 6, 25), (cx + 5, 26), (cx + 7, 26)], ('ember', 4))
    else:
        s.g('wings')
        s.poly('demon', [(cx - 1, 16), (cx - 10, 8), (cx - 11, 13), (cx - 9, 12), (cx - 9, 16), (cx - 7, 15), (cx - 3, 20)])
        s.g('body')
        s.line('imp', [(cx - 3, 25), (cx - 8, 25), (cx - 10, 21)], 1); s.poly('imp', [(cx - 9, 21), (cx - 12, 18), (cx - 11, 22)])
        s.g('legB'); s.rect('imp', cx - 1, 25, cx, 28); s.dots([(cx - 1, 29), (cx, 29), (cx + 1, 29)], ('horn', 0))
        s.g('legF'); s.rect('imp', cx + 1, 25, cx + 2, 28); s.dots([(cx + 1, 29), (cx + 2, 29), (cx + 3, 29)], ('horn', 1))
        s.g('body')
        s.ell('imp', cx + 1, 22, 4.5, 4.5); s.dots([(cx + 3, 22), (cx + 4, 21)], ('imp', 4))
        s.poly('imp', [(cx - 3, 13), (cx - 8, 10), (cx - 3, 16)])
        s.ell('imp', cx + 1, 13, 6, 5.5)
        s.poly('imp', [(cx + 5, 13), (cx + 9, 14), (cx + 6, 16)])
        s.poly('horn', [(cx - 2, 9), (cx - 4, 5), (cx - 7, 2), (cx - 4, 3), (cx + 1, 8)])
        s.dots([(cx + 1, 7), (cx, 8), (cx + 2, 8), (cx + 1, 6)], ('ember', 3))
        s.dots([(cx + 4, 12), (cx + 5, 12)], gold); s.dot(cx + 5, 12, EYE); s.dots([(cx + 3, 11), (cx + 4, 11)], ('imp', 0))
        s.dots([(cx + 3, 15), (cx + 4, 16), (cx + 5, 16), (cx + 6, 15)], ('imp', 0)); s.dot(cx + 5, 15, WHITE)
        if atk is None:
            s.g('armF'); s.rect('imp', cx + 1, 19, cx + 2, 23); s.g('body')
        elif atk < 2:
            s.rect('imp', cx + 1, 14, cx + 2, 19); fireball_dots(s, cx + 1, 3 if atk else 5, atk == 1)
        else:
            s.rect('imp', cx + 3, 18, cx + 8, 19); s.dots([(cx + 10, 18), (cx + 11, 17), (cx + 11, 19)], ('ember', 4))
    k = int(f[1])
    if atk is None:
        pose = [{'wings': (0, -1)}, {'body': (0, -1), 'wings': (0, -2)}, {'body': (0, -2), 'wings': (0, -1)}, {'body': (0, -1), 'wings': (0, 0)}][k]
    else:
        pose = {'body': (0, -1), 'wings': (0, (-2, -1, 0)[atk])}
    return s, pose, glow('#ff7a10', steps=((1, 50),))

enemy('imp', 'Fire Imp', 'volcanic', (30, 36), ['front', 'side', 'back'], imp,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 100, 'attack': [200, 260, 180]}, oy=4,
      note='A pot-bellied red imp with curled horns, a flame tuft, a wicked grin, little bat wings and an arrow-tipped tail. Hovers. Attack: raises a spark, grows it into a fireball overhead, throws.',
      behavior='Low HP, fast. Teleports a short way, then throws a fireball.')

def fireball():
    out = []
    for k in range(2):
        a = canvas(18, 12)
        for t in range(9):
            r = 1 + t * 0.35
            c = R['ember'][2] if t < 4 else R['ember'][3]
            disc(a, 3 + t, 6 + (1 if (t + k) % 3 == 0 else 0) * (-1 if t % 2 else 1), min(r, 3.4), c, 120 + t * 15)
        disc(a, 13, 6, 3.5, R['ember'][3]); disc(a, 13.5, 5.5, 2.2, R['ember'][4]); put(a, 13, 5, WHITE); put(a, 14, 5, WHITE)
        out.append(outline(a, '#5a1a00'))
    return out

def tele_puff():
    out = []
    for k in range(3):
        a = canvas(32, 32); r = 5 + k * 4
        for i in range(7):
            ang = i * 2 * math.pi / 7 + k * 0.3
            disc(a, 16 + math.cos(ang) * r * 0.7, 18 + math.sin(ang) * r * 0.6, 4.5 - k, R['shadow'][3], (230, 190, 120)[k])
        disc(a, 16, 18, r * 0.5, R['shadow'][4], (230, 160, 60)[k])
        for i in range(6):
            ang = i * 1.1 + k
            put(a, 16 + math.cos(ang) * (r + 3), 16 + math.sin(ang) * (r + 2), R['ember'][3 + (i % 2)])
        out.append(outline(a) if k < 2 else a)
    return out

extra('imp', 'Fireball', 'Thrown after each teleport; points right, rotate to aim.', fireball())
extra('imp', 'Teleport puff', 'Plays where it vanishes and again where it reappears.', tele_puff())

# ------------------------------------------------------------------ LAVA BRUTE

def brute(view, f, var=None):
    s = new('brute'); cx = 23
    heat = int(f[1]) + 1 if f[0] == 'a' else 0
    L3, L4 = R['lava'][3], R['lava'][4]
    def veins(paths):
        for p in paths: line_dots(s, p, L4 if heat >= 2 else L3)
    if view in ('front', 'back'):
        s.g('legL'); blob(s, 'basalt', [('rect', 14, 34, 20, 40), ('ell', 17, 41, 4.5, 2.2)])
        s.g('legR'); blob(s, 'basalt', [('rect', 26, 34, 32, 40), ('ell', 29, 41, 4.5, 2.2)])
        s.g('body')
        for pts in ([(15, 19), (12, 10), (19, 16)], [(21, 16), (23, 7), (26, 16)], [(28, 17), (34, 10), (31, 19)]):
            s.poly('basalt', pts)
        s.dots([(12, 11), (23, 8), (33, 11)], ('lava', 3))
        s.ell('basalt', cx, 27, 14, 10)
        if view == 'front':
            blob(s, 'lava', [('ell', cx, 29, 5, 4)])
            s.dots([(cx - 1, 28), (cx, 28), (cx + 1, 29)], L4)
            veins([[(cx - 5, 29), (cx - 9, 27), (cx - 11, 24)], [(cx + 5, 29), (cx + 8, 32), (cx + 11, 30)], [(cx, 25), (cx - 1, 22), (cx + 1, 20)]])
            s.poly('horn', [(cx - 4, 18), (cx - 9, 15), (cx - 10, 10), (cx - 7, 13), (cx - 3, 16)])
            s.poly('horn', [(cx + 4, 18), (cx + 9, 15), (cx + 10, 10), (cx + 7, 13), (cx + 3, 16)])
            s.dots([(cx - 10, 10), (cx + 10, 10), (cx - 9, 11), (cx + 9, 11)], ('horn', 4))
            s.ell('black', cx, 20, 5.5, 4.4)
            s.dots([(cx - 4, 17), (cx - 3, 17), (cx - 2, 17)], ('black', 4))
            s.dots([(cx - 3, 19), (cx - 2, 19), (cx + 2, 19), (cx + 3, 19), (cx - 3, 20), (cx - 2, 20), (cx + 2, 20), (cx + 3, 20)], L4)
            s.dots([(cx - 3, 19), (cx + 2, 19)], WHITE); s.dots([(cx - 4, 18), (cx - 3, 18), (cx + 3, 18), (cx + 4, 18)], ('black', 0))
            s.dots([(cx - 2, 22), (cx - 1, 23), (cx, 23), (cx + 1, 23), (cx + 2, 22)], L3 if heat < 2 else L4)
        else:
            s.ell('basalt', cx, 19, 5, 3.5)
            veins([[(cx, 18), (cx, 22), (cx - 1, 26), (cx + 1, 30), (cx, 34)], [(cx - 9, 25), (cx - 5, 28), (cx - 1, 26)], [(cx + 9, 26), (cx + 5, 29), (cx + 1, 30)]])
            for pts in ([(17, 24), (15, 18), (20, 23)], [(27, 24), (31, 18), (26, 23)]):
                s.poly('basalt', pts)
        s.dots([(12, 21), (13, 20), (14, 19), (11, 23)], ('basalt', 4))
        for side, ax in ((-1, 8), (1, 38)):
            s.g('armL' if side < 0 else 'armR')
            blob(s, 'basalt', [('ell', ax, 25, 5.5, 7), ('ell', ax, 37, 6, 4.5)])
            veins([[(ax - side * 2, 21), (ax, 25), (ax - side, 29)]])
            if view == 'front': s.dots([(ax - 3, 39), (ax, 40), (ax + 3, 39)], L3)
        s.g('body')
    else:
        s.g('armB'); blob(s, 'basalt', [('ell', 26, 37, 5, 3.8)])
        s.g('legB'); blob(s, 'basalt', [('rect', 13, 34, 18, 40), ('ell', 16, 41, 4, 2.2)])
        s.g('legF'); blob(s, 'basalt', [('rect', 19, 34, 24, 40), ('ell', 23, 41, 4.5, 2.2)])
        s.g('body')
        for pts in ([(10, 22), (5, 15), (13, 19)], [(13, 18), (11, 10), (17, 16)], [(19, 16), (20, 8), (23, 16)]):
            s.poly('basalt', pts)
        s.dots([(5, 16), (11, 11), (20, 9)], ('lava', 3))
        s.ell('basalt', 20, 27, 12, 10)
        blob(s, 'lava', [('ell', 27, 30, 3.5, 4)])
        veins([[(10, 26), (14, 28), (18, 27), (23, 30)], [(15, 20), (17, 23), (21, 23), (24, 27)]])
        s.poly('horn', [(30, 21), (27, 15), (26, 11), (29, 14), (33, 20)]); s.dot(26, 11, ('horn', 4))
        s.ell('black', 31, 24, 5, 4.2)
        s.dots([(33, 23), (34, 23)], L4); s.dot(32, 22, ('basalt', 0)); s.dots([(33, 26), (34, 26), (35, 26)], L3)
        s.dots([(10, 20), (11, 19), (12, 21)], ('basalt', 4))
        s.g('armF'); blob(s, 'basalt', [('ell', 23, 28, 5, 6.5), ('ell', 29, 37, 6, 4.5)])
        veins([[(22, 24), (24, 28), (27, 33)]]); s.dots([(31, 39), (33, 37)], L3)
        s.g('body')
    if heat:
        # crust breaking: extra hot spots
        for x, y in ((15, 26), (31, 25), (19, 33), (27, 23), (23, 35), (12, 30), (34, 31))[:heat * 3]:
            s.dots([(x, y), (x + 1, y)], L4)
    if f[0] == 'm':
        return s, walk_heavy(view, int(f[1])), glow('#e05a10', steps=((1, 60),))
    post = [glow('#ff7a10', steps=((1, 130), (2, 60))),
            chain(flash('#ffa030', 0.22), glow('#ffa030', steps=((1, 170), (2, 90), (3, 40)))),
            chain(flash('#fff0a0', 0.42), glow('#fff0a0', steps=((1, 210), (2, 130), (3, 60), (4, 25))))][heat - 1]
    return s, {'body': (0, (0, -1, -1)[heat - 1])}, post

enemy('brute', 'Lava Brute', 'volcanic', (46, 48), ['front', 'side', 'back'], brute,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 260, 'attack': [500, 500, 500]}, oy=2,
      note='A hunched basalt hulk with knuckle-dragging fists, back spikes and a molten core showing through lava veins. Death: the cracks flare, it glows orange, then white-hot before it bursts.',
      behavior='Very high HP, slow. Explodes in a big fire burst 1.5 seconds after it dies.')

def burst():
    out = []
    E = R['ember']
    for k in range(3):
        a = canvas(72, 64); cx, cy = 36, 34
        if k == 0:
            ring(a, cx, cy, 30, 2, R['red'][3], 220, 0.8)
            for i in range(12):
                ang = i * math.pi / 6
                put(a, cx + math.cos(ang) * 27, cy + math.sin(ang) * 27 * 0.8, R['red'][4])
        else:
            r = (0, 20, 29)[k]
            disc(a, cx, cy, r, E[2], 230 if k == 1 else 150, 0.8)
            disc(a, cx, cy, r * 0.7, E[3], 240 if k == 1 else 140, 0.8)
            disc(a, cx, cy, r * 0.4, E[4], 255 if k == 1 else 120, 0.8)
            for i in range(10):
                ang = i * 0.63 + k
                rr = r + 3
                disc(a, cx + math.cos(ang) * rr, cy + math.sin(ang) * rr * 0.8, 2.2, E[3], 220)
                put(a, cx + math.cos(ang) * (rr + 4), cy + math.sin(ang) * (rr + 4) * 0.8, R['basalt'][3])
        out.append(outline(a) if k == 1 else a)
    return out

extra('brute', 'Death burst', 'Frame 1 is the red warning ring (shown for the 1.5 s delay), then the blast.', burst())
