import random, json, sys
sys.path.insert(0, '.')
from farm import *

def border(rng, W, H, skip=()):
    props = []
    for x in range(-6, W + 20, 28):
        k = rng.choice(['tree', 'dark', 'pine', 'tree', 'dark'])
        props.append((k, x + rng.randint(-4, 4), 30 + rng.randint(-6, 6)))
    for x in range(10, W, 46):
        if any(a <= x <= b for a, b in skip): continue
        props.append((rng.choice(['tree', 'pine', 'dark']), x + rng.randint(-6, 6), 58 + rng.randint(-4, 4)))
    return props

def layout_a(rng):
    L = dict(
        paths=[
            dict(pts=[(-10, 200), (650, 200)]),
            dict(pts=[(311, 40), (311, 460)]),
            dict(pts=[(94, 132), (94, 200)], w=16),
            dict(pts=[(403, 132), (403, 200)], w=16),
            dict(pts=[(560, 150), (560, 200)], w=16),
            dict(pts=[(209, 178), (209, 200)], w=16),
            dict(pts=[(112, 200), (112, 244)], w=16),
            dict(pts=[(500, 200), (500, 308), (548, 308), (548, 334)], w=16),
            dict(pts=[(405, 372), (405, 412), (311, 412)], w=16),
        ],
        water=[('ellipse', 104, 410, 62, 26)],
        lilies=[(80, 404), (120, 418), (140, 400)],
        field=(40, 250),
        training=(150, 180),
        pen=(496, 334, 124, 92, None, 538),
        animals=[('cow', 528, 374, False), ('cowb', 592, 386, True), ('sheep', 524, 414, False), ('pig', 584, 420, True),
                 ('chick', 606, 356, True), ('chickb', 556, 402, False), ('chick', 562, 358, False)],
        fences=[('h', 30, 104, 242), ('h', 122, 190, 242), ('h', 30, 190, 376), ('v', 30, 242, 376), ('v', 190, 242, 376)],
        barn=(508, 300), forge=(36, 132), alchemy=(372, 132), shrine=(560, 150), arena=(405, 320, 62, 40),
        props=border(rng, 640, 448, skip=[(20, 140), (150, 290), (290, 336), (340, 480), (520, 600)]) + [
            ('dark', 8, 110), ('tree', 10, 160), ('pine', 12, 240), ('tree', 14, 300), ('dark', 10, 360),
            ('tree', 632, 110), ('pine', 628, 160), ('dark', 634, 250), ('tree', 630, 300),
            ('blossom', 246, 372), ('fruit', 476, 92), ('fruit', 610, 92), ('blossom', 504, 150),
            ('well', 254, 300), ('lamp', 292, 186), ('lamp', 332, 230), ('lamp', 480, 186), ('lamp', 140, 230),
            ('scarecrow', 200, 300), ('bush', 220, 250), ('berrybush', 272, 252), ('bush', 196, 420), ('bush', 246, 440),
            ('rock', 280, 336), ('bigrock', 176, 438), ('stump', 266, 400), ('bush', 360, 440), ('pine', 470, 440),
            ('bush', 336, 160), ('rock', 456, 176), ('flowers', 532, 176), ('flowers', 588, 176), ('flowers', 270, 160),
            ('bush', 140, 150), ('barrel', 485, 296), ('crate', 488, 316), ('hay', 600, 298),
            ('dark', 300, 470), ('tree', 640, 460), ('bush', 440, 160), ('bush', 20, 200), ('pine', 32, 440),
        ],
    )
    return L

def layout_b(rng):
    L = dict(
        paths=[
            dict(pts=[(-10, 212), (650, 212)]),
            dict(pts=[(330, 212), (330, 460)]),
            dict(pts=[(120, 160), (120, 212)], w=16),
            dict(pts=[(283, 150), (283, 212)], w=16),
            dict(pts=[(401, 150), (401, 212)], w=16),
            dict(pts=[(592, 168), (592, 212)], w=16),
            dict(pts=[(222, 212), (222, 246)], w=16),
            dict(pts=[(330, 300), (390, 300), (390, 330)], w=16),
            dict(pts=[(73, 404), (73, 430), (330, 430)], w=16),
        ],
        water=[('line', [(660, 30), (585, 110), (512, 190), (488, 260), (470, 340), (452, 460)], 34)],
        lilies=[(474, 300), (468, 380), (560, 128)],
        bridge=(480, 201, 52, 22),
        field=(150, 252),
        training=(14, 404),
        pen=(346, 330, 96, 96, None, 380),
        animals=[('cow', 376, 370, False), ('sheep', 420, 380, True), ('chick', 362, 398, False), ('chickb', 402, 404, True),
                 ('cowb', 412, 420, True), ('chick', 428, 352, True)],
        fences=[('h', 140, 213, 244), ('h', 231, 298, 244), ('h', 140, 298, 378), ('v', 140, 244, 378), ('v', 298, 244, 378)],
        barn=(352, 294), forge=(225, 150), alchemy=(370, 150), shrine=(592, 168), arena=(120, 106, 62, 40),
        props=border(rng, 640, 448, skip=[(40, 200), (215, 320), (340, 480), (560, 625)]) + [
            ('dark', 8, 200), ('tree', 10, 250), ('pine', 14, 300),
            ('blossom', 120, 300), ('fruit', 560, 300), ('fruit', 600, 340), ('fruit', 560, 390), ('fruit', 610, 420), ('blossom', 620, 250),
            ('lamp', 312, 196), ('lamp', 350, 240), ('lamp', 540, 196), ('lamp', 200, 196),
            ('scarecrow', 312, 270), ('well', 110, 252), ('bush', 140, 380), ('berrybush', 200, 400), ('bush', 260, 404),
            ('rock', 300, 380), ('bigrock', 520, 440), ('stump', 520, 360), ('flowers', 560, 190), ('flowers', 620, 190),
            ('bush', 212, 112), ('bush', 330, 112), ('rock', 470, 160), ('bush', 450, 120), ('hay', 450, 288), ('crate', 340, 290),
            ('tree', 300, 460), ('pine', 200, 456), ('dark', 640, 470), ('pine', 540, 460),
        ],
    )
    return L

if __name__ == '__main__':
    out = {}
    for name, fn, seed in [('a', layout_a, 11), ('b', layout_b, 23)]:
        rng = random.Random(seed)
        c, plots = scene(fn(rng), seed=seed)
        frame(c, 2).save(f'farm_{name}.png')
        out[name] = {'labels': c.labels, 'plots': plots}
    json.dump(out, open('meta.json', 'w'))
    print('ok')
