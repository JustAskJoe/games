"""Rogue Shooter v2 heroes: five classes x three facing directions (front, side, back).

Side views face right; the game flips them for left. Canvas 32x44 art pixels, feet on y=38
(plus the 4 px headroom offset). Every hero function takes the view and an attack frame
(None for idle/walk, 0 wind-up, 1 strike, 2 follow-through). Pose groups:
  front/back: legL legR armL armR wpn (L/R = viewer's left/right), body
  side:       legB legF armF armB wpn, body
Walk and attack poses move those groups; see WALK and ATTACK.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spritekit import Sprite, R, EYE, WHITE, BLUSH, hx

# ------------------------------------------------------------------ shared pieces

def boots_front(s, m, legs):
    s.g('legL'); s.rect(legs, 11, 29, 14, 34); s.poly(m, [(11, 34), (14, 34), (14, 38), (10, 38), (10, 37), (11, 36)])
    s.g('legR'); s.rect(legs, 17, 29, 20, 34); s.poly(m, [(17, 34), (20, 34), (20, 36), (21, 37), (21, 38), (17, 38)])
    s.g('body')

def boots_side(s, m, legs):
    s.g('legB'); s.rect(legs, 13, 29, 16, 34); s.poly(m, [(13, 34), (16, 34), (17, 37), (18, 38), (13, 38)])
    s.g('legF'); s.rect(legs, 16, 29, 19, 34); s.poly(m, [(16, 34), (19, 34), (20, 36), (21, 37), (21, 38), (16, 38)])
    s.g('body')

def feet_front(s, m):
    s.g('legL'); s.poly(m, [(11, 35), (14, 35), (14, 38), (10, 38)])
    s.g('legR'); s.poly(m, [(17, 35), (20, 35), (21, 38), (17, 38)]); s.g('body')

def feet_side(s, m):
    s.g('legB'); s.poly(m, [(13, 35), (16, 35), (16, 38), (13, 38)])
    s.g('legF'); s.poly(m, [(16, 35), (19, 35), (21, 38), (16, 38)]); s.g('body')

def face_front(s, eyes=(12, 18), y=12, mouth=True, blush=True, skin='skin'):
    for ex in eyes:
        s.dot(ex, y, WHITE); s.dot(ex + 1, y, EYE); s.dot(ex, y + 1, EYE); s.dot(ex + 1, y + 1, EYE)
    if blush: s.dot(eyes[0] - 1, y + 3, BLUSH); s.dot(eyes[1] + 2, y + 3, BLUSH)
    if mouth: s.dot(15, y + 4, (skin, 1)); s.dot(16, y + 4, (skin, 1))

def face_side(s, ex=20, y=12, mouth=True, skin='skin'):
    s.dot(ex, y, WHITE); s.dot(ex + 1, y, EYE); s.dot(ex + 1, y + 1, EYE); s.dot(ex, y + 1, EYE)
    s.dot(ex - 1, y + 3, BLUSH)
    if mouth: s.dot(ex + 1, y + 4, (skin, 1))

def _dir(ang):
    a = math.radians(ang); return math.cos(a), math.sin(a)

def sword(s, x, y, ang, L=10):
    """Longsword with its grip at (x, y), blade pointing `ang` degrees (0 = right, 90 = down)."""
    dx, dy = _dir(ang); px_, py_ = -dy, dx
    s.line('leather', [(x - dx * 3, y - dy * 3), (x, y)], 2)
    s.line('steel', [(x + dx * 1.5, y + dy * 1.5), (x + dx * L, y + dy * L)], 2)
    s.line('gold', [(x + px_ * 3, y + py_ * 3), (x - px_ * 3, y - py_ * 3)], 1)
    s.dot(round(x - dx * 4), round(y - dy * 4), ('gold', 3))
    s.dot(round(x + dx * (L - 2)), round(y + dy * (L - 2)), ('steel', 4))

def dagger(s, x, y, ang, L=6):
    dx, dy = _dir(ang); px_, py_ = -dy, dx
    s.line('steel', [(x + dx, y + dy), (x + dx * L, y + dy * L)], 2)
    s.line('gold', [(x + px_ * 2, y + py_ * 2), (x - px_ * 2, y - py_ * 2)], 1)
    s.dot(round(x + dx * (L - 1)), round(y + dy * (L - 1)), ('steel', 4))

def staff_line(s, x0, y0, x1, y1, w=2):
    s.line('wood', [(x0, y0), (x1, y1)], w)

def orb(s, x, y, r=3, ramp_='orb', flare=False):
    s.ell(ramp_, x, y, r + (1 if flare else 0), r + (1 if flare else 0))
    s.dots([(round(x - 1), round(y - 2)), (round(x - 2), round(y - 1))], WHITE)
    if flare: s.dots([(round(x - 1), round(y - 1)), (round(x), round(y - 2))], WHITE)

def hex_staff(s, x, top, bottom, glow=False):
    """The witch's crooked staff: knotted wood, a curl at the top cradling a magenta crystal."""
    s.line('wood', [(x, bottom), (x, top + 6)], 2)
    s.line('wood', [(x, top + 6), (x - 2, top + 3), (x - 1, top), (x + 2, top - 1), (x + 3, top + 2)], 1)
    s.dots([(x, top + 14), (x + 1, top + 22), (x, top + 29)], ('wood', 0))
    s.poly('vial_p', [(x + 1, top - 1), (x + 3, top + 2), (x + 1, top + 6), (x - 1, top + 2)])
    s.dot(x, top + 1, WHITE)
    if glow: s.dots([(x - 2, top - 2), (x + 4, top - 1), (x + 1, top - 4), (x + 5, top + 4)], ('vial_p', 4))
    s.dots([(x + 2, top + 8), (x + 3, top + 10)], ('pink', 3))   # ribbon

