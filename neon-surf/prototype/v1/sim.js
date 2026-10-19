const S = require('./engine.js');
const bots = { pro: { timingSd: 0.025, steerLag: 0.15, laneSd: 0.03 }, casual: { timingSd: 0.055, steerLag: 0.22, laneSd: 0.05, forget: 0.04 }, newbie: { timingSd: 0.09, steerLag: 0.3, laneSd: 0.07, forget: 0.1 }, newbieEasy: { timingSd: 0.09, steerLag: 0.3, laneSd: 0.07, forget: 0.1, easy: true } };
for (const mode of ['test', 'song']) {
  S.configure({ mode, bpm: 101, end: mode === 'song' ? 192 : undefined });
  const by = {}; S.buildChart().forEach(n => by[n.type] = (by[n.type] || 0) + 1);
  console.log('\n' + mode, S.DURATION.toFixed(1) + 's', by);
  for (const [k, b] of Object.entries(bots)) { const r = S.simulate(20, 11, b); console.log(' ', k.padEnd(11), 'acc', (r.acc * 100).toFixed(0) + '%', 'miss', r.miss.toFixed(1), 'wide', r.wide.toFixed(1), 'spray', (r.spray * 100).toFixed(0) + '%', JSON.stringify(r.grades)); }
}
// beat detection on a synthetic track: 101.2 BPM, first beat at 0.37s, noise bed
const sr = 22050, bpm = 101.2, off = 0.37, dur = 60, x = new Float32Array(sr * dur);
for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * 0.02;
for (let b = 0; off + b * 60 / bpm < dur - 1; b++) {
  const s0 = Math.round((off + b * 60 / bpm) * sr), snare = b % 2 === 1;
  for (let i = 0; i < sr * 0.15; i++) { const e = Math.exp(-i / (sr * 0.03)); x[s0 + i] += snare ? (Math.random() * 2 - 1) * 0.6 * e : Math.sin(2 * Math.PI * (60 + 80 * Math.exp(-i / 800)) * i / sr) * 0.8 * e; }
  if (b % 1 === 0) { const h = Math.round((off + (b + 0.5) * 60 / bpm) * sr); for (let i = 0; i < sr * 0.03; i++) x[h + i] += (Math.random() * 2 - 1) * 0.15 * Math.exp(-i / 200); }
}
const t0 = Date.now(), d = S.detectBeat(x, sr);
console.log('\ndetect', d, 'expected bpm', bpm, 'first', off, 'took', Date.now() - t0, 'ms');
