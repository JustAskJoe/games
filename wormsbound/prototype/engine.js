/* Wormsbound (working title) · Prototype 1 engine.
   © 2026 justaskjoe. All rights reserved.

   Pure game logic, no DOM. Runs in the browser as window.WB and in node (sim.js, test.js).
   - Seeded RNG whose state lives in G._s, so G is plain JSON (save = JSON.stringify(G)).
   - Every player input is an intent through act(G, intent). The UI, the bots and (later) online play all use it,
     so seed + intent log replays a match exactly. hash(G) is a checksum for spotting drift.
   - Fixed-step physics at 60 ticks a second while anything is flying or falling (phase 'flight').

   The map is a grid of terrain cells (1 = ground). Units, shells and duds move in cell units, y pointing down.
   Turn flow: aim (move, pick a weapon, fire or lob a live dud, or pass) → flight (step() until everything
   settles) → live duds tick down one → next team's turn, with new wind. Last team standing wins. */
(function (root) {
  'use strict';

  // ---------- tuning (everything a balance pass might touch lives here) ----------
  const TICK = 1 / 60;          // seconds per physics tick
  const COLS = 160, ROWS = 90;  // terrain grid, in cells (8 px each on a 1280×720 stage)
  const WATER0 = 82;            // water surface row at the start; below it you drown
  const GRAV = 30;              // cells / s²
  const VMAX = 60;              // launch speed at full power, cells / s
  const WIND_MAX = 7;           // strongest wind push, cells / s² sideways
  const UNIT_R = 1.5;           // unit body radius, cells
  const UNITS_PER_TEAM = 2;
  const HP = 100;
  const MOVE_STEPS = 14;        // steps (1 cell each) a unit may walk per turn
  const CLIMB = 2;              // highest ledge a step can climb
  const SAFE_FALL = 22;         // landing speed (cells/s) before fall damage
  const FALL_DMG = 2.2;         // hp per cell/s over SAFE_FALL
  const KNOCK = 26;             // knockback speed at the blast centre
  const LOB_RANGE = 5;          // how close a unit must be to pick up a live dud
  const LOB_POWER = 0.65;       // a thrown dud tops out below a full-power shot
  const SUDDEN_TURN = 24;       // from this turn on the water rises
  const SUDDEN_RISE = 2;        // rows per turn
  const MAX_TURNS = 80;         // hard stop (the rising water should end it well before this)

  // Weapons. ammo -1 = unlimited. r = crater radius (cells), dmg = damage at the centre (falls off to 0 at r × 1.6).
  const WEAPONS = {
    shell:   { name: 'Shell',   ammo: -1, r: 4,   dmg: 45, desc: 'Explodes where it lands.' },
    cluster: { name: 'Cluster', ammo: 2,  r: 2.5, dmg: 20, bomblets: 5, desc: 'Pops on impact and throws five bomblets.' },
    dud:     { name: 'Live dud', ammo: 2, r: 6,   dmg: 60, fuse: 3, desc: 'Lands without exploding and ticks down 3 turns. Anyone nearby can lob it again.' },
  };
  const BOMBLET = { r: 2.5, dmg: 18 };
  const DMG_SPREAD = 1.6;

  // ---------- seeded RNG (state in G._s) ----------
  function R(G) { G._s = (G._s + 0x6D2B79F5) >>> 0; let t = G._s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- terrain ----------
  const solidAt = (G, x, y) => { const cx = Math.floor(x), cy = Math.floor(y); if (cx < 0 || cx >= COLS || cy >= ROWS) return false; if (cy < 0) return false; return G.T[cy * COLS + cx] === 1; };
  function surfaceY(G, x) { const cx = clamp(Math.floor(x), 0, COLS - 1); for (let y = 0; y < ROWS; y++) if (G.T[y * COLS + cx]) return y; return ROWS; }

  function genTerrain(G) {
    const T = new Array(COLS * ROWS).fill(0);
    const p = [R(G), R(G), R(G), R(G)].map((v) => v * Math.PI * 2);
    const base = 30 + R(G) * 6;
    for (let x = 0; x < COLS; x++) {
      const u = x / COLS;
      let h = base + 9 * Math.sin(u * 6.3 + p[0]) + 5 * Math.sin(u * 13.7 + p[1]) + 2.5 * Math.sin(u * 29 + p[2]);
      // a dip in the middle so the teams face each other across a valley (sometimes it floods)
      h -= 14 * Math.exp(-Math.pow((u - 0.5) / 0.08, 2));
      const top = Math.round(ROWS - h);
      for (let y = Math.max(0, top); y < ROWS; y++) T[y * COLS + x] = 1;
    }
    G.T = T;
    // a few caves and overhangs so there's something to bank shots off
    const caves = 3 + Math.floor(R(G) * 3);
    for (let i = 0; i < caves; i++) {
      const cx = 12 + R(G) * (COLS - 24), sy = surfaceY(G, cx);
      carve(G, cx, sy + 6 + R(G) * 8, 3 + R(G) * 3);
    }
  }
  function carve(G, cx, cy, r) {
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(COLS - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(ROWS - 1, Math.ceil(cy + r));
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r && G.T[y * COLS + x]) { G.T[y * COLS + x] = 0; n++; }
    }
    return n;
  }

  // ---------- game state ----------
  function newGame(seed, opts = {}) {
    const G = {
      v: 1, seed: seed >>> 0, _s: (seed >>> 0) || 1, _id: 0,
      phase: 'aim', turn: 0, team: 0, teams: 2, unitIdx: [0, 0],
      wind: 0, water: WATER0, moves: MOVE_STEPS, weapon: 'shell',
      T: null, units: [], proj: [], duds: [], fx: [],
      ammo: [], fused: false, winner: null,
      stats: { shots: 0, lobs: 0, dudBlasts: 0, chains: 0, drowned: 0, fallKOs: 0, selfDmg: [0, 0], dmg: [0, 0] },
    };
    genTerrain(G);
    for (let t = 0; t < G.teams; t++) {
      const a = {}; for (const k in WEAPONS) a[k] = WEAPONS[k].ammo; G.ammo.push(a);
    }
    // two units a side, spread across each team's half
    const slots = [[0.1, 0.32], [0.68, 0.9]];
    for (let t = 0; t < G.teams; t++) for (let i = 0; i < UNITS_PER_TEAM; i++) {
      const [a, b] = slots[t]; const x = Math.round(COLS * (a + (b - a) * (i + 0.2 + R(G) * 0.6) / UNITS_PER_TEAM));
      G.units.push({ id: ++G._id, team: t, x: x + 0.5, y: surfaceY(G, x), vx: 0, vy: 0, hp: HP, alive: true, air: false, face: t === 0 ? 1 : -1 });
    }
    G.wind = rollWind(G);
    return G;
  }
  const rollWind = (G) => Math.round((R(G) * 2 - 1) * WIND_MAX * 10) / 10;
  const teamUnits = (G, t) => G.units.filter((u) => u.team === t && u.alive);
  function current(G) { const us = teamUnits(G, G.team); if (!us.length) return null; return us[G.unitIdx[G.team] % us.length]; }
  const center = (u) => [u.x, u.y - UNIT_R];

  // ---------- shots ----------
  // angle in degrees, 0 = right, 90 = straight up. power 0..1.
  function launch(u, angle, power) {
    const a = angle * Math.PI / 180, s = clamp(power, 0.05, 1) * VMAX;
    const [cx, cy] = center(u);
    const ox = Math.cos(a), oy = -Math.sin(a);
    return { x: cx + ox * (UNIT_R + 0.6), y: cy + oy * (UNIT_R + 0.6), vx: ox * s, vy: oy * s };
  }
  // one physics sub-step for anything ballistic. Returns 'ground' | 'unit' | 'water' | 'out' | null.
  // Shared by the real game and the bots' aim prediction, so a bot's guess is exactly what the game would do.
  function flyStep(G, p, dt, ignoreId) {
    p.vx += G.wind * dt; p.vy += GRAV * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < -4 || p.x > COLS + 4) return 'out';
    if (p.y >= G.water) return 'water';
    if (solidAt(G, p.x, p.y)) return 'ground';
    for (const u of G.units) {
      if (!u.alive || u.id === ignoreId) continue;
      const [cx, cy] = center(u), dx = p.x - cx, dy = p.y - cy;
      if (dx * dx + dy * dy <= (UNIT_R + 0.3) * (UNIT_R + 0.3)) { p.hitUnit = u.id; return 'unit'; }
    }
    return null;
  }
  function subSteps(p) { const sp = Math.hypot(p.vx, p.vy) * TICK; return Math.max(1, Math.ceil(sp / 0.5)); }

  function explode(G, x, y, r, dmg, byTeam, kind) {
    carve(G, x, y, r);
    const reach = r * DMG_SPREAD;
    for (const u of G.units) {
      if (!u.alive) continue;
      const [cx, cy] = center(u); const d = Math.hypot(cx - x, cy - y);
      if (d > reach) continue;
      const k = 1 - d / reach, hit = Math.round(dmg * k);
      if (hit > 0) {
        u.hp -= hit;
        if (byTeam != null) { if (byTeam === u.team) G.stats.selfDmg[byTeam] += hit; else G.stats.dmg[byTeam] += hit; }
      }
      const nx = d > 0.01 ? (cx - x) / d : 0, ny = d > 0.01 ? (cy - y) / d : -1;
      u.vx += nx * KNOCK * k; u.vy += (ny - 0.6) * KNOCK * k; u.air = true;
      if (u.hp <= 0) ko(G, u, 'blast');
    }
    G.fx.push({ k: 'boom', x, y, r, kind });
    // live duds caught in a blast go off too: chain reactions
    for (const d of G.duds) if (!d.gone && Math.hypot(d.x - x, d.y - y) <= r + 1.5) { d.chain = true; }
    for (const p of G.proj) if (p.w === 'dud' && !p.gone && Math.hypot(p.x - x, p.y - y) <= r + 1.5) { p.chain = true; }
    // anything standing on carved ground may now fall
    for (const u of G.units) if (u.alive && !supported(G, u)) u.air = true;
    for (const d of G.duds) if (!d.gone && !solidAt(G, d.x, d.y + 0.6)) d.air = true;
  }
  function ko(G, u, why) {
    if (!u.alive) return; u.alive = false; u.hp = 0; u.why = why;
    if (why === 'water') G.stats.drowned++; if (why === 'fall') G.stats.fallKOs++;
    G.fx.push({ k: 'ko', id: u.id, x: u.x, y: u.y, why });
  }
  const supported = (G, u) => solidAt(G, u.x, u.y + 0.05) || solidAt(G, u.x - 0.6, u.y + 0.05) || solidAt(G, u.x + 0.6, u.y + 0.05);

  // ---------- the physics tick ----------
  function step(G) {
    G.fx = [];
    if (G.phase !== 'flight') return G.fx;
    // projectiles
    for (const p of G.proj) {
      if (p.gone) continue;
      if (p.chain) { blowDud(G, p); continue; }
      const n = subSteps(p);
      for (let i = 0; i < n && !p.gone; i++) {
        const hit = flyStep(G, p, TICK / n, p.age < 6 ? p.from : -1);
        if (!hit) continue;
        p.gone = true;
        if (hit === 'water' || hit === 'out') { G.fx.push({ k: hit === 'water' ? 'splash' : 'lost', x: p.x, y: Math.min(p.y, G.water) }); break; }
        land(G, p);
      }
      p.age = (p.age || 0) + 1;
    }
    G.proj = G.proj.filter((p) => !p.gone);
    // resting or falling duds
    for (const d of G.duds) {
      if (d.gone) continue;
      if (d.chain || d.fuseOut) { if (d.chain) G.stats.chains++; blowDud(G, d); continue; }
      if (!d.air) continue;
      d.vy = (d.vy || 0) + GRAV * TICK; d.y += d.vy * TICK;
      if (d.y >= G.water) { d.gone = true; G.fx.push({ k: 'splash', x: d.x, y: G.water }); continue; }
      if (solidAt(G, d.x, d.y + 0.6)) { while (solidAt(G, d.x, d.y + 0.5) && d.y > 0) d.y -= 0.25; d.vy = 0; d.air = false; }
    }
    G.duds = G.duds.filter((d) => !d.gone);
    // units falling or knocked back
    for (const u of G.units) if (u.alive && u.air) unitPhysics(G, u);
    // all quiet? end the turn (duds tick first, which can start everything moving again)
    if (!G.proj.length && !G.units.some((u) => u.alive && u.air) && !G.duds.some((d) => d.air || d.chain || d.fuseOut)) settle(G);
    return G.fx;
  }
  function land(G, p) {
    if (p.w === 'shell') { explode(G, p.x, p.y, WEAPONS.shell.r, WEAPONS.shell.dmg, p.team, 'shell'); return; }
    if (p.w === 'bomblet') { explode(G, p.x, p.y, BOMBLET.r, BOMBLET.dmg, p.team, 'bomblet'); return; }
    if (p.w === 'cluster') {
      explode(G, p.x, p.y, WEAPONS.cluster.r, WEAPONS.cluster.dmg, p.team, 'cluster');
      const n = WEAPONS.cluster.bomblets;
      for (let i = 0; i < n; i++) {
        const a = Math.PI * (0.15 + 0.7 * (i + 0.5) / n), s = 14 + R(G) * 6;
        G.proj.push({ id: ++G._id, w: 'bomblet', team: p.team, from: -1, age: 6, x: p.x, y: p.y - 1.2, vx: Math.cos(a) * s, vy: -Math.sin(a) * s });
      }
      return;
    }
    if (p.w === 'dud') {
      // back off out of the ground, then rest there ticking
      let x = p.x - p.vx * TICK * 0.5, y = p.y - p.vy * TICK * 0.5, g = 0;
      while (solidAt(G, x, y) && g++ < 40) y -= 0.25;
      const d = { id: p.dudId || ++G._id, x, y, fuse: p.fuse, team: p.team, air: !solidAt(G, x, y + 0.6), vy: 0 };
      G.duds.push(d); G.fx.push({ k: 'dud', id: d.id, x, y, fuse: d.fuse });
    }
  }
  function blowDud(G, d) {
    d.gone = true; G.stats.dudBlasts++;
    explode(G, d.x, d.y, WEAPONS.dud.r, WEAPONS.dud.dmg, null, 'dud');
  }
  function unitPhysics(G, u) {
    u.vy += GRAV * TICK;
    const n = Math.max(1, Math.ceil(Math.hypot(u.vx, u.vy) * TICK / 0.4));
    for (let i = 0; i < n; i++) {
      const nx = u.x + u.vx * TICK / n, ny = u.y + u.vy * TICK / n;
      if (!solidAt(G, nx, ny - UNIT_R) && !solidAt(G, nx, ny - 0.2)) u.x = nx; else u.vx = 0;
      if (u.vy < 0) { if (!solidAt(G, u.x, ny - UNIT_R * 2)) u.y = ny; else u.vy = 0; }
      else if (solidAt(G, u.x, ny)) { // landed
        while (solidAt(G, u.x, u.y - 0.01) && u.y > 0) u.y -= 0.25;
        const v = u.vy; u.vy = 0; u.vx = 0; u.air = false;
        if (v > SAFE_FALL) { u.hp -= Math.round((v - SAFE_FALL) * FALL_DMG); if (u.hp <= 0) ko(G, u, 'fall'); }
        break;
      } else u.y = ny;
    }
    if (u.alive && (u.y >= G.water)) ko(G, u, 'water');
    if (u.alive && (u.x < 0 || u.x >= COLS)) ko(G, u, 'out');
  }

  // ---------- turns ----------
  function settle(G) {
    if (!G.fused) {
      G.fused = true;
      let boom = false;
      for (const d of G.duds) { d.fuse--; if (d.fuse <= 0) { d.fuseOut = true; boom = true; } }
      if (boom) return; // let the blasts play out, then settle again
    }
    checkWin(G);
    if (G.phase === 'over') return;
    nextTurn(G);
  }
  function checkWin(G) {
    const alive = [0, 1].map((t) => teamUnits(G, t).length);
    if (alive[0] && alive[1]) return;
    G.phase = 'over'; G.winner = alive[0] ? 0 : alive[1] ? 1 : -1; // -1 = draw
    G.fx.push({ k: 'over', winner: G.winner });
  }
  function nextTurn(G) {
    G.unitIdx[G.team]++;
    G.turn++; G.team = (G.team + 1) % G.teams;
    if (G.turn >= SUDDEN_TURN) {
      G.water = Math.max(4, G.water - SUDDEN_RISE);
      for (const u of G.units) if (u.alive && u.y >= G.water) ko(G, u, 'water');
      for (const d of G.duds) if (d.y >= G.water) d.gone = true;
      G.duds = G.duds.filter((d) => !d.gone);
      checkWin(G); if (G.phase === 'over') return;
    }
    if (G.turn >= MAX_TURNS) { // a stalemate nobody can break: the side with more total hp wins
      const hp = [0, 1].map((t) => teamUnits(G, t).reduce((a, u) => a + u.hp, 0));
      G.phase = 'over'; G.winner = hp[0] === hp[1] ? -1 : hp[0] > hp[1] ? 0 : 1; G.timeout = true; return;
    }
    G.phase = 'aim'; G.moves = MOVE_STEPS; G.fused = false; G.weapon = 'shell';
    G.wind = rollWind(G);
    G.fx.push({ k: 'turn', team: G.team, turn: G.turn });
  }

  // ---------- moving in the aim phase ----------
  function walk(G, u, dir) {
    const nx = u.x + dir;
    if (nx < 0.5 || nx > COLS - 0.5) return false;
    // find the standing height at nx: climb up to CLIMB cells, or step down
    let ny = u.y;
    let k = 0; while (solidAt(G, nx, ny - 0.01) && k <= CLIMB) { ny -= 1; k++; }
    if (k > CLIMB) return false;                      // a wall
    if (solidAt(G, nx, ny - UNIT_R * 2)) return false; // no headroom
    u.x = nx; u.y = ny; u.face = dir;
    // step off a ledge: drop straight down (fall damage counts)
    if (!supported(G, u)) { u.air = true; u.vx = 0; u.vy = 0; dropNow(G, u); }
    return true;
  }
  function dropNow(G, u) { let g = 0; while (u.alive && u.air && g++ < 600) unitPhysics(G, u); }

  // ---------- actions: the one way to change a game ----------
  //   { k: 'move', dir: -1|1 }                   walk one cell (MOVE_STEPS a turn)
  //   { k: 'weapon', w: 'shell'|'cluster'|'dud' } pick a weapon
  //   { k: 'fire', angle, power }                 fire the picked weapon (angle in degrees, 0 = right, 90 = up)
  //   { k: 'lob', dud, angle, power }             pick up a live dud within LOB_RANGE and throw it
  //   { k: 'pass' }                               end the turn without shooting (the UI's turn timer sends this)
  //   step(G) while phase === 'flight'            the clock, not a player action
  function act(G, it) {
    if (!it || typeof it !== 'object' || G.phase !== 'aim') return false;
    const u = current(G); if (!u) return false;
    switch (it.k) {
      case 'move': {
        if (G.moves <= 0 || (it.dir !== 1 && it.dir !== -1)) return false;
        if (!walk(G, u, it.dir)) return false;
        G.moves--;
        if (!u.alive) { G.phase = 'flight'; } // walked into the water: end the turn
        return true;
      }
      case 'weapon': {
        const w = WEAPONS[it.w]; if (!w) return false;
        if (G.ammo[G.team][it.w] === 0) return false;
        G.weapon = it.w; return true;
      }
      case 'fire': {
        if (!Number.isFinite(it.angle) || !Number.isFinite(it.power)) return false;
        const w = G.weapon, am = G.ammo[G.team];
        if (am[w] === 0) return false;
        if (am[w] > 0) am[w]--;
        const p = Object.assign(launch(u, it.angle, it.power), { id: ++G._id, w, team: G.team, from: u.id, age: 0 });
        if (w === 'dud') p.fuse = WEAPONS.dud.fuse;
        G.proj.push(p); G.stats.shots++; u.face = Math.cos(it.angle * Math.PI / 180) >= 0 ? 1 : -1;
        G.phase = 'flight'; return true;
      }
      case 'lob': {
        if (!Number.isFinite(it.angle) || !Number.isFinite(it.power)) return false;
        const d = G.duds.find((x) => x.id === it.dud && !x.air);
        if (!d || !canLob(G, u, d)) return false;
        G.duds = G.duds.filter((x) => x !== d);
        const p = Object.assign(launch(u, it.angle, Math.min(it.power, 1) * LOB_POWER), { id: ++G._id, w: 'dud', dudId: d.id, fuse: d.fuse, team: G.team, from: u.id, age: 0 });
        G.proj.push(p); G.stats.lobs++;
        G.phase = 'flight'; return true;
      }
      case 'pass': G.phase = 'flight'; return true;
      default: return false;
    }
  }
  function canLob(G, u, d) { const [cx, cy] = center(u); return Math.hypot(d.x - cx, d.y - cy) <= LOB_RANGE; }
  const lobbable = (G) => { const u = current(G); return u && G.phase === 'aim' ? G.duds.filter((d) => !d.air && canLob(G, u, d)) : []; };

  // Run the clock until the turn settles (for bots, the sim and tests). Returns the ticks used.
  function resolve(G, maxTicks = 20000) {
    let n = 0; while (G.phase === 'flight' && n++ < maxTicks) step(G);
    if (G.phase === 'flight') throw new Error('stuck in flight at turn ' + G.turn);
    return n;
  }

  // ---------- aim prediction (the same flyStep the game uses) ----------
  // Where would this shot land right now? Ignores bomblets and terrain changes from the shot itself.
  function predict(G, u, angle, power, maxTicks = 900) {
    const p = launch(u, angle, power); let t = 0;
    while (t++ < maxTicks) {
      const n = subSteps(p);
      for (let i = 0; i < n; i++) { const hit = flyStep(G, p, TICK / n, t < 6 ? u.id : -1); if (hit) return { x: p.x, y: p.y, hit, t, unit: p.hitUnit || null }; }
    }
    return { x: p.x, y: p.y, hit: 'timeout', t };
  }
  // Same falloff as explode(), without changing anything.
  function blastScore(G, x, y, r, dmg, team) {
    const reach = r * DMG_SPREAD; let mine = 0, theirs = 0;
    for (const u of G.units) { if (!u.alive) continue; const [cx, cy] = center(u); const d = Math.hypot(cx - x, cy - y); if (d > reach) continue; const h = Math.min(u.hp, dmg * (1 - d / reach)); if (u.team === team) mine += h; else theirs += h; }
    return { mine, theirs };
  }

  // ---------- bots (for the sim; later a "vs bot" mode) ----------
  // Bots read only what a player sees: the map, the units, the wind and the live duds.
  // style: smart (good aim, uses everything) · sloppy (few tries, shaky hands) · nodud (smart, never fires or lobs duds)
  // · duder (smart, loves duds: shows whether the mechanic is too strong).
  const STYLES = {
    smart:  { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, dud: 1, lob: 1, dodge: 1 },
    sloppy: { tries: 10, refine: 0,  noiseA: 5.0, noiseP: 0.07,  dud: 1, lob: 1, dodge: 0 },
    nodud:  { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, dud: 0, lob: 0, dodge: 1 },
    duder:  { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, dud: 2.2, lob: 1, dodge: 1 },
  };
  function botRng(G) { let s = (G.seed ^ Math.imul(G.turn + 1, 2654435761)) >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => (r() + r() + r() - 1.5) * 1.15;

  // Score a landing spot for team `team` with weapon w (from the bot's point of view).
  function scoreLanding(G, land, w, team, fuse) {
    if (land.hit === 'water' || land.hit === 'out' || land.hit === 'timeout') return -1;
    if (w === 'dud') {
      // a dud is a threat over time: worth more the nearer its fuse is to zero, minus the risk it gets lobbed back
      const s = blastScore(G, land.x, land.y, WEAPONS.dud.r, WEAPONS.dud.dmg, team);
      const sure = fuse <= 1 ? 1 : fuse === 2 ? 0.55 : 0.4;
      return sure * s.theirs - 1.4 * s.mine;
    }
    const W = w === 'cluster' ? { r: 3.5, dmg: 34 } : WEAPONS.shell;
    const s = blastScore(G, land.x, land.y, W.r, W.dmg, team);
    return s.theirs - 1.4 * s.mine + (land.unit && G.units.find((x) => x.id === land.unit).team !== team ? 4 : 0);
  }
  function bestShot(G, u, w, st, rnd, fuse, powerCap = 1) {
    const enemies = G.units.filter((x) => x.alive && x.team !== u.team);
    let best = { score: -Infinity };
    const tryOne = (angle, power) => {
      power = clamp(power, 0.1, 1) * powerCap;
      const land = predict(G, u, angle, power);
      const sc = scoreLanding(G, land, w, u.team, fuse);
      if (sc > best.score) best = { score: sc, angle, power: power / powerCap };
    };
    for (let i = 0; i < st.tries; i++) {
      const e = enemies[Math.floor(rnd() * enemies.length)] || enemies[0];
      const right = !e || e.x >= u.x;
      const angle = right ? 10 + rnd() * 75 : 95 + rnd() * 75;
      tryOne(angle, 0.3 + rnd() * 0.7);
    }
    for (let i = 0; i < st.refine && best.angle != null; i++) tryOne(best.angle + gauss(rnd) * 4, best.power + gauss(rnd) * 0.06);
    return best;
  }
  // One full bot turn: returns the intents it would send (and sends them through act()).
  function botTurn(G, style) {
    const st = STYLES[style] || STYLES.smart, rnd = botRng(G), u = current(G); if (!u) return [];
    const sent = [];
    const send = (it) => { if (act(G, it)) sent.push(it); return G.phase; };
    // dodge: a live dud about to blow next to us and nothing to lob it with → walk away from it
    if (st.dodge) {
      const near = G.duds.find((d) => d.fuse <= 1 && Math.hypot(d.x - u.x, d.y - u.y) < WEAPONS.dud.r * DMG_SPREAD);
      if (near && !(st.lob && canLob(G, u, near))) { const dir = u.x < near.x ? -1 : 1; for (let i = 0; i < MOVE_STEPS && G.phase === 'aim'; i++) if (!act(G, { k: 'move', dir })) break; else sent.push({ k: 'move', dir }); }
      if (G.phase !== 'aim') return sent;
    }
    const opts = [];
    const shell = bestShot(G, u, 'shell', st, rnd, 0); opts.push({ w: 'shell', ...shell });
    if (G.ammo[u.team].cluster !== 0) { const c = bestShot(G, u, 'cluster', st, rnd, 0); opts.push({ w: 'cluster', ...c, score: c.score * 1.05 }); }
    if (st.dud && G.ammo[u.team].dud !== 0) { const d = bestShot(G, u, 'dud', st, rnd, WEAPONS.dud.fuse); opts.push({ w: 'dud', ...d, score: d.score * st.dud }); }
    if (st.lob) for (const d of lobbable(G)) {
      const b = bestShot(G, u, 'dud', st, rnd, d.fuse - 1 <= 0 ? 1 : d.fuse, LOB_POWER);
      // getting a dud away from our own units is worth something on its own
      const here = blastScore(G, d.x, d.y, WEAPONS.dud.r, WEAPONS.dud.dmg, u.team);
      opts.push({ lob: d.id, ...b, score: b.score + here.mine * (d.fuse <= 1 ? 1.2 : 0.5) });
    }
    opts.sort((a, b) => b.score - a.score);
    const o = opts[0];
    if (!o || o.angle == null) { send({ k: 'pass' }); return sent; }
    const angle = o.angle + gauss(rnd) * st.noiseA, power = clamp(o.power + gauss(rnd) * st.noiseP, 0.05, 1);
    if (o.lob) send({ k: 'lob', dud: o.lob, angle, power });
    else { if (o.w !== 'shell') send({ k: 'weapon', w: o.w }); send({ k: 'fire', angle, power }); }
    if (G.phase === 'aim') send({ k: 'pass' });
    return sent;
  }

  // Play a whole match with one bot style per team. Returns the finished game and its intent log.
  function playOut(G, styles, opts = {}) {
    const log = []; let guard = 0;
    while (G.phase !== 'over' && guard++ < MAX_TURNS + 5) {
      const its = botTurn(G, styles[G.team]); log.push(...its);
      resolve(G);
    }
    if (G.phase !== 'over') throw new Error('match did not finish');
    return { G, log };
  }

  // ---------- checksum ----------
  function hash(G) {
    const r = (v) => Math.round(v * 100);
    const parts = [G.turn, G.team, G.phase, r(G.wind), G.water, G.moves, G.winner,
      G.units.map((u) => `${u.id}:${r(u.x)},${r(u.y)},${u.hp},${u.alive ? 1 : 0}`).join(';'),
      G.duds.map((d) => `${d.id}:${r(d.x)},${r(d.y)},${d.fuse}`).join(';'),
      G.ammo.map((a) => `${a.cluster},${a.dud}`).join(';'), G.T.join('')];
    let h = 2166136261; const s = parts.join('|');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(16);
  }
  // Replay: same seed + same intents = same game.
  function replay(seed, log) {
    const G = newGame(seed);
    for (const it of log) { if (G.phase === 'flight') resolve(G); if (!act(G, it)) throw new Error('replay: intent refused ' + JSON.stringify(it)); }
    if (G.phase === 'flight') resolve(G);
    return G;
  }

  const WB = { TICK, COLS, ROWS, WATER0, GRAV, VMAX, WIND_MAX, UNIT_R, UNITS_PER_TEAM, HP, MOVE_STEPS, LOB_RANGE, LOB_POWER, SUDDEN_TURN, MAX_TURNS,
    WEAPONS, BOMBLET, STYLES, newGame, act, step, resolve, current, teamUnits, solidAt, surfaceY, center, lobbable, canLob, predict, blastScore,
    botTurn, playOut, hash, replay };
  if (typeof module !== 'undefined' && module.exports) module.exports = WB; else root.WB = WB;
})(typeof window !== 'undefined' ? window : globalThis);
