"""Shadow and Void enemies (Wraith, Nightmare, Shade Assassin, Void Spawn in three sizes,
Reality Tear, Void Anchor) plus the Skeleton and Demon, which still drop Bone and Demon Essence."""
import math
from ekit import (R, ramp, hx, EYE, WHITE, blob, eye2, line_dots, new, enemy, extra,
                  glow, fade, flash, speckle, chain, canvas, put, disc, ring, sparkle, outline)
from heroes import boots_front, boots_side, sword, dagger, WALK, ATTACK

R['wraith'] = ramp('#141a2a', '#26304a', '#3e4c6e', '#62749a', '#94a6c8')
CYAN = hx('#9ffcff'); RED_EYE = hx('#ff3a30'); MAG = hx('#ff5ae0')

# ------------------------------------------------------------------ WRAITH

def wraith(view, f, var=None):
    s = new('wraith'); cx = 15
    k = int(f[1])
    wave = (0, 1, 0, -1)[k] if f[0] == 'm' else 0
    # tattered robe: body tapering into strips that sway
    tips = [(cx - 8 + wave, 35), (cx - 4 - wave, 37), (cx + wave, 34), (cx + 4 + wave, 37), (cx + 8 - wave, 34)]
    pts = [(cx - 7, 14), (cx - 9, 24), tips[0], (cx - 6, 31), tips[1], (cx - 2, 31), tips[2], (cx + 2, 31), tips[3], (cx + 6, 31), tips[4], (cx + 9, 24), (cx + 7, 14)]
    s.poly('wraith', pts)
    line_dots(s, [(cx - 3, 20), (cx - 4, 30)], ('wraith', 1)); line_dots(s, [(cx + 3, 21), (cx + 3, 30)], ('wraith', 1))
    # hood
    blob(s, 'wraith', [('ell', cx, 11, 7, 7), ('poly', [(cx - 6, 8), (cx + 1, 1), (cx + 6, 8)])])
    s.ell('shadow', cx, 13, 4.2, 4, flat=True)
    eyes = [(cx - 3, 12), (cx - 2, 12), (cx + 2, 12), (cx + 3, 12)]
    s.dots(eyes, CYAN); s.dots([(cx - 3, 13), (cx + 2, 13)], R['wisp'][2])
    s.dots([(cx - 5, 7), (cx - 4, 6), (cx - 2, 4)], ('wraith', 4))
    # reaching claws
    for side in (-1, 1):
        s.g('arm' + ('L' if side < 0 else 'R'))
        s.poly('wraith', [(cx + side * 6, 15), (cx + side * 10, 20), (cx + side * 9, 23), (cx + side * 5, 19)])
        hx_ = cx + side * 10
        s.ell('ghost', hx_, 23, 1.6, 1.6)
        s.dots([(hx_ - 1, 25), (hx_, 26), (hx_ + 1, 25)], ('ghost', 4))
    s.g('body')
    # chain across the robe
    s.dots([(cx - 5, 26), (cx - 3, 27), (cx - 1, 27), (cx + 1, 27), (cx + 3, 26)], ('chain', 3))
    bob = (0, -1, -2, -1)[k] if f[0] == 'm' else -1
    pose = {'body': (0, bob), 'armL': (0, bob + (1 if k % 2 else 0)), 'armR': (0, bob - (1 if k % 2 else 0))}
    if f[0] == 'm':
        return s, pose, glow('#7ee0f0', steps=((1, 70), (2, 30)))
    post = [chain(speckle(0.35, 2), fade(0.6), glow('#7ee0f0', steps=((1, 40),))),
            chain(speckle(0.55, 4), fade(0.3)),
            chain(flash('#c8f8ff', 0.4), glow('#9ffcff', steps=((1, 150), (2, 70))))][k]
    return s, pose, post

enemy('wraith', 'Wraith', 'shadow', (30, 42), ['front'], wraith,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 160, 'attack': [260, 600, 220]}, oy=2,
      note='A floating hooded shroud in slate blue with a black void for a face, two cyan eyes, reaching pale claws and a chain. The tattered hem sways. Phase: fades out, goes nearly see-through, then snaps back in a cyan flash.',
      behavior='Medium HP. Phases in and out (can be hit 75% of the time). Its hits ignore armor.')

# ------------------------------------------------------------------ NIGHTMARE

