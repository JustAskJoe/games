# Neon Surf v1: rhythm surf wave test

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

Live: https://claude.ai/artifact/WF4hohegoPboFw4m6Zg9Sh (feedback goes to the artifact db `feedback` collection).

This is the kit's first **real-time rhythm game**. Start here for any beat-timed prototype: rhythm action, music runners, or tap-on-the-beat mechanics.

## Files
| File | What it is | Reuse |
|---|---|---|
| `engine.js` | Pure timing engine (`window.SURF` / node). It holds the section layout, a chart built from the beat grid (gates on snares, pumps on beats, steer-only sprays), and perfect/good/ok windows. A hit at the right time but the wrong height counts as "wide". It also handles flow levels, results with mean and median tap error, and bot `simulate()` | **Yes.** Swap `SECTIONS`, `PATTERN` and the note types |
| `ui.js` | WebAudio placeholder beat synth (kick, snare, hat, bass, squeal lead, pad, crash, click) scheduled on the audio clock with lookahead. Also: canvas neon wave renderer, a two-thumb input split (left half steers, right half taps), a shrinking approach ring, a coach line, tap-along calibration, pause through `ctx.suspend()`, and the results and feedback screens | Mostly yes |
| `head.html` / `body.html` | Phone-first night shell, HUD chips, sheet/card screens, toggles | Swap the palette |
| `build.py` / `test.py` / `sim.js` | Concatenates everything into one HTML file. `test.py` is a Playwright run at 390×844 and 320 where an in-page bot steers and taps through real pointer events. `sim.js` runs headless bots (perfect, pro, casual, newbie, late tapper) | Yes |

## v2: play the viewer's own song file
- **Song files are picked on the device** with `<input type=file accept="audio/*">` and decoded in memory with `decodeAudioData`. Nothing is uploaded. The file plays as an `AudioBufferSourceNode` on the same per-run bus, and `t0 = startTime + firstBeatOffset`, so song time 0 is the track's first downbeat.
- **`SURF.detectBeat(mono, sr)`** builds an onset envelope (RMS plus high-passed RMS, log difference, about 100 fps). It then runs a comb search for tempo and phase from 95 to 107 BPM, refines to 0.005 BPM, and takes the first grid beat above 15% of the peak as the downbeat. It hit 101.2 and 100.8 BPM synthetic tracks exactly, with the first beat within 5 ms, in about 80 ms.
- **Gotcha:** `hop = round(sr/100)` does not give exactly 100 fps (22050 → 221). Convert frames with `fps = sr/hop`, or the tempo comes out about 0.2% high.
- **Sync tools:** a 15-second preview with clicks, "clicks earlier/later" (20 ms), ±1 beat (fixes bar alignment), and BPM ±0.05. These are saved per file name and size in localStorage. Results report **drift** (late third minus early third of tap error) to flag a wrong BPM.
- **YouTube, Spotify and Apple Music don't work** for this: the artifact CSP blocks the player, the embed's time reporting is too coarse, and DRM streams can't be read. The viewer's own file is the prototype path.
- `engine.configure({mode:'test'|'song', bpm, end})` switches between the 1-minute layout and the 81-bar Pure Water section estimate. `test_song.py` drives the song flow with a synthetic WAV.

## The timing pattern worth stealing
- **One clock for everything:** `songAt(perfMs)` uses `AudioContext.getOutputTimestamp()` to convert any `performance.now()` or `event.timeStamp` into "song time as heard". It falls back to `currentTime - outputLatency`.
- **Visuals and input share that clock.** Visuals use heard time. Taps use their own event timestamp minus the per-device calibration offset. This makes judging independent of frame rate.
- **The audio is scheduled ahead** (220 ms lookahead, 25 ms tick) on a per-run gain bus. Disconnecting the bus kills any sounds already queued when the player restarts.
- **Calibration:** 16 clicks at the song BPM, taps from beat 3 on, median error clamped to −200…+250 ms, stored in localStorage.
- **iOS:** set `navigator.audioSession.type = 'playback'` before creating the context, and tell players to turn off silent mode.

## Sim (60 runs per bot)
| Bot | Accuracy | Grade spread |
|---|---|---|
| Perfect | 100% | all S |
| Pro (25 ms sd) | 98% | — |
| Casual (55 ms sd, 4% forgets) | 79% | mostly B |
| Newbie (90 ms sd) | 56% | C/D |
| Newbie on Easy timing | 71% | B/C |
| Late tapper (+70 ms bias) | 65% | — |

The late tapper shows why calibration matters.

## Lessons
- **Canvas text needs a font fallback.** A webfont that hasn't loaded yet renders in serif. Write the font as `px "Space Grotesk", system-ui, sans-serif`.
- **Keep the whitewater translucent** so it never hides the steer rail.
- **Never bundle licensed songs.** Use an original placeholder beat at the real BPM. A later build can let testers load their own file.
