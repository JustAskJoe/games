# Wormsbound drawing scripts

© 2026 justaskjoe. All rights reserved.

Pixel art drawn in code, the method Rogue Shooter uses (`rogue-shooter/art/tools/`): Python with Pillow, colour ramps per material, light from the top-left, a dark outline. No image model, no outside images.

- `units.py`: the ten characters. One draw function each; `CHARS` at the bottom lists them **in the same order as `CHARS` in `prototype/engine.js`** (the game finds a character's row by that order).

Run `python3 units.py` from this folder, then `python3 ../../prototype/build.py` (the build inlines the sheet).

## Sprite sheet layout
- `../sprites/units.png`: 32 × 32 art pixels a frame, one row per character, facing right. Columns: idle 1, idle 2, hurt. The game draws a frame at 2× and flips it to face left.
- The body uses three **key colours** (`#C800C8` shade, `#FF00FF` mid, `#FF8CFF` light). The game swaps them for the unit's team colours when the page loads, so never use those three for anything else.
- The unit's feet stand on row 29; the game puts row 30 on the ground.
- `../sprites/units.json`: the layout above, for tools.
- `../concepts/units.png`: a contact sheet for people (two team colours, light and dark ground, and real game size along the bottom).
