# Art house rules

© 2026 justaskjoe. All rights reserved.

The studio's rules for making game art with AI. They apply to every game and every art agent. A game's `art/art-direction.md` can add rules or tighten these, but never loosen them.

**Who owns this file:** people adopt rules; agents propose them. The Lead Artist (`kit/agents/lead-artist.md`) suggests new rules in pull requests, as **proposed**. A person changes a rule's status to **adopted** when they merge it. Where rules come from is in `lessons.md`.

**Each rule has:** what to do, why, how to check it, and where we learned it.

## Adopted

### Pictures and text

**R1. No text in generated images.** The image model paints the picture with no words in it; the game draws all text on top with a real font.
- *Why:* models misspell, small text turns to mush, baked-in text can't be fixed, translated or rebalanced without regenerating, and it blurs when resized.
- *Do:* end every prompt with "No text, no letters, no numbers." Card names, costs, buttons, prices, labels and the logo are drawn by the game or by Claude as SVG.
- *Check:* look for stray writing on signs, books, screens and clothing at 100% zoom. Remove it or cover it in cleanup; never ship it.
- *From:* `kit/art/README.md` house prompt; models "still sneak in signage".

**R2. Vector first.** UI, icons, card frames, logos, 9-slice panels and anything with text are drawn by Claude as SVG/CSS, not by an image model, unless the game's `art-direction.md` says otherwise.
- *Why:* image models are worst at crisp edges, consistent icon sets and text; Claude is best at them, and vector stays small, sharp and editable.
- *Check:* no raster UI frames or icons in a build without a note in `art-direction.md`.
- *From:* `pipeline-upgrade.md` §4.1.

### Consistency

**R3. Anchors on every call.** Every generation passes the game's approved style anchor, plus the character anchor for any character in the picture.
- *Why:* a style anchor alone keeps the look but characters drift (Oct 31 bake-off).
- *Check:* the manifest row lists the anchors used. No anchor approved yet means concepts only, no finals.
- *From:* lessons L1, L2.

**R4. One style lead per game, never borrowed.** Each game has one style lead in `art-direction.md`. Never carry one game's style, culture or props into another.
- *Why:* leftovers from one game turn up in another (Tilebound's pagodas on another game's island map).
- *Check:* contact-sheet review looks for other games' motifs.
- *From:* `kit/art/README.md`; `kit/agents/artist.md`.

**R5. Batch by category, in one sitting.** Make all of one category (all portraits, all cards of one set) together, with the same references and prompt skeleton.
- *Why:* drift creeps in between sessions more than within one.
- *Check:* the manifest shows one batch date per category; stragglers get re-checked against the set.

**R6. Character anchors are neutral.** A character anchor is front-facing, neutral pose and expression, full or three-quarter body, on a plain background.
- *Why:* a neutral anchor transfers to new poses and expressions; a dramatic one drags its pose into everything.

**R7. One finishing pass for everything.** Every shipped raster asset goes through the same post-processing (palette map, outline weight, grain or texture, halo clean, resize) before it's marked final.
- *Why:* a shared finish hides small differences between generations and makes a set read as one hand.
- *Check:* the manifest row is `final` only after `post.py` ran on it.
- *From:* `pipeline-upgrade.md` §8.1.

### Readability and size

**R8. Design at real size; check on a phone.** Judge every asset at the size it shows in game, on a real phone, before a `Pick:`.
- *Why:* detail that looks great at 1680 px turns to mush at 80 px.
- *Check:* concept sheets show real size and 3x (already in `artist.md`); finals PRs include a phone screenshot.

**R9. Silhouette first.** Every gameplay object must be identifiable by its silhouette alone at in-game size.
- *Why:* players read shapes before detail, especially mid-action.
- *From:* `tower-defense/art/art-direction.md`.

### Release bar

**R10. Ship / test / skip.** Release work uses only what the game's lead plan marks ✅ ship. Anything marked 🧪 test is labelled **ROUGH, not shipped**. Never make anything marked ❌ skip.
- *Today that means:* no AI frame-by-frame animation, no hero 3D characters seen up close, no cutscenes, no text in images.
- *From:* `art-team.md`.

**R11. Fix before you regenerate.** For a near-miss (hands, a face, a stray object), edit or inpaint it rather than rolling a new image.
- *Why:* a new roll changes everything else that was already right.

