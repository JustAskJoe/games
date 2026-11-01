# JustAskJoe · Games

Game prototypes, pitch decks and design docs from JustAskJoe, a small games collective. [One Fifty Labs](https://onefiftylabs.co) (Austin, Texas) is one of its members.
Every game starts as a pitch in Forge (our team questionnaire). Approved pitches get a folder here, and all the work on that game lands in it.

## Games

| Game | What it is | Status |
|---|---|---|
| [Tower Defense](tower-defense/) (working title) | Co-op roguelite tower defense with a card draft, built with the crew | Prototype 1.1 (solo); co-op server base |
| [Trickbound](trickbound/) | Spades spin-off: a trick-taking card game with familiars | Prototype |
| [Tilebound](tilebound/) | Mahjong meets the Game Boy Pokémon TCG | Prototype |
| [Hexed](hexed/) | Witchy tarot match-3, 10 levels | Prototype |
| [Neon Surf](neon-surf/) | Neon-ocean rhythm surfing | Tech test |
| [Cyberpunk Gate Runner](cyberpunk-gate-runner/) (working title: Overclock) | Cyberpunk runner shooter synced to a house beat | Prototype 2 (in progress) |
| [Intergalactic Card Trader](card-trader/) (working title) | Card shop sim on a space station: inspect, haggle, grade, ride the trade lanes | Prototype v1 |
| [Cardboard Cartel](cardboard-cartel/) | Trading-card collector idler | Design |
| [Idle Hands](idle-hands/) | Idle game pitch | Pitch |
| [Automation Idler](automation-idler/) | Idler built around real life automations | Design |

Shared building blocks (deck generator, layouts, prototype snippets, art workflow) are in [`kit/`](kit/).

**New to the collective?** Read [HOW-WE-WORK.md](HOW-WE-WORK.md) first: how ideas become games, the lanes, the tools, and the open questions we're deciding together.

**How it all fits together** (Studio HQ, Forge, the Lab, the Art Cottage, the Artist, accounts): [ARCHITECTURE.md](ARCHITECTURE.md).

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
| Cyberpunk Gate Runner | [`cyberpunk-gate-runner/builds/cyberpunk-gate-runner.html`](cyberpunk-gate-runner/builds/cyberpunk-gate-runner.html) |
| Intergalactic Card Trader | [`card-trader/builds/card-trader.html`](card-trader/builds/card-trader.html) |

GitHub shows `.html` files as source, so download the file (with its `img/` folder where there is one) and open it locally to play. Every build is also playable in the [JustAskJoe Lab](https://jaj-forge.huntefl.workers.dev/lab) (email sign-in for the crew).

## Rights

Code, art and text here are © 2026 F Lane d/b/a One Fifty Labs. All rights reserved. New work added from Oct 28, 2026 is © 2026 justaskjoe. All rights reserved. The source is public so people can look, learn and play; it is not licensed for reuse. 
