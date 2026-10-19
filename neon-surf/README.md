# Neon Surf

A neon-ocean rhythm surfing test from One Fifty Labs: steer with your left thumb, tap gates on the beat with your right.

**Status:** tech test. One-minute wave on an original placeholder beat, tap-along calibration, and a mode that plays a song file from the player's own device (decoded locally, never uploaded). No licensed music is bundled.

## Play it
Open [`builds/neon-surf.html`](builds/neon-surf.html) in a browser. Turn the volume up and silent mode off.

## What's here
| Folder | Contents |
|---|---|
| `prototype/v1/` | Source: `engine.js` (timing engine, chart, beat detection, sim), `ui.js` (WebAudio synth, renderer, input), `head.html`, `body.html`, `build.py`, `test.py`, `test_song.py`, `sim.js`, and a README on the timing approach |
| `builds/` | Single-file playable build |

Build: `cd prototype/v1 && python3 build.py`. Timing sim: `node sim.js`.

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved
