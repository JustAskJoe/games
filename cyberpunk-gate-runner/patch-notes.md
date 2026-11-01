# Cyberpunk Gate Runner: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked. Checkbox items stay open until someone ticks them. See open items with `python3 kit/open-notes.py`, or just yours with `--for Zach`.

---

## P2.1 · Oct 31, 2026 · Zach (with Claude)

### What's new
- **Every gun fires differently:** Arc throws jagged lightning, Scatter sprays pellets, Rail fires a solid beam, and Rockets lob shells that burst.
- **Upgrades show on screen:** Overcharge adds a second strand, Forked branches out, Buckshot fires fat pellets, Wide Choke fans wider, Capacitor thickens the beam, Overpierce fires twin beams, Warheads hit bigger, and Cluster splits into small blasts.
- **Gun colours:** Arc is violet, Rail is off-white and Rockets are gold, so no gun uses the enemy pink.
- **Gates explain themselves:** each gate has a plain line under its number, like "more runners" or "shoot faster".
- **"Charge" is gone:** those gates now read OVERCLOCK +30%, "stronger drop", and the meter shows your actual damage at the drop, like ×1.6.
- **Clearer path choice:** a bouncing ▼ sits over the gate you're heading for, and the other gate dims much further.
- **Weapons and gates screen:** a new start-menu button lists every gun, both of its upgrades and what each gate does.
- **Random gates:** every run deals a new set of gates. The weapon fork and the upgrade fork stay in the same places, and the four guns on offer still change.
### Next up

### Watch out
- [ ] Weapon effects were judged from frozen stills, not in motion. Fire effects could feel busy with a big squad on a phone.
- [ ] Overclock no longer turns shots white, so each gun keeps its identity at the drop. They get thicker instead.
- [ ] Frame rate with Scatter or Arc at the drop isn't measured. Each shot segment is one instance (420 max).
- [ ] The ▼ is a small mark above the gate, which is close to the floating text you removed earlier. If it feels like clutter, remove it from `drawLabels`.
- [ ] Gate notes are about 10 px on a 390 px phone until the gate gets close. Check they're readable in time.
- [ ] Random gates make some runs luckier than others. A deal with few squad gates can be rough before the drop. Sim results are averages, so note any run that feels unfair.

## P2 art · Oct 31, 2026 · Zach (with Claude)

### What's new
- **Clean Synthwave city:** the street now follows the picked concept (#24 A). Towers sit dark with gold, violet and bone windows and one violet roofline. The road has chevrons and a bone centre line, the arches are violet frames that turn gold at the drop, and the sun is a dim violet-to-gold stripe that brightens.
- **Street Ravers squad:** your runners are now hooded ravers with a light strip down the back and a chunky blaster, and they turn near-white in Overclock.
- **Hush units:** swarm units are pink diamonds with a white mute bar, drones are flat saucers, and bikers have wide armoured shoulders and a pink visor. Models are flat-shaded.
- **Fixed:** the squad was running backward, with guns pointing at the camera. It now faces up the road and shows its back, and it leans into turns.
- **New signs:** before the drop every sign is Hush pink (HUSH, OBEY, NO MUSIC). At the drop each flips to its own slogan (LOUD, FREE THE BEAT, TURN IT UP).

### Next up
- [ ] @Zach: play it and check the city still feels alive before the drop. It's much darker now, on purpose, so the road and the drop stand out.
- [ ] @Zach: check you can tell swarm from drones and bikers at full speed, and that a big squad doesn't blur into one cyan shape (the sheet's own risk).

### Watch out
- [ ] Removed two old sign pairs, NEON CITY 2089 and OVERCLOCK NEON CITY UNMUTED, because the sheet shows three pairs.
- [ ] Arches on PC can look pink-white in the first moments of the drop while the colour fades to gold. Seen in a still, not judged in motion.
- [ ] Swarm units sway now instead of spinning, so the mute bar stays readable. Up close that's less lively; judge in motion.
- [ ] The Enforcer boss wasn't redesigned (the request excluded it), and it still has its old model next to the new units.
- [ ] Frame rate wasn't measured. Swarm models have fewer triangles but squad models have similar counts; check a full horde on a mid-range phone.
- [ ] Judged from stills on a software renderer, not on a real phone. Dark towers may crush to black on a dim phone screen.

## P2 · Oct 31, 2026 · Zach (with Claude)
First step of Prototype 2: new graphics, same game.