# ------------------------------------------------------------------ KNIGHT

def knight(view, atk=None):
    s = Sprite()
    if view == 'front':
        s.poly('red', [(8, 21), (23, 21), (25, 35), (6, 35)])
        boots_front(s, 'steel', 'chain')
        s.rect('steel', 10, 20, 21, 29)
        s.g('armR'); s.rect('steel', 22, 21, 24, 27); s.g('body')
        s.poly('orange', [(12, 24), (19, 24), (20, 34), (11, 34)])
        s.rect('leather', 10, 27, 21, 28)
        s.ell('steel', 22, 21, 3, 2.4)
        s.rect('steel', 14, 17, 17, 19)
        s.ell('steel', 15.5, 11, 7.5, 7)
        s.poly('red', [(13, 5), (18, 5), (21, 1), (20, -3), (17, -4), (14, -3), (12, 0)]); s.ell('gold', 15.5, 4.5, 2, 1.2)
        s.rect('dsteel', 10, 11, 21, 12, flat=True); s.rect('dsteel', 15, 12, 16, 16, flat=True)
        s.g('armR'); s.poly('blue', [(20, 21), (29, 21), (29, 29), (24.5, 36), (20, 29)])
        s.dots([(x, 21) for x in range(20, 30)], ('gold', 3)); s.dots([(20, y) for y in range(22, 29)], ('gold', 3))
        s.dots([(29, y) for y in range(22, 29)], ('gold', 1))
        s.dots([(24, y) for y in range(23, 33)] + [(25, y) for y in range(23, 33)], ('gold', 2))
        s.dots([(x, 26) for x in range(21, 29)], ('gold', 2)); s.dot(24, 23, ('gold', 4))
        s.g('armL'); s.rect('steel', 6, 21, 8, 27); s.ell('steel', 9, 21, 3, 2.4); s.ell('leather', 7, 28.5, 1.6, 1.6)
        grip = {None: (6.5, 29, 90), 0: (7, 19, -120), 1: (9, 30, 70), 2: (13, 31, 30)}[atk]
        sword(s, *grip)
        s.g('body')
        s.dots([(x, 13) for x in range(11, 21) if x not in (15, 16)], ('steel', 1))
        s.dots([(13, 14), (18, 14), (13, 16), (18, 16)], ('dsteel', 0))
        s.dots([(12, 7), (13, 6), (14, 6)], ('steel', 4)); s.dots([(x, 5) for x in range(13, 19)], ('gold', 3))
        s.dots([(x, 17) for x in range(11, 21)], ('gold', 2))
        s.dots([(15, 29), (16, 29), (15, 30), (16, 30), (14, 29), (17, 30), (15, 28), (16, 31)], ('gold', 3))
        s.dots([(12, 25), (12, 26), (19, 25), (19, 26)], ('gold', 2)); s.dots([(15, 27), (16, 27)], ('gold', 4))
        s.dots([(x, 33) for x in range(12, 20)], ('gold', 2))
        s.dots([(12, 21), (13, 21), (12, 22)], ('steel', 4)); s.dots([(10, 23), (21, 23)], ('gold', 3))
        s.dots([(14, 0), (15, -1), (16, -2), (17, -2)], ('red', 4)); s.dots([(19, 0), (20, -1)], ('red', 1))
    elif view == 'back':
        boots_front(s, 'steel', 'chain')
        s.rect('steel', 10, 20, 21, 29)
        s.g('armL'); s.rect('steel', 7, 21, 9, 27); s.ell('leather', 8, 28.5, 1.6, 1.6)
        s.poly('blue', [(2, 21), (11, 21), (11, 29), (6.5, 36), (2, 29)]); s.dots([(x, 21) for x in range(2, 11)], ('gold', 3))
        s.g('armR'); s.rect('steel', 22, 21, 24, 27); s.ell('leather', 23, 28.5, 1.6, 1.6)
        if atk is None: sword(s, 23.5, 29, 90)
        s.g('body')
        s.ell('steel', 9, 21, 3, 2.4); s.ell('steel', 22, 21, 3, 2.4)
        s.poly('red', [(9, 20), (22, 20), (24, 35), (21, 36), (18, 35), (15, 36), (12, 35), (9, 36), (7, 35)])
        s.rect('steel', 14, 17, 17, 19)
        s.ell('steel', 15.5, 11, 7.5, 7)
        s.poly('red', [(14, 3), (17, 3), (17, 9), (14, 9)])
        s.poly('red', [(12, 4), (19, 4), (21, 0), (19, -3), (15, -4), (12, -2), (11, 1)])
        if atk is not None:
            s.g('armR'); sword(s, *{0: (24, 26, 150), 1: (22, 19, -70), 2: (17, 17, -120)}[atk]); s.g('body')
        s.dots([(x, 18) for x in range(10, 22)], ('steel', 1))
        s.dots([(12, 7), (13, 6), (14, 5)], ('steel', 4)); s.dots([(x, 15) for x in range(10, 22)], ('gold', 2))
        for x in (12, 15, 18, 21): s.dots([(x, y) for y in range(24, 34)], ('red', 1))
        s.dots([(10, 21), (11, 21), (20, 21), (21, 21)], ('gold', 3))
    else:
        s.poly('red', [(9, 20), (14, 20), (12, 35), (6, 35), (8, 27)])
        if atk is None:
            s.g('armF'); sword(s, 21, 25, 0); s.g('body')
        boots_side(s, 'steel', 'chain')
        s.rect('steel', 11, 20, 19, 29)
        s.poly('orange', [(12, 24), (19, 24), (19, 34), (13, 34)])
        s.rect('leather', 11, 27, 19, 28)
        s.rect('steel', 14, 17, 17, 19)
        s.ell('steel', 16, 11, 7.5, 7)
        s.poly('red', [(11, 6), (16, 4), (19, 2), (18, -2), (13, -3), (7, 0), (4, 5), (6, 9), (9, 8)]); s.ell('gold', 16, 4.5, 2, 1.2)
        s.rect('dsteel', 18, 11, 23, 12, flat=True)
        s.g('shield'); s.poly('blue', [(9, 20), (17, 20), (17, 28), (13, 34), (9, 28)])
        s.ell('steel', 15, 20, 3, 2.4)
        s.dots([(x, 20) for x in range(9, 18)], ('gold', 3)); s.dots([(9, y) for y in range(21, 28)], ('gold', 3))
        s.dots([(13, y) for y in range(22, 31)], ('gold', 2)); s.dots([(x, 25) for x in range(10, 17)], ('gold', 2)); s.dot(13, 22, ('gold', 4)); s.g('body')
        s.dots([(x, 13) for x in range(17, 23)], ('steel', 1)); s.dots([(x, 5) for x in range(13, 19)], ('gold', 3))
        s.dots([(12, 7), (13, 6)], ('steel', 4)); s.dots([(x, 33) for x in range(14, 19)], ('gold', 2))
        if atk is not None:
            s.g('armF'); s.ell('leather', *{0: (14, 20), 1: (21, 24), 2: (21, 29)}[atk], 1.6, 1.6)
            sword(s, *{0: (14, 19, -140), 1: (21, 24, -10), 2: (21, 29, 40)}[atk]); s.g('body')
    return s

