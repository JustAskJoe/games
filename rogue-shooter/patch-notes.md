# Rogue Shooter: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked.

---

## v2-M2 · Nov 3, 2026 · Joe (with Claude)
The farm is now the farm-hub art itself, every building can be built, walked into and used, weapons come only from the Forge, and every hero's basic attack aims at the nearest enemy.

### What's new
- **Basic attacks aim themselves.** Knight, Marksman and Rogue now swing and shoot at the nearest enemy, like the Mage's bolt; the Witch's pulse already hit all round. The hero turns to the target while attacking. Only the spacebar ability goes the way you're facing. The Marksman's weakness is now Glass Frame (80% HP, no armor) instead of Tunnel Vision.
- **Weapons only from the Forge.** Level-ups offer the 12 cards and nothing else. At the Forge: buy a weapon (25 gold + 2 of its signature material), equip it (one slot, two after round 5), level it to the tier's cap, fit one of six mods at T2, and at T3 evolve it into either of its two evolutions once its stat gate is met. The five alternate evolutions (Phantom Edge, Storm Cage, Ember Swarm, Glacial Tomb, Orbital Cannon) work in fights with their own art.
- **The Riverside farm exactly as drawn.** The farm, the town and all seven interiors are the farm-hub art, cut into layers (`art/tools/farmhub/export_world.py` → `art/sprites/world/`) so you walk behind buildings, trees and fences, and bump into everything solid. Day one shows the ruined lots and covered plots from `farm-start.html`; each lot turns into its finished building from `farm-hub.html` when built, and each plot cover gives way to its tilled bed when cleared.
- **Building sites.** Walk up to a site's sign and press Enter: what the building is, what it does, what its later tiers unlock, what tier 1 costs against what you have, and a Build button with a picture of the finished building.
- **Go inside.** Enter at a door takes you into the cabin or any built building, laid out as in `interiors.py`. Use the station inside (anvil, recipe book, drill yard, altar, the farmer, the arena warrior) to open the building's menu; walk out through the doorway.
- **All six building menus from `buildings.html`,** each in its own look, with tier pips, your gold and materials, and the next tier's unlocks and cost in the footer (U to upgrade): Forge; Alchemy Lab (potions, elixirs, tonics and conversion tabs, brewing onto the belt or into the 10-potion chest); Training Grounds (one stat a round, Luck with card odds before and after; it pops up after each fight); Shrine (offerings, three blessings, rerolls, replacing when full); Barn (stalls, buying and selling animals, goats' material, next round's yields); Arena (all 15 mutators by tier, reward and danger).
- **Everything they unlock works in fights:** 20 potions on a Q/E/R belt (2 slots until Alchemy T2), 9 blessings, 7 trained stats and Luck-weighted cards (4 cards at Training T3), Barn yields after every round, dogs that fight beside you and get knocked out, and the 15 Arena mutators (including Fog of War and Darkness) with their gold and material bonus shown on Round Complete.
- **Cabin storage** now holds the potion belt, the Potion Chest and the Harvest Bin; the general store's potions go on the belt (or into the chest once the Alchemy Lab is built).
- Town keepers stand outside their shops; owned chickens, cows, pigs and goats wander the pen.
- `test.py` now also checks the site menu and Build, going into the Forge and buying a weapon, every building menu, auto-aim and cards-only level-ups. Docs: handoff, game design (two decisions recorded), README, AI asset list and the farmhub README.

