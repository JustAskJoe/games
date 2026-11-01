# Rogue Shooter: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked.

---

## P1-art · Nov 1, 2026 · Joe (with Claude)
Stardew Valley pixel art upgrade — complete visual overhaul.

### What's new
- **Pixel art sprite system:** all sprites defined as string grids with palette mapping, rendered to offscreen canvases and cached. `renderSprite()`, `stamp()`, `tileHash()` for deterministic ground detail.
- **Warm earthy palette:** neon dark theme replaced with Stardew-inspired colors — parchment, wood, gold, earthy greens. CSS variables updated across all UI.
- **Press Start 2P pixel font** replaces Orbitron for headings and HUD.
- **Player:** 3-frame pixel sprite (idle, walk1, walk2) with per-class outfit palettes, facing flip, and bob animation.
- **Enemies:** pixel art slime (squish), bat (wing flap), skeleton (sway), demon, and boss. Hit-flash turns sprites white. Shadow ellipses under all entities.
- **Ground:** isometric grass tiles in varying greens with flowers, dark grass tufts, and pebbles. Replaces the dark grid.
- **Bullets:** pixel-snapped rectangles per class (knight bar, mage square, marksman line+dot, rogue rotated bar, witch large square).
- **Weapon VFX:** pixel-style fire patches (nested rects), frost rings (stroked arcs), orbital crosses (rotated fillRects), pixel-snapped lightning, rotated homing missiles.
- **XP orbs:** pixel gem with pulse glow.
- **UI:** wood-panel borders, warm brown overlays, square border-radius (4px), earthy card styling.
- **Canvas:** `imageSmoothingEnabled=false` + CSS `image-rendering: pixelated`.

### Next up
- [ ] @Joe: playtest all 5 classes with the new art. Check readability of sprites and effects.
- [ ] Consider sound effects and music.
- [ ] Polish: particle effects, death animations, screen transitions.

### Watch out
- [ ] Pixel sprites are small at default scale (PX=2). May need tuning on high-DPI or large monitors.
- [ ] All game logic is unchanged — balance items from P1 still apply.
- [ ] Tested only on desktop Chrome. Mobile touch input still not implemented.
- [ ] Sprite strings are hand-authored — complex shapes (boss, demon) have limited detail at this resolution.

---

## P1 · Oct 31, 2026 · Joe (with Claude)
First playable build.

### What's new
- **Prototype 1 is playable:** isometric auto-shooter with 5 classes, 5 weapons, 10 waves and a boss.
- **Evolution system:** weapons evolve at LV 5+ when a stat threshold is met. Each evolution has a legendary card with unique visuals and bonuses.
- **Synergy system:** all 10 weapon-pair combos grant a passive bonus with a notification banner.
- **3D-style character and enemy art:** chibi girl player, slimes, bats, skeletons, demons, and a winged boss, all drawn with gradients, rim lights and detail.
- **Infinite weapon scaling** past LV 3 with per-weapon formulas.
- **Weighted card selection** with 3× weight for class-preferred buffs and weapons.
- **Google Fonts:** Orbitron (display) + Rajdhani (body).

### Next up
- [ ] @Joe: play a full run with each class and check balance. Pass bar: every class can beat the boss.
- [ ] Decide commit, change or shelve after playtest.
- [ ] Consider sound effects and music.

### Watch out
- [ ] Tested only on desktop Chrome. Mobile touch input is not implemented — WASD/arrow keys only.
- [ ] Balance is hand-tuned, not simmed. Some weapon/class combos may be much stronger than others.
- [ ] No feedback form or Lab integration yet.
- [ ] `ctx.roundRect()` was removed for compatibility; arm shapes use `ctx.rect()` instead.