# ------------------------------------------------------------------ MAGE

def mage(view, atk=None):
    s = Sprite()
    flare = atk == 1
    if view == 'front':
        lift = -2 if atk == 0 else 0
        s.g('armL'); staff_line(s, 4.5, 5 + lift, 4.5, 38 + lift); s.g('body')
        feet_front(s, 'leather')
        s.poly('robe', [(10, 20), (21, 20), (24, 36), (7, 36)])
        s.g('armL'); s.poly('robe', [(9, 20), (6, 27), (5, 28), (10, 28), (11, 22)]); s.ell('skin', 6.5, 28.5, 1.6, 1.6)
        s.dots([(6, 27), (7, 27)], ('cream', 3))
        s.g('armR'); s.poly('robe', [(22, 20), (25, 27), (26, 28), (21, 28), (20, 22)]); s.ell('skin', 24, 28.5, 1.6, 1.6)
        s.dots([(24, 27), (25, 27)], ('cream', 3)); s.g('body')
        s.rect('red', 10, 26, 21, 27)
        s.rect('skin', 14, 17, 17, 19)
        s.ell('silver', 15.5, 12.5, 8, 7)
        s.ell('skin', 15.5, 12.5, 6, 5.5)
        s.poly('silver', [(11, 15), (20, 15), (20, 19), (17, 24), (15.5, 26), (14, 24), (11, 19)])
        s.ell('robe', 15.5, 7, 11, 2.2)
        s.poly('robe', [(9, 7), (22, 7), (20, 2), (22, -1), (25, -3), (20, -3), (16, -1), (12, 3)])
        s.rect('gold', 10, 5, 21, 6)
        s.g('armL'); orb(s, 4.5, 3 + lift, 3, flare=flare); s.dots([(2, 6 + lift), (7, 6 + lift), (3, 7 + lift), (6, 7 + lift)], ('gold', 2)); s.g('body')
        face_front(s, eyes=(12, 18), y=11, mouth=False, blush=False)
        s.dots([(12, 10), (13, 10), (18, 10), (19, 10)], ('silver', 4)); s.dots([(14, 16), (15, 16), (16, 16), (17, 16)], ('silver', 4))
        s.dots([(15, 20), (15, 22), (16, 21), (16, 23)], ('silver', 2))
        s.dots([(15, 5), (16, 5), (15, 6), (16, 6), (14, 5), (17, 6)], ('orb', 3)); s.dot(15, 4, ('orb', 4))
        s.dots([(x, 35) for x in range(8, 24)], ('gold', 3)); s.dots([(15, y) for y in range(28, 35)] + [(16, y) for y in range(28, 35)], ('gold', 2))
        s.dots([(21, 26), (21, 27), (22, 28), (22, 29)], ('red', 1)); s.dots([(12, 30), (19, 32), (10, 33), (21, 30)], ('robe', 4))
    elif view == 'back':
        lift = -2 if atk == 0 else 0
        feet_front(s, 'leather')
        s.poly('robe', [(10, 20), (21, 20), (24, 36), (7, 36)])
        s.g('armL'); s.poly('robe', [(9, 20), (6, 27), (5, 28), (10, 28), (11, 22)]); s.ell('skin', 6.5, 28.5, 1.6, 1.6)
        s.g('armR'); s.poly('robe', [(22, 20), (25, 27), (26, 28), (21, 28), (20, 22)]); s.ell('skin', 24, 28.5, 1.6, 1.6); s.g('body')
        s.rect('red', 10, 26, 21, 27); s.rect('red', 18, 27, 19, 31)
        s.poly('silver', [(8, 12), (23, 12), (21, 22), (15.5, 24), (10, 22)])
        s.ell('silver', 15.5, 12.5, 8, 7)
        s.g('armR'); staff_line(s, 26.5, 5 + lift, 26.5, 38 + lift); orb(s, 26.5, 3 + lift, 3, flare=flare); s.dots([(24, 6 + lift), (29, 6 + lift)], ('gold', 2)); s.g('body')
        s.ell('robe', 15.5, 7, 11, 2.2)
        s.poly('robe', [(9, 7), (22, 7), (19, 3), (15, -1), (9, -3), (6, -2), (11, 1), (12, 3)])
        s.rect('gold', 10, 5, 21, 6)
        for x in (12, 15, 18): s.dots([(x, y) for y in range(13, 22)], ('silver', 2))
        s.dots([(x, 35) for x in range(8, 24)], ('gold', 3))
        s.dots([(15, 30), (16, 30), (15, 31), (16, 31), (14, 30), (17, 31), (15, 29), (16, 32)], ('gold', 3))
    else:
        feet_side(s, 'leather')
        s.poly('robe', [(11, 20), (19, 20), (22, 36), (9, 36)])
        s.poly('silver', [(8, 11), (13, 11), (13, 21), (10, 20), (8, 16)])
        s.rect('skin', 14, 17, 17, 19)
        s.ell('silver', 15.5, 12.5, 7.5, 7)
        s.ell('skin', 18, 12.5, 5, 5.5)
        s.poly('skin', [(22, 12), (24, 13), (22, 14)])
        s.poly('silver', [(17, 15), (23, 15), (22, 20), (19, 25), (17, 21)])
        s.g('armF')
        if atk is None:
            staff_line(s, 24.5, 5, 24.5, 38); orb(s, 24.5, 3, 3); s.dots([(22, 6), (27, 6)], ('gold', 2)); hand = (23.5, 28)
        elif atk == 0:
            staff_line(s, 23.5, 3, 23.5, 36); orb(s, 23.5, 1, 3); s.dots([(21, 4), (26, 4)], ('gold', 2)); hand = (22.5, 24)
        else:
            staff_line(s, 21, 34, 28, 8); orb(s, 28.5, 5, 3, flare=flare); s.dots([(26, 8), (31, 6)], ('gold', 2)); hand = (24, 24)
        s.poly('robe', [(15, 20), (19, 20), (hand[0] + 0.5, hand[1] - 1), (hand[0] + 0.5, hand[1] + 1), (18, 29), (15, 24)])
        s.ell('skin', hand[0], hand[1], 1.6, 1.6); s.g('body')
        s.rect('red', 10, 26, 20, 27)
        s.ell('robe', 15.5, 7, 10, 2.2)
        s.poly('robe', [(9, 7), (21, 7), (19, 2), (14, -1), (9, -3), (6, -2), (10, 1), (11, 3)])
        s.rect('gold', 9, 5, 21, 6); s.dots([(18, 5), (19, 5), (18, 6), (19, 6)], ('orb', 3))
        face_side(s, ex=20, y=11, mouth=False)
        s.dots([(20, 10), (21, 10)], ('silver', 4)); s.dots([(20, 16), (21, 16), (22, 16)], ('silver', 4))
        s.dots([(x, 35) for x in range(10, 22)], ('gold', 3))
    return s

