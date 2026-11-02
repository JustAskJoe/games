// node sim.js [matches] — headless balance run on the Prototype 1 engine.
// Bots play whole matches through act(); half the matches swap seats so going first can't hide in the numbers.
// Output lines are stable "label  key value" text so build-and-test.py can read them with a regex.
// © 2026 justaskjoe. All rights reserved.
const WB = require('./engine.js');
const n = Math.max(2, +process.argv[2] || 200);
const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
const pct = (k, of) => Math.round(100 * k / of);

function series(a, b) {
  const out = { aWins: 0, bWins: 0, draws: 0, firstWins: 0, turns: [], timeouts: 0, sudden: 0, dudBlasts: 0, chains: 0, lobs: 0, drowned: 0, selfDmg: 0, dmg: 0, stuck: 0 };
  for (let i = 0; i < n; i++) {
    // seats swap every match and the first turn every two, so "first-turn wins" measures going first,
    // not "going first from the left side of the map" (they were tangled together before Nov 2)
    const swap = i % 2 === 1, styles = swap ? [b, a] : [a, b], first = (i >> 1) % 2;
    let G;
    try { G = WB.playOut(WB.newGame(1234 + i * 7919, { first }), styles).G; } catch (e) { out.stuck++; continue; }
    const aTeam = swap ? 1 : 0;
    if (G.winner === -1) out.draws++; else if (G.winner === aTeam) out.aWins++; else out.bWins++;
    if (G.winner === G.first) out.firstWins++;
    out.turns.push(G.turn); if (G.timeout) out.timeouts++; if (G.turn >= WB.SUDDEN_TURN) out.sudden++;
    const s = G.stats; out.dudBlasts += s.dudBlasts; out.chains += s.chains; out.lobs += s.lobs; out.drowned += s.drowned;
    out.selfDmg += s.selfDmg[0] + s.selfDmg[1]; out.dmg += s.dmg[0] + s.dmg[1];
    for (const v of Object.values(G.units)) if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.hp)) throw new Error('NaN in a unit, seed ' + G.seed);
  }
  return out;
}
function line(label, a, b, r) {
  const played = n - r.stuck;
  console.log(`${label.padEnd(16)} ${a} wins ${pct(r.aWins, played)}%  ${b} wins ${pct(r.bWins, played)}%  draws ${pct(r.draws, played)}%  first-turn wins ${pct(r.firstWins, played)}%` +
    `  turns p10 ${q(r.turns, .1)} p50 ${q(r.turns, .5)} p90 ${q(r.turns, .9)}  sudden death ${pct(r.sudden, played)}%  timeouts ${r.timeouts}  stuck ${r.stuck}`);
  console.log(`${''.padEnd(16)} per match: dud blasts ${(r.dudBlasts / played).toFixed(1)}  chains ${(r.chains / played).toFixed(1)}  lobs ${(r.lobs / played).toFixed(1)}  drowned ${(r.drowned / played).toFixed(1)}  self-damage ${pct(r.selfDmg, r.selfDmg + r.dmg)}% of all damage`);
}

const t0 = Date.now();
console.log(`Wormsbound P1 sim: ${n} matches per pairing (Volt vs Volt), seeds 1234 + i×7919, seats swapped every match, first turn every two`);
line('mirror', 'smart', 'smart', series('smart', 'smart'));
line('skill', 'smart', 'sloppy', series('smart', 'sloppy'));
line('dud value', 'smart', 'nodud', series('smart', 'nodud'));
line('dud spam', 'duder', 'smart', series('duder', 'smart'));

// Characters: a round-robin of smart-vs-smart matches between every pair (seats and first turn swap every
// other match). One line per character with its overall win rate, so no character can hide behind its matchups.
const per = Math.max(10, Math.round(n / 2)), C = WB.CHAR_IDS, tally = {}, vs = {};
for (const c of C) tally[c] = { m: 0, w: 0, d: 0, turns: [], shot2: 0 };
for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
  const a = C[i], b = C[j]; vs[a + ' v ' + b] = 0;
  for (let k = 0; k < per; k++) {
    const swap = k % 2 === 1, chars = swap ? [b, a] : [a, b];
    const G = WB.playOut(WB.newGame(4321 + k * 7919 + i * 131 + j * 17, { chars, first: (k >> 1) % 2 }), ['smart', 'smart']).G;
    for (let t = 0; t < 2; t++) { const c = chars[t]; tally[c].m++; tally[c].turns.push(G.turn); if (G.winner === t) tally[c].w++; if (G.winner === -1) tally[c].d++; }
    if (G.winner >= 0 && chars[G.winner] === a) vs[a + ' v ' + b]++;
    for (const u of G.units) if (!Number.isFinite(u.hp)) throw new Error('NaN hp');
    tally[chars[0]].shot2 += G.stats.shot2 / 2; tally[chars[1]].shot2 += G.stats.shot2 / 2;
  }
}
console.log(`characters: round-robin, ${per} smart-vs-smart matches per pair`);
for (const c of C) { const t = tally[c]; console.log(`char ${c.padEnd(7)} wins ${pct(t.w, t.m)}%  draws ${pct(t.d, t.m)}%  matches ${t.m}  turns p50 ${q(t.turns, .5)}`); }
console.log('head to head (first named wins): ' + Object.entries(vs).map(([k, v]) => `${k} ${pct(v, per)}%`).join(' · '));
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
