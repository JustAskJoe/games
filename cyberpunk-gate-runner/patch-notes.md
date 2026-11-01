# Cyberpunk Gate Runner: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked. Checkbox items stay open until someone ticks them. See open items with `python3 kit/open-notes.py`, or just yours with `--for Zach`.

---

## P2 · Oct 31, 2026 · Zach (with Claude)
First step of Prototype 2: new graphics, same game.

### What's new
- **The street is real 3D now:** a neon city with lit towers, Hush propaganda billboards, a striped synthwave sun, a wet glowing road and light arches that pass overhead on the beat.
- **New models for everything:** your runners, drones, bikers, the gold crate and the Hush Enforcer.
- The picture adapts to the window, so it plays wide on a PC as well as tall on a phone.
- **Street signs fixed:** they hang off the buildings over the road instead of cutting into the walls.
- **Faster and a bit harder:** the city rushes past about 40% faster, your squad only has 1.7 seconds to shoot what's coming (was 2.3), and drones, bikers and the Enforcer all hit harder.

### Next up
- [x] @Zach: play the 3D build on PC and give a verdict. (done Oct 31, Zach: very fun, liked traveling through the city)
- [ ] @Zach: judge the new pace on PC, then next are comparable gates and weapon upgrades.
- [ ] @Hunter @Joe: play the Lab preview on a real phone. It's the only proof the 3D runs well there.
- [ ] Split road at gates, horde walls, boss on the drop, impact, city reacts (one pull request each, in that order).

### Watch out
- [ ] **Not tested on a real phone or a real graphics card.** Automated runs use software graphics, so they prove it works, not that it's smooth. Frame rate is unmeasured everywhere.
- [ ] Automatic quality drop (under about 40 fps it lowers resolution, then turns glow off) has only been exercised in software graphics. Add `#q=0`, `#q=1` or `#q=2` to the URL to lock a tier.
- [ ] If the browser loses its graphics context (phones can do this when backgrounded), recovery is untested.
- [ ] three.js r159 is the last version with a single-script build. Upgrading later means adding a bundler. It logs a harmless deprecation warning in the console.
- [ ] The build grew from 56 KB to about 750 KB. Not measured on a slow connection.
- [ ] The boss still dies in about 0.23s before reaching you, so its new model is barely seen until the boss-on-the-drop change. Rules are unchanged from P1.
- [ ] Building from `prototype/v1` would overwrite this build with P1. Use v2.
- [ ] The squad draws at most 180 runners; the number shown is still the true count.
- [ ] Sim bands changed for the harder tuning: random 25-60% is now 5-40%, idle at most 35% is now at most 25%. Smart and casual bands are unchanged. Needs a human check that a first run isn't punishing.
- [ ] The song tempo is unchanged at 122 BPM, so gates still arrive every 2 bars. "Faster" is world speed and less shooting time, not more gates per minute. Bots don't feel speed, so whether it's readable at this pace is a human call.
## Art #25 · Oct 31, 2026 · Artist agent (with Claude)
Art only, no build change.

