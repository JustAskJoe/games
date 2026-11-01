# Intergalactic Card Trader · v2 design: "the market fights back"

© 2026 justaskjoe. All rights reserved.

v1 proved the core: inspecting, decoding, haggling and grading are fun (Hunter, Oct 31: "v1 feels very successful"). v2 makes those same skills matter more over a full week, and keeps new systems to a minimum. Drafted by Claude for Hunter to veto. Every name, variant and event here is our own, not taken from the reference game or any real card game.

**The question v2 answers:** over a 5-day week, does reading cards *and* reading the market stay fun when the market pushes back (fakes that beat your tools, scalpers, pumped prices)?
**Pass bar:** testers finish the week and want to try a different strategy.

## 1. A 5-day week
| Day | Name | Ships | What's new that day | Rent |
|---|---|---|---|---|
| 1 | Reef Run | Mollu, Puffi | v1's tutorial day, now with your first **variants** | 40 |
| 2 | Hive Swarm | Zekk | Zekk **dock promos**; the first serial numbers | 60 |
| 3 | Star Drift | Puffi, Mollu | **Skrimp the scalper** shows up; the **Glyphsmiths'** first ring fake | 80 |
| 4 | The Rumor | mixed | The **Hype Bros** pump one card; who docks tomorrow tells you the truth | 100 |
| 5 | Wave 3 Release Day | everyone | A new set drops: release promos, lines at the door, scalpers, ring fakes, then **Grade Day** for the whole week | 130 |

Each day has 8 customers (day 1 has 7). Who comes is still scripted per day; what they bring is rolled per run.

## 2. Card variants
A card is still one of the 18 per game, but every copy also carries a **print**. Most of it is drawn in code, so variety costs almost no new paintings.

| Variant | How common | How you spot it | Value | Who pays extra |
|---|---|---|---|---|
| **Mirror foil**: foil everywhere except the art | ~1 in 6 commons and uncommons from packs | A subtle sheen on the frame; easy to miss | ×2 on commons/uncommons, ×1.4 on others | anyone |
| **Full-art**: the art covers the whole card | rare-slot only, ~4% | Obvious | ×2.5 | **Puffi** +40% |
| **Alt-art**: the same card with a different painting | rare-slot only, ~4% | Obvious if you know the normal art | ×2 | Puffi +40% |
| **First Run** stamp | Wave 2 cards from old binders, ~15% | Stamp, seen with the Loupe | ×1.6 | **Mollu** +40% |
| **Vintage** (Wave 1 set symbol) | old binders | Set symbol: **Print Lens** only | ×1.8 | Mollu +30% |
| **Reprint** (Wave 3 symbol, same card) | Release Day stock | Set symbol: **Print Lens** only | ×0.7 | — |
| **Serialized** #/50 | full-art and alt-art only, ~25% of them | A foil number, seen with the Loupe | ×3; #1–#5 ×6; **#1/50 ×10** | **Zekk** +50% |
| **Misprint**: miscut, ink swap or missing foil | ~3% of old cards | **Looks like damage.** A miscut reads as bad centering. Only the **Print Lens** says "factory error" | ×2.5 once identified | Zekk +30% |
| **Signed** by an alien card artist | rare, in dealer binders | A glyph signature, seen with the Loupe | ×2 | collectors |
| **Promo** | from promo opportunities (§3) | A promo stamp: event crest or ship crest | ×1.5 to ×3 by promo | depends |

Multipliers stack, with a cap of ×30 per card so a serialized full-art grail stays a dream rather than a broken economy.
**Sellers still misread.** They price what they can see: they count a miscut misprint as damage, they don't know vintage from reprint, and a cross-species seller misses everything.

## 3. Promo opportunities
Promos are cards you get by **doing things**, not just by buying.

