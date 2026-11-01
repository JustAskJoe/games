# Intergalactic Card Trader: art direction

© 2026 justaskjoe. All rights reserved.

**Approved by Hunter, Oct 31, 2026**, with `art/lead-plan.md`. It matches the v1 build (`design/handoff.md`, `design/ai-assets.md`). The Artist agent (`kit/agents/artist.md`) reads this file as the only source of this game's look. People edit it; agents propose changes in pull requests. Studio-wide rules are in `kit/art/art-rules.md`; this file adds to them and never loosens them.

## The look
Cel-shaded street-graffiti "happy space Akihabara": thick outlines, flat bold color, halftone, spray drips, sticker-style UI and squash-and-stretch motion. It borrows the *look* of the Jet Set Radio era only, never its characters, tags, logos or music, and prompts never name it (R17). Warm, funny and full of wonder. **Never grim, dystopian or cyberpunk.** Desktop landscape first, on a 16:9 stage.

## Anchors
- **World style anchor:** the title key art, `builds/img/keyart.jpg` (Canva MAHZoSFZr5A). Pass it as a reference on every generation (R3).
- **Set anchors:** each card game's v1 2×2 sheet: `cards-shell.jpg` (Shellstorm), `cards-hive.jpg` (Hive Gambit), `cards-star.jpg` (Starweave).
- **Species anchors:** Pearla for the Mollu (`p-pearla.webp`); the Zekk and Puffi lineup paintings (MAHZohkB4CA, MAHZolQj-xw) for theirs.

## Palette
From the v1 prototype's tokens (`prototype/head.html`). Use only these.

| Role | Hex |
| --- | --- |
| Ink line | `#120A1F` |
| Night (station shadows) | `#1B0E33` |
| Violet | `#6A2BD9` |
| Paper / card stock | `#FFF6E3` |
| Magenta | `#FF2E93` |
| Cyan | `#19D3F0` |
| Lime | `#A6F01E` |
| Sun | `#FFD21F` |
| Orange | `#FF7A1A` |
| Mint | `#4CF2B5` |
| Coral | `#FF6B6B` |
| Good (deals, high grades) | `#2BD96B` |
| Bad (fakes, debt) | `#FF3B3B` |

**Set palettes:**

| Card game | Main | Second |
| --- | --- | --- |
| Shellstorm | `#FF8FC7` | `#19C8D8` |
| Hive Gambit | `#A6F01E` | `#1A1A1A` |
| Starweave | `#8B5CF6` | `#FFD21F` |

## Readability rules
- **Light (R22):** warm hanging lamps from above, cool starlight rim from the windows, neon fill. Every prompt says "warm overhead lamp light with cool starlight rim".
- **Silhouettes (R9):** each species keeps its own silhouette family: Mollu (snail folk, big pearly shells), Zekk (four-armed beetle folk in sneakers), Puffi (floating fluffballs with huge eyes).
- **Room for UI (R21):** scenes keep a calm area where the card, price tags and dialogue sit.
- **No generated text (R1, R24):** card names, prices, signs, pack labels and alien scripts are drawn by the game.
- **Layers (R25):** condition, UV marks, fakes and slabs are code layers over clean paintings.
- **Groups:** paint each species' regulars as one lineup and each set's cards as a 2×2 sheet, then crop in code (proposed R26).

## Sizes
- Scenes: 1680 × 944 from Canva (16:9), shown on the 16:9 stage.
- Card sheets and lineups: 1264 × 1264 squares from Canva, cropped in code.
- Portraits: WebP crops; card art: JPG crops (as v1 ships them in `builds/img/`).
- Builds: WebP where it beats JPG (R14). Keep the Canva media id for every painting (R13, R23).

## Pipeline settings
```
roughs: canva                 # ART_KEY isn't set yet, so cloudflare can't run
final_art_source: canva       # revisit after the legal reviewer's Canva answer (lead plan §8)
anchors: builds/img/keyart.jpg plus the set and species anchors above
vector_first: [ui, icons, frames, card-backs, glyphs, slabs, logo, vfx]
cleanup: none                 # AI-only
slack_channel: none
```
`anchors`, `vector_first` and `cleanup` are proposals from `kit/art/pipeline-upgrade.md` §8.1. The Artist doesn't read them until `artist.md` is updated.

## Style lead
In our own words. Never name a game, studio or franchise in a prompt (R17).

> 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. Original design, not resembling any existing franchise. No text, no letters, no numbers, no signage.

**Card sheet add-on:** "A 2×2 sheet of four separate trading card illustrations for the <set> card game, each subject centered on its own plain panel with space between panels; set palette <hexes>; subjects: <four subjects>."

**Lineup add-on:** "A lineup of <n> <species> characters standing apart side by side, front-facing, plain background, same framing; <names and one-line looks>."

## Cleanup before release
- The title key art has made-up lettering on the big pink sign (center left). Cover it or paint it out before it's used for the store or a sold build (R1).
- Run the look-alike check (R17) on every regular and on the DJ before release.

## Final-art cost table
Canva costs plan credits, not money. Time is the real cost (see the lead plan §7).

| Source | Asset | Generations needed | Cost each |
| --- | --- | --- | --- |
| canva | Card sheet (4 cards) | ~4 | plan credits; ~10 min review |
| canva | Species lineup (3 regulars) | ~4 | plan credits; ~10 min review |
| canva | Scene | ~3 | plan credits; ~5 min review |
| gemini (if picked) | Any 1K image | ~4 | $0.067 standard, $0.034 batch (checked Oct 31, 2026) |

## Brief template
Same as `tower-defense/art/art-direction.md`, plus one line: `- Layers (code, not paint): condition / UV / fake tells / signage`.
