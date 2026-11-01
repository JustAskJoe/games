# Art Cottage team: who we "hire" now and later

© 2026 justaskjoe. All rights reserved.

**Status:** draft roster, Oct 31, 2026. It goes with `pipeline-upgrade.md` (the plan) and assumes the **AI-only release path**: no paid human artist, with studio members directing and curating. Nothing here exists yet except the Artist. Each new agent needs its own pull request: a file in `kit/agents/`, a row in `kit/agents/README.md`, and a row in `ARCHITECTURE.md` §5 "All agents". How the roster shows up in Studio HQ is scoped in [Art team in Studio HQ](#art-team-in-studio-hq).

## How to read this

- **Team for now:** agents we can set up with what we already have (Claude, Canva, the PixelLab connector, the repo). **No new money**, and only the Artist's Finals run uses Canva plan credits.
- **Team for later:** agents that only make sense once a trigger happens: a game heads for a paid release, Hunter approves a tool, or a 3D game gets past prototype.
- **Runs as:**
  - *scheduled*: a Claude scheduled task, like the Artist's Concepts shift
  - *on demand*: a Claude Code agent someone calls in a session, like the legal reviewer
  - *workflow*: a GitHub Action with no AI
- **Keep it lean.** The studio is three people at about 10 hours a week each (see `kit/agents/producer.md`). So most new roles are **on-demand** agents or **scripts**, not new scheduled tasks. More scheduled agents means more pull requests waiting for the same three people.
- **Ship / test / skip** is the release bar from the plan:
  - ✅ **ship**: can go in a paid release
  - 🧪 **test**: fine for prototypes, not good enough to sell yet
  - ❌ **skip**: don't do it for now

## Team for now

| # | Role | Runs as | What it owns | Ships (✅) | Tools | Spends? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Lead Artist**, one per game (new) | On demand, plus a first draft when a game gets its first art request | The game's **art plan**: style fit for AI, ship/test/skip for every asset type, risks, limits, suggestions, the team the game needs, hours and money. Then guards the look: anchors, style bible, drift review before a `Pick:` | The plan and the decisions, not image files | Claude, contact sheets | No |
| 2 | **Artist** (exists: Concepts + Finals) | Scheduled + button | Briefs, SVG concept sheets, raster finals from the manifest with anchors | Key art, portraits, cards, backgrounds, item art | Canva, Claude | Finals only: Canva plan credits |
| 3 | **UI & Vector Designer** (new) | On demand | Everything that must be crisp: UI kit, 9-slice panels, icons, card frames, logo, all text | UI, icons, frames, logo | Claude (SVG/CSS), Google Fonts | No |
| 4 | **Tech Artist** (new) | On demand | Motion and finish: shaders, particle VFX, code-driven animation (bob, sway, squash, expression swaps, cut-out rigs), the `post.py` finishing pass | VFX, 2D motion without frames, the unified look | Claude (code), Canva `remove-background` / `separate-image-layers` | No |
| 5 | **Asset Wrangler** (new, mostly scripts) | Workflow + the Artist | Bookkeeping: manifest status, fetch, WebP, size/alpha checks, `ai-assets.md`, Steam disclosure text | Nothing visible; keeps the release honest | `kit/art/` scripts | No |
| — | **Legal reviewer** (exists, `studio-private`) | On demand | Gets an "art licenses" checklist: Canva standalone question, FLUX 9B, each new tool | — | — | No |

### 1. Lead Artist (one per game)
- **Why first:** in AI-only work, the lead's judgment *is* the quality bar. Models don't fail at single images; they fail at sets. Every game also needs someone to say up front what AI can and can't do *for this game*, before anyone spends hours.
- **Keeper of the house rules.** The Lead Artist applies `kit/art/art-rules.md` (for example R1: no text in generated images; the game draws all text), logs what the studio learns in `kit/art/lessons.md`, proposes new rules when a lesson repeats, and researches best practices with cited sources. People adopt rules; the agent only proposes them.
- **One agent file, one instance per game.** `kit/agents/lead-artist.md` (drafted, not hired yet) is written once. Each game gets its own plan at `<game>/art/lead-plan.md` and is assigned the same way the Artist is (`GAMES:` / `PROJECTS:`).
- **When it runs:**
  - **First draft:** when a game gets its first art request, or right after Forge's Approve adds the game. It opens a PR with `<game>/art/lead-plan.md` (and a draft `art-direction.md` if there isn't one), for the crew to review.
  - **Again:** when the game's genre, camera (2D/3D) or release target changes, or someone asks.
  - **During production:** reviews each full set for drift and runs the consistency playtest before a `Pick:` on anchors and sets.
