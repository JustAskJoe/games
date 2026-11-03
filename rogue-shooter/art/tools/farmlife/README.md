# Farm life art scripts

© 2026 justaskjoe. All rights reserved.

Crops, the Barn animals and the farm and town people in the hero style.

- `crops.py`: every crop (5 quick, 7 standard, 7 rare, 4 legendary, 5 Void) in four stages (seed, sprout, growing, ready) on its plot: 1x1, 1x2 (rare) or 2x2 (legendary) on the 16-px grid, and the Void plot with pulsing neon cracks. Crops that glow get a second ready frame.
- `animals.py`: chicken, cow, pig, goat and the beehive, each with a 4-frame walk and a 2-frame idle (the dog comes from `../combat/fx.py`).
- `people.py`: the farmer, arena warrior, seed keeper and shopkeeper on the hero canvas (32x44), three facings, idle and walk, using the hero walk cycle.
- `build_farmlife.py`: writes strips to `art/sprites/farm/` (`farm.json` lists them) and builds `art/concepts/farm-life.html` with `../gallery.py`.

The crop icons are in `../ui/icons.py` (`crops`, `crops_high`). Run `python3 build_farmlife.py` from this folder.
