// Lightkeeper renderer: draws the engine state on a canvas. Everything is drawn in code; no images.
// Look: linocut print. Ink blue night, carved cream lines, one warm amber light.
// © 2026 justaskjoe. All rights reserved.
(function () {
  'use strict';
  const LK = window.LK, L = LK.LAMP;
  const C = { ink: '#0d1a2b', ink2: '#132438', cream: '#efe6d2', amber: '#ffbe5c', rust: '#c8643c', land: '#191611', rock: '#25221b', hullDark: '#5b7086', hullLit: '#ecc888' };
  let cv, cx, V = { s: 1, ox: 0, oy: 0, w: 1, h: 1, dpr: 1 };
  const shapeCache = new Map();

  function init(c) { cv = c; cx = c.getContext('2d'); resize(); }
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const s = Math.min(w / LK.W, h / LK.H);
    V = { s, ox: (w - LK.W * s) / 2, oy: (h - LK.H * s) / 2, w, h, dpr };
  }
  const toWorld = (px, py) => ({ x: (px - V.ox) / V.s, y: (py - V.oy) / V.s });
  const toScreen = (x, y) => ({ x: V.ox + x * V.s, y: V.oy + y * V.s });
  const worldRect = () => ({ x0: -V.ox / V.s, y0: -V.oy / V.s, x1: (V.w - V.ox) / V.s, y1: (V.h - V.oy) / V.s });

  function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // An irregular carved rock outline for a reef, the same every frame.
  function rockShape(r) {
    const key = r.x + ',' + r.y + ',' + r.r; if (shapeCache.has(key)) return shapeCache.get(key);
    const rnd = prng(r.x * 73 + r.y * 31 + r.r), n = 11, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 0.78 + rnd() * 0.3; pts.push([Math.cos(a) * r.r * k, Math.sin(a) * r.r * k]); }
    const hatch = []; for (let i = 0; i < 4; i++) { const y = (rnd() - 0.5) * r.r * 1.1, w = r.r * (0.35 + rnd() * 0.4); hatch.push([-w / 2 + (rnd() - 0.5) * 6, y, w]); }
    const out = { pts, hatch }; shapeCache.set(key, out); return out;
  }

  function sea(t) {
    const R = worldRect();
    cx.fillStyle = C.ink; cx.fillRect(R.x0 - 2, R.y0 - 2, R.x1 - R.x0 + 4, R.y1 - R.y0 + 4);
    cx.strokeStyle = 'rgba(239,230,210,0.075)'; cx.lineWidth = 1.2;
    const step = 22, start = Math.floor(R.y0 / step) * step;
    for (let y = start, i = 0; y < R.y1; y += step, i++) {
      cx.beginPath();
      for (let x = R.x0 - 10, j = 0; x <= R.x1 + 10; x += 12, j++) {
        const yy = y + Math.sin(x * 0.04 + t * 0.55 + i * 1.7) * 3 + Math.sin(x * 0.11 - t * 0.3 + i) * 1.2;
        // carved look: break each line into dashes
        if (j % 7 === 6) cx.moveTo(x, yy); else if (j === 0) cx.moveTo(x, yy); else cx.lineTo(x, yy);
      }
      cx.stroke();
    }
  }

  function reef(r, t, foam) {
    const sh = rockShape(r);
    cx.save(); cx.translate(r.x, r.y);
    if (foam) {
      cx.strokeStyle = 'rgba(239,230,210,0.32)'; cx.lineWidth = 1.4; cx.setLineDash([3, 5]); cx.lineDashOffset = -t * 6;
      cx.beginPath(); cx.arc(0, 0, r.r + 6 + Math.sin(t * 1.3 + r.x) * 1.2, 0, Math.PI * 2); cx.stroke(); cx.setLineDash([]);
    }
    cx.beginPath(); sh.pts.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y)); cx.closePath();
    cx.fillStyle = C.rock; cx.fill(); cx.strokeStyle = 'rgba(239,230,210,0.7)'; cx.lineWidth = 1.3; cx.stroke();
    cx.strokeStyle = 'rgba(239,230,210,0.28)'; cx.lineWidth = 1;
    for (const [x, y, w] of sh.hatch) { cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + w, y - 2); cx.stroke(); }
    cx.restore();
  }

  function land(G, t) {
    const R = worldRect();
    // shore with a harbor notch under the lighthouse
    cx.beginPath(); cx.moveTo(R.x0 - 10, 626);
    for (let x = R.x0 - 10; x < 136; x += 10) cx.lineTo(x, 626 + Math.sin(x * 0.2) * 2.5);
    cx.lineTo(146, 636); cx.lineTo(214, 636); cx.lineTo(224, 626);
    for (let x = 230; x <= R.x1 + 10; x += 10) cx.lineTo(x, 626 + Math.sin(x * 0.2) * 2.5);
    cx.lineTo(R.x1 + 10, R.y1 + 10); cx.lineTo(R.x0 - 10, R.y1 + 10); cx.closePath();
    cx.fillStyle = C.land; cx.fill(); cx.strokeStyle = 'rgba(239,230,210,0.6)'; cx.lineWidth = 1.3; cx.stroke();
    // carved hatching on land
    cx.strokeStyle = 'rgba(239,230,210,0.12)'; cx.lineWidth = 1;
    for (let y = 640; y < R.y1; y += 9) for (let x = R.x0 + ((y / 9) % 2) * 12; x < R.x1; x += 24) { if (x > 140 && x < 220 && y < 646) continue; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + 10, y - 2); cx.stroke(); }
    for (const h of LK.HEADLANDS) reef(h, t, true);
    // piers
    cx.strokeStyle = 'rgba(239,230,210,0.55)'; cx.lineWidth = 3;
    cx.beginPath(); cx.moveTo(150, 636); cx.lineTo(160, 612); cx.moveTo(210, 636); cx.lineTo(200, 612); cx.stroke();
    // harbor ring
    cx.strokeStyle = 'rgba(255,190,92,0.28)'; cx.lineWidth = 1.2; cx.setLineDash([2, 6]);
    cx.beginPath(); cx.arc(L.x, L.y, LK.DOCK_R, Math.PI * 1.0, Math.PI * 2.0); cx.stroke(); cx.setLineDash([]);
  }

  function lighthouse(G, t) {
    cx.save(); cx.translate(L.x, L.y + 6);
    cx.fillStyle = C.rock; cx.strokeStyle = 'rgba(239,230,210,0.7)'; cx.lineWidth = 1.2;
    cx.beginPath(); cx.ellipse(0, 3, 15, 9, 0, 0, Math.PI * 2); cx.fill(); cx.stroke();
    cx.fillStyle = C.cream; cx.beginPath(); cx.arc(0, -2, 8, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = C.rust; cx.lineWidth = 2.4; cx.beginPath(); cx.arc(0, -2, 5.5, 0, Math.PI * 2); cx.stroke();
    cx.fillStyle = C.amber; cx.beginPath(); cx.arc(0, -2, 3, 0, Math.PI * 2); cx.fill();
    cx.restore();
  }

  function beam(G, t, demo) {
    const a = G.beam.a, half = LK.BEAM_HALF, rng = G.beam.range;
    cx.save(); cx.globalCompositeOperation = 'lighter';
    const g = cx.createRadialGradient(L.x, L.y, 4, L.x, L.y, rng);
    g.addColorStop(0, 'rgba(255,206,120,0.55)'); g.addColorStop(0.35, 'rgba(255,190,92,0.22)'); g.addColorStop(1, 'rgba(255,190,92,0)');
    cx.fillStyle = g;
    cx.beginPath(); cx.moveTo(L.x, L.y); cx.arc(L.x, L.y, rng, a - half, a + half); cx.closePath(); cx.fill();
    const g2 = cx.createRadialGradient(L.x, L.y, 4, L.x, L.y, rng * 0.8);
    g2.addColorStop(0, 'rgba(255,190,92,0.16)'); g2.addColorStop(1, 'rgba(255,190,92,0)');
    cx.fillStyle = g2; cx.beginPath(); cx.moveTo(L.x, L.y); cx.arc(L.x, L.y, rng * 0.8, a - half * 2, a + half * 2); cx.closePath(); cx.fill();
    // lamp halo
    const h = cx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 26);
    h.addColorStop(0, 'rgba(255,214,144,0.75)'); h.addColorStop(1, 'rgba(255,190,92,0)');
    cx.fillStyle = h; cx.beginPath(); cx.arc(L.x, L.y, 26, 0, Math.PI * 2); cx.fill();
    cx.restore();
  }

  function ship(G, s, U, t, fogHidden) {
    const lit = s.st === 'sail' && s.lit;
    let alpha = 1;
    if (s.st === 'dock') { const k = Math.min(1, (t - (s.endT || t)) / 1.2); alpha = 1 - k; if (alpha <= 0) return; }
    if (s.st === 'lost') { const k = Math.min(1, (t - (s.endT || t)) / 1.5); alpha = 1 - k; if (alpha <= 0) return; }
    if (s.st === 'wreck') alpha = 0.75;
    if (fogHidden && !lit && s.st === 'sail') alpha = 0.14;
    cx.save(); cx.globalAlpha = alpha;
    // wake
    const wk = U.wakes[s.id];
    if (wk && wk.length > 1 && s.st === 'sail') {
      cx.strokeStyle = 'rgba(239,230,210,0.14)'; cx.lineWidth = 2;
      cx.beginPath(); wk.forEach((p, i) => i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1])); cx.lineTo(s.x, s.y); cx.stroke();
    }
    // where she goes if left dark
    if (s.st === 'sail' && !lit && !fogHidden) {
      const pts = []; LK.forecast(G, s, false, 3.2, pts);
      cx.fillStyle = 'rgba(239,230,210,0.45)';
      for (let i = 0; i < pts.length; i += 2) { cx.beginPath(); cx.arc(pts[i], pts[i + 1], 1.1, 0, Math.PI * 2); cx.fill(); }
    }
    cx.translate(s.x, s.y); cx.rotate(s.h + (s.st === 'wreck' ? 0.6 + Math.sin(t + s.id) * 0.05 : 0)); cx.scale(1.45, 1.45);
    cx.beginPath(); cx.moveTo(9, 0); cx.lineTo(3, -4.2); cx.lineTo(-7, -3.6); cx.lineTo(-8.5, 0); cx.lineTo(-7, 3.6); cx.lineTo(3, 4.2); cx.closePath();
    cx.fillStyle = s.st === 'wreck' ? '#3a3f45' : lit ? C.hullLit : C.hullDark; cx.fill();
    cx.strokeStyle = C.ink; cx.lineWidth = 1.2; cx.stroke();
    if (s.st !== 'wreck') {
      cx.strokeStyle = lit ? '#fff4dc' : C.cream; cx.lineWidth = 1.6;
      cx.beginPath(); cx.moveTo(-1, -5.5); cx.quadraticCurveTo(4, 0, -1, 5.5); cx.stroke();
      cx.fillStyle = lit ? '#fff1c8' : 'rgba(255,190,92,0.7)'; cx.beginPath(); cx.arc(6, 0, lit ? 1.8 : 1.2, 0, Math.PI * 2); cx.fill();
    }
    cx.restore();
    if (lit || (fogHidden && s.st === 'sail')) {
      // lantern glow; in fog a faint glimmer is all you see of a dark boat
      cx.save(); cx.globalCompositeOperation = 'lighter';
      const r = lit ? 20 : 8, g = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      g.addColorStop(0, lit ? 'rgba(255,214,144,0.6)' : `rgba(255,190,92,${0.18 + 0.12 * Math.sin(t * 3 + s.id)})`); g.addColorStop(1, 'rgba(255,190,92,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(s.x, s.y, r, 0, Math.PI * 2); cx.fill(); cx.restore();
    }
  }

  function fog(t) {
    const R = worldRect();
    cx.save();
    cx.fillStyle = 'rgba(120,134,150,0.30)'; cx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    for (let i = 0; i < 7; i++) {
      const y = R.y0 + ((i * 113 + t * 6) % (R.y1 - R.y0 + 120)) - 60, x = 180 + Math.sin(t * 0.13 + i * 2) * 90;
      const g = cx.createRadialGradient(x, y, 10, x, y, 190);
      g.addColorStop(0, 'rgba(160,172,186,0.28)'); g.addColorStop(1, 'rgba(160,172,186,0)');
      cx.fillStyle = g; cx.fillRect(x - 200, y - 200, 400, 400);
    }
    cx.restore();
  }

  function storm(G, t) {
    const R = worldRect();
    cx.save(); cx.strokeStyle = 'rgba(200,214,230,0.16)'; cx.lineWidth = 1;
    const rnd = prng(Math.floor(t * 20));
    cx.beginPath();
    for (let i = 0; i < 70; i++) { const x = R.x0 + rnd() * (R.x1 - R.x0 + 60), y = R.y0 + rnd() * (R.y1 - R.y0); cx.moveTo(x, y); cx.lineTo(x - 7, y + 16); }
    cx.stroke();
    if (G.gust.flash > 0) {
      const k = G.gust.flash / 0.8, dir = G.gust.dir > 0 ? 1 : -1;
      cx.strokeStyle = `rgba(239,230,210,${0.35 * k})`; cx.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) { const y = 60 + i * 60, x0 = 180 - dir * (200 - (1 - k) * 400); cx.beginPath(); cx.moveTo(x0, y); cx.quadraticCurveTo(x0 + dir * 50, y - 8, x0 + dir * 110, y); cx.stroke(); }
    }
    cx.restore();
  }

  function warnings(G, t) {
    const def = G.def; if (G.next >= def.ships.length) return;
    const sp = def.ships[G.next], left = sp.t - G.t; if (left > 2.2) return;
    const R = worldRect();
    const x = Math.max(Math.max(R.x0, 0) + 12, Math.min(Math.min(R.x1, LK.W) - 12, sp.x)), y = Math.max(Math.max(R.y0, -10) + 14, Math.min(R.y1 - 14, sp.y));
    const h = sp.h * Math.PI / 180, a = 0.45 + 0.45 * Math.sin(t * 9);
    cx.save(); cx.translate(x, Math.max(y, 12)); cx.rotate(h); cx.globalAlpha = a;
    cx.fillStyle = C.amber; cx.beginPath(); cx.moveTo(8, 0); cx.lineTo(-4, -6); cx.lineTo(-1, 0); cx.lineTo(-4, 6); cx.closePath(); cx.fill();
    cx.restore();
  }

  function effects(G, U, t) {
    if (G.horn.t > 0) {
      const k = 1 - G.horn.t / 2.5;
      cx.save(); cx.strokeStyle = `rgba(239,230,210,${0.4 * (1 - k)})`; cx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const r = ((k * 3 + i / 3) % 1) * 420; cx.beginPath(); cx.arc(L.x, L.y, r, Math.PI, Math.PI * 2); cx.stroke(); }
      cx.restore();
    }
    U.fx = U.fx.filter(f => t - f.t0 < 1.4);
    for (const f of U.fx) {
      const k = (t - f.t0) / 1.4;
      cx.save(); cx.lineWidth = 1.6;
      cx.strokeStyle = f.k === 'dock' ? `rgba(255,190,92,${1 - k})` : `rgba(239,230,210,${0.8 * (1 - k)})`;
      cx.beginPath(); cx.arc(f.x, f.y, 6 + k * (f.k === 'dock' ? 30 : 18), 0, Math.PI * 2); cx.stroke(); cx.restore();
    }
  }

  function draw(G, U, t, opts) {
    opts = opts || {};
    cx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    cx.fillStyle = C.ink; cx.fillRect(0, 0, V.w, V.h);
    cx.setTransform(V.dpr * V.s, 0, 0, V.dpr * V.s, V.dpr * V.ox, V.dpr * V.oy);
    sea(t);
    for (const r of G.def.reefs) reef(r, t, true);
    land(G, t);
    const fogNight = !!G.def.fog;
    for (const s of G.ships) ship(G, s, U, t, fogNight);
    if (fogNight) fog(t);
    beam(G, t, opts.demo);
    if (fogNight) for (const s of G.ships) if (s.st === 'sail' && s.lit) ship(G, s, U, t, false); // lit boats show through the fog
    lighthouse(G, t);
    if (G.def.storm) storm(G, t);
    if (!opts.demo) warnings(G, t);
    effects(G, U, t);
  }

  window.LKR = { init, resize, draw, toWorld, toScreen, colors: C };
})();
