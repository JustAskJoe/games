# Intergalactic Card Trader · Handoff (current decisions)

© 2026 justaskjoe. All rights reserved.

This is the list of decisions as they stand. Change it when a decision changes. The full v1 design is in `v1-design.md`.

## Decided by Hunter (2026-10-31)
- **First pass:** a playable 3-day prototype (v1), plus a short crew deck built from its art and screenshots.
- **Days:** 3 station days, 6 to 8 customers each.
- **Mechanics in v1:** buying, selling, the Loupe (inspecting), haggling, binder lots, sealed packs (crack or sell), the bulk bin, grading, fakes and script decoding, trade lanes and the hot list, the end-of-day ledger, and one Card Night (day 2).
- **Stakes:** soft, no fail. Rent is still due each night. If you're short, it goes on a tab (debt) and the run carries on. Day 3 ends with a Grade Day reveal and a score.
- **Haggling:** an offer slider plus patience. Each species has its own tell.
- **Content:** 3 species, 3 fictional card games, 18 cards each.
- **Art:** "Jet Set Radio-style" means the *look* only: cel-shaded street-graffiti art, thick outlines, flat bold color, halftone, spray drips. It's never their characters, tags, logos or music. Key paintings come from Canva AI; cards, UI and FX are drawn in code to match.
- **UI:** funky sticker-style UI and squash-and-stretch motion. DJ Vee hosts on Lane FM pirate radio and is the coach. The music is an original breakbeat synth placeholder with a mute toggle.
- **Platform:** desktop landscape first (a 16:9 stage that scales to fit). A phone still loads it without errors.
- **Worldbuilding:** Claude drafts it in `v1-design.md`, and Hunter vetoes in the pull request.
- **Canva:** it uses plan credits, not real money, so generate what the art needs.

## v2 decisions (Hunter, Nov 1, 2026: "build out v2")
- **5-day week**, with card variants and promo opportunities, an **After Hours** event each night (pick 1 of 2 flyers), and **three bad actors**: a scalper, a fake ring and a pump crew.
- **Loupe upgrades** and a "Limit 2" store policy. Customers react through code, not new art.
- **The Lead Artist plans v2's art.** Paintings wait for Hunter's approval of `art/lead-plan-v2.md`.
- Parked for v3: trust per species, a rival stall, customs, a campaign across several weeks, a second hub.

## v3 decisions (Hunter, Nov 1, 2026)
- **v3 scope approved** (`design/v3-design.md`): the Back Room (storage, display case, rack, binders, bulk bin, shelves, safe, inbox), gear and a sleeving policy with gentle wear, products and crate deliveries, and 5 new bad actors (the Scale Gang, Sticky, a Trimmer, the Switcher, a Resealer).
- **Placeholder art first, $0.** The Lead Artist's v3 plan is approved, but its 6 Gemini images wait; v3 ships with code-drawn placeholders.
- **Rev 2 after the first playtest** (`design/v3-design.md`, draft for approval):
  - **Back room and selling:**
    - Space becomes part of selling: stock is Available, Holding or Out.
    - Every fixture is a shape grid, on the floor and in the back. Floor spots are fixed and upgradeable.
    - Fetching costs patience by distance. Browsers bring picks up to the counter.
  - **Cards and products:**
    - 3 eras with their own variant tiers.
    - 6 sealed product types.
    - Repacks you build yourself.
    - Unlocks are bought with cash at close.
  - **The run:** 10 days, ranked by shop value. It ships as one v3.
  - **Bad actors:**
    - A Known Offenders board that you fill yourself.
    - Fake sellers can be schemers (report them) or victims (inform them).
    - Thieves get security, apart from a few hard choices.
    - Distraction thieves have varied tells.
  - **Data:** Zach's card database, if usable, is a stats template only. No real names or art.
- **Build calls made while tuning (Claude; Hunter to confirm or change):**
  - Unsleeved cards in binders wear a little (6% a night), not zero as the scope said. Without that, a player who never sleeves loses almost nothing. Loose cards in the inbox tray or the case wear at 12% a night, and showing a card to a buyer adds 3%.
  - Booster boxes now arrive in the next morning's crate, not straight away. This costs about 30 points of growth against v2, so v3 is a harder week.
  - Sticky takes from the case or the rack (50/50) unless you watch them. An unlocked case also loses an item 25% of nights from day 3.
  - The Switcher only gets raw cards in a penny sleeve or no sleeve. Hard sleeves, mag cases and slabs count as "shop-stamped" and can't be swapped.
  - Trimmed cards are worth ×0.3. The Loupe shows them; graders stamp them ALTERED.
  - Buyers still won't pay for fakes (as in v2), but trims fool buyers. Selling a trim gets a complaint and a refund the next morning.

