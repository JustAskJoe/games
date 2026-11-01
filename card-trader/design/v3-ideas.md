# Intergalactic Card Trader · v3 ideas: "The Back Room" (parked until v2 is merged)

© 2026 justaskjoe. All rights reserved.

Hunter, Nov 1, 2026: rethink inventory so it's tactile and leans into shop management, closer in spirit to the reference game. Cards take up space, plus a display case, bulk binders, slabs, packs and boxes, promo items and collecting gear. **Sequencing:** playtest and merge v2 first, then build v3 on its own branch.

This is our own design. The twist the reference game doesn't have: **space, protection and display all feed card condition and grading.**

## Decisions (Hunter, Nov 1)
- **Space:** both. Simple **slots** for binders, shelves, racks, the safe and the bulk bin; a **free-placement grid** for the display case only, so arranging the case is the tactile part.
- **Wear:** gentle, driven by a **sleeving policy you set**:
  - bulk gets no sleeve
  - cards worth X₵ or more get a penny sleeve
  - cards worth Y₵ or more get a penny sleeve plus a hard sleeve

  New stock follows the policy automatically while you have gear, and gear runs out. Unprotected cards can lose condition over time.
- **View:** the back room is its own painted screen (shelves, binders, case, bin) that you drag items around in. The counter stays the main screen.
- **Numbers have to feel right:** a sim pass on space, gear costs, wear and theft before any UI work (§5).
- **Bad actors cover the hobby's real bad parts,** each as our own comic character (§4).

## 1. Where things live
| Place | Space | What it does |
|---|---|---|
| **Counter mat** | in play | As in v1 and v2 |
| **Display case** (glass, lockable) | free-placement grid, about 12×4 cells | Customers browse it and buy without you showing them anything. You set the price tags. Unlocked cases tempt shoplifters, and display handling causes gentle wear on unprotected cards |
| **Wall rack** | 16 slots | Sealed packs, collector boxes and merch. Impulse buys, and pack buyers take from here. Pack weighers work here (§4) |
| **Binders** | 9 pockets a page, 6 pages each, more binders buyable | Raw singles. Safe from theft and wear, but customers can't see them |
| **Bulk bin** | about 60 loose commons | Cheap passive sales. Cards here are never sleeved, so they wear |
| **Back shelves** | 24 slots, upgradable | Booster boxes, deliveries, gear stock |
| **Safe** | 6 slots | Grails and slabs. Can't be stolen, can't be sold from there |

**Item sizes, in slots:**
- raw card 1 (a pocket, or a 1×1 cell in the case)
- slab 2 (1×2 in the case)
- pack 1 on a rack hook
- collector box 4 (2×2)
- poster set 3 (a tube)
- booster box 6
- a pack of gear 2

## 2. Collecting gear
| Gear | Pack | Protects | Notes |
|---|---|---|---|
| **Penny sleeve** | 100 for about 4₵ | Surface: no new scratches | The base layer |
| **Hard sleeve** (our top-loader) | 25 for about 6₵ | Edges and corners | Needs a penny sleeve inside; required for raw cards in the display case |
| **Mag case** | 5 for about 10₵ | Everything | Display buyers pay +10%; the premium look |
| **Binder** | 1 for 15₵ | Everything while it's in the binder | 54 pockets |
| **Deck boxes, playmats** | merch | — | Something to sell, not to use |

Gear is both a **consumable** (it goes on cards) and **merch** you can sell. The sleeving moment, dragging a card into a sleeve, should feel great.

## 3. Products
Singles (raw), slabs, packs, booster boxes, **collector boxes** (a promo, 3 packs and a pin), **poster sets**, **playmats and deck boxes**, gear by the pack. **Deliveries arrive as crates the next morning**: cut the tape, unpack, and put things where they go.

## 4. Bad actors: the hobby's real bad parts, as our own comic cast
Each one has a tell and a counter. Already in v2: the **scalper**, the **fake ring**, the **pump crew**.

| Real-world problem | Our version (names to come) | What they do | Tell / counter |
|---|---|---|---|
| Pack weighing and searching | **The Scale Gang** | Feel and weigh packs on your rack, buy only the heavy ones (the hits), and leave you dead packs | They linger at the rack. Sell packs from behind the counter, or a "no touching the packs" sign |
| Resealed packs and boxes | **Resealers** | Sell you "sealed" product that was searched and glued shut | Glue shine and wrapper creases under the Loupe |
| Card trimming | **Trimmers** | Shave edges so a card looks sharper, a "10" | Edges *too* perfect and a size slightly off under the Loupe; graders stamp ALTERED and keep the fee |
| Fake slabs | **Slab forgers** | A real-looking grading slab with a fake card inside, or a fake label | UV on the label hologram; the grader's lookup |
| Shoplifting | **Sticky** (comic, never grim) | Lifts from unlocked cases and unwatched racks | Case locks, glancing at the floor, the safe |
| Swap scams | **The Switcher** | "Can I see it?" and hands back a fake | Your shop-stamped sleeves; a quick watch-the-hands moment |
| Return fraud | **Returners** | Buy a card, come back with a worse copy for a refund | Your refund policy; shop stamps |
| Lowball grinders | **"It's for my kid"** | Drain patience with sob stories and 30% offers | Patience economics; walking away is fine |
| Freeloader streamers | **The Influencer** | Wants free product "for exposure" | Rarely worth it, sometimes a real hype boost |
| Shill bidding | **Shill pairs** at Dock Auctions | Two "rivals" bid you up | A pattern you can spot |
| Shady fast graders | **SpeedySlab** | Cheap and fast, "always 10s"; some slabs come back fake or wrong | Reputation; only the real graders hold value |
| Hot goods | **Hijacked cargo** | Product off a robbed hauler, cheap | Customs sweeps; a faction rep hit if you're caught |
| Market floods | **Reprint dumps** | A dealer floods the strip, and prices sag | Read the market report; sell before the dump |

v3 wouldn't ship all of these. **Pick 4 or 5** that use the new inventory: the Scale Gang, Sticky, Trimmers, the Switcher and Resealers. Park the rest for later.

## 5. Numbers to get right (a sim pass before any UI)
- **Space pressure:** you should feel the squeeze around day 3. Booster boxes vs singles should be a real choice.
- **Wear:**
  - an unprotected card in the bulk bin or display loses 1 condition point at about 8% a day
  - handling (showing a card to a buyer) adds about 3%
  - a sleeved card never wears

  Target: a careless player loses about 10–15% of stock value over the week.
- **Gear costs:** sleeving everything worth 20₵ or more should cost about 2–4% of the value it protects. Clearly worth it, never free.
- **Display:**
  - the case should make about 30–40% of single sales by day 5 without stealing the counter's spotlight
  - the browse chance per customer scales with price-tag fairness
- **Theft:** with an unlocked case and nobody watching, about 1 item a day. With locks, about 0.
- **Sim bots:** organized (a policy, locks, case curation), lazy (no sleeves, everything in bulk) and greedy (a packed case, no locks). The pass band gets set once the systems are built.

## 6. Open questions
- Does the display case mean customers browse visually on a shop-floor view, or just a "they bought from your case" ledger line? (Start with the ledger; add the view later.)
- Should gear sales be big enough to matter, or just flavor?
- Do we keep v2's days and events as they are and add the back room on top, or rebalance the whole week?
