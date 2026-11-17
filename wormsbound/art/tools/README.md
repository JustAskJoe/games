# Wormsbound drawing scripts

© 2026 justaskjoe. All rights reserved.

Pixel art drawn in code, the method Rogue Shooter uses (`rogue-shooter/art/tools/`): Python with Pillow, colour ramps per material, light from the top-left, a dark outline. No image model, no outside images.

- `creatures.py`: **the sprites the game uses.** Ten creatures, one draw function each, 16 frames each.
- `lineup.py`: the "can you tell them apart as shapes?" sheet (`../concepts/v3-lineup.png`), laid out from `creatures.py`.
- `units.py`: the v2 sprites (round bodies with gear). No longer in the build; kept until someone decides to remove it.

Run `python3 creatures.py` from this folder, then `python3 ../../prototype/build.py` (the build inlines the sheet).

## Backgrounds (the one thing an image model makes)
- `gen_backgrounds.py`: generates a raw picture per theme with an open model on your own graphics card (free, nothing uploaded). Needs PyTorch and `diffusers`; details and the licence are at the top of the file. Raw pictures are big and are **not** committed.
- `backgrounds.py RAW_DIR`: fits them to the game: 680 × 380, pulled towards the theme's sky colours, dimmed, 40 colours. Writes `../backgrounds/<theme>.png` (the build inlines these) and `../concepts/backgrounds.png`.
- A theme with no picture gets a drawn backdrop, so deleting one is safe.
- The ground itself is not art from this folder: `prototype/look.js` paints it from the map's grid.

## How a creature is drawn and animated
- Each draw function paints its parts in groups and calls `f.at('legs' | 'tail' | 'body' | 'head' | 'prop')` before each group.
- A pose in `POSES` is an offset for each group plus a few flags (idle habit, eyes, muzzle flash, casting glow, lift, lying down). So one drawing gives all 16 frames.
- To change how a creature looks, edit its function. To change a movement for the whole cast, edit `POSES`.
- `ROWS` is the sheet's row order and **must match `CHARS` in `prototype/engine.js`** (the game finds a character's row by that order).

## Sprite sheet layout
- `../sprites/creatures.png`: 48 × 48 art pixels a frame, one row per character, facing right. Columns: idle 1, idle 2, walk 1 to 4, jump 1 and 2, aim, fire 1 and 2, cast 1 and 2, hurt, knocked out 1 and 2. The game flips a frame to face left.
- The team band, scarf or panel uses three **key colours** (`#C800C8` shade, `#FF00FF` mid, `#FF8CFF` light). The game swaps them for the unit's team colours when the page loads, so never use those three for anything else.
- Feet stand on row 45; the game puts row 46 on the ground.
- `../sprites/creatures.json`: the layout above, for tools.
- `../concepts/v3-creatures.png`: every frame, two team colours, light and dark ground. `../concepts/v3-creatures.gif`: the cast moving.
- The game uses idle, walk, aim, fire, hurt and knocked out today. Jump and cast are drawn and waiting for v3's movement and abilities.

## The v2 sheet (not in the build)
- `../sprites/units.png`: 32 × 32 art pixels a frame, columns idle 1, idle 2, hurt; drawn by `units.py`.
