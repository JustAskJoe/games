# Moonwort & Co.: lead art plan

© 2026 justaskjoe. All rights reserved.

status: draft
updated: 2026-11-02
camera: 2d               # recommended; the brief said painterly 3D (decision 2 below)
release_target: mobile   # premium phone first; Pico MR is an optional bonus room
style_fit: good          # for painterly 2D; it would be "poor" for painterly 3D
ship: 16
test: 3
skip: 2
hours_estimate: 15-25 (Prototype 1, all code) · 130-210 (launch art)
money_estimate: $0 for Prototype 1 and concepts · about $20-60 on Gemini for launch finals (not re-checked today)
team_needed: lead-artist, ui-vector, artist (concepts only until Prototype 1 passes)
team_later: tech-artist, headless-finals, marketing-artist, 3d-kitbasher (only if the MR room goes ahead)

Written by the Lead Artist (`kit/agents/lead-artist.md`, JOB: plan), first run for this game, on Nov 2, 2026. It follows the house rules in `kit/art/art-rules.md` (cited as R1, R2, …), the lessons in `kit/art/lessons.md` (L1, L2, …) and the release bar in `kit/art/art-team.md`. It reflects the calls Hunter made in chat on Nov 2, 2026 (listed below). **Nothing here is approved until a person ticks the decisions in [section 9](#9-decisions-for-hunter) and changes `status:` to `approved`.** The draft look is in `art/art-direction.md`.

**Hunter's calls on Nov 2, 2026 that this plan builds on:**
- **Prototype 1 is a 2D phone-first web build**, not a 3D greybox: 3 in-game days, 20 ingredients, all art drawn in code / SVG placeholders. **No image-model art in the prototype.** (The brief said one day, 10 ingredients and greybox 3D; this replaces that.)
- **The familiar picks you:** the player's familiar (cat, toad or crow, maybe more) is chosen by a short personality quiz.
- **Lore comes from public-domain and public sources, with citations:** Culpeper's *Complete Herbal* (1653), NCCIH *Herbs at a Glance*, Kew POWO and USDA PLANTS for plant names, and the 1909 Waite–Smith tarot plus Waite's *Pictorial Key to the Tarot* for tarot **structure**.
- **Ingredient cards are tarot-style:** frames and text are vector (R2). Art Nouveau gold frames, painterly 2D-friendly art, a sister look to Trickbound, but never Trickbound's style lead (R4).
- **Art timing:** free concepts can run during Prototype 1 to settle a style anchor. Paid finals only after Prototype 1 passes its pass bar.

---

## 1. The look, and why it suits AI

**Candle-lit painterly apothecary, seen as a storybook in 2D.** A little shop at the edge of Little Hollow: warm candle and hearth light, plum night at the windows, moss and herbs everywhere, beeswax-gold Art Nouveau frames around tarot-style ingredient cards. Warm, curious, tactile. The full look is drafted in `art/art-direction.md`.

**Recommendation: make the full game painterly 2D, not painterly 3D** (decision 2). The brief asked for painterly 3D; Prototype 1 is already 2D, and 2D is the cheaper and safer path for AI-only art:
- **What the player looks at most is flat already:** cards, portraits, jars on a shelf, a workbench seen from above. These are stills, which AI does well (L1, L10).
- **Painterly 3D is the hardest thing on the AI-only list.** Hand-painted textures on 3D models, villagers seen up close and a hero shop interior all fall under ❌ "hero 3D characters seen up close" (R10). AI 3D meshes today are 🧪 for props only (`kit/art/art-team.md`, 3D Kitbasher).
- **2D keeps the gestures:** circle to grind, drag to pour, tilt to stir and tap to cork all work on a painted 2D workbench with code motion (Tech Artist). They don't need 3D.
- **The cost:** 2D loses real depth in the Pico MR room. The fix is a "paper theater" room: painted 2D panels and cards placed in 3D space (row 19, 🧪). If MR proves itself, a 3D Kitbasher adds simple stylized props later.

**Where it fits AI well:**
1. **Ingredient and ritual cards are stills in a frame.** Paint them as 2×2 sheets with an anchor, crop in code (L10, proposed R26), and the frame, name, traits and lore text are vector (R1, R2).
2. **Villagers and the familiar talk, they don't walk.** Portraits with expression swaps and a code bob, like Card Trader's customers.
3. **Painterly texture hides small drift** better than clean vector or pixel art.

**Where it fights AI (watch these):**
1. **Botanical accuracy.** Models invent plants: wrong leaf shapes, extra petals, a foxglove that's half comfrey. The Hedge Witch audience will notice, and some real herbs have toxic look-alikes. This is the biggest risk for this game ([section 3](#3-risks-top-5-each-with-a-fix-or-a-fallback)).
2. **Tarot imagery pulls toward the 1909 Waite–Smith pictures,** which every model has seen thousands of times. We take the deck's *structure* only, never its compositions (R17).
3. **The sister look to Trickbound.** Both games use plum darks, lamplight and Art Nouveau cards. Trickbound's style lead and props must never leak in (R4); `art-direction.md` sets a different frame grammar and subject matter.
4. **Familiars drift toward famous animal characters** (black cats and crows especially). Look-alike check on each (R17, L9).
5. **"Witchy" art can slide into real sacred or closed-practice symbols.** We stay with plants, moons, seasons and folk craft.

## 2. Asset types: ship / test / skip

"Prototype 1" is the build Hunter approved today: all code / SVG, no image-model art. "Launch" uses the brief's targets: 40 ingredients, about 60 brews, 12 villagers, about 40 ritual cards, 5 forage spots, 4 seasons with a festival each, a garden of 3 to 12 beds.

| # | Asset type | Prototype 1 | Launch | Tier | Who makes it | How |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Ingredient card illustrations | 20 SVG plant silhouettes | 40 | ✅ ship | Artist (finals) | 2×2 sheets with the style anchor plus a botanical brief per plant (key features from POWO / USDA); person checks accuracy before `Pick:` (R3, R5, R12-style zoom check) |
| 2 | Card frames: ingredient, ritual, familiar, grimoire page | 1 SVG frame | 4 frame families | ✅ ship | UI & Vector Designer | Art Nouveau gold SVG in our own frame grammar (R2, R4); tarot proportions |
| 3 | Card text: names, Latin names, traits, lore, citations | in code | in code | ✅ ship | UI & Vector Designer | The game renders it with real fonts (R1). Citations always on the card back or grimoire page |
| 4 | Trait and process icons (warming, cooling, calming, brightening, drying, soothing; steep, grind, dry, infuse, distill, moon) | SVG | 1 set | ✅ ship | UI & Vector Designer | One grid, shape first then color (R9) |
| 5 | Ritual / daily cards | SVG placeholder (3 days) | ~40 | ✅ ship | Artist | 2×2 sheets; Waite–Smith structure only, our own pictures (R17) |
| 6 | Familiars: cat, toad, crow (more later) | 3 SVG figures × 3 expressions | 3 × 4 expressions | ✅ ship | Artist + Tech Artist | One neutral character anchor each (R3, R6), painted as one lineup (L10); expression swaps and code bob |
| 7 | Familiar quiz: question screens and "the familiar picks you" reveal card | SVG + code | 1 flow | ✅ ship | UI & Vector Designer | Reveal uses the familiar frame (#2) over the familiar's portrait (#6) |
| 8 | Villager portraits | SVG silhouettes × 3 expressions | 12 × 3–4 expressions | ✅ ship | Artist + Tech Artist | Lineups of 3, cropped in code (L10); one anchor per villager (R3, R6); look-alike check (R17) |
| 9 | Scenes: shop counter, workbench, garden, title key art | layered SVG | 4 | ✅ ship | Artist | Calm area for cards and dialogue (R21); one light direction (R22); signage in code (R1) |
| 10 | Forage spots | 1 SVG spot | 5 | ✅ ship | Artist | Same scene kit as #9 |
| 11 | Time of day, moon phase, seasons, festival dressing | code tint + SVG moon | 4 seasons, 4 festivals | ✅ ship | Tech Artist (+ Artist for a few festival props) | Code lighting and palette shifts over one painting per scene, not 4 repaints; moon phase drawn in code from the real date |
| 12 | Brews and jars (~60) | SVG jar + code liquid | ~60 | ✅ ship | UI & Vector Designer | 6–8 vector bottle shapes × code liquid color, glow and cork; labels in code (R1, R25) |
| 13 | Garden beds and growth stages | SVG | 3–12 beds | ✅ ship | UI & Vector Designer + Tech Artist | Generic sprout and leafy stages in SVG; the mature plant reuses its card painting crop |
| 14 | Workbench tools: mortar and pestle, kettle, still, moon dish, corks | SVG | ~8 | ✅ ship | Artist (cut-outs) + Tech Artist (motion) | Painted on a plain background, cut out and checked on light and dark (L5, R15); gestures animate them in code |
| 15 | VFX: steam, grind dust, sparkle, candle flicker, dud hiccups | code | ~12 | ✅ ship | Tech Artist | Code particles; reusable `kit/snippets/game-front-end/` where it fits |
| 16 | UI kit, logo and title | SVG/CSS | 1 kit | ✅ ship | UI & Vector Designer | R2; logo from an OFL font (license file kept) |
| 17 | Shop decor that fills the shelves | — | ~20–30 | 🧪 test | Artist | Paint in sheets and cut in code; test that a mixed shelf still reads as one set before it ships |
| 18 | Frame-by-frame familiar animation (a cat walking the shelf) | — | — | 🧪 test | — | Drift and foot sliding; use #6's code motion |
| 19 | Pico MR "paper theater" room: painted panels and cards in 3D space | — | 1 room | 🧪 test | Tech Artist (+ 3D Kitbasher later) | Only after the phone game passes; flat painted planes first |
| 20 | Painterly 3D shop or villagers up close | — | — | ❌ skip | — | Hero 3D up close isn't doable AI-only today (R10); see decision 2 |
| 21 | Reproducing or tracing the Waite–Smith cards or old herbal plates | — | — | ❌ skip | — | Original only (R17). Old plates are lore sources, not art sources |

**Totals:** 16 ship, 3 test, 2 skip.

### Prototype 1 rules (now)
- **No image-model art in the build.** Everything is SVG/CSS drawn in code (Hunter, Nov 2, 2026). The prototype answers "is the brew fun?", not "is the art good?".
- **Placeholders match the final layout.** The SVG card's art window, the portrait box and the scene's calm area use the sizes in `art-direction.md`, so painted finals drop in later without a layout change.
- **One SVG language for placeholders:** flat palette shapes with one ink line weight and a soft candle glow. Simple, so testers judge the brewing, not the art.
- **Each plant keeps a recognizable silhouette** (leaf shape, flower head) even as a placeholder (R9), so recall of "one real plant fact" isn't hurt by a generic leaf.
- **Concepts run beside the build, not in it.** Free concept sheets for the style anchor go in `art/concepts/` as **ROUGH, not shipped** (R10), after this plan is approved (`art-team.md`: an approved lead plan before the first concepts run).

### The style-anchor concepts (during Prototype 1, free)
Three directions, each shown on the same four test subjects: **one ingredient card** (a common, easily checked plant, for example chamomile), **the shop counter at dusk**, **one villager**, and **the familiar trio as a lineup**.
- **A. Candle-lit gouache:** opaque painterly gouache, soft edges, warm candle glow. Risk: muddy at card size.
- **B. Ink and watercolor herbal plate:** fine ink line under transparent wash, like an old herbal but our own. Risk: reads cold, and drifts toward copying real plates.
- **C. Gold-leaf oil sketch:** richer painterly oil with gold-leaf accents. Risk: closest to Trickbound's oil-sketch places (R4).
- Uses Canva plan credits or Cloudflare roughs only ($0 money). The crew picks one direction on a phone (R8); its best image becomes the **style anchor** (R3). No finals until then.

## 3. Risks (top 5), each with a fix or a fallback

1. **Wrong plants.** A pretty but inaccurate herb breaks the "real lore" promise, and a wrong-looking toxic look-alike is a safety problem.
   - Every ingredient brief lists 3–5 identifying features (leaf shape and arrangement, flower color and form, stem) from POWO or USDA PLANTS, with the link.
   - A named person checks each plant illustration against its sources at 100% zoom before a `Pick:` (decision 9). Rejects are logged in `design/ai-assets.md`.
   - The game says plainly that illustrations are not for identification, and never gives wild-foraging instructions (brief, Risks).
   - Fallback: if a plant keeps failing, paint it stylized (a pressed-flower look) or let the card show the prepared ingredient (dried root, seeds in a dish) instead of the living plant.
2. **Tarot and old-plate copying.** Models reproduce the 1909 Waite–Smith pictures, and an herbal-plate style (direction B) invites near-copies of real plates.
   - Prompts never name the deck, an artist or a book (R17, tightened in `art-direction.md`). Describe our own scene for each card.
   - Look-alike check on every ritual card against the Waite–Smith card of the same meaning.
3. **Sister-look leak from Trickbound (R4).**
   - Moonwort's frames are botanical (stems, leaves, moon phases, beeswax gold on plum); Trickbound's are 1920s ironwork, etched-tin and playing-card. Never reuse Trickbound's frame SVGs, style lead, palette file or anchors.
   - Contact-sheet review checks for rail, snow, mining or ironwork motifs.
4. **Familiar and villager drift** (L2, L9).
   - One neutral character anchor each before any finals (R3, R6); paint the trio as one lineup (L10).
   - Look-alike check against famous cats, crows and toads (R17). Describe each by shape and markings unlike famous ones.
   - Each familiar added after launch costs an anchor, about 4 images and a quiz branch; plan them as content drops.
5. **Volume and money once finals start.** About 50 kept paintings is past the 30-asset trigger for Headless Finals (`art-team.md`), and Canva throttles (L11, L15).
   - Gemini for finals volume, with Hunter's OK and a monthly cap (R20). Style-guide-only line at the top of every Gemini prompt (L12), a second reference per scene (L14).
   - Canva for concepts and `remove-background` only. Its "standalone" terms question is still open for the legal reviewer (`pipeline-upgrade.md` §7.1).

## 4. Limits we're accepting

- **2D everywhere on the phone** (if decision 2 goes this way). Depth comes from layers, light and parallax, not models.
- Villagers and familiars move by code (bob, squash, slide, expression swap), not frame-by-frame animation.
- No cutscenes; story happens at the counter and in the grimoire.
- Brews are vector bottles with code liquid, not 60 paintings.
- Seasons and festivals change the light and add a few props; each scene is painted once.
- The MR room is flat painted panels in space until it earns a 3D kit.
- Store AI disclosure from `design/ai-assets.md` (R18), for Steam if it ever ships there and for any app-store AI rules (not researched yet).
- Raw AI paintings have weak copyright (`pipeline-upgrade.md` §7.2). Ours for sure: frames, icons, UI, the jar system, code effects, curated lore text and any human edits.

## 5. Suggestions

1. **Decide painterly 2D for the whole game now** (decision 2). Everything else in this plan gets cheaper and safer.
2. **Cards carry the plant; scenes carry the mood.** The detailed, checked botanical painting lives on the card; shelves, beds and baskets reuse crops of it, so each plant is painted (and checked) once.
3. **Show the prepared ingredient when the living plant is hard.** Dried roots, seeds and bark are easier to paint truthfully and fit an apothecary.
4. **Jars as a system, not paintings** (row 12): a handful of bottle shapes, liquid color from the brew's traits, a cork and a code label. The grimoire then shows every brew at no art cost.
5. **Trait colors double as UI language,** but always with a shape (R9): warming and cooling, calming and brightening, drying and soothing each get an icon shape that works without color.
6. **The familiar quiz reveal is a card,** using the familiar frame. It's the first thing a new player sees, so it gets the most polish.
7. **Moon phase in code from the real date,** one SVG moon with a mask, never a painted moon per phase.

## 6. Team

**Now** (no new money):
- **Lead Artist:** this plan and `art-direction.md`; the style-anchor concept review; drift, look-alike and plant-accuracy checks before each `Pick:`.
- **UI & Vector Designer** (role approved, agent file not written yet): Prototype 1's SVG is this role's work. Until its agent exists, the person building Prototype 1 draws the SVG with Claude, following this plan and `art-direction.md`.
- **Artist (Concepts only):** the three style-anchor directions above, after this plan is approved. No finals until Prototype 1 passes.

**Later, with the trigger:**
- **Tech Artist:** when Prototype 1 passes and a vertical slice starts (code motion, candle light, seasons, VFX, the finishing pass R7).
- **Artist (Finals):** when Prototype 1 passes its bar and the style anchor and character anchors are approved.
- **Headless Finals (Gemini):** at the start of finals (about 50 kept paintings is past the 30-asset trigger). Needs Hunter: key, cap.
- **Marketing Artist:** when there's a store page.
- **3D Kitbasher:** only if the Pico MR room goes past its 1-week spike and needs real props.
- **Not needed:** Animator, Style Trainer (unless drift holds past ~50 approved cards), Art QA.
- **Not an art role, but art depends on it:** a person to review plant accuracy and the lore (decision 9; the brief's "who reviews the Apothecary content").

## 7. Hours and money

Scaled from `kit/art/pipeline-upgrade.md` §6. About 4 tries per kept image; a 2×2 sheet or a lineup counts as one generation for 3–4 assets. **Hours are estimates, not measured.** Gemini at $0.067 per 1K image, batch about half: **checked by the studio on Oct 31, 2026, not re-checked on Google's page today.** Canva costs plan credits, not money. Freelance rates in the last row are third-party ranges from `pipeline-upgrade.md` §6, not quotes and not checked today.

| | Prototype 1 (now) | Style-anchor concepts | Launch finals (after the pass bar) |
| --- | --- | --- | --- |
| What | ~20 plant silhouettes, 1 frame, 3 familiars, villager silhouettes, shop and workbench SVG, icons, jars | 3 directions × 4 subjects | ~10 ingredient sheets, ~10 ritual sheets, ~4 familiar lineups, ~12 villager lineups, ~10 scenes and forage spots, ~5 tool and decor sheets: **about 50 kept paintings** |
| Money | $0 (Claude SVG) | $0 (Canva plan credits or Cloudflare roughs) | about $20–60 on Gemini (~200 tries plus fixes), or $0 on Canva if the legal reviewer clears it |
| Studio hours | 15–25 (inside the prototype's build time) | 4–8 | 130–210, including ~10–15 h of plant-accuracy review |
| With a freelance cleanup artist (option B) | — | — | add roughly 80–150 artist hours at $25–60/h (third-party range, not checked) |

## 8. Legal flags for the legal reviewer

**Not legal advice, and none of these was checked on the source's own page today.** Each needs a 🟢/🟡/🔴.
- **Waite–Smith tarot (1909):** generally treated as public domain in the US (published before 1930); in the UK and EU it depends on the illustrator's death date (1951), so it may only have entered the public domain there recently. Later recolored editions are separately copyrighted, and the "Rider-Waite" name is a trademark of its current publisher. We use the deck's structure only, never its pictures, its recoloring or the trademarked name.
- **Waite's *Pictorial Key to the Tarot* (1910) and Culpeper's *Complete Herbal* (1653):** public domain texts. Quote, paraphrase and cite. Culpeper contains medical claims that are wrong or unsafe today: never present them as advice (brief, Risks).
- **NCCIH *Herbs at a Glance*:** US federal government text is generally public domain, but photos on those pages may be credited to others. Cite the text; don't use the photos.
- **Kew POWO and USDA PLANTS:** names and data only. Check POWO's license and attribution terms; USDA PLANTS data is generally public domain, but some of its images are copyrighted. Don't use their photos as art references in prompts.
- **Plant illustrations and safety:** a "not for identification" line, and no wild-foraging instructions. Does the apothecary theme need a medical disclaimer for the store listing or rating?
- **Canva "standalone / as-is":** the same open question as Card Trader. It decides Canva versus Gemini for paid finals.
- **Sacred and closed practices:** art avoids real religious and closed-practice symbols; the legal and content reviewer confirms the list.

## 9. Decisions for Hunter

- [ ] **1. Approve or change this lead art plan** (then change `status:` to `approved`).
- [ ] **2. Full game camera:** painterly **2D** (recommended: cheaper and safer for AI-only art; Prototype 1 is already 2D) or painterly **3D** as the brief says. If 3D, this plan needs a rewrite and a 3D Kitbasher and likely a human artist.
- [ ] **3. Approve or change the draft `art/art-direction.md`:** the look, the palette hexes, the light direction and the frame grammar.
- [ ] **4. Run the free style-anchor concepts during Prototype 1** (3 directions × 4 subjects, Canva plan credits or Cloudflare, $0 money).
- [ ] **5. Familiars at launch:** cat, toad and crow (recommended), with more as later content, or more at launch (each extra one is an anchor, about 4 images and a quiz branch).
- [ ] **6. Brews as a vector jar system** with code liquid and labels, not ~60 paintings.
- [ ] **7. Seasons and festivals as code light** plus a few painted props, not 4 repaints of each scene.
- [ ] **8. Pico MR art:** a flat "paper theater" room test after the phone game passes, or no MR art until after phone launch.
- [ ] **9. Who checks plant accuracy and lore** on every ingredient illustration before a `Pick:` (a named person).
- [ ] **10. Finals source and budget, when Prototype 1 passes:** Canva or Gemini (after the legal reviewer's Canva answer), and a monthly Gemini cap (R20).
- [ ] **11. Send section 8 to the legal reviewer** before any paid finals.
