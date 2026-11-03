"""Export the farm, town and building interiors for the game, as layers it can depth-sort and collide with.

The art scripts paint whole scenes. Here each scene is painted again piece by piece: a base (grass, paths,
water, cliffs, floors) plus one sprite per object (building, tree, fence run, prop), so the hero can walk
behind a building and in front of it. Every piece is painted twice, once on the real picture and once on a
high-contrast copy; pixels that come out the same are solid, pixels that differ were shaded (shadows,
glows) and become see-through overlay pixels. Composited in order, the pieces give back the art exactly.

Groups let the game swap states: 'static' is always drawn, 'lot:<building>' only before that building is
built, 'built:<building>' only after, 'cover:<plot>' while that crop plot is still covered.

Everything stays at the art's own (sketch) scale; the game draws it at 2 art pixels per sketch pixel.

Writes art/sprites/world/: world.json, <map>_base.png, <map>_solid.png (collision), atlas<n>.png.
Run from this folder:  python3 export_world.py

© 2026 justaskjoe. All rights reserved.
"""
import os, sys, json, math, random
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import farm as F
import farm_start as FS
import layout_b2 as LB
import interiors as IN
import town as TW
import npcs as NP

ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'art', 'sprites', 'world')

# ------------------------------------------------------------------ what each kind of piece blocks
# A number is how many rows at the bottom of the solid pixels block the hero; 'bld' blocks the lower half
# (the walls), 'full' the whole piece, 0 nothing (grass, flowers, rope, crops).
RULES = {
    'b_barn': 'bld', 'b_forge': 'bld', 'b_alchemy': 'bld', 'b_shrine': 'bld', 'b_cabin': 'bld', 'b_arena': 'arena',
    'side_building': 'bld', 'house': 'bld', 'seed_shop': 'bld', 'general_store': 'bld', 'market_stall': 5,
    'tree': 4, 'pine': 4, 'rock': 4, 'stump': 4, 'bush': 5, 'well': 7, 'barrel': 4, 'crate': 4, 'haybale': 4, 'trough': 4,
    'firewood': 4, 'anvil': 4, 'ore_pile': 3, 'cauldron': 5, 'potion_shelf': 4, 'dummy': 3, 'target': 3, 'scarecrow': 3,
    'lamp': 3, 'bench': 4, 'log': 4, 'fence_h': 3, 'picket_h': 3, 'fence_v': 'full', 'fence_post': 3, 'broken_wall': 4,
    'build_sign': 2, 'fountain': 'fountain', 'notice_board': 3, 'seed_sacks': 4, 'plant_pot': 3, 'seedling_cart': 5,
    'tallgrass': 0, 'flowers_patch': 0, 'weeds': 0, 'mushrooms': 0, 'rubble': 0, 'stake': 0, 'rope': 0, 'crop': 0,
    'animal': 0, 'lily': 0, 'flowerbed': 0, 'lantern': 0, 'potion': 0, 'hanging_herbs': 0,
    # interiors
    'bed': 'bld', 'table': 6, 'chair': 0, 'bookshelf': 5, 'counter': 7, 'chest': 5, 'big_chest': 6, 'crop_bin': 6, 'plant_pot_in': 3,
    'anvil_big': 7, 'trough_q': 5, 'grindstone': 5, 'workbench': 6, 'coal_pile': 4, 'ore_bin': 5, 'alchemy_table': 8,
    'crystal_ball': 5, 'tower_stair': 0, 'stall': 6, 'nest_boxes': 5, 'ladder': 0, 'sack': 4, 'pail': 3, 'pitchfork': 0,
    'big_shrine': 'bld', 'brazier_tall': 4, 'obelisk': 5, 'portcullis': 'full', 'fireplace': 0, 'hearth': 0,
}
KINDS = []

def wrap(mod, name):
    fn = getattr(mod, name, None)
    if fn is None or getattr(fn, '_wrapped', False): return
    def w(*a, **k):
        KINDS.append(name); return fn(*a, **k)
    w._wrapped = True
    setattr(mod, name, w)

for mod in (F, FS, LB, IN, TW):
    for name in list(RULES) + ['npc', 'covered_plot', 'plot_bed']:
        if hasattr(mod, name): wrap(mod, name)

def set_img(c, img):
    c.img = img; c.d = ImageDraw.Draw(c.img)

def contrast(a):
    return np.where(a > 127, 0, 255).astype(np.uint8)

# ------------------------------------------------------------------ capture

