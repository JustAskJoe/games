"""The six Barn pen animals in the hero style. Side views face right (the game flips them);
each has a 4-frame walk and a 2-frame idle action (peck, graze, sniff, chew). Bees live in a
hive with a little swarm. The dog reuses the combat dog (combat/fx.py) so the pen and the
battlefield show the same animal.
"""
import os, sys, math
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'enemies'))
from ekit import Sprite, R, ramp, WHITE, EYE, blob, canvas, put, disc, pil

R.update({
    'hen':    ramp('#5a4a3e', '#a8988a', '#e4dccc', '#f6f0e4', '#ffffff'),
    'comb':   ramp('#4a0a0a', '#8e1a14', '#d0302a', '#f05a40', '#ffa080'),
    'beak':   ramp('#5a3000', '#a05a00', '#e09a14', '#ffc040', '#fff0a0'),
    'cowh':   ramp('#5a5048', '#a09888', '#e0d8cc', '#f4f0e8', '#ffffff'),
    'cowp':   ramp('#140e0c', '#26201c', '#3a302a', '#544840', '#766a5e'),
    'snout':  ramp('#5a2434', '#9a4a5e', '#e08a9e', '#f4b4c2', '#ffe0e8'),
    'pigs':   ramp('#5a2a38', '#a65a6c', '#e8949e', '#f8bcc0', '#ffe4e4'),
    'goat':   ramp('#4a3e30', '#8a7a62', '#c8b694', '#e6d8bc', '#fffaf0'),
    'horng':  ramp('#2a2420', '#4e4640', '#7a7066', '#a69a8a', '#d4c8b4'),
    'hive':   ramp('#5a3a0a', '#946414', '#d0982c', '#ecc25a', '#fff0a0'),
    'bee':    ramp('#2a1a00', '#5a3a00', '#e0a810', '#ffd840', '#fff8c0'),
})

def walk_pose(f):
    return [{'legF': (1, 0), 'legB': (-1, 0), 'legF2': (-1, 0), 'legB2': (1, 0)}, {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0), 'legF2': (0, 0), 'legB2': (0, 0)},
            {'legF': (-1, 0), 'legB': (1, 0), 'legF2': (1, 0), 'legB2': (-1, 0)}, {'body': (0, -1), 'legF': (0, 0), 'legB': (0, 0), 'legF2': (0, 0), 'legB2': (0, 0)}][f]

# ------------------------------------------------------------------ chicken (16x16)

def chicken(peck=False):
    s = Sprite(16, 16, 0)
    s.g('legB'); s.line('beak', [(6, 11), (6, 14)], 1); s.g('legF'); s.line('beak', [(9, 11), (9, 14)], 1); s.dot(10, 14, ('beak', 2))
    s.g('body'); blob(s, 'hen', [('ell', 7, 9, 5, 3.6), ('poly', [(2, 9), (1, 5), (4, 7)])]); s.ell('hen', 6, 9, 2.6, 1.8)
    s.g('head')
    blob(s, 'hen', [('ell', 11, 5, 2.6, 2.8)])
    s.poly('beak', [(13, 5), (15, 6), (13, 7)]); s.dots([(11, 2), (12, 2), (11, 1)], ('comb', 3)); s.dot(13, 8, ('comb', 2))
    s.dot(12, 5, EYE)
    return s

# ------------------------------------------------------------------ cow (32x24)

def cow():
    s = Sprite(32, 24, 0)
    s.g('legB'); s.rect('cowh', 6, 15, 7, 21); s.rect('cowp', 6, 21, 7, 22); s.rect('cowh', 19, 15, 20, 21); s.rect('cowp', 19, 21, 20, 22)
    s.g('body')
    s.line('cowh', [(4, 10), (2, 16)], 1); s.dot(2, 17, ('cowp', 2))
    blob(s, 'cowh', [('ell', 13, 12, 10, 5.5)])
    s.ell('cowp', 9, 10, 3.6, 2.6); s.ell('cowp', 17, 14, 3, 2.2); s.ell('cowp', 14, 9, 1.6, 1.2)
    s.ell('snout', 12, 17, 2.4, 1.4)
    s.g('legF'); s.rect('cowh', 8, 15, 10, 22); s.rect('cowp', 8, 22, 10, 23); s.rect('cowh', 21, 15, 23, 22); s.rect('cowp', 21, 22, 23, 23)
    s.g('head')
    blob(s, 'cowh', [('ell', 26, 8, 3.6, 3.6), ('poly', [(26, 7), (30, 9), (30, 13), (26, 12)])])
    s.ell('snout', 29, 11, 2, 2); s.dot(29, 11, ('snout', 1)); s.dot(30, 12, ('snout', 1))
    s.poly('cowp', [(22, 6), (24, 5), (24, 8)]); s.line('horng', [(25, 4), (24, 2)], 1)
    s.dot(27, 7, EYE); s.dot(27, 6, ('cowh', 4))
    return s

