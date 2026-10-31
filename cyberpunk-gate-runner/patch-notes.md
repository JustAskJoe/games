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
- **Weapons are a path now:** one weapon fork per run, then a later fork with two upgrades for the gun you chose (for example Overcharge or Forked on the Arc gun). No more swapping guns mid run.
- **Cleaner gates:** the text floating above gates is gone. The gate itself is the one thing to read, and the lit side shows your choice.
- **Boss health bar:** a big fixed bar with the Enforcer's health as a percentage.
- **The city reacts:** windows and rooftop neon wake up as Overclock charges, and at the drop the Hush signs flip to "FREE THE BEAT" and fireworks go off over the street.
- **More impact:** shockwaves, a camera punch on gates and the drop, enemies bursting into neon shards, and a chain of explosions when the Enforcer falls.
- **The Enforcer lands on the drop:** it appears as the beat drops and walks through the horde for an 8 second fight, instead of dying in a fraction of a second.
- **Horde walls:** packs fill the whole road, from 24 enemies early to nearly 400 at the drop. Your fire carves a path and whatever gets through eats runners.
- **Split road at gates:** a divider leads into each gate, your side lights up with chevrons, the other dims, and both show what they'd do for you.
- **Weapons:** weapon gates offer Arc gun, Scatter, Railgun and Rockets, each fighting differently. Power gates and gold crates level your gun up.
- **Gates are real choices:** flat numbers, multipliers, fire rate, Overclock charge and risky trades, where the best pick depends on your squad.
- **Street signs fixed:** they hang off the buildings over the road instead of cutting into the walls.
- **Faster and a bit harder:** the city rushes past about 40% faster, your squad only has 1.7 seconds to shoot what's coming (was 2.3), and drones, bikers and the Enforcer all hit harder.

### Next up
- [x] @Zach: play the 3D build on PC and give a verdict. (done Oct 31, Zach: very fun, liked traveling through the city)
- [x] @Zach: judge the new pace on PC, then next are comparable gates and weapon upgrades. (done Oct 31, Zach approved and asked for everything)
- [ ] @Hunter @Joe: play the Lab preview on a real phone. It's the only proof the 3D runs well there.
- [x] Split road at gates, horde walls, boss on the drop, impact, city reacts. (done Oct 31, Zach with Claude)
- [ ] @Zach: judge the full P2 build on PC. Pass bar: do you want a second run without being asked?
- [ ] On-beat timing bonus and tap calibration, then music and a second street.

### Watch out
- [ ] **Not tested on a real phone or a real graphics card.** Automated runs use software graphics, so they prove it works, not that it's smooth. Frame rate is unmeasured everywhere.
- [ ] Automatic quality drop (under about 40 fps it lowers resolution, then turns glow off) has only been exercised in software graphics. Add `#q=0`, `#q=1` or `#q=2` to the URL to lock a tier.
- [ ] If the browser loses its graphics context (phones can do this when backgrounded), recovery is untested.
- [ ] three.js r159 is the last version with a single-script build. Upgrading later means adding a bundler. It logs a harmless deprecation warning in the console.
- [ ] The build grew from 56 KB to about 750 KB. Not measured on a slow connection.
- [x] The boss still dies in about 0.23s before reaching you, so its new model is barely seen until the boss-on-the-drop change. Rules are unchanged from P1. (fixed Oct 31, Zach with Claude: it's an 8 second fight now)
- [ ] Building from `prototype/v1` would overwrite this build with P1. Use v2.
- [ ] The squad draws at most 180 runners; the number shown is still the true count.
- [ ] **Hordes are the biggest performance risk:** several hundred enemies plus effects at once, not measured on any real device. Phones may need fewer drawn enemies.
- [ ] Nobody has played the hordes, boss fight, impact or city yet. They've only been checked with bots and stills.
- [ ] No slow-mo on the boss kill: game time is song time, so slowing it would desync the music. There's a chain of explosions instead.
- [ ] Weapons were tuned with bots. The Railgun is strongest in the sim (casual kills the boss 95% of the time, the others about 45%), so it may need trimming.
- [ ] You can still win without killing the Enforcer by surviving its contact, and a casual player does so in about 4 of 10 runs. That may feel flat.
- [ ] Sim bands changed for the harder tuning: random 25-60% is now 5-40%, idle at most 35% is now at most 25%. Smart and casual bands are unchanged. Needs a human check that a first run isn't punishing.
- [ ] The song tempo is unchanged at 122 BPM, so gates still arrive every 2 bars. "Faster" is world speed and less shooting time, not more gates per minute. Bots don't feel speed, so whether it's readable at this pace is a human call.

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
