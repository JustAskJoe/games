# Squad and enemies: who's fighting in the street (#25)

© 2026 justaskjoe. All rights reserved.

- Asset: the units on the road. The **squad** (underground ravers bringing music back to Neon City: masks, hoodies, glow gear, rave rebels with guns, not soldiers) in its normal cyan look and its near-white Overclock look; the **swarm** (small Hush units that fill the road in walls of up to about 400); **drones** (tougher flying units that lead each wall); **bikers** (heavy enemies that hunt the squad). Not the Hush Enforcer boss (the request says not to redesign it).
- Where it shows (screen, size on a phone): on the road in every run, portrait 390 × 844 (`render.js`). The squad is seen from behind and the enemies from the front. Roughly: a runner 18–24 px tall (up to 180 drawn at once), a swarm unit 8–14 px, a drone 20–30 px wide hovering above the road, a biker 30–40 px tall.
- States:
  - Squad: normal (cyan) and Overclock (near-white `#F2EFE6` with a cyan glow); a back view (what the player sees) and a front view (menus, results, store art).
  - Enemies: normal (pink, bikers red) and hit flash (off-white). P2 also turns a biker gold below half health; that stays.
  - Motion stays as P2 has it (runners bob, the swarm floats and spins, drones hover, bikers weave); no new animation asked for.
- Must read as: a crowd of cyan ravers you'd want to be in, pushing into a pink wall of faceless Hush units, with the tougher drones and bikers picked out at a glance.
- Rules from `art-direction.md` (draft): the squad is cyan, Hush is pink; every unit must read by silhouette at game size; judge the squad by its back.
- Directions:
- A: Street Ravers: hoodies, LED visors and a light strip down every hood, with every Hush unit wearing the same white "mute bar", read cleanly, but at about 20 px the hood is the only big shape so the squad may blur into cyan blobs.
- B: Glowstick Punks: big headphones, LED mohawks and a glow-stick X on every back make each runner a raver at a glance (with shushing swarm heads, megaphone drones and monowheel bikers), but the wider heads make 180 runners overlap more and the shush detail may vanish at 10 px.
- C: Bass Crew: puffer jackets, respirators and a subwoofer backpack whose speaker cone faces the camera give the best read from behind (against pyramid shards, foam-dish drones and shielded hoverbikes), but the backpack hides the gun and much of the Overclock change.
- Each sheet (`art/concepts/25-A.svg`, `25-B.svg`, `25-C.svg`) shows two gameplay-camera scenes (a wall coming in; the drop with the Overclock squad), every unit at game size (1x) and 3x on the road (`#070B1F`) and sky (`#0F1433`) colors, a close-up of every unit and state (squad back and front, Overclock, enemy hit flashes), a swarm wall of about 400 at 1x led by drones with a biker, the palette and a two-line idea / risk caption.
- References (links only, for shapes and mood, not to copy):
  - Wikimedia Commons, rave parties: https://commons.wikimedia.org/wiki/Category:Raves
  - Wikimedia Commons, glow sticks: https://commons.wikimedia.org/wiki/Category:Glow_sticks
  - Wikimedia Commons, hooded sweatshirts: https://commons.wikimedia.org/wiki/Category:Hooded_sweatshirts
  - Wikimedia Commons, loudspeakers (for C's backpack and the drones): https://commons.wikimedia.org/wiki/Category:Loudspeakers
- Estimate: **source undecided** (`final_art_source: undecided`, cost table empty). Whatever the source: squad (back, front, Overclock) 3, swarm 1, drone 1, biker 1, plus a lineup for store art 1 = **7 generations**, plus 25% for retries ≈ **9**. If Claude builds the pick as low-poly models in `render.js` (as P2 does), there is no generation cost, only build time.
