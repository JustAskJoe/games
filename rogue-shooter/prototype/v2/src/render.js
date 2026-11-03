// ─── Battle zones (art/sprites/biomes) ───
const ARENA = 1200;
const SHADOW_MUL = 'rgb(158,168,204)';   // art-direction: shadows multiply by 0.62, 0.66, 0.80
const ZONE_LOOK = {
  meadow: { path: '#d2a96c', clouds: true },
  forest: { path: '#5a4426', canopy: true },
  caverns: { vignette: 0.7 },
  volcanic: { vignette: 0.45, bottomGlow: '#e05a10' },
  shadow: { path: '#3a3050', vignette: 0.8, fog: true },
  void: { vignette: 0.6 }
};
const HAZARD_KIND = { 'Pond': 'block', 'Fallen log': 'block', 'Lava pool': 'lava', 'Void pit': 'pit', 'Ruined arch': 'arch' };
let obstacles = [], blockers = [], zoneHazards = [], lights = [], arenaZone = null, groundCanvas = null;
function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function tileHash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) & 0x7fffffff;
}
function obstacleCrop(zid, ob) { return { img: IMG['biomes/' + zid + '_obstacles.png'], box: ob.box }; }

function buildArena(zid) {
  arenaZone = zid;
  const z = BIO.zones[zid];
  obstacles = []; blockers = []; zoneHazards = []; lights = [];
  const sp = 112, weights = z.obstacles.map(o => HAZARD_KIND[o.name] ? 0.45 : 1);
  const tot = weights.reduce((a, b) => a + b, 0);
  for (let gy = -ARENA + sp / 2; gy < ARENA; gy += sp) for (let gx = -ARENA + sp / 2; gx < ARENA; gx += sp) {
    if (Math.random() > 0.55) continue;
    const x = Math.round(gx + rnd(-40, 40)), y = Math.round(gy + rnd(-40, 40));
    if (Math.hypot(x, y) < 90 || Math.abs(x) > ARENA - 40 || Math.abs(y) > ARENA - 40) continue;
    let r = Math.random() * tot, ob = z.obstacles[0];
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { ob = z.obstacles[i]; break; } }
    const [, , w, h] = ob.box, kind = HAZARD_KIND[ob.name];
    if (ob.glow) lights.push({ x, y: kind ? y : y - h / 2, r: Math.max(w, h) * 0.8, color: ob.glow });
    if (!kind) { obstacles.push({ x, y, r: ob.radius, ob, zid }); continue; }
    if (kind === 'arch') {
      obstacles.push({ x, y, r: 0, ob, zid, arch: true });
      obstacles.push({ x: x - w / 2 + 5, y, r: 6, hiddenPart: true });
      obstacles.push({ x: x + w / 2 - 5, y, r: 6, hiddenPart: true });
      continue;
    }
    const g = { x, y, rx: w * 0.42, sq: w / h, ob, zid, kind };
    if (kind === 'block') blockers.push({ x, y, rx: w * 0.44, ry: h * (ob.name === 'Fallen log' ? 0.3 : 0.38) });
    if (kind === 'lava') { g.hurts = true; }
    if (kind === 'pit') { g.hurts = true; g.pull = true; }
    zoneHazards.push(g);
  }
  groundCanvas = buildGround(zid);
}

