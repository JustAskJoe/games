"""Compose one combat screen per zone (427x267 art px = 1280x800 at 3x) from the zone's ground tile,
details and obstacles, with the new hero, enemy and effect sprites placed in it, then the zone's light."""
import os, json, math, random
import numpy as np
from PIL import Image
from biomes import (ground, details, obstacle_images, ZONES, SW, SH_, T, ROOT, SHADOW_MUL, hx)

SPR = os.path.join(ROOT, 'art', 'sprites')
EJ = json.load(open(os.path.join(SPR, 'enemies', 'enemies.json')))['enemies']
HJ = json.load(open(os.path.join(SPR, 'heroes', 'heroes.json')))
_cache = {}

def sheet(path):
    if path not in _cache: _cache[path] = Image.open(path).convert('RGBA')
    return _cache[path]

def enemy_frame(key, row, col):
    e = EJ[key]; w, h = e['frame']
    r = e['rows'].index(row)
    return sheet(os.path.join(SPR, 'enemies', e['file'])).crop((col * w, r * h, col * w + w, r * h + h))

def enemy_extra(key, name, i):
    x = EJ[key]['extras'][name]; w, h = x['frame']
    return sheet(os.path.join(SPR, 'enemies', x['file'])).crop((i * w, 0, i * w + w, h))

def hero_frame(hero, view, col):
    r = HJ['views'].index(view)
    return sheet(os.path.join(SPR, 'heroes', f'{hero}.png')).crop((col * 32, r * 44, col * 32 + 32, r * 44 + 44))

def hero_fx(hero, view, i):
    r = HJ['views'].index(view)
    s = sheet(os.path.join(SPR, 'heroes', f'{hero}_fx.png'))
    return (s.crop((i * 96, r * 88, i * 96 + 96, r * 88 + 88)), s.crop(((i + 3) * 96, r * 88, (i + 3) * 96 + 96, r * 88 + 88)))

# ------------------------------------------------------------------ helpers on a float RGB canvas

def ellipse_mask(cx, cy, rx, ry):
    yy, xx = np.mgrid[0:SH_, 0:SW]
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1

def multiply(a, m, mul, k=1.0):
    a[m] *= (1 - k) + np.array(mul) * k

def stepped_light(a, cx, cy, r, c, k=0.5, sq=0.7, steps=4):
    yy, xx = np.mgrid[0:SH_, 0:SW]
    d = np.sqrt((xx - cx) ** 2 + ((yy - cy) / sq) ** 2) / r
    f = np.floor(np.clip(1 - d, 0, 1) * steps) / steps * k
    a += (np.array(hx(c), float) - a) * f[..., None]

def vignette(a, k=0.5, steps=3, mul=(0.5, 0.5, 0.6)):
    yy, xx = np.mgrid[0:SH_, 0:SW]
    d = np.sqrt(((xx - SW / 2) / (SW / 2)) ** 2 + ((yy - SH_ / 2) / (SH_ / 2)) ** 2)
    f = np.floor(np.clip((d - 0.75) / 0.5, 0, 1) * steps) / steps * k
    a *= 1 - f[..., None] * (1 - np.array(mul))

def blobby(cx, cy, rx, ry, rng, n=9):
    """A soft-edged cloud shape: a union of circles, so shadows and light patches aren't plain ovals."""
    m = ellipse_mask(cx, cy, rx * 0.6, ry * 0.6)
    for _ in range(n):
        a = rng.random() * math.tau; d = rng.random() * 0.6
        m |= ellipse_mask(cx + math.cos(a) * rx * d, cy + math.sin(a) * ry * d, rx * (0.3 + rng.random() * 0.25), ry * (0.35 + rng.random() * 0.3))
    return m

def paste(a, im, x, y, flip=False):
    """Alpha-paste a sprite with its top-left at (x, y)."""
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    s = np.array(im).astype(float)
    x, y = int(round(x)), int(round(y))
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(SW, x + im.width), min(SH_, y + im.height)
    if x1 <= x0 or y1 <= y0: return
    sub = s[y0 - y:y1 - y, x0 - x:x1 - x]
    al = sub[..., 3:4] / 255
    a[y0:y1, x0:x1] = a[y0:y1, x0:x1] * (1 - al) + sub[..., :3] * al

def shadow(a, fx, fy, w, floats=False):
    rx = max(3, w * (0.26 if floats else 0.36)); ry = max(1.5, rx * 0.32)
    multiply(a, ellipse_mask(fx + 2, fy + (4 if floats else 0), rx, ry), SHADOW_MUL)

