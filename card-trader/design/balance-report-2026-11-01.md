# Card Trader v3 rev 2: balance report, Nov 1, 2026

© 2026 justaskjoe. All rights reserved.

The Balance agent's first pass (`kit/agents/balance.md`, JOB: report). Nothing on the branch was changed: no constants, no bots, no pass band. Every "expected effect" below comes from a scratch copy with one change and a rerun.

- **Base commit:** `e55bce7` (local `hunter/card-trader-v3-plan`: the CardGen economy, rent 30–120, unlocked-case theft 60%).
- **For comparison:** the pushed PR #65 head `bf6d612` gives the Nov 1 numbers (careful +411%, noupgrades +220%). There, upgrades are worth **191 points**; at `e55bce7` they're worth **60**.
- **Commands:** `node card-trader/prototype/sim.js 200` (seeds 1–200, every bot) and `python card-trader/build-and-test.py --quick`: **ALL GOOD**, every band line passes.
- **Extra numbers:** a scratch probe (not committed). It runs the same bots on the same seeds and also records day-5 value, ever-on-a-tab, thefts by time of day, fetch walkouts, eras of incoming cards and repacks.
- **Numbers are medians** of 200 runs unless marked.

## Today's sim (`e55bce7`, 200 runs)

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

## Report

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

## Failure shapes
- **Runaway compounding: yes, smaller than before.** Upgrades are worth −6 at day 5 and +60 at day 10 (191 at `bf6d612`). It's late payoff, not a daily multiplier. Purchase timing dominates, so a small price change swings it from 60 to 3.
- **Cash-flow trap: yes, late.** 28–44% of mid bots go on a tab at some point, almost always on days 8–10.
- **Dead mechanic: repacks** (0 sold even when forced). Also near zero: misprints found (0.3 a run, careful), scalper packs (0).
- **Degenerate strategy:** none seen, but not tested with single-action bots this pass.
- **Stuck runs:** none in about 30,000 scratch runs (the sim's guard and NaN checks held).

## Questions for Hunter
1. Do you want an upgrade ceiling (for example 5–40 points)? If so, I'd propose it as a band line and try the Spectrometer at 140₵.
2. "A fair day's profit" for a schemer report means ~70–90₵, which inflates growth by 40–60 points. Is that what you want, or about half a day?
3. The era target (10% / 35%) fights the economy: vintage is half the value of every shop. Keep the target and retune prices, or move the target?
4. OK to add the `floorOnly` / `backOnly` bots and the floor, fetch-loss and repack lines to `sim.js`, so those targets get measured?
