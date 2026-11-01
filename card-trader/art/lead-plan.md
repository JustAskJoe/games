# Intergalactic Card Trader: lead art plan

© 2026 justaskjoe. All rights reserved.

status: draft
updated: 2026-10-31
camera: 2d
release_target: steam
style_fit: good
ship: 12
test: 2
skip: 1
hours_estimate: 35-45 (Prototype 1); 150-250 (first release)
money_estimate: $0 on Canva; about $20 (Prototype 1) and $50-100 (first release) on Gemini
team_needed: lead-artist, artist, ui-vector, tech-artist
team_later: headless-finals, marketing-artist, style-trainer

Written by the Lead Artist (`kit/agents/lead-artist.md`, JOB: plan), first run. It's a **draft** for the crew. Nobody has approved it, and the brief still lists "the art style for happy space Akihabara" as an open call. It follows the house rules in `kit/art/art-rules.md` (cited as R1, R2, …) and the release bar in `kit/art/art-team.md`.

Read with: `pitch/brief.md`, `art/art-direction.md` (drafted in the same PR), and the Oct 31 bake-off in Hunter's Card Trader session.

---

## 1. The look in one paragraph, and why it suits AI

**Bright cel-shaded "happy space Akihabara".** Flat color in bold bands, thick ink outlines, graffiti-pop energy, neon signs in alien scripts, a warm shop counter at the center of a busy market station. Warm and funny, never grim or cyberpunk (the brief's tone rule).

**Why it suits AI-only art:**
- **Flat color and bold outlines hide drift.** Small differences between generations disappear in a flat cel style far more than in painterly or realistic art.
- **The game's main object is a card held flat in front of you.** That's a still with code layers on top, which is what AI does best.
- **Customers stand at a counter and react.** They don't run or fight, so they never need frame-by-frame animation.
- **In the bake-off, Canva's quality in this style was great**, and the style anchor held.

**Where it fights AI (fix these early):**
1. **Alien scripts are everywhere,** and reading them is a mechanic. Image models can't make a consistent invented alphabet (R1).
2. **The Loupe needs every copy of a card to look slightly different:** wear, centering, holo, fakes. That can't be baked into one image.
3. **The brief's PC version is first person,** with customers close to the camera. That's hero 3D, the weakest area for AI ([section 4](#4-limits-were-accepting)).
4. **Several in-world card games, each with its own look,** means several sub-styles inside one game. That's a lot of room for drift.

## 2. Asset types: ship / test / skip

Counts are for **Prototype 1** (brief: 2 species, 2 card games of about 20 cards each, 4 sellers, 4 buyers, 2 graders). "First release" is a guess (4 card games, 6 species) to size the work.

| # | Asset type | Proto 1 | First release (guess) | Tier | Who makes it | Why |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Card illustrations (the art window only) | 40 | ~240 | ✅ ship | Artist (Canva, style + set anchors) | Stills in a flat style; one batch per in-world game (R5) |
| 2 | Card frames, backs, rarity marks per in-world game | 2 sets | 4 sets | ✅ ship | UI & Vector Designer (SVG) | Crisp, editable, never confused with real card games' frames (R2, R17) |
| 3 | Alien scripts: a glyph alphabet per species, used on cards, signs and packs | 2 | 6 | ✅ ship | UI & Vector Designer (SVG glyph sets the game renders) | The decode mechanic needs real, repeatable letters (R1, proposed P4) |
| 4 | Card condition and fakes: wear, scratches, edge whitening, centering, holo, "wrong star light" glow, wrong card stock | 1 system | 1 system | ✅ ship | Tech Artist (shaders / SVG filters, seeded per card copy) | One illustration becomes endless copies, each one different; fakes are parameter swaps (proposed P5) |
| 5 | Customer portraits: species × regulars × 3 or 4 expressions | ~24 | ~90 | ✅ ship | Artist (one character anchor per regular, R3 / R6) | Expression swaps, no frames |
| 6 | Customer motion: slide in, idle bob, lean, react, leave | code | code | ✅ ship | Tech Artist (cut-out tweens) | No drift because it's one drawing moved around |
| 7 | Backgrounds: shop counter view, station strip, grader's office, rival shop | 2 | 8 | ✅ ship | Artist; signage added later as SVG neon | Calm area for UI (proposed P1); signs come from #3, not the model (R1) |
| 8 | UI: price tags, haggle meter, dock board, grader results, Loupe HUD, rent | 1 kit | 1 kit | ✅ ship | UI & Vector Designer | R2 |
| 9 | Grade Day reveal: slab, shine sweep, grade stamp, confetti, screen shake | code | code | ✅ ship | Tech Artist | The clip moment; VFX as code |
| 10 | Sealed product: booster packs, boxes, vending machine | 4 | ~20 | ✅ ship | Artist (blank packaging) + UI & Vector (labels in glyph scripts) | Labels are text (R1) |
| 11 | Logo and title | 1 | 1 | ✅ ship | UI & Vector Designer (licensed font) | R2 |
| 12 | Store art, screenshots, trailer | — | 1 set | ✅ ship | Marketing Artist (later) | Capsules from key art; trailer from real gameplay |
| 13 | Frame-by-frame customer walk cycles | — | — | 🧪 test | — | Drift and foot sliding; use #6 instead |
| 14 | 3D shop interior props (only if PC stays first person) | — | ? | 🧪 test | 3D Kitbasher (later) | Works with a toon shader, but it's a big new pipeline |
| 15 | 3D customers close up at the counter (first person) | — | — | ❌ skip | — | Hero 3D up close: not doable AI-only today |

**Totals:** 12 ship, 2 test, 1 skip. Prototype 1 is about **70 kept images** (40 cards, ~24 portraits, 2 backgrounds, 4 packs, 1 key art), plus vector and code work.

## 3. Risks (top 5), each with a fix or a fallback

1. **Looking like a real card game, or like our inspirations.**
   - Card frames, backs and rarity marks are our own SVG designs, never generated, and never echo real TCG frames, logos or card backs (R17).
   - Prompts never name a franchise. That includes the style inspiration: describe the cel-shaded graffiti look in our own words, don't name the game it comes from.
   - Every review checks against the reference game too (brief risk 1).
2. **Drift across many sub-styles and hundreds of cards.**
   - Two levels of anchors: one **world style anchor**, plus one **set anchor per in-world card game** (its own palette and motif inside the world style).
   - Batch one set at a time (R5), then the shared finishing pass (R7).
   - Fallback: Style Trainer (a custom model trained on our approved set) once there are 50+ approved cards.
3. **Scripts and signage.**
   - Models will invent garbled pseudo-letters that change in every image.
   - Fix: species alphabets as SVG glyph sets, drawn once and rendered by the game on cards, signs and packs. Learning a language can then literally decode the station's signs, which is a free gameplay bonus.
4. **The Loupe needs variation and performance.**
   - Condition, holo and fake tells as code layers (#4) solve the variation.
   - The risk is shader cost on a mid-range phone. Test the holo and "star light" filters on a real device in Prototype 1 (R8).
5. **The PC version's first-person 3D.**
   - This is the one place the brief points AI-only art at its weakest spot.
   - Fix: release on a **2.5D counter view**: a lit, tiltable 3D card in your hands, with 2D cut-out customers and backgrounds.
   - Fallback: if first person is a must, the customers become a paid human 3D job, and the game is no longer AI-only.

## 4. Limits we're accepting

- Customers move by tweening (slide, bob, lean, expression swap), not frame-by-frame animation.
- No cutscenes; story beats are dialogue at the counter.
- No full first-person 3D shop in an AI-only release ([risk 5](#3-risks-top-5-each-with-a-fix-or-a-fallback)).
- Steam shows the AI disclosure. Card illustrations, portraits, backgrounds and packs are listed in `design/ai-assets.md`. The frames, glyph sets, UI and code layers are made by Claude as vector and code; listed too, to be safe (R18).
- Raw AI card illustrations have weak copyright. What's clearly ours: frames, scripts, condition system, UI and any human edits (recorded in the manifest).

## 5. Suggestions: design changes that make the art cheaper or safer

1. **Condition is a system, not art.** One illustration per card, and every copy gets a seeded wear, centering and holo roll. That cuts hundreds of images and makes the Loupe deeper.
2. **Fakes are layer swaps:** wrong holo pattern, ink that glows wrong under one star's light, card stock from the wrong world. Each is a parameter the Tech Artist exposes. New Loupe filters (upgrades in the brief) reveal different layers.
3. **The counter view is the game on every platform.** Keep the phone prototype's flat counter for Steam too, with a 2.5D card in hand.
4. **Species read by silhouette** (R9): give each species a distinct outline family (tall and thin, round, many-armed …) so 2D portraits read at a glance, even small.
5. **Illustrate subjects on plain backgrounds,** then composite them into the card's art window. That makes cut-outs clean (R15) and lets frames change without re-generating.
6. **Neon signs in our glyph fonts** with a glow shader, layered over calm backgrounds (proposed P1). Signs become translatable, and the backgrounds stay reusable.
7. **One background kit, many rooms:** the rival shop and the grader's office reuse the counter-view layout with new props and palette.
8. **Start the art with two in-world card games,** as the brief says, and prove the set-anchor method before adding a third.

## 6. Team

**Now** (no new money):
- **Lead Artist:** this plan; anchors and set anchors; drift reviews before each `Pick:`.
- **Artist:** card illustrations, portraits, backgrounds and packs from the manifest, with anchors (Canva).
- **UI & Vector Designer:** card frames, glyph alphabets, UI kit, logo.
- **Tech Artist:** the condition and fakes system, customer tweens, the Grade Day reveal, the finishing pass, phone performance.
- **Asset Wrangler scripts:** manifest, fetch, WebP, `ai-assets.md`.

**Later, with the trigger:**
- **Headless Finals:** Prototype 1's ~70 images already pass the ~30-asset trigger. Canva plus the browser fetch can carry Prototype 1. Move before production of the first release (~360 images). Needs Hunter: the Gemini key and a monthly cap.
- **Style Trainer:** if set anchors don't hold drift past ~50 approved cards per in-world game.
- **Marketing Artist:** when the Steam page is set up.
- **3D Kitbasher:** only if the crew keeps first person for PC (then budget risk 5's human 3D job too).
- **Not needed:** Animator (no frame animation), Art QA (until two games are in production).

## 7. Hours and money

Scaled from `kit/art/pipeline-upgrade.md` §6: about 4 tries per kept image; money at Nano Banana 2 1K standard ($0.067, checked on Google's pricing page; batch is half). On Canva it's $0 and plan credits. **Hours are estimates, not measured.**

| | Prototype 1 | First release (guess) |
| --- | --- | --- |
| Kept images | ~70 | ~360 |
| Generations | ~280 | ~1,440 |
| Money on Canva | $0 (plan credits) | $0 (plan credits) |
| Money on Gemini | ~$19 | ~$97 (~$49 batch) |
| Studio hours | 35–45 | 150–250 |

**Where the Prototype 1 hours go:**

| Work | Hours |
| --- | --- |
| Anchors and set anchors | 4 |
| Cards | 8 |
| Portraits | 5 |
| Backgrounds and packs | 3 |
| Reviewing Claude's frames, glyphs and UI | 6 |
| Condition layers, tuning on a phone | 6 |
| Finishing pass and manifest | 4 |
| Reviews and picks | 4 |

## 8. Legal flags (for the legal reviewer)

- **Canva:** card illustrations would ship as raw image files inside the build. Is that "standalone / as-is" under Canva's AI Product Terms? This decides Canva versus Gemini for release (`pipeline-upgrade.md` §7).
- **Real card game IP:** frames, card backs and rarity symbols must not echo real TCGs, and our grading slabs and labels must not echo real grading companies'. Please give the frame and slab designs a 🟢/🟡/🔴.
- **Inspirations:** the reference shop sim, the cel-shaded game the style draws on, and the real Akihabara are inspiration only. No names, characters or signage from any of them.
- **Steam disclosure text:** generated from the manifest at release (R18).

## 9. Decisions for the game's owner

- [ ] Approve the look: bright cel-shaded "happy space Akihabara" (sections 1 and 5), and the bake-off key art as the **world style anchor**. Its file is on Hunter's unpushed `hunter/card-trader-v1` branch; commit it to `art/anchors/style-01.webp`.
- [ ] Release on a **2.5D counter view** (AI-only friendly), or keep **first person** for PC (needs a human 3D budget)?
- [ ] OK **glyph alphabets as SVG** for alien scripts, rendered by the game (no generated lettering anywhere)?
- [ ] OK **card condition and fakes as a code system** (one illustration per card, seeded copies)?
- [ ] Name the two in-world card games for Prototype 1, so each gets a set anchor.
- [ ] Canva or Gemini for release volume (after the legal reviewer's Canva answer)?
- [ ] Adopt proposed rules P1 (room for UI), P4 (invented scripts are text) and P5 (if the player inspects it, it's a layer) in `kit/art/art-rules.md`?
