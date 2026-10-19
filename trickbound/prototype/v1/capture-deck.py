# Capture real in-game screens for the crew deck (phone frame, 2x).
import os
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.getcwd(), 'shots', 'deck')
os.makedirs(OUT, exist_ok=True)
URL = 'file://' + os.getcwd() + '/trickbound.html'
errors = []

def fresh(b):
    pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.evaluate("document.querySelector('.music-btn') && (document.querySelector('.music-btn').style.display='none')")
    return pg

def tap(pg, x, y):
    r = pg.evaluate('(() => { const c = document.getElementById("wCv"); const b = c.getBoundingClientRect(); return {l: b.left, t: b.top, w: b.width, h: b.height}; })()')
    tile = r['w'] / 12; rows = r['h'] / tile
    my = pg.evaluate('TBWorld.state.me.y'); cam = max(0, min(15 - rows, my - rows / 2 + 0.5))
    pg.mouse.click(r['l'] + (x + 0.5) * tile, r['t'] + (y - cam + 0.5) * tile)

def finish_typing(pg):
    pg.wait_for_timeout(1400)

with sync_playwright() as p:
    b = p.chromium.launch()
    # 1. the train car, opening
    pg = fresh(b)
    pg.click('[data-s="introskip"]'); pg.wait_for_timeout(200)
    pg.click('[data-look="c"]'); pg.fill('#wName', 'Hunter'); pg.wait_for_timeout(150)
    pg.screenshot(path=f'{OUT}/create.png')
    pg.click('[data-w="board"]'); pg.wait_for_timeout(900); finish_typing(pg)
    pg.screenshot(path=f'{OUT}/car.png')
    pg.close()

    # 2. the town hub, a crew conversation, a pickup table, the wake screen, the binder
    pg = fresh(b)
    pg.click('[data-s="introskip"]'); pg.wait_for_timeout(200)
    pg.evaluate("TBLine.progress.flags.started = true; TBLine.map()"); pg.click('[data-s="jump"]'); pg.click('[data-jump="preset:cinderWon"]'); pg.wait_for_timeout(200)
    pg.evaluate("""(() => { const P = TBLine.progress; P.flags.firstDuel = 'won'; P.flags.hubIntro = true; P.name = 'Hunter'; P.look = 'c';
      P.enc.cinder = [{ id: 'sootling', uid: 'a1', lamp: false, temper: { nerve: 13, patience: 6, spark: 9 }, nature: 'wry' }, { id: 'cinderwick', uid: 'a2', lamp: true, temper: { nerve: 8, patience: 12, spark: 4 }, nature: 'dreamy' }];
      P.seen = P.seen.concat(['sootling']); })()""")
    pg.click('[data-town="cinder"]'); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{OUT}/hub.png')
    tap(pg, 8, 10); pg.wait_for_timeout(2200)
    for _ in range(6):
        if pg.locator('[data-wc]').count(): break
        pg.click('#wBox'); pg.wait_for_timeout(200)
    finish_typing(pg); pg.screenshot(path=f'{OUT}/crew.png')
    pg.click('[data-wc="1"]'); pg.wait_for_timeout(300)
    tap(pg, 2, 6); pg.wait_for_timeout(2400)
    for _ in range(6):
        if pg.locator('[data-wc]').count(): break
        pg.click('#wBox'); pg.wait_for_timeout(200)
    pg.click('[data-wc="0"]'); pg.wait_for_timeout(300)
    pg.click('[data-s="deal"]'); pg.wait_for_timeout(300)
    # let a hand get going, then fill the meter a little for the shot
    for _ in range(120):
        pg.wait_for_timeout(100)
        if pg.locator('[data-bid]').count(): break
    pg.evaluate("(() => { })()")
    pg.screenshot(path=f'{OUT}/table.png')
    pg.click('#bMenu'); pg.click('[data-act="devWinFeats"]'); pg.wait_for_timeout(700)
    pg.screenshot(path=f'{OUT}/wake.png')
    pg.evaluate("Math.random = () => 0")
    pg.click('[data-s="wake:none"]'); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{OUT}/woken.png')
    pg.click('[data-s="binder"]'); pg.wait_for_timeout(300)
    pg.evaluate("(() => { const P = TBLine.progress; ['mothling','hare','coppermite','yardcrow','frog','raven'].forEach((id) => { if (!P.seen.includes(id)) P.seen.push(id); }); })()")
    pg.click('[data-s="town"]') if pg.locator('[data-s="town"]').count() else None
    pg.wait_for_timeout(200)
    pg.evaluate("TBLine.map()"); pg.click('[data-s="binder"]'); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{OUT}/binder.png')
    pg.close()

    # 3. a spread of pullable card versions, using the game's own card CSS
    pg = b.new_page(viewport={'width': 1600, 'height': 760}, device_scale_factor=2)
    pg.goto(URL); pg.wait_for_timeout(600)
    pg.evaluate("""(() => {
      const SP = window.SP; const FAM = ['dusk','ember','tide','grove'], FN = ['Dusk','Ember','Tide','Grove'];
      const card = (c, v) => { const s = SP.suit(c), r = SP.rank(c); const vc = v === 'base' ? '' : ' v-' + v.split(':')[0];
        return `<span class="pc ${FAM[s]}${vc}"><span class="r">${SP.RANKS[r]}</span><span class="su">${SP.SUIT_SYM[s]}</span><span class="big">${SP.SUIT_SYM[s]}</span><span class="fam">${FN[s]}</span>${v.startsWith('lamp') ? '<span class="shine"></span>' : ''}</span>`; };
      const C = (s, r) => SP.card(s, r);
      const items = [[C(3,4),'base','Base'],[C(2,6),'pits','Pits set'],[C(1,10),'pits','Pits set'],[C(0,11),'lamp','Lamp-lit foil'],[C(2,9),'mis','Misprint'],[C(0,0),'promo:dark','Going Dark Deuce'],[C(0,12),'promo:shift','Full Shift Ace'],[C(1,12),'promo:ironmere','Ironmere Lantern Ace']];
      document.body.innerHTML = `<div id="spread" style="display:flex;gap:34px;align-items:flex-end;justify-content:center;padding:70px 40px;background:#211C1F;min-height:760px;box-sizing:border-box">${items.map(([c,v,l]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:22px"><div style="transform:scale(2.6);transform-origin:bottom center;margin-top:150px">${card(c,v)}</div><span style="font:700 19px 'Nunito Sans',system-ui,sans-serif;color:#E8DCC8;text-align:center;width:150px">${l}</span></div>`).join('')}</div>`;
      document.body.style.background = '#211C1F'; document.body.style.margin = '0';
    })()""")
    pg.wait_for_timeout(500)
    pg.locator('#spread').screenshot(path=f'{OUT}/cards.png')
    pg.close()
    b.close()
print('errors', errors)
print(sorted(os.listdir(OUT)))
