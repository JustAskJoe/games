# Wormsbound: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. See the repo's CLAUDE.md for how patch notes work.

---

## v3 phase 1: kits, jumps and a retreat (rules changed) · 2026-11-17 · Hunter (with Claude)
The first playable slice of [`design/v3.md`](design/v3.md). **The rules changed.** Hunter answered the design's open questions so this could start; they're listed in the design under "Decisions so far". Louiemark hasn't weighed in yet, and any of it can be reversed.

### What's new
- **Every character has a kit, not a weapon list.** A passive that's always on, a basic shot (1), an ability (2), a move (3) and the SS. Nothing runs out: the ability and the move take 2 or 3 of your own turns to be ready again.
- **Gear is gone, and so are live duds as a weapon.** No gear screen, no LOB button. Old duds on maps are still a hazard that ticks down and goes off.
- **You can jump.** It costs 3 steps. Hopper jumps twice as high.
- **Your move doesn't end your turn.** Leap, blink, charge, burrow, glide or float, then shoot.
- **A retreat after your shot.** Once it lands you can still walk with what's left of a third of your steps (Zip keeps all of hers), then end the turn. Steps in the retreat cost no turn delay.
- **Ten passives:** Brick is hard to shove, Tusk shoves harder the further he walked, Zip keeps her movement, Hopper takes no fall damage, Volt's third hit arcs, Flint's hits burn, Digger walks through thin walls, Patch mends his crew, Gale turns the wind round, Nimbus slows whoever she hits.
- **New abilities:** Bulwark (a wall), Hook (drags someone to you), Skipping Stone (a blast at every skip), Fire Wall (fire that stays for 2 turns), Bridge (a span where it lands). Double Tap, Thunderstrike, Drill, Gust and Delay Ray carry over.
- **Six stats** on the select screen: Health, Armour, Power, Move, Jump, Weight.
- **Crates:** the gear crate is now a recharge (your ability and move are ready at once).

### Next up
- [ ] @Louiemark: play it and say whether kits, jumping and the retreat are the right direction. Everything here was decided by Hunter, not by you.
- [ ] @Louiemark: agree (or change) the new test band: across the ten characters, a computer using its whole kit beats one firing only basic shots 50-75% of the time. It replaces the two live-dud bands and the 14 gear bands, which no longer have anything to measure.
- [ ] @Louiemark: the room server needs redeploying before online play works with this build (`server/room.js` accepts `jump` and `wind` now).
- [ ] The pieces of the ten kits that were simplified to get a first playable (all in Watch out).
- [ ] Phase 2 of the design: shrines, the Relic, movers, items in crates. Levels are on hold (Hunter isn't sure they're needed).

