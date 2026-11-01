# Intergalactic Card Trader · plugging the card generator into the engine

© 2026 justaskjoe. All rights reserved.

**Status:** generator built (`prototype/cardgen.js`, `data/template-stats.json`, tests in `prototype/cardgen-test.js`). **Not plugged in yet:** `engine.js`, `ui.js`, `sim.js` and `build.py` are being rewritten for v3 rev 2 in parallel, so this doc is the exact swap for whoever lands it. Line references are to `engine.js` as of commit `5b8bae9` (rev 1 build); names will hold even if lines move. Scope and decisions: `design/card-generator.md`.

Run the tests: `node card-trader/prototype/cardgen-test.js [seed]` (about 2 s; 900+ checks). After plugging in, also run `python3 card-trader/build-and-test.py`.

## 1. Loading it

- **Node (`sim.js`, tests):** `const CG = require('./cardgen.js')`. `CG.build(seed)` finds `../data/template-stats.json` by itself, or pass the template.
- **Browser (the build):** `build.py` must inline two things before `engine.js`:
  1. `window.CG_TEMPLATE = <contents of data/template-stats.json>;`
  2. `cardgen.js`

  `CG.build(seed)` then picks up `root.CG_TEMPLATE`. Together they're about 31 KB unminified (budget 60 KB).
- **Build once per game, outside G** (G must stay plain JSON): `let U = null; function uni(G) { return U && U.seed === (G.seed >>> 0) ? U : (U = CG.build(G.seed)); }`. It's deterministic, so a loaded save rebuilds the same universe from `G.seed` in about 80 ms. Never store `U` or card objects in G; store ids.
- **RNG:** every `U` function that takes `rng` accepts `G` itself and draws from (and advances) `G._s`, the same generator the engine uses. So runs stay reproducible and saves stay JSON. A number gives a fresh stream from that seed. A function also works.

## 2. What a copy stores

Today: `c.t = 'shell-12'` (game + index into the 18-card list) and `c.v = { fin, first, set, promo, serial, err, signed }`.

After: `c.t = cardId` (for example `'star-n4-37'` = Starweave, modern set 4, card 37) and `c.p = printing` (`'std'`, `'first'`, `'rev'`, `'gold'` …). Keep `c.v` only for the per-copy extras the generator doesn't own: `serial`, `signed`, and anything fake-related. Everything else on the copy (`cen/edg/sur`, `fake`, `graded`, `know`, `trim`, `cost`, wear) is unchanged.

## 3. The swaps

| Engine today | Replace with | Notes |
|---|---|---|
| `GAMES[g].cards` (18 names) | `U.search({ game: g })`, `U.card(id).name` | `GAMES` keeps `name / species / script / blurb`. `U.games[g]` has the same plus `sets` and era `frames` |
| `RARITY_BY_INDEX(i)` | `U.card(id).rarity` | Same 5 letters `c u r h g`, so `RANK`, `RARITY_NAME` and `matches` keep working. Secrets are rarity `g` with `secret: true` |
| `BASE[rarity]` | `U.card(id).base` (raw value of the standard print at day 0) or `U.price(...)` | Per-card now, set by era, rarity, fame and demand |
| `tmpl(t)` | `U.card(t)` | Returns `{ id, set, game, era, num, name, kind, rarity, base, demand, printings, nums, secret, fame, art }`. Every `tmpl(c.t).game / .rarity / .name` call works unchanged if `tmpl = t => U.card(t)` |
| `tid`, `rollIdx(G, rarity)` | `U.draw(G, { game, rarity, src, day })` → `{ id, p }` | Picks era (by `src`), released set, card, printing |
| `rollRarity(G, rareSlot)` | gone: pack odds live in the template, per era | Sellers still choose rarity the way they do now and pass it to `draw` |
| `rollPrint(G, rarity, src)` | the `p` from `U.draw` / `U.openPack` | `src` keeps its meaning: `'binder'` (default), `'old'` (estate binders, more vintage), `'dealer'` (more promos), `'pack'` (modern only), `'promo'`. Add `signed` and `serial` on top as today |
| `crackPack(G, game, dead)` | `U.openPack(pack)` → `[{ id, p }] × 5` | Packs become objects (section 5). The dead-pack rule (rare slot → common) is built in |
| `variantMult(G, c, known)` | `U.printingMult(card, c.p)`, gated by `U.printings[c.p].see` | `see: 'loupe'` = Loupe shows it (reverse foil, First Run, stamps). `see: 'print'` = Print Lens (early print, misprint). No `see` = anyone can see it (full-art, alt-art, gold). Multiply in `serial`, `signed` and `promo` extras as today; keep `VARIANT_CAP` |
| `RAW(g)` and `GRADERS[co].mult(g)` inside value | `U.gradeMult(era, grade)` (or let `U.price` do it) | Same curves as today, now in the template. Vintage swings harder (`gradeSlope` 2.2). Keep `GRADERS` for fees and days |
| `demandOf(G, game)` and `hot` | the `market` argument | `U.price(id, p, grade, day, { demand: G.demand })` multiplies by `G.demand[card.game]`. Apply `hot` and `pumpMult` outside as now |
| `PACK_RETAIL`, `BOX.cost`, `CATALOG.box/collector` | `U.sealed[type].msrp / .cost` and `U.sealedPrice(setId, type, day, market, o)` | 6 types: `pack, blister, tin, collector, booster, premium`, each with `packs`, `promo`, `shape` (grid w×h, matching v3-design B), `reseal`, `grade` |

