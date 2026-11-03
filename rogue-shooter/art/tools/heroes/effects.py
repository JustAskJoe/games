"""Attack effects for the five heroes, drawn pixel-crisp on a 96x88 effect canvas.

The hero's 32x44 canvas sits at OFFSET inside it. Each function returns (behind, front):
two RGBA layers drawn under and over the hero. Directions: front = facing down,
side = facing right, back = facing up.
"""
import math, random
import numpy as np
from PIL import Image
from spritekit import R, hx

EW, EH = 96, 88
OFFSET = (32, 24)
CHEST = (48, 52)       # hero chest in effect coordinates
FEET = (48, 66)
DIRS = {'front': (0, 1), 'side': (1, 0), 'back': (0, -1)}
WHITE = (255, 255, 255)

def blank(w=EW, h=EH): return np.zeros((h, w, 4), np.uint8)
def img(a): return Image.fromarray(a, 'RGBA')

def put(a, x, y, c, al=255):
    x, y = int(round(x)), int(round(y))
    if 0 <= x < a.shape[1] and 0 <= y < a.shape[0]:
        if al >= 255 or a[y, x, 3] == 0: a[y, x, :3] = c; a[y, x, 3] = max(a[y, x, 3], al)
        else:
            k = al / 255; a[y, x, :3] = (a[y, x, :3] * (1 - k) + np.array(c) * k).astype(np.uint8)

def disc(a, cx, cy, r, c, al=255):
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.3: put(a, x, y, c, al)

def sparkle(a, x, y, c, big=False):
    put(a, x, y, WHITE)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): put(a, x + dx, y + dy, c)
    if big:
        for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2)): put(a, x + dx, y + dy, c, 160)

# ------------------------------------------------------------------ Knight: sword arc

def arc_band(a, center, a0, a1, r_in, r_out, ramp, alpha=255, squash=0.8, taper=True):
    cx, cy = center
    span = a1 - a0
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            dx, dy = x - cx, (y - cy) / squash
            r = math.hypot(dx, dy)
            ang = math.degrees(math.atan2(dy, dx))
            t = ((ang - a0) / span) if span else 0
            if span < 0: t = (a0 - ang) / -span
            # unwrap so the band can cross 180 degrees
            for wrap in (0, 360, -360):
                tt = ((ang + wrap) - a0) / span
                if 0 <= tt <= 1: t = tt; break
            else:
                continue
            thick = (r_out - r_in) * (0.25 + 0.75 * t if taper else 1)
            if r_in <= r <= r_in + thick:
                k = (r - r_in) / max(thick, 1)
                c = WHITE if k < 0.18 else ramp[4] if k < 0.45 else ramp[3] if k < 0.75 else ramp[2]
                al = int(alpha * (0.35 + 0.65 * t))
                put(a, x, y, c, al)

def knight_fx(view, f):
    behind, front = blank(), blank()
    tgt = behind if view == 'back' else front
    gold = R['gold']
    sweeps = {'front': (160, 20), 'side': (-75, 75), 'back': (-20, -160)}
    centers = {'front': (CHEST[0], CHEST[1] + 4), 'side': (CHEST[0] + 4, CHEST[1]), 'back': (CHEST[0], CHEST[1] - 6)}
    a0, a1 = sweeps[view]
    if f == 0:
        tip = {'front': (36, 33), 'side': (37, 34), 'back': (63, 54)}[view]
        sparkle(front, *tip, gold[4])
    elif f == 1:
        arc_band(tgt, centers[view], a0, a1, 15, 23, gold)
        mid = math.radians((a0 + a1) / 2); c = centers[view]
        for k in range(3):
            sparkle(tgt, c[0] + math.cos(mid + 0.35 * (k - 1)) * 26, c[1] + math.sin(mid + 0.35 * (k - 1)) * 21, gold[4])
    else:
        arc_band(tgt, centers[view], a0 + (a1 - a0) * 0.35, a1 + (a1 - a0) * 0.12, 18, 22, gold, alpha=150)
        rng = random.Random(7)
        c = centers[view]
        for k in range(6):
            ang = math.radians(a0 + (a1 - a0) * rng.random()); r = 20 + rng.random() * 6
            put(tgt, c[0] + math.cos(ang) * r, c[1] + math.sin(ang) * r * 0.8, gold[4], 200)
    return img(behind), img(front)

# ------------------------------------------------------------------ Mage: homing magic bolt

def bolt(a, x, y, d, ramp, trail=3):
    dx, dy = d
    for i in range(trail, 0, -1):
        disc(a, x - dx * i * 4, y - dy * i * 4, 3.6 - i * 0.7, ramp[3], 170 - i * 30)
    disc(a, x, y, 6, ramp[1], 90)
    disc(a, x, y, 5, ramp[2], 200)
    disc(a, x, y, 4, ramp[3]); disc(a, x, y, 2.5, ramp[4]); disc(a, x - 1, y - 1, 1.2, WHITE)

