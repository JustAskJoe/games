"""Decode base64 images returned by the browser pane's javascript_tool into JPEG files.

When a javascript_tool result is too large, it is saved as a JSON file like
  ~/.claude/projects/<proj>/<session>/tool-results/mcp-remote-devices-Claude_Browser__javascript_tool-<ts>.txt
holding [{"type":"text","text":"...base64..."}].

Usage: python3 decode_tool_results.py OUT_DIR key1=/path/to/result1.txt key2=/path/to/result2.txt
"""
import base64, json, os, re, sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for arg in sys.argv[2:]:
    key, path = arg.split('=', 1)
    text = json.load(open(path))[0]['text']
    b64 = re.search(r'[A-Za-z0-9+/=]{1000,}', text).group(0)
    dst = os.path.join(out, key + '.jpg')
    open(dst, 'wb').write(base64.b64decode(b64))
    try:
        from PIL import Image
        print(key, Image.open(dst).size)
    except Exception:
        print(key, os.path.getsize(dst), 'bytes')
