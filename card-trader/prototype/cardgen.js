// Intergalactic Card Trader · card generator. Pure: seeded, no DOM, runs in node and the browser (like engine.js).
// CG.build(seed, template) builds the whole card universe U: 3 games x 3 eras of sets, every card's printings,
// pack pull tables, 6 sealed types per set, price curves by era and day, bulk and repack math, modern reprint flags.
// All numbers come from the template (data/template-stats.json); fitting it to real data changes numbers, not code.
// Design: design/card-generator.md. How the engine plugs it in: design/card-generator-integration.md.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';

// ---------- seeded RNG (same generator as engine.js; state is plain JSON { _s }) ----------
function R(S) { S._s = (S._s + 0x6D2B79F5) >>> 0; let t = S._s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85EBCA6B); h ^= h >>> 13; return h >>> 0; }
// rng can be a function, a state object like G (uses and advances G._s) or a number (a fresh stream from that seed).
const rngOf = r => typeof r === 'function' ? r : r && typeof r._s === 'number' ? () => R(r) : (S => () => R(S))({ _s: r >>> 0 });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const range = (rnd, a) => a[0] + rnd() * (a[1] - a[0]);
const irange = (rnd, a) => a[0] + Math.floor(rnd() * (a[1] - a[0] + 1));
const pickA = (rnd, a) => a[Math.floor(rnd() * a.length)];
const gauss = rnd => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
function pickW(rnd, t) { let s = 0; for (const e of t) s += e[e.length - 1]; let x = rnd() * s; for (const e of t) { x -= e[e.length - 1]; if (x < 0) return e; } return t[t.length - 1]; }
function shuffle(rnd, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const RANK = { c: 0, u: 1, r: 2, h: 3, g: 4 };
const RARS = ['c', 'u', 'r', 'h', 'g'];
const ERA_KEY = { vintage: 'v', mid: 'm', modern: 'n' };

// ---------- names: each species' own syllables, rendered in its script by the UI (decoded = readable) ----------
// Content, not statistics, so it lives here and not in the template. Nothing here is a real card or set name.
const LANG = {
  shell: { syl: ['lu', 'mo', 'sha', 'pe', 'ri', 'na', 'ol', 've', 'coo', 'mei', 'wa', 'li', 'oa', 'nu', 'sel', 'ra', 'thi', 'ma', 'ou', 'e', 'qua', 'lo'], tick: 0,
    kinds: ['Crab', 'Eel', 'Ray', 'Whale', 'Siren', 'Nautilus', 'Urchin', 'Jelly', 'Turtle', 'Seahorse', 'Squid', 'Otter', 'Snail', 'Shrimp', 'Clam', 'Kraken', 'Manta', 'Lobster', 'Sprite', 'Newt'],
    adj: ['Tide', 'Reef', 'Brine', 'Coral', 'Pearl', 'Kelp', 'Foam', 'Drift', 'Lantern', 'Deep', 'Surf', 'Abyss', 'Moon', 'Silt', 'Undertow', 'Spindle', 'Salt', 'Lagoon'],
    title: ['Queen', 'Warden', 'Sage', 'Matriarch', 'Keeper', 'Herald', 'Titan', 'Elder'],
    setNoun: ['Tides', 'Depths', 'Currents', 'Shoals', 'Wrecks', 'Lagoons', 'Swells', 'Trenches', 'Shallows', 'Moonpools', 'Rip', 'Reefs'] },
  hive: { syl: ['zz', 'kik', 'tra', 'vex', 'krr', 'zek', 'tik', 'ix', 'ka', 'rr', 'zo', 'vrr', 'kt', 'za', 'ki', 'xa', 'tzz', 'ek', 'dri', 'kla', 'zun'], tick: 0.3,
    kinds: ['Drone', 'Mite', 'Beetle', 'Mantis', 'Hornet', 'Locust', 'Wasp', 'Moth', 'Ant', 'Cricket', 'Weevil', 'Scarab', 'Firefly', 'Cicada', 'Larva', 'Tick', 'Dragonfly', 'Termite', 'Roach', 'Aphid'],
    adj: ['Gear', 'Chrome', 'Comb', 'Wax', 'Volt', 'Pollen', 'Stinger', 'Iron', 'Swarm', 'Rivet', 'Hex', 'Servo', 'Static', 'Brass', 'Nectar', 'Piston', 'Signal', 'Cog'],
    title: ['Overlord', 'Prime', 'Marshal', 'Engineer', 'Vanguard', 'Monarch', 'Core', 'Regent'],
    setNoun: ['Protocols', 'Swarms', 'Combs', 'Engines', 'Uprising', 'Circuits', 'Assembly', 'Colonies', 'Gambits', 'Overclock', 'Signals', 'Foundry'] },
  star: { syl: ['pu', 'fi', 'la', 'mi', 'no', 'va', 'li', 'su', 'fae', 'ru', 'pi', 'sel', 'ney', 'bo', 'lo', 'mee', 'ti', 'ora', 'wi', 'shi', 'aa'], tick: 0,
    kinds: ['Fox', 'Owl', 'Pup', 'Toad', 'Koi', 'Bat', 'Stag', 'Lion', 'Whale', 'Phoenix', 'Dragon', 'Moth', 'Kit', 'Hare', 'Lynx', 'Swan', 'Sprite', 'Seal', 'Wyrm', 'Finch'],
    adj: ['Comet', 'Star', 'Nova', 'Orbit', 'Glimmer', 'Moon', 'Halo', 'Aurora', 'Pulsar', 'Nebula', 'Eclipse', 'Dust', 'Twilight', 'Zenith', 'Quasar', 'Solstice', 'Meteor', 'Lumen'],
    title: ['Weaver', 'Seer', 'Guardian', 'Wanderer', 'Herald', 'Dreamer', 'Sovereign', 'Origin'],
    setNoun: ['Skies', 'Constellations', 'Orbits', 'Nebulae', 'Eclipses', 'Horizons', 'Starfall', 'Auroras', 'Zeniths', 'Comets', 'Twilights', 'Threads'] },
};
const GAME_INFO = { shell: { name: 'Shellstorm', species: 'mollu', script: 'spiral' }, hive: { name: 'Hive Gambit', species: 'zekk', script: 'dots' }, star: { name: 'Starweave', species: 'puffi', script: 'waves' } };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function word(rnd, L, n) { let w = ''; for (let i = 0; i < n; i++) w += (i && rnd() < L.tick ? '\'' : '') + pickA(rnd, L.syl); return cap(w); }

// Edit distance, stopping once it passes k (the blocklist only cares about "within k").
function near(a, b, k) {
  if (Math.abs(a.length - b.length) > k) return false;
  let prev = []; for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let lo = i;
    for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (cur[j] < lo) lo = cur[j]; }
    if (lo > k) return false; prev = cur;
  }
  return prev[b.length] <= k;
}
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
// The private real-name list (never committed). Bucketed by length so the check stays cheap.
function makeBlock(list) {
  if (!list || !list.length) return null;
  const by = {}; for (const n of list) { const s = norm(n); if (s) (by[s.length] = by[s.length] || []).push(s); }
  return name => { const s = norm(name); for (let l = s.length - 2; l <= s.length + 2; l++) for (const b of by[l] || []) if (near(s, b, 2)) return true; return false; };
}

