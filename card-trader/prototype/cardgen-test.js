// Intergalactic Card Trader · card generator tests (node), through the shared core in kit/cardgen/ with Card Trader's profile. Run: node card-trader/prototype/cardgen-test.js [seed]
// Determinism, shape vs the template, era value shares, 10,000-pack pull sims per set, sealed, weights, reprints, budget.
// Private name check: set CG_BLOCKLIST to a text file of real card names (one per line, never committed). Only pass/fail prints.
// © 2026 justaskjoe. All rights reserved.
'use strict';
const fs = require('fs'), path = require('path');
const CG = require('./cardgen.js');
const T = CG.config; // profile + stats, merged and validated
const SEED = +(process.argv[2] || 20261101);
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('FAIL ' + msg); } };
const pct = x => (x * 100).toFixed(1) + '%';

const t0 = Date.now(), U = CG.build(SEED, T), buildMs = Date.now() - t0;
console.log('built seed ' + SEED + ': ' + U.cards.length + ' cards, ' + U.sets.length + ' sets in ' + buildMs + ' ms');

// ---------- determinism ----------
const snap = u => JSON.stringify({ c: u.cards, s: u.sets, d: u.drops });
ok(snap(U) === snap(CG.build(SEED, T)), 'same seed gives the same universe');
ok(snap(U) !== snap(CG.build(SEED + 1, T)), 'a different seed gives a different universe');
ok(JSON.stringify(U.openPack('shell-n1', 7)) === JSON.stringify(U.openPack('shell-n1', 7)), 'same pack seed opens the same cards');
const G = { _s: 99 }, G2 = { _s: 99 };
ok(JSON.stringify(U.draw(G, {})) === JSON.stringify(U.draw(G2, {})) && G._s === G2._s, 'draw with a G-style state is deterministic and advances _s');

// ---------- shape ----------
for (const g of ['shell', 'hive', 'star']) {
  const n = U.cards.filter(c => c.game === g).length, ss = U.sets.filter(s => s.game === g);
  ok(n >= 950 && n <= 1450, g + ': ' + n + ' cards (want about 1,000-1,300)');
  for (const e of T.eraOrder) ok(ss.filter(s => s.era === e).length === T.eras[e].sets, g + ' ' + e + ' set count');
  const names = U.cards.filter(c => c.game === g).reduce((m, c) => (m[c.set + c.name] = (m[c.set + c.name] || 0) + 1, m), {});
  ok(Object.values(names).every(v => v === 1), g + ': no duplicate names inside a set');
  ok(new Set(ss.map(s => s.name)).size === ss.length, g + ': set names unique');
}
for (const s of U.sets) {
  const E = T.eras[s.era], cs = s.cards.map(U.card), main = cs.filter(c => !c.secret);
  ok(main.length === s.size && s.size >= E.size[0] && s.size <= E.size[1], s.id + ' size ' + s.size);
  ok(s.size >= 80 && s.size <= 150, s.id + ' within 80-150');
  for (const r of ['c', 'u', 'r', 'h', 'g']) { const share = main.filter(c => c.rarity === r).length / main.length; ok(Math.abs(share - E.mix[r]) <= 0.02, s.id + ' rarity ' + r + ' ' + pct(share) + ' vs ' + pct(E.mix[r])); }
  if (s.era !== 'modern') ok(s.secrets >= E.secrets[0] && s.secrets <= E.secrets[1], s.id + ' secrets ' + s.secrets);
  else ok(s.secrets >= 15 && s.secrets <= 60, s.id + ' numbered secrets ' + s.secrets);
  ok(cs.every(c => c.printings[0] === 'std' && c.printings.every(k => T.printings[k])), s.id + ' printings known');
  if (s.era === 'mid') ok(main.filter(c => c.printings.indexOf('star') >= 0).length === 1, s.id + ' has exactly one star chase');
}