def gem(a, x, y, c='#5fe0c8'):
    c = np.array(hx(c), float); dk = c * 0.55; lt = c * 0.4 + 255 * 0.6
    for dx, dy, col in ((0, -2, lt), (-1, -1, lt), (0, -1, c), (1, -1, c), (-1, 0, c), (0, 0, c), (1, 0, dk), (0, 1, dk)):
        if 0 <= x + dx < SW and 0 <= y + dy < SH_: a[y + dy, x + dx] = col
    for dx, dy in ((0, -3), (-2, -1), (2, -1), (-2, 0), (2, 0), (-1, 1), (1, 1), (0, 2)):
        if 0 <= x + dx < SW and 0 <= y + dy < SH_: a[y + dy, x + dx] = np.array(hx('#2b1d14'), float)

# ------------------------------------------------------------------ zone plans

HERO_AT = (213, 150)        # hero feet

PLANS = {
    'meadow': dict(hero='knight', path='#d2a96c', clouds=True,
        obstacles=[('Oak', 40, 70), ('Oak', 380, 60), ('Pine', 95, 40), ('Pine', 330, 245), ('Boulder', 300, 92), ('Bush', 120, 222), ('Pond', 360, 170),
                   ('Boulder', 60, 190), ('Bush', 260, 40), ('Oak', 165, 262), ('Pine', 410, 120)],
        enemies=[('slime', 'meadow front', 0, 160, 120, False), ('slime', 'meadow front', 2, 270, 190, False), ('slime', 'meadow front', 1, 120, 160, False),
                 ('bat', 'front', 1, 250, 78, False), ('wisp', 'front', 0, 175, 205, False), ('beetle', 'side', 0, 285, 145, True), ('beetle', 'front', 2, 220, 236, False),
                 ('slime', 'meadow front', 3, 330, 128, False), ('bat', 'front', 3, 90, 110, False)],
        gems=[(190, 175), (238, 168), (150, 140), (300, 210)]),
    'forest': dict(hero='marksman', path='#5a4426',
        obstacles=[('Old tree', 40, 82), ('Old tree', 392, 70), ('Old tree', 300, 266), ('Fallen log', 300, 60), ('Stump', 120, 200), ('Giant mushroom', 360, 190),
                   ('Mossy boulder', 80, 250), ('Giant mushroom', 150, 52), ('Stump', 420, 230), ('Old tree', 180, 30)],
        enemies=[('shroomling', 'front', 0, 160, 128, False), ('shroomling', 'side', 2, 270, 170, True), ('wolf', 'side', 1, 120, 165, False),
                 ('archer', 'front', 1, 330, 120, False), ('slime', 'forest front', 0, 250, 215, False), ('wolf', 'front', 3, 215, 85, False),
                 ('archer', 'side', 0, 90, 120, False)],
        extras=[('archer', 'Arrow', 0, 290, 128, True)],
        gems=[(200, 180), (240, 120), (150, 190)]),
    'caverns': dict(hero='mage', vignette=0.7,
        obstacles=[('Stalagmite', 40, 70), ('Crystal cluster', 380, 80), ('Rock pillar', 100, 250), ('Stalagmite', 320, 50), ('Crystal cluster', 70, 170),
                   ('Rock', 290, 230), ('Stalagmite', 420, 200), ('Rock pillar', 170, 40), ('Crystal cluster', 250, 262), ('Rock', 360, 150)],
        enemies=[('golem', 'side', 1, 300, 150, True), ('crawler', 'front', 0, 140, 120, False), ('moth', 'front', 1, 330, 95, False),
                 ('slime', 'caverns front', 0, 170, 190, False), ('slime', 'caverns front', 2, 255, 200, False), ('bat', 'front', 2, 215, 85, False)],
        lights=[(380, 70, 40, '#7ee0f0'), (70, 160, 34, '#7ee0f0'), (250, 252, 34, '#7ee0f0')],
        gems=[(190, 170), (240, 175)]),
    'volcanic': dict(hero='rogue', vignette=0.45,
        obstacles=[('Lava pool', 90, 90), ('Basalt columns', 360, 70), ('Charred tree', 50, 230), ('Obsidian', 300, 230), ('Lava pool', 360, 225),
                   ('Basalt columns', 150, 40), ('Obsidian', 410, 140), ('Charred tree', 250, 50), ('Basalt columns', 30, 160)],
        enemies=[('magma', 'front', 0, 160, 140, False), ('magma', 'front', 2, 280, 190, False), ('imp', 'side', 1, 290, 110, True),
                 ('brute', 'side', 1, 120, 200, False), ('imp', 'front', 3, 210, 75, False)],
        extras=[('imp', 'Fireball', 0, 248, 118, True), ('magma', 'Fire trail', 1, 285, 205, False), ('magma', 'Fire trail', 0, 165, 155, False)],
        lights=[(90, 86, 44, '#ffa030'), (360, 220, 44, '#ffa030')], bottom_glow='#e05a10',
        gems=[(200, 175), (235, 120)]),
    'shadow': dict(hero='witch', path='#3a3050', vignette=0.8, fog=True,
        obstacles=[('Dead tree', 45, 80), ('Broken pillar', 380, 70), ('Gravestone', 300, 60), ('Gravestone', 330, 72), ('Ruined arch', 110, 260),
                   ('Dead tree', 400, 230), ('Broken pillar', 170, 50), ('Gravestone', 80, 170), ('Dead tree', 300, 262)],
        enemies=[('wraith', 'front', 1, 150, 125, False), ('nightmare', 'front', 0, 300, 160, False), ('shade', 'side', 1, 255, 120, True),
                 ('slime', 'shadow front', 0, 180, 200, False), ('wraith', 'front', 3, 260, 220, False)],
        lights=[(300, 150, 50, '#8a4cb8')],
        gems=[(200, 172), (230, 180)]),
    'void': dict(hero='knight', vignette=0.6,
        obstacles=[('Void pit', 80, 90), ('Floating rock', 350, 70), ('Monolith', 400, 160), ('Debris', 290, 240), ('Floating rock', 60, 220),
                   ('Monolith', 160, 50), ('Void pit', 360, 235), ('Debris', 130, 180)],
        enemies=[('voidspawn', 'front', 0, 160, 130, False), ('voidfrag', 'front', 1, 270, 180, False), ('voidfrag', 'front', 3, 290, 150, False),
                 ('voidshard', 'front', 0, 180, 200, False), ('voidshard', 'front', 2, 150, 210, False), ('voidshard', 'front', 1, 245, 215, False),
                 ('tear', 'front', 1, 300, 95, False), ('anchor', 'front', 0, 230, 70, False)],
        lights=[(300, 80, 46, '#f070ff'), (230, 50, 40, '#20e0d0'), (80, 86, 38, '#20e0d0'), (360, 230, 38, '#20e0d0')],
        gems=[(200, 172), (240, 165)]),
}
FLOATERS = {'bat', 'wisp', 'moth', 'wraith', 'imp', 'nightmare', 'tear', 'anchor'}

