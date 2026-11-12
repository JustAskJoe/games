#!/usr/bin/env python3
"""One command for everything before you push. Run from anywhere:

    python3 wormsbound/build-and-test.py           build + engine rule checks + balance sim (200 matches per pairing) + browser test
    python3 wormsbound/build-and-test.py --quick   build + rule checks + sim at 60 matches per pairing (no browser; rougher numbers)

Online: the room server's rule checks and socket tests (server/: npm test: a 1v1 and a 6-player free-for-all),
prototype/test-online.py, where two real browser pages play a whole 1v1 through the local server, and
prototype/test-online-ffa.py, where six pages play a whole free-for-all. (`npm install` in server/ once; the script does it.)

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
    (added Nov 2, 2026 with the characters; 1v1 with one unit a side since the game modes)
  - 1 Player difficulty (added Nov 2, 2026; a fair share of a 4-way is 25%): on Easy a new player (sloppy bot)
    wins 28%+ and a good one (smart) 45%+; on Medium a good player wins 25-45%; on Hard a good player wins
    12-35% and a new one 15% at most. Full run only (100 matches a line).
  - every map finishes too (added Nov 1, 2026 with the maps): no stuck runs or timeouts on any map. Map match
    length and win rates are printed, not judged yet. Since the map generator (Nov 2, 2026) that means every
    preset (10 theme maps + 9 modes) and a line of random custom settings: 20 map lines.
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
    cmd = [shutil.which(cmd[0]) or cmd[0]] + cmd[1:] # finds npm.cmd on Windows, where a bare 'npm' won't start
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    print((r.stdout + r.stderr).strip()[-4000:])
    if r.returncode: fails.append(label)
    return r

if not shutil.which('node'):
    print('!! node not found: install Node 18+ to run the tests and the sim'); sys.exit(1)

run('build', [sys.executable, 'build.py'], proto)
run('engine rule checks', ['node', 'test.js'], proto)
server = here / 'server'
if not (server / 'node_modules').exists(): run('server install', ['npm', 'install', '--no-audit', '--no-fund'], server)
run('online room server tests', ['npm', 'test'], server)
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
if len(chars) != 10: fails.append(f'sim output has {len(chars)} character lines, expected 10')
gear = {m[1]: int(m[2]) for m in re.finditer(r'^gear (\w+)\s+\w+\s+wins (\d+)%', out, re.M)}
if len(gear) != 14: fails.append(f'sim output has {len(gear)} gear lines, expected 14')
for g, w in gear.items():  # v2: gear is an option, not an upgrade. 200 mirror matches is about +-7%, so the band is wide.
    if not quick and not 38 <= w <= 64: fails.append(f'gear: carrying {g} wins {w}% against the same character without it (band 38-64%)')
for c, w in chars.items():  # only judged on the full run: 30 matches a pair (--quick) is too rough to call
    if not 40 <= w <= 60:
        if quick: print(f'(quick run: {c} wins {w}% of the round-robin; the full run checks the 40-60% band)')
        else: fails.append(f'balance: {c} wins {w}% of the round-robin (band 40-60%)')
ffa = {(m[1], m[2]): int(m[3]) for m in re.finditer(r'^ffa (\w+)\s+(\w+)\s+player wins (\d+)%', out, re.M)}
if len(ffa) != 6: fails.append(f'sim output has {len(ffa)} 1-player lines, expected 6')
elif not quick:
    checks = [(('easy', 'sloppy'), 28, 100), (('easy', 'smart'), 45, 100), (('medium', 'smart'), 25, 45), (('hard', 'smart'), 12, 35), (('hard', 'sloppy'), 0, 15)]
    for key, lo, hi in checks:
        if not lo <= ffa[key] <= hi: fails.append(f'difficulty: {key[1]} player vs 3 {key[0]} computers wins {ffa[key]}% (band {lo}-{hi}%)')
maps = {m[1]: (int(m[2]), int(m[3])) for m in re.finditer(r'^map (\w+)\s+turns.*?timeouts (\d+)\s+stuck (\d+)', out, re.M)}
if len(maps) < 20: fails.append(f'sim output has {len(maps)} map lines, expected 20 (every preset + custom)')
for m, (to, st) in maps.items():  # every match on every map has to finish (the same rule as the mirror line)
    if to or st: fails.append(f'maps: {m} had {to} timeouts and {st} stuck matches')
crews = {m[1]: (int(m[2]), int(m[3])) for m in re.finditer(r'^crew (\w+)\s+map.*?timeouts (\d+)\s+stuck (\d+)', out, re.M)}
if len(crews) != 6: fails.append(f'sim output has {len(crews)} crew lines, expected 6 (2v2, 3v3, 5v5, teams5, ffa6, 4x3)')
for c, (to, st) in crews.items():  # v2: every crew format has to finish on its own map size
    if to or st: fails.append(f'crews: {c} had {to} timeouts and {st} stuck matches')
if 'NaN' in (r.stdout + r.stderr): fails.append('balance: NaN in a unit')

if not quick:
    try:
        import playwright  # noqa: F401
        r = run('browser test (Playwright: 1280x720, then 390, 320 and 844x390)', [sys.executable, 'test.py'], proto)
        for width, got in re.findall(r'scrollWidth(\d+) (\d+)', r.stdout):
            if int(got) > int(width): fails.append(f'horizontal scroll at {width}px')
        run('online 1v1 in two browser pages (local server)', [sys.executable, 'test-online.py'], proto)
        run('online free-for-all in six browser pages (local server)', [sys.executable, 'test-online-ffa.py'], proto)
        run('online team battle in three browser pages plus a computer (local server)', [sys.executable, 'test-online-teams.py'], proto)
    except ImportError:
        print('\n!! Playwright missing: pip install playwright && python -m playwright install chromium'); fails.append('playwright')

print('\n' + ('ALL GOOD' if not fails else 'FAILED: ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
