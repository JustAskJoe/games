# Rogue Shooter: handoff

© 2026 justaskjoe. All rights reserved.

The one page to read before touching this game.

**Team:** Joe, with Claude.
**Status (Nov 3, 2026):** Building v2 (`design/game-design-v2.md`). v2-M2 done: the farm, town and building interiors are the farm-hub art itself, all six buildings can be built, entered and used through their menus, weapons come only from the Forge, and every basic attack aims at the nearest enemy. Desktop with keyboard.

## The game in one line
A rogue-like auto-shooter with a farm phase between rounds. Pick a class, survive 30 rounds across six zones, then tend your farm, visit the town and get ready before the next fight.

## Architecture
Pure Canvas + vanilla JS, no libraries. v2 source lives in `prototype/v2/`:
- `head.html` (styles, including the shared UI kit), `body.html` (HUD and screen containers), `src/*.js` joined in this order: core, assets, gfx, data, input, state, combat, ui, render, farm, buildings, bmenus, main. They share one script scope, so the order matters.
- **Build:** `python3 prototype/v2/build.py` writes `src/assets.js` (every PNG in `art/sprites/` as a data URI plus every JSON manifest; generated, git-ignored) and then `builds/rogue-shooter-v2.html` (about 3.2 MB). The build still runs from `file://`.
- **Test:** `python3 prototype/v2/test.py` builds, then plays title, class select, battle map, combat (ability, level-up, pause, mini-boss), round complete, the farm (planting), an unbuilt site's menu and Build, walking into the Forge and buying a weapon at the anvil, every building menu and the cabin, the town, the path back to the map, auto-aim (an enemy behind the Marksman gets shot), cards-only level-ups, every zone's boss round, and death in headless Chromium. It fails on any JavaScript error. Screenshots go to `prototype/v2/shots/`.
- `builds/rogue-shooter.html` is the old v1 single-file build, kept until v2 replaces it.
- **Art direction:** `design/art-direction.md`. **Art integration plan:** `design/art-integration-handoff.md` (phases 1-7; see "What's built" for what's done).

### Rendering
- **Pixel renderer:** every scene draws on an offscreen canvas in art pixels and is blown up by `PIXEL_SCALE` (3) in `endFrame()`. `W()`/`H()` are the scene size in art pixels (about 427×267 on a 1280×800 window). One world unit is one art pixel.
- **Top-down camera,** depth-sorted by feet `y`.
- **Sprites (`src/gfx.js`):** `loadAssets()` turns the embedded data URIs into images before the title shows. `drawFrame(img, fw, fh, col, row, x, y, flipX, white)` draws a sheet frame with its bottom-centre on the feet. `drawStrip()` draws one-row effect strips from `combat.json`/`farm.json` (centred or at the feet, optionally rotated; rotations snap to 32 steps). `drawExtra()` draws enemy and boss effect strips from the manifests' `extras`. The hit flash uses a white silhouette of the whole sheet, made once (`whiteOf`). `stripPiece()` cuts the largest solid piece out of a strip frame (one orbital blade, one missile) so the code can place them.
- **Heroes:** `art/sprites/heroes/<class>.png` rows front/side/back, columns idle, walk1-4, attack1-3, ability1-3; side views face right and flip for left. Attack and ability effects (`<class>_fx.png`, `<class>_ability_fx.png`) are two layers: columns 0-2 behind the hero, 3-5 in front. Hurt (3 frames) and death (5 frames) come from `art/sprites/combat/`.
- **Enemies and bosses:** `enemies.json`/`bosses.json`. `timing_ms.move` is ms per frame (a number); `timing_ms.attack` is a list. The Slime's row is picked by zone.
- **Zones (`src/render.js`):** `buildArena(zone)` places obstacles from `biomes.json` on a jittered grid (collision circles at the feet; pond and fallen log block as ellipses, lava pools and void pits hurt, the ruined arch's pillars block) and paints the whole 2400×2400 floor once: the 96 px ground tile, a soft breakup in hard steps, the zone's path and scattered details. Light layers follow `art/tools/biomes/scenes.py`: cloud shadows (Meadow), canopy light (Forest), stepped glows on crystals, lava and void rocks, a bottom glow (Volcanic), fog bands (Shadow) and stepped vignettes. Shadows are blue-tinted ellipses.
- **Damage numbers** draw on the screen canvas after the 3× blow-up (16 px, crits 24 px gold).
- **Menus** are DOM over the canvas on a 1280×800 stage (`#stage`, scaled 1:1 at 1280×800, by whole numbers above, and down to fit below). The HUD is anchored to the window corners. Icons are CSS backgrounds from `icons.png` at 2×/3×/4×.

### State machine
`loading | title | start (class select) | map | playing | levelup | stats | paused | options | roundComplete | dying | dead | won | farm`. `setScreen(id)` shows one screen on the stage with its shade.

## Systems (v2 build)

### Classes (5)
From the design: Knight (Sword Slash, Shield Bash), Mage (homing Magic Bolt, Blink), Marksman (Piercing Shot, Focus Shot), Rogue (Dagger Flurry, Shadow Dash with two charges), Witch (Hex Pulse rings that hex, Ritual Burst). **Every basic attack aims at the nearest enemy** (`tryAttack()` in `combat.js`; the slash arc is centred on it and the hero turns to it while attacking). **Only the spacebar ability uses the facing** (`player.aim`, the last direction moved). The Marksman's weakness is now Glass Frame (proposed). Base stats are the design's percentages on `BASE` in `src/data.js`. Each class's Multi Shot works as the design says (wider arc, more bolts, parallel lines, more daggers, outer rings). Equipped weapons add their flavor to the ability.

### Rounds and zones
30 rounds, five per zone. Each round: opening (0:00), build-up (0:30, new enemy types appear), swarm (1:30), then the mini-boss at 2:15 (on rounds 5, 10, …, 30 the zone's major boss comes instead). When it falls, 4 s of aftermath pull every pickup in, then Round Complete. Scaling per round and per zone follows the design. Enemies rise out of a spawn rune before they act.

### Enemies and bosses
All 18 design enemies plus the Void Fragment and Shard, and the v1 Skeleton and Demon (late spawns in every zone, as in v1). Each special works and shows its art: Wisp weave, Beetle armored front, Shroomling spores, Archer arrows, Wolf charge with chevrons, Crystal Golem shards, Shadow Crawler hiding, Healer Moth heals, Magma trail, Imp teleport and fireball, Lava Brute death burst, Wraith phasing and true damage, Nightmare fear aura, Shade Assassin strike and retreat, Void splitting, Reality Tear spawns, Void Anchor gravity. All 12 mini-bosses and 6 major bosses use their signature attacks from `bosses.json` (telegraph red for damage, purple for status), the Meadow Guardian's weak back, the charging side views, the Sovereign's darkness and the Emperor's three phases with a closing ring.

### Level-up cards
The design's 12 cards in four rarities, class-preferred cards 1.5× as likely. **Cards only:** weapons, weapon levels and evolutions never appear here. Luck from the Training Grounds shifts the rarity odds along the design's table (`rarityOdds()`); Training Grounds T3 shows 4 cards (keys 1-4).

### Weapons (5)
Orbital Blades, Chain Lightning, Fire Trail, Frost Nova (with frost patches), Homing Missiles. **Only from the Forge** (`buildings.js` keeps `forge = { owned, mods, evo, equip }`; `syncWeapons()` copies the equipped ones into `player.weapons` at round start and whenever the Forge changes). Levels 1-7 via `getWpnCfg()`, which also applies mods (Amplify, Velocity, Piercing) and the Void Elixir. Siphon, Chill and Eruption run in `onHitEffects()` using `hitCtx` (which weapon or `'base'` is hitting). Main evolutions as before; alternate evolutions (Phantom Edge, Storm Cage, Ember Swarm, Glacial Tomb, Orbital Cannon) have their own behaviour and art in `combat.js`. Ten synergies.

### Farm, town and interiors (`src/farm.js`)
- **Drawn from the art itself.** `art/tools/farmhub/export_world.py` renders the Riverside farm (day one and built), the town and the seven interiors with the same code as the concept pages and cuts them into `art/sprites/world/`: a flat base per map, a collision mask (`*_solid.png`), and every building, prop, plot cover, crop bed, lot and finished building as its own sprite in `atlas0.png`, listed in `world.json` with its group, depth (`sy`) and footprint (`solid`). Re-run it after changing `farm.py`, `farm_start.py`, `town.py` or `interiors.py`, then rebuild.
- **Scale:** the sketches are drawn at `WS = 2` art pixels per sketch pixel so the 32×44 hero fits the doors and plots. Map coordinates in `world.json` are sketch pixels; the hero and camera use art pixels.
- **Groups:** `static` always; `lot:<id>` until that building is built, then `built:<id>`; `cover:<n>` while plot n is closed and `bed:<n>` once it's open; `scarecrow` once more than four plots are open. `spriteOn()` decides; `worldChanged()` rebuilds the footprints after a build or a plot clear.
- **Interacting:** Enter at the cabin door or a built building's door goes inside; at an unbuilt site's sign it opens the site menu (`openSite()`: what it is, what it does, later tiers, tier 1 cost and Build). Inside, Enter at the station opens the building's menu; walking down through the doorway goes back out. Town: Enter at a shop door or its keeper. Exits: east bridge to town, south path to the battle map.
- **Crops:** the field's 30 plots come from `world.json`; crop strips are drawn at `WS` on the beds. Harvested crops go to the Harvest Bin.
- **Pen:** chickens, cows, pigs and goats you own wander the pen.

### Buildings (`src/buildings.js` data, state and fight effects; `src/bmenus.js` menus)
- Build costs, tiers, potions, blessings, animals and mutators are tables at the top of `buildings.js`, from the design. `bld[id]` is the tier (0 = not built). Every menu shares `bFrame()` (tier pips, wallet, upgrade footer, **U** to upgrade) and the per-building looks from `art/concepts/buildings.html` (CSS copied from `art/tools/ui/buildings_template.html` into `head.html`).
- **Forge:** buy (25g + 2 signature), equip (1 slot, 2 after round 5; **E**), level up to the tier's cap, fit one mod per weapon (T2), evolve into either evolution when its stat gate is met (T3, level 5).
- **Alchemy Lab:** tabs for potions, elixirs, tonics and conversion (←/→). Brews go onto the Q/E/R belt (2 slots until T2) or into the 10-potion chest; **1-3** moves a potion from the chest to a belt slot. T3 makes every potion 25% stronger. Tonics need rare crops that can't be grown yet.
- **Training Grounds:** pick one of 7 stats once per round (+3%, +4% at T3) up to the tier cap; opens by itself when you come back from a fight. Luck shows the card odds before and after.
- **Shrine:** offering (10 materials + 30g; 5 + 15g at T3), three blessings, rerolls by tier, active slots by tier, replace when full.
- **Barn:** stalls by tier, buy (150g, proposed) and sell (half the tier's build gold; **S**), goats' material (**G**). Yields arrive when you return to the farm (`collectYields()`); dogs fight beside you (`updateDogs()`, `drawDog()`).
- **Arena:** pick up to tier-many mutators in a 5×3 grid; they apply to every fight until changed (`roundMuts`), and `onRoundEnd()` pays the bonus shown on Round Complete.
- **Cabin storage:** belt, Potion Chest and Harvest Bin (eat a crop for next round).
- Fight hooks called from `combat.js`: `extraDamageMult`, `extraCrit`, `critMultNow`, `extraArmor`, `extraDodge`, `extraSpeedMult`, `extraAtkSpeed`, `extraRegen`, `lootMult`, `gainMult`, `enemyMods`, `spawnRateMult`, `onHitEffects`, `shieldBlocks`, `playerHitFilter`, `tryPhoenix`, `updateBuildingEffects`, `drinkPotion(slot)`, `onRoundStart`, `onRoundEnd`, `drawMutatorOverlay`.

## What's built
Everything above, in `builds/rogue-shooter-v2.html`.

## What's not built
- Rare and legendary crops (so legendary tonics can't be brewed yet), the Void plot and the planting hover preview (multi-plot footprints)
- Mutator picks on the battle map (they're set in the Arena)
- Saving a run (Continue is greyed out), sound and music, mobile/touch controls
- Meta-progression between runs
