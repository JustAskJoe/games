// Balance sim: bots play the full 5-day week through act(). Run: node sim.js [games]
// Bots only read what a player could see (estimate(), the visit's ask/bid, patience, the morning report).
// © 2026 justaskjoe. All rights reserved.
const CT = require('./engine.js');

function bot(style) {
  const careful = style !== 'sloppy', loupe = careful, ups = style === 'careful';
  // A careful player heard the rumor and read the reprint list: never pay hype prices for the pumped card.
  const pumped = (G, c) => G.pump && G.pump.t === c.t;
  return function play(G) {
    const v = G.visit;
    if (G.phase === 'title') return CT.act(G, { t: 'start' });
    if (G.phase === 'morning') return CT.act(G, { t: 'open' });
    if (G.phase === 'shop') return CT.act(G, { t: 'next' });
    if (G.phase === 'visit') {
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
        const next = G.week[G.dayIdx + 1];
        if (next && G.cash > rent + CT.BOX.cost + 10) {
          const hot = Object.keys(next.demand).sort((a, b) => next.demand[b] - next.demand[a])[0];
          CT.act(G, { t: 'restock', game: hot });
        }
      }
      return CT.act(G, { t: 'endDay' });
    }
    if (G.phase === 'night') return playNight(G, style);
  };
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
  for (let guard = 0; G.phase !== 'end' && guard < 6000; guard++) play(G);
  if (G.phase !== 'end') throw new Error('stuck in ' + G.phase + ' (seed ' + seed + ', ' + style + ')');
  for (const k of ['cash', 'tab', 'rep']) if (!Number.isFinite(G[k])) throw new Error(k + ' is not a number');
  return G;
}

if (require.main === module) {
  const N = +(process.argv[2] || 200), styles = ['careful', 'noupgrades', 'sloppy'], res = {};
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
    console.log(`${s.padEnd(10)} median gain ${med(gains).toFixed(0)}%  tab ${Math.round(tabs / N * 100)}%  fakes sold ${avg('fakesSold')}  promos ${avg('promos')}  variants ${avg('variants')}  misprints ${avg('misprints')}  scalped ${avg('scalpedPacks')}  ranks ${JSON.stringify(ranks)}`);
  }
  console.log(`careful beats sloppy ${Math.round(carefulWins / N * 100)}%`);
}
module.exports = { run, bot };
