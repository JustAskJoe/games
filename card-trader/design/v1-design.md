# Intergalactic Card Trader · v1 design (3-day prototype)

© 2026 justaskjoe. All rights reserved.

This is a draft by Claude for Hunter to veto. Every name, species and card game here is original. None of it comes from the reference game or any real card game.

**The one question v1 answers:** is inspecting, decoding, haggling over and grading alien cards fun on its own, and do trade lanes make you plan ahead?
**Pass bar:** a tester finishes day 3 and starts a new run without being asked.

---

## The station
**Crosslane Market**, a ring station where three trade lanes cross. You rent **Stall 7** on the main strip: a counter, two glass cases, a bulk bin and a back shelf for sealed boxes.

**DJ Vee** runs **Lane FM**, a pirate radio booth that's bolted to the hull. Vee reads the docking schedule every morning, gossips about the hot list, and is the coach. One hint at a time, always tied to what's in front of you.

## Three species, three card games

| Species | Look | Card game | Script | How they haggle |
|---|---|---|---|---|
| **Mollu** | Snail folk with big pearly shells. Slow and kind | **Shellstorm**: tide spirits and reef beasts, printed on pearl card stock | Spirals | Very patient (8). Concede slowly. **Love round numbers**: a price ending in 0 makes them concede faster. Lowballing them (under 60% of their price) costs 3 patience |
| **Zekk** | Four-armed beetle folk in sneakers. Fast and loud | **Hive Gambit**: mech-insects and hive tactics, honeycomb frames | Dot grids | Impatient (4) but **split the difference fast**. They shrug off a flaw you point out (−5%) |
| **Puffi** | Floating fluffballs with huge eyes. Sentimental | **Starweave**: constellation creatures on nebula backs | Waves | Patience 6. **Condition is everything**: pointing out a flaw drops their price 25%, and as buyers they pay up to +40% for a card at grade 9 or better |

Each game has 18 cards: 8 commons, 4 uncommons, 3 rares, 2 holos and 1 grail.

## Customers (named regulars)
| Name | Species | Usually | Hook |
|---|---|---|---|
| Pearla | Mollu | sells | A grandma clearing out her late husband's binder. Doesn't know what she has |
| Tumbo | Mollu | buys | A teen who wants Shellstorm holos and is bad at hiding excitement |
| Sheelo | Mollu | binder lots | A dealer who knows prices but can't read other species' scripts |
| Klik | Zekk | sells / buys | A flipper. Buys anything under market, sells anything over |
| Vrrz | Zekk | sealed | Buys booster packs by the armful |
| Zazza | Zekk | binder lots | Trench coat, too-good binder. There's always a fake in it |
| Mimbo | Puffi | buys | Only wants mint cards. Cries at good centering |
| Floss | Puffi | sealed / Card Night | A streamer who hosts the Card Night stream |
| Nubb | Puffi | bulk | A kid with a shoebox who digs the bulk bin |

## Mechanics (12)
1. **Buying singles.** A seller puts 1 to 3 cards on the mat and names a price. Inspect, haggle, buy or pass.
2. **Selling.** A buyer says what they want ("a Hive Gambit rare or better"). You pick a card from your stock, name a price and haggle.
3. **The Loupe.** Five tools, and each use costs the waiting customer 1 patience:
   - **Centering** shows the border ratio (for example 58/42).
   - **Edges** zooms the corners.
   - **Surface** tilts the lamp to show scratches.
   - **UV** shows the hidden watermark glyph. A fake has none, or the wrong one.
   - **Decode** reads the script.

   What you find becomes the estimated grade, and haggling leverage.
4. **Haggling.** Drag the slider and hit Offer. They concede by their species' rate and each round costs patience; at 0 they walk. **Point out a flaw** (only after a Loupe tool found one) drops a seller's price once per flaw.
5. **Script decoding.** You can't read a card's name or rarity until you decode it (1 patience) or pay the translator (5₵, no patience). Every 3 decodes in one game raise your **fluency** in it. At fluency 1 you read that game's cards for free. Untranslated cards are where the grails hide.
6. **Fakes.** Fakes look right. UV shows them: no watermark, or the wrong one. Surface also catches "wrong card stock" fakes. A fake is worth 0. Graders reject it and keep the fee. Selling one gets a complaint the next morning: a refund and a rep hit.
7. **Binder lots.** One price for a 9-card page. Flip through and inspect before you decide (the same patience rule applies). Lots are where cheap grails and fakes live.
8. **Sealed packs: crack or sell.** Booster boxes (6 packs) are restocked at close. Pack buyers pay a safe margin, or you rip a pack yourself (5 cards: 3 common, 1 uncommon, 1 rare slot that can hit a holo or a grail).
9. **Bulk bin.** Toss commons into the bin. They sell for 1₵ each: a few every night, plus Nubb's dig.
10. **Grading.** At close, send cards to:
    - **QuikSlab:** 8₵, back the next morning, grade ±1, smaller slab bonus.
    - **Halo Bureau:** 20₵, back in 2 days, exact grade, big slab bonus.

    A graded slab sells for much more than a raw card, but only at a high grade.