def nightmare(view, f, var=None):
    s = new('nightmare'); cx = 23
    k = int(f[1])
    # smoky tendrils at the base
    for i, x0 in enumerate((10, 15, 20, 26, 31, 36)):
        sway = ((i + k) % 4) - 1.5
        s.line('shadow', [(x0, 32), (x0 + sway, 36), (x0 - sway, 40)], 2)
    blob(s, 'shadow', [('ell', cx, 25, 15, 11)])
    # horns
    s.poly('horn', [(cx - 9, 16), (cx - 15, 10), (cx - 16, 3), (cx - 13, 7), (cx - 6, 13)])
    s.poly('horn', [(cx + 9, 16), (cx + 15, 10), (cx + 16, 3), (cx + 13, 7), (cx + 6, 13)])
    s.dots([(cx - 16, 3), (cx + 16, 3), (cx - 15, 5), (cx + 15, 5)], ('horn', 4))
    blob(s, 'nightm', [('ell', cx, 18, 10, 7.5)])
    s.dots([(cx - 7, 13), (cx - 6, 12), (cx - 4, 11)], ('nightm', 4))
    # maw
    blob(s, 'black', [('poly', [(cx - 7, 25), (cx + 7, 25), (cx + 5, 30), (cx - 5, 30)])], flat=True)
    for x in range(cx - 6, cx + 7, 2):
        s.dot(x, 25, ('bone', 4)); s.dot(x + 1, 29, ('bone', 3))
    s.dots([(cx - 1, 27), (cx, 28), (cx + 1, 27)], ('demon', 3))
    # many eyes (some blink each frame)
    eyes = [(cx - 6, 17, 2), (cx + 4, 17, 2), (cx - 1, 14, 1), (cx - 10, 21, 1), (cx + 9, 21, 1), (cx - 3, 21, 1), (cx + 2, 21, 1)]
    closed = {0: [], 1: [2], 2: [5, 6], 3: [3]}[k]
    for i, (x, y, sz) in enumerate(eyes):
        if i in closed:
            s.dots([(x + d, y) for d in range(sz + 1)], ('nightm', 0)); continue
        cells = [(x + dx, y + dy) for dx in range(sz) for dy in range(sz)] if sz > 1 else [(x, y), (x + 1, y)]
        s.dots(cells, MAG); s.dot(x, y, WHITE)
        if sz > 1: s.dots([(x + 1, y + 1)], ('nightm', 0))
    s.dots([(cx - 12, 28), (cx - 11, 30), (cx + 12, 28)], ('nightm', 3))
    return s, {'body': (0, (0, -1, -1, 0)[k])}, glow('#5c2e86', steps=((1, 120), (2, 60), (3, 25)))

enemy('nightmare', 'Nightmare', 'shadow', (46, 44), ['front'], nightmare,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 220}, oy=2,
      note='A looming mass of shadow with great curled horns, a jagged maw and seven magenta eyes that blink out of step. Smoky tendrils drag below it.',
      behavior='High HP, slow. Its fear aura cuts your attack speed by 15% while you are inside it; several stack.')

