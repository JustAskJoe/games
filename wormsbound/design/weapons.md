# Wormsbound: crate weapons and leveling (proposal)

© 2026 justaskjoe. All rights reserved.

**Status:** proposal by Hunter (with Claude), Nov 1, 2026. Nothing here is built or decided. Louiemark to review; once agreed, the decisions move into [`handoff.md`](handoff.md).

## The idea in short
- **A pool of 100 bonus weapons that come out of supply crates**, on top of each character's own Shot 1, Shot 2, SS and Live dud. The brief already plans crates mid-match with bonus weapons (T10). Crate weapons go in a 4th shot slot, so no one has to learn them before playing.
- **Each match draws a small deck from the pool** (say 12 weapons, seeded from the match). Crates only ever hold weapons from that deck. That keeps the brief's "not 60 weapons on day one": the pool is big, but any one match shows a handful, and every match feels a little different.
- **Weapons level up during a match** (Lv1 → Lv3) and reset at the end of it. Nothing that changes numbers carries over between matches (brief: cosmetics only, never stat boosts, never pay-to-win).
- **Original weapons only.** The famous Worms weapons (sheep, bananas, holy grenades, vases, donkeys and the like) are left out on purpose.

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
- Every crate weapon needs its own turn-delay cost (⏱), heavier = more, as for character shots. Several weapons below (Frying Pan, Delay Ray) play with the turn delay directly, which no other artillery game has.
- Open questions: how many crates a match, whether you can hold more than one crate weapon, and whether the SS should still replace Shot 1 or the crate slot.

## The weapons (100)

**Build:** **R** = mostly reuses shot fields the engine already has (`wind`, `speed`, `knock`, `bounce`, `drill`, `strike`, `double`, `rain`, `storm`, `quake`, `tornado`). **N** = needs new handling in `advance()` / `land()` and a line in the bots' `scoreLanding()`.

| Group | Count | Rarity |
|---|---|---|
| Normal guns | 17 | common |
| Melee | 16 | common |
| Explosive | 17 | common |
| Weird | 17 | uncommon |
| Legendary | 10 | rare, 1 a match at most |
| Goofy | 23 | uncommon |

### Normal guns (17)
| # | Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|---|
| 1 | Rivet Rifle | Fast and flat, barely feels the wind; 3 small shots | Rivets stay stuck in units and deal extra damage at the start of their turn | R |
| 2 | Scattercan | 6 pellets in a wide fan; strong up close, weak far away | Pellets bounce once | R |
| 3 | Long Tom | Sniper shot, ignores wind, tiny crater; double damage on a direct hit | Goes through the first unit it hits | N |
| 4 | Ricochet Repeater | Bullets bounce off the ground up to 3 times | Each bounce makes the bullet stronger | R |
| 5 | Tracer Burst | 4 quick shots, each showing where it would land with the wind | Leaves a marker: your next shot gets a perfect aim line | N |
| 6 | Pocket Pistol | 2 quick weak shots; the cheapest ⏱ of any crate weapon | 3 shots | R (`double`) |
| 7 | Sky Lobber | A very high, slow lob that drops almost straight down over walls | Splits in two at the top of its arc | R |
| 8 | Skipper | Skips across water up to 3 times instead of sinking | 4 skips, and a splash blast on the last one | N |
| 9 | Pinball Shot | Extra-bouncy and keeps its speed off every wall | Blasts on every unit it touches | R (`bounce`) |
| 10 | Flak Puff | Bursts at the top of its arc into 8 shards that fall downward | The shards curve toward units below | N |
| 11 | Rail Bolt | Flies dead straight with no drop, bores 6 cells into ground | Bores 12 cells | R (`drill`) + N |
| 12 | Seeker Round | After a second in the air it turns gently toward the nearest enemy | Turns harder | N |
| 13 | Gale Rounds | Rides the wind twice as hard, and hits harder the stronger the wind | Three times as hard | R (`wind`) + N |
| 14 | Triple Barrel | 3 shells fanned 5° apart | 5 shells | R (`rain`) |
| 15 | Hover Round | Flies straight for a second, then drops like a rock | Hovers for 2 seconds | N |
| 16 | Splinter Shot | On hitting ground, 3 splinters fly back the way it came | 5 splinters | N |
| 17 | Ember Rounds | Each hit leaves a small fire on the ground for a turn | Fires last 2 turns | N |

