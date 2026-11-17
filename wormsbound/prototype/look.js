// Wormsbound: how the ground and the far background are painted. Looks only: nothing here changes the rules.
// © 2026 justaskjoe. All rights reserved.
//
// The rules still use a grid of solid-or-empty cells, 8 screen pixels each (engine.js). This file paints that grid
// at 4 x 4 "world pixels" a cell (so a world pixel is 2 screen pixels, drawn with hard edges):
//   - natural ground (dirt, rock, leaves) is blended between cell centres and cut at half, so stair-steps become
//     slopes and craters come out round; built things (girders, trunks, stems) keep their exact cells;
//   - the inside is banded by how deep it is, with pebbles, strata and a lit top-left edge; grass (or snow) lies
//     on anything that faces up; a dark outline runs round everything;
//   - air with ground above it shows a dim back wall, so caves read as insides;
//   - ground next to a crater is scorched.
// The drawn edge and the real edge differ by at most half a cell.
//
// WBLook.terrain(canvas, G, look)  paints G's ground into canvas (cols*4 x rows*4). Call it again whenever the ground
//                                  changes: it works out which cells changed and repaints only around them.
// WBLook.backdrop(canvas, look, seed, picture)  paints the far background, either from a picture or drawn.
(function (root) {
  const P = 4; // world pixels a cell
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgba = (s) => { const m = s.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const dark = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const css = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a == null ? 1 : a})`;
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const INK = [30, 26, 43];
  const MARGIN = 48; // world pixels: further than this from a change, nothing looks different
  const palettes = new WeakMap();
  function palette(look) {
    let p = palettes.get(look); if (p) return p;
    const sh = look.shades.map((q) => q.map(hex));
    p = { sh, rock: look.rock.map(hex), prop: look.prop.map(hex), acc: look.accent.map(hex), tuft: hex(look.tuft), snow: !!look.snow,
      ink: mix(dark(sh[5][1], 0.35), INK, 0.5), wall: dark(sh[5][1], 0.62), grassInk: mix(dark(sh[1][1], 0.45), INK, 0.35) };
    palettes.set(look, p); return p;
  }

  const states = new WeakMap();
  function terrain(canvas, G, look) {
    const cols = G.cols, rows = G.rows, W = cols * P, H = rows * P, key = G.seed + ':' + G.map + ':' + cols + 'x' + rows;
    let st = states.get(canvas);
    if (!st || st.key !== key) { // a new map: start again
      canvas.width = W; canvas.height = H;
      st = { key, cols, rows, W, H, T: new Uint8Array(cols * rows), burn: new Uint8Array(cols * rows), solid: new Uint8Array(W * H), mat: new Uint8Array(W * H),
        d: new Float32Array(W * H), up: new Uint16Array(W * H), cover: new Uint8Array(W * H), ctx: canvas.getContext('2d'), lights: [] };
      states.set(canvas, st); st.T.set(G.T); paint(st, look, 0, 0, W); return st;
    }
    // what changed since the last paint: blasted cells are scorched, filled ones are fresh
    let x0 = cols, x1 = -1, y0 = rows; const T = G.T, old = st.T;
    for (let i = 0; i < T.length; i++) if (T[i] !== old[i]) { const x = i % cols, y = (i / cols) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; st.burn[i] = T[i] ? 0 : 1; old[i] = T[i]; }
    if (x1 >= 0) paint(st, look, Math.max(0, x0 * P - MARGIN), Math.max(0, y0 * P - MARGIN), Math.min(W, (x1 + 1) * P + MARGIN));
    return st;
  }

  // Repaint columns x0..x1 from row y0 down to the bottom (a change can uncover everything under it).
  function paint(st, look, x0, y0, x1) {
    const { cols, rows, W, H, T, solid, mat, d, up, cover, burn } = st, C = palette(look);
    const cell = (x, y) => (x < 0 || x >= cols || y < 0) ? 0 : T[Math.min(rows - 1, y) * cols + x];
    const sol = (x, y) => cell(x, y) ? 1 : 0, nat = (x, y) => { const v = cell(x, y); return v && v !== 3 ? 1 : 0; };
    const blend = (f, fx, fy) => { const ax = Math.floor(fx), ay = Math.floor(fy), tx = fx - ax, ty = fy - ay; return (f(ax, ay) * (1 - tx) + f(ax + 1, ay) * tx) * (1 - ty) + (f(ax, ay + 1) * (1 - tx) + f(ax + 1, ay + 1) * tx) * ty; };
    // 1. the edge
    for (let py = y0; py < H; py++) for (let px = x0; px < x1; px++) {
      const cx = (px / P) | 0, cy = (py / P) | 0, own = cell(cx, cy), i = py * W + px;
      solid[i] = 0; mat[i] = 0;
      if (own === 3) { solid[i] = 1; mat[i] = 3; continue; }
      const fx = (px + 0.5) / P - 0.5, fy = (py + 0.5) / P - 0.5;
      if (blend(sol, fx, fy) <= 0.5 || (!own && blend(nat, fx, fy) <= 0.5)) continue;
      solid[i] = 1;
      let m = own; if (!m) for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const v = cell(cx + dx, cy + dy); if (v && v !== 3) { m = v; break; } }
      mat[i] = m || 1;
    }
    // 2. depth (distance to the nearest air), using what's already known just outside the columns being repainted
    for (let y = y0; y < H; y++) for (let x = x0; x < x1; x++) { const i = y * W + x; d[i] = solid[i] ? 1e4 : 0; }
    const relax = (i, j, c) => { if (d[j] + c < d[i]) d[i] = d[j] + c; };
    for (let y = y0; y < H; y++) for (let x = x0; x < x1; x++) { const i = y * W + x; if (!solid[i]) continue; if (x) relax(i, i - 1, 1); if (y) { relax(i, i - W, 1); if (x) relax(i, i - W - 1, 1.41); if (x < W - 1) relax(i, i - W + 1, 1.41); } }
    for (let y = H - 1; y >= y0; y--) for (let x = x1 - 1; x >= x0; x--) { const i = y * W + x; if (!solid[i]) continue; if (x < W - 1) relax(i, i + 1, 1); if (y < H - 1) { relax(i, i + W, 1); if (x < W - 1) relax(i, i + W + 1, 1.41); if (x) relax(i, i + W - 1, 1.41); } }
    //    how far below the surface straight up (+500 when there's hardly any air above: a seam, not a surface), and
    //    whether an air pixel has ground somewhere above it
    for (let x = x0; x < x1; x++) { let run = 0, air = 99, seen = 0; for (let y = 0; y < H; y++) { const i = y * W + x; if (solid[i]) { up[i] = run + (air < 7 ? 500 : 0); run++; seen = 1; } else { if (run) air = 0; air++; run = 0; cover[i] = seen; } } }
    //    which cells are near a blast (so the scorch check is only run where it can matter)
    const nearBurn = (cx, cy) => { for (let by = cy - 2; by <= cy + 2; by++) for (let bx = cx - 2; bx <= cx + 2; bx++) if (bx >= 0 && bx < cols && by >= 0 && by < rows && burn[by * cols + bx]) return true; return false; };
    // 3. colour
    const w = x1 - x0, h = H - y0, img = st.ctx.createImageData(w, h), q = img.data, { sh, rock, prop, acc, tuft, snow, ink, wall, grassInk } = C;
    const airAt = (x, y) => x < 0 || x >= W || y < 0 || y >= H ? 0 : !solid[y * W + x];
    let lastCell = -1, lastNear = false;
    for (let y = y0; y < H; y++) for (let x = x0; x < x1; x++) {
      const i = y * W + x, j = ((y - y0) * w + (x - x0)) * 4; let c, a = 255;
      if (!solid[i]) {
        if (!cover[i]) continue; // open sky: see through to the backdrop
        let near = 0; for (let k = 1; k <= 3; k++) if (!airAt(x - k * 4, y) || !airAt(x + k * 4, y) || !airAt(x, y + k * 4)) { near = 4 - k; break; }
        c = wall; a = 255 * (0.5 + near * 0.06 + (hash(x >> 2, y >> 2) < 0.14 ? 0.07 : 0));
      } else {
        const m = mat[i], dd = d[i], u = up[i] % 500, open = up[i] < 500, n = hash(x, y), nb = hash(x >> 1, y >> 1), edge = dd <= 1.2;
        const lit = dd < 3.2 && (airAt(x - 2, y - 2) || airAt(x, y - 3)) && !airAt(x + 1, y + 1);
        if (m === 2) c = edge ? ink : lit ? mix(rock[0], [255, 255, 255], 0.22) : (nb < 0.1 || ((x + y * 3 + (hash(x >> 3, 9) * 9 | 0)) % 23 === 0 && n < 0.7)) ? dark(rock[1], 0.82) : rock[(x >> 1 ^ y >> 1) & 1];
        else if (m === 3) c = edge ? INK : airAt(x, y - 2) ? mix(prop[0], [255, 255, 255], 0.38) : airAt(x, y + 2) ? dark(prop[1], 0.68) : (x % P === 1 && y % P === 2 && hash(x >> 2, y >> 2) > 0.55) ? dark(prop[1], 0.6) : prop[((x >> 3) + (y >> 3)) & 1];
        else if (m === 4) c = edge ? mix(dark(acc[1], 0.4), INK, 0.4) : lit ? mix(acc[0], [255, 255, 255], 0.4) : nb < 0.22 ? dark(acc[1], 0.8) : acc[(x >> 1 ^ y >> 1) & 1];
        else {
          const g = (snow ? 6 : 4) + Math.floor(hash(x >> 1, 77) * 3) + (hash(x >> 3, 5) > 0.7 ? 2 : 0); // how thick the grass (or snow) lies here
          if (open && u === 0) c = grassInk;
          else if (open && u === 1) c = tuft;
          else if (open && u < g) c = sh[0][nb < 0.3 ? 1 : 0];
          else if (open && u < g + 3 + Math.floor(hash(x, 31) * 3)) c = sh[1][nb < 0.35 ? 1 : 0];
          else if (edge) c = ink;
          else {
            const e = dd + (BAYER[(x & 3) + (y & 3) * 4] / 16 - 0.5) * 3.2 + (nb - 0.5) * 2.5, band = e < 7 ? 2 : e < 17 ? 3 : e < 32 ? 4 : 5;
            c = sh[band][0];
            if (lit) c = mix(c, [255, 255, 255], 0.16);
            else if (nb < 0.07) c = sh[band][1];                                                                             // pebbles
            else if (hash(x >> 2, y >> 2) > 0.965 && dd > 5) c = mix(sh[Math.max(2, band - 1)][0], [255, 255, 255], 0.08);   // a lighter stone
            else if (dd > 6 && ((y + Math.round(Math.sin(x * 0.045) * 4 + Math.sin(x * 0.013 + 2) * 5)) % 19) === 0 && n < 0.8) c = sh[Math.min(5, band + 1)][1]; // strata
          }
        }
        const cx = (x / P) | 0, cy = (y / P) | 0, ci = cy * cols + cx; if (ci !== lastCell) { lastCell = ci; lastNear = nearBurn(cx, cy); }
        if (lastNear) { // scorch: ground beside a crater is burnt, with a few embers still glowing
          let bd = 9;
          for (let by = cy - 2; by <= cy + 2; by++) for (let bx = cx - 2; bx <= cx + 2; bx++) if (bx >= 0 && bx < cols && by >= 0 && by < rows && burn[by * cols + bx]) { const ex = Math.max(bx * P - x, 0, x - (bx * P + P - 1)), ey = Math.max(by * P - y, 0, y - (by * P + P - 1)); bd = Math.min(bd, Math.hypot(ex, ey)); }
          if (bd < 8) { c = mix(c, [22, 16, 20], Math.max(0, 0.86 - bd * 0.1) * (n < 0.85 ? 1 : 0.5)); if (bd < 3 && n > 0.9) c = [255, 150, 60]; }
        }
      }
      q[j] = c[0]; q[j + 1] = c[1]; q[j + 2] = c[2]; q[j + 3] = a;
    }
    // grass blades (or snow) poking above the top surface of each column
    for (let x = x0; x < x1; x++) for (let y = Math.max(1, y0 + 2); y < H; y++) { const i = y * W + x; if (solid[i]) { if (!solid[i - W] && up[i] < 500 && mat[i] === 1 && hash(x, 99) > (snow ? 0.8 : 0.62)) { const j = ((y - 1 - y0) * w + (x - x0)) * 4; q[j] = tuft[0]; q[j + 1] = tuft[1]; q[j + 2] = tuft[2]; q[j + 3] = 255; if (hash(x, 98) > 0.75 && !solid[i - 2 * W]) { const k = j - w * 4; q[k] = tuft[0]; q[k + 1] = tuft[1]; q[k + 2] = tuft[2]; q[k + 3] = 255; } } break; } }
    st.ctx.putImageData(img, x0, y0);
    // things that glow (mushrooms, crystals, lava blocks): the screen adds a soft light on each
    st.lights = []; if (look.glow || look.embers) for (let cy = 0; cy < rows; cy += 2) for (let cx = 0; cx < cols; cx += 2) if (T[cy * cols + cx] === 4 && hash(cx, cy) > 0.45) st.lights.push([cx + 0.5, cy + 0.5]);
  }

  // ---------- the far background: a picture if there is one, otherwise drawn. Painted small, shown at 2x. ----------
  function backdrop(canvas, look, seed, picture) {
    const W = canvas.width, H = canvas.height, b = canvas.getContext('2d'), sd = (seed >>> 0) % 9973;
    if (picture) { b.imageSmoothingEnabled = false; const k = Math.max(W / picture.width, H / picture.height), w = picture.width * k, h = picture.height * k; b.drawImage(picture, (W - w) / 2, (H - h) / 2, w, h); }
    else {
      const sky = look.sky.map(hex), dim = (sky[0][0] + sky[0][1] + sky[0][2]) < 170, night = (sky[3][0] + sky[3][1] + sky[3][2]) < 330 || !!look.moon;
      const skyAt = (t) => t < 0.42 ? mix(sky[0], sky[1], t / 0.42) : t < 0.7 ? mix(sky[1], sky[2], (t - 0.42) / 0.28) : mix(sky[2], sky[3], (t - 0.7) / 0.3);
      const sx = Math.round(W * (0.3 + hash(sd, 1) * 0.4)), sy = Math.round(H * (look.embers ? 0.52 : 0.37)), warm = look.embers ? [255, 150, 70] : mix(sky[3], [255, 255, 255], 0.5), sun = look.bg !== 'cave' && (!night || look.embers);
      const img = b.createImageData(W, H), px = img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dz = BAYER[(x & 3) + (y & 3) * 4] / 16 - 0.5, t = y / H + dz / 26; let c = skyAt(Math.max(0, Math.min(1, Math.round(t * 26) / 26))); const i = (y * W + x) * 4;
        if (sun) { const g = Math.max(0, 1 - Math.hypot(x - sx, (y - sy) * 1.15) / (look.embers ? 150 : 190)); c = mix(c, warm, Math.round((g * g * (look.embers ? 0.5 : 0.8) + dz * 0.05) * 14) / 14); }
        px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
      }
      b.putImageData(img, 0, 0);
      if (dim) for (let k = 0; k < 150; k++) { const x = Math.floor(hash(k, 7 + sd) * W), y = Math.floor(hash(k, 13) * H * 0.6), a = 0.25 + hash(k, 3) * 0.6; b.fillStyle = `rgba(255,245,225,${a})`; b.fillRect(x, y, 1, 1); if (hash(k, 5) > 0.9) { b.fillRect(x - 1, y, 3, 1); b.fillRect(x, y - 1, 1, 3); } }
      const disc = (cx, cy, r, col, bite) => { b.fillStyle = col; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r && (!bite || (x - r * 0.42) * (x - r * 0.42) + (y + r * 0.25) * (y + r * 0.25) > r * r * 0.7)) b.fillRect(cx + x, cy + y, 1, 1); };
      if (sun && !look.embers) disc(sx, sy, 20, css(mix(sky[3], [255, 255, 255], 0.75)));
      if (night && !look.embers && look.bg !== 'cave') disc(Math.round(W * 0.78), Math.round(H * 0.18), 14, 'rgb(232,232,248)', true);
      const ridge = (k, base, amp, col) => {
        b.fillStyle = col;
        for (let x = 0; x < W; x++) {
          let h;
          if (look.bg === 'peaks') { const p = (x + k * 61 + sd) / (58 - k * 14); h = Math.abs((p % 2) - 1) * amp * 1.5 + Math.abs(((p * 2.7) % 2) - 1) * amp * 0.5; }
          else if (look.bg === 'blocky') { const s = Math.floor((x + k * 37 + sd) / (13 + k * 5)); h = (hash(s, 40 + k) * 0.9 + 0.1) * amp * 1.4; if (hash(s, 90 + k) > 0.8) h += amp * 0.5; }
          else h = (Math.sin(x * 0.017 + k * 2.1 + sd) + Math.sin(x * 0.041 + k * 5.3) * 0.5 + Math.sin(x * 0.007 + k)) * amp * 0.45 + amp;
          const top = Math.round(base - h);
          if (look.bg === 'cave') { const wd = 9 + k * 4, s = Math.floor((x + k * 23 + sd) / wd), len = Math.round((hash(s, 60 + k) ** 2) * amp * 2.6); b.fillRect(x, 0, 1, Math.max(4, len - Math.abs(((x + k * 23 + sd) % wd) - wd / 2) * 3)); b.fillRect(x, H - Math.round(h * 0.7), 1, H); }
          else b.fillRect(x, top, 1, H - top);
        }
      };
      if (look.bg === 'float') for (let i = 0; i < 9; i++) { const x = Math.floor(hash(i, 51 + sd) * W), y = Math.floor(H * (0.42 + hash(i, 52) * 0.36)), w = 20 + Math.floor(hash(i, 53) * 45); b.fillStyle = look.ridges[i & 1]; for (let r = 0; r < w * 0.6; r++) { const ww = Math.round(w * (1 - r / (w * 0.6))); b.fillRect(Math.round(x - ww / 2 + r * 0.1), y + r, ww, 1); } }
      else { ridge(0, H * 0.6, 34, look.ridges[0]); ridge(1, H * 0.74, 26, look.ridges[1]); }
      if (look.windows) for (let i = 0; i < 90; i++) { b.fillStyle = `rgba(255,214,120,${0.25 + hash(i, 81) * 0.5})`; b.fillRect(Math.floor(hash(i, 82 + sd) * W), Math.floor(H * (0.6 + hash(i, 83) * 0.34)), 1, 2); }
    }
    if (look.snow) for (let k = 0; k < 160; k++) { b.fillStyle = `rgba(255,255,255,${0.3 + hash(k, 71) * 0.5})`; b.fillRect(Math.floor(hash(k, 72 + sd) * W), Math.floor(hash(k, 73) * H), 1, 1); }
    if (look.embers) for (let k = 0; k < 90; k++) { b.fillStyle = `rgba(255,${150 + Math.floor(hash(k, 63) * 90)},60,${0.35 + hash(k, 64) * 0.5})`; b.fillRect(Math.floor(hash(k, 61 + sd) * W), Math.floor(H * (0.35 + hash(k, 62) * 0.65)), 1, 1); }
    if (look.glow) for (let k = 0; k < 60; k++) { b.fillStyle = `rgba(184,240,112,${0.15 + hash(k, 66) * 0.4})`; b.fillRect(Math.floor(hash(k, 67 + sd) * W), Math.floor(H * (0.2 + hash(k, 68) * 0.78)), 1, 1); }
  }

  const WBLook = { P, terrain, backdrop };
  if (typeof module !== 'undefined' && module.exports) module.exports = WBLook; else root.WBLook = WBLook;
})(typeof window !== 'undefined' ? window : globalThis);
