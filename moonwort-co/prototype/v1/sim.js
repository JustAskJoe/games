// Moonwort & Co. sim: checks the brewing space is fair. Run: node sim.js
// Pass band: every trouble's best brew can be made from the starting pantry (plus the hedgerow) on both a waxing and
// a waning moon, by several different recipes; every brew is reachable; a sensible bot finishes 3 days.
// © 2026 justaskjoe. All rights reserved.
const D = require('./data.js');
const MW = require('./engine.js');

let fails = 0;
const check = (ok, what) => { console.log((ok ? '  ok   ' : '  FAIL ') + what); if (!ok) fails++; };
const skies = [{ waxing: true, name: 'waxing' }, { waxing: false, name: 'waning' }];
// Everything a player could have by day 3 without the garden: start pantry + 3 days of autumn hedgerow.
const pantry = Object.assign({}, D.START.pantry);
for (const id of ['nettle', 'yarrow', 'dandelion', 'rose']) pantry[id] = (pantry[id] || 0) + 2;

// 1. Every brew can be made at all (from everything, 3 of each).
const all = {};
for (const i of D.INGREDIENTS) if (!i.loreOnly) all[i.id] = 3;
for (const b of D.BREWS) {
  const n = MW.solutions(all, skies[0], b.id, 400).length + MW.solutions(all, skies[1], b.id, 400).length;
  check(n >= 3, `${b.name}: ${n >= 400 ? '400+' : n} recipes from the full herb list`);
}

// 2. Every trouble's best brew from the starting pantry + hedgerow, on either moon, several ways.
for (const [di, day] of D.DAYS.entries()) for (const tr of day.troubles) {
  for (const s of skies) {
    const n = MW.solutions(pantry, s, tr.want, 50).length;
    check(n >= 2, `day ${di + 1} ${tr.v} → ${MW.BREW[tr.want].name} (${s.name} moon): ${n >= 50 ? '50+' : n} ways`);
  }
}

// 3. Tutorial: the first trouble has a one- or two-herb answer in the starting pantry.
const quick = MW.solutions(D.START.pantry, skies[0], D.DAYS[0].troubles[0].want, 500).filter(r => r.length <= 2);
check(quick.length >= 1, `first villager solvable with 1-2 starting herbs (${quick.length} ways, e.g. ${quick[0] ? quick[0].map(x => x.proc + ' ' + x.id).join(' + ') : '-'})`);

// 4. A sensible bot finds every trouble's best brew across 3 days, both moons: it uses its most plentiful herbs
// first and plants a calming and a warming seed each dusk.
const scarcity = (G, sol) => sol.reduce((s, it) => s + 1 / G.pantry[it.id], 0);
for (const s of skies) {
  const G = MW.newGame('cat', new Date(Date.UTC(2026, 10, 2)));
  let best = 0, total = 0;
  while (!G.done) {
    MW.dawn(G); MW.forage(G, new Date(Date.UTC(2026, 10, 2)));
    MW.troubles(G).forEach((tr, i) => {
      const sol = MW.solutions(G.pantry, s, tr.want, 300).sort((a, b) => scarcity(G, a) - scarcity(G, b))[0];
      const res = sol ? MW.brew(G, sol, s) : MW.brew(G, [{ id: Object.keys(G.pantry).find(k => G.pantry[k] > 0), proc: 'steep' }], s);
      if (MW.serve(G, i, res, G.started + 1000) === 'best') best++;
      total++;
    });
    ['chamomile', 'garlic', 'lemon_balm'].forEach((id, p) => MW.plant(G, p, id));
    MW.endDay(G);
  }
  check(best === total, `sensible bot, ${s.name} moon: ${best}/${total} best brews, ${G.coin} coin, trust ${JSON.stringify(G.trust)}`);
}

// 5. Duds happen: a careless mix is a named dud, never a crash.
const dud = MW.resolve([{ id: 'ginger', proc: 'grind' }, { id: 'garlic', proc: 'grind' }, { id: 'thyme', proc: 'grind' }], skies[0]);
check(!dud.brew && !!dud.name, `ginger + garlic + thyme, all ground → ${dud.name}`);

// 6. Pillow-only herbs (mugwort) never end up in a drink, in any mix of up to 3 herbs on either moon.
{
  const others = D.INGREDIENTS.filter(i => !i.loreOnly && !i.outerOnly).map(i => i.id);
  const procs = D.PROCESSES.map(p => p.id);
  let drinks = 0, mixes = 0;
  for (const outer of D.INGREDIENTS.filter(i => i.outerOnly)) for (const sky of skies) for (const pa of procs)
    for (const a of [null, ...others]) for (const pb of procs) for (const b of [null, ...others]) {
      if (b && !a) continue;
      const items = [{ id: outer.id, proc: pa }].concat(a ? [{ id: a, proc: pb }] : [], b ? [{ id: b, proc: 'steep' }] : []);
      const r = MW.resolve(items, sky); mixes++;
      if (r.brew && !MW.BREW[r.brew].external) drinks++;
    }
  check(drinks === 0, `pillow-only herbs never make a drink (${mixes} mixes tried)`);
}

console.log(fails ? `SIM: FAIL (${fails})` : 'SIM: PASS');
process.exit(fails ? 1 : 0);
