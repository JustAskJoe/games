# Tower Defense co-op server (base for Prototype 2)

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

A small room server for co-op runs. It reuses the phone prototype's `engine.js` unchanged, so the rules live in one place. It's adapted from Trickbound's table server (`trickbound/prototype/v1/server/`), with one big difference: Tower Defense is real-time, so instead of sending each player a view, the server sends an **ordered log of actions**, and every client replays it on its own copy of the engine.

```
cd tower-defense/server && npm install
npm test        # in-process checks + two real WebSocket clients (also run by ../build-and-test.py)
npm start       # WebSocket server on :8430 (PORT=… to change)
```

**Not wired into the phone UI yet.** The prototype is still solo. This is the plumbing Prototype 2 plugs into.

## How it stays in sync
1. **Intents, not state.** A client sends `{ k: 'build', type: 'arrow', c: 3, r: 3 }`. It never sends gold, health or positions, so a modified client can't cheat. The server checks the intent with the same `TD.act()` the phone uses.
2. **One ordered log.** Every accepted intent gets a sequence number and goes to everyone. Same seed + same log = same game, on every device.
3. **Waves run locally.** Nobody acts during a wave (players watch, per the brief), so each phone runs `TD.step()` itself at 20 ticks a second. The server resolves the wave instantly so it knows the result.
4. **Checkpoints catch drift.** After each wave the server sends a hash of the game. If a client's hash differs, it asks for `sync` and rebuilds from the seed + log. `Replica` in `room.js` handles queueing (an action that arrives mid-wave waits until that client's wave ends).

## Co-op rules in this first pass
- Shared gold and shared keep health (that's what the P1 engine has).
- Anyone can build, upgrade or sell between waves. Any build un-readies everyone, so nobody gets surprised.
- The wave starts when every human has tapped **Ready**.
- The draft rotates by seat: seat 1 picks after wave 1, seat 2 after wave 2, and so on.
- Bots can fill seats. They ready up and draft on their turn, but don't spend the shared gold.
- Up to 4 seats. Rejoin after a drop with the token you got on join.

## Files
| File | Job |
|---|---|
| `../prototype/engine.js` | Rules, shared with the phone. `act()` is the one action path; `hash()` is the checksum. |
| `room.js` | `GameRoom` (seats, turn rules, log, checkpoints) and `Replica` (the client-side copy; works in node and the browser). |
| `server.js` | WebSocket wrapper: 4-letter room codes, create/join/rejoin, host-only start and bots. Protocol is in the header. |
| `test.js`, `smoke.js` | Rule checks, a full 3-seat run with two replicas matching at every wave, and a real-socket smoke test. |

## Next (in this order)
1. **Phone client:** a lobby (create / join by code), then route the UI's `TD.act()` calls through the socket and feed `applied` messages to a `Replica`.
2. **Co-op engine:** per-player gold, gold gifting, buy-back for a downed player (shared health pool per the brief). All new intents through `act()`.
3. **3v1:** a `waves` seat that picks the next wave's groups (a new `{ k: 'sendWave', groups }` intent). The seat kind and lobby hook are already reserved.
4. Hosting, accounts and matchmaking only once friends-and-family co-op is fun.