# ------------------------------------------------------------------ MARKSMAN

def crossbow_front(s, dy=0, fired=False):
    s.rect('wood', 14, 22 + dy, 17, 30 + dy); s.rect('dsteel', 6, 24 + dy, 25, 25 + dy)
    if fired: s.line('cream', [(6, 25 + dy), (25, 25 + dy)])
    else:
        s.line('cream', [(6, 25 + dy), (15, 27 + dy), (25, 25 + dy)])
        s.dots([(15, 21 + dy), (16, 21 + dy)], ('steel', 4)); s.dot(15, 20 + dy, ('steel', 3))

def marksman(view, atk=None):
    s = Sprite()
    dy = {None: 0, 0: -3, 1: -3, 2: -1}[atk]
    if view == 'front':
        s.poly('blue', [(8, 19), (23, 19), (25, 31), (6, 31)])
        boots_front(s, 'leather', 'dleather')
        s.rect('leather', 10, 20, 21, 29)
        s.g('armL'); s.rect('blue', 7, 21, 9, 27); s.g('armR'); s.rect('blue', 22, 21, 24, 27); s.g('body')
        s.rect('dleather', 10, 28, 21, 29)
        s.line('dleather', [(10, 20), (21, 28)], 2)
        s.rect('skin', 14, 17, 17, 19)
        s.ell('blue', 15.5, 11, 8.5, 8)
        s.ell('skin', 15.5, 13, 5, 4.5)
        s.poly('hbrown', [(11, 9), (20, 9), (20, 11), (18, 10), (16, 11), (14, 10), (11, 11)])
        s.poly('blue', [(9, 18), (22, 18), (24, 22), (7, 22)])
        s.g('wpn'); crossbow_front(s, dy, fired=atk in (1, 2))
        s.g('armL'); s.ell('leather', 9, 26 + dy, 1.6, 1.6); s.g('armR'); s.ell('leather', 22, 26 + dy, 1.6, 1.6); s.g('body')
        face_front(s, eyes=(12, 18), y=13)
        s.dots([(x, 8) for x in range(11, 21)], ('blue', 0)); s.dots([(10, 13), (21, 13)], ('blue', 1)); s.dots([(15, 22), (16, 22)], ('gold', 3))
        s.dots([(12, 12), (13, 12), (18, 12), (19, 12)], ('hbrown', 1))
        if atk in (0, 1): s.dots([(12, 13), (13, 14)], ('skin', 2))
        s.dots([(10, 8), (11, 7), (12, 6)], ('blue', 4)); s.dots([(15, 3), (16, 3)], ('blue', 4))
        s.dots([(11, 33), (12, 33), (13, 33), (14, 33), (17, 33), (18, 33), (19, 33), (20, 33)], ('leather', 4))
        s.dots([(12, 35), (19, 35)], ('gold', 3)); s.dots([(16, 28), (17, 28)], ('gold', 3))
        s.dots([(11, 21), (13, 23), (15, 25), (17, 26), (19, 27)], ('leather', 4))
    elif view == 'back':
        boots_front(s, 'leather', 'dleather')
        s.rect('leather', 10, 20, 21, 29)
        s.g('armL'); s.rect('blue', 7, 21, 9, 27); s.ell('leather', 8, 28.5 + dy, 1.6, 1.6)
        s.g('armR'); s.rect('blue', 22, 21, 24, 27); s.ell('leather', 23, 28.5 + dy, 1.6, 1.6)
        s.g('wpn'); s.rect('dsteel', 3, 24 + dy, 28, 25 + dy); s.g('body')
        s.poly('blue', [(8, 19), (23, 19), (25, 31), (21, 32), (15.5, 31), (10, 32), (6, 31)])
        s.poly('leather', [(18, 14), (22, 16), (15, 31), (12, 29)])
        for i, c in enumerate(['red', 'cream', 'red']):
            if atk == 2 and i == 1: continue
            s.poly(c, [(19 + i * 2, 9 + i), (21 + i * 2, 10 + i), (20 + i * 2, 15 + i), (18 + i * 2, 14 + i)])
        s.ell('blue', 15.5, 11, 8.5, 8)
        s.poly('blue', [(13, 18), (18, 18), (15.5, 24)])
        s.dots([(19, 17), (17, 21), (15, 25)], ('gold', 3)); s.dots([(15, y) for y in range(4, 17)], ('blue', 1))
        s.dots([(10, 8), (11, 7), (12, 6)], ('blue', 4))
        for x in (11, 15, 20): s.dots([(x, y) for y in range(22, 30)], ('blue', 1))
    else:
        boots_side(s, 'leather', 'dleather')
        s.poly('blue', [(9, 19), (15, 19), (13, 31), (7, 31)])
        s.poly('leather', [(8, 14), (11, 13), (13, 27), (10, 28)])
        for i, c in enumerate(['red', 'cream', 'red']):
            s.poly(c, [(7 + i * 2, 9 - i), (9 + i * 2, 9 - i), (10 + i * 2, 14), (8 + i * 2, 14)])
        s.rect('leather', 11, 20, 19, 29); s.rect('dleather', 11, 28, 19, 29)
        s.rect('skin', 14, 17, 17, 19)
        s.ell('blue', 16, 11, 8, 8)
        s.ell('skin', 19, 13, 4.5, 4.5)
        s.poly('hbrown', [(16, 9), (22, 9), (22, 10), (19, 11), (16, 11)])
        s.poly('skin', [(22, 12), (24, 13), (22, 14)])
        s.poly('blue', [(10, 18), (20, 18), (21, 21), (9, 21)])
        rx = -1 if atk == 1 else 0
        s.g('wpn'); s.rect('wood', 13 + rx, 24 + dy, 27 + rx, 25 + dy); s.rect('dsteel', 26 + rx, 19 + dy, 27 + rx, 30 + dy)
        if atk in (1, 2): s.line('cream', [(26 + rx, 19 + dy), (26 + rx, 30 + dy)])
        else:
            s.line('cream', [(26 + rx, 19 + dy), (20 + rx, 24 + dy), (26 + rx, 30 + dy)])
            s.dots([(x, 23 + dy) for x in range(18 + rx, 27 + rx)], ('steel', 3)); s.dots([(28 + rx, 24 + dy), (28 + rx, 25 + dy)], ('steel', 4))
        s.g('armF'); s.rect('blue', 15, 21, 18, 26 + dy); s.ell('leather', 19, 26 + dy, 1.6, 1.6); s.g('body')
        face_side(s, ex=20, y=13)
        if atk in (0, 1): s.dot(21, 13, EYE); s.dot(20, 13, ('skin', 2))
        s.dots([(x, 9) for x in range(16, 23)], ('blue', 0)); s.dots([(10, 7), (11, 6), (12, 5)], ('blue', 4))
        s.dots([(x, 33) for x in range(13, 20)], ('leather', 4))
    return s

