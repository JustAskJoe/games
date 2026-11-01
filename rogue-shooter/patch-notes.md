# Rogue Shooter: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked.

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
