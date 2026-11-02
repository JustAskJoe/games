# Rogue Shooter: art direction (DRAFT)

© 2026 justaskjoe. All rights reserved.

> **Draft for crew review.** The Artist agent wrote this on Nov 2, 2026 for art request #92, copied from Tower Defense's art direction and filled in from this game's README, `design/handoff.md`, `design/ai-assets.md`, `art/concepts/sketches.html` and the P1.1 build. Nobody has approved it yet. Edit freely; agents only propose changes.

The Artist agent (`kit/agents/artist.md`) reads this file as the only source of this game's look. People edit it; agents propose changes in pull requests. The decisions behind it are in `design/handoff.md`.

## The look
Warm, cozy farm-style pixel art on an isometric grass field: chunky 1-px dark outlines, earthy greens, wood and parchment UI, gold highlights. Monsters are cute rather than gory. Everything is drawn in code (string sprites rendered by `renderSprite()`, CSS panels, Press Start 2P for headings and HUD, Rajdhani for body text). It must read mid-fight on a desktop screen and, later, on a phone.

## Style anchor (proposed)
The P1.1 sprite set in `art/concepts/sketches.html` (and the matching `SPR`, `HERO_PAL` and `MON_PAL` in `builds/rogue-shooter.html`): Joe's heroes and monsters from Nov 1, 2026. Proposed as the style anchor; a person confirms it here. New characters and props should match these outlines, proportions and palettes.

## Palette
Taken from the P1.1 build (`:root` CSS tokens, menu styles) and the art sheet. Use only these, plus the per-sprite palettes in `HERO_PAL` and `MON_PAL`.

| Role | Hex |
| --- | --- |
| Background (overlays, page) | `#1a1612` |
| Panel | `#2a2218` |
| Panel, deep | `#231c14` |
| Ink outline | `#2a1a12` |
| Wood (borders) | `#6b4c22` |
| Wood, light | `#a08050` |
| Text | `#f0e4c8` |
| Text, dim | `#9a8a6a` |
| Parchment | `#f5ecd4` |
| Gold (titles, selection, XP) | `#ffcc44` |
| Gold, deep (title shadow) | `#5a3a00` |
| Red (HP, danger) | `#cc4444` |
| Green | `#66bb44` |
| Purple | `#8866aa` |
| Blue | `#5588cc` |
| Cyan | `#66ccaa` |
| Grass | `#3d6b25` |
| Grass, light | `#467a2e` |
| Night | `#15202a` |

## Key light (R22)
Proposed: **top-left, warm.** Not yet checked against every sprite; confirm before any painted work.

## Readability rules
- Every hero, monster and pickup is identifiable by silhouette alone at in-game size (R9).
- Heroes use warm, saturated outfits; monsters keep their own palettes and get a white hit-flash. Every walking thing sits on a soft dark shadow ellipse.
- UI is vector (R2): CSS panels and SVG, never painted. Titles and logos are drawn as pixel rects or SVG, never by an image model (R1, R24).
- Leave a calm area behind menus and the HUD (R21).

## Sizes (from the P1.1 build)
- Screen: full browser window; designed and checked at 1280 × 800 desktop and 400 px wide. Desktop first; touch controls are not built yet.
- Heroes: 20 × 22 px source, drawn at 2x (40 × 44).
- Monsters: source sizes in `SPR`; the Demon King draws at 3x.
- Iso ground tile: `toScreen(wx,wy) = {x: wx-wy, y: (wx+wy)*0.5}`.
- Pixel art keeps `imageSmoothingEnabled=false` and `image-rendering: pixelated`; scale only by whole numbers.

## Pipeline settings
```
roughs: off                   # proposed: the art is pixel and vector, drawn in code, so the SVG sheets are the roughs. Switch to cloudflare if the crew wants painted key art.
canva_roughs: on
final_art_source: undecided
slack_channel: none           # the agent skips Slack if this channel doesn't exist
```

## Style lead (only if painted roughs are switched on)
> 2D game key art in warm cozy farm-style pixel art: chunky dark outlines, earthy greens, wood and parchment tones, gold highlights, isometric grass field, cute monsters, key light top-left and warm. Readable at small size. Original design, not resembling any existing franchise. No text, no letters, no numbers.

## Final-art cost table
Fill in once a source is chosen. The agent estimates from these numbers.

| Source | Asset | Generations needed | Cost each |
| --- | --- | --- | --- |
| Claude (SVG / code) | UI, menus, logos, sprites drawn in code | 0 | free |
| canva | Painted key art (if wanted) | | not filled in yet |

## Brief template
The agent copies this for each request into `art/briefs/<issue>-<slug>.md`.

```
# <Asset> (#<issue>)
- Asset:
- Where it shows (screen, size):
- States / animations:
- Must read as: (one sentence)
- Directions:
  - A:
  - B:
  - C:
- References: (links only)
- Estimate:
```
