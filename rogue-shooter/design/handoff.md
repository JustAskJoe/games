# Rogue Shooter: handoff

© 2026 justaskjoe. All rights reserved.

The one page to read before touching this game.

**Team:** Joe, with Claude.
**Status (Oct 31, 2026):** Prototype 1 playable, solo, desktop only.

## The game in one line
An isometric rogue-like auto-shooter where you pick a class, collect and evolve weapons, unlock synergies, and survive 10 waves plus a boss.

## Architecture
Single HTML file, pure Canvas + vanilla JS. No libraries, no build step.

- **Isometric projection:** `toScreen(wx,wy) = {x: wx-wy, y: (wx+wy)*0.5}`, inverse `toWorld(sx,sy) = {x: sx*0.5+sy, y: -sx*0.5+sy}`.
- **Depth sorting** by `entity.x + entity.y`.
- **State machine:** `start | playing | levelup | stats | dead | won`.
- **Lateral movement boost:** `1.4×` on all directions so the player doesn't feel slow on the iso grid.
- **Google Fonts:** Orbitron (headings), Rajdhani (body/HUD).

## Systems

### Characters (5)
Knight, Mage, Rogue, Ranger, Cleric. Each has base HP, speed, damage, crit, armor, bullet count, fire rate, plus a preferred weapon and preferred buff list. Outfit colors and bullet visuals are class-specific.

### Weapons (5)
Orbital Blades, Chain Lightning, Fire Trail, Frost Nova, Homing Missiles. Two-weapon cap; levels scale infinitely past LV 3 via `getWpnCfg()`.

### Evolutions
Each weapon has a legendary evolution at LV 5+ gated by a stat threshold:
| Weapon | Evolution | Stat gate |
|---|---|---|
| Orbital | Sawblade Tornado | Speed ≥ 155 |
| Lightning | Judgement | Crit ≥ 20% |
| Fire Trail | Hellfire | Damage ≥ 30 |
| Frost Nova | Absolute Zero | Armor ≥ 30% |
| Homing | Missile Barrage | Multishot ≥ 3 |

### Synergies
All 10 weapon pairs have a passive bonus (stat multipliers + behavioral flags like "slow on hit" or "fire patch on impact"). Applied in `getWpnCfg()` and checked in each weapon's update function.

### Enemies (5 + boss)
Slime (basic), Bat (fast), Skeleton (tanky), Demon (ranged), Boss (wave 10 only). All drawn with multi-stop gradients, rim lights and animated details.

## What's built
Everything above, in `builds/rogue-shooter.html`.

## What's not built
- Mobile/touch controls
- Sound/music
- Lab integration or feedback form
- Multiple arenas or biome variety
- Meta-progression between runs
