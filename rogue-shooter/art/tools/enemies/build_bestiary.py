"""Render every enemy frame, export sprite sheets, and build the animated bestiary page.

Outputs (paths relative to the rogue-shooter folder):
  art/sprites/enemies/<enemy>.png          one row per view (front, side, back) and per variant
                                           (the Slime's six zones); columns are the move loop,
                                           then the attack or special frames
  art/sprites/enemies/<enemy>_<extra>.png  effect or projectile frames in one row
  art/sprites/enemies/enemies.json         frame sizes, rows, columns, timings and extras
  art/concepts/enemies.html                animated bestiary, grouped by zone
"""
import os, sys, io, json, base64, html as H
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from PIL import Image
import ekit
import meadow_forest, caverns_volcanic, shadow_void  # noqa: F401  (registers the enemies)

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SPR = os.path.join(ROOT, 'art', 'sprites', 'enemies')

ZONES = [
    ('universal', 'Every zone', 'Show up in all six zones. The Slime changes color with the zone.'),
    ('meadow', 'Meadow · rounds 1–5', 'Bright and friendly-looking, to teach the basics.'),
    ('forest', 'Forest · rounds 6–10', 'Ranged and charging enemies arrive.'),
    ('caverns', 'Caverns · rounds 11–15', 'Tanks, ambushers and a healer to hunt down.'),
    ('volcanic', 'Volcanic · rounds 16–20', 'Fire on the ground and enemies that blow up.'),
    ('shadow', 'Shadow · rounds 21–25', 'Phasing, fear and assassins.'),
    ('void', 'Void · rounds 26–30', 'Splitters, spawners and gravity.'),
    ('material', 'Material sources from v1', 'Still named in the design as drops (Bone Fragments, Demon Essence) but not placed in a zone yet.'),
]
LEDE = ("Redrawn in the hero style: material shading lit from the top-left, colored outlines and hand-placed details. "
        "Walkers face front, side and back (flip the side for left); fliers, blobs and fixed objects use one view. "
        "Each sprite sits on its zone's ground color, with the game's soft shadow. Shown at 4×; the game draws at 3×.")
FLOATS = {'bat', 'wisp', 'moth', 'wraith', 'imp', 'nightmare', 'tear', 'anchor'}

