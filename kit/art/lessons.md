# Art lessons

© 2026 justaskjoe. All rights reserved.

What we learned making art, for every game. This is how the studio's art rules (`art-rules.md`) get better. The Lead Artist adds entries; anyone can. Newest on top.

**How it works**
1. **Something happens:** a pick gets rejected, a set drifts, a tool surprises us, a review comment, a research note.
2. **Write it down here,** in the format below. Short: what happened, why, what we'd do next time.
3. **If the same lesson shows up twice** (twice in one game, or once in two games), or once if it cost real time or money, the Lead Artist **proposes a rule** in `art-rules.md` under *Proposed*, linking the lesson.
4. **A person adopts it** (or edits or drops it) in review. Then the lesson's `rule:` line is filled in.

**Entry format**
```
### L<n>. <one-line lesson> (<date>, <game or "studio">)
- What happened:
- Why:
- Next time:
- Source: <issue / PR / session / link>
- Rule: <R-number if adopted, P-number if proposed, "none yet">
```

**Research notes** use the same format with "Research:" in the title, cite their sources, and say which prices or terms were checked on the vendor's own page.

---

### L15. Canva slows to one image every 10–30 minutes after a burst (Nov 1, 2026, card-trader)
- What happened: making Card Trader v2's art, Canva throttled after the first few jobs and then gave about one image every 10 to 30 minutes. Only 4 of v2's 12 paintings came from Canva; Gemini made the other 8 for about $0.72.
- Why: Canva rate-limits AI credit use, and the limit tightens as a session goes on (L11).
- Next time: plan any shot list of more than a few images for Gemini (`kit/art/gemini.py`), with Hunter's OK on the money (R20). Keep Canva for one-off concepts and `remove-background`.
- Source: `card-trader/patch-notes.md` v2; `kit/art/README.md` ("Gemini")
- Rule: R16 (its "use Headless Finals for volume" line now means Gemini)

### L14. With the key art as the only reference, Gemini copied its layout (Nov 1, 2026, card-trader)
- What happened: the first Release Day scene reused the key art's composition and camera angle, even with the style-guide-only line. It was discarded and redone with "Do NOT reproduce its composition, its camera angle or any of its characters".
- Why: with one reference, the model leans on all of it, layout included, not just the style.
- Next time: give every scene a second reference for the subject or setting (an existing scene of ours), say what to borrow from each, and say "do not copy its layout" for the key art.
- Source: `card-trader/art/v2-gemini-jobs.json` (`_reviews`); `card-trader/design/ai-assets.md` (release.jpg)
- Rule: none yet (lead-plan-v3 suggests a proposal with L12)

