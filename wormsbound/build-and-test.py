#!/usr/bin/env python3
"""One command for everything before you push. Run from anywhere:

    python3 wormsbound/build-and-test.py           engine rule checks + balance sim (200 matches per pairing)
    python3 wormsbound/build-and-test.py --quick   the same, with 60 matches per pairing (rougher numbers, faster)

Prototype 1 has no screens yet, so there is no build or phone test. They join this script with the local
hotseat UI (builds/wormsbound.html, Playwright at 390 and 320 wide), the same way Tower Defense does it.

Pass band (PROPOSED Nov 2, 2026: Louiemark to confirm; numbers recorded in design/handoff.md):
  - every match finishes: no stuck runs, no NaN, no turn-cap timeouts (rising water must end it)
  - skill shows: the smart bot beats the sloppy bot in 70-90% of matches
  - going first isn't decisive: in smart-vs-smart, the first team wins 40-62%
  - matches are short: median 10-24 turns (about 5-10 minutes at 20-30 seconds a turn)
  - live duds pull their weight but don't take over: smart (uses duds) beats nodud 48%+,
    and duder (dud-happy) beats smart no more than 65%
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
if 'NaN' in (r.stdout + r.stderr): fails.append('balance: NaN in a unit')

print('\n' + ('ALL GOOD' if not fails else 'FAILED: ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