# ------------------------------------------------------------------ pig (24x18)

def pig():
    s = Sprite(24, 18, 0)
    s.g('legB'); s.rect('pigs', 5, 13, 6, 16); s.rect('pigs', 15, 13, 16, 16)
    s.g('body'); blob(s, 'pigs', [('ell', 11, 10, 8, 5)])
    s.dots([(3, 8), (2, 7), (3, 6)], ('pigs', 1))
    s.g('legF'); s.rect('pigs', 7, 13, 9, 17); s.rect('pigs', 17, 13, 19, 17); s.dots([(8, 17), (18, 17)], ('pigs', 0))
    s.g('head'); blob(s, 'pigs', [('ell', 18, 8, 4, 3.8)])
    s.ell('snout', 22, 9, 1.6, 2); s.dots([(22, 8), (22, 10)], ('snout', 0))
    s.poly('pigs', [(16, 5), (17, 2), (19, 5)]); s.dot(17, 4, ('snout', 1))
    s.dot(19, 7, EYE); s.dot(19, 6, WHITE)
    return s

# ------------------------------------------------------------------ goat (26x22)

def goat():
    s = Sprite(26, 22, 0)
    s.g('legB'); s.rect('goat', 5, 13, 6, 19); s.rect('goat', 15, 13, 16, 19); s.dots([(5, 19), (6, 19), (15, 19), (16, 19)], ('horng', 0))
    s.g('body'); blob(s, 'goat', [('ell', 11, 11, 7.5, 4.5)]); s.poly('goat', [(4, 8), (2, 6), (3, 9)])
    s.g('legF'); s.rect('goat', 7, 13, 8, 20); s.rect('goat', 17, 13, 18, 20); s.dots([(7, 20), (8, 20), (17, 20), (18, 20)], ('horng', 0))
    s.g('head')
    blob(s, 'goat', [('poly', [(17, 9), (19, 4), (22, 4), (25, 9), (23, 10), (19, 10)])])
    s.poly('goat', [(21, 10), (23, 10), (22, 14)])
    s.line('horng', [(19, 4), (17, 1), (15, 1)], 1); s.poly('goat', [(17, 5), (14, 6), (17, 7)])
    s.dot(21, 6, EYE); s.dot(20, 6, ('goat', 4)); s.dot(24, 8, ('horng', 1))
    return s

# ------------------------------------------------------------------ bees and hive (24x28)

def hive(frame):
    s = Sprite(24, 28, 0)
    s.rect('wood', 3, 22, 21, 25); s.rect('wood', 5, 25, 6, 27); s.rect('wood', 18, 25, 19, 27)
    blob(s, 'hive', [('ell', 12, 14, 8, 8.5)])
    for y in (9, 13, 17): s.dots([(x, y) for x in range(6, 19)], ('hive', 1))
    s.ell('cowp', 12, 19, 2, 1.6)
    s.dots([(8, 8), (9, 7), (7, 11)], ('hive', 4))
    im = s.render()
    a = np.array(im)
    a = np.pad(a, ((0, 0), (0, 0), (0, 0)))
    bees = [(3 + frame * 2, 4), (19 - frame, 6 + frame), (12 + (frame % 2) * 3, 1 + frame), (21, 14 - frame * 2)]
    for bx, by in bees:
        put(a, bx, by, R['bee'][3]); put(a, bx + 1, by, R['bee'][0]); put(a, bx, by - 1, WHITE, 200)
    return pil(a)

# ------------------------------------------------------------------ frames

def anim(fn, idle_pose):
    s = fn()
    walk = [s.render(walk_pose(i)) for i in range(4)]
    idle = [s.render(), s.render(idle_pose)]
    return walk, idle

def chicken_frames():
    s = chicken()
    walk = [s.render(walk_pose(i)) for i in range(4)]
    idle = [s.render(), s.render({'head': (1, 3)})]
    return walk, idle

ANIMALS = [('Chicken', chicken_frames, 'Lays seeds: 2, 5 or 9 a round for one, two or three hens.', 'peck'),
           ('Cow', lambda: anim(cow, {'head': (0, 3)}), 'Gives random materials each round.', 'graze'),
           ('Pig', lambda: anim(pig, {'head': (1, 2)}), 'Digs up gold each round.', 'sniff'),
           ('Goat', lambda: anim(goat, {'head': (0, 2)}), 'Gives materials of your choice each round.', 'chew'),
           ('Bees', lambda: (None, [hive(i) for i in range(4)]), 'Make Spore Dust each round.', 'buzz')]
