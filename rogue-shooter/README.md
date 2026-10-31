# Rogue Shooter

An isometric rogue-like auto-shooter. Pick a class, collect weapons, evolve them, and survive waves of enemies in an ever-escalating arena.

**Status:** Prototype 1.

## Play it
Open [`builds/rogue-shooter.html`](builds/rogue-shooter.html) in a browser. WASD or arrow keys to move; shooting is automatic.

## What's here
| Folder | Contents |
|---|---|
| `builds/` | Single-file playable build |
| `design/` | Handoff doc |
| `pitch/` | (empty — pitched outside Forge) |
| `deck/` | (empty) |
| `prototype/` | (empty — source is the single-file build) |

## The game
- **5 character classes** with unique stats, bullet visuals and preferred upgrades: Knight, Mage, Rogue, Ranger, Cleric.
- **5 weapons** with infinite scaling: Orbital Blades, Chain Lightning, Fire Trail, Frost Nova, Homing Missiles.
- **Evolution system:** each weapon evolves at LV 5+ when a stat threshold is met (e.g., Orbital → Sawblade Tornado at Speed ≥ 155).
- **Synergy system:** every weapon pair unlocks a passive bonus (10 combos total).
- **Isometric projection** on an HTML5 Canvas with depth sorting.
- **Level-up card draft:** pick one of three cards (stat buffs, weapon upgrades, or evolution cards).
- 5 enemy types plus a boss at wave 10.

Placeholder art drawn in code, not final.

© 2026 justaskjoe. All rights reserved.
