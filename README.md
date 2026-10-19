# One Fifty Labs · Games

Game prototypes, pitch decks and design docs from [One Fifty Labs](https://onefiftylabs.co), a small studio in Austin, Texas.
Every game starts as a pitch in Pitch Forge (our team questionnaire). Approved pitches get a folder here, and all the work on that game lands in it.

## Games

| Game | What it is | Status |
|---|---|---|
| [Tower Defense](tower-defense/) (working title) | Co-op roguelite tower defense with a card draft, built with the crew | Prototype 1.1 (solo); co-op server base |
| [Trickbound](trickbound/) | Spades spin-off: a trick-taking card game with familiars | Prototype |
| [Tilebound](tilebound/) | Mahjong meets the Game Boy Pokémon TCG | Prototype |
| [Hexed](hexed/) | Witchy tarot match-3, 10 levels | Prototype |
| [Neon Surf](neon-surf/) | Neon-ocean rhythm surfing | Tech test |
| [Cardboard Cartel](cardboard-cartel/) | Trading-card collector idler | Design |
| [Idle Hands](idle-hands/) | Idle game pitch | Pitch |
| [Automation Idler](automation-idler/) | Idler built around real life automations | Design |

Shared building blocks (deck generator, layouts, prototype snippets, art workflow) are in [`kit/`](kit/).

**Working on a game?** Start with [CONTRIBUTING.md](CONTRIBUTING.md): setup, branches and pull requests, and the build-and-test command for each game.

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

| Game | Playable build |
|---|---|
| Tower Defense | [`tower-defense/builds/tower-defense-p1.html`](tower-defense/builds/tower-defense-p1.html) |
| Trickbound | [`trickbound/builds/trickbound.html`](trickbound/builds/trickbound.html) |
| Tilebound | [`tilebound/builds/tilebound.html`](tilebound/builds/tilebound.html) |
| Hexed | [`hexed/builds/hexed.html`](hexed/builds/hexed.html) |
| Neon Surf | [`neon-surf/builds/neon-surf.html`](neon-surf/builds/neon-surf.html) |

GitHub shows `.html` files as source, so download the file (with its `img/` folder where there is one) and open it locally to play. Tower Defense is also playable on the Lab page of [onefiftylabs.co](https://onefiftylabs.co).

## Rights

Code, art and text here are © 2026 F Lane d/b/a One Fifty Labs. All rights reserved. The source is public so people can look, learn and play; it is not licensed for reuse. Some art is AI mood reference, not final art, and is labeled that way.
