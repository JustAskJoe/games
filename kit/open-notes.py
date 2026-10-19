#!/usr/bin/env python3
"""List open items from every game's patch notes: unticked next-up and watch-out checkboxes.

    python3 kit/open-notes.py               everything open, grouped by game
    python3 kit/open-notes.py --for Joe     only items addressed to @Joe, plus unaddressed ones anyone can take
    python3 kit/open-notes.py --only Joe    only items addressed to @Joe
    python3 kit/open-notes.py --repo ../games-private   read another clone (the private repo uses this script from here)

Reads <game>/patch-notes.md in this repo (works the same in games-private).
© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
"""
import pathlib, re, sys

args = sys.argv[1:]
root = pathlib.Path(args[args.index('--repo') + 1]).resolve() if '--repo' in args else pathlib.Path(__file__).resolve().parent.parent
who, only = None, False
for flag in ('--for', '--only'):
    if flag in args:
        i = args.index(flag)
        who = args[i + 1].lstrip('@').lower() if i + 1 < len(args) else None
        only = flag == '--only'

total = 0
for notes in sorted(root.glob('*/patch-notes.md')):
    entry, section, items = None, None, []
    for line in notes.read_text().splitlines():
        if line.startswith('## '): entry = line[3:].strip()
        elif line.startswith('### '): section = line[4:].strip()
        m = re.match(r'\s*- \[ \] (.*)', line)
        if not m: continue
        text = m.group(1)
        names = [n.lower() for n in re.findall(r'@([A-Za-z][\w-]*)', text)]
        if who and ((who not in names) if only else (names and who not in names)): continue
        items.append((entry, section, text))
    if not items: continue
    print(f'\n{notes.parent.name}')
    for entry, section, text in items:
        print(f'  [{section or "-"}] {text}   ({entry.split("·")[0].strip() if entry else "?"})')
    total += len(items)

print(f'\n{total} open item{"s" if total != 1 else ""}' + (f' for {who}' if who else ''))
