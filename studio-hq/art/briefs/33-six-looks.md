# Six new looks for Studio HQ (#33)

© 2026 justaskjoe. All rights reserved.

- Pieces: the full set for each look (from `art/art-direction.md`): village map 1680 × 944, phone street 1600 × 800, every building and agent-house room 1400 × 787 (lower third calm), agent figures about 560 px tall (person and familiar, three-quarter view, transparent). The concept sheets cover the palette, the map, the street, and the Workshop and Town Hall rooms; figures and the other rooms come in finals for the looks that are kept.
- Where it shows: Studio HQ, on phones and computers. Every kept look becomes an option in ⚙ Settings.
- Must read as: a sharp, clean village at dusk where each of the eight buildings is recognizable at a glance (even at 120 px), windows glow warm against a cool sky, and nothing anywhere carries text.
- Workshop: one workbench per game in a row, each with an empty name plate and a small lamp. `games.json` lists 6 games today, so the sheets show 6 benches; finals need a way to add benches as games join (see the pull request).
- Directions:
- A: Ink storybook: crisp ink linework over soft watercolor washes on cream paper, cozy at dusk; the washes can slide back toward the "blurry and mushy" look if the ink isn't kept heavy.
- B: Flat poster: bold flat shapes and strong silhouettes like a vintage travel poster at sunset, the sharpest look; it can feel cold and samey without strong light shapes indoors.
- C: Tiny diorama: an isometric model village on a wooden board, every building a little set piece; its tilt-shift blur fights the "sharp and clean" rule, so blur must stay at the very edges.
- D: Pixel town: 32-bit pixel art with warm lamplight in pixels, crisp at any whole-pixel scale; finals need a fixed pixel grid and AI pixel output usually needs hand clean-up.
- E: Neon noir: a rainy night with wordless neon outlines, wet streets and reflections, the most dramatic; dark scenes hide shapes on dim phones and neon "signs" must never become letters.
- F: Papercraft: layered paper cut-outs with real shadows between layers, tactile and handmade; stacked shadows can muddy small thumbnails and the busy street.
- Palettes (each look sets its own; every color on its sheet comes from this list):
  - A (Ink storybook): `#4E5C86`, `#7F8FB5`, `#E7B98C`, `#7C9468`, `#9DB07A`, `#D9C29A`, `#E2C9A0`, `#C4A57C`, `#A5574A`, `#F7C25E`, `#FFE39A`, `#E07A3F`, `#3A3550`, `#2B2320`, `#F3EAD7`
  - B (Flat poster): `#1F2A4D`, `#F28C4B`, `#F6C667`, `#2E4E5C`, `#3F6B5E`, `#CBA36B`, `#E9D8B4`, `#B89F78`, `#C2493D`, `#FFD166`, `#FFF1C1`, `#E86A3A`, `#14182B`, `#0B0E1A`, `#F6EBD2`
  - C (Tiny diorama): `#8EA6C8`, `#C9B3C4`, `#E8C3A6`, `#557A43`, `#6E8F4E`, `#E3D3B0`, `#F1E3C8`, `#C9B08C`, `#5C7FA8`, `#FFC94D`, `#FFF0B8`, `#E8834A`, `#2A2D3A`, `#4B3A2A`, `#EFE6D6`
  - D (Pixel town): `#2E3463`, `#4A5A9C`, `#C9877A`, `#3B6B4A`, `#5F9A57`, `#B9A27A`, `#E6D3A8`, `#A88E68`, `#8E5A4A`, `#FFD25A`, `#FFF2B0`, `#F07B3F`, `#1B1D33`, `#10101A`
  - E (Neon noir): `#07090F`, `#121A2B`, `#1E2B45`, `#0D1422`, `#2A3147`, `#1A2033`, `#FFB347`, `#FFE2A8`, `#FF3EA5`, `#2EF2FF`, `#8FA7C9`
  - F (Papercraft): `#34406B`, `#6C6FA8`, `#E9A27A`, `#4F7A5A`, `#79A26B`, `#E8D7B5`, `#F4ECDD`, `#D9CBB2`, `#C8664F`, `#FFCF66`, `#FFF0C4`, `#D9774B`, `#2A2E4A`, `#1E2238`
- Pixel grid for D: the art direction doesn't set a source resolution. The sheet's map is drawn at 280 × 158 pixels (1 art pixel = 6 screen pixels at 1680 wide) and its street and rooms at 160 × 80 and 140 × 79. Proposal for finals: author at one quarter of the source size (420 × 236 map, 350 × 197 rooms) and scale up 4x with no smoothing.
- Sheets: `art/concepts/33-A.svg` to `33-F.svg`, hand-coded SVG, no image model.
- Roughs: `art/concepts/33-roughs.json` asks Cloudflare Workers AI (Flux Schnell, free) for 2 per painted direction (A, B, C, E, F): the map and the Workshop. **ROUGH**, mood only, not shipped. D's pixel sheet is its own rough.
- References (links only, for technique, not to copy):
  - Wikimedia Commons, travel posters: https://commons.wikimedia.org/wiki/Category:Travel_posters
  - Wikimedia Commons, pen and ink drawings with watercolor: https://commons.wikimedia.org/wiki/Category:Pen_and_ink_drawings
  - Wikimedia Commons, model villages: https://commons.wikimedia.org/wiki/Category:Model_villages
  - Wikimedia Commons, tilt-shift photographs: https://commons.wikimedia.org/wiki/Category:Tilt-shift_photographs
  - Wikimedia Commons, paper cutting: https://commons.wikimedia.org/wiki/Category:Paper_cutting
- Estimate: free concepts; finals are made in Canva (`final_art_source: canva`), about 40 generations per kept look plus 25% for retries ≈ **50 Canva generations per kept look** (all six would be about 300). The art direction has no per-generation price, so there's no money figure; Hunter OKs the count first. No PixelLab credits.
