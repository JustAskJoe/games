"""Crop plots: every crop in four growth stages (seed, sprout, growing, ready) on a tilled plot.

Plots follow the 16-px tile grid: quick and standard crops 1x1 (16x16), rare 1x2 (32x16),
legendary 2x2 (32x32). Void crops grow on the Void plot (32x32, black soil with neon cracks).
The plant is drawn with the hero toolkit (shading and colored outlines) on a canvas a little
taller than the plot so leaves and flowers can rise above it.

Each plant function takes a T (a drawing helper with the base of the plant as its origin,
y going up as negative numbers, and a size factor k) and `ripe`: False draws the leafy
"growing" stage, True adds the produce.
"""
import os, sys, math, random
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'enemies'))
from ekit import Sprite, R, ramp, hx, WHITE, EYE, blob, glow, canvas, put, disc, sparkle, pil

R.update({
    'yel':    ramp('#5a4000', '#a07a00', '#e0b810', '#ffe040', '#fffac0'),
    'ice':    ramp('#1e4660', '#3a7090', '#68a6c4', '#a0d6ea', '#e0f8ff'),
    'heart':  ramp('#4a0c18', '#8a1a2a', '#d0303c', '#f4646a', '#ffb4b4'),
    'stem':   ramp('#163a14', '#2a6022', '#3f8a34', '#57a940', '#80c656'),
    'leafy':  ramp('#1c4a18', '#2c6626', '#3f8a34', '#6cb046', '#a8dc78'),
    'wheat':  ramp('#5a400e', '#946c1c', '#d0a438', '#ecc85c', '#fff0a0'),
    'chili':  ramp('#4a0c0c', '#8e1c18', '#d0302a', '#f05a40', '#ffb090'),
    'berryb': ramp('#0e1e4a', '#1c3a86', '#3a66c8', '#74a0ec', '#d0e8ff'),
    'turnip': ramp('#2a0e3a', '#5a2a7a', '#9a5ab8', '#d8a0e6', '#fff0ff'),
    'mushp':  ramp('#1a0c2a', '#3a1c5a', '#62349a', '#9a64d0', '#dcb8ff'),
    'cap':    ramp('#4a3a2a', '#8a7a62', '#c8b896', '#e8dcc0', '#fffaf0'),
    'ironv':  ramp('#1c242c', '#36424e', '#5a6a78', '#8c9cac', '#d0dce8'),
    'blood':  ramp('#2a0410', '#5a0a1e', '#9a1430', '#d02c44', '#f47080'),
    'dragon': ramp('#4a0a28', '#8a1a4a', '#d0306e', '#f46ca0', '#ffc0dc'),
    'cactus': ramp('#0e3220', '#1a5a34', '#2e8a4c', '#56b868', '#a0e4a0'),
    'quartz': ramp('#1e4660', '#3a7090', '#68a6c4', '#a0d6ea', '#f0fcff'),
    'stormp': ramp('#4a3a00', '#8a6c00', '#d4b010', '#ffe040', '#fffad0'),
    'vblos':  ramp('#12061e', '#2a0e44', '#4a1a78', '#7a36b8', '#b07ae6'),
    'neonv':  ramp('#3a0a4a', '#7a14a0', '#c030e8', '#ec7cff', '#ffe0ff'),
    'cyan':   ramp('#04343a', '#08646e', '#10a8b4', '#4ce8ec', '#d0ffff'),
    'sapl':   ramp('#24160c', '#4a3018', '#76502a', '#a07440', '#c8a066'),
    'ibark':  ramp('#1a1c22', '#363a44', '#5a606c', '#8a92a0', '#c4ccd8'),
    'mirror': ramp('#3a4656', '#6a7c90', '#a4b6c8', '#dae6f0', '#ffffff'),
    'phoen':  ramp('#5a1004', '#a8280a', '#ec5a14', '#ffa030', '#fff090'),
    'wtree':  ramp('#2a3a0a', '#4a6a14', '#7aa020', '#b8d040', '#f4f4a0'),
    'starf':  ramp('#5a4000', '#a07a00', '#e8c018', '#fff060', '#ffffe0'),
    'soul':   ramp('#1a2a4a', '#2e4a7a', '#5a86c0', '#a0c8f0', '#f0faff'),
    'vstem':  ramp('#08080e', '#14141e', '#22223a', '#3a3a5e', '#5c5c8a'),
    'nullw':  ramp('#4a4a56', '#7a7a88', '#b0b0be', '#dcdce6', '#ffffff'),
    'rift':   ramp('#4a0428', '#8a0a4e', '#d01c7e', '#ff5ab4', '#ffd0ec'),
})

class T:
    """Draws on Sprite s with the plant base at (bx, by); coordinates are scaled by k."""
    def __init__(self, s, bx, by, k=1.0): self.s, self.bx, self.by, self.k = s, bx, by, k
    def P(self, x, y): return (self.bx + x * self.k, self.by + y * self.k)
    def ell(self, m, x, y, rx, ry): X, Y = self.P(x, y); self.s.ell(m, X, Y, max(0.6, rx * self.k), max(0.6, ry * self.k))
    def poly(self, m, pts): self.s.poly(m, [self.P(x, y) for x, y in pts])
    def line(self, m, pts, w=1): self.s.line(m, [self.P(x, y) for x, y in pts], w)
    def blob(self, m, shapes):
        out = []
        for sh in shapes:
            if sh[0] == 'ell': X, Y = self.P(sh[1], sh[2]); out.append(('ell', X, Y, max(0.6, sh[3] * self.k), max(0.6, sh[4] * self.k)))
            else: out.append(('poly', [self.P(x, y) for x, y in sh[1]]))
        blob(self.s, m, out)
    def dot(self, x, y, c): X, Y = self.P(x, y); self.s.dot(int(round(X)), int(round(Y)), c)
    def dots(self, pts, c):
        for p in pts: self.dot(p[0], p[1], c)

def leaf(t, m, x, y, ang, L=4, W=1.6):
    """A pointed leaf from (x, y) at angle ang (radians, 0 = right, -pi/2 = up)."""
    c, s_ = math.cos(ang), math.sin(ang); px, py = -s_, c
    t.poly(m, [(x, y), (x + c * L * 0.5 + px * W, y + s_ * L * 0.5 + py * W), (x + c * L, y + s_ * L), (x + c * L * 0.5 - px * W, y + s_ * L * 0.5 - py * W)])

def fan(t, m, n, L, spread=2.2, y=0, W=1.6, up=-math.pi / 2):
    for i in range(n):
        a = up + (i - (n - 1) / 2) * spread / max(1, n - 1)
        leaf(t, m, 0, y, a, L * (0.85 + 0.15 * ((i + 1) % 2)), W)

def star(t, m, x, y, r):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * 0.45
        pts.append((x + math.cos(a) * rr, y + math.sin(a) * rr))
    t.poly(m, pts)

# ------------------------------------------------------------------ quick crops (1 round, 1x1)

def healing_herb(t, ripe):
    t.blob('leafy', [('ell', -3, -4, 3, 2.6), ('ell', 3, -4, 3, 2.6), ('ell', 0, -7, 3, 2.8)])
    t.dots([(-3, -6), (0, -9)], ('leafy', 4))
    if ripe: t.dots([(-4, -3), (2, -5), (4, -2), (-1, -8)], ('chili', 3)); t.dots([(-4, -4), (2, -6)], ('chili', 4))

def pep_root(t, ripe):
    fan(t, 'leafy', 3, 7, 1.4, W=1.2)
    if ripe: t.blob('orange', [('poly', [(-3, -1), (3, -1), (1, 3), (-1, 3)])]); t.dot(-1, -1, ('orange', 4))

def glow_moss(t, ripe):
    t.blob('teal', [('ell', 0, -2, 5, 2.6), ('ell', -3, -3, 2.5, 2), ('ell', 3, -3.5, 2.5, 2)])
    if ripe: t.dots([(-3, -4), (1, -5), (4, -3), (-1, -2)], ('vial_g', 4)); t.dots([(-5, -8), (4, -9)], ('teal', 4))

