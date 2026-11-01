/* Cyberpunk Gate Runner, Prototype 2: house loop synth, steering input, screens. render.js draws the street.
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

  // ================= audio: an original 122 BPM house loop =================
  const A = { ctx: null, out: null, music: null, sfx: null, bus: null, noise: null, events: [], ptr: 0, timer: null, t0: 0 };
  function audioInit() {
    if (A.ctx) return A.ctx;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    A.ctx = new C({ latencyHint: 'interactive' });
    const comp = A.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 8; comp.attack.value = 0.004; comp.release.value = 0.12;
    A.out = A.ctx.createGain(); A.out.gain.value = U.muted ? 0 : 0.7; A.out.connect(comp); comp.connect(A.ctx.destination);
    A.sfx = A.ctx.createGain(); A.sfx.gain.value = 0.7; A.sfx.connect(A.out);
    const len = A.ctx.sampleRate, b = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noise = b; return A.ctx;
  }
  window.GRUI.A = A; window.GRUI.audioErrs = [];
  const X = () => A.ctx;
  function newBus() {
    if (A.bus) { try { A.bus.disconnect(); } catch (e) {} }
    A.bus = A.ctx.createGain(); A.bus.connect(A.out);
    A.kick = A.ctx.createGain(); A.kick.connect(A.bus);                 // kick stays clean and on top
    A.synth = A.ctx.createGain(); const drive = A.ctx.createWaveShaper(); // synths share grit and duck under the kick
    drive.curve = DRIVE(); drive.oversample = '2x'; A.synth.connect(drive); drive.connect(A.bus);
  }
  let driveCurve = null;
  function DRIVE() { if (driveCurve) return driveCurve; const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * 2.6) / Math.tanh(2.6); } return (driveCurve = c); }
  function envG(t, a, peak, dec, dest) { const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak, t + a); gn.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); gn.connect(dest || A.bus); return gn; }
  function noiseSrc(t, dur) { const s = X().createBufferSource(); s.buffer = A.noise; s.loop = true; s.start(t, Math.random() * 0.5); s.stop(t + dur); return s; }
  function osc(type, fr, t, dur, dest, det) { const o = X().createOscillator(); o.type = type; o.frequency.value = fr; if (det) o.detune.value = det; o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
  // chords: Am · F · Dm · E, one per bar, with a distorted synth bus that ducks under every kick
  const CH = [[220, 261.6, 329.6, 440], [174.6, 220, 261.6, 349.2], [146.8, 220, 293.7, 349.2], [164.8, 207.7, 246.9, 329.6]];
  const ROOT = [55, 43.65, 36.71, 41.2];
  // 16-step acid line and the 8-step drop riff, as notes above the chord root (semitones)
  const ACID = [0, 0, 12, 0, 3, 0, 15, 0, 0, 7, 0, 12, 10, 0, 3, 7], RIFF = [12, 12, 15, 12, 19, 17, 15, 10];
  const semi = (f, n) => f * Math.pow(2, n / 12);
  const SND = {
    kick(t, v = 1) {
      const o = X().createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.09); o.connect(envG(t, 0.001, 1.15 * v, 0.3, A.kick)); o.start(t); o.stop(t + 0.36);
      const c = X().createOscillator(); c.type = 'square'; c.frequency.value = 2400; c.connect(envG(t, 0.001, 0.09 * v, 0.012, A.kick)); c.start(t); c.stop(t + 0.03);
      const d = A.synth.gain; d.cancelScheduledValues(t); d.setValueAtTime(0.28, t); d.linearRampToValueAtTime(1, t + 0.3); // sidechain pump
    },
    clap(t, v = 1) { for (const [dt, pk] of [[0, 0.5], [0.012, 0.4], [0.024, 0.45]]) { const n = noiseSrc(t + dt, 0.2), f = X().createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 1.1; n.connect(f); f.connect(envG(t + dt, 0.001, pk * v, 0.13)); } },
    hat(t, v = 1, open) { const n = noiseSrc(t, open ? 0.3 : 0.06), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = open ? 6500 : 8500; n.connect(f); f.connect(envG(t, 0.001, (open ? 0.13 : 0.08) * v, open ? 0.2 : 0.03)); },
    crash(t) { const n = noiseSrc(t, 2), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500; n.connect(f); f.connect(envG(t, 0.002, 0.28, 1.8)); },
    boom(t) { const o = X().createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.1); o.connect(envG(t, 0.004, 1.1, 1.4, A.kick)); o.start(t); o.stop(t + 1.6); },
    // reese bass: two detuned saws and a sub, with the filter snapping shut
    bass(t, ci, dur, cut = 1100) {
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.6, t + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = X().createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 5; f.frequency.setValueAtTime(cut, t); f.frequency.exponentialRampToValueAtTime(160, t + dur); f.connect(gn); gn.connect(A.synth);
      osc('sawtooth', ROOT[ci] * 2, t, dur, f, -14); osc('sawtooth', ROOT[ci] * 2, t, dur, f, 14); osc('sine', ROOT[ci], t, dur, gn);
    },
    // acid line: a resonant saw with the filter opened by the section
    acid(t, fr, dur, cut, v = 1) {
      const gn = envG(t, 0.003, 0.14 * v, dur, A.synth), f = X().createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 16; f.frequency.setValueAtTime(cut, t); f.frequency.exponentialRampToValueAtTime(Math.max(180, cut * 0.22), t + dur); f.connect(gn);
      osc('sawtooth', fr, t, dur, f);
    },
    stab(t, ci, cut, v = 1) {
      const gn = envG(t, 0.003, 0.075 * v, 0.2, A.synth), f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = 4; f.connect(gn);
      for (const fr of CH[ci]) { osc('sawtooth', fr, t, 0.26, f, -9); osc('sawtooth', fr, t, 0.26, f, 9); }
    },
    pad(t, ci, dur, cut) {
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.04, t + 0.4); gn.gain.setValueAtTime(0.04, t + dur - 0.3); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; f.connect(gn); gn.connect(A.synth);
      for (const fr of CH[ci]) osc('sawtooth', fr / 2, t, dur, f, 6);
    },
    // hoover lead for the drop: stacked saws that scoop up into the note
    hoover(t, fr, dur) {
      const gn = envG(t, 0.012, 0.085, dur, A.synth), f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3400; f.Q.value = 2; f.connect(gn);
      for (const det of [-16, 0, 16]) { const o = X().createOscillator(); o.type = 'sawtooth'; o.detune.value = det; o.frequency.setValueAtTime(fr * 0.8, t); o.frequency.exponentialRampToValueAtTime(fr, t + 0.05); o.connect(f); o.start(t); o.stop(t + dur + 0.05); }
    },
    riser(t, dur) {
      const n = noiseSrc(t, dur), f = X().createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(240, t); f.frequency.exponentialRampToValueAtTime(8000, t + dur);
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.3, t + dur); n.connect(f); f.connect(gn); gn.connect(A.bus);
    }
  };
  function buildSong() {
    const ev = [], B = GR.B, at = (b, fn, ...a) => ev.push({ t: b * B, fn, a });
    for (let bar = 0; bar < 31; bar++) {
      const s = GR.sectionAt(bar * GR.BAR + 0.001).id, ci = bar % 4, b0 = bar * 4;
      const cut = s === 'intro' ? 600 : s === 'build' ? 1200 : s === 'riser' ? 1200 + (bar - 12) * 480 : s === 'drop' ? 4800 : 800;
      const kickOn = !(bar === 19) && bar < 30;
      for (let q = 0; q < 4; q++) {
        const b = b0 + q;
        if (kickOn) at(b, 'kick', s === 'intro' ? 0.8 : 1);
        if (s !== 'intro' && s !== 'outro') { at(b + 0.5, 'hat', s === 'drop' ? 1.2 : 0.9, true); at(b + 0.25, 'hat', 0.55); at(b + 0.75, 'hat', 0.55); }
        else if (bar < 30) at(b + 0.5, 'hat', 0.6);
        if ((q === 1 || q === 3) && (s === 'build' || s === 'drop' || (s === 'riser' && bar < 18))) at(b, 'clap', 1);
        if ((s === 'build' || s === 'riser') && bar !== 19) at(b + 0.5, 'bass', ci, B * 0.44, cut + 300);
        if (s === 'drop') for (const k of [0.25, 0.5, 0.75]) at(b + k, 'bass', ci, B * 0.22, 1700);
      }
      if ((s === 'build' || s === 'riser' || s === 'drop') && bar !== 19) for (let k = 0; k < 16; k++) { const st = ACID[k]; if (st || k % 4 === 0) at(b0 + k * 0.25, 'acid', semi(ROOT[ci] * 2, st), B * 0.2, Math.min(5200, cut * 1.1 + (k % 3 === 0 ? 700 : 0)), s === 'drop' ? 0.8 : 1); }
      if (s === 'drop') for (let k = 0; k < 8; k++) at(b0 + k * 0.5, 'hoover', semi(ROOT[ci] * 4, RIFF[k]), B * 0.4);
      if (bar < 30 && s !== 'drop') { at(b0 + 1.5, 'stab', ci, cut, 1); at(b0 + 3.5, 'stab', ci, cut, 0.8); }
      if (s === 'intro' || s === 'outro') at(b0, 'pad', ci, GR.BAR, s === 'outro' ? 1000 : 800);
      if (bar === 18) for (let k = 0; k < 8; k++) at(b0 + k * 0.5, 'clap', 0.5 + k * 0.05);
      if (bar === 19) for (let k = 0; k < 16; k++) at(b0 + k * 0.25, 'clap', 0.6 + k * 0.04);
      if ([4, 12, 20, 28].includes(bar)) at(b0, 'crash');
    }
    at(12 * 4, 'riser', GR.BAR * 8);
    at(20 * 4, 'boom'); at(30 * 4, 'pad', 0, GR.BAR * 1.5, 1400);
    ev.sort((a, b) => a.t - b.t); return ev;
  }
  function startClock(events, offset) {
    newBus(); A.events = events; A.ptr = 0;
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
  function sfx(kind) { try { sfx0(kind); } catch (e) {} }
  function sfx0(kind) {
    if (!A.ctx || A.ctx.state !== 'running') return;
    const t = A.ctx.currentTime + 0.01, d = A.sfx;
    if (kind === 'good') { osc('triangle', 659.3, t, 0.12, envG(t, 0.004, 0.12, 0.12, d)); osc('triangle', 880, t + 0.07, 0.18, envG(t + 0.07, 0.004, 0.12, 0.18, d)); }
    else if (kind === 'bad') { const o = X().createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.3); const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; o.connect(f); f.connect(envG(t, 0.005, 0.12, 0.3, d)); o.start(t); o.stop(t + 0.4); }
    else if (kind === 'kill') { if (t - (A.lastKill || 0) < 0.05) return; A.lastKill = t; osc('square', [880, 1046.5, 1318.5, 1568][(Math.random() * 4) | 0], t, 0.05, envG(t, 0.002, 0.025, 0.05, d)); }
    else if (kind === 'runner') osc('triangle', 1318.5, t, 0.08, envG(t, 0.002, 0.06, 0.08, d));
    else if (kind === 'hurt') { const n = noiseSrc(t, 0.15), f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; n.connect(f); f.connect(envG(t, 0.002, 0.25, 0.14, d)); }
    else if (kind === 'weapon') [659.3, 880, 1046.5, 1318.5].forEach((fr, i) => osc('square', fr, t + i * 0.06, 0.1, envG(t + i * 0.06, 0.003, 0.05, 0.1, d)));
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
    if (U.flash > 0) { g.fillStyle = `rgba(255,255,255,${U.flash})`; g.fillRect(0, 0, W, H); U.flash *= Math.pow(RM ? 0.5 : 0.88, U.fdt * 60); if (U.flash < 0.02) U.flash = 0; }
  }
  function label(txt, x, y, size, col) { g.font = `700 ${Math.max(9, size)}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = col; g.fillText(txt, x, y); }
  function gateText(o) { return o.op === 'add' ? '+' + o.v : o.op === 'mul' ? '×' + o.v : o.op === 'trade' ? '−' + o.lose + ' ×' + o.v : o.op === 'oc' ? 'CHARGE +' + o.v + '%' : o.op === 'weapon' ? GR.WEAPONS[o.w].name.toUpperCase() : o.op === 'mod' ? GR.WEAPONS[U.G.weapon].mods[o.k].name.toUpperCase() : 'FIRE +' + Math.round(o.v * 100) + '%'; }
  function hpBar(x, y, w, fr) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x - w / 2, y, w, 4); g.fillStyle = '#4BFFA5'; g.fillRect(x - w / 2, y, w * Math.max(0, fr), 4); }
  // labels and health bars sit over the 3D models, sized by how close the thing is
  function drawLabels(G) {
    for (let i = G.ei; i < G.ents.length; i++) {
      const e = G.ents[i], z = e.ta - G.t; if (z > GR.BOSS_RANGE + 0.2) break; if (e.done || (z > 4.6 && e.kind !== 'boss')) continue;
      const k = 1 / (1 + Math.max(0, z) * 0.55), fr = e.hp / e.maxHp;
      if (e.kind === 'runner' && z < 3) { const p = R.project(e.x, z, 2.1); label('+1', p.x, p.y, 15 * k + 4, '#BFF8FF'); }
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
    $('ocLbl').textContent = G.oc.on ? 'OVERCLOCK ×' + G.oc.mult.toFixed(1) : 'OVERCLOCK ' + Math.round(G.meter) + '%';
    $('hudR').classList.toggle('on', G.oc.on);
    const bs = U.boss, on = bs && !G.over && !bs.done && bs.ta - G.t < GR.BOSS_RANGE;
    $('bossBar').hidden = !on;
    if (on) { const fr = Math.max(0, bs.hp / bs.maxHp), pct = Math.ceil(fr * 100); $('bossFill').style.width = fr * 100 + '%'; $('bossTrail').style.width = fr * 100 + '%'; $('bossPct').textContent = pct + '%'; }
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
          const tg = []; for (const id of e.hits.slice(0, 8)) { const en = G.ents.find(q => q.id === id); if (en) tg.push({ x: en.x, z: Math.max(0.05, en.ta - G.t), y: en.kind === 'boss' ? 3.8 : 1.1 }); }
          R.volley({ weapon: G.weapon, mod: G.mod, lv: G.wlv, col: GR.WEAPONS[G.weapon].col, oc: G.oc.on, x: G.sx, w: GR.width(G.n), t: tg });
        }
      } else if (e.type === 'kill') {
        sfx('kill'); const en = G.ents.find(q => q.id === e.id), z = en ? en.ta - G.t : 1;
        const c = e.kind === 'crate' ? '#FFB547' : e.kind === 'boss' ? '#FFFFFF' : '#FF3DA8', nP = RM ? 2 : e.kind === 'boss' ? 160 : e.kind === 'swarm' ? 4 : 10;
        R.burst(e.x, z, c, nP, e.kind === 'boss' ? 16 : e.kind === 'swarm' ? 5 : 7, e.kind === 'boss' ? 4 : 1.1);
        if (e.kind === 'biker' || e.kind === 'crate') { R.shock(e.x, z, c, 3.5, 1); U.shake = Math.max(U.shake, 3); }
        if (e.kind === 'boss' && !RM) for (let i = 1; i < 6; i++) U.queue.push({ at: t + i * 0.16, x: (Math.random() - 0.5) * 0.9, y: 2 + Math.random() * 6, z, c: i % 2 ? '#FF3DA8' : '#FFB547' });
        if (!firstSeen.kill) { firstSeen.kill = 1; hint('Your squad fires on its own. Line up with enemies'); }
      } else if (e.type === 'gate') {
        sfx(e.good ? 'good' : 'bad'); R.punch(2.4); U.popups.push({ t0: t, txt: gateText(e.g) + '  →  ' + e.n, x: sx, y: sy - 90, c: e.good ? '#4BFFA5' : '#FF4D6D', big: true });
        if (e.g.op === 'oc' && G.t < GR.DROP_T) U.popups.push({ t0: t + 0.15, txt: 'Overclock +', x: W - 70, y: 110, c: '#FF7AD0' });
        say('Gate ' + gateText(e.g) + '. Squad ' + e.n);
      } else if (e.type === 'runner') { sfx('runner'); U.popups.push({ t0: t, txt: '+1', x: sx, y: sy - 60, c: '#BFF8FF' }); }
      else if (e.type === 'hurt' || e.type === 'bossHit') { sfx('hurt'); U.shake = e.type === 'bossHit' ? 16 : 6; U.popups.push({ t0: t, txt: '−' + e.lost, x: sx, y: sy - 70, c: '#FF4D6D', big: e.type === 'bossHit' }); }
      else if (e.type === 'weapon') { sfx('weapon'); const wp = GR.WEAPONS[e.w], md = wp.mods[e.mod], up = md ? md.name.toUpperCase() : e.pick ? wp.name.toUpperCase() : wp.short.toUpperCase() + ' LV ' + e.lv; U.popups.push({ t0: t, txt: up + '!', x: W / 2, y: H * 0.45, c: wp.col, big: true, life: 1.4 }); const tip = md ? md.tip : e.pick ? wp.tip : ''; if (tip) hint(tip); if (e.pick) R.gates(G, gateText); say('Weapon: ' + up); }
      else if (e.type === 'drop') { U.flash = 0.8; U.shake = 12; R.punch(9); R.shock(G.sx, 0, '#FFFFFF', 26, 0.4); U.popups.push({ t0: t, txt: 'OVERCLOCK ×' + e.mult.toFixed(1), x: W / 2, y: H * 0.42, c: '#FFFFFF', big: true, life: 1.6 }); say('The drop. Overclock times ' + e.mult.toFixed(1)); }
      else if (e.type === 'bossDown') { sfx('bossDown'); U.flash = 0.6; U.shake = 22; R.punch(7); U.popups.push({ t0: t, txt: 'BOSS DOWN', x: W / 2, y: H * 0.4, c: '#FFB547', big: true, life: 1.6 }); say('Boss down'); }
      else if (e.type === 'lost') { sfx('lose'); stopClock(true); U.endAt = performance.now() + 1100; }
      else if (e.type === 'won') { stopClock(true); U.endAt = performance.now() + 900; }
    }
    U.queue = U.queue.filter(q => { if (t < q.at) return true; R.burst(q.x, q.z - (t - G.t), q.c, 70, 13, q.y); R.shock(q.x, q.z, q.c, 9, q.y); U.shake = Math.max(U.shake, 9); return false; });
    // teaching hints the first time things show up
    if (!firstSeen.crate && G.ents.some(e => e.kind === 'crate' && !e.done && e.ta - G.t < 2.4)) { firstSeen.crate = 1; hint('Gold crate: shoot it to power up your weapon'); }
    if (!firstSeen.boss && G.ents.some(e => e.kind === 'boss' && e.ta - G.t < GR.BOSS_RANGE)) { firstSeen.boss = 1; hint('Boss incoming. Overclock melts it'); }
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
  let SONG = null;
  function startRun(fromBar) {
    const ctx = audioInit(); U.noAudio = !ctx;
    if (ctx && ctx.state !== 'running') ctx.resume();
    SONG = SONG || (ctx ? buildSong() : []);
    U.G = GR.newGame({ seed: (Math.random() * 1e9) | 0 }); R.setRun(U.G, gateText); U.boss = U.G.ents.find(e => e.kind === 'boss'); U.evi = 0; U.popups = []; U.queue = []; U.lastSent = null; U.endAt = 0; hud.sec = null;
    for (const k in firstSeen) delete firstSeen[k];
    U.test = !!fromBar;
    if (fromBar) { // tester jump: the smart bot plays the street up to that bar, then you take over
      const r = GR.rng(5); let k = 0; while (U.G.t < fromBar * GR.BAR) { if (++k % 6 === 0) GR.act(U.G, { type: 'steer', x: GR.BOTS.smart(U.G, r) }); GR.step(U.G); }
      U.G.test = true; U.evi = U.G.ev.length; R.gates(U.G, gateText);
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
      <div class="fq"><div class="q">Tester tools</div><div class="row"><button class="btn" data-act="jumpRiser" type="button">Jump to riser</button><button class="btn" data-act="jumpDrop" type="button">Jump to drop</button></div>
      <p class="foot">A bot plays up to that point for a fair squad. Tester runs are tagged in feedback.</p></div>
      <button class="btn" data-act="title" type="button">Quit to title</button>`);
  }
  function resume() { if (!U.paused) return; U.paused = false; if (A.ctx) A.ctx.resume(); else U.clock0 += performance.now() - U.pausedAt; hideSheet(); }
  function finish() {
    const G = U.G, r = GR.results(G); U.playing = false; U.lastRes = r;
    const verdict = r.won ? (r.boss ? 'Street cleared' : 'You made it') : 'Squad down';
    const sub = r.won ? (r.boss ? 'The Enforcer melted on the drop.' : 'The Enforcer walked through you, but your squad survived.') : (r.section === 'drop' ? 'The Enforcer was too much. Build a bigger squad or charge Overclock higher.' : 'Line up with enemies to shoot them before they reach you.');
    showSheet(`<span class="tag">${U.test ? 'TESTER RUN · ' : ''}Prototype 2</span><h2>${verdict}</h2>
      <div class="big">${r.survivors}</div><p>${sub}</p>
      <div class="stats"><div class="stat"><b>${r.peak}</b><span>peak squad</span></div><div class="stat"><b>${r.kills}</b><span>kills</span></div><div class="stat"><b>×${r.ocMult.toFixed(1)}</b><span>overclock</span></div>
      <div class="stat"><b>${r.gatesGood}/${r.gatesGood + r.gatesBad}</b><span>good gates</span></div><div class="stat"><b>${GR.WEAPONS[r.weapon].short}${r.wlv > 1 ? ' ' + r.wlv : ''}</b><span>weapon</span></div><div class="stat"><b>${r.credits}</b><span>credits</span></div></div>
      <button class="btn pri" data-act="play" type="button">Run it back</button>
      <button class="btn" data-act="feedback" type="button">Give feedback</button>
      <button class="btn" data-act="title" type="button">Title</button>`);
  }

  // ================= screens =================
  const sheet = $('sheet'), card = $('card');
  function showSheet(html) { card.innerHTML = html; sheet.hidden = false; const b = card.querySelector('.btn.pri, .btn'); if (b) b.focus({ preventScroll: true }); }
  function hideSheet() { sheet.hidden = true; }
  function titleScreen() {
    U.playing = false; U.G = null; $('bossBar').hidden = true; stopClock(true); game.classList.add('idle');
    showSheet(`<span class="tag">Prototype 2 · one street</span><h1><span class="c">OVER</span><span class="p">CLOCK</span></h1>
      <p>Neon City, 2089. Hush banned music. Your squad brings the beat back.</p>
      <button class="btn pri" data-act="play" type="button">Run</button>
      <button class="btn" data-act="how" type="button">How to play</button>
      <p class="foot">Sound on, silent mode off. About one minute per run.</p>`);
  }
  function howScreen() {
    showSheet(`<h2>How to play</h2><ol class="steps">
      <li><b class="c">Drag left and right</b> anywhere to steer your squad. Arrow keys work too.</li>
      <li><b class="gr">Pick a gate.</b> Flat numbers suit a small squad, multipliers a big one. <b class="r">Red</b> trades runners now for double later.</li>
      <li><b class="p">Your squad fires on its own.</b> Hordes fill the road. Carve a path through them, because whatever reaches you eats runners.</li>
      <li><b class="g">Pick your gun</b> at the weapon fork, then an upgrade for it later. Shoot gold crates to level it up.</li>
      <li><b class="p">Gates charge Overclock.</b> Charge gates charge it most. When the beat drops, it fires. Melt the boss.</li></ol>
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
    const body = { answers: Object.fromEntries(FQ.map(f => [f.id, U.fb[f.id] || null])), notes: U.fb.note, name: U.fb.name, result: r, tester: U.test, version: 'p2', at: new Date().toISOString() };
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
    const a = b.dataset.act;
    if (a === 'play' || a === 'restart') startRun(0);
    else if (a === 'how') howScreen();
    else if (a === 'title') titleScreen();
    else if (a === 'resume') resume();
    else if (a === 'jumpRiser') startRun(12);
    else if (a === 'jumpDrop') startRun(19);
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
  function frame(now) {
    requestAnimationFrame(frame);
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
