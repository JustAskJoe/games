# Intergalactic Card Trader: v3 shot list ("The Back Room")

© 2026 justaskjoe. All rights reserved.

status: approved, on hold (placeholder art first, $0)
updated: 2026-11-01
generations: 6 (first tries)
estimate: about $0.54 first tries (4 × 2K at $0.101, 2 × 1K at $0.067)

For the Artist (`kit/agents/artist.md`), from the Lead Artist's v3 addendum (`art/lead-plan-v3.md`). **Don't run it until Hunter approves the plan and the money (R20).** Rules from `kit/art/art-rules.md`.

## How to run it

- **Tool:** Gemini Nano Banana 2 (`gemini-3.1-flash-image`) through `kit/art/gemini.py`. Write `card-trader/art/v3-gemini-jobs.json` from this list, modelled on `v2-gemini-jobs.json`: prompts verbatim, anchors as the local files below, `refs` in the order listed (reference 1 is always the key art).
- **Dry-run first** (`--dry-run`): it checks every anchor and prints the cost. Stop if it's over the approved cap.
- **Order:** run shot 1 alone and review it before the rest; it's the riskiest and the UI depends on it. Then shots 2–4 (review all faces together for look-alikes, R17), then 5–6.
- **Prompt order** (house recipe, `art-direction.md`): the reference lines, the style lead, the subject, the palette, the closing line. The light line is inside the style lead (R22).
- **Every keeper:** stray text at 100% zoom (R1; signs, labels, crates and graffiti especially), hands and faces at 100% (R12), look-alikes (R17), real size on a phone (R8), cut-outs on light and dark (R15), then a row in `design/ai-assets.md` from `art/gemini-log.jsonl` (R18, R23). Raw outputs stay in `art/gemini/` (git-ignored).
- **Near-misses:** edit first (a Gemini edit call with the raw image as reference), don't reroll (R11).
- **Prompts never use the characters' names.**

**Anchors (local files):**

| Name | File | Used for |
|---|---|---|
| keyart | `card-trader/builds/img/keyart.jpg` | Style guide only, every shot (R3) |
| shop | `card-trader/builds/img/shop.jpg` | Shop materials and product boxes (shots 1, 5) |
| zekk | `card-trader/builds/img/p-klik.webp` | Zekk species body (shot 2) |
| pearla | `card-trader/builds/img/p-pearla.webp` | Mollu species body (shot 3) |
| puffi | `card-trader/builds/img/p-mimbo.webp` | Puffi species body (shot 4) |
| auction | `card-trader/builds/img/auction.jpg` | The crate's build (shot 6) |

**Style-guide line** (first in every prompt; L12):
> Reference image 1 is a style guide only: match its ink line work, flat bold color, halftone and spray drips, but do not include, copy or reuse its scene, characters, layout or background anywhere in the new image.

**Style lead:**
> 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim.

**Closing line:**
> Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.

---

