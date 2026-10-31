# Studio HQ art: patch notes

© 2026 justaskjoe. All rights reserved.

Newest entry on top. The format is in the root `CLAUDE.md`.

## 0.2 · Oct 31, 2026 · Artist agent (with Claude)
Art only, no change to Studio HQ itself.

### What's new
- **Six new looks sketched (#33).** Brief in `art/briefs/33-six-looks.md` with each look's palette; one concept sheet per direction in `art/concepts/`: `33-A.svg` Ink storybook, `33-B.svg` Flat poster, `33-C.svg` Tiny diorama, `33-D.svg` Pixel town, `33-E.svg` Neon noir, `33-F.svg` Papercraft. Each sheet shows the village map, the phone street (also in a phone frame), the map at 120 px, the Workshop (one bench per game, blank name plates, small lamps) and Town Hall rooms with a calm lower third, the palette, and the idea and risk.
- Painted roughs (map and Workshop for A, B, C, E and F) requested in `art/concepts/33-roughs.json`. D's pixel sheet is its own rough.

### Next up
- [ ] @Hunter: reply `Pick: <letters>` on the concepts pull request (more than one is fine: every kept look becomes a Settings option), plus notes.
- [ ] @Hunter: OK the Canva count for finals (about 50 generations per kept look with retries).
- [ ] If D is kept: set D's pixel source size in `art/art-direction.md` (the brief proposes a quarter of each piece's size, scaled up 4x).

### Watch out
- [ ] The sheets are code-drawn layout and palette studies, not finished art: judge composition, palette and readability, not finish. Figures and the other rooms aren't sketched yet.
- [ ] The Workshop sheets show 6 benches (games.json today). Finals need a plan for when games are added: spare benches, or a bench row the Studio can repeat.
- [ ] Artist instructions cap roughs at 2 per direction, so the Town Hall room has no rough; the art direction lists it. Add it to `33-roughs.json` if wanted.
- [ ] The Art roughs workflow failed on every art branch earlier today (#21, #22, #24, #25). If it fails here too, fix the `ART_KEY` secret or endpoint, then re-run Actions → Art roughs on `art/studio-hq-33-six-looks`.
- [ ] Sheets were checked only in headless Chromium, not on a real phone. A uses an SVG displacement filter and E a glow filter; older phones may draw them slowly.
- [ ] Brief reference links weren't opened by the agent.

## 0.1 · Oct 31, 2026 · Hunter (with Claude)

### What's new
- Studio HQ joins the Artist's projects so she can sketch new looks for the village (`art/art-direction.md`).

### Next up
- [ ] The Artist sketches the six new looks (one art request, directions A to F).
- [ ] @Hunter: pick which looks to make in full; each kept look becomes an option in ⚙ Settings.

### Watch out
- [ ] Final looks are about 40 paintings each (map, street, rooms, figures). They're made in Canva, so the count needs Hunter's OK first.