// The whole arena floor, drawn once per round: tile, soft breakup in hard steps, path, details, ground hazards.
function buildGround(zid) {
  const S = ARENA * 2, c = document.createElement('canvas'); c.width = S; c.height = S;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = g.createPattern(IMG['biomes/' + zid + '_ground.png'], 'repeat'); g.fillRect(0, 0, S, S);
  // breakup: smooth value noise, floored to 4 levels, multiplied in
  const cell = 52, n = Math.ceil(S / cell) + 2, grid = new Float32Array(n * n);
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random();
  const q = 4, bw = S / q, bh = S / q, img = g.createImageData(bw, bh), d = img.data;
  const sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < bh; y++) {
    const fy = y * q / cell, iy = Math.floor(fy), ty = sm(fy - iy);
    for (let x = 0; x < bw; x++) {
      const fx_ = x * q / cell, ix = Math.floor(fx_), tx = sm(fx_ - ix);
      const a = grid[iy * n + ix], b = grid[iy * n + ix + 1], c2 = grid[(iy + 1) * n + ix], d2 = grid[(iy + 1) * n + ix + 1];
      const v = (a + (b - a) * tx) * (1 - ty) + (c2 + (d2 - c2) * tx) * ty;
      const m = 0.93 + Math.floor(Math.min(0.999, v) * 3) / 3 * 0.07;
      const o = (y * bw + x) * 4; d[o] = d[o + 1] = d[o + 2] = Math.round(m * 255); d[o + 3] = 255;
    }
  }
  const bc = document.createElement('canvas'); bc.width = bw; bc.height = bh; bc.getContext('2d').putImageData(img, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.drawImage(bc, 0, 0, S, S); g.globalCompositeOperation = 'source-over';
  // winding path
  const look = ZONE_LOOK[zid];
  if (look.path) {
    const [pr, pg, pb] = hexRgb(look.path), off = rnd(-60, 60);
    for (let x = 0; x < S; x++) {
      const wx = x - ARENA, cy = ARENA + off + 22 * Math.sin(wx / 60) - wx * 0.12, w = 9 + 2 * Math.sin(wx / 7);
      g.fillStyle = look.path; g.fillRect(x, Math.round(cy - w), 1, Math.round(w * 2));
      for (let y = Math.round(cy - 11); y <= cy + 11; y++) {
        const dd = Math.abs(y - cy), h = tileHash(x, y) % 100;
        if (dd >= w && dd < 11 && h < 30) { g.fillStyle = look.path; g.fillRect(x, y, 1, 1); }
        if (dd >= 7 && dd < w + 1 && h < 60) { g.fillStyle = 'rgb(' + (pr * 0.82 | 0) + ',' + (pg * 0.82 | 0) + ',' + (pb * 0.82 | 0) + ')'; g.fillRect(x, y, 1, 1); }
        else if (dd < w && h > 96) { g.fillStyle = 'rgb(' + Math.min(255, pr * 1.12 | 0) + ',' + Math.min(255, pg * 1.12 | 0) + ',' + Math.min(255, pb * 1.12 | 0) + ')'; g.fillRect(x, y, 1, 1); }
      }
    }
  }
  // scattered details (no collision)
  const z = BIO.zones[zid], dimg = IMG['biomes/' + zid + '_details.png'];
  for (let y = 0; y < S; y += 26) for (let x = 0; x < S; x += 26) {
    const h = tileHash(x / 26 | 0, y / 26 | 0); if (h % 3) continue;
    const det = z.details[h % z.details.length], [bx, by, bw2, bh2] = det.box;
    g.drawImage(dimg, bx, by, bw2, bh2, x + (h >> 3) % 20, y + (h >> 7) % 20, bw2, bh2);
  }
  // flat hazards lie on the ground
  for (const zh of zoneHazards) { const { img: im, box } = obstacleCrop(zh.zid, zh.ob); g.drawImage(im, box[0], box[1], box[2], box[3], Math.round(zh.x + ARENA - box[2] / 2), Math.round(zh.y + ARENA - box[3] / 2), box[2], box[3]); }
  // arena rim
  g.fillStyle = 'rgba(20,14,8,0.55)'; g.fillRect(0, 0, S, 6); g.fillRect(0, S - 6, S, 6); g.fillRect(0, 0, 6, S); g.fillRect(S - 6, 0, 6, S);
  return c;
}

function insideBlocker(b, x, y, r) { return Math.hypot((x - b.x) / (b.rx + r), (y - b.y) / (b.ry + r * 0.6)) < 1; }
function pushOut(ent, er) {
  for (const o of obstacles) {
    if (!o.r) continue;
    const dx = ent.x - o.x, dy = ent.y - o.y, d = Math.hypot(dx, dy), gap = o.r + er;
    if (d < gap && d > 0.01) { ent.x = o.x + dx / d * gap; ent.y = o.y + dy / d * gap; }
  }
  for (const b of blockers) {
    const rx = b.rx + er, ry = b.ry + er * 0.6, dx = (ent.x - b.x) / rx, dy = (ent.y - b.y) / ry, d = Math.hypot(dx, dy);
    if (d < 1 && d > 0.001) { ent.x = b.x + dx / d * rx; ent.y = b.y + dy / d * ry; }
  }
}

// ─── Camera ───
function updateCamera(dt) { camera.x += (player.x - camera.x) * Math.min(1, 6 * dt); camera.y += (player.y - 16 - camera.y) * Math.min(1, 6 * dt); }
let shakeOX = 0, shakeOY = 0;
function worldToCanvas(wx, wy) { return { x: Math.round(wx - camera.x + W() / 2 + shakeOX), y: Math.round(wy - camera.y + H() / 2 + shakeOY) }; }
function onScreen(p, m) { return p.x > -m && p.x < W() + m && p.y > -m && p.y < H() + m * 1.6; }

