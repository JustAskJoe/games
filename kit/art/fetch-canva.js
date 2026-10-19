// Run in the built-in browser pane on a logged-in canva.com tab (Claude_Browser__javascript_tool).
// Edit `ids` (key -> Canva media id). Stores base64 JPEGs on window.__img; returns sizes.
// Then return each image in its own call: `window.__img.hand` (big results save to a file automatically).
const ids = { hand: 'MAHYMHx42ek', dusk: 'MAHYMBHel9c' };
window.__img = window.__img || {};
const out = {};
for (const [k, id] of Object.entries(ids)) {
  const t = await (await fetch(`/_ajax/media/${id}/1?includeImportFileUrl`, { credentials: 'include' })).text();
  const j = JSON.parse(t.replace(/^[^{]*/, ''));           // strip Canva's anti-JSON prefix
  const u = j.bundle && j.bundle.importFileUrl;
  if (!u) { out[k] = 'no importFileUrl'; continue; }
  const b = await (await fetch(u)).blob();
  const buf = new Uint8Array(await b.arrayBuffer()); let s = '';
  for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode(...buf.subarray(i, i + 32768));
  window.__img[k] = btoa(s); out[k] = [b.type, b.size];
}
out
