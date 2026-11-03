"""Render every hero frame, export sprite sheets, and build the animated hero sheet.

Outputs (paths relative to the rogue-shooter folder):
  art/sprites/heroes/<hero>.png      32x44 frames; rows front, side, back;
                                     columns idle, walk 1-4, attack 1-3, ability 1-3
  art/sprites/heroes/<hero>_fx.png   96x88 attack effect layers; rows front, side, back;
                                     columns attack 1-3 behind the hero, then attack 1-3 in front
  art/sprites/heroes/<hero>_ability_fx.png  128x112 ability effect layers, same layout
  art/sprites/heroes/heroes.json     frame layout, timings and where the hero sits for each ability frame
  art/sprites/heroes/<hero>_<view>.png  idle frame (kept for quick previews)
  art/concepts/heroes.html           animated sheet
"""
import os, sys, base64, io, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from heroes import frames, HEROES, VIEWS
from effects import FX, compose, EW, EH, OFFSET
from abilities import ABILITIES, ability, compose_ab, AW, AH, HOME
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SPR_DIR = os.path.join(ROOT, 'art', 'sprites', 'heroes')
FW, FH = 32, 44

def b64(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

NOTES = {
    'knight': ('Knight', 'Sword Slash', 'Great helm, plume, plate, tabard, cape, kite shield. Attack: the longsword winds up over the shoulder and sweeps a wide golden arc in front.'),
    'mage': ('Mage', 'Magic Bolt', 'Old wizard with a bent hat, silver beard and starry robe. Attack: the orb charges with sparks, flares, and fires a glowing blue-violet homing bolt.'),
    'marksman': ('Marksman', 'Piercing Shot', 'Blue hooded mantle, leather jerkin, quiver. Attack: raises the crossbow to aim, a muzzle flash, then a bolt flies out with a long piercing streak.'),
    'rogue': ('Rogue', 'Dagger Flurry', 'Peaked hood, mask, red scarf, twin daggers. Attack: two quick stabs, one per hand, each leaving a green slash, finished with a crossed X-cut.'),
    'witch': ('Witch', 'Hex Pulse', 'Wide bent hat, ginger hair, ruffled dress, and now a crooked staff with a glowing magenta crystal. Attack: raises the staff, slams it down, and a hex ring pulses out around her.'),
}

ABL_NOTES = {
    'knight': 'Braces behind the shield, charges forward with speed lines and dust, and slams into the target with an impact burst and circling stun stars.',
    'mage': 'A glyph ring forms at his feet, he dissolves in an arcane explosion, and reappears further ahead in a puff of sparkles.',
    'marksman': 'Locks a red reticle on the target while the crossbow charges, then fires a huge frost-blue piercing beam across the screen.',
    'rogue': 'Crouches in a swirl of shadow smoke, then dashes forward leaving dark afterimages and a slash along the path.',
    'witch': 'A rune circle opens under her, a pillar of light bursts up with a double hex ring, and hex marks appear on everything it touches.',
}

def main():
    os.makedirs(SPR_DIR, exist_ok=True)
    data = {}
    meta = {'frame': [FW, FH], 'views': VIEWS, 'columns': ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'attack1', 'attack2', 'attack3', 'ability1', 'ability2', 'ability3'],
            'side_faces': 'right (flip for left)', 'timing_ms': {'walk': 150, 'attack': [140, 110, 160], 'ability': [220, 160, 300]},
            'attack_fx': {'frame': [EW, EH], 'hero_at': list(OFFSET)}, 'ability_fx': {'frame': [AW, AH], 'hero_at': list(HOME)}, 'heroes': {}}
    for k in HEROES:
        f = frames(k)
        sheet = Image.new('RGBA', (FW * 11, FH * 3), (0, 0, 0, 0))
        fxs = Image.new('RGBA', (EW * 6, EH * 3), (0, 0, 0, 0))
        afx = Image.new('RGBA', (AW * 6, AH * 3), (0, 0, 0, 0))
        hd = {'walk': {}, 'attack': {}, 'idle': {}, 'ability': {}}
        meta['heroes'][k] = {'ability': ABILITIES[k][0], 'ability_at': {}}
        for r, v in enumerate(VIEWS):
            row = [f['idle'][v]] + f['walk'][v] + f['attack'][v]
            for c, im in enumerate(row): sheet.alpha_composite(im, (c * FW, r * FH))
            f['idle'][v].save(os.path.join(SPR_DIR, f'{k}_{v}.png'))
            hd['idle'][v] = b64(f['idle'][v])
            hd['walk'][v] = [b64(im) for im in f['walk'][v]]
            atk = []
            for i in range(3):
                behind, front = FX[k](v, i)
                fxs.alpha_composite(behind, (i * EW, r * EH)); fxs.alpha_composite(front, ((i + 3) * EW, r * EH))
                atk.append(b64(compose(f['attack'][v][i], behind, front)))
            # idle frame on the effect canvas, so the attack loop can rest between swings
            rest = Image.new('RGBA', (EW, EH), (0, 0, 0, 0)); rest.alpha_composite(f['idle'][v], OFFSET)
            hd['attack'][v] = atk + [b64(rest)]
            abl = []
            for i in range(3):
                fr = ability(k, v, i)
                sheet.alpha_composite(fr['hero'], ((8 + i) * FW, r * FH))
                afx.alpha_composite(fr['behind'], (i * AW, r * AH)); afx.alpha_composite(fr['front'], ((i + 3) * AW, r * AH))
                meta['heroes'][k]['ability_at'].setdefault(v, []).append([int(fr['at'][0] - HOME[0]), int(fr['at'][1] - HOME[1])])
                abl.append(b64(compose_ab(fr)))
            rest = Image.new('RGBA', (AW, AH), (0, 0, 0, 0)); rest.alpha_composite(f['idle'][v], HOME)
            hd['ability'][v] = abl + [b64(rest)]
        sheet.save(os.path.join(SPR_DIR, f'{k}.png')); fxs.save(os.path.join(SPR_DIR, f'{k}_fx.png')); afx.save(os.path.join(SPR_DIR, f'{k}_ability_fx.png'))
        data[k] = hd
    cards = ''
    for k in HEROES:
        name, atk, note = NOTES[k]
        cards += f'''<section class="hero" data-hero="{k}">
  <header><h2>{name}</h2><span class="role">Attack: {atk}</span></header>
  <p>{note}</p>
  <div class="anims">
    <div class="block"><h3>Walk</h3><div class="row">{''.join(f'<figure><canvas class="walk" data-view="{v}" width="{FW}" height="{FH}"></canvas><figcaption>{v.upper()}</figcaption></figure>' for v in VIEWS)}</div>
      <div class="strip">{''.join(f'<img src="{s}" alt="{name} walk {v} frame {i+1}" width="{FW}" height="{FH}">' for v in VIEWS for i, s in enumerate(data[k]['walk'][v]))}</div></div>
    <div class="block"><h3>Attack</h3><div class="row">{''.join(f'<figure><canvas class="atk" data-view="{v}" width="{EW}" height="{EH}"></canvas><figcaption>{v.upper()}</figcaption></figure>' for v in VIEWS)}</div>
      <div class="strip fx">{''.join(f'<img src="{s}" alt="{name} attack {v} frame {i+1}" width="{EW}" height="{EH}">' for v in VIEWS for i, s in enumerate(data[k]['attack'][v][:3]))}</div></div>
    <div class="block wide"><h3>Ability (Space): {ABILITIES[k][0]}</h3><p class="what">{ABL_NOTES[k]}</p><div class="row">{''.join(f'<figure><canvas class="abl" data-view="{v}" width="{AW}" height="{AH}"></canvas><figcaption>{v.upper()}</figcaption></figure>' for v in VIEWS)}</div>
      <div class="strip ab">{''.join(f'<img src="{s}" alt="{name} {ABILITIES[k][0]} {v} frame {i+1}" width="{AW}" height="{AH}">' for v in VIEWS for i, s in enumerate(data[k]['ability'][v][:3]))}</div></div>
  </div>
</section>'''
    html = open(os.path.join(os.path.dirname(__file__), 'sheet_template.html')).read()
    html = html.replace('{{CARDS}}', cards).replace('{{DATA}}', json.dumps({k: {'walk': v['walk'], 'attack': v['attack'], 'ability': v['ability']} for k, v in data.items()}))
    json.dump(meta, open(os.path.join(SPR_DIR, 'heroes.json'), 'w'), indent=1)
    dst = os.path.join(ROOT, 'art', 'concepts', 'heroes.html')
    open(dst, 'w').write(html)
    print('wrote', dst, os.path.getsize(dst) // 1024, 'KB')

if __name__ == '__main__':
    main()
