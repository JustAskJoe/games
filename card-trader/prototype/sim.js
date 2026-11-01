// Balance sim: bots play the full 10-day run through act(). Run: node sim.js [games]
// Bots only read what a player could see (estimate(), the visit's ask/bid, patience, the morning report).
// v3 back-room styles: careful and noupgrades are organized (policy, locks, a curated case, watch the floor); lazy trades
// like noupgrades but never sleeves, files or uses the case, and ignores bad actors; greedy packs the case with grails, high
// tags, no lock. Rev 2: paranoid calls security on anyone with a tell; naive never reports or watches anyone.
// © 2026 justaskjoe. All rights reserved.
const CT = require('./engine.js');

function bot(style) {
  const careful = style !== 'sloppy', loupe = careful, ups = style === 'careful', org = ['careful', 'noupgrades', 'paranoid', 'naive'].indexOf(style) >= 0;
  const watchful = ['careful', 'noupgrades', 'paranoid', 'greedy'].indexOf(style) >= 0;
  // A careful player heard the rumor and read the reprint list: never pay hype prices for the pumped card.
  const pumped = (G, c) => G.pump && G.pump.t === c.t;
  return function play(G) {
    const v = G.visit;
    if (G.phase === 'title') { const k = G.seed % 3; return CT.act(G, { t: 'start', answers: { focus: ['singles', 'sealed', 'vintage'][k], split: 'balanced', home: ['shell', 'hive', 'star'][(G.seed >> 2) % 3] } }); }
    if (G.phase === 'morning') { backRoom(G, style); setupGate(G); return CT.act(G, { t: 'open' }); }
    if (G.phase === 'shop') return CT.act(G, { t: 'next' });
    if (G.phase === 'visit') {
      // paranoid: anyone showing a tell gets security called on them
      if (style === 'paranoid' && v.tellsShown > 0 && ['thief', 'distract', 'switch'].indexOf(v.role) < 0) return CT.act(G, { t: 'security' });
      if (watchful && v.disguised && CT.boardHas(G, v.who)) return CT.act(G, { t: 'refuse' });
      if (v.role === 'weigh') return CT.act(G, { t: org ? 'sellBehind' : 'accept' });
      if (v.role === 'thief') {
        if (!watchful) return CT.act(G, { t: 'pass' });
        CT.act(G, { t: 'watch' }); if (!G.visit) return;
        if (v.hard === 'kid') return CT.act(G, { t: 'letGo', parent: true });
        if (v.hard === 'drifter') return CT.act(G, { t: 'letGo', work: G.cash > 60 });
        return CT.act(G, { t: 'security' });
      }
      if (v.role === 'distract') {
        if (watchful && v.tellsShown >= 2) { CT.act(G, { t: 'watch' }); return G.visit && CT.act(G, { t: 'pass' }); }
        const far = G.stock.find(c => !CT.isFloor(c.loc) && CT.matches(G, v.wants, c) && !c.know.fake);
        if (far && style !== 'lazy') { CT.act(G, { t: 'show', uid: far.uid }); return G.visit && CT.act(G, { t: 'pass' }); }
        return CT.act(G, { t: 'pass' });
      }
      if (v.role === 'browse') {
        if (!v.showing) return CT.act(G, { t: 'pass' });
        const o = CT.findThing(G, v.showing), tag = o && (o.tag || CT.defaultTag(G, o));
        if (!org || v.bid >= tag * 0.9) return CT.act(G, { t: 'accept' });
        CT.act(G, { t: 'offer', price: Math.round(tag * 0.97) }); return G.visit && CT.act(G, { t: 'accept' });
      }
      if (v.role === 'sealedc') {
        const g = G.goods.find(o => o.type === v.wantsGood.type && o.game === v.wantsGood.game && !o.dead);
        if (!g) return CT.act(G, { t: 'pass' });
        CT.act(G, { t: 'show', uid: g.uid }); if (!G.visit) return;
        return haggleSell(G, CT.goodValue(G, g), style);
      }
      if (v.role === 'vintage') {
        const val = CT.goodValue(G, v.lot), rent = G.week[G.dayIdx].rent;
        if (org && v.ask <= val * 0.85 && G.cash > v.ask + rent + 40) return CT.act(G, { t: 'accept' });
        if (org && G.cash > val * 0.6 + rent) { CT.act(G, { t: 'offer', price: Math.round(val * 0.6) }); if (G.visit) CT.act(G, { t: 'offer', price: Math.round(val * 0.7) }); }
        return G.visit && CT.act(G, { t: 'pass' });
      }
      if (v.role === 'reseal') {
        if (org) { CT.act(G, { t: 'inspectPacks' }); if (G.visit && G.visit.resealed) return CT.act(G, { t: 'pass' }); }
        if (G.visit && CT.act(G, { t: 'accept' }).ok) return; return G.visit && CT.act(G, { t: 'pass' });
      }
      if (v.role === 'switch') {
        if (watchful) CT.act(G, { t: 'watch' });
        const fit = G.stock.filter(c => CT.matches(G, v.wants, c) && !c.know.fake && !c.graded).sort((a, b) => CT.estimate(G, b).value - CT.estimate(G, a).value)[0];
        if (fit && G.visit) CT.act(G, { t: 'show', uid: fit.uid });
        return G.visit && CT.act(G, { t: 'pass' });
      }
      if (v.role === 'scalp') return careful ? CT.act(G, { t: 'pass' }) : CT.act(G, { t: 'accept' });
      if (v.role === 'sell' || v.role === 'lot' || v.role === 'bulk') {
        if (loupe) {
          const order = v.cards.slice().sort((a, b) => (CT.readable(G, a) ? 1 : 0) - (CT.readable(G, b) ? 1 : 0));
          for (const c of order) for (const tool of ['read', 'uv', 'loupe']) {
            if (!G.visit || G.visit.patience <= 4) break;
            if (tool === 'read' && CT.readable(G, c)) continue;
            if (!c.know[tool]) CT.act(G, { t: 'inspect', uid: c.uid, tool });
          }
          if (!G.visit) return;
          if (v.cards.some(c => c.know.fake || c.trim && c.know.loupe) && v.react) {
            const schemer = v.react.filter(x => SCHEMER.indexOf(x) >= 0).length >= 2;
            if (style === 'paranoid') return CT.act(G, { t: 'security' });
            if (watchful && schemer) return CT.act(G, { t: 'security' });
            if (watchful && !schemer && v.cards.length <= 2) return CT.act(G, { t: 'inform' });
          }
          for (const c of v.cards) if (c.know.loupe && !c.flawUsed && (Math.min(c.cen, c.edg, c.sur) <= 6 || c.know.fake)) CT.act(G, { t: 'flaw', uid: c.uid });
          if (!G.visit) return;
        }
        let est = 0; for (const c of v.cards) est += pumped(G, c) && careful ? CT.estimate(G, c).value * 0.25 : CT.estimate(G, c).value;
        if (style === 'sloppy') return v.ask <= G.cash ? CT.act(G, { t: 'accept' }) : CT.act(G, { t: 'pass' });
        const target = est * 0.6, cap = Math.min(est * 0.8, G.cash);
        if (v.ask <= target && v.ask <= G.cash) return CT.act(G, { t: 'accept' });
        let p = Math.max(1, Math.round(est * 0.42));
        while (G.visit && G.visit.patience > 1) {
          if (v.species === 'mollu') p = Math.max(10, Math.round(p / 10) * 10);
          if (p > cap) break;
          CT.act(G, { t: 'offer', price: p });
          if (!G.visit) return;
          if (G.visit.ask <= target && G.visit.ask <= G.cash) return CT.act(G, { t: 'accept' });
          p = Math.round(p + Math.max(2, (G.visit.ask - p) * 0.35));
        }
        if (G.visit) CT.act(G, { t: 'pass' });
        return;
      }
      if (v.role === 'sealed') {
        if (CT.packTotal(G) === 0 && CT.backPackTotal(G) > 0) for (const g of ['shell', 'hive', 'star']) CT.act(G, { t: 'movePacks', game: g, n: 3, to: 'rack' });
        if (CT.packTotal(G) === 0) return CT.act(G, { t: 'pass' });
        CT.act(G, { t: 'showPacks' });
        return haggleSell(G, CT.PACK_RETAIL * G.visit.packs, style);
      }
      const fits = G.stock.filter(c => CT.matches(G, v.wants, c) && !c.know.fake);
      if (!fits.length) return CT.act(G, { t: 'pass' });
      fits.sort((a, b) => CT.estimate(G, b).value - CT.estimate(G, a).value);
      const c = style === 'sloppy' ? fits[fits.length - 1] : fits[0];
      CT.act(G, { t: 'show', uid: c.uid });
      if (!G.visit) return;
      return haggleSell(G, CT.estimate(G, c).value, style);
    }
    if (G.phase === 'close') {
      if (careful) {
        const rent = G.week[G.dayIdx].rent;
        if (ups) for (const k of ['lens', 'spec', 'hands']) if (!G.up[k] && G.cash > rent + CT.UPGRADES[k].cost + 80) CT.act(G, { t: 'upgrade', k });
        if (G.dayIdx >= 1) CT.act(G, { t: 'policy', limit2: true });
        for (const c of G.stock.slice()) {
          if (!c.know.loupe) CT.act(G, { t: 'inspect', uid: c.uid, tool: 'loupe' });
          if (!c.know.uv || (G.up.spec && !c.know.spec)) CT.act(G, { t: 'inspect', uid: c.uid, tool: 'uv' });
          const e = CT.estimate(G, c);
          if (e.fake) continue;
          const g = CT.trueGrade(c);
          if (!c.graded && c.know.loupe && g >= 9 && e.value >= 20 && G.cash > 15 + rent) CT.act(G, { t: 'grade', uid: c.uid, co: 'halo' });
          else if (!c.graded && e.rarity === 'c' && e.value < 2.5) CT.act(G, { t: 'toBulk', uid: c.uid });
        }
        if (G.store.up.sorter && G.bulk >= 150) CT.act(G, { t: 'repack', n: 8, per: 15, every: 4, min: 12, price: 12 });
        const next = G.week[G.dayIdx + 1];
        if (next && G.cash > rent + CT.BOX.cost + 10) {
          const hot = Object.keys(next.demand).sort((a, b) => next.demand[b] - next.demand[a])[0];
          CT.act(G, { t: 'restock', game: hot });
        }
        // back-room spending comes after restock: packs pay rent
        const U = G.store.up;
        if (org && !U.lock && G.cash > rent + 30 + 40) CT.act(G, { t: 'unlock', k: 'lock' });
        if (org && !U.tlbinder && G.dayIdx >= 2 && G.cash > rent + 25 + 80) CT.act(G, { t: 'unlock', k: 'tlbinder' });
        if (org && !U.camera && G.dayIdx >= 3 && G.cash > rent + 60 + 120) CT.act(G, { t: 'unlock', k: 'camera' });
        if (org && !U.riser && G.goods.some(o => CT.GOODS[o.type].vintage) && G.cash > rent + 35 + 60) CT.act(G, { t: 'unlock', k: 'riser' });
        if (ups && !U.sorter && G.dayIdx >= 3 && G.bulk >= 150 && G.cash > rent + 80 + 120) CT.act(G, { t: 'unlock', k: 'sorter' });
        if (CT.pocketsFree(G, 'bbinder') < 10 && G.cash > rent + 15) CT.act(G, { t: 'unlock', k: 'binder' });
        if (org && G.dayIdx < 8 && G.cash > rent + 80) { CT.act(G, { t: 'order', item: 'poster', qty: 2 }); CT.act(G, { t: 'order', item: 'deckbox', qty: 2 }); }
        if (org && G.dayIdx >= 1 && G.dayIdx < 6 && G.cash > rent + 400) CT.act(G, { t: 'order', item: 'premium', game: hotGame(G) });
        if (style !== 'lazy') { if (G.store.gear.hard < 6 && G.cash > rent + 20) CT.act(G, { t: 'order', item: 'hard' }); if (G.store.gear.penny < 25 && G.cash > rent + 20) CT.act(G, { t: 'order', item: 'penny' }); }
      }
      return CT.act(G, { t: 'endDay' });
    }
    if (G.phase === 'night') return playNight(G, style);
  };
}
const SCHEMER = ['story changes when you ask where it\'s from', 'gets pushy the moment the lamp comes out', 'has several "perfect" copies of the same card'];
function hotGame(G) { const d = G.week[Math.min(G.week.length - 1, G.dayIdx + 1)].demand; return Object.keys(d).sort((a, b) => d[b] - d[a])[0]; }
// Morning: unpack the crate, open boxes into loose packs and fill the rack, file the inbox, then (organized/greedy)
// stock the case and counter binder at fair tags. Lazy and sloppy leave everything where it landed.
// Day 1: every shop has to set out its floor before it can open (3 in the case, 4 in the counter binder, 3 on the rack).
function setupGate(G) {
  if (G.store.crate) CT.act(G, { t: 'unpack' });
  if (G.dayIdx !== 0) return;
  for (const g of ['shell', 'hive', 'star']) if (G.store.backPacks[g]) CT.act(G, { t: 'movePacks', game: g, n: G.store.backPacks[g], to: 'rack' });
  const mine = G.stock.filter(c => !CT.isFloor(c.loc) && !c.know.fake && !c.graded).sort((a, b) => CT.estimate(G, b).value - CT.estimate(G, a).value);
  for (const c of mine) { if (CT.onGrid(G, 'case').length >= 3) break; if (c.prot !== 'hard' && c.prot !== 'mag') CT.act(G, { t: 'sleeve', uid: c.uid, prot: 'hard' }); CT.act(G, { t: 'place', uid: c.uid, to: 'case' }); }
  for (const c of mine.filter(c => !CT.isFloor(c.loc))) { if (CT.where(G, 'cbinder').length >= 4) break; if (!c.prot || c.prot === 'none') CT.act(G, { t: 'sleeve', uid: c.uid, prot: 'penny' }); CT.act(G, { t: 'place', uid: c.uid, to: 'cbinder' }); }
  for (const o of G.goods.filter(o => o.loc === 'shelf' && CT.GOODS[o.type].where.indexOf('rack') >= 0)) { if (CT.packTotal(G) + CT.goodsAt(G, 'rack').length >= 3) break; CT.act(G, { t: 'place', uid: o.uid, to: 'rack' }); }
}
function backRoom(G, style) {
  const S = G.store;
  if (style === 'lazy' && S.sleeve.penny < 1e6) CT.act(G, { t: 'sleevePolicy', penny: 1e9, hard: 1e9, mag: 1e9 });
  if (S.crate) CT.act(G, { t: 'unpack' });
  for (const o of G.goods.filter(o => o.type === 'box' && o.loc === 'shelf')) if (CT.packTotal(G) + CT.backPackTotal(G) < 10) CT.act(G, { t: 'openGood', uid: o.uid });
  if (S.crate) CT.act(G, { t: 'unpack' });
  for (const g of ['shell', 'hive', 'star']) if (S.backPacks[g]) CT.act(G, { t: 'movePacks', game: g, n: S.backPacks[g], to: 'rack' });
  if (style === 'lazy' || style === 'sloppy') return;
  CT.act(G, { t: 'autoStore' });
  const mult = style === 'greedy' ? 1.25 : 1.1, want = style === 'greedy' ? 14 : 10;
  const pool = G.stock.filter(c => c.loc !== 'case' && !c.know.fake && (style === 'greedy' || c.loc !== 'safe'))
    .map(c => [c, CT.estimate(G, c).value]).filter(([, v]) => v >= 12).sort((a, b) => b[1] - a[1]);
  for (const [c, v] of pool) {
    if (CT.onGrid(G, 'case').length >= want) break;
    if (!c.graded && c.prot !== 'hard' && c.prot !== 'mag') CT.act(G, { t: 'sleeve', uid: c.uid, prot: 'hard' });
    if (CT.act(G, { t: 'place', uid: c.uid, to: 'case' }).ok) CT.act(G, { t: 'tag', uid: c.uid, price: Math.round(v * mult) });
  }
  if (S.up.tlbinder) for (const c of G.stock.filter(c => c.loc === 'bbinder' && c.prot === 'hard' && CT.estimate(G, c).value >= 25)) CT.act(G, { t: 'place', uid: c.uid, to: 'tlbinder' });
  if (S.up.riser) for (const o of G.goods.filter(o => CT.GOODS[o.type].vintage && o.loc === 'shelf')) CT.act(G, { t: 'place', uid: o.uid, to: 'case' });
  for (const o of CT.onGrid(G, 'case').concat(CT.where(G, 'cbinder'), CT.where(G, 'tlbinder'))) if (o.t) CT.act(G, { t: 'tag', uid: o.uid, price: Math.round(CT.estimate(G, o).value * mult) });
}
function playNight(G, style) {
  const N = G.night;
  if (!N.pick) {
    const pref = ['cardnight', 'tourney', 'dig', 'auction', 'swap'];
    const order = style === 'sloppy' ? N.flyers.slice() : N.flyers.slice().sort((a, b) => pref.indexOf(a) - pref.indexOf(b));
    for (const ev of order) if (CT.act(G, { t: 'pickNight', ev }).ok) return;
    return CT.act(G, { t: 'nextMorning' }); // can't afford either flyer: skip the night
  }
  if (!N.done) {
    if (N.pick === 'cardnight') { const g = Object.keys(G.packs).sort((a, b) => G.packs[b] - G.packs[a])[0]; CT.act(G, { t: 'cardNight', game: g, n: style === 'sloppy' ? 0 : Math.min(3, G.packs[g]) }); }
    else if (N.pick === 'tourney') {
      const next = G.week[G.dayIdx + 1], g = Object.keys(next.demand).sort((a, b) => next.demand[b] - next.demand[a])[0];
      const prize = style === 'sloppy' ? null : G.stock.filter(c => !c.know.fake && !c.graded && CT.estimate(G, c).value >= 15 && CT.estimate(G, c).value <= 60).sort((a, b) => CT.estimate(G, a).value - CT.estimate(G, b).value)[0];
      CT.act(G, { t: 'tourney', game: g, prize: prize ? prize.uid : null });
    }
    else if (N.pick === 'auction') {
      const A = N.auc, guess = A.cards.length * 6 + (A.clues[2].indexOf('gold') >= 0 ? 150 : A.clues[2].indexOf('assorted') >= 0 ? -20 : 25);
      while (!N.done) { const nextP = A.high ? A.price + Math.max(5, Math.round(A.price * 0.1)) : A.price; if (style === 'sloppy' || nextP > guess * 0.75 || nextP > G.cash) { CT.act(G, { t: 'drop' }); break; } CT.act(G, { t: 'bid' }); }
    }
    else if (N.pick === 'dig') {
      const order = N.dig.cards.map((c, i) => [c, i]).sort((a, b) => (style === 'sloppy' ? 0 : (b[0].hint.glint ? 1 : 0) - (a[0].hint.glint ? 1 : 0)));
      for (const [c, i] of order) { if (N.done) break; CT.act(G, { t: 'dig', i }); }
    }
    else if (N.pick === 'swap') {
      N.swaps.forEach((s, i) => {
        const mine = s.want && G.stock.find(c => c.uid === s.want);
        if (style === 'sloppy') return CT.act(G, { t: 'swap', i, accept: true });
        for (const tool of ['loupe', 'uv']) CT.act(G, { t: 'inspect', uid: s.theirs.uid, tool });
        const good = mine && CT.estimate(G, s.theirs).value > CT.estimate(G, mine).value * 1.1;
        CT.act(G, { t: 'swap', i, accept: !!good });
      });
    }
  }
  return CT.act(G, { t: 'nextMorning' });
}
function haggleSell(G, est, style) {
  if (style === 'sloppy') return CT.act(G, { t: 'accept' });
  let p = Math.round(est * 1.3);
  while (G.visit && G.visit.patience > 1) {
    if (G.visit.bid >= est * 0.95) return CT.act(G, { t: 'accept' });
    CT.act(G, { t: 'offer', price: p });
    if (!G.visit) return;
    p = Math.max(Math.round(est * 0.9), Math.round(p * 0.92));
  }
  if (G.visit) CT.act(G, { t: 'accept' });
}

