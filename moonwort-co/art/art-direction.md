# Moonwort & Co.: art direction (DRAFT for review)

© 2026 justaskjoe. All rights reserved.

**Draft.** The Lead Artist wrote this on Nov 2, 2026 with `art/lead-plan.md`, from Tower Defense's art direction (structure) and `pitch/brief.md` (look and palette), plus the rules this game needs. Nothing here is decided until a person edits or approves it (lead plan, decision 3).

The Artist agent (`kit/agents/artist.md`) reads this file as the only source of this game's look. People edit it; agents propose changes in pull requests. Studio-wide rules are in `kit/art/art-rules.md`; this file adds to them and never loosens them.

## The look
**Candle-lit painterly apothecary, in 2D.** A little shop at the edge of Little Hollow at dusk: warm candle and hearth light on wood, glass and dried herbs, plum night at the windows, moss and green growing things everywhere. Warm, curious, tactile, a little ornate. Cozy, never spooky.

- **Places:** painted scenes (the painterly technique is picked by the style-anchor concepts, lead plan §2). Soft edges, warm pools of light, calm areas for cards and dialogue.
- **People and familiars:** the same painterly hand; round, friendly shapes; candlelight on faces.
- **Cards:** tarot-proportioned ingredient, ritual and familiar cards in **Art Nouveau beeswax-gold frames** drawn as SVG (R2). The painting sits in an arched window; the name, Latin name, traits and lore are set by the game (R1).
- **Plants:** truthful to the real plant's identifying features, painted with love, never invented. The lead plan's risk 1 applies to every plant picture.

**Sister look to Trickbound, never its style lead (R4).** Both games share lamplight, plum darks and Art Nouveau cards. To keep them apart:

