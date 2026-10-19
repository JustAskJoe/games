# Concatenate the parts into one playable HTML file: ../builds/tower-defense-p1.html
import os, pathlib
here = pathlib.Path(__file__).parent
parts = [(here / 'head.html').read_text(), (here / 'body.html').read_text()]
for f in ['engine.js', 'art.js', 'music.js', 'ui.js']:
    parts.append('<script>\n' + (here / f).read_text() + '\n</script>\n')
out = here.parent / 'builds' / 'tower-defense-p1.html'
out.parent.mkdir(exist_ok=True)
out.write_text('<!doctype html>\n<html lang="en">\n<head>\n' + parts[0] + '</head>\n<body>\n' + ''.join(parts[1:]) + '</body>\n</html>\n')
print('built', out, out.stat().st_size, 'bytes')
