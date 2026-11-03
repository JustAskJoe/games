"""The six major bosses, one per zone (rounds 5, 10, 15, 20, 25, 30). Each faces the camera with a
4-frame idle loop and a 3-frame signature attack, plus effect strips. Drawn at full size in art
pixels (80-112 px), on the same pixel grid as the heroes."""
import math
import numpy as np
from ekit import (R, ramp, hx, EYE, WHITE, blob, line_dots, new, enemy, extra, ENEMIES,
                  glow, fade, flash, speckle, chain, canvas, put, disc, ring, sparkle, outline, arr, pil)
from bosses_mini import crown, afterimages

R.update({
    'bark':  ramp('#24160c', '#432a18', '#6a4628', '#90683c', '#b48c58'),
    'moss':  ramp('#1a3214', '#2e5422', '#457a30', '#66a040', '#9acc62'),
    'drag':  ramp('#0c1a36', '#16305c', '#234c86', '#3a72b2', '#68a4dc'),
    'web':   ramp('#6a7078', '#a0a8b0', '#d0d6dc', '#eef2f6', '#ffffff'),
    'mask':  ramp('#6a6458', '#a8a094', '#d8d2c4', '#f0ece2', '#ffffff'),
    'ice':   ramp('#1e4660', '#3a7090', '#68a6c4', '#a0d6ea', '#e0f8ff'),
    'obsid': ramp('#06050c', '#100e1c', '#1c1a30', '#2c2a48', '#46446c'),
})
YEL = hx('#f6e05a'); GLOW_G = hx('#c8ff70'); MAG = hx('#ff5ae0'); CY = hx('#9ffcff')

def major(key, name, zone, size, fn, note, behavior, attack_name, timing, rnd, oy=0, floats=False):
    enemy(key, name, zone, size, ['front'], fn, {'move': ['m0', 'm1', 'm2', 'm3'], 'attack': ['a0', 'a1', 'a2']},
          note, behavior, oy=oy, timing=timing)
    ENEMIES[key].update(tier='major', attack_name=attack_name, floats=floats, round=rnd)

def stars(s, pts, k=0):
    for i, (x, y) in enumerate(pts):
        if (i + k) % 4 == 0: continue
        s.dot(x, y, WHITE if i % 3 == 0 else CY if i % 3 == 1 else hx('#b8a0ff'))

# ================================================================== MEADOW GUARDIAN (round 5)

