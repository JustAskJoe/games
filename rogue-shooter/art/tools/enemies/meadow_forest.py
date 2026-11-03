"""Universal, Meadow and Forest enemies: Slime (six zone colors), Bat, Wisp, Beetle,
Shroomling, Archer Sprite and Wolf."""
import math
from ekit import (Sprite, R, hx, EYE, WHITE, BLUSH, blob, eye2, line_dots, new, enemy, extra,
                  glow, fade, flash, chain, canvas, put, disc, ring, sparkle, outline)

RED_EYE = hx('#ff3a30'); EMBER = hx('#ffd27a'); YEL = hx('#f6d040')

# ------------------------------------------------------------------ SLIME

SLIME_ZONES = ['meadow', 'forest', 'caverns', 'volcanic', 'shadow', 'void']

def slime(view, f, var='meadow'):
    m = 'sl_' + (var or 'meadow'); s = new('slime')
    rx, ry, lift = {'m0': (9, 7.5, 0), 'm1': (10.5, 6.2, 0), 'm2': (8, 8.6, 2), 'm3': (9.8, 6.9, 0)}[f]
    base = 19 - lift; cx = 13; cy = base - ry * 0.72; top = cy - ry
    blob(s, m, [('ell', cx, cy, rx, ry), ('cut', 0, base + 1, 26, 30)])
    # drips at the base
    s.dots([(round(cx - rx + 2), base), (round(cx + rx - 3), base)], (m, 1))
    ey = round(cy - 0.5)
    glowing = var in ('shadow', 'void')
    iris = R['neon'][3] if var == 'void' else hx('#ffd8ff') if glowing else EYE
    eye2(s, round(cx - 4), ey, iris=iris, glint=WHITE, h=3); eye2(s, round(cx + 2), ey, iris=iris, glint=WHITE, h=3)
    mc = (m, 0)
    s.dots([(round(cx - 2), ey + 3), (round(cx - 1), ey + 4), (round(cx), ey + 4), (round(cx + 1), ey + 3)], mc)
    if not glowing: s.dots([(round(cx - 6), ey + 3), (round(cx + 4), ey + 3)], BLUSH)
    # wet shine, top-left
    tx, ty = round(cx - rx + 3), round(top + 2)
    s.dots([(tx, ty + 1), (tx + 1, ty), (tx + 2, ty), (tx, ty + 2)], WHITE)
    s.dot(round(cx + rx - 3), round(cy + 1), (m, 4))
    # bubbles inside
    s.dots([(round(cx + 4), round(cy + 3)), (round(cx - 6), round(cy + 2))], (m, 3))
    if var == 'volcanic':
        s.dots([(round(cx + 1), round(top + 1)), (round(cx + 4), round(top + 2)), (round(cx - 2), round(top + 1))], EMBER)
    if var == 'void':
        line_dots(s, [(cx - 7, cy + 2), (cx - 5, cy + 1), (cx - 4, cy + 3)], ('neon', 2))
        line_dots(s, [(cx + 6, cy - 2), (cx + 5, cy), (cx + 7, cy + 2)], ('neon', 2))
    post = glow(R['neon'][2], steps=((1, 70),)) if var == 'void' else None
    return s, None, post

enemy('slime', 'Slime', 'universal', (26, 22), ['front'], slime,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 160},
      variants=SLIME_ZONES,
      note='A wobbly gel blob with big eyes. One shape in six zone colors: meadow green, forest moss, cavern blue, volcanic orange, shadow violet and void black with neon cracks.',
      behavior='Low HP, slow, hops toward you. Drops Slime Gel.')

# ------------------------------------------------------------------ BAT

