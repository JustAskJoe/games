# Intergalactic Card Trader: v2 shot list

© 2026 justaskjoe. All rights reserved.

status: approved
updated: 2026-11-01
generations: 12 (first tries)

For the Artist (`kit/agents/artist.md`), from the Lead Artist's v2 addendum (`art/lead-plan-v2.md`). **Approved by Hunter on Nov 1, 2026: go.** Rules from `kit/art/art-rules.md`.

## How to run it

- **Tool:** Canva `generate-image`, on plan credits.
- **Prompt order** (house recipe, `art-direction.md`): style lead first, then the subject, then the palette, then the closing line. The light line is inside the style lead (R22).
- **References:** pass every listed Canva media id as its own `imageReferences` entry (R3).
- **Batches:** Canva throttles after about 8 jobs, and cooldowns grow through a session (L3, L11). Run at most 6 at once (R16). Wait at least 10 minutes between batches, or start a new session.
- **Every job:** save the media id the moment it returns (R13). Fetch full size with `kit/art/fetch-canva.js`, never the thumbnail.
- **Every keeper:** the finishing pass (R7), the phone check at real size (R8), hands and faces at 100% (R12), the look-alike check (R17), stray text check (R1), then a row in `design/ai-assets.md` with media id, references and prompt (R18, R23).
- **Near-misses:** edit or inpaint first, don't reroll (R11).
- **Prompts never use the characters' names.** They describe them.

**Anchors (Canva media ids):**

| Anchor | Id |
|---|---|
| Key art, world style anchor | MAHZoSFZr5A |
| Pearla, Mollu anchor | MAHZoTKOwDs |
| Zekk lineup | MAHZohkB4CA |
| Puffi lineup | MAHZolQj-xw |
| Shellstorm sheet | MAHZoUVyiLc |
| Hive Gambit sheet | MAHZoUR6gGc |
| Starweave sheet | MAHZoa9wZjw |
| Card Night scene | MAHZou2pcSA |
| Docking bay scene | MAHZoX9kvyk |

**Style lead** (first in every prompt, written out in full below):
> 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim.

**Closing line** (last in every prompt):
> Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.

---

## Batch A: new characters (3 jobs)

Review all three for look-alikes (R17) before Batch B. If one drifts, redo it as a pair with an existing regular and crop only the new one (lead plan v2 §4).

### 1. `p-skrimp.webp`: Skrimp, the scalper (Zekk)
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A single Zekk character standing alone, front-facing, full body, neutral pose and neutral expression, plain background, the same species and framing as the reference lineup: a lanky four-armed beetle-folk with a round glossy shell back and short antennae, slim arms, not muscular, oversized chunky sneakers, a too-big puffer vest covered in pockets, a narrow tinted visor, all four arms hugging tall stacks of blank sealed card packs and small blank boxes. No skates, no headphones. Palette: lime #A6F01E shell with ink #120A1F lines, orange #FF7A1A vest, sun #FFD21F sneakers, cyan #19D3F0 visor, plain paper #FFF6E3 background. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** SQUARE_1_1
- **References:** MAHZoSFZr5A, MAHZohkB4CA
- **Use:** crop to the 290 px portrait box, center top, like v1's `p-*.webp`. WebP (R14). Check the pack stacks have no lettering (R1).

### 2. `p-glyphsmith.webp`: the Glyphsmith courier (Mollu)
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A single Mollu character standing alone, front-facing, full body, neutral pose and neutral expression, plain background, the same species and framing as the reference character: a tidy snail-folk courier with a big pearly spiral shell, a delivery satchel strapped across the shell, a short knitted scarf, soft round eyestalks and an open friendly face, holding a small sealed blank parcel, a jeweler's loupe hanging on a cord, fingertips stained with dark ink. No hood, no cloak, no mask. Palette: pearl paper #FFF6E3 shell with mint #4CF2B5 and violet #6A2BD9 accents, magenta #FF2E93 scarf, ink #120A1F lines, plain paper #FFF6E3 background. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** SQUARE_1_1
- **References:** MAHZoSFZr5A, MAHZoTKOwDs
- **Use:** crop to the portrait box, center top. WebP. Check the satchel and parcel for stray glyphs (R1, R24): the Glyphsmiths' "script" is code only.