11. **Trade lanes and the hot list.** Each morning a different mix of ships docks. That sets who walks in and the **demand** for each game (×0.8 to ×1.5), and two **hot list** cards pay +50%. Sellers price at their home rate; buyers pay today's demand. Buying low from one culture to sell high to another is the money game. Tomorrow's lanes show at close, so you can plan.
12. **End of day, card-hobby style.** Each night has four steps:
    - **Ledger:** sales, buys, fees, bulk bin, rent.
    - **Grading:** send cards.
    - **Restock:** buy sealed boxes.
    - **Market report:** tomorrow's ships, demand and hot list.

    **Card Night** (day 2 only): pick a game to feature and rip up to 6 of your packs live on Floss's stream. Every holo or grail you pull adds hype, which raises tomorrow's demand for that game. The crowd also buys some sealed packs and your rep goes up.

**Rep** (0 to 100, starting at 50) rises with fair deals and Card Night. It falls with walkouts you caused by insulting someone, and with fakes you sold. Buyers pay up to +10% at high rep.

## Stakes (soft)
- You start with 200₵, a small case of singles, 6 sealed packs and some bulk.
- Rent is 60, then 90, then 120. If you're short, the difference goes on a **tab** that comes off your score.
- **Day 3 close is Grade Day:** every pending grade is revealed at once. Then the run summary shows:
  - shop value (cash + stock at market − tab)
  - best flip
  - best grade
  - fakes caught
  - a rank title, from "Corner Stall" to "Legend of the Lanes"

## The three days
- **Day 1 · Reef Run:** Mollu and Puffi ships dock. Shellstorm ×1.0, Starweave ×1.2, Hive Gambit ×0.9. 7 customers, with tutorial beats from Vee: Pearla (inspect and buy), Tumbo (sell), Nubb (bulk), Klik (a fake), Mimbo, Sheelo (binder lot), Floss (sealed).
- **Day 2 · Hive Swarm:** a Zekk fleet docks. Hive Gambit ×1.5. 8 customers, including Zazza's too-good binder. Card Night after close.
- **Day 3 · Star Drift:** a Puffi festival ship docks. Starweave ×1.4, plus Card Night hype. 7 customers, then the Grade Day finale.

Customer cards and conditions roll from a seeded RNG. The schedule of who comes is scripted, so every run teaches the same lessons in the same order.

## Numbers (first pass, tuned by the sim)
- Base value by rarity: common 2, uncommon 6, rare 20, holo 60, grail 260.
- **Condition grade** is a weighted mix of centering, edges and surface, from 1 to 10. Raw price multiplier: 10 → ×1.6, 9 → ×1.3, 8 → ×1.0, 7 → ×0.8, 6 → ×0.6, 5 → ×0.45, below that ×0.3.
- **Slab multiplier:**
  - Halo: 10 → ×3.0, 9 → ×1.9, 8 → ×1.2.
  - QuikSlab: 10 → ×2.2, 9 → ×1.5, 8 → ×1.05.
  - Below 8, a slab adds little over raw.
- **Packs:** a box costs 120₵, and a pack sells sealed for about 28₵. The rare slot hits a holo 15% of the time and a grail 2%.

## Build
- The engine is pure (seeded RNG, no DOM) and every action goes through `act(G, intent)`. `sim.js` runs a careful bot, a sloppy bot and a no-Loupe bot for 3 days.
- **Pass band:** the careful bot ends ahead of the sloppy bot in at least 75% of seeds, and grows shop value by 40% or more.
- **Art:** Canva paintings for the title, shop, docking bay, Card Night, grader office, DJ Vee, 9 customers and 12 card illustrations (4 per game). The full AI list is in `ai-assets.md`.
