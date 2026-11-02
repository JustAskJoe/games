# Wormsbound: handoff

© 2026 justaskjoe. All rights reserved.

The one page to read before touching this game: what's decided, what's built, and what's next. The approved brief is in [`../pitch/brief.md`](../pitch/brief.md). This doc is the working version and wins if the two disagree.

**Team:** Louiemark (direction, design, art direction), with Claude (code). Hours a week: not set yet.
**Status (Nov 2, 2026):** Prototype 1 playable as a local hotseat (`builds/wormsbound.html`) with five characters to pick from. Bot-tested and checked in a headless browser; nobody has played it yet.

## The game in one line
A turn-based artillery brawler for 2 to 4 friends on one screen: pick a character, aim, read the wind, and lob shells across ground that blows apart. The twist is **live duds**: shells that land without exploding keep ticking, and anyone close enough can lob them on.

## Decisions
| Topic | Decision | Who, when |
|---|---|---|
| Prototype 1 tech | The studio's web kit (one-file browser build, pure engine + bot sim), not Godot yet. Godot stays the open question for the Steam version. | Louiemark, Nov 2 |
| Prototype 1 scope | From the brief (B3): 1 map, 2 teams of 2, wind, local hotseat. No online, no bots in the UI yet. The brief's 3 weapons became each character's Shot 1, Shot 2 and the Live dud. | Brief, Nov 2 |
| Characters | Each team picks one of five before the match (both units are that character); both teams may pick the same one. Each has its own health, armour, walking and two shots, plus the Live dud. The idea of characters with their own shots comes from GunBound; ours are original (names, looks, shots). | Louiemark, Nov 2 |
| Platform for P1 | Desktop browser first (shared keyboard and mouse), landscape. A phone should still load it without errors. | Brief (P2) |
| Turn | Walk up to 14 steps, pick a weapon, then fire, lob a live dud, or pass. New wind every turn. | Claude's first pass; Louiemark to confirm |
| Live duds | Fuse of 3 turns, ticking once at the end of every turn (yours included). Lob range 5 cells; a lob tops out at 65% of full power and keeps the fuse. A blast next to a dud sets it off (chain reaction). | Claude's first pass; Louiemark to confirm |
| Ending | Last team standing wins the round. From turn 24 the water rises 2 rows a turn, so every match ends. Hard cap at 80 turns (never reached in the sim). | Claude's first pass; Louiemark to confirm |
| Best-of-3, rematch, turn timer | Built: best of three with the first turn alternating each round, one-button rematch (R), a 30-second timer that sends `pass` (can be switched off in the menu). | Brief (T12); Louiemark, Nov 2 |
| Teams | Ember Crew (orange: Rook, Blaze) and Tide Crew (teal: Pip, Marlo). Placeholder names. | Claude's first pass |
| Controls | Drag back from your unit and let go (slingshot), plus keys: ◀ ▶ walk, ▲ ▼ angle, Q/E power, 1 2 3 weapons, L lob, Space fire, X skip, Esc menu. The aim preview shows the start of the arc without wind. | Claude's first pass; Louiemark to confirm |
| Screen | One 1280×720 stage that scales to fit; the whole map is always on screen (no following camera yet). | Claude's first pass |

### The characters (`CHARS` in `prototype/engine.js`)
| Character | Role | Health | Armour | Steps (climb) | Shot 1 (unlimited) | Shot 2 (2 a match) |
|---|---|---|---|---|---|---|
| **Brick** | Tank | 115 | takes 15% less | 10 (2) | Slug: crater 3.5, 42 dmg, wind ×0.45 | Wrecking Ball: bounces once, crater 5, 56 dmg, wind ×0.45 |
| **Zip** | Scout | 105 | – | 22 (3) | Dart: crater 3, 44 dmg, 15% faster, wind ×0.8 | Double Tap: two darts (38 dmg each), the second ⅓ s later |
| **Volt** | All-rounder | 100 | – | 14 (2) | Arc Ball: crater 3.2, 44 dmg | Thunderstrike: crater 3, 26 dmg, then lightning hits everyone within 2.2 cells sideways for 34, cover or not |
| **Digger** | Miner | 110 | takes 5% less | 12 (2) | Pick Shell: crater 4, 40 dmg | Drill: bores on for 14 cells after it first touches ground, then crater 4, 48 dmg |
| **Gale** | Wind-rider | 95 | – | 16 (2) | Kite Bomb: crater 4, 42 dmg, wind ×1.7 | Gust Bomb: crater 4.5, 24 dmg, knockback ×2.6, wind ×1.7 |

All five also carry 2 Live duds (crater 6, 60 dmg, fuse 3 turns).

### The numbers (top of `prototype/engine.js`)
| What | Value |
|---|---|
| Map | 160 × 90 cells (8 px each on a 1280 × 720 stage), water at row 82 |
| Gravity, top launch speed | 30 cells/s², 60 cells/s (full-power range about 120 cells) |
| Wind | −7 to +7 cells/s² sideways, new each turn |
| Units | radius 1.5 cells, fall damage over 22 cells/s; health, armour, steps and climb come from the character |
| Live dud | 2 a match · crater 6 · 60 damage · fuse 3 turns |
| Damage falloff | linear to 0 at 1.6 × the crater radius; knockback up to 26 cells/s |

## Balance (bot sim, `node prototype/sim.js 200`, Nov 2, 2026, with characters)
Four bots: **smart** (good aim, uses everything), **sloppy** (few tries, shaky hands), **nodud** (smart but never touches duds, to measure what duds are worth) and **duder** (smart, dud-happy, to check duds don't take over). Seats swap every other match.

The first four lines are Volt vs Volt:

| Pairing | Result | Median match |
|---|---|---|
| smart vs smart | 50 / 50; the team that goes first wins 57% | 15 turns |
| smart vs sloppy | smart wins 84% | 17 turns |
| smart vs nodud | smart wins 69% | 15 turns |
| duder vs smart | duder wins 55% | 14 turns |

**Characters** (round-robin, 100 smart-vs-smart matches per pair, seats swapped): Brick 58% · Zip 44% · Volt 44% · Digger 51% · Gale 51%. Head to head, Brick beats Zip 66% and Volt 67%; every other pairing is 42–52%.

1,800 matches, none stuck, no timeouts. Sudden death (rising water) is reached in 18–30% of matches.

**Pass band (proposed, Louiemark to confirm):** checked by `build-and-test.py`. Every match finishes; smart beats sloppy 70–90%; going first wins 40–62% of mirror matches; median match 10–24 turns; smart beats nodud 48%+; duder beats smart 65% at most; every character wins 40–60% of the round-robin (full run only).

**What the numbers say:**
- **Live duds matter more now.** Before the characters, using them was worth about 4 points; now (Volt vs Volt) it's about 19, because Volt's Shot 2 is a weaker pick than the old Cluster, so bots fire more duds. Lobs are still rare (0.5 a match).
- **Characters were tuned by the sim** (Nov 2): Brick started at 66% and Zip at 22%. Brick lost health and armour (130 → 115, −20% → −15%); Zip got more health and bigger darts. The bots never walk, so Zip's long walk and Brick's short one aren't measured at all: expect Zip to play stronger and Brick weaker with people.
- **Going first is worth about 6 points.** That's normal for the genre. If people feel it, options are a smaller first shot, or alternating who starts each round of a best-of-3 (planned anyway).
- **Matches run 9–28 turns** (p10–p90): about 5–10 minutes at 20–30 seconds a turn, as the brief wants.

## Next, in order
1. **Playtest** the hotseat with friends. Pass bar (brief): everyone asks for a rematch without being prompted. Answers go in through the feedback form after a match.
2. **Tune from what people do:** the live-dud numbers first (see Balance).
3. **A Lead Artist plan** (`art/lead-plan.md`) before any art is generated. Studio rule.
4. **The crew deck** from the brief (patch notes item), with screenshots from the prototype.

## Open questions
- **The name.** "Wormsbound" joins two other studios' game names (Worms, GunBound). Fine as a folder name; pick an original title before anything goes outside the crew. The Forge answer had "Crater Club" (a 2015 student game is called "Crater Kings").
- **Engine for Steam:** keep the web build (wrap with Electron or Tauri) or rebuild in Godot? Decide before Prototype 2.
- **Price model:** the brief says free-to-play with cosmetic purchases; the studio's other games are premium. The crew will want to talk about it.
- **Units per team and the 3–4 player setup** (2v2 teams or free-for-all).
