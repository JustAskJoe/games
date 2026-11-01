# Intergalactic Card Trader: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. See the repo's CLAUDE.md for how patch notes work.

---

## v3.0.1 balance · 2026-11-01 · Balance agent for Hunter (with Claude): why repacks never sell
No game change. A write-up of why repacks are dead and a proposed fix for Hunter to approve. Details: the "Repacks" section of `design/balance-report-2026-11-01.md`.

### What's new
- Nothing player-facing.

### Next up
- [ ] @Hunter: answer question 5 in the balance report (value repacks by their sign plus a gamble premium, or make them pay another way).
- [ ] Once approved: change the repack value in `goodValue`, let the sim's careful bot build small repacks early, and add a repack-payoff line to `sim.js` and the band.

### Watch out
- [ ] Buyers value a repack by its hidden contents (`engine.js:1236`), so only hit packs ever sell. Every one of 204 repacks sold in an early-repack scratch run was a hit pack, and repacks earned 83% less than selling the same cards loose. The design says buyers judge repacks by the sign.
- [ ] The sim's careful bot only builds repacks at day 10's close, so the sim never shows a repack on a shelf. Any repack fix needs a bot change to be measured.
- [ ] No honest sign-based value tested beats selling loose: the best was about break-even with a 1.3× gamble premium and a 30₵ sign. Repacks also lowered careful's gain in every variant (196–212% vs 231%). The "+20% over loose" target needs a design call, not a constant.
- [ ] Shelf space caps repacks too: about 160 of the early-repack runs hit "no room for 4 repacks".
- [ ] All of this is from scratch sim copies; nothing was checked in a real playthrough.

---

## v3.0.1 · 2026-11-01 · Hunter (with Claude): continuing a save
### What's new
- **Fix:** continuing a saved run on a freshly opened page showed card names as "undefined" until something rebuilt the card universe. Loading a save now rebuilds it from the run's seed. The agent playtesters found it; the fix was checked by loading a save in a fresh node process and through the full walkthrough.

