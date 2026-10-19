import os, sys, time
from playwright.sync_api import sync_playwright

def build():
    parts = [open('head.html').read(), open('body.html').read(), '<script>\n' + open('engine.js').read() + '\n</script>\n', '<script>\n' + open('catch.js').read() + '\n</script>\n', '<script>\n' + open('ui.js').read() + '\n</script>\n', '<script>\n' + open('world.js').read() + '\n</script>\n', '<script>\n' + open('line.js').read() + '\n</script>\n', '<script>\n' + open('music.js').read() + '\n</script>\n']
    open('trickbound.html', 'w').write(''.join(parts))

build()
if '--build-only' in sys.argv: sys.exit(0)
errs = []
JS_STEP = r"""
() => {
  const q = (s, r) => (r || document).querySelector(s);
  const click = (el) => { el.click(); return el.dataset.act || el.dataset.l || el.dataset.s || (el.dataset.town ? 'town' : null) || (el.dataset.bid !== undefined ? 'bid' + el.dataset.bid : null) || (el.dataset.card !== undefined ? 'card' : null) || (el.dataset.fk ? 'fam' : null) || (el.dataset.rip !== undefined ? 'rip' : null) || el.className; };
  const story = q('#story');
  if (story && !story.hidden) {
    if (q('[data-s=intronext]', story)) return click(q('[data-s=intronext]', story));
    if (q('[data-s=scenenext]', story)) return click(q('[data-s=scenenext]', story));
    const sd = q('[data-s=starterdone]', story); if (sd) { if (sd.disabled) return click(q('.fam-card:not(.sel)', story)); return click(sd); }
    const rip = q('.rip:not(.up)', story); if (rip) return click(rip);
    if (q('[data-s=buypack]:not([disabled])', story) && !window.__bought) { window.__bought = 1; return click(q('[data-s=buypack]', story)); }
    if (q('[data-s=sitdown]:not([disabled])', story)) return click(q('[data-s=sitdown]', story));
    const rb = q('[data-s=runback]', story); if (rb) return click(rb);
    const f = q('[data-focus]', story); if (f && !f.disabled) return click(f);
    if (q('.rail', story)) { const open = [...story.querySelectorAll('.stop:not([disabled])')]; return click(open[open.length - 1]); }
    if (q('[data-s=depot]', story)) return click(q('[data-s=depot]', story));
    return 'story-wait';
  }
  const ov = q('#overlay');
  if (ov && ov.children.length) {
    const f = q('[data-focus]', ov); if (f && !f.disabled) return click(f);
    const nx = q('[data-act=next],[data-act=again]', ov); if (nx) return click(nx);
    return 'overlay-wait';
  }
  const pr = q('#prompt');
  const bl = q('[data-act=blindno]', pr); if (bl) return click(bl);
  const pk = q('[data-act=peek],[data-act=count]', pr); if (pk) return click(pk);
  const hs = q('[data-act=hopsend]', pr); if (hs) { if (hs.disabled) return click(q('#hand .pc')); return click(hs); }
  const rt = q('[data-act="rethink-"]', pr); if (rt) { const f = q('[data-focus]', pr); return click(f || q('[data-act=famskip]', pr)); }
  const sp = q('[data-act=spark]', pr); if (sp && Math.random() < 0.7) return click(sp);
  const fl = q('[data-act=flare]', pr); if (fl && fl.getAttribute('aria-pressed') !== 'true' && Math.random() < 0.3) return click(fl);
  const br = q('[data-act=burrow]', pr); if (br && Math.random() < 0.3) return click(br);
  const rec = q('.bids .rec:not([disabled])', pr) || q('.bids button:not([disabled])', pr); if (rec) return click(rec);
  const pl = q('[data-act=play]', pr);
  if (pl) {
    if (!pl.disabled) return click(pl);
    const h = q('#hand .pc.hint') || q('#hand .pc:not(.off)'); if (h) return click(h);
  }
  return 'wait';
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' and 'fonts' not in m.text and 'net::' not in m.text else None)
    pg.goto('file://' + os.getcwd() + '/trickbound.html'); pg.wait_for_timeout(1200)
    pg.screenshot(path='shots/intro.png')
    pg.evaluate("() => { try { localStorage.setItem('tb-fast','on'); } catch (e) {} }")
    t0 = time.time(); seen = {}; shots = {'map': 0, 'starter': 0, 'depot': 0, 'rip': 0, 'bid': 0, 'table': 0, 'handend': 0, 'night': 0, 'map2': 0}; nights = 0
    while time.time() - t0 < 300:
        r = pg.evaluate(JS_STEP)
        seen[r] = seen.get(r, 0) + 1
        if not shots['starter'] and pg.evaluate("() => !!document.querySelector('#story:not([hidden]) [data-s=starterdone]')"): shots['starter'] = 1; pg.screenshot(path='shots/starter.png', full_page=True)
        if not shots['depot'] and pg.evaluate("() => !!document.querySelector('#story:not([hidden]) .depot-art')"): shots['depot'] = 1; pg.screenshot(path='shots/depot.png', full_page=True)
        if not shots['rip'] and pg.evaluate("() => document.querySelectorAll('#story:not([hidden]) .rip.up').length >= 3"): shots['rip'] = 1; pg.screenshot(path='shots/rip.png', full_page=True)
        if pg.evaluate("() => !!document.querySelector('#story:not([hidden]) .rail')"):
            if not shots['map']: shots['map'] = 1; pg.screenshot(path='shots/map.png', full_page=True)
            elif nights >= 2 and not shots['map2']: shots['map2'] = 1; pg.screenshot(path='shots/map2.png', full_page=True); break
        if pg.evaluate("() => !!document.querySelector('#story:not([hidden]) [data-s^=\"after:\"],#story:not([hidden]) [data-s=runback]')") and not pg.evaluate("() => window.__nightShot"):
            pg.evaluate("() => { window.__nightShot = 1; }"); nights += 1
            if not shots['night']: shots['night'] = 1; pg.screenshot(path='shots/night.png', full_page=True)
        if pg.evaluate("() => !document.querySelector('#story:not([hidden]) [data-s^=\"after:\"],#story:not([hidden]) [data-s=runback]') && window.__nightShot"): pg.evaluate("() => { window.__nightShot = 0; }")
        if not shots['bid'] and pg.evaluate("() => document.querySelector('#story').hidden && !!document.querySelector('#prompt .bids')"): shots['bid'] = 1; pg.screenshot(path='shots/bid.png', full_page=True)
        if not shots['table'] and pg.evaluate("() => document.querySelector('#story').hidden && !!document.querySelector('#prompt [data-act=play]') && document.querySelectorAll('#table .pc').length > 2"): shots['table'] = 1; pg.screenshot(path='shots/table.png', full_page=True)
        if not shots['handend'] and pg.evaluate("() => { const h = document.querySelector('#overlay .modal table'); return !!h; }"): shots['handend'] = 1; pg.screenshot(path='shots/handend.png')
        if not shots.get('end') and pg.evaluate("() => { const h = document.querySelector('#overlay .modal h2'); return h && /win|take it/.test(h.textContent) && !!document.querySelector('[data-act=again]'); }"):
            shots['end'] = 1; pg.screenshot(path='shots/end.png')
        pg.wait_for_timeout(40 if r != 'wait' else 150)
    print('steps', seen)
    print('hands', pg.evaluate("() => document.querySelectorAll('#sidePanel .hist > div').length"))
    print('nights', nights, 'progress', pg.evaluate("() => JSON.stringify(window.TBLine.progress)"))
    print('scrollWidth', pg.evaluate('document.documentElement.scrollWidth'))
    print('errors', errs[:8])
    b.close()
