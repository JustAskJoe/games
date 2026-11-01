# Intergalactic Card Trader · v3 design scope: "The Back Room" (rev 2)

© 2026 justaskjoe. All rights reserved.

**Status:** rev 2 draft for Hunter's approval (Nov 1, 2026). Rev 1 was approved and built: the PR #65 build has a Back Room side screen, a display case grid, gear, wear, a catalog and 5 bad actors. After the first playtest, Hunter widened the scope so that space and stock become part of selling itself. Rev 2 replaces rev 1. Art stays placeholder ($0) until Hunter says go.

**The question v3 answers:** is running a real card shop fun? That covers deciding what's on the floor today, what you hold back, and what's out at the graders, with a market that has old and new cards and people who are working you.
**Pass bar:** testers rearrange the floor and back stock without being told to, pull at least one card from the back for a customer, report or forgive someone on purpose, and finish the run.

## Hunter's decisions (Nov 1, 2026)
| Topic | Decision |
|---|---|
| Where the back room lives | Inside the day loop: you fetch stock for buyers, browsers bring picks up from the floor, you file buys at close and stock the floor each morning. It's not a side screen you remember to visit |
| Shape grid | Back stock **and** the floor (Probably Stolen style): every fixture is its own grid, and things fit by shape |
| Floor layout | Fixed spots that you upgrade (a bigger case, a second case, more binder stands) |
| Eras | 3: vintage, mid era, modern. Each era adds its own variant tier |
| Unlocks | Bought with cash at close, like the Loupe upgrades |
| Run length | 10 days. The goal is still rank by shop value |
| Fetching | Costs patience by distance. One bad actor sends you to the back just to rob the floor |
| Browsers | Yes: customers browse the case and the binders, then bring picks to the counter |
| Sealed product | 6 types |
| Repacks | You build them, with a bulk sorter unlock |
| Pricing | You set tags, with a market guide |
| Offenders | A Known Offenders board, like the Most Wanted board in Probably Stolen, built only from what **you** find out. The game never flags people for you |
| Security | Catch someone right and you get a bounty and a board entry. Get it wrong and you take a rep hit. Weighed against the person (see section E) |
| Distraction thieves | You read the tell, and the tells vary: sketchy, off, or doing other sketchy things, not just "they don't collect this" |
| Shipping | All at once (one v3) |

## 1. In scope

### A. Three places stock can be
Every card and product is always in one of three states. The HUD shows all three:
- **Available today (the shop floor).** Customers can see it and buy it, and thieves can reach it.
- **Holding (the back).** It's safe and it doesn't sell. You fetch from it.
- **Out.** At the graders, on hold for a customer, or (later) on consignment.

**Morning:** move stock from Holding to Available, re-tag against today's market and unpack the crate. Doors don't open until the crate is unpacked or pushed to the back.
**Counter:** sell from Available. Fetching from Holding costs patience (see C).
**Close:** file the day's buys from the inbox, choose what to grade, order stock and buy unlocks.

### B. Fixtures and the shape grid (Probably Stolen style)
Each fixture is a small grid. Items have shapes, rotate in 90° steps, and must fit.

| Fixture | Where | Start size | Holds | Notes |
|---|---|---|---|---|
| Display case | floor | 6×4 | raw cards (1×1, needs a hard sleeve or mag), slabs (1×2), small sealed (2×2) | Sells best. Browsers pay up to about the tag. Theft target unless locked |
| Counter binder | floor | 2 binders × 9 pockets (a page each) | raw sleeved singles only | Browsers flip it. Good for mid singles; low-end cards make it look cheap and slow sales |
| Top-loader binder | floor (unlock) | 4 pockets per page | top-loaded singles | High-end raw cards. Buyers are a bit less keen than at the case. Hard to steal |
| Wall rack | floor | 4×4 hooks | packs (1×1), blisters (1×2), tins (2×2) | Pack buyers take from here. The Scale Gang works it |
| Bulk bin | floor | count (not a grid) | commons | Takes almost no room. Sells for 1₵ each. Nubb digs it |
| Back shelves | back | 8×4 | booster boxes (2×3), collector boxes (2×2), premium box (3×2), bulk bricks (1×2 = 500 cards), supplies (1×1) | Upgrade +4 columns |
| Back binders | back | 54 pockets each | anything raw | Your holding binders. Fetch: 1 patience |
| Safe | back | 3×2 | slabs, grails | Fetch: 2 patience. Never stolen |
| Inbox tray | back | 20 | new buys | Loose cards wear here |