// ─── Light layers (scenes.py): hard steps, never smooth gradients ───
const _glows = {};
function glowSprite(color, r) {
  const k = color + r; if (_glows[k]) return _glows[k];
  const w = Math.ceil(r * 2), h = Math.ceil(r * 1.4), c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), im = x.createImageData(w, h), d = im.data, [cr, cg, cb] = hexRgb(color);
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const dd = Math.hypot(xx - w / 2, (y - h / 2) / 0.7) / r, f = Math.floor(Math.max(0, Math.min(1, 1 - dd)) * 4) / 4 * 0.35;
    const o = (y * w + xx) * 4; d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = Math.round(f * 255);
  }
  x.putImageData(im, 0, 0); return (_glows[k] = c);
}
let _vig = null;
function vignetteCanvas(k) {
  const w = W(), h = H(), key = w + 'x' + h + ':' + k;
  if (_vig && _vig.key === key) return _vig.c;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), im = x.createImageData(w, h), d = im.data, mul = [0.5, 0.5, 0.6];
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const dd = Math.hypot((xx - w / 2) / (w / 2), (y - h / 2) / (h / 2)), f = Math.floor(Math.max(0, Math.min(1, (dd - 0.75) / 0.5)) * 3) / 3 * k;
    const o = (y * w + xx) * 4; for (let ch = 0; ch < 3; ch++) d[o + ch] = Math.round(255 * (1 - f * (1 - mul[ch]))); d[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); _vig = { key, c }; return c;
}
let _blobs = null;
function blobShapes() {
  if (_blobs) return _blobs;
  _blobs = [];
  for (let i = 0; i < 3; i++) {
    const w = 170 + i * 30, h = 60 + i * 8, c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = '#fff';
    const el = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fill(); };
    el(w / 2, h / 2, w * 0.3, h * 0.3);
    for (let k = 0; k < 9; k++) { const a = Math.random() * TAU, dd = Math.random() * 0.6; el(w / 2 + Math.cos(a) * w * 0.5 * dd * 0.6, h / 2 + Math.sin(a) * h * 0.5 * dd * 0.6, w * 0.5 * (0.3 + Math.random() * 0.25), h * 0.5 * (0.35 + Math.random() * 0.3)); }
    // hard-edge the anti-aliased fill
    const im = x.getImageData(0, 0, w, h); for (let p = 3; p < im.data.length; p += 4) im.data[p] = im.data[p] > 110 ? 255 : 0; x.putImageData(im, 0, 0);
    _blobs.push(c);
  }
  return _blobs;
}
function tinted(c, color) {
  const k = '_t' + color; if (c[k]) return c[k];
  const t = document.createElement('canvas'); t.width = c.width; t.height = c.height;
  const x = t.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, t.width, t.height);
  return (c[k] = t);
}
function drawLight(t) {
  const look = ZONE_LOOK[arenaZone] || {}, w = W(), h = H();
  if (look.clouds) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.3;
    const bl = blobShapes();
    for (let i = 0; i < 6; i++) {
      const wx = ((i * 431 + t * 7) % 1600) - 800 + Math.floor(camera.x / 1600) * 1600, wy = (i * 263 % 900) - 450 + Math.floor(camera.y / 900) * 900;
      for (const ox of [-1600, 0, 1600]) for (const oy of [-900, 0, 900]) {
        const p = worldToCanvas(wx + ox, wy + oy), s = bl[i % 3];
        if (p.x + s.width < 0 || p.x > w || p.y + s.height < 0 || p.y > h) continue;
        ctx.drawImage(tinted(s, SHADOW_MUL), Math.round(p.x), Math.round(p.y));
      }
    }
    ctx.restore();
  }
  if (look.canopy) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(230,230,230)'; ctx.fillRect(0, 0, w, h); ctx.restore();
    const bl = blobShapes();
    for (let i = 0; i < 8; i++) {
      const wx = (i * 517 % 1400) - 700 + Math.floor(camera.x / 1400) * 1400, wy = (i * 331 % 800) - 400 + Math.floor(camera.y / 800) * 800;
      for (const ox of [-1400, 0, 1400]) for (const oy of [-800, 0, 800]) {
        const p = worldToCanvas(wx + ox, wy + oy), s = bl[i % 3];
        if (p.x + s.width < 0 || p.x > w || p.y + s.height < 0 || p.y > h) continue;
        ctx.globalAlpha = 0.12; ctx.drawImage(tinted(s, '#b6e07e'), Math.round(p.x), Math.round(p.y));
      }
    }
    ctx.globalAlpha = 1;
  }
  for (const l of lights) {
    const p = worldToCanvas(l.x, l.y), gs = glowSprite(l.color, Math.round(l.r));
    if (p.x + gs.width < 0 || p.x - gs.width > w || p.y + gs.height < 0 || p.y - gs.height > h) continue;
    ctx.drawImage(gs, Math.round(p.x - gs.width / 2), Math.round(p.y - gs.height / 2));
  }
  if (look.bottomGlow) {
    ctx.fillStyle = look.bottomGlow;
    for (let s = 1; s <= 4; s++) { ctx.globalAlpha = 0.07; ctx.fillRect(0, Math.round(h * 0.7 + (s - 1) * h * 0.075), w, h); }
    ctx.globalAlpha = 1;
  }
  if (look.fog) {
    ctx.fillStyle = '#8a7aa2';
    for (const [cy0, k, ph] of [[0.26, 0.16, 0], [0.71, 0.12, 2]]) {
      for (let x = 0; x < w; x += 2) {
        const wx = x + camera.x + t * 4;
        if (Math.sin(wx / 53 + ph * 3) <= -0.55) continue;
        const c = h * cy0 + 6 * Math.sin(wx / 37 + ph) + 3 * Math.sin(wx / 11 + ph * 2), ww = 8 + 4 * Math.sin(wx / 23 + ph);
        ctx.globalAlpha = k; ctx.fillRect(x, Math.round(c - ww), 2, Math.round(ww * 2));
        ctx.globalAlpha = k * 0.6; ctx.fillRect(x, Math.round(c - ww * 0.45), 2, Math.round(ww * 0.9));
      }
    }
    ctx.globalAlpha = 1;
  }
  if (look.vignette) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(vignetteCanvas(look.vignette), 0, 0); ctx.restore(); }
}

