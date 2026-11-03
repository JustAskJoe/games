# Lightkeeper build-and-test: build, balance sim (with its pass band), then a phone test in headless Chromium.
# Run from this folder: python3 build.py && python3 test.py   (python3 test.py --quick skips the browser)
# The phone test plays Night 1 with real pointer events, checks every sheet, and fails on any
# JavaScript error or sideways scrolling at 390 and 320 px wide.
# © 2026 justaskjoe. All rights reserved.
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.normpath(os.path.join(HERE, '..', '..', 'builds', 'lightkeeper.html'))
SHOTS = os.path.join(HERE, 'shots')
fails = []


def check(ok, what):
    print(('  ok   ' if ok else '  FAIL ') + what)
    if not ok:
        fails.append(what)


# 1. build is up to date
sys.path.insert(0, HERE)
import build as B
html = B.build()
check(open(BUILD, encoding='utf-8').read() == html, 'builds/lightkeeper.html matches the source')
check('© 2026 justaskjoe. All rights reserved.' in html, 'ownership line in the build')

# 2. balance sim
r = subprocess.run(['node', os.path.join(HERE, 'sim.js'), '20'], capture_output=True, text=True)
print(r.stdout.rstrip())
check(r.returncode == 0, 'balance sim inside its pass band, replay deterministic')

if '--quick' in sys.argv:
    print('QUICK: skipped the browser test')
    sys.exit(1 if fails else 0)

# 3. phone test
from playwright.sync_api import sync_playwright

# Plays like a careful person, through pointer events only: light the most urgent boat whose lit course is safe.
BOT = """
() => {
  const LK = window.LK, UI = window.LKUI, L = LK.LAMP, game = document.getElementById('game');
  window.__bot = { moves: 0 };
  const loop = () => {
    const U = UI.U; if (U.mode !== 'play') { if (U.mode === 'pause') requestAnimationFrame(loop); return; }
    requestAnimationFrame(loop);
    const G = U.G; let best = null, bu = 1e9;
    for (const s of G.ships) { if (s.st !== 'sail') continue;
      const dark = LK.forecast(G, s, false, 30); if (dark.res === 'dock') continue;
      if (LK.forecast(G, s, true, 30).res !== 'dock') continue;
      if (dark.t < bu) { bu = dark.t; best = s; } }
    let wx, wy;
    if (best) { const a = Math.atan2(best.y - L.y, best.x - L.x); wx = L.x + Math.cos(a) * 200; wy = L.y + Math.sin(a) * 200; }
    else { wx = L.x + 170; wy = L.y - 12; }
    const p = UI.toScreen(wx, wy);
    game.dispatchEvent(new PointerEvent('pointerdown', { clientX: p.x, clientY: p.y, pointerId: 1, bubbles: true, pointerType: 'touch' }));
    game.dispatchEvent(new PointerEvent('pointerup', { clientX: p.x, clientY: p.y, pointerId: 1, bubbles: true, pointerType: 'touch' }));
    window.__bot.moves++;
  };
  loop();
}
"""

