# Wormsbound creature sprites (v3 art), drawn in code: Pillow, colour ramps, top-left light, a dark outline.
# No image model, nothing licensed. © 2026 justaskjoe. All rights reserved.
#
# Run: python3 creatures.py     writes ../sprites/creatures.png and .json, ../concepts/v3-creatures.png and .gif
#
# Ten creatures, one per character, each with a different outline (see design/v3.md section 6):
#   class sets the shape; one prop each; the TEAM colour is only a band, scarf or panel.
# Sheet: one row per character IN THE ORDER OF `CHARS` IN prototype/engine.js (ROWS below), 48 x 48 art pixels a
# frame, facing right, feet on row 45. Columns are FRAMES below. The team parts are painted in three KEY colours
# that the game swaps for the unit's team colour when it loads the sheet.
#
# How a creature is animated: each draw function paints its parts in groups (legs, tail, body, head, prop) and calls
# f.at('<group>') before each one. A pose (POSES) is just an offset for each group plus a few flags, so one drawing
# gives all 16 frames. To change how a creature looks, edit its function; to change a movement, edit POSES.
import json, pathlib
from PIL import Image, ImageDraw

S, GROUND = 48, 45
FOOT = (24, 46)                          # the point of a frame that stands on the ground in the game
INK = (30, 26, 43)
KEY = [(200, 0, 200), (255, 0, 255), (255, 140, 255)]        # team shade, mid, light: the game swaps these
TEAM = KEY
ORANGE = [(170, 70, 20), (255, 138, 61), (255, 196, 140)]    # previews only
TEALTEAM = [(10, 120, 112), (0, 201, 183), (140, 232, 222)]
WHITE, CREAM = (255, 243, 224), (243, 223, 195)
PALE = [CREAM, WHITE, WHITE]
STEEL = [(76, 80, 96), (140, 143, 160), (196, 200, 214)]
GOLD = [(176, 120, 20), (255, 211, 77), (255, 240, 170)]
BROWN = [(84, 52, 34), (138, 90, 60), (184, 132, 92)]
DARKBROWN = [(52, 36, 30), (88, 62, 50), (124, 92, 74)]
TAN = [(150, 110, 84), (206, 166, 130), (238, 208, 176)]
GREEN = [(40, 110, 60), (88, 190, 96), (160, 236, 150)]
TEAL = [(30, 104, 110), (70, 190, 180), (168, 240, 224)]
RED = [(140, 36, 40), (232, 72, 72), (255, 150, 130)]
EMBER = [(150, 60, 24), (238, 120, 48), (255, 190, 110)]
SLATE = [(58, 60, 78), (96, 100, 124), (142, 146, 170)]
HERON = [(84, 104, 134), (150, 172, 200), (214, 228, 242)]
CLOUD = [(150, 164, 190), (224, 232, 244), (255, 255, 255)]
STORM = [(60, 66, 86), (98, 106, 130), (140, 148, 172)]
PINK = (236, 150, 150)
SPARK = (143, 216, 255)
FLAME = [(255, 120, 40), (255, 211, 77)]
RAIN = (90, 169, 255)
SMOKE = (206, 204, 216)

FRAMES = ['idle1', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4', 'jump1', 'jump2', 'aim', 'fire1', 'fire2',
          'cast1', 'cast2', 'hurt', 'ko1', 'ko2']