def bat(view, f, var=None):
    s = new('bat')
    ang, dy = {'m0': (-58, 1), 'm1': (-15, 0), 'm2': (32, -1), 'm3': (-15, 0)}[f]
    cx, cy = 17, 12 + dy
    for side in (-1, 1):
        sh = (cx + side * 3, cy - 1)
        tips = []
        for da, L in ((-30, 13.5), (0, 12.5), (30, 9.5)):
            a = math.radians(ang + da)
            tips.append((sh[0] + side * math.cos(a) * L, sh[1] + math.sin(a) * L))
        pts = [sh, tips[0]]
        for t0, t1 in zip(tips, tips[1:]):
            mx, my = (t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2
            pts += [(mx + (sh[0] - mx) * 0.4, my + (sh[1] - my) * 0.4), t1]
        pts += [(cx + side * 2, cy + 4)]
        s.poly('batwing', pts)
        for t in tips: line_dots(s, [sh, t], ('bat', 1))
        s.dot(round(tips[0][0]), round(tips[0][1]), ('horn', 4))
    # ears, body
    s.poly('bat', [(cx - 5, cy - 2), (cx - 5, cy - 8), (cx - 1, cy - 3)])
    s.poly('bat', [(cx + 5, cy - 2), (cx + 5, cy - 8), (cx + 1, cy - 3)])
    s.ell('bat', cx, cy + 1, 4.6, 5)
    s.dots([(cx - 4, cy - 5), (cx + 4, cy - 5)], ('pink', 2))
    s.dots([(cx - 1, cy + 4), (cx, cy + 4), (cx + 1, cy + 4), (cx, cy + 5)], ('bat', 3))
    eye2(s, cx - 3, cy, iris=RED_EYE, glint=hx('#ffd0a0')); eye2(s, cx + 1, cy, iris=RED_EYE, glint=hx('#ffd0a0'))
    s.dots([(cx - 1, cy + 3), (cx + 1, cy + 3)], WHITE)
    s.dot(cx, cy + 2, ('bat', 0))
    s.dots([(cx - 2, cy + 6), (cx + 2, cy + 6)], ('horn', 3))
    return s

enemy('bat', 'Bat', 'universal', (34, 26), ['front'], bat,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 90},
      note='A round, fuzzy cave bat with big scalloped wings, red eyes and two little fangs. Four-frame flap.',
      behavior='Low HP, fast, flies straight at you. Drops Bat Wings.')

# ------------------------------------------------------------------ WISP

def wisp(view, f, var=None):
    s = new('wisp')
    k = int(f[1])
    sway = (-2, -1, 2, 1)[k]                  # tip leans
    lick = (0, 1, 2, 1)[k]                    # side tongues rise and fall
    cx, cy = 11, 20
    blob(s, 'wisp', [('ell', cx, cy, 6, 5.5),
                     ('poly', [(cx - 6, cy), (cx - 6, cy - 4), (cx - 3 + sway * 0.4, cy - 9), (cx - 1 + sway * 0.8, cy - 13),
                               (cx + sway * 1.2, cy - 17), (cx + 2 + sway * 0.6, cy - 12), (cx + 4 + sway * 0.3, cy - 8),
                               (cx + 6, cy - 4), (cx + 6, cy)]),
                     ('poly', [(cx - 5, cy - 3), (cx - 8, cy - 7 - lick), (cx - 3, cy - 7)]),
                     ('poly', [(cx + 5, cy - 4), (cx + 7, cy - 9 + lick), (cx + 3, cy - 8)])])
    blob(s, 'wispc', [('ell', cx, cy + 1, 3.6, 3.4), ('poly', [(cx - 3, cy), (cx + sway * 0.6, cy - 8), (cx + 3, cy)])])
    eye2(s, cx - 3, cy, iris=R['wisp'][0], glint=WHITE); eye2(s, cx + 2, cy, iris=R['wisp'][0], glint=WHITE)
    s.dot(cx, cy + 3, R['wisp'][1])
    emb = [[(cx - 3, cy + 8), (cx + 4, cy + 9)], [(cx - 4, cy + 9), (cx + 3, cy + 8)],
           [(cx - 2, cy + 9), (cx + 4, cy + 10)], [(cx - 4, cy + 10), (cx + 2, cy + 9)]][k]
    s.dots(emb, R['wispc'][2])
    return s, None, glow(R['wisp'][2], steps=((1, 140), (2, 70), (3, 30)))

enemy('wisp', 'Wisp', 'meadow', (22, 30), ['front'], wisp,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 110},
      note='A little teal flame spirit with a bright core, flickering tip and drifting embers. Glows in hard steps.',
      behavior='Very low HP, fast, weaves side to side. Drops Wisp Dust.')

# ------------------------------------------------------------------ BEETLE

def _beetle_legs_front(s, cx):
    legs = {'A': [[(10, 19), (6, 21), (5, 25)], [(cx + 8, 15), (cx + 12, 15), (cx + 13, 18)], [(10, 10), (6, 8), (5, 5)]],
            'B': [[(2 * cx - 10, 19), (2 * cx - 6, 21), (2 * cx - 5, 25)], [(cx - 8, 15), (cx - 12, 15), (cx - 13, 18)],
                  [(2 * cx - 10, 10), (2 * cx - 6, 8), (2 * cx - 5, 5)]]}
    for gname, ls in legs.items():
        s.g('leg' + gname)
        for pts in ls:
            s.line('dbeetle', pts, 2); s.dot(*pts[-1], ('bronze', 2))
    s.g('body')

