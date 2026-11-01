// Balance sim: bots play every street headless. Exits 1 if any band fails.
// Level bands are first-try clears (boss killed and squad alive), starting from the squads bots really carried in.
// Usage: node sim.js [runs]    © 2026 justaskjoe. All rights reserved.
const GR = require('./engine.js');
const RUNS = +process.argv[2] || 200;
// first-try clear rate per level: [lo, hi]
const BANDS = {
  casual: [[0.55, 0.75], [0.4, 0.62], [0.35, 0.55], [0.3, 0.5], [0.25, 0.45]],
  smart: [[0.75, 1], [0.6, 1], [0.55, 1], [0.5, 1], [0.45, 1]],
  random: [[0, 0.25]], idle: [[0, 0.25]]
};
let ok = true;
const pc = v => (v * 100).toFixed(0).padStart(3) + '%';
const q = (a, k) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) * k)] : 0; };
for (const bot of ['smart', 'casual']) {
  console.log(`\n${bot}: full campaign, ${RUNS} runs, up to 12 tries a street`);
  GR.campaign(RUNS, bot).forEach((c, i) => {
    const first = c.first / Math.max(1, c.reached), [lo, hi] = BANDS[bot][i], pass = first >= lo && first <= hi; if (!pass) ok = false;
    console.log(`${pass ? 'ok  ' : 'FAIL'} L${c.level} ${GR.levelDef(c.level).boss.id.padEnd(8)} first try ${pc(first)}  beaten ${pc(c.beat / Math.max(1, c.reached))} of ${String(c.reached).padStart(3)}  tries ${(c.tries / Math.max(1, c.reached)).toFixed(1)}  squad in ${q(c.entry, 0.25)}/${q(c.entry, 0.5)}/${q(c.entry, 0.75)}  peak ${q(c.peak, 0.5)}`);
  });
}
console.log('\nno counterplay: these bots never learn a fight (street 1)');
for (const bot of ['random', 'idle']) {
  const r = GR.simulate(RUNS, bot), [lo, hi] = BANDS[bot][0], pass = r.cleared >= lo && r.cleared <= hi; if (!pass) ok = false;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${bot.padEnd(6)} clear ${pc(r.cleared)}  survive ${pc(r.win)}  peak ${r.peak}  died in ${JSON.stringify(r.diedIn)}`);
}
// each mechanic has to matter: the same squad must do far worse when it ignores the fight
console.log('\ncounterplay check: same squad, smart bot with and without the counter');
for (let L = 2; L <= GR.MAX_LEVEL; L++) {
  const def = GR.levelDef(L), ld = { n: Math.round(def.start[1] * 0.75), weapon: 'rail', mod: 0, wlv: def.wlvCap - 1 };
  const yes = GR.simulate(RUNS >> 1, 'smart', 11, L, ld).cleared; GR.noCounter = true; const no = GR.simulate(RUNS >> 1, 'smart', 11, L, ld).cleared; GR.noCounter = false;
  const pass = no < yes - 0.2; if (!pass) ok = false;
  console.log(`${pass ? 'ok  ' : 'FAIL'} L${L} with ${pc(yes)}  without ${pc(no)}`);
}
// streets past the table have to build and finish without errors
for (let L = 6; L <= 12; L++) { const d = GR.levelDef(L), r = GR.simulate(4, 'smart', 11, L); console.log(`ok   L${L} ${d.name} runs (${d.bpm} BPM, ${d.boss.id}, boss HP ${Math.round(d.boss.hp)}, clear ${pc(r.cleared)})`); }
// determinism: same seed + same intents = same hash, on every street
for (let L = 1; L <= GR.MAX_LEVEL; L++) {
  const run = () => { const G = GR.newGame({ seed: 42, level: L }), r = GR.rng(9); let k = 0; while (!G.over) { if (++k % 6 === 0) GR.act(G, { type: 'steer', x: GR.BOTS.casual(G, r) }); GR.step(G); } return GR.hash(G); };
  const h1 = run(), h2 = run(); if (h1 !== h2) { ok = false; console.log('FAIL replay hash differs on L' + L); } else console.log(`ok   L${L} replay hash ${h1}`);
}
// gates are dealt per run: different seeds have to give different streets
const deal = s => GR.newGame({ seed: s }).ents.filter(e => e.kind === 'gate').map(e => JSON.stringify([e.L, e.R])).join();
const deals = new Set(); for (let s = 1; s <= 50; s++) deals.add(deal(s * 7919));
console.log(deals.size >= 40 ? 'ok   ' + deals.size + ' different gate deals in 50 seeds' : 'FAIL gates barely change: ' + deals.size + ' deals in 50 seeds');
if (deals.size < 40) ok = false;
process.exit(ok ? 0 : 1);