### What's new
- **The street is real 3D now:** a neon city with lit towers, Hush propaganda billboards, a striped synthwave sun, a wet glowing road and light arches that pass overhead on the beat.
- **New models for everything:** your runners, drones, bikers, the gold crate and the Hush Enforcer.
- The picture adapts to the window, so it plays wide on a PC as well as tall on a phone.
- **Harder music:** same 122 BPM, but a punchier kick, a pumping detuned bass, an acid line through the build, darker chords and a screaming hoover riff at the drop. Still original and made in code.
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
- [ ] The new music was checked for errors and levels only. Claude can't hear it, so whether it sounds good is a human call. It also adds more audio voices at the drop, which is a risk on phones.
- [ ] **Hordes are the biggest performance risk:** several hundred enemies plus effects at once, not measured on any real device. Phones may need fewer drawn enemies.
- [ ] Nobody has played the hordes, boss fight, impact or city yet. They've only been checked with bots and stills.
- [ ] No slow-mo on the boss kill: game time is song time, so slowing it would desync the music. There's a chain of explosions instead.
- [ ] Weapons and upgrades were tuned with bots, so a human may find one clearly best. See the table in `prototype/v2/README.md`.
- [ ] You can still win without killing the Enforcer, but contact now costs twice as many runners. A casual bot kills it in 54% of runs and survives it in about 35%. Check that a survive win doesn't feel flat.
- [ ] Peak squads are about 100 now, down from 198, after the weapon path brought back fewer power gates. Bands still pass. Results differ by upgrade: Scatter's upgrades kill the boss far less often than Rail's.
- [ ] Sim bands changed for the harder tuning: random 25-60% is now 5-40%, idle at most 35% is now at most 25%. Smart and casual bands are unchanged. Needs a human check that a first run isn't punishing.
- [ ] The song tempo is unchanged at 122 BPM, so gates still arrive every 2 bars. "Faster" is world speed and less shooting time, not more gates per minute. Bots don't feel speed, so whether it's readable at this pace is a human call.
## Art #25 · Oct 31, 2026 · Artist agent (with Claude)
Art only, no build change.

### What's new
- **Squad and enemy concepts (#25):** three directions for who's fighting in the street: the squad (normal cyan and near-white Overclock, back and front), the swarm, drones and bikers. The Hush Enforcer boss is untouched. Brief in `art/briefs/25-squad-enemies.md`; sheets `art/concepts/25-A.svg` (Street Ravers), `25-B.svg` (Glowstick Punks), `25-C.svg` (Bass Crew).
- **Draft art direction** in `art/art-direction.md` (the same draft as the #24 street concepts): the look, palette, color roles, readability rules, sizes from Prototype 2 and pipeline settings (`final_art_source: undecided`).
- Painted roughs requested from the free Cloudflare workflow (`art/concepts/25-roughs.json`), but none were made yet: see Next up.

### Next up
- [x] @Zach: open the three sheets on a phone and reply `Pick: A`, `B` or `C` (plus notes) on the concepts pull request. (done Oct 31, Zach: picked A, Street Ravers, in chat with Claude)
- [ ] @Zach @Hunter @Joe: review the draft `art/art-direction.md` with the concepts (it's the same file as in the #24 pull request).
- [ ] @Hunter: the `ART_KEY` Actions secret is missing on `JustAskJoe/games`, so the Art roughs workflow can't make roughs. Add it, then run **Art roughs** (Actions → Run workflow) on `art/cyberpunk-gate-runner-25-squad-enemies`.
- [x] Whoever picks: decide the final-art source (Canva, a commission, or Claude building the models in `render.js`) and fill the cost table. (done Oct 31, Zach: Claude builds it in code, so no cost table needed)

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
- [x] @Zach: open the three sheets on a phone and reply `Pick: A`, `B` or `C` (plus notes) on the concepts pull request. (done Oct 31, Zach: picked A, Clean Synthwave, in chat with Claude)
- [ ] @Zach @Hunter @Joe: review the draft `art/art-direction.md` with the concepts: palette, color roles (the city avoids cyan and pink), the four extra P2 shades, sizes, and `final_art_source`.
- [ ] @Hunter: the Art roughs workflow failed on this branch with "ART_KEY isn't set": the `ART_KEY` Actions secret is missing on `JustAskJoe/games` (probably lost in the move from onefiftylabs). Add it, then run **Art roughs** (Actions → Run workflow) on `art/cyberpunk-gate-runner-24-street` and the roughs will land on the branch.
- [x] Whoever picks: decide the final-art source (Canva, a commission, or Claude building it in code in `render.js`) and fill the cost table, so finals can be priced. (done Oct 31, Zach: Claude builds it in code, so no cost table needed)

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
