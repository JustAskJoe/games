# Intergalactic Card Trader

Working title. A cozy card shop on a market station where the galaxy's trade lanes cross: "happy space Akihabara".

Other · solo pitch · approved in Forge on 2026-10-31 by Hunter

**Status:** Prototype v1, 3 playable station days (desktop landscape). Next: crew playtest, then the crew deck.

- **Play:** [`builds/card-trader.html`](builds/card-trader.html) (keep its `img/` folder next to it), or in the Lab.
- **Build and test:** `python3 card-trader/build-and-test.py` (`--quick` skips the browser).
- **Design:** [design/v1-design.md](design/v1-design.md) · decisions in [design/handoff.md](design/handoff.md) · AI art list in [design/ai-assets.md](design/ai-assets.md)
- **Code:** `prototype/engine.js` (pure rules, seeded, every action through `act()`), `sim.js` (bots), `ui.js`, `art.js` (cards drawn in code), `music.js` (Lane FM placeholder beat).

- Brief: [pitch/brief.md](pitch/brief.md)
- Patch notes: [patch-notes.md](patch-notes.md)
- Pitch in Forge: https://jaj-forge.huntefl.workers.dev/forge#p-card-trader (the crew's answers stay there)

Folder layout: `pitch/ design/ deck/ prototype/ builds/` (see the repo's CONTRIBUTING.md).

© 2026 justaskjoe. All rights reserved.
