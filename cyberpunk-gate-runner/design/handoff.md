# Gate Runner: handoff

© 2026 justaskjoe. All rights reserved.

The current decisions in one page. Keep this up to date when one changes.

**Status (Nov 1, 2026):** five levels built on `zach/five-levels`, each with its own boss, track and look. Bot-tuned and checked in headless Chromium. Nobody has played it yet. **Next:** Zach and the kids play the Lab preview with [`playtest-5-levels.md`](playtest-5-levels.md), then retune from what they find.

## Decisions
- **Beating a boss means killing it.** Only a kill unlocks the next street. Surviving its contact finishes the run ("Boss got away") but unlocks nothing, or the mechanics could be skipped. This replaces the old win rule. (Zach, Nov 1)
- **Difficulty target:** the casual bot clears Level 1 on its first try about 65% of the time, then one step down per level. Level 5 is a step, not a finale. (Zach, Nov 1)
- **What carries over:** squad, gun, upgrade, weapon level and every gun you've owned. Fire rate and Overclock reset each level.
- **Start limits:** each level clamps the carried squad to `start: [min, max]`. The max stops snowballing. The min sits just above the point where a level stops being beatable (about 30 runners on Level 2).
- **Level 1 growth is scaled down:** add gates ×0.4, multipliers ×1.25, peak squad about 50 (was about 140). Enemy HP, bite, density and boss HP dropped to match.
- **Retries and replays:** losing retries from the same start. Replaying a level keeps your best squad; the limits stop that being farmed. Level 1 always starts fresh.
- **Gun fork after Level 1:** keep your gun or switch to another, and a gun you've owned comes back with its upgrade.
- **Bosses:** Hush Enforcer (dodge), Mute Carrier (shoot the pods first), Mirror Warden (stay off the mirror side), Echo (find the real one, it pulses on the kick), Director Vale (catch gold orbs, dodge red, avoid the silence beam). The Enforcer gained its slam here; it had no attack before.
- **Bosses are drawn closer than they are.** A long fight would leave them in the fog, so `R.bossZ` holds them at 3.5 seconds away until the end. Draw only; the engine keeps the true distance.
- **Easy, Medium, Hard.** Medium is the level table as written, and its balance must not move when Easy or Hard is tuned. `DIFFS` in `engine.js` scales everything else. One save holds one difficulty, and unlocks and guns are shared across all three. (Zach, Nov 1)
- **Armored bosses say so.** Shots hitting armor bring up a warning that points at the way in, and the boss bar keeps showing health. Added after a playtest got stuck on Level 2 doing no damage from the middle of the road. (Zach, Nov 1)
- **Easy's Carrier pods sit at ±0.42, not ±0.72,** so a squad in the middle of the road opens the armor without steering.
- **Every street is open for now** (`OPEN_ALL` in `ui.js`), so Zach can try each one. Temporary. Saving and carryover still run. (Zach, Nov 1)
- **Tempos stay inside the brief's 118–124 BPM.** Difficulty doesn't come from speed. Level 1's track is unchanged.
- **Looks change by colors, fog, skyline height and rain only.** The city is built once, so switching levels costs nothing on a phone.
- **`MAX_LEVEL = 5`.** Beating Level 5 says more streets are coming. It is not an ending.

## Adding a level
- **Level 6 and up:** raise `MAX_LEVEL` in `engine.js`. `levelDef(n)` cycles the bosses, looks and songs, shifts the key and scales the numbers. These streets run without errors, but their difficulty is not tuned.
- **A hand-made level:** add an entry to `LEVELS`, add a band to `sim.js`, and run the sim. A new look goes in `PALS` in `render.js`, a new song in `TRACKS` in `ui.js`, and a new boss in `BOSS` in `engine.js`, with a model in `render.js` and a line in the bots' `counter()`.

## Where the numbers stand
See the table in [`prototype/v2/README.md`](../prototype/v2/README.md). Boss HP is the sharpest lever: Level 2 went from 57% to 43% between 36,000 and 39,000.

## Next
- Playtest, then retune against what people actually do. Bots know every counter; a first-time player doesn't.
- Measure frame rate on a real phone.
- Someone listens to all five tracks.
