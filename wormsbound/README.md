# Wormsbound

Other · team pitch · approved in Forge on 2026-11-02 by Louiemark

**Status:** Prototype 1 engine and bot sim (Nov 2, 2026). No screens yet. **Next:** the local hotseat screen, so two people can play it on one computer. Current decisions: [design/handoff.md](design/handoff.md).

A turn-based artillery brawler for 2 to 4 friends on one screen: aim, read the wind, and lob shells across ground that blows apart. Shells that land without exploding stay live, and anyone close enough can lob them on.

- **Build and test:** `python3 wormsbound/build-and-test.py` (`--quick` runs fewer sim matches)
- **Code:** `prototype/engine.js` (pure rules: seeded, every action through `act()`, `hash()` checksum, bots), `prototype/sim.js` (bot balance run), `prototype/test.js` (rule checks)

### Adding things
- **A weapon:** add it to `WEAPONS` in `engine.js` (ammo, crater `r`, `dmg`), handle it in `land()`, and give the bots a way to score it in `scoreLanding()` so the sim uses it.
- **A player action:** add a case to `act()`. The UI and later online play both go through it.
- **Touched numbers?** Run the sim and put the before and after results in your pull request.

- Brief: [pitch/brief.md](pitch/brief.md)
- Patch notes: [patch-notes.md](patch-notes.md)
- Pitch in Forge: https://jaj-forge.huntefl.workers.dev/forge#p-wormsbound (the crew's answers stay there)

Folder layout: `pitch/ design/ deck/ prototype/ builds/` (see the repo's CONTRIBUTING.md).

© 2026 justaskjoe. All rights reserved.