### Value functions, one by one

- **`trueValue(G, c)`:** `c.fake ? 0 : U.price(c.t, c.p, c.graded ? { co: c.graded.co, grade: c.graded.grade } : trueGrade(c), day, { demand: G.demand }) * hot * pump * trim * extras(c.v)`. Day = `G.dayIdx + 1` (the generator counts run days 1–10; 0 = before the run).
- **`estimate(G, c)`:** the same formula, but the rarity comes from `readable()`, the grade is the known one (7 if unknown, as now), and the printing multiplier only counts if `see` is in `c.know` (`loupe` → `know.loupe`, `print` → `know.print`). If the card isn't readable, use the median `base` of a `u` from the same era (`U.search({ era, rarity: 'u' })`, cache it) instead of `BASE.u`.
- **`sellerBelief(G, person, c)`:** as today, with `card.base` in place of `BASE[rar]`. Misread rarities (`r` and up read as `u`) use the same era median as above.
- **`dealBuy` cost split** (`BASE[...] * RAW(...)`): use `U.price(c.t, 'std', trueGrade(c))`.
- **`buyerValue`, `matches`, `wantsText`:** `matches` works through `tmpl`. New wants can use `U.search` filters (`{ game, era, min, printing, hit }`) to describe "Holo or better, vintage, Starweave" and to check a copy: `U.search(filter)` returns card objects, so test membership with a `Set` of ids, built once per want.
- **`shopValue`:** sum `trueValue`, plus `U.sealedPrice` for sealed product at today's day.

## 4. Eras, sets and the run calendar

- **Sets per game:** vintage `v1–v3`, mid `m1–m3`, modern `n1–n5`. Modern `n1–n3` are out before day 1, `n4` releases on day 2–4 and `n5` on day 6–8 (`set.release`). `U.released(day)` lists what's out, and `draw` and `search` take `day` and skip unreleased sets.
- **Reprint flags** (decision 6): per game, one modern set is `reprint: 'yes'`, one is `'no'` and three `'drift'`, each with a `reveal` day. Only sets out by day 4 (`template.reprint.flagBy`) are flagged, so the reveal plays out in the run. **Never show the flag.** The engine surfaces only hints:
  - `U.trend(set, day, kind)` / `U.sealedPrice` move: the yes set creeps up, then drops about 40% on reveal. The no set climbs about 2.5%/day, then about 6%/day after reveal.
  - `U.allocation(setId, day)` is the share of a distributor order you actually get. The no set dries up (1 → 0.2), and the yes set floods after reveal (1.5). Old eras return 0 (out of print).
  - DJ Vee and Hype Bros lines: write them from `set.reprint` and `set.reveal` in the engine (for example a true rumor 1–2 days before reveal, and the Hype Bros pushing the yes set).
- **Vintage sealed drops:** `U.drops` = 1–3 `{ day, set, type, from: 'auction' | 'estate' | 'dealer' }`, days 6–10. Each is worth 5–30× a modern booster box (`U.sealedPrice`).

## 5. Packs, sealed and weight

- **A pack is an object:** `U.makePack(setId, G)` → `{ set, seed, run }`. `run` is `'first' | 'early' | 'std'` for vintage. Its contents are fixed by `seed` when it's made, so:
  - `U.weigh(pack)` → `{ g, tier: 'heavy' | 'mid' | 'light' }`. Vintage packs give the hit away (heavy ≈ 97% hit, light < 1%). Modern packs are weight-balanced, so weighing them tells you nothing. The Scale Gang buys heavy packs, and the pack-scale unlock calls `weigh`.
  - Searching or resealing sets `pack.dead = true`. The pack then opens with a common in the rare slot and reads light.
