#!/usr/bin/env python3
"""One command for everything before you push. Run from anywhere:

    python3 tower-defense/build-and-test.py           build + balance sim + co-op server tests + phone test
    python3 tower-defense/build-and-test.py --quick   build + sim + server tests (no browser; fast)

Fails (exit 1) if the build breaks, the smart bot leaves 50-70% wins, the server tests fail,
or the phone test hits a JS error or horizontal scroll.
© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
"""
import pathlib, re, shutil, subprocess, sys

here = pathlib.Path(__file__).resolve().parent
proto, server = here / 'prototype', here / 'server'
quick = '--quick' in sys.argv
fails = []

def run(label, cmd, cwd):
    print(f'\n== {label}: {" ".join(cmd)}')
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    print((r.stdout + r.stderr).strip()[-3000:])
    if r.returncode: fails.append(label)
    return r

run('build', [sys.executable, 'build.py'], proto)

if shutil.which('node'):
    r = run('balance sim (200 games per bot)', ['node', 'sim.js', '200'], proto)
    m = re.search(r'smart\s+wins (\d+)%', r.stdout)
    if m and not 50 <= int(m.group(1)) <= 70:
        print(f'!! smart bot wins {m.group(1)}%: outside the 50-70% target. Retune before pushing (see README, Balance).')
        fails.append('balance')
    if (server / 'node_modules').exists() or quick is False:
        if not (server / 'node_modules').exists():
            run('server install', ['npm', 'install', '--no-audit', '--no-fund'], server)
        run('co-op server tests', ['npm', 'test'], server)
    else:
        print('\n(skipping server tests: run `npm install` in tower-defense/server once)')
else:
    print('!! node not found: install Node 18+ to run the sim and server tests'); fails.append('node')

if not quick:
    try:
        import playwright  # noqa: F401
        r = run('phone test (Playwright, 390 and 320 wide)', [sys.executable, 'test.py'], proto)
        for width, got in re.findall(r'scrollWidth(320)? (\d+)', r.stdout):
            if int(got) > int(width or 390): fails.append(f'horizontal scroll at {width or 390}px')
    except ImportError:
        print('\n!! Playwright missing: pip install playwright && python -m playwright install chromium'); fails.append('playwright')

print('\n' + ('ALL GOOD' if not fails else 'FAILED: ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
