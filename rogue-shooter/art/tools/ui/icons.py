"""16x16 pixel icons for menus and the HUD: level-up cards, weapons, abilities, potions, materials
and currency. Drawn with the hero toolkit, so they share its shading and outlines."""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'enemies'))
import ekit
from ekit import R, ramp, hx, WHITE, EYE, blob, line_dots, glow
from spritekit import Sprite

R.update({
    'heart':  ramp('#4a0c18', '#8a1a2a', '#d0303c', '#f4646a', '#ffb4b4'),
    'copper': ramp('#3a1a0a', '#6e3416', '#a85a2a', '#d88a4a', '#f4c08a'),
    'magR':   ramp('#4a0c0c', '#8a1a1a', '#c83030', '#ec6050', '#ffa090'),
    'ice':    ramp('#1e4660', '#3a7090', '#68a6c4', '#a0d6ea', '#e0f8ff'),
    'yel':    ramp('#5a4000', '#a07a00', '#e0b810', '#ffe040', '#fffac0'),
    'glass':  ramp('#3a4a5a', '#6a8494', '#a8c4d0', '#d8ecf2', '#ffffff'),
    'bark':   ramp('#24160c', '#432a18', '#6a4628', '#90683c', '#b48c58'),
})

def S(): return Sprite(16, 16, 0)

# ------------------------------------------------------------------ level-up cards

def vitality():
    s = S(); blob(s, 'heart', [('ell', 5, 6, 3.5, 3.5), ('ell', 10, 6, 3.5, 3.5), ('poly', [(1.5, 7), (14, 7), (8, 14), (7, 14)])])
    s.dots([(4, 4), (3, 5), (5, 4)], WHITE); s.dots([(7, 6), (7, 7), (7, 8), (6, 7), (8, 7)], ('heart', 4))
    return s

def power():
    s = S()
    s.line('steel', [(3, 12), (11, 4)], 2); s.dots([(11, 3), (12, 3), (12, 4)], ('steel', 4))
    s.line('gold', [(2, 8), (7, 13)], 1); s.line('leather', [(1, 14), (4, 11)], 2); s.dot(1, 14, ('gold', 3))
    s.dots([(6, 9), (8, 7), (10, 5)], ('steel', 4))
    return s

def swiftness():
    s = S()
    blob(s, 'leather', [('rect', 5, 3, 9, 11), ('poly', [(5, 10), (11, 10), (14, 12), (14, 14), (5, 14)])])
    s.rect('gold', 5, 3, 9, 4); s.rect('dleather', 5, 13, 14, 14)
    s.dots([(6, 6), (6, 8), (6, 10)], ('leather', 4)); s.dots([(7, 6), (7, 8)], ('gold', 3))
    s.poly('cream', [(5, 5), (1, 2), (0, 4), (2, 6), (0, 7), (3, 8), (5, 8)])
    s.dots([(2, 4), (3, 6)], ('cream', 1)); s.dot(1, 3, WHITE)
    return s

def precision():
    s = S()
    blob(s, 'red', [('ell', 7.5, 7.5, 6.5, 6.5)]); s.ell('cream', 7.5, 7.5, 4.5, 4.5); s.ell('red', 7.5, 7.5, 2.5, 2.5); s.dots([(7, 7), (8, 7), (7, 8), (8, 8)], WHITE)
    s.dots([(3, 4), (4, 3)], ('red', 4))
    return s

def armor():
    s = S()
    blob(s, 'steel', [('poly', [(2, 2), (13, 2), (13, 8), (7.5, 14), (2, 8)])])
    s.poly('blue', [(4, 4), (11, 4), (11, 8), (7.5, 12), (4, 8)])
    s.dots([(7, 5), (8, 5), (7, 6), (8, 6), (7, 7), (8, 7), (6, 6), (9, 6), (7, 8), (8, 8), (7, 9), (8, 9)], ('gold', 3))
    s.dots([(3, 3), (4, 3), (3, 4)], ('steel', 4))
    return s

def rapid_fire():
    s = S()
    for y0 in (3, 9):
        s.line('wood', [(2, y0 + 2), (11, y0 + 2)], 1)
        s.poly('steel', [(11, y0), (14, y0 + 2), (11, y0 + 4)])
        s.dots([(2, y0 + 1), (3, y0 + 1), (2, y0 + 3), (3, y0 + 3)], ('feather', 3))
    s.dots([(12, 4), (12, 10)], ('steel', 4))
    return s

def magnetism():
    s = S()
    blob(s, 'magR', [('poly', [(2, 2), (6, 2), (6, 8), (7, 10), (9, 10), (10, 8), (10, 2), (14, 2), (14, 9), (11, 13), (5, 13), (2, 9)])])
    s.rect('silver', 2, 2, 5, 4); s.rect('silver', 11, 2, 14, 4)
    s.dots([(3, 6), (3, 8)], ('magR', 4)); s.dots([(1, 0), (8, 0), (15, 0)], ('vial_g', 3))
    return s

def fortune():
    s = S()
    blob(s, 'leather', [('ell', 8, 10, 5.5, 4.5), ('poly', [(5, 6), (11, 6), (10, 4), (6, 4)])])
    s.rect('gold', 5, 5, 11, 5)
    s.ell('gold', 8, 10, 2.5, 2.5); s.dots([(7, 9), (8, 9)], ('gold', 4)); s.dot(8, 10, ('gold', 1))
    s.dots([(4, 8), (4, 10)], ('leather', 4))
    for x, y in ((12, 2), (3, 1)): s.dots([(x, y), (x + 1, y)], ('gold', 4))
    return s

def momentum():
    s = S()
    blob(s, 'orange', [('poly', [(2, 13), (5, 6), (7, 9), (9, 2), (12, 7), (14, 4), (14, 13)])])
    blob(s, 'gold', [('poly', [(5, 13), (7, 10), (9, 12), (10, 8), (12, 13)])])
    s.dots([(9, 4), (5, 8)], ('orange', 4)); s.dots([(9, 11), (8, 12)], ('gold', 4))
    return s

def adrenaline():
    s = S()
    blob(s, 'heart', [('ell', 5, 6, 3.5, 3.5), ('ell', 10, 6, 3.5, 3.5), ('poly', [(1.5, 7), (14, 7), (8, 14), (7, 14)])])
    s.poly('yel', [(8, 2), (5, 8), (8, 8), (6, 13), (11, 6), (8, 6), (10, 2)])
    s.dots([(4, 4), (3, 5)], WHITE)
    return s

