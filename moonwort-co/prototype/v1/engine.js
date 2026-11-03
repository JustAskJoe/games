// Moonwort & Co. engine: pure rules (moon, seasons, brewing, judging, the day loop). No DOM; sim.js runs it in Node.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
  const D = root.MW_DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const ING = Object.fromEntries(D.INGREDIENTS.map(i => [i.id, i]));
  const BREW = Object.fromEntries(D.BREWS.map(b => [b.id, b]));
  const AX = ['H', 'M', 'B'];

  // ---------- the real sky ----------
  const SYNODIC = 29.530588853;
  const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14); // a known new moon
  function moon(date) {
    const age = (((date.getTime() - NEW_MOON_REF) / 864e5) % SYNODIC + SYNODIC) % SYNODIC;
    const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
    const name = names[Math.floor((age / SYNODIC) * 8 + 0.5) % 8];
    const lit = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
    return { age, lit, name, waxing: age < SYNODIC / 2 };
  }
  function season(date) {
    const m = date.getMonth();
    return m <= 1 || m === 11 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
  }

  // ---------- brewing ----------
  function processed(id, proc, sky) {
    const t = Object.assign({}, ING[id].t);
    if (proc === 'grind') {
      let k = 'H';
      for (const a of AX) if (Math.abs(t[a]) > Math.abs(t[k])) k = a;
      if (t[k] !== 0) t[k] += Math.sign(t[k]);
    } else if (proc === 'dry') t.B += 1;
    else if (proc === 'moon') t.M += sky && sky.waxing ? 1 : -1;
    return t;
  }
  function profile(items, sky) {
    const p = { H: 0, M: 0, B: 0 };
    for (const it of items) { const t = processed(it.id, it.proc, sky); for (const a of AX) p[a] += t[a]; }
    return p;
  }
  const dist = (p, q) => Math.hypot(p.H - q.H, p.M - q.M, p.B - q.B);
  function resolve(items, sky) {
    const p = profile(items, sky);
    let best = null, bd = 1e9;
    for (const b of D.BREWS) {
      if (b.min && items.length < b.min) continue;
      const d = dist(p, b.at);
      if (d < bd) { bd = d; best = b; }
    }
    if (best && bd <= D.REACH) {
      const stars = bd <= 0.5 ? 3 : bd <= 1.2 ? 2 : 1;
      return { brew: best.id, name: best.name, stars, dist: bd, profile: p };
    }
    // Dud: named after the axis that overshoots most.
    let k = 'H';
    for (const a of AX) if (Math.abs(p[a]) > Math.abs(p[k])) k = a;
    const dud = D.DUDS[k + (p[k] >= 0 ? '+' : '-')];
    return { brew: null, dud: k + (p[k] >= 0 ? '+' : '-'), name: dud.name, fx: dud.fx, stars: 0, dist: bd, profile: p };
  }
  function grade(trouble, res) {
    if (!res.brew) return 'dud';
    if (res.brew === trouble.want) return 'best';
    if (trouble.ok.includes(res.brew)) return 'ok';
    return 'other';
  }
  // The familiar's hint: the biggest gap between what you made and what they need, in words.
  function hint(trouble, p) {
    const at = BREW[trouble.want].at;
    let k = 'H', gap = 0;
    for (const a of AX) { const g = at[a] - p[a]; if (Math.abs(g) > Math.abs(gap)) { gap = g; k = a; } }
    if (Math.abs(gap) < 1) return 'So close. Try a different way of preparing one leaf.';
    const word = gap > 0 ? D.AXES[k].pos : D.AXES[k].neg;
    return Math.abs(gap) >= 3 ? `They need something much more ${word}.` : `A little more ${word}, I think.`;
  }
  // Every way to make a brew from what's on hand (up to 3 ingredients, any process). Used by the sim and hints.
  function solutions(pantry, sky, target, limit) {
    const ids = Object.keys(pantry).filter(id => pantry[id] > 0 && ING[id] && !ING[id].loreOnly);
    const procs = D.PROCESSES.map(p => p.id);
    const out = [];
    const rec = (start, items, used) => {
      if (items.length) {
        const r = resolve(items, sky);
        if (r.brew === target) out.push(items.slice());
        if (limit && out.length >= limit) return true;
      }
      if (items.length === 3) return false;
      for (let i = start; i < ids.length; i++) {
        const id = ids[i];
        if ((used[id] || 0) >= pantry[id]) continue;
        for (const pr of procs) {
          used[id] = (used[id] || 0) + 1; items.push({ id, proc: pr });
          const stop = rec(i, items, used);
          items.pop(); used[id]--;
          if (stop) return true;
        }
      }
      return false;
    };
    rec(0, [], {});
    return out;
  }

  // ---------- the day loop ----------
  function newGame(familiar, date) {
    return {
      v: 1, familiar, day: 0, coin: D.START.coin, trust: { pell: 0, wren: 0, tamsin: 0 },
      pantry: Object.assign({}, D.START.pantry), plots: Array(D.PLOTS).fill(null),
      foraged: false, served: [], seen: {}, brewsFound: {}, log: [], started: date.getTime(), firstBrewMs: null,
      phase: 'dawn', done: false,
    };
  }
  function dawn(G) {
    G.phase = 'day'; G.foraged = false; G.served = [];
    // Plants sown yesterday are ready this morning.
    const out = [];
    G.plots = G.plots.map(pl => { if (pl && pl.day < G.day) { add(G, pl.id, pl.yield); out.push(pl); return null; } return pl; });
    return out;
  }
  function add(G, id, n) { G.pantry[id] = (G.pantry[id] || 0) + n; G.seen[id] = true; }
  function forage(G, date) {
    if (G.foraged) return null;
    G.foraged = true;
    const list = D.FORAGE[season(date)];
    const got = [];
    for (let i = 0; i < 3; i++) { const id = list[(G.day + i) % list.length]; add(G, id, 1); got.push(id); }
    const moonwort = G.day === 1 && !G.seen.moonwort;
    if (moonwort) G.seen.moonwort = true;
    return { got, moonwort };
  }
  function plant(G, plot, seedId) {
    const s = D.SEEDS.find(x => x.id === seedId);
    if (!s || G.plots[plot] || G.coin < s.cost) return false;
    G.coin -= s.cost; G.plots[plot] = { id: s.id, yield: s.yield, day: G.day };
    return true;
  }
  function troubles(G) { return (D.DAYS[G.day] || { troubles: [] }).troubles; }
  function brew(G, items, sky) {
    for (const it of items) if (!(G.pantry[it.id] > 0)) return null;
    const need = {};
    for (const it of items) need[it.id] = (need[it.id] || 0) + 1;
    for (const id in need) if (G.pantry[id] < need[id]) return null;
    for (const id in need) G.pantry[id] -= need[id];
    for (const it of items) G.seen[it.id] = true;
    const res = resolve(items, sky);
    if (res.brew) G.brewsFound[res.brew] = Math.max(G.brewsFound[res.brew] || 0, res.stars);
    return res;
  }
  function serve(G, idx, res, nowMs) {
    const tr = troubles(G)[idx];
    const g = grade(tr, res);
    G.coin += D.PAY[g]; G.trust[tr.v] += D.TRUST[g];
    if (G.firstBrewMs == null) G.firstBrewMs = nowMs - G.started;
    G.served.push({ idx, g, brew: res.brew, name: res.name });
    G.log.push({ day: G.day, v: tr.v, g, brew: res.brew || res.dud });
    return g;
  }
  function endDay(G) {
    G.day++;
    if (G.day >= D.DAYS.length) { G.done = true; G.phase = 'end'; } else G.phase = 'dawn';
  }

  const MW = { ING, BREW, moon, season, processed, profile, resolve, grade, hint, solutions, newGame, dawn, forage, plant, troubles, brew, serve, endDay, add };
  root.MW = MW;
  if (typeof module !== 'undefined') module.exports = MW;
})(typeof window !== 'undefined' ? window : globalThis);