# ------------------------------------------------------------------ ROGUE

def rogue(view, atk=None):
    s = Sprite()
    if view == 'front':
        boots_front(s, 'dleather', 'dgreen')
        s.rect('green', 10, 20, 21, 29)
        s.poly('dleather', [(10, 20), (13, 20), (14, 29), (10, 29)]); s.poly('dleather', [(18, 20), (21, 20), (21, 29), (17, 29)])
        s.rect('leather', 10, 27, 21, 28)
        s.line('leather', [(11, 20), (20, 27)], 1); s.rect('dleather', 17, 22, 18, 26); s.dot(17, 22, ('gold', 3))
        s.rect('skin2', 14, 17, 17, 19)
        s.poly('dgreen', [(7, 17), (8, 9), (11, 5), (14, 3), (17, 1), (19, 3), (22, 6), (24, 11), (24, 17)])
        s.ell('dgreen', 15.5, 11.5, 8, 7)
        s.ell('skin2', 15.5, 12, 5.5, 4)
        s.poly('hblack', [(10, 13), (21, 13), (20, 17), (11, 17)])
        s.poly('red', [(11, 17), (20, 17), (20, 20), (11, 20)])
        s.poly('red', [(19, 18), (24, 21), (26, 26), (23, 25), (20, 20)])
        L = {None: 115, 0: 115, 1: 90, 2: 60}[atk]; Rr = {None: 65, 0: 90, 1: 65, 2: 120}[atk]
        s.g('armL'); s.rect('green', 7, 21, 9, 27); s.rect('cream', 7, 24, 9, 27); s.ell('dleather', 8, 28.5, 1.6, 1.6); dagger(s, 8, 29, L)
        s.dots([(7, 25), (8, 26), (9, 25)], ('cream', 1))
        s.g('armR'); s.rect('green', 22, 21, 24, 27); s.rect('cream', 22, 24, 24, 27); s.ell('dleather', 23, 28.5, 1.6, 1.6); dagger(s, 23, 29, Rr)
        s.dots([(22, 25), (23, 26), (24, 25)], ('cream', 1)); s.g('body')
        s.dots([(12, 11), (13, 11), (18, 11), (19, 11)], ('hblack', 2))
        s.dot(12, 12, WHITE); s.dot(13, 12, hx('#2e8a4a')); s.dot(18, 12, WHITE); s.dot(19, 12, hx('#2e8a4a'))
        s.dots([(13, 13), (19, 13)], EYE); s.dots([(x, 15) for x in range(12, 20, 2)], ('hblack', 2))
        s.dots([(10, 8), (11, 7), (12, 6), (14, 4), (15, 3)], ('dgreen', 4))
        s.dots([(15, 28), (16, 28)], ('gold', 3)); s.dots([(11, 26), (20, 26), (12, 24)], ('leather', 4))
        s.dots([(11, 35), (11, 36), (20, 35), (20, 36)], ('cream', 2))
    elif view == 'back':
        boots_front(s, 'dleather', 'dgreen')
        s.rect('dleather', 10, 20, 21, 29)
        L = {None: 115, 0: -120, 1: 115, 2: -100}[atk]; Rr = {None: 65, 0: 65, 1: -60, 2: -80}[atk]
        s.g('armL'); s.rect('green', 7, 21, 9, 27); s.rect('cream', 7, 24, 9, 27); s.ell('dleather', 8, 28.5, 1.6, 1.6); dagger(s, 8, 29 if L > 0 else 21, L)
        s.g('armR'); s.rect('green', 22, 21, 24, 27); s.rect('cream', 22, 24, 24, 27); s.ell('dleather', 23, 28.5, 1.6, 1.6); dagger(s, 23, 29 if Rr > 0 else 21, Rr)
        s.g('body')
        s.rect('leather', 10, 27, 21, 28)
        s.line('leather', [(11, 20), (20, 29)], 2); s.line('leather', [(20, 20), (11, 29)], 2)
        s.rect('red', 11, 17, 20, 20)
        s.poly('red', [(14, 19), (17, 19), (19, 27), (17, 26), (15.5, 29), (14, 26), (12, 27)])
        s.poly('dgreen', [(7, 17), (8, 9), (11, 5), (14, 3), (17, 1), (19, 3), (22, 6), (24, 11), (24, 17)])
        s.ell('dgreen', 15.5, 11.5, 8, 7)
        s.poly('dgreen', [(12, 16), (19, 16), (15.5, 21)])
        s.dots([(16, y) for y in range(3, 12)], ('dgreen', 1)); s.dots([(10, 7), (11, 6), (12, 5)], ('dgreen', 4))
        s.dots([(15, 28), (16, 28)], ('gold', 3))
    else:
        boots_side(s, 'dleather', 'dgreen')
        s.poly('red', [(12, 18), (6, 22), (4, 27), (8, 25), (12, 21)])
        if atk == 1:
            s.g('armB'); s.ell('dleather', 23, 22, 1.6, 1.6); dagger(s, 24, 22, -5); s.g('body')
        s.rect('green', 11, 20, 19, 29); s.poly('dleather', [(11, 20), (15, 20), (15, 29), (11, 29)])
        s.rect('leather', 11, 27, 19, 28)
        s.rect('skin2', 14, 17, 17, 19)
        s.poly('dgreen', [(9, 17), (8, 10), (7, 5), (5, 2), (10, 3), (15, 4), (21, 7), (23, 13), (23, 17)])
        s.ell('dgreen', 16, 11.5, 7.5, 7)
        s.ell('skin2', 19, 12, 4.5, 3.5)
        s.poly('hblack', [(16, 13), (23, 13), (24, 15), (21, 17), (16, 17)])
        s.rect('red', 13, 17, 20, 20)
        s.g('armF')
        hand, ang = {None: ((18, 28), 10), 0: ((22, 25), -5), 1: ((19, 27), 30), 2: ((21, 21), -50)}[atk]
        s.poly('green', [(15, 21), (18, 21), (hand[0], hand[1] - 1), (hand[0], hand[1] + 1), (15, 26)])
        s.rect('cream', 15, 24, 17, 26); s.ell('dleather', hand[0], hand[1], 1.6, 1.6); dagger(s, hand[0] + 1, hand[1], ang)
        s.g('body')
        s.dot(20, 12, WHITE); s.dot(21, 12, hx('#2e8a4a')); s.dot(21, 13, EYE); s.dots([(20, 11), (21, 11)], ('hblack', 2))
        s.dots([(7, 4), (8, 5), (9, 5), (11, 4)], ('dgreen', 4)); s.dots([(16, 28), (17, 28)], ('gold', 3))
    return s