### L13. Shops and signs in a background bring back fake lettering (Nov 1, 2026, card-trader)
- What happened: the first Hive Gambit full-art came back with made-up lettering on a shop sign behind the creature, so it failed R1 and was discarded. The redo asked for a plain backdrop with no shops, stalls, signs, screens or buildings and came back clean. Release Day's stall also got two letter-like graffiti tags.
- Why: our style lead says "a market station full of card shops", and models put signage on shops (L0). "No text" alone doesn't stop it.
- Next time: unless the picture needs a shop, say "no shops, no signs, no screens", and ask for graffiti as abstract shapes only. Zoom-check every sign and wall.
- Source: `card-trader/art/v2-gemini-jobs.json` (`_reviews`); `card-trader/design/ai-assets.md`
- Rule: R1 (second time after L0; lead-plan-v3 suggests adding it to R1's check)

### L12. Gemini pasted reference image 1 into the picture (Nov 1, 2026, card-trader)
- What happened: on `gemini.py`'s first try, the key art passed as a style reference turned up pasted into the new image's background. It worked once every prompt began "Reference image 1 is a style guide only: … do not include, copy or reuse its scene, characters or background anywhere in the new image."
- Why: Gemini treats reference images as content to edit or combine unless told they're style only.
- Next time: start every Gemini prompt with the style-guide-only line, and give each other reference one line on what to keep from it ("keep its creature designs, and nothing else").
- Source: `card-trader/patch-notes.md` v2 watch-out; `card-trader/art/v2-gemini-jobs.json`
- Rule: none yet (cost real money; lead-plan-v3 suggests a proposal)

### L11. Canva's cooldowns grow through a session (Oct 31, 2026, card-trader)
- What happened: making Card Trader v1's art, Canva throttled after about 8 jobs, and the cooldowns grew to several minutes as the session went on.
- Why: Canva rate-limits AI credit use in bursts.
- Next time: small batches spread over sessions; Gemini for release volume.
- Source: `card-trader/patch-notes.md` v1 watch-out
- Rule: R16 (updated)

### L10. Painting a group together keeps it consistent (Oct 31, 2026, card-trader)
- What happened: in v1, each species' regulars were one lineup painting cut into portraits in code, and each card game's art was one 2×2 sheet. Both held together. A solo try at Klik came out grittier than the key art and was replaced by the lineup.
- Why: one generation shares one light, palette and hand.
- Next time: paint lineups and sheets, then crop them apart in code.
- Source: `card-trader/design/ai-assets.md`
- Rule: P6 (proposed as R26)

### L9. Characters drift toward famous franchise looks (Oct 31, 2026, card-trader)
- What happened: the first grader office appraiser came out looking like a famous big-eared green franchise character, even with "original design" in the prompt and the key art as a style reference. It was rejected and redone as a boxy robot.
- Why: models fall back on the most famous character that matches a description ("grumpy little old appraiser").
- Next time: check every new character for look-alikes at review; describe characters by shapes and materials unlike famous ones.
- Source: `card-trader/design/ai-assets.md`; `card-trader/patch-notes.md` v1
- Rule: R17 (check added)

### L8. If the player inspects it, it can't be baked into the picture (Oct 31, 2026, card-trader)
- What happened: the first lead plan found that the Loupe needs every copy of a card to differ (wear, centering, holo, fake tells). That's impossible with one generated image per card, and unaffordable with one per copy.
- Why: a gameplay read needs variation and control; a generated image gives neither.
- Next time: anything the player inspects or compares becomes a code layer over a clean illustration.
- Source: `card-trader/art/lead-plan.md` (first Lead Artist run)
- Rule: R25 (adopted Oct 31, 2026)

### L7. Invented scripts are text too (Oct 31, 2026, card-trader)
- What happened: Card Trader's alien scripts are on cards, signs and packs, and reading them is a mechanic. Image models make garbled pseudo-letters that change in every image.
- Why: R1 was written for real words; an invented alphabet has the same problem and matters more when players decode it.
- Next time: design each alphabet once as an SVG glyph set and let the game render it.
- Source: `card-trader/art/lead-plan.md` (first Lead Artist run)
- Rule: R24 (adopted Oct 31, 2026)

### L6. Research: Steam disclosure covers what ships, not dev tools (Oct 31, 2026, studio)
- What happened: Valve rewrote the Content Survey in January 2026.
- Why: "Pre-Generated" covers AI content that ships and is consumed by players; tools used only for development efficiency are exempt.
- Next time: list every shipped AI-made file, including Claude-drawn SVG to be safe; don't list code assistance.
- Source: https://partner.steamgames.com/doc/gettingstarted/contentsurvey (checked)
- Rule: R18

### L5. Canva `remove-background` makes clean cut-outs (Oct 31, 2026, card-trader)
- What happened: in the bake-off, cut-outs came out clean and transparent.
- Why: clear subjects on simple backgrounds are the easy case. Hair, smoke and glass will be harder.
- Next time: generate subjects on plain backgrounds, then check every cut-out on light and dark.
- Source: Card Trader bake-off session
- Rule: R15

### L4. WebP cuts a 3 MB PNG to 170 KB (Oct 31, 2026, card-trader)
- What happened: converting in the browser pane after the full-size fetch.
- Why: PNG is lossless and huge for painted art; WebP at good quality looks the same.
- Next time: builds get WebP; keep one full-res master.
- Source: Card Trader bake-off session
- Rule: R14

### L3. Canva over the API gives thumbnails and throttles at about 8 jobs (Oct 31, 2026, studio)
- What happened: `generate-image` returned 199×112 thumbnails; full size needed the logged-in browser fetch. About 8 parallel jobs triggered "credit usage is cooling down".
- Why: how Canva's connector works today.
- Next time: save media ids right away, fetch full size, run at most 6 jobs at once with backoff.
- Source: Card Trader bake-off session; `kit/art/README.md`
- Rule: R13, R16

### L2. Characters drift even with a style anchor (Oct 31, 2026, card-trader)
- What happened: passing the approved key art as `imageReferences` kept the style consistent, but the same character came out different between images.
- Why: a style reference carries look, not identity.
- Next time: approve a character anchor per character before making any finals with them.
- Source: Card Trader bake-off session
- Rule: R3, R6

### L1. A style anchor keeps a set consistent (Oct 31, 2026, card-trader)
- What happened: with the approved key art as a reference, new images matched its style.
- Why: models copy style from reference images much better than from words.
- Next time: approve a style anchor before any volume work, for every game.
- Source: Card Trader bake-off session
- Rule: R3

### L0. Models sneak in text and signage (Oct 2026, tilebound / trickbound)
- What happened: even with "No text." in the prompt, signs and lettering turned up.
- Why: models love signage in shop and town scenes.
- Next time: check every image for stray writing; the game draws all real text.
- Source: `kit/art/README.md` §1 and §3
- Rule: R1