- **Never:** generates images, spends credits, or picks. The person picks; the lead advises.
- **"To be hired":** until a game's plan is approved, that game's Lead Artist shows as **to be hired** in Studio HQ.

#### The lead plan (`<game>/art/lead-plan.md`)
The Lead Artist fills in this template. The status block at the top is short `key: value` lines so Studio HQ can read it without an AI.

```
# <Game>: lead art plan

© 2026 justaskjoe. All rights reserved.

status: draft            # draft | approved | needs-update
updated: 2026-10-31
camera: 2d               # 2d | 3d | 2.5d
release_target: web      # prototype | web | steam | mobile
style_fit: good          # good | risky | poor  (how well this look suits AI-only art)
ship: 7                  # number of asset types in each tier, from the table below
test: 2
skip: 1
hours_estimate: 120-200
money_estimate: $50-150
team_needed: lead-artist, artist, ui-vector, tech-artist
team_later: marketing-artist

## 1. The look in one paragraph, and why it suits (or fights) AI
## 2. Asset types: ship / test / skip
| Asset type | Count | Tier | Who makes it | Why |
## 3. Risks (top 5), each with a fix or a fallback
## 4. Limits we're accepting (animation, 3D, copyright, Steam label)
## 5. Suggestions: changes to the design that make the art cheaper or safer
## 6. Team: who this game needs now, and later (with the trigger)
## 7. Hours and money (from pipeline-upgrade.md §6, scaled to this game)
## 8. Legal flags for the legal reviewer
## 9. Decisions for the game's owner (checkboxes)
```

**Example rows** for Card Trader (to show the idea, not a real plan yet):

| Asset type | Tier | Who | Why |
| --- | --- | --- | --- |
| Card illustrations | ✅ ship | Artist (Canva + anchors) | Stills in a flat cel style hold together well |
| Shopkeeper and customers | ✅ ship | Artist + Tech Artist (expression swaps, cut-out bob) | Reacting characters, no walk cycles |
| Card frames, prices, UI | ✅ ship | UI & Vector Designer | Text and crisp edges stay out of image models |
| Customer walk-in animation | 🧪 test | Tech Artist (tween) | Frame animation would drift; keep it a slide-and-bob |
| A 3D shop view | ❌ skip | — | Hero 3D is out of scope for AI-only |

### 2. Artist (existing, upgraded)
- **Changes** (from `pipeline-upgrade.md` §8.1):
  - read the manifest, the anchors and the lead plan
  - pass the anchors on every generate call
  - batch by category in one sitting
  - mark manifest rows
  - "vector first": hand UI, icon, frame and logo work to #3
  - don't make anything the lead plan marks ❌
- **Setup:** edits to `kit/agents/artist.md` in their own PR. No new scheduled task.

### 3. UI & Vector Designer
- **Why:** image models are at their worst on crisp edges and text, and Claude is at its best there. This role takes the most obviously "AI-looking" category off the image models entirely.
- **Does:** the UI kit, states (normal/pressed/disabled), icon sets on one grid, card frames per rarity, logo wordmarks from a licensed font, readability at real phone size.
- **Setup:** `kit/agents/ui-designer.md`.

### 4. Tech Artist
- **Why:** this is how an AI-only game gets motion without frame-to-frame drift, and one consistent look.
- **Does:**
  - the toon/outline shader
  - the particle library
  - tweened cut-out characters
  - the finishing pass that gives every asset the same palette, outline weight and grain
  - performance checks on a mid-range phone
- **Setup:** `kit/agents/tech-artist.md`, plus `kit/art/post.py` (from the plan).

