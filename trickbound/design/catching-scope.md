# Trickbound: Books on the Line — Catching scope (Leg 1)

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
Status: agreed with F, 2026-10-16. Next build. Model: Fable 5.1 (engine abilities, catch odds, sim balance).

## The idea in one line
Everyone on the Line plays Books (Gwent-style). Every crew you meet carries a sleeping critter, and you wake it by playing well. Waking is a chance, never a sure thing, so there's always a reason to play one more pickup game.

## Decisions (from the Q&A)
| Question | Decision |
|---|---|
| Pickup game length | Short game, first to 100 (~2–3 hands, ~5 min) |
| Do IVs (temperament) change power? | Yes, a small real effect. Worth hunting, still fair for multiplayer later |
| Failed catch | It can show up again. Only one-time story critters are gone if missed |
| Leg 1 roster | 24 critters, 6 per town (8 existing + 16 new) |

## How it works
**Pickup crews.** Each town has 2–3 crews you can challenge outside the back room: the shift crew at the slag heap, kids on the platform, two old men on a bench, the press workers on break. Their faces rotate each visit. Games run to 100 for a small stake (5 marks). The back room stays the "gym" that moves the story.

**Encounters.** Each crew brings one sleeping critter drawn from that town's pool (and that crew's own pool). You see it on the table before you sit down, as a silhouette and name if seen before, or "???" if not.

**The liking meter.** Each critter likes 2–3 things. During the game, doing them fills its meter:
- a made nil, setting the house, a book won with the 2♠, an exact bid
- a hand won by 50+, taking the last book, a hand with no bags, going dark and making it
These are shown on screen, so you play differently to chase them.

**The roll.** At the end of the game you roll to wake it:
- base 15% plus half the meter, capped at 75%
- win the game: full odds; lose: half odds
- lanterns add more: tin +10, brass +20, lamp-glass +35. Hard cap 90%. Never 100%.
- A miss sends the critter back into the town's pool. Story critters don't come back.

**Seen vs woken.** The binder works like a Pokédex: 24 slots, each with a silhouette, a town hint and "seen" or "woken." The holes are the point.

**Lamp-lit (shiny).** About 1 in 200 encounters is lamp-lit: it glows, has a different voice tag, and the binder slot gets a gold edge. Cosmetic only.

**Temperament (IVs).** Each woken critter rolls three hidden traits, 0–15:
- **Nerve:** ability strength. At 12+ the "sharp" version applies (for example, Owlet peeks at 3 cards instead of 2, Badger guards 3 bags).
- **Patience:** growth speed (2 instead of 3 winning-hand uses to grow).
- **Spark:** lure. While this critter rides with you, encounters of its family get +5 meter at the start.
Shown as rough words ("steady nerve," "all spark"), not numbers, until a Lamplight regular can read them.

**Nature.** One of six (Gruff, Wry, Tender, Anxious, Proud, Dreamy). It changes how the critter's voice talks at the table. This ties straight into the Disco Elysium voices.

## The roster (24)
Families: Dusk ♠ · Ember ♥ · Tide ♦ · Grove ♣. Tiers: young (once a hand) · grown (once a night) · rare. ★ = existing.

### Cinder Hollow · coal, stoves, soot
| Critter | Family / tier | Ability | Likes |
|---|---|---|---|
| ★ Owlet | Dusk young | Peek: see 2 cards in partner's hand | exact bid, made nil |
| ★ Salamander | Ember young | Spark: lead a spade before broken | set the house, spade led early |
| ★ Koi | Tide young | Rethink: ±1 bid after trick 1 | exact bid, no-bag hand |
| ★ Badger | Grove young | Guard: 2 overtricks aren't bags | no-bag hand, win by 50+ |
| Sootling | Dusk young | Smudge: see 1 card of left opponent | take the last book, made nil |
| Cinderwick (town rare) | Ember rare | Banked coal: exact bid +20 | exact bid twice in a game |

### Lamplight · moths, glass, going dark
| Critter | Family / tier | Ability | Likes |
|---|---|---|---|
| Mothling | Dusk young | Flutter: learn if partner holds A♠ or K♠ | going dark, made nil |
| Glowworm | Tide grown | Glow: see 1 card from each opponent | take the last book, exact bid |
| Lampfox | Ember grown | Kindle: one non-spade counts 2 ranks higher | win by 50+, set the house |
| Wickbat | Dusk grown | Echo: learn partner's spade count before bidding | exact bid, no-bag hand |
| Hare | Grove young | Nerve: nil missed by 1 book costs half | made nil, going dark |
| Moonmoth (story, one-time) | Dusk rare | Nightglass: see partner's whole hand, once a night | going dark and making it |

### Copperbank · the press, beetles, misprints
| Critter | Family / tier | Ability | Likes |
|---|---|---|---|
| ★ Frog | Tide grown | Hop: swap a card face-down with partner | set the house twice |
| ★ Mouse | Grove grown | Burrow: play off-suit once | books won with 2–5 (hidden) |
| Coppermite | Grove young | Ledger: exact bid +10 | exact bid, no-bag hand |
| Pressbeetle | Ember young | Dent: one card counts 1 rank lower (ducking, nil cover) | made nil, partner's nil covered |
| Inkeel | Tide grown | Undertow: swap a card face-down with right opponent | set the house, deuce book |
| Misprint (town rare) | ? rare | Typo: change any one bid by 1 after trick 1, once a night | only from misprint packs or a misprint feat |

### Ironmere · the rail yard, crows, brass
| Critter | Family / tier | Ability | Likes |
|---|---|---|---|
| ★ Raven | Dusk grown | Count: opponents' spade counts before bidding | set the house, take the last book |
| ★ Kilnback | Ember grown | Flare: one card counts 1 rank higher | win by 50+ (badge reward stays) |
| Yardcrow | Dusk young | Caw: after trick 1, learn left opponent's voids | take the last book, set the house |
| Railhound | Grove grown | Couple: partner's nil missed by 1 costs half | partner's nil covered, no-bag hand |
| Switchback | Tide grown | Switch: ±1 bid any time before trick 5, once a night | exact bid, win by 50+ |
| Stationcat (story, one-time) | Grove rare | Nine lives: set by exactly 1 counts as made, once a night | only at bracket table three, first clear |

Growth lines stay as now (Owlet→Raven, Salamander→Kilnback, Koi→Frog, Badger→Mouse). New lines can come later.

## Balance targets (sim)
Win-rate delta vs no critter, from the existing `simFamiliars` harness:
- young +1 to +5
- grown +3 to +8
- rare up to +9
Temperament's "sharp" versions add no more than +2 on top. Re-run the sim for every new ability.

## Build order (one build, Fable)
1. Engine: the 16 new abilities as hooks (most are variants of the existing 8), with sharp versions; add to the sim.
2. Encounter system: town and crew pools, rarity weights, the liking meter, the roll, lanterns, temperament, nature, lamp-lit odds.
3. Pickup crews on the depot screen (menu for now; they move into the walkable depot next).
4. Table UI: the sleeping critter on the table, its likes, a meter that fills, the wake roll at the end.
5. Binder: 24 slots, seen/woken, silhouettes, town hints, temperament words, lamp-lit edge.
6. Counter sells lanterns; packs can contain them.
7. Remove auto-given critters (quests give lanterns or rare encounters instead). Starters stay.
8. Tests: catch odds math, a Playwright walk of a pickup game end to end, the sim.

## After this (not now)
Walkable depot with crews standing around in it → story pass on Leg 1 → more towns, multiplayer, real art.
