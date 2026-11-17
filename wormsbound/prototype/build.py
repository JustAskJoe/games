# Join the parts into one playable file: ../builds/wormsbound.html, and the Map Lab: ../builds/wormsbound-maplab.html
# © 2026 justaskjoe. All rights reserved.
import pathlib
here = pathlib.Path(__file__).parent
parts = [(here / 'head.html').read_text(encoding='utf-8'), (here / 'body.html').read_text(encoding='utf-8')]
# art: the unit sprite sheet (art/sprites/creatures.png, drawn by art/tools/creatures.py) goes in as a data URL
import base64
units = here.parent / 'art' / 'sprites' / 'creatures.png'
# and each theme's background picture, if it has one (art/backgrounds/<theme>.png, made by art/tools/backgrounds.py)
durl = lambda f: 'data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode()
backs = sorted((here.parent / 'art' / 'backgrounds').glob('*.png'))
art = (['units: "' + durl(units) + '"'] if units.exists() else []) + ['backs: { ' + ', '.join(f'{f.stem}: "{durl(f)}"' for f in backs) + ' }']
parts.append('<script>\nwindow.WB_ART = { ' + ', '.join(art) + ' };\n</script>\n')
for f in ['mapgen.js', 'engine.js', 'look.js', 'ui.js']:   # look.js: how the ground and backdrop are painted
    parts.append('<script>\n' + (here / f).read_text(encoding='utf-8') + '\n</script>\n')
out = here.parent / 'builds' / 'wormsbound.html'
out.parent.mkdir(exist_ok=True)
out.write_text('<!doctype html>\n<html lang="en">\n<head>\n' + parts[0] + '</head>\n<body>\n' + ''.join(parts[1:]) + '</body>\n</html>\n', encoding='utf-8')
print('built', out, out.stat().st_size, 'bytes')
# the Map Lab: maplab.html with the generator inlined where it says <!-- MAPGEN -->
lab = (here / 'maplab.html').read_text(encoding='utf-8')
assert '<!-- MAPGEN -->' in lab
lab_out = here.parent / 'builds' / 'wormsbound-maplab.html'
lab_out.write_text(lab.replace('<!-- MAPGEN -->', '<script>\n' + (here / 'mapgen.js').read_text(encoding='utf-8') + '\n</script>'), encoding='utf-8')
print('built', lab_out, lab_out.stat().st_size, 'bytes')
