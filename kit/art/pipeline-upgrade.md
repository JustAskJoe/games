# How to upgrade the art pipeline

© 2026 justaskjoe. All rights reserved.

**Status:** draft proposal, Oct 31, 2026. Nothing here changes how the Artist, the Art Cottage or CI work until someone opens the follow-up pull requests in [section 8](#8-a-leveled-roadmap). This doc doesn't edit `kit/agents/artist.md`, `.github/` or `CLAUDE.md`; it proposes the changes.

**Who it's for:** anyone in the collective who directs art, and the Artist agent. It's written to teach as well as plan, because the studio has strong game design and code but less art-pipeline experience. If a word is new, check [section 1](#1-words-youll-see).

**What it builds on:** `kit/art/README.md` (the Canva mood-art recipe), `kit/agents/artist.md`, `tower-defense/art/art-direction.md`, and Hunter's proposal `kit/art/pipeline-v2.md` (on the `hunter/card-trader-v1` branch, not pushed when this was written). Its main points (anchors, a manifest, batch and fetch tooling, WebP conversion, Canva `remove-background`) are folded in here. When that branch lands, keep `pipeline-v2.md` as the Card Trader worked example and link it from here, or merge the two.

**Who does the work:** the agent roster (team for now, team for later) is in `art-team.md`. The house rules every art agent follows are in `art-rules.md`, and what we learn along the way goes in `lessons.md`. The Lead Artist (`kit/agents/lead-artist.md`) keeps both.

---

## Contents

0. [The short answer](#0-the-short-answer)
1. [Words you'll see](#1-words-youll-see)
2. [Where we are today](#2-where-we-are-today)
3. [Why a generated image isn't final art yet](#3-why-a-generated-image-isnt-final-art-yet)
4. [Scope by discipline](#4-scope-by-discipline)
5. [Tool map](#5-tool-map)
6. [Where the cost is](#6-where-the-cost-is)
7. [Licensing and Steam AI disclosure](#7-licensing-and-steam-ai-disclosure)
8. [A leveled roadmap](#8-a-leveled-roadmap)
9. [Handing off to a human artist](#9-handing-off-to-a-human-artist)
10. [Decisions Hunter must make](#10-decisions-hunter-must-make)
11. [Sources](#11-sources)

---

## 0. The short answer

Hunter asked: *"It seems there's no way to funnel art well through Claude or Gemini to be final art?"*

**Mostly right, with an important "but".**

- **Claude can't make pictures.** It can't output a PNG. What it *can* do is everything around the picture: write the brief and prompts, draw vector art and UI as SVG, write shaders and particle code, write the scripts that batch, fetch, crop, resize and convert, check a set for drift, keep the manifest and the AI log, and drive the image tools (Canva, PixelLab, Gemini, Cloudflare) through their APIs and connectors. Think of Claude as the **art director and pipeline engineer**, not the painter.
- **Gemini (Nano Banana 2 and Pro), Canva, FLUX and gpt-image-2 make raster pictures,** and in late 2026 the pictures themselves are often good enough to ship. Our Oct 31 bake-off showed that: Canva's quality in the Card Trader style is great.
- **But a good picture isn't a finished game asset.** A shippable asset also needs: the same character looking the same in every image (*consistency*), a clean see-through background (*transparency*), the right size and format (*resolution*), sometimes frames that move (*animation*), and the right to sell it (*licensing*). Image models do the first 70% fast and cheap. The last 30% is where a person, a script or a paid tool comes in.

So the plan isn't "find a model that does final art". It's **build a pipeline around the models**: anchors so they stay consistent, a manifest so nothing is forgotten, scripts that do the boring post-processing, Claude doing the vector and code work, and a human artist for the hero assets and anything that has to move. That's what [section 8](#8-a-leveled-roadmap) lays out.

**Rule of thumb by asset type:**

| Asset | Can AI images ship as final? |
| --- | --- |
| Backgrounds, key art, card illustrations, portraits (stills) | **Yes, with cleanup.** A person checks every one; a paint-over for hero pieces. |
| Icons, UI frames, buttons, logos, anything with text | **Better made by Claude as SVG/CSS**, or by a person. Image models are bad at crisp edges and spelling. |
| Sprites that animate (walk, attack) | **Not yet reliably.** Frame-to-frame drift. Use a skeletal rig or a person. |
| 3D models | **Props yes, heroes no.** AI meshes need retopology and UV cleanup. |
| VFX | **Claude writes it as code** (shaders, particles). Image models only help with texture sheets. |
| Trailer | **A person edits it from real gameplay.** AI video is for a few mood shots at most. |

---

## 1. Words you'll see

| Word | What it means |
| --- | --- |
| **Key art** | The single hero illustration that sells the game: store page, deck cover, title screen. |
| **Style lead** | The opening sentence of every prompt for a game, so a set reads as one world (see `kit/art/README.md`). |
| **Anchor** | An approved reference image we feed back into the model every time: a **style anchor** (the look) and a **character anchor** (one character's face, outfit and colors). The fix for drift. |
| **Drift** | When the same character comes out with a different face, outfit or colors from one image to the next. |
| **Reference image** (`imageReferences` in Canva, "image input" elsewhere) | An image you pass to the model alongside the prompt so it copies style or identity. |
| **LoRA / custom model** | A small add-on trained on 15 to 50 of *your* images so a model learns your style or character. Scenario sells this as a service. |
| **Alpha / transparency** | The see-through part of a PNG or WebP. Sprites and cut-outs need a clean alpha edge with no halo. |
| **Halo / fringe** | A thin ring of the old background left around a cut-out. Common after background removal. |
| **Sprite** | A 2D image of a game object drawn on screen. **Spritesheet / atlas:** many sprites or frames packed in one image to load fast. |
| **9-slice** | A UI frame cut into 9 pieces so it can stretch to any size without blurring the corners. |
| **Rig / skeletal animation** | Bones inside a character that move its parts. 2D: Spine, DragonBones, Godot. 3D: Mixamo, Blender. |
| **Frame-by-frame** | Animation drawn one picture per frame. Most expressive, most work. |
| **Retopology** | Rebuilding a messy 3D mesh with clean, game-friendly polygons. AI meshes almost always need it. |
| **UVs** | How a 2D texture wraps around a 3D model. |
| **PBR** | "Physically based" textures: color, roughness, metal, normal maps. **Normal map:** fakes surface bumps with lighting. |
| **Cel-shading / toon shader** | A shader that lights 3D in flat bands with ink outlines. The Jet Set Radio look. |
| **Shader** | A small program that runs on the graphics card to colour pixels. Claude can write these. |
| **Capsule** | Steam's name for store-page images in fixed sizes. |
| **Manifest** | A list of every asset a game needs, with its size, state and status. Proposed in [8.1](#81-level-1-now-no-new-spend). |
| **Contact sheet** | A grid of thumbnails to review a set at a glance (`kit/art/contact_sheet.py`). |
| **Paint-over** | A person painting on top of an AI image to fix hands, faces and details and unify the set. |
| **WebP** | A modern image format. Our bake-off: a 3 MB PNG became 170 KB as WebP with no visible loss. |

---

## 2. Where we are today

Oct 31, 2026, from the bake-off in the Card Trader session and a read of the repo.

**What works**
- **Canva `generate-image`** makes great images in the new cel-shaded style. It's on the plan, so it costs plan credits, not money.
- **Style anchors work:** passing the approved key art as `imageReferences` keeps the style consistent across a set.
- **Canva `remove-background`** makes clean transparent cut-outs.
- **Full-size fetch** through the logged-in browser pane (`kit/art/fetch-canva.js`), and **WebP conversion in the browser** (3 MB PNG → 170 KB).
- **The Artist's concept sheets** are hand-drawn SVG: free, scalable, and they preview on GitHub.
- **The review loop** (issue → concepts PR → votes in the Art Cottage → `Pick: X` → `art-approved` → finals) is live.

**What doesn't**
1. **Canva over the API returns 199×112 thumbnails.** Full size needs a person-attended browser session, so the scheduled Artist can't get finals on its own.
2. **Canva throttles** at about 8 parallel jobs ("credit usage is cooling down").
3. **Characters drift** even with a style anchor. Each game needs per-character anchors.
4. **The Cloudflare roughs have never run:** the `ART_KEY` Actions secret isn't set (`kit/art/roughs.py` exits with "ART_KEY isn't set").
5. **No manifest:** nothing lists what a game needs, so "is the art done?" has no answer.
6. **No post-processing:** cropping, resizing to the sizes in `art-direction.md`, 2x exports, WebP, halo cleanup and atlas packing are all by hand.
7. **No path to a human artist:** the Artist's finals mode assumes a tool makes the finals.

**Small things noticed while reading (not fixed in this PR)**
- `tower-defense/art/art-direction.md` has `final_art_source` **twice** in its settings block (`undecided`, then `canva`), plus a `canva_roughs: on` key that `artist.md` doesn't read. An agent reading top-down could take the first one. Propose: keep one line, `final_art_source: canva`.
- The TD cost table still says "not filled in yet" for Canva. With Canva on plan credits, the honest entry is "0 money; plan credits; about N person-minutes to review".
- `ARCHITECTURE.md` §5 says the Finals task's prompt still lists Tower Defense only.
- `roughs.py` calls the endpoint "Flux Schnell". Cloudflare now also hosts FLUX.2 klein, which takes reference images (anchors). See [8.2](#82-level-2-small-spend-needs-hunters-ok).

---

## 3. Why a generated image isn't final art yet

A shipped asset goes through eight steps. Image models only do step 3.

```
1 Direction ─ 2 Anchors ─ 3 Generate ─ 4 Select ─ 5 Clean up ─ 6 Post-process ─ 7 Integrate ─ 8 Log
 (art-direction) (refs)    (model)      (person)   (person/tool)  (script)        (engineer)    (ai-assets)
```

| Step | What happens | Who does it today | Who should |
| --- | --- | --- | --- |
| 1. Direction | Look, palette, sizes, readability rules | `art-direction.md`, people | Same |
| 2. Anchors | Approved style and character reference images | Nobody (gap) | A person approves; the Artist stores them |
| 3. Generate | Make candidates | Canva by hand | The Artist, batched, from the manifest |
| 4. Select | Pick the best of 3 or 4, reject drift, stray text and look-alikes | A person, from thumbnails | A person, from a contact sheet |
| 5. Clean up | Fix hands, faces, details; repaint; unify | Nobody (gap) | Canva tools for small fixes; a human artist for hero assets |
| 6. Post-process | Background removal, crop, resize, 2x, WebP, halo fix, atlas | By hand | A script ([8.1](#81-level-1-now-no-new-spend)) |
| 7. Integrate | Wire into the build | Engineer | Same (the Artist never wires assets in) |
| 8. Log | AI disclosure row, license note | The Artist, partly | The Artist, every file, from the manifest |

**The five gaps between a picture and an asset**
1. **Consistency.** One good image is easy; sixty that look like one artist made them is hard. Anchors fix most of it; a custom model or a human paint-over fixes the rest.
2. **Transparency.** Models paint a background. Sprites, cards and portraits need clean alpha. `remove-background` works well on clear subjects, less well on hair, smoke and glass.
3. **Resolution and format.** Models make 1K to 4K squares or 16:9. Games need exact sizes (TD tower 160×192 at 2x), power-of-two atlases and small files. That's a script's job.
4. **Animation.** A model makes one frame. Getting frame 2 to match frame 1 is the hard part ([4.3](#43-animation)).
5. **Licensing.** Each tool has its own terms, and purely AI-made images may not be copyrightable in the US ([section 7](#7-licensing-and-steam-ai-disclosure)).

---

## 4. Scope by discipline

How to read each table:
- **Final means:** what a shipped commercial indie game needs.
- **AI today:** what works in late 2026.
- **Falls short:** where a person or paid tool is still needed.
- **Access:** 🔌 API (scriptable from a workflow), 🧩 MCP connector (Claude can drive it in a session, not from a plain GitHub Action), 🖱️ UI only (a person clicks).

Our connectors right now: Canva 🧩, PixelLab 🧩. Cloudflare Workers AI 🔌 through the site endpoint (needs `ART_KEY`). Gemini API 🔌 would need a key Hunter adds.

### 4.1 2D

#### Key art
| | |
| --- | --- |
| **Final means** | One hero illustration at 4K or more, layered so the logo and capsule crops can be made from it, readable as a thumbnail, no stray text. |
| **AI today** | Strong. Canva, Nano Banana Pro, gpt-image-2 and FLUX all make key-art-quality stills. Use the style anchor. |
| **Falls short** | Composition for many crops (Steam needs about eight sizes), hands and faces at full zoom, a logo with real typography, layers. Usually worth a paid **paint-over** because it's the most-seen image. |
| **Access** | Canva 🧩 (full size only via the browser fetch). Gemini 🔌. Cloudflare FLUX 🔌. gpt-image-2 🔌. Photoshop / Krita / Procreate 🖱️ for the paint-over. |

#### Characters and portraits
| | |
| --- | --- |
| **Final means** | Each character recognizably the same in every image: face, hair, outfit, colors, proportions. Usually a turnaround or model sheet plus 3 to 6 expressions per character, transparent background. |
| **AI today** | Good with a **character anchor**: Nano Banana 2 / Pro and FLUX.2 take several reference images; Canva takes `imageReferences`. Expressions from one anchor work fairly well. |
| **Falls short** | Drift over a big set (our bake-off saw it), small details (logos on clothes, jewelry), the same character from the back. A person approves the anchor and rejects drift. A custom model (Scenario, LoRA) helps at Level 3. |
| **Access** | Canva 🧩, Gemini 🔌, Cloudflare 🔌, Scenario 🔌 and 🖱️, PixelLab 🧩 (pixel only). |

#### Sprites (in-game objects and characters, static)
| | |
| --- | --- |
| **Final means** | Exact pixel size, transparent, consistent light direction and outline weight across the set, readable silhouette at real size on a phone. |
| **AI today** | Painted props and static sprites: good, then background removal and resize. Pixel art: PixelLab is purpose-built (8-direction objects and characters, tilesets). |
| **Falls short** | Matching outline weight and light across 40 sprites; sub-pixel mush when a painted image is shrunk to 80 px. Design at real size, check on a phone, and give tiny sprites a person's cleanup. |
| **Access** | Canva 🧩, Gemini 🔌, PixelLab 🧩 (and an API, pricing unverified), Aseprite 🖱️ for pixel cleanup. |

#### UI and icons
| | |
| --- | --- |
| **Final means** | Crisp at every size, 9-slice frames, states (normal, pressed, disabled), icons in one consistent set, legible text, accessible contrast. |
| **AI today** | **Claude as SVG/CSS is the best tool here.** Vector UI is crisp, tiny, themeable and editable. Image models are fine for a painted UI *texture* (a parchment panel), poor for icons as a set and for any text. |
| **Falls short** | A consistent 40-icon set with real taste. A person (or an icon pack with a clear license) helps. |
| **Access** | Claude writes it in the repo. Figma 🖱️ (has an API for reading, not drawing). Canva 🧩 for painted panels. |

#### Cards (Card Trader, Trickbound, Tilebound)
| | |
| --- | --- |
| **Final means** | A card **frame** (vector or 9-slice, per rarity/set) plus an **illustration** per card, plus text the game renders (never baked into the image). Every illustration same style, same crop, same light. |
| **AI today** | Illustrations: strong with a style anchor and a set-material line (as in Trickbound's "etched tin"). Frames: Claude as SVG. Text: the game draws it. |
| **Falls short** | 60+ illustrations without drift; making a "rare" look rarer. A person curates; paid paint-over on rares. |
| **Access** | Canva 🧩, Gemini 🔌, Cloudflare 🔌; frames by Claude. |

#### Tiles and backgrounds
| | |
| --- | --- |
| **Final means** | Backgrounds: full screen at 2x, room for UI, parallax layers if the game scrolls. Tiles: seamless edges, a full set (corners, edges, transitions), consistent scale. |
| **AI today** | Backgrounds: strong. Seamless tiles: weak in general image models; PixelLab has tileset tools for pixel art. Painted tiles often work better drawn by Claude as patterned SVG or made by a person. |
| **Falls short** | Seams, transition tiles, parallax layer separation (Canva's `separate-image-layers` may help; not tested). |
| **Access** | Canva 🧩, Gemini 🔌, PixelLab 🧩. |

### 4.2 3D

The collective's 3D work so far is the Gate Runner (`zach/gate-runner-3d`) and Tower Defense's low-poly mood board. For a cel-shaded game, the **shader** (Claude can write it) does a lot of the look, and models can be simpler.

#### Models
| | |
| --- | --- |
| **Final means** | Clean low-poly mesh with sensible polygon count, good UVs, correct scale and pivot, LODs for big scenes, exported as glTF/GLB. |
| **AI today** | Image-to-3D (Tripo, Meshy, Rodin/Hyper3D) makes usable **props** in a minute or two. Plans around $20 to $30 a month for about 1,000 to 3,000 credits (unverified, see [section 5](#5-tool-map)). Tripo has an MCP and an API. Claude can also write simple models as code (three.js, procedural meshes). |
| **Falls short** | Hero characters (bad edge flow for animation), hard-surface accuracy, triangle soup that needs retopology. A person in Blender for anything the camera looks at closely. Free tiers are often non-commercial. |
| **Access** | Tripo 🔌 🧩, Meshy 🔌, Rodin 🔌, Blender 🖱️ (and Python scripting, so Claude can write Blender scripts). |

#### Texturing
| | |
| --- | --- |
| **Final means** | Textures that match the art direction. For cel-shading: flat color maps and maybe a ramp texture, not full PBR. |
| **AI today** | The 3D tools texture automatically. Image models make tileable textures and color ramps. For a toon look, Claude's shader + flat vertex colors often beats AI textures. |
| **Falls short** | Seams across UVs, baked-in lighting that fights the toon shader. |
| **Access** | Same as models; Substance Painter 🖱️ (paid). |

#### Rigging
| | |
| --- | --- |
| **Final means** | A skeleton with good weights so joints bend cleanly; humanoid rigs compatible with animation libraries. |
| **AI today** | **Mixamo** auto-rigs humanoids and gives free animations, royalty-free for games, but it looks unmaintained and is humanoid T-pose only. Some 3D AI tools auto-rig too (unverified). |
| **Falls short** | Non-humanoids, faces, cloth. A person in Blender. |
| **Access** | Mixamo 🖱️, Blender 🖱️ / Python. |

### 4.3 Animation

This is the hardest area for AI and the one most likely to need a person or a paid tool.

#### 2D sprite (frame-by-frame)
| | |
| --- | --- |
| **Final means** | Every frame the same character, feet planted (no sliding), clean timing, a full set of loops (idle, walk, action, hit), packed in an atlas. |
| **AI today** | Pixel art: PixelLab animates characters with templates and skeletons, the most game-ready option we have. Painted: tools that turn one still + motion into a spritesheet exist (Ludo, Sorceress and others), and template motions like "walk right" are the most consistent, but every source we found is the vendor's own write-up. |
| **Falls short** | Identity drift between frames, foot sliding, custom motions. Plan on a person checking frame by frame and fixing in Aseprite. |
| **Access** | PixelLab 🧩, vendor tools 🖱️ (APIs vary), Aseprite 🖱️ (has Lua scripting). |

#### 2D skeletal (cut-out)
| | |
| --- | --- |
| **Final means** | A character cut into parts (head, arms, torso), rigged with bones, animated with smooth curves. Cheap to add animations once rigged. |
| **AI today** | **This is the best fit for AI-made painted characters**: generate a character in a neutral pose, cut it into parts (Canva `separate-image-layers` or by hand), and rig in Spine or the engine. No frame-to-frame drift, because it's one drawing moved around. |
| **Falls short** | Cutting and filling hidden areas (the part of the arm under the sleeve) is a person's job. Rigging takes skill. |
| **Access** | Spine 🖱️ (Professional about $369 to $439 one-time, unverified), DragonBones 🖱️ (free), Godot/Unity built-in 🖱️, or code-driven tweens Claude writes for simple motion (bob, squash, sway). |

#### 3D animation
| | |
| --- | --- |
| **Final means** | Clean loops without foot sliding, retargeted to our rig, blended in the engine. |
| **AI today** | Libraries: Mixamo (free), Quaternius CC0, Rokoko free clips. Video-to-motion capture tools exist. |
| **Falls short** | Custom, stylized motion (the Jet Set Radio swagger). A person, or keep motion simple and stylized in code. |
| **Access** | Mixamo 🖱️, Blender 🖱️ / Python. |

### 4.4 VFX

Good news: most game VFX is **code**, and Claude writes code.

| Kind | Final means | AI today | Falls short | Access |
| --- | --- | --- | --- | --- |
| **Particles** (sparks, coins, dust, hit bursts) | Readable, fast on a phone, matched to the palette | Claude writes canvas/WebGL particle systems or engine configs directly | Taste and timing: someone tunes it on a phone | In the repo |
| **Shaders** (cel-shading, outlines, dissolves, glows, screen shake) | Runs at 60 fps on a mid phone | Claude writes GLSL/WGSL/Godot shaders well | Performance on low-end devices; needs a device test | In the repo |
| **Spritesheet effects** (painted explosions, smoke, magic) | A loop of 8 to 16 frames, transparent, small | Image models make single frames; PixelLab has a VFX workbench for pixel effects; EmberGen (paid) simulates and bakes | Frame-to-frame consistency; the same drift problem as animation | PixelLab 🧩, EmberGen 🖱️ |

### 4.5 Everything else a small studio needs

| Need | Final means | AI today | Falls short | Access |
| --- | --- | --- | --- | --- |
| **Fonts** | A licensed display font and a readable body font, embedded legally | AI can't design a good font. PixelLab has `create_font` for pixel fonts (untested). | Use **Google Fonts (SIL Open Font License)** or buy a license. Check the license allows embedding in a game. | Google Fonts 🔌 |
| **Logo / wordmark** | Vector, works in one color, readable at 32 px | Claude draws SVG wordmarks from a licensed font; image models misspell | A designer for a real brand mark | In the repo |
| **Store art (Steam)** | Fixed sizes: header capsule 920×430, small 462×174, main 1232×706, vertical 748×896, library capsule 600×900, library hero 3840×1240, library logo 1280×720, page background 1438×810, plus 5+ screenshots (sizes from memory: **check Steamworks' graphical assets page**) | Make them from layered key art; a script crops and resizes | The logo on every capsule must be readable; Valve reviews capsules | Script + key art |
| **Screenshots** | Real gameplay, no mock-ups | Capture from the build; Claude can script a headless capture | Must show the real game (Steam rule) | In the repo |
| **Trailer** | 60 to 90 s, real gameplay first, logo, call to action | AI video (Veo 3.1 at about $0.10 to $0.40 a second, unverified) for a couple of mood shots | Editing, pacing, music. A person edits; licensed music only | Veo 🔌, any editor 🖱️ |
| **Social and deck art** | Many sizes, on brand | Canva is built for this; the deck kit already uses it | — | Canva 🧩 |
| **App icon** | 1024×1024 master, readable at 48 px | Image model + cleanup, or Claude SVG | A person checks at small size | Canva 🧩, Gemini 🔌 |

---

## 5. Tool map

Prices are what we found on Oct 31, 2026. **"Checked"** means we read it on the vendor's own page; everything else came from third-party sites and must be checked before any spend.

| Tool | Makes | Access | Price | Checked? | Notes |
| --- | --- | --- | --- | --- | --- |
| **Claude** (us) | SVG, CSS, shaders, particles, scripts, prompts, briefs, Blender/Aseprite scripts | In the repo | Already paid | — | No raster images |
| **Canva** `generate-image`, `remove-background`, `separate-image-layers` | Stills, cut-outs, layers | 🧩 MCP; full size only via the browser fetch | Plan credits (Hunter: not real money) | Bake-off Oct 31 | Thumbnails over the API; about 8 parallel jobs before throttling |
| **Gemini API: Nano Banana 2** (Gemini 3.1 Flash Image) | Stills, edits, multi-reference | 🔌 | $0.045 (0.5K), $0.067 (1K), $0.101 (2K), $0.151 (4K); **batch half price** | **Checked** (ai.google.dev pricing) | No free API tier for image models; AI Studio use is free |
| **Gemini API: Nano Banana Pro** (Gemini 3 Pro Image) | Higher-fidelity stills, better text | 🔌 | $0.134 (1K/2K), $0.24 (4K); batch $0.067 / $0.12 | **Checked** | |
| **Google AI Pro → Cloud credits** | $10 a month of Google Cloud credit, usable on the Gemini API | 🔌 | Included with AI Pro | Google blog (not the billing page) | Must be activated on a Cloud billing account; not shareable; expires after a year. That's about 150 Nano Banana 2 images at 1K a month, or 300 in batch |
| **Cloudflare Workers AI: FLUX.2 klein 9B** | Stills, up to 4 reference images (per the bake-off notes) | 🔌 via our site endpoint | $0.015 first megapixel; $0.002 each extra MP and per input-image MP; 10,000 free neurons a day (about 7 images) | **Checked** (Cloudflare pricing docs) | Weights are under FLUX's non-commercial license: **legal question** ([section 7](#7-licensing-and-steam-ai-disclosure)) |
| **Cloudflare: FLUX.2 klein 4B** | Stills, faster, lower quality | 🔌 | Per 512×512 tile, cheaper than 9B | Cloudflare changelog | **Apache 2.0**, the cleanest license here |
| **Cloudflare: Flux Schnell** (what `roughs.py` calls today) | Roughs | 🔌 | Free tier | — | No reference images |
| **OpenAI gpt-image-2** | Stills, edits, good text | 🔌 | Token-billed; about $0.05 to $0.21 per 1024 image depending on quality | Third-party only | Needs an OpenAI key (spend) |
| **Scenario** | Custom style/character models, game assets | 🔌 and 🖱️ | Help center: free Starter, Creator $15/mo, Pro $45/mo; others quote $20 to $200 | Partly (help center) | Train on 15 to 50 of our images |
| **PixelLab** | Pixel art: characters, 8-direction, animation, tiles, UI, VFX, fonts | 🧩 MCP (connected); API exists | About $10 to $60/mo (third-party) | No (pricing page 404'd) | Pixel only; TD dropped pixel on Oct 28 |
| **Tripo** | Image-to-3D, texture | 🔌 🧩 | Pro about $19.90/mo for 3,000 credits | No | Free tier reported as CC BY |
| **Meshy** | Text/image-to-3D | 🔌 | Pro about $20/mo for 1,000 credits | No | Free tier non-commercial |
| **Rodin / Hyper3D** | High-quality image-to-3D | 🔌 | $30 to $120/mo, sources disagree | No | |
| **Mixamo** | Humanoid auto-rig, animation library | 🖱️ | Free | Adobe FAQ (via search) | Royalty-free for games; looks unmaintained |
| **Spine** | 2D skeletal animation | 🖱️ | Professional $369 sale / $439 list, one-time; Essential lower | Official store (via search) | Over $500k revenue needs Enterprise |
| **Veo 3.1** | Video clips | 🔌 | About $0.10 (Fast) to $0.40 (Standard) a second | No (not on the pricing page we read) | Trailer mood shots only |
| **Blender, Krita, Aseprite, GIMP** | Everything by hand | 🖱️ (Blender and Aseprite scriptable) | Free (Aseprite about $20) | — | Where a human artist works |

---

## 6. Where the cost is

### 6.1 The honest answer

The **money** for AI images is tiny: cents per image, or plan credits. The **real cost is people's hours**: directing, picking, cleaning, fixing drift, cutting out, resizing, animating, and keeping records. A pipeline upgrade is mostly about cutting those hours with scripts and anchors, and spending human-artist money only where players look hardest.

### 6.2 A typical 2D indie game

Say a Card Trader-sized game, 2D, phone-first web with a possible Steam release:

- 1 key art, 8 characters with 3 expressions each (24 portraits)
- 60 card illustrations, a UI kit with 40 icons
- 6 backgrounds, 2 animated characters (4 loops each)
- 10 VFX, a logo, a store-art set, a 60 to 90 second trailer

**Assumptions:** AI images at about 4 tries per kept image. Money shown at Nano Banana 2, 1K, standard price ($0.27 per kept image). With Canva it's $0 money and plan credits. Freelance rates $25 to $60 an hour, which is the range for solo indie freelancers in the sources we found (itch.io listings go lower; studios charge $40 to $80+). **Commission prices are rough market ranges from third-party sources, not quotes.** Hours are estimates, not measured.

| Asset (count) | A. AI only: money / studio hours | B. AI + freelance cleanup: artist hours (money) | C. Fully commissioned: money |
| --- | --- | --- | --- |
| Key art (1) | ~$1 / 3 h | 6–10 h paint-over ($150–600) | $500–2,000 |
| Portraits (8 × 3) | ~$3–7 / 6 h | 8–16 h ($200–960) | $1,200–3,200 ($150–400 per character) |
| Card illustrations (60) | ~$16–30 / 10 h | 30 h, about 30 min each ($750–1,800) | $2,400–9,000 ($40–150 each) |
| UI kit + 40 icons | ~$5 / 8 h (mostly Claude SVG) | 15–25 h ($375–1,500) | $1,500–4,000 |
| Backgrounds (6) | ~$2 / 4 h | 12–24 h ($300–1,440) | $900–3,000 |
| Animated characters (2 × 4 loops) | ~$5–20 / 10 h, **often not shippable** | 16–30 h ($400–1,800) | $1,000–3,000 |
| VFX (10) | $0 / 5 h (Claude code) | 5–10 h tuning ($125–600) | $500–2,000 |
| Store art set | ~$2 / 4 h | 6–10 h ($150–600) | $500–2,000 |
| Logo | $0 / 2 h (Claude SVG + licensed font) | 2–4 h ($50–240) | $200–1,000 |
| Trailer | ~$20–60 / 8 h | 10–20 h edit ($250–1,200) | $1,000–5,000 |
| **Total** | **about $55–130 and ~60 studio hours** | **about $2,750–10,700 and 110–180 artist hours**, plus ~40 studio hours and the AI money from column A | **about $9,700–34,000**, plus ~20 studio hours to brief and review |

**How to read it**
- **A. AI only** is right for prototypes, the Lab, decks and game jams, and is possible for a small web release. Expect visible drift, weak animation, and a "generated" feel in places. Steam disclosure required.
- **B. AI plus a freelance cleanup artist** is the sweet spot for a commercial release. AI does the volume; a person unifies it and does what AI can't (animation, hero paint-overs). You pay roughly a third of the commissioned price.
- **C. Fully commissioned** gives the most consistency and the clearest copyright, and no AI disclosure for art. It's 3 to 10 times B.
- A **mix** is normal: commission the key art and the two animated characters, AI-plus-cleanup for everything else.

### 6.3 Per-image money, side by side

For one kept 1K image at 4 tries:

| Source | Money | Notes |
| --- | --- | --- |
| Canva | $0 (plan credits) | Full size needs the browser fetch |
| Cloudflare FLUX.2 klein 9B | ~$0.06 (or free inside 10k neurons/day) | Add ~$0.002 per reference MP |
| Nano Banana 2 (batch) | ~$0.14 | Covered by the $10 AI Pro credit up to ~70 kept images a month |
| Nano Banana 2 (standard) | ~$0.27 | |
| Nano Banana Pro | ~$0.54 (batch ~$0.27) | Better for text, detail |
| gpt-image-2 | ~$0.20–0.84 | Unverified |

---

## 7. Licensing and Steam AI disclosure

**Not legal advice.** The studio's legal reviewer (`.claude/agents/legal-reviewer.md` in `studio-private`) should give each line a 🟢/🟡/🔴 before we ship anything commercially. Terms change; re-check each tool's terms when a game goes to store.

### 7.1 Per tool

| Tool | Who owns outputs | Commercial use | Watch out | Status |
| --- | --- | --- | --- | --- |
| **Canva** | Per Canva's help page, you can use AI-made work commercially, subject to its AI Product Terms | Yes, inside designs | **Question for the legal reviewer:** sources disagree on whether raw AI images can be sold or distributed "standalone / as-is". A game ships image files as-is inside the build, so we need a clear answer. Also: Canva adds C2PA provenance metadata, and its terms reportedly require disclosure on social posts. We couldn't open the terms page (403). | 🟡 open |
| **Gemini API** (Nano Banana) | Google doesn't claim ownership (secondary sources) | Allowed per secondary sources | Every image carries an invisible **SynthID** watermark; don't try to remove it. No IP indemnity reported. | 🟡 check Gemini API terms |
| **Cloudflare FLUX.2 klein 9B** | — | API outputs reportedly OK commercially | The 9B **weights** are under the FLUX Non-Commercial License; sources disagree on whether that limits outputs. **Ask the legal reviewer**, or use **klein 4B (Apache 2.0)** to avoid the question. | 🟡 open |
| **Cloudflare FLUX.2 klein 4B** | — | Yes | Apache 2.0, no extra terms | 🟢 likely |
| **OpenAI gpt-image-2** | Assigned to the user | Yes per terms | Outputs may not be unique | 🟡 check API terms |
| **Scenario** | Check terms | Paid plans | Training on our own images only | 🟡 not read |
| **PixelLab** | Reportedly cleared for commercial games | Yes (reported) | Can't use outputs to train other AI | 🟡 not read |
| **Tripo / Meshy / Rodin** | Paid plans | Paid plans only, free tiers are non-commercial or CC BY | Pick a paid plan before shipping | 🟡 not read |
| **Mixamo** | Adobe keeps the files | Royalty-free in games | Can't redistribute raw files; no ML training | 🟢 per Adobe FAQ |
| **Google Fonts** | — | SIL OFL allows embedding | Keep the license file | 🟢 |
| **Claude** (SVG, code) | Ours | Yes | Treat as AI-made in the disclosure only if it ships as content | 🟢 |

### 7.2 Copyright: what the US Copyright Office says

The Copyright Office's January 2025 report (Part 2) says, in short: **prompts alone don't make you the author.** A purely AI-made image probably isn't protected by copyright, so someone could copy it. What *is* protected: your own human-made changes, and your creative selection and arrangement of AI pieces. Decided case by case.

What that means for us:
- A competitor could, in theory, reuse a raw AI card illustration. That's a business risk, not a reason to stop.
- Human paint-overs, our own layouts, frames, UI and code **are** ours. Option B (AI plus cleanup) is better protected than A.
- Keep a record of human changes per asset (the manifest's `human_edit` field, [8.1](#81-level-1-now-no-new-spend)).

### 7.3 Steam AI disclosure

Valve rewrote the Content Survey in January 2026. From the Steamworks page itself:

- **Pre-Generated:** "any kind of content that ships with your game and is consumed by players" made with AI. Must be described in the survey, and is reviewed like any other content.
- **Live-Generated:** content made by AI *while the game runs*. Must be described, with your guardrails.
- **Exempt:** AI used only for efficiency in development (for example coding assistants). Claude writing our code isn't disclosed; Claude-drawn SVG that ships as art should be listed to be safe.
- Disclosures are your attestation; a label doesn't excuse anything else.

**What we already do:** `CLAUDE.md` asks for a list in each game's `design/` of AI-made assets, and the Artist logs to `design/ai-assets.md`. **Proposed:** generate that file from the manifest (one source of truth) and add a "Steam survey text" section at the bottom that the release owner pastes into the survey.

---

## 8. A leveled roadmap

Each level says what changes in four places: **the Artist** (`kit/agents/artist.md`), **the Art Cottage** (Studio HQ), **the art workflows** (`.github/workflows/` and `kit/art/`), and **each game's** `art/art-direction.md`. Edits to `artist.md` and `.github/` go in their own pull requests (Guard asks for a second approval on `.github/` changes).

### 8.1 Level 1: now, no new spend

**Goal:** the pipeline we have, made reliable. Canva for raster, Claude for vector and code, scripts for the boring parts.

**Per game: anchors.** New folder `<game>/art/anchors/`:
```
<game>/art/anchors/
  style-01.webp          # approved key art, the style anchor
  style-02.webp          # optional second style reference
  char-<name>.webp       # one per character: front, neutral pose, plain background
  char-<name>-sheet.webp # optional turnaround / expressions once approved
  palette.json           # the palette table from art-direction.md, machine-readable
  README.md              # who approved each, when, from which issue
```
- Only a person can add an anchor (via a `Pick:` on a concepts PR labelled `anchor`).
- Every generate call passes `style-01` plus the relevant `char-*` as references.
- Anchors are AI-made files: log them in `ai-assets.md`.

**Per game: a manifest.** New file `<game>/art/manifest.json`, the list of every asset the game needs:
```json
{
  "game": "card-trader",
  "updated": "2026-10-31",
  "assets": [
    {
      "id": "char-vex-happy",
      "category": "portraits",
      "brief": "Vex, the shop's rival trader, grinning, holding a holo card",
      "anchors": ["style-01", "char-vex"],
      "size": [512, 512], "export_scale": 2, "alpha": true, "format": "webp",
      "source": "canva",
      "status": "needed",
      "file": "art/final/portraits/char-vex-happy.webp",
      "tool_id": null,
      "human_edit": null,
      "issue": null
    }
  ]
}
```
- `status` goes `needed → rough → picked → final → shipped` (or `cut`).
- `source` is `canva | gemini | cloudflare | pixellab | claude-svg | human | commission`.
- `human_edit` records what a person changed (for copyright and Steam).
- The Artist reads it to know what to make; the Art Cottage reads it to show progress; `ai-assets.md` can be generated from it.

**Tooling in `kit/art/`** (new files, no `.github/` changes):
- `canva-batch.md` + a small helper: start jobs **6 at a time** (under the ~8 limit), and on "credit usage is cooling down" wait 60 s and retry, doubling up to 5 minutes. Save every media id into the manifest's `tool_id` right away so a crash loses nothing.
- Extend `fetch-canva.js`: fetch full size and **convert to WebP in the browser** (the bake-off trick), keyed by manifest `id`.
- `post.py`: one command per game that, for each manifest row in `picked`, does: trim, background removal check (alpha present?), **halo cleanup** (erode the alpha edge 1 px), resize to `size` × `export_scale`, export WebP/PNG, and write a contact sheet. Needs Pillow (`pip install pillow`); run it locally or in a Claude session, not in CI yet.
- `check_set.py` (optional): flags images whose average colors drift far from `palette.json`. Cheap drift alarm, not a judge.

**What Claude makes directly (no image model):** UI frames, 9-slice panels, card frames, icons, logos (with a Google Font), VFX particles and shaders, simple code-driven animation (bob, squash, sway).

**Proposed `artist.md` changes (separate PR):**
1. Add "Read `kit/art/art-rules.md`, `<game>/art/lead-plan.md`, `<game>/art/manifest.json` and `<game>/art/anchors/`" to *Where things are*.
2. In concepts mode: if a game has no anchors, the first concepts PR proposes a style anchor (2 or 3 key-art candidates) and asks for `Pick:`.
3. In both modes: pass anchors as references on every generate call; log the anchors used per file.
4. In finals mode: update the manifest row status and `tool_id`; never mark `final` without a person's pick.
5. New "Vector first" rule: UI, icons, frames, logos and VFX are drawn as SVG/code unless `art-direction.md` says otherwise.
6. Handoff: if a manifest row has `source: human` or `commission`, write a handoff package ([section 9](#9-handing-off-to-a-human-artist)) instead of generating.

**Proposed `art-direction.md` additions (per game):**
```
roughs: canva                 # until ART_KEY exists
final_art_source: canva       # one line only
anchors: art/anchors/         # style-01 required before finals
manifest: art/manifest.json
vector_first: [ui, icons, frames, logo, vfx]
cleanup: none                 # none | self | freelance
```
plus a filled-in cost table in **hours** as well as money.

**Art Cottage (Studio HQ):** read-only additions: show the game's anchors on its page, and a progress bar from the manifest (`final` / total). No new secrets.

**Limits at Level 1:** finals still need a person-attended browser session for Canva full size. That's the main reason for Level 2.

### 8.2 Level 2: small spend, needs Hunter's OK

**Goal:** the Artist can make full-size finals on its own, headless, with anchors. About $0 to $30 a month.

1. **Hunter adds `ART_KEY`** (Actions secret) so `art-roughs.yml` finally runs. Cost $0 inside the free tier.
2. **Switch roughs to FLUX.2 klein** with the style anchor as a reference image. Prefer **4B (Apache 2.0)** until the legal reviewer clears 9B. Change in `roughs.py` and the site's `/art/api/rough` endpoint (Hunter deploys the site).
3. **Gemini API as a headless finals source.** Activate the AI Pro $10 monthly Cloud credit (Hunter), create a Gemini API key, add it as a secret (Hunter). Nano Banana 2 with multi-reference anchors, batch mode at half price. About 70 kept 1K images a month inside the credit. Add `final_art_source: gemini` as an option.
4. **A finals workflow** (`art-finals.yml`, own PR, Guard approval): runs on `art-approved`, reads the manifest rows for the issue, generates with anchors, runs `post.py`, commits to the `art/…` branch, opens the PR. Hard cap per run (like `MAX_PER_RUN`) and a monthly budget line in `art-direction.md`.
5. **Paid cleanup for hero assets** (Hunter approves each): key art paint-over and the first character anchor sheet per game. Budget about $150 to $600 per game ([6.2](#62-a-typical-2d-indie-game)).
6. **Art Cottage:** per-asset pick (not only per concept set), a "needs cleanup" button that flips a manifest row to `source: human`, and a monthly spend line read from the finals runs.
7. **`artist.md`:** add `gemini` to finals mode with the same balance check rule (stop if over estimate or 20% over).

### 8.3 Level 3: a real art budget, for a commercial release

**Goal:** a game that looks hand-made on Steam. Roughly column B or a mix with C in [6.2](#62-a-typical-2d-indie-game).

1. **A custom style model per game**: Scenario (Creator/Pro) or a LoRA trained on our approved anchors and paint-overs. Only on our own images. Cuts drift across big sets.
2. **A freelance art lead on a small retainer** who owns the style guide, does paint-overs, and approves anchors. The Artist becomes their assistant: it drafts, batches and post-processes; the human finishes.
3. **Animation tooling:** Spine Professional (one seat) for painted characters, or PixelLab's paid tier for pixel games. Commission hero animations.
4. **3D games only:** a Tripo or Meshy paid plan for props, a Blender artist for heroes and retopology, Claude's toon shader for the look.
5. **Automated QA:** contact sheets on every finals PR, palette drift checks, size/alpha checks in Checks CI (own PR).
6. **Store and trailer:** key art commissioned or painted over; a person edits the trailer from captured gameplay.
7. **Legal:** every tool's terms reviewed by the legal reviewer; Steam survey text generated from the manifest.

### 8.4 Summary

| | Level 1 (now) | Level 2 | Level 3 |
| --- | --- | --- | --- |
| Money | $0 | ~$0–30/mo + per-game paint-overs | Hundreds to thousands per game |
| Raster source | Canva (person-attended full size) | Gemini headless + Canva | Custom model + human artist |
| Consistency | Style + character anchors | Anchors in every API call | Custom model + art lead |
| Post-processing | `post.py` run by hand | `post.py` in the finals workflow | Plus QA checks in CI |
| Animation | Code tweens, PixelLab for pixel | Same + paid cleanup | Spine / commissioned |
| Human artist | None | Hero paint-overs | Art lead on retainer |
| Hunter must | Approve anchors | Add secrets, approve spend, deploy endpoint | Set a budget, sign contracts |

---

## 9. Handing off to a human artist

When a manifest row says `source: human` or `commission`, the Artist writes a **handoff package** in `<game>/art/handoff/<id>/` instead of generating:

- `brief.md`: the brief template from `art-direction.md`, filled in, plus where it shows and at what size on a phone.
- The **anchors** it must match (links to files in `art/anchors/`).
- The **AI rough or pick** if there is one, marked "reference, repaint freely".
- **Deliverables:** exact sizes, 2x export, transparent PNG and the layered source file (PSD/KRA), file names matching the manifest `file`.
- **Palette** hex codes from `art-direction.md`.
- **Deadline and budget** (filled in by a person, never by the agent; no prices in the public repo if they're client or revenue details).

**Finding someone:** itch.io's for-hire boards, ArtStation, Polycount, r/gameDevClassifieds. Ask for a paid test piece (one portrait cleanup) before a bigger job.

**Contract basics (for the legal reviewer):** work-for-hire or a full assignment of rights; permission to show it was AI-assisted; whether they're OK working over AI roughs (some artists aren't, and that's their call); credits in the game.

**Where it lives:** finished files go to `art/final/…` on an `art/…` branch via a PR like any other; the manifest row goes to `final` with `human_edit` filled in. Contracts and rates stay out of this public repo.

---

## 10. Decisions Hunter must make

**Now (Level 1, no spend)**
- [x] Approve this plan as the direction. (Hunter, Oct 31, 2026)
- [x] OK the Level 1 PRs: `artist.md` changes ([8.1](#81-level-1-now-no-new-spend)) and the new `kit/art/` scripts. (Hunter, Oct 31, 2026)
- [x] Pilot game: **Card Trader**. (Hunter, Oct 31, 2026)
- [x] Card Trader's style anchor (v1 title key art) and set and species anchors: see `card-trader/art/art-direction.md`. (Hunter, Oct 31, 2026)
- [x] Fix `tower-defense/art/art-direction.md`'s duplicate `final_art_source`: kept `canva`. (Hunter, Oct 31, 2026)
- [x] "Vector first" is the studio rule (R2 in `art-rules.md`). (Hunter, Oct 31, 2026)

**Legal (ask the legal reviewer)**
- [ ] Can we ship raw Canva AI images inside a commercial game build, given the "not standalone / as-is" reading of Canva's AI Product Terms?
- [ ] Are FLUX.2 klein 9B outputs via Cloudflare OK commercially, or should we use 4B (Apache 2.0)?
- [ ] Gemini API and gpt-image-2 terms for game assets.
- [ ] A standard freelance art contract (work-for-hire, AI-assisted OK).

**Level 2 (spend and secrets: only Hunter)**
- [ ] Add `ART_KEY` to Actions secrets so the roughs run.
- [ ] Activate the AI Pro $10/month Cloud credit and create a Gemini API key; add it as a secret.
- [x] Monthly ceiling for headless finals: $10, the credit. (Hunter, Oct 31, 2026)
- [ ] Deploy the updated `/art/api/rough` endpoint (FLUX.2 klein with references).
- [ ] Budget per game for hero paint-overs (suggest $150 to $600).

**Level 3 (per game, when it's heading to a store)**
- [ ] Column A, B, C or a mix ([6.2](#62-a-typical-2d-indie-game)) for this game.
- [ ] Custom style model (Scenario) yes or no.
- [ ] Hire a freelance art lead yes or no; retainer size.
- [ ] Animation route: code tweens, Spine, PixelLab, or commissioned.

---

## 11. Sources

Read Oct 31, 2026. **Checked** = the vendor's own page.

**Prices**
- Gemini API pricing (**checked**): https://ai.google.dev/gemini-api/docs/pricing
- Cloudflare Workers AI pricing (**checked**): https://developers.cloudflare.com/workers-ai/platform/pricing/
- FLUX.2 klein 9B on Workers AI: https://developers.cloudflare.com/workers-ai/models/flux-2-klein-9b/ and changelog https://developers.cloudflare.com/changelog/2026-01-28-flux-2-klein-9b-workers-ai/
- FLUX.2 klein 4B changelog: https://developers.cloudflare.com/changelog/2026-01-15-flux-2-klein-4b-workers-ai
- Google AI Pro developer benefits: https://blog.google/innovation-and-ai/technology/developers-tools/gdp-premium-ai-pro-ultra/ and https://developers.google.com/program/plans-and-pricing
- Nano Banana pricing summary: https://benchlm.ai/media-pricing/nano-banana
- Veo 3.1 (unverified): https://benchlm.ai/media-pricing/veo
- gpt-image-2 (unverified): https://aireiter.com/blog/gpt-image-2-api-pricing , https://blog.laozhang.ai/en/posts/gpt-image-2-api-pricing.md
- Scenario: https://help.scenario.com/pricing-plans , https://www.scenario.com/pricing , https://scenario.com/api-pricing
- PixelLab (unverified): https://knowara.com/ai-tools/image/pixellab-review/ , https://www.cutout.pro/learn/pixellab/
- 3D tools (unverified): https://sloyd.ai/blog/3d-ai-price-comparison , https://www.3daistudio.com/blog/best-3d-model-generation-apis-2026
- Spine: https://esotericsoftware.com/spine-purchase
- Freelance rates (unverified): https://rocketbrush.com/blog/2d-character-art-prices-and-tips-to-cut-costs , https://geekvibesnation.com/economics-of-indie-game-development-just-shifted-and-it-starts-with-sprite-generation/ , itch.io for-hire threads such as https://itch.io/t/4455928/for-hire-pixelart-and-animator-looking-for-paid-projectworkcommission

**Licensing**
- Steamworks Content Survey (**checked**): https://partner.steamgames.com/doc/gettingstarted/contentsurvey
- Steam's Jan 2026 rewrite: https://gamedeveloper.com/business/valve-tweaks-and-clarifies-ai-disclosure-rules-for-steam , https://videogameschronicle.com/news/valve-has-significantly-rewritten-steams-rules-for-how-developers-much-disclose-ai-use
- Canva AI Product Terms (403 when fetched): https://canva.com/policies/ai-product-terms ; Canva help: https://www.canva.com/help/using-magic-studio-safely-and-legally/ ; readings: https://terms.law/ai-output-rights/canva/ , https://subscribed.fyi/blog/selling-canva-ai-generated-images-is-it-possible/
- Gemini outputs and SynthID: https://terms.law/ai-output-rights/gemini/ , https://licenseorg.com/guide/ai-content/google-gemini-image
- OpenAI outputs: https://terms.law/ai-output-rights/chatgpt/
- FLUX.2 licenses: https://venturebeat.com/technology/black-forest-labs-launches-open-source-flux-2-klein-to-generate-ai-images-in , https://vercel.com/ai-gateway/models/flux-2-klein-4b.md , BFL terms https://bfl.ai/legal/terms-of-service
- US Copyright Office, AI report Part 2: https://blogs.loc.gov/copyright/2025/02/inside-the-copyright-offices-report-copyright-and-artificial-intelligence-part-2-copyrightability/ , https://www.copyright.gov/ai/
- Mixamo FAQ: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html ; status: https://app.cinevva.com/guides/free-character-animations-rigging

**Animation tools (vendor write-ups, unverified)**
- https://sorceress.games/blog/ai-sprite-generator-pixel-walk-cycles-idles-and-vfx , https://www.summerengine.com/ai-sprite-sheet-generator
