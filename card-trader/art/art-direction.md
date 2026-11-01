# Intergalactic Card Trader: art direction

© 2026 justaskjoe. All rights reserved.

**DRAFT** by the Lead Artist, Oct 31, 2026, for the crew to review with `art/lead-plan.md`. The Artist agent (`kit/agents/artist.md`) reads this file as the only source of this game's look once a person approves it. People edit it; agents propose changes in pull requests. Studio-wide rules are in `kit/art/art-rules.md`; this file can add to them, never loosen them.

## The look
Bright cel-shaded "happy space Akihabara": flat color in bold bands, thick ink outlines, graffiti-pop energy, a warm shop counter in a busy market station. Warm, funny and full of wonder. **Never grim, dystopian or cyberpunk** (brief tone rule). Every screen must read instantly on a phone.

## Palette
**To be pulled from the approved world style anchor** (`art/anchors/style-01.webp`, the bake-off key art). Until then, roles only:

| Role | Main | Shade |
| --- | --- | --- |
| Ink line | TBD | |
| Counter wood / warm base | TBD | TBD |
| Station metal | TBD | TBD |
| Neon accent 1 (shop) | TBD | |
| Neon accent 2 (rival) | TBD | |
| Paper / card stock | TBD | |
| Holo | (shader, not a flat color) | |
| Danger (fakes, customs) | TBD | |
| Trust (good deal, high grade) | TBD | |

Each in-world card game also gets its own **set palette** (3 or 4 colors), inside the world palette.

## Readability rules
- One key light: **top-left, warm** (proposed rule P2).
- Each species has its own silhouette family, readable at portrait thumbnail size (R9).
- Backgrounds keep a calm area where the card, price tags and dialogue sit (proposed P1).
- **No generated text anywhere** (R1). Card names, prices, signs, pack labels and scripts are rendered by the game: Latin text in the UI font, alien text in our SVG glyph alphabets.
- Card condition, holo and fake tells are **code layers** on top of the illustration, never painted in (proposed P5).

## Sizes (draft; confirm against the phone prototype kit)
- Card ratio 63 × 88 (standard card shape). Shown up to about 60% of the screen height in the Loupe.
- **Card art window:** generate at 1024 × 1024, subject on a plain background, crop to the window. Export at 2x of the size the Loupe shows.
- **Portraits:** 1024 × 1024 source, transparent cut-out, shown at about 40% of screen height. 3 or 4 expressions per regular, same framing.
- **Backgrounds:** 16:9 (1680 × 944 from Canva), 2x of the prototype's canvas.
- **Builds:** WebP (R14). Masters at full resolution.

## Pipeline settings
```
roughs: canva                 # ART_KEY isn't set yet, so cloudflare can't run
final_art_source: canva       # revisit after the legal reviewer's Canva answer (lead plan §8)
anchors: art/anchors/         # style-01 plus one set anchor per in-world card game and one per regular
manifest: art/manifest.json
vector_first: [ui, icons, frames, card-backs, glyphs, logo, vfx]
cleanup: none                 # AI-only
slack_channel: none
```
The `anchors`, `manifest`, `vector_first` and `cleanup` keys are proposals from `kit/art/pipeline-upgrade.md` §8.1. The Artist doesn't read them until `artist.md` is updated.

## Style lead (draft)
Our own words. Never name a game, studio or franchise in a prompt (R17).

> 2D cel-shaded game illustration, bright and joyful: flat color in bold bands, thick clean ink outlines, graffiti-pop energy, a friendly sci-fi market station full of neon and snacks, warm top-left key light. Original design, not resembling any existing franchise. No text, no letters, no numbers, no signage.

**Card art add-on:** "Single subject centered on a plain light background, for a trading card art window, in the <set name> style: <set palette and motif>."

**Portrait add-on:** "Front-facing bust, neutral pose, plain background, same framing as the anchor; expression: <expression>."

## Final-art cost table
Canva costs plan credits, not money. Time is the real cost (see lead plan §7).

| Source | Asset | Generations needed | Cost each |
| --- | --- | --- | --- |
| canva | Card illustration | ~4 | plan credits; ~5 min review |
| canva | Portrait (one expression) | ~4 | plan credits; ~5 min review |
| gemini (if picked) | Any 1K image | ~4 | $0.067 standard, $0.034 batch (checked Oct 31, 2026) |

## Brief template
Same as `tower-defense/art/art-direction.md`, plus one line: `- Layers (code, not paint): condition / holo / fake tells / signage`.