class Map:
    def __init__(self, name, c):
        self.name, self.c, self.sprites = name, c, []

    def capture(self, fn, group='static', y=None, flat=False, keep=True, tag=None):
        """Paint fn twice (real picture and contrast copy), turn the difference into one sprite."""
        c = self.c
        A0 = np.array(c.img)
        st = c.rng.getstate(); nl = len(c.labels); KINDS.clear()
        ret = fn()
        A1 = np.array(c.img); kinds = list(KINDS); st2 = c.rng.getstate(); nl2 = len(c.labels)
        B0 = contrast(A0)
        set_img(c, Image.fromarray(B0)); c.rng.setstate(st)
        fn()
        B1 = np.array(c.img)
        c.rng.setstate(st2); set_img(c, Image.fromarray(A1)); del c.labels[nl2:]
        if not keep: return ret
        spr = solve(A0, A1, B0, B1)
        if spr is None: return ret
        img, x0, y0 = spr
        kind = next((k for k in kinds if k in RULES and RULES[k] in ('bld', 'arena', 'fountain', 'full')), None) or next((k for k in kinds if k in RULES), None)
        self.sprites.append(dict(img=img, x=x0, y=y0, sy=(y if y is not None else y0 + img.height), flat=flat, group=group,
                                 kind=kind or 'misc', tag=tag, solid=None if flat else solid_rect(img, x0, y0, kind)))
        return ret

def solve(A0, A1, B0, B1):
    A0 = A0.astype(np.float32); A1 = A1.astype(np.float32); B0 = B0.astype(np.float32); B1 = B1.astype(np.float32)
    ch = np.any(A1 != A0, axis=2) | np.any(B1 != B0, axis=2)
    if not ch.any(): return None
    same = np.all(np.abs(A1 - B1) < 1, axis=2)
    H, W = ch.shape
    out = np.zeros((H, W, 4), np.float32)
    op = ch & same
    out[op, :3] = A1[op]; out[op, 3] = 255
    tr = ch & ~same
    if tr.any():
        k = np.clip(((B1 - A1) / (B0 - A0))[tr].mean(axis=1), 0, 1)
        f = 1 - k
        col = np.clip((A1[tr] - A0[tr] * k[:, None]) / np.maximum(f, 1e-3)[:, None], 0, 255)
        o = np.zeros((tr.sum(), 4), np.float32); o[:, :3] = col; o[:, 3] = np.round(f * 255)
        o[f < 0.03] = 0
        out[tr] = o
    a = out[..., 3] > 0
    if not a.any(): return None
    ys, xs = np.nonzero(a)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return Image.fromarray(np.round(out[y0:y1, x0:x1]).astype(np.uint8), 'RGBA'), int(x0), int(y0)

def solid_rect(img, x0, y0, kind):
    """Footprint that blocks the hero, from the solid pixels at the bottom of the piece."""
    rule = RULES.get(kind, 4) if kind else 4
    if rule == 0: return None
    a = np.array(img)[..., 3] == 255
    rows = np.nonzero(a.any(axis=1))[0]
    if not len(rows): return None
    bottom, top = rows.max(), rows.min()
    if rule == 'full': y_from = top
    elif rule == 'bld': y_from = bottom - int((bottom - top) * 0.5)
    elif rule == 'arena': y_from = bottom - int((bottom - top) * 0.62)
    elif rule == 'fountain': y_from = bottom - int((bottom - top) * 0.45)
    else: y_from = max(top, bottom - rule + 1)
    band = a[y_from:bottom + 1]
    cols = np.nonzero(band.any(axis=0))[0]
    if not len(cols): return None
    return [int(x0 + cols.min()), int(y0 + y_from), int(cols.max() - cols.min() + 1), int(bottom - y_from + 1)]

# ------------------------------------------------------------------ the Riverside farm

SITES = {   # build sign (where you press Enter on the lot) and the door once built, in sketch px
    'forge': {'sign': (303, 198), 'anchor': (284, 150)}, 'alchemy': {'sign': (471, 200), 'anchor': (460, 150)},
    'shrine': {'sign': (840, 192), 'anchor': (820, 150)}, 'barn': {'sign': (586, 416), 'anchor': (534, 380)},
    'training': {'sign': (154, 612), 'anchor': (83, 560)}, 'arena': {'sign': (123, 159), 'anchor': (125, 105)},
}

def nearest_site(x, y):
    pts = {k: v['anchor'] for k, v in SITES.items()}
    pts['barn2'] = (546, 493)
    k = min(pts, key=lambda s: math.hypot(pts[s][0] - x, pts[s][1] - y))
    return 'barn' if k == 'barn2' else k

def base_terrain(L, seed):
    c = F.Cv(L['W'], L['H'], seed)
    F.grass(c, flowers=L.get('flowers', 120))
    pm = c.mask(lambda d: [(d.line(seg['pts'], fill=255, width=seg.get('w', 22)),
                            [d.ellipse([px - seg.get('w', 22) / 2, py - seg.get('w', 22) / 2, px + seg.get('w', 22) / 2, py + seg.get('w', 22) / 2], fill=255) for px, py in seg['pts']])
                           for seg in L['paths']])
    F.paint_path(c, pm)
    def wdraw(d):
        for kind, *args in L['water']:
            if kind == 'ellipse':
                cx_, cy_, rx_, ry_ = args; d.ellipse([cx_ - rx_, cy_ - ry_, cx_ + rx_, cy_ + ry_], fill=255)
            if kind == 'line':
                pts, w_ = args; d.line(pts, fill=255, width=w_)
                for px, py in pts: d.ellipse([px - w_ / 2, py - w_ / 2, px + w_ / 2, py + w_ / 2], fill=255)
    wm = c.mask(wdraw); F.paint_water(c, wm)
    for lx, ly in L.get('lilies', []): F.lily(c, lx, ly)
    F.paint_cliffs(c, L['cliffs'], wm)
    for st in L.get('stairs', []): F.stairs(c, *st)
    return c, wm

