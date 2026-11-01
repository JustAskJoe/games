# Rogue Shooter: handoff

© 2026 justaskjoe. All rights reserved.

The one page to read before touching this game.

**Team:** Joe, with Claude.
**Status (Nov 1, 2026):** Prototype 1 with Stardew-style pixel art, solo, desktop only.

## The game in one line
An isometric rogue-like auto-shooter where you pick a class, collect and evolve weapons, unlock synergies, and survive 10 waves plus a boss.

## Architecture
Single HTML file, pure Canvas + vanilla JS. No libraries, no build step.

- **Isometric projection:** `toScreen(wx,wy) = {x: wx-wy, y: (wx+wy)*0.5}`, inverse `toWorld(sx,sy) = {x: sx*0.5+sy, y: -sx*0.5+sy}`.
- **Depth sorting** by `entity.x + entity.y`.
- **State machine:** `start | playing | levelup | stats | dead | won`.
- **Menus:** class select uses keyboard (←/→, Enter, 1-5) or click; level-up uses 1/2/3 or ←/→ + Enter, with a 0.35 s input guard after the cards appear. The class-select previews are drawn with the in-game `renderSprite()`, so `buildCharSelect()` runs after `SPR` is defined, at the bottom of the script.
- **Sprites:** each class has its own sprite set (`SPR.hero[id]` with `idle`, `w1`, `w2`) and palette (`HERO_PAL`); enemies use `MON_PAL`. Hit-flash builds an all-white palette from any palette (`whiteOf`). The art sheet is `art/concepts/sketches.html`.
- **Lateral movement boost:** `1.4×` on all directions so the player doesn't feel slow on the iso grid.
- **Google Fonts:** Press Start 2P (headings/HUD), Rajdhani (body).
- **Pixel art system:** sprites defined as comma-separated string rows, palette-mapped and rendered to offscreen canvases via `renderSprite()`. Cached by data+palette+scale key. `stamp()` draws them centered at a world position with optional horizontal flip. `tileHash()` gives deterministic per-tile decoration.
- **Canvas config:** `imageSmoothingEnabled=false` + CSS `image-rendering: pixelated` for crisp pixel art.

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

### Enemies (7 + mini-boss + boss)
Slime (basic; ember/frost/venom colors after 1:00, cosmetic), Bat (fast), Wisp (fast, weaves; from 0:45), Shroomling (spore cloud on death slows the player 40%; from 1:00), Skeleton (tanky), Demon (heavy), Moss Golem (mini-boss every 25 s from 1:50 to 2:50), Demon King boss (spawns at 3:00). All pixel-art sprites with simple animation (slime squash, bat wings, hops and bobs). Hit-flash uses an all-white palette.

## What's built
Everything above, in `builds/rogue-shooter.html`.

## What's not built
- Mobile/touch controls
- Sound/music
- Lab integration or feedback form
- Multiple arenas or biome variety
- Meta-progression between runs
