"""Build art/concepts/buildings.html: the six farm building menus (Forge, Alchemy Lab, Training Grounds,
Shrine, Barn, Arena), each a 1280x800 frame opened over that building's interior.

Every screen shows the same mid-run moment so they can be compared: round 8, all buildings at T2,
412 gold and the materials in WALLET. Numbers for costs, caps and effects come from
design/game-design-v2.md; the player's inventory and choices are made up for the mock."""
import os, sys, io, re, json, base64, html as H
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'farmhub'))
from PIL import Image
from icons import render_all

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
ICONS = {}

def b64(im):
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def ic(name, size=48, alt=None, style=''):
    return f'<img class="icon" src="{ICONS[name]}" width="16" height="16" style="width:{size}px;height:{size}px;{style}" alt="{H.escape(alt if alt is not None else name)}">'

def slot(name, size=48, cls='slot', extra=''):
    return f'<div class="{cls}">{ic(name, size)}{extra}</div>'

WALLET = [('Slime Gel', 18), ('Bat Wings', 9), ('Bone Fragments', 14), ('Demon Essence', 6), ('Wisp Dust', 11), ('Spore Dust', 7), ('Golem Core', 1)]
HAVE = dict(WALLET); GOLD = 412

def cost(items, gold=None):
    out = []
    if gold is not None:
        out.append(f'<span class="{"short" if gold > GOLD else ""}">{ic("Gold", 32, "gold")}{gold}g</span>')
    for name, n in items:
        short = HAVE.get(name, 0) < n
        out.append(f'<span class="{"short" if short else ""}" title="{H.escape(name)}">{ic(name, 32)}{n}</span>')
    return '<span class="cost">' + ''.join(out) + '</span>'

def frame(theme, title, sub, icon, tier, inner, upgrade, hints, room):
    wallet = (f'<div class="w g">{ic("Gold", 32, "Gold")}{GOLD}</div>' +
              ''.join(f'<div class="w">{ic(n, 32)}{v}</div>' for n, v in WALLET))
    pips = ''.join(f'<i class="{"on" if i < tier else ""}"></i>' for i in range(3))
    return f'''<div class="room" style="{room[1]}"><img src="{room[0]}" alt="" style="width:100%;height:100%"></div><div class="shade"></div>
<div class="{theme}" style="position:absolute;inset:0">
<div class="abs bhead panel">{slot(icon, 48)}<div class="t"><div class="nm gold">{title}</div><div class="tier"><span class="dim">TIER</span>{pips}<span class="sub" style="margin-left:6px">{sub}</span></div></div></div>
<div class="abs wallet panel">{wallet}</div>
{inner}
<div class="abs bfoot"><div class="upg panel">{slot("Upgrade", 32)}<div>{upgrade}</div></div><div class="hint">{hints}</div></div>
</div>'''

def screen(id_, title, notes, inner):
    return f'''<section class="screen" id="{id_}"><header><h2>{title}</h2></header><p class="notes">{notes}</p>
<div class="stagewrap"><div class="stage">{inner}</div></div></section>'''

KEY = lambda k: f'<span class="key">{k}</span>'

def rooms():
    import interiors
    out = {}
    for name, fn in [('forge', interiors.forge_interior), ('alchemy', interiors.alchemy_interior), ('barn', interiors.barn_interior),
                     ('shrine', interiors.shrine_interior), ('training', interiors.training_interior), ('arena', interiors.arena_interior)]:
        c = fn(); img = c.img
        if name == 'arena': img = img.crop((40, 0, 360, 236))
        w, h = img.width * 3, img.height * 3
        out[name] = (b64(img), f'left:{(1280 - w) // 2}px;top:{(800 - h) // 2}px;width:{w}px;height:{h}px')
    return out

def npc(kind):
    """Hero-style farmer or arena warrior (farmlife/people.py), cropped to head and shoulders, for the speech panels (shown at 3x)."""
    sys.path.insert(0, os.path.join(HERE, '..', 'farmlife'))
    import people
    im = (people.farmer if kind == 'farmer' else people.warrior)('front').render()
    bb = im.getbbox()
    return b64(im.crop((0, bb[1], 32, bb[1] + 30)))

# ================================================================== FORGE