def bridge_deck(c, L):
    bx0, by0, bw0, bh0 = L['bridge']
    c.shadow_e(bx0 + bw0 / 2 + 3, by0 + bh0 + 1, bw0 / 2 + 2, 3)
    c.r(bx0 - 1, by0 - 1, bw0 + 2, bh0 + 2, 'out'); c.r(bx0, by0, bw0, bh0, 'w0')
    for k in range(bx0 + 4, bx0 + bw0, 5): c.r(k, by0, 1, bh0, 'w1')
    c.r(bx0, by0, bw0, 2, 'w2'); c.r(bx0, by0 + bh0 - 2, bw0, 2, 'w3')

def cliff_faces(L, W, H):
    F_all = np.zeros((H, W), bool)
    for pts, h in L['cliffs']:
        img = Image.new('L', (W, H), 0); ImageDraw.Draw(img).polygon([(int(x), int(y)) for x, y in pts], fill=255)
        M = np.array(img) > 0; Fm = np.zeros_like(M)
        for k in range(1, h + 1): Fm |= F.shift(M, 0, k) & ~M
        F_all |= Fm
    return F_all

PROP_FN = lambda c: {
    'tree': lambda x, y: F.tree(c, x, y), 'blossom': lambda x, y: F.tree(c, x, y, 'blossom'), 'fruit': lambda x, y: F.tree(c, x, y, 'fruit'),
    'dark': lambda x, y: F.tree(c, x, y, 'dark'), 'pine': lambda x, y: F.pine(c, x, y), 'bush': lambda x, y: F.bush(c, x, y),
    'berrybush': lambda x, y: F.bush(c, x, y, True), 'rock': lambda x, y: F.rock(c, x, y), 'bigrock': lambda x, y: F.rock(c, x, y, True),
    'stump': lambda x, y: F.stump(c, x, y), 'lamp': lambda x, y: F.lamp(c, x, y), 'well': lambda x, y: F.well(c, x, y),
    'scarecrow': lambda x, y: F.scarecrow(c, x, y), 'flowers': lambda x, y: F.flowers_patch(c, x, y), 'barrel': lambda x, y: F.barrel(c, x, y),
    'crate': lambda x, y: F.crate(c, x, y), 'hay': lambda x, y: F.haybale(c, x, y), 'tallgrass': lambda x, y: F.tallgrass(c, x, y),
    'log': lambda x, y: F.log(c, x, y), 'shroom': lambda x, y: F.mushrooms(c, x, y), 'firewood': lambda x, y: F.firewood(c, x, y),
    'bench': lambda x, y: F.bench(c, x, y), 'flowerbed': lambda x, y: F.flowerbed(c, x, y), 'boulder': lambda x, y: F.rock(c, x, y, True),
    'sapling': lambda x, y: F.tree(c, x, y, 'oak', 0.7), 'pinesm': lambda x, y: F.pine(c, x, y, 0.75)}

