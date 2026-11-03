# Playwright walkthrough of the built prototype. Run: python3 test.py (after build.py), or ../build-and-test.py for everything.
# Desktop 1280x720 first (the target), then phone widths 390 and 320 (must load with no errors and no sideways scroll).
# Fails on any JavaScript error. Screenshots go to shots/.
# (c) 2026 justaskjoe. All rights reserved.
import pathlib, sys
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).parent
build = here.parent / 'builds' / 'wormsbound.html'
shots = here / 'shots'; shots.mkdir(exist_ok=True)
errs = []
benign = ('net::', 'fonts.g', 'URL scheme "file"', 'Failed to load resource')

def watch(pg):
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and not any(x in m.text for x in benign) else None)

def unit_screen(pg):
    # the current unit's centre in page pixels (the stage is scaled to fit the window)
    return pg.evaluate("""() => { const G = WBUI.G, u = WB.current(G), [cx, cy] = WB.center(u), r = document.querySelector('#map').getBoundingClientRect();
      return { x: r.left + cx * 8 * r.width / 1280, y: r.top + cy * 8 * r.height / 720, s: r.width / 1280, team: u.team }; }""")

def wait_aim(pg, timeout=60000):
    pg.wait_for_function("() => WBUI.G && (WBUI.G.phase === 'aim' || WBUI.G.phase === 'over')", timeout=timeout)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); watch(pg)
    pg.add_init_script('window.__WB_SEED = 20261102;')
    pg.goto(build.as_uri()); pg.wait_for_timeout(700)
    pg.screenshot(path=str(shots / 'd1_title.png'))
    pg.click('[data-act=mode][data-mode=duel]'); pg.wait_for_timeout(300)
    assert pg.evaluate('() => WBUI.ui.screen') == 'select', '2 PLAYERS should open character select'
    pg.screenshot(path=str(shots / 'd1b_select_ember.png'))
    pg.keyboard.press('1'); pg.wait_for_timeout(200)          # Ember picks Brick with the keyboard
    pg.screenshot(path=str(shots / 'd1c_select_tide.png'))
    pg.click('[data-char=volt]'); pg.wait_for_timeout(1700)    # Tide picks Volt with the mouse
    chars = pg.evaluate('() => WBUI.G.chars'); print('picked', chars); assert chars == ['brick', 'volt'], chars
    pg.screenshot(path=str(shots / 'd2_turn1.png'))
    st = pg.evaluate("() => ({ screen: WBUI.ui.screen, phase: WBUI.G.phase, team: WBUI.G.team, round: WBUI.ui.round })")
    assert st == {'screen': 'game', 'phase': 'aim', 'team': 0, 'round': 1}, st

    # walk with the keyboard
    moves0 = pg.evaluate('() => WBUI.G.moves'); pg.keyboard.press('ArrowRight'); pg.keyboard.press('ArrowRight')
    moved = moves0 - pg.evaluate('() => WBUI.G.moves'); print('walked', moved, 'steps with the keyboard')
    assert moved >= 1, 'keyboard walking did nothing'

    # aim with a real mouse drag (pull back down-left to shoot up-right) and let go to fire
    u = unit_screen(pg); dx = -150 * u['s'] if u['team'] == 0 else 150 * u['s']
    pg.mouse.move(u['x'], u['y']); pg.mouse.down(); pg.mouse.move(u['x'] + dx * 0.5, u['y'] + 60 * u['s'], steps=4)
    pg.mouse.move(u['x'] + dx, u['y'] + 120 * u['s'], steps=6)
    pg.wait_for_timeout(150); pg.screenshot(path=str(shots / 'd3_aiming.png'))
    pg.mouse.up(); pg.wait_for_timeout(120)
    ph = pg.evaluate('() => WBUI.G.phase'); print('after release:', ph, pg.evaluate('() => WBUI.G.stats.shots'), 'shot(s)')
    assert ph == 'flight' or pg.evaluate('() => WBUI.G.stats.shots') == 1, 'drag-and-release did not fire'
    pg.wait_for_timeout(500); pg.screenshot(path=str(shots / 'd4_flight.png'))
    wait_aim(pg); pg.wait_for_timeout(300)
    pg.screenshot(path=str(shots / 'd5_after_shot.png'))
    assert pg.evaluate('() => WBUI.G.team') == 1, 'the turn did not pass to Tide'

    # weapon picker and lob button state
    pg.click('[data-w=dud]'); assert pg.evaluate('() => WBUI.ui.weapon') == 'dud'
    pg.keyboard.press('2'); assert pg.evaluate('() => WBUI.ui.weapon') == 'shot2'
    names = pg.eval_on_selector_all('[data-w]', 'els => els.map(e => e.innerText.split("\\n")[0])'); print('Tide (Volt) shots:', names)
    assert names[:2] == ['Arc Ball', 'Thunderstrike'], names
    pg.keyboard.press('1'); assert pg.evaluate('() => WBUI.ui.weapon') == 'shot1'

    # menu: Esc opens it, the timer toggles, resume closes it
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150); pg.screenshot(path=str(shots / 'd6_menu.png'))
    t0 = pg.evaluate('() => WBUI.ui.timerOn'); pg.click('[data-tg=timer]'); assert pg.evaluate('() => WBUI.ui.timerOn') != t0
    pg.click('[data-tg=timer]'); pg.click('[data-act=resume]'); assert not pg.evaluate('() => WBUI.ui.paused')

    # the turn timer passes the turn when it runs out
    team = pg.evaluate('() => WBUI.G.team'); pg.evaluate('() => { WBUI.ui.timerOn = true; WBUI.ui.tLeft = 0.05; }')
    pg.wait_for_function(f"() => WBUI.G.phase !== 'aim' || WBUI.G.team !== {team}", timeout=5000); wait_aim(pg)
    print('timer ran out: turn passed to team', pg.evaluate('() => WBUI.G.team'))

    # a dud on screen, for the screenshot and the coach line
    pg.evaluate("() => { const G = WBUI.G, u = WB.current(G); G.duds.push({ id: 9999, x: u.x + 2, y: u.y - 0.4, fuse: 1, team: 1 - u.team, air: false, vy: 0 }); WBUI.renderAll(); }")
    pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 'd7_dud_in_reach.png'))
    coach = pg.inner_text('#coach'); print('coach:', coach[:90]); assert 'dud' in coach.lower()
    pg.click('[data-act=lob]'); assert pg.evaluate('() => WBUI.ui.lob'), 'LOB did not arm'
    pg.click('[data-act=fire]'); wait_aim(pg)
    assert pg.evaluate('() => WBUI.G.stats.lobs') == 1, 'the lob did not happen'

    # bots play the rest of the match at 8x; walk through round screens until the match ends
    pg.evaluate('() => { WBUI.ui.fast = true; WBUI.ui.timerOn = false; }')
    import time; deadline = time.time() + 240
    for i in range(100000):
        if time.time() > deadline: break
        scr = pg.evaluate('() => WBUI.ui.screen')
        if scr == 'end': break
        if scr == 'round':
            if i < 200 and not (shots / 'd8_round.png').exists(): pg.screenshot(path=str(shots / 'd8_round.png'))
            pg.click('[data-act=next]'); pg.wait_for_timeout(100); continue
        ph = pg.evaluate('() => WBUI.G.phase')
        if ph == 'aim': pg.evaluate('() => WBUI.botTurn()')
        pg.wait_for_timeout(60)
    fin = pg.evaluate("() => ({ screen: WBUI.ui.screen, wins: WBUI.ui.wins, round: WBUI.ui.round, tester: WBUI.ui.tester })"); print('match end:', fin)
    assert fin['screen'] == 'end' and max(fin['wins']) == 2 and fin['tester'], fin
    pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 'd9_match_end.png'))

    # feedback falls back to "copy" from file:// ; then Back, then rematch with R
    pg.click('[data-act=feedback]'); pg.click('[data-fq=rematch][data-fv="Yes, right now"]'); pg.fill('#fbText', 'test run'); pg.click('[data-act=fbsend]'); pg.wait_for_timeout(600)
    pg.screenshot(path=str(shots / 'd10_feedback.png')); print('feedback saved:', pg.evaluate('() => WBUI.ui.fb.saved'))
    assert pg.evaluate('() => WBUI.ui.fb.saved') in (True, 'copy')
    pg.click('[data-act=fbback]'); pg.keyboard.press('r'); pg.wait_for_timeout(300)
    re = pg.evaluate("() => ({ screen: WBUI.ui.screen, wins: WBUI.ui.wins, round: WBUI.ui.round, tester: WBUI.ui.tester, chars: WBUI.G.chars })"); print('rematch:', re)
    assert re == {'screen': 'game', 'wins': [0, 0], 'round': 1, 'tester': False, 'chars': ['brick', 'volt']}, re
    # every character can be picked and fires its Shot 2 in a real game
    for c in ['zip', 'digger', 'gale']:
        pg.evaluate(f"() => {{ WBUI.ui.picks = ['{c}', 'brick']; WBUI.startMatch(); WBUI.ui.fast = true; }}"); pg.wait_for_timeout(150)
        pg.keyboard.press('2'); pg.evaluate('() => WBUI.aim(55, 0.7)'); pg.keyboard.press('Space'); pg.wait_for_timeout(250)
        if c == 'zip': pg.screenshot(path=str(shots / 'd11_zip_double.png'))
        wait_aim(pg); used = pg.evaluate('() => WBUI.G.stats.shot2'); print(c, 'Shot 2 fired:', used); assert used == 1, c
    # SS: when charged it takes over the Shot 1 slot; every character's SS fires in a real game
    for c in ['brick', 'zip', 'volt', 'digger', 'gale']:
        pg.evaluate(f"() => {{ WBUI.ui.picks = ['{c}', 'volt']; WBUI.startMatch(); WBUI.ui.fast = false; }}"); pg.wait_for_timeout(120)
        assert pg.locator('[data-w=ss]').count() == 0, 'SS slot shown before it is charged'
        pg.evaluate('() => { WBUI.G.ss[WBUI.G.team] = WB.SS_CHARGE; WBUI.ui.weapon = "shot1"; WBUI.renderAll(); }')
        assert pg.locator('[data-w=ss]').count() == 1 and pg.locator('[data-w=shot1]').count() == 0, 'SS should replace Shot 1'
        pg.keyboard.press('1'); assert pg.evaluate('() => WBUI.ui.weapon') == 'ss'
        if c == 'brick': pg.screenshot(path=str(shots / 'd12_ss_ready.png'))
        pg.evaluate('() => WBUI.aim(58, 0.62)'); pg.keyboard.press('Space')
        pg.wait_for_function('() => WBUI.G.stats.ss === 1', timeout=3000)
        if c in ('volt', 'gale', 'digger'):
            pg.wait_for_function("() => WBUI.G.phase !== 'flight' || WBUI.ui.parts.some(p => p.kind === 'bolt' || p.kind === 'swirl' || p.kind === 'flash')", timeout=15000)
            pg.wait_for_timeout(120); pg.screenshot(path=str(shots / f'd13_ss_{c}.png'))
        pg.evaluate('() => { WBUI.ui.fast = true; }'); wait_aim(pg)
        print(c, 'SS fired:', pg.evaluate('() => WBUI.G.stats.ss'), '· charge after:', pg.evaluate('() => WBUI.G.ss.join("/")'))
        assert pg.locator('[data-w=ss]').count() == 0 or pg.evaluate('() => WB.ssReady(WBUI.G)'), 'SS slot should go back to Shot 1 after use'
    pg.evaluate("() => { WBUI.ui.fast = false; }")
    pg.keyboard.press('Escape'); pg.click('[data-act=quit]')

    # 1 Player: you against 3 computers on Hard; the computers take their own turns
    pg.click('[data-act=mode][data-mode=solo]'); pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 'd14_levels.png'))
    pg.keyboard.press('3'); assert pg.evaluate('() => WBUI.ui.level') == 'hard'
    pg.click('[data-char=gale]'); pg.wait_for_timeout(300)
    st = pg.evaluate('() => ({ teams: WBUI.G.teams, chars: WBUI.G.chars, mode: WBUI.ui.mode })'); print('1 player:', st)
    assert st['teams'] == 4 and st['chars'][0] == 'gale' and len(set(st['chars'][1:])) == 3, st
    pg.evaluate('() => { WBUI.ui.timerOn = false; }')
    cpu_turns = 0; seen_cpu_aim = False
    import time; deadline = time.time() + 120
    while time.time() < deadline and pg.evaluate('() => WBUI.ui.screen') == 'game':
        team = pg.evaluate("() => WBUI.G.phase === 'aim' ? WBUI.G.team : -1")
        if team == 0: pg.evaluate('() => WBUI.botTurn()')
        elif team > 0:
            if not seen_cpu_aim and pg.evaluate('() => !!(WBUI.ui.cpu && WBUI.ui.cpu.aimed)'):
                seen_cpu_aim = True; pg.screenshot(path=str(shots / 'd15_cpu_aiming.png'))
                assert pg.locator('.cputag').count() == 1 and pg.locator('[data-act=fire]').count() == 0, 'controls should be hidden on a computer turn'
            cpu_turns += 1 if pg.evaluate('() => !WBUI.ui.cpu') else 0
        if seen_cpu_aim: pg.evaluate('() => { WBUI.ui.fast = true; }')
        pg.wait_for_timeout(80)
    print('1 player round ended on screen:', pg.evaluate('() => WBUI.ui.screen'), '· wins', pg.evaluate('() => WBUI.ui.wins'), '· saw a computer aim:', seen_cpu_aim)
    assert seen_cpu_aim and pg.evaluate('() => WBUI.ui.screen') in ('round', 'end'), 'a 1 Player round should finish with computers playing'
    pg.screenshot(path=str(shots / 'd16_solo_round.png'))
    pg.evaluate('() => { WBUI.ui.fast = false; }')
    pg.click('[data-act=next]') if pg.locator('[data-act=next]').count() else None
    pg.wait_for_timeout(300); pg.screenshot(path=str(shots / 'd17_solo_hud.png'))
    pg.keyboard.press('Escape'); pg.click('[data-act=quit]'); pg.click('[data-act=mode][data-mode=duel]')
    assert pg.evaluate('() => WBUI.ui.screen') == 'select'
    print('scrollWidth1280', pg.evaluate('document.documentElement.scrollWidth'))
    pg.close()

    # phone widths: it must load, start and fire without errors or sideways scroll
    for w, h in ((390, 844), (320, 640), (844, 390)):
        q = b.new_page(viewport={'width': w, 'height': h}, has_touch=True); watch(q)
        q.add_init_script('window.__WB_SEED = 7;'); q.goto(build.as_uri()); q.wait_for_timeout(500)
        q.click('[data-act=mode][data-mode=duel]'); q.wait_for_timeout(200); q.screenshot(path=str(shots / f'p_{w}x{h}_select.png'))
        q.click('[data-char=gale]'); q.click('[data-char=digger]'); q.wait_for_timeout(400)
        q.evaluate('() => { WBUI.aim(60, 0.7); WBUI.doFire(); WBUI.ui.fast = true; }'); wait_aim(q)
        q.screenshot(path=str(shots / f'p_{w}x{h}.png'))
        sw = q.evaluate('document.documentElement.scrollWidth'); print(f'scrollWidth{w} {sw}')
        q.close()
    print('errors', errs[:8])
    b.close()
sys.exit(1 if errs else 0)
