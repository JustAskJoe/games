# UI scripts

© 2026 justaskjoe. All rights reserved.

- `icons.py`: 16×16 pixel icons drawn with the hero toolkit: the 12 level-up cards, 5 weapons, 5 base attacks, 5 spacebar abilities, potions, the 7 materials, gold, XP gem, kills and timer, all 28 crops (`crops` and `crops_high`), blessings, mutators, animals, and the 6 legendary tonics (`tonics`). New groups go at the end so existing positions in `icons.png` don't move.
- `build_menus.py`: writes `art/sprites/ui/icons.png` and `icons.json`, and builds `art/concepts/menus.html` from `menus_template.html`: title, class select, battle map, combat HUD and level-up screens at 1280×800.

- `build_buildings.py` + `buildings_template.html`: the six building menus in `art/concepts/buildings.html`, each over its interior from `../farmhub/interiors.py`, plus the Forge, Alchemy Lab and Arena at T3 (evolutions, legendary tonics, all mutators). It reuses the UI kit styles from `menus_template.html`.
- `build_menus2.py`: the rest of the menus in `art/concepts/menus-2.html` (pause, stats, round complete, run over, victory, options, cabin storage, planting with the hover preview, seed shop, general store). Uses the same template and kit.

Run `python3 build_menus.py`, `python3 build_buildings.py` and `python3 build_menus2.py` from this folder (after the hero, enemy, boss and biome builds, `../farmhub/town.py` and the combat and farm life builds).

The screens are HTML and CSS over the pixel art, like the game's current HUD in `prototype/v2/body.html`, so the panel, button, bar, key, slot and card styles in the template can move into `head.html` when the menus go into the build. Sizes step in 3 px (one art pixel). Icons are shown only at whole-number sizes (2×, 3×, 4×).
