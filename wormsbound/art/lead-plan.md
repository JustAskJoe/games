# Wormsbound: lead art plan

© 2026 justaskjoe. All rights reserved.

status: draft
updated: 2026-11-11
camera: 2d
release_target: web
style_fit: good
ship: 9
test: 3
skip: 2
hours_estimate: 60-110 (first art pass)
money_estimate: $0 on Canva; PixelLab credits for the pixel test (needs Hunter's OK, R20)
team_needed: lead-artist, artist, ui-vector, tech-artist
team_later: animator, marketing-artist

Written by the Lead Artist (`kit/agents/lead-artist.md`, JOB: plan), first run for this game, started by Hunter on Nov 11, 2026: "we need to call on the artist for a rework of the art." It follows the house rules in `kit/art/art-rules.md` (cited as R1, R2, …) and the release bar in `kit/art/art-team.md`. **A person approves this plan; until then it is a draft.** Louiemark leads Wormsbound, so the decisions in [section 9](#9-decisions-for-the-games-owner) are his and Hunter's.

Read with: `design/handoff.md` (decisions) and `art/art-direction.md` (drafted with this plan). **This plan counts on two open pull requests:** the map generator (JustAskJoe/games#95: ten themes, `design/mapgen.md`) and v2 (JustAskJoe/games#107: crews, big maps and a camera, `design/v2.md`). If they don't merge, there are 3 maps instead of 10 themes and no camera, and rows 4 to 6 shrink to match.

---

## 1. The look in one paragraph, and why it suits (or fights) AI

Today everything is **placeholder art drawn in code**: chunky 8-pixel terrain cells shaded by depth, round little units with a hat or a tool that says which character they are, flat skies with far ridges. It already reads as a game, and the bold shapes and thick ink outlines are the right bones. The rework keeps that: **a chunky, friendly, toy-like artillery game with thick dark outlines, flat colour and big readable silhouettes**, warm and funny rather than gritty. Two finishes are worth testing before anyone paints a set: **A, pixel art** that matches the 8-pixel grid, and **B, painted cut-outs** over the same grid (see [Decisions](#9-decisions-for-the-games-owner)).

**Why it suits AI-only art:**
- **Units are tiny.** A unit is 3 cells (24 px) across on a one-screen map, and smaller when the v2 camera zooms out. Silhouette and colour carry everything (R9); fine detail never shows, so drift between images hardly matters.
- **The ground has to stay code.** It is a destructible grid that every shot carves. Art can give it a texture and an edge, but the shape is the game's.
- **Characters don't need to act.** They stand, aim, get knocked about and fall over. That is cut-out motion and a few short loops, not acting.
- **There are only five characters,** and ten themes that already have palettes in `MapGen.THEMES`.

**Where it fights AI (watch these):**
1. **The genre has famous look-alikes.** Small round soldiers with big eyes and bazookas drift straight towards well-known artillery games. Every character needs a look-alike check (R17).
2. **Frame animation.** Painted walk cycles drift and slide (studio limit, `art-team.md` §4). Pixel walk cycles are the one kind the studio rates as shippable, and only for a pixel game.
3. **Ten themes** is a lot of backgrounds to keep in one style.
4. **Two zoom levels (v2).** Art has to read at 24 px and still look good at 1.5×.

## 2. Asset types: ship / test / skip

Counts are for a first full art pass of today's game (5 characters, 10 themes, v2 modes).

| # | Asset type | Count | Tier | Who makes it | Why / how |
| --- | --- | --- | --- | --- | --- |
| 1 | Character designs (anchors) | 5 | ✅ ship | Artist | One neutral, front-facing anchor per character (R6) from the code-drawn ones, so the roster stays recognisable. Concepts first, look-alike check (R17). |
| 2 | Character sprites in game: idle, aim, hurt, knocked out, plus team colours | 5 × 6 teams | ✅ ship | Artist (parts) + Tech Artist (rig and motion) | Cut-out parts (body, eyes, gear, launcher) moved in code: bob, squash, recoil, blink. Team colour is a code tint, not six paintings (R25). |
| 3 | Character portraits (select screen, HUD, lobby) | 5 | ✅ ship | Artist | Same anchors, larger. Hands and faces at 100% (R12). |
| 4 | Backgrounds: sky plus 2 far layers per theme | 10 themes | ✅ ship | Artist | Batch all ten in one sitting (R5) with the style anchor (R3). Calm band where the HUD sits (R21). Layers slide with the v2 camera. |
| 5 | Terrain look: a tileable fill and an edge treatment per theme | 10 | ✅ ship | Tech Artist | The grid stays code. A small tileable texture per material (ground, hard rock, prop, accent), drawn through the cell mask, with code edges and tufts as now. |
| 6 | Props and hazards: trees, cars, crates, mushrooms, graves, barrels, duds | ~20 stamps, 4 hazards | ✅ ship | Tech Artist (grid stamps) + UI & Vector (hazard sprites) | Props are part of the destructible grid, so they stay grid stamps with better palettes. Barrels, kegs, pods and duds are small sprites: vector (R2). |
| 7 | Shots and VFX: shells, trails, blasts, lightning, tornado, splashes | ~15 | ✅ ship | Tech Artist | Code particles and shaders, as now, tuned per character. No image model. |
| 8 | UI kit: HUD, buttons, shot icons, minimap frame, menus, Custom Map screen | 1 kit, ~20 icons | ✅ ship | UI & Vector Designer | SVG and CSS (R1, R2). Shot names and numbers are text the game draws. |
| 9 | Logo, title screen key art | 1 + 1 | ✅ ship | UI & Vector (logo) + Artist (key art) | The key art becomes the **style anchor** (R3). No lettering in the painting (R1). |
| 10 | **Pixel direction:** characters with walk, aim and hit loops | 5 | 🧪 test | Artist with PixelLab (when approved) | The studio's one shippable kind of frame animation, and it matches the 8-px grid. A two-character test decides direction A or B before any set is made. Spends PixelLab credits: Hunter's OK first (R20). |
| 11 | Walk cycles in the painted direction | 5 | 🧪 test | Tech Artist | A two-frame waddle on cut-out parts. If it slides, units hop instead. |
| 12 | Animated theme details (drifting embers, snow, swaying trees) | per theme | 🧪 test | Tech Artist | Code only. Trees are destructible grid stamps, so sway may not be worth it. |
| 13 | Painted frame-by-frame character animation | — | ❌ skip | — | Drifts, and the units are 24 px. Use 2 and 11. |
| 14 | 3D or rigged-3D characters rendered to sprites | — | ❌ skip | — | See the note on rigging datasets below. Nothing in this game needs a humanoid skeleton. |

**Totals:** 9 ship, 3 test, 2 skip.

**A note on "the animator".** Hunter asked whether the animation tool he saw (a Nov 5 post about a new Hugging Face dataset of about 39,000 rigged 3D humanoid characters, with skeletons and skinning weights, for training auto-rigging models) is part of the studio. It isn't: nothing in this repo uses it, and the **Animator** in `kit/art/art-team.md` is role #8, still "to be hired" (Spine, or a PixelLab plan). For this game it wouldn't help anyway: it is training data for 3D humanoid rigs, not a tool that animates 2D sprites, and Wormsbound's units are round 24-px characters with no limbs to rig. Its licence hasn't been read (legal flag 4). If the studio later makes a 3D game, the 3D Kitbasher role (#9) is where auto-rigging belongs.

## 3. Risks (top 5), each with a fix or a fallback

1. **Genre look-alikes** (small round soldiers, bazookas, the classic artillery-game look).
   - Characters are built from their job, not from a soldier: Brick is a walking wall, Zip a courier, Volt a storm-chaser, Digger a miner, Gale a kite-flyer. Their gear, not a helmet, is the silhouette.
   - Look-alike check on every concept (R17); rejects are logged in `design/ai-assets.md`.
   - Prompts never name a game, a studio or an artist.
2. **Tiny sprites turn to mush.**
   - Judge every sprite at 24 px and at the v2 overview zoom, on a phone, before any pick (R8).
   - Each character has one loud shape and one accent colour that survives at 24 px.
   - Fallback: keep the code-drawn bodies in the match and use painted art only for portraits and menus.
3. **Ten backgrounds drift apart.**
   - One sitting, one prompt skeleton, the style anchor on every call (R3, R5), then one finishing pass (R7).
   - Fallback: paint three base skies (day, dusk, night) and recolour per theme in code from `MapGen.THEMES[id].look`.
4. **The direction is picked too late.** If sets are made before A-or-B is decided, half the work is thrown away.
   - Nothing past concepts until the two-character test (row 10) has a `Pick:`.
5. **Rights to raw AI images in a shipped build** (still open for Canva, `pipeline-upgrade.md` §7).
   - Most of this game's art is code and vector, which is ours. Only characters, portraits, backgrounds and key art are AI paintings.
   - Fallback: Gemini for finals if the legal reviewer says Canva is a 🔴.

## 4. Limits we're accepting (animation, 3D, copyright, Steam label)

- Units move by code (bob, squash, recoil, hop, blink) or, in the pixel direction, by short pixel loops. No painted frame animation.
- The terrain's shape is always the grid. Art dresses it; it can't be a painted level.
- 2D only.
- Team colours are tints in code.
- If the game reaches Steam it carries the AI disclosure, from `design/ai-assets.md` (R18).
- Raw AI paintings have weak copyright. Ours for sure: the code-drawn terrain, VFX, UI, logo, the rigs and any human edits.

## 5. Suggestions: changes to the design that make the art cheaper or safer

1. **Keep the split the game already has:** shapes the player fights over (ground, props, shots, blasts) in code; characters, skies and key art from the Artist.
2. **Give every character one piece of gear that is also its shot.** Volt's antenna calls the lightning, Gale's kite is the Kite Bomb, Digger's drill is the Drill. One silhouette explains the character and the shot, and the "champion" work after v2 gets a head start.
3. **Hop, don't walk.** Units that hop along the ground need no walk cycle, suit a toy-like look, and can't foot-slide.
4. **Theme colours come from one place.** Backgrounds are painted to the palettes already in `MapGen.THEMES`, so the code terrain and the painted sky always match, and a new theme costs one sky.
5. **Design for the zoomed-out view first.** In a 5v5 the camera shows a Giant map; what matters is a team colour and a shape. Detail is a bonus when zoomed in.

## 6. Team: who this game needs now, and later (with the trigger)

| Role | When | Trigger |
| --- | --- | --- |
| Lead Artist | now | this plan; reviews each concepts pull request |
| Artist · Concepts | now, once this plan is merged | the first request: style anchor (key art) and two test characters in directions A and B |
| UI & Vector Designer | now | the UI kit and hazard sprites need no pick on direction |
| Tech Artist | after the A/B pick | rigs, terrain fills, VFX |
| Artist · Finals | after `art-approved` on a set | character parts, portraits, backgrounds |
| Animator (#8, to be hired) | later | only if the pixel direction wins and needs more loops than the PixelLab test covers; means a PixelLab plan or Spine (Hunter's call, R20) |
| Marketing Artist | later | a public page or a trailer |

## 7. Hours and money (from pipeline-upgrade.md §6, scaled to this game)

Scaled from §6.2's "typical 2D indie game" (prices not re-checked on vendors' pages since that doc was written):

| Work | Count | Studio hours | Money |
| --- | --- | --- | --- |
| Key art (style anchor) | 1 | 3 | $0 (Canva credits) |
| Character anchors and parts | 5 | 12–20 | $0 (Canva) |
| Portraits | 5 | 3–5 | $0 (Canva) |
| Backgrounds | 10 themes | 8–14 | $0 (Canva) |
| Terrain fills, props, hazard sprites | 10 themes | 10–18 | $0 (code and vector) |
| Rigs, motion, VFX | 5 characters, ~15 effects | 14–28 | $0 (code) |
| UI kit and logo | 1 | 8–14 | $0 (vector) |
| Pixel test (direction A) | 2 characters | 2–4 | PixelLab credits: not priced here, Hunter's OK first |
| Reviews, finishing pass, records | — | 6–10 | $0 |
| **Total** | | **about 60–110** | **$0 plus the pixel test** |

If the pixel direction wins, rows 2 to 4 move to PixelLab and the money line needs a real number before anyone starts.

## 8. Legal flags for the legal reviewer

1. **Genre look-alikes:** the five character designs, before finals.
2. **The name "Wormsbound" is a working title** that leans on two existing game names. Not an art question, but the logo shouldn't be finalised until the name is.
3. **Raw AI images in a shipped build** (Canva's terms, still open studio-wide).
4. **Third-party datasets and models:** nothing from a research dataset (including the rigged-character dataset mentioned in section 2) is used, downloaded or committed. If that ever changes, its licence is read first.
5. **PixelLab's terms** haven't been read by the studio (`pipeline-upgrade.md` §7 lists them as 🟡). Read before any pixel finals.

## 9. Decisions for the game's owner

- [ ] @Louiemark, @Hunter: **approve this plan** (or say what to change). The Artist won't start concepts until it's merged.
- [ ] @Louiemark: **direction A (pixel) or B (painted cut-outs)?** Recommended: run the two-character test first (Brick and Gale, each in A and B, at 24 px on a phone), then pick.
- [ ] @Hunter: **OK to spend PixelLab credits on the two-character pixel test?** (R20)
- [ ] @Louiemark: **keep the five characters' current shapes** as the starting point for their designs, or open them up?
- [ ] @Louiemark: **hop instead of walk** (suggestion 3)?
- [ ] @Louiemark, @Hunter: which **Slack channel** should the Artist post to (it skips Slack if `art-direction.md` names none)?
