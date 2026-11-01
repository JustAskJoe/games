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
  if (G.phase === 'morning') {
    // v3: visit the back room each morning: unpack the crate, open boxes onto the rack, put a card in the display case
    if (window._rd !== G.dayIdx) {
      if (!CTUI.room) return click('#hud [data-act=room]');
      if (G.store.crate) return click('[data-act=unpack]');
      if (click('[data-act=openBox]')) return true;
      const c = G.stock.find(c => c.loc === 'inbox' && !c.know.fake && CT.estimate(G, c).value >= 5);
      if (c) { click('[data-act=rsel][data-uid="' + c.uid + '"]'); if (!c.graded && c.prot !== 'hard' && c.prot !== 'mag') click('[data-act=sleeve][data-p=hard]'); click('[data-act=placeTo][data-to=case]'); }
      if (G.dayIdx === 1) click('[data-act=pol][data-k=penny][data-d="1"]');
      window._rd = G.dayIdx; return true;
    }
    if (CTUI.room) return click('#room [data-act=room]');
    return click('[data-act=open]');
  }
  if (G.phase === 'shop') { if (G.packs.star > 2) return click('[data-act=crack][data-game=star]'); return click('[data-act=next]'); }
  if (G.phase === 'visit') {
    const v = G.visit;
    if (v.role === 'scalp') return click('[data-act=pass]');
    if (v.role === 'weigh') return click('[data-act=sellBehind]') || click('[data-act=pass]');
    if (v.role === 'thief') return click('[data-act=watch]');
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
  if (G.phase === 'close' && G.dayIdx === 0 && !G.store.lock) { if (!CTUI.catalog) return click('[data-act=catalog]'); click('[data-act=order][data-item=lock]'); click('[data-act=order][data-item=poster]'); return click('#loupe [data-act=catalog]'); }
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
    pg.click('[data-act=fe-new][data-slot="1"]'); pg.wait_for_timeout(300)
    seen, n, reloaded = set(), 0, False
    while n < 900:
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
        key = ph + str(pg.evaluate('CTUI.G.dayIdx')) + (('_' + str(pg.evaluate('CTUI.G.night && CTUI.G.night.pick'))) if ph == 'night' else '') + ('_room' if pg.evaluate('CTUI.room') else '') + ('_catalog' if pg.evaluate('CTUI.catalog') else '')
        if ph == 'visit' and pg.evaluate('CTUI.G.visit.role') in ('weigh', 'thief', 'switch', 'reseal'): key += '_' + pg.evaluate('CTUI.G.visit.role')
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
