// Intergalactic Card Trader · v3 engine. Pure: seeded RNG, no DOM, runs in node (sim.js) and the browser.
// Every player action goes through act(G, intent). The UI and the bots only read G and call act.
// v2 ("the market fights back"): a 5-day week, card variants and promos, After Hours events, scalpers, ring fakes,
// a pump-and-dump, Loupe upgrades and a store policy. Design: design/v2-design.md.
// v3 ("the Back Room", rev 2): stock lives on the floor or in the back and selling uses both, 3 eras, sealed product,
// a store rating, a known-offenders board you fill yourself, and a 10-day run.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';

// ---------- seeded RNG ----------
// The RNG state lives in G._s, so G is plain JSON: a save is JSON.stringify(G) and a load is JSON.parse.
function R(G) { G._s = (G._s + 0x6D2B79F5) >>> 0; let t = G._s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
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

// ---------- variants (v2) ----------
// Every copy carries a print: c.v = { fin, first, set, promo, serial, err, signed }. Most of it is drawn in code.
const FINISH = { std: 'Standard', mirror: 'Mirror foil', full: 'Full-art', alt: 'Alt-art' };
const SETS = { core: 'Modern', mid: 'Mid era', vintage: 'Wave 1 (vintage)', reprint: 'Reprint' };
const ERRORS = { offcut: 'Factory miscut', ink: 'Ink swap', nofoil: 'Missing foil' };
const PROMOS = {
  'dock-mollu': { name: 'Pearl Dock promo', mult: 1.6 }, 'dock-zekk': { name: 'Swarm Dock promo', mult: 1.6 }, 'dock-puffi': { name: 'Cloud Dock promo', mult: 1.6 },
  topper: { name: 'Box topper promo', mult: 1.5 }, cardnight: { name: 'Card Night promo', mult: 1.6 }, tourney: { name: 'Tournament prize promo', mult: 2.0 },
  release: { name: 'Wave 3 release promo', mult: 1.4 },
};
const VARIANT_CAP = 30;
const UPGRADES = {
  lens: { name: 'Print Lens', cost: 50, does: 'Shows set symbols (vintage vs reprint), verifies serials and signatures, and spots factory misprints.' },
  spec: { name: 'Spectrometer', cost: 70, does: 'The UV lamp also catches ring fakes that copy the watermark.' },
  hands: { name: 'Steady Hands', cost: 40, does: 'The first tool you use on each card costs no patience.' },
};

// Named regulars plus v2's bad actors. askMul/floorMul shape them as sellers (vs what they believe); ceilMul as buyers.
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
  skrimp: { name: 'Skrimp', species: 'zekk',  askMul: 1.3, floorMul: 0.9, ceilMul: 1.0, line: 'a scalper: buys everything, resells on the strip', bad: true },
  quill:  { name: 'Quill',  species: 'mollu', askMul: 1.0, floorMul: 0.7, ceilMul: 1.0, line: 'a Glyphsmith courier with suspiciously perfect promos', bad: true },
  hype:   { name: 'The Hype Bros', species: 'puffi', askMul: 1.0, floorMul: 0.85, ceilMul: 1.0, line: 'two Puffi with a "can\'t-miss" tip', bad: true },
};

// Five scripted days. Who comes is fixed so every run teaches the same lessons; what they bring is rolled.
// src picks how prints roll: 'old' binders (vintage, first runs, misprints), 'dealer' (more signed), 'ring' (ring fakes).
const DAYS = [
  { name: 'Reef Run', ships: ['mollu', 'puffi'], demand: { shell: 1.0, hive: 0.9, star: 1.2 }, rent: 40,
    dj: 'Mollu pearl-haulers and a Puffi cloud-liner on the lanes this morning. Starweave is warm, Hive Gambit is sleepy. Keep an eye out for mirror foils!',
    visitors: [
      { who: 'pearla', role: 'sell', n: 2, games: ['shell'], q: 7.6, gem: 'h', read: true, src: 'old' },
      { who: 'tumbo',  role: 'buy',  wants: { game: 'shell', min: 'u' } },
      { who: 'nubb',   role: 'bulk', n: 6, games: ['star', 'shell'] },
      { who: 'klik',   role: 'sell', n: 2, games: ['hive'], q: 7.2, gem: 'h', fakes: 1 },
      { who: 'mimbo',  role: 'buy',  wants: { game: 'star', min: 'c', cond: 8 } },
      { who: 'sheelo', role: 'lot',  n: 9, games: ['star', 'hive', 'shell'], q: 6.4, gem: 'g', gemGame: 'star', fakes: 1, src: 'old' },
      { who: 'floss',  role: 'sealed', n: 2 },
    ] },
  { name: 'Hive Swarm', ships: ['zekk'], demand: { shell: 0.9, hive: 1.5, star: 1.0 }, rent: 60,
    dj: 'A whole Zekk swarm-fleet is docking, handing out Swarm Dock promos! Hive Gambit is HOT today.',
    visitors: [
      { who: 'vrrz',   role: 'sealed', n: 4 },
      { who: 'klik',   role: 'buy',  wants: { game: 'hive', min: 'r' } },
      { who: 'zazza',  role: 'lot',  n: 9, games: ['hive', 'hive', 'shell'], q: 6.8, gem: 'g', gemGame: 'hive', fakes: 2 },
      { who: 'pearla', role: 'sell', n: 3, games: ['shell', 'star'], q: 6.8, gem: 'r', src: 'old' },
      { who: 'tumbo',  role: 'buy',  wants: { game: 'shell', min: 'r' } },
      { who: 'klik',   role: 'flip', wants: { min: 'u' } },
      { who: 'floss',  role: 'sealed', n: 2 },
      { who: 'mimbo',  role: 'buy',  wants: { game: 'star', min: 'u', cond: 8 } },
    ] },
  { name: 'Star Drift', ships: ['puffi', 'mollu'], demand: { shell: 1.1, hive: 1.0, star: 1.4 }, rent: 80,
    dj: 'The Puffi festival ship is in! Starweave everywhere. Word on the strip: a scalper called Skrimp is working the shops, and someone is passing perfect-looking promos.',
    visitors: [
      { who: 'mimbo',  role: 'buy',  wants: { game: 'star', min: 'r', cond: 9 } },
      { who: 'floss',  role: 'sealed', n: 3 },
      { who: 'skrimp', role: 'scalp' },
      { who: 'sheelo', role: 'lot',  n: 9, games: ['shell', 'star', 'hive'], q: 6.6, gem: 'h', fakes: 1, src: 'dealer' },
      { who: 'tumbo',  role: 'buy',  wants: { game: 'shell', min: 'u' } },
      { who: 'quill',  role: 'sell', n: 2, games: ['star', 'shell'], q: 8.2, gem: 'h', fakes: 1, src: 'ring' },
      { who: 'vrrz',   role: 'sealed', n: 3 },
      { who: 'mimbo',  role: 'flip', wants: { game: 'star', min: 'u' } },
    ] },
  { name: 'The Rumor', ships: ['mollu', 'zekk'], demand: { shell: 1.2, hive: 1.1, star: 0.9 }, rent: 100, pump: true,
    dj: 'Lane FM rumor mill is ON FIRE: everyone says {pump} is about to spike. Me? I just read the docking schedule.',
    visitors: [
      { who: 'hype',   role: 'sell', n: 3, pumpCards: true, q: 7.8 },
      { who: 'tumbo',  role: 'buy',  wants: { pump: true } },
      { who: 'pearla', role: 'sell', n: 3, games: ['shell', 'star'], q: 6.6, gem: 'r', src: 'old' },
      { who: 'klik',   role: 'flip', wants: { min: 'u' } },
      { who: 'zazza',  role: 'lot',  n: 9, games: ['hive', 'star', 'shell'], q: 6.8, gem: 'h', fakes: 2, src: 'ring' },
      { who: 'nubb',   role: 'bulk', n: 6, games: ['hive', 'shell'] },
      { who: 'vrrz',   role: 'sealed', n: 3 },
      { who: 'mimbo',  role: 'buy',  wants: { pump: true } },
    ] },
  { name: 'Wave 3 Release Day', ships: ['mollu', 'zekk', 'puffi'], demand: { shell: 1.2, hive: 1.2, star: 1.2 }, rent: 130, release: true,
    dj: 'WAVE 3 DROPS TODAY! Lines out the dock, release promos with every few packs, reprints everywhere ({pump} got reprinted: ouch). Watch for scalpers and fakes. Grade Day tonight!',
    visitors: [
      { who: 'skrimp', role: 'scalp' },
      { who: 'vrrz',   role: 'sealed', n: 5 },
      { who: 'quill',  role: 'lot',  n: 9, games: ['star', 'hive', 'shell'], q: 8.0, gem: 'h', fakes: 2, src: 'ring' },
      { who: 'floss',  role: 'sealed', n: 4 },
      { who: 'sheelo', role: 'lot',  n: 9, games: ['shell', 'star', 'hive'], q: 6.4, gem: 'g', fakes: 1, src: 'old' },
      { who: 'tumbo',  role: 'buy',  wants: { game: 'shell', min: 'r' } },
      { who: 'mimbo',  role: 'buy',  wants: { game: 'star', min: 'r', cond: 9 } },
      { who: 'klik',   role: 'flip', wants: { min: 'u' } },
    ] },
];
// After Hours: after days 1-4 you pick one of two flyers. Day 5's night is Grade Day.
// Night 1 is always the same tutorial pair; later nights draw two from the pool, never repeating last night's pick.
const NIGHT_FLYERS = [['dig', 'swap'], ['cardnight', 'auction'], ['tourney', 'dig'], ['cardnight', 'auction']];
const NIGHT_POOL = ['cardnight', 'tourney', 'auction', 'dig', 'swap'];
const RENT = [40, 70, 90, 120, 150];

// ---------- the week (randomized past day 1) ----------
// Day 1 is the tutorial: fixed customers in a fixed order. Days 2-5 keep their signature visitors (scalper, Glyphsmith,
// Hype Bros) and draw the rest from a pool, always with at least 2 sellers, 2 buyers and a pack buyer. Demand moves by
// up to ±0.15 and the ships that dock follow the hot games. Everything is seeded, so a seed always plays the same week.
const SPECIALS = {
  2: [{ who: 'skrimp', role: 'scalp' }, { who: 'quill', role: 'sell', n: 2, games: ['star', 'shell'], q: 8.2, gem: 'h', fakes: 1, src: 'ring' }],
  3: [{ who: 'hype', role: 'sell', n: 3, pumpCards: true, q: 7.8 }, { who: 'tumbo', role: 'buy', wants: { pump: true } }, { who: 'mimbo', role: 'buy', wants: { pump: true } }],
  4: [{ who: 'skrimp', role: 'scalp' }, { who: 'quill', role: 'lot', n: 9, games: ['star', 'hive', 'shell'], q: 8.0, gem: 'h', fakes: 3, src: 'ring' }],
};
function fillerVisitor(G, kind, day) {
  const games = ['shell', 'hive', 'star'], own = { pearla: 'shell', sheelo: 'shell', tumbo: 'shell', klik: 'hive', zazza: 'hive', vrrz: 'hive', mimbo: 'star', floss: 'star', nubb: 'star' };
  const ringy = day >= 2 && R(G) < 0.5;
  if (kind === 'sell') { const who = pick(G, ['pearla', 'pearla', 'zazza', 'klik']); return { who, role: 'sell', n: 2 + Math.floor(R(G) * 2), games: [own[who], pick(G, games)], q: 6.4 + R(G) * 1.2, gem: pick(G, ['r', 'r', 'h', 'h', 'g']), fakes: R(G) < 0.4 ? 1 : 0, src: ringy && who === 'zazza' ? 'ring' : pick(G, ['old', 'old', 'dealer']) }; }
  if (kind === 'lot') { const who = pick(G, ['sheelo', 'zazza']); return { who, role: 'lot', n: 9, games: [pick(G, games), pick(G, games), own[who]], q: 6.3 + R(G) * 0.7, gem: pick(G, ['h', 'h', 'g']), fakes: 1 + (R(G) < 0.4 ? 1 : 0), src: ringy ? 'ring' : who === 'sheelo' ? 'dealer' : 'old' }; }
  if (kind === 'buy') { const who = pick(G, ['tumbo', 'mimbo', 'klik']); return { who, role: 'buy', wants: { game: own[who], min: pick(G, ['u', 'r', 'r']), cond: who === 'mimbo' && R(G) < 0.6 ? pick(G, [8, 9]) : undefined } }; }
  if (kind === 'flip') { const who = pick(G, ['klik', 'mimbo']); return { who, role: 'flip', wants: { game: R(G) < 0.5 ? own[who] : undefined, min: 'u' } }; }
  if (kind === 'browse') return { who: pick(G, ['nova', 'kiri']), role: 'browse' };
  if (kind === 'sealed') { const who = pick(G, ['vrrz', 'floss']); return { who, role: 'sealed', n: 2 + Math.floor(R(G) * 3) + (day === 4 ? 1 : 0) }; }
  return { who: 'nubb', role: 'bulk', n: 6, games: [pick(G, games), pick(G, games)] };
}
function buildWeek(G) {
  const week = [JSON.parse(JSON.stringify(DAYS[0]))];
  week[0].rent = RENT10[0];
  // day 1 tutorial: a kid with a fake to note (after the third customer) and a browser (after the fifth)
  week[0].visitors.splice(3, 0, JSON.parse(JSON.stringify(V3_SPECIALS[0][0]))); week[0].visitors.splice(6, 0, JSON.parse(JSON.stringify(V3_SPECIALS[0][1])));
  for (let i = 1; i < 10; i++) {
    const B = i < DAYS.length ? DAYS[i] : DAYS2[i - DAYS.length], demand = {};
    for (const g in B.demand) demand[g] = clamp(Math.round((B.demand[g] + (R(G) - 0.5) * 0.3) * 20) / 20, 0.7, 1.7);
    let ships = Object.keys(demand).filter(g => demand[g] >= 1.1).map(g => GAMES[g].species);
    if (!ships.length) ships = [GAMES[Object.keys(demand).sort((a, b) => demand[b] - demand[a])[0]].species];
    if (B.release) ships = ['mollu', 'zekk', 'puffi'];
    const specials = (SPECIALS[i] || []).concat(V3_SPECIALS[i] || []);
    if (i === 8) specials.push({ who: 'quill', role: 'lot', n: 9, games: ['star', 'hive', 'shell'], q: 8.0, gem: 'h', fakes: 3, src: 'ring', intent: 'schemer' });
    const kinds = ['sell', 'lot', 'buy', 'buy', 'sealed'];
    while (kinds.length + specials.length < 9) kinds.push(pick(G, ['sell', 'lot', 'buy', 'flip', 'sealed', 'bulk', 'sell', 'buy']));
    const visitors = kinds.map(k => fillerVisitor(G, k, i));
    for (let k = visitors.length - 1; k > 0; k--) { const j = Math.floor(R(G) * (k + 1)); [visitors[k], visitors[j]] = [visitors[j], visitors[k]]; }
    // signature visitors land somewhere in the middle of the day, never first
    for (const s of specials) visitors.splice(1 + Math.floor(R(G) * (visitors.length - 1)), 0, JSON.parse(JSON.stringify(s)));
    const hot = Object.keys(demand).sort((a, b) => demand[b] - demand[a])[0];
    const shipLine = ships.map(s => SPECIES[s].name).join(' and ') + ' ships on the lanes. ' + GAMES[hot].name + ' is hottest at ×' + demand[hot] + '.';
    const extra = { 2: ' Word on the strip: a scalper called Skrimp is working the shops, and someone is passing perfect-looking promos.',
      1: ' Heads up: a crew called the Scale Gang has been feeling up pack racks on the strip.',
      3: ' And the rumor mill says {pump} is about to spike. Me? I read the docking schedule.',
      4: ' WAVE 3 DROPS TODAY! Release promos every few packs, reprints everywhere ({pump} got reprinted: ouch).',
      5: ' The estate sales have started: old collections, old sealed product. Bring cash.',
      6: ' Some familiar faces are back on the strip. Hats and new coats, same habits.',
      7: ' Collector\'s Fair crowd in town: serious buyers, deep pockets, sharp eyes.',
      8: ' WAVE 4 DROPS TODAY! Lines out the dock again.',
      9: ' Last day of the run. Grade Day tonight: every slab comes home.' }[i] || '';
    week.push({ name: B.name, ships, demand, rent: RENT10[i], pump: !!B.pump, release: !!B.release, visitors, dj: shipLine + extra });
  }
  return week;
}
const NIGHTS = {
  cardnight: { name: 'Card Night', blurb: 'Rip packs live on Floss\'s stream: hype for tomorrow, 2 Card Night promos, the crowd buys packs.' },
  tourney: { name: 'Tournament Night', blurb: 'Host a tournament: entry fees, players buy singles, you put up a prize and get 2 prize promos.' },
  auction: { name: 'Dock Auction', blurb: 'Bid on an unclaimed cargo crate against two rival dealers. Three clues, one crate.' },
  dig: { name: 'Bulk Dig', blurb: 'A 10₵ mystery bulk lot: 16 face-down cards, 6 flips. Read the backs for foil glints.' },
  swap: { name: 'Swap Meet', blurb: 'Three regulars each offer a 1-for-1 trade. No cash, just your eye.' },
};

// ---------- the card universe ----------
// Every card comes from the seeded CardGen universe (kit/cardgen, Card Trader's profile in data/): thousands of cards per
// game across vintage, mid and modern sets, with printings per era, pull odds, sealed product and reprint flags. It is
// rebuilt from G.seed (never stored in G), so saves stay plain JSON. Integration notes: design/card-generator-integration.md.
const CGX = typeof CG !== 'undefined' ? CG : typeof require === 'function' ? require('./cardgen.js') : null;
let UNI = null;
function uni(G) { const sd = (G && G.seed) >>> 0; if (!UNI || UNI.seed !== sd) UNI = CGX.build(sd); return UNI; }
const runDay = G => Math.max(0, G.dayIdx + 1);
const ERA_U = {};
function eraMedianU(era) { if (ERA_U[UNI.seed + era] == null) { const b = UNI.search({ era, rarity: 'u' }).map(c => c.base).sort((x, y) => x - y); ERA_U[UNI.seed + era] = b.length ? b[Math.floor(b.length / 2)] : BASE.u; } return ERA_U[UNI.seed + era]; }
function cardOf(c) { return UNI && UNI.card(c.t); }
function baseOf(c, misread) { const k = cardOf(c); if (!k) return BASE[tmpl(c.t).rarity]; return misread ? eraMedianU(k.era) : k.base; }

