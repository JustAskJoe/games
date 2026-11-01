# CardGen · a card universe generator for any game with cards

© 2026 justaskjoe. All rights reserved.

CardGen builds a whole collectible-card universe from a **seed** and a **profile**: factions, eras, sets, every card with its printings, pack odds, sealed products, prices that age and move day by day, bulk, repacks, and optional hidden reprint twists. The same seed and profile always give the same cards, so a game ships a few KB of JSON, not a card list.

It began as Intergalactic Card Trader's generator (`card-trader/data/cardgen-profile.json` is that game's profile). Nothing in the core knows about Card Trader: the tests run it against a second, very different example (`examples/duel-profile.json`, a 2-faction fantasy duel game with 1 era).

## Files
| File | What |
|---|---|
| `cardgen.js` | The core. Pure JS, browser-safe (no DOM, no node-only APIs). A plain `<script>` sets the global `CardGen`; `require()` works in node |
| `PROFILE.md` | **Start here for a new game.** The questions a designer answers, and how each answer maps to the profile |
| `examples/duel-profile.json` | A small complete profile to copy |
| `tool.html` | The Workshop tool: one offline page. Answer the questions or paste a profile, check it, generate, browse, download |
| `build-tool.js` | Copies the current core and the examples into `tool.html`. Run it after changing either |
| `cardgen-test.js` | Core tests against every known profile, plus schema-error and tool-sync checks |
| `WORKSHOP.md` | Notes for hosting the tool in Studio HQ's Workshop (a later PR in `JustAskJoe/forge`) |

## Use it in a game
```js
// node
const CardGen = require('../../kit/cardgen/cardgen.js');
const P = CardGen.load(require('../data/cardgen-profile.json'), require('../data/template-stats.json')); // stats optional
const U = CardGen.build(G.seed, P);
// browser: inline cardgen.js, put your profile JSON on the page, then the same two calls
```
- **`CardGen.load(profile, stats?)`** merges the stats over the profile (numbers over structure) and checks it. It throws one error listing every problem in plain words (`err.problems` is the list). `CardGen.validate(obj)` returns that list without throwing.
- **`CardGen.build(seed, P, { blocklist })`** returns `U`. The `blocklist` is a private list of real card names. Any generated name within edit distance 2 of a blocked name is rerolled. **Never commit such a list.**
- **The universe stays outside your save:**
  - Don't store `U` in your save. Store `seed` plus card ids, and rebuild with `build` (deterministic, a few ms to ~100 ms).
  - `U.data()` gives plain JSON for a download or a debug view.
- **RNG:** every `rng` argument takes your game's state object (`{ _s }`, advanced in place), a number (a fresh stream) or a function.

### What `U` gives you
| Call | Returns |
|---|---|
| `U.card(id)`, `U.set(id)`, `U.cards`, `U.sets`, `U.games`, `U.eras` | `card = { id, set, game, era, num, name, kind, rarity, base, demand, printings, nums, secret, fame, art }` |
| `U.search({ game, era, set, kind, demand, min, max, rarity, printing, hit, minValue, name, day, limit })` | Cards matching a buyer's want |
| `U.makePack(setId, rng)` → `pack`, `U.openPack(pack)` (or `openPack(setId, rng)`) | `[{ id, p }]`. Contents are fixed when the pack is made, so `U.weigh(pack)` can read heavy, mid or light first. `pack.dead = true` = searched |
| `U.openSealed(setId, type, rng)` | `{ packs, promos, pin }` |
| `U.draw(rng, { game, era, set, rarity, src, day })` | One incoming card `{ id, p }`, for sellers, binders and rewards |
| `U.price(id, printing, grade, day, market)` | Value. `grade`: `null`, a raw number, or `{ co, grade }`. `market`: a number or `{ demand: { [game]: x } }` |
| `U.sealedPrice(setId, type, day, market, { grade, weight })` | Sealed value |
| `U.trend`, `U.allocation(setId, day)`, `U.released(day)` | The economy over a run: hype, drift, reprint drops and climbs, distributor allocation |
| `U.isBulk`, `U.repack(plan)`, `U.repackJudge(plan, sign)`, `U.repackOpen(plan, rng)` | Bulk, and posted-sign repacks |

Optional parts of a profile simply switch features off. With no `weight`, packs don't read by weight. With no `reprint` or `live` era, there are no reprint twists. With no `grade` block, nothing is graded. The same goes for drops, sealed reference pricing and incoming-card weights.

## Tests
```bash
node kit/cardgen/cardgen-test.js
```
It checks:
- that the core has no game names and no node-only APIs
- that every known profile validates and builds the same universe from the same seed
- set sizes, rarity mix and 10,000-pack pull sims per set against the profile
- prices, products and helpers
- that the schema check gives the right plain-words error for a list of broken profiles
- that `tool.html` carries the current core

Each game keeps its own balance tests too (Card Trader: `card-trader/prototype/cardgen-test.js`).

## Rules (the repo is public)
- **No real IP:** no real card names, art, set names or logos. Name banks are your own made-up syllables and words.
- **Stats files hold aggregates only:** shares, ratios and curves. Raw source data stays private.
- **The schema is versioned (`"schema": 1`).** A breaking change bumps it, and `validate` says what changed.