def thick_skin():
    s = S()
    blob(s, 'leather', [('poly', [(3, 2), (12, 2), (13, 13), (8, 15), (2, 13)])])
    for y in (5, 8, 11): line_dots(s, [(3, y), (12, y)], ('leather', 1))
    s.dots([(5, 4), (10, 4), (5, 7), (10, 7), (5, 10), (10, 10)], ('steel', 4))
    s.dots([(3, 3), (4, 3)], ('leather', 4))
    return s

def multi_shot():
    s = S()
    for (x1, y1) in ((2, 3), (8, 1), (14, 3)):
        line_dots(s, [(8, 14), (x1, y1 + 2)], ('wood', 1))
        dx = (x1 - 8) / 12
        s.poly('steel', [(x1, y1), (x1 - 2 - dx, y1 + 3), (x1 + 2 - dx, y1 + 3)])
        s.dot(x1, y1 + 1, ('steel', 4))
    s.dots([(7, 14), (9, 14), (8, 15), (6, 15), (10, 15)], ('feather', 3))
    return s


CARDS = [('Vitality', vitality), ('Power', power), ('Swiftness', swiftness), ('Precision', precision), ('Armor', armor), ('Rapid Fire', rapid_fire),
         ('Magnetism', magnetism), ('Fortune', fortune), ('Momentum', momentum), ('Adrenaline', adrenaline), ('Thick Skin', thick_skin), ('Multi Shot', multi_shot)]

# ------------------------------------------------------------------ weapons (one color each)

def orbital_blades():
    s = S()
    for k in range(3):
        a = k * math.tau / 3 - 0.4
        pts = []
        for t in range(6):
            r = 2.5 + t
            pts.append((8 + math.cos(a + t * 0.18) * r, 8 + math.sin(a + t * 0.18) * r))
        back = [(8 + math.cos(a + 0.5 + t * 0.1) * (2.5 + t * 0.7), 8 + math.sin(a + 0.5 + t * 0.1) * (2.5 + t * 0.7)) for t in range(5, -1, -1)]
        s.poly('gold', pts + back)
        s.dot(*pts[-1], WHITE)
    s.ell('steel', 8, 8, 2.2, 2.2); s.dot(7, 7, WHITE)
    return s

def chain_lightning():
    s = S()
    s.poly('yel', [(9, 1), (3, 9), (7, 9), (5, 15), (13, 6), (9, 6), (12, 1)])
    s.dots([(9, 2), (8, 4), (6, 7)], WHITE)
    return s

def fire_trail():
    s = S()
    blob(s, 'ember', [('poly', [(3, 14), (2, 9), (5, 5), (6, 8), (8, 1), (11, 6), (12, 4), (14, 9), (13, 14)])])
    blob(s, 'gold', [('poly', [(5, 14), (6, 10), (8, 12), (9, 8), (11, 14)])])
    s.dots([(8, 3), (5, 7)], ('ember', 4)); s.dots([(8, 11), (9, 10)], WHITE)
    return s

def frost_nova():
    s = S()
    for k in range(3):
        a = k * math.pi / 3
        dx, dy = math.cos(a) * 6.5, math.sin(a) * 6.5
        s.line('ice', [(8 - dx, 8 - dy), (8 + dx, 8 + dy)], 1)
        for sg in (-1, 1):
            bx, by = 8 + dx * 0.6 * sg, 8 + dy * 0.6 * sg
            px, py = -math.sin(a) * 1.6, math.cos(a) * 1.6
            s.dots([(bx + px + dx * 0.15 * sg, by + py + dy * 0.15 * sg), (bx - px + dx * 0.15 * sg, by - py + dy * 0.15 * sg)], ('ice', 3))
    s.ell('ice', 8, 8, 1.5, 1.5); s.dot(8, 8, WHITE)
    return s

def homing_missiles():
    s = S()
    s.line('copper', [(4, 12), (10, 6)], 3)
    s.poly('red', [(10, 4), (14, 2), (12, 6)]); s.dot(13, 3, ('red', 4))
    s.poly('copper', [(3, 9), (6, 9), (5, 11)]); s.poly('copper', [(7, 13), (7, 10), (5, 12)])
    s.dots([(6, 9), (8, 7), (10, 5)], ('copper', 4)); s.dots([(5, 11), (7, 9)], ('copper', 1))
    s.dots([(2, 14), (1, 15), (3, 13), (0, 13)], ('ember', 3)); s.dot(2, 15, ('smoke', 3) if 'smoke' in R else ('cream', 2))
    return s


WEAPONS = [('Orbital Blades', orbital_blades), ('Chain Lightning', chain_lightning), ('Fire Trail', fire_trail), ('Frost Nova', frost_nova), ('Homing Missiles', homing_missiles)]

# ------------------------------------------------------------------ abilities (one per class, class color)

def shield_bash():
    s = S()
    blob(s, 'blue', [('poly', [(4, 2), (13, 2), (13, 8), (8.5, 14), (4, 8)])])
    s.dots([(8, 3), (8, 4), (8, 5), (8, 6), (8, 7), (8, 8), (8, 9), (9, 3), (9, 9)], ('gold', 3)); s.dots([(5, 5), (7, 5), (10, 5), (12, 5)], ('gold', 2))
    for y in (5, 8, 11): s.dots([(1, y), (2, y)], ('orange', 3))
    return s

def blink():
    s = S()
    s.ell('robe', 8, 8, 6.5, 6.5); s.ell('robe', 8, 8, 4.5, 4.5, flat=True)
    s.poly('orb', [(8, 2), (9.5, 6.5), (14, 8), (9.5, 9.5), (8, 14), (6.5, 9.5), (2, 8), (6.5, 6.5)])
    s.dots([(8, 7), (8, 8), (7, 8)], WHITE)
    return s

def focus_shot():
    s = S()
    s.line('orb', [(1, 8), (14, 8)], 3); s.line('orb', [(1, 8), (14, 8)], 1)
    s.dots([(x, 8) for x in range(2, 14)], WHITE)
    for d in (-1, 1): s.dots([(10, 8 + d * 4), (11, 8 + d * 5), (13, 8 + d * 4)], ('red', 3))
    return s

def shadow_dash():
    s = S()
    s.poly('green', [(14, 8), (9, 3), (9, 6), (2, 6), (2, 10), (9, 10), (9, 13)])
    s.dots([(9, 4), (10, 5), (3, 7), (5, 7)], ('green', 4))
    for x in (0, 1): s.dots([(x, 4), (x, 12)], ('green', 2))
    return s

def ritual_burst():
    s = S()
    s.ell('witch', 8, 8, 6.5, 6.5); s.ell('witch', 8, 8, 5, 5, flat=True)
    s.poly('vial_p', [(8, 3), (13, 12), (3, 12)]); s.poly('witch', [(8, 6), (10.5, 10.5), (5.5, 10.5)], flat=True)
    s.dots([(8, 3), (13, 12), (3, 12)], WHITE)
    return s

