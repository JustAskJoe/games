"""Shared helpers for the Rogue Shooter v2 enemies.

Enemies are drawn with the hero toolkit (`../heroes/spritekit.py`): the same material ramps,
top-left shading, colored outlines and pose groups. This file adds the enemy ramps, a few
shape helpers, post-processing (glow, fade, flash) and the registry the zone files fill in.

An enemy is registered with `enemy(key, ...)` and a draw function `fn(view, frame, var)`.
`frame` is a key such as 'm0'..'m3' (move loop) or 'a0'..'a2' (attack or special), and `var`
is the variant name (zone colors for the Slime). The function returns a Sprite, or
(Sprite, pose) or (Sprite, pose, post), where post(img) -> img runs after shading.
"""
import os, sys, math
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'heroes'))
from spritekit import Sprite, R, ramp, hx, EYE, WHITE, BLUSH   # noqa: E402

R.update({
    # Slime zone variants
    'sl_meadow':  ramp('#123a1c', '#2a7a34', '#4cb44a', '#8ee070', '#e0ffc0'),
    'sl_forest':  ramp('#142418', '#26462a', '#3e7036', '#6c9c48', '#acd27a'),
    'sl_caverns': ramp('#0e2a4a', '#1e5a8a', '#3a96c8', '#7cd0ee', '#e0f8ff'),
    'sl_volcanic':ramp('#4a140a', '#8e2e12', '#d0561e', '#f49a4a', '#ffe0a0'),
    'sl_shadow':  ramp('#1a0c2a', '#3a1c5a', '#62349a', '#9a64d0', '#dcb8ff'),
    'sl_void':    ramp('#04080c', '#0a1820', '#122c3a', '#1e4c5c', '#3c8a94'),
    # creatures and materials
    'crystal':  ramp('#0e3a4a', '#1e6a80', '#38a8c0', '#7ee0f0', '#e0fcff'),
    'stone':    ramp('#26262e', '#46464f', '#666672', '#9090a0', '#c0c0cc'),
    'basalt':   ramp('#141016', '#262028', '#3c3240', '#5a4c5c', '#7e6e7e'),
    'lava':     ramp('#5a1006', '#a02a0a', '#e05a10', '#ffa030', '#fff0a0'),
    'bone':     ramp('#4a3e30', '#8a7a62', '#c4b496', '#e4d8bc', '#fffaec'),
    'fur':      ramp('#1c1a22', '#36323e', '#58525f', '#847e8c', '#b8b2c0'),
    'furl':     ramp('#4a4450', '#7a7484', '#a8a2b0', '#d0ccd6', '#f4f2f8'),
    'beetle':   ramp('#0a1626', '#163044', '#20566a', '#36868a', '#74ccbe'),
    'dbeetle':  ramp('#080c16', '#121c2a', '#1e2c40', '#2e4258', '#4a6478'),
    'bronze':   ramp('#3a200c', '#6a4016', '#a86e26', '#d8a446', '#fde090'),
    'mothw':    ramp('#3a2a4a', '#6a5080', '#a084b8', '#cab4dc', '#f2e8fa'),
    'mothb':    ramp('#4a3a2a', '#86705a', '#c0a888', '#e2d0b2', '#fff6e2'),
    'shadow':   ramp('#08060c', '#16101e', '#241a32', '#34284a', '#4a3c68'),
    'nightm':   ramp('#12081e', '#24103a', '#3c1c5c', '#5c2e86', '#8a4cb8'),
    'void':     ramp('#05060a', '#0c1018', '#141c2a', '#1e2c44', '#34507a'),
    'neon':     ramp('#004a4a', '#00a0a0', '#20e0d0', '#80fff0', '#ffffff'),
    'neonp':    ramp('#3a0040', '#7a0090', '#c020d0', '#f070ff', '#ffe0ff'),
    'imp':      ramp('#3a0a0a', '#721616', '#b42a1e', '#e85a32', '#ff9a6a'),
    'demon':    ramp('#2a060c', '#5a0e18', '#901c22', '#c43a2e', '#ee7048'),
    'horn':     ramp('#2a2018', '#4e4232', '#7e6e56', '#ae9e80', '#e0d4b8'),
    'wisp':     ramp('#0a3a3a', '#178080', '#38c8b8', '#8af4e0', '#f0fffa'),
    'wispc':    ramp('#2a8a80', '#6ae0d0', '#b8fff0', '#e8fffa', '#ffffff'),
    'leaf':     ramp('#163218', '#2c6626', '#4a9638', '#80c656', '#c4ea8a'),
    'sprite':   ramp('#1e3a2a', '#3a6a4a', '#6aa878', '#a0d8a4', '#e0ffe0'),
    'wingc':    ramp('#4a6a7a', '#86b4c4', '#bce4ee', '#e2f8fc', '#ffffff'),
    'ghost':    ramp('#2a3448', '#56648a', '#8e9cc0', '#c4cee6', '#f0f4ff'),
    'bat':      ramp('#1a1020', '#33203e', '#523466', '#7a5290', '#a682b8'),
    'batwing':  ramp('#22101c', '#3e1c30', '#5e2c48', '#844266', '#ac6488'),
    'mush':     ramp('#3e0c10', '#7a1820', '#c03030', '#e8604a', '#ff9c7c'),
    'gill':     ramp('#4a3226', '#7a5a44', '#a88a6a', '#ccb090', '#ece0c8'),
    'ember':    ramp('#5a1a00', '#b04000', '#ff7a10', '#ffc040', '#fff8c0'),
})

