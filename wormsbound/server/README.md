# Wormsbound online 1v1: room server

© 2026 justaskjoe. All rights reserved.

The server for **Online 1v1** (title screen → ONLINE 1v1). One player makes a room and gets a 4-letter code; the other joins with it. The server is the referee: it runs the same `../prototype/engine.js` the game runs, checks every move, plays each shot through, and tells both players what was played plus the checksum the game should have afterwards. Each browser replays the move on its own copy (to animate it) and checks the checksum; if they ever differ it asks for the server's copy. So nobody can cheat with a modified page, and small differences between browsers can't split the game.

| File | What |
|---|---|
| `room.js` | One match: seats, picks, ready, moves, rounds, rematch, rejoin, the turn clock. No I/O, so both servers below share it. The message protocol is at the top of the file. |
| `node-server.js` | The local server for testing (`npm start` → `ws://localhost:8431`). |
| `worker.js` + `wrangler.toml` | The same room on **Cloudflare**: a Worker plus one Durable Object per room code. |
| `test.js` | Room rules with two in-process players (25 checks: a full best-of-3 with matching checksums, cheating attempts, rejoin, the clock, rematch). |
| `smoke.js` | Two real WebSocket players play a whole match against the local server. |
| `../prototype/test-online.py` | Two real browser pages play a whole match through the local server (run by `../build-and-test.py`). |

## Play it on your own machine
```bash
cd wormsbound/server && npm install && npm start
```
Then open `wormsbound/builds/wormsbound.html` in two browser windows. On a file or localhost page the game uses `ws://localhost:8431` by itself. Choose ONLINE 1v1, make a room in one window and join with the code in the other.

## Deploy to Cloudflare
Needs, in the environment (never in the repo or chat): `CLOUDFLARE_API_TOKEN` (a token with **Account → Workers Scripts → Edit**, for one account only) and `CLOUDFLARE_ACCOUNT_ID`.
```bash
cd wormsbound/server && npx wrangler@3 deploy
```
Wrangler prints the address, like `https://wormsbound-rooms.<subdomain>.workers.dev`. Then:
1. Put it in `ONLINE_SERVER` at the top of `../prototype/ui.js` as `wss://wormsbound-rooms.<subdomain>.workers.dev`, rebuild, and open a pull request. Until then anyone can still try it with `?server=wss://…` on the build's address.
2. Check: `curl https://wormsbound-rooms.<subdomain>.workers.dev/new` returns a code.

**Hosting today:** Louiemark's own Cloudflare account (free plan), kept apart from the studio's Studio HQ / Forge / Lab on Hunter's account. See `ARCHITECTURE.md`.

## Limits (prototype)
- Anyone with a room code can join; codes are 4 letters (331,776 of them) and rooms are only listed to the two players. There's no sign-in.
- Rooms live in memory. If both players leave and Cloudflare evicts the room, it's gone. A dropped player can rejoin while the other is still connected.
- The server passes a turn after 50 seconds with no move (the game's own timer is 30), and starts the next round 30 seconds after one ends if someone didn't tap Next.
- 1v1 only. The 4-way free-for-all is 1 Player (vs computers) for now.
