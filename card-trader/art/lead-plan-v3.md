# Intergalactic Card Trader: lead art plan, v3 addendum ("The Back Room")

© 2026 justaskjoe. All rights reserved.

status: draft
updated: 2026-11-01
camera: 2d
release_target: steam
style_fit: good
ship: 5
test: 1
skip: 1
hours_estimate: 20-30 (v3 only)
money_estimate: about $0.54 first tries, about $2-3 with retries (Gemini, Hunter's account); ask: a $5 cap
team_needed: lead-artist, artist, ui-vector, tech-artist
team_later: marketing-artist

Written by the Lead Artist (`kit/agents/lead-artist.md`, JOB: plan) for `design/v3-design.md`. It adds to the approved `art/lead-plan.md` and `art/lead-plan-v2.md` and changes nothing in them. Rules are from `kit/art/art-rules.md` (R1, R2, …). The exact generation list is in [`v3-shotlist.md`](v3-shotlist.md).

---

## 1. The short version

- **6 Gemini images** cover all of v3's painting: the Back Room, 5 bad actors (in 3 species lineups), a product sheet and a crate sheet.
- **Everything the player drags, reads, counts or inspects is code**: slots, grids, price tags, locks, sleeves, labels, tells, the inbox tray and the catalog (R1, R2, R24, R25).
- **No painted expressions yet.** The v2 playtest is still open, and v3's question is about the shop, not faces.
- The look doesn't change. Every call passes the key art as a **style guide only**, plus a second reference so the model doesn't copy the key art's layout (new lessons L12, L14).

## 2. Every v3 visual need

**paint** = the Artist, with Gemini. **code** = the UI & Vector Designer (UI, SVG) or the Tech Artist (layers, motion, crops). **reuse** = already in the build.

| # | v3 need (design §1) | Make it | Who | Why |
|---|---|---|---|---|
| 1 | Back Room scene | **paint** (1 image) | Artist | A new place. It's the map the drag-and-drop UI sits on (§3) |
| 2 | Hotspots and slot grids: case 12×4, rack 16 hooks, shelves 24 (+12), safe 6, bin 60 | code | Tech Artist + UI & Vector | Drag targets must be exact and tunable (R2) |
| 3 | Items in place (cards, slabs, packs, boxes on hooks, shelves and in the case) | code | Tech Artist | They move every day; a painted item can't move (R25) |
| 4 | Binder pages (9 pockets) and binder spines on the shelf | code | UI & Vector | Binder count grows (15₵ each); pages are UI (R2) |
| 5 | Bulk bin fill level | code | Tech Artist | Changes with stock |
| 6 | Inbox tray | code | UI & Vector | UI (R2) |
| 7 | Counter ↔ Back Room switch (tab, hotkey) | code | Tech Artist | Motion, not art |
| 8 | Price tags in the case | code | UI & Vector | Numbers are text (R1) |
| 9 | Case lock / unlocked | code | UI & Vector | A padlock icon and a glass glint; the player reads its state (R25) |
| 10 | "No touching" sign on the rack | code | UI & Vector | Text (R1) |
| 11 | Penny sleeve, hard sleeve, mag case on a card | code | Tech Artist | The player checks what's protected, so it's a layer (R25) |
| 12 | Wear on unprotected cards | **reuse** | — | v1's code wear marks already do it |
| 13 | Sleeving policy panel at close | code | UI & Vector | UI with numbers (R1, R2) |
| 14 | DJ warns when gear runs out | **reuse** | — | `dj.webp` and Lane FM lines |
| 15 | Product packaging: booster box, collector box, pack, poster tube, playmat, deck box, 3 gear packs | **paint** (1 sheet of 9) | Artist | Physical things that should feel tactile; blank labels only (§5) |
| 16 | Labels on products, per card game | code | UI & Vector | Names and logos are text and glyphs (R1, R24) |
| 17 | Collector box contents: promo card, 3 packs, a pin | code + **reuse** | UI & Vector | Promo is v2's crest system; the pin is a small SVG badge |
| 18 | Distributor catalog | code | UI & Vector | UI, showing crops of #15 |
| 19 | Delivery crate (closed and open) | **paint** (1 sheet of 2) | Artist | The unboxing moment wants a real object |
| 20 | Crate tape, cut, lift, unpack | code | Tech Artist | Motion over the two crate crops |
| 21 | The Scale Gang portrait | **paint** (Zekk lineup) | Artist | A new face at the counter |
| 22 | The Switcher portrait | **paint** (same Zekk lineup) | Artist | A new face |
| 23 | A Trimmer portrait | **paint** (Mollu pair) | Artist | A new face |
| 24 | A Resealer portrait | **paint** (same Mollu pair) | Artist | A new face |
| 25 | Sticky portrait | **paint** (Puffi solo) | Artist | A new face |
| 26 | Trimmer tell: edges *too* perfect, size a bit off, ALTERED stamp | code | Tech Artist + UI & Vector | Seen under the Loupe (R25) |
| 27 | Resealer tell: glue shine, creased wrapper | code | Tech Artist | A layer over the painted pack (R25) |
| 28 | Switcher counter: shop-stamped sleeves, watch-the-hands moment | code | UI & Vector + Tech Artist | A stamp is a mark (R2); the moment is motion |
| 29 | Sticky lifting, floor check, Scale Gang lingering at the rack | code | Tech Artist | Mini portraits and motion over the room |
| 30 | Customer expressions | **reuse** (code reactions) | — | §6 |
| 31 | Slabs in the case and safe | **reuse** | — | v1's code slabs |
| 32 | Counter, After Hours scenes, Loupe, front end, save slots | **reuse** | — | Design §1E |

**Counts:** 8 paint rows (6 images), 19 code, 5 reuse.

### Ship / test / skip (R10)

| Asset type | Count | Tier | Who |
|---|---|---|---|
| Back Room scene | 1 | ✅ ship | Artist |
| Bad-actor portraits | 5 (3 images) | ✅ ship | Artist |
| Product cut-outs | 9 (1 sheet) | ✅ ship | Artist; labels by UI & Vector |
| Crate cut-outs | 2 (1 sheet) | ✅ ship | Artist; motion by Tech Artist |
| Back Room code layer (grids, sleeves, tells, tray, catalog, policy) | 1 system | ✅ ship | UI & Vector, Tech Artist |
| Painted expression sets | Pearla pilot only | 🧪 test | Artist, after the v2 playtest |
| Painted item states (a sleeved card, a resealed pack, a full bin, a stocked shelf) | — | ❌ skip | R25: one image per state can't be tuned |

## 3. The Back Room: composed for drag and drop

The painting is a **stage set**, not a scene. Code puts every item, slot and label on it.

**Must-haves in the prompt:**
- **Straight-on front view at chest height, very little perspective,** every fixture square to the picture edges. A grid can only line up with a fixture that is a rectangle.
- **Every fixture empty:** no boxes, packs, cards, binders or posters. Painted stock would fight the code stock (R25).
- **No shops, signs, screens or posters,** and graffiti as abstract shapes only. Shop signs gave us fake lettering in v2 (L13, R1).
- **Calm areas (R21):** the case's inside, the bin's inside, the wall gap under the shelves and the floor strip are plain and low-detail.

**Zone map** (share of the 16:9 picture; the prompt asks for this layout, and the Tech Artist calibrates hotspots to the real painting after the pick):

| Zone (x, y) | Painted fixture | Code on top |
|---|---|---|
| top 0–5% | ceiling, lamps | nothing (room HUD sits outside or here) |
| x 2–18%, y 8–62% | pegboard **wall rack**, 4 rows of 4 empty hooks | 16 hook targets, code packs, Scale Gang mini portrait, "no touching" sign |
| x 22–78%, y 6–42% | 3 empty **back shelves**, bare wall below them | 24 slots (3 × 8); the +12 upgrade is a 4th code plank in the bare gap |
| x 82–98%, y 8–26% | 1 short empty **binder shelf** | binder spines |
| x 82–98%, y 30–68% | closed round-door **safe** | 6 slots in a code panel on tap |
| x 20–80%, y 46–96% | long glass **display case**, 4 thin clear glass shelves, plain dark felt | the 12 × 4 grid (one glass shelf per row), price tags, lock, glint |
| x 0–18%, y 66–100% | big open **bulk bin**, empty inside | fill heap and count |
| x 82–100%, y 72–100% | bare floor | **inbox tray** and crates |

- **Why four glass shelves:** a front view of a case shows its tiers, not its top, so the 4 rows read as 4 shelves. Shelves are thin and clear so a 2 × 2 collector box can span two rows.
- **Real size (R8):** at a 1280 px stage the case cells are about 64 px wide, fine on desktop. On a phone the 12 × 4 grid is too small: the case opens as a code close-up panel below 768 px. That's a UI call for the Tech Artist; the painting is the same either way.
- **Fallback if Gemini won't hold the layout:** the UI & Vector Designer draws a flat grey block-out of the zone map (shapes only), and the retry passes it as reference 3, "layout guide only". If that fails too, the painting becomes atmosphere only and each place opens as a code panel.

## 4. The five new bad actors

Paint by species, as lineups cut in code (proposed R26, L10), each with the key art plus that species' anchor (R3). Front-facing and neutral (R6); personality from props and outfit. Prompts describe them and **never use their names** ("Sticky" invites slime, "Scale Gang" invites a fish).

| Bad actor | Species | Look | Look-alike risk (R17) | Fix in the prompt |
|---|---|---|---|---|
| **The Scale Gang** (a pair, one portrait) | Zekk | Two lanky beetle-folk in matching track jackets (teal and magenta), a small brass hand balance on each belt | Famous animated **grasshopper gang** villains; a famous turtle franchise (green + shell, as Skrimp was) | Round beetle shells in cyan and violet, not green; no wings, no long jumping legs, no hats |
| **The Switcher** | Zekk | Slim, sly half smile, a buttoned waistcoat with sleeve garters on all four arms; two hands hold blank face-down cards, two hands open and empty | Stage-magician mascots; a famous card-anime villain; muscular four-armed fighters | No top hat, cape, monocle or golden eye; slim, not muscular |
| **A Trimmer** | Mollu | Prim snail-folk with a crisp, perfectly smooth shell edge (the pun), half-moon glasses, a striped smock, a rolled pouch of tiny files | Famous cartoon snails; a famous film character with **scissors for hands**; barber villains | No scissors or blades at all; a calm tidy look, not creepy |
| **A Resealer** | Mollu | Chatty snail-folk with a glossy wet-look shell (the glue pun), a cardigan and a sun visor, a small glue pot and brush, a blank sealed box | A famous **giant slug crime lord**; famous green slime ghosts | Small and tidy, not a big slug; coral and orange, no green slime |
| **Sticky** | Puffi | Small mint fluffball, cheeky grin, a too-big coat with inner pockets, blank card backs stuck in its fur | The famous **pink puffball** hero; **cartoon burglars** (eye mask, striped shirt, swag bag); famous raccoon thieves | Mint, never pink; no mask, no stripes, no sack, no shades (the Hype Bros own shades) |

- **Inside the game (R9):** bad actors must not be mistaken for regulars or for v2's crew at the 290 px portrait box. Skrimp and Klik are lime Zekk, so the Scale Gang and the Switcher are cyan and violet; the Hype Bros wear star shades, so Sticky doesn't. The code nameplate does the rest.
- **Solo drift (L10):** if Sticky drifts, redo it next to Mimbo (its anchor) and crop only Sticky.

## 5. Product packaging: blank-label art, text in code (R1)

- **One 3 × 3 sheet,** nine objects on a plain paper background, cut into transparent cut-outs (R15 halo check on light and dark).
- **Every object has one big blank label panel** facing the viewer. Bodies are neutral (night violet, ink, silver); the UI & Vector Designer puts a per-game sticker label on top: the game's colors, its glyph logo (R24), and any name. One painting serves all three card games.
- **Items:** booster box, collector box, foil pack, poster tube, rolled playmat, deck box, penny-sleeve pack, hard-sleeve tray, mag case.
- **Not painted:** sleeves *on* cards (row 11), resealed or creased packs (row 27), stocked shelves. Those are layers (R25).
- **The pack replaces v1's CSS "PACK" stand-in** on the rack and the counter, so the Resealer's glue shine has a real wrapper to sit on.
- **Look-alike (R17):** the collector box must not echo a famous TCG's trainer box: a plain lidded box with a ribbon band, no character window.
- **Fallback:** if nine objects melt together or come out at mixed scales, split into two 2 × 2 sheets (one more image).

## 6. Customer expressions: not now

- v2's plan said an expression pilot waits for the v2 playtest. That playtest is still open in `patch-notes.md`.
- v3's pass bar is about shelves and sleeving, not faces. The bad actors' tells are code moments (lingering, a hand swap), and code reactions already sell a mood.
- **When the v2 playtest is in:** if testers ask for faces, a 🧪 pilot of Pearla in 3 expressions, made as **edits of her anchor** (R11), about $0.20. Then a decision. It's not on the v3 shot list.

## 7. Risks

1. **The Back Room doesn't line up with the drag targets** (perspective, clutter, fixtures out of place). Fix: straight-on, empty-fixture prompt; hotspots calibrated after the pick; fallback block-out reference, then code panels (§3).
2. **Stray lettering** in a shop room, on packaging and on a crate (L0, L13). Fix: no shops or signs, blank labels, "no stencils"; zoom check every surface (R1); edit, don't reroll (R11).
3. **Franchise look-alikes** among 5 new faces (L9). Fix: §4's prompt fixes; look-alike check at review; rejects logged in `design/ai-assets.md`.
4. **Gemini copying references** (pasting the key art in, or its layout; L12, L14). Fix: the style-guide-only line first in every prompt, and never the key art as the only reference.
5. **The product sheet melts** (nine objects, mixed scale, see-through sleeves hard to cut out). Fix: wide gaps, front view, one scale; fallback two 2 × 2 sheets; R15 check.

Also open: Gemini's commercial terms (legal reviewer, as in v2), and money needs Hunter's OK (R20).

## 8. Hours and money

Gemini Nano Banana 2 at **$0.067 a 1K image and $0.101 at 2K** (from `kit/art/README.md` and `pipeline-upgrade.md`, checked on ai.google.dev on Oct 31; **not re-checked today**). Paid on Hunter's Google account. Canva isn't used (it throttles to about one image every 10–30 minutes, L15).

| Item | Images | Size | First try | Worst case (4 tries) |
|---|---|---|---|---|
| Back Room | 1 | 2K | $0.10 | $0.40 (+ block-out retry) |
| Bad actors (Zekk 3, Mollu 2, Puffi 1) | 3 | 2K, 2K, 1K | $0.27 | $1.08 |
| Product sheet | 1 | 2K | $0.10 | $0.40 (+ $0.20 if split) |
| Crate sheet | 1 | 1K | $0.07 | $0.27 |
| **Total** | **6** | | **about $0.54** | **about $2.15–2.50** |

- **Hours are estimates:** Artist about 2 h (run, review, crops, log rows); Lead Artist review about 1 h; UI & Vector about 8–12 h (grids, binder pages, tray, catalog, policy panel, labels, padlock, stamps); Tech Artist about 10–14 h (hotspot map, item placement, sleeves, crate motion, tells, cut-outs). **Total about 20–30 h**, almost all of it code.
- Every keeper: phone check (R8), hands and faces at 100% (R12), look-alike check (R17), stray text (R1), cut-outs on light and dark (R15), WebP or JPG at the sizes in the shot list (R14), and a row in `design/ai-assets.md` from `gemini-log.jsonl` (R18, R23).

## 9. Decisions for Hunter

- [ ] Approve the split: 6 Gemini images, everything else in code (§2).
- [ ] Approve the money: about $0.54 first tries, a **$5 cap** on Gemini for v3 (R20).
- [ ] The Back Room as an empty stage set with the zone map (§3); case close-up panel on phones; block-out reference as the first fallback.
- [ ] The five bad-actor looks and species (§4).
- [ ] One blank-label product sheet with code labels per card game, replacing the CSS pack stand-in (§5).
- [ ] Painted crate (closed and open) rather than a CSS crate.
- [ ] No painted expressions in v3; Pearla pilot only after the v2 playtest (§6).
- [ ] Ask the Lead Artist for a `learn` run to propose two rules from L12–L14: "Gemini prompts start with the style-guide-only line, and never send the key art as the only reference" (cost real money), and "no shops or signs in backgrounds" as an R1 check (L0 and L13 are the same lesson twice).
- [ ] Still open from v2: the legal reviewer on Gemini's commercial terms, and adopting proposed R26 (v3 leans on it again).
