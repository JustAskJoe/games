# Tilebound

An American-mahjong critter adventure from One Fifty Labs: four seats, a story intro, lessons, a coach, and critter abilities on top of real mahjong rules. Trickbound was spun off from it after playtests said mahjong felt too passive.

**Status:** prototype v2. Playable with bots; feedback form included.

## Play it
Open [`builds/tilebound.html`](builds/tilebound.html) in a browser (keep the `builds/img/` folder next to it).

## What's here
| Folder | Contents |
|---|---|
| `prototype/v2/` | Source: `engine.js` (rules, bots, `simulate`), `ui.js`, `story.js`, `head.html`, `body.html`, `sim.js`, `build-and-test.py` |
| `builds/` | Single-file playable build and its AI mood art |
| `design/` | Rules sheet, tech stack and playtest feedback (HTML) |
| `deck/full/`, `deck/short/` | Pitch deck sources (`deck.json` + `slides/*.html`; 49 and 10 slides) |

Balance sim: `cd prototype/v2 && node sim.js 600`.

This is the reference build for the shared kit's table-game pattern; see [`../kit/README.md`](../kit/README.md).

Art is AI mood reference, not final art. Placeholder tiles.

Deck slides reference images by `/_blob/<id>`; those images are not in the repo.

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved
