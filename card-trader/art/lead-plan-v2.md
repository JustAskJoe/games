# Intergalactic Card Trader: lead art plan, v2 addendum

© 2026 justaskjoe. All rights reserved.

status: approved
updated: 2026-11-01
camera: 2d
release_target: steam
style_fit: good
ship: 7
test: 1
skip: 1
hours_estimate: 15-25 (v2 only)
money_estimate: $0 (Canva plan credits)
team_needed: lead-artist, artist, ui-vector, tech-artist
team_later: headless-finals, marketing-artist

Written by the Lead Artist (`kit/agents/lead-artist.md`, JOB: plan) for `design/v2-design.md`. **Approved by Hunter on Nov 1, 2026** ("Approve, make the art"). It adds to the approved `art/lead-plan.md` and changes nothing in it. Where the two disagree, the approved plan wins until Hunter approves this one. Rules are cited from `kit/art/art-rules.md` (R1, R2, …). The exact generation list is in [`v2-shotlist.md`](v2-shotlist.md).

---

## 1. The short version

- v2 needs **12 new paintings**: 3 character portraits, 6 card sheets (3 alt-art, 3 full-art) and 3 scenes.
- Everything else in v2 is **code**: mirror foil, stamps, serials, misprints, set symbols, signatures, promo crests, the full-art frame, flyers, the ticker and the "Limit 2" sign (R1, R2, R24, R25).
- Customer expressions stay **code reactions** for v2 (design §7). An expression pilot waits until after the v2 playtest.
- The look doesn't change. The key art (MAHZoSFZr5A) is the style anchor on every call (R3).

## 2. Paint or code: every v2 feature

| v2 feature | Paint or code | Who | Why |
|---|---|---|---|
| Mirror foil | Code: a sheen on the frame, masked off the art | Tech Artist | Players must spot it, so it's a layer (R25) |
| Full-art | **Paint** (6 new illustrations) plus a code full-art frame | Artist; UI & Vector for the frame | A new picture shape. The frame and all text stay code (R1, R2) |
| Alt-art | **Paint** (12 new illustrations, as 2×2 sheets) | Artist | "A different painting" can't be faked with a tint |
| First Run stamp | Code (SVG) | UI & Vector | Seen with the Loupe (R25); it's a mark, not art (R2) |
| Vintage and reprint set symbols | Code (SVG, one per wave) | UI & Vector | Only the Print Lens shows them; must be exact (R2, R25) |
| Serial #/50 | Code: foil numbers drawn by the game | UI & Vector | Numbers are text (R1) |
| Misprints (miscut, ink swap, missing foil) | Code: shift the inner box, swap the hue filter, drop the holo layer | Tech Artist | Must look like damage and be tunable (R25) |
| Signatures | Code: a scrawl built from the game's glyph set | UI & Vector | Invented script is text (R24) |
| Promo crests (event and ship) | Code (SVG) | UI & Vector | Small crisp marks (R2) |
| Box toppers, release promos | Code: a promo crest on a normal card | UI & Vector | No new picture needed |
| Spectrometer, Print Lens, Steady Hands | Code (Loupe HUD) | UI & Vector | UI (R2) |
| "Limit 2" sign, rumor ticker, After Hours flyers | Code | UI & Vector | Text (R1). Flyers can show a crop of a scene painting |
| Skrimp, the Glyphsmith courier, the Hype Bros | **Paint** (3 portraits) | Artist | New faces at the counter |
| Tournament Night, Dock Auction, Release Day | **Paint** (3 scenes) | Artist | New places (see §5) |
| Bulk Dig, Swap Meet | Reuse v1 scenes | Tech Artist | See §5 |
| Customer reactions | Code (squash, bounce, shake, tilt, slide) | Tech Artist | Design §7 (R10) |

### Ship / test / skip for v2 (R10)

