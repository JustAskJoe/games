# Cyberpunk Gate Runner (working title: Overclock)

© 2026 justaskjoe. All rights reserved.

A cyberpunk runner shooter for phones. Steer a growing squad through neon streets, pick gates that multiply your shooters, and blast through enemies, all synced to a chill house beat.

**Status:** Prototype 2 in progress (Oct 31, 2026): the street is now real 3D, same rules as P1. **Next:** split road at gates, then horde walls. Crew review of the pitch is still pending.

**Read first:** [`pitch/brief.md`](pitch/brief.md). What changed lately, and what's waiting: [`patch-notes.md`](patch-notes.md).

## Play it
- In the JustAskJoe Lab: https://jaj-forge.huntefl.workers.dev/lab/cyberpunk-gate-runner/ (once merged).
- Or download `builds/cyberpunk-gate-runner.html` and open it in any browser, phone first. Sound on, silent mode off.
- **Testing the drop?** Menu (≡) → **Jump to drop**. A bot plays up to bar 19 so you land with a fair squad. Tester runs are tagged in feedback.
- After a run, tap **Give feedback**.

## What's in the game so far
- One street, about 60 seconds, on an original 122 BPM house loop (Am7, Fmaj7, Cmaj7, G6). Sections: intro, build, riser, **the drop**, cash out.
- Drag anywhere to steer (arrow keys too). The squad fires on every 8th note on its own.
- **Gates** on the downbeat every 2 bars: add, multiply, fire rate, and red minus gates. Sides shuffle each run.
- **Enemies:** drone clusters, bikers that hunt your squad, a gold crate you shoot open for the arc gun, and the Hush Enforcer boss on bar 26.
- **Overclock:** each good gate before the drop adds 12.5%, each red gate takes 15%. At the drop it fires: damage × (1 + 2 × charge).
- Results with credits, one tap retry, feedback form.

**The one question it answers:** does steering a growing squad through gates on the beat feel good enough to replay?
**Pass bar:** everyone plays a second run without being asked.

## Build and test
```
cd cyberpunk-gate-runner/prototype/v2 && python3 build.py && node sim.js && python3 test.py
```
Source is in [`prototype/v2/`](prototype/v2/README.md). The P1 source stays in `prototype/v1/` for reference; don't build it, because it writes the same build file.
