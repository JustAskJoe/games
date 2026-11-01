"""Unpack a batch of images that the browser pane returned as one JSON object {key: base64}.

Pairs with fetch-canva-batch.js: that script fetches full-size Canva images, shrinks them in the browser
(JPEG for scenes, WebP with alpha for sprites) and returns JSON.stringify(window.__out). A result that big is saved
by the tool as a file like tool-results/...javascript_tool-<ts>.txt holding [{"type":"text","text":"{...}"}].

Usage (run with python3 -I): python3 -I unpack_images.py RESULT_FILE OUT_DIR
Writes OUT_DIR/<key>.jpg or <key>.webp (picked from the file's own bytes) and prints sizes.
© 2026 justaskjoe. All rights reserved.
"""
import base64, json, os, sys

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
text = json.load(open(src, encoding='utf-8'))[0]['text']
text = text[:text.rindex('"') + 1] if text.lstrip().startswith('"') else text[text.index('{'):text.rindex('}') + 1]
obj = json.loads(text)
if isinstance(obj, str):  # the tool returns the JSON string itself as a quoted string
    obj = json.loads(obj)
for key, b64 in obj.items():
    data = base64.b64decode(b64)
    ext = '.webp' if data[8:12] == b'WEBP' else '.png' if data[:4] == b'\x89PNG' else '.jpg'
    path = os.path.join(out, key + ext)
    open(path, 'wb').write(data)
    print(f'{key + ext:24} {len(data) // 1024:5d} KB')
