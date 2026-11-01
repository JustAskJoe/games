# Walk the opening by tapping, like a player: create, train, platform, Dee, starter, door, first duel, depot.
import os
from playwright.sync_api import sync_playwright

errors = []
def tap_tile(pg, x, y):
    # the world is an isometric diorama now: ask it where tile x,y is on screen
    pt = pg.evaluate(f'TBWorld.tapPoint({x}, {y})'); assert pt, f'tile {x},{y} is off screen'
    pg.mouse.click(pt['x'], pt['y'])
def clear_dialog(pg, n=20):
    for _ in range(n):
        if pg.locator('#wBox:not([hidden])').count() == 0: return
        pg.click('#wBox'); pg.wait_for_timeout(60)
def me(pg): return pg.evaluate('[TBWorld.state.me.x, TBWorld.state.me.y, TBWorld.state.map]')

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto('file://' + os.getcwd() + '/trickbound.html'); pg.wait_for_timeout(600)
    pg.click('[data-s="introskip"]'); pg.wait_for_timeout(300)
    pg.click('[data-look="c"]'); pg.fill('#wName', 'Hunter'); pg.screenshot(path='shots/op-1-create.png')
    pg.click('[data-w="board"]'); pg.wait_for_timeout(900); clear_dialog(pg)
    pg.screenshot(path='shots/op-2-car.png'); print('car', me(pg))
    tap_tile(pg, 11, 2); pg.wait_for_timeout(1400); clear_dialog(pg)
    tap_tile(pg, 11, 2); pg.wait_for_timeout(2500); clear_dialog(pg)
    print('after car', me(pg)); pg.screenshot(path='shots/op-3-platform.png')
    st = pg.evaluate('TBWorld.state.map'); assert st == 'platform', st
    # tap Dee at (5,3); from the platform she may be off screen, so walk up the path first
    for _ in range(3):
        if pg.evaluate('TBWorld.tapPoint(5, 3)') is None: tap_tile(pg, 4, 7); pg.wait_for_timeout(1500); clear_dialog(pg)
        tap_tile(pg, 5, 3); pg.wait_for_timeout(3000)
        if pg.locator('#wBox:not([hidden])').count(): break
    pg.screenshot(path='shots/op-4-dee.png'); print('near dee', me(pg))
    clear_dialog(pg)
    assert pg.locator('[data-s="starterdone"]').count(), 'starter screen did not open'
    pg.click('[data-fk="owlet"]'); pg.click('[data-fk="koi"]'); pg.click('[data-s="starterdone"]'); pg.wait_for_timeout(600)
    pg.screenshot(path='shots/op-5-after-starter.png'); clear_dialog(pg)
    print('door open', pg.evaluate('TBWorld.state.flags.doorOpen'))
    tap_tile(pg, 5, 2); pg.wait_for_timeout(2500)
    print('story hidden (duel started)', pg.evaluate("document.getElementById('story').hidden"), 'chip', pg.inner_text('#chipHand'))
    pg.click('#bMenu'); pg.click('[data-act="autoNight"]')
    for _ in range(900):
        pg.wait_for_timeout(200)
        if pg.locator('[data-act="again"]').count(): break
    pg.click('[data-act="again"]'); pg.wait_for_timeout(500)
    print('after duel:', pg.inner_text('#story')[:160].replace('\n', ' | '))
    for _ in range(5):
        if pg.locator('[data-s="scenenext"]').count(): pg.click('[data-s="scenenext"]'); pg.wait_for_timeout(150)
    print('depot:', pg.inner_text('#story')[:200].replace('\n', ' | '))
    print('progress', pg.evaluate('JSON.stringify({n: TBLine.progress.name, look: TBLine.progress.look, owned: TBLine.progress.owned, started: TBLine.progress.flags.started, first: TBLine.progress.flags.firstDuel, marks: TBLine.progress.marks})'))
    print('scroll', pg.evaluate('document.documentElement.scrollWidth'))
    b.close()
print('errors', errors)
