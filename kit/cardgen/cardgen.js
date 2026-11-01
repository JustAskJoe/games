// CardGen · a seeded collectible-card universe generator for any studio game with cards.
// Pure and browser-safe: no DOM, no node-only APIs. A plain <script> sets the global CardGen; in node it's a CommonJS module.
// Everything game-specific lives in a profile (JSON): factions and their name banks, eras and the variant tiers
// each adds, the rarity ladder, set sizes, printings, sealed products, the economy curve and the hobby statistics.
//   const P = CardGen.load(profile, stats)   // merges + validates; throws with readable errors (or use CardGen.validate)
//   const U = CardGen.build(seed, P)         // the universe: U.card, U.set, U.openPack, U.price, U.sealedPrice, U.search ...
// Fill-in guide: kit/cardgen/PROFILE.md. Usage: kit/cardgen/README.md.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';
const SCHEMA = 1;

// ---------- seeded RNG (state is plain JSON { _s }, so a game can pass its own state object) ----------
function R(S) { S._s = (S._s + 0x6D2B79F5) >>> 0; let t = S._s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85EBCA6B); h ^= h >>> 13; return h >>> 0; }
// rng can be a function, a state object like a game's G (uses and advances G._s) or a number (a fresh stream from that seed).
const rngOf = r => typeof r === 'function' ? r : r && typeof r._s === 'number' ? () => R(r) : (S => () => R(S))({ _s: r >>> 0 });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const range = (rnd, a) => a[0] + rnd() * (a[1] - a[0]);
const irange = (rnd, a) => a[0] + Math.floor(rnd() * (a[1] - a[0] + 1));
const pickA = (rnd, a) => a[Math.floor(rnd() * a.length)];
const gauss = rnd => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
function pickW(rnd, t) { let s = 0; for (const e of t) s += e[e.length - 1]; let x = rnd() * s; for (const e of t) { x -= e[e.length - 1]; if (x < 0) return e; } return t[t.length - 1]; }
function shuffle(rnd, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
// Deep merge: stats (numbers) layered over the profile (structure). Arrays replace.
function merge(a, b) { if (!isObj(a) || !isObj(b)) return b === undefined ? a : b; const o = Object.assign({}, a); for (const k of Object.keys(b)) o[k] = merge(a[k], b[k]); return o; }

// ---------- names ----------
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function word(rnd, L, n) { let w = ''; for (let i = 0; i < n; i++) w += (i && rnd() < (L.tick || 0) ? '\'' : '') + pickA(rnd, L.syl); return cap(w); }
// Pattern tokens: {w2} {w3} {w23} = a made-up word of 2, 3 or 2-3 syllables; {kind} {adj} {title} {setNoun} = picks from the bank.
function fill(rnd, L, pat, kind) {
  return pat.replace(/\{(\w+)\}/g, (m, t) => t === 'w2' ? word(rnd, L, 2) : t === 'w3' ? word(rnd, L, 3) : t === 'w23' ? word(rnd, L, 2 + (rnd() < 0.4 ? 1 : 0))
    : t === 'kind' ? kind : L[t] && L[t].length ? pickA(rnd, L[t]) : m);
}
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
// A private list of real card names (never committed), bucketed by length so the check stays cheap.
function makeBlock(list) {
  if (!list || !list.length) return null;
  const by = {}; for (const n of list) { const s = norm(n); if (s) (by[s.length] = by[s.length] || []).push(s); }
  return name => { const s = norm(name); for (let l = s.length - 2; l <= s.length + 2; l++) for (const b of by[l] || []) if (near(s, b, 2)) return true; return false; };
}

// ---------- schema check ----------
// Returns a list of readable problems ("eras.mid.pack[3].t[2]: printing 'stars' isn't in eras.mid.printings (std, rev)").
function validate(P) {
  const e = [], say = (p, m) => e.push(p + ': ' + m), num = x => typeof x === 'number' && isFinite(x);
  const rng2 = (p, a, int) => { if (!Array.isArray(a) || a.length !== 2 || !num(a[0]) || !num(a[1]) || a[0] > a[1] || (int && (a[0] % 1 || a[1] % 1))) say(p, 'needs [low, high]' + (int ? ' whole numbers' : '') + ', low ≤ high'); };
  if (!isObj(P)) return ['profile: not a JSON object'];
  if (P.schema !== SCHEMA) say('schema', 'must be ' + SCHEMA + ' (got ' + JSON.stringify(P.schema) + ')');
  if (!P.id || typeof P.id !== 'string') say('id', 'needs a short id string, like "my-game"');
  const rars = Array.isArray(P.rarities) ? P.rarities.map(r => r && r.k) : [];
  if (!rars.length) say('rarities', 'needs a list like [{ "k": "c", "n": "Common" }, ...], lowest first');
  if (new Set(rars).size !== rars.length || rars.some(k => !k || k === 's')) say('rarities', 'keys must be unique, non-empty, and not "s" (reserved for secrets)');
  const isR = r => rars.indexOf(r) >= 0, lr = rars.join(', ');
  for (const k of ['hitRarity', 'secretRarity']) if (P[k] != null && !isR(P[k])) say(k, '"' + P[k] + '" isn\'t a rarity (' + lr + ')');
  if (!num(P.lowRarities) || P.lowRarities < 0 || P.lowRarities > rars.length) say('lowRarities', 'how many of the lowest rarities count as "low" (0-' + rars.length + ')');
  if (!isObj(P.games) || !Object.keys(P.games).length) say('games', 'needs at least one game or faction');
  else for (const g of Object.keys(P.games)) {
    const G = P.games[g], L = G && G.lang;
    if (!G || !G.name) say('games.' + g + '.name', 'missing');
    if (!L) { say('games.' + g + '.lang', 'missing (name banks)'); continue; }
    for (const k of ['syl', 'kinds', 'adj']) if (!Array.isArray(L[k]) || !L[k].length) say('games.' + g + '.lang.' + k, 'needs a non-empty list of strings');
    if (!Array.isArray(L.setNoun) || !L.setNoun.length) say('games.' + g + '.lang.setNoun', 'needs a non-empty list (words for set names)');
  }
  const N = P.names || {};
  if (!num(N.roster) || N.roster < 10) say('names.roster', 'how many creatures/characters each game has, at least 10');
  for (const k of ['patterns', 'setPatterns']) if (!Array.isArray(N[k]) || !N[k].length || N[k].some(x => !Array.isArray(x) || !num(x[0]) || typeof x[1] !== 'string')) say('names.' + k, 'needs a list of [weight, "pattern"], like [3, "{adj} {kind}"]');
  const PR = P.printings || {};
  if (!PR.std) say('printings.std', 'every profile needs a "std" (standard) printing');
  for (const k of Object.keys(PR)) { const d = PR[k]; if (!d || !d.n) say('printings.' + k + '.n', 'needs a display name'); if (!(num(d && d.m) || (Array.isArray(d && d.m) && d.m.length === 2 && d.m.every(num)))) say('printings.' + k + '.m', 'needs a value multiplier (a number, or [low-rarity, high-rarity])'); }
  const isP = k => !!PR[k];
  const B = (P.rarity || {}).base || {}, SG = (P.rarity || {}).sigma || {};
  for (const r of rars) { if (!num(B[r]) || B[r] <= 0) say('rarity.base.' + r, 'needs a positive base value'); if (!num(SG[r]) || SG[r] < 0) say('rarity.sigma.' + r, 'needs a price spread (0 = every card the same)'); }
  const order = P.eraOrder || [];
  if (!Array.isArray(order) || !order.length) say('eraOrder', 'needs a list of era ids, oldest first');
  for (const id of order) {
    const E = (P.eras || {})[id], p = 'eras.' + id; if (!E) { say(p, 'listed in eraOrder but not defined'); continue; }
    if (!E.code || typeof E.code !== 'string') say(p + '.code', 'needs a short code for set ids (like "v")');
    if (!num(E.sets) || E.sets < 1 || E.sets % 1) say(p + '.sets', 'how many sets per game, a whole number ≥ 1');
    rng2(p + '.size', E.size, true); if (E.secrets) rng2(p + '.secrets', E.secrets, true);
    if (E.secrets && !P.secretRarity) say(p + '.secrets', 'secrets need a top-level "secretRarity"');
    let sum = 0; for (const r of Object.keys(E.mix || {})) { if (!isR(r)) say(p + '.mix.' + r, 'isn\'t a rarity (' + lr + ')'); sum += E.mix[r]; }
    if (Math.abs(sum - 1) > 0.02) say(p + '.mix', 'rarity shares should add up to 1 (they add up to ' + sum.toFixed(2) + ')');
    const ep = E.printings || [];
    if (ep[0] !== 'std') say(p + '.printings', 'must start with "std"');
    for (const k of ep) if (!isP(k)) say(p + '.printings', '"' + k + '" isn\'t defined in printings');
    for (const k of Object.keys(E.assign || {})) { if (ep.indexOf(k) < 0) say(p + '.assign.' + k, 'isn\'t one of this era\'s printings'); for (const r of Object.keys(E.assign[k])) if (!isR(r)) say(p + '.assign.' + k + '.' + r, 'isn\'t a rarity'); }
    for (const k of E.numbered || []) if (ep.indexOf(k) < 0) say(p + '.numbered', '"' + k + '" isn\'t one of this era\'s printings');
    if (!Array.isArray(E.pack) || !E.pack.length) say(p + '.pack', 'needs pack slots: [{ "n": 3, "t": [["c", "std", 1]] }, ...]');
    else E.pack.forEach((sl, i) => {
      if (!num(sl.n) || sl.n < 1) say(p + '.pack[' + i + '].n', 'cards in this slot, ≥ 1');
      if (!Array.isArray(sl.t) || !sl.t.length) { say(p + '.pack[' + i + '].t', 'needs outcomes [rarity, printing, weight]'); return; }
      sl.t.forEach((o, j) => {
        const q = p + '.pack[' + i + '].t[' + j + ']';
        if (!Array.isArray(o) || o.length !== 3 || !num(o[2]) || o[2] <= 0) { say(q, 'needs [rarity, printing, weight > 0]'); return; }
        if (o[0] === 's' ? !E.secrets : !isR(o[0])) say(q, o[0] === 's' ? '"s" (a secret) but this era has no secrets' : 'rarity "' + o[0] + '" isn\'t in rarities (' + lr + ')');
        if (ep.indexOf(o[1]) < 0) say(q, 'printing "' + o[1] + '" isn\'t in ' + p + '.printings (' + ep.join(', ') + ')');
      });
    });
    if (E.runs) for (const r of E.runs) if (!isP(r[0])) say(p + '.runs', 'print run "' + r[0] + '" isn\'t a printing');
    if (E.errPrinting && ep.indexOf(E.errPrinting) < 0) say(p + '.errPrinting', 'isn\'t one of this era\'s printings');
    if (E.live) { if (!Array.isArray(E.release) || E.release.length !== E.sets) say(p + '.release', 'a live era needs one [first day, last day] release window per set (' + E.sets + ')'); else E.release.forEach((w, i) => rng2(p + '.release[' + i + ']', w, true)); }
    if (!num(E.value)) say(p + '.value', 'needs a value multiplier for the era (1 = the base)');
    if (!Array.isArray(E.drift) || E.drift.length !== 3) say(p + '.drift', 'needs daily drift [singles, chase singles, sealed]');
  }
  for (const k of Object.keys(P.eras || {})) if (order.indexOf(k) < 0) say('eras.' + k, 'defined but not in eraOrder');
  for (const k of Object.keys(P.promos || {})) { if (!isP(k)) say('promos.' + k, 'isn\'t defined in printings'); for (const r of Object.keys(P.promos[k])) if (!isR(r)) say('promos.' + k + '.' + r, 'isn\'t a rarity'); }
  const S = P.sealed || {};
  if (!Object.keys(S).length) say('sealed', 'needs at least one product, like "pack"');
  for (const t of Object.keys(S)) { const d = S[t]; if (!num(d.packs) || d.packs < 1) say('sealed.' + t + '.packs', 'packs inside, ≥ 1'); if (!num(d.msrp) || d.msrp <= 0) say('sealed.' + t + '.msrp', 'needs a shelf price'); if (d.shape && (!Array.isArray(d.shape) || d.shape.length !== 2)) say('sealed.' + t + '.shape', 'needs [width, height]'); }
  for (const era of Object.keys(P.sealedMarket || {})) { if (order.indexOf(era) < 0) say('sealedMarket.' + era, 'isn\'t an era'); else rng2('sealedMarket.' + era, P.sealedMarket[era]); }
  for (const era of Object.keys(P.sealedRef || {})) { const s = P.sealedRef[era]; if (order.indexOf(era) < 0) say('sealedRef.' + era, 'isn\'t an era'); if (!S[s.ref]) say('sealedRef.' + era + '.ref', 'isn\'t a sealed product'); for (const t of Object.keys(s.types || {})) { if (!S[t]) say('sealedRef.' + era + '.types.' + t, 'isn\'t a sealed product'); rng2('sealedRef.' + era + '.types.' + t, s.types[t]); } }
  if (P.drops) { if (order.indexOf(P.drops.era) < 0) say('drops.era', 'isn\'t an era'); rng2('drops.n', P.drops.n, true); rng2('drops.days', P.drops.days, true); for (const t of P.drops.types || []) if (!S[t[0]]) say('drops.types', '"' + t[0] + '" isn\'t a sealed product'); }
  const live = order.filter(id => P.eras && P.eras[id] && P.eras[id].live);
  if (P.reprint && live.length) { const c = P.reprint.count || {}; for (const id of live) if ((c.yes || 0) + (c.no || 0) > P.eras[id].sets) say('reprint.count', 'more yes + no flags than ' + id + ' has sets'); }
  const I = P.incoming || {};
  for (const src of Object.keys(I.era || {})) if (!Array.isArray(I.era[src]) || I.era[src].length !== order.length) say('incoming.era.' + src, 'needs one weight per era (' + order.join(', ') + ')');
  if (I.rarity) for (const r of I.rarity) if (!isR(r[0])) say('incoming.rarity', '"' + r[0] + '" isn\'t a rarity');
  if (!P.fame || !isObj(P.fame.pick)) say('fame', 'needs { pow, k, pick: { rarity: weight } }');
  return e;
}
function load(profile, stats) {
  const P = stats ? merge(profile, stats) : profile, errs = validate(P);
  if (errs.length) { const err = new Error('CardGen profile "' + (P && P.id) + '" has ' + errs.length + ' problem' + (errs.length > 1 ? 's' : '') + ':\n  ' + errs.join('\n  ')); err.problems = errs; throw err; }
  return P;
}

// ---------- build ----------
function build(seed, P, opts) {
  if (!P || P.schema !== SCHEMA) P = load(P);
  opts = opts || {};
  seed = seed >>> 0;
  const RARS = P.rarities.map(r => r.k), RANK = {}; RARS.forEach((r, i) => RANK[r] = i);
  const LOW = P.lowRarities, HIT = P.hitRarity != null ? RANK[P.hitRarity] : RARS.length - 1, SEC = P.secretRarity, gameIds = Object.keys(P.games);
  const blocked = makeBlock(opts.blocklist);
  const sub = key => rngOf({ _s: hash(seed + '/' + key) });
  const PR = P.printings, cards = [], sets = [], byId = {}, setById = {}, ix = {}, rosters = {}, Rp = P.reprint || {};
  const day0 = (P.run && P.run.lastDay) || 10;
  let rerolls = 0;
  const sealedTypes = Object.keys(P.sealed);

  for (const g of gameIds) {
    // The roster: every creature this game has ever printed. Famous ones show up in more sets, at higher rarity.
    const L = P.games[g].lang, rnd = sub(g + '/roster'), used = {}, roster = [], n = P.names.roster, heroes = P.names.heroes || 0;
    for (let i = 0; i < n; i++) {
      const kind = pickA(rnd, L.kinds), hero = i < heroes && P.names.hero && L.title;
      let name, tries = 0;
      do {
        name = fill(rnd, L, pickW(rnd, hero && rnd() < 0.7 ? P.names.hero : P.names.patterns)[1], kind);
        if (++tries > 40) name = word(rnd, L, 3 + Math.floor(tries / 60)) + ' ' + kind;
        if (blocked && !used[name] && blocked(name)) { rerolls++; used[name] = 'x'; }
      } while (used[name]);
      used[name] = 1; roster.push({ i, name, kind, fame: Math.pow(1 - i / n, P.fame.pow) });
    }
    rosters[g] = roster;
    const setNames = {};
    for (const era of P.eraOrder) for (let k = 0; k < P.eras[era].sets; k++) makeSet(g, era, k, setNames);
  }

  function setName(rnd, L, taken) {
    let nm, tries = 0;
    do { nm = fill(rnd, L, pickW(rnd, P.names.setPatterns)[1], ''); if (++tries > 40) nm = word(rnd, L, 3) + ' ' + pickA(rnd, L.setNoun); if (!taken[nm] && blocked && blocked(nm)) { rerolls++; taken[nm] = 1; } } while (taken[nm]);
    taken[nm] = 1; return nm;
  }

  function makeSet(g, era, k, names) {
    const E = P.eras[era], id = g + '-' + E.code + (k + 1), rnd = sub(id), L = P.games[g].lang;
    const N = irange(rnd, E.size), nSec = E.secrets ? irange(rnd, E.secrets) : 0;
    const count = {}; let sum = 0;
    RARS.forEach((r, i) => { count[r] = Math.max(i === 0 || !E.mix[r] ? 0 : 1, Math.round(N * (E.mix[r] || 0))); sum += count[r]; });
    count[RARS[0]] += N - sum;
    const run = E.run ? range(rnd, E.run) : 1, runMult = E.run ? Math.pow((E.run[0] + E.run[1]) / 2 / run, 0.4) : 1;
    const s = { id, game: g, era, idx: k, name: setName(rnd, L, names), symbol: [Math.floor(rnd() * 12), Math.floor(rnd() * 360)],
      size: N, secrets: 0, count, printRun: +run.toFixed(2), release: -1000, reprint: null, reveal: null, hype: 0, sm: 1, vs: null, walk: [1] };
    for (let d = 1; d <= 16; d++) s.walk.push(+(s.walk[d - 1] * (1 + (E.walk || 0) * gauss(rnd))).toFixed(4));
    if (E.live) { s.release = irange(rnd, E.release[k]); if (Rp.hype) s.hype = +range(rnd, Rp.hype).toFixed(3); }
    if (P.sealedMarket && P.sealedMarket[era]) s.sm = +range(rnd, P.sealedMarket[era]).toFixed(3);
    const ref = P.sealedRef && P.sealedRef[era];
    if (ref) { s.vs = {}; for (const t of Object.keys(ref.types)) s.vs[t] = +range(rnd, ref.types[t]).toFixed(2); }
    // Characters for the slots, rarest first, so the famous ones take the top rarities.
    const left = rosters[g].slice(), picked = [], pick = P.fame.pick;
    for (const r of RARS.slice().reverse()) for (let i = 0; i < count[r] + (r === SEC ? nSec : 0); i++) {
      if (!left.length) break;
      let tot = 0; for (const c of left) tot += 1 + c.fame * (pick[r] || 0);
      let x = rnd() * tot, j = 0; for (; j < left.length - 1; j++) { x -= 1 + left[j].fame * (pick[r] || 0); if (x < 0) break; }
      picked.push({ cr: left.splice(j, 1)[0], r, secret: r === SEC && i >= count[r] });
    }
    const main = shuffle(rnd, picked.filter(p => !p.secret)), secs = picked.filter(p => p.secret), list = [], D = P.demand || {}, bands = P.art && P.art.bands;
    main.concat(secs).forEach((p, i) => {
      const c = { id: id + '-' + (i + 1), set: id, game: g, era, num: i + 1, name: p.cr.name, kind: p.cr.kind, rarity: p.r,
        secret: p.secret || undefined, demand: 'plain', base: 0, printings: ['std'], nums: undefined, fame: +p.cr.fame.toFixed(3), art: null };
      let dm = 1;
      if (D.chase && (p.secret || rnd() < (D.chase.p[p.r] || 0) * (1 + 2 * p.cr.fame))) { c.demand = 'chase'; dm = D.chase.m; }
      else if (D.staple && rnd() < (D.staple.p[p.r] || 0)) { c.demand = 'staple'; dm = D.staple.m; }
      else if (D.bulk && rnd() < (D.bulk.p[p.r] || 0)) { c.demand = 'bulk'; dm = D.bulk.m; }
      c.base = Math.max(P.rarity.min || 0.5, +(P.rarity.base[p.r] * (E.scale && E.scale[p.r] != null ? E.scale[p.r] : 1) * (p.secret ? (P.rarity.secretMult || 1.5) : 1) * E.value * runMult * Math.exp(P.rarity.sigma[p.r] * gauss(rnd)) * dm * (1 + (P.fame.k || 0) * p.cr.fame)).toFixed(2));
      const band = bands && bands[p.r] || [0, 1];
      c.art = [band[0] + p.cr.i % band[1], (p.cr.i * 47 + k * 90 + RANK[p.r] * 13) % 360, Math.floor(rnd() * 100), Math.floor(rnd() * 100)];
      list.push(c);
    });
    // Printings: every card gets the era's tiers unless the profile assigns a tier to a share (or a count) per rarity.
    const give = (pk, rule) => {
      for (const r of RARS) {
        const f = rule[r]; if (!f) continue;
        const of = shuffle(rnd, list.filter(c => c.rarity === r && !c.secret)), n = f >= 1 ? f : Math.max(1, Math.round(f * of.length));
        for (const c of of.slice(0, n)) c.printings.push(pk);
      }
    };
    const assign = E.assign || {};
    for (const pk of E.printings) if (pk !== 'std') { if (assign[pk]) give(pk, assign[pk]); else for (const c of list) if (!c.secret || E.secretsGetAll) c.printings.push(pk); }
    for (const pk of Object.keys(P.promos || {})) give(pk, P.promos[pk]);
    let num = N + nSec;
    if (E.numbered) for (const pk of E.numbered) for (const c of list) if (c.printings.indexOf(pk) >= 0) { c.nums = c.nums || {}; c.nums[pk] = ++num; }
    s.secrets = num - N;
    const X = ix[id] = {};
    for (const c of list) { for (const pk of c.printings) { const key = (c.secret ? 's' : c.rarity) + ':' + pk; (X[key] = X[key] || []).push(c.id); } cards.push(c); byId[c.id] = c; }
    s.cards = list.map(c => c.id);
    sets.push(s); setById[id] = s;
  }

  // Reprint flags for live eras: per game, `count.yes` sets get reprinted, `count.no` are officially never reprinted, the
  // rest drift. Sets out at the start are `flagWeight.start` times likelier to be flagged than mid-run releases, so the
  // "spot it early and hold" play usually exists but a fresh release is never known-safe. Reveals come ≥ 2 days after release.
  if (P.reprint) for (const g of gameIds) for (const era of P.eraOrder.filter(e => P.eras[e].live)) {
    const rnd = sub(g + '/' + era + '/reprint'), C = Rp.count || {}, W = Rp.flagWeight || {}, last = Rp.lastDay || day0;
    const pool = sets.filter(s => s.game === g && s.era === era).map(s => [s, s.release <= 0 ? (W.start || 1) : (W.release || 1)]), order = [];
    while (pool.length) { const e = pickW(rnd, pool); order.push(e[0]); pool.splice(pool.indexOf(e), 1); }
    order.forEach((s, i) => {
      s.reprint = i < (C.yes || 0) ? 'yes' : i < (C.yes || 0) + (C.no || 0) ? 'no' : 'drift';
      if (s.reprint !== 'drift') s.reveal = clamp(Math.max(irange(rnd, Rp[s.reprint].reveal), s.release + 2), 1, last);
    });
  }
  // Old sealed product that turns up during a run (auctions, estates, a dealer who visits once).
  const drops = [];
  if (P.drops) {
    const dr = sub('drops'), VS = P.drops, pool = sets.filter(s => s.era === VS.era);
    for (let i = 0, n = irange(dr, VS.n); i < n && pool.length; i++) drops.push({ day: irange(dr, VS.days), set: pickA(dr, pool).id, type: pickW(dr, VS.types)[0], from: pickA(dr, VS.from || ['dealer']) });
    drops.sort((a, b) => a.day - b.day);
  }

  // ---------- lookups ----------
  const card = id => byId[id] || null;
  const set = id => setById[id] || null;
  const released = (s, day) => day == null || s.release <= day;
  const isHit = (c, pk) => RANK[c.rarity] >= HIT || !!(PR[pk] && PR[pk].hit);
  function pmult(c, pk) { const d = PR[pk || 'std']; if (!d) return 1; return Array.isArray(d.m) ? (RANK[c.rarity] < LOW ? d.m[0] : d.m[1]) : d.m; }
  // grade: null = ungraded near-mint, a number = raw grade, { co, grade } = a slab from grader `co`. Older eras can swing harder.
  function gmult(era, grade) {
    const Gr = P.grade; if (grade == null || !Gr) return 1;
    const curve = typeof grade === 'number' ? Gr.raw : (Gr[grade.co] || Gr.raw), v = typeof grade === 'number' ? grade : grade.grade;
    const m = curve[clamp(Math.round(v), 0, curve.length - 1)], slope = P.eras[era].gradeSlope || 1;
    return m > 1 ? 1 + (m - 1) * slope : m;
  }
  const mkt = (market, game) => market == null ? 1 : typeof market === 'number' ? market : market.demand == null ? 1 : typeof market.demand === 'number' ? market.demand : (market.demand[game] || 1);
  // kind: 0 singles, 1 chase singles, 2 sealed
  function trend(s, day, kind) {
    day = day || 0; const E = P.eras[s.era];
    let m = Math.pow(1 + E.drift[kind], day) * s.walk[clamp(Math.floor(day), 0, s.walk.length - 1)];
    if (!E.live) return m;
    m *= 1 + s.hype * (kind === 2 ? (Rp.hypeSealed != null ? Rp.hypeSealed : 1) : 1) * Math.exp(-Math.max(0, day - s.release) / (Rp.hypeDecay || 2.5)); // release hype is mostly in singles
    const Y = Rp.yes, No = Rp.no;
    if (s.reprint === 'yes') m *= day < s.reveal ? 1 + Y.pre[kind] * day : Y.drop[kind] * Math.pow(1 + Y.post[kind], day - s.reveal);
    else if (s.reprint === 'no') m *= Math.pow(1 + No.pre[kind], Math.min(day, s.reveal)) * Math.pow(1 + No.post[kind], Math.max(0, day - s.reveal)) * (day >= s.reveal && No.jump ? No.jump[kind] : 1); // the announcement spikes it
    return Math.max(0.05, m); // a long run of linear pre-reveal drift must never push a price below zero
  }
  function price(id, pk, grade, day, market) {
    const c = card(id); if (!c) return 0;
    return c.base * pmult(c, pk) * gmult(c.era, grade) * trend(setById[c.set], day, c.demand === 'chase' || isHit(c, pk) ? 1 : 0) * mkt(market, c.game);
  }
  // o: { grade: { co, grade }, weight: 'heavy' | 'light' | 'mid' } (weight only counts in eras where packs can be read by weight)
  function sealedPrice(setId, type, day, market, o) {
    const s = set(setId), d = P.sealed[type]; if (!s || !d) return 0;
    const ref = P.sealedRef && P.sealedRef[s.era];
    let v = ref && s.vs[type] != null ? P.sealed[ref.ref].msrp * s.vs[type] : d.msrp * s.sm;
    v *= trend(s, day, 2) * mkt(market, s.game);
    o = o || {};
    if (o.grade && P.sealedGrade && P.sealedGrade[o.grade.co]) { const c = P.sealedGrade[o.grade.co]; v *= c[clamp(Math.round(o.grade.grade), 0, c.length - 1)]; }
    const W = P.weight; if (o.weight && W && W.spread[s.era] > 0.5 && W.price[o.weight]) v *= W.price[o.weight];
    return v;
  }
  // Distributor allocation: the share of an order you actually get. A never-reprint set dries up; a reprinted one floods.
  function allocation(setId, day) {
    const s = set(setId), A = Rp.alloc || {}; if (!s || !P.eras[s.era].live || !released(s, day)) return 0;
    const d = day - Math.max(0, s.release);
    if (s.reprint === 'no') return d < (A.noFrom || 1) ? 1 : Math.max(A.noMin || 0.2, 1 - (A.noStep || 0.15) * (d - (A.noFrom || 1) + 1));
    if (s.reprint === 'yes' && day >= s.reveal) return A.yesAfter || 1.5;
    return 1;
  }

  // ---------- packs ----------
  // A pack's contents are fixed by its own seed when it's made, so it can be weighed (or searched) before it's opened.
  function makePack(setId, rng) {
    const s = set(setId), rnd = rngOf(rng), p = { set: setId, seed: Math.floor(rnd() * 4294967296) }, E = P.eras[s.era];
    if (E.runs) p.run = pickW(rnd, E.runs)[0];
    return p;
  }
  function pull(s, r, pk, rnd, run) {
    const X = ix[s.id], E = P.eras[s.era], l = X[r + ':' + pk] || X[r + ':std'] || X[(r === 's' ? SEC : r) + ':std'] || X[RARS[0] + ':std'] || Object.values(X)[0];
    const c = byId[l[Math.floor(rnd() * l.length)]];
    if (E.runs && pk === 'std') pk = run || 'std';
    if (E.errPrinting && (pk === 'std' || E.runs) && c.printings.indexOf(E.errPrinting) >= 0 && rnd() < (E.errRate || 0)) pk = E.errPrinting;
    return { id: c.id, p: pk };
  }
  // openPack(setId, rng) or openPack(pack). A dead pack (searched or resealed) has had its last slot swapped for a common.
  function openPack(x, rng) {
    const pk = typeof x === 'string' ? makePack(x, rng) : x, s = set(pk.set), rnd = rngOf(pk.seed), out = [];
    for (const slot of P.eras[s.era].pack) for (let i = 0; i < slot.n; i++) { const o = pickW(rnd, slot.t); out.push(pull(s, o[0], o[1], rnd, pk.run)); }
    if (pk.dead) out[out.length - 1] = pull(s, RARS[0], 'std', rnd, pk.run);
    return out;
  }
  // Heavy vs light: foil cards weigh more. Eras with weight spread give it away; weight-balanced eras don't.
  function weigh(pk) {
    const W = P.weight, s = set(pk.set); if (!W) return { g: null, tier: 'mid' };
    const rnd = rngOf(hash('w' + pk.seed + (pk.dead ? 'd' : '')));
    let foil = 0; for (const c of openPack(pk)) { const cc = byId[c.id]; if ((W.foilRarity || []).indexOf(cc.rarity) >= 0 || (PR[c.p] && (PR[c.p].foil || PR[c.p].hit))) foil++; }
    const g = W.base + (W.spread[s.era] || 0) * foil * W.foil + W.noise * gauss(rnd), over = g - W.base;
    return { g: +g.toFixed(2), tier: over >= W.heavy ? 'heavy' : over <= W.light ? 'light' : 'mid' };
  }
  const packHit = cs => cs.some(c => isHit(byId[c.id], c.p));
  function promoPick(s, rnd, big) {
    const ok = k => PR[k].promo && !!PR[k].big === !!big, pool = s.cards.map(id => byId[id]).filter(c => c.printings.some(ok));
    if (!pool.length) return { id: s.cards[s.cards.length - 1], p: 'std' };
    const c = pickA(rnd, pool); return { id: c.id, p: pickA(rnd, c.printings.filter(ok)) };
  }
  function openSealed(setId, type, rng) {
    const s = set(setId), d = P.sealed[type], rnd = rngOf(rng), out = { packs: [], promos: [], pin: !!d.pin }, E = P.eras[s.era];
    let run = null;
    for (let i = 0; i < d.packs; i++) { const p = makePack(setId, rnd); if (E.runs) { run = run || p.run; p.run = run; } out.packs.push(p); } // one box, one print run
    for (let i = 0; i < (d.promo || 0); i++) out.promos.push(promoPick(s, rnd, false));
    for (let i = 0; i < (d.over || 0); i++) out.promos.push(promoPick(s, rnd, true));
    return out;
  }

  // ---------- incoming cards (sellers, binders, lots, rewards) ----------
  // o: { game, era, set, rarity, src (a key of incoming.era / incoming.runs, default 'binder'), day }
  function draw(rng, o) {
    o = o || {}; const rnd = rngOf(rng), I = P.incoming || {}, src = o.src || 'binder';
    let pool = sets.filter(s => (!o.game || s.game === o.game) && (!o.set || s.id === o.set) && (!o.era || s.era === o.era) && released(s, o.day));
    if (!o.era && !o.set && I.era) {
      const w = I.era[src] || I.era.binder || P.eraOrder.map(() => 1), eras = P.eraOrder.map((e, i) => [e, w[i]]).filter(e => e[1] > 0 && pool.some(s => s.era === e[0]));
      if (eras.length) { const e = pickW(rnd, eras)[0]; pool = pool.filter(s => s.era === e); }
    }
    if (!pool.length) return null;
    const s = pickA(rnd, pool), E = P.eras[s.era], X = ix[s.id];
    const r = o.rarity || (I.rarity ? pickW(rnd, I.rarity)[0] : pickW(rnd, RARS.map(k => [k, E.mix[k] || 0]))[0]);
    const l = r === SEC && X['s:std'] && rnd() < (I.secret || 0) ? X['s:std'] : X[r + ':std'] || X[RARS[0] + ':std'];
    const c = byId[pickA(rnd, l)];
    let pk = 'std';
    if (E.runs) { const runs = I.runs && (I.runs[src] || I.runs.binder) || E.runs; pk = pickW(rnd, runs)[0]; if (E.errPrinting && c.printings.indexOf(E.errPrinting) >= 0 && rnd() < (E.errRate || 0)) pk = E.errPrinting; }
    else for (const k of c.printings) { const b = PR[k].promo ? ((I.promoBoost || {})[src] || 1) : 1; if (k !== 'std' && rnd() < ((I.print || {})[k] || 0) * b) { pk = k; break; } }
    if (src === 'promo') { const ks = c.printings.filter(k => PR[k].promo); if (ks.length) pk = pickA(rnd, ks); }
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
  const BK = P.bulk || { each: 1, under: 0 }, RK = P.repack || { premium: 1, minFloor: 0, slack: 1 };
  const isBulk = (id, pk) => { const c = card(id); return !!c && RANK[c.rarity] < LOW && (pk || 'std') === 'std' && price(id, 'std') < BK.under; };
  // plan: { packs, perPack (bulk cards per pack), hits: [value of each hit], floor (value guaranteed per pack) }. Plain JSON.
  function repack(plan) {
    const p = Object.assign({ perPack: 10, hits: [], floor: 0 }, plan), B = BK.each;
    const hitSum = p.hits.reduce((a, b) => a + b, 0), ev = (hitSum + p.packs * (p.floor + p.perPack * B)) / p.packs;
    return Object.assign(p, { left: p.left != null ? p.left : p.packs, hitsLeft: p.hitsLeft || p.hits.slice().sort((a, b) => b - a),
      ev: +ev.toFixed(2), oneIn: p.hits.length ? +(p.packs / p.hits.length).toFixed(2) : Infinity, fair: +(ev * RK.premium).toFixed(2), loose: p.packs * p.perPack * B });
  }
  // How shoppers read a posted sign ({ oneIn, hitMin }): honest and decent draws people in; short of the sign is a scam.
  function repackJudge(plan, sign) {
    const p = repack(plan), minHit = p.hits.length ? Math.min.apply(null, p.hits) : 0;
    const honest = p.hits.length > 0 && p.oneIn <= sign.oneIn * RK.slack && minHit >= sign.hitMin, stingy = p.floor < RK.minFloor;
    return { honest, stingy, ev: p.ev, fair: p.fair, verdict: !honest ? 'scam' : stingy ? 'fair' : 'draw' };
  }
  // Open one repack from the plan (no replacement: the hits are really in there). Mutates plan.left / plan.hitsLeft.
  function repackOpen(plan, rng) {
    const rnd = rngOf(rng); if (!plan.left) return null;
    const hit = plan.hitsLeft.length && rnd() < plan.hitsLeft.length / plan.left ? plan.hitsLeft.splice(Math.floor(rnd() * plan.hitsLeft.length), 1)[0] : 0;
    plan.left--; return { hit, floor: plan.floor, bulk: plan.perPack };
  }

  const games = {};
  for (const g of gameIds) {
    const G = Object.assign({}, P.games[g]); delete G.lang;
    games[g] = Object.assign(G, { frames: {}, sets: sets.filter(s => s.game === g).map(s => s.id), roster: rosters[g].length });
    for (const e of P.eraOrder) games[g].frames[e] = P.eras[e].frame || null;
  }
  const eras = {}; for (const e of P.eraOrder) { const E = P.eras[e]; eras[e] = { name: E.name || e, code: E.code, yearsAgo: E.yearsAgo, printings: E.printings, frame: E.frame || null, live: !!E.live }; }
  // Plain data for saving or downloading (the functions rebuild from seed + profile).
  const data = () => ({ schema: SCHEMA, profile: P.id, seed, games, eras, rarities: P.rarities, printings: PR, sealed: P.sealed, sets, cards, drops });

  return { schema: SCHEMA, profile: P.id, seed, version: P.version, fit: P.fit, games, eras, sets, cards, drops, rerolls, printings: PR, sealed: P.sealed, sealedTypes,
    rarities: RARS, rank: RANK, currency: P.currency || null,
    card, set, price, sealedPrice, trend, allocation, released: day => sets.filter(s => released(s, day)),
    makePack, openPack, openSealed, weigh, packHit, isHit, draw, search, isBulk, repack, repackJudge, repackOpen,
    printingMult: pmult, gradeMult: gmult, data };
}

const CardGen = { SCHEMA, build, load, validate, merge, hash, near, rngOf };
if (typeof module !== 'undefined' && module.exports) module.exports = CardGen; else root.CardGen = CardGen;
})(this);
