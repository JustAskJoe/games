# Tower Defense: handoff

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

The one page to read before touching this game. It covers what we decided, what's built, and what's next. The approved brief is in [`../pitch/brief.md`](../pitch/brief.md). This doc is the working version and wins if the two disagree.

**Team:** Hunter and Joe, about 10 hours a week each. Zach is joining as a third (more people possible). Lanes are still open; see "Open: team lanes" below.
**Status (Oct 19, 2026):** Prototype 1.1 playable, solo. The co-op server base is built and tested but not wired to the UI yet.

## The game in one line
A co-op roguelite tower defense. Draft a deck of buffs inside each run, and build up a keep between runs that decides which towers you get.

## Decisions (crew session, Oct 19, 2026)
| Topic | Decision | Notes |
|---|---|---|
| Modes | Solo and co-op at launch | Joe wants **3v1**: one player sends the waves. Scoped as a stretch. No PvP otherwise. |
| Deck | Cards are buffs and passives you build toward | Some cards touch towers, some the keep. Drafted after each wave (3 offered, pick 1). |
| Management | The keep is a town between runs | It decides which towers you can field. Only build it if the run itself is fun. |
| Towers | 20+ themed towers, each with branching upgrades | P1 has 4 with two branches each. Tower merging is still in scope review. |
| During waves | Players watch | No actions mid-wave. This is also what makes co-op sync simple (see `server/README.md`). |
| Run length | About 20 minutes, 10 to 12 waves | |
| Co-op health | Shared health pool | A teammate can buy a downed player back in. Pool at zero ends the run. |
| Platform | Prototype in the phone-first web kit; launch premium on Steam PC with a free demo | |
| Pitch | Internal crew deck first | Then decide on a publisher. |
| Market | Co-op TDs exist (Dungeon Defenders, Bloons TD 6 co-op) | Our gap is co-op roguelite TD with deckbuilding. Roguelite TD is crowded, so co-op has to be the standout. Verify before any external slide. |

## Art and sound direction
- **Reference:** a hand-painted fantasy cottage illustration, ink linework over painterly flat color. It's a middle path between the moody painterly and cozy low-poly mood boards.
- **Palette:** teal slate roofs, warm timber, cream plaster, mossy greens, dusty-rose sky. These are the CSS tokens at the top of `prototype/head.html` (`--teal`, `--timber`, `--plaster`, `--moss`, `--sky`).
- **In P1:** all art is placeholder vector drawing in `prototype/art.js` (ink strokes over flat fills), not final art.
- **Music follows the look:** cozy, folky, warm. P1.1 has a placeholder score in `prototype/music.js`, synthesized live with Web Audio (lute plucks and a recorder tune while you build, a frame-drum pulse during waves). No licensed music, ever.

## What's built
**Prototype 1 (solo):** one road that grows twice (before waves 4 and 7), 4 towers × 2 upgrade branches, 5 enemies, 10 waves, 14 draft cards, keep health, coach (Pell), feedback form, in-page bot sim.

**Added in 1.1 (Oct 19):**
- **Tester tools** (Menu → Tester tools): jump to any wave with a fair board (the smart bot plays the waves before it), +500 gold, repair keep, invincible keep, add any card. A run that used them shows a **TESTER** tag and its feedback says `tester: true`.
- **Placeholder music** with a ♪ on/off button (bottom left). It's also in the menu.
- **One action path:** every input goes through `TD.act(G, intent)`, so a seed plus a list of intents replays a run exactly. `TD.hash(G)` gives a checksum.
- **Co-op server base** in `../server/`: rooms, Ready-up, a rotating draft, a desync check every wave. 13 rule checks plus a real-socket smoke test.
- **`build-and-test.py`:** build, balance sim, server tests and phone test in one command.

## The question P1 answers
Is drafting a card after each wave, on a map that keeps growing, fun enough to replay?
**Pass bar:** both Hunter and Joe choose to play a second run without being asked. Log results in [`playtest-notes.md`](playtest-notes.md).

## Next, in order
1. **Playtest P1.1 with the crew.** Use the tester tools to reach waves 7 to 10 fast. Write results in `playtest-notes.md`.
2. **If it passes, Prototype 2 is co-op for 2:** a lobby, the phone talking to `server/`, per-player gold, gold gifting, buy-back.
3. **More towers** toward the 20+ (themes TBD), and a decision on merging.
4. **3v1 wave player:** a new `sendWave` intent and the reserved `waves` seat.
5. **The keep (town between runs),** only if the run is fun.

## Open: team lanes (not assigned yet)
Proposed Oct 19, 2026, for when we commit to a finished game. Commit only after P1 passes the playtest bar. Each lane has one owner, and new people join a lane rather than start a new one.

| Lane | Owns | First deliverable | Owner |
|---|---|---|---|
| **1. Tech** (engine, co-op, Steam) | Co-op in the game (lobby, per-player gold, gifting, buy-back), saves, settings, performance, Steam build | Prototype 2: co-op for 2 over the internet | _open_ |
| **2. Design** (content and balance) | Towers toward 20+, enemies, waves, cards, the keep; balance sim; running playtests | Tower and enemy list with counters; the keep on paper | _open_ |
| **3. Look, sound and feel** | Final art in the painted ink style, animation, UI, music and sound effects; Steam page, trailer, pitch deck | Art style sheet; one finished tower, enemy and map; real music | _open_ |
| **Producer** (on top of a lane) | Scope, weekly check-in, keeping this doc current | Milestone dates | _open_ |

To decide:
- Who owns which lane (Hunter, Joe, Zach), based on what each is best at.
- **Engine call, Lane 1's first job:** wrap the web game as a desktop app for Steam (fastest; keeps everything built so far), or rebuild in an engine like Godot (more up-front work, stronger for a full premium game). Decide before Prototype 2.
- Any target date, for example a specific Steam Next Fest for the demo.

Milestones: P1 playtest passes → Prototype 2 (co-op for 2) → vertical slice (one finished-looking map, about 8 towers, the keep) → Steam demo → content complete → launch.

Scope note: three people at about 10 hours a week is roughly a year or more for the full brief. The proposal is to ship with 12 to 15 towers and add more after launch, and to move 3v1 to after launch so co-op gets the time.

## Open questions
- Title and hook line (working title is "Tower Defense").
- Tower themes for the 20+ set, and whether towers merge.
- Story and cast (Pell the coach is the only character so far).
- Does the draft stay at 3-pick-1 in co-op, or does each player draft?