def beetle(view, f, var=None):
    s = new('beetle'); cx = 16
    if view in ('front', 'back'):
        _beetle_legs_front(s, cx)
    if view == 'front':
        s.ell('beetle', cx, 12, 10, 8)
        line_dots(s, [(cx, 4), (cx, 13)], ('beetle', 0))
        s.dots([(9, 8), (8, 9), (8, 10), (10, 7)], ('beetle', 4)); s.dots([(cx + 3, 6), (cx + 4, 6), (cx + 5, 7)], ('beetle', 4))
        s.ell('dbeetle', cx, 18, 7, 4.5)
        blob(s, 'bronze', [('ell', cx, 16.5, 5.5, 2.6), ('poly', [(cx - 3, 16), (cx + 3, 16), (cx + 1, 9), (cx - 1, 9)]),
                           ('poly', [(cx - 1, 10), (cx - 4, 7), (cx - 3, 6), (cx, 9)]), ('poly', [(cx + 1, 10), (cx + 4, 7), (cx + 3, 6), (cx, 9)])])
        s.dots([(cx - 2, 15), (cx - 1, 13), (cx - 1, 11), (cx - 3, 7), (cx - 4, 16)], ('bronze', 4))
        s.dots([(cx - 3, 18), (cx + 3, 18)], ('dbeetle', 0))
        s.poly('dbeetle', [(cx - 5, 20), (cx - 2, 21), (cx - 3, 25), (cx - 6, 23)])
        s.poly('dbeetle', [(cx + 5, 20), (cx + 2, 21), (cx + 3, 25), (cx + 6, 23)])
        s.dots([(cx - 3, 25), (cx + 3, 25)], ('bronze', 3))
        s.dots([(cx - 5, 18), (cx + 5, 18)], hx('#f6e05a')); s.dots([(cx - 5, 17), (cx + 5, 17)], WHITE)
    elif view == 'back':
        s.ell('dbeetle', cx, 5, 5, 3)
        s.poly('bronze', [(cx - 1, 3), (cx + 1, 3), (cx + 1, 0), (cx, -1)])
        s.ell('beetle', cx, 13, 10, 8.5)
        line_dots(s, [(cx, 5), (cx, 21)], ('beetle', 0))
        s.dots([(9, 9), (8, 10), (8, 11), (10, 8), (9, 13)], ('beetle', 4)); s.dots([(cx + 3, 7), (cx + 4, 7), (cx + 5, 8)], ('beetle', 4))
        s.dots([(cx - 4, 18), (cx - 6, 16), (cx + 4, 18), (cx + 6, 16)], ('beetle', 1))
    else:
        # far legs, then shell, then near legs
        s.g('legB')
        for x in (10, 21): s.line('black', [(x, 18), (x + 2, 21), (x + 1, 24)], 1)
        s.g('legA')
        s.line('black', [(15, 18), (17, 21), (16, 24)], 1)
        s.g('body')
        s.ell('dbeetle', 24, 17, 4, 3.5)
        blob(s, 'beetle', [('ell', 13, 15, 10.5, 7.5), ('cut', 0, 19, 40, 40)])
        s.rect('dbeetle', 6, 18, 21, 19)
        s.poly('bronze', [(21, 15), (26, 13), (28, 9), (28, 5), (30, 6), (30, 10), (28, 15), (24, 18)])
        s.dots([(27, 7), (28, 6), (26, 12)], ('bronze', 4)); s.dot(26, 9, ('bronze', 1))
        s.poly('dbeetle', [(26, 18), (30, 18), (29, 20), (26, 20)])
        s.dot(25, 16, hx('#f6e05a'))
        line_dots(s, [(5, 17), (22, 17)], ('beetle', 1))
        s.dots([(7, 11), (8, 10), (10, 9), (11, 9), (13, 8)], ('beetle', 4))
        s.g('legA')
        for x in (7, 20): s.line('dbeetle', [(x, 19), (x - 2, 22), (x - 1, 25)], 1); s.dot(x - 2, 25, ('bronze', 2))
        s.g('legB')
        s.line('dbeetle', [(13, 19), (12, 22), (13, 25)], 1); s.dot(14, 25, ('bronze', 2))
        s.g('body')
    pose = {'front': [{'legA': (0, -1)}, {}, {'legB': (0, -1)}, {}],
            'back': [{'legA': (0, -1)}, {}, {'legB': (0, -1)}, {}],
            'side': [{'legA': (1, 0), 'legB': (-1, 0)}, {}, {'legA': (-1, 0), 'legB': (1, 0)}, {}]}[view][int(f[1])]
    return s, pose

enemy('beetle', 'Beetle', 'meadow', (32, 30), ['front', 'side', 'back'], beetle,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 140}, oy=2,
      note='A rhinoceros beetle with a teal shell and a bronze horn and head plate, so its armored front reads from any angle. Six legs on a tripod walk.',
      behavior='Medium HP, slow. Takes half damage from the front. Drops Bone Fragments.')

# ------------------------------------------------------------------ SHROOMLING

def _spots(s, pts):
    for x, y, big in pts:
        cells = [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)] if big else [(x, y), (x + 1, y)]
        s.dots(cells, ('cream', 4))
        if big: s.dots([(x + 1, y + 1)], ('cream', 2))

