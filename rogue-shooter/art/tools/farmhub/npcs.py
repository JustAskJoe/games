import sys
sys.path.insert(0, '.')
from farm import *

FARMER = [
    "....OOOOOO....",
    "...OHHHHHHO...",
    "...OHHHHHHO...",
    "..OrrrrrrrrO..",
    "OOHHHHHHHHHHOO",
    "OHHHHHHHHHHHHO",
    ".OOBBBBBBBBOO.",
    "...OBSSSSBO...",
    "...OSeSSeSO...",
    "...OSSSSSSO...",
    "....OSssSO....",
    ".....OSSO.....",
    "...ORRrRRrO...",
    "..ORDRRrRDRO..",
    "..ORDDDDDDRO..",
    "..OrDDyDyDrO..",
    "..OSDDDDDDSO..",
    "..OSdDDDDdSO..",
    "...OdDDDDdO...",
    "...ODDDODDO...",
    "...ODDdODDO...",
    "...ODDdODDO...",
    "...OKKKOKKKO..",
    "...OKKKOKKKO..",
    "....OOO.OOO...",
]
FARMER_PAL = {'O': 'out', 'H': 'hay', 'h': 'hay1', 'r': 'red0', 'B': '#6b4226', 'S': '#f0c4a8', 's': '#c98a7a', 'e': 'out',
              'R': 'red0', 'D': 'blue', 'd': 'blue1', 'y': 'gold', 'K': '#5a3418'}

WARRIOR = [
    ".......PP.......",
    "......PPPP......",
    ".....OPPPO......",
    "....OMMMMMO.....",
    "...OMmMMMmMO....",
    "...OMMMMMMMO..O.",
    "...OmOSSSOmO.OWO",
    "...OMSeSeSMO.OWO",
    "...OMSSSSSMO.OWO",
    "....OMMMMMO..OWO",
    "..OOCAMMMACOOWO.",
    ".OCOMMAMAMMOCWO.",
    "OBBOMMMMMMMOOWO.",
    "OBYBOMAAAMOOWWO.",
    "OBBBOMMMMMOGGGGO",
    "OBYBOLLLLLOOSG..",
    ".OBBOLLyLLOCO...",
    "..OCOMMMMMOCO...",
    "..OCOMMOMMOCO...",
    "...COMMOMMOC....",
    "....OMMOMMO.....",
    "....OLLOLLO.....",
    "....OLLOLLO.....",
    "...OLLLOLLLO....",
    "...OOOO.OOOO....",
]
WARRIOR_PAL = {'O': 'out', 'P': 'red0', 'M': 'st2', 'm': 'st0', 'S': '#e0a888', 'e': 'out', 'C': 'red1', 'A': 'gold', 'W': 'white',
               'B': 'blue', 'Y': 'gold', 'G': 'gold1', 'L': '#7a4a28', 'y': 'gold'}

def npc(c, grid, pal, x, y, flip=False, k=1):
    pal = {kk: col(v) for kk, v in pal.items()}
    w = len(grid[0])
    c.shadow_e(x + 2 * k, y, (w // 2 + 2) * k, 3 * k)
    c.spr(grid, pal, x - w * k // 2, y - len(grid) * k, flip, k=k)

CAT = ["O...O.....", "OOOOO.....", "OwOwO.....", "OOOOOOOOO.", ".OOOOOOOOO", ".OO.O..OO.", ]
CAT_PAL = {'O': '#e08a3a', 'w': 'out'}

if __name__ == '__main__':
    c = Cv(60, 34, 1); c.r(0, 0, 60, 34, 'd0')
    npc(c, FARMER, FARMER_PAL, 12, 30); npc(c, WARRIOR, WARRIOR_PAL, 38, 30)
    c.img.resize((360, 204), Image.NEAREST).save('npc_preview.png')
