# Online 1v1 in two real browser pages against the local room server: make a room, join it with the code, pick,
# ready up, and play a whole match with every move going through the server. Both pages must end on the same game.
# Run: python3 test-online.py (after build.py). Needs Node and `npm install` in ../server.
# (c) 2026 justaskjoe. All rights reserved.
import pathlib, subprocess, sys, time, os
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).parent
build = here.parent / 'builds' / 'wormsbound.html'
shots = here / 'shots'; shots.mkdir(exist_ok=True)
PORT = 8437
srv = subprocess.Popen(['node', 'node-server.js'], cwd=here.parent / 'server', env=dict(os.environ, PORT=str(PORT)), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
time.sleep(0.8)
errs = []
benign = ('net::', 'fonts.g', 'URL scheme "file"', 'Failed to load resource')
url = build.as_uri() + f'?server=ws://localhost:{PORT}'
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pages = []
        for who in ('Ana', 'Ben'):
            pg = b.new_page(viewport={'width': 1280, 'height': 720})
            pg.on('pageerror', lambda e, w=who: errs.append(f'{w}: {e}'))
            pg.on('console', lambda m, w=who: errs.append(f'{w} console: {m.text}') if m.type == 'error' and not any(x in m.text for x in benign) else None)
            pg.goto(url); pg.wait_for_timeout(400); pg.click('[data-act=online]'); pg.fill('#oName', who); pages.append(pg)
        A, B = pages
        A.screenshot(path=str(shots / 'o1_online.png'))
        A.click('[data-act=ocreate]'); A.wait_for_function("() => WBUI.ui.net && WBUI.ui.net.room && WBUI.ui.net.room.seats[0]", timeout=5000)
        code = A.evaluate('() => WBUI.ui.net.code'); print('room code', code)
        B.fill('#oCode', code); B.click('[data-act=ojoin]')
        A.wait_for_function("() => WBUI.ui.net.room.seats[1]", timeout=5000)
        A.click('[data-act=opick][data-char=brick]'); B.click('[data-act=opick][data-char=gale]')
        A.wait_for_function("() => WBUI.ui.net.room.seats.every(s => s && s.char)", timeout=5000)
        A.screenshot(path=str(shots / 'o2_lobby.png'))
        A.click('[data-act=oready]'); B.click('[data-act=oready]')
        for pg in pages: pg.wait_for_function("() => WBUI.ui.screen === 'game' && WBUI.G", timeout=5000)
        print('both in the game; seats', A.evaluate('() => WBUI.ui.you'), B.evaluate('() => WBUI.ui.you'), 'chars', A.evaluate('() => WBUI.G.chars'))
        # a real drag-and-release shot from whoever goes first, through the server
        first = A if A.evaluate('() => WBUI.G.team === WBUI.ui.you') else B
        other = B if first is A else A
        assert other.locator('[data-act=fire]').count() == 0 or other.evaluate('() => !WBUI.G || WBUI.G.team !== WBUI.ui.you'), 'only one side may act'
        u = first.evaluate("""() => { const u = WB.current(WBUI.G), [cx, cy] = WB.center(u), r = document.querySelector('#map').getBoundingClientRect(); return { x: r.left + cx * 8, y: r.top + cy * 8, team: u.team, xx: u.x }; }""")
        dx = -150 if u['xx'] < 80 else 150
        first.mouse.move(u['x'], u['y']); first.mouse.down(); first.mouse.move(u['x'] + dx, u['y'] + 110, steps=8)
        other.wait_for_timeout(300); other.screenshot(path=str(shots / 'o3_opponent_sees_aim.png'))
        saw_aim = other.evaluate('() => !!WBUI.ui.remoteAim'); print('the other page sees the aim live:', saw_aim)
        first.mouse.up()
        for pg in pages: pg.wait_for_function('() => WBUI.G.stats.shots === 1', timeout=8000)
        first.wait_for_timeout(600); first.screenshot(path=str(shots / 'o4_shot.png'))
        # the rest by bots on each page, still through the server
        pages_fast = [pg.evaluate('() => { WBUI.ui.fast = true; WBUI.ui.timerOn = false; }') for pg in pages]
        deadline = time.time() + 240
        while time.time() < deadline:
            scr = [pg.evaluate('() => WBUI.ui.screen') for pg in pages]
            if all(x == 'end' for x in scr): break
            for pg in pages:
                s = pg.evaluate('() => WBUI.ui.screen')
                if s == 'round' and pg.locator('[data-act=next]').count() and 'WAITING' not in pg.inner_text('[data-act=next]'): pg.click('[data-act=next]')
                elif s == 'game':
                    pg.evaluate("""() => { const G = WBUI.G, n = WBUI.ui.net; if (!G || G.phase !== 'aim' || G.team !== WBUI.ui.you || n.queue.length || n.waiting || n.planned === G.seed + '/' + G.turn) return;
                      n.planned = G.seed + '/' + G.turn; for (const it of WB.botTurn(JSON.parse(JSON.stringify(G)), 'smart')) WBUI.play(it); }""")
            time.sleep(0.15)
        res = [pg.evaluate('() => ({ screen: WBUI.ui.screen, wins: WBUI.ui.wins, hash: WB.hash(WBUI.G), round: WBUI.ui.round })') for pg in pages]
        print('end:', res)
        assert all(r['screen'] == 'end' for r in res), 'both pages should reach the end of the match'
        assert res[0]['hash'] == res[1]['hash'] and res[0]['wins'] == res[1]['wins'], 'both pages must end on the same game'
        A.screenshot(path=str(shots / 'o5_end.png'))
        # rematch: both ask, a new match starts on both
        A.click('[data-act=rematch]'); B.keyboard.press('r')
        for pg in pages: pg.wait_for_function("() => WBUI.ui.screen === 'game' && WBUI.ui.round === 1 && WBUI.ui.wins.every(x => x === 0)", timeout=5000)
        print('rematch started on both pages')
        # a dropped connection comes back by itself
        B.evaluate('() => WBUI.ui.net.ws.close()')
        B.wait_for_function('() => WBUI.ui.net && WBUI.ui.net.ws.readyState === 1 && WBUI.ui.net.retries === 0', timeout=8000)
        print('reconnected after a drop:', B.evaluate('() => WBUI.ui.screen'))
        print('errors', errs[:8])
        b.close()
finally:
    srv.terminate()
sys.exit(1 if errs else 0)