### 3. `p-hypebros.webp`: the Hype Bros (Puffi duo)
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. Two Puffi characters floating close together side by side, front-facing, neutral pose and neutral expressions, plain background, the same species and framing as the reference lineup: two fluffball brothers with huge eyes, one tall and oval, one small and round, wearing matching sporty zip jackets in two colorways, star-shaped sunglasses pushed up on their fluff, each holding up one blank shiny foil card in a clear sleeve. No caps, no mustaches. Palette: cyan #19D3F0 fur and mint #4CF2B5 fur, sun #FFD21F and violet #6A2BD9 jackets, coral #FF6B6B shades, ink #120A1F lines, plain paper #FFF6E3 background. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** SQUARE_1_1
- **References:** MAHZoSFZr5A, MAHZolQj-xw
- **Use:** one portrait with both Bros, cropped center top to the portrait box. Both faces must read at 290 px (R8). WebP.

**Cooldown: at least 10 minutes.**

---

## Batch B: cards (6 jobs, one sitting, R5)

Run shot 4 with shots 5 to 7. Look at shot 4 before shots 8 and 9: if its two panels melt into one scene, redo all full-arts as single PORTRAIT_2_3 images (one creature each).

### 4. `full-shell.jpg`: Shellstorm full-art pair
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. Two separate full-bleed trading card illustrations side by side for the Shellstorm card game, each on its own tall portrait panel with a thin plain gap between them, no frames and no borders, each creature the same design as in the reference card sheet. Left panel: the tide queen rising from a glowing tide pool, her world filling the panel edge to edge. Right panel: the maelstrom tortoise swimming out of a swirling whirlpool. In each panel the creature's head and main shape sit in the upper half; the lower 40% is calm and simple, soft gradient water and halftone, no faces or detail there. Set palette: pink #FF8FC7 and teal #19C8D8, with ink #120A1F lines and sun #FFD21F highlights. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** LANDSCAPE_4_3
- **References:** MAHZoSFZr5A, MAHZoUVyiLc
- **Use:** two full-arts. Code uses `background-size: 200% auto` with position 0% or 100%, trims about 7% of height to fit 5:7, and draws the full-art frame, name bar and marks on top (lead plan v2 §3 safe areas).

### 5. `cards-shell-alt.jpg`: Shellstorm alt-art sheet
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A 2×2 sheet of four separate trading card illustrations for the Shellstorm card game, each subject centered on its own plain panel with space between panels and a clear margin inside each panel. The same four creatures as the reference card sheet, in the same panel positions, each in a new pose and a new moment: top left, the kelp sprite asleep in a kelp hammock; top right, the lantern eel lighting a path through a sunken reef at night; bottom left, the maelstrom tortoise seen from above, resting in a calm lagoon; bottom right, the tide queen on a coral throne at low tide. Set palette: pink #FF8FC7 and teal #19C8D8, with violet #6A2BD9 night tones. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** SQUARE_1_1
- **References:** MAHZoSFZr5A, MAHZoUVyiLc
- **Use:** cut exactly like `cards-shell.jpg` (2×2, `background-size: 200% 200%`). Panel N is the alt-art of v1 panel N.

### 6. `cards-hive-alt.jpg`: Hive Gambit alt-art sheet
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A 2×2 sheet of four separate trading card illustrations for the Hive Gambit card game, each subject centered on its own plain panel with space between panels and a clear margin inside each panel. The same four creatures as the reference card sheet, in the same panel positions, each in a new pose and a new moment: top left, the drone bee carrying a glowing pollen crate; top right, the mantis knight bowing in salute; bottom left, the hornet mech diving through clouds; bottom right, the queen mech resting on a honeycomb tower at night. Set palette: lime #A6F01E and near-black #1A1A1A, with sun #FFD21F glow. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** SQUARE_1_1
- **References:** MAHZoSFZr5A, MAHZoUR6gGc
- **Use:** cut like `cards-hive.jpg`.

### 7. `cards-star-alt.jpg`: Starweave alt-art sheet
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A 2×2 sheet of four separate trading card illustrations for the Starweave card game, each subject centered on its own plain panel with space between panels and a clear margin inside each panel. The same four creatures as the reference card sheet, in the same panel positions, each in a new pose and a new moment: top left, the star puff curled asleep on a small moon; top right, the aurora koi leaping through ribbons of aurora; bottom left, the eclipse lion lying calm on a bank of clouds; bottom right, the celestial weaver stitching a net of stars. Set palette: purple #8B5CF6 and gold #FFD21F, with cyan #19D3F0 starlight. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** SQUARE_1_1
- **References:** MAHZoSFZr5A, MAHZoa9wZjw
- **Use:** cut like `cards-star.jpg`. Look-alike check on the lion (no cliff-top roar pose, R17).