### 5. Asset Wrangler
- **Why:** it frees the three humans from bookkeeping.
- **Shape:** scripts first (`post.py`, a size/alpha check, generating `ai-assets.md` from the manifest). The Artist calls them, and there's no separate agent until the volume needs one. A CI check (in its own PR, needs Guard approval) can come later.

### What the team for now can't do (and won't try)
- 🧪 Painted frame-by-frame animation: prototypes only.
- 🧪 Anything 3D beyond a prototype.
- ❌ A hero character the camera stays close to while it animates.
- ❌ Text inside generated images.
- ❌ Cutscenes.

## Team for later

Each role waits for a trigger. Don't set it up early. A game's lead plan says which of these it will need.

| # | Role | Runs as | Trigger to "hire" | What it unlocks | Tools and likely cost (unverified unless noted) | Hunter must |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | **Headless Finals** (an upgrade to the Artist, not a new agent) | Workflow + scheduled | Canva's browser fetch becomes the bottleneck (about 30+ assets for one game) | Full-size finals with no person present; batch at half price | Gemini API, Nano Banana 2: $0.067 per 1K image, batch $0.034 (checked); inside AI Pro's $10/mo credit | Activate credit, add the API key secret, set a monthly cap |
| 7 | **Marketing Artist** | On demand | A game gets a Steam page | Capsules cropped from key art, screenshot capture, trailer shot list, social sizes | Claude + Canva; Veo for 1 or 2 mood shots (about $0.10 to $0.40 a second) | Approve trailer spend |
| 8 | **Animator** | On demand | A game needs more motion than tweens: a boss, a walking hero in 2D | Smoother skeletal rigs (✅ for 2D cut-out). Pixel walk cycles (✅ only for a pixel game). | Spine Professional, one seat (about $369 to $439 one-time); PixelLab paid tier | Buy Spine or a PixelLab plan |
| 9 | **3D Kitbasher** | On demand | A 3D game (for example Gate Runner) heads past prototype | ✅ stylized props and scenery; ✅ distant crowds and enemies (AI mesh + Mixamo rig + library animations). 🧪 hero characters. | Tripo or Meshy paid plan (about $20/mo); Blender batch-cleanup scripts Claude writes; Mixamo (free) | Approve the plan; check its commercial license |
| 10 | **Style Trainer** | On demand | One game has 50+ approved images and drift is still the top complaint | A custom style or character model trained on **our own** approved set | Scenario (Creator $15/mo, Pro $45/mo per its help center) or a LoRA | Approve the plan; the legal reviewer checks its terms |
| 11 | **Art QA** | Workflow | Two games in production at once | Automatic palette-drift, size and alpha checks and contact sheets on every finals PR | Scripts, no AI | Approve the CI change (Guard) |
| 12 | **Human art lead** (a person, not an agent) | Freelance retainer | A game's AI-only art isn't converting, or it's a bigger bet | Hero paint-overs, anchor approval, hand animation; the Lead Artist agent becomes the person's assistant | $25 to $60 an hour (third-party ranges) | Budget, contract (legal reviewer), and accept it's no longer AI only |

