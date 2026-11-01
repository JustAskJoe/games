# Art Cottage team: who we "hire" now and later

© 2026 justaskjoe. All rights reserved.

**Status:** draft roster, Oct 31, 2026. It goes with `pipeline-upgrade.md` (the plan) and assumes the **AI-only release path**: no paid human artist, with studio members directing and curating. Nothing here exists yet except the Artist. Each new agent needs its own pull request: a file in `kit/agents/`, a row in `kit/agents/README.md`, and a row in `ARCHITECTURE.md` §5 "All agents".

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
| 1 | **Art Director** (new) | On demand | The look: drafts `art-direction.md` changes, builds the style bible, proposes anchors, reviews every set for drift before a `Pick:` | Decisions, not files | Claude, contact sheets | No |
| 2 | **Artist** (exists: Concepts + Finals) | Scheduled + button | Briefs, SVG concept sheets, raster finals from the manifest with anchors | Key art, portraits, cards, backgrounds, item art | Canva, Claude | Finals only: Canva plan credits |
| 3 | **UI & Vector Designer** (new) | On demand | Everything that must be crisp: UI kit, 9-slice panels, icons, card frames, logo, all text | UI, icons, frames, logo | Claude (SVG/CSS), Google Fonts | No |
| 4 | **Tech Artist** (new) | On demand | Motion and finish: shaders, particle VFX, code-driven animation (bob, sway, squash, expression swaps, cut-out rigs), the `post.py` finishing pass | VFX, 2D motion without frames, the unified look | Claude (code), Canva `remove-background` / `separate-image-layers` | No |
| 5 | **Asset Wrangler** (new, mostly scripts) | Workflow + the Artist | Bookkeeping: manifest status, fetch, WebP, size/alpha checks, `ai-assets.md`, Steam disclosure text | Nothing visible; keeps the release honest | `kit/art/` scripts | No |
| — | **Legal reviewer** (exists, `studio-private`) | On demand | Gets an "art licenses" checklist: Canva standalone question, FLUX 9B, each new tool | — | — | No |

### 1. Art Director
- **Why first:** in AI-only work, the director's eye *is* the quality bar. Models don't fail at single images; they fail at sets.
- **Does:**
  - writes the per-game style bible (10 to 20 approved images)
  - proposes style and character anchors
  - runs the "consistency playtest": screenshot every screen, one contact sheet, flag the odd ones out
  - says no to anything in the ❌ column
- **Never:** generates in volume, spends credits, or picks. The person picks; the director advises.
- **Setup:** `kit/agents/art-director.md`. On-demand only.

### 2. Artist (existing, upgraded)
- **Changes** (from `pipeline-upgrade.md` §8.1):
  - read the manifest and anchors
  - pass the anchors on every generate call
  - batch by category in one sitting
  - mark manifest rows
  - "vector first": hand UI, icon, frame and logo work to #3
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

Each role waits for a trigger. Don't set it up early.

| # | Role | Runs as | Trigger to "hire" | What it unlocks | Tools and likely cost (unverified unless noted) | Hunter must |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | **Headless Finals** (an upgrade to the Artist, not a new agent) | Workflow + scheduled | Canva's browser fetch becomes the bottleneck (about 30+ assets for one game) | Full-size finals with no person present; batch at half price | Gemini API, Nano Banana 2: $0.067 per 1K image, batch $0.034 (checked); inside AI Pro's $10/mo credit | Activate credit, add the API key secret, set a monthly cap |
| 7 | **Marketing Artist** | On demand | A game gets a Steam page | Capsules cropped from key art, screenshot capture, trailer shot list, social sizes | Claude + Canva; Veo for 1 or 2 mood shots (about $0.10 to $0.40 a second) | Approve trailer spend |
| 8 | **Animator** | On demand | A game needs more motion than tweens: a boss, a walking hero in 2D | Smoother skeletal rigs (✅ for 2D cut-out). Pixel walk cycles (✅ only for a pixel game). | Spine Professional, one seat (about $369 to $439 one-time); PixelLab paid tier | Buy Spine or a PixelLab plan |
| 9 | **3D Kitbasher** | On demand | A 3D game (for example Gate Runner) heads past prototype | ✅ stylized props and scenery; ✅ distant crowds and enemies (AI mesh + Mixamo rig + library animations). 🧪 hero characters. | Tripo or Meshy paid plan (about $20/mo); Blender batch-cleanup scripts Claude writes; Mixamo (free) | Approve the plan; check its commercial license |
| 10 | **Style Trainer** | On demand | One game has 50+ approved images and drift is still the top complaint | A custom style or character model trained on **our own** approved set | Scenario (Creator $15/mo, Pro $45/mo per its help center) or a LoRA | Approve the plan; the legal reviewer checks its terms |
| 11 | **Art QA** | Workflow | Two games in production at once | Automatic palette-drift, size and alpha checks and contact sheets on every finals PR | Scripts, no AI | Approve the CI change (Guard) |
| 12 | **Human art lead** (a person, not an agent) | Freelance retainer | A game's AI-only art isn't converting, or it's a bigger bet | Hero paint-overs, anchor approval, hand animation; agents become the lead's assistants | $25 to $60 an hour (third-party ranges) | Budget, contract (legal reviewer), and accept it's no longer AI only |

### Order I'd hire them in
1. **Now:** Art Director, UI & Vector Designer, Tech Artist (three on-demand agent files), the Artist upgrade, and the Wrangler scripts. Pilot on **Card Trader**.
2. **When Card Trader's manifest passes about 30 assets:** Headless Finals (#6).
3. **When Card Trader gets a Steam page:** Marketing Artist (#7).
4. **Only if a game needs it:** Animator (#8) for 2D, 3D Kitbasher (#9) for Gate Runner.
5. **Last:** Style Trainer (#10), Art QA (#11), and a human art lead (#12) if AI-only isn't selling.

## Rules every art agent follows
- Reads `CLAUDE.md`, the game's `art-direction.md`, `art/anchors/` and `art/manifest.json` first.
- One branch and one pull request per job; never merges, never pushes to `main`.
- Never spends money. Only the Artist's Finals uses Canva plan credits, and only on `art-approved` issues. Anything else that costs money needs Hunter's OK.
- Never edits `.github/`, `CLAUDE.md`, `art-direction.md` or `design/handoff.md`; proposes changes in its pull request.
- Logs every AI-made file in `design/ai-assets.md` (via the manifest).
- Stays inside the ✅ column for release work, and labels anything 🧪 as **ROUGH, not shipped**.
- Only Hunter adds secrets or deploys the site.

## Decisions for Hunter
- [ ] OK the team for now: Art Director, UI & Vector Designer and Tech Artist as on-demand agents, plus the Artist upgrade.
- [ ] Is the Art Director's review required before every `Pick:`, or only for anchors and full sets?
- [ ] Pilot game: Card Trader?
- [ ] The trigger for Headless Finals: about 30 assets, or something else?
- [ ] For each team-for-later role: confirm the trigger, or move it up.