def wheat(t, ripe):
    m = 'wheat' if ripe else 'stem'
    for x in (-4, -1, 2, 5):
        t.line(m, [(x * 0.8, 0), (x, -8)], 1)
        t.ell(m, x, -10, 1.2, 2.6 if ripe else 1.6)
    if ripe: t.dots([(-4, -11), (2, -11)], ('wheat', 4))

def thorn_seed(t, ripe):
    t.line('stem', [(0, 0), (0, -5)], 1); leaf(t, 'stem', 0, -2, -2.6, 4, 1.2); leaf(t, 'stem', 0, -3, -0.5, 4, 1.2)
    if ripe:
        t.ell('dgreen', 0, -8, 3.4, 3.4)
        for i in range(6):
            a = i * math.tau / 6 + 0.3; t.dot(math.cos(a) * 4.6, -8 + math.sin(a) * 4.6, ('bone', 3))
        t.dot(-1, -9, ('dgreen', 4))

# ------------------------------------------------------------------ standard crops (2 rounds, 1x1)

def bush(t, m='leafy', h=1.0):
    t.blob(m, [('ell', 0, -5 * h, 5, 4 * h), ('ell', -3, -3, 3, 2.6), ('ell', 3, -3, 3, 2.6)])
    t.dots([(-2, -8 * h), (1, -7 * h)], (m, 4))

def fire_pepper(t, ripe):
    bush(t)
    if ripe:
        for x, y in ((-3, -4), (2, -6), (3, -2)):
            t.poly('chili', [(x - 1, y), (x + 1, y), (x + 0.5, y + 4), (x - 0.5, y + 3)]); t.dot(x - 1, y, ('chili', 4))

def frost_berry(t, ripe):
    bush(t, 'dgreen')
    if ripe:
        for x, y in ((-3, -5), (2, -7), (3, -3), (-1, -2)): t.ell('berryb', x, y, 1.3, 1.3)
        t.dots([(-4, -6), (1, -8), (5, -10)], WHITE)

def thunder_turnip(t, ripe):
    fan(t, 'leafy', 4, 7, 2.0, y=-2, W=1.6)
    if ripe:
        t.blob('turnip', [('ell', 0, -1, 3.6, 3)]); t.dots([(-2, -2), (-1, -3)], ('turnip', 4))
        t.dots([(4, -9), (5, -8), (4, -7), (5, -6)], ('yel', 4))

def shadow_mushroom(t, ripe):
    sz = 1.0 if ripe else 0.6
    for x, h, r in ((-3, 4, 2.6), (2, 6, 3.4)):
        t.line('cap', [(x, 0), (x, -h * sz)], 2)
        t.blob('mushp', [('poly', [(x - r * sz, -h * sz), (x + r * sz, -h * sz), (x + r * sz * 0.6, -h * sz - 2.6 * sz), (x - r * sz * 0.6, -h * sz - 2.6 * sz)])])
        if ripe: t.dots([(x - 1, -h - 2), (x + 1, -h - 1)], ('mushp', 4))

def iron_vine(t, ripe):
    t.line('wood', [(0, 0), (0, -12)], 1)
    for i in range(6):
        y = -1 - i * 2; x = -2 if i % 2 else 2
        leaf(t, 'ironv' if ripe else 'stem', 0, y, math.pi if x < 0 else 0, 3.2, 1.2)
    if ripe: t.dots([(-2, -4), (2, -8), (-2, -12)], ('ironv', 4))

def bloodroot(t, ripe):
    fan(t, 'dgreen', 3, 6, 1.6, y=-2, W=1.4)
    if ripe: t.blob('blood', [('ell', 0, -1, 3, 2.4)]); t.dot(-1, -2, ('blood', 4)); t.dots([(-1, 2), (1, 2)], ('blood', 1))

def echo_bloom(t, ripe):
    t.line('stem', [(0, 0), (0, -6)], 1); leaf(t, 'stem', 0, -2, -2.8, 4, 1.4); leaf(t, 'stem', 0, -3, -0.3, 4, 1.4)
    if ripe:
        for a in range(5):
            ang = a * math.tau / 5 - math.pi / 2; t.ell('pink', math.cos(ang) * 2.4, -9 + math.sin(ang) * 2.4, 1.6, 1.6)
        t.ell('yel', 0, -9, 1, 1)
        t.dots([(-6, -12), (6, -11)], ('pink', 4))
    else: t.ell('stem', 0, -7, 1.6, 2)

