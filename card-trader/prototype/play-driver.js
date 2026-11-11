// Play driver for the no-API playtest route: a person or a Claude Code session plays Card Trader v3 one step at a time
// through act(), seeing only what a player sees. Each call applies your actions, then plays on by your standing orders
// until something needs you, and prints the readable state. The save is a JSON file, so a run survives between calls.
//   node play-driver.js new <save.json> <seed> <focus> <split> <home>
//   node play-driver.js do <save.json> '<actions>'          actions: JSON array of act() moves or macros (below)
//   node play-driver.js order <save.json> <kind> '<actions>' standing order for a kind of visitor you've met ("" clears)
//   node play-driver.js note <save.json> '<text>'           a note in the moment (confused, contradiction, drag)
//   node play-driver.js look <save.json>                    print the state again
// Macros: "showBest" (show your best fitting card, floor first), "sell" (haggle: accept a bid >= 95% of estimate),
// "inspectAll" (lamp, loupe and read every card on the counter while patience lasts), "buyBelow:0.7" (accept if the ask
// is at most 70% of the estimate, else haggle up to it), "setup" (do what the open checklist says), "sleeveFloor".
// Standing orders key on the visitor's kind, which a player learns from their opening line after the first meeting.
// Stops: every morning, close and night; any visitor showing a tell (until you order _ignoreTells '[true]'); any kind
// you have no order for.
// © 2026 justaskjoe. All rights reserved.
const CT = require('./engine.js');
const fs = require('fs');

const [cmd, file, ...rest] = process.argv.slice(2);
function save(S) { fs.writeFileSync(file, JSON.stringify(S)); }
function loadS() { const S = JSON.parse(fs.readFileSync(file, 'utf8')); S.G = CT.load(S.G); CT.uni(S.G); return S; }
const est = (G, c) => CT.estimate(G, c).value;
const nm = (G, o) => o.t ? (CT.readable(G, o) ? CT.tmpl(o.t).name : '(unreadable ' + CT.GAMES[CT.tmpl(o.t).game].name + ' card)') : CT.GOODS[o.type].name + (o.game ? ' ' + CT.GAMES[o.game].name : '');
function kindOf(v) { return v.role + (v.hard ? ':' + v.hard : ''); }

