# Wormsbound background pictures, step 1 of 2: GENERATE them with an open image model on your own graphics card.
# © 2026 justaskjoe. All rights reserved.
#
# Backgrounds are the only Wormsbound art an image model makes. Nothing in the game collides with them, so a picture
# can't break the rules. Everything else (ground, creatures, effects) is drawn in code.
#
# Model: Stable Diffusion XL base 1.0 (stabilityai/stable-diffusion-xl-base-1.0), licence CreativeML Open RAIL++-M,
#   which allows commercial use of what it makes. VAE: madebyollin/sdxl-vae-fp16-fix (MIT). Both are free downloads
#   from Hugging Face (about 7 GB the first time) and run locally: no account, no credits, nothing is uploaded.
# Needs: an NVIDIA card with 8 GB or more, and  pip install torch diffusers transformers accelerate safetensors
#   On Windows, install into a SHORT folder path (for example C:\Users\you\wbart): PyTorch fails to load from long ones.
#
# Run: python gen_backgrounds.py [theme ...] [--out DIR] [--seed N] [--steps N]
#   Writes DIR/<theme>.png at 1344 x 768. These raw pictures are big and are NOT committed. Then run backgrounds.py,
#   which turns them into the small pixel pictures the game uses.
# House rules (kit/art/art-rules.md): no text in generated pictures; one style lead for the whole game; make the
#   whole set in one sitting with the same prompt skeleton. These are a first pass until a lead art plan is adopted.
import argparse, pathlib

# The model reads two prompts of at most 77 words-ish each: the scene goes in one, the style in the other.
STYLE = "pixel art game background, 16-bit era, limited colour palette, crisp pixels, layered parallax scenery, atmospheric haze, wide distant view"
SCENE_END = "seen from far away, everything small and distant, empty foreground, no characters"
NEG = ("text, letters, numbers, watermark, signature, logo, ui, hud, frame, border, people, characters, animals, blurry, photo, 3d render, "
       "foreground objects, close-up, large trees in front, platform, ground in front")
# one entry per map theme (the ids in prototype/mapgen.js THEMES): the scene with its colours FIRST (the model drifts to
# pink sunsets if you let it), then what to keep out of that picture
THEMES = {
    'hills':  ("rolling grassy hills and far mountain ridges at sunset, a low warm sun, purple dusk sky fading to orange, a few stars", ""),
    'sky':    ("bright blue midday sky filled with soft white clouds, small floating rock islands with waterfalls far away, a sea of clouds below", "sunset, dusk, orange, pink, purple"),
    'scrap':  ("a vast scrapyard of heaped metal, cranes and wrecked machines on the horizon, dusty amber evening sky, rust and brown", ""),
    'roofs':  ("modern city skyline at night, rows of rectangular apartment blocks and office towers with lit yellow windows, water towers and antennas, deep indigo sky", "castle, fantasy, dome, temple, balloon, sunset, spires"),
    'frost':  ("cold blue winter night, jagged snowy mountain peaks, white snowfields, tiny frozen pines far away, a bright full moon, pale blue and white only", "sunset, orange, pink, warm colours"),
    'dunes':  ("desert mesas, sandstone arches and rolling dunes at golden hour, a huge low sun, warm orange and violet sky", ""),
    'fungal': ("cave interior, enclosed underground grotto with rock walls and a rock ceiling, clusters of giant glowing mushrooms, hanging stalactites, deep purple darkness lit by green and pink bioluminescence", "sky, sun, moon, clouds, sunset, outdoors, mountains, horizon, sea, lake, buildings"),
    'cove':   ("a pirate cove with a wrecked sailing ship on the rocks, sea stacks and palm trees, turquoise sea, pale sandy sunrise sky", ""),
    'magma':  ("an erupting volcano at night, glowing orange rivers of lava running down black volcanic rock, jagged basalt spires, smoke plumes, black sky full of orange embers", "city, buildings, skyscrapers, castle, pink, purple, water, lake, sunset"),
    'haunt':  ("a misty graveyard on a far hill at night, crooked leafless dead trees, small leaning gravestones, a ruined chapel, a pale crescent moon, cold dark purple and grey mist", "sunset, sun, orange, pine trees, warm colours"),
}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('themes', nargs='*'); ap.add_argument('--out', default='raw-backgrounds')
    ap.add_argument('--seed', type=int, default=20261116); ap.add_argument('--steps', type=int, default=30); a = ap.parse_args()
    import torch
    from diffusers import StableDiffusionXLPipeline, AutoencoderKL
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    vae = AutoencoderKL.from_pretrained('madebyollin/sdxl-vae-fp16-fix', torch_dtype=torch.float16)
    pipe = StableDiffusionXLPipeline.from_pretrained('stabilityai/stable-diffusion-xl-base-1.0', vae=vae, torch_dtype=torch.float16, variant='fp16', use_safetensors=True)
    pipe.enable_model_cpu_offload(); pipe.vae.enable_tiling()      # fits an 8 GB card
    for th in (a.themes or list(THEMES)):
        g = torch.Generator('cpu').manual_seed(a.seed + list(THEMES).index(th))
        scene, keep_out = THEMES[th]; neg = NEG + (", " + keep_out if keep_out else "")
        im = pipe(prompt=f"{scene}, {SCENE_END}", prompt_2=STYLE, negative_prompt=neg, negative_prompt_2=neg, width=1344, height=768, num_inference_steps=a.steps, guidance_scale=7.0, generator=g).images[0]
        im.save(out / f'{th}.png'); print('wrote', out / f'{th}.png', flush=True)


if __name__ == '__main__':
    main()