**R12. Hands and faces at 100%.** Key art, portraits and anything shown large get a full-zoom check of hands, eyes, teeth and fingers before a pick.

### Files

**R13. Never ship thumbnails.** Fetch full resolution (`kit/art/fetch-canva.js`), and save each tool's media id in the manifest the moment a job returns.
- *Why:* Canva's API returns 199×112 thumbnails; a lost media id means the image is gone.
- *From:* lesson L3.

**R14. WebP for builds, one master per asset.** Builds get WebP at the size `art-direction.md` names (2x where it says so). Keep one full-resolution master per final asset.
- *Why:* a 3 MB PNG became 170 KB as WebP with no visible loss.
- *From:* lesson L4.

**R15. Check cut-outs on light and dark.** After background removal, view every cut-out on a light and a dark background to catch halos.
- *From:* lesson L5.

**R16. Stay under the throttle.** At most 6 parallel Canva jobs. On "credit usage is cooling down", wait 60 seconds and double the wait each retry, up to 5 minutes.
- *Also:* cooldowns grow longer as a session goes on. Spread big jobs across sessions, or use Headless Finals (Gemini) for volume.
- *From:* lessons L3, L11.

### Rights and honesty

**R17. Original only.** Prompts say "Original design, not resembling any existing franchise." Never name a living artist, a studio or a franchise in a prompt. Reference art is for inspiration only: never copy, trace or reproduce it, and never commit it (links only).
- *Check:* every new character gets a look-alike check against famous franchise characters at review. Log rejects in `design/ai-assets.md`.
- *From:* `kit/art/README.md`; `kit/agents/artist.md`; `CLAUDE.md`. Lesson L9.

**R18. Log every AI file, and every human edit.** Every AI-made file gets a row in `design/ai-assets.md`. Every human change to it is noted in the manifest's `human_edit`.
- *Why:* Steam's AI disclosure, and copyright: human changes are the part that's ours.
- *From:* `CLAUDE.md`; `pipeline-upgrade.md` §7.

**R19. Don't strip provenance.** Never remove or try to defeat SynthID, C2PA or other provenance marks, and never present AI work as hand-made.

**R20. Money needs Hunter's OK.** Canva uses plan credits. Every other tool that costs money waits for Hunter's approval, per tool and per budget.

### Adopted Oct 31, 2026 (Hunter: "approve all")

**R21. Leave room for UI.** Backgrounds keep a calm area (no faces or busy detail) where the HUD and text sit, as marked in `art-direction.md`.
- *Why:* busy art under text fails R8 and makes R1's game-drawn text hard to read.

**R22. One light direction per game.** Each `art-direction.md` names the key light (for example "top-left, warm") and every prompt says it.
- *Why:* mixed light directions are the fastest giveaway that a set came from separate generations.

**R23. Record the recipe.** Each manifest row (or `design/ai-assets.md` row, until a game has a manifest) stores the tool's media id, the style references, and where possible the full prompt, seed and model, so a near-miss can be redone the same way.

**R24. Invented scripts are text (extends R1).** Alien alphabets, runes and made-up lettering follow R1: design each once as an SVG/code glyph set and let the game render it. Never let a model paint one.
- *Why:* models make a different garbled alphabet in every image, and when players decode a script, it has to be consistent.
- *From:* lesson L7 (Card Trader).

**R25. If the player inspects it, it's a layer.** Anything the player inspects, compares or tells apart in gameplay (wear, damage, holo, fakes, upgrade marks) is a code layer over a clean illustration, not painted in.
- *Why:* gameplay needs variation and control; one baked image per variant multiplies the art and can't be tuned.
- *From:* lesson L8 (Card Trader; v1 already works this way).

## Proposed

The Lead Artist adds proposals here, each with a lesson behind it. A person adopts, edits or deletes them in review.

**P6 → R26 if adopted. Paint groups, cut in code.** When several characters or cards must match (a species' regulars, one card set), paint them together in one picture (a lineup, a 2×2 sheet) and crop them apart in code.
- *Why:* one generation shares one light, palette and hand. Card Trader v1's lineups and card sheets held together, while a solo character drifted (Klik's first try came out grittier than the key art).
- *Check:* each crop still reads at portrait or card size (R8); leave enough space between figures to crop cleanly.
- *Status:* proposed Oct 31, 2026, from lesson L10 (Card Trader).
