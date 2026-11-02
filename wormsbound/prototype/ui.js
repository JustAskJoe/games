/* Wormsbound Prototype 1 · local hotseat UI. © 2026 justaskjoe. All rights reserved.
   Draws the engine (window.WB) on one 1280×720 canvas and turns mouse, touch and keyboard into act() intents.
   The UI never changes the game itself: it only calls WB.act() and steps WB.step() on the clock.
   Two modes: 1 Player (you against 3 computer opponents in a 4-way free-for-all, Easy / Medium / Hard) and
   2 Players (1v1 on one keyboard). Each side picks one of five characters (WB.CHARS); best of 3 rounds, with the
   first turn rotating. Turn order follows the engine's turn delay.
   Placeholder art, all drawn in code. */
(function () {
  'use strict';
  const WB = window.WB;
  const $ = (q) => document.querySelector(q);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: fine */ } };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const W = 1280, H = 720, CELL = W / WB.COLS; // 8 px per terrain cell
  const TURN_SECONDS = 30, BEST_OF = 3, DRAG_FULL = 220, DRAG_MIN = 14;
  const TEAMS = [
    { name: 'Ember', key: 'ember', c: '#FF7A30', c2: '#C9481A' },
    { name: 'Tide', key: 'tide', c: '#22C3B5', c2: '#0E7C7B' },
    { name: 'Plum', key: 'plum', c: '#B57BFF', c2: '#7A4BC9' },
    { name: 'Sun', key: 'sun', c: '#FFD34D', c2: '#C99A1A' },
  ];
  const LEVELS = {
    easy: { name: 'Easy', blurb: 'Shaky aim, few tricks. Good for learning the ropes.' },
    medium: { name: 'Medium', blurb: 'Decent aim. Uses duds, lobs them back and saves its SS.' },
    hard: { name: 'Hard', blurb: 'Sharp aim and every trick. Beating three of them is a real win.' },
  };
  const FONT = (px) => `${px}px "Lilita One", "Arial Black", system-ui, sans-serif`;

  const cv = $('#map'), ctx = cv.getContext('2d');
  const terrCv = document.createElement('canvas'); terrCv.width = W; terrCv.height = H; const tctx = terrCv.getContext('2d');
  const bgCv = document.createElement('canvas'); bgCv.width = W; bgCv.height = H; const bctx = bgCv.getContext('2d');

  const ui = {
    screen: 'title', G: null, matchSeed: 0, round: 1, wins: [0, 0], aim: {}, weapon: 'shot1', lob: false, picks: [null, null], pickTeam: 0, cursor: 2,
    mode: 'duel', level: 'medium', cpu: null,
    drag: null, acc: 0, last: 0, slow: 0, shake: 0, parts: [], trails: {}, scorch: [], clouds: [], dust: [], pops: [],
    tLeft: TURN_SECONDS, timerOn: lsGet('wb-timer') !== 'off', sound: lsGet('wb-sound') !== 'off', coach: lsGet('wb-coach') !== 'off',
    fast: false, tester: false, overAt: 0, turnsSeen: 0, paused: false, fb: { q: {}, text: '', nm: '', saved: null },
  };
  const nSides = () => (ui.mode === 'solo' ? 4 : 2);
  const isCPU = (t) => ui.mode === 'solo' && t !== 0;
  // what a side is called: "You" and "Tide CPU" in 1 Player, "Player 1" and "Player 2" in 1v1
  const sideLabel = (t) => ui.mode === 'solo' ? (t === 0 ? 'You' : `${TEAMS[t].name} CPU`) : `Player ${t + 1}`;
  const unitName = (u) => sideLabel(u.team);
  const charName = (t) => WB.CHARS[ui.G.chars[t]].name;

  // ---------- stage fit ----------
  function fit() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    $('#stage').style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  // ---------- sound: tiny Web Audio effects, nothing licensed ----------
  let ac = null;
  function audio() { if (!ui.sound) return null; try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; } return ac; }
  function noise(dur, f0, f1, vol) {
    const a = audio(); if (!a) return; const t = a.currentTime, n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g); g.connect(a.destination); s.start(t);
  }
  function tone(f0, f1, dur, vol, type = 'sine') {
    const a = audio(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const SFX = {
    fire: () => { noise(0.18, 2400, 300, 0.25); tone(220, 90, 0.15, 0.2, 'triangle'); },
    boom: (r) => { noise(0.5 + r * 0.06, 900, 60, 0.5); tone(90, 35, 0.4, 0.45); },
    thunk: () => { tone(160, 70, 0.12, 0.35, 'square'); },
    splash: () => noise(0.4, 3000, 400, 0.18),
    click: () => tone(900, 700, 0.04, 0.08, 'square'),
    tick: () => tone(1400, 1300, 0.05, 0.08, 'square'),
    ko: () => { noise(0.9, 1600, 500, 0.12); tone(520, 260, 0.35, 0.18, 'triangle'); },
    win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, f, 0.22, 0.18, 'triangle'), i * 120)); },
  };

  // ---------- background: sunset sky, sun, two parallax ridges (baked once per round) ----------
  function bakeBackground(seed) {
    let s = seed >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const g = bctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2B1E45'); g.addColorStop(0.42, '#7A3B5E'); g.addColorStop(0.7, '#FF8A3D'); g.addColorStop(1, '#FFC37A');
    bctx.fillStyle = g; bctx.fillRect(0, 0, W, H);
    const sx = 260 + r() * 760, sy = 330 + r() * 60;
    const sg = bctx.createRadialGradient(sx, sy, 10, sx, sy, 170); sg.addColorStop(0, 'rgba(255,240,200,1)'); sg.addColorStop(0.25, 'rgba(255,214,140,.9)'); sg.addColorStop(1, 'rgba(255,170,90,0)');
    bctx.fillStyle = sg; bctx.beginPath(); bctx.arc(sx, sy, 170, 0, 7); bctx.fill();
    for (let i = 0; i < 70; i++) { bctx.fillStyle = `rgba(255,243,224,${0.15 + r() * 0.5})`; bctx.fillRect(r() * W, r() * 200, 2, 2); }
    const ridge = (base, amp, col, k) => {
      bctx.fillStyle = col; bctx.beginPath(); bctx.moveTo(0, H);
      const p1 = r() * 6, p2 = r() * 6;
      for (let x = 0; x <= W; x += 8) bctx.lineTo(x, base - amp * (0.6 * Math.sin(x / (180 * k) + p1) + 0.4 * Math.sin(x / (63 * k) + p2)));
      bctx.lineTo(W, H); bctx.closePath(); bctx.fill();
    };
    ridge(470, 60, 'rgba(107,58,91,.55)', 1.4);
    ridge(540, 45, 'rgba(70,40,78,.7)', 1);
    ui.clouds = Array.from({ length: 6 }, () => ({ x: r() * W, y: 60 + r() * 220, s: 0.6 + r() * 0.9 }));
    ui.dust = Array.from({ length: reduced ? 0 : 46 }, () => ({ x: r() * W, y: 90 + r() * 560, z: 0.4 + r() * 0.8 }));
  }

  // ---------- terrain: chunky cells, coloured by depth below the surface, with scorch marks ----------
  const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return (h >>> 16) & 255; };
  const SHADES = [['#A6DE62', '#93CF55'], ['#6FAE45', '#62A03C'], ['#D2834A', '#C47640'], ['#B2643A', '#A55B36'], ['#8C4C3A', '#7F4436'], ['#6A3E4A', '#5E3743']];
  function shadeFor(depth) { return depth === 0 ? 0 : depth === 1 ? 1 : depth < 5 ? 2 : depth < 10 ? 3 : depth < 18 ? 4 : 5; }
  function renderTerrain() {
    const G = ui.G, T = G.T, C = WB.COLS, R = WB.ROWS;
    tctx.clearRect(0, 0, W, H);
    for (let x = 0; x < C; x++) {
      let depth = -1;
      for (let y = 0; y < R; y++) {
        if (!T[y * C + x]) { depth = -1; continue; }
        depth++;
        const pair = SHADES[shadeFor(depth)];
        tctx.fillStyle = pair[hash2(x, y) & 1]; tctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        if (depth > 3 && (hash2(x, y) & 31) === 0) { tctx.fillStyle = 'rgba(30,20,35,.25)'; tctx.fillRect(x * CELL + 2, y * CELL + 2, 3, 3); }
      }
    }
    for (const s of ui.scorch) { // soot only on the ground that's left
      tctx.save(); tctx.globalCompositeOperation = 'source-atop';
      const g = tctx.createRadialGradient(s.x, s.y, s.r * 0.6, s.x, s.y, s.r * 1.5); g.addColorStop(0, 'rgba(30,18,28,.75)'); g.addColorStop(1, 'rgba(30,18,28,0)');
      tctx.fillStyle = g; tctx.beginPath(); tctx.arc(s.x, s.y, s.r * 1.5, 0, 7); tctx.fill(); tctx.restore();
    }
    // ink edges where ground meets air, and grass tufts on top
    tctx.fillStyle = '#2A1A2A';
    for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
      if (!T[y * C + x]) continue;
      const px = x * CELL, py = y * CELL;
      if (x > 0 && !T[y * C + x - 1]) tctx.fillRect(px, py, 2, CELL);
      if (x < C - 1 && !T[y * C + x + 1]) tctx.fillRect(px + CELL - 2, py, 2, CELL);
      if (y < R - 1 && !T[(y + 1) * C + x]) tctx.fillRect(px, py + CELL - 2, CELL, 2);
      if (y > 0 && !T[(y - 1) * C + x]) {
        tctx.fillRect(px, py - 1, CELL, 2);
        if ((hash2(x, y) & 3) === 0) { tctx.fillStyle = '#B8EC74'; tctx.fillRect(px + 2, py - 4, 2, 4); tctx.fillRect(px + 5, py - 3, 2, 3); tctx.fillStyle = '#2A1A2A'; }
      }
    }
    ui.terrainDirty = false;
  }

  // ---------- particles ----------
  function burst(x, y, n, kind) {
    const lim = reduced ? Math.ceil(n / 3) : n;
    for (let i = 0; i < lim; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * (kind === 'chunk' ? 360 : 160);
      ui.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (kind === 'chunk' ? 160 : 40), t: 0, life: kind === 'smoke' ? 1.4 + Math.random() : 0.7 + Math.random() * 0.7, kind,
        c: kind === 'chunk' ? SHADES[2 + (i % 3)][i & 1] : kind === 'spark' ? (i & 1 ? '#FFD34D' : '#FF8A3D') : kind === 'drop' ? '#9FE8E0' : 'rgba(60,45,70,.5)', size: kind === 'smoke' ? 10 + Math.random() * 14 : 2 + Math.random() * 4 });
    }
  }
  function stepParts(dt) {
    for (const p of ui.parts) {
      p.t += dt;
      if (p.kind === 'smoke') { p.vx = p.vx * 0.96 + ui.G.wind * 3 * dt; p.vy = p.vy * 0.96 - 18 * dt; p.size += 10 * dt; }
      else { p.vy += 900 * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    ui.parts = ui.parts.filter((p) => p.t < p.life && p.y < H + 40);
    for (const p of ui.pops) p.t += dt; ui.pops = ui.pops.filter((p) => p.t < 1.2);
  }

  // ---------- engine events → effects ----------
  function onFx(fx) {
    for (const e of fx) {
      if (e.k === 'boom') {
        const x = e.x * CELL, y = e.y * CELL, r = e.r * CELL;
        ui.scorch.push({ x, y, r }); ui.terrainDirty = true;
        burst(x, y, Math.round(e.r * 7), 'chunk'); burst(x, y, Math.round(e.r * 5), 'spark'); burst(x, y, Math.round(e.r * 2.5), 'smoke');
        ui.parts.push({ x, y, t: 0, life: 0.25, kind: 'flash', size: r * 2.2 });
        if (!reduced) ui.shake = Math.min(26, ui.shake + e.r * 3.5);
        SFX.boom(e.r);
      } else if (e.k === 'splash') { burst(e.x * CELL, e.y * CELL, 18, 'drop'); SFX.splash(); }
      else if (e.k === 'bolt') {
        const x = e.x * CELL, gy = WB.surfaceY(ui.G, e.x) * CELL;
        ui.parts.push({ x, y: gy, t: 0, life: 0.45, kind: 'bolt', seed: Math.random() * 1000 });
        ui.parts.push({ x, y: gy, t: 0, life: 0.2, kind: 'flash', size: 70 });
        burst(x, gy, 14, 'spark'); if (!reduced) ui.shake = Math.min(26, ui.shake + 8);
        noise(0.35, 6000, 800, 0.3); tone(1800, 200, 0.25, 0.12, 'sawtooth');
        for (const id of e.hits) { const u = ui.G.units.find((v) => v.id === id); if (u) ui.pops.push({ x: u.x * CELL, y: u.y * CELL - 50, t: 0, text: 'ZAP!', c: '#8FD8FF' }); }
      }
      else if (e.k === 'quake') {
        if (!reduced) ui.shake = Math.min(34, ui.shake + 22);
        noise(1.1, 300, 40, 0.5); tone(55, 30, 0.9, 0.4);
        for (let x = 40; x < W; x += 80) burst(x, WB.surfaceY(ui.G, x / CELL) * CELL, 3, 'chunk');
        for (const id of e.hits) { const u = ui.G.units.find((v) => v.id === id); if (u) { burst(u.x * CELL, u.y * CELL, 10, 'smoke'); ui.pops.push({ x: u.x * CELL, y: u.y * CELL - 50, t: 0, text: 'QUAKE!', c: '#FFB86B' }); } }
      }
      else if (e.k === 'tornado') {
        ui.parts.push({ x: e.x * CELL, y: e.y * CELL, t: 0, life: 1.1, kind: 'swirl' });
        noise(1.0, 2500, 300, 0.3); if (!reduced) ui.shake = Math.min(26, ui.shake + 10);
        ui.pops.push({ x: e.x * CELL, y: e.y * CELL - 60, t: 0, text: 'TORNADO!', c: '#7BE07A' });
      }
      else if (e.k === 'dud') { SFX.thunk(); ui.pops.push({ x: e.x * CELL, y: e.y * CELL - 22, t: 0, text: 'LIVE DUD!', c: '#FFD34D' }); }
      else if (e.k === 'ko') {
        const u = ui.G.units.find((x) => x.id === e.id);
        ui.pops.push({ x: e.x * CELL, y: e.y * CELL - 40, t: 0, text: e.why === 'water' ? 'SPLASH OUT!' : 'K.O.!', c: '#FF4D5E' });
        if (!reduced) ui.slow = 0.75;
        SFX.ko(); if (u) banner(`${unitName(u)} ${unitName(u) === 'You' ? 'are' : 'is'} out!`, charName(u.team), TEAMS[u.team].c);
      } else if (e.k === 'turn') { onTurn(); }
    }
  }
  function onTurn() {
    const G = ui.G, u = WB.current(G); if (!u) return;
    const ss = WB.ssReady(G);
    ui.tLeft = TURN_SECONDS; ui.lob = false; ui.weapon = ss ? 'ss' : 'shot1'; ui.cpu = null;
    if (!isCPU(G.team)) ui.turnsSeen++;
    banner(sideLabel(G.team), `${charName(G.team)}${ss ? ' · SS READY!' : ''}${isCPU(G.team) ? '' : ui.mode === 'solo' ? ' · your turn' : ''}`, TEAMS[G.team].c);
    if (ss) tone(660, 990, 0.25, 0.12, 'triangle');
    renderHUD(); renderCtl(); coachLine();
  }
  function banner(big, small, color) {
    const h = $('#bannerHost');
    h.innerHTML = `<div class="banner" style="color:${color || '#FFF3E0'}">${esc(big)}${small ? `<small>${esc(small)}</small>` : ''}</div>`;
    clearTimeout(banner.t); banner.t = setTimeout(() => { h.innerHTML = ''; }, 1600);
  }

  // ---------- aiming ----------
  function aimOf(u) {
    if (!ui.aim[u.id]) ui.aim[u.id] = { angle: u.x < WB.COLS / 2 ? 50 : 130, power: 0.62 };
    return ui.aim[u.id];
  }
  function canAct() { return ui.screen === 'game' && !ui.paused && ui.G && ui.G.phase === 'aim' && !isCPU(ui.G.team); }

  // ---------- computer turns (1 Player) ----------
  // The bot decides on a copy of the game (same seed and state, so the same choice), then the moves are played on
  // the real game one by one, with pauses so you can watch it walk, aim and fire.
  function cpuStart() {
    const plan = WB.botTurn(JSON.parse(JSON.stringify(ui.G)), ui.level);
    ui.cpu = { plan, i: 0, t: 0.8, aimed: false };
  }
  function cpuStep(dt) {
    const c = ui.cpu, G = ui.G; c.t -= dt * (ui.fast ? 8 : 1); if (c.t > 0) return;
    const it = c.plan[c.i++], u = WB.current(G);
    if (!it || !u) { if (G.phase === 'aim') WB.act(G, { k: 'pass' }); ui.cpu = null; renderCtl(); return; }
    if (it.k === 'move') { WB.act(G, it); c.t = 0.09; renderCtl(); return; }
    if (it.k === 'weapon') { WB.act(G, it); ui.weapon = it.w; c.t = 0.3; renderCtl(); coachLine(); return; }
    if ((it.k === 'fire' || it.k === 'lob') && !c.aimed) { const a = aimOf(u); a.angle = it.angle; a.power = it.power; ui.lob = it.k === 'lob'; c.aimed = true; c.i--; c.t = 0.75; return; }
    if (WB.act(G, it) && (it.k === 'fire' || it.k === 'lob')) { SFX.fire(); burst(...muzzle(u, aimOf(u)), 8, 'spark'); }
    if (G.phase !== 'aim') { ui.cpu = null; renderCtl(); coachLine(); }
  }
  function doFire() {
    if (!canAct()) return false;
    const G = ui.G, u = WB.current(G), a = aimOf(u);
    let ok;
    if (ui.lob) {
      const ds = WB.lobbable(G); if (!ds.length) { ui.lob = false; renderCtl(); return false; }
      const [cx, cy] = WB.center(u); ds.sort((p, q) => Math.hypot(p.x - cx, p.y - cy) - Math.hypot(q.x - cx, q.y - cy));
      ok = WB.act(G, { k: 'lob', dud: ds[0].id, angle: a.angle, power: a.power });
    } else {
      if (G.weapon !== ui.weapon) WB.act(G, { k: 'weapon', w: ui.weapon });
      ok = WB.act(G, { k: 'fire', angle: a.angle, power: a.power });
    }
    if (ok) { SFX.fire(); burst(...muzzle(u, a), 8, 'spark'); renderCtl(); coachLine(); }
    return ok;
  }
  function muzzle(u, a) { const [cx, cy] = WB.center(u), r = a.angle * Math.PI / 180; return [(cx + Math.cos(r) * 2.2) * CELL, (cy - Math.sin(r) * 2.2) * CELL]; }
  function walk(dir) { if (!canAct()) return; if (WB.act(ui.G, { k: 'move', dir })) { SFX.click(); renderCtl(); coachLine(); } }
  function pass() { if (canAct()) { WB.act(ui.G, { k: 'pass' }); renderCtl(); } }

  function stagePoint(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
  cv.addEventListener('pointerdown', (e) => {
    audio(); if (!canAct()) return;
    const [x, y] = stagePoint(e); ui.drag = { x0: x, y0: y, x, y, id: e.pointerId };
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!ui.drag || e.pointerId !== ui.drag.id) return;
    [ui.drag.x, ui.drag.y] = stagePoint(e);
    const dx = ui.drag.x0 - ui.drag.x, dy = ui.drag.y0 - ui.drag.y, len = Math.hypot(dx, dy);
    if (len < DRAG_MIN || !canAct()) return;
    const a = aimOf(WB.current(ui.G));
    a.angle = Math.round(((Math.atan2(-dy, dx) * 180 / Math.PI) + 360) % 360 * 10) / 10;
    if (a.angle > 180) a.angle = a.angle > 270 ? 0 : 180; // aim at the sky, never into the ground
    a.power = Math.round(clamp(len / DRAG_FULL, 0.05, 1) * 100) / 100;
  });
  const endDrag = (e) => {
    if (!ui.drag || e.pointerId !== ui.drag.id) return;
    const len = Math.hypot(ui.drag.x0 - ui.drag.x, ui.drag.y0 - ui.drag.y); ui.drag = null;
    if (len >= DRAG_MIN) doFire();
  };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', (e) => { if (ui.drag && e.pointerId === ui.drag.id) ui.drag = null; });

  addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key;
    if (ui.screen === 'end' && (k === 'r' || k === 'R')) { startMatch(); return; }
    if (ui.screen === 'level') { if (/^[1-3]$/.test(k)) { ui.level = Object.keys(LEVELS)[+k - 1]; ui.cursor = 2; selectScreen(0); } return; }
    if (ui.screen === 'select') {
      const n = WB.CHAR_IDS.length;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { ui.cursor = (ui.cursor + n - 1) % n; selectScreen(ui.pickTeam); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { ui.cursor = (ui.cursor + 1) % n; selectScreen(ui.pickTeam); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(WB.CHAR_IDS[ui.cursor]); }
      else if (/^[1-5]$/.test(k)) choose(WB.CHAR_IDS[+k - 1]);
      return;
    }
    if (k === 'Escape' || k === 'p' || k === 'P') { if (ui.screen === 'game') { e.preventDefault(); toggleMenu(); } return; }
    if (!canAct()) return;
    const a = aimOf(WB.current(ui.G)), fine = e.shiftKey ? 0.5 : 2;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); walk(-1); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); walk(1); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); a.angle = clamp(a.angle + (a.angle <= 90 ? fine : -fine), 0, 180); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); a.angle = clamp(a.angle + (a.angle <= 90 ? -fine : fine), 0, 180); }
    else if (k === 'q' || k === 'Q') a.power = clamp(Math.round((a.power - 0.02) * 100) / 100, 0.05, 1);
    else if (k === 'e' || k === 'E') a.power = clamp(Math.round((a.power + 0.02) * 100) / 100, 0.05, 1);
    else if (k === 'f' || k === 'F') { a.angle = 180 - a.angle; }
    else if (k === '1') pickWeapon(WB.ssReady(ui.G) ? 'ss' : 'shot1');
    else if (k === '2' || k === '3') pickWeapon(WB.WEAPON_IDS[+k - 1]);
    else if (k === 'l' || k === 'L') toggleLob();
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); doFire(); }
    else if (k === 'x' || k === 'X') pass();
  });
  function pickWeapon(w) { if (!canAct() || (w === 'ss' ? !WB.ssReady(ui.G) : ui.G.ammo[ui.G.team][w] === 0)) return; ui.weapon = w; ui.lob = false; SFX.click(); renderCtl(); coachLine(); }
  function toggleLob() { if (!canAct() || !WB.lobbable(ui.G).length) return; ui.lob = !ui.lob; SFX.click(); renderCtl(); coachLine(); }

  // ---------- HUD and controls (DOM) ----------
  function renderHUD() {
    const G = ui.G; if (!G) { $('#hud').innerHTML = ''; return; }
    const n = G.teams, half = Math.ceil(n / 2);
    const side = (t) => {
      const us = G.units.filter((u) => u.team === t), hp = us.reduce((a, u) => a + Math.max(0, u.hp), 0), max = us.reduce((a, u) => a + u.maxHp, 0);
      const out = !us.some((u) => u.alive), cur = t === G.team && G.phase !== 'over';
      return `<div class="team ${TEAMS[t].key}${t >= half ? ' r' : ''}${n > 2 ? ' sm' : ''}${out ? ' out' : ''}${cur ? ' cur' : ''}"><div><div class="nm">${esc(sideLabel(t))} <span class="cn">· ${esc(charName(t))}</span></div><div class="bar"><i style="width:${(100 * hp / max).toFixed(1)}%"></i></div></div>
        <div class="ssm${WB.ssReady(G, t) ? ' on' : ''}" title="SS charge: ready every ${WB.SS_CHARGE} turns"><span>SS</span>${Array.from({ length: WB.SS_CHARGE }, (_, i) => `<b class="${G.ss[t] > i ? 'f' : ''}"></b>`).join('')}</div>
        <div class="pips" title="rounds won">${Array.from({ length: Math.ceil(BEST_OF / 2) }, (_, i) => `<b class="${ui.wins[t] > i ? 'on' : ''}"></b>`).join('')}</div></div>`;
    };
    const w = G.wind, arrows = Math.round(Math.abs(w) / WB.WIND_MAX * 4);
    const windTxt = Math.abs(w) < 0.2 ? 'calm' : `${w < 0 ? '◀'.repeat(Math.max(1, arrows)) : ''} ${Math.abs(w).toFixed(1)} ${w > 0 ? '▶'.repeat(Math.max(1, arrows)) : ''}`;
    const left = Array.from({ length: half }, (_, t) => side(t)).join(''), right = Array.from({ length: n - half }, (_, i) => side(n - 1 - i)).join('');
    $('#hud').innerHTML = `<div class="sidegrp">${left}</div>` + `<div class="mid"><div class="timer${ui.timerOn ? '' : ' off'}" id="timer">${ui.timerOn ? Math.ceil(ui.tLeft) : '∞'}</div><div class="wind" aria-label="wind">WIND ${windTxt}</div><div class="wind" style="font-size:12px;opacity:.8">Round ${ui.round}${ui.mode === 'solo' ? ' · ' + LEVELS[ui.level].name : ''}${G.turn >= WB.suddenTurn(G) ? ' · <span style="color:#FF4D5E">SUDDEN DEATH: the water rises</span>' : ''}</div>${orderHTML()}</div><div class="sidegrp r">${right}</div>`;
  }
  // The next turns if everyone keeps firing their Shot 1, counting the current side's chosen shot: what the
  // turn delay means right now. Light shot: you may go again before them; heavy shot: they may go twice.
  function orderHTML() {
    const G = ui.G; if (!G || G.phase !== 'aim') return '<div class="order"></div>';
    const w = ui.lob ? 'lob' : ui.weapon, d = G.units.filter((u) => u.alive).map((u) => ({ u, d: u.id === G.actor ? WB.delayIf(G, w) : u.delay }));
    const seq = [];
    for (let i = 0; i < 6 && d.length; i++) { d.sort((a, b) => a.d - b.d || a.u.id - b.u.id); const x = d[0]; seq.push(x.u.team); x.d += WB.shotSpec(G, x.u.team, 'shot1').delay; }
    return `<div class="order" title="Who plays next, if everyone fires their Shot 1 after this">NEXT ${seq.map((t) => `<b style="background:${TEAMS[t].c}">${esc(sideLabel(t) === 'You' ? 'You' : ui.mode === 'solo' ? TEAMS[t].name[0] : 'P' + (t + 1))}</b>`).join('')}</div>`;
  }
  function renderCtl() {
    const G = ui.G; $('#bMenu').hidden = !G || ui.screen !== 'game';
    if (!G || ui.screen !== 'game') { $('#ctl').innerHTML = ''; return; }
    const o = $('.order'); if (o) o.outerHTML = orderHTML();
    if (isCPU(G.team) && G.phase === 'aim') { $('#ctl').innerHTML = `<span class="cputag" style="--tc:${TEAMS[G.team].c}">${esc(sideLabel(G.team))} (${esc(charName(G.team))}) is taking its turn…</span>`; return; }
    const aim = G.phase === 'aim', am = G.ammo[G.team], lob = WB.lobbable(G).length > 0;
    const wb = (w, key) => { const S = WB.shotSpec(G, G.team, w);
      return `<button class="btn wpn${ui.weapon === w && !ui.lob ? '' : ' ghost'}" type="button" data-w="${w}" aria-pressed="${ui.weapon === w && !ui.lob}" title="${esc(S.desc)} Turn delay +${S.delay}." ${!aim || am[w] === 0 ? 'disabled' : ''}>${esc(S.name)}<small>${key} · ${am[w] < 0 ? '∞' : am[w] + ' left'} · ⏱${S.delay}</small></button>`; };
    $('#ctl').innerHTML = `<button class="btn ghost" type="button" data-walk="-1" aria-label="Walk left" ${aim && G.moves ? '' : 'disabled'}>◀</button>
      <span class="steps">${G.moves} steps</span>
      <button class="btn ghost" type="button" data-walk="1" aria-label="Walk right" ${aim && G.moves ? '' : 'disabled'}>▶</button>
      ${WB.ssReady(G) ? `<button class="btn wpn ss${ui.weapon === 'ss' && !ui.lob ? '' : ' dim'}" type="button" data-w="ss" aria-pressed="${ui.weapon === 'ss' && !ui.lob}" title="${esc(WB.shotSpec(G, G.team, 'ss').desc)}" ${aim ? '' : 'disabled'}>SS · ${esc(WB.shotSpec(G, G.team, 'ss').name)}<small>1 · ready · ⏱${WB.shotSpec(G, G.team, 'ss').delay}</small></button>` : wb('shot1', '1')}${wb('shot2', '2')}${wb('dud', '3')}
      <button class="btn teal" type="button" data-act="lob" aria-pressed="${ui.lob}" ${aim && lob ? '' : 'disabled'} title="Pick up a live dud in reach (L)">LOB</button>
      <button class="btn fire" type="button" data-act="fire" ${aim ? '' : 'disabled'}>FIRE</button>
      <button class="btn ghost sm" type="button" data-act="pass" ${aim ? '' : 'disabled'} title="End your turn (X)">Skip</button>`;
  }
  function coachLine() {
    const el = $('#coach'); if (!ui.coach || ui.screen !== 'game' || !ui.G) { el.innerHTML = ''; return; }
    const G = ui.G, u = WB.current(G); if (!u || G.phase !== 'aim') { el.innerHTML = ''; return; }
    if (isCPU(G.team)) { el.innerHTML = ''; return; }
    const danger = G.duds.find((d) => d.fuse <= 1 && Math.hypot(d.x - u.x, d.y - u.y) < WB.DUD.r * WB.DMG_SPREAD);
    let t;
    if (danger && WB.lobbable(G).includes(danger)) t = '<b>That dud blows at the end of this turn!</b> Tap LOB (L), then drag to throw it away.';
    else if (danger) t = '<b>That dud blows at the end of this turn!</b> Walk away with ◀ ▶, or lob it if you can reach it.';
    else if (ui.lob) t = 'Lob armed: drag back from your unit and let go to throw the dud. It keeps its countdown.';
    else if (WB.lobbable(G).length) t = 'A <b>live dud</b> is in reach. Tap <b>LOB</b> (L) to throw it at them instead of firing.';
    else if (ui.turnsSeen <= 2) t = '<b>Drag back</b> from your glowing unit and <b>let go</b> to fire. Further back = more power. Watch the wind.';
    else if (ui.turnsSeen === 3) t = '<b>Turn delay:</b> every shot has a cost (⏱ on the buttons). Light shots bring your next turn sooner. The NEXT strip up top shows who plays next.';
    else if (ui.turnsSeen <= 5) t = 'Keys: <b>◀ ▶</b> walk · <b>▲ ▼</b> angle · <b>Q/E</b> power · <b>1 2 3</b> shots · <b>Space</b> fire.';
    else if (ui.weapon === 'ss') t = `<b>SS ready: ${esc(WB.shotSpec(G, G.team, 'ss').name)}!</b> ${esc(WB.shotSpec(G, G.team, 'ss').desc)} It replaces Shot 1 until you use it.`;
    else if (ui.weapon === 'shot2') t = `<b>${esc(WB.shotSpec(G, G.team, 'shot2').name)}:</b> ${esc(WB.shotSpec(G, G.team, 'shot2').desc)} (${G.ammo[G.team].shot2} left this match)`;
    else if (ui.weapon === 'dud') t = 'A live dud lands and ticks for <b>3 turns</b>. Anyone close can lob it back, so drop it where they can\'t reach.';
    else t = '';
    el.innerHTML = t;
  }

  // ---------- screens ----------
  function show(html, clear) { $('#screen').innerHTML = `<div class="screen${clear ? ' clear' : ''}"><div class="card" role="dialog" aria-modal="true">${html}</div></div>`; }
  function hide() { $('#screen').innerHTML = ''; }
  const HOW = `<div class="how">
    <div><b>1 · Aim</b>Drag back from your glowing unit and let go. Further back is more power.</div>
    <div><b>2 · Wind</b>The arrow up top pushes every shot. It changes each turn.</div>
    <div><b>3 · Ground</b>Blasts carve the map. Knock them into the water or off a cliff.</div>
    <div><b>4 · Live duds</b>A dud ticks for 3 turns. Walk up to one and LOB it back.</div>
    <div style="grid-column:1/-1"><b>5 · SS (Special Shot)</b>Your character's ultimate. It charges one notch a turn (the SS meter up top) and takes over Shot 1 when it's full. Using it starts the charge again.</div></div>
    <p class="keys">Keys: ◀ ▶ / A D walk · ▲ ▼ / W S angle (Shift = fine) · Q E power · F flip · 1 2 3 shots · L lob · Space fire · X skip · Esc menu</p>`;
  function titleScreen() {
    ui.screen = 'title'; renderCtl(); coachLine();
    show(`<div class="tag">JustAskJoe · Prototype 1</div><h1>WORMSBOUND</h1>
      <p>Pick a character, read the wind, blast the ground, and throw their own duds back at them. Best of three.</p>${HOW}
      <div class="row"><button class="btn fire" type="button" data-act="mode" data-mode="solo">1 PLAYER<small style="display:block;font-family:var(--body);font-size:12px">you vs 3 computers</small></button>
      <button class="btn teal" type="button" data-act="mode" data-mode="duel">2 PLAYERS<small style="display:block;font-family:var(--body);font-size:12px">1v1 on one keyboard</small></button></div>`);
  }
  function levelScreen() {
    ui.screen = 'level'; ui.G = null; renderHUD(); renderCtl(); coachLine();
    show(`<div class="tag">1 Player · step 1 of 2</div><h2>How tough should the computers be?</h2>
      <p>You against three of them, every side for itself. Last one standing takes the round.</p>
      <div class="row lv">${Object.entries(LEVELS).map(([k, L], i) => `<button class="btn ${k === ui.level ? 'gold' : 'ghost'} lvl" type="button" data-act="level" data-level="${k}">${L.name}<small>${esc(L.blurb)}</small><span class="num">${i + 1}</span></button>`).join('')}</div>
      <div class="row"><button class="btn ghost sm" type="button" data-act="quit">Back</button></div>`);
  }
  // ---------- character select: each crew picks one of five ----------
  function statBar(label, v, txt) { return `<div class="sb"><span>${label}</span><i><b style="width:${Math.round(clamp(v, 0.06, 1) * 100)}%"></b></i><em>${txt}</em></div>`; }
  function selectScreen(team) {
    ui.screen = 'select'; ui.pickTeam = team; ui.G = null; ui.paused = false;
    renderHUD(); renderCtl(); coachLine();
    const T = TEAMS[team], other = ui.mode === 'duel' && team === 1 && ui.picks[0] ? `Player 1 picked <b style="color:${TEAMS[0].c}">${esc(WB.CHARS[ui.picks[0]].name)}</b>. ` : '';
    const mul = ui.mode === 'solo' ? WB.HP_MUL.ffa : WB.HP_MUL.duel;
    const cards = WB.CHAR_IDS.map((id, i) => {
      const C = WB.CHARS[id];
      return `<button class="char${i === ui.cursor ? ' cur' : ''}" type="button" data-act="pick" data-char="${id}" style="--tc:${T.c}" aria-label="${esc(C.name)}, ${esc(C.role)}">
        <img src="${portrait(id, team)}" alt="" width="150" height="110"><span class="num">${i + 1}</span>
        <b class="cn">${esc(C.name)}</b><span class="role">${esc(C.role)}</span>
        ${statBar('Health', C.hp / 115, Math.round(C.hp * mul))}${statBar('Armour', (1 - C.armor) / 0.15 + 0.06, C.armor < 1 ? `−${Math.round((1 - C.armor) * 100)}%` : '–')}${statBar('Move', C.steps / 22, C.steps + ' steps')}${statBar('Wind grip', (2 - (C.shot1.wind || 1)) / 1.55, (C.shot1.wind || 1) < 1 ? 'steady' : (C.shot1.wind || 1) > 1 ? 'curvy' : 'normal')}
        <span class="bl">${esc(C.blurb)}</span>
        <span class="sh"><b>1 · ${esc(C.shot1.name)}</b> ${esc(C.shot1.desc)}</span>
        <span class="sh two"><b>2 · ${esc(C.shot2.name)}</b> ${esc(C.shot2.desc)} <em>2 a match</em></span>
        <span class="sh ss"><b>SS · ${esc(C.ss.name)}</b> ${esc(C.ss.desc)} <em>every ${WB.SS_CHARGE} turns</em></span></button>`;
    }).join('');
    $('#screen').innerHTML = `<div class="screen"><div class="pick" role="dialog" aria-modal="true">
      <div class="tag">${ui.mode === 'solo' ? `1 Player · ${LEVELS[ui.level].name} · step 2 of 2` : `2 Players · step ${team + 1} of 2`} · everyone also carries 2 Live duds</div>
      <h2 style="color:${T.c}">${ui.mode === 'solo' ? 'Pick your character' : `Player ${team + 1}, pick your character`}</h2>
      <p class="sub">${other}${ui.mode === 'solo' ? 'The three computers get random characters.' : 'Same pick as the other player is fine.'}</p>
      <div class="chars">${cards}</div>
      <div class="row"><button class="btn ghost sm" type="button" data-act="pickback">Back</button><span class="keys">← → choose · Enter to pick · or press 1–5</span></div></div></div>`;
  }
  function choose(id) {
    if (!WB.CHARS[id] || ui.screen !== 'select') return;
    ui.picks[ui.pickTeam] = id; SFX.click();
    if (ui.mode === 'solo') { // the computers take random characters, different from each other where possible
      const rest = WB.CHAR_IDS.filter((c) => c !== id).sort(() => Math.random() - 0.5);
      ui.picks = [id, rest[0], rest[1], rest[2]]; startMatch();
    } else if (ui.pickTeam === 0) { ui.cursor = 2; selectScreen(1); } else startMatch();
  }

  function toggleMenu() {
    if (ui.paused) { ui.paused = false; hide(); return; }
    ui.paused = true;
    const tg = (id, on, label) => `<div class="toggle-row"><span>${label}</span><button class="btn sm${on ? ' gold' : ' ghost'}" type="button" data-tg="${id}" aria-pressed="${on}">${on ? 'On' : 'Off'}</button></div>`;
    show(`<h2>Paused</h2>${tg('timer', ui.timerOn, `Turn timer (${TURN_SECONDS} s)`)}${tg('sound', ui.sound, 'Sound')}${tg('coach', ui.coach, 'Coach tips')}
      <div class="toggle-row"><span>Tester: let a bot take this turn${ui.tester ? ' <span style="color:#FF4D5E">(this match is flagged)</span>' : ''}</span><button class="btn sm ghost" type="button" data-act="botturn">Bot turn</button></div>
      <div class="row"><button class="btn fire" type="button" data-act="resume">RESUME</button><button class="btn ghost" type="button" data-act="how">How to play</button>
      <button class="btn ghost" type="button" data-act="restart">Restart round</button><button class="btn ghost" type="button" data-act="quit">Quit to title</button></div>`, true);
  }
  function roundOver() {
    const G = ui.G, w = G.winner;
    if (w >= 0) ui.wins[w]++;
    const need = Math.ceil(BEST_OF / 2);
    const done = ui.wins.some((x) => x >= need);
    ui.screen = done ? 'end' : 'round'; renderCtl(); coachLine(); renderHUD();
    if (done) SFX.win();
    const you = ui.mode === 'solo' && w === 0;
    const head = w < 0 ? 'Draw!' : you ? (done ? 'You win the match!' : `You take round ${ui.round}!`) : `${sideLabel(w)} ${done ? 'wins the match!' : `takes round ${ui.round}`}`;
    const col = w < 0 ? '#FFF3E0' : TEAMS[w].c;
    const st = G.stats;
    ui.endHTML = `<div class="tag">${done ? 'Match over' : `Round ${ui.round} of ${BEST_OF}`}${ui.tester ? ' · TESTER' : ''}</div><h2 style="color:${col}">${esc(head)}</h2>${ui.mode === 'solo' ? `<p style="margin:0">vs three ${LEVELS[ui.level].name} computers</p>` : ''}
      <div class="score">${ui.wins.map((x, t) => `<span style="color:${TEAMS[t].c}" title="${esc(sideLabel(t))} · ${esc(charName(t))}">${x}</span>`).join(' – ')}</div>
      <p style="margin:0;font-size:15px">${ui.wins.map((x, t) => `<b style="color:${TEAMS[t].c}">${esc(sideLabel(t))}</b> ${esc(charName(t))}`).join(' · ')}</p>
      <p>${done ? 'Last round: ' : ''}${G.turn} turns · ${st.shots} shots · ${st.lobs} lobs · ${st.dudBlasts} dud blasts${st.chains ? ` · ${st.chains} chain reaction${st.chains > 1 ? 's' : ''}` : ''}${st.drowned ? ` · ${st.drowned} splashed out` : ''}</p>
      <div class="row">${done
        ? `<button class="btn fire" type="button" data-act="rematch">REMATCH (R)</button><button class="btn gold" type="button" data-act="pickagain">New characters</button><button class="btn teal" type="button" data-act="feedback">Give feedback</button><button class="btn ghost" type="button" data-act="quit">Title</button>`
        : `<button class="btn fire" type="button" data-act="next">${w < 0 ? 'REPLAY ROUND' : 'NEXT ROUND'}</button>`}</div>`;
    show(ui.endHTML);
  }

  // ---------- feedback (artifact db, then the site's feedback route, then copy) ----------
  const FQ = [
    { id: 'rematch', q: 'Did you want a rematch right away?', opts: ['Yes, right now', 'Maybe later', 'No'] },
    { id: 'level', q: 'The computers (1 Player): how hard did they feel?', opts: ['Too easy', 'About right', 'Too hard', 'Played 1v1'] },
    { id: 'delay', q: 'Turn delay (heavy shots make you wait longer): did it make sense?', opts: ['Yes, I used it', 'Sort of', "Didn't notice"] },
    { id: 'char', q: 'Which character was the most fun?', opts: WB.CHAR_IDS.map((c) => WB.CHARS[c].name) },
    { id: 'fair', q: 'Did any character feel too strong or too weak?', opts: ['All felt fair', 'One was too strong', 'One was too weak'] },
    { id: 'duds', q: 'Live duds: how did they feel?', opts: ['Loved them', 'Fine', "Didn't notice", 'Annoying'] },
    { id: 'aim', q: 'Aiming with drag-and-release?', opts: ['Precise', 'OK', 'Fiddly'] },
    { id: 'read', q: 'Could you always tell whose turn it was and what was happening?', opts: ['Always', 'Mostly', 'Got lost'] },
  ];
  function feedbackScreen() {
    const F = ui.fb;
    show(`<h2>How was it?</h2>${FQ.map((f) => `<div class="fq"><label>${esc(f.q)}</label><div class="choices">${f.opts.map((o) => `<button class="btn sm${F.q[f.id] === o ? ' gold' : ' ghost'}" type="button" data-fq="${f.id}" data-fv="${esc(o)}" aria-pressed="${F.q[f.id] === o}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
      <div class="fq"><label for="fbText">Anything else? (best moment, what confused you)</label><textarea id="fbText">${esc(F.text)}</textarea></div>
      <div class="fq"><label for="fbName">Your name (optional)</label><input id="fbName" value="${esc(F.nm)}"></div>
      ${F.saved === true ? '<p style="color:#22C3B5">Thanks! Saved.</p>' : F.saved === 'copy' ? `<p>Couldn't save from here. Copy this and send it to the crew:</p><textarea readonly style="width:100%;min-height:90px">${esc(feedbackText())}</textarea>` : ''}
      <div class="row"><button class="btn fire" type="button" data-act="fbsend">Send</button><button class="btn ghost" type="button" data-act="fbback">Back</button></div>`);
  }
  function feedbackText() {
    const F = ui.fb, G = ui.G;
    return ['Wormsbound P1 feedback', ...FQ.map((f) => `${f.q} ${F.q[f.id] || '–'}`), `Notes: ${F.text || '–'}`,
      `From: ${F.nm || 'anonymous'} · ${ui.mode === 'solo' ? '1 Player, ' + ui.level : '1v1'} · ${ui.picks.join(' vs ')} · score ${ui.wins.join('-')} · seed ${ui.matchSeed}${ui.tester ? ' · TESTER' : ''}${G ? ` · last round ${G.turn} turns, ${G.stats.lobs} lobs` : ''}`].join('\n');
  }
  async function sendFeedback() {
    const F = ui.fb; const t = $('#fbText'), n = $('#fbName'); if (t) F.text = t.value; if (n) F.nm = n.value;
    const body = { answers: F.q, notes: F.text, name: F.nm, mode: ui.mode, level: ui.mode === 'solo' ? ui.level : null, chars: ui.picks.slice(), score: ui.wins.slice(), seed: ui.matchSeed, tester: ui.tester, build: 'P1', at: new Date().toISOString() };
    try {
      const db = window.claude && window.claude.use ? await window.claude.use('db') : null;
      if (!db) throw new Error('no db');
      await db.collection('feedback').add(body); F.saved = true;
    } catch (e) {
      try { const r = await fetch('/forge/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ game: 'wormsbound' }, body)) }); F.saved = r.ok ? true : 'copy'; }
      catch (e2) { F.saved = 'copy'; }
    }
    feedbackScreen();
  }

  // ---------- match flow ----------
  function startRound() {
    const first = (ui.round - 1) % nSides();
    ui.G = WB.newGame((ui.matchSeed + ui.round * 7919) >>> 0, { teams: nSides(), first, chars: ui.picks });
    ui.aim = {}; ui.cpu = null; ui.parts = []; ui.trails = {}; ui.scorch = []; ui.pops = []; ui.acc = 0; ui.slow = 0; ui.shake = 0; ui.overAt = 0; ui.paused = false;
    bakeBackground(ui.G.seed); renderTerrain();
    ui.screen = 'game'; hide(); onTurn();
  }
  function startMatch() {
    if (ui.picks.length !== nSides() || ui.picks.some((c) => !c)) { ui.cursor = 2; selectScreen(0); return; }
    ui.matchSeed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    if (window.__WB_SEED != null) ui.matchSeed = window.__WB_SEED >>> 0; // tests pin the seed
    ui.round = 1; ui.wins = new Array(nSides()).fill(0); ui.tester = false; ui.fb = { q: {}, text: '', nm: '', saved: null };
    startRound();
  }
  function botTurn() { if (!canAct() && !(ui.paused && ui.G && ui.G.phase === 'aim')) return; ui.tester = true; ui.paused = false; hide(); WB.botTurn(ui.G, 'smart'); renderCtl(); }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; audio();
    const act = b.dataset.act;
    if (b.dataset.walk) return; // handled on pointerdown (hold to repeat)
    if (b.dataset.w) { pickWeapon(b.dataset.w); return; }
    if (b.dataset.fq) { ui.fb.q[b.dataset.fq] = b.dataset.fv; const t = $('#fbText'), n = $('#fbName'); if (t) ui.fb.text = t.value; if (n) ui.fb.nm = n.value; feedbackScreen(); return; }
    if (b.dataset.tg) {
      const k = b.dataset.tg; ui[k === 'timer' ? 'timerOn' : k] = !ui[k === 'timer' ? 'timerOn' : k];
      lsSet('wb-' + k, ui[k === 'timer' ? 'timerOn' : k] ? 'on' : 'off'); ui.paused = false; toggleMenu(); renderHUD(); coachLine(); return;
    }
    switch (act) {
      case 'mode': ui.mode = b.dataset.mode === 'solo' ? 'solo' : 'duel'; ui.picks = new Array(nSides()).fill(null); if (ui.mode === 'solo') levelScreen(); else { ui.cursor = 2; selectScreen(0); } break;
      case 'level': ui.level = LEVELS[b.dataset.level] ? b.dataset.level : 'medium'; lsSet('wb-level', ui.level); ui.cursor = 2; selectScreen(0); break;
      case 'start': case 'pickagain': ui.picks = new Array(nSides()).fill(null); ui.cursor = 2; selectScreen(0); break;
      case 'rematch': startMatch(); break;
      case 'pick': choose(b.dataset.char); break;
      case 'pickback': if (ui.mode === 'duel' && ui.pickTeam === 1) { ui.picks[0] = null; selectScreen(0); } else if (ui.mode === 'solo') levelScreen(); else titleScreen(); break;
      case 'next': ui.round += ui.G.winner >= 0 ? 1 : 0; startRound(); break;
      case 'fire': doFire(); break;
      case 'lob': toggleLob(); break;
      case 'pass': pass(); break;
      case 'menu': if (ui.screen === 'game') toggleMenu(); break;
      case 'resume': ui.paused = false; hide(); break;
      case 'how': show(`<h2>How to play</h2>${HOW}<div class="row"><button class="btn fire" type="button" data-act="resume">BACK TO THE FIGHT</button></div>`, true); break;
      case 'restart': ui.paused = false; startRound(); break;
      case 'quit': ui.paused = false; ui.G = null; renderHUD(); titleScreen(); break;
      case 'botturn': botTurn(); break;
      case 'feedback': feedbackScreen(); break;
      case 'fbsend': sendFeedback(); break;
      case 'fbback': show(ui.endHTML); break;
    }
  });
  // walk buttons repeat while held
  let walkTimer = null;
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('[data-walk]'); if (!b || b.disabled) return;
    const dir = +b.dataset.walk; walk(dir); clearInterval(walkTimer); walkTimer = setInterval(() => walk(dir), 140);
  });
  const stopWalk = () => { clearInterval(walkTimer); walkTimer = null; };
  addEventListener('pointerup', stopWalk); addEventListener('pointercancel', stopWalk); addEventListener('blur', stopWalk);

  // ---------- drawing ----------
  // One crewmate: team-coloured body (who's who at a glance) plus the character's own headgear (what they can do).
  function drawBody(c, x, y, R, team, ch, face, t, bob) {
    const T = TEAMS[team], k = R / 12, cy = y - R + bob, f = face || 1;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x, y + 1, R * (ch === 'brick' ? 1.1 : 0.9), 3.5 * k, 0, 0, 7); c.fill();
    if (ch === 'zip') { // scarf streaming behind
      const w = reduced ? 0 : Math.sin(t * 9) * 2 * k; c.fillStyle = '#FFD34D'; c.strokeStyle = '#1E1A2B'; c.lineWidth = 2 * k;
      c.beginPath(); c.moveTo(x - f * R * 0.3, cy + R * 0.35); c.quadraticCurveTo(x - f * R * 1.6, cy + R * 0.1 + w, x - f * R * 2.3, cy + R * 0.5 + w); c.lineTo(x - f * R * 2.1, cy + R * 0.85 + w); c.quadraticCurveTo(x - f * R * 1.4, cy + R * 0.7 - w, x - f * R * 0.2, cy + R * 0.75); c.closePath(); c.fill(); c.stroke();
    }
    if (ch === 'gale') { // a little kite on a string
      const kx = x - f * R * 1.9, ky = cy - R * 2.1 + (reduced ? 0 : Math.sin(t * 2.5) * 3 * k);
      c.strokeStyle = 'rgba(255,243,224,.8)'; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(x - f * R * 0.5, cy); c.quadraticCurveTo(x - f * R * 1.5, cy - R, kx, ky + R * 0.5); c.stroke();
      c.fillStyle = '#7BE07A'; c.strokeStyle = '#1E1A2B'; c.lineWidth = 2 * k; c.beginPath(); c.moveTo(kx, ky - R * 0.55); c.lineTo(kx + R * 0.4, ky); c.lineTo(kx, ky + R * 0.55); c.lineTo(kx - R * 0.4, ky); c.closePath(); c.fill(); c.stroke();
    }
    c.fillStyle = '#1E1A2B'; c.beginPath(); c.ellipse(x - 5 * k, y - 1 * k, 4.5 * k, 3 * k, 0, 0, 7); c.ellipse(x + 5 * k, y - 1 * k, 4.5 * k, 3 * k, 0, 0, 7); c.fill();
    c.lineWidth = 3 * k; c.strokeStyle = '#1E1A2B'; c.fillStyle = T.c;
    c.beginPath(); if (ch === 'brick') c.ellipse(x, cy, R * 1.18, R, 0, 0, 7); else c.arc(x, cy, R, 0, 7); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x - 4 * k, cy - 4 * k, R * 0.45, 0, 7); c.fill();
    c.lineWidth = 2.5 * k;
    if (ch === 'brick') { // steel helmet with rivets, chest plate
      c.fillStyle = '#8C8FA0'; c.beginPath(); c.roundRect(x - R * 1.25, cy - R * 1.2, R * 2.5, R * 0.85, 4 * k); c.fill(); c.stroke();
      c.fillStyle = '#1E1A2B'; for (const dx of [-0.8, 0, 0.8]) { c.beginPath(); c.arc(x + dx * R, cy - R * 0.85, 1.4 * k, 0, 7); c.fill(); }
      c.fillStyle = '#6F7280'; c.beginPath(); c.roundRect(x - R * 0.55, cy + R * 0.3, R * 1.1, R * 0.5, 2 * k); c.fill(); c.stroke();
    } else if (ch === 'zip') { // sporty cap with a visor
      c.fillStyle = T.c2; c.beginPath(); c.arc(x, cy - 3 * k, R * 0.95, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x + f * R * 0.2, cy - 3 * k); c.lineTo(x + f * R * 1.35, cy - 1 * k); c.lineTo(x + f * R * 0.2, cy); c.closePath(); c.fill(); c.stroke();
    } else if (ch === 'volt') { // helmet with a lightning rod
      c.strokeStyle = '#1E1A2B'; c.lineWidth = 3 * k; c.beginPath(); c.moveTo(x, cy - R * 1.05); c.lineTo(x, cy - R * 2); c.stroke();
      c.strokeStyle = '#FFD34D'; c.lineWidth = 1.6 * k; c.beginPath(); c.moveTo(x, cy - R * 1.05); c.lineTo(x, cy - R * 2); c.stroke();
      const sp = reduced ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(t * 7)); c.fillStyle = '#8FD8FF'; c.beginPath(); c.arc(x, cy - R * 2.05, 3.2 * k * sp + 1, 0, 7); c.fill();
      c.lineWidth = 2.5 * k; c.strokeStyle = '#1E1A2B'; c.fillStyle = T.c2; c.beginPath(); c.arc(x, cy - 2 * k, R + 2 * k, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#FFD34D'; c.beginPath(); c.moveTo(x - 2 * k, cy + 3 * k); c.lineTo(x + 2 * k, cy + 3 * k); c.lineTo(x - 1 * k, cy + 7 * k); c.lineTo(x + 3 * k, cy + 7 * k); c.lineTo(x - 2 * k, cy + 12 * k); c.lineTo(x, cy + 8 * k); c.lineTo(x - 3 * k, cy + 8 * k); c.closePath(); c.fill();
    } else if (ch === 'digger') { // miner's hard hat with a lamp
      c.fillStyle = '#FFD34D'; c.beginPath(); c.arc(x, cy - 2 * k, R + 1.5 * k, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill(); c.stroke();
      c.fillRect(x - R - 4 * k, cy - 3 * k, (R + 4 * k) * 2, 3 * k); c.strokeRect(x - R - 4 * k, cy - 3 * k, (R + 4 * k) * 2, 3 * k);
      const lx = x + f * R * 0.55, ly = cy - R * 0.6;
      const lg = c.createRadialGradient(lx, ly, 1, lx + f * 14 * k, ly + 4 * k, 22 * k); lg.addColorStop(0, 'rgba(255,250,210,.55)'); lg.addColorStop(1, 'rgba(255,250,210,0)'); c.fillStyle = lg; c.beginPath(); c.arc(lx + f * 12 * k, ly + 3 * k, 22 * k, 0, 7); c.fill();
      c.fillStyle = '#FFF3E0'; c.beginPath(); c.arc(lx, ly, 3.2 * k, 0, 7); c.fill(); c.stroke();
    } else if (ch === 'gale') { // aviator cap with ear flaps
      c.fillStyle = '#8A5A3C'; c.beginPath(); c.arc(x, cy - 2 * k, R + 1 * k, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill(); c.stroke();
      for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(x + sx * R * 0.95, cy + 2 * k, 3.2 * k, 6 * k, 0, 0, 7); c.fill(); c.stroke(); }
    }
    // goggles look where you aim
    const gx = x + f * 4 * k;
    for (const dx of [-4, 4]) { c.fillStyle = '#FFF3E0'; c.strokeStyle = '#1E1A2B'; c.lineWidth = 2.5 * k; c.beginPath(); c.arc(gx + dx * k, cy + 1 * k, 4 * k, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#1E1A2B'; c.beginPath(); c.arc(gx + (dx + f * 1.5) * k, cy + 1.5 * k, 1.8 * k, 0, 7); c.fill(); }
    return cy;
  }
  const portraits = {};
  function portrait(ch, team) {
    const key = ch + team; if (portraits[key]) return portraits[key];
    const c = document.createElement('canvas'); c.width = 300; c.height = 220; const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 220); bg.addColorStop(0, '#7A3B5E'); bg.addColorStop(1, '#FF8A3D'); g.fillStyle = bg; g.fillRect(0, 0, 300, 220);
    g.fillStyle = '#6FAE45'; g.fillRect(0, 186, 300, 34); g.fillStyle = '#A6DE62'; g.fillRect(0, 182, 300, 8);
    drawBody(g, 150, 186, 42, team, ch, team === 0 ? 1 : -1, 0.6, 0);
    return (portraits[key] = c.toDataURL());
  }
  function drawUnit(u, isCur, t) {
    const x = u.x * CELL, y = u.y * CELL, R = WB.UNIT_R * CELL, T = TEAMS[u.team];
    if (!u.alive) { // a little tombstone
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, 10, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#B9B2C4'; ctx.strokeStyle = '#1E1A2B'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 8, y - 14); ctx.arc(x, y - 14, 8, Math.PI, 0); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.c; ctx.fillRect(x - 4, y - 15, 8, 3);
      return;
    }
    const bob = isCur && !reduced ? Math.sin(t * 6) * 1.5 : 0, cy = y - R + bob;
    if (isCur) { const g = ctx.createRadialGradient(x, cy, 4, x, cy, 44); g.addColorStop(0, 'rgba(255,211,77,.45)'); g.addColorStop(1, 'rgba(255,211,77,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, 44, 0, 7); ctx.fill(); }
    drawBody(ctx, x, y, R, u.team, u.char, u.face, t, bob);
    if (u.hp < 35) { ctx.fillStyle = 'rgba(70,60,80,.55)'; ctx.beginPath(); ctx.arc(x + 6 * Math.sin(t * 2), cy - R - 6 - (t * 20 % 10), 4, 0, 7); ctx.fill(); }
    // name and hp
    const bw = 34, bx = x - bw / 2, by = cy - R - (u.char === 'volt' ? 30 : 18);
    ctx.fillStyle = 'rgba(30,26,43,.8)'; ctx.fillRect(bx - 2, by - 2, bw + 4, 8);
    ctx.fillStyle = u.hp > u.maxHp / 2 ? '#7BE07A' : u.hp > u.maxHp / 4 ? '#FFD34D' : '#FF4D5E'; ctx.fillRect(bx, by, bw * clamp(u.hp / u.maxHp, 0, 1), 4);
    ctx.font = FONT(13); ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,26,43,.9)';
    const label = `${unitName(u)} ${u.hp}`; ctx.strokeText(label, x, by - 4); ctx.fillStyle = T.c; ctx.fillText(label, x, by - 4);
    if (isCur && ui.G.phase === 'aim') { const ay = by - 20 + (reduced ? 0 : Math.sin(t * 5) * 3); ctx.fillStyle = '#FFD34D'; ctx.strokeStyle = '#1E1A2B'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 8, ay - 8); ctx.lineTo(x + 8, ay - 8); ctx.lineTo(x, ay + 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  function drawDud(d, t, inFlight) {
    const x = d.x * CELL, y = d.y * CELL - 5, pulse = reduced ? 0.5 : (Math.sin(t * (d.fuse <= 1 ? 14 : 6)) + 1) / 2;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 26); glow.addColorStop(0, `rgba(255,${d.fuse <= 1 ? 77 : 211},${d.fuse <= 1 ? 94 : 77},${0.35 + pulse * 0.4})`); glow.addColorStop(1, 'rgba(255,120,60,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill();
    ctx.fillStyle = '#2E2838'; ctx.strokeStyle = '#1E1A2B'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#C9B38A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 3, y - 6); ctx.quadraticCurveTo(x + 8, y - 13, x + 5, y - 15); ctx.stroke();
    if (!reduced) { ctx.fillStyle = pulse > 0.5 ? '#FFD34D' : '#FF8A3D'; ctx.beginPath(); ctx.arc(x + 5, y - 15, 2 + pulse * 2, 0, 7); ctx.fill(); }
    if (d.fuse != null && !inFlight) {
      ctx.font = FONT(18); ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#1E1A2B'; ctx.strokeText(String(d.fuse), x, y - 20); ctx.fillStyle = d.fuse <= 1 ? '#FF4D5E' : '#FFD34D'; ctx.fillText(String(d.fuse), x, y - 20);
    }
  }
  function drawProj(p, t) {
    if (p.wait > 0) return; // Double Tap's second dart hasn't left yet
    const x = p.x * CELL, y = p.y * CELL;
    const tr = ui.trails[p.id] || (ui.trails[p.id] = []); tr.push([x, y]); if (tr.length > 26) tr.shift();
    ctx.lineCap = 'round';
    for (let i = 1; i < tr.length; i++) { ctx.strokeStyle = `rgba(255,243,224,${i / tr.length * 0.5})`; ctx.lineWidth = (i / tr.length) * (p.w === 'bomblet' ? 3 : 5); ctx.beginPath(); ctx.moveTo(tr[i - 1][0], tr[i - 1][1]); ctx.lineTo(tr[i][0], tr[i][1]); ctx.stroke(); }
    if (p.w === 'dud') { drawDud({ x: p.x, y: p.y + 5 / CELL, fuse: p.fuse }, t, true); return; }
    const ch = ui.G.chars[p.team], big = p.w === 'shot2' || p.w === 'ss', ang = Math.atan2(p.vy, p.vx);
    if (p.w === 'ss') { const g = ctx.createRadialGradient(x, y, 2, x, y, 24); g.addColorStop(0, 'rgba(255,211,77,.8)'); g.addColorStop(1, 'rgba(255,138,61,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 24, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#1E1A2B'; ctx.lineWidth = 2;
    if (ch === 'zip' || (ch === 'digger' && big)) { // darts and drills point where they fly
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      if (ch === 'zip') { ctx.fillStyle = '#FFD34D'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -4); ctx.lineTo(-3, 0); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { ctx.fillStyle = '#9A9CA3'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#4A4D58'; for (let i = 0; i < 3; i++) { const sx = 6 - i * 4 - (t * 40 % 4); ctx.beginPath(); ctx.moveTo(sx, -4 + i); ctx.lineTo(sx - 2, 4 - i); ctx.stroke(); } }
      ctx.restore(); return;
    }
    const look = { brick: ['#5A5F6E', p.w === 'ss' ? 10 : big ? 8 : 6], volt: ['#4FB3FF', big ? 6.5 : 5.5], digger: ['#B2643A', 6], gale: ['#7BE07A', big ? 6.5 : 5.5] }[ch] || ['#3A3150', 5.5];
    if (ch === 'volt') { const g = ctx.createRadialGradient(x, y, 1, x, y, 16); g.addColorStop(0, 'rgba(143,216,255,.7)'); g.addColorStop(1, 'rgba(143,216,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); }
    if (ch === 'gale') { ctx.strokeStyle = '#FFF3E0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - p.vx * 0.4 + 4 * Math.sin(t * 20), y - p.vy * 0.4, x - p.vx * 0.7, y - p.vy * 0.7); ctx.stroke(); ctx.strokeStyle = '#1E1A2B'; }
    ctx.fillStyle = look[0]; ctx.beginPath(); ctx.arc(x, y, look[1], 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x - look[1] * 0.35, y - look[1] * 0.35, look[1] * 0.35, 0, 7); ctx.fill();
  }
  function drawAim(u, t) {
    const a = aimOf(u), [cx, cy] = WB.center(u), rad = a.angle * Math.PI / 180;
    const ox = cx * CELL, oy = cy * CELL, len = 26 + a.power * 46;
    // short preview of the first part of the arc (no wind: reading the wind is your job)
    const s = (ui.lob ? a.power * WB.LOB_POWER : a.power * WB.shotSpec(ui.G, u.team, ui.weapon).speed) * WB.VMAX;
    let px = cx + Math.cos(rad) * (WB.UNIT_R + 0.6), py = cy - Math.sin(rad) * (WB.UNIT_R + 0.6), vx = Math.cos(rad) * s, vy = -Math.sin(rad) * s;
    ctx.fillStyle = 'rgba(255,243,224,.85)';
    for (let i = 0; i < 16; i++) { for (let k = 0; k < 3; k++) { vy += WB.GRAV / 60; px += vx / 60; py += vy / 60; } const r = 3 - i * 0.13; if (r <= 0.6) break; ctx.beginPath(); ctx.arc(px * CELL, py * CELL, r, 0, 7); ctx.fill(); }
    // power arrow
    ctx.strokeStyle = '#1E1A2B'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(rad) * len, oy - Math.sin(rad) * len); ctx.stroke();
    const pc = a.power < 0.5 ? '#FFD34D' : a.power < 0.85 ? '#FF8A3D' : '#FF4D5E';
    ctx.strokeStyle = ui.lob ? '#22C3B5' : pc; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(rad) * len, oy - Math.sin(rad) * len); ctx.stroke();
    ctx.font = FONT(15); ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,26,43,.9)';
    const lab = `${Math.round(a.angle > 90 ? 180 - a.angle : a.angle)}° · ${Math.round(a.power * 100)}%${ui.lob ? ' · LOB' : ''}`;
    const lx = ox + Math.cos(rad) * (len + 26), ly = oy - Math.sin(rad) * (len + 26) - 4;
    ctx.strokeText(lab, lx, ly); ctx.fillStyle = '#FFF3E0'; ctx.fillText(lab, lx, ly);
    if (ui.lob) { ctx.strokeStyle = 'rgba(34,195,181,.6)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, WB.LOB_RANGE * CELL, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  }
  function drawWater(t) {
    const wy = ui.G.water * CELL;
    const g = ctx.createLinearGradient(0, wy, 0, H); g.addColorStop(0, 'rgba(34,195,181,.85)'); g.addColorStop(1, 'rgba(14,60,90,.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, wy + (reduced ? 0 : Math.sin(x / 40 + t * 2) * 3 + Math.sin(x / 17 - t * 3) * 1.5));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,255,250,.7)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += 16) { const y = wy + (reduced ? 0 : Math.sin(x / 40 + t * 2) * 3 + Math.sin(x / 17 - t * 3) * 1.5); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  }
  function draw(t, dt) {
    const G = ui.G;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!G) { ctx.drawImage(bgCv, 0, 0); return; }
    if (ui.terrainDirty) renderTerrain();
    const sh = ui.shake; if (sh > 0.3) { ctx.setTransform(1, 0, 0, 1, (Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh); }
    ctx.drawImage(bgCv, -20, -20, W + 40, H + 40);
    // clouds and dust drift with the wind: you can see it
    for (const c of ui.clouds) {
      c.x += G.wind * 2.2 * c.s * dt; if (c.x > W + 120) c.x = -120; if (c.x < -120) c.x = W + 120;
      ctx.fillStyle = 'rgba(255,230,210,.18)'; for (const [dx, dy, r] of [[0, 0, 26], [24, 6, 20], [-24, 8, 18], [8, -10, 18]]) { ctx.beginPath(); ctx.arc(c.x + dx * c.s, c.y + dy * c.s, r * c.s, 0, 7); ctx.fill(); }
    }
    ctx.drawImage(terrCv, 0, 0);
    for (const d of ui.dust) {
      d.x += (G.wind * 22 + 6) * d.z * dt; d.y += Math.sin(t + d.x / 90) * 6 * dt;
      if (d.x > W) d.x = 0; if (d.x < 0) d.x = W;
      ctx.fillStyle = `rgba(255,236,200,${0.15 + d.z * 0.25})`; ctx.fillRect(d.x, d.y, 2 + d.z * 6 * Math.min(1, Math.abs(G.wind) / 3), 2);
    }
    for (const d of G.duds) drawDud(d, t, false);
    const cur = WB.current(G);
    for (const u of G.units) if (!u.alive) drawUnit(u, false, t);
    for (const u of G.units) if (u.alive) drawUnit(u, u === cur && G.phase === 'aim', t);
    if (cur && G.phase === 'aim' && ui.screen === 'game' && !ui.paused && (!isCPU(G.team) || (ui.cpu && ui.cpu.aimed))) drawAim(cur, t);
    for (const p of G.proj) drawProj(p, t);
    for (const id of Object.keys(ui.trails)) if (!G.proj.some((p) => String(p.id) === id)) delete ui.trails[id];
    for (const p of ui.parts) {
      const k = 1 - p.t / p.life;
      if (p.kind === 'bolt') {
        let s = p.seed; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        const pts = [[p.x, 0]]; for (let yy = 40; yy < p.y; yy += 40) pts.push([p.x + (rnd() - 0.5) * 34, yy]); pts.push([p.x, p.y]);
        for (const [w, col] of [[10, `rgba(143,216,255,${k * 0.5})`], [4, `rgba(255,255,255,${k})`]]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke(); }
        continue;
      }
      if (p.kind === 'swirl') { // tornado: rising rings that spin out
        for (let i = 0; i < 9; i++) { const yy = p.y - i * 18 - p.t * 60, rr = 10 + i * 9 * (0.6 + p.t), a = t * 12 + i;
          ctx.strokeStyle = `rgba(200,255,220,${k * (0.75 - i * 0.06)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x + Math.sin(a) * 6, yy, rr, rr * 0.28, 0, 0, 7); ctx.stroke(); }
        continue;
      }
      if (p.kind === 'flash') { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size); g.addColorStop(0, `rgba(255,250,220,${k})`); g.addColorStop(0.4, `rgba(255,180,80,${k * 0.8})`); g.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); continue; }
      ctx.globalAlpha = Math.max(0, p.kind === 'smoke' ? k * 0.8 : k);
      ctx.fillStyle = p.c;
      if (p.kind === 'smoke') { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); } else ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1;
    }
    drawWater(t);
    for (const p of ui.pops) {
      const k = p.t / 1.2; ctx.globalAlpha = 1 - k * k; ctx.font = FONT(26 + (1 - k) * 8); ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#1E1A2B';
      ctx.strokeText(p.text, p.x, p.y - k * 40); ctx.fillStyle = p.c; ctx.fillText(p.text, p.x, p.y - k * 40); ctx.globalAlpha = 1;
    }
    if (ui.slow > 0 && !reduced) { ctx.fillStyle = `rgba(30,26,43,${Math.min(0.25, ui.slow * 0.3)})`; ctx.fillRect(0, 0, 8 + W, 40); ctx.fillRect(0, H - 40, W + 8, 40); }
  }

  // ---------- the clock ----------
  let lastTimerShown = -1;
  function frame(ts) {
    const now = ts / 1000, dt = Math.min(0.05, ui.last ? now - ui.last : 0.016); ui.last = now;
    const G = ui.G;
    if (G && ui.screen === 'game' && !ui.paused) {
      if (G.phase === 'flight') {
        const speed = (ui.fast ? 8 : 1) * (ui.slow > 0 ? 0.3 : 1);
        ui.acc += dt * speed; let n = 0;
        while (ui.acc >= WB.TICK && G.phase === 'flight' && n++ < 400) { onFx(WB.step(G)); ui.acc -= WB.TICK; }
        if (G.phase !== 'flight') { ui.acc = 0; renderHUD(); renderCtl(); coachLine(); }
      } else if (G.phase === 'aim' && isCPU(G.team)) {
        if (!ui.cpu) cpuStart();
        cpuStep(dt);
      } else if (G.phase === 'aim' && ui.timerOn) {
        const before = Math.ceil(ui.tLeft); ui.tLeft -= dt;
        if (Math.ceil(ui.tLeft) !== before && ui.tLeft <= 5 && ui.tLeft > 0) SFX.tick();
        if (ui.tLeft <= 0) { ui.tLeft = 0; pass(); }
      }
      if (G.phase === 'over') { // a short beat to watch the last blast, then the round screen (also covers the turn-cap ending)
        if (!ui.overAt) ui.overAt = performance.now() + 1500;
        else if (ui.overAt > 0 && performance.now() >= ui.overAt) { ui.overAt = -1; roundOver(); }
      }
      const shown = Math.ceil(ui.tLeft); const el = $('#timer');
      if (el && shown !== lastTimerShown) { lastTimerShown = shown; if (ui.timerOn) { el.textContent = shown; el.classList.toggle('low', shown <= 5); } }
    }
    if (ui.slow > 0) ui.slow -= dt;
    ui.shake *= Math.pow(0.02, dt);
    if (G) stepParts(dt);
    draw(now, dt);
    requestAnimationFrame(frame);
  }

  // ---------- boot ----------
  window.WBUI = {
    get G() { return ui.G; }, ui, startMatch, levelScreen, selectScreen, choose, startRound, roundOver, doFire, walk, pass, botTurn, renderAll: () => { renderHUD(); renderCtl(); coachLine(); },
    aim: (angle, power) => { const u = WB.current(ui.G); const a = aimOf(u); a.angle = angle; a.power = power; },
  };
  fit(); addEventListener('resize', fit);
  { const lv = lsGet('wb-level'); if (LEVELS[lv]) ui.level = lv; }
  bakeBackground(20261102); titleScreen();
  requestAnimationFrame(frame);
})();
