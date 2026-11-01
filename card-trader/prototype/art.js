// Intergalactic Card Trader · card drawing: frames per game, alien scripts, wear marks, UV watermarks, slabs.
// Painted art comes from img/ (Canva, see design/ai-assets.md); everything here is drawn in code to match it.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';
const FRAME = {
  shell: { fr: 'linear-gradient(160deg, #FFC2E2, #FF8FC7 45%, #19C8D8)', fr2: '#0E5C66', ic: '◎' },
  hive:  { fr: 'repeating-linear-gradient(60deg, #A6F01E 0 10px, #8BD010 10px 20px)', fr2: '#1A1A1A', ic: '⬢' },
  star:  { fr: 'linear-gradient(160deg, #FFD21F, #8B5CF6 50%, #3B1A8F)', fr2: '#1B0E4A', ic: '✦' },
};
const GEM = { c: ['#fff', 'C'], u: ['#19D3F0', 'U'], r: ['#FFD21F', 'R'], h: ['#FF2E93', 'H'], g: ['#000', '★'] };

// Deterministic per-string hash (for glyphs and art crops).
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// Alien scripts: each letter becomes a glyph in the game's style (spirals, dot grids, waves).
function glyph(style, code, x) {
  const k = code % 7;
  if (style === 'spiral') { const r = 3 + (k % 3); return `<path d="M${x + 6} 10 m-${r} 0 a${r} ${r} 0 1 1 ${r * 2} 0 a${r - 1} ${r - 1} 0 1 1 -${(r - 1) * 2} 0" fill="none" stroke="#120A1F" stroke-width="1.8"/>` + (k > 3 ? `<circle cx="${x + 6}" cy="${k % 2 ? 3 : 17}" r="1.3" fill="#120A1F"/>` : ''); }
  if (style === 'dots') { let s = ''; for (let b = 0; b < 6; b++) if ((code >> b) & 1) s += `<rect x="${x + 2 + (b % 2) * 5}" y="${3 + Math.floor(b / 2) * 5}" width="3.5" height="3.5" fill="#120A1F"/>`; return s + `<line x1="${x + 1}" y1="18" x2="${x + 11}" y2="18" stroke="#120A1F" stroke-width="1.4"/>`; }
  const a = 2 + k; return `<path d="M${x} 10 q3 -${a} 6 0 t6 0" fill="none" stroke="#120A1F" stroke-width="1.8"/>` + (k % 2 ? `<path d="M${x + 2} ${k > 3 ? 4 : 16} l4 0" stroke="#120A1F" stroke-width="1.6"/>` : '');
}
function scriptSVG(style, text) {
  const chars = text.replace(/[^A-Za-z]/g, '').slice(0, 12); let s = '', x = 0;
  for (const ch of chars) { s += glyph(style, ch.charCodeAt(0) * 7 + 3, x); x += 13; }
  return `<svg viewBox="0 0 ${Math.max(x, 13)} 20" preserveAspectRatio="xMidYMid meet" aria-label="unreadable alien script">${s}</svg>`;
}
// UV watermark: every real card carries its game's mark. Fakes carry none ('uv') or the wrong game's mark ('stock' fakes fail the Loupe instead).
function watermark(game) {
  const p = { shell: '<path d="M50 50 m-30 0 a30 30 0 1 1 60 0 a22 22 0 1 1 -44 0 a14 14 0 1 1 28 0" fill="none" stroke="#B9FF4A" stroke-width="7"/>',
              hive: '<path d="M50 12 L83 31 L83 69 L50 88 L17 69 L17 31 Z" fill="none" stroke="#B9FF4A" stroke-width="7"/><circle cx="50" cy="50" r="10" fill="#B9FF4A"/>',
              star: '<path d="M50 8 L61 39 L94 39 L67 58 L77 90 L50 70 L23 90 L33 58 L6 39 L39 39 Z" fill="none" stroke="#B9FF4A" stroke-width="7"/>' }[game];
  return `<svg class="wm" viewBox="0 0 100 100">${p}</svg>`;
}
// Wear you can see if you look closely, and see clearly under the Loupe.
function wearSVG(c, strong) {
  const op = strong ? 1 : 0.55; let s = '';
  const sc = 10 - c.sur; const h = hash(c.uid);
  for (let i = 0; i < sc; i++) { const x = 10 + ((h >> (i * 3)) % 80), y = 8 + ((h >> (i * 2 + 1)) % 84), l = 6 + (i * 5) % 14; s += `<line x1="${x}" y1="${y}" x2="${x + l}" y2="${y + l * 0.4}" stroke="#fff" stroke-width="${strong ? 1.1 : 0.8}" opacity="${op * 0.8}"/>`; }
  const ew = 10 - c.edg;
  if (ew > 0) for (const [cx, cy] of [[0, 0], [100, 0], [0, 140], [100, 140]]) s += `<circle cx="${cx}" cy="${cy}" r="${ew * 1.6}" fill="#fff" opacity="${op * 0.85}"/>`;
  if (c.fake === 'stock' && strong) s += `<rect x="0" y="0" width="100" height="140" fill="url(#none)" stroke="#FF3B3B" stroke-width="3" stroke-dasharray="4 3"/>`;
  return `<svg class="wear" viewBox="0 0 100 140" preserveAspectRatio="none">${s}</svg>`;
}

