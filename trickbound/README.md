# Trickbound: Books on the Line

A cozy Spades adventure from One Fifty Labs. You ride a dying railway in its last season, play Books (Spades underneath) in every depot's card room, and wake lantern critters (familiars) that bend one rule a hand.

**Status:** prototype. Leg 1 (the Pits) is playable: walkable opening, train map, four towns, packs, deck builder, quests, pickup crews and catching, plus a multiplayer server base.

## Play it
Open [`builds/trickbound.html`](builds/trickbound.html) in a browser (keep the `builds/img/` folder next to it). Phone first; desktop works too. The menu has dev jumps (autoplay, end the night) for testers.

## What's here
| Folder | Contents |
|---|---|
| `design/` | Handoff, v3 world scope, familiars scope, catching scope, prototype plan |
| `prototype/v1/` | Source: `engine.js` (rules, bots, familiars, sim), `ui.js`, `world.js`, `line.js`, `catch.js`, `music.js`, `head.html`, `body.html`, Playwright tests |
| `prototype/v1/server/` | Host-authoritative WebSocket table server (`npm test`, `npm start`) |
| `builds/` | Single-file playable build and its AI mood art |
| `deck/` | Pitch deck source (`deck.json` + `slides/*.html`, 23 slides); `deck/books-on-the-line/` is the 13-slide Books on the Line deck |

Build from source: `cd prototype/v1 && python3 build-and-test.py --build-only` writes `trickbound.html` (copy `builds/img/` beside it for the art).

The design docs still point at the old `prototype-kit/trickbound-v1/` and `trickbound/*.md` paths; those now live in `prototype/v1/` and `design/`.

Art is AI mood reference, not final art. Placeholder cards, voices and table talk.

Deck slides reference images by `/_blob/<id>`; those images are not in the repo.

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved
