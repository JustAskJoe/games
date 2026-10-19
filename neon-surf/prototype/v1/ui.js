/* Neon Surf wave test — audio, rendering, input, screens.
   © 2026 F Lane d/b/a One Fifty Labs. All rights reserved. */
(function () {
  const S = window.SURF;
  const $ = id => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- prefs (per-viewer convenience only) ----------
  const U = { coach: true, easy: false, showMs: false, calib: 0, seenHow: false,
    run: null, playing: false, paused: false, steerY: S.LANES[1], targetY: S.LANES[1], vy: 0,
    keys: {}, steerPid: null, mode: 'test', song: null, clicks: false, popups: [], parts: [], trail: [], evi: 0, last: null, lastRes: null, fb: {} };
  try { const p = JSON.parse(localStorage.getItem('neonSurfPrefs') || '{}'); Object.assign(U, { coach: p.coach ?? true, easy: !!p.easy, showMs: !!p.showMs, calib: +p.calib || 0, seenHow: !!p.seenHow }); } catch (e) {}
  function savePrefs() { try { localStorage.setItem('neonSurfPrefs', JSON.stringify({ coach: U.coach, easy: U.easy, showMs: U.showMs, calib: U.calib, seenHow: U.seenHow })); } catch (e) {} }

  // ---------- audio: an original placeholder beat at 101 BPM, scheduled on the audio clock ----------
  const A = { ctx: null, out: null, bus: null, noise: null, events: [], ptr: 0, timer: null, t0: 0 };
  function audioInit() {
    if (A.ctx) return A.ctx;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    A.ctx = new C({ latencyHint: 'interactive' });
    const comp = A.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    A.out = A.ctx.createGain(); A.out.gain.value = 0.9; A.out.connect(comp); comp.connect(A.ctx.destination);
    const len = A.ctx.sampleRate, b = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noise = b; return A.ctx;
  }
  function newBus() { if (A.bus) { try { A.bus.disconnect(); } catch (e) {} } A.bus = A.ctx.createGain(); A.bus.connect(A.out); }
  const X = () => A.ctx;
  function envG(t, a, peak, dec) { const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak, t + a); gn.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); gn.connect(A.bus); return gn; }
  function noiseSrc(t, dur) { const s = X().createBufferSource(); s.buffer = A.noise; s.start(t, Math.random() * 0.5); s.stop(t + dur); return s; }
  const SND = {
    kick(t, v = 1) { const o = X().createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); o.connect(envG(t, 0.002, 0.95 * v, 0.3)); o.start(t); o.stop(t + 0.4); },
    snare(t, v = 1) {
      for (const [dt, pk] of [[0, 0.55], [0.011, 0.35], [0.022, 0.25]]) { const n = noiseSrc(t + dt, 0.2), f = X().createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8; n.connect(f); f.connect(envG(t + dt, 0.001, pk * v, 0.15)); }
      const o = X().createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.08); o.connect(envG(t, 0.001, 0.22 * v, 0.08)); o.start(t); o.stop(t + 0.15);
    },
    hat(t, v = 1) { const n = noiseSrc(t, 0.06), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7200; n.connect(f); f.connect(envG(t, 0.001, 0.12 * v, 0.035)); },
    crash(t) { const n = noiseSrc(t, 1.6), f = X().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4200; n.connect(f); f.connect(envG(t, 0.002, 0.22, 1.4)); },
    bass(t, fr, dur) { const o = X().createOscillator(), o2 = X().createOscillator(); o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = fr; o2.frequency.value = fr * 2; const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.5, t + 0.012); gn.gain.setValueAtTime(0.5, t + Math.max(0.02, dur - 0.05)); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); const g2 = X().createGain(); g2.gain.value = 0.12; o.connect(gn); o2.connect(g2); g2.connect(gn); gn.connect(A.bus); o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02); },
    lead(t, fr, dur) {
      const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.06, t + 0.01); gn.gain.setValueAtTime(0.06, t + dur * 0.8); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      const f = X().createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 4400; f.connect(gn); gn.connect(A.bus);
      const lfo = X().createOscillator(), lg = X().createGain(); lfo.frequency.value = 6.5; lg.gain.value = fr * 0.012; lfo.connect(lg);
      for (const det of [-8, 8]) { const o = X().createOscillator(); o.type = 'sawtooth'; o.detune.value = det; o.frequency.setValueAtTime(fr * 0.92, t); o.frequency.exponentialRampToValueAtTime(fr, t + 0.04); lg.connect(o.frequency); o.connect(f); o.start(t); o.stop(t + dur + 0.08); }
      lfo.start(t); lfo.stop(t + dur + 0.08);
    },
    pad(t, frs, dur) { const gn = X().createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.035, t + 0.3); gn.gain.setValueAtTime(0.035, t + dur - 0.4); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); gn.connect(A.bus); for (const fr of frs) { const o = X().createOscillator(); o.type = 'triangle'; o.frequency.value = fr; o.connect(gn); o.start(t); o.stop(t + dur + 0.05); } },
    click(t, acc) { const o = X().createOscillator(); o.type = 'sine'; o.frequency.value = acc ? 1600 : 1100; o.connect(envG(t, 0.001, acc ? 0.5 : 0.35, 0.04)); o.start(t); o.stop(t + 0.08); }
  };
  const ROOTS = [65.41, 65.41, 51.91, 58.27];
  const MOTIF = [784, 0, 932.3, 0, 1046.5, 0, 932.3, 784, 0, 1046.5, 1244.5, 0, 1046.5, 0, 932.3, 0];
  function buildSong() {
    const ev = [], at = (b, fn, ...a) => ev.push({ t: b * S.BEAT, fn, a });
    for (const s of S.SECTIONS) {
      for (let b = s.b0; b < s.b1; b++) {
        const q = (b - s.b0) % 4, bar = Math.floor((b - s.b0) / 4);
        if (s.id === 'intro') { at(b, 'click', q === 0); at(b, 'hat', 0.6); at(b + 0.5, 'hat', 0.4); continue; }
        if (s.id === 'finish' && bar > 0) continue;
        if (q === 0 || q === 2) at(b, 'kick', 1);
        if ((s.id === 'hook1' || s.id === 'hook2') && q === 2) at(b + 0.5, 'kick', 0.7);
        if (q === 1 || q === 3) at(b, 'snare', s.id === 'verse' ? 0.7 : 1);
        if (s.id !== 'finish') { at(b, 'hat', 0.7); at(b + 0.5, 'hat', s.id === 'hook2' ? 0.8 : 0.5); }
        if (q === 0) {
          const root = ROOTS[bar % 4];
          if (s.id === 'drop' || s.id === 'finish') at(b, 'bass', root, S.BEAT * 3.8);
          else { at(b, 'bass', root, S.BEAT * 1.4); at(b + 2.5, 'bass', root, S.BEAT * 0.4); }
        }
        if ((s.id === 'hook1' || s.id === 'hook2') && q === 0 && bar % 2 === 0)
          MOTIF.forEach((f, i) => { if (f) at(b + i * 0.5, 'lead', f, S.BEAT * 0.45); });
        if (s.id === 'verse' && q === 0 && bar % 2 === 0) at(b, 'pad', bar % 4 === 0 ? [261.6, 311.1, 392] : [207.7, 261.6, 311.1], S.BEAT * 8);
      }
      if (s.id === 'drop' || s.id === 'hook2' || s.id === 'finish') at(s.b0, 'crash');
    }
    ev.sort((a, b) => a.t - b.t); return ev;
  }
  function startClock(events, song) {
    newBus(); A.events = events; A.ptr = 0;
    const T = A.ctx.currentTime + 0.45; A.t0 = T;
    if (song) { // play the viewer's own file; song time 0 = its first downbeat
      const src = A.ctx.createBufferSource(); src.buffer = song.buf; src.connect(A.bus); src.start(T, 0); A.src = src;
      A.t0 = T + Math.max(0, song.offset);
    }
    clearInterval(A.timer); A.timer = setInterval(sched, 25); sched();
  }
  function sched() {
    if (!A.ctx || A.ctx.state !== 'running') return;
    const now = A.ctx.currentTime - A.t0;
    while (A.ptr < A.events.length && A.events[A.ptr].t < now + 0.22) { const e = A.events[A.ptr++]; if (e.t >= now - 0.03) SND[e.fn](A.t0 + e.t, ...e.a); }
  }
  function stopClock() { clearInterval(A.timer); A.timer = null; if (A.src) { try { A.src.stop(); } catch (e) {} A.src = null; } if (A.bus) { try { A.bus.disconnect(); } catch (e) {} A.bus = null; } }
  // song time of what is being HEARD, at a given performance.now() timestamp
  function songAt(perfMs) {
    const c = A.ctx; if (!c) return 0;
    if (c.getOutputTimestamp) { const ts = c.getOutputTimestamp(); if (ts.performanceTime) return ts.contextTime + (perfMs - ts.performanceTime) / 1000 - A.t0; }
    return c.currentTime - (c.outputLatency || c.baseLatency || 0) + (perfMs - performance.now()) / 1000 - A.t0;
  }

  // ---------- geometry ----------
  let W = 0, H = 0, DPR = 1;
  const geo = {};
  function resize() {
    W = innerWidth; H = innerHeight; DPR = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    geo.hy = H * 0.3; geo.FT = H * 0.39; geo.FB = H * 0.8; geo.SX = Math.max(120, W * (W > 900 ? 0.3 : 0.34));
    geo.btn = { x: W - 74, y: H - 96, r: Math.max(34, Math.min(46, W * 0.11)) };
    geo.sun = { x: W * 0.74, y: geo.hy, r: Math.min(W, H) * 0.15 };
    STARS.length = 0; for (let i = 0; i < 40; i++) STARS.push([Math.random() * W, Math.random() * geo.hy * 0.9, Math.random() * 1.4 + 0.4]);
  }
  const STARS = [];
  const ly = y => geo.FT + y * (geo.FB - geo.FT);
  const lipY = (x, t) => geo.FT - (geo.FB - geo.FT) * 0.08 + Math.sin(x / W * 3.2 + t * 0.9) * H * 0.012;
  const pps = sec => S.speedOf(sec) * W / S.BEAT;
  const noteX = (n, t) => geo.SX + (n.t - t) * pps(n.sec);

  // ---------- drawing ----------
  function draw(t, calT) {
    const ph = ((t / S.BEAT) % 1 + 1) % 1, pulse = t >= 0 ? Math.exp(-ph * 5) : 0;
    const run = U.run, flow = run ? run.flow : 1;
    // sky
    let gr = g.createLinearGradient(0, 0, 0, geo.hy); gr.addColorStop(0, '#05021A'); gr.addColorStop(1, '#3A0B52');
    g.fillStyle = gr; g.fillRect(0, 0, W, geo.hy + 1);
    g.fillStyle = 'rgba(242,239,230,.6)'; for (const [x, y, r] of STARS) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    // sun
    const sn = geo.sun;
    g.fillStyle = `rgba(255,61,168,${0.1 + 0.15 * pulse})`; g.beginPath(); g.arc(sn.x, sn.y, sn.r * 1.35, Math.PI, 0); g.fill();
    g.fillStyle = '#FF3DA8'; g.beginPath(); g.arc(sn.x, sn.y, sn.r, Math.PI, 0); g.fill();
    g.fillStyle = '#3A0B52'; for (let i = 0; i < 4; i++) { const yy = sn.y - sn.r * (0.12 + i * 0.16); g.fillRect(sn.x - sn.r, yy, sn.r * 2, 2 + i * 1.6); }
    // grid ocean
    g.fillStyle = '#06021A'; g.fillRect(0, geo.hy, W, H - geo.hy);
    g.strokeStyle = 'rgba(61,240,255,.28)'; g.lineWidth = 1;
    const sc = ((t * 0.6) % 1 + 1) % 1;
    for (let i = 0; i < 9; i++) { const p = (i + sc) / 9, y = geo.hy + (H - geo.hy) * p * p; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(sn.x, geo.hy); g.lineTo(sn.x + i * W * 0.22, H); g.stroke(); }
    // wave face
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W + 10; x += 10) g.lineTo(x, lipY(x, t));
    g.lineTo(W, H); g.closePath();
    gr = g.createLinearGradient(0, geo.FT - 40, 0, H); gr.addColorStop(0, '#2E0F78'); gr.addColorStop(1, '#08031E'); g.fillStyle = gr; g.fill();
    // contour lines scroll past (world moves left)
    g.lineWidth = 1.5;
    for (let k = 1; k <= 5; k++) {
      const base = geo.FT + (geo.FB - geo.FT) * (k / 5.2), off = t * pps('hook1') * 0.9;
      g.strokeStyle = `rgba(61,240,255,${0.16 + 0.05 * k})`; g.beginPath();
      for (let x = 0; x <= W + 10; x += 12) { const y = base + Math.sin((x + off) / (70 + k * 18)) * (4 + k * 1.5); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    // lip glow: brighter with flow and on the beat
    const glow = 0.18 + 0.32 * pulse + flow * 0.05;
    g.strokeStyle = `rgba(255,61,168,${glow})`; g.lineWidth = 18 + flow * 4; g.beginPath();
    for (let x = 0; x <= W + 10; x += 10) { const y = lipY(x, t); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.strokeStyle = '#FF7AD0'; g.lineWidth = 4; g.stroke();
    // lane guide band to the next gate (coach)
    if (run && U.coach) {
      const ng = run.chart.find(n => n.type === 'gate' && !n.judged && n.t > calT - 0.1);
      if (ng) { const x = noteX(ng, t); if (x < W + 40 && x > geo.SX) { g.fillStyle = 'rgba(255,122,208,.12)'; const hh = (geo.FB - geo.FT) * 0.13; g.fillRect(geo.SX, ly(ng.y) - hh, x - geo.SX, hh * 2); } }
    }
    // notes
    if (run) for (const n of run.chart) {
      const x = noteX(n, t); if (x < -80 || x > W + 80) continue;
      const age = n.judged ? Math.max(0, t - n.t) : 0;
      if (n.type === 'gate') drawGate(x, ly(n.y), n, age);
      else if (n.type === 'spray') { if (n.judged === 'spray') continue; g.fillStyle = n.judged ? 'rgba(255,181,71,.25)' : '#FFB547'; g.beginPath(); g.arc(x, ly(n.y), 7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,181,71,.2)'; g.beginPath(); g.arc(x, ly(n.y), 15, 0, 7); g.fill(); }
      else if (n.type === 'pump') { if (n.judged && n.judged !== 'miss') continue; const y = ly(U.steerY); g.strokeStyle = n.judged ? 'rgba(160,160,180,.35)' : '#3DF0FF'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 16, 0, 7); g.stroke(); }
      else if (n.type === 'tap') { if (n.judged && n.judged !== 'miss') continue; g.strokeStyle = '#FFB547'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, geo.FT); g.lineTo(x, geo.FB); g.stroke(); g.fillStyle = '#FFB547'; g.font = '700 16px "Space Grotesk", system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(n.kind === 'drop' ? 'DROP' : 'SNAP', x, geo.FT - 14); }
    }
    // trail
    if (U.trail.length > 1) {
      g.strokeStyle = 'rgba(61,240,255,.25)'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath();
      U.trail.forEach((p, i) => { const x = geo.SX - (t - p.t) * pps(S.sectionAt(Math.max(0, t)).id); i ? g.lineTo(x, ly(p.y) + 8) : g.moveTo(x, ly(p.y) + 8); });
      g.stroke(); g.strokeStyle = '#BFF8FF'; g.lineWidth = 3; g.stroke();
    }
    drawSurfer(geo.SX, ly(U.steerY), U.vy);
    // whitewater chasing from the left: closer when flow is low
    const ww = W * (0.05 + (4 - flow) * 0.03) + pulse * 8;
    g.fillStyle = 'rgba(214,246,255,.55)';
    for (let i = 0; i < 14; i++) { const yy = geo.FT + (geo.FB - geo.FT + 60) * (i / 13); const r = 14 + ((i * 37) % 11) + pulse * 4; g.beginPath(); g.arc(ww - r * 0.4 + Math.sin(t * 3 + i) * 4, yy, r, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(214,246,255,.4)'; g.fillRect(0, geo.FT - 20, Math.max(0, ww - 18), H);
    // particles + popups
    for (const p of U.parts) { const a = 1 - (t - p.t0) / p.life; if (a <= 0) continue; g.fillStyle = p.c.replace('A', a.toFixed(2)); g.beginPath(); g.arc(p.x + p.vx * (t - p.t0), p.y + p.vy * (t - p.t0) + 120 * (t - p.t0) ** 2, p.r, 0, 7); g.fill(); }
    U.parts = U.parts.filter(p => t - p.t0 < p.life);
    g.textAlign = 'center';
    for (const p of U.popups) { const k = (t - p.t0) / 0.7; if (k > 1) continue; g.globalAlpha = 1 - k; g.fillStyle = p.c; g.font = `700 ${p.big ? 26 : 20}px "Space Grotesk", system-ui, sans-serif`; g.fillText(p.txt, p.x, p.y - k * 34); if (p.sub) { g.font = '500 13px "Space Grotesk", system-ui, sans-serif'; g.fillText(p.sub, p.x, p.y - k * 34 + 18); } g.globalAlpha = 1; }
    U.popups = U.popups.filter(p => t - p.t0 < 0.7);
    drawControls(t, calT, pulse);
  }
  function drawGate(x, y, n, age) {
    const hh = (geo.FB - geo.FT) * 0.11;
    let col = '#FF7AD0', a = 1;
    if (n.judged === 'miss') col = 'rgba(150,150,170,.45)';
    else if (n.judged === 'wide') col = '#FFB547';
    else if (n.judged) { col = '#3DF0FF'; a = Math.max(0, 1 - age * 2.5); }
    if (a <= 0) return;
    g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y - hh); g.lineTo(x, y - hh * 0.45); g.moveTo(x, y + hh * 0.45); g.lineTo(x, y + hh); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(x - 10, y - 12); g.lineTo(x + 4, y); g.lineTo(x - 10, y + 12); g.stroke();
    if (!n.judged) { g.strokeStyle = 'rgba(255,61,168,.3)'; g.lineWidth = 14; g.beginPath(); g.moveTo(x, y - hh); g.lineTo(x, y + hh); g.stroke(); }
    g.globalAlpha = 1;
  }
  function drawSurfer(x, y, vy) {
    const s = Math.max(0.9, Math.min(1.4, H / 650));
    g.save(); g.translate(x, y); g.rotate(Math.max(-0.5, Math.min(0.5, vy * 0.35))); g.scale(s, s);
    g.fillStyle = '#0A0616'; g.strokeStyle = '#3DF0FF'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-48, 6); g.quadraticCurveTo(0, -6, 48, 2); g.quadraticCurveTo(54, 7, 46, 11); g.quadraticCurveTo(0, 16, -48, 6); g.closePath(); g.fill(); g.stroke();
    const body = () => { g.beginPath(); g.moveTo(-14, 2); g.lineTo(-4, -24); g.moveTo(14, 2); g.lineTo(4, -24); g.moveTo(0, -24); g.lineTo(6, -50); g.moveTo(-24, -36); g.lineTo(6, -44); g.lineTo(30, -40); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(61,240,255,.3)'; g.lineWidth = 14; body(); g.stroke();
    g.strokeStyle = '#F2EFE6'; g.lineWidth = 6; body(); g.stroke();
    g.fillStyle = '#F2EFE6'; g.beginPath(); g.arc(9, -60, 8, 0, 7); g.fill();
    g.restore();
  }
  function drawControls(t, calT, pulse) {
    // steer rail on the left
    const rx = 20;
    g.strokeStyle = 'rgba(242,239,230,.25)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(rx, geo.FT); g.lineTo(rx, geo.FB); g.stroke();
    for (const l of S.LANES) { g.fillStyle = 'rgba(242,239,230,.35)'; g.fillRect(rx + 6, ly(l) - 1, 8, 2); }
    g.fillStyle = '#3DF0FF'; g.beginPath(); g.arc(rx, ly(U.steerY), 9, 0, 7); g.fill();
    // action button with approach ring
    const b = geo.btn, run = U.run, nx = run && S.nextPress(run, calT);
    let col = '#3DF0FF', verb = 'TAP';
    if (nx) { if (nx.type === 'gate') { col = '#FF7AD0'; verb = 'CARVE'; } else if (nx.type === 'pump') verb = 'PUMP'; else { col = '#FFB547'; verb = nx.kind === 'drop' ? 'DROP' : 'SNAP'; } }
    g.fillStyle = 'rgba(5,5,12,.7)'; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill();
    g.strokeStyle = 'rgba(242,239,230,.3)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = col; g.globalAlpha = 0.35 + 0.65 * pulse; g.beginPath(); g.arc(b.x, b.y, b.r * 0.42, 0, 7); g.fill(); g.globalAlpha = 1;
    if (nx) { const d = nx.t - calT, span = S.BEAT * 1.25; if (d > -0.05 && d < span) { const r = b.r * (0.92 + 1.3 * Math.max(0, d) / span); g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(b.x, b.y, r, 0, 7); g.stroke(); } }
    g.fillStyle = '#F2EFE6'; g.font = '700 13px "Space Grotesk", system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(verb, b.x, b.y + b.r + 18);
    // coach line
    if (run && U.coach && U.playing) {
      let msg = S.sectionAt(Math.max(0, calT)).hint;
      if (nx && nx.type === 'gate' && Math.abs(U.steerY - nx.y) > S.LANE_TOL && nx.t - calT < S.BEAT * 2.2) msg = (nx.y < U.steerY ? 'Slide your left thumb UP' : 'Slide your left thumb DOWN') + ' to the pink gate';
      else if (nx && nx.t - calT < S.BEAT * 1.25 && nx.t - calT > 0) msg = 'Tap the right side when the ring closes';
      if (calT < 0) msg = 'Listen… the drop is coming';
      g.font = '500 14px "Space Grotesk", system-ui, sans-serif'; const w = Math.min(W - 40, g.measureText(msg).width + 28);
      g.fillStyle = 'rgba(5,5,12,.65)'; rr(W / 2 - w / 2, geo.FB + 20, w, 32, 10); g.fill();
      g.fillStyle = '#F2EFE6'; g.fillText(msg, W / 2, geo.FB + 41, W - 50);
    }
  }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function burst(x, y, c, n, t) { if (RM) n = Math.ceil(n / 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160; U.parts.push({ x, y, vx: Math.cos(a) * sp - 80, vy: Math.sin(a) * sp - 60, r: 2 + Math.random() * 3, c, t0: t, life: 0.6 }); } }

  // ---------- game loop ----------
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = U.last ? Math.min(0.05, (now - U.last) / 1000) : 0; U.last = now;
    let t = -0.5;
    if (U.playing && !U.paused && A.ctx) t = songAt(now);
    else if (U.run && U.frozenT != null) t = U.frozenT;
    const calT = t - U.calib;
    if (U.playing && !U.paused) {
      if (U.keys.up) U.targetY -= 2.4 * dt; if (U.keys.down) U.targetY += 2.4 * dt;
      U.targetY = Math.max(0.04, Math.min(0.96, U.targetY));
      const prev = U.steerY; U.steerY += (U.targetY - U.steerY) * Math.min(1, dt * 16); U.vy = dt ? (U.steerY - prev) / dt : 0;
      S.tick(U.run, calT, U.steerY);
      if (t >= 0) { U.trail.push({ t, y: U.steerY }); while (U.trail.length && t - U.trail[0].t > 1.6) U.trail.shift(); }
      consume(t); hud(calT);
      if (U.run.over && calT > S.DURATION + 0.4) endRun(t);
    }
    draw(t, calT);
  }
  function consume(t) {
    const ev = U.run.events;
    for (; U.evi < ev.length; U.evi++) {
      const e = ev[U.evi], y = ly(U.steerY) - 70;
      if (e.type === 'judge') {
        const map = { perfect: ['PERFECT', '#3DF0FF'], good: ['GOOD', '#FF7AD0'], ok: ['OK', '#FFB547'], wide: ['WIDE', '#FFB547'], miss: ['MISS', '#9A96AE'] };
        const [txt, c] = map[e.grade];
        let sub = e.grade === 'wide' ? 'right time, wrong height' : '';
        if (U.showMs && e.dt != null) sub = (e.dt >= 0 ? '+' : '') + Math.round(e.dt * 1000) + ' ms' + (sub ? ' · ' + sub : '');
        U.popups.push({ txt, sub, c, x: geo.SX + 10, y, t0: t, big: e.grade === 'perfect' });
        if (e.grade !== 'miss' && e.grade !== 'wide') burst(geo.SX + 30, ly(U.steerY), e.note.type === 'gate' ? 'rgba(255,122,208,A)' : 'rgba(61,240,255,A)', e.grade === 'perfect' ? 18 : 10, t);
      } else if (e.type === 'spray') burst(geo.SX + 20, ly(e.note.y), 'rgba(255,181,71,A)', 8, t);
      else if (e.type === 'flowUp') U.popups.push({ txt: e.flow === 4 ? 'FLOW MAX' : 'FLOW ' + e.flow, c: '#FFB547', x: W / 2, y: geo.FT - 30, t0: t, big: true });
      else if (e.type === 'flowDown') U.popups.push({ txt: 'flow down', c: '#9A96AE', x: W / 2, y: geo.FT - 30, t0: t });
    }
  }
  let lastHud = '';
  function hud(calT) {
    const r = U.run, s = S.sectionAt(Math.max(0, calT));
    const key = s.id + r.flow + r.score + r.combo;
    if (key === lastHud) return; lastHud = key;
    if ($('secName').textContent !== s.name) { $('secName').textContent = s.name; $('live').textContent = s.name; }
    $('secHint').textContent = s.verb + ' · ' + s.hint;
    $('flowName').textContent = r.flow === 4 ? 'FLOW MAX' : 'FLOW ' + r.flow;
    [...$('flowBar').children].forEach((i, k) => i.className = k < r.flow ? (r.flow === 4 ? 'on max' : 'on') : '');
    $('scoreLine').textContent = r.score.toLocaleString() + ' · combo ' + r.combo;
  }

  // ---------- input ----------
  const game = $('game');
  function steerTo(py) { U.targetY = Math.max(0.04, Math.min(0.96, (py - geo.FT) / (geo.FB - geo.FT))); }
  function doPress(ts) {
    if (!U.playing || U.paused) return;
    const t = songAt(ts) - U.calib;
    S.press(U.run, t, U.steerY);
  }
  game.addEventListener('pointerdown', e => {
    if (e.target.closest('#menuBtn')) return;
    if (!U.playing) return;
    e.preventDefault();
    if (e.clientX < W * 0.5) { U.steerPid = e.pointerId; steerTo(e.clientY); try { game.setPointerCapture(e.pointerId); } catch (er) {} }
    else doPress(e.timeStamp);
  });
  game.addEventListener('pointermove', e => { if (e.pointerId === U.steerPid) steerTo(e.clientY); });
  const endSteer = e => { if (e.pointerId === U.steerPid) U.steerPid = null; };
  game.addEventListener('pointerup', endSteer); game.addEventListener('pointercancel', endSteer);
  game.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  addEventListener('keydown', e => {
    if (CAL.active && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); if (!e.repeat) calTap(e.timeStamp); return; }
    if (!U.playing) return;
    if (['ArrowUp', 'KeyW'].includes(e.code)) { U.keys.up = true; e.preventDefault(); }
    if (['ArrowDown', 'KeyS'].includes(e.code)) { U.keys.down = true; e.preventDefault(); }
    if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) U.targetY = S.LANES[+e.code.slice(-1) - 1];
    if (['Space', 'KeyJ', 'KeyK', 'Enter'].includes(e.code)) { e.preventDefault(); if (!e.repeat) doPress(e.timeStamp); }
    if (e.code === 'Escape') openMenu();
  });
  addEventListener('keyup', e => { if (['ArrowUp', 'KeyW'].includes(e.code)) U.keys.up = false; if (['ArrowDown', 'KeyS'].includes(e.code)) U.keys.down = false; });
  $('menuBtn').addEventListener('click', openMenu);
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden && U.playing && !U.paused) openMenu(); });

  // ---------- run lifecycle ----------
  function clickTrack(dur) { const ev = []; for (let b = 0; b * S.BEAT < dur; b++) ev.push({ t: b * S.BEAT, fn: 'click', a: [b % 4 === 0] }); return ev; }
  async function ride(mode) {
    mode = mode || U.mode || 'test';
    if (mode === 'song' && !U.song) return songSheet();
    U.mode = mode;
    if (!audioInit()) { showSheet(`<h2>No audio</h2><p>This browser can't play Web Audio, which the beat needs.</p><button class="btn" data-act="title">Back</button>`); return; }
    try { await A.ctx.resume(); } catch (e) {}
    hideSheet();
    U.run = S.newRun({ easy: U.easy }); U.evi = 0; U.trail = []; U.popups = []; U.parts = []; U.steerY = U.targetY = S.LANES[1]; U.paused = false; U.frozenT = null; lastHud = '';
    if (mode === 'song') { S.configure({ mode: 'song', bpm: U.song.bpm, end: U.song.dur - U.song.offset }); U.run = S.newRun({ easy: U.easy }); startClock(U.clicks ? clickTrack(S.DURATION) : [], U.song); }
    else { S.configure({ mode: 'test' }); U.run = S.newRun({ easy: U.easy }); startClock(buildSong()); }
    U.playing = true;
  }
  function endRun(t) {
    U.playing = false; U.frozenT = t; stopClock();
    const r = S.results(U.run); U.lastRes = r; showResults(r);
  }
  function openMenu() {
    if (U.playing && !U.paused) { U.paused = true; U.frozenT = songAt(performance.now()); try { A.ctx.suspend(); } catch (e) {} }
    showSheet(menuHTML());
  }
  async function resume() { hideSheet(); if (U.playing && U.paused) { try { await A.ctx.resume(); } catch (e) {} U.paused = false; U.frozenT = null; } }
  function quit() { stopClock(); U.playing = false; U.paused = false; U.run = null; U.frozenT = null; try { A.ctx && A.ctx.resume(); } catch (e) {} title(); }

  // ---------- calibration: tap along to clicks, offset = median error ----------
  const CAL = { active: false, taps: [], t0: 0 };
  async function startCal() {
    if (!audioInit()) return;
    try { await A.ctx.resume(); } catch (e) {}
    const ev = []; for (let b = 0; b < 16; b++) ev.push({ t: b * S.BEAT, fn: 'click', a: [b % 4 === 0] });
    startClock(ev); CAL.active = true; CAL.taps = [];
    $('calMsg').textContent = 'Tap the ring on every click…';
    clearTimeout(CAL.to); CAL.to = setTimeout(finishCal, (16 * S.BEAT + 0.9) * 1000);
  }
  function calTap(ts) {
    if (!CAL.active) return;
    const t = songAt(ts); const b = Math.round(t / S.BEAT);
    if (b >= 3 && b < 16) CAL.taps.push(t - b * S.BEAT);
    const r = $('calRing'); if (r) { r.classList.add('flash'); setTimeout(() => r.classList.remove('flash'), 90); }
  }
  function finishCal() {
    CAL.active = false; stopClock();
    const e = CAL.taps.filter(x => Math.abs(x) < 0.25).sort((a, b) => a - b);
    const m = $('calMsg'); if (!m) return;
    if (e.length < 6) { m.textContent = `Only ${e.length} taps counted. Tap once on every click, then try again.`; return; }
    const med = e[Math.floor(e.length / 2)]; U.calib = Math.max(-0.2, Math.min(0.25, med)); savePrefs();
    const ms = Math.round(U.calib * 1000);
    m.textContent = Math.abs(ms) < 12 ? `You're right on the beat (${ms} ms). Nothing to fix.` : `You tap ${Math.abs(ms)} ms ${ms > 0 ? 'late' : 'early'} on this device. Fixed: the game now shifts by that much.`;
  }

  // ---------- screens ----------
  const sheet = $('sheet'), card = $('card');
  function showSheet(html) { card.innerHTML = html; sheet.hidden = false; const f = card.querySelector('.btn'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 30); }
  function hideSheet() { sheet.hidden = true; }
  const FOOT = '<p class="foot">© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.</p>';
  const tog = (k, label, sub) => `<div class="tog"><span>${label}<small>${sub}</small></span><button class="sw" data-tog="${k}" aria-pressed="${U[k]}" aria-label="${label}"></button></div>`;
  const TOGS = () => tog('coach', 'Coach', 'Highlights the next gate and gives tips') + tog('easy', 'Easy timing', 'Wider hit windows for first rides') + tog('showMs', 'Show timing in ms', 'For tuning: early / late on every hit');
  function title() {
    showSheet(`<span class="tag">Wave test · v2</span>
      <h1><span class="p">NEON</span> <span class="c">SURF</span></h1>
      <p>Ride the neon wave to Pure Water. Your left thumb steers. Your right thumb taps on the beat.</p>
      <div class="note">Sound on, headphones help. On iPhone, flip off silent mode.</div>
      ${U.song ? `<button class="btn pri" data-act="rideSong">Ride your song</button><button class="btn" data-act="song">Song &amp; sync settings</button>` : `<button class="btn pri" data-act="song">Load your song file</button>`}
      <button class="btn" data-act="rideTest">Quick test: placeholder beat (1 min)</button>
      <div class="row"><button class="btn" data-act="how">How to play</button><button class="btn" data-act="cal">Tune timing</button></div>
      <div style="margin-top:12px">${TOGS()}</div>${FOOT}`);
  }
  function how(fromRide) {
    showSheet(`<h2>How to ride</h2><ol class="steps">
      <li><b class="c">Left thumb steers.</b> Hold it anywhere on the left half and slide up or down. The surfer follows your thumb's height. (Keyboard: ↑ ↓)</li>
      <li><b class="p">Right thumb taps.</b> Tap anywhere on the right half. The ring around the button shrinks onto the beat: tap when it touches. (Keyboard: Space)</li>
      <li><b class="p">Pink gates:</b> be at the gate's height and tap as it reaches you. That's a carve. Right time but wrong height counts as "wide".</li>
      <li><b class="c">Cyan rings</b> in the calm verse: tap on every beat to pump.</li>
      <li><b class="g">Gold spray:</b> just steer through it, no tap.</li>
      <li>Hit 8 in a row to raise your <b class="g">flow</b>. A miss drops it, and the whitewater on the left creeps closer.</li></ol>
      ${fromRide ? '<button class="btn pri" data-act="ride">Got it, ride</button>' : ''}
      <button class="btn" data-act="title">Back</button>`);
    U.seenHow = true; savePrefs();
  }
  function cal() {
    showSheet(`<h2>Tune timing</h2><p>Every phone and headset delays sound a little. Tap the ring on each click and the game corrects for your device.</p>
      <button id="calRing" aria-label="Tap here on each click">Tap here<br>on each click</button>
      <p id="calMsg" class="note" aria-live="polite">Current offset: ${Math.round(U.calib * 1000)} ms. Press Start, then tap 16 times.</p>
      <button class="btn cy" data-act="calStart">Start</button>
      <div class="row"><button class="btn" data-act="calReset">Reset to 0</button><button class="btn" data-act="${U.run && U.paused ? 'menu' : 'title'}">Done</button></div>`);
    $('calRing').addEventListener('pointerdown', e => { e.preventDefault(); calTap(e.timeStamp); });
  }
  function menuHTML() {
    const inRun = U.playing && U.paused;
    return `<h2>${inRun ? 'Paused' : 'Menu'}</h2>
      ${inRun ? '<button class="btn pri" data-act="resume">Resume</button>' : ''}
      <button class="btn" data-act="ride">${inRun ? 'Restart the wave' : 'Ride the wave'}</button>
      <div class="row"><button class="btn" data-act="how">How to play</button><button class="btn" data-act="cal">Tune timing</button></div>
      <button class="btn" data-act="feedback">Give feedback</button>
      <div style="margin-top:12px">${TOGS()}</div>
      <button class="btn" data-act="quit">Quit to title</button>`;
  }
  function showResults(r) {
    const c = r.counts, sprays = c.spray + c.sprayMiss;
    let tip = Math.abs(r.meanMs) > 25 ? `On average you tapped ${Math.abs(r.meanMs)} ms ${r.meanMs > 0 ? 'late' : 'early'}. Tune timing can correct for that if it felt off.` : 'Your timing was centered on the beat.';
    if (c.wide >= 3) tip += ` ${c.wide} taps were on time but at the wrong height: start sliding toward the gate earlier.`;
    if (c.miss >= 10 && !U.easy) tip += ' Try Easy timing for a wider hit window.';
    if (r.mode === 'song' && Math.abs(r.driftMs) > 30) tip += ` Your taps drifted ${Math.abs(r.driftMs)} ms ${r.driftMs > 0 ? 'later' : 'earlier'} by the end, so the song's tempo may be slightly off: open Song &amp; sync and nudge BPM ${r.driftMs > 0 ? 'down' : 'up'}.`;
    showSheet(`<span class="tag">${r.mode === 'song' ? 'Full song' : 'Wave test'} · results</span>
      <div class="row" style="align-items:flex-end;gap:16px"><div class="big" style="color:${r.grade === 'S' ? 'var(--gold)' : r.grade === 'A' ? 'var(--cyan)' : 'var(--pink2)'}">${r.grade}</div>
      <div><div style="font-size:24px;font-weight:700">${r.score.toLocaleString()}</div><div style="color:var(--mute)">${Math.round(r.acc * 100)}% accuracy · best combo ${r.maxCombo}</div></div></div>
      <div class="stats"><div class="stat"><b style="color:var(--cyan)">${c.perfect}</b><span>Perfect</span></div><div class="stat"><b style="color:var(--pink2)">${c.good}</b><span>Good</span></div><div class="stat"><b style="color:var(--gold)">${c.ok}</b><span>OK</span></div>
      <div class="stat"><b>${c.wide}</b><span>Wide</span></div><div class="stat"><b>${c.miss}</b><span>Miss</span></div><div class="stat"><b>${c.spray}/${sprays}</b><span>Spray</span></div></div>
      <div class="note">${tip}</div>
      <button class="btn pri" data-act="ride">Ride again</button>
      <button class="btn cy" data-act="feedback">Give feedback (1 min)</button>
      <div class="row"><button class="btn" data-act="${r.mode === 'song' ? 'song' : 'cal'}">${r.mode === 'song' ? 'Song &amp; sync' : 'Tune timing'}</button><button class="btn" data-act="title">Title</button></div>${FOOT}`);
  }

  // ---------- your song: decode in memory, detect tempo + first beat, sync tools ----------
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const songKey = f => 'neonSurfSong:' + f.name + ':' + f.size;
  function songSheet(msg) {
    const sg = U.song;
    showSheet(`<h2>Your song</h2>
      <p>Pick your own copy of Pure Water (MP3, M4A or WAV). It stays on this device: nothing is uploaded.</p>
      <label class="btn cy" for="songFile" tabindex="0">${sg ? 'Choose a different file' : 'Choose audio file'}</label>
      <input type="file" id="songFile" accept="audio/*,.mp3,.m4a,.wav,.aac" class="sr">
      <div class="note" id="songStat" aria-live="polite">${msg || (sg ? `<b>${sg.name.replace(/</g, '&lt;')}</b> · ${fmt(sg.dur)}` : 'No song loaded yet.')}</div>
      ${sg ? `<div class="stats"><div class="stat"><b>${sg.bpm.toFixed(2)}</b><span>BPM</span></div><div class="stat"><b>${sg.offset.toFixed(3)}s</b><span>First beat</span></div><div class="stat"><b>${sg.auto ? 'Auto' : 'Tuned'}</b><span>Sync</span></div></div>
      <p style="font-size:14px">Press Preview: the clicks should land on the song's beats, louder click on each bar's first beat. If not, nudge until they do.</p>
      <button class="btn" data-act="preview">${A.previewing ? 'Stop preview' : 'Preview with clicks (15 s)'}</button>
      <div class="row"><button class="btn" data-act="nudge" data-v="-0.02">Clicks earlier</button><button class="btn" data-act="nudge" data-v="0.02">Clicks later</button></div>
      <div class="row"><button class="btn" data-act="shiftBeat" data-v="-1">− 1 beat</button><button class="btn" data-act="shiftBeat" data-v="1">+ 1 beat</button></div>
      <div class="row"><button class="btn" data-act="bpm" data-v="-0.05">BPM − 0.05</button><button class="btn" data-act="bpm" data-v="0.05">BPM + 0.05</button></div>
      <div class="tog"><span>Clicks during the ride<small>Hear the grid over the song while you play</small></span><button class="sw" data-tog="clicks" aria-pressed="${U.clicks}" aria-label="Clicks during the ride"></button></div>
      <div class="note">The gate map is my estimate of the song's sections (hook starts after a 2-bar cold open, 16-bar verses). If hooks and verses land in the wrong places, tell Claude the real timestamps.</div>
      <button class="btn pri" data-act="rideSong">Ride the full song</button>` : ''}
      <button class="btn" data-act="title">Back</button>`);
    $('songFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) loadSong(f); });
  }
  async function loadSong(f) {
    if (!audioInit()) return songSheet('This browser can\'t play Web Audio.');
    $('songStat').textContent = 'Reading ' + f.name + '…';
    try {
      const ab = await f.arrayBuffer();
      const buf = await new Promise((res, rej) => { const p = A.ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
      $('songStat').textContent = 'Finding the beat…';
      await new Promise(r => setTimeout(r, 30));
      const ch0 = buf.getChannelData(0), ch1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : ch0, k = buf.sampleRate > 30000 ? 2 : 1;
      const mono = new Float32Array(Math.floor(ch0.length / k));
      for (let i = 0; i < mono.length; i++) { let v = 0; for (let j = 0; j < k; j++) v += ch0[i * k + j] + ch1[i * k + j]; mono[i] = v / (2 * k); }
      const d = S.detectBeat(mono, buf.sampleRate / k, { lo: 95, hi: 107 });
      U.song = { buf, name: f.name, size: f.size, key: songKey(f), dur: buf.duration, bpm: d.bpm, offset: d.firstBeat, auto: true };
      try { const sv = JSON.parse(localStorage.getItem(U.song.key) || 'null'); if (sv) Object.assign(U.song, { bpm: sv.bpm, offset: sv.offset, auto: false }); } catch (e) {}
      songSheet();
    } catch (e) { songSheet("Couldn't read that file. Try an MP3, M4A or WAV you own (streaming apps' downloads are locked)."); }
  }
  function saveSong() { const sg = U.song; sg.auto = false; try { localStorage.setItem(sg.key, JSON.stringify({ bpm: sg.bpm, offset: sg.offset })); } catch (e) {} }
  async function preview() {
    if (A.previewing) { stopPreview(); return songSheet(); }
    try { await A.ctx.resume(); } catch (e) {}
    S.configure({ mode: 'song', bpm: U.song.bpm });
    startClock(clickTrack(15), U.song); A.previewing = true; songSheet();
    clearTimeout(A.pvTo); A.pvTo = setTimeout(() => { if (A.previewing) { stopPreview(); if (!sheet.hidden && $('songFile')) songSheet(); } }, (15 + U.song.offset + 0.6) * 1000);
  }
  function stopPreview() { A.previewing = false; clearTimeout(A.pvTo); stopClock(); }

  // ---------- feedback (artifact db, copy fallback) ----------
  const FQ = [
    { k: 'fun', q: 'How fun was it?', o: ['1', '2', '3', '4', '5'] },
    { k: 'beat', q: 'Did tapping on the beat feel good?', o: ['Yes', 'Sort of', 'No'] },
    { k: 'steer', q: 'Steering felt…', o: ['Too slow', 'Just right', 'Too twitchy'] },
    { k: 'hard', q: 'Difficulty', o: ['Too easy', 'About right', 'Too hard'] },
    { k: 'music', q: 'Did the wave feel connected to the music?', o: ['1', '2', '3', '4', '5'] },
    { k: 'dir', q: 'Which direction excites you more?', o: ['Surfing', 'Racing', 'Neither yet'] }
  ];
  function feedback() {
    showSheet(`<h2>Quick feedback</h2><p>Tap an answer for each. Only the first one is required.</p>
      ${FQ.map(f => `<div class="fq"><div class="q">${f.q}</div><div class="opts">${f.o.map(o => `<button class="opt" data-fq="${f.k}" data-fv="${o}" aria-pressed="${U.fb[f.k] === o}">${o}</button>`).join('')}</div></div>`).join('')}
      <div class="fq"><label class="lb" for="fbNote">Anything else? What would make you ride again?</label><textarea id="fbNote">${(U.fb.note || '').replace(/</g, '&lt;')}</textarea></div>
      <div class="err" id="fbErr" role="alert"></div>
      <button class="btn pri" data-act="fbSend">Send</button>
      <button class="btn" data-act="${U.run && U.paused ? 'menu' : U.lastRes ? 'results' : 'title'}">Back</button>`);
  }
  async function sendFeedback() {
    U.fb.note = ($('fbNote') || {}).value || '';
    if (!U.fb.fun) { $('fbErr').textContent = 'Pick how fun it was first (1 to 5).'; return; }
    const r = U.lastRes;
    const row = Object.assign({}, U.fb, { at: Date.now(), build: 'wave-test-v2', mode: U.mode, songBpm: U.song ? U.song.bpm : null, easy: U.easy, coach: U.coach, calibMs: Math.round(U.calib * 1000),
      result: r ? { grade: r.grade, acc: Math.round(r.acc * 100), score: r.score, miss: r.counts.miss, wide: r.counts.wide, meanMs: r.meanMs } : null,
      device: (navigator.userAgent || '').slice(0, 140) });
    let saved = false;
    try {
      const db = window.claude && await window.claude.use('db');
      if (db) {
        try { const user = await window.claude.use('user'); if (user) row.uid = await user.id(); } catch (e) {}
        await db.collection('feedback').add(row); saved = true;
      }
    } catch (e) { saved = false; }
    if (saved) { U.fb = {}; showSheet(`<h2>Thanks!</h2><p>Your feedback was saved.</p><button class="btn pri" data-act="ride">Ride again</button><button class="btn" data-act="title">Title</button>`); return; }
    const txt = 'Neon Surf wave test feedback\n' + FQ.map(f => `${f.q} ${row[f.k] || '-'}`).join('\n') + `\nNotes: ${row.note || '-'}\nResult: ${r ? `${r.grade} ${Math.round(r.acc * 100)}% (mean ${r.meanMs} ms)` : '-'}`;
    showSheet(`<h2>Couldn't save here</h2><p>This view can't store feedback. Copy your answers and send them to F instead.</p><textarea id="fbCopy" readonly>${txt.replace(/</g, '&lt;')}</textarea>
      <button class="btn pri" data-act="fbCopy">Copy answers</button><button class="btn" data-act="title">Title</button>`);
  }

  card.addEventListener('click', async e => {
    const b = e.target.closest('[data-act],[data-tog],[data-fq]'); if (!b) return;
    if (b.dataset.tog) { const k = b.dataset.tog; U[k] = !U[k]; b.setAttribute('aria-pressed', U[k]); savePrefs(); return; }
    if (b.dataset.fq) { U.fb.note = ($('fbNote') || {}).value || U.fb.note; U.fb[b.dataset.fq] = b.dataset.fv; card.querySelectorAll(`[data-fq="${b.dataset.fq}"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); if ($('fbErr')) $('fbErr').textContent = ''; return; }
    const a = b.dataset.act;
    if (a === 'ride' || a === 'rideTest' || a === 'rideSong') {
      const mode = a === 'rideTest' ? 'test' : a === 'rideSong' ? 'song' : (U.mode || 'test');
      if (A.previewing) stopPreview();
      if (!U.seenHow) { U.mode = mode; return how(true); }
      if (U.playing) { stopClock(); U.playing = false; } return ride(mode);
    }
    if (a === 'song') { if (A.previewing) stopPreview(); return songSheet(); }
    if (a === 'preview') return preview();
    if (a === 'nudge' || a === 'shiftBeat' || a === 'bpm') {
      const v = +b.dataset.v, sg = U.song;
      if (a === 'nudge') sg.offset = Math.max(0, sg.offset + v);   // clicks sit at file time offset + k beats
      if (a === 'shiftBeat') sg.offset = Math.max(0, sg.offset + v * 60 / sg.bpm);
      if (a === 'bpm') sg.bpm = Math.round((sg.bpm + v) * 100) / 100;
      saveSong(); const was = A.previewing; if (was) stopPreview(); songSheet(); if (was) preview(); return;
    }
    if (a === 'how') return how(false);
    if (a === 'cal') return cal();
    if (a === 'calStart') return startCal();
    if (a === 'calReset') { U.calib = 0; savePrefs(); $('calMsg').textContent = 'Offset reset to 0 ms.'; return; }
    if (a === 'title') { if (A.previewing) stopPreview(); if (U.playing) return quit(); return title(); }
    if (a === 'menu') return showSheet(menuHTML());
    if (a === 'resume') return resume();
    if (a === 'quit') return quit();
    if (a === 'results') return showResults(U.lastRes);
    if (a === 'feedback') return feedback();
    if (a === 'fbSend') return sendFeedback();
    if (a === 'fbCopy') { const ta = $('fbCopy'); try { await navigator.clipboard.writeText(ta.value); b.textContent = 'Copied'; } catch (er) { ta.select(); try { document.execCommand('copy'); b.textContent = 'Copied'; } catch (e2) { b.textContent = 'Select the text and copy it'; } } }
  });

  resize(); title(); requestAnimationFrame(frame);
  window.SURFUI = { U, A, songAt, ride, loadSong, openMenu, endRun: () => endRun(songAt(performance.now())) };
})();