def shroomling(view, f, var=None):
    s = new('shroomling'); cx = 13
    s.g('feet')
    if view == 'side':
        s.ell('gill', 11, 27, 2.6, 1.8); s.ell('gill', 16, 27, 2.6, 1.8)
    else:
        s.ell('gill', 10, 27, 2.6, 1.8); s.ell('gill', 16, 27, 2.6, 1.8)
    s.g('body')
    s.ell('cream', cx, 21, 5.5, 6)
    if view == 'front':
        s.g('arms'); s.ell('cream', 7, 21, 1.5, 2); s.ell('cream', 19, 21, 1.5, 2); s.g('body')
    elif view == 'side':
        s.g('arms'); s.ell('cream', 12, 22, 1.5, 2); s.g('body')
    else:
        s.g('arms'); s.ell('cream', 7, 21, 1.5, 2); s.ell('cream', 19, 21, 1.5, 2); s.g('body')
    s.rect('gill', 4, 14, 22, 16)
    s.dots([(x, 16) for x in range(5, 22, 2)], ('gill', 1))
    cxc = cx + (1 if view == 'side' else 0)
    blob(s, 'mush', [('ell', cxc, 11, 11.5, 8), ('cut', 0, 15, 30, 40)])
    if view == 'front':
        eye2(s, 10, 19); eye2(s, 15, 19)
        s.dots([(12, 22), (13, 22), (14, 22)], ('cream', 0)); s.dots([(9, 22), (17, 22)], BLUSH)
        _spots(s, [(7, 6, 1), (12, 4, 1), (17, 7, 1), (4, 10, 0), (20, 11, 0), (10, 10, 0), (15, 11, 0)])
    elif view == 'side':
        eye2(s, 16, 19); s.dots([(17, 22), (18, 22)], ('cream', 0)); s.dot(14, 22, BLUSH)
        _spots(s, [(9, 5, 1), (15, 5, 1), (20, 9, 1), (5, 10, 0), (12, 10, 0), (18, 13, 0)])
    else:
        _spots(s, [(8, 6, 1), (14, 4, 1), (18, 8, 1), (5, 11, 0), (12, 11, 0), (19, 12, 0)])
        s.dots([(12, 24), (13, 25), (14, 24)], ('cream', 2))
    s.dots([(5, 9), (6, 7), (8, 5), (7, 6)], ('mush', 4))
    pose = [{}, {'body': (0, 1), 'arms': (0, 2), 'feet': (0, 0)}, {'body': (0, -3), 'arms': (0, -4), 'feet': (0, -2)},
            {'body': (0, -1), 'arms': (0, 0), 'feet': (0, 0)}][int(f[1])]
    return s, pose

enemy('shroomling', 'Shroomling', 'forest', (26, 32), ['front', 'side', 'back'], shroomling,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 140}, oy=2,
      note='A walking toadstool: red spotted cap, cream stem with a sleepy face, stubby feet. Hops along.',
      behavior='Medium HP. Bursts into a poison spore cloud when it dies (slows and damages). Drops Spore Dust.')

def spore_cloud():
    frames = []
    pal = [hx('#5a2a6a'), hx('#8a4a9a'), hx('#b07ac0'), hx('#7ab05a'), hx('#c8e890')]
    for k, r in enumerate((7, 12, 15)):
        a = canvas(40, 36); cx, cy = 20, 19
        puffs = [(0, 0, 1.0), (-0.6, -0.3, 0.7), (0.6, -0.35, 0.7), (-0.4, 0.45, 0.6), (0.5, 0.4, 0.65), (0, -0.6, 0.55)]
        al = (235, 210, 150)[k]
        for dx, dy, sc in puffs:
            disc(a, cx + dx * r, cy + dy * r * 0.8, r * sc * 0.55, pal[1], al, 0.85)
        for dx, dy, sc in puffs:
            disc(a, cx + dx * r - 1, cy + dy * r * 0.8 - 1, r * sc * 0.38, pal[2], al, 0.85)
        for i in range(8 + k * 4):
            ang = i * 2.4; rr = r * (0.3 + 0.12 * (i % 5))
            put(a, cx + math.cos(ang) * rr, cy + math.sin(ang) * rr * 0.8, pal[4] if i % 3 else pal[3])
        frames.append(outline(a) if k < 2 else a)
    return frames

extra('shroomling', 'Spore cloud', 'Plays where it dies; the cloud lingers on the last frame.', spore_cloud())

# ------------------------------------------------------------------ ARCHER SPRITE

def _bow_v(s, x, y0, y1, bulge, draw=0):
    """Vertical bow facing right, string pulled back `draw` px."""
    mid = (y0 + y1) / 2
    s.line('wood', [(x, y0), (x + bulge * 0.7, y0 + 3), (x + bulge, mid), (x + bulge * 0.7, y1 - 3), (x, y1)], 1)
    sx = x - draw
    line_dots(s, [(x, y0), (sx, mid), (x, y1)], ('cream', 3))
    s.dots([(x, y0), (x, y1)], ('leaf', 3))