def farm_day_one():
    """farm_start.scene_start, piece by piece. Static pieces, lots and plot covers."""
    L = LB.layout(random.Random(31))
    c, wm = base_terrain(L, 31)
    bridge_deck(c, L)
    base = c.img.copy()
    m = Map('farm', c)
    objs = []
    # crop field: the 4 open plots are drawn by the game; covers are kept per plot
    fx, fy = L['field']; sz, gap = 18, 6
    rng = random.Random(4); plots = []
    for row in range(5):
        for col in range(6):
            i = row * 6 + col; x, y = fx + col * (sz + gap), fy + row * (sz + gap)
            plots.append([x, y, sz, sz])
            if i in (0, 1, 6, 7): continue
            kind = FS.COVERS[(i * 5 + rng.randint(0, 3)) % len(FS.COVERS)]
            ob = m.capture(lambda x=x, y=y, kind=kind: FS.covered_plot(c, x, y, sz, kind), group='cover:%d' % (i + 1), flat=True)
            objs.append((y + sz - 3, ob, 'cover:%d' % (i + 1)))
    x0, y0 = fx, fy
    objs.append((y0 + 40, lambda: (c.line([(x0 - 9, y0 + 40), (x0 - 2, y0 + 20)], 'out', 3), c.line([(x0 - 9, y0 + 40), (x0 - 2, y0 + 20)], 'trunk', 1),
                                   c.r(x0 - 4, y0 + 18, 5, 3, 'out'), c.r(x0 - 3, y0 + 19, 3, 1, 'st0')), 'static'))
    objs.append((y0 + 52, lambda: (c.shadow_e(x0 + 54, y0 + 53, 6, 2), c.r(x0 + 48, y0 + 45, 10, 8, 'out'), c.r(x0 + 49, y0 + 46, 8, 6, 'blue'), c.r(x0 + 49, y0 + 46, 8, 1, 'wa2'),
                                   c.line([(x0 + 57, y0 + 48), (x0 + 61, y0 + 44)], 'blue1', 2)), 'static'))
    # lots (their ground is a flat sprite; their pieces sort with the hero)
    for site, call in [('training', lambda: FS.lot_training(c, *L['training'])),
                       ('barn', lambda: FS.empty_pen(c, *L['pen'][:4], L['pen'][4], 20, L['pen'][5])),
                       ('barn', lambda: FS.lot_barn(c, *L['barn'])), ('forge', lambda: FS.lot_forge(c, *L['forge'])),
                       ('alchemy', lambda: FS.lot_alchemy(c, *L['alchemy'])), ('shrine', lambda: FS.lot_shrine(c, *L['shrine'])),
                       ('arena', lambda: FS.lot_arena(c, *L['arena']))]:
        res = m.capture(call, group='lot:' + site, flat=True)
        objs += [(y, f, 'lot:' + site) for y, f in res]
    cx_, cy_ = L['cabin']; objs.append((cy_, lambda: F.b_cabin(c, cx_, cy_), 'static:cabin'))
    for seg in L.get('pickets', []): objs.append((seg[2], (lambda seg=seg: F.picket_h(c, *seg)), 'static'))
    FN = PROP_FN(c)
    for kind, x, y in L['props']:
        if kind in FS.GONE: continue
        objs.append((y, (lambda kind=kind, x=x, y=y: FN[kind](x, y)), 'static'))
    for kind, x, y in [('tallgrass', 303, 186), ('tallgrass', 471, 184), ('tallgrass', 300, 196), ('tallgrass', 130, 186), ('tallgrass', 820, 240),
                       ('tallgrass', 826, 262), ('tallgrass', 534, 428), ('tallgrass', 528, 420), ('tallgrass', 90, 560), ('tallgrass', 210, 566),
                       ('rock', 248, 470), ('stump', 600, 420), ('tallgrass', 640, 430), ('rock', 430, 200), ('tallgrass', 200, 198), ('bush', 650, 440)]:
        objs.append((y, (lambda kind=kind, x=x, y=y: FN[kind](x, y)), 'lot:' + nearest_site(x, y)))
    for seg in L.get('fences', []):
        kind, *args = seg
        if kind == 'h': objs.append((args[2], (lambda args=args: F.fence_h(c, *args)), 'static'))
        else:
            x, y0_, y1_ = args
            for yy in range(int(y0_), int(y1_), 10):
                objs.append((yy + 6, (lambda yy=yy, x=x, y1_=y1_: F.fence_v(c, x, yy + 6, min(yy + 16, y1_), 10)), 'static'))
    bx0, by0, bw0, bh0 = L['bridge']
    objs.append((by0 + 1, lambda: F.fence_h(c, bx0, bx0 + bw0, by0 + 1, 8), 'static'))
    objs.append((by0 + bh0 + 2, lambda: F.fence_h(c, bx0, bx0 + bw0, by0 + bh0 + 2, 8), 'static'))
    objs.sort(key=lambda o: o[0])
    for y, fn, g in objs:
        tag = 'cabin' if g == 'static:cabin' else None
        m.capture(fn, group=g.split(':')[0] if g.startswith('static') else g, y=y, tag=tag)
    return m, base, wm, L, plots

def farm_built(L, base_ref):
    """farm.scene: only the pieces that appear once a building is built are kept."""
    c, wm = base_terrain(L, 31)
    bridge_deck(c, L)
    assert np.array_equal(np.array(c.img), np.array(base_ref)), 'built and day-one bases differ'
    m = Map('farm', c)
    rng = c.rng
    plots = []
    fo, _ = F.field(c, *L['field'], rng, plots)                         # beds and crops: the game draws its own
    objs = [(y, f, None) for y, f in fo]
    tx, ty = L['training']; w, h = 118, 74; yt = ty - h
    def yard():
        mm = c.mask(lambda d: d.rounded_rectangle([tx, yt, tx + w, ty], radius=10, fill=255))
        a = np.array(c.img).astype(np.float32)
        a[F.dilate(mm) & ~mm] = F.P['d3']; a[mm] = F.P['sand']; a[mm & ~F.erode(mm, 2)] = F.P['sand1']
        c._sync(a)
        for _ in range(60):
            px, py = tx + c.rng.randint(6, w - 6), yt + c.rng.randint(6, h - 6)
            c.p(px, py, c.rng.choice(['sand1', 'sand2']))
    m.capture(yard, group='built:training', flat=True)
    def pavilion():
        px0, pw = tx + 8, 46
        F.side_building(c, px0, yt + 34, pw, 18, 14, ('gr0', 'gr1', 'gr2'), lambda X, Y, W_, H_: (c.r(X, Y, W_, H_, '#3c3022'), c.r(X, Y + H_ - 4, W_, 4, 'w1')))
        for ppx in (px0, px0 + pw - 4):
            c.r(ppx, yt + 16, 4, 18, 'w3'); c.r(ppx + 1, yt + 16, 2, 18, 'w0')
        rx = px0 + 10
        c.r(rx, yt + 22, 26, 2, 'w2'); c.r(rx, yt + 30, 26, 2, 'w0')
        for k in range(5):
            xx = rx + 2 + k * 5
            c.r(xx, yt + 18, 1, 14, 'st2'); c.r(xx - 1, yt + 27, 3, 1, 'gold1')
        c.p(rx + 2, yt + 17, 'st2'); c.p(rx + 12, yt + 16, 'st2'); c.r(rx + 21, yt + 16, 3, 2, 'st0')
    m.capture(pavilion, group='built:training', y=yt + 34)
    for dx, dy in [(70, -44), (88, -38), (104, -44)]:
        objs.append((ty + dy, (lambda dx=dx, dy=dy: F.dummy(c, tx + dx, ty + dy)), 'built:training'))
    objs.append((ty - 12, lambda: F.target(c, tx + 92, ty - 12), 'built:training'))
    objs.append((ty - 10, lambda: F.haybale(c, tx + 26, ty - 10), 'built:training'))
    objs.append((ty - 12, lambda: F.crate(c, tx + 44, ty - 12), 'built:training'))
    px_, py_, pw_, ph_, gx_, tg_ = L['pen']
    # pen: its ground patches are painted right away, the fences sort
    pen_objs = m.capture(lambda: F.pen(c, px_, py_, pw_, ph_, gx_, 20, tg_), group='built:barn', flat=True)
    objs += [(y, f, 'built:barn') for y, f in pen_objs]
    for kind, ax, ay, fl in L['animals']:
        objs.append((ay, (lambda kind=kind, ax=ax, ay=ay, fl=fl: F.animal(c, kind, ax, ay, fl)), None))
    objs.append((py_ + 22, lambda: F.trough(c, px_ + 18, py_ + 22), 'built:barn'))
    objs.append((py_ + ph_ - 8, lambda: F.haybale(c, px_ + pw_ - 16, py_ + ph_ - 8), 'built:barn'))
    bx, by = L['barn']; objs.append((by, lambda: F.b_barn(c, bx, by), 'built:barn'))
    fx2, fy2 = L['forge']; objs.append((fy2, lambda: F.b_forge(c, fx2, fy2), 'built:forge'))
    objs.append((fy2 + 14, lambda: F.anvil(c, fx2 + 92, fy2 + 14), 'built:forge'))
    objs.append((fy2 + 6, lambda: F.barrel(c, fx2 + 84, fy2 + 6), 'built:forge'))
    objs.append((fy2 + 16, lambda: F.ore_pile(c, fx2 - 8, fy2 + 16), 'built:forge'))
    ax2, ay2 = L['alchemy']; objs.append((ay2, lambda: F.b_alchemy(c, ax2, ay2), 'built:alchemy'))
    objs.append((ay2 + 12, lambda: F.cauldron(c, ax2 + 76, ay2 + 12), 'built:alchemy'))
    objs.append((ay2 + 2, lambda: F.potion_shelf(c, ax2 + 92, ay2 + 2), 'built:alchemy'))
    sx2, sy2 = L['shrine']; objs.append((sy2, lambda: F.b_shrine(c, sx2, sy2), 'built:shrine'))
    ar = L['arena']; objs.append((ar[1] + 40, lambda: F.b_arena(c, *ar), 'built:arena'))
    cx_, cy_ = L['cabin']; objs.append((cy_, lambda: F.b_cabin(c, cx_, cy_), None))
    for seg in L.get('pickets', []): objs.append((seg[2], (lambda seg=seg: F.picket_h(c, *seg)), None))
    FN = PROP_FN(c)
    gone_group = {'scarecrow': 'scarecrow', 'hay': 'built:barn', 'crate': 'built:barn', 'barrel': 'built:barn'}
    for kind, x, y in L['props']:
        objs.append((y, (lambda kind=kind, x=x, y=y: FN[kind](x, y)), gone_group.get(kind)))
    for seg in L.get('fences', []):
        kind, *args = seg
        if kind == 'h': objs.append((args[2], (lambda args=args: F.fence_h(c, *args)), None))
        else:
            x, y0_, y1_ = args
            for yy in range(int(y0_), int(y1_), 10):
                objs.append((yy + 6, (lambda yy=yy, x=x, y1_=y1_: F.fence_v(c, x, yy + 6, min(yy + 16, y1_), 10)), None))
    bx0, by0, bw0, bh0 = L['bridge']
    objs.append((by0 + 1, lambda: F.fence_h(c, bx0, bx0 + bw0, by0 + 1, 8), None))
    objs.append((by0 + bh0 + 2, lambda: F.fence_h(c, bx0, bx0 + bw0, by0 + bh0 + 2, 8), None))
    objs.sort(key=lambda o: o[0])
    doors = {}
    for y, fn, g in objs:
        r = m.capture(fn, group=g or 'x', y=y, keep=g is not None)
        if g and g.startswith('built:') and isinstance(r, tuple) and len(r) == 2 and isinstance(r[0], (int, float)):
            kinds = m.sprites[-1]['kind'] if m.sprites else ''
            if kinds and kinds.startswith('b_'): doors[g.split(':')[1]] = [float(r[0]), float(r[1])]
    doors['training'] = [tx + w / 2, ty]
    return m, doors

