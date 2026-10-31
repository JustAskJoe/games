# Studio agents

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

Agents are written once here and assigned to games. Each game keeps only what's specific to it (for art, `<game>/art/art-direction.md`). To assign an agent to a game, add the game's folder to the `GAMES:` line of the agent's scheduled-task prompts. To improve an agent everywhere, edit its file here in a pull request.

| Agent | File | Runs as | Assigned to |
| --- | --- | --- | --- |
| Artist | `artist.md` | Two Claude scheduled tasks: Concepts (scheduled, free) and Finals (button only, paid) | `tower-defense` |
| Producer | `producer.md` | Stage 1: the Weekly digest workflow (`digest.js`), Mondays, free, no AI. Stage 2 (playtest summaries) is designed but off. | The whole studio |

## Artist setup

**Free painted roughs.** With `roughs: cloudflare` in a game's `art-direction.md`, the Artist writes `<issue>-roughs.json` and the Art roughs workflow (`.github/workflows/art-roughs.yml`, script `kit/art/roughs.py`) makes the images on Cloudflare Workers AI through `onefiftylabs.co/art/api/rough` and commits them to the Artist's branch. It needs the `ART_KEY` Actions secret.

**Labels** (create once in this repo, under Issues → Labels): `agent:art`, `art:review`, `art-approved`, `art:done`, `needs-human`, plus one `game:<folder>` per assigned game (`game:tower-defense`).

**Concepts as a GitHub Action (the shared way).** `.github/workflows/artist.yml` starts her the moment an issue gets the `agent:art` label (the Studio's Art Cottage adds it to every request), or from **Actions → Artist → Run workflow** with an issue number. It runs in GitHub, visible to the whole crew, on nobody's personal Claude account. It needs two org secrets (GitHub → JustAskJoe → Settings → Secrets and variables → Actions), each shared with `games` and `xr-app-suite`:
- `ANTHROPIC_API_KEY`: the collective's key from console.anthropic.com, with a monthly spend limit set there. Optional org variable `ARTIST_MODEL` picks the model (default `claude-opus-5-5`; a smaller model costs less).
- `ARTIST_GH_TOKEN`: a fine-grained token (resource owner JustAskJoe; repos `games` and `xr-app-suite`; Contents, Issues and Pull requests: Read and write). Her pushes use it so her pull requests run CI; pushes made with the built-in `GITHUB_TOKEN` don't.

Until both secrets exist the workflow stops at its first step and says what's missing. Once it works, the scheduled task below can be paused. Finals stays a scheduled task, because it spends credits.

**Her two shifts** are Claude scheduled tasks on Hunter's claude.ai account (Claude sidebar → Scheduled), started or paused from Studio HQ:
- **JustAskJoe Artist: Concepts (Mon + Wed)**: runs by itself Monday and Wednesday at 8:17am Central, `MODE: concepts`. Free. Connectors: Canva, Slack, Claude Code Remote. **Never add PixelLab to this task**; that's what makes the concepts stage unable to spend credits.
- **JustAskJoe Artist: Finals**: no schedule; runs only when someone clicks Run now after adding `art-approved` to an issue. `MODE: finals`. Connectors: the final-art tool (PixelLab or Canva) and Slack.

Both prompts tell a fresh cloud session to attach `JustAskJoe/games`, read `kit/agents/artist.md`, and work only on the projects named after `PROJECTS:` (today `JustAskJoe/games:tower-defense`).

**Assigning another game:** give it an `art/art-direction.md` (copy Tower Defense's and change it), a `design/ai-assets.md`, and a `game:<folder>` label, then add it to `PROJECTS:` in both scheduled-task prompts, comma-separated (and to Studio HQ's game list).
