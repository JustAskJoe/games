# Card Trader v3.2: the mid-run spine

© 2026 justaskjoe. All rights reserved.

Scoped Nov 2, 2026 with Hunter. Fixes the playtest finding that days 4–7 flatline, and gives vintage a cheaper way in. Builds on v3.1 (`design/v3.1-beta-plan.md` sections 6 and 7, on PR #70).

## The run stays 10 days
With the spine, every day from 4 to 9 has its own hook. Fewer days would squeeze grading turnaround, the contract window and the consignor's return. The beta gate ("median drag day 7 or later") checks it.

| Day | Name | Hook |
| --- | --- | --- |
| 1 | Reef Run | Guided first morning |
| 2 | Hive Swarm | Scale Gang, first sealed money |
| 3 | Star Drift | The stranger's free vintage packs, first thief |
| 4 | The Rumor | **Bijou's contract:** three cards wanted by day 7 |
| 5 | Wave 3 Release Day | Release rush. One contract card turns up at the counter |
| 6 | Estate Season | **Orrin consigns his vintage singles.** At close: **the regional show flyer** |
| 7 | Swarm Return | Bijou comes back: deliver. Crooks return in hats |
| 8 | Collector's Fair | Big buyers |
| 9 | Wave 4 Release Day | **Orrin comes back:** his cut, unsold cards, buyout offer |
| 10 | Last Call | Grade Day |

## 1. Bijou's contract (day 4)
A serious collector (Bijou, Puffi) comes to the counter with a want list. **You choose:** accept or pass. Passing costs nothing.

- **Three specific cards**, chosen when the contract is offered:
  - **Two findable:** worth about 8–40₵ (holo or lower), from the modern sets out now.
  - **One stretch:** worth about 40–200₵, and it must grade **8 or better**: a slab, or a raw card whose true grade is 8+. Bijou checks.
  - Picked by market price, not rarity: in this card universe most uncommons and rares are worth 1–3₵.
- **Pay:** per card, about **1.5× market** at delivery (the stretch card's market is taken at grade 8). Each delivered card adds a little rep and rating. All three earn a **set bonus** (+25₵ and a star bump).
- **Finding them:**
  - Any you already own count.
  - Card 1 is guaranteed: a seller brings it on day 5.
  - Card 2 has a raised chance in sellers' cards and lots on days 5–7 (about 1 in 6 sell or lot visits).
  - The stretch card: a seller brings a copy on day 6, in random condition, so you have to judge whether it's an 8. It can also turn up in lots (about 1 in 12).
- **Delivery:** Bijou returns on day 7. You hand over whichever matching cards you have. Missing cards: no penalty beyond the lost pay. Accepting and delivering nothing costs a little rep.
- **UI:** a contract card in the morning report and at close (three slots, ticked when you own a match), and matching cards get a "Bijou wants this" badge.

## 2. Orrin's consignment (day 6)
Old Orrin (Mollu) heard your shop is legit and brings 5 vintage singles for you to sell, each worth about 25–300₵. **You choose:** take them or pass.

- **The split:** he keeps 80% of each sale, you keep 20%.
- **They're his, not yours:** they don't count toward your shop value, and you can't grade or crack them.
- **They take your space.** They arrive in the inbox. To sell, place them in the case or a front binder like any card, so every slot they use is one your own stock can't.
- **His floor:** he names a minimum per card (about 85% of market). Tags default to market. If you sell under his minimum, you cover the gap from your 20%.
- **You're liable:** if one is stolen or worn while you hold it, you owe him the lost value when he returns.
- **Buyers:** Mollu buyers and browsers like vintage. While his cards are out, vintage-wanting buyers come a bit more often.
- **Day 9, Orrin returns:**
  - He takes his unsold cards.
  - You settle anything you owe.
  - He offers to sell you any unsold card at 90% of market. This is the step into owning vintage singles.
  - Selling 3+ of the 5 earns rep and a rating bump ("trusted with a collection").

## 3. The regional show (day 6 night)
At day 6 close, DJ Vee has a flyer: book a table for **40₵**. Since v3.2.1 nothing is paid up front: the fee comes out of your show sales, and never more than you make there. If you book, tonight's After Hours is the show instead of the usual two flyers.

- **Bring up to 6 items** from your stock: singles, slabs, sealed, including Orrin's consigned cards. Consigned sales still split 80/20.
- **The crowd:** about a quarter of items draw no bid. The rest get 0.9–1.3× market, plus 0.1 for slabs and 0.1 for vintage. (First tuning was 1.1–1.4× with every item bid on: about 50 points of easy growth.)
- **For each bid:** sell, or keep it and take it home.
- **Small risk:** each raw card you bring rolls show wear (as when you show a card at the counter).
- **The crowd checks for fakes:** fakes and trims draw no bid (v3.2.1).
- **No booking:** the usual After Hours night.

## 4. Decisions made for Hunter (change any of these)
- Contract pay per card, not all-or-nothing (Hunter unsure; my pick).
- Two findable cards plus one stretch (Hunter unsure; my pick).
- Only the stretch card has a minimum grade, 8+ (Hunter unsure; my pick).
- Consignment moves from day 5 to day 6, Estate Season, so it lands with the estates and the show.
- Consignor returns on day 9, leaving day 10 to sell anything you bought from him before Grade Day.

## 5. Tests and balance
- **Sim bots:**
  - Careful accepts the contract, delivers what it finds, takes the consignment, places it and books the show.
  - Lazy and sloppy skip all three.
  - Existing bands must still pass.
  - New check: careful's contract pays out at least once in most runs, so the cards really are findable.
- **Browser test:** the test bot accepts the contract and the consignment, books the show and sells one item.
- **Playtests after merge:** agent re-runs on v3.2, then the paid run. Watch the "drag day" median and whether the contract or consignment is "confusing".

## 6. Out of scope for now
- More than one contract per run.
- Consignors for sealed product.
- Booking shows on other days.
