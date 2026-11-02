// Lightkeeper balance sim: bots play every night through the same act() path as a person.
// node sim.js [runs]   → prints win rates and exits 1 if outside the pass band.
// © 2026 justaskjoe. All rights reserved.
'use strict';
const LK = require('./engine.js');
const { wrap, LAMP } = LK;
const aimAt = s => Math.atan2(s.y - LAMP.y, s.x - LAMP.x);
const aligned = s => Math.abs(wrap(Math.atan2(LAMP.y - s.y, LAMP.x - s.x) - s.h)) < 0.05;

// Smart: light the most urgent ship whose lit course is safe; leave ships that already point home; park the beam otherwise.
function smart(G, r) {
  const live = G.ships.filter(s => s.st === 'sail');
  let best = null, bestU = Infinity;
  for (const s of live) {
    const dark = LK.forecast(G, s, false, 30);
    if (dark.res === 'dock') continue;
    const lit = LK.forecast(G, s, true, 30);
    if (lit.res !== 'dock') continue;
    // don't sweep across a ship whose lit course would wreck it
    const a = aimAt(s);
    const harm = live.some(o => o !== s && Math.abs(wrap(aimAt(o) - a)) < LK.BEAM_HALF + 0.05 && LK.forecast(G, o, true, 30).res !== 'dock' && LK.forecast(G, o, false, 30).res === 'dock');
    const u = dark.t + (harm ? 8 : 0);
    if (u < bestU) { bestU = u; best = s; }
  }
  if (best) return { k: 'aim', a: aimAt(best) + (r() - 0.5) * 0.06 };
  // park where no ship is
  const opts = [-0.06, -Math.PI + 0.06, -Math.PI / 2];
  let pa = opts[0], pn = Infinity;
  for (const a of opts) { const n = live.filter(s => Math.abs(wrap(aimAt(s) - a)) < 0.35).length; if (n < pn) { pn = n; pa = a; } }
  return { k: 'aim', a: pa };
}
function smartHorn(G) {
  const live = G.ships.filter(s => s.st === 'sail' && Math.hypot(s.x - LAMP.x, s.y - LAMP.y) > LK.CALM_R);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) if (Math.hypot(live[i].x - live[j].x, live[i].y - live[j].y) < 26) return true;
  return false;
}
// Sloppy: always lights the nearest unaligned ship, no planning, slow hands.
function sloppy(G) {
  const live = G.ships.filter(s => s.st === 'sail' && !aligned(s));
  if (!live.length) return null;
  live.sort((a, b) => Math.hypot(a.x - LAMP.x, a.y - LAMP.y) - Math.hypot(b.x - LAMP.x, b.y - LAMP.y));
  return { k: 'aim', a: aimAt(live[0]) };
}

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function play(night, seed, kind) {
  const G = LK.create(night, seed), r = rng(seed * 97 + 3);
  let nextThink = 0;
  while (!G.over && G.tick < 30 * 400) {
    if (G.t >= nextThink) {
      const it = kind === 'smart' ? smart(G, r) : sloppy(G);
      if (it) LK.act(G, it);
      if (kind === 'smart' && smartHorn(G)) LK.act(G, { k: 'horn' });
      nextThink = G.t + (kind === 'smart' ? 0.15 + r() * 0.2 : 0.45 + r() * 0.3);
    }
    LK.step(G);
  }
  return G;
}

// Pass band: the smart bot wins at least 85% of every night (every night is fair), and the sloppy bot
// (nearest ship first, no planning) loses at least 3 of nights 2-6 (planning matters). Fog's real difficulty,
// ships you can't see, isn't modeled: bots see everything.
const BAND = { smartMin: 0.85, sloppyLosesAtLeast: 3, sloppyLoseBelow: 0.5 };
// node sim.js windows → for each ship alone: the times (s after it appears) when switching the light on brings it home.
function windows() {
  LK.NIGHTS.forEach((def, n) => {
    console.log(def.id + ' ' + def.name);
    def.ships.forEach((sp, i) => {
      const G = LK.create(n, 1), s = { x: sp.x, y: sp.y, h: sp.h * Math.PI / 180 }; const ok = []; let end = '';
      for (let k = 0; k <= 30 / LK.DT; k++) {
        if (k % 15 === 0 && LK.forecast(G, s, true, 40).res === 'dock') ok.push((k * LK.DT).toFixed(1));
        const f = LK.forecast(G, s, false, LK.DT); if (f.res !== 'sail') { end = f.res + '@' + (k * LK.DT).toFixed(1); break; }
        s.x = f.x; s.y = f.y;
      }
      const w = ok.length * 0.5;
      console.log(`  ship ${i}: ${w.toFixed(1)}s of good timing${w < 3 ? '  ← tight' : ''}  [${ok[0] || '-'} … ${ok[ok.length - 1] || '-'}] dark ends ${end || 'sailing'}`);
    });
  });
}
if (require.main === module && process.argv[2] === 'windows') { windows(); process.exit(0); }
if (require.main === module) {
  const runs = +process.argv[2] || 20;
  let fail = false, sloppyLost = 0;
  console.log('night            smart  ★avg  t(s)  par | sloppy');
  LK.NIGHTS.forEach((def, n) => {
    let sw = 0, st = 0, tt = 0, lw = 0;
    for (let i = 1; i <= runs; i++) { const g = play(n, i, 'smart'); if (g.over === 'won') { sw++; st += g.stars; tt += g.t; } }
    for (let i = 1; i <= runs; i++) { const g = play(n, i, 'sloppy'); if (g.over === 'won') lw++; }
    const s = sw / runs, l = lw / runs;
    const bad = s < BAND.smartMin;
    if (bad) fail = true;
    if (n > 0 && l < BAND.sloppyLoseBelow) sloppyLost++;
    console.log(`${(def.id + ' ' + def.name).padEnd(16)} ${(s * 100).toFixed(0).padStart(4)}%  ${sw ? (st / sw).toFixed(1) : '-'}  ${sw ? (tt / sw).toFixed(0).padStart(4) : '   -'}  ${String(def.par).padStart(3)} | ${(l * 100).toFixed(0).padStart(4)}%${bad ? '  ✗ outside band' : ''}`);
  });
  console.log(`sloppy bot loses ${sloppyLost} of nights 2-6 (needs ${BAND.sloppyLosesAtLeast})`);
  if (sloppyLost < BAND.sloppyLosesAtLeast) fail = true;
  // determinism: replaying a smart run's log gives the same hash
  const g = play(2, 5, 'smart'), rp = LK.replay(2, 5, g.log, g.tick);
  const same = LK.hash(g) === LK.hash(rp);
  console.log('replay matches:', same);
  if (!same) fail = true;
  console.log(fail ? 'SIM: FAIL' : 'SIM: PASS');
  process.exit(fail ? 1 : 0);
}
module.exports = { play };
