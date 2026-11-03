# Moonwort & Co.: Prototype 1

© 2026 justaskjoe. All rights reserved.

A 2D, phone-first web build covering 3 in-game days: a familiar quiz, the shop, the bench, one garden bed, the hedgerow, and a grimoire of real lore cards. See `../../design/handoff.md` for the decisions behind it.

| File | What it does |
|---|---|
| `data.js` | Every number and line: herbs, traits, preparations, brews, duds, villagers, days, quiz |
| `engine.js` | Pure rules: real moon and season, brewing, judging, hints, the day loop (runs in Node) |
| `art.js` | Placeholder art drawn in code (SVG) |
| `audio.js` | Synth sounds |
| `ui.js` | Screens, input, save, feedback |
| `head.html`, `body.html` | Page shell and styles |
| `build.py` | Builds `../../builds/moonwort-co.html` and embeds `../../design/lore/ingredients.json` |
| `sim.js` | Brewing fairness checks (pass band) |
| `test.py` | Build check, sim, then a phone test in headless Chromium |

```
python3 build.py && python3 test.py      # --quick skips the browser
```
Add `?date=2026-11-20` to the build's URL to pin the moon for testing.
