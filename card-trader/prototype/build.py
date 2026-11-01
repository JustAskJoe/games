# Join the parts into one playable file: ../builds/card-trader.html (images live next to it in ../builds/img/).
# © 2026 justaskjoe. All rights reserved.
import pathlib
here = pathlib.Path(__file__).parent
parts = [(here / 'head.html').read_text(encoding='utf-8'), (here / 'body.html').read_text(encoding='utf-8')]
for f in ['engine.js', 'art.js', 'music.js', 'ui.js']:
    parts.append('<script>\n' + (here / f).read_text(encoding='utf-8') + '\n</script>\n')
out = here.parent / 'builds' / 'card-trader.html'
out.parent.mkdir(exist_ok=True)
out.write_text('<!doctype html>\n<html lang="en">\n<head>\n' + parts[0] + '</head>\n<body>\n' + ''.join(parts[1:]) + '</body>\n</html>\n', encoding='utf-8')
print('built', out, out.stat().st_size, 'bytes')