def guardian(view, f, var=None):
    s = new('guardian'); cx = 48
    k = int(f[1]); atk = k if f[0] == 'a' else None
    # roots
    for side in (-1, 1):
        s.g('legL' if side < 0 else 'legR')
        blob(s, 'bark', [('poly', [(cx + side * 4, 80), (cx + side * 14, 80), (cx + side * 22, 96), (cx + side * 26, 99), (cx + side * 18, 100),
                                    (cx + side * 13, 95), (cx + side * 10, 100), (cx + side * 4, 100), (cx + side * 7, 92)])])
        line_dots(s, [(cx + side * 10, 84), (cx + side * 16, 96)], ('bark', 1))
    s.g('body')
    blob(s, 'bark', [('poly', [(cx - 16, 40), (cx + 16, 40), (cx + 18, 60), (cx + 15, 84), (cx - 15, 84), (cx - 18, 60)])])
    for x, y0, y1 in ((cx - 12, 46, 80), (cx - 6, 64, 83), (cx + 7, 62, 82), (cx + 12, 44, 78), (cx - 2, 42, 50)):
        line_dots(s, [(x, y0), (x + (1 if x > cx else -1), (y0 + y1) / 2), (x, y1)], ('bark', 1))
    s.dots([(cx - 15, 46), (cx - 15, 52), (cx - 16, 58), (cx - 14, 66)], ('bark', 4))
    if view == 'back':
        # weak spot: a glowing knot in the bark
        blob(s, 'bark', [('ell', cx, 62, 7, 8)]); blob(s, 'black', [('ell', cx, 62, 4.5, 5.5)], flat=True)
        kc = hx('#fff070') if atk == 1 else GLOW_G
        s.dots([(cx - 1, 60), (cx, 60), (cx + 1, 61), (cx - 2, 62), (cx - 1, 62), (cx, 62), (cx + 1, 62), (cx - 1, 64), (cx, 64), (cx + 1, 63)], kc); s.dots([(cx - 1, 61), (cx, 61)], WHITE)
        line_dots(s, [(cx - 7, 56), (cx - 11, 50)], ('bark', 1)); line_dots(s, [(cx + 7, 68), (cx + 11, 76)], ('bark', 1))
    else:
        # face
        for ex in (cx - 9, cx + 4):
            blob(s, 'black', [('ell', ex + 2.5, 56, 3.5, 2.6)], flat=True)
            eyes = (GLOW_G if atk is None else hx('#fff070'))
            s.dots([(ex + 2, 56), (ex + 3, 56), (ex + 2, 55)], eyes); s.dot(ex + 2, 55, WHITE)
        blob(s, 'moss', [('poly', [(cx - 13, 52), (cx - 3, 51), (cx - 4, 53), (cx - 12, 54)]), ('poly', [(cx + 13, 52), (cx + 3, 51), (cx + 4, 53), (cx + 12, 54)])])
        mouth = [(cx - 6, 66), (cx - 3, 67), (cx, 66), (cx + 3, 67), (cx + 6, 66)] if atk != 1 else [(cx - 6, 65), (cx - 3, 69), (cx, 70), (cx + 3, 69), (cx + 6, 65)]
        line_dots(s, mouth, ('bark', 0))
        s.ell('moss', cx - 1, 76, 5, 2.5); s.dots([(cx - 3, 75), (cx + 1, 75)], ('pink', 3))
    # mushrooms at the base
    for x, y in ((cx - 16, 84), (cx + 14, 83)):
        s.rect('cream', x, y - 2, x + 1, y); s.ell('mush', x + 0.5, y - 3, 2.5, 1.5); s.dot(x, y - 4, ('cream', 4))
    # arms (branches)
    lift = {None: 0, 0: -26, 1: 22, 2: 22}[atk]
    for side in (-1, 1):
        s.g('armL' if side < 0 else 'armR')
        rl = lift if side > 0 else (0 if atk is None else -4)
        sx, sy = cx + side * 15, 46
        ex, ey = cx + side * 33, 66 + rl
        mx, my = cx + side * 28, 52 + rl * 0.4
        blob(s, 'bark', [('line', [(sx, sy), (mx, my), (ex, ey)], 7)])
        for dx, dy in ((-3, 6), (0, 8), (3, 6)):
            s.line('bark', [(ex, ey), (ex + side * dx + dx, ey + dy)], 2)
        blob(s, 'moss', [('ell', mx, my - 3, 5, 3)])
        s.ell('leaf', ex - side * 2, ey - 3, 4, 3); s.dots([(ex - side * 3, ey - 5)], ('leaf', 4))
    s.g('body')
    # crown of leaves
    s.g('crown')
    blobs = [(0, 22, 24, 16), (-22, 30, 15, 11), (22, 30, 15, 11), (-12, 12, 15, 11), (12, 12, 15, 11), (0, 6, 12, 8), (-30, 38, 9, 7), (30, 38, 9, 7)]
    blob(s, 'leaf', [('ell', cx + dx, dy, rx, ry) for dx, dy, rx, ry in blobs])
    blob(s, 'moss', [('ell', cx + dx * 0.9, dy + 6, rx * 0.7, ry * 0.5) for dx, dy, rx, ry in blobs[:3]], flat=True)
    rng = np.random.default_rng(5)
    for _ in range(60):
        a = rng.random() * math.tau; r = rng.random()
        x, y = cx + math.cos(a) * r * 36, 24 + math.sin(a) * r * 18
        s.dot(x, y, ('leaf', 4) if y < 22 else ('leaf', 1))
    for x, y in ((cx - 18, 14), (cx + 9, 6), (cx + 24, 24), (cx - 28, 32), (cx - 4, 20), (cx + 16, 34), (cx - 14, 30)):
        s.dots([(x, y - 1), (x - 1, y), (x + 1, y), (x, y + 1)], ('pink', 3)); s.dot(x, y, YEL)
    for x, y in ((cx + 2, 30), (cx - 22, 22), (cx + 28, 30)):
        s.dots([(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)], ('red', 3)); s.dot(x, y, ('red', 4))
    s.g('body')
    knot = glow('#c8ff70', steps=((1, 90), (2, 30))) if view == 'back' else None
    if atk is None:
        sway = (0, 1, 0, -1)[k]
        pose = {'crown': (sway, 0), 'armL': (0, (0, 1, 0, -1)[k]), 'armR': (0, (0, -1, 0, 1)[k]), 'body': (0, 0)}
        return (s, pose, knot) if knot else (s, pose)
    pose = [{'crown': (0, -1), 'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'crown': (0, 2), 'body': (0, 2), 'legL': (0, 0), 'legR': (0, 0)},
            {'crown': (0, 1), 'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}][atk]
    return s, pose, (glow('#c8ff70', steps=((1, 110), (2, 50))) if atk == 1 else knot)

major('guardian', 'Meadow Guardian', 'meadow', (96, 102), guardian,
      'An ancient treant: a bark body with a sleepy, glowing-eyed face, branch arms wrapped in moss, root feet and a blossoming leaf crown with apples. Its weak spot is a glowing knot on its back.',
      'Slams roots up from the ground, calls Beetle swarms, and takes extra damage from behind.',
      'Root Slam: one branch arm rises, crashes down, and roots burst out of the ground.',
      {'move': 260, 'attack': [480, 220, 520]}, 5, oy=2)

def root_spikes():
    out = []
    for k in range(3):
        a = canvas(96, 40)
        for i in range(5):
            x = 10 + i * 19; h = [0, 8, 16, 22][min(3, max(0, (k + 1) * 2 - i))] if i <= (k + 1) * 2 else 0
            if not h:
                for t in range(-4, 5): put(a, x + t, 36, R['bark'][1], 160)
                continue
            for t in range(h):
                w = max(1, int((h - t) / h * 4))
                for o in range(-w, w + 1):
                    put(a, x + o + (t // 6), 36 - t, R['bark'][3] if o < 0 else R['bark'][2])
            put(a, x + h // 6, 36 - h + 1, R['leaf'][3]); put(a, x + h // 6 + 1, 36 - h + 2, R['leaf'][2])
        out.append(outline(a, '#24160c'))
    return out

extra('guardian', 'Root spikes', 'Roots burst out in a line from the slam; points right, rotate to aim.', root_spikes())

# ================================================================== FOREST WITCH (round 10)

def forest_witch(view, f, var=None):
    s = new('forest_witch'); cx = 50
    k = int(f[1]); atk = k if f[0] == 'a' else None
    # eight spider legs
    legs = [(-1, 50, (-24, 34), (-44, 60)), (-1, 54, (-28, 46), (-46, 76)), (-1, 58, (-24, 60), (-36, 84)), (-1, 62, (-16, 66), (-22, 86)),
            (1, 50, (24, 34), (44, 60)), (1, 54, (28, 46), (46, 76)), (1, 58, (24, 60), (36, 84)), (1, 62, (16, 66), (22, 86))]
    for i, (side, y0, knee, foot) in enumerate(legs):
        grp = 'legA' if (i % 2 == 0) == (side < 0) else 'legB'
        s.g(grp)
        p0 = (cx + side * 8, y0); p1 = (cx + knee[0], y0 + knee[1] - 50); p2 = (cx + foot[0], foot[1])
        s.line('black', [p0, p1], 3); s.line('black', [p1, p2], 2)
        s.dot(*p1, ('black', 4)); s.dot(p1[0], p1[1] - 1, ('witch', 3)); s.dot(*p2, ('witch', 3))
    s.g('body')
    # abdomen behind
    blob(s, 'dgreen', [('ell', cx, 40, 22, 17)])
    s.dots([(cx - 2, 28), (cx + 2, 28), (cx - 1, 30), (cx + 1, 30), (cx, 31), (cx, 33), (cx - 1, 34), (cx + 1, 34), (cx - 2, 36), (cx + 2, 36)], ('witch', 3))
    s.dots([(cx - 16, 32), (cx - 14, 30), (cx - 12, 28)], ('dgreen', 4))
    for x, y in ((cx - 12, 44), (cx + 12, 44), (cx - 8, 50), (cx + 8, 50)): s.dots([(x, y), (x + 1, y)], ('witch', 2))
    blob(s, 'dgreen', [('ell', cx, 62, 14, 8)])
    # witch: dress rising from the spider body
    blob(s, 'witch', [('poly', [(cx - 8, 40), (cx + 8, 40), (cx + 11, 56), (cx + 7, 60), (cx, 58), (cx - 7, 60), (cx - 11, 56)])])
    s.rect('gold', cx - 7, 48, cx + 7, 48); s.dot(cx, 48, ('vial_g', 4))
    line_dots(s, [(cx - 3, 50), (cx - 5, 58)], ('witch', 1)); line_dots(s, [(cx + 3, 50), (cx + 5, 58)], ('witch', 1))
    s.poly('witch', [(cx - 9, 40), (cx - 3, 38), (cx, 42), (cx + 3, 38), (cx + 9, 40), (cx + 6, 43), (cx - 6, 43)])
    # hair, face, hat
    blob(s, 'hblack', [('ell', cx, 31, 8, 7), ('poly', [(cx - 8, 30), (cx - 11, 46), (cx - 6, 42)]), ('poly', [(cx + 8, 30), (cx + 11, 46), (cx + 6, 42)])])
    s.ell('sprite', cx, 32, 5.5, 5)
    s.dots([(cx - 3, 31), (cx - 2, 31), (cx + 2, 31), (cx + 3, 31)], YEL); s.dots([(cx - 2, 31), (cx + 2, 31)], EYE)
    s.dots([(cx - 4, 30), (cx - 3, 30), (cx + 3, 30), (cx + 4, 30)], ('sprite', 0))
    s.dots([(cx - 2, 35), (cx - 1, 36), (cx, 36), (cx + 1, 36), (cx + 2, 35)], ('sprite', 0)) if atk != 1 else s.dots([(cx - 1, 35), (cx, 35), (cx + 1, 35), (cx, 36)], EYE)
    s.dots([(cx - 3, 37), (cx + 3, 37)], ('witch', 3))
    blob(s, 'wpurple', [('ell', cx, 26, 16, 3.5), ('poly', [(cx - 8, 26), (cx - 5, 16), (cx - 2, 10), (cx + 4, 2), (cx + 12, -1), (cx + 8, 4), (cx + 4, 12), (cx + 7, 26)])])
    s.rect('gold', cx - 7, 23, cx + 7, 24)
    s.dots([(cx - 1, 22), (cx + 1, 22), (cx, 21), (cx - 2, 21), (cx + 2, 21), (cx, 23)], ('black', 2)); s.dots([(cx - 1, 21), (cx + 1, 21)], RED_DOT)
    s.dots([(cx - 14, 25), (cx - 12, 24), (cx - 9, 24), (cx - 6, 18), (cx - 4, 13)], ('wpurple', 4))
    # web strands hanging from the hat brim
    for x in (cx - 14, cx + 13):
        line_dots(s, [(x, 28), (x, 34)], ('web', 3)); s.dot(x, 35, ('black', 3))
    # arms
    if atk is None:
        for side in (-1, 1):
            s.g('arm' + ('L' if side < 0 else 'R'))
            s.line('witch', [(cx + side * 8, 42), (cx + side * 13, 48), (cx + side * 15, 52)], 3)
            s.ell('sprite', cx + side * 15, 53, 1.8, 1.8)
            s.ell('vial_g', cx + side * 16, 57, 2.6, 2.6) if side > 0 else None
            if side > 0: s.dot(cx + side * 15, 56, WHITE)
        s.g('body')
    elif atk == 0:
        for side in (-1, 1):
            s.line('witch', [(cx + side * 8, 42), (cx + side * 9, 48), (cx + side * 4, 51)], 3); s.ell('sprite', cx + side * 3, 52, 1.8, 1.8)
        s.ell('web', cx, 52, 3.5, 3)
        line_dots(s, [(cx - 3, 50), (cx + 3, 54)], ('web', 1)); line_dots(s, [(cx + 3, 50), (cx - 3, 54)], ('web', 1))
    elif atk == 1:
        s.line('witch', [(cx - 8, 42), (cx - 13, 48), (cx - 15, 52)], 3); s.ell('sprite', cx - 15, 53, 1.8, 1.8)
        s.line('witch', [(cx + 8, 42), (cx + 14, 36), (cx + 18, 30)], 3); s.ell('sprite', cx + 19, 29, 1.8, 1.8)
        s.dots([(cx + 21, 27), (cx + 22, 26), (cx + 21, 30)], ('web', 4))
    else:
        for side in (-1, 1):
            s.line('witch', [(cx + side * 8, 42), (cx + side * 15, 34), (cx + side * 18, 26)], 3); s.ell('sprite', cx + side * 19, 25, 1.8, 1.8)
            s.ell('vial_g', cx + side * 20, 21, 2.6, 2.6)
    if atk is None:
        pose = [{'legA': (0, -1)}, {'body': (0, -1), 'legA': (0, 0), 'legB': (0, 0)}, {'legB': (0, -1)}, {'body': (0, -1), 'legA': (0, 0), 'legB': (0, 0)}][k]
    else:
        pose = [{'body': (0, 1), 'legA': (0, 0), 'legB': (0, 0)}, {'body': (0, -1), 'legA': (0, 0), 'legB': (0, 0)}, {'body': (0, -2), 'legA': (0, 0), 'legB': (0, 0)}][atk]
    return s, pose, (glow('#72dc6e', steps=((1, 120), (2, 50))) if atk == 2 else None)

RED_DOT = hx('#ff3a30')

major('forest_witch', 'Forest Witch', 'forest', (100, 90), forest_witch,
      'The spider queen: a green-skinned witch in a violet dress and a crooked hat with a spider pin, rising from a giant spider body with an hourglass mark and eight long legs.',
      'Throws webs that slow you, calls wolf packs and rains poison.',
      'Web and Venom: spins a web ball, throws it, then raises two venom orbs for poison rain.',
      {'move': 150, 'attack': [320, 240, 420]}, 10, oy=0)

def web_ball():
    out = []
    for k in range(2):
        a = canvas(16, 16)
        disc(a, 8, 8, 5.5, R['web'][2]); disc(a, 7, 7, 3.5, R['web'][3])
        for i in range(6):
            ang = i * math.pi / 3 + k * 0.5
            for t in range(7): put(a, 8 + math.cos(ang) * t, 8 + math.sin(ang) * t, R['web'][1])
        ring(a, 8, 8, 4, 1, R['web'][1]); put(a, 6, 5, WHITE)
        out.append(outline(a, '#4a5058'))
    return out

def poison_rain():
    out = []
    g = R['vial_g']
    for k in range(3):
        a = canvas(24, 32)
        if k < 2:
            y = 6 + k * 14
            for t in range(5): put(a, 12, y + t, g[3] if t < 3 else g[2])
            put(a, 11, y + 3, g[2]); put(a, 13, y + 3, g[2]); put(a, 12, y, WHITE)
            disc(a, 12, 28, 5 + k * 2, g[1], 110, 0.4)
        else:
            disc(a, 12, 28, 9, g[2], 170, 0.4); disc(a, 12, 28, 6, g[3], 200, 0.4)
            for dx, dy in ((-6, -4), (6, -5), (-3, -7), (4, -8)): put(a, 12 + dx, 26 + dy, g[3])
        out.append(a)
    return out

extra('forest_witch', 'Web ball', 'Thrown at you; a hit slows you. Points right, rotate to aim.', web_ball())
extra('forest_witch', 'Poison rain', 'Drops fall on marked spots and leave a green puddle.', poison_rain())

# ================================================================== CAVERN WYRM (round 15)

def cavern_wyrm(view, f, var=None):
    s = new('cavern_wyrm'); cx = 56
    k = int(f[1]); atk = k if f[0] == 'a' else None
    flap = (0, -2, -3, -1)[k] if atk is None else (-4, -2, 0)[atk]
    # wings (crystal membranes) behind
    for side in (-1, 1):
        s.g('wings')
        sh = (cx + side * 14, 40)
        tips = [(cx + side * 30, 8 + flap), (cx + side * 46, 14 + flap), (cx + side * 54, 34 + flap // 2), (cx + side * 50, 54)]
        pts = [sh, tips[0]]
        for t0, t1 in zip(tips, tips[1:]):
            mx, my = (t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2
            pts += [(mx + (sh[0] - mx) * 0.25, my + (sh[1] - my) * 0.25), t1]
        pts += [(cx + side * 22, 60)]
        s.poly('crystal', pts)
        for t in tips: line_dots(s, [sh, t], ('drag', 1))
        s.dot(*tips[0], WHITE)
    s.g('body')
    # tail curling around the right
    blob(s, 'drag', [('line', [(cx + 16, 80), (cx + 30, 86), (cx + 40, 80), (cx + 44, 70)], 7)])
    for x, y in ((cx + 30, 82), (cx + 40, 76), (cx + 45, 68)): ccrys(s, x, y, 5, 3, 1)
    # body
    blob(s, 'drag', [('ell', cx, 64, 20, 22)])
    blob(s, 'ice', [('ell', cx, 68, 11, 17)])
    for y in range(54, 84, 5):
        for x in range(cx - 8 + (y // 5) % 2 * 2, cx + 9, 4):
            s.dots([(x, y), (x + 1, y + 1), (x - 1, y + 1), (x, y + 2)], ('ice', 1))
            s.dot(x, y + 1, ('ice', 4))
    # front legs and claws
    for side in (-1, 1):
        s.g('leg' + ('L' if side < 0 else 'R'))
        blob(s, 'drag', [('ell', cx + side * 16, 72, 6, 9), ('ell', cx + side * 17, 84, 6, 4)])
        s.dots([(cx + side * 17 - 3, 88), (cx + side * 17, 89), (cx + side * 17 + 3, 88)], ('crystal', 4))
    s.g('body')
    # neck and head
    s.g('head')
    lift = {None: 0, 0: -6, 1: -2, 2: 4}[atk]
    hy = 22 + lift
    blob(s, 'drag', [('poly', [(cx - 8, 48), (cx + 8, 48), (cx + 6, hy + 8), (cx - 6, hy + 8)])])
    blob(s, 'ice', [('poly', [(cx - 4, 48), (cx + 4, 48), (cx + 3, hy + 10), (cx - 3, hy + 10)])])
    for side in (-1, 1):
        ccrys(s, cx + side * 6, hy - 2, 12, 3, side * 5); ccrys(s, cx + side * 9, hy + 2, 8, 3, side * 6)
    blob(s, 'drag', [('ell', cx, hy + 2, 10, 8), ('poly', [(cx - 7, hy + 4), (cx + 7, hy + 4), (cx + 5, hy + 15), (cx - 5, hy + 15)])])
    ccrys(s, cx, hy - 5, 7, 3, 0)
    open_ = atk in (1, 2)
    if open_:
        blob(s, 'crystal', [('poly', [(cx - 4, hy + 10), (cx + 4, hy + 10), (cx + 3, hy + 18), (cx - 3, hy + 18)])])
        s.dots([(cx - 3, hy + 10), (cx - 1, hy + 10), (cx + 1, hy + 10), (cx + 3, hy + 10)], WHITE); s.dots([(cx, hy + 13), (cx, hy + 14)], WHITE)
        blob(s, 'drag', [('poly', [(cx - 5, hy + 17), (cx + 5, hy + 17), (cx + 3, hy + 20), (cx - 3, hy + 20)])])
    else:
        s.dots([(cx - 3, hy + 13), (cx - 1, hy + 14), (cx + 1, hy + 14), (cx + 3, hy + 13)], ('drag', 0))
    s.dots([(cx - 2, hy + 12), (cx + 2, hy + 12)], ('drag', 0))
    for ex in (cx - 6, cx + 4):
        s.dots([(ex, hy + 2), (ex + 1, hy + 2), (ex + 2, hy + 2), (ex, hy + 3), (ex + 1, hy + 3)], CY); s.dot(ex, hy + 2, WHITE)
    s.dots([(cx - 7, hy), (cx - 6, hy), (cx + 6, hy), (cx + 7, hy)], ('drag', 0))
    s.dots([(cx - 8, hy - 2), (cx - 7, hy - 3), (cx - 9, hy)], ('drag', 4))
    s.g('body')
    if atk is None:
        pose = {'head': (0, (0, -1, -1, 0)[k]), 'body': (0, 0), 'wings': (0, 0)}
        return s, pose, glow('#7ee0f0', steps=((1, 50),))
    return s, {'body': (0, (1, 0, -1)[atk])}, glow('#7ee0f0', steps=((1, 140), (2, 70), (3, 30)) if open_ else ((1, 60),))

def ccrys(s, x, y, h, w=3, lean=0, m='crystal'):
    pts = [(x - w / 2, y), (x - w / 2 + lean * 0.6, y - h * 0.65), (x + lean, y - h), (x + w / 2 + lean * 0.6, y - h * 0.65), (x + w / 2, y)]
    s.poly(m, pts)
    line_dots(s, [(x - w / 2 + 1 + lean * 0.1, y - 1), (x + lean * 0.8 - 0.5, y - h + 2)], (m, 4))
    s.dot(x + lean, y - h + 1, WHITE)

major('cavern_wyrm', 'Cavern Wyrm', 'caverns', (112, 94), cavern_wyrm,
      'A sapphire crystal dragon: deep blue scales, a cream belly, cyan crystal horns and spines, and wings of clear crystal.',
      'Charges across the arena, breathes crystal, calls Golems and sheds shards between phases.',
      'Crystal Breath: rears up, the jaw opens on cyan light, then it breathes a cone of shards.',
      {'move': 200, 'attack': [420, 300, 520]}, 15, oy=2)

def crystal_breath():
    out = []
    C = R['crystal']
    for k in range(3):
        a = canvas(56, 80); L = (26, 52, 76)[k]
        for t in range(L):
            w = 2 + t * 0.34
            for o in range(-int(w), int(w) + 1):
                if (t * 5 + o * 7 + k * 3) % 9 < 3: continue
                d = abs(o) / w
                put(a, 28 + o, 2 + t, C[4] if d < 0.3 else C[3] if d < 0.65 else C[2], 255 if t < L - 8 else 150)
        for i in range(6 + k * 3):
            x, y = 28 + ((i * 13) % 21 - 10) * (0.4 + k * 0.3), 6 + (i * 17) % max(8, L - 6)
            put(a, x, y, WHITE)
        out.append(a)
    return out

extra('cavern_wyrm', 'Crystal breath', 'A cone of crystal shards from the open jaw; points down, rotate to aim.', crystal_breath())

# ================================================================== VOLCANO LORD (round 20)

def volcano_lord(view, f, var=None):
    s = new('volcano_lord'); cx = 52
    k = int(f[1]); atk = k if f[0] == 'a' else None
    L3, L4 = R['lava'][3], R['lava'][4]
    for side in (-1, 1):
        s.g('legL' if side < 0 else 'legR')
        blob(s, 'basalt', [('rect', cx + side * 8 - 7, 74, cx + side * 8 + 7, 94), ('ell', cx + side * 9, 96, 10, 4)])
        line_dots(s, [(cx + side * 8, 78), (cx + side * 7, 84), (cx + side * 9, 90)], L3)
        s.dots([(cx + side * 9 - 6, 98), (cx + side * 9, 99), (cx + side * 9 + 6, 98)], L3)
    s.g('body')
    # molten body showing between armor plates
    blob(s, 'lava', [('poly', [(cx - 24, 34), (cx + 24, 34), (cx + 20, 78), (cx - 20, 78)])])
    for pts in ([(cx - 25, 33), (cx - 2, 33), (cx - 3, 52), (cx - 22, 54)], [(cx + 2, 33), (cx + 25, 33), (cx + 22, 54), (cx + 3, 52)],
                [(cx - 21, 57), (cx - 3, 55), (cx - 4, 77), (cx - 18, 78)], [(cx + 3, 55), (cx + 21, 57), (cx + 18, 78), (cx + 4, 77)]):
        s.poly('basalt', pts)
    blob(s, 'lava', [('ell', cx, 54, 5, 5)]); s.dots([(cx - 1, 52), (cx, 52), (cx - 1, 53)], WHITE); s.dots([(cx, 54), (cx + 1, 55)], L4)
    s.dots([(cx - 22, 36), (cx - 21, 35), (cx - 19, 35), (cx - 23, 39)], ('basalt', 4))
    line_dots(s, [(cx - 15, 40), (cx - 10, 46), (cx - 14, 50)], L3); line_dots(s, [(cx + 15, 62), (cx + 10, 68), (cx + 13, 74)], L3)
    s.rect('basalt', cx - 20, 66, cx + 20, 69)
    s.dots([(x, 67) for x in range(cx - 18, cx + 19, 4)], L4)
    # head: horned, flaming crown
    s.g('head')
    for i, (dx, h) in enumerate(((-10, 12), (-5, 18), (0, 22), (5, 17), (10, 11))):
        sway = ((i + k) % 3) - 1
        s.poly('ember', [(cx + dx - 4, 18), (cx + dx + sway, 18 - h), (cx + dx + 4, 18)])
        s.dot(cx + dx + sway, 19 - h, ('ember', 4))
    for side in (-1, 1):
        s.poly('horn', [(cx + side * 9, 20), (cx + side * 20, 14), (cx + side * 24, 2), (cx + side * 18, 10), (cx + side * 7, 15)])
        s.dot(cx + side * 24, 2, ('horn', 4)); s.dot(cx + side * 23, 4, ('horn', 4))
    blob(s, 'basalt', [('ell', cx, 24, 11, 9), ('poly', [(cx - 8, 26), (cx + 8, 26), (cx + 6, 35), (cx - 6, 35)])])
    s.dots([(cx - 6, 22), (cx - 5, 22), (cx - 4, 22), (cx + 4, 22), (cx + 5, 22), (cx + 6, 22), (cx - 5, 23), (cx - 4, 23), (cx + 4, 23), (cx + 5, 23)], L4)
    s.dots([(cx - 5, 22), (cx + 4, 22)], WHITE); s.dots([(cx - 7, 20), (cx - 6, 21), (cx + 6, 21), (cx + 7, 20)], ('basalt', 0))
    mh = 3 if atk == 2 else 1
    blob(s, 'lava', [('rect', cx - 5, 29, cx + 5, 29 + mh)]); s.dots([(cx - 4, 29), (cx - 2, 29), (cx + 2, 29), (cx + 4, 29)], WHITE)
    s.dots([(cx - 9, 19), (cx - 8, 18), (cx - 10, 21)], ('basalt', 4))
    s.g('body')
    # arms
    up = {None: 0, 0: -30, 1: -8, 2: 10}[atk]
    for side in (-1, 1):
        s.g('armL' if side < 0 else 'armR')
        ax = cx + side * 32
        blob(s, 'basalt', [('ell', cx + side * 26, 38, 9, 7), ('rect', ax - 6, 42 + up * 0.5, ax + 6, 58 + up * 0.7), ('ell', ax, 64 + up, 9, 8)])
        line_dots(s, [(ax - side * 2, 44 + up * 0.5), (ax + side, 52 + up * 0.6), (ax - side, 58 + up * 0.7)], L3)
        s.dots([(ax - 5, 69 + up), (ax, 70 + up), (ax + 5, 69 + up)], L4)
        ccrys_spike(s, cx + side * 28, 32, side)
    s.g('body')
    if atk in (0, 1):
        by = 16 if atk == 0 else 8
        bx = cx if atk == 0 else cx + 18
        blob(s, 'basalt', [('ell', bx, by, 13, 11)])
        line_dots(s, [(bx - 9, by - 2), (bx - 3, by + 1), (bx + 2, by - 4), (bx + 8, by)], L3); line_dots(s, [(bx - 9, by - 1), (bx - 3, by + 2), (bx + 2, by - 3), (bx + 8, by + 1)], ('lava', 2))
        line_dots(s, [(bx - 1, by + 9), (bx, by + 4), (bx + 4, by + 6)], L3); s.dots([(bx - 3, by + 1), (bx + 2, by - 4), (bx, by + 5)], L4)
        s.dots([(bx - 9, by - 7), (bx - 8, by - 8), (bx - 6, by - 9)], ('basalt', 4))
    if atk is None:
        pose = [{'legL': (0, -2), 'armL': (0, 1), 'armR': (0, -1)}, {'body': (0, 1), 'head': (0, 1), 'legL': (0, 0), 'legR': (0, 0)},
                {'legR': (0, -2), 'armL': (0, -1), 'armR': (0, 1)}, {'body': (0, 1), 'head': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}][k]
        return s, pose, glow('#ff7a10', steps=((1, 120), (2, 50)))
    pose = [{'body': (0, -1), 'head': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'body': (0, 1), 'head': (0, 1), 'legL': (0, 0), 'legR': (0, 0)},
            {'body': (0, 3), 'head': (0, 3), 'legL': (0, 0), 'legR': (0, 0)}][atk]
    return s, pose, glow('#ffa030', steps=((1, 160), (2, 80), (3, 30)))

def ccrys_spike(s, x, y, side):
    s.poly('basalt', [(x - 3, y + 2), (x + side * 4, y - 9), (x + 4, y + 2)]); s.dot(x + side * 4, y - 8, ('lava', 3))

major('volcano_lord', 'Volcano Lord', 'volcanic', (104, 102), volcano_lord,
      'A towering lava demon in cracked basalt armor, molten light pouring through every seam, curved horns and a crown of living flame.',
      'Fills the arena with lava as the fight goes on, throws boulders, sets off geysers and calls Fire Imps.',
      'Boulder Throw: heaves a molten boulder overhead, hurls it, then stomps to set off geysers.',
      {'move': 260, 'attack': [480, 220, 420]}, 20, oy=2)

def boulder():
    out = []
    for k in range(2):
        a = canvas(22, 22)
        disc(a, 11, 11, 8.5, R['basalt'][2]); disc(a, 10, 10, 6, R['basalt'][3])
        for i in range(6):
            ang = i * 1.1 + k * 0.8
            for t in range(4): put(a, 11 + math.cos(ang) * (2 + t), 11 + math.sin(ang) * (2 + t), R['lava'][3])
        put(a, 11, 11, R['lava'][4]); put(a, 7, 6, R['basalt'][4]); put(a, 8, 5, R['basalt'][4])
        out.append(outline(a, '#141016'))
    return out

def geyser():
    out = []
    E = R['ember']
    for k in range(3):
        a = canvas(32, 56)
        disc(a, 16, 50, 9, R['basalt'][1], 220, 0.4); disc(a, 16, 50, 6, R['lava'][2], 230, 0.4)
        if k == 0:
            for i in range(5): put(a, 12 + i * 2, 49, E[4])
        else:
            h = (0, 30, 48)[k]
            for t in range(h):
                w = 3 + t * 0.06 + (2 if t > h - 6 else 0)
                for o in range(-int(w), int(w) + 1):
                    put(a, 16 + o, 50 - t, E[4] if abs(o) < w * 0.35 else E[3] if abs(o) < w * 0.7 else E[2], 255 if k == 1 else 190)
        out.append(a)
    return out

extra('volcano_lord', 'Boulder', 'Thrown molten boulder; spins as it flies.', boulder())
extra('volcano_lord', 'Geyser', 'Frame 1 is the bubbling warning, then the eruption.', geyser())

# ================================================================== SHADOW SOVEREIGN (round 25)

def sovereign(view, f, var=None):
    s = new('sovereign'); cx = 48
    k = int(f[1]); atk = k if f[0] == 'a' else None
    spread = 6 if atk == 0 else 0
    wave = (0, 1, 0, -1)[k] if atk is None else 0
    hem = []
    for i in range(9):
        x = cx - 30 - spread + i * (60 + spread * 2) / 8
        hem.append((x, 98 - (i % 2) * 4 + (wave if i % 3 == 0 else -wave)))
    pts = [(cx - 12, 24), (cx - 22, 46), (cx - 28 - spread, 76)] + hem + [(cx + 28 + spread, 76), (cx + 22, 46), (cx + 12, 24)]
    s.poly('shadow', pts)
    rng = np.random.default_rng(9)
    st = [(cx + rng.integers(-24, 25), rng.integers(40, 94)) for _ in range(40)]
    stars(s, [(x, y) for x, y in st if abs(x - cx) < (y - 20) * 0.38], k)
    line_dots(s, [(cx - 10, 30), (cx - 18, 70), (cx - 22, 94)], ('shadow', 3)); line_dots(s, [(cx + 10, 30), (cx + 17, 70), (cx + 20, 94)], ('shadow', 1))
    # collar and hood
    s.poly('obsid', [(cx - 18, 28), (cx - 10, 22), (cx, 28), (cx + 10, 22), (cx + 18, 28), (cx + 12, 36), (cx, 33), (cx - 12, 36)])
    s.dots([(cx - 16, 28), (cx - 10, 23), (cx + 10, 23), (cx + 16, 28)], ('gold', 3))
    blob(s, 'shadow', [('ell', cx, 18, 11, 11), ('poly', [(cx - 11, 16), (cx, 4), (cx + 11, 16)])])
    # mask
    blob(s, 'mask', [('ell', cx, 19, 6.5, 7.5)])
    for ex in (cx - 4, cx + 2):
        s.dots([(ex, 17), (ex + 1, 17), (ex + 2, 18)] if ex < cx else [(ex, 18), (ex + 1, 17), (ex + 2, 17)], EYE)
        s.dot(ex + 1, 18, MAG)
    line_dots(s, [(cx + 2, 12), (cx + 1, 16), (cx + 3, 20), (cx + 2, 24)], ('mask', 0))
    s.dots([(cx - 1, 24), (cx, 24), (cx + 1, 24)], ('mask', 1)); s.dots([(cx - 4, 14), (cx - 3, 13)], ('mask', 4))
    # crown of black spires
    for i, (dx, h) in enumerate(((-8, 7), (-4, 11), (0, 15), (4, 11), (8, 7))):
        s.poly('obsid', [(cx + dx - 1.5, 9), (cx + dx, 9 - h), (cx + dx + 1.5, 9)])
        s.dot(cx + dx, 9 - h, ('gold', 4))
    # hands and scepter
    for side in (-1, 1):
        s.g('arm' + ('L' if side < 0 else 'R'))
        hy = 52 if atk is None else (40, 44, 34)[atk]
        hxp = cx + side * (22 + spread)
        s.poly('shadow', [(cx + side * 14, 32), (hxp + side * 2, hy - 6), (hxp, hy + 2), (cx + side * 12, 42)])
        s.ell('mask', hxp, hy, 2.5, 2.5); s.dots([(hxp - 2, hy + 3), (hxp, hy + 4), (hxp + 2, hy + 3)], ('mask', 3))
    s.g('body')
    sx = cx + 24 + spread
    if atk != 2:
        s.line('obsid', [(sx, 30), (sx, 92)], 2); s.ell('obsid', sx, 26, 4, 4); s.dots([(sx - 1, 25), (sx, 24)], MAG); s.dot(sx + 1, 26, ('vial_p', 3))
    else:
        s.ell('obsid', cx, 6 - 10, 0.1, 0.1)
        s.line('obsid', [(sx - 6, 20), (sx + 2, 84)], 2); s.ell('nightm', cx, 44, 7, 7); s.dots([(cx - 2, 42), (cx - 1, 41)], MAG); s.dot(cx, 44, WHITE)
    bob = (0, -1, -2, -1)[k] if atk is None else (0, -1, -1)[atk]
    if atk == 1:
        return s, {'body': (0, bob)}, chain(speckle(0.5, 21), fade(0.55), afterimages(18, '#3c1c5c', 0.25))
    return s, {'body': (0, bob)}, glow('#5c2e86', steps=((1, 120), (2, 60), (3, 24)) if atk is None else ((1, 170), (2, 90), (3, 40)))

major('sovereign', 'Shadow Sovereign', 'shadow', (96, 102), sovereign,
      'A towering cloaked ruler: the cloak holds a field of stars, a cracked white mask with magenta eyes, a crown of black spires and a long scepter.',
      'Phases in and out, casts zones of darkness, calls every shadow enemy and splits into four clones.',
      'Eclipse: the cloak spreads wide, the Sovereign fades into the dark, then hurls a darkness orb.',
      {'move': 220, 'attack': [380, 380, 420]}, 25, oy=0, floats=True)

def darkness_zone():
    out = []
    for k in range(3):
        a = canvas(96, 64)
        r = (14, 28, 36)[k]
        disc(a, 48, 34, r, R['obsid'][1], (200, 210, 190)[k], 0.6)
        disc(a, 48, 34, r * 0.7, R['obsid'][0], 220, 0.6)
        ring(a, 48, 34, r, 2, R['nightm'][3], 220, 0.6)
        rng = np.random.default_rng(k)
        for _ in range(8 + k * 6):
            ang = rng.random() * math.tau; rr = rng.random() * r * 0.9
            put(a, 48 + math.cos(ang) * rr, 34 + math.sin(ang) * rr * 0.6, MAG if rng.random() < 0.3 else WHITE, 200)
        out.append(a)
    return out

extra('sovereign', 'Darkness zone', 'Where the orb lands; inside it you can only see a small circle around you.', darkness_zone())

# ================================================================== VOID EMPEROR (round 30)

def emperor(view, f, var=None):
    s = new('emperor'); cx = 56
    k = int(f[1]); atk = k if f[0] == 'a' else None
    enrage = atk == 2
    trim = 'neonp' if enrage else 'neon'
    # halo behind
    for i in range(72):
        a = i * math.tau / 72 + k * 0.1
        x, y = cx + math.cos(a) * 22, 22 + math.sin(a) * 22
        s.dot(x, y, (trim, 3 if i % 6 else 4))
        if i % 12 == 0: s.dot(cx + math.cos(a) * 25, 22 + math.sin(a) * 25, (trim, 2))
    # cape of stars flowing into a vortex tail
    tail = (0, 2, 0, -2)[k] if atk is None else 0
    s.poly('obsid', [(cx - 18, 40), (cx - 36, 66), (cx - 44, 90), (cx - 34, 86), (cx - 30, 100), (cx - 20, 92), (cx - 12, 104), (cx - 4, 96),
                     (cx + tail, 109), (cx + 4, 96), (cx + 12, 104), (cx + 20, 92), (cx + 30, 100), (cx + 34, 86), (cx + 44, 90), (cx + 36, 66), (cx + 18, 40)])
    rng = np.random.default_rng(3)
    st = [(cx + rng.integers(-28, 29), rng.integers(46, 104)) for _ in range(46)]
    st += [(cx + rng.integers(-40, 41), rng.integers(70, 96)) for _ in range(20)]
    stars(s, [(x, y) for x, y in st if abs(x - cx) < (y - 36) * 0.9 and abs(x - cx) < 40], k)
    line_dots(s, [(cx - 36, 66), (cx - 44, 90)], (trim, 2)); line_dots(s, [(cx + 36, 66), (cx + 44, 90)], (trim, 2))
    # armored torso
    blob(s, 'void', [('poly', [(cx - 20, 34), (cx + 20, 34), (cx + 16, 62), (cx + 8, 72), (cx - 8, 72), (cx - 16, 62)])])
    for side in (-1, 1):
        blob(s, 'void', [('ell', cx + side * 22, 36, 9, 6), ('poly', [(cx + side * 16, 32), (cx + side * 30, 26), (cx + side * 28, 34)])])
        line_dots(s, [(cx + side * 15, 33), (cx + side * 29, 27)], (trim, 3))
    s.dots([(cx - 20, 33), (cx - 19, 32), (cx - 26, 32)], ('void', 4))
    line_dots(s, [(cx - 16, 62), (cx - 8, 72), (cx + 8, 72), (cx + 16, 62)], (trim, 2))
    # core: a small black hole
    core = 6 if atk == 0 else 5
    s.ell(trim, cx, 52, core + 1.5, core + 1.5)
    s.ell('black', cx, 52, core - 0.5, core - 0.5, flat=True)
    s.dots([(cx - 1, 51), (cx + 2, 53)], WHITE)
    # head: helm with visor and a three-pointed crown
    blob(s, 'obsid', [('ell', cx, 24, 9, 9), ('poly', [(cx - 9, 24), (cx - 7, 34), (cx + 7, 34), (cx + 9, 24)])])
    s.rect(trim, cx - 6, 24, cx + 6, 25)
    s.dots([(cx - 4, 24), (cx - 3, 24), (cx + 3, 24), (cx + 4, 24)], WHITE)
    s.dots([(cx - 7, 19), (cx - 6, 18), (cx - 5, 17)], ('obsid', 4))
    for dx, h in ((-6, 9), (0, 14), (6, 9)):
        s.poly('obsid', [(cx + dx - 2.5, 17), (cx + dx, 17 - h), (cx + dx + 2.5, 17)]); s.dot(cx + dx, 18 - h, (trim, 4))
    # arms: two armored gauntlets and two spirit arms
    reach = {None: 0, 0: 4, 1: -10, 2: -6}[atk]
    for side in (-1, 1):
        s.g('arm' + ('L' if side < 0 else 'R'))
        hxp, hy = cx + side * (34 + (6 if atk == 1 else 0)), 58 + reach
        blob(s, 'void', [('line', [(cx + side * 24, 40), (cx + side * 33, 50), (hxp, hy - 5)], 10), ('ell', hxp, hy, 8, 7)])
        line_dots(s, [(cx + side * 26, 42), (cx + side * 33, 51)], (trim, 2))
        s.dots([(hxp - 5, hy + 6), (hxp - 2, hy + 7), (hxp + 2, hy + 7), (hxp + 5, hy + 6)], (trim, 3))
        s.ell(trim, hxp, hy - 1, 2.6, 2.6); s.dot(hxp - 1, hy - 2, WHITE)
        s.g('spirit' + ('L' if side < 0 else 'R'))
        line_dots(s, [(cx + side * 18, 46), (cx + side * 26, 60), (cx + side * 24, 72)], (trim, 2))
        s.dots([(cx + side * 23, 73), (cx + side * 25, 74), (cx + side * 24, 75)], (trim, 4))
    s.g('body')
    # orbiting shards
    for i in range(6):
        a = i * math.tau / 6 + k * 0.26
        x, y = cx + math.cos(a) * 50, 62 + math.sin(a) * 16
        s.poly('void', [(x - 2, y + 1), (x, y - 3), (x + 2, y + 1), (x, y + 3)]); s.dot(x, y, (trim, 3))
    bob = (0, -1, -2, -1)[k] if atk is None else (0, -1, -2)[atk]
    pose = {'body': (0, bob), 'spiritL': (0, bob + (1 if k % 2 else 0)), 'spiritR': (0, bob - (1 if k % 2 else 0))}
    if enrage:
        return s, pose, chain(flash('#ff3060', 0.18), glow('#f070ff', steps=((1, 200), (2, 120), (3, 60), (4, 25))))
    if atk == 1:
        return s, pose, glow(R['neon'][3], steps=((1, 200), (2, 120), (3, 60), (4, 25)))
    return s, pose, glow(R['neon'][2], steps=((1, 130), (2, 60), (3, 24)))

major('emperor', 'Void Emperor', 'void', (112, 110), emperor,
      'The final boss: an obsidian emperor with a neon visor and three-pointed crown before a ring of light, a black hole for a heart, armored and spirit arms, and a star cape that pours into a vortex.',
      'Phase 1 summons Void Spawn; phase 2 splits the arena into platforms; phase 3 enrages with everything at once and opens Reality Tears, with 3 minutes before the arena collapses.',
      'Collapse: the core swells, both gauntlets fire a beam, then the enrage form turns pink.',
      {'move': 220, 'attack': [420, 320, 520]}, 30, oy=0, floats=True)

def void_beam():
    out = []
    for k in range(3):
        a = canvas(120, 24); L = (30, 90, 118)[k]
        for t in range(L):
            w = (2 if k == 0 else 5) + math.sin(t * 0.5) * (1 if k else 0)
            for o in range(-int(w), int(w) + 1):
                d = abs(o) / max(w, 1)
                c = WHITE if d < 0.3 else R['neon'][3] if d < 0.65 else R['neon'][2]
                put(a, 2 + t, 12 + o, c, 255 if t < L - 10 else 160)
        out.append(a)
    return out

def collapse_ring():
    out = []
    for k in range(3):
        a = canvas(128, 80); r = (56, 40, 22)[k]
        ring(a, 64, 42, r, 3, R['neonp'][3], 230, 0.6); ring(a, 64, 42, r - 3, 1, R['neonp'][4], 200, 0.6)
        for i in range(16):
            ang = i * math.tau / 16 + k * 0.4
            put(a, 64 + math.cos(ang) * (r + 4), 42 + math.sin(ang) * (r + 4) * 0.6, WHITE)
        out.append(a)
    return out

extra('emperor', 'Void beam', 'Fired from both gauntlets; points right, rotate to aim.', void_beam())
extra('emperor', 'Collapse ring', 'Phase 3: the edge of the arena closes in.', collapse_ring())
