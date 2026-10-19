# Working in this repo

PUBLIC repo for One Fifty Labs game work. Anyone can read it, so:
- No secrets, emails, client info, revenue numbers or personal details.
- No licensed music, lyrics or third-party art. Those, and any game Hunter doesn't want public yet, go in the private repo `onefiftylabs/games-private`.
- No employer or partner work (for example anything for Pico). That stays out of GitHub.
- Ownership line on builds and decks: "© 2026 F Lane d/b/a One Fifty Labs · All rights reserved" (no "Confidential"; this repo is public). Label AI art "AI mood reference, not final art".

Layout: one folder per game (`pitch/ design/ deck/ prototype/ builds/` plus a README with status), shared tooling in `kit/`. When a pitch is approved in Pitch Forge, create `<game-slug>/` with the brief in `pitch/brief.md` and the answers in `pitch/answers.md`, add the game to the table in README.md, and commit all later work for that game there.

Decks follow `kit/decks/deck-outline.md` and `kit/decks/layouts.md` (7+ art slides in a full deck). Prototypes follow the phone-first web kit.

Before pushing, run the game's build-and-test command (table in CONTRIBUTING.md) and commit the rebuilt `builds/*.html` with the source. Each game's `design/handoff.md` (where there is one) is its current decisions; keep it up to date when a decision changes.

**Patch notes.** Each game has `<game>/patch-notes.md`, newest entry on top: `## <version> · <date> · <who> (with Claude)`, then `### What's new` (player-facing), `### Next up` and `### Watch out`. Next-up and watch-out lines are checkboxes (`- [ ] @Name: …`, or no @ if anyone can take it) that stay open until ticked with who and when.
- When someone says **"add to patch notes"**, add what they said, plus anything from the session that belongs there, to the top entry. Start a new entry if the top one is from another day or another person.
- **Before every push,** make sure the session has an entry. List everything you noticed but didn't fix or couldn't verify under Watch out: untested devices, assumptions, risky numbers, flaky tests, TODOs. Write these down even if nobody asked. The next person can't see your chat.
- Tick items the session finished. Never delete someone else's open item; tick it or ask.
- At the start of a session, run `python3 kit/open-notes.py --for <name>` and tell the person what's waiting for them.