ABILITIES = [('Shield Bash', shield_bash), ('Blink', blink), ('Focus Shot', focus_shot), ('Shadow Dash', shadow_dash), ('Ritual Burst', ritual_burst)]


# ------------------------------------------------------------------ base attacks (one per class)

def sword_slash():
    s = S()
    for i in range(10):
        a = math.radians(200 + i * 14)
        s.dot(8 + math.cos(a) * 7, 9 + math.sin(a) * 6, ('gold', 4 if i > 6 else 3))
        s.dot(8 + math.cos(a) * 6, 9 + math.sin(a) * 5, ('gold', 2))
    s.line('steel', [(4, 13), (12, 5)], 2); s.dots([(12, 4), (13, 4)], ('steel', 4))
    s.line('gold', [(3, 9), (7, 13)], 1); s.dot(2, 14, ('leather', 2))
    return s

def magic_bolt():
    s = S()
    for i, (x, y) in enumerate(((2, 14), (3, 13), (4, 12), (5, 12), (6, 11))):
        s.dot(x, y, ('robe', 3 if i % 2 else 2))
    s.ell('orb', 10, 6, 4, 4); s.dots([(9, 4), (8, 5)], WHITE)
    for x, y in ((14, 1), (15, 4), (13, 11)): s.dot(x, y, ('orb', 4))
    return s

def piercing_shot():
    s = S()
    line_dots(s, [(1, 14), (8, 7)], ('orb', 3)); line_dots(s, [(1, 13), (7, 7)], ('orb', 2))
    s.line('wood', [(5, 11), (12, 4)], 1)
    s.poly('steel', [(11, 3), (15, 1), (13, 5)]); s.dot(14, 2, ('steel', 4))
    s.dots([(4, 11), (5, 12), (6, 10)], ('blue', 3))
    return s

def dagger_flurry():
    s = S()
    for i in range(9): s.dot(3 + i * 1.3, 12 - i * 1.2, ('green', 4 if i in (3, 4, 5) else 3))
    for (x0, y0, x1, y1) in ((3, 3, 11, 11), (13, 3, 5, 11)):
        s.line('steel', [(x0, y0), ((x0 + x1) / 2, (y0 + y1) / 2)], 2)
        s.line('gold', [((x0 + x1) / 2 - 1, (y0 + y1) / 2 + 1), ((x0 + x1) / 2 + 1, (y0 + y1) / 2 - 1)] if x0 < x1 else [((x0 + x1) / 2 - 1, (y0 + y1) / 2 - 1), ((x0 + x1) / 2 + 1, (y0 + y1) / 2 + 1)], 1)
        s.line('leather', [((x0 + x1) / 2 + (x1 - x0) * 0.1, (y0 + y1) / 2 + (y1 - y0) * 0.1), (x1, y1)], 2)
    return s

def hex_pulse():
    s = S()
    for r, tone in ((6.5, 3), (4, 4)):
        for i in range(28):
            a = i * math.tau / 28
            if i % 7 == 0 and r > 5: continue
            s.dot(8 + math.cos(a) * r, 8 + math.sin(a) * r, ('vial_p', tone))
    s.ell('witch', 8, 8, 1.6, 1.6); s.dot(8, 8, WHITE)
    for a in (0.4, 2.2, 4.0): s.dot(8 + math.cos(a) * 6.5, 8 + math.sin(a) * 6.5, WHITE)
    return s

ATTACKS = [('Sword Slash', sword_slash), ('Magic Bolt', magic_bolt), ('Piercing Shot', piercing_shot), ('Dagger Flurry', dagger_flurry), ('Hex Pulse', hex_pulse)]

# ------------------------------------------------------------------ potions

def flask(liquid, shape='round'):
    def f():
        s = S()
        s.rect('cream', 6, 1, 9, 2); s.rect('wood', 6, 1, 9, 1)
        if shape == 'round':
            blob(s, 'glass', [('rect', 6, 3, 9, 5), ('ell', 7.5, 10, 5.5, 5)])
            blob(s, liquid, [('ell', 7.5, 11, 4.5, 3.6)])
        elif shape == 'tall':
            blob(s, 'glass', [('rect', 6, 3, 9, 5), ('rect', 4, 5, 11, 14)])
            blob(s, liquid, [('rect', 5, 8, 10, 13)])
        elif shape == 'jar':
            s.rect('wood', 4, 3, 11, 4)
            blob(s, 'glass', [('rect', 3, 5, 12, 14)])
            blob(s, liquid, [('rect', 4, 8, 11, 13)])
        else:
            blob(s, 'glass', [('rect', 6, 3, 9, 5), ('poly', [(6, 5), (9, 5), (13, 14), (2, 14)])])
            blob(s, liquid, [('poly', [(5, 9), (10, 9), (12, 13), (3, 13)])])
        s.dots([(4, 8), (4, 9), (5, 7)], WHITE)
        return s
    return f

POTIONS = [('Heal Flask', flask('heart')), ('Speed Draught', flask('orb', 'tall')), ('Power Tonic', flask('orange', 'cone')), ('Focus Drops', flask('vial_g', 'round'))]

# ------------------------------------------------------------------ materials and currency

def slime_gel():
    s = S(); blob(s, 'sl_meadow', [('ell', 8, 10, 6, 4.5), ('cut', 0, 14, 16, 16)])
    s.dots([(5, 8), (6, 7)], WHITE); s.dots([(10, 11)], ('sl_meadow', 4))
    return s

def bat_wing():
    s = S()
    s.poly('batwing', [(2, 4), (14, 2), (13, 6), (11, 5), (11, 9), (8, 7), (7, 12), (4, 8)])
    line_dots(s, [(2, 4), (14, 2)], ('bat', 1)); line_dots(s, [(2, 4), (11, 8)], ('bat', 1)); s.dot(14, 2, ('horn', 4))
    return s

def bone():
    s = S()
    s.line('bone', [(4, 11), (11, 4)], 2)
    for x, y in ((3, 11), (4, 13), (11, 2), (13, 4)): s.ell('bone', x, y, 1.6, 1.6)
    s.dots([(6, 8), (8, 6)], ('bone', 4))
    return s

def demon_essence():
    s = S()
    blob(s, 'demon', [('ell', 8, 9, 5, 5), ('poly', [(5, 6), (8, 1), (11, 6)])])
    s.dots([(6, 7), (7, 6)], ('demon', 4)); s.dot(8, 9, ('ember', 4))
    return s

