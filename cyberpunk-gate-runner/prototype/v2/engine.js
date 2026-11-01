/* Cyberpunk Gate Runner, Prototype 2: pure engine (no DOM). window.GR in the browser, module.exports in node.
   Levels come from data: LEVELS holds the hand-tuned streets and levelDef(n) scales past them. Everything is placed on
   the beat grid, so gates, enemies and the boss arrive on the music. newGame() sets the tempo and song shape for its level,
   so run one game at a time. Every player action goes through act(G, intent); hash(G) checksums a run.
   © 2026 justaskjoe. All rights reserved. */
(function (root) {
  const DT = 1 / 60, DROP_BAR = 20;   // every street reaches the drop on bar 20; what follows comes from its level
  let BPM = 122, B = 60 / BPM, BAR = 4 * B, SEC = [], END = 0, DROP_T = 0, DROP_END = 0, BOSS_RANGE = 0;
  const RANGE = 1.7;            // seconds ahead the squad can shoot (BOSS_RANGE is the boss fight, set per level)
  const AIM = 0.22;             // aim cone half-width (road units, road is -1..1)
  const SPEED = 2.6;            // squad steer speed (road units / s)
  const KIND = {
    swarm: { hp: 8, bite: 1, w: 0.05, credits: 1 },
    drone: { hp: 12, bite: 3, w: 0.11, credits: 1 },
    biker: { hp: 110, bite: 9, w: 0.14, credits: 3, drift: 0.32 },
    crate: { hp: 30, bite: 0, w: 0.13, credits: 10 },
    pod: { hp: 1, bite: 0, w: 0.08, credits: 5, far: true },
    boss: { hp: 24500, bite: 0, w: 0.42, credits: 60, far: true }
  };

  // ================= the level table: add a street here and most of the game follows =================
  // start [min, max]: the carried squad is clamped to this, so a great clear can't snowball and a poor one can't brick the next level.
  // gates scale the gate pools, hp / bite / dens scale the street, walls is [bar, rows, across], boss is the fight (see BOSS), fight is its length
  // in bars and drop the length of the drop. pal and track name a look in render.js and a song in ui.js.
  const W0 = [[5, 4, 6], [7, 4, 7], [9, 6, 8], [11, 6, 9], [13, 8, 10], [15, 8, 11], [17, 10, 12], [19, 12, 13]];   // the road up to the drop
  const LEVELS = [
    { name: 'Night Market', bpm: 122, track: 'neon', pal: 'market', start: [3, 3], wlvCap: 2, fight: 4, drop: 8,
      gates: { add: 0.4, mul: 1.25, trade: 1.5 }, hp: 0.5, bite: 0.6, dens: 0.8, walls: W0.concat([[20, 22, 18], [22, 22, 18]]),
      boss: { id: 'enforcer', hp: 8750, contact: 60, loss: 0.15, slams: [1, 2, 3] } },
    { name: 'Signal Yards', bpm: 124, track: 'yards', pal: 'yards', start: [32, 40], wlvCap: 3, fight: 6, drop: 10,
      gates: { add: 0.5, mul: 1.25, trade: 1.5 }, hp: 0.8, bite: 0.8, dens: 0.9, walls: W0.concat([[20, 18, 16], [22, 18, 16], [24, 18, 16]]),
      boss: { id: 'carrier', hp: 37500, contact: 60, podHp: 900, open: 2, dive: 3 } },
    { name: 'Glass Canyon', bpm: 120, track: 'glass', pal: 'glass', start: [48, 60], wlvCap: 4, fight: 8, drop: 12,
      gates: { add: 0.6, mul: 1.3, trade: 1.6 }, hp: 1.1, bite: 1, dens: 1, walls: W0.concat([[20, 16, 16], [22, 16, 16], [24, 16, 16], [26, 16, 16]]),
      boss: { id: 'warden', hp: 108000, contact: 60, every: 2, warn: 0.5, reflect: 0.03 } },
    { name: 'Static District', bpm: 118, track: 'static', pal: 'static', start: [64, 80], wlvCap: 5, fight: 10, drop: 14,
      gates: { add: 0.7, mul: 1.3, trade: 1.6 }, hp: 1.4, bite: 1.2, dens: 1, walls: W0.concat([[20, 14, 16], [22, 14, 16], [24, 14, 16], [26, 14, 16], [28, 14, 16]]),
      boss: { id: 'echo', hp: 205000, contact: 60, every: 2, loss: 0.14, w: 0.14 } },
    { name: 'The Conservatory', bpm: 124, track: 'conserv', pal: 'conserv', start: [80, 100], wlvCap: 6, fight: 12, drop: 16,
      gates: { add: 0.8, mul: 1.35, trade: 1.7 }, hp: 1.8, bite: 1.4, dens: 1.05, walls: W0.concat([[20, 14, 16], [22, 14, 16], [24, 14, 16], [26, 14, 16], [28, 14, 16], [30, 14, 16]]),
      boss: { id: 'vale', hp: 171000, contact: 60, armor: 3, rearmor: 2, open: 3, loss: 0.14 } }
  ];
  const MAX_LEVEL = 5;   // the last street the game offers. levelDef() already makes streets past the table: raise this to open them
  // past the table the streets cycle: same boss, look and song order, a key shift, and every number scaled by how far past the table you are
  function levelDef(n) {
    const i = n - 1; if (i < LEVELS.length) return Object.assign({ n }, LEVELS[i]);
    const N = LEVELS.length, top = LEVELS[N - 1], base = LEVELS[i % N], k = n - N, up = Math.pow(1.16, k), lap = Math.floor(i / N) + 1, ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return Object.assign({}, base, { n, name: base.name + ' ' + (ROMAN[lap] || lap), transpose: (k * 2) % 7, start: top.start.map(v => Math.round(v * Math.pow(1.1, k))), wlvCap: top.wlvCap + k,
      gates: top.gates, hp: top.hp * up, bite: Math.min(3, top.bite * Math.pow(1.05, k)), boss: Object.assign({}, base.boss, { hp: top.boss.hp * Math.pow(1.2, k), podHp: base.boss.podHp ? base.boss.podHp * up : undefined }) });
  }
  function setLevel(def) {
    BPM = def.bpm; B = 60 / BPM; BAR = 4 * B; const db = DROP_BAR, de = db + def.drop;
    SEC = [{ id: 'intro', name: def.name, hint: 'Slide to grab runners', b0: 0, b1: 4 }, { id: 'build', name: 'The build', hint: 'Steer left or right of the line to pick a gate', b0: 4, b1: 12 },
      { id: 'riser', name: 'The riser', hint: 'Every gate fills Overclock: more damage at the drop', b0: 12, b1: db }, { id: 'drop', name: 'THE DROP', hint: BOSS[def.boss.id].tip, b0: db, b1: de }, { id: 'outro', name: 'Cash out', hint: 'Street cleared', b0: de, b1: de + 3 }];
    END = (de + 3) * BAR; DROP_T = db * BAR; DROP_END = de * BAR; BOSS_RANGE = def.fight * BAR;
    Object.assign(GR, { BPM, B, BAR, SEC, END, DROP_T, DROP_END, BOSS_RANGE, level: def });
  }

  // ================= the bosses: one script each. setup places its attacks on the beat grid, tick runs every step, hit decides what a shot does =================
  // every boss is learned by reading something on the road. A hazard is an entity with a warning: x0..x1 is the part of the road it covers
  const sideOf = G => G.sx < 0 ? -1 : 1;
  const hurt = (G, frac, type) => { const lost = Math.max(1, Math.ceil(G.n * frac)); G.n = Math.max(0, G.n - lost); G.ev.push({ type: type || 'hurt', t: G.t, lost, x: G.sx }); };
  const BOSS = {
    // dodge: a fist comes down on one half of the road, and that half glows first
    enforcer: { name: 'HUSH ENFORCER', tip: 'Dodge the glowing side. Melt the boss', lose: 'Step off the glowing side before the fist lands, and build Overclock for the drop.', win: 'The Enforcer melted on the drop.',
      setup(S, b) { for (const k of b.slams) { const s = S.r() < 0.5 ? -1 : 1; S.add('haz', S.at(DROP_BAR + k, 0), 0, { x0: s < 0 ? -1 : 0, x1: s < 0 ? 0 : 1, warn: 1.1, loss: b.loss, style: 'slam' }); } } },
    // target priority: the core can't be hurt until both pods are down, and the pods grow back
    carrier: { name: 'MUTE CARRIER', tip: 'Shoot both speaker pods to open the core', lose: 'The core is armored. Steer left and right to shoot both pods, then hit the middle while it\'s open.', win: 'The Carrier fell out of the sky.',
      setup(S, b, e) {
        for (const s of [-1, 1]) S.add('pod', e.ta, s * 0.72, { hp: b.podHp, maxHp: b.podHp, w: 0.08 });
        for (let k = 1; k < S.def.fight; k += 1) for (let i = 0; i < b.dive; i++) S.add('drone', S.at(DROP_BAR + k, i), S.r() * 1.2 - 0.6, { hunt: 0.5 });
      },
      init(G, st, e) { st.pods = G.ents.filter(q => q.kind === 'pod'); st.open = false; e.armor = true; },
      tick(G, b, e, st) {
        if (st.open) { if (G.t >= st.until) { st.open = false; e.armor = true; for (const p of st.pods) { p.done = false; p.hp = p.maxHp; } G.ev.push({ type: 'armor', t: G.t, on: true }); } }
        else if (st.pods.every(p => p.done)) { st.open = true; st.until = G.t + b.open * BAR; e.armor = false; G.ev.push({ type: 'armor', t: G.t, on: false }); }
      } },
    // positioning under fire: shots into the mirror come back at you, and it changes sides
    warden: { name: 'MIRROR WARDEN', tip: 'Stay off the mirror side. Shots bounce back', lose: 'Shots that hit the mirror come back at your squad. Stay on the side with no mirror and move when it flashes.', win: 'The mirror shattered.',
      init(G, st) { st.side = 1; st.next = DROP_T + G.def.boss.every * BAR; st.warn = false; },
      tick(G, b, e, st) {
        const every = (e.hp < e.maxHp * 0.4 ? Math.max(1, b.every - 1) : b.every) * BAR;
        st.warn = G.t >= st.next - b.warn * BAR;
        if (G.t >= st.next) { st.side = -st.side; st.next += every; st.warn = false; G.ev.push({ type: 'swap', t: G.t, side: st.side }); }
      },
      hit(G, b, e, st) { if (sideOf(G) !== st.side) return true; hurt(G, b.reflect, 'reflect'); return false; } },
    // find the real one: three holograms shuffle, only one takes damage, and the fakes send shockwaves down their lanes
    echo: { name: 'ECHO', tip: 'Three Echoes. Hit the one pulsing on the kick', lose: 'Only the Echo pulsing on the kick is real. Line up with it, because the other two send shockwaves down their lanes.', win: 'The real Echo went quiet.',
      setup(S, b, e) {
        const X = [-0.62, 0, 0.62], every = b.every; let cur = 1; e.lanes = X; e.seq = [];
        for (let k = 0; k * every < S.def.fight + every; k++) {
          cur = (cur + 1 + Math.floor(S.r() * 2)) % 3; e.seq.push(cur);
          if (k * every + 1 < S.def.fight) for (let l = 0; l < 3; l++) if (l !== cur) S.add('haz', S.at(DROP_BAR + k * every + 1, 0), 0, { x0: X[l] - 0.3, x1: X[l] + 0.3, warn: 1.1, loss: b.loss, style: 'wave' });
        }
      },
      init(G, st, e) { st.real = e.seq[0]; e.x = e.lanes[st.real]; e.w = G.def.boss.w; },
      tick(G, b, e, st) { const i = Math.min(e.seq.length - 1, Math.floor((G.t - DROP_T) / (b.every * BAR))), r = e.seq[Math.max(0, i)]; if (r !== st.real) { st.real = r; e.x = e.lanes[r]; G.ev.push({ type: 'shuffle', t: G.t }); } } },
    // run into the attack: only gold orbs crack the armor, red ones hurt, and a silence beam stops your squad firing
    vale: { name: 'DIRECTOR VALE', tip: 'Catch gold orbs to crack the armor. Dodge red', lose: 'Vale can\'t be hurt until the armor cracks. Run into gold orbs, dodge red ones, and stay out of the silence beam.', win: 'Vale lost the room.',
      setup(S, b) {
        for (let k = 1; k < S.def.fight; k++) {
          const s = S.r() < 0.5 ? -1 : 1, x = 0.3 + S.r() * 0.3;
          S.add('orb', S.at(DROP_BAR + k, 2), s * x, { gold: true, w: 0.14 }); S.add('orb', S.at(DROP_BAR + k, 2), -s * x, { gold: false, w: 0.14, loss: b.loss });
          if (k % 3 === 2) { const c = S.r() < 0.5 ? -1 : 1; S.add('haz', S.at(DROP_BAR + k, 0), 0, { x0: c < 0 ? -1 : 0, x1: c < 0 ? 0 : 1, warn: 1.1, dur: BAR * 0.75, style: 'beam' }); }
        }
      },
      init(G, st, e) { st.armor = G.def.boss.armor; st.max = st.armor; e.armor = true; },
      tick(G, b, e, st) { if (!e.armor && G.t >= st.until) { e.armor = true; st.armor = b.rearmor; st.max = b.rearmor; G.ev.push({ type: 'armor', t: G.t, on: true }); } }
    }
  };
  // one gate every 2 bars from bar 4 to 18. Each run deals the slots from these pools (seeded), so two different kinds
  // always face each other: +N beats x1.5 while the squad is small, fire rate beats both once it's big, Overclock trades
  // growth for the drop, and a trade costs runners now for double later. The weapon and upgrade forks stay on bars 10 and 16.
  const POOLS = {
    early: [{ op: 'add', v: 6 }, { op: 'add', v: 8 }, { op: 'add', v: 10 }, { op: 'mul', v: 1.5 }, { op: 'rate', v: 0.25 }],
    mid: [{ op: 'add', v: 15 }, { op: 'add', v: 20 }, { op: 'mul', v: 1.5 }, { op: 'rate', v: 0.25 }, { op: 'oc', v: 30 }, { op: 'trade', lose: 6, v: 2 }],
    late: [{ op: 'add', v: 30 }, { op: 'add', v: 40 }, { op: 'mul', v: 1.5 }, { op: 'rate', v: 0.25 }, { op: 'rate', v: 0.5 }, { op: 'oc', v: 30 }, { op: 'trade', lose: 10, v: 2 }]
  };
  const SLOTS = ['early', 'early', 'mid', 'weapon', 'mid', 'late', 'mod', 'late'];
  function dealGates(r, def) {
    const scale = g => g.op === 'add' ? Object.assign({}, g, { v: Math.max(1, Math.round(g.v * def.gates.add)) }) : g.op === 'mul' ? Object.assign({}, g, { v: def.gates.mul }) : g.op === 'trade' ? Object.assign({}, g, { lose: Math.max(1, Math.round(g.lose * def.gates.add)), v: def.gates.trade }) : g;
    return SLOTS.map(s => {
      if (s === 'weapon') return [{ op: 'weapon' }, { op: 'weapon' }];         // your one gun choice this run
      if (s === 'mod') return [{ op: 'mod', k: 0 }, { op: 'mod', k: 1 }];      // two ways to build that gun
      const P = POOLS[s].map(scale), grow = P.filter(g => g.op === 'add' || g.op === 'mul'), a = grow[Math.floor(r() * grow.length)], rest = P.filter(g => g.op !== a.op);
      return [a, rest[Math.floor(r() * rest.length)]];   // one side always grows the squad, so no deal is a dud
    });
  }
  // mult scales damage. aim widens or narrows the cone, pierce hits a line of targets at full damage,
  // splash hits neighbours of each target. val is how much the bots value the extras.
  const WEAPONS = {
    pulse: { name: 'Pulse rifle', short: 'Pulse', mult: 1, aim: 0, val: 1, col: '#3DF0FF', tip: '', mods: [{ name: 'Hot Rounds', mult: 0.3, tip: 'Hot Rounds: more damage' }, { name: 'Long Barrel', aim: 0.1, tip: 'Long Barrel: a wider stream' }] },
    arc: { name: 'Arc gun', short: 'Arc', mult: 1.5, aim: 0, val: 1, col: '#8B5CFF', note: 'heavy, tight stream', tip: 'Arc gun: heavy damage, tight stream', mods: [{ name: 'Overcharge', mult: 0.45, note: 'far more damage', tip: 'Overcharge: far more damage' }, { name: 'Forked', mult: 0.25, aim: 0.1, note: 'arcs spread wider', tip: 'Forked: the arc spreads wider' }] },
    scatter: { name: 'Scatter', short: 'Scatter', mult: 1.35, aim: 0.24, val: 1.15, col: '#4BFFA5', note: 'wide cone', tip: 'Scatter: a wide cone, less aiming', mods: [{ name: 'Buckshot', mult: 0.4, note: 'harder blasts', tip: 'Buckshot: more damage per blast' }, { name: 'Wide Choke', mult: 0.3, aim: 0.14, note: 'covers the road', tip: 'Wide Choke: covers most of the road' }] },
    rail: { name: 'Railgun', short: 'Rail', mult: 1.45, aim: 0.04, pierce: 24, val: 1.05, col: '#F2EFE6', note: 'pierces a line', tip: 'Railgun: pierces a whole line', mods: [{ name: 'Capacitor', mult: 0.4, note: 'harder hits', tip: 'Capacitor: harder hits' }, { name: 'Overpierce', mult: 0.2, pierce: 24, aim: 0.03, note: 'twice the targets', tip: 'Overpierce: twice as many targets' }] },
    rocket: { name: 'Rockets', short: 'Rockets', mult: 1.5, aim: 0, splash: 0.5, radius: 0.35, val: 1.1, col: '#FFB547', note: 'splash blasts', tip: 'Rockets: blasts hit nearby enemies', mods: [{ name: 'Warheads', mult: 0.3, splash: 0.35, note: 'stronger blast', tip: 'Warheads: bigger blast damage' }, { name: 'Cluster', mult: 0.25, radius: 0.25, note: 'wider blast', tip: 'Cluster: a wider blast' }] }
  };
  const FINDS = ['arc', 'scatter', 'rail', 'rocket'], POWER = 0.3; // each weapon level adds 30% damage
  // a gun with its upgrade applied
  function gun(w, k) { const W = Object.assign({}, WEAPONS[w]), m = W.mods[k]; if (m) for (const f of ['mult', 'aim', 'pierce', 'splash', 'radius']) if (m[f]) W[f] = (W[f] || 0) + m[f]; return W; }
  const CHARGE = 10;            // Overclock % from any gate; charge gates add more, trades add none

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }

  function buildStreet(r, def, ld) {
    const E = []; let id = 0;
    const at = (bar, beat) => (bar * 4 + beat) * B;
    const add = (kind, ta, x, extra) => { const hp = KIND[kind] ? KIND[kind].hp * def.hp : 0, e = Object.assign({ id: id++, kind, ta, x, done: false }, KIND[kind] ? { hp, maxHp: hp, w: KIND[kind].w } : {}, extra); E.push(e); return e; };
    // intro: +1 runners zigzag on the beat (lesson 1: steer)
    const zz = [-0.5, 0, 0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0];
    for (let i = 0; i < 10; i++) add('runner', at(1, 0) + i * B, zz[i], { w: 0.1 });
    // gates on the downbeat every 2 bars
    // once you carry a gun, the fork is keep it or switch, and guns you've owned come back with their upgrade
    const offer = FINDS.slice().sort(() => r() - 0.5).filter(w => w !== ld.weapon); let oi = 0;
    dealGates(r, def).forEach((pair, i) => { const keep = ld.weapon !== 'pulse', sw = r() < 0.5, opts = pair.map((g, k) => g.op !== 'weapon' ? g : keep && k === 0 ? { op: 'weapon', w: ld.weapon, keep: true } : { op: 'weapon', w: offer[oi++ % offer.length] }); add('gate', at(4 + i * 2, 0), 0, { L: sw ? opts[1] : opts[0], R: sw ? opts[0] : opts[1] }); });
    // horde walls fill the road on the odd bars, between gates. You carve a path; whatever's left reaches you.
    const wall = (bar, rows, across) => {
      for (let i = 0; i < rows; i++) for (let k = 0; k < across; k++) add('swarm', at(bar, 0) + i * 0.085, -0.92 + 1.84 * (k + 0.5) / across + (r() - 0.5) * 0.08);
    };
    for (const [bar, rows, across] of def.walls) wall(bar, Math.max(1, Math.round(rows * def.dens)), across);
    // a few tough drones lead each wall
    for (let bar = 5; bar < 20; bar += 2) for (let k = 0; k < 2; k++) add('drone', at(bar, 2) + k * B / 2, r() * 1.4 - 0.7);
    // weapon crate (shoot it open) and bikers in the riser
    add('crate', at(13, 2), r() < 0.5 ? -0.55 : 0.55);
    for (const bar of [14, 15, 16, 17, 18, 19]) add('biker', at(bar, 3), r() * 1.4 - 0.7);
    // the boss appears on the drop and reaches you when the fight runs out
    const S = { at, add, r, def }, b = def.boss, e = add('boss', at(DROP_BAR + def.fight, 0), 0, { hp: b.hp, maxHp: b.hp, boss: b.id });
    if (BOSS[b.id].setup) BOSS[b.id].setup(S, b, e);
    return E.sort((a, b) => a.ta - b.ta || a.id - b.id);
  }

  function newGame(o) {
    o = o || {};
    const def = o.def || levelDef(o.level || 1), ld = enter(def, o.loadout); setLevel(def);
    const r = rng(o.seed || 1), ents = buildStreet(r, def, ld), boss = ents.find(e => e.kind === 'boss');
    const G = { seed: o.seed || 1, def, t: 0, tick: 0, n: ld.n, sx: 0, tx: 0, rate: 1, weapon: ld.weapon, mod: ld.mod, wlv: ld.wlv, owned: Object.assign({}, ld.owned),
      meter: 0, oc: { on: false, done: false, mult: 1 }, ents, ei: 0, nextVolley: B / 2, live: [], silenced: false,
      kills: 0, crates: 0, boss, st: {}, bossKilled: false, gatesGood: 0, gatesBad: 0, peak: ld.n,
      over: false, won: false, ev: [], log: [] };
    if (BOSS[def.boss.id].init) BOSS[def.boss.id].init(G, G.st, boss);
    return G;
  }
  // what a run hands to the next level, and how a level takes it
  function carryOut(G) { const owned = Object.assign({}, G.owned); if (G.weapon !== 'pulse') owned[G.weapon] = G.mod; return { n: G.n, weapon: G.weapon, mod: G.mod, wlv: G.wlv, owned }; }
  function enter(def, ld) {
    ld = ld || {}; const [lo, hi] = def.start;
    return { n: Math.max(lo, Math.min(hi, ld.n || 0)), weapon: WEAPONS[ld.weapon] ? ld.weapon : 'pulse', mod: ld.mod == null ? -1 : ld.mod, wlv: Math.max(1, Math.min(def.wlvCap, ld.wlv || 1)), owned: ld.owned || {} };
  }
  const width = n => Math.min(0.42, 0.08 + Math.sqrt(Math.max(1, n)) * 0.03);
  const sectionAt = t => { const bar = t / BAR; for (const s of SEC) if (bar < s.b1) return s; return SEC[SEC.length - 1]; };
  const z = (G, e) => e.ta - G.t;

  // the one action path
  function act(G, it) {
    G.log.push([G.tick, it.type, it.x]);
    if (it.type === 'steer') G.tx = Math.max(-0.9, Math.min(0.9, +it.x || 0));
  }

  // what a gate would do, without doing it (the UI shows this as a preview too)
  function gateResult(G, g) {
    let n = G.n, rate = G.rate, c = CHARGE, weapon = G.weapon, wlv = G.wlv, mod = G.mod;
    if (g.op === 'add') n += g.v; else if (g.op === 'mul') n = Math.floor(n * g.v); else if (g.op === 'rate') rate += g.v;
    else if (g.op === 'oc') c = g.v; else if (g.op === 'trade') { n = Math.floor(Math.max(0, n - g.lose) * g.v); c = 0; }
    else if (g.op === 'weapon') { weapon = g.w; mod = G.owned[g.w] == null ? (g.w === G.weapon ? G.mod : -1) : G.owned[g.w]; } else if (g.op === 'mod') mod = g.k;
    return { n, rate, weapon, wlv, mod, meter: Math.min(100, G.meter + c) };
  }
  function applyGate(G, g) {
    const n0 = G.n, r = gateResult(G, g), good = g.op !== 'trade';
    if (g.op === 'weapon' && G.weapon !== 'pulse') G.owned[G.weapon] = G.mod;
    G.n = r.n; G.rate = r.rate; G.weapon = r.weapon; G.mod = r.mod; if (G.t < DROP_T) G.meter = r.meter;
    if (good) G.gatesGood++; else G.gatesBad++;
    G.ev.push({ type: 'gate', t: G.t, g, good, n0, n: G.n });
    if (g.op === 'weapon' || g.op === 'mod') G.ev.push({ type: 'weapon', t: G.t, w: G.weapon, lv: G.wlv, mod: g.op === 'mod' ? g.k : -1, pick: g.op === 'weapon', keep: g.keep });
  }

  function volley(G) {
    if (G.silenced) { G.ev.push({ type: 'volley', t: G.t, hits: [] }); return; }
    const W = gun(G.weapon, G.mod), sx = G.sx, aimW = AIM + W.aim + width(G.n) * 0.5;
    let pool = G.n * G.rate * W.mult * (1 + POWER * (G.wlv - 1)) * (G.oc.on ? G.oc.mult : 1), pierced = 0;
    const tg = [];
    for (let i = G.ei; i < G.ents.length; i++) { const e = G.ents[i], dz = e.ta - G.t; if (dz >= BOSS_RANGE) break; if (!(KIND[e.kind] && KIND[e.kind].far) && dz >= RANGE) continue; if (!e.done && e.hp > 0 && KIND[e.kind] && dz > 0 && Math.abs(e.x - sx) < aimW + e.w) tg.push(e); }
    if (W.pierce) tg.sort((p, q) => (q.kind === 'boss') - (p.kind === 'boss')); // a rail shot goes through the horde to the boss
    const hits = [];
    for (const e of tg) {
      if (pool <= 0) break;
      if (e.hp <= 0) continue; // already caught in a blast this volley
      if (e.kind === 'boss') {
        if (e.armor) { hits.push(e.id); G.ev.push({ type: 'blocked', t: G.t }); continue; }
        const H = BOSS[e.boss].hit; if (H && !H(G, G.def.boss, e, G.st)) continue;
      }
      const d = Math.min(pool, e.hp); e.hp -= d; hits.push(e.id);
      if (W.pierce) { if (++pierced >= W.pierce) pool = 0; } else pool -= d;
      if (W.splash) for (const o of tg) if (o !== e && o.hp > 0 && Math.abs(o.x - e.x) < W.radius && Math.abs(o.ta - e.ta) < 0.4) { o.hp -= d * W.splash; if (o.hp <= 0) kill(G, o); }
      if (e.hp <= 0) kill(G, e);
    }
    G.ev.push({ type: 'volley', t: G.t, hits });
  }
  function kill(G, e) {
    e.done = true; e.hp = 0;
    if (e.kind === 'crate') { G.crates++; G.wlv++; G.ev.push({ type: 'weapon', t: G.t, w: G.weapon, lv: G.wlv, mod: -1, x: e.x }); }
    else if (e.kind === 'boss') { G.bossKilled = true; G.live = []; G.silenced = false; G.ev.push({ type: 'bossDown', t: G.t }); }
    else if (e.kind === 'pod') { G.ev.push({ type: 'pod', t: G.t, x: e.x }); }
    else G.kills++;
    G.ev.push({ type: 'kill', t: G.t, kind: e.kind, x: e.x, id: e.id });
  }

  function arrive(G, e) {
    e.done = true;
    const w = width(G.n), hitX = Math.abs(e.x - G.sx) < w + (e.w || 0.08);
    if (e.kind === 'runner') { if (hitX) { G.n += 1; G.ev.push({ type: 'runner', t: G.t, x: e.x }); } return; }
    if (e.kind === 'gate') { applyGate(G, G.sx < 0 ? e.L : e.R); return; }
    if (e.kind === 'crate' || e.kind === 'pod') return; // missed the crate; pods go with the boss
    if (e.kind === 'haz') { if (G.bossKilled) return; if (e.dur) G.live.push(e); else if (G.sx >= e.x0 && G.sx <= e.x1) hurt(G, e.loss); G.ev.push({ type: 'haz', t: G.t, style: e.style, x0: e.x0, x1: e.x1 }); return; }
    if (e.kind === 'orb') {
      if (G.bossKilled || !hitX) return;
      if (!e.gold) { hurt(G, e.loss); return; }
      const st = G.st, b = G.boss, def = G.def.boss; if (!b.armor) return;
      G.ev.push({ type: 'orb', t: G.t, x: e.x }); if (--st.armor <= 0) { b.armor = false; st.until = G.t + def.open * BAR; G.ev.push({ type: 'armor', t: G.t, on: false }); } return;
    }
    if (e.hp <= 0) return;
    if (e.kind === 'boss') { G.st.gone = true; for (const q of G.ents) if (q.kind === 'pod') q.done = true; const lost = Math.ceil(e.hp / G.def.boss.contact); G.n = Math.max(0, G.n - lost); G.ev.push({ type: 'bossHit', t: G.t, lost }); return; }
    if (hitX) { const lost = Math.max(1, Math.ceil(KIND[e.kind].bite * G.def.bite * e.hp / e.maxHp)); G.n = Math.max(0, G.n - lost); G.ev.push({ type: 'hurt', t: G.t, lost, x: e.x }); }
  }

  function step(G) {
    if (G.over) return;
    G.t += DT; G.tick++;
    // steer toward the target
    const d = G.tx - G.sx, mv = SPEED * DT; G.sx += Math.abs(d) < mv ? d : Math.sign(d) * mv;
    // the drop
    if (!G.oc.on && !G.oc.done && G.t >= DROP_T) { G.oc.on = true; G.oc.mult = 1 + 2 * G.meter / 100; G.ev.push({ type: 'drop', t: G.t, mult: G.oc.mult, meter: G.meter }); }
    if (G.oc.on && G.t >= DROP_END) { G.oc.on = false; G.oc.done = true; G.ev.push({ type: 'ocEnd', t: G.t }); }
    // bikers and diving drones hunt the squad
    for (let i = G.ei; i < G.ents.length; i++) { const e = G.ents[i]; if (e.ta - G.t > 2.6) break; const dr = e.hunt || (e.kind === 'biker' && KIND.biker.drift); if (!dr || e.done) continue; const dd = G.sx - e.x; e.x += Math.sign(dd) * Math.min(Math.abs(dd), dr * DT); }
    // the boss runs its script during the fight
    const be = G.boss, BS = BOSS[be.boss];
    if (!be.done && !G.st.gone && G.t >= DROP_T && BS.tick) BS.tick(G, G.def.boss, be, G.st);
    if (G.live.length) G.live = G.live.filter(h => G.t < h.ta + h.dur);
    G.silenced = G.live.some(h => G.sx >= h.x0 && G.sx <= h.x1);
    // volleys on every 8th note
    while (G.nextVolley <= G.t) { volley(G); G.nextVolley += B / 2; }
    while (G.ei < G.ents.length && G.ents[G.ei].ta <= G.t) { const e = G.ents[G.ei++]; if (!e.done) arrive(G, e); }
    G.peak = Math.max(G.peak, G.n);
    if (G.n <= 0) { G.over = true; G.won = false; G.ev.push({ type: 'lost', t: G.t }); }
    else if (G.t >= END) { G.over = true; G.won = true; G.ev.push({ type: 'won', t: G.t }); }
  }
  function advance(G, toT) { while (!G.over && G.t + DT <= toT) step(G); }

  function results(G) {
    const credits = G.kills * 1 + G.crates * 10 + (G.bossKilled ? 60 : 0) + (G.won ? G.n : 0);
    return { level: G.def.n, won: G.won, cleared: G.won && G.bossKilled, survivors: G.n, peak: G.peak, kills: G.kills, boss: G.bossKilled, weapon: G.weapon, mod: G.mod, wlv: G.wlv, crates: G.crates, meter: Math.round(G.meter), ocMult: Math.round(G.oc.mult * 100) / 100, gatesGood: G.gatesGood, gatesBad: G.gatesBad, credits, t: Math.round(G.t * 10) / 10, section: sectionAt(G.t).id };
  }
  function hash(G) {
    let h = 2166136261 >>> 0; const mix = v => { h ^= (Math.round(v * 1000) | 0); h = Math.imul(h, 16777619) >>> 0; };
    mix(G.t); mix(G.n); mix(G.sx); mix(G.rate); mix(G.meter); mix(G.kills); mix(G.wlv); mix(G.mod); mix(G.def.n); for (const e of G.ents) mix(e.hp || 0);
    return h.toString(16);
  }

  // ---- bots, used by sim.js and the in-page tester ----
  function gateValue(G, g) { const r = gateResult(G, g), W = gun(r.weapon, r.mod); return r.n * r.rate * (1 + 2 * r.meter / 100) * W.mult * W.val * (1 + POWER * (r.wlv - 1)); }
  // the counter to the boss on screen right now: where a player who has learned this fight wants to stand. null means nothing to do
  function counter(G) {
    const e = G.boss; if (GR.noCounter || e.done || G.st.gone || G.t < DROP_T - 0.5) return null;
    const st = G.st, id = e.boss, inZone = h => G.sx >= h.x0 - 0.1 && G.sx <= h.x1 + 0.1;
    let haz = null, orb = null;
    for (let i = G.ei; i < G.ents.length; i++) { const q = G.ents[i], dz = q.ta - G.t; if (dz > 1.6) break; if (q.done) continue; if (q.kind === 'haz' && !haz && dz < 0.95) haz = q; if (q.kind === 'orb' && q.gold && !orb) orb = q; }
    if (id === 'enforcer') return haz && inZone(haz) ? (haz.x0 < 0 ? 0.5 : -0.5) : null;
    if (id === 'carrier') { if (!e.armor) return 0; const p = st.pods.filter(q => !q.done).sort((a, b) => Math.abs(a.x - G.sx) - Math.abs(b.x - G.sx))[0]; return p ? p.x * 0.8 : 0; }
    if (id === 'warden') return (st.warn ? st.side : -st.side) * 0.5;
    if (id === 'echo') return e.x;
    if (id === 'vale') { for (const h of G.live) if (inZone(h)) return h.x0 < 0 ? 0.5 : -0.5; if (haz && inZone(haz)) return haz.x0 < 0 ? 0.5 : -0.5; if (orb && e.armor) return orb.x; return 0; }
    return null;
  }
  const BOTS = {
    smart: G => {
      const c = counter(G); if (c != null) return c;
      const g = G.ents.find(e => !e.done && e.kind === 'gate' && z(G, e) < 1.6);
      if (g) return gateValue(G, g.L) >= gateValue(G, g.R) ? -0.5 : 0.5;
      const tg = G.ents.find(e => !e.done && (e.kind === 'crate' || e.kind === 'biker' || e.kind === 'drone' || e.kind === 'runner') && z(G, e) > 0.05 && z(G, e) < 2);
      return tg ? tg.x : 0;
    },
    // a casual player has learned the fight but misses some of it: it re-decides once a bar whether it's paying attention
    casual: (G, r) => {
      const bar = Math.floor(G.t / BAR); if (G._bar !== bar) { G._bar = bar; G._on = r() < SKILL; }
      if (G._on) { const c = counter(G); if (c != null) return c; }
      const g = G.ents.find(e => !e.done && e.kind === 'gate' && z(G, e) < 1.2);
      if (g) { if (g._pick == null) g._pick = r() < 0.7 ? (gateValue(G, g.L) >= gateValue(G, g.R) ? -0.5 : 0.5) : (r() < 0.5 ? -0.5 : 0.5); return g._pick; }
      const tg = G.ents.find(e => !e.done && (e.kind === 'crate' || e.kind === 'biker' || e.kind === 'runner') && z(G, e) > 0.05 && z(G, e) < 1.4);
      return tg ? tg.x : G.tx;
    },
    random: (G, r) => {
      const g = G.ents.find(e => !e.done && e.kind === 'gate' && z(G, e) < 1.2);
      if (g) { if (g._pick == null) g._pick = r() < 0.5 ? -0.5 : 0.5; return g._pick; }
      return G.tx;
    },
    idle: () => 0.3
  };
  function playBot(o, bot) { const G = newGame(o), r = rng(G.seed * 31 + 5); let lag = 0; while (!G.over) { if (++lag % 6 === 0) act(G, { type: 'steer', x: BOTS[bot](G, r) }); step(G); } return G; }
  function simulate(n, bot, seed, level, loadout) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(results(playBot({ seed: (seed || 11) + i * 7919, level: level || 1, loadout }, bot)));
    const avg = f => out.reduce((a, o) => a + f(o), 0) / out.length;
    return { bot, runs: n, win: avg(o => o.won ? 1 : 0), cleared: avg(o => o.cleared ? 1 : 0), boss: avg(o => o.boss ? 1 : 0), peak: Math.round(avg(o => o.peak)), survivors: Math.round(avg(o => o.survivors)), oc: Math.round(avg(o => o.ocMult) * 100) / 100, crate: avg(o => o.crates ? 1 : 0), credits: Math.round(avg(o => o.credits)), diedIn: out.filter(o => !o.won).reduce((m, o) => (m[o.section] = (m[o.section] || 0) + 1, m), {}) };
  }

  // plays the whole campaign the way a player would: retry a street until it's beaten (or give up), carry what's left into the next one.
  // Returns one row per level, so each level is judged against the squads bots really arrive with
  function campaign(n, bot, seed, levels, tries) {
    const rows = []; for (let L = 1; L <= (levels || MAX_LEVEL); L++) rows.push({ level: L, reached: 0, first: 0, beat: 0, tries: 0, entry: [], peak: [] });
    for (let i = 0; i < n; i++) {
      let ld = null;
      for (let L = 1; L <= rows.length; L++) {
        const row = rows[L - 1], def = levelDef(L); row.reached++; row.entry.push(enter(def, ld).n);
        let done = null;
        for (let k = 0; k < (tries || 12) && !done; k++) {
          const G = playBot({ seed: (seed || 23) + i * 7919 + L * 104729 + k * 1299709, level: L, loadout: ld }, bot); row.tries++; row.peak.push(G.peak);
          if (G.won && G.bossKilled) { done = G; if (k === 0) row.first++; }
        }
        if (!done) break;
        row.beat++; ld = carryOut(done);
      }
    }
    return rows;
  }
  const SKILL = 0.75;
  const GR = { BPM, B, BAR, DT, SEC, END, DROP_T, DROP_END, DROP_BAR, RANGE, KIND, BOSS, LEVELS, MAX_LEVEL, levelDef, setLevel, carryOut, enter, counter, width, sectionAt, BOSS_RANGE, WEAPONS, gun, newGame, gateResult, act, step, advance, results, hash, simulate, campaign, BOTS, rng };
  setLevel(levelDef(1));
  if (typeof module !== 'undefined' && module.exports) module.exports = GR; else root.GR = GR;
})(typeof window !== 'undefined' ? window : globalThis);
