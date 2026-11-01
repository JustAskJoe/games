# Intergalactic Card Trader · card generator scope

© 2026 justaskjoe. All rights reserved.

**Status:** draft scope for Hunter (Nov 1, 2026). It's built alongside v3 (`design/v3-design.md`, rev 2) so that v3 can plug it in for a large jump in card variety.

**What it is:** a seeded generator that builds the whole card universe for Shellstorm, Hive Gambit and Starweave. That universe covers 3 eras, several sets per era, every card's printings and variants, pull rates, sealed products, and how prices move. Today each game has 18 hand-written cards. After this, each game has a few thousand cards, and the economy feels like the real collecting hobby.

**Where the realism comes from:** a stats **template** fitted to real card data (Zach's database, from several sources). We take only the *shape* of that data: set sizes, rarity mixes, pull rates, price spreads by rarity and variant, how prices age by era, and how sealed product appreciates. We never copy its content.

## 1. Rules (the repo is public)
- **No real names, art, set names, logos or card text** in the game or in this repo. Generated names come from our own species-language syllables and creature words. Each generated name is checked against a private list of real card names, and any close match is rerolled (art rule R17, applied to names).
- **Raw data stays private.** It goes in `onefiftylabs/games-private` or on Hunter's or Zach's machine. Only `card-trader/data/template-stats.json` (aggregate numbers) is committed.
- **Check each data source's terms** before fitting to its prices. If a source forbids reuse, we use it only for non-price shape (set sizes, rarity mix) or drop it.
- **Small enough to ship.** The game builds the universe at runtime from a seed plus the template (a few KB), not from a big JSON list. The build stays one HTML file.

## 2. What it outputs
`CG.build(seed, template) → U` (the universe). It's deterministic: the same seed and template always give the same cards.

| Level | Contents |
|---|---|
| Game | name, species, script style, frame style per era |
| Era | vintage, mid, modern: the years-ago feel, the variant tiers it adds, and its age curve |
| Set | name (generated), symbol, size (N cards plus secrets above N), release order, rarity mix, pull rates per product, reprint flag, print-run size (scarcity) |
| Card | id, set, number, name, creature type, rarity, base value, demand profile (player staple, collector chase or bulk), and which **printings** exist |
| Printing | which variants this card has. Vintage: First Run, early print, unlimited, misprint. Mid: reverse foil, star chase, full-art, secret. Modern: rainbow, gold hyper, alt-art, illustration subset, shiny. Any era: promo stamps (prerelease, staff, event, dock), oversized, not-for-play deck copies. Each printing has a value multiplier and a scarcity |
| Sealed | 6 types per set (pack, blister, tin, collector box, booster box, premium box): contents, pull table, MSRP, appreciation curve, weight spread (heavy vs light), whether it's resealable, and whether it can be grade-sealed |
| Bulk | rates of commons and uncommons per set, and repack math (hit odds from a seeded mix) |

Helpers the engine calls:
- `U.card(id)`
- `U.set(id)`
- `U.openPack(setId, rng)` (also handles dead and heavy packs)
- `U.price(cardId, printing, grade, day, market)`
- `U.sealedPrice(setId, type, day, market)`
- `U.weigh(pack)` (the heavy vs light spread)
- `U.search(filter)` for buyers' wants ("Holo or better, vintage, Starweave")

## 3. How it plugs into v3
- **Engine:** `GAMES[g].cards`, `RARITY_BY_INDEX`, `BASE`, `rollPrint` and `crackPack` are replaced by calls into `U`. A card in stock stores `{ cardId, printing, cen, edg, sur, ... }`. Everything else (Loupe, grading, fakes, wear, haggling) keeps working on top.
- **Variants that already exist** (mirror, full-art, alt-art, First Run, serials, misprints, signatures, promos) become printings in the generator's tables, so v2's mechanics carry over.
- **Art:** per-card paintings aren't possible at this scale. Cards keep the base sheets, with:
  - a per-card crop and tint
  - era frames drawn in code (vintage: thick borders and plain foil; mid: the reverse-foil pattern; modern: borderless and textured)
  - code effects per printing

  The Lead Artist can add hero paintings for chase cards later.
- **Until the generator lands,** v3 runs on today's 18-card lists behind the same interface. Plugging in is a swap.

## 4. Fitting the template
1. A private script reads Zach's sources and writes `template-stats.json`. It contains only distributions: percentiles, ratios and curves per era, rarity and product.
2. The generator samples from those distributions.
3. Then we scale prices to the game's currency (₵) and pace, so a week's rent still means the same thing.
4. Check: a 10,000-pack simulation of each set matches the template's pull and value spreads within tolerance, and the balance sim still passes.

**Before the data arrives,** the generator runs on a hand-written template based on general hobby knowledge. Fitting to real data then changes only numbers, not code.

## 5. Tests
- **Deterministic:** the same seed gives the same universe.
- **Shape:** set sizes, rarity mixes and pull rates are within tolerance of the template.
- **Value:** era value shares are about right. For example, vintage is about 10% of incoming cards but about 35% of value.
- **Names:** no generated name is within edit distance 2 of a real card name (checked privately against the blocklist; only a pass or fail is committed).
- **Budget:** the generator code and template stay under about 60 KB in the build.
- **Balance:** `build-and-test.py` passes with the generator plugged in.

## 6. Holes to settle (Hunter)
1. **Size:** about how many sets per era and cards per set? (Suggested: 3 sets per era per game, 80–150 cards plus secrets. That's about 1,000–1,300 per game.)
2. **Names:** fully alien (can't be read until you're fluent in that species' script) or a readable translation? (Today: alien until decoded.)
3. **Store rating:** what exactly does it raise? (Suggested: more browsers, richer collectors, better sellers walking in.) And what lowers it?
4. **Vintage sealed:** how many show up per run? (Suggested: 1–3 across days 6–10, worth 5–30× a modern box.)
5. **Graded sealed:** the same graders, or a separate sealed grader?
6. **Market moves:** do generated sets get reprinted (prices drop) or banned or rotated in play (staples drop) as the run goes on?
7. **Zach's data:** what format and fields, and which sources? We'll need set lists, rarities, pull rates if there are any, and price history if the terms allow it.
