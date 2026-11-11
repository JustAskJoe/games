"""Builds art/concepts/combat.html and the sprite strips in art/sprites/combat/.

python3 build_combat.py   (run from this folder)
Each strip is one row of equal-size frames, left to right; combat.json lists frame size, count and timing.
"""
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
import weapons as W, fx
from gallery import build, strip

ART = os.path.normpath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ART, 'sprites', 'combat'); os.makedirs(OUT, exist_ok=True)
GRASS = '#5ea23c'; DARK = '#33402a'
manifest = {}

def hstack(fs):
    from PIL import Image
    o = Image.new('RGBA', (sum(f.width for f in fs), max(f.height for f in fs)), (0, 0, 0, 0)); x = 0
    for f in fs: o.alpha_composite(f, (x, 0)); x += f.width
    return o

def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def item(name, frames, ms=120, note='', **kw):
    s, w, h = strip(frames)
    key = slug(name); s.save(os.path.join(OUT, key + '.png'))
    msl = ms if isinstance(ms, list) else [ms] * len(frames)
    manifest[key] = {'name': name, 'w': w, 'h': h, 'frames': len(frames), 'ms': msl}
    d = {'name': name, 'note': note, 'frames': frames, 'ms': ms}; d.update(kw); return d

secs = []
for wname, color, items in W.WEAPONS:
    its = []
    for i, (n, fn, note, ms) in enumerate(items):
        fr = fn()
        its.append(item(n, fr, ms, note, wide=fr[0].width > 70, bg=DARK if 'Lightning' in wname or 'Missile' in wname else GRASS))
    secs.append({'id': slug(wname), 'title': f'{wname} · {color}',
                 'blurb': 'Base weapon first, then its evolutions. Drawn on the same 3x grid as the heroes; glows are hard steps, never soft blurs.', 'items': its})

pk = [item('Gold coin', fx.coin_spin(), 110, 'Spins while it lies on the ground; magnet range pulls it in.'),
      item('Gold pile', fx.gold_pile(), 300, 'A bigger drop for elites and bosses.')]
for n, fr in fx.xp_gems(): pk.append(item(n, fr, 160, {'Small XP gem': 'Most enemies.', 'XP gem': 'Elites and tougher zone enemies.', 'Big XP gem': 'Bosses.'}[n]))
for n, fr in fx.material_drops(): pk.append(item(n + ' drop', fr, 160, 'Bobs on the ground; uses the material icon.' + (' The core pulses so it stands out.' if n == 'Golem Core' else ''), bg=GRASS))
secs.append({'id': 'pickups', 'title': 'Pickups · gold, XP and materials', 'blurb': 'Everything an enemy can drop. Each pickup sits on a small blue-tinted shadow so it reads on every biome.', 'items': pk})

ef = [item('Enemy spawn', fx.spawn(), [120, 120, 110, 110, 160], 'A rune ring opens and the enemy rises out of void smoke. Gives the player a beat to react.'),
      item('Death poof', fx.death_poof(), 80, 'Normal enemies. Short, so big waves stay readable.'),
      item('Boss death', fx.boss_death(), [90, 90, 120, 120, 140, 200], 'Mini and major bosses: white flash, then gold rings.', wide=True),
      item('Hit spark', fx.hit_spark(), 50, 'Every hit that lands.'),
      item('Crit spark', fx.hit_spark(True), 60, 'Critical hits: bigger, gold.'),
      item('Heal', fx.heal_sparkle(), 120, 'Health potions, Shrine blessings and lifesteal.'),
      item('Level-up burst', fx.level_up(), [80, 80, 100, 120, 140, 160], 'Gold pillar behind the hero, then the card picker opens.', wide=True),
      item('Dash dust', fx.dash_dust(), 70, 'Puffs behind the hero on a dash or ability step.')]
secs.append({'id': 'effects', 'title': 'Combat effects · spawn, death, hits', 'blurb': 'Shared effects used by every hero and enemy.', 'items': ef})

hh = []
for h in fx.HEROES:
    idle = [fx.place(fx.HEROES[h](v).render(), 48, 48) for v in fx.VIEWS]
    hurt = [fx.hurt(h, v) for v in fx.VIEWS]
    flash = [fx.tint(x, (255, 255, 255), 0.85) for x in hurt]
    for i, v in enumerate(fx.VIEWS): item(f'{h.title()} hurt · {v}', [flash[i], hurt[i], idle[i]], [60, 160, 260])
    row = lambda fs: hstack(fs)
    hh.append({'name': f'{h.title()} hurt', 'note': 'Front, side, back. White flash, flinch, back to idle, with a short knockback.', 'frames': [row(flash), row(hurt), row(idle)], 'ms': [60, 160, 260], 'rest': 500, 'wide': True})
    hh.append(item(f'{h.title()} death', fx.death(h), [200, 260, 500, 300, 400], 'Recoil, kneel, fall, fade. The run-over screen opens on the last frame.', rest=900))
secs.append({'id': 'heroes', 'title': 'Hero hurt and death · all five classes', 'blurb': 'Hurt frames for each facing, plus a death sequence. Built from the hero sheets, so new gear carries over.', 'items': hh})

dg = [item(n, fr, ms, {'Dog walk · front': 'Follows the hero. Dogs come from the Barn pen (up to 3 at T3).', 'Dog bite · front': 'Lunges at the nearest enemy.', 'Dog knocked out': 'Out of HP: it lies down and comes back next round.'}.get(n, '')) for n, fr, ms in fx.dog_frames()]
secs.append({'id': 'dog', 'title': 'Dog companion · walk, bite, knocked out', 'blurb': 'Three facings like the heroes. Brown coat, red collar with a gold tag.', 'items': dg})

json.dump(manifest, open(os.path.join(OUT, 'combat.json'), 'w'), indent=1)
size = build(os.path.join(ART, 'concepts', 'combat.html'), 'Combat Art', 'Rogue Shooter v2 · combat art',
             'Weapons, pickups and effects',
             'Every weapon and evolution, every pickup, the shared hit and death effects, hero hurt and death frames, and the dog companion. Shown at 3x on grass or a dark floor.',
             secs, 'Source: art/tools/combat. Strips: art/sprites/combat (frame sizes in combat.json).')
print(len(manifest), 'strips', size // 1024, 'KB')
