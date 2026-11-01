# The street: towers, skyline, road, arches and signs (#24)

© 2026 justaskjoe. All rights reserved.

- Asset: the street the squad runs through, as one set: street towers with rooftop neon; the far skyline, sun and sky; the road surface and the arches that pass overhead; and hanging street signs in two states.
- Where it shows (screen, size on a phone): the whole background of every run, portrait 390 × 844, seen from behind and above the squad (`render.js`: camera 6.6 up and 9.2 back, about 52° field of view). Near towers fill the left and right thirds (roughly 60–120 px wide on a phone); signs hang 9–12 units up and show at roughly 40–90 px wide; arches span the road, about 9 units wide and 8 tall, one every 2 bars; the skyline and sun sit on the horizon about a quarter of the way down the screen.
- States:
  - **Muted** (before the drop): Hush propaganda signs (HUSH, OBEY, NO MUSIC), fewer lit windows, dimmer neon.
  - **Liberated** (after the drop, when Overclock fires): the same signs flipped to our slogans, more windows lit, the city's neon awake.
  - The road and arches pulse on the beat in both states (P2 already does this).
- Must read as: a night street that belongs to Hush until the drop, then visibly belongs to the squad, without ever being brighter than the road, the gates or the units.
- Rules from `art-direction.md` (draft): cyan is the squad's and pink is the enemy's, so the city's own neon is violet, gold and off-white; only Hush signs may use pink.
- Directions:
- A: Clean Synthwave: polish what everyone liked in P2 (window-grid monoliths, one violet roofline each, the striped sun, chevron road and plain neon arches) so it's the safest pick, but also the most familiar look in the genre.
- B: Stacked Arcology: terraced, chamfered towers with stepped rooftop neon, a Hush spire with a halo ring in place of the sun, a hex-seam road and octagonal portal arches give Neon City its own skyline, but the extra shapes risk crowding the gates on a small phone.
- C: Speaker City: the city is built like sound gear (speaker-grille facades, equalizer-bar rooftops, a speaker-cone sun and arches that rise like a level meter at the drop), which makes the music theme literal, but before the drop it is very dark and could feel empty.
- Each sheet (`art/concepts/24-A.svg`, `24-B.svg`, `24-C.svg`) shows a gameplay-camera scene, a tower, sign and arch at in-game size and 3x on the road (`#070B1F`) and sky (`#0F1433`) colors, all three signs in both states side by side, a skyline / sun / sky strip, a road tile, the palette and a two-line idea / risk caption.
- References (links only, for shapes and mood, not to copy):
  - Wikimedia Commons, night skylines: https://commons.wikimedia.org/wiki/Category:Night_skylines
  - Wikimedia Commons, neon signs: https://commons.wikimedia.org/wiki/Category:Neon_signs
  - Wikimedia Commons, Arcosanti (terraced arcology forms, for B): https://commons.wikimedia.org/wiki/Category:Arcosanti
  - Wikimedia Commons, loudspeakers (grilles and cones, for C): https://commons.wikimedia.org/wiki/Category:Loudspeakers
- Estimate: **source undecided** (`final_art_source: undecided`, cost table empty). Whatever the source, the set is about 8 pieces: 2 tower variants with rooftop neon, skyline + sun + sky, road texture, arch, 3 signs × 2 states as one sign sheet, plus a muted and a liberated mood frame = **8 generations**, plus 25% for retries ≈ **10**. If Claude builds it in code in `render.js` instead (as P2 does), there is no generation cost, only build time.
