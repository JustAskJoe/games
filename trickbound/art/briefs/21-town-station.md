# Town and station interior, v2 (#21)

© 2026 justaskjoe. All rights reserved.

- Asset: a v2 of two places in Leg 1: **the little town** (Cinder Hollow's square and platform, the walkable opening and town hub in `prototype/v1/world.js`) and **the inside of the train station** (the depot's waiting-hall card room: stove, card tables, the counter and pack wall, the quest board). Concept art only, so the whole prototype has at least concept art for these places.
- Where it shows (screen, size on a phone): the town fills the walk screen, 12 × 15 tiles, about 372 × 465 px on a 390 px phone. The station interior today is the 150 px tall header on the depot screen (`.depot-art`); a v2 room could be walkable at 12 × 10 tiles (about 372 × 310 px). Sizes are in the draft `art/art-direction.md`.
- States / upgrades / animations:
  - **Arrival:** cold, one lamp of two working ("one lamp working out of two", the platform intro line).
  - **Lamp-lit:** after the town's first critter wakes or the night is won; every lamp and window lit.
  - Snow falls over the town in both states (the prototype already animates it). No other animation asked for.
- Must read as: a worn, cold mining-railway town where the only warmth is the card room, painted in a loose expressionist hand, with the people, doors and tables you can use always sitting in the light.
- Style ask: "Keep the art DE/Revachol style." Read as the *approach* (expressionist oil-sketch, lived-in, lamplight against cold), made with our own places and people. Nothing copied.
- Directions:
- A: Painted top-down: keep today's top-down grid and repaint each place as one loose oil-sketch backdrop, cheapest to wire in, but straight-down views flatten buildings and faces and read least like the reference.
- B: Isometric diorama: three-quarter isometric rooms and streets with real walls and lamplight pooling on the floor (the v3 scope's "isometric depot rooms"), closest to the reference, but the walk code needs new movement and draw order.
- C: Side-on stage: wide side-on panoramas walked left and right like a stage set, the most cinematic, but it drops free roaming and a portrait phone shows only a slice.
- Sheets: `art/concepts/21-A.svg`, `21-B.svg`, `21-C.svg`. Each shows the town and the hall at phone size, a 2x detail, both states, the scene in a phone frame with the UI and a hand of cards, and the palette.
- Roughs: `art/concepts/21-roughs.json` asks for 2 per direction (town, hall) from Cloudflare Workers AI. **ROUGH**, mood only, not shipped.
- References (links only, for mood and structure, not to copy):
  - Wikimedia Commons, railway station waiting rooms: https://commons.wikimedia.org/wiki/Category:Waiting_rooms_in_railway_stations
  - Wikimedia Commons, mine headframes: https://commons.wikimedia.org/wiki/Category:Headframes
  - Wikimedia Commons, railway stations in snow: https://commons.wikimedia.org/wiki/Category:Railway_stations_in_snow
  - Wikimedia Commons, Expressionist paintings: https://commons.wikimedia.org/wiki/Category:Expressionist_paintings
  - Disco Elysium (the style named in the request; for feel only): https://en.wikipedia.org/wiki/Disco_Elysium
- Estimate: **source undecided** (`final_art_source: undecided`, no cost figures in the table). Per place: 2 lighting states + 1 header crop = 3 images; two places = **6 images**, plus 25% for retries ≈ **8 generations** in Canva, or 2 commissioned paintings (each with a lighting variant). Direction B or C also needs engineering work in `world.js` that isn't art cost.