// ---------- modern releases and reprint flags (decision 6) ----------
for (const g of ['shell', 'hive', 'star']) {
  const m = U.sets.filter(s => s.game === g && s.era === 'modern');
  ok(m.filter(s => s.release <= 0).length === 3, g + ': 3 modern sets out at the start');
  const rel = m.filter(s => s.release > 0).map(s => s.release).sort((a, b) => a - b);
  ok(rel.length === 2 && rel[0] >= 1 && rel[0] <= 5 && rel[1] >= 6 && rel[1] <= 10, g + ': 2 releases, one each half (' + rel + ')');
  const f = m.map(s => s.reprint);
  ok(f.filter(x => x === 'yes').length === 1 && f.filter(x => x === 'no').length === 1 && f.filter(x => x === 'drift').length === 3, g + ': 1 yes, 1 no, 3 drift');
  for (const s of m) if (s.reprint !== 'drift') ok(s.reveal >= 1 && s.reveal <= 10 && (s.reveal >= s.release + 2 || s.reveal === 10), s.id + ' reveal day ' + s.reveal);
  ok(U.sets.filter(s => s.game === g && s.era !== 'modern').every(s => s.reprint === null), g + ': only modern gets reprinted');
}
// Any modern set can be flagged, but sets out at the start are likelier (flagWeight), so a fresh release is never known-safe.
let lateFlags = 0, startFlags = 0;
for (let sd = 1; sd <= 40; sd++) for (const s of CG.build(sd).sets) if (s.reprint && s.reprint !== 'drift') { if (s.release > 0) lateFlags++; else startFlags++; }
console.log('reprint flags over 40 seeds: ' + startFlags + ' on sets out at the start, ' + lateFlags + ' on mid-run releases');
ok(lateFlags > 0 && startFlags / Math.max(1, lateFlags) > 2, 'mid-run releases can be flagged, but start sets are likelier');
const avgSealed = (flag, day) => { const l = U.sets.filter(s => s.reprint === flag); return l.reduce((a, s) => a + U.sealedPrice(s.id, 'booster', day) / U.sealedPrice(s.id, 'booster', Math.max(0, s.release)), 0) / l.length; };
const y10 = avgSealed('yes', 10), n10 = avgSealed('no', 10), d10 = avgSealed('drift', 10);
console.log('booster box day 10 vs release: reprinted ×' + y10.toFixed(2) + ', drift ×' + d10.toFixed(2) + ', never-reprinted ×' + n10.toFixed(2));
ok(y10 < 0.85 && n10 > 1.15 && y10 < d10 && d10 < n10, 'reprint trends: yes falls, no climbs, drift in between');
for (const s of U.sets.filter(s => s.reprint === 'no')) ok(U.allocation(s.id, 9) < U.allocation(s.id, Math.max(1, s.release)), s.id + ' allocation dries up (hint)');

// ---------- pull sims: 10,000 packs per set ----------
const N = 10000;
let worst = 0;
const evs = { vintage: [], mid: [], modern: [] };
for (const s of U.sets) {
  const slots = T.eras[s.era].pack, cnt = slots.map(() => ({})), rnd = { _s: CG.hash(s.id + 'sim') };
  let val = 0, runs = {};
  for (let i = 0; i < N; i++) {
    const pk = U.makePack(s.id, rnd), out = U.openPack(pk); runs[pk.run] = (runs[pk.run] || 0) + 1;
    let j = 0;
    slots.forEach((sl, si) => { for (let k = 0; k < sl.n; k++, j++) { const o = out[j], c = U.card(o.id), p = s.era === 'vintage' ? 'std' : o.p, key = (c.secret ? 's' : c.rarity) + ':' + p; cnt[si][key] = (cnt[si][key] || 0) + 1; } });
    for (const o of out) val += U.price(o.id, o.p, null, 0);
  }
  evs[s.era].push(val / N / U.sealedPrice(s.id, 'pack', 0));
  slots.forEach((sl, si) => {
    const tot = sl.t.reduce((a, e) => a + e[2], 0), draws = N * sl.n;
    for (const e of sl.t) {
      const p = e[2] / tot, obs = (cnt[si][e[0] + ':' + e[1]] || 0) / draws, tol = 4 * Math.sqrt(p * (1 - p) / draws) + 0.002;
      worst = Math.max(worst, Math.abs(obs - p) / tol);
      ok(Math.abs(obs - p) <= tol, s.id + ' slot ' + si + ' ' + e[0] + ':' + e[1] + ' ' + pct(obs) + ' vs ' + pct(p));
    }
  });
  if (s.era === 'vintage') { const R = T.eras.vintage.runs, rt = R.reduce((a, e) => a + e[1], 0); for (const e of R) ok(Math.abs((runs[e[0]] || 0) / N - e[1] / rt) < 0.02, s.id + ' print run ' + e[0]); }
}
console.log('pull sims: ' + U.sets.length + ' sets × ' + N + ' packs, worst outcome at ' + (worst * 100).toFixed(0) + '% of tolerance');
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log('pack value / pack price at day 0: vintage ' + mean(evs.vintage).toFixed(2) + ', mid ' + mean(evs.mid).toFixed(2) + ', modern ' + mean(evs.modern).toFixed(2));
ok(mean(evs.modern) > 0.45 && mean(evs.modern) < 1.15, 'a modern pack is worth a bit under its price on average (like the real hobby)');
ok(mean(evs.vintage) < 0.6 && mean(evs.mid) < 1, 'old sealed is worth more sealed than opened');
const dead = U.openPack({ set: 'star-n2', seed: 5, dead: true });
ok(['c'].indexOf(U.card(dead[dead.length - 1].id).rarity) === 0 && dead[dead.length - 1].p === 'std', 'a dead pack has a common in the rare slot');

