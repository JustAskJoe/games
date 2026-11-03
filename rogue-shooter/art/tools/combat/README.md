# Combat art scripts

© 2026 justaskjoe. All rights reserved.

Weapon effects, pickups, shared combat effects, hero hurt and death frames, and the dog companion, drawn with the hero toolkit (`../heroes/spritekit.py`) and the enemy helpers (`../enemies/ekit.py`).

- `weapons.py`: all five weapons and their ten evolutions (`WEAPONS`), in the weapon colors from `design/art-direction.md`.
- `fx.py`: gold coin and pile, three XP gem sizes, material drops (from the material icons), enemy spawn, death poof, boss death, hit and crit sparks, heal, level-up burst, dash dust, hero hurt frames for every class and facing, the death sequence, and the dog (walk, bite, knocked out; three facings).
- `build_combat.py`: writes one strip per animation to `art/sprites/combat/` (frame size, count and timing in `combat.json`) and builds `art/concepts/combat.html` with `../gallery.py`.

Run `python3 build_combat.py` from this folder with Python 3, Pillow and NumPy. Strips are one row, left to right; projectiles point right and are rotated to aim.
