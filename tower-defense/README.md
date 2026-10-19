# Tower Defense (working title)

A co-op roguelite tower defense from Hunter and Joe at One Fifty Labs. Draft a deck between waves, build a keep between runs.

**Status:** Prototype 1 built (solo run). Next: playtest, then co-op.

## Play it
- `builds/tower-defense-p1.html`: open in any browser, phone first. Also on the Lab page of onefiftylabs.co.

## Prototype 1: what's in it
- One road that grows twice (before waves 4 and 7). The keep moves out and new build spots open.
- 4 towers, each with two upgrade branches: Arrow (Pierce / Multishot), Cannon (Big Shot / Siege), Spark (Storm / Overload), Frost (Deep Freeze / Shatter).
- 5 enemies: Grunt, Runner, Flyer (cannons can't hit it), Brute (armored), Warlord (boss on wave 10).
- 14 draft cards (buffs, economy, keep). Three offered after each wave, pick one.
- Keep health 20. Leaks cost 1 (2 for Brutes, 5 for the Warlord).
- Pell, a coach who gives one hint at a time. Off in the menu.
- Feedback form at the end (saves to the site database on the Lab build, or to the artifact when played on claude.ai).

## Balance (headless sim, 300 games each, `node prototype/sim.js`)
- Smart bot (reads the wave preview, builds counters): wins 55%, median 10 waves held.
- Saver bot (keeps 50 gold back): wins 32%.
- Random bot (sloppy builds): wins 26%, median 8 waves.
- Deaths spread across waves 5 to 9. Nobody dies before wave 5 with a sane build.
Tuned numbers live at the top of `engine.js` (`SCALE`, `BOUNTY_MUL`, `BONUS_MUL`, `SPEED`).

## Files
```
prototype/
  engine.js   pure rules, no DOM; runs in node too. Seeded RNG, fixed 20 ticks/sec.
  art.js      vector towers, enemies, the keep, ground tiles (ink + flat color)
  ui.js       canvas renderer, build/upgrade sheet, draft, intro, menu, feedback
  head.html   styles (phone first)   body.html  page skeleton
  build.py    writes ../builds/tower-defense-p1.html
  test.py     Playwright phone walkthrough (390 and 320 wide), screenshots in shots/
  sim.js      balance run
pitch/brief.md   the approved brief
```

## Working on it
1. `python3 prototype/build.py` after any change.
2. `python3 prototype/test.py` before pushing (needs Playwright + Chromium).
3. `node prototype/sim.js 300` after touching towers, enemies, waves or cards. Keep the smart bot between 50 and 70%.

## Next
- Playtest Prototype 1 with the crew. Pass bar: both want a second run unprompted.
- Prototype 2: co-op for 2 (shared health, buy-back, gold gifting). The engine's `step()` is already deterministic per tick, so lockstep sync is the plan.
- The keep: between-run town that unlocks towers. Only if the run is fun.
