# Tower Defense: patch notes

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked. Checkbox items stay open until someone ticks them (`- [x] … (done Oct 21, Joe)`). See open items for everyone with `python3 kit/open-notes.py`, or just yours with `--for Joe`.

Say **"add to patch notes"** to Claude any time to add to the top entry. Claude also adds one before every push.

---

## 1.1 · Oct 31, 2026 · Hunter (with Claude)
Art only, no build change.

### What's new
- Nothing player-facing.

### Next up
- [x] `art/art-direction.md` listed `final_art_source` twice (`undecided`, then `canva`). Kept `canva`, the Oct 28 pick. (Hunter with Claude, Oct 31, 2026)
- [ ] Give Tower Defense a Lead Artist plan (`art/lead-plan.md`, see `kit/agents/lead-artist.md`) before its next concepts run. New studio rule: every game needs an approved lead plan first.

### Watch out
- [ ] `canva_roughs: on` in the settings block isn't read by the Artist agent; `roughs:` is the setting that counts.

## 1.1 · Oct 28, 2026 · Artist agent (with Claude)
Art only, no build change.

### What's new
- **Arrow tower concepts (#9), the painted vs pixel test.** Brief in `art/briefs/9-arrow-tower.md`; two concept sheets, `art/concepts/9-A.svg` (painted) and `art/concepts/9-B.svg` (pixel, 40 × 48 at 2x). Each shows the tower at 1x and 3x on grass and road, the button, a board scene, base / Pierce II / Multishot II, and the palette.
- Three Canva painted roughs, linked in the pull request (not committed).

### Next up
- [x] Crew: open both sheets on a phone and reply `Pick: A` or `Pick: B` on the concepts pull request (this is the painted vs pixel call). (done Oct 28, Hunter: Pick A, painted)
- [x] Whoever picks: record the answer in `art/art-direction.md` (`final_art_source`) and `design/handoff.md`, and fill the cost table so the next run can price finals. (done Oct 28, Hunter with Claude: `canva`; cost per generation still blank, see below)
- [ ] @Hunter: fill "cost each" for Canva in the cost table (plan credits or $ per generation), then add `art-approved` to #9 when you want the finals run.

### Watch out
- [ ] Sheets were checked only in headless Chromium (desktop and a 390 px phone viewport), not on a real iPhone or Android.
- [ ] The pixel sheet (B) is a quick hand-set sketch of the same shapes, not polished pixel art: the Pierce bolt and the Multishot arrow fan are muddy at 40 × 48. Judge the style, not the pixel cleanup.
- [ ] Multishot mechanically **fires twice as fast** (`prototype/engine.js`), but the issue asked it to *look* spread and busy, so the sheets show a fan of arrows. Players may read that as "hits several targets". Worth a name or art check.
- [ ] The Canva roughs are much more detailed than an 80 px cell can show, and roughs A and B came out almost the same (pixel B's rough is softly "pixel-ish", not true 2x pixels). Use the SVG sheets for the phone comparison.
- [ ] No cost estimate in dollars or credits yet: source is now `canva`, but Canva's cost per generation isn't in the cost table. Count only: about 5 generations (4 images + 25%).
- [ ] Canva finals: cloud runs only get 199 × 112 thumbnails; full-size images need the built-in browser trick in `kit/art/README.md`, and then a background-removal step for transparent 160 × 192 exports. The finals run hasn't been tried yet.
- [ ] Brief reference links (Wikimedia Commons categories) weren't opened by the agent; check they still resolve.

## 1.1 · Oct 28, 2026 · Hunter (with Claude): repo move
Docs only, no build change.

### What's new
- **The games repo now lives at `JustAskJoe/games`.** GitHub redirects the old `onefiftylabs/games` links, and the Lab already reads from the new home.
- `studio.json` at the repo root names the org, Forge, the Lab and the ownership line, so Claude and the skills stop assuming `onefiftylabs`.
- New files carry "© 2026 justaskjoe. All rights reserved." Existing notices stay as they are.

### Next up
- [ ] @Joe: point your local copy at the new home: `git remote set-url origin https://github.com/JustAskJoe/games.git`
- [ ] @Zach: same command, if you have a local copy.
- [x] @Hunter: fill in `forgeUrl` in `studio.json` once the JustAskJoe Forge is live. (done Oct 28: https://jaj-forge.huntefl.workers.dev)

### Watch out
- [ ] The Artist's scheduled tasks and Studio HQ still name `onefiftylabs/games` until they're switched to the JustAskJoe ones.
- [x] Preview links still go to onefiftylabs.co/lab (the `LAB_URL` repo variable). Changing it to a JustAskJoe Lab needs that Lab to exist first. (done Oct 28: the JustAskJoe Lab is live at https://jaj-forge.huntefl.workers.dev/lab; LAB_URL points there)

## 1.1 · Oct 28, 2026 · Hunter (with Claude)
Art only, no build change.

### What's new
- **Art agent setup.** A shared Artist agent (`kit/agents/artist.md`) now makes briefs and free concept sheets for art requests, then final art only after a person approves.
- **`art/art-direction.md`:** the palette (hex codes from Prototype 1), sizes and pipeline settings the agent follows.
- **`design/ai-assets.md`:** the AI-made asset log for Steam's AI disclosure.
- **Free painted roughs:** the Artist now gets full-size painted roughs from Cloudflare Workers AI (Flux Schnell) through the new Art roughs workflow, instead of Canva thumbnails. Set by `roughs: cloudflare` in `art/art-direction.md`.

### Next up
- [ ] @Hunter: create the labels and the Concepts routine (steps in `kit/agents/README.md`).
- [x] @Hunter: open the first art request: Arrow tower, one painted and one pixel direction. (done Oct 28, Hunter: issue #9)
- [x] Crew: pick painted or pixel finals from the first concept sheets, then record it in `art/art-direction.md` and `design/handoff.md`. (done Oct 28, Hunter: painted, Canva)

### Watch out
- [ ] The agent hasn't run yet. The first concepts run is the real test of the SVG sheets and the Canva links.
- [ ] Canva roughs (the fallback) are links only: cloud runs can't fetch full-size Canva images (see `kit/art/README.md`).
- [x] The agent hasn't run yet. The first concepts run is the real test of the SVG sheets and the Canva links. (done Oct 28, Artist agent: first run on #9; see its entry above)
- [ ] Canva roughs are links only: cloud runs can't fetch full-size Canva images (see `kit/art/README.md`).
- [ ] The `#td-studio` Slack channel may not exist; the agent skips Slack if it doesn't.
- [ ] The final-art cost table in `art/art-direction.md` is empty until a source is chosen.
- [ ] @Hunter: add the `ART_KEY` Actions secret (Claude has the value) or the Art roughs workflow makes nothing.
- [ ] The Art roughs workflow hasn't run against the live endpoint yet; the first real run is the test. Its commits don't re-run Checks on the pull request.
- [ ] Flux Schnell's license allows commercial use as far as we know; confirm before any rough becomes final art (roughs aren't meant to ship).

## 1.1 · Oct 19, 2026 · Hunter (with Claude)
Play: onefiftylabs.co/lab/tower-defense/

### What's new
- **Tester tools** (☰ → Tester tools):
  - Jump to any wave. A bot plays the earlier waves, so you land on a fair board.
  - +500 gold, repair the keep, invincible keep, add any card.
  - Runs that use them get a TESTER tag and are flagged in feedback.
- **Placeholder music:**
  - Lute and recorder while you build, a drum pulse during waves.
  - Cues when you hold a wave, when the road grows, and when you win or lose.
  - ♪ in the bottom left turns it on and off.
- **On the website:** the Lab serves the build straight from GitHub, so it's always current.
- **Unchanged:** balance (smart bot wins about 55%), towers, enemies, waves and cards.
- **Behind the scenes:**
  - Every action goes through `TD.act()`.
  - Co-op server base added in `server/` (not in the game yet).
  - `build-and-test.py` runs every check in one command.
  - New docs: `design/handoff.md`, `design/playtest-notes.md`, `CONTRIBUTING.md`.

### Next up
- [ ] @Hunter @Joe: Play P1.1 (try Tester tools → wave 10 for the Warlord) and log runs in `design/playtest-notes.md`. Pass bar: both of you start a second run unprompted.
- [x] @Hunter: Add Joe and Zach as collaborators on `onefiftylabs/games`. (done Oct 28: the repo moved to `JustAskJoe/games`; access is now the **games** team)
- [ ] @Hunter @Joe @Zach: Pick lane owners (handoff.md → "Open: team lanes").
- [ ] Tech lane: Make the engine call (desktop wrapper or Godot) before starting Prototype 2.
- [x] @Hunter: Turn on branch protection for `main`. (Done Oct 19, Hunter. A direct push to `main` is now rejected.)
- [ ] @Hunter: Delete the leftover test branch `claude/ci-preview-test` ("Delete branch" button on closed pull request #1).

### Behind the scenes (added later on Oct 19)
- **Automatic checks:** every pull request runs build-and-test on GitHub and blocks merging if it fails.
- **Preview links:** each pull request gets a link to play that branch on the Lab before merging (`/lab/tower-defense@<branch>/`).
- **Tested end to end:** a test pull request passed the check and got its preview link.
- **Guard:** pull requests that delete builds, briefs, handoff docs, patch notes or kit files, or that change CI or repo rules, now need another teammate's approval. Claude's rules forbid force-pushes and unrequested deletions.

### Watch out
- [ ] **Co-op sync is only proven in Node.** Both phones must compute identical results. `Math.hypot` and `Math.pow` could differ slightly between Safari and Chrome, which would drift a co-op game. Test an iPhone against a desktop Chrome before Prototype 2 relies on it. The per-wave hash check will show any drift.
- [ ] **Music has only been tested in a headless browser.** Check on a real iPhone: the silent switch mutes Web Audio, and it may be too loud or repetitive over a 20-minute run.
- [ ] **The build file is still named `tower-defense-p1.html`** even though it's 1.1. That's on purpose, so links don't break. Rename only together with `src/lab.js` in the site repo.
- [ ] **Feedback from tester runs goes to the same database.** Filter out `tester: true` before drawing balance conclusions.
- [ ] **The balance sim's bots never sell towers or use tester tools,** and only play the three styles. Human results may differ from the sim's 55%.
- [ ] **Automatic checks only cover Tower Defense and `kit/`.** Other games still rely on their manual test commands until they're added to `.github/workflows/checks.yml`.
- [ ] **CI installs Playwright and Chromium on every run** (a couple of minutes). Fine on a public repo; worth caching if runs get slow.
- [ ] **The co-op server isn't hosted anywhere yet.** Prototype 2 needs a host. Cloudflare (which already runs the site) can do it with Durable Objects.

---

## 1.0 · Oct 19, 2026 · Hunter (with Claude)
First playable (Prototype 1), solo. One road that grows twice, 4 towers with two upgrade branches each, 5 enemies, 10 waves, 14 draft cards, the coach Pell, a feedback form and an in-page bot sim.
