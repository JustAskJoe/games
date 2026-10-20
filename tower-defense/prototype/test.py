# Playwright phone walkthrough of the built prototype. Run: python3 test.py (after build.py), or ../build-and-test.py for everything
import os, pathlib, sys
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).parent
build = here.parent / 'builds' / 'tower-defense-p1.html'
shots = here / 'shots'; shots.mkdir(exist_ok=True)
errs = []

def cell_click(pg, c, r):
    box = pg.locator('#map').bounding_box(); cw = box['width'] / 12; ch = box['height'] / 8
    pg.mouse.click(box['x'] + (c + .5) * cw, box['y'] + (r + .5) * ch)

def play_wave(pg, speed=True):
    pg.click('[data-act=start]'); pg.wait_for_timeout(300)
    if speed and pg.locator('[data-act=speed]').count(): pg.click('[data-act=speed]')
    pg.wait_for_function("() => TDUI.G.phase !== 'wave'", timeout=120000)
    pg.wait_for_timeout(300)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    # ignore offline noise: blocked webfonts, and the feedback POST that can't run from file:// (the form falls back to copy)
    benign = ('net::', 'fonts.g', 'URL scheme "file"')
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and not any(x in m.text for x in benign) else None)
    pg.goto(build.as_uri()); pg.wait_for_timeout(1200)
    pg.screenshot(path=str(shots / 's1_intro.png'))
    for i in range(3): pg.click('[data-s=next]'); pg.wait_for_timeout(500); pg.screenshot(path=str(shots / f's1_intro{i+2}.png'))
    pg.click('[data-act=skipintro]'); pg.wait_for_timeout(600)
    pg.screenshot(path=str(shots / 's2_build.png'), full_page=True)
    # build: arrow at (3,3), arrow at (1,2), frost at (5,2)
    # spot first, then tower: tap an open spot, then pick what to build on it
    cell_click(pg, 3, 3); pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 's2b_spot.png'), full_page=True)
    pg.click('[data-build=arrow]'); cell_click(pg, 1, 2); pg.click('[data-build=arrow]')
    cell_click(pg, 5, 2); pg.click('[data-build=frost]')
    assert pg.evaluate("() => TDUI.G.towers.map(t => t.type).join()") == 'arrow,arrow,frost', 'spot-then-tower build failed'
    pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 's3_built.png'), full_page=True)
    # select a tower
    cell_click(pg, 3, 3); pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 's4_select.png'), full_page=True)
    pg.click('[data-act=unsel]')
    # waves 1-3 with the bot building between, so the test reaches the draft and the road growth
    for w in range(10):
        if pg.evaluate("() => TDUI.G.phase") in ('won', 'lost'): break
        pg.evaluate("() => { TD.botBuild(TDUI.G, 'smart'); TDUI.renderAll(); }")
        play_wave(pg)
        if w == 0: pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 's5_wave_done.png'), full_page=True)
        ph = pg.evaluate("() => TDUI.G.phase")
        if ph == 'draft':
            pg.wait_for_selector('#overlay .modal .card')
            if w == 0: pg.screenshot(path=str(shots / 's6_draft.png'), full_page=True)
            pg.click('#overlay .modal .card'); pg.wait_for_timeout(300)
            assert pg.locator('#overlay .modal').count() == 0, 'draft pop-up should close after a pick'
            if w == 2: pg.screenshot(path=str(shots / 's7_grown.png'), full_page=True)
    pg.wait_for_timeout(900)
    pg.screenshot(path=str(shots / 's8_end.png'), full_page=True)
    print('final phase', pg.evaluate("() => TDUI.G.phase"), 'waves', pg.evaluate("() => TDUI.G.stats.wavesCleared"), 'health', pg.evaluate("() => TDUI.G.health"))
    pg.click('.modal [data-act=feedback]'); pg.wait_for_timeout(300)
    pg.click('[data-fq=fun][data-fv="Yes, right away"]'); pg.click('[data-act=fbsend]'); pg.wait_for_timeout(800)
    pg.screenshot(path=str(shots / 's9_feedback.png'), full_page=True)
    print('scrollWidth', pg.evaluate('document.documentElement.scrollWidth'))
    pg.set_viewport_size({'width': 320, 'height': 640}); pg.wait_for_timeout(300); pg.click('.modal [data-act=close]'); pg.wait_for_timeout(200)
    pg.screenshot(path=str(shots / 's10_320.png'), full_page=True)
    print('scrollWidth320', pg.evaluate('document.documentElement.scrollWidth'))
    # tester tools: jump to wave 7 on a fresh run, add gold and a card, check the run is flagged
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(200)
    if pg.locator('#overlay .modal').count(): pg.click('#overlay [data-act=close]')
    pg.click('#bMenu'); pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 's11_menu.png'))
    pg.click('[data-act=tester]'); pg.wait_for_timeout(200)
    pg.click('[data-tjump="6"]'); pg.wait_for_timeout(400)
    pg.click('[data-act=tgold]'); card = pg.get_attribute('[data-tcard]:not([disabled])', 'data-tcard'); pg.click(f'[data-tcard={card}]'); pg.wait_for_timeout(200)
    pg.screenshot(path=str(shots / 's12_tester.png'), full_page=True)
    st = pg.evaluate("() => ({ wave: TDUI.G.wave, stage: TDUI.G.stage, phase: TDUI.G.phase, used: TDUI.G.test.used, cards: TDUI.G.cards.map(c => c.id) })")
    print('tester', st)
    assert st['wave'] == 6 and st['stage'] == 2 and st['phase'] == 'build' and st['used'] and card in st['cards'], st
    pg.click('#overlay [data-act=close]'); pg.wait_for_timeout(200)
    assert 'tester' in pg.inner_text('#modeTag').lower()
    pg.screenshot(path=str(shots / 's13_wave7.png'), full_page=True)
    # music button toggles and remembers
    pg.click('.music-btn'); pg.wait_for_timeout(100)
    print('music after one tap', pg.evaluate("() => TDMusic.on"), pg.evaluate("() => localStorage.getItem('td-music')"))
    print('errors', errs[:8])
    b.close()
sys.exit(1 if errs else 0)
