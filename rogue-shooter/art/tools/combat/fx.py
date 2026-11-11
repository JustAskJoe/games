"""Pickups, general combat effects, hero hurt and death frames, and the dog companion."""
import os, sys, math, random
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'heroes'))
from weapons import poly, line, ground_ring, explosion, R, hx, WHITE, canvas, put, disc, ring, sparkle, outline, pil, Sprite, blob, line_dots
from ekit import EYE, glow
from heroes import HEROES, VIEWS, WALK
sys.path.insert(0, os.path.join(HERE, '..', 'ui'))

G = R['gold']

# ------------------------------------------------------------------ pickups

def coin_spin():
    out = []
    widths = (4, 3, 1, 3)
    for k, w in enumerate(widths):
        a = canvas(12, 14)
        disc(a, 6, 12, 3, (20, 30, 70), 60, 0.4)
        for y in range(2, 10):
            hw = w * math.sqrt(max(0, 1 - ((y - 6) / 4.2) ** 2))
            for x in range(int(6 - hw), int(6 + hw) + 1):
                c = G[4] if x < 6 - hw + 1 and k != 2 else G[3] if x < 6 else G[2]
                put(a, x, y, c)
        if w > 2: put(a, 6, 5, G[1]); put(a, 6, 6, G[1]); put(a, 6, 7, G[1])
        if k == 0: put(a, 4, 4, WHITE)
        out.append(pil(outline(a, '#5e3410')))
    return out

def gold_pile():
    out = []
    for k in range(2):
        a = canvas(18, 12)
        for x, y in ((5, 8), (9, 8), (13, 8), (7, 6), (11, 6), (9, 4)):
            disc(a, x, y, 2.5, G[2]); put(a, x - 1, y - 1, G[4])
        sparkle(a, (6, 12)[k], (4, 2)[k], G[4])
        out.append(pil(outline(a, '#5e3410')))
    return out

def gem(size, rmp, k):
    w, h = {'s': (4, 6), 'm': (5, 8), 'l': (7, 10)}[size]
    a = canvas(16, 18); cx = 8; top = 12 - h - (1 if k in (1, 2) else 0)
    disc(a, cx, 15, w * 0.8, (20, 30, 70), 60, 0.4)
    poly(a, [(cx, top), (cx + w, top + h * 0.45), (cx, top + h), (cx - w, top + h * 0.45)], rmp[2])
    poly(a, [(cx, top), (cx, top + h), (cx - w, top + h * 0.45)], rmp[3])
    put(a, cx - 1, top + 2, WHITE)
    if k == 1: sparkle(a, cx + w, top, rmp[4])
    return pil(outline(a))

def xp_gems():
    sets = [('Small XP gem', 's', R['teal']), ('XP gem', 'm', R['blue']), ('Big XP gem', 'l', R['robe'])]
    return [(n, [gem(sz, rmp, k) for k in range(4)]) for n, sz, rmp in sets]

def material_drops():
    from icons import MATERIALS
    out = []
    for name, fn in MATERIALS:
        icon = fn().render()
        frames = []
        for k in range(4):
            a = canvas(20, 22)
            disc(a, 10, 19, 5, (20, 30, 70), 70, 0.4)
            im = pil(a); dy = (0, -1, -2, -1)[k]
            im.alpha_composite(icon, (2, 1 + dy))
            if k == 2: arr = np.array(im); arr = outline(arr) if False else arr; im = pil(arr); sp = np.array(im); sparkle(sp, 15, 3, WHITE); im = pil(sp)
            frames.append(im)
        if name == 'Golem Core': frames = [glow('#7ee0f0', steps=((1, 90),))(f) for f in frames]
        out.append((name, frames))
    return out

# ------------------------------------------------------------------ effects

def spawn():
    out = []
    P = R['nightm']
    for k in range(5):
        a = canvas(36, 40); cx, gy = 18, 32
        ground_ring(a, cx, gy, 6 + k * 2 if k < 3 else 12, P[3], 230 if k < 4 else 120, 2)
        if k >= 1:
            for i in range(6):
                ang = i * math.tau / 6 + k * 0.3
                put(a, cx + math.cos(ang) * (8 + k), gy + math.sin(ang) * (4 + k * 0.5), P[4])
        if k >= 2:
            h = (0, 0, 14, 22, 26)[k]
            for i in range(10):
                y = gy - (i * h / 10); r = 3 + (i % 3) - (i / 10) * 2
                disc(a, cx + math.sin(i + k) * 2, y, max(1, r), P[2] if i % 2 else P[3], (210, 210, 140)[k - 2])
        out.append(pil(a))
    return out