# A and B are the two sets of legs. lift moves the whole creature. rot lays the finished frame on its back.
POSES = {
    'idle1': {},
    'idle2': dict(body=(0, 1), head=(0, 1), prop=(0, 1), habit=1),
    'walk1': dict(A=(2, 0), B=(-2, 0)),
    'walk2': dict(B=(0, -2), body=(0, -1), head=(0, -1), prop=(0, -1)),
    'walk3': dict(A=(-2, 0), B=(2, 0), habit=1),
    'walk4': dict(A=(0, -2), body=(0, -1), head=(0, -1), prop=(0, -1)),
    'jump1': dict(body=(0, 2), head=(0, 3), prop=(0, 3)),                                   # crouch
    'jump2': dict(lift=-6, A=(-1, 2), B=(1, 3), head=(1, -1), prop=(1, -2), habit=1),       # stretched in the air
    'aim':   dict(head=(1, 0), prop=(1, -2)),
    'fire1': dict(body=(-1, 0), head=(-2, 0), prop=(-3, 0), flash=2),                       # recoil and muzzle flash
    'fire2': dict(body=(-1, 0), head=(-1, 0), prop=(-1, -1), flash=1),                      # smoke
    'cast1': dict(body=(0, 1), head=(0, 1), prop=(0, -1), glow=1),
    'cast2': dict(body=(0, -1), head=(0, -2), prop=(0, -4), glow=2, A=(-1, 0), B=(1, 0)),
    'hurt':  dict(body=(-2, 0), head=(-3, 1), prop=(-3, 2), A=(-1, 0), eyes='shut'),
    'ko1':   dict(body=(-3, 2), head=(-5, 4), prop=(-4, 6), A=(1, 0), B=(2, 0), eyes='x'),
    'ko2':   dict(body=(-1, 0), head=(-1, 0), prop=(-1, 1), eyes='x', rot=1),
}


class Frame:
    def __init__(self, pose=None):
        self.px, self.pose, self.o = {}, pose or {}, (0, 0)
        self.habit, self.eyes, self.lay = self.pose.get('habit', 0), self.pose.get('eyes', 'open'), 'turn'
    def at(self, part, i=0):
        """Everything painted after this moves with that group. Legs alternate between the A and B sets."""
        p = self.pose
        o = p.get('A' if i % 2 == 0 else 'B', (0, 0)) if part == 'legs' else p.get('body' if part == 'tail' else part, (0, 0))
        self.o = (o[0], o[1] + p.get('lift', 0))
    def put(self, x, y, c):
        x, y = int(round(x + self.o[0])), int(round(y + self.o[1]))
        if 0 <= x < S and 0 <= y < S and c is not None: self.px[(x, y)] = c
    def cut(self, x, y): self.px.pop((int(round(x + self.o[0])), int(round(y + self.o[1]))), None)
    def rect(self, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1): self.put(x, y, c)
    def _shade(self, ramp, dx, dy):
        if not isinstance(ramp, list): return ramp
        k = dx * 0.6 + dy * 0.8                              # top-left light: further down-right is darker
        return ramp[2] if k < -0.42 else ramp[0] if k > 0.5 else ramp[1]
    def disc(self, cx, cy, rx, ry, ramp):
        for y in range(int(cy - ry - 1), int(cy + ry + 2)):
            for x in range(int(cx - rx - 1), int(cx + rx + 2)):
                dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                if dx * dx + dy * dy <= 1: self.put(x, y, self._shade(ramp, dx, dy))
    def cap(self, x0, y0, x1, y1, r, ramp, r1=None):
        """A capsule (a thick shaded limb) from one point to another; r1 tapers it."""
        r1 = r if r1 is None else r1
        vx, vy = x1 - x0, y1 - y0; L2 = vx * vx + vy * vy or 1
        m = max(r, r1) + 1
        for y in range(int(min(y0, y1) - m), int(max(y0, y1) + m + 1)):
            for x in range(int(min(x0, x1) - m), int(max(x0, x1) + m + 1)):
                t = max(0, min(1, ((x + 0.5 - x0) * vx + (y + 0.5 - y0) * vy) / L2))
                rr = r + (r1 - r) * t
                dx, dy = (x + 0.5 - (x0 + vx * t)) / rr, (y + 0.5 - (y0 + vy * t)) / rr
                if dx * dx + dy * dy <= 1: self.put(x, y, self._shade(ramp, dx, dy))
    def poly(self, pts, c):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(pts)):
                (ax, ay), (bx, by) = pts[i], pts[(i + 1) % len(pts)]
                if (ay <= y + 0.5 < by) or (by <= y + 0.5 < ay): xs.append(ax + (y + 0.5 - ay) * (bx - ax) / (by - ay))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[i])), int(round(xs[i + 1]))): self.put(x, y, c)
    def line(self, x0, y0, x1, y1, c):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1): self.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c)
    def outline(self, c=INK):
        edge = set()
        for (x, y) in self.px:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q not in self.px and 0 <= q[0] < S and 0 <= q[1] < S: edge.add(q)
        for q in edge: self.px[q] = c
    def eye(self, x, y, big=False):
        if self.eyes != 'open':                              # shut (hurt) or knocked out: a dark dash
            if big: self.rect(x - 1, y - 1, x + 1, y + 1, WHITE)
            self.rect(x - 1, y, x + 1, y, INK)
            if self.eyes == 'x': self.put(x - 1, y - 1, INK); self.put(x + 1, y + 1, INK)
        elif big: self.rect(x - 1, y - 1, x + 1, y + 1, WHITE); self.rect(x, y, x + 1, y + 1, INK)
        else: self.put(x, y, INK); self.put(x, y - 1, INK); self.put(x - 1, y - 1, WHITE)
    def fx(self, part, x, y, glow):
        """Muzzle flash, smoke or a casting glow at the creature's firing point. Painted last, so it has no outline."""
        self.at(part); fl, gl = self.pose.get('flash', 0), self.pose.get('glow', 0)
        if fl == 2:
            self.disc(x + 3, y, 3.2, 3.2, FLAME[0]); self.disc(x + 3, y, 2, 2, FLAME[1]); self.put(x + 3, y, WHITE)
            for dx, dy in ((7, 0), (6, -3), (6, 3)): self.put(x + dx, y + dy, FLAME[1])
        elif fl == 1:
            self.disc(x + 4, y - 2, 2.4, 2, SMOKE); self.disc(x + 7, y - 5, 1.6, 1.4, SMOKE)
        if gl:
            r = 3 if gl == 1 else 5
            for dx, dy in ((r, 0), (-r, 0), (0, r), (0, -r)) + (((r - 1, r - 1), (1 - r, r - 1), (r - 1, 1 - r), (1 - r, 1 - r)) if gl == 2 else ()):
                self.put(x + dx, y + dy, glow); self.put(x + dx, y + dy - (1 if gl == 2 else 0), WHITE if gl == 2 else glow)
            self.disc(x, y, 1.6, 1.6, glow); self.put(x, y, WHITE)
    def image(self, flat=None, team=None):
        px = self.px
        if self.pose.get('rot'):                             # knocked out: lie the whole frame on its back
            # upright creatures tip over backwards (a quarter turn); four-legged and round ones roll belly-up
            r = {((x, S - 1 - y) if self.lay == 'flip' else (y, S - 1 - x)): c for (x, y), c in px.items()}
            lo, xs = max(y for _, y in r), [x for x, _ in r]
            dx, dy = 24 - (min(xs) + max(xs)) // 2, GROUND - lo
            px = {(x + dx, y + dy): c for (x, y), c in r.items()}
        im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        swap = dict(zip(KEY, team)) if team else {}
        for (x, y), c in px.items():
            if 0 <= x < S and 0 <= y < S: im.putpixel((x, y), (flat or swap.get(c, c)) + (255,))
        return im


