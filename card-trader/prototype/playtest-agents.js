// Agent playtesters (Tier A): scripted personas play full 10-day runs through act(), the way sim.js bots do, and fill in
// the same questionnaire human playtesters fill in, so both land on one results page.
// Run: node playtest-agents.js [runsPerPersona=3] [outDir=../playtests]
// Writes <outDir>/agents-<date>.json (answers + telemetry), <outDir>/agents-<date>-batch.json (an ArtifactData batch that
// writes doc agent-<persona> in the `playtests` collection; a person pushes it, this script never does) and
// <outDir>/agents-<date>.md (the per-persona summary). Same seeds, same output. Rules and heuristics: kit/agents/playtester.md.
// Personas only read what a player could see (estimate(), the visit's ask/bid, patience, tells shown, the checklist if they
// read hints). Answers come from telemetry with the heuristics below; every text answer quotes logged events, never prose.
// © 2026 justaskjoe. All rights reserved.
const CT = require('./engine.js');
const fs = require('fs'), path = require('path');

const SYS = ['opening', 'stockroom', 'fetch', 'browsers', 'tags', 'sleeves', 'sealed', 'vintage', 'reprints', 'repacks', 'rating', 'fakes', 'thieves', 'board', 'upgrades', 'loupe', 'nights'];
const NAMES = { opening: 'the opening', stockroom: 'the stock room', fetch: 'fetching from the back', browsers: 'browsers', tags: 'price tags', sleeves: 'sleeves and wear',
  sealed: 'sealed product', vintage: 'vintage', reprints: 'reprints', repacks: 'repacks', rating: 'the store rating', fakes: 'fakes', thieves: 'thieves', board: 'the board',
  upgrades: 'upgrades', loupe: 'the loupe', nights: 'After Hours nights' };
const GAMES3 = ['shell', 'hive', 'star'];

// ---------- personas ----------
// Knobs: hints (reads the checklist, morning report and reprint list), inspect (share of seller cards it looks at, 0-1),
// haggle (hard/soft/none), watch (chance it watches a suspicious visitor), security (proof/never/tells/random),
// refuse (turns away people on the board), tag (multiplier on estimate, or null = never tags), floor (cards on the floor:
// many/some/few), keepBest (top cards stay in the back), sleeve (all/needed), ups (upgrade plan), nights (flyer order),
// vintage (pays up to this × value for estate lots, 0 = never), hold (keeps sealed sealed), opens (opens boxes into packs),
// trust (believes sellers and buys "sealed" packs), chaos (chance of an odd move each phase), taste (what makes it fun).
const PERSONAS = [
  { id: 'kid', name: 'Impatient kid', blurb: 'Wants packs ripped and deals now. Skips every hint.',
    answers: r => ({ focus: 'singles', split: 'cash', home: GAMES3[r(3)] }),
    hints: false, inspect: 0, haggle: 'none', watch: 0.2, security: 'never', refuse: false, tag: null, floor: 'many', keepBest: false, sleeve: 'needed',
    ups: 'none', nights: ['cardnight', 'dig', 'tourney', 'auction', 'swap'], vintage: 0, hold: false, opens: true, trust: true, chaos: 0.15, cracks: 2, taste: 'thrills' },
  { id: 'minmax', name: 'Min-maxer', blurb: 'Reads everything, haggles every coin, buys the upgrades that pay.',
    answers: r => ({ focus: ['singles', 'sealed'][r(2)], split: 'balanced', home: GAMES3[r(3)] }),
    hints: true, inspect: 1, haggle: 'hard', watch: 1, security: 'proof', refuse: true, tag: 1.1, floor: 'many', keepBest: false, sleeve: 'needed',
    ups: 'smart', nights: ['cardnight', 'tourney', 'dig', 'auction', 'swap'], vintage: 0.85, hold: false, opens: true, trust: false, chaos: 0, cracks: 0, taste: 'money' },
  { id: 'cozy', name: 'Cozy collector', blurb: 'Loves sleeving and arranging, keeps the best cards, never accuses anyone.',
    answers: r => ({ focus: 'singles', split: 'stock', home: GAMES3[r(3)] }),
    hints: true, inspect: 0.6, haggle: 'soft', watch: 0.5, security: 'never', refuse: false, tag: 1.35, floor: 'some', keepBest: true, sleeve: 'all',
    ups: 'collector', nights: ['swap', 'dig', 'cardnight', 'tourney', 'auction'], vintage: 0.7, hold: true, opens: true, trust: false, chaos: 0, cracks: 0, taste: 'cards' },
  { id: 'vintage', name: 'Vintage hunter', blurb: 'Here for estate lots and old packs. Buys the scale and the riser.',
    answers: r => ({ focus: 'vintage', split: 'cash', home: GAMES3[r(3)] }),
    hints: true, inspect: 0.8, haggle: 'soft', watch: 0.8, security: 'proof', refuse: true, tag: 1.2, floor: 'some', keepBest: true, sleeve: 'needed',
    ups: 'vintage', nights: ['auction', 'dig', 'swap', 'tourney', 'cardnight'], vintage: 1.05, hold: true, opens: true, trust: false, chaos: 0, cracks: 0, taste: 'cards' },
  { id: 'sealed', name: 'Sealed speculator', blurb: 'Buys boxes to hold, grades sealed, sells to collectors, limit 2 on packs.',
    answers: r => ({ focus: 'sealed', split: 'stock', home: GAMES3[r(3)] }),
    hints: true, inspect: 0.3, haggle: 'hard', watch: 0.7, security: 'proof', refuse: true, tag: 1.25, floor: 'few', keepBest: false, sleeve: 'needed',
    ups: 'sealed', nights: ['auction', 'tourney', 'cardnight', 'swap', 'dig'], vintage: 0.8, hold: true, opens: false, trust: false, chaos: 0, cracks: 0, taste: 'money' },
  { id: 'goblin', name: 'Chaos goblin', blurb: 'Tries odd things: singles on the rack, 1₵ tags, random security calls.',
    answers: r => ({ focus: ['singles', 'sealed', 'vintage'][r(3)], split: ['cash', 'balanced', 'stock'][r(3)], home: GAMES3[r(3)] }),
    hints: false, inspect: 0.3, haggle: 'soft', watch: 0.5, security: 'random', refuse: true, tag: 'random', floor: 'many', keepBest: false, sleeve: 'needed',
    ups: 'random', nights: null, vintage: 1.2, hold: false, opens: true, trust: true, chaos: 0.6, cracks: 1, taste: 'thrills' },
  { id: 'newbie', name: 'Cautious newbie', blurb: 'Reads every hint, inspects everything, too nervous to call security.',
    answers: () => ({ focus: 'singles', split: 'balanced', home: 'shell' }),
    hints: true, inspect: 1, haggle: 'soft', watch: 1, security: 'never', refuse: false, tag: null, floor: 'some', keepBest: false, sleeve: 'all',
    ups: 'cheap', nights: ['cardnight', 'tourney', 'swap', 'dig', 'auction'], vintage: 0, hold: false, opens: true, trust: false, chaos: 0, cracks: 0, taste: 'calm' },
  { id: 'trusting', name: 'Trusting soul', blurb: 'Takes people at their word: pays asks, buys "factory sealed" packs, lets thieves go.',
    answers: r => ({ focus: ['singles', 'vintage'][r(2)], split: 'balanced', home: GAMES3[r(3)] }),
    hints: true, inspect: 0, haggle: 'none', watch: 0, security: 'never', refuse: false, tag: null, floor: 'some', keepBest: false, sleeve: 'needed',
    ups: 'cheap', nights: ['swap', 'auction', 'cardnight', 'tourney', 'dig'], vintage: 1.0, hold: false, opens: true, trust: true, chaos: 0, cracks: 0, taste: 'calm' },
];

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- telemetry ----------
// Every persona move goes through A(), which logs the move, its result, the system it belongs to, and any engine events
// it caused. Systems get touch (the player did something with it), err (a refused move or a bad call), good and bad
// (payoffs and losses), plus quotes of the refusals and moments ({day, sys, kind, amt, text}) for the text answers.
function newTelemetry() {
  const sys = {}; for (const k of SYS) sys[k] = { touch: 0, err: 0, sur: 0, good: 0, bad: 0, errMsgs: {} };
  return { sys, seenErr: {}, fakeBuys: [], hidden: [], acts: 0, days: [], moments: [], visits: [], gridErr: 0, placeErr: 0, floorErr: 0, setupErr: 0, setupActs: 0, setupMsgs: [], rearr: 0, bugs: [], ev: null, evN: 0, vbuys: [], visit: null };
}
const SYS_OF_ACT = { place: 'stockroom', movePacks: 'stockroom', autoStore: 'stockroom', unpack: 'stockroom', tag: 'tags', retag: 'tags', sleeve: 'sleeves', sleevePolicy: 'sleeves', applyPolicy: 'sleeves',
  openGood: 'sealed', gradeSealed: 'sealed', showPacks: 'sealed', openVintage: 'vintage', weigh: 'vintage', buyVintage: 'vintage', repack: 'repacks', inspect: 'loupe', flaw: 'loupe',
  inform: 'fakes', inspectPacks: 'fakes', watch: 'thieves', letGo: 'thieves', refuse: 'board', upgrade: 'upgrades', unlock: 'upgrades', lockCase: 'thieves', sign: 'thieves', sellBehind: 'thieves',
  pickNight: 'nights', cardNight: 'nights', tourney: 'nights', bid: 'nights', drop: 'nights', dig: 'nights', swap: 'nights', policy: 'sealed', crack: 'sealed', restock: 'sealed', order: 'sealed', toBulk: 'stockroom', grade: 'loupe' };
const UNLOCK_SYS = { binder: 'stockroom', cbinder: 'stockroom', shelves: 'stockroom', bigcase: 'stockroom', case2: 'stockroom', vault: 'vintage', lock: 'thieves', tlbinder: 'thieves', camera: 'thieves', scale: 'vintage', riser: 'vintage', sorter: 'repacks', dropbox: 'sealed' };
const ROLE_SYS = { browse: 'browsers', sealedc: 'sealed', vintage: 'vintage', thief: 'thieves', distract: 'fetch', switch: 'thieves', weigh: 'thieves', reseal: 'fakes', scalp: 'sealed', sealed: 'sealed' };
const FIXN = { bbinder: 'back binder', safe: 'safe', inbox: 'inbox tray', shelf: 'back shelves' };
const name = (G, o) => o ? (o.t ? (CT.readable(G, o) ? CT.tmpl(o.t).name : 'a card') : CT.GOODS[o.type] ? CT.GOODS[o.type].name.toLowerCase() : o.type) : 'something';
// surprise: a bad thing the player didn't see coming (counts against clear as well as fun).
function moment(T, G, sys, kind, amt, text, surprise) { T.moments.push({ day: G.dayIdx + 1, sys, kind, amt: Math.round(amt || 0), text, surprise: !!surprise }); T.sys[sys][kind]++; if (surprise) T.sys[sys].sur++; }
// A refusal counts at most twice a day per message: a person who hits the same wall learns; a bot loop shouldn't inflate it.
function errNote(T, sys, msg, day) { const k = day + '|' + msg; T.seenErr[k] = (T.seenErr[k] || 0) + 1; if (T.seenErr[k] > 2) return false; const s = T.sys[sys]; s.err++; s.errMsgs[msg] = (s.errMsgs[msg] || 0) + 1; return true; }

function A(G, it, T) {
  const v = G.visit, phase = G.phase, day = G.dayIdx;
  // what the move is about, before it changes anything
  let sys = SYS_OF_ACT[it.t] || (it.t === 'start' || it.t === 'open' && day === 0 ? 'opening' : null), obj = it.uid ? CT.findThing(G, it.uid) : null;
  if (it.t === 'unlock') sys = UNLOCK_SYS[it.k] || 'upgrades';
  if (it.t === 'order' && CT.CATALOG[it.item] && CT.CATALOG[it.item].gear) sys = 'sleeves';
  if (v && ['accept', 'offer', 'pass', 'security', 'show'].indexOf(it.t) >= 0) sys = ROLE_SYS[v.role] || (v.cards && v.cards.length ? 'loupe' : 'browsers');
  if (v && it.t === 'security') sys = v.cards.some(c => c.know.fake || c.trim && c.know.loupe) ? 'fakes' : 'thieves';
  if (it.t === 'show' && obj && !CT.isFloor(obj.loc)) sys = 'fetch';
  if (it.t === 'tag' && it.uid) sys = 'tags';
  const fromLoc = obj && obj.loc, cash0 = G.cash, pumpBuy = v && it.t === 'accept' && G.pump && (v.cards || []).some(c => c.t === G.pump.t);
  const lotBefore = v && v.role === 'vintage' ? v.lot : null, stats0 = G.store ? Object.assign({}, G.store.stats) : {};
  const r = CT.act(G, it); T.acts++;
  if (T.visit) T.visit.n++;
  if (!r) { T.bugs.push('act(' + it.t + ') returned nothing'); return { ok: false }; }
  if (r.error && /unknown action/.test(r.error)) T.bugs.push('engine said "' + r.error + '"');
  if (sys) T.sys[sys].touch++;
  if (it.t === 'unlock' && sys !== 'upgrades') T.sys.upgrades.touch++; // a fixture is an upgrade and part of its own system
  if (!r.ok) {
    const msg = r.error || 'refused';
    let counted = false;
    if (/^Before you open/.test(msg)) { counted = errNote(T, 'opening', msg, day); T.setupMsgs.push(msg); }
    else if (it.t === 'place' && /sleeve|penny/.test(msg)) { counted = errNote(T, 'sleeves', msg, day); if (counted) T.floorErr++; }
    else if (/no room|is full|not enough room/.test(msg)) { counted = errNote(T, sys || 'stockroom', msg, day); if (counted) T.gridErr++; }
    else if (it.t === 'place') { counted = errNote(T, 'stockroom', msg, day); if (counted) T.floorErr++; }
    else if (sys) counted = errNote(T, sys, msg, day);
    if (counted && day === 0 && phase === 'morning') T.setupErr++;
  } else if (it.t === 'place' && day > 0) T.rearr++;
  if (day === 0 && phase === 'morning') T.setupActs++;
  if (r.ok) outcomes(G, it, T, { v, sys, obj, fromLoc, cash0, pumpBuy, lotBefore, stats0, r });
  readEvents(G, T);
  trackVisit(G, T, it);
  return r;
}
function outcomes(G, it, T, c) {
  const v = c.v, S = G.store, st = S ? S.stats : {}, dCash = G.cash - c.cash0;
  if (it.t === 'show' && c.sys === 'fetch' && G.visit) T.fetched = { name: name(G, c.obj), from: c.fromLoc, visit: G.visit };
  if (T.fetched && T.fetched.visit === v && !G.visit) { if (v.result === 'deal' && dCash > 0) moment(T, G, 'fetch', 'good', dCash, 'Fetched ' + T.fetched.name + ' from the ' + (FIXN[T.fetched.from] || T.fetched.from) + ' and sold it for ' + Math.round(dCash) + '₵'); else if (v.result === 'walk') moment(T, G, 'fetch', 'bad', 0, 'Went to the ' + (FIXN[T.fetched.from] || T.fetched.from) + ' for ' + T.fetched.name + ' and the customer ran out of patience'); T.fetched = null; }
  if (v && v.role === 'browse' && !G.visit && v.result === 'deal') { moment(T, G, 'browsers', 'good', dCash, 'A browser found something on the floor and paid ' + Math.round(dCash) + '₵'); if (T.tagged) T.sys.tags.good++; }
  if (v && v.role === 'sealedc' && !G.visit && v.result === 'deal') moment(T, G, 'sealed', 'good', dCash, 'Sold sealed product to a collector for ' + Math.round(dCash) + '₵');
  if (v && v.role === 'sealed' && !G.visit && v.result === 'deal') T.sys.sealed.good++;
  if (it.t === 'accept' && v && (v.role === 'sell' || v.role === 'lot' || v.role === 'bulk') && !G.visit && dCash < 0) {
    const est = v.cards.reduce((a, k) => a + CT.estimate(G, k).value, 0), real = v.cards.reduce((a, k) => a + (k.fake ? 0 : CT.trueValue(G, k, 1)), 0);
    // a fake only becomes a moment if the persona finds out (UV later, the graders, a buyer's complaint): see runPersona
    if (v.cards.some(k => k.fake)) T.fakeBuys.push({ day: G.dayIdx + 1, paid: -dCash, cards: v.cards.slice(), real });
    else if (real > -dCash * 1.6) moment(T, G, 'loupe', 'good', real + dCash, 'Bought ' + v.cards.length + ' card' + (v.cards.length > 1 ? 's' : '') + ' for ' + Math.round(-dCash) + '₵, worth about ' + Math.round(real) + '₵');
    if (c.pumpBuy) moment(T, G, 'reprints', 'bad', -dCash, 'Paid ' + Math.round(-dCash) + '₵ for ' + CT.tmpl(G.pump.t).name + ' while it was on the reprint list');
    void est;
  }
  if (it.t === 'pass' && v && G.pump && (v.cards || []).some(k => k.t === G.pump.t) && T.hints) moment(T, G, 'reprints', 'good', 0, 'Read the reprint list and passed on ' + CT.tmpl(G.pump.t).name + ' at hype prices');
  if (c.lotBefore && !G.visit && v.result === 'deal') { const val = CT.goodValue(G, c.lotBefore); T.vbuys.push({ day: G.dayIdx + 1, o: c.lotBefore, paid: -dCash });
    moment(T, G, 'vintage', val >= -dCash ? 'good' : 'bad', val + dCash, 'Paid ' + Math.round(-dCash) + '₵ for a vintage ' + name(G, c.lotBefore) + (c.lotBefore.resealed ? ' (it was resealed, I didn\'t know)' : '') + ', market says ' + Math.round(val) + '₵'); }
  if (it.t === 'openVintage') moment(T, G, 'vintage', c.r.hit ? 'good' : 'bad', 0, 'Opened a vintage pack' + (c.obj && c.obj.cost ? ' I paid ' + c.obj.cost + '₵ for' : '') + ': ' + (c.r.hit ? 'pulled a hit!' : 'no hit' + (c.obj && c.obj.weighed && !c.obj.heavy ? ', and the scale had said light' : '')));
  if (it.t === 'accept' && v && v.role === 'reseal' && !G.visit) moment(T, G, 'fakes', v.resealed ? 'bad' : 'good', v.packs * 20, 'Bought ' + v.packs + ' "factory sealed" packs for ' + Math.round(-dCash) + '₵' + (v.resealed ? ': resealed, hits already taken' : ': they were real'), v.resealed);
  if (it.t === 'flaw') T.sys.loupe.good++;
  if (it.t === 'show' && v && v.role === 'switch' && !G.visit && !v.watched && c.obj && (c.obj.prot === 'hard' || c.obj.prot === 'mag') && !c.obj.fake)
    moment(T, G, 'sleeves', 'good', 0, 'Someone asked to hold ' + name(G, c.obj) + ' up close; it was in a hard sleeve and they handed it straight back');
  if (it.t === 'inspect' && st && G.stats) { /* fakes and variants come in as events / stats below */ }
  if (it.t === 'watch' && c.r.caught) moment(T, G, 'thieves', 'good', 0, 'Watched ' + (CT.PEOPLE[v.who] ? CT.PEOPLE[v.who].name : 'someone') + ' and caught a pack ' + (v.hard === 'kid' ? 'falling out of a kid\'s sleeve' : 'in their coat'));
  if (it.t === 'security') { if (c.r.right) moment(T, G, c.sys, c.r.kid ? 'bad' : 'good', dCash, c.r.kid ? 'Called security on a kid I caught. They burst into tears and my rating dropped' : 'Called security and was right: ' + Math.round(dCash) + '₵ bounty');
    else moment(T, G, c.sys, 'bad', 0, 'Called security' + (v.tellsShown ? ' (they showed ' + v.tellsShown + ' tell' + (v.tellsShown > 1 ? 's' : '') + ')' : '') + ' and was wrong' + (c.r.noProof ? ': no proof, they walked' : ': rep and rating hit'), true); }
  if (it.t === 'refuse') moment(T, G, 'board', c.r.right ? 'good' : 'bad', 0, c.r.right ? 'Turned away ' + CT.PEOPLE[v.who].name + ', who was on my board' : 'Turned away ' + CT.PEOPLE[v.who].name + ' and they weren\'t a crook');
  if (it.t === 'inform') moment(T, G, 'fakes', 'good', 0, c.r.victim ? 'Told a seller their card was fake; they were a victim and thanked me' : 'Told a seller their card was fake and they bolted');
  if (it.t === 'letGo') T.sys.thieves.good++;
  if (it.t === 'unlock' || it.t === 'upgrade') { T.sys.upgrades.good++; T.sys[c.sys].good += c.sys === 'upgrades' ? 0 : 1; }
  if (it.t === 'repack') moment(T, G, 'repacks', 'good', 0, 'Built ' + c.r.made + ' repacks with ' + c.r.seeded + ' hit' + (c.r.seeded === 1 ? '' : 's') + ' inside');
  if (it.t === 'tag') T.tagged = true;
  if (it.t === 'sleeve') T.sys.sleeves.good += 0;
  if (it.t === 'openGood' && c.r.promos && c.r.promos.length) moment(T, G, 'sealed', 'good', 0, 'Opened a ' + name(G, c.obj) + ' and got ' + c.r.promos.length + ' promo' + (c.r.promos.length > 1 ? 's' : ''));
  if (it.t === 'dig' && c.r.card) { const val = CT.trueValue(G, c.r.card, 1); if (val >= 15) moment(T, G, 'nights', 'good', val, 'Bulk Dig flip turned up a ' + Math.round(val) + '₵ card'); }
  if (it.t === 'gradeSealed') T.sys.sealed.touch++;
  if (S && st.wrongCalls > (c.stats0.wrongCalls || 0)) { /* logged above */ }
}
// Engine events: G.events is replaced at every new day and at each night, so remember which array we last read.
function readEvents(G, T) {
  if (T.ev !== G.events) { T.ev = G.events; T.evN = 0; }
  for (; T.evN < G.events.length; T.evN++) {
    const e = G.events[T.evN];
    if (e.t === 'theft') moment(T, G, 'thieves', 'bad', 0, 'Something was stolen from the ' + e.from + (e.card ? ' (' + CT.tmpl(e.card).name + ')' : e.good ? ' (' + (CT.GOODS[e.good] ? CT.GOODS[e.good].name.toLowerCase() : e.good) + ')' : e.game ? ' (a ' + CT.GAMES[e.game].name + ' pack)' : '') + (T.watchedToday ? '' : ' and I never saw who'), !T.watchedToday);
    else if (e.t === 'distracted') moment(T, G, 'fetch', 'bad', 0, 'Went to the back to fetch a card; when I came back their friend was gone' + (e.got ? ' and so was something from the floor' : ''), true);
    else if (e.t === 'switched') moment(T, G, 'sleeves', 'bad', 0, 'A customer handed back a card in a fresh sleeve; it had been switched for a fake (it was in a penny sleeve or none)', true);
    else if (e.t === 'fakeFound') moment(T, G, 'fakes', 'good', 0, 'The UV lamp caught a fake');
    else if (e.t === 'searched') moment(T, G, 'thieves', 'bad', 0, 'Let a group feel the packs on the rack; some packs went dead (hits taken)', !T.hints);
    else if (e.t === 'repackHit') T.sys.repacks.good++;
    else if (e.t === 'repackScam') moment(T, G, 'repacks', 'bad', 0, 'Repacks fell below their posted hit sign and the rating dropped', true);
    else if (e.t === 'gearOut') moment(T, G, 'sleeves', 'bad', 0, 'Ran out of sleeves: new cards went unsleeved', true);
    else if (e.t === 'board') T.sys.board.touch++;
    else if (e.t === 'release') { if (T.hints) T.sys.reprints.touch++; }
    else if (e.t === 'auction') moment(T, G, 'nights', e.won ? (e.worth >= e.price ? 'good' : 'bad') : 'good', e.won ? e.worth - e.price : 0, e.won ? 'Won a Dock Auction crate for ' + e.price + '₵; it was worth about ' + e.worth + '₵' : 'Dropped out of a Dock Auction at ' + e.price + '₵ (worth about ' + e.worth + '₵)');
    else if (e.t === 'cardNight') moment(T, G, 'nights', e.holo || e.grail ? 'good' : 'good', e.sold * 7, 'Card Night: ripped ' + e.n + ' pack' + (e.n === 1 ? '' : 's') + ' live' + (e.grail ? ', pulled a GRAIL' : e.holo ? ', pulled ' + e.holo + ' holo' + (e.holo > 1 ? 's' : '') : '') + ', hype +' + Math.round(e.hype * 100) + '%');
    else if (e.t === 'tourney') moment(T, G, 'nights', e.fakePrize ? 'bad' : 'good', e.entrants * 5 + e.sales, e.fakePrize ? 'Tournament prize turned out fake under UV; the crowd turned on me' : 'Tournament: ' + e.entrants + ' players, ' + (e.entrants * 5 + e.sales) + '₵ in fees and deck sales');
    else if (e.t === 'grade') { if (e.fake) moment(T, G, 'fakes', 'bad', 0, 'Sent a card to the graders and it came back FAKE', true); else if (e.altered) moment(T, G, 'fakes', 'bad', 0, 'A card came back from the graders marked trimmed', true); }
    else if (e.t === 'tab') moment(T, G, 'upgrades', 'bad', e.amt, 'Couldn\'t cover rent: ' + e.amt + '₵ went on the tab', !T.hints);
  }
}
function trackVisit(G, T, it) {
  if (it.t === 'next' && G.phase === 'visit' && G.visit) T.visit = { role: G.visit.role, n: 0, day: G.dayIdx, acts: [] };
  else if (it.t === 'next' && G.lastVisit && !G.visit && G.phase === 'shop' && G.lastVisit !== T.lastSeen) { T.visits.push({ role: G.lastVisit.role, day: G.dayIdx, n: 0, result: G.lastVisit.result, auto: true }); T.lastSeen = G.lastVisit; }
  if (T.visit) T.visit.acts.push(it.t);
  if (T.visit && !G.visit) { T.visits.push({ role: T.visit.role, day: T.visit.day, n: T.visit.n - 1, result: G.lastVisit ? G.lastVisit.result : null, acts: T.visit.acts.slice(1) }); T.lastSeen = G.lastVisit; T.visit = null; }
}

// ---------- the persona player ----------
function playerFor(P, seed) {
  const rnd = mulberry(seed * 7919 + P.id.length * 104729), r = n => Math.floor(rnd() * n), chance = p => rnd() < p;
  let T;
  const a = (G, it) => A(G, it, T);
  const est = (G, c) => CT.estimate(G, c).value;
  function morning(G) {
    T.watchedToday = false;
    const S = G.store;
    if (G.dayIdx === 0 && !P.hints) a(G, { t: 'open' }); // jumps straight at the door
    if (S.crate) a(G, { t: 'unpack' });
    if (P.opens) for (const o of G.goods.filter(o => o.type === 'box' && o.loc === 'shelf')) if (CT.packTotal(G) + CT.backPackTotal(G) < (P.cracks ? 12 : 8)) a(G, { t: 'openGood', uid: o.uid });
    if (S.crate) a(G, { t: 'unpack' });
    for (const g of GAMES3) if (S.backPacks[g]) a(G, { t: 'movePacks', game: g, n: S.backPacks[g], to: 'rack' });
    if (P.hints || P.floor !== 'many') a(G, { t: 'autoStore' });
    if (P.sleeve === 'all' && G.dayIdx === 0) a(G, { t: 'sleevePolicy', penny: 0, hard: 15, mag: 80 });
    if (P.sleeve === 'all') a(G, { t: 'applyPolicy' });
    // the case: biggest-looking cards (a collector keeps its best three in the back)
    const want = { many: 12, some: 7, few: 4 }[P.floor];
    let pool = G.stock.filter(c => c.loc !== 'case' && !c.know.fake && !c.graded && (P.floor === 'many' || c.loc !== 'safe')).sort((x, y) => est(G, y) - est(G, x));
    if (P.keepBest) pool = pool.slice(3);
    for (const c of pool) {
      if (CT.onGrid(G, 'case').length >= want) break;
      if (est(G, c) < (P.floor === 'many' ? 4 : 10) && CT.onGrid(G, 'case').length >= 3) break;
      if (P.hints && c.prot !== 'hard' && c.prot !== 'mag' && !a(G, { t: 'sleeve', uid: c.uid, prot: 'hard' }).ok) break;
      const res = a(G, { t: 'place', uid: c.uid, to: 'case' });
      if (!res.ok && /sleeve/.test(res.error || '')) { if (!a(G, { t: 'sleeve', uid: c.uid, prot: 'hard' }).ok) break; a(G, { t: 'place', uid: c.uid, to: 'case' }); }
    }
    // the counter binder: mid cards
    const binderWant = { many: 14, some: 8, few: 4 }[P.floor];
    for (const c of G.stock.filter(c => !CT.isFloor(c.loc) && !c.know.fake && !c.graded && c.loc !== 'safe').sort((x, y) => est(G, y) - est(G, x))) {
      if (CT.where(G, 'cbinder').length >= binderWant) break;
      if (P.hints && (!c.prot || c.prot === 'none') && !a(G, { t: 'sleeve', uid: c.uid, prot: 'penny' }).ok) break;
      const res = a(G, { t: 'place', uid: c.uid, to: 'cbinder' });
      if (!res.ok && /sleeve/.test(res.error || '')) { if (!a(G, { t: 'sleeve', uid: c.uid, prot: 'penny' }).ok) break; a(G, { t: 'place', uid: c.uid, to: 'cbinder' }); }
    }
    if (S.up.riser) for (const o of G.goods.filter(o => CT.GOODS[o.type].vintage && o.loc === 'shelf')) a(G, { t: 'place', uid: o.uid, to: 'case' });
    if (P.hold === false || G.dayIdx === 0) for (const o of G.goods.filter(o => o.loc === 'shelf' && CT.GOODS[o.type].where.indexOf('rack') >= 0)) { if (CT.goodsAt(G, 'rack').length >= (P.hold ? 2 : 4)) break; a(G, { t: 'place', uid: o.uid, to: 'rack' }); }
    // tags
    const floorThings = CT.onGrid(G, 'case').concat(CT.where(G, 'cbinder'), CT.where(G, 'tlbinder'));
    if (P.tag === 'random') { const o = floorThings[r(Math.max(1, floorThings.length))]; if (o) a(G, { t: 'tag', uid: o.uid, price: chance(0.5) ? 1 : 999 }); }
    else if (P.tag) for (const o of floorThings) if (o.t) a(G, { t: 'tag', uid: o.uid, price: Math.round(est(G, o) * P.tag) });
    if (chance(P.chaos)) chaosMove(G);
    // day 1 gate
    if (G.dayIdx === 0) {
      if (P.hints) fixChecklist(G);
      for (let k = 0; k < 4 && G.phase === 'morning'; k++) { const res = a(G, { t: 'open' }); if (!res.ok) fixChecklist(G); }
      return;
    }
    a(G, { t: 'open' });
    if (G.phase === 'morning') { fixChecklist(G); a(G, { t: 'open' }); }
  }
  // Do what the checklist says. A persona that skips hints only gets here after the door refused it.
  function fixChecklist(G) {
    const S = G.store;
    for (const item of CT.openChecklist(G).filter(x => !x.done)) {
      if (item.k === 'crate') a(G, { t: 'unpack' });
      if (item.k === 'rack') { for (const g of GAMES3) if (S.backPacks[g]) a(G, { t: 'movePacks', game: g, n: S.backPacks[g], to: 'rack' });
        for (const o of G.goods.filter(o => o.loc === 'shelf' && CT.GOODS[o.type].where.indexOf('rack') >= 0)) { if (CT.packTotal(G) + CT.goodsAt(G, 'rack').length >= 3) break; a(G, { t: 'place', uid: o.uid, to: 'rack' }); } }
      if (item.k === 'case') for (const c of G.stock.filter(c => !CT.isFloor(c.loc) && !c.know.fake && !c.graded).sort((x, y) => est(G, y) - est(G, x))) {
        if (CT.onGrid(G, 'case').length >= 3) break;
        if (c.prot !== 'hard' && c.prot !== 'mag') a(G, { t: 'sleeve', uid: c.uid, prot: 'hard' }); a(G, { t: 'place', uid: c.uid, to: 'case' }); }
      if (item.k === 'cbinder') for (const c of G.stock.filter(c => !CT.isFloor(c.loc) && !c.know.fake && !c.graded)) {
        if (CT.where(G, 'cbinder').length >= 4) break;
        if (!c.prot || c.prot === 'none') a(G, { t: 'sleeve', uid: c.uid, prot: 'penny' }); a(G, { t: 'place', uid: c.uid, to: 'cbinder' }); }
    }
  }
  function chaosMove(G) {
    const S = G.store, k = r(6), c = G.stock.find(c => !c.graded);
    if (k === 0 && c) a(G, { t: 'place', uid: c.uid, to: 'rack' });            // singles on the rack
    else if (k === 1) a(G, { t: 'lockCase', on: true });                        // lock it before buying a lock
    else if (k === 2) a(G, { t: 'sign', noTouch: chance(0.5) });
    else if (k === 3 && c) a(G, { t: 'place', uid: c.uid, to: 'shelf' });      // raw card on a shelf
    else if (k === 4) a(G, { t: 'retag' });
    else if (k === 5) { const o = G.goods.find(o => o.type === 'vpack'); if (o) a(G, { t: 'openVintage', uid: o.uid }); else a(G, { t: 'weigh', uid: 'g1' }); }
    void S;
  }
  function haggleSell(G, value) {
    if (P.haggle === 'none') return a(G, { t: 'accept' });
    let p = Math.round(value * (P.haggle === 'hard' ? 1.35 : 1.15));
    while (G.visit && G.visit.patience > 1) {
      if (G.visit.bid >= value * (P.haggle === 'hard' ? 0.95 : 0.85)) return a(G, { t: 'accept' });
      a(G, { t: 'offer', price: p });
      if (!G.visit) return;
      p = Math.max(Math.round(value * 0.9), Math.round(p * 0.92));
    }
    if (G.visit) a(G, { t: 'accept' });
  }
  function suspicious(v) { return v.tellsShown > 0 || v.disguised; }
  function visit(G) {
    const v = G.visit, S = G.store;
    T.sys[ROLE_SYS[v.role] || 'browsers'] && 0;
    if (v.disguised && P.refuse && CT.boardHas(G, v.who)) return a(G, { t: 'refuse' });
    if (P.security === 'random' && chance(0.08)) return a(G, { t: 'security' });
    if (P.security === 'tells' && v.tellsShown > 0 && ['thief', 'distract', 'switch'].indexOf(v.role) < 0) return a(G, { t: 'security' });
    if (P.refuse && P.chaos && chance(0.04)) return a(G, { t: 'refuse' });
    switch (v.role) {
      case 'weigh': return a(G, { t: P.hints ? 'sellBehind' : 'accept' });
      case 'thief': {
        if (!(chance(P.watch) && (suspicious(v) || P.watch >= 0.8))) return a(G, { t: 'pass' });
        a(G, { t: 'watch' }); T.watchedToday = true; if (!G.visit) return;
        if (P.security === 'never' || P.trust) return a(G, v.hard === 'kid' ? { t: 'letGo', parent: true } : { t: 'letGo', work: v.hard === 'drifter' && G.cash > 60 });
        if (v.hard === 'kid') return a(G, { t: 'letGo', parent: true });
        if (v.hard === 'drifter') return a(G, { t: 'letGo', work: G.cash > 60 });
        return a(G, { t: 'security' });
      }
      case 'distract': {
        if (chance(P.watch) && v.tellsShown >= 1) { a(G, { t: 'watch' }); T.watchedToday = true; return G.visit && a(G, { t: 'pass' }); }
        const far = G.stock.find(c => !CT.isFloor(c.loc) && CT.matches(G, v.wants, c) && !c.know.fake);
        if (far) { a(G, { t: 'show', uid: far.uid }); return G.visit && a(G, { t: 'pass' }); }
        return a(G, { t: 'pass' });
      }
      case 'browse': {
        if (!v.showing) return a(G, { t: 'pass' });
        const o = CT.findThing(G, v.showing), tag = o && (o.tag || CT.defaultTag(G, o));
        if (P.haggle !== 'hard' || v.bid >= tag * 0.9) return a(G, { t: 'accept' });
        a(G, { t: 'offer', price: Math.round(tag * 0.97) }); return G.visit && a(G, { t: 'accept' });
      }
      case 'sealedc': {
        const g = G.goods.find(o => o.type === v.wantsGood.type && o.game === v.wantsGood.game && !o.dead);
        if (!g) return a(G, { t: 'pass' });
        a(G, { t: 'show', uid: g.uid }); if (!G.visit) return;
        return haggleSell(G, CT.goodValue(G, g) * (P.hold ? 1.1 : 1));
      }
      case 'vintage': {
        const val = CT.goodValue(G, v.lot), rent = G.week[G.dayIdx].rent;
        if (!P.vintage || G.cash < rent + 20) return a(G, { t: 'pass' });
        if (P.haggle === 'none' || P.vintage >= 1.05) { if (v.ask <= val * P.vintage && G.cash > v.ask + rent) return a(G, { t: 'accept' }); }
        else if (v.ask <= val * P.vintage * 0.9 && G.cash > v.ask + rent + 40) return a(G, { t: 'accept' });
        if (G.cash > val * 0.6 + rent) { a(G, { t: 'offer', price: Math.round(val * 0.6) }); if (G.visit) a(G, { t: 'offer', price: Math.round(val * 0.75) }); }
        return G.visit && a(G, { t: 'pass' });
      }
      case 'reseal': {
        if (!P.trust) { a(G, { t: 'inspectPacks' }); if (G.visit && G.visit.resealed) return a(G, { t: 'pass' }); }
        if (G.visit && a(G, { t: 'accept' }).ok) return; return G.visit && a(G, { t: 'pass' });
      }
      case 'switch': {
        if (chance(P.watch)) { a(G, { t: 'watch' }); T.watchedToday = true; }
        const fit = G.stock.filter(c => CT.matches(G, v.wants, c) && !c.know.fake && !c.graded).sort((x, y) => est(G, y) - est(G, x))[0];
        if (fit && G.visit) a(G, { t: 'show', uid: fit.uid });
        return G.visit && a(G, { t: 'pass' });
      }
      case 'scalp': return P.hints && P.haggle !== 'none' ? a(G, { t: 'pass' }) : a(G, { t: 'accept' });
      case 'sealed': {
        if (CT.packTotal(G) === 0 && CT.backPackTotal(G) > 0) for (const g of GAMES3) a(G, { t: 'movePacks', game: g, n: 3, to: 'rack' });
        if (CT.packTotal(G) === 0) return a(G, { t: 'pass' });
        a(G, { t: 'showPacks' }); if (!G.visit) return;
        return haggleSell(G, CT.PACK_RETAIL * G.visit.packs);
      }
      case 'sell': case 'lot': case 'bulk': return buyFrom(G, v);
    }
    // buyers (buy, flip): find a fit and show it
    let fits = G.stock.filter(c => CT.matches(G, v.wants, c) && !c.know.fake);
    if (P.keepBest) { const top = G.stock.slice().sort((x, y) => est(G, y) - est(G, x)).slice(0, 3); fits = fits.filter(c => top.indexOf(c) < 0); }
    if (!fits.length) return a(G, { t: 'pass' });
    fits.sort((x, y) => (CT.isFloor(y.loc) ? 1 : 0) - (CT.isFloor(x.loc) ? 1 : 0) || est(G, y) - est(G, x));
    const c = P.chaos && chance(0.3) ? fits[fits.length - 1] : fits[0];
    a(G, { t: 'show', uid: c.uid }); if (!G.visit) return;
    return haggleSell(G, est(G, c));
  }
  function buyFrom(G, v) {
    const n = Math.round(v.cards.length * P.inspect + (P.inspect > 0 && P.inspect < 1 && chance(0.5) ? 1 : 0));
    for (const c of v.cards.slice(0, n)) for (const tool of ['read', 'uv', 'loupe']) {
      if (!G.visit || G.visit.patience <= (P.taste === 'calm' ? 2 : 4)) break;
      if (tool === 'read' && CT.readable(G, c)) continue;
      if (!c.know[tool]) a(G, { t: 'inspect', uid: c.uid, tool });
    }
    if (!G.visit) return;
    const found = v.cards.some(c => c.know.fake || c.trim && c.know.loupe);
    if (found) {
      const schemer = v.react && v.react.filter(x => SCHEMER.indexOf(x) >= 0).length >= 2;
      if (P.security === 'proof' && schemer) return a(G, { t: 'security' });
      if (P.security !== 'proof' || !schemer) { if (P.taste === 'calm' || P.taste === 'cards' || chance(0.5)) return a(G, { t: 'inform' }); }
      return a(G, { t: 'pass' });
    }
    if (P.inspect >= 0.6) for (const c of v.cards) if (c.know.loupe && !c.flawUsed && Math.min(c.cen, c.edg, c.sur) <= 6) a(G, { t: 'flaw', uid: c.uid });
    if (!G.visit) return;
    const pumped = c => P.hints && G.pump && G.pump.t === c.t;
    let e = 0; for (const c of v.cards) e += pumped(c) ? est(G, c) * 0.25 : est(G, c);
    if (P.haggle === 'none') return v.ask <= G.cash * 0.8 ? a(G, { t: 'accept' }) : a(G, { t: 'pass' });
    const target = e * (P.haggle === 'hard' ? 0.6 : 0.75), cap = Math.min(e * (P.haggle === 'hard' ? 0.8 : 0.95), G.cash);
    if (v.ask <= target && v.ask <= G.cash) return a(G, { t: 'accept' });
    let p = Math.max(1, Math.round(e * (P.haggle === 'hard' ? 0.42 : 0.6)));
    while (G.visit && G.visit.patience > 1) {
      if (v.species === 'mollu') p = Math.max(10, Math.round(p / 10) * 10);
      if (p > cap) break;
      a(G, { t: 'offer', price: p }); if (!G.visit) return;
      if (G.visit.ask <= target && G.visit.ask <= G.cash) return a(G, { t: 'accept' });
      p = Math.round(p + Math.max(2, (G.visit.ask - p) * 0.35));
    }
    if (G.visit) a(G, { t: 'pass' });
  }
  function close(G) {
    const S = G.store, rent = G.week[G.dayIdx].rent, U = S.up, next = G.week[G.dayIdx + 1];
    const spare = x => G.cash > rent + x;
    if (P.ups === 'smart') {
      for (const k of ['lens', 'spec', 'hands']) if (!G.up[k] && spare(CT.UPGRADES[k].cost + 80)) a(G, { t: 'upgrade', k });
      if (G.dayIdx >= 1) a(G, { t: 'policy', limit2: true });
      for (const c of G.stock.slice()) {
        if (!c.know.loupe) a(G, { t: 'inspect', uid: c.uid, tool: 'loupe' });
        if (!c.know.uv) a(G, { t: 'inspect', uid: c.uid, tool: 'uv' });
        const e = CT.estimate(G, c); if (e.fake) continue;
        if (!c.graded && c.know.loupe && CT.trueGrade(c) >= 9 && e.value >= 20 && spare(15)) a(G, { t: 'grade', uid: c.uid, co: 'halo' });
        else if (!c.graded && e.rarity === 'c' && e.value < 2.5) a(G, { t: 'toBulk', uid: c.uid });
      }
      if (U.sorter && G.bulk >= 150) a(G, { t: 'repack', n: 8, per: 15, every: 4, min: 12, price: 12 });
      if (!U.lock && spare(70)) a(G, { t: 'unlock', k: 'lock' });
      if (!U.camera && G.dayIdx >= 3 && spare(180)) a(G, { t: 'unlock', k: 'camera' });
      if (!U.sorter && G.dayIdx >= 3 && G.bulk >= 150 && spare(200)) a(G, { t: 'unlock', k: 'sorter' });
    } else if (P.ups === 'collector') {
      if (!U.tlbinder && spare(60)) a(G, { t: 'unlock', k: 'tlbinder' });
      if (CT.pocketsFree(G, 'bbinder') < 20 && spare(15)) a(G, { t: 'unlock', k: 'binder' });
      if (!G.up.lens && spare(CT.UPGRADES.lens.cost + 60)) a(G, { t: 'upgrade', k: 'lens' });
      if (S.gear.hard < 8 && spare(10)) a(G, { t: 'order', item: 'hard' });
      if (S.gear.mag < 2 && spare(30)) a(G, { t: 'order', item: 'mag' });
      for (const c of G.stock.filter(c => !c.graded && c.know.loupe && CT.trueGrade(c) >= 9 && est(G, c) >= 30).slice(0, 1)) if (spare(25)) a(G, { t: 'grade', uid: c.uid, co: 'halo' });
    } else if (P.ups === 'vintage') {
      if (!U.scale && spare(60)) a(G, { t: 'unlock', k: 'scale' });
      if (!U.riser && G.goods.some(o => CT.GOODS[o.type].vintage) && spare(60)) a(G, { t: 'unlock', k: 'riser' });
      if (!U.vault && G.dayIdx >= 4 && spare(150)) a(G, { t: 'unlock', k: 'vault' });
      if (!U.lock && spare(60)) a(G, { t: 'unlock', k: 'lock' });
      for (const o of G.goods.filter(o => o.type === 'vpack')) { if (U.scale && !o.weighed) a(G, { t: 'weigh', uid: o.uid }); if (o.weighed && o.heavy && G.dayIdx >= 6) a(G, { t: 'openVintage', uid: o.uid }); }
    } else if (P.ups === 'sealed') {
      if (G.dayIdx >= 1) a(G, { t: 'policy', limit2: true });
      if (G.dayIdx >= 1 && G.dayIdx < 7 && spare(280)) a(G, { t: 'order', item: 'premium', game: hotGame(G) });
      else if (G.dayIdx < 8 && spare(120)) a(G, { t: 'order', item: ['collector', 'tin'][r(2)], game: hotGame(G) });
      if (!U.dropbox && G.dayIdx >= 2 && spare(120)) a(G, { t: 'unlock', k: 'dropbox' });
      if (!U.lock && spare(60)) a(G, { t: 'unlock', k: 'lock' });
      const best = G.goods.filter(o => !o.sgrade && (CT.GOODS[o.type].packs || CT.GOODS[o.type].vintage) && o.type !== 'repack').sort((x, y) => CT.goodValue(G, y) - CT.goodValue(G, x))[0];
      if (best && G.dayIdx >= 3 && G.dayIdx <= 7 && spare(80)) a(G, { t: 'gradeSealed', uid: best.uid, co: 'halo' });
    } else if (P.ups === 'cheap') {
      if (!U.lock && spare(80)) a(G, { t: 'unlock', k: 'lock' });
      if (CT.pocketsFree(G, 'bbinder') < 10 && spare(15)) a(G, { t: 'unlock', k: 'binder' });
    } else if (P.ups === 'random') {
      const keys = Object.keys(CT.UNLOCKS); a(G, { t: 'unlock', k: keys[r(keys.length)] });
      if (chance(0.3)) a(G, { t: 'upgrade', k: ['lens', 'spec', 'hands'][r(3)] });
      if (U.sorter && G.bulk >= 60) a(G, { t: 'repack', n: 4, per: 15, every: 2, min: 10, seed: 0, price: 15 }); // promises hits, seeds none
      if (chance(0.3)) a(G, { t: 'order', item: ['poster', 'playmat', 'deckbox', 'blister'][r(4)], game: GAMES3[r(3)] });
    }
    if (P.sleeve === 'all' && S.gear.penny < 20 && spare(10)) a(G, { t: 'order', item: 'penny' });
    if (P.hints && S.gear.hard < 4 && spare(10)) a(G, { t: 'order', item: 'hard' });   // the drawer count is on screen
    if (P.hints && S.gear.penny < 10 && spare(10)) a(G, { t: 'order', item: 'penny' });
    if (next && P.ups !== 'none' && P.ups !== 'sealed' && spare(CT.BOX.cost + 10)) a(G, { t: 'restock', game: hotGame(G) });
    if (next && P.ups === 'none' && CT.packTotal(G) + CT.backPackTotal(G) < 4 && spare(CT.BOX.cost)) a(G, { t: 'restock', game: GAMES3[r(3)] });
    return a(G, { t: 'endDay' });
  }
  function night(G) {
    const N = G.night;
    if (!N.pick) {
      const order = P.nights ? N.flyers.slice().sort((x, y) => P.nights.indexOf(x) - P.nights.indexOf(y)) : N.flyers.slice().sort(() => rnd() - 0.5);
      for (const ev of order) if (a(G, { t: 'pickNight', ev }).ok) return;
      return a(G, { t: 'nextMorning' });
    }
    if (!N.done) {
      if (N.pick === 'cardnight') { const g = Object.keys(G.packs).sort((x, y) => G.packs[y] - G.packs[x])[0]; a(G, { t: 'cardNight', game: g, n: P.taste === 'thrills' ? 6 : Math.min(3, G.packs[g]) }); }
      else if (N.pick === 'tourney') {
        const nx = G.week[G.dayIdx + 1], g = Object.keys(nx.demand).sort((x, y) => nx.demand[y] - nx.demand[x])[0];
        const prize = P.keepBest ? null : G.stock.filter(c => !c.know.fake && !c.graded && est(G, c) >= 15 && est(G, c) <= 60).sort((x, y) => est(G, x) - est(G, y))[0];
        a(G, { t: 'tourney', game: g, prize: prize ? prize.uid : null });
      } else if (N.pick === 'auction') {
        const Au = N.auc, guess = Au.cards.length * 6 + (Au.clues[2].indexOf('gold') >= 0 ? 150 : Au.clues[2].indexOf('assorted') >= 0 ? -20 : 25);
        const reach = P.trust || P.chaos ? 1.2 : P.haggle === 'hard' ? 0.7 : 0.85;
        while (!N.done) { const np = Au.high ? Au.price + Math.max(5, Math.round(Au.price * 0.1)) : Au.price; if (np > guess * reach || np > G.cash - 20) { a(G, { t: 'drop' }); break; } if (!a(G, { t: 'bid' }).ok) { a(G, { t: 'drop' }); break; } }
      } else if (N.pick === 'dig') {
        const order = N.dig.cards.map((c, i) => [c, i]).sort((x, y) => P.hints ? (y[0].hint.glint ? 1 : 0) - (x[0].hint.glint ? 1 : 0) : rnd() - 0.5);
        for (const [, i] of order) { if (N.done) break; a(G, { t: 'dig', i }); }
      } else if (N.pick === 'swap') {
        N.swaps.forEach((s, i) => {
          const mine = s.want && G.stock.find(c => c.uid === s.want);
          if (P.trust) return a(G, { t: 'swap', i, accept: true });
          if (P.inspect) for (const tool of ['loupe', 'uv']) a(G, { t: 'inspect', uid: s.theirs.uid, tool });
          const good = mine && est(G, s.theirs) > est(G, mine) * (P.taste === 'cards' ? 0.95 : 1.1);
          a(G, { t: 'swap', i, accept: !!good });
        });
      }
    }
    return a(G, { t: 'nextMorning' });
  }
  function shop(G) {
    for (let k = 0; k < P.cracks; k++) { const g = GAMES3.find(g => G.packs[g] > 2); if (g && chance(0.5)) a(G, { t: 'crack', game: g }); }
    return a(G, { t: 'next' });
  }
  function play(G) {
    if (G.phase === 'title') return a(G, { t: 'start', answers: T.answers });
    if (G.phase === 'morning') return morning(G);
    if (G.phase === 'shop') return shop(G);
    if (G.phase === 'visit') { const v = G.visit; visit(G); if (G.visit === v && G.phase === 'visit') a(G, { t: 'pass' }); return; }
    if (G.phase === 'close') return close(G);
    if (G.phase === 'night') return night(G);
  }
  return { play, init(t) { T = t; T.hints = P.hints; T.answers = P.answers(r); } };
}
const SCHEMER = ['story changes when you ask where it\'s from', 'gets pushy the moment the lamp comes out', 'has several "perfect" copies of the same card'];
function hotGame(G) { const d = G.week[Math.min(G.week.length - 1, G.dayIdx + 1)].demand; return Object.keys(d).sort((a, b) => d[b] - d[a])[0]; }

// ---------- one run ----------
function runPersona(P, seed) {
  const G = CT.newGame(seed), T = newTelemetry(), pl = playerFor(P, seed);
  pl.init(T);
  let lastDay = -1, dayStart = null;
  for (let guard = 0; G.phase !== 'end' && guard < 20000; guard++) {
    if (G.dayIdx !== lastDay && G.phase === 'morning') { lastDay = G.dayIdx; dayStart = { acts: T.acts, visits: T.visits.length, moments: T.moments.length }; }
    const before = G.days.length;
    pl.play(G);
    if (G.days.length > before) { const d = G.days[G.days.length - 1], vs = T.visits.slice(dayStart.visits);
      T.days.push({ day: d.day + 1, cash: d.cash, value: d.value, rent: G.week[d.day].rent, tab: Math.round(G.tab), income: d.income, spent: d.spent, stars: G.rating.stars,
        acts: T.acts - dayStart.acts, visits: vs.length, deals: vs.filter(x => x.result === 'deal').length, idle: vs.filter(x => x.auto || (x.acts && x.acts.length <= 1 && x.result !== 'deal')).length,
        decisions: vs.reduce((s, x) => s + (x.acts ? x.acts.filter(t => t !== 'pass').length : 0), 0), moments: T.moments.length - dayStart.moments }); }
  }
  if (G.phase !== 'end') T.bugs.push('run never reached the end screen (stuck in ' + G.phase + ')');
  for (const k of ['cash', 'tab', 'rep']) if (!Number.isFinite(G[k])) T.bugs.push(k + ' is not a number');
  // fakes bought: known if UV caught it later, the graders flagged it, or it was sold (the buyer complains)
  for (const b of T.fakeBuys) {
    const fakes = b.cards.filter(c => c.fake), known = fakes.filter(c => c.know.fake || G.stock.indexOf(c) < 0);
    if (known.length && b.real < b.paid) { T.moments.push({ day: b.day, sys: 'fakes', kind: 'bad', amt: Math.round(b.paid - b.real), text: 'Paid ' + Math.round(b.paid) + '₵ for ' + b.cards.length + ' card' + (b.cards.length > 1 ? 's' : '') + ' and ' + known.length + ' turned out fake (worth about ' + Math.round(b.real) + '₵ in all)', surprise: true }); T.sys.fakes.bad++; T.sys.fakes.sur++; }
    if (fakes.length > known.length) T.hidden.push('bought ' + (fakes.length - known.length) + ' fake' + (fakes.length - known.length > 1 ? 's' : '') + ' on day ' + b.day + ' and never found out');
  }
  // held vintage: what it's worth now against what was paid
  for (const b of T.vbuys) { const still = G.goods.indexOf(b.o) >= 0; if (still) { const now = CT.goodValue(G, b.o); if (now < b.paid * 0.85) moment(T, G, 'vintage', 'bad', b.paid - now, 'Paid ' + Math.round(b.paid) + '₵ for a vintage ' + name(G, b.o) + ' on day ' + b.day + '; at the end it was worth ' + Math.round(now) + '₵'); } }
  // the rating: up days are fun, unexplained down days are confusing for anyone who skips the morning report
  for (let i = 1; i < T.days.length; i++) { const a = T.days[i - 1].stars, b = T.days[i].stars; if (a == null || b == null) continue; T.sys.rating.touch += P.hints ? 1 : 0;
    if (b > a + 0.02) T.sys.rating.good++; else if (b < a - 0.02) { T.sys.rating.bad++; if (!P.hints) T.sys.rating.sur++; } }
  if (G.store.up.riser) T.sys.rating.touch++;
  // stat-only payoffs the move log can't see
  T.sys.loupe.good += G.stats.variants + G.stats.misprints;
  T.sys.sleeves.bad += Math.min(5, G.store.stats.wearHits);
  T.sys.thieves.good += G.store.stats.bounties;
  T.sys.repacks.good += 0;
  return { G, T };
}