def death_poof():
    out = []
    for k in range(5):
        a = canvas(32, 32); c = 16
        if k == 0:
            disc(a, c, c, 5, WHITE);
        else:
            r = 4 + k * 2.5
            for i in range(6):
                ang = i * math.tau / 6 + k * 0.4
                disc(a, c + math.cos(ang) * r, c + math.sin(ang) * r * 0.8, max(1.5, 4 - k * 0.6), (220, 220, 230) if k < 3 else (180, 180, 196), (255, 230, 190, 120)[k - 1])
            for i in range(4):
                ang = i * math.tau / 4 + 0.6 + k
                sparkle(a, c + math.cos(ang) * (r + 3), c + math.sin(ang) * (r + 3), G[4]) if k < 4 else None
        out.append(pil(outline(a) if k < 2 else a))
    return out

def boss_death():
    out = []
    for k in range(6):
        a = canvas(80, 80); c = 40
        if k < 3:
            for i in range(12):
                ang = i * math.tau / 12 + k * 0.2
                L = 10 + k * 10
                line(a, [(c, c), (c + math.cos(ang) * L, c + math.sin(ang) * L)], WHITE if i % 2 else G[4], 255 - k * 30, 2)
            disc(a, c, c, 6 + k * 3, WHITE)
        else:
            r = 20 + (k - 3) * 8
            ring(a, c, c, r, 3, G[4], (255, 200, 120)[k - 3]); ring(a, c, c, r - 6, 2, WHITE, (220, 160, 80)[k - 3])
            for i in range(10):
                ang = i * 0.63 + k
                sparkle(a, c + math.cos(ang) * (r + 4), c + math.sin(ang) * (r + 4), G[3])
        out.append(pil(a))
    return out

def hit_spark(big=False):
    out = []
    rmp = G if big else R['steel']
    for k in range(3):
        a = canvas(24 if big else 16, 24 if big else 16); c = 12 if big else 8
        L = ((4, 9, 6) if big else (3, 6, 4))[k]
        for i in range(8 if big else 4):
            ang = i * math.tau / (8 if big else 4) + (0.4 if big else 0.78)
            l = L if i % 2 == 0 else L * 0.6
            line(a, [(c, c), (c + math.cos(ang) * l, c + math.sin(ang) * l)], WHITE if k == 0 else rmp[4], 255 if k < 2 else 150)
        disc(a, c, c, (2, 1.5, 0)[k], WHITE)
        out.append(pil(a))
    return out

def heal_sparkle():
    out = []
    g = R['vial_g']
    for k in range(5):
        a = canvas(32, 40)
        for i, (x, y0) in enumerate(((10, 30), (20, 34), (15, 24), (24, 26))):
            y = y0 - k * 4 - (i % 2) * 2
            if y < 2: continue
            al = 255 if k < 3 else 150
            for d in (-1, 0, 1): put(a, x + d, y, g[3], al); put(a, x, y + d, g[3], al)
            put(a, x, y, WHITE, al)
        ground_ring(a, 16, 34, 10, g[3], 160 - k * 25)
        out.append(pil(a))
    return out

def level_up():
    out = []
    for k in range(6):
        a = canvas(72, 96); cx, gy = 36, 84
        if k < 4:
            w = (6, 12, 14, 10)[k]
            for y in range(int(gy - (40, 70, 88, 92)[k]), gy):
                for x in range(-w, w + 1):
                    d = abs(x) / w
                    if d > 0.9 and (y + x) % 3: continue
                    put(a, cx + x, y, WHITE if d < 0.25 else G[4] if d < 0.6 else G[3], (200, 160, 130, 90)[k])
        ground_ring(a, cx, gy, 10 + k * 5, G[4], 255 - k * 30, 2)
        for i in range(8):
            ang = i * math.tau / 8 + k * 0.5
            y = gy - 10 - k * 10 - (i % 3) * 6
            if y > 4: sparkle(a, cx + math.cos(ang) * (12 + k * 2), y, G[4])
        out.append(pil(a))
    return out

def dash_dust():
    out = []
    for k in range(4):
        a = canvas(28, 14)
        for i in range(3):
            x = 6 + i * 6 - k * 2; r = 2 + k * 0.6 - i * 0.3
            disc(a, x, 9 - (i % 2), max(1, r), (214, 192, 150), 230 - k * 50)
        out.append(pil(a))
    return out

# ------------------------------------------------------------------ hero hurt and death

