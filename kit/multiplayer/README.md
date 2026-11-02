# Online multiplayer for any game: step by step

© 2026 justaskjoe. All rights reserved.

How we took Wormsbound from "2 players on one keyboard" to **online 1v1 on Cloudflare** (Nov 2, 2026), written so the same steps work for the next game. Three games already have a room server you can copy from:

| Game | Server | Shape | Hosted? |
|---|---|---|---|
| **Wormsbound** | `wormsbound/server/` | Turn-based, everyone sees everything. Server referees each move and sends it with a checksum. Node locally, **Cloudflare Worker + Durable Object** live | **Yes**: `wormsbound-rooms.louiemark-ambata.workers.dev` |
| **Tower Defense** | `tower-defense/server/` | Real-time co-op where nobody acts during a wave. Ordered action log + a checksum after each wave | No (Node only) |
| **Trickbound** | `trickbound/prototype/v1/server/` | Card table with **hidden hands**. Server sends each seat only its own view | No (Node only) |

**Fastest way:** open a Claude session and say *"Add online multiplayer to `<game>` following `kit/multiplayer/README.md`."* Claude will do steps 1–5 and stop before step 6 (deploy) for you.

---

## Step 0. Pick the shape (5 minutes, decides everything)

| Your game is… | Use | Copy from |
|---|---|---|
| Turns, open information (artillery, board games, tactics) | **Referee + checksum** | Wormsbound |
| Turns, **hidden** information (cards in hand, fog of war) | **Per-seat views** (never send the whole state) | Trickbound |
| Real-time, but players only act *between* rounds/waves (TD, auto-battlers) | **Action log + per-round checksum** | Tower Defense |
| Twitchy real-time where both players act at once (shooters, rhythm, runners) | None of these. Needs input prediction or rollback; a project of its own. Cheaper first step: **same-seed race** (both play the same seed, compare scores) | — |
| Idle, sim or shop games | Usually not rooms at all: shared leaderboards or trading, which is a different server | — |

## Step 1. Get the engine ready (most of the work, and it pays off anyway)

The server runs **the same `engine.js` the browser runs**. That only works if the engine is:

1. **Pure.** No DOM, canvas, audio or `window` inside it. It loads in Node (`module.exports`) and in the browser.
2. **Seeded.** All randomness comes from a seeded RNG kept *in the game state* (Wormsbound: `G._s` and `R(G)`). No `Math.random()` and no `Date.now()` in the rules. `newGame(seed, opts)` must give the same game for the same seed.
3. **One door for actions.** Every player move goes through `act(G, intent)`, where an intent is small plain data (`{k:'fire', angle, power}`). Humans, bots, the tutorial and replays all use it. If the UI changes the state anywhere else, move that code into `act()` first.
4. **Has a checksum.** `hash(G)` turns the parts that matter (turn, positions, health, terrain…) into a short string. **Round decimals** before hashing (Wormsbound rounds to 0.01) so tiny maths differences between browsers don't count as a mismatch.
5. **Can finish a move without drawing it.** Wormsbound's `resolve(G)` plays a shot to the end instantly, so the server doesn't need frames.

Check: a test that plays a bot match twice from the same seed and gets the same `hash` at the end. If it doesn't, find what's random or time-based first.

## Step 2. Write `server/room.js`: one match, no networking

Copy `wormsbound/server/room.js` (or the one matching your shape) and change the game-specific parts. Keep **no I/O** in it, so the local server and Cloudflare both wrap the same file and you test the rules once.

