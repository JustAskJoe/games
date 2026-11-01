# Trickbound: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked. Checkbox items stay open until someone ticks them (`- [x] … (done Oct 31, Hunter)`). See open items for everyone with `python3 kit/open-notes.py`, or just yours with `--for Hunter`.

Say **"add to patch notes"** to Claude any time to add to the top entry. Claude also adds one before every push.

---

## Leg 1 · Oct 31, 2026 · Hunter (with Claude)
Art direction B (isometric diorama, #21) is in the prototype.

### What's new
- **Cinder Hollow is an isometric diorama.** The town you walk is now a three-quarter isometric scene in the B sheet's look: the depot is a real building with a snowy roof, lit windows, a red door and a smoking chimney; the train sits along the platform; lamplight pools on the snow; the slag heap smokes. Same map, same people, same script.
- **The night-train car** is drawn the same way, cut away so you can see in.
- **The station interior.** Cinder Hollow's depot screen header is now the waiting-hall card room as a diorama: stove, frosted windows, the quest board, the pack wall and counter, and the card table under its lamp.
- **Arrival and Lamp-lit.** Before you win Cinder Hollow's back room, only one of the town's two lamps works (the other sputters) and only the table lamp is on inside. After the win, every lamp is lit and the windows glow warmer.
- Tapping works on the diorama: people, the door, windows, lamps, the sign and the train's side are all tappable; anything else taps the floor. You show as a faint ghost if the train hides you.

### Next up
- [ ] @Hunter: play the town on a real phone in the Lab and say whether the zoom (about 22 tiles across) feels right. The camera pans sideways to follow you.
- [ ] Decide whether the station interior should become a walkable room (12 × 10, as the sheets imagine) or stay a header.
- [ ] Once `final_art_source` is chosen and finals are approved, swap the code-drawn places for painted backdrops (the draw order and tap code already work for that).

### Watch out
- [ ] Checked only in headless Chromium at 390 and 320 px wide (walk tests and screenshots), not on a real iPhone or Android, and not with a keyboard on desktop.
- [ ] Arrow keys still move along the grid, which on screen is diagonal now (Up goes up-right, Left goes up-left). Tapping is the main control; keys may feel odd.
- [ ] From the depot door you can't see the whole platform: the "Train · the Line" label and the west end of the train go off screen until you walk toward them.
- [ ] People are still the old 8-pixel sprites standing in the diorama; they don't match the painterly places yet.
- [ ] The Lamp-lit trigger is "Cinder Hollow's back room won". The brief also allows "the town's first critter wakes"; that isn't wired.
- [ ] The other depots (Lamplight, Copperbank, Ironmere) still use the old `img/depot.jpg` header.
- [ ] `test-hub.py` now starts its "walk onto the door from far away" check from (4,7) instead of (3,11), because the door is off screen from the far platform end.
- [ ] Everything here is code-drawn concept art (no image model), so nothing new goes in `design/ai-assets.md`.
- [ ] `build-and-test.py`'s auto-player never gets past the walkable opening (it doesn't tap the canvas), so its run plays 0 nights. Same on the code before this change; the walk itself is covered by `test-opening.py` and `test-hub.py`, which pass.

---

## Leg 1 · Oct 31, 2026 · Artist agent (with Claude)
Art only, no build change.

### What's new
- **Town and station v2 concepts (#21).** Brief in `art/briefs/21-town-station.md`; three concept sheets: `art/concepts/21-A.svg` (painted top-down), `21-B.svg` (isometric diorama), `21-C.svg` (side-on stage). Each shows Cinder Hollow's town and the waiting-hall card room at phone size, a 2x detail, Arrival vs Lamp-lit, the scene in a phone frame with the UI and cards, and the palette.
- **Draft art direction** in `art/art-direction.md` (the game didn't have one): expressionist oil-sketch places, Art Nouveau cards, palette from the prototype, sizes, roughs via Cloudflare, `final_art_source: undecided`.
- Painted roughs (2 per direction) requested in `art/concepts/21-roughs.json`. None made yet: the Art roughs workflow failed (see Watch out).
- This patch-notes file and `design/ai-assets.md` (the AI disclosure log) are new.

### Next up
- [x] @Hunter: review the draft `art/art-direction.md` along with the concepts, then reply `Pick: A`, `B` or `C` on the concepts pull request. (picked B, done Oct 31, Hunter; the art direction itself is still a draft)
- [ ] Whoever picks: fill `final_art_source` and the cost table in `art/art-direction.md` so the finals run can price it.
- [x] If B or C wins: the walk code in `prototype/v1/world.js` is a square top-down grid; isometric or side-on movement is engineering work to plan before finals. (iso drawing, tapping and draw order done Oct 31, Hunter with Claude)

### Watch out
- [ ] The art direction is a draft written by the agent from the docs and mood art; nobody has approved its palette, sizes or style lead yet.
- [ ] The request names Disco Elysium's Revachol as the style. The draft treats it as a feel only (expressionist, lamplit, lived-in); finals and roughs must not copy its places, characters or signage.
- [ ] Sheets were checked only in headless Chromium (1280 px and 390 px wide), not on a real iPhone or Android. They use an SVG displacement filter for the painterly edge; older phones may render them slowly.
- [ ] The sheets are code-drawn mood sketches; figures and props are blocky placeholders. Judge camera angle, lighting and layout, not finish.
- [x] @Hunter: the **Art roughs workflow failed** on every art branch today (#21, #22, #24, #25), twice on this branch, at the "Make the roughs" step. The agent couldn't read the log; likely the `ART_KEY` secret or the rough endpoint. Once fixed, re-run Art roughs on `art/trickbound-21-town-station` (Actions → Art roughs → Run workflow) and the 6 roughs will land on the branch. (Hunter with Claude, Nov 1, 2026: `ART_KEY` added; the Art roughs workflow made the roughs on this game's art branches)
- [ ] Roughs come from Flux Schnell and may add stray text or signage despite the prompt; check them before anyone reuses them.
- [ ] Brief reference links (Wikimedia Commons categories, Wikipedia) weren't opened by the agent; check they still resolve.
- [ ] The station interior is today only a 150 px header image; the sheets also imagine it as a walkable 12 × 10 room. That's a scope question, not decided.