- **`G.packs[game]` (a count) becomes a list of pack objects** (or per-set counts, plus a seed counter if you'd rather not store objects). This is the one data-shape change the engine has to make.
- **`U.openSealed(setId, type, G)`** → `{ packs: [pack], promos: [{ id, p }], pin }`. A vintage box is one print run, and the premium box adds 2 promos and 1 oversized card.
- **`U.sealedPrice(setId, type, day, market, { grade: { co, grade }, weight: tier })`:**
  - Graded sealed uses the same graders (QuikSlab, Halo) on the template's `sealedGrade` curve. A sealed grade also proves the product isn't resealed; that check stays in the engine.
  - Weight only changes the price for vintage packs.
- **Bulk:** `U.isBulk(id, p)` is true for a standard-print common or uncommon worth under 3₵ (`template.bulk`). Bulk sells for 1₵ each, in bricks of 500.
- **Repacks:** the shop builds a plan `{ packs, perPack, hits: [₵…], floor }` and posts a sign `{ oneIn, hitMin }`.
  - `U.repack(plan)` adds `ev`, `oneIn`, `fair` (ev × 1.2, the premium shoppers accept) and `loose` (the same bulk sold loose).
  - `U.repackJudge(plan, sign)` → `verdict`: `'draw'` (honest with a decent floor: rating up), `'fair'` (honest but a stingy floor) or `'scam'` (below the sign: rating down).
  - `U.repackOpen(plan, G)` deals one repack without replacement. The plan is plain JSON, so it can live in G.

## 6. Art, names and frames

- **Names:** each species' own syllables plus creature words (`CG.LANG`), shown in the game's script as now (`readable()` decodes them). The same creature recurs across sets, like a mascot.
- **Art:** `card.art = [baseIdx 0–17, hue°, cropX%, cropY%]`. `baseIdx` maps into today's 18-card art (same rarity bands as `RARITY_BY_INDEX`). Apply crop and hue in CSS or canvas.
- **Frames:** `U.games[g].frames[era]` is `thick` (vintage), `reverse` (mid) or `borderless` (modern).
- **Printings:** draw the printing effect in code from `U.printings[p]`: `foil`, `hit` and `big` flags, plus `v` hints that map to today's `fin`, `first`, `set`, `err` and `promo` drawing.
- **Set symbol:** `set.symbol = [shapeIdx 0–11, hue°]`.
- **Dock stamps:** a dock-stamped promo uses `PROMOS['dock-' + GAMES[game].species]` for its name.

## 7. Fitting the template to real data (private)

`data/template-stats.json` holds **aggregates only**. A private script, kept in `onefiftylabs/games-private` (never this repo), will write it:

1. **Read Zach's sources locally.** Check each source's terms first. A source that forbids reuse of prices feeds only non-price shape: set sizes, rarity mix and slot odds.
2. **Bucket every set into an era** by release year (vintage = the hobby's first waves, mid = the middle years, modern = the last few years).
3. **Write, per era:**
   - `size` (10th–90th percentile of main-set size), `secrets`, and `mix` (mean rarity share)
   - `pack` slot weights (pull-rate tables from opening data)
   - `assign` (share of cards per rarity that have each variant)
   - `value` and `scale` (median price per rarity, over the modern common median, then scaled so a modern pack's EV is about 0.85 of its price in ₵)
   - `rarity.sigma` (log-price spread per rarity)
   - `drift` and `walk` (median daily price change and its spread)
4. **Write the global numbers:**
   - `printings[*].m` (median price ratio of each variant to its standard print)
   - `grade.*` (graded / raw price ratios by grade)
   - `sealedMarket` and `vintageSealed` (sealed price over MSRP, by era)
   - `demand.*.p` and `fame` (how concentrated value is on the top creatures)
   - `reprint.*` (price paths of real sets around reprint announcements, as ratios)
5. **Write nothing that identifies a card, set or product:** no names, numbers, dates or ids. Round every number to 2–3 significant figures.
6. **Re-run `node cardgen-test.js`.** The tolerance tests read the template, so they follow the fit. Then tune `value` so that vintage is still about 10% of incoming cards and 35% of value (design target), and re-run `build-and-test.py`.

The private real-name blocklist sits next to that script. Run `CG_BLOCKLIST=/path/to/names.txt node cardgen-test.js` and only the pass/fail line is printed. In the game, `CG.build(seed, T, { blocklist })` rerolls any name within edit distance 2. The shipped build passes no list: names are checked once privately per template version and seed range.

## 8. Known gaps (see the PR's Watch out list)

- The reprint flags are per game: 3 yes, 3 no and 9 drift across the universe. Decision 6 could also mean one of each across all games. It's one number in the template (`reprint.count`) plus a scope change if Hunter wants that.
- The hand-written numbers are a judgement call until Zach's data lands. The value share varies by seed (about 28–40% vintage across seeds tested).
