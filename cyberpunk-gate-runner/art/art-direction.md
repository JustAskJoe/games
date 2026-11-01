# Gate Runner: art direction (DRAFT for crew review)

© 2026 justaskjoe. All rights reserved.

**Draft.** The Artist agent wrote this on Oct 31, 2026 from Zach's art requests (#24, #25), `pitch/brief.md` and Prototype 2 (`prototype/v2/render.js` on the branch `zach/gate-runner-boss-tune`). Nobody has signed it off yet. Review it with the first concept sheets, change anything, and delete this paragraph when it holds.

The Artist agent (`kit/agents/artist.md`) reads this file as the only source of this game's look. People edit it; agents propose changes in pull requests.

## Picks
- Street (#24): **A, Clean Synthwave**. Zach, Oct 31, 2026.

## The look
Polished neon low-poly: clean shapes, strong silhouettes and glow rather than fine detail. Flat-shaded facets, two or three tones per surface, light coming from neon and windows, not from a sun. It has to read instantly on a phone while hundreds of things move on screen. When in doubt, take detail out and add glow.

## The world
Neon City, 2089. The megacorp **Hush** has banned music. The squad are underground ravers bringing it back, one street at a time. Every street starts muted under Hush propaganda and **wakes up at the drop**: when Overclock fires, the city lights up and the signs flip to the liberated state. That before/after is the core visual beat of every run.

## Palette
From the art requests (#24, #25) and Prototype 2. Use only these.

| Role | Hex | Notes |
| --- | --- | --- |
| Night | `#070B1F` | Road surface, deepest shadow. Sheets use it as the "road" background. |
| Panel | `#0F1433` | UI panels, tower faces, the upper sky. Sheets use it as the "sky" background. |
| Pink | `#FF3DA8` | **Enemies and Hush only.** |
| Light pink | `#FF7AD0` | Enemy highlights, Hush glow. |
| Cyan | `#3DF0FF` | **The player's squad only** (plus the road edge rails that frame the squad's lane). |
| Violet | `#8B5CFF` | The city's main neon, fog tint, skyline. |
| Gold | `#FFB547` | Weapons, crates, warm windows, liberated signs. |
| Green | `#4BFFA5` | Good gates, liberated signs. |
| Red | `#FF4D6D` | Risky gates, damage, bikers. |
| Off-white | `#F2EFE6` | Text, the Overclock squad, hit flashes. |

Working shades from Prototype 2 (`render.js`), for low-poly facets only, never as a main color:

| Shade | Hex |
| --- | --- |
| Ink | `#0B0E2C` |
| Steel | `#1B2148` |
| Plum | `#3A1050` |
| Fog | `#1C0B3E` |

## Readability rules
- **Cyan belongs to the player, pink to enemies.** The city never uses cyan or pink as a large lit area; its neon is violet, gold and off-white, dimmer than anything on the road. Hush propaganda may use pink, because Hush is the enemy.
- The road is the brightest, cleanest area on screen. Buildings sit back in fog and never cut into it.
- Every unit is identifiable by silhouette alone at in-game size. Squad: upright and narrow. Swarm: tiny and simple. Drone: floating, wide. Biker: long and low.
- The squad is seen **from behind**, enemies **from the front**. Design both views, but judge the squad by its back.
- The city has two states: **muted** (before the drop) and **liberated** (after). Muted is darker with fewer windows lit; liberated adds light and color, never clutter.
- Hit flash is off-white. Overclock turns the squad near-white (`#F2EFE6` with a cyan glow).
- No real brands, logos or recognisable real-world skylines. Sign text is our own: HUSH, OBEY, NO MUSIC before; liberated slogans after.

## Sizes (from Prototype 2, `render.js`)
- Camera: perspective from behind and above the squad (`camBase 0, 6.6, 9.2`), field of view about 52° on a 390 × 844 portrait phone.
- Road: 6.8 world units wide (half width `RW` 3.4); 10 world units per second of song; drawn 4.6 s ahead.
- One runner: about 1 unit tall. On a 390 px phone that is roughly **18–24 px tall** near the squad. Up to 180 are drawn at once.
- Swarm unit: about 0.8 units tall, roughly **8–14 px** on a phone. Walls of up to about 400.
- Drone: about 1.2 units wide, hovering at 1.1 units, roughly **20–30 px** wide.
- Biker: about 1.7 units tall and 1.5 long at 1.15 scale, roughly **30–40 px** tall.
- Street towers: 3–6 units wide, 9–33 tall, set back 7–12 units from the road centre; hanging signs 3.4–7 units wide (4:1), 9–12 units up.
- Arches: about 9 units wide and 8 tall, one every 2 bars: violet frames with a bone chevron, gold after the drop.
- Far skyline: 70 blocks, 18–98 units tall, 150–210 units away; sun about 0.2 of the screen width, above the horizon.
- Everything is built in code from low-poly shapes and shaders today. Final art is likely **textures, emissive maps and model guides**, not sprites; confirm that before picking a final source.

## Pipeline settings
```
roughs: cloudflare            # cloudflare (free, full size) | canva (links only) | off
final_art_source: in-code     # Claude builds the picks as models and shaders in render.js
canva_roughs: on
slack_channel: none           # no Gate Runner channel yet
```

## Style lead (painted roughs, Cloudflare or Canva)
> Polished neon low-poly 3D game art, clean flat-shaded facets, strong silhouettes and glow rather than fine detail, night city in deep navy with violet neon, hot pink for the enemy megacorp, cyan for the heroes, warm gold accents. Original design, not resembling any existing franchise or real city. No text.

## Final-art cost table
Fill in once a source is chosen. The agent estimates from these numbers.

| Source | Asset | Generations needed | Cost each |
| --- | --- | --- | --- |
| canva | Street set (towers, skyline, road, arches, 2 sign states) | | |
| canva | Unit (squad, swarm, drone or biker), front + back | | |
| commission | Low-poly model or texture set | | |

## Brief template
The agent copies this for each request into `art/briefs/<issue>-<slug>.md`.

```
# <Asset> (#<issue>)
- Asset:
- Where it shows (screen, size on a phone):
- States (muted / liberated, normal / Overclock, hit):
- Must read as: (one sentence)
- Directions:
- A: <2-3 word label>: <one sentence: the idea and the risk>
- B: <2-3 word label>: <one sentence: the idea and the risk>
- C: <2-3 word label>: <one sentence: the idea and the risk>
- References: (links only)
- Estimate:
```
