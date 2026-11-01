/* Cyberpunk Gate Runner, Prototype 2: melodic house synth, steering input, screens. render.js draws the street.
   The game clock IS the song clock: the engine advances to "song time as heard", so gates land on the beat.
   Audio clock pattern (getOutputTimestamp, lookahead scheduler, per-run bus) adapted from Neon Surf v1.
   © 2026 justaskjoe. All rights reserved. */
(function () {
  const GR = window.GR, $ = id => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Space Grotesk", system-ui, sans-serif';
  const U = { G: null, playing: false, paused: false, evi: 0, popups: [], queue: [], fdt: 0.016, flash: 0, shake: 0, muted: false,
    drag: null, lastSent: null, endAt: 0, lastRes: null, test: false, fb: {}, attract0: performance.now(), hintFlash: 0 };
  window.GRUI = { U, A: null };
  try { U.muted = localStorage.getItem('grMuted') === '1'; } catch (e) {}

  // ================= audio: original melodic house at 122 BPM, every sound synthesized here =================
  const A = { ctx: null, out: null, music: null, sfx: null, bus: null, noise: null, events: [], ptr: 0, timer: null, t0: 0 };
  function audioInit() {
    if (A.ctx) return A.ctx;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    A.ctx = new C({ latencyHint: 'interactive' });
    const comp = A.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 8; comp.attack.value = 0.004; comp.release.value = 0.12;
    A.out = A.ctx.createGain(); A.out.gain.value = U.muted ? 0 : 0.7; A.out.connect(comp); comp.connect(A.ctx.destination);
    A.sfx = A.ctx.createGain(); A.sfx.gain.value = 1; A.sfx.connect(A.out);
    A.shots = A.ctx.createGain(); A.shots.gain.value = 1.3; A.shots.connect(A.sfx);   // one dial for how loud gunfire sits against the song
    const len = A.ctx.sampleRate, b = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noise = b; return A.ctx;
  }
  window.GRUI.A = A; window.GRUI.audioErrs = [];
  const X = () => A.ctx;
  // kick -> bus stays clean and on top. Everything else goes through one filter that opens across the song, and pumps with the kick
  function newBus() {
    if (A.bus) { try { A.bus.disconnect(); } catch (e) {} }
    const c = A.ctx;
    A.bus = c.createGain(); A.bus.connect(A.out);
    A.kick = c.createGain(); A.kick.connect(A.bus);
    A.synth = c.createGain(); A.filt = c.createBiquadFilter(); A.filt.type = 'lowpass'; A.filt.Q.value = 0.7; A.synth.connect(A.filt); A.filt.connect(A.bus);
    A.wet = c.createGain();                                              // plucks and the lead send here: echo plus a soft room
    const echo = c.createDelay(1), fb = c.createGain(), tone = c.createBiquadFilter(), room = c.createConvolver(), rg = c.createGain();
    echo.delayTime.value = GR.B * 0.75; fb.gain.value = 0.34; tone.type = 'lowpass'; tone.frequency.value = 2800;
    A.wet.connect(echo); echo.connect(tone); tone.connect(fb); fb.connect(echo); tone.connect(A.synth);
    room.buffer = roomIR(); rg.gain.value = 0.5; A.wet.connect(room); room.connect(rg); rg.connect(A.synth);
  }
  function roomIR() {
    if (A.ir) return A.ir; const c = A.ctx, n = Math.floor(c.sampleRate * 1.4), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < n; i++) { lp += (Math.random() * 2 - 1 - lp) * 0.3; d[i] = lp * Math.pow(1 - i / n, 3) * 0.5; } }
    return (A.ir = b);
  }
  const pan = (p, dest) => { if (!X().createStereoPanner) return dest; const n = X().createStereoPanner(); n.pan.value = p; n.connect(dest); return n; };
  function envG(t, a, peak, dec, dest) { const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak, t + a); gn.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); gn.connect(dest || A.bus); return gn; }
  function noiseSrc(t, dur) { const s = X().createBufferSource(); s.buffer = A.noise; s.loop = true; s.start(t, Math.random() * 0.5); s.stop(t + dur); return s; }
  function osc(type, fr, t, dur, dest, det) { const o = X().createOscillator(); o.type = type; o.frequency.value = fr; if (det) o.detune.value = det; o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
  // A track is plain data, so each street brings its own: chords (voiced notes in Hz), bass roots, an arp shape over the chord tones,
  // a stab rhythm in beats, and a hook as [beat, semitones above the base note, beats long] for each chord. Optional: lead (the hook's
  // voice), bass (offsets in a beat and octave), half (half-time clap), sparse (no 16th hats at the drop). All written for this game.
  const Hz = m => 440 * Math.pow(2, (m - 69) / 12), HZ = a => a.map(Hz);
  const TRACKS = {
    neon: {
      chords: [[220, 261.6, 329.6, 440], [174.6, 220, 261.6, 349.2], [196, 261.6, 329.6, 392], [196, 246.9, 293.7, 392]],   // Am F C G: minor, but it keeps lifting
      roots: [55, 43.65, 65.41, 49], base: 440,
      arp: [0, 1, 2, 3, 4, 3, 2, 1], stabs: [0.5, 1.5, 2.75, 3.5],
      hook: [[[0, 12, 0.75], [0.75, 7, 0.75], [1.5, 10, 0.5], [2, 12, 0.5], [3, 15, 1]],
        [[0, 12, 0.75], [0.75, 8, 0.75], [1.5, 10, 0.5], [2, 12, 0.5], [3, 7, 1]],
        [[0, 7, 0.75], [0.75, 3, 0.75], [1.5, 7, 0.5], [2, 10, 0.5], [3, 12, 1]],
        [[0, 10, 1.5], [1.5, 7, 0.5], [2, 5, 1], [3, 2, 1]]]
    },
    yards: { // C minor at 124: a bouncy pluck lead and a busier bass
      chords: [[60, 63, 67, 72], [58, 63, 67, 70], [58, 62, 65, 70], [56, 60, 63, 68]].map(HZ), roots: HZ([36, 39, 34, 32]), base: Hz(72),
      arp: [0, 2, 1, 3, 0, 2, 4, 2], stabs: [0.5, 1.25, 2.5, 3.25], bass: [[0.25, 1], [0.5, 1], [0.75, 2]],
      lead: { osc: [['triangle', 0], ['square', 7]], cut: 4200, atk: 0.004, v: 0.95, glide: 1 },
      hook: [[[0, 0, 0.5], [0.75, 3, 0.5], [1.5, 7, 0.5], [2.25, 5, 0.5], [3, 3, 1]],
        [[0, 3, 0.5], [0.75, 7, 0.5], [1.5, 10, 0.5], [2.25, 7, 0.5], [3, 10, 1]],
        [[0, -2, 0.5], [0.75, 2, 0.5], [1.5, 5, 0.5], [2.25, 7, 0.5], [3, 5, 1]],
        [[0, -4, 0.5], [0.75, 0, 0.5], [1.5, 3, 0.5], [2.25, 0, 0.5], [3, -2, 1]]]
    },
    glass: { // E minor at 120: a glassy bell lead with long notes and plenty of space
      chords: [[64, 67, 71, 76], [62, 66, 69, 74], [60, 64, 67, 72], [62, 67, 71, 74]].map(HZ), roots: HZ([40, 35, 36, 43]), base: Hz(76),
      arp: [0, 1, 2, 3, 2, 1, 4, 1], stabs: [1.5, 3.5], sparse: true,
      lead: { osc: [['sine', 0], ['triangle', 12]], cut: 6000, atk: 0.003, v: 1.25, glide: 1 },
      hook: [[[0, 7, 1.5], [1.5, 3, 0.5], [2, 0, 2]], [[0, 7, 1], [1, 10, 1], [2, 14, 2]], [[0, 8, 1], [1, 7, 1], [2, 3, 2]], [[0, 3, 1], [1, 7, 1], [2, 10, 2]]]
    },
  };
  // streets past the table reuse a song in a new key
  function trackFor(def) {
    const T = TRACKS[def.track], k = Math.pow(2, (def.transpose || 0) / 12);
    return k === 1 ? T : Object.assign({}, T, { chords: T.chords.map(c => c.map(f => f * k)), roots: T.roots.map(f => f * k), base: T.base * k });
  }
  const semi = (f, n) => f * Math.pow(2, n / 12);
  // how far the song's filter is open at the start of a bar: soft intro, opening build, sweep up the riser, wide open drop
  const cutAt = bar => bar < 4 ? 520 + bar * 90 : bar < 12 ? 950 + (bar - 4) * 240 : bar < GR.DROP_BAR ? 2900 + (bar - 12) * 1400 : bar < GR.DROP_BAR + GR.level.drop ? 16000 : 1000;
  const SND = {
    kick(t, v = 1) {
      const o = X().createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.08); o.connect(envG(t, 0.001, 1.05 * v, 0.28, A.kick)); o.start(t); o.stop(t + 0.34);
      const c = X().createOscillator(); c.type = 'triangle'; c.frequency.value = 1800; c.connect(envG(t, 0.001, 0.06 * v, 0.01, A.kick)); c.start(t); c.stop(t + 0.03);
      const d = A.synth.gain; d.cancelScheduledValues(t); d.setValueAtTime(0.34, t); d.linearRampToValueAtTime(1, t + 0.32);  // the pump
    },
    clap(t, v = 1) { for (const [dt, pk] of [[0, 0.3], [0.011, 0.26], [0.023, 0.32]]) { const n = noiseSrc(t + dt, 0.2), f = X().createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 0.9; n.connect(f); f.connect(envG(t + dt, 0.001, pk * v, 0.12)); } },
    snare(t, v = 1) { const n = noiseSrc(t, 0.12), f = X().createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.7; n.connect(f); f.connect(envG(t, 0.001, 0.2 * v, 0.08)); osc('triangle', 210, t, 0.07, envG(t, 0.001, 0.14 * v, 0.07)); },
    hat(t, v = 1, open) { const n = noiseSrc(t, open ? 0.2 : 0.05), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = open ? 7000 : 9000; n.connect(f); f.connect(envG(t, 0.001, (open ? 0.11 : 0.05) * v, open ? 0.14 : 0.03)); },
    crash(t) { const n = noiseSrc(t, 2), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4500; n.connect(f); f.connect(envG(t, 0.002, 0.16, 1.8)); },
    boom(t) { const o = X().createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.9); o.connect(envG(t, 0.004, 0.7, 1.1, A.kick)); o.start(t); o.stop(t + 1.3); },
    // warm and round: a soft triangle over a sine sub, no distortion
    bass(t, fr, dur) {
      const gn = envG(t, 0.006, 0.34, dur, A.synth), f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 620; f.connect(gn);
      osc('triangle', fr * 2, t, dur, f); osc('sine', fr, t, dur, gn);
    },
    // wide detuned saws, one pair panned hard apart
    stab(t, notes, v = 1) {
      const gn = envG(t, 0.005, 0.06 * v, 0.24, A.synth), l = pan(-0.7, gn), r = pan(0.7, gn);
      for (const fr of notes) { osc('sawtooth', fr, t, 0.3, l, -11); osc('sawtooth', fr, t, 0.3, r, 11); }
    },
    pad(t, notes, dur, v = 1) {
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.035 * v, t + 0.5); gn.gain.setValueAtTime(0.035 * v, t + dur - 0.3); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); gn.connect(A.synth);
      const l = pan(-0.8, gn), r = pan(0.8, gn); for (const fr of notes) { osc('sawtooth', fr / 2, t, dur, l, -8); osc('sawtooth', fr / 2, t, dur, r, 8); }
    },
    // glassy: a sine and a quiet octave triangle with a fast fall, sent to the echo
    pluck(t, fr, v, side) {
      const gn = envG(t, 0.002, 0.075 * v, 0.2, pan(side, A.synth)); gn.connect(A.wet);
      osc('sine', fr, t, 0.24, gn); osc('triangle', fr * 2, t, 0.1, envG(t, 0.001, 0.02 * v, 0.08, gn));
    },
    // the hook: a rounded square and a soft saw, a touch of glide, plenty of echo
    lead(t, fr, dur, v = 1) {
      const L = U.T.lead || { osc: [['square', -5], ['sawtooth', 5]], cut: 3000, atk: 0.012, v: 1, glide: 0.985 }; v *= L.v;
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.1 * v, t + L.atk); gn.gain.setValueAtTime(0.1 * v, t + Math.max(0.02, dur - 0.06)); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08); gn.connect(A.synth); gn.connect(A.wet);
      const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = L.cut; f.connect(gn);
      for (const [type, det] of L.osc) { const o = X().createOscillator(); o.type = type; o.detune.value = det; o.frequency.setValueAtTime(fr * L.glide, t); o.frequency.exponentialRampToValueAtTime(fr, t + 0.03); o.connect(f); o.start(t); o.stop(t + dur + 0.12); }
    },
    riser(t, dur) {
      const n = noiseSrc(t, dur), f = X().createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.14, t + dur); n.connect(f); f.connect(gn); gn.connect(A.bus);
    },
    // light rain and a little vinyl crackle for the quiet ends of the song
    rain(t, dur) {
      const n = noiseSrc(t, dur), hi = X().createBiquadFilter(), lo = X().createBiquadFilter(), gn = X().createGain(); hi.type = 'highpass'; hi.frequency.value = 1500; lo.type = 'lowpass'; lo.frequency.value = 7000;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.022, t + 1); gn.gain.setValueAtTime(0.022, t + dur - 1); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(hi); hi.connect(lo); lo.connect(gn); gn.connect(A.bus);
      for (let i = 0; i < dur * 5; i++) { const at = t + Math.random() * dur, c = noiseSrc(at, 0.01), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500; c.connect(f); f.connect(envG(at, 0.0005, 0.02 + Math.random() * 0.03, 0.006)); }
    },
    filt(t, to, dur) { const f = A.filt.frequency; f.setValueAtTime(f.value, t); f.exponentialRampToValueAtTime(to, t + dur); }
  };
  function buildSong(T) {
    const ev = [], at = (b, fn, ...a) => ev.push({ t: b * GR.B, fn, a });
    const db = GR.DROP_BAR, de = db + GR.level.drop, last = de + 3, BS = T.bass || [[0.5, 1], [0.75, 2]];
    for (let bar = 0; bar < last; bar++) {
      const s = GR.sectionAt(bar * GR.BAR + 0.001).id, ci = bar % 4, b0 = bar * 4, notes = T.chords[ci], rt = T.roots[ci];
      const drums = s === 'build' || s === 'riser' || s === 'drop', fill = bar === 19;  // the kick and bass drop out for the last bar of the riser
      at(b0, 'filt', cutAt(bar + 1), GR.BAR);
      if (bar < last - 1 && !fill) for (let q = 0; q < 4; q++) at(b0 + q, 'kick', s === 'intro' ? 0.75 : s === 'outro' ? 0.8 : 1);
      if (s !== 'riser' || bar < 16) at(b0, 'pad', notes, GR.BAR, s === 'drop' ? 1.2 : 1);
      if (drums) for (let q = 0; q < 4; q++) {
        at(b0 + q + 0.5, 'hat', s === 'drop' ? 1.1 : 0.9, true);
        if (s === 'drop' && !T.sparse) { at(b0 + q + 0.25, 'hat', 0.8); at(b0 + q + 0.75, 'hat', 0.8); }
        if ((T.half ? q === 2 : q === 1 || q === 3) && !(s === 'riser' && bar >= 18)) at(b0 + q, 'clap');
        if (!fill) for (const [off, oc] of BS) at(b0 + q + off, 'bass', rt * (oc === 2 && q === 3 ? 1.5 : oc), GR.B * 0.24);
      }
      if (drums) for (const k of T.stabs) if (s !== 'build' || k === 1.5 || k === 3.5) at(b0 + k, 'stab', notes, s === 'drop' ? 1.2 : s === 'riser' ? 1 : 0.85);
      // arps: a hint in the intro, then rolling 16ths from the end of the build
      const arpOn = s === 'drop' || s === 'riser' || bar >= 8 && s === 'build';
      if (arpOn || (s === 'intro' && bar >= 2)) { const step = arpOn ? 0.25 : 0.5, v = s === 'drop' ? 1 : s === 'riser' ? 0.6 + (bar - 12) * 0.05 : 0.5; for (let k = 0; k * step < 4; k++) { const n = T.arp[k % T.arp.length], fr = n > 3 ? notes[0] * 4 : notes[n] * 2; at(b0 + k * step, 'pluck', fr, v, k % 2 ? 0.45 : -0.45); } }
      if (s === 'drop') for (const [b, st, len] of T.hook[ci]) { at(b0 + b, 'lead', semi(T.base, st), len * GR.B, bar < db + 4 ? 0.9 : 1); if (bar >= db + 4) at(b0 + b, 'lead', semi(T.base, st + 12), len * GR.B, 0.3); }
      if (bar === de) for (const [b, st, len] of T.hook[0]) at(b0 + b, 'lead', semi(T.base, st), len * GR.B, 0.4);   // the hook once more, soft, on the way out
      if (bar === 18) for (let k = 0; k < 8; k++) at(b0 + k * 0.5, 'snare', 0.4 + k * 0.05);
      if (fill) for (let k = 0; k < 16; k++) at(b0 + k * 0.25, 'snare', 0.55 + k * 0.03);
      if ([4, 12, db, de].includes(bar)) at(b0, 'crash');
    }
    at(0, 'rain', GR.BAR * 4.5); at(de * 4, 'rain', GR.BAR * 3);
    at(12 * 4, 'riser', GR.BAR * 8); at(db * 4, 'boom');
    ev.sort((a, b) => a.t - b.t); return ev;
  }
  function startClock(events, offset) {
    newBus(); A.filt.frequency.value = cutAt(Math.floor(offset / GR.BAR)); A.events = events; A.ptr = 0;
    while (A.ptr < events.length && events[A.ptr].t < offset - 0.01) A.ptr++;
    A.t0 = A.ctx.currentTime + 0.45 - offset;
    clearInterval(A.timer); A.timer = setInterval(sched, 25); sched();
  }
  function sched() {
    if (!A.ctx || A.ctx.state !== 'running' || !A.bus) return;
    const now = A.ctx.currentTime - A.t0;
    while (A.ptr < A.events.length && A.events[A.ptr].t < now + 0.22) { const e = A.events[A.ptr++]; if (e.t >= now - 0.03) { try { SND[e.fn](A.t0 + e.t, ...e.a); } catch (er) { window.GRUI.audioErrs.push(e.fn + ': ' + er.message); } } }
  }
  function stopClock(fade) {
    clearInterval(A.timer); A.timer = null;
    if (A.bus) { const b = A.bus; A.bus = null; if (fade && A.ctx) { try { b.gain.setTargetAtTime(0.0001, A.ctx.currentTime, 0.25); setTimeout(() => { try { b.disconnect(); } catch (e) {} }, 1500); } catch (e) {} } else { try { b.disconnect(); } catch (e) {} } }
  }
  function songAt(perfMs) {
    const c = A.ctx; if (!c || U.noAudio) return (perfMs - U.clock0) / 1000;
    if (c.getOutputTimestamp) { const ts = c.getOutputTimestamp(); if (ts.performanceTime) return ts.contextTime + (perfMs - ts.performanceTime) / 1000 - A.t0; }
    return c.currentTime - (c.outputLatency || c.baseLatency || 0) + (perfMs - performance.now()) / 1000 - A.t0;
  }
  // sound effects play right away on the sfx bus (gates already land on the beat)
  function sfx(kind, n) { try { sfx0(kind, n); } catch (e) {} }
  // every gun has its own shot, on the song's eighth notes and pitched to the chord playing now, so gunfire joins the track
  function shot(t, d, n) {
    const w = U.G.weapon, M = U.G.mod, T = U.T, ci = Math.floor(U.G.t / GR.BAR) % 4, notes = T.chords[ci], root = T.roots[ci], beat = n % 2 === 0, B = GR.B;
    const sweep = (type, a, b, dur, v, cut, at) => { const s = at || t, o = X().createOscillator(), f = X().createBiquadFilter(); o.type = type; o.frequency.setValueAtTime(a, s); o.frequency.exponentialRampToValueAtTime(b, s + dur); f.type = 'lowpass'; f.frequency.value = cut || 6000; o.connect(f); f.connect(envG(s, 0.002, v, dur, d)); o.start(s); o.stop(s + dur + 0.04); };
    const hiss = (type, fr, q, dur, v) => { const s = noiseSrc(t, dur + 0.04), f = X().createBiquadFilter(); f.type = type; f.frequency.value = fr; f.Q.value = q; s.connect(f); f.connect(envG(t, 0.002, v, dur, d)); };
    if (w === 'pulse') { const fr = notes[0] * 2; sweep('square', fr * 2.5, fr, 0.05, 0.09, 3200); sweep('square', fr * 2.5, fr, 0.05, 0.06, 3200, t + B / 4); }
    else if (w === 'arc') { const fr = notes[beat ? 1 : 2] * 3; hiss('bandpass', M === 1 ? 5200 : 3400, 6, 0.07, beat ? 0.24 : 0.14); sweep('sawtooth', fr * 1.4, fr, 0.07, M === 0 ? 0.1 : 0.06, 4200); }
    else if (w === 'scatter') { if (beat) { hiss('lowpass', M === 1 ? 4200 : 2600, 0.7, M === 0 ? 0.1 : 0.07, M === 0 ? 0.28 : 0.2); sweep('triangle', root * 4, root * 2, 0.08, 0.26); } else hiss('highpass', 3000, 0.7, 0.03, 0.07); }
    else if (w === 'rail') {
      if (n % 8 === 7) sweep('sine', notes[0], notes[0] * 4, B / 2, 0.08, 5000);      // the whine climbing into the big shot
      if (n % 8 === 0) { sweep('sawtooth', notes[3] * (M === 0 ? 2 : 3), root * 2, 0.2, 0.14, 4200); hiss('highpass', 4500, 0.7, 0.07, 0.16); } else hiss('highpass', 6000, 0.7, 0.02, 0.05);
    } else if (w === 'rocket') { sweep('sine', root * 4, root * 2, 0.12, 0.22); hiss('bandpass', M === 1 ? 2200 : 1100, 1.2, 0.1, 0.09); sweep('sine', root * 2, root, 0.22, M === 0 ? 0.34 : 0.24, 900, t + 0.3); }
  }
  // the song dips for a moment so a gate is always heard
  function duck(t) { if (!A.bus) return; const g = A.bus.gain; g.cancelScheduledValues(t); g.setValueAtTime(1, t); g.linearRampToValueAtTime(0.55, t + 0.02); g.linearRampToValueAtTime(1, t + 0.32); }
  function sfx0(kind, n) {
    if (!A.ctx || A.ctx.state !== 'running') return;
    const t = A.ctx.currentTime + 0.01, d = A.sfx;
    if (kind === 'good' || kind === 'bad') duck(t);
    if (kind === 'good') { const n = noiseSrc(t, 0.22), f = X().createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(5200, t + 0.18); n.connect(f); f.connect(envG(t, 0.01, 0.22, 0.2, d)); [659.3, 880, 1318.5].forEach((fr, i) => osc('square', fr, t + i * 0.055, 0.14, envG(t + i * 0.055, 0.003, 0.13, 0.15, d))); }
    else if (kind === 'bad') { const o = X().createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.3); const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; o.connect(f); f.connect(envG(t, 0.005, 0.3, 0.3, d)); o.start(t); o.stop(t + 0.4); }
    else if (kind === 'kill') { if (t - (A.lastKill || 0) < 0.05) return; A.lastKill = t; osc('square', [880, 1046.5, 1318.5, 1568][(Math.random() * 4) | 0], t, 0.05, envG(t, 0.002, 0.04, 0.05, d)); }
    else if (kind === 'shot') shot(t, A.shots, n);
    else if (kind === 'runner') osc('triangle', 1318.5, t, 0.08, envG(t, 0.002, 0.06, 0.08, d));
    else if (kind === 'hurt') { const n = noiseSrc(t, 0.15), f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; n.connect(f); f.connect(envG(t, 0.002, 0.25, 0.14, d)); }
    else if (kind === 'weapon') { const nt = U.T.chords[Math.floor(U.G.t / GR.BAR) % 4], ty = { arc: 'sawtooth', scatter: 'square', rail: 'sine', rocket: 'triangle' }[U.G.weapon] || 'square'; [nt[0] * 2, nt[1] * 2, nt[2] * 2, nt[3] * 2].forEach((fr, i) => osc(ty, fr, t + i * 0.06, 0.11, envG(t + i * 0.06, 0.003, 0.09, 0.11, d))); }
    else if (kind === 'armorOff') { const nt = U.T.chords[Math.floor(U.G.t / GR.BAR) % 4]; nt.forEach((fr, i) => osc('triangle', fr * 2, t + i * 0.04, 0.2, envG(t + i * 0.04, 0.003, 0.1, 0.2, d))); }
    else if (kind === 'armorOn') { const o = X().createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.2); const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500; o.connect(f); f.connect(envG(t, 0.004, 0.12, 0.2, d)); o.start(t); o.stop(t + 0.28); }
    else if (kind === 'slam') { const o = X().createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25); o.connect(envG(t, 0.002, 0.42, 0.28, d)); o.start(t); o.stop(t + 0.34); }
    else if (kind === 'swap') { const n = noiseSrc(t, 0.14), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3200; n.connect(f); f.connect(envG(t, 0.002, 0.16, 0.12, d)); }
    else if (kind === 'bossDown') { [220, 329.6, 440, 659.3].forEach(fr => osc('sawtooth', fr, t, 1, envG(t, 0.01, 0.03, 1.1, d))); }
    else if (kind === 'lose') { const o = X().createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(55, t + 1.2); const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200; o.connect(f); f.connect(envG(t, 0.01, 0.2, 1.2, d)); o.start(t); o.stop(t + 1.4); }
  }

  // ================= the street is WebGL (render.js); this 2D canvas on top holds labels, popups and flashes =================
  const R = window.GRR; let W = 0, H = 0, DPR = 1; const geo = {};
  function resize() {
    W = innerWidth; H = innerHeight; DPR = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    geo.rw = Math.min(W * 0.47, 300); R.resize(W, H);
  }

  // ================= drawing =================
  function draw(t) {
    const G = U.G, B = GR.B, ph = ((t / B) % 1 + 1) % 1, pulse = RM ? 0.3 : Math.exp(-ph * 6), oc = G && G.oc.on;
    let shakeX = 0, shakeY = 0;
    if (U.shake > 0 && !RM) { shakeX = (Math.random() - 0.5) * U.shake; shakeY = (Math.random() - 0.5) * U.shake; U.shake *= 0.85; if (U.shake < 0.3) U.shake = 0; }
    R.frame(t, G, { pulse, oc, shakeX, shakeY, reduced: RM, live: !!(G && U.playing && !U.paused) });
    g.clearRect(0, 0, W, H);
    if (G) { drawLabels(G); drawCount(G, oc); }
    g.textAlign = 'center';
    for (const p of U.popups) { const k = (t - p.t0) / (p.life || 0.9); if (k >= 1 || k < 0) continue; g.globalAlpha = 1 - k * k; g.fillStyle = p.c; g.font = `700 ${p.big ? 30 : 20}px ${FONT}`; const hw = g.measureText(p.txt).width / 2 + 8; g.fillText(p.txt, Math.max(hw, Math.min(W - hw, p.x)), p.y - k * 40); g.globalAlpha = 1; }
    U.popups = U.popups.filter(p => t - p.t0 < (p.life || 0.9) && t >= p.t0 - 1);
    if (oc) { g.fillStyle = `rgba(255,61,168,${0.03 + 0.04 * pulse})`; g.fillRect(0, 0, W, H); }
    if (U.flash > 0) { g.fillStyle = `rgba(${U.flashRGB || '255,255,255'},${U.flash})`; g.fillRect(0, 0, W, H); U.flash *= Math.pow(RM ? 0.5 : 0.88, U.fdt * 60); if (U.flash < 0.02) U.flash = 0; }
  }
  function label(txt, x, y, size, col) { g.font = `700 ${Math.max(9, size)}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = col; g.fillText(txt, x, y); }
  function gateText(o) { return o.op === 'add' ? '+' + o.v : o.op === 'mul' ? '×' + o.v : o.op === 'trade' ? '−' + o.lose + ' ×' + o.v : o.op === 'oc' ? 'OVERCLOCK +' + o.v + '%' : o.op === 'weapon' ? GR.WEAPONS[o.w].name.toUpperCase() : o.op === 'mod' ? GR.WEAPONS[U.G.weapon].mods[o.k].name.toUpperCase() : 'FIRE +' + Math.round(o.v * 100) + '%'; }
  // the small line under each gate says what it does in plain words
  function gateNote(o) { return o.op === 'add' ? 'more runners' : o.op === 'mul' ? 'multiply squad' : o.op === 'trade' ? 'lose ' + o.lose + ', then double' : o.op === 'oc' ? 'stronger drop' : o.op === 'weapon' ? (o.keep ? 'keep your gun' : GR.WEAPONS[o.w].note) : o.op === 'mod' ? GR.WEAPONS[U.G.weapon].mods[o.k].note : 'shoot faster'; }
  function hpBar(x, y, w, fr) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x - w / 2, y, w, 4); g.fillStyle = '#4BFFA5'; g.fillRect(x - w / 2, y, w * Math.max(0, fr), 4); }
  // labels and health bars sit over the 3D models, sized by how close the thing is
  function drawLabels(G) {
    // an arrow over the gate you're heading for, flipping as you cross the line
    const ng = G.ents.find(e => e.kind === 'gate' && !e.done && e.ta > G.t);
    if (ng && ng.ta - G.t < 4.2) { const sd = G.sx < 0 ? -1 : 1, z = ng.ta - G.t, k = 1 / (1 + z * 0.4), p = R.project(sd * 0.52, z, 4.1); label('▼', p.x, p.y - Math.abs(Math.sin(G.t * 7)) * 5, 34 * k + 8, '#3DF0FF'); }
    for (let i = G.ei; i < G.ents.length; i++) {
      const e = G.ents[i], z = e.ta - G.t; if (z > GR.BOSS_RANGE + 0.2) break; if (e.done || (z > 4.6 && e.kind !== 'boss' && e.kind !== 'pod')) continue;
      const k = 1 / (1 + Math.max(0, z) * 0.55), fr = e.hp / e.maxHp;
      if (e.kind === 'runner' && z < 3) { const p = R.project(e.x, z, 2.1); label('+1', p.x, p.y, 15 * k + 4, '#BFF8FF'); }
      else if (e.kind === 'pod') { const zz = R.bossZ(z), q = 1 / (1 + zz * 0.3), p = R.project(e.x, zz, 5); label('SHOOT', p.x, p.y - 6, 18 * q + 6, '#FFB547'); hpBar(p.x, p.y, 70 * q, fr); }
      else if (e.kind === 'orb' && z < 3.2) { const p = R.project(e.x, z, 2.2); label(e.gold ? 'CATCH' : 'DODGE', p.x, p.y, 15 * k + 5, e.gold ? '#FFB547' : '#FF4D6D'); }
      else if (e.kind === 'crate') { const p = R.project(e.x, z, 2.1); label('SHOOT IT', p.x, p.y - 6, 14 * k + 3, '#FFB547'); hpBar(p.x, p.y, 60 * k, fr); }
      else if (e.kind === 'biker' && fr < 1) { const p = R.project(e.x, z, 2.3); hpBar(p.x, p.y, 54 * k, fr); }
      else if (e.kind === 'drone' && fr < 1) { const p = R.project(e.x, z, 1.9); hpBar(p.x, p.y, 34 * k, fr); }
    }
  }
  function drawCount(G, oc) {
    const p = R.project(G.sx, 0, 2 + Math.sqrt(Math.min(G.n, 240)) * 0.05), n = String(G.n);
    g.font = `700 22px ${FONT}`; g.textAlign = 'center'; const tw = g.measureText(n).width + 20;
    g.fillStyle = 'rgba(5,6,18,.7)'; g.fillRect(p.x - tw / 2, p.y - 21, tw, 28); g.fillStyle = oc ? '#FFB547' : '#3DF0FF'; g.fillText(n, p.x, p.y);
  }

  // ================= HUD =================
  const hud = { sec: null };
  function updHud() {
    const G = U.G; if (!G) return;
    const s = GR.sectionAt(G.t);
    if (hud.sec !== s.id) { hud.sec = s.id; $('secName').textContent = s.name; $('secHint').textContent = s.hint; say(s.name + '. ' + s.hint); }
    $('squadN').textContent = G.n;
    $('ocBar').style.width = (G.oc.on ? 100 : G.meter) + '%';
    $('ocLbl').textContent = 'OVERCLOCK ×' + (G.oc.on ? G.oc.mult : 1 + 2 * G.meter / 100).toFixed(1);
    $('hudR').classList.toggle('on', G.oc.on);
    const bs = U.boss, on = bs && !G.over && !bs.done && bs.ta - G.t < GR.BOSS_RANGE;
    $('bossBar').hidden = !on;
    $('bossBar').classList.toggle('armored', !!(on && bs.armor));
    if (on) { const fr = Math.max(0, bs.hp / bs.maxHp), pct = Math.ceil(fr * 100); $('bossFill').style.width = fr * 100 + '%'; $('bossTrail').style.width = fr * 100 + '%'; $('bossPct').textContent = bs.armor ? 'ARMOR' : pct + '%'; }
    const wp = GR.WEAPONS[G.weapon]; $('wpn').textContent = (G.mod >= 0 ? wp.mods[G.mod].name + ' ' + wp.short : wp.name) + (G.wlv > 1 ? ' Lv ' + G.wlv : '');
  }
  function hint(txt) { $('secHint').textContent = txt; }
  function say(txt) { $('live').textContent = txt; }

  // ================= events → sound, popups, particles =================
  const firstSeen = {};
  function onEvents(t) {
    const G = U.G; while (U.evi < G.ev.length) {
      const e = G.ev[U.evi++];
      const sq = R.project(G.sx, 0), sx = sq.x, sy = sq.y;
      if (e.type === 'volley') {
        if (e.hits.length) {
          const tg = []; for (const id of e.hits.slice(0, 8)) { const en = G.ents.find(q => q.id === id); if (en) tg.push({ x: en.x, z: Math.max(0.05, en.kind === 'boss' || en.kind === 'pod' ? R.bossZ(en.ta - G.t) : en.ta - G.t), y: en.kind === 'boss' || en.kind === 'pod' ? 3.8 : 1.1 }); }
          const n = Math.round(e.t / (GR.B / 2));
          sfx('shot', n); R.volley({ weapon: G.weapon, mod: G.mod, lv: G.wlv, col: GR.WEAPONS[G.weapon].col, oc: G.oc.on, x: G.sx, w: GR.width(G.n), t: tg, n, B: GR.B });
        }
      } else if (e.type === 'kill') {
        sfx('kill'); const en = G.ents.find(q => q.id === e.id), z = en ? (en.kind === 'boss' || en.kind === 'pod' ? R.bossZ(en.ta - G.t) : en.ta - G.t) : 1;
        const c = e.kind === 'crate' ? '#FFB547' : e.kind === 'boss' ? '#FFFFFF' : '#FF3DA8', nP = RM ? 2 : e.kind === 'boss' ? 160 : e.kind === 'swarm' ? 4 : 10;
        R.burst(e.x, z, c, nP, e.kind === 'boss' ? 16 : e.kind === 'swarm' ? 5 : 7, e.kind === 'boss' ? 4 : 1.1);
        if (e.kind === 'biker' || e.kind === 'crate') { R.shock(e.x, z, c, 3.5, 1); U.shake = Math.max(U.shake, 3); }
        if (e.kind === 'boss' && !RM) for (let i = 1; i < 6; i++) U.queue.push({ at: t + i * 0.16, x: (Math.random() - 0.5) * 0.9, y: 2 + Math.random() * 6, z, c: i % 2 ? '#FF3DA8' : '#FFB547' });
        if (!firstSeen.kill) { firstSeen.kill = 1; hint('Your squad fires on its own. Line up with enemies'); }
      } else if (e.type === 'gate') {
        sfx(e.good ? 'good' : 'bad'); R.punch(2.4); U.popups.push({ t0: t, txt: gateText(e.g) + '  →  ' + e.n, x: sx, y: sy - 90, c: e.good ? '#4BFFA5' : '#FF4D6D', big: true });
        if (e.g.op === 'oc' && G.t < GR.DROP_T) U.popups.push({ t0: t + 0.15, txt: 'Stronger drop', x: W - 70, y: 110, c: '#FF7AD0' });
        say('Gate ' + gateText(e.g) + '. Squad ' + e.n);
      } else if (e.type === 'runner') { sfx('runner'); U.popups.push({ t0: t, txt: '+1', x: sx, y: sy - 60, c: '#BFF8FF' }); }
      else if (e.type === 'haz') { sfx('slam'); U.shake = Math.max(U.shake, 9); R.punch(2); R.burst((e.x0 + e.x1) / 2, 0.6, e.style === 'beam' ? '#F2EFE6' : '#FF4D6D', RM ? 4 : 30, 9, 0.6); }
      else if (e.type === 'armor') { sfx(e.on ? 'armorOn' : 'armorOff'); U.popups.push({ t0: t, txt: e.on ? 'ARMOR BACK' : 'ARMOR DOWN!', x: W / 2, y: H * 0.34, c: e.on ? '#AEB8D8' : '#4BFFA5', big: true, life: 1.3 }); say(e.on ? 'Armor back' : 'Armor down. Hit the boss'); }
      else if (e.type === 'pod') { sfx('good'); R.shock(e.x, R.bossZ(U.boss.ta - G.t), '#FFB547', 5, 3.8); U.popups.push({ t0: t, txt: 'POD DOWN', x: W / 2, y: H * 0.34, c: '#FFB547', big: true }); }
      else if (e.type === 'orb') { sfx('good'); R.pickup(G.sx, '#FFB547'); U.popups.push({ t0: t, txt: 'ARMOR CRACKED', x: W / 2, y: H * 0.34, c: '#FFB547', big: true }); }
      else if (e.type === 'swap' || e.type === 'shuffle') { sfx('swap'); }
      else if (e.type === 'blocked') { if (!firstSeen.blocked) { firstSeen.blocked = 1; hint(GR.BOSS[U.boss.boss].tip); } }
      else if (e.type === 'reflect') { sfx('hurt'); U.shake = Math.max(U.shake, 4); U.popups.push({ t0: t, txt: 'REFLECTED −' + e.lost, x: sx, y: sy - 70, c: '#FF4D6D' }); }
      else if (e.type === 'hurt' || e.type === 'bossHit') { sfx('hurt'); U.shake = e.type === 'bossHit' ? 16 : 6; U.popups.push({ t0: t, txt: '−' + e.lost, x: sx, y: sy - 70, c: '#FF4D6D', big: e.type === 'bossHit' }); }
      else if (e.type === 'weapon') { sfx('weapon'); const wp = GR.WEAPONS[e.w], md = wp.mods[e.mod], up = md ? md.name.toUpperCase() : e.pick ? wp.name.toUpperCase() : wp.short.toUpperCase() + ' LV ' + e.lv; U.popups.push({ t0: t, txt: up + '!', x: W / 2, y: H * 0.45, c: wp.col, big: true, life: 1.4 }); const tip = md ? md.tip : e.pick ? wp.tip : ''; if (tip) hint(tip); if (e.pick || md) { R.pickup(G.sx, wp.col); if (!RM) { U.flash = 0.34; U.flashRGB = wp.col.slice(1).match(/../g).map(h => parseInt(h, 16)).join(','); } } if (e.pick) R.gates(G, gateText, gateNote); if (e.keep) hint(wp.short + ' kept'); say('Weapon: ' + up); }
      else if (e.type === 'drop') { U.flashRGB = null; U.flash = 0.8; U.shake = 12; R.punch(9); R.shock(G.sx, 0, '#FFFFFF', 26, 0.4); U.popups.push({ t0: t, txt: 'OVERCLOCK ×' + e.mult.toFixed(1), x: W / 2, y: H * 0.42, c: '#FFFFFF', big: true, life: 1.6 }); say('The drop. Overclock times ' + e.mult.toFixed(1)); }
      else if (e.type === 'bossDown') { sfx('bossDown'); U.flashRGB = null; U.flash = 0.6; U.shake = 22; R.punch(7); U.popups.push({ t0: t, txt: 'BOSS DOWN', x: W / 2, y: H * 0.4, c: '#FFB547', big: true, life: 1.6 }); say('Boss down'); }
      else if (e.type === 'lost') { sfx('lose'); stopClock(true); U.endAt = performance.now() + 1100; }
      else if (e.type === 'won') { stopClock(true); U.endAt = performance.now() + 900; }
    }
    U.queue = U.queue.filter(q => { if (t < q.at) return true; R.burst(q.x, q.z - (t - G.t), q.c, 70, 13, q.y); R.shock(q.x, q.z, q.c, 9, q.y); U.shake = Math.max(U.shake, 9); return false; });
    // teaching hints the first time things show up
    if (!firstSeen.crate && G.ents.some(e => e.kind === 'crate' && !e.done && e.ta - G.t < 2.4)) { firstSeen.crate = 1; hint('Gold crate: shoot it to power up your weapon'); }
    if (!firstSeen.boss && G.ents.some(e => e.kind === 'boss' && e.ta - G.t < GR.BOSS_RANGE)) { firstSeen.boss = 1; $('bossName').textContent = GR.BOSS[U.boss.boss].name; hint(GR.BOSS[U.boss.boss].tip); }
  }

  // ================= input: one thumb, drag anywhere =================
  const game = $('game');
  function steer(x) { if (!U.playing || U.paused || !U.G) return; x = Math.round(Math.max(-0.9, Math.min(0.9, x)) * 100) / 100; if (x !== U.lastSent) { U.lastSent = x; GR.act(U.G, { type: 'steer', x }); } }
  game.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; U.drag = { id: e.pointerId, x0: e.clientX, tx0: U.G ? U.G.tx : 0 }; try { game.setPointerCapture(e.pointerId); } catch (er) {} });
  game.addEventListener('pointermove', e => { if (!U.drag || U.drag.id !== e.pointerId) return; steer(U.drag.tx0 + (e.clientX - U.drag.x0) / (geo.rw * 0.85)); });
  const up = e => { if (U.drag && U.drag.id === e.pointerId) U.drag = null; };
  game.addEventListener('pointerup', up); game.addEventListener('pointercancel', up);
  const keys = {};
  addEventListener('keydown', e => { if (e.key === 'Escape' && U.playing) { pause(); return; } if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) { keys[e.key.toLowerCase().replace('arrow', '')] = 1; e.preventDefault(); } });
  addEventListener('keyup', e => { delete keys[e.key.toLowerCase().replace('arrow', '')]; });
  function keySteer(dt) { const d = (keys.right || keys.d ? 1 : 0) - (keys.left || keys.a ? 1 : 0); if (d && U.G) steer(U.G.tx + d * 2.4 * dt); }

  // ================= run lifecycle =================
  // progress lives in this browser: unlocked streets, and what each street starts with. The Lab serves every game from one origin, so the key is namespaced
  const SAVE_KEY = 'gr.save.v1', blank = () => ({ v: 1, unlocked: 1, beaten: {}, loads: {} });
  function loadSave() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1 && s.unlocked >= 1 && s.loads && s.beaten) { s.unlocked = Math.min(GR.MAX_LEVEL, Math.floor(s.unlocked)); return s; } } catch (e) {}
    return blank();
  }
  function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(U.save)); } catch (e) {} }   // private modes can refuse; the run still works
  U.save = loadSave(); U.lv = U.save.unlocked;
  // a clear unlocks the next street. Replays keep your best squad, and the street's start limits stop that being farmed
  function bankClear(G) {
    const S = U.save, L = G.def.n, next = L + 1, c = GR.carryOut(G), old = S.loads[next];
    S.beaten[L] = true; S.loads[next] = old && old.n > c.n ? Object.assign(c, { n: old.n }) : c;
    S.unlocked = Math.max(S.unlocked, Math.min(next, GR.MAX_LEVEL)); writeSave();
  }
  const SONGS = {};
  function startRun(level, fromBar) {
    const ctx = audioInit(); U.noAudio = !ctx;
    if (ctx && ctx.state !== 'running') ctx.resume();
    U.lv = level || U.lv; const def = GR.levelDef(U.lv);
    U.G = GR.newGame({ seed: U.seedFix || (Math.random() * 1e9) | 0, def, loadout: U.save.loads[U.lv] }); U.T = trackFor(def);
    const SONG = SONGS[U.lv] = SONGS[U.lv] || (ctx ? buildSong(U.T) : []);
    R.setLevel(def); R.setRun(U.G, gateText, gateNote); $('bossName').textContent = GR.BOSS[def.boss.id].name; U.boss = U.G.ents.find(e => e.kind === 'boss'); U.evi = 0; U.popups = []; U.queue = []; U.lastSent = null; U.endAt = 0; hud.sec = null;
    for (const k in firstSeen) delete firstSeen[k];
    U.test = !!fromBar; U.popups.push({ t0: 0.2, txt: 'LEVEL ' + U.lv, x: W / 2, y: H * 0.36, c: '#FFFFFF', big: true, life: 2 });
    if (fromBar) { // tester jump: the smart bot plays the street up to that bar, then you take over
      const r = GR.rng(5); let k = 0; while (U.G.t < fromBar * GR.BAR) { if (++k % 6 === 0) GR.act(U.G, { type: 'steer', x: GR.BOTS.smart(U.G, r) }); GR.step(U.G); }
      U.G.test = true; U.evi = U.G.ev.length; R.gates(U.G, gateText, gateNote);
    }
    const off = U.G.t;
    U.clock0 = performance.now() + 450 - off * 1000;
    if (ctx) startClock(SONG, off);
    U.playing = true; U.paused = false; hideSheet(); game.classList.remove('idle');
  }
  function pause() {
    if (!U.playing || U.paused) return; U.paused = true;
    if (A.ctx) A.ctx.suspend(); U.pausedAt = performance.now();
    showSheet(`<h2>Paused</h2><button class="btn pri" data-act="resume" type="button">Resume</button>
      <button class="btn" data-act="restart" type="button">Restart</button>
      <div class="fq"><div class="q">Tester tools</div><div class="row"><button class="btn" data-act="jumpRiser" type="button">Jump to riser</button><button class="btn" data-act="jumpDrop" type="button">Jump to boss</button></div>
      <p class="foot">A bot plays up to that point for a fair squad. Tester runs are tagged in feedback.</p></div>
      <button class="btn" data-act="title" type="button">Quit to title</button>`);
  }
  function resume() { if (!U.paused) return; U.paused = false; if (A.ctx) A.ctx.resume(); else U.clock0 += performance.now() - U.pausedAt; hideSheet(); }
  function finish() {
    const G = U.G, r = GR.results(G); U.playing = false; U.lastRes = r;
    const BS = GR.BOSS[G.def.boss.id], L = G.def.n, more = r.cleared && L < GR.MAX_LEVEL;
    if (r.cleared && !U.test) bankClear(G);
    const verdict = r.cleared ? 'Street cleared' : r.won ? 'Boss got away' : 'Squad down';
    const sub = r.cleared ? BS.win + (more ? ` You carry ${Math.min(r.survivors, GR.levelDef(L + 1).start[1])} runners and your gun to level ${L + 1}.` : ' That\'s every street for now. More are coming.') : (r.section === 'drop' || r.won) ? BS.lose : 'Line up with enemies to shoot them before they reach you.';
    showSheet(`<span class="tag">${U.test ? 'TESTER RUN · ' : ''}Level ${L} · ${G.def.name}</span><h2>${verdict}</h2>
      <div class="big">${r.survivors}</div><p>${sub}</p>
      <div class="stats"><div class="stat"><b>${r.peak}</b><span>peak squad</span></div><div class="stat"><b>${r.kills}</b><span>kills</span></div><div class="stat"><b>×${r.ocMult.toFixed(1)}</b><span>overclock</span></div>
      <div class="stat"><b>${r.gatesGood}/${r.gatesGood + r.gatesBad}</b><span>good gates</span></div><div class="stat"><b>${GR.WEAPONS[r.weapon].short}${r.wlv > 1 ? ' ' + r.wlv : ''}</b><span>weapon</span></div><div class="stat"><b>${r.credits}</b><span>credits</span></div></div>
      ${more ? `<button class="btn pri" data-act="next" type="button">Next: level ${L + 1}</button>` : ''}
      <button class="btn${more ? '' : ' pri'}" data-act="play" type="button">Run it back</button>
      <button class="btn" data-act="feedback" type="button">Give feedback</button>
      <button class="btn" data-act="title" type="button">Title</button>`);
  }

  // ================= screens =================
  const sheet = $('sheet'), card = $('card');
  function showSheet(html) { card.innerHTML = html; sheet.hidden = false; const b = card.querySelector('.btn.pri, .btn'); if (b) b.focus({ preventScroll: true }); }
  function hideSheet() { sheet.hidden = true; }
  function titleScreen() {
    U.playing = false; U.G = null; $('bossBar').hidden = true; stopClock(true); game.classList.add('idle');
    U.lv = U.save.unlocked; R.setLevel(GR.levelDef(U.lv));
    showSheet(`<span class="tag">Prototype 2 · ${GR.MAX_LEVEL} streets</span><h1><span class="c">OVER</span><span class="p">CLOCK</span></h1>
      <p>Neon City, 2089. Hush banned music. Your squad brings the beat back.</p>
      <button class="btn pri" data-act="play" type="button">Run level ${U.lv}: ${GR.levelDef(U.lv).name}</button>
      <button class="btn" data-act="levels" type="button">Level select</button>
      <button class="btn" data-act="how" type="button">How to play</button>
      <button class="btn" data-act="arsenal" type="button">Weapons and gates</button>
      <p class="foot">Sound on, silent mode off. About one minute per run.</p>`);
  }
  function levelScreen() {
    const S = U.save, rows = []; for (let L = 1; L <= GR.MAX_LEVEL; L++) { const d = GR.levelDef(L), open = L <= S.unlocked, ld = GR.enter(d, S.loads[L]), wp = GR.WEAPONS[ld.weapon];
      rows.push(open ? `<button class="lv" type="button" data-lv="${L}"><span>${L}. ${d.name}${S.beaten[L] ? ' <span class="ok">✓</span>' : ''}</span><small>${GR.BOSS[d.boss.id].name} · start ${ld.n} runners, ${wp.short}${ld.wlv > 1 ? ' Lv ' + ld.wlv : ''}</small></button>` : `<button class="lv" type="button" disabled><span>${L}. Locked</span><small>Beat level ${L - 1}'s boss</small></button>`); }
    showSheet(`<h2>Level select</h2><p>Beat a boss to open the next street. Your squad and guns carry over.</p>${rows.join('')}
      <button class="btn" data-act="reset" type="button">Reset progress</button><button class="btn" data-act="title" type="button">Back</button>`);
  }
  function resetScreen() {
    showSheet(`<h2>Reset progress?</h2><p>This locks every street again and clears your carried squad and guns. It can't be undone.</p>
      <button class="btn" data-act="resetYes" type="button">Yes, reset</button><button class="btn pri" data-act="levels" type="button">Keep my progress</button>`);
  }
  function howScreen() {
    showSheet(`<h2>How to play</h2><ol class="steps">
      <li><b class="c">Drag left and right</b> anywhere to steer your squad. Arrow keys work too.</li>
      <li><b class="gr">Steer left or right of the line</b> to pick a gate. The ▼ shows your pick. Flat numbers suit a small squad, multipliers a big one. <b class="r">Red</b> trades runners now for double later.</li>
      <li><b class="p">Your squad fires on its own.</b> Hordes fill the road. Carve a path through them, because whatever reaches you eats runners.</li>
      <li><b class="g">Pick your gun</b> at the weapon fork, then an upgrade for it later. Shoot gold crates to level it up.</li>
      <li><b class="p">Gates fill Overclock.</b> It multiplies your damage during the drop, up to ×3. Overclock gates fill it fastest. Red gates fill none.</li>
      <li><b class="r">Every boss has a trick.</b> Kill it to open the next street, and take your squad and guns with you. The hint at the top tells you what to do.</li></ol>
      <button class="btn pri" data-act="play" type="button">Run</button><button class="btn" data-act="title" type="button">Back</button>`);
  }
  function arsenalScreen() {
    const gun = k => { const w = GR.WEAPONS[k]; return `<div class="gun"><div class="gn" style="color:${w.col}">${w.name}</div><p>${w.note[0].toUpperCase() + w.tip.split(': ')[1].slice(1)}.</p><div class="ups">${w.mods.map(m => `<div><b>${m.name}</b> ${m.tip.split(': ')[1]}</div>`).join('')}</div></div>`; };
    showSheet(`<h2>Weapons</h2><p>You start with the Pulse rifle. Pick one gun at the weapon fork, then one of its two upgrades later. Gold crates level it up.</p>
      ${['arc', 'scatter', 'rail', 'rocket'].map(gun).join('')}
      <h2 style="margin-top:16px">Gates</h2><ul class="gl">
      <li><b class="gr">+8</b> Adds runners. Best while your squad is small.</li>
      <li><b class="gr">×1.5</b> Multiplies your squad. Best once it's big.</li>
      <li><b class="g">FIRE +25%</b> Everyone shoots faster.</li>
      <li><b class="p">OVERCLOCK +30%</b> Multiplies your damage during the drop, up to ×3.</li>
      <li><b class="r">−10 ×2</b> Lose runners now, then double what's left. Adds no Overclock.</li></ul>
      <button class="btn pri" data-act="play" type="button">Run</button><button class="btn" data-act="title" type="button">Back</button>`);
  }
  const FQ = [
    { id: 'again', q: 'Did you want another run right away?', o: ['Yes', 'Maybe', 'No'] },
    { id: 'drop', q: 'Did the drop feel like a payoff?', o: ['Huge', 'Kind of', 'No'] },
    { id: 'gates', q: 'Did the gates feel like real choices?', o: ['Yes', 'Sometimes', 'No'] },
    { id: 'music', q: 'The music:', o: ['Loved it', 'Fine', 'Muted it'] },
    { id: 'diff', q: 'Difficulty:', o: ['Too easy', 'About right', 'Too hard'] }
  ];
  function feedbackScreen(msg) {
    showSheet(`<h2>Feedback</h2><p>Takes 20 seconds. It goes to the crew.</p>
      ${FQ.map(f => `<div class="fq"><div class="q">${f.q}</div><div class="opts">${f.o.map(o => `<button class="opt" type="button" data-fq="${f.id}" data-fv="${o}" aria-pressed="${U.fb[f.id] === o}">${o}</button>`).join('')}</div></div>`).join('')}
      <div class="fq"><label class="q" for="fbNote">Anything else?</label><textarea id="fbNote" placeholder="What felt good, what felt off">${U.fb.note || ''}</textarea>
      <input class="tx" id="fbName" placeholder="Your name (optional)" value="${U.fb.name || ''}" aria-label="Your name (optional)"></div>
      <div class="err" id="fbErr">${msg || ''}</div>
      <button class="btn pri" data-act="fbSend" type="button">Send</button><button class="btn" data-act="back" type="button">Back</button>`);
  }
  async function sendFeedback() {
    U.fb.note = ($('fbNote') || {}).value || ''; U.fb.name = ($('fbName') || {}).value || '';
    if (!FQ.some(f => U.fb[f.id])) { $('fbErr').textContent = 'Tap at least one answer first.'; return; }
    const r = U.lastRes || {};
    const body = { answers: Object.fromEntries(FQ.map(f => [f.id, U.fb[f.id] || null])), notes: U.fb.note, name: U.fb.name, result: r, tester: U.test, level: U.lv, version: 'p3', at: new Date().toISOString() };
    let ok = false;
    try { const db = window.claude && window.claude.use ? await window.claude.use('db') : null; if (db) { await db.collection('feedback').add(body); ok = true; } } catch (e) {}
    if (!ok && location.protocol !== 'file:') { try { const res = await fetch('/forge/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ game: 'cyberpunk-gate-runner' }, body)) }); ok = res.ok; } catch (e) {} }
    if (ok) showSheet(`<h2>Thanks!</h2><p>Your answers went to the crew.</p><button class="btn pri" data-act="play" type="button">Run it back</button><button class="btn" data-act="title" type="button">Title</button>`);
    else { const txt = 'Gate Runner P2 feedback\n' + FQ.map(f => f.q + ' ' + (U.fb[f.id] || '–')).join('\n') + '\nNotes: ' + (U.fb.note || '–') + '\nResult: ' + JSON.stringify(r);
      showSheet(`<h2>Couldn't send</h2><p>This copy isn't connected to the Lab. Copy your answers and paste them to the crew.</p><textarea readonly id="fbCopy">${txt.replace(/</g, '&lt;')}</textarea><button class="btn pri" data-act="fbCopy" type="button">Copy answers</button><button class="btn" data-act="title" type="button">Title</button>`); }
  }
  card.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.fq) { U.fb[b.dataset.fq] = b.dataset.fv; card.querySelectorAll(`[data-fq="${b.dataset.fq}"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
    if (b.dataset.lv) { startRun(+b.dataset.lv); return; }
    const a = b.dataset.act;
    if (a === 'play' || a === 'restart') startRun(U.lv);
    else if (a === 'next') startRun(U.lv + 1);
    else if (a === 'levels') levelScreen();
    else if (a === 'reset') resetScreen();
    else if (a === 'resetYes') { U.save = blank(); writeSave(); titleScreen(); }
    else if (a === 'how') howScreen();
    else if (a === 'arsenal') arsenalScreen();
    else if (a === 'title') titleScreen();
    else if (a === 'resume') resume();
    else if (a === 'jumpRiser') startRun(U.lv, 12);
    else if (a === 'jumpDrop') startRun(U.lv, 19);
    else if (a === 'feedback') feedbackScreen();
    else if (a === 'fbSend') sendFeedback();
    else if (a === 'back') finish();
    else if (a === 'fbCopy') { const ta = $('fbCopy'); ta.select(); try { navigator.clipboard.writeText(ta.value); b.textContent = 'Copied'; } catch (er) { document.execCommand && document.execCommand('copy'); } }
  });
  $('menuBtn').addEventListener('click', () => U.playing ? pause() : null);
  const muteBtn = $('muteBtn');
  function setMute(m) { U.muted = m; muteBtn.setAttribute('aria-pressed', m); muteBtn.setAttribute('aria-label', m ? 'Music off' : 'Music on'); muteBtn.textContent = m ? '♪̸' : '♪'; muteBtn.style.opacity = m ? 0.5 : 1; if (A.out) A.out.gain.value = m ? 0 : 0.7; try { localStorage.setItem('grMuted', m ? '1' : '0'); } catch (e) {} }
  muteBtn.addEventListener('click', () => setMute(!U.muted)); setMute(U.muted);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  // ================= main loop =================
  let lastF = performance.now();
  // add #fps to the URL for a live frame rate and quality tier on a real device
  const fpsOn = /fps/.test(location.hash), fpsEl = fpsOn ? Object.assign(document.createElement('div'), { id: 'fps' }) : null; let fpsN = 0, fpsT = performance.now();
  if (fpsEl) { fpsEl.style.cssText = 'position:fixed;left:8px;bottom:26px;z-index:30;font:700 13px monospace;color:#4BFFA5;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:6px;pointer-events:none'; document.body.appendChild(fpsEl); }
  function frame(now) {
    requestAnimationFrame(frame);
    if (fpsOn) { fpsN++; if (now - fpsT >= 1000) { fpsEl.textContent = Math.round(fpsN * 1000 / (now - fpsT)) + ' fps · tier ' + R.quality; fpsN = 0; fpsT = now; } }
    const dt = Math.min(0.05, (now - lastF) / 1000); lastF = now; U.fdt = Math.max(0.001, (now - (U.lastDraw || now)) / 1000) || 0.016; U.lastDraw = now;
    let t;
    if (U.G && U.playing && !U.paused) {
      keySteer(dt);
      t = songAt(now);
      GR.advance(U.G, t);
      onEvents(U.G.t); updHud();
      if (U.endAt && now >= U.endAt) finish();
      draw(U.G.t);
    } else if (U.G) draw(U.G.t);
    else draw((now - U.attract0) / 1000);
  }
  if (R.init($('gl'))) { addEventListener('resize', resize); resize(); titleScreen(); requestAnimationFrame(frame); }
  else showSheet(`<h2>This browser can't run the street</h2><p>Gate Runner needs WebGL 2. Try a current version of Chrome, Edge, Safari or Firefox.</p>`);
})();