def plot_beds(plots):
    """One open bed per plot, painted on a blank copy (plot_bed uses no randomness)."""
    out = []
    for i, (x, y, sz, _) in enumerate(plots):
        c = F.Cv(sz + 4, sz + 4, 1); c.img = Image.new('RGB', (sz + 4, sz + 4), (255, 0, 255)); c.d = ImageDraw.Draw(c.img)
        F.plot_bed(c, 2, 2, sz)
        a = np.array(c.img); keep = ~np.all(a == (255, 0, 255), axis=2)
        rgba = np.zeros((sz + 4, sz + 4, 4), np.uint8); rgba[keep, :3] = a[keep]; rgba[keep, 3] = 255
        out.append(dict(img=Image.fromarray(rgba, 'RGBA'), x=x - 2, y=y - 2, sy=y + sz, flat=True, group='bed:%d' % (i + 1), kind='bed', tag=None, solid=None))
    return out

# ------------------------------------------------------------------ the town

def town_map():
    c = F.Cv(TW.W, TW.H, 12)
    F.grass(c, flowers=70)
    c.base = c.img.copy()
    pm = c.mask(lambda d: (d.rectangle([300, 300, 340, TW.H], fill=255), d.line([(430, 200), (470, 150), (560, 60), (TW.W, 40)], fill=255, width=26)))
    F.paint_path(c, pm)
    c.base = c.img.copy()
    sq = c.mask(lambda d: (d.ellipse([110, 150, 530, 345], fill=255), d.rectangle([60, 210, 580, 260], fill=255)))
    TW.cobbles(c, sq)
    m = Map('town', c); m.base = c.img.copy()
    seq = []
    for x, y, k in [(30, 40, 'oak'), (78, 28, 'blossom'), (590, 120, 'oak'), (20, 330, 'oak'), (612, 330, 'dark'), (560, 380, 'blossom'), (70, 395, 'oak')]:
        seq.append((y + 30, (lambda x=x, y=y, k=k: F.tree(c, x, y + 30, k))))
    seq.append((120, lambda: TW.market_stall(c, 140, 120)))
    seq.append((40, lambda: F.flowers_patch(c, 260, 40, 12))); seq.append((60, lambda: F.flowers_patch(c, 400, 60, 10)))
    seq.append((140, lambda: TW.house(c, 210, 140, ('pu0', 'pu1', 'pu2'))))
    seq.append((140, lambda: TW.house(c, 330, 140, ('blue', 'blue1', 'wa0'), w=62)))
    seq.append((230, lambda: TW.seed_shop(c, 40, 230)))
    seq.append((230, lambda: TW.general_store(c, 498, 230)))
    seq.append((150, lambda: TW.notice_board(c, 430, 150)))
    seq.append((262, lambda: TW.fountain(c, 320, 262)))
    seq.append((248, lambda: TW.seed_sacks(c, 18, 248))); seq.append((236, lambda: TW.plant_pot(c, 150, 236, 'yellow'))); seq.append((240, lambda: TW.plant_pot(c, 160, 240, 'pk0')))
    seq.append((278, lambda: TW.seedling_cart(c, 110, 278)))
    seq.append((246, lambda: F.barrel(c, 486, 246, water=False))); seq.append((246, lambda: F.crate(c, 604, 246))); seq.append((252, lambda: F.crate(c, 614, 252))); seq.append((254, lambda: F.barrel(c, 470, 254, water=False)))
    for lx, ly in [(190, 205), (450, 205), (200, 330), (440, 330)]: seq.append((ly, (lambda lx=lx, ly=ly: F.lamp(c, lx, ly))))
    seq.append((320, lambda: F.bench(c, 255, 320))); seq.append((320, lambda: F.bench(c, 385, 320)))
    seq.append((330, lambda: F.flowers_patch(c, 168, 330, 10))); seq.append((330, lambda: F.flowers_patch(c, 472, 330, 10)))
    seq.append((170, lambda: F.bush(c, 140, 170))); seq.append((172, lambda: F.bush(c, 500, 172, berries=True))); seq.append((375, lambda: F.bush(c, 270, 375))); seq.append((378, lambda: F.bush(c, 370, 378)))
    def sign():
        sx, sy = 352, 392
        c.shadow_e(sx + 3, sy + 1, 6, 2); c.r(sx - 1, sy - 22, 3, 22, 'w3')
        c.poly([(sx - 10, sy - 24), (sx + 10, sy - 24), (sx + 15, sy - 19), (sx + 10, sy - 14), (sx - 10, sy - 14)], 'w0', 'out')
        c.r(sx - 7, sy - 20, 1, 3, 'hay'); c.r(sx - 5, sy - 21, 1, 4, 'hay'); c.r(sx - 3, sy - 20, 1, 3, 'hay'); c.line([(sx, sy - 19), (sx + 9, sy - 19)], 'w3')
    seq.append((392, sign))
    seq.append((290, lambda: F.animal(c, 'chick', 230, 290))); seq.append((300, lambda: F.animal(c, 'chickb', 246, 300, flip=True)))
    # town.scene_town paints in its own order (no sorting); keep that order, sort only the drawing of sprites in game
    for y, fn in seq: m.capture(fn, y=y)
    return m