## v3.1 grading rework (Hunter, Nov 1, 2026: "Grading rework" first)
From the v3.1 beta plan (`design/v3.1-beta-plan.md` on branch `hunter/playtester-agents`, PR #70), sections 1–3.
- **You're an informed card owner:** every card's name, set and rarity is known. No unreadable scripts, decoding, translator or fluency.
- **Condition is a range:**
  - A loupe look reads each subgrade as a range (±2 at the start), and the grade and value show as ranges.
  - Before any look, a card shows the range its source suggests.
  - Your eye is never certain; only a slab is.
- **Eye track** (Loupe upgrades at close): Centering Card 25₵, Edge Light 30₵ and Surface Lamp 35₵ each narrow one subgrade to ±1. The Trained Eye (90₵, needs the other three) narrows all three and lands on the truth more often. A new tool lets you re-read a card.
- **Graders tell the truth:** Halo is exact; QuikSlab can be one off. The grading form shows what a card is worth at each grade in your range.
- **Black Label 10:** Halo only. The card must be perfect (all three subgrades a true 10) and pass Halo's second look (about 1 in 3). Worth 2.5× a normal Halo 10.
- **Getting slabs back:** a grader box each morning that slabs return (and on Grade Day). Tap to slit the tape, then flip each slab to see the grade against your read. A Black Label glows.
- **Q1–Q4, confirmed by Hunter on Nov 1, 2026 ("Keep defaults"):**
  - Q1: the "game you grew up on" opening question stays, with no new perk yet.
  - Q2: Lens, Spectrometer and Steady Hands stay; the Eye track is added rather than replacing them.
  - Q3: QuikSlab keeps its ±1.
  - Q4: Black Label comes from Halo only.

## v3.1 floor, tutorial and vintage (Hunter, Nov 1, 2026)
Answers to the v3.1 plan's Q5–Q10. Hunter said yes to Q5 and Q6, "you pick" for Q7 and Q8, gave the vintage idea for Q9, and "whatever you think" for Q10.
- **Q5, guided day 1:** on by default for a new run, with SKIP TUTORIAL.
  - Five steps: open the crate, put your best card in the case, Stock the floor, open, show your first customer a card.
  - The first customer is an easy buyer who wants something in your case.
- **Q6, automate the chores:** auto-sleeve when placing a card, auto-file new cards, and auto-refill the rack between customers. All on by default; each toggles in the back room's gear panel.
  - Choosing what goes in the case, pricing and grading stay the player's job.
  - **Stock the floor** is one button. It fills the opening minimums first, then empty case slots with cards worth 10₵+, the counter binder with 4–60₵ cards, and the rack with shelf packs. Its label says what it will do.
- **Q7, rep is how people treat you:** at rep 100 sellers ask about 10% less; at rep 0, about 10% more. Stars stay walk-in traffic and what browsers pay. The morning report now says why the stars moved (the day's top three reasons).
- **Q8, repacks hidden for v3.1:** the bulk sorter is off the catalog. The code stays until repacks are rebuilt.
- **Q9, vintage:**
  - Rare vintage stays expensive, and so does all vintage sealed. Vintage commons and uncommons are 25% cheaper.
  - The vintage loop starts on day 3: Mox, a shady stranger (sunglasses indoors, two tells), gives you three real vintage packs, free.
  - The packs have beat-up wrappers: about 8% of a pristine pack's sealed value (around 85–100₵ each), with real vintage cards inside (average about 83₵, about a 31% chance of a hit, best seen about 2,076₵).
  - Rip them, sell them, or keep some. Calling security on him is a wrong call.
- **Q10:** the human questionnaire gets the agents' keep / remove / change / add questions (done by Claude in the artifact).
- **Also:**
  - Skrimp the scalper buys at most 6 packs a visit (2 under Limit 2).
  - Honest customers show a tell 4% of the time (was 12%).
  - A warnings bar (crate waiting, slabs back, case nearly empty, rack empty, sleeves low) with fix buttons.

## Still open
- Final title (Intergalactic Card Trader is a working title).
- Whether the art direction holds after the crew sees it.
- Zach's and Joe's pitch answers.
- Competitors and the "why now" numbers before any public slide.
