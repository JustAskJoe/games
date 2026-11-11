# Moonwort & Co.: handoff

© 2026 justaskjoe. All rights reserved.

The one page to read before touching this game.

**Team:** Hunter, with Claude. The crew (Draven and others) hasn't weighed in yet.
**Status (Nov 2, 2026):** Prototype 1, a 2D phone-first web build covering 3 in-game days. Bot-tested only; no person has played it on a phone yet.

## The game in one line
Neighbors knock with a trouble, never a recipe. You read what they need, mix up to three herbs, prepare each one, stir, and hand over the brew. Every herb you use opens a true lore card.

## The one question Prototype 1 answers
Is reading a villager's trouble and finding the right brew fun on its own? **Pass bar (from the brief):** at least 4 of 5 testers find a brew without help, ask to keep playing, and recall one real plant fact the next day. The first brew lands within 90 seconds of opening. The feedback form asks for the plant fact, and the end screen records the time to first brew.

## Decisions (and why)
| Decision | Why |
|---|---|
| 2D, drawn in code (SVG and CSS), not 3D greybox | Hunter, Nov 2: faster to build and test the brewing question. The Lead Artist plan (PR #101) recommends painterly 2D for the full game too; that's Hunter's call. |
| 3 in-game days, 3 villagers, 9 troubles | Hunter, Nov 2 (the brief said one day). Three days lets the garden pay off (sow at dusk, harvest at dawn) and gives trust a chance to grow. |
| 20 ingredients: 19 to brew plus moonwort as lore only | Hunter asked for 20. Moonwort, the namesake fern, is rare, so you find it on day 2 and leave it where it grows. That teaches "don't pick what's rare" without a lecture. |
| Three trait axes: warming / cooling, calming / brightening, drying / soothing | From the brief. They loosely echo the old herbals' hot / cold, dry / moist language, which the lore cards can explain. The numbers are game numbers, not medicine. |
| Brews are points in trait space; the nearest one within 1.75 is what you made | Many recipes reach every brew (the sim counts 50 or more per trouble), so it's about reading people, not finding the one answer. Distance sets the stars (1 to 3). |
| Four preparations: steep (as is), grind (strongest trait +1), dry (more drying), moonlight (+1 brightening on a waxing moon, +1 calming on a waning one) | One verb per idea. Moonlight ties brewing to the **real** moon tonight, as the brief promised. |
| No tinctures, no alcohol | Option B from the brief: kitchen-safe in the app. Hunter, Nov 2. |
| Duds are named and funny, sell for 1 coin, never fail you | From the brief. "Tonic of Mild Regret": the villager hiccups in Latin. |
| You can set a brew aside and try again before giving it | Lets players experiment without letting a villager down. Set-aside brews sell at dusk. |
| The familiar picks you through a 3-question quiz (cat, toad or crow) | Hunter, Nov 2. The familiar gives a hint after any brew that isn't the best one, by naming the biggest trait gap in words. |
| Lore cards come from a cited dataset (`design/lore/ingredients.json`, entries under `ingredients`) | Hunter wants it educational and correct. Sources: Culpeper (1653, public domain), NCCIH and NIH, Kew POWO and USDA PLANTS for names. Every card ends with "not medical advice". See `design/lore/README.md`. |
| Mugwort is pillow-only (`outerOnly`): it can make a salve or Dream Pillow, never a drink | Hunter, Nov 3, from the lore review: mugwort must not be used in pregnancy, and the app stays kitchen-safe. Valerian and yarrow stay brewable for now. |
| Only one gesture so far: stir (two circles), with "Stir for me" | Keeps scope small. Grind, pour and cork gestures come once brewing proves fun. |

## Architecture
- `prototype/v1/data.js` holds every number and line: ingredients and traits, preparations, brews, duds, familiars, quiz, villagers, the 3 days, seeds and the hedgerow.
- `engine.js` is pure: `moon(date)`, `season(date)`, `resolve(items, sky)`, `grade`, `hint`, `solutions` (every recipe for a brew, used by the sim, the test and hints), plus the day loop (`newGame`, `dawn`, `forage`, `plant`, `brew`, `serve`, `endDay`). It runs in Node.
- `art.js` draws the herbs, familiars, villager faces and the real moon as SVG. `audio.js` has the synth taps, bubbles and chimes. `ui.js` holds the screens, input, save (`localStorage` key `moonwort-v1`) and feedback (Lab, then copy fallback).
- `build.py` joins everything into `builds/moonwort-co.html` and embeds the lore JSON as `MW_LORE`. Add `?date=YYYY-MM-DD` to the URL to pin the sky for testing.
- `sim.js` checks the pass band: every brew is reachable, every trouble has at least 2 recipes from what you'd have on either moon, the first villager can be solved with 1 or 2 starting herbs, a sensible bot gets 9 of 9, and a careless mix makes a dud.
- `test.py` is the phone test. It plays the quiz and all 3 days by taps, with a real stir gesture on the first brew. It also checks lore, the dud, feedback, and that nothing scrolls sideways at 390 and 320 px.

## Build and test
```
cd moonwort-co/prototype/v1 && python3 build.py && python3 test.py
```
(`--quick` skips the browser.)

## Open calls
- Final name, the engine for the full game, and who reviews the lore. For now, Hunter plus cited sources is enough for a prototype.
- Full-game camera: painterly 2D or 3D. See the Lead Artist plan, PR #101.
- The traits are game design. Check whether they should follow Culpeper's "hot / cold, dry / moist" degrees once the lore data is in.

## Next
1. Hunter and the crew play it on a real phone (Lab preview on the PR).
2. Run the pass-bar test with 5 people, including the plant-fact recall the next day.
3. If brewing is fun: more gestures (grind, pour, cork), shop decor, and villager arcs that trust unlocks.
