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

## v3 creature lineup (Nov 16, 2026)

A concept sheet, not used by the game. Drawn in code by Claude; no image model and no outside images.

| Asset | Method | Notes |
|---|---|---|
| `art/concepts/v3-lineup.png` (10 creatures, one frame each, 48 × 48) | `art/tools/lineup.py` (Python, Pillow): shapes, colour ramps, top-left light, outline | For choosing the cast's look. Each is shown in colour and as a plain black shape. |

## v3 creature sprites (Nov 16, 2026)

Pixel art drawn in code by Claude. No image model and no outside images. These replace the v2 unit sprites in the build.

| Asset | Method | Notes |
|---|---|---|
| `art/sprites/creatures.png` (10 creatures × 16 frames, 48 × 48) | `art/tools/creatures.py` (Python, Pillow): shapes, colour ramps, top-left light, outline; frames made by moving groups of parts | In the build. Team colour only on a band, scarf or panel. |
| `art/concepts/v3-creatures.png`, `art/concepts/v3-creatures.gif` | written by the same script | Every frame, and the cast moving, for review |
