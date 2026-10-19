(function () {
  // Trickbound: Books on the Line — the walkable opening. Pick a look and a name, wake on the train, walk the
  // Cinder Hollow platform, talk to Dee at the depot door, wake two critters, walk in for the first duel.
  // Top-down tile world on a canvas; all art is placeholder pixel art drawn in code.
  // © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
  const root = document.getElementById('story');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------- Looks + sprites ----------------
  const LOOKS = [
    { id: 'a', name: 'Plum coat', hair: '#2b1d14', skin: '#e3b98f', coat: '#7a3f5a', shade: '#5a2d42', accent: '#E8B86A', pants: '#2a2430' },
    { id: 'b', name: 'Tide coat', hair: '#4a2a17', skin: '#8d5a3b', coat: '#2C6C80', shade: '#1f4c5a', accent: '#d9c27a', pants: '#26242c' },
    { id: 'c', name: 'Grove coat', hair: '#141014', skin: '#b97d52', coat: '#4E7A3E', shade: '#37572b', accent: '#B5482F', pants: '#2b2622' },
    { id: 'd', name: 'Dusk coat', hair: '#c9873a', skin: '#f1cfa8', coat: '#3B3F7A', shade: '#2b2e5a', accent: '#c0503a', pants: '#30283a' },
  ];
  const NPC_LOOK = {
    dee: { hair: '#bdb6ae', skin: '#7b4f35', coat: '#B5482F', shade: '#86391c', accent: '#E8B86A', pants: '#2a2430' },
    conductor: { hair: '#1d2238', skin: '#d9a882', coat: '#28304f', shade: '#1b2138', accent: '#E8B86A', pants: '#1b2138', cap: true },
    moss: { hair: '#2a2a2a', skin: '#a8714c', coat: '#5a4a3a', shade: '#40342a', accent: '#c9a24a', pants: '#2a2622', cap: true },
    pike: { hair: '#7a6a5a', skin: '#e0b48e', coat: '#4a5560', shade: '#353d45', accent: '#B5482F', pants: '#26242c' },
    ivy: { hair: '#c0503a', skin: '#f0c8a0', coat: '#2C6C80', shade: '#1f4c5a', accent: '#E8B86A', pants: '#3b3442' },
    tom: { hair: '#1a1210', skin: '#7a4e32', coat: '#7a3f5a', shade: '#5a2d42', accent: '#e8dcc8', pants: '#2a2430' },
    pip: { hair: '#3a2214', skin: '#c48c62', coat: '#6c8a3a', shade: '#4f6828', accent: '#e8dcc8', pants: '#3b3442' },
  };
  const BODY = ['.CCCCCC.', 'CCCCCCCC', 'SCCCCCCS', '.KCCCCK.'];
  const SPR = {
    down: ['..HHHH..', '.HHHHHH.', '.HSSSSH.', '.SESSES.', '.SSSSSS.', '..AAAA..'].concat(BODY),
    up: ['..HHHH..', '.HHHHHH.', '.HHHHHH.', '.HHHHHH.', '.SHHHHS.', '..AAAA..'].concat(BODY),
    left: ['..HHHH..', '.HHHHHH.', '.HSSSHH.', '.ESSSSH.', '.SSSSSS.', '..AAAA..', '.CCCCCC.', '.CCCCCC.', '.SCCCCC.', '.KCCCCK.'],
  };
  const LEGS = [['.PP..PP.', '.BB..BB.'], ['.PP..P..', '.BB...B.'], ['..P..PP.', '.B...BB.']];
  const DOG = ['......KK', 'K.....KE', 'KKKKKKKK', '.KKKKKK.', '.K.K.K.K'];
  function paint(ctx, rows, colors, x, y, px, flip) {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[flip ? row.length - 1 - i : i]; const c = colors[ch]; if (!c) continue; ctx.fillStyle = c; ctx.fillRect(x + i * px, y + j * px, px, px); } });
  }
  function drawPerson(ctx, look, dir, frame, x, y, t) {
    const px = t / 8; const rows = (dir === 'right' ? SPR.left : SPR[dir]).slice();
    if (look.cap) { rows[0] = 'HHHHHHHH'; rows[1] = '.AAAAAA.'; }
    const all = rows.concat(LEGS[frame]);
    const colors = { H: look.hair, S: look.skin, E: '#1a1418', A: look.accent, C: look.coat, K: look.shade, P: look.pants, B: '#17121a' };
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + t / 2, y + t - px, t * 0.36, px * 1.4, 0, 0, Math.PI * 2); ctx.fill();
    paint(ctx, all, colors, x, y + t - all.length * px - (frame ? px * 0.5 : 0), px, dir === 'right');
  }

  // ---------------- Maps ----------------
  // R roof · W wall · w lit window · D depot door · s snow · . path · p platform · b bench · L lamp · S sign · T train · r rails
  // c car wall · C car window · h seat · f car floor · E car door
  const MAPS = {
    car: {
      name: 'The night train',
      rows: ['cCcCcCcCcCcc', 'chhfhhfhhffc', 'cffffffffffE', 'chhfhhfhhffc', 'cccccccccccc'],
      start: { x: 1, y: 2, dir: 'right' },
      npcs: [{ id: 'conductor', x: 10, y: 1, dir: 'down', look: NPC_LOOK.conductor }],
    },
    platform: {
      name: 'Cinder Hollow',
      rows: ['RRRRRRRRRRRR', 'RRRRRRRRRRRR', 'WwWWwDWwWWwW', 'sSs.......Ls', 'ss.......sss', 'HHs...ssssss', 'HHss..ssssss', 'sssss..sssss', 'pppppppppppp', 'pbbpppLppbbp', 'pppppppppppp', 'pppppppppppp', 'TTTTTTTTTTTT', 'TTTTTTTTTTTT', 'rrrrrrrrrrrr'],
      start: { x: 3, y: 11, dir: 'up' },
      npcs: [{ id: 'dee', x: 5, y: 3, dir: 'down', look: NPC_LOOK.dee }, { id: 'pip', x: 9, y: 6, dir: 'left', look: NPC_LOOK.pip }, { id: 'dog', x: 10, y: 6, dir: 'left', dog: true }, { id: 'moss', x: 2, y: 6, dir: 'right', look: NPC_LOOK.moss }, { id: 'pike', x: 3, y: 6, dir: 'left', look: NPC_LOOK.pike }, { id: 'ivy', x: 8, y: 10, dir: 'right', look: NPC_LOOK.ivy }, { id: 'tom', x: 9, y: 10, dir: 'left', look: NPC_LOOK.tom }],
      snow: true,
    },
  };
  const SOLID = new Set('RWwSTrbLchCH'.split(''));

  // ---------------- State ----------------
  let W = null; // { P, hooks, map, me, npcs, dlg, path, fade, flags }
  let cv = null, ctx = null, tile = 32, viewRows = 15, camY = 0, raf = 0;
  const flakes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.9, d: Math.random() * 6 }));

  function start(P, hooks) {
    W = { P, hooks, flags: {}, dlg: null, path: [], fade: 0 };
    creator();
  }

  // ---------------- Character + name ----------------
  function creator() {
    root.hidden = false; if (window.TBMusic) window.TBMusic.mood('platform');
    const sel = W.P.look || 'a'; const nm = W.P.name || '';
    root.innerHTML = `<div class="screen"><div class="screen-in"><span class="eyebrow">Before the train</span><h2>Who’s getting off at Cinder Hollow?</h2>
      <div class="looks">${LOOKS.map((L) => `<button class="look${L.id === sel ? ' sel' : ''}" type="button" data-look="${L.id}"><canvas width="64" height="96" data-lc="${L.id}"></canvas><span>${esc(L.name)}</span></button>`).join('')}</div>
      <label class="name-lbl">Your name<input id="wName" maxlength="12" autocomplete="off" placeholder="Ren" value="${esc(nm)}"></label>
      <p class="lead">Your grandmother played Books on the Line for forty years. Her deck is in your bag.</p>
      <div style="display:flex;justify-content:flex-end"><button class="btn primary" type="button" data-w="board" data-focus="1">Board the train →</button></div></div></div>`;
    root.querySelectorAll('canvas[data-lc]').forEach((c) => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; drawPerson(g, LOOKS.find((L) => L.id === c.dataset.lc), 'down', 0, 0, 32, 64); });
    W.look = sel;
  }

  // ---------------- World ----------------
  function enter(mapId, at) {
    const M = MAPS[mapId]; const s = at || M.start;
    W.map = mapId; W.me = { x: s.x, y: s.y, dir: s.dir, fx: s.x, fy: s.y, t0: 0, frame: 0 };
    W.npcs = (W.npcsByMap = W.npcsByMap || {})[mapId] || (W.npcsByMap[mapId] = M.npcs.map((n) => Object.assign({}, n)));
    W.path = []; W.fade = 1; mount(); onEnter();
  }
  function mount() {
    root.hidden = false; if (window.TBMusic) window.TBMusic.mood('platform');
    const M = MAPS[W.map];
    tile = Math.floor(Math.min(window.innerWidth - 16, 520) / 12);
    viewRows = Math.min(M.rows.length, Math.max(5, Math.floor((window.innerHeight - 190) / tile)));
    root.innerHTML = `<div class="world"><div class="world-top"><span class="eyebrow">${esc(M.name)}</span><span class="ab">${esc(W.P.name || '')}</span></div>
      <canvas id="wCv" style="width:${tile * 12}px;height:${tile * viewRows}px"></canvas>
      <div class="wbox" id="wBox" hidden></div>
      <p class="world-hint" id="wHint">Tap to walk · tap people to talk</p></div>`;
    cv = document.getElementById('wCv'); const dpr = window.devicePixelRatio || 1;
    cv.width = tile * 12 * dpr; cv.height = tile * viewRows * dpr; ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.imageSmoothingEnabled = false;
    cv.addEventListener('pointerdown', onTap);
    document.getElementById('wBox').addEventListener('pointerdown', (e) => { e.preventDefault(); const c = e.target.closest('[data-wc]'); if (c) return choose(Number(c.dataset.wc)); advance(); });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    if (W.dlg) showBox();
  }
  const rows = () => MAPS[W.map].rows;
  const at = (x, y) => (rows()[y] || '')[x];
  const npcAt = (x, y) => W.npcs.find((n) => n.x === x && n.y === y && !n.gone);
  const walkable = (x, y) => { const ch = at(x, y); if (!ch || SOLID.has(ch)) return false; if (ch === 'D' && !W.flags.doorOpen) return false; return !npcAt(x, y); };

  function bfs(tx, ty) {
    const sx = W.me.x, sy = W.me.y; if (sx === tx && sy === ty) return [];
    const key = (x, y) => x + ',' + y; const prev = new Map([[key(sx, sy), null]]); const q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift(); if (x === tx && y === ty) break;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const nx = x + dx, ny = y + dy; const k = key(nx, ny); if (prev.has(k) || !walkable(nx, ny)) continue; prev.set(k, [x, y]); q.push([nx, ny]); }
    }
    if (!prev.has(key(tx, ty))) return null;
    const out = []; let cur = [tx, ty]; while (cur && !(cur[0] === sx && cur[1] === sy)) { out.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
    return out;
  }
  function onTap(e) {
    e.preventDefault(); if (W.dlg) return advance(); if (W.fade > 0.05) return;
    const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / tile); const y = Math.floor((e.clientY - r.top) / tile + camY);
    const target = npcAt(x, y) || ['S', 'L', 'D', 'E', 'b', 'w', 'H'].concat(W.mode === 'hub' ? ['T'] : []).includes(at(x, y)) ? { x, y } : null;
    if (target && Math.abs(W.me.x - x) + Math.abs(W.me.y - y) === 1) { face(x, y); return interact(x, y); }
    if (target && (walkable(x, y))) { W.path = bfs(x, y) || []; W.pending = null; return; }
    if (target) {
      let best = null; for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const p = bfs(x + dx, y + dy); if (p && (!best || p.length < best.length)) best = p; }
      if (best) { W.path = best; W.pending = { x, y }; }
      return;
    }
    if (walkable(x, y)) { W.path = bfs(x, y) || []; W.pending = null; }
  }
  function face(x, y) { const dx = x - W.me.x, dy = y - W.me.y; W.me.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'up' : 'down'; }
  document.addEventListener('keydown', (e) => {
    if (!cv || !cv.isConnected) return;
    const k = e.key; const dirs = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    if (k === 'Enter' || k === ' ' || k === 'e') { e.preventDefault(); if (W.dlg) return advance(); const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[W.me.dir]; const x = W.me.x + d[0], y = W.me.y + d[1]; if (npcAt(x, y) || 'SLDEbw'.includes(at(x, y) || '#')) interact(x, y); return; }
    if (dirs[k] && !W.dlg) { e.preventDefault(); const [dx, dy] = dirs[k]; const x = W.me.x + dx, y = W.me.y + dy; face(x, y); if (walkable(x, y) && !W.path.length) W.path = [[x, y]]; }
  });

  // ---------------- Loop ----------------
  const STEP = 150;
  function loop(now) {
    if (!cv || !cv.isConnected) return;
    const me = W.me;
    if (me.t0 && now - me.t0 >= STEP) { me.t0 = 0; me.fx = me.x; me.fy = me.y; arrived(); }
    if (!me.t0 && W.path.length && !W.dlg) { const [nx, ny] = W.path.shift(); if (walkable(nx, ny)) { face(nx, ny); me.fx = me.x; me.fy = me.y; me.x = nx; me.y = ny; me.t0 = now; me.frame = me.frame === 1 ? 2 : 1; } else W.path = []; }
    if (W.fade > 0) W.fade = Math.max(0, W.fade - 0.04);
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  function arrived() {
    if (!W.path.length) { W.me.frame = 0; if (W.pending) { const p = W.pending; W.pending = null; face(p.x, p.y); interact(p.x, p.y); } }
    onStep(W.me.x, W.me.y);
  }

  // ---------------- Drawing ----------------
  const hash = (x, y, k) => { const n = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return n - Math.floor(n); };
  function draw(now) {
    const M = MAPS[W.map]; const t = tile; const me = W.me;
    const p = me.t0 ? Math.min(1, (now - me.t0) / STEP) : 1; const mx = me.fx + (me.x - me.fx) * p, my = me.fy + (me.y - me.fy) * p;
    camY = Math.max(0, Math.min(M.rows.length - viewRows, my - viewRows / 2 + 0.5));
    ctx.fillStyle = '#140F17'; ctx.fillRect(0, 0, t * 12, t * viewRows);
    ctx.save(); ctx.translate(0, -camY * t);
    M.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) drawTile(row[x], x, y, t, now); });
    if (M.rows[5] && M.rows[5][0] === 'H') drawHeap(t, now);
    // people, sorted by row so nearer ones overlap
    const ppl = W.npcs.filter((n) => !n.gone).map((n) => ({ y: n.y, d: () => (n.dog ? paint(ctx, DOG, { K: '#6b4a32', E: '#1a1418' }, n.x * t + t * 0.1, n.y * t + t * 0.35, t / 10, n.dir === 'right') : drawPerson(ctx, n.look, n.dir, 0, n.x * t, n.y * t, t)) }));
    ppl.push({ y: my, d: () => drawPerson(ctx, LOOKS.find((L) => L.id === W.P.look) || LOOKS[0], me.dir, me.t0 ? me.frame : 0, mx * t, my * t, t) });
    ppl.sort((a, b) => a.y - b.y).forEach((q) => q.d());
    // light
    ctx.globalCompositeOperation = 'lighter';
    M.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === 'L') glow(x * t + t / 2, y * t + t * 0.15, t * 2.4, 'rgba(255,190,110,0.30)'); if (ch === 'w') glow(x * t + t / 2, y * t + t / 2, t * 1.6, 'rgba(255,190,110,0.20)'); if (ch === 'D' && W.flags.doorOpen) glow(x * t + t / 2, y * t + t * 0.7, t * 2, 'rgba(255,190,110,0.35)'); if (ch === 'C') glow(x * t + t / 2, y * t + t / 2, t, 'rgba(140,170,230,0.10)'); if (ch === 'H' && x === 1 && y === 6) glow(x * t + t / 2, y * t, t * 2.2, `rgba(255,120,60,${0.16 + Math.sin(now / 300) * 0.04})`); } });
    ctx.globalCompositeOperation = 'source-over';
    if (W.marks) for (const m of W.marks) drawMark(m, now);
    ctx.restore();
    if (M.snow) { ctx.fillStyle = 'rgba(235,240,250,.75)'; for (const f of flakes) { f.y += 0.0009 * f.s; if (f.y > 1) { f.y = 0; f.x = Math.random(); } const fx = (f.x + Math.sin(now / 1400 + f.d) * 0.01) * t * 12; ctx.fillRect(fx, f.y * t * viewRows, f.s * 2, f.s * 2); } }
    const g = ctx.createRadialGradient(t * 6, t * viewRows / 2, t * 3, t * 6, t * viewRows / 2, t * 9); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,6,14,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, t * 12, t * viewRows);
    if (W.fade > 0) { ctx.fillStyle = `rgba(20,15,23,${W.fade})`; ctx.fillRect(0, 0, t * 12, t * viewRows); }
  }
  function drawHeap(t, now) {
    ctx.fillStyle = '#231c22'; ctx.beginPath(); ctx.moveTo(0, 7 * t); ctx.lineTo(0, 5.5 * t); ctx.quadraticCurveTo(0.5 * t, 4.9 * t, 1.05 * t, 5.05 * t); ctx.quadraticCurveTo(1.7 * t, 5.3 * t, 2 * t, 7 * t); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2f37'; ctx.beginPath(); ctx.moveTo(0.15 * t, 6.9 * t); ctx.quadraticCurveTo(0.6 * t, 5.5 * t, 1.05 * t, 5.35 * t); ctx.quadraticCurveTo(1.25 * t, 6 * t, 1.6 * t, 6.9 * t); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c4cad8'; ctx.beginPath(); ctx.moveTo(0.55 * t, 5.2 * t); ctx.quadraticCurveTo(1.05 * t, 4.95 * t, 1.45 * t, 5.25 * t); ctx.quadraticCurveTo(1.05 * t, 5.15 * t, 0.55 * t, 5.2 * t); ctx.fill();
    for (let k = 0; k < 9; k++) { const px = (0.25 + hash(k, 1) * 1.5) * t, py = (5.6 + hash(k, 2) * 1.2) * t; const on = Math.sin(now / 400 + k * 1.7) > 0.2; ctx.fillStyle = on ? '#E8B86A' : '#B5482F'; ctx.fillRect(px, py, t / 14, t / 14); }
    ctx.fillStyle = 'rgba(200,200,215,.18)'; for (let k = 0; k < 3; k++) { const ph = ((now / 2400 + k / 3) % 1); ctx.beginPath(); ctx.arc((1.05 + Math.sin(ph * 6 + k) * 0.15) * t, (5 - ph * 1.6) * t, (0.12 + ph * 0.25) * t, 0, Math.PI * 2); ctx.fill(); }
  }
  function drawMark(m, now) {
    const t = tile; const cx = m.x * t + t / 2; const bob = Math.sin(now / 350 + m.x) * t * 0.06; let y = m.y * t - t * 0.85 + bob;
    if (m.badge) { ctx.font = `${Math.round(t * 0.5)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (m.lamp) { ctx.globalCompositeOperation = 'lighter'; glow(cx, y, t * 0.7, 'rgba(255,210,120,.45)'); ctx.globalCompositeOperation = 'source-over'; } ctx.globalAlpha = m.dim ? 0.75 : 1; ctx.fillText(m.badge, cx, y); ctx.globalAlpha = 1; y -= t * 0.55; }
    if (m.label) {
      ctx.font = `700 ${Math.max(10, Math.round(t * 0.3))}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(m.label).width + t * 0.4, h = t * 0.46; const lx = Math.max(2, Math.min(t * 12 - w - 2, cx - w / 2));
      ctx.fillStyle = m.gold ? 'rgba(232,184,106,.95)' : 'rgba(28,21,30,.9)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx, y - h / 2, w, h, h / 2); else ctx.rect(lx, y - h / 2, w, h); ctx.fill();
      ctx.strokeStyle = 'rgba(232,184,106,.7)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = m.gold ? '#2A2030' : '#F5ECDD'; ctx.fillText(m.label, lx + w / 2, y + 1);
    }
  }
  function glow(x, y, r, c) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function R(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function drawTile(ch, x, y, t, now) {
    const X = x * t, Y = y * t, u = t / 16;
    const snow = () => { R('#8f9ab2', X, Y, t, t); for (let k = 0; k < 4; k++) R('#a9b3c8', X + hash(x, y, k) * (t - 2 * u), Y + hash(y, x, k) * (t - 2 * u), u * 2, u); };
    const plat = () => { R('#4f4a55', X, Y, t, t); R('#433e49', X, Y + t - u, t, u); R('#433e49', X + (y % 2 ? t / 2 : 0), Y, u, t); if (y === 11) R('#c9a24a', X, Y + t - 2 * u, t, u); };
    const wall = () => { R('#4b3a35', X, Y, t, t); for (let r = 0; r < 4; r++) { R('#3a2c28', X, Y + r * 4 * u, t, u * 0.6); R('#3a2c28', X + ((r % 2) ? 4 : 10) * u, Y + r * 4 * u, u * 0.6, 4 * u); } };
    const floor = () => { R('#4a3a30', X, Y, t, t); R('#3e3028', X, Y + t / 2, t, u * 0.6); R('#3e3028', X + (x % 2 ? 5 : 11) * u, Y, u * 0.6, t / 2); };
    switch (ch) {
      case 's': snow(); break;
      case '.': R('#6b6058', X, Y, t, t); R('#5b5049', X + u * 2, Y + u * 7, t - 4 * u, u * 0.7); R('#5b5049', X + u * 8, Y, u * 0.7, u * 7); R('#7a6f66', X + hash(x, y) * t * 0.7, Y + hash(y, x) * t * 0.7, u * 2, u); break;
      case 'p': plat(); break;
      case 'R': R('#3d2b31', X, Y, t, t); for (let r = 0; r < 4; r++) R('#4c363d', X + (r % 2 ? 0 : 4 * u), Y + r * 4 * u, t, u * 1.2); if (y === 0) { R('#c4cad8', X, Y, t, 5 * u); R('#c4cad8', X + hash(x, 0) * 10 * u, Y + 5 * u, 5 * u, 2 * u); } if (y === 1) R('#2a1f24', X, Y + t - 2 * u, t, 2 * u); break;
      case 'W': wall(); break;
      case 'w': wall(); R('#2a1f24', X + 3 * u, Y + 3 * u, 10 * u, 10 * u); R('#f2c46b', X + 4 * u, Y + 4 * u, 8 * u, 8 * u); R('#d9a24a', X + 7.5 * u, Y + 4 * u, u, 8 * u); R('#d9a24a', X + 4 * u, Y + 7.5 * u, 8 * u, u); break;
      case 'D': wall(); R('#2a1f24', X + 2 * u, Y + 1 * u, 12 * u, 15 * u); if (W.flags.doorOpen) { R('#f2c46b', X + 3 * u, Y + 2 * u, 10 * u, 14 * u); R('#d9a24a', X + 3 * u, Y + 12 * u, 10 * u, 4 * u); } else { R('#6a3f24', X + 3 * u, Y + 2 * u, 10 * u, 14 * u); R('#57331d', X + 7.5 * u, Y + 2 * u, u, 14 * u); R('#E8B86A', X + 10 * u, Y + 9 * u, 1.5 * u, 1.5 * u); } break;
      case 'b': plat(); R('#5b3a26', X + u, Y + 6 * u, t - 2 * u, 3 * u); R('#4a2e1f', X + u, Y + 3 * u, t - 2 * u, 2 * u); R('#2e2025', X + 2 * u, Y + 9 * u, u * 1.5, 5 * u); R('#2e2025', X + t - 3.5 * u, Y + 9 * u, u * 1.5, 5 * u); break;
      case 'L': (y < 8 ? snow : plat)(); R('#26202a', X + 7 * u, Y + 4 * u, 2 * u, 11 * u); R('#26202a', X + 5 * u, Y + 14 * u, 6 * u, 2 * u); R('#3a3240', X + 5 * u, Y - 2 * u, 6 * u, 6 * u); R('#ffd58a', X + 6 * u, Y - u, 4 * u, 4 * u); break;
      case 'H': snow(); break;
      case 'S': snow(); R('#3a2a20', X + 7 * u, Y + 8 * u, 2 * u, 8 * u); R('#6a4a30', X + 2 * u, Y + 2 * u, 12 * u, 7 * u); R('#e8dcc8', X + 4 * u, Y + 4 * u, 8 * u, u); R('#e8dcc8', X + 4 * u, Y + 6 * u, 6 * u, u); break;
      case 'T': { const top = y === 12; R('#2c3f36', X, Y, t, t); if (top) { R('#1f2d27', X, Y, t, 2 * u); R('#c9a24a', X, Y + 13 * u, t, u); if (x === 3) { R('#3d5a4c', X + 3 * u, Y + 2 * u, 10 * u, 14 * u); R('#f2c46b', X + 5 * u, Y + 4 * u, 6 * u, 5 * u); } else if (x % 3 !== 0) { R('#1a1418', X + 2 * u, Y + 4 * u, 12 * u, 7 * u); R('#f2c46b', X + 3 * u, Y + 5 * u, 10 * u, 5 * u); } } else { R('#22322b', X, Y, t, t); R('#15110f', X + (x % 2 ? 2 : 8) * u, Y + 9 * u, 6 * u, 6 * u); R('#3a3a40', X + (x % 2 ? 4 : 10) * u, Y + 11 * u, 2 * u, 2 * u); } break; }
      case 'r': R('#3b3638', X, Y, t, t); for (let k = 0; k < 2; k++) R('#4a3426', X + k * 8 * u + u, Y + 2 * u, 5 * u, 12 * u); R('#9a9aa2', X, Y + 4 * u, t, 1.5 * u); R('#9a9aa2', X, Y + 11 * u, t, 1.5 * u); break;
      case 'c': R('#3b2a2a', X, Y, t, t); R('#2f2121', X, Y + t - 3 * u, t, 3 * u); R('#4a3434', X + (x % 2 ? 2 : 9) * u, Y + 3 * u, u * 0.7, 9 * u); break;
      case 'C': { R('#3b2a2a', X, Y, t, t); R('#1d2235', X + 2 * u, Y + 3 * u, 12 * u, 9 * u); const off = (now / 40) % (t); for (let k = 0; k < 3; k++) R('rgba(200,210,235,.55)', X + 2 * u + ((hash(x, k) * 12 * u + off * (1 + k * 0.3)) % (12 * u)), Y + 4 * u + k * 3 * u, 2 * u, u * 0.6); R('#2a1d1d', X + 2 * u, Y + 12 * u, 12 * u, 1.5 * u); break; }
      case 'h': floor(); R('#5a2d42', X + u, Y + 2 * u, t - 2 * u, 12 * u); R('#7a3f5a', X + 2 * u, Y + 3 * u, t - 4 * u, 6 * u); break;
      case 'f': floor(); break;
      case 'E': floor(); R('#6a3f24', X + 6 * u, Y, 10 * u, t); R('#f2c46b', X + 9 * u, Y + 3 * u, 4 * u, 5 * u); R('#E8B86A', X + 8 * u, Y + 9 * u, 1.5 * u, 1.5 * u); break;
      default: R('#140F17', X, Y, t, t);
    }
  }

  // ---------------- Dialogue ----------------
  function say(lines, then, choices) { W.dlg = { lines, i: 0, shown: 0, then, choices, t0: performance.now() }; W.path = []; showBox(); }
  function showBox() {
    const box = document.getElementById('wBox'); if (!box) return; const d = W.dlg; if (!d) { box.hidden = true; return; }
    const [who, text] = d.lines[d.i]; box.hidden = false;
    const last = d.i + 1 >= d.lines.length;
    box.innerHTML = `${who ? `<b>${esc(who)}</b>` : ''}<p class="${who ? '' : 'aside'}"></p>${last && d.choices ? `<div class="wchoices">${d.choices.map((c, k) => `<button type="button" class="btn${k === 0 ? ' primary' : ''}" data-wc="${k}">${esc(c.label)}</button>`).join('')}</div>` : `<span class="more">${last ? '●' : '▼'}</span>`}`;
    const p = box.querySelector('p'); let n = 0; clearInterval(d.tick);
    d.full = false; d.tick = setInterval(() => { n += 2; p.textContent = text.slice(0, n); if (n >= text.length) { clearInterval(d.tick); d.full = true; } }, 18);
    d.finish = () => { clearInterval(d.tick); p.textContent = text; d.full = true; };
  }
  function choose(k) { const d = W.dlg; if (!d || !d.choices) return; const c = d.choices[k]; W.dlg = null; const box = document.getElementById('wBox'); if (box) box.hidden = true; if (c && c.fn) c.fn(); }
  function advance() {
    const d = W.dlg; if (!d) return;
    if (!d.full) return d.finish();
    if (d.i + 1 >= d.lines.length && d.choices) return;
    if (d.i + 1 < d.lines.length) { d.i++; return showBox(); }
    W.dlg = null; const box = document.getElementById('wBox'); if (box) box.hidden = true;
    if (d.then) d.then();
  }

  // ---------------- The script ----------------
  const NAME = () => W.P.name || 'kid';
  function onEnter() {
    if (W.map === 'car' && !W.flags.carIntro) { W.flags.carIntro = true; return setTimeout(() => say([['', '(The train slows. Your grandmother’s deck is warm in your bag.)'], ['', 'Tap where you want to walk. Tap people and things to talk to them.']]), 500); }
    if (W.map === 'platform' && !W.flags.platIntro) { W.flags.platIntro = true; return setTimeout(() => say([['', '(Cinder Hollow. Snow on the rails, one lamp working out of two, and a card-room window lit up like a stove.)']]), 450); }
  }
  function onStep(x, y) {
    const ch = at(x, y);
    if (W.map === 'car' && x >= 6 && !W.flags.conductor) { W.flags.conductor = true; const c = W.npcs[0]; c.dir = 'left'; return say([['Conductor', 'Cinder Hollow. Last stop in the Pits.'], ['Conductor', 'You’re the one with the old deck? Somebody at the depot’s been asking after you.']]); }
    if (ch === 'E' && W.mode !== 'hub') return transition(() => enter('platform'));
    if (ch === 'D' && W.flags.doorOpen) { W.fade = 0; return transition(() => { cancelAnimationFrame(raf); if (W.mode === 'hub') W.hooks.door(); else W.hooks.duel(); }); }
  }
  function transition(fn) { W.path = []; let a = 0; const step = () => { a += 0.08; W.fade = Math.min(1, a); if (a < 1) requestAnimationFrame(step); else fn(); }; requestAnimationFrame(step); }
  function interact(x, y) {
    const n = npcAt(x, y); const ch = at(x, y);
    if (W.mode === 'hub') {
      if (n && n.onTalk) { if (!n.dog) n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[W.me.dir]; return n.onTalk(); }
      if (ch === 'D') return transition(() => W.hooks.door());
      if (ch === 'T') return say([['', '(The night train idles. The conductor leans out.)']], null, [{ label: 'Board the train', fn: () => transition(() => W.hooks.train()) }, { label: 'Not yet' }]);
      if (ch === 'H') return say([['', '(The slag heap still smokes. Moss and Pike keep a card table on the warm side.)']]);
    }
    if (n) {
      if (!n.dog) n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[W.me.dir];
      if (n.id === 'conductor') return say(W.flags.conductor ? [['Conductor', 'Mind the gap. And the snow. And the card rooms.']] : [['Conductor', 'Cinder Hollow’s next. Last stop in the Pits.']], () => { W.flags.conductor = true; });
      if (n.id === 'pip') return say(W.flags.metDee ? [['Pip', 'Gus cheats. Not with cards. With snacks. He brings snacks so you feel bad taking his books.']] : [['Pip', 'You came on THE train? Nobody comes on the train.'], ['Pip', 'Dee’s waiting at the door. She’s always waiting at the door.']]);
      if (n.id === 'dog') return say([['', '(The dog thumps its tail once. That’s about all the welcome Cinder Hollow does.)']]);
      if (n.id === 'moss' || n.id === 'pike') return say(W.flags.doorOpen ? [['Moss', 'Go on, they’re waiting. We’ll be here after. We’re always here after.']] : [['Moss', 'New face. You play?'], ['Pike', 'Not with us, not yet. Dee’s been waiting on you all week. Back room first, then come lose some marks to us.']]);
      if (n.id === 'ivy' || n.id === 'tom') return say([['Ivy', 'We play for marks out here. You haven’t got any yet.'], ['Tom', 'See Dee first. Then come back. We’ve got a critter in a jar.']]);
      if (n.id === 'dee') return talkDee();
    }
    if (ch === 'S') return say([['', 'CINDER HOLLOW · THE PITS'], ['', '“The trains run as long as the Long Table is played.” Someone has scratched “ha” underneath.']]);
    if (ch === 'L') return say([['', '(Somebody painted a little critter on the lamp glass. It looks asleep.)']]);
    if (ch === 'b') return say([['', '(A bench, mostly snow. You decide to stand.)']]);
    if (ch === 'w') return say([['', '(Inside: a stove, a kettle, and four chairs around a card table. Two of them are taken.)']]);
    if (ch === 'D') return say([['', W.flags.doorOpen ? '(Warm air and the smell of tea.)' : '(Locked. Or Dee is leaning on it. Hard to tell.)']]);
    if (ch === 'E' && W.map === 'car') return onStep(x, y);
  }
  function talkDee() {
    if (!W.flags.metDee) {
      return say([
        ['Dee', `So you’re ${NAME()}. You’ve got her nose. Your grandmother’s, I mean.`],
        ['Dee', 'That deck in your bag. Mind if I look?'],
        ['', '(You hand it over. She fans it out under the lamp like it might bite.)'],
        ['Dee', 'Thought so. The critters in it are asleep. They do that when nobody plays.'],
        ['Dee', 'We play Books here. Bid your books, follow suit, night beats everything. You’ll pick it up.'],
        ['Dee', 'Go on. Wake two of them. They’ll know you.'],
      ], () => { W.flags.metDee = true; W.hooks.starter(resumeAfterStarter); });
    }
    return say([['Dee', 'After you. And don’t let Gus talk you out of a nil.']]);
  }
  function resumeAfterStarter(names) {
    mount();
    say([['Dee', `${names}. Good. Loud ones.`], ['Dee', 'Gus and Birdie are at the table. First night’s short: first to 100. I’ll sit across from you.'], ['Dee', 'Door’s open. After you.']], () => {
      const d = W.npcs.find((n) => n.id === 'dee'); d.x = 6; d.dir = 'left'; W.flags.doorOpen = true;
      const h = document.getElementById('wHint'); if (h) h.textContent = 'Walk through the depot door';
    });
  }

  // ---------------- Clicks on the creator ----------------
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b || !W) return;
    if (b.dataset.look) { W.P.look = b.dataset.look; const nm = (document.getElementById('wName') || {}).value || ''; W.P.name = nm.trim(); return creator(); }
    if (b.dataset.w === 'board') { const nm = ((document.getElementById('wName') || {}).value || '').trim(); W.P.name = nm || 'Ren'; W.P.look = W.P.look || 'a'; W.hooks.save(); W.flags = {}; W.npcsByMap = null; return enter('car'); }
  });

  // ---------------- Town hub (Cinder Hollow, after the opening) ----------------
  // opts: { from: 'train'|'door', crews: [{ name, stake, badge, lamp, dim, onTalk }], dee: fn, intro: lines }
  function hub(P, hooks, opts) {
    W = { P, hooks, mode: 'hub', flags: { doorOpen: true, platIntro: true }, dlg: null, path: [], fade: 0 };
    const crews = opts.crews || [];
    const npcs = [
      { id: 'dee', x: 6, y: 3, dir: 'left', look: NPC_LOOK.dee, onTalk: () => say(opts.dee()) },
      { id: 'moss', x: 2, y: 6, dir: 'right', look: NPC_LOOK.moss, onTalk: crews[0] && crews[0].onTalk },
      { id: 'pike', x: 3, y: 6, dir: 'left', look: NPC_LOOK.pike, onTalk: crews[0] && crews[0].onTalk },
      { id: 'ivy', x: 8, y: 10, dir: 'right', look: NPC_LOOK.ivy, onTalk: crews[1] && crews[1].onTalk },
      { id: 'tom', x: 9, y: 10, dir: 'left', look: NPC_LOOK.tom, onTalk: crews[1] && crews[1].onTalk },
      { id: 'dog', x: 10, y: 6, dir: 'left', dog: true, onTalk: () => say([['', '(The dog thumps its tail. It has decided you live here now.)']]) },
    ];
    W.npcsByMap = { platform: npcs };
    W.marks = [
      { x: 5, y: 2.6, label: 'Depot · back room', gold: true },
      { x: 2.5, y: 6, label: crews[0] ? `Pickup · ${crews[0].stake}` : '', badge: crews[0] && crews[0].badge, lamp: crews[0] && crews[0].lamp, dim: crews[0] && crews[0].dim },
      { x: 8.5, y: 10, label: crews[1] ? `Pickup · ${crews[1].stake}` : '', badge: crews[1] && crews[1].badge, lamp: crews[1] && crews[1].lamp, dim: crews[1] && crews[1].dim },
      { x: 3, y: 12.6, label: 'Train · the Line' },
    ];
    enter('platform', opts.from === 'train' ? { x: 3, y: 11, dir: 'up' } : { x: 5, y: 3, dir: 'down' });
    if (opts.intro) setTimeout(() => say(opts.intro), 450);
    const h = document.getElementById('wHint'); if (h) h.textContent = 'Tap a label or a person · walk the town';
  }
  window.TBWorld = { start, hub, say: (l, t, c) => say(l, t, c), LOOKS, drawPerson, get state() { return W; } };
})();