def _bow_h(s, y, x0, x1, bulge, draw=0, up=False):
    """Horizontal bow aimed down (or up), string pulled toward the archer."""
    sg = -1 if up else 1
    mid = (x0 + x1) / 2
    s.line('wood', [(x0, y), (x0 + 3, y + sg * bulge * 0.7), (mid, y + sg * bulge), (x1 - 3, y + sg * bulge * 0.7), (x1, y)], 1)
    line_dots(s, [(x0, y), (mid, y - sg * draw), (x1, y)], ('cream', 3))
    s.dots([(x0, y), (x1, y)], ('leaf', 3))

def archer(view, f, var=None):
    s = new('archer'); cx = 14
    atk = int(f[1]) if f[0] == 'a' else None
    if view == 'front':
        s.g('wings')
        s.poly('wingc', [(cx - 1, 17), (cx - 9, 9), (cx - 11, 13), (cx - 6, 20)]); s.poly('wingc', [(cx + 1, 17), (cx + 9, 9), (cx + 11, 13), (cx + 6, 20)])
        s.dots([(cx - 7, 13), (cx - 5, 15), (cx + 7, 13), (cx + 5, 15)], ('wingc', 1))
        s.g('legL'); s.rect('dleather', cx - 3, 28, cx - 2, 31); s.dots([(cx - 4, 31), (cx - 3, 31)], ('leather', 2))
        s.g('legR'); s.rect('dleather', cx + 1, 28, cx + 2, 31); s.dots([(cx + 2, 31), (cx + 3, 31)], ('leather', 2))
        s.g('body')
        s.poly('leaf', [(cx - 4, 20), (cx + 4, 20), (cx + 6, 28), (cx + 4, 30), (cx + 2, 28), (cx, 30), (cx - 2, 28), (cx - 4, 30), (cx - 6, 28)])
        s.rect('leather', cx - 4, 24, cx + 4, 24); s.dot(cx, 24, ('gold', 3))
        s.dots([(cx - 5, 17), (cx - 4, 16)], ('feather', 3))
        s.ell('leaf', cx, 12, 6.5, 6); s.poly('leaf', [(cx - 5, 9), (cx + 1, -1), (cx + 5, 9)])
        s.ell('sprite', cx, 14, 4.5, 3.6)
        s.dots([(cx - 5, 17), (cx + 5, 17), (cx - 6, 15), (cx + 6, 15)], ('leaf', 4))
        eye2(s, cx - 3, 13); eye2(s, cx + 2, 13)
        s.dots([(cx - 4, 16), (cx + 4, 16)], BLUSH); s.dot(cx, 16, ('sprite', 0))
        s.dots([(cx + 1, 0), (cx + 2, 0), (cx + 3, -1)], ('leaf', 3))
        if atk is None:
            s.g('armL'); s.rect('sprite', cx - 6, 21, cx - 5, 25); s.g('armR'); s.rect('sprite', cx + 5, 21, cx + 6, 25)
            s.g('wpn'); _bow_v(s, cx + 7, 15, 31, 3); s.g('body')
        else:
            s.rect('sprite', cx - 6, 21, cx - 5, 23); s.rect('sprite', cx + 5, 21, cx + 6, 23)
            _bow_h(s, 25, cx - 7, cx + 7, 3, draw=(1, 4, 0)[atk])
            if atk == 1: s.dots([(cx, 26), (cx, 27)], ('steel', 3)); s.dot(cx, 28, ('steel', 4))
            if atk == 2: s.dots([(cx, 30), (cx - 1, 31), (cx + 1, 31)], ('leaf', 4))
    elif view == 'back':
        s.g('legL'); s.rect('dleather', cx - 3, 28, cx - 2, 31); s.g('legR'); s.rect('dleather', cx + 1, 28, cx + 2, 31)
        s.g('body')
        s.poly('leaf', [(cx - 4, 20), (cx + 4, 20), (cx + 6, 28), (cx + 4, 30), (cx + 2, 28), (cx, 30), (cx - 2, 28), (cx - 4, 30), (cx - 6, 28)])
        s.rect('leather', cx - 4, 24, cx + 4, 24)
        s.ell('leaf', cx, 12, 6.5, 6); s.poly('leaf', [(cx - 5, 9), (cx - 1, -1), (cx + 5, 9)])
        s.line('leather', [(cx - 3, 17), (cx + 3, 25)], 2); s.dots([(cx - 4, 16), (cx - 3, 15), (cx - 2, 16)], ('feather', 3))
        s.g('wings')
        s.poly('wingc', [(cx - 1, 18), (cx - 10, 9), (cx - 12, 14), (cx - 6, 22)]); s.poly('wingc', [(cx + 1, 18), (cx + 10, 9), (cx + 12, 14), (cx + 6, 22)])
        s.dots([(cx - 8, 13), (cx - 6, 16), (cx + 8, 13), (cx + 6, 16)], ('wingc', 1))
        s.g('body')
        if atk is None:
            s.g('armL'); s.rect('sprite', cx - 6, 21, cx - 5, 25); s.g('armR'); s.rect('sprite', cx + 5, 21, cx + 6, 25)
            s.g('wpn'); _bow_v(s, cx - 8, 15, 31, -3); s.g('body')
        else:
            s.rect('sprite', cx - 6, 18, cx - 5, 21); s.rect('sprite', cx + 5, 18, cx + 6, 21)
            _bow_h(s, 4, cx - 7, cx + 7, 3, draw=(1, 4, 0)[atk], up=True)
            if atk == 1: s.dots([(cx, 3), (cx, 2)], ('steel', 3)); s.dot(cx, 1, ('steel', 4))
            if atk == 2: s.dots([(cx, -1), (cx - 1, -2), (cx + 1, -2)], ('leaf', 4))
    else:
        s.g('wings')
        s.poly('wingc', [(cx - 2, 17), (cx - 10, 10), (cx - 12, 15), (cx - 6, 21)])
        s.dots([(cx - 8, 14), (cx - 6, 17)], ('wingc', 1))
        s.g('legB'); s.rect('dleather', cx - 2, 28, cx - 1, 31); s.dots([(cx - 1, 31), (cx, 31)], ('leather', 1))
        s.g('legF'); s.rect('dleather', cx + 1, 28, cx + 2, 31); s.dots([(cx + 2, 31), (cx + 3, 31)], ('leather', 2))
        s.g('body')
        s.rect('leather', cx - 5, 17, cx - 4, 25); s.dots([(cx - 6, 16), (cx - 5, 15), (cx - 4, 16)], ('feather', 3))
        s.poly('leaf', [(cx - 4, 20), (cx + 3, 20), (cx + 5, 28), (cx + 3, 30), (cx + 1, 28), (cx - 1, 30), (cx - 3, 28), (cx - 5, 30), (cx - 6, 28)])
        s.rect('leather', cx - 4, 24, cx + 3, 24)
        s.ell('leaf', cx - 1, 12, 6, 6); s.poly('leaf', [(cx - 7, 11), (cx - 9, 1), (cx - 1, 7)])
        s.ell('sprite', cx + 2, 14, 3.5, 3.6)
        eye2(s, cx + 3, 13); s.dot(cx + 2, 16, BLUSH); s.dot(cx + 5, 16, ('sprite', 0))
        s.dots([(cx - 9, 1), (cx - 9, 2)], ('leaf', 3))
        if atk is None:
            s.g('armF'); s.rect('sprite', cx + 1, 21, cx + 2, 25); s.g('wpn'); _bow_v(s, cx + 5, 15, 31, 3); s.g('body')
        else:
            draw = (2, 6, 0)[atk]
            s.rect('sprite', cx + 6, 21, cx + 9, 22)
            _bow_v(s, cx + 9, 13, 30, 3, draw=draw)
            s.rect('sprite', cx + 9 - draw - 1, 21, cx + 9 - draw, 22) if draw else None
            if atk in (0, 1):
                L = cx + 13
                s.line('wood', [(cx + 9 - draw, 21), (L, 21)], 1); s.dot(L, 21, ('steel', 4)); s.dot(L - 1, 21, ('steel', 3))
                s.dots([(cx + 9 - draw, 20), (cx + 9 - draw, 22)], ('feather', 3))
            if atk == 2: s.dots([(cx + 12, 21), (cx + 13, 20), (cx + 13, 22)], ('leaf', 4))
    walk = {'front': [{'legL': (0, -1), 'wings': (0, -1)}, {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)},
                      {'legR': (0, -1), 'wings': (0, 1)}, {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}],
            'side': [{'legF': (1, 0), 'legB': (-1, -1), 'wings': (0, -1)}, {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0)},
                     {'legF': (-1, -1), 'legB': (1, 0), 'wings': (0, 1)}, {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0)}]}
    walk['back'] = walk['front']
    pose = walk[view][int(f[1])] if f[0] == 'm' else {'wings': (0, (-1, 0, 1)[atk])}
    return s, pose

