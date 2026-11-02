# Wormsbound: crate weapons and leveling (proposal)

© 2026 justaskjoe. All rights reserved.

**Status:** proposal by Hunter (with Claude), Nov 1, 2026. Nothing here is built or decided. Louiemark to review; once agreed, the decisions move into [`handoff.md`](handoff.md).

## The idea in short
- **35 bonus weapons that come out of supply crates**, on top of each character's own Shot 1, Shot 2, SS and Live dud. The brief already plans crates mid-match with bonus weapons (T10). Crate weapons go in a 4th shot slot, so no one has to learn them before playing, and the brief's "not 60 weapons on day one" holds: a match only shows a handful.
- **Weapons level up during a match** (Lv1 → Lv3) and reset at the end of it. Nothing that changes numbers carries over between matches (brief: cosmetics only, never stat boosts, never pay-to-win).
- **Original weapons only.** The famous Worms weapons (sheep, banana bombs and the like) are left out on purpose.

## Leveling

| Option | What | Fits the brief? |
|---|---|---|
| **A. In-match leveling** (proposed) | Each crate weapon starts at Lv1. It levels when you **hit an enemy with it** or **open a second crate of the same weapon**. **Lv2** is a plain step up (+25% crater or damage). **Lv3** adds a new behavior (the "Lv3 twist" column below). Everything resets next match. | Yes |
| **B. Mastery across matches, cosmetic only** | Use a weapon across matches to unlock its trail, then an explosion color, an announcer line, and a gold skin. | Yes |
| **C. Stat upgrades across matches** | Weapons get permanently stronger. Breaks "never pay-to-win" and the sim's 40–60% character band. | No: needs Louiemark to change the brief |

Proposal: A now, B later with the rest of the cosmetics.

