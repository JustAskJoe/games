"""The town: a cobbled square with a fountain, the seed shop (left) and the general store (right),
two houses, a notice board, lamps and benches, and the road back to the farm.

Drawn with the farm hub helpers (farm.py) at the same sketch scale and palette as the farm maps,
so the two screens sit side by side. Signs carry icons, never words.
python3 town.py writes art/concepts/scenes/town.png (+ town.json with label positions).
"""
import os, sys, json, math
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from farm import *
from npcs import npc

W, H = 640, 420

# ---------------------------------------------------------------- ground

def cobbles(c, m):
    """Cobblestone fill: rows of rounded stones with dark joints and a light top edge."""
    rng = c.rng
    a = np.array(c.img).astype(np.float32)
    a[m] = P['st1']
    c._sync(a)
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    for row, y in enumerate(range(y0, y1, 5)):
        off = 3 if row % 2 else 0
        for x in range(x0 + off, x1, 7):
            if not m[min(y + 2, H - 1), min(x + 3, W - 1)]: continue
            cc = rng.choice(['st0', 'st0', 'st2', '#8a8a96', '#a6a2a0'])
            c.r(x, y, 6, 4, cc); c.r(x, y, 6, 1, 'st2' if cc != 'st2' else '#dcdce4'); c.r(x, y + 3, 6, 1, 'st1')
            c.p(x, y, 'st1'); c.p(x + 5, y, 'st1')
            if rng.random() < 0.06: c.p(x + 2, y + 2, 'g2')
    a = np.array(c.img).astype(np.float32)
    a[~m] = np.array(c.base)[~m]
    edge = dilate(m) & ~m
    a[edge] = P['st3']
    a[dilate(m, 2) & ~dilate(m)] = P['g2']
    c._sync(a)

def fountain(c, x, y):
    c.shadow_e(x + 4, y + 3, 40, 10)
    c.e(x, y, 38, 15, 'out'); c.e(x, y - 2, 37, 14, 'st2'); c.e(x, y, 36, 13, 'st0')
    c.e(x, y - 2, 31, 10, 'out'); c.e(x, y - 2, 30, 9, 'wa1'); c.e(x - 3, y - 4, 25, 6, 'wa0')
    for dx in (-18, 4, 16): c.line([(x + dx, y - 3), (x + dx + 6, y - 3)], 'wa2')
    c.r(x - 5, y - 26, 10, 22, 'out'); c.r(x - 4, y - 25, 8, 21, 'st0'); c.r(x - 4, y - 25, 2, 21, 'st2'); c.r(x + 2, y - 25, 2, 21, 'st1')
    c.e(x, y - 27, 11, 4, 'out'); c.e(x, y - 28, 10, 3, 'st2'); c.e(x, y - 27, 8, 2, 'wa0')
    for k, (dx, dy) in enumerate([(-9, -24), (-12, -19), (-14, -13), (9, -24), (12, -19), (14, -13)]):
        c.r(x + dx, y + dy, 2, 3, 'wa2'); c.p(x + dx, y + dy, 'wa3')
    c.r(x - 1, y - 36, 2, 8, 'wa2'); c.p(x, y - 37, 'wa3'); c.p(x - 2, y - 33, 'wa3'); c.p(x + 2, y - 31, 'wa3')
    for dx in (-30, -12, 12, 28): c.p(x + dx, y - 6, 'wa3')
    c.label('Fountain', x, y - 46)

def notice_board(c, x, y):
    c.shadow_e(x + 4, y + 1, 14, 3)
    c.r(x - 13, y - 22, 3, 22, 'w3'); c.r(x + 10, y - 22, 3, 22, 'w3')
    c.r(x - 15, y - 28, 30, 18, 'out'); c.r(x - 14, y - 27, 28, 16, 'w0'); c.r(x - 14, y - 27, 28, 2, 'w2')
    for px, py, cc in [(-11, -24, 'cream'), (-2, -23, 'white'), (6, -25, 'cream1')]:
        c.r(x + px, y + py, 7, 9, 'out'); c.r(x + px + 1, y + py + 1, 5, 7, cc); c.p(x + px + 3, y + py + 1, 'red0')
        c.r(x + px + 2, y + py + 4, 3, 1, 'w1'); c.r(x + px + 2, y + py + 6, 2, 1, 'w1')
    c.r(x - 16, y - 31, 32, 4, 'rf1'); c.r(x - 16, y - 31, 32, 1, 'rf2')

