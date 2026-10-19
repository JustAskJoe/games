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
- **Small, obvious fixes** (a typo, a README line) can go straight to `main`.
- **Anything that changes how a game plays** gets a PR, even if you merge it yourself, so it's visible.
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

## 5. Rules for this repo (it's public)
- **No secrets:** no passwords, API keys, emails, client info, revenue numbers or personal details.
- **No licensed music, lyrics or third-party art.** Placeholder music is synthesized in code. AI art is labeled "AI mood reference, not final art".
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
Claude reads [`CLAUDE.md`](CLAUDE.md) in this repo, so it already knows these rules. Point it at a game's `design/handoff.md` and say what you want. It can run the build-and-test scripts itself. Review its PR like anyone else's.