### What's new
- **Squad and enemy concepts (#25):** three directions for who's fighting in the street: the squad (normal cyan and near-white Overclock, back and front), the swarm, drones and bikers. The Hush Enforcer boss is untouched. Brief in `art/briefs/25-squad-enemies.md`; sheets `art/concepts/25-A.svg` (Street Ravers), `25-B.svg` (Glowstick Punks), `25-C.svg` (Bass Crew).
- **Draft art direction** in `art/art-direction.md` (the same draft as the #24 street concepts): the look, palette, color roles, readability rules, sizes from Prototype 2 and pipeline settings (`final_art_source: undecided`).
- Painted roughs requested from the free Cloudflare workflow (`art/concepts/25-roughs.json`), but none were made yet: see Next up.

### Next up
- [ ] @Zach: open the three sheets on a phone and reply `Pick: A`, `B` or `C` (plus notes) on the concepts pull request.
- [ ] @Zach @Hunter @Joe: review the draft `art/art-direction.md` with the concepts (it's the same file as in the #24 pull request).
- [ ] @Hunter: the `ART_KEY` Actions secret is missing on `JustAskJoe/games`, so the Art roughs workflow can't make roughs. Add it, then run **Art roughs** (Actions → Run workflow) on `art/cyberpunk-gate-runner-25-squad-enemies`.
- [ ] Whoever picks: decide the final-art source (Canva, a commission, or Claude building the models in `render.js`) and fill the cost table.

### Watch out
- [ ] The art direction is a **draft** written by the agent from the requests and P2; nobody has signed it off.
- [ ] The concepts are based on Prototype 2 on `zach/gate-runner-boss-tune`, which isn't on main yet. If that branch changes the units, re-check the sheets.
- [ ] Sheets were checked only in headless Chromium (1280 px and a 390 px phone width), not on a real iPhone or Android.
- [ ] Unit sizes on a phone come from `render.js` numbers and one P2 screenshot, not measured on a device. The real test is 180 runners and 400 swarm units on screen at once; the sheets only show a sample.
- [ ] Bikers stay red (as in P2) rather than pink, so they stand out from the swarm; red is also the risky-gate color. Confirm that's fine.
- [ ] Brief reference links (Wikimedia Commons categories) weren't opened by the agent; check they still resolve.
- [x] #24 and #25 are separate pull requests that both add the same draft `art/art-direction.md` and both add a patch-notes entry here, so whichever merges second needs a small patch-notes conflict fix. (done Nov 1, Artist agent: merged main into #25's branch after #24 merged, kept both entries)
- [ ] No cost in dollars or credits: source undecided and the cost table is empty. Count only: about 9 generations (7 + 25%).

## Art #24 · Oct 31, 2026 · Artist agent (with Claude)
Art only, no build change.

### What's new
- **Street concepts (#24):** three directions for the street the squad runs through, each showing towers and rooftop neon, the skyline, sun and sky, the road and overhead arches, and the hanging signs in both states (Hush propaganda before the drop, liberated after). Brief in `art/briefs/24-street.md`; sheets `art/concepts/24-A.svg` (Clean Synthwave), `24-B.svg` (Stacked Arcology), `24-C.svg` (Speaker City).
- **Draft art direction** in `art/art-direction.md`: the look, the palette from the request, color roles, readability rules, sizes from Prototype 2 and pipeline settings (`final_art_source: undecided`).
- Painted roughs requested from the free Cloudflare workflow (`art/concepts/24-roughs.json`), but none were made yet: see Next up.

### Next up
- [ ] @Zach: open the three sheets on a phone and reply `Pick: A`, `B` or `C` (plus notes) on the concepts pull request.
- [ ] @Zach @Hunter @Joe: review the draft `art/art-direction.md` with the concepts: palette, color roles (the city avoids cyan and pink), the four extra P2 shades, sizes, and `final_art_source`.
- [ ] @Hunter: the Art roughs workflow failed on this branch with "ART_KEY isn't set": the `ART_KEY` Actions secret is missing on `JustAskJoe/games` (probably lost in the move from onefiftylabs). Add it, then run **Art roughs** (Actions → Run workflow) on `art/cyberpunk-gate-runner-24-street` and the roughs will land on the branch.
- [ ] Whoever picks: decide the final-art source (Canva, a commission, or Claude building it in code in `render.js`) and fill the cost table, so finals can be priced.

### Watch out
- [ ] The art direction is a **draft** written by the agent from the request and P2; nobody has signed it off.
- [ ] The concepts are based on Prototype 2 on `zach/gate-runner-boss-tune`, which isn't on main yet. If that branch changes the street, re-check the sheets.
- [ ] The sheets propose violet / gold / green arches instead of P2's alternating cyan and pink ones (cyan and pink are reserved for the squad and Hush). That's a change to the current look; confirm it.
- [ ] Sheets were checked only in headless Chromium (1280 px and a 390 px phone width), not on a real iPhone or Android.
- [ ] Sizes on a phone (px per unit, sign and arch sizes) are worked out from `render.js` numbers, not measured in the running game.
- [ ] Brief reference links (Wikimedia Commons categories) weren't opened by the agent; check they still resolve.
- [x] #24 and #25 are separate pull requests that both add the same draft `art/art-direction.md` and both add a patch-notes entry here, so whichever merges second needs a small patch-notes conflict fix. (done Nov 1, Artist agent: merged main into #25's branch after #24 merged, kept both entries)
- [ ] No cost in dollars or credits: source undecided and the cost table is empty. Count only: about 10 generations (8 + 25%).

## P1 · Oct 31, 2026 · Zach (with Claude)
First playable build.

### What's new
- **Prototype 1 is playable:** one street of about 60 seconds on an original 122 BPM house loop. Drag to steer, pick gates, shoot drones and bikers, crack the gold crate for the arc gun, and melt the Hush Enforcer when the beat drops.
- **Overclock:** good gates before the drop charge it; at the drop it multiplies damage up to ×3.
- One tap retry, results with credits, feedback form, and tester jumps to the riser or the drop (Menu ≡).
- In the Lab as **Gate Runner** (`games.json`).

### Next up
- [ ] @Zach @Hunter @Joe: play it on a phone in the Lab and give feedback. Pass bar: everyone plays a second run without being asked.
- [ ] @Zach: decide commit, change or shelve after the playtest.
- [ ] Add the reusable parts (beat-grid street, song-time engine clock, house synth) to `kit/` once the direction holds.

### Watch out
- [ ] Tested only in headless Chromium at 390×844 and 320×640, not on a real iPhone or Android. Audio sync on real phones is unverified, and there's no tap calibration yet (Neon Surf has one to borrow).
- [ ] Beat timing is by construction: gates arrive on the beat whatever you do. There's no separate on-beat timing bonus yet, so "hit gates on the beat" in the brief isn't a player skill in P1.
- [ ] Balance is tuned for "easy to start": the casual bot wins 98%. Random gate picks lose about 70% of runs, mostly to the boss. Real players may differ.
- [ ] Squad counts snowball (the smart bot peaks at 512). Fine for the fantasy, but it may make later districts hard to tune.
- [ ] The music is a code-synthesized placeholder, not the original tracks the brief calls for.
- [ ] The feedback form posts to `/forge/api/feedback` with `game: cyberpunk-gate-runner`. Not checked against the live Lab, so confirm one answer lands in Forge.

## 0.1 · Oct 31, 2026 · Zach (with Claude)
Pitch only, no build yet.

### What's new
- New game folder for the cyberpunk runner shooter, with the brief from Forge in `pitch/brief.md`.

### Next up
- [ ] @Hunter: Forge couldn't open this new-project pull request itself (GitHub 403 on POST /pulls: "Resource not accessible by personal access token"). Its GitHub token likely needs Pull requests: write on `JustAskJoe/games`. This folder was added by hand instead.
- [ ] @Hunter @Joe: answer the pitch in Forge so the crew can discuss it.
- [ ] @Zach: add weekly hours to the brief and pick a music owner.
- [x] @Zach: build Prototype 1 (scope in `pitch/brief.md`) and add it to `games.json`. (done Oct 31, Zach with Claude)

### Watch out
- [ ] Every decision in the brief is from a solo pitch and hasn't been discussed by the crew.
- [ ] Story and character names in Forge (Neon City, Hush, Echo, Static, Director Vale) are first drafts.
- [ ] Competitors and the "why now" claims aren't verified yet. Check before any slide.