def scene(zone, seed=11, calm=False):
    """calm=True leaves out the hero, enemies, effects and pickups (menu backdrops)."""
    p = dict(PLANS[zone]); rng = random.Random(seed)
    if calm: p.update(enemies=[], extras=[], gems=[])
    tile = np.array(ground(zone)).astype(float)
    reps = np.tile(tile, (SH_ // T + 2, SW // T + 2, 1))
    ox, oy = 17, 23
    a = reps[oy:oy + SH_, ox:ox + SW].copy()
    # a winding path for zones that have one
    if p.get('path'):
        yy, xx = np.mgrid[0:SH_, 0:SW]
        cy = 200 + 22 * np.sin(xx / 60.0) - xx * 0.12
        d = np.abs(yy - cy)
        base = np.array(hx(p['path']), float)
        m = d < 9 + 2 * np.sin(xx / 7.0)
        noise = np.random.default_rng(seed).random((SH_, SW))
        m |= (d < 11) & (noise < 0.3)
        a[m] = base
        edge = m & ~((d < 7) & True)
        a[edge & (noise < 0.6)] = base * 0.82
        a[m & (noise > 0.96)] = base * 1.12
    # big, soft breakup so the repeating tile doesn't show (3 hard steps, no gradient)
    nrng = np.random.default_rng(seed + 1)
    g = nrng.random((6, 9))
    big = np.array(Image.fromarray((g * 255).astype(np.uint8)).resize((SW, SH_), Image.BICUBIC)).astype(float) / 255
    a *= (0.93 + np.floor(np.clip(big, 0, 0.999) * 3) / 3 * 0.12)[..., None]
    # details
    det = details(zone)
    for _ in range(80):
        name, im = det[rng.randrange(len(det))]
        x, y = rng.randrange(0, SW - im.width), rng.randrange(0, SH_ - im.height)
        if abs(x - HERO_AT[0]) < 22 and abs(y - HERO_AT[1] + 20) < 26: continue
        paste(a, im, x, y)
    if p.get('clouds'):
        for cx, cy, rx, ry in ((90, 60, 70, 24), (330, 210, 80, 26)):
            multiply(a, blobby(cx, cy, rx, ry, rng), SHADOW_MUL, 0.3)
    if zone == 'forest':
        a *= 0.9
        for cx, cy, rx, ry in ((150, 120, 60, 26), (300, 200, 70, 30), (330, 60, 40, 18), (70, 200, 40, 16)):
            m = blobby(cx, cy, rx, ry, rng)
            a[m] += (np.array(hx('#b6e07e'), float) - a[m]) * 0.12
            m2 = blobby(cx, cy, rx * 0.55, ry * 0.55, rng)
            a[m2] += (np.array(hx('#d8f0a0'), float) - a[m2]) * 0.08
    # everything that stands, sorted by feet y
    obs = {n: (im, r) for n, im, r in obstacle_images(zone)}
    things = []
    for name, x, y in p['obstacles']:
        im, r = obs[name]
        things.append((y, 'ob', name, im, x, y, False))
    for key, row, col, x, y, flip in p['enemies']:
        im = enemy_frame(key, row, col)
        things.append((y, 'en', key, im, x, y, flip))
    things.sort(key=lambda t: t[0])
    hero = p['hero']
    for t in things + [(HERO_AT[1], 'hero', hero, None, HERO_AT[0], HERO_AT[1], False)]:
        pass
    drawn_hero = False
    def draw_hero():
        hx_, hy_ = HERO_AT
        shadow(a, hx_, hy_, 18)
        hb, hf = hero_fx(hero, 'side', 1)
        im = hero_frame(hero, 'side', 6)
        paste(a, hb, hx_ - 16 - 32, hy_ - 42 - 24)
        paste(a, im, hx_ - 16, hy_ - 42)
        paste(a, hf, hx_ - 16 - 32, hy_ - 42 - 24)
    for y, kind, name, im, x, fy, flip in things:
        if not drawn_hero and not calm and fy > HERO_AT[1]: draw_hero(); drawn_hero = True
        flo = kind == 'en' and name in FLOATERS
        if kind == 'ob' and name in ('Pond', 'Lava pool', 'Void pit', 'Fallen log'):
            paste(a, im, x - im.width / 2, fy - im.height / 2)
            continue
        if kind == 'ob' and name == 'Floating rock':
            shadow(a, x, fy + 6, im.width * 0.8, True)
        elif kind == 'ob':
            shadow(a, x, fy - 2, im.width * 0.8)
        else:
            shadow(a, x, fy - 2, im.width, flo)
        paste(a, im, x - im.width / 2, fy - im.height + (2 if kind == 'en' else 0), flip)
    if not drawn_hero and not calm: draw_hero()
    for key, name, i, x, y, flip in p.get('extras', []):
        im = enemy_extra(key, name, i)
        paste(a, im, x - im.width / 2, y - im.height / 2, flip)
    for gx, gy in p.get('gems', []): gem(a, gx, gy)
    # light
    for cx, cy, r, c in p.get('lights', []): stepped_light(a, cx, cy, r, c, 0.35)
    if p.get('bottom_glow'):
        yy = np.mgrid[0:SH_, 0:SW][0]
        f = np.floor(np.clip((yy - SH_ * 0.7) / (SH_ * 0.3), 0, 1) * 4) / 4 * 0.28
        a += (np.array(hx(p['bottom_glow']), float) - a) * f[..., None]
    if p.get('fog'):
        yy, xx = np.mgrid[0:SH_, 0:SW]
        for cy, k, ph in ((70, 0.16, 0.0), (190, 0.12, 2.0)):
            c = cy + 6 * np.sin(xx / 37.0 + ph) + 3 * np.sin(xx / 11.0 + ph * 2)
            w = 8 + 4 * np.sin(xx / 23.0 + ph)
            gap = np.sin(xx / 53.0 + ph * 3) > -0.55
            f = ((np.abs(yy - c) < w).astype(float) * k + (np.abs(yy - c) < w * 0.45) * k * 0.6) * gap
            a += (np.array(hx('#8a7aa2'), float) - a) * f[..., None]
    if p.get('vignette'): vignette(a, p['vignette'])
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB')

if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
    for z in (sys.argv[2:] or ZONES):
        im = scene(z); im.resize((SW * 2, SH_ * 2), Image.NEAREST).save(os.path.join(out, f'scene_{z}.png'))
        print(z)
