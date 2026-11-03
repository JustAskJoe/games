"""The Riverside farm (Layout B, round 2) on day one: only the cabin stands. Every building site is an
empty lot or a ruin marked with stakes, rope and a blank build sign; 4 crop plots are tilled
and the other 26 are covered by rocks, stumps and weeds; the animal pen is empty."""
import random, json, sys, math, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from farm import *
from layout_b2 import layout, W, H

# ---------------------------------------------------------------- lot markers

def stake(c, x, y):
    c.r(x - 1, y - 8, 3, 9, 'out'); c.r(x, y - 7, 1, 7, 'w0'); c.p(x, y - 7, 'w2'); c.p(x + 1, y, 'g2')

def rope(c, a, b):
    (x0, y0), (x1, y1) = a, b
    n = max(1, int(max(abs(x1 - x0), abs(y1 - y0))))
    for i in range(n + 1):
        t = i / n
        sag = math.sin(t * math.pi) * (2 if abs(y1 - y0) < abs(x1 - x0) else 0)
        c.p(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - 6 + sag, 'cream1')

def lot_outline(c, corners, step=26):
    """Stakes every ~26 px around the lot, joined by sagging rope. Returns depth-sorted draw calls."""
    objs = []
    pts = corners + [corners[0]]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
        ss = [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) for i in range(n + 1)]
        for a, b in zip(ss, ss[1:]):
            objs.append((max(a[1], b[1]) - 0.5, (lambda a=a, b=b: rope(c, a, b))))
        for p in ss[:-1]:
            objs.append((p[1], (lambda p=p: stake(c, *p))))
    return objs

def build_sign(c, x, y):
    """A blank wooden board on a post with a small hammer painted on it: 'you can build here'."""
    c.shadow_e(x + 3, y + 1, 7, 2)
    c.r(x - 1, y - 14, 3, 15, 'out'); c.r(x, y - 13, 1, 13, 'w1')
    c.r(x - 9, y - 22, 19, 11, 'out'); c.r(x - 8, y - 21, 17, 9, 'w0')
    c.r(x - 8, y - 21, 17, 1, 'w2'); c.r(x - 8, y - 17, 17, 1, 'w1')
    # hammer
    c.r(x - 4, y - 20, 6, 3, 'st1'); c.r(x - 4, y - 20, 6, 1, 'st2'); c.r(x - 1, y - 17, 2, 5, 'trunk')
    c.p(x + 6, y - 20, 'white1'); c.p(x - 7, y - 13, 'w3')

