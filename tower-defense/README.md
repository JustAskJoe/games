# Tower Defense (working title)

A co-op roguelite tower defense from Hunter and Joe at One Fifty Labs. Draft a deck between waves, build a keep between runs.

**Status:** Prototype 1.1 (solo), Oct 19, 2026. The co-op server base is built and tested, but not in the UI yet. **Next:** crew playtest, then Prototype 2 (co-op for 2).

**New here? Read [`design/handoff.md`](design/handoff.md) first.** It has every decision so far, the art direction and what's next, on one page. Setup and how we use branches are in [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

## Play it
- `builds/tower-defense-p1.html`: download and open in any browser, phone first. Also on the Lab page of onefiftylabs.co.
- **Testing late waves?** Menu → **Tester tools** → Jump to wave 7 or 10. The bot plays the earlier waves so you land on a fair board.
- After a run, tap **Give feedback**. Results go in [`design/playtest-notes.md`](design/playtest-notes.md).

## What's in Prototype 1.1
- One road that grows twice (before waves 4 and 7). The keep moves out and new build spots open.
- 4 towers, each with two upgrade branches: Arrow (Pierce / Multishot), Cannon (Big Shot / Siege), Spark (Storm / Overload), Frost (Deep Freeze / Shatter).
- 5 enemies: Grunt, Runner, Flyer (cannons can't hit it), Brute (armored), Warlord (boss on wave 10).
- 14 draft cards (buffs, economy, keep). Three offered after each wave, pick one.
- Keep health 20. Leaks cost 1 (2 for Brutes, 5 for the Warlord).
- Pell, a coach who gives one hint at a time. Off in the menu.
- Feedback form at the end. It saves to the site database on the Lab build, or to the artifact on claude.ai.
- **New in 1.1:**
  - **Tester tools:** jump to any wave, +500 gold, repair keep, invincible keep, add any card. Runs that use them show a **TESTER** tag and are flagged in feedback.
  - **Placeholder music:** synthesized live, nothing licensed. ♪ toggles it (bottom left, or in the menu).
  - **Every action goes through `TD.act()`.** This is the groundwork for co-op and replays.

## Balance (headless sim, `node prototype/sim.js 300`)
- **Smart bot** (reads the wave preview, builds counters): wins 55%, median 10 waves held.
- **Saver bot** (keeps 50 gold back): wins 32%.
- **Random bot** (sloppy builds): wins 26%, median 8 waves.
- Deaths spread across waves 5 to 9. Nobody dies before wave 5 with a sane build.
- **Target:** smart bot 50–70%, sloppy 25–35%. `build-and-test.py` fails if the smart bot leaves 50–70%.
- The tuned numbers live at the top of `engine.js` (`SCALE`, `BOUNTY_MUL`, `BONUS_MUL`, `SPEED`). Lesson from tuning: build-spot count and enemy speed move balance far more than enemy HP.

## Files
```
build-and-test.py   one command: build + balance sim + server tests + phone test (--quick skips the browser)
prototype/
  engine.js   pure rules, no DOM; runs in node too. Seeded RNG, fixed 20 ticks/sec.
              act(G, intent) is the only way to change a game; hash(G) is a checksum; test* are the tester tools
  art.js      vector towers, enemies, the keep, ground tiles (ink + flat color)
  music.js    placeholder score (Web Audio): build and wave moods, stingers
  ui.js       canvas renderer, build/upgrade sheet, draft, intro, menu, tester tools, feedback
  head.html   styles (phone first)   body.html  page skeleton
  build.py    writes ../builds/tower-defense-p1.html
  test.py     Playwright phone walkthrough (390 and 320 wide), screenshots in shots/
  sim.js      balance run
server/       co-op room server (base for Prototype 2); see server/README.md
design/
  handoff.md        decisions, art direction, what's next (start here)
  playtest-notes.md one row per playtest run
pitch/brief.md      the approved brief
```

## Working on it
1. Make your change on a branch (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
2. From the repo root, run `python3 tower-defense/build-and-test.py`. It needs Node 18+, Python 3.10+ and Playwright. The first run installs the server's one dependency.
3. Commit the rebuilt `builds/tower-defense-p1.html` with your source.
4. Touched towers, enemies, waves or cards? Put the sim's before and after win rates in your PR.

### Adding things
- **A tower:** add an entry to `TOWERS` in `engine.js` (cost, range, rate, dmg, hit type, two `up` branches). Then add its drawing in `art.js` (`towerArt` / `towerIconSVG`), and a counter hint for the coach in `ui.js` → `coachLine` if it counters something.
- **An enemy:** add to `ENEMIES`, place it in `WAVES`, then draw it in `art.js` → `enemyArt`.
- **A card:** add to `CARDS` with an `apply(G)` and, if it needs one, a new field in `G.mods`. Then add it to the bot's preference list in `botPick` so the sim uses it.
- **A player action:** add a case to `act()` in `engine.js`. The UI and the co-op server both call it, so co-op gets the action for free.

## Next
- **Playtest P1.1 with the crew.** Pass bar: both want a second run unprompted.
- **Prototype 2: co-op for 2.** Shared health, buy-back, gold gifting. The server side is started in `server/`; the phone needs a lobby and has to send its `act()` calls through the socket.
- **The keep:** the between-run town that unlocks towers. Only if the run is fun.

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved
