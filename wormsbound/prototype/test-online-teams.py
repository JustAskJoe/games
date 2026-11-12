# Online team battle in three real browser pages against the local room server: one page makes a team room, two join
# with the code, one changes team, the host sets 2 a side, and everyone plays one unit; the server's computer plays the
# fourth. Bots on each page play their own unit's turns through the server. All pages must end on the same game.
# Run: python3 test-online-teams.py (after build.py). Needs Node and `npm install` in ../server.
# (c) 2026 justaskjoe. All rights reserved.
import pathlib, subprocess, sys, time, os
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).parent
build = here.parent / 'builds' / 'wormsbound.html'
shots = here / 'shots'; shots.mkdir(exist_ok=True)
PORT = 8439
srv = subprocess.Popen(['node', 'node-server.js'], cwd=here.parent / 'server', env=dict(os.environ, PORT=str(PORT)), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
time.sleep(0.8)
errs = []
benign = ('net::', 'fonts.g', 'URL scheme "file"', 'Failed to load resource')
url = build.as_uri() + f'?server=ws://localhost:{PORT}'
NAMES = ['Ana', 'Ben', 'Cy']
CHARS = ['brick', 'zip', 'gale']
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
        H.click('[data-act=ocreateteams]'); H.wait_for_function("() => WBUI.ui.net && WBUI.ui.net.room && WBUI.ui.net.room.seats[0]", timeout=5000)
        code = H.evaluate('() => WBUI.ui.net.code'); mode = H.evaluate('() => WBUI.ui.net.room.mode'); print('room code', code, 'mode', mode)
        assert mode == 'teams', 'the room should be a team battle'
        for pg in pages[1:]:
            pg.fill('#oCode', code); pg.click('[data-act=ojoin]'); pg.wait_for_function("() => WBUI.ui.screen === 'lobby' && WBUI.ui.net.room && WBUI.ui.net.room.seats[WBUI.ui.seat]", timeout=8000)
        seats = [pg.evaluate('() => WBUI.ui.seat') for pg in pages]; print('seats', seats)
        assert seats == [0, 5, 1], 'joining fills the two teams evenly'
        assert pages[1].locator('[data-act=osize]').first.is_disabled(), 'only the host can change the team size'
        H.click('[data-act=osize][data-n="2"]'); H.wait_for_function("() => WBUI.ui.net.room.size === 2", timeout=5000)
        for pg, ch in zip(pages, CHARS): pg.click(f'[data-act=opick][data-char={ch}]')
        H.wait_for_function("() => WBUI.ui.net.room.seats.filter(Boolean).every(s => s.char)", timeout=5000)
        for pg in pages: pg.click('[data-act=oready]')
        H.wait_for_function("() => { const b = document.querySelector('[data-act=ostart]'); return b && !b.disabled; }", timeout=5000)
        H.screenshot(path=str(shots / 't1_team_lobby.png'))
        H.click('[data-act=ostart]')
        for pg in pages: pg.wait_for_function("() => WBUI.ui.screen === 'game' && WBUI.G && WBUI.G.size === 2", timeout=8000)
        st = H.evaluate("() => ({ units: WBUI.G.units.length, owners: WBUI.G.units.map(u => u.own), you: WBUI.ui.you })"); print('in the game:', st, 'teams', [pg.evaluate('() => WBUI.ui.you') for pg in pages])
        assert st['units'] == 4 and sorted(st['owners']) == [-1, 0, 1, 5], 'three units have players and one is a computer'
        assert [pg.evaluate('() => WBUI.ui.you') for pg in pages] == [0, 1, 0], 'each page knows its team'
        H.wait_for_timeout(600); H.screenshot(path=str(shots / 't2_team_game.png'))
        for pg in pages: pg.evaluate('() => { WBUI.ui.fast = true; WBUI.ui.timerOn = false; }')
        deadline = time.time() + 420
        while time.time() < deadline:
            if all(pg.evaluate('() => WBUI.ui.screen') == 'end' for pg in pages): break
            for pg in pages:
                pg.evaluate("""() => { const G = WBUI.G, n = WBUI.ui.net; if (WBUI.ui.screen !== 'game' || !G || G.phase !== 'aim' || WB.owner(G) !== WBUI.ui.seat || n.queue.length || n.waiting || n.planned === G.seed + '/' + G.turn) return;
                  n.planned = G.seed + '/' + G.turn; for (const it of WB.botTurn(JSON.parse(JSON.stringify(G)), 'smart')) WBUI.play(it); }""")
            time.sleep(0.15)
        res = [pg.evaluate('() => ({ screen: WBUI.ui.screen, winner: WBUI.G.winner, turns: WBUI.G.turn, hash: WB.hash(WBUI.G) })') for pg in pages]
        print('end:', res[0], '· same on all three:', len({r['hash'] for r in res}) == 1)
        assert all(r['screen'] == 'end' for r in res), 'all three pages should reach the end'
        assert len({r['hash'] for r in res}) == 1, 'all three pages must end on the same game'
        H.screenshot(path=str(shots / 't3_team_end.png'))
        for pg in pages: pg.click('[data-act=olobby]')
        for pg in pages: pg.wait_for_function("() => WBUI.ui.screen === 'lobby'", timeout=5000)
        print('everyone is back in the room')
        print('errors', errs[:8])
        b.close()
finally:
    srv.terminate()
sys.exit(1 if errs else 0)