# ------------------------------------------------------------------ rare crops (3 rounds, 1x2)

def dragon_fruit(t, ripe):
    for x, h, a in ((-6, 9, -2.0), (0, 12, -1.57), (6, 9, -1.1)):
        t.line('cactus', [(x * 0.4, 0), (x, -h)], 2)
        leaf(t, 'cactus', x * 0.6, -h * 0.5, a + (-0.8 if x <= 0 else 0.8), 4, 1.2)
    if ripe:
        for x, y in ((-6, -10), (6, -10), (0, -13)):
            t.blob('dragon', [('ell', x, y, 2.6, 3)]); t.dots([(x - 1, y - 1)], ('dragon', 4)); t.dots([(x + 2, y - 2), (x - 2, y + 1)], ('cactus', 3))

def crystal_bloom(t, ripe):
    for x, h, w in ((-8, 6, 1.6), (-3, 10, 2.2), (4, 8, 2), (9, 5, 1.4)):
        t.poly('quartz', [(x - w, 0), (x + w, 0), (x + w * 0.6, -h), (x, -h - 2), (x - w * 0.6, -h)])
    if ripe:
        t.line('stem', [(1, 0), (1, -11)], 1)
        for a in range(6):
            ang = a * math.tau / 6; t.ell('ice', 1 + math.cos(ang) * 2.4, -13 + math.sin(ang) * 2.4, 1.4, 1.4)
        t.dot(1, -13, WHITE); t.dots([(-10, -10), (12, -8)], WHITE)

def storm_seed(t, ripe):
    for x in (-6, 0, 6):
        t.line('stem', [(x * 0.5, 0), (x, -11)], 1); leaf(t, 'stem', x * 0.7, -4, -2.6 if x <= 0 else -0.5, 4, 1.2)
        if ripe: t.blob('stormp', [('ell', x, -13, 2, 2.8)]); t.dot(x - 1, -14, ('stormp', 4))
    if ripe: t.dots([(-9, -16), (-8, -15), (-9, -14), (9, -17), (10, -16), (9, -15), (3, -18)], ('yel', 4))

def void_blossom(t, ripe):
    t.blob('vstem', [('ell', 0, -2, 9, 2.6)])
    for x, h in ((-5, 8), (0, 11), (5, 8)):
        t.line('vstem', [(x * 0.6, 0), (x, -h)], 1)
        if ripe:
            for a in range(4):
                ang = a * math.tau / 4 + 0.78; t.ell('vblos', x + math.cos(ang) * 2, -h - 2 + math.sin(ang) * 2, 1.6, 1.6)
            t.dot(x, -h - 2, ('neonv', 4))
        else: t.ell('vblos', x, -h - 1, 1.2, 1.8)
    if ripe: t.dots([(-9, -14), (9, -12), (2, -17)], ('neonv', 3))

def life_tree_sapling(t, ripe):
    t.line('sapl', [(0, 0), (0, -8)], 2); t.line('sapl', [(0, -5), (-4, -8)], 1); t.line('sapl', [(0, -6), (4, -9)], 1)
    t.blob('leafy', [('ell', -5, -11, 5, 3.6), ('ell', 5, -12, 5, 3.6), ('ell', 0, -14, 5, 3.6)])
    t.dots([(-6, -13), (2, -16), (4, -14)], ('leafy', 4))
    if ripe: t.dots([(-4, -10), (5, -11), (0, -15), (-8, -12), (7, -14)], ('pink', 4)); t.dot(0, -12, ('heart', 3))

def ironbark_root(t, ripe):
    t.blob('ibark', [('poly', [(-10, 0), (-4, -3), (-2, -9), (2, -10), (4, -4), (10, 0), (5, -1), (0, -2), (-5, -1)])])
    t.dots([(-1, -8), (1, -6), (-3, -4)], ('ibark', 4))
    leaf(t, 'stem', 1, -9, -1.0, 4, 1.4); leaf(t, 'stem', -1, -9, -2.2, 4, 1.4)
    if ripe: t.dots([(-6, -1), (6, -1), (0, -5)], ('silver', 4)); t.ell('silver', 0, -12, 1.6, 1.6)