| Opportunity | How it works |
|---|---|
| **Dock promos** | On the days a species' ships dock, sellers of that species sometimes carry their ship's promo (×1.8). |
| **Box toppers** | Restocking a box of **tomorrow's hottest game** comes with a promo topper half the time. |
| **Card Night promos** | Hosting Card Night gives you 2 Card Night promos (×2) of the featured game. |
| **Tournament prizes** | Hosting Tournament Night gives you 2 tournament promos (×2.5). |
| **Release Day promos** | On day 5, every box sale and every 3rd pack sale earns a release promo (×1.5). Scalpers want them badly. |
| **Floss's giveaway** (day 2, flyer) | Floss asks for a promo to give away on stream. Hand one over for rep +8 and a hype boost to that game. |

## 4. After Hours: the end-of-day event
After the ledger, each night shows **two flyers** and you pick one. Day 5's night is always Grade Day.

| Event | What you do | What you get |
|---|---|---|
| **Card Night** | Feature a game and rip up to 6 packs live (v1's, unchanged) | Hype for that game tomorrow, 2 Card Night promos, pack sales, rep |
| **Tournament Night** | Pick a game and a prize card from your stock. Entrants come based on rep and the game's demand; they pay entry and buy singles of that game from you | Entry fees, single sales at +20%, 2 tournament promos. A better prize draws more entrants and more rep |
| **Dock Auction** | A mystery cargo crate with 3 clues (origin ship, weight, a glyph label). Bid against 2 rival bidders, round by round: raise or drop | The crate: 6–10 cards, usually a fair deal, sometimes a jackpot, sometimes junk |
| **Bulk Dig** | Buy a mystery bulk lot (10₵): 16 face-down cards and 6 flips. Flip and read the backs' hints (foil glint, script color) to find the gems | Whatever you flip; the rest goes to your bulk bin |
| **Swap Meet** | Three regulars each offer a 1-for-1 trade: their card for one of yours | Value reading with no cash: are you getting the better card? |

Flyer pairs: night 1 Bulk Dig or Swap Meet · night 2 Card Night or Dock Auction · night 3 Tournament or Bulk Dig · night 4 Card Night or Dock Auction (release eve).

## 5. Bad actors
| Who | Days | What they do | Your counters |
|---|---|---|---|
| **Skrimp**, scalper (Zekk) | 3 and 5 | Buys all your sealed packs and hot singles at your price, plus 10%, then resells them on the strip | The **"Limit 2"** sign (free, set at close). Selling to him costs rep, and the next day's pack buyers want fewer packs (they already bought from him) |
| **The Glyphsmiths**, a fake ring (a Mollu courier) | 3–5 | Ring fakes have the **right watermark**, so they pass the basic UV lamp. They target promos, serials and full-arts | The **Spectrometer** upgrade catches them, and so does the grader (fee lost). Basic UV misses them |
| **The Hype Bros**, a pump crew (Puffi duo) | 4 | The morning ticker spreads a rumor that card X is about to spike. On day 4, X's price really is ×1.8 and the Bros sell you copies at hype prices. On day 5 it crashes to ×0.5 | Check who docks tomorrow: X's species isn't coming. Sell into the hype on day 4; don't buy |

## 6. Loupe upgrades (buy at close)
| Upgrade | Cost | Does |
|---|---|---|
| **Print Lens** | 60₵ | Shows the set symbol (vintage vs reprint), verifies serials and signatures, and says when "damage" is a factory misprint |
| **Spectrometer** | 90₵ | The UV lamp also catches ring fakes |
| **Steady Hands** | 50₵ | The first tool you use on each card costs no patience |

## 7. Customers react (code, no new art)
Portraits squash and bounce on a deal, shake when insulted, tilt with "?" when suspicious, and slide out when they walk. It's the Tech Artist's code-driven expression stand-in until the Lead Artist's expression sets land.

## 8. Not in v2 (parked for v3)
Trust per species, auctions with shill bidders, a rival stall, customs sweeps, a campaign across several weeks, a second hub.

## 9. Numbers to tune in the sim
- **Bots:** careful (with upgrades), careful without upgrades, and sloppy.
- **Pass band:** careful grows the shop **+150% or more** over the week, upgrades are worth **+25 points or more**, and careful beats sloppy in 90% of seeds.
- Selling into the pump on day 4 should beat holding through the crash in most runs.
