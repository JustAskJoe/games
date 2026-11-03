"""Build art/concepts/menus-2.html: the rest of the game's menus at 1280x800, on the same UI kit as
menus.html and buildings.html.

Combat: pause, TAB stats, round complete, run over (death), victory, options.
Farm: cabin storage (Potion Chest + Harvest Bin), planting with the hover preview.
Town: seed shop, general store.

Same run as the building menus where it can be: a Knight, round 8 in the Forest, 412 gold, Frost Nova and
Orbital Blades, Renewal blessing, Cows and a Dog in the barn, Swarm + Berserkers in the Arena. Planting is
shown at round 12 (Caverns) because rare 1x2 crops open at round 11. Numbers come from
design/game-design-v2.md; shop stock and prices are placeholders because the design has not set them yet."""
import os, sys, io, json, base64, html as H, random
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
T = os.path.join(HERE, '..')
for p in ('farmhub', 'farmlife', 'combat', 'heroes', 'enemies'): sys.path.insert(0, os.path.join(T, p))
from PIL import Image
from icons import render_all

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SPR = os.path.join(ROOT, 'art', 'sprites'); SC = os.path.join(ROOT, 'art', 'concepts', 'scenes')
ICONS = {}

def b64(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def ic(name, size=48, alt=None, style=''):
    return f'<img class="icon" src="{ICONS[name]}" width="16" height="16" style="width:{size}px;height:{size}px;{style}" alt="{H.escape(alt if alt is not None else name)}">'

def slot(name, size=48, cls='slot', extra=''):
    return f'<div class="{cls}">{ic(name, size) if name else ""}{extra}</div>'

def px(im, k=3, alt='', style='', cls='spr'):
    return f'<img class="{cls}" src="{b64(im)}" alt="{H.escape(alt)}" style="width:{im.width * k}px;height:{im.height * k}px;{style}">'

KEY = lambda k: f'<span class="key">{k}</span>'
GOLD = 412
WALLET = [('Slime Gel', 18), ('Bat Wings', 9), ('Bone Fragments', 14), ('Demon Essence', 6), ('Wisp Dust', 11), ('Spore Dust', 7), ('Golem Core', 1)]

def wallet(gold=GOLD, mats=WALLET):
    return (f'<div class="w g">{ic("Gold", 32, "Gold")}{gold}</div>' + ''.join(f'<div class="w">{ic(n, 32)}{v}</div>' for n, v in mats))

def screen(id_, title, notes, inner):
    return f'''<section class="screen" id="{id_}"><header><h2>{title}</h2></header><p class="notes">{notes}</p>
<div class="stagewrap"><div class="stage">{inner}</div></div></section>'''

def bg(img, a=.6, k=3, extra=''):
    """A scene image at 3x, centred and cropped to the stage, with a dark shade."""
    w, h = img.width * k, img.height * k
    return f'<div class="room" style="left:{(1280 - w) // 2}px;top:{(800 - h) // 2}px;width:{w}px;height:{h}px"><img src="{b64(img)}" alt="" style="width:100%;height:100%"></div><div class="shade" style="background:rgba(8,6,4,{a})"></div>{extra}'

def hud_ghost():
    """A faint copy of the combat HUD corners so overlays read as 'in a fight'."""
    return f'''<div class="abs ghost" style="left:18px;top:18px"><div class="bar" style="--c:var(--hp);--hi:var(--hp-hi);width:300px"><i style="width:72%"></i><b>HP 94 / 130</b></div></div>
<div class="abs ghost" style="right:18px;top:18px;display:flex;gap:9px"><div class="cnt plank">{ic('Gold', 32)}<span class="gold">248</span></div><div class="cnt plank">{ic('Kills', 32)}<span>131</span></div></div>'''

# ------------------------------------------------------------------ art pulled from the other pipelines

def assets():
    import heroes, fx, people, crops as C
    a = {}
    a['knight'] = heroes.knight('front').render()
    a['knight_side'] = heroes.knight('side').render()
    a['knight_dead'] = fx.death('knight')[2]
    a['lvl'] = fx.level_up()[2]
    pk = json.load(open(os.path.join(SPR, 'bosses', 'bosses.json')))['enemies']
    def boss(k):
        e = pk[k]; fw, fh = e['frame']; return Image.open(os.path.join(SPR, 'bosses', e['file'])).convert('RGBA').crop((0, 0, fw, fh))
    a['pack'] = boss('pack_leader'); a['emperor'] = boss('emperor')
    a['seed_keeper'] = people.seed_keeper('front').render(); a['shopkeeper'] = people.shopkeeper('front').render()
    a['forest'] = Image.open(os.path.join(SC, 'forest.png')); a['meadow'] = Image.open(os.path.join(SC, 'meadow.png')); a['void'] = Image.open(os.path.join(SC, 'void.png')); a['caverns'] = Image.open(os.path.join(SC, 'caverns.png'))
    a['town'] = Image.open(os.path.join(SC, 'town.png'))
    import interiors
    a['cabin'] = interiors.cabin_interior().img
    a['field'] = field(C)
    return a

def field(C):
    """Round 12 crop field at game size: 20 open plots (5x4) with crops, locked plots under rocks around it,
    and the hover preview for a Crystal Bloom (1x2)."""
    from farm import P
    from farm import Cv, grass, fence_h, fence_v, scarecrow
    TW, TH = 10, 8
    W, H_ = TW * 16, TH * 16
    cv = Cv(W, H_, 9); grass(cv, flowers=18)
    fence_h(cv, 4, W - 4, 10); fence_h(cv, 4, W - 4, H_ - 3)
    im = cv.img.convert('RGBA')
    ox, oy = 2, 2
    planted = {(0, 0): ('Frost Berry', 3), (1, 0): ('Frost Berry', 2), (2, 0): ('Healing Herb', 3), (3, 0): ('Wheat', 3), (4, 0): ('Wheat', 2),
               (0, 1): ('Thunder Turnip', 2), (1, 1): ('Fire Pepper', 1), (2, 2): ('Pep Root', 3), (3, 3): ('Echo Bloom', 2), (4, 3): ('Shadow Mushroom', 3)}
    fns = {n: f for _, _, lst, _ in C.TIERS for n, f in lst}
    rare = {(0, 2): 'Storm Seed'}   # a 1x2 already growing on (0,2)-(1,2)
    # locked plots (rows below, column to the right)
    lockt = [(5, r) for r in range(4)] + [(c, 4) for c in range(6)]
    for (c, r) in lockt:
        x, y = (ox + c) * 16, (oy + r) * 16
        p = C.plot(1, 1, seed=c * 7 + r); arr = np.array(p); arr[..., :3] = (arr[..., :3] * .55).astype(np.uint8); p = Image.fromarray(arr, 'RGBA')
        im.alpha_composite(p, (x, y))
        d = Image.new('RGBA', (16, 16)); dd = np.array(d)
        for (rx, ry, rr) in ((5, 7, 4), (11, 10, 3)):
            for yy in range(16):
                for xx in range(16):
                    if (xx - rx) ** 2 + ((yy - ry) * 1.3) ** 2 <= rr * rr: dd[yy, xx] = (*P['st0'], 255) if yy < ry else (*P['st1'], 255)
            dd[ry - rr // 2, rx - 1] = (*P['st2'], 255)
        im.alpha_composite(Image.fromarray(dd, 'RGBA'), (x, y))
    for r in range(4):
        for c in range(5):
            x, y = (ox + c) * 16, (oy + r) * 16
            if (c, r) in rare or (c - 1, r) in rare: continue
            if (c, r) in planted:
                n, st = planted[(c, r)]; im.alpha_composite(C.stage(n, fns[n], 1, 1, st), (x, y - 16))
            else:
                im.alpha_composite(C.plot(1, 1, seed=c + r * 5), (x, y))
    for (c, r), n in rare.items():
        im.alpha_composite(C.stage(n, fns[n], 2, 1, 2), ((ox + c) * 16, (oy + r) * 16 - 16))
    # hover preview: Crystal Bloom on (2,1)-(3,1)
    gx, gy = (ox + 2) * 16, (oy + 1) * 16
    ghost = C.stage('Crystal Bloom', fns['Crystal Bloom'], 2, 1, 3)
    garr = np.array(ghost); garr[..., 3] = (garr[..., 3] * .55).astype(np.uint8); ghost = Image.fromarray(garr, 'RGBA')
    ov = np.array(im)
    for yy in range(gy, gy + 16):
        for xx in range(gx, gx + 32):
            ov[yy, xx, :3] = (ov[yy, xx, :3] * .6 + np.array([95, 224, 120]) * .4).astype(np.uint8)
    im = Image.fromarray(ov, 'RGBA'); im.alpha_composite(ghost, (gx, gy - 16))
    o = np.array(im); white = (255, 255, 255, 255)
    for (cx, cy, dx, dy) in ((gx - 1, gy - 1, 1, 1), (gx + 32, gy - 1, -1, 1), (gx - 1, gy + 16, 1, -1), (gx + 32, gy + 16, -1, -1)):
        for k in range(4): o[cy, cx + dx * k] = white; o[cy + dy * k, cx] = white
    # a blocked second spot (red) to show what an invalid placement looks like: half on a locked tile
    bx, by = (ox + 4) * 16, (oy + 2) * 16
    for yy in range(by, by + 16):
        for xx in range(bx, bx + 32):
            o[yy, xx, :3] = (o[yy, xx, :3] * .55 + np.array([224, 70, 50]) * .45).astype(np.uint8)
    return Image.fromarray(o, 'RGBA'), (gx, gy, bx, by)

# ================================================================== screens

def pause(A):
    weapons = [('Frost Nova', 3), ('Orbital Blades', 1)]
    wl = ''.join(f'<div class="row">{slot(n, 32)}<span>{n.upper()}</span><span class="dim">LV {lv}</span></div>' for n, lv in weapons)
    inner = bg(A['forest'], .62) + hud_ghost() + f'''
<div class="abs panel" style="left:432px;top:150px;width:416px;padding:24px;display:grid;gap:15px">
  <div class="t32 gold" style="text-align:center">PAUSED</div>
  <div class="t8 dim" style="text-align:center">ROUND 8 · FOREST · 1:42</div>
  <div class="btn sel">RESUME<span class="sub">ESC</span></div>
  <div class="btn">STATS<span class="sub">TAB</span></div>
  <div class="btn">OPTIONS</div>
  <div class="btn">GIVE UP RUN</div>
</div>
<div class="abs panel side" style="left:888px;top:150px;width:356px;padding:18px;display:grid;gap:12px">
  <div class="lbl">YOUR BUILD</div>
  <div class="row big">{px(A['knight'], 2, 'Knight')}<div style="display:grid;gap:6px"><span class="t16">KNIGHT</span><span class="t8 dim">LEVEL 9</span></div></div>
  {wl}
  <div class="row">{slot('Renewal', 32)}<span>RENEWAL</span><span class="dim">BLESSING</span></div>
  <div class="row">{slot('Frost Berry', 32)}<span>FROST BERRY</span><span class="dim">THIS ROUND</span></div>
</div>
<div class="abs panel side" style="left:36px;top:150px;width:356px;padding:18px;display:grid;gap:12px">
  <div class="lbl">THIS ROUND SO FAR</div>
  <div class="row">{slot('Kills', 32)}<span>KILLS</span><span class="gold">131</span></div>
  <div class="row">{slot('Gold', 32)}<span>GOLD</span><span class="gold">248</span></div>
  <div class="row">{slot('Slime Gel', 32)}<span>SLIME GEL</span><span>12</span></div>
  <div class="row">{slot('Bat Wings', 32)}<span>BAT WINGS</span><span>4</span></div>
  <div class="row">{slot('Swarm', 32)}<span>SWARM</span><span class="dim">MUTATOR</span></div>
  <div class="row">{slot('Berserkers', 32)}<span>BERSERKERS</span><span class="dim">MUTATOR</span></div>
</div>
<div class="abs hint" style="left:0;right:0;bottom:24px;justify-content:center">{KEY('&uarr;')}{KEY('&darr;')} CHOOSE {KEY('ENTER')} SELECT {KEY('ESC')} RESUME</div>'''
    return inner

def stats_tab(A):
    rows = [('Vitality', 'MAX HP', '130', '+14%', '148'), ('Power', 'DAMAGE', '140%', '+16%', '162%'), ('Swiftness', 'MOVE SPEED', '75%', '+4%', '78%'),
            ('Precision', 'CRIT', '5%', '+3%', '8%'), ('Armor', 'ARMOR', '15%', '+12%', '27%'), ('Rapid Fire', 'ATTACK SPEED', '80%', '+6%', '85%'),
            ('Luck', 'LUCK', '0%', '+12%', '12%'), ('Magnetism', 'PICKUP RANGE', '100%', '+10%', '110%')]
    tr = ''.join(f'<div class="srow2">{slot(i, 32)}<span>{n}</span><span class="dim">{b}</span><span class="ok">{plus}</span><span class="gold">{t}</span></div>' for i, n, b, plus, t in rows)
    cards = [('Vitality', 3), ('Power', 4), ('Swiftness', 1), ('Precision', 2), ('Armor', 2), ('Rapid Fire', 2), ('Magnetism', 1), ('Fortune', 0), ('Momentum', 0), ('Adrenaline', 1), ('Thick Skin', 2), ('Multi Shot', 1)]
    cg = ''.join(f'<div class="cc{" none" if n == 0 else ""}">{slot(c, 48)}<span class="t8">{c.upper()}</span><span class="cnt2">x{n}</span></div>' for c, n in cards)
    inner = bg(A['forest'], .78) + f'''
<div class="abs t24 gold" style="left:36px;top:30px">STATS</div>
<div class="abs t8 dim" style="left:180px;top:42px">KNIGHT · LEVEL 9 · ROUND 8</div>
<div class="abs panel" style="left:36px;top:84px;width:500px;height:640px;padding:18px;display:grid;gap:6px;align-content:start">
  <div class="srow2 head"><span></span><span class="lbl">STAT</span><span class="lbl">BASE</span><span class="lbl">BONUS</span><span class="lbl">NOW</span></div>
  {tr}
  <div class="rule2"></div>
  <div class="lbl">BONUS: CARDS, TRAINING, BLESSINGS, CROP, POTIONS</div>
  <div class="row" style="gap:12px">{px(A['knight'], 2, 'Knight')}<div class="desc">Fortified: +30% HP and +15% armor are already in the base column. Heavy: slowest hero.</div></div>
</div>
<div class="abs panel" style="left:552px;top:84px;width:356px;height:640px;padding:18px;display:grid;gap:12px;align-content:start">
  <div class="lbl">LEVEL-UP CARDS · 19 TAKEN</div>
  <div class="cgrid">{cg}</div>
  <div class="desc">Cards stay for the whole run. Faded cards have not come up yet.</div>
</div>
<div class="abs panel" style="left:924px;top:84px;width:320px;height:640px;padding:18px;display:grid;gap:12px;align-content:start">
  <div class="lbl">WEAPONS</div>
  <div class="row">{slot('Frost Nova', 32)}<span>FROST NOVA</span><span class="dim">LV 3 · CHILL</span></div>
  <div class="row">{slot('Orbital Blades', 32)}<span>ORBITAL BLADES</span><span class="dim">LV 1</span></div>
  <div class="lbl" style="margin-top:6px">BLESSINGS</div>
  <div class="row">{slot('Renewal', 32)}<span>RENEWAL</span><span class="dim">1% HP/S</span></div>
  <div class="lbl" style="margin-top:6px">CROP THIS ROUND</div>
  <div class="row">{slot('Frost Berry', 32)}<span>FROST BERRY</span><span class="dim">10% SLOW AURA</span></div>
  <div class="lbl" style="margin-top:6px">POTION BELT</div>
  <div style="display:flex;gap:9px">{slot('Heal Flask', 32)}{slot('Speed Draught', 32)}{slot('Ghost Oil', 32)}</div>
  <div class="lbl" style="margin-top:6px">COMPANIONS</div>
  <div class="row">{slot('Dogs', 32)}<span>1 DOG</span><span class="dim">READY</span></div>
</div>
<div class="abs hint" style="right:36px;top:36px">{KEY('TAB')} CLOSE</div>'''
    return inner

def round_complete(A):
    mats = [('Slime Gel', 14), ('Bat Wings', 6), ('Wisp Dust', 3), ('Bone Fragments', 2)]
    mh = ''.join(f'<div class="loot">{slot(n, 48)}<span>+{v}</span></div>' for n, v in mats)
    inner = bg(A['forest'], .7) + f'''
<div class="abs" style="left:0;right:0;top:48px;text-align:center"><div class="t48 gold">ROUND 8 CLEAR!</div><div class="t16 cream" style="margin-top:12px">PACK LEADER WOLF DOWN · FOREST 3 / 5</div></div>
<div class="abs panel" style="left:190px;top:200px;width:560px;padding:21px;display:grid;gap:12px">
  <div class="lbl">REWARDS</div>
  <div class="tally"><span>{ic('Gold', 32)}GOLD PICKED UP</span><span>264</span></div>
  <div class="tally"><span>{ic('Swarm', 32)}ARENA BONUS +125%</span><span class="ok">+330</span></div>
  <div class="tally big2"><span>{ic('Gold', 32)}TOTAL GOLD</span><span class="gold">+594</span></div>
  <div class="rule2"></div>
  <div class="lbl">MATERIALS</div>
  <div class="loots">{mh}</div>
  <div class="rule2"></div>
  <div class="lbl">MINI-BOSS DROP</div>
  <div class="loots"><div class="loot">{slot('Thunder Turnip', 48)}<span>SEED</span></div><div class="loot">{slot('XP Gem', 48)}<span>+60 XP</span></div></div>
</div>
<div class="abs panel" style="left:770px;top:200px;width:320px;padding:21px;display:grid;gap:12px">
  <div class="lbl">THE FIGHT</div>
  <div class="tally"><span>{ic('Kills', 32)}KILLS</span><span>214</span></div>
  <div class="tally"><span>{ic('Timer', 32)}TIME</span><span>2:46</span></div>
  <div class="tally"><span>{ic('Vitality', 32)}HP LEFT</span><span>94</span></div>
  <div class="tally"><span>{ic('Frost Nova', 32)}TOP WEAPON</span><span>61%</span></div>
  <div class="rule2"></div>
  <div class="lbl">BACK ON THE FARM</div>
  <div class="desc">3 crops ready to harvest. Training Grounds: pick today's stat.</div>
</div>
<div class="abs" style="left:0;right:0;bottom:60px;display:flex;justify-content:center;gap:18px"><div class="btn primary">TO THE FARM</div></div>
<div class="abs hint" style="left:0;right:0;bottom:18px;justify-content:center">{KEY('ENTER')} CONTINUE</div>'''
    return inner

def death(A):
    inner = bg(A['forest'], .55) + '<div class="abs redvig"></div>' + f'''
<div class="abs" style="left:0;right:0;top:54px;text-align:center"><div class="t48" style="color:#ff6a50;text-shadow:3px 3px 0 #3a0806">RUN OVER</div><div class="t16 cream" style="margin-top:12px">FELL IN ROUND 8 · FOREST</div></div>
<div class="abs" style="left:150px;top:230px;width:360px;display:grid;justify-items:center;gap:12px">
  <div class="fallen">{px(A['knight_dead'], 4, 'The knight, fallen')}</div>
  <div class="panel" style="padding:12px 15px;display:flex;gap:12px;align-items:center">{px(A['pack'], 1, 'Pack Leader Wolf', 'width:84px;height:72px')}<div style="display:grid;gap:6px"><span class="lbl">DEFEATED BY</span><span class="t16" style="color:#ff8a70">PACK LEADER</span><span class="t8 dim">MINI-BOSS</span></div></div>
</div>
<div class="abs panel" style="left:560px;top:200px;width:560px;padding:21px;display:grid;gap:12px">
  <div class="lbl">THIS RUN</div>
  <div class="tally"><span>{ic('Timer', 32)}ROUNDS CLEARED</span><span>7 / 30</span></div>
  <div class="tally"><span>{ic('Kills', 32)}ENEMIES DEFEATED</span><span>1,284</span></div>
  <div class="tally"><span>{ic('Gold', 32)}GOLD EARNED</span><span class="gold">2,960</span></div>
  <div class="tally"><span>{ic('XP Gem', 32)}HERO LEVEL</span><span>9</span></div>
  <div class="tally"><span>{ic('Frost Nova', 32)}BEST WEAPON</span><span>FROST NOVA LV 3</span></div>
  <div class="tally"><span>{ic('Upgrade', 32)}BUILDINGS AT T2</span><span>6 / 6</span></div>
  <div class="rule2"></div>
  <div class="desc">Runs start fresh: nothing carries over yet (meta-progression is still undecided).</div>
</div>
<div class="abs" style="left:560px;top:620px;display:flex;gap:18px"><div class="btn sel">TRY AGAIN</div><div class="btn">NEW HERO</div><div class="btn">TITLE</div></div>
<div class="abs hint" style="right:36px;bottom:18px">{KEY('ENTER')} SELECT</div>'''
    return inner

def victory(A):
    conf = ''.join(f'<i style="left:{random.Random(i).randrange(0, 1260)}px;top:{random.Random(i * 3).randrange(0, 760)}px;background:{["#ffcc44", "#fff3b0", "#5fe0c8", "#f4a6c6", "#df6448"][i % 5]}"></i>' for i in range(70))
    stats = [('Timer', 'ROUNDS CLEARED', '30 / 30'), ('Kills', 'ENEMIES DEFEATED', '9,412'), ('Gold', 'GOLD EARNED', '18,240'), ('XP Gem', 'HERO LEVEL', '31'), ('Golem Core', 'GOLEM CORES FOUND', '7')]
    th = ''.join(f'<div class="tally"><span>{ic(i, 32)}{n}</span><span>{v}</span></div>' for i, n, v in stats)
    build = ''.join(slot(n, 48) for n in ('Frost Nova', 'Orbital Blades', 'Renewal', 'Wrath', 'Guardian', 'Phoenix Flower', 'Void Heart'))
    inner = bg(A['void'], .45) + f'<div class="abs confetti">{conf}</div>' + f'''
<div class="abs" style="left:0;right:0;top:36px;text-align:center"><div class="t48 gold">VICTORY!</div><div class="t16 cream" style="margin-top:12px">ALL 30 ROUNDS CLEARED · THE VOID EMPEROR FALLS</div></div>
<div class="abs" style="left:110px;top:170px;width:400px;height:420px">
  <div style="position:absolute;left:92px;top:0">{px(A['lvl'], 3, '')}</div>
  <div style="position:absolute;left:144px;top:120px">{px(A['knight'], 4, 'The knight, victorious')}</div>
  <div style="position:absolute;left:250px;top:250px;opacity:.55;filter:grayscale(1) brightness(.6)">{px(A['emperor'], 1, 'The Void Emperor, defeated', 'width:112px;height:110px')}</div>
</div>
<div class="abs panel" style="left:560px;top:170px;width:600px;padding:21px;display:grid;gap:12px">
  <div class="lbl">KNIGHT · THE JUGGERNAUT</div>
  {th}
  <div class="rule2"></div>
  <div class="lbl">FINAL BUILD</div>
  <div style="display:flex;gap:9px;flex-wrap:wrap">{build}</div>
</div>
<div class="abs" style="left:560px;top:640px;display:flex;gap:18px"><div class="btn primary">NEW RUN</div><div class="btn">TITLE</div></div>'''
    return inner

def options(A):
    def slider(n, v, mx=10):
        return f'<div class="opt"><span>{n}</span><div class="seg big3" style="--c:var(--gold)">' + ''.join(f'<i class="{"on" if i < v else ""}"></i>' for i in range(mx)) + f'</div><span class="v">{v * 10}%</span></div>'
    def tog(n, on, sub=''):
        return f'<div class="opt"><span>{n}{f"<small>{sub}</small>" if sub else ""}</span><div class="tog{" on" if on else ""}"><i></i></div><span class="v">{"ON" if on else "OFF"}</span></div>'
    keys = [('MOVE', 'W A S D'), ('ABILITY', 'SPACE'), ('POTIONS', 'Q E R'), ('STATS', 'TAB'), ('PAUSE', 'ESC'), ('INTERACT', 'E'), ('ROTATE CROP', 'R')]
    kh = ''.join(f'<div class="opt"><span>{n}</span><span>{"".join(KEY(k) for k in v.split())}</span></div>' for n, v in keys)
    inner = bg(A['meadow'], .72) + f'''
<div class="abs t24 gold" style="left:60px;top:42px">OPTIONS</div>
<div class="abs panel" style="left:60px;top:100px;width:260px;padding:15px;display:grid;gap:9px">
  <div class="btn sel">AUDIO</div><div class="btn">SCREEN</div><div class="btn">CONTROLS</div><div class="btn">GAMEPLAY</div>
</div>
<div class="abs panel" style="left:340px;top:100px;width:440px;padding:21px;display:grid;gap:15px;align-content:start">
  <div class="lbl">AUDIO</div>
  {slider('MASTER', 8)}{slider('MUSIC', 6)}{slider('EFFECTS', 7)}
  <div class="lbl" style="margin-top:9px">SCREEN</div>
  {tog('FULLSCREEN', True)}{slider('SCREEN SHAKE', 5)}{tog('DAMAGE NUMBERS', True)}{tog('FEWER FLASHES', False, 'Softer hit flash and boss death')}
</div>
<div class="abs panel" style="left:800px;top:100px;width:420px;padding:21px;display:grid;gap:12px;align-content:start">
  <div class="lbl">CONTROLS</div>
  {kh}
  <div class="desc">Keys can be changed. Gamepad and touch controls are still to be designed.</div>
</div>
<div class="abs hint" style="left:60px;bottom:30px">{KEY('&uarr;')}{KEY('&darr;')} CHOOSE {KEY('&larr;')}{KEY('&rarr;')} CHANGE {KEY('ESC')} BACK</div>'''
    return inner

def cabin(A):
    chest = ['Heal Flask', 'Heal Flask', 'Speed Draught', 'Iron Brew', 'Focus Drops', 'Ghost Oil', None, None, None, None]
    ch = ''.join(slot(p, 48) for p in chest)
    binn = [('Frost Berry', 4), ('Healing Herb', 2), ('Wheat', 5), ('Pep Root', 3), ('Fire Pepper', 1), ('Thunder Turnip', 2), ('Glow Moss', 1), ('Echo Bloom', 1)]
    bh = ''.join(slot(n, 48, 'slot' + (' sel' if n == 'Frost Berry' else ''), f'<span class="n">{q}</span>') for n, q in binn) + '<div class="slot"></div>' * (20 - len(binn))
    inner = bg(A['cabin'], .55) + f'''
<div class="abs bhead panel">{slot('Heal Flask', 48)}<div class="t"><div class="nm gold">CABIN</div><div class="t8 dim">STORAGE</div></div></div>
<div class="abs wallet panel">{wallet()}</div>
<div class="abs panel chestp" style="left:24px;top:120px;width:420px;height:548px;padding:18px;display:grid;gap:12px;align-content:start">
  <div style="display:flex;justify-content:space-between"><span class="h gold">POTION CHEST</span><span class="lbl" style="align-self:center">6 / 10</span></div>
  <div class="chest">{ch}</div>
  <div class="rule2"></div>
  <div class="lbl">POTION BELT · TAKEN INTO THE FIGHT</div>
  <div style="display:flex;gap:12px">
    <div class="slot belt"><span class="key">Q</span>{ic('Heal Flask', 48)}</div>
    <div class="slot belt"><span class="key">E</span>{ic('Speed Draught', 48)}</div>
    <div class="slot belt"><span class="key">R</span>{ic('Ghost Oil', 48)}</div>
  </div>
  <div class="desc">Move potions between the chest and the belt here or at the Alchemy Lab.</div>
</div>
<div class="abs panel binp" style="left:460px;top:120px;width:796px;height:548px;padding:18px;display:grid;gap:12px;align-content:start">
  <div style="display:flex;justify-content:space-between"><span class="h gold">HARVEST BIN</span><span class="lbl" style="align-self:center">19 / 20 CROPS</span></div>
  <div class="bin">{bh}</div>
  <div class="rule2"></div>
  <div class="pick">
    {slot('Frost Berry', 64)}
    <div style="display:grid;gap:9px"><span class="t16">FROST BERRY x4</span><span class="desc">Each crop is used one of two ways.</span></div>
    <div class="usebtn sel"><span class="t8 gold">EAT FOR NEXT ROUND</span><span class="desc">Passive 10% slow aura for one round</span></div>
    <div class="usebtn"><span class="t8">KEEP FOR ALCHEMY</span><span class="desc">Frost Elixir, Ghost Oil, Iron Brew</span></div>
  </div>
</div>
<div class="abs bfoot"><div class="hint">{KEY('&larr;')}{KEY('&rarr;')}{KEY('&uarr;')}{KEY('&darr;')} MOVE {KEY('ENTER')} USE {KEY('X')} TO BELT {KEY('ESC')} LEAVE</div></div>'''
    return inner

def planting(A):
    img, (gx, gy, bx, by) = A['field']
    k = 3; W, H_ = img.width * k, img.height * k
    left, top = 24 + (724 - W) // 2, 130
    bag = [('Crystal Bloom', 1), ('Storm Seed', 1), ('Frost Berry', 3), ('Wheat', 4), ('Iron Vine', 2), ('Bloodroot', 1), ('Healing Herb', 2), ('Glow Moss', 1), (None, 0), (None, 0), (None, 0), (None, 0)]
    bh = ''.join(slot(n, 48, 'slot' + (' sel' if n == 'Crystal Bloom' else ''), f'<span class="n">{q}</span>' if q else '') for n, q in bag)
    inner = '<div class="abs farmbg"></div>' + f'''
<div class="abs fieldbox" style="left:{left}px;top:{top}px;width:{W}px;height:{H_}px">{px(img, 3, 'Crop field with a Crystal Bloom placement preview')}
  <div class="cursor" style="left:{(gx + 22) * k}px;top:{(gy + 9) * k}px"></div>
  <div class="ftag ok2" style="left:{gx * k}px;top:{(gy + 17) * k}px">FITS · 2 PLOTS</div>
  <div class="ftag no2" style="left:{bx * k - 60}px;top:{(by + 17) * k}px">BLOCKED · LOCKED PLOT</div>
</div>
<div class="abs panel legend" style="left:24px;top:{top + H_ + 21}px;width:724px;padding:12px 15px">
  <span><i style="background:#86573a"></i>OPEN PLOT</span><span><i style="background:#57a940"></i>GROWING</span><span><i style="background:#6d6d78"></i>LOCKED (ROCKS)</span><span><i style="background:#5fe078"></i>FITS</span><span><i style="background:#e04632"></i>BLOCKED</span>
</div>
<div class="abs bhead panel">{slot('Crystal Bloom', 48)}<div class="t"><div class="nm gold">PLANTING</div><div class="t8 dim">ROUND 12 · 20 / 30 PLOTS OPEN</div></div></div>
<div class="abs panel" style="left:764px;top:120px;width:492px;height:548px;padding:18px;display:grid;gap:12px;align-content:start">
  <div class="lbl">SEED BAG · 8 / 12</div>
  <div class="bag">{bh}</div>
  <div class="rule2"></div>
  <div class="pick" style="grid-template-columns:72px 1fr">{slot('Crystal Bloom', 64)}<div style="display:grid;gap:6px"><span class="t16">CRYSTAL BLOOM</span><span class="t8"><span class="tagk" style="background:#4a86e8;color:#fff">RARE</span> <span class="dim">3 ROUNDS · 1x2</span></span></div></div>
  <div class="desc">Frost effects radius +50% when harvested and eaten. Ready at the start of round 15.</div>
  <div class="lbl">FOOTPRINT</div>
  <div class="foot"><i class="on"></i><i class="on"></i></div>
  <div class="desc">Green: fits on open plots. Red: something is in the way (a crop, a rock or the field edge).</div>
</div>
<div class="abs bfoot"><div class="hint">{KEY('CLICK')} PLANT {KEY('R')} ROTATE {KEY('1')}-{KEY('8')} PICK SEED {KEY('ESC')} DONE</div></div>'''
    return inner

def shop_bg(A, cx, cy):
    t = A['town']; k = 3
    L = min(0, max(1280 - t.width * k, 640 - cx * k)); Tp = min(0, max(800 - t.height * k, 400 - cy * k))
    return f'<div class="room" style="left:{L}px;top:{Tp}px;width:{t.width * k}px;height:{t.height * k}px"><img src="{b64(t)}" alt="" style="width:100%;height:100%"></div><div class="shade" style="background:rgba(8,6,4,.62)"></div>'

def seed_shop(A):
    stock = [('Frost Berry', 'STANDARD', '2 ROUNDS', 'Passive 10% slow aura', 30), ('Fire Pepper', 'STANDARD', '2 ROUNDS', '15% chance attacks ignite', 30),
             ('Iron Vine', 'STANDARD', '2 ROUNDS', '+15% armor', 35), ('Wheat', 'QUICK', '1 ROUND', '+5 gold per kill', 12),
             ('Healing Herb', 'QUICK', '1 ROUND', 'Regen 1 HP/s for 30s', 10), ('Echo Bloom', 'STANDARD', '2 ROUNDS', '10% chance projectiles double', 40)]
    tag = {'QUICK': '#6cb046', 'STANDARD': '#c9a03c'}
    st = ''.join(f'''<div class="item{" sel" if n == "Iron Vine" else ""}">{slot(n, 48)}<div style="display:grid;gap:6px"><span class="t8">{n.upper()}</span><span class="t8"><span class="tagk" style="background:{tag[t]}">{t}</span> <span class="dim">{g} · 1x1</span></span><span class="e">{e}</span></div><span class="price">{ic('Gold', 32)}{p}</span></div>''' for n, t, g, e, p in stock)
    bag = [('Frost Berry', 3), ('Wheat', 4), ('Healing Herb', 2), ('Glow Moss', 1), ('Thorn Seed', 2), ('Thunder Turnip', 1)] + [(None, 0)] * 6
    bh = ''.join(slot(n, 48, 'slot', f'<span class="n">{q}</span>' if q else '') for n, q in bag)
    inner = shop_bg(A, 85, 200) + f'''<div class="t-seed" style="position:absolute;inset:0">
<div class="abs bhead panel">{slot('Healing Herb', 48)}<div class="t"><div class="nm gold">SEED SHOP</div><div class="t8 dim">FOREST STOCK · NEW SEEDS EVERY ROUND</div></div></div>
<div class="abs wallet panel" style="width:auto">{wallet(GOLD, [])}</div>
<div class="abs panel" style="left:24px;top:120px;width:300px;height:548px;padding:18px;display:grid;gap:12px;align-content:start;justify-items:center">
  <div class="keeper">{px(A['seed_keeper'], 4, 'The seed keeper')}</div>
  <div class="say" style="width:100%">Iron Vine's a good one for a Knight. Plant it twice and you'll feel it.</div>
</div>
<div class="abs panel" style="left:340px;top:120px;width:580px;height:548px;padding:18px;display:grid;gap:9px;align-content:start">
  <div style="display:flex;justify-content:space-between"><span class="h gold">TODAY'S SEEDS</span><span class="lbl" style="align-self:center">QUICK + STANDARD IN THE FOREST</span></div>
  <div class="stock">{st}</div>
  <div class="lbl">RARE SEEDS FROM ROUND 11 · LEGENDARY FROM ROUND 16</div>
</div>
<div class="abs panel" style="left:936px;top:120px;width:320px;height:548px;padding:18px;display:grid;gap:12px;align-content:start">
  <div class="lbl">YOUR SEED BAG · 6 / 12 SLOTS</div>
  <div class="bag" style="grid-template-columns:repeat(4, 60px)">{bh}</div>
  <div class="rule2"></div>
  <div class="row">{slot('Iron Vine', 48)}<div style="display:grid;gap:6px"><span class="t8">IRON VINE</span><span class="t8 dim">2 ROUNDS · +15% ARMOR</span></div></div>
  <div class="btn primary" style="justify-content:center">BUY · 35G</div>
</div>
<div class="abs bfoot"><div class="hint">{KEY('ENTER')} BUY {KEY('TAB')} SELL SEEDS {KEY('ESC')} LEAVE</div></div></div>'''
    return inner

def general_store(A):
    buy = [('Upgrade', 'FIELD EXPANSION', 'Opens 4 more crop plots (rounds 8-10)', 100, True), ('Slime Gel', 'SLIME GEL x5', 'Basic material', 40, False),
           ('Bone Fragments', 'BONE FRAGMENTS x5', 'Basic material', 45, False), ('Spore Dust', 'SPORE DUST x5', 'Basic material', 45, False), ('Bat Wings', 'BAT WINGS x5', 'Basic material', 50, False)]
    bh = ''.join(f'<div class="item{" sel" if s else ""}">{slot(i, 48)}<div style="display:grid;gap:6px"><span class="t8">{n}</span><span class="e">{e}</span></div><span class="price">{ic("Gold", 32)}{p}</span></div>' for i, n, e, p, s in buy)
    sell = [('Wheat', 5, 4), ('Pep Root', 3, 3), ('Frost Berry', 4, 8), ('Slime Gel', 18, 2), ('Bone Fragments', 14, 2)]
    sh = ''.join(f'<div class="item">{slot(n, 48, "slot", f"<span class=n>{q}</span>")}<span class="t8">{n.upper()}</span><span class="price">{ic("Gold", 32)}{p} EA</span></div>' for n, q, p in sell)
    inner = shop_bg(A, 545, 200) + f'''<div class="t-store" style="position:absolute;inset:0">
<div class="abs bhead panel">{slot('Gold', 48)}<div class="t"><div class="nm gold">GENERAL STORE</div><div class="t8 dim">BUY AND SELL</div></div></div>
<div class="abs wallet panel">{wallet()}</div>
<div class="abs panel" style="left:24px;top:120px;width:300px;height:548px;padding:18px;display:grid;gap:12px;align-content:start;justify-items:center">
  <div class="keeper">{px(A['shopkeeper'], 4, 'The shopkeeper')}</div>
  <div class="say" style="width:100%">More field, more crops. Can't argue with that, can you?</div>
</div>
<div class="abs panel" style="left:340px;top:120px;width:500px;height:548px;padding:18px;display:grid;gap:9px;align-content:start">
  <div class="h gold" style="margin-bottom:6px">BUY</div>
  <div class="stock">{bh}</div>
</div>
<div class="abs panel" style="left:856px;top:120px;width:400px;height:548px;padding:18px;display:grid;gap:9px;align-content:start">
  <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="h gold">SELL</span><span class="lbl" style="align-self:center">FROM YOUR BIN AND BAG</span></div>
  <div class="stock sellp">{sh}</div>
</div>
<div class="abs bfoot"><div class="hint">{KEY('ENTER')} BUY OR SELL {KEY('TAB')} SWITCH SIDE {KEY('ESC')} LEAVE</div></div></div>'''
    return inner

CSS = '''
.ghost { opacity: .45; } .cnt { display: flex; gap: 6px; align-items: center; padding: 3px 9px 3px 3px; font-size: 16px; }
.row { display: flex; gap: 12px; align-items: center; font-size: 8px; line-height: 12px; } .row > span:last-child { margin-left: auto; text-align: right; }
.row .slot { width: 48px; height: 48px; } .row.big { gap: 15px; }
.side .row span:nth-child(2) { flex: 1; }
.lbl { font-size: 8px; line-height: 12px; color: var(--dim); letter-spacing: 1px; }
.h { font-size: 16px; line-height: 24px; }
.desc { font-family: var(--body); font-size: 18px; line-height: 20px; font-weight: 600; color: var(--dim); }
.ok { color: var(--ok); } .rule2 { height: 3px; background: #7a5a2c; }
.spr { image-rendering: pixelated; display: block; }
.srow2 { display: grid; grid-template-columns: 48px 1fr 72px 72px 72px; gap: 12px; align-items: center; font-size: 8px; line-height: 12px; }
.srow2 .slot { width: 48px; height: 48px; } .srow2 > span:nth-child(n+3) { text-align: right; }
.srow2.head { margin-bottom: 3px; }
.cgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.cc { display: grid; justify-items: center; gap: 6px; text-align: center; position: relative; }
.cc .slot { width: 66px; height: 66px; } .cc.none { opacity: .35; }
.cnt2 { position: absolute; right: 6px; top: 42px; font-size: 8px; color: var(--ink); background: var(--gold); border: 3px solid var(--ink); padding: 0 3px; }
.tally { display: flex; justify-content: space-between; align-items: center; font-size: 8px; line-height: 12px; }
.tally > span:first-child { display: flex; gap: 9px; align-items: center; }
.tally > span:last-child { font-size: 16px; }
.tally.big2 > span:last-child { font-size: 24px; }
.loots { display: flex; gap: 12px; flex-wrap: wrap; }
.loot { display: grid; justify-items: center; gap: 6px; font-size: 8px; } .loot .slot { width: 66px; height: 66px; }
.redvig { inset: 0; background: radial-gradient(circle at 50% 50%, transparent 40%, rgba(120,10,6,.55) 100%); }
.fallen { padding: 6px; }
.confetti i { position: absolute; width: 9px; height: 9px; }
.opt { display: grid; grid-template-columns: 1fr auto 60px; gap: 12px; align-items: center; font-size: 8px; line-height: 12px; }
.opt small { display: block; font-family: var(--body); font-size: 14px; font-weight: 600; color: var(--dim); margin-top: 3px; }
.opt .v { text-align: right; color: var(--dim); }
.seg.big3 > i { width: 15px; height: 18px; }
.tog { width: 60px; height: 27px; background: #1a120a; border: 3px solid var(--ink); position: relative; box-shadow: inset 0 0 0 3px #3a2a14; }
.tog i { position: absolute; left: 3px; top: 3px; width: 21px; height: 15px; background: #6a5a46; } .tog.on { background: #2c5a1c; } .tog.on i { left: auto; right: 3px; background: var(--ok); }
.bhead { left: 24px; top: 18px; display: flex; gap: 12px; align-items: center; padding: 9px 18px 9px 9px; }
.bhead .slot { width: 66px; height: 66px; } .bhead .t { display: grid; gap: 9px; } .bhead .nm { font-size: 24px; line-height: 30px; }
.wallet { right: 24px; top: 18px; display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; width: 560px; padding: 9px; }
.wallet .w { display: flex; gap: 6px; align-items: center; font-size: 8px; padding: 0 6px 0 0; }
.wallet .w.g { font-size: 16px; color: var(--gold); text-shadow: 3px 3px 0 var(--ink); padding-right: 12px; }
.bfoot { left: 24px; right: 24px; bottom: 24px; display: flex; justify-content: flex-end; }
.chest { display: grid; grid-template-columns: repeat(5, 66px); gap: 9px; } .chest .slot { width: 66px; height: 66px; }
.slot.belt { width: 78px; height: 78px; } .slot.belt .key { position: absolute; left: -9px; top: -12px; }
.slot .n { position: absolute; right: 3px; bottom: 0; font-size: 8px; color: #fff; text-shadow: 3px 3px 0 var(--ink); }
.slot.sel { box-shadow: inset 0 0 0 3px var(--gold), 0 0 0 3px var(--gold); }
.bin { display: grid; grid-template-columns: repeat(10, 66px); gap: 9px; } .bin .slot { width: 66px; height: 66px; }
.pick { display: grid; grid-template-columns: 84px 220px 1fr 1fr; gap: 15px; align-items: center; } .pick .slot { width: 84px; height: 84px; }
.usebtn { padding: 12px; border: 3px solid var(--ink); background: #1a120a; display: grid; gap: 6px; box-shadow: inset 0 0 0 3px #5a4020; }
.usebtn.sel { box-shadow: inset 0 0 0 3px var(--gold); background: #3a2a10; }
.bag { display: grid; grid-template-columns: repeat(6, 66px); gap: 9px; } .bag .slot { width: 66px; height: 66px; }
.fieldbox { border: 3px solid var(--ink); box-shadow: 0 0 0 3px #7a5a2c, 0 6px 0 3px rgba(0,0,0,.4); overflow: hidden; }
.cursor { position: absolute; width: 27px; height: 33px; background: #fff; clip-path: polygon(0 0, 0 80%, 25% 62%, 45% 100%, 60% 92%, 42% 56%, 75% 56%); filter: drop-shadow(3px 3px 0 #2b1d14); }
.ftag { position: absolute; font-size: 8px; line-height: 12px; padding: 3px 6px; border: 3px solid var(--ink); white-space: nowrap; }
.ftag.ok2 { background: #6cb046; color: var(--ink); } .ftag.no2 { background: #c0402f; color: #fff3d0; }
.farmbg { inset: 0; background: repeating-linear-gradient(0deg, rgba(0,0,0,.06) 0 3px, transparent 3px 48px), repeating-linear-gradient(90deg, rgba(0,0,0,.06) 0 3px, transparent 3px 48px), #2c4a1c; }
.legend { display: flex; gap: 21px; font-size: 8px; line-height: 12px; } .legend span { display: flex; gap: 9px; align-items: center; } .legend i { width: 18px; height: 18px; border: 3px solid var(--ink); }
.foot { display: flex; gap: 3px; } .foot i { width: 48px; height: 48px; border: 3px solid var(--ink); background: #6cb046; box-shadow: inset 0 3px 0 0 #b6e07e; }
.tagk { font-size: 8px; line-height: 12px; padding: 3px 6px; border: 3px solid var(--ink); background: var(--gold); color: var(--ink); white-space: nowrap; }
.say { font-family: var(--body); font-size: 18px; line-height: 20px; font-weight: 600; color: var(--ink); background: var(--fg); border: 3px solid var(--ink); padding: 9px 12px; position: relative; }
.say::after { content: ''; position: absolute; left: 50%; top: -12px; width: 18px; height: 12px; background: var(--fg); clip-path: polygon(50% 0, 0 100%, 100% 100%); }
.keeper { width: 192px; height: 192px; display: grid; place-items: center; background: #1a120a; border: 3px solid var(--ink); box-shadow: inset 0 0 0 3px #5a4020; }
.stock { display: grid; gap: 6px; }
.item { display: grid; grid-template-columns: 60px 1fr auto; gap: 12px; align-items: center; padding: 6px; border: 3px solid transparent; }
.item .slot { width: 60px; height: 60px; } .item .e { font-family: var(--body); font-size: 15px; line-height: 16px; font-weight: 600; color: var(--dim); }
.item.sel { border-color: var(--gold); background: rgba(255,204,68,.1); }
.price { display: flex; gap: 3px; align-items: center; font-size: 8px; color: var(--gold); white-space: nowrap; } .price .icon { width: 32px; height: 32px; }
.tabs2 { display: flex; gap: 6px; margin-bottom: 6px; } .tabs2 span { font-size: 8px; line-height: 12px; padding: 6px 12px; border: 3px solid var(--ink); background: #3a2a14; color: var(--dim); } .tabs2 span.on { background: var(--gold); color: var(--ink); }
.sellp .item { grid-template-columns: 60px 1fr auto; }
/* seed shop: leafy green trim; general store: striped awning trim */
.t-seed .panel { background: repeating-linear-gradient(180deg, #2a3a1c 0 21px, #233018 21px 24px); box-shadow: inset 0 3px 0 0 #93cf63, inset 0 0 0 3px #3f8a34, 0 6px 0 0 rgba(0,0,0,.4); }
.t-seed .btn.primary { background: #3f8a34; box-shadow: inset 0 3px 0 0 #93cf63, inset 0 -3px 0 0 #1c4a18, 0 0 0 3px #ffcc44; }
.t-store .panel { background: repeating-linear-gradient(90deg, #4a3418 0 21px, #3e2c14 21px 24px); box-shadow: inset 0 9px 0 0 transparent, inset 0 0 0 3px #7a5a2c, 0 6px 0 0 rgba(0,0,0,.4); border-top: 12px solid transparent;
  border-image: repeating-linear-gradient(90deg, #c0402f 0 18px, #f2ece0 18px 36px) 12 0 0 0 / 12px 0 0 0; }
'''

def main():
    groups = render_all()
    for items in groups.values():
        for n, im in items: ICONS[n] = b64(im)
    A = assets()
    screens = [
        screen('pause', 'Pause', 'ESC during a fight. The fight freezes and dims behind a short menu. Either side shows what this round has brought so far (kills, gold, materials, the Arena mutators) and the build you brought into it (weapons, blessing, the crop eaten for this round).', pause(A)),
        screen('stats', 'Stats (TAB)', 'TAB in a fight, in the pause menu or while picking a level-up card. Left: every stat as base, bonus and current value. Middle: how many of each level-up card you hold (cards stay all run; faded ones have not come up yet). Right: weapons and mods, blessings, the crop for this round, the potion belt and companions.', stats_tab(A)),
        screen('round', 'Round complete', 'After the mini-boss falls. Gold is tallied with the Arena bonus on its own line, then materials and the mini-boss drop (a guaranteed seed). The right panel sums up the fight and what is waiting on the farm, then one button goes home.', round_complete(A)),
        screen('death', 'Run over', 'HP hits zero: the knight\'s death frames play and the screen tints red. What beat you is shown with its portrait, with a summary of the run. Try again keeps the hero; New hero goes to class select. Nothing carries over between runs because meta-progression is still undecided.', death(A)),
        screen('win', 'Victory', 'After the round 30 Void Emperor. Gold confetti over the Void zone, the hero in a level-up burst with the defeated emperor greyed out behind, and the run\'s totals and final build.', victory(A)),
        screen('options', 'Options', 'From the title screen or the pause menu. Audio sliders and screen settings on one page (including a reduced-flash switch for the hit flash and boss death), and the key list. Sliders are 10-step segment bars from the shared kit.', options(A)),
        screen('cabin', 'Cabin storage · Potion Chest and Harvest Bin', 'Opened inside the cabin. The Potion Chest holds 10 potions and fills the Q/E/R belt you take into the fight. The Harvest Bin holds 20 crops; picking one shows its two uses from the design: eat it for next round\'s buff or keep it for Alchemy (with the recipes that use it).', cabin(A)),
        screen('planting', 'Planting with hover preview', 'Planting at round 12, when rare 1x2 crops are open. The camera zooms to the field, drawn at game size (16 px plots at 3x). The seed follows the cursor as a see-through plant over its footprint: green when it fits, red when it would cover a crop, a rock or the field edge. R rotates rare crops. The panel shows the seed bag (12 slots) and the picked seed.', planting(A)),
        screen('seeds', 'Seed shop', 'Over the town square, zoomed on the shop. The seed keeper on the left, today\'s stock in the middle (it changes each round and the tiers grow with the zone), and your 12-slot seed bag on the right. Stock and prices are placeholders until the design sets them.', seed_shop(A)),
        screen('store', 'General store', 'Buy on the left, sell on the right. The design doesn\'t say what the store sells yet, so this is a guess: the field expansions (4 more plots, priced from the plot unlock table) and basic materials, and selling spare crops and materials for gold. Prices are placeholders.', general_store(A)),
    ]
    nav = ''.join(f'<a class="chip" href="#{i}">{t}</a>' for i, t in (('pause', 'Pause'), ('stats', 'Stats'), ('round', 'Round complete'), ('death', 'Run over'), ('win', 'Victory'), ('options', 'Options'),
                                                                      ('cabin', 'Cabin storage'), ('planting', 'Planting'), ('seeds', 'Seed shop'), ('store', 'General store')))
    mt = open(os.path.join(HERE, 'menus_template.html')).read()
    kit = mt[mt.index('/* ---------- the in-game UI kit'):mt.index('/* ---------- 1 title')]
    page = open(os.path.join(HERE, 'buildings_template.html')).read()
    page = page[:page.index('/* ---------- shared building frame')] + CSS + page[page.index('footer { color'):]
    page = (page.replace('{{KIT}}', kit).replace('{{NAV}}', nav).replace('{{SCREENS}}', '\n'.join(screens))
            .replace('<title>Rogue Shooter Building Menus</title>', '<title>Rogue Shooter Menus 2</title>')
            .replace('Rogue Shooter v2 · Farm · Building menus', 'Rogue Shooter v2 · Menus, part 2')
            .replace('<h1>Six buildings, six menus</h1>', '<h1>The rest of the menus</h1>')
            .replace(page[page.index('<p class="lede">'):page.index('</p>', page.index('<p class="lede">')) + 4],
                     '<p class="lede">Every remaining screen: pause, stats, round complete, run over, victory and options in the fight; cabin storage and planting on the farm; the seed shop and general store in town. Same kit as the first menus page and the building menus: wood panels, Press Start 2P at 8/16/24/32/48 px, 3 px borders, icons at 2×/3×/4× only, and art at true game size behind each screen.</p>')
            .replace('Laid out by Claude (art/tools/ui/build_buildings.py). Interiors from art/tools/farmhub/interiors.py; icons in art/sprites/ui.',
                     'Laid out by Claude (art/tools/ui/build_menus2.py). Backgrounds from art/concepts/scenes and art/tools/farmhub; sprites from art/tools/combat and art/tools/farmlife; icons in art/sprites/ui.'))
    dst = os.path.join(ROOT, 'art', 'concepts', 'menus-2.html'); open(dst, 'w').write(page)
    print('wrote', dst, os.path.getsize(dst) // 1024, 'KB')

if __name__ == '__main__':
    main()
