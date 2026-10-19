# Dev-jump check: opens every Jump panel entry, applies presets, and uses the in-table dev buttons (autoplay, end night).
import os, json
from playwright.sync_api import sync_playwright

errors = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append(str(e) + ' @ ' + str(e.stack)[:600]))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'favicon' not in m.text else None)
    pg.goto('file://' + os.getcwd() + '/trickbound.html'); pg.wait_for_timeout(800)
    pg.click('[data-s="introskip"]'); pg.wait_for_timeout(200)
    pg.evaluate("TBLine.progress.flags.started = true; TBLine.map()"); pg.wait_for_timeout(200)
    pg.click('[data-s="jump"]'); pg.click('[data-jump="preset:fresh"]'); pg.wait_for_timeout(200); pg.click('[data-s="jump"]'); pg.wait_for_timeout(200)
    assert pg.locator('[data-jump]').count() > 20, 'jump panel missing'
    jumps = pg.eval_on_selector_all('[data-jump]', 'els => els.map(e => e.dataset.jump)')
    for j in jumps:
        pg.evaluate("document.getElementById('story').hidden = false")
        if pg.locator('[data-s="jump"]').count() == 0 and pg.locator('[data-jump]').count() == 0:
            pg.evaluate("window.TBLine.map()"); pg.wait_for_timeout(100); pg.click('[data-s="jump"]'); pg.wait_for_timeout(100)
        elif pg.locator('[data-jump]').count() == 0:
            pg.click('[data-s="jump"]'); pg.wait_for_timeout(100)
        pg.click(f'[data-jump="{j}"]'); pg.wait_for_timeout(250)
        w = pg.evaluate('document.documentElement.scrollWidth')
        if w > 390: errors.append(f'overflow {w} on {j}')
        txt = pg.inner_text('#story')
        if 'undefined' in txt or 'NaN' in txt: errors.append(f'undefined/NaN text on {j}')
        print('jump', j, 'ok', txt[:50].replace('\n', ' | '))
    prog = pg.evaluate('JSON.stringify(window.TBLine.progress)')
    print('after cheats:', json.loads(prog)['marks'], 'marks,', len(json.loads(prog)['owned']), 'critters')

    # table dev buttons: sit at Ironmere table two from the legDone preset, then autoplay a hand, then end night with feats
    pg.evaluate("document.getElementById('story').hidden = false"); pg.evaluate('window.TBLine.map()'); pg.click('[data-s="jump"]'); pg.click('[data-jump="preset:table2"]'); pg.wait_for_timeout(200)
    pg.click('[data-town="ironmere"]'); pg.wait_for_timeout(200); pg.click('[data-s="sitdown"]'); pg.wait_for_timeout(200); pg.click('[data-s="deal"]'); pg.wait_for_timeout(600)
    pg.click('#bMenu'); pg.wait_for_timeout(100); pg.click('[data-act="autoHand"]')
    for _ in range(300):
        pg.wait_for_timeout(100)
        if pg.locator('[data-act="next"]').count(): break
    assert pg.locator('[data-act="next"]').count(), 'autoplay hand did not reach hand end'
    print('autoplay hand reached hand end; log tail:', pg.inner_text('#log')[-120:].replace('\n', ' | ') if pg.locator('#log').count() else '')
    pg.click('[data-act="next"]'); pg.wait_for_timeout(800)
    pg.click('#bMenu'); pg.wait_for_timeout(100); pg.click('[data-act="devWinFeats"]'); pg.wait_for_timeout(600)
    txt = pg.inner_text('#story'); print('night end:', txt[:400].replace('\n', ' | '))
    assert 'took the night' in txt and 'promo' in txt.lower(), 'dev win with feats did not show rewards'
    pg.click('[data-focus="1"]'); pg.wait_for_timeout(300)
    # autoplay a whole night and end it with a loss
    pg.click('[data-s="sitdown"]'); pg.wait_for_timeout(200); pg.click('[data-s="deal"]'); pg.wait_for_timeout(500)
    pg.click('#bMenu'); pg.wait_for_timeout(100); pg.click('[data-act="autoNight"]'); pg.wait_for_timeout(6000)
    hand = pg.inner_text('#chipHand'); print('after 6s autoplay:', hand)
    print('menu present', pg.locator('#bMenu').count(), 'overlay', pg.inner_text('#overlay')[:80].replace(chr(10),' | '), 'started', pg.evaluate('window.TBUI.started'))
    pg.click('#bMenu'); pg.wait_for_timeout(150); print('menu html has devLose', pg.locator('[data-act="devLose"]').count(), pg.inner_text('#overlay')[:100].replace(chr(10),' | '))
    pg.click('[data-act="devLose"]'); pg.wait_for_timeout(800)
    print('story hidden', pg.evaluate("document.getElementById('story').hidden"), 'errors so far', errors)
    txt = pg.inner_text('#story'); print('night end:', txt[:200].replace('\n', ' | ')); assert 'Their night' in txt
    pg.screenshot(path='shots/jump-nightend.png')
    pg.click('[data-s="depot"]'); pg.wait_for_timeout(200); pg.click('[data-s="jump"]'); pg.wait_for_timeout(200); pg.screenshot(path='shots/jump-panel.png', full_page=True)
    b.close()
print('errors', errors)