def mirror_petal(t, ripe):
    for x in (-5, 5):
        t.line('stem', [(x * 0.4, 0), (x, -8)], 1); leaf(t, 'stem', x * 0.6, -3, -2.6 if x < 0 else -0.5, 4, 1.2)
        if ripe:
            for a in range(6):
                ang = a * math.tau / 6; t.poly('mirror', [(x, -10), (x + math.cos(ang - 0.4) * 3.6, -10 + math.sin(ang - 0.4) * 3.6), (x + math.cos(ang + 0.4) * 3.6, -10 + math.sin(ang + 0.4) * 3.6)])
            t.dot(x, -10, ('quartz', 4)); t.dot(x - 2, -12, WHITE)
        else: t.ell('stem', x, -9, 1.4, 2)
    if ripe: t.dots([(-10, -14), (10, -15)], WHITE)

# ------------------------------------------------------------------ legendary crops (4 rounds, 2x2)

def phoenix_flower(t, ripe):
    t.line('stem', [(0, 0), (0, -12)], 2)
    for a, L in ((-2.6, 7), (-0.5, 7), (-2.9, 5), (-0.2, 5)): leaf(t, 'stem', 0, -4 if L == 7 else -8, a, L, 2)
    if ripe:
        for i in range(7):
            a = -math.pi / 2 + (i - 3) * 0.45
            leaf(t, 'phoen', 0, -16, a, 9 if i % 2 == 0 else 7, 2.2)
        t.ell('yel', 0, -16, 2.6, 2.2); t.dot(-1, -17, WHITE)
        t.dots([(-9, -26), (8, -28), (2, -30), (-5, -31)], ('phoen', 4))
    else: t.blob('phoen', [('ell', 0, -15, 2.6, 4)])

def world_tree_seedling(t, ripe):
    t.blob('sapl', [('poly', [(-3, 0), (3, 0), (2, -10), (-2, -10)]), ('poly', [(-10, 1), (-3, -1), (-2, -3)]), ('poly', [(10, 1), (3, -1), (2, -3)])])
    t.line('sapl', [(0, -9), (-7, -14)], 2); t.line('sapl', [(0, -10), (7, -15)], 2)
    m = 'wtree' if ripe else 'leafy'
    t.blob(m, [('ell', -8, -18, 6.5, 5), ('ell', 8, -19, 6.5, 5), ('ell', 0, -23, 8, 6), ('ell', 0, -15, 6, 4)])
    t.dots([(-9, -21), (-3, -27), (5, -24), (10, -21)], (m, 4))
    if ripe: t.dots([(-5, -17), (3, -20), (8, -16), (-1, -25), (-11, -16)], ('gold', 4))

def starfruit(t, ripe):
    t.blob('leafy', [('ell', 0, -8, 11, 7), ('ell', -8, -4, 6, 4), ('ell', 8, -4, 6, 4)])
    t.dots([(-6, -12), (2, -14), (8, -9)], ('leafy', 4))
    if ripe:
        for x, y in ((-6, -8), (5, -11), (0, -4), (9, -5), (-9, -3)): star(t, 'starf', x, y, 3)
        t.dots([(-12, -16), (12, -15), (0, -18)], ('starf', 4))

def soulbloom(t, ripe):
    for x in (-6, 0, 6):
        t.line('stem', [(x * 0.3, 0), (x, -10 if x else -14)], 1)
    leaf(t, 'stem', 0, -3, -2.7, 6, 1.6); leaf(t, 'stem', 0, -4, -0.4, 6, 1.6)
    if ripe:
        for x, y, r in ((-6, -12, 2.4), (6, -12, 2.4), (0, -17, 3.4)):
            t.blob('soul', [('poly', [(x - r, y), (x, y - r * 1.6), (x + r, y), (x, y + r * 0.6)])]); t.dot(x, y - 1, WHITE)
        for x, y in ((-10, -22), (9, -24), (2, -28)):
            t.ell('wisp', x, y, 1.6, 1.6); t.dot(x, y + 2, ('wisp', 2))
    else:
        for x, y in ((-6, -11), (6, -11), (0, -15)): t.ell('soul', x, y, 1.2, 2)

