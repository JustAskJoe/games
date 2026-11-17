# Join the parts into one playable file: ../builds/wormsbound.html, and the Map Lab: ../builds/wormsbound-maplab.html
# © 2026 justaskjoe. All rights reserved.
import pathlib
here = pathlib.Path(__file__).parent
parts = [(here / 'head.html').read_text(encoding='utf-8'), (here / 'body.html').read_text(encoding='utf-8')]
for f in ['mapgen.js', 'engine.js', 'ui.js']:
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
