# Working in this repo

This repo belongs to the JustAskJoe games collective (`JustAskJoe` org on GitHub). One Fifty Labs is one member. How the collective works, and what's still up for debate, is in HOW-WE-WORK.md. Treat its proposals as drafts, not settled rules.

PUBLIC repo `JustAskJoe/games`. Anyone can read it, so:
- No secrets, emails, client info, revenue numbers or personal details.
- No licensed music, lyrics or third-party art. Those, and any game Hunter doesn't want public yet, go in the private repo `onefiftylabs/games-private`.
- No employer or partner work (for example anything for Pico). That stays out of GitHub.
- Ownership line on **new** builds, decks and docs: "© 2026 justaskjoe. All rights reserved." (no "Confidential"; this repo is public). Files that already carry "© 2026 F Lane d/b/a One Fifty Labs · All rights reserved" keep it: never rewrite an existing notice unless Hunter asks. Keep a list in each game's `design/` of which assets AI made, for Steam's AI disclosure.

Layout: one folder per game (`pitch/ design/ deck/ prototype/ builds/` plus a README with status), shared tooling in `kit/`. When a pitch is approved in the JustAskJoe Forge, Forge opens a pull request (label `new-project`) that adds `<game-slug>/` with `README.md`, `pitch/brief.md` and `patch-notes.md`. Review it, add the game to the table in README.md, merge, and commit all later work for that game there. **Never commit people's raw Forge answers**; they stay in Forge's database. (Older games have a `pitch/answers.md`; leave those as they are.)

Decks follow `kit/decks/deck-outline.md` and `kit/decks/layouts.md` (7+ art slides in a full deck). Prototypes follow the phone-first web kit.

Before pushing, run the game's build-and-test command (table in CONTRIBUTING.md) and commit the rebuilt `builds/*.html` with the source. Each game's `design/handoff.md` (where there is one) is its current decisions; keep it up to date when a decision changes.

**Patch notes.** Each game has `<game>/patch-notes.md`, newest entry on top: `## <version> · <date> · <who> (with Claude)`, then `### What's new` (player-facing), `### Next up` and `### Watch out`. Next-up and watch-out lines are checkboxes (`- [ ] @Name: …`, or no @ if anyone can take it) that stay open until ticked with who and when.
- When someone says **"add to patch notes"**, add what they said, plus anything from the session that belongs there, to the top entry. Start a new entry if the top one is from another day or another person.
- **Before every push,** make sure the session has an entry. List everything you noticed but didn't fix or couldn't verify under Watch out: untested devices, assumptions, risky numbers, flaky tests, TODOs. Write these down even if nobody asked. The next person can't see your chat.
- Tick items the session finished. Never delete someone else's open item; tick it or ask.
- At the start of a session, run `python3 kit/open-notes.py --for <name>` and tell the person what's waiting for them.

**Safety: nothing permanent or destructive without a person's explicit OK.**
- Never force-push, rewrite history (`rebase` of pushed commits, `reset --hard` on shared branches, `filter-branch`), or delete `main`. Branch rules block this on GitHub; don't try to work around them.
- Never delete a game folder, a `builds/` file, `pitch/`, `design/handoff.md`, `patch-notes.md`, anything in `kit/`, or the top-level docs unless the person in this chat asked for that specific deletion. Shelving a game means a note in its README, not deleting it.
- Never edit `.github/` (CI and Guard) or this file to loosen a check, skip tests, or get a pull request past Guard. If a check is wrong, say so and propose the fix in its own pull request.
- Work on a branch and open a pull request; never ask anyone to turn off protection. A pull request that Guard flags (deletions, rule or CI changes) needs another teammate's approval. Tell the person that, don't route around it.
- Before anything you can't easily undo (deleting files or branches, renaming a build the Lab serves, changing what the Lab or site points at), stop and confirm in chat first.
- Mistakes are recoverable from Git history: to undo a merged change, open a pull request that reverts it (`git revert`), never a force-push.

**How it's wired.** `ARCHITECTURE.md` describes every piece (Studio HQ, Forge, Lab, the Art Cottage, the Artist, CI, accounts). If your change alters how any of those work (a route, a secret, a schedule, an account, a new agent or game in the Lab), update `ARCHITECTURE.md` in the same pull request.

**Which org.** Repo-specific names (org, Forge link, Lab link, ownership line) live in `studio.json` at the repo root. Read it instead of assuming `onefiftylabs`. The `onefiftylabs` account is Hunter's own (One Fifty Labs: the website, `onefiftylabs/games-private`, `onefiftylabs/xr-app-suite`); game work for the collective goes here.