def b64(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def slug(s): return s.lower().replace(' ', '_')

def main():
    build(keys=[k for k in ekit.ENEMIES], spr=SPR, rel='art/sprites/enemies', json_name='enemies.json', html='enemies.html',
          zones=ZONES, title='Rogue Shooter Bestiary', eyebrow=f'Rogue Shooter v2 · Bestiary · {len(ekit.ENEMIES)} sprites',
          h1='Every enemy, zone by zone', lede=LEDE, foot='Sprite sheets and enemies.json in art/sprites/enemies.')

def build(keys, spr, rel, json_name, html, zones, title, eyebrow, h1, lede, foot):
    SPR = spr
    os.makedirs(SPR, exist_ok=True)
    meta = {'note': 'Side views face right; flip for left. Frame sizes are in art pixels (the game draws them at 3x).',
            'enemies': {}}
    data = {}
    for key in keys:
        e = ekit.ENEMIES[key]
        w, h = e['size']
        fl = e.get('floats', key in FLOATS)
        cols = e['anims']['move'] + e['anims'].get('attack', [])
        rows = [(var, v) for var in e['variants'] for v in e['views']]
        sheet = Image.new('RGBA', (w * len(cols), h * len(rows)), (0, 0, 0, 0))
        for r, (var, v) in enumerate(rows):
            for c, fr in enumerate(cols):
                sheet.alpha_composite(ekit.render(key, v, fr, var), (c * w, r * h))
        sheet.save(os.path.join(SPR, f'{key}.png'))
        ex = {}
        for name, (note, frames) in ekit.EXTRAS.get(key, {}).items():
            fw, fh = frames[0].size
            strip = Image.new('RGBA', (fw * len(frames), fh), (0, 0, 0, 0))
            for i, im in enumerate(frames): strip.alpha_composite(im, (i * fw, 0))
            fn = f'{key}_{slug(name)}.png'; strip.save(os.path.join(SPR, fn))
            ex[name] = {'file': fn, 'frame': [fw, fh], 'count': len(frames), 'note': note, 'src': b64(strip)}
        nm = len(e['anims']['move']); na = len(e['anims'].get('attack', []))
        t = e['timing']
        meta['enemies'][key] = {
            'name': e['name'], 'zone': e['zone'], 'file': f'{key}.png', 'frame': [w, h],
            'rows': [f'{var} {v}' if var else v for var, v in rows], 'columns': cols,
            'move_frames': nm, 'attack_frames': na,
            'timing_ms': {'move': t.get('move', 150), **({'attack': t['attack']} if na else {})},
            'floats': fl, **({'tier': e['tier'], 'attack': e['attack_name']} if 'tier' in e else {}),
            'extras': {n: {k: v for k, v in x.items() if k != 'src'} for n, x in ex.items()}}
        data[key] = {'w': w, 'h': h, 'sheet': b64(sheet), 'views': e['views'], 'variants': e['variants'],
                     'nm': nm, 'na': na, 'tm': t.get('move', 150), 'ta': t.get('attack', []),
                     'float': fl, 'extras': {n: {'src': x['src'], 'w': x['frame'][0], 'h': x['frame'][1], 'n': x['count']} for n, x in ex.items()}}
    json.dump(meta, open(os.path.join(SPR, json_name), 'w'), indent=1)

    out = []
    for zone, ztitle, blurb in zones:
        zkeys = [k for k in keys if ekit.ENEMIES[k]['zone'] == zone]
        if not zkeys: continue
        cards = []
        for k in zkeys:
            e = ekit.ENEMIES[k]; d = data[k]
            rows = []
            for var in e['variants']:
                for v in e['views']:
                    lab = (var.upper() + ' ' if var else '') + (v.upper() if len(e['views']) > 1 else '')
                    rows.append(f'<figure><canvas data-k="{k}" data-var="{var or ""}" data-view="{v}" data-anim="move"></canvas><figcaption>{lab.strip() or "LOOP"}</figcaption></figure>')
            atk = ''
            if d['na']:
                atk = '<div class="block"><h4>' + (H.escape(e['attack_name'].split(':')[0]) if 'attack_name' in e else 'Special' if k in ('crawler', 'wraith', 'tear', 'brute') else 'Attack') + '</h4><div class="row">' + ''.join(
                    f'<figure><canvas data-k="{k}" data-var="" data-view="{v}" data-anim="attack"></canvas><figcaption>{v.upper() if len(e["views"]) > 1 else "LOOP"}</figcaption></figure>' for v in e['views']) + '</div></div>'
            exs = ''
            if d['extras']:
                exs = '<div class="block"><h4>Effects</h4><div class="row">' + ''.join(
                    f'<figure><canvas class="fx" data-k="{k}" data-extra="{H.escape(n)}"></canvas><figcaption>{H.escape(n.upper())}</figcaption><p class="fxnote">{H.escape(ekit.EXTRAS[k][n][0])}</p></figure>'
                    for n in d['extras']) + '</div></div>'
            size = f'{e["size"][0]}×{e["size"][1]}'
            cls = 'foe wide' if len(e['views']) > 1 or e.get('tier') == 'major' else 'foe'
            tier = {'mini': 'Mini-boss · ', 'major': f'Round {e.get("round", "")} boss · '}.get(e.get('tier'), '')
            atkline = f'<p class="note"><b>{H.escape(e["attack_name"])}</b></p>' if 'attack_name' in e else ''
            cards.append(f'''<article class="{cls}" data-zone="{zone}">
  <header><h3>{H.escape(e["name"])}</h3><span class="tag">{tier}{size} px · {len(e["views"])} view{"s" if len(e["views"]) > 1 else ""}</span></header>
  <p class="beh">{H.escape(e["behavior"])}</p>
  <p class="note">{H.escape(e["note"])}</p>{atkline}
  <div class="anims"><div class="block"><h4>{"Idle" if "tier" in e else "Move"}</h4><div class="row">{"".join(rows)}</div></div>{atk}{exs}</div>
  <details><summary>Sprite sheet</summary><img class="sheet" src="{d["sheet"]}" alt="{H.escape(e["name"])} sprite sheet" width="{e["size"][0] * (d["nm"] + d["na"])}" height="{e["size"][1] * len(e["variants"]) * len(e["views"])}"><p class="fxnote">{rel}/{k}.png</p></details>
</article>''')
        out.append(f'<section class="zone z-{zone}" id="{zone}"><header><h2>{ztitle}</h2><p>{blurb}</p></header><div class="grid">{"".join(cards)}</div></section>')
    nav = ''.join(f'<a class="chip" href="#{z}">{t.split(" ·")[0]}</a>' for z, t, _ in zones if any(ekit.ENEMIES[k]["zone"] == z for k in keys))
    page = open(os.path.join(HERE, 'bestiary_template.html')).read()
    page = (page.replace('{{NAV}}', nav).replace('{{ZONES}}', '\n'.join(out)).replace('{{PAGETITLE}}', title)
            .replace('{{EYEBROW}}', eyebrow).replace('{{H1}}', h1).replace('{{LEDE}}', lede).replace('{{FOOTSRC}}', foot))
    page = page.replace('{{DATA}}', json.dumps({k: {kk: vv for kk, vv in v.items()} for k, v in data.items()}))
    dst = os.path.join(ROOT, 'art', 'concepts', html)
    open(dst, 'w').write(page)
    print('wrote', dst, os.path.getsize(dst) // 1024, 'KB;', len(keys), 'sprites')

if __name__ == '__main__':
    main()