// ---------- era value shares (incoming cards) ----------
const share = { vintage: [0, 0], mid: [0, 0], modern: [0, 0] }, dr = { _s: 4242 };
for (let i = 0; i < 10000; i++) { const o = U.draw(dr, { src: 'binder' }), c = U.card(o.id); share[c.era][0]++; share[c.era][1] += U.price(o.id, o.p); }
const totV = share.vintage[1] + share.mid[1] + share.modern[1];
for (const e of T.eraOrder) console.log('incoming ' + e + ': ' + pct(share[e][0] / 10000) + ' of cards, ' + pct(share[e][1] / totV) + ' of value');
ok(Math.abs(share.vintage[0] / 10000 - 0.10) < 0.015, 'vintage is about 10% of incoming cards');
ok(Math.abs(share.vintage[1] / totV - 0.35) < 0.08, 'vintage is about 35% of incoming value');
let shareSeeds = 0; for (const sd of [1, 2, 3, 4, 5]) { const V = CG.build(sd, T), r = { _s: sd }; let v = 0, all = 0; for (let i = 0; i < 4000; i++) { const o = V.draw(r), c = V.card(o.id), p = V.price(o.id, o.p); all += p; if (c.era === 'vintage') v += p; } if (Math.abs(v / all - 0.35) < 0.1) shareSeeds++; }
ok(shareSeeds >= 4, 'vintage value share holds across seeds (' + shareSeeds + '/5)');
ok(U.draw(dr, { src: 'pack' }) && U.card(U.draw(dr, { src: 'pack' }).id).era === 'modern', 'pack-sourced cards are modern');

// ---------- sealed ----------
const box = T.sealed.booster.msrp;
for (const s of U.sets.filter(s => s.era === 'vintage')) for (const t of Object.keys(T.sealed)) { const x = U.sealedPrice(s.id, t, 0) / box; ok(x >= 5 && x <= 30, s.id + ' vintage ' + t + ' = ' + x.toFixed(1) + '× a modern box'); }
ok(U.drops.length >= 1 && U.drops.length <= 3 && U.drops.every(d => d.day >= 6 && d.day <= 10 && U.set(d.set).era === 'vintage'), 'vintage sealed drops: 1-3, days 6-10');
const graded = U.sealedPrice('shell-v1', 'booster', 0, 1, { grade: { co: 'halo', grade: 10 } }), plain = U.sealedPrice('shell-v1', 'booster', 0);
ok(graded > plain * 1.5, 'graded sealed (Halo 10) is worth more');
ok(Object.keys(T.sealed).length === 6, '6 sealed types');
const opened = U.openSealed('hive-v2', 'booster', 11);
ok(opened.packs.length === 6 && opened.packs.every(p => p.run === opened.packs[0].run), 'a vintage box is one print run');
const prem = U.openSealed('star-n1', 'premium', 12);
ok(prem.packs.length === 8 && prem.promos.length === 3 && T.printings[prem.promos[2].p].big, 'premium box: 8 packs, 2 promos, 1 oversized');

// ---------- heavy vs light ----------
const wt = era => { const s = U.sets.find(x => x.era === era), rnd = { _s: 77 }, b = { heavy: [0, 0], light: [0, 0], mid: [0, 0] }; let hits = 0;
  for (let i = 0; i < 4000; i++) { const p = U.makePack(s.id, rnd), h = U.packHit(U.openPack(p)), w = U.weigh(p); b[w.tier][0]++; if (h) { b[w.tier][1]++; hits++; } }
  return { heavy: b.heavy[1] / Math.max(1, b.heavy[0]), light: b.light[1] / Math.max(1, b.light[0]), base: hits / 4000, n: b }; };
// modern packs read the same whatever is inside: most land in 'light' (no foil weight), and its hit rate matches the base rate
const wv = wt('vintage'), wm = wt('modern');
console.log('weighing vintage packs: heavy ' + pct(wv.heavy) + ' hit, light ' + pct(wv.light) + ' hit (base ' + pct(wv.base) + '); modern light ' + pct(wm.light) + ' (base ' + pct(wm.base) + ')');
ok(wv.heavy > 0.8 && wv.light < 0.1, 'vintage weight gives the hit away');
ok(wm.n.light[0] > 3000 && Math.abs(wm.light - wm.base) < 0.04, 'modern packs are weight-balanced');
const dp = { set: 'shell-v1', seed: 123, run: 'std' }; let deadLight = 0;
for (let i = 0; i < 300; i++) { dp.seed = i; dp.dead = true; if (U.weigh(dp).tier !== 'heavy') deadLight++; }
ok(deadLight > 285, 'searched (dead) vintage packs read light');

