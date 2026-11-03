"""Render the 12 mini-bosses and 6 major bosses, export sprite sheets, and build the boss page.

Outputs (paths relative to the rogue-shooter folder):
  art/sprites/bosses/<boss>.png          one row per view (front; side or back where a boss has one); columns idle 1-4, then attack 1-3
  art/sprites/bosses/<boss>_<effect>.png effect or projectile frames in one row
  art/sprites/bosses/bosses.json         frame sizes, timings, tier, attack name and effects
  art/concepts/bosses.html               animated boss page, grouped by zone
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ekit
import bosses_mini, bosses_major  # noqa: F401  (registers the bosses)
import boss_views  # noqa: F401  (side views for the chargers, the Guardian's back)
from build_bestiary import build, ROOT

ZONES = [
    ('meadow', 'Meadow · rounds 1–5', 'Mini-bosses: Giant Slime and Alpha Bat. Round 5: the Meadow Guardian.'),
    ('forest', 'Forest · rounds 6–10', 'Mini-bosses: Mushroom King and Pack Leader Wolf. Round 10: the Forest Witch.'),
    ('caverns', 'Caverns · rounds 11–15', 'Mini-bosses: Crystal Titan and Moth Queen. Round 15: the Cavern Wyrm.'),
    ('volcanic', 'Volcanic · rounds 16–20', 'Mini-bosses: Magma Wyrm and Inferno Golem. Round 20: the Volcano Lord.'),
    ('shadow', 'Shadow · rounds 21–25', 'Mini-bosses: Phantom Lord and Nightmare King. Round 25: the Shadow Sovereign.'),
    ('void', 'Void · rounds 26–30', 'Mini-bosses: Void Hydra and Reality Breaker. Round 30: the Void Emperor.'),
]
LEDE = ("Every mini-boss and major boss in the hero style, facing the camera, with an idle loop and its signature attack. "
        "The two chargers (Pack Leader Wolf, Cavern Wyrm) also have a side view, and the Meadow Guardian a back view showing its weak spot. "
        "They are drawn full-size on the same pixel grid as the heroes (mini-bosses about 2× a normal enemy, major bosses about 3× a hero), "
        "so nothing is blown up. Effects and projectiles are separate strips. Shown at 3×, the size they appear in the game.")

def main():
    keys = [k for k, e in ekit.ENEMIES.items() if e.get('tier')]
    keys.sort(key=lambda k: (0 if ekit.ENEMIES[k]['tier'] == 'major' else 1))
    build(keys=keys, spr=os.path.join(ROOT, 'art', 'sprites', 'bosses'), rel='art/sprites/bosses', json_name='bosses.json', html='bosses.html',
          zones=ZONES, title='Rogue Shooter Bosses', eyebrow='Rogue Shooter v2 · Bosses · 12 mini-bosses, 6 major bosses',
          h1='Every boss, zone by zone', lede=LEDE, foot='Sprite sheets and bosses.json in art/sprites/bosses.')

if __name__ == '__main__':
    main()
