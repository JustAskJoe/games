"""Sprite toolkit for Rogue Shooter v2 heroes.

A sprite is built from layered *parts*. Each part has a material (a 5-tone color
ramp, dark -> light). After layering, every part is shaded with light from the
top-left: lit edges step up a tone, shadowed edges step down, a part that sits
behind another gets a cast shadow, and a colored outline is drawn around the
whole figure. Detail pixels (eyes, trim, glints) are placed last by hand.
"""
import numpy as np
from PIL import Image, ImageDraw

def hx(s):
    s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))

def ramp(*c): return [hx(x) for x in c]

R = {
    'steel':   ramp('#2a3044', '#4f5a74', '#8591a8', '#bcc5d4', '#eef2f8'),
    'dsteel':  ramp('#1e2232', '#363e54', '#5a6680', '#8591a8', '#bcc5d4'),
    'gold':    ramp('#5e3410', '#a0601a', '#dc9a2a', '#f6cd52', '#fff3b0'),
    'red':     ramp('#3e1018', '#741c28', '#b03434', '#dc5c48', '#f6946e'),
    'orange':  ramp('#4e1e0e', '#8e3e16', '#cc6a26', '#ee9a44', '#ffcf88'),
    'leather': ramp('#2a1610', '#4e2a1a', '#7c4a2a', '#a87244', '#d29e66'),
    'dleather':ramp('#1a1014', '#2e1e22', '#4a3232', '#6c4e46', '#94725e'),
    'skin':    ramp('#5a2c28', '#a05a48', '#dc9a76', '#f4c49e', '#ffe2c6'),
    'skin2':   ramp('#3c1e1a', '#703c2e', '#ac6a48', '#d09466', '#ecba8a'),
    'hbrown':  ramp('#24120e', '#4a2818', '#764224', '#a46638', '#cc9054'),
    'silver':  ramp('#34344c', '#626282', '#9a9cb8', '#cfd1e2', '#f6f6ff'),
    'ginger':  ramp('#461a0c', '#843212', '#c4561e', '#ec8838', '#ffbc6a'),
    'hblack':  ramp('#100e16', '#1e1c2a', '#323046', '#4e4c6a', '#727094'),
    'robe':    ramp('#1e1036', '#382060', '#563690', '#825cc4', '#b292ea'),
    'blue':    ramp('#0e1e36', '#1a385c', '#285a8a', '#4686ba', '#80bce4'),
    'teal':    ramp('#0c2626', '#16443e', '#22685a', '#3a947c', '#72c4a4'),
    'green':   ramp('#0c2014', '#183c28', '#28603e', '#428e56', '#7ac284'),
    'dgreen':  ramp('#0a1610', '#14281e', '#1e3c2c', '#2e5a40', '#4a8058'),
    'witch':   ramp('#260c2a', '#481850', '#702a74', '#9e469a', '#ca76c0'),
    'wpurple': ramp('#1a0c2a', '#2e1648', '#48246e', '#6a3c98', '#9666c4'),
    'cream':   ramp('#58483e', '#968672', '#d0c4ac', '#ece2cc', '#fffcf2'),
    'wood':    ramp('#361e0e', '#5e361a', '#8a582e', '#b4804e', '#d8aa78'),
    'orb':     ramp('#103668', '#2464aa', '#46a0e8', '#94d8ff', '#f0fcff'),
    'straw':   ramp('#56400e', '#8a681c', '#c09632', '#e4c25c', '#fff0a0'),
    'black':   ramp('#0c0a12', '#1a1824', '#2a2838', '#423f56', '#625e7c'),
    'chain':   ramp('#262a38', '#444c60', '#6c768c', '#98a2b4', '#c8d0dc'),
    'pink':    ramp('#4a1428', '#862a4a', '#c44a6e', '#ec7c96', '#ffb4c4'),
    'vial_g':  ramp('#0e3a1c', '#1e6a30', '#36a84a', '#72dc6e', '#c8ffb0'),
    'vial_p':  ramp('#3a0e3a', '#6a1e6a', '#a83aa8', '#dc6edc', '#ffc0ff'),
    'feather': ramp('#5a1414', '#962424', '#d03c30', '#f07050', '#ffffff'),
}
EYE = hx('#1a1020'); WHITE = hx('#ffffff'); BLUSH = hx('#f08c8c')
OUTLINE_DARK = 0.55