// ---------- prices ----------
const ch = U.search({ era: 'modern', min: 'h', printing: 'gold' })[0];
ok(ch && U.price(ch.id, 'gold') > U.price(ch.id, 'std') * 3, 'gold hyper is a big multiple of the standard print');
const vh = U.search({ era: 'vintage', min: 'h' })[0];
ok(U.price(vh.id, 'std', { co: 'halo', grade: 10 }) / U.price(vh.id, 'std') > U.price(ch.id, 'std', { co: 'halo', grade: 10 }) / U.price(ch.id, 'std'), 'condition swings vintage harder');
ok(U.price(vh.id, 'std', null, 0, { demand: { [vh.game]: 1.5 } }) > U.price(vh.id, 'std') * 1.49, 'market demand multiplies price');
ok(U.price(vh.id, 'first') > U.price(vh.id, 'early') && U.price(vh.id, 'early') > U.price(vh.id, 'std'), 'First Run > early print > unlimited');

// ---------- search, bulk, repacks ----------
const want = U.search({ game: 'star', era: 'vintage', min: 'h' });
ok(want.length > 0 && want.every(c => c.game === 'star' && c.era === 'vintage' && 'hg'.indexOf(c.rarity) >= 0), 'search: "Holo or better, vintage, Starweave"');
ok(U.search({ day: 1, era: 'modern' }).every(c => U.set(c.set).release <= 1), 'search hides unreleased sets');
const bulkShare = U.cards.filter(c => c.era === 'modern' && U.isBulk(c.id)).length / U.cards.filter(c => c.era === 'modern' && 'cu'.indexOf(c.rarity) >= 0).length;
ok(bulkShare > 0.5, 'most modern commons and uncommons are bulk (' + pct(bulkShare) + ')');
const plan = { packs: 20, perPack: 10, hits: [40, 40, 60, 100], floor: 3 };
ok(U.repackJudge(plan, { oneIn: 5, hitMin: 40 }).verdict === 'draw', 'honest repack with a decent floor is a draw');
ok(U.repackJudge(plan, { oneIn: 3, hitMin: 40 }).verdict === 'scam', 'repack below its sign is a scam');
ok(U.repackJudge(Object.assign({}, plan, { floor: 0 }), { oneIn: 5, hitMin: 40 }).verdict === 'fair', 'stingy floor is only fair');
const rp = U.repack(plan), rr = { _s: 3 }; let got = 0, opens = 0; while (rp.left) { got += U.repackOpen(rp, rr).hit; opens++; }
ok(opens === 20 && got === 240, 'repacks hold exactly their hits');
ok(JSON.parse(JSON.stringify(rp)).left === 0, 'repack plans are plain JSON');

// ---------- names ----------
const any = U.cards[0].name, U2 = CG.build(SEED, T, { blocklist: [any] });
ok(!U2.cards.some(c => CG.near(c.name.toLowerCase().replace(/[^a-z0-9]/g, ''), any.toLowerCase().replace(/[^a-z0-9]/g, ''), 2)), 'blocklist hook rerolls near matches (' + U2.rerolls + ' rerolls)');
ok(CG.near('kitten', 'sitting', 3) && !CG.near('kitten', 'sitting', 2), 'edit distance cutoff');
const bl = process.env.CG_BLOCKLIST;
if (bl && fs.existsSync(bl)) {
  const list = fs.readFileSync(bl, 'utf8').split(/\r?\n/).filter(Boolean), V = CG.build(SEED, T, { blocklist: list });
  const near = V.cards.concat(V.sets).filter(c => list.some(b => CG.near(c.name.toLowerCase().replace(/[^a-z0-9]/g, ''), b.toLowerCase().replace(/[^a-z0-9]/g, ''), 2))).length;
  ok(near === 0, 'private name check'); console.log('private name check: ' + (near ? 'FAIL' : 'pass'));
} else console.log('private name check: skipped (set CG_BLOCKLIST to the private list)');

// ---------- budget ----------
const bytes = ['cardgen.js', '../../kit/cardgen/cardgen.js'].reduce((a, f) => a + fs.statSync(path.join(__dirname, f)).size, 0) + Buffer.byteLength(JSON.stringify(require('../data/cardgen-profile.json'))) + Buffer.byteLength(JSON.stringify(require('../data/template-stats.json')));
console.log('budget: core + wrapper + profile + stats (minified JSON) = ' + (bytes / 1024).toFixed(1) + ' KB');
ok(bytes < 60 * 1024, 'generator + profile + stats under 60 KB');
ok(buildMs < 1500, 'builds in under 1.5 s (' + buildMs + ' ms)');

console.log('\n' + passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
