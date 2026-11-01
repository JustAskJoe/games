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
- **Build calls made while tuning (Claude; Hunter to confirm or change):**
  - Unsleeved cards in binders wear a little (6% a night), not zero as the scope said. Without that, a player who never sleeves loses almost nothing. Loose cards in the inbox tray or the case wear at 12% a night, and showing a card to a buyer adds 3%.
  - Booster boxes now arrive in the next morning's crate, not straight away. This costs about 30 points of growth against v2, so v3 is a harder week.
  - Sticky takes from the case or the rack (50/50) unless you watch them. An unlocked case also loses an item 25% of nights from day 3.
  - The Switcher only gets raw cards in a penny sleeve or no sleeve. Hard sleeves, mag cases and slabs count as "shop-stamped" and can't be swapped.
  - Trimmed cards are worth ×0.3. The Loupe shows them; graders stamp them ALTERED.
  - Buyers still won't pay for fakes (as in v2), but trims fool buyers. Selling a trim gets a complaint and a refund the next morning.

## Still open
- Final title (Intergalactic Card Trader is a working title).
- Whether the art direction holds after the crew sees it.
- Zach's and Joe's pitch answers.
- Competitors and the "why now" numbers before any public slide.
