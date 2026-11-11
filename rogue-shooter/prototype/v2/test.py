"""Smoke test for Rogue Shooter v2.

Builds the game, then plays it in headless Chromium:
  title -> class select -> battle map -> combat (move, ability, level-up, pause) -> mini-boss ->
  round complete -> farm (plant) -> town -> south path back to the battle map -> every zone's boss round
  -> death and run over.
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
        b.close()
    if errors:
        print('FAIL: JavaScript errors:'); [print('  ' + e) for e in errors]; sys.exit(1)
    print('PASS: title, class select, battle map, combat at 3x, ability, level-up, pause, mini-boss, round complete, farm, site menu and build, forge interior and menu, every building menu, town, auto-aim, cards-only level-ups, every boss zone, run over')


if __name__ == '__main__':
    main()
