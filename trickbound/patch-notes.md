# Trickbound: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked. Checkbox items stay open until someone ticks them (`- [x] … (done Oct 31, Hunter)`). See open items for everyone with `python3 kit/open-notes.py`, or just yours with `--for Hunter`.

Say **"add to patch notes"** to Claude any time to add to the top entry. Claude also adds one before every push.

---

## Leg 1 · Oct 31, 2026 · Artist agent (with Claude)
Art only, no build change.

### What's new
- **Town and station v2 concepts (#21).** Brief in `art/briefs/21-town-station.md`; three concept sheets: `art/concepts/21-A.svg` (painted top-down), `21-B.svg` (isometric diorama), `21-C.svg` (side-on stage). Each shows Cinder Hollow's town and the waiting-hall card room at phone size, a 2x detail, Arrival vs Lamp-lit, the scene in a phone frame with the UI and cards, and the palette.
- **Draft art direction** in `art/art-direction.md` (the game didn't have one): expressionist oil-sketch places, Art Nouveau cards, palette from the prototype, sizes, roughs via Cloudflare, `final_art_source: undecided`.
- Painted roughs (2 per direction) requested in `art/concepts/21-roughs.json`; the Art roughs workflow commits them to the branch.
- This patch-notes file and `design/ai-assets.md` (the AI disclosure log) are new.

### Next up
- [ ] @Hunter: review the draft `art/art-direction.md` along with the concepts, then reply `Pick: A`, `B` or `C` on the concepts pull request.
- [ ] Whoever picks: fill `final_art_source` and the cost table in `art/art-direction.md` so the finals run can price it.
- [ ] If B or C wins: the walk code in `prototype/v1/world.js` is a square top-down grid; isometric or side-on movement is engineering work to plan before finals.

### Watch out
- [ ] The art direction is a draft written by the agent from the docs and mood art; nobody has approved its palette, sizes or style lead yet.
- [ ] The request names Disco Elysium's Revachol as the style. The draft treats it as a feel only (expressionist, lamplit, lived-in); finals and roughs must not copy its places, characters or signage.
- [ ] Sheets were checked only in headless Chromium (1280 px and 390 px wide), not on a real iPhone or Android. They use an SVG displacement filter for the painterly edge; older phones may render them slowly.
- [ ] The sheets are code-drawn mood sketches; figures and props are blocky placeholders. Judge camera angle, lighting and layout, not finish.
- [ ] Roughs come from Flux Schnell and may add stray text or signage despite the prompt; check them before anyone reuses them.
- [ ] Brief reference links (Wikimedia Commons categories, Wikipedia) weren't opened by the agent; check they still resolve.
- [ ] The station interior is today only a 150 px header image; the sheets also imagine it as a walkable 12 × 10 room. That's a scope question, not decided.
