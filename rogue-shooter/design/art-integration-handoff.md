# Rogue Shooter v2: art integration handoff

© 2026 justaskjoe. All rights reserved.

**For:** the coding AI putting the v2 art into the game.
**From:** Joe (with Claude), Nov 2, 2026.
**Status:** every v2 asset is drawn, but none of it is in `builds/rogue-shooter-v2.html` yet. The build still uses the v1 string sprites (`SPR`, `HERO_PAL`, `MON_PAL` in `prototype/v2/src/render.js`).

This page tells you where the art is, how to load it, and the order to wire it in. It also lists the art rules the code has to follow and the questions that are still open.

## Read these first

1. `design/art-direction.md`: the look and its rules (3× pixels, 16-px tiles, top-left light, blue-tinted shadows, colors, sizes). **When this page and that one disagree, that one wins.**
2. `design/handoff.md`: how v2 is built (source files, build and test, state machine).
3. `design/game-design-v2.md`: what the game does. The art follows it; don't change game rules to suit the art.
4. `patch-notes.md`: the top entry's **Watch out** list covers art assumptions that aren't confirmed yet.

## Ground rules

- **Don't edit anything in `art/`.** Sprites, manifests and concept pages come out of the Python scripts in `art/tools/`. If an asset is wrong or missing, note it under Watch out in the patch notes and ask Joe; don't hand-edit PNGs.
- **Build and test before every push:** `python3 prototype/v2/test.py`. It builds `builds/rogue-shooter-v2.html` and plays it headless. Commit the rebuilt build with the source.
- **Work on a branch with a pull request.** Follow `CLAUDE.md` (no force-push; nothing destructive without OK).
- **Patch notes:** add an entry for every session and list anything untested under Watch out.
- Keep v1 (`builds/rogue-shooter.html`) untouched.

## Where the art is

Every concept page is a self-contained HTML file you can open in a browser to see the art moving. Sprite folders hold the PNG sheets plus a JSON manifest.

| What | Look at | Sprites + manifest | Drawn by |
|---|---|---|---|
| Heroes (5 classes, 3 facings, walk, attack, ability) | `art/concepts/heroes.html` | `art/sprites/heroes/` + `heroes.json` | `art/tools/heroes/` |
| Enemies (23 + effects) | `art/concepts/enemies.html` | `art/sprites/enemies/` + `enemies.json` | `art/tools/enemies/` |
| Bosses (12 mini, 6 major + effects) | `art/concepts/bosses.html` | `art/sprites/bosses/` + `bosses.json` | `art/tools/enemies/` |
| Battle zones (ground, obstacles, details, lit mocks) | `art/concepts/biomes.html` | `art/sprites/biomes/` + `biomes.json`; mocks in `art/concepts/scenes/` | `art/tools/biomes/` |
| Weapons, evolutions, pickups, combat effects, hurt and death, dog | `art/concepts/combat.html` | `art/sprites/combat/` + `combat.json` | `art/tools/combat/` |
| Crops (4 stages), plots, Void plot, Barn animals, NPCs | `art/concepts/farm-life.html` | `art/sprites/farm/` + `farm.json` | `art/tools/farmlife/` |
| Icons (119, 16×16) | inside every menu page | `art/sprites/ui/icons.png` + `icons.json` | `art/tools/ui/icons.py` |
| Menus: title, class select, battle map, HUD, level-up | `art/concepts/menus.html` | HTML/CSS in the page | `art/tools/ui/build_menus.py` |
| Building menus (6, plus Forge, Alchemy and Arena at T3) | `art/concepts/buildings.html` | HTML/CSS in the page | `art/tools/ui/build_buildings.py` |
| Menus part 2: pause, stats, round complete, run over, victory, options, cabin storage, planting, seed shop, general store | `art/concepts/menus-2.html` | HTML/CSS in the page | `art/tools/ui/build_menus2.py` |
| Farm hub (fully built) | `art/concepts/farm-hub.html` | layout reference only | `art/tools/farmhub/` |
| Farm on day one | `art/concepts/farm-start.html` | `art/concepts/scenes/farm_day_one.png` + `.json` | `art/tools/farmhub/farm_start.py` |
| Town | `art/concepts/town.html` | `art/concepts/scenes/town.png` + `town.json` | `art/tools/farmhub/town.py` |

