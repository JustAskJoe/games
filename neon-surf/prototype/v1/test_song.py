import os
from playwright.sync_api import sync_playwright
errs = []
BOT = open('test.py').read().split('BOT = """')[1].split('"""')[0]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'ERR_TUNNEL' not in m.text else None)
    pg.goto('file://' + os.getcwd() + '/surf.html'); pg.wait_for_timeout(1000)
    pg.screenshot(path='v2_title.png')
    pg.click('[data-act=song]'); pg.wait_for_timeout(200)
    pg.set_input_files('#songFile', 'fake_song.wav')
    pg.wait_for_function('() => SURFUI.U.song', timeout=20000); pg.wait_for_timeout(300)
    print('detected', pg.evaluate('() => ({bpm: SURFUI.U.song.bpm, off: SURFUI.U.song.offset, dur: SURFUI.U.song.dur})'), 'expected 100.8 / 0.42')
    pg.screenshot(path='v2_song.png', full_page=True)
    pg.click('[data-act=preview]'); pg.wait_for_timeout(1500); pg.click('[data-act=preview]'); pg.wait_for_timeout(200)
    pg.click('[data-act=nudge][data-v="0.02"]'); print('after nudge later', pg.evaluate('() => SURFUI.U.song.offset'))
    pg.click('[data-act=nudge][data-v="-0.02"]')
    pg.click('[data-act=rideSong]'); pg.wait_for_timeout(200)   # first time -> how
    pg.click('[data-act=ride]'); pg.wait_for_timeout(200)
    print('mode', pg.evaluate('() => [SURFUI.U.mode, SURF.MODE, SURF.BPM, SURF.DURATION.toFixed(1), SURFUI.U.run.chart.length]'))
    pg.evaluate(BOT)
    pg.wait_for_timeout(30000); pg.screenshot(path='v2_ride.png')
    pg.wait_for_function('() => !SURFUI.U.playing', timeout=90000); pg.wait_for_timeout(500)
    pg.screenshot(path='v2_results.png', full_page=True)
    print('result', pg.evaluate('() => JSON.stringify(SURFUI.U.lastRes)'))
    pg.click('[data-act=title]'); pg.wait_for_timeout(200); pg.screenshot(path='v2_title2.png')
    pg.click('[data-act=rideTest]'); pg.wait_for_timeout(500)
    print('test mode', pg.evaluate('() => [SURF.MODE, SURF.DURATION.toFixed(1)]'))
    print('scrollWidth', pg.evaluate('document.documentElement.scrollWidth'))
    print('errors', errs[:8])
    b.close()
