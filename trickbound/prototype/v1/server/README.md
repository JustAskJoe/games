# Trickbound table server (multiplayer base)

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

A small, host-authoritative server for Books tables. It is the base for multiplayer, built so the phone prototype's own engine does all the thinking and clients only ever see their own cards.

```
cd server && npm install
npm test          # in-process: 4 bots, then 1 scripted human through the intent API (checks illegal plays, hand leaks)
npm start         # WebSocket server on :8420 (PORT=… to change)
node smoke.js     # two real WebSocket clients create/join a room and play to the end
```

## What's here
| File | Job |
|---|---|
| `../engine.js` | Shared with the phone client, unchanged: rules, bots, familiars, scoring, seeded RNG. Pure functions. |
| `room.js` | `GameRoom`: one table. `Seat` (bot or human) behind one `decide(seat, kind)` interface; the hand loop mirrors the client's `playHand`. `viewFor(G, seat)` builds what a seat may see. `intent()` validates every human answer against the engine. |
| `server.js` | WebSocket wrapper: rooms by 4-letter code, create/join/rejoin with a token, host starts, bots fill empty seats, each client gets its own view after every change. |
| `test.js`, `smoke.js` | The two checks above. |

## The ideas that make later work easier
1. **One decision interface.** Bots, local humans and remote humans all answer `decide()`. The hand loop never branches on who's sitting. Adding a spectator, a replay, or an AI partner with a personality is a new kind of Seat, not a new loop.
2. **Per-seat views, computed server-side.** `viewFor` carries your hand, what your Owlet/Raven/Frog showed you, counts for everyone else. Nothing a client can inspect leaks another hand.
3. **Intents, not state.** Clients send "I bid 4", "I play this card, flared". The server checks it against `legalPlays`, the house rule and the familiar's `canUse`, then applies it. A modified client can't cheat.
4. **Seeded games.** Every room has a seed; a flag records seed + hand + trick, so any disputed bot play can be replayed exactly.
5. **House rules are data.** `rules: {target, mirror, nilNight, goingDark}` on room creation; same object the engine already reads.

## Plugging the phone client in
The phone's `ui.js` already runs a hand as `await ask(prompt)` → `answer(v)`. To go remote: replace the local engine calls with (a) render from the `state` message's `view` and (b) turn each prompt into the matching intent. The prompt kinds and intent shapes are the same words on both sides: `blind`, `bid`, `familiar` (+`hopgive`), `play`. Story progress (binder, deck, marks) stays client-side for now; a lobby would pass `familiar` and `deckVersions` on join.

## Not here yet, on purpose
Accounts, matchmaking, persistence of rooms, reconnection windows, rate limits, hosting, TLS, spectators, chat/table talk. All straightforward additions once the loop above is proven with friends.

## Protocol
See the header of `server.js`.
