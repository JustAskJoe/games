# Cyberpunk Gate Runner (working title: Overclock)

© 2026 justaskjoe. All rights reserved.

A cyberpunk runner shooter for phones. Steer a growing squad through neon streets, pick gates that multiply your shooters, and blast through enemies, all synced to a chill house beat.

**Status:** Prototype 2 with five levels (Nov 1, 2026): each has its own boss, track and look, and your squad and guns carry over. **Next:** Zach and the kids play it with [`design/playtest-5-levels.md`](design/playtest-5-levels.md), then a real phone check. Crew review of the pitch is still pending.

**Read first:** [`pitch/brief.md`](pitch/brief.md) and the current decisions in [`design/handoff.md`](design/handoff.md). What changed lately, and what's waiting: [`patch-notes.md`](patch-notes.md).

## Play it
- In the JustAskJoe Lab: https://jaj-forge.huntefl.workers.dev/lab/cyberpunk-gate-runner/ (once merged).
- Or download `builds/cyberpunk-gate-runner.html` and open it in any browser, phone first. Sound on, silent mode off.
- **Testing a boss?** Menu (≡) → **Jump to boss**. A bot plays up to bar 19 so you land with a fair squad. Tester runs don't save and are tagged in feedback.
- After a run, tap **Give feedback**.

## What's in the game so far
- **Five streets**, 60 to 75 seconds each, each on its own original track. Sections: intro, build, riser, **the drop**, cash out.
- **Progress saves in the browser.** Kill a boss to open the next street, and carry your squad, gun, upgrade and weapon level with you. Level select shows what's open, and it can reset progress.
- Drag anywhere to steer (arrow keys too). The squad fires on every 8th note on its own.
- **Gates** every 2 bars, on a split road that lights up your side: flat numbers, multipliers, fire rate, Overclock charge and risky trades.
- **Weapon path:** one fork on bar 10 to pick a gun (Arc gun, Scatter, Railgun or Rockets), then a fork on bar 16 with two upgrades for it. The start menu lists every gun and gate. Gold crates level it up.
- **Horde walls:** 24 enemies early, nearly 400 at the drop, plus drones and bikers.
- **Overclock:** gates charge it and it fires at the drop, multiplying damage. The city wakes up as it charges.
- **Five bosses, one per street,** each with a trick to learn: the Hush Enforcer (dodge the slam), Mute Carrier (shoot the pods to open the core), Mirror Warden (stay off the mirror side), Echo (find the real one) and Director Vale (catch gold orbs, dodge red).
- Results with credits, one tap retry, feedback form.

**The one question it answers:** does steering a growing squad through gates on the beat feel good enough to replay?
**Pass bar:** everyone plays a second run without being asked.

## Build and test
```
cd cyberpunk-gate-runner/prototype/v2 && python3 build.py && node sim.js && python3 test.py
```
Source is in [`prototype/v2/`](prototype/v2/README.md). The P1 source stays in `prototype/v1/` for reference; don't build it, because it writes the same build file.
