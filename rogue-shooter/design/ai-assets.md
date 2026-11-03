# Rogue Shooter: AI-generated assets

© 2026 justaskjoe. All rights reserved.

For Steam AI disclosure and internal tracking.

## P1-art (Nov 1, 2026)

All pixel art sprites, palettes, ground tile system, and UI styling were authored by Claude (Anthropic) in code. No external image files — everything is Canvas draw calls and string-based sprite definitions rendered at runtime.

| Asset | Method | Notes |
|---|---|---|
| Player sprite (3 frames) | Claude-authored string sprite data | idle, walk1, walk2 with per-class palette |
| Slime sprite (2 frames) | Claude-authored string sprite data | squish animation |
| Bat sprite (2 frames) | Claude-authored string sprite data | wing flap animation |
| Skeleton sprite | Claude-authored string sprite data | sway animation via offset |
| Demon sprite | Claude-authored string sprite data | horns, wings, glowing eyes |
| Boss sprite | Claude-authored string sprite data | crown, larger scale (3x) |
| Ground tile system | Claude-authored procedural generation | isometric grass with flowers, tufts, pebbles |
| Color palettes | Claude-designed | Stardew Valley-inspired warm earthy tones |
| UI styling (CSS) | Claude-authored | Wood-panel theme, Press Start 2P font |
| Bullet visuals | Claude-authored Canvas draw calls | Per-class pixel-snapped rectangles |
| Weapon VFX | Claude-authored Canvas draw calls | Fire, frost, orbital, lightning, homing |

## P1.1 sprites, monsters and menus (Nov 1, 2026)

These replace the P1-art player and enemy sprites above.

| Asset | Method | Notes |
|---|---|---|
| Hero concept sprites (Knight, Mage, Marksman, Rogue, Witch) | Claude-authored string sprite data | In `builds/rogue-shooter.html` (idle + 2 walk frames each); sheet in `art/concepts/sketches.html` |
| Enemy concept sprites (Slime, Bat, Skeleton, Demon, Demon King) | Claude-authored string sprite data | In the build; slime squash and bat wings-down frames added |
| New monster concepts (Wisp, Shroomling, Moss Golem) and slime colorways | Claude-authored string sprite data and palettes | In the build as new enemy types and slime variants |
| Class-select and level-up menu styling | Claude-authored CSS/HTML | In `builds/rogue-shooter.html`; previews use the class sprites |

## v2 groundwork (Nov 2, 2026)

| Asset | Method | Notes |
|---|---|---|
| Farm hub sketches (two farm layouts, Riverside round 2, building close-ups, seven interiors, farmer and warrior NPCs) | Claude-authored Python drawing scripts | `art/concepts/farm-hub.html`; scripts in `art/tools/farmhub/`. Concepts only, the style reference for v2 |

## v2 heroes (Nov 2, 2026)

| Asset | Method | Notes |
|---|---|---|
| Knight, Mage, Marksman, Rogue, Witch: front, side and back idle sprites | Claude-authored Python drawing scripts (`art/tools/heroes/`) | 32×44 art px, PNGs in `art/sprites/heroes/`, sheet in `art/concepts/heroes.html`. Not in the build yet |
| Hero walk (4 frames) and attack (3 frames) animations, all three views; witch staff replaces the broom | Claude-authored Python drawing scripts (`art/tools/heroes/`) | Sprite sheets `art/sprites/heroes/<hero>.png` (idle, walk 1–4, attack 1–3 per view) |
| Attack effects: sword arc, magic bolt, crossbow bolt and streak, dagger slashes, hex ring | Claude-authored Python drawing scripts (`art/tools/heroes/effects.py`) | `art/sprites/heroes/<hero>_fx.png` (behind and in-front layers per frame) |
| Spacebar abilities: Shield Bash, Blink, Focus Shot, Shadow Dash, Ritual Burst (hero poses and effects, all three views) | Claude-authored Python drawing scripts (`art/tools/heroes/abilities.py`) | Hero poses in `art/sprites/heroes/<hero>.png` columns 9–11; effects in `<hero>_ability_fx.png`; offsets in `heroes.json` |

## v2 enemies (Nov 2, 2026)

| Asset | Method | Notes |
|---|---|---|
| 23 enemy sprites: Slime (six zone colors), Bat, Wisp, Beetle, Shroomling, Archer Sprite, Wolf, Crystal Golem, Shadow Crawler, Healer Moth, Magma Slime, Fire Imp, Lava Brute, Wraith, Nightmare, Shade Assassin, Void Spawn / Fragment / Shard, Reality Tear, Void Anchor, Skeleton, Demon | Claude-authored Python drawing scripts (`art/tools/enemies/`) | Move loops (4 frames) and attack or special frames (3) in front, side and back for walkers, one view for fliers, blobs and fixed objects. Sheets in `art/sprites/enemies/`, bestiary in `art/concepts/enemies.html`. Not in the build yet |
| Enemy effects: arrow, charge line, spore cloud, crystal shard, heal pulse, fire trail, fireball, teleport puff, death burst, fear aura, shade strike, gravity well, claw rake | Claude-authored Python drawing scripts (`art/tools/enemies/`) | `art/sprites/enemies/<enemy>_<effect>.png` |