def forge(room):
    weapons = [('Frost Nova', 3, 'EQUIPPED · SLOT 1', 'sel'), ('Orbital Blades', 1, 'EQUIPPED · SLOT 2', ''), ('Chain Lightning', 2, 'OWNED', ''),
               ('Fire Trail', 0, 'BUY', 'no'), ('Homing Missiles', 0, 'BUY', 'no')]
    sig = {'Frost Nova': 'Slime Gel', 'Orbital Blades': 'Bone Fragments', 'Chain Lightning': 'Wisp Dust', 'Fire Trail': 'Demon Essence', 'Homing Missiles': 'Bat Wings'}
    rows = ''
    for name, lv, st, cls in weapons:
        pips = ''.join(f'<i class="{"on" if i < lv else "cap" if i < 5 else "lock"}"></i>' for i in range(7))
        tag = (f'<span class="tagk">{st}</span>' if 'EQUIPPED' in st else f'<span class="tagk dim">{st}</span>' if st == 'OWNED'
               else cost([(sig[name], 2)], 25))
        rows += f'''<div class="wrow {cls}">{slot(name, 48)}<div class="info"><span class="t8">{name.upper()}</span>{'<div class="pips">' + pips + '</div>' if lv else ''}{tag}</div></div>'''
    mods = [('Piercing', 'Hits +1 more enemy', [('Bone Fragments', 10), ('Bat Wings', 5)]), ('Siphon', '3% of damage heals you', [('Slime Gel', 10), ('Spore Dust', 5)]),
            ('Amplify', '+25% weapon damage', [('Demon Essence', 10), ('Wisp Dust', 5)]), ('Velocity', '+30% attack speed', [('Bat Wings', 10), ('Slime Gel', 5)]),
            ('Eruption', 'Kills explode', [('Demon Essence', 10), ('Bone Fragments', 5)]), ('Chill', 'Hits briefly slow', [('Slime Gel', 10), ('Wisp Dust', 5)])]
    modh = ''.join(f'<div class="mod{" sel" if n == "Chill" else ""}"><span class="hot">{n.upper()}</span><span class="desc" style="font-size:15px;line-height:16px">{e}</span>{cost(c)}</div>' for n, e, c in mods)
    inner = f'''
<div class="abs panel" style="left:24px;top:120px;width:388px;height:548px;padding:18px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px"><span class="h hot">WEAPONS</span><span class="lbl">SLOTS 2/2</span></div>
  <div class="wlist">{rows}</div>
</div>
<div class="abs panel" style="left:428px;top:120px;width:828px;height:548px;padding:18px;display:grid;gap:12px;align-content:start">
  <div class="anvil">{slot('Frost Nova', 64)}<div style="display:grid;gap:9px">
    <span class="t24 hot">FROST NOVA</span>
    <span class="desc">A burst of ice around you that slows what it hits. Signature material: Slime Gel.</span>
    <span class="t8">LEVEL 3 / 5 <span class="dim">· T3 RAISES THE CAP TO 7</span></span></div>
    <div style="margin-left:auto;display:grid;gap:9px;justify-items:end;flex:none"><span class="lbl">LEVEL 3 &rarr; 4</span><span style="white-space:nowrap">{cost([('Slime Gel', 10)], 100)}</span><div class="btn primary small">LEVEL UP</div></div>
  </div>
  <div class="fsec"><div style="display:flex;justify-content:space-between"><span class="lbl">MOD · ONE PER WEAPON</span><span class="lbl">CHILL: HITS BRIEFLY SLOW</span></div><div class="mods">{modh}</div></div>
  <div class="fsec"><div style="display:flex;justify-content:space-between"><span class="lbl">EVOLUTION · NEEDS FORGE T3 + LEVEL 5</span>{cost([('Golem Core', 1)], 200)}</div>
    <div class="evos">
      <div class="evo"><span class="lk">{ic('Lock', 32)}</span><span class="hot">ABSOLUTE ZERO</span><span>NEEDS ARMOR 30%</span><span class="dim">YOU: 22%</span></div>
      <div class="evo"><span class="lk">{ic('Lock', 32)}</span><span class="hot">GLACIAL TOMB</span><span>NEEDS POWER 135</span><span class="dim">YOU: 128</span></div>
    </div></div>
</div>'''
    up = f'<b>UPGRADE TO T3</b><br>LEVEL CAP 7, EVOLUTIONS<br>{cost([("Golem Core", 2)], 500)}'
    return frame('t-forge', 'FORGE', 'WEAPONS', 'Frost Nova', 2, inner, up, f'{KEY("ENTER")} LEVEL UP {KEY("E")} EQUIP {KEY("ESC")} LEAVE', room)

# ================================================================== ALCHEMY

def alchemy(room):
    elixirs = [('Berserker Brew', '+25% dmg + atk speed, -15% armor', False), ('Stone Skin Elixir', '+35% armor, hits capped at 10% HP', False),
               ('Ghost Oil', '+20% speed, 15% dodge', True), ('Vampiric Serum', '+15% damage, 5% lifesteal', False),
               ('Shadow Extract', '+20% crit, crits deal 3x', True), ('Harvest Moon Tonic', '+30% XP, gold and materials', True),
               ('Frost Elixir', 'Attacks slow enemies 15%', True), ('Storm Surge', '+30% atk speed, chain sparks', False)]
    recs = ''.join(f'<div class="rec{" sel" if n == "Frost Elixir" else ""}{"" if ok else " miss"}">{ic(n, 32)}<div><div class="n">{n.upper()}</div><div class="e">{e}</div></div></div>' for n, e, ok in elixirs)
    crops_have = {'Frost Berry': 4, 'Healing Herb': 2}
    ing = ''.join(f'<div class="ing">{slot(n, 32)}<span>{q} {n.upper()}</span><span class="have{"" if crops_have.get(n, HAVE.get(n, 0)) >= q else " short"}">{crops_have.get(n, HAVE.get(n, 0))}/{q}</span></div>'
                  for n, q in (('Frost Berry', 3), ('Healing Herb', 1), ('Slime Gel', 5)))
    chest = ['Heal Flask', 'Heal Flask', 'Speed Draught', 'Iron Brew', 'Focus Drops', 'Ghost Oil', None, None, None, None]
    chesth = ''.join((slot(p, 48) if p else '<div class="slot"></div>') for p in chest)
    inner = f'''
<div class="abs book" style="left:24px;top:132px;width:820px;height:536px">
  <div class="page">
    <div class="tabs"><span>POTIONS</span><span class="on">ELIXIRS</span><span class="lock">TONICS T3</span><span>CONVERT</span></div>
    <div class="lbl" style="margin-bottom:12px">ELIXIRS · 4 CROPS + 5 MATERIALS + 25G</div>
    <div class="recipes">{recs}</div>
  </div>
  <div class="page" style="display:grid;gap:9px;align-content:start;justify-items:center;text-align:center">
    <div class="slot" style="width:90px;height:90px;background:#d8caa4;box-shadow:inset 0 0 0 3px #5a2486">{ic('Frost Elixir', 64)}</div>
    <div class="h">FROST ELIXIR</div>
    <div class="desc" style="color:#6a5040">Your attacks slow enemies by 15% for 30 seconds.</div>
    <div class="lbl">LASTS 30 SECONDS · ONE BREW = ONE POTION</div>
    <div class="ingr" style="width:100%;text-align:left;gap:6px">{ing}<div class="ing">{slot('Gold', 32)}<span>25 GOLD</span><span class="have">{GOLD}/25</span></div></div>
    <div class="btn primary" style="justify-content:center;width:100%">BREW</div>
  </div>
</div>
<div class="abs panel" style="left:860px;top:132px;width:396px;height:536px;padding:18px;display:grid;gap:15px;align-content:start">
  <div class="lbl">POTION BELT</div>
  <div class="belt" style="display:flex;gap:12px">
    <div class="slot" style="width:72px;height:72px"><span class="key" style="position:absolute;left:-9px;top:-12px">Q</span>{ic('Heal Flask', 48)}</div>
    <div class="slot" style="width:72px;height:72px"><span class="key" style="position:absolute;left:-9px;top:-12px">E</span>{ic('Speed Draught', 48)}</div>
    <div class="slot" style="width:72px;height:72px"><span class="key" style="position:absolute;left:-9px;top:-12px">R</span>{ic('Ghost Oil', 48)}</div>
  </div>
  <div class="rule" style="height:3px;background:#6a3c98"></div>
  <div class="lbl">POTION CHEST · 6 / 10</div>
  <div class="chest">{chesth}</div>
  <div class="rule" style="height:3px;background:#6a3c98"></div>
  <div class="lbl">CONVERT</div>
  <div class="desc">3 seeds &rarr; 1 seed of the next tier.<br>5 of a material &rarr; 3 of another.</div>
</div>'''
    up = f'<b>UPGRADE TO T3</b><br>LEGENDARY TONICS, +25% POTENCY<br>{cost([("Golem Core", 2), ("Demon Essence", 10)], 400)}'
    return frame('t-alch', 'ALCHEMY LAB', 'CRAFTING', 'Heal Flask', 2, inner, up, f'{KEY("ENTER")} BREW {KEY("1")}-{KEY("3")} SET BELT {KEY("ESC")} LEAVE', room)

# ================================================================== TRAINING

def training(room):
    stats = [('HP', 'Vitality', 12), ('POWER', 'Power', 9), ('SPEED', 'Swiftness', 6), ('CRIT', 'Precision', 3), ('ARMOR', 'Armor', 6), ('FIRE RATE', 'Rapid Fire', 0), ('LUCK', 'Luck', 12)]
    rows = ''
    for lab, icn, v in stats:
        sel = lab == 'LUCK'
        cells = ''
        for i in range(0, 50, 3):
            cl = 'on' if i < v else 'add' if sel and i < v + 3 else 't3' if i >= 30 else ''
            cells += f'<i class="{cl}"></i>'
        rows += f'''<div class="srow{" sel" if sel else ""}">{slot(icn, 32)}<span class="n">{lab}</span><div class="track">{cells}<b style="left:calc(30 / 51 * 100%)"></b></div><span class="v">+{v}%</span></div>'''
    def odds(c, r, e, l):
        return ''.join(f'<div class="odd"><span>{n}</span><div class="bar"><i style="width:{p}%;background:var(--{k})"></i></div><span>{p}%</span></div>'
                       for n, p, k in (('COMMON', c, 'common'), ('RARE', r, 'rare'), ('EPIC', e, 'epic'), ('LEGEND', l, 'legend')))
    inner = f'''
<div class="abs panel" style="left:24px;top:120px;width:796px;height:548px;padding:18px 21px;display:grid;gap:6px;align-content:start">
  <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="h ink">TODAY'S DRILL</span><span class="lbl">PICK ONE STAT · +3% · ONCE PER ROUND</span></div>
  <div class="rope"></div>
  {rows}
  <div class="lbl" style="display:flex;justify-content:space-between"><span>BLACK LINE: T2 CAP 30%</span><span>OUTLINED: T3 RAISES IT TO 50%</span></div>
</div>
<div class="abs panel" style="left:836px;top:120px;width:420px;height:548px;padding:21px;display:grid;gap:15px;align-content:start">
  <div class="npc" style="align-items:center">{slot('Luck', 48)}<div style="display:grid;gap:6px"><span class="h ink">LUCK</span><span class="lbl">BETTER LEVEL-UP CARDS</span></div></div>
  <div class="rope"></div>
  <div class="lbl">CARD ODDS NOW · LUCK 12%</div>
  <div class="odds">{odds(50, 29, 15, 6)}</div>
  <div class="lbl">AFTER TRAINING · LUCK 15%</div>
  <div class="odds">{odds(48, 30, 16, 6)}</div>
  <div class="btn primary" style="justify-content:center">TRAIN LUCK +3%</div>
</div>'''
    up = f'<b>UPGRADE TO T3</b><br>+4% A ROUND, CAP 50%, 4 CARDS PER LEVEL-UP<br>{cost([("Golem Core", 1), ("Demon Essence", 10)], 350)}'
    return frame('t-train', 'TRAINING GROUNDS', 'STATS', 'Power', 2, inner, up, f'{KEY("&uarr;")}{KEY("&darr;")} CHOOSE {KEY("ENTER")} TRAIN {KEY("ESC")} LATER', room)

# ================================================================== SHRINE

def shrine(room):
    picks = [('Echo', '10% chance any attack fires twice', False), ('Wrath', '+1% damage per second in a fight; resets each round', True), ('Guardian', 'A shield soaks the first hit each round (20% max HP)', False)]
    cards = ''.join(f'<div class="bcard{" sel" if s else ""}">{slot(n, 64)}<span class="n holy">{n.upper()}</span><span class="desc" style="color:#c4cee6">{e}</span></div>' for n, e, s in picks)
    offering = ['Wisp Dust'] * 5 + ['Spore Dust'] * 3 + ['Bone Fragments'] * 2
    bowl = ''.join(slot(m, 32) for m in offering)
    names = ['Thorns', 'Vampirism', 'Guardian', 'Resilience', 'Swiftness (blessing)', 'Fortune (blessing)', 'Wrath', 'Renewal', 'Echo']
    codex = ''.join(f'<div>{slot(n, 48)}<span>{n.replace(" (blessing)", "").upper()}</span></div>' for n in names)
    inner = f'''
<div class="abs panel" style="left:24px;top:120px;width:276px;height:548px;padding:18px;display:grid;gap:12px;align-content:start">
  <span class="lbl">ACTIVE BLESSINGS · 1 / 2</span>
  <div class="active">
    <div class="aslot">{slot('Renewal', 48)}<div style="display:grid;gap:6px"><span class="t8 holy">RENEWAL</span><span class="desc" style="font-size:15px;line-height:16px;color:#c4cee6">Regenerate 1% max HP a second</span></div></div>
    <div class="aslot empty"><div class="slot"></div><span class="t8 dim">EMPTY SLOT</span></div>
    <div class="aslot lockd"><div class="slot">{ic('Lock', 32)}</div><span class="t8 dim">SHRINE T3</span></div>
  </div>
  <div class="desc" style="color:#c4cee6">A new blessing can replace an active one when your slots are full.</div>
</div>
<div class="abs panel" style="left:316px;top:120px;width:648px;height:548px;padding:21px;display:grid;gap:18px;align-content:start;justify-items:center">
  <span class="h holy">THE SHRINE ANSWERS</span>
  <div class="blessings" style="margin-top:9px">{cards}</div>
  <div style="display:flex;gap:12px"><div class="btn small">REROLL · 1 LEFT</div><div class="btn primary small" style="background:#2fa894;box-shadow:inset 0 3px 0 0 #9ffcff,inset 0 -3px 0 0 #0c3a3a,0 0 0 3px #ffcc44">TAKE WRATH</div></div>
  <div style="display:grid;gap:9px;justify-items:center"><span class="lbl">YOUR OFFERING · 10 MATERIALS + 30G</span><div class="bowl">{bowl}{slot('Gold', 32)}</div></div>
</div>
<div class="abs panel" style="left:980px;top:120px;width:276px;height:548px;padding:18px;display:grid;gap:12px;align-content:start">
  <span class="lbl">ALL 9 BLESSINGS</span>
  <div class="codex">{codex}</div>
</div>'''
    up = f'<b>UPGRADE TO T3</b><br>3 SLOTS, 2 REROLLS, CHEAPER OFFERINGS<br>{cost([("Golem Core", 2)], 450)}'
    return frame('t-shrine', 'SHRINE', 'BLESSINGS', 'Guardian', 2, inner, up, f'{KEY("&larr;")}{KEY("&rarr;")} CHOOSE {KEY("R")} REROLL {KEY("ESC")} LEAVE', room)

# ================================================================== BARN

