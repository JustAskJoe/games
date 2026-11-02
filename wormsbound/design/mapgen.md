# Wormsbound: map generator

© 2026 justaskjoe. All rights reserved.

**Status:** built and tested (Nov 2, 2026, Hunter with Claude). A **proposal for Louiemark**, who leads Wormsbound: the themes, settings, presets and theme rules below are first passes to keep, change or cut.

**Code:** [`prototype/mapgen.js`](../prototype/mapgen.js) (the generator, no other files needed) · **Map Lab:** [`builds/wormsbound-maplab.html`](../builds/wormsbound-maplab.html) · **Tests:** section 9 of `prototype/test.js` · **Sim:** the `map` lines of `prototype/sim.js`

## What it is
Every Wormsbound map is now generated. Like a strategy game's map setup, you pick a **preset** (a theme map such as Frostbite Peaks, or a mode such as Tournament), then change any **setting** (landform, height, caves, liquid level, hazards, wind, mirror...). The result packs into a **share code** that rebuilds the same map anywhere.

- **In the game:** the title screen's MAP list has Shuffle, the 10 theme maps and 9 modes. The box next to it takes a share code, and the **Map Lab** button opens the Lab.
- **In the Map Lab:** every setting with a live preview, spawn markers for 1v1 or 4 players, six variations from the next seeds, checks (land, fairness, spawn room), the theme's rule, **Copy** for the code, **Play this map** (opens the game on it) and **Save PNG**.
- **For code:** `MapGen.generate(input, { w, h, seed })` with a preset id, a share code or a settings object. Pure and seeded, with no DOM or engine imports, so it plugs into anything (see [Plugging it in](#plugging-it-in)).

## Settings
Every setting is a level, so a menu or the Lab can draw them straight from `MapGen.SETTINGS` (label, help text, level names, default).

| Setting | Levels (default **bold**) | What it does |
|---|---|---|
| Theme | 10 themes (**Crater Hills**) | Colours, props, liquid, wind and the hazard. See [Themes](#themes). |
| Landform | **Auto** (the theme's own) or one of 10 | The big shape. See [Landforms](#landforms). |
| Size | Small 128×72 · **Medium 160×90** · Large 200×112 · Huge 240×135 | Grid size. Wormsbound stays Medium (the whole map on one screen) until it has a camera. |
| Height | Very low · Low · **Normal** · High · Very high | Where the ground stands. High = longer falls, more to dig. |
| Ruggedness | Smooth · Rolling · **Normal** · Rough · Jagged | Swells, then small jags on Rough and Jagged. |
| Land | Sparse · Light · **Normal** · Heavy · Packed | Chasms and gaps when sparse; wider islands, narrower alleys and gorges when packed. |
| Caves | None · **Few** · Some · Many · Warren | Wandering tunnels; Many and Warren add a field of pockets. Buildings and junk get rooms instead. |
| Overhangs | None · **Few** · Some · Lots | Thin lips with air under them: cover from shots that come straight down. |
| Platforms | **None** · Few · Some · Lots | Floating ledges (dirt) or girders, depending on the theme. |
| Props | None · Few · **Some** · Lots | Theme props stamped on the ground. Solid and breakable. |
| Hazards | None · **Few** · Some · Lots | The theme's hazard: barrels or old duds. Never within 7 cells of a spawn. |
| Liquid level | Low · **Normal** · High · Flooded | Starting liquid row (86 / 82 / 78 / 74 of 90). Sudden death still raises it. |
| Hard rock | **None** · Bedrock · Veins | Cells blasts can't break. Bedrock: ground 9+ cells from any air. Veins: streaks 5+ cells in. Never at the surface or on a cave wall at the start. |
| Wind | Calm ×0.5 · **Breezy ×1** · Windy ×1.3 · Gale ×1.6 | Multiplies every turn's wind. |
| Mirror | **Off** · Mirror | Left half copied onto the right, hazards and spawns too. Fair ground for competitive 1v1. |

Themes set their own defaults (Sky Isles has no caves and is windy; Fungal Hollow is calm with more caves, and so on), presets set more, and your own changes go on top.

## Themes
Each theme has its own default landform, props, platform style, hazard, liquid, wind and colours (`MapGen.THEMES[id].look`, which any renderer can use). The **rule** is the theme's signature: it's built (from wind, hazards and liquid) and makes each map play differently. **Later** is a bigger idea for that theme that needs new engine work.

| Theme | Landform | Props | Hazard | Liquid | Wind | Rule (built) | Later |
|---|---|---|---|---|---|---|---|
| **Crater Hills** | Hills | trees, boulders | Old duds | water | ×1 | Old live duds lie on the hills: anyone can lob them, and they tick from turn 1 (fuse 4–6). | Gopher holes that pop a unit up elsewhere. |
| **Sky Isles** | Islands | trees, stone pillars | Old duds | water | ×1.3 | High winds. | Updrafts between islands that lift shells. |
| **Scrap Yard** | Towers | car shells, crates, pipes | Oil drums | sludge | ×1 | Drums blow when a blast reaches them, and chain. | A magnet crane that swings once a round. |
| **Rooftops** | City | chimneys, water towers, antennas | Gas canisters | night water | ×1.3 | Rooftop gusts and canisters. | Water towers that burst and wash units along. |
| **Frostbite Peaks** | Peak | ice spikes, snowmen | Frozen duds | icy water | ×1.3 | Biting wind and frozen duds. | Slippery ice; icicles that drop when the ceiling is hit. |
| **Dune Mesas** | Mesas | cacti, stone arches | Buried duds | water | ×1.3 | Buried duds and desert wind. | Sand that slumps when undermined. |
| **Fungal Hollow** | Caverns | giant mushrooms, stalactites | Spore pods | toxic ooze | ×0.5 | Still air underground, spore pods that burst. | Bouncy mushroom caps. |
| **Shipwreck Cove** | Bowl | ship hulls, coral | Powder kegs | sea | ×1.3 | Kegs everywhere, sea breeze. | A tide that goes up and down. |
| **Magma Works** | Bridges | pipes, chimneys, crates | Fuel drums | lava | ×1 | Drums by girder bridges over lava; bedrock under the cliffs. | Heat vents; lava splashes that leave fires. |
| **Haunted Hollow** | Canyon | gravestones, dead trees, crypts | Restless duds | murk | ×1 | Old duds among the graves. | Graves that cough up a dud every few turns; fog. |

## Landforms
| Landform | Shape | Land setting changes |
|---|---|---|
| Hills | Rolling hills, a valley in the middle | chasms when sparse, no valley when packed |
| Islands | 3–6 floating islands, low rocks just above the liquid | how many islands and how wide |
| Mesas | Flat plateaus at five heights with sheer edges | slot canyons between them when sparse |
| Caverns | One thick slab with chambers, tunnels and skylight shafts | how many chambers |
| Canyon | Two high plateaus, a gorge down to the liquid, stepped ledges | gorge width; a natural bridge when heavy |
| Peak | One big central mountain | chasms when sparse |
| Bowl | High rims, low middle | a mound in the middle when heavy |
| City | Buildings, setback storeys, a street that floods first | alley width |
| Towers | Low ground with stacked junk towers | how many towers |
| Bridges | Two cliffs, piers and a girder deck over the liquid | gap width, number of piers |

Every landform reads Height and Ruggedness. On top of the shape come caves, overhangs, props and platforms, then hard rock and the mirror.

## Presets
| Preset | What |
|---|---|
| The 10 theme maps | Each theme with its own defaults. **Shuffle** deals from these. |
| Classic Duel | Crater Hills, mirrored, no hazards |
| Tournament | Dune Mesas, mirrored, no hazards, few props, normal wind |
| Archipelago | Sky Isles with more, smaller islands, high water and a few ledges |
| Worm Warren | Fungal Hollow on Hills, high, Warren caves |
| High Rise | Rooftops, very high, girders between buildings |
| High Tide | Shipwreck Cove, flooded, high ground |
| Fortress | Haunted Hollow on Mesas, packed, bedrock and veins |
| Chaos | Magma Works with everything turned up |
| First Steps | Smooth mirrored hills, calm, no hazards: for a first match |

## Share codes
`theme-landform-DDDDDDDDDDDDD-seed`, for example `frost-peak-1222120211020-k3j9a`.
- 13 digits: size (0–3), then height, ruggedness, land, caves, overhangs, platforms, props, hazards, liquid, hard rock, wind, mirror.
- The seed is base 36. **Seed 0 means "new layout every match, same settings"** (the Lab's "Same layout every match" box unticked).
- Bad codes (unknown theme, a digit out of range) are refused, never half-loaded.

## How a map is made (and what's guaranteed)
1. The landform builds the shape. The top 10% of the map is always open sky, so every spot can be lobbed over.
2. Caves, overhangs, props, then platforms (props first, so nothing stands on a floating girder).
3. Clean-up: pieces under 10 cells and single cells sticking out go.
4. Hard rock (if on), then the mirror (if on), then hazards on the final ground.
5. **Checks:** land is 8–80% of the space above the liquid; at least 6 of 8 spawn spots across the map have room (Wormsbound's rule: dry ground at the column and 3 and 6 cells either side); both far edges have one; and the two halves are fair (score 70+ from land mass and average height). A map that fails is rebuilt from the next seed in a fixed order (up to 12 tries), so the same settings always give the same map.

On 1,000+ generated maps (every preset on 40 seeds, 300 random settings, all sizes) every one passed the checks, almost always on the first try. Each map takes about 1 ms.

## Plugging it in
```js
const map = MapGen.generate('frost', { w: 160, h: 90, seed: matchSeed });   // or a share code, or { preset: 'hills', caves: 3 }
// map.T: w*h cells (0 air, 1 ground, 2 hard rock, 3 prop, 4 prop accent; non-zero is solid)
// map.water, map.sky, map.theme, map.landform, map.name, map.id (store this to rebuild), map.code (share code with the seed)
// map.windMul, map.mirror, map.hazard { kind, name }, map.features [{ kind: 'barrel' | 'dud', x, y, fuse? }]
// map.stats { ok, problems, land, spawnRoom, fairness, tries }
MapGen.spawns(map, 4);              // where 4 sides would start (mirrored on mirror maps)
MapGen.draw(ctx, map, { cell: 4 }); // a quick picture: sky, ground by depth, materials, liquid, hazards
MapGen.THEMES[map.theme].look;      // colours for a full renderer: sky, ridges, shades, rock, prop, accent, liquid, hazard
```
**Wormsbound** calls it in `newGame` (`opts.map`: a preset id, a share code or a settings object; default Crater Hills) and takes the cells, liquid level, wind strength, mirror and hazards from it. `G.map` holds the id, so a replay rebuilds the same map. The engine adds three things: blasts don't carve hard rock, barrels (`G.barrels`) blow when a blast reaches them and fall when the ground goes, and old duds go in `G.duds` with `old: true`.

**Another game** can use `mapgen.js` as it is: any grid size, its own spawn rule (`spawnOK` and `spawnNear` are Wormsbound's), its own hazards from `features`. Themes and landforms are plain objects, so adding one is a new entry, not a new system.

## Systems and mechanics to make maps play differently
Ranked by how much they add to decisions per turn against the work. ✅ = built in this pass.

| Idea | Why it's fun or strategic | Work |
|---|---|---|
| ✅ Wind strength per theme | Same shot, different map, different read. Calm maps reward precision, windy ones reward Gale players and wind-readers. | done |
| ✅ Barrels (oil drums, kegs, spore pods...) | Free damage if you hit the drum next to them, and a reason to not stand by one. Chains make big plays. | done |
| ✅ Old duds on the map | The live-dud mechanic, but from the map: a race to lob it first. | done |
| ✅ Hard rock | Cover you can't blast away once it's dug out; slows digging wars on Fortress. | done |
| ✅ Mirror maps | Fairness for competitive 1v1, as an option rather than the rule. | done |
| ✅ Themed liquid | Lava, sludge, ooze, murk: looks only (it all drowns you the same). | done |
| Mines | Area denial: walking becomes a decision. Bots would need to learn them. | small |
| Crates on platforms | (Ties to the crate weapons proposal in `weapons.md`.) Risky high ground to grab loot. | medium |
| Collapsing girders | Blow the bridge with them on it. Girder cells could fall as a unit instead of hanging. | medium |
| Slippery ice (Frostbite) | Units slide after landing: positioning matters more. | small |
| Bouncy caps (Fungal) | Bank shots off mushrooms. Reuses the bounce code. | small |
| Updrafts (Sky Isles) | Columns that lift shells: new trick shots. | small |
| Tides (Shipwreck Cove) | The liquid goes up and down every few turns: low ground is safe, then isn't. | small |
| Sand that slumps (Dune Mesas) | Undermined sand pours down: digging changes the map around you. | medium |
| Fog (Haunted Hollow) | You can't see the far side until someone fires: scouting with cheap shots. | medium |
| Weather events | A storm turn (double wind) or a still turn, announced a turn ahead. | small |
| Heat vents (Magma Works) | Stand on one and it launches you next turn. Movement trick and trap. | medium |
| Portals or teleport pads | Big movement swing. Better as a crate weapon (Portal Pair is in `weapons.md`). | medium |
| A camera and bigger maps | Unlocks Large and Huge, and the true Worms feel of scouting the map. | large |

## Balance (bot sim)
`node prototype/sim.js 200`, Nov 2, 2026: 25 smart-vs-smart matches per preset, random characters, plus 25 on random custom settings. Every preset and the custom line finished every match: no stuck matches, no timeouts.

| Preset | Median turns (p10–p90) | Reach sudden death | Barrels blown a match |
|---|---|---|---|
| Crater Hills | 19 (3–29) | 36% | 0.0 |
| Sky Isles | 21 (5–30) | 36% | 0.0 |
| Scrap Yard | 23 (8–28) | 48% | 1.1 |
| Rooftops | 25 (9–26) | 68% | 0.4 |
| Frostbite Peaks | 16 (6–29) | 28% | 0.0 |
| Dune Mesas | 23 (15–31) | 44% | 0.0 |
| Fungal Hollow | 19 (5–36) | 44% | 0.6 |
| Shipwreck Cove | 20 (12–27) | 28% | 1.1 |
| Magma Works | 13 (2–25) | 20% | 0.9 |
| Haunted Hollow | 12 (6–29) | 20% | 0.0 |
| Classic Duel | 20 (12–34) | 44% | 0.0 |
| Tournament | 24 (6–31) | 56% | 0.0 |
| Archipelago | 10 (0–24) | 20% | 0.0 |
| Worm Warren | 14 (4–29) | 28% | 0.5 |
| High Rise | 24 (9–26) | 56% | 0.4 |
| High Tide | 20 (12–27) | 28% | 1.1 |
| Fortress | 27 (11–33) | 64% | 0.0 |
| Chaos | 17 (6–26) | 36% | 1.4 |
| First Steps | 19 (7–33) | 24% | 0.0 |
| Random custom settings | 21 (4–28) | 48% | 0.3 |

The default map's mirror line (Crater Hills, Volt vs Volt, 200 matches): median 14 turns, going first wins 49%. Character round-robin (on Crater Hills): Brick 56%, Zip 40%, Volt 52%, Digger 44%, Gale 56%, all inside the 40–60% band, with Zip right on the floor.

**What the numbers say:**
- **Props were the biggest lever on match length.** At first, tall trees, pillars and ice spikes blocked so many shots that the median match on Sky Isles was 23 turns (no props: 15). Props are now shorter and fewer.
- **Strong wind makes matches longer** (Frostbite Peaks with a ×1.6 gale: median 26 turns; with ×1.3: 19). Frostbite's default is now Windy (×1.3); Gale stays a setting and is part of Chaos.
- **Longest:** Fortress (27), Rooftops (25), Tournament and High Rise (24), Scrap Yard and Dune Mesas (23): tall buildings, towers and plateaus block shots, and Fortress has hard rock. **Shortest:** Archipelago (10; about 10% of its matches end on turn 1), Haunted Hollow (12) and Magma Works (13), where knock-offs into the gorge or lava end matches.
- **Archipelago was retuned:** at first it used Sparse land, and a quarter of its matches ended on turn 1. It now uses Light land.
- The bots never walk, so on maps where walking matters (Rooftops, Bridges, platforms) people will play differently from the sim.

## Open questions for Louiemark
1. **The 10 themes and their rules:** keep, rename, swap? Does each one feel different enough?
2. **Which mechanics next** from the list above? The small ones (tides, slippery ice, bouncy caps, updrafts) are each about a day with tests.
3. **Shuffle:** theme maps only (now), or the modes too?
4. **Hazards default:** on (Few) for every theme map, or off in ranked or competitive play?
5. **The real map menu:** the in-game picker is a plain list plus a code box until the menus are designed. Should the full Lab panel live in the game later?
6. **Bigger maps:** do we want a camera (and the Large and Huge sizes) for Prototype 2?
