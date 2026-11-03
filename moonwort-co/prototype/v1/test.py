# Moonwort & Co. build-and-test: build, brewing sim (with its pass band), then a phone test in headless Chromium.
# Run from this folder: python3 build.py && python3 test.py   (python3 test.py --quick skips the browser)
# The phone test takes the familiar quiz and plays all 3 days by tapping like a person (herbs, preparations, a real
# stir gesture, giving, foraging, planting), opens lore cards and feedback, and fails on any JavaScript error or
# sideways scrolling at 390 and 320 px wide.
# © 2026 justaskjoe. All rights reserved.
import os, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.normpath(os.path.join(HERE, '..', '..', 'builds', 'moonwort-co.html'))
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
check(open(BUILD, encoding='utf-8').read() == html, 'builds/moonwort-co.html matches the source')
check('© 2026 justaskjoe. All rights reserved.' in html, 'ownership line in the build')
lore_n = len(B.lore().get('entries', []))
check(lore_n == 20, f'lore cards embedded for all 20 ingredients ({lore_n})')

# 2. brewing sim
r = subprocess.run(['node', os.path.join(HERE, 'sim.js')], capture_output=True, text=True, encoding='utf-8')
print('\n'.join(l for l in r.stdout.splitlines() if 'FAIL' in l or 'bot' in l or 'SIM' in l or 'first villager' in l))
check(r.returncode == 0, 'brewing sim inside its pass band')

if '--quick' in sys.argv:
    print('QUICK: skipped the browser test')
    sys.exit(1 if fails else 0)

# 3. phone test
from playwright.sync_api import sync_playwright

# Picks a recipe for the current customer the way a careful player would (plentiful herbs first).
PLAN = """
() => {
  const U = window.MWUI, MW = window.MW, G = U.G;
  const tr = MW.troubles(G)[U.cust];
  const sc = s => s.reduce((a, it) => a + 1 / G.pantry[it.id], 0);
  const sols = MW.solutions(G.pantry, U.sky, tr.want, 300).sort((a, b) => sc(a) - sc(b));
  return sols[0] || null;
}
"""
ORDER = ['steep', 'grind', 'dry', 'moon']

os.makedirs(SHOTS, exist_ok=True)
shot = lambda pg, name: pg.screenshot(path=os.path.join(SHOTS, name + '.png'))
errs = []


def hscroll(pg, w, where):
    sw = pg.evaluate('Math.max(document.documentElement.scrollWidth, document.getElementById("view").scrollWidth)')
    check(sw <= w, f'no sideways scroll at {w} px {where} (scrollWidth {sw})')


def stir_by_hand(pg):
    box = pg.locator('#stir').bounding_box()
    cx, cy, rad = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2, box['width'] * 0.3
    import math
    pg.mouse.move(cx + rad, cy)
    pg.mouse.down()
    for i in range(1, 60):
        a = i / 24 * 2 * math.pi
        pg.mouse.move(cx + rad * math.cos(a), cy + rad * math.sin(a))
    pg.mouse.up()


