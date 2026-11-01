# AI Art Pipeline (mood art for pitches and prototypes)

© 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

This is how we get consistent, full-resolution AI mood art into decks and prototypes. It's proven on Tilebound and Trickbound.

Planning to go further (anchors, a manifest, post-processing, final game art, cost and licensing)? See `pipeline-upgrade.md`.

## 1. Generate in Canva
- Start every job at once: `mcp__Canva__generate-image` with `aspectRatio: LANDSCAPE_16_9` (it returns 1680×944).
- Then poll each one with `get-generate-image-job`.
- Each job returns a Canva media id (e.g. `MAHYMHx42ek`) and a **thumbnail only (199×112)**. Don't use the thumbnail.

### Prompt recipe (house style so far)
Start every prompt with the same style lead so a set reads as one world:

> "2D storybook illustration, vintage 1920s Art Nouveau style with a light touch of folk magic: ink linework, flat jewel-tone colors on aged cream paper, gold leaf accents, ornate frame of …"

Then add:
- the subject
- a palette line
- "Original designs, not resembling any existing franchise characters. No text." (models still sneak in signage, so check)

These work well for people: "modern casual clothes", "different ages and ethnicities", "friendly adults".

Per game, keep one style lead and vary only the subject and palette.

### Trickbound: the Line (style leads, 2026-10-16)
- **Scenes:** "2D painterly illustration, loose expressive oil-sketch brushwork, lamplit melancholy, a fictional railway mining town, muted coal-black and brass palette with warm amber lamp glow, faint Art Nouveau ornament in ironwork."
- **Portraits (Disco Elysium-lite):** "Expressionist painterly portrait, bold loose brushstrokes, visible paint texture, moody muted palette of slate blue, ochre and deep brown with a single warm lamp highlight on the face."
- **Cards:** "Single vintage playing card illustration, 1920s Art Nouveau style rendered as <set material, e.g. etched tin> … No text, no letters, no numbers."

## 2. Get full resolution (the trick)
The workspace can't reach media.canva.com (the proxy blocks it). The **built-in browser pane can**, when it's logged in to Canva:

1. Find an open canva.com tab with `Claude_Browser__tabs_context`. If there isn't one, open https://www.canva.com with `preview_start`.
2. Run `Claude_Browser__javascript_tool` with `fetch-canva.js` (in this folder). It fetches each media id's `importFileUrl` and stores base64 strings on `window.__img`.
3. Return one image per call (`window.__img.<key>`). Results over the size limit are **saved automatically to a file** under `tool-results/`, so they never fill the context.
4. Decode them with `decode_tool_results.py` (run with `python3 -I`), which writes `<key>.jpg` at 1680×944.