enemy('archer', 'Archer Sprite', 'forest', (28, 36), ['front', 'side', 'back'], archer,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 150, 'attack': [260, 220, 200]}, oy=4,
      note='A tiny forest sprite in a pointed leaf hood, with glassy wings, a leaf tunic and a quiver. Attack: raises the bow, full draw, release.',
      behavior='Low HP, slow, keeps its distance and fires an arrow every 2 seconds.')

def arrow():
    a = canvas(16, 7)
    for x in range(2, 13): put(a, x, 3, R['wood'][3] if x % 2 else R['wood'][2])
    for x, y in ((13, 3), (14, 3), (13, 2), (13, 4), (12, 2), (12, 4)): put(a, x, y, R['steel'][3])
    put(a, 15, 3, R['steel'][4])
    for x, y in ((1, 2), (2, 1), (1, 4), (2, 5), (3, 2), (3, 4), (0, 3)): put(a, x, y, R['leaf'][3])
    return outline(a)

def arrow_frames():
    base = arrow(); out = []
    for k in range(2):
        a = base.copy()
        if k: put(a, 0, 1, R['leaf'][4], 160); put(a, 0, 5, R['leaf'][4], 160)
        out.append(a)
    return out

extra('archer', 'Arrow', 'Flies in a straight line; points right, rotate to aim.', arrow_frames())