# ------------------------------------------------------------------ void crops (Void plot only, permanent)

def void_heart(t, ripe):
    t.line('vstem', [(0, 0), (0, -8)], 2); leaf(t, 'vstem', 0, -3, -2.6, 6, 1.8); leaf(t, 'vstem', 0, -3, -0.5, 6, 1.8)
    if ripe:
        t.blob('vblos', [('ell', -2.4, -13, 3, 3), ('ell', 2.4, -13, 3, 3), ('poly', [(-5, -12), (5, -12), (0, -7)])])
        t.dots([(0, -14), (0, -12), (-1, -11), (1, -10), (-2, -14), (2, -13)], ('neonv', 4))
    else: t.ell('vblos', 0, -11, 2, 2.6)

def oblivion_seed(t, ripe):
    t.line('vstem', [(0, 0), (0, -10)], 1); leaf(t, 'vstem', 0, -3, -2.8, 5, 1.4); leaf(t, 'vstem', 0, -5, -0.3, 5, 1.4)
    if ripe:
        t.ell('neonv', 0, -15, 5, 5); t.ell('black', 0, -15, 3.6, 3.6)
        t.dot(-1, -16, ('neonv', 4))
    else: t.ell('vstem', 0, -12, 2, 2.6)

def eternity_blossom(t, ripe):
    t.line('vstem', [(0, 0), (0, -9)], 1); leaf(t, 'vstem', 0, -3, -2.6, 5, 1.4); leaf(t, 'vstem', 0, -4, -0.5, 5, 1.4)
    if ripe:
        for i in range(8):
            a = i * math.tau / 8; L = 5
            leaf(t, 'cyan', 0, -14, a, L, 1.6)
        t.ell('vstem', 0, -14, 1.8, 1.8)
        for i in range(6): a = i * 1.1; t.dot(math.cos(a) * (1 + i * 0.25), -14 + math.sin(a) * (1 + i * 0.25), ('cyan', 4))
    else: t.ell('cyan', 0, -11, 1.6, 2.4)

def null_root(t, ripe):
    for a in (-2.8, -2.2, -1.0, -0.4):
        leaf(t, 'nullw', 0, -1, a, 6, 1.2)
    if ripe:
        t.ell('nullw', 0, -5, 5, 4); t.ell('black', 0, -5, 3, 2.6)
        t.dots([(-7, -9), (7, -10), (0, -12)], ('nullw', 4))
    else: t.ell('nullw', 0, -4, 2.6, 2)

def rift_bloom(t, ripe):
    t.line('vstem', [(0, 0), (0, -9)], 1); leaf(t, 'vstem', 0, -3, -2.7, 5, 1.4); leaf(t, 'vstem', 0, -4, -0.4, 5, 1.4)
    if ripe:
        for a in range(5):
            ang = a * math.tau / 5 - math.pi / 2; t.ell('vblos', math.cos(ang) * 3.4, -14 + math.sin(ang) * 3.4, 2.4, 2.4)
        t.line('rift', [(-1, -20), (1, -16), (-1, -13), (1, -9)], 1)
        t.dots([(0, -16), (0, -13)], ('rift', 4))
    else: t.ell('vblos', 0, -12, 1.6, 2.4)

# ------------------------------------------------------------------ registry

QUICK = [('Healing Herb', healing_herb), ('Pep Root', pep_root), ('Glow Moss', glow_moss), ('Wheat', wheat), ('Thorn Seed', thorn_seed)]
STANDARD = [('Fire Pepper', fire_pepper), ('Frost Berry', frost_berry), ('Thunder Turnip', thunder_turnip), ('Shadow Mushroom', shadow_mushroom),
            ('Iron Vine', iron_vine), ('Bloodroot', bloodroot), ('Echo Bloom', echo_bloom)]