def fear_aura():
    out = []
    for k in range(3):
        a = canvas(96, 72); cx, cy = 48, 40
        for r, al in ((44, 70), (40, 110)):
            for i in range(72):
                if (i // 3 + k) % 2: continue
                ang = i * 2 * math.pi / 72
                put(a, cx + math.cos(ang) * r, cy + math.sin(ang) * r * 0.7, R['nightm'][3], al)
        for i in range(10):
            ang = i * 0.63 + k * 0.4
            rr = 18 + ((i * 7 + k * 5) % 20)
            put(a, cx + math.cos(ang) * rr, cy + math.sin(ang) * rr * 0.7, MAG, 140)
        out.append(a)
    return out

extra('nightmare', 'Fear aura', 'Drawn on the ground under it; the dashed ring turns slowly.', fear_aura())

# ------------------------------------------------------------------ SHADE ASSASSIN

def shade(view, f, var=None):
    s = new('shade')
    atk = int(f[1]) if f[0] == 'a' else None
    if view == 'front':
        s.g('scarf'); s.poly('red', [(19, 17), (25, 19), (28, 24), (24, 22), (20, 21)])
        boots_front(s, 'black', 'black')
        s.poly('black', [(11, 19), (21, 19), (23, 31), (16, 31), (16, 29), (15, 29), (15, 31), (9, 31)])
        s.rect('dleather', 10, 25, 21, 26); s.dot(16, 25, ('steel', 3))
        line_dots(s, [(12, 20), (19, 25)], ('wpurple', 2))
        blob(s, 'black', [('ell', 16, 11, 6.5, 6.5), ('poly', [(10, 11), (16, 1), (22, 11)])])
        s.ell('shadow', 16, 12, 4.4, 3.4, flat=True)
        s.dots([(14, 12), (15, 12), (17, 12), (18, 12)], RED_EYE); s.dots([(14, 12), (17, 12)], hx('#ffb0a0'))
        blob(s, 'red', [('rect', 11, 15, 21, 18)])
        s.dots([(x, 16) for x in range(12, 21, 2)], ('red', 1)); s.dots([(11, 15), (12, 15)], ('red', 4))
        s.dots([(12, 6), (13, 4), (14, 3)], ('black', 4))
        if atk is None:
            s.g('armL'); s.rect('black', 7, 20, 9, 27); s.ell('dleather', 8, 28, 1.5, 1.5); dagger(s, 8, 29, 100, 7)
            s.g('armR'); s.rect('black', 23, 20, 25, 27); s.ell('dleather', 24, 28, 1.5, 1.5); dagger(s, 24, 29, 80, 7)
        elif atk == 0:
            s.g('armL'); s.rect('black', 7, 18, 9, 24); dagger(s, 7, 18, -110, 7)
            s.g('armR'); s.rect('black', 23, 18, 25, 24); dagger(s, 25, 18, -70, 7)
        elif atk == 1:
            s.g('armL'); s.rect('black', 9, 22, 11, 27); dagger(s, 11, 28, 50, 9)
            s.g('armR'); s.rect('black', 21, 22, 23, 27); dagger(s, 21, 28, 130, 9)
        else:
            s.g('armL'); s.rect('black', 7, 20, 9, 27); dagger(s, 8, 29, 100, 7)
            s.g('armR'); s.rect('black', 23, 20, 25, 27); dagger(s, 24, 29, 80, 7)
        s.g('body')
    elif view == 'back':
        boots_front(s, 'black', 'black')
        s.poly('black', [(11, 19), (21, 19), (23, 31), (16, 31), (16, 29), (15, 29), (15, 31), (9, 31)])
        s.rect('dleather', 10, 25, 21, 26)
        line_dots(s, [(12, 25), (20, 19)], ('wpurple', 2))
        blob(s, 'black', [('ell', 16, 11, 6.5, 6.5), ('poly', [(10, 11), (16, 1), (22, 11)])])
        s.dots([(12, 6), (13, 4), (14, 3), (11, 9)], ('black', 4)); line_dots(s, [(16, 4), (16, 15)], ('black', 0))
        blob(s, 'red', [('rect', 11, 15, 21, 18)])
        s.g('scarf'); s.poly('red', [(14, 18), (18, 18), (19, 27), (17, 25), (15, 28), (13, 25)]); s.g('body')
        s.g('armL'); s.rect('black', 7, 20, 9, 27); dagger(s, 8, 29, 100, 7)
        s.g('armR'); s.rect('black', 23, 20, 25, 27); dagger(s, 24, 29, 80, 7)
        if atk is not None:
            pass
        s.g('body')
    else:
        s.g('scarf'); s.poly('red', [(13, 16), (6, 17), (2, 21), (5, 21), (8, 20), (12, 19)]); s.g('body')
        s.g('armB'); s.rect('black', 12, 20, 14, 26)
        if atk is None: dagger(s, 13, 27, 100, 6)
        s.g('body')
        boots_side(s, 'black', 'black')
        s.poly('black', [(12, 19), (20, 19), (22, 31), (10, 31)])
        s.rect('dleather', 11, 25, 20, 26)
        blob(s, 'black', [('ell', 16, 11, 6, 6.5), ('poly', [(10, 11), (11, 1), (17, 6)])])
        s.ell('shadow', 19, 12, 3, 3.2, flat=True)
        s.dots([(19, 12), (20, 12)], RED_EYE); s.dot(19, 12, hx('#ffb0a0'))
        blob(s, 'red', [('rect', 13, 15, 22, 18)]); s.dots([(14, 16), (16, 16), (18, 16), (20, 16)], ('red', 1))
        s.dots([(11, 4), (11, 6), (12, 8)], ('black', 4))
        s.g('armF')
        if atk is None:
            s.rect('black', 15, 20, 17, 27); dagger(s, 16, 28, 80, 7)
        elif atk == 0:
            s.rect('black', 12, 20, 15, 22); dagger(s, 12, 21, 190, 7)
        elif atk == 1:
            s.rect('black', 17, 20, 23, 22); dagger(s, 24, 21, 0, 9)
        else:
            s.rect('black', 15, 20, 17, 27); dagger(s, 16, 28, 80, 7)
        s.g('body')
    if atk is None:
        pose = dict(WALK[view][int(f[1])])
        pose['scarf'] = (pose.get('body', (0, 0))[0] + (1 if int(f[1]) % 2 else 0), pose.get('body', (0, 0))[1])
        return s, pose
    pose = dict(ATTACK[view][atk]); pose['scarf'] = (0, -1) if atk == 1 else pose.get('body', (0, 0))
    return s, pose, (chain(speckle(0.4, 9), fade(0.7)) if atk == 2 else None)

enemy('shade', 'Shade Assassin', 'shadow', (32, 44), ['front', 'side', 'back'], shade,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 110, 'attack': [180, 120, 260]}, oy=4,
      note='A slim figure in a black peaked hood with red eyes, a long red scarf and two reverse-grip blades. Hero-sized. Strike: blades raised, a crossed stab, then it fades as it slips away.',
      behavior='Low HP, very fast. Appears behind you, strikes once for big damage, then retreats.')

def red_slash():
    out = []
    for k in range(3):
        a = canvas(40, 40)
        for sgn in (1, -1):
            for t in range(-14, 15):
                y = 20 + t; x = 20 + sgn * t * 0.9
                L = 1 - abs(t) / 15
                if k == 0 and t > 2: continue
                if k == 2 and abs(t) < 4: continue
                c = WHITE if L > 0.7 else R['red'][4] if L > 0.4 else R['red'][3]
                put(a, x, y, c, int(255 * (0.4 + 0.6 * L) * (0.6 if k == 2 else 1)))
                put(a, x + 1, y, R['red'][2], int(200 * L))
        out.append(a)
    return out

