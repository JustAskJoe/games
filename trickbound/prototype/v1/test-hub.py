# Walkable Cinder Hollow: labels, crew talk → pickup → wake → back outside; door → depot; train → map.
import os
from playwright.sync_api import sync_playwright

errors = []
def tap(pg, x, y):
    r = pg.evaluate('(() => { const c = document.getElementById("wCv"); const b = c.getBoundingClientRect(); return {l: b.left, t: b.top, w: b.width, h: b.height}; })()')
    tile = r['w'] / 12; rows = r['h'] / tile
    my = pg.evaluate('TBWorld.state.me.y'); cam = max(0, min(15 - rows, my - rows / 2 + 0.5))
    pg.mouse.click(r['l'] + (x + 0.5) * tile, r['t'] + (y - cam + 0.5) * tile)
def wait_box(pg, ms=6000):
    for _ in range(ms // 100):
        if pg.locator('#wBox:not([hidden])').count(): return True
        pg.wait_for_timeout(100)
    return False
def clear(pg):
    for _ in range(12):
        if pg.locator('#wBox:not([hidden])').count() == 0 or pg.locator('[data-wc]').count(): return
        pg.click('#wBox'); pg.wait_for_timeout(60)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append(str(e) + ' @ ' + str(e.stack)[:300]))
    pg.goto('file://' + os.getcwd() + '/trickbound.html'); pg.wait_for_timeout(600)
    pg.click('[data-s="introskip"]'); pg.wait_for_timeout(200)
    pg.evaluate("TBLine.progress.flags.started = true; TBLine.map()"); pg.click('[data-s="jump"]'); pg.click('[data-jump="preset:fresh"]'); pg.wait_for_timeout(200)
    pg.evaluate("TBLine.progress.flags.firstDuel = 'won'")
    pg.click('[data-town="cinder"]'); pg.wait_for_timeout(900)
    assert pg.evaluate('TBWorld.state.mode') == 'hub'
    wait_box(pg); print('intro:', pg.inner_text('#wBox')[:120].replace('\n', ' | ')); clear(pg)
    pg.screenshot(path='shots/hub-1.png')
    # walk to the shift crew (Moss at 2,6) and talk
    tap(pg, 2, 6); assert wait_box(pg), 'crew did not talk'; clear(pg)
    print('crew:', pg.inner_text('#wBox')[:200].replace('\n', ' | '))
    pg.screenshot(path='shots/hub-2-crew.png')
    pg.click('[data-wc="0"]'); pg.wait_for_timeout(300)
    assert pg.locator('[data-s="deal"]').count(), 'pickup did not open familiar screen'
    pg.click('[data-s="deal"]'); pg.wait_for_timeout(600); pg.click('#bMenu'); pg.click('[data-act="devWinFeats"]'); pg.wait_for_timeout(500)
    assert 'critter stirs' in pg.inner_text('#story')
    pg.click('[data-s="wake:none"]'); pg.wait_for_timeout(200); print('wake:', pg.inner_text('#story')[:80].replace('\n', ' | '))
    pg.click('[data-s="town"]'); pg.wait_for_timeout(900)
    assert pg.evaluate('TBWorld.state.mode') == 'hub', 'did not return outside'
    # door → depot
    tap(pg, 5, 2); pg.wait_for_timeout(3500)
    assert 'Walk outside' in pg.inner_text('#story'), pg.inner_text('#story')[:200]
    assert 'Around town' not in pg.inner_text('#story')
    pg.click('[data-s="hub"]'); pg.wait_for_timeout(900)
    # walk ONTO the door from far away (the bug F hit): from the platform, tap the door
    pg.evaluate("TBWorld.state.me.x = 3; TBWorld.state.me.y = 11; TBWorld.state.me.fx = 3; TBWorld.state.me.fy = 11;")
    tap(pg, 5, 2); pg.wait_for_timeout(5000)
    assert 'Walk outside' in pg.inner_text('#story'), 'walking onto the door hard-locked: ' + pg.inner_text('#story')[:120]
    print('walk onto door → depot ok')
    pg.click('[data-s="sitdown"]'); pg.wait_for_timeout(200); pg.click('[data-s="deal"]'); pg.wait_for_timeout(600)
    pg.click('#bMenu'); pg.click('[data-act="devWin"]'); pg.wait_for_timeout(500)
    for _ in range(4):
        if pg.locator('[data-s^="after:"]').count(): pg.click('[data-s^="after:"]'); pg.wait_for_timeout(200)
        if pg.locator('[data-s="scenenext"]').count(): pg.click('[data-s="scenenext"]'); pg.wait_for_timeout(150)
    print('after back-room win:', pg.inner_text('#story')[:100].replace('\n', ' | '))
    pg.click('[data-s="hub"]'); pg.wait_for_timeout(900)
    # train → map
    tap(pg, 3, 12); assert wait_box(pg); pg.click('[data-wc="0"]'); pg.wait_for_timeout(1500)
    assert 'Where to?' in pg.inner_text('#story'), pg.inner_text('#story')[:200]
    print('train → map ok; scroll', pg.evaluate('document.documentElement.scrollWidth'))
    b.close()
print('errors', errors)
