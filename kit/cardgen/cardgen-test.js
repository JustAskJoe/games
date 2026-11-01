// CardGen core tests (node): run against every profile we know, so the core never grows one game's assumptions.
// Run: node kit/cardgen/cardgen-test.js. Game-specific checks live with each game (card-trader/prototype/cardgen-test.js).
// © 2026 justaskjoe. All rights reserved.
'use strict';
const fs = require('fs'), path = require('path');
const CardGen = require('./cardgen.js');
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('FAIL ' + msg); } };
const read = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const PROFILES = [
  { name: 'card-trader', profile: read('../../card-trader/data/cardgen-profile.json'), stats: read('../../card-trader/data/template-stats.json') },
  { name: 'duel-example', profile: read('examples/duel-profile.json') },
];

// ---------- the core stays generic and browser-safe ----------
const src = fs.readFileSync(path.join(__dirname, 'cardgen.js'), 'utf8');
for (const w of ['Shellstorm', 'Hive Gambit', 'Starweave', 'Mollu', 'Zekk', 'Puffi', 'vintage', 'modern', '₵', 'card-trader', 'Ashfall', 'Ember'])
  ok(src.indexOf(w) < 0, 'core mentions "' + w + '" (game-specific words belong in a profile)');
for (const w of ['require(', 'process.', '__dirname', 'Buffer', 'document.', 'window.']) ok(src.indexOf(w) < 0, 'core uses "' + w + '" (must run as-is in a browser and in node)');

for (const T of PROFILES) {
  const P = CardGen.load(T.profile, T.stats), tag = T.name + ': ';
  ok(CardGen.validate(P).length === 0, tag + 'validates');
  const U = CardGen.build(1234, P), snap = u => JSON.stringify(u.data());
  ok(snap(U) === snap(CardGen.build(1234, P)), tag + 'same seed, same universe');
  ok(snap(U) !== snap(CardGen.build(1235, P)), tag + 'different seed, different universe');
  const back = JSON.parse(snap(U));
  ok(back.schema === CardGen.SCHEMA && back.profile === P.id && back.cards.length === U.cards.length, tag + 'data() is plain JSON with schema and profile id');
  const R = U.rarities;
  // shape
  for (const g of Object.keys(P.games)) for (const e of P.eraOrder) ok(U.sets.filter(s => s.game === g && s.era === e).length === P.eras[e].sets, tag + g + ' ' + e + ' set count');
  for (const s of U.sets) {
    const E = P.eras[s.era], main = s.cards.map(U.card).filter(c => !c.secret);
    ok(main.length === s.size && s.size >= E.size[0] && s.size <= E.size[1], tag + s.id + ' size');
    for (const r of R) { const sh = main.filter(c => c.rarity === r).length / main.length; ok(Math.abs(sh - (E.mix[r] || 0)) <= 1 / main.length + 0.02, tag + s.id + ' mix ' + r); }
    ok(new Set(main.map(c => c.name)).size === main.length, tag + s.id + ' names unique in set');
    ok(main.every(c => c.base > 0 && c.printings[0] === 'std'), tag + s.id + ' cards have a value and a standard print');
  }
  // pulls: 10,000 packs per set match the slot tables
  let worst = 0;
  for (const s of U.sets) {
    const slots = P.eras[s.era].pack, cnt = slots.map(() => ({})), rnd = { _s: CardGen.hash(s.id) };
    for (let i = 0; i < 10000; i++) {
      const out = U.openPack(U.makePack(s.id, rnd)); let j = 0;
      slots.forEach((sl, si) => { for (let k = 0; k < sl.n; k++, j++) { const c = U.card(out[j].id), key = (c.secret ? 's' : c.rarity) + ':' + (P.eras[s.era].runs ? 'std' : out[j].p) /* print runs restamp std pulls */; cnt[si][key] = (cnt[si][key] || 0) + 1; } });
    }
    slots.forEach((sl, si) => { const tot = sl.t.reduce((a, e) => a + e[2], 0), n = 10000 * sl.n;
      for (const e of sl.t) { const p = e[2] / tot, obs = (cnt[si][e[0] + ':' + e[1]] || 0) / n, tol = 4 * Math.sqrt(p * (1 - p) / n) + 0.002; worst = Math.max(worst, Math.abs(obs - p) / tol); ok(Math.abs(obs - p) <= tol, tag + s.id + ' slot ' + si + ' ' + e[0] + ':' + e[1]); } });
  }
  console.log(tag + U.cards.length + ' cards, ' + U.sets.length + ' sets; pull sims worst at ' + (worst * 100).toFixed(0) + '% of tolerance');
  // products, prices, helpers
  for (const s of U.sets) for (const t of U.sealedTypes) ok(U.sealedPrice(s.id, t, 0) > 0, tag + s.id + ' ' + t + ' has a price');
  for (const t of U.sealedTypes) { const o = U.openSealed(U.sets[0].id, t, 9); ok(o.packs.length === P.sealed[t].packs && o.promos.length === (P.sealed[t].promo || 0) + (P.sealed[t].over || 0), tag + t + ' opens to its contents'); }
  const top = R[R.length - 1], hi = U.search({ min: R[R.length - 2] });
  ok(hi.length > 0 && hi.every(c => U.rank[c.rarity] >= R.length - 2), tag + 'search min rarity');
  ok(U.search({ rarity: top, limit: 3 }).length <= 3, tag + 'search limit');
  const c0 = U.search({ rarity: top })[0];
  ok(U.price(c0.id, 'std', null, 0, 2) > U.price(c0.id, 'std') * 1.99, tag + 'market multiplies price');
  const G = { _s: 5 }, d = U.draw(G);
  ok(d && U.card(d.id) && G._s !== 5, tag + 'draw uses and advances a G-style RNG state');
  ok(typeof U.weigh(U.makePack(U.sets[0].id, 3)).tier === 'string', tag + 'weigh always answers');
  const rp = U.repack({ packs: 10, perPack: 5, hits: [5, 5], floor: 1 });
  ok(U.repackJudge(rp, { oneIn: 5, hitMin: 5 }).honest && !U.repackJudge(rp, { oneIn: 2, hitMin: 5 }).honest, tag + 'repack judging');
}

