# Studio HQ: art direction

© 2026 justaskjoe. All rights reserved.

The Artist agent (`kit/agents/artist.md`) reads this file as the only source of Studio HQ's look. People edit it; agents propose changes in pull requests.

## What Studio HQ is
A village at dusk where each building is a department of the studio and each agent lives in a house on Agent Lane. People tap a building, then step inside a painted room where the agents stand. It must feel like a place you'd want to visit, and read clearly on a phone.

**Every look is a full set** of the same pieces, so the village can switch between looks in ⚙ Settings:

| Piece | Size (source) | What it shows |
| --- | --- | --- |
| Map | 1680 × 944, landscape | The whole village from above at a three-quarter angle. Eight buildings, each clearly separate with room for a label: **Town Hall** (top center, biggest, a clock tower), **The Forge** (top left, chimney and anvil glow), **Art Cottage** (top right, a cottage with an easel and big north windows), **Town Square** (center, a notice board), **Workshop** (bottom left, long workbenches seen through big doors), **Law Office** (bottom center-left, small and formal), **Supply Shed** (bottom center-right), **Arcade** (bottom right, glowing cabinet windows). Paths link them. No text or signs. |
| Street | 1600 × 800 | The same buildings side by side as one street, for phones. |
| Rooms | 1400 × 787 each | The inside of each building and agent house, with the lower third kept calm for the room's title and buttons. Town Hall: a mayor's hall with tall windows. Workshop: **one workbench per game** in a row, each with an empty name plate and a small lamp (the Studio puts each game's name and status on its bench). Arcade: a row of cabinets with blank screens. |
| Figures | about 560 px tall, transparent | Each agent as a person and as a familiar creature, full body, facing three-quarters. |

## Palette
Each look sets its own palette in its brief. Across all looks: warm window light against a cool dusk, so buildings glow and pop, and calm darks at the bottom of rooms where text sits.

## Readability rules
- Sharp and clean: crisp edges and clear shapes, no muddy blur. The crew said the current looks feel "blurry and mushy"; every new look must fix that.
- Every building must be recognizable at a glance, even as a 120 px thumbnail.
- No text, letters, logos or signage anywhere. The Studio draws all labels itself.
- No resemblance to any existing game, film or franchise.

## Pipeline settings
```
roughs: cloudflare            # cloudflare (free, full size) | canva (links only) | off
canva_roughs: off
final_art_source: canva       # finals for a kept look are made in Canva, after Hunter OKs the count
```

## The six looks to sketch
One art request, six directions. Each direction's concept sheet shows the look's palette, the village map's composition, and the Workshop and Town Hall interiors as thumbnails. Its painted roughs (free) are the map plus the Workshop and Town Hall rooms in that style.

- A: Ink storybook: crisp ink linework over soft watercolor washes on cream paper, cozy dusk.
- B: Flat poster: bold flat color shapes and strong silhouettes, like a vintage travel poster at sunset; the sharpest look.
- C: Tiny diorama: an isometric miniature model village with tilt-shift depth, every building a little set piece.
- D: Pixel town: 32-bit pixel art, crisp at any size, warm lamplight in pixels.
- E: Neon noir: a rainy night with glowing wordless signs, wet streets and reflections.
- F: Papercraft: layered paper cut-outs with real depth and soft shadows between the layers.

## Style lead (painted roughs, Cloudflare or Canva)
> Game background illustration of a small village of studio buildings at dusk, <the direction's style>. Crisp, clean, high detail, sharp edges, readable shapes, warm window light against a cool sky. Original design, not resembling any existing game or franchise. No text, no letters, no signs.

## Brief template
The agent copies this for each request into `art/briefs/<issue>-<slug>.md`.

```
# <Request> (#<issue>)
- Pieces: (map, street, rooms, figures, as above)
- Where it shows: Studio HQ, on phones and computers
- Must read as: (one sentence)
- Directions:
  - A: <2-3 word label>: <the idea and the risk>
  - (one line per direction)
- References: (links only)
- Estimate: free concepts; finals about 40 Canva generations per kept look
```
