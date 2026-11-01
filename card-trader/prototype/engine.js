// Intergalactic Card Trader · v3 engine. Pure: seeded RNG, no DOM, runs in node (sim.js) and the browser.
// Every player action goes through act(G, intent). The UI and the bots only read G and call act.
// v2 ("the market fights back"): a 5-day week, card variants and promos, After Hours events, scalpers, ring fakes,
// a pump-and-dump, Loupe upgrades and a store policy. Design: design/v2-design.md.
// v3 ("the Back Room"): physical stock, gear and a sleeving policy, wear, a display case, deliveries, five more bad actors.
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
const SETS = { core: 'Wave 2', vintage: 'Wave 1 (vintage)', reprint: 'Wave 3 reprint' };
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
  if (kind === 'sealed') { const who = pick(G, ['vrrz', 'floss']); return { who, role: 'sealed', n: 2 + Math.floor(R(G) * 3) + (day === 4 ? 1 : 0) }; }
  return { who: 'nubb', role: 'bulk', n: 6, games: [pick(G, games), pick(G, games)] };
}
function buildWeek(G) {
  const week = [JSON.parse(JSON.stringify(DAYS[0]))];
  week[0].rent = RENT[0];
  for (let i = 1; i < DAYS.length; i++) {
    const B = DAYS[i], demand = {};
    for (const g in B.demand) demand[g] = clamp(Math.round((B.demand[g] + (R(G) - 0.5) * 0.3) * 20) / 20, 0.7, 1.7);
    let ships = Object.keys(demand).filter(g => demand[g] >= 1.1).map(g => GAMES[g].species);
    if (!ships.length) ships = [GAMES[Object.keys(demand).sort((a, b) => demand[b] - demand[a])[0]].species];
    if (B.release) ships = ['mollu', 'zekk', 'puffi'];
    const specials = (SPECIALS[i] || []).concat(V3_SPECIALS[i] || []);
    const kinds = ['sell', 'lot', 'buy', 'buy', 'sealed'];
    while (kinds.length + specials.length < 8) kinds.push(pick(G, ['sell', 'lot', 'buy', 'flip', 'sealed', 'bulk', 'sell', 'buy']));
    const visitors = kinds.map(k => fillerVisitor(G, k, i));
    for (let k = visitors.length - 1; k > 0; k--) { const j = Math.floor(R(G) * (k + 1)); [visitors[k], visitors[j]] = [visitors[j], visitors[k]]; }
    // signature visitors land somewhere in the middle of the day, never first
    for (const s of specials) visitors.splice(1 + Math.floor(R(G) * (visitors.length - 1)), 0, JSON.parse(JSON.stringify(s)));
    const hot = Object.keys(demand).sort((a, b) => demand[b] - demand[a])[0];
    const shipLine = ships.map(s => SPECIES[s].name).join(' and ') + ' ships on the lanes. ' + GAMES[hot].name + ' is hottest at ×' + demand[hot] + '.';
    const extra = { 2: ' Word on the strip: a scalper called Skrimp is working the shops, and someone is passing perfect-looking promos.',
      1: ' Heads up: a crew called the Scale Gang has been feeling up pack racks on the strip.',
      3: ' And the rumor mill says {pump} is about to spike. Me? I read the docking schedule.',
      4: ' WAVE 3 DROPS TODAY! Release promos every few packs, reprints everywhere ({pump} got reprinted: ouch). Grade Day tonight!' }[i] || '';
    week.push({ name: B.name, ships, demand, rent: RENT[i], pump: !!B.pump, release: !!B.release, visitors, dj: shipLine + extra });
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
  if (src === 'pack' && G.dayIdx === 4 && R(G) < 0.4) v.set = 'reprint';
  return v;
}
function makeCard(G, game, rarity, q, opts) {
  opts = opts || {};
  const at = () => clamp(Math.round(q + gauss(G) * (opts.fresh ? 1.0 : 1.5)), 1, 10);
  const c = { uid: 'c' + (++G._uid), t: tid(game, rollIdx(G, rarity)), cen: at(), edg: at(), sur: at(), fake: null, graded: null,
    know: { loupe: false, uv: false, read: !!opts.read, fake: false, print: false, spec: false, free: false }, cost: 0, flawUsed: false,
    v: rollPrint(G, rarity, opts.src || 'plain') };
  if (opts.idx != null) c.t = tid(game, opts.idx);
  if (opts.fake) {
    c.fake = opts.fake === 'ring' ? 'ring' : (R(G) < 0.5 ? 'uv' : 'stock');
    // fakes copy whatever sells: ring fakes dress up as serialized full-arts and promos
    if (c.fake === 'ring') { if (R(G) < 0.5) { c.v.fin = 'full'; c.v.serial = 1 + Math.floor(R(G) * 12); } else c.v.promo = pick(G, ['cardnight', 'tourney', 'topper']); c.cen = Math.max(c.cen, 8); c.edg = Math.max(c.edg, 8); c.sur = Math.max(c.sur, 8); }
  }
  if (c.v.err === 'offcut') c.cen = Math.min(c.cen, 2 + Math.floor(R(G) * 3)); // a miscut reads exactly like bad centering
  if (opts.promo) c.v.promo = opts.promo;
  if (opts.mint) { c.cen = Math.max(c.cen, 9); c.edg = Math.max(c.edg, 9); c.sur = Math.max(c.sur, 9); }
  return c;
}

// ---------- value ----------
// Pumped card: day 4 the rumor makes it ×1.8; from day 5 on it was reprinted and crashes to ×0.5.
function pumpMult(G, c) { return G.pump && G.pump.t === c.t && !c.fake ? (G.dayIdx === 3 ? 1.8 : G.dayIdx >= 4 ? 0.5 : 1) : 1; }
// The variant multiplier. known = the player's knowledge (estimate) or null for the truth.
function variantMult(G, c, known) {
  const v = c.v || {}, low = RANK[tmpl(c.t).rarity] <= 1, sees = (k) => !known || known[k];
  let m = 1;
  if (v.fin === 'mirror' && sees('loupe')) m *= low ? 2 : 1.4;
  if (v.fin === 'full') m *= 2.5; if (v.fin === 'alt') m *= 2;
  if (v.first && sees('loupe')) m *= 1.6;
  if (v.set === 'vintage' && sees('print')) m *= 1.8;
  if (v.set === 'reprint' && sees('print')) m *= 0.7;
  if (v.serial && sees('loupe')) m *= v.serial === 1 ? 10 : v.serial <= 5 ? 6 : 3;
  if (v.err && sees('print')) m *= 3;
  if (v.signed && sees('loupe')) m *= 2;
  if (v.promo && sees('loupe')) m *= PROMOS[v.promo].mult;
  return Math.min(m, VARIANT_CAP);
}
function demandOf(G, game) { return G.demand[game] || 1; }
function hot(G, c) { return G.hotList.indexOf(c.t) >= 0 ? 1.5 : 1; }
// What the card is really worth to a buyer today (they can see the real condition and print).
function trueValue(G, c, demand) {
  if (c.fake) return 0;
  const tm = tmpl(c.t), d = demand == null ? demandOf(G, tm.game) : demand;
  const m = c.graded ? GRADERS[c.graded.co].mult(c.graded.grade) : RAW(trueGrade(c));
  return BASE[tm.rarity] * m * d * (demand == null ? hot(G, c) : 1) * variantMult(G, c, null) * pumpMult(G, c) * (c.trim && !c.graded ? TRIM_VALUE : 1);
}
const readable = (G, c) => c.know.read || (G.fluency[tmpl(c.t).game] >= FLUENT_AT);
// The player's best guess from what they've learned. Bots use only this.
function estimate(G, c) {
  if (c.know.fake) return { value: 0, grade: null, rarity: tmpl(c.t).rarity, fake: true };
  const tm = tmpl(c.t), rar = readable(G, c) ? tm.rarity : null;
  const grade = c.graded ? c.graded.grade : c.know.loupe ? trueGrade(c) : null;
  const m = c.graded ? GRADERS[c.graded.co].mult(c.graded.grade) : RAW(grade == null ? 7 : grade);
  const vm = variantMult(G, c, c.know);
  const pm = G.pump && G.pump.t === c.t ? (G.dayIdx === 3 ? 1.8 : G.dayIdx >= 4 ? 0.5 : 1) : 1; // the market price is public
  const v = BASE[rar || 'u'] * m * demandOf(G, tm.game) * hot(G, c) * vm * pm * (c.trim && c.know.loupe && !c.graded ? TRIM_VALUE : 1);
  return { value: v, grade, rarity: rar, fake: c.know.uv ? false : null, vmult: vm };
}
// What a seller believes their card is worth (home rate). They can't read other species' scripts, can't see
// set symbols or misprints (a miscut just looks damaged to them), and dealers spot vintage.
function sellerBelief(G, person, c) {
  const tm = tmpl(c.t), P = PEOPLE[person], own = SPECIES[P.species].game === tm.game || person === 'sheelo' && tm.game === 'shell';
  const rar = own ? tm.rarity : (RANK[tm.rarity] >= 2 ? 'u' : tm.rarity); // misreads rares and up as "some uncommon"
  const sees = own ? { loupe: true, print: person === 'sheelo' } : { loupe: false, print: false };
  let b = BASE[rar] * RAW(trueGrade(c)) * (c.fake ? variantMult(G, c, { loupe: true }) : variantMult(G, c, sees));
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
    startValue: 0, log: [], version: 3, week: null, lastNight: null };
  G._s = (seed || 1) >>> 0;
  G.week = buildWeek(G);
  // starting case: a few singles you already know
  for (const [g, r] of [['shell', 'u'], ['shell', 'c'], ['hive', 'u'], ['star', 'r'], ['star', 'c'], ['hive', 'c']]) {
    const c = makeCard(G, g, r, 7.2, { read: true }); c.know.loupe = true; c.know.uv = true; c.cost = Math.round(trueValue(G, c, 1)); G.stock.push(c);
  }
  initStore(G);
  G.demand = { shell: 1, hive: 1, star: 1 };
  G.startValue = Math.round(shopValue(G));
  return G;
}
function shopValue(G) {
  let v = G.cash - G.tab + G.bulk * 1;
  for (const c of G.stock) v += trueValue(G, c, 1);
  for (const g in G.packs) v += G.packs[g] * PACK_RETAIL;
  for (const p of G.grading) v += trueValue(G, p.card, 1);
  const S = G.store; if (!S) return v;
  for (const g in S.dead) v -= Math.min(S.dead[g], G.packs[g]) * (PACK_RETAIL - DEAD_PACK);
  for (const g in S.boxes) v += S.boxes[g] * CATALOG.box.cost + S.merch.collector[g] * CATALOG.collector.cost;
  for (const k of ['poster', 'playmat', 'deckbox']) v += S.merch[k] * CATALOG[k].cost;
  for (const it of S.orders.concat(S.crate ? S.crate.items : [])) if (CATALOG[it.item] && !CATALOG[it.item].gear) v += CATALOG[it.item].cost;
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
  if (G.store) deliver(G);
  G.demand = Object.assign({}, D.demand);
  // last night's hype lands on today
  for (const g in G.hype) if (G.hype[g]) { G.demand[g] = +(G.demand[g] + G.hype[g]).toFixed(2); G.hype[g] = 0; }
  // scalped packs: tomorrow's pack buyers already bought from Skrimp
  G.scalpedToday = G.scalped; G.scalped = 0; G.packsSoldToday = 0;
  // the pump: a rare-or-better from a game whose species isn't docking tomorrow... and it's on the reprint list
  if (D.pump && !G.pump) { const g = pick(G, ['star', 'hive', 'shell']); G.pump = { t: tid(g, 12 + Math.floor(R(G) * 4)) }; }
  const games = Object.keys(G.demand).sort((a, b) => G.demand[b] - G.demand[a]);
  G.hotList = [tid(games[0], 12 + Math.floor(R(G) * 5)), tid(games[1], 12 + Math.floor(R(G) * 3))];
  if (G.pump) G.hotList = G.hotList.filter(t => t !== G.pump.t);
  G.visitIdx = -1; G.visit = null; G.phase = 'morning'; G.night = null;
  resolveGrades(G, false);
  for (const k of G.complaints) { money(G, -k.price, 'refund', 'Refund: ' + k.who + ' found a fake'); G.rep = clamp(G.rep - 8, 0, 100); event(G, { t: 'complaint', who: k.who, price: k.price }); }
  G.complaints = [];
  say(G, 'vee', D.dj.replace('{pump}', G.pump ? tmpl(G.pump.t).name : 'a card'));
}
function resolveGrades(G, all) {
  const keep = [];
  for (const p of G.grading) {
    if (!all && p.due > G.dayIdx) { keep.push(p); continue; }
    const c = p.card;
    if (c.fake) { c.loc = inboxFree(G) > 0 ? 'inbox' : 'binder'; c.know.uv = true; c.know.fake = true; G.stats.fakesCaught++; event(G, { t: 'grade', uid: c.uid, co: p.co, fake: true }); G.stock.push(c); continue; }
    c.loc = inboxFree(G) > 0 ? 'inbox' : safeFree(G) > 0 ? 'safe' : 'binder';
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
        c = makeCard(G, tm.game, tm.rarity, spec.q, { idx: tm.idx, src: 'plain', fake: i === 2 && R(G) < 0.5 ? 'ring' : null, read: true });
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
  if (spec.role === 'reseal') { v.packs = 3; v.packGame = pick(G, ['shell', 'hive', 'star']); v.resealed = R(G) < 0.8; }
  if (spec.src === 'trim') for (const c of v.cards) { c.trim = true; c.edg = 10; c.cen = Math.max(c.cen, 9); c.sur = Math.max(c.sur, 9); }
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
    case 'start': if (G.phase !== 'title') return err('not now'); startDay(G); return ok();
    case 'open': if (G.phase !== 'morning') return err('not now'); G.phase = 'shop'; say(G, 'vee', 'Doors open! First customer\'s at the counter.'); return ok();
    case 'next': {
      if (G.phase !== 'shop') return err('finish this customer first');
      const D = G.week[G.dayIdx];
      if (G.visitIdx + 1 >= D.visitors.length) { closeShop(G); return ok(); }
      if (G.store && G.visitIdx >= 0) browseCase(G);
      G.visitIdx++; G.visit = spawnVisit(G, D.visitors[G.visitIdx]); G.phase = 'visit';
      const nv = G.visit, P = PEOPLE[nv.who], hello3 = G.store && v3Hello(G, nv);
      if (hello3) { say(G, nv.who, hello3); if (nv.role === 'weigh' && G.store.noTouch) endVisit(G, 'pass'); }
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
      if (G.phase !== 'visit' || !v || !(v.role === 'buy' || v.role === 'flip' || v.role === 'switch')) return err('not now');
      const c = findStock(G, it.uid); if (!c) return err('no card');
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
      if (v.role === 'thief' || v.role === 'switch') return err('they\'re not selling anything');
      if (v.role === 'buy' || v.role === 'flip' || v.role === 'sealed') { if (!v.showing) return err('show something first'); return dealSell(G, v.bid); }
      return dealBuy(G, v.ask);
    }
    case 'pass': {
      if (G.phase !== 'visit' || !v) return err('not now');
      if (v.role === 'thief') { const got = steal(G, G.store.locked || !where(G, 'case').length || R(G) < 0.5 ? 'rack' : 'case'); say(G, v.who, 'Byeee! *suspiciously lumpy fluff*'); endVisit(G, 'pass'); return ok({ stolen: !!got }); }
      say(G, v.who, v.role === 'scalp' ? 'Your loss. The strip will pay me double anyway.' : v.role === 'buy' || v.role === 'flip' || v.role === 'sealed' ? 'Oh well, next time!' : 'Your loss!');
      endVisit(G, 'pass'); return ok();
    }
    case 'crack': {
      if (G.phase !== 'shop') return err('only between customers');
      if (!G.packs[it.game]) return err('no packs of that game');
      const dead = G.store && G.store.dead[it.game] > 0 && R(G) < G.store.dead[it.game] / G.packs[it.game];
      G.packs[it.game]--; G.stats.cracked++; if (dead) G.store.dead[it.game]--;
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
      if (G.dayIdx >= DAYS.length - 1) { finale(G); return ok(); }
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
  const out = [];
  for (const r of ['c', 'c', 'c', 'u']) out.push(makeCard(G, game, r, 9.0, { fresh: true, src: 'pack' }));
  out.push(dead ? makeCard(G, game, 'c', 9.0, { fresh: true, src: 'plain' }) : makeCard(G, game, rollRarity(G, true), 9.0, { fresh: true, src: 'rareslot' }));
  for (const c of out) { c.know.uv = true; addStock(G, c); }
  return out;
}

function offer(G, p) {
  const v = G.visit; if (G.phase !== 'visit' || !v) return err('not now');
  if (!(p > 0)) return err('bad price');
  if (v.role === 'scalp') return err('Skrimp doesn\'t haggle: take it or leave it');
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
  let belief = 0; for (const c of v.cards) belief += Math.max(1, BASE[tmpl(c.t).rarity] * RAW(trueGrade(c)));
  for (const c of v.cards) { c.cost = price * Math.max(1, BASE[tmpl(c.t).rarity] * RAW(trueGrade(c))) / belief; addStock(G, c); }
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
    const c = findStock(G, v.showing);
    const catchChance = c.fake === 'ring' ? 0.2 : 0.5;
    if (c.fake && v.species !== 'zekk' && R(G) < catchChance) { say(G, v.who, 'Wait... this is a FAKE!'); G.rep = clamp(G.rep - 5, 0, 100); v.insulted = true; c.know.fake = true; endVisit(G, 'walk'); return ok({ caught: true }); }
    G.stock.splice(G.stock.indexOf(c), 1); if (G.store) G.store.stats.counterCardSales++;
    money(G, price, 'sell', 'Sold ' + (readable(G, c) ? tmpl(c.t).name : 'a card') + ' to ' + PEOPLE[v.who].name);
    if (c.fake || c.trim && !c.graded) { G.complaints.push({ who: PEOPLE[v.who].name, price }); if (c.fake) G.stats.fakesSold++; }
    const flip = price - (c.cost || 0);
    if (!G.stats.bestFlip || flip > G.stats.bestFlip.flip) G.stats.bestFlip = { flip: Math.round(flip), t: c.t, price };
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
      if (gem && R(G) < 0.6) c.v.fin = 'mirror';
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
  const ranks = [[-1e9, 'Corner Stall'], [150, 'Strip Regular'], [500, 'Lane Favorite'], [1000, 'Dock Legend'], [1800, 'Legend of the Lanes']];
  let rank = ranks[0][1]; for (const [at, name] of ranks) if (gain >= at) rank = name;
  G.final = { value: v, start: G.startValue, gain, rank, tab: G.tab };
  say(G, 'vee', 'GRADE DAY! Every slab is home. Final shop value ' + v + '₵. Rank: ' + rank + '!');
}

function load(json) {
  const G = typeof json === 'string' ? JSON.parse(json) : json;
  if (typeof G._s !== 'number') throw new Error('not a Card Trader save');
  if (G.version !== 3) throw new Error('this save is from an older version; start a new week');
  if (!G.week) G.week = DAYS.map((D, i) => Object.assign(JSON.parse(JSON.stringify(D)), { rent: RENT[i] }));
  return G;
}
// ---------- v3: The Back Room ----------
// Stock is physical. Every card has a place (c.loc: inbox, binder, case, safe); packs hang on the rack, booster boxes
// sit on shelves, merch hangs on rack hooks. Gear protects cards from gentle wear, the display case sells on its own,
// and five new bad actors work the shop. Design: design/v3-design.md.
const STORE = { caseW: 12, caseH: 4, rackCap: 16, shelfCap: 24, shelfUp: 12, binderPockets: 54, safeCap: 6, inboxCap: 20 };
const HOOKS = { collector: 2, poster: 2, playmat: 2, deckbox: 1 };            // a pack takes 1 hook
const GEAR = { penny: { name: 'Penny sleeves', per: 100 }, hard: { name: 'Hard sleeves', per: 25 }, mag: { name: 'Mag cases', per: 5 } };
const CATALOG = {
  box:       { name: 'Booster box (6 packs)', cost: 120, game: true, shelf: 6 },
  collector: { name: 'Collector box', blurb: 'a promo, 3 packs and a pin', cost: 80, retail: 110, game: true, hooks: 2, nightly: 0.35 },
  poster:    { name: 'Poster set', cost: 8, retail: 18, hooks: 2, nightly: 0.3 },
  playmat:   { name: 'Playmat', cost: 12, retail: 25, hooks: 2, nightly: 0.25 },
  deckbox:   { name: 'Deck box', cost: 3, retail: 7, hooks: 1, nightly: 0.4 },
  penny:     { name: 'Penny sleeves ×100', cost: 4, gear: 'penny' },
  hard:      { name: 'Hard sleeves ×25', cost: 6, gear: 'hard' },
  mag:       { name: 'Mag cases ×5', cost: 10, gear: 'mag' },
  binder:    { name: 'Binder (54 pockets)', cost: 15, now: true },
  shelves:   { name: 'Shelf unit (+12 slots)', cost: 60, now: true, once: true },
  lock:      { name: 'Display case lock', cost: 30, now: true, once: true },
};
const WEAR_DAY = 0.12, WEAR_BINDER = 0.06, WEAR_SHOW = 0.03, TRIM_VALUE = 0.3, DEAD_PACK = 12, RESEAL_PRICE = 20;
// v3's bad actors join the week's signature visitors (day index -> visitors). Day 1 stays the tutorial.
const V3_SPECIALS = {
  1: [{ who: 'gang', role: 'weigh' }],
  2: [{ who: 'sticky', role: 'thief' }, { who: 'snip', role: 'sell', n: 2, games: ['star', 'hive'], q: 7, gem: 'h', src: 'trim' }],
  3: [{ who: 'flick', role: 'switch', wants: { min: 'r' } }, { who: 'gloss', role: 'reseal' }],
  4: [{ who: 'sticky', role: 'thief' }, { who: 'gang', role: 'weigh' }],
};
Object.assign(PEOPLE, {
  gang:   { name: 'The Scale Gang', species: 'zekk', askMul: 1, floorMul: 1, ceilMul: 1, line: 'three Zekk who "just want to feel the packs"', bad: true },
  sticky: { name: 'Sticky', species: 'puffi', askMul: 1, floorMul: 1, ceilMul: 1, line: 'a very fluffy browser with very deep fluff', bad: true },
  snip:   { name: 'Snip', species: 'mollu', askMul: 1.1, floorMul: 0.85, ceilMul: 1, line: 'a trimmer: every card is "a perfect 10"', bad: true },
  flick:  { name: 'Flick', species: 'zekk', askMul: 1, floorMul: 1, ceilMul: 1.05, line: 'a switcher: four hands, and one of them is always busy', bad: true },
  gloss:  { name: 'Gloss', species: 'mollu', askMul: 1, floorMul: 1, ceilMul: 1, line: 'a resealer with "factory sealed" packs, cheap', bad: true },
});

function initStore(G) {
  G.store = { binders: 1, shelves: STORE.shelfCap, lock: false, locked: false, noTouch: false,
    gear: { penny: 60, hard: 10, mag: 0 }, sleeve: { penny: 5, hard: 25, mag: 150 },
    boxes: { shell: 0, hive: 0, star: 0 }, merch: { collector: { shell: 0, hive: 0, star: 0 }, poster: 0, playmat: 0, deckbox: 0 },
    dead: { shell: 0, hive: 0, star: 0 }, orders: [], crate: null, gearWarned: false,
    stats: { displaySales: 0, displayCash: 0, counterCardSales: 0, stolen: 0, stolenValue: 0, wearHits: 0, wearValue: 0, switched: 0, trimsCaught: 0, merchSales: 0, deadPacks: 0 } };
  for (const c of G.stock) { c.loc = c.loc || 'binder'; c.prot = c.prot || 'penny'; }
}
const where = (G, loc) => G.stock.filter(c => c.loc === loc);
function binderFree(G) { return G.store.binders * STORE.binderPockets - where(G, 'binder').length; }
function safeFree(G) { return STORE.safeCap - where(G, 'safe').length; }
function inboxFree(G) { return STORE.inboxCap - where(G, 'inbox').length; }
function merchHooks(G) { const m = G.store.merch; return HOOKS.collector * (m.collector.shell + m.collector.hive + m.collector.star) + HOOKS.poster * m.poster + HOOKS.playmat * m.playmat + HOOKS.deckbox * m.deckbox; }
function rackFree(G) { return STORE.rackCap - packTotal(G) - merchHooks(G); }
function shelfFree(G) { const b = G.store.boxes; return G.store.shelves - 6 * (b.shell + b.hive + b.star); }
function cellSize(c) { return c.graded ? [1, 2] : [1, 1]; }
function caseFits(G, c, x, y) {
  const [w, h] = cellSize(c);
  if (x < 0 || y < 0 || x + w > STORE.caseW || y + h > STORE.caseH) return false;
  for (const o of where(G, 'case')) { if (o === c) continue; const [ow, oh] = cellSize(o); if (x < o.cx + ow && o.cx < x + w && y < o.cy + oh && o.cy < y + h) return false; }
  return true;
}
function caseSpot(G, c) { for (let y = 0; y < STORE.caseH; y++) for (let x = 0; x < STORE.caseW; x++) if (caseFits(G, c, x, y)) return [x, y]; return null; }
function defaultTag(G, c) { return Math.max(1, Math.round(estimate(G, c).value * 1.15)); }

// Sleeving policy: new stock gets gear by its value while gear lasts. Penny stops surface wear; a hard sleeve (with a
// penny inside) stops edge wear too; a mag case stops everything and display buyers pay +10%.
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
// New stock lands in the inbox tray (or a binder if the tray is full).
function arrive(G, c) {
  c.loc = inboxFree(G) > 0 ? 'inbox' : binderFree(G) > 0 ? 'binder' : 'inbox';
  protect(G, c);
}
function roomFor(G, n) { return inboxFree(G) + binderFree(G) >= n; }
function autoStore(G) {
  for (const c of where(G, 'inbox').sort((a, b) => estimate(G, b).value - estimate(G, a).value)) {
    const v = estimate(G, c).value;
    if ((v >= 100 || c.graded) && safeFree(G) > 0) c.loc = 'safe';
    else if (binderFree(G) > 0) c.loc = 'binder';
  }
}
function place(G, c, to, x, y) {
  if (to === 'case') {
    if (!c.graded && c.prot !== 'hard' && c.prot !== 'mag') return err('raw cards need a hard sleeve or mag case to go in the case');
    const spot = x == null ? caseSpot(G, c) : caseFits(G, c, x, y) ? [x, y] : null;
    if (!spot) return err('no room there in the case');
    c.loc = 'case'; c.cx = spot[0]; c.cy = spot[1]; if (!c.tag) c.tag = defaultTag(G, c); return ok();
  }
  if (to === 'safe') { if (c.loc !== 'safe' && safeFree(G) <= 0) return err('the safe is full'); c.loc = 'safe'; return ok(); }
  if (to === 'binder') { if (c.loc !== 'binder' && binderFree(G) <= 0) return err('your binders are full (buy another at close)'); c.loc = 'binder'; return ok(); }
  if (to === 'inbox') { c.loc = 'inbox'; return ok(); }
  return err('nowhere to put it');
}
// Display case: between customers, a browser may buy straight from the case. Fair tags sell; greedy tags sit.
function browseCase(G) {
  const items = where(G, 'case'); if (!items.length) return null;
  if (R(G) > 0.19 * (G.store.locked ? 0.85 : 1)) return null;
  const pool = [];
  for (const c of items) {
    const val = (c.trim ? lookValue(G, c) : trueValue(G, c)) * (c.prot === 'mag' ? 1.1 : 1);
    const fair = val / Math.max(1, c.tag || defaultTag(G, c));
    if (fair >= 0.87) pool.push([c, fair]);
  }
  if (!pool.length) return null;
  let tot = 0; for (const [, f] of pool) tot += f; let r = R(G) * tot, pickC = pool[0][0];
  for (const [c, f] of pool) { r -= f; if (r <= 0) { pickC = c; break; } }
  const price = pickC.tag || defaultTag(G, pickC);
  G.stock.splice(G.stock.indexOf(pickC), 1);
  money(G, price, 'sell', 'Display case: ' + (readable(G, pickC) ? tmpl(pickC.t).name : 'a card') + ' sold');
  if (pickC.fake || pickC.trim) { G.complaints.push({ who: 'a display-case buyer', price }); if (pickC.fake) G.stats.fakesSold++; }
  G.store.stats.displaySales++; G.store.stats.displayCash += price;
  event(G, { t: 'displaySale', t2: pickC.t, price });
  return pickC;
}
function steal(G, what) {
  const S = G.store;
  if (what === 'case') {
    const items = where(G, 'case'); if (!items.length) return null;
    const c = pick(G, items);
    G.stock.splice(G.stock.indexOf(c), 1); S.stats.stolen++; S.stats.stolenValue += trueValue(G, c, 1);
    event(G, { t: 'theft', from: 'case', card: c.t }); return c;
  }
  const games = ['shell', 'hive', 'star'].filter(g => G.packs[g] > 0);
  if (games.length) { const g = pick(G, games); G.packs[g]--; S.dead[g] = Math.min(S.dead[g], G.packs[g]); S.stats.stolen++; S.stats.stolenValue += PACK_RETAIL; event(G, { t: 'theft', from: 'rack', game: g }); return g; }
  return null;
}
// Nightly: unsleeved cards wear (loose ones in the inbox tray or case faster than ones in binder pockets), an unlocked case gets lifted from (day 3+), merch sells.
function nightly(G) {
  const S = G.store;
  for (const c of where(G, 'case').concat(where(G, 'inbox'))) wearRoll(G, c, WEAR_DAY);
  for (const c of where(G, 'binder')) wearRoll(G, c, WEAR_BINDER); // raw cards rub in binder pockets too
  if (G.dayIdx >= 2 && !S.locked && where(G, 'case').length && R(G) < 0.25) steal(G, 'case');
  for (const k of ['poster', 'playmat', 'deckbox']) { let sold = 0; for (let i = 0; i < S.merch[k]; i++) if (R(G) < CATALOG[k].nightly) sold++; if (sold) { S.merch[k] -= sold; S.stats.merchSales += sold; money(G, sold * CATALOG[k].retail, 'sell', 'Rack: ' + sold + ' × ' + CATALOG[k].name); } }
  for (const g of ['shell', 'hive', 'star']) { let sold = 0; for (let i = 0; i < S.merch.collector[g]; i++) if (R(G) < CATALOG.collector.nightly) sold++; if (sold) { S.merch.collector[g] -= sold; S.stats.merchSales += sold; money(G, sold * CATALOG.collector.retail, 'sell', 'Rack: ' + sold + ' × ' + GAMES[g].name + ' collector box'); } }
  S.gearWarned = false;
}
function order(G, item, game, qty) {
  const C = CATALOG[item]; if (!C) return err('not in the catalog');
  if (C.game && !GAMES[game]) return err('pick a card game');
  const n = Math.max(1, qty | 0), cost = C.cost * n;
  if (G.cash < cost) return err('not enough cash');
  if (C.once && (item === 'lock' ? G.store.lock : G.store.shelves > STORE.shelfCap)) return err('you already have that');
  money(G, -cost, item === 'box' ? 'restock' : 'order', (n > 1 ? n + ' × ' : '') + C.name + (C.game ? ': ' + GAMES[game].name : ''));
  if (item === 'binder') G.store.binders += n;
  else if (item === 'shelves') G.store.shelves += STORE.shelfUp;
  else if (item === 'lock') { G.store.lock = true; G.store.locked = true; }
  else for (let i = 0; i < n; i++) G.store.orders.push({ item, game: C.game ? game : null });
  return ok();
}
// Morning: yesterday's orders arrive in a crate. Unpacking puts each thing where it goes, if there's room.
function deliver(G) { const S = G.store; if (S.orders.length) { S.crate = { items: (S.crate ? S.crate.items : []).concat(S.orders) }; S.orders = []; event(G, { t: 'crate', n: S.crate.items.length }); } }
function unpack(G) {
  const S = G.store; if (!S.crate) return err('no crate to unpack');
  const left = [], placed = [];
  for (const it of S.crate.items) {
    const C = CATALOG[it.item];
    if (C && C.gear) { S.gear[C.gear] += GEAR[C.gear].per; placed.push(it); }
    else if (it.item === 'box') { if (shelfFree(G) >= 6) { S.boxes[it.game]++; placed.push(it); } else left.push(it); }
    else if (it.item === 'collector') { if (rackFree(G) >= 2) { S.merch.collector[it.game]++; placed.push(it); } else left.push(it); }
    else if (it.item === 'card') { const c = it.card; if (roomFor(G, 1)) { arrive(G, c); G.stock.push(c); placed.push(it); } else left.push(it); }
    else if (HOOKS[it.item]) { if (rackFree(G) >= HOOKS[it.item]) { S.merch[it.item]++; placed.push(it); } else left.push(it); }
  }
  S.crate = left.length ? { items: left } : null;
  return ok({ placed: placed.length, left: left.length });
}
function openBox(G, game) {
  const S = G.store; if (!S.boxes[game]) return err('no ' + GAMES[game].name + ' box on the shelves');
  if (rackFree(G) < 6) return err('the rack needs 6 free hooks');
  S.boxes[game]--; G.packs[game] += 6; return ok();
}
function openCollector(G, game) {
  const S = G.store; if (!S.merch.collector[game]) return err('no collector box of that game');
  if (rackFree(G) + 2 < 3) return err('the rack needs room for 3 packs');
  S.merch.collector[game]--; G.packs[game] += 3;
  const c = makeCard(G, game, R(G) < 0.3 ? 'h' : 'r', 9, { fresh: true, promo: 'collector', src: 'plain' }); c.know.uv = true; addStock(G, c);
  return ok({ promo: c });
}
// ---------- v3 bad actors at the counter ----------
function v3Hello(G, nv) {
  const S = G.store;
  if (nv.role === 'weigh') return S.noTouch ? 'A "no touching" sign? Lame. We\'re out.' : 'Yo. We\'ll take 3 packs. But we pick. We like to... feel them first.';
  if (nv.role === 'thief') return 'Oh, just browsing! Don\'t mind me. *drifts toward the ' + (S.locked || !where(G, 'case').length ? 'rack' : 'display case') + '*';
  if (nv.role === 'switch') return 'Got ' + wantsText(nv.wants) + '? Can I see it? Up close? In my hands?';
  if (nv.role === 'reseal') return nv.packs + ' ' + GAMES[nv.packGame].name + ' packs, factory sealed, ' + RESEAL_PRICE + '₵ each. Way under retail. Don\'t ask.';
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
  if (rackFree(G) < v.packs) return err('the rack needs ' + v.packs + ' free hooks');
  money(G, -price, 'buy', 'Bought ' + v.packs + ' "sealed" packs from ' + PEOPLE[v.who].name);
  G.packs[v.packGame] += v.packs; if (v.resealed) { S.dead[v.packGame] += v.packs; S.stats.deadPacks += v.packs; }
  say(G, v.who, 'Pleasure. No refunds.'); endVisit(G, 'deal'); return ok();
}
function v3Act(G, it) {
  const v = G.visit, S = G.store;
  switch (it.t) {
    case 'watch': {
      if (G.phase !== 'visit' || !v || (v.role !== 'thief' && v.role !== 'switch')) return err('not now');
      v.watched = true;
      if (v.role === 'thief') { say(G, v.who, '...okay okay, I\'m going! *fluff deflates*'); endVisit(G, 'pass'); return ok(); }
      say(G, v.who, 'Wh- why are you watching my hands like that? ...Fine. Just show me the card.'); return ok();
    }
    case 'sellBehind': if (G.phase !== 'visit' || !v || v.role !== 'weigh') return err('not now'); return dealWeigh(G, true);
    case 'inspectPacks': {
      if (G.phase !== 'visit' || !v || v.role !== 'reseal') return err('not now');
      if (v.knowSeal) return ok(); v.knowSeal = true; costPatience(G, 1);
      if (G.visit) say(G, v.who, v.resealed ? '*the wrappers shine where the glue is* ...Those creases? Shipping damage. Obviously.' : 'See? Real factory seams. Cheap because I owe someone money.');
      return ok();
    }
    case 'place': { const c = findStock(G, it.uid); if (!c) return err('no card'); return place(G, c, it.to, it.x, it.y); }
    case 'tag': { const c = findStock(G, it.uid); if (!c) return err('no card'); c.tag = Math.max(1, Math.round(it.price)); return ok(); }
    case 'sleeve': {
      const c = findStock(G, it.uid); if (!c) return err('no card'); if (c.graded) return err('slabs are already protected');
      const p = it.prot, g = S.gear, cur = c.prot || 'none';
      if (p === 'penny') { if (cur !== 'none') return err('already sleeved'); if (!g.penny) return err('out of penny sleeves'); g.penny--; c.prot = 'penny'; return ok(); }
      if (p === 'hard') { if (cur === 'hard' || cur === 'mag') return err('already protected'); if (!g.hard || (cur === 'none' && !g.penny)) return err('out of sleeves'); if (cur === 'none') g.penny--; g.hard--; c.prot = 'hard'; return ok(); }
      if (p === 'mag') { if (cur === 'mag') return err('already in a mag case'); if (!g.mag) return err('out of mag cases'); g.mag--; c.prot = 'mag'; return ok(); }
      return err('bad sleeve');
    }
    case 'lockCase': if (!S.lock) return err('buy a case lock at close first'); S.locked = !!it.on; return ok();
    case 'sign': S.noTouch = !!it.noTouch; return ok();
    case 'sleevePolicy': for (const k of ['penny', 'hard', 'mag']) if (it[k] != null) S.sleeve[k] = Math.max(0, +it[k]); return ok();
    case 'autoStore': autoStore(G); return ok();
    case 'applyPolicy': { let n = 0; for (const c of G.stock) if (c.loc !== 'case') { const was = c.prot; protect(G, c); if (c.prot !== was) n++; } return ok({ n }); }
    case 'order': if (G.phase !== 'close') return err('order at close'); return order(G, it.item, it.game, it.qty);
    case 'unpack': if (['morning', 'shop', 'close'].indexOf(G.phase) < 0) return err('not now'); return unpack(G);
    case 'openBox': if (['morning', 'shop', 'close'].indexOf(G.phase) < 0) return err('not now'); return openBox(G, it.game);
    case 'openCollector': if (['morning', 'shop', 'close'].indexOf(G.phase) < 0) return err('not now'); return openCollector(G, it.game);
  }
  return null;
}
// What a card looks like it's worth if you can't see that it's fake or trimmed.
function lookValue(G, c) { return c.fake || c.trim ? trueValue(G, Object.assign({}, c, { fake: null, trim: false })) : trueValue(G, c); }
// The Switcher: unwatched, a raw card in a plain penny sleeve (or none) comes back as a fake. Your stamped hard sleeves
// and mag cases can't be swapped without you noticing.
function switchCard(G, c) {
  const v = G.visit;
  if (v.watched || c.graded || c.prot === 'hard' || c.prot === 'mag') { say(G, v.who, 'Hm. Nah, not for me. *hands it back, all four hands visible*'); endVisit(G, 'pass'); return ok(); }
  c.fake = 'uv'; c.know.uv = false; c.know.spec = false; c.prot = 'none'; G.store.stats.switched++;
  event(G, { t: 'switched', uid: c.uid });
  say(G, v.who, 'Eh, changed my mind. Here you go! *hands back a card in a fresh sleeve*'); endVisit(G, 'pass'); return ok();
}

const CT = { newGame, load, act, DAYS, GAMES, SPECIES, PEOPLE, GRADERS, RARITY_NAME, RANK, BASE, BOX, PACK_RETAIL, TRANSLATE_FEE, FLUENT_AT,
  FINISH, SETS, ERRORS, PROMOS, UPGRADES, NIGHTS, NIGHT_FLYERS,
  RENT, NIGHT_POOL, STORE, HOOKS, GEAR, CATALOG, WEAR_DAY, WEAR_SHOW, where, binderFree, safeFree, inboxFree, rackFree, shelfFree, caseFits, cellSize, defaultTag, lookValue, tmpl, trueGrade, centerRatio, estimate, readable, trueValue, shopValue, matches, wantsText, demandOf, variantMult, packTotal };
if (typeof module !== 'undefined' && module.exports) module.exports = CT; else root.CT = CT;
})(this);
