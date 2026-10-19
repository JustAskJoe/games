# Walk the opening by tapping, like a player: create, train, platform, Dee, starter, door, first duel, depot.
import os
from playwright.sync_api import sync_playwright

errors = []
def tap_tile(pg, x, y):
    t = pg.evaluate('(() => { const c = document.getElementById("wCv"); const r = c.getBoundingClientRect(); return {l: r.left, t: r.top, w: r.width}; })()')
    tile = t['w'] / 12; cam = pg.evaluate('window.__camY || 0')
    pg.mouse.click(t['l'] + (x + 0.5) * tile, t['t'] + (y - cam + 0.5) * tile)
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
    # expose camY for the tap helper
    pg.evaluate("Object.defineProperty(window,'__camY',{get(){return 0}})")
    tap_tile(pg, 11, 2); pg.wait_for_timeout(1400); clear_dialog(pg)
    tap_tile(pg, 11, 2); pg.wait_for_timeout(2500); clear_dialog(pg)
    print('after car', me(pg)); pg.screenshot(path='shots/op-3-platform.png')
    st = pg.evaluate('TBWorld.state.map'); assert st == 'platform', st
    # camera: compute from view; tap Dee at (5,3)
    for _ in range(3):
        cam = pg.evaluate('(() => { const s = TBWorld.state; const c = document.getElementById("wCv"); const rows = c.getBoundingClientRect().height / (c.getBoundingClientRect().width/12); return Math.max(0, Math.min(15 - rows, s.me.y - rows/2 + 0.5)); })()')
        pg.evaluate(f"Object.defineProperty(window,'__camY',{{get(){{return {cam}}},configurable:true}})") if False else None
        t = pg.evaluate('(() => { const c = document.getElementById("wCv"); const r = c.getBoundingClientRect(); return {l: r.left, t: r.top, w: r.width}; })()'); tile = t['w'] / 12
        pg.mouse.click(t['l'] + 5.5 * tile, t['t'] + (3 - cam + 0.5) * tile); pg.wait_for_timeout(3000)
        if pg.locator('#wBox:not([hidden])').count(): break
    pg.screenshot(path='shots/op-4-dee.png'); print('near dee', me(pg))
    clear_dialog(pg)
    assert pg.locator('[data-s="starterdone"]').count(), 'starter screen did not open'
    pg.click('[data-fk="owlet"]'); pg.click('[data-fk="koi"]'); pg.click('[data-s="starterdone"]'); pg.wait_for_timeout(600)
    pg.screenshot(path='shots/op-5-after-starter.png'); clear_dialog(pg)
    print('door open', pg.evaluate('TBWorld.state.flags.doorOpen'))
    cam = pg.evaluate('(() => { const s = TBWorld.state; const c = document.getElementById("wCv"); const rows = c.getBoundingClientRect().height / (c.getBoundingClientRect().width/12); return Math.max(0, Math.min(15 - rows, s.me.y - rows/2 + 0.5)); })()')
    t = pg.evaluate('(() => { const c = document.getElementById("wCv"); const r = c.getBoundingClientRect(); return {l: r.left, t: r.top, w: r.width}; })()'); tile = t['w'] / 12
    pg.mouse.click(t['l'] + 5.5 * tile, t['t'] + (2 - cam + 0.5) * tile); pg.wait_for_timeout(2500)
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
