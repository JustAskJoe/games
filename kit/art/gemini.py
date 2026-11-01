#!/usr/bin/env python3
"""Make a game's shot list with Gemini image models (Nano Banana), passing our anchor images as references.

    python3 kit/art/gemini.py card-trader/art/v2-gemini-jobs.json --dry-run      # check everything, no key, no calls
    python3 kit/art/gemini.py card-trader/art/v2-gemini-jobs.json                # make every job whose output is missing
    python3 kit/art/gemini.py JOBS.json --only full-hive,full-star --force       # remake two
    python3 kit/art/gemini.py JOBS.json --model gemini-3-pro-image               # Nano Banana Pro for hero art

Needs GEMINI_API_KEY in the environment (never in the repo: it's public). Standard library only; Pillow is optional and
used for the finishing pass (crop, resize, WebP/JPEG). Without Pillow the raw image is saved and finishing is skipped.

Job file (JSON):
  {
    "model": "gemini-3.1-flash-image",
    "anchors": {"keyart": "card-trader/builds/img/keyart.jpg", ...},          # name -> local reference image
    "jobs": [{
      "key": "full-hive", "prompt": "...", "aspect": "4:3", "size": "1K",
      "refs": ["keyart", "hive"],                                             # anchor names, sent in this order
      "raw": "card-trader/art/gemini/full-hive.jpg",                          # untouched model output (kept locally, git-ignored)
      "post": {"to": "card-trader/builds/img/full-hive.jpg", "width": 1100, "crop": [0, 0, 1, 1], "quality": 82}
    }]
  }

Every call appends a line to <job file folder>/gemini-log.jsonl: key, model, prompt, refs, time, output, bytes.
That log is what design/ai-assets.md rows come from (R18, R23). Prices: Nano Banana 2 about $0.067 per 1K image,
$0.101 per 2K (Google's pricing page, Nov 2026). The script prints an estimate before it spends anything.
© 2026 justaskjoe. All rights reserved.
"""
import argparse, base64, json, os, pathlib, sys, time, urllib.error, urllib.request

API = 'https://generativelanguage.googleapis.com/v1beta'
PRICE = {'512px': 0.045, '1K': 0.067, '2K': 0.101, '4K': 0.151}       # Nano Banana 2, standard tier
PRICE_PRO = {'1K': 0.134, '2K': 0.134, '4K': 0.24}                     # Nano Banana Pro
MIME = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}


def b64(path):
    return base64.b64encode(pathlib.Path(path).read_bytes()).decode()


def post(url, body, key, tries=5):
    """POST JSON with retries on rate limits and server errors. Never prints the key."""
    data = json.dumps(body).encode()
    for attempt in range(tries):
        req = urllib.request.Request(url, data=data, method='POST', headers={'content-type': 'application/json', 'x-goog-api-key': key})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')[:400]
            if e.code in (429, 500, 502, 503, 504) and attempt < tries - 1:
                wait = 2 ** attempt * 5
                print(f'   {e.code}, retrying in {wait}s: {msg[:120]}')
                time.sleep(wait)
                continue
            raise SystemExit(f'   API error {e.code}: {msg}')
    raise SystemExit('   gave up after retries')


def find_image(resp):
    """Pull the first image out of either API's response shape."""
    out = resp.get('output_image') or {}
    if out.get('data'):
        return out['data'], out.get('mime_type', 'image/png')
    for step in resp.get('steps', []) or []:
        for block in step.get('content', []) or []:
            if block.get('type') == 'image' and block.get('data'):
                return block['data'], block.get('mime_type', 'image/png')
    for cand in resp.get('candidates', []) or []:                      # generateContent shape
        for part in (cand.get('content') or {}).get('parts', []) or []:
            inline = part.get('inlineData') or part.get('inline_data')
            if inline and inline.get('data'):
                return inline['data'], inline.get('mimeType') or inline.get('mime_type', 'image/png')
    return None, None


def generate(job, refs, model, api, key):
    if api == 'interactions':
        blocks = [{'type': 'text', 'text': job['prompt']}] + [{'type': 'image', 'mime_type': m, 'data': d} for m, d in refs]
        body = {'model': model, 'input': blocks,
                'response_format': {'type': 'image', 'mime_type': 'image/jpeg', 'aspect_ratio': job.get('aspect', '1:1'), 'image_size': job.get('size', '1K')}}
        resp = post(f'{API}/interactions', body, key)
    else:
        parts = [{'text': job['prompt']}] + [{'inline_data': {'mime_type': m, 'data': d}} for m, d in refs]
        body = {'contents': [{'parts': parts}],
                'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': job.get('aspect', '1:1'), 'imageSize': job.get('size', '1K')}}}
        resp = post(f'{API}/models/{model}:generateContent', body, key)
    data, mime = find_image(resp)
    if not data:
        reason = json.dumps(resp)[:400]
        raise SystemExit(f'   no image in the response (blocked or text-only?): {reason}')
    return base64.b64decode(data), mime


