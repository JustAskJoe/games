parts = [open('head.html').read(), open('body.html').read()]
for f in ['engine.js', 'art.js', 'ui.js']:
    parts.append('<script>\n' + open(f).read() + '\n</script>\n')
open('hexed.html', 'w').write(''.join(parts))
print('built', sum(len(p) for p in parts), 'bytes')
