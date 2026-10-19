# Working on One Fifty Labs games

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

How to get set up and add work to this repo without stepping on each other. This applies to every game here. Each game's own README covers its specifics.

## 1. Get access and set up (once)
1. **Get added:** Hunter adds you as a collaborator on `onefiftylabs/games` (GitHub → Settings → Collaborators). Accept the email invite.
2. **Install:**
   - [Git](https://git-scm.com/downloads) and a GitHub login (GitHub Desktop is fine if you'd rather click than type)
   - [Node.js 18+](https://nodejs.org) for balance sims and multiplayer servers
   - [Python 3.10+](https://www.python.org/downloads/) for build scripts
   - Playwright, for the automated phone tests:
     ```
     pip install playwright
     python -m playwright install chromium
     ```
3. **Clone:**
   ```
   git clone https://github.com/onefiftylabs/games.git
   cd games
   ```

### Initial setup with Claude (once)
After the invite is accepted and GitHub is connected in your own Claude (Settings → Connectors, allow the `onefiftylabs` repos), paste this into a new chat:
```
Initial setup: I'm joining the collective to work on games in the GitHub repo onefiftylabs/games. Walk me through getting set up, one step at a time, and check each step before moving on:
1. Confirm you can see onefiftylabs/games. If you can't, tell me exactly what I'm missing (a GitHub connection in Claude, or the collaborator invite).
2. Clone it and confirm you can push: push a test branch named <my name>/setup-check, then delete it.
3. Read HOW-WE-WORK.md, CLAUDE.md, CONTRIBUTING.md, README.md and kit/INDEX.md.
4. Run python3 tower-defense/build-and-test.py to confirm the tools work here.
5. Give me a short tour: how the collective works, the games and their status, how a game folder is laid out, the rules for this public repo, and how every work session starts and ends.
6. Finish by giving me the start-work and end-work prompts from CONTRIBUTING.md to save.
Don't change anything in the repo.
```
You only run this once. After that, every session uses the start and finish prompts in section 7.

## 2. Play a build
Builds are single HTML files in each game's `builds/` folder. Open one in any browser (phone width is the target). On GitHub, `.html` shows as source, so download the file or play it from the Lab page on onefiftylabs.co.

## 3. Make a change
We each have about 10 hours a week, often at odd times, so changes go through a short-lived branch and a pull request. That way nobody overwrites anyone, and the other person sees what changed.

```
git checkout main && git pull                 # start from the latest
git checkout -b joe/frost-tower-rework        # yourname/what-you're-doing
# ...edit, then build and test (step 4)...
git add -A && git commit -m "Frost: Deep Freeze slows 70%, lasts 2.4s"
git push -u origin joe/frost-tower-rework
```
Then open a pull request on GitHub and tag the other person.
- **`main` is protected:** every change goes through a pull request, and it can only merge once the automatic checks pass (step 4). Nobody pushes straight to `main`, Claude included.
- **Small, obvious fixes** (a typo, a README line) still get a pull request, but you can merge it yourself as soon as the check is green.
- **Anything that changes how a game plays:** tag the others and give them a chance to play the preview before you merge.
- **Keep PRs to one idea.** "Rework Frost" is good. "Frost + new enemy + menu redesign" isn't.
- **Commit messages say what changed for the player,** not which file moved.
- **Don't commit generated junk:** `node_modules/`, screenshots from test runs unless they show something, `.DS_Store`.

## 4. Build and test before you push
Every prototype has a one-file **build** (the parts are joined into `builds/<game>.html`) and an automated **phone test**. Run the game's script from the repo root:

| Game | Before you push |
|---|---|
| Tower Defense | `python3 tower-defense/build-and-test.py` (`--quick` skips the browser) |
| Trickbound | `cd trickbound/prototype/v1 && python3 build-and-test.py` |
| Tilebound | `cd tilebound/prototype/v2 && python3 build-and-test.py` |
| Hexed | `cd hexed/prototype/v1 && python3 build.py && python3 test.py` |
| Neon Surf | `cd neon-surf/prototype/v1 && python3 build.py && python3 test.py` |

What the checks cover:
- **Balance sims** (`node sim.js`) play hundreds of games with bots. If you touch numbers (towers, enemies, cards, levels), run the sim and put the before and after win rates in your PR.
- **Phone tests** fail on any JavaScript error or sideways scrolling at 390 and 320 px wide.
- **Commit the rebuilt `builds/*.html`** with your source change, so the playable file always matches the code.

### Checks and previews (automatic)
Every pull request runs **Build and test** on GitHub. You'll see a yellow dot, then a green check or a red X, on the pull request.
- **It always:** scans for anything that looks like a key or token (the repo is public).
- **When Tower Defense or `kit/` changes,** it also runs the full `build-and-test.py` (build, balance band, co-op server tests, phone test) and confirms the committed build matches the source.
- **A red X blocks merging.** Click "Details" to see why; the error line says what to do. Or ask Claude: "the check failed on my PR, fix it."
- **Preview links:** the check posts a comment on the pull request with a link to play your branch on the Lab: `onefiftylabs.co/lab/<game>@<branch>/` (behind the site password). It updates within about a minute of each push, so teammates can play a change before it merges.
- **Turning on protection (repo admin, once):** GitHub → `onefiftylabs/games` → Settings → Branches → Add branch protection rule. Branch name `main`. Tick "Require a pull request before merging" (set required approvals to 0), "Require status checks to pass" (search for and add **Build and test**), and "Do not allow bypassing the above settings". Save.
- Only Tower Defense is tested automatically so far. Other games keep their manual commands above until they're added to `.github/workflows/checks.yml`.

## 5. Rules for this repo (it's public)
- **No secrets:** no passwords, API keys, emails, client info, revenue numbers or personal details.
- **No licensed music, lyrics or third-party art.** Placeholder music is synthesized in code. Keep track of which assets AI made, for Steam's AI disclosure.
- **No employer or partner work** (for example anything for Pico).
- **Ownership line** on builds and decks: "© 2026 F Lane d/b/a One Fifty Labs · All rights reserved". No "Confidential" here; this repo is public.
- **Private work** goes in `onefiftylabs/games-private`.

## 6. Where things go
Each game gets one folder:
```
<game>/
  README.md     what it is, status, how to play, how to work on it
  pitch/        the brief and answers from Pitch Forge
  design/       handoff doc, scope, playtest notes
  deck/         pitch deck source
  prototype/    playable source (phone-first web)
  builds/       single-file playable builds
```
- **Start with the game's `design/handoff.md`** where there is one. It's the current decisions in one page.
- **Shared tools** (deck generator, art workflow, snippets) live in [`kit/`](kit/). [`kit/INDEX.md`](kit/INDEX.md) lists every reusable piece and the lessons learned so far.
- **When you finish something reusable** (a system, a trick, a lesson), add it to `kit/INDEX.md` so the next prototype starts further ahead.

## 7. Working with Claude
Claude reads [`CLAUDE.md`](CLAUDE.md) in this repo, so it already knows these rules. Use these two prompts so every session starts and ends the same way. Swap in the game's folder name (`tower-defense`, `trickbound`, …).

**Starting a session.** Paste this into a new chat:
> I'm <your name>. Work on Tower Defense in the GitHub repo `onefiftylabs/games`. Clone it, read `CLAUDE.md`, `CONTRIBUTING.md`, `tower-defense/design/handoff.md` and the top entry of `tower-defense/patch-notes.md`, run `python3 kit/open-notes.py --for <your name>`, then run `python3 tower-defense/build-and-test.py` to make sure everything passes. Tell me what state the game is in, what's waiting for me, and any open watch-outs, and wait for me before changing anything. Do all work on a branch named `<your name>/<what you're doing>` and open a pull request when it's done.

**Finishing a session.** Before you stop for the day:
> Wrap up. Run `python3 tower-defense/build-and-test.py` and fix anything it flags. Add to patch notes: what's new, next up for each person, and watch-outs for anything you noticed but didn't fix or couldn't check; tick what we finished. Update `tower-defense/design/handoff.md`: status line, any decisions we made today, and the "Next" list. Add playtest results to `design/playtest-notes.md` if we played. If we built something reusable, add it to `kit/INDEX.md`. Commit the rebuilt build with the source, push the branch and open a pull request. Then tell me in a few lines: what changed, what's next, and anything left unfinished or broken.

**Mid-session:** say **"add to patch notes"** any time and Claude adds it to the game's `patch-notes.md`. Claude also writes an entry before every push, including watch-outs it noticed on its own.

**Patch notes** (`<game>/patch-notes.md`) are the running log: newest entry on top, each with *What's new* (player-facing, ready to share), *Next up* and *Watch out*. The last two are checkboxes addressed with `@Name` (or nobody, if anyone can take it), and they stay open until someone ticks them. To see what's open:
```
python3 kit/open-notes.py               # everything
python3 kit/open-notes.py --for Joe     # yours plus anything unassigned
```

The finish prompt is what keeps two people at 10 hours a week in sync. The next person's start prompt reads the handoff doc you just updated, so nothing lives only in someone's chat.

**Private work** uses the same prompts with the repo swapped to `onefiftylabs/games-private`, never the public copy.

**Before Claude can push for you:** you need collaborator access on the repo (step 1), and Claude needs GitHub connected on your own account.