def finish(raw_path, spec):
    """Crop (fractions of width/height), resize to a width, save as JPEG or WebP. Needs Pillow."""
    try:
        from PIL import Image
    except ImportError:
        print('   (Pillow not installed: raw image kept, finishing skipped; pip install pillow)')
        return None
    im = Image.open(raw_path)
    x0, y0, x1, y1 = spec.get('crop', [0, 0, 1, 1])
    w, h = im.size
    im = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
    if spec.get('width') and im.width != spec['width']:
        im = im.resize((spec['width'], round(im.height * spec['width'] / im.width)), Image.LANCZOS)
    to = pathlib.Path(spec['to']); to.parent.mkdir(parents=True, exist_ok=True)
    if to.suffix == '.webp':
        im.save(to, 'WEBP', quality=spec.get('quality', 85))
    else:
        im.convert('RGB').save(to, 'JPEG', quality=spec.get('quality', 82))
    return to


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('jobs'); ap.add_argument('--only', default=''); ap.add_argument('--force', action='store_true')
    ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--model', default='')
    ap.add_argument('--api', choices=['interactions', 'generateContent'], default='interactions')
    a = ap.parse_args()
    spec = json.loads(pathlib.Path(a.jobs).read_text(encoding='utf-8'))
    model = a.model or spec.get('model', 'gemini-3.1-flash-image')
    only = {k.strip() for k in a.only.split(',') if k.strip()}
    anchors = spec.get('anchors', {})
    todo, problems = [], []
    for job in spec['jobs']:
        if only and job['key'] not in only:
            continue
        for r in job.get('refs', []):
            if r not in anchors: problems.append(f'{job["key"]}: unknown anchor "{r}"')
            elif not pathlib.Path(anchors[r]).exists(): problems.append(f'{job["key"]}: anchor file missing: {anchors[r]}')
        if not a.force and pathlib.Path(job['raw']).exists():
            print(f'skip {job["key"]}: {job["raw"]} exists (use --force to remake)')
            continue
        todo.append(job)
    if problems:
        raise SystemExit('Fix these first:\n  ' + '\n  '.join(problems))
    table = PRICE_PRO if 'pro' in model else PRICE
    cost = sum(table.get(j.get('size', '1K'), 0.1) for j in todo)
    print(f'{len(todo)} image(s) with {model} via {a.api}: about ${cost:.2f} at standard prices (estimate)')
    for j in todo:
        print(f' - {j["key"]}: {j.get("aspect", "1:1")} {j.get("size", "1K")}, refs {j.get("refs", [])} -> {j["raw"]}' + (f' -> {j["post"]["to"]}' if j.get('post') else ''))
    if a.dry_run or not todo:
        print('dry run: nothing sent' if a.dry_run else 'nothing to do')
        return
    key = os.environ.get('GEMINI_API_KEY', '').strip()
    if not key:
        raise SystemExit('GEMINI_API_KEY is not set. Set it in your environment (never commit it), then run again.')
    log = pathlib.Path(a.jobs).parent / 'gemini-log.jsonl'
    for j in todo:
        refs = [(MIME.get(pathlib.Path(anchors[r]).suffix.lower(), 'image/png'), b64(anchors[r])) for r in j.get('refs', [])]
        print(f'-> {j["key"]} ...', flush=True)
        img, mime = generate(j, refs, model, a.api, key)
        raw = pathlib.Path(j['raw']); raw.parent.mkdir(parents=True, exist_ok=True)
        raw.write_bytes(img)
        done = finish(raw, j['post']) if j.get('post') else None
        print(f'   saved {raw} ({len(img) // 1024} KB, {mime})' + (f', finished {done}' if done else ''))
        with log.open('a', encoding='utf-8') as f:
            f.write(json.dumps({'key': j['key'], 'model': model, 'api': a.api, 'at': time.strftime('%Y-%m-%dT%H:%M:%S'), 'prompt': j['prompt'],
                                'refs': j.get('refs', []), 'raw': j['raw'], 'to': j.get('post', {}).get('to'), 'bytes': len(img)}) + '\n')
    print('done. Review every image (rules R1, R12, R17) before it ships, and add rows to design/ai-assets.md from', log)


if __name__ == '__main__':
    main()
