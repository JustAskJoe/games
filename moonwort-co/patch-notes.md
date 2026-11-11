# Moonwort & Co.: patch notes

© 2026 justaskjoe. All rights reserved.

Newest on top. See the repo's CLAUDE.md for how patch notes work.

---

## 0.1.1 · 2026-11-03 · Hunter (with Claude)
Lore fixes from the first review of all 20 grimoire cards. Hunter took Claude's suggestions.

### What's new
- Mugwort is now pillow-only: a mix with mugwort can only become a salve or a Dream Pillow, never a drink, because it must not be used in pregnancy. Its bench chip says "pillow only", and the sim checks that no mix of up to 3 herbs breaks the rule.
- Garlic's card no longer calls it a "cure-all", and the plague-thieves tale is gone. Its folklore is now Herodotus on the pyramid builders' rations.
- Hops: the "Henry VIII banned hops" story is corrected to what happened (a 1530 rule for his own ale brewer), with a beer historian as the source. The cannabis-family fact is replaced by a cozier one about hop cones.
- Rose has a new true fact you can remember: rose hips are its fruit, and in 1941 Britain gathered 200 tons of them for vitamin C syrup (BMJ, 1942).
- Second sources for the WWI nettle cloth and peppermint facts. Peppermint's card now says "the late 1600s" rather than a single year.

### Next up
- [ ] @Hunter: play it on a real phone from the PR's Lab preview.
- [ ] A person still needs to mark the cards reviewed (`reviewed_by` stays null until then).

### Watch out
- [ ] Valerian and yarrow aren't kitchen-safe but stay brewable for now (fictional brews, safety note on each card). Revisit before a wider release.
- [ ] Rose is "soothing" in the game, but Culpeper calls roses cooling and drying. The traits are game design; left as is.
- [ ] Dandelion's botanical name still needs a botanist's word.

---

## 0.1 · 2026-11-02 · Hunter (with Claude)
Prototype 1: a 2D phone-first build covering 3 in-game days. Play it from the Lab or `builds/moonwort-co.html`.

### What's new
- A familiar picks you: three quick questions decide between Sorrel the cat, Burdock the toad and Quill the crow. Your familiar drops a hint whenever a brew isn't quite right.
- Each day, Old Pell, Wren and Tamsin each knock with a trouble. They describe how they feel, never what to make.
- At the bench, put up to three herbs in the mortar. Steep, grind, dry or moonlight each one, then stir with two circles of your thumb. There are 13 brews to find, plus funny duds ("Tonic of Mild Regret": they hiccup in Latin).
- Moonlight follows the real moon tonight: a waxing moon brightens a herb, a waning moon calms it. The dawn card shows the real phase and season.
- One garden bed with 3 plots: sow at dusk, harvest at dawn. The hedgerow can be foraged once a day by season. On day 2 you find moonwort, the shop's namesake, and leave it be.
- Grimoire: every herb you use opens a lore card with its botanical name, a true fact, a Culpeper quote, what science says today, a safety note and sources. Every card says "not medical advice".
- Feedback form (Lab, or copy fallback) asks for one plant fact you remember, for the pass-bar recall test.

### Next up
- [ ] @Hunter: play it on a real phone from the PR's Lab preview. Is reading a trouble and finding the brew fun on its own?
- [ ] @Hunter: run the pass-bar test with 5 people (4 of 5 find a brew without help, want to keep playing, and recall a plant fact the next day).
- [ ] @Hunter: review the lore cards in `design/lore/ingredients.json` (or name a reviewer). Every entry has `reviewed_by: null` until a person checks it.
- [ ] Crew deck (about 12 slides) from the brief.
- [x] Add the game to the table in the repo README. (Hunter with Claude, Nov 2)

### Watch out
- [ ] Only bots have played it: the sim and a Playwright run through all 3 days at 390 and 320 px in desktop Chromium. It hasn't been tried on a real phone, iOS Safari, or with haptics.
- [ ] The trait numbers per herb are game design, only loosely inspired by Culpeper's hot / cold, dry / moist. Check them against the lore data before anyone calls them "accurate".
- [ ] Prototype 1 is 2D and 3 days. The brief said 3D greybox and 1 day (Hunter changed both on Nov 2). The pitch dates the approval Nov 3 but this entry is Nov 2, because the Forge date looks off by a day.
- [ ] Moonlight depends on the real date, so testers on different nights get different answers. Use `?date=YYYY-MM-DD` to compare.
- [ ] The time to first brew is measured from game start (after the quiz), not from install.
- [ ] Only the stir gesture exists. Grind, pour and cork are still taps on a chip.
- [ ] `kit/open-notes.py` crashes on Windows (it reads patch notes without UTF-8). It's not fixed here; it needs its own small PR.
- [ ] @Hunter: lore science lines for 9 herbs (calendula, rosemary, thyme, lemon balm, yarrow, fennel, rose, nettle, hops) come from the European Medicines Agency, because NCCIH has no sheet for them and MedlinePlus retired its herb pages. Keep EMA, or set those to null for NIH-only sources?
- [x] Some true facts rest only on Grieve's *A Modern Herbal* (WWI nettle cloth, peppermint dates, Four Thieves' Vinegar, the Henry VIII hop ban). Each needs a second modern source before it's trusted. The full list is under "Unverified" in `design/lore/README.md`. (Fixed or removed in 0.1.1, Hunter with Claude, Nov 3.)
- [ ] Name questions for a botanist: dandelion (Kew treats *Taraxacum officinale* as a group of microspecies), Culpeper's camomile and valerian were probably different species from ours, his "mint" is spearmint, and POWO now calls rosemary *Salvia rosmarinus*.
- [ ] @Hunter: content calls. Elder is `kitchen_safe` only when the berries are ripe and cooked (raw ones are toxic). Hops are in the cannabis family and toxic to dogs. Mugwort and sage carry pregnancy cautions. Valerian, hops and lemon balm can cause drowsiness. The cards say all this; decide whether any herb should leave the game.
- [ ] POWO links were confirmed through Kew's checklist on GBIF, not opened in a browser (POWO blocks scripts).
- [ ] The Lead Artist plan is a separate PR (#101), and both PRs add a top patch-notes entry. Whichever merges second needs a one-line conflict fixed.

### Watch out
- [ ] The brief is a draft until the crew deck settles the open calls.
