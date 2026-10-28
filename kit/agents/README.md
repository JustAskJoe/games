# Studio agents

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

Agents are written once here and assigned to games. Each game keeps only what's specific to it (for art, `<game>/art/art-direction.md`). To assign an agent to a game, add the game's folder to the agent's routine prompt. To improve an agent everywhere, edit its file here in a pull request.

| Agent | File | Runs as | Assigned to |
| --- | --- | --- | --- |
| Artist | `artist.md` | Two Claude Code routines: Concepts (scheduled, free) and Finals (manual, paid) | `tower-defense` |

## Artist setup

**Labels** (create once in this repo, under Issues → Labels): `agent:art`, `art:review`, `art-approved`, `art:done`, `needs-human`, plus one `game:<folder>` per assigned game (`game:tower-defense`).

**Routine 1: Studio Artist, Concepts.** At claude.ai/code/routines → New routine.
- Prompt:
  ```
  You are the Artist agent. MODE: concepts. GAMES: tower-defense
  Follow kit/agents/artist.md in onefiftylabs/games exactly.
  ```
- Repository: `onefiftylabs/games`.
- Connectors: **Canva and Slack only. Never add PixelLab to this routine.** That's what makes the concepts stage unable to spend credits.
- Trigger: schedule, Monday and Wednesday mornings.

**Routine 2: Studio Artist, Finals.** Create it only once a game's `final_art_source` is decided.
- Prompt: the same, with `MODE: finals`.
- Repository: `onefiftylabs/games`.
- Connectors: the final-art tool (PixelLab, or Canva) and Slack.
- Trigger: **none.** It runs only when someone clicks Run now after adding `art-approved` to an issue.

**Assigning another game:** give it an `art/art-direction.md` (copy Tower Defense's and change it), a `design/ai-assets.md`, and a `game:<folder>` label, then add the folder to `GAMES:` in both prompts, comma-separated.