RARE = [('Dragon Fruit', dragon_fruit), ('Crystal Bloom', crystal_bloom), ('Storm Seed', storm_seed), ('Void Blossom', void_blossom),
        ('Life Tree Sapling', life_tree_sapling), ('Ironbark Root', ironbark_root), ('Mirror Petal', mirror_petal)]
LEGENDARY = [('Phoenix Flower', phoenix_flower), ('World Tree Seedling', world_tree_seedling), ('Starfruit', starfruit), ('Soulbloom', soulbloom)]
VOID = [('Void Heart', void_heart), ('Oblivion Seed', oblivion_seed), ('Eternity Blossom', eternity_blossom), ('Null Root', null_root), ('Rift Bloom', rift_bloom)]
TIERS = [('Quick', 1, QUICK, (1, 1)), ('Standard', 2, STANDARD, (1, 1)), ('Rare', 3, RARE, (2, 1)), ('Legendary', 4, LEGENDARY, (2, 2)), ('Void', 1, VOID, (2, 2))]
GLOWS = {'Glow Moss': '#5fe0c8', 'Storm Seed': '#ffe040', 'Void Blossom': '#c030e8', 'Crystal Bloom': '#a0d6ea', 'Phoenix Flower': '#ffa030',
         'Starfruit': '#fff060', 'Soulbloom': '#a0c8f0', 'Void Heart': '#c030e8', 'Oblivion Seed': '#c030e8', 'Eternity Blossom': '#4ce8ec',
         'Null Root': '#dcdce6', 'Rift Bloom': '#ff5ab4'}

# ------------------------------------------------------------------ plots

FARM = {k: hx(v) for k, v in dict(out='#2b1d14', s0='#6e4529', s1='#55331e', s2='#86573a', s3='#7c4f30', w0='#9a6436', w2='#c08550', w3='#4e2e16',
                                   wet='#4e301c', v0='#0c0a14', v1='#1a1626', v2='#2a2440', ob='#3a3450', ob2='#5c5478').items()}

