# Wormsbound: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. See the repo's CLAUDE.md for how patch notes work.

---

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