### Order I'd hire them in
1. **Now:** the Lead Artist (first plan for **Card Trader**), then the UI & Vector Designer and Tech Artist, the Artist upgrade, and the Wrangler scripts.
2. **Each new game:** a Lead Artist plan before any concepts.
3. **When Card Trader's manifest passes about 30 assets:** Headless Finals (#6).
4. **When Card Trader gets a Steam page:** Marketing Artist (#7).
5. **Only if a game's lead plan needs it:** Animator (#8) for 2D, 3D Kitbasher (#9) for Gate Runner.
6. **Last:** Style Trainer (#10), Art QA (#11), and a human art lead (#12) if AI-only isn't selling.

## Rules every art agent follows
- Follows the adopted house rules in `kit/art/art-rules.md`, and notes anything new in `kit/art/lessons.md`.
- Reads `CLAUDE.md`, the game's `art/lead-plan.md`, `art-direction.md`, `art/anchors/` and `art/manifest.json` first.
- One branch and one pull request per job; never merges, never pushes to `main`.
- Never spends money. Only the Artist's Finals uses Canva plan credits, and only on `art-approved` issues. Anything else that costs money needs Hunter's OK.
- Never edits `.github/`, `CLAUDE.md`, an approved `lead-plan.md`, `art-direction.md` or `design/handoff.md`; proposes changes in its pull request. (The Lead Artist writes *draft* plans.)
- Logs every AI-made file in `design/ai-assets.md` (via the manifest).
- Stays inside the ✅ column for release work, and labels anything 🧪 as **ROUGH, not shipped**.
- Only Hunter adds secrets or deploys the site.

## Art team in Studio HQ

**Scope only.** Studio HQ's code is in the private `JustAskJoe/forge` repo, so the build is a pull request there, and only Hunter deploys it. This section says what to build. No new secrets, no new database tables, and nothing that spends.

### What people see
In the **Art Cottage**, a new **"Art team"** panel next to requests and votes, in three columns:

| Hired | To be hired (now) | Later |
| --- | --- | --- |
| Artist · Concepts, Artist · Finals | Lead Artist, UI & Vector Designer, Tech Artist, Asset Wrangler | Headless Finals, Marketing Artist, Animator, 3D Kitbasher, Style Trainer, Art QA, Human art lead |

- **Each card:** the role's name, one line on what it does, how it runs (scheduled / on demand / workflow), whether it spends, and for "later" roles, the **trigger**. A link to its row in this file.
- **Per game, under the panel:** one row per game from `games.json`:
  - **Lead Artist:** *to be hired* (no `lead-plan.md`), *draft*, *approved* or *needs update*, linking the file on GitHub
  - **Style fit** (good / risky / poor) and **ship · test · skip** counts from the plan's status block
  - **Team needed** as small chips; a chip is grey if that role isn't hired yet
- **Agent Lane:** add the new art roles to the agents list as *planned* ("Not hired yet"), in the Art Cottage, sharing the **Artist's house**. The village shows the last agent listed for a house, so the art roles go **before** the two Artist entries.

### Where the data comes from
- **The roster:** HQ's agents list already holds name, does, when, runs, building, status and home for every agent, including "planned" ones. Add the art roles there with `building: "art-cottage"`, `home: "artist"`, `status: "planned"`. Add a `later: true` flag and a `trigger` line for team-for-later roles. **Phase 1 needs only this.**
- **Per-game plans (Phase 2):** for each game in `games.json`, read `<game>/art/lead-plan.md` from the games repo with the GitHub key HQ already uses. Parse only the status block (simple `key: value` lines, no AI), and cache it like the Art Cottage's other GitHub reads (a couple of minutes). A missing file means "to be hired".
- **Moving a role to "Hired":** a pull request that adds its `kit/agents/<role>.md` file and flips its HQ status to `live`. No button does this.

### Optional (Phase 3)
- **"Ask to hire" button** on a "to be hired" card: opens an issue in the games repo labelled `hire:art` with the role and game, for Hunter to decide. Same daily cap as art requests. Only a person's PR actually hires.
- **"Draft lead plan" button** per game: starts the Lead Artist for that game, the way "Run her now" starts the Artist. It needs its own routine and trigger key (a new Worker secret Hunter adds), so it waits until the Lead Artist is a scheduled task. Until then, someone runs it in a Claude Code session.

### Done means
- The Art Cottage shows the three columns and the per-game rows, with no new secrets or tables.
- Tests in the forge repo cover: a missing plan reads as "to be hired"; a broken status block is ignored, not a crash; planned art roles don't replace the Artist on Agent Lane.
- `ARCHITECTURE.md` §5 (agents table and Art Cottage paragraph) is updated in the games repo in the same change set.

## Decisions for Hunter
- [ ] OK the team for now: the Lead Artist (one per game), the UI & Vector Designer and the Tech Artist as on-demand agents, plus the Artist upgrade.
- [ ] Should every new game need an approved lead plan before its first concepts run?
- [ ] Is the Lead Artist's drift review required before every `Pick:`, or only for anchors and full sets?
- [ ] Pilot game: Card Trader?
- [ ] Studio HQ: build Phase 1 (roster only) now, or wait and build Phases 1 and 2 together?
- [ ] The trigger for Headless Finals: about 30 assets, or something else?
- [ ] For each team-for-later role: confirm the trigger, or move it up.
