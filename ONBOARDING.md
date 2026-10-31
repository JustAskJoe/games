# New to the studio? Start here

© 2026 justaskjoe. All rights reserved.

This page is for anyone joining the JustAskJoe games collective, and for **their Claude**. Open this repo in Claude Code and say "I'm new, walk me through the studio". Claude reads `CLAUDE.md` automatically, and `CLAUDE.md` sends it here.

This is a map, not the rulebook. Where this page and `CLAUDE.md`, `CONTRIBUTING.md`, `HOW-WE-WORK.md` or `ARCHITECTURE.md` disagree, those win. Nothing here gives anyone permission to spend money, merge, deploy or change settings.

---

## 1. Instructions to Claude

You're helping a member of the **JustAskJoe** games collective: Hunter, Zach, Joe and whoever joins next.

- **First session is read-only.** Follow section 7 and change nothing.
- **Every change is a branch and a pull request.** Name branches `<name>/<what-you're-doing>`, for example `joe/frost-tower`. Never push to `main`, force-push, rewrite pushed history or delete `main`.
- **Ask before anything hard to undo:** deleting files or branches, renaming a build the Lab serves, changing secrets, sign-in, repo settings or rules, or merging.
- **Don't route around checks.** Never edit `.github/` or a `CLAUDE.md` to loosen a check. If a check is wrong, say so and propose the fix in its own pull request.
- **This repo is public.** No secrets, keys, emails, client info, money numbers or people's raw Forge answers. Nothing from the private XR repo either: not its code, art, app names or notes.
- **Keep notices as they are.** New files get the ownership line (section 5). Never rewrite the notice on an existing file.
- **Go easy on GitHub automation.** A burst of automated changes once got an account suspended for two days. Prefer a few deliberate pull requests over dozens at once.
- **Talk plainly.** Say what you'll do before you do it, and report what you actually did, including anything you couldn't check.

---

## 2. The studio in a minute

- **Studio HQ** (https://jaj-forge.huntefl.workers.dev) is the crew's front door: one signed-in page drawn as a painted village. Each building is a department, and each agent has a house on Agent Lane.
- **Forge** (`/forge`) is where game ideas start. Everyone answers a pitch questionnaire. Approving a pitch opens a pull request that adds the game's folder here and adds it to `games.json`.
- **The Lab** (`/lab`) plays every build in this repo. Every pull request gets a "play this branch" link.
- **The Artist** is a Claude agent that sketches free concept sheets as pull requests. You talk to her in the village's **Art Cottage**.
- **GitHub is the record of truth.** Everything else is a view or a helper.

**Sign-in:** Studio HQ uses an emailed one-time code. Hunter adds your email to the sign-in list. Type your email and press "Send login code". A session lasts 24 hours.

---

## 3. Where things are

| Place in Studio HQ | What's inside |
| --- | --- |
| **Town Hall** | "Needs someone": pull requests to review, briefs to approve, bugs |
| **The Forge** | The pitch pipeline: answering → brief ready → approved |
| **Art Cottage** | Ask the Artist for art for any game, vote on her concept sheets, see what's waiting for her, and **Run her now** |
| **Workshop** | Open pull requests and bugs |
| **Arcade** | Every painted cabinet opens a game. Playtest notes are here too |
| **Town Square** | The weekly rhythm and the new-here checklist |
| **Agent Lane** | One house per agent, showing what it's doing |

| Repo | What's in it |
| --- | --- |
| `JustAskJoe/games` (this one, public) | Every browser game, decks, design docs, the shared `kit/`, `games.json`, `ARCHITECTURE.md` |
| `JustAskJoe/forge` (private) | The Studio HQ site: village, Forge, Lab, Art Cottage |
| `JustAskJoe/xr-app-suite` (private, confidential) | The XR headset apps. Access is by invitation; its own `CLAUDE.md` and `STUDIO.md` explain it |

---

## 4. How work flows

1. **Start from main:** `git checkout main && git pull`, then `git checkout -b <name>/<thing>`.
2. **Make the change.** Run the game's build-and-test command (the table in `CONTRIBUTING.md`) and commit the rebuilt `builds/*.html` with the source.
3. **Patch notes.** Add an entry at the top of `<game>/patch-notes.md` (the format is in `CLAUDE.md`). List anything you didn't verify under Watch out.
4. **Push and open a pull request.** CI runs **Build and test** and **Guard**, and a bot comments a Lab preview link.
5. **Guard needs a second person** for risky changes: deleting builds, `pitch/`, `handoff.md`, patch notes or `kit/`, or touching `.github/` or `CLAUDE.md`. Someone other than the author approves.
6. **Merge** when the checks are green and any needed review is in. Changes to the Studio HQ site go live only when Hunter deploys them.
7. **If your change alters how something works** (a route, schedule, agent, account or game in the Lab), update `ARCHITECTURE.md` in the same pull request.

**Asking for art:** use the ask box in the Art Cottage. It opens an "Art request: …" issue in the game's repo. She sketches on Monday and Wednesday mornings, or when someone taps **Run her now**. Vote on her sets in the same room. Hunter makes the final pick, and final art (which spends credits) only happens after he approves it.

**Undoing a merged change:** open a pull request that reverts it (`git revert`). Never force-push.

---

## 5. House rules

- **Ownership line on new files here:** `© 2026 justaskjoe. All rights reserved.` Older files that carry "© 2026 F Lane d/b/a One Fifty Labs · All rights reserved" keep it.
- **Never in this public repo:** licensed music, lyrics, third-party art, employer or partner work, or anything from the XR repo.
- **AI disclosure:** keep a list in each game's `design/` of which assets AI made (for Steam's AI disclosure).
- **Forge answers:** raw Forge answers stay in Forge's database and are never committed. Only the brief is.
- **Spending:** art credits (Canva, PixelLab) are Hunter's. Ask him before anything that spends them.

