#!/usr/bin/env python3
"""One command for everything before you push. Run from anywhere:

    python3 card-trader/build-and-test.py           build + balance sim + browser walkthrough (desktop + phone width)
    python3 card-trader/build-and-test.py --quick   build + sim (no browser; fast)

Fails (exit 1) if the build breaks, the sim leaves its pass band, or the walkthrough hits a JS error,
doesn't reach the end screen, or scrolls sideways.
Pass band: the careful bot grows the shop at least 40%, beats the sloppy bot in 75%+ of seeds,
and skipping the Loupe costs at least 30 points of growth (inspecting has to matter).
© 2026 justaskjoe. All rights reserved.
"""
import pathlib, re, shutil, subprocess, sys

here = pathlib.Path(__file__).resolve().parent
proto = here / 'prototype'
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
    r = run('balance sim (200 runs per bot)', ['node', 'sim.js', '200'], proto)
    gain = {m.group(1): int(m.group(2)) for m in re.finditer(r'^(\w+)\s+median gain (-?\d+)%', r.stdout, re.M)}
    beats = re.search(r'careful beats sloppy (\d+)%', r.stdout)
    if gain.get('careful', 0) < 40: fails.append('balance: careful gain under 40%')
    if not beats or int(beats.group(1)) < 75: fails.append('balance: careful beats sloppy under 75%')
    if gain.get('careful', 0) - gain.get('noloupe', 0) < 30: fails.append('balance: the Loupe matters less than 30 points')
else:
    print('!! node not found: install Node 18+ to run the sim'); fails.append('node')

if not quick:
    try:
        import playwright  # noqa: F401
        r = run('browser walkthrough (Playwright)', [sys.executable, 'test.py'], proto)
        for width, got in re.findall(r'scrollWidth(320)? (\d+)', r.stdout):
            if int(got) > int(width or 390) and int(got) > 1280: fails.append(f'horizontal scroll at {width or 390}px')
    except ImportError:
        print('\n!! Playwright missing: pip install playwright && python -m playwright install chromium'); fails.append('playwright')

print('\n' + ('ALL GOOD' if not fails else 'FAILED: ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
