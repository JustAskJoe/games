/* Cyberpunk Gate Runner, Prototype 1: pure engine (no DOM). window.GR in the browser, module.exports in node.
   One street, one 32-bar house loop at 122 BPM. Everything is placed on the beat grid, so gates, enemies and
   the boss arrive on the music. Every player action goes through act(G, intent); hash(G) checksums a run.
   © 2026 justaskjoe. All rights reserved. */
(function (root) {
  const BPM = 122, B = 60 / BPM, BAR = 4 * B, DT = 1 / 60;
  const SEC = [ // bars
    { id: 'intro', name: 'Night Market', hint: 'Slide to grab runners', b0: 0, b1: 4 },
    { id: 'build', name: 'The build', hint: 'Pick a gate. Bigger squad, more firepower', b0: 4, b1: 12 },
    { id: 'riser', name: 'The riser', hint: 'Good gates charge Overclock', b0: 12, b1: 20 },
    { id: 'drop', name: 'THE DROP', hint: 'Overclock! Melt the boss', b0: 20, b1: 28 },
    { id: 'outro', name: 'Cash out', hint: 'Street cleared', b0: 28, b1: 31 }
  ];
  const END = 31 * BAR, DROP_T = 20 * BAR, DROP_END = 28 * BAR;
  const RANGE = 2.3;            // seconds ahead the squad can shoot
  const AIM = 0.22;             // aim cone half-width (road units, road is -1..1)
  const SPEED = 2.6;            // squad steer speed (road units / s)
  const KIND = {
    drone: { hp: 12, bite: 2, w: 0.11, credits: 1 },
    biker: { hp: 80, bite: 6, w: 0.14, credits: 3, drift: 0.32 },
    crate: { hp: 30, bite: 0, w: 0.13, credits: 10 },
    boss: { hp: 6000, bite: 0, w: 0.42, credits: 60 }
  };
  // gate pairs: one every 2 bars from bar 4 to 18. Sides are shuffled per run (seeded).
  const GATES = [
    [{ op: 'add', v: 5 }, { op: 'mul', v: 2 }],
    [{ op: 'add', v: 8 }, { op: 'sub', v: 4 }],
    [{ op: 'rate', v: 0.5 }, { op: 'add', v: 6 }],
    [{ op: 'mul', v: 2 }, { op: 'add', v: 10 }],
    [{ op: 'sub', v: 8 }, { op: 'mul', v: 2 }],
    [{ op: 'add', v: 15 }, { op: 'rate', v: 0.5 }],
    [{ op: 'mul', v: 2 }, { op: 'sub', v: 15 }],
    [{ op: 'add', v: 20 }, { op: 'mul', v: 2 }]
  ];

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }

  function buildStreet(r) {
    const E = []; let id = 0;
    const at = (bar, beat) => (bar * 4 + beat) * B;
    const add = (kind, ta, x, extra) => E.push(Object.assign({ id: id++, kind, ta, x, done: false }, KIND[kind] ? { hp: KIND[kind].hp, maxHp: KIND[kind].hp, w: KIND[kind].w } : {}, extra));
    // intro: +1 runners zigzag on the beat (lesson 1: steer)
    const zz = [-0.5, 0, 0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0];
    for (let i = 0; i < 10; i++) add('runner', at(1, 0) + i * B, zz[i], { w: 0.1 });
    // gates on the downbeat every 2 bars
    GATES.forEach((pair, i) => { const sw = r() < 0.5; add('gate', at(4 + i * 2, 0), 0, { L: sw ? pair[1] : pair[0], R: sw ? pair[0] : pair[1] }); });
    // drones: a cluster on beat 3 of every bar in the build (lesson 3: fight)
    for (let bar = 5; bar < 20; bar++) {
      const n = bar < 8 ? 2 : bar < 12 ? 3 : 4, cx = (r() * 1.2 - 0.6);
      for (let k = 0; k < n; k++) add('drone', at(bar, 2) + (k % 2) * B / 2, Math.max(-0.85, Math.min(0.85, cx + (k - (n - 1) / 2) * 0.2)));
    }
    // weapon crate (shoot it open) and bikers in the riser
    add('crate', at(13, 2), r() < 0.5 ? -0.55 : 0.55);
    for (const bar of [14, 15, 16, 17, 18, 19]) add('biker', at(bar, 3), r() * 1.4 - 0.7);
    // the drop: a dense horde, then the mini boss lands on bar 26
    for (let bar = 20; bar < 26; bar++) for (let k = 0; k < 6; k++) add('drone', at(bar, k * 0.5 + 0.5), (r() * 1.6 - 0.8));
    add('boss', at(26, 0), 0);
    return E.sort((a, b) => a.ta - b.ta);
  }

  function newGame(o) {
    o = o || {};
    const r = rng(o.seed || 1);
    return { seed: o.seed || 1, t: 0, tick: 0, n: 3, sx: 0, tx: 0, rate: 1, weapon: 'pulse', wmult: 1,
      meter: 0, oc: { on: false, done: false, mult: 1 }, ents: buildStreet(r), nextVolley: B / 2,
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

  function applyGate(G, g) {
    const n0 = G.n;
    if (g.op === 'add') G.n += g.v; else if (g.op === 'mul') G.n *= g.v; else if (g.op === 'sub') G.n = Math.max(0, G.n - g.v); else if (g.op === 'rate') G.rate += g.v;
    const good = g.op !== 'sub';
    if (good) G.gatesGood++; else G.gatesBad++;
    if (G.t < DROP_T) G.meter = Math.max(0, Math.min(100, G.meter + (good ? 12.5 : -15)));
    G.ev.push({ type: 'gate', t: G.t, g, good, n0, n: G.n });
  }

  function volley(G) {
    const sx = G.sx, aimW = AIM + width(G.n) * 0.5;
    let pool = G.n * G.rate * G.wmult * (G.oc.on ? G.oc.mult : 1);
    const tg = G.ents.filter(e => !e.done && e.hp > 0 && KIND[e.kind] && z(G, e) > 0 && z(G, e) < RANGE && Math.abs(e.x - sx) < aimW + e.w).sort((a, b) => a.ta - b.ta);
    const hits = [];
    for (const e of tg) {
      if (pool <= 0) break;
      const d = Math.min(pool, e.hp); e.hp -= d; pool -= d; hits.push(e.id);
      if (e.hp <= 0) kill(G, e);
    }
    G.ev.push({ type: 'volley', t: G.t, hits });
  }
  function kill(G, e) {
    e.done = true; e.hp = 0;
    if (e.kind === 'crate') { G.crates++; G.weapon = 'arc'; G.wmult = 1.8; G.ev.push({ type: 'weapon', t: G.t, w: 'arc', x: e.x }); }
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
    if (e.kind === 'boss') { const lost = Math.ceil(e.hp / 8); G.n = Math.max(0, G.n - lost); G.ev.push({ type: 'bossHit', t: G.t, lost }); return; }
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
    for (const e of G.ents) if (e.kind === 'biker' && !e.done && z(G, e) < 2.6) { const dd = G.sx - e.x; e.x += Math.sign(dd) * Math.min(Math.abs(dd), KIND.biker.drift * DT); }
    // volleys on every 8th note
    while (G.nextVolley <= G.t) { volley(G); G.nextVolley += B / 2; }
    for (const e of G.ents) { if (e.ta > G.t) break; if (!e.done) arrive(G, e); }
    G.peak = Math.max(G.peak, G.n);
    if (G.n <= 0) { G.over = true; G.won = false; G.ev.push({ type: 'lost', t: G.t }); }
    else if (G.t >= END) { G.over = true; G.won = true; G.ev.push({ type: 'won', t: G.t }); }
  }
  function advance(G, toT) { while (!G.over && G.t + DT <= toT) step(G); }

  function results(G) {
    const credits = G.kills * 1 + G.crates * 10 + (G.bossKilled ? 60 : 0) + (G.won ? G.n : 0);
    return { won: G.won, survivors: G.n, peak: G.peak, kills: G.kills, boss: G.bossKilled, weapon: G.weapon, meter: Math.round(G.meter), ocMult: Math.round(G.oc.mult * 100) / 100, gatesGood: G.gatesGood, gatesBad: G.gatesBad, credits, t: Math.round(G.t * 10) / 10, section: sectionAt(G.t).id };
  }
  function hash(G) {
    let h = 2166136261 >>> 0; const mix = v => { h ^= (Math.round(v * 1000) | 0); h = Math.imul(h, 16777619) >>> 0; };
    mix(G.t); mix(G.n); mix(G.sx); mix(G.rate); mix(G.meter); mix(G.kills); for (const e of G.ents) mix(e.hp || 0);
    return h.toString(16);
  }

  // ---- bots, used by sim.js and the in-page tester ----
  function gateValue(G, g) {
    let n = G.n, rate = G.rate;
    if (g.op === 'add') n += g.v; else if (g.op === 'mul') n *= g.v; else if (g.op === 'sub') n = Math.max(0, n - g.v); else rate += g.v;
    return n * rate;
  }
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
    return { bot, runs: n, win: avg(o => o.won ? 1 : 0), boss: avg(o => o.boss ? 1 : 0), peak: Math.round(avg(o => o.peak)), survivors: Math.round(avg(o => o.survivors)), oc: Math.round(avg(o => o.ocMult) * 100) / 100, arc: avg(o => o.weapon === 'arc' ? 1 : 0), credits: Math.round(avg(o => o.credits)), diedIn: out.filter(o => !o.won).reduce((m, o) => (m[o.section] = (m[o.section] || 0) + 1, m), {}) };
  }

  const GR = { BPM, B, BAR, DT, SEC, END, DROP_T, DROP_END, RANGE, KIND, width, sectionAt, newGame, act, step, advance, results, hash, simulate, BOTS, rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = GR; else root.GR = GR;
})(typeof window !== 'undefined' ? window : globalThis);