### Melee (16)
All melee needs one new action: a hit within lob range (5 cells), reusing the lob-range check.

| # | Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|---|
| 18 | Shovel Smack | Short hit that knocks the target back and digs out the ground under them | Buries the target, who loses their next walk | N |
| 19 | Haymaker Glove | Spring-loaded punch: little damage, huge knockback, for throwing people into the water | Hits 2 targets in a row | N |
| 20 | Pickaxe Uppercut | Launches the target straight up (they take fall damage) | Their landing makes a crater | N |
| 21 | Pogo Hammer | You jump onto the target and slam down | Bounces you to a second target | N |
| 22 | Chainsaw Burrow | Tunnels 8 cells sideways, damaging everything in its path | Leaves a tunnel you can walk through | R+N |
| 23 | Spatula Flip | Flips the target over your head to your other side | Flips them high enough to take fall damage | N |
| 24 | Rake Sweep | Trips everyone within 3 cells: they lose their next walk | Reach 5 cells | N |
| 25 | Frying Pan | A bonk that adds 200 turn delay to the target, so they play later | Adds 400 | N (uses turn delay) |
| 26 | Spring Boots | You jump 12 cells up; landing on someone stomps them | Jump 18, and the landing makes a crater | N |
| 27 | Shoulder Charge | Charge up to 6 cells forward, carrying the first unit you hit | Carries 2 | N |
| 28 | Grapple Hook | Pull yourself to a spot of ground in reach (movement, not damage) | If it hooks a unit, it pulls them to you instead | N |
| 29 | Chain Whip | 6-cell reach; pulls the target toward you | Damages them when they arrive | N |
| 30 | Drill Fist | A punch that drives you and the target 4 cells into the ground | Buries the target | N |
| 31 | Ground Pound | Slam that pops everyone within 4 cells into the air | Leaves a crater | N |
| 32 | Jousting Lance | A 7-cell straight thrust that ignores armour | Goes through 2 units | N |
| 33 | Crowbar | Pries a live dud out of the ground next to you and hands it to you as a free lob | Resets the dud's fuse to 3 | N (duds) |