Every asset is AI-made and already has a row in `design/ai-assets.md` (for Steam's AI disclosure). You don't need to add rows for code.

## Step 0: an asset pipeline for a single-file build

The game ships as one HTML file that runs from `file://`, so `fetch()` and image URLs to `art/` won't work. Embed the art at build time instead:

1. Add a step to `prototype/v2/build.py` that reads the PNGs and JSON manifests under `art/sprites/` (heroes, enemies, bosses, biomes, combat, farm, ui) and writes a generated `src/assets.js`:
   ```js
   const ASSET_DATA = { "heroes/knight.png": "data:image/png;base64,...", ... };
   const ASSET_JSON = { "heroes/heroes.json": {...}, ... };
   ```
   Put `assets` in `ORDER` right after `core`. Mark the file as generated in a header comment, and don't commit it if you'd rather keep it out of diffs (the build regenerates it).
2. Add `loadAssets()` that turns every data URI into an `Image`, awaits `img.decode()`, and stores them in `IMG[path]`. Show the title screen only after it resolves.
3. Size: the sprite folders are about 1.5 MB, so the build grows by about 2 MB. That's fine for now. If you only need some zones early, a whitelist in `build.py` is OK.
4. One draw helper, used everywhere:
   ```js
   // Draws frame (col,row) of a sheet with the feet at world (x,y), in art pixels.
   function drawFrame(img, fw, fh, col, row, x, y, flipX)
   ```
   Anchor at **bottom-centre**: the frame's bottom edge sits on the entity's feet `y`. Round `x`/`y` to whole art pixels. Flip horizontally for left-facing side views. No scaling here; the 3× comes from `beginFrame(PIXEL_SCALE)` / `endFrame()` in `core.js`.
5. **Hit flash:** the white flash used to swap in `whiteOf(pal)`. With PNGs, make a white silhouette once per frame image: draw it to an offscreen canvas, then fill white with `globalCompositeOperation = 'source-atop'`. Cache it.

## Manifest formats (how to index the sheets)

All sizes are in **art pixels**. Side views always face right; flip for left.

- **`heroes.json`:** frame 32×44. `knight.png` (and the other classes) has rows `front`, `side`, `back` and columns `idle, walk1-4, attack1-3, ability1-3` (11 columns). Timings are in `timing_ms`. `<class>_fx.png` is the attack effect (frame 96×88, rows `front`, `side`, `back`, with the hero's feet at `hero_at` inside the frame). `<class>_ability_fx.png` is the ability effect (frame 128×112). `heroes[class].ability_at[view]` gives per-frame offsets for abilities that move the hero (Blink, Shadow Dash, Shield Bash).
- **`enemies.json` / `bosses.json`:** under `enemies[key]` you get `file`, `frame [w,h]`, `rows` (views, or `"<zone> front"` for the six Slime colors), `columns` (`m0-m3` move, then `a0-a2` attack or special if present), `timing_ms`, `floats` (draw the shadow smaller and lower), and `extras` (effect strips with `file`, `frame` and `count`). Bosses also have `tier` (`mini` or `major`) and `attack` (description).
- **`biomes.json`:** `tile: 96` (the ground PNG is one seamless 96×96 tile; repeat it). Each zone has `ground`, `obstacles[]` (`box [x,y,w,h]` in `<zone>_obstacles.png`, `radius` = collision circle at the feet; `radius: 0` with `hazard` = ground shape) and `details[]` (boxes in `<zone>_details.png`, no collision).
- **`combat.json` / `farm.json`:** `key → {name, w, h, frames, ms[]}`. The file is `<key>.png`: one row, frames left to right, each `w×h`. Crop strips are `seed, sprout, growing, ready` (+ a 5th "ready, glow dim" frame for glowing crops; loop the last two). Plots sit in the bottom `16×rows` pixels of each crop frame; the plant may rise into the 16 px above.
- **`icons.json`:** `size: 16`, `icons[name] = [x, y]` in `icons.png`, `groups` for listing. New groups were added at the end, so existing coordinates are stable.

## Implementation order

Each phase should leave the game playable, with `test.py` passing.

### Phase 1: heroes
- Replace `SPR.hero` / `HERO_PAL` with the hero sheets. Class ids in `data.js` already match (`knight, mage, marksman, rogue, witch`).
- **Facing:** pick `front`, `back` or `side` from the movement (or aim) direction. Use `side` when `|dx| > |dy|`, flipped when moving left; otherwise `front` (down) or `back` (up). Keep the last facing while idle.
- Walk cycles through `walk1-4` at 150 ms per frame, and idle uses `idle`. Attack frames play when the auto-attack fires, with `<class>_fx.png` on top. The ability plays `ability1-3` with its fx and `ability_at` offsets.
- **Hurt:** `combat/<class>-hurt-<view>.png` is 3 frames of 48×48 (white flash, flinch, idle) at 60/160/260 ms, plus a short knockback. **Death:** `combat/<class>-death.png` is 5 frames of 56×48, then the run-over screen.
- **Shadow:** a blue-tinted ellipse under the feet, `rgba(20,30,70,~0.35)`, not black. `drawShadow` currently uses black; change it.

### Phase 2: enemies and bosses
- **Map the current v2 enemy types to the new art:** `slime → slime` (row by zone), `bat → bat`, `wisp → wisp`, `shroom → shroomling`, `skeleton → skeleton`, `demon → demon`.
- **No matching art yet:** the v2 build's Moss Golem mini-boss and Demon King boss. The design's round 5 boss is the Meadow Guardian, and its mini-bosses are the Giant Slime and Alpha Bat. Wire in the design's roster as rounds are built; ask Joe before inventing new mappings.
- **Views:** enemies with `front, side, back` rows face like heroes. Single-view enemies (fliers and blobs) don't turn; they bob or squash.
- **Bosses:**
  - Draw them at their full size (up to 112 px); never scale them.
  - The Pack Leader Wolf and Cavern Wyrm use their `side` row while charging horizontally.
  - The Meadow Guardian uses its `back` row when the player is behind it; that row shows the glowing weak-spot knot.
  - Boss effects are in `extras`.
- **Telegraph colors:** red for damage, purple for status effects.
- **Spawning:** play `combat/enemy-spawn.png` (5 frames) before the enemy becomes active. **Death:** `death-poof` for normal enemies, `boss-death` for bosses.
- **Collision radii:** these aren't set yet. Derive a starting radius from the frame width (about 0.35 × w) and note it under Watch out.

### Phase 3: battle zones
- Replace the checkerboard in `drawGround()` with the zone's 96×96 ground tile, repeated.
- Place obstacles from `biomes.json` (collision circle at the feet) and scatter details, with no collision and seeded by `tileHash()`.
- **Light layers** are hard-stepped, never soft gradients. Match the mocks in `art/concepts/scenes/<zone>.png` (cloud shadows in the Meadow, canopy light in the Forest, and so on; see the zone table in art-direction).
- **Hazards** (pond, log, lava pool, arch, void pit) have no collision shape yet. Use a box from the sprite and flag it.

### Phase 4: weapons, pickups and effects
- **Weapon effects map to the existing weapon ids:**
  - `orbital` → `orbital-blades`, `sawblade-tornado`, `phantom-edge`
  - `lightning` → `chain-lightning`, `judgement`, `storm-cage`
  - `fireTrail` → `fire-trail`, `hellfire`, `ember-swarm`
  - `frostNova` → `frost-nova`, `frost-patch`, `absolute-zero`, `glacial-tomb`
  - `homing` → `homing-missiles`, `missile-hit`, `missile-barrage`, `orbital-cannon`
- The strips are drawn centred on the hero. Some show several blades or missiles in one frame. For effects the code positions itself (orbiting blades, missiles), crop a single element from the strip or draw it in code using the same palette, and keep the effect's color (art-direction: Orbital Blades gold, Chain Lightning yellow, Fire Trail orange-red, Frost Nova ice blue, Homing Missiles copper).
- The v2 design adds alt evolutions (Phantom Edge, Storm Cage, Ember Swarm, Glacial Tomb, Orbital Cannon) and stat gates that the build doesn't have yet. Add them with the Forge work, not here.
- **Pickups:**
  - `gold-coin` spins; `gold-pile` is for elites and bosses.
  - `small-xp-gem`, `xp-gem` and `big-xp-gem` are for normal enemies, elites and bosses (this mapping is a guess; confirm with Joe).
  - Material drops are `<material>-drop`; the Golem Core drop pulses.
- **Other effects:**
  - `hit-spark` on every hit, `crit-spark` on crits.
  - `heal` for heals and lifesteal.
  - `level-up-burst` behind the hero before the card picker.
  - `dash-dust` on dashes.
- **Dog companion** (Barn Dogs): `dog-walk-<view>`, `dog-bite-<view>`, `dog-knocked-out`.
- **Damage numbers:** Press Start 2P, 8 px on the art canvas (24 px on screen); crits are bigger and gold.

### Phase 5: HUD and menus
- The menus are **DOM/CSS over the canvas**, like the current HUD in `body.html`, not canvas drawing.
- Copy the UI kit CSS **once** into `prototype/v2/head.html`. It is the block between `/* ---------- the in-game UI kit` and `/* ---------- 1 title` in `art/tools/ui/menus_template.html`, and the concept pages each carry a copy. The kit covers panels, buttons, keys, slots, bars and segments.
- Then build each screen to match its concept page:
  - **`menus.html`:** title, class select, battle map, combat HUD, level-up.
  - **`menus-2.html`:** pause (ESC), stats (TAB), round complete, run over, victory, options.
  - **`buildings.html`:** the six building menus and their T3 states (with Phase 6).
  - **`menus-2.html`:** cabin storage, planting, seed shop, general store (with Phases 6 and 7).
- **Sizes** step in 3 px: borders and highlights are 3 px, and the font is 8/16/24/32/48 px.
- **Icons:** show them only at 2× (32 px), 3× (48 px) or 4× (64 px). Never 1.5× or any other fraction.
- **Icon CSS:** use a background from `icons.png`, scaled by a whole number, with `image-rendering: pixelated`. For example, at 3×: `background-size: (sheetW*3)px (sheetH*3)px; background-position: -x*3px -y*3px`.
- **Font:** load Press Start 2P for real. The mockups were checked with a stand-in font, so check that long labels still fit.

### Phase 6: farm at 3×
- **Change the scale first:** the farm still draws at full size with `TILE = 32` screen px. Move it to the pixel renderer: `beginFrame(PIXEL_SCALE)`, **16-px tiles**, one world unit = one art pixel, like combat.
- **Layout:** the Riverside farm from `art/concepts/farm-hub.html` (built) and `farm-start.html` (day one).
  - On day one only the cabin stands; the six building sites are empty lots or ruins with stakes, rope and a blank build sign.
  - Plots 1, 2, 7 and 8 start open; the other 26 are covered by rocks, stumps and weeds.
  - The animal pen is empty.
  - `art/concepts/scenes/farm_day_one.json` has the label positions. Redraw buildings and props at game scale with the farm palette (`art/tools/farmhub/farm.py`, `P`); the farm sketches are a reference at sketch scale, not tiles to load.
- **Crops:** use the `farm/<crop>.png` strips. Footprints are 1x1 (quick, standard), 1x2 (rare) and 2x2 (legendary).
  - Stage frame = how far into the grow time the crop is: seed when planted, sprout after a quarter, growing at half, ready when done.
  - Void crops grow on `void-plot.png` and stay there (the last two frames loop).
- **Planting preview** (see `menus-2.html`, Planting): the seed follows the cursor as a see-through plant over its footprint.
  - Tint the footprint green when it fits, red when it would cover a crop, a rock or the field edge.
  - R rotates 1x2 crops (an assumption; see Watch out).
- **Animals:**
  - `chicken`, `cow`, `pig` and `goat` have `-walk` (4 frames) and `-idle` (2 frames) strips, side view only; flip them for left.
  - `bees-hive` loops.
  - The pen dog is the combat dog.
- **NPCs:** the farmer and arena warrior are `farm/<npc>-idle|walk-<view>`: 32×44, hero walk cycle, three facings.
- **Building menus:** each opens over its interior from `art/tools/farmhub/interiors.py`, drawn at 3×. Export the interiors as PNGs through the asset step.

### Phase 7: town
- Build the town from `art/concepts/town.html`: a cobbled square, fountain, the seed shop (left), the general store (right), two houses, a market stall and a notice board.
- **The town is sketch scale too:** like the farm sketches, `town.png` is a layout reference. Rebuild it at game scale on 16-px tiles; don't load it as one image.
- **Shopkeepers:** `farm/seed-keeper-*` and `farm/shopkeeper-*`.
- **Signs use icons, never words** (house rule R1).

## Art rules the code must keep

- **Pixel grid:**
  - One pixel size: 3×. Everything draws in whole art pixels; round positions; `imageSmoothingEnabled = false`.
  - Never scale a sprite by a fraction, and never mix 2× with 3×.
  - Rotate only projectiles and effect strips, which point right; character sprites never rotate.
- **Draw order:** depth-sort by feet `y`.
- **Shadows:** blue-tinted ellipse under every standing thing. Floaters get a smaller shadow a few px lower.
- **Light:** comes from the top-left and is baked into the sprites; don't add dynamic shading. Glows and light overlays step in hard bands (2-4 alpha levels), never smooth gradients.
- **Hit flash:** all white for a few frames.
- **No text in art:** in-game text is drawn by the game in the pixel font.

## Still open: ask Joe, don't invent

These come from the patch notes' Watch out list. Leave a placeholder and a Watch out line instead of deciding:
- Collision radii and spawn spacing for every enemy and boss; whether bosses up to 112 px leave room to dodge on a 427×267 screen.
- Where Skeleton and Demon spawn in v2.
- Shop stock and prices (seed shop, general store), and what the general store sells. The mock prices in `menus-2.html` are placeholders.
- XP gem tiers; animal prices (the Barn mock uses 150g); whether building a lot is instant or shows a construction stage.
- Rotating 1x2 crops; the Void plot's footprint (drawn 2x2).
- Meta-progression (the run-over screen says nothing carries over).
- Whether Barn animals need front and back views.

## Done checklist (each phase)

- [ ] `python3 prototype/v2/test.py` passes; screenshots in `prototype/v2/shots/` match the concept page for that phase.
- [ ] Checked by hand in a real desktop browser at 1280×800, with the real Press Start 2P font.
- [ ] The rebuilt `builds/rogue-shooter-v2.html` is committed with the source.
- [ ] `patch-notes.md` has an entry: What's new, Next up, and Watch out with untested devices and guessed numbers.
- [ ] `design/handoff.md` describes the new sprite system once Phase 1 lands. The "Sprites" and "Pixel art system" bullets still describe the v1 string sprites.