def mage_fx(view, f):
    behind, front = blank(), blank()
    orbr = R['robe']; glow = [orbr[0], orbr[1], R['orb'][2], R['orb'][3], R['orb'][4]]
    tip = {'front': (36.5, 29), 'side': (60.5, 33), 'back': (58.5, 31)}[view]
    d = DIRS[view]
    start = {'front': (48, 70), 'side': (66, 33), 'back': (48, 30)}[view]
    tgt = behind if view == 'back' else front
    if f == 0:
        rng = random.Random(2)
        for k in range(6):
            ang = k * math.pi / 3 + 0.3; r = 6 + (k % 2) * 2
            put(front, tip[0] + math.cos(ang) * r, tip[1] + math.sin(ang) * r, glow[3] if k % 2 else glow[4])
        sparkle(front, tip[0] + 5, tip[1] - 4, glow[3])
    elif f == 1:
        for k in range(8):
            ang = k * math.pi / 4
            for r in (5, 6):
                put(front, tip[0] + math.cos(ang) * r, tip[1] + math.sin(ang) * r, glow[4], 220 if r == 5 else 140)
        bolt(tgt, start[0] + d[0] * 4, start[1] + d[1] * 4, d, glow, trail=1)
    else:
        bolt(tgt, start[0] + d[0] * 18, start[1] + d[1] * 18, d, glow, trail=3)
        sparkle(tgt, start[0] + d[0] * 18 + (3 if view != 'side' else 0), start[1] + d[1] * 18 + (0 if view != 'side' else 3), glow[4])
    return img(behind), img(front)

# ------------------------------------------------------------------ Marksman: piercing bolt with streak

def arrow(a, x, y, d, length=9):
    dx, dy = d
    blue = R['blue']
    for i in range(length):
        put(a, x - dx * i, y - dy * i, R['wood'][3] if i % 2 else R['wood'][2])
    put(a, x + dx, y + dy, R['steel'][4]); put(a, x + dx * 2, y + dy * 2, R['steel'][3])
    px_, py_ = -dy, dx
    for i in range(length - 3, length):
        put(a, x - dx * i + px_, y - dy * i + py_, R['red'][3]); put(a, x - dx * i - px_, y - dy * i - py_, R['cream'][4])

