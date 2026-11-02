# Wormsbound: handoff

© 2026 justaskjoe. All rights reserved.

The one page to read before touching this game: what's decided, what's built, and what's next. The approved brief is in [`../pitch/brief.md`](../pitch/brief.md). This doc is the working version and wins if the two disagree.

**Team:** Louiemark (direction, design, art direction), with Claude (code). Hours a week: not set yet.
**Status (Nov 2, 2026):** Prototype 1 engine and bot sim built and passing. No screens yet.

## The game in one line
A turn-based artillery brawler for 2 to 4 friends on one screen: aim, read the wind, and lob shells across ground that blows apart. The twist is **live duds**: shells that land without exploding keep ticking, and anyone close enough can lob them on.

## Decisions
| Topic | Decision | Who, when |
|---|---|---|
| Prototype 1 tech | The studio's web kit (one-file browser build, pure engine + bot sim), not Godot yet. Godot stays the open question for the Steam version. | Louiemark, Nov 2 |
| Prototype 1 scope | From the brief (B3): 1 map, 2 teams of 2, 3 weapons (shell, cluster, live dud), wind, local hotseat. No online, no bots in the UI yet. | Brief, Nov 2 |
| Platform for P1 | Desktop browser first (shared keyboard and mouse), landscape. A phone should still load it without errors. | Brief (P2) |
| Turn | Walk up to 14 steps, pick a weapon, then fire, lob a live dud, or pass. New wind every turn. | Claude's first pass; Louiemark to confirm |
| Live duds | Fuse of 3 turns, ticking once at the end of every turn (yours included). Lob range 5 cells; a lob tops out at 65% of full power and keeps the fuse. A blast next to a dud sets it off (chain reaction). | Claude's first pass; Louiemark to confirm |
| Ending | Last team standing wins the round. From turn 24 the water rises 2 rows a turn, so every match ends. Hard cap at 80 turns (never reached in the sim). | Claude's first pass; Louiemark to confirm |
| Best-of-3, rematch, turn timer | UI work, next pull request. The engine's `pass` intent is what a timer sends. | Brief (T12) |

### The numbers (top of `prototype/engine.js`)
| What | Value |
|---|---|
| Map | 160 × 90 cells (8 px each on a 1280 × 720 stage), water at row 82 |
| Gravity, top launch speed | 30 cells/s², 60 cells/s (full-power range about 120 cells) |
| Wind | −7 to +7 cells/s² sideways, new each turn |
| Units | 100 hp, radius 1.5 cells, climb 2 cells, fall damage over 22 cells/s |
| Shell | unlimited · crater 4 · 45 damage at the centre |
| Cluster | 2 a match · crater 2.5 · 20 damage, then 5 bomblets (crater 2.5 · 18) |
| Live dud | 2 a match · crater 6 · 60 damage · fuse 3 turns |
| Damage falloff | linear to 0 at 1.6 × the crater radius; knockback up to 26 cells/s |

## Balance (bot sim, `node prototype/sim.js 200`, Nov 2, 2026)
Four bots: **smart** (good aim, uses everything), **sloppy** (few tries, shaky hands), **nodud** (smart but never touches duds, to measure what duds are worth) and **duder** (smart, dud-happy, to check duds don't take over). Seats swap every other match.

| Pairing | Result | Median match |
|---|---|---|
| smart vs smart | 50 / 50; the team that goes first wins 56% | 14 turns |
| smart vs sloppy | smart wins 81% | 17 turns |
| smart vs nodud | smart wins 54% | 14 turns |
| duder vs smart | duder wins 56% | 14 turns |

800 matches, none stuck, no timeouts. Sudden death (rising water) is reached in 13–27% of matches.

**Pass band (proposed, Louiemark to confirm):** checked by `build-and-test.py`. Every match finishes; smart beats sloppy 70–90%; going first wins 40–62% of mirror matches; median match 10–24 turns; smart beats nodud 48%+; duder beats smart 65% at most.

**What the numbers say:**
- **Live duds are a small edge, not yet the star.** Using them is worth about 4 points of win rate, and a dud gets lobbed only 0.3 times a match. With a 3-turn fuse, the target usually walks away. Levers to try: fuse 2, a bigger lob range, or duds that always go off on the turn they're lobbed.
- **Going first is worth about 6 points.** That's normal for the genre. If people feel it, options are a smaller first shot, or alternating who starts each round of a best-of-3 (planned anyway).
- **Matches run 9–28 turns** (p10–p90): about 5–10 minutes at 20–30 seconds a turn, as the brief wants.

## Next, in order
1. **The local hotseat screen** (Prototype 1 UI): canvas renderer for the terrain and units, drag-to-aim with angle and power, wind arrow, weapon wheel, the live-dud countdown, turn timer (sends `pass`), win screen and one-button rematch, best-of-3. Then `build.py`, `builds/wormsbound.html`, a Playwright test and a `games.json` build entry so it plays in the Lab.
2. **Playtest** with friends. Pass bar (brief): everyone asks for a rematch without being prompted.
3. **A Lead Artist plan** (`art/lead-plan.md`) before any art is generated. Studio rule.
4. **The crew deck** from the brief (patch notes item), with screenshots from the prototype.

## Open questions
- **The name.** "Wormsbound" joins two other studios' game names (Worms, GunBound). Fine as a folder name; pick an original title before anything goes outside the crew. The Forge answer had "Crater Club" (a 2015 student game is called "Crater Kings").
- **Engine for Steam:** keep the web build (wrap with Electron or Tauri) or rebuild in Godot? Decide before Prototype 2.
- **Price model:** the brief says free-to-play with cosmetic purchases; the studio's other games are premium. The crew will want to talk about it.
- **Units per team and the 3–4 player setup** (2v2 teams or free-for-all).