def weeds(c, x, y, n=3):
    for i in range(n):
        dx = (i - n // 2) * 3
        c.p(x + dx, y, 'g2'); c.p(x + dx, y - 1, 'g5'); c.p(x + dx - 1, y - 2, 'g3'); c.p(x + dx + 1, y - 3, 'g4')

def rubble(c, x, y, k=5, rng=None):
    rng = rng or c.rng
    c.shadow_e(x + 2, y + 1, 8, 3)
    for _ in range(k):
        dx, dy = rng.randint(-7, 7), rng.randint(-5, 0)
        w, h = rng.randint(2, 4), rng.randint(2, 3)
        c.e(x + dx, y + dy, w + 1, h + 1, 'out'); c.e(x + dx, y + dy, w, h, rng.choice(['st0', 'st1', 'st1']))
        c.p(x + dx - 1, y + dy - 1, 'st2')

def broken_wall(c, x, y, w, tops, base='st0'):
    """A ruined stone wall: base line at y, jagged top from heights `tops` (sampled across w)."""
    n = len(tops)
    top = [(x + w * i / (n - 1), y - tops[i]) for i in range(n)]
    poly = [(x, y)] + top + [(x + w, y)]
    c.poly(poly, base, 'out')
    m = c.mask(lambda d: d.polygon([(int(a), int(b)) for a, b in poly], fill=255))
    a = np.array(c.img)
    for yy in range(int(y - max(tops)), int(y), 4):
        row = m[yy] if 0 <= yy < c.H else None
        if row is None: continue
        a[yy][row] = P['st1']
        off = 3 if (yy // 4) % 2 else 0
        for xx in range(int(x) + off, int(x + w), 7):
            for k in range(4):
                if 0 <= yy + k < c.H and m[yy + k, xx]: a[yy + k, xx] = P['st1']
    c._sync(a)
    for (ax, ay), (bx, by) in zip(top, top[1:]):
        c.line([(ax, ay + 1), (bx, by + 1)], 'st2')

# ---------------------------------------------------------------- lots

def lot_arena(c, cx, cy, rx=62, ry=40):
    objs = []
    m = c.mask(lambda d: d.ellipse([cx - rx + 6, cy - ry + 4, cx + rx - 6, cy + ry - 2], fill=255))
    a = np.array(c.img).astype(np.float32)
    noise = np.random.default_rng(3).random(m.shape)
    a[m & (noise < 0.55)] = P['d1']; a[m & (noise < 0.18)] = P['d3']; a[m & (noise > 0.93)] = P['d0']
    c._sync(a)
    for _ in range(60):
        t = c.rng.random() * math.tau; r = c.rng.random() ** 0.5
        x, y = cx + math.cos(t) * r * (rx - 10), cy + math.sin(t) * r * (ry - 8)
        c.p(x, y, 'g2'); c.p(x, y - 1, 'g5')
    for i in range(18):
        if i in (4, 5, 11, 15): continue
        t = math.radians(i * 20 + 6)
        x, y = cx + math.cos(t) * rx, cy + math.sin(t) * ry
        big = i % 3 == 0
        objs.append((y, (lambda x=x, y=y, big=big: rock(c, x, y, big))))
    objs.append((cy + 6, lambda: (c.line([(cx - 30, cy + 8), (cx - 6, cy + 2)], 'w1', 2), c.r(cx - 6, cy, 5, 4, 'red1'), c.p(cx - 5, cy + 1, 'red0'))))
    for x, y in ((cx - 40, cy - 6), (cx + 24, cy - 18), (cx + 34, cy + 16), (cx - 18, cy + 22)):
        objs.append((y, (lambda x=x, y=y: tallgrass(c, x, y))))
    objs.append((cy + ry + 14, lambda: build_sign(c, cx - 2, cy + ry + 14)))
    c.label('Arena lot', cx, cy - ry - 16)
    return objs

def lot_forge(c, x, y):
    objs = []
    w = 78
    # cracked floor
    c.r(x - 1, y - 27, w + 2, 28, 'out'); c.r(x, y - 26, w, 26, 'st1')
    for yy in range(y - 26, y, 5): c.r(x, yy, w, 1, 'st3')
    for k in range(40):
        c.p(x + c.rng.randint(1, w - 2), y - c.rng.randint(1, 25), c.rng.choice(['st0', 'st3', 'g2', 'g5']))
    for _ in range(6): weeds(c, x + c.rng.randint(6, w - 6), y - c.rng.randint(3, 22), 2)
    objs.append((y - 26, lambda: broken_wall(c, x, y - 26, w, [10, 14, 8, 16, 22, 18, 9, 5, 12, 7])))
    objs.append((y - 25, lambda: (broken_wall(c, x + 54, y - 26, 16, [26, 30, 24, 28]), c.r(x + 57, y - 56, 10, 2, 'st3'))))
    objs.append((y - 1, lambda: broken_wall(c, x - 3, y, 5, [20, 14, 8])))
    objs.append((y - 1, lambda: broken_wall(c, x + w - 2, y, 5, [6, 12, 16])))
    # cold furnace
    def furnace():
        fx, fw, fh = x + 10, 26, 18
        c.r(fx - 3, y - fh - 3, fw + 6, fh + 3, 'st3'); c.e(fx + fw / 2, y - fh, fw / 2 + 3, 5, 'st3')
        c.r(fx, y - fh, fw, fh, '#262630'); c.e(fx + fw / 2, y - fh, fw / 2, 3, '#262630')
        c.r(fx + 4, y - 6, fw - 8, 3, '#3a3442'); c.p(fx + 8, y - 5, 'st1'); c.p(fx + 16, y - 4, 'st1')
        c.line([(fx + fw + 2, y - fh - 2), (fx + fw - 4, y - fh + 6)], 'out')
    objs.append((y, furnace))
    objs.append((y + 2, lambda: broken_wall(c, x + 36, y + 2, 14, [3, 6, 4])))
    objs.append((y + 8, lambda: rubble(c, x + 44, y + 8)))
    objs.append((y + 12, lambda: rubble(c, x + 70, y + 12)))
    def anvil_down():
        ax, ay = x + 94, y + 14
        c.shadow_e(ax + 3, ay + 1, 10, 3)
        c.r(ax - 9, ay - 6, 16, 6, 'out'); c.r(ax - 8, ay - 5, 14, 4, '#7a6a62'); c.r(ax - 8, ay - 5, 14, 1, '#9a8a80')
        c.r(ax + 6, ay - 4, 4, 3, 'out'); c.r(ax + 6, ay - 3, 3, 1, '#7a6a62'); c.p(ax - 4, ay - 3, '#a0603a'); c.p(ax + 1, ay - 2, '#a0603a')
        c.r(ax - 14, ay - 3, 5, 3, 'trunk1')
    objs.append((y + 14, anvil_down))
    objs.append((y + 20, lambda: tallgrass(c, x - 6, y + 20)))
    objs += lot_outline(c, [(x - 10, y - 32), (x + w + 22, y - 32), (x + w + 22, y + 22), (x - 10, y + 22)])
    objs.append((y + 30, lambda: build_sign(c, x + 58, y + 30)))
    c.label('Forge lot', x + w / 2, y - 64)
    return objs

def lot_alchemy(c, x, y):
    objs = []
    # timber frame foundation
    fx0, fx1, fy0 = x, x + 62, y - 28
    c.r(fx0 - 1, fy0 - 1, fx1 - fx0 + 2, y - fy0 + 2, 'out'); c.r(fx0, fy0, fx1 - fx0, y - fy0, 'd1')
    for k in range(50): c.p(c.rng.randint(fx0 + 1, fx1 - 1), c.rng.randint(fy0 + 1, y - 1), c.rng.choice(['d3', 'g2', 'g5', 'd0']))
    for _ in range(5): weeds(c, c.rng.randint(fx0 + 4, fx1 - 4), c.rng.randint(fy0 + 4, y - 2), 2)
    def beams():
        for bx, by, bw, bh in ((fx0, fy0, fx1 - fx0, 3), (fx0, fy0, 3, y - fy0), (fx1 - 3, fy0, 3, y - fy0 - 10), (fx0, y - 3, 22, 3)):
            c.r(bx - 1, by - 1, bw + 2, bh + 2, 'out'); c.r(bx, by, bw, bh, 'w1'); c.r(bx, by, bw, 1, 'w0')
        for (px, ph) in ((fx0, 22), (fx0 + 30, 14), (fx1 - 3, 26)):
            c.r(px - 1, fy0 - ph - 1, 5, ph + 2, 'out'); c.r(px, fy0 - ph, 3, ph, 'w1'); c.r(px, fy0 - ph, 1, ph, 'w0')
            c.p(px + 1, fy0 - ph, 'w3'); c.p(px + 2, fy0 - ph + 1, 'w3')
    objs.append((fy0, beams))
    objs.append((y + 4, lambda: (c.shadow_e(x + 46, y + 5, 14, 2), c.line([(x + 34, y + 2), (x + 58, y - 6)], 'out', 4), c.line([(x + 34, y + 2), (x + 58, y - 6)], 'w1', 2))))
    # tower stump
    def tower():
        tx, tw, th = x - 20, 24, 28
        c.shadow_e(tx + tw / 2 + 4, y + 1, 14, 4)
        top = [(tx + tw * i / 6, y - th + [0, 7, 3, 12, 5, 14, 8][i]) for i in range(7)]
        poly = [(tx, y)] + top + [(tx + tw, y)]
        c.poly(poly, 'st0', 'out')
        m = c.mask(lambda d: d.polygon([(int(a), int(b)) for a, b in poly], fill=255))
        a = np.array(c.img)
        for k in range(tw):
            col = 'st2' if k < tw * 0.25 else 'st0' if k < tw * 0.7 else 'st1'
            a[:, tx + k][m[:, tx + k]] = P[col]
        for yy in range(y - th + 6, y, 6): a[yy][m[yy]] = P['st1']
        c._sync(a)
        c.e(tx + tw / 2, y - th + 4, tw / 2 - 3, 3, '#2a2a3a')
        for dx, dy in ((2, -4), (3, -7), (1, -10), (5, -12), (2, -15), (4, -18), (20, -3), (21, -6), (19, -9)): c.p(tx + dx, y + dy, 'leaf2'); c.p(tx + dx + 1, y + dy - 1, 'leaf0')
    objs.append((y, tower))
    def cauldron_down():
        cx, cy = x + 78, y + 14
        c.shadow_e(cx + 3, cy + 1, 10, 3)
        c.e(cx, cy - 5, 9, 6, 'out'); c.e(cx, cy - 5, 8, 5, '#3a3442'); c.e(cx - 3, cy - 7, 3, 2, '#5a5468')
        c.e(cx + 8, cy - 4, 3, 4, 'out'); c.e(cx + 8, cy - 4, 2, 3, '#1a1622')
        c.e(cx + 16, cy - 1, 6, 2, '#6a5a3a'); c.p(cx + 14, cy - 1, '#4f9a6a')
        c.line([(cx - 4, cy - 10), (cx + 2, cy - 4)], 'out')
    objs.append((y + 14, cauldron_down))
    for px, py, cc in ((x + 12, y + 8, 'teal'), (x + 16, y + 10, 'pu2'), (x + 60, y + 6, 'teal1')): objs.append((py, (lambda px=px, py=py, cc=cc: (c.p(px, py, cc), c.p(px + 1, py, 'white1')))))
    objs += lot_outline(c, [(x - 28, y - 34), (x + 72, y - 34), (x + 72, y + 22), (x - 28, y + 22)])
    objs.append((y + 30, lambda: build_sign(c, x + 31, y + 30)))
    c.label('Alchemy Lab lot', x + 20, y - 52)
    return objs

def lot_shrine(c, cx, y):
    objs = []
    pw, pd = 52, 26
    c.shadow_e(cx + 5, y + 1, pw / 2 + 6, 5)
    c.r(cx - pw / 2 - 1, y - 12 - pd - 1, pw + 2, pd + 14, 'out')
    c.r(cx - pw / 2, y - 12 - pd, pw, pd, 'st0')
    for yy in range(y - 12 - pd + 6, y - 12, 6): c.r(cx - pw / 2, yy, pw, 1, 'st1')
    for xx in range(int(cx - pw / 2) + 8, int(cx + pw / 2), 8): c.r(xx, y - 12 - pd, 1, pd, 'st1')
    wall_stone(c, cx - pw / 2, y - 12, pw, 12, 'st1', 'st3', 'st0')
    for k in range(3):
        c.r(cx - 9 + k, y - 12 + k * 4, 18 - 2 * k, 4, 'st0' if k % 2 == 0 else 'st1'); c.r(cx - 9 + k, y - 9 + k * 4, 18 - 2 * k, 1, 'st3')
    # cracks and moss
    for pts in (((cx - 20, y - 36), (cx - 14, y - 30), (cx - 16, y - 22)), ((cx + 8, y - 38), (cx + 12, y - 30), (cx + 20, y - 27)), ((cx - 4, y - 8), (cx + 1, y - 2))):
        c.line(pts, 'st3')
    for mx, my, r in ((cx - 22, y - 16, 5), (cx + 18, y - 34, 4), (cx + 22, y - 10, 4), (cx - 10, y - 38, 3)):
        c.e(mx, my, r, r - 2, 'leaf0'); c.e(mx - 1, my - 1, r - 2, r - 3, 'leaf2')
    sy = y - 18
    def pillars():
        for px, ph, broken in ((cx - 15, 26, False), (cx + 11, 12, True)):
            c.r(px - 1, sy - ph - 1, 6, ph + 2, 'out'); c.r(px, sy - ph, 4, ph, 'white'); c.r(px + 3, sy - ph, 1, ph, 'white1')
            if broken: c.p(px + 1, sy - ph, 'out'); c.p(px + 3, sy - ph + 1, 'out'); c.r(px, sy - ph + 1, 1, 1, 'white1')
            else: c.r(px - 2, sy - ph - 3, 8, 3, 'out'); c.r(px - 1, sy - ph - 2, 6, 1, 'white1')
        # the fallen piece of the right pillar
        c.shadow_e(cx + 22, y - 18, 7, 2)
        c.r(cx + 14, y - 22, 13, 6, 'out'); c.r(cx + 15, y - 21, 11, 4, 'white'); c.r(cx + 15, y - 18, 11, 1, 'white1')
        # empty pedestal
        c.r(cx - 6, sy - 9, 12, 9, 'out'); c.r(cx - 5, sy - 8, 10, 8, 'st0'); c.r(cx - 5, sy - 8, 10, 1, 'st2'); c.e(cx, sy - 9, 3, 1, 'st3')
        # vines up the standing pillar
        for dy in range(4, 24, 3): c.p(cx - 15 + (dy // 3) % 3, sy - dy, 'leaf2'); c.p(cx - 14 + (dy // 3) % 2, sy - dy - 1, 'leaf0')
    objs.append((sy, pillars))
    def brazier_down(bx, by):
        c.shadow_e(bx + 2, by + 1, 6, 2)
        c.r(bx - 5, by - 4, 10, 4, 'out'); c.r(bx - 4, by - 3, 8, 2, 'st1'); c.r(bx + 4, by - 3, 3, 3, 'st3')
        c.p(bx - 2, by - 3, '#3a3030'); c.p(bx + 1, by - 2, '#3a3030')
    objs.append((y - 12, lambda: brazier_down(cx - pw / 2 + 5, y - 13)))
    objs.append((y + 6, lambda: brazier_down(cx + pw / 2 + 4, y + 6)))
    objs += lot_outline(c, [(cx - 34, y - 48), (cx + 34, y - 48), (cx + 34, y + 12), (cx - 34, y + 12)], 22)
    objs.append((y + 22, lambda: build_sign(c, cx + 20, y + 22)))
    c.label('Shrine ruins', cx, y - 66)
    return objs

def lot_barn(c, x, y):
    objs = []
    w = 76
    c.r(x - 1, y - 30, w + 2, 31, 'out'); c.r(x, y - 29, w, 29, 'd1')
    for k in range(60): c.p(c.rng.randint(x + 1, x + w - 1), c.rng.randint(y - 28, y - 1), c.rng.choice(['d3', 'hay1', 'g2', 'd0']))
    def frame_():
        # the one gable frame still standing, leaning
        c.line([(x + 14, y - 26), (x + 34, y - 62), (x + 58, y - 30)], 'out', 5)
        c.line([(x + 14, y - 26), (x + 34, y - 62), (x + 58, y - 30)], 'w1', 3)
        c.line([(x + 22, y - 40), (x + 44, y - 46)], 'out', 4); c.line([(x + 22, y - 40), (x + 44, y - 46)], 'w0', 2)
        c.line([(x + 15, y - 27), (x + 34, y - 61)], 'white1')
        c.r(x + 32, y - 64, 4, 3, 'white')
    objs.append((y - 27, frame_))
    def planks():
        rng = random.Random(9)
        for i in range(16):
            px, py = x + 6 + rng.randint(0, w - 18), y - 4 - rng.randint(0, 20)
            L = rng.randint(14, 26); ang = rng.uniform(-0.5, 0.5)
            dx, dy = math.cos(ang) * L, math.sin(ang) * L
            col = rng.choice(['red0', 'red1', 'red0', 'white1', 'w1'])
            c.line([(px, py), (px + dx, py + dy)], 'out', 5); c.line([(px, py), (px + dx, py + dy)], col, 3)
            c.line([(px, py - 1), (px + dx, py + dy - 1)], 'red2' if col == 'red0' else 'white' if col == 'white1' else 'w0')
        c.e(x + 60, y - 6, 8, 4, 'out'); c.e(x + 60, y - 6, 7, 3, 'hay1'); c.p(x + 57, y - 8, 'hay')
    objs.append((y - 2, planks))
    objs.append((y + 2, lambda: weeds(c, x + 4, y + 2, 4)))
    objs.append((y + 3, lambda: tallgrass(c, x + 70, y + 3)))
    objs += lot_outline(c, [(x - 6, y - 34), (x + w + 6, y - 34), (x + w + 6, y + 8), (x - 6, y + 8)])
    objs.append((y + 16, lambda: build_sign(c, x + w + 14, y + 16)))
    c.label('Old barn', x + w / 2, y - 76)
    return objs

def lot_training(c, x, y, w=118, h=74):
    objs = []
    yt = y - h
    m = c.mask(lambda d: d.rounded_rectangle([x, yt, x + w, y], radius=10, fill=255))
    a = np.array(c.img).astype(np.float32)
    noise = np.random.default_rng(7).random(m.shape)
    sand = m & (noise < 0.62)
    a[sand] = P['sand1']; a[sand & (noise < 0.25)] = P['sand']
    c._sync(a)
    for _ in range(30): tallgrass(c, x + c.rng.randint(8, w - 8), yt + c.rng.randint(8, h - 4))
    def dummy_down():
        dx, dy = x + 70, y - 30
        c.shadow_e(dx + 2, dy + 2, 14, 3)
        c.r(dx - 14, dy - 2, 22, 3, 'w1'); c.e(dx + 10, dy - 1, 7, 5, 'out'); c.e(dx + 10, dy - 1, 6, 4, 'hay1'); c.r(dx + 8, dy - 5, 2, 9, 'red1')
        c.e(dx + 19, dy, 4, 3, 'out'); c.e(dx + 19, dy, 3, 2, '#a88a62')
    objs.append((y - 30, dummy_down))
    for px, ph in ((x + 20, 8), (x + 34, 4), (x + 48, 9), (x + 100, 6)):
        objs.append((yt + 6, (lambda px=px, ph=ph: (c.r(px - 1, yt + 6 - ph - 1, 4, ph + 2, 'out'), c.r(px, yt + 6 - ph, 2, ph, 'w1'), c.p(px, yt + 6 - ph, 'w0')))))
    objs.append((yt + 6, lambda: (c.line([(x + 20, yt + 2), (x + 34, yt + 4)], 'w1', 2), c.line([(x + 50, yt + 4), (x + 62, yt + 6)], 'w1', 2))))
    objs.append((y - 18, lambda: rubble(c, x + 30, y - 18)))
    objs += lot_outline(c, [(x - 4, yt - 4), (x + w + 4, yt - 4), (x + w + 4, y + 4), (x - 4, y + 4)], 30)
    objs.append((y + 12, lambda: build_sign(c, x + w + 12, y + 12)))
    c.label('Training Grounds lot', x + w / 2, yt - 14)
    return objs

def empty_pen(c, x, y, w, h, gate_x=None, gate_w=20, top_gate=None):
    for _ in range(5):
        px, py = x + c.rng.randint(12, w - 12), y + c.rng.randint(12, h - 12)
        c.e(px, py, c.rng.randint(4, 8), c.rng.randint(2, 3), 'd1')
    objs = []
    objs.append((y, lambda: (fence_h(c, x, top_gate, y), fence_h(c, top_gate + gate_w, x + w - 30, y))))
    objs.append((y + 4, lambda: (c.line([(x + w - 26, y - 4), (x + w - 12, y + 2)], 'w1', 2), c.p(x + w - 12, y + 2, 'out'))))
    objs.append((y + h, lambda: (fence_h(c, x, x + 50, y + h), fence_h(c, x + 66, x + w, y + h))))
    for yy in range(int(y), int(y + h), 10):
        if not (y + 40 <= yy <= y + 60): objs.append((yy + 6, (lambda yy=yy: fence_v(c, x, yy + 6, min(yy + 16, y + h), 10))))
        objs.append((yy + 6, (lambda yy=yy: fence_v(c, x + w, yy + 6, min(yy + 16, y + h), 10))))
    def trough_tipped():
        tx, ty = x + 30, y + 30
        c.shadow_e(tx + 3, ty + 1, 12, 3)
        c.r(tx - 11, ty - 6, 22, 7, 'out'); c.r(tx - 10, ty - 5, 20, 5, 'w0'); c.r(tx - 10, ty - 5, 20, 1, 'w2'); c.r(tx - 10, ty - 1, 20, 1, 'w1')
    objs.append((y + 30, trough_tipped))
    for px, py in ((x + 70, y + 40), (x + 40, y + 78), (x + 96, y + 84), (x + 20, y + 60)):
        objs.append((py, (lambda px=px, py=py: tallgrass(c, px, py))))
    objs.append((y + 70, lambda: weeds(c, x + 80, y + 70, 3)))
    c.label('Empty pen', x + w / 2, y + h + 14)
    return objs

# ---------------------------------------------------------------- crop field: 4 open, 26 covered

COVERS = ['rock', 'boulder', 'stump', 'weeds', 'rock', 'twigs', 'boulder', 'weeds', 'rocks']

def covered_plot(c, x, y, sz, kind):
    m = c.mask(lambda d: d.rounded_rectangle([x, y, x + sz - 1, y + sz - 1], radius=3, fill=255))
    a = np.array(c.img).astype(np.float32)
    noise = np.random.default_rng(int(x * 7 + y)).random(m.shape)
    a[m] = P['g5']; a[m & (noise < 0.35)] = P['g1']; a[m & (noise > 0.9)] = P['d1']
    a[m & ~erode(m)] = P['g2']
    c._sync(a)
    cx, cy = x + sz / 2, y + sz - 3
    if kind == 'rock': return lambda: rock(c, cx, cy)
    if kind == 'boulder': return lambda: rock(c, cx, cy, True)
    if kind == 'stump': return lambda: stump(c, cx, cy)
    if kind == 'rocks': return lambda: (rock(c, cx - 4, cy - 2), rock(c, cx + 4, cy))
    if kind == 'twigs':
        return lambda: (c.shadow_e(cx + 2, cy + 1, 8, 2), c.line([(cx - 7, cy - 1), (cx + 6, cy - 4)], 'out', 3), c.line([(cx - 7, cy - 1), (cx + 6, cy - 4)], 'trunk', 1),
                        c.line([(cx - 4, cy - 6), (cx + 5, cy + 1)], 'out', 3), c.line([(cx - 4, cy - 6), (cx + 5, cy + 1)], 'trunk1', 1))
    return lambda: (tallgrass(c, cx - 3, cy), tallgrass(c, cx + 3, cy - 2), weeds(c, cx, cy - 5, 2))

def field_start(c, x0, y0, plots_out, open_=(0, 1, 6, 7)):
    sz, gap = 18, 6
    objs = []
    rng = random.Random(4)
    for row in range(5):
        for colm in range(6):
            i = row * 6 + colm
            x, y = x0 + colm * (sz + gap), y0 + row * (sz + gap)
            unlocked = i in open_
            plots_out.append({'n': i + 1, 'x': (x + sz / 2) / c.W, 'y': (y + sz / 2) / c.H, 'w': sz / c.W, 'h': sz / c.H, 'open': unlocked})
            if unlocked:
                plot_bed(c, x, y, sz)
            else:
                objs.append((y + sz - 3, covered_plot(c, x, y, sz, COVERS[(i * 5 + rng.randint(0, 3)) % len(COVERS)])))
    # a hoe and a watering can by the open plots
    objs.append((y0 + 40, lambda: (c.line([(x0 - 9, y0 + 40), (x0 - 2, y0 + 20)], 'out', 3), c.line([(x0 - 9, y0 + 40), (x0 - 2, y0 + 20)], 'trunk', 1),
                                   c.r(x0 - 4, y0 + 18, 5, 3, 'out'), c.r(x0 - 3, y0 + 19, 3, 1, 'st0'))))
    objs.append((y0 + 52, lambda: (c.shadow_e(x0 + 54, y0 + 53, 6, 2), c.r(x0 + 48, y0 + 45, 10, 8, 'out'), c.r(x0 + 49, y0 + 46, 8, 6, 'blue'), c.r(x0 + 49, y0 + 46, 8, 1, 'wa2'),
                                   c.line([(x0 + 57, y0 + 48), (x0 + 61, y0 + 44)], 'blue1', 2))))
    return objs

# ---------------------------------------------------------------- scene

GONE = {'scarecrow', 'hay', 'crate', 'barrel'}

def scene_start(L, seed=31):
    c = Cv(L['W'], L['H'], seed)
    rng = c.rng
    grass(c, flowers=L.get('flowers', 120))
    pm = c.mask(lambda d: [(d.line(seg['pts'], fill=255, width=seg.get('w', 22)),
                            [d.ellipse([px - seg.get('w', 22) / 2, py - seg.get('w', 22) / 2, px + seg.get('w', 22) / 2, py + seg.get('w', 22) / 2], fill=255) for px, py in seg['pts']])
                           for seg in L['paths']])
    paint_path(c, pm)
    def wdraw(d):
        for kind, *args in L['water']:
            if kind == 'ellipse':
                cx_, cy_, rx_, ry_ = args; d.ellipse([cx_ - rx_, cy_ - ry_, cx_ + rx_, cy_ + ry_], fill=255)
            if kind == 'line':
                pts, w_ = args; d.line(pts, fill=255, width=w_)
                for px, py in pts: d.ellipse([px - w_ / 2, py - w_ / 2, px + w_ / 2, py + w_ / 2], fill=255)
    wm = c.mask(wdraw); paint_water(c, wm)
    for lx, ly in L.get('lilies', []): lily(c, lx, ly)
    paint_cliffs(c, L['cliffs'], wm)
    for st in L.get('stairs', []): stairs(c, *st)
    objs = []
    plots = []
    fx, fy = L['field']
    objs += field_start(c, fx, fy, plots)
    c.label('Crop field: 4 open, 26 to clear', fx + 72, fy - 16)
    objs += lot_training(c, *L['training'])
    px_, py_, pw_, ph_, gx_, tg_ = L['pen']
    objs += empty_pen(c, px_, py_, pw_, ph_, gx_, 20, tg_)
    objs += lot_barn(c, *L['barn'])
    objs += lot_forge(c, *L['forge'])
    objs += lot_alchemy(c, *L['alchemy'])
    objs += lot_shrine(c, *L['shrine'])
    objs += lot_arena(c, *L['arena'])
    cx_, cy_ = L['cabin']; objs.append((cy_, lambda: b_cabin(c, cx_, cy_)))
    for seg in L.get('pickets', []): objs.append((seg[2], (lambda seg=seg: picket_h(c, *seg))))
    props = [p for p in L['props'] if p[0] not in GONE]
    # overgrowth on the side paths that lead to the empty lots
    props += [('tallgrass', 303, 186), ('tallgrass', 471, 184), ('tallgrass', 300, 196), ('tallgrass', 130, 186), ('tallgrass', 820, 240),
              ('tallgrass', 826, 262), ('tallgrass', 534, 428), ('tallgrass', 528, 420), ('tallgrass', 90, 560), ('tallgrass', 210, 566),
              ('rock', 248, 470), ('stump', 600, 420), ('tallgrass', 640, 430), ('rock', 430, 200), ('tallgrass', 200, 198), ('bush', 650, 440)]
    FN = {'tree': lambda x, y: tree(c, x, y), 'blossom': lambda x, y: tree(c, x, y, 'blossom'), 'fruit': lambda x, y: tree(c, x, y, 'fruit'),
          'dark': lambda x, y: tree(c, x, y, 'dark'), 'pine': lambda x, y: pine(c, x, y), 'bush': lambda x, y: bush(c, x, y),
          'berrybush': lambda x, y: bush(c, x, y, True), 'rock': lambda x, y: rock(c, x, y), 'stump': lambda x, y: stump(c, x, y),
          'lamp': lambda x, y: lamp(c, x, y), 'well': lambda x, y: well(c, x, y), 'flowers': lambda x, y: flowers_patch(c, x, y),
          'tallgrass': lambda x, y: tallgrass(c, x, y), 'log': lambda x, y: log(c, x, y), 'shroom': lambda x, y: mushrooms(c, x, y),
          'firewood': lambda x, y: firewood(c, x, y), 'bench': lambda x, y: bench(c, x, y), 'flowerbed': lambda x, y: flowerbed(c, x, y),
          'boulder': lambda x, y: rock(c, x, y, True), 'pinesm': lambda x, y: pine(c, x, y, 0.75)}
    for kind, x, y in props: objs.append((y, (lambda kind=kind, x=x, y=y: FN[kind](x, y))))
    for seg in L.get('fences', []):
        kind, *args = seg
        if kind == 'h': objs.append((args[2], lambda args=args: fence_h(c, *args)))
        else:
            x, y0, y1 = args
            for yy in range(int(y0), int(y1), 10):
                objs.append((yy + 6, (lambda yy=yy, x=x, y1=y1: fence_v(c, x, yy + 6, min(yy + 16, y1), 10))))
    bx0, by0, bw0, bh0 = L['bridge']
    c.shadow_e(bx0 + bw0 / 2 + 3, by0 + bh0 + 1, bw0 / 2 + 2, 3)
    c.r(bx0 - 1, by0 - 1, bw0 + 2, bh0 + 2, 'out'); c.r(bx0, by0, bw0, bh0, 'w0')
    for k in range(bx0 + 4, bx0 + bw0, 5): c.r(k, by0, 1, bh0, 'w1')
    c.r(bx0, by0, bw0, 2, 'w2'); c.r(bx0, by0 + bh0 - 2, bw0, 2, 'w3')
    objs.append((by0 + 1, lambda: fence_h(c, bx0, bx0 + bw0, by0 + 1, 8)))
    objs.append((by0 + bh0 + 2, lambda: fence_h(c, bx0, bx0 + bw0, by0 + bh0 + 2, 8)))
    objs.sort(key=lambda o: o[0])
    for _, fn in objs: fn()
    return c, plots

if __name__ == '__main__':
    rng = random.Random(31)
    c, plots = scene_start(layout(rng), seed=31)
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    c.img.save(os.path.join(out, 'farm_start.png'))
    json.dump({'labels': c.labels, 'plots': plots}, open(os.path.join(out, 'meta_start.json'), 'w'))
    print('ok', len(c.labels))
