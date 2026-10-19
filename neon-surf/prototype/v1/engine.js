/* Neon Surf — pure timing engine (no DOM). window.SURF in the browser, module.exports in node.
   Two layouts: 'test' (one-minute wave test on the placeholder beat) and 'song' (full Pure Water-length run, estimated sections).
   © 2026 F Lane d/b/a One Fifty Labs. All rights reserved. */
(function (root) {
  const LANES = [0.26, 0.54, 0.82];          // face height: 0 = lip, 1 = trough
  const LANE_TOL = 0.15;
  const WIN = { perfect: 0.045, good: 0.09, ok: 0.14 };
  // the gate line players learn: the same in every hook (lane index per snare)
  const PATTERN = [1, 2, 1, 0, 0, 1, 2, 1, 2, 2, 1, 0, 1, 0, 1, 2];
  const DEFS = {
    test: [
      { id: 'intro', kind: 'intro', name: 'Paddle in', bars: 2, verb: 'GET READY', hint: 'Listen for the beat', speed: 0.24 },
      { id: 'drop', kind: 'drop', name: 'Drop in', bars: 1, verb: 'DROP', hint: 'Tap on the first beat', speed: 0.24 },
      { id: 'hook1', kind: 'hook', name: 'Hook 1 · The face', bars: 8, verb: 'CARVE', hint: 'Slide to the gate, tap on the snare', speed: 0.26 },
      { id: 'verse', kind: 'pump', name: 'Verse · Glass swells', bars: 8, verb: 'PUMP', hint: 'Tap on every beat', speed: 0.24 },
      { id: 'hook2', kind: 'hook', spray: true, name: 'Hook 2 · Bigger set', bars: 8, verb: 'CARVE', hint: 'Gates on the snare, steer through the gold', speed: 0.32 },
      { id: 'finish', kind: 'finish', name: 'Kick out', bars: 2, verb: 'SNAP', hint: 'One last hit', speed: 0.32 }
    ],
    // section lengths are estimates from 101 BPM / 3:12; players can shift the whole map in the sync screen
    song: [
      { id: 'intro', kind: 'intro', name: 'Cold open', bars: 2, verb: 'GET READY', hint: 'Drop comes with the hook', speed: 0.24 },
      { id: 'hook1', kind: 'hook', drop: true, name: 'Hook 1 · The face', bars: 8, verb: 'CARVE', hint: 'Slide to the gate, tap on the snare', speed: 0.26 },
      { id: 'verse1', kind: 'pump', name: 'Verse 1 · Glass swells', bars: 16, verb: 'PUMP', hint: 'Tap on every beat', speed: 0.24 },
      { id: 'hook2', kind: 'hook', spray: true, name: 'Hook 2 · Bigger set', bars: 8, verb: 'CARVE', hint: 'Gates on the snare, steer through the gold', speed: 0.3 },
      { id: 'verse2', kind: 'reef', name: 'Verse 2 · The reef', bars: 16, verb: 'SNAP', hint: 'Every snare is a gate: zigzag', speed: 0.3 },
      { id: 'hook3', kind: 'hook', spray: true, name: 'Hook 3 · The bomb', bars: 8, verb: 'CARVE', hint: 'Same line, full speed', speed: 0.34 },
      { id: 'verse3', kind: 'adlib', name: 'Verse 3 · Ad-libs', bars: 16, verb: 'PUMP', hint: 'Pump on 1 and 3, steer through the gold', speed: 0.28 },
      { id: 'hook4', kind: 'hook', spray: true, snapEnd: true, name: 'Final hook · The barrel', bars: 7, verb: 'CARVE', hint: 'Last gates, then snap on the final hit', speed: 0.34 }
    ]
  };

  const SURF = { LANES, LANE_TOL, WIN, PATTERN };
  let LAYOUT = [], END = Infinity;

  function configure(o) {
    o = o || {};
    SURF.MODE = o.mode || 'test';
    SURF.BPM = o.bpm || 101;
    SURF.BEAT = 60 / SURF.BPM;
    END = o.end || Infinity;
    let beat = 0;
    LAYOUT = DEFS[SURF.MODE].map(s => { const r = Object.assign({}, s, { b0: beat, b1: beat + s.bars * 4 }); beat += s.bars * 4; return r; });
    SURF.SECTIONS = LAYOUT;
    SURF.TOTAL_BEATS = beat;
    SURF.DURATION = Math.min(beat * SURF.BEAT, END);
    return SURF;
  }
  function sectionAt(t) { const b = t / SURF.BEAT; for (const s of LAYOUT) if (b < s.b1) return s; return LAYOUT[LAYOUT.length - 1]; }
  function speedOf(id) { const s = LAYOUT.find(x => x.id === id); return s ? s.speed : 0.26; }

  function buildChart() {
    const notes = []; let id = 0; const B = SURF.BEAT;
    const add = (b, type, extra) => notes.push(Object.assign({ id: id++, b, t: b * B, type, judged: null }, extra));
    let lc = 0; // lane cycle for ad-lib sprays
    for (const s of LAYOUT) {
      const at = (bar, q) => s.b0 + bar * 4 + q;
      if (s.kind === 'drop') add(s.b0, 'tap', { kind: 'drop', sec: s.id });
      if (s.kind === 'finish') add(s.b0, 'tap', { kind: 'snap', sec: s.id });
      if (s.kind === 'hook') {
        if (s.drop) add(s.b0, 'tap', { kind: 'drop', sec: s.id });
        let k = 0;
        for (let bar = 0; bar < s.bars; bar++) {
          if (s.snapEnd && bar === s.bars - 1) { add(at(bar, 0), 'tap', { kind: 'snap', sec: s.id }); break; }
          for (const off of [1, 3]) {
            const lane = PATTERN[k % PATTERN.length];
            add(at(bar, off), 'gate', { lane, y: LANES[lane], sec: s.id, n: k });
            if (s.spray) { const prev = k === 0 ? 1 : PATTERN[(k - 1) % PATTERN.length]; add(at(bar, off) - 0.5, 'spray', { y: (LANES[prev] + LANES[lane]) / 2, sec: s.id }); }
            k++;
          }
        }
      }
      if (s.kind === 'pump') {
        for (let bar = 0; bar < s.bars; bar++) {
          if (bar === s.bars - 1) { add(at(bar, 0), 'pump', { sec: s.id }); add(at(bar, 1), 'gate', { lane: 1, y: LANES[1], sec: s.id, n: -1 }); add(at(bar, 3), 'gate', { lane: 2, y: LANES[2], sec: s.id, n: -1 }); }
          else for (let q = 0; q < 4; q++) add(at(bar, q), 'pump', { sec: s.id });
        }
      }
      if (s.kind === 'reef') { // one-beat zigzag: every snare is a gate, low/high alternating, mid every 4th bar
        let k = 0;
        for (let bar = 0; bar < s.bars; bar++) for (const off of [1, 3]) { const lane = bar % 4 === 3 && off === 3 ? 1 : (k % 2 ? 0 : 2); add(at(bar, off), 'gate', { lane, y: LANES[lane], sec: s.id, n: -1 }); k++; }
      }
      if (s.kind === 'adlib') { // pump on 1 and 3, gold ad-lib spray on the off-beats in a wandering lane
        const cyc = [0, 2, 1, 2, 0, 1];
        for (let bar = 0; bar < s.bars; bar++) {
          add(at(bar, 0), 'pump', { sec: s.id }); add(at(bar, 2), 'pump', { sec: s.id });
          for (const off of [1.5, 3.5]) { add(at(bar, off), 'spray', { y: LANES[cyc[lc % cyc.length]], sec: s.id }); lc++; }
        }
      }
    }
    return notes.filter(n => n.t < END - 0.25).sort((a, b) => a.t - b.t);
  }

  const isPress = n => n.type !== 'spray';
  function newRun(opts) {
    opts = opts || {};
    return { chart: buildChart(), easy: !!opts.easy, score: 0, combo: 0, maxCombo: 0, flow: 1, streak: 0,
      counts: { perfect: 0, good: 0, ok: 0, wide: 0, miss: 0, spray: 0, sprayMiss: 0, whiff: 0 }, errs: [], events: [], over: false, lastT: -1 };
  }
  const mult = f => [1, 1, 1.5, 2, 3][f];
  function win(S) { const k = S.easy ? 1.5 : 1; return { perfect: WIN.perfect * k, good: WIN.good * k, ok: WIN.ok * k }; }
  function hit(S, n, grade, t, dt) {
    n.judged = grade;
    S.score += Math.round(({ perfect: 300, good: 200, ok: 100, wide: 40 }[grade] || 0) * mult(S.flow));
    S.counts[grade]++;
    if (grade === 'wide') { S.combo = 0; S.streak = 0; }
    else { S.combo++; S.maxCombo = Math.max(S.maxCombo, S.combo); if (++S.streak >= 8 && S.flow < 4) { S.flow++; S.streak = 0; S.events.push({ type: 'flowUp', t, flow: S.flow }); } }
    if (dt != null) S.errs.push(dt);
    S.events.push({ type: 'judge', t, grade, note: n, dt });
  }
  function miss(S, n, t) {
    n.judged = 'miss'; S.counts.miss++; S.combo = 0; S.streak = 0;
    if (S.flow > 1) { S.flow--; S.events.push({ type: 'flowDown', t, flow: S.flow }); }
    S.events.push({ type: 'judge', t, grade: 'miss', note: n });
  }
  function press(S, t, y) {
    if (S.over) return null;
    const w = win(S); let best = null, bestAbs = 1e9;
    for (const n of S.chart) { if (!isPress(n) || n.judged) continue; if (n.t - t > w.ok) break; const a = Math.abs(t - n.t); if (a <= w.ok && a < bestAbs) { best = n; bestAbs = a; } }
    if (!best) { S.counts.whiff++; S.events.push({ type: 'whiff', t }); return null; }
    const dt = t - best.t;
    let grade = bestAbs <= w.perfect ? 'perfect' : bestAbs <= w.good ? 'good' : 'ok';
    if (best.type === 'gate' && Math.abs(y - best.y) > LANE_TOL * (S.easy ? 1.3 : 1)) grade = 'wide';
    hit(S, best, grade, t, dt);
    return { grade, note: best, dt };
  }
  function tick(S, t, y) {
    if (S.over) return;
    const w = win(S);
    for (const n of S.chart) {
      if (n.t > t + 0.01) break;
      if (n.judged) continue;
      if (n.type === 'spray') {
        if (t >= n.t) {
          if (Math.abs(y - n.y) <= 0.12 * (S.easy ? 1.3 : 1)) { n.judged = 'spray'; S.counts.spray++; S.score += Math.round(50 * mult(S.flow)); S.events.push({ type: 'spray', t, note: n }); }
          else { n.judged = 'sprayMiss'; S.counts.sprayMiss++; }
        }
      } else if (t > n.t + w.ok) miss(S, n, t);
    }
    if (t >= SURF.DURATION) S.over = true;
    S.lastT = t;
  }
  function nextPress(S, t) { for (const n of S.chart) if (isPress(n) && !n.judged && n.t > t - 0.2) return n; return null; }
  function results(S) {
    const c = S.counts, total = S.chart.filter(isPress).length || 1;
    const acc = (c.perfect + c.good * 0.7 + c.ok * 0.4 + c.wide * 0.2) / total;
    const grade = acc >= 0.95 ? 'S' : acc >= 0.85 ? 'A' : acc >= 0.7 ? 'B' : acc >= 0.5 ? 'C' : 'D';
    const e = S.errs.slice().sort((a, b) => a - b);
    const mean = e.length ? e.reduce((a, b) => a + b, 0) / e.length : 0, median = e.length ? e[Math.floor(e.length / 2)] : 0;
    // drift check: mean error over the first vs last third of hits (a tempo mismatch shows up here)
    const third = Math.floor(S.errs.length / 3), avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
    const drift = third > 4 ? avg(S.errs.slice(-third)) - avg(S.errs.slice(0, third)) : 0;
    return { total, acc, grade, score: S.score, maxCombo: S.maxCombo, counts: c, meanMs: Math.round(mean * 1000), medianMs: Math.round(median * 1000), driftMs: Math.round(drift * 1000), mode: SURF.MODE };
  }

  // ---- beat detection on decoded audio (mono Float32Array) ----
  // returns { bpm, firstBeat } where firstBeat is the file time (s) of the first strong beat on the detected grid
  function detectBeat(x, sr, opts) {
    opts = opts || {};
    const hop = Math.round(sr / 100), fps = sr / hop, nF = Math.floor(x.length / hop), env = new Float32Array(nF);
    let prev = 0;
    for (let f = 0; f < nF; f++) { let s = 0, r = 0; const o = f * hop; for (let i = 1; i < hop; i++) { const d = x[o + i] - x[o + i - 1]; s += d * d; r += x[o + i] * x[o + i]; } env[f] = Math.log(1e-6 + Math.sqrt(r / hop) + 2 * Math.sqrt(s / hop)); }
    const nov = new Float32Array(nF);
    for (let f = 1; f < nF; f++) { const d = env[f] - env[f - 1]; nov[f] = d > 0 ? d : 0; prev = d; }
    const lo = opts.lo || 96, hi = opts.hi || 106, span = Math.min(nF, Math.round(fps * (opts.secs || 150)));
    let best = { score: -1 };
    const score = (bpm, ph) => { const bf = fps * 60 / bpm; let s = 0; for (let p = ph; p < span; p += bf) { const i = Math.round(p); s += nov[i] + 0.5 * ((nov[i - 1] || 0) + (nov[i + 1] || 0)); } return s; };
    for (let bpm = lo; bpm <= hi; bpm += 0.05) { const bf = fps * 60 / bpm; for (let ph = 0; ph < bf; ph += 1) { const s = score(bpm, ph); if (s > best.score) best = { score: s, bpm, ph }; } }
    for (let bpm = best.bpm - 0.06; bpm <= best.bpm + 0.06; bpm += 0.005) { const bf = fps * 60 / bpm; for (let ph = Math.max(0, best.ph - 3); ph < Math.min(bf, best.ph + 3); ph += 0.25) { const s = score(bpm, ph); if (s > best.score) best = { score: s, bpm, ph }; } }
    // first beat on the grid with real energy (cold open)
    const bf = fps * 60 / best.bpm, peak = nov.reduce((m, v) => Math.max(m, v), 0);
    let first = best.ph;
    for (let p = best.ph; p < nF; p += bf) { const i = Math.round(p); const v = Math.max(nov[i] || 0, nov[i - 1] || 0, nov[i + 1] || 0); if (v > peak * 0.15) { first = p; break; } }
    return { bpm: Math.round(best.bpm * 100) / 100, firstBeat: first / fps };
  }

  // ---- headless bots ----
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function simulate(n, seed, bot) {
    const r = rng(seed || 7), out = [];
    for (let i = 0; i < n; i++) {
      const S = newRun({ easy: bot.easy }), presses = S.chart.filter(isPress);
      let y = LANES[1], target = y, k = 0; const dt = 1 / 120;
      const taps = presses.map(p => ({ t: p.t + gauss(r) * bot.timingSd + (bot.bias || 0), skip: r() < (bot.forget || 0) }));
      for (let t = 0; t <= SURF.DURATION + 0.3; t += dt) {
        const nxt = S.chart.find(c => !c.judged && (c.type === 'gate' || c.type === 'spray') && c.t > t - 0.05);
        if (nxt && nxt.t - t < bot.steerLag * 2.2) target = nxt.y;
        y += (target - y) * Math.min(1, dt / bot.steerLag * 2.5);
        while (k < taps.length && taps[k].t <= t) { if (!taps[k].skip) press(S, taps[k].t, y + (bot.laneSd ? gauss(r) * bot.laneSd : 0)); k++; }
        tick(S, t, y);
      }
      out.push(results(S));
    }
    const avg = f => out.reduce((a, o) => a + f(o), 0) / out.length, grades = {};
    out.forEach(o => grades[o.grade] = (grades[o.grade] || 0) + 1);
    return { runs: n, acc: avg(o => o.acc), miss: avg(o => o.counts.miss), wide: avg(o => o.counts.wide), spray: avg(o => o.counts.spray / (o.counts.spray + o.counts.sprayMiss || 1)), grades };
  }

  Object.assign(SURF, { configure, sectionAt, speedOf, buildChart, newRun, press, tick, nextPress, results, detectBeat, simulate });
  configure({ mode: 'test' });
  if (typeof module !== 'undefined' && module.exports) module.exports = SURF; else root.SURF = SURF;
})(typeof window !== 'undefined' ? window : globalThis);
