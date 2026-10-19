(function () {
  // Trickbound placeholder score: slow, grey, reverb-heavy mood music in the spirit of Disco Elysium's soundtrack,
  // synthesized with Web Audio (no audio files, nothing licensed). Two moods: the cold platform and the warm card room.
  // © 2026 F Lane d/b/a One Fifty Labs. All rights reserved. Placeholder until a composer scores the Line.
  const KEY = 'tb-music';
  let on = true; try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* default on */ }
  let ctx = null, out = null, dry = null, verb = null, timer = null, beat = 0, nextT = 0;
  let mood = 'platform', drone = null;
  const BPM = 50, SPB = 60 / BPM;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // D minor, slow: Dm · B♭maj7 · Fmaj7 · C(add9). Eight beats per chord.
  const ROOTS = [38, 34, 41, 36];
  const TONES = [[50, 53, 57, 62, 64, 69], [46, 50, 53, 57, 62, 65], [53, 57, 60, 64, 65, 69], [48, 55, 57, 60, 62, 67]];
  const MOTIF = [[69, 2], [67, 1], [65, 3], [64, 2], [62, 4]]; // piano fragment: [note, beats]
  const MOODS = {
    platform: { vol: 0.75, cutoff: 520, wet: 0.75, pluck: 0.22, piano: 0.07, drone: 0.11 }, // cold, empty
    depot: { vol: 0.8, cutoff: 900, wet: 0.55, pluck: 0.38, piano: 0.12, drone: 0.09 }, // stove, kettle, people
    table: { vol: 0.5, cutoff: 760, wet: 0.6, pluck: 0.2, piano: 0.05, drone: 0.08 }, // under the cards, stays out of the way
  };
  const M = () => MOODS[mood] || MOODS.platform;

  function impulse(sec, decay) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = 0.5; dry.connect(out);
    const conv = ctx.createConvolver(); conv.buffer = impulse(5.5, 2.6); verb = ctx.createGain(); verb.gain.value = M().wet;
    conv.connect(verb); verb.connect(out);
    ctx._send = conv;
    // drone: two detuned voices through a slowly breathing lowpass
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = M().cutoff; f.Q.value = 0.7;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.045; lfoG.gain.value = 160; lfo.connect(lfoG); lfoG.connect(f.frequency); lfo.start();
    const g = ctx.createGain(); g.gain.value = M().drone; f.connect(g); g.connect(dry); g.connect(conv);
    const a = ctx.createOscillator(), b = ctx.createOscillator(), c = ctx.createOscillator();
    a.type = 'sawtooth'; b.type = 'sawtooth'; c.type = 'sine'; b.detune.value = 9; a.detune.value = -7;
    const ag = ctx.createGain(); ag.gain.value = 0.35; a.connect(ag); b.connect(ag); ag.connect(f); c.connect(f);
    [a, b, c].forEach((o) => o.start());
    drone = { a, b, c, f, g };
    setRoot(ROOTS[0], ctx.currentTime);
    return true;
  }
  function setRoot(m, t) { drone.a.frequency.setTargetAtTime(hz(m), t, 1.5); drone.b.frequency.setTargetAtTime(hz(m + 7), t, 1.5); drone.c.frequency.setTargetAtTime(hz(m - 12), t, 1.5); }
  function voice(f, t, dur, vol, parts, attack) {
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(5000, f * 6), t); lp.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.5), t + dur);
    lp.connect(g); g.connect(dry); g.connect(ctx._send);
    parts.forEach(([mult, type, amp, det]) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = f * mult; o.detune.value = det || 0; og.gain.value = amp; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.1); });
  }
  // a dull, slightly out-of-tune guitar pluck
  const pluck = (m, t, vol) => voice(hz(m), t, 3.2, vol, [[1, 'triangle', 1, (Math.random() - 0.5) * 14], [2, 'sine', 0.35], [3, 'sine', 0.12]], 0.006);
  // a soft, distant piano note
  const piano = (m, t, vol, beats) => voice(hz(m), t, Math.max(2.5, beats * SPB * 1.6), vol, [[1, 'sine', 1], [2, 'sine', 0.28], [4, 'sine', 0.06]], 0.012);

  let motifAt = -1;
  function schedule() {
    while (nextT < ctx.currentTime + 0.4) {
      const m = M(), chord = Math.floor(beat / 8) % 4, inChord = beat % 8, tones = TONES[chord];
      if (inChord === 0) setRoot(ROOTS[chord], nextT);
      // plucks: sparse, a little more often in the card room, never on every beat
      if (Math.random() < m.pluck) {
        const n = tones[Math.floor(Math.random() * tones.length)] + (Math.random() < 0.2 ? 12 : 0);
        const t = nextT + Math.random() * SPB * 0.4; pluck(n, t, 0.07 + Math.random() * 0.05);
        if (Math.random() < 0.25) pluck(n + (Math.random() < 0.5 ? 3 : 5), t + SPB * 0.5, 0.05); // a second, answering note
      }
      // the piano fragment comes back every so often, then leaves
      if (motifAt < 0 && inChord === 0 && Math.random() < m.piano * 2.2) motifAt = 0;
      if (motifAt >= 0) {
        let acc = 0, k = 0; while (k < MOTIF.length && acc < motifAt) { acc += MOTIF[k][1]; k++; }
        if (acc === motifAt && k < MOTIF.length) piano(MOTIF[k][0] - (chord === 1 ? 2 : 0), nextT, 0.09, MOTIF[k][1]);
        motifAt++; if (motifAt > 14) motifAt = -1;
      }
      beat++; nextT += SPB * (0.96 + Math.random() * 0.08); // loose, human time
    }
  }
  function applyMood(t) {
    const m = M(); if (!ctx) return;
    drone.f.frequency.setTargetAtTime(m.cutoff, t, 2); drone.g.gain.setTargetAtTime(m.drone, t, 2); verb.gain.setTargetAtTime(m.wet, t, 2);
    if (timer) out.gain.setTargetAtTime(m.vol, t, 1.5);
  }
  function start() {
    if (!init() || timer) return;
    ctx.resume(); nextT = ctx.currentTime + 0.2; out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(M().vol, ctx.currentTime, 1.8);
    timer = setInterval(schedule, 120);
  }
  function stop() {
    if (!ctx || !timer) return; clearInterval(timer); timer = null;
    out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  }
  function set(v) { on = v; try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { /* ignore */ } if (v) start(); else stop(); paint(); }
  function setMood(k) { if (!MOODS[k] || k === mood) return; mood = k; if (ctx) applyMood(ctx.currentTime); }
  // browsers only allow sound after a tap, so the score starts on the first one
  document.addEventListener('pointerdown', function first() { document.removeEventListener('pointerdown', first, true); if (on) start(); }, true);
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'music-btn'; btn.setAttribute('aria-label', 'Music');
  btn.addEventListener('click', (e) => { e.stopPropagation(); set(!on); });
  function paint() { btn.textContent = '♪'; btn.title = on ? 'Music on (placeholder score)' : 'Music off'; btn.classList.toggle('off', !on); }
  paint(); document.body.appendChild(btn);
  window.TBMusic = { get on() { return on; }, set, mood: setMood, get current() { return mood; } };
})();
