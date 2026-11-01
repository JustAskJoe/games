# Card Trader v3 rev 2: balance report, Nov 1, 2026

© 2026 justaskjoe. All rights reserved.

The Balance agent's first pass (`kit/agents/balance.md`). It started as JOB: report; Hunter then asked for tuning ("push harder on balancing"). Every "expected effect" below comes from a scratch copy with one change and a rerun. No bots, seeds or band lines were changed.

## Tuned (applied in this PR)
Four constants in `prototype/engine.js`, applied smallest first, with the full band rerun after each. Every step passed.

| Step | Change | Target it serves | Result after the step (200 runs) |
| --- | --- | --- | --- |
| 1 | Informing a victim: +3 → **+4** rep | "Informing a victim gains about 4 rep" | Within noise (careful 210, noupgrades 171) |
| 2 | Distraction thieves now succeed **70%** of the time on an unwatched fetch (was always) | "Distraction thieves succeed about 70%" | 2.18 of 3.0 succeed a run (73%) |
| 3 | Unlocked case overnight theft: 60% → **100%** of nights from day 3 | "An unlocked floor loses about 1 item a day" | Greedy loses 7.5 a run (0.94 a night), 13% of final (band 5–15%) |
| 4 | `RENT10` 30, 40, 50, 60, 70, 80, 90, 100, 110, 120 → **30, 40, 50, 55, 60, 65, 70, 80, 85, 90** | Cash-flow: a good-but-not-perfect player should rarely be broke | Tab at end: noupgrades 13 → 10%, lazy 22 → 10%, naive 30 → 14%, paranoid 55 → 32% |

Two other rent curves were tried for step 4:
- **Days 8–10 only** (… 90, 95, 100): tabs barely moved (lazy 21%).
- **Fully flat** (30 … 90): about the same tabs as the chosen curve, but every bot inflates and upgrades fall to +22.

**After tuning** (`python card-trader/build-and-test.py`, full run with the browser walkthrough): **ALL GOOD**.

| Bot | Before | After | Tab at end, before → after |
| --- | --- | --- | --- |
| careful | +222% | +231% | 2 → 2% |
| noupgrades | +162% | +210% | 13 → 10% |
| lazy | +99% | +128% | 22 → 10% |
| greedy | +127% | +132% (13% stolen) | 9 → 3% |
| paranoid | +50% | +73% (2.04★ vs 4.26★) | 55 → 32% |
| naive | +111% | +140% (22% stolen) | 30 → 14% |
| sloppy | −120% | −95% | 97 → 95% |

Careful beats sloppy 98%.

**Side effect:** Loupe upgrades are now worth **+21** (was +60). Easier rent helps the no-upgrade shop most. That's still well above the band floor of 5, and it answers most of the runaway worry without touching upgrade prices.

**Not tuned (needs Hunter):**
- Spectrometer price / an upgrade ceiling
- Schemer bounty size
- Era weights (the target fights the economy)
- Repacks (cause not found)
- New sim bots and lines for the unmeasured targets

The tables below are the report as first run, before tuning.

## Before tuning

- **Base commit:** `e55bce7` (the CardGen economy, rent 30–120, unlocked-case theft 60%). Rebased onto the pushed `42eac6e`; its only engine-side change (a CardGen price clamp) leaves the sim identical.
- **For comparison:** the pushed PR #65 head `bf6d612` gives the Nov 1 numbers (careful +411%, noupgrades +220%). There, upgrades are worth **191 points**; at `e55bce7` they're worth **60**.
- **Commands:** `node card-trader/prototype/sim.js 200` (seeds 1–200, every bot) and `python card-trader/build-and-test.py --quick`: **ALL GOOD**, every band line passes.
- **Extra numbers:** a scratch probe (not committed). It runs the same bots on the same seeds and also records day-5 value, ever-on-a-tab, thefts by time of day, fetch walkouts, eras of incoming cards and repacks.
- **Numbers are medians** of 200 runs unless marked.

### Sim before tuning (`e55bce7`, 200 runs)