// ─── World ───
function drawGround() {
  ctx.fillStyle = '#140e08'; ctx.fillRect(0, 0, W(), H());
  if (!groundCanvas) return;
  const sx = Math.round(camera.x - W() / 2 - shakeOX + ARENA), sy = Math.round(camera.y - H() / 2 - shakeOY + ARENA);
  const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(ARENA * 2, sx + W()), y1 = Math.min(ARENA * 2, sy + H());
  if (x1 > x0 && y1 > y0) ctx.drawImage(groundCanvas, x0, y0, x1 - x0, y1 - y0, x0 - sx, y0 - sy, x1 - x0, y1 - y0);
}
function drawObstacle(o) {
  if (o.hiddenPart) return;
  const p = worldToCanvas(o.x, o.y), [bx, by, bw, bh] = o.ob.box;
  if (!onScreen(p, bw)) return;
  const floats = o.ob.name === 'Floating rock';
  if (!o.arch) drawShadow(p.x, p.y + (floats ? 6 : -2), bw * 0.8, floats);
  const bob = floats ? Math.round(Math.sin(gameClock * 1.5 + o.x) * 1) : 0;
  blit(IMG['biomes/' + o.zid + '_obstacles.png'], bx, by, bw, bh, p.x - (bw >> 1), p.y - bh + bob, false);
}
function enemyRow(e) {
  const rows = e.art.rows;
  if (e.key === 'slime') return Math.max(0, rows.indexOf(arenaZone + ' front'));
  const i = rows.indexOf(e.view); return i < 0 ? 0 : i;
}
function enemyCols(e) {
  const a = e.art, hasAtk = a.columns.includes('a0');
  if (hasAtk && e.act && e.act !== 'growl' && e.act !== 'charge') return 'a' + animIndex(a.timing_ms.attack, e.actT, false);
  if (hasAtk && e.act === 'growl') return 'a0';
  if (hasAtk && e.act === 'charge') return 'a2';
  if (e.tier && e.charging && e.chargeT > 0.5 && hasAtk) return 'a0';
  return 'm' + (Math.floor(e.t * 1000 / a.timing_ms.move) % a.move_frames);   // move is ms per frame
}
function drawEnemyUnder(e) {
  const p = worldToCanvas(e.x, e.y);
  if (e.spawnT < SPAWN_DUR) return;
  if (e.def.fear) { const inf = extraInfo(e.art, 'Fear aura'); drawExtra('enemies', inf, Math.floor(e.t / 0.2) % inf.count, p.x, p.y, { alpha: 0.9 }); }
  if (e.def.gravity) { const inf = extraInfo(e.art, 'Gravity well'); drawExtra('enemies', inf, Math.floor(e.t / 0.2) % inf.count, p.x, p.y + 2); }
}
function drawEnemy(e) {
  const p = worldToCanvas(e.x, e.y), [fw, fh] = e.art.frame;
  if (!onScreen(p, fw)) return;
  if (e.spawnT < SPAWN_DUR) {
    drawStrip('combat', 'enemy-spawn', playStrip('combat', 'enemy-spawn', e.spawnT, false), p.x, p.y + 4, { anchor: 'feet' });
    if (e.spawnT < SPAWN_DUR * 0.7) return;
  }
  const floats = e.art.floats;
  let alpha = e.alpha;
  if (e.hidden) alpha = Math.floor(e.t * 6) % 5 === 0 ? 0.35 : 0.1;
  if (e.spawnT < SPAWN_DUR) alpha *= 0.5;
  drawShadow(p.x, p.y, fw * (e.tier ? 0.8 : 1), floats);
  const col = enemyCol(e, enemyCols(e)), row = enemyRow(e);
  const bob = floats ? Math.round(Math.sin(e.t * 4) * 1) : 0, jit = e.stunT > 0 ? (Math.floor(e.t * 20) % 2 ? 1 : -1) : 0;
  if (alpha < 1) { ctx.save(); ctx.globalAlpha = alpha; }
  drawFrame(IMG[e.dir + '/' + e.art.file], fw, fh, col, row, p.x + jit, p.y + bob, e.flip, e.hitFlash > 0 && options.flashes);
  if (alpha < 1) ctx.restore();
  if (e.hexT > 0) { ctx.fillStyle = '#d050c0'; const hx = p.x, hy = p.y - fh - 3 + bob; ctx.fillRect(hx - 1, hy - 2, 3, 1); ctx.fillRect(hx - 2, hy - 1, 5, 1); ctx.fillRect(hx - 1, hy, 3, 1); }
  if (!e.tier && e.def.tough && e.hp < e.maxHp) {
    const bw = Math.max(16, Math.round(fw * 0.7)), y = Math.round(p.y - fh - 4 + bob);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(p.x - (bw >> 1) - 1, y - 1, bw + 2, 4);
    ctx.fillStyle = '#c0402f'; ctx.fillRect(p.x - (bw >> 1), y, Math.max(1, Math.round(bw * e.hp / e.maxHp)), 2);
  }
}
function drawHero() {
  const p = worldToCanvas(player.x, player.y), id = selectedCharId;
  if (state === 'dying' || state === 'dead') {
    const key = id + '-death', i = playStrip('combat', key, dyingT, false);
    const fade = Math.max(0, Math.min(1, (stripDur('combat', key) + 0.6 - dyingT) / 0.6));
    drawShadow(p.x, p.y, 22, false);
    drawStrip('combat', key, i, p.x, p.y, { anchor: 'feet', flip: player.flip, alpha: fade });
    return;
  }
  if (player.invT > 0 && player.hurtT === null && !player.ability && Math.floor(player.invT * 12) % 2 === 0) return;
  drawShadow(p.x, p.y, 18, false);
  if (player.hurtT !== null && !player.ability) {
    const key = id + '-hurt-' + player.hurtView;
    drawStrip('combat', key, playStrip('combat', key, player.hurtT, false), p.x, p.y, { anchor: 'feet', flip: player.hurtView === 'side' && player.hurtFlip });
    return;
  }
  const img = IMG['heroes/' + id + '.png'];
  if (player.ability) {
    const ab = player.ability, i = animIndex(HJ.timing_ms.ability, ab.t, false), row = VIEWS.indexOf(ab.view);
    const at = HJ.heroes[id].ability_at[ab.view][i], ax = ab.flip ? -at[0] : at[0];
    const fxImg = IMG['heroes/' + id + '_ability_fx.png'], fxX = p.x - 64 - ax, fxY = p.y - 78 - at[1];
    blit(fxImg, i * 128, row * 112, 128, 112, fxX, fxY, ab.flip);
    drawFrame(img, 32, 44, 8 + i, row, p.x, p.y, ab.flip);
    blit(fxImg, (i + 3) * 128, row * 112, 128, 112, fxX, fxY, ab.flip);
    return;
  }
  if (player.atk) {
    const a = player.atk, i = animIndex(HJ.timing_ms.attack, a.t / a.k, false), row = VIEWS.indexOf(a.view), fxImg = IMG['heroes/' + id + '_fx.png'];
    blit(fxImg, i * 96, row * 88, 96, 88, p.x - 48, p.y - 68, a.flip);
    drawFrame(img, 32, 44, 5 + i, row, p.x, p.y, a.flip);
    blit(fxImg, (i + 3) * 96, row * 88, 96, 88, p.x - 48, p.y - 68, a.flip);
    return;
  }
  const col = player.moving ? 1 + Math.floor(player.walkT / 0.15) % 4 : 0;
  drawFrame(img, 32, 44, col, VIEWS.indexOf(player.view), p.x, p.y, player.flip);
}