extra('shade', 'Strike', 'Crossed red slash on the hero when the strike lands.', red_slash())

# ------------------------------------------------------------------ VOID SPAWN (3 sizes)

def void_blob(key, scale):
    def fn(view, f, var=None):
        s = new(key)
        w, h = s.w, s.h
        k = int(f[1])
        pulse = (0, 0.6, 1.0, 0.4)[k]
        cx, cy = w / 2, h / 2 + 1
        rx, ry = 10 * scale + pulse * scale, 8.5 * scale - pulse * 0.5 * scale
        spikes = []
        for i in range(7):
            ang = -math.pi / 2 + (i - 3) * 0.45
            L = (4 + (i + k) % 2 * 1.5) * scale
            bx, by = cx + math.cos(ang) * rx * 0.85, cy + math.sin(ang) * ry * 0.85
            tx, ty = cx + math.cos(ang) * (rx + L), cy + math.sin(ang) * (ry + L)
            px_, py_ = -math.sin(ang) * 1.6 * scale, math.cos(ang) * 1.6 * scale
            spikes.append(('poly', [(bx + px_, by + py_), (tx, ty), (bx - px_, by - py_)]))
        blob(s, 'void', [('ell', cx, cy, rx, ry)] + spikes)
        # neon cracks
        if scale > 0.5:
            line_dots(s, [(cx - rx + 2, cy + 1), (cx - rx * 0.5, cy + 2), (cx - rx * 0.4, cy + ry * 0.6)], ('neon', 2 + (k % 2)))
            line_dots(s, [(cx + rx - 2, cy), (cx + rx * 0.55, cy + 3 * scale), (cx + rx * 0.3, cy + ry * 0.7)], ('neon', 2 + ((k + 1) % 2)))
        # one big eye
        er = max(1.5, 3.4 * scale)
        s.ell('cream', cx, cy - 1, er + 0.5, er, flat=True) if scale > 0.5 else None
        s.dots([(round(cx) + dx, round(cy - 1) + dy) for dx in (-1, 0) for dy in (-1, 0, 1)] if scale > 0.5 else [(round(cx), round(cy))], ('neon', 3))
        s.dots([(round(cx) - 1, round(cy - 1) + dy) for dy in (-1, 0, 1)] if scale > 0.5 else [], EYE)
        s.dot(round(cx), round(cy - 2), WHITE)
        s.dots([(round(cx - rx * 0.6), round(cy - ry * 0.55)), (round(cx - rx * 0.5), round(cy - ry * 0.65))], ('void', 4))
        return s, None, glow(R['neon'][2], steps=((1, 110), (2, 40)) if scale > 0.5 else ((1, 110),))
    return fn

for key, name, size, sc, note, beh in (
        ('voidspawn', 'Void Spawn', (36, 34), 1.0,
         'A pulsing black blob of void with spines, neon cracks and one staring eye.',
         'Medium HP. Splits into 2 Void Fragments when it dies.'),
        ('voidfrag', 'Void Fragment', (26, 24), 0.65,
         'A smaller, faster piece of a Void Spawn: same eye and cracks.',
         '25% of the Spawn\'s HP, fast. Splits into 2 Void Shards.'),
        ('voidshard', 'Void Shard', (16, 15), 0.38,
         'The smallest piece: a spiky dot with a single neon eye.',
         '5% of the Spawn\'s HP, very fast.')):
    enemy(key, name, 'void', size, ['front'], void_blob(key, sc), {'move': ['m0', 'm1', 'm2', 'm3']},
          timing={'move': 140 if sc > 0.9 else 100 if sc > 0.5 else 70}, note=note, behavior=beh)

# ------------------------------------------------------------------ REALITY TEAR

def tear(view, f, var=None):
    s = new('tear'); cx = 17
    k = int(f[1])
    open_ = (0, 0, 0, 0)[k] if f[0] == 'm' else (1, 2, 3)[k]
    top, bot = 4, 46
    pts_l, pts_r = [], []
    for i in range(11):
        y = top + (bot - top) * i / 10
        wdt = math.sin(math.pi * i / 10) * (6 + open_ * 1.3)
        jag = ((i * 3 + k) % 4 - 1.5) * 1.2
        pts_l.append((cx - wdt + jag, y)); pts_r.append((cx + wdt + jag * 0.6, y))
    outer = pts_l + pts_r[::-1]
    s.poly('neonp', [(x - 1.5 if x < cx else x + 1.5, y) for x, y in outer])
    s.poly('void', outer, flat=True)
    rnd = [(cx - 2, 12), (cx + 2, 17), (cx - 3, 22), (cx + 1, 26), (cx - 1, 31), (cx + 3, 33), (cx - 2, 38), (cx, 19), (cx + 2, 29)]
    for i, (x, y) in enumerate(rnd):
        if (i + k) % 3 == 0: continue
        s.dot(x, y, WHITE if i % 2 else R['neon'][3])
    for i, (x, y) in enumerate(outer[::2]):
        s.dot(x, y, R['neonp'][4] if (i + k) % 2 else R['neon'][3])
    # floating debris
    for i, (x, y) in enumerate(((5, 14), (29, 20), (6, 34), (28, 38))):
        dy = ((i + k) % 2)
        s.poly('void', [(x - 1, y + dy), (x + 1, y - 2 + dy), (x + 2, y + 1 + dy)])
        s.dot(x, y + dy, ('neon', 3))
    if f[0] == 'm':
        return s, None, glow(R['neonp'][3], steps=((1, 140), (2, 70), (3, 28)))
    return s, None, glow(R['neonp'][3], steps=((1, 180), (2, 110), (3, 60), (4, 25)))