# ---------------------------------------------------------------- the ten
def brick(f):   # TANK. Armadillo in riveted plate: a wide square block with a shoulder cannon.
    for i, x in enumerate((10, 17, 28, 33)): f.at('legs', (0, 1, 1, 0)[i]); f.rect(x, 40, x + 3, GROUND, TAN[0])
    f.at('tail'); f.cap(6, 40, 2, 43, 2, TAN, 1)
    f.at('body'); f.disc(21, 31, 16, 11.5, STEEL)                                   # the shell
    f.rect(6, 31, 36, 40, STEEL[1]); f.rect(6, 38, 36, 40, STEEL[0])                # squared-off skirt
    for x in (12, 19, 26, 32): f.line(x, 21, x, 40, STEEL[0])                       # plate bands
    for x in (9, 15, 22, 29, 35): f.put(x, 36, STEEL[2])                            # rivets
    f.at('head'); f.disc(40, 35, 5.5, 4.5, TAN); f.cap(43, 37, 46, 39, 1.6, TAN, 1) # head and snout
    f.poly([(37, 31), (39, 25), (41, 31)], TAN[1])                                  # ear
    f.at('body'); f.rect(17, 15, 23, 22, STEEL[0])                                  # cannon mount
    f.at('prop'); f.cap(20, 17, 42, 12, 3.2, STEEL); f.cap(30, 15, 33, 14, 3.4, TEAM)   # cannon, team band
    f.outline()
    f.at('head'); f.eye(41, 34); f.put(46, 39, INK)
    f.at('prop'); f.disc(43.5, 11.5, 1.6, 1.6, INK)
    return 'prop', 45, 11

