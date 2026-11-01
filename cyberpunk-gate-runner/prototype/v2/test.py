# Phone test: plays a full run at 390x844 with an in-page bot that steers through real pointer drags,
# then checks the results, feedback and pause screens, and 320px wide. Fails on any JS error or sideways scroll.
# Screenshots go to /tmp/gr-shots (pass a folder to change it).  © 2026 justaskjoe. All rights reserved.
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__))
build = os.path.join(here, '..', '..', 'builds', 'cyberpunk-gate-runner.html')
shots = sys.argv[1] if len(sys.argv) > 1 else '/tmp/gr-shots'
os.makedirs(shots, exist_ok=True)
errs, fails = [], []
BOT = """
() => { const U = GRUI.U, game = document.getElementById('game'), r = GR.rng(3);
  const W = innerWidth, H = innerHeight, cx = W / 2, rw = Math.min(W * 0.47, 300) * 0.85;
  game.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: H * 0.6, pointerId: 7, bubbles: true }));
  const x0 = U.G.tx;
  const loop = () => { if (!U.playing) return; requestAnimationFrame(loop); if (U.paused) return;
    const want = GR.BOTS.smart(U.G, r);
    game.dispatchEvent(new PointerEvent('pointermove', { clientX: cx + (want - x0) * rw, clientY: H * 0.6, pointerId: 7, bubbles: true })); };
  loop(); }
"""
def shot(pg, name): pg.screenshot(path=os.path.join(shots, name + '.png'))
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    pg.goto('file://' + os.path.abspath(build)); pg.wait_for_timeout(1000); shot(pg, '01-title')
    pg.click('[data-act=arsenal]'); pg.wait_for_timeout(200); shot(pg, '02-arsenal')
    if 'Overpierce' not in pg.inner_text('#card'): fails.append('weapons screen is missing upgrades')
    pg.click('[data-act=title]'); pg.wait_for_timeout(200)
    pg.click('[data-act=how]'); pg.wait_for_timeout(200); shot(pg, '02-how')
    pg.click('[data-act=play]'); pg.wait_for_timeout(300)
    pg.evaluate(BOT)
    for sec, name in [(5, '03-intro'), (9, '04-build'), (14, '05-build2'), (12, '06-riser')]:
        pg.wait_for_timeout(sec * 1000); shot(pg, name)
    pg.click('#menuBtn'); pg.wait_for_timeout(300); shot(pg, '07-pause')
    pg.click('[data-act=resume]'); pg.wait_for_timeout(200); pg.evaluate(BOT)
    pg.wait_for_function('() => GRUI.U.G && GRUI.U.G.oc.on', timeout=30000); pg.wait_for_timeout(700); shot(pg, '08-drop')
    pg.wait_for_function('() => GRUI.U.G && GRUI.U.G.ents.some(e => e.kind === "boss" && e.ta - GRUI.U.G.t < 1.6)', timeout=30000); shot(pg, '09-boss')
    pg.wait_for_function('() => !GRUI.U.playing', timeout=40000); pg.wait_for_timeout(500); shot(pg, '10-results')
    res = pg.evaluate('() => GRUI.U.lastRes'); print('result', res)
    aerr = pg.evaluate('() => GRUI.audioErrs'); print('audio errors', len(aerr))
    if aerr: fails.append('audio: %s' % aerr[:3])
    if not res or not res.get('won'): fails.append('smart bot lost the browser run: %s' % res)
    pg.click('[data-act=feedback]'); pg.wait_for_timeout(200)
    pg.click('[data-act=fbSend]'); pg.wait_for_timeout(200)
    if 'Tap at least one' not in pg.inner_text('#fbErr'): fails.append('feedback form sent with no answers')
    pg.click('[data-fq=again][data-fv=Yes]'); pg.click('[data-fq=drop][data-fv=Huge]'); pg.fill('#fbNote', 'test note')
    pg.click('[data-act=fbSend]'); pg.wait_for_timeout(1500); shot(pg, '11-feedback')
    if 'Copy answers' not in pg.inner_text('#card') and 'Thanks' not in pg.inner_text('#card'): fails.append('feedback did not finish')
    sw = pg.evaluate('document.documentElement.scrollWidth'); print('scrollWidth 390:', sw)
    if sw > 390: fails.append('sideways scroll at 390')
    # tester jump + retry speed
    pg.click('[data-act=title]'); pg.wait_for_timeout(200); pg.click('[data-act=play]'); pg.wait_for_timeout(500)
    pg.click('#menuBtn'); pg.click('[data-act=jumpDrop]'); pg.wait_for_timeout(2500); shot(pg, '12-jump-drop')
    if not pg.evaluate('() => GRUI.U.test && GRUI.U.G.t > 19 * GR.BAR'): fails.append('jump to drop failed')
    pg.set_viewport_size({'width': 320, 'height': 640}); pg.wait_for_timeout(400); shot(pg, '13-320-play')
    pg.click('#menuBtn'); pg.click('[data-act=title]'); pg.wait_for_timeout(300); shot(pg, '14-320-title')
    pg.click('[data-act=how]'); pg.wait_for_timeout(200); shot(pg, '15-320-how')
    sw = pg.evaluate('document.documentElement.scrollWidth'); print('scrollWidth 320:', sw)
    if sw > 320: fails.append('sideways scroll at 320')
    # full quality stills: software GL drops to the low tier during the run above, so lock tier 2 here to check the real look
    for vw, vh, tag in [(390, 844, 'phone'), (1440, 900, 'pc')]:
        hq = b.new_page(viewport={'width': vw, 'height': vh}); hq.on('pageerror', lambda e: errs.append(str(e)))
        hq.goto('file://' + os.path.abspath(build) + '#q=2'); hq.wait_for_timeout(1500); shot(hq, '16-hq-title-' + tag)
        hq.click('[data-act=play]'); hq.wait_for_timeout(400); hq.click('#menuBtn'); hq.click('[data-act=jumpDrop]')
        hq.wait_for_function('() => GRUI.U.G && GRUI.U.G.oc.on', timeout=40000); hq.wait_for_timeout(1500); shot(hq, '17-hq-drop-' + tag)
        if not hq.evaluate('() => GRR.ok && GRR.quality === 2'): fails.append('quality lock failed')
        hq.close()
    b.close()
if errs: fails.append('JS errors: %s' % errs[:5])
print('screenshots in', shots)
print('FAIL\n  ' + '\n  '.join(fails) if fails else 'ok   phone test passed')
sys.exit(1 if fails else 0)
