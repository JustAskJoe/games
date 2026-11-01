# Intergalactic Card Trader

Working title. A cozy card shop on a market station where the galaxy's trade lanes cross: "happy space Akihabara".

Other · solo pitch · approved in Forge on 2026-10-31 by Hunter

**Status:** Prototype v3 rev 2, "the Back Room": a 10-day run where stock lives on the floor or in the back and selling uses both, with 3 eras, sealed and vintage sealed product, repacks, a store rating and a known-offenders board (desktop landscape). v3 art is placeholder (code-drawn, $0) until Hunter OKs the Gemini shot list. Next: a crew playtest. v2 was merged Nov 1.

- **Play:** [`builds/card-trader.html`](builds/card-trader.html) (keep its `img/` folder next to it), or in the Lab.
- **Build and test:** `python3 card-trader/build-and-test.py` (`--quick` skips the browser).
- **Design:** [design/v3-design.md](design/v3-design.md) (v3) · [design/v2-design.md](design/v2-design.md) (v2) · [design/v1-design.md](design/v1-design.md) · decisions in [design/handoff.md](design/handoff.md) · AI art list in [design/ai-assets.md](design/ai-assets.md)
- **Code:** `prototype/engine.js` (pure rules, seeded, every action through `act()`), `sim.js` (bots), `ui.js`, `art.js` (cards drawn in code), `music.js` (Lane FM placeholder beat).

- Brief: [pitch/brief.md](pitch/brief.md)
- Patch notes: [patch-notes.md](patch-notes.md)
- Pitch in Forge: https://jaj-forge.huntefl.workers.dev/forge#p-card-trader (the crew's answers stay there)

Folder layout: `pitch/ design/ deck/ prototype/ builds/` (see the repo's CONTRIBUTING.md).

© 2026 justaskjoe. All rights reserved.