_dot = Sprite.dot
def _rdot(self, x, y, c): _dot(self, int(round(x)), int(round(y)), c)
Sprite.dot = _rdot      # enemies place details at computed (float) spots

# ------------------------------------------------------------------ shapes

def blob(s, m, shapes, **k):
    """One part made of several shapes (so shading treats it as one surface).
    shapes: ('ell', cx, cy, rx, ry) ('rect', x0, y0, x1, y1) ('poly', pts) ('line', pts, w)
    and ('cut', x0, y0, x1, y1) which erases."""
    o = s.oy
    def fn(d):
        for sh in shapes:
            t = sh[0]
            if t == 'ell': _, cx, cy, rx, ry = sh; d.ellipse([cx - rx, cy - ry + o, cx + rx, cy + ry + o], fill=255)
            elif t == 'rect': _, x0, y0, x1, y1 = sh; d.rectangle([x0, y0 + o, x1, y1 + o], fill=255)
            elif t == 'poly': d.polygon([(x, y + o) for x, y in sh[1]], fill=255)
            elif t == 'line': d.line([(x, y + o) for x, y in sh[1]], fill=255, width=sh[2])
            elif t == 'cut': _, x0, y0, x1, y1 = sh; d.rectangle([x0, y0 + o, x1, y1 + o], fill=0)
    return s._apply(m, fn, **k)

def eye2(s, x, y, iris=EYE, glint=WHITE, h=2):
    """A 2-wide eye with a glint in the top-left."""
    for yy in range(h):
        s.dot(x, y + yy, iris); s.dot(x + 1, y + yy, iris)
    s.dot(x, y, glint)

def line_dots(s, pts, c, step=1.0):
    """Dots along a polyline (thin details like bones and cracks)."""
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) / step))
        for i in range(n + 1):
            s.dot(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n), c)

# ------------------------------------------------------------------ post-processing

def arr(im): return np.array(im).copy()
def pil(a): return Image.fromarray(a, 'RGBA')

def glow(color, steps=((1, 150), (2, 80), (3, 36)), only=None):
    """Hard-stepped halo around the sprite (or around pixels of the given colors),
    drawn only where the sprite is empty."""
    col = np.array(hx(color) if isinstance(color, str) else color, np.uint8)
    def f(im):
        a = arr(im); solid = a[..., 3] > 0
        src = solid
        if only is not None:
            src = np.zeros_like(solid)
            for c in only:
                c = np.array(hx(c) if isinstance(c, str) else c)
                src |= np.all(a[..., :3] == c, axis=-1) & solid
        H, W = solid.shape
        done = solid.copy()
        for r, al in steps:
            grown = np.zeros_like(src)
            ys, xs = np.nonzero(src)
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if dx * dx + dy * dy > r * r + r * 0.6: continue
                    y2, x2 = ys + dy, xs + dx
                    ok = (y2 >= 0) & (y2 < H) & (x2 >= 0) & (x2 < W)
                    grown[y2[ok], x2[ok]] = True
            ring = grown & ~done
            a[ring, :3] = col; a[ring, 3] = al
            done |= grown
        return pil(a)
    return f

