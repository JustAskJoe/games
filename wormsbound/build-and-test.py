#!/usr/bin/env python3
"""One command for everything before you push. Run from anywhere:

    python3 wormsbound/build-and-test.py           build + engine rule checks + balance sim (200 matches per pairing) + browser test
    python3 wormsbound/build-and-test.py --quick   build + rule checks + sim at 60 matches per pairing (no browser; rougher numbers)

The browser test (prototype/test.py, Playwright) plays the hotseat build at 1280x720: keyboard walking, a real
drag-and-release shot, the turn timer, a lob, a whole best-of-3 by bots, feedback and rematch. Then it loads at
phone widths (390, 320 and 844x390). It fails on any JavaScript error or sideways scrolling.

Pass band (PROPOSED Nov 2, 2026: Louiemark to confirm; numbers recorded in design/handoff.md):
  - every match finishes: no stuck runs, no NaN, no turn-cap timeouts (rising water must end it)
  - skill shows: the smart bot beats the sloppy bot in 70-90% of matches
  - going first isn't decisive: in smart-vs-smart, the first team wins 40-62%
  - matches are short: median 10-24 turns (about 5-10 minutes at 20-30 seconds a turn)
  - live duds pull their weight but don't take over: smart (uses duds) beats nodud 48%+,
    and duder (dud-happy) beats smart no more than 65%
  - no character is too strong or too weak: each of the five wins 40-60% of a smart-vs-smart round-robin
    (added Nov 2, 2026 with the characters)
Never loosen these to get a pass; change the game, or agree a new band with the game's owner.
(c) 2026 justaskjoe. All rights reserved.
"""
import pathlib, re, shutil, subprocess, sys

here = pathlib.Path(__file__).resolve().parent
proto = here / 'prototype'
quick = '--quick' in sys.argv
fails = []

def run(label, cmd, cwd):
    print(f'\n== {label}: {" ".join(cmd)}')
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    print((r.stdout + r.stderr).strip()[-4000:])
    if r.returncode: fails.append(label)
    return r

if not shutil.which('node'):
    print('!! node not found: install Node 18+ to run the tests and the sim'); sys.exit(1)

run('build', [sys.executable, 'build.py'], proto)
run('engine rule checks', ['node', 'test.js'], proto)
n = '60' if quick else '200'
r = run(f'balance sim ({n} matches per pairing)', ['node', 'sim.js', n], proto)
out = r.stdout

def row(label):
    m = re.search(rf'^{label}\s+(\w+) wins (\d+)%\s+(\w+) wins (\d+)%\s+draws (\d+)%\s+first-turn wins (\d+)%\s+turns p10 (\d+) p50 (\d+) p90 (\d+).*?timeouts (\d+)\s+stuck (\d+)', out, re.M)
    if not m: fails.append(f'sim output missing the "{label}" line'); return None
    return dict(a=int(m[2]), b=int(m[4]), draws=int(m[5]), first=int(m[6]), p50=int(m[8]), timeouts=int(m[10]), stuck=int(m[11]))

rows = {k: row(k) for k in ('mirror', 'skill', 'dud value', 'dud spam')}
if all(rows.values()):
    if any(x['stuck'] or x['timeouts'] for x in rows.values()): fails.append('balance: a match got stuck or hit the turn cap')
    if not 70 <= rows['skill']['a'] <= 90: fails.append(f"balance: smart beats sloppy {rows['skill']['a']}% (band 70-90%)")
    if not 40 <= rows['mirror']['first'] <= 62: fails.append(f"balance: going first wins {rows['mirror']['first']}% of mirror matches (band 40-62%)")
    if not 10 <= rows['mirror']['p50'] <= 24: fails.append(f"balance: median match is {rows['mirror']['p50']} turns (band 10-24)")
    if rows['dud value']['a'] < 48: fails.append(f"balance: duds aren't worth using (smart vs nodud {rows['dud value']['a']}%, band 48%+)")
    if rows['dud spam']['a'] > 65: fails.append(f"balance: dud spam wins {rows['dud spam']['a']}% (band 65% at most)")
chars = {m[1]: int(m[2]) for m in re.finditer(r'^char (\w+)\s+wins (\d+)%', out, re.M)}
if len(chars) != 5: fails.append(f'sim output has {len(chars)} character lines, expected 5')
for c, w in chars.items():  # only judged on the full run: 30 matches a pair (--quick) is too rough to call
    if not 40 <= w <= 60:
        if quick: print(f'(quick run: {c} wins {w}% of the round-robin; the full run checks the 40-60% band)')
        else: fails.append(f'balance: {c} wins {w}% of the round-robin (band 40-60%)')
if 'NaN' in (r.stdout + r.stderr): fails.append('balance: NaN in a unit')

if not quick:
    try:
        import playwright  # noqa: F401
        r = run('browser test (Playwright: 1280x720, then 390, 320 and 844x390)', [sys.executable, 'test.py'], proto)
        for width, got in re.findall(r'scrollWidth(\d+) (\d+)', r.stdout):
            if int(got) > int(width): fails.append(f'horizontal scroll at {width}px')
    except ImportError:
        print('\n!! Playwright missing: pip install playwright && python -m playwright install chromium'); fails.append('playwright')

print('\n' + ('ALL GOOD' if not fails else 'FAILED: ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
