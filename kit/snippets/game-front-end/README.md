# Game front end: opening, title, 3 save slots, settings, pause

© 2026 justaskjoe. All rights reserved.

This is the "real game" shell any studio browser game can drop in. **Intergalactic Card Trader v1** used it first (`card-trader/prototype/`).

- **Opening**, about 3.5 s, and any click skips it:
  - the presenter's name sprays in as a tag, with particles and drips
  - a halftone wipe and an RGB-split flash reveal the key art
  - two diagonal bands whoosh across with speed lines
  - the first title line drops in letter by letter, then the second line slams down (screen shake, shockwave ring, spark burst)
  - a light sweep runs across the logo, the tagline spins in, cards fly past, and PRESS START blinks
  - the key art and the logo drift with the mouse (parallax)
- **Title menu:** Start, Settings, Credits, plus an optional scrolling radio ticker.
- **3 save slots** in `localStorage`, each showing the game's own summary line. Continue, New (asks before overwriting) and Delete (asks first). If storage is blocked, the slot screen says so.
- **Settings:** music, sound effects, reduced motion. Reduced motion shows the finished opening frame and stops the scrolling.
- **Pause** (the ☰ button in your HUD): Resume, Settings, Save & quit to title.

## Files
| File | What |
|---|---|
| `frontend.js` | The screens and the slot storage. It reads `FE_CONFIG`. |
| `frontend.css` | Its styles. They use the house tokens (`--ink`, `--magenta`, `--display`…); copy those from Card Trader's `head.html` or define your own. |
| `fx.js` | A canvas particle layer for spray, sparks and shockwave rings, plus screen shake and mouse parallax. You can use it on its own (big pulls, wins). |
| `config.example.js` | Card Trader's config, to copy. |

## Wiring it into a game
1. **Load order:** `config.js`, your engine, `music.js` (anything with `start`, `stop`, `sting` and `on`), `fx.js`, `frontend.js`, then your UI.
2. **Your UI keeps** `CTUI.screen` (`'opening'` at boot), `CTUI.slot`, `CTUI.startSlot(n, fresh)` and `CTUI.save()`.
3. **In `render()`:** while `screen !== 'game'`, draw `FE.render()`. Otherwise draw your game plus `FE.overlay()`. Call `FE.afterRender()` after every render.
4. **In your click handler:** send any `data-act` that starts with `fe-` to `FE.click(el)` and re-render. Ignore game clicks while `FE.pause`, `FE.inSettings` or `FE.confirm` is set.
5. **Saves:** your game state must be plain JSON. Card Trader keeps its RNG state in `G._s` for that. Call `CTUI.save()` after every action.
6. **Gate stings** on `FE.settings.sfx` and the beat on `FE.settings.music`.
7. **Stage size:** it's built for the 1280×720 letterboxed stage, with the shake keyframes reading `--st`, the stage's own transform. Set `--st` wherever you scale the stage.
