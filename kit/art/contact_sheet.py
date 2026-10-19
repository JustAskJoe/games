"""Make one contact-sheet image from several images so you can review a set in a single look.

Usage: python3 contact_sheet.py OUT.jpg COLS img1.jpg img2.jpg ...
"""
import sys
from PIL import Image

out, cols, paths = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W, H = 1680 // cols, int(1680 // cols * 944 / 1680)
rows = (len(paths) + cols - 1) // cols
sheet = Image.new('RGB', (W * cols, H * rows), 'white')
for i, p in enumerate(paths):
    sheet.paste(Image.open(p).convert('RGB').resize((W, H)), ((i % cols) * W, (i // cols) * H))
sheet.save(out, quality=80)
print(out, sheet.size)
