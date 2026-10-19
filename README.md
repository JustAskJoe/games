# One Fifty Labs · Games

Game prototypes, pitch decks and design docs from [One Fifty Labs](https://onefiftylabs.co), a small studio in Austin, Texas.
Every game starts as a pitch in Pitch Forge (our team questionnaire). Approved pitches get a folder here, and all the work on that game lands in it.

## Games

| Game | What it is | Status |
|---|---|---|
| [Tower Defense](tower-defense/) (working title) | Tower defense, built with the crew | Pitching |
| [Trickbound](trickbound/) | Spades spin-off: a trick-taking card game with familiars | Prototype |
| [Tilebound](tilebound/) | Mahjong meets the Game Boy Pokémon TCG | Prototype |
| [Hexed](hexed/) | Witchy tarot match-3, 10 levels | Prototype |
| [Neon Surf](neon-surf/) | Neon-ocean rhythm surfing | Tech test |
| [Cardboard Cartel](cardboard-cartel/) | Trading-card collector idler | Design |
| [Idle Hands](idle-hands/) | Idle game pitch | Pitch |
| [Automation Idler](automation-idler/) | Idler built around real life automations | Design |

Shared building blocks (deck generator, layouts, prototype snippets, art workflow) are in [`kit/`](kit/).

## Folder layout for each game

```
<game>/
  README.md     what it is, status, links to playable builds
  pitch/        the brief and merged answers from Pitch Forge
  design/       scope docs, rules, GDD, playtest notes
  deck/         pitch deck source
  prototype/    playable source (phone-first web)
  builds/       single-file playable builds
```

## Playing the prototypes

Most builds are single HTML files. Open `builds/*.html` in a browser, or run a prototype's `build.py` where one exists.

## Rights

Code, art and text here are © 2026 F Lane d/b/a One Fifty Labs. All rights reserved. The source is public so people can look, learn and play; it is not licensed for reuse. Some art is AI mood reference, not final art, and is labeled that way.
