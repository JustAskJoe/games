import json, base64, re
def b64(p): return 'data:image/png;base64,'+base64.b64encode(open(p,'rb').read()).decode()
m1=json.load(open('meta.json')); m2=json.load(open('meta_b2.json'))
def nudge(labels, H):
    out=[]
    for l in labels:
        l=dict(l)
        if l['name'] in ('Barn',): l['y']-=0/H
        out.append(l)
    return out
def mapblock(key, img, alt, m, w, h):
    labels=''.join(f'<span class="tag" style="left:{l["x"]*100:.2f}%;top:{l["y"]*100:.2f}%">{l["name"]}</span>' for l in m['labels'])
    plots=''.join(f'<span class="plot" style="left:{p["x"]*100:.2f}%;top:{p["y"]*100:.2f}%">{p["n"]}</span>' for p in m['plots'])
    return f'<div class="map" data-map="{key}"><img src="{b64(img)}" alt="{alt}" width="{w}" height="{h}"><div class="layer tags">{labels}</div><div class="layer plots" hidden>{plots}</div></div>'
notes=[
 ('cabin','Cabin','Log cabin on a raised knoll. Stone chimney, flower boxes under warm windows, a lantern-lit porch, firewood, a bench and a picket-fenced garden.'),
 ('cliff','Cliffs & waterfall','Earth-and-stone cliff faces with grassy lips, stone stairs where paths climb, and a waterfall where the stream drops off the ridge.'),
 ('forge','Forge','Stone smithy with a glowing furnace arch, tall chimney, anvil on a stump, quench barrel and an ore pile.'),
 ('alchemy','Alchemy Lab','Timber-frame lab with a stone tower and purple roofs. Teal-lit windows, bubbling cauldron and a potion shelf.'),
 ('shrine','Shrine','Raised stone platform with steps, white pillars, a copper-green roof and a glowing orb, flanked by braziers.'),
 ('training','Training Grounds','Sand yard with a weapon-rack pavilion, three straw dummies, an archery target, hay and a crate.'),
 ('barn','Barn','Red gambrel barn with white trim, a cross-braced double door and a hay loft. Opens onto the animal pen.'),
 ('arena','Arena','Oval stone ring with a sand floor, banners around the rim and a torch-lit wooden gate.'),
]
cards=''.join(f'<figure class="bcard"><div class="bimg"><img src="{b64("b_"+n+".png")}" alt="{t}"></div><figcaption><b>{t}</b><span>{d}</span></figcaption></figure>' for n,t,d in notes)
html=open('page_template.html').read()
html=html.replace('{{MAIN}}', mapblock('b2','farm_b2.png','Pixel farm, Layout B round 2: riverside farm with a cliff ridge, waterfall and cabin', m2, 1760, 1240))
html=html.replace('{{OLDA}}', mapblock('a','farm_a.png','Pixel farm layout A, Crossroads', m1['a'], 1280, 896))
html=html.replace('{{OLDB}}', mapblock('b','farm_b.png','Pixel farm layout B, Riverside, first round', m1['b'], 1280, 896))
mi=json.load(open('meta_in.json'))
inotes=[('cabin','Cabin','Log walls, fireplace, quilted bed, kitchen counter, table for two and a sleeping cat. The potion chest sits open by the bed, and the crop bin overflows with pumpkins, wheat and greens.',False),
 ('forge','Forge','Brick hearth under a stone hood with bellows, a big anvil mid-strike, quench trough, grindstone, workbench, coal, and ore bins for stone, copper, gold and crystal. Weapons and tools hang on the walls.',False),
 ('alchemy','Alchemy Lab','A long alchemy table with a still, flasks, burner, mortar, crystal and open spellbook. Potion shelves, drying herbs, a crystal ball, a bubbling cauldron, a rune circle, and stairs up into the tower.',False),
 ('barn','Barn','Straw-lined stalls for the cows and sheep, nest boxes with chickens, a loft ladder, hay, feed and water troughs, milk pails and grain sacks. The farmer stands in the open aisle.',False),
 ('shrine','Shrine','The full shrine: a three-step stone base, four pillars, a two-tier copper roof, banners and a big glowing orb on the altar. Braziers, lily pools, glowing obelisks, flower beds and benches fill the courtyard.',False),
 ('training','Training Grounds','A fenced sand yard: weapon pavilion, six dummies, a three-lane archery range, roped sparring ring, hurdles and a balance beam, weights, a tally board, and benches. The gate is at the bottom.',False),
 ('arena','Arena','On the sand floor: the warrior stands in the center ring under a packed crowd and the royal box. Gated tunnels, banners, torches, weapon racks, dropped shields and a gong.',True)]
def iblock(n,t,d,wide):
    m=mi[n]
    labels=''.join(f'<span class="tag" style="left:{l["x"]*100:.2f}%;top:{l["y"]*100:.2f}%">{l["name"]}</span>' for l in m['labels'])
    return f'<figure class="icard{" wide" if wide else ""}"><div class="map"><img src="{b64("in_"+n+".png")}" alt="{t} interior" width="{m["w"]}" height="{m["h"]}"><div class="layer tags">{labels}</div></div><figcaption><b>{t}</b><span>{d}</span></figcaption></figure>'
html=html.replace('{{INTERIORS}}', ''.join(iblock(*x) for x in inotes))
html=html.replace('{{CARDS}}', cards).replace('{{FIELD}}', b64('b_field.png'))
open('farm-sketches.html','w').write(html)
import os; print(os.path.getsize('farm-sketches.html')//1024,'KB')
