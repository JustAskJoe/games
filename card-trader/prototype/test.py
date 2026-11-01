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
  const G = CTUI.G, q = s => document.querySelector(s), click = s => { const e = q(s); if (e && !e.disabled) { e.click(); return true; } return false; };
  if (G.phase === 'title') return click('[data-act=start]');
  if (G.phase === 'morning') return click('[data-act=open]');
  if (G.phase === 'shop') { if (G.packs.star > 2) return click('[data-act=crack][data-game=star]'); return click('[data-act=next]'); }
  if (G.phase === 'visit') {
    const v = G.visit;
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
  if (G.phase === 'close') { click('[data-act=grade][data-co=halo]'); return click('[data-act=endDay]'); }
  if (G.phase === 'cardnight') { if (!G.events.some(e => e.t === 'cardNight')) return click('[data-act=rip]'); return click('[data-act=nextMorning]'); }
  return false;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    benign = ('net::', 'fonts.g', 'Failed to load resource')  # offline webfonts; missing optional art falls back to drawn color
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and not any(x in m.text for x in benign) else None)
    # front end: opening (let the effects play), title, save slots, new game in slot 1
    pg.goto(build.as_uri()); pg.wait_for_timeout(3800)
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
        key = ph + str(pg.evaluate('CTUI.G.dayIdx'))
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
