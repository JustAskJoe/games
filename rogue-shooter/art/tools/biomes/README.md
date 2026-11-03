# Battle biome scripts

© 2026 justaskjoe. All rights reserved.

Python scripts (Pillow + NumPy) that draw the six combat zones. Obstacles use the hero toolkit (`../heroes/spritekit.py`) through `../enemies/ekit.py`.

- `biomes.py`: per zone, a seamless 96×96 ground tile, small ground details (no collision) and obstacles (with collision radii or a ground hazard).
- `scenes.py`: builds one combat screen per zone (427×267 art px, a 1280×800 window at 3×) from those pieces plus the hero, enemy, effect and pickup sprites, then lights it for the zone. `scene(zone, calm=True)` leaves out the fight, for menu backdrops.
- `build_biomes.py`: writes `art/sprites/biomes/` (`<zone>_ground.png`, `<zone>_obstacles.png`, `<zone>_details.png`, `biomes.json`), `art/concepts/scenes/<zone>.png` and `art/concepts/biomes.html`.

Run `python3 build_biomes.py` from this folder (after the hero and enemy sheets exist).

## biomes.json
For each zone: the ground tile file, and for every obstacle and detail its box `[x, y, w, h]` in the strip. Obstacles stand on the bottom-center of their box; `radius` is the collision circle at the feet in art px. `radius: 0` means a ground shape with a `hazard` note (pond, log, lava pool, ruined arch, void pit). `glow` is the color of light the obstacle gives off.
