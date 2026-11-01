# Tower Defense: art direction

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

The Artist agent (`kit/agents/artist.md`) reads this file as the only source of this game's look. People edit it; agents propose changes in pull requests. The decisions behind it are in `design/handoff.md` → "Art and sound direction".

## The look
Hand-painted fantasy cottage illustration: ink linework over painterly flat color. Cozy, warm, storybook. A middle path between the moody painterly and cozy low-poly mood boards. It must read instantly on a phone during a busy wave.

## Palette
Taken from Prototype 1 (`prototype/head.html` tokens and `prototype/art.js`). Use only these.

| Role | Main | Shade |
| --- | --- | --- |
| Ink line | `#3A2518` | |
| Teal slate roof | `#4E8F86` | `#3A6E67` |
| Warm timber | `#6B4226` | `#4E2F1A` |
| Cream plaster | `#F7EEDC` | `#E6D6B8` |
| Mossy green (grass) | `#6E9A4C` | `#4F7A33` |
| Dusty-rose sky | `#D9C9C0` | `#CDB9B0` |
| Paper | `#F1E4CC` | |
| Road | `#C9A77A` | `#B8935F` |
| Stone | `#9A9CA3` | `#6F7178` |
| Gold (highlights, upgrade branch B) | `#D9A441` | |
| Rust (danger, upgrade branch A) | `#B8533A` | |
| Frost | `#8FC8D8` | |
| Spark | `#4F8FD6` | |

## Readability rules
- Every tower is identifiable by silhouette alone at in-game size.
- Upgrades keep the same silhouette family and get bigger and more ornate. A tier II tower shows a rust mark for branch A and a gold mark for branch B, as Prototype 1 does.
- Enemies use cooler or harsher values than towers so they pop off the grass and road.
- Every tower and walking enemy sits on a soft ink shadow ellipse.

## Sizes (from Prototype 1)
- Board: 12 × 8 cells. One cell is 80 px on a 960 × 640 canvas, scaled to fit the phone.
- Tower: 1 cell wide (80 px), up to about 1.2 cells tall (96 px), drawn 8 px above its cell.
- Enemies: about 0.95 of a cell; Brute 1.15; Warlord 1.5.
- Tower button icon: 96 × 96 px.
- **Painted finals:** export at 2x (tower 160 × 192 px), transparent background.
- **Pixel direction (being tested):** tower source 40 × 48 px, shown at exactly 2x (80 × 96) with nearest-neighbor scaling.

## Pipeline settings
```
roughs: cloudflare            # cloudflare (free, full size) | canva (links only) | off
canva_roughs: on
final_art_source: canva       # picked Oct 28, 2026 by Hunter (painted won the #9 test)
slack_channel: #td-studio     # the agent skips Slack if this channel doesn't exist
```

## Style lead (painted roughs, Cloudflare or Canva)
> 2D storybook game asset, hand-painted fantasy cottage style: ink linework over painterly flat color, teal slate roofs, warm timber, cream plaster, mossy greens, dusty-rose sky. Single asset centered on a plain cream background, three-quarter top-down view, readable at small size. Original design, not resembling any existing franchise. No text.

## Final-art cost table
Fill in once a source is chosen. The agent estimates from these numbers.

| Source | Asset | Generations needed | Cost each |
| --- | --- | --- | --- |
| pixellab | Tower (base + 2 upgrade branches) | | |
| pixellab | Enemy with walk animation | | |
| canva | Tower (base + 2 upgrade branches) | 4 (3 states + button) | not filled in yet |

## Decided: painted finals, made in Canva
Oct 28, 2026: the crew compared the Arrow tower sheets (#9) and Hunter picked **A: painted**. Finals come from Canva in the painted style above. The pixel direction (40 × 48 at 2x) is dropped.

### The test (kept for the record)
**Painted or pixel finals?** PixelLab makes pixel art, while this look is painted. The first request (Arrow tower) asks for one painted and one pixel direction. The crew compares them on a phone and records the answer in `final_art_source` above and in `design/handoff.md`.

## Brief template
The agent copies this for each request into `art/briefs/<issue>-<slug>.md`.

```
# <Asset> (#<issue>)
- Asset:
- Where it shows (screen, size on a phone):
- States / upgrades / animations:
- Must read as: (one sentence)
- Directions:
  - A:
  - B:
  - C:
- References: (links only)
- Estimate:
```
