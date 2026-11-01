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