// ─── Weapons and projectiles ───
const BULLET_COL = { knight: ['#f0a040', '#ffe0a0'], mage: ['#a070e0', '#e0c8ff'], marksman: ['#4a9ad8', '#c8ecff'], rogue: ['#5ac860', '#e0ffe0'], witch: ['#d050c0', '#ffd0f4'] };
function drawBullet(b) {
  const p = worldToCanvas(b.x, b.y), [c1, c2] = BULLET_COL[selectedCharId], gold = b.crit && b.kind !== 'focus';
  const main = gold ? '#ffcc44' : c1;
  ctx.fillStyle = '#2b1d14';
  if (b.kind === 'bolt') {
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6); ctx.fillStyle = main; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); ctx.fillStyle = c2; ctx.fillRect(p.x - 1, p.y - 2, 2, 2);
  } else if (b.kind === 'pierce' || b.kind === 'focus' || b.kind === 'dagger') {
    const a = Math.atan2(b.vy, b.vx), len = b.kind === 'focus' ? 14 : b.kind === 'dagger' ? 5 : 8, wid = b.kind === 'focus' ? 3 : 1;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(snapAngle(a));
    ctx.fillRect(-len, -wid - 1, len * 2, wid * 2 + 2);
    ctx.fillStyle = b.kind === 'focus' ? '#ffcc44' : main; ctx.fillRect(-len + 1, -wid, len * 2 - 2, wid * 2);
    ctx.fillStyle = c2; ctx.fillRect(len - 4, -wid, 3, wid * 2);
    ctx.restore();
  }
}
function drawBlades() {
  if (!player.weapons.orbital) return;
  const piece = stripPiece(player.evolvedWeapons.orbital ? 'sawblade-tornado' : player.altEvo && player.altEvo.orbital ? 'phantom-edge' : 'orbital-blades', 0);
  for (const bp of bladePositions()) { const p = worldToCanvas(bp.x, bp.y); drawPiece(piece, p.x, p.y, bp.a * 3 + gameClock * 8); }
}
function drawMissile(m) { const p = worldToCanvas(m.x, m.y); drawPiece(stripPiece('homing-missiles', 0), p.x, p.y, m.angle); }
function drawLightning(b) {
  const s = CJ['chain-lightning'], img = IMG['combat/chain-lightning.png'], fi = Math.min(s.frames - 1, Math.floor(b.t / 0.07));
  for (let i = 0; i < b.pts.length - 1; i++) {
    const a = worldToCanvas(b.pts[i].x, b.pts[i].y), c = worldToCanvas(b.pts[i + 1].x, b.pts[i + 1].y);
    const len = Math.hypot(c.x - a.x, c.y - a.y), ang = Math.atan2(c.y - a.y, c.x - a.x);
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(snapAngle(ang));
    for (let d = 0; d < len; d += s.w) { const w = Math.min(s.w, Math.ceil(len - d)); ctx.drawImage(img, fi * s.w, 0, w, s.h, d, -(s.h >> 1), w, s.h); }
    ctx.restore();
  }
}
function drawFirePatch(f) {
  const key = player.evolvedWeapons.fireTrail ? 'hellfire' : 'fire-trail', s = CJ[key], img = IMG['combat/' + key + '.png'];
  const age = 1 - f.life / f.maxLife, q = Math.min(3, Math.floor((1 - age) * 4)), fi = Math.floor(gameClock / 0.11 + f.x) % s.frames;
  const cw = 25, p = worldToCanvas(f.x, f.y);
  ctx.save(); if (f.life < 0.6) ctx.globalAlpha = f.life / 0.6;
  ctx.drawImage(img, fi * s.w + q * cw, 0, cw, s.h, p.x - 12, p.y - s.h + 4, cw, s.h);
  ctx.restore();
}
function drawFrostPatch(f) {
  const p = worldToCanvas(f.x, f.y), i = Math.floor(gameClock / 0.26) % 3;
  drawStrip('combat', 'frost-patch', i, p.x, p.y, { alpha: Math.min(1, f.life / 1.2) * 0.9 });
}
function drawPickup(pk) {
  const p = worldToCanvas(pk.x, pk.y), s = CJ[pk.key];
  if (!onScreen(p, 20)) return;
  drawShadow(p.x, p.y, s.w * 0.9, true);
  drawStrip('combat', pk.key, playStrip('combat', pk.key, pk.t, true), p.x, p.y + 2, { anchor: 'feet' });
}
function drawEnemyProj(pr) {
  const p = worldToCanvas(pr.x, pr.y);
  if (pr.extra) { drawExtra(pr.dirKey, pr.extra, Math.floor(gameClock / 0.12) % pr.extra.count, p.x, p.y, { rot: pr.spin ? gameClock * 8 : Math.atan2(pr.vy, pr.vx) }); return; }
  ctx.fillStyle = '#2b1d14'; ctx.fillRect(p.x - 3, p.y - 3, 7, 7); ctx.fillStyle = pr.color || '#c0402f'; ctx.fillRect(p.x - 2, p.y - 2, 5, 5); ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 1, p.y - 2, 2, 2);
}
function drawRing(r) {
  const p = worldToCanvas(r.x, r.y), k = Math.min(1, r.t / r.dur), rad = Math.round(r.r0 + (r.r1 - r.r0) * k);
  ctx.save(); ctx.strokeStyle = r.color; ctx.lineWidth = 2;
  ctx.globalAlpha = r.warn ? (Math.floor(r.t * 10) % 2 ? 0.9 : 0.45) : 0.85 * (1 - k * 0.6);
  if (r.warn) ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.ellipse(p.x, p.y, Math.max(1, rad), Math.max(1, Math.round(rad * 0.7)), 0, 0, TAU); ctx.stroke();
  ctx.restore();
}
function drawChevrons(c) {
  const p = worldToCanvas(c.x, c.y), a = Math.atan2(c.dir.y, c.dir.x);
  ctx.save(); ctx.translate(p.x, p.y - 10); ctx.rotate(snapAngle(a)); ctx.fillStyle = Math.floor(c.t * 10) % 2 ? '#c0402f' : '#ff7a5a';
  for (let i = 1; i <= 5; i++) { const x = i * 18; ctx.fillRect(x, -6, 3, 3); ctx.fillRect(x + 3, -3, 3, 3); ctx.fillRect(x, 0, 3, 3); ctx.fillRect(x - 3, 3, 3, 3); }
  ctx.restore();
}
function drawFxItem(f) {
  const tx = f.follow && !f.follow.dead ? f.follow.x : f.x, ty = f.follow && !f.follow.dead ? f.follow.y : f.y, p = worldToCanvas(tx, ty);
  if (f.extra) {
    const i = f.chargeLine ? Math.floor(f.t / 0.1) % f.extra.count : animIndex(f.ms, f.t, false);
    if (f.chargeLine) { const a = f.rot; for (let k = 0; k < 3; k++) drawExtra(f.dirKey, f.extra, i, p.x + Math.cos(a) * (24 + k * 36), p.y + Math.sin(a) * (24 + k * 36), { rot: a }); return; }
    drawExtra(f.dirKey, f.extra, i, p.x, p.y, { rot: f.rot });
    return;
  }
  drawStrip(f.dir, f.key, playStrip(f.dir, f.key, f.t, false), p.x, p.y, { anchor: f.anchor, flip: f.flip, rot: f.rot });
}
function drawHazard(h) {
  const p = worldToCanvas(h.x, h.y);
  if (!onScreen(p, 60)) return;
  const n = h.extra.count, fade = Math.min(1, (h.life - h.t) / 0.6);
  let i = h.drop ? Math.min(n - 1, Math.floor(h.t / 0.2)) : h.kind === 'spores' || h.kind === 'storm' ? Math.min(n - 1, Math.floor(h.t / 0.15)) : Math.floor(h.t / 0.12) % n;
  drawExtra(h.dirKey, h.extra, i, p.x, p.y - (h.drop ? 10 : 0), { alpha: fade });
}
function drawBurst(b) {
  const p = worldToCanvas(b.x, b.y), i = b.t < 1.5 ? 0 : b.t < 1.7 ? 1 : 2;
  drawExtra('enemies', b.extra, i, p.x, p.y - 10, { alpha: b.t < 1.5 && Math.floor(b.t * 8) % 2 ? 0.6 : 1 });
}
function drawGeyser(g) {
  const p = worldToCanvas(g.x, g.y), i = g.t < 1 ? 0 : g.t < 1.25 ? 1 : 2;
  drawExtra('bosses', g.extra, i, p.x, p.y, { anchor: 'feet' });
}
function drawDarkZone(z) { const p = worldToCanvas(z.x, z.y); drawExtra('bosses', z.extra, Math.floor(z.t / 0.2) % z.extra.count, p.x, p.y, { alpha: Math.min(1, (z.life - z.t) / 0.5) }); }
function inDarkness() { for (const z of darkZones) if (Math.hypot(z.x - player.x, (z.y - player.y) * 1.5) < 46) return true; return false; }
function drawDarknessOverlay() {
  if (!inDarkness()) return;
  const p = worldToCanvas(player.x, player.y - 16);
  ctx.save(); ctx.fillStyle = '#0a0612';
  for (const [r, a] of [[56, 0.35], [44, 0.6], [34, 0.88]]) { ctx.globalAlpha = a; ctx.beginPath(); ctx.rect(0, 0, W(), H()); ctx.ellipse(p.x, p.y, r, r * 0.8, 0, 0, TAU); ctx.fill('evenodd'); }
  ctx.restore();
}
function drawCollapse() {
  if (!collapse) return;
  const p = worldToCanvas(collapse.x, collapse.y), r = Math.round(collapse.r);
  ctx.save(); ctx.fillStyle = '#1a0420'; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.rect(0, 0, W(), H()); ctx.ellipse(p.x, p.y, r, r, 0, 0, TAU); ctx.fill('evenodd');
  ctx.globalAlpha = 1; ctx.strokeStyle = '#f070ff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -gameClock * 20;
  ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r, 0, 0, TAU); ctx.stroke(); ctx.restore();
}
function drawOffscreenIndicators() {
  const mg = 6, cx = W() / 2, cy = H() / 2;
  for (const e of enemies) {
    if (!e.tier && !e.def.tough) continue;
    const p = worldToCanvas(e.x, e.y);
    if (p.x > -10 && p.x < W() + 10 && p.y > -10 && p.y < H() + 10) continue;
    const a = Math.atan2(p.y - cy, p.x - cx);
    const ix = Math.max(mg, Math.min(W() - mg, cx + Math.cos(a) * (cx - mg))), iy = Math.max(mg, Math.min(H() - mg, cy + Math.sin(a) * (cy - mg)));
    ctx.save(); ctx.translate(Math.round(ix), Math.round(iy)); ctx.rotate(snapAngle(a));
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-4, -4, 7, 8); ctx.fillStyle = e.tier ? '#f070ff' : '#c0402f'; ctx.fillRect(-3, -3, 3, 6); ctx.fillRect(0, -2, 2, 4);
    ctx.restore();
  }
}