## v2 bosses, biomes and menus (Nov 2, 2026)

| Asset | Method | Notes |
|---|---|---|
| 12 mini-bosses: Giant Slime, Alpha Bat, Mushroom King, Pack Leader Wolf, Crystal Titan, Moth Queen, Magma Wyrm, Inferno Golem, Phantom Lord, Nightmare King, Void Hydra, Reality Breaker | Claude-authored Python drawing scripts (`art/tools/enemies/bosses_mini.py`) | Idle (4 frames) and signature attack (3), plus effect strips. `art/sprites/bosses/`, page `art/concepts/bosses.html`. Not in the build yet |
| 6 major bosses: Meadow Guardian, Forest Witch, Cavern Wyrm, Volcano Lord, Shadow Sovereign, Void Emperor | Claude-authored Python drawing scripts (`art/tools/enemies/bosses_major.py`) | Same layout as the mini-bosses, 90–112 px |
| Battle biomes for six zones: ground tiles, obstacles, ground details, combat-screen mocks | Claude-authored Python drawing scripts (`art/tools/biomes/`) | `art/sprites/biomes/`, screens in `art/concepts/scenes/`, page `art/concepts/biomes.html` |
| UI icons (cards, weapons, attacks, abilities, potions, materials, gold, XP, kills, timer) | Claude-authored Python drawing scripts (`art/tools/ui/icons.py`) | `art/sprites/ui/icons.png` + `icons.json` |
| Menu and HUD mockups: title, class select, battle map, combat HUD, level-up | Claude-authored HTML/CSS (`art/tools/ui/`) | `art/concepts/menus.html`. Not in the build yet |
| Farm on day one (Riverside layout with only the cabin built: ruined and empty lots, covered crop plots, empty pen) | Claude-authored Python drawing scripts (`art/tools/farmhub/farm_start.py`) | `art/concepts/farm-start.html` (toggle to the fully built farm), image in `art/concepts/scenes/farm_day_one.png` |
| Building menus: Forge, Alchemy Lab, Training Grounds, Shrine, Barn, Arena | Claude-authored HTML/CSS (`art/tools/ui/build_buildings.py`) over the Claude-drawn interiors | `art/concepts/buildings.html`. Not in the build yet |
| More UI icons: 14 potions, 12 crops, 9 blessings, 15 arena mutators, 6 animals, luck, lock, upgrade | Claude-authored Python drawing scripts (`art/tools/ui/icons.py`) | Added to `art/sprites/ui/icons.png` + `icons.json` |
| Combat art: 5 weapons and 10 evolutions, pickups (gold, XP gems, material drops), spawn, death, hit, crit, heal, level-up and dash effects, hero hurt and death frames, the dog companion | Claude-authored Python drawing scripts (`art/tools/combat/`) | `art/concepts/combat.html`; strips and `combat.json` in `art/sprites/combat/` |
| Crops (28) in four growth stages, plots and the Void plot; Barn animals; farmer, arena warrior, seed keeper and shopkeeper in the hero style | Claude-authored Python drawing scripts (`art/tools/farmlife/`) | `art/concepts/farm-life.html`; strips and `farm.json` in `art/sprites/farm/` |
| More UI icons: 16 rare, legendary and Void crops, 6 legendary tonics | Claude-authored Python drawing scripts (`art/tools/ui/icons.py`) | Added to `art/sprites/ui/icons.png` + `icons.json` (new rows at the end) |
| Town map (square, fountain, seed shop, general store, houses, market stall, notice board) | Claude-authored Python drawing scripts (`art/tools/farmhub/town.py`) | `art/concepts/town.html`, image in `art/concepts/scenes/town.png` |
| Menus, part 2: pause, stats, round complete, run over, victory, options, cabin storage, planting preview, seed shop, general store | Claude-authored HTML/CSS (`art/tools/ui/build_menus2.py`) over the Claude-drawn art | `art/concepts/menus-2.html`. Not in the build yet |
| Building menus at T3 (Forge evolutions, Alchemy tonics, all Arena mutators) | Claude-authored HTML/CSS (`art/tools/ui/build_buildings.py`) | Added to `art/concepts/buildings.html` |
| Extra boss views: Pack Leader Wolf and Cavern Wyrm side views, Meadow Guardian back view | Claude-authored Python drawing scripts (`art/tools/enemies/boss_views.py`, `bosses_major.py`) | Second row in their sheets in `art/sprites/bosses/`; `art/concepts/bosses.html` |

## v2-M2 farm in the game (Nov 3, 2026)

| Asset | Method | Notes |
|---|---|---|
| Game layers for the farm (day one and built), the town and the seven interiors: bases, collision masks, and each building, prop, lot, plot cover and crop bed as its own sprite | Claude-authored Python export script (`art/tools/farmhub/export_world.py`) re-rendering the Claude-drawn farm-hub, farm-start, town and interior art | `art/sprites/world/` (`world.json`, `*_base.png`, `*_solid.png`, `atlas0.png`). In the build |
| Building menus, site menus and cabin storage in the game | Claude-authored HTML/CSS/JS (`prototype/v2/src/bmenus.js`, styles from `art/tools/ui/buildings_template.html`) | In `builds/rogue-shooter-v2.html` |