# ------------------------------------------------------------------ WITCH

def witch(view, atk=None):
    s = Sprite()
    lift = {None: 0, 0: -4, 1: 1, 2: 0}[atk]
    glow = atk in (0, 1)
    hand_dy = min(lift, 0) * 0.5
    def stockings():
        s.g('legL'); s.rect('black', 12, 33, 14, 36); s.poly('black', [(10, 36), (14, 36), (14, 38), (9, 38)])
        s.dots([(x, 34) for x in range(12, 15)] + [(x, 36) for x in range(12, 15)], ('wpurple', 3))
        s.g('legR'); s.rect('black', 17, 33, 19, 36); s.poly('black', [(17, 36), (21, 36), (22, 38), (17, 38)])
        s.dots([(x, 34) for x in range(17, 20)] + [(x, 36) for x in range(17, 20)], ('wpurple', 3)); s.g('body')
    if view == 'front':
        stockings()
        s.poly('ginger', [(7, 12), (24, 12), (24, 26), (20, 24), (11, 24), (7, 26)])
        s.poly('witch', [(11, 20), (20, 20), (24, 33), (7, 33)])
        s.rect('wpurple', 11, 20, 20, 25)
        s.g('armR'); s.rect('witch', 22, 21, 24, 27); s.ell('skin', 23, 28.5, 1.6, 1.6); s.g('body')
        s.rect('leather', 10, 25, 21, 26)
        s.ell('vial_g', 12, 28, 1.2, 1.5); s.ell('vial_p', 19, 28, 1.2, 1.5); s.dots([(12, 26), (19, 26)], ('cream', 2)); s.dots([(12, 27), (19, 27)], WHITE)
        s.rect('skin', 14, 17, 17, 19)
        s.ell('ginger', 15.5, 12.5, 7.5, 7)
        s.ell('skin', 15.5, 13, 5.5, 5)
        s.poly('ginger', [(9, 8), (22, 8), (21, 11), (17, 10), (13, 11), (10, 11)])
        s.ell('wpurple', 15.5, 8, 13, 2.4)
        s.poly('wpurple', [(10, 8), (21, 8), (20, 3), (22, 0), (26, -2), (20, -2), (16, 0), (13, 3)])
        s.rect('pink', 10, 6, 21, 7); s.rect('gold', 15, 6, 16, 7)
        s.g('armL'); hex_staff(s, 5, 7 + lift, 38 + lift, glow); s.rect('witch', 7, 21, 9, 27); s.ell('skin', 6, 28 + hand_dy, 1.6, 1.6); s.g('body')
        face_front(s, eyes=(12, 18), y=12)
        s.dots([(11, 12), (20, 12)], EYE); s.dots([(13, 15), (18, 15), (12, 15)], ('skin', 1)); s.dots([(15, 16), (16, 16)], ('pink', 2))
        s.dots([(x, 32) for x in range(8, 24) if x % 2 == 0], ('witch', 4)); s.dots([(x, 33) for x in range(7, 25) if x % 2 == 1], ('witch', 0))
        s.dots([(15, 21), (16, 22), (15, 23), (16, 24)], ('cream', 3))
        for x in (10, 21): s.dots([(x, y) for y in range(14, 24, 2)], ('ginger', 1))
    elif view == 'back':
        stockings()
        s.poly('witch', [(11, 20), (20, 20), (24, 33), (7, 33)])
        s.g('armL'); s.rect('witch', 7, 21, 9, 27); s.ell('skin', 8, 28.5, 1.6, 1.6); s.g('body')
        s.g('armR'); s.rect('witch', 22, 21, 24, 27); hex_staff(s, 26, 7 + lift, 38 + lift, glow); s.ell('skin', 25, 28 + hand_dy, 1.6, 1.6); s.g('body')
        s.poly('ginger', [(7, 11), (24, 11), (23, 27), (19, 29), (15.5, 27), (12, 29), (8, 27)])
        s.ell('ginger', 15.5, 12.5, 8, 7)
        s.poly('pink', [(13, 22), (15, 23), (16, 23), (18, 22), (18, 25), (16, 24), (15, 24), (13, 25)])
        s.ell('wpurple', 15.5, 8, 13, 2.4)
        s.poly('wpurple', [(10, 8), (21, 8), (19, 2), (16, -1), (11, -3), (7, -2), (12, 1), (12, 4)])
        s.rect('pink', 10, 6, 21, 7)
        for x in (11, 14, 17, 20): s.dots([(x, y) for y in range(14, 26)], ('ginger', 1))
        s.dots([(x, 32) for x in range(8, 24) if x % 2 == 0], ('witch', 4))
    else:
        s.g('legB'); s.rect('black', 14, 33, 16, 36); s.poly('black', [(13, 36), (17, 36), (19, 38), (13, 38)]); s.dots([(x, 34) for x in range(14, 17)] + [(x, 36) for x in range(14, 17)], ('wpurple', 3))
        s.g('legF'); s.rect('black', 16, 33, 18, 36); s.poly('black', [(16, 36), (19, 36), (22, 38), (16, 38)]); s.dots([(x, 34) for x in range(16, 19)] + [(x, 36) for x in range(16, 19)], ('wpurple', 3))
        s.g('body')
        s.poly('ginger', [(7, 11), (14, 11), (14, 24), (10, 27), (6, 25), (8, 20)])
        s.poly('witch', [(12, 20), (19, 20), (22, 33), (9, 33)])
        s.rect('wpurple', 12, 20, 19, 25); s.rect('leather', 11, 25, 20, 26)
        s.ell('vial_g', 13, 28, 1.2, 1.5); s.dot(13, 27, WHITE)
        s.rect('skin', 14, 17, 17, 19)
        s.ell('ginger', 15.5, 12.5, 7, 7)
        s.ell('skin', 18.5, 13, 4.5, 5)
        s.poly('skin', [(22, 12), (25, 14), (22, 15)])
        s.poly('ginger', [(13, 8), (22, 8), (22, 10), (17, 11), (14, 11)])
        s.ell('wpurple', 16, 8, 12, 2.4)
        s.poly('wpurple', [(10, 8), (21, 8), (19, 2), (15, -1), (10, -3), (6, -2), (11, 1), (12, 4)])
        s.rect('pink', 10, 6, 21, 7)
        s.g('armF'); hex_staff(s, 23, 7 + lift, 38 + lift, glow)
        s.rect('witch', 15, 21, 18, 26); s.poly('witch', [(16, 24), (19, 24), (22, 28 + hand_dy), (20, 29 + hand_dy)])
        s.ell('skin', 22, 27 + hand_dy, 1.6, 1.6); s.g('body')
        face_side(s, ex=20, y=12); s.dot(22, 12, EYE); s.dots([(21, 15), (22, 15)], ('skin', 1))
        s.dots([(x, 32) for x in range(10, 22) if x % 2 == 0], ('witch', 4))
    return s


