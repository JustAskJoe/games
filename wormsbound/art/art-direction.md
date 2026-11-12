# Wormsbound: art direction

© 2026 justaskjoe. All rights reserved.

**Draft, Nov 11, 2026**, written by the Lead Artist with the lead plan ([`lead-plan.md`](lead-plan.md)) for the crew to review. The Artist agent (`kit/agents/artist.md`) reads this file as the only source of this game's look. People edit it; agents propose changes in pull requests. Nothing here is decided until Louiemark and Hunter say so.

## The look
A chunky, friendly, toy-like artillery game. Thick dark ink outlines, flat bold colour, big simple shapes, a little squash and bounce. Warm and funny, never gritty or military. It has to read at a glance when a unit is 24 pixels across, and again when the camera pulls back to show a whole Giant map.

**Not decided: the finish.** The first request tests two, on the same two characters:
- **A · Pixel:** pixel art that matches the game's 8-pixel terrain grid.
- **B · Painted cut-outs:** flat painted parts with an ink line, moved in code.

## Palette
From the build (`prototype/head.html` tokens, `prototype/ui.js` team colours). Theme colours (sky, ground, liquid, props) live in `MapGen.THEMES[id].look` in `prototype/mapgen.js` once the map generator (JustAskJoe/games#95) merges (until then, `THEMES` in `prototype/ui.js`); backgrounds are painted to those, never to a palette of their own.

| Role | Colour |
| --- | --- |
| Ink (outlines, panels) | `#1E1A2B` |
| Ink 2 (raised panels) | `#3A3150` |
| Cream (text, highlights) | `#FFF3E0` |
| Sun (primary accent, FIRE) | `#FF8A3D` |
| Gold (ready, current unit) | `#FFD34D` |
| Danger | `#FF4D5E` |
| Teams: Ember, Tide, Plum, Sun, Rose, Sky | `#FF7A30`, `#22C3B5`, `#B57BFF`, `#FFD34D`, `#FF6FB5`, `#5AA9FF` |

Team colour is a tint the game applies in code. Never paint a character in a team colour.

## The five characters
Each is built from its job, and its gear is also its shot. No helmets, no army look.

| Character | Role | One loud shape | Gear that is also the shot |
| --- | --- | --- | --- |
| Brick | Tank | wide, square, heavy | a riveted visor; lobs slugs and a wrecking ball |
| Zip | Scout | small, leaning forward | a courier's scarf and a dart launcher |
| Volt | All-rounder | upright, with a tall antenna | the antenna that calls lightning |
| Digger | Miner | round, with a lamp | a headlamp and a drill |
| Gale | Wind-rider | light, with something trailing | a kite |

## Readability rules
- Every unit is identifiable by silhouette alone at 24 px (R9). Check on a phone (R8).
- One accent colour per character that still shows at 24 px.
- Units sit on the terrain's colours for all ten themes: check each character on the lightest theme (Frostbite Peaks) and the darkest (Magma Works, Fungal Hollow).
- Hazards (barrels, kegs, pods, duds) must never be mistaken for a prop or a unit.
- Key light: **top-left, warm** (R22).
- Backgrounds keep the top 90 px and the bottom 80 px calm: the HUD and the controls sit there (R21).

## Sizes (from the build)
- Stage: 1280 × 720, scaled to fit. One terrain cell is 8 px.
- Unit: 3 cells (24 px) across in play; drawn up to 1.5× when zoomed in, and about half size in the whole-map view.
- Portrait (select screen): 150 × 110 px. Lobby button: 54 × 40 px.
- Background: 1280 × 720 per layer, with 40 px of bleed each side for the camera's slide.
- **Finals:** 2× (unit parts on a 48 px body), transparent background, WebP in the build (R14). Pixel direction: a 24 × 24 px body shown at exactly 1×, 2× or 3×.

## Pipeline settings
```
roughs: canva                 # cloudflare (free, full size) | canva (links only) | off
canva_roughs: on
final_art_source: undecided   # set after the A/B pick: canva (painted) or pixellab (pixel; needs Hunter's OK to spend)
slack_channel:                # none yet: the agent skips Slack until a channel is named here
```

## Style lead
> 2D game asset for a friendly toy-like artillery game: thick dark ink outline, flat bold colour, big simple shapes, top-left warm key light. Single asset centred on a plain cream background, side view, readable at very small size. Original design, not resembling any existing franchise. No text, no letters, no numbers.

## Final-art cost table
Fill in once a source is chosen.

| Source | Asset | Generations needed | Cost each |
| --- | --- | --- | --- |
| canva | Character (anchor + cut-out parts) | | plan credits |
| canva | Theme background (sky + 2 layers) | | plan credits |
| pixellab | Character with idle, hop, aim and hit loops | | not priced yet |

## Brief template
The agent copies this for each request into `art/briefs/<issue>-<slug>.md`.

```
# <Asset> (#<issue>)
- Asset:
- Where it shows (screen, size on a phone):
- States / animations:
- Must read as: (one sentence)
- Directions:
  - A:
  - B:
  - C:
- References: (links only)
- Estimate:
```