| Bot | Gain day 5 | Gain day 10 | Tab at end | Ever on a tab | Rating | Stolen (% of final) |
| --- | --- | --- | --- | --- | --- | --- |
| careful | +110% | +222% | 2% | 7% | 4.37 | 0% |
| noupgrades | +116% | +162% | 13% | 28% | 4.26 | 0% |
| lazy | +79% | +99% | 22% | 41% | 3.27 | 14% |
| greedy | +105% | +127% | 9% | 22% | 4.16 | 7% |
| paranoid | +62% | +50% | 55% | 69% | 2.07 | 0% |
| naive | +103% | +111% | 30% | 44% | 3.74 | 26% |
| sloppy | −23% | −120% | 97% | 98% | 3.16 | 75% |

Careful beats sloppy in 97% of seeds. When a tab first opens, it's on day 8–9 for every mid bot (median).

**Noise:** a change that barely touches play still moves medians by about ±10 points and tab rates by about ±6, because the seeded RNG takes a different path. For example, +1 rep for informing moved careful −12 and noupgrades +9. Treat effects under ~10 points as noise.

### Target table (before tuning)

| Target | Current | Suspected cause (tested) | Suggested change | Expected effect (scratch rerun, 200 runs) |
| --- | --- | --- | --- | --- |
| Loupe upgrades worth 5+ points (no ceiling) | **+60** (careful 222 vs noupgrades 162). Day 5: **−6**. Was 191 at `bf6d612`. | Late payoff after an early cash cost. Each upgrade bought alone: Spectrometer +31, Print Lens +11, Steady Hands +9; all three +60 (not additive). Value is very sensitive to *when* the Spectrometer arrives. | Spectrometer 70₵ → 140₵, **if** you want a ceiling around 40. | +37 (careful 199%). At 210₵: +3. Lens 50 → 100₵ alone: +9, because it delays the Spectrometer. Too steep to tune by price alone. |
| Mid bots rarely broke (cash-flow) | Tab at end: noupgrades 13%, lazy 22%, naive 30%, paranoid 55%. Ever on a tab: 28 / 41 / 44 / 69%. | Late rent. Tabs open on days 8–9, when rent is 100–120₵. Start cash 210 → 260₵: no help (noupgrades 16%, naive 35%). Tab paydown threshold 60 → 30₵: no change at all. | `RENT10` days 8–10: 100, 110, 120 → 90, 95, 100. | Tab at end: noupgrades 11%, lazy 19%, naive 26%, paranoid 44%. Gains +4 to +11. Band still passes. A flatter whole curve (30…90) cuts tabs to 4 / 10 / 18 / 37%, but careful goes to +255%, upgrades drop to 44 and greedy theft to 5% (the band's edge). |
| Floor-only player runs out of room by day 4 | **Not measured.** Proxy: things owned exceed floor capacity (case 24 + rack 16 + counter binder 18) on day 5 (noupgrades) and day 7 (careful). | No floor-only bot. | Add a `floorOnly` bot and a "floor full on day N" line to `sim.js`. | n/a |
| Fetching everything from the back loses ~15% of sales to patience | **Not measured directly.** Share of visits with a fetch that end in a walkout: lazy (keeps everything in the back) 31%, greedy 21%, paranoid 17%, noupgrades 13%, careful 1%. | Inbox fetch 1 → 0.5: lazy 31 → 29%, noupgrades 13 → 7%. Shelf fetch 2 → 1: no change (nobody fetches from shelves). The cause for lazy isn't confirmed. Careful's 1% suggests Steady Hands is saving patience. | Add a `backOnly` bot and a "sales lost to fetch walkouts" line first, then tune `FIX.bbinder.fetch` / `FIX.inbox.fetch`. | n/a |
| Browsers make 30–40% of single sales | careful 37% (noupgrades 41, greedy 33, paranoid 27) | on target | none | n/a |
| Careful loses under 2% to wear | 2.1% (−5₵, the same as at `bf6d612`) | The share rose because careful holds less stock value under CardGen, not because of more wear. `WEAR_DAY` 0.12 → 0.10 gives 2.0%. | None. It's a denominator effect. | n/a |
| Reporting a schemer pays about a fair day's profit | Bounty **18₵** (9₵ for a hard case) vs a median day's value gain of **90₵** (careful) or **71₵** (noupgrades). | `BOUNTY.schemer` | `BOUNTY.schemer` 18 → somewhere around 40–60. Ask Hunter: careful collects ~10 bounties a run (thieves and schemers together). | At 60: careful +284% (+62), noupgrades +208% (+46), paranoid +91% (+41). Paranoid's rating stays at 2.03. Growth inflates a lot. |
| Reporting a victim costs ~8 rep | −8 rep, −0.2★ (code) | on target | none | n/a |
| Informing a victim: ~+4 rep, 30% grateful | +3 rep, 30% (code) | `inform` gives +3 | +3 → +4 | Within noise (careful 210, noupgrades 171) |
| Unlocked floor loses ~1 item a day once thieves start | Unlocked case overnight: **0.56 a night** (greedy 4.5 over nights 3–10). Rack by day, unwatched: naive 9.0 a run (~0.9 a day). | Nightly case theft roll 0.6 | 0.6 → 1.0 | Greedy 7.5 a run (0.94 a night), 12% of final (band 5–15% holds), greedy +115% (−12) |
| Distraction thieves succeed ~70% when you fetch with 2+ tells | **100%** by rule: any unwatched fetch is a theft. Naive: 89% got something; the rest had nothing to take. | No roll in the code | Add a 70% roll (`R(G) < 0.7`) | 73% succeed (2.18 of 3.0 a run). Naive +106% (noise range). |
| Vintage ~10% of incoming cards, ~35% of value | **23% of cards, 52% of value** (careful; every bot is 19–26% / 45–62%) | Estate (`old`) era weights in `data/template-stats.json` `incoming.era`, plus the vintage opening focus. Binder weights barely matter. | `old` [45,40,15] → [25,45,30] | 15% of cards, 42% of value. Careful drops to **+173% (−49)**, noupgrades +140%. Reaching 10% / 35% would also need lower vintage prices. Vintage carries the economy, so this fights the 150% careful floor. |
| A seeded repack earns ~20% over its bulk sold loose | **Not measurable: dead mechanic.** Sorter bought in 2% of careful runs. Bulk peaks at 117 (end) vs the bot's 150 threshold. | A scratch bot repacking at 120 bulk made 48 repacks in 100 runs and **sold 0** (41 on the rack). Raising per-card value 0.4 → 1.0₵ still sold 0. Also, `goodValue` counts a repack's bulk at 0.4₵ a card, while loose bulk sells at 1₵. | Not confirmed. Look at `browsePick` (rack goods weigh 0.6 × appeal vs case cards × 1.3) and whether repacks ever reach a buyer. Then add a repack bot. | n/a |
| Organized beats lazy by 30+ | +63 (162 vs 99) | on target | none | n/a |
| Paranoid loses rep | 2.07★ vs 4.26★, gain +50%, 19.7 wrong calls a run | on target. Its 55% tab follows from the lost customers. | none | n/a |
| Naive loses stock | 26% of final stolen | on target | none | n/a |

Two rows touch the same thing: the rent change and the bounty change both raise every bot's gain, and so does a cheaper Spectrometer. Apply them one at a time.

## Failure shapes (before tuning; after tuning in brackets)
- **Runaway compounding: yes, smaller than before.** Upgrades are worth −6 at day 5 and +60 at day 10 (191 at `bf6d612`). It's late payoff, not a daily multiplier. Purchase timing dominates, so a small price change swings it from 60 to 3. [After tuning: +21.]
- **Cash-flow trap: yes, late.** 28–44% of mid bots go on a tab at some point, almost always on days 8–10. [After tuning, tab at end: noupgrades, lazy 10%, naive 14%, paranoid 32%.]
- **Dead mechanic: repacks** (0 sold even when forced). Also near zero: misprints found (0.3 a run, careful), scalper packs (0).
- **Degenerate strategy:** none seen, but not tested with single-action bots this pass.
- **Stuck runs:** none in about 30,000 scratch runs (the sim's guard and NaN checks held).

## Repacks (follow-up dig, Nov 1)
Target (v3-design "3. Numbers"): a seeded repack earns about 20% over selling its bulk loose. The design also says shoppers judge repacks against the posted hit sign. All runs below are scratch copies of `main` (careful bot, 200 runs). No engine or sim change is in this PR.

**Why they're dead now. There are three separate causes:**
1. **Built too late.** The careful bot waits for 150 bulk before buying the sorter, and bulk only gets there on day 9–10. Every repack the sim built was built at day 10's close, so no browser ever saw one. This is partly the bot's recipe (8 × 15 cards) and partly the slow bulk inflow.
2. **Buyers see inside the wrapper (bug vs the design).** `goodValue` (`prototype/engine.js:1236`) values a repack from its hidden contents: `per × 0.4 + (o.hit ? o.hitVal : 0)`. Packs without a hit look like 4₵, so at any sane tag only hit packs clear the browse threshold.
   - With a scratch bot that builds 4 × 10-card repacks from day 2 at 12₵: 1,628 made, 204 sold, **all 204 were hit packs**.
   - Repacks earned 83% *less* than their contents sold loose, and careful fell from +231% to +181%.
   - `repackAppeal` (line 1290) then reads a 100% hit rate on sold packs and climbs to its 1.6 cap. It rewards the leak.
3. **Even with an honest sign-based value, they lose.** Hits the shop seeds average about 57₵, but a sign-based buyer only pays for the sign's floor (12₵), so seeding a real hit loses money.

**Sign-based variants tried** (replace the hidden-contents value; `every` and `min` are the posted sign):

| Buyer's value for a repack | Tag | Sold | Payoff vs loose | Careful gain |
|---|---|---|---|---|
| Now: hidden contents | 12₵ | 204 (all hits) | −83% | +181% |
| A: `per×0.4 + min/every` | 12–16₵ | 0 | n/a | n/a |
| B: `per×1 + min/every` | 12₵ | 589 | −44% | |
| B | 16₵ | 28 | −11% | |
| C: `per×1 + 2×min/every` | 16₵ | 548 | −25% | |
| D: C × 1.3 gamble premium | 20₵ | 556 | −10% | |
| D, sign floor raised to 30₵ | 28₵ | 555 | about 0% | |

Careful's total gain stays below the no-repack +231% in every variant (196–212% across A–D). About 160 of the early-repack runs also hit "no room for 4 repacks", so shelf space caps them too.

**Proposed fix (needs Hunter's OK, not applied):**
1. Value repacks by the sign, not the contents, e.g. `(o.per||10) × 1 + premium × o.min / o.every`. Contents only matter afterwards, through the existing hit-rate check in `repackAppeal` (an honest sign earns rep, a stingy one costs it).
2. Size `premium` so an honest sign at a fair tag lands near +20% over loose. From the table, that needs roughly 1.6–2× on the hit term, or a buyer who values the hit near its real price.
3. Let the sim's careful bot buy the sorter and build small repacks early, and add a repack-payoff line to `sim.js` and the band.

## Questions for Hunter
1. Upgrades are worth +21 after tuning. Do you want a ceiling band line (for example 5–40 points)? If they should be worth more, the Spectrometer price is the lever.
2. "A fair day's profit" for a schemer report means ~70–90₵, which inflates growth by 40–60 points. Is that what you want, or about half a day?
3. The era target (10% / 35%) fights the economy: vintage is half the value of every shop. Keep the target and retune prices, or move the target?
4. OK to add the `floorOnly` / `backOnly` bots and the floor, fetch-loss and repack lines to `sim.js`, so those targets get measured?
5. Repacks: OK to make buyers value a repack by its sign instead of its hidden contents, plus a gamble premium sized for about +20% over loose? Or should repacks pay some other way (a draw that brings in more visitors, rep)?
