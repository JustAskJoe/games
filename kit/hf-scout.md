# Hugging Face scout: what's worth using, and what isn't

© 2026 justaskjoe. All rights reserved.

**Status:** first sweep, Nov 9, 2026 (Hunter with Claude). Nothing here is adopted yet: each "Try" line is a proposal, and anything that ships in a sold game needs the legal reviewer's 🟢 first. Re-run the sweep about every two months, or when a post like the TailorRig one shows up ([how](#how-to-run-the-next-sweep)).

Hugging Face (HF) is the big public shelf of open AI models, datasets, free demo pages ("Spaces") and courses. This page covers every discipline the studio has (art, 3D, audio, in-game AI, playtesting, localization, tooling, learning), not just art.

## The short answer
- **The license is the whole game.** About half of what looks great on HF can't go in a sold game: research-only, non-commercial (CC-BY-NC), revenue caps, or Tencent's licenses that **don't apply in the EU, UK or South Korea** (a Steam game sells there). Only MIT and Apache-2.0 picks are marked ✅ below.
- **TailorRig, the post that started this, is research-only.** Great idea, and the dataset is the best of its kind, but we can't rig game characters with it. Use Make-It-Animatable or UniRig instead (both free and commercial-OK).
- **The biggest wins for us aren't art:** tiny models that run *inside the phone browser* (voices, voice input, search, chat filters), free hosting for demos, and HF's own skills plugin for Claude Code.
- **Where HF loses to what we have:** procedural generation, game code and shaders (Claude plus seeded code wins), and balance bots for card, match-3 and idle games (our seeded sims win).