// ---------- cards ----------
const tid = (game, i) => game + '-' + i;
function tmpl(t) {
  const k = UNI && UNI.card(t);
  if (k) return { game: k.game, idx: k.art[0], hue: k.art[1], name: k.name, rarity: k.rarity, era: k.era, set: k.set, kind: k.kind };
  const [game, i] = t.split('-'); const idx = +i; return { game, idx, name: GAMES[game].cards[idx], rarity: RARITY_BY_INDEX(idx) };
}
function trueGrade(c) { const lo = Math.min(c.cen, c.edg, c.sur), avg = (c.cen + c.edg + c.sur) / 3; return clamp(Math.round(lo * 0.35 + avg * 0.65), 1, 10); }
function centerRatio(c) { const off = (10 - c.cen) * 2.6; return [Math.round(50 + off), Math.round(50 - off)]; } // e.g. 60/40

function rollIdx(G, rarity) { const pool = { c: [0, 8], u: [8, 12], r: [12, 15], h: [15, 17], g: [17, 18] }[rarity]; return pool[0] + Math.floor(R(G) * (pool[1] - pool[0])); }
function rollRarity(G, rareSlot) {
  const x = R(G);
  if (rareSlot) return x < 0.02 ? 'g' : x < 0.17 ? 'h' : 'r';
  return x < 0.62 ? 'c' : x < 0.88 ? 'u' : x < 0.97 ? 'r' : 'h';
}
// Roll a print for a new copy. src: 'pack' | 'rareslot' | 'old' | 'dealer' | 'ring' | 'plain'
function rollPrint(G, rarity, src) {
  const v = { fin: 'std', first: false, set: 'core', promo: null, serial: null, err: null, signed: false };
  if (src === 'plain') return v;
  const low = rarity === 'c' || rarity === 'u';
  if (low && R(G) < (src === 'pack' ? 1 / 6 : 1 / 8)) v.fin = 'mirror';
  if (src === 'rareslot' || (!low && src !== 'pack')) { const x = R(G); if (x < 0.04) v.fin = 'full'; else if (x < 0.08) v.fin = 'alt'; }
  if ((v.fin === 'full' || v.fin === 'alt') && R(G) < 0.25) v.serial = 1 + Math.floor(R(G) * 50);
  if (src === 'old' || src === 'dealer') {
    if (R(G) < 0.2) v.set = 'vintage'; else if (R(G) < 0.15) v.first = true;
    if (R(G) < 0.06) v.err = pick(G, v.fin === 'std' ? ['offcut', 'offcut', 'ink'] : ['offcut', 'ink', 'nofoil']);
  }
  if (src === 'dealer' && R(G) < 0.06) v.signed = true;
  if (src === 'pack' && (G.dayIdx === 4 || G.dayIdx === 8) && R(G) < 0.4) v.set = 'reprint';
  return v;
}
// The per-copy extras the universe doesn't own (serials, signatures) go on c.v with the printing's drawing hints.
function printV(G, k, p, src) {
  const v = { fin: 'std', first: false, set: k.era === 'vintage' ? 'vintage' : k.era === 'mid' ? 'mid' : 'core', promo: null, serial: null, err: null, signed: false };
  Object.assign(v, (UNI.printings[p] || {}).v || {});
  if (v.promo === 'dock') v.promo = 'dock-' + GAMES[k.game].species;
  if ((v.fin === 'full' || v.fin === 'alt') && R(G) < 0.25) v.serial = 1 + Math.floor(R(G) * 50);
  if (src === 'dealer' && R(G) < 0.06) v.signed = true;
  return v;
}
// src: 'pack' | 'rareslot' (modern, current set) | 'old' (estate binders: more vintage) | 'dealer' | anything else = a binder
function makeCard(G, game, rarity, q, opts) {
  opts = opts || {};
  const U = uni(G), at = () => clamp(Math.round(q + gauss(G) * (opts.fresh ? 1.0 : 1.5)), 1, 10);
  const src = opts.src === 'pack' || opts.src === 'rareslot' ? 'pack' : opts.src === 'old' ? 'old' : opts.src === 'dealer' ? 'dealer' : 'binder';
  let d = opts.id ? { id: opts.id, p: opts.p || 'std' } : U.draw(G, { game, rarity: rarity || undefined, src, era: opts.era, day: runDay(G) });
  if (!d) d = U.draw(G, { game, rarity: rarity || undefined, day: runDay(G) });
  const k = U.card(d.id);
  const c = { uid: 'c' + (++G._uid), t: d.id, p: d.p, cen: at(), edg: at(), sur: at(), fake: null, graded: null,
    know: { loupe: false, uv: false, read: !!opts.read, fake: false, print: false, spec: false, free: false }, cost: 0, flawUsed: false,
    v: printV(G, k, d.p, opts.src) };
  if (opts.fake) {
    c.fake = opts.fake === 'ring' ? 'ring' : (R(G) < 0.5 ? 'uv' : 'stock');
    // fakes copy whatever sells: ring fakes dress up as serialized full-arts and promos
    if (c.fake === 'ring') { if (R(G) < 0.5) { c.v.fin = 'full'; c.v.serial = 1 + Math.floor(R(G) * 12); } else c.v.promo = pick(G, ['cardnight', 'tourney', 'topper']); c.cen = Math.max(c.cen, 8); c.edg = Math.max(c.edg, 8); c.sur = Math.max(c.sur, 8); }
  }
  if (c.v.err === 'offcut') c.cen = Math.min(c.cen, 2 + Math.floor(R(G) * 3)); // a miscut reads exactly like bad centering
  if (opts.promo) c.v.promo = opts.promo;
  if (opts.mint) { c.cen = Math.max(c.cen, 9); c.edg = Math.max(c.edg, 9); c.sur = Math.max(c.sur, 9); }
  c.era = k.era; c.ms = k.era === 'modern' ? k.set : null;
  return c;
}

// ---------- value ----------
// Pumped card: day 4 the rumor makes it ×1.8; from day 5 on it was reprinted and crashes to ×0.5.
function pumpMult(G, c) { return G.pump && G.pump.t === c.t && !c.fake ? (G.dayIdx === 3 ? 1.8 : G.dayIdx >= 4 ? 0.5 : 1) : 1; }
// The variant multiplier. known = the player's knowledge (estimate) or null for the truth.
function variantMult(G, c, known) {
  const v = c.v || {}, low = RANK[tmpl(c.t).rarity] <= 1, sees = (k) => !known || known[k];
  let m = 1;
  // CardGen copies: the printing's multiplier (seen with the Loupe or the Print Lens, or by anyone), plus per-copy extras
  if (c.p && UNI) { const P = UNI.printings[c.p] || {};
    if (!P.see || sees(P.see === 'print' ? 'print' : 'loupe')) m *= UNI.printingMult(UNI.card(c.t), c.p);
    if (v.serial && sees('loupe')) m *= v.serial === 1 ? 10 : v.serial <= 5 ? 6 : 3;
    if (v.signed && sees('loupe')) m *= 2;
    if (v.promo && !P.promo && PROMOS[v.promo] && sees('loupe')) m *= PROMOS[v.promo].mult;
    return Math.min(m, VARIANT_CAP); }
  if (v.fin === 'mirror' && sees('loupe')) m *= low ? 2 : 1.4;
  if (v.fin === 'full') m *= 2.5; if (v.fin === 'alt') m *= 2;
  if (v.first && sees('loupe')) m *= 1.6;
  if (v.set === 'vintage' && sees('print')) m *= 1.8;
  if (v.set === 'mid' && sees('print')) m *= 1.25;
  if (v.set === 'reprint' && sees('print')) m *= 0.7;
  if (v.serial && sees('loupe')) m *= v.serial === 1 ? 10 : v.serial <= 5 ? 6 : 3;
  if (v.err && sees('print')) m *= 3;
  if (v.signed && sees('loupe')) m *= 2;
  if (v.promo && sees('loupe')) m *= PROMOS[v.promo].mult;
  return Math.min(m, VARIANT_CAP);
}
function demandOf(G, game) { return G.demand[game] || 1; }
// Modern singles follow their set's market (release hype, reprints, a set that's never reprinted); old eras drift.
function singleTrend(G, c) { const k = cardOf(c); if (!k || !G.store) return 1; return UNI.trend(UNI.set(k.set), runDay(G), k.demand === 'chase' || UNI.isHit(k, c.p) ? 1 : 0); }
function hot(G, c) { return G.hotList.indexOf(c.t) >= 0 ? 1.5 : 1; }
// What the card is really worth to a buyer today (they can see the real condition and print).
function trueValue(G, c, demand) {
  if (c.fake) return 0;
  uni(G);
  const tm = tmpl(c.t), d = demand == null ? demandOf(G, tm.game) : demand;
  const m = c.graded ? GRADERS[c.graded.co].mult(c.graded.grade) : RAW(trueGrade(c));
  return baseOf(c) * m * d * (demand == null ? hot(G, c) : 1) * variantMult(G, c, null) * pumpMult(G, c) * (c.trim && !c.graded ? TRIM_VALUE : 1) * singleTrend(G, c);
}
const readable = (G, c) => c.know.read || (G.fluency[tmpl(c.t).game] >= FLUENT_AT);
// The player's best guess from what they've learned. Bots use only this.
function estimate(G, c) {
  uni(G);
  if (c.know.fake) return { value: 0, grade: null, rarity: tmpl(c.t).rarity, fake: true };
  const tm = tmpl(c.t), rar = readable(G, c) ? tm.rarity : null;
  const grade = c.graded ? c.graded.grade : c.know.loupe ? trueGrade(c) : null;
  const m = c.graded ? GRADERS[c.graded.co].mult(c.graded.grade) : RAW(grade == null ? 7 : grade);
  const vm = variantMult(G, c, c.know);
  const pm = G.pump && G.pump.t === c.t ? (G.dayIdx === 3 ? 1.8 : G.dayIdx >= 4 ? 0.5 : 1) : 1; // the market price is public
  const v = baseOf(c, !rar) * m * demandOf(G, tm.game) * hot(G, c) * vm * pm * (c.trim && c.know.loupe && !c.graded ? TRIM_VALUE : 1) * singleTrend(G, c);
  return { value: v, grade, rarity: rar, fake: c.know.uv ? false : null, vmult: vm };
}
// What a seller believes their card is worth (home rate). They can't read other species' scripts, can't see
// set symbols or misprints (a miscut just looks damaged to them), and dealers spot vintage.
function sellerBelief(G, person, c) {
  const tm = tmpl(c.t), P = PEOPLE[person], own = SPECIES[P.species].game === tm.game || person === 'sheelo' && tm.game === 'shell';
  const rar = own ? tm.rarity : (RANK[tm.rarity] >= 2 ? 'u' : tm.rarity); // misreads rares and up as "some uncommon"
  const sees = own ? { loupe: true, print: person === 'sheelo' } : { loupe: false, print: false };
  let b = baseOf(c, rar !== tm.rarity) * RAW(trueGrade(c)) * (c.fake ? variantMult(G, c, { loupe: true }) : variantMult(G, c, sees));
  if (G.pump && G.pump.t === c.t && G.dayIdx === 3) b *= 1.8;
  return b;
}

// ---------- state ----------
function newGame(seed) {
  const G = { seed: seed >>> 0, _uid: 0, phase: 'title', dayIdx: -1, cash: 200, tab: 0, rep: 50,
    stock: [], packs: { shell: 2, hive: 2, star: 2 }, bulk: 12, fluency: { shell: 0, hive: 0, star: 0 },
    grading: [], demand: {}, hotList: [], hype: { shell: 0, hive: 0, star: 0 },
    visitIdx: -1, visit: null, ledger: [], days: [], say: null, events: [], complaints: [],
    up: { lens: false, spec: false, hands: false }, policy: { limit2: false }, scalped: 0, pump: null, night: null, packsSoldToday: 0,
    stats: { bestFlip: null, bestGrade: null, fakesCaught: 0, fakesSold: 0, deals: 0, walkouts: 0, cracked: 0, promos: 0, variants: 0, misprints: 0, bestPull: null, scalpedPacks: 0 },
    startValue: 0, log: [], version: 4, week: null, lastNight: null };
  G._s = (seed || 1) >>> 0;
  G.week = buildWeek(G);
  // a brand-new shop: the opening questions (setupShop) decide what's in the opening crate
  G.packs = { shell: 0, hive: 0, star: 0 };
  initStore(G);
  G.demand = { shell: 1, hive: 1, star: 1 };
  G.startValue = Math.round(shopValue(G));
  return G;
}
function shopValue(G) {
  let v = G.cash - G.tab + G.bulk * 1;
  for (const c of G.stock) v += trueValue(G, c, 1);
  for (const g in G.packs) v += G.packs[g] * PACK_RETAIL;
  for (const p of G.grading) if (p.card) v += trueValue(G, p.card, 1);
  const S = G.store; if (!S) return v;
  for (const g in S.backPacks) v += S.backPacks[g] * PACK_RETAIL;
  for (const g in S.dead) v -= Math.min(S.dead[g], G.packs[g] + S.backPacks[g]) * (PACK_RETAIL - DEAD_PACK);
  for (const o of G.goods) v += goodValue(G, o, true);
  for (const k in S.up) if (UNLOCKS[k]) v += UNLOCKS[k].cost * S.up[k] * 0.5; // fixtures resell for about half
  for (const p of G.grading) if (p.good) v += goodValue(G, p.good, true) - (p.card ? 0 : 0);
  for (const it of S.orders.concat(S.crate ? S.crate.items : [])) { if (it.card) { v += trueValue(G, it.card, 1); continue; } if (it.good) { v += goodValue(G, it.good, true); continue; } if (it.item === 'packs') { v += it.n * PACK_RETAIL; continue; } const C = CATALOG[it.item]; if (C && !C.gear) v += it.good ? goodValue(G, it.good, true) : C.cost; }
  return v;
}
function money(G, amt, kind, label) { G.cash += amt; G.ledger.push({ day: G.dayIdx, kind, amt: Math.round(amt), label }); }
function say(G, who, text) { G.say = { who, text }; G.log.push({ day: G.dayIdx, who, text }); }
function event(G, e) { G.events.push(e); }
const findStock = (G, uid) => G.stock.find(c => c.uid === uid);
const visitCard = (G, uid) => G.visit && (G.visit.cards || []).find(c => c.uid === uid);
function nightCard(G, uid) {
  const n = G.night; if (!n) return null;
  if (n.swaps) for (const s of n.swaps) if (s.theirs.uid === uid) return s.theirs;
  if (n.dig) { const c = n.dig.cards.find(x => x.uid === uid); if (c && c.flipped) return c; }
  return null;
}
function addStock(G, c) {
  if (G.store) arrive(G, c);
  G.stock.push(c);
  if (c.v && c.v.promo && !c.fake) G.stats.promos++;
  const pull = trueValue(G, c, 1); if (!G.stats.bestPull || pull > G.stats.bestPull.value) G.stats.bestPull = { value: Math.round(pull), t: c.t, v: c.v };
}

// ---------- days ----------
function startDay(G) {
  G.dayIdx++; const D = G.week[G.dayIdx];
  G.events = [];
  if (G.store) { deliver(G);
    for (const x of uni(G).sets) if (x.era === 'modern' && x.release === runDay(G)) event(G, { t: 'release', set: x.id });
    if (G.grateful && G.dayIdx >= 1) { G.grateful--; D.visitors.splice(1, 0, { who: pick(G, ['pip', 'moma']), role: 'sell', n: 2, games: ['shell', 'star'], q: 7.8, gem: 'h', src: 'old', read: true, intent: 'grateful' }); event(G, { t: 'grateful' }); } }
  G.demand = Object.assign({}, D.demand);
  // last night's hype lands on today
  for (const g in G.hype) if (G.hype[g]) { G.demand[g] = +(G.demand[g] + G.hype[g]).toFixed(2); G.hype[g] = 0; }
  // scalped packs: tomorrow's pack buyers already bought from Skrimp
  G.scalpedToday = G.scalped; G.scalped = 0; G.packsSoldToday = 0;
  // the pump: a rare-or-better from a game whose species isn't docking tomorrow... and it's on the reprint list
  const chase = g => { const l = uni(G).search({ game: g, era: 'modern', min: 'r', max: 'h', day: runDay(G) }); return l.length ? pick(G, l).id : uni(G).search({ game: g, min: 'r' })[0].id; };
  if (D.pump && !G.pump) G.pump = { t: chase(pick(G, ['star', 'hive', 'shell'])) };
  const games = Object.keys(G.demand).sort((a, b) => G.demand[b] - G.demand[a]);
  G.hotList = [chase(games[0]), chase(games[1])];
  if (G.pump) G.hotList = G.hotList.filter(t => t !== G.pump.t);
  G.visitIdx = -1; G.visit = null; G.phase = 'morning'; G.night = null;
  resolveGrades(G, false);
  for (const k of G.complaints) { money(G, -k.price, 'refund', 'Refund: ' + k.who + ' found a fake'); G.rep = clamp(G.rep - 8, 0, 100); event(G, { t: 'complaint', who: k.who, price: k.price }); }
  G.complaints = [];
  let dj = D.dj.replace('{pump}', G.pump ? tmpl(G.pump.t).name : 'a card');
  if (G.store) for (const st of uni(G).sets) {
    if (st.reprint === 'yes' && st.reveal === runDay(G)) { dj += ' Reprint announced: ' + st.name + ' (' + GAMES[st.game].name + ') is going back to print. Ouch for anyone holding it.'; event(G, { t: 'reprint', set: st.id }); }
    if (st.reprint === 'no' && st.reveal - 1 === runDay(G)) dj += ' Distributor gossip: ' + st.name + ' (' + GAMES[st.game].name + ') allocations are getting tight.';
    if (st.reprint === 'no' && st.reveal === runDay(G)) dj += ' Official: ' + st.name + ' will not be reprinted.';
  }
  say(G, 'vee', dj);
}
function resolveGrades(G, all) {
  const keep = [];
  for (const p of G.grading) {
    if (!all && p.due > G.dayIdx) { keep.push(p); continue; }
    if (p.good) { const o = p.good; if (o.resealed) { o.caught = true; event(G, { t: 'grade', good: o.uid, co: p.co, altered: true }); } else { o.sgrade = clamp(8 + Math.floor(p.roll * 3), 7, 10); event(G, { t: 'grade', good: o.uid, co: p.co, grade: o.sgrade }); }
      const f = gridSpot(G, 'shelf', o) ? 'shelf' : gridSpot(G, 'case', o) ? 'case' : null; if (f) { const sp = gridSpot(G, f, o); o.loc = f; [o.x, o.y, o.rot] = sp; G.goods.push(o); } else { G.store.crate = G.store.crate || { items: [] }; G.store.crate.items.push({ item: 'graded', good: o }); }
      continue; }
    const c = p.card;
    if (c.fake) { c.loc = 'inbox'; c.know.uv = true; c.know.fake = true; G.stats.fakesCaught++; event(G, { t: 'grade', uid: c.uid, co: p.co, fake: true }); G.stock.push(c); continue; }
    c.loc = pocketsFree(G, 'inbox') > 0 ? 'inbox' : pocketsFree(G, 'safe') > 0 ? 'safe' : 'inbox';
    if (c.trim) { c.graded = { co: p.co, grade: 1, altered: true }; Object.assign(c.know, { loupe: true, uv: true, read: true, print: true }); G.store.stats.trimsCaught++; event(G, { t: 'grade', uid: c.uid, co: p.co, altered: true }); G.stock.push(c); continue; }
    let g = trueGrade(c);
    if (p.co === 'quik') { const x = p.roll; g = clamp(g + (x < 0.25 ? -1 : x > 0.75 ? 1 : 0), 1, 10); }
    c.graded = { co: p.co, grade: g }; Object.assign(c.know, { loupe: true, uv: true, read: true, print: true });
    if (c.v && c.v.err) G.stats.misprints++;
    if (!G.stats.bestGrade || g > G.stats.bestGrade.grade || (g === G.stats.bestGrade.grade && p.co === 'halo')) G.stats.bestGrade = { grade: g, co: p.co, t: c.t };
    event(G, { t: 'grade', uid: c.uid, co: p.co, grade: g });
    G.stock.push(c);
  }
  G.grading = keep;
}