### Next up
- [ ] @Joe: play `builds/rogue-shooter-v2.html` in a real browser: the farm at 2×, walking in and out of buildings, each building menu with the keyboard, and the auto-aim for Knight, Rogue and Marksman.
- [ ] @Joe: decide the proposed numbers flagged below (animal price, Arena reward per mutator, belt slots before the Alchemy Lab, dog damage, the Marksman's new weakness).
- [ ] Rare and legendary crops so legendary tonics can be brewed, the Void plot and the multi-plot planting preview.
- [ ] Mutator picks on the battle map (the design puts them there; for now they're set in the Arena).
- [ ] Bees in the pen (their hive art exists) and dogs in the pen between fights.

### Watch out
- [ ] The farm, town and interiors are drawn at 2 art pixels per sketch pixel so the 32×44 hero fits the doors and plots. That mixes pixel sizes, which `design/art-direction.md` says not to do; a person should decide (and that page's "Where the art lives" still describes string sprites).
- [ ] Interiors are larger than the screen at 2×, so the camera scrolls inside them.
- [ ] Proposed, not designed: building is instant; Arena reward +50/+125/+225% for 1/2/3 mutators (capped by tier) and the T3 rare drop is a Golem Core; animals 150g, sold for half the tier's build gold; Barn yields arrive when you return to the farm; dogs bite for about 5/7.5/10% of basic-attack DPS each and take 60% of contact damage; shrine offerings take your most plentiful materials; the belt has 2 slots before the Alchemy Lab; Thorned bleeds 1.5% max HP a second; Mirror reflects as unblockable damage; alternate evolution numbers.
- [ ] The Barn uses S to sell, so S no longer moves down in that menu (arrow keys do).
- [ ] Legendary tonics list rare crops that can't be grown yet, so they can't be brewed. Seed conversion only turns quick seeds into standard ones.
- [ ] Wrath (+1% damage a second) has no cap and gets large in long rounds, as the design says.
- [ ] Fog of War and Darkness are drawn as stepped translucent overlays, not art.
- [ ] Not checked by hand in a real browser, on other window sizes or on a high-DPI screen; only headless Chromium at 1280×800.
- [ ] Balance isn't tuned for Forge-only weapons: the first weapon now costs a Forge (75g + 5 Bone) plus 25g + 2 materials.
- [ ] `export_world.py` lost about 2,000 pixels of shading (off by up to 19 in a channel) where translucent shadows overlap; it looks the same but isn't byte-identical to the pages.

---

## v2-M1 · Nov 2, 2026 · Joe (with Claude)
The v2 art is in the game: heroes, enemies, bosses, all six battle zones, weapon effects, pickups, every combat menu and the HUD, plus the farm and town redrawn at 3×. Built on the design's classes, 30 rounds and 12-card pool. Design doc updated with what the art added.

### What's new
- **Title screen** and **class select** as in `menus.html`: walking heroes, the design's six stats as segment bars, each class's attack, ability and cooldown, strength and weakness.
- **Battle map** before every fight: the zone's five rounds on its own ground, your hero on the next round, the boss as a silhouette, danger skulls, enemy and mini-boss portraits and a zone tip. Fight or return to the farm.
- **The five design classes:** Knight Sword Slash and Shield Bash, Mage Magic Bolt and Blink, Marksman Piercing Shot and Focus Shot, Rogue Dagger Flurry and Shadow Dash (2 charges), Witch Hex Pulse (hexed foes take +15%) and Ritual Burst. **Space** uses the ability. Heroes face front, back or side, walk on 4 frames, play their attack and ability frames with effects, flinch when hit and fall when they die.
- **30 rounds in six zones**, each with its seamless ground, obstacles, hazards (ponds and logs block, lava burns, void pits pull), path, details and light (cloud shadows, canopy light, crystal and lava glows, fog, vignettes). Rounds run opening, build-up, swarm, then a mini-boss at 2:15; every fifth round the zone's major boss comes instead.
- **Every enemy and boss from the art** with its special and its effect strips: Wolf charges, Archer arrows, Imp teleports, Lava Brute death bursts, Wraith phasing, Shade strikes, Void splitting, Reality Tears, Void Anchors, and all 18 bosses' signature attacks with red and purple telegraphs. The Meadow Guardian takes extra damage on its glowing back. Enemies rise from a spawn rune and die in a poof; bosses in a white flash.
- **Pickups:** spinning coins, gold piles, three XP gem sizes and bobbing material drops; materials are collected and shown in the HUD.
- **Weapons drawn from `combat.html`:** orbital blades, chain-lightning bolts, fire-trail flames (Hellfire when evolved), Frost Nova bursts and patches (Absolute Zero), missiles with hit bursts, Judgement pillars, hit and crit sparks, heal, dash dust, and a level-up burst before the cards.
- **Combat HUD** in the window corners: portrait, level, HP, XP; round, zone, timer, phase and boss bar; gold, kills, materials; weapon slots with level pips (second slot after round 5); the ability with a stepped cooldown; the Q/E/R potion belt.
- **Level-up** with the design's 12 cards in four rarities, rarity frames, class-pick tags and running totals. **Pause** (ESC), **Stats** (TAB, also from pause and level-up), **Options** (fullscreen, screen shake, damage numbers, hit flash), **Round complete**, **Run over** (with what beat you; Try again, New hero, Title) and **Victory**.
- **Farm at 3× on 16-px tiles:** the cabin, six building sites as day-one lots and ruins, a 6×5 field (plots 1, 2, 7 and 8 open, the rest under rocks and stumps until cleared), an empty pen, a river and bridge, lamps and icon signs. Plant the design's quick crops (standard from round 6) on the crop strips, harvest them to the Harvest Bin, and eat one at the cabin for its buff next round.
- **Town:** cobbled square, fountain, the seed shop and general store with their keepers, two houses, a market stall and a notice board. The seed shop and general store screens follow `menus-2.html` (seed bag, potions, field expansions, selling crops and materials).
- **Asset pipeline:** `build.py` embeds every sheet and manifest from `art/sprites/` into the build (`src/assets.js`, generated); `src/gfx.js` holds the sprite helpers. `test.py` plays the whole loop.
- **Design doc:** `design/game-design-v2.md` now includes the screens and HUD, hero feedback, spawns and telegraphs, pickups, the battle zones and hazards, boss signature attacks, crop stages and planting, cabin storage, the Riverside farm on day one, the town and its shops, and an **Open questions from the art pass** list. The art team's guesses are marked **proposed**.

### Next up
- [ ] @Joe: play `builds/rogue-shooter-v2.html` in a real browser at 1280×800: feel at 3×, the facing-only attacks for Knight, Rogue and Marksman, boss attacks, the farm loop.
- [x] @Joe: run `python3 prototype/v2/test.py` on a machine with Python and Playwright (it was rewritten this session but couldn't be run here). *(Joe with Claude, Nov 3: runs and passes in Claude's cloud workspace)*
- [ ] @Joe: answer the open questions at the end of the design doc.
- [x] Buildings (`art/concepts/buildings.html`): Forge (move weapons off the level-up cards), Alchemy Lab (potions and the Potion Chest), Training Ground, Shrine, Barn (animals in the pen, the combat dog), Arena (mutators on the battle map). *(Joe with Claude, Nov 3; mutators are picked in the Arena, not yet on the battle map)*
- [ ] Rare and legendary crops, the Void plot and the planting hover preview (multi-plot footprints, R to rotate).
- [x] Bring the farm closer to `farm-hub.html` (cliffs, terraces, waterfall, more props) and give the building sites their built states. *(Joe with Claude, Nov 3)*

### Watch out
- [ ] Python isn't installed on this machine, so `build.py` and `test.py` were edited but not run. The build was made with a PowerShell copy of `build.py` and tested in headless Edge 156 with a harness that drove the game loop (requestAnimationFrame doesn't run under headless virtual time). Nothing was checked by hand in a real browser, on other window sizes or on a high-DPI screen.
- [ ] Balance is first guesses for the 3× world: speeds and ranges (base speed 78 px/s, Frost Nova radius 46-50 px to match its art, Orbital radius 30-38 px), spawn timing, XP pacing (12 XP to level 2, ×1.16 per level), mini-boss HP (the design only gives major bosses), boss attack damage and cooldowns, drop rates (materials 20% from normal enemies, always from tougher ones).
- [ ] Collision radii are 0.35 × frame width (the handoff's starting point). Hazard shapes are ellipses and circles taken from the sprites.
- [ ] On rounds 5, 10, … 30 the major boss replaces the mini-boss. The design says every round ends with a mini-boss and every fifth has a major boss; confirm.
- [x] Knight, Rogue and Marksman attack the way they face (the design's blind spots and tunnel vision), so standing still facing away means no hits. Mage and Witch aim at enemies. *(Joe with Claude, Nov 3: every basic attack now aims at the nearest enemy)*
- [ ] Skeleton and Demon still spawn late in every zone, as in v1 (open question).
- [ ] The Void Emperor's phase 2 ("arena splits into platforms") isn't built; phase 3 closes a ring around where it enraged.
- [x] Weapons still come from level-up cards and potions from the town store until the Forge and Alchemy Lab exist. *(Joe with Claude, Nov 3: weapons only from the Forge, potions brewed at the Alchemy Lab)* Wheat's "+5 gold per kill" comes from the design but is large next to this build's 1-5 gold per enemy.
- [ ] Damage numbers are 16 px (crits 24 px) on screen, as on the HUD concept; the integration handoff said 8 px on the art canvas.
- [ ] Ability movement uses gameplay distances (Blink 80 px, Shield Bash 56, Shadow Dash 72) while the effect art assumes 12-30 px; the effects follow the hero, so trails look shorter than the move.
- [ ] Orbital blades and missiles are single pieces cut from frame 0 of their strips and rotated in code.
- [x] The farm and town buildings, lots, fences, signs, fountain, stall and notice board are painted in code with the farm palette, not loaded from `art/`. *(Joe with Claude, Nov 3: now the exported farm-hub art)* The layout is a simplified Riverside farm (no cliffs, terraces or waterfall). Building sites are decoration and say "not built yet".
- [ ] Seed prices: Wheat, Healing Herb, Frost Berry, Fire Pepper, Iron Vine and Echo Bloom use the `menus-2.html` placeholders; the rest, and the store's sell prices (crops at 40% of seed price, materials at 2 gold), are guesses. Which plots belong to which unlock group is my pick.
- [ ] The title's Continue button is greyed out (no saves) and Quit is left out (it can't close a browser tab). The Options audio section says there's no sound yet.
- [ ] `design/art-direction.md` "Where the art lives" still says the game uses string sprites; it should point at `art/sprites/` and `src/gfx.js`. Left for a person to change, as art direction is people-owned.
- [ ] No rows were added to `design/ai-assets.md`: the new farm and town pieces are drawn by code (the handoff says code needs no rows). Check whether the studio wants code-drawn art listed for the Steam disclosure.
- [ ] The build is about 3.2 MB because every sheet is embedded.

---

## v2-M0 · Nov 2, 2026 · Joe (with Claude)
Groundwork for v2: source files, a 3× pixel renderer, top-down combat, and the art direction. No new gameplay yet.

### What's new
- **Top-down combat.** The diagonal (isometric) camera is gone; combat is viewed straight down, and things lower on screen draw in front. The 1.4× diagonal speed fix is removed.
- **3× pixel renderer.** Combat draws on a small canvas in art pixels and is scaled up 3×, so every pixel is the same size. Sprites now show at 3× (they were 2×). The farm still draws at full size until its M2 redraw.
- **Source files.** The game is split into `prototype/v2/src/` (core, data, input, state, combat, ui, render, farm, main) plus `head.html` and `body.html`. `python3 prototype/v2/build.py` builds `builds/rogue-shooter-v2.html`; `python3 prototype/v2/test.py` builds and plays it in headless Chromium.
- **Art direction.** `design/art-direction.md` locks the farm hub style: palette, outlines, top-left light, blue-tinted shadows, 16-pixel tiles at 3×, three facing directions.
- **Farm hub sketches** saved to `art/concepts/farm-hub.html`, with the Python drawing scripts in `art/tools/farmhub/`.
- The v1 build `builds/rogue-shooter.html` is unchanged and still playable.
- **Hero finals.** All five heroes redrawn at 32×44 in front, side and back, with 4-frame walks, 3-frame attacks with effects, and spacebar abilities. The Witch now carries a crooked staff instead of a broom. Sheet: `art/concepts/heroes.html`; sprites in `art/sprites/heroes/`; scripts in `art/tools/heroes/`.
- **Enemy finals.** The whole v2 roster redrawn in the hero style, plus the v1 Skeleton and Demon: 23 sprites with move loops, attack or special frames, and 13 effect strips (projectiles, telegraphs, auras, death bursts). The Slime comes in all six zone colors. Bestiary: `art/concepts/enemies.html`; sprites and `enemies.json` in `art/sprites/enemies/`; scripts in `art/tools/enemies/`.
- **Boss finals.** All 12 mini-bosses and 6 major bosses, each with an idle loop, a signature attack and its effects (spike waves, fire breath, webs, boulders, geysers, darkness, the Void Emperor's beam and collapse ring). Bosses are now drawn full-size on the heroes' pixel grid instead of blown up 2×. Page: `art/concepts/bosses.html`; sprites in `art/sprites/bosses/`.
- **Battle biomes.** Six zones, each with a seamless ground tile, obstacles (with collision sizes), ground details and a lit combat-screen mock with the new hero and enemies. Page: `art/concepts/biomes.html`; pieces in `art/sprites/biomes/`; scripts in `art/tools/biomes/`.
- **Farm on day one.** The Riverside farm as a new run starts: only the cabin stands; the six building sites are empty lots or ruins marked with stakes, rope and a blank build sign; plots 1, 2, 7 and 8 are tilled and the other 26 are covered by rocks, stumps and weeds; the animal pen is empty. Page: `art/concepts/farm-start.html` (switch to the fully built farm to compare); script `art/tools/farmhub/farm_start.py`.
- **Building menus.** A menu for each of the six buildings, built from its design: Forge (weapons, levels, mods, evolutions), Alchemy Lab (recipe book, brewing, potion belt and chest), Training Grounds (the seven stats and how Luck shifts card odds), Shrine (offerings, three blessings, rerolls, active slots), Barn (stalls, yields, buying and selling animals) and Arena (fifteen mutators and the reward). Each opens over its interior in that building's own materials (iron, parchment, rope and canvas, glowing stone, barn planks, banners). Page: `art/concepts/buildings.html`; 60 new icons in `art/sprites/ui/`.
- **Menus, first pass.** Title, class select, battle map, combat HUD and level-up screens in the wood-panel style, plus a 16×16 icon set (cards, weapons, attacks, abilities, potions, materials). Page: `art/concepts/menus.html`; icons in `art/sprites/ui/`; scripts in `art/tools/ui/`.
- **Combat art.** Every weapon and its two evolutions as animated effects, pickups (spinning gold, three XP gem sizes, bobbing material drops), enemy spawn and death effects, hit and crit sparks, heal, a level-up burst and dash dust; hurt frames for every hero and facing and a death sequence; and the dog companion (walk, bite and knocked out in three facings). Page: `art/concepts/combat.html`; strips in `art/sprites/combat/`; scripts in `art/tools/combat/`.
- **Farm life.** All 28 crops in four growth stages on the right plot size (1x1, 1x2, 2x2), the Void plot and the five Void crops, icons for the 16 crops that had none, the six Barn animals walking and idling, and the farmer and arena warrior redrawn in the hero style plus two new shopkeepers. Page: `art/concepts/farm-life.html`; strips in `art/sprites/farm/`; scripts in `art/tools/farmlife/`.
- **Town.** The town map: a cobbled square with a fountain, the seed shop and the general store, two houses, a market stall and a notice board. Page: `art/concepts/town.html`; script `art/tools/farmhub/town.py`.
- **Menus, part 2.** Pause, stats (TAB), round complete, run over, victory, options, cabin storage (Potion Chest and Harvest Bin), planting with the hover preview, the seed shop and the general store. Page: `art/concepts/menus-2.html`.
- **Unlocked building screens.** The Forge with evolutions open, the Alchemy Lab's legendary tonics (six new icons) and the Arena with all fifteen mutators, added to `art/concepts/buildings.html`. The building menus now use the hero-style farmer and warrior.
- **More boss views.** Side views for the Pack Leader Wolf and Cavern Wyrm (both charge) and a back view for the Meadow Guardian showing the glowing knot that is its weak spot.

### Next up
- [ ] @Joe: play `builds/rogue-shooter-v2.html` and check top-down combat feels right at 3×.
- [x] M1 art batch 1: heroes in three directions (sketch sheet for approval first). Done by Joe with Claude, Nov 2, 2026.
- [x] Enemies in three directions, all zones. Done by Joe with Claude, Nov 2, 2026.
- [ ] @Joe: look over `art/concepts/enemies.html` and flag any enemy that doesn't read at 3×.
- [x] Mini-bosses (12) and major bosses (6) in the same style. Done by Joe with Claude, Nov 2, 2026 (drawn full-size, not 2×).
- [ ] @Joe: look over `art/concepts/bosses.html`, `biomes.html` and `menus.html` and mark what to change.
- [x] Menus still to design: pause, stats (TAB), round complete, death and win screens, options, and the farm-side menus (Forge, Alchemy, Training, Shrine, Barn, Arena, storage). Done by Joe with Claude, Nov 2, 2026 (`menus-2.html`, `buildings.html`).
- [x] Load the biome tiles and obstacles into the v2 combat ground (it's still a plain checkerboard). Done by Joe with Claude, Nov 2, 2026 (v2-M1).
- [x] Load the hero and enemy sprite sheets into the v2 build (still uses the old string sprites). Done by Joe with Claude, Nov 2, 2026 (v2-M1).
- [x] M1: v2 combat round in the Meadow zone (class attacks and abilities, 12-card system, round phases, materials, Meadow enemies and bosses). Done by Joe with Claude, Nov 2, 2026 (v2-M1, all six zones).
- [ ] @Joe: look over `art/concepts/combat.html`, `farm-life.html`, `town.html` and `menus-2.html` and mark what to change.
- [ ] Load the combat strips (`art/sprites/combat/`), crop and animal strips (`art/sprites/farm/`) and the new icons into the v2 build.
- [ ] Put the v2 art into the build following `design/art-integration-handoff.md` (asset pipeline first, then heroes, enemies, zones, effects, menus, farm, town).

### Watch out
- [x] Obstacles (trees, pines, rocks, lakes, houses) are the v1 placeholders drawn at half size, with collision radii halved to match. They get replaced in the M1 terrain pass. Replaced with the biome obstacles by Joe with Claude, Nov 2, 2026 (v2-M1).
- [ ] The combat view now shows about a third as much of the world (about 427×267 art pixels on a 1280×800 window). Spawn distances, speeds and ranges were not retuned; v2 rebalances them.
- [x] The ground is a plain checkerboard of greens until the Meadow tiles are drawn. Zone grounds in by Joe with Claude, Nov 2, 2026 (v2-M1).
- [ ] Floating damage numbers use 8 px Press Start 2P on the small canvas, so they show at 24 px; check they don't crowd the screen in big fights.
- [ ] Tested only in headless Chromium at 1280×800. Not tested on a real desktop browser, other window sizes or a high-DPI screen.
- [ ] Nothing here is on GitHub yet; it lives in the local folder until we make the branch.
- [ ] Enemy sizes are art-direction guesses (Slime 26×22 up to Void Anchor 40×54). Collision radii and spawn spacing need setting from the sprite sizes when they go into the game.
- [ ] Skeleton and Demon have no v2 zone; the design only names them as Bone and Demon Essence sources. Decide where they spawn or move those drops to other enemies.
- [ ] The Shadow Crawler, Wraith and Shade Assassin fade using see-through pixels; check they still read on dark Shadow and Void ground in the real game.
- [ ] Only checked as a page in headless Chromium; no enemy has been seen moving in the game yet.
- [x] Bosses have one view (facing the camera). Bosses that chase you (Pack Leader Wolf, Cavern Wyrm charge) may need side views once we see them move. Side views added by Joe with Claude, Nov 2, 2026.
- [ ] Boss sizes (up to 112 px) and collision radii aren't set in the game yet; check they fit a 427×267 screen with room to dodge.
- [x] The Meadow Guardian's weak spot is on its back, but it only has a front view. Decide how the back weak spot is shown. Back view with a glowing knot added by Joe with Claude, Nov 2, 2026.
- [ ] Ground hazards in `biomes.json` (pond, log, lava pool, arch, void pit) have no collision shape yet, only a note. They need boxes or polygons in the game.
- [ ] The menu mockups were checked with a stand-in font because Press Start 2P can't be downloaded in the workspace. Check the real font in a browser; long labels (class traits, map tips) could wrap differently.
- [ ] Day-one farm: which 4 plots start open (I used 1, 2, 7 and 8, top left) and what covers each locked plot are my picks, not from the design. The build sign has a hammer on it but no words.
- [ ] Day-one farm: decide whether building a lot clears its ruin instantly or shows a construction stage first; only the before and after are drawn.
- [ ] Building menus: the design doesn't give animal prices; the Barn shows 150g each (the T2 build cost, reading "buy new at full price" as that). Confirm.
- [x] Building menus: the Alchemy Lab's T3 tonics, the Forge's evolution screen and the Arena's T3 mutators are shown locked; their unlocked states aren't drawn yet. Drawn by Joe with Claude, Nov 2, 2026.
- [ ] Building menus: the Frost Nova description and Luck card odds at 12% (between the design's 0% and 15% rows) are my wording and interpolation.
- [x] Building menus: the UI kit styles are copied from `menus_template.html` at build time; when menus go into the game, move the kit into `prototype/v2/head.html` once. Moved by Joe with Claude, Nov 2, 2026 (v2-M1).
- [ ] Shop stock and prices (seed shop, general store) are placeholders: the design lists town shop specifics as not designed. What the general store sells (field expansions, basic materials, buying crops and materials back) is my guess.
- [ ] Planting: rotating a 1x2 crop with R and the red "blocked" preview are my reading of "hover preview showing space used". Rare crops are drawn lying across two plots side by side; the Void plot is drawn 2x2 (the design only calls it a special plot).
- [ ] XP gem sizes (small for most enemies, medium for elites, big for bosses) and the gold pile for elites are my picks; the design only says enemies drop XP and gold.
- [ ] The seed keeper and shopkeeper are new characters I made up for the town; the design has no shopkeepers or farmer role (NPCs are shelved). The market stall and notice board are decoration with no job.
- [ ] The town map is drawn at the farm sketch scale (like the farm maps), not at 3× game scale with hero-size people. Redraw it at game scale when the town goes into the build.
- [ ] Death frames rotate the idle sprite to lie it down, so its top-left light ends up on the wrong side while lying. Check it reads in motion; redraw the lying frame by hand if not.
- [ ] Barn animals only have a side view; if they wander up and down the pen they may need front and back views (the dog has all three).
- [ ] Stats, round-complete, run-over and victory numbers are mock values. "Try again keeps the hero" and "nothing carries over" on the run-over screen are my calls while meta-progression is undecided.
- [ ] Pickups are small (coin 12×14, small XP gem 8×6 art px). Check they stay visible in a crowded fight at 3×.
- [x] The UI kit CSS is now copied into three pages (menus, buildings, menus-2) at build time; move it into the game once. Moved into `prototype/v2/head.html` by Joe with Claude, Nov 2, 2026 (v2-M1).
- [ ] All new pages were checked only as screenshots in headless Chromium with the stand-in font.
- [ ] Changed the art rule on icons: icons show at 2×, 3× or 4× (whole numbers only), not only 3×. Revert in `design/art-direction.md` if we want 3× everywhere.

---

## P1.2 · Nov 1, 2026 · Joe (with Claude)
Frost Nova rework, level-up stats view, and farm path signs.

### What's new
- **Frost Nova persistent ground:** Frost Nova now leaves a frozen ice patch on the ground that persists for several seconds. Enemies walking through it are repeatedly slowed. Visual: translucent blue ellipse with ice crystal details.
- **TAB stats during level-up:** Press TAB while choosing an upgrade to see your current stats. The hint is shown on the level-up card bar.
- **Path signs on the farm:** Wooden signs on the farm paths point toward TOWN (right), BATTLE (down), and HOME (toward the house). The town map has FARM signs pointing back to both exits.
- **Stardew Valley farm overhaul** (from P1-art): tile-based top-down maps for farm, town, and house interior. Auto-transitions between areas, natural tree borders, pond, cobblestone town, furnished house with bedroom/kitchen/living room. Detailed pixel-art ground tiles, buildings, furniture, and decorations.

### Next up
- [ ] @Joe: playtest the farm phase — walk all paths, check signs are visible, enter town/house/battle.
- [ ] @Joe: playtest frost nova in combat — verify frozen ground slows enemies and disappears after a few seconds.
- [ ] Consider adding more interactable farm features (fishing, crops, NPCs).

### Watch out
- [ ] Farm/town/house maps are procedurally generated each run — layout is consistent but decoration placement varies.
- [ ] Sign text uses 6px "Press Start 2P" font — may be hard to read on small screens.
- [ ] Frost patch tick rate is 0.4s — very fast enemies may pass through without being slowed.
- [ ] Transition cooldown (0.5s) prevents re-triggering after closing shops, but rapid movement near edges could still feel janky.

---

## P1.1 · Nov 1, 2026 · Joe (with Claude)
New hero and monster sprites from the sketches, three new monsters, and new class-select and level-up menus.

### What's new
- **Class select:** each class card shows its pixel sprite on a patch of grass (the picked one walks), four stat bars (HP, power, speed, range, scaled against the other classes) and its two favored weapons. Pick with ← → (or A/D), Enter or Space to start, or 1-5 to jump straight in. Click still starts a run.
- **Level-up cards:** number badges with 1/2/3 hotkeys, ← → plus Enter, a **NEW** tag on weapons you don't have yet and "LV 1 → 2" on upgrades. Cards slide in, and clicks and keys are ignored for the first 0.35 s so a held key or stray click can't pick a card by accident.
- **New heroes:** every class has its own sprite now: the Knight's helm and shield, the Mage's hat and orb staff, the Marksman's hood and crossbow, the Rogue's mask and daggers, the Witch's hat and broom. Each has idle and two walk frames.
- **Redrawn enemies:** outlined slime (with a squash frame), bat (wings up and down), skeleton with a bone club (faces you), winged demon, and the crowned Demon King.
- **New monsters:**
  - **Wisp** (from 0:45): fast and frail, weaves side to side.
  - **Shroomling** (from 1:00): leaves a spore cloud when it dies; standing in it slows you by 40% for its 3 s.
  - **Moss Golem** (1:50 to 2:50): a slow mini-boss every 25 s, 22× slime HP, drops 4 XP orbs.
- **Slime colors:** after 1:00, most slimes come in ember, frost or venom. Cosmetic only.
- **Art sheet:** `art/concepts/sketches.html` shows every sprite at 4x and game size.

### Next up
- [ ] @Joe: playtest a full run with each class and the new monsters; check the sprites read mid-fight.
- [ ] Give the slime colors a gameplay meaning (for example ember burns, frost slows) or leave them cosmetic.

### Watch out
- [ ] Menus were checked in headless Chrome at 1280×800 and 400 px wide only. Not checked in a real desktop browser or by a player.
- [ ] Google Fonts didn't load in the test browser, so the screenshots used fallback fonts. Spacing may shift slightly with Press Start 2P loaded.
- [ ] The stat bars are relative to the five classes; a new class with bigger numbers will rescale every bar.
- [x] The README listed the classes as Knight, Mage, Rogue, Ranger, Cleric; the build has Knight, Mage, Marksman, Rogue, Witch. (Fixed by Joe with Claude, Nov 1.)
- [ ] The handoff's one-liner still says "10 waves plus a boss"; in the code the boss spawns at 3:00 of game time and there are no numbered waves. (README fixed.)
- [ ] The heroes are now 20×22 px (drawn at 40×44) against the old 10×14; the player hit radius (14) wasn't changed, so hits may feel a little generous. Enemy radii weren't changed either.
- [ ] New-monster numbers (HP, speed, spawn mix, golem timing) are first guesses, checked only in a sped-up headless run.
- [ ] No sketch has a Lead Artist plan (`art/lead-plan.md`) or `art-direction.md` yet; the art team doc expects one before concepts become finals.

---

## P1-art · Nov 1, 2026 · Joe (with Claude)
Stardew Valley pixel art upgrade — complete visual overhaul.

### What's new
- **Pixel art sprite system:** all sprites defined as string grids with palette mapping, rendered to offscreen canvases and cached. `renderSprite()`, `stamp()`, `tileHash()` for deterministic ground detail.
- **Warm earthy palette:** neon dark theme replaced with Stardew-inspired colors — parchment, wood, gold, earthy greens. CSS variables updated across all UI.
- **Press Start 2P pixel font** replaces Orbitron for headings and HUD.
- **Player:** 3-frame pixel sprite (idle, walk1, walk2) with per-class outfit palettes, facing flip, and bob animation.
- **Enemies:** pixel art slime (squish), bat (wing flap), skeleton (sway), demon, and boss. Hit-flash turns sprites white. Shadow ellipses under all entities.
- **Ground:** isometric grass tiles in varying greens with flowers, dark grass tufts, and pebbles. Replaces the dark grid.
- **Bullets:** pixel-snapped rectangles per class (knight bar, mage square, marksman line+dot, rogue rotated bar, witch large square).
- **Weapon VFX:** pixel-style fire patches (nested rects), frost rings (stroked arcs), orbital crosses (rotated fillRects), pixel-snapped lightning, rotated homing missiles.
- **XP orbs:** pixel gem with pulse glow.
- **UI:** wood-panel borders, warm brown overlays, square border-radius (4px), earthy card styling.
- **Canvas:** `imageSmoothingEnabled=false` + CSS `image-rendering: pixelated`.

### Next up
- [ ] @Joe: playtest all 5 classes with the new art. Check readability of sprites and effects.
- [ ] Consider sound effects and music.
- [ ] Polish: particle effects, death animations, screen transitions.

### Watch out
- [ ] Pixel sprites are small at default scale (PX=2). May need tuning on high-DPI or large monitors.
- [ ] All game logic is unchanged — balance items from P1 still apply.
- [ ] Tested only on desktop Chrome. Mobile touch input still not implemented.
- [ ] Sprite strings are hand-authored — complex shapes (boss, demon) have limited detail at this resolution.

---

## P1 · Oct 31, 2026 · Joe (with Claude)
First playable build.

### What's new
- **Prototype 1 is playable:** isometric auto-shooter with 5 classes, 5 weapons, 10 waves and a boss.
- **Evolution system:** weapons evolve at LV 5+ when a stat threshold is met. Each evolution has a legendary card with unique visuals and bonuses.
- **Synergy system:** all 10 weapon-pair combos grant a passive bonus with a notification banner.
- **3D-style character and enemy art:** chibi girl player, slimes, bats, skeletons, demons, and a winged boss, all drawn with gradients, rim lights and detail.
- **Infinite weapon scaling** past LV 3 with per-weapon formulas.
- **Weighted card selection** with 3× weight for class-preferred buffs and weapons.
- **Google Fonts:** Orbitron (display) + Rajdhani (body).

### Next up
- [ ] @Joe: play a full run with each class and check balance. Pass bar: every class can beat the boss.
- [ ] Decide commit, change or shelve after playtest.
- [ ] Consider sound effects and music.

### Watch out
- [ ] Tested only on desktop Chrome. Mobile touch input is not implemented — WASD/arrow keys only.
- [ ] Balance is hand-tuned, not simmed. Some weapon/class combos may be much stronger than others.
- [ ] No feedback form or Lab integration yet.
- [ ] `ctx.roundRect()` was removed for compatibility; arm shapes use `ctx.rect()` instead.