def fade(k):
    def f(im):
        a = arr(im); a[..., 3] = (a[..., 3] * k).astype(np.uint8); return pil(a)
    return f

def flash(color='#ffffff', k=0.6):
    col = np.array(hx(color), float)
    def f(im):
        a = arr(im); m = a[..., 3] > 0
        a[m, :3] = (a[m, :3] * (1 - k) + col * k).astype(np.uint8); return pil(a)
    return f

def speckle(frac, seed=3):
    """Remove a scattered fraction of pixels (shimmer, phasing)."""
    def f(im):
        a = arr(im); rng = np.random.default_rng(seed)
        a[rng.random(a.shape[:2]) < frac, 3] = 0; return pil(a)
    return f

def chain(*fs):
    def f(im):
        for g in fs:
            if g: im = g(im)
        return im
    return f

# ------------------------------------------------------------------ effect layers (extras)

def canvas(w, h): return np.zeros((h, w, 4), np.uint8)

def put(a, x, y, c, al=255):
    x, y = int(round(x)), int(round(y))
    if isinstance(c, str): c = hx(c)
    if 0 <= x < a.shape[1] and 0 <= y < a.shape[0]:
        if al >= 255 or a[y, x, 3] == 0: a[y, x, :3] = c; a[y, x, 3] = max(a[y, x, 3], al)
        else:
            k = al / 255; a[y, x, :3] = (a[y, x, :3] * (1 - k) + np.array(c) * k).astype(np.uint8)
            a[y, x, 3] = max(a[y, x, 3], al)

def disc(a, cx, cy, r, c, al=255, sq=1.0):
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            if (x - cx) ** 2 + ((y - cy) / sq) ** 2 <= r * r + 0.3: put(a, x, y, c, al)

def ring(a, cx, cy, r, w, c, al=255, sq=1.0):
    for y in range(int(cy - r - 2), int(cy + r + 3)):
        for x in range(int(cx - r - 2), int(cx + r + 3)):
            d = math.hypot(x - cx, (y - cy) / sq)
            if r - w <= d <= r: put(a, x, y, c, al)

def sparkle(a, x, y, c):
    put(a, x, y, WHITE)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): put(a, x + dx, y + dy, c)

def outline(a, color=None, k=0.5):
    """Dark 1 px outline around an effect layer, tinted from the neighbour's own color."""
    solid = a[..., 3] > 120
    out = a.copy(); H, W = solid.shape
    for y in range(H):
        for x in range(W):
            if solid[y, x]: continue
            for dx, dy in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < W and 0 <= yy < H and solid[yy, xx]:
                    c = np.array(hx(color)) if color else a[yy, xx, :3] * k
                    out[y, x, :3] = c; out[y, x, 3] = 255; break
    return out

# ------------------------------------------------------------------ registry

ENEMIES = {}      # key -> spec
EXTRAS = {}       # key -> {name: (note, [frames as PIL images])}

def enemy(key, name, zone, size, views, fn, anims, note, behavior, variants=None, oy=0, timing=None):
    """anims: {'move': ['m0', ...], 'attack': ['a0', ...]} (the first is the loop the sheet plays).
    timing: ms per frame for each anim."""
    ENEMIES[key] = dict(key=key, name=name, zone=zone, size=size, views=views, fn=fn, anims=anims,
                        note=note, behavior=behavior, variants=variants or [None], oy=oy,
                        timing=timing or {})
    return fn

def extra(key, name, note, frames):
    EXTRAS.setdefault(key, {})[name] = (note, [pil(f) if isinstance(f, np.ndarray) else f for f in frames])

def render(key, view, frame, var=None):
    e = ENEMIES[key]
    res = e['fn'](view, frame, var)
    if not isinstance(res, tuple): res = (res,)
    s, pose, post = (list(res) + [None, None])[:3]
    im = s.render(pose)
    return post(im) if post else im

def new(key, oy=None):
    w, h = ENEMIES[key]['size'] if key in ENEMIES else key
    return Sprite(w, h, ENEMIES[key]['oy'] if oy is None and key in ENEMIES else (oy or 0))