def tusk(f):    # TANK. Boar: a forward wedge with a high shoulder hump, head down, tusks up.
    for i, x in enumerate((11, 17, 27, 32)): f.at('legs', (0, 1, 1, 0)[i]); f.rect(x, 40, x + 2, GROUND, DARKBROWN[0])
    f.at('body'); f.cap(12, 35, 28, 31, 9, BROWN, 11)                               # body: low rump, big shoulders
    for x in range(8, 32, 3): f.poly([(x, 28 - (x - 8) // 4), (x + 2, 20 - (x - 8) // 3), (x + 4, 28 - (x - 8) // 4)], DARKBROWN[0])   # mane
    f.line(3, 32, 1, 29, DARKBROWN[1]); f.line(1, 29, 3, 27, DARKBROWN[1])          # curly tail
    f.at('head'); f.disc(37, 34, 7, 6.5, BROWN); f.cap(41, 38, 44, 39, 3, TAN, 2.6) # head, snout
    f.poly([(32, 28), (34, 22), (37, 28)], BROWN[0])                                # ear
    f.cap(32, 27, 41, 27, 2.8, STEEL); f.rect(35, 22, 37, 25, STEEL[1])             # ram helmet and its ridge
    f.rect(33, 26, 40, 27, TEAM[1])                                                 # team stripe
    f.cap(41, 41, 46, 38, 1.6, PALE, 1.4); f.cap(46, 38, 46, 29, 1.4, PALE, 0.7)    # the tusk
    f.outline()
    f.at('head'); f.eye(39, 32); f.put(45, 38, INK); f.put(45, 40, INK)
    return 'head', 46, 39

def zip_(f):    # SCOUT. Ferret: long, thin, leaning into a run, scarf trailing.
    f.at('tail'); f.cap(17, 41, 4, 36 + f.habit, 2.6, BROWN, 1.6)
    f.at('legs', 0); f.cap(18, 41, 21, GROUND, 1.8, DARKBROWN)
    f.at('legs', 1); f.cap(24, 40, 28, GROUND, 1.8, DARKBROWN)
    f.at('body'); f.cap(18, 38, 29, 20, 5, TAN, 4.2)                                # the long torso
    f.at('prop'); f.cap(27, 26, 35, 29, 1.6, TAN); f.cap(35, 29, 40, 29, 1.5, STEEL)    # arm, dart gun
    f.at('head'); f.disc(32, 15, 5.5, 4.8, TAN); f.cap(35, 16, 40, 18, 2, PALE, 1.2)    # head, muzzle
    f.disc(28, 10, 1.8, 2, BROWN[0]); f.disc(33, 9, 1.8, 2, BROWN[0])               # ears
    f.rect(29, 13, 36, 15, DARKBROWN[0])                                            # bandit mask
    f.rect(30, 12, 33, 15, STEEL[1]); f.rect(31, 13, 32, 14, SPARK)                 # goggle
    f.cap(27, 21, 31, 22, 2.2, TEAM)                                                # scarf at the neck
    h = f.habit * 3
    f.poly([(27, 20), (10, 14 + h), (13, 19), (8, 22 - h), (27, 24)], TEAM[1])      # scarf tail, flapping
    f.outline()
    f.at('head'); f.put(41, 18, INK)
    if f.eyes != 'open': f.rect(31, 13, 32, 14, INK)
    return 'prop', 41, 29

def hopper(f):  # SCOUT. Frog: a crouched triangle, huge back leg, eyes on top.
    f.at('legs', 0); f.cap(12, 39, 20, 33, 6.5, GREEN, 5); f.cap(6, 44, 20, 44, 1.6, GREEN)   # folded back leg, long foot
    f.at('body'); f.disc(26, 35, 11, 8.5, GREEN); f.disc(28, 39, 8, 4.5 + f.habit, [GREEN[1], CREAM, WHITE])   # body, throat
    f.at('legs', 1); f.cap(33, 38, 36, 44, 1.8, GREEN); f.rect(35, 44, 39, GROUND, GREEN[0])  # front arm
    f.at('head'); f.disc(33, 28, 8, 6, GREEN)
    f.disc(29, 21, 4, 4, GREEN); f.disc(37, 22, 3.6, 3.6, GREEN)                    # eye bumps
    f.rect(25, 26, 36, 27, TEAM[1])                                                 # headband
    f.at('prop'); f.line(40, 30, 43, 22, BROWN[1]); f.line(43, 22, 41, 17, BROWN[1]); f.line(43, 22, 46, 18, BROWN[1])   # slingshot
    f.outline()
    f.at('head'); f.eye(29, 21, True); f.eye(37, 22, True); f.line(33, 31, 40, 30, GREEN[0])
    return 'prop', 44, 18

def volt(f):    # GUNNER. Gecko: upright, a coil pack with two tall antennae.
    f.at('tail'); f.cap(18, 40, 8, 43, 3, TEAL, 1.2); f.cap(8, 43, 5, 39, 1.2, TEAL, 0.8)
    f.at('legs', 0); f.rect(20, 41, 24, GROUND, TEAL[0])
    f.at('legs', 1); f.rect(27, 41, 32, GROUND, TEAL[0])
    f.at('body'); f.rect(11, 22, 17, 37, STEEL[1]); f.rect(11, 22, 17, 23, STEEL[2]); f.rect(11, 35, 17, 37, STEEL[0])   # pack
    for y in (26, 29, 32): f.rect(11, y, 17, y, GOLD[1])                            # copper windings
    f.line(12, 21, 9, 6, STEEL[1]); f.line(16, 21, 18, 4, STEEL[1])                 # two antennae
    a, b = (2.6, 1.4) if f.habit else (1.8, 2.2)
    f.disc(9, 5, a, a, SPARK); f.disc(18.5, 3.5, b, b, SPARK)                       # sparks trade places
    f.cap(24, 36, 25, 24, 6, TEAL, 5); f.disc(26, 35, 4, 5, [TEAL[1], CREAM, WHITE])    # body, pale belly
    f.rect(18, 25, 29, 26, TEAM[1])                                                 # pack strap
    f.at('prop'); f.cap(28, 28, 37, 27, 1.6, TEAL); f.cap(37, 27, 44, 27, 2.2, STEEL)   # arm and a stubby arc gun
    f.at('head'); f.disc(28, 16, 8, 5.5, TEAL)                                      # wide flat head
    f.outline()
    f.at('head'); f.eye(31, 15, True); f.line(31, 19, 36, 18, TEAL[0])
    f.at('prop'); f.put(45, 27, SPARK)
    return 'prop', 45, 27

def flint(f):   # GUNNER. Salamander: hunched under a welding mask, flame tank on its back.
    f.at('tail'); f.cap(18, 42, 5, 43, 3.4, EMBER, 1.4)
    f.at('legs', 0); f.rect(19, 42, 23, GROUND, EMBER[0])
    f.at('legs', 1); f.rect(27, 42, 31, GROUND, EMBER[0])
    f.at('body'); f.cap(12, 24, 12, 37, 3.6, RED); f.rect(9, 29, 15, 30, TEAM[1]); f.rect(11, 19, 13, 21, STEEL[1])   # tank, band, valve
    f.cap(23, 38, 26, 27, 7, EMBER, 6)                                              # hunched body
    for p in ((21, 33), (25, 37), (27, 30)): f.put(p[0], p[1], INK)                 # spots
    f.line(13, 37, 22, 41, INK)                                                     # hose
    f.at('head'); f.cap(29, 22, 34, 21, 6, EMBER)
    f.poly([(29, 15), (40, 15), (41, 27), (30, 28)], STEEL[1]); f.rect(29, 15, 40, 16, STEEL[2])   # welding mask
    f.rect(32, 20, 39, 22, INK); f.rect(33, 21, 38, 21, FLAME[0] if f.eyes == 'open' else STEEL[0])   # visor slit, glowing
    f.at('prop'); f.cap(28, 32, 37, 33, 1.6, EMBER); f.cap(37, 33, 43, 32, 1.8, STEEL)  # arm, nozzle
    f.disc(45.5, 31 - f.habit, 1.6, 2.2 + f.habit, FLAME[1])                        # pilot light flickers
    f.outline()
    f.at('prop'); f.put(46, 29 - f.habit, FLAME[0])
    return 'prop', 46, 31

def digger(f):  # ENGINEER. Mole: low to the ground, enormous claws, lamp helmet.
    f.at('legs', 0); f.rect(9, 43, 13, GROUND, SLATE[0])
    f.at('body'); f.disc(20, 37, 15, 8.5, SLATE); f.put(4, 39, PINK); f.put(3, 40, PINK)    # low velvet body, stub tail
    f.at('head'); f.cap(32, 35, 41, 38 + f.habit, 5.5, SLATE, 2.4); f.disc(44.5, 38.5 + f.habit, 1.8, 1.8, PINK)   # head, nose sniffs
    f.at('prop')
    for i, x in enumerate((30, 34, 38)): f.poly([(x, 40), (x + 4, 40), (x + 6 + i, 46)], WHITE)   # three huge claws
    f.cap(27, 39, 34, 41, 3, SLATE)                                                 # the arm they hang off
    f.at('head'); f.disc(30, 30, 6.5, 4.5, GOLD); f.rect(24, 31, 37, 32, TEAM[1])   # helmet and team band
    f.rect(35, 27, 38, 30, STEEL[1]); f.rect(39, 27, 40, 30, FLAME[1])              # lamp
    f.outline()
    f.at('head'); f.eye(38, 35)
    if f.eyes == 'open':
        for x in (42, 44, 46): f.put(x, 28 + (x - 42) // 2, GOLD[2])                # lamp beam
    return 'head', 41, 29

def patch(f):   # ENGINEER. Beaver: low and round, flat paddle tail, hard hat, wrench up.
    f.at('tail'); f.disc(9, 42, 8.5, 3, DARKBROWN)
    for x in (4, 8, 12): f.line(x, 40, x + 2, 44, DARKBROWN[0])                     # paddle tail, cross-hatched
    f.at('legs', 0); f.rect(18, 42, 23, GROUND, DARKBROWN[0])
    f.at('legs', 1); f.rect(27, 42, 32, GROUND, DARKBROWN[0])
    f.at('body'); f.disc(23, 35, 10, 9.5, BROWN); f.disc(26, 37, 6, 6, TAN)         # body, pale belly
    f.rect(15, 38, 31, 39, BROWN[0]); f.rect(19, 39, 22, 42, STEEL[1])              # tool belt and pouch
    f.at('head'); f.disc(31, 24, 7.5, 6.5, BROWN); f.disc(36, 26, 3.6, 3, TAN)      # head, muzzle
    f.rect(37, 28, 38, 30, WHITE)                                                   # buck teeth
    f.disc(30, 19, 8, 4.5, GOLD); f.rect(22, 21, 40, 22, GOLD[0]); f.rect(23, 19, 37, 19, TEAM[1])   # hard hat, brim, stripe
    f.at('prop'); t = f.habit * 2                                                   # the wrench taps
    f.cap(30, 32, 39, 24 + t, 1.8, BROWN); f.cap(39, 24 + t, 42, 12 + t, 1.4, STEEL)    # arm, wrench handle
    f.rect(40, 7 + t, 45, 11 + t, STEEL[1])                                         # wrench head
    for p in ((42, 7), (43, 7), (42, 8), (43, 8)): f.cut(p[0], p[1] + t)            # its open jaw
    f.outline()
    f.at('head'); f.eye(34, 23); f.put(39, 25, INK)
    return 'prop', 43, 6

def gale(f):    # CONTROLLER. Heron: tall and thin on stilt legs, kite wings behind.
    f.at('prop'); h = f.habit * 2
    f.poly([(22, 26), (3, 9 + h), (6, 24)], TEAM[1]); f.poly([(22, 26), (6, 24), (4, 37 - h)], TEAM[0])   # kite wing, two panels
    f.line(22, 26, 3, 9 + h, BROWN[0]); f.line(22, 26, 4, 37 - h, BROWN[0]); f.line(22, 26, 6, 24, BROWN[0])   # struts
    f.line(4, 37 - h, 2, 43, TEAM[2]); f.line(2, 43, 5 - h, 46, TEAM[2])            # kite tail
    f.at('legs', 0); f.line(23, 32, 22, 44, GOLD[0]); f.rect(22, 44, 25, GROUND, GOLD[0])   # stilt legs
    f.at('legs', 1); f.line(27, 32, 28, 44, GOLD[0]); f.rect(28, 44, 31, GROUND, GOLD[0])
    f.at('body'); f.disc(24, 28, 7, 5, HERON); f.cap(28, 25, 26, 17, 2, HERON)      # small body, lower neck
    f.at('head'); f.cap(26, 17, 30, 9, 2, HERON)                                    # S-bend neck
    f.disc(31, 7, 3.4, 3, HERON); f.cap(33, 8, 44, 10, 1.4, GOLD, 0.6)              # head, long beak
    f.line(29, 5, 22, 2 + h, SLATE[0]); f.line(29, 6, 21, 5 + h, SLATE[0])          # crest plumes
    f.outline()
    f.at('head'); f.put(32, 6, INK)
    if f.eyes != 'open': f.put(31, 6, INK); f.put(33, 6, INK)
    return 'head', 45, 10

def nimbus(f):  # CONTROLLER. Sheep with cloud for wool: round, floating, a rain cloud of its own.
    for i, x in enumerate((18, 22, 28, 32)): f.at('legs', i); f.rect(x, 34, x + 1, 38, SLATE[0])   # dangling legs
    f.at('body')
    for cx, cy, r in ((16, 27, 7), (24, 23, 8), (31, 27, 7), (22, 31, 7.5), (29, 31, 6.5), (11, 30, 4.5)):
        f.disc(cx, cy, r, r * 0.9, CLOUD)                                           # the wool
    f.at('head'); f.disc(37, 27, 5, 5.5, SLATE); f.cap(33, 22, 30, 21, 1.6, SLATE)  # dark face, ear
    f.rect(33, 31, 37, 32, TEAM[1]); f.disc(35, 34, 1.4, 1.4, GOLD[1])              # collar and bell
    f.at('prop')
    for cx, cy, r in ((19, 8, 4), (25, 6, 5), (31, 8, 4)): f.disc(cx, cy, r, r * 0.8, STORM)   # its own storm cloud
    f.outline()
    f.at('head'); f.eye(39, 26)
    f.at('prop')
    if f.eyes == 'open':
        for x, y in ((19, 13), (24, 15), (29, 13), (33, 15)): f.line(x, y + f.habit * 2, x - 1, y + 2 + f.habit * 2, RAIN)   # rain
    return 'prop', 25, 13


# name, class, creature, draw function, the colour its casting glows (its ability's verb: design/v3.md section 1)
CAST = {
    'brick': ('Brick', 'Tank', 'armadillo', brick, GREEN[1]), 'tusk': ('Tusk', 'Tank', 'boar', tusk, WHITE),
    'zip': ('Zip', 'Scout', 'ferret', zip_, FLAME[0]), 'hopper': ('Hopper', 'Scout', 'frog', hopper, FLAME[0]),
    'volt': ('Volt', 'Gunner', 'gecko', volt, SPARK), 'flint': ('Flint', 'Gunner', 'salamander', flint, (190, 120, 255)),
    'digger': ('Digger', 'Engineer', 'mole', digger, BROWN[2]), 'patch': ('Patch', 'Engineer', 'beaver', patch, GREEN[1]),
    'gale': ('Gale', 'Controller', 'heron', gale, WHITE), 'nimbus': ('Nimbus', 'Controller', 'cloud sheep', nimbus, RAIN),
}
BELLY_UP = ('brick', 'tusk', 'hopper', 'digger', 'nimbus')       # how each one lies when knocked out (ko2)
ROWS = ['brick', 'zip', 'volt', 'digger', 'gale', 'tusk', 'hopper', 'flint', 'patch', 'nimbus']   # = CHARS in engine.js
LINEUP = ['brick', 'tusk', 'zip', 'hopper', 'volt', 'flint', 'digger', 'patch', 'gale', 'nimbus']  # by class, for sheets


def frame(ch, name):
    f = Frame(POSES[name]); f.lay = 'flip' if ch in BELLY_UP else 'turn'; part, x, y = CAST[ch][3](f); f.fx(part, x, y, CAST[ch][4]); return f


def main():
    here = pathlib.Path(__file__).resolve().parent
    sheet = Image.new('RGBA', (S * len(FRAMES), S * len(ROWS)), (0, 0, 0, 0))
    for r, ch in enumerate(ROWS):
        for c, name in enumerate(FRAMES): sheet.paste(frame(ch, name).image(), (c * S, r * S))
    sheet.save(here.parent / 'sprites' / 'creatures.png', optimize=True)
    (here.parent / 'sprites' / 'creatures.json').write_text(json.dumps({
        'about': 'Wormsbound creature sprites. Drawn by art/tools/creatures.py; do not edit the PNG by hand.',
        'frame': S, 'foot': FOOT, 'rows': ROWS, 'frames': FRAMES, 'key': KEY}, indent=1) + '\n', encoding='utf-8', newline='\n')

    # contact sheet: every frame of every creature, two team colours, at 2x
    Z, PAD, LAB = 2, 14, 86
    W, H = LAB + S * Z * len(FRAMES) + PAD * 2, PAD + 46 + (S * Z + 6) * len(LINEUP) + PAD
    im = Image.new('RGB', (W, H), (27, 24, 38)); d = ImageDraw.Draw(im)
    d.text((PAD, PAD), 'WORMSBOUND v3 creatures: every frame (2x). Orange team, then teal on alternate rows. Team colour is only the band, scarf or panel.', fill=(255, 243, 224))
    for c, name in enumerate(FRAMES): d.text((PAD + LAB + c * S * Z + 30, PAD + 26), name, fill=(170, 160, 190))
    for r, ch in enumerate(LINEUP):
        y = PAD + 46 + r * (S * Z + 6)
        d.rectangle([PAD, y, W - PAD, y + S * Z], fill=(43, 38, 60) if r % 2 == 0 else (232, 226, 214))
        d.rectangle([PAD + LAB, y + GROUND * Z + 2, W - PAD, y + GROUND * Z + 3], fill=(96, 88, 120))
        d.text((PAD + 8, y + 30), CAST[ch][0].upper(), fill=(255, 243, 224) if r % 2 == 0 else (40, 36, 50))
        d.text((PAD + 8, y + 46), CAST[ch][2], fill=(170, 160, 190) if r % 2 == 0 else (110, 100, 120))
        for c, name in enumerate(FRAMES):
            fr = frame(ch, name).image(team=ORANGE if r % 2 == 0 else TEALTEAM).resize((S * Z, S * Z), Image.NEAREST)
            im.paste(fr, (PAD + LAB + c * S * Z, y), fr)
    im.save(here.parent / 'concepts' / 'v3-creatures.png')

    # a moving preview: the cast in a row, walking, firing, casting, getting hurt and going down
    seq = ['idle1', 'idle2', 'idle1', 'idle2'] + ['walk1', 'walk2', 'walk3', 'walk4'] * 3 + ['jump1', 'jump2', 'jump2', 'idle1',
           'aim', 'aim', 'fire1', 'fire2', 'aim', 'idle1', 'cast1', 'cast2', 'cast1', 'cast2', 'idle1', 'hurt', 'hurt', 'ko1', 'ko2', 'ko2', 'ko2']
    Z, gif = 3, []
    for name in seq:
        g = Image.new('RGB', (S * Z * 5 + 20, (S * Z + 22) * 2 + 10), (43, 38, 60)); gd = ImageDraw.Draw(g)
        for i, ch in enumerate(LINEUP):
            x, y = 10 + (i % 5) * S * Z, 6 + (i // 5) * (S * Z + 22)
            gd.rectangle([x, y + GROUND * Z + 3, x + S * Z - 1, y + GROUND * Z + 5], fill=(96, 88, 120))
            fr = frame(ch, name).image(team=ORANGE if i % 2 == 0 else TEALTEAM).resize((S * Z, S * Z), Image.NEAREST)
            g.paste(fr, (x, y), fr); gd.text((x + 50, y + S * Z + 6), CAST[ch][0], fill=(255, 243, 224))
        gif.append(g)
    gif[0].save(here.parent / 'concepts' / 'v3-creatures.gif', save_all=True, append_images=gif[1:], duration=140, loop=0)
    print('wrote sprites/creatures.png', sheet.size, 'and concepts/v3-creatures.png', im.size, 'and the gif')


if __name__ == '__main__':
    main()