## 1. `backroom`: the Back Room (priority 1)
- **Subject:** the empty stock room the drag-and-drop UI sits on (lead plan §3).
- **Prompt:** Reference image 1 is a style guide only: match its ink line work, flat bold color, halftone and spray drips, but do not include, copy or reuse its scene, characters, layout or background anywhere in the new image. Reference image 2 shows our shop counter: borrow its materials only (warm wood, brushed metal, glass cases, painted walls), and do not copy its layout, its doorway, its view of the street or its camera angle. 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. The back stock room of a small card shop, with no people, seen straight on from the front at chest height like a flat stage set, very little perspective, every fixture square to the edges of the picture. On the left wall, a tall pegboard rack with four rows of four empty hooks. Across the top of the back wall, three long empty wooden shelves one above the other, with a bare stretch of wall below the lowest shelf. At the top right, one short empty shelf; below it at the right, a heavy closed safe with a round door, standing on the floor. Across the bottom middle, in front, a long low glass display case seen from the front, with four thin clear glass shelves one above the other and a plain dark violet felt floor, completely empty inside. In the bottom left corner, in front, a big open wooden bin, empty inside. In the bottom right corner, a bare patch of plain floor. Every hook, shelf, case and bin is completely empty: no boxes, no packs, no cards, no binders, no posters. No windows, no doorway, no shops, no signs, no screens. The walls are painted with abstract graffiti shapes, stars and drips only, no tags and no lettering. Inside the case, inside the bin, the wall below the shelves and the floor are calm and plain. Palette: violet #6A2BD9 and night #1B0E33 walls, warm wood, sun #FFD21F lamps, cyan #19D3F0 glass glints, magenta #FF2E93 and lime #A6F01E graffiti accents, ink #120A1F lines. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** 16:9 · **Size:** 2K
- **Anchors (refs, in order):** `card-trader/builds/img/keyart.jpg`, `card-trader/builds/img/shop.jpg`
- **Finish:** `post` to `card-trader/builds/img/backroom.jpg`, width 1280, quality 82.
- **Use in code:** the Back Room background on the 16:9 stage. After the pick, the Tech Artist measures each fixture into a hotspot map (% rects) and lays the case's 12 × 4 grid on its 4 glass shelves, 16 hooks, 3 × 8 shelf slots plus the code 4th plank in the bare gap, binder spines, bin fill, and the inbox tray on the bare floor. Below 768 px the case opens as a code close-up panel.
- **Reject if:** anything sits on a shelf, hook or in the case or bin; fixtures are badly out of the zone map (lead plan §3); any lettering.
- **Retry:** the UI & Vector Designer draws a flat grey block-out of the zone map (`card-trader/art/anchors/backroom-blockout.png`) and it's passed as reference 3 with "Reference image 3 is a layout guide only: put each fixture where its block is."

## 2. `crew-zekk`: the Scale Gang (pair) and the Switcher (priority 2)
- **Subject:** three Zekk, cut into two portraits.
- **Prompt:** Reference image 1 is a style guide only: match its ink line work, flat bold color, halftone and spray drips, but do not include, copy or reuse its scene, characters, layout or background anywhere in the new image. Reference image 2 is our Zekk species reference: keep the species' body design (a round glossy beetle shell, big round eyes, short antennae, four slim arms) and nothing else from it, not its clothes, colors or pose. 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A lineup of three Zekk characters standing side by side, front-facing, full body, neutral pose and neutral expression, same height and framing, on a plain flat background, with a wide empty gap between the second and the third figure. Left and middle, a matching pair: lanky four-armed beetle-folk with round shells, one cyan and one violet, in matching zip-up track jackets, one teal and one magenta, each with a small brass hand balance hanging from the belt; slim arms, not muscular, no wings, no long jumping legs, no hats. Right: a slim four-armed beetle-folk with a violet shell and a sly half smile, in a neat buttoned sun-yellow waistcoat with sleeve garters on all four arms, two hands holding blank face-down cards and two hands open and empty; no top hat, no cape, no monocle, not muscular. Palette: cyan #19D3F0 and violet #6A2BD9 shells, teal #19C8D8 and magenta #FF2E93 jackets, sun #FFD21F waistcoat, ink #120A1F lines, plain paper #FFF6E3 background. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** 16:9 · **Size:** 2K
- **Anchors:** `card-trader/builds/img/keyart.jpg`, `card-trader/builds/img/p-klik.webp`
- **Finish:** raw master only (`card-trader/art/gemini/crew-zekk.jpg`, no `post`).
- **Use in code:** the Tech Artist crops `p-scalegang.webp` (left two figures, upper body) and `p-switcher.webp` (right figure), 600 × 600 WebP, center-top like `p-hypebros.webp`, for the 290 px portrait box and the mini portrait on the rack.
- **Check:** no grasshopper or turtle look (R17); reads apart from Skrimp and Klik at 290 px (R9).