def shear(im, k):
    """Lean a sprite by shifting each row sideways in whole pixels (keeps the pixels crisp)."""
    a = np.array(im); out = np.zeros_like(a); H = a.shape[0]
    for y in range(H):
        s = int(round((H - 1 - y) * k))
        if s >= 0: out[y, s:] = a[y, :a.shape[1] - s]
        else: out[y, :s] = a[y, -s:]
    return Image.fromarray(out, 'RGBA')

def place(im, w=56, h=48, x=None, y=None):
    o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.alpha_composite(im, ((w - im.width) // 2 if x is None else x, (h - im.height) if y is None else y)); return o

def tint(im, col, k):
    a = np.array(im).copy(); m = a[..., 3] > 0; a[m, :3] = (a[m, :3] * (1 - k) + np.array(col) * k).astype(np.uint8); return Image.fromarray(a, 'RGBA')

def fadeout(im, k):
    a = np.array(im).copy(); a[..., 3] = (a[..., 3] * k).astype(np.uint8); return Image.fromarray(a, 'RGBA')

HURT_POSE = {'front': {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0), 'armL': (-1, -2), 'armR': (1, -2)},
             'side': {'body': (-2, 0), 'legF': (-1, 0), 'legB': (0, 0), 'armF': (-3, -1)},
             'back': {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0), 'armL': (-1, -1), 'armR': (1, -1)}}

def hurt(hero, view):
    im = HEROES[hero](view).render(HURT_POSE[view])
    lean = {'front': 0, 'side': -0.12, 'back': 0}[view]
    return place(shear(im, lean) if lean else im, 48, 48)

def death(hero):
    fn = HEROES[hero]
    idle = fn('front').render()
    kneel = fn('front').render({'body': (0, 4), 'legL': (0, 0), 'legR': (0, 0), 'armL': (-1, 3), 'armR': (1, 3)})
    f0 = place(shear(fn('front').render(HURT_POSE['front']), 0.1), 56, 48)
    f1 = place(shear(kneel, 0.25), 56, 48)
    lying = idle.rotate(-90, expand=True)
    f2 = place(lying, 56, 48, x=6, y=48 - lying.height)
    f3 = fadeout(tint(f2, (255, 255, 255), 0.35), 0.65)
    a = np.array(f3)
    for i, (x, y) in enumerate(((22, 20), (28, 14), (32, 8), (26, 4))): sparkle(a, x + (i % 2) * 3, y, G[4])
    f3 = pil(a)
    f4 = fadeout(f2, 0.0)
    a = np.array(f4); ground_ring(a, 28, 40, 12, G[3], 140)
    for x, y in ((26, 10), (30, 2)): sparkle(a, x, y, G[4])
    return [f0, f1, f2, f3, pil(a)]

# ------------------------------------------------------------------ dog companion

R['dogf'] = R.get('dogf') or __import__('ekit').ramp('#2a1608', '#5a3014', '#8e5426', '#bc7e40', '#e0aa66')
R['dogear'] = __import__('ekit').ramp('#1e0e04', '#3e200c', '#5e3416', '#7a4620', '#94582a')