def barn(room, farmer):
    animals = [('Chickens', '2 / 5 / 9 seeds a round', 0), ('Cows', '5 / 12 / 20 random materials', 1), ('Pigs', '25 / 60 / 100 gold', 0),
               ('Goats', '3 / 7 / 12 materials you choose', 0), ('Bees', '3 / 7 / 12 Spore Dust', 0), ('Dogs', '1 / 2 / 3 combat companions', 1)]
    rows = ''.join(f'''<div class="arow{" sel" if n == "Goats" else ""}">{slot(n, 48)}<div style="display:grid;gap:6px"><span class="n">{n.upper()}{f' <span class="tagk green" style="margin-left:6px">OWN {o}</span>' if o else ''}</span><span class="yl">{y}</span></div>{cost([], 150)}</div>''' for n, y, o in animals)
    stall = lambda n, out, extra='': f'''<div class="stall"><div class="pen">{ic(n, 64)}</div><span class="n">{n.upper()}</span><span class="desc">{out}</span>{extra}<div class="btn small">SELL · 75G</div></div>'''
    inner = f'''
<div class="abs panel" style="left:24px;top:120px;width:752px;height:372px;padding:24px">
  <div class="stalls">
    {stall('Cows', '5 random materials every round')}
    {stall('Dogs', 'Fights beside you (about 5% DPS)', '<span class="tagk teal">READY</span>')}
    <div class="stall lockd"><div class="pen">{ic('Lock', 48)}</div><span class="n">STALL 3</span><span class="desc">Opens at Barn T3</span></div>
  </div>
</div>
<div class="abs panel hay" style="left:24px;top:508px;width:752px;height:160px;padding:18px;display:grid;gap:12px;align-content:start">
  <div class="npc"><img src="{farmer}" alt="The farmer" style="width:96px"><div class="say">Two of the same animal give more than double. Three cows bring you 20 materials a round!</div></div>
  <div class="t8" style="display:flex;gap:18px;align-items:center"><span class="dim">NEXT ROUND</span><span style="display:flex;gap:6px;align-items:center">{ic('Cows', 32)}+5 MATERIALS</span><span style="display:flex;gap:6px;align-items:center">{ic('Dogs', 32)}+1 COMPANION</span></div>
</div>
<div class="abs panel hay" style="left:792px;top:120px;width:464px;height:548px;padding:18px;display:grid;gap:9px;align-content:start">
  <div style="display:flex;justify-content:space-between"><span class="h gold">BUY AN ANIMAL</span><span class="lbl" style="align-self:center">YIELD X1 / X2 / X3</span></div>
  <div class="market">{rows}</div>
  <div class="btn primary small off" style="justify-content:center">STALLS FULL · SELL ONE FIRST</div>
</div>'''
    up = f'<b>UPGRADE TO T3</b><br>A THIRD STALL<br>{cost([("Golem Core", 1)], 300)}'
    return frame('t-barn', 'BARN', 'ANIMALS', 'Cows', 2, inner, up, f'{KEY("ENTER")} BUY {KEY("S")} SELL {KEY("ESC")} LEAVE', room)

# ================================================================== ARENA

def arena(room, warrior):
    muts = [('Swarm', '+40% spawn rate'), ('Haste', 'Enemies 25% faster'), ('Tough Hide', 'Enemies +30% HP'), ('Fog of War', 'Vision -40%'), ('No Regen', 'No HP regen'),
            ('Berserkers', 'Enemies +40% damage'), ('Shielded', 'Every 5th enemy shielded'), ('Drought', 'No potions'), ('Gravity Well', 'You move 20% slower'), ('Thorned', 'Hits make you bleed'),
            ('Iron Will', 'Boss HP doubled'), ('Darkness', 'Screen slowly dims'), ('Mirror', 'Enemies reflect 10%'), ('Frenzy', 'Spawns double late'), ('Cursed', 'A weapon is disabled')]
    sel = {'Swarm', 'Berserkers'}
    cells = ''
    for i, (n, e) in enumerate(muts):
        cls = ' sel' if n in sel else ' lockd' if i >= 10 else ''
        cells += f'<div class="mut{cls}">{slot(n, 48)}<span class="n">{n.upper()}</span><span class="e">{e}</span></div>'
    inner = f'''
<div class="abs panel" style="left:24px;top:120px;width:812px;height:548px;padding:24px 18px 18px;display:grid;gap:12px;align-content:start">
  <div class="banners">{'<i></i>' * 9}</div>
  <div style="display:flex;justify-content:space-between;margin-top:24px"><span class="h gold">PICK UP TO 2 MUTATORS</span><span class="lbl" style="align-self:center">ROW 3 OPENS AT ARENA T3</span></div>
  <div class="mgrid">{cells}</div>
</div>
<div class="abs panel" style="left:852px;top:120px;width:404px;height:548px;padding:21px;display:grid;gap:15px;align-content:start">
  <div class="banners">{'<i></i>' * 5}</div>
  <div class="npc" style="margin-top:24px"><img src="{warrior}" alt="The arena warrior" style="width:96px"><div class="say">Swarm and Berserkers? The crowd will love you. Or bury you.</div></div>
  <div class="lbl">REWARD FOR ROUND 8</div>
  <div class="big">+125%</div>
  <div class="t8">GOLD AND MATERIALS</div>
  <div class="t8" style="display:flex;gap:9px;align-items:center"><span class="dim">DANGER</span>{''.join(ic('Kills', 32, '') if i < 4 else ic('Kills', 32, '', 'opacity:.25') for i in range(5))}</div>
  <div class="desc">You can also change these on the battle map before the fight.</div>
  <div style="display:grid;gap:12px;margin-top:6px"><div class="btn primary" style="justify-content:center">LOCK IN</div><div class="btn small" style="justify-content:center">CLEAR ALL</div></div>
</div>'''
    up = f'<b>UPGRADE TO T3</b><br>3 MUTATORS, +225% AND A RARE DROP<br>{cost([("Golem Core", 2)], 450)}'
    return frame('t-arena', 'ARENA', 'RISK AND REWARD', 'Berserkers', 2, inner, up, f'{KEY("ENTER")} TOGGLE {KEY("L")} LOCK IN {KEY("ESC")} LEAVE', room)