def wisp_dust():
    s = S()
    blob(s, 'leather', [('ell', 8, 11, 5, 4), ('rect', 6, 5, 10, 8)]); s.rect('gold', 6, 7, 10, 7)
    for x, y in ((5, 3), (11, 2), (8, 1), (13, 5)): s.dot(x, y, ('wisp', 3));
    s.dots([(7, 10), (9, 11), (8, 12)], ('wisp', 3))
    return s

def spore_dust():
    s = S()
    blob(s, 'mush', [('ell', 8, 7, 6, 4), ('cut', 0, 8, 16, 16)]); s.rect('cream', 7, 8, 9, 13)
    s.dots([(5, 5), (9, 4), (11, 6)], ('cream', 4))
    for x, y in ((2, 11), (13, 10), (4, 14), (12, 14)): s.dot(x, y, ('vial_p', 3))
    return s

def golem_core():
    s = S()
    blob(s, 'stone', [('ell', 8, 8, 6.5, 6.5)])
    s.poly('crystal', [(8, 3), (11, 8), (8, 13), (5, 8)]); s.dots([(7, 6), (7, 7)], WHITE)
    return s

def gold_coin():
    s = S()
    s.ell('gold', 8, 8, 6, 6); s.ell('gold', 8, 8, 4, 4, flat=True)
    s.dots([(8, 5), (8, 6), (8, 7), (8, 8), (8, 9), (8, 10), (7, 6), (9, 9)], ('gold', 4)); s.dots([(4, 5), (5, 4)], WHITE)
    return s

def xp_gem():
    s = S()
    s.poly('teal', [(8, 2), (13, 8), (8, 14), (3, 8)]); s.poly('teal', [(8, 2), (8, 14), (3, 8)], flat=True)
    s.dots([(6, 6), (7, 5)], WHITE)
    return s

def skull():
    s = S()
    blob(s, 'bone', [('ell', 8, 7, 5.5, 5), ('rect', 5, 10, 11, 13)])
    s.dots([(5, 7), (6, 7), (5, 8), (6, 8), (10, 7), (11, 7), (10, 8), (11, 8)], ('bone', 0)); s.dot(8, 10, ('bone', 0))
    s.dots([(6, 13), (8, 13), (10, 13)], ('bone', 1))
    return s

def hourglass():
    s = S()
    s.rect('wood', 3, 1, 12, 2); s.rect('wood', 3, 13, 12, 14)
    blob(s, 'glass', [('poly', [(4, 3), (11, 3), (8, 8), (11, 12), (4, 12), (7, 8)])])
    s.poly('straw', [(5, 4), (10, 4), (8, 7)]); s.poly('straw', [(5, 12), (10, 12), (8, 10)])
    return s

MATERIALS = [('Slime Gel', slime_gel), ('Bat Wings', bat_wing), ('Bone Fragments', bone), ('Demon Essence', demon_essence), ('Wisp Dust', wisp_dust),
             ('Spore Dust', spore_dust), ('Golem Core', golem_core)]
MISC = [('Gold', gold_coin), ('XP Gem', xp_gem), ('Kills', skull), ('Timer', hourglass)]


POTIONS += [('Iron Brew', flask('steel')), ('Cleansing Salve', flask('cream', 'jar')),
            ('Berserker Brew', flask('red', 'tall')), ('Stone Skin Elixir', flask('stone', 'cone')), ('Ghost Oil', flask('wingc', 'round')),
            ('Vampiric Serum', flask('heart', 'cone')), ('Shadow Extract', flask('robe', 'tall')), ('Harvest Moon Tonic', flask('gold', 'jar')),
            ('Frost Elixir', flask('ice', 'tall')), ('Storm Surge', flask('yel', 'cone'))]

# ------------------------------------------------------------------ crops

def herb():
    s = S(); s.line('green', [(8, 15), (8, 5)], 1)
    for (x, y, l) in ((5, 7, -1), (11, 6, 1), (5, 11, -1), (11, 10, 1), (8, 3, 0)):
        s.ell('leaf', x, y, 2.5, 1.8)
    s.dots([(4, 6), (10, 5)], ('leaf', 4)); s.dots([(10, 12), (6, 13)], ('red', 3))
    return s

def pep_root():
    s = S(); s.poly('orange', [(5, 6), (11, 6), (8, 15)]); s.dots([(7, 9), (8, 12)], ('orange', 1)); s.dot(6, 7, ('orange', 4))
    for dx in (-2, 0, 2): s.line('leaf', [(8, 6), (8 + dx * 1.5, 1)], 1)
    return s

def glow_moss():
    s = S(); blob(s, 'teal', [('ell', 8, 11, 6, 4), ('ell', 5, 9, 3, 3), ('ell', 11, 9, 3, 3)])
    s.dots([(5, 8), (9, 7), (12, 10), (7, 11)], ('vial_g', 4)); s.dots([(3, 4), (12, 3), (8, 2)], ('teal', 4))
    return s

def wheat():
    s = S(); s.line('straw', [(8, 15), (8, 3)], 1)
    for y in (3, 6, 9):
        s.ell('straw', 6, y + 1, 1.6, 2); s.ell('straw', 10, y + 1, 1.6, 2)
    s.dots([(8, 1), (5, 3), (11, 3)], ('straw', 4))
    return s

def thorn_seed():
    s = S(); s.ell('leather', 8, 9, 4, 5)
    for x, y in ((8, 2), (3, 6), (13, 6), (3, 12), (13, 12), (8, 15)): s.dot(x, y, ('leather', 3))
    s.dots([(6, 7), (7, 6)], ('leather', 4))
    return s

def fire_pepper():
    s = S(); blob(s, 'red', [('poly', [(4, 5), (10, 4), (12, 7), (9, 13), (5, 15), (6, 11)])])
    s.line('leaf', [(9, 4), (11, 1)], 1); s.dots([(6, 6), (6, 8)], ('red', 4))
    return s

def frost_berry():
    s = S()
    for x, y in ((6, 9), (10, 9), (8, 12), (8, 6)): s.ell('blue', x, y, 2.5, 2.5)
    s.dots([(5, 8), (9, 8), (7, 11), (7, 5)], ('ice', 4)); s.line('leaf', [(8, 4), (10, 1)], 1); s.dots([(2, 3), (13, 4), (12, 14)], WHITE)
    return s

def iron_vine():
    s = S()
    line_dots(s, [(3, 14), (5, 9), (9, 8), (11, 4), (8, 2)], ('steel', 2))
    for x, y in ((5, 11), (9, 7), (11, 3)): s.ell('dsteel', x + 1, y, 2, 1.4)
    s.dots([(4, 11), (8, 6)], ('steel', 4))
    return s