| | Moonwort & Co. | Trickbound (don't borrow) |
| --- | --- | --- |
| World | Green, growing, a cottage shop and garden | Snowbound railway mining town |
| Mood | Warm, cozy, curious | Melancholy platform, warm table |
| Frame grammar | Botanical: whiplash stems, leaves, buds, seed heads, moon phases, beeswax gold | 1920s ironwork, etched tin, playing cards |
| Card shape | Tarot, arched art window | Playing card |
| Accent light | Candle, hearth, moonlight | Lamps against cold |

Never reuse Trickbound's frame SVGs, palette file, anchors, props or style lead. Contact-sheet reviews look for rail, snow, mining and ironwork motifs.

## Anchors
None yet. **No anchor means concepts only, no finals (R3).**
- **Style anchor:** picked from the three style-anchor directions (lead plan §2) after Prototype 1's concepts.
- **Character anchors:** one neutral anchor each for the cat, toad and crow familiars and for each villager (R6), before any finals with them.
- **Card set anchors:** the first approved 2×2 ingredient sheet and the first approved ritual sheet.

## Palette
From the brief: plum night, moss, beeswax gold, rose clay, ember. **These hexes are a proposal.** Once Prototype 1 has tokens in `prototype/head.html`, this table takes them from there. Use only these.

| Role | Main | Shade / light |
| --- | --- | --- |
| Plum night (UI base, night sky, deep shadow) | `#2E1A33` | `#1C0F21` (deepest) |
| Plum dusk (interiors in shadow, panels) | `#4A2C4F` | `#6B4A6E` |
| Ink line | `#24141F` | |
| Moss (growing things, "soothing") | `#5F7A3A` | `#425A26` |
| Sage (leaves in light) | `#9DB07A` | |
| Beeswax gold (frames, highlights, "brightening") | `#E0AE4A` | `#F3CF7E` (gilt light) |
| Old gold (frame shade) | `#9C7230` | |
| Rose clay (pots, villagers' warmth, "drying") | `#C27C6B` | `#A65E4F` |
| Ember (hearth, "warming", alerts) | `#D2572B` | `#F08A3C` (glow core) |
| Moonlight (window rim, "cooling") | `#9FAAD6` | `#C9D0EE` |
| Lavender ("calming") | `#9A82B8` | |
| Parchment (cards, grimoire pages) | `#F4E9D4` | `#E6D5B5` |
| Candle cream (lit plaster, highlights) | `#FBF1DC` | |
| Timber | `#6A4630` | `#45291C` |

**Traits read by shape first, color second (R9):** each trait icon has its own outline (flame, snowflake, closed eye, sun, drop crossed out, open leaf, for example), so it works for colorblind players and at 24 px.

## Readability rules
- **Light (R22):** warm candle and hearth light from the **lower left**, cool moonlight rim from a window on the **upper right**. Every prompt says "warm candlelight from the lower left with a cool moonlight rim from the upper right".
- **Room for UI (R21):** shop and workbench scenes keep the bottom third calm (cards, the brew tray and dialogue sit there in portrait). The counter scene keeps the villager's face clear of the dialogue box.
- **No generated text (R1, R24):** shop signs, jar labels, book spines, grimoire writing and any symbol meant to be read are drawn by the game. Prompts say "no shop signs, no labels, no writing on jars or books" (L13).
- **Layers (R25):** brew color, glow and quality, moon phase, time of day, season tint and a card's "discovered" state are code layers over clean paintings.
- **Silhouettes (R9):** each familiar and each villager has its own outline family at portrait size. Each plant keeps its identifying silhouette even at the 48 px shelf size.
- **Plants:** each ingredient brief names 3–5 identifying features from POWO or USDA PLANTS, with links. A person checks the painting against them at 100% zoom before a `Pick:` (R12 extended to plants).
- **Groups:** paint ingredient and ritual cards as 2×2 sheets and familiars and villagers as lineups, then crop in code (proposed R26).
- **Respect:** plants, moons, seasons and folk craft only. No real religious or closed-practice symbols. Folklore, never medical claims.

## Sizes (phone portrait first, proposals until Prototype 1 sets them)
- **Stage:** 390 × 844 logical px portrait, scaled to fit.
- **Card:** tarot proportion about 7 : 12. Full view about 300 × 514 px; in a hand or on a shelf about 84 × 144 px. Art window (arched) about 260 × 300 px at full view.
- **Painted card art:** export at 2x the art window (520 × 600), from 2×2 sheets painted at the largest size the tool gives.
- **Portraits** (villagers, familiars): about 240 × 240 px on screen, exported at 2x (480 × 480), transparent or plain background.
- **Scenes:** portrait 9:16 for phone (about 1080 × 1920 export); check what aspect ratios the chosen tool can make before the first run (not checked).
- **Icons:** 24, 32 and 48 px on one grid (SVG).
- Builds get WebP (R14); one full-resolution master per final asset.

## Pipeline settings
```
roughs: cloudflare            # free, full size, no reference images; canva for concepts that need one
canva_roughs: on
final_art_source: undecided   # after Prototype 1 passes and the legal reviewer's Canva answer (lead plan §8, decision 10)
anchors: none yet             # no finals until a style anchor is approved (R3)
vector_first: [ui, icons, frames, card-text, jars, moon, logo, vfx]
cleanup: none                 # AI-only
prototype_1_art: code-only    # Hunter, Nov 2, 2026: no image-model art in the build
slack_channel: none
```
`anchors`, `vector_first` and `cleanup` are proposals from `kit/art/pipeline-upgrade.md` §8.1. The Artist doesn't read them until `artist.md` is updated.

## Style lead
In our own words. **Stricter than R17 for this game:** never name any artist, illustrator, book, tarot deck, game, studio or franchise in a prompt, living or not.

> 2D painterly storybook game illustration, a cozy candle-lit apothecary cottage at dusk, warm candlelight from the lower left with a cool moonlight rim from the upper right, soft painted edges, dried herbs, glass jars and green growing plants, palette of plum night, moss green, beeswax gold, rose clay and ember. Warm, curious and tactile. Original design, not resembling any existing franchise. No text, no letters, no numbers, no labels or signs.

**Ingredient sheet add-on:** "A 2×2 sheet of four separate botanical illustrations, each plant centered on its own plain parchment panel with space between panels. Accurate to the real plant: <plant 1: identifying features> … <plant 4: identifying features>. Not a copy of any existing illustration."

**Lineup add-on:** "A lineup of <n> characters standing apart side by side, front-facing, neutral expression, plain background, same framing; <one-line looks by shape and markings>."

**Gemini prompts** start with the style-guide-only line for reference image 1 (L12) and give every scene a second reference with what to keep from it (L14).

## Final-art cost table
Fill in once a source is chosen. Time is the real cost (lead plan §7).

| Source | Asset | Generations needed | Cost each |
| --- | --- | --- | --- |
| canva | Ingredient or ritual sheet (4 cards) | ~4 | plan credits; ~15 min review incl. plant check |
| canva | Lineup (3 characters) | ~4 | plan credits; ~10 min review |
| canva | Scene | ~3 | plan credits; ~5 min review |
| gemini (if picked) | Any 1K image | ~4 | $0.067 standard, ~$0.034 batch (checked by the studio Oct 31, 2026; not re-checked today) |

## Brief template
Same as `tower-defense/art/art-direction.md`, plus three lines:

```
# <Asset> (#<issue>)
- Asset:
- Where it shows (screen, size on a phone):
- States / upgrades / animations:
- Must read as: (one sentence)
- Plant ID features (ingredients only): <3–5 features> · sources: <POWO / USDA links>
- Layers (code, not paint): text / labels / brew color / moon / season tint
- Directions:
  - A:
  - B:
  - C:
- References: (links only, R17)
- Estimate:
```
