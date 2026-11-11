import random, json, sys
sys.path.insert(0, '.')
from farm import *

W, H = 880, 620

def border(rng):
    props = []
    for x in range(-6, W + 20, 28):
        if 870 < x: continue
        props.append((rng.choice(['tree', 'dark', 'pine', 'tree', 'dark']), x + rng.randint(-4, 4), 28 + rng.randint(-6, 6)))
    for x in range(10, W, 44):
        if any(a <= x <= b for a, b in [(50, 200), (225, 335), (405, 550), (780, 870)]): continue
        props.append((rng.choice(['tree', 'pine', 'dark']), x + rng.randint(-6, 6), 58 + rng.randint(-4, 4)))
    return props

def layout(rng):
    north = [(-5, -5), (885, -5), (885, 190), (840, 200), (800, 196), (760, 205), (720, 212), (690, 206), (650, 214), (610, 222), (560, 226),
             (520, 220), (480, 228), (440, 222), (400, 230), (350, 226), (300, 232), (250, 226), (200, 232), (150, 224), (100, 230), (50, 222), (-5, 228)]
    knoll = [(-5, 350), (60, 338), (150, 342), (230, 352), (250, 380), (245, 440), (200, 452), (120, 456), (40, 450), (-5, 444)]
    mesa = [(720, 440), (800, 430), (885, 440), (885, 540), (840, 548), (780, 546), (730, 540), (712, 500)]
    L = dict(
        W=W, H=H, flowers=300,
        paths=[
            dict(pts=[(-10, 300), (890, 300)], w=24),
            dict(pts=[(470, 300), (470, 640)], w=24),
            dict(pts=[(125, 198), (540, 198)], w=16),
            dict(pts=[(125, 160), (125, 198)], w=16),
            dict(pts=[(303, 168), (303, 198)], w=16),
            dict(pts=[(471, 170), (471, 198)], w=16),
            dict(pts=[(380, 198), (380, 300)], w=16),
            dict(pts=[(820, 170), (820, 300)], w=16),
            dict(pts=[(369, 300), (369, 372)], w=16),
            dict(pts=[(87, 420), (87, 444), (200, 444), (200, 482), (280, 482), (280, 300)], w=16),
            dict(pts=[(280, 482), (280, 566), (150, 566)], w=16),
            dict(pts=[(470, 412), (534, 412), (534, 438)], w=16),
        ],
        water=[('line', [(900, 20), (820, 80), (760, 150), (730, 205), (712, 270), (690, 340), (660, 430), (640, 520), (630, 640)], 34),
               ('ellipse', 800, 604, 66, 22)],
        lilies=[(668, 400), (650, 470), (770, 600), (820, 610), (790, 120)],
        cliffs=[(north, 26), (knoll, 18), (mesa, 20)],
        stairs=[(369, 224, 22, 34), (809, 194, 22, 32), (189, 448, 22, 26)],
        bridge=(676, 289, 54, 22),
        field=(300, 380),
        training=(24, 600),
        pen=(486, 438, 120, 110, None, 524),
        animals=[('cow', 516, 478, False), ('sheep', 572, 488, True), ('chick', 506, 516, False), ('chickb', 554, 526, True),
                 ('cowb', 586, 538, True), ('pig', 524, 544, False), ('chick', 592, 460, True)],
        fences=[('h', 290, 360, 372), ('h', 378, 448, 372), ('h', 290, 448, 504), ('v', 290, 372, 504), ('v', 448, 372, 504)],
        barn=(496, 400), forge=(245, 168), alchemy=(440, 170), shrine=(820, 170), arena=(125, 105, 62, 40),
        cabin=(50, 420),
        pickets=[(138, 234, 428)],
        props=border(rng) + [
            # north plateau, between the workshops
            ('pine', 22, 150), ('tree', 30, 205), ('pinesm', 210, 120), ('tree', 206, 178), ('bush', 225, 205),
            ('dark', 358, 128), ('bush', 400, 150), ('tallgrass', 362, 182), ('boulder', 340, 205),
            ('pine', 568, 110), ('tree', 612, 150), ('dark', 660, 100), ('berrybush', 590, 196), ('boulder', 652, 188), ('tallgrass', 628, 205),
            ('shroom', 700, 168), ('log', 548, 160), ('flowers', 520, 130), ('flowers', 690, 130),
            ('pinesm', 860, 120), ('tree', 870, 176), ('bush', 770, 190), ('flowers', 850, 196), ('flowers', 790, 196),
            # foot of the ridge
            ('bush', 40, 276), ('tallgrass', 100, 272), ('rock', 160, 270), ('bush', 230, 276), ('tallgrass', 320, 274),
            ('bush', 430, 274), ('rock', 520, 268), ('tallgrass', 570, 276), ('bush', 620, 272), ('tallgrass', 760, 268), ('rock', 860, 270),
            ('lamp', 262, 286), ('lamp', 500, 286), ('lamp', 650, 286), ('lamp', 846, 286), ('lamp', 396, 318),
            # cabin knoll
            ('firewood', 34, 424), ('fruit', 218, 386), ('flowerbed', 160, 414), ('flowerbed', 196, 414), ('bench', 158, 392),
            ('pinesm', 18, 372), ('flowers', 120, 440), ('blossom', 120, 372),
            # middle band
            ('tree', 252, 342), ('bush', 330, 342), ('well', 420, 352), ('tallgrass', 445, 340),
            ('blossom', 600, 352), ('tree', 646, 384), ('bush', 586, 400), ('rock', 620, 420),
            ('dark', 770, 352), ('tree', 850, 360), ('bush', 730, 328), ('tallgrass', 806, 330), ('fruit', 760, 410), ('flowers', 820, 400),
            # SE mesa
            ('fruit', 760, 470), ('fruit', 830, 466), ('bench', 800, 500), ('flowers', 770, 520), ('pinesm', 866, 512), ('boulder', 740, 520),
            # south
            ('scarecrow', 432, 532), ('bush', 330, 530), ('tallgrass', 380, 540), ('tree', 370, 600), ('berrybush', 416, 584),
            ('stump', 240, 520), ('tree', 230, 610), ('bush', 180, 520), ('log', 330, 580), ('shroom', 196, 600),
            ('pine', 540, 600), ('tallgrass', 580, 576), ('bush', 640, 600), ('rock', 700, 590), ('flowers', 890, 580),
            ('dark', 8, 500), ('pine', 12, 540), ('tallgrass', 160, 490), ('rock', 100, 486), ('flowers', 60, 480),
            ('hay', 610, 412), ('crate', 486, 392), ('barrel', 600, 392),
        ],
    )
    return L

if __name__ == '__main__':
    rng = random.Random(31)
    c, plots = scene(layout(rng), seed=31)
    frame(c, 2).save('farm_b2.png')
    json.dump({'labels': c.labels, 'plots': plots}, open('meta_b2.json', 'w'))
    print('ok', c.labels)
