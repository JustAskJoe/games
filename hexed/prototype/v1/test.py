import os, sys
from playwright.sync_api import sync_playwright
errs = []
def swipe(pg, n=1):
    for _ in range(n):
        h = pg.evaluate("() => { const S = HXUI.S; if (S.over) return null; const h = HX.hint(S); return h && [h.a, h.b]; }")
        if not h: return
        box = pg.locator('#board').bounding_box(); cs = box['width'] / 8
        (r0, c0), (r1, c1) = h
        x0, y0 = box['x'] + (c0 + .5) * cs, box['y'] + (r0 + .5) * cs
        x1, y1 = box['x'] + (c1 + .5) * cs, box['y'] + (r1 + .5) * cs
        pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move((x0+x1)/2, (y0+y1)/2, steps=3); pg.mouse.move(x1, y1, steps=3); pg.mouse.up()
        pg.wait_for_function("() => !document.querySelector('.piece.gone') ", timeout=8000)
        pg.wait_for_timeout(1400)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.getcwd() + '/hexed.html'); pg.wait_for_timeout(1500)
    pg.screenshot(path='s_intro.png')
    for i in range(3): pg.click('[data-s=next]'); pg.wait_for_timeout(900)
    pg.screenshot(path='s_intro4.png')
    pg.click('[data-s=next]'); pg.wait_for_timeout(600)
    pg.screenshot(path='s_map.png', full_page=True)
    pg.click('[data-lv="0"]'); pg.wait_for_timeout(500); pg.screenshot(path='s_open0.png')
    pg.click('[data-act=begin]'); pg.wait_for_timeout(1500)
    pg.screenshot(path='s_l0.png')
    swipe(pg, 3); pg.screenshot(path='s_l0b.png')
    # unlock all, level 5 spread
    pg.click('#bMenu'); pg.click('[data-act=tAll]'); pg.click('[data-act=close]')
    for lv in [5, 6, 8, 9, 3, 7]:
        pg.evaluate("() => HXUI.showMap()"); pg.wait_for_timeout(300)
        pg.click(f'[data-lv="{lv}"]'); pg.wait_for_timeout(300)
        if lv >= 5:
            pg.click('[data-act=draw]'); pg.wait_for_timeout(2600); pg.screenshot(path=f's_spread{lv}.png')
        pg.click('[data-act=begin]'); pg.wait_for_timeout(1200)
        swipe(pg, 2)
        pg.screenshot(path=f's_l{lv}.png', full_page=True)
    # power use on level 5
    pg.evaluate("() => HXUI.showMap()"); pg.click('[data-lv="5"]'); pg.click('[data-act=draw]'); pg.wait_for_timeout(2600); pg.click('[data-act=begin]'); pg.wait_for_timeout(1000)
    pg.click('[data-act=power]'); pg.wait_for_timeout(200)
    box = pg.locator('#board').bounding_box(); pg.mouse.click(box['x'] + box['width']*0.5 - 5, box['y'] + box['width']*0.5 - 5); pg.wait_for_timeout(800)
    pg.screenshot(path='s_power.png')
    # force finish: play to end quickly via engine on level 0
    pg.evaluate("() => HXUI.showMap()"); pg.click('[data-lv="0"]'); pg.click('[data-act=begin]'); pg.wait_for_timeout(800)
    for k in range(25):
        if pg.evaluate("() => HXUI.S.over"): break
        swipe(pg, 1)
    pg.wait_for_timeout(800); pg.screenshot(path='s_end.png')
    pg.evaluate("() => document.querySelector('#bMenu').click()"); pg.click('[data-act=feedback]'); pg.wait_for_timeout(300)
    pg.click('[data-fq=fun][data-fv="5"]'); pg.click('[data-act=fbsend]'); pg.wait_for_timeout(500)
    pg.screenshot(path='s_feedback.png', full_page=True)
    print('scrollWidth', pg.evaluate('document.documentElement.scrollWidth'))
    pg.set_viewport_size({'width': 320, 'height': 640}); pg.wait_for_timeout(300)
    pg.click('[data-act=close]'); pg.screenshot(path='s_320.png')
    print('scrollWidth320', pg.evaluate('document.documentElement.scrollWidth'))
    print('errors', errs[:8])
    b.close()