// Everything in a fight, in order: floor, things on the floor, things that stand (by feet y), effects, light.
function drawCombatWorld(calm) {
  drawGround();
  if (!calm) {
    for (const f of frostPatches) drawFrostPatch(f);
    for (const h of hazards) drawHazard(h);
    for (const z of darkZones) drawDarkZone(z);
    for (const g of geysers) if (g.t < 1) drawGeyser(g);
    for (const e of enemies) drawEnemyUnder(e);
    for (const f of firePatches) drawFirePatch(f);
    for (const b of bursts) if (b.t < 1.5) drawBurst(b);
    for (const r of rings) if (r.warn) drawRing(r);
    for (const c of chevrons) drawChevrons(c);
  }
  const all = [];
  for (const o of obstacles) all.push({ d: o.y, t: 'o', o });
  if (!calm) {
    for (const pk of pickups) all.push({ d: pk.y - 2, t: 'pk', o: pk });
    for (const e of enemies) all.push({ d: e.y, t: 'e', o: e });
    if (player) all.push({ d: player.y, t: 'p' });
    for (const d of dogs) all.push({ d: d.y, t: 'dog', o: d });
    for (const g of geysers) if (g.t >= 1) all.push({ d: g.y, t: 'g', o: g });
    for (const f of fx) if (f.behind) all.push({ d: player.y - 0.01, t: 'f', o: f });
  }
  all.sort((a, b) => a.d - b.d);
  for (const it of all) {
    if (it.t === 'o') drawObstacle(it.o); else if (it.t === 'e') drawEnemy(it.o); else if (it.t === 'pk') drawPickup(it.o);
    else if (it.t === 'p') drawHero(); else if (it.t === 'g') drawGeyser(it.o); else if (it.t === 'f') drawFxItem(it.o); else if (it.t === 'dog') drawDog(it.o);
  }
  if (!calm) {
    for (const b of bursts) if (b.t >= 1.5) drawBurst(b);
    for (const r of rings) if (!r.warn) drawRing(r);
    drawBlades();
    for (const m of homingMissiles) drawMissile(m);
    for (const b of bullets) drawBullet(b);
    for (const pr of eProj) drawEnemyProj(pr);
    for (const b of lightningBolts) drawLightning(b);
    for (const f of fx) if (!f.behind) drawFxItem(f);
  }
  drawLight(gameClock);
  if (!calm) { drawCollapse(); drawDarknessOverlay(); drawMutatorOverlay(); drawOffscreenIndicators(); }
}

