# Hexed

A witchy, tarot-themed match-3 from One Fifty Labs. Each level is a Major Arcana card whose meaning shapes the twist (High Priestess hides tiles, Empress grows vines, Hermit plays in the dark).

**Status:** prototype v1. Ten levels, journey map, spread draws, powers, coach and feedback form.

## Play it
Open [`builds/hexed.html`](builds/hexed.html) in a browser. Swipe to swap.

## What's here
| Folder | Contents |
|---|---|
| `prototype/v1/` | Source: `engine.js` (pure match-3 engine that emits animation frames), `art.js`, `ui.js`, `head.html`, `body.html`, `build.py`, `test.py`, `sim.js`, and a README with balance numbers and lessons |
| `builds/` | Single-file playable build |

Build: `cd prototype/v1 && python3 build.py`. Balance sim: `node sim.js 60 casual`.

Placeholder vector art, not final.

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved
