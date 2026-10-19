import os, sys
from playwright.sync_api import sync_playwright
errs = []
BOT = """
() => { const S = SURF, U = SURFUI.U, game = document.getElementById('game');
  window.__bot = {presses:0};
  const done = new Set();
  const loop = () => { if (!U.playing) return; requestAnimationFrame(loop);
    if (U.paused) return;
    const t = SURFUI.songAt(performance.now()) - U.calib, H = innerHeight, W = innerWidth;
    const FT = H*0.39, FB = H*0.8;
    const nx = U.run.chart.find(n => !n.judged && (n.type==='gate'||n.type==='spray') && n.t > t);
    if (nx && nx.t - t < 0.5) { const y = FT + nx.y*(FB-FT); game.dispatchEvent(new PointerEvent('pointerdown',{clientX:40,clientY:y,pointerId:2,bubbles:true})); game.dispatchEvent(new PointerEvent('pointerup',{clientX:40,clientY:y,pointerId:2,bubbles:true})); }
    for (const n of U.run.chart) { if (n.type==='spray'||done.has(n.id)) continue; if (n.t > t + 0.02) break;
      if (Math.abs(n.t - t) <= 0.02) { done.add(n.id); game.dispatchEvent(new PointerEvent('pointerdown',{clientX:W*0.8,clientY:H*0.5,pointerId:3,bubbles:true})); window.__bot.presses++; } }
  }; loop(); }
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.getcwd() + '/surf.html'); pg.wait_for_timeout(1200)
    pg.screenshot(path='s_title.png')
    pg.click('[data-act=ride]'); pg.wait_for_timeout(300); pg.screenshot(path='s_how.png', full_page=True)
    pg.click('[data-act=ride]'); pg.wait_for_timeout(200)
    pg.evaluate(BOT)
    pg.wait_for_timeout(3500); pg.screenshot(path='s_intro.png')
    pg.wait_for_timeout(5500); pg.screenshot(path='s_hook1.png')
    pg.wait_for_timeout(9000); pg.screenshot(path='s_hook1b.png')
    pg.wait_for_timeout(12000); pg.screenshot(path='s_verse.png')
    # pause / resume
    pg.click('#menuBtn'); pg.wait_for_timeout(300); pg.screenshot(path='s_pause.png')
    pg.click('[data-act=resume]'); pg.wait_for_timeout(300); pg.evaluate(BOT)
    pg.wait_for_timeout(15000); pg.screenshot(path='s_hook2.png')
    pg.wait_for_function('() => !SURFUI.U.playing', timeout=60000); pg.wait_for_timeout(500)
    pg.screenshot(path='s_results.png', full_page=True)
    print('result', pg.evaluate('() => JSON.stringify(SURFUI.U.lastRes)'))
    print('presses', pg.evaluate('() => window.__bot.presses'))
    pg.click('[data-act=feedback]'); pg.wait_for_timeout(200)
    pg.click('[data-act=fbSend]'); pg.wait_for_timeout(200); print('err shown:', pg.inner_text('#fbErr'))
    pg.click('[data-fq=fun][data-fv="4"]'); pg.click('[data-fq=dir][data-fv="Surfing"]'); pg.fill('#fbNote', 'test note')
    pg.click('[data-act=fbSend]'); pg.wait_for_timeout(11500); pg.screenshot(path='s_fb.png', full_page=True)
    pg.click('[data-act=title]'); pg.wait_for_timeout(200); pg.click('[data-act=cal]'); pg.wait_for_timeout(200); pg.screenshot(path='s_cal.png', full_page=True)
    print('scrollWidth', pg.evaluate('document.documentElement.scrollWidth'))
    pg.set_viewport_size({'width': 320, 'height': 640}); pg.wait_for_timeout(300)
    pg.click('[data-act=title]'); pg.wait_for_timeout(200); pg.screenshot(path='s_320.png', full_page=True)
    print('scrollWidth320', pg.evaluate('document.documentElement.scrollWidth'))
    print('errors', errs[:8])
    b.close()