function run(seed, style) {
  const G = CT.newGame(seed), play = bot(style);
  for (let guard = 0; G.phase !== 'end' && guard < 12000; guard++) play(G);
  if (G.phase !== 'end') throw new Error('stuck in ' + G.phase + ' (seed ' + seed + ', ' + style + ')');
  for (const k of ['cash', 'tab', 'rep']) if (!Number.isFinite(G[k])) throw new Error(k + ' is not a number');
  G.simStockV = G.stock.reduce((b, c) => b + CT.trueValue(G, c, 1), 0); // while this run's card universe is loaded
  return G;
}

if (require.main === module) {
  const N = +(process.argv[2] || 200), styles = ['careful', 'noupgrades', 'sloppy', 'lazy', 'greedy', 'paranoid', 'naive'], res = {};
  for (const s of styles) res[s] = [];
  let carefulWins = 0;
  for (let i = 1; i <= N; i++) {
    const g = {}; for (const s of styles) { g[s] = run(i, s); res[s].push(g[s]); }
    if (g.careful.final.value > g.sloppy.final.value) carefulWins++;
  }
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  for (const s of styles) {
    const gains = res[s].map(G => G.final.gain / G.final.start * 100), tabs = res[s].filter(G => G.final.tab > 0).length;
    const avg = k => (res[s].reduce((a, G) => a + G.stats[k], 0) / N).toFixed(1);
    const ranks = {}; for (const G of res[s]) ranks[G.final.rank] = (ranks[G.final.rank] || 0) + 1;
    const st = k => res[s].reduce((a, G) => a + G.store.stats[k], 0) / N;
    const stockV = res[s].reduce((a, G) => a + G.simStockV, 0) / N;
    const disp = st('browseSales') / Math.max(1, st('browseSales') + st('counterCardSales')) * 100;
    const stars = res[s].reduce((a, G) => a + G.rating.stars, 0) / N;
    console.log(`${s.padEnd(10)} back room: wear -${st('wearValue').toFixed(0)}₵ (${(st('wearValue') / (stockV + st('wearValue')) * 100).toFixed(1)}% of stock)  stolen ${st('stolen').toFixed(1)} (-${st('stolenValue').toFixed(0)}₵, ${(st('stolenValue') / (res[s].reduce((a, G) => a + G.final.value, 0) / N) * 100).toFixed(0)}% of final)  display ${disp.toFixed(0)}% of singles  rating ${stars.toFixed(2)}  bounties ${st('bounties').toFixed(1)}  wrong calls ${st('wrongCalls').toFixed(1)}  fetches ${st('fetches').toFixed(1)}  switched ${st('switched').toFixed(1)}  dead packs ${st('deadPacks').toFixed(1)}  merch ${st('merchSales').toFixed(1)}`);
    console.log(`${s.padEnd(10)} median gain ${med(gains).toFixed(0)}%  tab ${Math.round(tabs / N * 100)}%  fakes sold ${avg('fakesSold')}  promos ${avg('promos')}  variants ${avg('variants')}  misprints ${avg('misprints')}  scalped ${avg('scalpedPacks')}  ranks ${JSON.stringify(ranks)}`);
  }
  console.log(`careful beats sloppy ${Math.round(carefulWins / N * 100)}%`);
}
module.exports = { run, bot };
