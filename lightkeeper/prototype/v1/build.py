# Lightkeeper build: joins the source into one playable file, builds/lightkeeper.html.
# Run from this folder: python3 build.py
# © 2026 justaskjoe. All rights reserved.
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'builds', 'lightkeeper.html'))
SCRIPTS = ['engine.js', 'render.js', 'audio.js', 'ui.js']


def read(name):
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        return f.read()


def build():
    parts = [read('head.html'), read('body.html')]
    for name in SCRIPTS:
        parts.append('<script>\n' + read(name) + '\n</script>\n')
    parts.append('</body>\n</html>\n')
    html = ''.join(parts)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(html)
    return html


if __name__ == '__main__':
    html = build()
    print('built', os.path.relpath(OUT, os.getcwd()), len(html.encode('utf-8')), 'bytes')
