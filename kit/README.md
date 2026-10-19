# One Fifty Labs — Game Prototype Kit

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

> **Where things live in this repo.** These docs were written in the project's `prototype-kit/` folder. Here, `prototype-kit/` is this `kit/` folder, and each game's source moved into its own folder: `prototype-kit/tilebound-v2/` → [`tilebound/prototype/v2/`](../tilebound/prototype/v2/), `hexed-v1/` → [`hexed/prototype/v1/`](../hexed/prototype/v1/), `neon-surf-v1/` → [`neon-surf/prototype/v1/`](../neon-surf/prototype/v1/), `trickbound-v1/` → [`trickbound/prototype/v1/`](../trickbound/prototype/v1/), `tower-defense-p1/` → [`tower-defense/prototype/`](../tower-defense/prototype/). Start with [`INDEX.md`](INDEX.md).

This is how we build a playable, phone-first web prototype of a turn-based table game in about a day, then hand it to real people and collect their feedback. It's distilled from the Tilebound v2 prototype, an American-mahjong critter adventure: https://claude.ai/artifact/QDwXdDshHqFgJwBrpZ13wX.

The full working source is saved next to this file in `prototype-kit/tilebound-v2/`. Start from it. Don't start from a blank page.

## What carries over to any new game
| Piece | Where in Tilebound v2 | Reuse as-is? |
|---|---|---|
| Phone-first dark "parlor" shell: CSS tokens, safe areas, bottom-sheet modals, buttons, chips | `head.html` | Yes. Swap the palette and fonts |
| Page skeleton: header, seats, center "pond", my area, prompt bar, side panel, owner mark | `body.html` | Yes. Rename the regions |
| Cinematic intro: full-bleed art scenes, Ken Burns drift, rise-in text, dots, Skip | `story.js` → `SCENES`, `showIntro`, `goScene` | Yes. New art and copy |
| "Doors" screen: Learn / Game mode / Classic | `story.js` → `doors()` | Yes. New copy |
| Starter pick ("pick your critter or deck") | `story.js` → `starterScreen()` | Pattern yes; content per game |
| Scripted lessons: one highlighted thing to tap, wrong-tap shake, success burst | `story.js` → `startLesson`, `renderLesson`, `act`, `wrong`, `burst`, `advance` | Pattern yes; steps per game |
| **Async turn loop**: `await ask(prompt)` turns the whole hand into a straight-line async function | `ui.js` → `ask`, `answer`, `overlayWait`, `playHand`, `playMatch` | **Yes. The most valuable pattern** |
| Coach and helpers toggles: hint button, auto-selected suggestion, coach line | `ui.js` → `coachLine`, `ui.coach`, `ui.helpers`, hint acts | Pattern yes |
| Menu: How to play, replay intro, new game, fast mode, toggles | `ui.js` → `menuHTML`, click handler | Yes |
| Feedback form: tap answers plus notes, saved to the artifact db, "Copy answers" fallback | `ui.js` → `FQ`, `feedbackHTML`, `sendFeedback` | Yes. Rewrite `FQ` |
| Headless bot simulation, to check that the rules actually work | `engine.js` → `simulate`; `ui.js` → `simHTML`/`runSim`; `sim.js` in node | Pattern yes; engine per game |
| Build: concatenate the parts into one HTML file | `build()` in `build-and-test.py` | Yes |
| Automated phone playthrough plus screenshots | `build-and-test.py` (Playwright, 390×844) | Yes. Update the selectors |

These parts are game-specific and get rewritten each time:
- `engine.js`: rules, the deal, bots, scoring, and the target list (the mahjong "card").
- Tile rendering in `ui.js`: `tile()`, `tileParts()`, the pond and the rack.

## Architecture
- **Engine (`window.TB`):** pure functions with no DOM.
  - A seeded RNG makes every match replayable.
  - It provides `newMatch(seed, personas)`, `deal`, the bot decision functions, `settle`, and `simulate(n, seed, opts)`.
  - It also runs in node through `module.exports`, so `node sim.js 600` can balance the rules before any UI exists.
- **UI (`window.TBUI`):**
  - One `ui` state object and one `render()` that redraws every region.
  - One delegated click handler reads the `data-act` / `data-key` attributes.
  - Game flow is `async playHand()`. Each human decision is `const v = await ask({kind:'discard'})`. A button click calls `answer(v)`, which resolves the promise. Bots just call engine functions with a small delay. Modals between hands use `await overlayWait('handEnd', data)`.
- **Story (`window.TBStory`):** owns the `#story` full-screen layer (intro, doors, starter pick, lessons). It hands off to the table with `TBUI.start({mode, coach, helpers, starter})`.
- **Ship it as one HTML artifact,** with images in `img/` published as artifact `files`. Declare capabilities `{"db":{},"user":{}}` so the feedback form can write to the `feedback` collection, and read the results back with ArtifactData.

## Build order that worked (about a day)
1. **Rules engine plus a headless sim.** Run hundreds of bot games and tune them until the stall/draw rate and the spread of winning hands look healthy. In Tilebound, the first card stalled 52% of the time; loosening it got that to about 25%.
2. **The table** with Classic rules, bots and the async loop. Phone viewport first.
3. **Helpers and coach.** Show the newcomer the next step and a suggested move.
4. **Story layer:** intro scenes that show the art off, doors, the starter pick, and 3–5 tiny lessons that say "tap this, then this".
5. **Feedback form** at the end of a match, plus the db capability.
6. **Run `build-and-test.py`.** It walks the whole phone flow with no JS errors and no horizontal scroll, and takes screenshots for a quick look.
7. **Publish,** share the link, then read the `feedback` collection with ArtifactData.

## Lessons from playtests (apply by default)
- **Hand-hold hard.** The first tester didn't know mahjong. Lessons need literal "play this, then this" steps, and the coach stays on until it's switched off.
- **Never hide what you're aiming for.** An always-visible goal or target panel beats a hidden menu.
- **Interactivity matters more than depth.** Mahjong felt passive ("just drawing"). Pick base games where each turn answers what someone else just did. This is why Trickbound moved to Spades.
- **The coach shouldn't steer newcomers into passive lines.** Tilebound's coach picked concealed hands, which can't call discards. Prefer choices that keep the player interacting.
- **Say what the game is in the first 20 seconds,** with art, then let people skip.

## Gotchas
- Add `<meta charset="utf-8">`, or curly quotes turn to mojibake over file://.
- The fixed corner owner mark can overlap bottom nav. Give the story nav extra bottom padding.
- Guard renders against "no current player" at the start of a deal (the v1 crash `name(-1)`).
- Use `env(safe-area-inset-*)` everywhere for the iPhone notch and home bar. Keep a `prefers-reduced-motion` fallback.
- Use `localStorage` only for small conveniences such as fast mode, and wrap it in try/catch.
- Public-link viewers can't write to the db, so the feedback form falls back to "Copy answers".

## House rules for every build
- Ownership notice in the footer and a fixed corner mark: "© 2026 F Lane d/b/a One Fifty Labs · All rights reserved".
- Label AI art as "AI mood reference, not final art".
- Phone first (iPhone 390×844), then a desktop layout at 900px or wider.
- Never reproduce someone else's rule card or IP. Original content only.

## Before building multiplayer (real people at one table)
The kit is single-player with bots. For several humans at one table, check the `artifact-capabilities` skill's live roster first for shared state between viewers (db, or a real-time room if one is offered). Design the engine so that "a seat" can be a bot, a local human, or a remote human behind the same `ask()` interface. Then the async loop doesn't change, only where the answer comes from.
