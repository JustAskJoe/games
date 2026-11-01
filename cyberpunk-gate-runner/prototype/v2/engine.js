/* Cyberpunk Gate Runner, Prototype 2: pure engine (no DOM). window.GR in the browser, module.exports in node.
   One street, one 32-bar house loop at 122 BPM. Everything is placed on the beat grid, so gates, enemies and
   the boss arrive on the music. Every player action goes through act(G, intent); hash(G) checksums a run.
   © 2026 justaskjoe. All rights reserved. */
(function (root) {
  const BPM = 122, B = 60 / BPM, BAR = 4 * B, DT = 1 / 60;
  const SEC = [ // bars
    { id: 'intro', name: 'Night Market', hint: 'Slide to grab runners', b0: 0, b1: 4 },
    { id: 'build', name: 'The build', hint: 'Steer left or right of the line to pick a gate', b0: 4, b1: 12 },
    { id: 'riser', name: 'The riser', hint: 'Every gate fills Overclock: more damage at the drop', b0: 12, b1: 20 },
    { id: 'drop', name: 'THE DROP', hint: 'Overclock! Melt the boss', b0: 20, b1: 28 },
    { id: 'outro', name: 'Cash out', hint: 'Street cleared', b0: 28, b1: 31 }
  ];
  const END = 31 * BAR, DROP_T = 20 * BAR, DROP_END = 28 * BAR;
  const RANGE = 1.7, BOSS_RANGE = 4 * BAR;            // seconds ahead the squad can shoot
  const AIM = 0.22;             // aim cone half-width (road units, road is -1..1)
  const SPEED = 2.6;            // squad steer speed (road units / s)
  const KIND = {
    swarm: { hp: 8, bite: 1, w: 0.05, credits: 1 },
    drone: { hp: 12, bite: 3, w: 0.11, credits: 1 },
    biker: { hp: 110, bite: 9, w: 0.14, credits: 3, drift: 0.32 },
    crate: { hp: 30, bite: 0, w: 0.13, credits: 10 },
    boss: { hp: 23000, bite: 0, w: 0.42, credits: 60 }
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
  function dealGates(r) {
    return SLOTS.map(s => {
      if (s === 'weapon') return [{ op: 'weapon' }, { op: 'weapon' }];         // your one gun choice this run
      if (s === 'mod') return [{ op: 'mod', k: 0 }, { op: 'mod', k: 1 }];      // two ways to build that gun
      const P = POOLS[s], a = P[Math.floor(r() * P.length)], rest = P.filter(g => g.op !== a.op);
      return [a, rest[Math.floor(r() * rest.length)]];
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
  // [bar, rows, across]: 24 enemies early, up to 396 at the drop
  const WALLS = [[5, 4, 6], [7, 4, 7], [9, 6, 8], [11, 6, 9], [13, 8, 10], [15, 8, 11], [17, 10, 12], [19, 12, 13], [20, 22, 18], [22, 22, 18]];
  const CHARGE = 10;            // Overclock % from any gate; charge gates add more, trades add none

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }

  function buildStreet(r) {
    const E = []; let id = 0;
    const at = (bar, beat) => (bar * 4 + beat) * B;
    const add = (kind, ta, x, extra) => E.push(Object.assign({ id: id++, kind, ta, x, done: false }, KIND[kind] ? { hp: KIND[kind].hp, maxHp: KIND[kind].hp, w: KIND[kind].w } : {}, extra));
    // intro: +1 runners zigzag on the beat (lesson 1: steer)
    const zz = [-0.5, 0, 0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0];
    for (let i = 0; i < 10; i++) add('runner', at(1, 0) + i * B, zz[i], { w: 0.1 });
    // gates on the downbeat every 2 bars
    const offer = FINDS.slice().sort(() => r() - 0.5); let oi = 0;
    dealGates(r).forEach((pair, i) => { const sw = r() < 0.5, opts = pair.map(g => g.op === 'weapon' ? { op: 'weapon', w: offer[oi++ % offer.length] } : g); add('gate', at(4 + i * 2, 0), 0, { L: sw ? opts[1] : opts[0], R: sw ? opts[0] : opts[1] }); });
    // horde walls fill the road on the odd bars, between gates. You carve a path; whatever's left reaches you.
    const wall = (bar, rows, across) => {
      for (let i = 0; i < rows; i++) for (let k = 0; k < across; k++) add('swarm', at(bar, 0) + i * 0.085, -0.92 + 1.84 * (k + 0.5) / across + (r() - 0.5) * 0.08);
    };
    for (const [bar, rows, across] of WALLS) wall(bar, rows, across);
    // a few tough drones lead each wall
    for (let bar = 5; bar < 20; bar += 2) for (let k = 0; k < 2; k++) add('drone', at(bar, 2) + k * B / 2, r() * 1.4 - 0.7);
    // weapon crate (shoot it open) and bikers in the riser
    add('crate', at(13, 2), r() < 0.5 ? -0.55 : 0.55);
    for (const bar of [14, 15, 16, 17, 18, 19]) add('biker', at(bar, 3), r() * 1.4 - 0.7);
    // the Enforcer appears on the drop and reaches you four bars later: an 8 second fight through the horde
    add('boss', at(24, 0), 0);
    return E.sort((a, b) => a.ta - b.ta);
  }

  function newGame(o) {
    o = o || {};
    const r = rng(o.seed || 1);
    return { seed: o.seed || 1, t: 0, tick: 0, n: 3, sx: 0, tx: 0, rate: 1, weapon: 'pulse', mod: -1, wlv: 1,
      meter: 0, oc: { on: false, done: false, mult: 1 }, ents: buildStreet(r), ei: 0, nextVolley: B / 2,
      kills: 0, crates: 0, boss: null, bossKilled: false, gatesGood: 0, gatesBad: 0, peak: 3,
      over: false, won: false, ev: [], log: [] };
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
    else if (g.op === 'oc') c = g.v; else if (g.op === 'trade') { n = Math.max(0, n - g.lose) * g.v; c = 0; }
    else if (g.op === 'weapon') weapon = g.w; else if (g.op === 'mod') mod = g.k;
    return { n, rate, weapon, wlv, mod, meter: Math.min(100, G.meter + c) };
  }
  function applyGate(G, g) {
    const n0 = G.n, r = gateResult(G, g), good = g.op !== 'trade';
    G.n = r.n; G.rate = r.rate; G.weapon = r.weapon; G.mod = r.mod; if (G.t < DROP_T) G.meter = r.meter;
    if (good) G.gatesGood++; else G.gatesBad++;
    G.ev.push({ type: 'gate', t: G.t, g, good, n0, n: G.n });
    if (g.op === 'weapon' || g.op === 'mod') G.ev.push({ type: 'weapon', t: G.t, w: G.weapon, lv: G.wlv, mod: g.op === 'mod' ? g.k : -1, pick: g.op === 'weapon' });
  }

  function volley(G) {
    const W = gun(G.weapon, G.mod), sx = G.sx, aimW = AIM + W.aim + width(G.n) * 0.5;
    let pool = G.n * G.rate * W.mult * (1 + POWER * (G.wlv - 1)) * (G.oc.on ? G.oc.mult : 1), pierced = 0;
    const tg = [];
    for (let i = G.ei; i < G.ents.length; i++) { const e = G.ents[i], dz = e.ta - G.t; if (dz >= BOSS_RANGE) break; if (e.kind !== 'boss' && dz >= RANGE) continue; if (!e.done && e.hp > 0 && KIND[e.kind] && dz > 0 && Math.abs(e.x - sx) < aimW + e.w) tg.push(e); }
    if (W.pierce) tg.sort((p, q) => (q.kind === 'boss') - (p.kind === 'boss')); // a rail shot goes through the horde to the boss
    const hits = [];
    for (const e of tg) {
      if (pool <= 0) break;
      if (e.hp <= 0) continue; // already caught in a blast this volley
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
    else if (e.kind === 'boss') { G.bossKilled = true; G.ev.push({ type: 'bossDown', t: G.t }); }
    else G.kills++;
    G.ev.push({ type: 'kill', t: G.t, kind: e.kind, x: e.x, id: e.id });
  }

  function arrive(G, e) {
    e.done = true;
    const w = width(G.n), hitX = Math.abs(e.x - G.sx) < w + (e.w || 0.08);
    if (e.kind === 'runner') { if (hitX) { G.n += 1; G.ev.push({ type: 'runner', t: G.t, x: e.x }); } return; }
    if (e.kind === 'gate') { applyGate(G, G.sx < 0 ? e.L : e.R); return; }
    if (e.kind === 'crate') return; // missed the crate
    if (e.hp <= 0) return;
    if (e.kind === 'boss') { const lost = Math.ceil(e.hp / 30); G.n = Math.max(0, G.n - lost); G.ev.push({ type: 'bossHit', t: G.t, lost }); return; }
    if (hitX) { const lost = Math.max(1, Math.ceil(KIND[e.kind].bite * e.hp / e.maxHp)); G.n = Math.max(0, G.n - lost); G.ev.push({ type: 'hurt', t: G.t, lost, x: e.x }); }
  }

  function step(G) {
    if (G.over) return;
    G.t += DT; G.tick++;
    // steer toward the target
    const d = G.tx - G.sx, mv = SPEED * DT; G.sx += Math.abs(d) < mv ? d : Math.sign(d) * mv;
    // the drop
    if (!G.oc.on && !G.oc.done && G.t >= DROP_T) { G.oc.on = true; G.oc.mult = 1 + 2 * G.meter / 100; G.ev.push({ type: 'drop', t: G.t, mult: G.oc.mult, meter: G.meter }); }
    if (G.oc.on && G.t >= DROP_END) { G.oc.on = false; G.oc.done = true; G.ev.push({ type: 'ocEnd', t: G.t }); }
    // bikers hunt the squad
    for (let i = G.ei; i < G.ents.length; i++) { const e = G.ents[i]; if (e.ta - G.t > 2.6) break; if (e.kind !== 'biker' || e.done) continue; const dd = G.sx - e.x; e.x += Math.sign(dd) * Math.min(Math.abs(dd), KIND.biker.drift * DT); }
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
    return { won: G.won, survivors: G.n, peak: G.peak, kills: G.kills, boss: G.bossKilled, weapon: G.weapon, mod: G.mod, wlv: G.wlv, crates: G.crates, meter: Math.round(G.meter), ocMult: Math.round(G.oc.mult * 100) / 100, gatesGood: G.gatesGood, gatesBad: G.gatesBad, credits, t: Math.round(G.t * 10) / 10, section: sectionAt(G.t).id };
  }
  function hash(G) {
    let h = 2166136261 >>> 0; const mix = v => { h ^= (Math.round(v * 1000) | 0); h = Math.imul(h, 16777619) >>> 0; };
    mix(G.t); mix(G.n); mix(G.sx); mix(G.rate); mix(G.meter); mix(G.kills); mix(G.wlv); mix(G.mod); for (const e of G.ents) mix(e.hp || 0);
    return h.toString(16);
  }

  // ---- bots, used by sim.js and the in-page tester ----
  function gateValue(G, g) { const r = gateResult(G, g), W = gun(r.weapon, r.mod); return r.n * r.rate * (1 + 2 * r.meter / 100) * W.mult * W.val * (1 + POWER * (r.wlv - 1)); }
  const BOTS = {
    smart: G => {
      const g = G.ents.find(e => !e.done && e.kind === 'gate' && z(G, e) < 1.6);
      if (g) return gateValue(G, g.L) >= gateValue(G, g.R) ? -0.5 : 0.5;
      const tg = G.ents.find(e => !e.done && (e.kind === 'crate' || e.kind === 'biker' || e.kind === 'drone' || e.kind === 'runner') && z(G, e) > 0.05 && z(G, e) < 2);
      return tg ? tg.x : 0;
    },
    casual: (G, r) => {
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
  function simulate(n, bot, seed) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const G = newGame({ seed: (seed || 11) + i * 7919 }), r = rng(G.seed * 31 + 5);
      let lag = 0;
      while (!G.over) { if (++lag % 6 === 0) act(G, { type: 'steer', x: BOTS[bot](G, r) }); step(G); }
      out.push(results(G));
    }
    const avg = f => out.reduce((a, o) => a + f(o), 0) / out.length;
    return { bot, runs: n, win: avg(o => o.won ? 1 : 0), boss: avg(o => o.boss ? 1 : 0), peak: Math.round(avg(o => o.peak)), survivors: Math.round(avg(o => o.survivors)), oc: Math.round(avg(o => o.ocMult) * 100) / 100, crate: avg(o => o.crates ? 1 : 0), credits: Math.round(avg(o => o.credits)), diedIn: out.filter(o => !o.won).reduce((m, o) => (m[o.section] = (m[o.section] || 0) + 1, m), {}) };
  }

  const GR = { BPM, B, BAR, DT, SEC, END, DROP_T, DROP_END, RANGE, KIND, width, sectionAt, BOSS_RANGE, WEAPONS, gun, newGame, gateResult, act, step, advance, results, hash, simulate, BOTS, rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = GR; else root.GR = GR;
})(typeof window !== 'undefined' ? window : globalThis);
