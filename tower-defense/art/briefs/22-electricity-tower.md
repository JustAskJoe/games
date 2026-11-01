# Spark tower, the electricity tower (#22)

© 2026 justaskjoe. All rights reserved.

Request (Joe, in Studio HQ's Art Cottage): "a 3d looking electricity tower with a fantasy style architecture but still somewhat cozy for a tower defense game."

- Asset: the **Spark** tower (the game's electricity tower, `prototype/engine.js` → `spark`: chain lightning that jumps between enemies, strong against flyers), base plus its two tier II upgrade branches, and its tower button.
- Where it shows (screen, size on a phone): on the board during waves, one 80 px cell wide and up to 96 px tall, drawn 8 px above its cell (the 960 × 640 board scales down to fit, so on a 390 px-wide phone in landscape a cell is roughly 55–70 px). Also the 96 × 96 tower button.
- States / upgrades / animations:
  - Base (tier I): chains to 3 enemies.
  - Storm II (branch A, rust mark): "Chains to 5 enemies."
  - Overload II (branch B, gold mark): "Each jump does full damage, not less."
  - No animation asked for. A flicker on the glowing core when it fires would suit it; the prototype draws the bolt in code.
- Must read as: "the lightning tower" from silhouette alone: a glowing blue core held up by cozy fantasy architecture. Storm looks wider-reaching (more rods, more arcs); Overload looks heavier and more charged (bigger core, gold bands).
- "3D looking": read within the painted 2D style in `art-direction.md` as **solid volume**: every drum, box and cone has a lit left face, a shaded right face and a visible top, in three-quarter view. Still ink line over flat paint, not a 3D render. (Open question for Joe on the pull request.)
- Directions:
  - A: Lantern Spire: a round stone-and-plaster tower with an open belfry holding a glowing spark orb under a teal cone roof; risk: tall and thin like the Arrow tower, so the two may blur at 1x.
  - B: Cottage Dynamo: a timber-framed cottage with glowing blue windows and a stone coil chimney that sparks; risk: the coziest, but it can read as a house or the keep rather than a tower.
  - C: Rune Conductor: two leaning stone pillars on a timber deck with a floating faceted spark crystal arcing between them; risk: the least cozy, and the blue crystal could be confused with the Frost tower.
- Upgrade rule (from `art-direction.md`): same silhouette family, bigger and more ornate; rust mark for A, gold mark for B, plus the prototype's "II" badge.
- Palette: only `art-direction.md` hexes. The glow is Spark `#4F8FD6` with a Frost `#8FC8D8` halo and a Plaster `#F7EEDC` hot spot. The prototype's copper spire colors (`#B07A3C`, `#8E5F2C`) aren't in the palette, so the sheets use timber and stone instead.
- Sheets: `art/concepts/22-A.svg`, `22-B.svg`, `22-C.svg`.
- References (links only, for structure and readability, not to copy):
  - Wikimedia Commons, Tesla coils: https://commons.wikimedia.org/wiki/Category:Tesla_coils
  - Wikimedia Commons, lightning rods: https://commons.wikimedia.org/wiki/Category:Lightning_rods
  - Wikimedia Commons, timber-framed houses: https://commons.wikimedia.org/wiki/Category:Timber_framed_houses
  - Wikimedia Commons, conical roofs: https://commons.wikimedia.org/wiki/Category:Conical_roofs
  - Wikimedia Commons, Jacob's ladders (spark gaps): https://commons.wikimedia.org/wiki/Category:Jacob%27s_ladders
- Estimate: **source: Canva** (picked Oct 28, 2026, see `art-direction.md` and `design/handoff.md`). Finals are 3 tower states + 1 button = **4 images**, plus 25% for retries ≈ **5 Canva generations**, exported at 160 × 192 with transparent backgrounds. No dollar or credit figure: Canva's "cost each" is still blank in the cost table.
