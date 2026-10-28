# Studio agents

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

Agents are written once here and assigned to games. Each game keeps only what's specific to it (for art, `<game>/art/art-direction.md`). To assign an agent to a game, add the game's folder to the `GAMES:` line of the agent's scheduled-task prompts. To improve an agent everywhere, edit its file here in a pull request.

| Agent | File | Runs as | Assigned to |
| --- | --- | --- | --- |
| Artist | `artist.md` | Two Claude scheduled tasks: Concepts (scheduled, free) and Finals (button only, paid) | `tower-defense` |

## Artist setup

**Free painted roughs.** With `roughs: cloudflare` in a game's `art-direction.md`, the Artist writes `<issue>-roughs.json` and the Art roughs workflow (`.github/workflows/art-roughs.yml`, script `kit/art/roughs.py`) makes the images on Cloudflare Workers AI through `onefiftylabs.co/art/api/rough` and commits them to the Artist's branch. It needs the `ART_KEY` Actions secret.

**Labels** (create once in this repo, under Issues → Labels): `agent:art`, `art:review`, `art-approved`, `art:done`, `needs-human`, plus one `game:<folder>` per assigned game (`game:tower-defense`).

**Her two shifts** are Claude scheduled tasks on Hunter's account (Claude sidebar → Scheduled):
- **Studio Artist: Concepts (Mon + Wed)**: runs by itself Monday and Wednesday at 7:47am Central, `MODE: concepts`. Free. Its PixelLab connector should be switched off in the task's settings, so it can't spend credits even by mistake.
- **Studio Artist: Finals (button only, spends credits)**: no schedule; runs only when someone clicks Run now after adding `art-approved` to an issue. `MODE: finals`.

Both prompts tell a fresh cloud session to attach this repo, read `kit/agents/artist.md`, and work only on the games named after `GAMES:`.

**Assigning another game:** give it an `art/art-direction.md` (copy Tower Defense's and change it), a `design/ai-assets.md`, and a `game:<folder>` label, then add the folder to `GAMES:` in both scheduled-task prompts, comma-separated.
