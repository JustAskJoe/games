# Moonwort & Co. build: joins the source and the lore data into one playable file, builds/moonwort-co.html.
# Run from this folder: python3 build.py
# © 2026 justaskjoe. All rights reserved.
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'builds', 'moonwort-co.html'))
LORE = os.path.normpath(os.path.join(HERE, '..', '..', 'design', 'lore', 'ingredients.json'))
SCRIPTS = ['data.js', 'engine.js', 'art.js', 'audio.js', 'ui.js']


def read(path):
    with open(path if os.path.isabs(path) else os.path.join(HERE, path), encoding='utf-8') as f:
        return f.read()


def lore():
    # The cited lore cards (see design/lore/README.md). Missing file = cards say "coming soon".
    if not os.path.exists(LORE):
        return {'entries': []}
    data = json.loads(read(LORE))
    return data if isinstance(data, dict) and 'entries' in data else {'entries': data if isinstance(data, list) else data.get('ingredients', [])}


def build():
    parts = [read('head.html'), read('body.html')]
    payload = json.dumps(lore(), ensure_ascii=False).replace('</', '<\\/')
    parts.append('<script>\nwindow.MW_LORE = ' + payload + ';\n</script>\n')
    for name in SCRIPTS:
        parts.append('<script>\n' + read(name) + '\n</script>\n')
    parts.append('</body>\n</html>\n')
    html = ''.join(parts)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    return html


if __name__ == '__main__':
    html = build()
    print('built', os.path.relpath(OUT, os.getcwd()), len(html.encode('utf-8')), 'bytes')