def bloodroot():
    s = S(); blob(s, 'demon', [('poly', [(5, 4), (11, 4), (10, 9), (12, 14), (8, 11), (5, 15), (6, 9)])])
    s.dots([(6, 5), (6, 7)], ('demon', 4)); s.line('leaf', [(8, 4), (7, 1)], 1); s.line('leaf', [(9, 4), (11, 1)], 1)
    return s

def shadow_mushroom():
    s = S(); s.rect('cream', 7, 8, 9, 14); blob(s, 'robe', [('ell', 8, 7, 6.5, 4), ('cut', 0, 8, 16, 16)])
    s.dots([(5, 5), (9, 4), (11, 6)], ('robe', 4)); s.dots([(3, 2), (13, 3)], ('vial_p', 4))
    return s

def thunder_turnip():
    s = S(); s.ell('cream', 8, 10, 5, 5); s.ell('robe', 8, 8, 5, 2.5, flat=True)
    s.dots([(8, 15), (8, 14)], ('cream', 2)); s.poly('yel', [(8, 9), (6, 12), (8, 12), (7, 14), (10, 11), (8, 11)])
    for dx in (-2, 0, 2): s.line('leaf', [(8, 5), (8 + dx, 1)], 1)
    return s

def echo_bloom():
    s = S(); s.line('leaf', [(8, 15), (8, 9)], 1)
    for a in range(5):
        t = a * math.tau / 5 - math.pi / 2
        s.ell('pink', 8 + math.cos(t) * 3.2, 6 + math.sin(t) * 3.2, 2, 2)
    s.ell('yel', 8, 6, 1.4, 1.4); s.dots([(2, 3), (14, 4), (13, 10)], ('pink', 4))
    return s

CROPS = [('Healing Herb', herb), ('Pep Root', pep_root), ('Glow Moss', glow_moss), ('Wheat', wheat), ('Thorn Seed', thorn_seed), ('Fire Pepper', fire_pepper),
         ('Frost Berry', frost_berry), ('Iron Vine', iron_vine), ('Bloodroot', bloodroot), ('Shadow Mushroom', shadow_mushroom), ('Thunder Turnip', thunder_turnip), ('Echo Bloom', echo_bloom)]

# ------------------------------------------------------------------ blessings (sacred teal and gold)

def b_thorns():
    s = S()
    for i in range(36):
        a = i * math.tau / 36
        s.dot(8 + math.cos(a) * 5.5, 8 + math.sin(a) * 5.5, ('leaf', 1 if i % 2 else 2))
        s.dot(8 + math.cos(a) * 4.5, 8 + math.sin(a) * 4.5, ('leaf', 0))
    for i in range(8):
        a = i * math.tau / 8 + 0.2
        s.dot(8 + math.cos(a) * 7, 8 + math.sin(a) * 7, ('bone', 4)); s.dot(8 + math.cos(a) * 6.4, 8 + math.sin(a) * 6.4, ('bone', 2))
    s.ell('red', 8, 8, 2, 2); s.dot(7, 7, WHITE)
    return s

def b_vampirism():
    s = S(); blob(s, 'heart', [('ell', 8, 10, 4.5, 4.5), ('poly', [(4, 9), (8, 2), (12, 9)])]); s.dots([(6, 8), (6, 9)], WHITE)
    s.poly('cream', [(9, 12), (11, 12), (10, 15)])
    return s

def b_guardian():
    s = S(); s.ell('teal', 8, 8, 6.5, 6.5); s.ell('teal', 8, 8, 4.5, 4.5, flat=True)
    s.poly('gold', [(5, 6), (11, 6), (11, 9), (8, 12), (5, 9)]); s.dots([(4, 4), (5, 3)], WHITE)
    return s

def b_resilience():
    s = S(); blob(s, 'stone', [('ell', 5, 6, 3.5, 3.5), ('ell', 10, 6, 3.5, 3.5), ('poly', [(1.5, 7), (14, 7), (8, 14), (7, 14)])])
    line_dots(s, [(8, 5), (7, 8), (9, 10)], ('stone', 0)); s.dots([(4, 4), (3, 5)], ('stone', 4)); s.dot(8, 9, ('gold', 4))
    return s

def b_swift():
    s = S(); s.poly('wingc', [(2, 13), (5, 6), (10, 2), (15, 1), (13, 5), (15, 6), (11, 9), (13, 10), (7, 13)])
    for y in (5, 8, 11): line_dots(s, [(4, y + 2), (12, y - 3)], ('wingc', 1))
    return s

def b_fortune():
    s = S(); s.ell('gold', 8, 8, 6.5, 6.5)
    for dx, dy in ((0, -2), (2, 0), (0, 2), (-2, 0)): s.ell('leaf', 8 + dx, 8 + dy, 1.8, 1.8)
    s.dots([(4, 4), (5, 3)], WHITE)
    return s

def b_wrath():
    s = S(); blob(s, 'ember', [('poly', [(3, 14), (2, 8), (5, 4), (6, 7), (8, 1), (11, 6), (13, 3), (14, 9), (13, 14)])])
    s.ell('cream', 8, 10, 3.5, 2.2); s.dots([(8, 9), (8, 10), (8, 11)], ('red', 1)); s.dot(7, 9, WHITE)
    return s

def b_renewal():
    s = S(); blob(s, 'leaf', [('ell', 8, 8, 6, 4.5), ('poly', [(2, 12), (6, 9), (5, 11)])]); line_dots(s, [(3, 12), (12, 5)], ('leaf', 0))
    for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0), (0, 0)): s.dot(11 + dx, 12 + dy, ('vial_g', 4) if dx or dy else WHITE)
    return s

def b_echo():
    s = S()
    for r, tone in ((6.5, 3), (4, 4)):
        for i in range(20):
            a = math.pi * 0.6 + i * math.pi * 0.8 / 19
            s.dot(9 + math.cos(a) * r, 8 + math.sin(a) * r, ('orb', tone))
    s.poly('orb', [(10, 5), (15, 8), (10, 11)]); s.dot(11, 7, WHITE)
    return s

BLESSINGS = [('Thorns', b_thorns), ('Vampirism', b_vampirism), ('Guardian', b_guardian), ('Resilience', b_resilience), ('Swiftness (blessing)', b_swift),
             ('Fortune (blessing)', b_fortune), ('Wrath', b_wrath), ('Renewal', b_renewal), ('Echo', b_echo)]

# ------------------------------------------------------------------ arena mutators (danger red)

def m_swarm():
    s = S()
    for x, y, r in ((5, 11, 3.5), (11, 11, 3.5), (8, 6, 3.5)):
        blob(s, 'sl_meadow', [('ell', x, y, r, r * 0.8)]); s.dots([(x - 1, y), (x + 1, y)], EYE)
    return s