## 3. Check before using
- Run `contact_sheet.py` (a 2×2 or 3×3 grid) and look at it once.
- Watch for:
  - stray text or signage
  - accidental franchise look-alikes
  - culture or theme leftovers from another game (e.g. Tilebound's pagodas on the island map)

## 4. Use
- **Slides decks:** upload as assets (`Artifact publish`, `asset:true`, `file_paths`), then use `/_blob/<id>`.
- **Web prototypes:** publish them as artifact `files` under `img/`, resized to about 1200px wide.
- Note which assets AI made, for Steam's AI disclosure.

## Reusable art per world
Tilebound and Trickbound share these files, so check before you generate new ones:
- critter families: `ember`, `tide`, `grove`, plus `dusk` (Spades only)
- `friends` (three tarot-style character cards)
- `island` (map with pagoda towns)
- `parlor` (mahjong)
- `tiles`, `tilesets`, `wardrobe`, `xr`
- portraits `bev`, `rosa`, `lena` (400px only)
- Spades only: `hand`, `court`, `club`

Canva media ids for the Spades set: hand MAHYMHx42ek, dusk MAHYMBHel9c, court MAHYMDQsTOk, club MAHYMGtNjP8.

**Trickbound: the Line** (2026-10-16), all 1680×944, reviewed clean:
| Key | Media id | Subject |
|---|---|---|
| depot | MAHYNvpr2js | Cinder Hollow depot card room, snow, train outside |
| car | MAHYNpZHt-Q | Conversation car at dusk, Dee and the player |
| stationmaster | MAHYNvnI5no | Stationmaster portrait, painterly, dark lantern |
| critters | MAHYNnk0zd0 | Lantern critters waking from cards (owlet, salamander, koi, mouse) |
| longtable | MAHYNhvb0VA | The Long Table at Terminus, crowd, last train |
| pitscard | MAHYNsnjkRc | Pits-set etched tin card, ember salamander with lantern |

**Tower Defense** (2026-10-19): mood boards for picking a direction. 1680×944 in Canva; only thumbnails pulled so far. Each direction has the same three subjects.
- Style lead A (moody painterly): "Moody painterly stylized 3D game concept art, muted dusk palette of slate blue, rust and brass with one warm lantern glow, lived-in melancholy atmosphere, painterly brushwork."
- Style lead B (cozy low-poly): "Cozy storybook low-poly 3D game art, bright saturated fantasy palette of meadow green, sunny gold, coral and sky blue, soft rounded shapes, warm daylight, charming cartoon fantasy."

| Key | Media id | Subject |
|---|---|---|
| a-keep | MAHYbuLm8vQ | A: keep on a hill at dusk, road lined with towers |
| a-towers | MAHYbpqJA1c | A: archer, cannon, lightning, frost towers |
| a-wave | MAHYbgC2qOo | A: raiders, brute, flyers, horned boss |
| b-keep | MAHYblq8eVI | B: keep with banners, winding road, towers |
| b-towers | MAHYbpusYMw | B: archer, cannon, lightning, frost towers |
| b-wave | MAHYblVFC8A | B: goblins, orc brute, flyers, horned boss |

**Art reference Hunter picked (2026-10-19):** a hand-painted fantasy cottage illustration by Jourdan Tuffan (2019): ink linework with painterly flat shading, teal-green slate roofs, warm brown timber, cream plaster, mossy ivy, dusty-rose sky. Inspiration only; never copy, trace or reproduce it. Draft palette pulled from it for the prototype: roof teal #4E8F86, timber #6B4226, plaster #F1E4CC, moss #6E9A4C, sky #D9C9C0, ink #3A2518.
- Candidate style lead C (the middle path): "Hand-painted fantasy concept art, confident ink linework over painterly flat color, storybook warmth with real atmosphere, teal slate roofs, warm timber and cream plaster, mossy greens, soft dusty-rose sky, readable chunky silhouettes."
- Generated in style lead C (2026-10-19), 1680×944 in Canva, thumbnails only so far: cover scene `td-cover` MAHYboDFmaI (keep on a hill, road lined with towers, horde in the distance) and tower lineup `td-towers` MAHYbg0LcY4 (archer, cannon, lightning spire, frost crystal). Reviewed from thumbnails: clean, no text. Fetch full-res through the browser pane before using in the deck.

## Gemini (Nano Banana): finals at volume
Canva throttles bursts: about one image every 10 to 30 minutes once a session gets busy (Card Trader v2, Nov 2026). For a shot list of more than a few images, use `kit/art/gemini.py`:

1. **One-time setup (the owner, never Claude):** claim the Google AI subscription's Cloud credits, make an API key in Google AI Studio, and set a budget alert at the credit amount. Store the key as `GEMINI_API_KEY` in your machine's environment. On Windows, run `setx GEMINI_API_KEY "<key>"`, then restart the Claude app and terminals. **Never commit it: the repo is public.**
2. **Write a job file** from the approved shot list (Card Trader's is `card-trader/art/v2-gemini-jobs.json`): prompts verbatim, anchors as local image files, an aspect and size per job, and a finishing step (crop, width, JPEG or WebP).
3. **Dry-run first:** `python3 kit/art/gemini.py <jobs.json> --dry-run`. It checks every anchor and prints the cost estimate. Then run it without `--dry-run`.
4. **Review every image** (R1 text, R12 hands and faces, R17 look-alikes). Then add rows to the game's `design/ai-assets.md` from `gemini-log.jsonl` (the prompt, refs, model and time of every call). Raw outputs (JPEG) stay in `<game>/art/gemini/` and are git-ignored; finished images go in `builds/img/`.

Defaults: `gemini-3.1-flash-image` (Nano Banana 2, about $0.067 a 1K image, $0.101 at 2K); `--model gemini-3-pro-image` for hero art. Up to 14 reference images per call. Check Gemini's terms for commercial use with the legal reviewer before anything ships in a sold game.
