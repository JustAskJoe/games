# Working in this repo

PUBLIC repo for One Fifty Labs game work. Anyone can read it, so:
- No secrets, emails, client info, revenue numbers or personal details.
- No licensed music, lyrics or third-party art. Those, and any game Hunter doesn't want public yet, go in the private repo `onefiftylabs/games-private`.
- No employer or partner work (for example anything for Pico). That stays out of GitHub.
- Ownership line on builds and decks: "© 2026 F Lane d/b/a One Fifty Labs · All rights reserved" (no "Confidential"; this repo is public). Label AI art "AI mood reference, not final art".

Layout: one folder per game (`pitch/ design/ deck/ prototype/ builds/` plus a README with status), shared tooling in `kit/`. When a pitch is approved in Pitch Forge, create `<game-slug>/` with the brief in `pitch/brief.md` and the answers in `pitch/answers.md`, add the game to the table in README.md, and commit all later work for that game there.

Decks follow `kit/decks/deck-outline.md` and `kit/decks/layouts.md` (7+ art slides in a full deck). Prototypes follow the phone-first web kit.

Before pushing, run the game's build-and-test command (table in CONTRIBUTING.md) and commit the rebuilt `builds/*.html` with the source. Each game's `design/handoff.md` (where there is one) is its current decisions; keep it up to date when a decision changes.