enemy('tear', 'Reality Tear', 'void', (34, 52), ['front'], tear,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 150, 'attack': [220, 220, 300]},
      note='A jagged rip in the air with a neon pink-and-cyan edge and a starfield inside, with bits of debris floating around it. Spawn: the rift widens and flares before an enemy steps out.',
      behavior='Stationary, high HP. Spawns an enemy every 5 seconds until destroyed. Kill it first.')

# ------------------------------------------------------------------ VOID ANCHOR

def anchor(view, f, var=None):
    s = new('anchor'); cx = 20
    k = int(f[1])
    bob = (0, -1, -2, -1)[k]
    def ring_pts(cy, rx, ry, front):
        out = []
        for i in range(48):
            a = i * 2 * math.pi / 48 + k * math.pi / 8
            y = cy + math.sin(a) * ry
            if (math.sin(a) > 0) == front: out.append((cx + math.cos(a) * rx, y, i))
        return out
    def draw_ring(cy, rx, ry, front, col):
        for x, y, i in ring_pts(cy, rx, ry, front):
            s.dot(x, y, col if i % 6 else WHITE)
    s.g('back'); draw_ring(30, 17, 5, False, R['neon'][2]); draw_ring(20, 13, 4, False, R['neonp'][3]); s.g('body')
    s.poly('void', [(cx, 2), (cx + 6, 12), (cx + 5, 38), (cx, 48), (cx - 5, 38), (cx - 6, 12)])
    s.poly('void', [(cx - 2, 14), (cx + 2, 14), (cx + 2, 34), (cx - 2, 34)], flat=True)
    line_dots(s, [(cx, 6), (cx, 44)], ('void', 1))
    for y in (9, 16, 22, 28, 35, 41):
        s.dots([(cx - 1, y), (cx + 1, y), (cx, y - 1), (cx, y + 1)], ('neon', 3 if (y + k) % 2 else 2))
    s.dots([(cx - 4, 12), (cx - 4, 14), (cx - 3, 9), (cx - 2, 6)], ('void', 4))
    s.dot(cx, 25, WHITE)
    s.g('front'); draw_ring(30, 17, 5, True, R['neon'][3]); draw_ring(20, 13, 4, True, R['neonp'][4]); s.g('body')
    for i, (x, y) in enumerate(((5, 40), (35, 44), (8, 10), (33, 8))):
        dy = (k + i) % 3 - 1
        s.g('chunk%d' % i); s.poly('void', [(x - 2, y + 1), (x, y - 2), (x + 2, y + 1), (x, y + 2)]); s.dot(x, y, ('neon', 2)); s.g('body')
    pose = {'body': (0, bob), 'front': (0, bob), 'back': (0, bob)}
    return s, pose, glow(R['neon'][2], steps=((1, 120), (2, 50)))

enemy('anchor', 'Void Anchor', 'void', (40, 54), ['front'], anchor,
      {'move': ['m0', 'm1', 'm2', 'm3']}, timing={'move': 160}, oy=2,
      note='A floating obelisk of void-stone, carved with neon runes, with two glowing rings orbiting around it and broken chunks drifting nearby.',
      behavior='Stationary, high HP. Its gravity well pulls you and enemies in; enemies inside hit 30% harder and you move 25% slower.')

def gravity_well():
    out = []
    for k in range(3):
        a = canvas(112, 72); cx, cy = 56, 38
        for arm in range(4):
            for t in range(60):
                rr = 4 + t * 0.85
                ang = arm * math.pi / 2 + t * 0.09 + k * 0.35
                al = int(200 * (1 - t / 60))
                put(a, cx + math.cos(ang) * rr, cy + math.sin(ang) * rr * 0.6, R['neon'][2] if t % 9 else WHITE, al)
        for r, al in ((52, 90), (50, 50)):
            ring(a, cx, cy, r, 1, R['neon'][1], al, 0.6)
        disc(a, cx, cy, 4, R['void'][0], 220, 0.6)
        out.append(a)
    return out

extra('anchor', 'Gravity well', 'Drawn on the ground under the anchor; the spiral turns inward.', gravity_well())

