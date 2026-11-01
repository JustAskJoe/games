// Lane FM placeholder beat: an original funky breakbeat synthesized in WebAudio (no samples, no licensed music).
// Starts on the first tap (browsers block audio before that). ♪ toggles it.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';
const BPM = 98, STEP = 60 / BPM / 4; // 16th notes
// 16-step patterns: k = kick, s = snare, h = hat (o = open), b = bass note (semitones from A1), c = chord stab
const K = 'x.....x...x..x..', S = '....x.......x..x', H = 'x.x.x.xox.x.x.xo';
const BASS = [0, null, null, 0, null, null, 3, null, 5, null, null, 5, 7, null, 3, null];
const CH = '..x.......x.....', CHORDS = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 58, 62, 65], [52, 55, 59, 62]];
let ctx = null, on = false, next = 0, step = 0, bar = 0, timer = null, master = null;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function noise(t, len, hp, gain) {
  const b = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
  s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + len);
}
function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g).connect(master); o.start(t); o.stop(t + 0.3); }
function snare(t) { noise(t, 0.16, 1500, 0.45); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 190; g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(g).connect(master); o.start(t); o.stop(t + 0.1); }
function bass(t, semi) { const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(33 + semi); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(180, t + 0.18); g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24); o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + 0.25); }
function stab(t, notes) { for (const n of notes) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = mtof(n); g.gain.setValueAtTime(0.045, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.connect(g).connect(master); o.start(t); o.stop(t + 0.23); } }
function tick() {
  while (next < ctx.currentTime + 0.12) {
    const t = next, i = step % 16;
    if (K[i] === 'x') kick(t); if (S[i] === 'x') snare(t);
    if (H[i] !== '.') noise(t, H[i] === 'o' ? 0.12 : 0.035, 7000, 0.12);
    if (BASS[i] != null) bass(t, BASS[i]);
    if (CH[i] === 'x') stab(t, CHORDS[bar % 4]);
    next += STEP * (i % 2 ? 0.92 : 1.08); // swing
    step++; if (step % 16 === 0) bar++;
  }
}
// One-shot stingers for deals, grades and pack rips.
function sting(kind) {
  if (!ctx || !on) return; const t = ctx.currentTime + 0.01;
  const seq = { deal: [72, 76, 79], buy: [67, 72], walk: [60, 55], grade: [72, 76, 79, 84], rip: [79, 84, 88, 91], fake: [58, 52] }[kind] || [72];
  seq.forEach((n, k) => stab(t + k * 0.08, [n, n + 12]));
}
function start() {
  if (!ctx) { const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return; ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume();
  if (on) return; on = true; next = ctx.currentTime + 0.05; timer = setInterval(tick, 25);
}
function stop() { on = false; clearInterval(timer); }
root.MUSIC = { start, stop, sting, get on() { return on; } };
})(this);
