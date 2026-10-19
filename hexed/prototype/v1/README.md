# Hexed v1 — tarot match-three prototype

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

Live: https://claude.ai/artifact/65Didw2rYeEAwuowShbuVH (feedback lands in the artifact db `feedback` collection).

First **real-time grid game** in the kit (everything before it was turn-based table or card games). Start here for any match-3, falling-block, or tile-swap prototype.

## Files
| File | What it is | Reuse |
|---|---|---|
| `engine.js` | Pure match-3 engine (`window.HX` / node). Seeded RNG, 8×8 masked board, match groups → specials (line 4, L/T, line 5), chained activations, 6 swap combos, gravity down or left, blockers (vine that spreads, stone with HP, 2×2 beast with HP), veils (jelly), bound pairs (locks), drop items (lanterns), darkness/light map, one-shot powers, goals, stars, `rankMoves` bot, `simulate()` | **Yes.** Swap the `LEVELS` and `CARDS` tables and the spell names |
| `art.js` | Vector art: 6 distinct-shape pieces (color-blind safe), special overlays, blockers, ribbon, cat coach, 20+ ink tarot emblems, CSS tarot card builder | Pattern yes; content per game |
| `ui.js` | Frame-based animation player, swipe + tap input, HUD, coach with guided hints, spread draw with card flips, map, menu, grimoire, feedback form (db + copy fallback) | Mostly yes |
| `head.html` / `body.html` | Phone-first night shell, board layers, sheets, tarot card CSS | Swap palette and fonts |
| `build.py` / `test.py` / `sim.js` | Concatenate to one HTML; Playwright swipe walkthrough at 390×844 and 320; headless balance sim | Yes |

## The pattern worth stealing: engine emits frames
`HX.move(S, a, b)` resolves the whole move synchronously and returns a list of **snapshots** (`swap`, `clear`, `fall`, `vine`, `shuffle`, `rest`), each with every piece's `{id, r, c}`, overlays, fx and spawn origins. The UI just plays frames in order, keyed by piece id: moved pieces tween via CSS transform, missing ids pop out, new ids slide in from their spawn cell. The engine never waits on the DOM, so the bot sim and the UI share one code path.

## Balance (casual bot = greedy with 45% sloppy picks, 40–60 runs per level)
Fool 100%, Magician 100%, High Priestess 88%, Empress 78%, Emperor 78%, Hierophant 90%, Lovers 75%, Chariot 83%, Strength 75%, Hermit 75% (bot sees in the dark; humans won't, so it plays harder).

## Lessons
- **Sim caught three bad levels before any UI existed.** Empress vines were bimodal (snowballing) → spread only every other unanswered turn. Emperor 35% → fewer colors, more moves. Hermit 3% → lanterns collect on the bottom **two** rows and two start on the board.
- **Drop-item goals need a bot term for item depth**, or the bot ignores them and the sim lies.
- **Distinct shapes per color** (crescent, flame, leaf, hexagon, toadstool, star) keep it readable in the dark level and for color-blind players.
- **Theme the mechanic from the card's real meaning** (High Priestess = hidden, Empress = growth, Hermit = inner light). Feels authentic to a tarot crowd.
- Guided first 3 moves on levels 0–I (glow + "swipe the glowing X left") plus a 7-second idle hint afterward.
