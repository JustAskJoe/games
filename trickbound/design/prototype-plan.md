# Trickbound: Books on the Line — prototype plan

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

## Status (2026-10-16, evening)
- **Leg 1 (the Pits) published** at the same link, version 4: https://claude.ai/artifact/PoYLQFuZ2hyHwy78kEbM73 — private; share from the page's menu. Source in `prototype-kit/trickbound-v1/` (`line.js` replaced `story.js`).
- **Crew deck:** Trickbound: Books on the Line, 10 slides (Slides artifact). Deck changes queued for after real in-game art exists: every role is AI-assisted production; an isometric depot mockup on the proof slide; a richer "what you can pull" cards slide (→ 12 slides).
- **Multiplayer base** saved under `prototype-kit/trickbound-v1/server/` (room.js, server.js, tests, README). Tests pass: bots-only, one human through intents (illegal plays rejected, no hand leaks), and a two-client WebSocket smoke run.
- Full world/design scope: `trickbound/v3-scope.md`. Familiar design: `trickbound/familiars-scope.md`.

## What Leg 1 has
- Intro (depot, lantern critters, the Long Table) → the conversation car (Dee) → wake two critters → Cinder Hollow.
- **Train map** of the Pits: Cinder Hollow (short shift), Lamplight (going dark), Copperbank (the long night), Ironmere (junction bracket of three tables: Hal & June, Tasha & Marcus with the miner's count, the Foreman & Tally going dark). Unlock chain, Millrace shown as the next leg.
- **Depot screen:** back room (house team, rule, stake), the counter (Pits pack 15–20 marks, Moonstone, deck builder), quest board, regulars.
- **Packs:** 5 cards, tap-to-flip, rarities (common/uncommon/rare/lamp-lit/misprint at Copperbank), duplicates auto-sold for marks.
- **Deck builder:** 52 slots, tap to cycle owned versions (base, Pits etched tin, lamp-lit shimmer, misprint, promos). Your versions show in your hand at the table.
- **Critter voices** replace the coach/hint: off / quiet / full; the brought critter speaks, other woken critters chime in and disagree in full mode. Placeholder lines per familiar.
- **Quests:** Birdie (make a nil → Koi), Abe (no-bag night → Moonstone), Wick (set the house twice → Frog). **Hidden:** Mouse (a hand where every book you took was won by a 2–5). **Promos:** Going Dark Deuce, Full Shift Ace, Brakeman's Deuce; Ironmere Lantern Ace with the badge.
- **Marks:** start 30; win a night +2× stake, lose −stake; Ironmere entry 30, purse 60.
- **Scenes:** after each first town win; Dee's departure after the Ironmere badge; Marcus becomes your partner. Tasha signs with the Stationmaster.
- **Seated view** mock toggle (bigger faces, darker table). Classic "the old way" still available.
- Engine: nil night, going dark, feat tracking, the Line cast. Sims: nil night ~4 hands/night (brutal, intended), going dark ~5.

## Known gaps
- Voices are placeholder writing; growth pacing (2 nights) and marks economy untested with a real player.
- Raven still weak for bots. Court and legend familiars absent. Jokers (Conductor & Brakeman) not in the engine yet.
- The Pits all use the same depot art; Lamplight and Copperbank need their own rooms.
- Lessons were dropped in favor of Dee's scene + full voices; a "Learn" path should return for newcomers.
- Multiplayer client wiring not done: the server exists, the phone still plays locally.

## Next
1. F plays Leg 1 and flags. Good/bad/ugly at this milestone.
2. Deck to 12 slides with in-game art (see Status).
3. Leg 2 (the River Reach) or multiplayer client wiring, whichever the playtest says.

## Model note
Fable 5.1 for bot/familiar/server logic; Opus 5.5 for screens and docs.
