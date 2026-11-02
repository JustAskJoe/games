# Wormsbound: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. See the repo's CLAUDE.md for how patch notes work.

---

## P1 characters · 2026-11-02 · Louiemark (with Claude)
Five characters to pick from, in the spirit of GunBound's mobiles (our own characters, names and shots).

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
- **Balance:** every character wins 40–60% of a smart-bot round-robin (Brick 58, Zip 44, Volt 44, Digger 51, Gale 51). `build-and-test.py` now checks that band. Full run: ALL GOOD.

### Next up
- [ ] @Louiemark: play each character at least once with a friend. Which one feels best, and does any feel unfair? The feedback form asks both.
- [ ] Decide whether to add GunBound's other big idea, the **turn delay** (stronger shots make your next turn come later, instead of strict turns). The brief mentions it (I4). It would change how turns and the sim work, so it's a call for you.
- [ ] Give each character a voice line or sound for its Shot 2.

### Watch out
- [ ] **Bots never walk,** so Zip's long walk and Brick's short one count for nothing in the sim. With people, Zip will likely be stronger and Brick weaker than the numbers say.
- [ ] **Brick beats Zip 66% and Volt 67% head to head** even though every overall number is inside the band.
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