def hanging_sign(c, x, y, icon):
    """A wooden sign on an iron bracket with a painted icon (no words)."""
    c.r(x - 1, y - 2, 16, 2, 'out'); c.r(x + 2, y, 1, 3, 'out'); c.r(x + 11, y, 1, 3, 'out')
    c.r(x, y + 3, 14, 12, 'out'); c.r(x + 1, y + 4, 12, 10, 'w0'); c.r(x + 1, y + 4, 12, 1, 'w2')
    icon(c, x + 7, y + 9)

def ico_sprout(c, x, y):
    c.r(x - 3, y + 2, 7, 3, 's0'); c.r(x - 3, y + 2, 7, 1, 's2'); c.r(x, y - 2, 1, 4, 'leaf1')
    c.e(x - 2, y - 2, 2, 1, 'leaf2'); c.e(x + 2, y - 3, 2, 1, 'leaf3')

def ico_pouch(c, x, y):
    c.e(x, y + 1, 4, 3, 'out'); c.e(x, y + 1, 3, 2, 'gold1'); c.r(x - 1, y - 3, 3, 2, 'gold1'); c.r(x - 2, y - 2, 5, 1, 'out')
    c.p(x - 1, y, 'gold'); c.p(x + 1, y + 2, 'yellow')

def seed_sacks(c, x, y):
    for i, (dx, cc) in enumerate([(0, 'hay'), (12, 'cream1'), (6, 'hay1')]):
        yy = y - (5 if i == 2 else 0)
        c.shadow_e(x + dx + 3, yy + 1, 6, 2)
        c.e(x + dx, yy - 5, 6, 6, 'out'); c.e(x + dx, yy - 5, 5, 5, cc); c.r(x + dx - 3, yy - 11, 6, 2, 'out')
        c.e(x + dx, yy - 10, 4, 2, 'w2')
        seed = ['orange', 'leaf2', 'red2'][i]
        for k in range(4): c.p(x + dx - 2 + k, yy - 10 + (k % 2), seed)

def plant_pot(c, x, y, fl='pk0'):
    c.shadow_e(x + 2, y + 1, 4, 1)
    c.poly([(x - 4, y - 6), (x + 4, y - 6), (x + 3, y), (x - 3, y)], 'red1', 'out'); c.r(x - 4, y - 7, 9, 2, 'red2')
    c.e(x, y - 10, 4, 3, 'leaf1'); c.e(x - 1, y - 11, 2, 2, 'leaf2'); c.p(x + 1, y - 13, fl); c.p(x - 2, y - 12, fl)

def seedling_cart(c, x, y):
    c.shadow_e(x + 5, y + 2, 20, 4)
    c.r(x - 18, y - 14, 36, 10, 'out'); c.r(x - 17, y - 13, 34, 8, 'w0'); c.r(x - 17, y - 13, 34, 1, 'w2')
    for i in range(6):
        px = x - 14 + i * 6
        c.r(px - 2, y - 17, 5, 4, 's0'); c.p(px, y - 19, 'leaf2'); c.p(px - 1, y - 18, 'leaf3'); c.p(px + 1, y - 20, ['pk0', 'yellow', 'leaf4', 'red2', 'white', 'wa2'][i])
    c.e(x - 10, y - 2, 4, 4, 'out'); c.e(x - 10, y - 2, 3, 3, 'w1'); c.p(x - 10, y - 2, 'w2')
    c.e(x + 10, y - 2, 4, 4, 'out'); c.e(x + 10, y - 2, 3, 3, 'w1'); c.p(x + 10, y - 2, 'w2')
    c.line([(x + 18, y - 10), (x + 26, y - 6)], 'w3', 2)