def m_haste():
    s = S(); s.ell('bone', 10, 8, 4.5, 4.5); s.rect('bone', 8, 11, 12, 13)
    s.dots([(8, 7), (9, 7), (11, 7), (12, 7), (8, 8), (12, 8)], ('bone', 0))
    for y in (5, 8, 11): s.line('red', [(1, y), (4, y)], 1)
    return s

def m_tough():
    s = S(); blob(s, 'red', [('poly', [(2, 2), (13, 2), (13, 8), (7.5, 14), (2, 8)])])
    s.dots([(5, 5), (10, 5), (5, 9), (10, 9), (7, 7), (8, 7)], ('red', 4)); s.dots([(3, 3), (4, 3)], ('red', 4))
    return s

def m_fog():
    s = S(); blob(s, 'stone', [('ell', 5, 9, 4, 3), ('ell', 9, 7, 4.5, 4), ('ell', 12, 10, 3.5, 2.5), ('rect', 4, 9, 13, 12)])
    s.dots([(6, 6), (8, 4)], ('stone', 4))
    return s

def m_no_regen():
    s = vitality(); s.line('dsteel', [(2, 14), (14, 2)], 2); return s

def m_berserk():
    s = S(); blob(s, 'red', [('rect', 4, 5, 12, 12), ('ell', 4, 9, 2, 3)])
    for x in (5, 7, 9, 11): s.dot(x, 5, ('red', 0))
    s.rect('red', 6, 12, 11, 15); s.dots([(5, 6), (5, 8)], ('red', 4))
    for x, y in ((2, 2), (8, 1), (14, 2)): s.dot(x, y, ('ember', 3))
    return s

def m_shielded():
    s = S(); blob(s, 'sl_meadow', [('ell', 8, 10, 3.5, 3)]); s.dots([(7, 10), (9, 10)], EYE)
    for i in range(24):
        a = i * math.tau / 24
        s.dot(8 + math.cos(a) * 6.5, 8.5 + math.sin(a) * 6.5, ('orb', 3 if i % 3 else 4))
    return s

def m_drought():
    s = flask('heart')(); s.line('dsteel', [(2, 14), (14, 2)], 2); return s

def m_gravity():
    s = S()
    for i in range(30):
        t = i / 30; a = t * math.tau * 1.6; r = 1 + t * 6
        s.dot(8 + math.cos(a) * r, 8 + math.sin(a) * r, ('robe', 4 if t > .6 else 3))
    s.ell('black', 8, 8, 1.5, 1.5)
    return s

def m_thorned():
    s = S(); line_dots(s, [(2, 14), (6, 10), (9, 9), (14, 3)], ('leaf', 1))
    for x, y in ((5, 10), (9, 8), (12, 5)): s.dot(x, y - 1, ('bone', 4))
    s.poly('heart', [(4, 3), (6, 7), (2, 7)]); s.ell('heart', 4, 7, 2, 2)
    return s

def m_iron_will():
    s = skull(); s.poly('gold', [(4, 3), (6, 0), (8, 2), (10, 0), (12, 3)]); return s

def m_darkness():
    s = S(); s.ell('obsid' if 'obsid' in R else 'black', 8, 8, 6.5, 6.5); s.ell('black', 10, 7, 5, 5, flat=True)
    s.dots([(3, 9), (4, 11)], ('robe', 4)); return s

def m_mirror():
    s = S(); s.ell('gold', 8, 7, 5.5, 6.5); s.ell('glass', 8, 7, 4, 5)
    line_dots(s, [(6, 4), (10, 9)], WHITE); s.rect('gold', 7, 13, 9, 15)
    return s

def m_frenzy():
    s = hourglass(); s.dots([(13, 1), (14, 2), (13, 3)], ('red', 4)); s.dots([(1, 12), (2, 13)], ('red', 4)); return s

def m_cursed():
    s = S(); s.line('steel', [(3, 13), (8, 8)], 2); s.line('steel', [(9, 6), (12, 3)], 2); s.line('leather', [(1, 15), (3, 13)], 2)
    for x, y in ((10, 9), (12, 11), (5, 4), (13, 7)): s.dot(x, y, ('vial_p', 4))
    s.dots([(8, 7), (9, 7)], ('vial_p', 3))
    return s

MUTATORS = [('Swarm', m_swarm), ('Haste', m_haste), ('Tough Hide', m_tough), ('Fog of War', m_fog), ('No Regen', m_no_regen),
            ('Berserkers', m_berserk), ('Shielded', m_shielded), ('Drought', m_drought), ('Gravity Well', m_gravity), ('Thorned', m_thorned),
            ('Iron Will', m_iron_will), ('Darkness', m_darkness), ('Mirror', m_mirror), ('Frenzy', m_frenzy), ('Cursed', m_cursed)]

# ------------------------------------------------------------------ animals (faces)

def a_chicken():
    s = S(); s.ell('cream', 8, 9, 6, 5.5); s.poly('red', [(6, 3), (7, 1), (8, 3), (9, 1), (10, 3), (10, 5), (6, 5)])
    s.poly('orange', [(7, 9), (9, 9), (8, 11)]); s.dots([(5, 7), (11, 7)], EYE); s.dot(8, 12, ('red', 3)); s.dots([(4, 6), (5, 5)], WHITE)
    return s

def a_cow():
    s = S(); s.poly('cream', [(1, 5), (4, 5), (3, 7)]); s.poly('cream', [(15, 5), (12, 5), (13, 7)])
    s.ell('cream', 8, 8, 5.5, 5.5); s.ell('pink', 8, 12, 4, 2.6)
    s.dots([(5, 5), (6, 5), (5, 6), (10, 9), (11, 9)], ('black', 2)); s.dots([(6, 8), (10, 8)], EYE); s.dots([(7, 12), (9, 12)], ('pink', 0))
    s.dots([(5, 2), (11, 2)], ('horn', 3)); s.dots([(5, 3), (11, 3)], ('horn', 3))
    return s

def a_pig():
    s = S(); s.poly('pink', [(3, 3), (6, 5), (3, 7)]); s.poly('pink', [(13, 3), (10, 5), (13, 7)])
    s.ell('pink', 8, 9, 6, 5.5); s.ell('pink', 8, 11, 3, 2); s.dots([(7, 11), (9, 11)], ('pink', 0)); s.dots([(5, 8), (11, 8)], EYE)
    return s

