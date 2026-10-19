# Catching slice 1: pickup crews at Cinder Hollow, the liking meter, the wake roll, lanterns, binder holes.
import os, json
from playwright.sync_api import sync_playwright

errors = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append(str(e) + ' @ ' + str(e.stack)[:300]))
    pg.goto('file://' + os.getcwd() + '/trickbound.html'); pg.wait_for_timeout(600)
    pg.click('[data-s="introskip"]'); pg.wait_for_timeout(200)
    # skip the walkable opening via preset
    pg.evaluate("TBLine.progress.flags.started = true; TBLine.map()"); pg.click('[data-s="jump"]'); pg.click('[data-jump="preset:fresh"]'); pg.wait_for_timeout(200)
    pg.click('[data-town="cinder"]'); pg.wait_for_timeout(200)
    txt = pg.inner_text('#story'); assert 'Around town' in txt and 'Shift crew' in txt and 'asleep on the table' in txt, txt[:400]
    print('depot crews ok;', [l for l in txt.split('\n') if 'asleep' in l][:2])
    pg.screenshot(path='shots/catch-1-depot.png', full_page=True)
    enc0 = pg.evaluate("JSON.stringify(TBLine.progress.enc.cinder[0])"); print('encounter', enc0)
    # buy a tin lantern
    pg.click('[data-s="buylantern:tin"]'); pg.wait_for_timeout(150); assert pg.evaluate('TBLine.progress.lanterns.tin') == 1
    # challenge crew 0
    pg.click('[data-s="pickup:0"]'); pg.wait_for_timeout(200)
    txt = pg.inner_text('#story'); assert 'SHIFT CREW' in txt and 'Likes' in txt, txt[:300]
    pg.click('[data-s="deal"]'); pg.wait_for_timeout(800)
    assert pg.locator('#wild .wild-row').count() == 1, 'wild panel missing'
    print('wild panel:', pg.inner_text('#wild').replace('\n', ' | ')[:160])
    print('chip', pg.inner_text('#chipHand'))
    pg.click('#bMenu'); pg.click('[data-act="autoNight"]')
    for _ in range(900):
        pg.wait_for_timeout(200)
        if pg.locator('[data-act="again"]').count(): break
    print('match end:', pg.inner_text('#overlay')[:220].replace('\n', ' | '))
    meter = pg.evaluate('TBUI.ui ? TBUI.ui.wild.meter : -1') if pg.evaluate('!!TBUI.ui') else None
    pg.click('[data-act="again"]'); pg.wait_for_timeout(400)
    txt = pg.inner_text('#story'); print('wake screen:', txt[:300].replace('\n', ' | '))
    assert 'The critter stirs' in txt and 'Just try' in txt and 'tin lantern' in txt, 'wake screen wrong'
    pg.screenshot(path='shots/catch-2-wake.png', full_page=True)
    # force a success to test the wake path, then a fail
    pg.evaluate('Math.random = () => 0.0')
    pg.click('[data-s="wake:tin"]'); pg.wait_for_timeout(300)
    txt = pg.inner_text('#story'); print('result:', txt[:200].replace('\n', ' | ')); assert 'wakes up' in txt
    assert pg.evaluate('TBLine.progress.lanterns.tin') == 0
    prog = json.loads(pg.evaluate('JSON.stringify(TBLine.progress)'))
    print('critters', [(c['id'], c['nature'], c['temper']) for c in prog['critters']], 'owned', prog['owned'], 'seen', prog['seen'])
    assert len(prog['critters']) == 3
    assert prog['enc']['cinder'][0]['uid'] != json.loads(enc0)['uid'], 'encounter did not reroll'
    pg.screenshot(path='shots/catch-3-woken.png')
    pg.click('[data-s="binder"]'); pg.wait_for_timeout(300)
    txt = pg.inner_text('#story'); print('binder:', txt[:200].replace('\n', ' | ')); assert 'of 24 critters' in txt and 'Lamplight' in txt
    pg.screenshot(path='shots/catch-4-binder.png', full_page=True)
    # second game: lose via dev, leave it sleeping, no change
    pg.click('[data-s="depot"]'); pg.click('[data-s="pickup:1"]'); pg.wait_for_timeout(200); pg.click('[data-s="deal"]'); pg.wait_for_timeout(600)
    pg.click('#bMenu'); pg.click('[data-act="devLose"]'); pg.wait_for_timeout(400)
    assert 'They took it' in pg.inner_text('#story'); pg.click('[data-s="wake:skip"]'); pg.wait_for_timeout(200)
    assert 'leave it be' in pg.inner_text('#story')
    assert len(json.loads(pg.evaluate('JSON.stringify(TBLine.progress.critters)'))) == 3
    # sharp owlet at the back room: dev feats fill the meter? (not a pickup) and the normal night still works
    pg.click('[data-s="depot"]'); pg.click('[data-s="sitdown"]'); pg.wait_for_timeout(200); pg.click('[data-s="deal"]'); pg.wait_for_timeout(600)
    assert pg.locator('#wild .wild-row').count() == 0, 'wild panel should not show in the back room'
    pg.click('#bMenu'); pg.click('[data-act="devWinFeats"]'); pg.wait_for_timeout(400)
    txt = pg.inner_text('#story'); assert 'Brass lantern' in txt, txt[:300]; print('quest reward:', [l for l in txt.split('\n') if 'lantern' in l.lower()])
    print('scroll', pg.evaluate('document.documentElement.scrollWidth'))
    b.close()
print('errors', errors)