## Crates
- **Rarity:** Normal, Melee and Explosive are common; Weird and Goofy uncommon; Legendary rare, at most 1 a match, with a gold crate.
- Crates drop on a seeded schedule (the engine's own RNG) so replays, `hash()` and later online play stay in sync. Picking one up is a player action through `act()`.
- Every crate weapon needs its own turn-delay cost (⏱), heavier = more, as for character shots.
- Open questions: how many crates a match, whether you can hold more than one crate weapon, and whether the SS should still replace Shot 1 or the crate slot.

## The weapons

**Build:** **R** = mostly reuses shot fields the engine already has (`wind`, `speed`, `knock`, `bounce`, `drill`, `strike`, `double`, `rain`, `storm`, `quake`, `tornado`). **N** = needs new handling in `advance()` / `land()` and a line in the bots' `scoreLanding()`.

### Normal guns
| Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|
| Rivet Rifle | Fast and flat, barely feels the wind; 3 small shots | Rivets stay stuck in units and deal extra damage at the start of their turn | R |
| Scattercan | 6 pellets in a wide fan; strong up close, weak far away | Pellets bounce once | R |
| Long Tom | Sniper shot, ignores wind, tiny crater; double damage on a direct hit | Goes through the first unit it hits | N |
| Ricochet Repeater | Bullets bounce off the ground up to 3 times | Each bounce makes the bullet stronger | R |
| Tracer Burst | 4 quick shots, each showing where it would land with the wind | Leaves a marker: your next shot gets a perfect aim line | N |

### Melee
All melee needs one new action: a hit within lob range (5 cells), reusing the lob-range check.

| Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|
| Shovel Smack | Short hit that knocks the target back and digs out the ground under them | Buries the target, who loses their next walk | N |
| Haymaker Glove | Spring-loaded punch: little damage, huge knockback, for throwing people into the water | Hits 2 targets in a row | N |
| Pickaxe Uppercut | Launches the target straight up (they take fall damage) | Their landing makes a crater | N |
| Pogo Hammer | You jump onto the target and slam down | Bounces you to a second target | N |
| Chainsaw Burrow | Tunnels 8 cells sideways, damaging everything in its path | Leaves a tunnel you can walk through | R+N |

### Explosive
| Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|
| Sticky Charge | Sticks to the first thing it touches and goes off at the end of the turn | Can stick to a unit, who carries it around | N |
| Popcorn Bomb | Pops into 5 bomblets (the engine's old Cluster) | Each bomblet pops once more | R |
| Burrow Mine | Digs in and goes off when any unit comes within 3 cells | Hidden from the other side | N |
| TNT Drop | Mark a spot; 3 bombs fall from the sky, pushed by the wind | 5 bombs | R (`rain`) |
| Napalm Jar | Leaves a burning puddle that hurts anyone in it for 2 turns | The puddle spreads downhill | N |

### Weird
| Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|
| Gravity Well | Pulls nearby units in, then pops | Pulls in live duds too: easy chain reactions | N |
| Swap Shot | You swap places with whoever it hits | Swaps your health percentages too | N |
| Dirt Cannon | Adds ground instead of removing it: build a wall or bury someone | Leaves a dirt bridge | N |
| Magnet Mortar | Curves toward the nearest armoured unit (Brick hates it) | Pulls in metal shells in flight, live duds included | N |
| Echo Shell | Fires again on your next turn from the same spot and aim, even if you've moved (cheap, since the engine is deterministic) | Echoes twice | N |

### Legendary (gold crate, at most 1 a match)
| Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|
| **Dud King** | A giant live dud that splits into 4 live duds when it lands: the signature mechanic, scaled up | The duds' fuses are staggered so they go off one after another | R+N |
| **Sun Lance** | A beam down one column of the map that cuts through all ground and hits everything in it | Sweeps 6 cells sideways | N |
| **Chain Comet** | A meteor that jumps to the next nearest enemy, up to 3 times | No damage falloff between jumps | N |
| **Tide Turner** | Raises the water 4 rows right now | You choose: raise it or drain it | N |
| **Crater Maker** | Crater 12 (twice Meteor Slam) that reshapes the map | Throws debris that hurts | R |

### Goofy
| Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|
| **Fake Dud** | Looks and counts down exactly like a live dud, but blows up in the hands of whoever lobs it: a mind game on the signature mechanic | Swaps places with nearby real duds | N |
| Rubber Chicken | Bounces 5 times, squawking each time, then blows up | Every bounce explodes | R (`bounce`) |
| Bowling Ball | Rolls along the ground and scatters units like pins | Strike! Hitting 3 units refunds your turn delay | N |
| Piñata | Bursts into candy that heals anyone standing in it, either side | The candy only heals you | N |
| Kazoo Cannon | A cone of sound: no damage, big knockback, plays a kazoo | Also flips the wind | N |
| Boomerang Boot | Flies out and comes back, hitting both ways | Hits 3 times | N |
| Plunger Tether | Sticks you to an enemy: if one of you is knocked back, the other is dragged along | Reel them in | N |
| Bouncy Castle | An inflatable that bounces any shell landing on it | Pops into a blast | N |
| Pickpocket Magpie | Steals a random crate weapon from the target | Also steals an SS notch | N |
| Rubber Duck Float | You survive the water once | The duck explodes too | N |

## Building it, in phases
1. **Crates, the 4th slot and in-match leveling**, with the R weapons (Popcorn Bomb, TNT Drop, Rubber Chicken, Ricochet Repeater, Crater Maker, Dud King). This proves the system mostly on existing code.
2. **The melee action**, then the Weird and Goofy weapons that need new code.
3. **The other Legendaries.**

Each phase: run the full sim with crates on. Every character must still win 40–60% of the round-robin, and the pass band in `build-and-test.py` gets a line for crate weapons (for example, no single crate weapon decides more than a set share of matches).

## Open questions (for Louiemark)
- Crates at all in Prototype 2, or wait for the playtest?
- How many crates a match, and do bots pick them up?
- One crate weapon held at a time, or a small stack?
- Which weapons to cut: 35 is a pool to choose from, not a launch list.
