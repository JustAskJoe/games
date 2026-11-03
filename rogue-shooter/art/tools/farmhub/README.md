# Farm hub drawing scripts

© 2026 justaskjoe. All rights reserved.

Python scripts that drew the farm hub sketches in `art/concepts/farm-hub.html`. They're the reference for the v2 look (`design/art-direction.md`).

- `farm.py`: palette, drawing helpers (outlines, blue-tinted shadows, stepped glow, cliffs, water), props, crops, animals and the six buildings plus the cabin.
- `layouts.py`: round 1 layouts A and B. `layout_b2.py`: Riverside round 2.
- `farm_start.py`: the Riverside farm on day one (only the cabin; ruined and empty lots with stakes, rope and build signs; 4 open plots and 26 covered; empty pen). `build_start_page.py` + `start_template.html` build `art/concepts/farm-start.html` with a switch to the fully built farm.
- `npcs.py`: farmer and warrior sprites at sketch scale (the hero-style versions are in `../farmlife/people.py`).
- `town.py`: the town map (cobbled square, fountain, seed shop, general store, houses, market stall, notice board) at the same sketch scale; writes `art/concepts/scenes/town.png` and `town.json`. `build_town.py` builds `art/concepts/town.html`. `interiors.py`: the seven interiors.
- `build_page.py` + `page_template.html`: put the renders into the sketch page.
- `export_world.py`: cuts the farm (day one and built), the town and the seven interiors into game layers in `art/sprites/world/` (base, collision mask, and every building, prop, lot, plot cover and crop bed as its own sprite in `atlas0.png`, described in `world.json`). It redraws them with the same code as the pages, so the game matches them pixel for pixel. Run `python3 export_world.py` after changing `farm.py`, `farm_start.py`, `town.py` or `interiors.py`, then rebuild the game. `interiors.py` draws its furniture through `run_objs()` so the exporter can catch each piece.

Run from this folder with Python 3, Pillow and NumPy: `python3 layout_b2.py`, `python3 interiors.py`, then `python3 build_page.py`. `layouts.py` redraws the round 1 maps. The building close-ups (`b_*.png`) came from short one-off snippets that weren't saved, so `build_page.py` only works where those images already exist.
