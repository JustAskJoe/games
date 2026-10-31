# Cyberpunk Gate Runner: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked. Checkbox items stay open until someone ticks them. See open items with `python3 kit/open-notes.py`, or just yours with `--for Zach`.

---

## P1 · Oct 31, 2026 · Zach (with Claude)
First playable build.

### What's new
- **Prototype 1 is playable:** one street of about 60 seconds on an original 122 BPM house loop. Drag to steer, pick gates, shoot drones and bikers, crack the gold crate for the arc gun, and melt the Hush Enforcer when the beat drops.
- **Overclock:** good gates before the drop charge it; at the drop it multiplies damage up to ×3.
- One tap retry, results with credits, feedback form, and tester jumps to the riser or the drop (Menu ≡).
- In the Lab as **Gate Runner** (`games.json`).

### Next up
- [ ] @Zach @Hunter @Joe: play it on a phone in the Lab and give feedback. Pass bar: everyone plays a second run without being asked.
- [ ] @Zach: decide commit, change or shelve after the playtest.
- [ ] Add the reusable parts (beat-grid street, song-time engine clock, house synth) to `kit/` once the direction holds.

### Watch out
- [ ] Tested only in headless Chromium at 390×844 and 320×640, not on a real iPhone or Android. Audio sync on real phones is unverified, and there's no tap calibration yet (Neon Surf has one to borrow).
- [ ] Beat timing is by construction: gates arrive on the beat whatever you do. There's no separate on-beat timing bonus yet, so "hit gates on the beat" in the brief isn't a player skill in P1.
- [ ] Balance is tuned for "easy to start": the casual bot wins 98%. Random gate picks lose about 70% of runs, mostly to the boss. Real players may differ.
- [ ] Squad counts snowball (the smart bot peaks at 512). Fine for the fantasy, but it may make later districts hard to tune.
- [ ] The music is a code-synthesized placeholder, not the original tracks the brief calls for.
- [ ] The feedback form posts to `/forge/api/feedback` with `game: cyberpunk-gate-runner`. Not checked against the live Lab, so confirm one answer lands in Forge.

## 0.1 · Oct 31, 2026 · Zach (with Claude)
Pitch only, no build yet.

### What's new
- New game folder for the cyberpunk runner shooter, with the brief from Forge in `pitch/brief.md`.

### Next up
- [ ] @Hunter: Forge couldn't open this new-project pull request itself (GitHub 403 on POST /pulls: "Resource not accessible by personal access token"). Its GitHub token likely needs Pull requests: write on `JustAskJoe/games`. This folder was added by hand instead.
- [ ] @Hunter @Joe: answer the pitch in Forge so the crew can discuss it.
- [ ] @Zach: add weekly hours to the brief and pick a music owner.
- [x] @Zach: build Prototype 1 (scope in `pitch/brief.md`) and add it to `games.json`. (done Oct 31, Zach with Claude)

### Watch out
- [ ] Every decision in the brief is from a solo pitch and hasn't been discussed by the crew.
- [ ] Story and character names in Forge (Neon City, Hush, Echo, Static, Director Vale) are first drafts.
- [ ] Competitors and the "why now" claims aren't verified yet. Check before any slide.
