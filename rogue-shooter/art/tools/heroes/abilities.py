"""Spacebar abilities for the five heroes, 3 frames per view, on a 128x112 ability canvas.

The hero's 32x44 canvas sits at HOME (48, 34) and may move (bash, blink, dash).
ability(hero, view, f) -> dict(hero=img, at=(x, y), behind=img, front=img)
  hero:   the hero sprite for this frame (32x44, may be dissolved)
  at:     where the hero canvas goes on the ability canvas
  behind: RGBA layer under the hero (afterimages, ground circles, effects beyond the hero)
  front:  RGBA layer over the hero
"""
import math, random
import numpy as np
from PIL import Image
from spritekit import R
from heroes import HEROES, ATTACK, WALK
from effects import blank, put, disc, sparkle, ring, img, WHITE

AW, AH = 128, 112
HOME = (48, 34)
DIRS = {'front': (0, 1), 'side': (1, 0), 'back': (0, -1)}

def ab(): return blank(AW, AH)

def hero_frame(hero, view, atk=None, pose=None):
    return HEROES[hero](view, atk).render(pose)

def anchors(at):
    """Chest and feet of a hero placed at `at`."""
    return (at[0] + 16, at[1] + 28), (at[0] + 16, at[1] + 42)

def moved(view, d):
    dx, dy = DIRS[view]; return (HOME[0] + dx * d, HOME[1] + dy * d)

def silhouette(im, color, alpha):
    a = np.array(im).copy(); m = a[..., 3] > 0
    a[m, 0], a[m, 1], a[m, 2] = color; a[m, 3] = int(alpha)
    return Image.fromarray(a, 'RGBA')

def dissolve(im, frac, tint, seed=1):
    """Remove `frac` of the pixels in a scattered pattern and tint the rest toward `tint`."""
    a = np.array(im).copy(); rng = np.random.default_rng(seed)
    noise = rng.random(a.shape[:2])
    a[noise < frac, 3] = 0
    m = a[..., 3] > 0
    a[m, :3] = (a[m, :3] * (1 - frac * 0.7) + np.array(tint) * frac * 0.7).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

def paste(layer, im, at):
    out = Image.fromarray(layer, 'RGBA'); out.alpha_composite(im, (int(at[0]), int(at[1]))); return np.array(out)

def star(a, x, y, r, c1, c2, rays=8, alpha=255):
    for k in range(rays):
        ang = k * 2 * math.pi / rays
        L = r if k % 2 == 0 else r * 0.55
        for i in range(int(L) + 1):
            put(a, x + math.cos(ang) * i, y + math.sin(ang) * i * 0.85, WHITE if i < L * 0.4 else c1 if i < L * 0.75 else c2, alpha)
    disc(a, x, y, 2, WHITE, alpha)

