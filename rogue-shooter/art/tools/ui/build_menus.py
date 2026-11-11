"""Export the UI icon set and build the menu mockups page.

Outputs (paths relative to the rogue-shooter folder):
  art/sprites/ui/icons.png    every 16x16 icon in one sheet (rows: cards, weapons, abilities, potions, materials, misc)
  art/sprites/ui/icons.json   name -> [x, y] in the sheet
  art/concepts/menus.html     title, class select, battle map, combat HUD and level-up screens at 1280x800
"""
import os, sys, io, json, base64, html as H
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from PIL import Image
from icons import render_all
sys.path.insert(0, os.path.join(HERE, '..', 'biomes'))

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SPR = os.path.join(ROOT, 'art', 'sprites')
UI = os.path.join(SPR, 'ui')

def b64(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

ICONS = {}
def icon(name, cls='icon', alt=None):
    return f'<img class="{cls}" src="{ICONS[name]}" width="16" height="16" alt="{H.escape(alt if alt is not None else name)}">'

def frame(path, fw, fh, col=0, row=0):
    return Image.open(path).convert('RGBA').crop((col * fw, row * fh, col * fw + fw, row * fh + fh))

def silhouette(im, fill=(16, 8, 24), edge=(176, 102, 220)):
    import numpy as np
    a = np.array(im); m = a[..., 3] > 0
    out = np.zeros_like(a); out[m, :3] = fill; out[m, 3] = 255
    H_, W_ = m.shape
    for y in range(H_):
        for x in range(W_):
            if m[y, x] and (y == 0 or x == 0 or y == H_ - 1 or x == W_ - 1 or not (m[y - 1, x] and m[y + 1, x] and m[y, x - 1] and m[y, x + 1])):
                out[y, x, :3] = edge
    return Image.fromarray(out, 'RGBA')

CLASSES = [
    ('knight', 'Knight', 'The Juggernaut', (130, 140, 75, 80, 5, 15), 'Sword Slash', 'Shield Bash', '8s', 'Fortified: +30% HP, +15% armor', 'Heavy: slowest hero, can\'t kite'),
    ('mage', 'Mage', 'The Scholar', (90, 85, 100, 100, 8, 0), 'Magic Bolt', 'Blink', '6s', 'Arcane Mind: +20% XP', 'Fragile Power: weakest hits'),
    ('marksman', 'Marksman', 'The Sniper', (80, 75, 100, 120, 12, 0), 'Piercing Shot', 'Focus Shot', '10s', 'Deadeye: crits deal 2.5x', 'Tunnel Vision: only fires ahead'),
    ('rogue', 'Rogue', 'The Glass Cannon', (70, 60, 130, 150, 8, 0), 'Dagger Flurry', 'Shadow Dash', '5s x2', 'Elusive: +30% speed, 15% dodge', 'Paper: 70% HP, no armor'),
    ('witch', 'Witch', 'The Ritualist', (85, 100, 90, 50, 5, 5), 'Hex Pulse', 'Ritual Burst', '10s', 'Ritual Power: hexed foes take +15%', 'Vulnerable: long gap between pulses'),
]
STAT_ROWS = [('HP', 150, '#c0402f'), ('POW', 150, '#f08a2a'), ('SPD', 150, '#5fe0c8'), ('ATK', 150, '#ffcc44'), ('CRT', 15, '#f4a6c6'), ('ARM', 15, '#9a9aa4')]

def seg(v, mx, c, n=10):
    on = max(1, round(v / mx * n)) if v else 0
    return f'<div class="seg" style="--c:{c}">' + ''.join(f'<i class="{"on" if i < on else ""}"></i>' for i in range(n)) + '</div>'

def screen(id_, title, notes, inner):
    return f'''<section class="screen" id="{id_}"><header><h2>{title}</h2></header><p class="notes">{notes}</p>
<div class="stagewrap"><div class="stage">{inner}</div></div></section>'''

def main():
    os.makedirs(UI, exist_ok=True)
    groups = render_all()
    W = max(len(v) for v in groups.values())
    sheet = Image.new('RGBA', (W * 16, len(groups) * 16), (0, 0, 0, 0)); pos = {}
    for j, (g, items) in enumerate(groups.items()):
        for i, (n, im) in enumerate(items):
            sheet.alpha_composite(im, (i * 16, j * 16)); pos[n] = [i * 16, j * 16]; ICONS[n] = b64(im)
    sheet.save(os.path.join(UI, 'icons.png'))
    json.dump({'size': 16, 'groups': {g: [n for n, _ in v] for g, v in groups.items()}, 'icons': pos}, open(os.path.join(UI, 'icons.json'), 'w'), indent=1)

    scn = {z: b64(Image.open(os.path.join(ROOT, 'art', 'concepts', 'scenes', f'{z}.png'))) for z in ('meadow', 'forest')}
    from scenes import scene as make_scene
    scn['calm'] = b64(make_scene('meadow', calm=True)); scn['forest_calm'] = b64(make_scene('forest', calm=True))
    bj_ = json.load(open(os.path.join(SPR, 'biomes', 'biomes.json')))['zones']['forest']['obstacles']
    fob = Image.open(os.path.join(SPR, 'biomes', 'forest_obstacles.png'))
    deco = {o['name']: (b64(fob.crop((o['box'][0], o['box'][1], o['box'][0] + o['box'][2], o['box'][1] + o['box'][3]))), o['box'][2], o['box'][3]) for o in bj_}
    sheets = {k: b64(Image.open(os.path.join(SPR, 'heroes', f'{k}.png'))) for k, *_ in CLASSES}
    knight_face = b64(Image.open(os.path.join(SPR, 'heroes', 'knight_front.png')).crop((5, 0, 27, 22)))
    ground = b64(Image.open(os.path.join(SPR, 'biomes', 'forest_ground.png')))
    ej = json.load(open(os.path.join(SPR, 'enemies', 'enemies.json')))['enemies']
    bj = json.load(open(os.path.join(SPR, 'bosses', 'bosses.json')))['enemies']
    def en(key, row='front', col=0, src=ej, d='enemies'):
        e = src[key]; return b64(frame(os.path.join(SPR, d, e['file']), *e['frame'], col, e['rows'].index(row)))
    prev = [('Shroomling', en('shroomling')), ('Archer Sprite', en('archer')), ('Wolf', en('wolf')), ('Slime', en('slime', 'forest front'))]
    minis = [('Mushroom King', en('mushroom_king', src=bj, d='bosses')), ('Pack Leader Wolf', en('pack_leader', src=bj, d='bosses'))]
    witch = bj['forest_witch']
    witch_sil = b64(silhouette(frame(os.path.join(SPR, 'bosses', witch['file']), *witch['frame'], 0, 0)))

    screens = []
    # ------------------------------------------------------------ 1 title
    lineup = ''.join(f'<canvas data-hero="{k}" data-view="front" data-anim="walk" data-off="{i * 70}" aria-label="{n}"></canvas>' for i, (k, n, *_) in enumerate(CLASSES))
    title = f'''<img class="bg" src="{scn['calm']}" alt=""><div class="shade" style="--a:.42"></div><div class="vig"></div>
<div class="abs logo"><div class="word">ROGUE</div><div class="word two">SHOOTER</div><div class="tag">FIGHT · FARM · GROW</div></div>
<nav class="abs mainmenu panel" aria-label="Main menu">
  <div class="btn sel">NEW RUN</div>
  <div class="btn">CONTINUE<span class="sub">ROUND 7 · FOREST</span></div>
  <div class="btn">OPTIONS</div>
  <div class="btn">QUIT</div>
</nav>
<div class="abs lineup">{lineup}</div>
<div class="abs corner" style="left:18px;bottom:18px">V2 PROTOTYPE</div>
<div class="abs hint" style="right:18px;bottom:12px"><span class="key">&uarr;</span><span class="key">&darr;</span> CHOOSE <span class="key">ENTER</span> SELECT</div>'''
    screens.append(screen('title', '1 · Title screen', 'The Meadow battle screen, dimmed, sits behind a stacked pixel logo. One wood panel holds the main menu; the selected button turns gold and gets a pointer. The five heroes walk in place along the bottom. Continue shows where the saved run stopped.', title))

    # ------------------------------------------------------------ 2 class select
    cards = []
    for i, (k, n, ep, st, atk, abl, cd, plus, minus) in enumerate(CLASSES):
        stats = ''.join(f'<span class="dim">{lab}</span>{seg(v, mx, c)}<span class="v">{v}{"%" if lab in ("CRT", "ARM") else ""}</span>' for (lab, mx, c), v in zip(STAT_ROWS, st))
        cards.append(f'''<div class="ccard panel{' sel' if i == 0 else ''}">
  <div class="pic"><canvas data-hero="{k}" data-view="front" data-anim="walk" data-off="{i * 37}" aria-label="{n}"></canvas></div>
  <div><div class="nm">{n.upper()}</div><div class="ep">{ep.upper()}</div></div>
  <div class="stats">{stats}</div>
  <div class="kit">
    <div class="k">{icon(atk)}<div><span>{atk.upper()}</span><small>AUTO ATTACK</small></div></div>
    <div class="k">{icon(abl)}<div><span>{abl.upper()}</span><small>SPACE · {cd.upper()}</small></div></div>
  </div>
  <div class="trait"><b style="color:#8fe07a">+</b>{H.escape(plus)}</div>
  <div class="trait minus"><b>&minus;</b>{H.escape(minus)}</div>
</div>''')
    cs = f'''<img class="bg" src="{scn['calm']}" alt=""><div class="shade" style="--a:.72"></div>
<div class="abs cs-title t24 gold">CHOOSE YOUR HERO</div>
<div class="abs cs-row">{''.join(cards)}</div>
<div class="abs cs-foot"><span class="hint"><span class="key">&larr;</span><span class="key">&rarr;</span> CHOOSE</span><span class="hint"><span class="key">ENTER</span> START RUN</span><span class="hint"><span class="key">1</span>-<span class="key">5</span> QUICK PICK</span></div>'''
    screens.append(screen('class', '2 · Class select', 'Five hero cards with the new walking sprites. Each shows the six base stats from the design as segmented bars (with the real number), the auto attack and the spacebar ability with its cooldown, and the class strength and weakness in plain words. The selected card lifts and gets a gold frame.', cs))

    # ------------------------------------------------------------ 3 battle map
    nodes = [(6, 'done', 54, 470), (7, 'done', 192, 270), (8, 'cur', 354, 452), (9, 'lock', 492, 236), (10, 'boss', 570, 36)]
    path = ''
    pts = [(x + 42, y + 42) for _, _, x, y in nodes[:4]] + [(nodes[4][2] + 54, nodes[4][3] + 54)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        path += f'<polyline points="{x0},{y0} {x0},{(y0 + y1) // 2} {x1},{(y0 + y1) // 2} {x1},{y1}" />'
    nodes_html = ''
    for r, st, x, y in nodes:
        label = {'done': 'CLEARED', 'cur': 'NEXT', 'lock': '', 'boss': 'BOSS'}[st]
        inner = f'<img src="{witch_sil}" alt="Boss silhouette" style="width:84px;height:76px;image-rendering:pixelated">' if st == 'boss' else str(r)
        sz = 108 if st == 'boss' else 84
        nodes_html += f'<div class="node notch {st}" style="left:{x}px;top:{y}px">{inner}</div>'
        nodes_html += f'<div class="nlabel" style="left:{x + sz // 2}px;top:{y + sz + 12}px">{("ROUND " + str(r) + " · " + label) if label else "ROUND " + str(r)}</div>'
        if st == 'done': nodes_html += f'<div class="check" style="left:{x + 66}px;top:{y - 15}px"></div>'
    for name, x, y in (('Old tree', 6, 12), ('Giant mushroom', 330, 60), ('Stump', 250, 560), ('Old tree', 600, 330), ('Giant mushroom', 40, 300), ('Stump', 470, 120), ('Fallen log', 120, 160)):
        src, w, h = deco[name]
        nodes_html = f'<img class="deco" src="{src}" alt="" style="left:{x}px;top:{y}px;width:{w * 3}px;height:{h * 3}px">' + nodes_html
    pin = f'<canvas class="hero-pin" data-hero="knight" data-view="front" data-anim="walk" style="left:{nodes[2][2] + 18}px;top:{nodes[2][3] - 78}px" aria-label="You"></canvas>'
    mp = f'''<img class="bg" src="{scn['forest']}" alt=""><div class="shade" style="--a:.55"></div>
<div class="abs mapbox panel">
  <div class="t16 gold" style="display:flex;justify-content:space-between"><span>FOREST</span><span class="dim t8" style="align-self:center">ROUNDS 6-10</span></div>
  <div class="ground" style="background-image:url({ground})">
    <svg width="714" height="620" style="position:absolute;left:0;top:0" aria-hidden="true"><g fill="none" stroke="#2b1d14" stroke-width="12" shape-rendering="crispEdges">{path}</g><g fill="none" stroke="#e4c48c" stroke-width="6" stroke-dasharray="9 9" shape-rendering="crispEdges">{path}</g></svg>
    {nodes_html}{pin}
  </div>
</div>
<div class="abs info panel">
  <div><div class="t8 dim">NEXT FIGHT</div><h3 class="t32 gold" style="margin-top:9px">ROUND 8</h3></div>
  <div class="pips t8"><span class="dim" style="margin-right:6px">DANGER</span>{''.join(icon('Kills', 'icon s24', '') if i < 3 else f'<img class="icon s24" src="{ICONS["Kills"]}" alt="" style="opacity:.25">' for i in range(5))}</div>
  <div class="rule"></div>
  <div><div class="t8 dim" style="margin-bottom:9px">ENEMIES</div><div class="portraits">{''.join(f'<div class="slot" title="{n}"><img src="{s}" alt="{n}"></div>' for n, s in prev)}</div></div>
  <div><div class="t8 dim" style="margin-bottom:9px">MINI-BOSS · ONE OF</div><div class="portraits">{''.join(f'<div class="slot" title="{n}"><img src="{s}" alt="{n}"></div>' for n, s in minis)}<div class="t8" style="align-self:center;line-height:18px">MUSHROOM KING<br><span class="dim">OR</span><br>PACK LEADER</div></div></div>
  <div class="rule"></div>
  <div class="t8" style="line-height:18px"><span class="dim">ARENA MUTATOR</span><br>DOUBLE ARCHERS · +50% GOLD</div>
  <div class="t8" style="line-height:18px"><span class="dim">TIP</span><br>ARCHERS KEEP THEIR DISTANCE.<br>CLOSE IN FAST OR OUT-RANGE THEM.</div>
  <div class="btns"><div class="btn primary" style="justify-content:center">FIGHT!</div><div class="btn" style="justify-content:center">RETURN TO FARM</div></div>
</div>'''
    screens.append(screen('map', '3 · Battle map', 'Shown before each fight. Only the current zone\'s five rounds are on the map: cleared rounds are green with a check, the next round glows gold with your hero standing on it, and the boss round shows the boss as a silhouette. The side panel previews the enemies, the possible mini-bosses, the danger level and any Arena mutator, with Fight and Return to Farm.', mp))

    # ------------------------------------------------------------ 4 combat HUD
    hud = f'''<img class="bg" src="{scn['meadow']}" alt="">
<div class="abs hud-tl">
  <div class="portrait"><img src="{knight_face}" alt="Knight"></div><div class="lvl">LV 7</div>
  <div class="hud-bars">
    <div class="bar hp" style="--c:var(--hp);--hi:var(--hp-hi)"><i style="width:72%"></i><b>HP 94 / 130</b></div>
    <div class="bar" style="--c:var(--xp);--hi:var(--xp-hi);height:18px"><i style="width:45%"></i><b style="line-height:12px">XP 27 / 60</b></div>
  </div>
</div>
<div class="abs hud-top">
  <div class="roundplank plank"><span class="gold">ROUND 3</span><span class="dim t8">MEADOW</span><span style="display:flex;gap:6px;align-items:center">{icon('Timer', 'icon s24', 'Time')}1:42</span></div>
  <div class="phase">SWARM</div>
  <div class="bossbar"><div class="t8 cream">GIANT SLIME</div><div class="bar" style="--c:#b066dc;--hi:#e8b4ff"><i style="width:63%"></i></div></div>
</div>
<div class="abs hud-tr">
  <div class="cnt plank">{icon('Gold', 'icon s32', 'Gold')}<span class="gold">248</span></div>
  <div class="cnt plank">{icon('Kills', 'icon s32', 'Kills')}<span>131</span></div>
  <div class="mats">{''.join(f'<div class="cnt plank">{icon(m, "icon s24")}<span>{n}</span></div>' for m, n in (('Slime Gel', 12), ('Bat Wings', 4), ('Wisp Dust', 2)))}</div>
</div>
<div class="abs hud-bl">
  <div class="wslot"><div class="slot">{icon('Frost Nova', 'icon s64')}</div><div class="lvpips"><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i></div></div>
  <div class="wslot empty"><div class="slot">LOCKED</div><div class="dim">AFTER R5</div></div>
</div>
<div class="abs hud-bc">
  <div class="ability"><div class="slot">{icon('Shield Bash', 'icon s64')}<div class="cool"><b>5</b></div></div><span class="key keytag">SPACE</span></div>
  <div class="belt plank">
    <div class="slot"><span class="key">Q</span>{icon('Heal Flask')}<span class="n">2</span></div>
    <div class="slot"><span class="key">E</span>{icon('Speed Draught')}<span class="n">1</span></div>
    <div class="slot" style="opacity:.55"><span class="key">R</span><span class="t8 dim">T2</span></div>
  </div>
</div>
<div class="dmg" style="left:500px;top:262px">12</div><div class="dmg crit" style="left:580px;top:220px">38!</div><div class="dmg" style="left:300px;top:330px">9</div>
<div class="abs toast panel">{icon('Slime Gel', 'icon s32')}<span>+1 SLIME GEL<br><span class="dim">12 TOTAL</span></span></div>'''
    screens.append(screen('hud', '4 · Combat HUD', 'Kept to the corners so the middle of the fight stays clear. Top left: portrait, level, HP and XP. Top middle: round, zone, timer and the current phase, with the mini-boss bar under it when one is out. Top right: gold, kills and the materials picked up this round. Bottom left: weapon slots with level pips (the second slot unlocks after the round 5 boss). Bottom middle: the spacebar ability with a stepped cooldown and the Q/E/R potion belt (R unlocks at Alchemy T2). Damage numbers are pixel font; crits are bigger and gold.', hud))

    # ------------------------------------------------------------ 5 level up
    cards = [
        ('Power', 'COMMON', 'var(--common)', '+2%', 'damage', 'NOW +14%', False, False),
        ('Multi Shot', 'RARE', 'var(--rare)', '+1', 'projectile: your sword arc widens', 'NOW +2', True, True),
        ('Momentum', 'LEGENDARY', 'var(--legend)', '+6%', 'damage for every second you stay alive', 'NOW +0%', False, False),
    ]
    ch = ''
    for i, (n, rar, col, val, desc, now, pref, sel) in enumerate(cards):
        ch += f'''<div class="card{' sel' if sel else ''}{' legend' if rar == 'LEGENDARY' else ''}" style="--r:{col}">
  <span class="key num">{i + 1}</span>{'<span class="pref">KNIGHT PICK</span>' if pref else ''}
  <span class="rar">{rar}</span>
  <div class="art"><img src="{ICONS[n]}" alt="{n}"></div>
  <div class="cn">{n.upper()}</div><div class="val">{val}</div><div class="desc">{H.escape(desc)}</div>
  <div class="now">{now}</div>
</div>'''
    lu = f'''<img class="bg" src="{scn['meadow']}" alt=""><div class="shade" style="--a:.66"></div>
<div class="abs lu-title"><div class="t32 gold">LEVEL UP!</div><div class="t16 cream">LV 7 &rarr; LV 8 · PICK ONE</div></div>
<div class="abs lu-row">{ch}</div>
<div class="abs lu-foot"><span class="hint"><span class="key">1</span><span class="key">2</span><span class="key">3</span> PICK</span><span class="hint"><span class="key">&larr;</span><span class="key">&rarr;</span>+<span class="key">ENTER</span></span><span class="hint"><span class="key">TAB</span> STATS</span></div>'''
    screens.append(screen('levelup', '5 · Level-up pick', 'The fight pauses and dims. Three cards from the 12-card pool; the frame color is the rarity (wood common, blue rare, purple epic, gold legendary), and legendary cards get a slow shine. Each card shows its icon, the bonus, what it does in plain words and your running total. Cards your class prefers are tagged. Number keys pick directly; TAB still opens stats.', lu))

    nav = ''.join(f'<a class="chip" href="#{i}">{t}</a>' for i, t in (('title', 'Title'), ('class', 'Class select'), ('map', 'Battle map'), ('hud', 'Combat HUD'), ('levelup', 'Level up')))
    page = open(os.path.join(HERE, 'menus_template.html')).read()
    page = page.replace('{{NAV}}', nav).replace('{{SCREENS}}', '\n'.join(screens)).replace('{{SHEETS}}', json.dumps(sheets))
    dst = os.path.join(ROOT, 'art', 'concepts', 'menus.html'); open(dst, 'w').write(page)
    print('wrote', dst, os.path.getsize(dst) // 1024, 'KB')

if __name__ == '__main__':
    main()