---

## 6. Who can do what

| Anyone on the crew | Only Hunter, for now |
| --- | --- |
| Pitch and answer in Forge, push branches and open pull requests | Deploy the Studio HQ site |
| Review and approve each other's pull requests (Guard needs this) | Add people to the sign-in list |
| Ask the Artist for art, vote, and tap Run her now | Make the final art pick and run Finals (spends credits) |
| Play every game in the Arcade and the Lab | Change Cloudflare or claude.ai settings |

---

## 7. First session (read-only)

Claude: do these in order and **change nothing**.

1. **Access.** Confirm you can see `JustAskJoe/games` and, if the person was invited, `JustAskJoe/forge` and `JustAskJoe/xr-app-suite`. If something's missing, say exactly what: the org invite, the team, or Claude's GitHub connection.
2. **Read** `ARCHITECTURE.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `HOW-WE-WORK.md`, `README.md` and `kit/INDEX.md`.
3. **Check the tools:** run `python3 tower-defense/build-and-test.py --quick`.
4. **What's waiting:** run `python3 kit/open-notes.py --for <their name>` and tell them what's there.
5. **Give a short tour:** the games and their status, the village, the agents, and the rules above.
6. **Ask what they want to start with.** Good first picks are a review in Town Hall, an art request, or an open patch-notes item with their name on it.

**Prompts worth saving:**
- **Start of a session:** "Pull main, run open-notes for me, show me what's waiting on me in Town Hall and on GitHub, and suggest one thing to pick up."
- **End of a session:** "Before I stop: make sure my branch has a patch-notes entry with anything unverified under Watch out, the build and tests pass, and a pull request is open with a clear description. Tell me what's left."

---

## 8. Links

- Studio HQ: https://jaj-forge.huntefl.workers.dev
- Forge: https://jaj-forge.huntefl.workers.dev/forge
- Lab: https://jaj-forge.huntefl.workers.dev/lab
- Project board: https://github.com/orgs/JustAskJoe/projects/1
