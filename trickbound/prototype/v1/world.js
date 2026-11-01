(function () {
  // Trickbound: Books on the Line — the walkable opening. Pick a look and a name, wake on the train, walk the
  // Cinder Hollow platform, talk to Dee at the depot door, wake two critters, walk in for the first duel.
  // A square tile grid for walking, drawn on a canvas as an isometric diorama (art direction B, #21). All art is
  // code-drawn concept art; people are still placeholder pixel sprites.
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
  let cv = null, ctx = null, tile = 32, viewRows = 15, raf = 0;
  const flakes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.9, d: Math.random() * 6 }));

  function start(P, hooks) {
    W = { P, hooks, flags: {}, dlg: null, path: [], fade: 0, lit: false };
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
    hw = tile * 12 / 22; hh = hw / 2; ts = hw * 1.5;
    const fit = Math.ceil(((M.rows[0].length + M.rows.length) * hh + hw * 3) / tile); // the whole diorama's height, in tiles
    viewRows = Math.min(fit, Math.max(5, Math.floor((window.innerHeight - 190) / tile)));
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
    const r = cv.getBoundingClientRect(); const [x, y] = pick(e.clientX - r.left, e.clientY - r.top);
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

  // ---------------- Drawing: isometric diorama (art direction B, #21) ----------------
  // The map above is still a square grid (paths, collision, the script all use it). It's drawn as a three-quarter
  // isometric diorama: grid x runs down-right, grid y runs down-left, and blocks (the depot, the train, the car walls)
  // rise out of the floor. Everything is sorted back to front by x + y. Code-drawn concept art, not final art.
  const hash = (x, y, k) => { const n = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return n - Math.floor(n); };
  let hw = 20, hh = 10, ts = 29; // half a tile's width and height, and a person's size (CSS px)
  let V = { c: null, hw: 20, hh: 10, ox: 0, oy: 0 }; // the view being drawn: context, tile half-size, origin
  let hits = []; // what's tappable in the last frame, front-most last: { poly | x0,y0,x1,y1, gx, gy }
  const P3 = (gx, gy, z) => [V.ox + (gx - gy) * V.hw, V.oy + (gx + gy) * V.hh - (z || 0)];
  function poly(c, pts) { const g = V.c; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = c; g.fill(); g.strokeStyle = c; g.lineWidth = 0.6; g.stroke(); }
  // quads on the two faces we can see: the +y face (looks down-left) at row edge gy, the +x face (looks down-right) at gx
  const faceY = (gy, x0, x1, z0, z1) => [P3(x0, gy, z0), P3(x1, gy, z0), P3(x1, gy, z1), P3(x0, gy, z1)];
  const faceX = (gx, y0, y1, z0, z1) => [P3(gx, y1, z0), P3(gx, y0, z0), P3(gx, y0, z1), P3(gx, y1, z1)];
  const topQ = (x0, y0, x1, y1, z) => [P3(x0, y0, z), P3(x1, y0, z), P3(x1, y1, z), P3(x0, y1, z)];
  function box(x0, y0, x1, y1, z0, z1, top, left, right, faces) {
    faces = faces || 'tlr';
    if (faces.includes('l')) poly(left, faceY(y1, x0, x1, z0, z1));
    if (faces.includes('r')) poly(right, faceX(x1, y0, y1, z0, z1));
    if (faces.includes('t')) poly(top, topQ(x0, y0, x1, y1, z1));
  }
  function strokes(x, y, z, n, cols, k) { // loose brush dabs on a tile, laid along the iso axes
    const g = V.c; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const u = x + 0.1 + hash(x, y, i + k) * 0.6, v = y + 0.1 + hash(y, x, i + k) * 0.6, len = 0.2 + hash(i, y, k) * 0.3, ax = hash(x, i, k) > 0.5;
      const a = P3(u, v, z), b = P3(u + (ax ? len : 0), v + (ax ? 0 : len), z);
      g.strokeStyle = cols[i % cols.length]; g.lineWidth = V.hh * (0.22 + hash(i, x, k) * 0.25); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
  }
  function glow(x, y, r, c) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function pool(g, x, y, r, c) { g.save(); g.translate(x, y); g.scale(1, 0.5); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2); g.restore(); }
  const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };

  function blockH(ch, x, y) {
    if (ch === 'R' || ch === 'W' || ch === 'w' || ch === 'D') return hw * 1.5;
    if (ch === 'T') return hw * 0.62;
    if (ch === 'c' || ch === 'C') return y === 0 || x === 0 ? hw * 1.7 : hw * 0.22; // back walls tall, near walls cut away
    return 0;
  }
  const lampOn = (x, y) => W.lit || (W.map === 'platform' && x === 6 && y === 9); // arrival: one lamp of two working
  function ground(ch, x, y) {
    const d = topQ(x, y, x + 1, y + 1, 0);
    const under = 'LSH'.includes(ch) ? (y < 8 ? 's' : 'p') : ch === 'b' ? 'p' : ch === 'h' || ch === 'E' ? 'f' : ch;
    if (under === 's') { poly('#8F9AB2', d); strokes(x, y, 0, 3, ['#A9B3C8', '#9aa4bc', '#D9D4EA'], 1); }
    else if (under === '.') { poly('#5f5560', d); strokes(x, y, 0, 3, ['#6b6058', '#544a52', '#7a6f66'], 2); }
    else if (under === 'p') { poly('#4f4a55', d); strokes(x, y, 0, 2, ['#433e49', '#5a5560'], 3); if (y === 11) poly('#B9853F', topQ(x, y + 0.88, x + 1, y + 1, 0)); }
    else if (under === 'r') {
      poly('#2a2529', d);
      for (let k = 0; k < 3; k++) poly('#3A2A20', topQ(x + k * 0.33 + 0.06, y + 0.12, x + k * 0.33 + 0.2, y + 0.88, 0));
      for (const ry of [0.3, 0.68]) poly('#8f8f99', topQ(x, y + ry, x + 1, y + ry + 0.05, 0));
    }
    else if (under === 'f') { poly('#4a3a30', d); for (let k = 1; k < 4; k++) poly('#3e3028', topQ(x, y + k / 4, x + 1, y + k / 4 + 0.03, 0)); }
    else poly('#2A2030', d);
  }
  function block(ch, x, y, now) {
    const h = blockH(ch, x, y); const nb = (dx, dy) => blockH(at(x + dx, y + dy) || '', x + dx, y + dy) >= h;
    const faces = 't' + (nb(0, 1) ? '' : 'l') + (nb(1, 0) ? '' : 'r');
    if ('RWwD'.includes(ch)) {
      box(x, y, x + 1, y + 1, 0, h, y === 0 ? '#3C2F43' : '#43344a', '#5a4438', '#3A2A20', faces);
      strokes(x, y, h, 3, ['#A9B3C8', '#C3B3C0', '#8F9AB2'], 5); // snow on the roof
      if (faces.includes('l')) {
        poly('#4b3a35', faceY(y + 1, x, x + 1, 0, h * 0.18)); // footing
        poly('#3A2A20', faceY(y + 1, x, x + 1, h * 0.9, h)); // eave
        if (ch === 'w') { poly('#2a1f24', faceY(y + 1, x + 0.2, x + 0.8, h * 0.32, h * 0.78)); poly(W.lit ? '#FFD58A' : '#E8B86A', faceY(y + 1, x + 0.26, x + 0.74, h * 0.36, h * 0.74)); poly('#B9853F', faceY(y + 1, x + 0.48, x + 0.52, h * 0.36, h * 0.74)); }
        if (ch === 'D') {
          poly('#2a1f24', faceY(y + 1, x + 0.18, x + 0.82, 0, h * 0.74));
          if (W.flags.doorOpen) { poly('#FFD58A', faceY(y + 1, x + 0.24, x + 0.76, 0, h * 0.68)); poly('#E8B86A', faceY(y + 1, x + 0.24, x + 0.76, 0, h * 0.2)); }
          else { poly('#B5482F', faceY(y + 1, x + 0.24, x + 0.76, 0, h * 0.68)); poly('#86391c', faceY(y + 1, x + 0.49, x + 0.51, 0, h * 0.68)); poly('#E8B86A', faceY(y + 1, x + 0.62, x + 0.68, h * 0.3, h * 0.36)); }
        }
        if (ch === 'w' || ch === 'D') hits.push({ poly: faceY(y + 1, x, x + 1, 0, h), gx: x, gy: y });
      }
      if (x === 8 && y === 0) { box(x + 0.3, y + 0.3, x + 0.62, y + 0.62, h, h + hw * 0.6, '#26202a', '#3a2c28', '#2a1f24'); const [sx, sy] = P3(x + 0.46, y + 0.46, h + hw * 0.6); ctx.fillStyle = 'rgba(200,200,215,.16)'; for (let k = 0; k < 3; k++) { const ph = (now / 2600 + k / 3) % 1; ctx.beginPath(); ctx.arc(sx + Math.sin(ph * 5 + k) * hw * 0.2, sy - ph * hw * 1.6, hw * (0.12 + ph * 0.3), 0, Math.PI * 2); ctx.fill(); } }
    } else if (ch === 'T') {
      box(x, y, x + 1, y + 1, 0, h, '#1f2d27', '#2C6C80', '#22322b', faces);
      if (faces.includes('l')) {
        poly('#15110f', faceY(y + 1, x, x + 1, 0, h * 0.2));
        poly('#B9853F', faceY(y + 1, x, x + 1, h * 0.3, h * 0.35));
        if (x === 3) poly('#3d5a4c', faceY(y + 1, x + 0.25, x + 0.75, h * 0.2, h * 0.9));
        else if (x % 3) poly(W.lit ? '#FFD58A' : '#E8B86A', faceY(y + 1, x + 0.15, x + 0.85, h * 0.48, h * 0.82));
        let gy = y; while (at(x, gy - 1) === 'T') gy--; // the side you see counts as the platform-side car you can walk up to
        hits.push({ poly: faceY(y + 1, x, x + 1, 0, h), gx: x, gy });
      }
    } else if (ch === 'c' || ch === 'C') {
      box(x, y, x + 1, y + 1, 0, h, '#2a1d1d', '#3b2a2a', '#2f2121', faces);
      if (ch === 'C' && faces.includes('l')) {
        poly('#1d2235', faceY(y + 1, x + 0.15, x + 0.85, h * 0.38, h * 0.82));
        for (let k = 0; k < 3; k++) { const u = 0.17 + ((hash(x, k) + now / 900 * (1 + k * 0.3)) % 1) * 0.6; poly('rgba(217,212,234,.55)', faceY(y + 1, x + u, x + u + 0.06, h * (0.45 + k * 0.11), h * (0.48 + k * 0.11))); }
      }
    }
  }
  function prop(ch, x, y, now) {
    const [cx, cy] = P3(x + 0.5, y + 0.5);
    if (ch === 'L') {
      const on = lampOn(x, y) || (!W.lit && Math.sin(now / 90) > 0.97); // the dead one sputters now and then
      ctx.fillStyle = '#26202a'; ctx.fillRect(cx - hw * 0.06, cy - hw * 1.75, hw * 0.12, hw * 1.75); ctx.fillRect(cx - hw * 0.18, cy - hw * 0.1, hw * 0.36, hw * 0.1);
      ctx.fillRect(cx - hw * 0.17, cy - hw * 2.1, hw * 0.34, hw * 0.4); ctx.fillStyle = on ? '#FFD58A' : '#3a3240'; ctx.fillRect(cx - hw * 0.11, cy - hw * 2.04, hw * 0.22, hw * 0.28);
      hits.push({ x0: cx - hw * 0.3, x1: cx + hw * 0.3, y0: cy - hw * 2.2, y1: cy - hw * 0.3, gx: x, gy: y });
    } else if (ch === 'b') {
      box(x + 0.12, y + 0.4, x + 0.88, y + 0.62, 0, hw * 0.3, '#6A4A30', '#5b3a26', '#3A2A20');
      box(x + 0.12, y + 0.3, x + 0.88, y + 0.38, hw * 0.3, hw * 0.62, '#5b3a26', '#4a2e1f', '#3A2A20');
      strokes(x + 0.1, y + 0.2, hw * 0.31, 1, ['#A9B3C8'], 9);
    } else if (ch === 'S') {
      for (const u of [0.25, 0.75]) { const [px, py] = P3(x + u, y + 0.5); ctx.fillStyle = '#3A2A20'; ctx.fillRect(px - hw * 0.04, py - hw * 1.1, hw * 0.08, hw * 1.1); }
      poly('#6A4A30', faceY(y + 0.5, x + 0.08, x + 0.92, hw * 0.6, hw * 1.15)); poly('#F5ECDD', faceY(y + 0.5, x + 0.2, x + 0.8, hw * 0.9, hw * 0.96)); poly('#F5ECDD', faceY(y + 0.5, x + 0.2, x + 0.62, hw * 0.74, hw * 0.8));
      poly('#C3B3C0', topQ(x + 0.08, y + 0.44, x + 0.92, y + 0.5, hw * 1.15));
      hits.push({ x0: cx - hw * 0.5, x1: cx + hw * 0.5, y0: cy - hw * 1.3, y1: cy - hw * 0.4, gx: x, gy: y });
    } else if (ch === 'h') {
      box(x + 0.1, y + 0.12, x + 0.9, y + 0.88, 0, hw * 0.32, '#7a3f5a', '#5a2d42', '#4a2236');
      const back = y < 2 ? [y + 0.12, y + 0.26] : [y + 0.74, y + 0.88];
      box(x + 0.1, back[0], x + 0.9, back[1], hw * 0.32, hw * 0.8, '#7a3f5a', '#5a2d42', '#4a2236');
    } else if (ch === 'E') {
      poly('#6a3f24', faceX(x + 0.95, y + 0.08, y + 0.92, 0, hw * 1.4)); poly('#f2c46b', faceX(x + 0.95, y + 0.3, y + 0.7, hw * 0.7, hw * 1.2)); poly('#E8B86A', faceX(x + 0.95, y + 0.74, y + 0.8, hw * 0.55, hw * 0.62));
      hits.push({ x0: cx, x1: cx + hw * 1.1, y0: cy - hw * 1.6, y1: cy + hh * 0.4, gx: x, gy: y });
    }
  }
  function heap(now) { // the slag heap on tiles (0..1, 5..6): a smoking mound with embers
    const L = P3(0, 7), Rr = P3(2, 5), B = P3(2, 7), T = P3(1, 6, hw * 1.15);
    ctx.fillStyle = '#231c22'; ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(T[0] - hw * 0.9, T[1] + hh * 0.2, T[0], T[1]); ctx.quadraticCurveTo(T[0] + hw * 0.9, T[1] + hh * 0.2, Rr[0], Rr[1]); ctx.lineTo(B[0], B[1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2f37'; ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.quadraticCurveTo(T[0] + hw * 0.9, T[1] + hh * 0.2, Rr[0], Rr[1]); ctx.lineTo(B[0], B[1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c4cad8'; ctx.beginPath(); ctx.moveTo(T[0] - hw * 0.35, T[1] + hh * 0.5); ctx.quadraticCurveTo(T[0], T[1] - hh * 0.3, T[0] + hw * 0.4, T[1] + hh * 0.45); ctx.quadraticCurveTo(T[0], T[1] + hh * 0.2, T[0] - hw * 0.35, T[1] + hh * 0.5); ctx.fill();
    for (let k = 0; k < 9; k++) { const u = hash(k, 1), v = hash(k, 2); const px = L[0] + (B[0] - L[0]) * u + (T[0] - L[0]) * v * 0.5, py = L[1] - (L[1] - T[1]) * v * 0.7 + hh * u * 0.5; ctx.fillStyle = Math.sin(now / 400 + k * 1.7) > 0.2 ? '#E8B86A' : '#B5482F'; ctx.fillRect(px, py, hw / 9, hw / 9); }
    ctx.fillStyle = 'rgba(200,200,215,.18)'; for (let k = 0; k < 3; k++) { const ph = (now / 2400 + k / 3) % 1; ctx.beginPath(); ctx.arc(T[0] + Math.sin(ph * 6 + k) * hw * 0.25, T[1] - ph * hw * 1.6, hw * (0.15 + ph * 0.35), 0, Math.PI * 2); ctx.fill(); }
  }
  function person(look, dir, frame, gx, gy, n) {
    const [sx, sy] = P3(gx + 0.5, gy + 0.5);
    if (n && n.dog) paint(ctx, DOG, { K: '#6b4a32', E: '#1a1418' }, sx - ts * 0.4, sy - ts * 0.5, ts / 10, n.dir === 'right');
    else drawPerson(ctx, look, dir, frame, sx - ts / 2, sy - ts + ts / 8, ts);
    if (n) hits.push(n.dog ? { x0: sx - ts * 0.45, x1: sx + ts * 0.45, y0: sy - ts * 0.6, y1: sy, gx: n.x, gy: n.y } : { x0: sx - ts * 0.32, x1: sx + ts * 0.32, y0: sy - ts * 1.7, y1: sy, gx: n.x, gy: n.y });
  }
  function lights(now, floor) {
    const M = MAPS[W.map];
    ctx.globalCompositeOperation = 'lighter';
    M.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) {
      const ch = row[x]; const [cx, cy] = P3(x + 0.5, y + 0.5);
      if (ch === 'L' && lampOn(x, y)) floor ? pool(ctx, cx, cy, hw * 3, 'rgba(255,190,110,0.34)') : glow(cx, cy - hw * 1.9, hw * 1.3, 'rgba(255,200,120,0.42)');
      if (ch === 'w') { const [fx, fy] = P3(x + 0.5, y + 1); floor ? pool(ctx, fx, fy + hh * 0.6, hw * 1.7, `rgba(255,190,110,${W.lit ? 0.26 : 0.16})`) : glow(fx, fy - hw * 0.8, hw * 1.1, `rgba(255,190,110,${W.lit ? 0.22 : 0.14})`); }
      if (ch === 'D' && W.flags.doorOpen) { const [fx, fy] = P3(x + 0.5, y + 1); floor ? pool(ctx, fx, fy + hh * 0.8, hw * 2.4, 'rgba(255,190,110,0.36)') : glow(fx, fy - hw * 0.6, hw * 1.2, 'rgba(255,200,120,0.3)'); }
      if (ch === 'T' && !floor && x % 3 && at(x, y + 1) !== 'T') { const [fx, fy] = P3(x + 0.5, y + 1, hw * 0.4); glow(fx, fy, hw * 0.7, `rgba(255,190,110,${W.lit ? 0.18 : 0.1})`); }
      if (ch === 'C' && !floor && y === 0) { const [fx, fy] = P3(x + 0.5, y + 1, hw * 1.05); glow(fx, fy, hw * 0.9, 'rgba(140,170,230,0.12)'); }
      if (ch === 'E' && floor) pool(ctx, cx, cy, hw * 1.6, 'rgba(255,190,110,0.22)');
      if (ch === 'H' && x === 1 && y === 6 && !floor) glow(...P3(1, 6, hw * 0.6), hw * 2, `rgba(255,120,60,${0.16 + Math.sin(now / 300) * 0.04})`);
    } });
    if (W.map === 'car' && floor) for (let x = 2; x < 11; x += 3) pool(ctx, ...P3(x, 2.5), hw * 2.2, 'rgba(255,200,130,0.16)');
    ctx.globalCompositeOperation = 'source-over';
  }
  function draw(now) {
    const M = MAPS[W.map]; const me = W.me; const cols = M.rows[0].length, nrows = M.rows.length;
    const cw = tile * 12, chh = tile * viewRows;
    const p = me.t0 ? Math.min(1, (now - me.t0) / STEP) : 1; const mx = me.fx + (me.x - me.fx) * p, my = me.fy + (me.y - me.fy) * p;
    // camera: keep the player near the middle, clamped to the diorama's edges
    V.c = ctx; V.hw = hw; V.hh = hh;
    const minX = -nrows * hw - hw * 0.5, maxX = cols * hw + hw * 0.5, minY = -hw * 2.4, maxY = (cols + nrows) * hh + hh;
    const px = (mx - my) * hw, py = (mx + my + 1) * hh - hw;
    const cx = maxX - minX <= cw ? (minX + maxX) / 2 : Math.max(minX + cw / 2, Math.min(maxX - cw / 2, px));
    const cy = maxY - minY <= chh ? (minY + maxY) / 2 : Math.max(minY + chh / 2, Math.min(maxY - chh / 2, py));
    V.ox = cw / 2 - cx; V.oy = chh / 2 - cy;
    const sky = ctx.createLinearGradient(0, 0, 0, chh); sky.addColorStop(0, M.snow ? '#2b2c55' : '#1c1726'); sky.addColorStop(0.5, '#1c1726'); sky.addColorStop(1, '#140F17');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, cw, chh);
    hits = [];
    M.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (!blockH(row[x], x, y)) ground(row[x], x, y); });
    lights(now, true); // lamplight pools on the floor, under everyone's feet
    const items = [];
    M.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (blockH(ch, x, y)) items.push({ d: x + y, f: () => block(ch, x, y, now) }); else if ('LSbhE'.includes(ch)) items.push({ d: x + y + 0.3, f: () => prop(ch, x, y, now) }); } });
    if (M.rows[5] && M.rows[5][0] === 'H') items.push({ d: 7, f: () => heap(now) });
    for (const n of W.npcs) if (!n.gone) items.push({ d: n.x + n.y + 0.6, f: () => person(n.look, n.dir, 0, n.x, n.y, n) });
    const look = LOOKS.find((L) => L.id === W.P.look) || LOOKS[0]; const drawMe = () => person(look, me.dir, me.t0 ? me.frame : 0, mx, my);
    items.push({ d: mx + my + 0.6, f: drawMe });
    items.sort((a, b) => a.d - b.d).forEach((q) => q.f());
    ctx.globalAlpha = 0.35; drawMe(); ctx.globalAlpha = 1; // a ghost of you over anything tall in front (the train)
    lights(now, false);
    if (W.marks) for (const m of W.marks) drawMark(m, now);
    if (M.snow) { ctx.fillStyle = 'rgba(235,240,250,.75)'; for (const f of flakes) { f.y += 0.0009 * f.s; if (f.y > 1) { f.y = 0; f.x = Math.random(); } const fx = (f.x + Math.sin(now / 1400 + f.d) * 0.01) * cw; ctx.fillRect(fx, f.y * chh, f.s * 2, f.s * 2); } }
    const g = ctx.createRadialGradient(cw / 2, chh / 2, Math.min(cw, chh) * 0.3, cw / 2, chh / 2, Math.max(cw, chh) * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,6,14,.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, chh);
    if (W.fade > 0) { ctx.fillStyle = `rgba(20,15,23,${W.fade})`; ctx.fillRect(0, 0, cw, chh); }
  }
  // screen point (canvas px) → the grid tile under it: people and tall things first, then the floor
  function pick(sx, sy) {
    for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (h.poly ? inPoly(sx, sy, h.poly) : sx >= h.x0 && sx <= h.x1 && sy >= h.y0 && sy <= h.y1) return [h.gx, h.gy]; }
    const wx = (sx - V.ox) / hw, wy = (sy - V.oy) / hh; return [Math.floor((wx + wy) / 2), Math.floor((wy - wx) / 2)];
  }
  // where to tap (page coords) to hit tile x,y on screen right now, or null if it's off screen (tests use this)
  function tapPoint(x, y) {
    if (!cv || !cv.isConnected) return null; const r = cv.getBoundingClientRect(); const cw = tile * 12, chh = tile * viewRows; const c = [];
    for (const h of hits) if (h.gx === x && h.gy === y) {
      if (h.poly) { const m = h.poly.reduce((a, q) => [a[0] + q[0] / h.poly.length, a[1] + q[1] / h.poly.length], [0, 0]); c.push(m); h.poly.forEach((q) => c.push([q[0] * 0.35 + m[0] * 0.65, q[1] * 0.35 + m[1] * 0.65])); }
      else for (const f of [0.6, 0.3, 0.85]) c.push([(h.x0 + h.x1) / 2, h.y0 + (h.y1 - h.y0) * f]);
    }
    for (const [u, v] of [[0.5, 0.5], [0.3, 0.3], [0.7, 0.7], [0.3, 0.7], [0.7, 0.3], [0.5, 0.2], [0.2, 0.5], [0.8, 0.5], [0.5, 0.8]]) c.push(P3(x + u, y + v));
    for (const [sx, sy] of c) { if (sx < 2 || sy < 2 || sx > cw - 2 || sy > chh - 2) continue; const g = pick(sx, sy); if (g[0] === x && g[1] === y) return { x: r.left + sx, y: r.top + sy }; }
    return null;
  }
  function drawMark(m, now) {
    const t = tile; const ch = at(Math.floor(m.x), Math.floor(m.y)) || ''; const bh = blockH(ch, Math.floor(m.x), Math.floor(m.y));
    const [cx, base] = P3(m.x + 0.5, m.y + 0.5); const bob = Math.sin(now / 350 + m.x) * t * 0.06; let y = base - (bh ? bh + hw * 0.55 : ts * 1.9) + bob;
    if (m.badge) { ctx.font = `${Math.round(t * 0.5)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (m.lamp) { ctx.globalCompositeOperation = 'lighter'; glow(cx, y, t * 0.7, 'rgba(255,210,120,.45)'); ctx.globalCompositeOperation = 'source-over'; } ctx.globalAlpha = m.dim ? 0.75 : 1; ctx.fillText(m.badge, cx, y); ctx.globalAlpha = 1; y -= t * 0.55; }
    if (m.label) {
      ctx.font = `700 ${Math.max(10, Math.round(t * 0.3))}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(m.label).width + t * 0.4, h = t * 0.46; const lx = Math.max(2, Math.min(t * 12 - w - 2, cx - w / 2));
      ctx.fillStyle = m.gold ? 'rgba(232,184,106,.95)' : 'rgba(28,21,30,.9)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx, y - h / 2, w, h, h / 2); else ctx.rect(lx, y - h / 2, w, h); ctx.fill();
      ctx.strokeStyle = 'rgba(232,184,106,.7)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = m.gold ? '#2A2030' : '#F5ECDD'; ctx.fillText(m.label, lx + w / 2, y + 1);
    }
  }

  // ---------------- The station interior (the waiting-hall card room), drawn into the depot header ----------------
  // opts.lit: Lamp-lit (both lamps, warmer) instead of Arrival (one lamp of two working).
  function drawHall(el, opts) {
    const lit = !!(opts && opts.lit); const w = el.clientWidth || 360, h = el.clientHeight || 150; const dpr = window.devicePixelRatio || 1;
    el.width = Math.round(w * dpr); el.height = Math.round(h * dpr); const g = el.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const keep = V; const s = Math.max(w / 12.5, h / 5.4); V = { c: g, hw: s, hh: s / 2, ox: w * 0.5, oy: h * 0.84 - 3.7 * s };
    const WH = s * 2.6, pt = (gx, gy, z) => P3(gx, gy, z);
    g.fillStyle = '#140F17'; g.fillRect(0, 0, w, h);
    // walls: the back wall (y = 0) and the left wall (x = 0), wainscot below
    poly('#3C2F43', faceY(0, 0, 7.5, 0, WH)); poly('#33283a', faceX(0, 0, 6.5, 0, WH));
    poly('#3A2A20', faceY(0, 0, 7.5, 0, WH * 0.3)); poly('#2f2219', faceX(0, 0, 6.5, 0, WH * 0.3));
    for (let k = 0; k < 14; k++) { const u = hash(k, 3) * 7, z = WH * (0.35 + hash(k, 4) * 0.6); poly(k % 2 ? '#463650' : '#5C4B62', faceY(0, u, u + 0.4 + hash(k, 5) * 0.5, z, z + s * 0.06)); }
    // windows on the left wall: snow outside
    for (const y0 of [2.2, 4.2]) { poly('#3A2A20', faceX(0.02, y0, y0 + 1.1, WH * 0.36, WH * 0.9)); poly('#3B3F7A', faceX(0.03, y0 + 0.08, y0 + 1.02, WH * 0.4, WH * 0.86)); poly('#3A2A20', faceX(0.04, y0 + 0.53, y0 + 0.57, WH * 0.4, WH * 0.86)); for (let k = 0; k < 5; k++) { const u = y0 + 0.12 + hash(k, y0) * 0.85, z = WH * (0.42 + hash(y0, k) * 0.4); poly('#D9D4EA', faceX(0.05, u, u + 0.05, z, z + s * 0.05)); } }
    // the quest board and the pack wall on the back wall
    poly('#6A4A30', faceY(0.02, 1.7, 2.9, WH * 0.42, WH * 0.8)); for (let k = 0; k < 4; k++) poly('#F5ECDD', faceY(0.03, 1.8 + (k % 2) * 0.55, 2.25 + (k % 2) * 0.55, WH * (0.47 + (k >> 1) * 0.16), WH * (0.6 + (k >> 1) * 0.16)));
    poly('#3A2A20', faceY(0.02, 4.7, 7.3, WH * 0.34, WH * 0.95));
    const packs = ['#2C6C80', '#B5482F', '#4E7A3E', '#B9853F', '#C3B3C0'];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) { const u = 4.8 + k * 0.31; poly(packs[(k + r * 2) % 5], faceY(0.03, u, u + 0.22, WH * (0.38 + r * 0.19), WH * (0.5 + r * 0.19))); }
    // floor: planks, then the rug
    poly('#6A4A30', topQ(0, 0, 7.5, 6.5, 0));
    for (let k = 1; k < 13; k++) poly('#5a3e28', topQ(0, k / 2, 7.5, k / 2 + 0.03, 0));
    g.lineCap = 'round'; for (let k = 0; k < 30; k++) { const u = hash(k, 7) * 7, v = hash(k, 8) * 6.3; const a = pt(u, v), b = pt(u + 0.3 + hash(k, 9) * 0.5, v); g.strokeStyle = k % 2 ? '#7a5838' : '#4f3622'; g.lineWidth = s * 0.07; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    poly('#B5482F', topQ(1.7, 2.1, 5.1, 5.3, 0)); poly('#8e3524', topQ(1.9, 2.3, 4.9, 5.1, 0)); poly('#B5482F', topQ(2.05, 2.45, 4.75, 4.95, 0));
    // the stove in the corner
    box(0.3, 0.3, 1.15, 1.15, 0, s * 1.1, '#26202a', '#1d181f', '#141016'); box(0.6, 0.6, 0.82, 0.82, s * 1.1, WH, '#26202a', '#1d181f', '#141016');
    poly('#B5482F', faceY(1.15, 0.5, 0.95, s * 0.22, s * 0.62)); poly('#E8B86A', faceY(1.15, 0.56, 0.89, s * 0.26, s * 0.5));
    const fig = (gx, gy, coat) => { const [x, y] = pt(gx, gy); pool(g, x, y, s * 0.5, 'rgba(0,0,0,.35)'); g.fillStyle = coat; g.beginPath(); g.moveTo(x - s * 0.24, y); g.lineTo(x + s * 0.24, y); g.lineTo(x + s * 0.16, y - s * 0.78); g.lineTo(x - s * 0.16, y - s * 0.78); g.closePath(); g.fill(); g.fillStyle = '#7b4f35'; g.beginPath(); g.arc(x, y - s * 0.93, s * 0.16, 0, Math.PI * 2); g.fill(); };
    // the counter, with Dee's clerk behind it
    fig(6.2, 1.6, '#4a5560');
    box(5, 2.1, 6.9, 4.4, 0, s * 0.72, '#B9853F', '#6A4A30', '#3A2A20');
    // the card table: two players behind it, the table, two in front
    fig(2.6, 3.0, '#B5482F'); fig(3.7, 2.6, '#2C6C80');
    const [tx, ty] = pt(3.4, 3.7, s * 0.55);
    g.fillStyle = '#3A2A20'; g.fillRect(tx - s * 0.08, ty, s * 0.16, s * 0.55); g.beginPath(); g.ellipse(tx, ty + s * 0.06, s * 1.2, s * 0.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#4E7A3E'; g.beginPath(); g.ellipse(tx, ty, s * 1.12, s * 0.55, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5d8c4b'; g.beginPath(); g.ellipse(tx - s * 0.2, ty - s * 0.08, s * 0.6, s * 0.26, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#F5ECDD'; for (const [dx, dy] of [[-0.35, -0.1], [0.1, -0.22], [0.42, 0.02], [-0.05, 0.16]]) g.fillRect(tx + dx * s, ty + dy * s, s * 0.14, s * 0.18);
    fig(4.5, 4.3, '#2A2030'); fig(3.0, 4.75, '#5C4B62'); fig(6.3, 5.0, '#7a3f5a');
    // two hanging lamps: over the table (always) and over the counter (Lamp-lit only)
    const lamps = [[3.4, 3.7, true], [5.9, 3.2, lit]];
    for (const [lx, ly, on] of lamps) { const [x, y] = pt(lx, ly, s * 1.9); g.strokeStyle = '#26202a'; g.lineWidth = Math.max(1, s * 0.04); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y); g.stroke(); g.fillStyle = '#B9853F'; g.beginPath(); g.moveTo(x - s * 0.28, y + s * 0.2); g.lineTo(x + s * 0.28, y + s * 0.2); g.lineTo(x + s * 0.1, y - s * 0.05); g.lineTo(x - s * 0.1, y - s * 0.05); g.closePath(); g.fill(); g.fillStyle = on ? '#FFD58A' : '#3a3240'; g.fillRect(x - s * 0.1, y + s * 0.2, s * 0.2, s * 0.1); }
    // light
    g.globalCompositeOperation = 'lighter';
    const halo = (x, y, r, c) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    for (const [lx, ly, on] of lamps) if (on) { pool(g, ...pt(lx, ly), s * 3, 'rgba(255,190,110,0.30)'); halo(...pt(lx, ly, s * 1.6), s * 1.3, 'rgba(255,205,130,0.38)'); }
    halo(...pt(0.72, 1.15, s * 0.4), s * 1.6, 'rgba(255,120,60,0.30)'); pool(g, ...pt(1.2, 1.6), s * 2, 'rgba(255,120,60,0.18)');
    if (lit) { g.fillStyle = 'rgba(232,184,106,0.07)'; g.fillRect(0, 0, w, h); }
    g.globalCompositeOperation = 'source-over';
    const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,6,14,.65)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
    V = keep;
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
  // opts: { from: 'train'|'door', crews: [{ name, stake, badge, lamp, dim, onTalk }], dee: fn, intro: lines, lit: Lamp-lit town }
  function hub(P, hooks, opts) {
    W = { P, hooks, mode: 'hub', flags: { doorOpen: true, platIntro: true }, dlg: null, path: [], fade: 0, lit: !!opts.lit };
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
  window.TBWorld = { start, hub, say: (l, t, c) => say(l, t, c), LOOKS, drawPerson, drawHall, tapPoint, get state() { return W; } };
})();
