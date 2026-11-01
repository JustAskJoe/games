# One Fifty Labs — Prototype Kit (start here)

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

This is everything reusable from past builds, so each new game or app prototype starts most of the way done.

**Standing rule:** after every prototype or big build, add what's reusable back in here (code, layouts, lessons) and update the matching skill.

## What's in the kit
| Folder | Use it for | Start with |
|---|---|---|
| `prototype-kit/` (`README.md` + `tilebound-v2/`) | Playable turn-based **table or card game** web prototypes: phone-first, bots, story intro, lessons, coach, feedback form | `README.md`, then the `tilebound-v2/` source |
| `prototype-kit/hexed-v1/` | Real-time **grid / match-3 / tile-swap** prototypes: pure engine that emits animation frames, swipe input, specials and combos, blockers, goals, level map, coach with guided hints, tarot card CSS, balance sim | `hexed-v1/README.md`, then `engine.js` |
| `prototype-kit/neon-surf-v1/` | Real-time **rhythm / beat-timed** prototypes: audio-clock song time, WebAudio placeholder beat synth, beat-grid chart, timing windows, tap-along calibration, two-thumb steer + tap input, canvas renderer, bot timing sim | `neon-surf-v1/README.md`, then `engine.js` |
| `prototype-kit/tower-defense-p1/` | Real-time **tower defense / lane defense** prototypes: fixed-tick engine (20/s), a path that grows in stages, towers with two upgrade branches, enemy types with counters, wave table with preview, roguelite card draft, bot sim with three player styles, canvas renderer with ink-and-wash vector art, build/upgrade sheet, coach tied to the wave preview. Since 1.1: one `act()` action path + `hash()` checksum, tester tools, placeholder music, and a co-op room server (`tower-defense/server/`) | `tower-defense-p1/README.md`, then `engine.js` |
| `prototype-kit/decks/` | **Pitch decks** as Slides artifacts: outline, 17 layouts, Python generator, local render check | `deck-outline.md`, `layouts.md`, `gen_deck.py` |
| `cardgen/` | **Card universes** for any game with collectible cards: a seeded generator (factions, eras, sets, printings, pack odds, sealed, prices over a run, repacks, reprint twists) driven by a JSON profile, plus an offline Workshop tool page | `cardgen/PROFILE.md`, then `cardgen/tool.html` |
| `prototype-kit/art/` | **AI mood art**: Canva prompt recipe, full-resolution fetch, contact-sheet review, art reuse list | `art/README.md` |
| `prototype-kit/snippets/` | Pieces pulled from other projects (see below) | each file's header comment |

The source of record for Tower Defense now lives in the public GitHub repo `JustAskJoe/games` (`tower-defense/`); the kit copy is for starting the next game.

## Snippets (from other prototypes)
| File | From | What it gives you |
|---|---|---|
| `snippets/idle-engine-model.js` | Idle Hands / Automation Idler plan | Idle and automation engine model: run log as the source of truth, buildings and automations, currencies, streaks, broken states, tiers, upgrades, AI cost budget, number formatting. Tier and cost numbers are placeholders |
| `snippets/idle-slide-templates.html` | Idle Hands decks | Loop, currency and architecture slide layouts |
| `snippets/beat-sync.css` | Pure Water storyboard | Tempo-synced pulse, scale and beat-lane animation from one `--bpm` setting; turns off for reduced motion |
| `snippets/storyboard-layout.html` | Pure Water storyboard | Sketch-panel grid; 16:9 key frame with caption columns and HUD chips |
| `snippets/dashboard-screens.html` | Slab Syndicate GUI | Tabbed app header, KPI tiles, kanban stage columns, predicted-vs-actual grid, profit table |
| `snippets/phone-app-shell.html` | Corazon Pool v2 | Phone app UI: status hero, stat tiles, presets, grouped rows, stepper, segmented control, checklist, CSS bar chart |
| `snippets/brand-board.html` | PC Remote branding | Brand board: swatches labelled by role, icon tested at 220, 60 and 32px |
| `snippets/artboard-template.dc.html` | Design canvases | Skeleton for one screen of a design canvas |
| `hexed-v1/art.js` → `tcard()` + `emblem()` | Hexed | CSS tarot card (front, back, flip) and 20+ original ink emblems for Major Arcana and a few minors |
| `neon-surf-v1/ui.js` → `SND`, `songAt`, `startClock`, calibration | Neon Surf | Drop-in WebAudio drum/bass/lead synth, lookahead scheduler, heard-time clock from `getOutputTimestamp`, 16-click tap calibration |
| `tower-defense/prototype/music.js` | Tower Defense 1.1 | Cozy folk placeholder score: lute arpeggios + recorder tune (build mood), frame-drum pulse (wave mood), stingers for clear/grow/won/lost/leak, ♪ toggle. Swap `PROG`, `TUNE`, `BPM` for a new game |
| `tower-defense/server/room.js` | Tower Defense 1.1 | **Real-time co-op base:** host-authoritative intent log + `Replica` (client copy that queues actions until its local wave ends) + per-wave hash checkpoints. Use it for any deterministic game where players don't act during the action phase. For turn-based tables use Trickbound's server instead |
| `tower-defense-p1/art.js` | Tower Defense | Canvas ink-and-wash drawing helpers (`poly`, `rect`, `circ` with ink strokes), ground tiles, a keep, four tower designs with tier marks, five enemy walks with hp bars, a coach face |

