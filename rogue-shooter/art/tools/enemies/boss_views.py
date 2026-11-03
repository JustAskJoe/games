"""Extra boss facings (added Nov 2, 2026), for bosses whose fight needs them:
- Pack Leader Wolf and Cavern Wyrm charge across the arena, so they get side views (facing right; flip for left).
- The Meadow Guardian takes extra damage from behind, so it gets a back view with the glowing knot
  (drawn in bosses_major.guardian when view == 'back').
Import after bosses_mini and bosses_major; it adds the views to the registry.
"""
import math
from ekit import ENEMIES, R, WHITE, EYE, hx, blob, line_dots, glow, new
import bosses_mini, bosses_major  # noqa: F401
from bosses_major import ccrys, CY

RED = hx('#ff3a2a')

def pack_leader_side(f):
    s = new('pack_leader')
    k = int(f[1]); atk = k if f[0] == 'a' else None
    # far legs and tail
    s.g('legB'); s.rect('furd', 15, 33, 17, 43); s.rect('furd', 33, 33, 35, 43)
    s.g('tail'); blob(s, 'furd', [('poly', [(14, 24), (6, 18), (1, 20), (4, 24), (2, 28), (8, 28), (14, 30)])]); s.dots([(4, 21), (6, 20)], ('furd', 3))
    s.g('body')
    blob(s, 'furd', [('ell', 25, 30, 15, 7.5)])
    s.dots([(16, 27), (20, 25), (26, 24)], ('furd', 3)); s.dots([(18, 35), (24, 36), (30, 36)], ('furd', 1))
    s.g('legF')
    s.rect('furd', 18, 33, 21, 44); s.ell('furd', 20, 44.5, 2.8, 1.3)
    s.rect('furd', 36, 33, 39, 44); s.ell('furd', 38.5, 44.5, 2.8, 1.3)
    s.dots([(19, 45), (21, 45), (37, 45), (39, 45)], ('furd', 0))
    s.g('body')
    # white mane over the shoulders, necklace of teeth
    blob(s, 'furl', [('poly', [(36, 16), (33, 19), (35, 21), (32, 24), (35, 26), (33, 29), (37, 30), (38, 34), (41, 31), (44, 32), (45, 26), (44, 20), (41, 15)])])
    s.dots([(37, 22), (39, 27), (41, 24), (36, 26)], ('furl', 2))
    for i, (x, y) in enumerate(((36, 31), (38, 32), (40, 31), (42, 29))):
        s.dots([(x, y), (x, y + 1)], ('bone', 4)); s.dot(x, y + 2, ('bone', 2))
    s.g('head')
    howl = atk == 1
    if howl:
        blob(s, 'furd', [('ell', 44, 16, 6.5, 6), ('poly', [(46, 12), (52, 2), (55, 4), (51, 14)])])
        s.poly('furd', [(40, 12), (38, 4), (43, 9)])
        s.dots([(52, 3), (53, 4)], EYE); s.dots([(50, 9), (51, 10), (49, 11)], ('furd', 0)); s.dot(46, 12, RED)
    else:
        blob(s, 'furd', [('ell', 44, 18, 7, 6), ('poly', [(46, 16), (55, 18), (55, 22), (46, 24)])])
        s.poly('furd', [(40, 14), (38, 5), (44, 10)]); s.poly('furd', [(43, 13), (43, 4), (47, 11)])
        s.dots([(55, 18), (55, 19)], EYE)
        s.dots([(47, 16), (48, 16)], RED); s.dot(48, 16, EYE)
        s.dots([(45, 13), (46, 14), (47, 15)], ('pink', 3))     # scar over the eye
        if atk is not None: s.dots([(50, 23), (52, 23), (54, 23)], WHITE)
        else: line_dots(s, [(48, 23), (54, 22)], ('furd', 0))
        s.dots([(41, 8), (42, 9)], ('pink', 2))
    s.g('body')
    if atk is None:
        pose = [{'legF': (1, 0), 'legB': (-1, 0), 'tail': (0, 0)}, {'body': (0, -1), 'head': (0, -1), 'legF': (0, 0), 'legB': (0, 0), 'tail': (0, -1)},
                {'legF': (-1, 0), 'legB': (1, 0), 'tail': (0, 1)}, {'body': (0, -1), 'head': (0, -1), 'legF': (0, 0), 'legB': (0, 0), 'tail': (0, -1)}][k]
        return s, pose
    pose = [{'body': (0, 1), 'head': (1, 3), 'legF': (0, 0), 'legB': (0, 0), 'tail': (0, 1)}, {'head': (0, -1), 'tail': (0, -2)},
            {'body': (0, 1), 'head': (0, 1), 'legF': (0, 0), 'legB': (0, 0)}][atk]
    return s, pose, (glow('#ff9a40', steps=((1, 120), (2, 50))) if howl else None)

