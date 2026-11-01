// Intergalactic Card Trader · v1 engine. Pure: seeded RNG, no DOM, runs in node (sim.js) and the browser.
// Every player action goes through act(G, intent). The UI and the bots only read G and call act.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';

// ---------- seeded RNG ----------
function rng(seed) {
  let a = seed >>> 0;
  return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const R = (G) => G._r();
const pick = (G, arr) => arr[Math.floor(R(G) * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const gauss = (G) => (R(G) + R(G) + R(G) - 1.5) * 1.15; // cheap bell curve, sd ~1

// ---------- the world ----------
const SPECIES = {
  mollu: { name: 'Mollu', game: 'shell', patience: 12, conc: 0.22, insultAt: 0.62, insultCost: 3, flaw: 0.10, roundBonus: 0.15 },
  zekk:  { name: 'Zekk',  game: 'hive',  patience: 7, conc: 0.50, insultAt: 0.50, insultCost: 2, flaw: 0.05, roundBonus: 0 },
  puffi: { name: 'Puffi', game: 'star',  patience: 9, conc: 0.33, insultAt: 0.58, insultCost: 2, flaw: 0.25, roundBonus: 0 },
};
const GAMES = {
  shell: { name: 'Shellstorm', species: 'mollu', script: 'spiral', blurb: 'tide spirits and reef beasts on pearl stock',
    cards: ['Driftling', 'Kelp Sprite', 'Tidepool Imp', 'Coral Pup', 'Foam Wisp', 'Shell Hermit', 'Brine Newt', 'Pebble Crab',
            'Reef Warden', 'Lantern Eel', 'Pearl Diver', 'Current Ray',
            'Maelstrom Tortoise', 'Undertow Siren', 'Moonsurge Whale',
            'Abyssal Nautilus', 'Tidecaller Queen', 'The First Pearl'] },
  hive: { name: 'Hive Gambit', species: 'zekk', script: 'dots', blurb: 'mech-insects and hive tactics in honeycomb frames',
    cards: ['Drone Unit', 'Pollen Scout', 'Gear Mite', 'Wax Builder', 'Buzz Bot', 'Antenna Tech', 'Larva Cache', 'Swarm Token',
            'Stinger Mk II', 'Honey Engineer', 'Mantis Lancer', 'Comb Fortress',
            'Royal Jelly Reactor', 'Hornet Vanguard', 'Locust Overlord',
            'Golden Hive Mind', 'Chrome Monarch', 'Prime Queen Zero'] },
  star: { name: 'Starweave', species: 'puffi', script: 'waves', blurb: 'constellation creatures on nebula backs',
    cards: ['Comet Kit', 'Star Puff', 'Dust Mote', 'Orbit Owl', 'Glimmer Fox', 'Nova Pup', 'Moonbeam Toad', 'Halo Seed',
            'Constellation Stag', 'Aurora Koi', 'Pulsar Bat', 'Nebula Nymph',
            'Eclipse Lion', 'Galaxy Whale', 'Supernova Phoenix',
            'Celestial Weaver', 'Twin Star Dragons', 'The Origin Thread'] },
};
const RARITY_BY_INDEX = i => i < 8 ? 'c' : i < 12 ? 'u' : i < 15 ? 'r' : i < 17 ? 'h' : 'g';
const RARITY_NAME = { c: 'Common', u: 'Uncommon', r: 'Rare', h: 'Holo', g: 'Grail' };
const RANK = { c: 0, u: 1, r: 2, h: 3, g: 4 };
const BASE = { c: 2, u: 6, r: 20, h: 60, g: 260 };
const RAW = g => g >= 10 ? 1.6 : g >= 9 ? 1.3 : g >= 8 ? 1.0 : g >= 7 ? 0.8 : g >= 6 ? 0.6 : g >= 5 ? 0.45 : 0.3;
const GRADERS = {
  quik: { name: 'QuikSlab', fee: 6, days: 1, mult: g => g >= 10 ? 2.4 : g >= 9 ? 1.6 : g >= 8 ? 1.05 : g >= 7 ? 0.8 : RAW(g) },
  halo: { name: 'Halo Bureau', fee: 15, days: 2, mult: g => g >= 10 ? 3.2 : g >= 9 ? 2.0 : g >= 8 ? 1.2 : g >= 7 ? 0.85 : RAW(g) },
};
const BOX = { packs: 6, cost: 120 };
const PACK_RETAIL = 28;
const TRANSLATE_FEE = 5;
const FLUENT_AT = 3;

// Named regulars. askMul/floorMul shape them as sellers (vs what they believe it's worth); ceilMul as buyers.
const PEOPLE = {
  pearla: { name: 'Pearla', species: 'mollu', askMul: 0.9, floorMul: 0.45, ceilMul: 1.05, line: 'a grandma clearing out her late husband\'s binder' },
  tumbo:  { name: 'Tumbo',  species: 'mollu', askMul: 1.3, floorMul: 0.8, ceilMul: 1.15, line: 'a teen who is bad at hiding excitement' },
  sheelo: { name: 'Sheelo', species: 'mollu', askMul: 1.25, floorMul: 0.82, ceilMul: 0.95, line: 'a dealer who can\'t read other species\' scripts' },
  klik:   { name: 'Klik',   species: 'zekk',  askMul: 1.3, floorMul: 0.8, ceilMul: 0.88, line: 'a flipper who buys under market and sells over' },
  vrrz:   { name: 'Vrrz',   species: 'zekk',  askMul: 1.2, floorMul: 0.8, ceilMul: 1.1, line: 'buys booster packs by the armful' },
  zazza:  { name: 'Zazza',  species: 'zekk',  askMul: 1.15, floorMul: 0.6, ceilMul: 0.9, line: 'trench coat, too-good binder' },
  mimbo:  { name: 'Mimbo',  species: 'puffi', askMul: 1.2, floorMul: 0.75, ceilMul: 1.1, line: 'only wants mint cards and cries at good centering' },
  floss:  { name: 'Floss',  species: 'puffi', askMul: 1.2, floorMul: 0.8, ceilMul: 1.1, line: 'a streamer who loves a pack rip' },
  nubb:   { name: 'Nubb',   species: 'puffi', askMul: 1.0, floorMul: 0.6, ceilMul: 1.0, line: 'a kid with a shoebox' },
};

// Three scripted days. Who comes is fixed so every run teaches the same lessons; what they bring is rolled.
const DAYS = [
  { name: 'Reef Run', ships: ['mollu', 'puffi'], demand: { shell: 1.0, hive: 0.9, star: 1.2 }, rent: 40,
    dj: 'Mollu pearl-haulers and a Puffi cloud-liner on the lanes this morning. Starweave is warm, Hive Gambit is sleepy.',
    visitors: [
      { who: 'pearla', role: 'sell', n: 2, games: ['shell'], q: 7.6, gem: 'h', read: true },
      { who: 'tumbo',  role: 'buy',  wants: { game: 'shell', min: 'u' } },
      { who: 'nubb',   role: 'bulk', n: 6, games: ['star', 'shell'] },
      { who: 'klik',   role: 'sell', n: 2, games: ['hive'], q: 7.2, gem: 'h', fakes: 1 },
      { who: 'mimbo',  role: 'buy',  wants: { game: 'star', min: 'c', cond: 8 } },
      { who: 'sheelo', role: 'lot',  n: 9, games: ['star', 'hive', 'shell'], q: 6.4, gem: 'g', gemGame: 'star', fakes: 1 },
      { who: 'floss',  role: 'sealed', n: 2 },
    ] },
  { name: 'Hive Swarm', ships: ['zekk'], demand: { shell: 0.9, hive: 1.5, star: 1.0 }, rent: 60, cardNight: true,
    dj: 'A whole Zekk swarm-fleet is docking! Hive Gambit is HOT today. Card Night after close, bring your packs.',
    visitors: [
      { who: 'vrrz',   role: 'sealed', n: 4 },
      { who: 'klik',   role: 'buy',  wants: { game: 'hive', min: 'r' } },
      { who: 'zazza',  role: 'lot',  n: 9, games: ['hive', 'hive', 'shell'], q: 6.8, gem: 'g', gemGame: 'hive', fakes: 2 },
      { who: 'pearla', role: 'sell', n: 3, games: ['shell', 'star'], q: 6.8, gem: 'r' },
      { who: 'tumbo',  role: 'buy',  wants: { game: 'shell', min: 'r' } },
      { who: 'klik',   role: 'flip', wants: { min: 'u' } },
      { who: 'floss',  role: 'sealed', n: 2 },
      { who: 'mimbo',  role: 'buy',  wants: { game: 'star', min: 'u', cond: 8 } },
    ] },
  { name: 'Star Drift', ships: ['puffi', 'mollu'], demand: { shell: 1.1, hive: 1.0, star: 1.4 }, rent: 90,
    dj: 'The Puffi festival ship is in! Starweave everywhere. Grade Day after close: every slab comes home tonight.',
    visitors: [
      { who: 'mimbo',  role: 'buy',  wants: { game: 'star', min: 'r', cond: 9 } },
      { who: 'floss',  role: 'sealed', n: 3 },
      { who: 'nubb',   role: 'bulk', n: 6, games: ['hive', 'star'] },
      { who: 'sheelo', role: 'lot',  n: 9, games: ['shell', 'star', 'hive'], q: 6.6, gem: 'h', fakes: 1 },
      { who: 'tumbo',  role: 'buy',  wants: { game: 'shell', min: 'u' } },
      { who: 'zazza',  role: 'sell', n: 2, games: ['star'], q: 7.4, gem: 'h', fakes: 1 },
      { who: 'vrrz',   role: 'sealed', n: 3 },
      { who: 'mimbo',  role: 'flip', wants: { game: 'star', min: 'u' } },
    ] },
];

// ---------- cards ----------
const tid = (game, i) => game + '-' + i;
function tmpl(t) { const [game, i] = t.split('-'); const idx = +i; return { game, idx, name: GAMES[game].cards[idx], rarity: RARITY_BY_INDEX(idx) }; }
function trueGrade(c) { const lo = Math.min(c.cen, c.edg, c.sur), avg = (c.cen + c.edg + c.sur) / 3; return clamp(Math.round(lo * 0.35 + avg * 0.65), 1, 10); }
function centerRatio(c) { const off = (10 - c.cen) * 2.6; return [Math.round(50 + off), Math.round(50 - off)]; } // e.g. 60/40

function rollIdx(G, rarity) { const pool = { c: [0, 8], u: [8, 12], r: [12, 15], h: [15, 17], g: [17, 18] }[rarity]; return pool[0] + Math.floor(R(G) * (pool[1] - pool[0])); }
function rollRarity(G, rareSlot) {
  const x = R(G);
  if (rareSlot) return x < 0.02 ? 'g' : x < 0.17 ? 'h' : 'r';
  return x < 0.62 ? 'c' : x < 0.88 ? 'u' : x < 0.97 ? 'r' : 'h';
}
function makeCard(G, game, rarity, q, opts) {
  opts = opts || {};
  const at = () => clamp(Math.round(q + gauss(G) * (opts.fresh ? 1.0 : 1.5)), 1, 10);
  const c = { uid: 'c' + (++G._uid), t: tid(game, rollIdx(G, rarity)), cen: at(), edg: at(), sur: at(), fake: null, graded: null,
    know: { loupe: false, uv: false, read: !!opts.read }, cost: 0, flawUsed: false };
  if (opts.fake) { c.fake = R(G) < 0.5 ? 'uv' : 'stock'; }
  if (opts.mint) { c.cen = Math.max(c.cen, 9); c.edg = Math.max(c.edg, 9); c.sur = Math.max(c.sur, 9); }
  return c;
}

// ---------- value ----------
function demandOf(G, game) { return (G.demand[game] || 1) + (G.dayIdx === 2 ? (G.hype[game] || 0) : 0); }
function hot(G, c) { return G.hotList.indexOf(c.t) >= 0 ? 1.5 : 1; }
// What the card is really worth to a buyer today (they can see the real condition).
function trueValue(G, c, demand) {
  if (c.fake) return 0;
  const tm = tmpl(c.t), d = demand == null ? demandOf(G, tm.game) : demand;
  const m = c.graded ? GRADERS[c.graded.co].mult(c.graded.grade) : RAW(trueGrade(c));
  return BASE[tm.rarity] * m * d * (demand == null ? hot(G, c) : 1);
}
const readable = (G, c) => c.know.read || (G.fluency[tmpl(c.t).game] >= FLUENT_AT);
// The player's best guess from what they've learned. Bots use only this.
function estimate(G, c) {
  if (c.know.uv && c.fake) return { value: 0, grade: null, rarity: tmpl(c.t).rarity, fake: true };
  const tm = tmpl(c.t), rar = readable(G, c) ? tm.rarity : null;
  const grade = c.graded ? c.graded.grade : c.know.loupe ? trueGrade(c) : null;
  const m = c.graded ? GRADERS[c.graded.co].mult(c.graded.grade) : RAW(grade == null ? 7 : grade);
  const v = BASE[rar || 'u'] * m * demandOf(G, tm.game) * hot(G, c);
  return { value: v, grade, rarity: rar, fake: c.know.uv ? false : null };
}
// What a seller believes their card is worth (home rate). They can't read other species' scripts.
function sellerBelief(G, person, c) {
  const tm = tmpl(c.t), own = SPECIES[PEOPLE[person].species].game === tm.game || person === 'sheelo' && tm.game === 'shell';
  const rar = own ? tm.rarity : (RANK[tm.rarity] >= 2 ? 'u' : tm.rarity); // misreads rares and up as "some uncommon"
  return BASE[rar] * RAW(trueGrade(c));
}

// ---------- state ----------
function newGame(seed) {
  const G = { seed: seed >>> 0, _uid: 0, phase: 'title', dayIdx: -1, cash: 200, tab: 0, rep: 50,
    stock: [], packs: { shell: 2, hive: 2, star: 2 }, bulk: 12, fluency: { shell: 0, hive: 0, star: 0 },
    grading: [], demand: {}, hotList: [], hype: { shell: 0, hive: 0, star: 0 },
    visitIdx: -1, visit: null, ledger: [], days: [], say: null, events: [], complaints: [],
    stats: { bestFlip: null, bestGrade: null, fakesCaught: 0, fakesSold: 0, deals: 0, walkouts: 0, cracked: 0 },
    startValue: 0, log: [] };
  G._r = rng(seed || 1);
  // starting case: a few singles you already know
  for (const [g, r] of [['shell', 'u'], ['shell', 'c'], ['hive', 'u'], ['star', 'r'], ['star', 'c'], ['hive', 'c']]) {
    const c = makeCard(G, g, r, 7.2, { read: true }); c.know.loupe = true; c.know.uv = true; c.cost = Math.round(trueValue(G, c, 1)); G.stock.push(c);
  }
  G.demand = { shell: 1, hive: 1, star: 1 };
  G.startValue = Math.round(shopValue(G));
  return G;
}
function shopValue(G) {
  let v = G.cash - G.tab + G.bulk * 1;
  for (const c of G.stock) v += trueValue(G, c, 1);
  for (const g in G.packs) v += G.packs[g] * PACK_RETAIL;
  for (const p of G.grading) { const c = p.card; v += trueValue(G, c, 1); }
  return v;
}
function money(G, amt, kind, label) { G.cash += amt; G.ledger.push({ day: G.dayIdx, kind, amt: Math.round(amt), label }); }
function say(G, who, text) { G.say = { who, text }; G.log.push({ day: G.dayIdx, who, text }); }
function event(G, e) { G.events.push(e); }
const findStock = (G, uid) => G.stock.find(c => c.uid === uid);
const visitCard = (G, uid) => G.visit && (G.visit.cards || []).find(c => c.uid === uid);

// ---------- days ----------
function startDay(G) {
  G.dayIdx++; const D = DAYS[G.dayIdx];
  G.demand = Object.assign({}, D.demand);
  if (G.dayIdx === 2) for (const g in G.hype) if (G.hype[g]) G.demand[g] = +(G.demand[g] + G.hype[g]).toFixed(2);
  // hot list: two rares-or-better from the hottest game and one other
  const games = Object.keys(G.demand).sort((a, b) => G.demand[b] - G.demand[a]);
  G.hotList = [tid(games[0], 12 + Math.floor(R(G) * 5)), tid(games[1], 12 + Math.floor(R(G) * 3))];
  G.visitIdx = -1; G.visit = null; G.phase = 'morning'; G.events = [];
  // grades due this morning come home
  resolveGrades(G, false);
  // complaints from fakes sold yesterday
  for (const k of G.complaints) { money(G, -k.price, 'refund', 'Refund: ' + k.who + ' found a fake'); G.rep = clamp(G.rep - 8, 0, 100); event(G, { t: 'complaint', who: k.who, price: k.price }); }
  G.complaints = [];
  say(G, 'vee', D.dj);
}
function resolveGrades(G, all) {
  const keep = [];
  for (const p of G.grading) {
    if (!all && p.due > G.dayIdx) { keep.push(p); continue; }
    const c = p.card;
    if (c.fake) { c.know.uv = true; G.stats.fakesCaught++; event(G, { t: 'grade', uid: c.uid, co: p.co, fake: true }); G.stock.push(c); continue; }
    let g = trueGrade(c);
    if (p.co === 'quik') { const x = p.roll; g = clamp(g + (x < 0.25 ? -1 : x > 0.75 ? 1 : 0), 1, 10); }
    c.graded = { co: p.co, grade: g }; c.know.loupe = true; c.know.uv = true; c.know.read = true;
    if (!G.stats.bestGrade || g > G.stats.bestGrade.grade || (g === G.stats.bestGrade.grade && p.co === 'halo')) G.stats.bestGrade = { grade: g, co: p.co, t: c.t };
    event(G, { t: 'grade', uid: c.uid, co: p.co, grade: g });
    G.stock.push(c);
  }
  G.grading = keep;
}

// ---------- customers ----------
function spawnVisit(G, spec) {
  const P = PEOPLE[spec.who], S = SPECIES[P.species];
  const v = { who: spec.who, species: P.species, role: spec.role, wants: spec.wants || null, patience: S.patience + (spec.role === 'lot' ? 6 : 0),
    maxPatience: 0, cards: [], ask: 0, floor: 0, bid: 0, ceil: 0, showing: null, rounds: 0, done: false, packs: 0, result: null };
  if (spec.role === 'sell' || spec.role === 'lot' || spec.role === 'bulk') {
    const gem = spec.gem ? Math.floor(R(G) * spec.n) : -1, fakeAt = [];
    for (let k = 0; k < (spec.fakes || 0); k++) fakeAt.push((gem + 1 + k * 3) % spec.n);
    for (let i = 0; i < spec.n; i++) {
      const isGem = i === gem, g = isGem && spec.gemGame ? spec.gemGame : pick(G, spec.games);
      const rar = isGem ? spec.gem : spec.role === 'bulk' ? (R(G) < 0.2 ? 'u' : 'c') : rollRarity(G, false);
      const isFake = fakeAt.indexOf(i) >= 0;
      const c = makeCard(G, g, isFake ? (R(G) < 0.5 ? 'h' : 'r') : rar, spec.q || 6.5, { fake: isFake, read: !!spec.read, mint: isGem && spec.role === 'sell' && G.dayIdx === 0 });
      v.cards.push(c);
    }
    let belief = 0; for (const c of v.cards) belief += sellerBelief(G, spec.who, c);
    if (spec.role === 'bulk') belief = Math.max(4, belief * 0.6);
    v.ask = Math.max(3, Math.round(belief * P.askMul)); v.floor = Math.max(2, Math.round(belief * P.floorMul));
    if (v.floor >= v.ask) v.floor = v.ask - 1;
  } else if (spec.role === 'sealed') {
    v.packs = spec.n;
  }
  v.maxPatience = v.patience;
  return v;
}
function matches(G, wants, c) {
  if (!wants) return true;
  const tm = tmpl(c.t);
  if (wants.game && tm.game !== wants.game) return false;
  if (wants.min && RANK[tm.rarity] < RANK[wants.min]) return false;
  if (wants.cond) { const g = c.graded ? c.graded.grade : trueGrade(c); if (g < wants.cond) return false; }
  return true;
}
// Buyer's real valuation of a card (or a pack bundle). Puffi pay up for near-mint; flippers want margin.
function buyerValue(G, v, c) {
  const P = PEOPLE[v.who];
  let bv = trueValue(G, c);
  if (v.species === 'puffi' && (c.graded ? c.graded.grade : trueGrade(c)) >= 9) bv *= 1.4;
  if (v.role === 'flip') bv *= 0.85;
  return bv * P.ceilMul * (1 + (G.rep - 50) / 500);
}

function startHaggleBuyer(G, v, bv) { v.ceil = Math.max(1, Math.round(bv)); v.bid = Math.max(1, Math.round(bv * 0.62)); }

const LINES = {
  mollu: { hello: ['Oh, hello dear. Take your time, I certainly do.', 'Good tide to you! I brought something.'],
    counter: ['Mmm. How about {p}?', 'I could slide to {p}, slowly.'], insult: ['Oh my. That\'s rather low, dear.', 'My shell is shrinking at that number.'],
    round: ['Ooh, a nice round number. I do like those.'], deal: ['Lovely doing business.', 'You have a kind eye.'], walk: ['I think I\'ll keep them a while longer.'],
    flaw: ['Oh! I hadn\'t seen that. Fine, fine.'], buyHello: ['I\'m looking for {w}.'] },
  zekk: { hello: ['Yo yo yo, fast deal, fast deal!', 'Four hands, zero time. Let\'s go.'],
    counter: ['Split it: {p}.', '{p}. Final-ish. Go!'], insult: ['HA. No. Insulting.', 'Bzzt. Try again, rookie.'],
    round: [], deal: ['DONE. Pleasure.', 'Bzz! Deal!'], walk: ['Too slow! I\'m out.'],
    flaw: ['Pfft. Scratches add character. Small cut.'], buyHello: ['Got {w}? Quick quick.'] },
  puffi: { hello: ['H-hi! I love your shop!', 'Hello! *floats nervously*'],
    counter: ['Um... {p}?', 'Would {p} be okay?'], insult: ['*sniff* That hurts my fluff.', 'Oh... no...'],
    round: [], deal: ['Yay! Thank you!', '*happy spin*'], walk: ['I... I have to go. Sorry!'],
    flaw: ['Oh no, a flaw?! You\'re right, it\'s not perfect...'], buyHello: ['Do you have {w}? It has to be pretty!'] },
};
function line(G, v, key, p) { const L = LINES[v.species][key]; if (!L || !L.length) return null; return pick(G, L).replace('{p}', p != null ? p + '₵' : '').replace('{w}', wantsText(v.wants)); }
function wantsText(w) {
  if (!w) return 'anything good';
  const r = w.min ? (w.min === 'c' ? 'any' : RARITY_NAME[w.min].toLowerCase() + ' or better') : 'anything';
  return (w.game ? r + ' ' + GAMES[w.game].name : r + ' card') + (w.cond ? ' in grade ' + w.cond + '+ shape' : '');
}

function endVisit(G, result) {
  const v = G.visit; v.done = true; v.result = result;
  if (result === 'walk') { G.stats.walkouts++; G.rep = clamp(G.rep - (v.insulted ? 3 : 1), 0, 100); }
  G.phase = 'shop'; G.visit = null; G.lastVisit = v;
}
function costPatience(G, n) {
  const v = G.visit; v.patience -= n;
  if (v.patience <= 0) { say(G, v.who, line(G, v, 'walk')); endVisit(G, 'walk'); return false; }
  return true;
}

// ---------- act: the only way state changes ----------
function act(G, it) {
  const v = G.visit;
  switch (it.t) {
    case 'start': if (G.phase !== 'title') return err('not now'); startDay(G); return ok();
    case 'open': if (G.phase !== 'morning') return err('not now'); G.phase = 'shop'; say(G, 'vee', 'Doors open! First customer\'s at the counter.'); return ok();
    case 'next': {
      if (G.phase !== 'shop') return err('finish this customer first');
      const D = DAYS[G.dayIdx];
      if (G.visitIdx + 1 >= D.visitors.length) { closeShop(G); return ok(); }
      G.visitIdx++; G.visit = spawnVisit(G, D.visitors[G.visitIdx]); G.phase = 'visit';
      const nv = G.visit;
      if (nv.role === 'bulk') { // Nubb digs the bin first
        const n = Math.min(G.bulk, 8); if (n) { G.bulk -= n; money(G, n, 'bulk', PEOPLE[nv.who].name + ' dug ' + n + ' from the bulk bin'); }
        say(G, nv.who, (n ? 'I dug ' + n + ' cards outta your bin! ' : '') + 'Wanna buy my whole shoebox? ' + nv.ask + '₵!');
      } else if (nv.role === 'sell' || nv.role === 'lot') say(G, nv.who, line(G, nv, 'hello') + ' ' + (nv.role === 'lot' ? 'The whole binder page' : nv.cards.length > 1 ? 'These ' + nv.cards.length : 'This one') + ' for ' + nv.ask + '₵.');
      else if (nv.role === 'sealed') say(G, nv.who, 'Any sealed packs? I want ' + nv.packs + '!');
      else say(G, nv.who, line(G, nv, 'buyHello'));
      return ok();
    }
    case 'inspect': {
      if (G.phase !== 'visit' && G.phase !== 'shop' && G.phase !== 'close' && G.phase !== 'cardnight') return err('not now');
      const c = visitCard(G, it.uid) || findStock(G, it.uid); if (!c) return err('no card');
      const atCounter = G.phase === 'visit' && v && v.cards.indexOf(c) >= 0;
      if (it.tool === 'translate') {
        if (readable(G, c)) return err('already readable');
        if (G.cash < TRANSLATE_FEE) return err('not enough cash');
        money(G, -TRANSLATE_FEE, 'fee', 'Translator'); c.know.read = true; return ok();
      }
      const key = { loupe: 'loupe', uv: 'uv', read: 'read' }[it.tool]; if (!key) return err('bad tool');
      if (key === 'read' && readable(G, c)) return err('already readable');
      if (c.know[key]) return ok();
      c.know[key] = true;
      if (key === 'read') { const g = tmpl(c.t).game; G.fluency[g]++; if (G.fluency[g] === FLUENT_AT) event(G, { t: 'fluent', game: g }); }
      if (key === 'uv' && c.fake) { G.stats.fakesCaught++; event(G, { t: 'fakeFound', uid: c.uid }); }
      if (atCounter) costPatience(G, 1);
      return ok();
    }
    case 'flaw': {
      if (G.phase !== 'visit' || !v || !(v.role === 'sell' || v.role === 'lot' || v.role === 'bulk')) return err('not now');
      const c = visitCard(G, it.uid); if (!c || !c.know.loupe || c.flawUsed) return err('no flaw to point at');
      if (Math.min(c.cen, c.edg, c.sur) > 6 && !(c.know.uv && c.fake)) return err('it looks clean');
      c.flawUsed = true;
      const cut = c.fake && c.know.uv ? 0.35 : SPECIES[v.species].flaw;
      v.ask = Math.max(1, Math.round(v.ask * (1 - cut))); v.floor = Math.max(1, Math.round(v.floor * (1 - cut))); if (v.floor >= v.ask) v.floor = Math.max(1, v.ask - 1);
      say(G, v.who, (c.fake && c.know.uv ? 'Wh-what? That one\'s... not mine! ' : line(G, v, 'flaw')) + ' ' + v.ask + '₵.');
      return ok();
    }
    case 'show': {
      if (G.phase !== 'visit' || !v || !(v.role === 'buy' || v.role === 'flip')) return err('not now');
      const c = findStock(G, it.uid); if (!c) return err('no card');
      if (!matches(G, v.wants, c)) { say(G, v.who, 'Hmm, that\'s not what I\'m after.'); costPatience(G, 1); return ok(); }
      v.showing = c.uid; startHaggleBuyer(G, v, buyerValue(G, v, c)); v.rounds = 0;
      say(G, v.who, 'Ooh. I\'d pay ' + v.bid + '₵ for that.');
      return ok();
    }
    case 'showPacks': {
      if (G.phase !== 'visit' || !v || v.role !== 'sealed') return err('not now');
      const have = G.packs.shell + G.packs.hive + G.packs.star; if (!have) return err('no packs');
      v.packs = Math.min(v.packs, have);
      const per = PACK_RETAIL * (1 + (G.rep - 50) / 500) * (v.who === 'vrrz' ? 1.05 : 1);
      startHaggleBuyer(G, v, per * v.packs * PEOPLE[v.who].ceilMul); v.showing = 'packs';
      say(G, v.who, v.packs + ' packs? I\'ll give ' + v.bid + '₵ for the lot.');
      return ok();
    }
    case 'offer': return offer(G, Math.round(it.price));
    case 'accept': {
      if (G.phase !== 'visit' || !v) return err('not now');
      if (v.role === 'buy' || v.role === 'flip' || v.role === 'sealed') { if (!v.showing) return err('show something first'); return dealSell(G, v.bid); }
      return dealBuy(G, v.ask);
    }
    case 'pass': {
      if (G.phase !== 'visit' || !v) return err('not now');
      say(G, v.who, v.role === 'buy' || v.role === 'flip' || v.role === 'sealed' ? 'Oh well, next time!' : 'Your loss!');
      endVisit(G, 'pass'); return ok();
    }
    case 'crack': {
      if (G.phase !== 'shop' && G.phase !== 'cardnight') return err('only between customers');
      if (!G.packs[it.game]) return err('no packs of that game');
      G.packs[it.game]--; G.stats.cracked++;
      const pulled = crackPack(G, it.game);
      event(G, { t: 'crack', game: it.game, uids: pulled.map(c => c.uid) });
      return ok({ pulled });
    }
    case 'toBulk': {
      if (G.phase !== 'shop' && G.phase !== 'close') return err('not now');
      const c = findStock(G, it.uid); if (!c) return err('no card');
      G.stock.splice(G.stock.indexOf(c), 1); G.bulk++; return ok();
    }
    case 'grade': {
      if (G.phase !== 'close') return err('send cards at close');
      const c = findStock(G, it.uid), co = GRADERS[it.co]; if (!c || !co) return err('bad card or grader');
      if (c.graded) return err('already slabbed');
      if (G.cash < co.fee) return err('not enough cash');
      money(G, -co.fee, 'fee', co.name + ' grading fee');
      G.stock.splice(G.stock.indexOf(c), 1);
      G.grading.push({ card: c, co: it.co, due: G.dayIdx + co.days, roll: R(G) });
      return ok();
    }
    case 'restock': {
      if (G.phase !== 'close') return err('restock at close');
      if (G.cash < BOX.cost) return err('not enough cash');
      money(G, -BOX.cost, 'restock', 'Booster box: ' + GAMES[it.game].name); G.packs[it.game] += BOX.packs; return ok();
    }
    case 'endDay': {
      if (G.phase !== 'close') return err('not now');
      const rent = DAYS[G.dayIdx].rent, paid = Math.min(rent, Math.max(0, G.cash));
      money(G, -paid, 'rent', 'Dock rent'); if (paid < rent) { G.tab += rent - paid; event(G, { t: 'tab', amt: rent - paid }); }
      // a tab gets paid down when there's spare cash
      if (G.tab && G.cash > 60) { const pay = Math.min(G.tab, G.cash - 60); G.tab -= pay; money(G, -pay, 'rent', 'Paid down the tab'); }
      G.days.push(summaryOfDay(G));
      if (DAYS[G.dayIdx].cardNight) { G.phase = 'cardnight'; say(G, 'vee', 'CARD NIGHT! Pick a game to feature and rip packs live on Floss\'s stream.'); return ok(); }
      if (G.dayIdx >= DAYS.length - 1) { finale(G); return ok(); }
      startDay(G); return ok();
    }
    case 'cardNight': {
      if (G.phase !== 'cardnight') return err('not now');
      const g = it.game, n = Math.min(it.n | 0, G.packs[g] || 0, 6); let holo = 0, grail = 0; const pulls = [];
      for (let i = 0; i < n; i++) { G.packs[g]--; G.stats.cracked++; const p = crackPack(G, g); pulls.push(...p); for (const c of p) { const r = tmpl(c.t).rarity; if (r === 'h') holo++; if (r === 'g') grail++; } }
      const hype = n ? +(0.05 + 0.03 * n + 0.15 * holo + 0.4 * grail).toFixed(2) : 0; G.hype[g] += hype;
      // the crowd buys some of what's left on the shelf
      let sold = 0; for (const k of Object.keys(G.packs).sort((a, b) => G.packs[b] - G.packs[a])) while (sold < 3 && G.packs[k] > 0) { G.packs[k]--; sold++; }
      if (sold) money(G, sold * PACK_RETAIL, 'sell', 'Card Night crowd bought ' + sold + ' packs');
      G.rep = clamp(G.rep + 6, 0, 100);
      event(G, { t: 'cardNight', game: g, n, holo, grail, hype, sold, uids: pulls.map(c => c.uid) });
      say(G, 'vee', n ? 'What a stream! ' + GAMES[g].name + ' hype +' + Math.round(hype * 100) + '% for tomorrow.' : 'Chill night. The crowd still bought some packs.');
      return ok();
    }
    case 'nextMorning': {
      if (G.phase !== 'cardnight') return err('not now');
      startDay(G); return ok();
    }
  }
  return err('unknown action ' + it.t);
}
function ok(x) { return Object.assign({ ok: true }, x || {}); }
function err(m) { return { ok: false, error: m }; }

function crackPack(G, game) {
  const out = [];
  for (const r of ['c', 'c', 'c', 'u']) out.push(makeCard(G, game, r, 9.0, { fresh: true }));
  out.push(makeCard(G, game, rollRarity(G, true), 9.0, { fresh: true }));
  for (const c of out) { c.know.uv = true; G.stock.push(c); }
  return out;
}

function offer(G, p) {
  const v = G.visit; if (G.phase !== 'visit' || !v) return err('not now');
  if (!(p > 0)) return err('bad price');
  const S = SPECIES[v.species];
  v.rounds++;
  if (v.role === 'sell' || v.role === 'lot' || v.role === 'bulk') {
    // you're buying: they come down toward your offer
    if (p >= v.ask) return dealBuy(G, v.ask);
    if (G.cash < p) return err('not enough cash');
    if (p < v.floor * S.insultAt) { v.insulted = true; say(G, v.who, line(G, v, 'insult')); costPatience(G, S.insultCost); return ok(); }
    let conc = S.conc; if (S.roundBonus && p % 10 === 0) conc += S.roundBonus;
    v.ask = Math.max(v.floor, Math.round(v.ask - (v.ask - p) * conc));
    if (p >= v.ask * 0.97 || p >= v.ask - 1) return dealBuy(G, p);
    say(G, v.who, (S.roundBonus && p % 10 === 0 && LINES[v.species].round.length ? line(G, v, 'round') + ' ' : '') + line(G, v, 'counter', v.ask));
    costPatience(G, 1); return ok();
  }
  // you're selling: they come up toward your price, never past their ceiling
  if (!v.showing) return err('show something first');
  if (p <= v.bid) return dealSell(G, p);
  if (p > v.ceil * 1.5) { v.insulted = true; say(G, v.who, line(G, v, 'insult')); costPatience(G, S.insultCost); return ok(); }
  v.bid = Math.min(v.ceil, Math.round(v.bid + (Math.min(p, v.ceil) - v.bid) * (S.conc + 0.1)));
  if (v.bid >= p * 0.97 || v.bid >= p - 1) return dealSell(G, p);
  say(G, v.who, v.bid >= v.ceil ? 'That\'s my limit: ' + v.bid + '₵.' : line(G, v, 'counter', v.bid));
  costPatience(G, 1); return ok();
}
function dealBuy(G, price) {
  const v = G.visit; if (G.cash < price) return err('not enough cash');
  money(G, -price, 'buy', 'Bought from ' + PEOPLE[v.who].name + ' (' + v.cards.length + ' card' + (v.cards.length > 1 ? 's' : '') + ')');
  let belief = 0; for (const c of v.cards) belief += Math.max(1, BASE[tmpl(c.t).rarity] * RAW(trueGrade(c)));
  for (const c of v.cards) { c.cost = price * Math.max(1, BASE[tmpl(c.t).rarity] * RAW(trueGrade(c))) / belief; G.stock.push(c); }
  G.stats.deals++; G.rep = clamp(G.rep + 1, 0, 100);
  say(G, v.who, line(G, v, 'deal')); endVisit(G, 'deal'); return ok();
}
function dealSell(G, price) {
  const v = G.visit;
  if (v.showing === 'packs') {
    let n = v.packs; for (const k of ['shell', 'hive', 'star']) while (n > 0 && G.packs[k] > 0) { G.packs[k]--; n--; }
    money(G, price, 'sell', 'Sold ' + v.packs + ' sealed packs to ' + PEOPLE[v.who].name);
  } else {
    const c = findStock(G, v.showing);
    // careful buyers may spot a fake at the counter
    if (c.fake && v.species !== 'zekk' && R(G) < 0.5) { say(G, v.who, 'Wait... this is a FAKE!'); G.rep = clamp(G.rep - 5, 0, 100); v.insulted = true; endVisit(G, 'walk'); return ok({ caught: true }); }
    G.stock.splice(G.stock.indexOf(c), 1);
    money(G, price, 'sell', 'Sold ' + (readable(G, c) ? tmpl(c.t).name : 'a card') + ' to ' + PEOPLE[v.who].name);
    if (c.fake) { G.complaints.push({ who: PEOPLE[v.who].name, price }); G.stats.fakesSold++; }
    const flip = price - (c.cost || 0);
    if (!G.stats.bestFlip || flip > G.stats.bestFlip.flip) G.stats.bestFlip = { flip: Math.round(flip), t: c.t, price };
  }
  G.stats.deals++; G.rep = clamp(G.rep + 1, 0, 100);
  say(G, v.who, line(G, v, 'deal')); endVisit(G, 'deal'); return ok();
}

function closeShop(G) {
  G.phase = 'close';
  const n = Math.min(G.bulk, 3 + Math.floor(G.rep / 25)); if (n) { G.bulk -= n; money(G, n, 'bulk', 'Bulk bin: ' + n + ' commons sold'); }
  const next = DAYS[G.dayIdx + 1];
  say(G, 'vee', next ? 'Closing time! Tomorrow: ' + next.name + '. ' + Object.keys(next.demand).map(g => GAMES[g].name + ' ×' + next.demand[g]).join(', ') + '.' : 'Last close! Send anything to the graders: tonight is Grade Day and every slab comes home.');
}
function summaryOfDay(G) {
  const rows = G.ledger.filter(l => l.day === G.dayIdx); let inc = 0, out = 0; for (const r of rows) r.amt > 0 ? inc += r.amt : out += r.amt;
  return { day: G.dayIdx, income: inc, spent: out, cash: Math.round(G.cash), value: Math.round(shopValue(G)) };
}
function finale(G) {
  G.events = [];
  resolveGrades(G, true);
  G.phase = 'end';
  const v = Math.round(shopValue(G)), gain = v - G.startValue;
  const ranks = [[-1e9, 'Corner Stall'], [60, 'Strip Regular'], [180, 'Lane Favorite'], [400, 'Dock Legend'], [800, 'Legend of the Lanes']];
  let rank = ranks[0][1]; for (const [at, name] of ranks) if (gain >= at) rank = name;
  G.final = { value: v, start: G.startValue, gain, rank, tab: G.tab };
  say(G, 'vee', 'GRADE DAY! Every slab is home. Final shop value ' + v + '₵. Rank: ' + rank + '!');
}

const CT = { newGame, act, DAYS, GAMES, SPECIES, PEOPLE, GRADERS, RARITY_NAME, RANK, BASE, BOX, PACK_RETAIL, TRANSLATE_FEE, FLUENT_AT,
  tmpl, trueGrade, centerRatio, estimate, readable, trueValue, shopValue, matches, wantsText, demandOf };
if (typeof module !== 'undefined' && module.exports) module.exports = CT; else root.CT = CT;
})(this);
