"""Build art/concepts/farm-start.html: the Riverside farm on day one, with a toggle to the fully built farm."""
import os, sys, io, json, base64, random, html as H
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from farm import scene
from layout_b2 import layout
from farm_start import scene_start
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))

def b64(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def tags(labels):
    return ''.join(f'<span class="tag" style="left:{l["x"] * 100:.2f}%;top:{l["y"] * 100:.2f}%">{H.escape(l["name"])}</span>' for l in labels)

def main():
    start, plots = scene_start(layout(random.Random(31)), seed=31)
    built, _ = scene(layout(random.Random(31)), seed=31)
    os.makedirs(os.path.join(ROOT, 'art', 'concepts', 'scenes'), exist_ok=True)
    start.img.save(os.path.join(ROOT, 'art', 'concepts', 'scenes', 'farm_day_one.png'))
    page = open(os.path.join(HERE, 'start_template.html')).read()
    page = (page.replace('{{START}}', b64(start.img)).replace('{{BUILT}}', b64(built.img))
                .replace('{{TAGS_START}}', tags(start.labels)).replace('{{TAGS_BUILT}}', tags(built.labels))
                .replace('{{W}}', str(start.W)).replace('{{H}}', str(start.H)))
    dst = os.path.join(ROOT, 'art', 'concepts', 'farm-start.html'); open(dst, 'w').write(page)
    json.dump({'open_plots': [p['n'] for p in plots if p['open']], 'plots': plots}, open(os.path.join(ROOT, 'art', 'concepts', 'scenes', 'farm_day_one.json'), 'w'), indent=1)
    print('wrote', dst, os.path.getsize(dst) // 1024, 'KB')

if __name__ == '__main__':
    main()
