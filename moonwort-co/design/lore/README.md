# Moonwort & Co. — ingredient lore

© 2026 justaskjoe. All rights reserved.

`ingredients.json` holds the real-world lore behind the game's 20 starting ingredients: Culpeper's 1653 notes, one folklore fact each, what modern science says, safety notes, and a short lore card for players. Each fact is tied to a source URL. Accuracy matters more than charm here. If a fact can't be traced to a source, it doesn't go on a card.

- Entries: 20, in game order: chamomile, lavender, peppermint, calendula, rosemary, sage, thyme, lemon_balm, elder, yarrow, fennel, ginger, rose, nettle, dandelion, valerian, hops, garlic, mugwort, moonwort.
- Researched and checked: 2026-11-02 (researcher: Claude, for Hunter).
- Human review: **none yet** (`reviewed_by` is `null` on every entry).

## Source policy

| Field | Allowed sources | Rule |
|---|---|---|
| `culpeper` | Nicholas Culpeper, *The Complete Herbal* (1653), [Project Gutenberg #49513](https://www.gutenberg.org/ebooks/49513) | Public domain. Quotes are exact and under 20 words. The summary is in our own words. |
| `botanical`, `family` | Kew [Plants of the World Online](https://powo.science.kew.org) (POWO) | Use the POWO accepted name. Each entry's POWO URL is the second item in `sources` (the first when there is no Culpeper entry). |
| `science`, `safety` | NCCIH [Herbs at a Glance](https://www.nccih.nih.gov/health/herbsataglance), then NIH ODS, then MedlinePlus, then the EMA herbal summaries (see note below) | Summarise in our own words. Be cautious ("little good evidence", "accepted only as traditional use"). Never write "cures" or "treats". |
| `folklore` | Museums, botanic gardens, universities, research libraries, botanical societies, or Mrs. M. Grieve's *A Modern Herbal* (1931) at [botanical.com](https://www.botanical.com/botanical/mgmh/mgmh.html) | **Grieve's copyright status is unverified**, so paraphrase only and never quote her. Wikipedia only when it cites a source, and cite that source instead. |

Hard rules for all text:

- Present folklore as folklore ("folk said…", "legend says…").
- No medical claims and no dosing. Card text never tells a player to take anything.
- No wild-foraging instructions.
- Never use closed or sacred practices of living cultures. Old European almanac and folk-custom lore is fine. Living ceremonial practice is not.
- Text in our own words must not copy a source's sentences.

**EMA fallback (a deviation from the brief):** MedlinePlus has retired its herb monographs. Its old `druginfo/natural/*.html` URLs now return 404 or redirect to its herb index, which links only to the NCCIH and ODS sheets. Neither NCCIH nor ODS has a sheet for calendula, rosemary, thyme, lemon balm, yarrow, fennel, rose, nettle or hops. For those nine, `science.source` is `"EMA"`: the European Medicines Agency's Committee on Herbal Medicinal Products summaries and monographs. EMA is a government regulator and states plainly when a conclusion rests on "traditional use" rather than clinical trials. If the team wants NIH-only sources, set `science` to `null` for those nine.

## Fields

| Field | Meaning |
|---|---|
| `id` | Stable game id. Never rename it, because saves and recipes refer to it. |
| `common` | Display name. |
| `folk_names` | Historical or regional names taken from Culpeper or Grieve. Can be an empty list. |
| `botanical` | POWO accepted name (`Genus species`). |
| `family` | POWO family. |
| `part` | The part used in the game: `flower`, `leaf`, `root`, `berry`, `seed`, `petal`, `bulb`, `rhizome`, `strobile` (hop cone), or `frond`. |
| `season` | When the ingredient is at its best in a northern temperate garden. This is an editorial generalisation, and it quotes Culpeper's `Time` note where he gives one. |
| `planet` | Culpeper's ruling planet, from his "Government and virtues" section, or `null`. |
| `culpeper.heading` | The entry heading exactly as printed in the Gutenberg text, so you can search for it. |
| `culpeper.quote` | An exact quote under 20 words. Gutenberg's `_italic_` underscores are removed, and the all-caps first word of a paragraph is set in normal case. Otherwise spelling is as printed, including `’`. |
| `culpeper.summary` | 35 words or fewer, in our own words, framed as "Culpeper believed…". |
| `folklore` | `{text, source, url}`. Text is 35 words or fewer, in our own words. |
| `science` | `{text, source, url}`. Text is 35 words or fewer and cautious. `source` is `NCCIH` or `EMA`. `null` when no source exists. |
| `safety` | 25 words or fewer, in plain language: allergies, pregnancy, drug interactions, toxic parts. |
| `card` | 40 words or fewer. Warm player-facing lore with folklore framed as folklore and no medical advice. |
| `true_fact` | 20 words or fewer. One memorable, checkable plant fact for the "recall one real plant fact" pass bar. |
| `kitchen_safe` | `true` if commonly eaten or drunk as food or tea. This is **not** a statement that it's safe for everyone. |
| `sources` | Every URL the entry relies on. |
| `checked` | Date the sources were last read. |
| `reviewed_by` | Name of the human who approved the entry, or `null`. |

## How to add an entry

1. Pick an `id` (lowercase snake_case) and add the entry to `ingredients.json` in the same shape as the others.
2. **Culpeper:** search the Gutenberg plain text for the herb in capitals, for example `    CAMOMILE.`. Take the planet from `_Government and virtues._`. Copy one quote of under 20 words exactly. If he has no entry, set `culpeper` and `planet` to `null`.
3. **Name:** look the plant up on POWO and use the accepted name and family. POWO's site blocks scripts. GBIF's copy of the [WCVP checklist](https://www.gbif.org/dataset/f382f0ce-323a-4091-bb9f-add557f3a9a2) returns the same accepted name, status and POWO link (the `references` field on each record).
4. **Science and safety:** use NCCIH first, then ODS, MedlinePlus, and EMA. Summarise; don't copy.
5. **Folklore:** find one fact from an allowed source and paraphrase it.
6. Check the word limits, then set `checked` to today and leave `reviewed_by` as `null` until a person signs off.
7. If you can't verify something, set it to `null` and add it to **Unverified** below.

## Review status

| Status | Entries |
|---|---|
| Researched, all fields sourced | chamomile, lavender, peppermint, calendula, rosemary, sage, thyme, lemon_balm, elder, yarrow, fennel, rose, nettle, dandelion, valerian, hops, garlic, mugwort |
| Researched, with a deliberate `null` | ginger (`culpeper`/`planet`: no herbal entry), moonwort (`science`: not a medicinal plant) |
| Human-reviewed | none |

## Unverified and caveats

- **Ginger has no Culpeper entry.** It appears only as a one-line item ("Zingiberis. Of Ginger.") in his catalogue of simples near the end of the book, with no ruling planet. `culpeper` and `planet` are `null`.
- **Chamomile has no planet in Culpeper.** His CAMOMILE entry has no "Government and virtues" line. He only repeats that the Egyptians dedicated it to the Sun, so `planet` is `null`. His camomile was probably Roman chamomile (*Chamaemelum nobile*), but the entry uses German chamomile (*Matricaria chamomilla*) to match the NCCIH sheet. Grieve's "plant's physician" lore comes from a page that covers both plants.
- **Peppermint:** Culpeper's MINT entry describes spear mint. Peppermint wasn't recognised as a separate plant until 1696. The planet (Venus) is his planet for mint in general.
- **Rose planet:** Culpeper splits roses by colour: red under Jupiter, damask under Venus, white under the Moon. The entry uses the red *Rosa gallica*, so `planet` is Jupiter.
- **Valerian species:** Culpeper's "Garden Valerian" may be *Valeriana phu* rather than *V. officinalis*. This hasn't been checked against a botanical-history source.
- **Dandelion name:** POWO/WCVP does not accept *Taraxacum officinale* as a species. It treats the name as a synonym of an unresolved aggregate ("Taraxacum spec."), because dandelions are split into hundreds of microspecies. The entry keeps the familiar *Taraxacum officinale* (as NCCIH does) and links that name's POWO record. A botanist should decide on the final label.
- **Elder family:** POWO places *Sambucus* in **Viburnaceae**, not the older Adoxaceae or Caprifoliaceae.
- **Rosemary name:** POWO's accepted name is *Salvia rosmarinus*. *Rosmarinus officinalis* is a synonym.
- **POWO was read through GBIF.** POWO pages are behind a bot check, so accepted names, families and POWO URLs were confirmed through the WCVP dataset on GBIF, which is Kew's own checklist. The URLs have not been opened in a browser.
- **`season`** values are editorial generalisations, not sourced, apart from the Culpeper `Time` quotes.
- **Grieve facts** are early-1900s scholarship and may repeat older errors. Second sources added on Nov 3: WWI nettle cloth (a 2022 review on PMC), the 1696 peppermint date (still Grieve, so the card now says "the late 1600s"), and the 1941 rose-hip drive (BMJ, 1942). Removed on Nov 3: Four Thieves' Vinegar (garlic now uses Herodotus) and the Henry VIII hop ban, which beer historian Martyn Cornell shows was a 1530 rule for the royal ale brewer only, not a law.
- **Herodotus and garlic:** Macaulay's public-domain translation renders the Greek *skorodon* as "leeks"; most translators give "garlic". The folklore line says so.
- **Mugwort is pillow-only in the game** (`outerOnly` in `prototype/v1/data.js`): any mix with it can only become a salve or a pillow, never a drink, because of its pregnancy warning. `sim.js` checks this.
- **Valerian and yarrow** are `kitchen_safe: false` but stay brewable for now. Hunter's call on Nov 3 (taking Claude's suggestion): the brews are fictional and each card carries the safety note. Revisit before any wider release.
- **Moonwort `true_fact`** (its "flower" spike bears spores) is basic fern botany. It is supported by Culpeper's description, but no modern page saying it is cited yet.
- **Moonwort's status varies by region.** It is Least Concern in Great Britain but Near Threatened in Ireland (BSBI), and threatened in some other regions. The "rare, look don't pick" framing is a game choice that fits that decline. It is not a global legal status.
- **Nettle** science and safety come from the EMA monograph PDF. EMA's public summary page for nettle is still "being developed".

## Safety flags for design

- **Sedating:** valerian (never with alcohol or sedatives), hops (may impair driving), lemon balm (may impair driving).
- **Pregnancy:** mugwort must not be used in pregnancy (NCCIH). Sage may be unsafe (thujone). Most EMA herbs are "not recommended" for medicinal use in pregnancy.
- **Toxic parts:** elder's raw or unripe berries, leaves and stems are poisonous. Only cooked ripe berries are eaten. Hops are toxic to dogs (ASPCA). Keep that in mind if the shop has a pet.
- **Allergies:** the daisy family (chamomile, calendula, yarrow, dandelion, mugwort) and the mint family (thyme and relatives).
- **Moonwort:** lore only. It is never brewed, sold as food, or picked in-game.