class Sprite:
    def __init__(self, w=32, h=44, oy=4):
        self.w, self.h, self.oy = w, h, oy   # oy shifts every y so hats and plumes have headroom
        self.mats = []
        self.layers = []                       # (material, mask, group, flat) in draw order
        self.dots_ = []                        # (x, y, rgb, group) hand-placed details
        self.group = 'body'                    # current pose group (legL, armR, ...)

    def g(self, name):
        """Following shapes and dots belong to this pose group."""
        self.group = name
        return self

    def _mid(self, m):
        if m not in self.mats: self.mats.append(m)
        return self.mats.index(m)

    def _apply(self, m, drawfn, flat=False):
        img = Image.new('L', (self.w, self.h), 0)
        drawfn(ImageDraw.Draw(img))
        self._mid(m)
        self.layers.append((m, np.array(img) > 0, self.group, flat))
        return len(self.layers) - 1

    # shapes (inclusive pixel coordinates)
    def _s(self, pts): return [(x, y + self.oy) for x, y in pts]
    def rect(self, m, x0, y0, x1, y1, **k): o = self.oy; return self._apply(m, lambda d: d.rectangle([x0, y0 + o, x1, y1 + o], fill=255), **k)
    def ell(self, m, cx, cy, rx, ry, **k): o = self.oy; return self._apply(m, lambda d: d.ellipse([cx - rx, cy - ry + o, cx + rx, cy + ry + o], fill=255), **k)
    def poly(self, m, pts, **k): return self._apply(m, lambda d: d.polygon(self._s(pts), fill=255), **k)
    def line(self, m, pts, w=1, **k): return self._apply(m, lambda d: d.line(self._s(pts), fill=255, width=w), **k)
    def px(self, m, pts, **k): return self._apply(m, lambda d: [d.point(p, fill=255) for p in self._s(pts)], **k)

    def dot(self, x, y, c):
        """Hand-placed detail pixel: c is '#hex', an rgb tuple, or (material, tone)."""
        if isinstance(c, str): c = hx(c)
        elif isinstance(c, tuple) and len(c) == 2 and isinstance(c[0], str): c = R[c[0]][c[1]]
        self.dots_.append((x, y + self.oy, c, self.group))

    def dots(self, pts, c):
        for p in pts: self.dot(p[0], p[1], c)

    @staticmethod
    def _shift(m, dx, dy):
        o = np.zeros_like(m); H, W = m.shape
        ys, yd = slice(max(dy, 0), H + min(dy, 0)), slice(max(-dy, 0), H + min(-dy, 0))
        xs, xd = slice(max(dx, 0), W + min(dx, 0)), slice(max(-dx, 0), W + min(-dx, 0))
        o[ys, xs] = m[yd, xd]; return o

    def compose(self, pose=None):
        """Place every layer, moved by its group's offset in `pose` ({group: (dx, dy)};
        'body' is the default for groups not listed)."""
        pose = pose or {}
        off = lambda g: pose.get(g, pose.get('body', (0, 0)))
        self.mat = np.full((self.h, self.w), -1, int); self.part = np.full((self.h, self.w), -1, int)
        self.flat = set()
        for pid, (m, mask, g, flat) in enumerate(self.layers):
            dx, dy = off(g)
            mm = self._shift(mask, dx, dy) if (dx or dy) else mask
            self.mat[mm] = self.mats.index(m); self.part[mm] = pid
            if flat: self.flat.add(pid)
        self.parts = [l[0] for l in self.layers]
        self.overrides = {}
        for x, y, c, g in self.dots_:
            dx, dy = off(g); self.overrides[(x + dx, y + dy)] = c

    def render(self, pose=None):
        self.compose(pose)
        h, w = self.h, self.w
        out = np.zeros((h, w, 4), np.uint8)
        part = self.part
        tone = np.full((h, w), 2, int)
        for pid in range(len(self.parts)):
            ys, xs = np.nonzero(part == pid)
            if not len(ys) or pid in self.flat: continue
            y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
            hh, ww = max(1, y1 - y0), max(1, x1 - x0)
            for y, x in zip(ys, xs):
                t = (y - y0) / hh; s = (x - x0) / ww
                L = 1 - 0.6 * t - 0.4 * s
                tn = 3 if L > 0.72 else (1 if L < 0.22 else 2)
                same = lambda xx, yy: 0 <= xx < w and 0 <= yy < h and part[yy, xx] == pid
                up, lf, dn, rt = same(x, y - 1), same(x - 1, y), same(x, y + 1), same(x + 1, y)
                if not up or not lf: tn = min(4, tn + 1)
                if (not up) and (not lf): tn = 4
                if not dn or not rt: tn = max(1, tn - 1) if (up and lf) else tn
                # cast shadow from a part in front (drawn later) above or to the left
                for xx, yy in ((x, y - 1), (x - 1, y)):
                    if 0 <= xx < w and 0 <= yy < h and part[yy, xx] > pid and self.mat[yy, xx] != self.mat[y, x]:
                        tn = max(0, min(tn, 1) - (1 if yy < y else 0))
                tone[y, x] = tn
        for y in range(h):
            for x in range(w):
                m = self.mat[y, x]
                if m < 0: continue
                pid = part[y, x]
                tn = 2 if pid in self.flat else tone[y, x]
                out[y, x, :3] = R[self.mats[m]][tn]; out[y, x, 3] = 255
        # colored outline (4-neighbour), darker on the bottom/right
        filled = self.mat >= 0
        for y in range(h):
            for x in range(w):
                if filled[y, x]: continue
                nb = [(x, y + 1, 0.9), (x + 1, y, 0.9), (x, y - 1, 0.7), (x - 1, y, 0.75)]
                hit = [(xx, yy, f) for xx, yy, f in nb if 0 <= xx < w and 0 <= yy < h and filled[yy, xx]]
                if not hit: continue
                xx, yy, f = hit[0]
                base = np.array(R[self.mats[self.mat[yy, xx]]][0], float)
                k = OUTLINE_DARK * (1.0 if f < 0.8 else 0.8)
                out[y, x, :3] = (base * k).astype(np.uint8); out[y, x, 3] = 255
        for (x, y), c in self.overrides.items():
            if 0 <= x < w and 0 <= y < h: out[y, x, :3] = c; out[y, x, 3] = 255
        return Image.fromarray(out, 'RGBA')