def dog(view, f):
    s = Sprite(32, 28, 2)
    atk = int(f[1]) if f[0] == 'a' else None
    ko = f == 'ko'
    if view == 'side':
        s.g('legB'); s.rect('dogf', 8, 17, 9, 22); s.rect('dogf', 20, 17, 21, 22)
        s.g('body')
        s.poly('dogf', [(6, 12), (2, 7), (3, 11), (6, 15)])
        blob(s, 'dogf', [('ell', 14, 14, 8, 4.5)])
        blob(s, 'cream', [('ell', 15, 17, 5, 1.6)])
        s.g('legF'); s.rect('dogf', 10, 17, 12, 23); s.ell('dogf', 11.5, 23, 2, 1); s.rect('dogf', 18, 17, 20, 23); s.ell('dogf', 19.5, 23, 2, 1)
        s.g('head')
        blob(s, 'dogf', [('ell', 23, 9, 4.5, 4), ('poly', [(25, 8), (30, 10), (30, 12), (25, 13)])])
        blob(s, 'dogf', [('poly', [(20, 6), (22, 5), (22, 13), (19, 11)])])
        s.dots([(30, 10)], EYE); s.dot(25, 8, EYE if not ko else R['dogf'][0]); s.dot(24, 8, WHITE if not ko else R['dogf'][1])
        s.rect('red', 20, 12, 22, 13); s.dot(21, 14, ('gold', 4))
        if atk == 1: s.dots([(27, 13), (29, 13)], WHITE); s.dot(28, 14, ('red', 1))
        s.g('body')
        if f[0] == 'm': pose = [{'legF': (1, 0), 'legB': (-1, 0), 'head': (0, 0)}, {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0)}, {'legF': (-1, 0), 'legB': (1, 0), 'head': (0, 1)}, {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0)}][int(f[1])]
        elif atk is not None: pose = [{'body': (-1, 1), 'head': (-1, 2), 'legF': (0, 0), 'legB': (0, 0)}, {'body': (3, -1), 'head': (4, -1), 'legF': (4, -1), 'legB': (1, 0)}, {'body': (1, 0), 'head': (1, 0), 'legF': (1, 0), 'legB': (0, 0)}][atk]
        else: pose = None
        im = s.render(pose)
    else:
        front = view == 'front'
        if front:
            s.g('legR'); s.rect('dogf', 11, 17, 12, 22)
            s.g('legL'); s.rect('dogf', 19, 17, 20, 22)
            s.g('body'); blob(s, 'dogf', [('ell', 16, 16, 6, 5)])
            blob(s, 'cream', [('ell', 16, 18, 3, 3)])
            s.g('legL'); s.rect('dogf', 12, 18, 14, 24); s.ell('dogf', 13, 24, 2, 1)
            s.g('legR'); s.rect('dogf', 18, 18, 20, 24); s.ell('dogf', 19, 24, 2, 1)
            s.g('head')
            s.ell('dogf', 16, 8, 5, 4.5)
            blob(s, 'dogear', [('poly', [(11, 4), (13, 5), (12, 13), (10, 14), (9, 11)])])
            blob(s, 'dogear', [('poly', [(21, 4), (19, 5), (20, 13), (22, 14), (23, 11)])])
            s.ell('cream', 16, 11, 3, 2.4)
            s.dots([(15, 10), (16, 10), (17, 10), (16, 11)], EYE)
            eye = EYE if not ko else R['dogf'][0]
            s.dots([(13, 7), (19, 7)], eye); s.dots([(13, 6), (19, 6)], WHITE if not ko else R['dogf'][2])
            if atk == 1: s.dots([(15, 13), (17, 13)], WHITE); s.dot(16, 13, ('red', 1))
            s.rect('red', 12, 12, 20, 13); s.dot(16, 14, ('gold', 4))
        else:
            s.g('legL'); s.rect('dogear', 11, 20, 13, 24); s.ell('dogear', 12, 24, 2, 1)
            s.g('legR'); s.rect('dogear', 19, 20, 21, 24); s.ell('dogear', 20, 24, 2, 1)
            s.g('head')
            s.ell('dogf', 16, 7, 4.5, 4)
            blob(s, 'dogear', [('poly', [(12, 4), (14, 5), (13, 12), (11, 12), (10, 9)])])
            blob(s, 'dogear', [('poly', [(20, 4), (18, 5), (19, 12), (21, 12), (22, 9)])])
            s.rect('red', 12, 11, 20, 12)
            s.g('body'); blob(s, 'dogf', [('ell', 16, 17, 6.5, 5.5)])
            s.dot(16, 13, ('dogf', 2)); s.dot(16, 14, ('dogf', 2))
            s.g('tail'); blob(s, 'dogf', [('poly', [(15, 14), (18, 14), (24, 9), (24, 6), (21, 9)])]); s.dot(23, 7, ('dogf', 4))
        s.g('body')
        if f[0] == 'm': pose = [{'legL': (0, -1)}, {'body': (0, -1), 'head': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'legR': (0, -1)}, {'body': (0, -1), 'head': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}][int(f[1])]
        elif atk is not None: pose = [{'body': (0, 1), 'head': (0, 2), 'legL': (0, 0), 'legR': (0, 0)}, {'body': (0, -2 if front else 2), 'head': (0, -3 if front else 1), 'legL': (0, -1), 'legR': (0, -1)}, {}][atk]
        else: pose = None
        if not front:
            pose = dict(pose or {}); b = pose.get('body', (0, 0))
            pose['tail'] = (b[0] + ((1, 0, -1, 0)[int(f[1])] if f[0] == 'm' else 0), b[1])
        im = s.render(pose)
    if ko:
        im = im.rotate(-90 if view != 'side' else 0, expand=False)
        a = np.array(im); a = a
        im = pil(a)
        a = np.array(place(im, 32, 30));
        for x in (10, 16, 22): sparkle(a, x, 3, G[4])
        return pil(a)
    return im

def dog_frames():
    out = []
    for v in VIEWS:
        out.append((f'Dog walk · {v}', [dog(v, f'm{k}') for k in range(4)], 110))
        out.append((f'Dog bite · {v}', [dog(v, f'a{k}') for k in range(3)], [180, 120, 200]))
    out.append(('Dog knocked out', [dog('side', 'ko')], 400))
    return out
