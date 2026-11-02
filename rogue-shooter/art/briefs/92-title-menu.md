# Title menu (#92)

© 2026 justaskjoe. All rights reserved.

Request (Joe, in Studio HQ's Art Cottage): "Create a Title menu for Rogue Shooter."

- Asset: a **title screen** that shows before class select: the ROGUE SHOOTER wordmark, a background scene, and a short menu. Today the game opens straight on class select, with the title as one line of gold text above the class cards (`builds/rogue-shooter.html`, `#startscreen`).
- Where it shows (screen, size): full browser window when the game loads and after "back to title". Designed at 1280 × 800 desktop (real size on each sheet) and checked at 400 px wide (R8).
- States / animations:
  - Menu buttons: idle, selected (keyboard or hover, gold pointer), pressed. Shown side by side on each sheet at 1x and 3x.
  - Menu items: **PLAY** (opens the existing class select), **HOW TO PLAY**, **CREDITS**. Only PLAY has a screen today; the other two are placeholders for Joe to keep, change or drop.
  - Controls hint in the existing menu style: "↑↓ choose · ENTER select".
  - No animation drawn. Cheap ones that would suit: the campfire flickers and heroes idle-bob (A), the eyes blink (B), the Marksman walks in place (C).
- Must read as: "Rogue Shooter, a cozy pixel monster-hunting game" at a glance, with PLAY obviously the next thing to press.
- Wordmark and all text are drawn as pixel rects or real text in code, never painted (R1, R2, R24). The sheets use the game's real sprites, copied from `SPR`, `HERO_PAL` and `MON_PAL` in the build.
- Directions:
  - A: Campfire Lineup: the five heroes round a campfire under a hanging wood sign, monsters at the edge of the dark; risk: the busiest of the three, so it may crowd small screens and fight the menu for attention.
  - B: Demon King Looms: a lone torchlit Knight before a towering Demon King under a red title, eyes glinting in the dark; risk: the darkest and least cozy, it reveals the 3:00 boss up front and uses the danger red for the title.
  - C: Field Journal: a parchment page pinned to the wood board with an ink-stamped title, a small iso diorama and stamped tab buttons; risk: the calmest and most readable but the least about action, and a bright card breaks from the game's dark overlays.
- Sheets: `art/concepts/92-A.svg`, `92-B.svg`, `92-C.svg`.
- Palette: only hexes from the draft `art/art-direction.md`.
- References (links only, for layout and readability, not to copy):
  - Wikimedia Commons, campfires: https://commons.wikimedia.org/wiki/Category:Campfires
  - Wikimedia Commons, hanging signs: https://commons.wikimedia.org/wiki/Category:Hanging_signs
  - Wikimedia Commons, field notebooks: https://commons.wikimedia.org/wiki/Category:Field_notebooks
  - Wikimedia Commons, pixel art: https://commons.wikimedia.org/wiki/Category:Pixel_art
- Estimate: **$0.** Source undecided, but a title menu is UI with lettering, so its finals are SVG/CSS and code-drawn pixel art made by Claude (R2), with no image-model spend. If the crew wants a painted key-art background as well, that's a separate request once a source and a style anchor are approved.