## Lessons that apply everywhere
- **Phone first:** a 390×844 frame, 44px touch targets, safe-area insets, nothing overflowing at 320px, and wide tables scrolling inside their own box.
- Respect `prefers-reduced-motion`.
- Hand-hold newcomers with literal "tap this, then this" steps.
- Prefer interactive turns to passive ones.
- **Ownership notice** on everything: "© 2026 F Lane d/b/a One Fifty Labs. All rights reserved." Track which assets AI made, for Steam's AI disclosure. (In the public games repo, drop "Confidential".)
- **Pitch decks** need an art section of 7 or more slides. Put sources in the speaker notes.
- **Images:** an artifact's `/_blob/` images only load inside that artifact. Re-upload them, or copy them with `from_url` and `asset_ids`.
- **Runtime capabilities** (db, user, real-time rooms) have barely been used so far. Tilebound's, Hexed's, Neon Surf's and Tower Defense's feedback forms are the only db uses. Always build a fallback for viewers who can't write. Tower Defense's form also posts to the site's `/forge/api/feedback` when it runs on onefiftylabs.co.
- **Keep engines pure and testable:** a seeded RNG, no DOM, runnable headless in node. For idle games, the log is the truth and the visuals are drawn from it, so web, Steam and XR builds share the logic.
- **For animated games, have the engine return snapshot frames** keyed by stable piece ids, and let the UI just play them (Hexed). The sim and the UI then share one code path.
- **A real-time canvas game runs on a fixed tick** (`step()` 20/s, accumulated from `requestAnimationFrame`); the UI only draws (Tower Defense). The sim and the game are then identical, and lockstep co-op is possible later.
- **Run the balance sim before building UI.** In Hexed it caught three broken levels (a snowballing hazard, a too-hard blocker level, an unwinnable drop-item level) in minutes.
- **Tune the right knob.** Tower Defense's first sim said "too hard" (towers too weak), then "too easy" even at 5× enemy HP. The real levers were build-spot count (17 → 10) and enemy speed, not HP. Target: a smart bot wins 50–70%, a sloppy one 25–35%, deaths spread across the back half of the run.
- **Tie the coach to the preview.** One hint at a time, built from the next wave's composition ("Flyers are coming: Spark or Arrows"). It teaches counters without a tutorial.
- **Rhythm games: judge on the audio clock, never on frame time.** Convert each input's `event.timeStamp` to song time, subtract a per-device calibration offset, and ship an Easy timing toggle. Sim bots with timing spread (25/55/90 ms) and a late-bias bot show whether windows are fair.
- **Never bundle licensed music.** Use an original placeholder beat at the real song's BPM.
- **Canvas text needs a font fallback** (`"Space Grotesk", system-ui, sans-serif`) or it renders serif before the webfont loads.
- **Theme mechanics from the source material's real meaning** (tarot card meanings → level twists). It reads as authentic to fans.
- **Testers need an "unlock everything" toggle** in the menu so they can jump to later content. Tower Defense's version (Menu → Tester tools) lets the smart bot play the earlier waves, so the jump lands on a fair board, not an empty one. It also flags the run (`G.test.used`) so tester runs stay out of balance notes.
- **Route every player action through one `act(G, intent)` function** from day one. Then replays (seed + intent log), bots, tester tools and multiplayer all reuse it, and multiplayer becomes "send the intents over a socket". Add a cheap `hash(G)` so two copies can prove they still match.
- **For real-time co-op where players don't act mid-round, don't stream positions.** Sync the ordered intent log; every client runs the deterministic engine itself, and the server checks a hash after each round (Tower Defense `server/`).
- **One build-and-test command per game** (build + sim with a pass band + server tests + phone test) is what lets a second person push safely.
