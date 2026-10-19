import os, sys, time
from playwright.sync_api import sync_playwright

def build():
    parts = [open('head.html').read(), open('body.html').read(), '<script>\n' + open('engine.js').read() + '\n</script>\n', '<script>\n' + open('ui.js').read() + '\n</script>\n', '<script>\n' + open('story.js').read() + '\n</script>\n']
    open('tilebound.html', 'w').write(''.join(parts))

build()
errs = []
JS_STEP = r"""
() => {
  const q = (s, r) => (r || document).querySelector(s);
  const click = (el) => { el.click(); return el.dataset.act || el.dataset.l || el.dataset.s || el.className; };
  const story = q('#story');
  if (story && !story.hidden) {
    if (q('[data-s=next]', story)) return click(q('[data-s=next]', story));
    if (q('[data-s=learn]', story)) return click(q('[data-s=learn]', story));
    if (q('[data-s=tablecoach]', story)) return click(q('[data-s=tablecoach]', story));
    if (q('[data-s=table]', story)) return click(q('[data-s=table]', story));
    const p3 = q('button[data-l=pass3]', story);
    if (p3) { if (p3.disabled) { const t = q('.rack .tile[data-focus]:not(.sel)', story); if (t) return click(t); } else return click(p3); }
    if (q('.mini button', story) && !q('[data-focus]', story)) return click(q('[data-goal="0"]', story));
    const f = q('[data-focus]', story); if (f) return click(f);
    return 'story-wait';
  }
  const ov = q('#overlay');
  if (ov && ov.children.length) {
    const f = q('[data-focus]', ov); if (f && !f.disabled) return click(f);
    const nx = q('[data-act=next],[data-act=again]', ov); if (nx) return click(nx);
    return 'overlay-wait';
  }
  const pr = q('#prompt');
  const oc = q('[data-act=opencard]', pr); if (oc) return click(oc);
  const f = q('[data-focus]', pr); if (f && !f.disabled) return click(f);
  const ab = q('#abil [data-act]'); if (ab && Math.random() < 0.5) return click(ab);
  return 'wait';
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.getcwd() + '/tilebound.html'); pg.wait_for_timeout(1500)
    pg.screenshot(path='v2_intro.png')
    t0 = time.time(); seen = {}; shots = {'doors': 0, 'lesson4': 0, 'starter': 0, 'targets': 0, 'table': 0}
    hands_done = 0
    while time.time() - t0 < 420:
        r = pg.evaluate(JS_STEP)
        seen[r] = seen.get(r, 0) + 1
        if pg.evaluate("() => document.querySelector('#story:not([hidden]) .doors') !== null") and not shots['doors']:
            shots['doors'] = 1; pg.screenshot(path='v2_doors.png')
        if pg.evaluate("() => { const h = document.querySelector('#story:not([hidden]) .l-top h2'); return h && h.textContent.startsWith('Pick a goal'); }") and not shots['lesson4']:
            shots['lesson4'] = 1; pg.screenshot(path='v2_lesson4.png', full_page=True)
        if pg.evaluate("() => document.querySelector('#story:not([hidden]) .starters') !== null") and not shots['starter']:
            shots['starter'] = 1; pg.screenshot(path='v2_starter.png', full_page=True)
        if pg.evaluate("() => { const o = document.querySelector('#overlay .modal h2'); return o && o.textContent.startsWith('Pick 1'); }") and not shots['targets']:
            shots['targets'] = 1; pg.screenshot(path='v2_targets.png')
        if pg.evaluate("() => document.querySelector('#story').hidden && document.querySelector('#prompt [data-act=discard]') !== null") and not shots['table']:
            shots['table'] = 1; pg.evaluate("() => { const a = document.querySelector('#abil'); return a; }"); pg.screenshot(path='v2_table.png', full_page=True)
        if r == 'again': hands_done += 1; break
        if pg.evaluate("() => { const h = document.querySelector('#overlay .modal h2'); return h && /wins the evening/.test(h.textContent); }"):
            pg.screenshot(path='v2_end.png'); pg.evaluate("() => document.querySelector('[data-act=feedback]').click()"); pg.wait_for_timeout(300); pg.screenshot(path='v2_feedback.png', full_page=True); break
        pg.wait_for_timeout(60 if r != 'wait' else 250)
    print('steps', seen)
    print('scrollWidth', pg.evaluate('document.documentElement.scrollWidth'))
    print('errors', errs[:5])
    b.close()