def tiny_star(a, x, y, c):
    put(a, x, y, WHITE); [put(a, x + dx, y + dy, c) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
    [put(a, x + dx, y + dy, c, 120) for dx, dy in ((1, 1), (-1, -1), (1, -1), (-1, 1))]

def puff(a, x, y, r, ramp, alpha=200):
    disc(a, x, y, r, ramp[1], alpha); disc(a, x - r * 0.3, y - r * 0.3, r * 0.65, ramp[2], alpha); put(a, x - r * 0.5, y - r * 0.5, ramp[3], alpha)

# ------------------------------------------------------------------ Knight: Shield Bash

BASH = {'front': [{'armR': (-3, -1), 'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)},
                  {'armR': (-5, 2), 'body': (0, 1), 'legL': (0, -1), 'legR': (0, 0)},
                  {'armR': (-5, 4), 'body': (0, 2), 'legL': (0, 0), 'legR': (0, 0)}],
        'side': [{'shield': (1, 0), 'body': (-1, 1), 'legF': (0, 0), 'legB': (0, 0)},
                 {'shield': (4, 0), 'body': (2, 0), 'legF': (2, 0), 'legB': (-2, -1)},
                 {'shield': (6, 0), 'body': (3, 0), 'legF': (1, 0), 'legB': (-1, 0)}],
        'back': [{'armL': (3, 1), 'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)},
                 {'armL': (5, -2), 'body': (0, -1), 'legL': (0, 0), 'legR': (0, -1)},
                 {'armL': (5, -4), 'body': (0, -2), 'legL': (0, 0), 'legR': (0, 0)}]}

def knight_ab(view, f):
    at = moved(view, [0, 6, 12][f])
    hero = hero_frame('knight', view, None, BASH[view][f])
    behind, front = ab(), ab()
    dx, dy = DIRS[view]; chest, feet = anchors(at)
    dust = R['cream']
    if f == 0:
        for k in (-1, 1): puff(behind, feet[0] - dx * 6 + k * 5 * (dy != 0), feet[1] - dy * 4 + k * 3 * (dx != 0), 3, dust, 150)
        sparkle(front, chest[0] + dx * 8 + (6 if view == 'front' else 0), chest[1] + dy * 6 - 4, R['gold'][4])
    else:
        n = 7 if f == 1 else 4
        for i in range(n):
            off = (i - n / 2) * 4
            L = 16 if f == 1 else 10
            sx, sy = chest[0] - dx * 12 + off * (dx == 0), chest[1] - dy * 12 + off * (dy == 0) + (6 if dx else 0) * 0
            for j in range(L):
                put(behind if view != 'back' else front, sx - dx * j, sy - dy * j, WHITE, int(200 * (1 - j / L)))
        for k in range(3): puff(behind, feet[0] - dx * (10 + k * 6), feet[1] - dy * (6 + k * 5) + (k % 2) * 2, 4 - k, dust, 170 - k * 40)
        if f == 2:
            ix, iy = chest[0] + dx * 15 + (2 if view == 'front' else 0), chest[1] + dy * 13 - (2 if view == 'side' else 0)
            tgt = behind if view == 'back' else front
            star(tgt, ix, iy, 11, R['gold'][4], R['gold'][2])
            for k in range(3):
                ang = k * 2.1 + 0.5
                tiny_star(front, ix + math.cos(ang) * 9, iy - 10 + math.sin(ang) * 3, R['gold'][3])
    return dict(hero=hero, at=at, behind=img(behind), front=img(front))

# ------------------------------------------------------------------ Mage: Blink

def mage_ab(view, f):
    arc = R['robe']; glow = [arc[0], arc[1], arc[3], R['orb'][3], R['orb'][4]]
    behind, front = ab(), ab()
    home_chest, home_feet = anchors(HOME)
    if f == 0:
        hero = hero_frame('mage', view, 0, ATTACK[view][0]); at = HOME
        ring(behind, front, home_feet[0], home_feet[1], 14, glow, 200, 2)
        for k in range(8):
            ang = k * math.pi / 4
            put(behind if math.sin(ang) < 0 else front, home_feet[0] + math.cos(ang) * 10, home_feet[1] + math.sin(ang) * 5, glow[4])
        for i, (x, y) in enumerate([(-8, -6), (9, -14), (-4, -22), (6, -30)]):
            sparkle(front, home_chest[0] + x, home_chest[1] + y, glow[3])
    elif f == 1:
        hero = dissolve(hero_frame('mage', view, 1, ATTACK[view][1]), 0.6, glow[3], 3); at = HOME
        disc(behind, home_chest[0], home_chest[1] + 4, 13, glow[1], 110)
        disc(behind, home_chest[0], home_chest[1] + 4, 9, glow[2], 140)
        for k in range(10):
            ang = k * math.pi / 5 + 0.2
            for i in range(9, 17):
                put(front, home_chest[0] + math.cos(ang) * i, home_chest[1] + 4 + math.sin(ang) * i * 0.8, glow[4] if i < 13 else glow[3], 230)
        ring(behind, front, home_feet[0], home_feet[1], 18, glow, 220, 2)
    else:
        at = moved(view, 26)
        hero = dissolve(hero_frame('mage', view), 0.25, glow[3], 5)
        ring(behind, front, home_feet[0], home_feet[1], 26, glow, 120, 1)
        rng = random.Random(4)
        for k in range(10):
            put(behind, home_chest[0] + rng.randint(-14, 14), home_chest[1] + rng.randint(-12, 14), glow[rng.randint(2, 4)], 180)
        c2, f2 = anchors(at)
        for k in range(6):
            ang = k * math.pi / 3 + 0.4
            sparkle(front, c2[0] + math.cos(ang) * 13, c2[1] + math.sin(ang) * 15, glow[4])
        ring(behind, front, f2[0], f2[1], 10, glow, 160, 1)
    return dict(hero=hero, at=at, behind=img(behind), front=img(front))

# ------------------------------------------------------------------ Marksman: Focus Shot

def reticle(a, x, y, r, c, alpha=255):
    for k in range(48):
        ang = k * 2 * math.pi / 48
        if k % 12 in (5, 6): continue
        put(a, x + math.cos(ang) * r, y + math.sin(ang) * r, c, alpha)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        for i in range(r - 2, r + 4): put(a, x + dx * i, y + dy * i, c, alpha)
    put(a, x, y, WHITE, alpha)

def marksman_ab(view, f):
    at = HOME
    dx, dy = DIRS[view]
    behind, front = ab(), ab()
    cyan = R['orb']
    muzzle = {'front': (64, 61), 'side': (77, 58), 'back': (64, 53)}[view]
    tgt = behind if view == 'back' else front
    if f == 0:
        hero = hero_frame('marksman', view, 0, ATTACK[view][0])
        reticle(tgt, muzzle[0] + dx * 34, muzzle[1] + dy * 30, 6, R['red'][3], 220)
        for k in range(6):
            ang = k * math.pi / 3
            put(tgt, muzzle[0] + math.cos(ang) * 6, muzzle[1] + math.sin(ang) * 6, cyan[4])
    elif f == 1:
        hero = hero_frame('marksman', view, 0, ATTACK[view][0])
        reticle(tgt, muzzle[0] + dx * 34, muzzle[1] + dy * 30, 4, WHITE, 255)
        disc(tgt, muzzle[0], muzzle[1], 6, cyan[2], 120); disc(tgt, muzzle[0], muzzle[1], 4, cyan[3], 220); disc(tgt, muzzle[0], muzzle[1], 2, WHITE)
        for k in range(8):
            ang = k * math.pi / 4 + 0.2
            for i in range(8, 12): put(tgt, muzzle[0] + math.cos(ang) * i, muzzle[1] + math.sin(ang) * i, cyan[4], 200)
    else:
        hero = hero_frame('marksman', view, 1, ATTACK[view][1]); at = (HOME[0] - dx * 2, HOME[1] - dy * 2)
        L = 70
        for i in range(2, L):
            for w in range(-4, 5):
                k = abs(w)
                c = WHITE if k <= 1 else cyan[4] if k <= 2 else cyan[3]
                al = 255 if k <= 2 else 140 if k == 3 else 70
                put(tgt, muzzle[0] + dx * i - dy * w, muzzle[1] + dy * i + dx * w, c, al)
        rng = random.Random(9)
        for k in range(14):
            i = rng.randint(4, L); w = rng.choice([-6, -5, 5, 6])
            tiny_star(tgt, muzzle[0] + dx * i - dy * w, muzzle[1] + dy * i + dx * w, cyan[3])
        disc(tgt, muzzle[0], muzzle[1], 6, WHITE, 230)
    return dict(hero=hero, at=at, behind=img(behind), front=img(front))

# ------------------------------------------------------------------ Rogue: Shadow Dash

def rogue_ab(view, f):
    dx, dy = DIRS[view]
    behind, front = ab(), ab()
    smoke = R['dgreen']; g = R['green']
    home_chest, home_feet = anchors(HOME)
    crouch = {'front': {'body': (0, 2), 'legL': (0, 0), 'legR': (0, 0), 'armL': (0, 1), 'armR': (0, 1)},
              'side': {'body': (-1, 2), 'legF': (1, 0), 'legB': (-1, 0)},
              'back': {'body': (0, 2), 'legL': (0, 0), 'legR': (0, 0)}}[view]
    if f == 0:
        hero = hero_frame('rogue', view, None, crouch); at = HOME
        for k in range(5):
            puff(behind if k % 2 else front, home_feet[0] - 10 + k * 5, home_feet[1] - (k % 2) * 2, 3, smoke, 170)
    elif f == 1:
        base = hero_frame('rogue', view, None, WALK[view][0])
        at = moved(view, 16); hero = base
        b = behind
        for i, d in enumerate((4, 9, 13)):
            gh = silhouette(base, smoke[2], 70 + i * 40)
            b = paste(b, gh, moved(view, d))
        behind = b
        for k in range(4): puff(behind, home_feet[0] - 6 + k * 4, home_feet[1] - 2, 4 - k % 2, smoke, 200)
    else:
        base = hero_frame('rogue', view, 2, ATTACK[view][2])
        at = moved(view, 30); hero = base
        b = behind
        for i, d in enumerate((14, 22)):
            b = paste(b, silhouette(base, smoke[2], 50 + i * 30), moved(view, d))
        behind = b
        c0 = home_chest; c1, _ = anchors(at)
        n = int(math.hypot(c1[0] - c0[0], c1[1] - c0[1]))
        tgt = behind if view == 'back' else front
        for i in range(n):
            t = i / max(n, 1)
            x, y = c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t
            put(tgt, x, y, WHITE, int(255 * t)); put(tgt, x - dy, y + dx, g[4], int(200 * t)); put(tgt, x + dy, y - dx, g[3], int(140 * t))
        for k in range(4): puff(behind, home_feet[0] - 8 + k * 6, home_feet[1] - 3 - (k % 2) * 3, 3, smoke, 120)
    return dict(hero=hero, at=at, behind=img(behind), front=img(front))

# ------------------------------------------------------------------ Witch: Ritual Burst

def rune_circle(behind, front, cx, cy, r, ramp, alpha):
    ring(behind, front, cx, cy, r, ramp, alpha, 2)
    ring(behind, front, cx, cy, r - 6, ramp, alpha, 1)
    for k in range(6):
        ang = k * math.pi / 3 + 0.25
        x, y = cx + math.cos(ang) * (r - 3), cy + math.sin(ang) * (r - 3) / 2
        layer = front if y >= cy else behind
        for ddx, ddy in ((0, -1), (-1, 0), (1, 0), (0, 1), (0, 0)): put(layer, x + ddx, y + ddy, ramp[4] if (ddx, ddy) == (0, 0) else ramp[3], alpha)
    pts = [(cx + math.cos(math.radians(-90 + i * 120)) * (r - 6), cy + math.sin(math.radians(-90 + i * 120)) * (r - 6) / 2) for i in range(4)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(math.hypot(x1 - x0, y1 - y0))
        for i in range(n):
            x, y = x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n
            put(front if y >= cy else behind, x, y, ramp[3], int(alpha * 0.8))

def hex_mark(a, x, y, ramp):
    for ddx, ddy in ((0, -3), (-1, -2), (1, -2), (-2, -1), (2, -1), (-3, 0), (3, 0), (-2, 1), (2, 1), (-1, 2), (1, 2), (0, 3)):
        put(a, x + ddx, y + ddy, ramp[3])
    put(a, x, y, WHITE); put(a, x - 1, y, ramp[4]); put(a, x + 1, y, ramp[4])

def witch_ab(view, f):
    p = R['vial_p']
    behind, front = ab(), ab()
    chest, feet = anchors(HOME)
    if f == 0:
        hero = hero_frame('witch', view, 0, ATTACK[view][0])
        rune_circle(behind, front, feet[0], feet[1], 22, p, 230)
        for k in range(5): sparkle(front, chest[0] - 12 + k * 6, chest[1] - 30 + (k % 2) * 4, p[4])
    elif f == 1:
        hero = hero_frame('witch', view, 1, ATTACK[view][1])
        for y in range(0, feet[1]):
            for x in range(feet[0] - 7, feet[0] + 8):
                k = abs(x - feet[0])
                al = int((170 if k < 3 else 100 if k < 5 else 45) * (0.3 + 0.7 * y / feet[1]))
                put(behind, x, y, WHITE if k < 2 else p[4] if k < 4 else p[3], al)
        rune_circle(behind, front, feet[0], feet[1], 28, p, 255)
        ring(behind, front, feet[0], feet[1], 38, p, 200, 3, fill=40)
    else:
        hero = hero_frame('witch', view, 1, ATTACK[view][1])
        ring(behind, front, feet[0], feet[1], 54, p, 170, 2)
        rune_circle(behind, front, feet[0], feet[1], 28, p, 110)
        for k, (mx, my) in enumerate([(-40, -8), (38, -12), (-26, 14), (30, 16), (2, -22)]):
            hex_mark(front if my > 0 else behind, feet[0] + mx, feet[1] + my - 6, p)
    return dict(hero=hero, at=HOME, behind=img(behind), front=img(front))

ABILITIES = {'knight': ('Shield Bash', knight_ab), 'mage': ('Blink', mage_ab), 'marksman': ('Focus Shot', marksman_ab),
             'rogue': ('Shadow Dash', rogue_ab), 'witch': ('Ritual Burst', witch_ab)}

def ability(hero, view, f): return ABILITIES[hero][1](view, f)

def compose_ab(fr):
    out = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
    out.alpha_composite(fr['behind']); out.alpha_composite(fr['hero'], (int(fr['at'][0]), int(fr['at'][1]))); out.alpha_composite(fr['front'])
    return out