// Damage numbers go on the screen canvas after the 3× blow-up (16 px, crits 24 px gold).
function drawDamageNumbers() {
  if (!options.damageNumbers || !floatingTexts.length) return;
  const c = screenCtx; c.save(); c.textAlign = 'center';
  for (const f of floatingTexts) {
    const p = worldToCanvas(f.wx, f.wy), x = p.x * PIXEL_SCALE, y = p.y * PIXEL_SCALE;
    const size = f.crit ? 24 : 16;
    c.globalAlpha = Math.min(1, f.life / 0.3);
    c.font = size + 'px "Press Start 2P", monospace';
    c.fillStyle = f.crit ? '#8e2c22' : '#2b1d14'; c.fillText(f.text, x + 3, y + 3);
    c.fillStyle = f.color || (f.crit ? '#ffcc44' : '#ffffff'); c.fillText(f.text, x, y);
  }
  c.restore();
}
function addFloatingText(wx, wy, val, crit, color) {
  floatingTexts.push({ wx: wx + rnd(-4, 4), wy, text: typeof val === 'number' ? String(val) + (crit ? '!' : '') : val, crit, color, life: 0.8 });
}
function updateFloaters(dt) {
  for (const f of floatingTexts) { f.wy -= 22 * dt; f.life -= dt; }
  floatingTexts = floatingTexts.filter(f => f.life > 0);
  for (const f of fx) f.t += dt;
  fx = fx.filter(f => f.t < f.dur);
}