What a room does:
- **Seats:** `create` (seat 0) and `join` (seat 1…), each gets a **rejoin token** so a dropped player gets their seat back.
- **Lobby:** `pick` (character/deck) and `ready`; the match starts when everyone is ready. The server picks the **seed**.
- **Moves:** on `act`, clean the intent (**whitelist the fields and clamp the numbers**, see `cleanIntent`), check it's that seat's turn, run `act()` on the server's copy, finish it, then send everyone `{ t:'applied', seq, by, it, hash }`.
- **Clock:** `tick(now)` passes the turn of a player who vanished (Wormsbound: 50 s, longer than the game's own 30 s timer).
- **Rounds, rematch, `sync`** (send the whole state when a client asks or joins mid-game).
- **Cosmetic messages** (like the other player's live aim) go straight through and never touch the state.

Write the message list as a comment at the top of the file. It's the contract between client and server.

## Step 3. Two thin wrappers

Copy from `wormsbound/server/` and rename:
- `node-server.js`: local WebSocket server (`npm start` → `ws://localhost:<port>`). Pick a port no other game uses (Trickbound 8420, Tower Defense 8430, Wormsbound 8431).
- `worker.js` + `wrangler.toml`: the same room on Cloudflare. One **Durable Object per room code** (`idFromName(code)`), `GET /new` gives a free code, `WS /room/ABCD` is the room, an alarm runs `tick()` every few seconds.
  - Keep `new_sqlite_classes` in the migration. That's the kind the **free plan** allows.
  - Change `name =` in `wrangler.toml` to `<game>-rooms`.
- `package.json` with only `ws` as a dependency, and `"test": "node test.js && node smoke.js"`.

## Step 4. Hook up the game page

In the game's `ui.js` (see the `online 1v1` section of `wormsbound/prototype/ui.js`):
1. `const ONLINE_SERVER = '';` near the top, plus `serverURL()`: `?server=` in the address wins, then `ONLINE_SERVER`, then `ws://localhost:<port>` on a file or localhost page.
2. An **ONLINE** button on the title screen → Make room (`fetch /new`, then `create`) or Join (type the 4-letter code).
3. On `applied`: run the same intent through the local engine **and animate it**, then compare `hash(G)` with the server's. If they differ, send `sync` and carry on from the server's copy. Players never see a desync.
4. On a dropped socket: reconnect by yourself and send `rejoin` with the saved token.
5. While it's the other player's turn, swap your controls for "Ana is aiming…" and draw their aim.
6. Until `ONLINE_SERVER` is set, the Lab build should say "server not set up yet" instead of failing.

## Step 5. Tests (so the next person can push safely)

| Test | What it proves | Where |
|---|---|---|
| `server/test.js` | Room rules with two in-process players: a whole match with matching checksums, cheating attempts (wrong turn, junk fields, huge numbers), rejoin, the clock, rematch | Copy and adapt Wormsbound's 25 checks |
| `server/smoke.js` | Two real WebSocket clients play a whole match on the local server. **`node smoke.js https://…workers.dev`** runs the same match on a live server | Wormsbound's takes a URL |
| `prototype/test-online.py` | Two real browser pages (Playwright) make and join a room and play through it, using `?server=ws://localhost:<port>` | Wormsbound |

Add all three to the game's `build-and-test.py` and the CONTRIBUTING.md table. In a cloud Claude session, Python Playwright may be missing: `pip install playwright==<version>` matching the preinstalled Chromium (Wormsbound used 1.63.0), never `playwright install`.

## Step 6. Deploy to Cloudflare (a person does the account parts)

**Before the first deploy, once per person:**
1. **Decide whose account.** Studio HQ, Forge and the Lab are on Hunter's Cloudflare. Game room servers so far go on the game owner's own account (Wormsbound is on Louiemark's), so a game server can't touch the studio's. Write it in `ARCHITECTURE.md`. A shared studio account is an open question in HOW-WE-WORK.
2. **Make an API token** (Cloudflare → My Profile → API Tokens): permission **Account → Workers Scripts → Edit**, limited to that one account.
3. **Put two variables in the cloud environment's settings** (never in the repo or chat): `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The account ID is **32 characters**. Copy it from Workers & Pages (right sidebar). A missing character gives error **7003**. Then **start a new session**; a running one doesn't see the change.
4. **Create the `workers.dev` subdomain:** open **Workers & Pages** in the dashboard once (the "Create an app" page is fine). Without it the deploy stops with error **10063**. Do this one yourself: Claude's session blocked it as a domain change when we tried.

**Each deploy** (Claude can run these once you say "deploy it"):
```bash
cd <game>/server && npm install && npm test
npx wrangler@3 deploy          # prints https://<game>-rooms.<subdomain>.workers.dev
curl https://<game>-rooms.<subdomain>.workers.dev/new      # → {"code":"ABCD"}
node smoke.js https://<game>-rooms.<subdomain>.workers.dev # a whole match on the live server
```
A cloud Claude session may refuse a production deploy until you ask for it directly in chat ("deploy it here"). That's expected.

## Step 7. Point the game at it and ship

1. On a branch: `ONLINE_SERVER = 'wss://<game>-rooms.<subdomain>.workers.dev'` in `ui.js`, rebuild, run `build-and-test.py` (must say ALL GOOD).
2. Update, in the same pull request: the server README (live address, date, how to check it), the game README status, `design/handoff.md`, the **room server row in `ARCHITECTURE.md`**, and patch notes (What's new + Watch out lines for anything not checked).
3. Open the PR, wait for **Build and test** and **Guard**, merge.
4. Play a real match with someone on **another computer**. Headless tests on one machine don't prove the internet part.

## Things that caught us (Wormsbound, Nov 2)

- Once `ONLINE_SERVER` is set, a build opened from a file or localhost uses the **live** server too. Add `?server=ws://localhost:<port>` to test locally (`test-online.py` already does).
- **Rooms live in memory.** If both players leave and Cloudflare evicts the room, it's gone. Fine for friends' matches; a ranked mode would need storage.
- **Anyone with the code can join**; there's no sign-in. Putting rooms behind the Lab's sign-in is an open question.
- Each live smoke run creates real rooms. Don't loop it.
- Wrangler 3 warns it's out of date. It works; moving to `wrangler@4` is a separate change.
- Never print the token. `CLOUDFLARE_ACCOUNT_ID` isn't secret, but it doesn't go in the repo either.