function step(S, it) {
  const G = S.G, logN = G.log.length, r = CT.act(G, it);
  S.moves++; if (!r.ok) S.refusals.push({ day: G.dayIdx + 1, t: it.t, error: r.error });
  for (const l of G.log.slice(logN)) S.out.push((CT.PEOPLE[l.who] ? CT.PEOPLE[l.who].name : l.who) + ': ' + l.text);
  if (!r.ok) S.out.push('  ✗ ' + it.t + ': ' + r.error);
  return r;
}
function macro(S, m) {
  const G = S.G, v = G.visit;
  if (m === 'setup') { for (const x of CT.openChecklist(G).filter(x => !x.done)) {
      if (x.k === 'crate') step(S, { t: 'unpack' });
      if (x.k === 'rack') for (const g of ['shell', 'hive', 'star']) if (G.store.backPacks[g]) step(S, { t: 'movePacks', game: g, n: G.store.backPacks[g], to: 'rack' });
      if (x.k === 'case') for (const c of G.stock.filter(c => !CT.isFloor(c.loc) && !c.graded).sort((a, b) => est(G, b) - est(G, a))) { if (CT.onGrid(G, 'case').length >= 3) break; if (c.prot !== 'hard' && c.prot !== 'mag') step(S, { t: 'sleeve', uid: c.uid, prot: 'hard' }); step(S, { t: 'place', uid: c.uid, to: 'case' }); }
      if (x.k === 'cbinder') for (const c of G.stock.filter(c => !CT.isFloor(c.loc) && !c.graded)) { if (CT.where(G, 'cbinder').length >= 4) break; if (!c.prot || c.prot === 'none') step(S, { t: 'sleeve', uid: c.uid, prot: 'penny' }); step(S, { t: 'place', uid: c.uid, to: 'cbinder' }); } }
    return; }
  if (m === 'sleeveFloor') { for (const c of CT.where(G, 'cbinder')) if (est(G, c) >= 15 && c.prot === 'penny') step(S, { t: 'sleeve', uid: c.uid, prot: 'hard' }); return; }
  if (!v) return;
  if (m === 'showBest') { const fits = G.stock.filter(c => CT.matches(G, v.wants, c) && !c.know.fake).sort((a, b) => (CT.isFloor(b.loc) - CT.isFloor(a.loc)) || est(G, b) - est(G, a)); if (fits[0]) step(S, { t: 'show', uid: fits[0].uid }); return; }
  if (m === 'sell') { const o = v.showing && v.showing !== 'packs' ? CT.findThing(G, v.showing) : null; const e = o ? (o.t ? est(G, o) : CT.goodValue(G, o)) : CT.PACK_RETAIL * v.packs; let p = Math.round(e * 1.25);
    if (!v.showing) return;
    while (G.visit && G.visit.patience > 1) { if (G.visit.bid >= e * 0.95) return step(S, { t: 'accept' }); if (!step(S, { t: 'offer', price: p }).ok) return; p = Math.max(Math.round(e * 0.95), Math.round(p * 0.93)); }
    if (G.visit) step(S, { t: 'accept' }); return; }
  if (m === 'inspectAll') { for (const c of v.cards) for (const tool of ['read', 'uv', 'loupe']) { if (!G.visit || G.visit.patience <= 3) return; if (tool === 'read' && CT.readable(G, c)) continue; if (!c.know[tool]) step(S, { t: 'inspect', uid: c.uid, tool }); } return; }
  if (/^buyBelow:/.test(m)) { const f = +m.split(':')[1]; let e = 0; for (const c of v.cards) e += est(G, c); if (v.cards.some(c => c.know.fake)) return;
    if (v.ask <= e * f && v.ask <= G.cash) return step(S, { t: 'accept' });
    let p = Math.max(1, Math.round(e * f * 0.6)); while (G.visit && G.visit.patience > 1 && p <= e * f) { if (!step(S, { t: 'offer', price: p }).ok) return; if (!G.visit) return; if (G.visit.ask <= e * f && G.visit.ask <= G.cash) return step(S, { t: 'accept' }); p = Math.round(p + Math.max(2, (G.visit.ask - p) * 0.4)); } return; }
  S.out.push('  ? unknown macro ' + m);
}
function apply(S, list) { for (const a of list) { if (typeof a === 'string') macro(S, a); else step(S, a); } }

// Play on until something needs the player.
function advance(S) {
  const G = S.G;
  for (let guard = 0; guard < 400 && G.phase !== 'end'; guard++) {
    if (G.phase === 'shop') { step(S, { t: 'next' }); continue; }
    if (G.phase === 'visit') {
      const v = G.visit, k = kindOf(v), ord = S.orders[k];
      if ((v.tellsShown > 0 && !S.orders._ignoreTells) || !ord || S.stopAll) return 'visit';
      apply(S, ord); if (G.visit === v) step(S, { t: 'pass' }); continue;
    }
    return G.phase;
  }
  return G.phase;
}