def plot(cols, rows, void=False, seed=4):
    """Tilled soil for a crop footprint, in tiles. Wooden edging like the farm hub's plot beds."""
    W, H = cols * 16, rows * 16
    a = np.zeros((H, W, 4), np.uint8)
    def r(x, y, w, h, c):
        a[max(0, y):y + h, max(0, x):x + w, :3] = FARM[c]; a[max(0, y):y + h, max(0, x):x + w, 3] = 255
    rnd = random.Random(seed)
    if not void:
        r(0, 0, W, H, 'w3'); r(1, 1, W - 2, H - 2, 'w0'); r(1, 1, W - 2, 1, 'w2')
        r(2, 2, W - 4, H - 4, 's0')
        for y in range(4, H - 2, 3): r(3, y, W - 6, 1, 's1')
        r(2, 2, W - 4, 1, 's3')
        for _ in range(W * H // 40): r(rnd.randrange(3, W - 3), rnd.randrange(3, H - 3), 1, 1, 's2')
    else:
        r(0, 0, W, H, 'ob'); r(1, 1, W - 2, H - 2, 'v1')
        for x in range(1, W - 1, 4): r(x, 0, 2, 1, 'ob2'); r(x + 2, H - 1, 2, 1, 'v0')
        r(3, 3, W - 6, H - 6, 'v0')
        for _ in range(W * H // 30): r(rnd.randrange(3, W - 3), rnd.randrange(3, H - 3), 1, 1, 'v2')
    return Image.fromarray(a, 'RGBA')

def void_cracks(im, frame=0):
    """Neon cracks on the Void plot; two frames pulse between violet and cyan."""
    a = np.array(im); W, H = im.width, im.height
    cols = [hx('#c030e8'), hx('#ec7cff')] if frame == 0 else [hx('#7a14a0'), hx('#c030e8')]
    for path in (((4, 8), (9, 11), (12, 10), (16, 15)), ((W - 5, 6), (W - 10, 10), (W - 9, 14)), ((6, H - 6), (11, H - 9), (15, H - 8)), ((W - 6, H - 5), (W - 11, H - 9), (W - 16, H - 10))):
        for (x0, y0), (x1, y1) in zip(path, path[1:]):
            n = max(abs(x1 - x0), abs(y1 - y0))
            for i in range(n + 1):
                x = round(x0 + (x1 - x0) * i / n); y = round(y0 + (y1 - y0) * i / n)
                a[y, x, :3] = cols[1] if i % 3 == 0 else cols[0]; a[y, x, 3] = 255
    return Image.fromarray(a, 'RGBA')

def seedbed(im, n, void=False):
    """Stage 0: small mounds with the seed pressed in."""
    a = np.array(im); W, H = im.width, im.height
    xs = [W // 2] if n == 1 else [W // 4, 3 * W // 4] if n == 2 else [W // 2]
    y = H // 2 + (2 if H > 16 else 1)
    for x in xs:
        for dx in range(-2, 3): a[y, x + dx, :3] = FARM['s2' if not void else 'v2']
        for dx in range(-1, 2): a[y - 1, x + dx, :3] = FARM['s3' if not void else 'ob']
        a[y - 1, x, :3] = hx('#efe2c4') if not void else hx('#ec7cff')
        a[y + 1, x - 1:x + 2, :3] = FARM['s1' if not void else 'v0']
    return Image.fromarray(a, 'RGBA')

def sprout(cols, rows, void=False):
    s = Sprite(cols * 16, rows * 16 + 16, 0)
    t = T(s, cols * 8, rows * 8 + 16 + (2 if rows > 1 else 1))
    m = 'vstem' if void else 'stem'
    t.line(m, [(0, 0), (0, -2)], 1); leaf(t, m, 0, -2, -2.6, 3, 1.1); leaf(t, m, 0, -2, -0.5, 3, 1.1)
    return s.render()

def stage(name, fn, cols, rows, st, void=False, frame=0):
    """Frame for growth stage st (0 seed, 1 sprout, 2 growing, 3 ready) on its plot."""
    base = plot(cols, rows, void, seed=len(name))
    if void: base = void_cracks(base, frame)
    W, H = cols * 16, rows * 16 + 16
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); out.alpha_composite(base, (0, 16))
    if st == 0: out.alpha_composite(seedbed(base, 1, void), (0, 16)); return out
    if st == 1: out.alpha_composite(sprout(cols, rows, void)); return out
    s = Sprite(W, H, 0)
    k = (0.7 if st == 2 else 1.0) * (1.0 if rows == 1 else 1.0)
    t = T(s, W / 2, 16 + rows * 8 + (2 if rows > 1 else 1), k)
    fn(t, st == 3)
    im = s.render()
    if st == 3 and name in GLOWS:
        im = glow(GLOWS[name], steps=((1, 120 if frame == 0 else 70), (2, 50 if frame == 0 else 20)))(im)
    # contact shadow under the plant
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sa = np.array(sh)
    cy = 16 + rows * 8 + (2 if rows > 1 else 1); cx = W // 2; rx = 4 if cols == 1 else 9
    for y in range(cy - 1, cy + 2):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) / rx) ** 2 + ((y - cy) / 1.6) ** 2 <= 1: sa[y, x] = (20, 24, 60, 80)
    out.alpha_composite(Image.fromarray(sa, 'RGBA')); out.alpha_composite(im)
    return out

def all_stages(name, fn, size, void=False):
    cols, rows = size
    fr = [stage(name, fn, cols, rows, st, void) for st in range(4)]
    ready2 = stage(name, fn, cols, rows, 3, void, frame=1) if (void or name in GLOWS) else None
    return fr, ready2

def plot_states():
    """Empty tilled plots and the empty Void plot, plus the watered look."""
    out = []
    for c, r_ in ((1, 1), (2, 1), (2, 2)):
        im = Image.new('RGBA', (c * 16, r_ * 16 + 16), (0, 0, 0, 0)); im.alpha_composite(plot(c, r_), (0, 16)); out.append((f'Tilled plot {c}x{r_}', [im]))
    v = [Image.new('RGBA', (32, 48), (0, 0, 0, 0)) for _ in range(2)]
    for i in range(2): v[i].alpha_composite(void_cracks(plot(2, 2, True), i), (0, 16))
    out.append(('Void plot', v))
    return out