### Explosive (17)
| # | Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|---|
| 34 | Sticky Charge | Sticks to the first thing it touches and goes off at the end of the turn | Can stick to a unit, who carries it around | N |
| 35 | Popcorn Bomb | Pops into 5 bomblets (the engine's old Cluster) | Each bomblet pops once more | R |
| 36 | Burrow Mine | Digs in and goes off when any unit comes within 3 cells | Hidden from the other side | N |
| 37 | TNT Drop | Mark a spot; 3 bombs fall from the sky, pushed by the wind | 5 bombs | R (`rain`) |
| 38 | Tar Pot | Leaves a burning puddle that hurts anyone in it for 2 turns | The puddle runs downhill | N |
| 39 | Firecracker String | 3 small charges in a line that go off one after another | 5 charges | N |
| 40 | Tick-Tock Grenade | Bounces around; you set its fuse from 1 to 5 seconds | Splits into 3 when it goes off | N |
| 41 | Shaped Charge | Blasts only downward: a deep, narrow hole | Twice as deep | R (`drill`) |
| 42 | Powder Keg | Plants an explosive barrel on the map that any blast sets off | 2 barrels | N |
| 43 | Nail Bomb | A blast plus a cone of nails in the direction you aimed | Wider cone | N |
| 44 | Smoke Bomb | No damage; anyone in the cloud takes 30% less damage for a turn | 50% less | N |
| 45 | Bottle Rocket | Wiggles through the air, then bursts into 6 sparks | 12 sparks | R+N |
| 46 | Undermine | Hollows out a big pocket under the surface, so whoever stands there drops through | Bigger pocket | R (`drill` + carve) |
| 47 | Jump Mine | Whoever steps on it is flung straight up | Flings twice as high | N |
| 48 | Thermite Spike | Burns 20 cells straight down through anything | Leaves fire at the bottom | R (`drill`) |
| 49 | Echo Bomb | Goes off, then again a turn later in the same spot | Three times | N |
| 50 | Remote Charge | Lands quietly; on any later turn you can set it off (costs delay, not a shot) | 2 charges | N |

### Weird (17)
| # | Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|---|
| 51 | Gravity Well | Pulls nearby units in, then pops | Pulls in live duds too: easy chain reactions | N |
| 52 | Swap Shot | You swap places with whoever it hits | Swaps your SS charge too | N |
| 53 | Dirt Cannon | Adds ground instead of removing it: build a wall or bury someone | Leaves a dirt bridge | N |
| 54 | Magnet Mortar | Curves toward the nearest armoured unit (Brick hates it) | Pulls in metal shells in flight, live duds included | N |
| 55 | Echo Shell | Fires again on your next turn from the same spot and aim, even if you've moved (cheap, since the engine is deterministic) | Echoes twice | N |
| 56 | Portal Pair | Fire two portals; shells and units that enter one come out the other, for 3 turns | They stay for the rest of the round | N |
| 57 | Wind Vane | You pick next turn's wind | Holds it for 2 turns | N |
| 58 | Float Bubble | Units in it drift slowly upward for a turn, and can drift off the map | Lasts 2 turns | N |
| 59 | Mirror Wall | Raises a wall that bounces shells back the way they came | Bounced shells come back twice as fast | N |
| 60 | Shrink Ray | The target shrinks: harder to hit, but takes 25% more damage for 2 turns | 3 turns | N |
| 61 | Grow Ray | The target grows: a big easy target that walks slower, for 2 turns | They can't fit through tunnels | N |
| 62 | Decoy | Puts a copy of you on the map; bots aim at it, and it blows up when hit | 2 decoys | N |
| 63 | Pause Shell | Stops in mid-air and hangs there until your next turn, then carries on | You can re-aim it when it starts again | N |
| 64 | Ground Flip | Turns a 10-cell square of terrain upside down | A 16-cell square | N (terrain only) |
| 65 | Delay Ray | Adds 300 turn delay to the target | Adds 600 | N (uses turn delay) |
| 66 | Dud Magnet | Pulls every live dud on the map 6 cells toward where it lands | 10 cells | N (duds) |
| 67 | Weather Balloon | Floats off with the wind, dropping hail along its path | Floats twice as far | N |

### Legendary (10, gold crate, at most 1 a match)
| # | Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|---|
| 68 | **Dud King** | A giant live dud that splits into 4 live duds when it lands: the signature mechanic, scaled up | The duds' fuses are staggered so they go off one after another | R+N |
| 69 | **Sun Lance** | A beam down one column of the map that cuts through all ground and hits everything in it | Sweeps 6 cells sideways | N |
| 70 | **Chain Comet** | A meteor that jumps to the next nearest enemy, up to 3 times | No damage falloff between jumps | N |
| 71 | **Tide Turner** | Raises the water 4 rows right now | You choose: raise it or drain it | N |
| 72 | **Crater Maker** | Crater 12 (twice Meteor Slam) that reshapes the map | Throws debris that hurts | R |
| 73 | **Black Hole Pocket** | Swallows the ground and any shells within 6 cells, then bursts, throwing everyone outward | Swallows live duds and spits them out as new ones | N |
| 74 | **Kraken Grab** | A huge tentacle rises from the water and drags the unit nearest the water down 6 rows | Grabs two | N |
| 75 | **Golden Dud** | A live dud with a 1-turn fuse and 150 damage. Whoever lobs it levels up their crate weapon | Fuse 2, so it can be lobbed twice | N (duds) |
| 76 | **Pocket Moon** | A tiny moon that circles where it lands for 2 turns, smashing anything it passes | Circles wider | N |
| 77 | **Shuffle Bomb** | Everyone (you too) teleports to a random safe spot on the map | You pick your own spot | N |

### Goofy (23)
| # | Weapon | What it does | Lv3 twist | Build |
|---|---|---|---|---|
| 78 | **Fake Dud** | Looks and counts down exactly like a live dud, but blows up in the hands of whoever lobs it: a mind game on the signature mechanic | Swaps places with nearby real duds | N |
| 79 | Rubber Chicken | Bounces 5 times, squawking each time, then blows up | Every bounce explodes | R (`bounce`) |
| 80 | Bowling Ball | Rolls along the ground and scatters units like pins | Strike! Hitting 3 units refunds your turn delay | N |
| 81 | Piñata | Bursts into candy that heals anyone standing in it, either side | The candy only heals you | N |
| 82 | Kazoo Cannon | A cone of sound: no damage, big knockback, plays a kazoo | Also flips the wind | N |
| 83 | Boomerang Boot | Flies out and comes back, hitting both ways | Hits 3 times | N |
| 84 | Plunger Tether | Sticks you to an enemy: if one of you is knocked back, the other is dragged along | Reel them in | N |
| 85 | Bouncy Castle | An inflatable that bounces any shell landing on it | Pops into a blast | N |
| 86 | Pickpocket Magpie | Steals a random crate weapon from the target | Also steals an SS notch | N |
| 87 | Rubber Duck Float | You survive the water once | The duck explodes too | N |
| 88 | Whoopee Mine | Whoever steps on it is launched with a rude noise | Launches them twice as far | N |
| 89 | Confetti Cannon | No damage; the target's aim preview is hidden on their next turn | 2 turns | N (UI) |
| 90 | Cream Pie | Pie to the face: the target's next shot power wobbles ±15% | ±25% | N |
| 91 | Soap Bar | Makes the ground slippery: units on it slide downhill | Bigger patch | N |
| 92 | Trampoline | Places a trampoline; anyone landing on it bounces high | Shells bounce off it too | N |
| 93 | Squeaky Mallet | A giant inflatable hammer: 1 damage, triple knockback | Squeaks louder (and knocks harder) | R (`knock`) |
| 94 | Disco Ball | Everyone within 8 cells has to dance: they shuffle 3 steps in a random direction | 6 steps | N |
| 95 | Cardboard Box | Hide in a box: the next hit on you does nothing and breaks it | Takes 2 hits | N |
| 96 | Pepper Shaker | The target sneezes at the start of their turn and jumps backward | Sneezes twice | N |
| 97 | Snowball | Rolls downhill, growing bigger and hitting harder as it goes | Grows twice as fast | N |
| 98 | Gnome Drop | A garden gnome drops from the sky and stands as a little wall | 3 gnomes | N |
| 99 | Hot Potato | A dud that jumps to the nearest unit at the end of every turn, then blows on turn 3 | Bigger blast | N (duds) |
| 100 | Magic Carpet | You ride your next shot and land where it lands | Your landing stomps whoever is there | N |

## Building it, in phases
1. **Crates, the 4th slot, the match deck and in-match leveling**, with the R weapons (Pocket Pistol, Triple Barrel, Popcorn Bomb, TNT Drop, Shaped Charge, Thermite Spike, Pinball Shot, Rubber Chicken, Squeaky Mallet, Crater Maker, Dud King). This proves the system mostly on existing code.
2. **The melee action**, then the Weird and Goofy weapons that need new code. The turn-delay and live-dud weapons (Frying Pan, Delay Ray, Crowbar, Dud Magnet, Hot Potato, Fake Dud) come early: they build on what makes this game different.
3. **The other Legendaries.**

Each phase: run the full sim with crates on. Every character must still win 40–60% of the round-robin, and the pass band in `build-and-test.py` gets a line for crate weapons (for example, no single crate weapon decides more than a set share of matches).

## Open questions (for Louiemark)
- Crates at all in Prototype 2, or wait for the playtest?
- How many crates a match, and do bots pick them up?
- One crate weapon held at a time, or a small stack?
- How big is the match deck (12?), and should players see it before the match?
- Which weapons to cut: 100 is a pool to choose from, not a launch list.
