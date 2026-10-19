/* Tower Defense — placeholder score. © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
   Synthesized live with Web Audio: no audio files, nothing licensed. Built to sit under the cozy painted look
   (cottages, slate roofs, moss) until a composer scores the game.

   Two moods that cross-fade, plus short stingers:
     build  — the village: lute plucks and a soft recorder tune in D major, unhurried, lots of air.
     wave   — the road: same key, a low frame-drum pulse and a darker bass under it. Tense, not scary.
     stingers: 'clear' (wave held), 'grow' (the road grows), 'won', 'lost', 'leak' (a muffled thud).
   API: TDMusic.mood('build' | 'wave'), TDMusic.sting(name), TDMusic.set(on), TDMusic.on.
   Pattern from Trickbound's music.js (kit): lookahead scheduler, starts on the first tap, remembers on/off. */
(function () {
  'use strict';
  const KEY = 'td-music';
  let on = true; try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* default on */ }
  let ctx = null, out = null, bus = null, send = null, timer = null, step = 0, nextT = 0, mood = 'build';
  const BPM = 84, S16 = 60 / BPM / 4; // sixteenth-note grid
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // D major. Four-bar loop: D · Bm · G · A (build) / Bm · G · D · A (wave)
  const PROG = { build: [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]], wave: [[47, 50, 54], [43, 47, 50], [50, 54, 57], [45, 49, 52]] };
  // recorder tune for the village, one note per quarter (null = rest); 16 quarters = 4 bars
  const TUNE = [74, 76, 78, null, 76, 74, 71, null, 74, 71, 69, 67, 69, null, null, null];
  const MOODS = {
    build: { vol: 0.55, lute: 0.8, tune: 1, drum: 0, bass: 0.10 },
    wave:  { vol: 0.6, lute: 0.45, tune: 0, drum: 1, bass: 0.16 },
  };

  function impulse(sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    bus = ctx.createGain(); bus.gain.value = 0.6; bus.connect(out);
    const conv = ctx.createConvolver(); conv.buffer = impulse(2.8, 3); const wet = ctx.createGain(); wet.gain.value = 0.35;
    conv.connect(wet); wet.connect(out); send = conv;
    return true;
  }
  function env(t, vol, attack, dur) { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(bus); g.connect(send); return g; }
  function osc(type, f, t, dur, dest, det) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det || 0; o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
  // lute: bright pluck that darkens fast
  function lute(m, t, vol) {
    const g = env(t, vol, 0.004, 1.4); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(hz(m) * 8, t); lp.frequency.exponentialRampToValueAtTime(hz(m) * 1.5, t + 0.5); lp.connect(g);
    osc('triangle', hz(m), t, 1.4, lp, (Math.random() - 0.5) * 8); const h = ctx.createGain(); h.gain.value = 0.25; h.connect(lp); osc('sawtooth', hz(m), t, 0.3, h);
  }
  // recorder: breathy sine with a little vibrato
  function recorder(m, t, dur, vol) {
    const g = env(t, vol, 0.06, dur); const o = osc('sine', hz(m), t, dur, g);
    const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 5.2; vg.gain.value = 4; v.connect(vg); vg.connect(o.detune); v.start(t + 0.15); v.stop(t + dur);
    const n = ctx.createBufferSource(); n.buffer = impulse(0.25, 1); const ng = ctx.createGain(); ng.gain.value = 0.015; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = hz(m) * 2; n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t);
  }
  function bass(m, t, dur, vol) { const g = env(t, vol, 0.02, dur); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; lp.connect(g); osc('triangle', hz(m - 12), t, dur, lp); }
  // frame drum: pitched-down thump plus a skin slap
  function drum(t, vol, low) {
    const g = env(t, vol, 0.003, low ? 0.45 : 0.18); const o = osc('sine', low ? 90 : 160, t, 0.5, g); o.frequency.exponentialRampToValueAtTime(low ? 48 : 90, t + 0.2);
    const n = ctx.createBufferSource(); n.buffer = impulse(0.08, 2); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500; const ng = ctx.createGain(); ng.gain.value = vol * 0.4; n.connect(hp); hp.connect(ng); ng.connect(bus); n.start(t);
  }

  function schedule() {
    while (nextT < ctx.currentTime + 0.25) {
      const m = MOODS[mood], bar = Math.floor(step / 16) % 4, s = step % 16, chord = PROG[mood][bar];
      if (s === 0) bass(chord[0], nextT, 60 / BPM * 2, m.bass);
      if (s === 8) bass(chord[0] + (mood === 'wave' ? 0 : 7), nextT, 60 / BPM * 2, m.bass * 0.8);
      // lute arpeggio on eighths, a few left out so it breathes
      if (s % 2 === 0 && Math.random() < m.lute) lute(chord[(s / 2) % 3] + 12 + (s >= 8 && Math.random() < 0.3 ? 12 : 0), nextT + (Math.random() - 0.5) * 0.012, 0.05);
      if (m.tune && s % 4 === 0) { const n = TUNE[(bar * 4 + s / 4) % 16]; if (n) recorder(n, nextT, 60 / BPM * 0.95, 0.045); }
      if (m.drum) { if (s === 0 || s === 10) drum(nextT, 0.22, true); else if (s === 4 || s === 12) drum(nextT, 0.08, false); else if (s === 14 && bar === 3) drum(nextT, 0.1, false); }
      step++; nextT += S16;
    }
  }
  function start() {
    if (!init() || timer) return;
    ctx.resume(); nextT = ctx.currentTime + 0.1; out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(MOODS[mood].vol, ctx.currentTime, 1.2);
    timer = setInterval(schedule, 100);
  }
  function stop() { if (!ctx || !timer) return; clearInterval(timer); timer = null; out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(0, ctx.currentTime, 0.3); }
  function setMood(k) {
    if (!MOODS[k] || k === mood) return; mood = k;
    if (ctx && timer) { step = Math.ceil(step / 16) * 16; out.gain.setTargetAtTime(MOODS[k].vol, ctx.currentTime, 0.8); } // change on the next bar
  }
  const STINGS = {
    clear: [[74, 0], [78, 0.12], [81, 0.24], [86, 0.36]],
    grow: [[62, 0], [66, 0.18], [69, 0.36], [74, 0.54], [78, 0.72]],
    won: [[74, 0], [78, 0.15], [81, 0.3], [86, 0.45], [90, 0.6], [86, 0.9]],
    lost: [[69, 0], [65, 0.3], [62, 0.6], [57, 0.9]],
  };
  function sting(k) {
    if (!on || !ctx || !timer) return;
    const t = ctx.currentTime + 0.03;
    if (k === 'leak') { drum(t, 0.3, true); return; }
    (STINGS[k] || []).forEach(([m, d]) => lute(m, t + d, 0.09));
    if (k === 'won' || k === 'grow') recorder(STINGS[k].slice(-1)[0][0], t + STINGS[k].slice(-1)[0][1], 1.2, 0.05);
  }
  function set(v) { on = !!v; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* ignore */ } if (on) start(); else stop(); paint(); }
  // browsers only allow sound after a tap, so the score starts on the first one
  document.addEventListener('pointerdown', function first(e) { document.removeEventListener('pointerdown', first, true); if (on && e.target !== btn) start(); }, true);
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'music-btn'; btn.setAttribute('aria-label', 'Music on or off');
  btn.addEventListener('click', (e) => { e.stopPropagation(); set(!on); });
  function paint() { btn.textContent = '♪'; btn.title = on ? 'Music on (placeholder score)' : 'Music off'; btn.classList.toggle('off', !on); btn.setAttribute('aria-pressed', on); }
  paint(); document.body.appendChild(btn);
  window.TDMusic = { get on() { return on; }, set, mood: setMood, sting, get current() { return mood; } };
})();