## 3. `crew-mollu`: a Trimmer and a Resealer (priority 3)
- **Subject:** two Mollu, cut into two portraits.
- **Prompt:** Reference image 1 is a style guide only: match its ink line work, flat bold color, halftone and spray drips, but do not include, copy or reuse its scene, characters, layout or background anywhere in the new image. Reference image 2 is our Mollu species reference: keep the species' body design (snail-folk with a big pearly spiral shell, soft round eyestalks and a friendly face) and nothing else from it, not its clothes, colors or pose. 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. Two Mollu characters standing well apart side by side, front-facing, full body, neutral pose and neutral expression, same height and framing, on a plain flat background. Left: a prim, tidy snail-folk whose mint shell has an unusually crisp, perfectly smooth edge, small half-moon glasses, a neat violet striped smock, a rolled cloth pouch of tiny files tucked under one arm, a polite tight smile; no scissors and no blades anywhere. Right: a small, chatty snail-folk with a very glossy, shiny wet-look coral shell, an orange cardigan and a sun visor, holding a small glue pot with a brush in one hand and a plain blank sealed box in the other, a big salesman grin; small and tidy, not a big slug, no green slime. Palette: mint #4CF2B5 and coral #FF6B6B shells, violet #6A2BD9 smock, orange #FF7A1A cardigan, sun #FFD21F visor, ink #120A1F lines, plain paper #FFF6E3 background. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** 16:9 · **Size:** 2K
- **Anchors:** `card-trader/builds/img/keyart.jpg`, `card-trader/builds/img/p-pearla.webp`
- **Finish:** raw master only (`card-trader/art/gemini/crew-mollu.jpg`).
- **Use in code:** crop `p-trimmer.webp` (left) and `p-resealer.webp` (right), 600 × 600 WebP, center-top.
- **Check:** no scissor-hands, slug-boss or slime-ghost look (R17); reads apart from Pearla, Tumbo, Sheelo and the courier (R9).

## 4. `crew-puffi`: Sticky (priority 4)
- **Subject:** one Puffi, one portrait.
- **Prompt:** Reference image 1 is a style guide only: match its ink line work, flat bold color, halftone and spray drips, but do not include, copy or reuse its scene, characters, layout or background anywhere in the new image. Reference image 2 is our Puffi species reference: keep the species' body design (a floating round fluffball with huge eyes and small stubby arms) and nothing else from it, not its colors or pose. 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A single Puffi character floating alone, front-facing, full body, neutral pose, a small cheeky smile, on a plain flat background: a small round mint fluffball with huge eyes, wearing a too-big long coat open at the front with many inner pockets, a few blank card backs and a wrapped candy stuck in its fluffy fur. Comic and friendly, never grim. Not pink, no eye mask, no striped shirt, no sack, no sunglasses. Palette: mint #4CF2B5 fur, orange #FF7A1A coat, violet #6A2BD9 lining, ink #120A1F lines, plain paper #FFF6E3 background. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** 1:1 · **Size:** 1K
- **Anchors:** `card-trader/builds/img/keyart.jpg`, `card-trader/builds/img/p-mimbo.webp`
- **Finish:** `post` to `card-trader/builds/img/p-sticky.webp`, width 600, crop to the upper body if needed (center-top).
- **Use in code:** portrait box and the mini portrait for the theft moment.
- **Check:** no pink-puffball or cartoon-burglar look (R17). **If it drifts** (L10), redo as a pair beside a Puffi regular and crop only this one.

