# Enemy drawing scripts

© 2026 justaskjoe. All rights reserved.

Python scripts (Pillow + NumPy) that draw the v2 enemies in the same style as the heroes. They reuse the hero toolkit in `../heroes/spritekit.py` (material ramps, top-left shading, colored outlines, pose groups).

- `ekit.py`: enemy color ramps, shape and post-processing helpers (stepped glow, fade, flash, shimmer), and the registry.
- `meadow_forest.py`: Slime (six zone colors), Bat, Wisp, Beetle, Shroomling, Archer Sprite, Wolf.
- `caverns_volcanic.py`: Crystal Golem, Shadow Crawler, Healer Moth, Magma Slime, Fire Imp, Lava Brute.
- `shadow_void.py`: Wraith, Nightmare, Shade Assassin, Void Spawn / Fragment / Shard, Reality Tear, Void Anchor, plus the v1 Skeleton and Demon.
- `build_bestiary.py`: renders everything, writes the sprite sheets to `art/sprites/enemies/`, and builds `art/concepts/enemies.html` from `bestiary_template.html`.
- `preview.py`: quick contact sheet for checking art (`python3 preview.py out.png 5 wolf golem`).

Run `python3 build_bestiary.py` from this folder.

## Sprite sheet layout
- `<enemy>.png`: one row per view (front, side, back) and per variant (the Slime has six rows, one per zone). Columns: the move loop (4 frames), then the attack or special frames (3) when the enemy has them. Side views face right; flip for left.
- `<enemy>_<effect>.png`: projectiles and effects in one row (arrow, fireball, crystal shard, spore cloud, fire trail, heal pulse, fear aura, gravity well, death burst and so on). Projectiles point right; rotate them to aim.
- `enemies.json`: frame size, row and column names, timings, whether the enemy floats (its shadow sits lower and smaller), and each effect strip.

## Bosses
- `bosses_mini.py`: the 12 mini-bosses (two per zone). `bosses_major.py`: the 6 major bosses (rounds 5, 10, 15, 20, 25, 30).
- Each boss faces the camera (one view) with a 4-frame idle and a 3-frame signature attack, drawn full-size on the heroes' pixel grid (mini-bosses 44–80 px, major bosses 90–112 px).
- `build_bosses.py` writes `art/sprites/bosses/<boss>.png` (idle 1–4, then attack 1–3), effect strips, `bosses.json` (tier, attack name, timings, effects) and `art/concepts/bosses.html`.

`boss_views.py` adds the extra boss facings: side views for the Pack Leader Wolf and Cavern Wyrm (they charge) and the Meadow Guardian's back view with its glowing weak-spot knot (drawn in `bosses_major.guardian`). `build_bosses.py` imports it, so their sheets have a second row.
