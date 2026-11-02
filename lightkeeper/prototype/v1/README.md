# Lightkeeper prototype v1

© 2026 justaskjoe. All rights reserved.

Phone-first single-file web prototype. No libraries, no images, no build tools beyond Python.

## Files
| File | What |
|---|---|
| `engine.js` | Pure, deterministic engine (30 ticks/s) and the six nights (`NIGHTS`). Runs in Node and the browser |
| `render.js` | Canvas renderer, 360×640 world scaled to fit |
| `audio.js` | WebAudio synths (sea, drone, bells, knock, horn, gust, chords) |
| `ui.js` | Input, sheets, HUD, save, feedback |
| `head.html`, `body.html` | Page shell and styles |
| `build.py` | Joins everything into `../../builds/lightkeeper.html` |
| `test.py` | Build check, balance sim, then a headless phone test at 390 and 320 px (`--quick` skips the browser). Screenshots go to `shots/` (ignored by Git) |
| `sim.js` | Balance bots and pass band. `node sim.js 30` for more runs; `node sim.js windows` for each boat's safe timing |

## Making a night
1. Add an entry to `NIGHTS` in `engine.js`: `reefs` (x, y, r), `ships` (t seconds, x, y, h heading in degrees, 0 = east, 90 = down), boat speed `v`, `par`, and optionally `current`, `fog` or `storm`.
2. Run `node sim.js windows`. Every boat should have at least about 3 s of good timing. Fewer than that, and a person will feel cheated.
3. Run `node sim.js`. The smart bot must win at least 85%. If the sloppy bot also wins every time, the night has no decision in it.
4. Add a line to `TWIST` in `ui.js` saying what's new tonight.

## Lessons from v1
- **The forecast is the design tool.** One `forecast()` function drives the bot, the dotted course line and the timing-window check, so what the player sees is exactly what the sim tests.
- **Check every boat alone first.** Four of the first six nights had boats with no safe moment to light them. The windows check found them in seconds; the bot results alone only said "loses".
- **Fog needs range in the forecast.** If the beam can't reach a boat, lighting it is impossible; the first Fog night was unwinnable until the forecast knew that.
