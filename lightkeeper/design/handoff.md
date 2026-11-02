# Lightkeeper: handoff

© 2026 justaskjoe. All rights reserved.

The one page to read before touching this game.

**Team:** Zach, with Claude.
**Status (Nov 1, 2026):** Prototype v1, six nights, phone-first, solo. Bot-tested; not yet played by a person on a phone.

## The game in one line
Sweep a lighthouse beam: lit boats turn toward you, dark boats hold course. Bring every boat home past the reefs.

## Decisions (and why)
| Decision | Why |
|---|---|
| The beam has one effect: lit boats turn toward the lamp at 1.05 rad/s | One verb keeps it readable in a 5-second clip. Because every lit boat turns toward the same point, the puzzle is *when* to light, not *where*. |
| A boat pointing at the lamp keeps coming in the dark | Lets you juggle: point one boat, move on. This is what turns it from babysitting into planning. |
| You never touch a boat; drag anywhere aims the beam | No precision taps on tiny boats. Works with a thumb anywhere on screen. |
| Foghorn is its own button (global slow, 2.5 s, 9 s cooldown), not a tap on the water | A tap on the water would also swing the beam. A button avoids the tap/drag mix-up. |
| Dark boats show a dotted course line 3 s ahead | Without it you can't plan a dark run. It's the main teaching tool. |
| No boat bumps inside the harbor ring (72 px) | Boats all converge on the lamp, so they'd always collide at the mouth. That would punish success. |
| Hand-authored nights, checked by a sim | Each boat needs a fair "light window". `node sim.js windows` shows it. |
| Fixed seed per night (the storm's gusts too) | A lost night plays the same next time, so you can plan. It also makes replays and a daily night easy later. |
| Linocut look: ink blue, carved cream lines, one amber light | Only the beam, lanterns and harbor are bright, so the important things read at a glance. All drawn in code. |
| Removed a reef at the harbor mouth on Set Current | With the current it turned the night into a pileup, not a puzzle. |

## Architecture
- `engine.js`: pure and deterministic, 30 ticks a second. `create(night, seed)`, `act(G, intent)` (the only way to change the game: `aim` and `horn`), `step(G)`, `forecast(G, ship, lit, secs)` (shared by the bot and the course line, so they always agree), `hash(G)` and `replay(night, seed, log)`.
- `render.js`: canvas drawing in a 360×640 world, scaled to fit and centered. `audio.js`: WebAudio synths. `ui.js`: input, sheets, HUD, save (`localStorage` key `lightkeeper-v1`), feedback.
- `sim.js`: a smart bot (lights the most urgent boat whose lit course is safe) and a sloppy bot (nearest boat first). Pass band: the smart bot wins at least 85% of every night, and the sloppy bot loses at least 3 of nights 2 to 6.

## Balance now (20 runs per night)
| Night | Boats | Smart bot | Sloppy bot | Par |
|---|---|---|---|---|
| 1 First Light | 3 | 100% | 100% | 0:54 |
| 2 The Teeth | 4 | 100% | 0% | 0:54 |
| 3 Crossing | 6 | 100% | 0% | 0:54 |
| 4 Set Current | 6 | 100% | 85% | 1:06 |
| 5 Fog | 6 | 100% | 100% | 1:18 |
| 6 Storm | 8 | 87 to 90% | 0% | 1:10 |

The bots see through fog, so Fog's real difficulty isn't measured.

## What's not built
Night map art, lenses (wide, split, pulse), the keeper's log as a story, boat names on the hull, a daily night, endless mode, a deck, music beyond the drone.

## Next
1. Crew plays all six nights on real phones; collect feedback from the Lab.
2. Decide from feedback: is the beam too indirect on Night 2? Is Storm fair?
3. If it passes: 10 to 15 nights and the first lens.
