# Join the parts into one playable file: ../builds/card-trader.html (images live next to it in ../builds/img/).
# © 2026 justaskjoe. All rights reserved.
import pathlib
here = pathlib.Path(__file__).parent
head = (here / 'head.html').read_text(encoding='utf-8').replace('</style>', (here / 'frontend.css').read_text(encoding='utf-8') + (here / 'v2.css').read_text(encoding='utf-8') + (here / 'v3.css').read_text(encoding='utf-8') + '</style>', 1)
parts = [head, (here / 'body.html').read_text(encoding='utf-8')]
script = lambda js: '<script>\n' + js + '\n</script>\n'
# The card universe (kit/cardgen core + Card Trader's profile and stats) loads before the engine.
kit = here.parent.parent / 'kit' / 'cardgen' / 'cardgen.js'
data = here.parent / 'data'
parts.append(script(kit.read_text(encoding='utf-8')))
parts.append(script('window.CG_PROFILE = ' + (data / 'cardgen-profile.json').read_text(encoding='utf-8') + ';\nwindow.CG_TEMPLATE = ' + (data / 'template-stats.json').read_text(encoding='utf-8') + ';'))
parts.append(script((here / 'cardgen.js').read_text(encoding='utf-8')))
for f in ['config.js', 'engine.js', 'art.js', 'music.js', 'fx.js', 'frontend.js', 'ui.js']:
    parts.append(script((here / f).read_text(encoding='utf-8')))
out = here.parent / 'builds' / 'card-trader.html'
out.parent.mkdir(exist_ok=True)
out.write_text('<!doctype html>\n<html lang="en">\n<head>\n' + parts[0] + '</head>\n<body>\n' + ''.join(parts[1:]) + '</body>\n</html>\n', encoding='utf-8')
print('built', out, out.stat().st_size, 'bytes')
