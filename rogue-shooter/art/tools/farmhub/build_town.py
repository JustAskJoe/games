"""Builds art/concepts/town.html: the town map with labels, close-ups of the two shops, and the
hero-style shopkeepers. Run from this folder: python3 town.py && python3 build_town.py
"""
import os, sys, io, json, base64, html as H
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
sys.path.insert(0, os.path.join(HERE, '..', 'farmlife'))
from gallery import build, b64
import people as N

ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
SC = os.path.join(ROOT, 'art', 'concepts', 'scenes')
town = Image.open(os.path.join(SC, 'town.png')).convert('RGBA')
meta = json.load(open(os.path.join(SC, 'town.json')))

labels = ''.join(f'<span class="tl" style="left:{l["x"] * 100:.2f}%;top:{l["y"] * 100:.2f}%">{H.escape(l["name"])}</span>' for l in meta['labels'])
pre = f'''<section class="zone" id="map"><header><h2>Town map</h2>
<p>The town screen the farm road leads to: a cobbled square with a fountain, the seed shop (left) and the general store (right), two houses, a market stall and a notice board. Same sketch scale and palette as the farm maps; signs use icons, never words. Shown at 2x.</p></header>
<div class="mapctl"><button class="chip" id="t-lbl" aria-pressed="true">Labels on</button></div>
<div class="map"><img src="{b64(town)}" alt="Town map: cobbled square with a fountain, seed shop on the left, general store on the right">{labels}</div></section>'''
css = '''.map { position: relative; width: 100%; max-width: 1280px; } .map img { width: 100%; image-rendering: pixelated; display: block; border: 2px solid var(--wood); }
.tl { position: absolute; transform: translate(-50%, -50%); font-family: var(--display); font-size: 9px; color: var(--fg); background: rgba(26,22,18,.85); border: 2px solid var(--wood); padding: 4px 6px; white-space: nowrap; pointer-events: none; }
.map.off .tl { display: none; } .mapctl { display: flex; gap: 8px; }
@media (max-width: 640px) { .tl { font-size: 7px; padding: 2px 3px; } }'''
pre += '''<script>document.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('t-lbl'),m=document.querySelector('.map');b.addEventListener('click',()=>{const on=m.classList.toggle('off');b.setAttribute('aria-pressed',!on);b.textContent=on?'Labels off':'Labels on';});});</script>'''

def crop(box): return town.crop(box)

close = [{'name': 'Seed shop', 'frames': [crop((10, 150, 170, 262))], 'ms': 1000, 'scale': 3, 'wide': True, 'flat': True,
          'note': 'Green roof with vines, a window full of seedlings, a sprout sign, seed sacks and a seedling cart. The seed keeper waits at the door.'},
         {'name': 'General store', 'frames': [crop((478, 150, 630, 262))], 'ms': 1000, 'scale': 3, 'wide': True, 'flat': True,
          'note': 'Plank walls, a red and white awning, a pouch-of-gold sign, barrels and crates. The shopkeeper stands out front.'},
         {'name': 'Fountain', 'frames': [crop((270, 210, 370, 285))], 'ms': 1000, 'scale': 3, 'flat': True, 'note': 'Centre of the square.'},
         {'name': 'Market stall and notice board', 'frames': [crop((100, 70, 190, 130)), crop((400, 100, 460, 160))], 'ms': 1500, 'scale': 3, 'flat': True,
          'note': 'Decoration for now; neither has a job in the design yet.'}]

pp = []
for n, fn, note in N.PEOPLE[2:]:
    f = N.frames(fn)
    def hs(fs):
        o = Image.new('RGBA', (sum(x.width for x in fs) + 8, max(x.height for x in fs)), (0, 0, 0, 0)); xx = 0
        for x in fs: o.alpha_composite(x, (xx, 0)); xx += x.width + 4
        return o
    idle = [hs([f[v]['idle'][k] for v in N.VIEWS]) for k in range(2)]
    walk = [hs([f[v]['walk'][k] for v in N.VIEWS]) for k in range(4)]
    pp.append({'name': n, 'frames': idle + idle + walk + walk, 'ms': [700, 500, 700, 500] + [150] * 8, 'note': note + ' Hero-style sprite for the shop menus and close-ups (strips in art/sprites/farm).', 'scale': 3, 'wide': True})

secs = [{'id': 'shops', 'title': 'Close-ups · shops and square', 'blurb': 'Cut from the map at 3x.', 'items': close},
        {'id': 'keepers', 'title': 'Shopkeepers · hero style', 'blurb': 'Same 32x44 canvas and walk cycle as the heroes. Front, side, back: idle, then walk.', 'items': pp}]
size = build(os.path.join(ROOT, 'art', 'concepts', 'town.html'), 'Town Art', 'Rogue Shooter v2 · town', 'The town',
             'The town map with the seed shop and general store, close-ups, and the two shopkeepers. The shop menus are on the menus page.',
             secs, 'Source: art/tools/farmhub/town.py and build_town.py. Map: art/concepts/scenes/town.png.', pre=pre, pre_css=css)
print('town.html', size // 1024, 'KB')
