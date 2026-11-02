/* Wormsbound (working title) · Prototype 1 engine.
   © 2026 justaskjoe. All rights reserved.

   Pure game logic, no DOM. Runs in the browser as window.WB and in node (sim.js, test.js).
   - Seeded RNG whose state lives in G._s, so G is plain JSON (save = JSON.stringify(G)).
   - Every player input is an intent through act(G, intent). The UI, the bots and (later) online play all use it,
     so seed + intent log replays a match exactly. hash(G) is a checksum for spotting drift.
   - Fixed-step physics at 60 ticks a second while anything is flying or falling (phase 'flight').

   Each team picks one of five characters (CHARS) before the match. A character sets its units' health, armour,
   walking and climbing, and its two shots: Shot 1 (unlimited) and Shot 2 (its ability, 2 a match). Every
   character also carries the Live dud. The idea of characters with their own shots comes from GunBound;
   the characters, names and shots here are our own.

   The map is a grid of terrain cells (1 = ground). Units, shells and duds move in cell units, y pointing down.
   Turn flow: aim (move, pick a shot, fire or lob a live dud, or pass) → flight (step() until everything
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
  const HP = 100;               // a "standard" unit; characters scale from it
  const MOVE_STEPS = 14;        // default steps a turn (characters override)
  const CLIMB = 2;              // default highest ledge a step can climb
  const SAFE_FALL = 22;         // landing speed (cells/s) before fall damage
  const FALL_DMG = 2.2;         // hp per cell/s over SAFE_FALL
  const KNOCK = 26;             // knockback speed at the blast centre
  const LOB_RANGE = 5;          // how close a unit must be to pick up a live dud
  const LOB_POWER = 0.65;       // a thrown dud tops out below a full-power shot
  const SUDDEN_TURN = 24;       // from this turn on the water rises
  const SUDDEN_RISE = 2;        // rows per turn
  const MAX_TURNS = 80;         // hard stop (the rising water should end it well before this)
  const DMG_SPREAD = 1.6;       // damage falls off to 0 at r × 1.6

  // The Live dud: every character has 2. Lands without exploding, ticks down 3 turns, anyone near can lob it.
  const DUD = { name: 'Live dud', ammo: 2, r: 6, dmg: 60, fuse: 3, desc: 'Lands without exploding and ticks for 3 turns. Anyone close can lob it on.' };

  // Shot fields: r crater, dmg centre damage, wind (× wind push), speed (× launch speed), knock (× knockback),
  // bounce (bounces off the ground first), drill (cells it tunnels through), strike (lightning: {w, dmg}),
  // double (a second shot follows), ammo (-1 = unlimited).
  // Numbers tuned Nov 2, 2026 so every character wins 40-60% of smart-bot matches across the roster (sim.js).
  const CHARS = {
    brick: { name: 'Brick', role: 'Tank', hp: 115, armor: 0.85, steps: 10, climb: 2,
      blurb: 'Big, tough and slow. Takes 15% less damage. His heavy shots barely feel the wind.',
      shot1: { name: 'Slug', ammo: -1, r: 3.5, dmg: 42, wind: 0.45, desc: 'A heavy shell. Wind hardly moves it.' },
      shot2: { name: 'Wrecking Ball', ammo: 2, r: 5, dmg: 56, wind: 0.45, bounce: 1, desc: 'Bounces once, then a big blast.' } },
    zip: { name: 'Zip', role: 'Scout', hp: 105, armor: 1, steps: 22, climb: 3,
      blurb: 'Quick on her feet. Walks twice as far as most and climbs higher ledges.',
      shot1: { name: 'Dart', ammo: -1, r: 3, dmg: 44, speed: 1.15, wind: 0.8, desc: 'Fast and flat, with a small blast.' },
      shot2: { name: 'Double Tap', ammo: 2, r: 3, dmg: 38, speed: 1.15, wind: 0.8, double: true, desc: 'Two darts, one right after the other.' } },
    volt: { name: 'Volt', role: 'All-rounder', hp: 100, armor: 1, steps: 14, climb: 2,
      blurb: 'Steady and simple. Calls lightning down on anyone hiding under cover.',
      shot1: { name: 'Arc Ball', ammo: -1, r: 3.2, dmg: 44, desc: 'A plain, reliable shell.' },
      shot2: { name: 'Thunderstrike', ammo: 2, r: 3, dmg: 26, strike: { w: 2.2, dmg: 34 }, desc: 'Where it lands, lightning hits everyone close by, cover or not.' } },
    digger: { name: 'Digger', role: 'Miner', hp: 110, armor: 0.95, steps: 12, climb: 2,
      blurb: 'Sturdy. Can tunnel straight through hills to reach someone dug in.',
      shot1: { name: 'Pick Shell', ammo: -1, r: 4, dmg: 40, desc: 'Digs a wide crater.' },
      shot2: { name: 'Drill', ammo: 2, r: 4, dmg: 48, drill: 14, desc: 'Bores through up to 14 cells of ground, then explodes.' } },
    gale: { name: 'Gale', role: 'Wind-rider', hp: 95, armor: 1, steps: 16, climb: 2,
      blurb: 'Rides the wind. Her shots curve hard, and her Gust throws people into the water.',
      shot1: { name: 'Kite Bomb', ammo: -1, r: 4, dmg: 42, wind: 1.7, desc: 'Strong, but the wind pushes it a lot.' },
      shot2: { name: 'Gust Bomb', ammo: 2, r: 4.5, dmg: 24, wind: 1.7, knock: 2.6, desc: 'Weak blast, huge knockback.' } },
  };
  const CHAR_IDS = Object.keys(CHARS);
  const WEAPON_IDS = ['shot1', 'shot2', 'dud'];

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
      h -= 14 * Math.exp(-Math.pow((u - 0.5) / 0.08, 2)); // a valley in the middle between the two crews
      const top = Math.round(ROWS - h);
      for (let y = Math.max(0, top); y < ROWS; y++) T[y * COLS + x] = 1;
    }
    G.T = T;
    const caves = 3 + Math.floor(R(G) * 3); // caves and overhangs to bank shots off
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
  // opts.first: which team shoots first (0 or 1). opts.chars: the two teams' character ids (default Volt vs Volt).
  function newGame(seed, opts = {}) {
    const chars = [0, 1].map((t) => (opts.chars && CHARS[opts.chars[t]]) ? opts.chars[t] : 'volt');
    const G = {
      v: 2, seed: seed >>> 0, _s: (seed >>> 0) || 1, _id: 0,
      phase: 'aim', turn: 0, team: 0, teams: 2, unitIdx: [0, 0], chars,
      wind: 0, water: WATER0, moves: 0, weapon: 'shot1',
      T: null, units: [], proj: [], duds: [], fx: [],
      ammo: [], fused: false, winner: null,
      stats: { shots: 0, shot2: 0, lobs: 0, dudBlasts: 0, chains: 0, strikes: 0, drowned: 0, fallKOs: 0, selfDmg: [0, 0], dmg: [0, 0] },
    };
    genTerrain(G);
    for (let t = 0; t < G.teams; t++) { const C = CHARS[chars[t]]; G.ammo.push({ shot1: C.shot1.ammo, shot2: C.shot2.ammo, dud: DUD.ammo }); }
    const slots = [[0.1, 0.32], [0.68, 0.9]]; // two units a side, spread across each team's half
    for (let t = 0; t < G.teams; t++) for (let i = 0; i < UNITS_PER_TEAM; i++) {
      const [a, b] = slots[t]; const x = Math.round(COLS * (a + (b - a) * (i + 0.2 + R(G) * 0.6) / UNITS_PER_TEAM));
      const C = CHARS[chars[t]];
      G.units.push({ id: ++G._id, team: t, char: chars[t], x: x + 0.5, y: surfaceY(G, x), vx: 0, vy: 0, hp: C.hp, maxHp: C.hp, alive: true, air: false, face: t === 0 ? 1 : -1 });
    }
    // who shoots first (a best-of-3 alternates it, since going first is worth a few points)
    G.team = G.first = opts.first === 1 ? 1 : 0;
    G.moves = CHARS[chars[G.team]].steps;
    G.wind = rollWind(G);
    return G;
  }
  const rollWind = (G) => Math.round((R(G) * 2 - 1) * WIND_MAX * 10) / 10;
  const teamUnits = (G, t) => G.units.filter((u) => u.team === t && u.alive);
  function current(G) { const us = teamUnits(G, G.team); if (!us.length) return null; return us[G.unitIdx[G.team] % us.length]; }
  const center = (u) => [u.x, u.y - UNIT_R];
  const charOf = (G, t) => CHARS[G.chars[t]];
  // The full spec of a team's weapon: { name, r, dmg, wind, speed, ... } with defaults filled in.
  function shotSpec(G, team, w) {
    const s = w === 'dud' ? DUD : charOf(G, team)[w];
    return Object.assign({ wind: 1, speed: 1, knock: 1 }, s);
  }

  // ---------- flight ----------
  // angle in degrees, 0 = right, 90 = straight up. power 0..1.
  function launch(u, angle, power, speedMul = 1) {
    const a = angle * Math.PI / 180, s = clamp(power, 0.05, 1) * VMAX * speedMul;
    const [cx, cy] = center(u);
    const ox = Math.cos(a), oy = -Math.sin(a);
    return { x: cx + ox * (UNIT_R + 0.6), y: cy + oy * (UNIT_R + 0.6), vx: ox * s, vy: oy * s };
  }
  const subSteps = (p) => Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy) * TICK / 0.5));
  function unitHit(G, p, ignoreId) {
    for (const u of G.units) {
      if (!u.alive || u.id === ignoreId) continue;
      const [cx, cy] = center(u), dx = p.x - cx, dy = p.y - cy;
      if (dx * dx + dy * dy <= (UNIT_R + 0.3) * (UNIT_R + 0.3)) return u.id;
    }
    return 0;
  }
  // One sub-step for anything ballistic, including bounce and drill. Shared by the real game (real = true:
  // drills carve) and the bots' aim prediction (real = false: the ground is left alone, but the path is the same).
  // Returns null while flying, or 'ground' | 'unit' | 'water' | 'out' when it lands.
  function advance(G, p, dt, ignoreId, real) {
    const px = p.x, py = p.y;
    p.vx += G.wind * (p.wm == null ? 1 : p.wm) * dt; p.vy += GRAV * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < -4 || p.x > COLS + 4) return 'out';
    if (p.y >= G.water) return 'water';
    const hu = unitHit(G, p, ignoreId);
    if (hu) { p.hitUnit = hu; return 'unit'; }
    // Drill: from the first touch of ground it bores on for p.drill cells (ground or not), then explodes.
    // Counting distance, not solid cells, keeps the real path and the bots' prediction identical.
    if (p.drilled || (p.drill > 0 && solidAt(G, p.x, p.y))) {
      p.drilled = true; p.drill -= Math.hypot(p.x - px, p.y - py);
      if (real && solidAt(G, p.x, p.y)) carve(G, p.x, p.y, 1.3);
      return p.drill > 0 ? null : 'ground';
    }
    if (!solidAt(G, p.x, p.y)) return null;
    if (p.bounce > 0) { // bounce: off a wall sideways, otherwise off the floor
      p.bounce--;
      if (solidAt(G, p.x, py) && !solidAt(G, px, p.y)) { p.vx = -p.vx * 0.6; p.vy *= 0.8; } else { p.vy = -Math.abs(p.vy) * 0.55; p.vx *= 0.8; }
      p.x = px; p.y = py; p.bounced = true;
      return null;
    }
    return 'ground';
  }
  function newShot(G, u, w, angle, power, team) {
    const s = shotSpec(G, team, w);
    const p = Object.assign(launch(u, angle, power, s.speed), { id: ++G._id, w, team, from: u.id, age: 0, wm: s.wind });
    if (s.bounce) p.bounce = s.bounce;
    if (s.drill) p.drill = s.drill;
    if (w === 'dud') p.fuse = DUD.fuse;
    return p;
  }

  // ---------- blasts ----------
  function explode(G, x, y, r, dmg, byTeam, kind, knockMul = 1) {
    carve(G, x, y, r);
    const reach = r * DMG_SPREAD;
    for (const u of G.units) {
      if (!u.alive) continue;
      const [cx, cy] = center(u); const d = Math.hypot(cx - x, cy - y);
      if (d > reach) continue;
      const k = 1 - d / reach;
      hurt(G, u, Math.round(dmg * k * CHARS[u.char].armor), byTeam);
      const nx = d > 0.01 ? (cx - x) / d : 0, ny = d > 0.01 ? (cy - y) / d : -1;
      u.vx += nx * KNOCK * k * knockMul; u.vy += (ny - 0.6) * KNOCK * k * knockMul; u.air = true;
    }
    G.fx.push({ k: 'boom', x, y, r, kind });
    // live duds caught in a blast go off too: chain reactions
    for (const d of G.duds) if (!d.gone && Math.hypot(d.x - x, d.y - y) <= r + 1.5) d.chain = true;
    for (const p of G.proj) if (p.w === 'dud' && !p.gone && Math.hypot(p.x - x, p.y - y) <= r + 1.5) p.chain = true;
    // anything standing on carved ground may now fall
    for (const u of G.units) if (u.alive && !supported(G, u)) u.air = true;
    for (const d of G.duds) if (!d.gone && !solidAt(G, d.x, d.y + 0.6)) d.air = true;
  }
  function hurt(G, u, hit, byTeam) {
    if (hit <= 0 || !u.alive) return;
    u.hp -= hit;
    if (byTeam != null) { if (byTeam === u.team) G.stats.selfDmg[byTeam] += hit; else G.stats.dmg[byTeam] += hit; }
    if (u.hp <= 0) ko(G, u, 'blast');
  }
  // Thunderstrike: lightning straight down at x hits every unit within w cells sideways, whatever is above them.
  function strike(G, x, w, dmg, byTeam) {
    G.stats.strikes++;
    const hits = [];
    for (const u of G.units) {
      if (!u.alive || Math.abs(u.x - x) > w) continue;
      hurt(G, u, Math.round(dmg * CHARS[u.char].armor), byTeam); hits.push(u.id);
    }
    G.fx.push({ k: 'bolt', x, hits });
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
    for (const p of G.proj) {
      if (p.gone) continue;
      if (p.wait > 0) { p.wait--; continue; } // the second shot of a Double Tap
      if (p.chain) { p.gone = true; blowDud(G, p); continue; }
      const n = subSteps(p);
      for (let i = 0; i < n && !p.gone; i++) {
        const hit = advance(G, p, TICK / n, p.age < 6 ? p.from : -1, true);
        if (!hit) continue;
        p.gone = true;
        if (hit === 'water' || hit === 'out') { G.fx.push({ k: hit === 'water' ? 'splash' : 'lost', x: p.x, y: Math.min(p.y, G.water) }); break; }
        land(G, p);
      }
      p.age = (p.age || 0) + 1;
    }
    G.proj = G.proj.filter((p) => !p.gone);
    for (const d of G.duds) { // resting or falling duds
      if (d.gone) continue;
      if (d.chain || d.fuseOut) { if (d.chain) G.stats.chains++; blowDud(G, d); continue; }
      if (!d.air) continue;
      d.vy = (d.vy || 0) + GRAV * TICK; d.y += d.vy * TICK;
      if (d.y >= G.water) { d.gone = true; G.fx.push({ k: 'splash', x: d.x, y: G.water }); continue; }
      if (solidAt(G, d.x, d.y + 0.6)) { while (solidAt(G, d.x, d.y + 0.5) && d.y > 0) d.y -= 0.25; d.vy = 0; d.air = false; }
    }
    G.duds = G.duds.filter((d) => !d.gone);
    for (const u of G.units) if (u.alive && u.air) unitPhysics(G, u);
    if (!G.proj.length && !G.units.some((u) => u.alive && u.air) && !G.duds.some((d) => d.air || d.chain || d.fuseOut)) settle(G);
    return G.fx;
  }
  function land(G, p) {
    if (p.w === 'dud') { // back off out of the ground, then rest there ticking
      let x = p.x - p.vx * TICK * 0.5, y = p.y - p.vy * TICK * 0.5, g = 0;
      while (solidAt(G, x, y) && g++ < 40) y -= 0.25;
      const d = { id: p.dudId || ++G._id, x, y, fuse: p.fuse, team: p.team, air: !solidAt(G, x, y + 0.6), vy: 0 };
      G.duds.push(d); G.fx.push({ k: 'dud', id: d.id, x, y, fuse: d.fuse });
      return;
    }
    const s = shotSpec(G, p.team, p.w);
    explode(G, p.x, p.y, s.r, s.dmg, p.team, p.w === 'shot2' ? G.chars[p.team] : 'shot', s.knock);
    if (s.strike) strike(G, p.x, s.strike.w, s.strike.dmg, p.team);
  }
  function blowDud(G, d) { d.gone = true; G.stats.dudBlasts++; explode(G, d.x, d.y, DUD.r, DUD.dmg, null, 'dud'); }
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
    if (G.turn >= MAX_TURNS) { // a stalemate nobody can break: the side with more health left (as a share) wins
      const hp = [0, 1].map((t) => teamUnits(G, t).reduce((a, u) => a + u.hp / u.maxHp, 0));
      G.phase = 'over'; G.winner = hp[0] === hp[1] ? -1 : hp[0] > hp[1] ? 0 : 1; G.timeout = true; return;
    }
    G.phase = 'aim'; G.moves = charOf(G, G.team).steps; G.fused = false; G.weapon = 'shot1';
    G.wind = rollWind(G);
    G.fx.push({ k: 'turn', team: G.team, turn: G.turn });
  }

  // ---------- moving in the aim phase ----------
  function walk(G, u, dir) {
    const nx = u.x + dir, climb = CHARS[u.char].climb;
    if (nx < 0.5 || nx > COLS - 0.5) return false;
    let ny = u.y, k = 0; // climb up to `climb` cells, or step down
    while (solidAt(G, nx, ny - 0.01) && k <= climb) { ny -= 1; k++; }
    if (k > climb) return false;                       // a wall
    if (solidAt(G, nx, ny - UNIT_R * 2)) return false; // no headroom
    u.x = nx; u.y = ny; u.face = dir;
    if (!supported(G, u)) { u.air = true; u.vx = 0; u.vy = 0; dropNow(G, u); } // step off a ledge (fall damage counts)
    return true;
  }
  function dropNow(G, u) { let g = 0; while (u.alive && u.air && g++ < 600) unitPhysics(G, u); }

  // ---------- actions: the one way to change a game ----------
  //   { k: 'move', dir: -1|1 }                   walk one cell (the character's steps a turn)
  //   { k: 'weapon', w: 'shot1'|'shot2'|'dud' }  pick a shot
  //   { k: 'fire', angle, power }                 fire it (angle in degrees, 0 = right, 90 = up)
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
        if (!u.alive) G.phase = 'flight'; // walked into the water: end the turn
        return true;
      }
      case 'weapon': {
        if (WEAPON_IDS.indexOf(it.w) < 0 || G.ammo[G.team][it.w] === 0) return false;
        G.weapon = it.w; return true;
      }
      case 'fire': {
        if (!Number.isFinite(it.angle) || !Number.isFinite(it.power)) return false;
        const w = G.weapon, am = G.ammo[G.team];
        if (am[w] === 0) return false;
        if (am[w] > 0) am[w]--;
        const p = newShot(G, u, w, it.angle, it.power, G.team);
        G.proj.push(p); G.stats.shots++; if (w === 'shot2') G.stats.shot2++;
        if (shotSpec(G, G.team, w).double) { // Double Tap: a second dart a third of a second later
          const q = newShot(G, u, w, it.angle, it.power * 0.96, G.team); q.wait = 20; G.proj.push(q);
        }
        u.face = Math.cos(it.angle * Math.PI / 180) >= 0 ? 1 : -1;
        G.phase = 'flight'; return true;
      }
      case 'lob': {
        if (!Number.isFinite(it.angle) || !Number.isFinite(it.power)) return false;
        const d = G.duds.find((x) => x.id === it.dud && !x.air);
        if (!d || !canLob(G, u, d)) return false;
        G.duds = G.duds.filter((x) => x !== d);
        const p = Object.assign(launch(u, it.angle, Math.min(it.power, 1) * LOB_POWER), { id: ++G._id, w: 'dud', dudId: d.id, fuse: d.fuse, team: G.team, from: u.id, age: 0, wm: 1 });
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

  // ---------- aim prediction (the same advance() the game uses, without changing the ground) ----------
  function predict(G, u, angle, power, w = 'shot1', team = u.team, maxTicks = 900) {
    const s = shotSpec(G, team, w);
    const p = Object.assign(launch(u, angle, power, s.speed), { wm: s.wind, bounce: s.bounce || 0, drill: s.drill || 0 });
    let t = 0;
    while (t++ < maxTicks) {
      const n = subSteps(p);
      for (let i = 0; i < n; i++) { const hit = advance(G, p, TICK / n, t < 6 ? u.id : -1, false); if (hit) return { x: p.x, y: p.y, hit, t, unit: p.hitUnit || null }; }
    }
    return { x: p.x, y: p.y, hit: 'timeout', t };
  }
  // Same falloff as explode() (with armour), without changing anything.
  function blastScore(G, x, y, r, dmg, team) {
    const reach = r * DMG_SPREAD; let mine = 0, theirs = 0;
    for (const u of G.units) { if (!u.alive) continue; const [cx, cy] = center(u); const d = Math.hypot(cx - x, cy - y); if (d > reach) continue; const h = Math.min(u.hp, dmg * (1 - d / reach) * CHARS[u.char].armor); if (u.team === team) mine += h; else theirs += h; }
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

  // Score a landing spot for `team` with weapon w (from the bot's point of view).
  function scoreLanding(G, land, w, team, fuse) {
    if (land.hit === 'water' || land.hit === 'out' || land.hit === 'timeout') return -1;
    if (w === 'dud') { // a dud is a threat over time, minus the risk it gets lobbed back
      const s = blastScore(G, land.x, land.y, DUD.r, DUD.dmg, team);
      const sure = fuse <= 1 ? 1 : fuse === 2 ? 0.55 : 0.4;
      return sure * s.theirs - 1.4 * s.mine;
    }
    const S = shotSpec(G, team, w);
    const s = blastScore(G, land.x, land.y, S.r, S.dmg, team);
    let sc = s.theirs - 1.4 * s.mine;
    if (S.double) sc *= 1.8;
    if (S.strike) for (const u of G.units) if (u.alive && Math.abs(u.x - land.x) <= S.strike.w) sc += (u.team === team ? -1.4 : 1) * Math.min(u.hp, S.strike.dmg * CHARS[u.char].armor);
    if (S.knock > 1) for (const u of G.units) { // a big push near the water or a cliff is worth a lot
      if (!u.alive) continue; const [cx, cy] = center(u); if (Math.hypot(cx - land.x, cy - land.y) > S.r * DMG_SPREAD) continue;
      if (G.water - u.y < 14 || u.x < 10 || u.x > COLS - 10) sc += (u.team === team ? -1.4 : 1) * 0.6 * u.hp;
    }
    if (land.unit && G.units.find((x) => x.id === land.unit).team !== team) sc += 4;
    return sc;
  }
  function bestShot(G, u, w, st, rnd, fuse, powerCap = 1) {
    const enemies = G.units.filter((x) => x.alive && x.team !== u.team);
    let best = { score: -Infinity };
    const tryOne = (angle, power) => {
      power = clamp(power, 0.1, 1) * powerCap;
      const land = predict(G, u, angle, power, w);
      const sc = scoreLanding(G, land, w, u.team, fuse);
      if (sc > best.score) best = { score: sc, angle, power: power / powerCap };
    };
    for (let i = 0; i < st.tries; i++) {
      const e = enemies[Math.floor(rnd() * enemies.length)] || enemies[0];
      const right = !e || e.x >= u.x;
      tryOne(right ? 10 + rnd() * 75 : 95 + rnd() * 75, 0.3 + rnd() * 0.7);
    }
    for (let i = 0; i < st.refine && best.angle != null; i++) tryOne(best.angle + gauss(rnd) * 4, best.power + gauss(rnd) * 0.06);
    return best;
  }
  // One full bot turn: sends its intents through act() and returns them.
  function botTurn(G, style) {
    const st = STYLES[style] || STYLES.smart, rnd = botRng(G), u = current(G); if (!u) return [];
    const sent = [];
    const send = (it) => { if (act(G, it)) sent.push(it); return G.phase; };
    if (st.dodge) { // a live dud about to blow next to us and nothing to lob it with: walk away from it
      const near = G.duds.find((d) => d.fuse <= 1 && Math.hypot(d.x - u.x, d.y - u.y) < DUD.r * DMG_SPREAD);
      if (near && !(st.lob && canLob(G, u, near))) { const dir = u.x < near.x ? -1 : 1; for (let i = 0; i < 30 && G.phase === 'aim'; i++) if (!act(G, { k: 'move', dir })) break; else sent.push({ k: 'move', dir }); }
      if (G.phase !== 'aim') return sent;
    }
    const opts = [];
    const s1 = bestShot(G, u, 'shot1', st, rnd, 0); opts.push({ w: 'shot1', ...s1 });
    if (G.ammo[u.team].shot2 !== 0) { const c = bestShot(G, u, 'shot2', st, rnd, 0); opts.push({ w: 'shot2', ...c, score: c.score * 1.05 }); }
    if (st.dud && G.ammo[u.team].dud !== 0) { const d = bestShot(G, u, 'dud', st, rnd, DUD.fuse); opts.push({ w: 'dud', ...d, score: d.score * st.dud }); }
    if (st.lob) for (const d of lobbable(G)) {
      const b = bestShot(G, u, 'dud', st, rnd, d.fuse - 1 <= 0 ? 1 : d.fuse, LOB_POWER);
      const here = blastScore(G, d.x, d.y, DUD.r, DUD.dmg, u.team); // getting a dud away from our own units is worth something
      opts.push({ lob: d.id, ...b, score: b.score + here.mine * (d.fuse <= 1 ? 1.2 : 0.5) });
    }
    opts.sort((a, b) => b.score - a.score);
    const o = opts[0];
    if (!o || o.angle == null) { send({ k: 'pass' }); return sent; }
    const angle = o.angle + gauss(rnd) * st.noiseA, power = clamp(o.power + gauss(rnd) * st.noiseP, 0.05, 1);
    if (o.lob) send({ k: 'lob', dud: o.lob, angle, power });
    else { if (o.w !== 'shot1') send({ k: 'weapon', w: o.w }); send({ k: 'fire', angle, power }); }
    if (G.phase === 'aim') send({ k: 'pass' });
    return sent;
  }

  // Play a whole match with one bot style per team. Returns the finished game and its intent log.
  function playOut(G, styles) {
    const log = []; let guard = 0;
    while (G.phase !== 'over' && guard++ < MAX_TURNS + 5) {
      const its = botTurn(G, styles[G.team]); log.push(...its);
      resolve(G);
    }
    if (G.phase !== 'over') throw new Error('match did not finish');
    return { G, log };
  }

  // ---------- checksum and replay ----------
  function hash(G) {
    const r = (v) => Math.round(v * 100);
    const parts = [G.turn, G.team, G.phase, r(G.wind), G.water, G.moves, G.winner, G.chars.join(','),
      G.units.map((u) => `${u.id}:${r(u.x)},${r(u.y)},${u.hp},${u.alive ? 1 : 0}`).join(';'),
      G.duds.map((d) => `${d.id}:${r(d.x)},${r(d.y)},${d.fuse}`).join(';'),
      G.ammo.map((a) => `${a.shot2},${a.dud}`).join(';'), G.T.join('')];
    let h = 2166136261; const s = parts.join('|');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(16);
  }
  // Replay: same seed + options + intents = same game.
  function replay(seed, log, opts) {
    const G = newGame(seed, opts);
    for (const it of log) { if (G.phase === 'flight') resolve(G); if (!act(G, it)) throw new Error('replay: intent refused ' + JSON.stringify(it)); }
    if (G.phase === 'flight') resolve(G);
    return G;
  }

  const WB = { TICK, COLS, ROWS, WATER0, GRAV, VMAX, WIND_MAX, UNIT_R, UNITS_PER_TEAM, HP, MOVE_STEPS, LOB_RANGE, LOB_POWER, SUDDEN_TURN, MAX_TURNS, DMG_SPREAD,
    DUD, CHARS, CHAR_IDS, WEAPON_IDS, STYLES, newGame, act, step, resolve, current, teamUnits, charOf, shotSpec, solidAt, surfaceY, center, lobbable, canLob,
    predict, blastScore, botTurn, playOut, hash, replay };
  if (typeof module !== 'undefined' && module.exports) module.exports = WB; else root.WB = WB;
})(typeof window !== 'undefined' ? window : globalThis);
