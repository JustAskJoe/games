# Gate Runner Prototype 2: source

© 2026 justaskjoe. All rights reserved.

A real-time **runner shooter** on the beat. Start here for any lane runner, crowd runner or auto-shooter prototype.

## Files
| File | What it is |
|---|---|
| `engine.js` | Pure engine (`window.GR` in the browser, `module.exports` in node). The street is built from the beat grid, so every gate, enemy and the boss arrives on the music. **`LEVELS` is the level table, `levelDef(n)` scales past it, and `BOSS` holds one script per boss.** Gates and weapons are tables too (`POOLS`, `WEAPONS`). `newGame` sets the tempo and song shape for its level, so run one game at a time. A fixed 60/s `step()`; every input goes through `act(G, intent)`; `hash(G)` checksums a run. Holds the bots too |
| `render.js` | The WebGL street (`window.GRR`). Draws only, never changes the engine. All models and textures are built in code. Quality tiers 2, 1, 0 drop automatically on slow devices; `#q=N` in the URL locks one |
| `vendor/three.min.js` | three.js r159 (MIT, license alongside), unmodified. The last version with a single-script build |
| `ui.js` | WebAudio track and SFX, the audio clock, drag steering, HUD, screens, tester jumps, feedback, and a 2D overlay canvas for labels and popups |
| `head.html` / `body.html` | Phone-first night shell |
| `build.py` | Joins everything into `../../builds/cyberpunk-gate-runner.html` |
| `sim.js` | Headless bots play the whole campaign, retrying and carrying their squad forward. Checks a band per level, that each mechanic matters, that streets 6 to 12 run, and a replay hash |
| `test.py` | Playwright at 390×844 and 320: a bot plays a full fixed-seed run through real pointer drags, then it checks save, unlock, refresh, reset, a broken save and every boss fight; fails on JS errors or sideways scroll. Also takes full-quality stills at phone and PC size. Uses software graphics, so it can't judge frame rate. Screenshots go to `/tmp/gr-shots` |

## How the clock works
The engine's time **is** song time as heard (`songAt()` from `AudioContext.getOutputTimestamp()`, adapted from Neon Surf). Each frame, the UI advances the engine to that time, so a gate placed on bar 4 beat 1 crosses your squad exactly when that kick plays. Pausing suspends the audio context, which freezes the game too.

## Sim (400 campaigns per bot, Nov 1)
A clear means the boss died and the squad lived. Bots retry each street up to 12 times and carry what's left into the next, so each level is judged against squads bots really arrive with.

| Level | Boss | Boss HP | Start squad | Casual first try | Smart first try | Casual peak | Casual band |
|---|---|---|---|---|---|---|---|
| 1 | Hush Enforcer | 8,750 | 3 | 65% | 94% | 46 | 55–75% |
| 2 | Mute Carrier | 37,500 | 32–40 | 49% | 100% | 105 | 40–62% |
| 3 | Mirror Warden | 108,000 | 48–60 | 43% | 85% | 193 | 35–55% |
| 4 | Echo | 205,000 | 64–80 | 41% | 78% | 236 | 30–50% |
| 5 | Director Vale | 171,000 | 80–100 | 34% | 68% | 336 | 25–45% |

Casual clear rate by squad brought in (all four guns, typical weapon level):

| Level | Min | Middle | Max |
|---|---|---|---|
| 2 | 21% | 43% | 55% |
| 3 | 16% | 31% | 48% |
| 4 | 21% | 33% | 43% |
| 5 | 16% | 28% | 37% |

Those tables are Medium. `DIFFS` in `engine.js` scales a street for Easy and Hard, and `sim.js` holds the bands. First-try clears on Levels 1 to 5:

| Difficulty | Smart | Casual | Kid bot (fight attention 35%) |
|---|---|---|---|
| Easy | not banded | 99–100% | 87–100% |
| Hard | 51–93% | 19–57% | not banded |

Level 1 street bots: random clears 5%, idle 6%. With the counter switched off, the smart bot clears 0% of Levels 2 to 5.

Vale's HP is lower than Echo's because you can only hurt Vale while the armor is cracked. Surviving a boss's contact costs runners equal to its remaining HP / `contact`, and doesn't unlock anything.

Before this work, on one street where survival counted as a win: smart 95% win / 70% boss kill, casual 78% / 50%, random 10% / 4%, idle 14% / 6%.

`results()` reports `weapon` and `mod`, so group wins by them after any balance change and check every fork stays viable.

**Levers, if it's too easy or too hard:** each level's boss `hp` (the strongest lever), `start` limits, `gates` growth, `hp`, `bite` and `dens` in `LEVELS`, `SKILL` for how often the casual bot plays the counter, `RANGE` (1.7 seconds), and each gun and upgrade's `mult` in `WEAPONS`. Run `node sim.js` after any change, check win rate per weapon too, and put before and after in the PR.

## Lessons
- **Place content on the beat grid and drive the sim with song time.** Sync comes for free; no per-object timing code.
- **Volleys on 8th notes** make auto-fire feel musical without any rhythm input.
- **Check every option by win rate, not just the total.** One weapon at 0% was hiding inside a healthy average.
- **Keep drawing out of the engine.** The 3D rebuild left `sim.js` results and the replay hash identical to P1.
- **Don't feed an interpolated float into a shader hash.** It speckles; round it first.
- **Multiply gates snowball fast** (×2 five times is ×32). Tune the boss against the smart bot's peak, and the threat against the random bot.
- **Carryover needs a floor as well as a cap.** Below about 30 runners Level 2 fell to a 3% clear rate, which only showed up by grouping results by what bots carried in.
- **Test that each mechanic matters:** run the same squad with the bot's counter switched off. If it still wins, the mechanic is decoration.
