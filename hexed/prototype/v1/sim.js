const HX = require('./engine.js');
const n = +process.argv[2] || 60; const skill = process.argv[3] || 'casual';
const only = process.argv[4] !== undefined ? [+process.argv[4]] : HX.LEVELS.map((_, i) => i);
for (const i of only) { const t = Date.now(); const r = HX.simulate(i, n, 1000, skill); console.log(i, r.level.padEnd(20), 'win', (r.winRate*100).toFixed(0)+'%', 'medLeft', r.medianMovesLeft, 'bonus', (r.bonusRate*100).toFixed(0)+'%', 'stars', r.stars.join('/'), (Date.now()-t)+'ms'); }