// ---------- the schema check speaks plainly ----------
const base = PROFILES[1].profile, broke = (fn, want) => { const P = JSON.parse(JSON.stringify(base)); fn(P); const e = CardGen.validate(P); ok(e.some(x => x.indexOf(want) >= 0), 'schema error mentions "' + want + '" (got: ' + e.join(' | ') + ')'); };
broke(P => { P.schema = 2; }, 'schema: must be 1');
broke(P => { delete P.id; }, 'id: needs');
broke(P => { P.eras.core.pack[2].t[0][1] = 'glitter'; }, 'printing "glitter" isn\'t in eras.core.printings');
broke(P => { P.eras.core.pack[0].t[0][0] = 'x'; }, 'rarity "x" isn\'t in rarities');
broke(P => { P.eras.core.mix.c = 0.9; }, 'should add up to 1');
broke(P => { delete P.games.ember.lang.kinds; }, 'games.ember.lang.kinds');
broke(P => { P.eraOrder.push('later'); }, 'eras.later: listed in eraOrder but not defined');
broke(P => { P.eras.core.live = true; }, 'release window per set');
broke(P => { P.sealed.box.msrp = 0; }, 'sealed.box.msrp');
broke(P => { P.rarity.base.l = -1; }, 'rarity.base.l');
broke(P => { P.eras.core.pack[0].t[0][0] = 's'; }, 'this era has no secrets');
let threw = null; try { CardGen.load(Object.assign({}, base, { schema: 0 })); } catch (e) { threw = e; }
ok(threw && /problem/.test(threw.message) && threw.problems.length >= 1, 'load throws a readable error with .problems');
ok(CardGen.validate(null)[0].indexOf('not a JSON object') >= 0, 'validate(null)');

// ---------- the Workshop tool carries the current core and examples ----------
const tool = fs.readFileSync(path.join(__dirname, 'tool.html'), 'utf8'), between = (a, b) => { const i = tool.indexOf(a), j = tool.indexOf(b, i); return i < 0 || j < 0 ? null : tool.slice(i + a.length, j); };
ok(between('/*CARDGEN-CORE*/', '/*END-CARDGEN-CORE*/') === '\n' + src + '\n', 'tool.html has the current core (run node kit/cardgen/build-tool.js)');
ok(tool.indexOf('"id":"duel-example"') >= 0 && tool.indexOf('"id":"card-trader"') >= 0, 'tool.html has both example profiles');
ok(!/(src|href)=["']https?:/i.test(tool) && !/fetch\(|XMLHttpRequest|@import/i.test(tool), 'tool.html makes no external requests');

console.log('\n' + passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
