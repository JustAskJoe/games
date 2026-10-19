# One Fifty Labs pitch deck outline

This outline comes from six decks. Five are Slides artifacts: Tilebound full (49 slides), Tilebound Short Pitch (10), Cardboard Cartel internal (59), Idle Hands (42) and a partner pitch (19). The sixth is Trickbound (23), built with `gen.py`.

## The spine (game pitch)

| # | Section | What it answers | Full deck | Short deck |
|---|---------|-----------------|-----------|------------|
| 1 | **The idea** | What is it, why should I care, why now, who is it for, what is missing today | 4–8 | 2–3 |
| 2 | **How it plays** | Rules in 4 steps, the core loop, teaching/onboarding, modes, the hook mechanic | 5–15 | 1–2 |
| 3 | **The world / progression** | Adventure structure, towns or stages, collection, characters, goals, endgame | 3–15 | 0–1 |
| 4 | **Art direction** | The look, plus proof that it can be made. **The owner wants at least 7 art slides in a full deck.** | 7–21 | 2 |
| 5 | **Build** | Tech stack, pipeline, balance, scope (often skipped for internal decks) | 0–5 | 0 |
| 6 | **Proof, business, plan, ask** | Prototype or playtest proof, price model, market table, roadmap with gates, risks, the ask | 4–8 | 3 |

**Typical totals:** a short deck is about 10 slides. A full pitch runs 23–60 slides. Trickbound (23) is the best recent template for a full deck: 4 sections, 8 art slides.

### Section by section (slide ids are the ones the decks use)

1. **Idea.** `cover` → `hook` (one emotional line) → `why`/`whynow` (3 big stats with sources) → `audience`/`market` (4 lcards of facts) → `gap` (today vs us) → `mashup` (two lists: "from X" / "from Y")
2. **How it plays.** `rules`/`play` (4 numbered cards, the last one highlighted, plus a "Never played?" callout) → `loop` → the core differentiator (`deck`, `familiars`, `partner`, `housecard`, `pot`) → `teach`/`tutorial` (Lesson 1–4)
3. **World.** `adventure`/`journey` (5-step path cards plus 4 rival/master notes) → `world`, `club`, `towns`, `routes`, `stages`
4. **Art.** `art-pillars` (3 lcards + palette strip) → hero full-bleed art pieces → `art-anatomy` (card or tile mock) → `art-families` (2x2 grid) → characters or cast → environment/world → UI screen mockup (`screens`) → optional: XR, audio, rarity ladder, palette and type
5. **Build.** `stack`, `architecture`, `pipeline`, `balance`, `scope`
6. **Close.** `proof` (prototype screenshot + 3 facts) → `business` ("Try it free. Buy it once." 3 cards + 2 rule notes) → `market` (competitor table) → `roadmap` (phases + gates) → `risks` → `ask`/`close` (Now / Next / Then)

## Variants seen

- **Short pitch (10).** Cover, why now, idea, play, adventure, 2 art collages (strip + mixed grid), proof, business, ask. Sections: idea / play / art / proof+ask.
- **Internal crew deck (Cardboard Cartel, 59).** Same spine but heavy on systems (economy, lanes, progression: about 30 slides) and art (21: rarity ladder with one card mock per tier). It has no market or competitor slides, the ask is "Who's in?" with role cards, and the money slide is a full accent-color statement.
- **Publisher deck with a cost model (Idle Hands, 42).** Adds unit economics tables, cost by stage, funding scenarios, and a dollar ask ("$375K…"). It has only 1 art slide (`look`) because it was made before the 7+ art rule.
- **Partner or B2B pitch (19).** Puts the ask at slide 2, then gap → references → track record → fit → an 8-slide pipeline section → offer → plan → risks → next. It has no art section. It uses the partner's branding, not One Fifty Labs', so it has no ownership notice.

## Slide types that recur in almost every deck

Cover (title + framed mood art) · one-line hook · 3-stat "why now" · 4-card row of facts · today-vs-us gap · 4-step "how it plays" with one highlighted card and a callout · Lesson 1–4 teaching row · 5-step journey · full-bleed art + caption plate · 2x2 art grid · palette strip · card/tile anatomy mock · UI screen mockup built from divs · market table · "Try it free. Buy it once." business slide · phase roadmap with gates · Now/Next/Then ask.

Layout recipes for these are in `layouts.md`. Helpers for them are in `gen_deck.py`.
