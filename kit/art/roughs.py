#!/usr/bin/env python3
"""Make the Artist agent's painted roughs for free with Cloudflare Workers AI.

© 2026 F Lane d/b/a One Fifty Labs · All rights reserved

The Artist (kit/agents/artist.md) writes a request file next to its concept sheets:

    <game>/art/concepts/<issue>-roughs.json
    {
      "style": "<the Canva/rough style lead from art-direction.md>",
      "items": [
        {"file": "9-A-rough-1.jpg", "subject": "an arrow tower ...", "seed": 1},
        ...
      ]
    }

For every item whose image doesn't exist yet, this script asks the site's
/art/api/rough endpoint (Flux Schnell on Workers AI) for a picture and saves it
next to the request. The art-roughs workflow runs it and commits the results.

Env: ART_KEY (required, the Actions secret), ART_API (optional endpoint URL).
Runs with the standard library only.
"""
import base64
import glob
import json
import os
import sys
import urllib.error
import urllib.request

API = os.environ.get("ART_API", "https://onefiftylabs.co/art/api/rough")
KEY = os.environ.get("ART_KEY", "").strip()
MAX_PER_RUN = 12  # keeps one run small and well inside the free daily allowance


def make(prompt, seed):
    body = {"prompt": prompt, "steps": 4}
    if isinstance(seed, int) and seed >= 0:
        body["seed"] = seed
    req = urllib.request.Request(
        API,
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json", "x-art-key": KEY, "user-agent": "onefiftylabs-art-roughs"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        out = json.loads(r.read())
    return base64.b64decode(out["image"])


def main():
    if not KEY:
        print("ART_KEY isn't set (add it under Settings > Secrets and variables > Actions). Nothing made.")
        return 1
    requests = sorted(glob.glob("*/art/concepts/*-roughs.json"))
    if not requests:
        print("No rough requests found.")
        return 0
    made, failed, budget = 0, 0, MAX_PER_RUN
    for path in requests:
        folder = os.path.dirname(path)
        try:
            spec = json.load(open(path))
        except (OSError, ValueError) as e:
            print(f"Skipping {path}: can't read it ({e}).")
            failed += 1
            continue
        style = str(spec.get("style", "")).strip()
        for item in spec.get("items", []):
            name = os.path.basename(str(item.get("file", "")))
            subject = str(item.get("subject", "")).strip()
            if not name.lower().endswith(".jpg") or not subject:
                print(f"Skipping an item in {path}: it needs a .jpg file name and a subject.")
                failed += 1
                continue
            out = os.path.join(folder, name)
            if os.path.exists(out):
                continue
            if budget == 0:
                print("Hit the per-run limit; the rest will be made on the next push.")
                break
            budget -= 1
            prompt = f"{style} Subject: {subject}".strip()
            try:
                data = make(prompt, item.get("seed"))
                with open(out, "wb") as f:
                    f.write(data)
                made += 1
                print(f"Made {out} ({len(data) // 1024} KB)")
            except (urllib.error.URLError, KeyError, ValueError) as e:
                detail = e.read().decode()[:200] if isinstance(e, urllib.error.HTTPError) else str(e)
                print(f"Couldn't make {out}: {detail}")
                failed += 1
    print(f"Done: {made} made, {failed} failed.")
    return 1 if failed and not made else 0


if __name__ == "__main__":
    sys.exit(main())