# ================================================================== T3 (unlocked) states

def evo_frames():
    sys.path.insert(0, os.path.join(HERE, '..', 'combat'))
    import weapons as W
    fr = {}
    for wname, col, items in W.WEAPONS:
        for n, fn, note, ms in items: fr[n] = fn()
    return fr

def forge_t3(room, evo):
    weapons = [('Frost Nova', 5, 'EQUIPPED · SLOT 1', 'sel'), ('Orbital Blades', 4, 'EQUIPPED · SLOT 2', ''), ('Chain Lightning', 2, 'OWNED', ''),
               ('Fire Trail', 0, 'BUY', 'no'), ('Homing Missiles', 0, 'BUY', 'no')]
    sig = {'Fire Trail': 'Demon Essence', 'Homing Missiles': 'Bat Wings'}
    rows = ''
    for name, lv, st, cls in weapons:
        pips = ''.join(f'<i class="{"on" if i < lv else "cap"}"></i>' for i in range(7))
        tag = (f'<span class="tagk">{st}</span>' if 'EQUIPPED' in st else f'<span class="tagk dim">{st}</span>' if st == 'OWNED' else cost([(sig[name], 2)], 25))
        rows += f'''<div class="wrow {cls}">{slot(name, 48)}<div class="info"><span class="t8">{name.upper()}</span>{'<div class="pips">' + pips + '</div>' if lv else ''}{tag}</div></div>'''
    def card(n, gate, you, ok, fr):
        img = fr[min(2, len(fr) - 1)]
        badge = '<span class="tagk green">READY</span>' if ok else ic('Lock', 32)
        youc = 'ok3' if ok else 'dim'
        return f'''<div class="evo3{" ok" if ok else ""}"><div class="evopic"><img src="{b64(img)}" alt="{n}" style="width:{img.width * 3}px;height:{img.height * 3}px"></div>
<div style="display:flex;justify-content:space-between;align-items:center"><span class="t16 hot">{n.upper()}</span>{badge}</div>
<span class="t8">NEEDS {gate} <span class="{youc}">· YOU: {you}</span></span></div>'''
    inner = f'''
<div class="abs panel" style="left:24px;top:120px;width:388px;height:548px;padding:18px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px"><span class="h hot">WEAPONS</span><span class="lbl">SLOTS 2/2</span></div>
  <div class="wlist">{rows}</div>
</div>
<div class="abs panel" style="left:428px;top:120px;width:828px;height:548px;padding:18px;display:grid;gap:12px;align-content:start">
  <div class="anvil">{slot('Frost Nova', 64)}<div style="display:grid;gap:9px">
    <span class="t24 hot">FROST NOVA</span>
    <span class="t8">LEVEL 5 / 7 · CHILL <span class="dim">· READY TO EVOLVE</span></span></div>
    <div style="margin-left:auto;display:grid;gap:9px;justify-items:end;flex:none"><span class="lbl">EVOLVE · KEEPS LEVEL AND MOD</span><span style="white-space:nowrap">{cost([('Golem Core', 1)], 200)}</span></div>
  </div>
  <div class="evos">{card('Absolute Zero', 'ARMOR 30%', '31%', True, evo['Absolute Zero'])}{card('Glacial Tomb', 'POWER 135', '128', False, evo['Glacial Tomb'])}</div>
  <div style="display:flex;gap:12px;align-items:center"><div class="btn primary small">EVOLVE INTO ABSOLUTE ZERO</div><span class="desc">Permanent: an evolved weapon can't go back.</span></div>
</div>'''
    up = '<b>FORGE T3</b><br>LEVEL CAP 7, EVOLUTIONS<br><span class="dim">FULLY UPGRADED</span>'
    return frame('t-forge', 'FORGE', 'WEAPONS', 'Frost Nova', 3, inner, up, f'{KEY("ENTER")} EVOLVE {KEY("&larr;")}{KEY("&rarr;")} CHOOSE {KEY("ESC")} LEAVE', room)

