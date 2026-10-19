# Tower Defense: patch notes

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

Newest on top. Each entry covers **what's new** for players, **next up** for the team, and **watch out**: things noticed but not fixed or checked. Checkbox items stay open until someone ticks them (`- [x] … (done Oct 21, Joe)`). See open items for everyone with `python3 kit/open-notes.py`, or just yours with `--for Joe`.

Say **"add to patch notes"** to Claude any time to add to the top entry. Claude also adds one before every push.

---

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
- [ ] @Hunter: Add Joe and Zach as collaborators on `onefiftylabs/games`.
- [ ] @Hunter @Joe @Zach: Pick lane owners (handoff.md → "Open: team lanes").
- [ ] Tech lane: Make the engine call (desktop wrapper or Godot) before starting Prototype 2.

### Watch out
- [ ] **Co-op sync is only proven in Node.** Both phones must compute identical results. `Math.hypot` and `Math.pow` could differ slightly between Safari and Chrome, which would drift a co-op game. Test an iPhone against a desktop Chrome before Prototype 2 relies on it. The per-wave hash check will show any drift.
- [ ] **Music has only been tested in a headless browser.** Check on a real iPhone: the silent switch mutes Web Audio, and it may be too loud or repetitive over a 20-minute run.
- [ ] **The build file is still named `tower-defense-p1.html`** even though it's 1.1. That's on purpose, so links don't break. Rename only together with `src/lab.js` in the site repo.
- [ ] **Feedback from tester runs goes to the same database.** Filter out `tester: true` before drawing balance conclusions.
- [ ] **The balance sim's bots never sell towers or use tester tools,** and only play the three styles. Human results may differ from the sim's 55%.
- [ ] **The co-op server isn't hosted anywhere yet.** Prototype 2 needs a host. Cloudflare (which already runs the site) can do it with Durable Objects.

---

## 1.0 · Oct 19, 2026 · Hunter (with Claude)
First playable (Prototype 1), solo. One road that grows twice, 4 towers with two upgrade branches each, 5 enemies, 10 waves, 14 draft cards, the coach Pell, a feedback form and an in-page bot sim.