def serve_one(pg, by_hand):
    plan = pg.evaluate(PLAN)
    if not plan:
        return None
    for k, it in enumerate(plan):
        pg.click(f'[data-act=mix][data-id="{it["id"]}"]')
        for _ in range(ORDER.index(it['proc'])):
            pg.click(f'[data-act=proc][data-k="{k}"]')
    pg.click('[data-act=stir]')
    pg.wait_for_timeout(100)
    if by_hand:
        stir_by_hand(pg)
    else:
        pg.click('[data-act=autoStir]')
    pg.wait_for_selector('[data-act=give]', timeout=3000)
    made = pg.evaluate('window.MWUI.res && window.MWUI.res.brew')
    pg.click('[data-act=give]')
    pg.wait_for_timeout(100)
    return made


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
    pg.goto('file:///' + BUILD.replace('\\', '/') + '?date=2026-11-02')
    pg.wait_for_timeout(500)
    shot(pg, '01-title')
    check('Moonwort' in pg.inner_text('#card'), 'title screen shows')
    pg.click('[data-act=how]'); shot(pg, '02-how'); pg.click('[data-act=back]')
    pg.click('[data-act=new]')
    # quiz: crow, crow, toad -> crow
    for q, a in [(0, 2), (1, 2), (2, 1)]:
        pg.click(f'[data-act=quiz][data-q="{q}"][data-a="{a}"]')
    shot(pg, '03-familiar')
    check('Quill the crow' in pg.inner_text('#card'), 'the quiz picks the familiar (crow)')
    pg.click('[data-act=startGame]'); pg.wait_for_timeout(100); shot(pg, '04-dawn')
    check('Waxing' in pg.inner_text('#card') or 'Waning' in pg.inner_text('#card') or 'moon' in pg.inner_text('#card').lower(), 'dawn card shows the moon')
    pg.click('[data-act=openShop]'); shot(pg, '05-shop')
    hscroll(pg, 390, 'in the shop')

    days_best = 0
    for day in range(3):
        if day > 0:
            pg.click('[data-act=openShop]')
        # forage first
        pg.click('#nav [data-tab=garden]'); pg.click('[data-act=forage]'); pg.wait_for_timeout(100)
        if day == 1:
            shot(pg, '09-moonwort')
            check('Moonwort!' in pg.inner_text('#card'), 'day 2 hedgerow finds moonwort (left be)')
        pg.click('[data-act=close]')
        pg.click('#nav [data-tab=shop]')
        for i in range(3):
            pg.click('[data-act=brewFor]')
            if day == 0 and i == 0:
                shot(pg, '06-bench')
                hscroll(pg, 390, 'at the bench')
            made = serve_one(pg, by_hand=(day == 0 and i == 0))
            if day == 0 and i == 0:
                shot(pg, '07-given')
                check(made == 'sleepwell', f'first brew by a real stir gesture is Sleepwell Tea ({made})')
            pg.click('[data-act=afterGive]'); pg.wait_for_timeout(80)
        shot(pg, f'1{day}-dusk')
        check('Closing up' in pg.inner_text('#card'), f'day {day + 1} ends at dusk')
        if day < 2:
            pg.click('[data-act=tab][data-tab=garden]')
            pg.click('[data-act=plant][data-k="0"][data-id="chamomile"]')
            pg.click('[data-act=plant][data-k="1"][data-id="garlic"]')
            pg.click('#nav [data-tab=shop]'); pg.click('[data-act=dusk]')
        pg.click('[data-act=sleep]'); pg.wait_for_timeout(100)

    shot(pg, '20-end')
    res = pg.evaluate('JSON.stringify(window.MWUI.lastRes)')
    print('  week result', res)
    check(pg.evaluate('window.MWUI.lastRes.best') == 9, 'all 9 neighbors got the right brew by taps alone')
    check(pg.evaluate('window.MWUI.lastRes.firstBrewS') is not None, 'time to first brew is recorded')
    check(pg.evaluate("JSON.parse(localStorage.getItem('moonwort-v1')).done") is True, 'finished week saved')
    # grimoire + a lore card
    pg.click('[data-act=grim]'); pg.wait_for_timeout(100); shot(pg, '21-grimoire')
    pg.click('[data-act=lore][data-id="chamomile"]'); pg.wait_for_timeout(100); shot(pg, '22-lore')
    card = pg.inner_text('#card')
    check('Chamomile' in card and 'not medical advice' in card, 'lore card opens with the not-medical-advice line')
    pg.click('[data-act=close]')
    pg.click('[data-act=gTab][data-t=brews]'); shot(pg, '23-brews')
    # a dud
    pg.evaluate("window.MWUI.G.pantry.ginger = 3; window.MWUI.G.pantry.garlic = 3")
    pg.click('#nav [data-tab=bench]')
    for _ in range(3):
        pg.click('[data-act=mix][data-id="ginger"]') if pg.evaluate("window.MWUI.mix.length < 2") else pg.click('[data-act=mix][data-id="garlic"]')
    pg.click('[data-act=stir]'); pg.click('[data-act=autoStir]'); pg.wait_for_timeout(300); shot(pg, '24-dud')
    check('dud' in pg.inner_text('#card').lower(), 'a careless mix makes a named dud')
    pg.click('[data-act=shelf]')
    # feedback: validation, then the copy fallback (file:// has no Lab)
    pg.click('[data-act=menu]'); pg.click('#card [data-act=feedback]')
    pg.click('[data-act=fbSend]')
    check('Tap at least one' in pg.inner_text('#fbErr'), 'feedback asks for an answer first')
    pg.click('[data-fq=fun][data-fv="4"]'); pg.fill('#fbFact', 'Chamomile is in the daisy family')
    pg.click('[data-act=fbSend]'); pg.wait_for_timeout(200); shot(pg, '25-feedback')
    check(pg.is_visible('#fbCopy'), 'feedback falls back to copy when not in the Lab')
    # narrow phone
    pg.set_viewport_size({'width': 320, 'height': 640}); pg.wait_for_timeout(100)
    pg.click('[data-act=endBack]'); pg.click('[data-act=title]'); pg.click('[data-act=new]')
    for q in range(3):
        pg.click(f'[data-act=quiz][data-q="{q}"][data-a="0"]')
    pg.click('[data-act=startGame]'); pg.click('[data-act=openShop]')
    hscroll(pg, 320, 'in the shop')
    pg.click('[data-act=brewFor]'); pg.click('[data-act=mix][data-id="chamomile"]'); pg.click('[data-act=mix][data-id="lavender"]'); pg.click('[data-act=mix][data-id="rose"]')
    shot(pg, '30-bench-320'); hscroll(pg, 320, 'at the bench with a full mortar')
    pg.click('#nav [data-tab=garden]'); shot(pg, '31-garden-320'); hscroll(pg, 320, 'in the garden')
    pg.click('#nav [data-tab=grimoire]'); hscroll(pg, 320, 'in the grimoire')
    b.close()

check(not errs, 'no JavaScript errors' + ('' if not errs else ': ' + ' | '.join(errs[:5])))
print('TEST: ' + ('FAIL (' + str(len(fails)) + ')' if fails else 'PASS'))
sys.exit(1 if fails else 0)