// ---------- questionnaire answers from telemetry ----------
// Heuristics (documented in kit/agents/playtester.md, "How answers are derived"):
//  clear (1-5): 5 minus a step for each band of refusals and bad calls in that system: 0 → 5, 1 → 4, 2-3 → 3, 4-6 → 2, 7+ → 1.
//  fun (1-5): smoothed payoff ratio 1 + 4 × (good+1)/(good+bad+2), rounded, ±1 for the persona's taste (thrills likes nights,
//    cracking, vintage; money likes upgrades, sealed, haggling wins; cards likes loupe, sleeves, swaps; calm dislikes thieves, fakes, board).
//  missed: the persona never acted in that system (touch 0). clear and fun are null only when nothing at all happened in it.
//  money per range (days 1-3, 4-7, 8-10): each day's closing cash after rent against the next rent. On a tab or under 1× rent
//    = broke, under 2.5× = tight, under 6× = ok, else flush; the range takes its most common band (ties go to the poorer one).
//  energy per range: deals per visit and moments per day. Idle share over 45% or under 1.5 deals a day = drag; 3+ moments a day
//    and 35%+ of visits ending in a deal = exciting; else fine.
//  drag day: the first day from 4 on where shop value grew under 3% for two days running (null if it never flattens).
//  mins: a rough play-time estimate: 4 s per move, 10 s per visit, 30 s per morning; labelled as an estimate.
const TASTE = { thrills: { nights: 1, sealed: 1, vintage: 1, loupe: -1, stockroom: -1, sleeves: -1 }, money: { upgrades: 1, sealed: 1, browsers: 1, nights: -1, sleeves: -1 },
  cards: { loupe: 1, sleeves: 1, nights: 1, thieves: -1, tags: 1 }, calm: { thieves: -1, fakes: -1, board: -1, browsers: 1, stockroom: 1 } };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function clearOf(e) { return e === 0 ? 5 : e === 1 ? 4 : e <= 3 ? 3 : e <= 6 ? 2 : 1; }
