# Wormsbound v3 creature lineup: a CONCEPT sheet, drawn in code (Pillow, no image model, nothing licensed).
# © 2026 justaskjoe. All rights reserved.
#
# Run: python3 lineup.py            writes ../concepts/v3-lineup.png
#
# The point of the sheet: each of the ten characters is a different creature with a different outline, so you can
# tell them apart as plain black shapes at game size. Class sets the shape (tank wide, scout lean, gunner upright
# with a big weapon, engineer low with a tool, controller tall or floating). The team colour is only on a band,
# scarf or panel (TEAM below), not the whole body. One frame each, 48 x 48 art pixels, facing right, feet on row 45.
# Nothing here is used by the game yet; art/tools/units.py still draws the sprites the build ships.
import pathlib
from PIL import Image, ImageDraw

S, GROUND = 48, 45
INK = (30, 26, 43)
TEAM = [(170, 70, 20), (255, 138, 61), (255, 196, 140)]      # the concept sheet's team colour (orange side)
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


class Frame:
    def __init__(self): self.px = {}
    def put(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < S and 0 <= y < S and c is not None: self.px[(x, y)] = c
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
        if big: self.rect(x - 1, y - 1, x + 1, y + 1, WHITE); self.rect(x, y, x + 1, y + 1, INK)
        else: self.put(x, y, INK); self.put(x, y - 1, INK); self.put(x - 1, y - 1, WHITE)
    def image(self, flat=None):
        im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        for (x, y), c in self.px.items(): im.putpixel((x, y), (flat or c) + (255,))
        return im


# ---------------------------------------------------------------- the ten
def brick(f):   # TANK. Armadillo in riveted plate: a wide square block with a shoulder cannon.
    for x in (10, 17, 28, 33): f.rect(x, 41, x + 3, GROUND, TAN[0])                 # four stub legs
    f.cap(6, 40, 2, 43, 2, TAN, 1)                                                  # tail
    f.disc(21, 31, 16, 11.5, STEEL)                                                 # the shell
    f.rect(6, 31, 36, 40, STEEL[1]); f.rect(6, 38, 36, 40, STEEL[0])                # squared-off skirt
    for x in (12, 19, 26, 32): f.line(x, 21, x, 40, STEEL[0])                       # plate bands
    for x in (9, 15, 22, 29, 35): f.put(x, 36, STEEL[2])                            # rivets
    f.disc(40, 35, 5.5, 4.5, TAN); f.cap(43, 37, 46, 39, 1.6, TAN, 1)               # head and snout
    f.poly([(37, 31), (39, 25), (41, 31)], TAN[1])                                  # ear
    f.cap(20, 17, 42, 12, 3.2, STEEL); f.rect(17, 15, 23, 22, STEEL[0])             # cannon and its mount
    f.cap(30, 15, 33, 14, 3.4, TEAM)                                                # team band on the barrel
    f.outline(); f.eye(41, 34); f.put(46, 39, INK); f.disc(43.5, 11.5, 1.6, 1.6, INK)

def tusk(f):    # TANK. Boar: a forward wedge, head down, tusks up.
    for x in (11, 17, 27, 32): f.rect(x, 40, x + 2, GROUND, DARKBROWN[0])
    f.cap(13, 34, 30, 33, 9.5, BROWN, 8)                                            # body, higher at the shoulder
    for x in range(8, 30, 3): f.poly([(x, 26), (x + 2, 19 + (x % 2)), (x + 4, 26)], DARKBROWN[0])   # bristle mane
    f.line(4, 30, 2, 27, DARKBROWN[1]); f.line(2, 27, 4, 25, DARKBROWN[1])          # curly tail
    f.disc(36, 34, 7.5, 7, BROWN); f.cap(40, 38, 44, 39, 3, TAN, 2.6)               # head, snout
    f.poly([(31, 27), (33, 21), (36, 27)], BROWN[0])                                # ear
    f.cap(30, 26, 40, 25, 3, STEEL); f.rect(34, 20, 36, 24, STEEL[1])               # ram helmet and its ridge
    f.rect(32, 24, 38, 25, TEAM[1])                                                 # team stripe
    f.cap(41, 40, 46, 37, 1.6, PALE, 1.4); f.cap(46, 37, 46, 28, 1.4, PALE, 0.7)  #                                         # the tusk
    f.outline(); f.eye(38, 31); f.put(46, 36, INK); f.put(46, 38, INK)

def zip_(f):    # SCOUT. Ferret: long, thin, leaning into a run, scarf trailing.
    f.cap(17, 41, 4, 36, 2.6, BROWN, 1.6)                                           # tail
    f.cap(18, 41, 21, GROUND, 1.8, DARKBROWN); f.cap(24, 40, 28, GROUND, 1.8, DARKBROWN)   # legs mid-stride
    f.cap(18, 38, 29, 20, 5, TAN, 4.2)                                              # the long torso
    f.cap(27, 26, 35, 29, 1.6, TAN)                                                 # arm reaching forward
    f.disc(32, 15, 5.5, 4.8, TAN); f.cap(35, 16, 40, 18, 2, PALE, 1.2)              # head, muzzle
    f.disc(28, 10, 1.8, 2, BROWN[0]); f.disc(33, 9, 1.8, 2, BROWN[0])               # ears
    f.rect(29, 13, 36, 15, DARKBROWN[0])                                            # bandit mask
    f.rect(30, 12, 33, 15, STEEL[1]); f.rect(31, 13, 32, 14, SPARK)                 # goggle
    f.cap(27, 21, 31, 22, 2.2, TEAM)                                                # scarf at the neck
    f.poly([(27, 20), (10, 14), (13, 19), (8, 22), (27, 24)], TEAM[1])              # scarf tail, flying back
    f.outline(); f.put(41, 18, INK)

def hopper(f):  # SCOUT. Frog: a crouched triangle, huge back leg, eyes on top.
    f.cap(12, 39, 20, 33, 6.5, GREEN, 5); f.cap(6, 44, 20, 44, 1.6, GREEN)          # folded back leg and long foot
    f.disc(26, 35, 11, 8.5, GREEN); f.disc(28, 39, 8, 4.5, [GREEN[1], CREAM, WHITE])       # body, pale belly
    f.cap(33, 38, 36, 44, 1.8, GREEN); f.rect(35, 44, 39, GROUND, GREEN[0])         # front arm
    f.disc(33, 28, 8, 6, GREEN)                                                     # head
    f.disc(29, 21, 4, 4, GREEN); f.disc(37, 22, 3.6, 3.6, GREEN)                    # eye bumps
    f.rect(25, 26, 36, 27, TEAM[1])                                                 # headband
    f.line(40, 30, 43, 22, BROWN[1]); f.line(43, 22, 41, 17, BROWN[1]); f.line(43, 22, 46, 18, BROWN[1])   # slingshot
    f.outline(); f.eye(29, 21, True); f.eye(37, 22, True); f.line(33, 31, 40, 30, GREEN[0])

def volt(f):    # GUNNER. Gecko: upright, a coil pack with two tall antennae.
    f.cap(18, 40, 8, 43, 3, TEAL, 1.2); f.cap(8, 43, 5, 39, 1.2, TEAL, 0.8)         # tail, curled at the tip
    f.rect(20, 41, 24, GROUND, TEAL[0]); f.rect(27, 41, 32, GROUND, TEAL[0])        # splayed toe pads
    f.rect(11, 22, 17, 37, STEEL[1]); f.rect(11, 22, 17, 23, STEEL[2]); f.rect(11, 35, 17, 37, STEEL[0])   # the pack
    for y in (26, 29, 32): f.rect(11, y, 17, y, GOLD[1])                            # copper windings
    f.line(12, 21, 9, 6, STEEL[1]); f.line(16, 21, 18, 4, STEEL[1])                 # two antennae
    f.disc(9, 5, 2, 2, SPARK); f.disc(18.5, 3.5, 2, 2, SPARK)
    f.cap(24, 36, 25, 24, 6, TEAL, 5); f.disc(26, 35, 4, 5, [TEAL[1], CREAM, WHITE])       # body, pale belly
    f.rect(18, 25, 29, 26, TEAM[1])                                                 # pack strap
    f.cap(28, 28, 37, 27, 1.6, TEAL); f.cap(37, 27, 44, 27, 2.2, STEEL)             # arm and a stubby arc gun
    f.disc(28, 16, 8, 5.5, TEAL)                                                    # wide flat head
    f.outline(); f.eye(31, 15, True); f.line(31, 19, 36, 18, TEAL[0]); f.put(45, 27, SPARK)

def flint(f):   # GUNNER. Salamander: hunched under a welding mask, flame tank on its back.
    f.cap(18, 42, 5, 43, 3.4, EMBER, 1.4)                                           # thick tail along the ground
    f.rect(19, 42, 23, GROUND, EMBER[0]); f.rect(27, 42, 31, GROUND, EMBER[0])
    f.cap(12, 24, 12, 37, 3.6, RED); f.rect(9, 29, 15, 30, TEAM[1]); f.rect(11, 19, 13, 21, STEEL[1])   # tank, band, valve
    f.cap(23, 38, 26, 27, 7, EMBER, 6)                                              # hunched body
    for p in ((21, 33), (25, 37), (27, 30)): f.put(p[0], p[1], INK)                 # spots
    f.cap(29, 22, 34, 21, 6, EMBER)                                                 # head, pushed forward
    f.poly([(29, 15), (40, 15), (41, 27), (30, 28)], STEEL[1]); f.rect(29, 15, 40, 16, STEEL[2])   # welding mask
    f.rect(32, 20, 39, 22, INK); f.rect(33, 21, 38, 21, FLAME[0])                   # visor slit, glowing
    f.line(13, 37, 22, 41, INK); f.cap(28, 32, 37, 33, 1.6, EMBER); f.cap(37, 33, 43, 32, 1.8, STEEL)   # hose, arm, nozzle
    f.disc(45.5, 31, 1.6, 2.2, FLAME[1])                                            # pilot light
    f.outline(); f.put(46, 29, FLAME[0])

def digger(f):  # ENGINEER. Mole: low to the ground, enormous claws, lamp helmet.
    f.disc(20, 37, 15, 8.5, SLATE)                                                  # low velvet body
    f.rect(9, 43, 13, GROUND, SLATE[0]); f.put(4, 39, PINK); f.put(3, 40, PINK)     # back foot, stub tail
    f.cap(32, 35, 41, 38, 5.5, SLATE, 2.4); f.disc(44.5, 38.5, 1.8, 1.8, PINK)      # pointed head, pink nose
    for i, x in enumerate((30, 34, 38)): f.poly([(x, 40), (x + 4, 40), (x + 6 + i, 46)], WHITE)   # three huge claws
    f.cap(27, 39, 34, 41, 3, SLATE)                                                 # the arm they hang off
    f.disc(30, 30, 6.5, 4.5, GOLD); f.rect(24, 31, 37, 32, TEAM[1])                 # helmet and team band
    f.rect(35, 27, 38, 30, STEEL[1]); f.rect(39, 27, 40, 30, FLAME[1])              # lamp
    f.outline(); f.put(38, 35, INK)
    for x in (42, 44, 46): f.put(x, 28 + (x - 42) // 2, GOLD[2])                    # lamp beam

def patch(f):   # ENGINEER. Beaver: low and round, flat paddle tail, hard hat, wrench up.
    f.disc(9, 42, 8.5, 3, DARKBROWN)
    for x in (4, 8, 12): f.line(x, 40, x + 2, 44, DARKBROWN[0])                     # paddle tail, cross-hatched
    f.rect(18, 42, 23, GROUND, DARKBROWN[0]); f.rect(27, 42, 32, GROUND, DARKBROWN[0])
    f.disc(23, 35, 10, 9.5, BROWN); f.disc(26, 37, 6, 6, TAN)                       # body, pale belly
    f.rect(15, 38, 31, 39, BROWN[0]); f.rect(19, 39, 22, 42, STEEL[1])              # tool belt and pouch
    f.disc(31, 24, 7.5, 6.5, BROWN); f.disc(36, 26, 3.6, 3, TAN)                    # head, muzzle
    f.rect(37, 28, 38, 30, WHITE)                                                   # buck teeth
    f.disc(30, 19, 8, 4.5, GOLD); f.rect(22, 21, 40, 22, GOLD[0]); f.rect(23, 19, 37, 19, TEAM[1])   # hard hat, brim, stripe
    f.cap(30, 32, 39, 24, 1.8, BROWN); f.cap(39, 24, 42, 12, 1.4, STEEL)            # arm, wrench handle
    f.rect(40, 7, 45, 11, STEEL[1])                                                 # wrench head
    for p in ((42, 7), (43, 7), (42, 8), (43, 8)): f.px.pop(p, None)                # its open jaw
    f.outline(); f.eye(34, 23); f.put(39, 25, INK)

def gale(f):    # CONTROLLER. Heron: tall and thin on stilt legs, kite wings behind.
    f.poly([(22, 26), (3, 9), (6, 24)], TEAM[1]); f.poly([(22, 26), (6, 24), (4, 37)], TEAM[0])   # kite wing, two panels
    f.line(22, 26, 3, 9, BROWN[0]); f.line(22, 26, 4, 37, BROWN[0]); f.line(22, 26, 6, 24, BROWN[0])   # struts
    f.line(4, 37, 2, 43, TEAM[2]); f.line(2, 43, 5, 46, TEAM[2])                    # kite tail
    f.line(23, 32, 22, 44, GOLD[0]); f.line(27, 32, 28, 44, GOLD[0])                # stilt legs
    f.rect(22, 44, 25, GROUND, GOLD[0]); f.rect(28, 44, 31, GROUND, GOLD[0])
    f.disc(24, 28, 7, 5, HERON)                                                     # small body
    f.cap(28, 25, 26, 17, 2, HERON); f.cap(26, 17, 30, 9, 2, HERON)                 # S-bend neck
    f.disc(31, 7, 3.4, 3, HERON); f.cap(33, 8, 44, 10, 1.4, GOLD, 0.6)              # head, long beak
    f.line(29, 5, 22, 2, SLATE[0]); f.line(29, 6, 21, 5, SLATE[0])                  # crest plumes
    f.outline(); f.put(32, 6, INK)

def nimbus(f):  # CONTROLLER. Sheep with cloud for wool: round, floating, a rain cloud of its own.
    f.disc(24, 45.5, 9, 1.4, (0, 0, 0))                                             # shadow on the ground: it floats
    for x in (18, 22, 28, 32): f.rect(x, 34, x + 1, 38, SLATE[0])                   # dangling legs
    for cx, cy, r in ((16, 27, 7), (24, 23, 8), (31, 27, 7), (22, 31, 7.5), (29, 31, 6.5), (11, 30, 4.5)):
        f.disc(cx, cy, r, r * 0.9, CLOUD)                                           # the wool
    f.disc(37, 27, 5, 5.5, SLATE); f.cap(33, 22, 30, 21, 1.6, SLATE)                # dark face, ear
    f.rect(33, 31, 37, 32, TEAM[1]); f.disc(35, 34, 1.4, 1.4, GOLD[1])              # collar and bell
    for cx, cy, r in ((19, 8, 4), (25, 6, 5), (31, 8, 4)): f.disc(cx, cy, r, r * 0.8, STORM)   # its own storm cloud
    f.outline(); f.eye(39, 26)
    for x, y in ((19, 13), (24, 15), (29, 13), (33, 15)): f.line(x, y, x - 1, y + 2, RAIN)   # rain


CAST = [('Brick', 'Tank', 'armadillo', brick), ('Tusk', 'Tank', 'boar', tusk), ('Zip', 'Scout', 'ferret', zip_),
        ('Hopper', 'Scout', 'frog', hopper), ('Volt', 'Gunner', 'gecko', volt), ('Flint', 'Gunner', 'salamander', flint),
        ('Digger', 'Engineer', 'mole', digger), ('Patch', 'Engineer', 'beaver', patch), ('Gale', 'Controller', 'heron', gale),
        ('Nimbus', 'Controller', 'cloud sheep', nimbus)]


def sheet():
    Z, PAD, CW = 5, 18, 5 * S + 36                       # colour sprites at 5x; five to a row
    W, RH = CW * 5 + PAD * 2, 5 * S + 2 * S + 64
    H = PAD + 44 + RH * 2 + 150
    BG, PANEL, TXT, DIM = (27, 24, 38), (43, 38, 60), (255, 243, 224), (170, 160, 190)
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.text((PAD, PAD), 'WORMSBOUND v3  creature lineup (concept)   class sets the shape; team colour is only the band, scarf or panel', fill=TXT)
    d.text((PAD, PAD + 16), 'Each one is shown in colour, then as a plain black shape at game size. The bottom strip is the whole cast as shapes.', fill=DIM)
    frames = []
    for i, (name, cls, animal, fn) in enumerate(CAST):
        f = Frame(); fn(f); frames.append(f)
        x0, y0 = PAD + (i % 5) * CW, PAD + 44 + (i // 5) * RH
        d.rectangle([x0 + 4, y0, x0 + CW - 6, y0 + RH - 10], fill=PANEL)
        d.rectangle([x0 + 4, y0 + 5 * GROUND + 12, x0 + CW - 6, y0 + 5 * GROUND + 14], fill=(70, 62, 96))        # ground line
        big = f.image().resize((S * Z, S * Z), Image.NEAREST); im.paste(big, (x0 + 18, y0 + 8), big)
        d.rectangle([x0 + 18, y0 + 5 * S + 14, x0 + 18 + 2 * S + 8, y0 + 5 * S + 2 * S + 22], fill=(232, 226, 214))
        sil = f.image(flat=(20, 18, 28)).resize((S * 2, S * 2), Image.NEAREST); im.paste(sil, (x0 + 22, y0 + 5 * S + 18), sil)
        d.text((x0 + 2 * S + 40, y0 + 5 * S + 22), name.upper(), fill=TXT)
        d.text((x0 + 2 * S + 40, y0 + 5 * S + 40), cls, fill=(255, 211, 77))
        d.text((x0 + 2 * S + 40, y0 + 5 * S + 58), animal, fill=DIM)
    y = PAD + 44 + RH * 2 + 6
    d.rectangle([PAD, y, W - PAD, y + 124], fill=(232, 226, 214))
    d.rectangle([PAD, y + 8 + 2 * GROUND + 2, W - PAD, y + 8 + 2 * GROUND + 3], fill=(150, 140, 130))
    step = (W - 2 * PAD - 20) // 10
    for i, f in enumerate(frames):
        sil = f.image(flat=(20, 18, 28)).resize((S * 2, S * 2), Image.NEAREST); im.paste(sil, (PAD + 10 + i * step + (step - 96) // 2, y + 8), sil)
        d.text((PAD + 10 + i * step + step // 2 - 3 * len(CAST[i][0]), y + 108), CAST[i][0], fill=(60, 54, 70))
    out = pathlib.Path(__file__).resolve().parent.parent / 'concepts' / 'v3-lineup.png'
    im.save(out); print('wrote', out.name, im.size)


if __name__ == '__main__':
    sheet()
