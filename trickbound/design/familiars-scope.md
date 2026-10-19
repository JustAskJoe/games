# Trickbound — familiars as the collection (scope + F1 status)

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

Decision (F, 2026-10-16): familiars change gameplay, and the collection *is* the familiars. Classic table stays pure Spades as its own mode.
Decisions on the open questions (F went with the recommendations): loadout = 1 familiar each; loadouts visible before the deal; growth unlocks the next critter in the line; the AI partner brings its own familiar.

## F1 status — built and published 2026-10-16
Same link as the table: https://claude.ai/artifact/PoYLQFuZ2hyHwy78kEbM73 (version 2). Source in `prototype-kit/trickbound-v1/`.
- Engine hooks: `FAMILIARS` module (`canUse / apply / botUse`), `G.known` per-seat knowledge, `G.spark` lead permission, Badger in `settle`, `useFamiliar`, `botFamiliar`, `simFamiliars`.
- Familiars live: Owlet Peek, Salamander Spark, Koi Rethink, Badger Guard.
- Bots: use all four; bots also exploit Owlet info (lead low into a suit where partner holds the boss; don't overtake when partner has it covered).
- Loadouts: you pick one; partner by persona (Dee Salamander, Books Owlet, Sarge Badger, Jo Koi); Ray Salamander, Nita Badger.
- UI: "Familiar table" door, familiar pick screen, badges on every seat (✓ when used), Peek prompt, Rethink prompt after trick 1, Spark button on your lead, "You saw: …" under the partner seat, announcements in the log and bubbles, Badger line in hand-end notes, familiar question in feedback.
- Balance (`node sim.js 1500 23 --familiars`, 1,500 games each, win-rate delta for the team with it): Owlet +1.3 (bots only partly use the info; humans should get more), Salamander +1.6, Koi +4.3, Badger +4.9. Target band was +2..+6 for young familiars.

## The core idea
Every critter on the cards is a familiar you can collect. The deck already sorts critters into four tiers per family:
- 2–5 **young** · 6–10 **grown** · J/Q/K **court** · A **legend**

4 families × 4 tiers = **16 familiars** for the full set. Collecting a critter unlocks its familiar; the cards with that critter get its art in your deck. So the binder and the loadout are the same thing.

## Rules of the familiar table
- **Loadout:** one familiar each, shown by every seat before the deal. House teams bring theirs.
- **Once per hand** per familiar, unless the card says otherwise.
- **Announced when used.** The table sees the familiar fire.
- **Power bands by tier.** Young = small nudge, grown = real swing, court = strong, legend = once per *game* signature move.
- **Clubs cap tiers** (Back Porch: young only; the Hall: anything).

## Family identities (what kind of rule each bends)
| Family | Suit | Theme | Bends |
|---|---|---|---|
| Dusk | ♠ | night, knowing things | information, trump |
| Ember | ♥ | hearth, heat | winning tricks, rank |
| Tide | ♦ | pond, flow | moving cards, bids |
| Grove | ♣ | garden, shelter | defense, bags, nil |

## Starter roster (8, 2 per family; ✓ = in F1)
| Familiar | Tier | Ability | When |
|---|---|---|---|
| ✓ Owlet · Peek | Dusk young | See 2 random cards in your partner's hand. | after bids |
| Raven · Count | Dusk grown | Learn how many spades each opponent holds. | after bids |
| ✓ Salamander · Spark | Ember young | Lead a spade before spades are broken. | your lead |
| Kilnback · Flare | Ember grown | One card you play counts one rank higher this trick. | on play |
| ✓ Koi · Rethink | Tide young | After trick 1, change your bid by 1 (not to or from nil). | after trick 1 |
| Frog · Hop | Tide grown | Swap one card face-down with your partner. | after bids |
| ✓ Badger · Guard | Grove young | Up to 2 overtricks this hand aren't bags. | scoring |
| Mouse · Burrow | Grove grown | Once, play off-suit even when you could follow. | on play |

Legend sketches (later): Dusk **Midnight** — name a suit; it's trump instead of spades for one trick. Grove **Sanctuary** — your failed nil scores 0 instead of −100. Ember **Bonfire** — win a trick you lost. Tide **Undertow** — reverse play order for one trick.

## Engine notes
- `legalPlays` honors `G.spark`; `settle` applies Badger; Koi edits `p.bid`; Owlet writes `G.known[seat]`.
- Next hooks needed for F2: `beats` modifier (Flare), follow-suit override (Burrow), card swap (Hop), spade-count reveal (Count).
- Bots fire familiars at phase boundaries in `playHandBots` and the UI's `familiarPhase`.

## Balance method
- `simFamiliars`: baseline vs team-with-familiar, both sides, 1,500 games.
- Target: young/grown +2..+6, never above +8; court +5..+10; legends measured per game.
- Also watch for dead familiars (Koi was negative before its retune: a +1 bid is worth little, a −1 that avoids a set is worth a lot, so the bot now mostly uses it downward).

## Collecting loop (F3)
- Start by picking 2 young familiars (replaces the single pick).
- **Earn:** beat a club's house team → pick 1 of 3 critters from that club's family. No random packs.
- **Grow:** using a familiar in a hand you win fills its bar; full bar unlocks the next tier (Owlet → Raven → court → legend).
- **Binder:** 16 slots, art per tier, usage stats. Saved per player in the page's db (`data/users/<id>`).

## Build phases
| Phase | What | Status |
|---|---|---|
| F1 | Hook framework, 4 familiars, bots use them, loadout = 1, sim balance, UI | **done** |
| F2 | Raven, Kilnback, Frog, Mouse (the rule-benders), house teams with signature familiars, tier caps per club | next |
| F3 | Collecting: starter pick of 2, binder, growth, club rewards, per-player save | |
| F4 | Courts and legends, partner duo moves tied to bond | |

## Risks
- Complexity for newcomers → tier caps, teach one familiar at a time (Learn path already uses familiars).
- Purists → Classic stays a full mode.
- Bot quality → flag button; Owlet is the weakest for bots.
- Multiplayer info leaks later → per-seat `G.known` already in place.
- Power creep → sim gate on every new familiar.
