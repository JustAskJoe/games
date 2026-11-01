# Rogue Shooter: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked.

---

## P1.1 · Nov 1, 2026 · Joe (with Claude)
New hero and monster sprites from the sketches, three new monsters, and new class-select and level-up menus.

### What's new
- **Class select:** each class card shows its pixel sprite on a patch of grass (the picked one walks), four stat bars (HP, power, speed, range, scaled against the other classes) and its two favored weapons. Pick with ← → (or A/D), Enter or Space to start, or 1-5 to jump straight in. Click still starts a run.
- **Level-up cards:** number badges with 1/2/3 hotkeys, ← → plus Enter, a **NEW** tag on weapons you don't have yet and "LV 1 → 2" on upgrades. Cards slide in, and clicks and keys are ignored for the first 0.35 s so a held key or stray click can't pick a card by accident.
- **New heroes:** every class has its own sprite now: the Knight's helm and shield, the Mage's hat and orb staff, the Marksman's hood and crossbow, the Rogue's mask and daggers, the Witch's hat and broom. Each has idle and two walk frames.
- **Redrawn enemies:** outlined slime (with a squash frame), bat (wings up and down), skeleton with a bone club (faces you), winged demon, and the crowned Demon King.
- **New monsters:**
  - **Wisp** (from 0:45): fast and frail, weaves side to side.
  - **Shroomling** (from 1:00): leaves a spore cloud when it dies; standing in it slows you by 40% for its 3 s.
  - **Moss Golem** (1:50 to 2:50): a slow mini-boss every 25 s, 22× slime HP, drops 4 XP orbs.
- **Slime colors:** after 1:00, most slimes come in ember, frost or venom. Cosmetic only.
- **Art sheet:** `art/concepts/sketches.html` shows every sprite at 4x and game size.

### Next up
- [ ] @Joe: playtest a full run with each class and the new monsters; check the sprites read mid-fight.
- [ ] Give the slime colors a gameplay meaning (for example ember burns, frost slows) or leave them cosmetic.

### Watch out
- [ ] Menus were checked in headless Chrome at 1280×800 and 400 px wide only. Not checked in a real desktop browser or by a player.
- [ ] Google Fonts didn't load in the test browser, so the screenshots used fallback fonts. Spacing may shift slightly with Press Start 2P loaded.
- [ ] The stat bars are relative to the five classes; a new class with bigger numbers will rescale every bar.
- [x] The README listed the classes as Knight, Mage, Rogue, Ranger, Cleric; the build has Knight, Mage, Marksman, Rogue, Witch. (Fixed by Joe with Claude, Nov 1.)
- [ ] The handoff's one-liner still says "10 waves plus a boss"; in the code the boss spawns at 3:00 of game time and there are no numbered waves. (README fixed.)
- [ ] The heroes are now 20×22 px (drawn at 40×44) against the old 10×14; the player hit radius (14) wasn't changed, so hits may feel a little generous. Enemy radii weren't changed either.
- [ ] New-monster numbers (HP, speed, spawn mix, golem timing) are first guesses, checked only in a sped-up headless run.
- [ ] No sketch has a Lead Artist plan (`art/lead-plan.md`) or `art-direction.md` yet; the art team doc expects one before concepts become finals.

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