// ---------- build ----------
function build(seed, template, opts) {
  const T = template || defaultTemplate();
  if (!T) throw new Error('cardgen: no template (pass data/template-stats.json)');
  opts = opts || {};
  seed = seed >>> 0;
  const blocked = makeBlock(opts.blocklist);
  const sub = key => rngOf({ _s: hash(seed + '/' + key) });
  const P = T.printings, cards = [], sets = [], byId = {}, setById = {}, ix = {}, rosters = {};
  let rerolls = 0;

  for (const g of Object.keys(GAME_INFO)) {
    // The roster: every creature this game has ever printed. Famous ones show up in more sets, at higher rarity.
    const L = LANG[g], rnd = sub(g + '/roster'), used = {}, roster = [], n = T.fame.roster;
    for (let i = 0; i < n; i++) {
      const kind = pickA(rnd, L.kinds), hero = i < 30;
      let name, tries = 0;
      do {
        const x = rnd();
        name = hero && x < 0.7 ? word(rnd, L, 2 + (rnd() < 0.4 ? 1 : 0)) + ', ' + pickA(rnd, L.adj) + ' ' + pickA(rnd, L.title)
          : x < 0.45 ? word(rnd, L, 2) + ' ' + kind : x < 0.8 ? pickA(rnd, L.adj) + ' ' + kind : kind + ' of ' + word(rnd, L, 2);
        if (++tries > 40) name = word(rnd, L, 3) + ' ' + kind;
        if (blocked && !used[name] && blocked(name)) { rerolls++; used[name] = 'x'; }
      } while (used[name]);
      used[name] = 1; roster.push({ i, name, kind, fame: Math.pow(1 - i / n, T.fame.pow) });
    }
    rosters[g] = roster;
    const setNames = {};
    for (const era of T.eraOrder) for (let k = 0; k < T.eras[era].sets; k++) makeSet(g, era, k, setNames);
  }

  function setName(rnd, L, taken) {
    let nm;
    do { nm = rnd() < 0.5 ? pickA(rnd, L.adj) + ' ' + pickA(rnd, L.setNoun) : word(rnd, L, 2) + ' ' + pickA(rnd, L.setNoun); if (!taken[nm] && blocked && blocked(nm)) { rerolls++; taken[nm] = 1; } } while (taken[nm]);
    taken[nm] = 1; return nm;
  }

  function makeSet(g, era, k, names) {
    const E = T.eras[era], id = g + '-' + ERA_KEY[era] + (k + 1), rnd = sub(id), L = LANG[g];
    const N = irange(rnd, E.size), nSec = era === 'modern' ? 0 : irange(rnd, E.secrets);
    const count = {}; let sum = 0;
    for (const r of RARS) { count[r] = Math.max(r === 'c' ? 0 : 1, Math.round(N * E.mix[r])); sum += count[r]; }
    count.c += N - sum;
    const run = range(rnd, E.run), runMult = Math.pow((E.run[0] + E.run[1]) / 2 / run, 0.4);
    const s = { id, game: g, era, idx: k, name: setName(rnd, L, names), symbol: [Math.floor(rnd() * 12), Math.floor(rnd() * 360)],
      size: N, secrets: 0, count, printRun: +run.toFixed(2), release: -1000, reprint: null, reveal: null, hype: 0, sm: 1, vs: null, walk: [1] };
    for (let d = 1; d <= 16; d++) s.walk.push(+(s.walk[d - 1] * (1 + E.walk * gauss(rnd))).toFixed(4));
    if (era === 'modern') { s.release = irange(rnd, E.release[k]); s.hype = +range(rnd, T.reprint.hype).toFixed(3); }
    if (T.sealedMarket[era]) s.sm = +range(rnd, T.sealedMarket[era]).toFixed(3);
    if (era === 'vintage') { s.vs = {}; for (const t of Object.keys(T.sealed)) s.vs[t] = +range(rnd, T.vintageSealed[t]).toFixed(2); }
    // Creatures for the slots, rarest first, so the famous ones take the holos and grails.
    const left = rosters[g].slice(), picked = [];
    for (const r of ['g', 'h', 'r', 'u', 'c']) for (let i = 0; i < count[r] + (r === 'g' ? nSec : 0); i++) {
      let tot = 0; for (const c of left) tot += 1 + c.fame * T.fame.pick[r];
      let x = rnd() * tot, j = 0; for (; j < left.length - 1; j++) { x -= 1 + left[j].fame * T.fame.pick[r]; if (x < 0) break; }
      picked.push({ cr: left.splice(j, 1)[0], r, secret: r === 'g' && i >= count.g });
    }
    const main = shuffle(rnd, picked.filter(p => !p.secret)), secs = picked.filter(p => p.secret), list = [];
    main.concat(secs).forEach((p, i) => {
      const c = { id: id + '-' + (i + 1), set: id, game: g, era, num: i + 1, name: p.cr.name, kind: p.cr.kind, rarity: p.r,
        secret: p.secret || undefined, demand: 'plain', base: 0, printings: ['std'], nums: undefined, fame: +p.cr.fame.toFixed(3), art: null };
      const D = T.demand; let dm = 1;
      if (p.secret || rnd() < (D.chase.p[p.r] || 0) * (1 + 2 * p.cr.fame)) { c.demand = 'chase'; dm = D.chase.m; }
      else if (rnd() < (D.staple.p[p.r] || 0)) { c.demand = 'staple'; dm = D.staple.m; }
      else if (rnd() < (D.bulk.p[p.r] || 0)) { c.demand = 'bulk'; dm = D.bulk.m; }
      c.base = Math.max(0.5, +(T.rarity.base[p.r] * (E.scale ? E.scale[p.r] : 1) * (p.secret ? 1.5 : 1) * E.value * runMult * Math.exp(T.rarity.sigma[p.r] * gauss(rnd)) * dm * (1 + T.fame.k * p.cr.fame)).toFixed(2));
      const band = { c: [0, 8], u: [8, 4], r: [12, 3], h: [15, 2], g: [17, 1] }[p.r];
      c.art = [band[0] + p.cr.i % band[1], (p.cr.i * 47 + k * 90 + RANK[p.r] * 13) % 360, Math.floor(rnd() * 100), Math.floor(rnd() * 100)];
      list.push(c);
    });
    // Printings: every card gets the era's tiers unless the template assigns a tier to a share (or a count) per rarity.
    const give = (pk, rule, pool) => {
      for (const r of RARS) {
        const f = rule[r]; if (!f) continue;
        const of = shuffle(rnd, pool.filter(c => c.rarity === r && !c.secret)), n = f >= 1 ? f : Math.max(1, Math.round(f * of.length));
        for (const c of of.slice(0, n)) c.printings.push(pk);
      }
    };
    for (const pk of E.printings) if (pk !== 'std') { if (E.assign[pk]) give(pk, E.assign[pk], list); else for (const c of list) if (!c.secret || era === 'vintage') c.printings.push(pk); }
    for (const pk of Object.keys(T.promos)) give(pk, T.promos[pk], list);
    let num = N + nSec;
    if (E.numbered) for (const pk of E.numbered) for (const c of list) if (c.printings.indexOf(pk) >= 0) { c.nums = c.nums || {}; c.nums[pk] = ++num; }
    s.secrets = num - N;
    const X = ix[id] = {};
    for (const c of list) { for (const pk of c.printings) { const key = (c.secret ? 's' : c.rarity) + ':' + pk; (X[key] = X[key] || []).push(c.id); } cards.push(c); byId[c.id] = c; }
    s.cards = list.map(c => c.id);
    sets.push(s); setById[id] = s;
  }

  // Modern reprint flags: per game, one set gets reprinted, one is officially never reprinted, the rest drift.
  // Reveal days are seeded; a set released mid-run reveals at least 2 days after it lands.
  for (const g of Object.keys(GAME_INFO)) {
    const rnd = sub(g + '/reprint'), C = T.reprint.count, last = T.reprint.lastDay, mod = sets.filter(s => s.game === g && s.era === 'modern');
    // only sets out by flagBy can be flagged, so the reveal has room to play out inside the run
    const mods = shuffle(rnd, mod.filter(s => s.release <= T.reprint.flagBy)).concat(mod.filter(s => s.release > T.reprint.flagBy));
    mods.forEach((s, i) => {
      s.reprint = i < C.yes ? 'yes' : i < C.yes + C.no ? 'no' : 'drift';
      if (s.reprint !== 'drift') s.reveal = clamp(Math.max(irange(rnd, T.reprint[s.reprint].reveal), s.release + 2), 1, last);
    });
  }
  // Vintage sealed that turns up during the run (auctions, estates, a dealer who visits once).
  const drops = [], dr = sub('drops'), VS = T.vintageSealed.drops, vint = sets.filter(s => s.era === 'vintage');
  for (let i = 0, n = irange(dr, VS.n); i < n; i++) drops.push({ day: irange(dr, VS.days), set: pickA(dr, vint).id, type: pickW(dr, VS.types)[0], from: pickA(dr, VS.from) });
  drops.sort((a, b) => a.day - b.day);

  // ---------- lookups ----------
  const card = id => byId[id] || null;
  const set = id => setById[id] || null;
  const released = (s, day) => day == null || s.release <= day;
  const isHit = (c, pk) => RANK[c.rarity] >= 3 || !!(P[pk] && P[pk].hit);
  function pmult(c, pk) { const d = P[pk || 'std']; if (!d) return 1; return Array.isArray(d.m) ? (RANK[c.rarity] <= 1 ? d.m[0] : d.m[1]) : d.m; }
  // grade: null = ungraded near-mint, a number = raw grade, { co, grade } = a slab. Vintage condition swings harder.
  function gmult(era, grade) {
    if (grade == null) return 1;
    const m = typeof grade === 'number' ? T.grade.raw[clamp(Math.round(grade), 0, 10)] : (T.grade[grade.co] || T.grade.raw)[clamp(Math.round(grade.grade), 0, 10)];
    return m > 1 ? 1 + (m - 1) * T.eras[era].gradeSlope : m;
  }
  const mkt = (market, game) => market == null ? 1 : typeof market === 'number' ? market : market.demand == null ? 1 : typeof market.demand === 'number' ? market.demand : (market.demand[game] || 1);
  // kind: 0 singles, 1 chase singles, 2 sealed
  function trend(s, day, kind) {
    day = day || 0; const E = T.eras[s.era];
    let m = Math.pow(1 + E.drift[kind], day) * s.walk[clamp(Math.floor(day), 0, s.walk.length - 1)];
    if (s.era !== 'modern') return m;
    m *= 1 + s.hype * (kind === 2 ? T.reprint.hypeSealed : 1) * Math.exp(-Math.max(0, day - s.release) / T.reprint.hypeDecay); // release hype is mostly in singles
    const Y = T.reprint.yes, No = T.reprint.no;
    if (s.reprint === 'yes') m *= day < s.reveal ? 1 + Y.pre[kind] * day : Y.drop[kind] * Math.pow(1 + Y.post[kind], day - s.reveal);
    else if (s.reprint === 'no') m *= Math.pow(1 + No.pre[kind], Math.min(day, s.reveal)) * Math.pow(1 + No.post[kind], Math.max(0, day - s.reveal));
    return m;
  }
  function price(id, pk, grade, day, market) {
    const c = card(id); if (!c) return 0;
    return c.base * pmult(c, pk) * gmult(c.era, grade) * trend(setById[c.set], day, c.demand === 'chase' || isHit(c, pk) ? 1 : 0) * mkt(market, c.game);
  }
  // o: { grade: { co, grade }, weight: 'heavy' | 'light' | 'mid' } (weight only counts where packs can be read by weight)
  function sealedPrice(setId, type, day, market, o) {
    const s = set(setId), d = T.sealed[type]; if (!s || !d) return 0;
    let v = s.era === 'vintage' ? T.sealed[T.vintageSealed.ref].msrp * s.vs[type] : d.msrp * s.sm;
    v *= trend(s, day, 2) * mkt(market, s.game);
    o = o || {};
    if (o.grade && T.sealedGrade[o.grade.co]) v *= T.sealedGrade[o.grade.co][clamp(Math.round(o.grade.grade), 0, 10)];
    if (o.weight && T.weight.spread[s.era] > 0.5 && T.weight.price[o.weight]) v *= T.weight.price[o.weight];
    return v;
  }
  // Distributor allocation: the share of an order you actually get. A never-reprint set dries up; a reprinted one floods.
  function allocation(setId, day) {
    const s = set(setId), A = T.reprint.alloc; if (!s || s.era !== 'modern' || !released(s, day)) return 0;
    const d = day - Math.max(0, s.release);
    if (s.reprint === 'no') return d < A.noFrom ? 1 : Math.max(A.noMin, 1 - A.noStep * (d - A.noFrom + 1));
    if (s.reprint === 'yes' && day >= s.reveal) return A.yesAfter;
    return 1;
  }

  // ---------- packs ----------
  // A pack's contents are fixed by its own seed when it's made, so it can be weighed (or searched) before it's opened.
  function makePack(setId, rng) {
    const s = set(setId), rnd = rngOf(rng), p = { set: setId, seed: Math.floor(rnd() * 4294967296) };
    if (s.era === 'vintage') p.run = pickW(rnd, T.eras.vintage.runs)[0];
    return p;
  }
  function pull(s, r, pk, rnd, run) {
    const X = ix[s.id], l = X[r + ':' + pk] || X[r + ':std'] || X[(r === 's' ? 'g' : r) + ':std'];
    const c = byId[l[Math.floor(rnd() * l.length)]];
    if (s.era === 'vintage' && pk === 'std') { pk = run || 'std'; if (c.printings.indexOf('err') >= 0 && rnd() < T.eras.vintage.errRate) pk = 'err'; }
    return { id: c.id, p: pk };
  }
  // openPack(setId, rng) or openPack(pack). A dead pack (searched or resealed) has had its hit swapped for a common.
  function openPack(x, rng) {
    const pk = typeof x === 'string' ? makePack(x, rng) : x, s = set(pk.set), rnd = rngOf(pk.seed), out = [];
    for (const slot of T.eras[s.era].pack) for (let i = 0; i < slot.n; i++) { const o = pickW(rnd, slot.t); out.push(pull(s, o[0], o[1], rnd, pk.run)); }
    if (pk.dead) out[out.length - 1] = pull(s, 'c', 'std', rnd, pk.run);
    return out;
  }
  // Heavy vs light: foil cards weigh more. Vintage packs give it away; modern packs are weight-balanced.
  function weigh(pk) {
    const W = T.weight, s = set(pk.set), rnd = rngOf(hash('w' + pk.seed + (pk.dead ? 'd' : '')));
    let foil = 0; for (const c of openPack(pk)) { const cc = byId[c.id]; if (W.foilRarity.indexOf(cc.rarity) >= 0 || (P[c.p] && (P[c.p].foil || P[c.p].hit))) foil++; }
    const g = W.base + W.spread[s.era] * foil * W.foil + W.noise * gauss(rnd), over = g - W.base;
    return { g: +g.toFixed(2), tier: over >= W.heavy ? 'heavy' : over <= W.light ? 'light' : 'mid' };
  }
  const packHit = cs => cs.some(c => isHit(byId[c.id], c.p));
  function promoPick(s, rnd, big) {
    const pool = s.cards.map(id => byId[id]).filter(c => c.printings.some(k => P[k].promo && !!P[k].big === !!big));
    if (!pool.length) return { id: s.cards[0], p: 'std' };
    const c = pickA(rnd, pool), ks = c.printings.filter(k => P[k].promo && !!P[k].big === !!big);
    return { id: c.id, p: pickA(rnd, ks) };
  }
  function openSealed(setId, type, rng) {
    const s = set(setId), d = T.sealed[type], rnd = rngOf(rng), out = { packs: [], promos: [], pin: !!d.pin };
    let run = null;
    for (let i = 0; i < d.packs; i++) { const p = makePack(setId, rnd); if (s.era === 'vintage') { run = run || p.run; p.run = run; } out.packs.push(p); } // one box, one print run
    for (let i = 0; i < (d.promo || 0); i++) out.promos.push(promoPick(s, rnd, false));
    for (let i = 0; i < (d.over || 0); i++) out.promos.push(promoPick(s, rnd, true));
    return out;
  }

  // ---------- incoming cards (sellers, binders, lots) ----------
  // o: { game, era, set, rarity, src: 'binder' | 'old' | 'dealer' | 'pack' | 'promo', day }
  function draw(rng, o) {
    o = o || {}; const rnd = rngOf(rng), I = T.incoming, src = o.src || 'binder';
    let pool = sets.filter(s => (!o.game || s.game === o.game) && (!o.set || s.id === o.set) && (!o.era || s.era === o.era) && released(s, o.day));
    if (!o.era && !o.set) {
      const w = I.era[src] || I.era.binder, eras = T.eraOrder.map((e, i) => [e, w[i]]).filter(e => e[1] > 0 && pool.some(s => s.era === e[0]));
      if (eras.length) { const e = pickW(rnd, eras)[0]; pool = pool.filter(s => s.era === e); }
    }
    if (!pool.length) return null;
    const s = pickA(rnd, pool), r = o.rarity || pickW(rnd, I.rarity)[0], X = ix[s.id];
    const l = r === 'g' && X['s:std'] && rnd() < I.secret ? X['s:std'] : X[r + ':std'] || X['c:std'];
    const c = byId[pickA(rnd, l)];
    let pk = 'std';
    if (s.era === 'vintage') { pk = pickW(rnd, I.runs[src] || I.runs.binder)[0]; if (c.printings.indexOf('err') >= 0 && rnd() < T.eras.vintage.errRate) pk = 'err'; }
    else for (const k of c.printings) { const b = P[k].promo ? (I.promoBoost[src] || 1) : 1; if (k !== 'std' && rnd() < (I.print[k] || 0) * b) { pk = k; break; } }
    if (src === 'promo') { const ks = c.printings.filter(k => P[k].promo); if (ks.length) pk = pickA(rnd, ks); }
    return { id: c.id, p: pk };
  }

  // ---------- buyers' wants ----------
  // f: { game, era, set, kind, demand, min, max, rarity, printing, hit, minValue, name, day, limit }
  function search(f) {
    f = f || {}; const out = [], lim = f.limit || Infinity;
    for (const c of cards) {
      const s = setById[c.set];
      if ((f.game && c.game !== f.game) || (f.era && c.era !== f.era) || (f.set && c.set !== f.set) || (f.kind && c.kind !== f.kind) || (f.demand && c.demand !== f.demand)) continue;
      if ((f.min && RANK[c.rarity] < RANK[f.min]) || (f.max && RANK[c.rarity] > RANK[f.max]) || (f.rarity && c.rarity !== f.rarity)) continue;
      if ((f.printing && c.printings.indexOf(f.printing) < 0) || (f.hit && !c.printings.some(k => isHit(c, k))) || (f.minValue && c.base < f.minValue)) continue;
      if ((f.name && c.name.toLowerCase().indexOf(f.name.toLowerCase()) < 0) || !released(s, f.day)) continue;
      out.push(c); if (out.length >= lim) break;
    }
    return out;
  }

  // ---------- bulk and repacks ----------
  const isBulk = (id, pk) => { const c = card(id); return !!c && RANK[c.rarity] <= 1 && (pk || 'std') === 'std' && price(id, 'std') < T.bulk.under; };
  // plan: { packs, perPack (bulk cards per pack), hits: [₵ value of each hit], floor (₵ guaranteed per pack) }. Plain JSON.
  function repack(plan) {
    const p = Object.assign({ perPack: 10, hits: [], floor: 0 }, plan), B = T.bulk.each;
    const hitSum = p.hits.reduce((a, b) => a + b, 0), ev = (hitSum + p.packs * (p.floor + p.perPack * B)) / p.packs;
    return Object.assign(p, { left: p.left != null ? p.left : p.packs, hitsLeft: p.hitsLeft || p.hits.slice().sort((a, b) => b - a),
      ev: +ev.toFixed(2), oneIn: p.hits.length ? +(p.packs / p.hits.length).toFixed(2) : Infinity, fair: +(ev * T.repack.premium).toFixed(2), loose: p.packs * p.perPack * B });
  }
  // How shoppers read your sign ({ oneIn, hitMin }): honest and decent draws people in; stingy or short-of-the-sign is a scam.
  function repackJudge(plan, sign) {
    const p = repack(plan), Rp = T.repack, minHit = p.hits.length ? Math.min.apply(null, p.hits) : 0;
    const honest = p.hits.length > 0 && p.oneIn <= sign.oneIn * Rp.slack && minHit >= sign.hitMin;
    const stingy = p.floor < Rp.minFloor;
    return { honest, stingy, ev: p.ev, fair: p.fair, verdict: !honest ? 'scam' : stingy ? 'fair' : 'draw' };
  }
  // Open one repack from the plan (no replacement: the hits are really in there). Mutates plan.left / plan.hitsLeft.
  function repackOpen(plan, rng) {
    const rnd = rngOf(rng); if (!plan.left) return null;
    const hit = plan.hitsLeft.length && rnd() < plan.hitsLeft.length / plan.left ? plan.hitsLeft.splice(Math.floor(rnd() * plan.hitsLeft.length), 1)[0] : 0;
    plan.left--; return { hit, floor: plan.floor, bulk: plan.perPack };
  }

  const games = {};
  for (const g of Object.keys(GAME_INFO)) {
    games[g] = Object.assign({ frames: {} }, GAME_INFO[g], { sets: sets.filter(s => s.game === g).map(s => s.id), roster: rosters[g].length });
    for (const e of T.eraOrder) games[g].frames[e] = T.eras[e].frame;
  }
  const eras = {}; for (const e of T.eraOrder) { const E = T.eras[e]; eras[e] = { name: E.name, yearsAgo: E.yearsAgo, printings: E.printings, frame: E.frame }; }

  return { seed, version: T.version, fit: T.fit, games, eras, sets, cards, drops, rerolls, printings: P, sealed: T.sealed,
    card, set, price, sealedPrice, trend, allocation, released: day => sets.filter(s => released(s, day)),
    makePack, openPack, openSealed, weigh, packHit, isHit, draw, search, isBulk, repack, repackJudge, repackOpen,
    printingMult: pmult, gradeMult: gmult };
}

function defaultTemplate() {
  if (root && root.CG_TEMPLATE) return root.CG_TEMPLATE;
  if (typeof require === 'function') { try { return require('../data/template-stats.json'); } catch (e) { return null; } }
  return null;
}

const CG = { build, hash, near, RANK, LANG };
if (typeof module !== 'undefined' && module.exports) module.exports = CG; else root.CG = CG;
})(this);