function answers(P, seed, G, T) {
  const sys = {};
  for (const k of SYS) {
    const s = T.sys[k], any = s.touch + s.err + s.good + s.bad > 0;
    const bad = s.err + s.bad;
    sys[k] = { clear: any ? clearOf(s.err + s.sur) : null,
      fun: any ? clamp(Math.round(1 + 4 * (s.good + 1) / (s.good + bad + 2)) + ((TASTE[P.taste] || {})[k] || 0), 1, 5) : null,
      missed: s.touch === 0 };
  }
  const band = d => d.tab > 0 || d.cash < d.rent ? 'broke' : d.cash < d.rent * 2.5 ? 'tight' : d.cash < d.rent * 6 ? 'ok' : 'flush';
  const ORDER = ['broke', 'tight', 'ok', 'flush'];
  const ranges = { early: [1, 3], mid: [4, 7], late: [8, 10] }, pace = {};
  for (const r in ranges) {
    const ds = T.days.filter(d => d.day >= ranges[r][0] && d.day <= ranges[r][1]);
    const cnt = {}; for (const d of ds) { const nextRent = (G.week[d.day] || G.week[d.day - 1]).rent; const b = band(Object.assign({}, d, { rent: nextRent })); cnt[b] = (cnt[b] || 0) + 1; }
    const money = ORDER.slice().sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0) || ORDER.indexOf(a) - ORDER.indexOf(b))[0];
    const visits = ds.reduce((s, d) => s + d.visits, 0), deals = ds.reduce((s, d) => s + d.deals, 0), idle = ds.reduce((s, d) => s + d.idle, 0), mom = ds.reduce((s, d) => s + d.moments, 0);
    const n = Math.max(1, ds.length), idleShare = idle / Math.max(1, visits), dealShare = deals / Math.max(1, visits);
    const energy = idleShare >= 0.45 || dealShare < 0.3 ? 'drag' : dealShare >= 0.55 && mom / n >= 5 ? 'exciting' : 'fine';
    pace[r] = { money, energy, _why: { deals: +(deals / n).toFixed(1), dealShare: +dealShare.toFixed(2), idleShare: +idleShare.toFixed(2), moments: +(mom / n).toFixed(1) } };
  }
  let drag = null;
  for (let i = 3; i < T.days.length - 1; i++) { const g1 = T.days[i].value / T.days[i - 1].value - 1, g2 = T.days[i + 1].value / T.days[i].value - 1; if (g1 < 0.03 && g2 < 0.03) { drag = T.days[i].day; break; } }
  const floorBack = clearOf(T.floorErr + T.sys.fetch.bad), grids = clearOf(T.gridErr), counterFloor = clearOf(T.sys.browsers.bad + (T.visits.filter(v => v.role === 'browse' && v.auto).length > 3 ? 2 : 0));
  const setupClear = clearOf(T.setupErr);
  const setupFeel = T.setupErr >= 3 ? 'confusing' : T.setupActs > 45 ? 'busywork' : P.taste === 'cards' && T.setupErr === 0 ? 'fun' : 'fine';
  const sorted = T.moments.slice().sort((a, b) => Math.abs(b.amt) - Math.abs(a.amt));
  const good = sorted.filter(m => m.kind === 'good'), badM = sorted.filter(m => m.kind === 'bad');
  const pickBest = good.find(m => (TASTE[P.taste] || {})[m.sys] > 0) || good[0];
  const best = pickBest ? 'Day ' + pickBest.day + ': ' + pickBest.text + '.' : '';
  const worst = badM[0] ? 'Day ' + badM[0].day + ': ' + badM[0].text + '.' : '';
  const contra = contradictions(G, T).slice(0, 2).join(' ');
  const scored = SYS.filter(k => sys[k].clear != null).sort((a, b) => sys[a].clear - sys[b].clear || T.sys[b].err - T.sys[a].err);
  const worstSys = scored[0];
  const confused = worstSys && sys[worstSys].clear <= 3 ? confusedText(T, worstSys) : '';
  const lowFun = SYS.filter(k => sys[k].fun != null && !sys[k].missed).sort((a, b) => sys[a].fun - sys[b].fun)[0];
  const change = worstSys && sys[worstSys].clear <= 2 ? 'Make ' + NAMES[worstSys] + ' clearer: ' + confusedText(T, worstSys)
    : lowFun && sys[lowFun].fun <= 2 ? 'Give ' + NAMES[lowFun] + ' a better payoff: ' + T.sys[lowFun].good + ' good moment' + (T.sys[lowFun].good === 1 ? '' : 's') + ' vs ' + (T.sys[lowFun].bad + T.sys[lowFun].err) + ' bad ones.'
    : drag ? 'Something new around day ' + drag + ': shop value grew under 3% a day from there.' : '';
  const funs = SYS.map(k => sys[k].fun).filter(x => x != null), avgFun = funs.reduce((s, x) => s + x, 0) / Math.max(1, funs.length);
  const again = clamp(Math.round(avgFun + (G.final.gain > G.final.start ? 0.5 : -0.5) + (G.final.tab > 0 ? -1 : 0) + (drag && drag <= 6 ? -1 : 0)), 1, 5);
  const visits = T.visits.length, mins = Math.round((T.acts * 4 + visits * 10 + 30 * 10) / 60);
  return { day: 'end', mins, rank: G.final.rank, focus: G.shop.focus, split: G.shop.split, home: G.shop.home, setupClear, setupFeel, floorBack, counterFloor, grids,
    rearranged: T.rearr > 5 ? 'yes' : T.rearr > 0 ? 'once' : 'no', sys,
    pace: { early: { money: pace.early.money, energy: pace.early.energy }, mid: { money: pace.mid.money, energy: pace.mid.energy }, late: { money: pace.late.money, energy: pace.late.energy } },
    drag: drag == null ? null : String(drag), contra, confused, best, worst, change, bugs: T.bugs.join(' '), again, at: AT, build: 'v3', source: 'agent', persona: P.id, seed,
    verdict: verdict(P, G, T, sys, good, badM, drag, pace),
    _pace: pace };
}
// The general verdict: like / dislike, makes sense / confusing, keep / remove / change / add. Each line comes from this
// run's numbers or logged moments (rules in kit/agents/playtester.md, "The verdict").
function verdict(P, G, T, sys, good, badM, drag, pace) {
  const top = (arr, n) => arr.slice(0, n).map(m => 'Day ' + m.day + ': ' + m.text);
  const on = SYS.filter(k => sys[k].clear != null && !sys[k].missed);
  const V = { like: top(good, 3), dislike: top(badM, 3),
    makesSense: on.filter(k => sys[k].clear >= 4).map(k => NAMES[k]), confusing: on.filter(k => sys[k].clear <= 2).map(k => NAMES[k] + (T.sys[k].err ? ' (' + Object.keys(T.sys[k].errMsgs)[0] + ')' : '')),
    keep: on.filter(k => sys[k].fun >= 4 && sys[k].clear >= 4).map(k => NAMES[k]), remove: [], change: [], add: [] };
  for (const k of SYS) if (sys[k].missed && sys[k].clear == null) V.remove.push(NAMES[k] + ': never came up for me (cut it, or surface it)');
  for (const k of on) if (sys[k].clear <= 2) V.change.push(NAMES[k] + ': ' + (confusedText(T, k) || 'unclear'));
  for (const k of on) if (sys[k].fun <= 2 && sys[k].clear > 2) V.change.push(NAMES[k] + ': ' + T.sys[k].good + ' payoffs vs ' + (T.sys[k].bad + T.sys[k].err) + ' setbacks; give it a better payoff');
  const sleeveErr = Object.entries(T.sys.sleeves.errMsgs).reduce((s, [, n]) => s + n, 0);
  if (sleeveErr >= 3) V.add.push('Auto-sleeve when placing a card (I hit ' + sleeveErr + ' sleeve refusals)');
  if (T.gridErr >= 3 || T.floorErr >= 3) V.add.push('Auto-sort / "stock the floor" button (' + (T.gridErr + T.floorErr) + ' placement refusals)');
  if (T.hidden.length) V.add.push('A reminder to re-check stock for fakes (' + T.hidden.length + ' fake buy' + (T.hidden.length > 1 ? 's' : '') + ' never found)');
  if (drag) V.add.push('Something new around day ' + drag + ' (shop value flat from there)');
  if (['mid', 'late'].some(r => pace[r].money === 'broke')) V.add.push('A safer way to cover rent mid-run (closed ' + ['early', 'mid', 'late'].filter(r => pace[r].money === 'broke').join(' and ') + ' days broke)');
  if (sys.rating.clear != null && sys.rating.clear <= 3) V.add.push('A morning line that says why the rating moved');
  return V;
}
function confusedText(T, k) {
  const s = T.sys[k], msgs = Object.entries(s.errMsgs).sort((a, b) => b[1] - a[1]);
  if (msgs.length) return 'In ' + NAMES[k] + ', the game said "' + msgs[0][0] + '" ' + msgs[0][1] + (msgs[0][1] === 1 ? ' time' : ' times') + (msgs[1] ? ' and "' + msgs[1][0] + '" ' + msgs[1][1] + '×' : '') + '.';
  const m = T.moments.find(x => x.sys === k && x.kind === 'bad');
  return m ? 'In ' + NAMES[k] + ': ' + m.text + ' (day ' + m.day + '), and I couldn\'t tell what I should have done.' : '';
}
// Two systems pulling against each other, from things that happened in this run.
function contradictions(G, T) {
  const out = [], M = T.moments, has = (sys, kind, re) => M.find(m => m.sys === sys && m.kind === kind && (!re || re.test(m.text)));
  const wrongTell = M.find(m => m.sys === 'thieves' && m.kind === 'bad' && /showed \d tell/.test(m.text));
  if (wrongTell) out.push('Day ' + wrongTell.day + ': ' + wrongTell.text + '. The tells said crook, security said innocent.');
  const fetchLoss = has('fetch', 'bad', /friend was gone/), fetchWin = has('fetch', 'good');
  if (fetchLoss && fetchWin) out.push('Day ' + fetchWin.day + ' a buyer asked me to check the back and it paid; day ' + fetchLoss.day + ' someone asked for the good stuff in the back and their friend was gone when I came back. The two asks look alike.');
  const theft = M.filter(m => /stolen from the case/.test(m.text));
  if (theft.length && G.store.up.lock) out.push('Bought a case lock but still lost ' + theft.length + ' thing' + (theft.length > 1 ? 's' : '') + ' from the case' + (G.store.locked ? '' : ' (it ended up unlocked)') + '.');
  else if (theft.length >= 3) out.push('The rating wants a full case (it says "half the case was empty"), but a full unlocked case got robbed ' + theft.length + ' times.');
  const tagBrowse = T.tagged && T.visits.filter(v => v.role === 'browse' && v.auto).length;
  if (tagBrowse >= 3) out.push('I set my own tags and ' + tagBrowse + ' browsers walked in, found nothing worth it at those tags, and left.');
  const vLoss = has('vintage', 'bad', /worth/);
  if (vLoss && G.store.up.scale) out.push('Bought the pack scale for vintage, still ' + vLoss.text.toLowerCase() + '.');
  else if (vLoss) out.push('Day ' + vLoss.day + ': ' + vLoss.text + '. Vintage is pitched as the big prize but the estate price was above what it sold for.');
  const reprint = has('reprints', 'bad'); if (reprint) out.push('Day ' + reprint.day + ': ' + reprint.text + '. A seller pushed it as about to moon.');
  const sealedHold = has('sealed', 'good') && G.goods.filter(o => o.dead).length; if (sealedHold) out.push('Held sealed product to sell later, but ' + sealedHold + ' of it went dead on the shelf.');
  if (G.store.stats.switched && T.sys.sleeves.touch) out.push('I sleeved cards and one still got switched: penny sleeves don\'t count, only hard sleeves do.');
  return out;
}