function view(S) {
  const G = S.G, D = G.week[G.dayIdx], L = [];
  if (S.out.length) { L.push('--- what happened'); L.push(...S.out.slice(-40)); S.out = []; }
  if (G.phase === 'end') { L.push('=== END: ' + JSON.stringify(G.final) + ' rating ' + G.rating.stars); return L.join('\n'); }
  L.push('=== Day ' + (G.dayIdx + 1) + '/10 ' + (D ? D.name : '') + ' · ' + G.phase.toUpperCase() + ' · cash ' + Math.round(G.cash) + '₵ · rent tonight ' + (D ? D.rent : '-') + '₵' + (G.tab ? ' · TAB ' + Math.round(G.tab) : '') + ' · rep ' + G.rep + (G.rating && G.rating.stars != null ? ' · ' + G.rating.stars.toFixed(2) + '★' : ''));
  if (D) L.push('Demand: ' + Object.keys(G.demand || D.demand).map(g => CT.GAMES[g].name + ' ×' + (G.demand || D.demand)[g]).join(', ') + (D.release ? ' · RELEASE DAY' : ''));
  if (G.phase === 'morning' || G.phase === 'close') {
    const ck = G.phase === 'morning' ? CT.openChecklist(G) : []; if (ck.length) L.push('Checklist: ' + ck.map(x => (x.done ? '✓ ' : '✗ ') + x.label + (x.n != null ? ' (' + x.n + ')' : '')).join(' · '));
    const fl = f => CT.onGrid(G, f).map(o => o.uid + ' ' + nm(G, o) + (o.t ? ' ~' + Math.round(est(G, o)) + '₵' + (o.prot ? ' [' + o.prot + ']' : '') : '') + ' tag ' + (o.tag || '-'));
    L.push('CASE (' + CT.gridFree(G, 'case') + ' cells free' + (G.store.locked ? ', locked' : '') + '): ' + (fl('case').join(' | ') || 'empty'));
    L.push('COUNTER BINDER: ' + (fl('cbinder').join(' | ') || 'empty'));
    if (G.store.up.tlbinder) L.push('TOP-LOADER BINDER: ' + (fl('tlbinder').join(' | ') || 'empty'));
    L.push('RACK: packs ' + JSON.stringify(G.packs) + ' + ' + (CT.goodsAt(G, 'rack').map(o => o.uid + ' ' + nm(G, o)).join(', ') || 'no sealed'));
    const back = G.stock.filter(c => !CT.isFloor(c.loc)).sort((a, b) => est(G, b) - est(G, a));
    L.push('BACK (' + back.length + ' cards): ' + back.slice(0, 14).map(c => c.uid + ' ' + nm(G, c) + ' ~' + Math.round(est(G, c)) + '₵ ' + c.loc + (c.prot ? '/' + c.prot : '') + (c.know.fake ? ' FAKE' : '')).join(' | ') + (back.length > 14 ? ' …' : ''));
    L.push('SHELVES: packs ' + JSON.stringify(G.store.backPacks) + ' + ' + (CT.goodsAt(G, 'shelf').concat(CT.goodsAt(G, 'safe')).map(o => o.uid + ' ' + nm(G, o) + ' ~' + Math.round(CT.goodValue(G, o)) + '₵').join(', ') || 'nothing'));
    L.push('Gear: ' + JSON.stringify(G.store.gear) + ' · crate: ' + (G.store.crate ? G.store.crate.items.length + ' items' : 'none') + ' · bulk ' + G.bulk + ' · upgrades ' + JSON.stringify(G.store.up) + ' loupe ' + JSON.stringify(G.up));
    if (G.board.length) L.push('Board: ' + G.board.map(b => b.name + ' (' + b.crimes.join(', ') + ')').join('; '));
    if (G.phase === 'close') { const nx = G.week[G.dayIdx + 1]; if (nx) L.push('Tomorrow: ' + nx.name + ' rent ' + nx.rent + ' demand ' + JSON.stringify(nx.demand)); L.push('Shop catalog: box 120, blister 60, tin 85, collector 80, premium 230, hard 6, penny 4, mag 10 · unlocks ' + Object.keys(CT.UNLOCKS).map(k => k + ' ' + CT.UNLOCKS[k].cost).join(', ') + ' · loupe ' + Object.keys(CT.UPGRADES).map(k => k + ' ' + CT.UPGRADES[k].cost).join(', ')); }
    if (G.rating && G.rating.reviews && G.rating.reviews.length) L.push('Reviews: ' + G.rating.reviews.join(' / '));
  }
  if (G.phase === 'visit') { const v = G.visit;
    L.push('CUSTOMER ' + CT.PEOPLE[v.who].name + ' (' + CT.SPECIES[v.species].name + ') · patience ' + v.patience + '/' + v.maxPatience + (v.disguised ? ' · in a hat' : '') + (CT.boardHas(G, v.who) ? ' · ON YOUR BOARD' : '') + ' · kind for orders: ' + kindOf(v));
    if (v.tellsShown) L.push('Tells: ' + v.tells.slice(0, v.tellsShown).join('; '));
    if (v.react) L.push('When you look closer: ' + v.react.join('; '));
    if (v.wants) L.push('Wants: ' + CT.wantsText(v.wants));
    for (const c of v.cards) { const e = CT.estimate(G, c); L.push('  card ' + c.uid + ' ' + nm(G, c) + ' ~' + Math.round(e.value) + '₵' + (e.grade ? ' grade~' + e.grade : '') + (c.know.fake ? ' FAKE!' : '') + ' seen:' + ['uv', 'loupe', 'read'].filter(k => c.know[k]).join('/')); }
    if (v.cards.length) L.push('Ask ' + v.ask + '₵');
    if (v.showing) L.push('Showing ' + v.showing + ' · their bid ' + v.bid + '₵');
    if (v.lot) L.push('Lot: ' + nm(G, v.lot) + ' · ask ' + v.ask + '₵ (market ~' + Math.round(CT.goodValue(G, v.lot)) + '₵)');
    const fits = v.wants ? G.stock.filter(c => CT.matches(G, v.wants, c) && !c.know.fake).slice(0, 6) : [];
    if (fits.length) L.push('You could show: ' + fits.map(c => c.uid + ' ' + nm(G, c) + ' ~' + Math.round(est(G, c)) + '₵ (' + c.loc + ')').join(' | '));
  }
  if (G.phase === 'night') { const N = G.night; L.push('Flyers: ' + N.flyers.join(' / ') + (N.pick ? ' · picked ' + N.pick : ''));
    if (N.auc) L.push('Auction: ' + N.auc.clues.join('; ') + ' · price ' + N.auc.price + ' high ' + N.auc.high);
    if (N.dig) L.push('Dig: flips ' + N.dig.flips + ' · ' + N.dig.cards.map((c, i) => i + (c.flipped ? '=' + nm(G, c) : c.hint.glint ? '*' : '')).join(' '));
    if (N.swaps) L.push('Swaps: ' + N.swaps.map((s, i) => i + ': their ' + nm(G, s.theirs) + ' ~' + Math.round(est(G, s.theirs)) + ' for your ' + (s.want ? nm(G, CT.findThing(G, s.want) || { t: null, type: 'box' }) : 'nothing')).join(' | ')); }
  return L.join('\n');
}
function show(S) { console.log(view(S)); }
function newSession(seed, answers) {
  const S = { G: CT.newGame(+seed), seed: +seed, moves: 0, refusals: [], notes: [], orders: {}, out: [], stopAll: false };
  step(S, { t: 'start', answers }); return S;
}
module.exports = { newSession, apply, advance, view, kindOf };

if (require.main !== module) { /* used as a module by playtest-llm.js */ }
else if (cmd === 'new') { const [seed, focus, split, home] = rest, S = newSession(seed, { focus, split, home }); advance(S); show(S); save(S); }
else if (cmd === 'do') { const S = loadS(); apply(S, JSON.parse(rest[0] || '[]')); advance(S); show(S); save(S); }
else if (cmd === 'order') { const S = loadS(); if (rest[1]) S.orders[rest[0]] = JSON.parse(rest[1]); else delete S.orders[rest[0]]; save(S); console.log('orders:', JSON.stringify(S.orders)); }
else if (cmd === 'note') { const S = loadS(); S.notes.push({ day: S.G.dayIdx + 1, phase: S.G.phase, text: rest[0] }); save(S); console.log('noted'); }
else if (cmd === 'look') { const S = loadS(); show(S); save(S); }
else console.log('usage: see the top of play-driver.js');
