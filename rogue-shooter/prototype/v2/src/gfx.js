// ─── Art assets ───
// Sheets and manifests from art/sprites/, embedded by build.py as src/assets.js.
// Sizes are art pixels; the 3× comes from beginFrame(PIXEL_SCALE)/endFrame().
const IMG = {};
const HJ = ASSET_JSON['heroes/heroes.json'];
const EJ = ASSET_JSON['enemies/enemies.json'].enemies;
const BJ = ASSET_JSON['bosses/bosses.json'].enemies;
const BIO = ASSET_JSON['biomes/biomes.json'];
const CJ = ASSET_JSON['combat/combat.json'];
const FJ = ASSET_JSON['farm/farm.json'];
const IJ = ASSET_JSON['ui/icons.json'];
const VIEWS = HJ.views;               // ['front', 'side', 'back']
const HERO_COL = Object.fromEntries(HJ.columns.map((c, i) => [c, i]));

function loadAssets() {
  return Promise.all(Object.entries(ASSET_DATA).map(([k, src]) => new Promise(res => {
    const im = new Image(); IMG[k] = im;
    im.onload = im.onerror = res; im.src = src;
    if (im.complete) res();
  }))).then(() => {
    document.documentElement.style.setProperty('--icons', 'url(' + ASSET_DATA['ui/icons.png'] + ')');
  });
}

// White silhouette of a whole sheet, made once, for the hit flash.
const _whiteSheets = new Map();
function whiteOf(img) {
  let c = _whiteSheets.get(img);
  if (!c) {
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    _whiteSheets.set(img, c);
  }
  return c;
}

// Copies a source rectangle with its top-left at (dx, dy), whole pixels, optionally flipped or white.
function blit(img, sx, sy, sw, sh, dx, dy, flipX, white) {
  if (!img) return;
  const src = white ? whiteOf(img) : img;
  dx = Math.round(dx); dy = Math.round(dy);
  if (!flipX) { ctx.drawImage(src, sx, sy, sw, sh, dx, dy, sw, sh); return; }
  ctx.save(); ctx.scale(-1, 1); ctx.drawImage(src, sx, sy, sw, sh, -dx - sw, dy, sw, sh); ctx.restore();
}
// Draws frame (col,row) of a sheet with its bottom-centre on the feet at (x, y).
function drawFrame(img, fw, fh, col, row, x, y, flipX, white) {
  blit(img, col * fw, row * fh, fw, fh, Math.round(x) - (fw >> 1), Math.round(y) - fh, flipX, white);
}

// Frame index for a timing list (ms per frame) at time t seconds.
function animIndex(ms, t, loop) {
  let total = 0; for (const m of ms) total += m;
  let tt = t * 1000;
  if (loop) tt = ((tt % total) + total) % total; else if (tt >= total) return ms.length - 1;
  for (let i = 0; i < ms.length; i++) { if (tt < ms[i]) return i; tt -= ms[i]; }
  return ms.length - 1;
}
function animDur(ms) { let t = 0; for (const m of ms) t += m; return t / 1000; }

// One-row strips from combat.json / farm.json: key -> {w, h, frames, ms}.
function stripInfo(dir, key) { return (dir === 'farm' ? FJ : CJ)[key]; }
// anchor 'center' (default) or 'feet' (bottom-centre). rot turns strips that point right.
function drawStrip(dir, key, i, x, y, o) {
  const s = stripInfo(dir, key), img = IMG[dir + '/' + key + '.png'];
  if (!s || !img) return;
  o = o || {};
  i = Math.max(0, Math.min(s.frames - 1, i));
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0) return;
  if (a < 1) { ctx.save(); ctx.globalAlpha = a; }
  if (o.rot) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(snapAngle(o.rot));
    ctx.drawImage(img, i * s.w, 0, s.w, s.h, -(s.w >> 1), o.anchor === 'feet' ? -s.h : -(s.h >> 1), s.w, s.h);
    ctx.restore();
  } else {
    const dy = o.anchor === 'feet' ? y - s.h : y - (s.h >> 1);
    blit(img, i * s.w, 0, s.w, s.h, Math.round(x) - (s.w >> 1), dy, o.flip, o.white);
  }
  if (a < 1) ctx.restore();
}
function playStrip(dir, key, t, loop) { const s = stripInfo(dir, key); return s ? animIndex(s.ms, t, loop) : 0; }
function stripDur(dir, key) { const s = stripInfo(dir, key); return s ? animDur(s.ms) : 0; }
// Rotations snap to 32 steps so rotated pixels don't shimmer frame to frame.
function snapAngle(a) { const st = Math.PI / 16; return Math.round(a / st) * st; }

// Extra effect strips listed in enemies.json / bosses.json under "extras".
function extraInfo(def, name) { return def.extras && def.extras[name]; }
function drawExtra(dirKey, info, i, x, y, o) {
  const img = IMG[dirKey + '/' + info.file]; if (!img) return;
  const [w, h] = info.frame; o = o || {};
  i = Math.max(0, Math.min(info.count - 1, i));
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0) return;
  ctx.save(); if (a < 1) ctx.globalAlpha = a;
  if (o.rot !== undefined) {
    ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(snapAngle(o.rot));
    ctx.drawImage(img, i * w, 0, w, h, -(w >> 1), -(h >> 1), w, h);
  } else {
    const dy = o.anchor === 'feet' ? y - h : y - (h >> 1);
    blit(img, i * w, 0, w, h, Math.round(x) - (w >> 1), dy, o.flip);
  }
  ctx.restore();
}

