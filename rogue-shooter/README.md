# Rogue Shooter

A rogue-like auto-shooter with a farm between fights. Pick a class, survive 30 rounds across six zones, and grow, buy and plan on your farm between rounds.

**Status:** v2 in progress (v2-M2: the farm-hub farm, enterable buildings and all six building menus are in the build).

## Play it
- **v2 (in progress):** open [`builds/rogue-shooter-v2.html`](builds/rogue-shooter-v2.html). Top-down, 3× pixel art, 30 rounds in six zones, farm and town.
- **v1:** [`builds/rogue-shooter.html`](builds/rogue-shooter.html), the old isometric build.

WASD or arrow keys to move; attacks are automatic and aim at the nearest enemy. Space for your class ability (aimed the way you face), Q/E/R for potions, TAB for stats, ESC to pause. On the farm, Enter to interact: build at a site's sign, go in through doors, use what's inside.

**On a phone or tablet** (hold it sideways): drag on the left half to move, tap the ability and potions bottom-right, II to pause, ACT on the farm. In menus, tap a row to pick it and tap again (or the green button) to use it; the buttons down the right side are the menu's keys (back, upgrade, equip…).

## Build and test (v2)
`python3 prototype/v2/build.py` builds `builds/rogue-shooter-v2.html`. `python3 prototype/v2/test.py` builds and plays it in headless Chromium (needs Python Playwright).

## What's here
| Folder | Contents |
|---|---|
| `builds/` | Playable builds (v2 in progress, v1) |
| `art/` | Concept sheets and drawing tools |
| `design/` | Handoff, v2 game design, art direction, AI asset list |
| `pitch/` | (empty — pitched outside Forge) |
| `deck/` | (empty) |
| `prototype/v2/` | v2 source, build and test scripts |

## The game (v2 build)
- **5 classes** from the v2 design, each with its own auto attack and spacebar ability: Knight (Sword Slash, Shield Bash), Mage (Magic Bolt, Blink), Marksman (Piercing Shot, Focus Shot), Rogue (Dagger Flurry, Shadow Dash), Witch (Hex Pulse, Ritual Burst).
- **30 rounds in 6 zones** (Meadow, Forest, Caverns, Volcanic, Shadow, Void), each with its own ground, obstacles, hazards, light and enemy roster; a mini-boss every round and a major boss every fifth.
- **12-card level-up pool** in four rarities (cards only; Luck from training improves the odds).
- **5 weapons**, bought, levelled, modded and evolved (ten evolutions) at the Forge, and ten synergies.
- **Farm and town** as drawn in `art/concepts/farm-hub.html`: plant and harvest crops, eat one before a fight for its buff, buy seeds and potions in town.
- **Six buildings** (Forge, Alchemy Lab, Training Grounds, Shrine, Barn, Arena), built from their sites, entered through their doors, each with its menu from `art/concepts/buildings.html` and three tiers.
- Art: the v2 sprite sheets in `art/sprites/` (heroes, enemies, bosses, biomes, effects, crops, people, icons) and the menus from `art/concepts/`.

© 2026 justaskjoe. All rights reserved.