HEROES = {'knight': knight, 'mage': mage, 'marksman': marksman, 'rogue': rogue, 'witch': witch}
VIEWS = ['front', 'side', 'back']

# Walk: contact, pass (bob up), contact (other foot), pass.
_PASS_F = {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}
_PASS_S = {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0)}
WALK = {
    'front': [{'legL': (0, -1), 'armL': (0, 1), 'armR': (0, -1)}, _PASS_F,
              {'legR': (0, -1), 'armL': (0, -1), 'armR': (0, 1)}, _PASS_F],
    'side': [{'legF': (2, 0), 'legB': (-2, -1), 'armF': (-1, 0)}, _PASS_S,
             {'legF': (-2, -1), 'legB': (2, 0), 'armF': (1, 0), 'armB': (1, 0)}, _PASS_S],
}
WALK['back'] = WALK['front']
# Attack: wind-up, strike, follow-through.
ATTACK = {
    'front': [{'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}, {}],
    'side': [{'body': (-1, 0), 'legF': (0, 0), 'legB': (0, 0)}, {'body': (1, 0), 'legF': (1, 0), 'legB': (-1, 0)}, {'legB': (-1, 0)}],
    'back': [{'body': (0, 1), 'legL': (0, 0), 'legR': (0, 0)}, {'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0)}, {}],
}

def frames(hero):
    """{'idle': {view: img}, 'walk': {view: [4 imgs]}, 'attack': {view: [3 imgs]}} for one hero."""
    fn = HEROES[hero]; out = {'idle': {}, 'walk': {}, 'attack': {}}
    for v in VIEWS:
        base = fn(v)
        out['idle'][v] = base.render()
        out['walk'][v] = [base.render(p) for p in WALK[v]]
        out['attack'][v] = [fn(v, i).render(ATTACK[v][i]) for i in range(3)]
    return out

def render_all():
    return {k: frames(k)['idle'] for k in HEROES}