os.makedirs(SHOTS, exist_ok=True)
shot = lambda pg, name: pg.screenshot(path=os.path.join(SHOTS, name + '.png'))
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
    pg.goto('file://' + BUILD)
    pg.wait_for_timeout(800)
    shot(pg, '01-title')
    check(pg.is_visible('text=Lightkeeper') or 'Light' in pg.inner_text('#card'), 'title screen shows')
    pg.click('[data-act=how]'); pg.wait_for_timeout(150); shot(pg, '02-how')
    pg.click('[data-act=nights]'); pg.wait_for_timeout(150); shot(pg, '03-nights')
    check(pg.locator('.night[disabled]').count() == 5, 'only Night 1 is open on a fresh save')
    pg.click('[data-night="0"]'); pg.wait_for_timeout(150); shot(pg, '04-log')
    pg.click('[data-act=start]'); pg.wait_for_timeout(400)
    check(pg.is_visible('#hornBtn') and pg.is_visible('#hudL'), 'HUD and horn show in play')
    pg.evaluate('window.LKUI.U.speed = 4')
    pg.evaluate(BOT)
    pg.wait_for_timeout(1500); shot(pg, '05-play')
    # horn and pause/resume mid-night
    pg.click('#hornBtn'); pg.wait_for_timeout(200)
    check(pg.evaluate('window.LKUI.U.G.horn.cd > 0'), 'horn button sounds the horn and starts its cooldown')
    shot(pg, '06-horn')
    pg.click('#menuBtn'); pg.wait_for_timeout(200); shot(pg, '07-pause')
    check(pg.evaluate("window.LKUI.U.mode") == 'pause', 'menu pauses the night')
    pg.click('[data-act=resume]'); pg.wait_for_timeout(100); pg.evaluate(BOT)
    pg.wait_for_function("() => window.LKUI.U.mode === 'done'", timeout=60000)
    pg.wait_for_timeout(300); shot(pg, '08-results')
    res = pg.evaluate('JSON.stringify(window.LKUI.U.lastRes)')
    print('  night 1 result', res)
    check(pg.evaluate('window.LKUI.U.lastRes.won'), 'Night 1 won by pointer input alone')
    check(pg.evaluate('window.__bot.moves') > 20, 'bot played through pointer events')
    check(pg.evaluate("JSON.parse(localStorage.getItem('lightkeeper-v1')).stars[0]") > 0, 'stars saved')
    # feedback: validation, then the copy fallback (file:// has no Lab)
    pg.click('[data-act=feedback]'); pg.wait_for_timeout(150)
    pg.click('[data-act=fbSend]'); pg.wait_for_timeout(100)
    check('Tap at least one' in pg.inner_text('#fbErr'), 'feedback asks for an answer first')
    pg.click('[data-fq=fun][data-fv="4"]'); pg.click('[data-fq=again][data-fv="Yes"]'); pg.fill('#fbNote', 'test note')
    shot(pg, '09-feedback')
    pg.click('[data-act=fbSend]'); pg.wait_for_timeout(300)
    check(pg.is_visible('#fbCopy'), 'feedback falls back to copy when not in the Lab')
    # fog and storm nights render (tester mode opens them)
    pg.click('[data-act=title]'); pg.wait_for_timeout(100)
    pg.evaluate('window.LKUI.U.test = true')
    for i, name in [(4, '10-fog'), (5, '11-storm'), (1, '12-teeth')]:
        pg.evaluate(f'window.LKUI.startNight({i})'); pg.evaluate('window.LKUI.U.speed = 3'); pg.evaluate(BOT)
        pg.wait_for_timeout(2600); shot(pg, name)
    pg.evaluate('window.LKUI.U.speed = 6')
    pg.wait_for_function("() => window.LKUI.U.mode === 'done'", timeout=90000)
    print('  night 2 (bot) result', pg.evaluate('JSON.stringify(window.LKUI.U.lastRes)'))
    sw = pg.evaluate('document.documentElement.scrollWidth')
    check(sw <= 390, f'no sideways scroll at 390 px (scrollWidth {sw})')
    pg.set_viewport_size({'width': 320, 'height': 640}); pg.wait_for_timeout(200)
    pg.click('[data-act=nights]'); pg.wait_for_timeout(150); shot(pg, '13-nights-320')
    sw = pg.evaluate('document.documentElement.scrollWidth')
    check(sw <= 320, f'no sideways scroll at 320 px on the nights sheet (scrollWidth {sw})')
    pg.click('[data-night="2"]'); pg.wait_for_timeout(100); pg.click('[data-act=start]'); pg.wait_for_timeout(1500); shot(pg, '14-play-320')
    sw = pg.evaluate('document.documentElement.scrollWidth')
    check(sw <= 320, f'no sideways scroll at 320 px in play (scrollWidth {sw})')
    b.close()

check(not errs, 'no JavaScript errors' + ('' if not errs else ': ' + ' | '.join(errs[:5])))
print('TEST: ' + ('FAIL (' + str(len(fails)) + ')' if fails else 'PASS'))
sys.exit(1 if fails else 0)
