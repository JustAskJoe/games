"""In-fight art for the five Forge weapons and their ten evolutions, drawn pixel-crisp in each
weapon's own color (art direction: Orbital Blades gold, Chain Lightning yellow, Fire Trail
orange-red, Frost Nova ice blue, Homing Missiles copper). Each function returns a list of RGBA frames."""
import os, sys, math, random
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'enemies'))
from ekit import R, ramp, hx, WHITE, canvas, put, disc, ring, sparkle, outline, pil, Sprite, blob, line_dots

R.update({
    'copper': ramp('#3a1a0a', '#6e3416', '#a85a2a', '#d88a4a', '#f4c08a'),
    'ice':    ramp('#1e4660', '#3a7090', '#68a6c4', '#a0d6ea', '#e0f8ff'),
    'yel':    ramp('#5a4000', '#a07a00', '#e0b810', '#ffe040', '#fffac0'),
    'hell':   ramp('#1a0410', '#4a0a1a', '#8e1420', '#d03a1c', '#ff8a3a'),
    'phant':  ramp('#2a1046', '#4a2486', '#7a4ac8', '#b48af0', '#ecdcff'),
})
G, Y, O, I, C = R['gold'], R['yel'], R['ember'], R['ice'], R['copper']

def poly(a, pts, col, al=255):
    m = Image.new('L', (a.shape[1], a.shape[0]), 0); ImageDraw.Draw(m).polygon([(round(x), round(y)) for x, y in pts], fill=255)
    ys, xs = np.nonzero(np.array(m))
    for y, x in zip(ys, xs): put(a, x, y, col, al)

