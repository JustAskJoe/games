# Wormsbound: AI-made assets

© 2026 justaskjoe. All rights reserved.

For Steam's AI disclosure. One row per file or batch, newest on top. Add your own rows too.

| Date | File(s) | Made with | Status | Issue / PR |
| --- | --- | --- | --- | --- |
| Nov 2, 2026 | `prototype/ui.js`: the five characters' looks and portraits (`drawBody`, `portrait`), their shots, SS effects (lightning, quake, tornado) and the lightning bolt (all drawn in code) | Claude (code-drawn, no image model) | Placeholder | P1 characters |
| Nov 2, 2026 | `prototype/ui.js`: the sky, ridges, terrain look, crews, duds, explosions and screens (all drawn in code) | Claude (code-drawn, no image model) | Placeholder | P1 hotseat |
| Nov 2, 2026 | `prototype/ui.js`: sound effects (synthesized in code with Web Audio) | Claude (code) | Placeholder | P1 hotseat |

## v2 unit sprites (Nov 11, 2026)

Pixel art drawn in code by Claude, the method Rogue Shooter uses. No image model and no outside images.

| Asset | Method | Notes |
|---|---|---|
| `art/sprites/units.png` (10 characters × 3 frames, 32 × 32) | `art/tools/units.py` (Python, Pillow): shapes, colour ramps, top-left light, outline | Body in three key colours the game swaps per team. First pass, not final. |
| `art/concepts/units.png` | written by the same script | Contact sheet for review: two team colours, light and dark ground, game size |
