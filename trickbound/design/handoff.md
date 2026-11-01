# Trickbound — handoff (Spades spin-off of Tilebound)

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

## What it is
Trickbound (working title; no conflicting game found) is a cozy Spades adventure split off from Tilebound, the mahjong game. The mahjong base felt passive in playtest ("not very reactive"). Spades gives every trick a reaction, makes the bid a promise, and puts a partner across the table.

## Decision: Spades+ (collector route with modifiers)
F is leaning toward Spades+, a collectible set of modifiers on top of real Spades, over pure Spades. He expects balancing to be hard but the game to be more engaging. The Classic table, with no modifiers, stays for purists. Proposed guardrails:
- **Same 52-card deck and real rules underneath.** Modifiers are once-per-hand nudges (peek, swap, re-bid). They never add cards or change rank.
- **Symmetric:** opponents bring familiars too.
- **Sidegrades, not upgrades:** collecting unlocks new choices and new art, never a stronger version of the same charm, and never pay-to-win.
- **Balance with the bots:** run headless simulations of thousands of hands per familiar, and flag any that shift win rate by more than a few points.
- **Start with 5 familiars,** then add more based on what testers actually pick.

## Pitch deck (done, 23 slides)
https://claude.ai/artifact/GGqdLbfDThpFt3PNaua7ji

- **Section 1, the idea:** cover, hook, why, market, gap
- **Section 2, play:** rules, deck, familiars, partner, adventure, teach
- **Section 3, art (8 slides):** pillars, hand, anatomy, court, dusk, families, club, world
- **Section 4, business:** proof, business, roadmap, ask
- **Style:**
  - Palette: plum #2A2030, cream #F6EEDF, gold #E8B86A, ember #B5482F, tide #2F6E80, grove #557A45, dusk #3B3F7A
  - Fonts: Fraunces and Nunito Sans
  - Ownership notice on every slide

## Design so far
- **The deck:** a standard 52-card deck; each suit is a critter family.
  - ♥ Ember, ♦ Tide, ♣ Grove (reused from Tilebound)
  - ♠ Dusk, the trump suit: owlet, raven, moth-fox
- **Ranks:**
  - 2–5 are young critters, 6–10 are grown.
  - J, Q and K are the court: badger knight, heron queen, stag king.
  - The Ace is each family's legend.
- **Familiars:** each player brings one charm, used once per hand. All are drafts.
  - Owlet Peek: see a card in your partner's hand.
  - Raven Pass: swap one card with your partner.
  - Koi Rethink: change your bid by 1.
  - Badger Guard: one overtrick doesn't count as a bag.
  - Salamander Spark: lead a spade before spades are broken.
  - The Classic table has no familiars.
- **AI partner:** has a personality, a bond meter that unlocks duo moves, and table talk.
- **Island clubs:** each club has a real-variant house rule: Blind Nil, Jokers, Mirror, Suicide.
- **Business:** free first club, $9.99 unlock, cosmetics only.

## Market facts (sourced)
- Spades was invented in Cincinnati in 1937–39, spread by WWII soldiers, then by the GI Bill to colleges (Wikipedia).
- It's a cookout staple in Black American family life (Baltimore Banner column).
- Spades Plus has 30M+ lifetime downloads and became a Detroit Pistons partner in January 2026 (Zynga press release).
- Spades Plus is rated 4.7★ with 10M+ installs on Google Play.
- A May 2023 Statista survey named Spades with Blackjack as top picks after Solitaire.

## Decision: places are isometric dioramas (art direction B, #21)
Hunter picked **B: isometric diorama** for the town and the station interior on Oct 31, 2026 (PR #30). Prototype v1 now draws Cinder Hollow and the night-train car as three-quarter isometric scenes in `prototype/v1/world.js`; the walk grid, collision and script are unchanged underneath. The depot screen's header for Cinder Hollow is the waiting-hall card room drawn the same way. Both places have two states: **Arrival** (one lamp of two working) and **Lamp-lit** (after the back room is won). Everything is code-drawn concept art until final art is approved; `art/art-direction.md` is still a draft.

## Art (AI mood reference)
New Canva media IDs:
- Card hand: MAHYMHx42ek
- Dusk family: MAHYMBHel9c
- Court cards: MAHYMDQsTOk
- Card club: MAHYMGtNjP8

The club image includes stray sign text. The island map still has Tilebound's pagoda towns. To get these at full resolution, see `prototype-kit/art/README.md`.

## Open questions from F (start the new chat here)
1. He wants a prototype web app he can test with **4 people**. What's the workload?
2. **He also wants to test with bots:** him plus 3 bots (an AI partner and 2 opponents). He says he plays Spades at a pretty high level, so the bots need to be strong enough to judge the game. Start with this version, because it's mostly the existing kit (single player with bots). Plan to:
   - add a strong-bot setting
   - run a headless bot simulation to check the bidding and nil logic
   - show the partner's reasoning
3. **Bots need personalities and skill levels.** F's view is that Spades takes intuition and knowing your partner. Design:
   - **Skill levels** (e.g. Rookie, Regular, Shark): bid accuracy, card counting, and signal reading.
   - **Personalities** that change how a bot bids and plays, not just its table talk. For example: the Gambler bids nil often and overbids; the Rock bids safe and sets opponents; the Talker trash-talks and is a little reckless; the Professor counts every card.
   - **Partner reads:** the AI partner should learn your tendencies over a session (overbidding, nil habits) and adjust. That's the "knowing your partner" part, and it fits the bond meter in the pitch.
   - Make each bot's personality readable at the table, so F can judge whether the bots feel like real people.
4. How should we think about the art and approach for this one? Who plays Spades most? Do some things need rethinking?

## How to build it
Use the `game-prototype-webapp` skill and the project's `prototype-kit/`. Start from `prototype-kit/INDEX.md`.

## Reusable from Tilebound
- Web app: https://claude.ai/artifact/QDwXdDshHqFgJwBrpZ13wX. It includes:
  - the four-seat table UI
  - the story intro and lessons
  - the coach
  - the db feedback form
- Playtest Feedback doc: https://claude.ai/code/artifact/eddccd56-7b60-4e7e-83be-5caa1cfe5103
