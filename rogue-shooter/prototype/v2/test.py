"""Smoke test for Rogue Shooter v2.

Builds the game, then plays it in headless Chromium:
  title -> class select -> battle map -> combat (move, ability, level-up, pause) -> mini-boss ->
  round complete -> farm (plant) -> town -> south path back to the battle map -> every zone's boss round
  -> death and run over. Then a phone held sideways (844x390) with touch: stick, ability and potion taps,
  two-tap cards and lists, the key column, ACT on the farm, the forge, and the rotate prompt in portrait.
Fails on any JavaScript error. Saves screenshots to prototype/v2/shots/.

Usage: python3 test.py          (needs Python Playwright with Chromium)
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build

SHOTS = os.path.join(HERE, 'shots')


def main():
    out = build.build()
    os.makedirs(SHOTS, exist_ok=True)
    errors = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_page(viewport={'width': 1280, 'height': 800})
        p.on('pageerror', lambda e: errors.append(str(e)))
        p.goto('file://' + os.path.abspath(out))
        p.wait_for_function("typeof state !== 'undefined' && state === 'title'", timeout=20000)
        shot = lambda name: p.screenshot(path=os.path.join(SHOTS, name + '.png'))
        state = lambda: p.evaluate('state')
        shot('01-title')

        p.keyboard.press('Enter'); p.wait_for_timeout(300)
        assert state() == 'start', 'New Run should open class select'
        shot('02-class-select')
        p.keyboard.press('1'); p.wait_for_timeout(300)
        assert state() == 'map', 'picking a class should open the battle map'
        shot('03-battle-map')
        p.click('#battlemap .btn.primary'); p.wait_for_timeout(300)
        assert state() == 'playing', 'Fight should start the round'

        for key in ['d', 's', 'a', 'w']:
            p.keyboard.down(key); p.wait_for_timeout(500); p.keyboard.up(key)
        p.evaluate('gameTime = 40')
        p.wait_for_timeout(2500)
        shot('04-combat')
        size = p.evaluate('[pix.width, pix.height, SCALE]')
        assert size[2] == 3 and abs(size[0] * 3 - 1280) < 3, f'combat should render at 3x, got {size}'
        p.keyboard.press(' '); p.wait_for_timeout(700)
        assert p.evaluate('player.abilityCd') > 0, 'space should use the class ability'

        p.evaluate('pendingLevels = 1; player.level++')
        p.wait_for_timeout(1000)
        assert state() == 'levelup', 'a level should play the burst, then the card picker'
        shot('05-level-up')
        p.wait_for_timeout(400); p.keyboard.press('1'); p.wait_for_timeout(300)
        assert state() == 'playing', 'picking a card should resume combat'
        p.keyboard.press('Escape'); p.wait_for_timeout(200)
        assert state() == 'paused'
        shot('06-pause')
        p.keyboard.press('Escape'); p.wait_for_timeout(200)

        p.evaluate('gameTime = MINIBOSS_AT'); p.wait_for_timeout(500)
        assert p.evaluate('!!bossRef'), 'the mini-boss should spawn at 2:15'
        p.evaluate('bossRef.spawnT = 9; killEnemy(bossRef)')
        for _ in range(40):
            if state() == 'roundComplete': break
            if state() == 'levelup': p.wait_for_timeout(400); p.keyboard.press('1')
            p.wait_for_timeout(300)
        assert state() == 'roundComplete', 'killing the mini-boss should end the round'
        shot('07-round-complete')

        p.click('#rc-farm-btn'); p.wait_for_timeout(800)
        assert state() == 'farm'
        if p.evaluate('!!farmShopOpen'): p.keyboard.press('Escape'); p.wait_for_timeout(200)
        p.evaluate('const r = farmPlots[0].rect; player.x = (r[0] + 9) * WS; player.y = (r[1] + 11) * WS'); p.wait_for_timeout(300)
        p.keyboard.press('Enter'); p.wait_for_timeout(300); p.keyboard.press('Enter'); p.wait_for_timeout(300)
        assert p.evaluate('!!farmPlots[0].crop'), 'Enter on an open plot should plant a seed'
        shot('08-farm')

        # an unbuilt site: Enter opens what it is, what it does, what it costs, and Build
        p.evaluate("coins = 5000; for (const k in materials) materials[k] = 60; const sg = WJ.maps.farm.sites.forge.sign; player.x = sg[0] * WS; player.y = (sg[1] + 4) * WS")
        p.wait_for_timeout(300)
        assert 'FORGE' in p.inner_text('#farm-prompt'), 'standing at the forge site should offer a look'
        p.keyboard.press('Enter'); p.wait_for_timeout(300)
        assert p.evaluate('!!farmShopOpen'), 'Enter at a site should open its menu'
        shot('08b-site-forge')
        p.keyboard.press('Enter'); p.wait_for_timeout(300)
        assert p.evaluate('bld.forge') == 1, 'Build should build the forge'
        p.wait_for_timeout(300)
        shot('08c-forge-built')

        # walk in through the door, use the anvil, buy Frost Nova
        p.evaluate("const d = WJ.maps.farm.sites.forge.door; player.x = d[0] * WS; player.y = (d[1] + 6) * WS"); p.wait_for_timeout(300)
        p.keyboard.press('Enter'); p.wait_for_timeout(300)
        assert p.evaluate('farmArea') == 'in_forge', 'Enter at the door should go inside'
        shot('08d-forge-inside')
        p.evaluate("const st = WJ.maps.in_forge.stations[0]; player.x = st[1] * WS; player.y = (st[2] + 14) * WS"); p.wait_for_timeout(300)
        p.keyboard.press('Enter'); p.wait_for_timeout(300)
        assert p.evaluate('!!farmShopOpen'), 'the anvil should open the forge menu'
        p.keyboard.press('Enter'); p.wait_for_timeout(300)
        assert p.evaluate('forge.owned.frostNova') == 1 and p.evaluate('player.weapons.frostNova') == 1, 'Enter on a weapon should buy and equip it'
        shot('08e-forge-menu')
        p.keyboard.press('Escape'); p.wait_for_timeout(200)

        # every other building and its menu
        for bk in ['alchemy', 'training', 'shrine', 'barn', 'arena']:
            p.evaluate(f"bld['{bk}'] = 2; worldChanged()")
        p.evaluate("harvestBin = { 'healing-herb': 4, 'frost-berry': 4, 'wheat': 3 }; trainedRound = 0")
        for bk, fn in [('alchemy', 'openAlchemy(1, 6)'), ('training', 'openTraining()'), ('shrine', 'openShrine()'), ('barn', 'openBarn()'), ('arena', 'openArena()'), ('cabin', 'openCabin()')]:
            p.evaluate(f"closeFarmShop(); enterRoom('{bk}'); {fn}"); p.wait_for_timeout(350)
            shot(f'08f-{bk}')
            p.keyboard.press('Escape'); p.wait_for_timeout(150)
        p.evaluate("leaveRoom(); goArea('farm', 470 * WS, 300 * WS)"); p.wait_for_timeout(300)
        shot('08g-farm-built')
        p.evaluate("goArea('town', 320 * WS, 300 * WS)"); p.wait_for_timeout(400)
        shot('09-town')
        p.evaluate("goArea('farm', 470 * WS, 600 * WS); transCooldown = 0")
        p.keyboard.down('s'); p.wait_for_timeout(900); p.keyboard.up('s'); p.wait_for_timeout(300)
        assert state() == 'map', 'the south path should lead back to the battle map'

        # basic attacks aim at the nearest enemy, not the way the hero faces
        p.evaluate("startRun('marksman'); fight(); enemies = []; spawnTimer = 99; player.aim = { x: 1, y: 0 }; player.view = 'side'; player.flip = false; const e = spawnEnemy('slime', { x: player.x - 60, y: player.y }); e.spawnT = 9; e.hp = e.maxHp = 1e6")
        p.wait_for_timeout(1200)
        assert p.evaluate("enemies[0].hp < 1e6"), 'the marksman should shoot the enemy behind them'
        p.evaluate("pendingLevels = 1; player.level++"); p.wait_for_timeout(1000)
        assert state() == 'levelup' and p.evaluate("lvlCards.length") == 3
        assert 'WEAPON' not in p.inner_text('#levelup') and 'EVOLVE' not in p.inner_text('#levelup'), 'level-ups should only offer cards'
        p.keyboard.press('1'); p.wait_for_timeout(300)
        p.evaluate("state = 'map'; setScreen(null)")

        for zi in range(6):
            p.evaluate(f"currentRound = {zi * 5 + 5}; fight(); gameTime = MINIBOSS_AT; player.hp = player.maxHp = 1e6")
            p.wait_for_timeout(2500)
            assert p.evaluate('!!bossRef'), f'zone {zi} boss should spawn'
            if zi in (1, 3, 5): shot(f'10-boss-zone-{zi}')
            p.evaluate("for (const e of enemies.slice()) { e.spawnT = 9; killEnemy(e); } state = 'map'; setScreen(null)")

        p.evaluate("startRun('rogue'); fight(); player.hp = 1; player.invT = 0; player.dodge = 0; damagePlayer(500)")
        p.wait_for_timeout(3000)
        assert state() == 'dead', 'HP at zero should play the death frames, then run over'
        shot('11-run-over')
        phone(b, out, errors)
        b.close()
    if errors:
        print('FAIL: JavaScript errors:'); [print('  ' + e) for e in errors]; sys.exit(1)
    print('PASS: title, class select, battle map, combat at 3x, ability, level-up, pause, mini-boss, round complete, farm, site menu and build, forge interior and menu, every building menu, town, auto-aim, cards-only level-ups, every boss zone, run over; phone touch: stick, ability, potion, two-tap cards, pause keys, ACT, planting, build, forge keys, rotate')


def phone(b, out, errors):
    """Touch controls on a phone held sideways (844x390): stick, ability, potions, two-tap menus, key column, ACT, rotate."""
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, has_touch=True, is_mobile=True, device_scale_factor=1)
    p = ctx.new_page()
    p.on('pageerror', lambda e: errors.append('phone: ' + str(e)))
    cdp = ctx.new_cdp_session(p)
    p.goto('file://' + os.path.abspath(out))
    p.wait_for_function("typeof state !== 'undefined' && state === 'title'", timeout=20000)
    shot = lambda name: p.screenshot(path=os.path.join(SHOTS, 'phone-' + name + '.png'))
    state = lambda: p.evaluate('state')
    keys = lambda: p.evaluate("[...document.querySelectorAll('#tc-keys:not([hidden]) button')].map(b => b.innerText.replace(/\\n/g, ' '))")
    def drag(x0, y0, dx, dy, ms):
        touch = lambda t, x, y: cdp.send('Input.dispatchTouchEvent', {'type': t, 'touchPoints': [] if t == 'touchEnd' else [{'x': x, 'y': y}]})
        touch('touchStart', x0, y0)
        for i in range(1, 6): touch('touchMove', x0 + dx * i / 5, y0 + dy * i / 5); p.wait_for_timeout(30)
        p.wait_for_timeout(ms); touch('touchEnd', 0, 0)
    assert p.evaluate('touchMode'), 'a phone should turn touch controls on'
    shot('01-title')
    p.tap('#title .btn >> nth=0'); p.wait_for_timeout(300)
    assert state() == 'start', 'tapping New Run should open class select'
    assert any('BACK' in k for k in keys()), f'class select should show a BACK key, got {keys()}'
    p.tap('#classes .ccard >> nth=1'); p.wait_for_timeout(200)
    assert state() == 'start' and p.evaluate('charSel') == 1, 'the first tap on a hero should only pick it'
    shot('02-class-select')
    p.tap('#classes .ccard >> nth=1'); p.wait_for_timeout(300)
    assert state() == 'map', 'the second tap should start the run'
    shot('03-battle-map')
    p.tap('#battlemap .btn.primary'); p.wait_for_timeout(300)
    assert state() == 'playing'
    assert p.evaluate('PIXEL_SCALE') == 2, 'a phone-height screen should draw at 2x'
    assert p.is_visible('#tc-pause') and not p.is_visible('#tc-act'), 'fights show pause, not ACT'

    x0 = p.evaluate('player.x')
    drag(150, 250, 60, 0, 600)
    assert p.evaluate('player.x') > x0 + 20, 'dragging right on the left half should walk right'
    p.evaluate('player.ability = null; player.abilityCd = 0; player.charges = 2')
    p.tap('.hud-bc .ability'); p.wait_for_timeout(300)
    assert p.evaluate('player.abilityCd') > 0, 'tapping the ability should use it'
    p.evaluate("belt[0] = { id: 'heal', n: 2 }; player.hp = 1"); p.wait_for_timeout(100)
    p.tap('#hud-belt .slot >> nth=0'); p.wait_for_timeout(200)
    assert p.evaluate('belt[0] && belt[0].n') == 1 and p.evaluate('player.hp') > 1, 'tapping a belt slot should drink it'
    p.evaluate('gameTime = 40'); p.wait_for_timeout(1500)
    shot('04-combat')

    p.evaluate('pendingLevels = 1; player.level++'); p.wait_for_timeout(1000)
    assert state() == 'levelup'
    p.wait_for_timeout(400)
    p.tap('#levelup .card >> nth=1'); p.wait_for_timeout(200)
    assert state() == 'levelup' and p.evaluate('lvlSel') == 1, 'the first tap on a card should only pick it'
    shot('05-level-up')
    assert any('TAKE' in x for x in keys()), f'level-up should show a TAKE key, got {keys()}'
    p.tap('#tc-keys button.ok'); p.wait_for_timeout(300)
    assert state() == 'playing', 'TAKE should take the picked card'

    p.tap('#tc-pause'); p.wait_for_timeout(200)
    assert state() == 'paused'
    k = keys(); assert any('RESUME' in x for x in k), f'pause should show a RESUME key, got {k}'
    shot('06-pause')
    p.tap('#tc-keys button.back'); p.wait_for_timeout(200)
    assert state() == 'playing', 'RESUME should go back to the fight'

    p.evaluate("player.hp = player.maxHp = 1e6; gameTime = MINIBOSS_AT"); p.wait_for_timeout(500)
    p.evaluate('bossRef.spawnT = 9; killEnemy(bossRef)')
    for _ in range(40):
        if state() == 'roundComplete': break
        if state() == 'levelup': p.wait_for_timeout(400); p.evaluate('pickLvl(0)')
        p.wait_for_timeout(300)
    assert state() == 'roundComplete', 'phone: killing the mini-boss should end the round, state ' + state()
    p.tap('#rc-farm-btn'); p.wait_for_timeout(800)
    assert state() == 'farm'
    if p.evaluate('!!farmShopOpen'):
        shot('07-training-popup')
        p.tap('#tc-keys button.back'); p.wait_for_timeout(300)
    assert not p.evaluate('!!farmShopOpen'), 'the key column should close the training popup'
    assert p.is_visible('#tc-act') and not p.is_visible('#tc-pause')
    p.evaluate('const r = farmPlots[0].rect; player.x = (r[0] + 9) * WS; player.y = (r[1] + 11) * WS'); p.wait_for_timeout(300)
    shot('08-farm')
    p.tap('#tc-act'); p.wait_for_timeout(300)
    assert p.evaluate('!!farmShopOpen'), 'ACT at an open plot should open planting'
    shot('09-planting')
    assert any('PLANT' in x for x in keys()), f'planting should show a PLANT key, got {keys()}'
    p.tap('#farmshop .bagslot.sel'); p.wait_for_timeout(300)
    assert p.evaluate('!!farmPlots[0].crop'), 'tapping the picked seed should plant it'

    p.evaluate("coins = 5000; for (const k in materials) materials[k] = 60; const sg = WJ.maps.farm.sites.forge.sign; player.x = sg[0] * WS; player.y = (sg[1] + 4) * WS")
    p.wait_for_timeout(300)
    p.tap('#farm-prompt'); p.wait_for_timeout(300)
    assert p.evaluate('!!farmShopOpen'), 'tapping the prompt should open the site menu'
    shot('10-site')
    p.tap('#farmshop .btn.sel'); p.wait_for_timeout(300)
    assert p.evaluate('bld.forge') == 1, 'tapping Build should build the forge'
    p.evaluate("const d = WJ.maps.farm.sites.forge.door; player.x = d[0] * WS; player.y = (d[1] + 6) * WS"); p.wait_for_timeout(300)
    p.tap('#tc-act'); p.wait_for_timeout(300)
    assert p.evaluate('farmArea') == 'in_forge'
    p.evaluate("const st = WJ.maps.in_forge.stations[0]; player.x = st[1] * WS; player.y = (st[2] + 14) * WS"); p.wait_for_timeout(300)
    p.tap('#tc-act'); p.wait_for_timeout(300)
    assert p.evaluate('!!farmShopOpen'), 'ACT at the anvil should open the forge'
    k = keys(); assert any('EQUIP' in x for x in k) and any('UPGRADE' in x for x in k) and any('LEAVE' in x for x in k), f'forge keys, got {k}'
    shot('11-forge')
    p.tap(f'#farmshop .sel'); p.wait_for_timeout(300)
    assert p.evaluate('Object.values(forge.owned).some(v => v > 0)'), 'tapping the picked weapon should buy it'
    p.tap('#tc-keys button.back'); p.wait_for_timeout(300)
    assert not p.evaluate('!!farmShopOpen'), 'LEAVE should close the forge'
    p.evaluate("transCooldown = 0")
    drag(150, 200, 0, 70, 900)
    assert p.evaluate('farmArea') == 'farm', 'dragging down through the doorway should walk out'

    p.set_viewport_size({'width': 390, 'height': 844}); p.wait_for_timeout(300)
    assert p.is_visible('#tc-rotate'), 'portrait should ask to turn the phone'
    shot('12-portrait')
    p.set_viewport_size({'width': 844, 'height': 390}); p.wait_for_timeout(300)
    assert not p.is_visible('#tc-rotate')
    ctx.close()


if __name__ == '__main__':
    main()
