// node sim.js [games] — headless balance run on the Prototype 1 engine.
const TD = require('./engine.js');
const n = +process.argv[2] || 200;
const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
for (const style of ['smart', 'saver', 'random']) {
  const r = TD.simulate(n, 1234, style);
  const avgW = (r.waves.reduce((a, b) => a + b, 0) / n).toFixed(1);
  console.log(`${style.padEnd(7)} wins ${(100 * r.wins / n).toFixed(0)}%  waves avg ${avgW} (p10 ${q(r.waves, .1)}, p50 ${q(r.waves, .5)})  health p50 ${q(r.health, .5)}  leaks/game ${(r.leaks / n).toFixed(1)}  gold left p50 ${q(r.gold, .5)}`);
}
// per-wave death histogram for greedy
const r = TD.simulate(n, 99, 'smart'); const hist = {}; r.waves.forEach((w) => hist[w] = (hist[w] || 0) + 1);
console.log('smart waves-cleared histogram', hist);
