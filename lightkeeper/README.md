# Lightkeeper

© 2026 justaskjoe. All rights reserved.

A one-thumb night sea puzzle for phones. You keep a lighthouse. Sweep the beam across the water: every boat in your light turns toward the harbor, and every boat in the dark holds her course. You never touch a boat. You bring the fleet home past the reefs by choosing who to light, and when.

**Status:** Prototype v1 (Nov 1, 2026): six nights, playable start to finish. **Next:** the crew plays it and answers the one question below. Crew review of the pitch is still pending.

**Read first:** [`pitch/brief.md`](pitch/brief.md) and the current decisions in [`design/handoff.md`](design/handoff.md). What changed lately, and what's waiting: [`patch-notes.md`](patch-notes.md).

## Play it
- In the JustAskJoe Lab: https://jaj-forge.huntefl.workers.dev/lab/lightkeeper/ (once merged).
- Or download `builds/lightkeeper.html` and open it in any browser, phone first. Sound on.
- **Testing a later night?** Menu (≡) → **Tester: open every night**. Tester runs don't save stars and are tagged in feedback.
- After a night, tap **Give feedback**.

## What's in the game so far
- **Drag anywhere** to swing the beam (arrow keys on desktop). Lit boats turn toward the lighthouse; dark boats sail straight along a dotted course line.
- **Horn** (button or Space): every boat slows to a crawl for 2.5 s, then it needs 9 s to recover.
- **Six nights**, each adding one idea: First Light (just the beam), The Teeth (reefs: let her run dark first), Crossing (two fleets at once), Set Current (boats drift east), Fog (short beam, boats hidden until lit), Storm (gusts knock dark boats off course).
- Three wrecks ends the night. Boats that sail off the edge are lost. Up to 3 stars: all home, no wrecks, under par.
- Original synthesized audio: sea wash, drone, a bell per boat home, wreck knock, foghorn, gusts, a closing chord.
- Progress (stars) saves in the browser.

**The one question it answers:** is steering boats only by lighting them, never touching them, a puzzle people want to solve again?
**Pass bar:** players retry a failed night without being asked, and finish all six.

## Work on it
```
cd lightkeeper/prototype/v1 && python3 build.py && python3 test.py
```
`test.py --quick` skips the browser. `node sim.js` runs the balance bots; `node sim.js windows` shows each boat's safe timing window, which is the tool for designing a new night. Details in [`prototype/v1/README.md`](prototype/v1/README.md).

## Folder
| Folder | Contents |
|---|---|
| `pitch/` | The brief from Forge |
| `design/` | `handoff.md` (current decisions), `ai-assets.md` (Steam AI disclosure) |
| `prototype/v1/` | Source, build and test scripts, balance sim |
| `builds/` | `lightkeeper.html`, the single-file playable build |
