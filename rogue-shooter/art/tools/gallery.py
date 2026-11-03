"""Shared builder for the animated art pages (combat, farm life, town extras).

build(dst, title=..., eyebrow=..., h1=..., lede=..., sections=[...], foot=...)
  section: {'id', 'title', 'blurb', 'items': [item, ...]}
  item:    {'name', 'note', 'frames': [PIL RGBA], 'ms': int or [ms per frame], 'scale': 3,
            'bg': '#5ea23c', 'rest': ms to hold the last frame (optional), 'wide': bool}
`pre` is raw HTML placed above the sections (with `pre_css` for its styles), e.g. a full scene with labels.
Every item becomes a canvas that loops its frames on the given ground color, at a whole-number scale.
"""
import os, io, json, base64, html as H
from PIL import Image

def b64(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def strip(frames):
    w = max(f.width for f in frames); h = max(f.height for f in frames)
    s = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames): s.alpha_composite(f.convert('RGBA'), (i * w + (w - f.width) // 2, h - f.height))
    return s, w, h

CSS = """
:root { --bg:#1a1612; --panel:#2a2218; --panel-2:#231c14; --wood:#6b4c22; --fg:#f0e4c8; --dim:#b4a27e; --gold:#ffcc44; --gold-deep:#5a3a00;
  --display:'Press Start 2P','Courier New',monospace; --body:'Rajdhani','Segoe UI',system-ui,sans-serif; color-scheme: dark; }
* { box-sizing: border-box; }
html, body { background: var(--bg); color: var(--fg); }
body { font-family: var(--body); font-size: 16px; line-height: 1.45; margin: 0; }
.wrap { max-width: 1340px; margin: 0 auto; padding-block: 28px 56px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 22px; }
.eyebrow { font-family: var(--display); font-size: 9px; letter-spacing: 2px; color: var(--dim); text-transform: uppercase; }
h1 { font-family: var(--display); font-size: clamp(18px, 3.4vw, 28px); color: var(--gold); text-shadow: 2px 2px 0 var(--gold-deep); margin: 0; letter-spacing: 1px; line-height: 1.4; }
.lede { max-width: 84ch; color: var(--dim); font-weight: 600; margin: 0; }
.controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; position: sticky; top: 0; z-index: 3; background: var(--bg); padding: 8px 0; border-bottom: 2px solid var(--panel); }
.controls span { font-family: var(--display); font-size: 9px; color: var(--dim); letter-spacing: 1px; margin-right: 4px; }
.chip { font-family: var(--display); font-size: 9px; letter-spacing: 1px; color: var(--fg); background: var(--panel); border: 2px solid var(--wood); padding: 8px 10px; cursor: pointer; text-decoration: none; }
.chip[aria-pressed="true"] { border-color: var(--gold); color: var(--gold); }
.chip:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
section.zone { background: var(--panel-2); border: 2px solid var(--wood); border-top-width: 6px; border-top-color: var(--gold); padding: 18px; display: grid; gap: 14px; min-width: 0; scroll-margin-top: 60px; box-shadow: 0 4px 16px rgba(0,0,0,.4); }
section.zone > header { display: grid; gap: 4px; }
h2 { font-family: var(--display); font-size: 14px; color: var(--gold); margin: 0; text-shadow: 1px 1px 0 var(--gold-deep); letter-spacing: 1px; line-height: 1.5; }
section.zone > header p { margin: 0; color: var(--dim); font-weight: 600; max-width: 100ch; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap: 12px; grid-auto-flow: row dense; }
.item { background: var(--panel); border: 2px solid var(--wood); padding: 12px; display: grid; gap: 8px; align-content: start; justify-items: center; min-width: 0; text-align: center; }
.item.wide { grid-column: span 2; }
@media (max-width: 520px) { .item.wide { grid-column: auto; } }
.item h3 { font-family: var(--display); font-size: 9px; color: var(--fg); margin: 0; letter-spacing: 1px; line-height: 1.6; font-weight: 400; }
.item p { margin: 0; color: var(--dim); font-weight: 600; font-size: 14px; line-height: 1.35; }
canvas { image-rendering: pixelated; border: 2px solid var(--wood); max-width: 100%; height: auto; display: block; }
footer { color: var(--dim); font-size: 13px; font-weight: 600; }
"""

JS = """
const D = __DATA__;
const imgs = {}; for (const [k, v] of Object.entries(D)) { const i = new Image(); i.src = v.src; imgs[k] = i; }
const items = [...document.querySelectorAll('canvas[data-k]')].map(c => {
  const d = D[c.dataset.k]; c.width = d.w + 8; c.height = d.h + 8; c.style.width = (c.width * d.scale) + 'px';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return { c, x, d, img: imgs[c.dataset.k] };
});
function ground(o) {
  const { x, c, d } = o; x.fillStyle = d.bg; x.fillRect(0, 0, c.width, c.height);
  let r = 99; const rnd = () => (r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  if (!d.flat) { x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < c.width * c.height / 60; i++) x.fillRect(Math.floor(rnd() * c.width), Math.floor(rnd() * c.height), 1, 1);
    x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < c.width * c.height / 140; i++) x.fillRect(Math.floor(rnd() * c.width), Math.floor(rnd() * c.height), 1, 1); }
}
function pick(t, seq) { let m = t % seq.reduce((a, b) => a + b, 0), i = 0; while (m >= seq[i]) { m -= seq[i]; i++; } return i; }
let playing = true, slow = false, t0 = performance.now();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function draw(now) {
  const t = (now - t0) * (slow ? 0.3 : 1);
  for (const o of items) {
    if (!o.img.complete) continue;
    ground(o);
    const d = o.d, seq = d.ms.concat(d.rest ? [d.rest] : []);
    let i = reduce ? d.n - 1 : pick(t, seq); if (i >= d.n) i = d.n - 1;
    o.x.drawImage(o.img, i * d.w, 0, d.w, d.h, 4, 4, d.w, d.h);
  }
  if (playing && !reduce) requestAnimationFrame(draw);
}
Promise.all(Object.values(imgs).map(i => i.decode().catch(() => {}))).then(() => requestAnimationFrame(draw));
const pb = document.getElementById('t-play'), sb = document.getElementById('t-slow');
pb.addEventListener('click', () => { playing = !playing; pb.setAttribute('aria-pressed', playing); pb.textContent = playing ? 'Playing' : 'Paused'; if (playing) requestAnimationFrame(draw); });
sb.addEventListener('click', () => { slow = !slow; sb.setAttribute('aria-pressed', slow); });
"""

def build(dst, title, eyebrow, h1, lede, sections, foot, pre='', pre_css=''):
    data = {}; out = []; k = 0
    for sec in sections:
        cards = []
        for it in sec['items']:
            s, w, h = strip(it['frames'])
            n = len(it['frames']); ms = it.get('ms', 150)
            ms = ms if isinstance(ms, list) else [ms] * n
            key = f'i{k}'; k += 1
            data[key] = {'src': b64(s), 'w': w, 'h': h, 'n': n, 'ms': ms, 'rest': it.get('rest', 0), 'scale': it.get('scale', 3), 'bg': it.get('bg', '#5ea23c'), 'flat': it.get('flat', False)}
            cards.append(f'<div class="item{" wide" if it.get("wide") else ""}"><canvas data-k="{key}" aria-label="{H.escape(it["name"])}"></canvas><h3>{H.escape(it["name"].upper())}</h3>'
                         + (f'<p>{H.escape(it["note"])}</p>' if it.get('note') else '') + '</div>')
        out.append(f'<section class="zone" id="{sec["id"]}"><header><h2>{H.escape(sec["title"])}</h2><p>{H.escape(sec["blurb"])}</p></header><div class="grid">{"".join(cards)}</div></section>')
    nav = ''.join(f'<a class="chip" href="#{s["id"]}">{H.escape(s["title"].split(" ·")[0])}</a>' for s in sections)
    page = f'''<title>{H.escape(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@500;600;700&display=swap">
<style>{CSS}{pre_css}</style>
<div class="wrap">
  <header style="display:grid;gap:10px"><div class="eyebrow">{H.escape(eyebrow)}</div><h1>{H.escape(h1)}</h1><p class="lede">{H.escape(lede)}</p></header>
  <div class="controls" role="group" aria-label="Playback and sections"><span>PLAYBACK</span><button class="chip" id="t-play" aria-pressed="true">Playing</button><button class="chip" id="t-slow" aria-pressed="false">Slow motion</button>{nav}</div>
  {pre}{"".join(out)}
  <footer>{H.escape(foot)} © 2026 justaskjoe. All rights reserved.</footer>
</div>
<script>{JS.replace("__DATA__", json.dumps(data))}</script>'''
    open(dst, 'w').write(page)
    return os.path.getsize(dst)
