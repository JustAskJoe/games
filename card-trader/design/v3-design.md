# Intergalactic Card Trader · v3 design scope: "The Back Room"

© 2026 justaskjoe. All rights reserved.

**Status:** draft scope for Hunter's approval (Nov 1, 2026). It builds on `v3-ideas.md` (Hunter's decisions) and on merged v2. The art plan is the Lead Artist's addendum, `art/lead-plan-v3.md` (draft), with its shot list in `art/v3-shotlist.md`.

**The question v3 answers:** is *running the shop* fun? That means where stock lives, how you protect it, what you put on display, and who's trying to rip you off, on top of v2's trading.
**Pass bar:** testers rearrange their display case or change their sleeving policy without being told to, and they finish the week.

## 1. In scope

### A. The Back Room, a second screen
A painted room you switch to from the counter (a tab or a hotkey). Everything you own lives somewhere:

| Place | Space | Rules |
|---|---|---|
| **Display case** (glass, lockable) | free-placement grid, 12×4 cells | Customers browse it and buy from it themselves. You set price tags. Unlocked, it attracts Sticky. Handling wear on unprotected cards |
| **Wall rack** | 16 hooks | Packs, collector boxes, playmats. Pack buyers and impulse buys come from here. The Scale Gang works here |
| **Binders** | 54 pockets each; start with 1, more 15₵ each | Raw singles. No wear, no theft, not visible to customers |
| **Bulk bin** | 60 commons | Never sleeved, so it wears. Passive 1₵ sales and Nubb's dig |
| **Back shelves** | 24 slots | Booster boxes, deliveries, gear stock. Upgrade +12 slots for 60₵ |
| **Safe** | 6 slots | Grails and slabs. Can't be stolen, can't be browsed |

**Item sizes, in slots:** raw card 1 · slab 2 · pack 1 hook · collector box 4 · booster box 6 · gear pack 2 · poster tube 3.
**Moving things:** drag between places, or tap a card and choose "send to…". New stock lands in an **inbox tray** until you place it.

### B. Collecting gear and the sleeving policy
- **Penny sleeve** (100 for 4₵): no new surface wear.
- **Hard sleeve** (25 for 6₵, penny sleeve inside): no new edge wear; required for raw cards in the display case.
- **Mag case** (5 for 10₵): full protection, and display buyers pay +10%.
- **The policy you set at close** (Hunter's design): bulk gets nothing; cards worth X₵ or more get a penny sleeve; Y₵ or more get a penny plus a hard sleeve; Z₵ or more get a mag case. New stock follows it automatically while your gear lasts. When gear runs out, cards go unprotected and the DJ warns you.
- **Wear** (gentle): unprotected cards in the bulk bin or display lose 1 condition point at 8% a day; showing a card to a buyer adds 3%. Sleeved cards never wear.

### C. Products and deliveries
- **New products:** collector boxes (a promo, 3 packs and a pin), poster sets, playmats, deck boxes, and gear sold as merch.
- **Ordering:** you order from the **distributor catalog** at close. Orders arrive the next morning as **crates** you unpack (cut, lift, place), and everything lands in the inbox tray.

### D. Five new bad actors (the hobby's bad parts, as our own comic cast)
| Bad actor | Day | Does | Tell / counter |
|---|---|---|---|
| **The Scale Gang** | 2+ | Feel your rack packs and buy only the heavy ones (the hits), leaving dead packs | They linger at the rack. Sell packs from behind the counter, or put up a "no touching" sign |
| **Sticky** (comic shoplifter) | 3+ | Lifts from an unlocked case or an unwatched rack | Case locks; checking the floor between customers; the safe |
| **A Trimmer** | 3+ | Sells cards with shaved edges that look like a 10 | Under the Loupe the edges are *too* perfect and the size is a bit off; graders stamp ALTERED |
| **The Switcher** | 4+ | "Can I see it?", then hands back a fake | Your shop-stamped sleeves; a quick watch-the-hands moment |
| **A Resealer** | 4+ | Sells "sealed" product that was searched and glued shut | Glue shine and creased wrappers under the Loupe |

Day 1 stays the tutorial. The v2 bad actors (scalper, fake ring, pump) stay as they are.

### E. Things that stay
v2's 5-day week, variants and promos, After Hours, the Loupe and its upgrades, the save slots and the front end.

## 2. Out of scope (later)
A shop-floor view where customers walk visibly to the case. Trust per species. A rival stall. Customs and hijacked cargo. Return fraud. A campaign across several weeks. A second hub.

## 3. Numbers (sim targets before any UI)
- **Space:** the squeeze shows around day 3 for a player who buys boxes; booster boxes vs singles is a real choice.
- **Wear:** a careless player (nothing sleeved, everything in bulk or unlocked display) loses **10–15%** of stock value over the week. A careful player loses under 2%.
- **Gear:** sleeving everything worth 20₵ or more costs **2–4%** of the value it protects.
- **Display:** the case makes **30–40%** of single sales by day 5. The browse chance per customer scales with how fair the price tag is against today's value.
- **Theft:** an unlocked case loses about **1 item a day** from day 3; locked, about 0. The rack loses about 1 pack every 2 days unless watched.
- **Bots:**
  - **organized:** policy set, locks on, case curated
  - **lazy:** no sleeves, everything in bulk
  - **greedy:** case packed with grails, no locks

  Pass band: organized beats lazy by 30+ points, and greedy loses about 10% to theft. Tuned in the sim first.

## 4. Build order
1. **Engine:** the storage model, gear and policy, wear, products and deliveries, the display-case sales model, the 5 bad actors. Sim bots, and the balance pass to the targets above.
2. **Back Room UI:** the room screen, drag and drop, the case grid, the inbox tray, the crate unboxing, the policy panel at close.
3. **Art:** from the approved Lead Artist shot list (Gemini via `kit/art/gemini.py`).
4. **Tests:** build-and-test, phone widths, a save and reload, a full week through the UI; then patch notes and a PR.
