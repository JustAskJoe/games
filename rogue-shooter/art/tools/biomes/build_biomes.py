"""Export the six battle biomes and build the biome page.

Outputs (paths relative to the rogue-shooter folder):
  art/sprites/biomes/<zone>_ground.png     seamless 96x96 ground tile (repeat it in both directions)
  art/sprites/biomes/<zone>_obstacles.png  obstacle sprites side by side (see biomes.json for each one's box)
  art/sprites/biomes/<zone>_details.png    small ground details, side by side, no collision
  art/sprites/biomes/biomes.json           boxes, collision radii, hazards, glows
  art/concepts/scenes/<zone>.png           one combat screen per zone, 427x267 (1280x800 at 3x)
  art/concepts/biomes.html                 the page
"""
import os, sys, io, json, base64, html as H
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from PIL import Image
from biomes import ground, details, obstacle_images, ZONES, NAMES, ROOT, T, SW, SH_, GROUND_HAZARDS, GLOWS
from scenes import scene, PLANS

SPR = os.path.join(ROOT, 'art', 'sprites', 'biomes'); SCN = os.path.join(ROOT, 'art', 'concepts', 'scenes')

BLURB = {
    'meadow': 'Bright, warm grass with flowers and clover, a dirt path, oaks with apples, pines, boulders, berry bushes and a pond. Soft cloud shadows drift over it.',
    'forest': 'Darker, mossier grass under a heavy canopy, with patches of light breaking through. Old trees, fallen logs, stumps and giant mushrooms; ferns, toadstools and leaf litter on the ground.',
    'caverns': 'A cool grey cave floor of cracked stone with puddles, rubble and tiny glowing crystals. Stalagmites, rock pillars and crystal clusters that light the dark around them.',
    'volcanic': 'Ash and cracked rock with lava seeping through the cracks, embers, bones and ash piles. Basalt columns, charred trees, obsidian and lava pools that glow and burn. A red glow rises from below.',
    'shadow': 'An old violet flagstone floor with dead grass, ghost flowers, candles and skulls. Dead trees with eyes in the bark, broken pillars, gravestones and a ruined arch. Fog drifts across, and the edges fall into darkness.',
    'void': 'Black ground split by neon cracks, with shards and star motes. Floating rocks, neon monoliths, debris, and void pits full of stars that light the dark.',
}

def b64(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def strip(items, gap=2):
    w = sum(im.width for _, im, *_ in items) + gap * (len(items) - 1); h = max(im.height for _, im, *_ in items)
    o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); boxes = []; x = 0
    for it in items:
        name, im = it[0], it[1]
        o.alpha_composite(im, (x, h - im.height)); boxes.append([x, h - im.height, im.width, im.height]); x += im.width + gap
    return o, boxes

def main():
    os.makedirs(SPR, exist_ok=True); os.makedirs(SCN, exist_ok=True)
    meta = {'tile': T, 'screen': [SW, SH_], 'note': 'Obstacles stand on the bottom-center of their box. Radius is the collision circle at the feet in art px; 0 means a ground shape (see hazard).', 'zones': {}}
    sections = []
    for z in ZONES:
        g = ground(z); g.save(os.path.join(SPR, f'{z}_ground.png'))
        obs = obstacle_images(z); ostrip, oboxes = strip(obs); ostrip.save(os.path.join(SPR, f'{z}_obstacles.png'))
        det = details(z); dstrip, dboxes = strip(det); dstrip.save(os.path.join(SPR, f'{z}_details.png'))
        sc = scene(z); sc.save(os.path.join(SCN, f'{z}.png'))
        meta['zones'][z] = {
            'ground': f'{z}_ground.png',
            'obstacles': [{'name': n, 'box': b, 'radius': r, **({'hazard': GROUND_HAZARDS[n]} if n in GROUND_HAZARDS else {}), **({'glow': GLOWS[n]} if GLOWS.get(n) else {})}
                          for (n, im, r), b in zip(obs, oboxes)],
            'details': [{'name': n, 'box': b} for (n, im), b in zip(det, dboxes)]}
        tiled = Image.new('RGB', (T * 3, T * 3))
        for i in range(3):
            for j in range(3): tiled.paste(g, (i * T, j * T))
        obs_html = ''.join(f'<figure><img class="px x3" src="{b64(im)}" width="{im.width}" height="{im.height}" alt="{H.escape(n)}"><figcaption>{H.escape(n.upper())}</figcaption>'
                           f'<p class="fxnote">{"Radius " + str(r) + " px" if r else H.escape(GROUND_HAZARDS.get(n, ""))}</p></figure>' for n, im, r in obs)
        det_html = ''.join(f'<figure><img class="px x4" src="{b64(im)}" width="{im.width}" height="{im.height}" alt="{H.escape(n)}"><figcaption>{H.escape(n.upper())}</figcaption></figure>' for n, im in det)
        sections.append(f'''<section class="zone z-{z}" id="{z}">
  <header><h2>{NAMES[z]}</h2><span class="tag">Hero shown: {PLANS[z]["hero"].title()}</span></header>
  <p>{BLURB[z]}</p>
  <figure class="scene"><img class="px" src="{b64(sc)}" width="{SW}" height="{SH_}" alt="{NAMES[z]} combat screen mock"><figcaption>ONE SCREEN AT 3× (1280×800)</figcaption></figure>
  <div class="parts">
    <div class="block"><h4>Ground tile, repeated 3×3</h4><img class="px x1" src="{b64(tiled)}" width="{T * 3}" height="{T * 3}" alt="{NAMES[z]} ground tile repeated"></div>
    <div class="block grow"><h4>Obstacles</h4><div class="row">{obs_html}</div><h4>Ground details</h4><div class="row">{det_html}</div></div>
  </div>
</section>''')
    json.dump(meta, open(os.path.join(SPR, 'biomes.json'), 'w'), indent=1)
    page = open(os.path.join(HERE, 'biomes_template.html')).read()
    nav = ''.join(f'<a class="chip" href="#{z}">{NAMES[z]}</a>' for z in ZONES)
    page = page.replace('{{NAV}}', nav).replace('{{ZONES}}', '\n'.join(sections))
    dst = os.path.join(ROOT, 'art', 'concepts', 'biomes.html'); open(dst, 'w').write(page)
    print('wrote', dst, os.path.getsize(dst) // 1024, 'KB')

if __name__ == '__main__':
    main()
