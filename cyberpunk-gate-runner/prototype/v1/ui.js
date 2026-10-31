/* Cyberpunk Gate Runner, Prototype 1: house loop synth, canvas street, steering input, screens.
   The game clock IS the song clock: the engine advances to "song time as heard", so gates land on the beat.
   Audio clock pattern (getOutputTimestamp, lookahead scheduler, per-run bus) adapted from Neon Surf v1.
   © 2026 justaskjoe. All rights reserved. */
(function () {
  const GR = window.GR, $ = id => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Space Grotesk", system-ui, sans-serif';
  const U = { G: null, playing: false, paused: false, evi: 0, popups: [], parts: [], tracers: [], flash: 0, shake: 0, muted: false,
    drag: null, lastSent: null, endAt: 0, lastRes: null, test: false, fb: {}, attract0: performance.now(), hintFlash: 0 };
  window.GRUI = { U };
  try { U.muted = localStorage.getItem('grMuted') === '1'; } catch (e) {}

  // ================= audio: an original 122 BPM house loop =================
  const A = { ctx: null, out: null, music: null, sfx: null, bus: null, noise: null, events: [], ptr: 0, timer: null, t0: 0 };
  function audioInit() {
    if (A.ctx) return A.ctx;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    A.ctx = new C({ latencyHint: 'interactive' });
    const comp = A.ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    A.out = A.ctx.createGain(); A.out.gain.value = U.muted ? 0 : 0.85; A.out.connect(comp); comp.connect(A.ctx.destination);
    A.sfx = A.ctx.createGain(); A.sfx.gain.value = 0.7; A.sfx.connect(A.out);
    const len = A.ctx.sampleRate, b = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noise = b; return A.ctx;
  }
  const X = () => A.ctx;
  function newBus() { if (A.bus) { try { A.bus.disconnect(); } catch (e) {} } A.bus = A.ctx.createGain(); A.bus.connect(A.out); }
  function envG(t, a, peak, dec, dest) { const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak, t + a); gn.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); gn.connect(dest || A.bus); return gn; }
  function noiseSrc(t, dur) { const s = X().createBufferSource(); s.buffer = A.noise; s.loop = true; s.start(t, Math.random() * 0.5); s.stop(t + dur); return s; }
  function osc(type, fr, t, dur, dest, det) { const o = X().createOscillator(); o.type = type; o.frequency.value = fr; if (det) o.detune.value = det; o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
  // chords: Am7 · Fmaj7 · Cmaj7 · G6 (one per bar)
  const CH = [[220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [261.6, 329.6, 392, 493.9], [196, 246.9, 293.7, 329.6]];
  const ROOT = [55, 43.65, 65.41, 49];
  const SND = {
    kick(t, v = 1) { const o = X().createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.1); o.connect(envG(t, 0.002, 0.9 * v, 0.28)); o.start(t); o.stop(t + 0.35); },
    clap(t, v = 1) { for (const [dt, pk] of [[0, 0.4], [0.012, 0.3], [0.024, 0.35]]) { const n = noiseSrc(t + dt, 0.2), f = X().createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.1; n.connect(f); f.connect(envG(t + dt, 0.001, pk * v, 0.12)); } },
    hat(t, v = 1, open) { const n = noiseSrc(t, open ? 0.3 : 0.06), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = open ? 6500 : 8000; n.connect(f); f.connect(envG(t, 0.001, (open ? 0.1 : 0.07) * v, open ? 0.2 : 0.03)); },
    crash(t) { const n = noiseSrc(t, 1.8), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000; n.connect(f); f.connect(envG(t, 0.002, 0.2, 1.6)); },
    boom(t) { const o = X().createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.9); o.connect(envG(t, 0.005, 0.9, 1.1)); o.start(t); o.stop(t + 1.3); },
    bass(t, ci, dur) {
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.42, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(220, t + dur); f.connect(gn); gn.connect(A.bus);
      osc('sawtooth', ROOT[ci] * 2, t, dur, f); osc('sine', ROOT[ci], t, dur, gn);
    },
    stab(t, ci, cut, v = 1) {
      const gn = envG(t, 0.004, 0.05 * v, 0.22), f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = 3; f.connect(gn);
      for (const fr of CH[ci]) { osc('sawtooth', fr, t, 0.28, f, -7); osc('sawtooth', fr, t, 0.28, f, 7); }
    },
    pad(t, ci, dur, cut) {
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.03, t + 0.4); gn.gain.setValueAtTime(0.03, t + dur - 0.3); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; f.connect(gn); gn.connect(A.bus);
      for (const fr of CH[ci]) osc('triangle', fr, t, dur, f);
    },
    lead(t, fr, dur) { const gn = envG(t, 0.005, 0.045, dur), f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3800; f.connect(gn); osc('square', fr, t, dur, f); osc('triangle', fr * 2, t, dur, f); },
    riser(t, dur) {
      const n = noiseSrc(t, dur), f = X().createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.16, t + dur); n.connect(f); f.connect(gn); gn.connect(A.bus);
    }
  };
  function buildSong() {
    const ev = [], B = GR.B, at = (b, fn, ...a) => ev.push({ t: b * B, fn, a });
    for (let bar = 0; bar < 31; bar++) {
      const s = GR.sectionAt(bar * GR.BAR + 0.001).id, ci = bar % 4, b0 = bar * 4;
      const cut = s === 'intro' ? 700 : s === 'build' ? 1400 : s === 'riser' ? 1400 + (bar - 12) * 420 : s === 'drop' ? 5200 : 900;
      const kickOn = !(bar === 19) && bar < 30;
      for (let q = 0; q < 4; q++) {
        const b = b0 + q;
        if (kickOn) at(b, 'kick', s === 'intro' ? 0.75 : 1);
        if (s !== 'intro' && s !== 'outro') { at(b + 0.5, 'hat', s === 'drop' ? 1.1 : 0.9, true); at(b + 0.25, 'hat', 0.5); at(b + 0.75, 'hat', 0.5); }
        else if (bar < 30) at(b + 0.5, 'hat', 0.6);
        if ((q === 1 || q === 3) && (s === 'build' || s === 'drop' || (s === 'riser' && bar < 18))) at(b, 'clap', 1);
        if ((s === 'build' || s === 'riser' || s === 'drop') && bar !== 19) at(b + 0.5, 'bass', ci, B * 0.42);
        if (s === 'drop') [0, 1, 2, 3].forEach(k => at(b + k * 0.25, 'lead', CH[ci][(q * 4 + k) % 4] * 2, B * 0.2));
      }
      if (bar < 30) { at(b0 + 1.5, 'stab', ci, cut, 1); at(b0 + 3.5, 'stab', ci, cut, 0.8); if (s === 'drop') at(b0 + 2.75, 'stab', ci, cut, 0.7); }
      if (s === 'intro' || s === 'outro') at(b0, 'pad', ci, GR.BAR, s === 'outro' ? 1200 : 900);
      if (bar === 18) for (let k = 0; k < 8; k++) at(b0 + k * 0.5, 'clap', 0.5 + k * 0.05);
      if (bar === 19) for (let k = 0; k < 16; k++) at(b0 + k * 0.25, 'clap', 0.6 + k * 0.04);
      if ([4, 12, 20, 28].includes(bar)) at(b0, 'crash');
    }
    at(12 * 4, 'riser', GR.BAR * 8 / GR.B * GR.B);
    at(20 * 4, 'boom'); at(30 * 4, 'pad', 0, GR.BAR * 1.5, 1600);
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
    while (A.ptr < A.events.length && A.events[A.ptr].t < now + 0.22) { const e = A.events[A.ptr++]; if (e.t >= now - 0.03) { try { SND[e.fn](A.t0 + e.t, ...e.a); } catch (er) {} } }
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

  // ================= geometry: a pseudo-3D street =================
  let W = 0, H = 0, DPR = 1; const geo = {};
  function resize() {
    W = innerWidth; H = innerHeight; DPR = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    geo.hy = H * 0.3; geo.sy = H * 0.8; geo.rw = Math.min(W * 0.47, 300); geo.cx = W / 2;
    SKY.length = 0; let x = -10; while (x < W + 10) { const w = 18 + Math.random() * 42, h = 20 + Math.random() * H * 0.12; SKY.push({ x, w, h, win: Array.from({ length: 6 }, () => Math.random() < 0.35) }); x += w + 2; }
  }
  const SKY = [];
  const sc = z => 1 / (1 + Math.max(-0.45, z) * 0.85);
  const py = z => geo.hy + (geo.sy - geo.hy) * sc(z);
  const px = (x, z) => geo.cx + x * geo.rw * sc(z);

  // ================= drawing =================
  function draw(t) {
    const G = U.G, B = GR.B, ph = ((t / B) % 1 + 1) % 1, pulse = RM ? 0.3 : Math.exp(-ph * 6);
    const oc = G && G.oc.on, sec = G ? GR.sectionAt(G.t).id : 'intro';
    g.save();
    if (U.shake > 0 && !RM) { g.translate((Math.random() - 0.5) * U.shake, (Math.random() - 0.5) * U.shake); U.shake *= 0.85; if (U.shake < 0.3) U.shake = 0; }
    // sky
    let gr = g.createLinearGradient(0, 0, 0, geo.hy); gr.addColorStop(0, '#04061A'); gr.addColorStop(1, oc ? '#5A1460' : '#2A0F55');
    g.fillStyle = gr; g.fillRect(-10, -10, W + 20, geo.hy + 12);
    // skyline with neon windows
    for (const b of SKY) {
      g.fillStyle = '#0B0D2A'; g.fillRect(b.x, geo.hy - b.h, b.w, b.h);
      b.win.forEach((on, i) => { if (!on) return; g.fillStyle = i % 2 ? `rgba(255,61,168,${0.5 + 0.4 * pulse})` : 'rgba(61,240,255,.6)'; g.fillRect(b.x + 4 + (i % 2) * (b.w / 2 - 2), geo.hy - b.h + 6 + Math.floor(i / 2) * 9, 4, 3); });
    }
    g.strokeStyle = `rgba(255,61,168,${0.35 + 0.4 * pulse})`; g.lineWidth = 2; g.beginPath(); g.moveTo(0, geo.hy); g.lineTo(W, geo.hy); g.stroke();
    // ground
    gr = g.createLinearGradient(0, geo.hy, 0, H); gr.addColorStop(0, '#0A0B24'); gr.addColorStop(1, '#05060F'); g.fillStyle = gr; g.fillRect(-10, geo.hy, W + 20, H - geo.hy + 10);
    // road surface
    const zf = 12, zn = -0.4, ze = 3.6;
    g.fillStyle = '#0D1030'; g.beginPath(); g.moveTo(px(-1.08, zf), py(zf)); g.lineTo(px(1.08, zf), py(zf)); g.lineTo(px(1.08, zn), py(zn)); g.lineTo(px(-1.08, zn), py(zn)); g.closePath(); g.fill();
    // wet reflections (bands scrolling toward you)
    for (let k = 0; k < 10; k++) { const z = ((k * 0.4 - t * 1.6) % 4 + 4) % 4 - 0.4; if (z > ze) continue; g.fillStyle = `rgba(139,92,255,${0.05 + 0.04 * Math.sin(k * 2.1)})`; const y0 = py(z), y1 = py(z + 0.1); g.fillRect(px(-1, z), Math.min(y0, y1), px(1, z) - px(-1, z), Math.abs(y0 - y1) + 1); }
    // edges + lane dashes, pulsing on the beat
    g.lineWidth = 3; g.strokeStyle = `rgba(61,240,255,${0.45 + 0.45 * pulse})`;
    for (const s of [-1.04, 1.04]) { g.beginPath(); g.moveTo(px(s, zf), py(zf)); g.lineTo(px(s, zn), py(zn)); g.stroke(); }
    g.strokeStyle = `rgba(255,61,168,${0.4 + 0.5 * pulse})`;
    for (let k = 0; k < 16; k++) { const z = ((k * B * 0.5 - t) % (B * 8) + B * 8) % (B * 8) - 0.4; if (z > 6) continue; g.lineWidth = 3 * sc(z); g.beginPath(); g.moveTo(px(0, z), py(z)); g.lineTo(px(0, z + B * 0.2), py(z + B * 0.2)); g.stroke(); }
    // side towers and billboards
    for (let k = 0; k < 10; k++) for (const s of [-1, 1]) {
      const z = ((k * B * 2 - t) % (B * 20) + B * 20) % (B * 20) - 0.4; if (z > zf) continue;
      const k2 = sc(z), x = px(s * 1.35, z), h = 120 * k2, w = 26 * k2, top = py(z) - h;
      g.fillStyle = '#0B0E2C'; g.fillRect(s < 0 ? x - w : x, top, w, h);
      g.fillStyle = (k + (s > 0 ? 1 : 0)) % 3 === 0 ? `rgba(255,181,71,${0.5 * k2 + 0.2})` : (k % 2 ? `rgba(255,61,168,${0.55 * k2 + 0.15})` : `rgba(61,240,255,${0.5 * k2 + 0.15})`);
      g.fillRect(s < 0 ? x - w + 3 * k2 : x + 3 * k2, top + 8 * k2, w - 6 * k2, 18 * k2);
    }
    // entities, far to near
    if (G) {
      const vis = G.ents.filter(e => { const z = e.ta - G.t; return z < (e.kind === 'boss' ? 5 : ze) && z > (e.done ? -0.35 : -0.2); }).sort((a, b) => b.ta - a.ta);
      for (const e of vis) drawEnt(e, e.ta - G.t, t, pulse);
      // tracers
      const sxp = px(G.sx, 0);
      g.lineWidth = 2;
      for (const tr of U.tracers) { const a = 1 - (t - tr.t0) / 0.1; if (a <= 0) continue; g.strokeStyle = oc ? `rgba(255,255,255,${a})` : (G.weapon === 'arc' ? `rgba(255,181,71,${a})` : `rgba(61,240,255,${a})`); g.beginPath(); g.moveTo(sxp + tr.dx, geo.sy - 10); g.lineTo(tr.x, tr.y); g.stroke(); }
      U.tracers = U.tracers.filter(tr => t - tr.t0 < 0.1);
      drawSquad(G, t, pulse, oc);
    }
    // particles and popups
    for (const p of U.parts) { const k = (t - p.t0) / p.life; if (k >= 1 || k < 0) continue; g.fillStyle = p.c; g.globalAlpha = 1 - k; g.beginPath(); g.arc(p.x + p.vx * (t - p.t0), p.y + p.vy * (t - p.t0), p.r, 0, 7); g.fill(); }
    g.globalAlpha = 1; U.parts = U.parts.filter(p => t - p.t0 < p.life && t >= p.t0 - 1);
    g.textAlign = 'center';
    for (const p of U.popups) { const k = (t - p.t0) / (p.life || 0.9); if (k >= 1 || k < 0) continue; g.globalAlpha = 1 - k * k; g.fillStyle = p.c; g.font = `700 ${p.big ? 30 : 20}px ${FONT}`; g.fillText(p.txt, p.x, p.y - k * 40); g.globalAlpha = 1; }
    U.popups = U.popups.filter(p => t - p.t0 < (p.life || 0.9) && t >= p.t0 - 1);
    // overclock / drop flash
    if (oc) { g.fillStyle = `rgba(255,61,168,${0.05 + 0.06 * pulse})`; g.fillRect(0, 0, W, H); }
    if (U.flash > 0) { g.fillStyle = `rgba(255,255,255,${U.flash})`; g.fillRect(0, 0, W, H); U.flash *= RM ? 0.5 : 0.88; if (U.flash < 0.02) U.flash = 0; }
    g.restore();
  }
  function label(txt, x, y, size, col) { g.font = `700 ${Math.max(9, size)}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = col; g.fillText(txt, x, y); }
  function gateText(o) { return o.op === 'add' ? '+' + o.v : o.op === 'sub' ? '−' + o.v : o.op === 'mul' ? '×' + o.v : 'FIRE +' + Math.round(o.v * 100) + '%'; }
  function drawEnt(e, z, t, pulse) {
    const k = sc(z), x = px(e.x, z), y = py(z);
    if (e.kind === 'gate') {
      if (e.done) return;
      const h = 70 * k, yT = y - h;
      for (const [side, o] of [[-1, e.L], [1, e.R]]) {
        const x0 = px(side < 0 ? -1.02 : 0.02, z), x1 = px(side < 0 ? -0.02 : 1.02, z), good = o.op !== 'sub';
        const col = good ? (o.op === 'rate' ? '255,181,71' : '75,255,165') : '255,77,109';
        g.fillStyle = `rgba(${col},${0.16 + 0.14 * pulse})`; g.fillRect(x0, yT, x1 - x0, h);
        g.strokeStyle = `rgb(${col})`; g.lineWidth = Math.max(1.5, 3 * k); g.strokeRect(x0, yT, x1 - x0, h);
        label(gateText(o), (x0 + x1) / 2, yT + h * 0.62, (o.op === 'rate' ? 18 : 34) * k, '#fff');
      }
      return;
    }
    if (e.kind === 'runner') { if (e.done) return; drawRunner(x, y, 1.1 * k, '#3DF0FF', t, 0.5); g.fillStyle = 'rgba(61,240,255,.25)'; g.beginPath(); g.arc(x, y - 8 * k, 16 * k, 0, 7); g.fill(); label('+1', x, y - 30 * k, 14 * k, '#BFF8FF'); return; }
    if (e.done && e.hp <= 0) return;
    if (e.done) return;
    const fr = e.hp / e.maxHp;
    if (e.kind === 'drone') {
      const s = 14 * k, yy = y - 24 * k + Math.sin(t * 6 + e.id) * 3 * k;
      g.fillStyle = '#FF3DA8'; g.beginPath(); g.moveTo(x, yy - s); g.lineTo(x + s, yy); g.lineTo(x, yy + s); g.lineTo(x - s, yy); g.closePath(); g.fill();
      g.fillStyle = '#2A0520'; g.beginPath(); g.arc(x, yy, s * 0.35, 0, 7); g.fill(); g.fillStyle = '#FFF'; g.beginPath(); g.arc(x, yy, s * 0.15, 0, 7); g.fill();
      hpBar(x, yy - s - 6 * k, 26 * k, fr);
    } else if (e.kind === 'biker') {
      const w = 22 * k, h = 32 * k;
      g.fillStyle = '#FF4D6D'; g.fillRect(x - w / 2, y - h, w, h * 0.75); g.fillStyle = '#1A0610'; g.fillRect(x - w * 0.35, y - h * 0.9, w * 0.7, h * 0.18);
      g.fillStyle = '#FFB547'; g.fillRect(x - w * 0.3, y - h * 0.25, w * 0.6, 4 * k);
      g.strokeStyle = 'rgba(255,77,109,.5)'; g.lineWidth = 6 * k; g.beginPath(); g.moveTo(x, y - h * 0.2); g.lineTo(x, y - h * 0.2 - 30 * k); g.stroke();
      hpBar(x, y - h - 8 * k, 34 * k, fr);
    } else if (e.kind === 'crate') {
      const s = 26 * k; g.fillStyle = '#FFB547'; g.fillRect(x - s / 2, y - s, s, s); g.strokeStyle = '#FFF2D6'; g.lineWidth = 2 * k; g.strokeRect(x - s / 2, y - s, s, s);
      g.fillStyle = `rgba(255,181,71,${0.2 + 0.25 * pulse})`; g.beginPath(); g.arc(x, y - s / 2, s * 1.1, 0, 7); g.fill();
      label('ARC', x, y - s * 0.38, 11 * k, '#2A1600'); label('SHOOT IT', x, y - s - 14 * k, 11 * k, '#FFB547'); hpBar(x, y - s - 6 * k, 30 * k, fr);
    } else if (e.kind === 'boss') {
      const w = 290 * k, h = 220 * k, yy = y - h;
      g.fillStyle = '#2A0B3A'; g.fillRect(x - w / 2, yy + h * 0.2, w, h * 0.65);
      g.fillStyle = '#FF3DA8'; g.fillRect(x - w * 0.3, yy, w * 0.6, h * 0.35);
      g.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * pulse})`; g.fillRect(x - w * 0.18, yy + h * 0.12, w * 0.36, h * 0.08);
      g.fillStyle = '#FF4D6D'; for (const s of [-1, 1]) { g.fillRect(x + s * w * 0.42 - w * 0.08, yy + h * 0.3, w * 0.16, h * 0.7); }
      g.strokeStyle = 'rgba(255,61,168,.7)'; g.lineWidth = 3 * k; g.strokeRect(x - w / 2, yy + h * 0.2, w, h * 0.65);
      label('HUSH ENFORCER', x, yy - 22 * k, 14 * k, '#FF7AD0'); hpBar(x, yy - 12 * k, w, fr, true);
    }
  }
  function hpBar(x, y, w, fr, boss) { const h = boss ? 7 : 4; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x - w / 2, y, w, h); g.fillStyle = boss ? '#FF3DA8' : '#4BFFA5'; g.fillRect(x - w / 2, y, w * Math.max(0, fr), h); }
  function drawRunner(x, y, k, col, t, bob) {
    const by = RM ? 0 : Math.abs(Math.sin(t * 10 + bob * 9)) * 3 * k;
    g.fillStyle = col; g.fillRect(x - 3 * k, y - 15 * k - by, 6 * k, 10 * k);
    g.beginPath(); g.arc(x, y - 18 * k - by, 3.4 * k, 0, 7); g.fill();
    g.fillStyle = '#FFFFFF'; g.fillRect(x - 3 * k, y - 19 * k - by, 6 * k, 1.6 * k);
    g.fillStyle = col; g.fillRect(x - 3 * k, y - 5 * k - by, 2 * k, 5 * k); g.fillRect(x + 1 * k, y - 5 * k - by, 2 * k, 5 * k);
  }
  function drawSquad(G, t, pulse, oc) {
    const n = G.n, show = Math.min(n, 90), cx = px(G.sx, 0), w = GR.width(n) * geo.rw;
    g.fillStyle = oc ? `rgba(255,255,255,${0.12 + 0.1 * pulse})` : `rgba(61,240,255,${0.1 + 0.08 * pulse})`;
    g.beginPath(); g.ellipse(cx, geo.sy + 2, w + 14, 12 + Math.sqrt(show) * 1.2, 0, 0, 7); g.fill();
    const col = oc ? '#FFFFFF' : '#3DF0FF', k = Math.max(0.8, 1.25 - show / 160);
    const pts = [];
    for (let i = 0; i < show; i++) { const r = Math.sqrt(i / Math.max(1, show)) * w, a = i * 2.39996; pts.push([cx + Math.cos(a) * r, geo.sy + Math.sin(a) * r * 0.32, i]); }
    pts.sort((a, b) => a[1] - b[1]);
    for (const [x, y, i] of pts) drawRunner(x, y, k, i === 0 ? '#BFF8FF' : col, t, i);
    g.font = `700 22px ${FONT}`; g.textAlign = 'center';
    const ty = geo.sy - 40 - Math.sqrt(show) * 1.5;
    g.fillStyle = 'rgba(5,6,18,.7)'; const tw = g.measureText(String(n)).width + 20; g.fillRect(cx - tw / 2, ty - 21, tw, 28);
    g.fillStyle = oc ? '#FFB547' : '#3DF0FF'; g.fillText(String(n), cx, ty);
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
    $('wpn').textContent = G.weapon === 'arc' ? 'Arc gun' : 'Pulse rifle';
  }
  function hint(txt) { $('secHint').textContent = txt; }
  function say(txt) { $('live').textContent = txt; }

  // ================= events → sound, popups, particles =================
  const firstSeen = {};
  function onEvents(t) {
    const G = U.G; while (U.evi < G.ev.length) {
      const e = G.ev[U.evi++];
      const sx = px(G.sx, 0), sy = geo.sy;
      if (e.type === 'volley') {
        for (const id of e.hits.slice(0, 6)) { const en = G.ents[G.ents.findIndex(q => q.id === id)]; if (!en) continue; const z = en.ta - G.t; U.tracers.push({ t0: t, x: px(en.x, z), y: py(z) - 24 * sc(z), dx: (Math.random() - 0.5) * GR.width(G.n) * geo.rw }); }
      } else if (e.type === 'kill') {
        sfx('kill'); const en = G.ents.find(q => q.id === e.id), z = en ? en.ta - G.t : 1, x = px(e.x, z), y = py(z) - 20 * sc(z);
        const c = e.kind === 'crate' ? '#FFB547' : e.kind === 'boss' ? '#FFFFFF' : '#FF3DA8', nP = RM ? 3 : e.kind === 'boss' ? 40 : 8;
        for (let i = 0; i < nP; i++) U.parts.push({ t0: t, life: 0.5, x, y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.7) * 220, r: 2 + Math.random() * 3, c });
        if (!firstSeen.kill) { firstSeen.kill = 1; hint('Your squad fires on its own. Line up with enemies'); }
      } else if (e.type === 'gate') {
        sfx(e.good ? 'good' : 'bad'); U.popups.push({ t0: t, txt: gateText(e.g) + '  →  ' + e.n, x: sx, y: sy - 90, c: e.good ? '#4BFFA5' : '#FF4D6D', big: true });
        if (e.good && G.t < GR.DROP_T) U.popups.push({ t0: t + 0.15, txt: 'Overclock +', x: W - 70, y: 110, c: '#FF7AD0' });
        say('Gate ' + gateText(e.g) + '. Squad ' + e.n);
      } else if (e.type === 'runner') { sfx('runner'); U.popups.push({ t0: t, txt: '+1', x: sx, y: sy - 60, c: '#BFF8FF' }); }
      else if (e.type === 'hurt' || e.type === 'bossHit') { sfx('hurt'); U.shake = e.type === 'bossHit' ? 16 : 6; U.popups.push({ t0: t, txt: '−' + e.lost, x: sx, y: sy - 70, c: '#FF4D6D', big: e.type === 'bossHit' }); }
      else if (e.type === 'weapon') { sfx('weapon'); U.popups.push({ t0: t, txt: 'ARC GUN!', x: W / 2, y: H * 0.45, c: '#FFB547', big: true, life: 1.4 }); hint('Arc gun: almost double damage'); say('New weapon: arc gun'); }
      else if (e.type === 'drop') { U.flash = 0.8; U.shake = 12; U.popups.push({ t0: t, txt: 'OVERCLOCK ×' + e.mult.toFixed(1), x: W / 2, y: H * 0.42, c: '#FFFFFF', big: true, life: 1.6 }); say('The drop. Overclock times ' + e.mult.toFixed(1)); }
      else if (e.type === 'bossDown') { sfx('bossDown'); U.flash = 0.6; U.shake = 18; U.popups.push({ t0: t, txt: 'BOSS DOWN', x: W / 2, y: H * 0.4, c: '#FFB547', big: true, life: 1.6 }); say('Boss down'); }
      else if (e.type === 'lost') { sfx('lose'); stopClock(true); U.endAt = performance.now() + 1100; }
      else if (e.type === 'won') { stopClock(true); U.endAt = performance.now() + 900; }
    }
    // teaching hints the first time things show up
    if (!firstSeen.crate && G.ents.some(e => e.kind === 'crate' && !e.done && e.ta - G.t < 2.4)) { firstSeen.crate = 1; hint('Gold crate: shoot it open for a new weapon'); }
    if (!firstSeen.boss && G.ents.some(e => e.kind === 'boss' && e.ta - G.t < 3.2)) { firstSeen.boss = 1; hint('Boss incoming. Overclock melts it'); }
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
    U.G = GR.newGame({ seed: (Math.random() * 1e9) | 0 }); U.evi = 0; U.popups = []; U.parts = []; U.tracers = []; U.lastSent = null; U.endAt = 0; hud.sec = null;
    for (const k in firstSeen) delete firstSeen[k];
    U.test = !!fromBar;
    if (fromBar) { // tester jump: the smart bot plays the street up to that bar, then you take over
      const r = GR.rng(5); let k = 0; while (U.G.t < fromBar * GR.BAR) { if (++k % 6 === 0) GR.act(U.G, { type: 'steer', x: GR.BOTS.smart(U.G, r) }); GR.step(U.G); }
      U.G.test = true; U.evi = U.G.ev.length;
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
    const sub = r.won ? (r.boss ? 'The Enforcer melted on the drop.' : 'The Enforcer walked through you, but your squad survived.') : (r.section === 'drop' ? 'The Enforcer was too much. More good gates means a bigger Overclock.' : 'Line up with enemies to shoot them before they reach you.');
    showSheet(`<span class="tag">${U.test ? 'TESTER RUN · ' : ''}Prototype 1</span><h2>${verdict}</h2>
      <div class="big">${r.survivors}</div><p>${sub}</p>
      <div class="stats"><div class="stat"><b>${r.peak}</b><span>peak squad</span></div><div class="stat"><b>${r.kills}</b><span>kills</span></div><div class="stat"><b>×${r.ocMult.toFixed(1)}</b><span>overclock</span></div>
      <div class="stat"><b>${r.gatesGood}/${r.gatesGood + r.gatesBad}</b><span>good gates</span></div><div class="stat"><b>${r.weapon === 'arc' ? 'Arc' : 'Pulse'}</b><span>weapon</span></div><div class="stat"><b>${r.credits}</b><span>credits</span></div></div>
      <button class="btn pri" data-act="play" type="button">Run it back</button>
      <button class="btn" data-act="feedback" type="button">Give feedback</button>
      <button class="btn" data-act="title" type="button">Title</button>`);
  }

  // ================= screens =================
  const sheet = $('sheet'), card = $('card');
  function showSheet(html) { card.innerHTML = html; sheet.hidden = false; const b = card.querySelector('.btn.pri, .btn'); if (b) b.focus({ preventScroll: true }); }
  function hideSheet() { sheet.hidden = true; }
  function titleScreen() {
    U.playing = false; U.G = null; stopClock(true); game.classList.add('idle');
    showSheet(`<span class="tag">Prototype 1 · one street</span><h1><span class="c">OVER</span><span class="p">CLOCK</span></h1>
      <p>Neon City, 2089. Hush banned music. Your squad brings the beat back.</p>
      <button class="btn pri" data-act="play" type="button">Run</button>
      <button class="btn" data-act="how" type="button">How to play</button>
      <p class="foot">Sound on, silent mode off. About one minute per run.</p>`);
  }
  function howScreen() {
    showSheet(`<h2>How to play</h2><ol class="steps">
      <li><b class="c">Drag left and right</b> anywhere to steer your squad. Arrow keys work too.</li>
      <li><b class="gr">Pick a gate.</b> Green grows your squad or your firepower. <b class="r">Red</b> costs you runners.</li>
      <li><b class="p">Your squad fires on its own.</b> Line up with drones and bikers to shoot them before they hit you.</li>
      <li><b class="g">Shoot the gold crate</b> for the arc gun.</li>
      <li><b class="p">Good gates charge Overclock.</b> When the beat drops, it fires. Melt the boss.</li></ol>
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
    const body = { answers: Object.fromEntries(FQ.map(f => [f.id, U.fb[f.id] || null])), notes: U.fb.note, name: U.fb.name, result: r, tester: U.test, version: 'p1', at: new Date().toISOString() };
    let ok = false;
    try { const db = window.claude && window.claude.use ? await window.claude.use('db') : null; if (db) { await db.collection('feedback').add(body); ok = true; } } catch (e) {}
    if (!ok && location.protocol !== 'file:') { try { const res = await fetch('/forge/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ game: 'cyberpunk-gate-runner' }, body)) }); ok = res.ok; } catch (e) {} }
    if (ok) showSheet(`<h2>Thanks!</h2><p>Your answers went to the crew.</p><button class="btn pri" data-act="play" type="button">Run it back</button><button class="btn" data-act="title" type="button">Title</button>`);
    else { const txt = 'Gate Runner P1 feedback\n' + FQ.map(f => f.q + ' ' + (U.fb[f.id] || '–')).join('\n') + '\nNotes: ' + (U.fb.note || '–') + '\nResult: ' + JSON.stringify(r);
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
  function setMute(m) { U.muted = m; muteBtn.setAttribute('aria-pressed', m); muteBtn.setAttribute('aria-label', m ? 'Music off' : 'Music on'); muteBtn.textContent = m ? '♪̸' : '♪'; muteBtn.style.opacity = m ? 0.5 : 1; if (A.out) A.out.gain.value = m ? 0 : 0.85; try { localStorage.setItem('grMuted', m ? '1' : '0'); } catch (e) {} }
  muteBtn.addEventListener('click', () => setMute(!U.muted)); setMute(U.muted);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  // ================= main loop =================
  let lastF = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastF) / 1000); lastF = now;
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
  addEventListener('resize', resize); resize();
  titleScreen(); requestAnimationFrame(frame);
})();
