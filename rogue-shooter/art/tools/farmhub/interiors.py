import sys, math, json, random
sys.path.insert(0, '.')
from farm import *
from npcs import *

VOID = '#120c0a'

def run_objs(objs):
    """Draws depth-sorted furniture. export_world.py swaps this out to capture each piece as its own sprite."""
    for _, f in objs: f()

# ------------------------------------------------------------- shells

def wood_floor(c, x, y, w, h, base='#a0683c', dark='#6e4322', light='#bf8452', bh=6):
    c.r(x, y, w, h, base)
    for k, yy in enumerate(range(y, y + h, bh)):
        c.r(x, yy + bh - 1, w, 1, dark)
        off = c.rng.randint(0, 30)
        for xx in range(x + off, x + w, c.rng.randint(28, 44)):
            c.r(xx, yy, 1, bh - 1, dark)
        if k % 3 == 0: c.r(x, yy, w, 1, light)
        for _ in range(w // 40):
            c.p(x + c.rng.randint(2, w - 2), yy + 2, dark)


def stone_floor(c, x, y, w, h, base='st0', dark='st1', light='st2', tw=12, th=9):
    c.r(x, y, w, h, base)
    for k, yy in enumerate(range(y, y + h, th)):
        c.r(x, yy, w, 1, dark)
        off = tw // 2 if k % 2 else 0
        for xx in range(x + off, x + w, tw):
            c.r(xx, yy, 1, th, dark)
            v = c.rng.random()
            if v < 0.2: c.r(xx + 1, yy + 1, tw - 1, th - 1, light)
            elif v > 0.85: c.r(xx + 1, yy + 1, tw - 1, th - 1, '#8a8a94')
            c.r(xx + 1, yy + 1, tw - 2, 1, light)


def dirt_floor(c, x, y, w, h):
    c.r(x, y, w, h, 'd1')
    for _ in range(w * h // 30):
        px, py = x + c.rng.randrange(w), y + c.rng.randrange(h)
        c.p(px, py, c.rng.choice(['d0', 'd3', 'd0']))
    for _ in range(w * h // 90):
        px, py = x + c.rng.randrange(w - 4), y + c.rng.randrange(h - 2)
        c.line([(px, py), (px + c.rng.randint(2, 5), py + c.rng.randint(-1, 1))], c.rng.choice(['hay', 'hay1']))


def sand_floor(c, x, y, w, h, m=None):
    c.r(x, y, w, h, 'sand')
    for _ in range(w * h // 18):
        c.p(x + c.rng.randrange(w), y + c.rng.randrange(h), c.rng.choice(['sand1', 'sand2', 'sand1']))


def wall_logs(c, x, y, w, h):
    c.r(x, y, w, h, '#8a5a34')
    for yy in range(y, y + h, 6):
        c.r(x, yy, w, 1, '#b07a48'); c.r(x, yy + 5, w, 1, '#4e2e16')
        for xx in range(x + c.rng.randint(0, 20), x + w, c.rng.randint(30, 60)): c.p(xx, yy + 3, '#5e3a1e'); c.p(xx + 1, yy + 3, '#5e3a1e')


def wall_planks_v(c, x, y, w, h, base='#9a6436', dark='#6e4322', light='#b47a46'):
    c.r(x, y, w, h, base)
    for xx in range(x, x + w, 7):
        c.r(xx, y, 1, h, dark); c.r(xx + 1, y, 1, h, light)
    c.r(x, y + h // 2, w, 2, dark)


def wall_plaster(c, x, y, w, h):
    c.r(x, y, w, h, 'cream')
    for xx in range(x, x + w, 34): c.r(xx, y, 4, h, 'w1')
    c.r(x, y, w, 3, 'w1'); c.r(x, y + h - 10, w, 10, '#6e4a6a'); c.r(x, y + h - 10, w, 1, 'pu2'); c.r(x, y + h - 2, w, 2, 'w3')


def room(c, x, y, w, h, wh, wall, floor, door_x=None, door_w=24, trim='#3a2416', trim2='#6e4322'):
    c.r(0, 0, c.W, c.H, VOID)
    wall(c, x, y, w, wh)
    c.r(x, y + wh - 3, w, 3, '#2b1d14')
    floor(c, x, y + wh, w, h - wh)
    c.tint(c.mask(lambda d: d.rectangle([x, y + wh, x + w - 1, y + wh + 5], fill=255)))
    c.r(x - 6, y - 6, w + 12, 6, trim); c.r(x - 6, y - 6, w + 12, 1, trim2)
    c.r(x - 6, y - 6, 6, h + 12, trim); c.r(x - 1, y, 1, h, trim2)
    c.r(x + w, y - 6, 6, h + 12, trim); c.r(x + w, y, 1, h, trim2)
    c.r(x - 6, y + h, w + 12, 8, trim); c.r(x - 6, y + h, w + 12, 1, trim2)
    if door_x is not None:
        c.r(door_x, y + h, door_w, 8, VOID)
        c.r(door_x + 2, y + h - 7, door_w - 4, 7, '#7a3a2a'); c.r(door_x + 3, y + h - 6, door_w - 6, 5, '#a8523a')
        for xx in range(door_x + 5, door_x + door_w - 4, 3): c.r(xx, y + h - 6, 1, 5, '#c8735a')


def wall_window(c, x, y, w=20, h=16, night=False):
    c.r(x - 2, y - 2, w + 4, h + 4, 'w3'); c.r(x - 1, y - 1, w + 2, h + 2, 'w0')
    c.r(x, y, w, h, '#2a3a5a' if night else 'wa2'); c.r(x, y, w, h // 3, '#3a4a6a' if night else 'wa3')
    c.r(x + w // 2, y, 1, h, 'w1'); c.r(x, y + h // 2, w, 1, 'w1')
    c.r(x - 3, y + h + 1, w + 6, 2, 'w2')
    if not night:
        c.tint(c.mask(lambda d: d.polygon([(x, y + h + 4), (x + w, y + h + 4), (x + w + 14, y + h + 34), (x + 10, y + h + 34)], fill=255)), (1.12, 1.1, 1.0))


def lantern(c, x, y, glow_c='glow', r=26):
    c.r(x, y - 8, 1, 8, 'out')
    c.r(x - 3, y, 7, 7, 'out'); c.r(x - 2, y + 1, 5, 5, 'yellow'); c.p(x - 1, y + 2, 'glow')
    c.glow(x, y + 4, r, glow_c, 0.3)


def rug(c, x, y, w, h, base, edge, pattern):
    c.e(x, y, w, h, edge); c.e(x, y, w - 2, h - 2, base); c.e(x, y, w - 6, h - 4, edge); c.e(x, y, w - 7, h - 5, base)
    c.e(x, y, w // 3, h // 3, pattern)

# ------------------------------------------------------------- furniture

def chest(c, x, y, trim='pu0', open_=True, big=False):
    if big: return big_chest(c, x, y, trim)
    c.shadow_e(x + 3, y + 1, 15, 3)
    c.r(x - 13, y - 14, 26, 14, 'out'); c.r(x - 12, y - 13, 24, 12, '#8a5a34'); c.r(x - 12, y - 13, 24, 1, '#b07a48')
    c.r(x - 12, y - 9, 24, 2, trim); c.r(x - 8, y - 13, 2, 12, 'st1'); c.r(x + 6, y - 13, 2, 12, 'st1')
    c.r(x - 2, y - 10, 4, 4, 'gold'); c.p(x - 1, y - 8, 'out')
    if open_:
        c.r(x - 13, y - 24, 26, 10, 'out'); c.r(x - 12, y - 23, 24, 8, '#6e4322'); c.r(x - 12, y - 23, 24, 2, trim)
        c.r(x - 11, y - 15, 22, 2, '#2b1d14')
        for i, cc in enumerate(['red0', 'teal', 'pu2', 'gr2', 'gold', 'wa0']):
            bx = x - 10 + i * 4
            c.r(bx, y - 17, 3, 4, cc); c.p(bx + 1, y - 18, 'cream'); c.p(bx, y - 17, 'white')
        c.glow(x, y - 16, 16, 'teal', 0.25)


def big_chest(c, x, y, trim):
    c.shadow_e(x + 4, y + 1, 21, 4)
    c.r(x - 19, y - 20, 38, 20, 'out'); c.r(x - 18, y - 19, 36, 18, '#8a5a34'); c.r(x - 18, y - 19, 36, 2, '#b07a48')
    for yy in range(y - 15, y - 2, 5): c.r(x - 18, yy, 36, 1, '#6e4322')
    c.r(x - 18, y - 12, 36, 3, trim); c.r(x - 18, y - 12, 36, 1, 'pu2')
    for bx in (x - 13, x + 10): c.r(bx, y - 19, 3, 18, 'st1'); c.r(bx, y - 19, 1, 18, 'st2')
    c.r(x - 3, y - 14, 6, 6, 'gold'); c.r(x - 2, y - 13, 4, 4, 'gold1'); c.p(x, y - 11, 'out')
    c.r(x - 19, y - 34, 38, 14, 'out'); c.r(x - 18, y - 33, 36, 12, '#6e4322'); c.r(x - 18, y - 33, 36, 3, trim); c.r(x - 18, y - 33, 36, 1, 'pu2')
    for bx in (x - 13, x + 10): c.r(bx, y - 33, 3, 12, 'st1')
    c.r(x - 17, y - 21, 34, 3, '#2b1d14')
    for i, cc in enumerate(['red0', 'teal', 'pu2', 'gr2', 'gold', 'wa0', 'pk0', 'orange']):
        bx = x - 16 + i * 4
        tall = i % 2
        c.r(bx, y - 24 - tall, 3, 5 + tall, cc); c.r(bx + 1, y - 26 - tall, 1, 2, 'cream'); c.p(bx, y - 23 - tall, 'white')
    c.glow(x, y - 22, 22, 'pu2', 0.3)


def potion(c, x, y, cc):
    c.shadow_e(x + 1, y, 2, 1)
    c.r(x - 2, y - 5, 5, 5, 'out'); c.r(x - 1, y - 4, 3, 3, cc); c.r(x, y - 7, 1, 2, 'cream'); c.p(x - 1, y - 4, 'white')


def crop_bin(c, x, y):
    c.shadow_e(x + 4, y + 1, 22, 4)
    c.r(x - 20, y - 18, 40, 18, 'out'); c.r(x - 19, y - 17, 38, 16, '#9a6436')
    for xx in range(x - 19, x + 19, 6): c.r(xx, y - 17, 1, 16, '#6e4322')
    c.r(x - 19, y - 17, 38, 2, '#c08550'); c.r(x - 19, y - 6, 38, 1, '#6e4322')
    # produce heap
    rng = random.Random(5)
    items = [('pumpkin', -12, -18), ('pumpkin', 8, -19), ('cabbage', -2, -20), ('tomato', 14, -16), ('wheat', -16, -22), ('berry', 2, -15), ('tomato', -7, -15)]
    heap = [('orange1', 'orange'), ('leaf1', 'leaf3'), ('red1', 'red0'), ('pu1', 'pu2')]
    for i in range(16):
        a, b = heap[i % 4]
        px, py = x - 15 + rng.randint(0, 30), y - 22 + rng.randint(0, 6)
        c.e(px, py, 3, 2, a); c.p(px - 1, py - 1, b)
    c.r(x - 16, y - 34, 2, 14, 'hay1'); c.r(x - 13, y - 33, 2, 13, 'hay'); c.r(x - 10, y - 32, 2, 12, 'hay1'); c.r(x - 16, y - 27, 8, 2, 'w1')
    for dx, dy in [(-4, -26), (6, -27)]:
        c.e(x + dx, y + dy, 5, 4, 'out'); c.e(x + dx, y + dy, 4, 3, 'orange1'); c.e(x + dx - 1, y + dy - 1, 2, 2, 'orange'); c.r(x + dx, y + dy - 5, 1, 2, 'leaf1')
    c.e(x + 13, y - 24, 4, 4, 'out'); c.e(x + 13, y - 24, 3, 3, 'leaf3'); c.p(x + 12, y - 25, 'leaf4')
    for dx in (-1, 3): c.r(x + dx, y - 29, 2, 6, 'orange'); c.p(x + dx, y - 30, 'leaf2')


def fireplace(c, x, y, wall_top):
    w = 40
    c.r(x - w // 2 - 1, wall_top + 2, w + 2, y - wall_top - 1, 'out')
    wall_stone(c, x - w // 2, wall_top + 3, w, y - wall_top - 3, 'st0', 'st1', 'st2')
    c.r(x - 12, y - 18, 24, 18, 'out'); c.e(x, y - 18, 12, 5, 'out')
    c.r(x - 11, y - 17, 22, 17, '#2a1a12'); c.e(x, y - 17, 11, 4, '#2a1a12')
    c.r(x - 9, y - 5, 18, 3, 'trunk1'); c.r(x - 7, y - 6, 14, 2, 'trunk')
    c.poly([(x - 8, y - 5), (x - 4, y - 15), (x, y - 9), (x + 3, y - 17), (x + 8, y - 5)], 'orange')
    c.poly([(x - 5, y - 5), (x - 2, y - 11), (x + 2, y - 13), (x + 5, y - 5)], 'yellow'); c.r(x - 1, y - 7, 2, 2, 'glow')
    c.r(x - w // 2 - 3, y - 24, w + 6, 4, 'out'); c.r(x - w // 2 - 2, y - 23, w + 4, 2, '#8a5a34')
    for cx_, cc in [(x - 14, 'cream'), (x + 13, 'cream')]:
        c.r(cx_, y - 29, 2, 5, cc); c.p(cx_, y - 31, 'yellow'); c.p(cx_ + 1, y - 30, 'orange')
    c.r(x - 4, y - 30, 8, 6, 'gold1'); c.r(x - 3, y - 29, 6, 4, '#ffd27a')
    c.glow(x, y - 8, 46, 'orange', 0.38)


def bed(c, x, y, quilt='red0', quilt2='red2'):
    c.shadow_e(x + 4, y + 1, 16, 3)
    c.r(x - 15, y - 44, 30, 10, 'out'); c.r(x - 14, y - 43, 28, 8, '#8a5a34'); c.r(x - 14, y - 43, 28, 2, '#b07a48')
    c.r(x - 15, y - 35, 30, 35, 'out'); c.r(x - 14, y - 34, 28, 33, 'white')
    c.r(x - 12, y - 33, 24, 7, 'white1'); c.r(x - 11, y - 32, 22, 5, 'white')
    c.r(x - 14, y - 24, 28, 23, quilt)
    for yy in range(y - 24, y - 1, 6):
        for xx in range(x - 14, x + 14, 6): c.r(xx + (3 if (yy // 6) % 2 else 0), yy, 3, 3, quilt2)
    c.r(x - 14, y - 24, 28, 2, 'white1'); c.r(x - 15, y - 2, 30, 3, '#6e4322')


def table(c, x, y, w=30, h=14):
    c.shadow_e(x + 4, y + 2, w // 2 + 3, 3)
    c.r(x - w // 2 + 1, y - 6, 2, 7, '#5e3a1e'); c.r(x + w // 2 - 3, y - 6, 2, 7, '#5e3a1e')
    c.r(x - w // 2 - 1, y - h - 6, w + 2, h + 2, 'out'); c.r(x - w // 2, y - h - 5, w, h, '#a0683c'); c.r(x - w // 2, y - h - 5, w, 2, '#c08550')
    c.r(x - w // 2, y - 7, w, 2, '#6e4322')


def chair(c, x, y, back=True):
    c.shadow_e(x + 2, y + 1, 5, 2)
    c.r(x - 4, y - 5, 2, 6, '#5e3a1e'); c.r(x + 2, y - 5, 2, 6, '#5e3a1e')
    c.r(x - 5, y - 8, 10, 4, 'out'); c.r(x - 4, y - 7, 8, 2, '#b07a48')
    if back: c.r(x - 5, y - 17, 10, 10, 'out'); c.r(x - 4, y - 16, 8, 8, '#8a5a34'); c.r(x - 2, y - 14, 4, 5, '#6e4322')


def bookshelf(c, x, y, h=40, w=26):
    c.shadow_e(x + 3, y + 1, w // 2, 2)
    c.r(x - w // 2 - 1, y - h - 1, w + 2, h + 1, 'out'); c.r(x - w // 2, y - h, w, h, '#6e4322')
    rng = random.Random(x * 7 + y)
    for sy in range(y - h + 3, y - 4, 10):
        c.r(x - w // 2 + 2, sy + 7, w - 4, 2, '#a0683c')
        xx = x - w // 2 + 2
        while xx < x + w // 2 - 3:
            bw = rng.randint(2, 3); bh = rng.randint(5, 7)
            c.r(xx, sy + 7 - bh, bw, bh, rng.choice(['red0', 'blue', 'gr0', 'pu0', 'gold1', 'teal1', 'orange1']))
            xx += bw + (1 if rng.random() < 0.3 else 0)


def plant_pot(c, x, y, big=False):
    c.shadow_e(x + 2, y + 1, 5, 2)
    c.r(x - 4, y - 7, 8, 7, 'out'); c.r(x - 3, y - 6, 6, 6, '#c0603a'); c.r(x - 3, y - 6, 6, 1, '#df8a5a')
    for dx, dy, r in [(-3, -12, 4), (3, -12, 4), (0, -16, 4)] + ([(0, -21, 4)] if big else []):
        c.e(x + dx, y + dy, r + 1, r + 1, 'out'); c.e(x + dx, y + dy, r, r, 'leaf1'); c.e(x + dx - 1, y + dy - 1, r - 2, r - 2, 'leaf2')


def counter(c, x, y, w=44):
    c.shadow_e(x + w // 2 + 3, y + 1, w // 2, 2)
    c.r(x - 1, y - 18, w + 2, 19, 'out'); c.r(x, y - 17, w, 17, '#8a5a34'); c.r(x, y - 17, w, 4, '#c8b894'); c.r(x, y - 13, w, 1, '#6e4322')
    for xx in range(x + 2, x + w - 6, 11): c.r(xx, y - 11, 9, 9, '#6e4322'); c.r(xx + 4, y - 8, 1, 2, 'gold')
    c.r(x + 4, y - 22, 8, 5, 'st3'); c.r(x + 5, y - 21, 6, 2, 'st1'); c.r(x + 18, y - 21, 6, 4, 'w0'); c.p(x + 20, y - 22, 'red0'); c.p(x + 21, y - 22, 'red0')
    c.r(x + 30, y - 22, 3, 5, 'pk0'); c.r(x + 34, y - 21, 4, 4, 'cream')


def hanging_herbs(c, x, y, n=5):
    c.r(x, y, n * 7 + 2, 2, 'w1')
    for i in range(n):
        hx_ = x + 3 + i * 7
        c.r(hx_, y + 2, 1, 3, 'out')
        cc = ['gr0', 'pu2', 'leaf2', 'hay', 'gr2'][i % 5]
        c.poly([(hx_ - 2, y + 5), (hx_ + 3, y + 5), (hx_ + 1, y + 13)], cc); c.p(hx_, y + 6, 'leaf4')


def frame_pic(c, x, y, w=16, h=12, scene='hills'):
    c.r(x - 1, y - 1, w + 2, h + 2, 'gold1'); c.r(x, y, w, h, 'wa2'); c.r(x, y + h // 2, w, h - h // 2, 'leaf2'); c.e(x + w // 2, y + h // 2, w // 3, 3, 'leaf1'); c.e(x + 4, y + 3, 1, 1, 'yellow')

# ------------------------------------------------------------- cabin

def cabin_interior():
    c = Cv(320, 224, 101)
    X, Y, Wd, Hd, WH = 16, 14, 288, 196, 46
    room(c, X, Y, Wd, Hd, WH, wall_logs, wood_floor, door_x=148)
    wall_window(c, 60, Y + 10, 22, 18); wall_window(c, 232, Y + 10, 22, 18)
    frame_pic(c, 108, Y + 14)
    hanging_herbs(c, 248, Y + 34, 4)
    objs = []
    fireplace(c, 160, Y + WH + 6, Y)
    rug(c, 160, 132, 56, 24, '#a8523a', '#e6c48a', '#d6a05a')
    objs.append((Y + WH + 42, lambda: bed(c, 40, Y + WH + 42, 'blue', 'wa2')))
    objs.append((Y + WH + 8, lambda: bookshelf(c, 96, Y + WH + 8)))
    objs.append((Y + WH + 6, lambda: counter(c, 214, Y + WH + 6, 60)))
    objs.append((150, lambda: table(c, 238, 150, 34, 14)))
    objs.append((136, lambda: chair(c, 224, 136))); objs.append((136, lambda: chair(c, 252, 136)))
    objs.append((134, lambda: (c.r(232, 126, 5, 4, 'cream'), c.r(240, 125, 6, 4, 'st0'), c.p(242, 124, 'red0'))))
    # potion chest + loose bottles (labelled)
    objs.append((188, lambda: chest(c, 64, 188, 'pu0', big=True)))
    objs.append((192, lambda: (potion(c, 90, 192, 'red0'), potion(c, 96, 194, 'teal'), potion(c, 38, 192, 'pu2'))))
    c.label('Potion chest', 64, 140)
    # crop bin
    objs.append((190, lambda: crop_bin(c, 262, 190)))
    objs.append((194, lambda: (c.shadow_e(234, 195, 6, 2), c.e(232, 191, 5, 4, 'out'), c.e(232, 191, 4, 3, 'orange1'), c.e(231, 190, 2, 2, 'orange'))))
    c.label('Crop bin', 262, 152)
    objs.append((122, lambda: plant_pot(c, 290, 122, True)))
    objs.append((112, lambda: plant_pot(c, 128, 74)))
    objs.append((140, lambda: c.spr(CAT, {k: col(v) for k, v in CAT_PAL.items()}, 150, 134)))
    objs.append((100, lambda: (c.r(274, 88, 2, 12, 'st3'), lantern(c, 275, 80))))
    objs.sort(key=lambda o: o[0])
    run_objs(objs)
    c.label('Fireplace', 160, Y + 4)
    c.label('Bed', 40, 80)
    return c

# ------------------------------------------------------------- forge

def hearth(c, x, y, top):
    w = 64
    c.poly([(x - 26, top), (x + 26, top), (x + 34, y - 36), (x - 34, y - 36)], 'out')
    c.poly([(x - 25, top), (x + 25, top), (x + 32, y - 37), (x - 32, y - 37)], 'st3')
    for yy in range(top + 4, y - 37, 5): c.line([(x - 25 - (yy - top) * 7 // 40, yy), (x + 25 + (yy - top) * 7 // 40, yy)], 'st1')
    c.r(x - w // 2 - 1, y - 38, w + 2, 39, 'out')
    for k in range(0, 38, 5):
        for xx in range(x - w // 2 + (4 if (k // 5) % 2 else 0), x + w // 2, 8):
            c.r(xx, y - 37 + k, 7, 4, '#9a4a32'); c.r(xx, y - 37 + k, 7, 1, '#c06a4a')
        c.r(x - w // 2, y - 37 + k + 4, w, 1, '#5a2a1e')
    c.r(x - 20, y - 26, 40, 22, 'out'); c.e(x, y - 26, 20, 6, 'out')
    c.r(x - 19, y - 25, 38, 21, 'orange1'); c.e(x, y - 25, 19, 5, 'orange1')
    c.r(x - 15, y - 20, 30, 16, 'orange'); c.r(x - 10, y - 15, 20, 11, 'yellow'); c.r(x - 6, y - 10, 12, 5, 'glow')
    for i in range(9): c.r(x - 17 + i * 4, y - 6, 3, 2, 'ember' if i % 2 else 'out')
    c.r(x - w // 2 - 2, y - 4, w + 4, 5, 'st3'); c.r(x - w // 2 - 2, y - 4, w + 4, 1, 'st1')
    c.glow(x, y - 12, 70, 'orange', 0.42)


def anvil_big(c, x, y):
    c.shadow_e(x + 4, y + 2, 15, 4)
    c.r(x - 8, y - 12, 16, 13, 'trunk1'); c.r(x - 7, y - 12, 14, 12, 'trunk'); c.e(x, y - 13, 8, 3, 'w2'); c.e(x, y - 13, 4, 1, 'w0')
    c.r(x - 12, y - 24, 24, 7, 'out'); c.r(x - 11, y - 23, 22, 5, 'st1'); c.r(x - 11, y - 23, 22, 1, 'st2')
    c.poly([(x - 12, y - 23), (x - 19, y - 22), (x - 12, y - 19)], 'st1', 'out')
    c.r(x - 4, y - 18, 8, 5, 'out'); c.r(x - 3, y - 18, 6, 4, 'st3')
    c.r(x - 2, y - 26, 10, 3, 'orange'); c.r(x, y - 26, 5, 1, 'yellow')
    c.r(x + 5, y - 34, 3, 9, 'w1'); c.r(x + 2, y - 36, 9, 4, 'st3')
    for dx, dy in [(-6, -31), (10, -30), (-10, -27), (13, -34), (3, -38)]: c.p(x + dx, y + dy, 'yellow')
    c.glow(x + 2, y - 25, 14, 'orange', 0.35)


def weapon_rack_wall(c, x, y, w=60):
    c.r(x, y, w, 26, 'out'); c.r(x + 1, y + 1, w - 2, 24, '#6e4322'); c.r(x + 1, y + 1, w - 2, 2, '#8a5a34')
    for i in range(w // 10):
        xx = x + 5 + i * 10
        kind = i % 3
        if kind == 0:
            c.r(xx, y + 4, 2, 15, 'st2'); c.r(xx - 2, y + 18, 6, 1, 'gold1'); c.r(xx, y + 19, 2, 4, 'w1')
        elif kind == 1:
            c.r(xx + 1, y + 4, 1, 19, 'w1'); c.r(xx - 2, y + 4, 5, 6, 'st1'); c.r(xx - 2, y + 4, 1, 6, 'st2')
        else:
            c.r(xx, y + 3, 2, 20, 'w1'); c.poly([(xx - 1, y + 7), (xx + 3, y + 7), (xx + 1, y + 2)], 'st2')


def tool_rack(c, x, y):
    c.r(x, y, 34, 3, '#6e4322')
    for i, kind in enumerate(['hammer', 'tongs', 'hammer', 'file']):
        xx = x + 4 + i * 8
        c.r(xx, y + 3, 1, 13, 'w1')
        if kind == 'hammer': c.r(xx - 2, y + 3, 5, 3, 'st3')
        if kind == 'tongs': c.line([(xx - 1, y + 3), (xx - 2, y + 16)], 'st3'); c.line([(xx + 1, y + 3), (xx + 2, y + 16)], 'st3')
        if kind == 'file': c.r(xx, y + 6, 1, 8, 'st2')


def ore_bin(c, x, y, cols):
    c.shadow_e(x + 3, y + 1, 10, 3)
    c.r(x - 9, y - 12, 18, 12, 'out'); c.r(x - 8, y - 11, 16, 10, '#8a5a34'); c.r(x - 8, y - 8, 16, 1, '#6e4322')
    for i in range(7):
        px, py = x - 6 + (i * 5) % 13, y - 13 + (i % 3)
        c.e(px, py, 3, 2, 'out'); c.e(px, py, 2, 1, cols[i % 2])


def trough_q(c, x, y):
    c.shadow_e(x + 3, y + 1, 16, 3)
    c.r(x - 15, y - 10, 30, 10, 'out'); c.r(x - 14, y - 9, 28, 8, 'st1'); c.r(x - 12, y - 8, 24, 4, 'wa1'); c.r(x - 10, y - 8, 8, 1, 'wa2')
    for dx in (-4, 2, 7): c.e(x + dx, y - 12, 2, 2, 'smoke')


def grindstone(c, x, y):
    c.shadow_e(x + 3, y + 1, 10, 3)
    c.r(x - 9, y - 10, 2, 10, 'w1'); c.r(x + 7, y - 10, 2, 10, 'w1'); c.r(x - 9, y - 10, 18, 2, 'w0')
    c.e(x, y - 16, 7, 7, 'out'); c.e(x, y - 16, 6, 6, 'st0'); c.e(x, y - 16, 2, 2, 'st3'); c.r(x - 1, y - 23, 2, 2, 'st2')


def coal_pile(c, x, y):
    c.shadow_e(x + 2, y + 1, 12, 3)
    for i in range(12):
        c.e(x - 9 + (i * 7) % 19, y - 3 - (i % 4) * 2, 3, 2, '#2a2a30'); c.p(x - 9 + (i * 7) % 19, y - 4 - (i % 4) * 2, '#5a5a66')


def workbench(c, x, y):
    table(c, x, y, 40, 12)
    c.r(x - 14, y - 21, 10, 7, 'cream'); c.line([(x - 13, y - 19), (x - 6, y - 19)], 'blue'); c.line([(x - 13, y - 17), (x - 8, y - 17)], 'blue')
    c.r(x - 1, y - 20, 9, 3, 'st3'); c.r(x + 3, y - 18, 1, 4, 'w1'); c.r(x + 10, y - 21, 6, 3, 'st2')


def forge_interior():
    c = Cv(320, 224, 202)
    X, Y, Wd, Hd, WH = 16, 14, 288, 196, 52
    room(c, X, Y, Wd, Hd, WH, lambda c_, x, y, w, h: wall_stone(c_, x, y, w, h, 'st1', 'st3', 'st0'), lambda c_, x, y, w, h: stone_floor(c_, x, y, w, h, '#7d7480', '#5a525e', '#9a92a0'), door_x=148, trim='#2a2228', trim2='#4e4652')
    objs = []
    hearth(c, 160, Y + WH + 8, Y)
    weapon_rack_wall(c, 34, Y + 12, 70); tool_rack(c, 222, Y + 14); wall_window(c, 262, Y + 12, 18, 14)
    c.label('Forge hearth', 160, Y + 2)
    objs.append((Y + WH + 14, lambda: (c.r(186, Y + WH - 8, 22, 14, 'out'), c.r(187, Y + WH - 7, 20, 12, '#8a5a34'), c.r(188, Y + WH - 6, 18, 2, '#c0a080'), c.r(206, Y + WH - 2, 8, 2, 'w1'))))
    objs.append((150, lambda: anvil_big(c, 156, 150)))
    c.label('Anvil', 160, 104)
    objs.append((148, lambda: trough_q(c, 212, 148)))
    objs.append((122, lambda: grindstone(c, 270, 122)))
    objs.append((186, lambda: workbench(c, 248, 186)))
    objs.append((112, lambda: coal_pile(c, 108, 112)))
    for i, (cols) in enumerate([('st0', 'st2'), ('orange1', 'orange'), ('gold1', 'gold'), ('teal1', 'teal')]):
        objs.append((184, (lambda i=i, cols=cols: ore_bin(c, 36 + i * 22, 184, cols))))
    c.label('Ore bins', 70, 156)
    objs.append((130, lambda: barrel(c, 36, 130))); objs.append((140, lambda: barrel(c, 48, 140, False)))
    objs.append((96, lambda: lantern(c, 260, 82, 'orange', 22)))
    for x_ in (60, 280):
        objs.append((80, (lambda x_=x_: (c.r(x_, 60, 2, 10, 'st3'), c.r(x_ - 1, 56, 4, 4, 'orange'), c.p(x_, 54, 'yellow'), c.glow(x_, 58, 14, 'orange', 0.3)))))
    objs.sort(key=lambda o: o[0])
    run_objs(objs)
    return c

# ------------------------------------------------------------- alchemy

def alchemy_table(c, x, y):
    w = 84
    c.shadow_e(x + 5, y + 2, w // 2 + 4, 4)
    for lx in (x - w // 2 + 2, x + w // 2 - 4): c.r(lx, y - 8, 3, 9, '#3e2230')
    c.r(x - w // 2 - 1, y - 24, w + 2, 18, 'out'); c.r(x - w // 2, y - 23, w, 16, '#5e3a4e'); c.r(x - w // 2, y - 23, w, 2, '#8a5a74'); c.r(x - w // 2, y - 9, w, 2, '#3e2230')
    c.r(x - w // 2, y - 23, w, 1, 'gold1')
    # open book
    c.r(x - 36, y - 22, 18, 10, 'out'); c.r(x - 35, y - 21, 8, 8, 'cream'); c.r(x - 27, y - 21, 8, 8, 'white'); c.r(x - 27, y - 21, 1, 8, 'cream1')
    for k in range(3): c.r(x - 34, y - 19 + k * 2, 6, 1, 'cream1'); c.r(x - 25, y - 19 + k * 2, 5, 1, 'cream1')
    c.e(x - 23, y - 15, 1, 1, 'pu0')
    # burner + round flask + coil + receiver
    c.r(x - 12, y - 24, 8, 4, 'st3'); c.r(x - 10, y - 28, 4, 4, 'wa0'); c.p(x - 9, y - 29, 'wa2')
    c.e(x - 8, y - 36, 7, 7, 'out'); c.e(x - 8, y - 36, 6, 6, 'gr2'); c.e(x - 10, y - 38, 2, 2, 'leaf4'); c.r(x - 9, y - 48, 3, 7, 'out'); c.r(x - 8, y - 48, 1, 6, 'wa3')
    c.line([(x - 7, y - 48), (x + 4, y - 52), (x + 10, y - 44)], 'wa3')
    c.line([(x + 10, y - 44), (x + 10, y - 34)], 'st2')
    for k in range(4): c.e(x + 10, y - 41 + k * 3, 3, 1, 'st2')
    c.r(x + 7, y - 33, 7, 9, 'out'); c.r(x + 8, y - 32, 5, 7, 'pu2'); c.r(x + 8, y - 29, 5, 4, 'pu0')
    c.glow(x - 8, y - 36, 18, 'gr2', 0.35)
    # flasks, mortar, crystal, candles
    for i, cc in enumerate(['red0', 'teal', 'gold', 'blue']):
        fx = x + 20 + i * 5
        c.r(fx - 1, y - 30, 4, 7, 'out'); c.r(fx, y - 29, 2, 5, cc); c.r(fx, y - 33, 2, 3, 'out'); c.p(fx, y - 28, 'white')
    c.e(x + 36, y - 20, 4, 3, 'out'); c.e(x + 36, y - 20, 3, 2, 'st0'); c.line([(x + 37, y - 22), (x + 40, y - 27)], 'w2')
    c.poly([(x - 14, y - 12), (x - 17, y - 19), (x - 14, y - 24), (x - 11, y - 19)], 'teal', 'out'); c.glow(x - 14, y - 18, 10, 'teal', 0.3)
    for cx_ in (x - 40, x + 40):
        c.r(cx_, y - 30, 2, 7, 'cream'); c.p(cx_, y - 32, 'yellow'); c.p(cx_ + 1, y - 31, 'orange'); c.glow(cx_, y - 31, 10, 'glow', 0.3)
    for i in range(5): c.p(x + 2 + i * 3, y - 15 + (i % 2), ['leaf2', 'pu2', 'gr0', 'hay', 'red2'][i])


def potion_wall_shelf(c, x, y, w=60, rows=2, seed=1):
    rng = random.Random(seed)
    for r_ in range(rows):
        sy = y + r_ * 14
        c.r(x, sy + 10, w, 3, 'w1'); c.r(x, sy + 10, w, 1, 'w2')
        xx = x + 2
        while xx < x + w - 5:
            cc = rng.choice(['red0', 'teal', 'pu2', 'gr2', 'gold', 'wa0', 'pk0', 'orange'])
            kind = rng.random()
            if kind < 0.5:
                c.r(xx, sy + 4, 4, 6, 'out'); c.r(xx + 1, sy + 5, 2, 4, cc); c.r(xx + 1, sy + 2, 2, 2, 'cream'); xx += 6
            elif kind < 0.8:
                c.e(xx + 3, sy + 7, 3, 3, 'out'); c.e(xx + 3, sy + 7, 2, 2, cc); c.r(xx + 2, sy + 2, 2, 2, 'out'); xx += 8
            else:
                c.r(xx, sy + 3, 6, 7, 'out'); c.r(xx + 1, sy + 4, 4, 5, 'cream1'); c.p(xx + 2, sy + 6, 'pu0'); xx += 8


def magic_circle(c, x, y, rx=38, ry=16):
    c.e(x, y, rx, ry, '#4a2c62'); c.e(x, y, rx - 2, ry - 1, '#5e3a7a'); c.e(x, y, rx - 5, ry - 3, '#4a2c62'); c.e(x, y, rx - 6, ry - 4, '#5e3a7a')
    pts = [(x + math.cos(math.radians(-90 + i * 120)) * (rx - 8), y + math.sin(math.radians(-90 + i * 120)) * (ry - 5)) for i in range(4)]
    c.line(pts, 'pu2'); c.e(x, y + 1, 6, 3, 'pu2'); c.e(x, y + 1, 4, 2, '#5e3a7a')
    for i in range(8):
        a = math.radians(i * 45); c.r(x + math.cos(a) * (rx - 3), y + math.sin(a) * (ry - 2), 2, 1, 'teal')
    c.glow(x, y, rx, 'pu2', 0.18)


def crystal_ball(c, x, y):
    c.shadow_e(x + 2, y + 1, 6, 2)
    c.r(x - 2, y - 10, 4, 10, '#3e2230'); c.r(x - 5, y - 2, 10, 2, '#3e2230')
    c.r(x - 4, y - 13, 8, 3, 'gold1'); c.e(x, y - 19, 7, 7, 'out'); c.e(x, y - 19, 6, 6, 'pu2'); c.e(x - 1, y - 20, 3, 3, 'teal'); c.p(x - 3, y - 22, 'white')
    c.glow(x, y - 19, 18, 'teal', 0.35)


def tower_stair(c, x, top, bottom):
    # arched opening in the back wall with stone steps rising into it
    c.r(x - 2, top - 30, 30, 30, 'out'); c.e(x + 13, top - 30, 15, 8, 'out')
    c.r(x, top - 28, 26, 28, '#1a1020'); c.e(x + 13, top - 28, 13, 6, '#1a1020')
    n = (bottom - top) // 5
    for k in range(n + 6):
        yy = bottom - k * 5
        c.r(x, yy - 4, 26, 4, 'st2' if k % 2 else 'st0'); c.r(x, yy, 26, 1, 'st1')
        if yy < top - 26: break
    c.r(x - 3, top - 28, 3, bottom - top + 28, 'w3'); c.r(x + 26, top - 28, 3, bottom - top + 28, 'w3')
    for k in range(0, bottom - top + 24, 8): c.r(x - 3, top - 24 + k, 3, 1, 'w2'); c.r(x + 26, top - 24 + k, 3, 1, 'w2')


def alchemy_interior():
    c = Cv(320, 224, 303)
    X, Y, Wd, Hd, WH = 16, 14, 288, 196, 50
    room(c, X, Y, Wd, Hd, WH, wall_plaster, lambda c_, x, y, w, h: wood_floor(c_, x, y, w, h, '#6e4a3a', '#4a2c22', '#8a6450'), door_x=148, trim='#2a1830', trim2='#5e3a7a')
    potion_wall_shelf(c, 54, Y + 8, 40, 2, 3); potion_wall_shelf(c, 232, Y + 8, 64, 2, 7)
    wall_window(c, 150, Y + 10, 20, 16, night=True); c.glow(160, Y + 18, 18, 'teal', 0.2)
    hanging_herbs(c, 100, Y + 4, 6); hanging_herbs(c, 180, Y + 4, 5)
    magic_circle(c, 160, 168)
    objs = []
    objs.append((136, lambda: alchemy_table(c, 160, 136)))
    c.label('Alchemy table', 160, 74)
    objs.append((Y + WH + 6, lambda: bookshelf(c, 110, Y + WH + 6, 38)))
    objs.append((Y + WH + 6, lambda: bookshelf(c, 216, Y + WH + 6, 38)))
    objs.append((186, lambda: cauldron(c, 52, 186)))
    objs.append((116, lambda: crystal_ball(c, 268, 116)))
    objs.append((188, lambda: chest(c, 260, 188, 'teal', False)))
    for i, (px, py, cc) in enumerate([(232, 194, 'red0'), (238, 196, 'gr2'), (40, 150, 'pu2'), (46, 152, 'teal')]):
        objs.append((py, (lambda px=px, py=py, cc=cc: potion(c, px, py, cc))))
    objs.append((Y + WH + 40, lambda: tower_stair(c, 22, Y + WH + 2, Y + WH + 40)))
    c.label('Tower stairs', 36, Y + 4)
    objs.append((108, lambda: plant_pot(c, 290, 196)))
    for x_ in (32, 288):
        objs.append((70, (lambda x_=x_: lantern(c, x_, 50, 'teal', 22))))
    objs.sort(key=lambda o: o[0])
    run_objs(objs)
    return c

# ------------------------------------------------------------- barn

def stall(c, x, y, w, h):
    c.r(x, y, 3, h, 'out'); c.r(x + 1, y, 2, h, '#8a5a34')
    for yy in range(y + 4, y + h, 7): c.r(x - 1, yy, 5, 2, '#6e4322')
    c.r(x - 1, y - 2, 5, 3, '#b07a48')


def nest_boxes(c, x, y):
    c.r(x - 1, y - 1, 46, 22, 'out'); c.r(x, y, 44, 20, '#8a5a34')
    for i in range(3):
        bx = x + 2 + i * 14
        c.r(bx, y + 2, 12, 16, '#4e2e16'); c.r(bx + 1, y + 10, 10, 8, 'hay'); c.e(bx + 6, y + 10, 2, 2, 'white'); c.p(bx + 5, y + 9, 'cream')


def ladder(c, x, y, h):
    c.r(x, y, 2, h, '#8a5a34'); c.r(x + 10, y, 2, h, '#8a5a34')
    for yy in range(y + 3, y + h, 6): c.r(x, yy, 12, 2, '#b07a48')


def pail(c, x, y, milk=True):
    c.shadow_e(x + 2, y + 1, 5, 2)
    c.r(x - 4, y - 7, 8, 7, 'out'); c.r(x - 3, y - 6, 6, 6, 'st0'); c.r(x - 3, y - 6, 6, 1, 'white' if milk else 'st2'); c.line([(x - 4, y - 8), (x, y - 11), (x + 4, y - 8)], 'st3')


def sack(c, x, y):
    c.shadow_e(x + 2, y + 1, 6, 2)
    c.e(x, y - 6, 6, 6, 'out'); c.e(x, y - 6, 5, 5, '#c9a77a'); c.r(x - 2, y - 13, 4, 3, '#c9a77a'); c.r(x - 2, y - 11, 4, 1, 'w1'); c.e(x - 2, y - 7, 2, 2, '#dcc090')


def pitchfork(c, x, y):
    c.line([(x, y), (x + 8, y - 30)], 'w0')
    for d in (-2, 0, 2): c.line([(x + 8 + d, y - 30), (x + 9 + d, y - 36)], 'st2')
    c.r(x + 6, y - 31, 6, 1, 'st2')


def barn_interior():
    c = Cv(320, 224, 404)
    X, Y, Wd, Hd, WH = 16, 14, 288, 196, 44
    room(c, X, Y, Wd, Hd, WH, wall_planks_v, dirt_floor, door_x=136, door_w=48)
    for x_ in (70, 250): wall_window(c, x_, Y + 8, 18, 12)
    objs = []
    # stalls along the back
    for sx in (X + 4, 82, 148, 214):
        objs.append((Y + WH + 34, (lambda sx=sx: stall(c, sx + 60, Y + WH - 4, 60, 38))))
    c.r(X, Y + WH, 202, 38, '#c9a03c')
    for _ in range(140):
        px, py = X + c.rng.randrange(200), Y + WH + c.rng.randrange(36)
        c.line([(px, py), (px + c.rng.randint(2, 4), py + c.rng.randint(-1, 1))], c.rng.choice(['hay', '#f6dc86', 'hay1']))
    for i, (kind, ax) in enumerate([('cow', 46), ('cowb', 112), ('sheep', 176)]):
        objs.append((Y + WH + 30, (lambda kind=kind, ax=ax: animal(c, kind, ax, Y + WH + 30, False))))
    objs.append((Y + WH + 34, lambda: trough(c, 80, Y + WH + 40)))
    c.label('Stalls', 110, Y + 2)
    # chicken corner
    objs.append((Y + WH + 2, lambda: nest_boxes(c, 238, Y + WH - 18)))
    for ax, ay, k, fl in [(242, 104, 'chick', False), (264, 112, 'chickb', True), (286, 100, 'chick', True)]:
        objs.append((ay, (lambda ax=ax, ay=ay, k=k, fl=fl: animal(c, k, ax, ay, fl))))
    objs.append((Y + WH + 2, lambda: ladder(c, 222, Y + 2, WH)))
    # hay piles & props
    for hx_, hy_ in [(36, 186), (54, 192), (292, 184)]:
        objs.append((hy_, (lambda hx_=hx_, hy_=hy_: haybale(c, hx_, hy_))))
    objs.append((150, lambda: (c.shadow_e(48, 151, 18, 4), c.e(44, 140, 18, 12, 'hay1'), c.e(42, 138, 15, 9, 'hay'), c.e(38, 134, 6, 3, '#f6dc86'))))
    objs.append((182, lambda: trough(c, 250, 182)))
    for sx_ in (282, 292): objs.append((160, (lambda sx_=sx_: sack(c, sx_, 160))))
    objs.append((168, lambda: pail(c, 196, 168)))
    objs.append((172, lambda: pail(c, 120, 172, False)))
    objs.append((150, lambda: pitchfork(c, 98, 150)))
    objs.append((100, lambda: lantern(c, 160, 70, 'glow', 30)))
    # farmer NPC in the aisle
    objs.append((156, lambda: npc(c, FARMER, FARMER_PAL, 166, 156)))
    c.label('Farmer', 166, 118)
    objs.sort(key=lambda o: o[0])
    run_objs(objs)
    return c

# ------------------------------------------------------------- shrine (detailed exterior)

def big_shrine(c, cx, y):
    pw = 150
    # tiers
    tiers = [(150, 12, 'st1'), (126, 12, 'st0'), (104, 10, 'st2')]
    yy = y
    for w, h, cc in tiers:
        c.shadow_e(cx + 6, yy + 2, w // 2 + 6, 4)
        c.r(cx - w // 2 - 1, yy - h - 1, w + 2, h + 2, 'out')
        wall_stone(c, cx - w // 2, yy - h, w, h, cc, 'st3', 'st2')
        c.r(cx - w // 2, yy - h, w, 2, 'st2')
        yy -= h
    for k in range(9):
        c.r(cx - 16, y - 2 - k * 3 - 3, 32, 3, 'st2' if k % 2 else 'white1'); c.r(cx - 16, y - 2 - k * 3, 32, 1, 'st1')
    floor_y = yy
    c.r(cx - 50, floor_y - 34, 100, 34, '#2a2a3a')
    for k in range(5):
        c.r(cx - 48, floor_y - 34 + k * 7, 96, 1, '#3a3a50')
    # altar + orb
    c.r(cx - 12, floor_y - 14, 24, 14, 'out'); c.r(cx - 11, floor_y - 13, 22, 12, 'st2'); c.r(cx - 11, floor_y - 13, 22, 2, 'gold')
    c.e(cx, floor_y - 24, 9, 9, 'out'); c.e(cx, floor_y - 24, 8, 8, 'teal'); c.e(cx - 1, floor_y - 25, 5, 5, '#a8f4e4'); c.e(cx - 3, floor_y - 28, 2, 2, 'white')
    c.glow(cx, floor_y - 24, 54, 'teal', 0.55)
    # offerings
    for ox, cc in [(-8, 'red0'), (8, 'orange')]:
        c.e(cx + ox, floor_y - 15, 2, 2, cc)
    for cx_ in (cx - 30, cx - 22, cx + 22, cx + 30):
        c.r(cx_, floor_y - 7, 2, 7, 'cream'); c.p(cx_, floor_y - 9, 'yellow'); c.glow(cx_, floor_y - 8, 8, 'glow', 0.3)
    # pillars
    for px in (cx - 52, cx - 30, cx + 26, cx + 48):
        c.r(px - 1, floor_y - 54, 8, 55, 'out'); c.r(px, floor_y - 53, 6, 53, 'white'); c.r(px + 4, floor_y - 53, 2, 53, 'white1')
        c.r(px - 2, floor_y - 56, 10, 4, 'st2'); c.r(px - 2, floor_y - 3, 10, 3, 'st2')
    # banners
    for bx in (cx - 40, cx + 37):
        c.r(bx, floor_y - 50, 7, 26, 'teal1'); c.r(bx + 1, floor_y - 49, 5, 24, 'teal'); c.poly([(bx, floor_y - 24), (bx + 7, floor_y - 24), (bx + 3, floor_y - 19)], 'teal1'); c.e(bx + 3, floor_y - 40, 2, 2, 'gold')
    # roof (two tiers)
    roof_side(c, cx - 66, floor_y - 74, 132, 18, 'gr0', 'gr1', 'gr2')
    for ex in (cx - 70, cx + 64): c.r(ex, floor_y - 58, 6, 3, 'gr1'); c.r(ex + (0 if ex < cx else 4), floor_y - 61, 2, 3, 'gold')
    c.r(cx - 66, floor_y - 57, 132, 2, 'gold1')
    roof_side(c, cx - 42, floor_y - 92, 84, 16, 'gr0', 'gr1', 'gr2')
    c.r(cx - 42, floor_y - 77, 84, 2, 'gold1')
    c.r(cx - 1, floor_y - 100, 3, 8, 'gold1'); c.e(cx, floor_y - 104, 5, 5, 'out'); c.e(cx, floor_y - 104, 4, 4, 'teal'); c.p(cx - 2, floor_y - 106, 'white'); c.glow(cx, floor_y - 104, 12, 'teal', 0.4)
    return floor_y


def brazier_tall(c, x, y):
    c.shadow_e(x + 3, y + 1, 7, 2)
    c.r(x - 2, y - 18, 4, 18, 'st3'); c.r(x - 5, y - 2, 10, 2, 'st3')
    c.r(x - 6, y - 22, 12, 5, 'out'); c.r(x - 5, y - 21, 10, 3, 'st1')
    c.poly([(x - 5, y - 22), (x - 2, y - 32), (x + 1, y - 26), (x + 3, y - 34), (x + 5, y - 22)], 'orange'); c.poly([(x - 2, y - 22), (x, y - 29), (x + 3, y - 22)], 'yellow')
    c.glow(x, y - 26, 22, 'orange', 0.35)


def obelisk(c, x, y):
    c.shadow_e(x + 4, y + 1, 8, 3)
    c.r(x - 8, y - 6, 16, 6, 'st1'); c.r(x - 8, y - 6, 16, 1, 'st2')
    c.poly([(x - 5, y - 6), (x + 5, y - 6), (x + 3, y - 36), (x - 3, y - 36)], 'st0', 'out'); c.poly([(x - 3, y - 36), (x + 3, y - 36), (x, y - 42)], 'st2', 'out')
    c.line([(x - 4, y - 7), (x - 2, y - 35)], 'st2')
    for k in range(4): c.r(x - 1, y - 30 + k * 6, 2, 3, 'teal')
    c.glow(x, y - 22, 14, 'teal', 0.3)


def shrine_interior():
    c = Cv(400, 260, 505)
    grass(c, flowers=80)
    # courtyard
    m = c.mask(lambda d: d.rounded_rectangle([40, 110, 360, 250], radius=16, fill=255))
    stone_floor(c, 40, 110, 320, 150, 'st0', 'st1', 'st2', 14, 10)
    a = np.array(c.img); g = Cv(400, 260, 506); grass(g, 80); ga = np.array(g.img); a[~m] = ga[~m]; c._sync(a)
    c.tint(c.mask(lambda d: d.rounded_rectangle([40, 110, 360, 250], radius=16, outline=255, width=2)), (0.6, 0.6, 0.7))
    # path down
    for k in range(5): c.e(200 + (k % 2) * 6 - 3, 250 + k * 6, 9, 3, 'st2')
    # pools
    for px in (90, 310):
        wm = c.mask(lambda d, px=px: d.ellipse([px - 38, 168, px + 38, 206], fill=255))
        paint_water(c, wm)
        lily(c, px - 10, 186); lily(c, px + 14, 194); lily(c, px + 4, 178)
    objs = []
    objs.append((150, lambda: big_shrine(c, 200, 150)))
    c.label('Shrine', 200, 22)
    c.label('Glowing orb', 200, 66)
    for bx, by in [(150, 172), (250, 172), (150, 222), (250, 222)]:
        objs.append((by, (lambda bx=bx, by=by: brazier_tall(c, bx, by))))
    for ox, oy in [(56, 150), (344, 150)]:
        objs.append((oy, (lambda ox=ox, oy=oy: obelisk(c, ox, oy))))
    for tx, ty, k in [(24, 100, 'blossom'), (376, 100, 'blossom'), (20, 200, 'dark'), (380, 210, 'oak'), (70, 70, 'oak'), (330, 70, 'oak'), (24, 260, 'oak'), (376, 262, 'dark')]:
        objs.append((ty, (lambda tx=tx, ty=ty, k=k: tree(c, tx, ty, k))))
    for fx, fy in [(60, 236), (130, 240), (270, 240), (340, 236), (110, 122), (290, 122)]:
        objs.append((fy, (lambda fx=fx, fy=fy: flowerbed(c, fx, fy))))
    objs.append((242, lambda: bench(c, 96, 242))); objs.append((242, lambda: bench(c, 304, 242)))
    for px_ in (166, 234):
        objs.append((156, (lambda px_=px_: (c.r(px_ - 6, 150, 12, 6, 'out'), c.r(px_ - 5, 151, 10, 4, 'st2'), c.e(px_, 150, 5, 2, 'gold1'), c.e(px_ - 2, 149, 1, 1, 'red0'), c.e(px_ + 2, 149, 1, 1, 'orange')))))
    objs.sort(key=lambda o: o[0])
    run_objs(objs)
    return c

# ------------------------------------------------------------- training grounds (detailed)

def rope_ring(c, cx, cy, rx, ry):
    posts = [(cx + math.cos(math.radians(a)) * rx, cy + math.sin(math.radians(a)) * ry) for a in range(0, 360, 45)]
    back = [p for p in posts if p[1] <= cy]; front = [p for p in posts if p[1] > cy]
    return posts


def training_interior():
    c = Cv(400, 260, 606)
    grass(c, flowers=60)
    m = c.mask(lambda d: d.rounded_rectangle([24, 40, 376, 244], radius=14, fill=255))
    a = np.array(c.img).astype(np.float32); a[dilate(m) & ~m] = P['d3']; a[m] = P['sand']; a[m & ~erode(m, 2)] = P['sand1']; c._sync(a)
    for _ in range(500):
        px, py = c.rng.randint(28, 372), c.rng.randint(44, 240)
        c.p(px, py, c.rng.choice(['sand1', 'sand2']))
    # sparring ring
    c.e(200, 160, 50, 24, 'sand1'); c.e(200, 160, 47, 22, '#ecdcaa'); c.e(200, 160, 4, 2, 'red1')
    # archery lanes
    for k in range(3):
        c.line([(300 + k * 22, 60), (300 + k * 22, 200)], 'white1')
    objs = []
    # pavilion with racks (back-left)
    objs.append((96, lambda: side_building(c, 40, 96, 100, 26, 18, ('gr0', 'gr1', 'gr2'), lambda X, Y, W_, H_: (c.r(X, Y, W_, H_, '#3c3022'), weapon_rack_wall(c, X + 6, Y + 2, 56), c.r(X + 66, Y + 4, 28, 20, 'w3'), [c.r(X + 68 + i * 6, Y + 6, 3, 16, ['red0', 'blue', 'gold'][i % 3]) for i in range(4)]))))
    for ppx in (40, 136):
        objs.append((97, (lambda ppx=ppx: (c.r(ppx, 52, 4, 46, 'w3'), c.r(ppx + 1, 52, 2, 46, 'w0')))))
    c.label('Weapon pavilion', 90, 30)
    # dummies in rows
    for i, (dx, dy) in enumerate([(56, 140), (80, 140), (104, 140), (56, 176), (80, 176), (104, 176)]):
        objs.append((dy, (lambda dx=dx, dy=dy: dummy(c, dx, dy))))
    c.label('Dummies', 80, 104)
    # targets at top of lanes
    for k in range(3):
        objs.append((70, (lambda k=k: target(c, 300 + k * 22, 70))))
        objs.append((202, (lambda k=k: (c.r(294 + k * 22, 200, 12, 2, 'w1')))))
    c.label('Archery range', 322, 30)
    # sparring ring posts + ropes
    posts = rope_ring(c, 200, 160, 54, 28)
    def ring_back():
        bp = sorted([p for p in posts if p[1] <= 160], key=lambda p: p[0])
        for p, q in zip(bp, bp[1:]): c.line([(p[0], p[1] - 9), (q[0], q[1] - 9)], 'red0'); c.line([(p[0], p[1] - 5), (q[0], q[1] - 5)], 'red1')
        for p in bp: fence_post(c, p[0], p[1])
    def ring_front():
        fp = sorted([p for p in posts if p[1] > 160 or abs(p[1] - 160) < 1], key=lambda p: p[0])
        for p, q in zip(fp, fp[1:]): c.line([(p[0], p[1] - 9), (q[0], q[1] - 9)], 'red0'); c.line([(p[0], p[1] - 5), (q[0], q[1] - 5)], 'red1')
        for p in fp: fence_post(c, p[0], p[1])
    objs.append((150, ring_back)); objs.append((189, ring_front))
    c.label('Sparring ring', 200, 116)
    # obstacle course (bottom)
    for hx_ in (150, 176, 202, 228):
        objs.append((226, (lambda hx_=hx_: (c.r(hx_ - 8, 214, 2, 12, 'w3'), c.r(hx_ + 6, 214, 2, 12, 'w3'), c.r(hx_ - 9, 214, 18, 3, 'w0'), c.r(hx_ - 9, 214, 18, 1, 'w2')))))
    objs.append((236, lambda: log(c, 274, 236)))
    objs.append((236, lambda: (c.shadow_e(256, 237, 22, 3), c.r(236, 230, 40, 4, 'trunk'), c.r(236, 230, 40, 1, 'w2'), c.r(240, 234, 3, 4, 'w3'), c.r(270, 234, 3, 4, 'w3'))))
    c.label('Obstacle course', 212, 202)
    # weights & misc
    for wx, wy in [(150, 98), (170, 102)]:
        objs.append((wy, (lambda wx=wx, wy=wy: (c.shadow_e(wx + 2, wy + 1, 9, 2), c.r(wx - 7, wy - 4, 14, 2, 'w1'), c.e(wx - 8, wy - 4, 4, 4, 'st3'), c.e(wx + 8, wy - 4, 4, 4, 'st3'), c.e(wx - 9, wy - 5, 2, 2, 'st1')))))
    objs.append((100, lambda: barrel(c, 196, 100))); objs.append((100, lambda: crate(c, 212, 100)))
    objs.append((132, lambda: (c.shadow_e(262, 133, 12, 3), c.r(250, 108, 2, 25, 'w3'), c.r(272, 108, 2, 25, 'w3'), c.r(248, 104, 28, 18, 'out'), c.r(249, 105, 26, 16, '#2e3a2e'),
                              [c.r(252 + k * 3, 108, 1, 5, 'white') for k in range(4)], c.line([(251, 112), (264, 108)], 'white'), [c.r(252 + k * 3, 114, 1, 5, 'white') for k in range(3)])))
    objs.append((210, lambda: (c.shadow_e(146, 211, 8, 3), c.r(140, 196, 12, 14, 'out'), c.r(141, 197, 10, 12, 'w0'), c.r(141, 200, 10, 1, 'st3'), [c.r(142 + k * 3, 186, 1, 12, 'w2') for k in range(3)])))
    objs.append((216, lambda: bench(c, 50, 216))); objs.append((222, lambda: bench(c, 84, 222)))
    objs.append((206, lambda: haybale(c, 352, 228))); objs.append((230, lambda: haybale(c, 340, 236)))
    for bx in (30, 370):
        objs.append((60, (lambda bx=bx: (c.r(bx, 30, 2, 30, 'out'), c.r(bx + 2, 30, 10, 14, 'red0'), c.poly([(bx + 2, 44), (bx + 12, 44), (bx + 7, 40)], 'red1'), c.e(bx + 7, 36, 2, 2, 'gold')))))
    # fence around the yard, gate at the bottom
    objs.append((40, lambda: fence_h(c, 24, 376, 40)))
    objs.append((248, lambda: (fence_h(c, 24, 186, 248), fence_h(c, 214, 376, 248))))
    for yy in range(40, 248, 10):
        objs.append((yy + 6, (lambda yy=yy: (fence_v(c, 24, yy + 6, min(yy + 16, 248), 10), fence_v(c, 376, yy + 6, min(yy + 16, 248), 10)))))
    for tx, ty, k in [(10, 30, 'oak'), (390, 34, 'dark'), (8, 150, 'dark'), (392, 160, 'oak'), (10, 262, 'oak'), (392, 264, 'pine')]:
        objs.append((ty, (lambda tx=tx, ty=ty, k=k: pine(c, tx, ty) if k == 'pine' else tree(c, tx, ty, k))))
    objs.sort(key=lambda o: o[0])
    run_objs(objs)
    return c

# ------------------------------------------------------------- arena (detailed)

def crowd(c, x, y, w, rows=3, seed=1):
    rng = random.Random(seed)
    for r_ in range(rows):
        yy = y + r_ * 9
        c.r(x, yy + 6, w, 3, 'st1'); c.r(x, yy + 6, w, 1, 'st2')
        for xx in range(x + 2 + (r_ % 2) * 3, x + w - 4, 6):
            if rng.random() < 0.12: continue
            body = rng.choice(['red0', 'blue', 'gr0', 'gold1', 'pu0', 'orange1', 'teal1', 'cream1'])
            skin = rng.choice(['#f0c4a8', '#d4a07a', '#a8704a', '#7a4a30'])
            hair = rng.choice(['#2b1d14', '#6b4226', 'hay', '#8a3a22', 'white1'])
            c.r(xx, yy + 3, 4, 4, body); c.r(xx, yy, 4, 3, skin); c.r(xx, yy - 1, 4, 1, hair)
            if rng.random() < 0.2: c.r(xx + (4 if rng.random() < 0.5 else -1), yy - 2, 1, 4, skin)
            if rng.random() < 0.08: c.r(xx + 1, yy - 6, 1, 6, 'w1'); c.r(xx + 2, yy - 6, 4, 3, rng.choice(['red0', 'blue', 'gold']))


def portcullis(c, x, y, w=30, h=34):
    c.r(x - 4, y - h - 4, w + 8, h + 4, 'out'); wall_stone(c, x - 3, y - h - 3, w + 6, h + 3, 'st1', 'st3', 'st0')
    c.r(x, y - h + 4, w, h - 4, '#1a1418'); c.e(x + w / 2, y - h + 4, w / 2, 4, '#1a1418')
    for xx in range(x + 2, x + w, 5): c.r(xx, y - h + 2, 1, h - 2, 'st2')
    for yy in range(y - h + 8, y, 7): c.r(x, yy, w, 1, 'st2')


def arena_interior():
    c = Cv(400, 260, 707)
    c.r(0, 0, 400, 260, VOID)
    # stands
    for i in range(6):
        c.r(0, 6 + i * 9, 400, 9, 'st1' if i % 2 else 'st0')
    crowd(c, 8, 8, 150, 5, 3); crowd(c, 242, 8, 150, 5, 9)
    # royal box
    c.r(160, 0, 80, 54, 'out'); c.r(161, 0, 78, 53, '#5a2a3a')
    c.r(156, 0, 88, 12, 'red1'); [c.poly([(156 + k * 11, 12), (167 + k * 11, 12), (161 + k * 11, 18)], 'red0') for k in range(8)]
    c.r(156, 0, 88, 2, 'gold')
    for k, cc in enumerate(['gold', 'pu2', 'gold']):
        bx = 176 + k * 20
        c.r(bx, 26, 10, 14, '#8a2a3a'); c.r(bx + 1, 32, 8, 8, cc if k != 1 else 'pu0'); c.r(bx + 2, 24, 6, 6, '#f0c4a8'); c.r(bx + 1, 21, 8, 3, 'gold' if k == 1 else '#6b4226')
        if k == 1: c.p(bx + 2, 20, 'gold'); c.p(bx + 5, 20, 'gold'); c.p(bx + 8, 20, 'gold')
    c.r(160, 42, 80, 12, 'st3'); c.r(160, 42, 80, 2, 'gold1')
    c.label('Royal box', 200, 66)
    # arena wall
    c.r(0, 56, 400, 30, 'out'); wall_stone(c, 0, 57, 400, 28, 'st0', 'st1', 'st2'); c.r(0, 57, 400, 3, 'st2'); c.r(0, 84, 400, 2, 'st3')
    for bx, cc in [(40, 'red0'), (110, 'blue'), (290, 'blue'), (360, 'red0')]:
        c.r(bx, 60, 14, 26, cc); c.r(bx + 1, 60, 12, 2, 'gold'); c.poly([(bx, 86), (bx + 14, 86), (bx + 7, 92)], cc); c.e(bx + 7, 72, 3, 3, 'gold')
    # sand floor
    sand_floor(c, 0, 86, 400, 174)
    c.tint(c.mask(lambda d: d.rectangle([0, 86, 399, 92], fill=255)))
    c.e(200, 168, 64, 32, 'sand1'); c.e(200, 168, 61, 30, 'sand'); c.e(200, 168, 40, 20, 'sand1'); c.e(200, 168, 37, 18, 'sand')
    for a_ in range(0, 360, 30):
        t = math.radians(a_); c.r(200 + math.cos(t) * 50, 168 + math.sin(t) * 25, 2, 1, 'red1')
    c.e(200, 168, 6, 3, 'red1')
    for _ in range(14):
        px, py = c.rng.randint(30, 370), c.rng.randint(100, 250)
        c.line([(px, py), (px + c.rng.randint(3, 8), py + c.rng.randint(-2, 2))], 'sand1')
    objs = []
    # side gates
    objs.append((86, lambda: portcullis(c, 64, 86)))
    objs.append((86, lambda: portcullis(c, 306, 86)))
    for tx in (54, 100, 296, 342, 150, 250):
        objs.append((70, (lambda tx=tx: (c.r(tx, 64, 2, 8, 'st3'), c.r(tx - 1, 60, 4, 4, 'orange'), c.p(tx, 58, 'yellow'), c.glow(tx, 62, 16, 'orange', 0.35)))))
    # weapon rack and props
    for rx_ in (60, 300):
        objs.append((112, (lambda rx_=rx_: (c.shadow_e(rx_ + 16, 113, 16, 3), c.r(rx_, 104, 32, 2, 'w1'), c.r(rx_ + 2, 96, 2, 16, 'w3'), c.r(rx_ + 28, 96, 2, 16, 'w3'),
                              [c.r(rx_ + 5 + i * 5, 90, 1, 20, 'st2' if i % 2 else 'w0') for i in range(5)]))))
    for sx_, sy_ in [(130, 220), (270, 120)]:
        objs.append((sy_, (lambda sx_=sx_, sy_=sy_: (c.shadow_e(sx_ + 2, sy_ + 1, 7, 2), c.e(sx_, sy_ - 3, 7, 4, 'out'), c.e(sx_, sy_ - 3, 6, 3, 'red0'), c.e(sx_, sy_ - 3, 2, 1, 'gold')))))
    for k in range(6): c.r(160 + k * 7, 236 - k * 9, 2, 1, 'sand1'); c.r(163 + k * 7, 238 - k * 9, 2, 1, 'sand1')
    objs.append((200, lambda: (c.shadow_e(106, 201, 7, 2), c.e(104, 196, 7, 5, 'out'), c.e(104, 196, 6, 4, 'blue'), c.e(104, 196, 2, 1, 'gold'))))
    objs.append((232, lambda: (c.line([(290, 232), (318, 224)], 'w0'), c.line([(322, 222), (330, 219)], 'st2'))))
    objs.append((226, lambda: crate(c, 68, 226))); objs.append((230, lambda: barrel(c, 84, 232, False)))
    objs.append((228, lambda: haybale(c, 330, 230)))
    objs.append((130, lambda: (c.shadow_e(334, 131, 10, 3), c.r(326, 112, 2, 18, 'w1'), c.r(340, 112, 2, 18, 'w1'), c.r(324, 110, 20, 2, 'w0'), c.e(334, 118, 7, 7, 'out'), c.e(334, 118, 6, 6, 'gold1'), c.e(333, 117, 4, 4, 'gold'))))
    c.label('Gong', 334, 94)
    # warrior
    objs.append((188, lambda: npc(c, WARRIOR, WARRIOR_PAL, 200, 188, k=2)))
    c.label('Warrior', 200, 124)
    objs.sort(key=lambda o: o[0])
    run_objs(objs)
    return c


if __name__ == '__main__':
    meta = {}
    for name, fn in [('cabin', cabin_interior), ('forge', forge_interior), ('alchemy', alchemy_interior), ('barn', barn_interior),
                     ('shrine', shrine_interior), ('training', training_interior), ('arena', arena_interior)]:
        if len(sys.argv) > 1 and name not in sys.argv[1:]: continue
        c = fn()
        if name == 'arena':
            x0, y0, w0, h0 = 40, 0, 320, 236
            c.img = c.img.crop((x0, y0, x0 + w0, y0 + h0))
            c.labels = [{'name': l['name'], 'x': (l['x'] * c.W - x0) / w0, 'y': (l['y'] * c.H - y0) / h0} for l in c.labels]
            c.W, c.H = w0, h0
        c.img.resize((c.W * 3, c.H * 3), Image.NEAREST).save(f'in_{name}.png')
        meta[name] = {'labels': c.labels, 'w': c.W * 3, 'h': c.H * 3}
        print(name, 'ok')
    if len(sys.argv) == 1: json.dump(meta, open('meta_in.json', 'w'))
