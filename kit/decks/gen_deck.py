#!/usr/bin/env python3
"""One Fifty Labs pitch-deck generator (generic kit version of the Trickbound gen.py).

Writes a Slides-artifact project:  <out>/deck.json  +  <out>/slides/<id>.html
Each slide is one 1920x1080 <section> with inline styles and an <aside> of speaker notes.

Usage:
    python3 gen_deck.py                 # builds the example deck into ./project
    python3 gen_deck.py --out other/project --blobs other/blobs.json

To make a new deck: copy this file, edit THEME, delete the example at the bottom
and write your slides with the helpers. Images: upload them as assets to the
artifact first, put {key: asset_id} into blobs.json, and reference them with
blob('key'). Until a key is in blobs.json it renders as /_blob/PENDING_<key>
(render_check.py swaps in local art or a placeholder).
"""
import argparse, json, os, html as _html

# ============================================================== THEME
# Edit this block per game. Everything below reads from it.
THEME = {
    'studio': 'ONE FIFTY LABS',
    'game': 'EXAMPLE GAME',            # footer label
    'title': 'Example Game — Pitch Deck',  # deck.json title
    'notice': '© 2026 F Lane d/b/a One Fifty Labs · All rights reserved',
    'colors': {
        'dark':   '#2A2030',   # dark slide bg
        'deep':   '#1F1824',   # art-slide bg / band color base
        'light':  '#F6EEDF',   # light slide bg
        'panel':  '#3A2E42',   # card bg on dark slides
        'accent': '#E8B86A',   # kicker / highlight on dark (gold)
        'text_d': '#E9DECF',   # body text on dark
        'head_d': '#FBF4E6',   # headings on dark
        'ink':    '#2A2030',   # headings/body on light
        'ink2':   '#5B4D5C',   # secondary text on light
        'muted_d': '#A898A6',  # footer / captions on dark
        'muted_l': '#7A6B78',  # footer / captions on light
        'lcard':  '#FFFAF0',   # card bg on light slides
        'lcard_border': '#E2D3B8',
        'rule2':  '#5C4B62',   # secondary rule color
        'frame':  '#8C6A3E',   # image border on cover
        # named accents for categories / suits / factions (used on light slides)
        'a1': '#B5482F', 'a2': '#2F6E80', 'a3': '#557A45', 'a4': '#3B3F7A',
    },
    'fonts': {
        'head': {'key': 'fraunces', 'family': 'Fraunces', 'stack': "'Fraunces', Georgia, serif",
                 'href': 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap'},
        'body': {'key': 'nunito-sans', 'family': 'Nunito Sans', 'stack': "'Nunito Sans', Arial, sans-serif",
                 'href': 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap'},
    },
    'band_rgba': 'rgba(31,24,36,0.82)',    # readability bands on full-bleed art
    'plate_rgba': 'rgba(31,24,36,0.88)',   # caption plate on full-bleed art
}
C = THEME['colors']
HEAD = f"font-family:{THEME['fonts']['head']['stack']}"
BODY = THEME['fonts']['body']['stack']
MOOD = 'AI mood reference, not final art'

# ============================================================== DECK STATE
ARGS = None
OUT = 'project'
BLOBS = {}
order, sections = [], {}


def setup(argv=None):
    global ARGS, OUT, BLOBS
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='project')
    ap.add_argument('--blobs', default='blobs.json')
    ARGS = ap.parse_args(argv)
    OUT = ARGS.out
    os.makedirs(OUT + '/slides', exist_ok=True)
    BLOBS = json.load(open(ARGS.blobs)) if os.path.exists(ARGS.blobs) else {}


def blob(key):
    """Asset URL for an uploaded image; PENDING_<key> until blobs.json has its id."""
    return '/_blob/' + BLOBS.get(key, 'PENDING_' + key)


def section(desc):
    """Start a new deck section at the NEXT slide written."""
    sections[f's{len(sections) + 1}'] = {'description': desc, 'start': None}


def esc(t):
    return _html.escape(t, quote=True)


# ============================================================== SLIDE SHELL
BANDS = (f'<div style="position:absolute;left:0;top:0;width:1920px;height:104px;background:{THEME["band_rgba"]}"></div>\n'
         f'<div style="position:absolute;left:0;bottom:0;width:1920px;height:128px;background:{THEME["band_rgba"]}"></div>\n')


def slide(sid, body, notes, dark=True, num=True, extra_foot='', pad='128px 128px 160px',
          bg=None, trans='', bands=False, notice=True, gap=40, center=False, foot_bottom=64):
    """Write one slide. Footer (studio · game · NN · extra) sits at bottom:64px;
    the ownership notice is pinned top-right on every slide."""
    order.append(sid)
    for s in sections.values():
        if s['start'] is None:
            s['start'] = sid
    n = len(order)
    bgc = bg or (C['dark'] if dark else C['light'])
    col = C['text_d'] if dark else C['ink']
    mc = C['muted_d'] if dark else C['muted_l']
    foot = ''
    if num:
        label = f"{THEME['studio']} · {THEME['game']} · {n:02d}" + (f' · {extra_foot}' if extra_foot else '')
        foot = (f'<p style="position:absolute;left:128px;bottom:{foot_bottom}px;width:1664px;font-size:24px;color:{mc}">'
                f'{label}</p>\n')
    t = f' data-transition="{trans}"' if trans else ''
    jc = 'justify-content:center;' if center else ''
    ntc = (f'<p style="position:absolute;right:128px;top:44px;width:1100px;text-align:right;font-size:24px;color:{mc}">'
           f'{THEME["notice"]}</p>\n') if notice else ''
    html = (f'<section id="{sid}"{t} style="background:{bgc};color:{col};font-family:{BODY};padding:{pad};'
            f'display:flex;flex-direction:column;{jc}gap:{gap}px">\n'
            + body.strip() + '\n' + (BANDS if bands else '') + foot + ntc
            + f'<aside>{notes}</aside>\n</section>\n')
    with open(f'{OUT}/slides/{sid}.html', 'w') as f:
        f.write(html)


# ============================================================== TEXT HELPERS
def kicker(t, c=None, size=26):
    return f'<p style="font-size:{size}px;color:{c or C["accent"]};letter-spacing:4px;font-weight:800">{t}</p>'


def h1(t, dark=True, size=136, width=None):
    w = f';width:{width}px' if width else ''
    return f'<h1 style="{HEAD};font-size:{size}px;font-weight:600;line-height:1;color:{C["head_d"] if dark else C["ink"]}{w}">{t}</h1>'


def h2(t, dark=True, size=72, width=None):
    w = f';width:{width}px' if width else ''
    return f'<h2 style="{HEAD};font-size:{size}px;font-weight:600;line-height:1.1;color:{C["head_d"] if dark else C["ink"]}{w}">{t}</h2>'


def lead(t, size=34, width=1500, color=None):
    c = f';color:{color}' if color else ''
    return f'<p style="font-size:{size}px;line-height:1.4;width:{width}px{c}">{t}</p>'


def rule_note(t, c=None, size=28):
    """Paragraph with a colored top rule. Use inside row() for 2-up takeaways."""
    return f'<p style="flex:1;font-size:{size}px;line-height:1.4;border-top:3px solid {c or C["accent"]};padding:16px 0 0 0">{t}</p>'


def side_note(t, c=None, size=30):
    """Paragraph with a left rule. Stack these for anatomy / bullet explanations."""
    return f'<p style="font-size:{size}px;line-height:1.4;border-left:4px solid {c or C["accent"]};padding:0 0 0 24px">{t}</p>'


def callout(lead_in, t, on_light=True):
    """Full-width panel with a bold accent lead-in ('Never played?', 'The loop:', 'Next:')."""
    bg = C['dark'] if on_light else C['panel']
    return (f'<div style="background:{bg};border-radius:20px;padding:32px 40px"><p style="font-size:30px;line-height:1.45;color:{C["text_d"]}">'
            f'<b style="color:{C["accent"]}">{lead_in}</b> {t}</p></div>')


# ============================================================== CARDS / ROWS
def card(title, text, tc=None, bg=None, txt=None, flex=1):
    """Card for dark slides. Pass bg=C['accent'], tc=txt=C['dark'] for the one highlighted card."""
    bg = bg or C['panel']
    tc = tc or C['accent']
    txt = txt or (C['text_d'] if bg in (C['panel'], C['dark'], C['deep']) else C['ink2'])
    return (f'<div style="flex:{flex};background:{bg};border-radius:20px;padding:32px;display:flex;flex-direction:column;gap:12px">'
            f'<h3 style="font-size:32px;font-weight:800;color:{tc}">{title}</h3><p style="font-size:28px;line-height:1.4;color:{txt}">{text}</p></div>')


def lcard(title, text, tc=None, flex=1):
    """Bordered cream card for light slides; tc = category accent."""
    return (f'<div style="flex:{flex};background:{C["lcard"]};border:2px solid {C["lcard_border"]};border-radius:20px;padding:32px;display:flex;flex-direction:column;gap:10px">'
            f'<h3 style="font-size:32px;font-weight:800;color:{tc or C["a1"]}">{title}</h3><p style="font-size:28px;line-height:1.4;color:{C["ink2"]}">{text}</p></div>')


def hcard(title, text, flex=1):
    """The single highlighted (accent-filled) card in a row on a light slide."""
    return card(title, text, tc=C['ink'], bg=C['accent'], txt=C['ink'], flex=flex)


def row(*items, gap=24, align='stretch'):
    return f'<div style="display:flex;gap:{gap}px;align-items:{align}">' + ''.join(items) + '</div>'


def col(*items, gap=28, flex=1):
    return f'<div style="flex:{flex};display:flex;flex-direction:column;gap:{gap}px">' + ''.join(items) + '</div>'


def stat(big, label, c=None, dark=False):
    """Big-number stat with a top rule. Put 3 in a row() for a 'why now' slide."""
    c = c or C['a1']
    return (f'<div style="flex:1;display:flex;flex-direction:column;gap:12px;border-top:4px solid {c};padding:28px 0 0 0">'
            f'<p style="{HEAD};font-size:96px;font-weight:700;line-height:1;color:{c}">{big}</p>'
            f'<p style="font-size:30px;line-height:1.4;color:{C["text_d"] if dark else C["ink2"]}">{label}</p></div>')


def compare(left_label, left_text, right_label, right_text):
    """'Today vs us' gap slide body: plain left column, highlighted panel right."""
    return (f'<div style="display:flex;gap:48px">'
            f'<div style="flex:1;display:flex;flex-direction:column;gap:20px"><p style="font-size:30px;color:{C["muted_d"]};font-weight:800;letter-spacing:2px">{left_label}</p>'
            f'<p style="font-size:30px;line-height:1.45">{left_text}</p></div>'
            f'<div style="flex:1;background:{C["panel"]};border-radius:20px;padding:36px;display:flex;flex-direction:column;gap:20px">'
            f'<p style="font-size:30px;color:{C["accent"]};font-weight:800;letter-spacing:2px">{right_label}</p>'
            f'<p style="font-size:30px;line-height:1.45">{right_text}</p></div></div>')


def steps(items, gates=None):
    """Roadmap: list of (title, text); first item highlighted. Optional gate line under each."""
    cells = []
    for i, (t, x) in enumerate(items):
        hi = i == 0
        bg = C['accent'] if hi else C['panel']
        tc = C['dark'] if hi else C['head_d']
        txc = C['dark'] if hi else C['text_d']
        cells.append(f'<div style="flex:1;background:{bg};border-radius:18px;padding:26px;display:flex;flex-direction:column;gap:8px">'
                     f'<h3 style="font-size:28px;font-weight:800;color:{tc}">{t}</h3><p style="font-size:24px;line-height:1.4;color:{txc}">{x}</p></div>')
    out = row(*cells, gap=14)
    if gates:
        out += row(*[f'<p style="flex:1;font-size:24px;line-height:1.4;border-top:3px solid {C["accent"] if i == 0 else C["rule2"]};padding:14px 0 0 0">Gate: {g}</p>'
                     for i, g in enumerate(gates)], gap=14)
    return out


def table(header, rows, highlight_last=True, size=24):
    """Competitor / market table. header and rows are lists of cell strings."""
    h = ''.join(f'<th style="color:{C["accent"] if i == 0 else C["head_d"]};text-align:left">{c}</th>' for i, c in enumerate(header))
    out = [f'<table style="font-size:{size}px;color:{C["ink"]};font-family:{BODY}"><tr style="background:{C["dark"]}">{h}</tr>']
    for i, r in enumerate(rows):
        last = highlight_last and i == len(rows) - 1
        bg = C['dark'] if last else (C['lcard'] if i % 2 == 0 else C['light'])
        tc = f'color:{C["head_d"]}' if last else ''
        out.append(f'<tr style="background:{bg}">' + ''.join(f'<td style="{tc}">{c}</td>' for c in r) + '</tr>')
    return ''.join(out) + '</table>'


# ============================================================== ART HELPERS
def img(key, alt, w, h, radius=20, extra=''):
    return (f'<img src="{blob(key)}" alt="{esc(alt)}" style="width:{w}px;height:{h}px;object-fit:cover;'
            f'border-radius:{radius}px{";" + extra if extra else ""}">')


def art_full(sid, key, alt, label, line, notes, corner='bl', extra_foot=MOOD, plate_w=760):
    """Full-bleed art slide: image covers 1920x1080, dark bands top+bottom keep
    the notice and footer readable, a caption plate holds kicker + one line."""
    pos = {'bl': 'left:96px;bottom:150px', 'br': 'right:96px;bottom:150px',
           'tl': 'left:96px;top:150px', 'tr': 'right:96px;top:150px'}[corner]
    body = (f'<img src="{blob(key)}" alt="{esc(alt)}" style="position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:cover">\n'
            f'<div style="position:absolute;{pos};background:{THEME["plate_rgba"]};border-radius:20px;padding:32px 40px;width:{plate_w}px;display:flex;flex-direction:column;gap:12px">\n'
            f'<p style="font-size:24px;color:{C["accent"]};letter-spacing:4px;font-weight:800">{label}</p>\n'
            f'<p style="{HEAD};font-size:48px;font-weight:600;line-height:1.15;color:{C["head_d"]}">{line}</p>\n</div>')
    slide(sid, body, notes, bg=C['deep'], extra_foot=extra_foot, bands=True)


def art_grid(sid, title, label, tiles, notes, extra_foot=MOOD):
    """2x2 (or 2xN) art grid. tiles = [(key, alt, caption, caption_color), ...]."""
    head = (f'<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:32px">'
            f'{h2(title, size=64)}<p style="font-size:26px;color:{C["accent"]};letter-spacing:4px;font-weight:800;white-space:nowrap">{label}</p></div>')
    cells = [f'<div style="flex:1;display:flex;flex-direction:column;gap:12px">{img(k, a, 820, 300, 16)}'
             f'<p style="font-size:28px;font-weight:800;color:{cc or C["accent"]}">{cap}</p></div>' for k, a, cap, cc in tiles]
    rows_ = [row(*cells[i:i + 2]) for i in range(0, len(cells), 2)]
    slide(sid, head + '\n' + '\n'.join(rows_), notes, bg=C['deep'], pad='88px 128px 140px', extra_foot=extra_foot, gap=24)


def art_strip(sid, title, label, hero, smalls, notes, extra_foot=MOOD):
    """Hero banner (1664x400) over a row of 3 smaller images. hero/smalls = (key, alt)."""
    head = (f'<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:32px">'
            f'{h2(title, size=64)}<p style="font-size:26px;color:{C["accent"]};letter-spacing:4px;font-weight:800;white-space:nowrap">{label}</p></div>')
    body = head + '\n' + img(hero[0], hero[1], 1664, 400) + '\n' + row(*[img(k, a, 538, 303, 16) for k, a in smalls], gap=25)
    slide(sid, body, notes, bg=C['deep'], pad='96px 128px 140px', extra_foot=extra_foot, gap=24, foot_bottom=56)


def art_split(sid, key, alt, label, title, paras, notes, dark=True, img_w=1000, img_h=562, img_right=False, extra_foot=MOOD):
    """Image one side, kicker + heading + paragraphs the other."""
    text = col(kicker(label), h2(title, dark=dark, size=64), *[f'<p style="font-size:30px;line-height:1.45">{p}</p>' for p in paras])
    pic = img(key, alt, img_w, img_h)
    body = row(*(text, pic) if img_right else (pic, text), gap=56, align='center')
    slide(sid, body, notes, dark=dark, extra_foot=extra_foot)


def palette_strip(swatches, h=96):
    """swatches = [(hex, name_or_None)]. Names render under the chips when given."""
    chips = []
    for hexv, name in swatches:
        border = f';border:2px solid {C["lcard_border"]}' if hexv.upper() in (C['light'].upper(), C['lcard'].upper()) else ''
        cap = f'<p style="font-size:24px;font-weight:700">{name}</p><p style="font-size:24px;color:{C["muted_l"]}">{hexv}</p>' if name else ''
        chips.append(f'<div style="flex:1;display:flex;flex-direction:column;gap:8px"><div style="height:{h}px;background:{hexv};border-radius:14px{border}"></div>{cap}</div>')
    return row(*chips, gap=16)


def card_mock(rank, key, alt, ribbon=None, w=440, h=680, obj_pos='50% 50%'):
    """Game card/tile anatomy mock: corner rank, art window, optional ribbon, gilded frame."""
    iw = w - 52
    rib = (f'<div style="background:{C["a4"]};border-radius:12px;padding:10px 16px"><p style="font-size:26px;font-weight:800;color:{C["accent"]}">{ribbon}</p></div>'
           if ribbon else '')
    return (f'<div style="width:{w}px;height:{h}px;background:{C["light"]};border:6px solid {C["accent"]};border-radius:28px;padding:20px;display:flex;flex-direction:column;gap:14px;flex:none">'
            f'<p style="{HEAD};font-size:56px;font-weight:700;color:{C["ink"]};line-height:1">{rank}</p>'
            f'<img src="{blob(key)}" alt="{esc(alt)}" style="width:{iw}px;height:{int(h * 0.62)}px;object-fit:cover;object-position:{obj_pos};border-radius:18px;border:3px solid {C["frame"]}">'
            f'{rib}</div>')


def anatomy_slide(sid, label, title, mock, parts, notes):
    """Card mock left, labelled parts right. parts = [(name, text)]."""
    rows_ = [side_note(f'<b>{n}:</b> {t}', C['accent'] if i < len(parts) - 1 else C['rule2']) for i, (n, t) in enumerate(parts)]
    body = kicker(label) + '\n' + row(mock, col(h2(title, size=64), *rows_, gap=30), gap=72, align='center')
    slide(sid, body, notes, extra_foot='Mock card built from AI mood art')


def cover(sid, title, tagline, sub, key, alt, notes, kick=None, title_size=136):
    """Cover: title block left (max 700px wide, the image starts at x=860), framed
    mood image right with the MOOD caption under it. Two-word titles wrap; drop
    title_size to ~112 if three lines would push the block off the slide."""
    body = (f'<img src="{blob(key)}" alt="{esc(alt)}" style="position:absolute;left:860px;top:188px;width:932px;height:524px;object-fit:cover;border-radius:24px;border:2px solid {C["frame"]}">\n'
            f'<p style="position:absolute;left:860px;top:730px;width:932px;font-size:24px;color:{C["muted_d"]}">{MOOD}</p>\n'
            + kicker(kick or THEME['studio']) + '\n' + h1(title, size=title_size, width=700) + '\n'
            + f'<p style="font-size:40px;line-height:1.35;width:660px">{tagline}</p>\n'
            + f'<p style="font-size:26px;color:{C["muted_d"]};width:660px">{sub}</p>')
    slide(sid, body, notes, num=False, pad='128px', trans='fade', center=True, gap=36)


def closer(sid, label, line, sub, notes, cards=None):
    """Ask / close slide: big line, optional Now/Next/Then cards, no footer number."""
    body = kicker(label) + '\n' + h2(line, size=96, width=1500) + '\n'
    if cards:
        body += row(*[card(t, x) if i < len(cards) - 1 else card(t, x, tc=C['dark'], bg=C['accent'], txt=C['dark'])
                      for i, (t, x) in enumerate(cards)], gap=28) + '\n'
    body += f'<p style="font-size:36px;line-height:1.45;width:1400px">{sub}</p>\n<p style="font-size:30px;color:{C["accent"]};font-weight:800">{THEME["studio"].title()} · F Lane</p>'
    slide(sid, body, notes, num=False, pad='128px', trans='fade', center=True, gap=48)


# ============================================================== DECK.JSON
def write_deck(title=None, created_at='2026-10-16T00:00:00Z'):
    faces = {f['key']: {'family': f['family'], 'href': f['href']} for f in THEME['fonts'].values()}
    deck = {'v': 4, 'createdOnFiles': {'v': 1, 'at': created_at}, 'lists': 'css',
            'title': title or THEME['title'], 'cover': order[0], 'order': order,
            'sections': {k: v for k, v in sections.items() if v['start']}, 'faces': faces}
    with open(OUT + '/deck.json', 'w') as f:
        json.dump(deck, f, ensure_ascii=False)
    print(f'{len(order)} slides -> {OUT}/  ', order)
    pend = sorted({k for k in _pending_keys()})
    if pend:
        print('PENDING images (upload, then add to blobs.json):', ', '.join(pend))


def _pending_keys():
    import re
    for sid in order:
        for m in re.finditer(r'/_blob/PENDING_([\w-]+)', open(f'{OUT}/slides/{sid}.html').read()):
            yield m.group(1)


# ============================================================== EXAMPLE DECK
# A tiny 12-slide deck that exercises every helper. Replace with your own.
if __name__ == '__main__':
    setup()
    A1, A2, A3, A4 = C['a1'], C['a2'], C['a3'], C['a4']

    section('The idea: hook, why now, the gap')
    cover('cover', 'Example Game', 'A cozy card adventure. Pick a partner, collect a deck, play across an island of clubs.',
          'iPad and phone · single-player · working title', 'cover', 'Illustrated card club at night with four friends at a round table',
          'One-line pitch goes here. Working title; note any name search you did.')

    slide('hook', kicker('THE HOOK', A1) + h2('Everybody knows somebody who will not lose at cards.', dark=False, size=96, width=1500)
          + lead('One sentence that turns the hook into the game.', 40, 1400, C['ink2'])
          + callout('Your partner is the story.', 'The emotional core in one line.'),
          'Why this hook matters to the audience.', dark=False)

    slide('whynow', kicker('WHY NOW', A1) + h2('The table game is having a moment.', dark=False)
          + row(stat('4,000%+', 'rise in searches for clubs and lessons', A1), stat('94%', 'year-over-year growth in game nights', A2),
                stat('1.8M', 'players on one online platform last year', A3), gap=40)
          + lead('Players are forming clubs. We put that game inside a loop people already love.'),
          'Sources: put every number\'s source and date here, never on the slide body.', dark=False, extra_foot='Sources in speaker notes')

    slide('gap', kicker('THE GAP') + h2('Today\'s apps are lobbies. Nobody made it an adventure.')
          + compare('TODAY', 'Online tables, coins and ads. No story, nothing to collect.',
                    'EXAMPLE GAME', 'A partner who grows with you, a deck you collect, clubs with house rules.'),
          'Our read of the top apps, not a formal competitive review.')

    section('How it plays')
    slide('rules', kicker('HOW IT PLAYS', A1) + h2('Real rules, four at a table.', dark=False)
          + row(lcard('1 · Deal', 'Everyone gets 13 cards.', A1), lcard('2 · Bid', 'Say how many tricks you will take.', A2),
                lcard('3 · Play', 'Follow suit or trump.', A3), hcard('4 · Score', 'Make your bid for 10 a trick.'))
          + callout('Never played?', 'A helper counts sure tricks and a glowing card shows a good play.'),
          'Exact scoring rules go in the notes.', dark=False)

    slide('pillars', kicker('PILLARS') + h2('Three things every feature must serve.')
          + row(card('Reactive', 'Every turn answers someone.'), card('A promise', 'Bid together, then make it.'),
                card('A partner', 'Someone to read and celebrate with.', C['dark'], C['accent'], C['dark']))
          + row(rule_note('<b>What playtest taught us:</b> one honest lesson.'), rule_note('<b>What we cut:</b> one scope call.', C['rule2'])),
          'Pillars are the filter for scope decisions.')

    section('Art direction (7+ slides in a full deck)')
    slide('art-pillars', kicker('ART DIRECTION', A1) + h2('A vintage deck of cards, come to life.', dark=False)
          + row(lcard('Era / style', 'Gilded frames, whiplash vines.', A1), lcard('Mood', 'Cozy, never spooky.', A4), lcard('Medium', 'Hand-inked 2D, flat jewel tones.', A3))
          + palette_strip([(C['dark'], None), (C['light'], None), (C['accent'], None), (A1, None), (A2, None), (A3, None), (A4, None)])
          + f'<p style="font-size:26px;color:{C["muted_l"]}">Plum · cream · gold · ember · tide · grove · dusk.</p>',
          'Why this look, and why it is cheap to make well.', dark=False, extra_foot='Section: art direction')
    art_full('art-hero', 'hero', 'A hand holding a fan of ornate illustrated cards', 'ART · THE HAND', 'Thirteen little paintings in your hand.',
             'Readability first: rank and suit must read on a phone at arm\'s length.')
    anatomy_slide('art-anatomy', 'ART · CARD ANATOMY', 'Readable first, beautiful second.',
                  card_mock('Q ♠', 'hero', 'Crop of a moth-winged fox', ribbon='Familiar charm'),
                  [('Corner', 'big rank and suit pip, always the same place.'), ('Window', 'the critter painting, swappable.'),
                   ('Ribbon', 'only on special cards.'), ('Frame', 'colored border per family.')],
                  'Cards are built in layers so new art drops into the same frame.')
    art_grid('art-families', 'Four families, four suits.', 'ART · FAMILIES',
             [('f1', 'Family one', '♥ Ember', '#E58A6C'), ('f2', 'Family two', '♦ Tide', '#7FB8C8'),
              ('f3', 'Family three', '♣ Grove', '#9CC48A'), ('f4', 'Family four', '♠ Dusk', '#A9AEE8')],
             'Each family has three growth stages.')

    section('Proof, business, plan and the ask')
    slide('roadmap', kicker('THE PLAN') + h2('Each phase ends at a gate a real player has to pass.')
          + steps([('Jam', '48–72 hours: table and tutorial'), ('Playtest', 'People who love the game'), ('Slice', '6–8 weeks: first town'), ('Launch', 'iPad and phone')],
                  gates=['the hand feels tense', 'a newcomer finishes', 'players ask for more', 'players rate it well']),
          'Each step has a go / no-go gate.', extra_foot='Durations are estimates')
    closer('ask', 'THE ASK', 'Sit down. Your partner\'s waiting.', 'We\'re looking for playtesters and partners.',
           'The ask changes by audience: playtesters, a publisher, or a grant.',
           cards=[('Now', 'Jam the table.'), ('Next', 'Build the slice.'), ('Then', 'Raise with real numbers.')])

    write_deck()
