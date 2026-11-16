# Wormsbound v3 creature lineup: the "can you tell them apart as shapes?" sheet. Drawn in code, no image model.
# © 2026 justaskjoe. All rights reserved.
#
# Run: python3 lineup.py            writes ../concepts/v3-lineup.png
#
# The creatures themselves are drawn by creatures.py (one function each); this only lays out their idle frame in
# colour and as a plain black shape at game size, with the whole cast as shapes along the bottom.
import pathlib
from PIL import Image, ImageDraw
from creatures import S, GROUND, CAST, LINEUP, ORANGE, frame


def sheet():
    Z, PAD, CW = 5, 18, 5 * S + 36                       # colour sprites at 5x; five to a row
    W, RH = CW * 5 + PAD * 2, 5 * S + 2 * S + 64
    H = PAD + 44 + RH * 2 + 150
    BG, PANEL, TXT, DIM, BLACK = (27, 24, 38), (43, 38, 60), (255, 243, 224), (170, 160, 190), (20, 18, 28)
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.text((PAD, PAD), 'WORMSBOUND v3  creature lineup   class sets the shape; team colour is only the band, scarf or panel', fill=TXT)
    d.text((PAD, PAD + 16), 'Each one is shown in colour, then as a plain black shape at game size. The bottom strip is the whole cast as shapes.', fill=DIM)
    frames = [frame(ch, 'idle1') for ch in LINEUP]
    for i, (ch, f) in enumerate(zip(LINEUP, frames)):
        name, cls, animal = CAST[ch][:3]
        x0, y0 = PAD + (i % 5) * CW, PAD + 44 + (i // 5) * RH
        d.rectangle([x0 + 4, y0, x0 + CW - 6, y0 + RH - 10], fill=PANEL)
        d.rectangle([x0 + 4, y0 + 5 * GROUND + 12, x0 + CW - 6, y0 + 5 * GROUND + 14], fill=(70, 62, 96))        # ground line
        big = f.image(team=ORANGE).resize((S * Z, S * Z), Image.NEAREST); im.paste(big, (x0 + 18, y0 + 8), big)
        d.rectangle([x0 + 18, y0 + 5 * S + 14, x0 + 18 + 2 * S + 8, y0 + 5 * S + 2 * S + 22], fill=(232, 226, 214))
        sil = f.image(flat=BLACK).resize((S * 2, S * 2), Image.NEAREST); im.paste(sil, (x0 + 22, y0 + 5 * S + 18), sil)
        d.text((x0 + 2 * S + 40, y0 + 5 * S + 22), name.upper(), fill=TXT)
        d.text((x0 + 2 * S + 40, y0 + 5 * S + 40), cls, fill=(255, 211, 77))
        d.text((x0 + 2 * S + 40, y0 + 5 * S + 58), animal, fill=DIM)
    y = PAD + 44 + RH * 2 + 6
    d.rectangle([PAD, y, W - PAD, y + 124], fill=(232, 226, 214))
    d.rectangle([PAD, y + 8 + 2 * GROUND + 2, W - PAD, y + 8 + 2 * GROUND + 3], fill=(150, 140, 130))
    step = (W - 2 * PAD - 20) // 10
    for i, f in enumerate(frames):
        sil = f.image(flat=BLACK).resize((S * 2, S * 2), Image.NEAREST); im.paste(sil, (PAD + 10 + i * step + (step - 96) // 2, y + 8), sil)
        nm = CAST[LINEUP[i]][0]; d.text((PAD + 10 + i * step + step // 2 - 3 * len(nm), y + 108), nm, fill=(60, 54, 70))
    out = pathlib.Path(__file__).resolve().parent.parent / 'concepts' / 'v3-lineup.png'
    im.save(out); print('wrote', out.name, im.size)


if __name__ == '__main__':
    sheet()