# ------------------------------------------------------------------ WOLF

def wolf(view, f, var=None):
    s = new('wolf')
    atk = int(f[1]) if f[0] == 'a' else None
    eye = RED_EYE if atk is not None else YEL
    if view == 'side':
        s.g('legF'); s.rect('black', 10, 20, 11, 27); s.ell('black', 11, 28, 1.5, 0.8)
        s.g('legB'); s.rect('black', 25, 20, 26, 27); s.ell('black', 26, 28, 1.5, 0.8)
        s.g('body')
        s.poly('fur', [(9, 15), (5, 12), (2, 7), (1, 10), (3, 15), (6, 18), (9, 18)])
        s.dots([(2, 8), (2, 9), (3, 11)], ('furl', 3))
        blob(s, 'fur', [('ell', 17, 16, 10, 5.5), ('ell', 24, 16, 5.5, 6.5)])
        blob(s, 'furl', [('ell', 21, 20, 6, 1.6)])
        s.g('legF'); s.rect('fur', 23, 20, 25, 27); s.ell('fur', 25, 28, 2, 1)
        s.g('legB'); s.poly('fur', [(10, 17), (15, 17), (14, 23), (13, 27), (11, 27), (11, 22)]); s.ell('fur', 12, 28, 2, 1)
        s.g('head')
        s.poly('fur', [(26, 9), (27, 3), (30, 7)])
        blob(s, 'fur', [('ell', 29, 11, 4.5, 4.5), ('poly', [(30, 9), (36, 12), (36, 14), (31, 16)])])
        blob(s, 'furl', [('poly', [(30, 14), (36, 14), (32, 16)])])
        s.dot(28, 6, ('pink', 2)); s.dots([(35, 12), (36, 12)], EYE)
        s.dot(31, 10, eye); s.dot(32, 10, EYE); s.dots([(30, 9), (31, 9)], ('fur', 0))
        if atk is not None: s.dots([(33, 15), (35, 15)], WHITE); s.dots([(32, 9), (33, 9)], ('fur', 0))
        s.g('body')
        s.dots([(x, 11) for x in range(11, 24, 2)], ('fur', 1)); s.dots([(25, 12), (25, 14), (26, 16), (24, 18)], ('furl', 3))
        s.dots([(8, 13), (12, 12), (16, 11), (20, 11)], ('fur', 4))
    elif view == 'front':
        s.g('legR'); s.rect('black', 13, 24, 14, 29)
        s.g('legL'); s.rect('black', 24, 24, 25, 29)
        s.g('body')
        s.ell('fur', 19, 22, 6.5, 6)
        blob(s, 'furl', [('poly', [(15, 17), (23, 17), (21, 25), (19, 27), (17, 25)])])
        s.g('legL'); s.rect('fur', 15, 24, 16, 30); s.ell('fur', 15.5, 31, 1.8, 1); s.dot(15, 31, ('fur', 0))
        s.g('legR'); s.rect('fur', 22, 24, 23, 30); s.ell('fur', 22.5, 31, 1.8, 1); s.dot(23, 31, ('fur', 0))
        s.g('head')
        s.poly('fur', [(14, 7), (12, 1), (17, 5)]); s.poly('fur', [(24, 7), (26, 1), (21, 5)])
        blob(s, 'fur', [('ell', 19, 9.5, 6, 4.5), ('poly', [(14, 9), (11, 14), (16, 13)]), ('poly', [(24, 9), (27, 14), (22, 13)])])
        blob(s, 'furl', [('poly', [(16, 11), (22, 11), (21.5, 16), (20, 18), (18, 18), (16.5, 16)])])
        s.dots([(13, 3), (14, 4), (25, 3), (24, 4)], ('pink', 2)); s.dots([(12, 13), (13, 12), (25, 12), (26, 13)], ('furl', 3))
        s.dots([(18, 15), (19, 15), (20, 15), (19, 16)], EYE); s.dot(18, 15, ('furl', 4))
        s.dots([(16, 9), (22, 9)], eye); s.dots([(17, 9), (21, 9)], EYE); s.dots([(15, 8), (16, 8), (22, 8), (23, 8)], ('fur', 0))
        line_dots(s, [(19, 5), (19, 11)], ('fur', 1)); s.dots([(15, 6), (14, 7)], ('fur', 4)); s.dots([(18, 12), (18, 13)], ('furl', 4))
        if atk is not None: s.dots([(18, 18), (20, 18), (19, 18)], WHITE); s.dots([(17, 17), (21, 17)], ('red', 1))
        else: s.dots([(18, 18), (20, 18)], ('fur', 0))
        s.g('body')
    else:
        s.g('legR'); s.rect('fur', 13, 24, 15, 30); s.ell('fur', 14, 31, 2, 1); s.dot(13, 31, ('fur', 0))
        s.g('legL'); s.rect('fur', 23, 24, 25, 30); s.ell('fur', 24, 31, 2, 1); s.dot(25, 31, ('fur', 0))
        s.g('body')
        s.ell('fur', 19, 19, 6.5, 8.5)
        s.g('head')
        s.poly('fur', [(15, 7), (13, 1), (18, 4)]); s.poly('fur', [(23, 7), (25, 1), (20, 4)])
        s.ell('fur', 19, 8, 5, 4)
        s.dots([(14, 5), (24, 5)], ('fur', 1))
        s.g('body')
        line_dots(s, [(19, 12), (19, 24)], ('fur', 1)); s.dots([(18, 13), (18, 15), (18, 17)], ('fur', 1))
        s.dots([(14, 14), (14, 16), (15, 13)], ('fur', 4))
        s.g('tail'); s.poly('fur', [(17, 24), (21, 24), (23, 28), (19, 32), (15, 28)]); s.dots([(18, 30), (19, 31), (20, 30), (19, 30)], ('furl', 3))
        s.dots([(16, 26), (22, 26)], ('fur', 0)); s.dots([(18, 25), (17, 27)], ('fur', 4))
        s.g('body')
    if f[0] == 'm':
        pose = {'side': [{'legF': (2, 0), 'legB': (-2, 0), 'head': (0, 0)}, {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0)},
                         {'legF': (-2, 0), 'legB': (2, 0), 'head': (0, 1)}, {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0)}],
                'front': [{'legL': (0, -1)}, {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'legR': (0, -1)}, {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}],
                'back': [{'legL': (0, -1), 'tail': (-1, 0)}, {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'legR': (0, -1), 'tail': (1, 0)}, {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}]}[view][int(f[1])]
        return s, pose
    crouch = {'side': {'body': (0, 1), 'head': (1, 2), 'legF': (0, 0), 'legB': (0, 0)},
              'front': {'body': (0, 1), 'head': (0, 2), 'legL': (0, 0), 'legR': (0, 0)},
              'back': {'body': (0, 1), 'head': (0, 1), 'legL': (0, 0), 'legR': (0, 0), 'tail': (0, 0)}}[view]
    lunge = {'side': {'body': (2, -2), 'head': (3, -2), 'legF': (5, -1), 'legB': (-3, -1)},
             'front': {'body': (0, -2), 'head': (0, 0), 'legL': (0, -2), 'legR': (0, -2)},
             'back': {'body': (0, -2), 'head': (0, -3), 'legL': (0, -1), 'legR': (0, -1), 'tail': (0, 1)}}[view]
    if atk == 0: return s, crouch
    if atk == 1: return s, crouch, flash('#ff5040', 0.45)
    return s, lunge

enemy('wolf', 'Wolf', 'forest', (38, 34), ['front', 'side', 'back'], wolf,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 100, 'attack': [300, 200, 260]}, oy=2,
      note='A grey timber wolf with a pale ruff and bushy tail. Charge: crouches and growls with red eyes and bared teeth, flashes red, then lunges.',
      behavior='Medium HP, fast. Charges in a straight line after the growl and flash; stuns on hit.')

def charge_marker():
    """Red chevrons on the ground along the charge line (telegraph)."""
    frames = []
    for k in range(3):
        a = canvas(40, 12)
        for i in range(3):
            x0 = 6 + i * 11 + k * 2
            al = 255 if i <= k else 90
            for t in range(5):
                for w in range(2):
                    put(a, x0 + 4 - t + w, 6 - t, R['red'][3], al); put(a, x0 + 4 - t + w, 6 + t, R['red'][3], al)
            put(a, x0 + 5, 6, R['red'][4], al)
        frames.append(outline(a))
    return frames

extra('wolf', 'Charge line', 'Red chevrons drawn along the charge path while the wolf growls; points right, rotate to aim.', charge_marker())