// ---------- customers ----------
function spawnVisit(G, spec) {
  const P = PEOPLE[spec.who], S = SPECIES[P.species], D = G.week[G.dayIdx];
  const v = { who: spec.who, species: P.species, role: spec.role, wants: spec.wants || null, patience: S.patience + (spec.role === 'lot' ? 6 : 0),
    maxPatience: 0, cards: [], ask: 0, floor: 0, bid: 0, ceil: 0, showing: null, rounds: 0, done: false, packs: 0, result: null };
  if (spec.role === 'sell' || spec.role === 'lot' || spec.role === 'bulk') {
    const gem = spec.gem ? Math.floor(R(G) * spec.n) : -1, fakeAt = [];
    for (let k = 0; k < (spec.fakes || 0); k++) fakeAt.push((gem + 1 + k * 3) % spec.n);
    const docking = D.ships.indexOf(P.species) >= 0 && !P.bad;
    let promoGiven = false;
    for (let i = 0; i < spec.n; i++) {
      let c;
      if (spec.pumpCards) { // the Hype Bros sell copies of the pumped card; one of three may be a ring fake
        const tm = tmpl(G.pump.t);
        c = makeCard(G, tm.game, tm.rarity, spec.q, { id: G.pump.t, src: 'plain', fake: i === 2 && R(G) < 0.5 ? 'ring' : null, read: true });
      } else {
        const isGem = i === gem, g = isGem && spec.gemGame ? spec.gemGame : pick(G, spec.games);
        const rar = isGem ? spec.gem : spec.role === 'bulk' ? (R(G) < 0.2 ? 'u' : 'c') : rollRarity(G, false);
        const isFake = fakeAt.indexOf(i) >= 0;
        const fakeKind = isFake ? (spec.src === 'ring' ? 'ring' : 'plain') : null;
        c = makeCard(G, g, isFake ? (R(G) < 0.5 ? 'h' : 'r') : rar, spec.q || 6.5, { fake: fakeKind, read: !!spec.read, src: spec.src || 'old', mint: isGem && spec.role === 'sell' && G.dayIdx === 0 });
        // dock promos: sellers of a docking species sometimes carry their ship's promo
        if (docking && !promoGiven && !isFake && RANK[tmpl(c.t).rarity] >= 1 && R(G) < 0.35) { c.v.promo = 'dock-' + P.species; promoGiven = true; }
      }
      v.cards.push(c);
    }
    let belief = 0; for (const c of v.cards) belief += sellerBelief(G, spec.who, c);
    if (spec.role === 'bulk') belief = Math.max(4, belief * 0.6);
    v.ask = Math.max(3, Math.round(belief * P.askMul)); v.floor = Math.max(2, Math.round(belief * P.floorMul));
    if (v.floor >= v.ask) v.floor = v.ask - 1;
  } else if (spec.role === 'sealed') {
    v.packs = Math.max(1, spec.n - Math.ceil((G.scalpedToday || 0) / 2)); // Skrimp already sold them some
  }
  if (G.store) { v3Spawn(G, v, spec); if (!v.intent && (spec.fakes || 0) > 0) v.intent = R(G) < 0.55 ? 'schemer' : 'victim';
    if (v.intent === 'schemer' || v.intent === 'victim') { const a = v.intent === 'schemer' ? SCHEMER_TELLS : VICTIM_TELLS, b = v.intent === 'schemer' ? VICTIM_TELLS : SCHEMER_TELLS; const first = pick(G, a); v.react = [first, R(G) < 0.25 ? pick(G, b) : pick(G, a.filter(x => x !== first))]; } }
  if (spec.wants && spec.wants.pump && G.pump) v.wants = { t: G.pump.t };
  v.maxPatience = v.patience;
  return v;
}
function matches(G, wants, c) {
  if (!wants) return true;
  const tm = tmpl(c.t);
  if (wants.t) return c.t === wants.t;
  if (wants.game && tm.game !== wants.game) return false;
  if (wants.min && RANK[tm.rarity] < RANK[wants.min]) return false;
  if (wants.cond) { const g = c.graded ? c.graded.grade : trueGrade(c); if (g < wants.cond) return false; }
  return true;
}
// Buyer's real valuation. Species tastes: Puffi pay up for near-mint and full/alt art; Mollu for first runs and vintage;
// Zekk for serials and misprints. Flippers want margin.
function buyerValue(G, v, c) {
  const P = PEOPLE[v.who], pv = c.v || {};
  let bv = c.trim ? lookValue(G, c) : trueValue(G, c); // a trim fools buyers; a fake doesn't (they check it)
  // buyers only pay for a misprint or a vintage print you can show them (Print Lens); otherwise it's just a card
  if (!c.know.print && !c.graded && !c.fake) { const shown = variantMult(G, c, { loupe: true, print: false }), all = variantMult(G, c, null); if (all > 0) bv *= shown / all; }
  if (v.species === 'puffi' && (c.graded ? c.graded.grade : trueGrade(c)) >= 9) bv *= 1.4;
  if (v.species === 'puffi' && (pv.fin === 'full' || pv.fin === 'alt')) bv *= 1.4;
  if (v.species === 'mollu' && (pv.first || pv.set === 'vintage')) bv *= 1.35;
  if (v.species === 'zekk' && pv.serial) bv *= 1.5;
  if (v.species === 'zekk' && pv.err) bv *= 1.3;
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
const BAD_LINES = {
  quill: 'Fresh from the Glyphsmiths\' workshop, I mean, from a collector. Perfect condition, see? {n} for {p}.',
  snip: 'Every one of these is a perfect 10. Look at those edges! Razor sharp. {n} for {p}.',
  hype: 'Psst. {card} is about to MOON. Everyone knows. We\'ll let you have {n} copies at {p}. You\'re welcome.',
};
function line(G, v, key, p) { const L = LINES[v.species][key]; if (!L || !L.length) return null; return pick(G, L).replace('{p}', p != null ? p + '₵' : '').replace('{w}', wantsText(v.wants)); }
function wantsText(w) {
  if (!w) return 'anything good';
  if (w.t) return tmpl(w.t).name + ' (the one everyone\'s talking about)';
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
function packTotal(G) { return G.packs.shell + G.packs.hive + G.packs.star; }
function takePacks(G, n) { let k = n; for (const g of ['shell', 'hive', 'star']) { while (k > 0 && G.packs[g] > 0) { G.packs[g]--; k--; } if (G.store) G.store.dead[g] = Math.min(G.store.dead[g], G.packs[g]); } return n - k; }
// Release Day: every 3rd pack sold earns a release promo (the distributor's launch deal).
function releasePromos(G, sold) {
  if (!G.week[G.dayIdx].release) return;
  const before = Math.floor(G.packsSoldToday / 3); G.packsSoldToday += sold; const n = Math.floor(G.packsSoldToday / 3) - before;
  for (let i = 0; i < n; i++) { const g = pick(G, ['shell', 'hive', 'star']); const c = makeCard(G, g, R(G) < 0.3 ? 'r' : 'u', 9, { fresh: true, promo: 'release', src: 'plain' }); c.know.uv = true; addStock(G, c); event(G, { t: 'promo', uid: c.uid, from: 'release' }); }
}

// ---------- act: the only way state changes ----------
function act(G, it) {
  const v = G.visit;
  if (G.store) { const r3 = v3Act(G, it); if (r3) return r3; }
  switch (it.t) {
    case 'start': if (G.phase !== 'title') return err('not now'); if (G.store) setupShop(G, it.answers || {}); startDay(G); return ok();
    case 'open': { if (G.phase !== 'morning') return err('not now');
      const need = G.store && openChecklist(G).filter(x => !x.done); if (need && need.length) return err('Before you open: ' + need.map(x => x.label.toLowerCase()).join(', '));
      G.phase = 'shop'; say(G, 'vee', 'Doors open! First customer\'s at the counter.'); return ok(); }
    case 'next': {
      if (G.phase !== 'shop') return err('finish this customer first');
      const D = G.week[G.dayIdx];
      if (G.visitIdx + 1 >= D.visitors.length) { closeShop(G); return ok(); }
      if (G.store && G.visitIdx >= 0 && R(G) < 0.06 * Math.max(0, ratingMod(G) + 0.5)) D.visitors.splice(G.visitIdx + 1, 0, { who: pick(G, ['nova', 'kiri']), role: 'browse' });
      G.visitIdx++; G.visit = spawnVisit(G, D.visitors[G.visitIdx]); G.phase = 'visit';
      const nv = G.visit, P = PEOPLE[nv.who], hello3 = G.store && v3Hello(G, nv);
      if (hello3) { say(G, nv.who, hello3); if (nv.role === 'weigh' && G.store.noTouch) endVisit(G, 'pass'); else if (nv.role === 'browse' && !nv.pickUid) { bump(G, -0.01, 'nothing on the floor'); endVisit(G, 'pass'); } }
      else if (nv.role === 'bulk') {
        const n = Math.min(G.bulk, 8); if (n) { G.bulk -= n; money(G, n, 'bulk', P.name + ' dug ' + n + ' from the bulk bin'); }
        say(G, nv.who, (n ? 'I dug ' + n + ' cards outta your bin! ' : '') + 'Wanna buy my whole shoebox? ' + nv.ask + '₵!');
      } else if (nv.role === 'scalp') {
        const promos = G.stock.filter(c => c.v && c.v.promo && !c.know.fake).length;
        say(G, nv.who, 'I\'ll take ALL your sealed packs. Every one. ' + (PACK_RETAIL + 3) + '₵ each, cash, right now.' + (promos ? ' And any promos you\'re sitting on.' : '') + (G.policy.limit2 ? ' ...Wait, "Limit 2"? Ugh. Fine, two.' : ''));
      } else if (BAD_LINES[nv.who] && nv.cards.length) {
        say(G, nv.who, BAD_LINES[nv.who].replace('{n}', nv.cards.length + ' cards').replace('{p}', nv.ask + '₵').replace('{card}', G.pump ? tmpl(G.pump.t).name : 'this card'));
      } else if (nv.role === 'sell' || nv.role === 'lot') say(G, nv.who, line(G, nv, 'hello') + ' ' + (nv.role === 'lot' ? 'The whole binder page' : nv.cards.length > 1 ? 'These ' + nv.cards.length : 'This one') + ' for ' + nv.ask + '₵.');
      else if (nv.role === 'sealed') say(G, nv.who, 'Any sealed packs? I want ' + nv.packs + '!' + (G.policy.limit2 && nv.packs > 2 ? ' Oh, limit 2? Okay, 2 then.' : ''));
      else say(G, nv.who, line(G, nv, 'buyHello'));
      if (nv.role === 'sealed' && G.policy.limit2) nv.packs = Math.min(nv.packs, 2);
      return ok();
    }
    case 'inspect': {
      if (['visit', 'shop', 'close', 'night'].indexOf(G.phase) < 0) return err('not now');
      const c = visitCard(G, it.uid) || findStock(G, it.uid) || nightCard(G, it.uid); if (!c) return err('no card');
      const atCounter = G.phase === 'visit' && v && v.cards.indexOf(c) >= 0;
      if (it.tool === 'translate') {
        if (readable(G, c)) return err('already readable');
        if (G.cash < TRANSLATE_FEE) return err('not enough cash');
        money(G, -TRANSLATE_FEE, 'fee', 'Translator'); c.know.read = true; return ok();
      }
      const key = { loupe: 'loupe', uv: 'uv', read: 'read' }[it.tool]; if (!key) return err('bad tool');
      if (key === 'read' && readable(G, c)) return err('already readable');
      // the Spectrometer lets you re-scan a card you lamped before you owned it
      const rescan = key === 'uv' && c.know.uv && G.up.spec && !c.know.spec;
      if (c.know[key] && !rescan && !(key === 'loupe' && G.up.lens && !c.know.print)) return ok();
      c.know[key] = true;
      if (key === 'loupe' && G.up.lens) { c.know.print = true; if (c.v && c.v.err) G.stats.misprints++; }
      if (key === 'loupe' && c.v && (c.v.fin !== 'std' || c.v.first || c.v.serial || c.v.promo || c.v.signed)) G.stats.variants++;
      if (key === 'read') { const g = tmpl(c.t).game; G.fluency[g]++; if (G.fluency[g] === FLUENT_AT) event(G, { t: 'fluent', game: g }); }
      if (key === 'uv') {
        c.know.spec = G.up.spec;
        if (c.fake && (c.fake !== 'ring' || G.up.spec) && !c.know.fake) { c.know.fake = true; G.stats.fakesCaught++; event(G, { t: 'fakeFound', uid: c.uid }); }
      }
      if (atCounter) { if (G.up.hands && !c.know.free) c.know.free = true; else costPatience(G, 1); }
      return ok();
    }
    case 'flaw': {
      if (G.phase !== 'visit' || !v || !(v.role === 'sell' || v.role === 'lot' || v.role === 'bulk')) return err('not now');
      const c = visitCard(G, it.uid); if (!c || !c.know.loupe || c.flawUsed) return err('no flaw to point at');
      if (Math.min(c.cen, c.edg, c.sur) > 6 && !c.know.fake) return err('it looks clean');
      c.flawUsed = true;
      const cut = c.know.fake ? 0.35 : SPECIES[v.species].flaw;
      v.ask = Math.max(1, Math.round(v.ask * (1 - cut))); v.floor = Math.max(1, Math.round(v.floor * (1 - cut))); if (v.floor >= v.ask) v.floor = Math.max(1, v.ask - 1);
      say(G, v.who, (c.know.fake ? 'Wh-what? That one\'s... not mine! ' : line(G, v, 'flaw')) + ' ' + v.ask + '₵.');
      return ok();
    }
    case 'show': {
      if (G.phase !== 'visit' || !v || ['buy', 'flip', 'switch', 'distract', 'sealedc'].indexOf(v.role) < 0) return err('not now');
      const c = G.store ? findThing(G, it.uid) : findStock(G, it.uid); if (!c) return err('nothing to show');
      if (G.store) {
        const fc = FIX[c.loc] ? FIX[c.loc].fetch : 0;
        if (fc) { G.store.stats.fetches++;
          if (v.role === 'distract' && !v.foiled) { const got = steal(G, G.store.locked || !onGrid(G, 'case').length ? 'rack' : 'case'); event(G, { t: 'distracted', got: !!got }); say(G, v.who, '*when you come back, their friend is gone* Hm. Not quite what I wanted. Bye!'); endVisit(G, 'pass'); return ok({ distracted: true }); }
          if (!costPatience(G, fc)) return ok(); }
        if (!c.t) { if (v.role !== 'sealedc' || c.type !== v.wantsGood.type || c.game !== v.wantsGood.game) { say(G, v.who, 'Not what I\'m holding for.'); costPatience(G, 1); return ok(); }
          v.showing = c.uid; startHaggleBuyer(G, v, goodValue(G, c) * PEOPLE[v.who].ceilMul); v.rounds = 0; say(G, v.who, 'Sealed and clean. I\'d pay ' + v.bid + '₵.'); return ok(); }
        if (v.role === 'sealedc') { say(G, v.who, 'I only buy sealed.'); costPatience(G, 1); return ok(); }
        if (v.role === 'distract') { say(G, v.who, 'Hm. Not quite what I wanted. *glances at the door*'); endVisit(G, 'pass'); return ok(); }
      }
      if (!matches(G, v.wants, c)) { say(G, v.who, 'Hmm, that\'s not what I\'m after.'); costPatience(G, 1); return ok(); }
      if (G.store) wearRoll(G, c, WEAR_SHOW);
      if (v.role === 'switch') return switchCard(G, c);
      v.showing = c.uid; startHaggleBuyer(G, v, buyerValue(G, v, c)); v.rounds = 0;
      say(G, v.who, 'Ooh. I\'d pay ' + v.bid + '₵ for that.');
      return ok();
    }
    case 'showPacks': {
      if (G.phase !== 'visit' || !v || v.role !== 'sealed') return err('not now');
      const have = packTotal(G); if (!have) return err('no packs');
      v.packs = Math.min(v.packs, have);
      const per = PACK_RETAIL * (1 + (G.rep - 50) / 500) * (v.who === 'vrrz' ? 1.05 : 1) * (G.week[G.dayIdx].release ? 1.15 : 1);
      startHaggleBuyer(G, v, per * v.packs * PEOPLE[v.who].ceilMul); v.showing = 'packs';
      say(G, v.who, v.packs + ' packs? I\'ll give ' + v.bid + '₵ for the lot.');
      return ok();
    }
    case 'offer': return offer(G, Math.round(it.price));
    case 'accept': {
      if (G.phase !== 'visit' || !v) return err('not now');
      if (v.role === 'scalp') return dealScalp(G);
      if (v.role === 'weigh') return dealWeigh(G, false);
      if (v.role === 'reseal') return dealReseal(G);
      if (v.role === 'vintage') return v3Act(G, { t: 'buyVintage' });
      if (v.role === 'browse') return dealSell(G, v.bid);
      if (['thief', 'switch', 'distract'].indexOf(v.role) >= 0) return err('they\'re not selling anything');
      if (v.role === 'buy' || v.role === 'flip' || v.role === 'sealed' || v.role === 'sealedc') { if (!v.showing) return err('show something first'); return dealSell(G, v.bid); }
      return dealBuy(G, v.ask);
    }
    case 'pass': {
      if (G.phase !== 'visit' || !v) return err('not now');
      if (v.role === 'thief') { if (v.caught) { say(G, v.who, '*puts it back and leaves fast*'); endVisit(G, 'pass'); return ok(); }
        const got = steal(G, v.hard || G.store.locked || !onGrid(G, 'case').length || R(G) < 0.5 ? 'rack' : 'case'); say(G, v.who, v.hard === 'kid' ? 'Bye! *runs*' : 'Byeee! *suspiciously lumpy coat*'); endVisit(G, 'pass'); return ok({ stolen: !!got }); }
      say(G, v.who, v.role === 'scalp' ? 'Your loss. The strip will pay me double anyway.' : v.role === 'buy' || v.role === 'flip' || v.role === 'sealed' ? 'Oh well, next time!' : 'Your loss!');
      endVisit(G, 'pass'); return ok();
    }
    case 'crack': {
      if (G.phase !== 'shop') return err('only between customers');
      const from = G.packs[it.game] ? G.packs : G.store && G.store.backPacks[it.game] ? G.store.backPacks : null;
      if (!from) return err('no packs of that game');
      const have = G.packs[it.game] + (G.store ? G.store.backPacks[it.game] : 0);
      const dead = G.store && G.store.dead[it.game] > 0 && R(G) < G.store.dead[it.game] / have;
      from[it.game]--; G.stats.cracked++; if (dead) G.store.dead[it.game]--;
      const pulled = crackPack(G, it.game, dead);
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
      // v3: the box is an order; it arrives in tomorrow morning's crate
      if (G.store) { const r = order(G, 'box', it.game, 1); if (!r.ok) return r; } else { money(G, -BOX.cost, 'restock', 'Booster box: ' + GAMES[it.game].name); G.packs[it.game] += BOX.packs; }
      // box topper: restock tomorrow's hottest game and the distributor sometimes adds a promo
      const next = G.week[G.dayIdx + 1]; let topper = null;
      if (next) { const hottest = Object.keys(next.demand).sort((a, b) => next.demand[b] - next.demand[a])[0];
        if (hottest === it.game && R(G) < 0.35) { topper = makeCard(G, it.game, R(G) < 0.25 ? 'h' : 'r', 9, { fresh: true, promo: 'topper', src: 'plain' }); topper.know.uv = true; addStock(G, topper); event(G, { t: 'promo', uid: topper.uid, from: 'topper' }); } }
      return ok({ topper });
    }
    case 'upgrade': {
      if (G.phase !== 'close') return err('buy upgrades at close');
      const U = UPGRADES[it.k]; if (!U) return err('no such upgrade');
      if (G.up[it.k]) return err('already have it');
      if (G.cash < U.cost) return err('not enough cash');
      money(G, -U.cost, 'upgrade', 'Loupe upgrade: ' + U.name); G.up[it.k] = true; return ok();
    }
    case 'policy': {
      if (G.phase !== 'close') return err('set policy at close');
      G.policy.limit2 = !!it.limit2; return ok();
    }
    case 'endDay': {
      if (G.phase !== 'close') return err('not now');
      if (G.store) nightly(G);
      const rent = G.week[G.dayIdx].rent, paid = Math.min(rent, Math.max(0, G.cash));
      money(G, -paid, 'rent', 'Dock rent'); if (paid < rent) { G.tab += rent - paid; event(G, { t: 'tab', amt: rent - paid }); }
      if (G.tab && G.cash > 60) { const pay = Math.min(G.tab, G.cash - 60); G.tab -= pay; money(G, -pay, 'rent', 'Paid down the tab'); }
      G.days.push(summaryOfDay(G));
      if (G.dayIdx >= G.week.length - 1) { finale(G); return ok(); }
      G.phase = 'night'; G.events = [];
      let flyers = NIGHT_FLYERS[0].slice();
      if (G.dayIdx > 0) { const pool = NIGHT_POOL.filter(k => k !== G.lastNight); const a = pick(G, pool); flyers = [a, pick(G, pool.filter(k => k !== a))]; }
      G.night = { flyers, pick: null, done: false };
      say(G, 'vee', 'After hours! Two flyers on the board tonight: ' + G.night.flyers.map(k => NIGHTS[k].name).join(' or ') + '.');
      return ok();
    }
    case 'pickNight': return pickNight(G, it.ev);
    case 'cardNight': return nightCardNight(G, it.game, it.n);
    case 'tourney': return nightTourney(G, it.game, it.prize);
    case 'bid': return nightBid(G);
    case 'drop': return nightDrop(G);
    case 'dig': return nightDig(G, it.i);
    case 'swap': return nightSwap(G, it.i, !!it.accept);
    case 'nextMorning': {
      if (G.phase !== 'night') return err('not now');
      if (G.night && G.night.pick === 'dig' && G.night.dig) { const left = G.night.dig.cards.filter(c => !c.flipped).length; G.bulk += left; }
      if (G.night && G.night.pick === 'auction' && G.night.auc && !G.night.done) G.night.done = true;
      startDay(G); return ok();
    }
  }
  return err('unknown action ' + it.t);
}
function ok(x) { return Object.assign({ ok: true }, x || {}); }
function err(m) { return { ok: false, error: m }; }

// A dead pack (searched by the Scale Gang, or resealed) has had its hit taken: the rare slot is a common.
function crackPack(G, game, dead) {
  const out = [], U = uni(G), pk = U.makePack(currentSet(G, game), G); if (dead) pk.dead = true;
  for (const d of U.openPack(pk, G)) out.push(makeCard(G, game, null, 9.0, { fresh: true, src: 'pack', id: d.id, p: d.p }));
  for (const c of out) { c.know.uv = true; addStock(G, c); }
  return out;
}

function offer(G, p) {
  const v = G.visit; if (G.phase !== 'visit' || !v) return err('not now');
  if (!(p > 0)) return err('bad price');
  if (v.role === 'scalp') return err('Skrimp doesn\'t haggle: take it or leave it');
  if (v.role === 'vintage') return v3Act(G, { t: 'buyVintage', price: p });
  const S = SPECIES[v.species];
  v.rounds++;
  if (v.role === 'sell' || v.role === 'lot' || v.role === 'bulk') {
    if (p >= v.ask) return dealBuy(G, v.ask);
    if (G.cash < p) return err('not enough cash');
    if (p < v.floor * S.insultAt) { v.insulted = true; say(G, v.who, line(G, v, 'insult')); costPatience(G, S.insultCost); return ok(); }
    let conc = S.conc; if (S.roundBonus && p % 10 === 0) conc += S.roundBonus;
    v.ask = Math.max(v.floor, Math.round(v.ask - (v.ask - p) * conc));
    if (p >= v.ask * 0.97 || p >= v.ask - 1) return dealBuy(G, p);
    say(G, v.who, (S.roundBonus && p % 10 === 0 && LINES[v.species].round.length ? line(G, v, 'round') + ' ' : '') + line(G, v, 'counter', v.ask));
    costPatience(G, 1); return ok();
  }
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
  let belief = 0; for (const c of v.cards) belief += Math.max(1, baseOf(c) * RAW(trueGrade(c)));
  for (const c of v.cards) { c.cost = price * Math.max(1, baseOf(c) * RAW(trueGrade(c))) / belief; addStock(G, c); }
  G.stats.deals++; G.rep = clamp(G.rep + 1, 0, 100);
  say(G, v.who, line(G, v, 'deal')); endVisit(G, 'deal'); return ok();
}
function dealSell(G, price) {
  const v = G.visit;
  if (v.showing === 'packs') {
    const n = takePacks(G, v.packs);
    money(G, price, 'sell', 'Sold ' + n + ' sealed packs to ' + PEOPLE[v.who].name);
    releasePromos(G, n);
  } else {
    const c = G.store ? findThing(G, v.showing) : findStock(G, v.showing);
    if (!c) { endVisit(G, 'pass'); return err('it\'s gone'); }
    const catchChance = c.fake === 'ring' ? 0.2 : 0.5;
    if (c.t && c.fake && v.species !== 'zekk' && R(G) < catchChance) { say(G, v.who, 'Wait... this is a FAKE!'); G.rep = clamp(G.rep - 5, 0, 100); bump(G, -0.1, 'tried to sell a fake'); v.insulted = true; c.know.fake = true; endVisit(G, 'walk'); return ok({ caught: true }); }
    if (G.store) { if (v.role === 'browse') { G.store.stats.browseSales += c.t ? 1 : 0; G.store.stats.browseCash += price; } else if (c.t) G.store.stats.counterCardSales++; }
    sellThing(G, c, price, PEOPLE[v.who].name);
    if (G.store && c.tag && price >= c.tag * 0.95) bump(G, 0.01, 'fair price');
  }
  G.stats.deals++; G.rep = clamp(G.rep + 1, 0, 100);
  say(G, v.who, line(G, v, 'deal')); endVisit(G, 'deal'); return ok();
}
// Skrimp takes your packs (or 2, with the Limit 2 sign) and any promos at a flat price. Easy cash now, costs later:
// rep, and tomorrow's pack buyers already bought from him.
function dealScalp(G) {
  const v = G.visit, cap = G.policy.limit2 ? 2 : 99;
  const n = takePacks(G, Math.min(packTotal(G), cap));
  const promos = G.policy.limit2 ? [] : G.stock.filter(c => c.v && c.v.promo && !c.know.fake && !c.graded);
  let cash = n * (PACK_RETAIL + 3);
  for (const c of promos) { cash += Math.round(trueValue(G, c) * 0.9); G.stock.splice(G.stock.indexOf(c), 1); }
  if (!n && !promos.length) { say(G, v.who, 'Nothing to scalp? Lame.'); endVisit(G, 'pass'); return ok(); }
  money(G, cash, 'sell', 'Skrimp bought ' + n + ' packs' + (promos.length ? ' + ' + promos.length + ' promos' : ''));
  G.scalped += n; G.stats.scalpedPacks += n;
  G.rep = clamp(G.rep - Math.max(0, n - 2) - promos.length, 0, 100);
  releasePromos(G, n);
  say(G, v.who, 'Pleasure. See you on the strip, where these cost double.'); endVisit(G, 'deal'); return ok();
}

function closeShop(G) {
  G.phase = 'close';
  const n = Math.min(G.bulk, 3 + Math.floor(G.rep / 25)); if (n) { G.bulk -= n; money(G, n, 'bulk', 'Bulk bin: ' + n + ' commons sold'); }
  const next = G.week[G.dayIdx + 1];
  let msg = next ? 'Closing time! Tomorrow: ' + next.name + '. ' + Object.keys(next.demand).map(g => GAMES[g].name + ' ×' + next.demand[g]).join(', ') + '.' : 'Last close! Send anything to the graders: tonight is Grade Day and every slab comes home.';
  if (next && next.release && G.pump) msg += ' Wave 3 reprint list is out: ' + tmpl(G.pump.t).name + ' is on it.';
  say(G, 'vee', msg);
}
function summaryOfDay(G) {
  const rows = G.ledger.filter(l => l.day === G.dayIdx); let inc = 0, out = 0; for (const r of rows) r.amt > 0 ? inc += r.amt : out += r.amt;
  return { day: G.dayIdx, income: inc, spent: out, cash: Math.round(G.cash), value: Math.round(shopValue(G)) };
}

// ---------- After Hours ----------
function pickNight(G, ev) {
  if (G.phase !== 'night' || !G.night || G.night.pick) return err('not now');
  if (G.night.flyers.indexOf(ev) < 0) return err('not on tonight\'s board');
  const n = G.night; n.pick = ev; G.lastNight = ev;
  if (ev === 'auction') {
    const g = pick(G, ['shell', 'hive', 'star']), count = 6 + Math.floor(R(G) * 5), roll = R(G);
    const kind = roll < 0.2 ? 'jackpot' : roll < 0.5 ? 'junk' : 'fair';
    const cards = [];
    for (let i = 0; i < count; i++) {
      const rar = kind === 'jackpot' && i === 0 ? (R(G) < 0.4 ? 'g' : 'h') : kind === 'junk' ? (R(G) < 0.85 ? 'c' : 'u') : rollRarity(G, false);
      cards.push(makeCard(G, i % 3 === 0 ? g : pick(G, ['shell', 'hive', 'star']), rar, 7.2, { src: 'old' }));
    }
    let worth = 0; for (const c of cards) worth += trueValue(G, c, 1);
    const clues = [GAMES[g].name + ' cargo off a ' + SPECIES[GAMES[g].species].name + ' hauler', count + ' cards by weight', kind === 'jackpot' ? 'gold seal on the label' : kind === 'junk' ? 'label says "assorted"' : 'label says "collection"'];
    n.auc = { cards, worth: Math.round(worth), clues, price: 15, high: null, rivals: [{ name: 'Sheelo', cap: Math.round(worth * (0.55 + R(G) * 0.45)) }, { name: 'Klik', cap: Math.round(worth * (0.45 + R(G) * 0.5)) }], log: [] };
    say(G, 'vee', 'Dock Auction! Bidding opens at 15₵. Read the clues, and don\'t get into a bidding war you can\'t win.');
  } else if (ev === 'dig') {
    if (G.cash < 10) { n.pick = null; return err('the bulk lot costs 10₵'); }
    money(G, -10, 'buy', 'Bulk Dig lot');
    const cards = [];
    for (let i = 0; i < 16; i++) {
      const gem = i < 3; const g = pick(G, ['shell', 'hive', 'star']);
      const c = makeCard(G, g, gem ? pick(G, ['u', 'r', 'r', 'h']) : (R(G) < 0.85 ? 'c' : 'u'), 6.8, { src: 'old' });
      if (gem && R(G) < 0.6) { c.v.fin = 'mirror'; if (UNI.card(c.t).printings.indexOf('rev') >= 0) c.p = 'rev'; }
      const foil = c.v.fin !== 'std';
      c.hint = { glint: foil ? R(G) < 0.75 : R(G) < 0.15, game: g };
      c.flipped = false; cards.push(c);
    }
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(R(G) * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    n.dig = { cards, flips: 6 };
    say(G, 'vee', 'Bulk Dig! Six flips. A glint on the back usually means foil. Usually.');
  } else if (ev === 'swap') {
    const who = ['pearla', 'klik', 'mimbo'], swaps = [];
    for (const w of who) {
      const P = PEOPLE[w], game = SPECIES[P.species].game;
      const theirs = makeCard(G, game, pick(G, ['u', 'r', 'r', 'h']), 7.4, { src: 'old', read: true });
      // they want one of your cards they like: the one they value most, if you have any
      const mine = G.stock.filter(c => !c.know.fake && !c.graded).sort((a, b) => trueValue(G, b) - trueValue(G, a));
      const want = mine.length ? mine[Math.min(mine.length - 1, Math.floor(R(G) * 3))] : null;
      swaps.push({ who: w, theirs, want: want ? want.uid : null, done: null });
    }
    n.swaps = swaps;
    say(G, 'vee', 'Swap Meet! Three trades on the table. Loupe is free tonight: nobody\'s in a hurry.');
  } else if (ev === 'cardnight') say(G, 'vee', 'CARD NIGHT! Pick a game to feature and rip packs live on Floss\'s stream.');
  else if (ev === 'tourney') say(G, 'vee', 'Tournament Night! Pick a game and a prize card. Better prize, bigger crowd.');
  return ok();
}
function nightCardNight(G, g, nIn) {
  const N = G.night; if (G.phase !== 'night' || !N || N.pick !== 'cardnight' || N.done) return err('not now');
  if (!GAMES[g]) return err('pick a game');
  const n = Math.min(nIn | 0, G.packs[g] || 0, 6); let holo = 0, grail = 0; const pulls = [];
  for (let i = 0; i < n; i++) { G.packs[g]--; G.stats.cracked++; const p = crackPack(G, g); pulls.push(...p); for (const c of p) { const r = tmpl(c.t).rarity; if (r === 'h') holo++; if (r === 'g') grail++; } }
  const hype = n ? +(0.05 + 0.03 * n + 0.15 * holo + 0.4 * grail).toFixed(2) : 0; G.hype[g] += hype;
  let sold = 0; for (const k of Object.keys(G.packs).sort((a, b) => G.packs[b] - G.packs[a])) while (sold < 3 && G.packs[k] > 0) { G.packs[k]--; sold++; }
  if (sold) money(G, sold * PACK_RETAIL, 'sell', 'Card Night crowd bought ' + sold + ' packs');
  const promos = [];
  for (let i = 0; i < 2; i++) { const c = makeCard(G, g, i ? 'r' : 'u', 9, { fresh: true, promo: 'cardnight', src: 'plain' }); c.know.uv = true; addStock(G, c); promos.push(c.uid); }
  G.rep = clamp(G.rep + 6, 0, 100); N.done = true;
  event(G, { t: 'cardNight', game: g, n, holo, grail, hype, sold, uids: pulls.map(c => c.uid), promos });
  say(G, 'vee', n ? 'What a stream! ' + GAMES[g].name + ' hype +' + Math.round(hype * 100) + '% for tomorrow, and 2 Card Night promos for you.' : 'Chill night. The crowd still bought some packs, and you keep 2 promos.');
  return ok();
}
function nightTourney(G, g, prizeUid) {
  const N = G.night; if (G.phase !== 'night' || !N || N.pick !== 'tourney' || N.done) return err('not now');
  if (!GAMES[g]) return err('pick a game');
  const prize = prizeUid ? findStock(G, prizeUid) : null;
  if (prizeUid && !prize) return err('no such prize card');
  const nextD = G.week[G.dayIdx + 1], dem = nextD ? nextD.demand[g] : 1;
  const prizeVal = prize ? (prize.fake ? 0 : trueValue(G, prize, 1)) : 0;
  const entrants = Math.round(4 + G.rep / 20 + dem * 3 + Math.min(6, prizeVal / 12));
  money(G, entrants * 5, 'sell', 'Tournament: ' + entrants + ' entries at 5₵');
  if (prize) { G.stock.splice(G.stock.indexOf(prize), 1); if (prize.fake) { G.rep = clamp(G.rep - 10, 0, 100); } }
  // entrants buy deck fillers of that game from you
  const fillers = G.stock.filter(c => tmpl(c.t).game === g && !c.know.fake && !c.graded && RANK[tmpl(c.t).rarity] <= 2).sort((a, b) => trueValue(G, a) - trueValue(G, b)).slice(0, Math.floor(entrants / 2));
  let sales = 0; for (const c of fillers) { const p = Math.max(1, Math.round(trueValue(G, c) * 1.2)); sales += p; G.stock.splice(G.stock.indexOf(c), 1); }
  if (sales) money(G, sales, 'sell', 'Tournament: players bought ' + fillers.length + ' singles');
  const promos = [];
  for (let i = 0; i < 2; i++) { const c = makeCard(G, g, i ? 'r' : 'u', 9, { fresh: true, promo: 'tourney', src: 'plain' }); c.know.uv = true; addStock(G, c); promos.push(c.uid); }
  G.hype[g] += 0.1; G.rep = clamp(G.rep + 3 + (prizeVal >= 40 ? 3 : 0), 0, 100); N.done = true;
  event(G, { t: 'tourney', game: g, entrants, sales, sold: fillers.length, prize: prize ? prize.t : null, promos, fakePrize: !!(prize && prize.fake) });
  say(G, 'vee', prize && prize.fake ? 'Uh oh. The winner checked the prize under UV. It was a fake. The crowd is NOT happy.' : entrants + ' players showed up! Entry fees, deck sales, and 2 prize promos for the house.');
  return ok();
}
function nightBid(G) {
  const N = G.night, A = N && N.auc; if (G.phase !== 'night' || !A || N.done) return err('not now');
  const step = Math.max(5, Math.round(A.price * 0.1)), p = A.high === 'you' ? A.price : A.price + (A.high ? step : 0);
  if (A.high === 'you') return err('you\'re already the high bidder');
  if (G.cash < p) return err('not enough cash');
  A.price = p; A.high = 'you'; A.log.push('You bid ' + p + '₵');
  const rival = A.rivals.filter(r => r.cap >= p + step).sort((a, b) => b.cap - a.cap)[0];
  if (rival) { A.price = p + step; A.high = rival.name; A.log.push(rival.name + ' bids ' + A.price + '₵'); say(G, 'vee', rival.name + ' raises to ' + A.price + '₵!'); return ok(); }
  // nobody can top you: you win
  money(G, -p, 'buy', 'Dock Auction crate'); for (const c of A.cards) addStock(G, c);
  N.done = true; A.won = true;
  event(G, { t: 'auction', won: true, price: p, worth: A.worth, uids: A.cards.map(c => c.uid) });
  say(G, 'vee', 'SOLD to Stall 7 for ' + p + '₵! Crack it open.');
  return ok();
}
function nightDrop(G) {
  const N = G.night, A = N && N.auc; if (G.phase !== 'night' || !A || N.done) return err('not now');
  N.done = true; A.won = false; event(G, { t: 'auction', won: false, price: A.price, worth: A.worth, winner: A.high || 'nobody' });
  say(G, 'vee', (A.high && A.high !== 'you' ? A.high + ' takes the crate for ' + A.price + '₵.' : 'No sale tonight.') + ' It was worth about ' + A.worth + '₵, for the record.');
  return ok();
}
function nightDig(G, i) {
  const N = G.night, D = N && N.dig; if (G.phase !== 'night' || !D || N.done) return err('not now');
  const c = D.cards[i]; if (!c || c.flipped) return err('pick a face-down card');
  if (D.flips <= 0) return err('no flips left');
  c.flipped = true; D.flips--; addStock(G, c);
  if (D.flips === 0) { N.done = true; say(G, 'vee', 'Out of flips! The rest goes in your bulk bin.'); }
  return ok({ card: c });
}
function nightSwap(G, i, accept) {
  const N = G.night, s = N && N.swaps && N.swaps[i]; if (G.phase !== 'night' || !s || s.done) return err('not now');
  if (!accept) { s.done = 'no'; return ok(); }
  const mine = s.want && findStock(G, s.want); if (!mine) { s.done = 'no'; return err('you don\'t have the card they want anymore'); }
  G.stock.splice(G.stock.indexOf(mine), 1); s.theirs.cost = mine.cost || 0; addStock(G, s.theirs); s.done = 'yes';
  if (N.swaps.every(x => x.done)) N.done = true;
  return ok();
}

function finale(G) {
  G.events = [];
  resolveGrades(G, true);
  G.phase = 'end';
  const v = Math.round(shopValue(G)), gain = v - G.startValue;
  const ranks = G.week.length > 5 ? RANKS10 : [[-1e9, 'Corner Stall'], [150, 'Strip Regular'], [500, 'Lane Favorite'], [1000, 'Dock Legend'], [1800, 'Legend of the Lanes']];
  let rank = ranks[0][1]; for (const [at, name] of ranks) if (gain >= at) rank = name;
  G.final = { value: v, start: G.startValue, gain, rank, tab: G.tab };
  say(G, 'vee', 'GRADE DAY! Every slab is home. Final shop value ' + v + '₵. Rank: ' + rank + '!' + (G.rating ? ' Store rating ' + G.rating.stars.toFixed(1) + '★.' : ''));
}

function load(json) {
  const G = typeof json === 'string' ? JSON.parse(json) : json;
  if (typeof G._s !== 'number') throw new Error('not a Card Trader save');
  if (G.version !== 4) throw new Error('this save is from an older version; start a new run');
  if (!G.week) G.week = DAYS.map((D, i) => Object.assign(JSON.parse(JSON.stringify(D)), { rent: RENT[i] }));
  return G;
}
// ---------- v3: the shop floor and the back (rev 2) ----------
// Stock is physical and part of selling. Everything you own is Available (on the floor: case, rack, counter binders),
// Holding (in the back: shelves, back binders, safe, inbox tray) or Out (at the graders). Case, rack, shelves are shape
// grids: items take cells and can rotate. Buyers wait while you fetch from the back. Browsers walk up with what they
// found on the floor. People who rob you or pass fakes go on a board only if you catch them. Design: design/v3-design.md.
const FIX = {
  case:     { zone: 'floor', grid: true, name: 'Display case', fetch: 0 },
  rack:     { zone: 'floor', grid: true, name: 'Wall rack', fetch: 0 },
  cbinder:  { zone: 'floor', name: 'Counter binder', fetch: 0 },
  tlbinder: { zone: 'floor', name: 'Top-loader binder', fetch: 0 },
  shelf:    { zone: 'back', grid: true, name: 'Back shelves', fetch: 2 },
  bbinder:  { zone: 'back', name: 'Back binders', fetch: 1 },
  safe:     { zone: 'back', name: 'Safe', fetch: 2 },
  inbox:    { zone: 'back', name: 'Inbox tray', fetch: 1 },
};
const START_SIZE = { case: [6, 4], rack: [4, 4], shelf: [8, 4], cbinder: 18, tlbinder: 0, bbinder: 54, safe: 6, inbox: 20 };
// Sealed product and merch. shape = [w, h] cells; packs (fungible per game) take 1 cell each on the rack or shelves.
const GOODS = {
  blister:   { name: '3-pack blister', shape: [1, 2], packs: 3, msrp: 80, cost: 60, nightly: 0.25, where: ['rack', 'shelf'] },
  tin:       { name: 'Collector tin', shape: [2, 2], packs: 4, promo: 1, msrp: 120, cost: 85, nightly: 0.15, where: ['rack', 'shelf', 'case'] },
  collector: { name: 'Collector box', shape: [2, 2], packs: 3, promo: 1, msrp: 110, cost: 80, nightly: 0.2, where: ['rack', 'shelf', 'case'] },
  box:       { name: 'Booster box', shape: [2, 3], packs: 6, msrp: 168, cost: 120, where: ['shelf', 'case'] },
  premium:   { name: 'Premium box', shape: [3, 2], packs: 10, promo: 2, msrp: 320, cost: 230, where: ['shelf', 'case'] },
  vpack:     { name: 'Vintage pack', shape: [1, 1], vintage: true, where: ['case', 'shelf'] },
  vbox:      { name: 'Vintage booster box', shape: [2, 3], vintage: true, where: ['case', 'shelf'] },
  repack:    { name: 'Repack', shape: [1, 1], where: ['rack', 'shelf'] },
  brick:     { name: 'Bulk brick (500)', shape: [1, 2], where: ['shelf'] },
  poster:    { name: 'Poster set', shape: [1, 2], msrp: 18, cost: 8, nightly: 0.3, where: ['rack', 'shelf'] },
  playmat:   { name: 'Playmat', shape: [1, 2], msrp: 25, cost: 12, nightly: 0.25, where: ['rack', 'shelf'] },
  deckbox:   { name: 'Deck box', shape: [1, 1], msrp: 7, cost: 3, nightly: 0.4, where: ['rack', 'shelf'] },
};
const GEAR = { penny: { name: 'Penny sleeves', per: 100 }, hard: { name: 'Hard sleeves', per: 25 }, mag: { name: 'Mag cases', per: 5 } };
// The distributor catalog. Goods arrive in the next morning's crate; "now" items are installed on the spot.
const CATALOG = {
  box:       { name: 'Booster box (6 packs)', cost: 120, game: true, goods: 'box' },
  blister:   { name: '3-pack blister', cost: 60, game: true, goods: 'blister' },
  tin:       { name: 'Collector tin (4 packs + promo)', cost: 85, game: true, goods: 'tin' },
  collector: { name: 'Collector box (3 packs + promo)', cost: 80, game: true, goods: 'collector' },
  premium:   { name: 'Premium box (10 packs + 2 promos)', cost: 230, game: true, goods: 'premium' },
  poster:    { name: 'Poster set', cost: 8, goods: 'poster' },
  playmat:   { name: 'Playmat', cost: 12, goods: 'playmat' },
  deckbox:   { name: 'Deck box', cost: 3, goods: 'deckbox' },
  penny:     { name: 'Penny sleeves ×100', cost: 4, gear: 'penny' },
  hard:      { name: 'Hard sleeves ×25', cost: 6, gear: 'hard' },
  mag:       { name: 'Mag cases ×5', cost: 10, gear: 'mag' },
};
// Shop upgrades (cash, at close). Each installs at once.
const UNLOCKS = {
  binder:   { name: 'Back binder', cost: 15, does: '54 more back pockets.', repeat: true },
  cbinder:  { name: 'Counter binder pages', cost: 20, does: '18 more pockets in the counter binder.', repeat: true },
  shelves:  { name: 'Shelf extension', cost: 60, does: 'The back shelves get 4 columns wider.' },
  lock:     { name: 'Case lock', cost: 30, does: 'Lock the display case: no overnight theft from it, and Sticky can\'t reach it.' },
  tlbinder: { name: 'Top-loader binder', cost: 25, does: '8 pockets on the counter for high-end raw cards in hard sleeves. Hard to steal.' },
  bigcase:  { name: 'Bigger case', cost: 90, does: 'The display case gets 3 columns wider.' },
  case2:    { name: 'Second case', cost: 120, does: 'Two more rows of display case.' },
  vault:    { name: 'Vintage vault', cost: 70, does: 'The safe holds 12.' },
  camera:   { name: 'Security camera', cost: 60, does: 'You see every tell a customer shows, not just the obvious ones.' },
  scale:    { name: 'Pack scale', cost: 40, does: 'Weigh vintage packs: heavy ones are more likely to hold a hit.' },
  riser:    { name: 'Display riser', cost: 35, does: 'Vintage sealed on show in the case raises your store rating every day.' },
  sorter:   { name: 'Bulk sorter', cost: 80, does: 'Build repacks from bulk, with a posted hit sign.' },
  dropbox:  { name: 'Grading drop-box', cost: 50, does: 'Send cards to the graders in the morning too.' },
};
const WEAR_DAY = 0.12, WEAR_BINDER = 0.06, WEAR_SHOW = 0.03, TRIM_VALUE = 0.3, DEAD_PACK = 12, RESEAL_PRICE = 20, BULK_CAP = 300;
const BOUNTY = { thief: 12, schemer: 18 };

// Tells. Thieves roll 3 (you see 2 without a camera); honest customers sometimes show one too, so act on two.
const TELLS = ['keeps checking the door', 'won\'t look at the case they say they want', 'answers before you finish asking',
  'wears a heavy coat on a warm dock day', 'pays with a suspiciously big bill', 'asks for something that doesn\'t fit their story',
  'asks what time you close', 'came in with a "friend" who drifts to the case', 'tested the case latch', 'filming the counter on their phone'];
const SCHEMER_TELLS = ['story changes when you ask where it\'s from', 'gets pushy the moment the lamp comes out', 'has several "perfect" copies of the same card'];
const VICTIM_TELLS = ['looks genuinely shocked', 'shows you a receipt from a strip stall', 'story holds up when you ask twice'];

// The 10-day run. Days 1-5 are the v2 week; days 6-10 open the vintage market and bring offenders back.
const DAYS2 = [
  { name: 'Estate Season', ships: ['mollu'], demand: { shell: 1.2, hive: 1.0, star: 1.0 } },
  { name: 'Swarm Return', ships: ['zekk'], demand: { shell: 1.0, hive: 1.3, star: 0.9 } },
  { name: 'Collector\'s Fair', ships: ['puffi', 'mollu'], demand: { shell: 1.1, hive: 1.0, star: 1.3 } },
  { name: 'Wave 4 Release Day', ships: ['mollu', 'zekk', 'puffi'], demand: { shell: 1.2, hive: 1.2, star: 1.2 }, release: true },
  { name: 'Last Call', ships: ['mollu', 'zekk', 'puffi'], demand: { shell: 1.1, hive: 1.1, star: 1.1 } },
];
const RENT10 = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
const RANKS10 = [[-1e9, 'Corner Stall'], [300, 'Strip Regular'], [900, 'Lane Favorite'], [1800, 'Dock Legend'], [3200, 'Legend of the Lanes']];
// Signature visitors by day index (0-based). Day 1 stays the tutorial: one browser, one fetch, one fake to note.
const V3_SPECIALS = {
  0: [{ who: 'pip', role: 'sell', n: 1, games: ['star'], q: 7, gem: 'r', fakes: 1, intent: 'victim', read: true }, { who: 'nova', role: 'browse' }],
  1: [{ who: 'gang', role: 'weigh' }, { who: 'nova', role: 'browse' }, { who: 'vault', role: 'buy', wants: { min: 'r', far: true } }],
  2: [{ who: 'sticky', role: 'thief' }, { who: 'snip', role: 'sell', n: 2, games: ['star', 'hive'], q: 7, gem: 'h', src: 'trim', intent: 'schemer' }, { who: 'dash', role: 'distract', wants: { min: 'u', far: true } }, { who: 'kiri', role: 'browse' }],
  3: [{ who: 'flick', role: 'switch', wants: { min: 'r' } }, { who: 'gloss', role: 'reseal' }, { who: 'rook', role: 'thief', hard: 'drifter' }, { who: 'nova', role: 'browse' }],
  4: [{ who: 'sticky', role: 'thief' }, { who: 'gang', role: 'weigh' }, { who: 'tad', role: 'thief', hard: 'kid' }, { who: 'kiri', role: 'browse' }, { who: 'hoard', role: 'sealedc' }],
  5: [{ who: 'estate', role: 'vintage' }, { who: 'moma', role: 'sell', n: 2, games: ['shell'], q: 7, gem: 'h', fakes: 1, intent: 'victim', read: true }, { who: 'nova', role: 'browse' }, { who: 'dash', role: 'distract', wants: { min: 'u', far: true }, back: true }],
  6: [{ who: 'quill', role: 'sell', n: 2, games: ['star', 'shell'], q: 8.2, gem: 'h', fakes: 2, src: 'ring', intent: 'schemer', back: true }, { who: 'sticky', role: 'thief', back: true }, { who: 'kiri', role: 'browse' }, { who: 'hoard', role: 'sealedc' }],
  7: [{ who: 'estate', role: 'vintage' }, { who: 'flick', role: 'switch', wants: { min: 'r' }, back: true }, { who: 'tad', role: 'thief', hard: 'kid' }, { who: 'nova', role: 'browse' }, { who: 'vault', role: 'buy', wants: { min: 'h', far: true } }],
  8: [{ who: 'skrimp', role: 'scalp' }, { who: 'gloss', role: 'reseal', back: true }, { who: 'rook', role: 'thief', hard: 'drifter' }, { who: 'kiri', role: 'browse' }, { who: 'hoard', role: 'sealedc' }],
  9: [{ who: 'estate', role: 'vintage' }, { who: 'dash', role: 'distract', wants: { min: 'u', far: true }, back: true }, { who: 'gang', role: 'weigh', back: true }, { who: 'nova', role: 'browse' }, { who: 'vault', role: 'buy', wants: { min: 'h', far: true } }],
};
Object.assign(PEOPLE, {
  gang:   { name: 'The Scale Gang', species: 'zekk', askMul: 1, floorMul: 1, ceilMul: 1, line: 'three Zekk who "just want to feel the packs"', bad: true, sig: 'all three wear matching ankle chains' },
  sticky: { name: 'Sticky', species: 'puffi', askMul: 1, floorMul: 1, ceilMul: 1, line: 'a very fluffy browser with very deep fluff', bad: true, sig: 'hums the same three notes over and over' },
  snip:   { name: 'Snip', species: 'mollu', askMul: 1.1, floorMul: 0.85, ceilMul: 1, line: 'every card is "a perfect 10"', bad: true, sig: 'tiny scissors on a keychain' },
  flick:  { name: 'Flick', species: 'zekk', askMul: 1, floorMul: 1, ceilMul: 1.05, line: 'four hands, and one of them is always busy', bad: true, sig: 'one antenna bent at the tip' },
  gloss:  { name: 'Gloss', species: 'mollu', askMul: 1, floorMul: 1, ceilMul: 1, line: '"factory sealed" packs, cheap', bad: true, sig: 'smells faintly of glue' },
  dash:   { name: 'Dash', species: 'zekk', askMul: 1, floorMul: 1, ceilMul: 1, line: 'very interested in what you keep in the back', bad: true, sig: 'a chipped front mandible' },
  rook:   { name: 'Rook', species: 'mollu', askMul: 1, floorMul: 1, ceilMul: 1, line: 'a drifter who knows cards are money', bad: true, sig: 'a shell patched with dock tape' },
  tad:    { name: 'Tad', species: 'puffi', askMul: 1, floorMul: 1, ceilMul: 1, line: 'a kid with big eyes and bigger pockets', bad: true, sig: 'a sticker-covered backpack' },
  pip:    { name: 'Pip', species: 'puffi', askMul: 1.0, floorMul: 0.7, ceilMul: 1, line: 'a kid selling a "rare promo" from a strip stall' },
  moma:   { name: 'Moma', species: 'mollu', askMul: 1.0, floorMul: 0.7, ceilMul: 1, line: 'a parent selling their kid\'s old cards' },
  nova:   { name: 'Nova', species: 'puffi', askMul: 1, floorMul: 1, ceilMul: 1.0, line: 'browses the case and the binders' },
  kiri:   { name: 'Kiri', species: 'zekk', askMul: 1, floorMul: 1, ceilMul: 0.95, line: 'flips through every binder page' },
  vault:  { name: 'Vault', species: 'mollu', askMul: 1, floorMul: 1, ceilMul: 1.15, line: 'a serious collector: "what do you have in the back?"' },
  hoard:  { name: 'Hoard', species: 'zekk', askMul: 1, floorMul: 1, ceilMul: 1.05, line: 'buys sealed product to hold' },
  estate: { name: 'The Estate', species: 'mollu', askMul: 1, floorMul: 0.85, ceilMul: 1, line: 'a lawyer clearing a collector\'s estate' },
});
Object.assign(BAD_LINES, { snip: 'Every one of these is a perfect 10. Look at those edges! Razor sharp. {n} for {p}.' });

// ---------- store state ----------
function initStore(G) {
  G.store = { size: JSON.parse(JSON.stringify(START_SIZE)), up: {}, locked: false, noTouch: false,
    gear: { penny: 60, hard: 10, mag: 0 }, sleeve: { penny: 5, hard: 25, mag: 150 },
    backPacks: { shell: 0, hive: 0, star: 0 }, dead: { shell: 0, hive: 0, star: 0 }, orders: [], crate: null, gearWarned: false,
    repack: { sold: 0, hits: 0, every: 0, min: 0, warned: false },
    stats: { browseSales: 0, browseCash: 0, counterCardSales: 0, stolen: 0, stolenValue: 0, wearHits: 0, wearValue: 0, switched: 0,
      trimsCaught: 0, merchSales: 0, deadPacks: 0, fetches: 0, bounties: 0, wrongCalls: 0, informed: 0, refused: 0, repacksSold: 0 } };
  G.goods = []; G.board = []; G.notes = []; G.seen = {};
  G.rating = { stars: null, n: 0, sum: 0, today: 0, why: [], reviews: [] };
  for (const c of G.stock) { c.loc = 'cbinder'; c.prot = c.prot || 'penny'; c.tag = defaultTag(G, c); }
}
const where = (G, loc) => G.stock.filter(c => c.loc === loc);
const goodsAt = (G, loc) => G.goods.filter(o => o.loc === loc);
const isFloor = loc => !!FIX[loc] && FIX[loc].zone === 'floor';
function sizeOf(G, f) { return G.store.size[f]; }
function pocketsFree(G, f) { return sizeOf(G, f) - where(G, f).length; }
function backPackTotal(G) { const b = G.store.backPacks; return b.shell + b.hive + b.star; }
function shapeOf(o) { const s = o.t ? (o.graded ? [1, 2] : [1, 1]) : GOODS[o.type].shape; return o.rot ? [s[1], s[0]] : s; }
function onGrid(G, f) { return where(G, f).concat(goodsAt(G, f)); }
function gridUsed(G, f) { let n = f === 'rack' ? packTotal(G) : f === 'shelf' ? backPackTotal(G) : 0; for (const o of onGrid(G, f)) { const s = shapeOf(o); n += s[0] * s[1]; } return n; }
function gridFree(G, f) { const [w, h] = sizeOf(G, f); return w * h - gridUsed(G, f); }
// Does o fit on grid f at (x, y) with rotation rot? Loose packs fill the gaps, so they only need enough free cells overall.
function gridFits(G, f, o, x, y, rot) {
  const [w, h] = sizeOf(G, f), s0 = o.t ? (o.graded ? [1, 2] : [1, 1]) : GOODS[o.type].shape, s = rot ? [s0[1], s0[0]] : s0;
  if (x < 0 || y < 0 || x + s[0] > w || y + s[1] > h) return false;
  for (const p of onGrid(G, f)) { if (p === o) continue; const ps = shapeOf(p); if (x < p.x + ps[0] && p.x < x + s[0] && y < p.y + ps[1] && p.y < y + s[1]) return false; }
  const mine = o.loc === f ? shapeOf(o)[0] * shapeOf(o)[1] : 0;
  return gridFree(G, f) + mine - s[0] * s[1] >= 0;
}
function gridSpot(G, f, o) { const [w, h] = sizeOf(G, f); for (const rot of [0, 1]) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (gridFits(G, f, o, x, y, rot)) return [x, y, rot]; return null; }
function defaultTag(G, c) { return Math.max(1, Math.round((c.t ? estimate(G, c).value : goodValue(G, c)) * 1.15)); }
function findGood(G, uid) { return G.goods.find(o => o.uid === uid); }
function findThing(G, uid) { return findStock(G, uid) || findGood(G, uid); }
function newGood(G, type, game, extra) { const o = Object.assign({ uid: 'g' + (++G._uid), type, game: game || null, set: game && GTYPE[type] ? currentSet(G, game) : null, loc: null, x: 0, y: 0, rot: 0 }, extra || {}); return o; }

// Can thing o go to fixture f? Returns an error string or null.
function placeRule(G, o, f) {
  if (!FIX[f]) return 'nowhere to put it';
  if (o.t) {
    if (f === 'rack') return 'singles don\'t hang on the rack';
    if (f === 'case' && !o.graded && o.prot !== 'hard' && o.prot !== 'mag') return 'raw cards need a hard sleeve or mag case in the case';
    if (f === 'cbinder' && (o.graded || !o.prot || o.prot === 'none')) return o.graded ? 'slabs don\'t fit binder pockets' : 'counter binder cards need at least a penny sleeve';
    if (f === 'tlbinder' && (o.graded || o.prot !== 'hard')) return 'the top-loader binder takes hard-sleeved raw cards';
    if ((f === 'bbinder') && o.graded) return 'slabs don\'t fit binder pockets';
    if (f === 'shelf' && !o.graded) return 'raw cards go in binders, not on shelves';
    return null;
  }
  if (GOODS[o.type].where.indexOf(f) < 0) return GOODS[o.type].name + ' can\'t go there';
  return null;
}
function place(G, uid, f, x, y, rot) {
  const o = findThing(G, uid); if (!o) return err('nothing to move');
  const bad = placeRule(G, o, f); if (bad) return err(bad);
  if (FIX[f].grid) {
    const spot = x == null ? gridSpot(G, f, o) : gridFits(G, f, o, x, y, rot ? 1 : 0) ? [x, y, rot ? 1 : 0] : null;
    if (!spot) return err('no room there in the ' + FIX[f].name.toLowerCase());
    o.loc = f; o.x = spot[0]; o.y = spot[1]; o.rot = spot[2];
  } else {
    if (o.loc !== f && pocketsFree(G, f) <= 0) return err('the ' + FIX[f].name.toLowerCase() + ' is full');
    o.loc = f;
  }
  if (isFloor(f) && !o.tag) o.tag = defaultTag(G, o);
  return ok();
}
// Move loose packs between the rack and the shelves.
function movePacks(G, game, n, to) {
  const S = G.store, from = to === 'rack' ? S.backPacks : G.packs, into = to === 'rack' ? G.packs : S.backPacks;
  const k = Math.min(n, from[game], gridFree(G, to === 'rack' ? 'rack' : 'shelf'));
  if (k <= 0) return err(from[game] ? 'no room' : 'no packs there');
  from[game] -= k; into[game] += k; return ok({ n: k });
}

// ---------- sleeving and wear (rev 1) ----------
function protect(G, c) {
  if (c.graded || c.fake && c.know.fake || c.prot === 'mag') return;
  const S = G.store, g = S.gear, v = estimate(G, c).value;
  const want = v >= S.sleeve.mag ? 'mag' : v >= S.sleeve.hard ? 'hard' : v >= S.sleeve.penny ? 'penny' : 'none';
  c.prot = c.prot || 'none';
  if (want === 'mag' && g.mag > 0) { g.mag--; c.prot = 'mag'; return; }
  if ((want === 'mag' || want === 'hard') && c.prot !== 'hard' && g.hard > 0 && (c.prot === 'penny' || g.penny > 0)) { if (c.prot !== 'penny') g.penny--; g.hard--; c.prot = 'hard'; return; }
  if (want !== 'none' && c.prot === 'none' && g.penny > 0) { g.penny--; c.prot = 'penny'; return; }
  if (want !== 'none' && c.prot === 'none' && !S.gearWarned) { S.gearWarned = true; event(G, { t: 'gearOut' }); }
}
function wearRoll(G, c, chance) {
  if (c.graded || c.prot === 'mag' || R(G) >= chance) return false;
  const attr = R(G) < 0.5 ? 'sur' : 'edg';
  if (attr === 'sur' && (c.prot === 'penny' || c.prot === 'hard')) return false;
  if (attr === 'edg' && c.prot === 'hard') return false;
  if (c[attr] <= 1) return false;
  const before = trueValue(G, c, 1); c[attr]--; G.store.stats.wearHits++; G.store.stats.wearValue += before - trueValue(G, c, 1); return true;
}
// New stock lands in the inbox tray, then the back binders if the tray is full.
function arrive(G, c) {
  c.loc = pocketsFree(G, 'inbox') > 0 ? 'inbox' : c.graded ? (pocketsFree(G, 'safe') > 0 ? 'safe' : 'inbox') : pocketsFree(G, 'bbinder') > 0 ? 'bbinder' : 'inbox';
  protect(G, c);
}
// File the inbox: slabs and grails to the safe, sleeved mid cards to the counter binder, the rest to back binders.
function autoStore(G) {
  for (const c of where(G, 'inbox').sort((a, b) => estimate(G, b).value - estimate(G, a).value)) {
    const v = estimate(G, c).value;
    if (c.know.fake) { G.stock.splice(G.stock.indexOf(c), 1); G.bulk = Math.min(BULK_CAP, G.bulk + 1); continue; }
    if ((v >= 100 || c.graded) && pocketsFree(G, 'safe') > 0) c.loc = 'safe';
    else if (c.graded) continue;
    else if (v >= 6 && v < 60 && c.prot && c.prot !== 'none' && pocketsFree(G, 'cbinder') > 0) { c.loc = 'cbinder'; c.tag = defaultTag(G, c); }
    else if (pocketsFree(G, 'bbinder') > 0) c.loc = 'bbinder';
  }
}

// ---------- modern sets and reprints ----------
// Each game has 5 modern sets (3 out at the start, 2 released during the run). Per game, one gets reprinted (its prices
// drop when announced), one is never reprinted (it climbs, and its distributor allocation dries up), the rest drift.
// Nobody tells you which: hints come from DJ Vee, the distributor and prices. The flags live in the universe.
function currentSet(G, game) { const d = runDay(G); const l = uni(G).sets.filter(x => x.game === (game || 'shell') && x.era === 'modern' && x.release <= d).sort((x, y) => y.release - x.release); return l.length ? l[0].id : null; }
function setName(G, id) { const x = id && uni(G).set(id); return x ? x.name : ''; }
function setMult(G, id, kind) { const x = id && uni(G).set(id); return x ? uni(G).trend(x, runDay(G), kind === 'sealed' ? 2 : kind === 'chase' ? 1 : 0) : 1; }
function allocated(G, id) { return !!id && uni(G).allocation(id, runDay(G)) < 0.35; }
const GTYPE = { box: 'booster', blister: 'blister', tin: 'tin', collector: 'collector', premium: 'premium' };

// ---------- value of sealed goods ----------
// Vintage sealed: rare and expensive (5-30x a modern box). Heavy vintage packs are likelier to hold the hit; weighing
// needs the pack scale. A sealed grade (same graders) proves it was never opened.
function goodValue(G, o, liquid) {
  const D = GOODS[o.type];
  if (o.type === 'brick') return 500 * 0.6;
  if (o.type === 'repack') return Math.max(1, (o.per || 10) * 0.4 + (o.hit ? (o.hitVal || 20) : 0));
  if (D.vintage) {
    let v = (o.set ? uni(G).sealedPrice(o.set, o.vtype || (o.type === 'vpack' ? 'pack' : 'booster'), runDay(G), null, { weight: o.weighed ? (o.heavy ? 'heavy' : 'light') : null }) : o.val) * (o.sgrade ? SEALED_GRADE(o.sgrade) : 1);
    if (o.resealed && (o.sgrade || o.caught)) v *= 0.15;
    return v;
  }
  const mkt = o.set && GTYPE[o.type] ? uni(G).sealedPrice(o.set, GTYPE[o.type], runDay(G), { demand: G.demand }) : D.msrp;
  return mkt * (liquid ? D.cost / D.msrp : 1) * (o.dead ? 0.5 : 1) * (o.sgrade ? SEALED_GRADE(o.sgrade) : 1);
}
const SEALED_GRADE = g => g >= 10 ? 2.4 : g >= 9 ? 1.7 : g >= 8 ? 1.3 : 1.05;

// ---------- the store rating ----------
// A fictional star rating with a review count. Each day nudges it; the morning report quotes a few reviews.
function bump(G, d, why) { if (!G.rating) return; G.rating.today += d; if (why && Math.abs(d) >= 0.02) G.rating.why.push([+d.toFixed(2), why]); }
function ratingMod(G) { const R_ = G.rating; return R_ && R_.stars != null ? (R_.stars - 4) * Math.min(1, R_.n / 12) : 0; }
const REVIEW = {
  up: ['Fair prices, and they actually know their stuff.', 'Saw a vintage box on display. Unreal.', 'Pulled a hit from their repack!', 'They told my kid the card was fake and helped us out. Class act.', 'Case is always stocked.'],
  down: ['Sold me a fake. Never again.', 'Repacks are a scam.', 'Half the case was empty.', 'Accused my friend of stealing. Rude.', 'Overpriced and pushy.'],
};
function closeRating(G) {
  const R_ = G.rating; let d = R_.today;
  const caseN = where(G, 'case').length + goodsAt(G, 'case').length;
  if (caseN >= 6 && packTotal(G) + goodsAt(G, 'rack').length >= 6) d += 0.03; else if (caseN === 0) d -= 0.05;
  if (G.store.up.riser) d += Math.min(2, goodsAt(G, 'case').filter(o => GOODS[o.type].vintage).length) * 0.04;
  d = clamp(d, -0.4, 0.3);
  // today's customers leave a few reviews; how the day went sets where they land
  const k = 2 + Math.floor(R(G) * 3) + (R_.n ? 0 : 1);
  for (let i = 0; i < k; i++) R_.sum += clamp(Math.round(3.7 + d * 9 + gauss(G) * 0.8), 1, 5);
  R_.n += k; R_.stars = +(R_.sum / R_.n).toFixed(2);
  R_.reviews = [];
  if (d > 0.02) R_.reviews.push(pick(G, REVIEW.up)); if (d < -0.02) R_.reviews.push(pick(G, REVIEW.down));
  R_.last = +d.toFixed(2); R_.today = 0; R_.why = [];
}

// ---------- browsers, sealed collectors, vintage, the board ----------
// A browser picks something from the floor whose tag looks fair against what it seems worth, and brings it up.
function browsePick(G) {
  const thr = 0.87 - 0.08 * ratingMod(G), pool = [];
  const cheap = where(G, 'cbinder').filter(c => estimate(G, c).value < 4).length / Math.max(1, where(G, 'cbinder').length);
  for (const f of ['case', 'cbinder', 'tlbinder']) for (const c of where(G, f)) {
    if (c.know.fake) continue;
    const fair = lookValue(G, c) * (c.prot === 'mag' ? 1.1 : 1) * (f === 'tlbinder' ? 0.92 : 1) / Math.max(1, c.tag || defaultTag(G, c));
    if (fair >= thr) pool.push([c, fair * (f === 'cbinder' ? 1 - cheap * 0.6 : f === 'case' ? 1.3 : 1)]);
  }
  for (const f of ['case', 'rack']) for (const o of goodsAt(G, f)) {
    if (GOODS[o.type].vintage) continue;   // vintage on display is a draw, not an impulse buy
    const fair = goodValue(G, o) / Math.max(1, o.tag || defaultTag(G, o));
    if (fair >= thr) pool.push([o, fair * (o.type === 'repack' ? repackAppeal(G) : 0.6)]);
  }
  if (!pool.length) return null;
  let tot = 0; for (const [, w] of pool) tot += w; let r = R(G) * tot;
  for (const [o, w] of pool) { r -= w; if (r <= 0) return o; }
  return pool[0][0];
}
function repackAppeal(G) { const s = G.store.repack; if (!s.sold) return 1; const rate = s.hits / s.sold, promised = 1 / Math.max(1, s.every); return clamp(0.4 + rate / promised * 0.8, 0.2, 1.6); }
function sellThing(G, o, price, who) {
  if (o.t) {
    G.stock.splice(G.stock.indexOf(o), 1);
    money(G, price, 'sell', 'Sold ' + (readable(G, o) ? tmpl(o.t).name : 'a card') + ' to ' + who);
    if (o.fake || o.trim && !o.graded) { G.complaints.push({ who, price }); if (o.fake) G.stats.fakesSold++; }
    const flip = price - (o.cost || 0); if (!G.stats.bestFlip || flip > G.stats.bestFlip.flip) G.stats.bestFlip = { flip: Math.round(flip), t: o.t, price };
  } else {
    G.goods.splice(G.goods.indexOf(o), 1);
    money(G, price, 'sell', 'Sold ' + GOODS[o.type].name + (o.game ? ' (' + GAMES[o.game].name + ')' : '') + ' to ' + who);
    if (o.type === 'repack') { const s = G.store.repack; s.sold++; G.store.stats.repacksSold++; if (o.hit) { s.hits++; bump(G, 0.03, 'repack hit'); event(G, { t: 'repackHit' }); }
      if (s.sold >= s.every * 2 && s.hits / s.sold < 0.6 / Math.max(1, s.every) && !s.warned) { s.warned = true; bump(G, -0.15, 'repacks below their sign'); event(G, { t: 'repackScam' }); } }
    if (o.resealed && !o.caught) G.complaints.push({ who, price });
  }
}
// Vintage sealed for sale from an estate: 1-3 a run. Rare and expensive.
function vintageLot(G) {
  const U = uni(G), S = G.store; S.drops = S.drops || 0;
  let dr = U.drops[S.drops]; if (dr) S.drops++;
  else { const vs = U.sets.filter(x => x.era === 'vintage'); dr = { set: pick(G, vs).id, type: 'pack' }; }
  const set = U.set(dr.set), o = newGood(G, dr.type === 'pack' ? 'vpack' : 'vbox', set.game, { era: 'vintage', set: dr.set, vtype: dr.type });
  o.resealed = R(G) < 0.12;
  if (o.type === 'vpack') { o.pack = U.makePack(dr.set, G); o.heavy = U.weigh(o.pack).tier === 'heavy'; }
  return o;
}
function boardHas(G, who) { return G.board.find(b => b.who === who); }
function addBoard(G, who, kind, crime) {
  const P = PEOPLE[who]; let b = boardHas(G, who);
  if (!b) { b = { who, name: P.name, kind, crimes: [], sig: P.sig || null, day: G.dayIdx }; G.board.push(b); }
  b.crimes.push(crime); event(G, { t: 'board', who });
}
function rollTells(G, v, guilty) {
  const n = guilty ? 3 : R(G) < 0.12 ? 1 : 0, pool = TELLS.slice(), out = [];
  for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(R(G) * pool.length), 1)[0]);
  v.tells = out; v.tellsShown = G.store.up.camera ? out.length : Math.min(out.length, guilty ? 2 : 1);
}

// ---------- the opening: a brand-new shop ----------
// Three questions decide your start: focus (singles, sealed or vintage), how you split your savings (cash or stock),
// and the game you grew up on (you can read its script from day 1). Everything arrives in an opening crate.
const FOCUS = { singles: 'Singles shop', sealed: 'Sealed shop', vintage: 'Vintage hunter' };
const SPLIT = { cash: { cash: 300, stock: 80 }, balanced: { cash: 210, stock: 180 }, stock: { cash: 130, stock: 270 } };
function setupShop(G, ans) {
  const focus = FOCUS[ans.focus] ? ans.focus : 'singles', split = SPLIT[ans.split] || SPLIT.balanced, home = GAMES[ans.home] ? ans.home : 'shell';
  const U = uni(G), S = G.store, items = [], games = ['shell', 'hive', 'star'], other = games.filter(g => g !== home);
  G.shop = { focus, split: SPLIT[ans.split] ? ans.split : 'balanced', home, name: ans.name || null };
  G.cash = split.cash; G.fluency[home] = FLUENT_AT;
  let budget = split.stock, n = 0;
  const addCard = (g, rar, src, extra) => { const c = makeCard(G, g, rar, 7.6, Object.assign({ src, read: g === home }, extra || {})); c.know.uv = true; c.cost = Math.round(trueValue(G, c, 1)); budget -= c.cost; n++; items.push({ item: 'card', card: c }); };
  const addGood = (type, g) => { const o = newGood(G, type, g); budget -= goodValue(G, o, true); items.push({ item: 'good', good: o }); };
  // every shop gets 5 loose packs, 3 of them from the game you grew up on
  items.push({ item: 'packs', game: home, n: 3 }, { item: 'packs', game: other[0], n: 1 }, { item: 'packs', game: other[1], n: 1 });
  if (focus === 'sealed') { for (const [t, g] of [['blister', home], ['box', home], ['tin', other[0]], ['blister', other[1]]]) if (budget >= CATALOG[t === 'box' ? 'box' : t].cost * 0.8) addGood(t, g); }
  if (focus === 'vintage') { addCard(home, 'r', 'old', { era: 'vintage' }); addCard(pick(G, other), 'u', 'old', { era: 'vintage' }); } // vintage sealed is far beyond a new shop: estates sell it later in the run
  const src = focus === 'vintage' ? 'old' : 'binder';
  if (budget > 60) addCard(home, 'h', src, { mint: true });
  for (let guard = 0; (budget > 3 || n < 9) && n < 30 && guard < 80; guard++) addCard(pick(G, [home, home, other[0], other[1]]), budget > 80 ? pick(G, ['r', 'h']) : budget > 25 ? pick(G, ['u', 'r', 'r']) : budget > 3 ? pick(G, ['c', 'u', 'u']) : 'c', src);
  if (budget > 0) G.cash += Math.round(budget); // whatever the crate didn't use stays in the till
  S.crate = { items, opening: true };
  G.startValue = Math.round(shopValue(G));
  event(G, { t: 'opening' });
}
// What has to be true before the doors open. Day 1: the floor must be set out. Later days: open the morning crate.
function openChecklist(G) {
  const S = G.store, out = [];
  if (S.crate && S.crateOpened !== G.dayIdx) out.push({ k: 'crate', label: 'Unpack the crate in the back', done: false });
  else if (S.crate) out.push({ k: 'crate', label: 'Unpack the crate in the back', done: true });
  if (G.dayIdx === 0) {
    out.push({ k: 'case', label: 'Put 3+ things in the display case', done: onGrid(G, 'case').length >= 3, n: onGrid(G, 'case').length });
    out.push({ k: 'cbinder', label: 'Fill 4+ counter binder pockets', done: where(G, 'cbinder').length >= 4, n: where(G, 'cbinder').length });
    out.push({ k: 'rack', label: 'Hang 3+ packs or sealed on the rack', done: packTotal(G) + goodsAt(G, 'rack').length >= 3, n: packTotal(G) + goodsAt(G, 'rack').length });
  }
  return out;
}

// ---------- nightly ----------
function steal(G, what) {
  const S = G.store;
  if (what === 'case') {
    const items = onGrid(G, 'case').filter(o => !(o.t && o.graded) || R(G) < 0.5); if (!items.length) return null;
    const o = pick(G, items), val = o.t ? trueValue(G, o, 1) : goodValue(G, o);
    if (o.t) G.stock.splice(G.stock.indexOf(o), 1); else G.goods.splice(G.goods.indexOf(o), 1);
    S.stats.stolen++; S.stats.stolenValue += val; bump(G, -0.02, 'theft'); event(G, { t: 'theft', from: 'case', card: o.t || null, good: o.type || null }); return o;
  }
  const games = ['shell', 'hive', 'star'].filter(g => G.packs[g] > 0);
  if (games.length) { const g = pick(G, games); G.packs[g]--; S.dead[g] = Math.min(S.dead[g], G.packs[g]); S.stats.stolen++; S.stats.stolenValue += PACK_RETAIL; event(G, { t: 'theft', from: 'rack', game: g }); return g; }
  const rackGoods = goodsAt(G, 'rack'); if (rackGoods.length) { const o = pick(G, rackGoods); G.goods.splice(G.goods.indexOf(o), 1); S.stats.stolen++; S.stats.stolenValue += goodValue(G, o); event(G, { t: 'theft', from: 'rack', good: o.type }); return o; }
  return null;
}
function nightly(G) {
  const S = G.store;
  for (const c of where(G, 'case').concat(where(G, 'inbox'))) wearRoll(G, c, WEAR_DAY);
  for (const c of where(G, 'bbinder').concat(where(G, 'cbinder'))) wearRoll(G, c, WEAR_BINDER);
  if (G.dayIdx >= 2 && !S.locked && onGrid(G, 'case').length && R(G) < 0.6) steal(G, 'case');
  // walk-ins buy merch and small sealed off the rack overnight
  for (const o of goodsAt(G, 'rack').slice()) { const D = GOODS[o.type]; if (D.nightly && R(G) < D.nightly * (1 + ratingMod(G) * 0.3)) { sellThing(G, o, o.tag || defaultTag(G, o), 'a walk-in'); S.stats.merchSales++; } }
  closeRating(G);
  S.gearWarned = false;
}
// ---------- ordering, crates, opening sealed ----------
function order(G, item, game, qty) {
  const C = CATALOG[item]; if (!C) return err('not in the catalog');
  if (C.game && !GAMES[game]) return err('pick a card game');
  const set = C.game ? currentSet(G, game) : null;
  if (C.goods && C.game && allocated(G, set)) return err('the distributor says ' + setName(G, set) + ' is on allocation: none to spare');
  const n = Math.max(1, qty | 0), cost = C.cost * n;
  if (G.cash < cost) return err('not enough cash');
  money(G, -cost, item === 'box' ? 'restock' : 'order', (n > 1 ? n + ' × ' : '') + C.name + (C.game ? ': ' + GAMES[game].name : ''));
  for (let i = 0; i < n; i++) G.store.orders.push({ item, game: C.game ? game : null, set });
  return ok();
}
function unlock(G, k) {
  const U = UNLOCKS[k]; if (!U) return err('no such upgrade');
  if (G.store.up[k] && !U.repeat) return err('you already have that');
  if (G.cash < U.cost) return err('not enough cash');
  money(G, -U.cost, 'upgrade', 'Shop upgrade: ' + U.name);
  const z = G.store.size; G.store.up[k] = (G.store.up[k] || 0) + 1;
  if (k === 'binder') z.bbinder += 54; else if (k === 'cbinder') z.cbinder += 18; else if (k === 'shelves') z.shelf[0] += 4;
  else if (k === 'tlbinder') z.tlbinder = 8; else if (k === 'bigcase') z.case[0] += 3; else if (k === 'case2') z.case[1] += 2; else if (k === 'vault') z.safe = 12;
  else if (k === 'lock') G.store.locked = true;
  return ok();
}
function deliver(G) { const S = G.store; if (S.orders.length) { S.crate = { items: (S.crate ? S.crate.items : []).concat(S.orders) }; S.orders = []; event(G, { t: 'crate', n: S.crate.items.length }); } }
// Unpack: gear to the drawer, everything else onto the shelves (or the rack for merch) wherever it fits.
function unpack(G) {
  const S = G.store; if (!S.crate) return err('no crate to unpack');
  const left = []; let placed = 0;
  for (const it of S.crate.items) {
    const C = CATALOG[it.item];
    if (C && C.gear) { S.gear[C.gear] += GEAR[C.gear].per; placed++; continue; }
    if (it.card) { arrive(G, it.card); G.stock.push(it.card); placed++; continue; }
    if (it.item === 'packs') { const f = gridFree(G, 'shelf') >= it.n ? 'shelf' : gridFree(G, 'rack') >= it.n ? 'rack' : null; if (f) { (f === 'rack' ? G.packs : S.backPacks)[it.game] += it.n; placed++; } else left.push(it); continue; }
    const o = it.good || newGood(G, C.goods, it.game, { set: it.set });
    const tries = GOODS[o.type].where.indexOf('shelf') >= 0 ? ['shelf', 'rack'] : GOODS[o.type].where;
    let done = false; for (const f of tries) { const sp = gridSpot(G, f, o); if (sp) { G.goods.push(o); o.loc = f; [o.x, o.y, o.rot] = sp; if (isFloor(f)) o.tag = defaultTag(G, o); done = true; break; } }
    if (done) placed++; else left.push(Object.assign({}, it, { good: o }));
  }
  S.crate = left.length ? { items: left } : null; S.crateOpened = G.dayIdx;
  return ok({ placed, left: left.length });
}
// Crack sealed product open: its packs go loose where it stood (rack or shelves), promos go to the inbox.
function openGood(G, uid) {
  const o = findGood(G, uid); if (!o) return err('nothing to open');
  const D = GOODS[o.type]; if (!D.packs) return err('that doesn\'t open into packs');
  const f = o.loc === 'rack' ? 'rack' : 'shelf', store = f === 'rack' ? G.packs : G.store.backPacks;
  const s = shapeOf(o), room = gridFree(G, f) + s[0] * s[1];
  if (room < D.packs) return err('not enough room for ' + D.packs + ' loose packs there');
  G.goods.splice(G.goods.indexOf(o), 1); store[o.game] += D.packs; if (o.dead) G.store.dead[o.game] += D.packs;
  const promos = [];
  const got = o.set && GTYPE[o.type] ? uni(G).openSealed(o.set, GTYPE[o.type], G) : { promos: [] };
  for (const d of (got.promos || []).slice(0, Math.max(1, D.promo || 0))) { const c = makeCard(G, o.game, null, 9, { fresh: true, id: d.id, p: d.p }); c.know.uv = true; addStock(G, c); promos.push(c); }
  return ok({ packs: D.packs, promos });
}
// Open a vintage pack: heavy packs are likelier to hold the hit.
function openVintage(G, uid) {
  const o = findGood(G, uid); if (!o || o.type !== 'vpack') return err('not a vintage pack');
  G.goods.splice(G.goods.indexOf(o), 1); const out = [];
  out.length = 0; const U = uni(G), pk = Object.assign({}, o.pack || U.makePack(o.set, G), { dead: !!o.resealed });
  for (const d of U.openPack(pk, G)) out.push(makeCard(G, o.game, null, 8.4, { src: 'old', id: d.id, p: d.p }));
  const hit = out.some(c => U.isHit(U.card(c.t), c.p));
  for (const c of out) { c.know.uv = true; addStock(G, c); }
  G.stats.cracked++;
  return ok({ pulled: out, hit });
}
// Build repacks from bulk (bulk sorter). sign: "1 in every packs has a hit worth min+". seed: how many hits you
// actually put in (honest = n / every). Hits come from your cheapest cards worth min or more.
function makeRepacks(G, n, per, every, min, seed, price) {
  if (!G.store.up.sorter) return err('needs the bulk sorter');
  n = Math.max(1, n | 0); per = Math.max(5, per | 0); every = Math.max(1, every | 0);
  if (G.bulk < n * per) return err('not enough bulk: ' + n * per + ' needed');
  const hits = G.stock.filter(c => !c.graded && !c.know.fake && c.loc !== 'case' && estimate(G, c).value >= min).sort((a, b) => estimate(G, a).value - estimate(G, b).value);
  const k = Math.min(seed == null ? Math.floor(n / every) : seed | 0, hits.length);
  if (gridFree(G, 'rack') + gridFree(G, 'shelf') < n) return err('no room for ' + n + ' repacks');
  G.bulk -= n * per; const made = [];
  const slots = []; for (let i = 0; i < n; i++) slots.push(i < k); for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(R(G) * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  for (let i = 0; i < n; i++) {
    const o = newGood(G, 'repack', null, { per, hit: slots[i], tag: price, sign: { every, min } });
    if (slots[i]) { const c = hits.shift(); o.hitVal = Math.round(trueValue(G, c, 1)); G.stock.splice(G.stock.indexOf(c), 1); }
    const f = gridSpot(G, 'rack', o) ? 'rack' : 'shelf'; const sp = gridSpot(G, f, o); o.loc = f; [o.x, o.y, o.rot] = sp; G.goods.push(o); made.push(o);
  }
  Object.assign(G.store.repack, { every, min });
  return ok({ made: made.length, seeded: k });
}

// ---------- counter: the new visitors ----------
function v3Spawn(G, v, spec) {
  if (spec.intent) v.intent = spec.intent;
  if (spec.hard) v.hard = spec.hard;
  if (spec.back) { v.back = true; v.disguised = true; }
  const guilty = PEOPLE[v.who].bad && ['thief', 'distract', 'switch', 'weigh', 'reseal'].indexOf(v.role) >= 0;
  rollTells(G, v, guilty);
  if (spec.who && PEOPLE[spec.who].sig && (guilty || v.intent === 'schemer')) v.sig = PEOPLE[spec.who].sig;
  if (v.role === 'reseal') { v.packs = 3; v.packGame = pick(G, ['shell', 'hive', 'star']); v.resealed = R(G) < 0.8; }
  if (spec.src === 'trim') for (const c of v.cards) { c.trim = true; c.edg = 10; c.cen = Math.max(c.cen, 9); c.sur = Math.max(c.sur, 9); }
  if (v.role === 'browse') { const o = browsePick(G); v.pickUid = o ? o.uid : null; if (o) { const tag = o.tag || defaultTag(G, o); v.showing = o.uid; v.ceil = Math.round(tag * (lookOf(G, o) >= tag ? 1 : 0.96)); v.bid = Math.max(1, Math.round(tag * (0.8 + R(G) * 0.12))); } }
  if (v.role === 'sealedc') { const types = ['box', 'premium', 'tin', 'collector', 'blister']; v.wantsGood = { type: pick(G, types), game: pick(G, ['shell', 'hive', 'star']) }; }
  if (v.role === 'vintage') { v.lot = vintageLot(G); const val = goodValue(G, v.lot); v.ask = Math.round(val * (0.7 + R(G) * 0.2)); v.floor = Math.round(val * 0.55); }
  if (v.role === 'sell' && v.intent === 'victim' && v.cards.length) v.ask = Math.max(3, Math.round(v.ask * 0.8));
}
function lookOf(G, o) { return o.t ? lookValue(G, o) : goodValue(G, o); }
function v3Hello(G, nv) {
  const S = G.store, P = PEOPLE[nv.who], disg = nv.disguised ? '*a stranger in a hat* ' : '';
  if (nv.role === 'weigh') return S.noTouch ? 'A "no touching" sign? Lame. We\'re out.' : disg + 'Yo. We\'ll take 3 packs. But we pick. We like to... feel them first.';
  if (nv.role === 'thief') return nv.hard === 'kid' ? 'Hi! I\'m just looking! *very close to the pack rack*' : nv.hard === 'drifter' ? 'Just warming up, friend. Nice shop. *eyes the rack*' : disg + 'Oh, just browsing! Don\'t mind me. *drifts toward the ' + (S.locked || !onGrid(G, 'case').length ? 'rack' : 'display case') + '*';
  if (nv.role === 'switch') return disg + 'Got ' + wantsText(nv.wants) + '? Can I see it? Up close? In my hands?';
  if (nv.role === 'reseal') return disg + nv.packs + ' ' + GAMES[nv.packGame].name + ' packs, factory sealed, ' + RESEAL_PRICE + '₵ each. Way under retail. Don\'t ask.';
  if (nv.role === 'distract') return disg + 'Hey! You got ' + wantsText(nv.wants) + '? Not the stuff out here. The good stuff. In the back.';
  if (nv.role === 'browse') { if (!nv.pickUid) return 'Just looking... nothing grabbing me today.'; const o = findThing(G, nv.pickUid); return 'Found this ' + (o.t ? (FIX[o.loc] ? 'in your ' + FIX[o.loc].name.toLowerCase() : '') : 'on your ' + (o.loc === 'rack' ? 'rack' : 'case')) + '. Tag says ' + (o.tag || defaultTag(G, o)) + '₵. Would you do ' + nv.bid + '₵?'; }
  if (nv.role === 'sealedc') return 'Looking for a sealed ' + GOODS[nv.wantsGood.type].name.toLowerCase() + ', ' + GAMES[nv.wantsGood.game].name + '. Holding them long term.';
  if (nv.role === 'vintage') return 'I\'m clearing an estate. One item you might like: a ' + GOODS[nv.lot.type].name.toLowerCase() + ' of ' + GAMES[nv.lot.game].name + ', still sealed. ' + nv.ask + '₵.';
  if (nv.role === 'buy' && nv.wants && nv.wants.far) return 'I\'m after ' + wantsText(nv.wants) + '. Check the back too, I\'ll wait.';
  return null;
}
function dealWeigh(G, behind) {
  const v = G.visit, S = G.store;
  if (S.noTouch) { endVisit(G, 'pass'); return ok(); }
  const n = takePacks(G, Math.min(behind ? 2 : 3, packTotal(G)));
  if (!n) { say(G, v.who, 'No packs? Pfft.'); endVisit(G, 'pass'); return ok(); }
  money(G, n * PACK_RETAIL, 'sell', PEOPLE[v.who].name + ' bought ' + n + ' packs' + (behind ? ' (from behind the counter)' : ''));
  if (!behind) { for (const g of ['shell', 'hive', 'star']) { const add = Math.min(G.packs[g] - S.dead[g], 2); if (add > 0) { S.dead[g] += add; S.stats.deadPacks += add; } } event(G, { t: 'searched' }); }
  say(G, v.who, behind ? 'Tch. Fine. You pick, I guess.' : 'Nice and heavy. Pleasure!'); endVisit(G, 'deal'); return ok();
}
function dealReseal(G) {
  const v = G.visit, S = G.store, price = v.packs * RESEAL_PRICE;
  if (G.cash < price) return err('not enough cash');
  const f = gridFree(G, 'rack') >= v.packs ? 'rack' : gridFree(G, 'shelf') >= v.packs ? 'shelf' : null;
  if (!f) return err('no room for ' + v.packs + ' packs');
  money(G, -price, 'buy', 'Bought ' + v.packs + ' "sealed" packs from ' + PEOPLE[v.who].name);
  (f === 'rack' ? G.packs : S.backPacks)[v.packGame] += v.packs; if (v.resealed) { S.dead[v.packGame] += v.packs; S.stats.deadPacks += v.packs; }
  say(G, v.who, 'Pleasure. No refunds.'); endVisit(G, 'deal'); return ok();
}
// The Switcher: unwatched, a raw card in a penny sleeve (or none) comes back as a fake. Shop-stamped hard sleeves,
// mag cases and slabs can't be swapped.
function switchCard(G, c) {
  const v = G.visit;
  if (v.watched || c.graded || c.prot === 'hard' || c.prot === 'mag') { say(G, v.who, 'Hm. Nah, not for me. *hands it back, all four hands visible*'); endVisit(G, 'pass'); return ok(); }
  c.fake = 'uv'; c.know.uv = false; c.know.spec = false; c.prot = 'none'; G.store.stats.switched++;
  event(G, { t: 'switched', uid: c.uid });
  say(G, v.who, 'Eh, changed my mind. Here you go! *hands back a card in a fresh sleeve*'); endVisit(G, 'pass'); return ok();
}
// Calling security: right = bounty and a board entry; wrong = rep and rating hit. Kids are a hard choice.
function callSecurity(G) {
  const v = G.visit; if (!v) return err('not now');
  const P = PEOPLE[v.who];
  const provenSchemer = v.intent === 'schemer' && v.cards.some(c => c.know.fake || c.trim && c.know.loupe);
  const caught = v.caught;
  if (caught && v.hard === 'kid') { G.rep = clamp(G.rep - 4, 0, 100); bump(G, -0.15, 'security on a kid'); say(G, v.who, '*bursts into tears* I\'m sorry! I\'m SORRY!'); event(G, { t: 'security', ok: true, kid: true }); endVisit(G, 'walk'); return ok({ right: true, kid: true }); }
  if (caught || provenSchemer) {
    const kind = caught ? 'thief' : 'schemer', b = BOUNTY[kind] * (v.hard ? 0.5 : 1);
    money(G, b, 'bounty', 'Dock security bounty: ' + P.name); addBoard(G, v.who, kind, caught ? 'caught stealing' : 'passing fakes');
    G.store.stats.bounties++; bump(G, 0.04, 'caught a crook'); say(G, v.who, caught ? 'Hey! Get OFF me!' : 'You can\'t prove... oh. Oh no.');
    event(G, { t: 'security', ok: true, who: v.who }); endVisit(G, 'pass'); return ok({ right: true });
  }
  const guilty = P.bad && ['thief', 'distract', 'switch', 'weigh', 'reseal'].indexOf(v.role) >= 0;
  G.store.stats.wrongCalls++;
  if (guilty) { G.rep = clamp(G.rep - 2, 0, 100); say(G, v.who, 'Search me! Go on! ...See? Nothing. I\'m leaving.'); event(G, { t: 'security', ok: false, noProof: true }); endVisit(G, 'pass'); return ok({ right: false, noProof: true }); }
  G.rep = clamp(G.rep - (v.intent === 'victim' ? 8 : 6), 0, 100); bump(G, -0.2, 'accused an innocent customer');
  say(G, v.who, v.intent === 'victim' ? 'I didn\'t KNOW it was fake! I paid good money for it!' : 'Excuse me?! I\'m telling everyone about this place.');
  event(G, { t: 'security', ok: false }); endVisit(G, 'walk'); return ok({ right: false });
}
function v3Act(G, it) {
  const v = G.visit, S = G.store, inVisit = G.phase === 'visit' && v;
  switch (it.t) {
    case 'watch': {
      if (!inVisit || ['thief', 'switch', 'distract'].indexOf(v.role) < 0) return err('not now');
      v.watched = true;
      if (v.role === 'thief') { v.caught = true; say(G, v.who, v.hard === 'kid' ? '*a pack falls out of their sleeve* ...uh oh.' : v.hard === 'drifter' ? '*a pack half out of his coat* ...Times are hard, friend.' : '*a pack in the fluff* ...that\'s not mine. Okay it\'s yours.'); return ok({ caught: true }); }
      if (v.role === 'distract') { say(G, v.who, '*glances at their friend, who stops drifting* ...Never mind. Just looking.'); v.foiled = true; return ok(); }
      say(G, v.who, 'Wh- why are you watching my hands like that? ...Fine. Just show me the card.'); return ok();
    }
    case 'security': if (!inVisit) return err('not now'); return callSecurity(G);
    case 'letGo': {
      if (!inVisit || !v.caught) return err('not now');
      if (v.hard === 'drifter' && it.work) { money(G, -12, 'buy', 'Bought Rook\'s bulk finds'); G.bulk = Math.min(BULK_CAP, G.bulk + 40); G.rep = clamp(G.rep + 2, 0, 100); bump(G, 0.03, 'gave someone a chance'); say(G, v.who, 'You... want to buy my finds? I won\'t forget this.'); endVisit(G, 'deal'); return ok(); }
      if (v.hard === 'kid' && it.parent) { G.rep = clamp(G.rep + 3, 0, 100); bump(G, 0.05, 'handled a kid well'); say(G, v.who, '*parent arrives* He\'ll sweep your floor Saturday. Say sorry, Tad. "...sorry."'); endVisit(G, 'pass'); return ok(); }
      say(G, v.who, 'Th-thanks. *puts it back*'); endVisit(G, 'pass'); return ok();
    }
    case 'refuse': {
      if (!inVisit) return err('not now');
      const offender = !!boardHas(G, v.who) && PEOPLE[v.who].bad;
      if (offender) { S.stats.refused++; say(G, v.who, 'Tch. Fine. Your loss.'); event(G, { t: 'refused', who: v.who, right: true }); }
      else { G.rep = clamp(G.rep - 2, 0, 100); bump(G, -0.05, 'turned away a customer'); say(G, v.who, 'Wow. Okay.'); event(G, { t: 'refused', who: v.who, right: false }); }
      endVisit(G, 'pass'); return ok({ right: offender });
    }
    case 'inform': {
      if (!inVisit || !v.cards.some(c => c.know.fake || c.trim && c.know.loupe)) return err('find the fake first');
      if (v.intent === 'victim') { G.rep = clamp(G.rep + 3, 0, 100); bump(G, 0.08, 'helped a fake-seller\'s victim'); S.stats.informed++; if (R(G) < 0.3) G.grateful = (G.grateful || 0) + 1; say(G, v.who, 'Oh no... thank you for telling me. I\'ll go back to that stall. Thank you!'); endVisit(G, 'pass'); return ok({ victim: true }); }
      say(G, v.who, 'Fake? Huh. Must have been... the other guy. *packs up fast*'); endVisit(G, 'pass'); return ok({ victim: false });
    }
    case 'sellBehind': if (!inVisit || v.role !== 'weigh') return err('not now'); return dealWeigh(G, true);
    case 'inspectPacks': {
      if (!inVisit || v.role !== 'reseal') return err('not now');
      if (v.knowSeal) return ok(); v.knowSeal = true; costPatience(G, 1);
      if (G.visit) say(G, v.who, v.resealed ? '*the wrappers shine where the glue is* ...Those creases? Shipping damage. Obviously.' : 'See? Real factory seams. Cheap because I owe someone money.');
      return ok();
    }
    case 'buyVintage': {
      if (!inVisit || v.role !== 'vintage') return err('not now');
      const price = it.price == null ? v.ask : Math.round(it.price);
      if (price < v.floor) { say(G, v.who, 'The estate can\'t go that low.'); costPatience(G, 1); return ok(); }
      if (price < v.ask && R(G) < 0.5) { v.ask = Math.round((v.ask + price) / 2); say(G, v.who, 'Meet me at ' + v.ask + '₵?'); costPatience(G, 1); return ok(); }
      if (G.cash < price) return err('not enough cash');
      const sp = gridSpot(G, 'case', v.lot) ? 'case' : gridSpot(G, 'shelf', v.lot) ? 'shelf' : null; if (!sp) return err('no room for it in the case or on the shelves');
      money(G, -price, 'buy', 'Vintage sealed from the estate'); const o = v.lot, s = gridSpot(G, sp, o); o.loc = sp; [o.x, o.y, o.rot] = s; o.cost = price; G.goods.push(o);
      if (sp === 'case') o.tag = Math.round(goodValue(G, o) * 1.3);
      say(G, v.who, 'It\'s yours. Take care of it.'); endVisit(G, 'deal'); return ok();
    }
    case 'place': return place(G, it.uid, it.to, it.x, it.y, it.rot);
    case 'movePacks': return movePacks(G, it.game, it.n || 1, it.to);
    case 'tag': { const o = findThing(G, it.uid); if (!o) return err('nothing to tag'); o.tag = Math.max(1, Math.round(it.price)); return ok(); }
    case 'retag': { for (const o of onGrid(G, 'case').concat(where(G, 'cbinder'), where(G, 'tlbinder'), goodsAt(G, 'rack'))) if (o.type !== 'repack') o.tag = defaultTag(G, o); return ok(); }
    case 'sleeve': {
      const c = findStock(G, it.uid); if (!c) return err('no card'); if (c.graded) return err('slabs are already protected');
      const p = it.prot, g = S.gear, cur = c.prot || 'none';
      if (p === 'penny') { if (cur !== 'none') return err('already sleeved'); if (!g.penny) return err('out of penny sleeves'); g.penny--; c.prot = 'penny'; return ok(); }
      if (p === 'hard') { if (cur === 'hard' || cur === 'mag') return err('already protected'); if (!g.hard || (cur === 'none' && !g.penny)) return err('out of sleeves'); if (cur === 'none') g.penny--; g.hard--; c.prot = 'hard'; return ok(); }
      if (p === 'mag') { if (cur === 'mag') return err('already in a mag case'); if (!g.mag) return err('out of mag cases'); g.mag--; c.prot = 'mag'; return ok(); }
      return err('bad sleeve');
    }
    case 'lockCase': if (!S.up.lock) return err('buy a case lock at close first'); S.locked = !!it.on; return ok();
    case 'sign': S.noTouch = !!it.noTouch; return ok();
    case 'sleevePolicy': for (const k of ['penny', 'hard', 'mag']) if (it[k] != null) S.sleeve[k] = Math.max(0, +it[k]); return ok();
    case 'autoStore': autoStore(G); return ok();
    case 'applyPolicy': { let n = 0; for (const c of G.stock) if (c.loc !== 'case') { const was = c.prot; protect(G, c); if (c.prot !== was) n++; } return ok({ n }); }
    case 'order': if (G.phase !== 'close') return err('order at close'); return order(G, it.item, it.game, it.qty);
    case 'unlock': if (G.phase !== 'close') return err('buy upgrades at close'); return unlock(G, it.k);
    case 'unpack': if (['morning', 'shop', 'close'].indexOf(G.phase) < 0) return err('not now'); return unpack(G);
    case 'openGood': if (['morning', 'shop', 'close'].indexOf(G.phase) < 0) return err('not now'); return openGood(G, it.uid);
    case 'openVintage': if (['morning', 'shop', 'close'].indexOf(G.phase) < 0) return err('not now'); return openVintage(G, it.uid);
    case 'weigh': { if (!S.up.scale) return err('needs the pack scale'); const o = findGood(G, it.uid); if (!o || o.type !== 'vpack') return err('only vintage packs'); o.weighed = true; return ok({ heavy: o.heavy }); }
    case 'repack': if (['morning', 'shop', 'close'].indexOf(G.phase) < 0) return err('not now'); return makeRepacks(G, it.n, it.per, it.every, it.min, it.seed, it.price);
    case 'gradeSealed': {
      if (G.phase !== 'close' && !(S.up.dropbox && G.phase === 'morning')) return err('send to the graders at close');
      const o = findGood(G, it.uid), co = GRADERS[it.co]; if (!o || !co) return err('bad item or grader');
      if (o.sgrade) return err('already graded'); if (o.type === 'repack' || o.type === 'brick' || !GOODS[o.type].packs && !GOODS[o.type].vintage) return err('graders only take sealed product');
      if (G.cash < co.fee * 2) return err('not enough cash');
      money(G, -co.fee * 2, 'fee', co.name + ' sealed grading'); G.goods.splice(G.goods.indexOf(o), 1);
      G.grading.push({ good: o, co: it.co, due: G.dayIdx + co.days, roll: R(G) }); return ok();
    }
  }
  return null;
}
// What a card looks like it's worth if you can't see that it's fake or trimmed.
function lookValue(G, c) { return c.fake || c.trim ? trueValue(G, Object.assign({}, c, { fake: null, trim: false })) : trueValue(G, c); }

const CT = { newGame, load, act, DAYS, GAMES, SPECIES, PEOPLE, GRADERS, RARITY_NAME, RANK, BASE, BOX, PACK_RETAIL, TRANSLATE_FEE, FLUENT_AT,
  FINISH, SETS, ERRORS, PROMOS, UPGRADES, NIGHTS, NIGHT_FLYERS,
  RENT: RENT10, NIGHT_POOL, FIX, GOODS, GEAR, CATALOG, UNLOCKS, TELLS, WEAR_DAY, WEAR_SHOW, BULK_CAP, uni, setName,
  FOCUS, SPLIT, openChecklist, where, goodsAt, onGrid, gridFits, gridFree, gridSpot, shapeOf, sizeOf, pocketsFree, isFloor, placeRule, findThing, backPackTotal,
  defaultTag, lookValue, goodValue, setMult, currentSet, boardHas, tmpl, trueGrade, centerRatio, estimate, readable, trueValue, shopValue, matches, wantsText, demandOf, variantMult, packTotal };
if (typeof module !== 'undefined' && module.exports) module.exports = CT; else root.CT = CT;
})(this);