### 8. `full-hive.jpg`: Hive Gambit full-art pair
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. Two separate full-bleed trading card illustrations side by side for the Hive Gambit card game, each on its own tall portrait panel with a thin plain gap between them, no frames and no borders, each creature the same design as in the reference card sheet. Left panel: the queen mech standing tall before a glowing honeycomb wall, her world filling the panel edge to edge. Right panel: the hornet mech hovering with its wings a blur. In each panel the creature's head and main shape sit in the upper half; the lower 40% is calm and simple, soft gradient and halftone, no faces or detail there. Set palette: lime #A6F01E and near-black #1A1A1A, with sun #FFD21F highlights. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** LANDSCAPE_4_3
- **References:** MAHZoSFZr5A, MAHZoUR6gGc
- **Use:** as shot 4.

### 9. `full-star.jpg`: Starweave full-art pair
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. Two separate full-bleed trading card illustrations side by side for the Starweave card game, each on its own tall portrait panel with a thin plain gap between them, no frames and no borders, each creature the same design as in the reference card sheet. Left panel: the celestial weaver floating in a web of constellations, her world filling the panel edge to edge. Right panel: the eclipse lion walking calmly across a ring of light. In each panel the creature's head and main shape sit in the upper half; the lower 40% is calm and simple, soft gradient night sky and halftone, no faces or detail there. Set palette: purple #8B5CF6 and gold #FFD21F, with ink #120A1F lines. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** LANDSCAPE_4_3
- **References:** MAHZoSFZr5A, MAHZoa9wZjw
- **Use:** as shot 4.

**Cooldown: start a new session, or wait until Canva stops cooling down (R16 backoff).**

---

## Batch C: After Hours scenes (3 jobs)

The night screen covers the center with a big panel. Keep the center calm; put the interest at the edges and top (R21).

### 10. `release.jpg`: Release Day crowd (day 5 morning)
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. Wide view of a small card shop stall's front on a busy market strip on launch morning, a long happy line of small customers snaking along the strip: snail-folk with pearly shells, four-armed beetle-folk in sneakers and floating fluffballs with huge eyes, some holding snacks, blank banners and blank bunting overhead, stacked blank product boxes in the window. The middle of the picture is open street floor, calm and simple. Palette: magenta #FF2E93, cyan #19D3F0, sun #FFD21F, violet #6A2BD9 and night #1B0E33 shadows, ink #120A1F lines. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** LANDSCAPE_16_9
- **References:** MAHZoSFZr5A
- **Use:** day 5 morning background, full 1680 × 944. Code draws the "Wave 3" banner text and the queue counter. Zoom check every banner and box for stray letters (R1, L0).

### 11. `auction.jpg`: Dock Auction
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A cargo dock at night, one big sturdy unlabeled cargo crate on a pallet under a single warm spotlight at the right of the picture, a small round auction podium at the left, docked ships glowing through the big windows behind, open dock floor in the middle, calm and empty, with room for two bidders to stand left and right. Palette: night #1B0E33 and violet #6A2BD9, orange #FF7A1A spotlight, cyan #19D3F0 window glow, ink #120A1F lines. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** LANDSCAPE_16_9
- **References:** MAHZoSFZr5A, MAHZoX9kvyk
- **Use:** Dock Auction background. Code draws the crate's glyph label, the 3 clues, the bids and the two rival portraits (existing regulars) on top.

### 12. `tournament.jpg`: Tournament Night
- **Prompt:** 2D cel-shaded game illustration in a street-graffiti style: thick clean ink outlines, flat bold color, halftone dots and spray-paint drips, a joyful sci-fi market station full of neon, snacks and card shops, warm overhead lamp light with cool starlight rim. A cozy card shop after closing, set up for a tournament: long tables along the sides with small snail-folk, four-armed beetle-folk and fluffball players facing each other over play mats, cards flat on the mats, snacks and drinks, a raised prize stand at the back with an empty glass display case, string lights overhead, a calm open floor in the middle. Cards lie flat; nothing rises off them. Palette: violet #6A2BD9 and night #1B0E33, magenta #FF2E93 and lime #A6F01E neon, sun #FFD21F lamps, ink #120A1F lines. Original designs, not resembling any existing franchise or trading card game. No text, no letters, no numbers, no signage.
- **Aspect:** LANDSCAPE_16_9
- **References:** MAHZoSFZr5A, MAHZou2pcSA
- **Use:** Tournament Night background. Code draws the bracket board, the prize card in the case, and the entrant count.

---

## Not on this list (code or reuse)

- Bulk Dig: `shop.jpg` with a night tint and code card backs.
- Swap Meet: `cardnight.jpg` with three existing portraits.
- Mirror foil, stamps, serials, misprints, set symbols, signatures, promo crests, the full-art frame: code (lead plan v2 §2).
- Expressions: code reactions; a Pearla pilot only after the playtest.

**Retries:** if a shot misses, edit it first (R11). Rerolls go in a Batch D in a later session, at most 6 jobs.
