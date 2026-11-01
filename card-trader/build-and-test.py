#!/usr/bin/env python3
"""One command for everything before you push. Run from anywhere:

    python3 card-trader/build-and-test.py           build + balance sim + browser walkthrough (desktop + phone width)
    python3 card-trader/build-and-test.py --quick   build + sim (no browser; fast)

Fails (exit 1) if the build breaks, the sim leaves its pass band, or the walkthrough hits a JS error,
doesn't reach the end screen, or scrolls sideways.
Pass band (v2, 5-day week): the careful bot grows the shop at least 150%, beats the sloppy bot in 90%+ of seeds,
and the Loupe upgrades are worth at least 5 points of growth over the same bot without them.
v3 (the Back Room): an organized back room beats a lazy one by 30+ points, the greedy bot (grails in an unlocked case)
loses 5-15% of its final value to theft, and the display case makes 25-45% of the careful bot's single sales.
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
    if gain.get('careful', 0) < 150: fails.append('balance: careful gain under 150%')
    if not beats or int(beats.group(1)) < 90: fails.append('balance: careful beats sloppy under 90%')
    if gain.get('careful', 0) - gain.get('noupgrades', 0) < 5: fails.append('balance: Loupe upgrades worth under 5 points')
    if gain.get('noupgrades', 0) - gain.get('lazy', 0) < 30: fails.append('balance: organized back room worth under 30 points')
    theft = re.search(r'^greedy\s+back room:.*?stolen [\d.]+ \([^,]*, (\d+)% of final\)', r.stdout, re.M)
    if not theft or not 5 <= int(theft.group(1)) <= 15: fails.append('balance: greedy theft outside 5-15%')
    disp = re.search(r'^careful\s+back room:.*?display (\d+)% of singles', r.stdout, re.M)
    if not disp or not 25 <= int(disp.group(1)) <= 45: fails.append('balance: display case share outside 25-45%')
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