## 5. `products`: blank-label product sheet (priority 5)
- **Subject:** nine products, cut into transparent cut-outs; labels in code (R1, R24).
- **Prompt:** Reference image 1 is a style guide only: match its ink line work, flat bold color, halftone and spray drips, but do not include, copy or reuse its scene, characters, layout or background anywhere in the new image. Reference image 2 shows our shop: borrow the chunky look of its product boxes only, not their art. 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A 3×3 sheet of nine separate product objects for a card shop, each alone and centered in its own cell on one plain flat paper background, with wide empty space between them and no lines or borders, all seen from the front and slightly above at the same scale. Each object has one large flat blank label panel facing the viewer, left completely empty. Bodies in night violet, ink and silver with halftone and drips; labels plain paper white. Top row: a sturdy sealed booster box; a square lidded collector box with a ribbon band and no window; a single sealed foil card pack with crimped top and bottom edges. Middle row: a tall poster tube with end caps; a rolled-up playmat tied with a strap; a deck box with a flip lid. Bottom row: a soft wrapped pack of thin clear card sleeves; a small tray of rigid clear card holders; a single thick clear card case with a dark rim. No creatures, no logos, no art on the labels, no stencils, no barcodes. Palette: night #1B0E33 and violet #6A2BD9 bodies, silver, paper #FFF6E3 labels, cyan #19D3F0 and magenta #FF2E93 glints, ink #120A1F lines, plain paper #FFF6E3 background. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** 1:1 · **Size:** 2K
- **Anchors:** `card-trader/builds/img/keyart.jpg`, `card-trader/builds/img/shop.jpg`
- **Finish:** raw master only (`card-trader/art/gemini/products.jpg`).
- **Use in code:** the Tech Artist cuts nine transparent WebPs, 384 px wide (2× for the catalog; scaled down on hooks and shelves): `prod-booster.webp`, `prod-collector.webp`, `prod-pack.webp`, `prod-poster.webp`, `prod-playmat.webp`, `prod-deckbox.webp`, `prod-penny.webp`, `prod-hard.webp`, `prod-mag.webp`. Background removal by key or Canva `remove-background` (L5); check halos on light and dark (R15). The UI & Vector Designer lays each game's sticker label on the blank panel. The pack replaces the CSS "PACK" stand-in; the Resealer's glue shine is a code layer on it.
- **Fallback:** if objects merge or scales differ badly, split into two 2 × 2 sheets (boxes and packs; gear and merch) at 1K.

## 6. `crate`: delivery crate, closed and open (priority 6)
- **Subject:** one crate in two states, cut into two cut-outs.
- **Prompt:** Reference image 1 is a style guide only: match its ink line work, flat bold color, halftone and spray drips, but do not include, copy or reuse its scene, characters, layout or background anywhere in the new image. Reference image 2 shows our dock auction: borrow the sturdy build of its cargo crate only. 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. Two separate illustrations of the same wooden shipping crate side by side, each centered on its own half of one plain flat paper background with a wide empty gap between them, both seen from the front and slightly above at the same scale. Left: the crate closed, with a plain flat lid, no tape. Right: the same crate open, its lid leaning against its side, soft packing straw inside and otherwise empty. No stencils, no stamps, no barcodes, no labels. Palette: warm wood, orange #FF7A1A and sun #FFD21F straw, violet #6A2BD9 shadows, ink #120A1F lines, plain paper #FFF6E3 background. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** 4:3 · **Size:** 1K
- **Anchors:** `card-trader/builds/img/keyart.jpg`, `card-trader/builds/img/auction.jpg`
- **Finish:** raw master only (`card-trader/art/gemini/crate.jpg`).
- **Use in code:** cut `crate-closed.webp` and `crate-open.webp` (512 px wide, transparent, R15). The Tech Artist draws the tape strip, the cut, the lid lift (a crossfade to the open crop) and items flying into the inbox tray.

---

## Not on this list (code or reuse)

- Slots, grids, hotspots, binder pages and spines, bin fill, the inbox tray, price tags, the lock, the "no touching" sign, the policy panel, the catalog: code (lead plan §2).
- Sleeves on cards, wear, Trimmer and Resealer tells, the ALTERED and shop stamps, the pin badge: code layers (R25).
- Customer expressions: code reactions. A Pearla pilot (edits of her anchor) only after the v2 playtest (lead plan §6).
- Counter, After Hours scenes, the DJ, slabs, the Loupe: reuse.

**Retries:** edit first (R11). Rerolls stay inside the approved cap; log every discarded first try in `design/ai-assets.md` with the reason, as v2 did.
