# Lightkeeper: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. See the repo's CLAUDE.md for how patch notes work.

---

## v1 · Nov 1, 2026 · Zach (with Claude)
First playable: six nights, start to finish, on a phone.

### What's new
- **Sweep the beam:** drag anywhere (or use the arrow keys). Boats in your light turn toward the lighthouse; boats in the dark sail straight along a dotted course line.
- **Foghorn:** the Horn button (or Space) slows every boat for 2.5 s, then recovers over 9 s.
- **Six nights:** First Light, The Teeth (reefs), Crossing (two fleets at once), Set Current (boats drift east), Fog (short beam, boats hidden until lit), Storm (gusts knock dark boats off course). Each opens with a keeper's log line and one tip.
- **Stars:** every boat home, no wrecks, under par. Three wrecks ends the night; retry is one tap and the sea plays the same again.
- **Sound:** sea wash, a low drone, a bell for each boat home that climbs the scale, a knock for a wreck, the foghorn, gusts and a closing chord. All synthesized.
- Arrows at the edge warn where the next boat will appear. Feedback form after every night. Menu → Tester opens every night.

### Next up
- [ ] @Zach: play all six nights on a real phone and send feedback from the Lab.
- [ ] Crew answers the one question: do people retry a failed night without being asked?
- [ ] Decide whether the horn earns its place or the game is better with the beam alone.
- [ ] If it passes: 10 to 15 nights and the first lens (wide, split or pulse).

### Watch out
- [ ] Only tested in headless Chromium (390×844 and 320×640, touch emulation). Not tried on a real iPhone or Android, or in Safari.
- [ ] Audio never heard by a person: the test browser has no speakers. Levels, the foghorn's tone and the iOS silent switch are unchecked.
- [ ] The bots see through fog, so Fog's real difficulty isn't measured. It may be much harder for people than the sim says.
- [ ] Storm is at the edge of the pass band (87% at 30 runs, 90% at 20). One unlucky change to gusts or reefs will tip it out.
- [ ] Night 1 to 3 par times are the same (0:54) because they're set by when the last boat arrives. Stars for time may be too easy early on.
- [ ] Night 2's first boat has only about 2.5 s of good timing (`node sim.js windows`). That's on purpose, to teach running dark, but it may feel strict for a second night.
- [ ] The horn button sits over the right headland at 320 px wide. Nothing important is hidden, but it covers some rock art.
- [ ] Feedback posts to `/forge/api/feedback` with `game: "lightkeeper"`, as the other games do. Not checked against the live Lab.
- [ ] Forge's brief header says approved "2026-11-02" (UTC); it was Nov 1 Central.

---

## 0.0 · 2026-11-02 · Zach (with Forge)
Project folder created from the approved pitch. Nothing built yet.

### What's new
- The brief is in `pitch/brief.md`.

### Next up
- [ ] Crew deck (about 12 slides) from the brief.
- [x] Add the game to the table in the repo README. (Zach with Claude, Nov 1)

### Watch out
- [ ] The brief is a draft until the crew deck settles the open calls.