# ------------------------------------------------------------------ SKELETON (material source)

def skeleton(view, f, var=None):
    s = new('skeleton')
    atk = int(f[1]) if f[0] == 'a' else None
    glow_eye = hx('#8affd0')
    if view in ('front', 'back'):
        s.g('legL'); s.rect('bone', 12, 29, 13, 36); s.poly('bone', [(11, 36), (14, 36), (14, 38), (10, 38)]); s.dot(12, 32, ('bone', 4))
        s.g('legR'); s.rect('bone', 18, 29, 19, 36); s.poly('bone', [(17, 36), (20, 36), (21, 38), (17, 38)]); s.dot(18, 32, ('bone', 4))
        s.g('body')
        s.poly('bone', [(11, 26), (20, 26), (19, 29), (12, 29)])
        s.poly('dleather', [(11, 27), (20, 27), (19, 32), (17, 30), (15, 33), (13, 30), (12, 32)])
        s.rect('bone', 15, 18, 16, 26)
        s.ell('bone', 15.5, 21, 5.5, 3.6)
        for y in (19, 21, 23): s.dots([(x, y) for x in range(11, 21) if x not in (15, 16)], ('bone', 0))
        if view == 'front':
            s.ell('bone', 15.5, 11, 6, 5.5); s.rect('bone', 12, 15, 19, 17)
            s.dots([(12, 10), (13, 10), (12, 11), (13, 11), (18, 10), (19, 10), (18, 11), (19, 11)], ('bone', 0))
            s.dots([(13, 11), (18, 11)], glow_eye)
            s.dots([(15, 13), (16, 13)], ('bone', 0)); s.dots([(13, 16), (15, 16), (17, 16), (19, 16)], ('bone', 1))
            s.dots([(11, 7), (12, 6), (13, 6)], ('bone', 4))
            s.dots([(15, 6), (14, 7)], ('bone', 1))
        else:
            s.ell('bone', 15.5, 11, 6, 5.5); s.rect('bone', 12, 15, 19, 16)
            s.dots([(11, 8), (12, 7), (13, 6)], ('bone', 4)); s.dots([(17, 8), (18, 10), (17, 12)], ('bone', 1))
        s.g('armL'); s.line('bone', [(10, 19), (9, 23), (9, 27)], 1); s.ell('bone', 9, 28, 1.3, 1.3)
        s.g('armR'); s.line('bone', [(21, 19), (22, 23), (22, 27)], 1); s.ell('bone', 22, 28, 1.3, 1.3)
        if view == 'front':
            grip = {None: (22, 28, 90), 0: (24, 18, -70), 1: (21, 28, 60), 2: (14, 30, 150)}[atk]
            sword(s, *grip, L=9)
        else:
            grip = {None: (22, 28, 90), 0: (21, 19, -100), 1: (22, 22, -60), 2: (19, 17, -150)}[atk]
            sword(s, *grip, L=9)
        s.g('body')
    else:
        s.g('armB'); s.line('bone', [(13, 19), (12, 23), (13, 27)], 1); s.g('body')
        s.g('legB'); s.rect('bone', 13, 29, 14, 36); s.poly('bone', [(13, 36), (15, 36), (17, 38), (13, 38)])
        s.g('legF'); s.rect('bone', 16, 29, 17, 36); s.poly('bone', [(16, 36), (18, 36), (20, 38), (16, 38)])
        s.g('body')
        s.poly('bone', [(12, 26), (19, 26), (18, 29), (13, 29)])
        s.poly('dleather', [(12, 27), (19, 27), (19, 31), (16, 30), (13, 32)])
        s.rect('bone', 14, 18, 15, 26)
        s.ell('bone', 16, 21, 4, 3.5)
        for y in (19, 21, 23): s.dots([(x, y) for x in range(16, 20)], ('bone', 0))
        s.ell('bone', 16, 11, 5.5, 5.5); s.rect('bone', 16, 15, 21, 17)
        s.dots([(18, 10), (19, 10), (18, 11), (19, 11)], ('bone', 0)); s.dot(19, 11, glow_eye)
        s.dots([(21, 13)], ('bone', 0)); s.dots([(17, 16), (19, 16), (21, 16)], ('bone', 1))
        s.dots([(12, 7), (13, 6), (14, 6)], ('bone', 4))
        s.g('armF')
        grip = {None: (17, 27, 80), 0: (12, 20, -150), 1: (21, 23, 10), 2: (20, 28, 60)}[atk]
        s.line('bone', [(15, 19), ((15 + grip[0]) / 2, (19 + grip[1]) / 2 + 1), (grip[0], grip[1])], 1)
        sword(s, *grip, L=9)
        s.g('body')
    if atk is None: return s, WALK[view][int(f[1])]
    return s, ATTACK[view][atk]