### Watch out
- [ ] Other findings from the free agent playtests (unreadable star rating, the scalper as best strategy, days 4–7 flatline, ring fakes passing the basic tools) are in `playtests/findings-2026-11-01.md` (PR #70) and the playtest results page, and still need tuning.

---

## v3 rev 2.2 balance · 2026-11-01 · Balance agent for Hunter (with Claude)
The Balance agent's first pass: a report, then tuning at Hunter's request. Full report and every scratch rerun: `design/balance-report-2026-11-01.md`.

### What's new
- **Rent is gentler late in the run:** 30, 40, 50, 55, 60, 65, 70, 80, 85, 90 over the 10 days (it was 30 to 120). Good shops that skip an upgrade or two rarely end on a tab now.
- **An unlocked case gets hit every night** from day 3 (it was 60% of nights). Lock it.
- **Distraction thieves miss sometimes:** if you fetch from the back without watching, their friend gets something about 70% of the time (it was every time).
- **Telling a victim their card is fake** earns +4 rep (it was +3).

  | Bot | Median gain | Tab at end | Notes |
  |---|---|---|---|
  | careful | +231% | 2% | |
  | careful without Loupe upgrades | +210% | 10% | upgrades worth +21 (was +60) |
  | lazy | +128% | 10% | |
  | greedy | +132% | 3% | 13% lost to theft |
  | naive | +140% | 14% | 22% lost to theft |
  | paranoid | +73% | 32% | 2.04★ vs 4.26★ |
  | sloppy | −95% | 95% | careful beats it 98% of the time |

  `build-and-test.py` (full, with the walkthrough): ALL GOOD.

### Next up
- [ ] @Hunter: answer the report's 4 questions (upgrade ceiling band line, schemer bounty size, era target vs economy, OK to add sim bots and lines).
- [ ] Add `floorOnly` and `backOnly` bots plus "floor full on day N", "sales lost to fetch walkouts" and repack-payoff lines to `sim.js`, so those targets get measured (needs Hunter's OK).

### Watch out
- [ ] @Hunter: Loupe upgrades are now worth +21 (no ceiling in the band). Their value is very sensitive to when the Spectrometer is bought: at 140₵ it fell to +37 from +60 before tuning, at 210₵ to +3.
- [ ] Greedy now loses 13% to theft, near the band's 15% ceiling. A future change that makes cases hold more could tip it over.
- [ ] Paranoid still ends on a tab in 32% of runs. That follows from 20 wrong calls a run, which is intended, but check it doesn't feel like a debt spiral.
- [x] (Balance agent, Nov 1: cause found, see the repack section of the report) Repacks are dead in the sim. The sorter is bought in 2% of careful runs, and a forced repack bot sold 0 of 48 repacks. A repack's value counts its bulk at 0.4₵ a card, below loose bulk's 1₵. Cause not confirmed; the "+20% over loose" target can't be measured.
- [ ] Vintage is 23% of incoming cards and 52% of value (target 10% / 35%). Lowering estate vintage weights to 25/45/30 gives 15% / 42% but costs careful 49 points. The target fights the 150% careful floor. Not tuned.
- [ ] The schemer bounty is 18₵ vs a ~70–90₵ day (target: about a day's profit). A 60₵ bounty adds 40–60 points to every honest bot. Not tuned.
- [ ] Not measured: floor-only full by day 4, fetch-everything loses ~15%. Proxies are in the report.
- [ ] Noise: unrelated one-line changes move medians about ±10 points and tabs about ±6 at 200 runs. Don't trust a tuning effect under 10 points.
- [ ] The new rent and theft odds were only checked in the sim, not in a real playthrough.

---

## v3 rev 2.1 · 2026-11-01 · Hunter (with Claude): a new shop, setup before you open, the floor at the counter, the card generator
Fixes from Hunter's playtest: the grid has to feed the day. It's set up before you open and used while you sell.

### What's new
- **A brand-new shop.** You start unrated, with no customers yet. Three questions decide your opening crate:
  - your focus: singles, sealed or vintage hunter
  - how you split your savings: mostly cash, balanced or mostly stock
  - the game you grew up on, whose script you can read from day 1

  Every combination starts at about the same value (530–555₵). Only the mix changes.
- **Set up before you open.** On day 1, OPEN SHOP stays locked until you've unpacked the crate and put 3+ things in the case, 4+ cards in the counter binder and 3+ packs or sealed on the rack. The checklist shows in the morning, on the floor and in DJ Vee's line. On later mornings you open the crate first.
- **The floor at the counter.** When a buyer is at the counter, your case, rack and counter binder show as small grids, and what fits their want lights up: tap it to show it. The **back drawer** holds everything else; each trip back costs patience, and some people send you back there on purpose.
- **The card generator is plugged in** (`kit/cardgen`, PR #67): about 1,300 cards per game across vintage, mid and modern sets, with printings per era. That means first runs, early prints and misprints in vintage; reverse foils, star chases and the first full-arts in the mid era; and alt-art, illustrations, rainbow and gold in modern.
  - Prices, sealed product, vintage drops (1–3 a run) and the modern reprint waves all come from it. Each game now has its own reprinted set and its own never-reprinted set.
  - It prices like the real hobby: most modern singles are near bulk, and the money is in hits and vintage.
- **Unrated start:** reviews pile up each day and the stars settle; early days swing hard.
- **Rebalance on the generator economy:** rent is now 30 to 120 over the 10 days (it was 40 to 170), and an unlocked case gets hit 60% of nights from day 3.

  | Bot | Median gain | Notes |
  |---|---|---|
  | careful | +222% | |
  | careful without Loupe upgrades | +162% | |
  | lazy | +99% | |
  | greedy | +127% | 7% lost to theft |
  | naive | +111% | 26% lost to theft |
  | paranoid | +50% | rating about 2.1★ |

  Careful beats sloppy 97% of the time. Every `build-and-test.py` band passes.
- **Fixes:**
  - The catalog crashed on the old wave names, which also stopped the stock room drawing.
  - A generator price curve could go negative late in the run; it's now clamped in `kit/cardgen` and the tool page was rebuilt.
  - The opening crate list showed "1 × packs" instead of the real count.
  - In the morning, the back view now shows OPEN SHOP.

### Next up
- [ ] @Hunter: playtest the opening and day 1 setup, and sell a few cards from the floor at the counter. Does the grid feel part of selling now?
- [x] The Balance agent's first report on this build (session "Card Trader v3: first Balance agent report"), then any tuning it suggests. (Balance agent, Nov 1: see v3 rev 2.2 balance above.)
- [ ] PR #68 (Balance agent) needs a second teammate to approve it.

### Watch out
- [ ] On the counter floor, case cards are drawn very small (about 32 px). They're readable as lit or dim, not as card names. Check on a real screen.
- [ ] Modern singles are mostly worth 1–3₵ now, so case tags look tiny early on. That's realistic, but check it doesn't feel pointless to stock the case on day 1.
- [ ] The opening crate can't hold vintage sealed: a vintage pack is worth about 1,000₵. Vintage hunters get vintage singles instead.
- [ ] Opening the generator for each run takes about 80 ms. It's fine in the browser; the 1,400-run sim is about a minute slower.

---

## v3 rev 2 · 2026-11-01 · Hunter (with Claude): "the Back Room", part of the selling day
After the first playtest, Hunter widened v3 (`design/v3-design.md`, rev 2). Your stock is now part of how you sell. Art is still placeholder, drawn in code ($0). It replaces the rev 1 build below.

### What's new
- **A 10-day run.**
  - Days 1–5 are the v2 week. Days 6–10 open the vintage market (estate sales), bring offenders back in disguise, and end with Wave 4 Release Day and Grade Day.
  - Rent runs 40 to 170. There are new rank bands.
- **The stock room, with two views** (STOCK ROOM button; F for the floor, B for the back):
  - **The floor** is what customers can see and buy today, and what thieves can reach:
    - the display case (a 6×4 shape grid, lockable)
    - the wall rack (a 4×4 grid)
    - the counter binder (18 pockets)
    - a top-loader binder (an upgrade)
    - the bulk bin
  - **The back** is what you're holding: the back shelves (an 8×4 grid), back binders, the safe and the inbox tray.
  - **Shapes:** raw card 1×1, slab 1×2, blister 1×2, tin and collector box 2×2, booster box 2×3, premium box 3×2. Loose packs fill the free cells. Tap a thing, then tap a spot (R rotates), or drag on desktop.
- **Selling uses the room:**
  - Buyers wait while you fetch from the back: back binders and the inbox cost 1 patience, the safe and shelves cost 2.
  - **Browsers** walk up with something they found on your floor at your tag, and haggle if it's high.
  - **Sealed collectors** buy sealed product to hold.
  - Some collectors ask for "the stuff in the back".
- **Three eras:** vintage (Wave 1), mid era and modern. Modern runs as five waves: 2a, 2b and 2c at the start, Wave 3 on day 5, Wave 4 on day 9.
  - One wave gets a **reprint** (announced; its prices drop).
  - One wave is **never reprinted** (it keeps climbing, and its allocation gets cut). Nobody tells you which one; the hints come from DJ Vee, the distributor and prices.
- **Sealed product:** packs, 3-pack blisters, tins, collector boxes, booster boxes and premium boxes, each its own shape, buyer and price. You can open any of them into loose packs.
- **Vintage sealed:** 1–3 a run from estate sales, at 5–30× a modern box.
  - Weigh vintage packs heavy vs light with the pack scale.
  - Grade sealed product (double fee): it proves it was never opened.
  - With a riser, vintage on display raises your rating every day. Resealed vintage exists.
- **Repacks** (bulk sorter): you post a hit sign ("1 in N has X₵+"), choose the floor of each pack, and decide whether to seed hits honestly. Buyers check your repacks against the sign.
- **Store rating** (a fictional star rating with reviews):
  - Fair tags, a stocked floor, honest repacks, helping victims, events and vintage on display raise it.
  - Fakes, scam repacks, empty cases, walkouts and false accusations lower it.
  - A higher rating brings more browsers and lets buyers accept tags a little over market.
- **Fakes, thieves and the Known Offenders board:**
  - **When you prove a fake,** you read the seller's reaction. Report a schemer to security for a bounty and a board entry. Inform a victim (a kid, a parent) for rep, and sometimes they come back with real cards.
  - **Catch a thief** by watching them, then call security. The hard choices:
    - Tad, a kid: call the parent or call security.
    - Rook, a drifter: buy his bulk finds or call security.
  - **Distraction thieves** (Dash) ask for "the good stuff in the back" while a friend works the floor. Their tells vary and honest people show one too, so act on two.
  - **The board only holds people you caught.** Offenders come back in hats and new coats, but each keeps a signature tell. You can **refuse** anyone at the door; refusing an innocent costs rep.
- **Shop upgrades** (at close, installed on the spot):
  - more binders and counter-binder pages
  - a shelf extension
  - a case lock
  - a top-loader binder
  - a bigger case, then a second case
  - a vintage vault
  - a security camera (shows every tell)
  - a pack scale
  - a display riser
  - the bulk sorter
  - a grading drop-box

  Fixtures count at half their price in shop value.
- **Saves** move to new slots (v3 rev 1 saves are left alone).
- **Balance** (200 runs per bot, 10 days):

  | Bot | Median gain | Notes |
  |---|---|---|
  | careful | +411% | browsers make 40% of single sales |
  | careful without Loupe upgrades | +220% | |
  | lazy | +179% | |
  | greedy | +193% | loses 9% to theft |
  | naive (never watches) | +174% | loses 18% to theft |
  | paranoid (security on any tell) | +46% | rating 1.5★ |
  | sloppy | −175% | careful beats it 100% of the time |

  `build-and-test.py` now also checks that the paranoid bot loses a star and the naive bot loses 10%+ to theft.

### Next up
- [ ] @Hunter: playtest rev 2. Is the floor vs back decision fun? Does fetching feel right? Can you spot the no-reprint wave?
- [ ] Plug in the card generator (session `card-generator`, PR into this branch) for a few thousand cards per game, real-feeling set sizes and printings per era.
- [ ] Hire the Balance agent (`kit/agents/balance.md`). It's planned in ARCHITECTURE.md but not designed yet.
- [ ] Portraits for the new cast (Dash, Rook, Tad, Pip, Moma, Nova, Kiri, Vault, Hoard, the Estate): they show a letter for now.

### Watch out
- [x] The Loupe upgrades are worth about 190 points over 10 days, against about 35 in the 5-day v2. Their value compounds; check that they don't feel mandatory. (Balance agent, Nov 1: +60 after the CardGen rebalance, +21 after the rev 2.2 rent change.)
- [x] Middling bots run a tab in 50–65% of runs: 10 days of rent is tight. Check that a real first run doesn't feel like a debt spiral. (Balance agent, Nov 1: 10–14% at the end of the run after rev 2.2; still worth checking in a real first run.)
- [ ] Loose packs are generic per game (no wave). Only sealed product carries its wave, so the no-reprint play is about sealed boxes, not loose packs.
- [ ] Customers can't see vintage sealed's real value, but the market guide in the deal panel shows it. Decide whether that should need an upgrade.
- [ ] Drag and drop is desktop only. On touch, tap then tap. Not tested on a real phone.
- [ ] Some fixtures are cramped at their largest sizes (bigger case plus second case, shelf extension). Not checked in the UI at full size.
- [ ] The UI test bot plays badly (it ends deep in a tab). It's there to draw every screen, not to score.

---

## v3 · 2026-11-01 · Hunter (with Claude): "the Back Room" (rev 1, replaced by rev 2 above)
Running the shop now matters as much as trading. Scope: `design/v3-design.md`. All v3 art is placeholder, drawn in code ($0). The Lead Artist's approved shot list (`art/v3-shotlist.md`) is on hold.

### What's new
- **The Back Room**, a second screen (BACK ROOM button or B). Everything you own has a place:
  - a display case (12×4 grid, lockable, price tags)
  - a wall rack (16 hooks)
  - binders (54 pockets each)
  - back shelves (24 slots)
  - a safe (6 slots)
  - an inbox tray where new stock lands

  Tap a card, then tap where it goes, or drag it on desktop.
- **The display case sells on its own.** Between customers a browser may buy from it, if the tag is fair against today's value. Raw cards need a hard sleeve or mag case to go in.
- **Gear and a sleeving policy.** Penny sleeves (100 for 4₵), hard sleeves (25 for 6₵) and mag cases (5 for 10₵, display buyers pay +10%). You set the thresholds (penny at X₵+, hard at Y₵+, mag at Z₵+), and new stock is sleeved automatically while gear lasts.
- **Gentle wear.** Unsleeved cards lose a condition point now and then, faster loose in the tray or case than in binder pockets. Showing a card to a buyer adds a little.
- **Distributor catalog and crates.** You order at close: booster boxes, collector boxes (a promo and 3 packs), posters, playmats, deck boxes, gear, binders, a shelf unit and a case lock. Orders arrive as a crate the next morning; cut it open and everything goes where it belongs. Merch on the rack sells to walk-ins overnight.
- **Five new bad actors**, each with a tell and a counter:
  - **The Scale Gang** (day 2 and 5) feels your packs for the hits. Counter: sell from behind the counter, or put up a "no touching" sign.
  - **Sticky** (days 3 and 5) lifts from an unlocked case or the rack. Counter: watch them, lock the case, use the safe.
  - **Snip the trimmer** (day 3) sells "perfect 10s". Counter: the Loupe shows edges that are too perfect and a card 0.4 mm short, and graders stamp them ALTERED.
  - **Flick the switcher** (day 4) swaps your card for a fake. Counter: watch their hands, or show only hard-sleeved, mag-cased or slabbed cards.
  - **Gloss the resealer** (day 4) sells "sealed" packs under retail. Counter: check the seams for glue shine. Resealed and searched packs are dead: their rare slot is a common.
- **Saves** move to new v3 slots. v1 and v2 saves are left alone.
- **Balance** (200 random weeks per bot):
  - careful +195% median, careful without upgrades +173%, sloppy −32%; careful beats sloppy 96%
  - lazy (never sleeves, no case, ignores bad actors) +123%
  - greedy (grails in an unlocked case) +134%, and loses 13% of its final value to theft
  - the case makes 38% of the careful bot's single sales
  - `build-and-test.py` now checks the v3 band too: organized beats lazy by 30+ points, greedy theft 5–15%, case share 25–45%.
- **Fix:** buyers paid full price for fakes after the v3 rework, which made the Spectrometer worthless. Buyers pay nothing for fakes again; only trims fool them.

### Next up
- [ ] @Hunter: playtest the Back Room and confirm the build calls in `design/handoff.md` (binder wear, delayed boxes, Sticky, switcher, trims).
- [ ] @Hunter: say when to spend on v3 art (6 Gemini images, about $0.40, in `art/v3-shotlist.md`). Until then the room, crates and new customers are placeholders.
- [ ] Portraits for Zekk crew, Sticky, Snip, Flick and Gloss (they show a letter for now).
- [ ] Crate unboxing animation (cut, lift, place) is a single button for now.

### Watch out
- [ ] Wear is gentler than the scope's target. A lazy player loses about 3% of stock value to wear, not 10–15%. Organized still beats lazy by 50 points, mostly from theft, dead packs, the switcher and the display case. Raise `WEAR_DAY` and `WEAR_BINDER` in `engine.js` if wear should hurt more.
- [ ] The gear cost target (2–4% of protected value) isn't measured in the sim yet.
- [ ] v3 is about 30 points harder than v2 for the careful bot, because boxes now arrive the next day.
- [ ] Drag and drop is desktop only (HTML5 drag). On phones and touch it's tap a card, then tap a spot. Not tested on a real touch device.
- [ ] The UI test bot plays badly (it sometimes runs a tab). It's there to draw every screen, not to score.
- [ ] Day 4 now has 10 visitors (8 regulars plus 2 new bad actors). Check that it doesn't drag.
- [ ] Rack labels cut off long game names ("SHELLSTO…") at this size.

---

## v2 · 2026-11-01 · Hunter (with Claude): "the market fights back"
A full 5-day week where the market pushes back. The design is in `design/v2-design.md`; the Lead Artist's v2 art plan is in `art/lead-plan-v2.md` (draft) with a shot list in `art/v2-shotlist.md`.

### What's new
- **5 days:** Reef Run, Hive Swarm, Star Drift, The Rumor and Wave 3 Release Day. 39 customer visits. Rent 40/70/90/120/150.
- **Every week is different, and day 1 is still the tutorial.** Day 1 keeps its fixed customers and order. Days 2–5 keep their signature visitors (Skrimp, Quill, the Hype Bros) and draw the rest from a pool, always with at least 2 sellers, 2 buyers and a pack buyer. Demand moves by up to ±0.15, the ships that dock follow the hot games, and after night 1 the two flyers are random (never last night's pick). Everything is seeded, so saves replay the same week.
- **Card variants**, all drawn in code: mirror foil, full-art, alt-art, First Run stamps, vintage and reprint set symbols, serial numbers (#1/50 is worth ×10), misprints that look like damage, and signed cards. Each species has its own tastes: Puffi like full and alt art, Mollu like First Runs and vintage, Zekk like serials and misprints.
- **Promo opportunities:** dock promos from docking ships, box toppers when you restock tomorrow's hottest game, 2 promos from Card Night, 2 from a Tournament, and release promos on day 5.
- **After Hours:** each night you pick 1 of 2 flyers: Card Night, Tournament Night, Dock Auction (bid against Sheelo and Klik), Bulk Dig (16 face-down cards, 6 flips, read the glints), or Swap Meet (three 1-for-1 trades).
- **Bad actors:**
  - Skrimp the scalper (days 3 and 5), countered by a "Limit 2" sign.
  - Quill of the Glyphsmiths, whose ring fakes pass the basic UV lamp.
  - The Hype Bros' pump on day 4: the card is ×1.8 that day, then reprinted and ×0.5 from day 5. The close-up report shows the reprint list.
- **Loupe upgrades** (bought at close):
  - Print Lens: set symbols, misprints, verified serials.
  - Spectrometer: catches ring fakes.
  - Steady Hands: the first tool on each card is free.
- **Customers react** in code: they slide in, shake when insulted, bob when they counter, and get a DEAL or WALKED stamp as they leave.
- **Saves** move to new v2 slots. v1 saves are left alone.
- **Balance pass** (200 random weeks): careful +241% median, careful without upgrades +213%, sloppy −45%. Careful beats sloppy in 96% of runs. Careful ranks now spread from Corner Stall (7%) to Legend of the Lanes (11%).
  - Promos are weaker (×1.4–2.0) and box toppers rarer (35%).
  - Misprints are commoner (6% of old cards) and worth ×3.
  - Buyers pay for a misprint or a vintage print only if you prove it with the **Print Lens**.
  - Ring fakes show up more from day 3.
  - The upgrades cost 50/70/40.

### Next up
- [x] @Hunter: approve the Lead Artist's v2 addendum. All 12 v2 paintings are made: 4 in Canva (the 3 new characters and the Shellstorm full-arts), 8 with Gemini through the new `kit/art/gemini.py` for about $0.72 total. (Hunter with Claude, 2026-11-01)
- [ ] @Hunter @Zach @Joe: play the full week. Pass bar: you finish and want to try a different strategy.
- [ ] Tune with real players: the auction rivals' caps, Bulk Dig gem odds, and Tournament entrant counts.

### Watch out
- [ ] Upgrades are now worth about +28 points in the sim (they were about +23). Watch whether humans buy them, and when.
- [ ] Careful bots still end with a small tab in about 20% of runs, from holding stock instead of cash at the end. It's a liquidity choice, but it may feel harsh. Rank thresholds are 150/500/1000/1800.
- [ ] Bots don't play the pump on purpose (careful bots just avoid buying it), and they never use the translator. Human results will differ.
- [ ] Our variant marks (the RUN 1 sticker, starburst promo crests, set symbols) are original shapes. Have the legal reviewer confirm none echo real card games' marks (Lead Artist risk 2).
- [ ] Gemini images: gemini.py's first try pasted the reference key art into the background (fixed: every prompt now says reference 1 is a style guide only). Two first tries were discarded (fake lettering on a sign; a copy of the key art layout). Release Day's stall has two letter-like graffiti tags, covered by UI. Check Gemini's commercial terms with the legal reviewer.
- [ ] Tested in headless Chromium and the browser pane only.

## v1 · 2026-10-31 · Hunter (with Claude): three playable station days
The first playable build: 3 station days at Stall 7 on Crosslane Market, desktop landscape, in a cel-shaded street-graffiti look. Design in `design/v1-design.md`, decisions in `design/handoff.md`.

### What's new
- **3 days, 7 or 8 customers a day**, all named regulars from 3 species (Mollu, Zekk, Puffi). Each species has its own card game (Shellstorm, Hive Gambit, Starweave) with 18 cards.
- **The Loupe:** check condition (centering, edges, surface), turn on the UV lamp to catch fakes, and decode alien scripts or pay the translator. Each tool costs the waiting customer 1 patience. Decode 3 cards of a game and you can read that game's script for good.
- **Haggling:** an offer slider with patience pips.
  - Mollu love round numbers.
  - Zekk split the difference fast.
  - Puffi crumble when you point out a flaw.
- **Buying and selling:** singles, 9-card binder lots, Nubb's shoebox, the bulk bin, and sealed packs (sell them sealed or rip them yourself).
- **Grading:** QuikSlab (cheap, next day, ±1) or Halo Bureau (dear, 2 days, exact). Day 3 ends with **Grade Day**, when every slab comes home.
- **Trade lanes:** each morning a different mix of ships sets the demand for each game and a hot list. Tomorrow's demand shows at close, so you can restock packs for it.
- **End of day:** a ledger, rent (soft: anything you can't pay goes on a tab), grading and restocking. **Card Night** after day 2: rip packs live on stream for hype.
- **A real game front end:** an opening sequence (spray-tag intro, halftone wipe, logo slam with shake and sparks, light sweep, flying cards, mouse parallax), then a title menu, **3 save slots** (the game saves itself after every move), settings (music, sound effects, reduced motion) and a ☰ pause menu. It's reusable: `kit/snippets/game-front-end/`. The "JustAskJoe presents" tag holds for about 2.6 s before the title (set per game with `hold` in `config.js`).
- **DJ Vee on Lane FM** coaches one hint at a time. The beat is an original synth loop (♪ toggles it).
- **Art:** Canva AI paintings for the key art, the shop, the docking bay, Card Night, the grader office, DJ Vee, all 9 regulars, and card art for all 3 games, each made with the key art as a style reference. Each customer lineup is one painting cut into portraits in code. Card frames, scripts, wear and UV are drawn in code.
- Balance sim (`node sim.js`): the careful bot doubles the shop's value (+105% median), a bot that never inspects gets about +4%, and a sloppy bot loses about 29%.
- Art only, no build change: the Lead Artist's **lead art plan** (`art/lead-plan.md`) and **art direction** (`art/art-direction.md`), both approved by Hunter. They lock the v1 look, the key art as the style anchor, the card sheets as set anchors, the v1 palette, and "stay 2D". The studio art rules gained R21 to R25.

### Next up
- [ ] @Hunter @Zach @Joe: play all 3 days on desktop and say whether inspecting, haggling and Grade Day are fun. Pass bar: you start a second run without being asked.
- [x] Redo the grader office appraiser, who drifted toward a famous franchise look. Now a boxy robot. (Hunter with Claude, 2026-10-31) The list is in `design/ai-assets.md`.
- [ ] Crew deck (about 12 slides) from the brief, using the v1 art and screenshots.
- [ ] Add a playtest feedback form (the kit has one in Tower Defense).
- [ ] v2 ideas are parked in `design/v2-ideas.md`: a 5-day week, scalpers, pump-and-dump, fake rings and more. Decide after the v1 playtest.
- [ ] Before the key art goes on a store page or in a sold build, cover the made-up lettering on its big pink sign (rule R1; `art/art-direction.md` "Cleanup before release").

### Watch out
- [ ] Tested in headless Chromium and Claude's browser pane only (1280×720, plus a 390/320 px check that nothing scrolls sideways). Not checked on a real desktop browser or with real players.
- [ ] Balance is bot-tuned. A perfect 10 grade showed up in only about 1% of careful-bot runs; real players who grade more may see more. Rent (40/60/90) and the pack prices are first guesses.
- [ ] The bots never use the translator, never point out flaws on lots, and never hold packs for Card Night. Human results will differ.
- [ ] Canva's AI throttles bursts (about 8 jobs, then cooldowns of several minutes that grew longer as the session went on). Plan art in small batches, or move character art to Gemini (see the art pipeline doc).
- [ ] Saves live in the browser's localStorage, so they're per browser and per device, and clearing site data wipes them. The Lab serves every game from one origin, so check that slot keys (`ict.v1.*`) don't collide when another game adopts the front end.
- [ ] CI's **Build and test** doesn't run Card Trader yet, like the other games except Tower Defense. Run `python3 card-trader/build-and-test.py` by hand before pushing.
- [ ] Canva's terms limit reselling raw AI images. Check with the legal reviewer before any of this art ships in a sold game.
- [ ] Theme check (from the 0.0 note): the setting is a happy station market with alien card games, trade lanes and grading. None of the names, UI or systems come from the reference game. Keep checking this at review.
- [ ] The lead plan's first-release asset counts and hours are estimates, not measured.

## 0.0 · 2026-10-31 · Hunter (with Claude): new direction
Theme shift before any build: from a Tokyo back-alley card shop to **Intergalactic Card Trader**, "happy space Akihabara". The brief in `pitch/brief.md` is rewritten for it.

### What's new
- Trade lanes decide who docks each day; many species' card games, scripts you have to decode, and competing grading companies.
- Tone rule: warm and funny, never grim or cyberpunk, so it stays clearly apart from the reference game.

### Next up
- [ ] @Zach @Joe: answer the pitch in Forge, or react to the new direction.
- [ ] Crew deck (about 12 slides) from the brief.

### Watch out
- [ ] A shop on a space station shares the reference game's setting; keep checking we're building our own systems and tone.

## 0.0 · 2026-10-31 · Hunter (with Forge)
Project folder created from the approved pitch. Nothing built yet.

### What's new
- The brief is in `pitch/brief.md`.

### Next up
- [ ] Crew deck (about 12 slides) from the brief.
- [x] Add the game to the table in the repo README. (Hunter with Claude, 2026-10-31)

### Watch out
- [ ] The brief is a draft until the crew deck settles the open calls.