def alchemy_t3(room):
    tonics = [('Rage Infusion', 'Triple damage for 8 seconds', True), ('Time Stop Flask', 'Freeze every enemy for 4 seconds', True),
              ('Invincibility Draught', 'Take no damage for 5 seconds', False), ('Phoenix Draught', 'Revive once at 50% HP', True),
              ('Void Elixir', 'All weapon effects doubled for 10 seconds', False), ('Mega Magnet', 'Pull in every drop on screen', True)]
    recs = ''.join(f'<div class="rec{" sel" if n == "Time Stop Flask" else ""}{"" if ok else " miss"}">{ic(n, 32)}<div><div class="n">{n.upper()}</div><div class="e">{e}</div></div></div>' for n, e, ok in tonics)
    have = {'Crystal Bloom': 1, 'Frost Berry': 4, 'Wisp Dust': 11}
    ing = ''.join(f'<div class="ing">{slot(n, 32)}<span>{q} {n.upper()}</span><span class="have{"" if have[n] >= q else " short"}">{have[n]}/{q}</span></div>' for n, q in (('Crystal Bloom', 1), ('Frost Berry', 3), ('Wisp Dust', 10)))
    chest = ['Heal Flask', 'Heal Flask', 'Frost Elixir', 'Phoenix Draught', 'Ghost Oil', 'Iron Brew', 'Rage Infusion', None, None, None]
    chesth = ''.join((slot(p, 48) if p else '<div class="slot"></div>') for p in chest)
    belt = ''.join(f'<div class="slot" style="width:72px;height:72px"><span class="key" style="position:absolute;left:-9px;top:-12px">{k}</span>{ic(p, 48)}</div>' for k, p in (('Q', 'Heal Flask'), ('E', 'Rage Infusion'), ('R', 'Phoenix Draught')))
    inner = f'''
<div class="abs book" style="left:24px;top:132px;width:820px;height:536px">
  <div class="page">
    <div class="tabs"><span>POTIONS</span><span>ELIXIRS</span><span class="on">TONICS</span><span>CONVERT</span></div>
    <div class="lbl" style="margin-bottom:12px">LEGENDARY TONICS · RARE CROPS + 10 MATERIALS</div>
    <div class="recipes">{recs}</div>
    <div class="lbl" style="margin-top:12px">T3: EVERY POTION +25% STRONGER</div>
  </div>
  <div class="page" style="display:grid;gap:9px;align-content:start;justify-items:center;text-align:center">
    <div class="slot" style="width:90px;height:90px;background:#d8caa4;box-shadow:inset 0 0 0 3px #c89220">{ic('Time Stop Flask', 64)}</div>
    <div class="h">TIME STOP FLASK</div>
    <div class="desc" style="color:#6a5040">Every enemy on screen freezes for 4 seconds.</div>
    <div class="ingr" style="width:100%;text-align:left;gap:6px">{ing}<div class="ing">{slot('Gold', 32)}<span>50 GOLD</span><span class="have">412/50</span></div></div>
    <div class="btn primary" style="justify-content:center;width:100%">BREW</div>
  </div>
</div>
<div class="abs panel" style="left:860px;top:132px;width:396px;height:536px;padding:18px;display:grid;gap:15px;align-content:start">
  <div class="lbl">POTION BELT</div>
  <div class="belt" style="display:flex;gap:12px">{belt}</div>
  <div class="rule" style="height:3px;background:#6a3c98"></div>
  <div class="lbl">POTION CHEST · 7 / 10</div>
  <div class="chest">{chesth}</div>
</div>'''
    up = '<b>ALCHEMY LAB T3</b><br>LEGENDARY TONICS, +25% POTENCY<br><span class="dim">FULLY UPGRADED</span>'
    return frame('t-alch', 'ALCHEMY LAB', 'CRAFTING', 'Phoenix Draught', 3, inner, up, f'{KEY("ENTER")} BREW {KEY("1")}-{KEY("3")} SET BELT {KEY("ESC")} LEAVE', room)

def arena_t3(room, warrior):
    muts = [('Swarm', '+40% spawn rate'), ('Haste', 'Enemies 25% faster'), ('Tough Hide', 'Enemies +30% HP'), ('Fog of War', 'Vision -40%'), ('No Regen', 'No HP regen'),
            ('Berserkers', 'Enemies +40% damage'), ('Shielded', 'Every 5th enemy shielded'), ('Drought', 'No potions'), ('Gravity Well', 'You move 20% slower'), ('Thorned', 'Hits make you bleed'),
            ('Iron Will', 'Boss HP doubled'), ('Darkness', 'Screen slowly dims'), ('Mirror', 'Enemies reflect 10%'), ('Frenzy', 'Spawns double late'), ('Cursed', 'A weapon is disabled')]
    sel = {'Swarm', 'Berserkers', 'Iron Will'}
    cells = ''.join(f'<div class="mut{" sel" if n in sel else ""}">{slot(n, 48)}<span class="n">{n.upper()}</span><span class="e">{e}</span></div>' for n, e in muts)
    banners9, banners5 = '<i></i>' * 9, '<i></i>' * 5
    danger = ''.join(ic('Kills', 32, '') for i in range(5))
    inner = f'''
<div class="abs panel" style="left:24px;top:120px;width:812px;height:548px;padding:24px 18px 18px;display:grid;gap:12px;align-content:start">
  <div class="banners">{banners9}</div>
  <div style="display:flex;justify-content:space-between;margin-top:24px"><span class="h gold">PICK UP TO 3 MUTATORS</span><span class="lbl" style="align-self:center">ALL 15 OPEN AT T3</span></div>
  <div class="mgrid">{cells}</div>
</div>
<div class="abs panel" style="left:852px;top:120px;width:404px;height:548px;padding:21px;display:grid;gap:15px;align-content:start">
  <div class="banners">{banners5}</div>
  <div class="npc" style="margin-top:24px"><img src="{warrior}" alt="The arena warrior" style="width:96px"><div class="say">Iron Will on top of that? Now that's a show.</div></div>
  <div class="lbl">REWARD FOR ROUND 18</div>
  <div class="big">+225%</div>
  <div class="t8">GOLD AND MATERIALS</div>
  <div class="t8" style="display:flex;gap:9px;align-items:center">{ic('Golem Core', 32, '')}+ A GUARANTEED RARE DROP</div>
  <div class="t8" style="display:flex;gap:9px;align-items:center"><span class="dim">DANGER</span>{danger}</div>
  <div style="display:grid;gap:12px;margin-top:6px"><div class="btn primary" style="justify-content:center">LOCK IN</div><div class="btn small" style="justify-content:center">CLEAR ALL</div></div>
</div>'''
    up = '<b>ARENA T3</b><br>3 MUTATORS, +225% AND A RARE DROP<br><span class="dim">FULLY UPGRADED</span>'
    return frame('t-arena', 'ARENA', 'RISK AND REWARD', 'Iron Will', 3, inner, up, f'{KEY("ENTER")} TOGGLE {KEY("L")} LOCK IN {KEY("ESC")} LEAVE', room)

