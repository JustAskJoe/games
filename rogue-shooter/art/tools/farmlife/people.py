"""Farm and town NPCs redrawn in the hero style: same 32x44 canvas, proportions, pose groups,
walk cycle and three facings as the heroes (heroes/heroes.py).

- Farmer (farm hub): straw hat with a red band, red shirt, blue overalls. Same look as the sketch.
- Arena warrior (Arena): steel helm with a red plume, red cape, blue shield, sword.
- Seed keeper (town seed shop): green headscarf, leaf-green apron with seed pockets, watering can.
- Shopkeeper (town general store): bald with a big moustache, striped shirt, brown vest and apron.
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'heroes'))
sys.path.insert(0, os.path.join(HERE, '..', 'enemies'))
import ekit  # noqa: F401  (enemy ramps such as bronze)
from spritekit import Sprite, R, ramp, EYE, WHITE, BLUSH, hx
from heroes import boots_front, boots_side, face_front, face_side, sword, WALK, VIEWS

R.update({
    'skin3':  ramp('#2e1810', '#5a3020', '#8e5636', '#b47a50', '#d8a070'),
    'skin4':  ramp('#1e100c', '#3e2216', '#6a3e26', '#8e5a38', '#b07c52'),
    'hatstr': ramp('#5a400e', '#946c1c', '#d0a438', '#ecc85c', '#fff0a0'),
    'denim':  ramp('#0e1e36', '#1a3a64', '#2a5c96', '#4a86c4', '#8cbce8'),
    'shirtr': ramp('#3a0a0a', '#7a1a18', '#b8302a', '#de5a44', '#f8a088'),
    'scarf':  ramp('#0e2a14', '#1e5226', '#2e7e3a', '#52aa54', '#9ad888'),
    'apron':  ramp('#24300e', '#44581c', '#6a842e', '#94ae4a', '#c8dc80'),
    'stripe': ramp('#3a3442', '#6a6478', '#b4aec0', '#e2dcea', '#ffffff'),
    'vest':   ramp('#1e100a', '#3e2414', '#62401e', '#86602e', '#ac8448'),
    'grey':   ramp('#2a2a30', '#4e4e58', '#80808c', '#b0b0bc', '#e0e0e8'),
})

def hands_front(s, m, ys=28.5):
    s.g('armL'); s.ell(m, 8, ys, 1.6, 1.6); s.g('armR'); s.ell(m, 23, ys, 1.6, 1.6); s.g('body')

# ------------------------------------------------------------------ farmer

def farmer(view):
    s = Sprite()
    if view in ('front', 'back'):
        boots_front(s, 'leather', 'denim')
        s.rect('shirtr', 10, 20, 21, 29)
        if view == 'front':
            s.rect('denim', 11, 24, 20, 29); s.rect('denim', 12, 21, 13, 24); s.rect('denim', 18, 21, 19, 24)
            s.dots([(12, 24), (19, 24)], ('gold', 4)); s.dots([(x, 26) for x in range(13, 19)], ('denim', 1)); s.dots([(15, 27), (16, 27)], ('denim', 4))
        else:
            s.rect('denim', 11, 24, 20, 29); s.line('denim', [(12, 20), (19, 24)], 1); s.line('denim', [(19, 20), (12, 24)], 1)
        s.g('armL'); s.rect('shirtr', 7, 21, 9, 26); s.ell('skin', 8, 28, 1.6, 1.8)
        s.g('armR'); s.rect('shirtr', 22, 21, 24, 26); s.ell('skin', 23, 28, 1.6, 1.8); s.g('body')
        s.dots([(7, 23), (8, 24), (22, 23), (23, 24)], ('shirtr', 1))
        s.rect('skin', 14, 17, 17, 19)
        if view == 'front':
            s.ell('skin', 15.5, 12, 6, 5.5)
            s.poly('hbrown', [(10, 14), (11, 18), (15.5, 19), (20, 18), (21, 14), (19, 16), (12, 16)])
            s.ell('hatstr', 15.5, 7, 11, 2.6); s.ell('hatstr', 15.5, 4, 6, 3.6); s.rect('shirtr', 10, 6, 21, 7)
            face_front(s, y=11, mouth=False)
            s.dots([(14, 15), (15, 15), (16, 15), (17, 15)], ('hbrown', 1)); s.dots([(15, 16), (16, 16)], ('skin', 1))
            s.dots([(8, 7), (9, 6), (12, 2), (13, 2)], ('hatstr', 4)); s.dots([(x, 8) for x in range(6, 26, 3)], ('hatstr', 1))
        else:
            s.ell('hbrown', 15.5, 12, 6, 5.5)
            s.ell('hatstr', 15.5, 7, 11, 2.6); s.ell('hatstr', 15.5, 4, 6, 3.6); s.rect('shirtr', 10, 6, 21, 7)
            s.dots([(8, 7), (12, 2), (13, 2)], ('hatstr', 4))
    else:
        boots_side(s, 'leather', 'denim')
        s.g('armB'); s.rect('shirtr', 13, 21, 15, 26); s.g('body')
        s.rect('shirtr', 11, 20, 19, 29); s.rect('denim', 12, 24, 19, 29); s.rect('denim', 16, 21, 17, 24); s.dot(16, 24, ('gold', 4))
        s.rect('skin', 14, 17, 17, 19)
        s.ell('skin', 16.5, 12, 5.5, 5.5)
        s.poly('hbrown', [(11, 9), (14, 9), (14, 15), (11, 15)])
        s.poly('hbrown', [(17, 14), (22, 14), (21, 18), (17, 19)])
        s.ell('hatstr', 16, 7, 10, 2.4); s.ell('hatstr', 15, 4, 5.5, 3.6); s.rect('shirtr', 10, 6, 20, 7)
        face_side(s, ex=19, y=11, mouth=False)
        s.g('armF'); s.rect('shirtr', 15, 21, 17, 26); s.ell('skin', 16, 28, 1.6, 1.8); s.g('body')
        s.dots([(8, 7), (11, 2), (12, 2)], ('hatstr', 4))
    return s

# ------------------------------------------------------------------ arena warrior

def warrior(view):
    s = Sprite()
    if view in ('front', 'back'):
        s.poly('feather', [(8, 21), (23, 21), (25, 36), (6, 36)]) if view == 'back' else s.poly('red', [(8, 21), (23, 21), (25, 34), (6, 34)])
        boots_front(s, 'leather', 'leather')
        s.rect('bronze', 10, 20, 21, 29)
        s.poly('red', [(10, 27), (21, 27), (22, 32), (9, 32)])
        s.dots([(12, 28), (12, 31), (15, 28), (15, 31), (18, 28), (18, 31)], ('red', 1))
        s.rect('leather', 10, 26, 21, 27); s.dots([(15, 26), (16, 26)], ('gold', 4))
        s.rect('skin3', 14, 17, 17, 19)
        s.ell('steel', 15.5, 11, 7, 6.5)
        s.poly('feather', [(13, 5), (18, 5), (20, 0), (18, -3), (15, -3), (13, 0)])
        s.dots([(x, 4) for x in range(12, 20)], ('gold', 3))
        if view == 'front':
            s.ell('skin3', 15.5, 13, 4.5, 3.6); s.rect('dsteel', 10, 10, 21, 11, flat=True); s.rect('dsteel', 15, 9, 16, 13, flat=True)
            s.dots([(13, 12), (18, 12)], EYE); s.dots([(13, 11), (18, 11)], WHITE); s.dots([(15, 15), (16, 15)], ('skin3', 1))
            s.dots([(12, 22), (13, 22), (12, 23)], ('bronze', 4)); s.dots([(15, 22), (16, 22), (15, 24), (16, 24)], ('bronze', 1))
        s.g('armL'); s.rect('skin3', 7, 22, 9, 27); s.ell('bronze', 8, 21, 3, 2.4); s.ell('leather', 8, 28.5, 1.6, 1.6)
        if view == 'front': sword(s, 6.5, 29, 90)
        s.g('armR'); s.rect('skin3', 22, 22, 24, 27); s.ell('bronze', 23, 21, 3, 2.4); s.ell('leather', 23, 28.5, 1.6, 1.6)
        if view == 'front':
            s.ell('blue', 25, 27, 4.6, 5); s.ell('gold', 25, 27, 1.6, 1.6); s.dots([(23, 24), (24, 23)], ('blue', 4))
        else:
            s.g('armL'); s.ell('blue', 6, 27, 4.6, 5); s.ell('gold', 6, 27, 1.6, 1.6)
        s.g('body')
    else:
        s.poly('red', [(12, 19), (7, 24), (6, 34), (12, 33)])
        boots_side(s, 'leather', 'leather')
        s.g('armB'); s.rect('skin3', 13, 22, 15, 27); s.ell('blue', 12, 26, 2, 5); s.g('body')
        s.rect('bronze', 11, 20, 19, 29); s.poly('red', [(11, 27), (19, 27), (20, 32), (10, 32)]); s.rect('leather', 11, 26, 19, 27)
        s.rect('skin3', 14, 17, 17, 19)
        s.ell('steel', 16, 11, 6.5, 6.5)
        s.ell('skin3', 19.5, 13, 3, 3.2)
        s.rect('dsteel', 15, 9, 22, 10, flat=True); s.rect('dsteel', 21, 10, 22, 14, flat=True)
        s.dot(20, 12, EYE); s.dot(19, 12, WHITE); s.dot(19, 15, ('skin3', 1))
        s.poly('feather', [(10, 4), (16, 4), (17, 0), (13, -3), (9, -1)])
        s.g('armF'); s.rect('skin3', 15, 22, 17, 27); s.ell('bronze', 16, 21, 3, 2.4); s.ell('leather', 17, 28.5, 1.6, 1.6); sword(s, 18, 28.5, 10); s.g('body')
    return s

# ------------------------------------------------------------------ seed keeper

def seed_keeper(view):
    s = Sprite()
    if view in ('front', 'back'):
        s.g('legL'); s.poly('leather', [(10, 34), (14, 34), (14, 38), (10, 38)]); s.g('legR'); s.poly('leather', [(17, 34), (21, 34), (21, 38), (17, 38)]); s.g('body')
        s.poly('cream', [(10, 20), (21, 20), (23, 35), (8, 35)])
        if view == 'front':
            s.poly('apron', [(11, 23), (20, 23), (21, 34), (10, 34)]); s.rect('apron', 13, 20, 18, 23)
            s.rect('apron', 11, 28, 14, 31); s.rect('apron', 17, 28, 20, 31)
            s.dots([(12, 28), (13, 27), (18, 28), (19, 27)], ('hatstr', 4)); s.dots([(18, 27), (12, 27)], ('leafy', 4) if 'leafy' in R else ('apron', 4))
        else:
            s.line('apron', [(10, 23), (21, 23)], 1); s.dots([(15, 24), (16, 24), (15, 25), (16, 25)], ('apron', 2))
        s.g('armL'); s.rect('cream', 7, 21, 9, 26); s.ell('skin4', 8, 28, 1.6, 1.8)
        s.g('armR'); s.rect('cream', 22, 21, 24, 26); s.ell('skin4', 23, 28, 1.6, 1.8)
        if view == 'front': s.ell('grey', 26, 29, 3, 2.6); s.line('grey', [(28, 28), (31, 25)], 1); s.dots([(25, 27)], ('grey', 4))
        s.g('body')
        s.rect('skin4', 14, 17, 17, 19)
        if view == 'front':
            s.ell('skin4', 15.5, 12, 6, 5.5)
            s.poly('scarf', [(9, 12), (10, 6), (15.5, 3), (21, 6), (22, 12), (20, 9), (11, 9)])
            s.poly('scarf', [(20, 14), (23, 18), (21, 19), (19, 16)])
            face_front(s, y=12)
            s.dots([(11, 11), (12, 10), (19, 11), (20, 10)], ('grey', 3))
            s.dots([(12, 6), (13, 5)], ('scarf', 4)); s.dots([(13, 7), (17, 6)], ('hatstr', 4))
        else:
            s.ell('scarf', 15.5, 11, 6.5, 6); s.poly('scarf', [(13, 15), (18, 15), (17, 21), (14, 21)])
            s.dots([(13, 7), (17, 6), (15, 10)], ('hatstr', 4))
    else:
        s.g('legB'); s.poly('leather', [(13, 34), (16, 34), (16, 38), (13, 38)]); s.g('legF'); s.poly('leather', [(16, 34), (19, 34), (21, 38), (16, 38)]); s.g('body')
        s.g('armB'); s.rect('cream', 13, 21, 15, 26); s.g('body')
        s.poly('cream', [(11, 20), (19, 20), (21, 35), (10, 35)])
        s.poly('apron', [(17, 22), (20, 22), (21, 34), (18, 34)])
        s.rect('skin4', 14, 17, 17, 19)
        s.ell('skin4', 16.5, 12, 5.5, 5.5)
        s.poly('scarf', [(10, 13), (11, 6), (16, 4), (21, 7), (20, 9), (15, 9), (14, 15), (11, 16)])
        s.poly('scarf', [(10, 14), (8, 19), (11, 18)])
        face_side(s, ex=19, y=12)
        s.g('armF'); s.rect('cream', 15, 21, 17, 26); s.ell('skin4', 17, 28, 1.6, 1.8)
        s.ell('grey', 20, 29, 3, 2.6); s.line('grey', [(22, 28), (25, 25)], 1); s.g('body')
        s.dots([(13, 6), (16, 5)], ('scarf', 4))
    return s

# ------------------------------------------------------------------ general store keeper

def shopkeeper(view):
    s = Sprite()
    if view in ('front', 'back'):
        boots_front(s, 'dleather', 'hbrown')
        s.ell('stripe', 15.5, 25, 7, 6.5)
        for x in range(10, 22, 2): s.dots([(x, y) for y in range(20, 31)], ('blue', 3))
        if view == 'front':
            s.poly('vest', [(9, 20), (13, 20), (15, 31), (9, 30)]); s.poly('vest', [(22, 20), (18, 20), (16, 31), (22, 30)])
            s.poly('cream', [(11, 27), (20, 27), (21, 34), (10, 34)])
            s.dots([(13, 22), (13, 25), (18, 22), (18, 25)], ('gold', 4))
        else:
            s.ell('vest', 15.5, 25, 7, 6.5); s.line('cream', [(9, 27), (22, 27)], 1)
        s.g('armL'); s.rect('stripe', 6, 21, 9, 25); s.rect('skin2', 6, 25, 8, 27); s.ell('skin2', 7, 28.5, 1.8, 1.8)
        s.g('armR'); s.rect('stripe', 22, 21, 25, 25); s.rect('skin2', 23, 25, 25, 27); s.ell('skin2', 24, 28.5, 1.8, 1.8); s.g('body')
        s.dots([(7, 22), (7, 24), (23, 22), (23, 24)], ('blue', 3))
        s.rect('skin2', 14, 17, 17, 19)
        s.ell('skin2', 15.5, 11.5, 6.5, 6.5)
        if view == 'front':
            face_front(s, y=11, mouth=False)
            s.poly('hblack', [(10, 15), (15, 13), (16, 13), (21, 15), (21, 17), (18, 15), (13, 15), (10, 17)])
            s.ell('hblack', 9.5, 12, 1.4, 2); s.ell('hblack', 21.5, 12, 1.4, 2)
            s.ell('vest', 15.5, 6.5, 7, 3.4); s.rect('vest', 9, 7, 22, 8); s.dots([(12, 5), (13, 4)], ('vest', 4))
        else:
            s.ell('hblack', 15.5, 14, 6.5, 2.4); s.ell('vest', 15.5, 6.5, 7, 3.4); s.rect('vest', 9, 7, 22, 8); s.dots([(12, 5), (13, 4)], ('vest', 4))
    else:
        boots_side(s, 'dleather', 'hbrown')
        s.g('armB'); s.rect('stripe', 13, 21, 15, 26); s.g('body')
        s.ell('stripe', 15.5, 25, 6, 6.5)
        for x in range(11, 21, 2): s.dots([(x, y) for y in range(20, 31)], ('blue', 3))
        s.poly('vest', [(10, 20), (15, 20), (15, 31), (10, 30)]); s.poly('cream', [(17, 26), (21, 26), (21, 34), (17, 34)])
        s.rect('skin2', 14, 17, 17, 19)
        s.ell('skin2', 16.5, 11.5, 6, 6.5)
        s.ell('hblack', 11.5, 13, 1.6, 2.6)
        s.poly('hblack', [(18, 14), (22, 14), (23, 16), (18, 16)])
        s.ell('vest', 15.5, 6.5, 6.5, 3.4); s.poly('vest', [(18, 7), (24, 8), (24, 9), (18, 9)]); s.dots([(12, 5), (13, 4)], ('vest', 4))
        face_side(s, ex=19, y=11, mouth=False)
        s.g('armF'); s.rect('stripe', 15, 21, 18, 25); s.rect('skin2', 16, 25, 18, 27); s.ell('skin2', 17, 28.5, 1.8, 1.8); s.g('body')
    return s

PEOPLE = [('Farmer', farmer, 'Farm hub, by the cabin. Same look as the sketch; the design has no farmer role yet.'),
          ('Arena warrior', warrior, 'Stands at the Arena; mutators are picked on the battle map.'),
          ('Seed keeper', seed_keeper, 'Runs the town seed shop.'),
          ('Shopkeeper', shopkeeper, 'Runs the town general store.')]

def frames(fn):
    out = {}
    for v in VIEWS:
        base = fn(v)
        out[v] = {'idle': [base.render(), base.render({'body': (0, -1), 'legL': (0, 0), 'legR': (0, 0), 'legF': (0, 0), 'legB': (0, 0)})],
                  'walk': [base.render(p) for p in WALK[v]]}
    return out