enemy('skeleton', 'Skeleton', 'material', (32, 44), ['front', 'side', 'back'], skeleton,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 150, 'attack': [180, 120, 200]}, oy=4,
      note='A rattling skeleton in a torn loincloth with a notched sword and faint green eye-glow. Hero-sized, three views. Attack: wind-up and chop.',
      behavior='From v1. The design still lists it as a source of Bone Fragments; its zone is not set yet.')

# ------------------------------------------------------------------ DEMON (material source)

def demon(view, f, var=None):
    s = new('demon'); cx = 18
    atk = int(f[1]) if f[0] == 'a' else None
    eye = hx('#fff0a0')
    if view in ('front', 'back'):
        s.g('wings')
        for side in (-1, 1):
            X = lambda x: cx + side * x
            s.poly('batwing', [(X(4), 17), (X(14), 6), (X(17), 9), (X(16), 15), (X(14), 13), (X(13), 19), (X(11), 17), (X(9), 22), (X(6), 22)])
            line_dots(s, [(X(5), 17), (X(14), 6)], ('batwing', 0)); s.dot(X(14), 6, ('horn', 4))
        s.g('body')
        if view == 'front':
            s.line('demon', [(cx + 4, 34), (cx + 10, 35), (cx + 12, 31)], 1); s.poly('demon', [(cx + 11, 31), (cx + 14, 28), (cx + 13, 32)])
        s.g('legL'); blob(s, 'demon', [('poly', [(cx - 6, 30), (cx - 2, 30), (cx - 3, 35), (cx - 4, 37), (cx - 6, 37), (cx - 5, 34)])]); s.ell('horn', cx - 5, 38, 2, 1)
        s.g('legR'); blob(s, 'demon', [('poly', [(cx + 2, 30), (cx + 6, 30), (cx + 5, 34), (cx + 6, 37), (cx + 4, 37), (cx + 3, 35)])]); s.ell('horn', cx + 5, 38, 2, 1)
        s.g('body')
        blob(s, 'demon', [('poly', [(cx - 8, 18), (cx + 8, 18), (cx + 6, 27), (cx + 5, 31), (cx - 5, 31), (cx - 6, 27)])])
        s.poly('dleather', [(cx - 6, 28), (cx + 6, 28), (cx + 5, 32), (cx, 34), (cx - 5, 32)])
        s.rect('gold', cx - 6, 28, cx + 6, 28)
        if view == 'front':
            s.dots([(cx - 3, 20), (cx - 2, 21), (cx + 2, 21), (cx + 3, 20)], ('demon', 1))
            s.dots([(cx - 1, 23), (cx + 1, 23), (cx - 1, 25), (cx + 1, 25)], ('demon', 1))
            s.dots([(cx - 6, 19), (cx - 5, 19), (cx - 4, 18)], ('demon', 4))
        else:
            line_dots(s, [(cx, 19), (cx, 27)], ('demon', 1))
        s.poly('horn', [(cx - 4, 10), (cx - 9, 7), (cx - 10, 1), (cx - 7, 5), (cx - 2, 7)])
        s.poly('horn', [(cx + 4, 10), (cx + 9, 7), (cx + 10, 1), (cx + 7, 5), (cx + 2, 7)])
        s.dots([(cx - 10, 1), (cx + 10, 1)], ('horn', 4))
        s.ell('demon', cx, 12, 5.5, 5.5); s.rect('demon', cx - 2, 16, cx + 2, 18)
        if view == 'front':
            s.dots([(cx - 3, 11), (cx - 2, 11), (cx + 2, 11), (cx + 3, 11)], eye)
            s.dots([(cx - 4, 10), (cx - 3, 10), (cx + 3, 10), (cx + 4, 10)], ('demon', 0))
            s.dots([(cx - 2, 15), (cx - 1, 15), (cx, 15), (cx + 1, 15), (cx + 2, 15)], ('demon', 0)); s.dots([(cx - 2, 14), (cx + 2, 14)], WHITE)
        else:
            s.dots([(cx - 3, 9), (cx - 2, 8)], ('demon', 4))
            s.g('tail'); s.line('demon', [(cx, 30), (cx - 1, 35), (cx + 2, 39)], 1); s.poly('demon', [(cx + 1, 38), (cx + 5, 39), (cx + 2, 42)]); s.g('body')
        for side in (-1, 1):
            s.g('armL' if side < 0 else 'armR')
            x0 = cx + side * 9
            raised = atk is not None and side > 0 and view == 'front'
            if raised and atk == 0:
                blob(s, 'demon', [('ell', x0, 15, 2.6, 4)]); s.dots([(x0 - 1, 10), (x0, 9), (x0 + 1, 10), (x0 + 2, 11)], ('horn', 4))
            elif raised and atk == 1:
                blob(s, 'demon', [('ell', x0 - 3, 25, 2.6, 4)]); s.dots([(x0 - 5, 29), (x0 - 4, 30), (x0 - 3, 30), (x0 - 2, 29)], ('horn', 4))
            else:
                blob(s, 'demon', [('ell', x0, 20, 2.6, 3), ('ell', x0 + side * 0.5, 26, 2.4, 3.5)])
                s.dots([(x0 - 1, 30), (x0, 30), (x0 + 1, 30)], ('horn', 4))
        s.g('body')
    else:
        s.g('wings')
        s.poly('batwing', [(cx - 2, 17), (cx - 12, 4), (cx - 16, 7), (cx - 15, 13), (cx - 13, 11), (cx - 12, 18), (cx - 10, 16), (cx - 8, 22), (cx - 4, 22)])
        line_dots(s, [(cx - 3, 17), (cx - 12, 4)], ('batwing', 0)); s.dot(cx - 12, 4, ('horn', 4))
        s.g('body')
        s.g('tail'); s.line('demon', [(cx - 3, 30), (cx - 9, 33), (cx - 12, 29)], 1); s.poly('demon', [(cx - 11, 29), (cx - 15, 26), (cx - 13, 31)]); s.g('body')
        s.g('legB'); blob(s, 'demon', [('poly', [(cx - 4, 30), (cx, 30), (cx + 1, 34), (cx - 1, 37), (cx - 3, 37), (cx - 2, 34)])]); s.ell('horn', cx - 1, 38, 2, 1)
        s.g('legF'); blob(s, 'demon', [('poly', [(cx, 30), (cx + 4, 30), (cx + 5, 34), (cx + 4, 37), (cx + 2, 37), (cx + 2, 34)])]); s.ell('horn', cx + 4, 38, 2.2, 1)
        s.g('body')
        blob(s, 'demon', [('poly', [(cx - 6, 18), (cx + 6, 18), (cx + 6, 27), (cx + 4, 31), (cx - 5, 31), (cx - 5, 27)])])
        s.poly('dleather', [(cx - 5, 28), (cx + 5, 28), (cx + 4, 32), (cx - 4, 33)]); s.rect('gold', cx - 5, 28, cx + 5, 28)
        s.dots([(cx - 5, 19), (cx - 4, 19)], ('demon', 4))
        s.poly('horn', [(cx - 1, 9), (cx - 6, 5), (cx - 8, 0), (cx - 4, 3), (cx + 2, 7)]); s.dot(cx - 8, 0, ('horn', 4))
        s.ell('demon', cx + 1, 12, 5, 5.5); s.poly('demon', [(cx + 4, 12), (cx + 8, 14), (cx + 4, 16)]); s.rect('demon', cx - 1, 16, cx + 3, 18)
        s.dots([(cx + 3, 11), (cx + 4, 11)], eye); s.dots([(cx + 2, 10), (cx + 3, 10)], ('demon', 0))
        s.dots([(cx + 4, 15), (cx + 5, 15), (cx + 6, 15)], ('demon', 0)); s.dot(cx + 5, 14, WHITE)
        s.g('armF')
        if atk == 0:
            blob(s, 'demon', [('ell', cx - 2, 17, 2.6, 4)]); s.dots([(cx - 4, 12), (cx - 3, 12), (cx - 2, 12)], ('horn', 4))
        elif atk == 1:
            blob(s, 'demon', [('ell', cx + 4, 21, 2.6, 3), ('ell', cx + 8, 23, 3.5, 2.4)]); s.dots([(cx + 12, 22), (cx + 12, 23), (cx + 12, 24)], ('horn', 4))
        else:
            blob(s, 'demon', [('ell', cx, 21, 2.6, 3), ('ell', cx + 1, 26, 2.4, 3.5)]); s.dots([(cx, 30), (cx + 1, 30), (cx + 2, 30)], ('horn', 4))
        s.g('body')
    if atk is None:
        pose = dict(WALK[view][int(f[1])]); pose['wings'] = (0, (0, -1, 0, -1)[int(f[1])])
        return s, pose, glow('#c43a2e', steps=((1, 40),))
    pose = dict(ATTACK[view][atk]); pose['wings'] = (0, (-1, 0, 0)[atk])
    return s, pose, glow('#c43a2e', steps=((1, 40),))

enemy('demon', 'Demon', 'material', (36, 46), ['front', 'side', 'back'], demon,
      {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
      timing={'move': 150, 'attack': [220, 120, 220]}, oy=4,
      note='A crimson demon with ram horns, leathery wings, goat legs and hooves, a spade-tipped tail and a gold-belted loincloth. Attack: claws raised, a downward rake, recover.',
      behavior='From v1. The design still lists it as a source of Demon Essence; its zone is not set yet.')

def claw_marks():
    out = []
    for k in range(3):
        a = canvas(36, 36)
        for i in range(3):
            for t in range(18):
                if k == 0 and t > 6: break
                x = 8 + i * 6 + t * 0.6; y = 6 + t * 1.4
                c = WHITE if t in (5, 6, 7) else R['ember'][3] if t < 12 else R['red'][3]
                put(a, x, y, c, 255 if k < 2 else 140); put(a, x + 1, y, R['red'][3], 200 if k < 2 else 90)
        out.append(a)
    return out

extra('demon', 'Claw rake', 'Three burning claw marks where the rake lands.', claw_marks())