def a_goat():
    s = S(); s.line('horn', [(5, 5), (3, 2), (1, 3)], 1); s.line('horn', [(11, 5), (13, 2), (15, 3)], 1)
    s.ell('cream', 8, 8, 4.5, 5.5); s.poly('cream', [(3, 7), (5, 6), (5, 8)]); s.poly('cream', [(13, 7), (11, 6), (11, 8)])
    s.poly('cream', [(7, 13), (9, 13), (8, 16)]); s.dots([(6, 7), (10, 7)], ('gold', 3)); s.dots([(7, 11), (9, 11)], ('cream', 0))
    return s

def a_bee():
    s = S(); s.ell('wingc', 5, 4, 3, 2.5); s.ell('wingc', 11, 4, 3, 2.5)
    blob(s, 'yel', [('ell', 8, 10, 5.5, 4)])
    for x in (6, 9): s.rect('black', x, 7, x + 1, 13, flat=True)
    s.dots([(3, 9), (4, 8)], EYE); s.dot(14, 10, ('black', 2))
    return s

def a_dog():
    s = S(); blob(s, 'leather', [('ell', 3, 8, 2.5, 4.5)]); blob(s, 'leather', [('ell', 13, 8, 2.5, 4.5)])
    s.ell('dirt' if 'dirt' in R else 'leather', 8, 8, 5, 5); s.ell('cream', 8, 11, 3, 2.4)
    s.dots([(7, 10), (8, 10), (9, 10)], EYE); s.dots([(6, 7), (10, 7)], EYE); s.dots([(6, 6), (10, 6)], WHITE)
    s.rect('red', 5, 14, 11, 14); s.dot(8, 15, ('gold', 4))
    return s

ANIMALS = [('Chickens', a_chicken), ('Cows', a_cow), ('Pigs', a_pig), ('Goats', a_goat), ('Bees', a_bee), ('Dogs', a_dog)]

# ------------------------------------------------------------------ menu odds and ends

def luck():
    s = S()
    for dx, dy in ((-3, -3), (3, -3), (-3, 3), (3, 3)): s.ell('leaf', 8 + dx, 7 + dy, 3.2, 3.2)
    s.line('leaf', [(8, 10), (11, 15)], 1); s.dots([(4, 3), (3, 4), (10, 3)], ('leaf', 4)); s.dot(8, 7, ('vial_g', 4))
    return s

def lock():
    s = S(); s.line('steel', [(5, 7), (5, 4), (7, 2), (9, 2), (11, 4), (11, 7)], 2)
    blob(s, 'gold', [('rect', 3, 7, 13, 14)]); s.rect('black', 7, 9, 8, 12, flat=True); s.dots([(4, 8), (5, 8)], ('gold', 4))
    return s

def hammer():
    s = S(); s.line('wood', [(3, 14), (9, 7)], 2)
    blob(s, 'steel', [('poly', [(5, 5), (10, 0), (15, 5), (10, 10)])])
    s.poly('dsteel', [(11, 9), (15, 5), (16, 6), (12, 10)]); s.dots([(8, 4), (10, 2)], ('steel', 4))
    return s


# ------------------------------------------------------------------ rare, legendary and void crops (added Nov 2, 2026)
sys.path.insert(0, os.path.join(HERE, '..', 'farmlife'))
import crops as _crops   # noqa: E402  (registers the crop ramps)

def _petals(s, m, cx, cy, n, d, r, rot=0):
    for a in range(n):
        t = a * math.tau / n + rot; s.ell(m, cx + math.cos(t) * d, cy + math.sin(t) * d, r, r)

def i_dragon_fruit():
    s = S(); blob(s, 'dragon', [('ell', 8, 9, 5, 5.5)])
    for x, y, d in ((4, 6, -1), (12, 7, 1), (5, 12, -1), (11, 12, 1), (8, 4, 0)): s.poly('cactus', [(x, y), (x + d * 2 + (1 if d == 0 else 0), y - 2), (x + 1, y + 1)])
    s.dots([(6, 7), (7, 8)], ('dragon', 4)); s.line('cactus', [(8, 4), (8, 1)], 1)
    return s

def i_crystal_bloom():
    s = S(); s.poly('quartz', [(3, 15), (6, 15), (5, 8), (4, 7)]); s.poly('quartz', [(10, 15), (13, 15), (12, 9), (11, 8)])
    _petals(s, 'ice', 8, 6, 6, 2.6, 1.6); s.dot(8, 6, WHITE); s.line('stem', [(8, 9), (8, 15)], 1); s.dots([(2, 3), (14, 3)], WHITE)
    return s

def i_storm_seed():
    s = S(); blob(s, 'stormp', [('ell', 8, 8, 4, 5.5)]); s.line('stem', [(8, 3), (9, 0)], 1)
    s.dots([(6, 6), (6, 7)], ('stormp', 4)); s.dots([(2, 4), (3, 5), (2, 6), (13, 10), (14, 11), (13, 12)], ('yel', 4))
    return s

def i_void_blossom():
    s = S(); s.line('vstem', [(8, 15), (8, 10)], 1); _petals(s, 'vblos', 8, 7, 5, 3.2, 2.2, -math.pi / 2)
    s.ell('neonv', 8, 7, 1.2, 1.2); s.dots([(2, 2), (14, 3), (13, 14)], ('neonv', 3))
    return s

def i_life_tree_sapling():
    s = S(); s.line('sapl', [(8, 15), (8, 8)], 2)
    blob(s, 'leafy', [('ell', 5, 6, 3.4, 2.8), ('ell', 11, 6, 3.4, 2.8), ('ell', 8, 3.5, 3.4, 2.8)])
    s.dots([(5, 5), (8, 3), (11, 6)], ('pink', 4)); s.dot(8, 6, ('heart', 3))
    return s

def i_ironbark_root():
    s = S()
    for x0, x1, y1 in ((6, 1, 14), (7, 4, 15), (9, 12, 15), (10, 15, 13)): s.line('ibark', [(x0, 10), (x1, y1)], 1)
    blob(s, 'ibark', [('ell', 8, 8, 4.6, 4.2)])
    s.dots([(6, 6), (7, 5), (9, 9), (10, 8)], ('ibark', 4)); s.dots([(5, 8), (8, 10)], ('ibark', 1))
    s.line('stem', [(8, 4), (9, 1)], 1); s.dot(10, 1, ('stem', 3)); s.dot(7, 2, ('stem', 3))
    return s

def i_mirror_petal():
    s = S()
    for a in range(6):
        t = a * math.tau / 6; s.poly('mirror', [(8, 8), (8 + math.cos(t - 0.42) * 6.5, 8 + math.sin(t - 0.42) * 6.5), (8 + math.cos(t + 0.42) * 6.5, 8 + math.sin(t + 0.42) * 6.5)])
    s.ell('quartz', 8, 8, 1.4, 1.4); s.dots([(5, 4), (4, 5)], WHITE)
    return s