| # | Asset type | Count | Tier | Who |
|---|---|---|---|---|
| 1 | Full-art illustrations | 6 (2 per game) | ✅ ship | Artist |
| 2 | Alt-art illustrations | 12 (4 per game) | ✅ ship | Artist |
| 3 | Variant layers (foil, stamps, serials, misprints, symbols, signatures, crests, full-art frame) | 1 system | ✅ ship | UI & Vector, Tech Artist |
| 4 | New customer portraits | 3 (4 characters) | ✅ ship | Artist |
| 5 | New scenes | 3 | ✅ ship | Artist |
| 6 | Reused scenes for Bulk Dig and Swap Meet | 2 | ✅ ship | Tech Artist |
| 7 | Customer reactions in code | 1 system | ✅ ship | Tech Artist |
| 8 | Painted expression sets | pilot only | 🧪 test | Artist (after the playtest) |
| 9 | A baked painting per print or variant | — | ❌ skip | — (R25: one image per variant can't be tuned) |

## 3. Full-art and alt-art: how to paint them

### What the card looks like today
- The card is 5:7. The v1 art window is about 8:7 (nearly square), cut from a 2×2 square sheet.
- The window today stretches each square cell by about 15% sideways. Tech Artist: think about `cover` per cell in the v2 frame work. Not an art change.

### Alt-art
- **Same picture shape as v1**: a 2×2 square sheet (SQUARE_1_1), one per game, cut in code the same way as `cards-<game>.jpg` (proposed R26).
- **Same 4 creatures as the game's v1 sheet**, in a new pose, setting or time of day. A player who knows the normal art should see "same card, new painting" at a glance.
- Pass the game's v1 sheet as the set anchor (R3), so each creature keeps its design.
- **Safe area:** subject centered with about 8% clear margin on every side of each panel, because of the stretch and the code border.
- **How many:** 4 per game (one sheet), 12 in all. Each alt-art maps to the v1 creature in the same panel, so the code tint per card still applies.

### Full-art
- **Shape:** two tall panels side by side on one 4:3 landscape image (LANDSCAPE_4_3). Each half is about 2:3. Code trims about 7% off its height to make 5:7.
- Two per image keeps a pair on one light and one hand (proposed R26) and halves the generations.
- **Fallback:** if the two panels melt into one scene, redo each one alone at PORTRAIT_2_3.
- **How many:** 2 per game, 6 in all. The two rarest creatures of each game:
  - Shellstorm: tide queen, maelstrom tortoise
  - Hive Gambit: queen mech, hornet mech
  - Starweave: celestial weaver, eclipse lion
- **Safe areas** (as a share of the finished 5:7 card, top to bottom):

| Zone | Height | What's there | Rule for the painting |
|---|---|---|---|
| Edge | outer 7% each side, 6% top and bottom | Code border, centering offset, wear | Art bleeds through it. Nothing important there |
| Focus | 8% to 52% | The creature's head and the main shape | The subject's face and silhouette live here (R9) |
| Signature | 52% to 62% | Code glyph signature, when signed | Simple, low-detail background |
| Name bar | 63% to 76% | Code name bar (see-through) | Calm: soft gradient, halftone, no faces |
| Marks | 76% to 94% | Set symbol, serial, stamp, gem, game icon | Calm and darker, so foil marks read |

- In plain words: **top half for the creature, bottom 40% calm**. The prompt says so (R21).
- The full-art frame, name, gem and every mark are code (R1, R2). The holo and wear layers sit on top (R25).

## 4. The three new characters

All three are painted on a plain background, front-facing and neutral (R6), so each portrait can become that character's anchor for later art. Personality comes from **props and outfit**, not pose. Prompts describe them; they **don't use their names**. "Skrimp" would invite a shrimp, and "Bros" invites a famous plumber duo.

| Character | Species anchor (R3) | Look | Silhouette (R9) |
|---|---|---|---|
| **Skrimp**, the scalper (Zekk) | Zekk lineup MAHZohkB4CA | Lanky four-armed beetle-folk in oversized sneakers and a pocket-heavy puffer vest, a narrow visor, all four arms hugging stacks of blank sealed packs and boxes | Zekk outline, made wider by the pack stacks |
| **The Glyphsmith courier** (Mollu) | Pearla MAHZoTKOwDs | Tidy snail-folk with a big pearly shell, a delivery satchel strapped over the shell, a short scarf, a parcel in hand, a loupe on a cord, **ink-stained fingertips** (the tell) | Mollu shell, with the satchel's strap and flap |
| **The Hype Bros** (Puffi duo) | Puffi lineup MAHZolQj-xw | Two fluffballs floating close together, one tall-oval and one round, in matching sporty jackets in two colorways, star-shaped shades pushed up, each holding up a blank sleeved foil card | Two Puffi shapes in one frame |

- **One painting per species** (3 generations), each with the key art plus that species' anchor. Mixing three species in one lineup is untested, and each needs its own anchor.
- **Solo drift (L10):** a solo Klik once came out grittier. If a solo character drifts, redo it as a pair with an existing regular from the reference (Klik for Skrimp, Pearla for the courier), and crop only the new one.
- **The Hype Bros share one portrait.** Both fit in the 290 px portrait box, cropped center-top like v1.
- The courier needs a name from the designer. The portrait key is `p-glyphsmith.webp` until then.

## 5. After Hours scenes

The v1 night screen shows its scene dimmed behind a big center panel. So every scene keeps the **center calm** and puts its interest at the edges and top (R21).

| Event | Paint? | Plan |
|---|---|---|
| **Tournament Night** | **Paint** | Long tables of mixed-species players with cards and play mats, the shop after hours, a raised prize stand with an empty glass case (the prize card is drawn in code). Bracket board drawn in code. |
| **Dock Auction** | **Paint** | Night cargo dock, one big unlabeled crate on a pallet under a spotlight, a small auction podium, two empty rival spots left and right. The glyph label, clues and rival portraits are code over it. |
| **Release Day crowd** | **Paint** | Morning, the stall's front from outside, a long line of small mixed-species customers snaking down the strip, blank banners. "Wave 3" and every banner word is code (R1). Doubles as the day 5 morning scene. |
| **Bulk Dig** | **Reuse** `shop.jpg` | Night tint in code, 16 face-down code card backs on the counter. The game is the cards, not the room. |
| **Swap Meet** | **Reuse** `cardnight.jpg` | Three existing regulars' portraits over it, each with a trade offer. No new faces needed. |

Card Night is v1's, unchanged. Grade Day reuses `grader.jpg`.

## 6. Customer expressions

**Keep the code reactions for v2. Don't paint expression sets yet.**
- v2's question is about the market, not faces. Squash, bounce, shake and "?" tilt already sell a mood (design §7).
- Painted sets would be about 13 characters × 3 faces, each one an inpaint or edit with a high drift risk (L2).
- **After the v2 playtest**, if testers want faces: a 🧪 pilot of Pearla in 3 expressions, made by editing her anchor (R11), not new rolls. Then a decision.

## 7. Look-alike and IP risks (R17)

Every new character and scene gets the look-alike check at review, and rejects go in `design/ai-assets.md`, as v1 did (L9).

| Asset | Drifts toward | Fix in the prompt or the design |
|---|---|---|
| Skrimp (Zekk) | Famous insect villains and heroes from animated films and toku shows; muscular four-armed fighters; the style game's skater crews | Lanky, not muscular; round beetle shell; no red skin; sneakers, no inline skates, no big headphones |
| Glyphsmith courier (Mollu) | Famous cartoon snails (racing, pet and sidekick snails); hooded, masked bug knights from a hit indie game | Open friendly face, no hood, no cloak, no pale mask; satchel and scarf instead |
| Hype Bros (Puffi) | Famous pink puffball heroes and singing balloon monsters; the plumber brothers | No pink as the main fur; no caps, no mustaches, no red and green pairing; sporty jackets and star shades |
| Full-art cards | Famous TCGs' full-art and borderless frames | The frame is our own code design; the painting has no frame or border at all |
| Mirror foil | A famous TCG's "reverse holo" pattern | Our own halftone sheen; no icon patterns in the foil |
| First Run stamp | A famous TCG's black "first edition" circle stamp | **Not a circle and not black.** For example a spray-tag star in Sun yellow |
| Promo crests | A famous TCG's black-star promo mark | Ship and event crests as shapes from our three species, never a star alone |
| Set symbols | Real set symbols | Our own wave glyphs, drawn from the game scripts |
| Tournament Night | Holographic monster duels from a famous card anime | Plain tables, cards flat on mats, no holograms rising off cards |
| Release Day crowd | A famous space-film cantina crowd; real store launch photos | Small, cute, warm species from our three families only; blank banners |
| Dock Auction crate | — (low risk) | Unlabeled crate; label in code |
| Names | "Hype Bros" may be used by real creators. Not an art risk | Legal reviewer: quick name check |

**Process risks:**
- **Untested full-art method.** The two-panel 4:3 sheet is new. Shellstorm goes first, alone in its batch slot, so a failure costs one generation.
- **Canva throttling (L3, L11, R16).** Three small batches with cooldowns between them (see the shot list).
- **Canva rights (approved plan §8).** Still open with the legal reviewer. v2 adds 12 raw images to the same question.

## 8. Hours and credits

Scaled from the approved plan §7 and `art-direction.md`'s cost table: about 4 tries per sheet or lineup and 3 per scene. **Hours are estimates.**

| Item | Generations (first try) | With retries (worst case) | Review time |
|---|---|---|---|
| 3 portraits | 3 | ~12 | ~10 min each, plus look-alike checks |
| 3 alt-art sheets | 3 | ~12 | ~10 min each |
| 3 full-art pairs | 3 | ~12 | ~10 min each |
| 3 scenes | 3 | ~9 | ~5 min each |
| **Total** | **12** | **~45** | ~2 h |

- **Credits:** 12 to ~45 Canva generations on Hunter's plan. **Money: $0.** No Gemini needed for v2.
- **Artist session time:** about 2 to 3 h across 2 sessions, mostly cooldowns and fetching full size (R13).
- **Code work** (not image hours): UI & Vector about 4 to 6 h (full-art frame, stamps, crests, symbols, signature scrawl); Tech Artist about 4 to 6 h (foil, misprints, crops, reactions, the reused night scenes).
- **Total v2 art: about 15 to 25 studio hours.**
- Every kept image goes through fetch at full size (R13), the finishing pass (R7), WebP or JPG at the art-direction sizes (R14), a phone check (R8), and a row in `design/ai-assets.md` with media id and references (R18, R23).

## 9. Decisions for Hunter

- [ ] Approve the split: 12 paintings, everything else in code (§2).
- [ ] Full-art as two panels on one 4:3 image (§3), with single 2:3 images as the fallback.
- [ ] 2 full-art and 4 alt-art per game (6 and 12 in all).
- [ ] The three character looks (§4), painted one species at a time.
- [ ] Paint Tournament Night, Dock Auction and Release Day; reuse v1 scenes for Bulk Dig and Swap Meet (§5).
- [ ] Code reactions for v2; an expression pilot only after the playtest (§6).
- [ ] The First Run stamp and promo crests stay clear of famous TCG marks (§7). The legal reviewer checks the variant marks with the frames.
- [ ] Adopt proposed rule R26 (paint groups, cut in code). v2 leans on it again.
- [ ] Name the Glyphsmith courier (design), and a quick name check on "Hype Bros" (legal).