def cavern_wyrm_side(f):
    s = new('cavern_wyrm')
    k = int(f[1]); atk = k if f[0] == 'a' else None
    flap = (0, -3, -5, -2)[k] if atk is None else (-5, -2, 0)[atk]
    # far wing (behind), far legs
    s.g('wingB')
    s.poly('crystal', [(50, 48), (40, 10 + flap), (54, 4 + flap), (64, 18 + flap // 2), (62, 46)])
    s.g('legB'); blob(s, 'drag', [('ell', 40, 76, 5, 8)]); blob(s, 'drag', [('ell', 74, 76, 5, 8)])
    s.g('body')
    # tail to the left with crystal spines
    blob(s, 'drag', [('line', [(32, 64), (18, 70), (8, 76), (3, 84)], 8)])
    for x, y in ((20, 66), (10, 72), (5, 80)): ccrys(s, x, y, 6, 3, -2)
    blob(s, 'drag', [('ell', 54, 62, 26, 15)])
    blob(s, 'ice', [('ell', 56, 70, 20, 7)])
    for x in range(40, 74, 5): s.dots([(x, 68), (x + 1, 69), (x - 1, 69)], ('ice', 1)); s.dot(x, 69, ('ice', 4))
    for x in range(34, 74, 8): ccrys(s, x, 49 - (2 if 44 < x < 64 else 0), 7, 3, -1)
    # neck and head, pointing right
    s.g('head')
    lift = {None: 0, 0: -6, 1: -2, 2: 3}[atk]
    hy = 30 + lift
    blob(s, 'drag', [('poly', [(70, 58), (80, 48), (88, hy + 8), (94, hy + 12), (84, 60)])])
    blob(s, 'ice', [('poly', [(80, 58), (86, 50), (92, hy + 12), (88, hy + 14), (84, 56)])])
    open_ = atk in (1, 2)
    blob(s, 'drag', [('ell', 94, hy + 4, 9, 7), ('poly', [(98, hy), (111, hy + 4), (111, hy + 8), (99, hy + 10)])])
    if open_:
        blob(s, 'crystal', [('poly', [(100, hy + 9), (111, hy + 9), (111, hy + 13), (100, hy + 11)])])
        s.dots([(103, hy + 9), (106, hy + 9), (109, hy + 9)], WHITE)
        blob(s, 'drag', [('poly', [(99, hy + 11), (110, hy + 13), (108, hy + 16), (99, hy + 14)])])
    else:
        line_dots(s, [(100, hy + 8), (110, hy + 7)], ('drag', 0))
    ccrys(s, 90, hy - 2, 12, 3, -6); ccrys(s, 94, hy - 3, 9, 3, -4); ccrys(s, 87, hy + 2, 8, 3, -7)
    s.dots([(97, hy + 2), (98, hy + 2), (99, hy + 2), (97, hy + 3), (98, hy + 3)], CY); s.dot(97, hy + 2, WHITE)
    s.dots([(96, hy), (97, hy), (98, hy)], ('drag', 0)); s.dot(110, hy + 5, ('drag', 0))
    s.g('body')
    # near legs and near wing (in front)
    s.g('legF')
    blob(s, 'drag', [('ell', 46, 76, 6, 9), ('ell', 48, 86, 6, 3.5)]); blob(s, 'drag', [('ell', 80, 76, 6, 9), ('ell', 82, 86, 6, 3.5)])
    s.dots([(51, 89), (53, 88), (85, 89), (87, 88)], ('crystal', 4))
    s.g('wingF')
    tips = [(30, 10 + flap), (46, 2 + flap), (60, 14 + flap // 2)]
    sh = (56, 50)
    pts = [sh, (36, 30 + flap // 2), tips[0], (40, 18 + flap), tips[1], (52, 20 + flap), tips[2], (60, 40)]
    s.poly('crystal', pts)
    for t in tips[:3]: line_dots(s, [sh, t], ('drag', 1))
    s.dot(*tips[1], WHITE)
    s.g('body')
    if atk is None:
        pose = [{'legF': (1, 0), 'legB': (-1, 0)}, {'body': (0, -1), 'head': (0, -1), 'legF': (0, 0), 'legB': (0, 0)},
                {'legF': (-1, 0), 'legB': (1, 0)}, {'body': (0, -1), 'head': (0, -1), 'legF': (0, 0), 'legB': (0, 0)}][k]
        return s, pose, glow('#7ee0f0', steps=((1, 50),))
    return s, {'body': ((-1, 0, 1)[atk], 0), 'legF': (0, 0), 'legB': (0, 0)}, glow('#7ee0f0', steps=((1, 140), (2, 70), (3, 30)) if open_ else ((1, 60),))

def add_view(key, view, fn):
    e = ENEMIES[key]; base = e['fn']
    def disp(v, f, var=None, _b=base):
        return fn(f) if v == view else _b(v, f, var)
    e['fn'] = disp
    if view not in e['views']: e['views'] = e['views'] + [view]

add_view('pack_leader', 'side', pack_leader_side)
add_view('cavern_wyrm', 'side', cavern_wyrm_side)
ENEMIES['guardian']['views'] = ENEMIES['guardian']['views'] + ['back'] if 'back' not in ENEMIES['guardian']['views'] else ENEMIES['guardian']['views']
