// Lightkeeper audio: everything is synthesized with WebAudio. No samples, no licensed music.
// Sea wash (filtered noise), a slow minor drone, a bell per boat home that climbs the scale,
// a wooden knock for a wreck, a foghorn, gust whooshes, and a major chord when every boat is home.
// © 2026 justaskjoe. All rights reserved.
(function () {
  'use strict';
  let ac = null, master = null, on = true, bed = null;
  // A natural minor, climbing; the win chord lifts to A major.
  const SCALE = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ac = new AC(); master = ac.createGain(); master.gain.value = on ? 0.9 : 0; master.connect(ac.destination);
    return ac;
  }
  function noiseBuf(sec) { const b = ac.createBuffer(1, Math.floor(ac.sampleRate * sec), ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function env(g, t, a, peak, d) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }

  function startBed() {
    if (!ensure() || bed) return;
    const t = ac.currentTime;
    const n = ac.createBufferSource(); n.buffer = noiseBuf(3); n.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const g = ac.createGain(); g.gain.value = 0.07;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.09; const lg = ac.createGain(); lg.gain.value = 0.045; lfo.connect(lg); lg.connect(g.gain);
    n.connect(lp); lp.connect(g); g.connect(master); n.start(t); lfo.start(t);
    const dg = ac.createGain(); dg.gain.value = 0.0001; dg.gain.exponentialRampToValueAtTime(0.028, t + 3);
    const dl = ac.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 700; dl.connect(dg); dg.connect(master);
    const oscs = [110, 164.81, 110.4].map((f, i) => { const o = ac.createOscillator(); o.type = i === 1 ? 'triangle' : 'sine'; o.frequency.value = f; o.connect(dl); o.start(t); return o; });
    bed = { n, lfo, oscs, dg };
  }

  function bell(i) {
    if (!ensure()) return; const t = ac.currentTime, f = SCALE[Math.min(SCALE.length - 1, Math.max(0, i))];
    [[1, 0.16, 2.2], [2.76, 0.05, 0.9], [5.4, 0.02, 0.4]].forEach(([m, p, d]) => {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f * m; o.connect(g); g.connect(master); env(g, t, 0.006, p, d); o.start(t); o.stop(t + d + 0.1);
    });
  }
  function knock() {
    if (!ensure()) return; const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.25); o.connect(g); g.connect(master); env(g, t, 0.004, 0.35, 0.3); o.start(t); o.stop(t + 0.4);
    const n = ac.createBufferSource(); n.buffer = noiseBuf(0.3); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 1.2;
    const ng = ac.createGain(); n.connect(bp); bp.connect(ng); ng.connect(master); env(ng, t, 0.003, 0.3, 0.22); n.start(t);
  }
  function horn() {
    if (!ensure()) return; const t = ac.currentTime;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 360; lp.Q.value = 2;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.18); g.gain.setValueAtTime(0.22, t + 1.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    lp.connect(g); g.connect(master);
    [98, 103.6].forEach(f => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + 1.8); });
  }
  function gust() {
    if (!ensure()) return; const t = ac.currentTime;
    const n = ac.createBufferSource(); n.buffer = noiseBuf(1.3); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(1300, t + 0.6); bp.frequency.exponentialRampToValueAtTime(400, t + 1.2);
    const g = ac.createGain(); n.connect(bp); bp.connect(g); g.connect(master); env(g, t, 0.35, 0.16, 0.9); n.start(t);
  }
  function chord(won) {
    if (!ensure()) return; const t = ac.currentTime;
    const notes = won ? [220, 277.18, 329.63, 440, 554.37] : [146.83, 174.61];
    notes.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = won ? 'sine' : 'triangle'; o.frequency.value = f; o.connect(g); g.connect(master); const s = t + i * (won ? 0.09 : 0.35); env(g, s, 0.02, won ? 0.09 : 0.08, won ? 3 : 1.4); o.start(s); o.stop(s + 3.2); });
  }
  function tick() {
    if (!ensure()) return; const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = 1320; o.connect(g); g.connect(master); env(g, t, 0.003, 0.03, 0.12); o.start(t); o.stop(t + 0.2);
  }
  function setOn(v) { on = !!v; if (master) master.gain.setTargetAtTime(on ? 0.9 : 0, ac.currentTime, 0.05); }

  window.LKA = { ensure, startBed, bell, knock, horn, gust, chord, tick, setOn, get on() { return on; } };
})();