def i_phoenix_flower():
    s = S()
    for i in range(5):
        t = -math.pi / 2 + (i - 2) * 0.55; s.poly('phoen', [(7, 11), (9, 11), (8 + math.cos(t) * 8, 11 + math.sin(t) * 9)])
    s.ell('yel', 8, 11, 2.2, 1.8); s.line('stem', [(8, 13), (8, 15)], 1); s.dots([(3, 2), (13, 1)], ('phoen', 4))
    return s

def i_world_tree_seedling():
    s = S(); s.line('sapl', [(8, 15), (8, 9)], 2); s.line('sapl', [(4, 15), (8, 13)], 1); s.line('sapl', [(12, 15), (8, 13)], 1)
    blob(s, 'wtree', [('ell', 4.5, 6, 3.4, 3), ('ell', 11.5, 6, 3.4, 3), ('ell', 8, 3.5, 4, 3)])
    s.dots([(5, 5), (10, 3), (12, 6)], ('gold', 4))
    return s

def i_starfruit():
    s = S(); t = _crops.T(s, 8, 8); _crops.star(t, 'starf', 0, 0, 7.4)
    s.dots([(6, 5), (7, 4)], ('starf', 4)); s.line('stem', [(8, 1), (10, -1)], 1)
    return s

def i_soulbloom():
    s = S(); s.line('stem', [(8, 15), (8, 9)], 1)
    blob(s, 'soul', [('poly', [(4, 9), (8, 2), (12, 9), (8, 11)])]); s.dot(8, 6, WHITE); s.dots([(7, 5)], ('soul', 4))
    s.ell('wisp', 3, 3, 1.4, 1.4); s.ell('wisp', 13, 4, 1.2, 1.2)
    return s

def i_void_heart():
    s = S(); blob(s, 'vblos', [('ell', 5.5, 6, 3.4, 3.4), ('ell', 10.5, 6, 3.4, 3.4), ('poly', [(2, 7), (14, 7), (8, 14)])])
    s.dots([(8, 7), (8, 9), (7, 10), (9, 11), (6, 6), (10, 6)], ('neonv', 4)); s.dot(4, 4, ('vblos', 4))
    return s

def i_oblivion_seed():
    s = S(); s.ell('neonv', 8, 8, 6, 6); s.ell('black', 8, 8, 4.4, 4.4); s.dots([(6, 6), (7, 5)], ('neonv', 4))
    return s

def i_eternity_blossom():
    s = S()
    for i in range(8):
        t = i * math.tau / 8; s.poly('cyan', [(8, 8), (8 + math.cos(t - 0.3) * 6.5, 8 + math.sin(t - 0.3) * 6.5), (8 + math.cos(t + 0.15) * 7, 8 + math.sin(t + 0.15) * 7)])
    s.ell('vstem', 8, 8, 2, 2); s.dots([(8, 7), (9, 8)], ('cyan', 4))
    return s

def i_null_root():
    s = S()
    for x0, x1 in ((4, 1), (6, 4), (10, 12), (12, 15)): s.line('nullw', [(x0, 9), (x1, 15)], 1)
    s.ell('nullw', 8, 7, 5.4, 4.6); s.ell('black', 8, 7, 3.2, 2.6); s.dot(5, 4, ('nullw', 4))
    return s

def i_rift_bloom():
    s = S(); _petals(s, 'vblos', 8, 8, 5, 3.6, 2.6, -math.pi / 2)
    s.line('rift', [(7, 1), (9, 5), (7, 9), (9, 14)], 1); s.dots([(8, 5), (8, 9)], ('rift', 4))
    return s

CROPS_HIGH = [('Dragon Fruit', i_dragon_fruit), ('Crystal Bloom', i_crystal_bloom), ('Storm Seed', i_storm_seed), ('Void Blossom', i_void_blossom),
              ('Life Tree Sapling', i_life_tree_sapling), ('Ironbark Root', i_ironbark_root), ('Mirror Petal', i_mirror_petal),
              ('Phoenix Flower', i_phoenix_flower), ('World Tree Seedling', i_world_tree_seedling), ('Starfruit', i_starfruit), ('Soulbloom', i_soulbloom),
              ('Void Heart', i_void_heart), ('Oblivion Seed', i_oblivion_seed), ('Eternity Blossom', i_eternity_blossom), ('Null Root', i_null_root), ('Rift Bloom', i_rift_bloom)]


# ------------------------------------------------------------------ legendary tonics (Alchemy T3, added Nov 2, 2026): gold cap and a sparkle

def tonic(liquid, shape, mark):
    def f():
        s = flask(liquid, shape)()
        s.rect('gold', 5, 0, 10, 2); s.dots([(6, 0), (7, 0)], ('gold', 4)); s.dots([(5, 2), (10, 2)], ('gold', 1))
        for x, y in mark: s.dot(x, y, WHITE)
        s.dots([(13, 2), (14, 3), (13, 4), (12, 3)], ('gold', 4)); s.dots([(1, 6), (2, 7)], ('gold', 3))
        return s
    return f

TONICS = [('Rage Infusion', tonic('red', 'round', [(6, 9), (8, 9), (7, 11), (6, 12), (8, 12)])),
          ('Time Stop Flask', tonic('ice', 'tall', [(7, 7), (7, 8), (7, 9), (8, 9), (9, 9)])),
          ('Invincibility Draught', tonic('gold', 'cone', [(7, 9), (6, 10), (8, 10), (7, 11), (7, 12)])),
          ('Phoenix Draught', tonic('orange', 'round', [(7, 8), (6, 10), (8, 10), (7, 11), (5, 11), (9, 11)])),
          ('Void Elixir', tonic('vial_p', 'tall', [(7, 8), (6, 9), (8, 9), (7, 10), (6, 11), (8, 11), (7, 12)])),
          ('Mega Magnet', tonic('teal', 'jar', [(6, 9), (6, 10), (6, 11), (9, 9), (9, 10), (9, 11), (7, 12), (8, 12)]))]


EXTRA = [('Luck', luck), ('Lock', lock), ('Upgrade', hammer)]

GROUPS = [('cards', CARDS), ('weapons', WEAPONS), ('attacks', ATTACKS), ('abilities', ABILITIES), ('potions', POTIONS), ('materials', MATERIALS), ('misc', MISC),
          ('crops', CROPS), ('blessings', BLESSINGS), ('mutators', MUTATORS), ('animals', ANIMALS), ('extra', EXTRA), ('crops_high', CROPS_HIGH), ('tonics', TONICS)]

def render_all():
    return {g: [(n, fn().render()) for n, fn in items] for g, items in GROUPS}
