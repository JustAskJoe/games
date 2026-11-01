# Trickbound: art direction (DRAFT for crew review)

© 2026 justaskjoe. All rights reserved.

**Draft.** The Artist agent wrote this on Oct 31, 2026 for the town and station request (#21), copied from Tower Defense's structure and filled in from `README.md`, `design/handoff.md`, `design/v3-scope.md`, `kit/art/README.md` (Trickbound style leads) and the mood art in `builds/img/`. Nothing here is decided until the crew edits or approves it.

The Artist agent (`kit/agents/artist.md`) reads this file as the only source of this game's look. People edit it; agents propose changes in pull requests.

## The look
**Places (towns, depots, the train):** expressionist painterly oil-sketch. Loose, visible brushstrokes, blocky planes of color instead of outlines, edges that dissolve into the dark. A cold, worn mining town at night lit by a few warm lamps. Melancholy on the platform, warm at the table (`design/v3-scope.md` → Tone). The request (#21) names Disco Elysium's Revachol as the feel to aim for; take the *approach* (painterly, moody, lived-in, lamplight against cold) and make everything else our own: our buildings, our people, our railway. Never copy its locations, characters, signage or compositions.

**People (portraits):** the same painterly hand, lamplight on faces (the Stationmaster mood image).

**Cards:** crisp 1920s Art Nouveau, so they read in a blink. Cards sit on top of the painted places and must stay the cleanest thing on screen.

**Critters:** small painted lantern critters; the one source of saturated glow in a scene.

## Palette
From the prototype (`prototype/v1/head.html` tokens and `world.js` tile colors) and the Leg 1 mood art. Use only these.

| Role | Main | Shade / light |
| --- | --- | --- |
| Coal night (deepest dark) | `#140F17` | |
| Plum felt (UI base, interiors in shadow) | `#2A2030` | `#3C2F43` |
| Bruise line / dusk walls | `#5C4B62` | |
| Dusk sky | `#3B3F7A` | |
| Snow | `#A9B3C8` | `#8F9AB2` |
| Frost (highlights on snow, glass) | `#D9D4EA` | |
| Cream (cards, paper, plaster lit) | `#F5ECDD` | `#FBF5E8` |
| Muted mauve (worn plaster, smoke) | `#C3B3C0` | |
| Lamp amber | `#E8B86A` | `#FFD58A` (glow core) |
| Brass | `#B9853F` | |
| Timber | `#6A4A30` | `#3A2A20` |
| Ember (Pits family, stove, danger) | `#B5482F` | |
| Tide (River family, rail paint) | `#2C6C80` | |
| Grove (Plains family, moss, felt tables) | `#4E7A3E` | |

## Readability rules
- Lamps are the light sources: every lit area has a visible lamp, stove or window. Everything far from a lamp falls toward coal night.
- Interactive things (doors, people, the counter, the quest board, benches, lamps) sit in or next to warm light. Background stays cold and soft.
- Cards and UI always sit on a calm, dark area. No busy brushwork behind the hand.
- A scene must still read in one glance at phone size with snow falling over it.
- The region family color shows once per scene (an awning, a rug, a painted rail car), never everywhere.

## Sizes (from Prototype v1)
- **Town (walkable):** 12 × 15 tiles. On a 390 px phone a tile is about 31 px, so the town shows at about 372 × 465 px. Painted as one backdrop at **384 × 480 logical px**, exported at **2x (768 × 960)**, with a separate collision grid kept in code.
- **Station interior (waiting-hall card room):** today a 150 px tall header strip (`.depot-art`, from a 1400 × 787 image). A v2 walkable room would be 12 × 10 tiles: **384 × 320 logical px**, exported at **2x (768 × 640)**, plus a 16:9 crop (1400 × 787) for the header and the title screen.
- **States:** each place has two lighting states: **Arrival** (one lamp of two working, cold) and **Lamp-lit** (after the town's first critter wakes or the night is won).
- Concept sheets show each place at phone size (1x), a 2x detail crop, both states, the scene in a phone frame with the game's UI and cards on top, and the palette.

## Pipeline settings
```
roughs: cloudflare            # cloudflare (free, full size) | canva (links only) | off
final_art_source: undecided   # candidates: canva | commission
canva_roughs: on
```

## Style lead (painted roughs, Cloudflare or Canva)
> 2D expressionist painterly game background, loose oil-sketch brushwork with visible strokes and blocky planes of color, lamplit melancholy, a fictional snowbound railway mining town at night, muted coal-black, plum, slate blue and brass palette with warm amber lamp glow, faint Art Nouveau ironwork. Original design, not resembling any existing game or franchise. No text, no letters, no signage.

## Final-art cost table
Fill in once a source is chosen. The agent estimates from these numbers.

| Source | Asset | Generations needed | Cost each |
| --- | --- | --- | --- |
| canva | Place backdrop (2 lighting states + header crop) | 3 | not filled in yet |
| commission | Place backdrop (2 lighting states + header crop) | 1 piece | not filled in yet |

## Brief template
The agent copies this for each request into `art/briefs/<issue>-<slug>.md`.

```
# <Asset> (#<issue>)
- Asset:
- Where it shows (screen, size on a phone):
- States / upgrades / animations:
- Must read as: (one sentence)
- Directions:
  - A: <2-3 word label>: <one sentence: the idea and the risk>
  - B: <2-3 word label>: <one sentence: the idea and the risk>
  - C: <2-3 word label>: <one sentence: the idea and the risk>
- References: (links only)
- Estimate:
```
