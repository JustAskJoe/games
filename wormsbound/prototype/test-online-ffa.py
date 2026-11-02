# Online free-for-all in six real browser pages against the local room server: one page makes a free-for-all room,
# five join with the code, everyone picks and readies, the host starts, and bots on each page play the whole game
# through the server. All six pages must end on the same game; then everyone is back in the room for another.
# Run: python3 test-online-ffa.py (after build.py). Needs Node and `npm install` in ../server.
# (c) 2026 justaskjoe. All rights reserved.
import pathlib, subprocess, sys, time, os
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).parent
build = here.parent / 'builds' / 'wormsbound.html'
shots = here / 'shots'; shots.mkdir(exist_ok=True)
PORT = 8438
srv = subprocess.Popen(['node', 'node-server.js'], cwd=here.parent / 'server', env=dict(os.environ, PORT=str(PORT)), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
time.sleep(0.8)
errs = []
benign = ('net::', 'fonts.g', 'URL scheme "file"', 'Failed to load resource')
url = build.as_uri() + f'?server=ws://localhost:{PORT}'
NAMES = ['Ana', 'Ben', 'Cy', 'Dee', 'Eli', 'Fay']
CHARS = ['brick', 'zip', 'volt', 'digger', 'gale', 'brick']
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pages = []
        for who in NAMES:
            pg = b.new_page(viewport={'width': 1280, 'height': 720})
            pg.on('pageerror', lambda e, w=who: errs.append(f'{w}: {e}'))
            pg.on('console', lambda m, w=who: errs.append(f'{w} console: {m.text}') if m.type == 'error' and not any(x in m.text for x in benign) else None)
            pg.goto(url); pg.wait_for_timeout(300); pg.click('[data-act=online]'); pg.fill('#oName', who); pages.append(pg)
        H = pages[0]
        H.screenshot(path=str(shots / 'f1_online.png'))
        H.click('[data-act=ocreateffa]'); H.wait_for_function("() => WBUI.ui.net && WBUI.ui.net.room && WBUI.ui.net.room.seats[0]", timeout=5000)
        code = H.evaluate('() => WBUI.ui.net.code'); mode = H.evaluate('() => WBUI.ui.net.room.mode'); print('room code', code, 'mode', mode)
        assert mode == 'ffa', 'the room should be a free-for-all'
        for pg in pages[1:]:
            pg.fill('#oCode', code); pg.click('[data-act=ojoin]')
        H.wait_for_function("() => WBUI.ui.net.room.seats.filter(Boolean).length === 6", timeout=8000)
        for pg, ch in zip(pages, CHARS): pg.click(f'[data-act=opick][data-char={ch}]')
        H.wait_for_function("() => WBUI.ui.net.room.seats.every(s => s && s.char)", timeout=5000)
        assert H.locator('[data-act=ostart]').is_disabled(), 'Start waits until everyone is ready'
        assert pages[1].locator('[data-act=ostart]').count() == 0, 'only the host sees Start'
        for pg in pages: pg.click('[data-act=oready]')
        H.wait_for_function("() => !document.querySelector('[data-act=ostart]').disabled", timeout=5000)
        H.screenshot(path=str(shots / 'f2_lobby_six.png'))
        H.click('[data-act=ostart]')
        for pg in pages: pg.wait_for_function("() => WBUI.ui.screen === 'game' && WBUI.G && WBUI.G.teams === 6", timeout=8000)
        sides = [pg.evaluate('() => WBUI.ui.you') for pg in pages]
        print('all six in the game; sides', sides, 'chars', H.evaluate('() => WBUI.G.chars'))
        assert sorted(sides) == [0, 1, 2, 3, 4, 5], 'each page plays a different side'
        H.wait_for_timeout(500); H.screenshot(path=str(shots / 'f3_six_way_hud.png'))
        hud = H.evaluate("""() => { const r = document.querySelector('#hud').getBoundingClientRect(), t = [...document.querySelectorAll('#hud .team')].map(e => e.getBoundingClientRect());
          return { n: t.length, overlap: t.some((a, i) => t.some((b, j) => i < j && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1)), inside: t.every(a => a.left >= r.left - 1 && a.right <= r.right + 1), sw: document.documentElement.scrollWidth }; }""")
        print('HUD:', hud)
        assert hud['n'] == 6 and not hud['overlap'] and hud['inside'], 'six health bars fit on the HUD without overlapping'
        for pg in pages: pg.evaluate('() => { WBUI.ui.fast = true; WBUI.ui.timerOn = false; }')
        deadline = time.time() + 420
        while time.time() < deadline:
            if all(pg.evaluate('() => WBUI.ui.screen') == 'end' for pg in pages): break
            for pg in pages:
                pg.evaluate("""() => { const G = WBUI.G, n = WBUI.ui.net; if (WBUI.ui.screen !== 'game' || !G || G.phase !== 'aim' || G.team !== WBUI.ui.you || n.queue.length || n.waiting || n.planned === G.seed + '/' + G.turn) return;
                  n.planned = G.seed + '/' + G.turn; for (const it of WB.botTurn(JSON.parse(JSON.stringify(G)), 'smart')) WBUI.play(it); }""")
            time.sleep(0.15)
        res = [pg.evaluate('() => ({ screen: WBUI.ui.screen, winner: WBUI.G.winner, turns: WBUI.G.turn, hash: WB.hash(WBUI.G) })') for pg in pages]
        print('end:', res[0], '· same on all six:', len({r['hash'] for r in res}) == 1)
        assert all(r['screen'] == 'end' for r in res), 'all six pages should reach the end'
        assert len({r['hash'] for r in res}) == 1, 'all six pages must end on the same game'
        H.screenshot(path=str(shots / 'f4_end.png'))
        # back to the room, ready up again
        for pg in pages: pg.click('[data-act=olobby]')
        for pg in pages: pg.wait_for_function("() => WBUI.ui.screen === 'lobby'", timeout=5000)
        assert H.locator('[data-act=ostart]').is_disabled(), 'after a game everyone has to ready up again'
        print('everyone is back in the room; Start waits for Ready again')
        # phone width: the lobby and the HUD still fit
        H.set_viewport_size({'width': 390, 'height': 844}); H.wait_for_timeout(300)
        print('scrollWidth390', H.evaluate('() => document.documentElement.scrollWidth'))
        H.screenshot(path=str(shots / 'f5_lobby_phone.png'))
        print('errors', errs[:8])
        b.close()
finally:
    srv.terminate()
sys.exit(1 if errs else 0)
