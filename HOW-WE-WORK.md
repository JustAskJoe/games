# How we make games (draft, up for debate)

A starting proposal from Hunter, written with Claude on Oct 19, 2026, for Hunter, Joe, Zach and whoever joins next.

**Everything here is a draft.** The idea is a **collective**: a group of people who make games together and share tools, process and help. One Fifty Labs (Hunter's company) is **one member**. For now it hosts the shared stuff (the website, these GitHub repos, Pitch Forge), but it isn't in charge. Change anything in this doc by proposing it in a pull request or at a check-in.

---

## 1. Decide these first
These shape everything else, and none of them is settled:

| Question | Why it matters | A starting option to argue with |
|---|---|---|
| **What's the collective called?** | Name on the Lab, the Steam page, credits | Pick together; One Fifty Labs stays a member name |
| **How do we decide things?** | Avoids one person steering by default | Anyone can propose. A game's crew decides that game. A lane owner decides inside their lane. Collective-wide changes need everyone's OK. |
| **Who owns each game, and how is money split?** | The biggest one. Steam pays one legal person or company per game, and every file here currently says "© F Lane d/b/a One Fifty Labs" as a placeholder | Each game gets a short written agreement before it goes on sale: owners, revenue split, who publishes, what happens if someone leaves. Have a lawyer look at the first one. |
| **Who pays for shared costs?** | Tools, Steam fees, hosting, any hired art or music | A small shared kitty, or per-game costs paid by that game's crew and paid back first from sales |
| **How do people join, leave, get credit?** | It's a collective | Join by working on a game; credit everyone who contributed; your work stays credited if you leave |
| **Where do the shared accounts live?** | Today, GitHub, Cloudflare and the site sit in Hunter's accounts | Fine for now. Move to a shared org if the collective outgrows it. |

None of this is legal or tax advice. Ownership and money between several people is exactly what to get a lawyer and an accountant to review before the first sale.

---

## 2. How a game goes from idea to Steam

| Stage | What happens | Where | Done when |
|---|---|---|---|
| **1. Idea** | Anyone pitches anything | Chat, a note, Pitch Forge | Someone wants to pitch it properly |
| **2. Pitch** | Everyone answers the Pitch Forge questions on their own time, so nobody anchors anyone else | onefiftylabs.co/forge | Everyone interested has answered |
| **3. Discuss and decide** | Claude makes a discussion guide (where we agree, the calls to make, gaps). We meet and decide. | PDF, then a call | A short brief is written, with a first prototype and its pass bar |
| **4. Crew deck** | About 12 slides, for us, not outsiders. Art direction gets 7+ slides. | Claude Slides | The crew says "approve" |
| **5. Project folder** | The game gets its own folder in GitHub | `onefiftylabs/games/<game>/` (or the private repo) | The brief, README and handoff doc are in |
| **6. Prototype 1** | A playable phone web build that answers one question, built from the kit | `<game>/prototype/`, playable on the Lab | It passes or fails its pass bar |
| **7. Playtest** | We play it and friends play it; the feedback form collects answers | The Lab, `design/playtest-notes.md` | We decide: **commit, change, or shelve.** Shelving is normal; the work stays in the repo. |
| **8. Production** | Lanes and owners, milestones, more prototypes, then a vertical slice (one finished-looking chunk) | Branches, pull requests, patch notes | Content complete |
| **9. Steam page and demo** | The store page goes up as "coming soon" and starts collecting wishlists, plus a free demo and ideally a Steam Next Fest | Steamworks | Enough wishlists to launch into |
| **10. Launch and after** | Release, patches, maybe more content | Steam | Ongoing |

**Steam timing facts:**
- **Fee:** $100 per game, paid back once the game earns $1,000.
- **Valve's cut:** 30% of sales up to $10M.
- **Waiting periods:** at least 21 days between paying the fee and releasing, and the "coming soon" page must be public at least two weeks before launch.
- **Tax and bank checks** can take up to 30 days. Start early.
- **Next Fest 2027:** Feb 22 – Mar 1 and Jun 14 – 21.

---

## 3. How work flows week to week
- **Everyone is part-time,** about 10 hours a week, at different times. Work is asynchronous by default.
- **Claude is everyone's pair,** but each person uses their own Claude account. The repo holds everything Claude needs; chats don't carry between people.
- **Every session** starts and ends with the prompts in [CONTRIBUTING.md](CONTRIBUTING.md), section 7.
- **Patch notes** (`<game>/patch-notes.md`) are the running log of what's new, what's next for whom, and what to watch out for. Say "add to patch notes" any time. `python3 kit/open-notes.py --for <you>` shows what's waiting for you.
- **Changes go through branches and pull requests,** so nobody overwrites anyone and everyone sees what changed.
- **Proposal:** a 30-minute check-in each week. Play the latest build together, settle open questions, update the lanes.

---

## 4. Lanes, and what each needs beyond Claude
Claude can write code, run tests, draft docs and decks, and make placeholder art and music. It can't replace people's taste, final hand-made art, real playtesters, or the accounts and money that shipping needs. Here's what each lane needs from outside Claude.

### Lane 1: Tech (engine, multiplayer, Steam builds)
**Skills:** JavaScript today, plus whatever engine we pick. Debugging. Basic networking. Patience with build pipelines.

| Need | Options | Cost |
|---|---|---|
| **Engine for the Steam version** (the first big tech decision) | (a) Keep the web game and wrap it as a desktop app with **Electron** or **Tauri** (fastest; keeps what's built). (b) Rebuild in **Godot**, with **GodotSteam** for Steam features (more up-front work, stronger for a full game). | Free (all open source) |
| **Online co-op hosting** | **Steam networking** (built into Steam, works with GodotSteam). Or host our own server on **Cloudflare** (Durable Objects; the site already runs there). | Steam networking: part of Steamworks, and Valve lists no separate fee for it (confirm at signup). Cloudflare: free tier, then a $5/month minimum on the paid plan. |
| **Steam account** | Steamworks partner account in the name of whoever publishes (see "Decide these first") | $100 per game |
| **Test devices** | An iPhone, an Android phone, a Windows PC. A Steam Deck is nice to have. | Whatever people already own |
| **Everyday tools** | GitHub, Node.js, Python, Playwright (setup in CONTRIBUTING) | Free |

### Lane 2: Design (content, balance, playtests)
**Skills:** systems design, writing clearly, spreadsheets, watching players without helping them.

| Need | Options | Cost |
|---|---|---|
| **Balance tools** | The bot sim in each game's repo; a spreadsheet for tower and enemy stats | Free |
| **Playtesters** | Friends and family first, then a small Discord. The Lab plus the in-game feedback form already collect answers. | Free; time to recruit |
| **Reference games** | Play what we're up against: co-op tower defense, roguelite deckbuilders | The cost of a few games |
| **Paper prototyping** | Index cards, dice, a whiteboard, for trying rules before code | A few dollars |
| **Pitch Forge** | The questionnaire for new pitches; any member can start one | Free (runs on the site) |

### Lane 3: Look, sound and feel (art, audio, UI, marketing)
**Skills:** illustration or art direction, animation, UI layout, music or sound, video editing. Probably the lane most likely to need outside help.

**House rule:** AI art is **mood reference only**, never final art, and is always labeled that way. Final art is made or licensed by a person.

| Need | Options | Cost |
|---|---|---|
| **Painting and illustration** | **Krita** (PC), **Procreate** (iPad) | Krita free. Procreate $12.99 one-time; an Apple Pencil is $99–129. |
| **An illustrator** (if nobody in the collective paints) | A member, a friend, or a contract artist | Varies widely; get quotes per asset set |
| **Music** | A member who composes, or a hired composer. The placeholder score in code holds the spot until then. | Experienced indie composers often charge $200–1,000 per finished minute |
| **Sound effects** | Licensed sound libraries (check each license allows commercial games) or recorded ourselves | Free to modest |
| **Audio tools** | **FMOD** for interactive game audio, **Audacity** for editing | FMOD is free for teams under $200,000 yearly revenue (and a budget under $500,000). Audacity is free. |
| **Fonts** | Fonts whose license covers games (Google Fonts' open licenses do) | Free if we stay on open licenses |
| **Trailer and capture** | **DaVinci Resolve** for editing; **OBS** for capturing gameplay | Free |
| **Steam page art** | Header capsule 920×430, small 462×174, main 1232×706, vertical 748×896, plus at least 5 gameplay screenshots at 1920×1080 and a trailer | Our time, or the illustrator's |
| **Marketing graphics** | **Canva** (Hunter's account has credits; ask before spending them) | Already paid |

### Producer (on top of a lane)
**Skills:** keeping scope honest, saying "not this version", running the weekly check-in, keeping `handoff.md` and the patch notes current.

| Need | Options | Cost |
|---|---|---|
| **Milestones and dates** | The handoff doc plus patch notes; a shared calendar for check-ins and Next Fest deadlines | Free |
| **Business setup** | Steam tax and bank onboarding for whoever publishes; the per-game agreement | Lawyer and accountant time for the first agreement |
| **Budget** | One page per game: costs so far, costs planned, who's paying | Free |

### Splitting the work by team size
**Split by ownership, not tasks.** Each person owns an area end to end, makes the calls in it, and is the only one who changes its files. Claude does a lot of the typing, so what we're dividing up is decisions, taste and accountability. When someone joins, **split whichever lane is the bottleneck.** For a co-op tower defense with 20+ towers, that's art first and online tech second.

**3 people: the core**

| Role | Owns | Folder or files |
|---|---|---|
| **Tech** | Engine, co-op, Steam builds, the test pipeline | `prototype/engine.js`, `server/`, build scripts |
| **Design** (+ producer) | Towers, enemies, cards, waves, the keep, balance, playtests, UI flow, scope | `design/`, stat tables, patch notes |
| **Art and audio** | The look, UI visuals, animation, music and sound (likely managing a hired composer), Steam page art | Art assets, `music.js` and audio |

At three, the gaps are marketing and audio. Plan to hire music, and start the Steam page late.

**4 people: add a "showcase" role**

| Role | Owns |
|---|---|
| **Tech** | Same as above |
| **Design** | Content and balance. Hands producer duties to Showcase. |
| **Art** | Visuals, UI look, animation, VFX |
| **Showcase and sound** (+ producer) | Audio (composing or managing the composer), sound effects, trailer, Steam page, wishlists, Discord and community, recruiting playtesters, the weekly check-in |

Why not a second coder? Small teams usually neglect marketing until it's too late, and Steam wishlists decide how a launch goes. This also takes producer and audio work off people who should be making the game. **Exception:** if the 4th person is a strong programmer, use the 5-person tech split and keep producer duties with Design.

**5 people: split tech in two**

| Role | Owns |
|---|---|
| **Gameplay programmer** | Towers, enemies, cards and the keep in code, UI code, game feel (hits, juice, readability) |
| **Online and platform programmer** | Co-op and sync, Steam (achievements, lobbies, cloud saves), builds, performance, test devices |
| **Design** | Content, balance, playtests |
| **Art** | Visuals, animation, UI look |
| **Showcase and sound** (+ producer) | As in the 4-person version |

**6 and up, in order:** a second artist (illustration and UI vs. animation and VFX), then a dedicated producer and community person, then QA. Past about six part-timers, coordination starts eating the extra hours.

**Handoffs, so lanes connect without overlapping:**
- **Design → Gameplay:** design writes the numbers and rules (stat tables, card text). Gameplay builds them and doesn't redesign them. Disagreements go to the check-in.
- **Art → Tech:** art delivers to a spec (sizes, palette, file names). Tech wires it in and doesn't touch the art.
- **Design → Sound:** design keeps a cue list (what needs a sound or music change). Sound fills it.
- **Online ↔ Gameplay:** every player action goes through one function (`act()` in Tower Defense), so gameplay adds actions and online just syncs them.
- **Asking for something:** handoffs go in patch notes as `@Name` items, so asks don't get lost in chat.

**Two rules that matter more than the tables:**
- **Skills beat the template.** Whoever is the natural artist is Art, whatever the table says. The tables are there to make sure every area has an owner.
- **Everyone has a backup lane** they understand enough to cover, so vacations and busy weeks don't stall the game.

---

## 5. Where everything lives

| What | Where | Who can use it today |
|---|---|---|
| Website, Lab (playable builds), Pitch Forge | onefiftylabs.co (password-protected for now) | Anyone with the password |
| Games, decks, design docs (public) | GitHub `onefiftylabs/games` | Everyone can read; collaborators can push |
| Private game work | GitHub `onefiftylabs/games-private` | Collaborators Hunter adds |
| Website source | GitHub `onefiftylabs/onefiftylabs-site` (private) | Hunter, for now |
| Feedback and pitch answers | The site's database (Cloudflare) | Read through Claude |
| Art and AI credits (Canva, PixelLab) | Hunter's accounts | Ask before spending |
| Claude | Each person's own account | Each person |

---

## 6. Rules we work by today (also up for debate)
- **The public repo is public:** no secrets, emails, money numbers or personal details. No licensed music or art. No work for anyone's employer.
- **AI art is mood reference,** labeled "AI mood reference, not final art".
- **Ask before spending shared credits** (Canva, PixelLab) or money.
- **Prototypes are phone-first web builds** with a balance sim. Test the rules with bots before building the screens.
- **Every session leaves patch notes,** including things you noticed but didn't fix.
- **Commit rebuilt builds with the source,** so the Lab always plays what's in the code.

---

## 7. Today: getting Joe and Zach set up
1. **Make a GitHub account** (if you don't have one) and send Hunter your username. Hunter adds you to `onefiftylabs/games`. Accept the email invite.
2. **Connect GitHub in your own Claude** (Settings → Connectors) and allow the `onefiftylabs` repos.
3. **Paste the "Initial setup" prompt** from [CONTRIBUTING.md](CONTRIBUTING.md), step 1. Claude checks your access, gives you a tour and hands you your start-work and end-work prompts.
4. **Play Tower Defense** at onefiftylabs.co/lab/tower-defense/ (Hunter sends the site password separately). Finish a run and tap **Give feedback**.
5. **Read** `tower-defense/design/handoff.md` and this doc.
6. **Bring your take on "Decide these first"** (section 1) to the first check-in, especially ownership and money, and which lane you'd want.

---

## 8. Hunter's Claude API credits: ideas (opt-in)
Hunter has monthly Claude API credits on top of his own Claude plan. These are ideas for spending them where they help the collective most, ranked by value. Nothing here is set up yet. The credits are Hunter's, so how they count toward "who pays for shared costs" is part of section 1.

| # | Idea | What it does for us | Setup |
|---|---|---|---|
| 1 | **`@claude` in GitHub** | Anyone with write access comments `@claude …` on an issue or pull request, and Claude does the work right there: answers, fixes, opens a pull request. **Members don't need their own Claude account to get help.** | Install the Claude GitHub App on the repos, add the API key as a GitHub secret, add one workflow file |
| 2 | **Automatic review on every pull request** | Before anything merges, Claude checks the public-repo rules (no secrets, no licensed music), that the rebuilt build is committed, that patch notes exist, and that balance changes include sim numbers. A second pair of eyes for part-timers. | Same app, plus a review workflow |
| 3 | **Weekly digest** | Every Monday, a GitHub issue that summarizes the week: what merged, new playtest feedback, open next-up items per person and open watch-outs. It's the agenda for the check-in. | A scheduled workflow |
| 4 | **"Draft the brief with Claude" in Pitch Forge** | Already built into Pitch Forge: one button merges everyone's answers into a draft brief. It just needs the key. | Add the key as a Cloudflare secret on the site |
| 5 | **Feedback summaries** | Groups everyone's in-game feedback into themes ("6 of 9 found waves boring at 1×") and adds them to `playtest-notes.md`. Runs as a batch, which costs half. | A small job against the site's feedback database |
| 6 | **AI first-time players** | Claude plays a new build in a browser like a stranger would and writes first-impression notes: what confused it, where it got stuck. It catches "nobody would understand this screen" before we spend real playtesters on it. A complement to the bot sim and to people, not a replacement. | A script next to `test.py` |
| 7 | **Content drafts in bulk** | Many variants of tower, card and enemy names and rules text, or flavor text, to pick from. Later, first drafts of translations for people to review. Batch pricing applies. | Run when needed |
| 8 | **Claude in the game itself** (prototypes only) | For example, a coach (Pell) who answers questions in tester builds. Fun to try behind the password, but **not in a shipped Steam game** without a plan: every player would cost money, and it needs a server and internet. | Through the site, behind the password |

**Guardrails if we turn any of these on:**
- **The key never goes in a repo,** only into GitHub or Cloudflare secrets. Use a separate key per use, so each one can be tracked and switched off on its own.
- **Set a monthly spending limit** in the Claude Console, and cap each GitHub run (`--max-turns`, a timeout).
- **On the public repo,** GitHub doesn't give secrets to pull requests from outside forks, so strangers can't spend the credits. Only collaborators can trigger `@claude`.
- **AI text and art stay drafts** that a person reviews, same as the art rule.

---

### Sources
- Steam fee, payback and revenue share: [Steam Page Analyzer: Steam Direct fee explained](https://www.steampageanalyzer.com/blog/steam-direct-fee-explained)
- Steam waiting periods and onboarding: [Steamworks: onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding)
- Steam store art sizes: [Steamworks: store graphical assets](https://partner.steamgames.com/doc/store/assets/standard)
- Next Fest 2027 dates: [Notebookcheck](https://www.notebookcheck.net/Valve-announces-Steam-Sales-and-Festivals-for-first-half-of-2027.1344181.0.html)
- Cloudflare Durable Objects pricing: [Cloudflare docs](https://developers.cloudflare.com/durable-objects/platform/pricing)
- FMOD free tier: [Game Developer](https://www.gamedeveloper.com/audio/small-developers-and-creators-can-now-use-fmod-studio-for-free)
- Procreate price: [Toolradar](https://toolradar.com/tools/procreate/pricing)
- Composer rates: [Ninichi Music](https://ninichimusic.com/blog/understanding-how-much-an-indie-game-music-composer-costs)
- GodotSteam: [GitHub](https://github.com/GodotSteam/GodotSteam)
- Steam networking relay: [Steamworks: Steam Datagram Relay](https://partner.steamgames.com/doc/features/multiplayer/steamdatagramrelay)
- Claude in GitHub (`@claude`, reviews, scheduled runs, cost controls): [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions)
- Batch requests at half price, usually done within an hour: [Claude batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)

Prices checked Oct 19, 2026. Check again before spending.
