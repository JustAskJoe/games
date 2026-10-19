#!/usr/bin/env python3
"""Render a Slides project locally and flag layout problems before publishing.

    python3 render_check.py [project_dir] [--art art_map.json] [--blobs blobs.json] [--out shots]

For each slide in deck.json order it:
  * renders the <section> at 1920x1080 in headless Chromium (Playwright), with the
    deck's Google Fonts loaded and speaker notes hidden;
  * flags OVERFLOW (section content taller/wider than the slide, or any element
    whose box leaves the 1920x1080 frame);
  * flags SMALL text (visible text under 24px) and a missing ownership notice /
    missing <aside> notes;
  * writes shots/<id>.png and contact sheets shots/_sheet<N>.png (12 per sheet).

Images: /_blob/PENDING_<key> and /_blob/<asset id> are swapped for local files when
--art maps key -> path (asset ids are mapped back to keys via blobs.json); anything
unresolved becomes a grey placeholder so layout still renders.
Exit code is 1 if any slide was flagged.
"""
import argparse, json, os, re, sys, tempfile, pathlib

NOTICE_SNIPPET = 'One Fifty Labs · All rights reserved'
# grey 16:9 placeholder; single quotes + %-escapes so it is safe inside src="..."
PLACEHOLDER = ("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9'%3E"
               "%3Crect width='16' height='9' fill='%23888'/%3E%3C/svg%3E")

CHECK_JS = r"""() => {
  const s = document.querySelector('section');
  const out = {sh: s.scrollHeight, sw: s.scrollWidth, outside: [], small: []};
  const fr = s.getBoundingClientRect();
  for (const el of s.querySelectorAll('*')) {
    if (el.closest('aside')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const tag = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '');
    // ignore full-bleed backgrounds that intentionally match the frame
    if (r.right > fr.right + 1 || r.bottom > fr.bottom + 1 || r.left < fr.left - 1 || r.top < fr.top - 1) {
      const rot = cs.transform && cs.transform !== 'none';
      if (!rot) out.outside.push(tag + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    // text overflowing its own box (clipped lines)
    if (el.scrollHeight > el.clientHeight + 2 && cs.overflow === 'hidden' && el.textContent.trim())
      out.outside.push(tag + ' clips its text');
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (own && parseFloat(cs.fontSize) < 24) out.small.push(tag + ' ' + cs.fontSize + ' "' + el.textContent.trim().slice(0, 30) + '"');
  }
  return out;
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project', nargs='?', default='project')
    ap.add_argument('--art', help='JSON {key: local image path}')
    ap.add_argument('--blobs', default='blobs.json', help='JSON {key: asset id}, to map ids back to keys')
    ap.add_argument('--out', default='shots')
    ap.add_argument('--per-sheet', type=int, default=12)
    a = ap.parse_args()

    from playwright.sync_api import sync_playwright

    deck = json.load(open(os.path.join(a.project, 'deck.json')))
    art = json.load(open(a.art)) if a.art else {}
    blobs = json.load(open(a.blobs)) if os.path.exists(a.blobs) else {}
    id2key = {v: k for k, v in blobs.items()}
    fonts = ''.join(f'<link rel="stylesheet" href="{f["href"]}">' for f in deck.get('faces', {}).values())
    os.makedirs(a.out, exist_ok=True)

    def swap(m):
        ref = m.group(1)
        key = ref[len('PENDING_'):] if ref.startswith('PENDING_') else id2key.get(ref, ref)
        p = art.get(key)
        return pathlib.Path(p).resolve().as_uri() if p and os.path.exists(p) else PLACEHOLDER

    flagged = 0
    tmp = os.path.join(tempfile.mkdtemp(), 'slide.html')
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1920, 'height': 1080})
        for sid in deck['order']:
            h = open(os.path.join(a.project, 'slides', f'{sid}.html')).read()
            issues = []
            if NOTICE_SNIPPET not in h:
                issues.append('no ownership notice')
            if '<aside>' not in h:
                issues.append('no speaker notes')
            if '<x-shape' in h:
                issues.append('stray <x-shape> placeholder')
            h = re.sub(r'/_blob/([\w-]+)', swap, h)
            h = h.replace('<section', '<section class="s"', 1)
            doc = (f'<html><head><meta charset="utf-8">{fonts}<style>*{{margin:0;padding:0;box-sizing:border-box}} '
                   f'.s{{position:relative;width:1920px;height:1080px;overflow:hidden}} aside{{display:none}} '
                   f'ul{{padding-left:1.2em}} th,td{{padding:14px 20px}} table{{border-collapse:collapse;width:100%}}</style></head><body>{h}</body></html>')
            open(tmp, 'w').write(doc)
            try:
                pg.goto(pathlib.Path(tmp).as_uri(), wait_until='networkidle', timeout=15000)
            except Exception:
                pass  # fonts may be unreachable offline; render with fallbacks
            pg.wait_for_timeout(250)
            r = pg.evaluate(CHECK_JS)
            if r['sh'] > 1080 or r['sw'] > 1920:
                issues.append(f'OVERFLOW section {r["sw"]}x{r["sh"]}')
            if r['outside']:
                issues.append('outside frame: ' + '; '.join(r['outside'][:3]))
            if r['small']:
                issues.append('text <24px: ' + '; '.join(r['small'][:3]))
            pg.screenshot(path=os.path.join(a.out, f'{sid}.png'))
            if issues:
                flagged += 1
                print(f'[{sid}] ' + ' | '.join(issues))
        b.close()

    from PIL import Image, ImageDraw
    ims = [(s, Image.open(os.path.join(a.out, f'{s}.png')).resize((480, 270))) for s in deck['order']]
    n = a.per_sheet
    for k in range(0, len(ims), n):
        chunk = ims[k:k + n]
        rows = (len(chunk) + 2) // 3
        sheet = Image.new('RGB', (1440, rows * 290), 'white')
        d = ImageDraw.Draw(sheet)
        for i, (sid, im) in enumerate(chunk):
            x, y = (i % 3) * 480, (i // 3) * 290
            sheet.paste(im, (x, y))
            d.text((x + 6, y + 272), f'{k + i + 1:02d} {sid}', fill='black')
        sheet.save(os.path.join(a.out, f'_sheet{k // n}.png'))
    print(f'{len(ims)} slides rendered, {flagged} flagged, sheets in {a.out}/')
    sys.exit(1 if flagged else 0)


if __name__ == '__main__':
    main()
