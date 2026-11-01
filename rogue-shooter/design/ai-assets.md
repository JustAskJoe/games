# Rogue Shooter: AI-generated assets

© 2026 justaskjoe. All rights reserved.

For Steam AI disclosure and internal tracking.

## P1-art (Nov 1, 2026)

All pixel art sprites, palettes, ground tile system, and UI styling were authored by Claude (Anthropic) in code. No external image files — everything is Canvas draw calls and string-based sprite definitions rendered at runtime.

| Asset | Method | Notes |
|---|---|---|
| Player sprite (3 frames) | Claude-authored string sprite data | idle, walk1, walk2 with per-class palette |
| Slime sprite (2 frames) | Claude-authored string sprite data | squish animation |
| Bat sprite (2 frames) | Claude-authored string sprite data | wing flap animation |
| Skeleton sprite | Claude-authored string sprite data | sway animation via offset |
| Demon sprite | Claude-authored string sprite data | horns, wings, glowing eyes |
| Boss sprite | Claude-authored string sprite data | crown, larger scale (3x) |
| Ground tile system | Claude-authored procedural generation | isometric grass with flowers, tufts, pebbles |
| Color palettes | Claude-designed | Stardew Valley-inspired warm earthy tones |
| UI styling (CSS) | Claude-authored | Wood-panel theme, Press Start 2P font |
| Bullet visuals | Claude-authored Canvas draw calls | Per-class pixel-snapped rectangles |
| Weapon VFX | Claude-authored Canvas draw calls | Fire, frost, orbital, lightning, homing |

## P1.1 sprites, monsters and menus (Nov 1, 2026)

These replace the P1-art player and enemy sprites above.

| Asset | Method | Notes |
|---|---|---|
| Hero concept sprites (Knight, Mage, Marksman, Rogue, Witch) | Claude-authored string sprite data | In `builds/rogue-shooter.html` (idle + 2 walk frames each); sheet in `art/concepts/sketches.html` |
| Enemy concept sprites (Slime, Bat, Skeleton, Demon, Demon King) | Claude-authored string sprite data | In the build; slime squash and bat wings-down frames added |
| New monster concepts (Wisp, Shroomling, Moss Golem) and slime colorways | Claude-authored string sprite data and palettes | In the build as new enemy types and slime variants |
| Class-select and level-up menu styling | Claude-authored CSS/HTML | In `builds/rogue-shooter.html`; previews use the class sprites |