def line(a, pts, col, al=255, w=1):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(max(abs(x1 - x0), abs(y1 - y0))))
        for i in range(n + 1):
            x, y = x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n
            for dx in range(w):
                for dy in range(w): put(a, x + dx - w // 2, y + dy - w // 2, col, al)

def ground_ring(a, cx, cy, r, col, al=255, w=1, sq=0.55):
    ring(a, cx, cy, r, w, col, al, sq)

def hero_dot(a, cx, cy):
    """A faint marker for where the hero stands, so the effect reads in context."""
    disc(a, cx, cy + 2, 4, (20, 30, 70), 70, 0.4)

# ------------------------------------------------------------------ ORBITAL BLADES (gold)

def blade(a, cx, cy, ang, rmp, al=255, L=11):
    tip = (cx + math.cos(ang) * L, cy + math.sin(ang) * L * 0.8)
    back = ang + 2.4
    pts = [(cx + math.cos(ang + 1.4) * 3.5, cy + math.sin(ang + 1.4) * 2.8), tip,
           (cx + math.cos(ang - 0.45) * 6, cy + math.sin(ang - 0.45) * 4.8), (cx + math.cos(back) * 5, cy + math.sin(back) * 4)]
    poly(a, pts, rmp[2], al)
    line(a, [(cx, cy), tip], rmp[4], al)
    poly(a, [(cx + math.cos(ang - 0.45) * 6, cy + math.sin(ang - 0.45) * 4.8), tip, (cx + math.cos(ang - 0.2) * 4, cy + math.sin(ang - 0.2) * 3.2)], rmp[1], al)
    put(a, *tip, WHITE, al); disc(a, cx, cy, 1.2, rmp[1], al)

def orbital_blades(n=8):
    out = []
    for k in range(n):
        a = canvas(84, 64); cx, cy = 42, 30; hero_dot(a, cx, cy + 12)
        ground_ring(a, cx, cy + 12, 28, G[1], 60)
        for i in range(3):
            t = k / n * math.tau + i * math.tau / 3
            bx, by = cx + math.cos(t) * 28, cy + math.sin(t) * 16
            blade(a, bx, by, t * 3, G)
        out.append(pil(outline(a, '#5e3410')))
    return out

def sawblade_tornado(n=8):
    out = []
    for k in range(n):
        a = canvas(84, 64); cx, cy = 42, 32; hero_dot(a, cx, cy + 12)
        for j in range(18):
            t = j * 0.7 + k * 0.5; r = 10 + (j * 7) % 26
            line(a, [(cx + math.cos(t) * r, cy + 4 + math.sin(t) * r * 0.5), (cx + math.cos(t + .4) * r, cy + 4 + math.sin(t + .4) * r * 0.5)], R['stone'][3], 120)
        for i in range(6):
            r = 16 if i % 2 else 28
            t = k / n * math.tau * (1.5 if i % 2 else 1) + i * math.tau / 6
            sx, sy = cx + math.cos(t) * r, cy + math.sin(t) * r * 0.55
            disc(a, sx, sy, 4.5, G[2]); disc(a, sx, sy, 2.5, R['steel'][3]); put(a, sx, sy, R['steel'][1])
            for tt in range(8):
                ang = tt * math.pi / 4 + k * 0.6
                put(a, sx + math.cos(ang) * 5.5, sy + math.sin(ang) * 5.5, G[4])
        out.append(pil(outline(a, '#5e3410')))
    return out

def phantom_edge(n=8):
    out = []
    P = R['phant']
    for k in range(n):
        a = canvas(84, 64); cx, cy = 42, 30; hero_dot(a, cx, cy + 12)
        for i in range(3):
            for trail in (3, 2, 1, 0):
                t = (k - trail * 0.35) / n * math.tau + i * math.tau / 3
                bx, by = cx + math.cos(t) * 28, cy + math.sin(t) * 16
                blade(a, bx, by, t * 3, P, (60, 100, 150, 255)[3 - trail])
        if k % 3 == 0:
            t = k / n * math.tau
            sparkle(a, cx + math.cos(t) * 32, cy + math.sin(t) * 20, P[4])
        out.append(pil(outline(a, '#2a1046')))
    return out

# ------------------------------------------------------------------ CHAIN LIGHTNING (yellow)

def bolt_path(rng, p0, p1, jag=4, seg=6):
    (x0, y0), (x1, y1) = p0, p1
    n = max(2, int(math.hypot(x1 - x0, y1 - y0) / seg))
    pts = [p0]
    for i in range(1, n):
        t = i / n
        nx, ny = -(y1 - y0), (x1 - x0); L = math.hypot(nx, ny) or 1
        off = rng.uniform(-jag, jag)
        pts.append((x0 + (x1 - x0) * t + nx / L * off, y0 + (y1 - y0) * t + ny / L * off))
    return pts + [p1]

def zap(a, pts, rmp, glow=True):
    if glow:
        line(a, pts, rmp[2], 110, 3)
    line(a, pts, rmp[3], 255, 2)
    line(a, pts, WHITE, 255, 1)

def chain_lightning(n=4):
    out = []
    targets = [(14, 22), (50, 12), (82, 26)]
    for k in range(n):
        rng = random.Random(k * 7 + 1)
        a = canvas(96, 40)
        chain = [(4, 34)] + targets
        for p0, p1 in zip(chain, chain[1:]): zap(a, bolt_path(rng, p0, p1), Y)
        for x, y in targets:
            for d in range(4):
                ang = rng.random() * math.tau
                line(a, [(x, y), (x + math.cos(ang) * 4, y + math.sin(ang) * 4)], Y[4])
            put(a, x, y, WHITE)
        out.append(pil(a))
    return out

def judgement(n=5):
    out = []
    for k in range(n):
        a = canvas(56, 104); cx, gy = 28, 92
        if k == 0:
            ground_ring(a, cx, gy, 14, G[3], 230, 2)
            for i in range(6): put(a, cx + math.cos(i) * 18, gy + math.sin(i) * 9, G[4])
        else:
            w = (0, 3, 7, 6, 3)[k]
            for y in range(0, gy):
                ww = w + (1 if (y // 4 + k) % 3 == 0 else 0)
                for x in range(-ww, ww + 1):
                    d = abs(x) / max(ww, 1)
                    put(a, cx + x, y, WHITE if d < 0.35 else G[4] if d < 0.7 else G[3], 255 if k < 4 else 170)
            disc(a, cx, gy, (8, 14, 18, 20)[k - 1], G[4], (255, 230, 170, 110)[k - 1], 0.45)
            disc(a, cx, gy, (4, 8, 10, 10)[k - 1], WHITE, (255, 230, 170, 90)[k - 1], 0.45)
            for i in range(10):
                ang = i * math.tau / 10 + k
                put(a, cx + math.cos(ang) * (16 + k * 3), gy + math.sin(ang) * (8 + k), G[4])
        out.append(pil(a))
    return out

def storm_cage(n=6):
    out = []
    for k in range(n):
        rng = random.Random(30 + k)
        a = canvas(96, 64); cx, cy = 48, 36; hero_dot(a, cx, cy)
        pts = [(cx + math.cos(t) * 40, cy + math.sin(t) * 22) for t in [i * math.tau / 16 for i in range(17)]]
        jag = []
        for p0, p1 in zip(pts, pts[1:]): jag += bolt_path(rng, p0, p1, 2.5, 5)[:-1]
        zap(a, jag + [pts[0]], Y)
        for i in range(4):
            t = rng.random() * math.tau
            p0 = (cx + math.cos(t) * 40, cy + math.sin(t) * 22); p1 = (cx + math.cos(t) * 26, cy - 22 + math.sin(t) * 6)
            zap(a, bolt_path(rng, p0, p1, 3, 5), Y, False)
        out.append(pil(a))
    return out

# ------------------------------------------------------------------ FIRE TRAIL (orange-red)

def flames(a, x0, y0, w, h, k, rmp, al=255, n=5):
    disc(a, x0 + w / 2, y0, w / 2 + 1, rmp[1], int(al * 0.75), 0.4)
    for i in range(n):
        x = x0 + 1 + i * (w - 2) / max(1, n - 1)
        hh = max(2, int(h * (0.55 + 0.45 * math.sin(i * 2.1 + k * 1.7) ** 2)))
        for t in range(hh):
            c = rmp[4] if t < 1 else rmp[3] if t < hh * 0.5 else rmp[2]
            put(a, x, y0 - t, c, al);
            if t < hh - 2: put(a, x + 1, y0 - t, rmp[2], al)
        put(a, x, y0 - hh, rmp[2], al // 2)

def fire_trail(n=4):
    out = []
    for k in range(n):
        a = canvas(100, 28)
        for j, (x, age) in enumerate(((6, 3), (28, 2), (50, 1), (72, 0))):
            al = (255, 230, 180, 110)[age]; h = (9, 8, 6, 4)[age]
            flames(a, x, 22, 18, h, k + j, O, al)
        out.append(pil(a))
    return out

def hellfire(n=4):
    out = []
    for k in range(n):
        a = canvas(100, 36)
        for j, (x, age) in enumerate(((4, 3), (28, 2), (52, 1), (76, 0))):
            al = (255, 235, 190, 120)[age]; h = (16, 14, 11, 7)[age]
            flames(a, x, 30, 20, h, k + j, R['hell'], al, 6)
            if age < 2: put(a, x + 9, 30 - h - 2, R['hell'][4]); put(a, x + 11, 30 - h - 4, R['hell'][3])
        out.append(pil(a))
    return out

def ember_swarm(n=6):
    out = []
    for k in range(n):
        a = canvas(72, 52); cx, cy = 36, 28; hero_dot(a, cx, cy + 8)
        for i in range(7):
            t = k / n * math.tau + i * math.tau / 7
            r = 14 + (i % 3) * 6
            x, y = cx + math.cos(t) * r, cy + math.sin(t) * r * 0.6
            for tr in range(4):
                tt = t - tr * 0.18
                put(a, cx + math.cos(tt) * r, cy + math.sin(tt) * r * 0.6, O[3 - min(tr, 2)], 255 - tr * 55)
            disc(a, x, y, 1.6, O[3]); put(a, x - 1, y - 1, O[4]); put(a, x, y, WHITE)
        out.append(pil(a))
    return out

# ------------------------------------------------------------------ FROST NOVA (ice blue)

def frost_nova(n=5):
    out = []
    for k in range(n):
        a = canvas(100, 64); cx, cy = 50, 34; hero_dot(a, cx, cy)
        if k < 4:
            r = (8, 20, 32, 42)[k]
            disc(a, cx, cy, r, I[3], (110, 80, 50, 25)[k], 0.55)
            ground_ring(a, cx, cy, r, I[4], 255 if k < 3 else 160, 2)
            for i in range(12):
                ang = i * math.tau / 12 + k * 0.1
                x, y = cx + math.cos(ang) * r, cy + math.sin(ang) * r * 0.55
                line(a, [(x, y), (x + math.cos(ang) * 3, y + math.sin(ang) * 2 - 3)], I[4], 255 if k < 3 else 140)
                put(a, x + math.cos(ang) * 3, y + math.sin(ang) * 2 - 4, WHITE)
        else:
            disc(a, cx, cy, 30, I[2], 70, 0.55)
            for i in range(14):
                ang = i * 2.3; rr = 6 + (i * 5) % 26
                put(a, cx + math.cos(ang) * rr, cy + math.sin(ang) * rr * 0.55, WHITE, 180)
        out.append(pil(a))
    return out

def ice_patch(n=3):
    out = []
    for k in range(n):
        a = canvas(44, 22)
        disc(a, 22, 12, 19, I[2], 150, 0.45); disc(a, 21, 11, 15, I[3], 120, 0.45)
        for x, y, h in ((10, 13, 4), (18, 9, 5), (28, 12, 4), (34, 14, 3), (22, 16, 3)):
            for t in range(h): put(a, x, y - t, I[4] if t else I[3])
            put(a, x - 1, y, I[2]); put(a, x + 1, y, I[2])
        sparkle(a, (12, 26, 32)[k], (8, 10, 7)[k], I[4])
        out.append(pil(a))
    return out

def absolute_zero(n=5):
    out = []
    rng = random.Random(5)
    spikes = [(rng.uniform(0, math.tau), rng.uniform(0.35, 1.0)) for _ in range(22)]
    for k in range(n):
        a = canvas(120, 76); cx, cy = 60, 42; hero_dot(a, cx, cy)
        R0 = (14, 30, 46, 54, 54)[k]
        disc(a, cx, cy, R0, I[1], (120, 100, 80, 60, 40)[k], 0.55); disc(a, cx, cy, R0 * 0.8, I[3], (90, 80, 60, 40, 20)[k], 0.55)
        ground_ring(a, cx, cy, R0, WHITE, 230 if k < 4 else 120, 2)
        for ang, rf in spikes:
            if rf * 54 > R0: continue
            x, y = cx + math.cos(ang) * rf * 50, cy + math.sin(ang) * rf * 50 * 0.55
            h = 6 + int(rf * 6) - (2 if k == 4 else 0)
            poly(a, [(x - 2, y), (x, y - h), (x + 2, y)], I[3], 255 if k < 4 else 170)
            line(a, [(x - 1, y - 1), (x, y - h + 1)], I[4]); put(a, x, y - h, WHITE)
        for i in range(16):
            t = i * 1.7 + k * 0.4; rr = 10 + (i * 11) % 44
            put(a, cx + math.cos(t) * rr, cy - 10 + math.sin(t) * rr * 0.4, WHITE, 200)
        out.append(pil(outline(a, '#1e4660')))
    return out

def glacial_tomb(n=4):
    out = []
    for k in range(n):
        s = Sprite(40, 44, 0)
        if k < 3:
            # slime silhouette inside
            s.ell('sl_caverns', 20, 33, 8, 6, flat=True)
            h = (12, 30, 34)[k]
            blob(s, 'ice', [('poly', [(8, 40), (8, 40 - h + 6), (13, 40 - h), (27, 40 - h + 2), (32, 40 - h + 8), (32, 40)])])
            if k > 0:
                s.ell('sl_caverns', 20, 31, 7, 5, flat=True)
                s.dots([(17, 30), (22, 30)], R['ice'][4])
            line_dots(s, [(11, 38), (11, 40 - h + 7)], ('ice', 4)); line_dots(s, [(14, 40 - h + 1), (26, 40 - h + 3)], ('ice', 4))
            if k == 2: line_dots(s, [(15, 18), (19, 26), (17, 34)], ('ice', 0)); line_dots(s, [(25, 14), (23, 24)], ('ice', 0))
            im = s.render()
            a = np.array(im).copy(); m = a[..., 3] > 0
            if k > 0: a[m, 3] = 235
            out.append(pil(a))
        else:
            a = canvas(40, 44)
            for i in range(10):
                ang = i * 0.63; r = 8 + (i % 3) * 5
                poly(a, [(20 + math.cos(ang) * r, 30 + math.sin(ang) * r * 0.6), (22 + math.cos(ang) * (r + 4), 27 + math.sin(ang) * (r + 4) * 0.6), (21 + math.cos(ang) * r, 33)], I[3])
            for i in range(8): put(a, 20 + math.cos(i) * 16, 28 + math.sin(i) * 9, WHITE)
            out.append(pil(outline(a, '#1e4660')))
    return out

# ------------------------------------------------------------------ HOMING MISSILES (copper)

def missile(k):
    a = canvas(22, 10)
    poly(a, [(4, 3), (15, 3), (19, 5), (15, 7), (4, 7)], C[2])
    line(a, [(5, 4), (15, 4)], C[4]); line(a, [(5, 6), (15, 6)], C[1])
    poly(a, [(17, 4), (20, 5), (17, 6)], R['red'][3]); put(a, 19, 5, R['red'][4])
    poly(a, [(4, 1), (8, 3), (4, 3)], C[1]); poly(a, [(4, 9), (8, 7), (4, 7)], C[1])
    fl = (3, 4)[k]
    for t in range(fl): put(a, 3 - t, 5, O[4 if t == 0 else 3 if t < 2 else 2]); put(a, 3 - t, 4 + (t % 2), O[2], 180)
    return outline(a, '#3a1a0a')

def homing_missiles(n=6):
    out = []
    for k in range(n):
        a = canvas(96, 40)
        path = [(4 + t * 14, 30 - math.sin(t * 0.55) * 18) for t in range(7)]
        idx = k
        for j in range(idx):
            x, y = path[j]; age = idx - j
            disc(a, x, y, 2 + age * 0.4, R['stone'][3], max(40, 200 - age * 35))
        x, y = path[idx]
        m = pil(missile(k % 2))
        ang = math.degrees(math.atan2(-(path[min(idx + 1, 6)][1] - y), path[min(idx + 1, 6)][0] - x))
        m = m.rotate(round(ang / 45) * 45, expand=True, resample=Image.NEAREST)
        im = pil(a); im.alpha_composite(m, (int(x - m.width / 2), int(y - m.height / 2)))
        out.append(im)
    return out

def explosion(n=4, r0=14, size=40):
    out = []
    for k in range(n):
        a = canvas(size, size); c = size / 2
        if k == 0:
            disc(a, c, c, r0 * 0.4, WHITE); disc(a, c, c, r0 * 0.6, O[4], 200)
        else:
            r = r0 * (0.6 + 0.25 * k)
            disc(a, c, c, r, O[2], (255, 220, 140)[k - 1]); disc(a, c - 1, c - 1, r * 0.7, O[3], (255, 200, 110)[k - 1]); disc(a, c - 2, c - 2, r * 0.35, O[4], (255, 160, 60)[k - 1])
            for i in range(8):
                ang = i * math.tau / 8 + k
                disc(a, c + math.cos(ang) * (r + 2), c + math.sin(ang) * (r + 2), 2, R['stone'][2], (200, 160, 90)[k - 1])
        out.append(pil(outline(a) if k < 2 else a))
    return out

def missile_barrage(n=6):
    out = []
    for k in range(n):
        im = Image.new('RGBA', (90, 56), (0, 0, 0, 0))
        a = canvas(90, 56)
        for i in range(6):
            ang = -60 + i * 24
            r = 8 + k * 7
            x, y = 12 + math.cos(math.radians(ang)) * r, 28 + math.sin(math.radians(ang)) * r * 0.9
            for t in range(1, 4): disc(a, x - math.cos(math.radians(ang)) * t * 4, y - math.sin(math.radians(ang)) * t * 4, 1.4, R['stone'][3], 160 - t * 40)
        im = pil(a)
        for i in range(6):
            ang = -60 + i * 24; r = 8 + k * 7
            x, y = 12 + math.cos(math.radians(ang)) * r, 28 + math.sin(math.radians(ang)) * r * 0.9
            m = pil(missile(k % 2)).resize((11, 5), Image.NEAREST) if False else pil(missile(k % 2))
            m = m.rotate(-round(ang / 45) * 45, expand=True, resample=Image.NEAREST)
            im.alpha_composite(m, (int(x - m.width / 2), int(y - m.height / 2)))
        out.append(im)
    return out

def orbital_cannon(n=5):
    out = []
    for k in range(n):
        a = canvas(56, 104); cx, gy = 28, 90
        rc = R['red']
        if k < 2:
            ground_ring(a, cx, gy, 14 - k * 3, rc[3], 255, 2); ground_ring(a, cx, gy, 6, rc[4], 220)
            for dx in (-18 + k * 3, 18 - k * 3): line(a, [(cx + dx, gy), (cx + dx * 0.6, gy)], rc[4])
            line(a, [(cx, gy - 10 + k * 2), (cx, gy - 6)], rc[4]); line(a, [(cx, gy + 4), (cx, gy + 7 - k)], rc[4])
        else:
            w = (6, 9, 4)[k - 2]
            for y in range(0, gy):
                for x in range(-w, w + 1):
                    d = abs(x) / w
                    put(a, cx + x, y, WHITE if d < 0.3 else C[4] if d < 0.6 else C[3] if d < 0.85 else R['red'][3], 255 if k < 4 else 180)
            disc(a, cx, gy, (16, 22, 18)[k - 2], C[3], (240, 200, 120)[k - 2], 0.45); disc(a, cx, gy, (8, 12, 8)[k - 2], WHITE, (240, 200, 100)[k - 2], 0.45)
        out.append(pil(a))
    return out

WEAPONS = [
    ('Orbital Blades', 'gold', [('Orbital Blades', orbital_blades, 'Three golden blades circle you.', 90),
                                ('Sawblade Tornado', sawblade_tornado, 'Evolution (Speed 155+): six spinning saws on two rings in a whirlwind.', 80),
                                ('Phantom Edge', phantom_edge, 'Alt evolution (Crit 25%+): ghostly violet blades with afterimages that flash on crits.', 90)]),
    ('Chain Lightning', 'yellow', [('Chain Lightning', chain_lightning, 'A bolt jumps from target to target.', 70),
                                   ('Judgement', judgement, 'Evolution (Crit 20%+): a pillar of light slams down on the target after a ground warning.', [260, 80, 80, 120, 160]),
                                   ('Storm Cage', storm_cage, 'Alt evolution (Armor 25%+): a ring of lightning crackles around you.', 70)]),
    ('Fire Trail', 'orange-red', [('Fire Trail', fire_trail, 'Flames left on the ground behind you, fading from new (right) to old (left).', 110),
                                  ('Hellfire', hellfire, 'Evolution (Power 130+): taller, darker hellflames.', 110),
                                  ('Ember Swarm', ember_swarm, 'Alt evolution (Speed 160+): embers that swirl out and home in.', 80)]),
    ('Frost Nova', 'ice blue', [('Frost Nova', frost_nova, 'An icy ring bursts out and slows what it hits.', [80, 80, 90, 110, 200]),
                                ('Frost patch', ice_patch, 'The frozen ground the nova leaves behind.', 260),
                                ('Absolute Zero', absolute_zero, 'Evolution (Armor 30%+): a huge freezing burst with ice spikes.', [90, 90, 100, 140, 240]),
                                ('Glacial Tomb', glacial_tomb, 'Alt evolution (Power 135+): enemies freeze solid, then shatter.', [160, 160, 500, 200])]),
    ('Homing Missiles', 'copper', [('Homing Missiles', homing_missiles, 'A copper missile curves to its target, trailing smoke.', 90),
                                   ('Missile hit', lambda: explosion(4, 12, 36), 'Each missile explodes on impact.', 90),
                                   ('Missile Barrage', missile_barrage, 'Evolution (Multi Shot 3+): a fan of six missiles.', 90),
                                   ('Orbital Cannon', orbital_cannon, 'Alt evolution (Crit 20%+): a red target lock, then a beam from the sky.', [220, 220, 80, 120, 160])]),
]