// One card. opts: size ('xs'|'sm'|''|'lg'), readable, uv, loupe, badge
function cardHTML(c, o) {
  o = o || {};
  const tm = CT.tmpl(c.t), F = FRAME[tm.game], h = hash(c.t), q = tm.idx % 4;
  const off = (10 - c.cen) * 1.3 * ((h & 1) ? 1 : -1);
  const vars = `--fr:${F.fr};--fr2:${F.fr2};--l:${7 + off}%;--r:${7 - off}%;`;
  const art = `background-image:url(img/cards-${tm.game}.jpg);background-position:${q % 2 ? 100 : 0}% ${q > 1 ? 100 : 0}%;filter:hue-rotate(${Math.floor(tm.idx / 4) * 38}deg)${tm.rarity === 'g' ? ' saturate(1.5) contrast(1.15)' : ''};`;
  const name = o.readable ? `<span>${tm.name}</span>` : scriptSVG(CT.GAMES[tm.game].script, tm.name);
  const gem = o.readable ? GEM[tm.rarity] : ['#ddd', '?'];
  const shiny = tm.rarity === 'h' || tm.rarity === 'g' || (c.fake && tm.rarity !== 'c');
  const wm = c.fake === 'uv' ? '' : watermark(c.fake === 'stock' ? (tm.game === 'shell' ? 'hive' : 'shell') : tm.game);
  const badge = o.badge ? `<div class="badge ${o.badge === 'FAKE' ? 'fake' : ''}">${o.badge}</div>` : '';
  const inner = `<div class="inner"><div class="art" data-g="${tm.game}" style="${art}"><div class="glyph-art" aria-hidden="true">${F.ic}</div></div>
    <div class="name">${name}</div><div class="gem" style="background:${gem[0]};color:${gem[0] === '#000' ? '#FFD21F' : '#120A1F'}">${gem[1]}</div>
    <div class="gameic">${F.ic}</div></div>${shiny ? '<div class="holo"></div>' : ''}${wearSVG(c, o.loupe)}${wm}${badge}`;
  const cls = `card ${o.size || ''} ${o.uv ? 'uv' : ''} ${o.cls || ''}`;
  const card = `<div class="${cls}" style="${vars}" data-uid="${c.uid}" ${o.act ? `data-act="${o.act}"` : ''} role="button" tabindex="0" aria-label="${o.readable ? tm.name : 'unread card'}">${inner}</div>`;
  if (c.graded) { const co = c.graded.co; return `<div class="slab ${co}" data-uid="${c.uid}" ${o.act ? `data-act="${o.act}"` : ''}><div class="lbl"><span>${CT.GRADERS[co].name.split(' ')[0].toUpperCase()}</span><span>${c.graded.grade}</span></div>${card}</div>`; }
  return card;
}
// Fallback painted look when an img/ file is missing: a halftone gradient in the game's colors.
function artFallbackCSS() {
  return `.card .art{background-image:none}` + Object.keys(FRAME).map(g => `.card[style*="${FRAME[g].fr2}"] .art{background-color:${FRAME[g].fr2}}`).join('');
}
root.ART = { cardHTML, scriptSVG, watermark, hash, FRAME, artFallbackCSS };
})(this);
