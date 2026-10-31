# Gate Runner Prototype 2: source

© 2026 justaskjoe. All rights reserved.

A real-time **runner shooter** on the beat. Start here for any lane runner, crowd runner or auto-shooter prototype.

## Files
| File | What it is |
|---|---|
| `engine.js` | Pure engine (`window.GR` in the browser, `module.exports` in node). The street is built from the beat grid, so every gate, enemy and the boss arrives on the music. A fixed 60/s `step()`; every input goes through `act(G, intent)`; `hash(G)` checksums a run. Holds the bots too |
| `render.js` | The WebGL street (`window.GRR`). Draws only, never changes the engine. All models and textures are built in code. Quality tiers 2, 1, 0 drop automatically on slow devices; `#q=N` in the URL locks one |
| `vendor/three.min.js` | three.js r159 (MIT, license alongside), unmodified. The last version with a single-script build |
| `ui.js` | WebAudio house loop and SFX, the audio clock, drag steering, HUD, screens, tester jumps, feedback, and a 2D overlay canvas for labels and popups |
| `head.html` / `body.html` | Phone-first night shell |
| `build.py` | Joins everything into `../../builds/cyberpunk-gate-runner.html` |
| `sim.js` | Headless bots with pass bands, plus a replay hash check |
| `test.py` | Playwright at 390×844 and 320: a bot plays a full run through real pointer drags; fails on JS errors or sideways scroll. Also takes full-quality stills at phone and PC size. Uses software graphics, so it can't judge frame rate. Screenshots go to `/tmp/gr-shots` |

## How the clock works
The engine's time **is** song time as heard (`songAt()` from `AudioContext.getOutputTimestamp()`, adapted from Neon Surf). Each frame, the UI advances the engine to that time, so a gate placed on bar 4 beat 1 crosses your squad exactly when that kick plays. Pausing suspends the audio context, which freezes the game too.

## Sim (300 runs per bot, Oct 31)
| Bot | Plays like | Win | Boss killed | Peak squad | Pass band |
|---|---|---|---|---|---|
| Smart | best gate every time, aims at targets | 100% | 100% | 512 | ≥ 90% |
| Casual | right gate 70% of the time, chases crates and bikers | 98% | 97% | 368 | ≥ 75% |
| Random | coin flip on gates, never aims | 29% | 22% | 98 | 25–60% |
| Idle | never steers | 32% | 25% | 112 | ≤ 35% |

Most losses happen at the drop, when the Enforcer reaches a squad that didn't charge Overclock. That's on purpose: the drop is where good choices pay off.

**Levers, if it's too easy or too hard:** boss HP (6000) and how many runners it takes on contact (HP / 8), drone and biker HP (12 / 80), the gate list in `GATES`, and the Overclock formula in `step()`. Run `node sim.js` after any change and put before and after in the PR.

## Lessons
- **Place content on the beat grid and drive the sim with song time.** Sync comes for free; no per-object timing code.
- **Volleys on 8th notes** make auto-fire feel musical without any rhythm input.
- **Keep drawing out of the engine.** The 3D rebuild left `sim.js` results and the replay hash identical to P1.
- **Don't feed an interpolated float into a shader hash.** It speckles; round it first.
- **Multiply gates snowball fast** (×2 five times is ×32). Tune the boss against the smart bot's peak, and the threat against the random bot.
