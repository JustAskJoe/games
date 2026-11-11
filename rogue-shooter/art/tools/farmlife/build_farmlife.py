"""Builds art/concepts/farm-life.html and the strips in art/sprites/farm/.

python3 build_farmlife.py   (run from this folder)
Crop strips: seed, sprout, growing, ready (+ a second ready frame for crops that glow).
Animal strips: walk (4) and idle (2). People: idle (2) and walk (4) per facing.
Frame sizes are in farm.json.
"""
import os, sys, re, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
sys.path.insert(0, os.path.join(HERE, '..', 'combat'))
import crops as C, animals as A, people as N
from gallery import build, strip

ART = os.path.normpath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ART, 'sprites', 'farm'); os.makedirs(OUT, exist_ok=True)
GRASS = '#5ea23c'
manifest = {}

def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def save(name, frames, ms):
    s, w, h = strip(frames); key = slug(name); s.save(os.path.join(OUT, key + '.png'))
    manifest[key] = {'name': name, 'w': w, 'h': h, 'frames': len(frames), 'ms': ms if isinstance(ms, list) else [ms] * len(frames)}

def hstack(fs, gap=4):
    o = Image.new('RGBA', (sum(f.width for f in fs) + gap * (len(fs) - 1), max(f.height for f in fs)), (0, 0, 0, 0)); x = 0
    for f in fs: o.alpha_composite(f, (x, o.height - f.height)); x += f.width + gap
    return o

DESIGN = {}
for tier, rounds, lst, size in C.TIERS:
    for n, fn in lst: DESIGN[n] = (tier, rounds, size)

secs = []
for tier, rounds, lst, size in C.TIERS:
    items = []
    for n, fn in lst:
        fr, r2 = C.all_stages(n, fn, size, tier == 'Void')
        save(n, fr + ([r2] if r2 else []), [500, 500, 500, 700] + ([700] if r2 else []))
        seq = [hstack(fr, 3)] + ([hstack(fr[:3] + [r2], 3)] if r2 else [])
        items.append({'name': n, 'frames': seq, 'ms': [500, 500] if r2 else 1000, 'note': '', 'scale': 3, 'wide': size[0] == 2})
    sz = f'{size[0]}x{size[1]}' if tier != 'Void' else 'the Void plot'
    blurb = {'Quick': 'Ready after 1 round. 1x1 plot. From round 1.', 'Standard': 'Ready after 2 rounds. 1x1 plot. From round 6.',
             'Rare': 'Ready after 3 rounds. 1x2 plot (two tiles wide). From round 11.', 'Legendary': 'Ready after 4 rounds. 2x2 plot. From round 16.',
             'Void': 'Grow in 1 round on the Void plot (round 21) and stay there for good; only one at a time. They glow and pulse instead of being harvested.'}[tier]
    secs.append({'id': slug(tier), 'title': f'{tier} crops · {len(lst)}', 'blurb': blurb + ' Frames: seed, sprout, growing, ready.', 'items': items})

plots = []
for n, fr in C.plot_states():
    save(n, fr, 600)
    plots.append({'name': n, 'frames': fr, 'ms': 600, 'note': {'Void plot': 'Unlocks at round 21. Black soil, obsidian rim, neon cracks that pulse.'}.get(n, 'Wooden edging and furrows like the farm hub plot beds.'), 'scale': 4 if n != 'Void plot' else 3})
secs.append({'id': 'plots', 'title': 'Plots · empty and Void', 'blurb': 'Empty plots on the 16-px tile grid. Rocky locked plots are on the day-one farm page.', 'items': plots})

# icons strip for the crops (all 28) so the page shows them next to the plants
sys.path.insert(0, os.path.join(HERE, '..', 'ui'))
import icons as I
icn = [fn().render() for n, fn in I.CROPS + I.CROPS_HIGH]
rows = [hstack(icn[i:i + 14], 2) for i in range(0, len(icn), 14)]
sheet = Image.new('RGBA', (rows[0].width, sum(r.height + 2 for r in rows)), (0, 0, 0, 0))
y = 0
for r in rows: sheet.alpha_composite(r, (0, y)); y += r.height + 2
secs.append({'id': 'icons', 'title': 'Crop icons · all 28', 'blurb': 'Icons for menus (seed shop, Harvest Bin, recipes). The 16 new ones (rare, legendary, Void) are added to icons.png.',
             'items': [{'name': 'Crop icons', 'frames': [sheet], 'ms': 1000, 'note': 'Row 1: quick, standard, then rare. Row 2: rare, legendary, Void.', 'scale': 3, 'wide': True, 'bg': '#2a2218', 'flat': True}]})

an = []
for n, fn, note, act in A.ANIMALS:
    walk, idle = fn()
    if walk:
        save(f'{n} walk', walk, 140); save(f'{n} idle', idle, [900, 400])
        an.append({'name': f'{n}', 'frames': walk * 2 + [idle[0], idle[1], idle[0], idle[1]], 'ms': [140] * 8 + [500, 350, 300, 600], 'note': note + f' Walk, then {act}.', 'scale': 3})
    else:
        save(f'{n} hive', idle, 160)
        an.append({'name': n, 'frames': idle, 'ms': 160, 'note': note, 'scale': 3})
import fx
dog = [fx.dog('side', f'm{k}') for k in range(4)]
an.append({'name': 'Dog', 'frames': dog * 2, 'ms': 120, 'note': 'Same sprite as the combat dog. Up to 3 dogs fight beside you.', 'scale': 3})
secs.append({'id': 'animals', 'title': 'Barn animals · all six', 'blurb': 'Side views face right; the game flips them. Each wanders the pen with a 4-frame walk and a 2-frame idle.', 'items': an})

pp = []
for n, fn, note in N.PEOPLE:
    f = N.frames(fn)
    for v in N.VIEWS:
        save(f'{n} idle {v}', f[v]['idle'], [800, 600]); save(f'{n} walk {v}', f[v]['walk'], 150)
    idle = [hstack([f[v]['idle'][k] for v in N.VIEWS]) for k in range(2)]
    walk = [hstack([f[v]['walk'][k] for v in N.VIEWS]) for k in range(4)]
    pp.append({'name': n, 'frames': idle + idle + walk + walk, 'ms': [700, 500, 700, 500] + [150] * 8, 'note': note + ' Front, side, back: idle, then walk.', 'scale': 3, 'wide': True})
secs.append({'id': 'people', 'title': 'Farm and town people · in hero style', 'blurb': 'Same 32x44 canvas, proportions, three facings and walk cycle as the heroes.', 'items': pp})

json.dump(manifest, open(os.path.join(OUT, 'farm.json'), 'w'), indent=1)
size = build(os.path.join(ART, 'concepts', 'farm-life.html'), 'Farm Life Art', 'Rogue Shooter v2 · farm life',
             'Crops, animals and people',
             'Every crop in its four growth stages on the right plot size, the Void plot, the six Barn animals, and the farmer, arena warrior and two town shopkeepers redrawn in the hero style.',
             secs, 'Source: art/tools/farmlife. Strips: art/sprites/farm (frame sizes in farm.json).')
print(len(manifest), 'strips', size // 1024, 'KB')
