# Intergalactic Card Trader: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. See the repo's CLAUDE.md for how patch notes work.

---

## v1 · 2026-10-31 · Hunter (with Claude): three playable station days
The first playable build: 3 station days at Stall 7 on Crosslane Market, desktop landscape, in a cel-shaded street-graffiti look. Design in `design/v1-design.md`, decisions in `design/handoff.md`.

### What's new
- **3 days, 7 or 8 customers a day**, all named regulars from 3 species (Mollu, Zekk, Puffi). Each species has its own card game (Shellstorm, Hive Gambit, Starweave) with 18 cards.
- **The Loupe:** check condition (centering, edges, surface), turn on the UV lamp to catch fakes, and decode alien scripts or pay the translator. Each tool costs the waiting customer 1 patience. Decode 3 cards of a game and you can read that game's script for good.
- **Haggling:** an offer slider with patience pips.
  - Mollu love round numbers.
  - Zekk split the difference fast.
  - Puffi crumble when you point out a flaw.
- **Buying and selling:** singles, 9-card binder lots, Nubb's shoebox, the bulk bin, and sealed packs (sell them sealed or rip them yourself).
- **Grading:** QuikSlab (cheap, next day, ±1) or Halo Bureau (dear, 2 days, exact). Day 3 ends with **Grade Day**, when every slab comes home.
- **Trade lanes:** each morning a different mix of ships sets the demand for each game and a hot list. Tomorrow's demand shows at close, so you can restock packs for it.
- **End of day:** a ledger, rent (soft: anything you can't pay goes on a tab), grading and restocking. **Card Night** after day 2: rip packs live on stream for hype.
- **A real game front end:** an opening sequence (spray-tag intro, halftone wipe, logo slam with shake and sparks, light sweep, flying cards, mouse parallax), then a title menu, **3 save slots** (the game saves itself after every move), settings (music, sound effects, reduced motion) and a ☰ pause menu. It's reusable: `kit/snippets/game-front-end/`. The "JustAskJoe presents" tag holds for about 2.6 s before the title (set per game with `hold` in `config.js`).
- **DJ Vee on Lane FM** coaches one hint at a time. The beat is an original synth loop (♪ toggles it).
- **Art:** Canva AI paintings for the key art, the shop, the docking bay, Card Night, the grader office, DJ Vee, all 9 regulars, and card art for all 3 games, each made with the key art as a style reference. Each customer lineup is one painting cut into portraits in code. Card frames, scripts, wear and UV are drawn in code.
- Balance sim (`node sim.js`): the careful bot doubles the shop's value (+105% median), a bot that never inspects gets about +4%, and a sloppy bot loses about 29%.

### Next up
- [ ] @Hunter @Zach @Joe: play all 3 days on desktop and say whether inspecting, haggling and Grade Day are fun. Pass bar: you start a second run without being asked.
- [x] Redo the grader office appraiser, who drifted toward a famous franchise look. Now a boxy robot. (Hunter with Claude, 2026-10-31) The list is in `design/ai-assets.md`.
- [ ] Crew deck (about 12 slides) from the brief, using the v1 art and screenshots.
- [ ] Add a playtest feedback form (the kit has one in Tower Defense).
- [ ] v2 ideas are parked in `design/v2-ideas.md`: a 5-day week, scalpers, pump-and-dump, fake rings and more. Decide after the v1 playtest.

### Watch out
- [ ] Tested in headless Chromium and Claude's browser pane only (1280×720, plus a 390/320 px check that nothing scrolls sideways). Not checked on a real desktop browser or with real players.
- [ ] Balance is bot-tuned. A perfect 10 grade showed up in only about 1% of careful-bot runs; real players who grade more may see more. Rent (40/60/90) and the pack prices are first guesses.
- [ ] The bots never use the translator, never point out flaws on lots, and never hold packs for Card Night. Human results will differ.
- [ ] Canva's AI throttles bursts (about 8 jobs, then cooldowns of several minutes that grew longer as the session went on). Plan art in small batches, or move character art to Gemini (see the art pipeline doc).
- [ ] Saves live in the browser's localStorage, so they're per browser and per device, and clearing site data wipes them. The Lab serves every game from one origin, so check that slot keys (`ict.v1.*`) don't collide when another game adopts the front end.
- [ ] CI's **Build and test** doesn't run Card Trader yet, like the other games except Tower Defense. Run `python3 card-trader/build-and-test.py` by hand before pushing.
- [ ] Canva's terms limit reselling raw AI images. Check with the legal reviewer before any of this art ships in a sold game.
- [ ] Theme check (from the 0.0 note): the setting is a happy station market with alien card games, trade lanes and grading. None of the names, UI or systems come from the reference game. Keep checking this at review.

## 0.0 · 2026-10-31 · Hunter (with Claude): new direction
Theme shift before any build: from a Tokyo back-alley card shop to **Intergalactic Card Trader**, "happy space Akihabara". The brief in `pitch/brief.md` is rewritten for it.

### What's new
- Trade lanes decide who docks each day; many species' card games, scripts you have to decode, and competing grading companies.
- Tone rule: warm and funny, never grim or cyberpunk, so it stays clearly apart from the reference game.
- Art only, no build change: first draft of the lead art plan (`art/lead-plan.md`) and art direction (`art/art-direction.md`) from the Lead Artist agent. It proposes a 2D counter view, card condition and fakes as code layers, and alien scripts as SVG glyph sets.

### Next up
- [ ] @Zach @Joe: answer the pitch in Forge, or react to the new direction.
- [ ] Crew deck (about 12 slides) from the brief.
- [ ] @Hunter: the decisions at the end of `art/lead-plan.md` (look, counter view or first person, glyph scripts, condition as code, the two in-world card games).
- [ ] @Hunter: commit the bake-off key art from `hunter/card-trader-v1` as `art/anchors/style-01.webp`, then fill in the palette in `art/art-direction.md`.

### Watch out
- [ ] A shop on a space station shares the reference game's setting; keep checking we're building our own systems and tone.
- [ ] The lead plan's hours and the first-release asset counts are estimates, not measured. Sizes in `art-direction.md` aren't checked against the phone prototype kit yet.
- [ ] The brief's PC first-person 3D doesn't fit AI-only art (lead plan risk 5).
- [ ] Card art might ship from Canva as raw files; the legal reviewer's answer on Canva's terms is still open.

## 0.0 · 2026-10-31 · Hunter (with Forge)
Project folder created from the approved pitch. Nothing built yet.

### What's new
- The brief is in `pitch/brief.md`.

### Next up
- [ ] Crew deck (about 12 slides) from the brief.
- [x] Add the game to the table in the repo README. (Hunter with Claude, 2026-10-31)

### Watch out
- [ ] The brief is a draft until the crew deck settles the open calls.