Bulk doesn't eat real space: it's a count in the bin, or bricks of 500 on a shelf.

### C. Selling with space
- **Fetching:** the case, counter binders and rack are instant. Back binders cost 1 patience. The safe and the shelves cost 2.
- **Browsers:** some customers arrive as browsers. They look at the case and the binders and walk up with a pick at your tag, then haggle down from there. A good tag sells, and a greedy tag gets haggled or put back.
- **Holds:** "Hold it for me till tomorrow?" moves the card to Out for one day. Most come back to buy. Some don't (a no-show).

### D. Cards and products
**Three eras** per game (our own names in the lore; the structure mirrors how the real hobby grew):
| Era | Variant tier it adds | Feel |
|---|---|---|
| Vintage (Wave 1) | First Run stamp, early-print border, famous misprints, plain holo | Scarce and old. Condition is everything. Could be worth a lot or nothing |
| Mid era | Reverse foil (a foil copy of every card), the set's "star" chase card, the first full-arts, secret rares numbered past the set | Steady mid singles, and a few sleepers |
| Modern (Wave 2–3) | Rainbow foil, gold "hyper" cards, alt-art and illustration subsets, a shiny subset | Big chase cards, lots of bulk, and reprints |

Promos and stamps run across every era: dock, event, staff and prerelease stamps, oversized display cards and not-for-play championship decks.

**Six sealed types:** pack (1×1), 3-pack blister (1×2), tin (2×2), collector box (2×2), booster box (2×3), premium box (3×2). Each has its own buyer: kids buy blisters, collectors buy premium boxes, players buy packs and boxes. Old sealed product from earlier eras is rare and pricey, and it's a resealer magnet.

**Bulk:** commons and uncommons by count. Bulk bricks go on the shelves. The bulk sorter unlock lets you build repacks: pick how many cards and whether to seed a hit. Seeded repacks sell faster and build rep. All-dud repacks still sell, but they cost rep once buyers catch on.

### E. People who are working you (and people who aren't)
**Fake sellers aren't all crooks.** When you prove a fake (UV, Loupe or a grader stamp), you **note it**. Then you work out who you're dealing with:
- **Schemer:** knows it's fake. Tells include a story that keeps changing, getting pushy when you lamp it, carrying several "perfect" copies, and showing up again in a disguise. **Report** them to security: you get a bounty and they go on the board.
- **Victim:** a kid, a confused parent, someone who got burned. Tells include surprise, receipts, and a story that holds up. **Inform** them: you gain rep, and sometimes a grateful regular who brings you real cards later. Reporting a victim costs rep, and word gets around.

**Thieves get harsher handling, except a few hard choices:**
- **Shoplifters, the distraction crew, the switcher:** call security when you catch them mid-act for a bounty and a board entry. Call it wrong and you take a rep hit.
- **Hard choices:**
  - A drifter who knows cards are money: call security, let it go, or buy his finds and give him a reason not to steal.
  - A kid who swiped a pack: a light lesson (call the parent, put them to work for an afternoon) beats security. Calling security on a kid costs community rep.

**The distraction thief** asks you to fetch something from the back, then a partner robs the floor. Each one rolls 2–3 tells from a wide pool:
- shifty: keeps checking the door, won't look at the case they claim to want
- off: a bulky coat on a warm dock day, paying with an oddly big bill, a request that doesn't fit their story
- doing other sketchy things: a "friend" who came in with them and drifts to the case, testing the case latch, asking when you close