# ------------------------------------------------------------------ interiors

INTERIORS = {
    # name: (builder, crop box or None, kind, exit box (sketch px), stations [(id, x, y, r)])
    'cabin': (IN.cabin_interior, None, 'room', (148, 206, 24, 18), [('storage', 64, 196, 22), ('storage', 262, 198, 22)]),
    'forge': (IN.forge_interior, None, 'room', (148, 206, 24, 18), [('forge', 156, 158, 26)]),
    'alchemy': (IN.alchemy_interior, None, 'room', (148, 206, 24, 18), [('alchemy', 160, 146, 30)]),
    'barn': (IN.barn_interior, None, 'room', (136, 206, 48, 18), [('barn', 166, 160, 20)]),
    'shrine': (IN.shrine_interior, None, 'yard', (182, 246, 36, 14), [('shrine', 200, 158, 34)]),
    'training': (IN.training_interior, None, 'yard', (186, 244, 28, 16), [('training', 90, 104, 34)]),
    'arena': (IN.arena_interior, (40, 0, 320, 236), 'yard', (130, 224, 60, 12), [('arena', 160, 188, 20)]),
}
ROOM = (16, 14, 288, 196)

def interior(name):
    builder, crop, kind, exitbox, stations = INTERIORS[name]
    npcs_seen = []
    real_npc = IN.npc
    def npc_spy(c, grid, pal, x, y, flip=False, k=1):
        npcs_seen.append((x, y))
    # paint the shell first: run the builder with objects deferred, then capture them one by one
    pending = []
    IN.run_objs = lambda objs: pending.extend(objs)
    IN.npc = npc_spy
    c = builder()
    IN.npc = real_npc
    base = c.img.copy()
    m = Map(name, c)
    IN.npc = npc_spy                      # the people are drawn by the game in the hero style
    for y, f in pending: m.capture(f, y=y)
    IN.npc = real_npc
    W, H = c.W, c.H
    if crop:
        x0, y0, w0, h0 = crop
        base = base.crop((x0, y0, x0 + w0, y0 + h0))
        for s in m.sprites:
            s['x'] -= x0; s['y'] -= y0; s['sy'] -= y0
            if s['solid']: s['solid'][0] -= x0; s['solid'][1] -= y0
        npcs_seen[:] = [(x - x0, y - y0) for x, y in npcs_seen]
        W, H = w0, h0
    # walls and edges
    solid = np.ones((H, W), bool)
    if kind == 'room':
        X, Y, Wd, Hd = ROOM
        wh = {'cabin': 46, 'forge': 52, 'alchemy': 50, 'barn': 44}[name]
        solid[Y + wh + 4:Y + Hd, X + 2:X + Wd - 2] = False
        ex, ey, ew, eh = exitbox; solid[ey - 8:H, ex:ex + ew] = False
    else:
        solid[4:H - 2, 4:W - 4] = False
        ex, ey, ew, eh = exitbox; solid[ey:H, ex:ex + ew] = False
        if name == 'shrine':
            for px in (90, 310):
                img = Image.new('L', (W, H), 0); ImageDraw.Draw(img).ellipse([px - 38, 168, px + 38, 206], fill=255); solid |= np.array(img) > 0
        if name == 'arena': solid[:92, :] = True
        if name == 'training': solid[:46, :] = True; solid[248:, :] = True; solid[248:, 186:214] = False
    return m, base, solid, dict(exit=list(exitbox), stations=[list(s) for s in stations], people=[list(p) for p in npcs_seen], w=W, h=H)

# ------------------------------------------------------------------ atlas and output