### Watch out
- [ ] **Nobody has played this.** It passes the rule checks, the browser walkthrough and the online tests, and the computer plays it, but no person has held the controls for a whole match. Whether the retreat feels like a reward or a chore is unknown.
- [ ] **Six abilities are simpler than the design says:** Burrow digs a passage and goes through it (the design has him hide underground until his next turn). Patch's move is a long jump called Spring Pad (the design has a pad anyone can use for 4 turns). Updraft only lifts Gale (not a crewmate). Hopper's SS is still Flurry (not three aimed pounces), Patch's is still Sinkhole (not Fortress), Nimbus's is still Thunderhead (not Downpour).
- [ ] **Two passives were changed to work in a 1v1:** Volt's third hit does half as much again as well as arcing (with one enemy there's nobody to arc to), and Patch heals himself 3 as well as crewmates 6.
- [ ] **Balance is a first pass.** See the numbers in the pull request. The v2 numbers were tuned over many runs; these were nudged twice.
- [ ] **The computer rarely uses its move on a one-screen map.** It was dashing towards the enemy and losing for it, so now it only slams or charges when that lands a hit, and uses moves to cross big maps. It never builds (Bulwark, Bridge) unless every shot would hurt itself.
- [ ] **The retreat ends by itself only if the turn timer is on** (it's cut to 6 seconds). With the timer off you press End turn every turn.
- [ ] **Jump is Shift+arrow, J, or the two small arrows by the step count.** On a phone those buttons are small. Not tried on a touch screen.
- [ ] **No new art for any of this.** Moves use the jump frame; the wall, bridge and fire are plain blocks and flames; there are no icons on the kit buttons.
- [ ] **Online needs the server redeployed,** and an old tab against a new server (or the other way round) will drift and resync. The local server tests and the three online browser tests pass.
- [ ] `design/weapons.md` (the 100-weapon list) and the gear section of `design/v2.md` describe things that are no longer in the game. Left as they are, as history.
- [ ] `design/handoff.md` still describes v2 in places; the kit table there was not rewritten.

---

## v3 design proposal, and new creature sprites · 2026-11-16 · Hunter (with Claude)
A plan for v3 (rules unchanged, nothing of it built), and the first piece of it that is in the game: new character art. Write-up: [`design/v3.md`](design/v3.md). Sheet: [`art/concepts/v3-lineup.png`](art/concepts/v3-lineup.png).

### What's new
- **Blasts have weight.** The ground a blast digs out is thrown up from the rim, bounces and lies where it lands. There's a fireball, a shock ring and solid smoke that blows away with the wind. The picture holds for a split second on a hit and the view nudges in towards it; a knock-out holds longer.
- **You can see what a hit did.** The number comes off the creature ("-21"), it blinks white, and it squashes and kicks up dust when it lands. Walking kicks up dust too.
- **You can see and hear the wind.** Streaks cross the sky, more and longer as it picks up, with a soft hiss that rises with it. Each kind of map has its own thing in the air: snow, embers, spores, sand.
- **Everything shares the ground's pixel size now:** the water, barrels, crates, duds, shots, sparks, smoke and the aim arc.
- **Sound is fuller.** Blasts have a crack, a thump that grows with the crater and bits pattering down. Footsteps, landings, hits and splashes have sounds, and each comes from the side of the screen it happened on.
- **The ground is smooth.** Hills slope, cave mouths are rounded and craters come out round, with textured layers, grass or snow lying on top, a lit edge and a dark outline. The rules still use the same grid underneath, so nothing about play changed. Girders, trunks and other built things stay straight.
- **Blasts leave scorch marks** with a few glowing embers, and caves show a dim back wall so they read as insides.
- **Every theme has a painted background,** made with an open image model on Hunter's own PC and fitted to the game's pixel size and each theme's colours.
- **Light:** lava lights whatever is above it; mushrooms, crystals and hot blocks glow and pulse; the screen has a soft dark frame.
- **A design for v3:** weapons replaced by kits (a passive, a basic shot, an ability, a move ability and an ultimate for each character), jumping and moving after you shoot, six visible stats, shrines and a Relic to fight over, and level-ups during a match.
- **A creature lineup:** the ten characters as ten different animals, drawn as a concept sheet to check they can be told apart as plain shapes.
- **The ten characters are now ten creatures in the game:** armadillo, boar, ferret, frog, gecko, salamander, mole, beaver, heron and a cloud sheep. Each has its own outline and prop, and wears its team colour on a band or scarf, with a team-coloured disc under its feet.
- **They move:** a walk cycle, an aiming pose, recoil and a muzzle flash when they fire, a hurt frame in the air, and they lie flat when knocked out (no more tombstones). Each also has an idle habit: Zip's scarf flaps, Volt's sparks trade places, Flint's pilot light flickers.
- No rules changed: same hit circles, same shots, same balance.

### Next up
- [ ] @Louiemark: read `design/v3.md` and answer its eight open questions. Nothing gets built on it until you've said yes to the direction.
- [x] @Hunter: approve or change the creatures on the lineup sheet before any are animated. (Hunter approved, Nov 16)
- [ ] Update `art/lead-plan.md` (pull request #108) to the creature direction once the lineup is approved.

### Watch out
- [ ] **The online 1v1 test is flaky.** In about one run in five or six, a test browser page crashes ("Target crashed") or the match stalls in round 2 until the test gives up. It happens on the build before this one too (1 crash in 6 runs there, 1 in 5 here), so these changes didn't cause it, but nobody knows what does. Rerunning passes. Worth finding before more people play online.
- [ ] **Nobody has listened to the new sound.** It was written and run with no errors, but the test browser has no speakers, so volume, balance and whether the wind hiss gets annoying are unchecked. Sound can be turned off in the pause menu.
- [ ] **The hold on a hit and the nudge of the view are guesses** (about a twentieth of a second for a big blast, a tenth for a knock-out). Five darts in a row hold five times. Both are skipped for people whose device asks for reduced motion, and so is the brief pale flash on the biggest blasts.
- [ ] **Bits of ground that land are looks only.** They rest on the ground the rules see, but the rules never see them; they fade after two or three seconds.
- [ ] Things on the pixel layer have slightly soft edges (they're drawn small and blown up), and creatures and writing are still drawn at full sharpness, so the two don't match exactly.
- [ ] Not measured on a phone or a slow laptop: the pixel layer is one more full-screen copy a frame.
- [ ] Fixed along the way: fireballs, lightning and the tornado swirl were only ever on screen for a single frame. They now last as long as they were meant to, so Volt's bolt and Gale's tornado look different from before.
- [ ] **The backgrounds are AI-generated** (Stable Diffusion XL 1.0, run locally; licence allows commercial use). They are the only generated art in the game and are listed in `design/ai-assets.md`. They are a first pass made before a lead art plan was adopted, so by the studio's art rules they count as concepts, not finals.
- [ ] **Two backgrounds miss their theme a little:** Fungal Hollow reads as cliffs under an open sky more than a cavern, and Sky Isles has mountains but no floating islands. Scrap Yard and Shipwreck Cove have a tower and a palm tree near the front that could be mistaken for ground.
- [ ] **Busy backgrounds can make the fight harder to read.** Frostbite Peaks is the one to check: pale mountains behind pale snow. Nobody has played on these yet.
- [ ] **The build is three times the size** (about 1 MB, from 350 KB) because the ten pictures are inside it.
- [ ] **The drawn edge and the real edge differ by up to half a cell (4 pixels).** A shot can look like it just clears a smoothed corner and still hit it, or the other way round.
- [ ] Painting a map takes about 80 ms (200 ms for a Giant map) at the start of a round and about 11 ms per crater, measured on Hunter's PC. Not measured on a phone or a slow laptop.
- [ ] Barrels, duds, crates, the water and the aim line are still drawn the old smooth way, so they don't share the ground's pixel size yet.
- [ ] The map editor and the Map Lab still draw maps as blocks.
- [ ] **Nothing in v3 is built or tested.** Every number in the doc is a first guess.
- [ ] v3 replaces v2's gear slot and changes its crates, and v2 (#107) hasn't been reviewed or played by Louiemark yet.
- [ ] The doc says bots will judge walls, bridges and jump pads badly, so the balance sim will be a weaker guide than it was for v2.
- [ ] **The creatures are drawn bigger than what can be hit.** A unit's hit circle is unchanged (24 pixels across); the creature over it is about 40. Shots that look like they clip an ear or a tail miss. v3's movement work should settle size and hit shape together.
- [ ] **Team colour is now small** (a band plus the disc underfoot and the name tag). Nobody has checked a 5v5 on a Giant map zoomed out to see if sides are still obvious.
- [ ] Jump and cast frames are drawn but nothing in the game uses them yet.
- [ ] Tusk and Digger are the two closest outlines (both long and low); Nimbus's rain cloud clips the top of her frame when she jumps.
- [ ] The select screen's small cards crop the tallest creatures (Volt's antennae, Gale's head).
- [ ] `art/tools/units.py` and `art/sprites/units.png` (the v2 sprites) are no longer used by the build. Left in place; delete them only if someone says so.
- [ ] The title screen still says "placeholder art". These are a first pass by Claude, not the Artist's; the lead plan (#108) should be updated to this direction.

---

## v2: crews, big maps, a fresh map every match · 2026-11-11 · Hunter (with Claude)
Bigger fights on maps made for them. A proposal for Louiemark: it sits on top of the map generator pull request and should land after it. Full write-up: [`design/v2.md`](design/v2.md).

### What's new
- **A fresh map every round, in every mode.** Each mode has a recipe (1v1, 1 Player, free-for-all, Squads, team battle) and rolls a new map from it: any theme, with its own caves, hazards, wind and water. "Fresh map every round" is the new default in the map list. Shuffle, the presets, Custom Map and share codes still work.
- **Squads** (new mode on the title screen): crews of **2 to 5 units a side**, against Player 2 on the same keyboard or an Easy, Medium or Hard computer. Pick each crew one unit at a time, or tap "Fill the rest for me".
- **Every unit has its own kit:** its own character, Shot 2 and dud ammo, and its own SS charge.
- **Maps grow with the fight.** 1v1 still fits one screen. Five or six units get a Large map, seven or eight a Huge one, and a 5v5 a new **Giant** map (320 × 180, two screens wide).
- **A camera** for the bigger maps: it follows whose turn it is, then the shot. Right-drag (or two fingers) to look around, wheel or pinch to zoom, **M** for the whole map, **C** to come back. A minimap shows everyone, and arrows on the edge point to units you can't see.
- **Smarter starts.** Spawns are planned for each map: crews start together or dealt in among each other, and some units start under cover on a ledge or in a cave.
- **Online team battle** (ONLINE → MAKE A TEAM BATTLE): up to 5 v 5 with **one player per unit**. Computers play the empty slots, so one person can start a 5v5, and a computer covers for anyone who drops out until they're back.
- Online free-for-alls with 5 or 6 players get a Large map and the camera.
- Computers walk towards the fight on big maps instead of standing out of range, and never into the water.
- **Supply crates.** Once everyone has had a turn, crates start landing between the two sides, nearer whoever is behind. The mark shows what's inside: **new gear**, **SS charge** or **health**. Walk onto one to open it, or blast it so nobody gets it.
- **Combos** in crew modes: hit an enemy a crewmate just hit and your SS gains a notch. Focus a target together.
- **Five new characters, ten in all,** in five classes of two: **Tusk** (Tank: every shot shoves), **Hopper** (Scout: climbs anything, shots that skip), **Flint** (Gunner: fans of flares), **Patch** (Engineer: wide digs and a sinkhole) and **Nimbus** (Controller: her Vacuum pulls people towards the blast).
- **Gear:** every unit carries one extra weapon in a 4th slot (key 4), picked after its character. Four anyone can carry, two more for each class; 14 so far, all from the 100-weapon list (Popcorn Bomb, Crater Maker, Dirt Cannon, Gravity Well, Delay Ray...). Press Enter to take the usual one.
- **Pixel art for every character,** drawn in code the way Rogue Shooter's is: the round placeholder units are now sprites, in every team colour.
- The character screen shows all ten as small cards with one detail panel; the feedback form scrolls.
- **Fixed:** a drawn round used to be replayed on exactly the same map (and two bots would draw it again, forever). A replayed round now gets a new map, online and offline.

### Next up
- [ ] @Louiemark: read `design/v2.md` and answer its seven questions (5v5 length, shared SS, reinforcements, more crews, closing bot slots, host-picked maps online, recipes).
- [ ] @Louiemark: play Squads 3v3 and a team battle on the preview, then decide whether v2 merges.
- [ ] @Louiemark: **redeploy the room server** when this merges (the protocol gained team rooms; old pages against a new server are fine, new pages against the old server can't make a team battle).
- [ ] Art rework: the Lead Artist plan for Wormsbound is its own pull request. The Artist can't start concepts until it's merged.
- [ ] Let the online host pick a map or a share code.
- [ ] A gear picker in the online lobbies (online uses each character's usual gear for now).
- [ ] More of the weapons list as gear; then crates and in-match levelling on top of it.
- [ ] After v2: characters with builds (the "champion" layer).

### Watch out
- [ ] **Nobody has played any of this.** Bots, in-process players and headless browsers only. The camera, right-drag, pinch and the minimap have never been used by a hand.
- [ ] **The new five and all the gear are first guesses.** Bot sim only: characters win 44 to 56% each, and carrying a gear item wins 43 to 57% against not carrying it. Nobody has played them.
- [ ] **Bots can't judge everything:** they never fire the Dirt Cannon, and they value the Delay Ray and the pull by rule of thumb. Those three need people.
- [ ] **Vacuum and Gravity Well pull units off ledges and into the liquid.** That's the point, but it may feel unfair in play; not tested with people.
- [ ] The sprites are a first pass: three frames a character, no walk or aim frames, and the old code-drawn launcher is still on top. Terrain and backgrounds are unchanged.
- [ ] The crew-size sim numbers above were measured before the new characters; the final run's are in the pull request.
- [ ] **A 5v5 is still long:** a median of about 50 turns in the bot sim (63 before combos; 78 in the first pass). 2v2 and 3v3 run 23 to 30 turns and are the better first test with people.
- [ ] **Crates are tuned for bots that barely want them.** A crate-taking bot wins 53% of 1v1s against one that ignores them, and it's about even in crews. People will fight over them more; the numbers (how often, how close to the side that's behind, how sturdy) are first guesses.
- [ ] **Crates lean towards the side that's behind.** That's on purpose, as a comeback, but it might feel like punishing the leader. Ask players.
- [ ] A gear crate replaces the gear you chose, even if you'd rather keep yours. There's no "leave it" except not walking onto it.
- [ ] **Touch:** two-finger pan and pinch are written but untested on a real phone. On a phone the whole stage is small, so a Giant map is hard to read.
- [ ] **Per-unit SS changes crews:** a unit charges only on its own turns, so the first SS in a 5v5 arrives around turn 30.
- [ ] **Old 1v1 numbers moved a little:** 1v1 rounds now roll from the `duel` recipe instead of a theme's defaults. The balance bands still pass, but seeds and replays from before don't match.
- [ ] **Bigger maps cost more:** the terrain is redrawn after every blast (57,600 cells on a Giant map) and the checksum covers every cell. Fine on a laptop in tests; not measured on a slow phone.
- [ ] **Team battle pacing on Cloudflare:** the server's clock ticks every 3 seconds there, so a computer's turn can start up to 3 seconds late. A full 5v5 with nine computers will feel slow.
- [ ] Bots on big maps only walk when they have no shot at all. They don't take cover, climb to high ground or dig.
- [ ] Units that start under cover can be hard to hit, and Digger is the only one who digs. Not checked per character.
- [ ] The Custom Map screen still previews at one-screen size, whatever the match will use.
- [ ] `server/smoke.js` prints each client's state when it times out (added while chasing the draw bug). `SMOKE_MS` shortens its timeout.

## Map generator replaces the three maps · 2026-11-11 · Hunter (with Claude)
Louiemark chose to replace his three maps with the map generator, and map making now lives inside the game.

### What's new
- **Every map is generated now,** online too. With no map picked (online rounds, or Shuffle), each round deals one of the 10 theme maps from the round's seed, so the server and every player build the same one.
- **Louiemark's three maps are still here** as presets in a new **Classic maps** group: Sunset Valley, Frost Peak and Lagoon Isles. Lagoon Isles' channels are now a landform of their own (**Lagoon**) that any custom map can use.
- **Custom Map screen** on the title screen: start from any preset, pick a theme, move any setting and watch the preview change. Then roll a new layout, keep the same layout every match, copy the share code, paste someone else's, save up to 8 favourites, and **Use this map**.
- The title screen is wider so the three mode buttons sit in one row and everything fits on screen.
- Sky Isles' id is now `sky` (the old `isles` is Lagoon Isles again).

### Next up
- [ ] @Louiemark: play the preview, then merge. The checklist is in the pull request.
- [ ] @Louiemark: redeploy the room server (`wormsbound/server`) **before or right after merging**, then check with `node smoke.js <live address>` and `--ffa 6`.
- [ ] Let the online host pick a map or paste a code in the lobby. Today online rounds always deal a theme map from the seed (the server sends no map yet).
- [ ] Answer the open questions at the end of `design/mapgen.md` (one is new: where the Custom Map screen lives once there are real menus).

### Watch out
- [ ] **The live room server still runs the old engine.** Until it's redeployed, online rounds disagree on the map (old server: Louiemark's three maps; new pages: generator themes), so checksums fail and pages keep re-syncing to the server's copy. Local play is fine.
- [ ] Old replays and sim numbers don't compare: the same seed now gives a different map.
- [ ] Nobody has played the Custom Map screen with a mouse yet. It's checked in the browser test at 1280 × 720, and it opens with no sideways scroll at 390, 320 and 844 × 390. On a phone the whole stage scales down, so the sliders get small.
- [ ] Lagoon Isles (Shipwreck Cove colours on the Lagoon landform) only looks like the old map; it isn't the same layout, and the balance sim hasn't been run on it per character.
- [ ] **Easy computers aim a little worse** (aim noise 7.0 → 7.5, power noise 0.09 → 0.10). On generated maps a new player (sloppy bot) beat 3 Easy computers only 24% of the time in the sim (band 28%+); now 37%, and a good player 65% (was 55%). Medium and Hard are unchanged. @Louiemark: your call if you'd rather tune it another way.
- [ ] `build-and-test.py` now finds `npm` through `shutil.which` (on Windows a bare `npm` wouldn't start, so the online tests never ran there).

## Map generator · 2026-11-02 · Hunter (with Claude)
Every map is now generated: 10 themes, custom settings, presets and share codes, plus a Map Lab to build and share maps. A proposal for Louiemark (Wormsbound lead) to confirm. Design: [`design/mapgen.md`](design/mapgen.md).

### What's new
- **10 themes:** Crater Hills, Sky Isles, Scrap Yard and Rooftops (rebuilt on the generator, so their layouts differ from yesterday's), plus **Frostbite Peaks** (one big snowy mountain), **Dune Mesas** (flat-topped plateaus), **Fungal Hollow** (glowing caverns, giant mushrooms), **Shipwreck Cove** (a sandy bowl with a wrecked ship), **Magma Works** (girder bridges over lava) and **Haunted Hollow** (graves on two cliffs over a gorge). Each has its own sky, ground, props and liquid (water, sludge, icy water, toxic ooze, sea, lava, murk).
- **Each theme plays differently:** its own wind strength (still air underground, gusts on rooftops and peaks), **explosive barrels** (oil drums, gas canisters, spore pods, powder kegs, fuel drums) that blow up and chain when a blast reaches them, or **old live duds** on the map that anyone can lob and that tick from turn 1. Some maps have **hard rock** that blasts can't break.
- **Custom maps, like a strategy game's map setup:** pick a preset, then change landform (10 shapes), height, ruggedness, land, caves, overhangs, platforms, props, hazards, liquid level, hard rock, wind and mirror symmetry.
- **9 mode presets:** Classic Duel, Tournament (mirrored, no hazards), Archipelago, Worm Warren, High Rise, High Tide, Fortress, Chaos and First Steps.
- **Share codes** like `frost-peak-1222120211020-k3j9a` rebuild the same map anywhere. Paste one into the title screen's map box.
- **Map Lab** (`builds/wormsbound-maplab.html`): every setting with a live preview, spawn markers, six variations, checks (land, fairness, spawn room), Copy, **Play this map** and Save PNG.
- The title screen's map row is now one list (Shuffle, the theme maps, the modes) plus the code box and a Map Lab button. Shuffle deals from the 10 theme maps.
- Build and test: the sim plays every preset and a line of random custom settings, and fails if any match gets stuck or times out. Rule checks: every preset on 15 seeds, 200 random settings (codes round-trip, mirror maps are mirrored), all sizes, hard rock survives blasts, barrels chain, old duds tick, wind follows the theme.

### Next up
- [ ] @Louiemark: open the Map Lab and play a few theme maps. Keep, rename or cut themes, and answer the open questions at the end of `design/mapgen.md` (which mechanics next, Shuffle's pool, hazards on or off by default).
- [ ] Next map mechanics once picked (each small): tides, slippery ice, bouncy mushroom caps, updrafts, mines.
- [ ] Art: the themes are code-drawn placeholders; a Lead Artist plan (`art/lead-plan.md`) comes first (studio rule).

### Watch out
- [ ] **Matches run longer on several maps** than on the old four. Median turns per preset are in `design/mapgen.md`; the longest are Fortress (median 27 turns, 64% reach sudden death), Rooftops (25, 68%), Tournament and High Rise (24), Scrap Yard and Dune Mesas (23), against 14 on the default mirror line. Props were the biggest cause (shortened and thinned once); more cuts if people feel it.
- [ ] Yesterday's four maps were rebuilt on the generator, so their layouts and sim numbers changed (Crater Hills also has old duds now). The four tests that leaned on the old Crater Hills layout were made layout-independent (a flat floor under the target, a no-hazard map for the dud count, a 40-seed spread for spawns) without loosening what they check.
- [ ] The "Map Lab" link on the title screen and the Lab's "Play this map" assume both build files sit in the same folder. The studio Lab only lists `wormsbound.html`; whether it serves the Map Lab file next to it is unchecked.
- [ ] Caves show the background sky through them (as before). On Fungal Hollow a dark cave wall behind the ground would look better.
- [ ] The bots don't aim at barrels or lob old duds on purpose (they lob duds only when a dud is about to blow near them), so the sim undervalues hazards. People will use them more.
- [ ] Checked in the headless browser (screenshots of the Lab and four themes in a match, phone width 390 with no sideways scroll) and the bot sim. No person has played the new themes yet.
- [ ] **Archipelago is swingy:** about 10% of its matches end on turn 1 with a knock into the water (Sparse land made it 25%, so it now uses Light).
- [ ] Zip sits right on the 40% floor of the character round-robin (was 44% before the generator); the band still passes.
- [ ] Barrel damage (44, radius 4.5), old-dud fuses (4–6) and the wind multipliers are first guesses.

## Maps and weapons proposal · 2026-11-01 · Hunter (with Claude)
Three new maps you can play now, and a design proposal for crate weapons.

### What's new
- **Three new maps**, from the brief's setting: **Sky Isles** (floating islands over open water, with low rocks that sometimes catch you), **Scrap Yard** (scrap towers and hollow car shells to bank shots off) and **Rooftops** (flat roofs at different heights, with alleys between them that flood first). The first map is now called **Crater Hills**.
- **Pick a map on the title screen**, or leave it on **Shuffle** (the default): every map once before any repeats, so a best-of-3 shows three different maps. The map's name shows under the wind.
- Each map has its own sky and ground: a blue daytime sky with far-off floating rocks, a smoggy orange junkyard, and a night skyline with lit windows.
- **A proposal for 100 crate weapons** in six groups (Normal guns, Melee, Explosive, Weird, Legendary, Goofy), with **in-match leveling** (Lv1 → Lv3, reset every match) and a small deck of weapons drawn each match, in [`design/weapons.md`](design/weapons.md). Nothing from it is built yet.
- Build and test: the sim plays 100 matches on every map, and `build-and-test.py` fails if any of them gets stuck or times out. The rule checks now also check every map spawns everyone on dry ground and replays exactly.

### Next up
- [ ] @Louiemark: play each new map once. Does each feel different, and does any feel unfair?
- [ ] @Louiemark: review `design/weapons.md`: crates in Prototype 2 or after the playtest, leveling option A (in-match) vs B (cosmetic mastery), the match-deck size, and which weapons to cut from the pool.
- [ ] Phase 1 of the weapons once agreed: crates, the 4th slot, the match deck, leveling, and the weapons that reuse existing shot fields.
- [ ] Art for the weapons and maps: a Lead Artist plan (`art/lead-plan.md`) comes first (studio rule). The maps' looks are code-drawn placeholders.

### Watch out
- [ ] **Rooftops runs long:** median 23 turns and half its matches reach sudden death (Crater Hills: 15 turns, 22%). The roofs block a lot of shots. Lower or fewer buildings would speed it up.
- [ ] **Sky Isles is the knockback map:** median 13 turns, and about 3% of bot matches end by turn 1, from a knock into the water (Crater Hills: 1%). Gale wins the most there. The low rocks were added to stop one-shot drownings; watch whether it still feels too swingy.
- [ ] The character band (40–60%) is still only measured on Crater Hills. Per-map win counts are printed but not judged; Gale wins the most on all four maps (25–27 of 100), and is at 55% in the Crater Hills round-robin.
- [ ] Bots never walk, so on Sky Isles and Rooftops (where walking off an edge is deadly) people will play very differently from the sim.
- [ ] The maps were checked in the bot sim and the headless browser test only. No person has seen them on screen (I couldn't open the build in a browser preview this session), so the colours and the title-screen map row haven't been looked at.
- [ ] Persistent stat leveling (option C in the weapons doc) would break the brief's "never pay-to-win / cosmetics only". Not proposed; listed so it's a conscious call.
- [ ] Crates add randomness the balance sim doesn't model yet; the character band has to be re-checked with crates on.
- [ ] Weapon names and ideas are first-pass, checked against the famous Worms weapons from memory only, not against GunBound, Pocket Tanks or ShellShock Live lists.

## P1 online · 2026-11-02 · Louiemark (with Claude)
Online 1v1 and an online free-for-all for up to 6 players. The room server is live on Cloudflare (`wss://wormsbound-rooms.louiemark-ambata.workers.dev`) and the game uses it.

### What's new
- **ONLINE 1v1** on the title screen. Make a room and read out the 4-letter code, or join with one. Each of you picks a character and presses Ready; then it's a normal best-of-three 1v1, with turn delay, SS and live duds.
- **The server referees.** Every move goes to the room server, which plays it on its own copy of the game and sends it to both of you. You can't cheat with a modified page, and both screens always show the same game (each one checks a checksum after every move and quietly re-syncs if needed).
- You **see the other player's aim live** while they drag. On their turn your controls are replaced by "Ana (Brick) is aiming…".
- **Dropped connection?** The game reconnects by itself and puts you back in your seat. A player who vanishes has their turn passed after 50 seconds.
- Rematch from the end screen when both of you ask (R works too).
- **It's live:** ONLINE 1v1 on the Lab now connects to the room server on Cloudflare, no setup needed.
- **Online free-for-all, 2 to 6 players.** Title screen → ONLINE → MAKE A FREE-FOR-ALL, and everyone else joins with the code. Pick, press Ready, and whoever made the room presses START. One round a game, last one standing wins; then BACK TO THE ROOM and ready up for the next. Friends can join between games.
- Two new side colours for players 5 and 6: **Rose** and **Sky**. With 5 or 6 players the health bars at the top get slimmer so all six fit.
- If someone drops out mid-game, their turns pass after 8 seconds instead of 50, so the others aren't stuck waiting. They can come back and carry on.
- **Three maps, picked at random every round:** **Sunset Valley** (the hills you know), **Frost Peak** (a snowy night, a mountain in the middle with a tunnel through it) and **Lagoon Isles** (sunny islands with water channels between them: knock people in). The map's name shows at the top. Works in every mode, online too.

### Next up
- [x] @Louiemark: deploy it. (Louiemark, Nov 2: deployed to `https://wormsbound-rooms.louiemark-ambata.workers.dev`, `ONLINE_SERVER` set.) Open a **new session** (so it sees `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`) and say "deploy the Wormsbound room server". Steps in `wormsbound/server/README.md`: `npx wrangler@3 deploy`, then put the address in `ONLINE_SERVER` and merge.
- [ ] @Louiemark: play an online match with a friend on two computers and fill in the feedback form.
- [ ] Decide whether rooms should be crew-only (behind the Lab's sign-in) or open to anyone with a code.
- [ ] @Louiemark: play a free-for-all with 3 or more friends on their own computers and fill in the feedback form. Is one round a game right, or should it be best of 3?
- [ ] @Louiemark: balance the characters across the three maps (planned for Nov 3). Gale is the strongest: 57% overall, and in a per-map check about 58% on Frost Peak, 55% on Lagoon Isles and 58% on Sunset Valley.
- [ ] Map ideas not built: let players (or the room host) choose the map, or not repeat the last one. Today it's a straight 1-in-3 roll from the round's seed, so the same map can come up twice in a row.
- [ ] Free-for-all ideas not built: fill empty seats with computer players, show placings (who went out when), and a spectator view for people who join mid-game.

### Watch out
- [x] **Not deployed:** (Louiemark, Nov 2: deployed and set.) Until `ONLINE_SERVER` is set, ONLINE 1v1 on the Lab says the server isn't set up (on your own machine it uses the local test server). `?server=wss://…` on the build's address overrides it for testing.
- [x] **Not tested on Cloudflare itself:** (Louiemark, Nov 2: `curl …/new` returns a code, and `node smoke.js <live address>` played a whole best-of-3 on the live Durable Object, 42 moves, every checksum matching on both clients. Still not two browsers on two computers.) the Worker bundles and loads (checked with esbuild, the bundler Wrangler uses), and the room logic is the same file the local server runs, but no real Durable Object has run it yet.
- [ ] Rooms are in memory: if both players leave and Cloudflare evicts the room, it's gone. Anyone with the code can join; there's no sign-in.
- [ ] Tested with two headless browser pages on one machine, not two real computers over the internet; no lag or flaky-connection testing beyond one forced drop and reconnect.
- [ ] The server lives on Louiemark's own Cloudflare account (documented in `ARCHITECTURE.md`).
- [ ] **Local testing changed:** with `ONLINE_SERVER` set, a build opened from a file or localhost now connects to the **live** server too. To use the local test server add `?server=ws://localhost:8431` (`test-online.py` already does).
- [ ] Live checks leave real rooms on the server: each `node smoke.js <live address>` run, plus the `curl …/new` checks, made a few rooms on the free plan. They're tiny and get evicted, but don't loop the live smoke test.
- [x] The `CLOUDFLARE_ACCOUNT_ID` in the cloud environment was one character short (31 of 32) at deploy time; the deploy used the full ID read from the API for the token's only account. Louiemark updated it afterwards, but this session couldn't see the new value. Check the next deploy works without the workaround. (Louiemark, Nov 2: fixed in the environment; now the full 32 characters and matches the token's account exactly, checked against the Cloudflare API. Not redeployed to test.)
- [ ] Deployed with wrangler 3 (it warns it's out of date; wrangler 4 is current). Fine for now; the README still says `wrangler@3`.
- [ ] Not checked: two real people on two computers or phones over the internet, through the live server.
- [ ] **Maps need the live server redeployed before this merges.** The server runs the engine too: an old server builds every round on Sunset Valley while new pages build the seed's map, so checksums disagree and pages keep re-syncing to the server's copy. Deploy `wormsbound/server` first, then merge; check with `node smoke.js <live address>` and `--ffa 6`.
- [ ] **Map tuning numbers are first passes** (`engine.js`: `PEAK_H` 13, `ISLE_H` 25, `CHANNEL_W` 0.016, `HILLS` 10). Flat, open ground made Gale win 65–71% on the new maps; adding hills for cover (`HILLS`) brought her to 57% overall. A taller peak sent 58% of 1v1s to sudden death; lowering it fixed that.
- [ ] Per-map 1v1 numbers from a 200-match bot check (before `HILLS` went to 10): Lagoon Isles matches are shorter (median 10 turns vs 15) with more splash-outs (0.5 a match vs 0.2); Frost Peak goes to sudden death more (24–30% vs 22%). Bots never walk, so walking into a channel by mistake isn't in the numbers.
- [ ] Old sim and test numbers don't compare directly: seeds that used to give Sunset Valley now give any of the three maps.
- [ ] The three maps were checked with screenshots at 1280×720 (1 Player, 4-way). Not checked on a real phone or by a person; the Frost Peak tunnel is hard to see at a glance.
- [x] **Free-for-all needs the server redeployed.** (Louiemark, Nov 2: redeployed from this branch before merging, with no account-ID workaround needed. Live `smoke.js --ffa 6`: a whole 6-player game, 30 turns, 0 desyncs on all six; the live 1v1 smoke test still passes.) It works once the new `room.js` is on Cloudflare. Until then the live server makes every room a 1v1 (the page copes, but MAKE A FREE-FOR-ALL gives a 1v1 room). Deploy before or with merging; check with `node smoke.js <live address> --ffa 6`.
- [ ] Free-for-all was tested with six headless pages on one machine (`test-online-ffa.py`) and in-process and socket tests (`npm test`), not with real people. A 6-way game took 39–43 turns in those runs, about 7 per player. With people taking 15–20 s a turn, that's 10–14 minutes; check that it doesn't drag.
- [ ] Free-for-all health uses the 4-way's × 1.8. A 60-game bot check: median 30 turns in a 6-way (5 per player, same as the 4-way's 5.5); seat wins 7–15 of 60 at × 1.8 (expected 10, noisy). Lower health (× 1.5) made it 26 turns. Not added to `sim.js`'s pass bands.
- [ ] Six sides spawn about 22 cells apart on the same 160-cell map, so the first shots can reach someone without much aiming. Watch whether the early game feels crowded.
- [ ] Sides 5 and 6 (Rose, Sky) only appear online; Rose and Ember (orange) are the closest pair of colours. Check with a colour-blind player.
- [ ] With 5 or 6 sides the HUD hides the character names and round pips, and long player names are cut to fit. Checked at 1280×720 and the lobby at 390 px wide; the in-game HUD with 6 sides wasn't checked on a real phone.
- [ ] Nobody can join a free-for-all once a game has started; they get "join when it ends". There's no spectating yet.
- [ ] Cloud sessions don't have Python Playwright: `build-and-test.py` printed "Playwright missing" until `pip install playwright==1.63.0` (matches the preinstalled Chromium, no browser download). After that: ALL GOOD, including the two-page online test.

## P1 modes · 2026-11-02 · Louiemark (with Claude)
Turn delay, 1 Player vs 3 computers, and 1v1 with one character each. Full `build-and-test.py`: ALL GOOD.

### What's new
- **Two modes on the title screen.** **1 Player:** you against 3 computer opponents in a 4-way free-for-all (Easy, Medium or Hard; they get random characters). **2 Players:** a 1v1 on one keyboard. Both are one character a side now, best of three, and the first turn rotates each round.
- **Turn delay (from GunBound):** no more strict back-and-forth. Every shot has a delay cost (⏱ on the buttons; heavier shots cost more, the SS most), walking adds a little, and the side with the lowest delay plays next. A NEXT strip up top shows the coming turns.
- **Computer turns** play themselves: they think, walk, show their aim, then fire.
- **More health** for one-unit play (×2.6 in a 1v1, ×1.8 in the 4-way) so a match lasts about 5–8 minutes; sudden death now starts after 12 rounds, however many sides there are.

### Next up
- [x] Finish this round: the full `build-and-test.py`, then a pull request. (done Nov 2, 2026, Louiemark with Claude)
- [ ] Online 1v1: a room server (Cloudflare Worker + Durable Object) once @Hunter has set up a scoped deploy token. The prompt for him is in the session notes and handoff.

### Watch out
- [ ] Balance (1v1, one unit a side, full run): characters 46–55% after a Gale nerf (hp 90, Gust knockback ×2.2, Tornado reach 11); going first 52%; median match 14 turns. 1 Player: a good-player bot wins 51% / 42% / 25% against Easy / Medium / Hard computers, a weak one 33% / 16% / 10% (25% is an even share). The bots stand in for people; real players will differ.
- [ ] New band lines in `build-and-test.py`: the difficulty curve (full run only). Medium's good-player number moved between 33% and 42% across two runs, so it's noisy at 100 matches.
- [ ] Easy 4-way matches run long (median 38–52 turns) because Easy computers miss a lot.
- [ ] The old two-units-a-side crews are gone from the game; the engine still supports them (`size: 2`).
- [ ] Nobody has played the modes; checked only in headless Chromium.

## P1 characters · 2026-11-02 · Louiemark (with Claude)
Five characters to pick from, each with an SS (Special Shot), in the spirit of GunBound's mobiles (our own characters, names and shots).

### What's new
- **Pick a character before every match.** Ember Crew picks first, then Tide Crew (the same one is allowed). Both of your crew are that character. Click a card, or use ← → and Enter, or press 1–5.
- **The five:**
  - **Brick** (tank): 115 health, takes 15% less damage, walks only 10 steps. *Slug* barely feels the wind; *Wrecking Ball* bounces once, then a big blast.
  - **Zip** (scout): walks 22 steps and climbs higher ledges. *Dart* is fast and flat; *Double Tap* fires two darts in a row.
  - **Volt** (all-rounder): *Arc Ball*, and *Thunderstrike*, which calls lightning down on everyone near where it lands, even under cover.
  - **Digger** (miner): *Pick Shell* digs wide craters; the *Drill* tunnels through 14 cells of ground before exploding.
  - **Gale** (wind-rider): *Kite Bomb* curves hard in the wind; *Gust Bomb* is a weak blast with huge knockback, for throwing people into the water.
- Everyone still carries **2 Live duds**. Shot buttons are now **Shot 1 · Shot 2 · Live dud** (keys 1 2 3), named after your character's shots.
- Each character has its own look: Brick's steel helmet, Zip's cap and scarf, Volt's lightning rod, Digger's hard hat and lamp, Gale's aviator cap and kite. Your team colour stays on the body, so you can always tell the sides apart.
- Each character's shots look different in the air, and Thunderstrike draws a lightning bolt.
- After a match: **New characters** goes back to the pick screen; **Rematch** keeps your picks. The feedback form asks which character was most fun and whether any felt too strong.
- **SS (Special Shot):** every character has an ultimate. It charges one notch each of your turns (the SS meter by your team name) and is ready on your 4th turn. When it's ready, it **takes over the Shot 1 button** (glowing gold, key 1) until you use it; then it charges again. The team that goes second starts with one notch, so it isn't always behind.
  - **Brick · Meteor Slam:** a huge, heavy shell, the biggest crater in the game.
  - **Zip · Bullet Rain:** five darts fanned out in a quick burst.
  - **Volt · Storm Call:** three lightning bolts, where it lands and 7 cells to each side, through cover.
  - **Digger · Earthquake:** a big blast, then a quake that hits every enemy standing on the ground.
  - **Gale · Tornado:** flings everyone within 12 cells away from it, your own crew too.
- **Balance (with SS):** every character wins 40–60% of a smart-bot round-robin (Brick 57, Zip 40, Volt 48, Digger 57, Gale 48). `build-and-test.py` now checks that band. Full run: ALL GOOD.

### Next up
- [ ] @Louiemark: play each character at least once with a friend. Which one feels best, and does any feel unfair? The feedback form asks both.
- [ ] Decide whether to add GunBound's other big idea, the **turn delay** (stronger shots make your next turn come later, instead of strict turns). The brief mentions it (I4). It would change how turns and the sim work, so it's a call for you.
- [ ] Give each character a voice line or sound for its Shot 2.

### Watch out
- [ ] **Bots never walk,** so Zip's long walk and Brick's short one count for nothing in the sim. With people, Zip will likely be stronger and Brick weaker than the numbers say.
- [ ] **Brick beats Zip 61% and Volt 60%, and Digger beats Zip 65%, head to head,** even though every overall number is inside the band. **Zip is right on the 40% floor**: a small change could push her out.
- [ ] **The SS makes matches shorter** (median 12–14 turns, was 15–17) and sudden death rarer. Fine for the 5–10 minute target, but watch whether rounds feel decided by whoever lands their SS.
- [ ] **Earthquake hits every enemy on the ground anywhere on the map** (20 each), and Thunderstrike and Storm Call go through cover. Strong by design; check it doesn't feel unfair.
- [ ] Tornado can throw your own crew; the bots avoid that, people may not. Its coach tip says so.
- [ ] The sim now alternates who goes first (seats and first turn are separate). Its "first-turn wins" number before today also counted starting on the left side of the map, so old and new numbers don't compare directly. The pass band itself is unchanged.
- [ ] Going first: 51% in a 300-match check, 58% in the sim's 200-match mirror line. Probably mid 50s; a bigger run would settle it.
- [ ] The character band is only checked on the full run; `--quick` (30 matches a pair) just prints the numbers, because it's too rough to call (about ±9 points).
- [ ] Thunderstrike hits through any amount of ground; that's the point, but it could feel unfair against someone well dug in. Watch for it in playtests.
- [ ] Gust Bomb's value depends on the map: on this map's high hills it rarely throws anyone into the water. A map with more water near the crews would make it much stronger.
- [ ] Character select checked in headless Chromium at 1280×720 and at phone sizes (it fits but is tiny on a phone). Not checked by a person, on a real phone, or with a controller.
- [ ] Old open item from P1 engine about duds being a small edge: with characters, duds are worth about 19 points (Volt vs Volt), so that's less of a worry now. Left open for whoever playtests.

## P1 hotseat · 2026-11-02 · Louiemark (with Claude)
The first playable build: two people, one computer.

### What's new
- **Play it:** `builds/wormsbound.html`, or in the Lab once this merges. Ember Crew against Tide Crew, best of three, and the crews take turns going first each round.
- **Aim by dragging:** drag back from your glowing unit and let go. Further back is more power. A short dotted arc shows where the shot starts; the wind is yours to read (top of the screen, and the clouds and dust drift with it).
- **Walk** with ◀ ▶ (hold to keep walking) or A/D. **Keys:** ▲ ▼ angle (Shift for fine), Q/E power, F flip, 1 2 3 weapons, L lob, Space fire, X skip, Esc menu.
- **Live duds glow and count down** over their heads, faster and red on their last turn. When one is in reach, the coach says so and **LOB** lights up.
- **Big moments:** blasts throw dirt and smoke, shake the screen and leave scorch marks; a knockout slows time for a beat and calls it out ("K.O.!", "SPLASH OUT!").
- **30-second turn timer** (Menu: on or off), a coach line with tips (Menu: off), sound effects made in code (Menu: off), and a "How to play" card.
- **After the match:** one-button rematch (or R), and a 4-question feedback form. It saves to the Lab's database, or gives you text to copy.
- **Tester tool:** Menu → Bot turn lets a bot take the current turn. A match that used it is marked TESTER on the end screen and in feedback.

### Next up
- [ ] @Louiemark: play a full match with a friend on one keyboard and fill in the feedback form. Pass bar (brief): you both want a rematch without being asked.
- [ ] A Lead Artist plan (`art/lead-plan.md`) before any painted art.
- [ ] Bots as an opponent ("vs bot" mode) once the hotseat feels right; the engine's bots are ready for it.

### Watch out
- [ ] **Checked only in headless Chromium** (1280×720, and loads at 390, 320 and 844×390), not by a person and not on a real phone, tablet or controller. Fonts didn't load in the test browser, so spacing may shift slightly with Lilita One loaded.
- [ ] **Phones get a tiny view:** the 1280×720 stage scales down to fit, so on a phone everything is small and the buttons are hard to hit. It loads and plays without errors, but the brief says desktop first and no phone layout is designed yet.
- [ ] The camera doesn't follow the shell; the whole map is always on screen. The brief asks for a following camera with zoom later.
- [ ] The aim preview ignores wind on purpose (reading the wind is the skill). If new players find it too hard, a "show wind on the arc" option is easy.
- [ ] The turn timer pauses in the menu, but it runs while the turn banner shows (about 1.5 s of each 30 s turn).
- [ ] Sound effects start after the first click or key (browser rule). No music yet.
- [ ] Feedback goes to the Lab's `/forge/api/feedback` with `game: wormsbound`; not tried against the real site yet (file:// can't reach it, so the test only checks the copy fallback).
- [ ] Not in CI: `.github/workflows/checks.yml` only runs Tower Defense. Run `python3 wormsbound/build-and-test.py` by hand (needs Node 18+, Python 3.10+ and Playwright).

## P1 engine · 2026-11-02 · Louiemark (with Claude)
Engine and bot sim only: nothing to play on screen yet.

### What's new
- **The rules work end to end.** Two teams of two take turns on a map of hills, a valley and caves. Walk a few steps, pick a weapon, set angle and power, and fire against the wind. Explosions carve the ground, knock units back and can drop them into the water.
- **Three weapons:** the Shell (unlimited), the Cluster (pops and throws five bomblets, 2 a match) and the **Live dud** (2 a match): it lands without exploding and ticks down for 3 turns. Anyone standing close enough can pick it up and lob it on. A blast next to a dud sets it off early, so chain reactions happen.
- **Every match ends:** from turn 24 the water rises a little every turn.
- **Bots** play whole matches for balance testing (smart, sloppy, a no-duds bot and a dud-happy bot). Results are in `design/handoff.md`.
- `build-and-test.py` runs 622 rule checks (replays, saves, refused moves, duds) and the balance sim against a proposed pass band. Full run: ALL GOOD.

### Next up
- [ ] @Louiemark: confirm or change the proposed pass band and the first-pass numbers in `design/handoff.md` (fuse 3 turns, lob range 5, 14 steps a turn, rising water from turn 24).
- [x] The local hotseat screen: renderer, drag-to-aim, wind arrow, weapon picker, dud countdown, turn timer, win screen and rematch, best-of-3. Then `build.py`, `builds/wormsbound.html`, a Playwright test, and a `games.json` build entry. (done Nov 2, 2026, Louiemark with Claude: see P1 hotseat)
- [ ] A Lead Artist plan (`art/lead-plan.md`) before any art is generated.

### Watch out
- [ ] **Live duds are only a small edge so far:** using them is worth about 4 points of win rate (smart beats nodud 54%), and a dud gets lobbed only 0.3 times a match. Probably the 3-turn fuse gives the target time to walk away. Not tuned yet; try fuse 2 or a bigger lob range once people have played it.
- [ ] Going first wins 56% of smart-vs-smart matches. Normal for the genre; alternating who starts in a best-of-3 should help.
- [ ] The sim is noisy at small sizes: the first-turn number read 45% at 60 matches and 56% at 200. Trust only the 200-match run.
- [ ] The bots aim with the game's own physics, so they're better shots than any person. The noise they add stands in for human aim; it isn't measured against real players.
- [ ] Bots never walk except to dodge a dud about to go off, so movement isn't balanced at all.
- [ ] The name "Wormsbound" joins two other studios' game names (Worms, GunBound). Pick an original title before anything public.
- [ ] Bomblets and terrain changes aren't in the bots' aim prediction, so bots underrate the Cluster a little.
- [ ] Not added to CI: `.github/workflows/checks.yml` only runs Tower Defense. Run `build-and-test.py` by hand before pushing.

## 0.0 · 2026-11-02 · Louiemark (with Forge)
Project folder created from the approved pitch. Nothing built yet.

### What's new
- The brief is in `pitch/brief.md`.

### Next up
- [ ] Crew deck (about 12 slides) from the brief.
- [ ] Add the game to the table in the repo README.

### Watch out
- [ ] The brief is a draft until the crew deck settles the open calls.