// The biggest solid piece of a strip frame, cut out once: one blade, one missile.
const _pieces = {};
function stripPiece(key, frame) {
  const id = key + '#' + (frame || 0);
  if (_pieces[id]) return _pieces[id];
  const s = CJ[key], img = IMG['combat/' + key + '.png'];
  const c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
  const x = c.getContext('2d'); x.drawImage(img, (frame || 0) * s.w, 0, s.w, s.h, 0, 0, s.w, s.h);
  const d = x.getImageData(0, 0, s.w, s.h).data, seen = new Uint8Array(s.w * s.h);
  let best = null;
  for (let p = 0; p < s.w * s.h; p++) {
    if (seen[p] || d[p * 4 + 3] < 250) continue;
    const st = [p], box = { x0: s.w, y0: s.h, x1: 0, y1: 0, n: 0 }; seen[p] = 1;
    while (st.length) {
      const q = st.pop(), qx = q % s.w, qy = (q / s.w) | 0; box.n++;
      if (qx < box.x0) box.x0 = qx; if (qx > box.x1) box.x1 = qx; if (qy < box.y0) box.y0 = qy; if (qy > box.y1) box.y1 = qy;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = qx + ax, ny = qy + ay; if (nx < 0 || ny < 0 || nx >= s.w || ny >= s.h) continue;
        const n = ny * s.w + nx; if (!seen[n] && d[n * 4 + 3] >= 250) { seen[n] = 1; st.push(n); }
      }
    }
    if (!best || box.n > best.n) best = box;
  }
  const out = document.createElement('canvas');
  const w = best.x1 - best.x0 + 3, h = best.y1 - best.y0 + 3;
  out.width = w; out.height = h;
  out.getContext('2d').drawImage(c, best.x0 - 1, best.y0 - 1, w, h, 0, 0, w, h);
  return (_pieces[id] = out);
}
function drawPiece(piece, x, y, rot) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (rot) ctx.rotate(snapAngle(rot));
  ctx.drawImage(piece, -(piece.width >> 1), -(piece.height >> 1)); ctx.restore();
}

// Blue-tinted ground shadow under anything that stands (art-direction: multiply, not grey).
function drawShadow(x, y, w, floats) {
  const rx = Math.max(3, Math.round(w * (floats ? 0.26 : 0.36))), ry = Math.max(2, Math.round(rx * 0.34));
  ctx.fillStyle = 'rgba(20,30,70,0.35)';
  ctx.beginPath(); ctx.ellipse(Math.round(x) + 2, Math.round(y) + (floats ? 4 : 0), rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

// ─── Icons (16×16, always whole-number sizes in the DOM) ───
function iconPos(name) { return IJ.icons[name] || IJ.icons['Lock']; }
function icon(name, s, extra) {
  s = s || 3; const [x, y] = iconPos(name);
  return '<i class="ico" role="img" aria-label="' + name + '" style="width:' + 16 * s + 'px;height:' + 16 * s + 'px;background-size:' + 256 * s + 'px ' + 224 * s + 'px;background-position:-' + x * s + 'px -' + y * s + 'px' + (extra ? ';' + extra : '') + '"></i>';
}

// ─── Animated sprites in menus (canvas elements drawn at 3×) ───
const uiSprites = [];
function uiSprite(o) {
  // o: {img, fw, fh, row, cols (array of columns to loop), ms, scale}
  const c = document.createElement('canvas'); const s = o.scale || 3;
  c.width = o.fw * s; c.height = o.fh * s; c.className = 'spr';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const e = Object.assign({ c, x, s, t0: Math.random() * 1000, playing: true }, o);
  uiSprites.push(e); drawUiSprite(e, 0);
  return e;
}
function drawUiSprite(e, now) {
  const cols = e.cols || [0], i = e.playing ? Math.floor((now + e.t0) / (e.ms || 150)) % cols.length : 0;
  e.x.clearRect(0, 0, e.c.width, e.c.height);
  e.x.drawImage(e.img, cols[i] * e.fw, (e.row || 0) * e.fh, e.fw, e.fh, 0, 0, e.fw * e.s, e.fh * e.s);
}
function tickUiSprites(now) { for (const e of uiSprites) if (e.c.isConnected) drawUiSprite(e, now); }
function heroUiSprite(id, view, walking, scale) {
  return uiSprite({ img: IMG['heroes/' + id + '.png'], fw: 32, fh: 44, row: VIEWS.indexOf(view || 'front'), cols: walking ? [1, 2, 3, 4] : [0], ms: 150, scale });
}
// A single still frame from any sheet as a canvas (enemy portraits, boss silhouettes).
function frameCanvas(img, fw, fh, col, row, scale, silhouette) {
  const c = document.createElement('canvas'); const s = scale || 3;
  c.width = fw * s; c.height = fh * s; c.className = 'spr';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.drawImage(img, col * fw, row * fh, fw, fh, 0, 0, fw * s, fh * s);
  if (silhouette) {
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#100818'; x.fillRect(0, 0, c.width, c.height);
  }
  return c;
}
