# CardGen · describe your card game (profile fill-in guide)

© 2026 justaskjoe. All rights reserved.

Answer these questions about your game. There are three ways to turn the answers into a profile:
- Type them into the **Answer questions** tab of `tool.html`. It writes a working profile for you.
- Paste your answers to Claude and ask for "a CardGen profile, schema 1".
- Copy `examples/duel-profile.json` and edit it by hand.

Then press **Check profile** in the tool (or run `CardGen.validate`). Every problem comes back in plain words with the exact field to fix.

Short answers are fine. Anything you leave out gets a default or switches that feature off.

## The questions

### 1. What's the game, and what do you call money?
`id` (a short slug), `name`, `currency.symbol`.

### 2. Who's in it?
The factions, species, houses or separate card games inside your world.

For each one, give:
- **A name**
- **10–20 made-up syllables** in that group's voice (soft `lu, mo, sha` vs. clicky `zz, kik, vex`). Card names are built from these.
- **8–20 kinds** of creature or character (`Knight, Drake, Imp`)
- **8–20 adjectives** (`Cinder, Molten`)
- **4–8 titles** for legends (`Queen, Warden`)
- **5–12 words** for set names (`Tides, Depths`)

These become `games.<id>.lang`. Optional `tick` (0–1) is the chance of an apostrophe between syllables (`Tik'zo`).

**No real names:** don't use real card, set or franchise names, or near copies of them.

### 3. What do cards get called?
`names.patterns` are weighted templates built from these tokens:
- `{w2}`, `{w3}`, `{w23}`: a made-up word of 2, 3 or 2–3 syllables
- `{kind}`, `{adj}`, `{title}`, `{setNoun}`: a pick from the banks above

For example: `[[45, "{w2} {kind}"], [35, "{adj} {kind}"], [20, "{kind} of {w2}"]]`.

Related settings:
- `names.hero` are the patterns for the most famous `names.heroes` characters (`"{w23}, {adj} {title}"`).
- `names.setPatterns` name the sets.
- `names.roster` is how many characters each faction has in total. They recur across sets the way mascots do. The famous ones (top of the roster) land at higher rarities and are worth more (`fame`).

### 4. What's your rarity ladder?
List it lowest first. Give each rung:
- a one-letter key and a name
- its share of a set
- a typical value in your currency

These fill `rarities`, `eras.*.mix` and `rarity.base`. Also set:
- `lowRarities`: how many of the bottom rungs are "bulk-ish"
- `hitRarity`: the rung from which a pull feels like a hit
- `secretRarity` (optional): the rung secret cards use (numbered past the set)
- `rarity.sigma`: how much values spread within a rung (0.2 = tight, 0.7 = wide)

### 5. What eras has your game been through?
List them oldest first. For each era, give:
- **A name and a short `code`** for set ids (`v`, `m`, `n`)
- **Sets per faction and set size** (`sets`, `size: [min, max]`)
- **Value** compared with the newest era (`value`, plus an optional per-rarity `scale`). Old cards are usually scarcer and worth more.
- **Which special printings it adds** (`printings`, always starting with `"std"`). Use `assign` when only some cards get a printing: a share per rarity, or a whole number for an exact count.
- **How prices drift per day** (`drift: [singles, chase singles, sealed]`) and how noisy they are (`walk`)
- **Condition** (`gradeSlope`): how hard condition swings value (vintage: 2+)

Optional features:
- `secrets: [min, max]`: secret cards numbered past the set
- `numbered`: printings that get their own secret numbers
- `runs`: print runs that stamp a whole pack, like `[["first", 10], ["std", 90]]`
- `errPrinting` / `errRate`: famous misprints
- `live: true`: an era that's still being released. It needs `release`, one `[first day, last day]` window per set (negative = already out). It also needs a top-level `reprint` block if some sets get reprinted (hidden) and others never are.

### 6. What makes a card collectible in your world?
These are the special printings: foils, alt-arts, stamps, oversized, misprints. Each one goes in `printings.<id>`:
- `n`: its name
- `m`: its value multiplier. Use a number, or `[low rarities, high rarities]`.
- Flags:
  - `hit`: it's a chase pull
  - `foil`: it's shiny but common
  - `promo`: it never comes from packs
  - `big`: oversized
  - `see`: what the player needs to notice it, `"loupe"` or `"print"`. Free-form; your game decides what the values mean.

`promos.<id>` gives the share of cards per rarity that have each promo printing.

Also under this question, `demand` sets the odds of a card being a player staple, a collector chase or bulk, and what each is worth.

### 7. What's in a pack?
`eras.<era>.pack` is a list of slots. Each slot has `n` (how many cards) and `t` (outcomes `[rarity, printing, weight]`). Use `"s"` as the rarity for a secret card.

A common shape is:
- a few commons
- an uncommon
- a "foil slot" (any rarity, special printing)
- a "rare slot" whose weights decide how often each top rung and chase printing shows up

The tool shows the result as **pack value ÷ pack price**. Real new packs are usually worth a bit under their price (0.6–0.9).

### 8. What do you sell?
`sealed.<id>` holds:
- `packs` (inside)
- `msrp`
- optional `promo`, `over` (oversized) and `pin` counts
- `shape: [w, h]` if your game has a grid
- `reseal` and `grade` flags

Old sealed product can be priced as a multiple of a reference product (`sealedRef.<era> = { ref, types: { pack: [min, max] } }`). Other eras use `sealedMarket.<era> = [min, max]` × MSRP. `drops` lists old sealed product that turns up mid-run.

### 9. How big, and how long is a run?
Rough card count per faction = Σ over eras of sets × average size. Card Trader runs about 1,270 per faction; the duel example about 140.

`run.lastDay` (default 10) bounds reveal days.

### 10. Do you have real hobby statistics?
Put them in a separate stats file with the same keys (numbers only). Pass it as `CardGen.load(profile, stats)`. A fit script can then rewrite the stats without touching the profile. **Aggregates only, never raw data.**

## Optional blocks, and what leaving them out does
| Block | Leave it out and… |
|---|---|
| `grade`, `sealedGrade` | there's no grading; prices ignore condition |
| `weight` | packs can't be read by weight |
| `reprint` + a `live` era | there are no release calendar or reprint twists |
| `incoming` | `draw` picks eras evenly and rarities by set mix |
| `demand` | every card is "plain" |
| `bulk`, `repack` | repacks use 1 per bulk card and no premium |
| `art.bands` | `card.art[0]` is 0 (map art your own way) |

The schema version is `"schema": 1`. Keep it at the top of every profile, so tools such as Studio HQ's Workshop can store and upgrade profiles safely.