def streak(a, x, y, d, length, alpha=230):
    dx, dy = d; px_, py_ = -dy, dx
    blue = R['orb']
    for i in range(length):
        k = i / max(length, 1)
        al = int(alpha * (1 - k * 0.9))
        put(a, x - dx * i, y - dy * i, WHITE if k < 0.4 else blue[4], al)
        if k < 0.8:
            put(a, x - dx * i + px_, y - dy * i + py_, blue[3], int(al * 0.8)); put(a, x - dx * i - px_, y - dy * i - py_, blue[3], int(al * 0.8))
        if k < 0.4:
            put(a, x - dx * i + 2 * px_, y - dy * i + 2 * py_, blue[2], al // 3); put(a, x - dx * i - 2 * px_, y - dy * i - 2 * py_, blue[2], al // 3)

def marksman_fx(view, f):
    behind, front = blank(), blank()
    d = DIRS[view]
    muzzle = {'front': (48, 52), 'side': (61, 48), 'back': (48, 44)}[view]
    tgt = behind if view == 'back' else front
    if f == 0:
        sparkle(front, muzzle[0] + d[0] * 2, muzzle[1] + d[1] * 2, R['steel'][4])
    elif f == 1:
        disc(tgt, muzzle[0] + d[0] * 3, muzzle[1] + d[1] * 3, 3, R['orb'][4], 200)
        for k in range(8):
            ang = k * math.pi / 4; put(tgt, muzzle[0] + d[0] * 3 + math.cos(ang) * 5, muzzle[1] + d[1] * 3 + math.sin(ang) * 5, WHITE, 200)
        x, y = muzzle[0] + d[0] * 12, muzzle[1] + d[1] * 12
        streak(tgt, x - d[0] * 8, y - d[1] * 8, d, 8); arrow(tgt, x, y, d)
    else:
        x, y = muzzle[0] + d[0] * 30, muzzle[1] + d[1] * 30
        streak(tgt, x - d[0] * 8, y - d[1] * 8, d, 26); arrow(tgt, x, y, d)
    return img(behind), img(front)

# ------------------------------------------------------------------ Rogue: dagger flurry slashes

def slash(a, cx, cy, ang, r, span, ramp, alpha=255):
    for i in range(span * 2 + 1):
        t = i / (span * 2)
        aa = math.radians(ang - span + i)
        thick = 1 + int(3 * math.sin(math.pi * t))
        for k in range(thick):
            rr = r + k
            c = WHITE if k == 0 else ramp[4] if k == 1 else ramp[3]
            put(a, cx + math.cos(aa) * rr, cy + math.sin(aa) * rr * 0.85, c, int(alpha * (0.4 + 0.6 * math.sin(math.pi * t))))

def rogue_fx(view, f):
    behind, front = blank(), blank()
    g = R['green']
    tgt = behind if view == 'back' else front
    base = {'front': (48, 66), 'side': (60, 50), 'back': (48, 34)}[view]
    face = {'front': 90, 'side': 0, 'back': -90}[view]
    if f == 0:
        slash(tgt, base[0] - 6 * (view != 'side'), base[1] - 6 * (view == 'side'), face + 30, 10, 55, g)
        sparkle(tgt, base[0] + 4, base[1] + 2, g[4], big=True)
    elif f == 1:
        slash(tgt, base[0] + 6 * (view != 'side'), base[1] + 6 * (view == 'side'), face - 30, 10, 55, g)
        slash(tgt, base[0] - 6 * (view != 'side'), base[1] - 6 * (view == 'side'), face + 30, 12, 40, g, 130)
    else:
        for sgn in (-1, 1):
            x0, y0 = base[0] - 7, base[1] - 7 * sgn
            x0, y0 = base[0] - 9, base[1] - 9 * sgn
            for i in range(19):
                put(tgt, x0 + i, y0 + i * sgn, WHITE if 5 < i < 13 else g[4]); put(tgt, x0 + i, y0 + i * sgn + 1, g[4], 220)
                if 3 < i < 15: put(tgt, x0 + i, y0 + i * sgn + 2, g[3], 150)
        sparkle(tgt, base[0], base[1], g[4], big=True)
    return img(behind), img(front)

# ------------------------------------------------------------------ Witch: hex pulse ring

def ring(behind, front, cx, cy, r, ramp, alpha=255, width=2, fill=0):
    for y in range(max(0, int(cy - r / 2 - 2)), min(behind.shape[0], int(cy + r / 2 + 3))):
        for x in range(max(0, int(cx - r - 2)), min(behind.shape[1], int(cx + r + 3))):
            dx, dy = x - cx, (y - cy) * 2.0        # ground ellipse, half as tall as wide
            d = math.hypot(dx, dy)
            layer = front if y >= cy else behind
            if r - width <= d <= r:
                k = (r - d) / width
                put(layer, x, y, WHITE if k < 0.34 else ramp[4] if k < 0.67 else ramp[3], alpha)
            elif fill and d < r - width:
                put(behind, x, y, ramp[3], fill)
    for k in range(8):                                # rune marks around the ring
        ang = k * math.pi / 4 + 0.2
        x, y = cx + math.cos(ang) * (r + 2), cy + math.sin(ang) * (r + 2) / 2
        layer = front if y >= cy else behind
        put(layer, x, y, ramp[4], alpha); put(layer, x, y - 1, ramp[3], alpha // 2)

def witch_fx(view, f):
    behind, front = blank(), blank()
    p = R['vial_p']
    crystal = {'front': (37, 34 - 4), 'side': (55, 34 - 4), 'back': (58, 34 - 4)}[view]
    if f == 0:
        for k in range(6):
            ang = k * math.pi / 3
            put(front, crystal[0] + math.cos(ang) * 5, crystal[1] + math.sin(ang) * 5, p[4])
        sparkle(front, crystal[0] + 1, crystal[1] - 6, p[3], big=True)
        ring(behind, front, FEET[0], FEET[1], 7, p, 120, 1)
    elif f == 1:
        ring(behind, front, FEET[0], FEET[1], 17, p, 255, 3, fill=45)
        for k in range(5):
            ang = k * 1.3
            sparkle(front if math.sin(ang) > 0 else behind, FEET[0] + math.cos(ang) * 12, FEET[1] + math.sin(ang) * 6 - 6, p[4])
    else:
        ring(behind, front, FEET[0], FEET[1], 30, p, 200, 2)
        ring(behind, front, FEET[0], FEET[1], 21, p, 90, 1)
    return img(behind), img(front)

FX = {'knight': knight_fx, 'mage': mage_fx, 'marksman': marksman_fx, 'rogue': rogue_fx, 'witch': witch_fx}

def compose(hero_img, behind, front):
    out = Image.new('RGBA', (EW, EH), (0, 0, 0, 0))
    out.alpha_composite(behind); out.alpha_composite(hero_img, OFFSET); out.alpha_composite(front)
    return out
