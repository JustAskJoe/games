# Wormsbound

Other · team pitch · approved in Forge on 2026-11-02 by Louiemark

**Status:** Prototype 1, local hotseat (Nov 2, 2026): two people on one computer, five characters to pick from, best of three. **Next:** play it with a friend and fill in the feedback form. Current decisions: [design/handoff.md](design/handoff.md).

A turn-based artillery brawler for 2 to 4 friends on one screen: pick a character (Brick, Zip, Volt, Digger or Gale, each with its own shots and an SS ultimate), aim, read the wind, and lob shells across ground that blows apart. Shells that land without exploding stay live, and anyone close enough can lob them on.

- **Play:** download [`builds/wormsbound.html`](builds/wormsbound.html) and open it in a browser on a computer, or play it in the JustAskJoe Lab. Drag back from your unit and let go to fire; the title screen lists the keys.
- **Build and test:** `python3 wormsbound/build-and-test.py` (build, rule checks, sim, browser test; `--quick` skips the browser and runs fewer sim matches)
- **Code:** `prototype/engine.js` (pure rules: seeded, every action through `act()`, `hash()` checksum, bots), `ui.js` (canvas renderer, input, screens), `head.html` / `body.html` (styles and page), `build.py` (joins them into `builds/wormsbound.html`), `sim.js` (bot balance run), `test.js` (rule checks), `test.py` (Playwright browser test)

### Adding things
- **A character:** add it to `CHARS` in `engine.js` (health, armour, steps, climb, `shot1`, `shot2` and `ss`). Shots can use the existing fields (`wind`, `speed`, `knock`, `bounce`, `drill`, `strike`, `double`, and for an SS `rain`, `storm`, `quake`, `tornado`); anything new needs handling in `advance()` or `land()` and a line in the bots' `scoreLanding()`. Give it a look in `drawBody()` in `ui.js`, then run the full sim: it must win 40–60% of the round-robin.
- **A player action:** add a case to `act()`. The UI and later online play both go through it.
- **Touched numbers?** Run the sim and put the before and after results in your pull request.

- Brief: [pitch/brief.md](pitch/brief.md)
- Patch notes: [patch-notes.md](patch-notes.md)
- Pitch in Forge: https://jaj-forge.huntefl.workers.dev/forge#p-wormsbound (the crew's answers stay there)

Folder layout: `pitch/ design/ deck/ prototype/ builds/` (see the repo's CONTRIBUTING.md).

© 2026 justaskjoe. All rights reserved.