def awning(c, x, y, w, a='red0', b='white'):
    for i in range(0, w, 6):
        cc = a if (i // 6) % 2 == 0 else b
        c.poly([(x + i, y), (x + i + 6, y), (x + i + 7, y + 8), (x + i - 1, y + 8)], cc)
    c.r(x - 1, y - 1, w + 2, 1, 'out')
    for i in range(0, w, 6): c.e(x + i + 3, y + 8, 3, 2, a if (i // 6) % 2 == 0 else b)
    c.tint(c.mask(lambda d: d.rectangle([x, y + 10, x + w - 1, y + 13], fill=255)))

def market_stall(c, x, y):
    c.shadow_e(x + 4, y + 2, 26, 5)
    c.r(x - 22, y - 30, 2, 30, 'w3'); c.r(x + 20, y - 30, 2, 30, 'w3')
    awning(c, x - 24, y - 36, 48, 'gr0', 'cream')
    c.r(x - 22, y - 12, 44, 12, 'out'); c.r(x - 21, y - 11, 42, 10, 'w0'); c.r(x - 21, y - 11, 42, 2, 'w2')
    for i, cc in enumerate(['red0', 'orange', 'hay', 'leaf2', 'pu0', 'red2']):
        px = x - 18 + i * 7; c.e(px, y - 13, 3, 2, 'out'); c.e(px, y - 13, 2, 1, cc); c.p(px - 1, y - 14, 'white')
    c.label('Market stall', x, y - 46)

# ---------------------------------------------------------------- buildings

def seed_shop(c, x, y):
    w, wh, rh = 92, 38, 28
    def wall(X, Y, W_, H_):
        c.r(X, Y, W_, H_, 'cream')
        for xx in (X, X + 30, X + 60, X + W_ - 3): c.r(xx, Y, 3, H_, 'w1')
        c.r(X, Y, W_, 2, 'w1'); c.r(X, Y + H_ - 3, W_, 3, 'st1')
    yw = side_building(c, x, y, w, wh, rh, ('gr0', 'gr1', 'gr2'), wall)
    # big shop window with plants inside
    c.r(x + 6, yw + 8, 22, 16, 'out'); c.r(x + 7, yw + 9, 20, 14, 'wa2'); c.r(x + 17, yw + 9, 1, 14, 'w1')
    for k, cc in enumerate(['pk0', 'yellow', 'red2', 'leaf4']): c.e(x + 10 + k * 5, yw + 19, 2, 2, 'leaf1'); c.p(x + 10 + k * 5, yw + 17, cc)
    c.p(x + 8, yw + 10, 'wa3'); c.r(x + 5, yw + 24, 24, 3, 'w2')
    for k in range(5): c.p(x + 7 + k * 5, yw + 23, ['pk0', 'yellow', 'white', 'red2', 'pk0'][k]); c.p(x + 8 + k * 5, yw + 23, 'leaf2')
    window(c, x + 68, yw + 9, 12, 11)
    c.r(x + 67, yw + 21, 14, 3, 'w3'); c.r(x + 68, yw + 21, 12, 2, 's0')
    for k in range(4): c.p(x + 69 + k * 3, yw + 20, ['yellow', 'pk0', 'white', 'pu2'][k])
    door(c, x + 40, y - 22, 13, 22, 'gr1', 'gr0')
    c.r(x + 38, y - 25, 17, 2, 'w2')
    hanging_sign(c, x + 56, yw - 2, ico_sprout)
    # roof ridge vines
    for k in range(0, w + 8, 9): c.p(x - 3 + k, yw - rh + 1, 'leaf3'); c.p(x - 2 + k, yw - rh + 2, 'leaf2')
    c.label('Seed shop', x + w / 2, yw - rh - 12)
    return x + 46, y

def general_store(c, x, y):
    w, wh, rh = 96, 40, 26
    def wall(X, Y, W_, H_):
        wall_planks(c, X, Y, W_, H_, 'w0', 'w1', 'w2'); c.r(X, Y + H_ - 4, W_, 4, 'st1')
    yw = side_building(c, x, y, w, wh, rh, ('rf0', 'rf1', 'rf2'), wall)
    awning(c, x + 2, yw + 6, w - 4)
    window(c, x + 8, yw + 18, 14, 10); window(c, x + 74, yw + 18, 14, 10)
    door(c, x + 42, y - 22, 13, 22, 'w1', 'w3')
    # counter shelf seen through the windows
    for k, cc in enumerate(['red0', 'gold', 'teal', 'pk0']): c.r(x + 10 + k * 3, yw + 22, 2, 3, cc)
    for k, cc in enumerate(['wa0', 'orange', 'pu2', 'gr2']): c.r(x + 76 + k * 3, yw + 22, 2, 3, cc)
    hanging_sign(c, x + 26, yw - 4, ico_pouch)
    # chimney
    c.r(x + w - 18, yw - rh - 8, 8, 12, 'out'); c.r(x + w - 17, yw - rh - 7, 6, 11, 'st0'); c.r(x + w - 17, yw - rh - 7, 6, 2, 'st2')
    for dx, dy, r in [(4, -14, 3), (7, -21, 4)]: c.e(x + w - 14 + dx - 4, yw - rh + dy - 4, r, r - 1, 'smoke')
    c.label('General store', x + w / 2, yw - rh - 14)
    return x + 48, y

def house(c, x, y, roof=('pu0', 'pu1', 'pu2'), w=58):
    def wall(X, Y, W_, H_):
        wall_stone(c, X, Y, W_, H_)
    yw = side_building(c, x, y, w, 30, 22, roof, wall)
    window(c, x + 8, yw + 9, 9, 9, lit='glow'); window(c, x + w - 17, yw + 9, 9, 9, lit='glow')
    door(c, x + w // 2 - 5, y - 16, 10, 16)
    flowerbed(c, x + 14, y + 8)
    return yw

# ---------------------------------------------------------------- scene

def scene_town(seed=12):
    c = Cv(W, H, seed)
    grass(c, flowers=70)
    c.base = c.img.copy()
    # roads: to the farm (bottom), to the battle road (top right), side lane (left)
    pm = c.mask(lambda d: (d.rectangle([300, 300, 340, H], fill=255), d.line([(430, 200), (470, 150), (560, 60), (W, 40)], fill=255, width=26)))
    paint_path(c, pm)
    c.base = c.img.copy()
    sq = c.mask(lambda d: (d.ellipse([110, 150, 530, 345], fill=255), d.rectangle([60, 210, 580, 260], fill=255)))
    cobbles(c, sq)
    # back row
    for x, y, k in [(30, 40, 'oak'), (78, 28, 'blossom'), (590, 120, 'oak'), (20, 330, 'oak'), (612, 330, 'dark'), (560, 380, 'blossom'), (70, 395, 'oak')]:
        tree(c, x, y + 30, k)
    market_stall(c, 140, 120)
    flowers_patch(c, 260, 40, 12); flowers_patch(c, 400, 60, 10)
    house(c, 210, 140, ('pu0', 'pu1', 'pu2'))
    house(c, 330, 140, ('blue', 'blue1', 'wa0'), w=62)
    c.label('Houses', 300, 70)
    seed_shop(c, 40, 230)
    general_store(c, 498, 230)
    notice_board(c, 430, 150)
    c.label('Notice board', 430, 110)
    fountain(c, 320, 262)
    # shop props
    seed_sacks(c, 18, 248); plant_pot(c, 150, 236, 'yellow'); plant_pot(c, 160, 240, 'pk0'); seedling_cart(c, 110, 278)
    barrel(c, 486, 246, water=False); crate(c, 604, 246); crate(c, 614, 252); barrel(c, 470, 254, water=False)
    # plaza furniture
    for lx, ly in [(190, 205), (450, 205), (200, 330), (440, 330)]: lamp(c, lx, ly)
    bench(c, 255, 320); bench(c, 385, 320)
    flowers_patch(c, 168, 330, 10); flowers_patch(c, 472, 330, 10)
    bush(c, 140, 170); bush(c, 500, 172, berries=True); bush(c, 270, 375); bush(c, 370, 378)
    # road sign back to the farm: arrow and a little wheat icon, no words
    sx, sy = 352, 392
    c.shadow_e(sx + 3, sy + 1, 6, 2); c.r(sx - 1, sy - 22, 3, 22, 'w3')
    c.poly([(sx - 10, sy - 24), (sx + 10, sy - 24), (sx + 15, sy - 19), (sx + 10, sy - 14), (sx - 10, sy - 14)], 'w0', 'out')
    c.r(sx - 7, sy - 20, 1, 3, 'hay'); c.r(sx - 5, sy - 21, 1, 4, 'hay'); c.r(sx - 3, sy - 20, 1, 3, 'hay'); c.line([(sx, sy - 19), (sx + 9, sy - 19)], 'w3')
    c.label('To the farm', 320, 400)
    c.label('To the battle road', 590, 30)
    # shopkeepers in front of their doors (sketch-scale sprites; hero-style versions are on the farm life page)
    npc(c, SEED_KEEPER, SEED_KEEPER_PAL, 86, 236)
    npc(c, STORE_KEEPER, STORE_KEEPER_PAL, 542, 238)
    # a couple of chickens wandering the square
    animal(c, 'chick', 230, 290); animal(c, 'chickb', 246, 300, flip=True)
    return c

SEED_KEEPER = [
    "....OOOOOO....",
    "...OGGGGGGO...",
    "..OGGgGGGGGO..",
    "..OGSSSSSSGO..",
    "..OGSeSSeSGO..",
    "..OGSSSSSSGO..",
    "...OSSssSSO...",
    "....OSSSSO....",
    "...OCCCCCCO...",
    "..OCAAAAAACO..",
    "..OCAyAAyACO..",
    "..OSAAAAAASO..",
    "..OSAAAAAASO..",
    "...OAAAAAAO...",
    "...OCCCCCCO...",
    "...OCCOCCCO...",
    "....OKO.OKO...",
    "....OOO.OOO...",
]
SEED_KEEPER_PAL = {'O': 'out', 'G': 'gr1', 'g': 'gr2', 'S': '#8e5a38', 's': '#6a3e26', 'e': 'out', 'C': 'cream', 'A': 'leaf0', 'y': 'hay', 'K': '#5a3418'}

STORE_KEEPER = [
    "....OOOOOO....",
    "...ORRRRRRO...",
    "..ORRRRRRRRO..",
    "..OOSSSSSSOO..",
    "..OSSeSSeSSO..",
    "..OSSSSSSSSO..",
    "..OSMMMMMMSO..",
    "...OSSSSSSO...",
    "..OBWBWBWBWO..",
    ".OBVWBWBWVBO..",
    ".OSVWBWBWVSO..",
    ".OSVCCCCCVSO..",
    "..OVCCCCCVO...",
    "...OCCCCCO....",
    "...ODDODDO....",
    "...ODDODDO....",
    "...OKKOKKO....",
    "...OOO.OOO....",
]
STORE_KEEPER_PAL = {'O': 'out', 'R': '#62401e', 'S': '#d09466', 'e': 'out', 'M': '#1e1c2a', 'B': 'blue', 'W': 'white', 'V': '#3e2414', 'C': 'cream', 'D': '#4a2818', 'K': '#2e1e22'}

if __name__ == '__main__':
    c = scene_town()
    ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
    out = os.path.join(ROOT, 'art', 'concepts', 'scenes'); os.makedirs(out, exist_ok=True)
    c.img.save(os.path.join(out, 'town.png'))
    json.dump({'w': W, 'h': H, 'labels': c.labels}, open(os.path.join(out, 'town.json'), 'w'), indent=1)
    print('town.png', c.img.size, len(c.labels), 'labels')
