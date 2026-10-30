# Producer agent

© 2026 justaskjoe. All rights reserved.

The Producer helps the crew's **human** producer lane (HOW-WE-WORK: "keeping scope honest, running the weekly check-in"). It doesn't make decisions. It makes sure nothing waits unseen and that Monday's check-in starts with an agenda.

**Short version:** stage 1 is a free weekly digest from GitHub, built (`weekly-digest.yml` + `digest.js`). Stage 2 is short AI summaries of playtest notes, written down here but turned on only when the notes get busy enough to need it. A full Claude agent session like the Artist's is **not** recommended for this job yet. The reasons are below.

## Why this shape (the review, Oct 30, 2026)

**What the studio looks like right now:**
- **Three people, about 10 hours a week each.** Over the last two weeks: 7 pull requests merged across both repos, almost all from Hunter. About 7 open PRs at a time and 1 open issue.
- **The crew doesn't use Slack.** Messages from an agent have nowhere to land except GitHub, email or the Studio home.
- **The games repo is public.** Anything an agent posts there can be read by anyone.
- **The Studio home** (JustAskJoe/forge#4) already shows live "Needs someone", pitches, playtest notes and recent commits, and costs nothing to run.

**What that means:**
1. **Too much information isn't the problem. Things waiting quietly is.** Reviews sit (games#5 has been open 11 days), and Joe and Zach haven't started contributing yet. The useful job is a nudge plus an agenda, once a week, not a daily report.
2. **Most of a "Producer" is counting, not thinking.** Which PRs are waiting and for how long, what merged, which agent is stuck: a script gets that exactly right every time, for free. Paying a model to count gives less reliable counts and a usage bill.
3. **The thinking part is reading playtest notes.** Turning 15 free-text notes into "6 of 9 found waves boring at 1×" is a real judgment task, and it only pays off when there are enough notes to be worth summarizing. Today there are almost none.
4. **Privacy decides where output goes.** Pitch ideas and playtest notes live in Forge's database, behind sign-in. A public GitHub issue can only carry what's already public on GitHub, so the digest links to the Studio home for the rest.
5. **The suspension lesson.** Automation should run under the org, not under someone's personal account, and in small amounts. A GitHub Actions workflow runs as `github-actions[bot]`, posts one issue a week, and uses no personal token.

## Options considered

| Option | What it costs | Strengths | Problems | Verdict |
|---|---|---|---|---|
| **A. Weekly digest workflow** (GitHub Actions, no AI) | Free on a public repo; no Claude usage | Exact, reliable, no account dependency, one issue a week, reviewable code | Can't read private Forge data; no judgment | **Built (stage 1)** |
| **B. Playtest-note summaries** (one small Claude API call a week from the Forge Worker) | A few thousand tokens a week on the smallest model: pennies a month on the API credits, with a Console spending cap | Real judgment where it matters; stays private (results show on the Studio home) | Needs `ANTHROPIC_API_KEY` on Forge; not worth it with few notes | **Stage 2: turn on once there are 10+ notes a week** |
| C. Producer as a claude.ai scheduled task (like the Artist) | A full agent session per run on Hunter's plan; the most expensive option | Flexible; could do anything | Repeats what the Studio home already shows; runs on Hunter's personal account; slower; counts less reliably than code; no private place to post | Not now |
| D. Daily anything | Several times the cost of weekly | — | The crew works weekly. Daily posts would be noise and get ignored. | No |

## Stage 1: weekly digest (built)

- **When:** Mondays 8am Central (`.github/workflows/weekly-digest.yml`), plus a "Run workflow" button on the Actions tab any time.
- **What it posts:** one issue, "This week at JustAskJoe · <date>", labeled `digest`. It closes last week's, so only one is ever open. Sections:
  - Needs a review: oldest first, ⚠️ after 3 days
  - An agent is stuck: `needs-human`
  - Art in progress: `art*` labels; votes happen in Studio HQ
  - Open bugs
  - Merged this week
  - Drafts gone quiet for 7+ days
  - A three-line check-in agenda
- **What it reads:** pull requests and issues in `JustAskJoe/games` and `JustAskJoe/forge`. Nothing private.
- **What it never does:** @-mention people, comment on pull requests, change labels, merge, or spend anything.
- **Code:** `kit/agents/digest.js` (`buildDigest` can be run locally to preview).

## Stage 2: playtest-note summaries (designed, not on)

- **Turn on when:** the Studio home shows 10 or more new playtest notes in a week for 2 weeks in a row, or the crew asks for it.
- **How:** a weekly Cloudflare cron on the Forge Worker sends that week's notes to Claude with a fixed prompt: group into themes, count how many players said each, quote at most 2 short examples per theme, and note any bug reports. It stores the result in Forge's database, and the Studio home shows "This week's playtest themes". It never goes to the public repo.
- **Guardrails:**
  - its own API key, with a monthly spending cap in the Console
  - the smallest model that does the job
  - no more than one run a week
  - it skips the run if there are fewer than 5 notes
- **Needs:** `ANTHROPIC_API_KEY` as a Forge secret. The same key also turns on "Draft the brief with Claude" in Forge.

## Is it working? (check after 4 Mondays)

- **Keep it if:** the check-in actually opens the digest, and reviews stop waiting more than 3 days (the ⚠️ count trends to zero).
- **Change it if:** sections nobody reads should be cut, and anything people keep asking for that it doesn't show should be added.
- **Turn it off if:** nobody opens it for 3 weeks in a row. Disable the workflow in the Actions tab. Nothing else depends on it.

## Adding to it later

Edit `digest.js` in a pull request; Guard asks for a teammate's approval because the workflow lives in `.github/`. Keep it to GitHub's public data. Anything private belongs on the Studio home.
