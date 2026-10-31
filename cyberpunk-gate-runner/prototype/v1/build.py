# Joins the parts into one playable file: ../../builds/cyberpunk-gate-runner.html
# © 2026 justaskjoe. All rights reserved.
import os
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(here, f), encoding='utf-8').read()
parts = [rd('head.html'), rd('body.html')]
for f in ['engine.js', 'ui.js']:
    parts.append('<script>\n' + rd(f) + '\n</script>\n')
parts.append('</body>\n</html>\n')
out = os.path.join(here, '..', '..', 'builds', 'cyberpunk-gate-runner.html')
open(out, 'w', encoding='utf-8').write(''.join(parts))
print('built', os.path.relpath(out), sum(len(p) for p in parts), 'bytes')
