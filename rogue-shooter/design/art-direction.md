# Rogue Shooter: art direction

© 2026 justaskjoe. All rights reserved.

The look for v2, taken from the farm hub sketches (Nov 2, 2026). Everything new for the game follows this page. The studio's house rules in `kit/art/art-rules.md` still apply on top of it.

**Status:** draft, written with Joe. Change a rule here before you break it in the game.

## The look in one line
A cozy, hand-made 16-bit farm world: warm and bright in the Meadow, getting darker zone by zone, always drawn as chunky top-down pixel art with dark outlines and soft shadows. All art is original. We take the feel of cozy farming games, never their characters, buildings or layouts.

## Camera and scale
- **Top-down, straight on.** No diagonal (isometric) view anywhere. Things lower on the screen are in front and get drawn last.
- **One pixel size: 3×.** Every scene is drawn on a small canvas in art pixels and blown up 3× with no smoothing (`PIXEL_SCALE` in `src/core.js`). Never draw art at 2× or 1.5× next to 3× art.
- **Tile grid: 16 art pixels** (48 screen pixels). Ground, crop plots, fences and buildings line up to it.
- **Character size:** heroes are drawn on a 32×44 art-pixel canvas (body about 16 px wide and 34 px tall, hats and weapons use the rest), so 96×132 on screen. Human NPCs match. Small enemies 16–24 px, large enemies 28–40 px. Mini-bosses 44–80 px and major bosses 90–112 px, drawn full-size on the same grid (changed Nov 2, 2026: no 2× blow-ups, so bosses keep the heroes' pixel size and detail).
- **Hitboxes match sprites.** A collision radius should be about half the sprite's width.

## Light, outline and shadow
- **Light comes from the top-left.** Highlights sit on the top and left edges; the right and bottom sides are darker.
- **Outline:** a 1 px dark outline around every character, enemy, building and prop. Use a dark tint of the object's own color (default `#2b1d14`), never pure black.
- **Ground shadows:** a soft oval under everything that stands, offset a little to the bottom-right. Shadows tint what's under them toward cool blue (multiply by `0.62, 0.66, 0.80`), they don't paint it grey.
- **Glow:** light sources (fire, orbs, lanterns, magic) get a glow in 3–4 hard steps, not a smooth gradient.
- **Shading:** 3–4 tones per material (dark, mid, light, highlight). No gradients on sprites.

## Palette
Base palette, shared by every zone. Zone palettes below shift the ground and sky, not these.

| Use | Colors |
|---|---|
| Outline | `#2b1d14` |
| Grass | `#5ea23c` base, `#529434` / `#478a2e` shade, `#6cb046` / `#93cf63` light, `#3f7a28` tufts |
| Dirt path | `#d2a96c` base, `#b88e57` edge, `#e4c48c` light, `#9c7446` pebbles |
| Tilled soil | `#6e4529`, `#55331e` furrows |
| Wood | `#9a6436`, `#6e4322` dark, `#c08550` light, `#4e2e16` deepest |
| Stone | `#9a9aa4`, `#6d6d78`, `#c4c4cc`, `#4e4e58` |
| Water | `#4a98d8`, `#3577bb` deep, `#8ccaf2` shallow, `#e6f6ff` foam |
| Leaves | `#2c6626`, `#3f8a34`, `#57a940`, `#80c656`, `#b6e07e` |
| Cliffs | `#a07c58`, `#86643f`, `#6a4c30`, `#bf9a72`, `#4e3824` |
| Accents | red `#c0402f`, gold `#ffcc44`, purple `#7d4fb0`, teal `#5fe0c8`, orange `#f08a2a`, pink `#f4a6c6` |
| Skin | `#f0c4a8`, `#d4a07a`, `#a8704a`, `#7a4a30` (heroes and NPCs come in all of these) |

## Characters
- **Finals:** `art/concepts/heroes.html`, drawn by `art/tools/heroes/` (material ramps, top-left shading, colored outlines, hand-placed details). New characters use the same toolkit.
- **Three facing directions:** front, back and side. Left is the side view flipped.
- **Frames per direction:** idle, walk 1, walk 2. Attacks and the spacebar ability get their own frames when the class needs them.
- **Each class reads by silhouette alone:** the Knight's helm and shield, the Mage's tall hat and staff, the Marksman's hood and crossbow, the Rogue's mask and daggers, the Witch's wide hat and crooked staff.
- **Hit flash:** the whole sprite turns white for a few frames (`whiteOf`).
- NPCs (the farmer, the arena warrior, the seed keeper and the shopkeeper) use the hero canvas, proportions, three facings and walk cycle (`art/tools/farmlife/people.py`, shown in `art/concepts/farm-life.html`).
- **Hurt and death:** a white flash, then a flinch frame per facing; death is recoil, kneel, fall and fade with a soul sparkle (`art/concepts/combat.html`).

## Enemies and bosses
- **Finals:** `art/concepts/enemies.html`, drawn by `art/tools/enemies/` with the hero toolkit. Sheets and `enemies.json` in `art/sprites/enemies/`.
- **Frames:** a 4-frame move loop; enemies that attack or have a special (charge, phase, reveal, death blast) get 3 more frames. Projectiles and ground effects are separate strips; projectiles point right and are rotated to aim.
- **Floaters** (bats, wisps, moths, imps, wraiths, the Nightmare, the Tear and the Anchor) get a smaller shadow drawn a few pixels lower.
- Every enemy must be readable by silhouette at 3× in a crowd (house rule R9).
- Enemies that walk toward you get front, back and side frames. Fliers and blobs can use one direction with a bob or squash.
- Zone variants change palette first; new shapes only when the enemy behaves differently.
- **Bosses:** full-size on the same grid (see Character size), a unique silhouette, one view facing the camera (plus a side view for bosses that charge, like the Pack Leader Wolf and Cavern Wyrm, and a back view where the weak spot is on the back, like the Meadow Guardian's glowing knot), a 4-frame idle and a 3-frame signature attack, and a telegraph color for attacks (red for damage, purple for status effects). Finals: `art/concepts/bosses.html`; sheets and `bosses.json` in `art/sprites/bosses/`.

## Zones
Each zone is a ground set (base, path, decoration, obstacles) plus a light tint.

**Finals:** `art/concepts/biomes.html`, drawn by `art/tools/biomes/`. Each zone has a seamless 96×96 ground tile (six 16-px tiles across, big enough that the repeat doesn't show), obstacles with collision radii, small ground details with no collision, and a full combat-screen mock built from those pieces. Pieces and `biomes.json` in `art/sprites/biomes/`; screens in `art/concepts/scenes/`. Light is applied in hard steps: cloud shadows (Meadow), canopy light patches (Forest), crystal glows and a dark edge (Caverns), lava glow and a red glow from below (Volcanic), drifting fog and a dark edge (Shadow), neon glows (Void).

| Zone | Ground and obstacles | Light |
|---|---|---|
| Meadow | grass, flowers, oaks, pines, boulders, ponds | bright, warm |
| Forest | dark grass, ferns, mushrooms, dense trees, logs | dappled, greener |
| Caverns | grey stone floor, crystals, stalagmites, cliff walls | cool blue, crystal glow |
| Volcanic | ash, cracked rock, lava pools, basalt | red-orange glow from below |
| Shadow | dark violet ground, dead trees, fog, ruins | dim, faint stars |
| Void | black ground with glowing cracks, floating debris | neon cracks, particles |

## Effects
- Projectiles and effects use the same pixel grid: no thin 1-screen-pixel lines and no anti-aliased curves.
- Each class's attack has its own color: Knight orange-gold, Mage purple, Marksman blue, Rogue green, Witch magenta.
- Weapons have one color each, used for their icon, effect and card: Orbital Blades gold, Chain Lightning yellow, Fire Trail orange-red, Frost Nova ice blue, Homing Missiles copper. Evolutions keep their weapon's color, except Phantom Edge, which turns ghostly violet.
- **Finals:** `art/concepts/combat.html`, drawn by `art/tools/combat/`: every weapon and evolution, pickups (gold, three XP gem sizes, material drops), spawn and death effects, hit and crit sparks, heal, level-up burst and dash dust. Strips and `combat.json` in `art/sprites/combat/`.
- Pickups and drops sit on a small blue-tinted shadow and bob or sparkle so they read on every zone's ground. Enemies spawn out of a void-purple rune ring; normal deaths are a short white poof, boss deaths a white flash and gold rings.

## Farm and town
- **Crops:** `art/concepts/farm-life.html`, drawn by `art/tools/farmlife/`. Four stages (seed, sprout, growing, ready) on a plot that matches the crop's footprint: 1x1 for quick and standard, 1x2 for rare, 2x2 for legendary. Plants may rise up to one tile above their plot. Crops that glow (Glow Moss, Storm Seed, Phoenix Flower and the Void crops) pulse in hard steps.
- **Void plot:** black soil, an obsidian rim and neon cracks that pulse violet.
- **Barn animals:** side view (flipped for left), 4-frame walk and 2-frame idle. The pen dog and the combat dog are the same sprite.
- **Town:** `art/concepts/town.html`. A cobbled square with a fountain, the seed shop (green roof, sprout sign) and the general store (striped awning, gold-pouch sign), drawn at the same sketch scale as the farm maps.

## Menus and on-screen info
- **Panels:** dark wood with a lighter wood edge and a 1-pixel highlight on top, square corners.
- **Fonts:** Press Start 2P for titles, numbers and labels (sizes in multiples of 8 px). Rajdhani for longer descriptions.
- **Cards:** rarity shown by the frame color (common wood, rare blue, epic purple, legendary gold), not just the text.
- **Icons** are 16×16 pixel art (`art/sprites/ui/icons.png`, names in `icons.json`), always shown at a whole-number size: 2× (32 px) on small counters, 3× (48 px) in lists and menus, 4× (64 px) as card art and in the ability slot. Never 1.5× or other fractions.
- **Building menus:** `art/concepts/buildings.html`. Each building's menu keeps the shared kit and adds its own material: Forge riveted iron with ember type, Alchemy Lab a parchment recipe book on purple, Training Grounds rope-edged canvas, Shrine glowing stone with teal and gold, Barn red planks with white trim and hay, Arena dark stone with red and gold banners. They open over the building's interior at true game size.
- **First pass of the screens:** `art/concepts/menus.html` (title, class select, battle map, combat HUD, level-up), built by `art/tools/ui/`. Sizes are in screen pixels and step in 3 px (one art pixel): 3 px borders, 3 px highlights, Press Start 2P at 8/16/24/32/48 px.
- **The rest of the screens:** `art/concepts/menus-2.html` (pause, stats, round complete, run over, victory, options, cabin storage, planting with the hover preview, seed shop, general store). Overlays in a fight dim the battle behind them; farm and town menus open over the place they belong to. The planting preview shows the seed see-through over its footprint, green when it fits and red when it doesn't.
- **No words baked into art** (house rule R1). Signs, shop names and labels are drawn by the game in the pixel font.

## Where the art lives
- **In the game:** sprites are string grids with palettes (`SPR`, `HERO_PAL`, `MON_PAL` in `prototype/v2/src/render.js`). Terrain and buildings are drawn by code.
- **Concepts:** sketch sheets go in `art/concepts/`, rendered from the same palettes. The farm hub sketches are the reference for this page.
- **AI disclosure:** every new asset gets a row in `design/ai-assets.md`.
