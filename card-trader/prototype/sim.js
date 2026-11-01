// Balance sim: bots play all 3 days through act(). Run: node sim.js [games]
// Bots only read what a player could see (estimate(), the visit's ask/bid, patience).
// © 2026 justaskjoe. All rights reserved.
const CT = require('./engine.js');

function bot(style) {
  const careful = style === 'careful', loupe = style !== 'noloupe' && style !== 'sloppy';
  return function play(G) {
    const v = G.visit;
    if (G.phase === 'title') return CT.act(G, { t: 'start' });
    if (G.phase === 'morning') return CT.act(G, { t: 'open' });
    if (G.phase === 'shop') return CT.act(G, { t: 'next' });
    if (G.phase === 'visit') {
      if (v.role === 'sell' || v.role === 'lot' || v.role === 'bulk') {
        if (loupe) {
          const order = v.cards.slice().sort((a, b) => (CT.readable(G, a) ? 1 : 0) - (CT.readable(G, b) ? 1 : 0));
          for (const c of order) for (const tool of ['read', 'uv', 'loupe']) {
            if (!G.visit || G.visit.patience <= 4) break;
            if (tool === 'read' && CT.readable(G, c)) continue;
            if (!c.know[tool]) CT.act(G, { t: 'inspect', uid: c.uid, tool });
          }
          if (!G.visit) return;
          for (const c of v.cards) if (c.know.loupe && !c.flawUsed && (Math.min(c.cen, c.edg, c.sur) <= 6 || (c.know.uv && c.fake))) CT.act(G, { t: 'flaw', uid: c.uid });
        }
        let est = 0; for (const c of v.cards) est += CT.estimate(G, c).value;
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
        if (G.packs.shell + G.packs.hive + G.packs.star === 0) return CT.act(G, { t: 'pass' });
        CT.act(G, { t: 'showPacks' });
        return haggleSell(G, CT.PACK_RETAIL * G.visit.packs, style);
      }
      // buyer
      const fits = G.stock.filter(c => CT.matches(G, v.wants, c) && !(c.know.uv && c.fake));
      if (!fits.length) return CT.act(G, { t: 'pass' });
      fits.sort((a, b) => CT.estimate(G, b).value - CT.estimate(G, a).value);
      const c = style === 'sloppy' ? fits[fits.length - 1] : fits[0];
      CT.act(G, { t: 'show', uid: c.uid });
      if (!G.visit) return;
      return haggleSell(G, CT.estimate(G, c).value, style);
    }
    if (G.phase === 'close') {
      if (careful) {
        for (const c of G.stock.slice()) {
          if (!c.know.loupe) CT.act(G, { t: 'inspect', uid: c.uid, tool: 'loupe' });
          const e = CT.estimate(G, c);
          if (e.fake) continue;
          const g = CT.trueGrade(c);
          if (!c.graded && c.know.loupe && g >= 9 && e.value >= 20 && G.cash > 15 + CT.DAYS[G.dayIdx].rent) CT.act(G, { t: 'grade', uid: c.uid, co: 'halo' });
          else if (!c.graded && e.rarity === 'c' && e.value < 2.5) CT.act(G, { t: 'toBulk', uid: c.uid });
        }
        const next = CT.DAYS[G.dayIdx + 1];
        if (next && G.cash > CT.DAYS[G.dayIdx].rent + CT.BOX.cost + 10) {
          const hot = Object.keys(next.demand).sort((a, b) => next.demand[b] - next.demand[a])[0];
          CT.act(G, { t: 'restock', game: hot });
        }
      }
      return CT.act(G, { t: 'endDay' });
    }
    if (G.phase === 'cardnight') {
      if (careful) { const g = Object.keys(G.packs).sort((a, b) => G.packs[b] - G.packs[a])[0]; CT.act(G, { t: 'cardNight', game: g, n: Math.min(3, G.packs[g]) }); }
      else CT.act(G, { t: 'cardNight', game: 'hive', n: 0 });
      return CT.act(G, { t: 'nextMorning' });
    }
  };
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
  for (let guard = 0; G.phase !== 'end' && guard < 3000; guard++) play(G);
  if (G.phase !== 'end') throw new Error('stuck in ' + G.phase + ' (seed ' + seed + ', ' + style + ')');
  for (const k of ['cash', 'tab', 'rep']) if (!Number.isFinite(G[k])) throw new Error(k + ' is not a number');
  return G;
}

if (require.main === module) {
  const N = +(process.argv[2] || 200), styles = ['careful', 'noloupe', 'sloppy'], res = {};
  for (const s of styles) res[s] = [];
  let carefulWins = 0;
  for (let i = 1; i <= N; i++) {
    const g = {}; for (const s of styles) { g[s] = run(i, s); res[s].push(g[s]); }
    if (g.careful.final.value > g.sloppy.final.value) carefulWins++;
  }
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  for (const s of styles) {
    const gains = res[s].map(G => G.final.gain / G.final.start * 100), tabs = res[s].filter(G => G.final.tab > 0).length;
    const fakes = res[s].reduce((a, G) => a + G.stats.fakesSold, 0) / N, walk = res[s].reduce((a, G) => a + G.stats.walkouts, 0) / N;
    const ranks = {}; for (const G of res[s]) ranks[G.final.rank] = (ranks[G.final.rank] || 0) + 1;
    console.log(`${s.padEnd(8)} median gain ${med(gains).toFixed(0)}%  ended with a tab ${Math.round(tabs / N * 100)}%  fakes sold ${fakes.toFixed(2)}  walkouts ${walk.toFixed(1)}  ranks ${JSON.stringify(ranks)}`);
  }
  console.log(`careful beats sloppy ${Math.round(carefulWins / N * 100)}%`);
}
module.exports = { run, bot };