def pack(sprites, page=1024):
    """Shelf-pack every sprite into atlas pages."""
    order = sorted(range(len(sprites)), key=lambda i: -sprites[i]['img'].height)
    pages = []; cur = None; x = y = shelf = 0
    for i in order:
        im = sprites[i]['img']; w, h = im.width + 1, im.height + 1
        if cur is None or x + w > page:
            x = 0; y += shelf; shelf = 0
        if cur is None or y + h > page:
            cur = Image.new('RGBA', (page, page), (0, 0, 0, 0)); pages.append(cur); x = y = shelf = 0
        cur.alpha_composite(im, (x, y))
        sprites[i]['at'] = [len(pages) - 1, x, y]
        x += w; shelf = max(shelf, h)
    # trim the last page
    last = pages[-1]; bb = last.getbbox()
    if bb: pages[-1] = last.crop((0, 0, page, bb[3] + 1))
    return pages

def main():
    os.makedirs(OUT, exist_ok=True)
    maps = {}
    sprites = []
    def add(mapname, spr_list):
        for s in spr_list:
            s['map'] = mapname; sprites.append(s)
    # farm
    day, base, wm, L, plots = farm_day_one()
    built, doors = farm_built(L, base)
    beds = plot_beds(plots)
    add('farm', day.sprites); add('farm', built.sprites); add('farm', beds)
    W, H = L['W'], L['H']
    solid = np.zeros((H, W), bool)
    bx0, by0, bw0, bh0 = L['bridge']
    water = wm.copy(); water[by0:by0 + bh0, bx0 - 2:bx0 + bw0 + 2] = False
    solid |= water
    faces = cliff_faces(L, W, H)
    for sx, sy, sw, sh in L['stairs']: faces[sy - 4:sy + sh + 2, sx:sx + sw] = False
    solid |= faces
    solid[:4, :] = True; solid[H - 3:, :] = True; solid[:, :3] = True; solid[:, W - 3:] = True
    solid[286:316, W - 3:] = False; solid[H - 3:, 458:484] = False
    base.save(os.path.join(OUT, 'farm_base.png'))
    Image.fromarray((solid * 255).astype(np.uint8)).save(os.path.join(OUT, 'farm_solid.png'))
    maps['farm'] = dict(w=W, h=H, base='farm_base.png', solid='farm_solid.png',
                        exits=[dict(to='town', box=[W - 6, 284, 8, 34], arrive=[W - 20, 300]), dict(to='battle', box=[454, H - 6, 34, 8], arrive=[470, H - 24])],
                        spawn=[87, 432], cabin_door=[87, 422],
                        sites={k: dict(sign=list(v['sign']), door=doors.get(k)) for k, v in SITES.items()},
                        plots=plots, pen=list(L['pen'][:4]))
    # town
    tm = town_map()
    add('town', tm.sprites)
    TWW, TWH = TW.W, TW.H
    tsolid = np.zeros((TWH, TWW), bool)
    tsolid[:3, :] = True; tsolid[TWH - 3:, :] = True; tsolid[:, :3] = True; tsolid[:, TWW - 3:] = True
    tsolid[TWH - 3:, 300:341] = False
    tm.base.save(os.path.join(OUT, 'town_base.png'))
    Image.fromarray((tsolid * 255).astype(np.uint8)).save(os.path.join(OUT, 'town_solid.png'))
    maps['town'] = dict(w=TWW, h=TWH, base='town_base.png', solid='town_solid.png',
                        exits=[dict(to='farm', box=[300, TWH - 6, 41, 8], arrive=[320, TWH - 22])],
                        shops=dict(seeds=[86, 238], store=[546, 238]))
    # interiors
    for name in INTERIORS:
        im, ibase, isolid, meta = interior(name)
        add('in_' + name, im.sprites)
        ibase.save(os.path.join(OUT, 'in_%s_base.png' % name))
        Image.fromarray((isolid * 255).astype(np.uint8)).save(os.path.join(OUT, 'in_%s_solid.png' % name))
        maps['in_' + name] = dict(base='in_%s_base.png' % name, solid='in_%s_solid.png' % name, **meta)
    pages = pack(sprites)
    for i, p in enumerate(pages): p.save(os.path.join(OUT, 'atlas%d.png' % i), optimize=True)
    out = dict(note='Sketch-scale layers for the farm, town and interiors; the game draws them at 2 art px per sketch px. '
                    'Sprites sort by sy with the hero; flat sprites draw under everything. Groups: static, lot:<b>, built:<b>, cover:<n>, bed:<n>, scarecrow.',
               scale=2, maps=maps, atlases=['atlas%d.png' % i for i in range(len(pages))],
               sprites=[dict(map=s['map'], g=s['group'], k=s['kind'], at=s['at'], w=s['img'].width, h=s['img'].height, x=s['x'], y=s['y'],
                             sy=round(float(s['sy']), 1), flat=bool(s['flat']), solid=s['solid'], tag=s['tag']) for s in sprites])
    json.dump(out, open(os.path.join(OUT, 'world.json'), 'w'), separators=(',', ':'))
    print('sprites', len(sprites), 'atlas pages', len(pages), 'doors', doors)

if __name__ == '__main__':
    main()
