# Intergalactic Card Trader: lead art plan

© 2026 justaskjoe. All rights reserved.

status: approved
updated: 2026-10-31
camera: 2d
release_target: steam
style_fit: good
ship: 12
test: 2
skip: 1
hours_estimate: 150-250 (first release)
money_estimate: $0 on Canva; about $50-100 on Gemini for a first release
team_needed: lead-artist, artist, ui-vector, tech-artist
team_later: headless-finals, marketing-artist, style-trainer

Written by the Lead Artist (`kit/agents/lead-artist.md`, JOB: plan), first run. Updated the same day to match the **v1 build** (`design/handoff.md`, `design/v1-design.md`, `design/ai-assets.md`). **Approved by Hunter on Oct 31, 2026** ("approve all"). It follows the house rules in `kit/art/art-rules.md` (cited as R1, R2, …) and the release bar in `kit/art/art-team.md`. Approved decisions are in [section 9](#9-decisions).

---

## 1. The look, and why it suits AI

**Cel-shaded street-graffiti "happy space Akihabara"** (handoff: the *look* of Jet Set Radio only, never its characters, tags, logos or music). Thick outlines, flat bold color, halftone, spray drips, sticker-style UI, squash-and-stretch motion. Warm and funny, never grim or cyberpunk. Desktop landscape first, on a 16:9 stage.

**Why it suits AI-only art, and v1 proves it:**
- **Flat color and bold outlines hide drift.** All of v1's paintings came from Canva with the key art as the style anchor and read as one set.
- **The main object is a card held flat.** v1 already draws card frames, scripts, wear, UV marks and slabs in code over the paintings.
- **Customers stand at the counter and react.** No walk cycles needed.

**Where it fights AI (watch these):**
1. **Characters drift toward famous franchises.** The first grader appraiser came out looking like a famous big-eared green character and was thrown out. Klik's first try was grittier than the key art.
2. **More card games and cards in a full release** means more sub-styles, and more room for drift.
3. **The brief's PC first-person 3D** would need hero 3D customers up close. That's decided against: see [section 9](#9-decisions).

## 2. Asset types: ship / test / skip

"v1" is what the build has today (`design/ai-assets.md`). "First release" is a guess (4 card games, 18 to 30 cards each, 4 species, about 16 regulars) to size the work.

| # | Asset type | v1 | First release (guess) | Tier | Who makes it | How |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Card illustrations | 12 (4 per game, from one 2×2 sheet each) | ~80–120 | ✅ ship | Artist | 2×2 sheets per set with the style anchor plus a set anchor (R3, R5); proposed R26 |
| 2 | Card frames, backs, rarity marks | in code | 4 sets | ✅ ship | UI & Vector Designer | SVG/code (R2); never echo real TCG frames (R17) |
| 3 | Alien scripts | in code | 4 | ✅ ship | UI & Vector Designer | Glyph sets the game renders (R1, R24) |
| 4 | Card condition and fakes: centering, edges, surface, UV watermarks | in code | 1 system | ✅ ship | Tech Artist | Seeded code layers per card copy (R25) |
| 5 | Customer portraits | 9 regulars (3 paintings cut in code) + Pearla | ~16 regulars × 3 expressions | ✅ ship | Artist | Paint each species' lineup as one picture, cut in code (proposed R26); one character anchor per species (R3, R6) |
| 6 | Customer motion | code | code | ✅ ship | Tech Artist | Squash-and-stretch, slide, bob, expression swaps |
| 7 | Scenes: shop counter, docking bay, Card Night, grader office, title key art | 6 | ~10 | ✅ ship | Artist | Calm area for the UI (R21); any signage drawn in code (R1) |
| 8 | UI: sticker UI, slider, patience pips, ledger, Loupe HUD | in code | 1 kit | ✅ ship | UI & Vector Designer | R2 |
| 9 | Opening sequence, Grade Day reveal, Card Night FX | in code | code | ✅ ship | Tech Artist | Reusable `kit/snippets/game-front-end/` |
| 10 | Sealed product (packs, boxes, vending machine) | in code | ~12 | ✅ ship | Artist (blank packaging) + UI & Vector (labels) | Labels are text (R1) |
| 11 | Logo and title | in code | 1 | ✅ ship | UI & Vector Designer | R2 |
| 12 | Store art, screenshots, trailer | — | 1 set | ✅ ship | Marketing Artist (later) | Capsules from the key art; trailer from real gameplay |
| 13 | Frame-by-frame customer walk cycles | — | — | 🧪 test | — | Drift and foot sliding; use #6 |
| 14 | 3D shop props | — | — | 🧪 test | — | Only if 3D ever comes back |
| 15 | 3D customers close up (first person) | — | — | ❌ skip | — | Hero 3D up close isn't doable AI-only today |

**Totals:** 12 ship, 2 test, 1 skip.

## 3. Risks (top 5), each with a fix or a fallback

1. **Franchise look-alikes** (it already happened once).
   - Every new character gets a look-alike check at review (R17), and the rejection goes in `design/ai-assets.md`, as v1 did.
   - Prompts never name a franchise, including the style inspiration ("cel-shaded street graffiti", not the game's name).
2. **Real card game IP.**
   - Frames, backs, rarity marks and grading slabs stay our own code-drawn designs (R2, R17).
   - The legal reviewer checks them before release ([section 8](#8-legal-flags-for-the-legal-reviewer)).
3. **Drift as the card count grows.**
   - One set anchor per card game: its v1 2×2 sheet.
   - Keep painting in 2×2 sheets, batched per set (R5), then the finishing pass (R7).
   - Fallback: Style Trainer past ~50 approved cards per game.
4. **Canva throttling.**
   - Cooldowns grew longer through the v1 session (lesson L11).
   - Small batches across sessions; Headless Finals (Gemini) for release volume.
5. **Rights to raw AI images.**
   - Card art ships as raw files in a sold game. Canva's terms on that are still open (`kit/art/pipeline-upgrade.md` §7).
   - Fallback: Gemini for release finals, if the legal reviewer says Canva is a 🔴.

## 4. Limits we're accepting

- Customers move by code (squash, slide, bob, expression swap), not frame-by-frame animation.
- No cutscenes; story beats happen at the counter and on Lane FM.
- The game stays 2D: a painted first-person counter view, no 3D shop.
- Steam shows the AI disclosure, from `design/ai-assets.md` (R18).
- Raw AI paintings have weak copyright. Ours for sure: frames, scripts, the condition system, UI, FX and any human edits.

## 5. Suggestions

1. **Keep v1's split:** paintings from AI, everything the player inspects or reads in code (R1, R2, R24, R25). It works.
2. **Paint groups, cut in code.** v1's species lineups and 2×2 card sheets kept each group consistent in one generation. Make this the default (proposed R26).
3. **Give every card its own illustration for release,** or keep v1's "4 paintings per game" and make the reuse a feature (variant frames, alt-art rarities).
4. **Species read by silhouette** (R9): Mollu, Zekk and Puffi each keep a distinct outline family as more regulars arrive.
5. **Signs in our glyph fonts,** so learning a script decodes the station too.
6. **One scene kit, many rooms:** new rooms reuse the counter-view layout.

## 6. Team

**Now** (no new money):
- **Lead Artist:** this plan; anchors; drift and look-alike reviews before each `Pick:`.
- **Artist:** paintings from the manifest, with anchors (Canva).
- **UI & Vector Designer:** frames, glyphs, UI, logo.
- **Tech Artist:** the condition system, motion, FX, the finishing pass.
- **Asset Wrangler scripts:** manifest, `ai-assets.md`.

**Later:**
- **Headless Finals:** before release production (~120+ paintings). Needs Hunter: the Gemini key and a monthly cap.
- **Marketing Artist:** when the Steam page is set up.
- **Style Trainer:** only if drift holds past ~50 approved cards per game.
- **Not needed:** Animator, 3D Kitbasher, Art QA.

## 7. Hours and money

Scaled from `kit/art/pipeline-upgrade.md` §6. About 4 tries per kept image; a 2×2 sheet counts as one generation for 4 cards. Gemini at $0.067 a 1K image (checked; batch is half). **Hours are estimates.**

| | v1 (done) | First release (guess) |
| --- | --- | --- |
| Paintings kept | 13 (6 scenes, DJ, 3 lineups + Pearla, 3 card sheets) | ~60–90 (sheets and lineups) |
| Money on Canva | $0 (plan credits) | $0 (plan credits) |
| Money on Gemini | — | ~$50–100 |
| Studio hours | (one session) | 150–250 |

## 8. Legal flags (for the legal reviewer)

- **Canva:** card art and portraits ship as raw files in a sold game. Is that "standalone / as-is" under Canva's AI Product Terms? This decides Canva versus Gemini for release.
- **Real card game IP:** frames, backs, rarity marks and slabs: 🟢/🟡/🔴 please.
- **Inspirations:** the reference shop sim, the cel-shaded game the look comes from, and the real Akihabara are inspiration only.

## 9. Decisions

Approved by Hunter, Oct 31, 2026:
- [x] The look: cel-shaded street-graffiti "happy space Akihabara", with the v1 title key art (`builds/img/keyart.jpg`) as the **world style anchor**.
- [x] Stay 2D: the painted counter view on every platform. No first-person 3D shop or 3D customers in an AI-only release.
- [x] Alien scripts as code-drawn glyph sets, rendered by the game. No generated lettering anywhere.
- [x] Card condition and fakes as a code system.
- [x] The in-world card games are Shellstorm, Hive Gambit and Starweave (v1). Each one's 2×2 card sheet is its **set anchor**.
- [x] Adopt rules R21 to R25 (formerly P1 to P5) in `kit/art/art-rules.md`.

Still open:
- [ ] Canva or Gemini for release volume: after the legal reviewer's Canva answer.
- [ ] Proposed rule R26 (paint groups, cut in code), from v1's lessons.
- [ ] One illustration per card for release, or keep "4 per game" as a feature (suggestion 3).
