# Hero drawing scripts

© 2026 justaskjoe. All rights reserved.

Python scripts (Pillow + NumPy) that draw the five v2 heroes, their walk and attack animations, and attack effects.

- `spritekit.py`: material color ramps, layered parts, pose groups, top-left shading, colored outlines, hand-placed detail pixels.
- `heroes.py`: the five heroes in front, side and back views. `WALK` and `ATTACK` hold the pose offsets for each frame.
- `abilities.py`: spacebar abilities (Shield Bash, Blink, Focus Shot, Shadow Dash, Ritual Burst) on a 128×112 canvas; the hero's canvas sits at (48, 34) and moves for the bash, blink and dash.
- `effects.py`: attack effects on a 96×88 canvas (the hero's 32×44 canvas sits at (32, 24)). Each effect returns a layer behind the hero and a layer in front.
- `build_sheet.py`: renders everything, writes the sprite sheets to `art/sprites/heroes/`, and builds `art/concepts/heroes.html`.

Run `python3 build_sheet.py` from this folder.

## Sprite sheet layout
- `<hero>.png`: 32×44 frames. Rows: front, side, back. Columns: idle, walk 1–4, attack 1–3, ability 1–3. Side faces right; flip it for left.
- `<hero>_fx.png`: 96×88 frames. Rows: front, side, back. Columns: attack 1–3 layer behind the hero, then attack 1–3 layer in front.
- `<hero>_ability_fx.png`: 128×112 frames, same layout: ability 1–3 behind, then ability 1–3 in front.
- `heroes.json`: the layout above, frame timings, and how far the hero moves on each ability frame (`ability_at`, in art pixels from its starting spot).
- Timing used on the sheet: walk 150 ms per frame; attack 140, 110 and 160 ms; ability 220, 160 and 300 ms; then back to idle.