// ---------- main ----------
const AT = process.env.PLAYTEST_AT || new Date().toISOString().slice(0, 10) + 'T12:00:00.000Z';
function main() {
  const per = +(process.argv[2] || 3), outDir = path.resolve(__dirname, process.argv[3] || '../playtests'), date = AT.slice(0, 10);
  const docs = {}, report = [];
  for (const P of PERSONAS) {
    docs[P.id] = { persona: P.id, name: P.name, blurb: P.blurb, runs: [] };
    for (let s = 1; s <= per; s++) {
      const seed = 1000 + s * 17, { G, T } = runPersona(P, seed), run = answers(P, seed, G, T);
      run._telemetry = { final: G.final, stars: G.rating.stars, days: T.days, sys: T.sys, moments: T.moments.length, acts: T.acts, setupErr: T.setupErr, gridErr: T.gridErr, hidden: T.hidden };
      docs[P.id].runs.push(run);
    }
  }
  fs.mkdirSync(outDir, { recursive: true });
  const full = { about: 'Agent playtests of Intergalactic Card Trader v3 (Tier A, scripted personas). Made by card-trader/prototype/playtest-agents.js. © 2026 justaskjoe. All rights reserved.',
    at: AT, runsPerPersona: per, personas: PERSONAS.map(P => ({ id: P.id, name: P.name, blurb: P.blurb })), docs };
  fs.writeFileSync(path.join(outDir, 'agents-' + date + '.json'), JSON.stringify(full, null, 1));
  // ArtifactData batch: one doc per persona, the same shape a human tester writes ({ runs: [...] }), private fields stripped.
  const clean = run => { const o = {}; for (const k in run) if (k[0] !== '_') o[k] = run[k]; return o; };
  const batch = { about: 'ArtifactData batch for https://claude.ai/artifact/UcN4Lpz8yMHSyDCK69DmYM, collection playtests. A person pushes this; the script never does. © 2026 justaskjoe. All rights reserved.',
    url: 'https://claude.ai/artifact/UcN4Lpz8yMHSyDCK69DmYM', action: 'batch',
    writes: PERSONAS.map(P => ({ op: 'set', collection: 'playtests', doc_id: 'agent-' + P.id, data: { source: 'agent', persona: P.id, name: P.name, runs: docs[P.id].runs.map(clean) } })) };
  fs.writeFileSync(path.join(outDir, 'agents-' + date + '-batch.json'), JSON.stringify(batch, null, 1));
  fs.writeFileSync(path.join(outDir, 'agents-' + date + '.md'), summary(full));
  console.log(summary(full));
}

