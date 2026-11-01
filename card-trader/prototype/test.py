# Playwright walkthrough of the built prototype (desktop 1280x720 first, then a phone-width check).
# Run: python3 test.py (after build.py), or ../build-and-test.py for everything. Screenshots land in shots/.
# © 2026 justaskjoe. All rights reserved.
import pathlib, sys
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).parent
build = here.parent / 'builds' / 'card-trader.html'
shots = here / 'shots'; shots.mkdir(exist_ok=True)
errs = []

# A small in-page bot that plays whatever is on screen through the UI's own buttons, so every screen gets drawn.
BOT = """() => {
  const G = CTUI.G, q = s => document.querySelector(s), click = s => { const e = [...document.querySelectorAll(s)].find(e => !e.disabled); if (e) { e.click(); return true; } return false; };
  if (G.phase === 'title') return click('[data-act=intro]');
  if (G.phase === 'morning') {
    // v3 rev 2: each morning, unpack in the back, open a box, put loose packs on the rack, then stock the case on the floor
    if (window._rd !== G.dayIdx) {
      const st = window._rs || 0;
      if (st === 0) { window._rs = 1; return CTUI.room ? true : click('#hud [data-act=room]'); }
      if (st === 1) { if (!CTUI.room) return click('#hud [data-act=room]'); if (CTUI.room !== 'back') return click('[data-act=roomView][data-v=back]'); if (G.store.crate && G.store.crateOpened !== G.dayIdx) return click('[data-act=unpack]');
        const box = G.goods.find(o => o.type === 'box' && o.loc === 'shelf'); window._rs = 2;
        if (box) { click('.good[data-uid="' + box.uid + '"]'); return click('[data-act=openGood]'); } return true; }
      if (st === 2) { window._rs = 3; const g = ['shell', 'hive', 'star'].find(g => G.store.backPacks[g] > 0); if (g) { click('.looseP[data-game=' + g + '][data-f=shelf]'); return click('[data-act=movePacks][data-n]:not([data-n="1"])'); } return true; }
      if (st === 3) { window._rs = 4; return click('[data-act=autoStore]'); }
      if (st === 4) { window._rs = 5; if (CTUI.room !== 'floor') return click('[data-act=roomView][data-v=floor]'); }
      if (st === 5) { window._rs = 6; const c = G.stock.find(c => c.loc === 'cbinder' && !c.know.fake && !c.graded);
        if (c) { click('[data-act=rsel][data-uid="' + c.uid + '"]'); if (c.prot !== 'hard' && c.prot !== 'mag') click('[data-act=sleeve][data-p=hard]'); return click('[data-act=placeTo][data-to=case]'); } return true; }
      if (G.dayIdx === 1) click('[data-act=pol][data-k=penny][data-d="1"]');
      window._rd = G.dayIdx; window._rs = 0; return true;
    }
    // day 1: finish setting out the floor (3 in the case, 4 in the counter binder, 3 on the rack) through the engine
    if (CT.openChecklist(G).some(x => !x.done)) {
      if (G.store.crate) CT.act(G, { t: 'unpack' });
      for (const g of ['shell', 'hive', 'star']) if (G.store.backPacks[g]) CT.act(G, { t: 'movePacks', game: g, n: G.store.backPacks[g], to: 'rack' });
      for (const c of G.stock.filter(c => !CT.isFloor(c.loc) && !c.know.fake && !c.graded)) {
        if (CT.onGrid(G, 'case').length < 3) { if (c.prot !== 'hard' && c.prot !== 'mag') CT.act(G, { t: 'sleeve', uid: c.uid, prot: 'hard' }); CT.act(G, { t: 'place', uid: c.uid, to: 'case' }); }
        else if (CT.where(G, 'cbinder').length < 4) { if (!c.prot || c.prot === 'none') CT.act(G, { t: 'sleeve', uid: c.uid, prot: 'penny' }); CT.act(G, { t: 'place', uid: c.uid, to: 'cbinder' }); }
      }
      CTUI.render(); return true;
    }
    if (CTUI.room) return click('#room [data-act=openFromRoom]') || click('#room [data-act=room]');
    return click('[data-act=open]');
  }
  if (G.phase === 'shop') { if (G.packs.star > 2) return click('[data-act=crack][data-game=star]'); return click('[data-act=next]'); }
  if (G.phase === 'visit') {
    const v = G.visit;
    if (v.role === 'scalp') return click('[data-act=pass]');
    if (v.role === 'weigh') return click('[data-act=sellBehind]') || click('[data-act=pass]');
    if (v.role === 'thief') return v.caught ? (click('[data-act=letGo][data-parent]') || click('[data-act=letGo][data-work]') || click('[data-act=security]')) : click('[data-act=watch]');
    if (v.role === 'distract') return (!v.watched && click('[data-act=watch]')) || click('[data-act=pass]');
    if (v.role === 'browse') return click('#deal [data-act=accept]') || click('[data-act=pass]');
    if (v.role === 'vintage') return (G.cash > v.ask + 200 && click('#deal [data-act=accept]')) || click('[data-act=pass]');
    if (v.role === 'sealedc' && !v.showing) return click('#deal [data-act=show]') || click('[data-act=pass]');
    if (v.react && v.cards.some(c => c.know.fake) && click('[data-act=inform]')) return true;
    if (v.role === 'switch') return (!v.watched && click('[data-act=watch]')) || click('#deal [data-act=show]') || click('[data-act=pass]');
    if (v.role === 'reseal') return (!v.knowSeal && click('[data-act=inspectPacks]')) || (!v.resealed && click('[data-act=accept]')) || click('[data-act=pass]');
    if (v.cards.length) {
      const c = v.cards.find(c => !c.know.uv);
      if (c && v.patience > 4) { q('#mat .card[data-uid="' + c.uid + '"]').click(); click('[data-tool=uv]'); click('[data-tool=loupe]'); return click('[data-act=closeLoupe]'); }
      if (v.rounds < 2) { CTUI.offer = Math.round(v.ask * 0.7); return click('[data-act=offer]'); }
      return click('[data-act=accept]') || click('[data-act=pass]');
    }
    if (v.role === 'sealed' && !v.showing) return click('[data-act=showPacks]') || click('[data-act=pass]');
    if (!v.showing) return click('[data-act=show]') || click('[data-act=pass]');
    return click('[data-act=accept]');
  }
  if (G.phase === 'close' && G.dayIdx === 0 && !window._cat) { if (!CTUI.catalog) return click('[data-act=catalog]'); window._cat = 1; click('[data-act=unlock][data-k=lock]'); click('[data-act=order][data-item=poster]'); return click('#loupe [data-act=catalog]'); }
  if (G.phase === 'close' && G.dayIdx === 2 && !CTUI.board && !window._bd) { window._bd = 1; return click('#hud [data-act=board]'); }
  if (CTUI.board) return click('#loupe [data-act=board]');
  if (G.phase === 'close') { click('[data-act=grade][data-co=halo]'); if (G.dayIdx === 0) click('[data-act=upgrade][data-k=lens]'); if (G.dayIdx === 1) click('[data-act=policy]'); return click('[data-act=endDay]'); }
  if (G.phase === 'night') {
    const N = G.night;
    if (!N.pick) { for (const b of document.querySelectorAll('[data-act=pickNight]')) { b.click(); if (CTUI.G.night && CTUI.G.night.pick) return true; } return click('[data-act=nextMorning]'); }
    if (!N.done) {
      if (N.pick === 'cardnight') return click('[data-act=rip]');
      if (N.pick === 'tourney') { click('[data-act=tourPrize]'); return click('[data-act=hostTourney]'); }
      if (N.pick === 'auction') return N.auc.price < 40 ? click('[data-act=bid]') || click('[data-act=drop]') : click('[data-act=drop]');
      if (N.pick === 'dig') return click('[data-act=dig]');
      if (N.pick === 'swap') return click('[data-act=swapYes]') || click('[data-act=swapNo]') || click('[data-act=nextMorning]');
    }
    return click('[data-act=nextMorning]');
  }
  return false;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    benign = ('net::', 'fonts.g', 'Failed to load resource')  # offline webfonts; missing optional art falls back to drawn color
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and not any(x in m.text for x in benign) else None)
    # front end: opening (let the effects play), title, save slots, new game in slot 1
    pg.goto(build.as_uri()); pg.wait_for_timeout(5300)
    pg.screenshot(path=str(shots / 'f1_opening.png'))
    pg.click('[data-act=fe-press]'); pg.wait_for_timeout(700); pg.screenshot(path=str(shots / 'f2_title.png'))
    pg.click('[data-act=fe-settings]'); pg.wait_for_timeout(300); pg.screenshot(path=str(shots / 'f3_settings.png')); pg.click('[data-act=fe-title]')
    pg.click('[data-act=fe-slots]'); pg.wait_for_timeout(700); pg.screenshot(path=str(shots / 'f4_slots.png'))
    pg.click('[data-act=fe-new][data-slot="1"]'); pg.wait_for_timeout(300); pg.screenshot(path=str(shots / 'f6_intro.png'))
    seen, n, reloaded = set(), 0, False
    while n < 2400:
        # once, at the start of day 2: reload the page and continue slot 1, and check the run came back
        if not reloaded and pg.evaluate('CTUI.G.dayIdx') == 1 and pg.evaluate('CTUI.G.phase') == 'morning':
            reloaded = True; before = pg.evaluate('[CTUI.G.dayIdx, Math.round(CTUI.G.cash), CTUI.G.stock.length]')
            pg.reload(); pg.wait_for_timeout(500); pg.click('[data-act=fe-press]'); pg.click('[data-act=fe-slots]'); pg.wait_for_timeout(500)
            pg.click('[data-act=fe-continue][data-slot="1"]'); pg.wait_for_timeout(200)
            after = pg.evaluate('[CTUI.G.dayIdx, Math.round(CTUI.G.cash), CTUI.G.stock.length]')
            print('save survives reload:', before == after, before)
            if before != after: errs.append(f'save/continue lost state: {before} -> {after}')
            pg.click('[data-act=fe-menu]'); pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 'f5_pause.png')); pg.click('[data-act=fe-resume]')
        ph = pg.evaluate('CTUI.G.phase')
        if ph == 'end': break
        key = ph + str(pg.evaluate('CTUI.G.dayIdx')) + (('_' + str(pg.evaluate('CTUI.G.night && CTUI.G.night.pick'))) if ph == 'night' else '') + (('_' + pg.evaluate('CTUI.room')) if pg.evaluate('CTUI.room') else '') + ('_board' if pg.evaluate('CTUI.board') else '') + ('_catalog' if pg.evaluate('CTUI.catalog') else '')
        if ph == 'visit' and pg.evaluate('CTUI.G.visit.role') in ('weigh', 'thief', 'switch', 'reseal', 'distract', 'browse', 'vintage', 'sealedc'): key += '_' + pg.evaluate('CTUI.G.visit.role')
        if key not in seen:
            seen.add(key); pg.wait_for_timeout(250); pg.screenshot(path=str(shots / f'd2_{key}.png'))
        if ph == 'visit' and 'loupe' not in seen and pg.evaluate('CTUI.G.visit.cards.length') > 0:
            seen.add('loupe'); pg.click('#mat .card'); pg.click('[data-tool=loupe]'); pg.wait_for_timeout(200)
            pg.screenshot(path=str(shots / 'd3_loupe.png')); pg.click('[data-act=closeLoupe]')
        pg.evaluate(BOT); n += 1
    pg.wait_for_timeout(500); pg.screenshot(path=str(shots / 'd4_end.png'))
    final = pg.evaluate('CTUI.G.final')
    print('steps', n, 'phase', pg.evaluate('CTUI.G.phase'), 'final', final)
    if pg.evaluate('CTUI.G.phase') != 'end': errs.append('the UI walkthrough never reached the end screen')
    if not reloaded: errs.append('never reached day 2 to test save and reload')
    # stock drawer and a second run
    pg.click('[data-act=stock]'); pg.wait_for_timeout(200); pg.screenshot(path=str(shots / 'd5_stock.png')); pg.click('#loupe [data-act=stock]')
    pg.click('[data-act=again]'); pg.wait_for_timeout(300)
    print('scrollWidth', pg.evaluate('document.documentElement.scrollWidth'))
    # phone width: the stage letterboxes; nothing may scroll sideways
    for w, h in ((390, 844), (320, 640)):
        pg.set_viewport_size({'width': w, 'height': h}); pg.wait_for_timeout(250)
        pg.screenshot(path=str(shots / f'p_{w}.png'))
        print(f'scrollWidth{w if w != 390 else ""} {pg.evaluate("document.documentElement.scrollWidth")}')
    b.close()

if errs:
    print('ERRORS:'); [print(' ', e) for e in errs]; sys.exit(1)
print('OK')
