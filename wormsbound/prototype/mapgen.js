/* Wormsbound map generator (mapgen.js).
   © 2026 justaskjoe. All rights reserved.

   Pure and seeded: no DOM, no engine imports. generate(settings) returns a cell grid plus everything a game needs
   to play it and draw it. Runs in the browser as window.MapGen and in node (require). Wormsbound's engine calls it
   from newGame; another side-on game can use it as it is (any grid size, its own spawn rule).

   Setting up a map works like a strategy game's map screen: pick a preset (a theme map or a mode such as
   Tournament), then change any setting (SETTINGS: landform, height, caves, water, hazards, wind, mirror...).
   Every combination packs into a short share code ("frost-peak-1222120211020-k3j9a") that rebuilds the same
   map anywhere. Seed 0 in a code means "new layout every match, same settings".

   How a map is made, in order (every step reads the settings):
     1. landform: the big shape (hills, islands, mesas, caverns, canyon, peak, bowl, city, towers, bridges)
     2. caves and tunnels, then overhangs
     3. platforms (ledges or girders), then theme props (trees, cars, mushrooms...), all solid and breakable
     4. clean-up (crumbs too small to stand on go), hard rock deep inside the ground, mirror if asked
     5. hazards (the theme's barrels or old duds), placed on the final ground
     6. checks: enough land, room to spawn across the whole map, both halves fair. A map that fails is rebuilt
        from the next seed in a fixed order (up to 12 tries), so the same settings always give the same map.

   Cells: 0 air, 1 ground, 2 hard rock (blasts can't break it), 3 prop, 4 prop accent. Anything non-zero is solid.
   y points down; row `water` and below is liquid. */
(function (root) {
  'use strict';

  const AIR = 0, DIRT = 1, ROCK = 2, PROP = 3, ACCENT = 4;
  const SIZES = { small: { w: 128, h: 72, name: 'Small' }, medium: { w: 160, h: 90, name: 'Medium' }, large: { w: 200, h: 112, name: 'Large' }, huge: { w: 240, h: 135, name: 'Huge' }, giant: { w: 320, h: 180, name: 'Giant' } };
  // the size a match needs: more units, more room (a game with a camera; 1v1 still fits one screen)
  const sizeFor = (units) => (units <= 4 ? 'medium' : units <= 6 ? 'large' : units <= 8 ? 'huge' : 'giant');
  const SIZE_IDS = Object.keys(SIZES);
  // tuning tables, indexed by a setting's level
  const HEIGHTS = [0.74, 0.67, 0.6, 0.52, 0.44];   // typical ground-top row, as a share of the map height
  const RUGGED = [0.02, 0.05, 0.09, 0.14, 0.2];    // surface bumpiness, as a share of the map height
  const WATER = [0.045, 0.09, 0.135, 0.18];        // liquid depth from the bottom (Normal = row 82 of 90)
  const WIND = [0.5, 1, 1.3, 1.6];                 // wind strength multiplier by weather
  const TRIES = 12;

  // ---------- seeded randomness ----------
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const ease = (t) => t * t * (3 - 2 * t);
  // smooth 1D value noise, about -1..1, `oct` octaves starting at `period` cells
  function noise1(r, n, period, oct = 3) {
    const out = new Float32Array(n); let amp = 1, p = Math.max(2, period), tot = 0;
    for (let o = 0; o < oct; o++) {
      const lat = Array.from({ length: Math.ceil(n / p) + 2 }, () => r() * 2 - 1);
      for (let x = 0; x < n; x++) { const f = x / p, i = Math.floor(f), s = ease(f - i); out[x] += amp * (lat[i] * (1 - s) + lat[i + 1] * s); }
      tot += amp; amp *= 0.5; p = Math.max(2, p / 2);
    }
    for (let x = 0; x < n; x++) out[x] /= tot;
    return out;
  }
  function noise2(r, w, h, period, oct = 2) {
    const out = new Float32Array(w * h); let amp = 1, p = Math.max(2, period), tot = 0;
    for (let o = 0; o < oct; o++) {
      const kw = Math.ceil(w / p) + 2, kh = Math.ceil(h / p) + 2, lat = Array.from({ length: kw * kh }, () => r() * 2 - 1);
      for (let y = 0; y < h; y++) {
        const fy = y / p, iy = Math.floor(fy), sy = ease(fy - iy);
        for (let x = 0; x < w; x++) {
          const fx = x / p, ix = Math.floor(fx), sx = ease(fx - ix), a = lat[iy * kw + ix], b = lat[iy * kw + ix + 1], c = lat[(iy + 1) * kw + ix], d = lat[(iy + 1) * kw + ix + 1];
          out[y * w + x] += amp * ((a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy);
        }
      }
      tot += amp; amp *= 0.5; p = Math.max(2, p / 2);
    }
    for (let i = 0; i < out.length; i++) out[i] /= tot;
    return out;
  }

  // ---------- drawing into the grid (c = the build context) ----------
  const inside = (c, x, y) => x >= 0 && x < c.w && y >= 0 && y < c.h;
  function put(c, x, y, m) { x = Math.floor(x); y = Math.floor(y); if (inside(c, x, y)) c.T[y * c.w + x] = m; }
  function fillCol(c, x, top, bottom = c.h, m = DIRT) { for (let y = Math.max(0, Math.round(top)); y < Math.min(c.h, Math.round(bottom)); y++) c.T[y * c.w + x] = m; }
  function rect(c, x0, y0, x1, y1, m) { for (let y = Math.round(y0); y < Math.round(y1); y++) for (let x = Math.round(x0); x < Math.round(x1); x++) put(c, x, y, m); }
  function disc(c, cx, cy, rad, m, rx = rad) {
    for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / rad;
      if (dx * dx + dy * dy <= 1 && inside(c, x, y) && !(m === AIR && c.T[y * c.w + x] === ROCK)) c.T[y * c.w + x] = m;
    }
  }
  function tri(c, cx, base, half, tall, m, down = false) { // a spike: wide at `base`, pointing up (or down)
    for (let i = 0; i < tall; i++) { const hw = half * (1 - i / tall), y = down ? base + i : base - i; rect(c, cx - hw, y, cx + hw + 0.5, y + 1, m); }
  }
  function line(c, x0, y0, x1, y1, m, th = 1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1; for (let i = 0; i <= n; i++) rect(c, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, x0 + (x1 - x0) * i / n + th, y0 + (y1 - y0) * i / n + th, m); }
  function surf(c, x) { const cx = Math.max(0, Math.min(c.w - 1, Math.floor(x))); for (let y = 0; y < c.h; y++) if (c.T[y * c.w + cx]) return y; return c.h; }
  // surface wobble for a landform: big swells (ruggedness) plus small jags on Rough and Jagged
  function wob(c, period) {
    const n = noise1(c.r, c.w, period * c.sx, 4), j = c.s.rugged >= 3 ? noise1(c.r, c.w, 5, 1) : null;
    for (let x = 0; x < c.w; x++) n[x] = n[x] * c.amp + (j ? j[x] * (c.s.rugged - 2) * 1.8 : 0);
    return n;
  }
  // chasms: straight-ish cuts through all the ground, so the map splits into pieces
  function chasms(c, n, lo = 0.18, hi = 0.82) {
    for (let i = 0; i < n; i++) {
      const x0 = c.w * (lo + (hi - lo) * (i + 0.2 + c.r() * 0.6) / n), wd = 3 + c.r() * 3;
      for (let y = 0; y < c.h; y++) { const k = wd + Math.sin(y * 0.3 + i) * 0.8; for (let x = Math.floor(x0); x < x0 + k; x++) if (inside(c, x, y)) c.T[y * c.w + x] = AIR; }
    }
  }

  // ---------- landforms: the big shape ----------
  const LANDFORMS = {
    hills: { name: 'Hills', blurb: 'Rolling hills with a valley in the middle.', gen(c) {
      const n = wob(c, 40), v = c.h * [0.14, 0.13, 0.12, 0.06, 0][c.s.land];
      for (let x = 0; x < c.w; x++) fillCol(c, x, c.top + n[x] + v * Math.exp(-Math.pow((x / c.w - 0.5) / 0.09, 2)));
      chasms(c, [2, 1, 0, 0, 0][c.s.land]);
    } },
    lagoon: { name: 'Lagoon', blurb: 'Low islands split by channels that go down below the liquid.', gen(c) {
      // Louiemark's Lagoon Isles shape: ground near the liquid, cut by 3–5 channels (fewer on heavier land)
      const n = wob(c, 30), k = [5, 4, 4, 3, 3][c.s.land] - (c.r() < 0.5 ? 1 : 0) + 1, low = Math.min(c.top + c.h * 0.05, c.water - 9 * c.sy);
      const ch = Array.from({ length: k }, (_, i) => ({ u: (i + 1) / (k + 1) + (c.r() - 0.5) * 0.06, w: 0.016 + c.r() * 0.008 }));
      for (let x = 0; x < c.w; x++) {
        const u = (x + 0.5) / c.w; let t = low + n[x] * 0.7;
        for (const q of ch) { const d = Math.abs(u - q.u) / q.w; if (d < 1) t = Math.max(t, c.h - 3 * c.sy); else if (d < 1.8) t = Math.max(t, c.h - 3 * c.sy - (c.h - 3 * c.sy - t) * (d - 1) / 0.8); }
        fillCol(c, x, t);
      }
    } },
    islands: { name: 'Islands', blurb: 'Floating islands over open liquid. Knock-offs are deadly.', gen(c) {
      const n = Math.max(2, Math.round([6, 5, 4, 3, 3][c.s.land] * c.sx)), gap = c.w / n, hf = [0.32, 0.37, 0.42, 0.46, 0.5][c.s.land];
      for (let i = 0; i < n; i++) {
        const cx = gap * (i + 0.5) + (c.r() - 0.5) * gap * 0.12, half = gap * hf * (0.85 + c.r() * 0.3);
        const top = Math.min(c.water - 16 * c.sy, c.top - (10 - c.r() * 10) * c.sy), deep = (18 + c.r() * 8) * c.sy, ph = c.r() * 6;
        for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
          if (x < 0 || x >= c.w) continue; const u = (x + 0.5 - cx) / half; if (Math.abs(u) > 1) continue;
          const t = top + 3 * u * u + (c.amp * 0.35 + 1) * Math.sin(x * 0.9 / Math.max(1, c.s.rugged) + ph);
          fillCol(c, x, t, top + 2 + Math.max(8 * c.sy, deep * Math.sqrt(1 - u * u)));
        }
      }
      if (c.s.land >= 1) { // low rocks just above the liquid: a knocked-off unit often lands there hurt instead of drowning
        const ph = c.r() * 6;
        for (let x = 0; x < c.w; x++) if (Math.sin(x / 7 + ph) + 0.5 * Math.sin(x / 2.7 + ph * 2) > -0.3) fillCol(c, x, c.water - 3 - 2 * Math.sin(x / 3 + ph));
      }
    } },
    mesas: { name: 'Mesas', blurb: 'Flat-topped plateaus at three heights with sheer cliffs.', gen(c) {
      const step = Math.max(3, Math.round(c.h * 0.075)), n = noise1(c.r, c.w, 34 * c.sx, 2), slot = [0.45, 0.25, 0, 0, 0][c.s.land];
      for (let x = 0; x < c.w;) {
        const wd = Math.round((10 + c.r() * 16) * c.sx), tier = Math.max(-2, Math.min(2, Math.round(n[x] * 2.4 + (c.r() - 0.5) * 1.2)));
        const y = c.top + tier * step + (c.r() - 0.5) * c.amp * 0.4;
        for (let i = 0; i < wd && x + i < c.w; i++) { const edge = Math.min(i, wd - 1 - i); fillCol(c, x + i, y + (edge === 0 ? 2 : edge === 1 ? 1 : 0) + (c.s.rugged >= 3 && c.r() < 0.3 ? 1 : 0)); }
        x += wd + (c.r() < slot ? 3 + Math.floor(c.r() * 3) : 0);
      }
    } },
    caverns: { name: 'Caverns', blurb: 'One thick slab of ground hollowed into chambers and tunnels.', gen(c) {
      const n = wob(c, 30), roof = c.top - c.h * 0.1;
      for (let x = 0; x < c.w; x++) fillCol(c, x, roof + n[x] * 0.5);
      const k = Math.round([9, 8, 7, 5, 4][c.s.land] * c.sx); let px = null, py = null;
      for (let i = 0; i < k; i++) {
        const x = c.w * (i + 0.5) / k + (c.r() - 0.5) * 8, y = roof + 9 * c.sy + c.r() * Math.max(2, c.water - roof - 16 * c.sy), rad = (3.5 + c.r() * 3.5) * c.sy;
        disc(c, x, y, rad, AIR, rad * 1.5);
        if (px != null && c.r() < 0.8) worm(c, px, py, x, y, 1.8);
        px = x; py = y;
      }
      for (let i = 0; i < 2 + Math.floor(c.r() * 2); i++) { const x = 10 + c.r() * (c.w - 20); rect(c, x, 0, x + 3, roof + 10 * c.sy + c.r() * 10, AIR); } // skylight shafts
    } },
    canyon: { name: 'Canyon', blurb: 'Two high plateaus split by a deep gorge with liquid at the bottom.', gen(c) {
      const n = wob(c, 36), gx = c.w / 2 + (c.s.symmetry ? 0 : (c.r() - 0.5) * c.w * 0.08), gw = c.w * [0.13, 0.11, 0.09, 0.07, 0.055][c.s.land];
      const rim = c.top - c.h * 0.06;
      for (let x = 0; x < c.w; x++) {
        const d = Math.abs(x + 0.5 - gx);
        if (d < gw) { fillCol(c, x, c.water + 3); continue; }
        const lip = d - gw < 6 ? Math.floor((6 - (d - gw)) / 2) * 3 : 0; // stepped ledges down into the gorge
        fillCol(c, x, rim + n[x] + lip);
      }
      if (c.s.land >= 3) { const y = rim + 4; for (let x = Math.floor(gx - gw - 2); x < gx + gw + 2; x++) fillCol(c, x, y + 1.5 * Math.pow((x - gx) / gw, 2), y + 4); } // a natural bridge
    } },
    peak: { name: 'Peak', blurb: 'One big mountain in the middle. Lob over it or dig through it.', gen(c) {
      const n = wob(c, 32), cx = c.w / 2 + (c.s.symmetry ? 0 : (c.r() - 0.5) * c.w * 0.06);
      for (let x = 0; x < c.w; x++) { const u = Math.abs(x + 0.5 - cx) / (c.w / 2); fillCol(c, x, c.top + c.h * 0.08 - c.h * 0.3 * Math.pow(Math.max(0, 1 - u * 1.35), 1.4) + n[x]); }
      chasms(c, [2, 1, 0, 0, 0][c.s.land], 0.12, 0.88);
    } },
    bowl: { name: 'Bowl', blurb: 'High rims at both edges and a low middle. Everyone rolls to the centre.', gen(c) {
      const n = wob(c, 34);
      for (let x = 0; x < c.w; x++) { const u = Math.abs(x + 0.5 - c.w / 2) / (c.w / 2); fillCol(c, x, Math.min(c.water - 5, c.top + c.h * 0.12 - c.h * 0.26 * Math.pow(u, 1.6) + n[x])); }
      if (c.s.land >= 3) disc(c, c.w / 2, c.top + c.h * 0.1, 6 * c.sy, DIRT, 10 * c.sx); // a mound in the middle
      chasms(c, [2, 1, 0, 0, 0][c.s.land], 0.3, 0.7);
    } },
    city: { name: 'City', blurb: 'Flat roofs at every height with alleys that flood first.', rooms: true, gen(c) {
      const street = c.water - 4, [a0, a1] = [[6, 9], [4, 7], [3, 5], [2, 4], [1, 3]][c.s.land];
      for (let x = 0; x < c.w; x++) fillCol(c, x, street);
      for (let x = 0; x < c.w;) {
        const wd = 12 + Math.floor(c.r() * 10), top = Math.min(street - 6, c.top + (c.r() - 0.5) * (6 + c.s.rugged * 4) * c.sy), alley = a0 + Math.floor(c.r() * (a1 - a0 + 1));
        for (let i = x; i < Math.min(c.w, x + wd); i++) fillCol(c, i, top);
        for (let i = x + 1; i < Math.min(c.w, x + wd); i++) if ((i - x) % 4 === 2) put(c, i, top - 1, DIRT); // parapet bumps
        if (c.r() < 0.35) rect(c, x + 3, top - 4 - c.r() * 4, x + wd - 3, top, DIRT); // a setback storey on top
        x += wd + alley;
      }
    } },
    towers: { name: 'Towers', blurb: 'Low ground stacked with tall towers of junk.', rooms: true, gen(c) {
      const n = wob(c, 30), base = c.water - c.h * 0.12;
      for (let x = 0; x < c.w; x++) fillCol(c, x, base + n[x] * 0.4);
      const k = Math.round((6 + c.s.land * 0.5 + c.r() * 2) * c.sx), tall = 0.7 + c.s.height * 0.15;
      for (let i = 0; i < k; i++) { // stacked blocks, each a little narrower and shifted
        let cx = c.w * (i + 0.5) / k + (c.r() - 0.5) * 8, wd = 10 + c.r() * 6, y = surf(c, cx);
        const blocks = 1 + Math.floor(c.r() * 3);
        for (let b = 0; b < blocks && wd > 3; b++) { const bh = Math.round((3 + c.r() * 4) * tall * c.sy); rect(c, cx - wd / 2, y - bh, cx + wd / 2, y + 1, DIRT); y -= bh; wd *= 0.65 + c.r() * 0.2; cx += (c.r() - 0.5) * 4; }
      }
    } },
    bridges: { name: 'Bridges', blurb: 'Two cliffs joined by girder bridges over a liquid gap. Blow the bridge.', gen(c) {
      const n = wob(c, 36), gw = c.w * [0.22, 0.19, 0.16, 0.13, 0.1][c.s.land], cl = c.top - c.h * 0.04, deck = Math.round(cl + 3);
      for (let x = 0; x < c.w; x++) { const d = Math.abs(x + 0.5 - c.w / 2); fillCol(c, x, d < gw ? c.water + 3 : cl + n[x] * (d < gw + 4 ? 0.2 : 1)); }
      const piers = 1 + (c.s.land >= 2 ? 1 : 0);
      for (let i = 0; i < piers; i++) { const px = c.w / 2 - gw + 2 * gw * (i + 1) / (piers + 1); rect(c, px - 2.5, deck + 3, px + 2.5, c.h, DIRT); }
      rect(c, c.w / 2 - gw - 1, deck, c.w / 2 + gw + 1, deck + 2, PROP); // the girder deck
      for (let x = Math.floor(c.w / 2 - gw); x < c.w / 2 + gw; x += 4) put(c, x, deck + 2, PROP); // bracing
    } },
  };
  const LANDFORM_IDS = Object.keys(LANDFORMS);
  function worm(c, x0, y0, x1, y1, rad) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) { const t = i / n; disc(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * 6) * 2, rad, AIR); } }

  // ---------- passes ----------
  function caves(c) {
    const lv = c.s.caves; if (!lv) return;
    if (LANDFORMS[c.lf].rooms) { // buildings and junk get rooms, not tunnels
      for (let i = 0, n = Math.round([0, 3, 5, 8, 12][lv] * c.sx); i < n; i++) {
        const x = 4 + c.r() * (c.w - 8), y = surf(c, x) + 3 + c.r() * 8;
        if (y < c.water - 3 && c.T[Math.floor(y) * c.w + Math.floor(x)]) rect(c, x - 2 - c.r() * 3, y, x + 2 + c.r() * 3, y + 3 + c.r() * 1.5, AIR);
      }
      return;
    }
    for (let i = 0, n = Math.round([0, 2, 4, 7, 11][lv] * c.sx); i < n; i++) { // wandering tunnels
      let x = c.r() * c.w, y = surf(c, x) + (5 + c.r() * 12) * c.sy, a = (c.r() < 0.5 ? 0 : Math.PI) + (c.r() - 0.5) * 0.8;
      const len = 12 + c.r() * 30, rad = 1.6 + c.r() * 1.4;
      for (let k = 0; k < len && y < c.water - 2; k++) { disc(c, x, y, rad, AIR); a += (c.r() - 0.5) * 0.6; x += Math.cos(a) * 1.2; y += Math.sin(a) * 0.8; if (y > c.water - 4) a = -Math.abs(a); }
    }
    if (lv >= 3) { // cheese: a noise field of pockets under the surface
      const f = noise2(c.r, c.w, c.h, 10 * c.sx), th = lv === 3 ? 0.42 : 0.32;
      for (let x = 0; x < c.w; x++) { const s0 = surf(c, x) + 4; for (let y = s0; y < c.water; y++) if (f[y * c.w + x] > th && c.T[y * c.w + x] !== ROCK) c.T[y * c.w + x] = AIR; }
    }
  }
  function overhangs(c) {
    for (let i = 0, n = Math.round([0, 2, 4, 7][c.s.overhangs] * c.sx); i < n; i++) {
      const x = 6 + c.r() * (c.w - 12), y = surf(c, x); if (y >= c.water - 6) continue;
      const dir = surf(c, x + 4) > surf(c, x - 4) ? 1 : -1, rx = 3 + c.r() * 5, ry = 1.4 + c.r();
      disc(c, x + dir * rx * 0.6, y + 2.5 + ry, ry, AIR, rx); // a pocket under a thin lip, open on the downhill side
    }
  }
  function platforms(c) {
    for (let i = 0, n = Math.round([0, 2, 4, 7][c.s.platforms] * c.sx), tries = 0; i < n && tries < n * 8; tries++) {
      const len = 6 + Math.floor(c.r() * 9), x = 6 + c.r() * (c.w - 12 - len); let low = c.h;
      for (let k = -2; k < len + 2; k++) low = Math.min(low, surf(c, x + k));
      const hi = c.sky + 4, lo = low - 7; if (lo <= hi) continue;
      const y = Math.round(hi + c.r() * (lo - hi));
      if (c.th.platform === 'girder') { rect(c, x, y, x + len, y + 2, PROP); for (let k = 1; k < len; k += 3) put(c, x + k, y + 2, PROP); }
      else for (let k = 0; k < len; k++) { const edge = Math.min(k, len - 1 - k); fillCol(c, Math.floor(x + k), y - (edge > 1 && c.r() < 0.3 ? 1 : 0), y + (edge === 0 ? 1 : edge === 1 ? 2 : 3)); }
      i++;
    }
  }
  // Props: theme decorations stamped onto the ground. (c, x, y): y is the ground-top row under x; draw upwards.
  const STAMPS = {
    boulder(c, x, y) { disc(c, x, y - 1, 2 + c.r() * 2, DIRT); },
    tree(c, x, y) { const t = y - 4 - c.r() * 2; rect(c, x - 1, t, x + 1, y + 1, PROP); disc(c, x, t - 1, 2.5 + c.r(), ACCENT, 3 + c.r()); },
    pillar(c, x, y) { const t = y - 5 - c.r() * 3; rect(c, x - 1, t, x + 2, y + 1, DIRT); rect(c, x - 2, t, x + 3, t + 1, DIRT); },
    car(c, x, y) { rect(c, x - 4, y - 6, x + 5, y + 1, PROP); rect(c, x - 3, y - 5, x + 4, y - 1, AIR); rect(c, x - 2, y - 7, x + 3, y - 6, ACCENT); },
    crates(c, x, y) { for (let i = 0, n = 1 + Math.floor(c.r() * 3); i < n; i++) rect(c, x - 2 + i % 2, y - 4 * (i + 1) + 1, x + 2 + i % 2, y - 4 * i + 1, i % 2 ? ACCENT : PROP); },
    pipe(c, x, y) { const d = c.r() < 0.5 ? 1 : -1; rect(c, x, y - 8, x + 2, y + 1, PROP); rect(c, Math.min(x, x + d * 7), y - 8, Math.max(x + 2, x + d * 7), y - 6, PROP); rect(c, x + d * 7 - 1, y - 9, x + d * 7 + 2, y - 5, ACCENT); },
    chimney(c, x, y) { const t = y - 5 - c.r() * 3; rect(c, x - 1, t, x + 2, y + 1, PROP); rect(c, x - 2, t, x + 3, t + 1, ACCENT); },
    watertower(c, x, y) { rect(c, x - 3, y - 5, x - 2, y + 1, PROP); rect(c, x + 2, y - 5, x + 3, y + 1, PROP); rect(c, x - 4, y - 11, x + 5, y - 5, ACCENT); tri(c, x + 0.5, y - 11, 4.5, 3, PROP); },
    antenna(c, x, y) { const t = y - 7 - c.r() * 2; rect(c, x, t, x + 1, y + 1, PROP); rect(c, x - 2, t + 2, x + 3, t + 3, PROP); },
    icespike(c, x, y) { tri(c, x, y + 1, 2 + c.r() * 1.5, 4 + c.r() * 3, ACCENT); },
    snowman(c, x, y) { disc(c, x, y - 2, 2.4, PROP); disc(c, x, y - 5.5, 1.7, PROP); },
    cactus(c, x, y) { const t = y - 8 - c.r() * 2; rect(c, x - 1, t, x + 1, y + 1, ACCENT); rect(c, x - 3, y - 6, x - 1, y - 5, ACCENT); rect(c, x - 3, y - 9, x - 2, y - 5, ACCENT); rect(c, x + 1, y - 8, x + 3, y - 7, ACCENT); rect(c, x + 2, y - 10, x + 3, y - 7, ACCENT); },
    arch(c, x, y) { const R = 6 + c.r() * 3; for (let yy = Math.floor(y - R - 1); yy <= y; yy++) for (let xx = Math.floor(x - R - 1); xx <= x + R + 1; xx++) { const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y); if (d <= R && d >= R - 2.2) put(c, xx, yy, DIRT); } },
    mushroom(c, x, y) { const t = y - 3 - c.r() * 3, R = 3 + c.r() * 2; rect(c, x - 1, t, x + 1, y + 1, PROP); for (let yy = Math.floor(t - R); yy <= t; yy++) for (let xx = Math.floor(x - R); xx <= x + R; xx++) if (Math.hypot((xx + 0.5 - x) / R, (yy + 0.5 - t) / (R * 0.7)) <= 1) put(c, xx, yy, ACCENT); },
    stalactite: 'hang',
    hull(c, x, y) {
      for (let yy = Math.floor(y - 6); yy <= y; yy++) for (let xx = Math.floor(x - 9); xx <= x + 9; xx++) { const d = Math.hypot((xx + 0.5 - x) / 9, (yy + 0.5 - (y - 6)) / 6); if (d <= 1 && d >= 0.72 && yy >= y - 6) put(c, xx, yy, PROP); }
      rect(c, x, y - 17, x + 1, y - 4, PROP); tri(c, x + 3, y - 8, 2.5, 7, ACCENT);
    },
    coral(c, x, y) { for (let i = 0; i < 3; i++) { let px = x + i - 1, py = y; for (let k = 0, n = 4 + Math.floor(c.r() * 4); k < n; k++) { put(c, px, py, ACCENT); px += Math.round((c.r() - 0.5) * 2); py--; } } },
    gravestone(c, x, y) { rect(c, x - 1, y - 4, x + 2, y + 1, PROP); if (c.r() < 0.4) { rect(c, x, y - 6, x + 1, y - 4, PROP); rect(c, x - 1, y - 5, x + 2, y - 4, PROP); } },
    deadtree(c, x, y) { const t = y - 6 - c.r() * 2; rect(c, x, t, x + 1, y + 1, ACCENT); line(c, x, t + 3, x - 3, t, ACCENT); line(c, x, t + 5, x + 3, t + 2, ACCENT); },
    crypt(c, x, y) { rect(c, x - 4, y - 6, x + 5, y + 1, PROP); rect(c, x - 3, y - 5, x + 4, y, AIR); rect(c, x + 4, y - 3, x + 5, y, AIR); tri(c, x + 0.5, y - 6, 5, 3, ACCENT); },
  };
  function props(c) {
    const list = c.th.props, tot = list.reduce((a, p) => a + p[1], 0);
    for (let i = 0, n = Math.round([0, 2, 4, 7][c.s.props] * c.sx); i < n; i++) {
      let pick = c.r() * tot, id = list[0][0]; for (const [k, wgt] of list) { if ((pick -= wgt) < 0) { id = k; break; } }
      const x = Math.round(4 + c.r() * (c.w - 8)), y = surf(c, x);
      if (STAMPS[id] === 'hang') { // hangs from a cave ceiling, if this column has one
        for (let yy = y + 2; yy < c.water - 3; yy++) if (!c.T[yy * c.w + x] && c.T[(yy - 1) * c.w + x]) { tri(c, x + 0.5, yy, 1.5 + c.r(), 3 + c.r() * 4, ACCENT, true); break; }
        continue;
      }
      if (y >= c.water - 3 || y < c.sky + 12) continue;
      STAMPS[id](c, x, y);
    }
  }
  // drop crumbs too small to stand on (4-neighbour pieces under 10 cells) and single cells sticking out
  function cleanup(c) {
    const { w, h, T } = c, seen = new Uint8Array(w * h), stack = [];
    for (let i = 0; i < w * h; i++) {
      if (!T[i] || seen[i]) continue;
      const piece = []; stack.push(i); seen[i] = 1;
      while (stack.length) { const j = stack.pop(); piece.push(j); const x = j % w; for (const k of [j - w, j + w, x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1]) if (k >= 0 && k < w * h && T[k] && !seen[k]) { seen[k] = 1; stack.push(k); } }
      if (piece.length < 10) for (const j of piece) T[j] = AIR;
    }
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (T[i] && (T[i - 1] ? 1 : 0) + (T[i + 1] ? 1 : 0) + (T[i - w] ? 1 : 0) + (T[i + w] ? 1 : 0) <= 1) T[i] = AIR; }
  }
  // hard rock: Bedrock = ground at least 9 cells from any air; Veins adds noisy streaks at least 5 cells in.
  // Never near the surface or a cave wall, so nobody starts under cover they can't blast away.
  function hardRock(c) {
    if (!c.s.rock) return;
    const { w, h, T } = c, dist = new Int16Array(w * h).fill(-1), q = [];
    for (let i = 0; i < w * h; i++) if (!T[i]) { dist[i] = 0; q.push(i); }
    for (let qi = 0; qi < q.length; qi++) {
      const j = q[qi], x = j % w, y = (j / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const k = ny * w + nx; if (dist[k] < 0) { dist[k] = dist[j] + 1; q.push(k); } }
    }
    const f = c.s.rock >= 2 ? noise2(c.r, w, h, 7 * c.sx) : null;
    for (let i = 0; i < w * h; i++) if (T[i] === DIRT && dist[i] >= 0 && (dist[i] >= 9 || (f && dist[i] >= 5 && Math.abs(f[i]) < 0.09))) T[i] = ROCK;
  }
  function mirror(c) { for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w / 2; x++) c.T[y * c.w + (c.w - 1 - x)] = c.T[y * c.w + x]; }
  // Hazards: the theme's barrels (blow up when a blast reaches them) or old live duds (lobbable, tick from turn 1).
  function hazards(c) {
    const n = Math.round([0, 2, 4, 6][c.s.hazards] * c.sx), half = c.s.symmetry, maxX = half ? c.w / 2 - 3 : c.w - 4;
    for (let i = 0, tries = 0; i < (half ? Math.ceil(n / 2) : n) && tries < n * 10; tries++) {
      const x = Math.floor(4 + c.r() * (maxX - 4)), y = surf(c, x);
      if (y >= c.water - 3 || y <= c.sky || c.feats.some((f) => Math.abs(f.x - x) < 8)) continue;
      const f = { kind: c.th.hazard.kind, x, y: y - 0.3 }; if (f.kind === 'dud') f.fuse = 4 + Math.floor(c.r() * 3);
      c.feats.push(f); if (half) c.feats.push(Object.assign({}, f, { x: c.w - 1 - x })); i++;
    }
  }

  // ---------- checks ----------
  function surfaceY(m, x) { const cx = Math.max(0, Math.min(m.w - 1, Math.floor(x))); for (let y = 0; y < m.h; y++) if (m.T[y * m.w + cx]) return y; return m.h; }
  // A column is a good spawn if it and the columns 3 and 6 to each side all have dry ground under them
  // (Wormsbound's rule). spawnNear finds the nearest one to x, or -1.
  function spawnOK(m, s) { return s >= 4 && s < m.w - 4 && [s - 6, s - 3, s, s + 3, s + 6].every((c) => surfaceY(m, c) < m.water - 4); }
  function spawnNear(m, x, reach = m.w) { x = Math.round(x); for (let d = 0; d <= reach; d++) for (const s of [x + d, x - d]) if (spawnOK(m, s)) return s; return -1; }
  function check(m) {
    const problems = [], { w, h, T, water } = m, sky = Math.round(h * 0.1);
    let solid = 0, area = 0, massL = 0, massR = 0;
    for (let y = sky; y < water; y++) for (let x = 0; x < w; x++) { area++; if (T[y * w + x]) { solid++; if (x < w / 2) massL++; else massR++; } }
    const land = solid / area;
    if (land < 0.08) problems.push('too little land'); if (land > 0.8) problems.push('too much land');
    const bands = []; for (let b = 0; b < 8; b++) bands.push(spawnNear(m, w * (0.08 + 0.84 * (b + 0.5) / 8), Math.round(w / 16)) >= 0);
    const okBands = bands.filter(Boolean).length;
    if (okBands < 6) problems.push(`room to spawn in only ${okBands} of 8 spots`);
    if (!bands[0] && !bands[1]) problems.push('no spawn room on the far left'); if (!bands[6] && !bands[7]) problems.push('no spawn room on the far right');
    const tops = (a, b) => { let s = 0, k = 0; for (let x = a; x < b; x++) { const y = surfaceY(m, x); if (y < water) { s += y; k++; } } return k ? s / k : water; };
    const fair = Math.max(0, Math.round(100 - 100 * Math.abs(massL - massR) / Math.max(1, massL + massR) - 100 * Math.abs(tops(0, w / 2) - tops(w / 2, w)) / h));
    if (fair < 70) problems.push(`halves too different (fairness ${fair})`);
    return { ok: !problems.length, problems, land: Math.round(land * 100), spawnRoom: okBands, fairness: fair };
  }

  // ---------- themes ----------
  // look: colours for any renderer. shades: ground by depth (surface, 1, 2-4, 5-9, 10-17, deeper), two tones each.
  // rock / prop / accent: the other materials. liquid: what you drown in. bg: the far background's style.
  const ROCK_LOOK = [['#4A4656', '#423E4D']];
  const LIQ = {
    water: { name: 'water', top: 'rgba(34,195,181,.85)', deep: 'rgba(14,60,90,.95)', foam: 'rgba(200,255,250,.7)' },
    night: { name: 'water', top: 'rgba(40,90,150,.85)', deep: 'rgba(10,20,50,.95)', foam: 'rgba(170,200,255,.6)' },
    sludge: { name: 'sludge', top: 'rgba(120,140,60,.88)', deep: 'rgba(40,45,20,.96)', foam: 'rgba(200,210,140,.6)' },
    ice: { name: 'icy water', top: 'rgba(150,215,240,.85)', deep: 'rgba(40,80,130,.95)', foam: 'rgba(240,250,255,.85)' },
    toxic: { name: 'toxic ooze', top: 'rgba(140,230,90,.85)', deep: 'rgba(30,80,40,.95)', foam: 'rgba(220,255,180,.7)' },
    sea: { name: 'sea', top: 'rgba(40,160,200,.85)', deep: 'rgba(10,40,90,.95)', foam: 'rgba(220,250,255,.8)' },
    lava: { name: 'lava', top: 'rgba(255,120,40,.92)', deep: 'rgba(150,20,10,.97)', foam: 'rgba(255,220,120,.85)' },
    murk: { name: 'murk', top: 'rgba(130,90,170,.8)', deep: 'rgba(30,15,50,.95)', foam: 'rgba(210,180,240,.6)' },
  };
  const THEMES = {
    hills: { name: 'Crater Hills', blurb: 'Rolling hills, a valley in the middle and caves to bank shots off.', landform: 'hills',
      props: [['tree', 3], ['boulder', 2]], platform: 'ledge', hazard: { kind: 'dud', name: 'Old dud' }, set: { caves: 2 },
      rule: 'Old duds: live duds from an older battle lie on the hills. Anyone can lob them, and they wake up and tick from turn 1.',
      later: 'Gopher holes that pop a unit up somewhere else.',
      look: { sky: ['#2B1E45', '#7A3B5E', '#FF8A3D', '#FFC37A'], ridges: ['rgba(107,58,91,.55)', 'rgba(70,40,78,.7)'], bg: 'hills',
        shades: [['#A6DE62', '#93CF55'], ['#6FAE45', '#62A03C'], ['#D2834A', '#C47640'], ['#B2643A', '#A55B36'], ['#8C4C3A', '#7F4436'], ['#6A3E4A', '#5E3743']], tuft: '#B8EC74',
        rock: ROCK_LOOK[0], prop: ['#7A4A34', '#6C412E'], accent: ['#5FA845', '#54983C'], liquid: LIQ.water, hazard: '#C9481A' } },
    sky: { name: 'Sky Isles', blurb: 'Floating islands over open water. Miss the edge and you swim.', landform: 'islands',
      props: [['tree', 2], ['pillar', 2], ['boulder', 1]], platform: 'ledge', hazard: { kind: 'dud', name: 'Old dud' }, set: { caves: 0, weather: 2, overhangs: 0 },
      rule: 'High winds: gusts up here are 30% stronger. Read the wind or lose the shot.',
      later: 'Updrafts between islands that lift shells (and units) passing over them.',
      look: { sky: ['#3A6FB0', '#69A7DA', '#A9D8F0', '#E6F6FF'], ridges: ['rgba(120,160,200,.45)', 'rgba(90,130,180,.55)'], bg: 'float',
        shades: [['#9BE36A', '#88D45A'], ['#5FB04A', '#52A040'], ['#B9A27A', '#AC966F'], ['#8F7E66', '#84745D'], ['#6E6378', '#63596D'], ['#55506A', '#4B465E']], tuft: '#C6F58A',
        rock: ['#55506A', '#4B465E'], prop: ['#7A5A3A', '#6C4F33'], accent: ['#6CC24A', '#5EB040'], liquid: LIQ.water, hazard: '#C9481A' } },
    scrap: { name: 'Scrap Yard', blurb: 'Low ground stacked with scrap towers and hollow car shells.', landform: 'towers',
      props: [['car', 3], ['crates', 2], ['pipe', 1]], platform: 'girder', hazard: { kind: 'barrel', name: 'Oil drum' }, set: { caves: 1, hazards: 2 },
      rule: 'Oil drums: they blow up when a blast reaches them, and set off the drums next to them.',
      later: 'A magnet crane that swings once a round and drops whatever it grabs.',
      look: { sky: ['#3B2A28', '#7A4A30', '#C9773A', '#E8B070'], ridges: ['rgba(90,60,50,.55)', 'rgba(60,40,38,.75)'], bg: 'blocky',
        shades: [['#C98A4B', '#B97C42'], ['#9A6A44', '#8C5F3D'], ['#7C7A80', '#706E74'], ['#66646C', '#5C5A62'], ['#56484A', '#4C4042'], ['#42363A', '#3A3034']], tuft: '#E0A060',
        rock: ROCK_LOOK[0], prop: ['#8C8F99', '#7E818B'], accent: ['#C0602A', '#B05524'], liquid: LIQ.sludge, hazard: '#3F7D4E' } },
    roofs: { name: 'Rooftops', blurb: 'Flat roofs at every height, with alleys in between that flood first.', landform: 'city',
      props: [['chimney', 3], ['watertower', 2], ['antenna', 2]], platform: 'girder', hazard: { kind: 'barrel', name: 'Gas canister' }, set: { caves: 2, overhangs: 0, weather: 2 },
      rule: 'Rooftop gusts and gas canisters: windy up high, and the canisters blow when hit.',
      later: 'Water towers that burst and wash units along the roof.',
      look: { sky: ['#0F1530', '#2A2A5A', '#5A3A78', '#C8608A'], ridges: ['rgba(40,40,80,.65)', 'rgba(25,25,55,.85)'], bg: 'blocky', windows: true,
        shades: [['#8A8FA8', '#7E8399'], ['#6C7088', '#62667C'], ['#B0604A', '#A35842'], ['#8E4C3E', '#834538'], ['#5E4048', '#543940'], ['#40303C', '#382A35']], tuft: '#FFD86A',
        rock: ROCK_LOOK[0], prop: ['#A35842', '#954E3A'], accent: ['#6C7088', '#62667C'], liquid: LIQ.night, hazard: '#D94A4A' } },
    frost: { name: 'Frostbite Peaks', blurb: 'One huge snowy mountain in a freezing gale.', landform: 'peak',
      props: [['icespike', 3], ['snowman', 1], ['boulder', 1]], platform: 'ledge', hazard: { kind: 'dud', name: 'Frozen dud' }, set: { weather: 2, overhangs: 2 },
      rule: 'Biting wind and frozen duds: wind 30% stronger, and old duds frozen into the slopes wake up when the match starts.',
      later: 'Slippery ice (units slide a few cells after landing) and icicles that drop when a ceiling is hit.',
      look: { sky: ['#1B2A4A', '#3D5F8F', '#9CC3E6', '#E8F4FF'], ridges: ['rgba(160,190,225,.5)', 'rgba(110,140,190,.6)'], bg: 'peaks', snow: true,
        shades: [['#F4FAFF', '#E3EEF8'], ['#C9DDF0', '#B8CFE6'], ['#8FA9C8', '#839DBC'], ['#6E86A6', '#647B9A'], ['#55667F', '#4C5C73'], ['#3D4A5E', '#364254']], tuft: '#FFFFFF',
        rock: ['#4A4F63', '#42475A'], prop: ['#E6F2FF', '#D3E4F5'], accent: ['#9FE3FF', '#86D3F5'], liquid: LIQ.ice, hazard: '#6EA8D8' } },
    dunes: { name: 'Dune Mesas', blurb: 'Flat-topped mesas and sheer cliffs under a hot sky.', landform: 'mesas',
      props: [['cactus', 3], ['arch', 1], ['boulder', 1]], platform: 'ledge', hazard: { kind: 'dud', name: 'Buried dud' }, set: { weather: 2, overhangs: 2, caves: 1 },
      rule: 'Buried duds and desert wind: old duds half-buried in the sand, and steady wind across the mesas.',
      later: 'Sand that slumps: undermine a dune and it pours down like an hourglass.',
      look: { sky: ['#3A2A4A', '#B0584A', '#F0A050', '#FFE0A0'], ridges: ['rgba(190,110,70,.5)', 'rgba(150,80,60,.6)'], bg: 'hills',
        shades: [['#F2C98A', '#E8BD7C'], ['#E0A866', '#D49C5C'], ['#C77E4C', '#BB7444'], ['#A8643E', '#9C5B39'], ['#844A38', '#784333'], ['#5E3530', '#55302C']], tuft: '#FFE3A8',
        rock: ['#6A4A44', '#5E413C'], prop: ['#EDE2C8', '#DDD0B4'], accent: ['#6FAE45', '#62A03C'], liquid: LIQ.water, hazard: '#C9481A' } },
    fungal: { name: 'Fungal Hollow', blurb: 'Glowing caverns full of giant mushrooms. No wind down here.', landform: 'caverns',
      props: [['mushroom', 4], ['stalactite', 3]], platform: 'ledge', hazard: { kind: 'barrel', name: 'Spore pod' }, set: { weather: 0, caves: 2, height: 3 },
      rule: 'Still air and spore pods: wind is halved underground, and spore pods burst when a blast reaches them.',
      later: 'Bouncy mushroom caps: shells bounce off them once.',
      look: { sky: ['#0E0A1A', '#1E1433', '#352552', '#4A3468'], ridges: ['rgba(80,50,110,.5)', 'rgba(50,30,75,.7)'], bg: 'cave', glow: true,
        shades: [['#7A5FA8', '#6E549A'], ['#5E4785', '#553F78'], ['#4A3A66', '#43345C'], ['#3B2E52', '#352948'], ['#2E2440', '#291F39'], ['#221B30', '#1D172A']], tuft: '#B8F070',
        rock: ['#2A2A38', '#24242F'], prop: ['#E8DCC8', '#D8CAB2'], accent: ['#FF6F91', '#F05A80'], liquid: LIQ.toxic, hazard: '#B8F070' } },
    cove: { name: 'Shipwreck Cove', blurb: 'A sandy bowl with a wrecked ship and coral, and powder kegs everywhere.', landform: 'bowl',
      props: [['hull', 2], ['coral', 2], ['boulder', 1]], platform: 'ledge', hazard: { kind: 'barrel', name: 'Powder keg' }, set: { weather: 2, hazards: 2 },
      rule: 'Powder kegs and sea breeze: kegs blow when hit (and chain), and the wind off the sea is strong.',
      later: 'A tide that goes up and down every few turns instead of only rising.',
      look: { sky: ['#1D3B5A', '#3F7AA0', '#8CC8D8', '#F2E2B8'], ridges: ['rgba(70,120,150,.45)', 'rgba(40,90,120,.6)'], bg: 'hills',
        shades: [['#F0DCA0', '#E6D094'], ['#D8BC7C', '#CDB072'], ['#A88A64', '#9C805C'], ['#7E6E5E', '#736456'], ['#5C5560', '#534D57'], ['#3E3B4A', '#373442']], tuft: '#7BD88F',
        rock: ['#3E3B4A', '#373442'], prop: ['#8A5A3A', '#7C5034'], accent: ['#FF7F6A', '#F06C58'], liquid: LIQ.sea, hazard: '#5A3A22' } },
    magma: { name: 'Magma Works', blurb: 'Two foundry cliffs, girder bridges and a lake of lava.', landform: 'bridges',
      props: [['pipe', 2], ['chimney', 2], ['crates', 1]], platform: 'girder', hazard: { kind: 'barrel', name: 'Fuel drum' }, set: { hazards: 2, rock: 1, platforms: 1 },
      rule: 'Fuel drums over lava: drums blow when hit, the bridges come down, and the lava is just as deadly as water.',
      later: 'Heat vents that launch whoever stands on them; lava splashes that leave small fires.',
      look: { sky: ['#140A0A', '#3A1210', '#7A2A14', '#C8501E'], ridges: ['rgba(90,30,20,.6)', 'rgba(50,18,14,.8)'], bg: 'blocky', embers: true,
        shades: [['#5A5560', '#504B56'], ['#48434E', '#403B45'], ['#7A3A2A', '#6E3426'], ['#5E2C24', '#552720'], ['#43221E', '#3B1E1A'], ['#2C1716', '#261413']], tuft: '#FF9A3D',
        rock: ['#24202A', '#1E1A24'], prop: ['#8C8F99', '#7E818B'], accent: ['#C0602A', '#B05524'], liquid: LIQ.lava, hazard: '#E0B030' } },
    haunt: { name: 'Haunted Hollow', blurb: 'A graveyard on two cliffs over a dark gorge.', landform: 'canyon',
      props: [['gravestone', 4], ['deadtree', 2], ['crypt', 1]], platform: 'ledge', hazard: { kind: 'dud', name: 'Restless dud' }, set: { caves: 2, hazards: 2 },
      rule: 'Restless duds: old duds lie among the graves and wake up when the match starts.',
      later: 'Graves that cough up a new dud every few turns; fog that hides the far side.',
      look: { sky: ['#0C0F1E', '#26254A', '#4E3B6E', '#8E6A9E'], ridges: ['rgba(40,35,70,.6)', 'rgba(25,22,48,.8)'], bg: 'hills', moon: true,
        shades: [['#5E7A5A', '#546E50'], ['#46604A', '#3E5642'], ['#5A4A5E', '#514254'], ['#45394C', '#3E3344'], ['#33293A', '#2D2433'], ['#221B28', '#1D1722']], tuft: '#9AB88A',
        rock: ['#1E1A26', '#1A1620'], prop: ['#9A98A8', '#8C8A9A'], accent: ['#5A4636', '#4E3C2E'], liquid: LIQ.murk, hazard: '#9A98A8' } },
  };
  const THEME_IDS = Object.keys(THEMES);

  // ---------- settings (a map-setup screen can be built straight from this list) ----------
  const SETTINGS = [
    { key: 'theme', label: 'Theme', type: 'choice', options: THEME_IDS, def: 'hills', help: 'Colours, props, liquid, wind and the hazard on the map.' },
    { key: 'landform', label: 'Landform', type: 'choice', options: ['auto'].concat(LANDFORM_IDS), def: 'auto', help: "The big shape. Auto uses the theme's own." },
    { key: 'size', label: 'Size', type: 'choice', options: SIZE_IDS, def: 'medium', help: 'Grid size. Wormsbound picks it from the number of units in the match (1v1: Medium, one screen; 5v5: Giant).' },
    { key: 'height', label: 'Height', type: 'level', names: ['Very low', 'Low', 'Normal', 'High', 'Very high'], def: 2, help: 'How high the ground stands. High ground: longer falls, more to dig through.' },
    { key: 'rugged', label: 'Ruggedness', type: 'level', names: ['Smooth', 'Rolling', 'Normal', 'Rough', 'Jagged'], def: 2, help: 'Bumps and cliffs on the surface. Rough ground gives cover but blocks low shots.' },
    { key: 'land', label: 'Land', type: 'level', names: ['Sparse', 'Light', 'Normal', 'Heavy', 'Packed'], def: 2, help: 'How much ground: gaps and chasms when sparse, wide solid ground when packed.' },
    { key: 'caves', label: 'Caves', type: 'level', names: ['None', 'Few', 'Some', 'Many', 'Warren'], def: 1, help: 'Tunnels and chambers in the ground (rooms in buildings): places to hide and bank shots.' },
    { key: 'overhangs', label: 'Overhangs', type: 'level', names: ['None', 'Few', 'Some', 'Lots'], def: 1, help: 'Lips of ground with air underneath: shelter from shots that come straight down.' },
    { key: 'platforms', label: 'Platforms', type: 'level', names: ['None', 'Few', 'Some', 'Lots'], def: 0, help: 'Floating ledges or girders. High ground that is easy to get knocked off.' },
    { key: 'props', label: 'Props', type: 'level', names: ['None', 'Few', 'Some', 'Lots'], def: 2, help: 'Theme props (trees, cars, mushrooms, graves...). Solid and breakable.' },
    { key: 'hazards', label: 'Hazards', type: 'level', names: ['None', 'Few', 'Some', 'Lots'], def: 1, help: "The theme's hazard: barrels that blow up when a blast reaches them, or old live duds anyone can lob." },
    { key: 'water', label: 'Liquid level', type: 'level', names: ['Low', 'Normal', 'High', 'Flooded'], def: 1, help: 'Where the water (or lava) starts. Sudden death raises it either way.' },
    { key: 'rock', label: 'Hard rock', type: 'level', names: ['None', 'Bedrock', 'Veins'], def: 0, help: "Rock blasts can't break, always 5+ cells deep at the start. Digging gets harder the deeper you go." },
    { key: 'weather', label: 'Wind', type: 'level', names: ['Calm', 'Breezy', 'Windy', 'Gale'], def: 1, help: 'How strong the wind gets: ×0.5, ×1, ×1.3 or ×1.6.' },
    { key: 'symmetry', label: 'Mirror', type: 'level', names: ['Off', 'Mirror'], def: 0, help: 'Copy the left half onto the right, hazards and spawns too. Fair ground for competitive 1v1.' },
  ];
  const LEVEL_KEYS = SETTINGS.filter((k) => k.type === 'level').map((k) => k.key);
  const defaults = () => Object.fromEntries(SETTINGS.map((k) => [k.key, k.def]).concat([['seed', 0]]));

  // ---------- presets: the ten theme maps, then modes ----------
  const PRESETS = {};
  for (const id of THEME_IDS) PRESETS[id] = { name: THEMES[id].name, blurb: THEMES[id].blurb, group: 'Theme maps', s: { theme: id } };
  Object.assign(PRESETS, {
    // Louiemark's first three maps (Nov 2), rebuilt as presets: no hazards, normal wind, his names
    valley: { name: 'Sunset Valley', blurb: 'Rolling hills around a valley in the middle.', group: 'Classic maps', s: { theme: 'hills', landform: 'hills', hazards: 0, weather: 1 } },
    peak: { name: 'Frost Peak', blurb: 'A snowy mountain in the middle. Lob over it or dig through.', group: 'Classic maps', s: { theme: 'frost', landform: 'peak', hazards: 0, weather: 1, caves: 2 } },
    isles: { name: 'Lagoon Isles', blurb: 'Low islands with water between them. Knock people in.', group: 'Classic maps', s: { theme: 'cove', landform: 'lagoon', hazards: 0, weather: 1, props: 1 } },
    classic: { name: 'Classic Duel', blurb: 'Crater Hills mirrored down the middle: the same ground on both sides.', group: 'Modes', s: { theme: 'hills', symmetry: 1, hazards: 0 } },
    tourney: { name: 'Tournament', blurb: 'Mirrored mesas, normal wind, no hazards, few props. For settling arguments.', group: 'Modes', s: { theme: 'dunes', symmetry: 1, hazards: 0, props: 1, weather: 1, rugged: 1 } },
    archipelago: { name: 'Archipelago', blurb: 'More, smaller islands and high water. Knockback is king.', group: 'Modes', s: { theme: 'sky', land: 1, water: 2, platforms: 1 } },
    warren: { name: 'Worm Warren', blurb: 'A tall hill riddled with tunnels. Dig, hide, ambush.', group: 'Modes', s: { theme: 'fungal', landform: 'hills', caves: 4, overhangs: 2, height: 3 } },
    highrise: { name: 'High Rise', blurb: 'Tall buildings with girders between them.', group: 'Modes', s: { theme: 'roofs', height: 4, platforms: 2, land: 1 } },
    hightide: { name: 'High Tide', blurb: 'The sea starts high. Every bit of ground counts.', group: 'Modes', s: { theme: 'cove', water: 3, height: 3 } },
    fortress: { name: 'Fortress', blurb: 'Packed ground over bedrock and rock veins. Long digs, slow fights.', group: 'Modes', s: { theme: 'haunt', landform: 'mesas', land: 4, rock: 2, height: 3 } },
    chaos: { name: 'Chaos', blurb: 'Everything turned up: caves, girders, hazards and a gale.', group: 'Modes', s: { theme: 'magma', caves: 3, platforms: 3, props: 3, hazards: 3, weather: 3, rugged: 4 } },
    firststeps: { name: 'First Steps', blurb: "Gentle mirrored hills, light wind, no hazards. For someone's first match.", group: 'Modes', s: { theme: 'hills', rugged: 1, caves: 0, hazards: 0, weather: 0, symmetry: 1 } },
  });
  const PRESET_IDS = Object.keys(PRESETS);
  const MAP_IDS = THEME_IDS.slice(); // the maps Shuffle deals from: one per theme

  // ---------- settings in and out ----------
  function clean(s) {
    const out = defaults();
    for (const k of SETTINGS) {
      const v = s[k.key];
      if (k.type === 'choice') { if (k.options.includes(v)) out[k.key] = v; }
      else if (Number.isInteger(+v) && +v >= 0 && +v < k.names.length && v !== '' && v != null) out[k.key] = +v;
    }
    out.seed = Number.isFinite(+s.seed) ? (+s.seed >>> 0) : 0;
    return out;
  }
  // input: a preset id, a share code, or an object ({ preset, theme, caves, ... }). Unknown input means Crater Hills.
  function resolve(input) {
    let src = input;
    if (typeof input === 'string') src = PRESETS[input] ? { preset: input } : decode(input) || { preset: 'hills' };
    src = src || {};
    const P = PRESETS[src.preset], theme = THEMES[src.theme] ? src.theme : P && P.s.theme ? P.s.theme : 'hills';
    const own = {}; for (const k of SETTINGS) if (src[k.key] != null) own[k.key] = src[k.key];
    if (src.seed != null) own.seed = src.seed;
    return clean(Object.assign({}, THEMES[theme].set, P ? P.s : {}, own, { theme }));
  }
  const B36 = /^[0-9a-z]+$/;
  function encode(s) { s = clean(s); return [s.theme, s.landform, SIZE_IDS.indexOf(s.size) + LEVEL_KEYS.map((k) => s[k]).join(''), s.seed.toString(36)].join('-'); }
  function decode(code) {
    const p = String(code || '').trim().toLowerCase().split('-');
    if (p.length !== 4 || !THEMES[p[0]] || !(p[1] === 'auto' || LANDFORMS[p[1]]) || !/^\d+$/.test(p[2]) || p[2].length !== LEVEL_KEYS.length + 1 || !B36.test(p[3])) return null;
    const s = { theme: p[0], landform: p[1], size: SIZE_IDS[+p[2][0]], seed: parseInt(p[3], 36) };
    LEVEL_KEYS.forEach((k, i) => { s[k] = +p[2][i + 1]; });
    const c = clean(s);
    return encode(c) === [p[0], p[1], p[2], c.seed.toString(36)].join('-') ? c : null; // a digit out of range means a bad code
  }
  // "Surprise me": random settings that lean towards the middle, so most rolls play well.
  function randomSettings(seed) {
    const r = rng(seed), mid = (n) => Math.max(0, Math.min(n - 1, Math.round((r() + r()) / 2 * (n - 1))));
    const s = { theme: THEME_IDS[Math.floor(r() * THEME_IDS.length)], landform: r() < 0.6 ? 'auto' : LANDFORM_IDS[Math.floor(r() * LANDFORM_IDS.length)] };
    for (const k of SETTINGS) if (k.type === 'level') s[k.key] = mid(k.names.length);
    s.symmetry = r() < 0.25 ? 1 : 0; s.seed = Math.floor(r() * 2176782335) + 1;
    return clean(s);
  }


  // ---------- recipes: how each mode rolls a fresh map every round ----------
  // A recipe is a pool of themes plus a [low, high] range for any level setting (anything not listed uses the theme's
  // own default) and fixed values. roll(recipe, seed) picks from it with the seed, so every copy of a match (server,
  // every browser, a replay) rolls the same settings. spawn: how the engine lays the sides out ('sides' = each side
  // together, 'mixed' = interleaved, 'any' = one of the two by seed). under: the share of units that may start on a
  // ledge or cave floor below the surface instead of on top.
  const RECIPES = {
    duel: { name: 'Duel', blurb: 'A fair fight for two: any theme, moderate everything, the odd mirrored map.',
      ranges: { rugged: [1, 3], caves: [0, 2], overhangs: [0, 2], platforms: [0, 1], props: [1, 2], hazards: [0, 2], water: [1, 1], rock: [0, 1] }, mirror: 0.2, spawn: 'sides', under: 0 },
    solo: { name: '1 Player', blurb: 'You against the computers: any theme, gentler ground and wind so a new player can find a shot.',
      ranges: { rugged: [1, 2], caves: [0, 2], overhangs: [0, 1], platforms: [0, 1], props: [1, 2], hazards: [0, 1], water: [1, 1], weather: [0, 2], rock: [0, 0] }, mirror: 0, spawn: 'mixed', under: 0 },
    ffa: { name: 'Free-for-all', blurb: 'Everyone for themselves: broken ground, more caves and platforms, hazards on.',
      ranges: { rugged: [2, 4], land: [1, 3], caves: [1, 3], overhangs: [1, 2], platforms: [0, 2], props: [1, 3], hazards: [1, 3], water: [1, 2], rock: [0, 1] }, mirror: 0, spawn: 'mixed', under: 0.15 },
    squads: { name: 'Squads', blurb: 'Crews of two to five a side: big maps with high ground, tunnels and somewhere to hide.',
      ranges: { height: [2, 3], rugged: [2, 4], land: [1, 3], caves: [1, 3], overhangs: [1, 3], platforms: [0, 2], props: [1, 3], hazards: [1, 2], water: [1, 2], rock: [0, 2] }, mirror: 0.15, spawn: 'any', under: 0.25 },
    teams: { name: 'Team battle', blurb: 'Five a side with one player per unit: a wide battlefield, each team starts together.',
      ranges: { height: [2, 3], rugged: [1, 3], land: [2, 3], caves: [1, 3], overhangs: [1, 2], platforms: [0, 2], props: [1, 2], hazards: [1, 2], water: [1, 1], rock: [0, 2] }, mirror: 0.3, spawn: 'sides', under: 0.2 },
  };
  const RECIPE_IDS = Object.keys(RECIPES);
  function roll(recipe, seed) {
    const Rc = RECIPES[recipe] || RECIPES.duel, r = rng(((seed >>> 0) ^ 0x51ED270B) >>> 0), pool = Rc.themes || THEME_IDS;
    const theme = pool[Math.floor(r() * pool.length)], s = Object.assign({}, THEMES[theme].set, { theme });
    for (const k of Object.keys(Rc.ranges || {})) { const [lo, hi] = Rc.ranges[k]; s[k] = lo + Math.floor(r() * (hi - lo + 1)); }
    s.symmetry = r() < (Rc.mirror || 0) ? 1 : 0;
    Object.assign(s, Rc.fixed || {});
    const out = clean(s); out.seed = 0; // seed 0: the layout follows the match seed
    return out;
  }

  // ---------- generate ----------
  function build(s, w, h, seed) {
    const th = THEMES[s.theme], c = { w, h, T: new Array(w * h).fill(AIR), r: rng(seed), s, th, lf: s.landform === 'auto' ? th.landform : s.landform, sx: w / 160, sy: h / 90, feats: [] };
    c.water = Math.round(h * (1 - WATER[s.water])); c.sky = Math.max(4, Math.round(h * 0.1));
    c.top = Math.round(h * HEIGHTS[s.height]); c.amp = h * RUGGED[s.rugged];
    LANDFORMS[c.lf].gen(c);
    for (let y = 0; y < c.sky; y++) for (let x = 0; x < w; x++) c.T[y * w + x] = AIR; // open sky band: room to lob over anything
    caves(c); overhangs(c); props(c); platforms(c);
    for (let y = 0; y < c.sky; y++) for (let x = 0; x < w; x++) c.T[y * w + x] = AIR;
    cleanup(c); hardRock(c);
    if (s.symmetry) mirror(c);
    hazards(c);
    return c;
  }
  // opts.w / opts.h: grid size (overrides the size setting; a game with a fixed screen passes its own).
  // opts.seed: used when the settings' seed is 0 (Wormsbound passes the match seed: a new layout every match).
  function generate(input, opts = {}) {
    const s = resolve(input), Z = SIZES[s.size], w = opts.w || Z.w, h = opts.h || Z.h;
    const seed = s.seed || (opts.seed >>> 0) || 1;
    let best = null;
    for (let t = 0; t < TRIES; t++) {
      const c = build(s, w, h, (seed + t * 0x9E3779B1) >>> 0);
      const m = { w, h, T: c.T, water: c.water }, st = check(m);
      const score = (st.ok ? 1000 : 0) + st.spawnRoom * 10 + st.fairness;
      if (!best || score > best.score) best = { c, st, score, t };
      if (st.ok) break;
    }
    const { c, st } = best, th = THEMES[s.theme];
    // id: what to store to rebuild this map (a preset id, or a share code whose seed 0 means "follow the match seed").
    // An unknown string fell back to Crater Hills above, so it is that preset.
    const pid = typeof input === 'string' && !decode(input) ? (PRESETS[input] ? input : 'hills') : null;
    return {
      v: 1, id: pid || encode(s), code: encode(Object.assign({}, s, { seed })), name: pid ? PRESETS[pid].name : th.name + ' (custom)',
      w, h, T: c.T, water: c.water, sky: c.sky, theme: s.theme, landform: c.lf, settings: s, seed,
      mirror: !!s.symmetry, windMul: WIND[s.weather], hazard: th.hazard, features: c.feats,
      stats: Object.assign({ tries: best.t + 1 }, st),
    };
  }

  // ---------- a quick picture (map lab, menus): sky, ground shaded by depth, materials, liquid, hazards ----------
  function draw(ctx, m, o = {}) {
    const k = o.cell || 4, L = THEMES[m.theme].look, W = m.w * k, H = m.h * k;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, L.sky[0]); g.addColorStop(0.42, L.sky[1]); g.addColorStop(0.7, L.sky[2]); g.addColorStop(1, L.sky[3]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < m.w; x++) {
      let depth = -1;
      for (let y = 0; y < m.h; y++) {
        const v = m.T[y * m.w + x]; if (!v) { depth = -1; continue; } depth++;
        const pair = v === ROCK ? L.rock : v === PROP ? L.prop : v === ACCENT ? L.accent : L.shades[depth === 0 ? 0 : depth === 1 ? 1 : depth < 5 ? 2 : depth < 10 ? 3 : depth < 18 ? 4 : 5];
        ctx.fillStyle = pair[(x + y) & 1]; ctx.fillRect(x * k, y * k, k, k);
      }
    }
    const lg = ctx.createLinearGradient(0, m.water * k, 0, H); lg.addColorStop(0, L.liquid.top); lg.addColorStop(1, L.liquid.deep);
    ctx.fillStyle = lg; ctx.fillRect(0, m.water * k, W, H - m.water * k);
    ctx.fillStyle = L.liquid.foam; ctx.fillRect(0, m.water * k, W, Math.max(1, k / 2));
    for (const f of m.features) {
      ctx.fillStyle = f.kind === 'barrel' ? L.hazard : '#3A3150'; ctx.strokeStyle = '#1E1A2B'; ctx.lineWidth = Math.max(1, k / 4);
      if (f.kind === 'barrel') { ctx.fillRect((f.x - 0.8) * k, (f.y - 2) * k, 1.6 * k + k, 2 * k); ctx.strokeRect((f.x - 0.8) * k, (f.y - 2) * k, 1.6 * k + k, 2 * k); }
      else { ctx.beginPath(); ctx.arc((f.x + 0.5) * k, (f.y - 0.6) * k, 0.9 * k, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#FFD34D'; ctx.fillRect((f.x + 0.3) * k, (f.y - 2) * k, Math.max(1, k / 3), k * 0.8); }
    }
    for (const [i, x] of (o.spawns || []).entries()) { // spawn markers: a pin per side
      const y = surfaceY(m, x); ctx.fillStyle = ['#FF7A30', '#22C3B5', '#FFD34D', '#B98CFF'][i % 4]; ctx.strokeStyle = '#1E1A2B'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo((x + 0.5) * k, y * k); ctx.lineTo((x - 1.2) * k, (y - 4) * k); ctx.lineTo((x + 2.2) * k, (y - 4) * k); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  // Where a game would put n sides: evenly spread, nearest good spawn, mirrored on a mirror map.
  function spawns(m, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (m.mirror && n % 2 === 0 && i >= n / 2) { out.push(m.w - 1 - out[n - 1 - i]); continue; }
      const x = spawnNear(m, m.w * (0.08 + 0.84 * (i + 0.5) / n)); out.push(x < 0 ? Math.round(m.w * (i + 0.5) / n) : x);
    }
    return out;
  }

  const MapGen = { AIR, DIRT, ROCK, PROP, ACCENT, SIZES, SIZE_IDS, THEMES, THEME_IDS, LANDFORMS, LANDFORM_IDS, SETTINGS, PRESETS, PRESET_IDS, MAP_IDS, RECIPES, RECIPE_IDS, WIND, LIQUIDS: LIQ,
    generate, resolve, encode, decode, defaults, randomSettings, roll, sizeFor, check, surfaceY, spawnOK, spawnNear, spawns, draw, rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = MapGen; else root.MapGen = MapGen;
})(typeof window !== 'undefined' ? window : globalThis);