# ================================================================== page

def main():
    groups = render_all()
    for items in groups.values():
        for n, im in items: ICONS[n] = b64(im)
    rm = rooms()
    farmer, warrior = npc('farmer'), npc('warrior')
    evo = evo_frames()
    screens = [
        screen('forge', 'Forge · weapons', 'Iron plates with rivets and ember-orange type. Left: the five weapons, with level pips (orange = level, grey = up to the T2 cap of 5, faded = T3 levels), which two are equipped, and what an unowned weapon costs (25 gold + 2 of its signature material). Right: the selected weapon on the anvil, its next level and cost, the six mods (one per weapon, T2) and both evolutions with their stat gates (T3, level 5).', forge(rm['forge'])),
        screen('alchemy', 'Alchemy Lab · potions', 'A parchment recipe book on a purple workbench. Tabs split the T1 potions, T2 elixirs, locked T3 tonics and conversion. Recipes you can\'t make yet are faded. The right page shows the selected recipe with each crop and material (have / need) and the Brew button; the side panel holds the Q/E/R belt and the 10-slot Potion Chest.', alchemy(rm['alchemy'])),
        screen('training', 'Training Grounds · stats', 'A canvas board edged in rope. Seven trainable stats from the design, each a bar to the tier cap (black line at 30% for T2, outlined up to 50% for T3). Picking one shows the +3% it will add, blinking. Luck gets a side panel showing how it shifts level-up card odds, now and after training. This is also the popup that appears after each round.', training(rm['training'])),
        screen('shrine', 'Shrine · blessings', 'Stone tablets with a teal glow and gold for the chosen card. You offer 10 materials and 30 gold, the shrine shows three blessings, and you take one or reroll (one reroll at T2). Active blessings sit on the left (2 slots at T2, the third locked) and all nine blessings are listed on the right so you know what can come up.', shrine(rm['shrine'])),
        screen('barn', 'Barn · animals', 'Red barn planks with white trim and hay-colored side panels. Each stall shows its animal and what it brings every round, with Sell (half the tier\'s build cost). The market lists all six animals with their x1 / x2 / x3 yields. The farmer explains stacking, and the bottom line totals what you get next round.', barn(rm['barn'], farmer)),
        screen('arena', 'Arena · mutators', 'Dark stone under red and gold banners. All fifteen mutators by tier (the T3 row locked), with up to two picked at T2. The side panel shows the reward for the next round, the danger level and the arena warrior\'s opinion. The same picks can be changed on the battle map.', arena(rm['arena'], warrior)),
        screen('forge3', 'Forge at T3 · evolutions unlocked', "Later in the run (round 18): the Forge is at T3, Frost Nova has reached level 5 and the level cap is 7. Each evolution card previews the evolved effect at game size. Absolute Zero's armor gate is met, so it can be bought (200 gold + 1 Golem Core); Glacial Tomb still needs more power.", forge_t3(rm['forge'], evo)),
        screen('alchemy3', 'Alchemy Lab at T3 · legendary tonics', 'The Tonics tab is open: six legendary tonics made from rare crops, in gold-capped bottles so they stand out on the belt. Recipes you are missing a crop for are faded. Every potion is 25% stronger at T3.', alchemy_t3(rm['alchemy'])),
        screen('arena3', 'Arena at T3 · all mutators', 'All fifteen mutators are open and up to three can be picked. The reward rises to +225% gold and materials plus a guaranteed rare drop.', arena_t3(rm['arena'], warrior)),
    ]
    nav = ''.join(f'<a class="chip" href="#{i}">{t}</a>' for i, t in (('forge', 'Forge'), ('alchemy', 'Alchemy Lab'), ('training', 'Training'), ('shrine', 'Shrine'), ('barn', 'Barn'), ('arena', 'Arena'), ('forge3', 'Forge T3'), ('alchemy3', 'Alchemy T3'), ('arena3', 'Arena T3')))
    mt = open(os.path.join(HERE, 'menus_template.html')).read()
    kit = mt[mt.index('/* ---------- the in-game UI kit'):mt.index('/* ---------- 1 title')]
    page = open(os.path.join(HERE, 'buildings_template.html')).read()
    page = page.replace('{{KIT}}', kit).replace('{{NAV}}', nav).replace('{{SCREENS}}', '\n'.join(screens))
    dst = os.path.join(ROOT, 'art', 'concepts', 'buildings.html'); open(dst, 'w').write(page)
    print('wrote', dst, os.path.getsize(dst) // 1024, 'KB')

if __name__ == '__main__':
    main()