// ---------- the summary report ----------
function summary(full) {
  const L = [], docs = full.docs, med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  L.push('# Agent playtest: Card Trader v3, ' + full.at.slice(0, 10), '', '© 2026 justaskjoe. All rights reserved.', '',
    'Scripted personas (Tier A), ' + full.runsPerPersona + ' runs each, seeds 1017+. Made by `node card-trader/prototype/playtest-agents.js`. These are bots playing through `act()`: they find clarity and pacing problems the engine can measure, not how the game feels. Read them next to the human answers.', '');
  // all personas, per system
  L.push('## Systems across personas', '', 'Median clear / fun (1-5) per persona; `-` = never touched. Low numbers are bold.', '');
  L.push('| System | ' + Object.values(docs).map(d => d.persona).join(' | ') + ' |', '| --- |' + Object.values(docs).map(() => ' --- |').join(''));
  for (const k of SYS) {
    const cells = Object.values(docs).map(d => {
      const c = d.runs.map(r => r.sys[k].clear).filter(x => x != null), f = d.runs.map(r => r.sys[k].fun).filter(x => x != null), missed = d.runs.every(r => r.sys[k].missed);
      if (!c.length) return '-';
      const mc = med(c), mf = med(f), b = x => x <= 2 ? '**' + x + '**' : '' + x;
      return b(mc) + ' / ' + b(mf) + (missed ? ' (missed)' : '');
    });
    L.push('| ' + k + ' | ' + cells.join(' | ') + ' |');
  }
  L.push('');
  // flags that most personas agree on
  const flags = [];
  for (const k of SYS) {
    const unclear = Object.values(docs).filter(d => { const c = d.runs.map(r => r.sys[k].clear).filter(x => x != null); return c.length && med(c) <= 2; }).map(d => d.persona);
    const unfun = Object.values(docs).filter(d => { const f = d.runs.map(r => r.sys[k].fun).filter(x => x != null); return f.length && med(f) <= 2; }).map(d => d.persona);
    const missed = Object.values(docs).filter(d => d.runs.every(r => r.sys[k].missed)).map(d => d.persona);
    if (unclear.length >= 2) flags.push('- **' + k + '** unclear for ' + unclear.length + ' personas (' + unclear.join(', ') + ').');
    if (unfun.length >= 2) flags.push('- **' + k + '** unfun for ' + unfun.length + ' personas (' + unfun.join(', ') + ').');
    if (missed.length >= 4) flags.push('- **' + k + '** never touched by ' + missed.length + ' of ' + Object.keys(docs).length + ' personas (' + missed.join(', ') + ').');
  }
  L.push('## Flags', '', ...(flags.length ? flags : ['- Nothing that two or more personas agree on.']), '');
  // the verdict, tallied: how many runs say keep / remove / change / add for each item (text before the first colon or bracket)
  const runsAll = Object.values(docs).flatMap(d => d.runs), tally = cat => { const c = {}; for (const r of runsAll) for (const line of new Set(r.verdict[cat].map(x => x.split(/[:(]/)[0].trim()))) c[line] = (c[line] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' (' + n + '/' + runsAll.length + ')'); };
  L.push('## Verdict across all runs', '', '| | Items (runs that said so) |', '| --- | --- |');
  for (const cat of ['keep', 'change', 'remove', 'add']) L.push('| ' + cat + ' | ' + (tally(cat).slice(0, 8).join(', ') || '-') + ' |');
  L.push('');
  // pacing
  L.push('## Pacing', '', '| Persona | Early money / energy | Mid | Late | Drag day (median) | Rank (median gain) | Again |', '| --- | --- | --- | --- | --- | --- | --- |');
  for (const d of Object.values(docs)) {
    const mode = arr => { const c = {}; for (const x of arr) c[x] = (c[x] || 0) + 1; return Object.keys(c).sort((a, b) => c[b] - c[a])[0]; };
    const pc = r => mode(d.runs.map(x => x.pace[r].money)) + ' / ' + mode(d.runs.map(x => x.pace[r].energy));
    const drags = d.runs.map(r => r.drag).filter(x => x != null).map(Number), gains = d.runs.map(r => Math.round(r._telemetry.final.gain / r._telemetry.final.start * 100));
    L.push('| ' + d.persona + ' | ' + pc('early') + ' | ' + pc('mid') + ' | ' + pc('late') + ' | ' + (drags.length ? med(drags) + ' (' + drags.length + '/' + d.runs.length + ' runs)' : 'none') + ' | ' + mode(d.runs.map(r => r.rank)) + ' (' + med(gains) + '%) | ' + med(d.runs.map(r => r.again)) + ' |');
  }
  L.push('');
  // per persona
  L.push('## Per persona', '');
  for (const d of Object.values(docs)) {
    const r0 = d.runs[0];
    L.push('### ' + d.name + ' (`agent-' + d.persona + '`)', '', d.blurb, '');
    const low = SYS.filter(k => { const c = d.runs.map(r => r.sys[k].clear).filter(x => x != null); return c.length && med(c) <= 2; });
    const lowF = SYS.filter(k => { const f = d.runs.map(r => r.sys[k].fun).filter(x => x != null); return f.length && med(f) <= 2; });
    const missed = SYS.filter(k => d.runs.every(r => r.sys[k].missed));
    L.push('- Opening: ' + d.runs.map(r => r.focus + '/' + r.split + '/' + r.home).join(', ') + '. Setup clear ' + d.runs.map(r => r.setupClear).join(', ') + ', felt ' + d.runs.map(r => r.setupFeel).join(', ') + '.');
    L.push('- Unclear: ' + (low.join(', ') || 'none') + '. Unfun: ' + (lowF.join(', ') || 'none') + '. Never touched: ' + (missed.join(', ') || 'none') + '.');
    for (const r of d.runs) {
      const t = r._telemetry;
      L.push('- Seed ' + r.seed + ': ' + t.final.rank + ', ' + t.final.start + '₵ → ' + t.final.value + '₵, ' + (t.stars != null ? t.stars.toFixed(1) + '★' : 'no rating') + (t.final.tab ? ', tab ' + Math.round(t.final.tab) + '₵' : '') + ', drag day ' + (r.drag || 'none') + ', again ' + r.again + '/5.');
      if (r.worst) L.push('  - Worst: ' + r.worst);
      if (r.best) L.push('  - Best: ' + r.best);
      if (r.contra) L.push('  - Contradiction: ' + r.contra);
      if (r.confused) L.push('  - Confused: ' + r.confused);
      if (r.bugs) L.push('  - Bugs: ' + r.bugs);
      if (t.hidden.length) L.push('  - Never noticed (telemetry only, not in its answers): ' + t.hidden.join('; ') + '.');
    }
    void r0; L.push('');
  }
  L.push('## How to read this', '', '- Heuristics are in `kit/agents/playtester.md` ("How answers are derived"). Every text answer quotes an event from that run.', '- `mins` is an estimate (4 s a move, 10 s a visit, 30 s a morning), not a measured time.', '- Personas are bots with fixed habits. A system they flag is worth a human look; a system they like is not proof it is fun.', '');
  return L.join('\n');
}

if (require.main === module) main();
module.exports = { PERSONAS, runPersona, answers };
