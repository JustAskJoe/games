# Rogue Shooter: Full Game Design v2

## 2026 justaskjoe. All rights reserved.

**Status:** Design complete. v2 build in progress; the v2 art pass (Nov 2, 2026) is folded in below.
**Team:** Joe, with Claude.
**Date:** Nov 2, 2026

> **From the art pass.** Sections and lines marked *(art pass)* came from the finished v2 art (`art/concepts/`, `design/art-integration-handoff.md`). Where the art team had to guess, the line says **proposed** and the question is listed in [Open questions from the art pass](#open-questions-from-the-art-pass). The look itself (3× pixels, 16-px tiles, top-down, top-left light) is in `design/art-direction.md`.

---

## Game Overview

A rogue-like auto-shooter with a deep Stardew Valley-style farm phase between combat rounds. Pick a class, survive 30 rounds of escalating combat, and build your farm, forge weapons, craft potions, train stats, earn blessings, raise animals, and gamble on arena mutators between fights. Your farm choices define your combat power.

---

## Round Structure

- **30 total rounds**
- Each round lasts **2-3 minutes** of combat
- Every round ends with a **mini-boss**
- Every 5th round (5, 10, 15, 20, 25, 30) has a **major boss**
- Round 30 = final boss
- Between each round, the player enters the **farm phase** (no time limit)

### 6 Zones (5 rounds each)

| Zone | Rounds | Visual Tone | Mood |
|---|---|---|---|
| Meadow | 1-5 | Bright greens, sunny, flowers | Hopeful, easy |
| Forest | 6-10 | Deep greens, tree silhouettes | Getting serious |
| Caverns | 11-15 | Gray stone, crystal glints, blue | Cold, dangerous |
| Volcanic | 16-20 | Red-orange, lava glow, ash | Intense |
| Shadow | 21-25 | Dark purple, fog, faint stars | Ominous |
| Void | 26-30 | Black with neon cracks, particles | Final, otherworldly |

### A run, screen by screen *(art pass)*

Title → class select → battle map → fight → round complete → farm (and town) → battle map → … → victory after round 30, or run over when HP hits zero.

### Battle zones *(art pass)*

Every zone is a seamless ground, obstacles you can't walk through, small ground details with no collision, and its own light. Obstacles stand on their feet: a collision circle sits under each one.

| Zone | Obstacles | Ground hazards | Light |
|---|---|---|---|
| Meadow | oaks, pines, boulders, bushes | **Pond**: water, blocks movement | drifting cloud shadows, bright and warm |
| Forest | old trees, stumps, giant mushrooms, mossy boulders | **Fallen log**: blocks movement | darker, with patches of canopy light |
| Caverns | stalagmites, crystal clusters, rock pillars, rocks | none | crystal glow, dark edges |
| Volcanic | basalt columns, charred trees, obsidian | **Lava pool**: burns while you stand in it | lava glow, red glow from below |
| Shadow | dead trees, broken pillars, gravestones | **Ruined arch**: walk under the middle; its pillars block | drifting fog bands, dark edges |
| Void | floating rocks, monoliths, debris | **Void pit**: pulls you in slowly and hurts while you stand in it | neon glows, dark edges |

Meadow, Forest and Shadow have a winding path. Hazard sizes are **proposed** (taken from the sprite); see the open questions.

---

## Classes (5)

Each class has a unique base attack (auto-fire), unique spacebar ability, different base stats, an innate strength, and an innate weakness.

### Base Stats

| Stat | Knight | Mage | Marksman | Rogue | Witch |
|---|---|---|---|---|---|
| HP | 130% | 90% | 80% | 70% | 85% |
| Power (per hit) | 140% | 85% | 75% | 60% | 100% |
| Move Speed | 75% | 100% | 100% | 130% | 90% |
| Attack Speed | 80% | 100% | 120% | 150% | 50% |
| Crit Chance | 5% | 8% | 12% | 8% | 5% |
| Base Armor | 15% | 0% | 0% | 0% | 5% |

### Knight — The Juggernaut

- **Base Attack: Sword Slash** — wide arc (90) aimed at the nearest enemy. Short range, highest damage per hit. Multi Shot widens the arc (+3: 180, +5: 270). Never reaches 360 — enemies on the far side of the arc are missed.
- **Spacebar: Shield Bash** (8s cooldown) — charge forward, stun enemies for 1.5s, deal 2x base damage.
- **Innate Strength: Fortified.** +15% armor, +30% HP.
- **Innate Weakness: Heavy.** Slowest class, can't kite.
- **Best against:** Bosses, tanky enemies, small groups.
- **Worst against:** Swarms from all directions, fast enemies.
- **Preferred cards:** Vitality, Armor.

### Mage — The Scholar

- **Base Attack: Magic Bolt** — homing projectile toward nearest enemy. Long range, low damage. Multi Shot adds bolts in a fan, each independently homing (+3: 4 bolts, +5: 6 bolts).
- **Spacebar: Blink** (6s cooldown) — instant teleport medium distance, arcane explosion at departure point.
- **Innate Strength: Arcane Mind.** +20% XP gain. More level-ups = more card picks. 15-25 extra cards over a full run.
- **Innate Weakness: Fragile Power.** Lowest damage per hit. Relies on card accumulation.
- **Best against:** Mixed groups (homing), long rounds (XP advantage).
- **Worst against:** High-HP bosses, tanky enemies.
- **Preferred cards:** Power, Precision.

### Marksman — The Sniper

- **Base Attack: Piercing Shot** — straight-line projectile fired at the nearest enemy that passes through everything behind it. Very long range, fast fire rate. Multi Shot adds parallel piercing lines (+3: 4 lines, +5: 6 lines = wall of projectiles).
- **Spacebar: Focus Shot** (10s cooldown) — 0.5s windup, then massive 5x damage piercing bolt with screen-wide range. Slows enemies hit.
- **Innate Strength: Deadeye.** 12% base crit. Crits deal 2.5x (not 2x). Piercing crits hit every enemy in the line.
- **Innate Weakness: Glass Frame** (**proposed**, replaces Tunnel Vision now that every basic attack aims itself). 80% HP and no armor; one line of fire at a time, so a ring of enemies gets through.
- **Best against:** Enemies approaching in lines, groups from one direction.
- **Worst against:** Flanking enemies, encirclement, Shade Assassins.
- **Preferred cards:** Rapid Fire, Precision.

### Rogue — The Glass Cannon

- **Base Attack: Dagger Flurry** — rapid short-range strikes at the nearest enemy. Very short range, fastest attack speed, lowest per-hit damage but highest DPS. Multi Shot adds daggers in a tight cone (+3: 4 daggers, +5: 6 daggers). Never 360.
- **Spacebar: Shadow Dash** (5s per charge, 2 charges) — dash in movement direction, invincible during dash, damages enemies you pass through. Takes no damage during dash.
- **Innate Strength: Elusive.** +30% move speed, +15% dodge chance (flat chance to avoid any hit).
- **Innate Weakness: Paper.** 70% HP, zero armor. Big hits are lethal.
- **Best against:** Single targets (bosses melt under sustained DPS), anything you can circle.
- **Worst against:** Unavoidable AOE damage, Wraith true damage, Nightmare fear aura.
- **Preferred cards:** Swiftness, Momentum.

### Witch — The Ritualist

- **Base Attack: Hex Pulse** — AOE ring burst centered on self. 360 coverage, medium radius, slowest fire rate (1.5-2s gap between pulses). Multi Shot adds outer rings (+3: double ring, +5: triple ring). Ring gaps mean enemies at specific distances take no damage.
- **Spacebar: Ritual Burst** (10s cooldown) — instantly triggers next pulse with 1.5x damage and 4s hex mark (double duration).
- **Innate Strength: Ritual Power.** Every pulse hit applies 2s hex mark — marked enemies take 15% more damage from ALL sources (weapons, dogs, everything).
- **Innate Weakness: Vulnerable Windows.** Slowest fire rate, 1.5-2s gap between pulses. Enemies that survive a pulse are in melee range during downtime. Below-average HP.
- **Best against:** Dense swarms of weak enemies, clumped groups.
- **Worst against:** Bosses (low DPS), fast rushers during pulse gap.
- **Preferred cards:** Power, Thick Skin.

### Weapon x Ability Interactions

Both equipped weapons add their effect flavor to the spacebar ability:

| Weapon | Ability Enhancement |
|---|---|
| Orbital Blades | Releases burst of spinning blades at impact point |
| Chain Lightning | Damage chains to 2-3 nearby enemies beyond targets |
| Fire Trail | Leaves fire patches where ability hits or along its path |
| Frost Nova | Applies frost slow to all enemies hit |
| Homing Missiles | Launches 2-3 homing missiles at affected enemies |

With 2 weapons equipped, both effects apply simultaneously.

---

## Combat Systems

### Base Attack
- Always active, auto-fires
- **Every class's basic attack aims itself at the nearest enemy** (decided Nov 3, 2026), the way the Mage's bolt always has. The hero turns to face the target while attacking. Only the **spacebar ability** goes the way the hero is facing (the last direction moved).
- Scales with Power, Fire Rate, Crit, Multi Shot from level-up cards
- Class-flavored (see above)
- Weapons from the Forge layer ON TOP of base attack (additive, not replacement)

### Weapons (5)
Obtained and upgraded at the Forge building. Not from level-up cards.

| Weapon | Signature Material |
|---|---|
| Orbital Blades | Bone Fragments |
| Chain Lightning | Wisp Dust |
| Fire Trail | Demon Essence |
| Frost Nova | Slime Gel |
| Homing Missiles | Bat Wings |

- Start with no weapons (base attack only)
- Forge T1 allows equipping 1 weapon
- Beat round 5 major boss: second weapon slot unlocks
- Weapon cap: 2
- Swapping weapons at the Forge is free; levels persist per weapon
- Level-up cards never offer weapons, weapon levels or evolutions (decided Nov 3, 2026): all of that happens at the Forge.

### Level-Up Cards
- **12 cards**, 4 rarities (Common/Rare/Epic/Legendary)
- Cards **persist across rounds** (accumulate all game)
- Reduced values to prevent extreme scaling
- 3 cards per draw (4 with Training Ground T3)
- Class-weighted preferred cards (~1.5x more likely)
- TAB to view stats during selection
- No stacking cap on any card

**Card pool:**

| Card | Common | Rare | Epic | Legendary |
|---|---|---|---|---|
| Vitality | +2% max HP | +4% | +7% | +12% |
| Power | +2% damage | +4% | +7% | +12% |
| Swiftness | +2% move speed | +4% | +7% | +12% |
| Precision | +1% crit | +2.5% | +4% | +8% |
| Armor | +2% armor | +4% | +7% | +12% |
| Rapid Fire | +2% attack speed | +4% | +7% | +12% |
| Magnetism | +5% pickup radius | +10% | +18% | +30% |
| Fortune | +3% gold/material drops | +6% | +10% | +18% |
| Momentum | +1% dmg/sec alive | +2% | +3.5% | +6% |
| Adrenaline | +3% dmg below 50% HP | +6% | +10% | +18% |
| Thick Skin | -0.5 flat dmg/hit | -1 | -2 | -3 |
| Multi Shot | +1 projectile | +1 proj | +1 proj +5% dmg | +2 proj +8% dmg |

**Base rarity weights:**

| Rarity | Base Weight |
|---|---|
| Common | 60% |
| Rare | 25% |
| Epic | 12% |
| Legendary | 3% |

Luck stat shifts weights toward higher rarities (see Training Ground).

### Potions (Combat Consumables)
- Manual trigger: **Q** (slot 1), **E** (slot 2), **R** (slot 3)
- Potions persist until used
- Crafted at Alchemy Lab, stored in Potion Chest (house, 10 slots)
- The belt shows Q and E from Alchemy T1; R stays locked until Alchemy T2 *(art pass)*

### Hero movement and feedback *(art pass)*
- Heroes face **front, back or side** (left is the side view flipped), picked from the way they move. They keep the last facing while standing still.
- 4-frame walk, a 3-frame attack that plays each time the auto attack fires (with the class's attack effect), and a 3-frame spacebar ability. Moving abilities (Shield Bash, Blink, Shadow Dash) carry the hero along.
- **Hurt:** a white flash, a flinch frame and a short knockback.
- **Death:** recoil, kneel, fall and fade with a soul sparkle, then the Run Over screen.
- Each class's attack has its own color (Knight orange-gold, Mage purple, Marksman blue, Rogue green, Witch magenta). Weapons have one color each (Orbital Blades gold, Chain Lightning yellow, Fire Trail orange-red, Frost Nova ice blue, Homing Missiles copper).

### Spawns, deaths and telegraphs *(art pass)*
- Enemies rise out of a void-purple rune ring (about 0.6 s) before they can move or hurt you, so a spawn is never a surprise hit.
- Normal enemies die in a short white poof; bosses die in a white flash with gold rings.
- Boss and enemy attacks are telegraphed before they land: **red** for damage, **purple** for status effects (slows, fear, darkness).
- Damage numbers pop in the pixel font; crits are bigger and gold.

### Pickups *(art pass)*

| Pickup | From |
|---|---|
| Gold coin (spins) | most enemies |
| Gold pile | tougher enemies and bosses |
| Small XP gem | most enemies |
| XP gem | tougher enemies |
| Big XP gem | bosses |
| Material drop (bobs) | the enemy's material; the Golem Core drop pulses |

Everything is pulled in once you are inside your pickup radius (Magnetism). The gem and pile tiers are **proposed**.

---

## Farm Phase

No time limit. No energy system. Resources (gold, materials, seeds, Golem Cores) are the natural limiters.

### Farm Layout
- Stardew Valley-style top-down tile-based maps
- **Farm** (main area): house, 30 crop plots (freeform), 6 buildings, paths to town and battle
- **Town**: seed shop, general store
- **House interior**: bedroom, kitchen, living room, Potion Chest, Harvest Bin
- Auto-transitions between areas
- Directional signs on paths (signs show icons, never words) *(art pass)*

### The Riverside farm *(art pass)*
- Laid out on 16-px tiles: the cabin, six building sites, the crop field, an animal pen, the river, and paths to town and to battle. Fully built: `art/concepts/farm-hub.html`.
- **Day one** (`art/concepts/farm-start.html`): only the cabin stands. The six building sites are empty lots or ruins marked with stakes, rope and a blank build sign. Four plots are tilled (**proposed**: plots 1, 2, 7 and 8, top left); the other 26 are covered by rocks, stumps and weeds until unlocked. The pen is empty.
- Barn animals wander the pen (side view, walk and idle); bees have a hive. The pen dog is the same dog that fights with you.
- **People** *(presentation only; the NPC systems stay shelved)*: the farmer greets you in the building menus, the arena warrior runs the Arena, and the town has a seed keeper and a shopkeeper. They share the heroes' size, three facings and walk cycle.

### Town *(art pass)*
A cobbled square with a fountain, the **seed shop** (green roof, sprout sign) on the left, the **general store** (striped awning, gold-pouch sign) on the right, two houses, a market stall and a notice board (the last two are decoration for now).
- **Seed shop:** the seed keeper sells today's seeds. Stock changes every round and its tiers grow with the zone (quick and standard in the Forest, rare from round 11, legendary from round 16). Buys go into the 12-slot seed bag. Prices are **proposed**.
- **General store** (**proposed**, the design had not set it): buys the field expansions from the plot table, and basic materials in fives; sells spare crops and materials back for gold.

### Resources

**Combat drops:**

| Resource | Source |
|---|---|
| Gold | All enemies |
| Slime Gel | Slimes |
| Bat Wings | Bats |
| Bone Fragments | Skeletons, Beetles |
| Demon Essence | Demons, Fire enemies |
| Wisp Dust | Wisps, magical enemies |
| Spore Dust | Shroomlings |
| Golem Core | Moss Golem, major bosses (rare, ~6-8 total per run) |

---

## Crops

### Plot System
- **30 regular plots** (freeform placement, unlocked progressively)
- **1 Void plot** (unlocks round 21, special)
- Freeform placement with **hover preview** showing space used when planting

**Plot unlocking:**

| Progression | Plots | Total | Cost |
|---|---|---|---|
| Start | 4 | 4 | Free |
| Round 2-3 | +4 | 8 | 50g |
| Round 5-6 | +4 | 12 | 75g |
| Round 8-10 | +4 | 16 | 100g |
| Round 12-14 | +4 | 20 | 150g |
| Round 17-19 | +4 | 24 | 200g |
| Round 22-24 | +6 | 30 | 300g |
| Round 21 | Void plot | +1 special | Zone unlock |

### Crop Tiers

| Tier | Grow Time | Size | Available From |
|---|---|---|---|
| Quick | 1 round | 1x1 | Round 1 |
| Standard | 2 rounds | 1x1 | Round 6 |
| Rare | 3 rounds | 1x2 | Round 11 |
| Legendary | 4 rounds | 2x2 | Round 16 |
| Void | 1 round | Special plot | Round 21 |

**How crops look and grow** *(art pass)*
- Four stages on a plot that matches the footprint: seed when planted, sprout after a quarter of the grow time, growing at half, ready when done. Plants can rise up to one tile above their plot.
- Glow Moss, Storm Seed, Phoenix Flower and the Void crops pulse when ready.
- The **Void plot** is black soil with an obsidian rim and neon cracks that pulse violet; it is drawn 2x2 (**proposed**).
- **Planting with the hover preview:** the picked seed follows the cursor as a see-through plant over its footprint, green when it fits and red when it would cover a crop, a rock or the field edge. **R** rotates 1x2 crops (**proposed**). Number keys pick a seed from the bag.

### Crop List

**Quick crops (1 round, 1x1):**

| Crop | Combat Buff |
|---|---|
| Healing Herb | Regen 1 HP/sec for 30s |
| Pep Root | +10% move speed |
| Glow Moss | +15% XP gain |
| Wheat | +5 gold per enemy killed |
| Thorn Seed | Enemies take 3 damage on contact |

**Standard crops (2 rounds, 1x1):**

| Crop | Combat Buff |
|---|---|
| Fire Pepper | 15% chance attacks ignite (DOT) |
| Frost Berry | Passive 10% slow aura |
| Thunder Turnip | +20% attack speed |
| Shadow Mushroom | +10% crit chance |
| Iron Vine | +15% armor |
| Bloodroot | 3% lifesteal |
| Echo Bloom | 10% chance projectiles double |

**Rare crops (3 rounds, 1x2):**

| Crop | Combat Buff |
|---|---|
| Dragon Fruit | All fire damage doubled |
| Crystal Bloom | Frost effects radius +50% |
| Storm Seed | Lightning chains +2 targets |
| Void Blossom | 20% chance double damage |
| Life Tree Sapling | Auto-heal to full once at 50% HP |
| Ironbark Root | Damage cap at 10% max HP per hit |
| Mirror Petal | Reflect 25% damage to nearest enemy |

**Legendary crops (4 rounds, 2x2):**

| Crop | Combat Buff |
|---|---|
| Phoenix Flower | Revive once with 30% HP |
| World Tree Seedling | All stats +10% |
| Starfruit | All crop effects 2x potency this round |
| Soulbloom | 10% chance defeated enemies fight for you 5s |

**Void crops (1 round, Void plot only, PERMANENT — never harvested):**

| Crop | Permanent Effect |
|---|---|
| Void Heart | All weapon levels +1 |
| Oblivion Seed | Enemies spawn at 85% HP |
| Eternity Blossom | All enemies 15% slower |
| Null Root | Immune to slows and debuffs |
| Rift Bloom | 8% of all damage heals you |

Void crops can be replanted (destroying old one) but only 1 active at a time.

### Crop Uses
Each harvested crop has 2 possible uses (choose one):
1. **Combat buff** — harvest and use as a one-round buff
2. **Crafting ingredient** — consumed at Alchemy Lab for potions/elixirs/tonics

### Seed Sources
1. **Town seed shop** — rotating stock, tier scales with zone progression
2. **Combat drops** — enemies have small drop chance, mini-boss guaranteed 1, major boss guaranteed 1 (higher tier)
3. **Barn chickens** — if chosen as animal
4. **Alchemy Lab seed conversion** — 3 of one tier -> 1 of next tier

**Seed inventory:** 12 slots, carries between rounds.

### Storage (House)
- **Potion Chest** — stores up to 10 crafted potions
- **Harvest Bin** — stores up to 20 harvested crops for later use
- Both open from one **cabin storage** screen *(art pass)*. The chest fills the Q/E/R belt you take into the fight. Picking a crop in the bin shows its two uses side by side: eat it for next round's buff, or keep it for Alchemy (with the recipes that use it).

---

## Buildings (6)

**In the build (v2-M2):** walk up to an unbuilt site's sign and press Enter: a menu says what the building is, what it does, what each tier unlocks and what tier 1 costs, with a **Build** button. Building is instant (**proposed**, answers the open question) and swaps the lot for the finished building from `farm-hub.html`. Walk in through the door to its interior (`interiors.py`) and use the station (anvil, recipe book, drill yard, altar, farmer, arena warrior) to open its menu. Upgrades to T2 and T3 are bought from the footer of each menu (**U**). Choices the design hadn't made, all **proposed**: the Potion belt has 2 slots (Q, E) until Alchemy T2 even before the lab is built; shop potions go on the belt, or into the Potion Chest once the lab exists; shrine offerings take your most plentiful materials; the Arena reward is +50% / +125% / +225% for 1 / 2 / 3 mutators picked (capped by tier), with the rare drop a Golem Core; Barn yields arrive when you come back to the farm; dogs deal about 5 / 7.5 / 10% of your basic-attack DPS each; alternate evolutions use their own art and their own twist (Phantom Edge crits, Storm Cage shocks everything near you, Ember Swarm drops fire under enemies, Glacial Tomb freezes, Orbital Cannon strikes a locked target).

**All 6 buildings available to everyone.** No building slots — build order and upgrade depth is the meaningful choice. Each has 3 tiers. Golem Cores (~6-8 per run) are the T3 bottleneck — can't T3 everything.

**Building menus** *(art pass, `art/concepts/buildings.html`)*: walking into a building opens its menu over the building's interior. Each keeps the shared wood-panel kit and adds its own material: the Forge riveted iron with ember type, the Alchemy Lab a parchment recipe book on purple, the Training Ground rope-edged canvas, the Shrine glowing stone with teal and gold, the Barn red planks with white trim and hay, the Arena dark stone with red and gold banners. Every menu shows your gold and materials and what the next tier unlocks. Whether finishing a building is instant or shows a construction stage first is open.

### Forge (Weapons)

| Tier | Unlocks | Build Cost |
|---|---|---|
| T1 | All 5 weapons visible, equip 1, level cap 3 | 75g + 5 Bone |
| T2 | Level cap 5, weapon mods (1 per weapon) | 200g + 15 Bone + 3 Demon |
| T3 | Level cap 7, evolutions + alternate evolutions | 500g + 2 Golem Cores |

**Round 5 boss unlock:** second weapon slot.

**Weapon acquisition:** 25g + 2 signature materials per weapon.

**Weapon leveling costs:**

| Level | Gold | Materials | Requires |
|---|---|---|---|
| 1-2 | 30g | 3 | T1 |
| 2-3 | 60g | 6 | T1 |
| 3-4 | 100g | 10 | T2 |
| 4-5 | 150g | 15 | T2 |
| 5-6 | 225g | 20 + 1 Golem Core | T3 |
| 6-7 | 325g | 25 + 2 Golem Cores | T3 |

Weapon levels persist when swapped. Swapping is free.

**Weapon mods (T2, 1 per weapon):**

| Mod | Effect | Craft Cost |
|---|---|---|
| Piercing | Effects hit +1 additional enemy | 10 Bone + 5 Bat Wings |
| Siphon | 3% weapon damage heals you | 10 Slime + 5 Spore |
| Amplify | +25% weapon damage | 10 Demon + 5 Wisp |
| Velocity | +30% weapon attack speed | 10 Bat Wings + 5 Slime |
| Eruption | Kills cause small AOE explosion | 10 Demon + 5 Bone |
| Chill | Hits apply brief slow | 10 Slime + 5 Wisp |

**Evolutions (T3, level 5+ with stat gate):**

| Weapon | Evolution | Stat Gate | Alt Evolution | Alt Gate |
|---|---|---|---|---|
| Orbital Blades | Sawblade Tornado | Speed >= 155 | Phantom Edge | Crit >= 25% |
| Chain Lightning | Judgement | Crit >= 20% | Storm Cage | Armor >= 25% |
| Fire Trail | Hellfire | Power >= 130 | Ember Swarm | Speed >= 160 |
| Frost Nova | Absolute Zero | Armor >= 30% | Glacial Tomb | Power >= 135 |
| Homing Missiles | Missile Barrage | Multishot >= 3 | Orbital Cannon | Crit >= 20% |

Evolution cost: 200g + 1 Golem Core. Keeps mod and level. Permanent, can't revert.

**What the evolutions look like** *(art pass, `art/concepts/combat.html`)*: Sawblade Tornado is six spinning saws on two rings; Phantom Edge turns the blades ghostly violet with afterimages that flash on crits; Judgement drops a pillar of light on the target after a ground warning; Storm Cage is a ring of lightning around you; Hellfire is taller, darker flames; Ember Swarm sends embers that swirl out and home in; Absolute Zero is a huge freezing burst with ice spikes; Glacial Tomb freezes enemies solid before they shatter; Missile Barrage fires a fan of six; Orbital Cannon paints a red target lock, then a beam falls from the sky. Frost Nova also leaves a frozen patch on the ground that keeps slowing what walks through it.

### Alchemy Lab (Crafting)

| Tier | Unlocks | Build Cost |
|---|---|---|
| T1 | Basic potions, 2 belt slots (Q E), seed conversion (3->1 tier up) | 60g + 5 Slime + 5 Spore |
| T2 | Advanced elixirs, 3 belt slots (Q E R), material conversion (5->3 type swap) | 175g + 10 Wisp + 5 Spore |
| T3 | Legendary tonics, potency +25% across the board | 400g + 2 Golem Cores + 10 Demon |

**Basic potions (T1) — 2 crops + 3 materials + 10g:**

| Potion | Effect | Crops | Materials |
|---|---|---|---|
| Heal Flask | Restore 25% HP instant | 2 Healing Herb | 3 Slime Gel |
| Speed Draught | +25% speed 30s | 2 Pep Root | 3 Bat Wings |
| Power Tonic | +20% damage 30s | 1 Thorn Seed + 1 Wheat | 3 Demon Essence |
| Iron Brew | +20% armor 30s | 2 Wheat | 3 Bone Fragments |
| Focus Drops | +15% crit 30s | 2 Glow Moss | 3 Wisp Dust |
| Cleansing Salve | Remove debuffs + immune 15s | 1 Healing Herb + 1 Glow Moss | 3 Spore Dust |

**Advanced elixirs (T2) — 4 crops + 5 materials + 25g:**

| Elixir | Effect | Crops | Materials |
|---|---|---|---|
| Berserker Brew | +25% damage, +25% attack speed, -15% armor 45s | 3 Fire Pepper + 1 Thorn Seed | 5 Demon Essence |
| Stone Skin Elixir | +35% armor, damage cap 10% HP 30s | 3 Iron Vine + 1 Wheat | 5 Bone Fragments |
| Ghost Oil | +20% speed, 15% dodge 30s | 2 Pep Root + 2 Frost Berry | 5 Bat Wings |
| Vampiric Serum | +15% damage, 5% lifesteal 45s | 2 Bloodroot + 2 Healing Herb | 5 Slime Gel |
| Shadow Extract | +20% crit, crits 3x 30s | 3 Shadow Mushroom + 1 Glow Moss | 5 Wisp Dust |
| Harvest Moon Tonic | +30% XP/gold/materials 45s | 2 Glow Moss + 2 Wheat | 5 Spore Dust |
| Frost Elixir | Attacks slow enemies 15% 30s | 3 Frost Berry + 1 Healing Herb | 5 Slime Gel |
| Storm Surge | +30% attack speed, chain sparks 30s | 2 Thunder Turnip + 1 Echo Bloom + 1 Pep Root | 5 Wisp Dust |

**Legendary tonics (T3) — 4-7 crops + 10 materials + 50-75g:**

| Tonic | Effect | Crops | Materials | Gold |
|---|---|---|---|---|
| Rage Infusion | Triple damage 8s | 1 Dragon Fruit + 3 Fire Pepper | 10 Demon Essence | 50g |
| Time Stop Flask | Freeze all enemies 4s | 1 Crystal Bloom + 3 Frost Berry | 10 Wisp Dust | 50g |
| Invincibility Draught | Immune 5s | 1 Ironbark Root + 2 Iron Vine + 1 Wheat | 10 Bone Fragments | 50g |
| Phoenix Draught | Revive at 50% HP once | 1 Life Tree Sapling + 3 Healing Herb | 10 Slime Gel | 75g |
| Void Elixir | All weapon effects doubled 10s | 1 Void Blossom + 2 Shadow Mushroom + 1 Glow Moss | 10 Demon + 5 Wisp | 75g |
| Mega Magnet | Collect all drops on screen | 3 Glow Moss + 2 Wheat + 1 Pep Root | 10 Spore Dust | 30g |

### Training Ground (Stats)

| Tier | Gain | Cap Per Stat | Build Cost |
|---|---|---|---|
| T1 | +3% per round (choose stat) | 15% | 50g + 5 Bone |
| T2 | +3% per round | 30% | 150g + 10 Bone + 5 Bat Wings |
| T3 | +4% per round, level-ups offer 4 cards | 50% | 350g + 1 Golem Core + 10 Demon |

**7 trainable stats:** HP, Power, Speed, Crit, Armor, Fire Rate, **Luck**

Luck shifts card rarity weights:

| Luck | Common | Rare | Epic | Legendary |
|---|---|---|---|---|
| 0% | 60% | 25% | 12% | 3% |
| 15% (T1 cap) | 48% | 30% | 16% | 6% |
| 30% (T2 cap) | 36% | 33% | 21% | 10% |
| 50% (T3 cap) | 20% | 35% | 28% | 17% |

Stat choice happens automatically after each combat round (popup).

### Shrine (Blessings)

| Tier | Shown | Rerolls | Active Slots | Offering Cost | Build Cost |
|---|---|---|---|---|---|
| T1 | Pick from 3 | 0 | 1 | 10 materials + 30g | 80g + 5 Wisp |
| T2 | Pick from 3 | 1 reroll | 2 | 10 materials + 30g | 200g + 10 Wisp + 5 Demon |
| T3 | Pick from 3 | 2 rerolls | 3 | 5 materials + 15g | 450g + 2 Golem Cores |

Can offer any time (economy is the limiter). Can replace active blessings with new offering.

**9 blessings:**

| Blessing | Effect |
|---|---|
| Thorns | Enemies in melee range take 8 dmg/sec |
| Vampirism | 2% lifesteal on all damage |
| Guardian | Shield absorbs first hit each round (20% max HP) |
| Resilience | Damage cap at 12% max HP per hit |
| Swiftness | +12% move speed |
| Fortune | Gold + material drops +30% |
| Wrath | +1% damage per second in combat (stacking, resets each round) |
| Renewal | Regen 1% max HP per second |
| Echo | 10% chance any attack fires twice |

### Barn (Animals)

| Tier | Slots | Build Cost |
|---|---|---|
| T1 | 1 animal | 60g + 5 Slime + 5 Spore |
| T2 | 2 animals | 150g + 10 any material |
| T3 | 3 animals | 300g + 1 Golem Core |

**6 animals with stacking bonuses (multiples of same animal scale super-linearly):**

| Animal | x1 | x2 | x3 |
|---|---|---|---|
| Chickens | 2 seeds/round | 5 seeds | 9 seeds |
| Cows | 5 random materials | 12 materials | 20 materials |
| Pigs | 25g | 60g | 100g |
| Goats | 3 chosen materials | 7 chosen | 12 chosen |
| Bees | 3 Spore Dust | 7 Spore Dust | 12 Spore Dust |
| Dogs | 1 combat companion (~5% DPS) | 2 companions (~15% DPS) | 3 companions (~30% DPS) + stagger |

Dogs are the only animal that enters combat. Pixel-art dogs that auto-attack nearest enemy. Have HP, can be knocked out (respawn next round). In the fight a dog walks and bites in three facings and lies down when knocked out *(art pass)*.

Swappable at a cost (sell for 50% of tier build cost, buy new at full price). Animal prices aren't set; the Barn menu shows 150g each (**proposed**, reading "buy new at full price" as the T2 build cost).

### Arena (Risk/Reward)

| Tier | Mutators | Reward | Build Cost |
|---|---|---|---|
| T1 | 1 mutator | +50% gold and materials | 75g + 5 Demon |
| T2 | Up to 2 | +125% gold and materials | 200g + 10 Demon + 5 Bone |
| T3 | Up to 3 | +225% + guaranteed rare drop | 450g + 2 Golem Cores |

Mutator selection appears on the battle map screen.

**T1 mutators:**

| Mutator | Effect |
|---|---|
| Swarm | +40% enemy spawn rate |
| Haste | Enemies 25% faster |
| Tough Hide | Enemies +30% HP |
| Fog of War | Vision radius -40% |
| No Regen | HP regen disabled |

**T2 mutators (added to pool):**

| Mutator | Effect |
|---|---|
| Berserkers | Enemies +40% damage |
| Shielded | Every 5th enemy gets a one-hit shield |
| Drought | Potions disabled this round |
| Gravity Well | Player speed -20% |
| Thorned | Damage taken applies 3s bleed DOT |

**T3 mutators (added to pool):**

| Mutator | Effect |
|---|---|
| Iron Will | Boss/mini-boss HP doubled |
| Darkness | Screen progressively dims |
| Mirror | Enemies reflect 10% damage back |
| Frenzy | Spawn rate doubles in last 30s |
| Cursed | One random weapon disabled |

---

## Battle Map Screen

Shown before entering combat. Winding path visual showing current 5-round segment.

**Features:**
- Current round number and zone name
- Winding path with completed nodes (lit), current node (highlighted), boss node (glowing)
- Zone-themed visuals that darken with progression
- **Basic enemy preview:** enemy types + mini-boss name + difficulty indicator
- **Boss rounds:** boss name, silhouette, one hint
- **Arena mutators** integrated (if Arena built)
- **Return to Farm** button
- **Fight** button
- Only current 5-round segment visible
- *(art pass)* The map is drawn on the zone's own ground with its obstacles; cleared rounds are green with a check, your hero stands on the next round, and the boss round shows the boss as a silhouette. The side panel shows a danger level (1-5 skulls), the zone's enemy portraits, the two possible mini-bosses (or the boss with its one hint), any Arena mutator, and a one-line tip for the zone.

---

## Screens and HUD *(art pass)*

All menus use one kit: dark wood panels with a light edge, square corners, Press Start 2P at 8/16/24/32/48 px, 16×16 icons at 2×/3×/4× only. Every word on screen is drawn by the game, never painted into art.

- **Title:** the Meadow battle screen dimmed behind a stacked logo ("FIGHT · FARM · GROW"), a menu (New Run, Continue, Options) and the five heroes walking along the bottom. Continue shows where a saved run stopped (saving isn't designed yet).
- **Class select:** five cards with the walking hero, the six base stats as segmented bars with the real numbers, the auto attack and the spacebar ability with its cooldown, and the class strength and weakness in plain words. Pick with ← →, Enter, 1-5 or a click.
- **Combat HUD**, kept to the corners: top left portrait, level, HP and XP; top middle round, zone, timer and the current phase (Opening, Build-up, Swarm, Mini-boss), with the mini-boss or boss bar under it; top right gold, kills and the materials picked up this round; bottom left the two weapon slots with level pips (the second shows LOCKED · AFTER R5 until the round 5 boss falls); bottom middle the spacebar ability with a stepped cooldown (Rogue shows its two charges) and the Q/E/R potion belt. A small toast confirms each material pickup.
- **Level-up:** the fight pauses and dims. Three cards from the 12-card pool (four with Training T3); the frame color is the rarity (wood common, blue rare, purple epic, gold legendary with a slow shine). Each card shows its icon, the bonus, what it does in plain words and your running total; cards your class prefers carry a tag. A level-up burst plays behind the hero first.
- **Pause (ESC):** Resume, Stats, Options, Give Up Run, with what this round has brought so far on one side and your build on the other.
- **Stats (TAB):** in a fight, in pause or while picking a card. Every stat as base, bonus and now; how many of each card you hold (faded until it comes up); weapons and mods, blessings, this round's crop, the potion belt and companions.
- **Round complete:** "Round N clear!", the mini-boss you beat and where you are in the zone; gold picked up, the Arena bonus on its own line, total gold; materials; the mini-boss drop (a guaranteed seed); a fight summary and what's waiting on the farm; one button home.
- **Run over:** the hero's death frames, a red-tinted screen, what beat you with its portrait, and the run's totals. Try Again keeps the hero; New Hero goes to class select; Title. Nothing carries over between runs while meta-progression is undecided.
- **Victory:** after the Void Emperor. Gold confetti over the Void, the hero in a level-up burst with the defeated emperor greyed out, the run's totals and final build.
- **Options:** from the title or pause. Audio sliders (master, music, effects), fullscreen, screen shake, damage numbers, a fewer-flashes switch for the hit flash and boss deaths, and the key list. Gamepad and touch controls are still to be designed.

---

## Enemies (18)

### Scaling Per Round
- HP: +8% per round (compounds)
- Damage: +5% per round
- Speed: +1% per round
- Spawn rate: +3% per round
- Zone transition spike: HP +20%, damage +10%, spawn rate +15%

### Spawn Pattern Per Round
| Phase | Timing | What Happens |
|---|---|---|
| Opening | 0:00-0:30 | Light spawns, 2-3 enemies |
| Build-up | 0:30-1:30 | Steady increasing, new types appear |
| Swarm | 1:30-2:15 | Peak spawn rate, screen fills |
| Mini-boss | 2:15-2:45 | Mini-boss + reduced regular spawns |
| Aftermath | 2:45-3:00 | Spawns stop, clear and collect |

### Enemy Roster By Zone

**Universal (all zones):**
- **Slime** — Low HP, slow, walks toward you. Zone-colored variants.
- **Bat** — Low HP, fast, flies directly at you.

**Meadow (1-5):**
- **Wisp** — Very low HP, fast, weaves side to side.
- **Beetle** — Medium HP, slow, armored front (50% reduced damage from facing direction).

**Forest (6-10):**
- **Shroomling** — Medium HP, poison spore cloud on death (slows + damages).
- **Archer Sprite** — Low HP, slow, stays at range, fires arrows every 2s.
- **Wolf** — Medium HP, fast, charges in a line (telegraphed with growl + flash), stuns on hit.

**Caverns (11-15):**
- **Crystal Golem** — Very high HP, very slow. Shatters into 3 damaging crystal shards on death.
- **Shadow Crawler** — Low HP, fast, invisible until close range (shimmer warning).
- **Healer Moth** — Low HP, doesn't attack, heals nearby enemies 2% HP/sec. Priority target.

**Volcanic (16-20):**
- **Magma Slime** — Medium HP, leaves fire trail as it moves (3s duration).
- **Fire Imp** — Low HP, fast, teleports short distances, throws fireball after each teleport.
- **Lava Brute** — Very high HP, slow, explodes in large AOE fire burst on death (1.5s delay).

**Shadow (21-25):**
- **Wraith** — Medium HP, phases in/out (damageable 75% of time). Deals true damage (ignores armor).
- **Nightmare** — High HP, slow, fear aura reduces your attack speed 15% when in range. Stacks with multiple.
- **Shade Assassin** — Low HP, very fast, spawns behind you, single high-damage strike then retreats.

**Void (26-30):**
- **Void Spawn** — Medium HP, splits on death into 2 Void Fragments (25% HP each, fast), which split into 2 Void Shards each (5% HP, very fast). No split cap, no despawn — shards just have very low HP.
- **Reality Tear** — Stationary rift, spawns enemies every 5s until destroyed. High HP. Priority target.
- **Void Anchor** — Stationary, creates gravity well. Pulls you and enemies toward it. Enemies in well deal +30% damage. You're slowed 25% inside. High HP, must be destroyed.

**Kept from v1 *(art pass)*:**
- **Skeleton** (tanky walker with a bone club) and **Demon** (heavy, rakes with burning claws) are redrawn in the v2 style because the resource table names them as Bone Fragment and Demon Essence sources. They have no zone yet (open question).

**What the art adds to the roster *(art pass)*:**
- Slimes come in six colors, one per zone.
- Every enemy that walks toward you turns (front, back, side); fliers and blobs bob or squash instead. Fliers (bats, wisps, moths, imps, wraiths, the Nightmare, the Tear and the Anchor) cast a smaller shadow.
- Each special has a visible cue: the Wolf's red chevrons along its charge line, the Archer's arrow, the Crystal Golem's three spinning shards, the Shadow Crawler's shimmer while hidden, the Healer Moth's pulse of plus signs, the Magma Slime's flickering trail, the Fire Imp's puff at both ends of a teleport and its fireball, the Lava Brute's red warning ring during its 1.5 s delay, the Nightmare's slowly turning fear ring on the ground, the Shade's crossed red slash on you, and the Anchor's inward spiral.
- Void Spawn split into Void Fragments, which split into Void Shards, each smaller and faster.

### Mini-Bosses (2 per zone, random each round)

| Zone | Mini-Bosses |
|---|---|
| Meadow | Giant Slime (splits into 4), Alpha Bat (spawns bat swarm) |
| Forest | Mushroom King (massive spores + summons), Pack Leader Wolf (howl speeds all enemies) |
| Caverns | Crystal Titan (ground slam spike waves), Moth Queen (heals self + summons moths) |
| Volcanic | Magma Wyrm (sweeping fire breath + lava pools), Inferno Golem (ground pound fire ring) |
| Shadow | Phantom Lord (clones itself, find real one), Nightmare King (fear aura + shade assassins) |
| Void | Void Hydra (3 heads, independent attacks), Reality Breaker (teleports, spawns reality tears) |

### Major Bosses (1 per zone)

| Round | Boss | HP | Key Mechanics |
|---|---|---|---|
| 5 | Meadow Guardian (treant) | 8x | Root slams, beetle swarms, back weak spot |
| 10 | Forest Witch (spider queen) | 15x | Web projectiles (slow), wolf packs, poison rain |
| 15 | Cavern Wyrm (crystal dragon) | 25x | Arena charge, crystal breath cone, golem summons, shard phases |
| 20 | Volcano Lord (lava demon) | 40x | Shrinking arena (lava fill), boulder throws, eruption geysers, imp summons |
| 25 | Shadow Sovereign (cloaked entity) | 60x | Phase in/out, darkness zones, all shadow enemies, clone phase (4 clones) |
| 30 | Void Emperor (final boss) | 100x | Phase 1: void spawns. Phase 2: arena splits into platforms. Phase 3: enrage — everything at once, reality tears, 3-min timer before arena collapses. |

HP multiplier is against base slime HP at that round's scaling.

### Boss signature attacks *(art pass, `art/concepts/bosses.html`)*

Every boss has a 4-frame idle and a 3-frame signature attack with its own effect. Bosses are drawn full size on the heroes' pixel grid (mini-bosses 44-80 px, major bosses 90-112 px).

| Boss | Signature attack |
|---|---|
| Giant Slime | **Bellyflop:** squashes wide, springs up, splats down and flings gel |
| Alpha Bat | **Screech:** a ring of sound rolls out; each ring that reaches you calls more bats |
| Mushroom King | **Spore Storm:** scepter up, the cap bursts, clouds that slow and poison spread around him |
| Pack Leader Wolf | **Howl:** every enemy it reaches speeds up; it also charges (side view while charging) |
| Crystal Titan | **Ground Slam:** both fists down, then rows of crystal spikes run along the slam |
| Moth Queen | **Royal Bloom:** wings flare green, she heals, and Healer Moths appear |
| Magma Wyrm | **Fire Breath:** rears back, then lunges and sweeps fire from its jaw |
| Inferno Golem | **Ground Pound:** a fire ring spreads out; step through it or outrun it |
| Phantom Lord | **Mirror Court:** splits into copies that slide apart; find the real one |
| Nightmare King | **Dread Roar:** while it passes you attack slower |
| Void Hydra | **Triple Strike:** left, middle and right heads lunge one after another, jaws glowing pink |
| Reality Breaker | **Break Step:** shatters into static, snaps back somewhere else, leaving a Reality Tear |
| Meadow Guardian | **Root Slam:** a branch arm crashes down and roots burst out in a line. Its weak spot is a glowing knot on its back (it shows its back view when you are behind it) |
| Forest Witch | **Web and Venom:** throws a web ball that slows, then raises venom orbs for poison rain on marked spots |
| Cavern Wyrm | **Crystal Breath:** rears up on cyan light and breathes a cone of shards; charges in a straight line (side view) |
| Volcano Lord | **Boulder Throw:** hurls a molten boulder, then stomps to set off geysers that bubble before they burst |
| Shadow Sovereign | **Eclipse:** fades into the dark and hurls a darkness orb; inside the darkness you only see a small circle around you |
| Void Emperor | **Collapse:** the core swells and both gauntlets fire a beam; the enrage form turns pink, and in phase 3 the edge of the arena closes in |

---

## Progression Summary

| Phase | Rounds | What's Happening |
|---|---|---|
| Survival | 1-5 | Base attack only early. First building. First weapon at Forge. Scrappy. Round 5 boss = second weapon unlock. |
| Building | 6-10 | Second weapon. T2 buildings starting. Standard crops. Elixirs coming online. Build direction emerging. |
| Specialization | 11-15 | Rare crops. T2-T3 upgrades. Card stacks becoming noticeable. Build identity is clear. |
| Power Spike | 16-20 | T3 buildings. First weapon evolution. Legendary tonics. Farm is a well-oiled machine. |
| Peak | 21-25 | Void plot unlocks. Third T3. Blessings stacked. Card accumulation is dominant. Swarms start melting. |
| Endgame | 26-30 | Full power. Every system converging. Final boss is the ultimate test of everything you built. |

---

## Open questions from the art pass

The art team made these calls so they could draw the screens. Each needs a decision (Joe); until then the build uses the **proposed** answer.
- Collision radii and spawn spacing for every enemy and boss, and whether bosses up to 112 px leave room to dodge on a 427×267 screen (the build starts at 0.35 × sprite width).
- Where the Skeleton and Demon spawn, or whether Bone Fragments and Demon Essence move to other enemies (the build keeps them as late-round spawns in every zone, as v1 did).
- Ground hazard shapes: pond, fallen log, lava pool, ruined arch and void pit.
- XP gem tiers and the gold pile (small for most enemies, medium for tougher ones, big for bosses).
- Shop stock and prices for the seed shop and general store, and what the general store sells.
- Animal prices (the Barn menu shows 150g).
- Whether building a lot is instant or shows a construction stage (the build makes it instant).
- Which four plots are open on day one, and what covers the other 26.
- Rotating 1x2 crops with R, and the Void plot's footprint (drawn 2x2).
- Whether Barn animals need front and back views as they wander.
- Meta-progression: the run-over screen says nothing carries over.
- Saving a run (the title screen has a Continue button).

## Systems Not Yet Designed
- Town shop specifics (stock rotation, pricing): see the proposed shops under Town
- Detailed farm map layout with 30 plots: the Riverside farm is drawn (`art/concepts/farm-hub.html`); plot numbering still to confirm
- Sound/music
- Mobile/touch controls
- Meta-progression between runs (if any)
- Achievement system
- Difficulty modes

## Systems Shelved (Back Pocket)
- NPCs (recruitable, housing, services, passives) — add later if core systems need more depth. The farmer, arena warrior, seed keeper and shopkeeper exist as faces in menus only.
- Crop synergies (adjacent plot bonuses) — add if crop system needs more strategy
- Gem/socket system on Blacksmith NPC — add if weapon customization needs more depth
- Energy system — removed, resources are the natural limiter