## The license gate (do this before using any HF model)
1. Open the model page and read the **license file** (`LICENSE`, `License.txt`, or the card's license section). The tag alone isn't enough, especially when it says `other`.
2. Sort it:
   - ✅ **MIT, Apache-2.0, BSD:** fine in a sold game. Keep the license file with credits.
   - 🟡 **Revenue or user caps** (Stability Community: under $1M a year; LFM Open: under $10M; Llama: 700M monthly users plus "Built with Llama"): fine for us today, note the cap.
   - 🟡 **"Flow-down" licenses** (OpenRAIL, Gemma 3 Terms): commercial OK, but the use rules must pass on to players (a line in our terms). Ask the legal reviewer.
   - 🔴 **Non-commercial, research or academic only** (CC-BY-NC, "research license", TailorRig): prototypes and decks only if the license allows *any* use outside research. Most don't: then don't touch it.
   - 🔴 **Territory exclusions** (Tencent Hunyuan Community: not EU, UK, South Korea): skip for anything that could reach Steam.
3. Check **what the model was trained on** if the card says. A permissive license on a model trained on scraped art doesn't settle copyright.
4. Log it: any AI-made asset goes in the game's `design/ai-assets.md` with the model id, for Steam's AI disclosure.

## TailorRig (Tencent, Nov 2026)
- **What it is:** a method and a dataset for rigging 3D humanoid characters **with clothes**. You pick a body skeleton (for compatibility with animation libraries) and tick labels like skirt, cape, hair, sleeve, collar or accessory; it grows the extra bone chains for those and paints the skin weights so cloth doesn't drag the body around. Paper: [arXiv 2611.02902](https://arxiv.org/abs/2611.02902), "TailorRig: Controllable and Structured Auxiliary Skeleton Generation for Garment-Aware Rigging". Dataset: [`tencent/TailorRig`](https://huggingface.co/datasets/tencent/TailorRig), 39,073 rigged characters (about 34 GB of `.npz` files, 22 to 94 joints each).
- **Why it matters for us:** capes, skirts and long hair are exactly where Mixamo and the open auto-riggers fail. It's the right idea for a 3D Gate Runner hero or a cel-shaded cast in long coats.
- **Why we can't use it:** the TailorRig License says academic purposes only and bans "commercial or production" use outright; it also bundles Meta's OPT-350m under a non-commercial research license that covers its outputs. Model weights weren't public on Nov 9 (the GitHub link 404'd).
- **What to do instead:** Make-It-Animatable or UniRig for the body rig; place cloth bones by hand in Blender (Claude can script chains) or use cloth physics in the engine.
- **Watch for:** a commercial license, a version inside a paid tool (Tencent's Hunyuan3D studio is the likely home), or an open model trained on similar data. Recheck at the next sweep.

## The shortlist by discipline

"Space" means a free demo page you use in the browser, nothing installed (GPU Spaces have daily limits). Sizes are downloads. Dates are the model's last update on HF.

### Art: 2D
| Pick | What we'd do with it | License | Space | Notes |
| --- | --- | --- | --- | --- |
| `ZhengPeng7/BiRefNet` | Clean transparent cut-outs of characters and items | MIT ✅ | Yes | CPU is fine. Better license than RMBG-2.0 (non-commercial) |
| `joelseytre/toonout` | BiRefNet tuned for cartoon art; suits Card Trader's cel look | MIT ✅ | No (ONNX build exists) | 2025-09 |
| `Qwen/Qwen-Image-Layered` | Split one character into separate layers: the start of a 2D cut-out rig (Tech Artist) | Apache-2.0 ✅ | Yes | Big GPU locally |
| `facebook/sam2.1-hiera-large` | Click to mask a limb or part | Apache-2.0 ✅ | Yes | Use 2.1; SAM 3 has trade-control terms |
| `Qwen/Qwen-Image-Edit-2511` | Same character in new poses and outfits from reference images: our #1 art problem is drift | Apache-2.0 ✅ | Yes | Compare against Nano Banana in a bake-off before switching |
| `fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA` | Turnarounds of one character, also good input for image-to-3D | Apache-2.0 ✅ | Yes | |

### Art: 3D and motion
| Pick | What we'd do with it | License | Space | Notes |
| --- | --- | --- | --- | --- |
| `microsoft/TRELLIS.2-4B` | One image to a textured GLB prop | MIT ✅ | Yes | 24 GB GPU locally; the Space is the way for us |
| `TencentARC/Pixal3D` | Image to mesh that matches the picture closely | MIT ✅ (despite Tencent) | Yes | 2026-08 |
| `jasongzy/Make-It-Animatable` | Rig a humanoid to a Mixamo skeleton in seconds, then use Mixamo's animations | Apache-2.0 ✅ | Yes | Best first rigging try |
| `VAST-AI/UniRig` | Rig anything, including non-humanoids (a beetle-folk with four arms) | MIT ✅ | Yes (community) | |
| `Seed3D/Puppeteer` | Rig plus simple animation | Apache-2.0 ✅ | Unverified | |
| `nvidia/MotionBricks` | Generate human motion clips | NVIDIA Open Model ✅ for weights; the sample motions are evaluation-only | Yes (community) | Retargeting to Mixamo not checked |

### Audio
| Pick | What we'd do with it | License | Space | Notes |
| --- | --- | --- | --- | --- |
| `ACE-Step/Ace-Step1.5` | Placeholder (and maybe shippable) songs at a game's BPM; the card says it was trained on licensed data | MIT ✅ | Yes | Under 4 GB GPU |
| `OpenMOSS-Team/MOSS-SoundEffect-v2.0` | SFX from a text line ("cork pops off a glass vial") | Apache-2.0 ✅ | Yes | |
| `stabilityai/stable-audio-3-small-sfx` | SFX | 🟡 free under $1M revenue a year | Yes | Gated |
| `MiniMaxAI/MiniMax-Music3` | High-quality music | 🟡 must credit "MiniMax-Music3" in the game and label outputs as AI | Yes | |

Keep the house rule: never licensed music. These replace the WebAudio placeholder synths only after a listen test.

### In the game: models that run in the phone browser
All run with [transformers.js](https://huggingface.co/docs/transformers.js) in plain JS, no server. Load once, cache, and always keep a no-AI fallback for weak phones. Together the first four are about 300 to 400 MB, so only load them when a feature needs them.

| Pick | What we'd do with it | License | Size | Notes |
| --- | --- | --- | --- | --- |
| `onnx-community/Kokoro-82M-v1.0-ONNX` (Kokoro.js) | Moonwort's villager reads their trouble aloud; a tower-defense announcer; placeholder VO | Apache-2.0 ✅ | about 90 MB | CPU OK |
| `onnx-community/moonshine-tiny-ONNX` | Voice commands ("brew calming tea"), English | MIT ✅ | about 30 to 50 MB (unverified) | |
| `onnx-community/whisper-base` | Multilingual voice input, auto captions | MIT ✅ | about 77 MB | Server option: Workers AI `@cf/openai/whisper-large-v3-turbo` returns captions (WebVTT) |
| `Xenova/bge-small-en-v1.5` | Search Moonwort's grimoire by meaning ("something for sleep"); match card-shop requests | MIT ✅ | about 34 MB | Same model on Workers AI (`@cf/baai/bge-small-en-v1.5`), so the server and phone agree |
| `onnx-community/content-safety-guard-small-ONNX` | Filter what players type (names, chat to NPCs) | Apache-2.0 ✅ | about 270 MB (looks large, unverified) | Self-reported accuracy, test it |
| `onnx-community/Qwen3.5-0.8B-ONNX` | A small LLM NPC: a customer who haggles, a villager who improvises one line | Apache-2.0 ✅ | about 585 MB, WebGPU phones only | Keep NPCs scripted unless an LLM line clearly plays better |
| `onnx-community/LFM3-1.7B-ONNX` | Structured quest or narrator JSON, good tool calling | 🟡 free under $10M revenue | about 1 GB, high-end phones | |
| `onnx-community/gemma-4-E2B-it-ONNX` | Desktop/Steam build only: voice-in NPC | Apache-2.0 ✅ | about 3 GB | Not for phones |

**Server side (Workers AI, which we already have):** `@cf/meta/llama-guard-3-8b` to check player text and NPC replies; `@cf/qwen/qwen3-embedding-0.6b` for embeddings. **Don't build on** `@cf/meta/llama-3.2-1b-instruct` or `@cf/google/embeddinggemma-300m`: Cloudflare lists them for deprecation on Nov 20, 2026.

### Playtesting and balance
| Pick | What we'd do with it | Effort |
| --- | --- | --- |
| [BALROG](https://arxiv.org/abs/2411.13543) and lmgame-Bench papers (game-playing agent benchmarks) | Lessons for the persona playtesters: give the bot the engine's state as JSON, not screenshots; test on fresh seeds so it can't memorize; score progress as a percentage, not just win/lose; when a bot fails, check "could it see the state?" before "could it plan?" | Read, 2 hours |
| Deep RL course, Units 1 to 4 and 8 (PPO) | A reinforcement-learning bot that hunts broken tower builds in Tower Defense or Rogue Shooter, through a small Python-to-Node bridge to the headless engine | About 2 weekends for one person. **Not** for card, match-3 or idle games: the seeded sims already do this better |
| Agents course (tool-calling units) | Turn persona playtesters into agents that call the engine's API instead of reading text | A few evenings |
| An MCP server per engine (idea from the MCP course and the GameSmith Space) | Claude Code can play, sim and inspect a game directly | Medium; one game first (Card Trader) |

Analytics and churn: nothing game-specific on HF. Keep logging our own seeded sessions and let Claude read them.

### Localization
| Pick | Use | License |
| --- | --- | --- |
| Claude, with a glossary and context per string | First pass on the string table | — |
| `google/madlad400-3b-mt` | Back-translate as a cheap check (400+ languages, older) | Apache-2.0 ✅ |
| TranslateGemma 4B/12B (Jan 2026) | Better open check, runs locally | 🟡 Gemma terms (not read) |

Then a native speaker spot-checks before any Steam launch. Skip NLLB, Seamless and TowerInstruct: non-commercial.

### Tools for us (Claude Code and hosting)
| Pick | Use | License |
| --- | --- | --- |
| [`huggingface/skills`](https://github.com/huggingface/skills) plugin for Claude Code | HF's own skills: `transformers-js` (the browser models above), `huggingface-spaces`, `huggingface-gradio`, `hf-cli`. Install: `/plugin marketplace add huggingface/skills` in Claude Code | Apache-2.0 ✅ |
| Static HTML Spaces | Free public hosting for a jam build or a shareable demo, next to the Lab | Free tier |
| HF MCP server (`huggingface.co/mcp`) | Search models, papers and docs from Claude Code | Needs a free HF account |
| `hf` CLI | Download models and datasets, browse papers | Free |

Code models: nothing on HF beats Claude for JS, three.js or shaders. GDScript fine-tunes (Godoter) only matter if a game moves to Godot.

### Courses worth the time
| Course | Who and which parts |
| --- | --- |
| [ML for Games](https://huggingface.co/learn/ml-games-course) | Anyone designing NPCs. Skim it in about 2 hours. Finished course, won't grow |
| [Deep RL](https://huggingface.co/learn/deep-rl-course) | Whoever owns Tower Defense balance: Units 1 to 4 and 8. Skip Unit 7 (broken). Low maintenance |
| [Agents](https://huggingface.co/learn/agents-course) | Whoever owns the Playtester agent |
| MCP course | Whoever builds the engine-as-MCP idea. May be delisted; check it still loads |
| [Cookbook](https://huggingface.co/learn/cookbook) | Recipes as needed |

Spaces to study for ideas (study only, don't link publicly without checking; some search results nearby are NSFW): the Mistral AI Game Jam entries (persuasion and improv as mechanics, ideas for Card Trader haggling), `dylanebert/grass_cutting_game` (a small web game as a static Space).

## Looked at and rejected
| What | Why |
| --- | --- |
| **TailorRig** | Academic research only |
| Hunyuan3D 2.x, HY-Motion, HunyuanVideo-Foley, probably Hunyuan-MT | Tencent licenses exclude the EU, UK and South Korea |
| RMBG-2.0, FLUX.1 Kontext dev, MusicGen, MMAudio, YuE, OmniVoice, NLLB, Seamless, TowerInstruct | Non-commercial |
| Hi3D, Stable Fast 3D | Revenue caps and beaten by TRELLIS.2 |
| SAM 3 | Trade-control terms and gated; SAM 2.1 is enough |
| RigAnything | No license found |
| Mario level and Magic: The Gathering datasets | No license, third-party IP |
| Unity ML-Agents models, level-generation models | Unity-only or unmaintained |
| SmolLM3-3B, Phi-4-mini, Llama 3.2 for the browser | Too big for phones, or a worse license than Qwen3.5 |
| Uncensored fine-tunes | Unsafe for NPC dialogue |

## Where it plugs into the studio
- **Art team** (`kit/art/art-team.md`): the 3D Kitbasher and Animator rows now name the free open options. The Lead Artist adds HF picks to a game's lead plan only after the license gate. `kit/art/pipeline-upgrade.md` §4.2 and §7.1 carry the details.
- **Playtester and Balance agents** (`kit/agents/`): the BALROG lessons above are proposals for their next update.
- **Studio HQ**: no change yet. If the crew wants a "Scout" agent that re-runs this sweep on a schedule, that's a new agent (its file in `kit/agents/`, a row in `ARCHITECTURE.md` §5, a place in Studio HQ via `AGENTS` in `JustAskJoe/forge`).

## Try first (proposed order, all free)
1. Install the `huggingface/skills` plugin in Claude Code (5 minutes).
2. Kokoro voice for Moonwort's villagers, behind a 🔊 toggle with text as the fallback.
3. BiRefNet/ToonOut vs Canva `remove-background` on 10 Card Trader cut-outs.
4. Qwen-Image-Edit-2511 in the next drift bake-off against Nano Banana.
5. A Make-It-Animatable rig on one Gate Runner character (via its Space).
6. The BALROG lessons into `kit/agents/playtester.md` (its own pull request).

## Decisions for Hunter
- [ ] OK the license gate above as a rule in `kit/art/art-rules.md` (and for non-art models too).
- [ ] Which "Try first" items to start, and who.
- [ ] Should a Scout agent re-run this sweep every two months, or is it on demand?

## How to run the next sweep
In Claude Code, from this repo: "Re-run the Hugging Face scout in `kit/hf-scout.md`: check every pick's license and date again, look for new models in each discipline since the date at the top, recheck TailorRig's license, and update this page in a pull request." Use the HF API (`https://huggingface.co/api/models?search=…&sort=trendingScore`) and read each license file.
