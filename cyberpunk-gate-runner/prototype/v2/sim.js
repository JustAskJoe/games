// Balance sim: bots play the street headless. Exits 1 if any bot leaves its pass band.
// Bands: smart wins >= 90%, casual >= 75% (chill: easy to start), random 5-40%, idle (never steers) <= 25%.
// © 2026 justaskjoe. All rights reserved.
const GR = require('./engine.js');
const BANDS = { smart: [0.9, 1], casual: [0.75, 1], random: [0.05, 0.4], idle: [0, 0.25] };
let ok = true;
for (const bot of Object.keys(BANDS)) {
  const r = GR.simulate(+process.argv[2] || 200, bot);
  const [lo, hi] = BANDS[bot], pass = r.win >= lo && r.win <= hi;
  if (!pass) ok = false;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${bot.padEnd(6)} win ${(r.win * 100).toFixed(0).padStart(3)}%  boss ${(r.boss * 100).toFixed(0).padStart(3)}%  peak ${String(r.peak).padStart(4)}  left ${String(r.survivors).padStart(4)}  overclock x${r.oc}  arc ${(r.arc * 100).toFixed(0)}%  credits ${r.credits}  died in ${JSON.stringify(r.diedIn)}`);
}
// determinism: same seed + same intents = same hash
const run = () => { const G = GR.newGame({ seed: 42 }), r = GR.rng(9); let k = 0; while (!G.over) { if (++k % 6 === 0) GR.act(G, { type: 'steer', x: GR.BOTS.casual(G, r) }); GR.step(G); } return GR.hash(G); };
const h1 = run(), h2 = run();
console.log(h1 === h2 ? 'ok   replay hash matches ' + h1 : 'FAIL replay hash differs');
if (h1 !== h2) ok = false;
process.exit(ok ? 0 : 1);