Honest customers sometimes show one tell too, so you need two before you act.

**The Known Offenders board** (Most Wanted style) shows mugshots, tells, and what each person did. It fills only from your reports. Offenders come back later in the run, sometimes disguised; the board lists their tells as well as their faces. Spot one at the door and you can refuse them.

The rev 1 bad actors stay (Skrimp, Quill, the Hype Bros, the Scale Gang, Sticky, the trimmer, the switcher, the resealer). They feed the board.

### F. Unlocks (cash, at close)
- bulk sorter (repacks)
- top-loader binder
- second display case
- bigger case
- shelf extension
- case lock
- a grading drop-box (send cards out in the morning too)
- a vintage vault (the safe gets bigger)
- a security camera (shows one tell more clearly)

Loupe upgrades stay.

### G. The 10-day run
- **Days 1–5:** the v2 week, rebuilt on the new floor. Day 1 stays the tutorial: one browser, one fetch and one fake to note.
- **Days 6–10:** the vintage market opens (estate binders, an old-sealed auction), the offenders come back, and bigger schemes show up. Day 10 ends with Grade Day.
- **Rank by shop value,** with the bands rescaled for 10 days.

### H. A card economy built from real data (if Zach's database is usable)
We use a real card database only as a **template**: set sizes, rarity mix, pull rates, price spread by rarity and variant, and how prices age by era.
- A generator builds our own sets for Shellstorm, Hive Gambit and Starweave from those statistics.
- Real names, art, set names and logos never enter the game or this public repo. We commit only the aggregate statistics. The raw data stays private.
- Check the price source's terms first.

## 2. Out of scope (later)
- a shop floor where customers walk visibly
- trust per species
- a rival stall
- customs and hijacked cargo
- return fraud
- a campaign across several runs
- a second hub
- consignment (maybe a v3 stretch)

## 3. Numbers (sim targets before any UI)
- **Floor vs back:** a player who only uses the floor runs out of room by day 4. A player who fetches everything from the back loses about 15% of sales to patience.
- **Browsers:** they make 30–40% of single sales by day 10.
- **Wear** (rev 1 rates stay): a careful player loses under 2%.
- **Fakes:** reporting a schemer pays about a fair day's profit. Reporting a victim costs about 8 rep. Informing a victim gains about 4 rep and a 30% chance of a grateful regular.
- **Theft:** an unlocked floor loses about 1 item a day once thieves start. Distraction thieves succeed about 70% of the time when you fetch from the back with 2+ tells showing.
- **Eras:** vintage is about 10% of the cards that come in but about 35% of the value.
- **Repacks:** a seeded repack earns about 20% over selling its bulk loose.
- **Bots:** organized, lazy, greedy, paranoid (reports everyone) and naive (reports no one).
  - organized beats lazy by 30+ points
  - paranoid loses rep
  - naive loses stock

## 4. Build order (one v3)
1. **Engine:**
   - the 3 states and the fixture grids
   - fetching and browsers
   - eras and variant tiers
   - 6 sealed types and repacks
   - offenders, notes, reports and security
   - the 10-day run
   - unlocks
   - sim bots and a balance pass
2. **Card generator** (from the template statistics, if available).
3. **UI:**
   - the floor and back grids with drag and rotate
   - fetch at the counter
   - browser walk-ups
   - the note, inform and report flow
   - the board
   - morning stocking
   - close filing
4. **Tests,** patch notes and a PR. Art stays placeholder until Hunter OKs a shot list.

## 5. Still open
- Is Zach's database available, and where do its prices come from?
- Customer holds: in or out?
- Should repacks have a visible "seeded" sticker (an honest shop) or not (a gamble)?
- How many days of offender history before disguises start?
