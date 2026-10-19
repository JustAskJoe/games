// Hexed vector art: pieces, specials, blockers, tarot emblems, Sable the cat. Original placeholder art.
// © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
(function () {
  const PIECE_NAMES = ['Moonstone', 'Candle flame', 'Sage leaf', 'Rose quartz', 'Toadstool', 'Amethyst star'];
  const PIECE_COL = ['#B4D0EE', '#F2B544', '#86C07F', '#EE9DB4', '#E0654D', '#B184E0'];
  const DARKS = ['#5A7EA8', '#B0701B', '#3E7A44', '#B2577A', '#8E2E25', '#6A3E9E'];
  let gid = 0;
  function grad(id, a, b) { return `<radialGradient id="${id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".25" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`; }
  function base(c) {
    const id = 'g' + (++gid); const a = PIECE_COL[c], b = DARKS[c];
    const d = `<defs>${grad(id, a, b)}</defs>`; const f = `url(#${id})`; const st = `stroke="${b}" stroke-width="2.5" stroke-linejoin="round"`;
    switch (c) {
      case 0: return d + `<path d="M60 12a38 38 0 1 0 28 62A31 31 0 1 1 60 12z" fill="${f}" ${st}/><circle cx="34" cy="42" r="3" fill="#fff" opacity=".7"/>`;
      case 1: return d + `<path d="M50 6C66 30 78 44 78 62a28 28 0 0 1-56 0C22 44 34 30 50 6z" fill="${f}" ${st}/><path d="M50 40c8 11 12 17 12 24a12 12 0 0 1-24 0c0-7 4-13 12-24z" fill="#FFF3C9" opacity=".9"/>`;
      case 2: return d + `<path d="M14 86C12 46 44 14 88 12c2 44-30 76-74 74z" fill="${f}" ${st}/><path d="M18 82C40 62 58 44 80 20M44 58l-4-16M58 44l-2-14M44 58l16 2M58 44l14 2" stroke="${b}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      case 3: return d + `<path d="M50 6L82 26V74L50 94L18 74V26Z" fill="${f}" ${st}/><path d="M50 6V40L82 26M50 40L18 26M50 40V94" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none"/>`;
      case 4: return d + `<path d="M8 56C8 28 28 10 50 10s42 18 42 46z" fill="${f}" ${st}/><path d="M36 56h28l4 30a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6z" fill="#F3E6CC" stroke="#A88E66" stroke-width="2.5"/><circle cx="32" cy="34" r="6" fill="#FBEEDC"/><circle cx="58" cy="26" r="5" fill="#FBEEDC"/><circle cx="72" cy="44" r="4.5" fill="#FBEEDC"/>`;
      case 5: return d + `<path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2z" fill="${f}" ${st}/>`;
    }
    return '';
  }
  function lantern() {
    return `<path d="M50 4v10" stroke="#8C6A2E" stroke-width="4"/><path d="M38 14h24l8 12H30z" fill="#6E5524"/><path d="M30 26h40l-4 52H34z" fill="#FFE39A" stroke="#8C6A2E" stroke-width="4"/><path d="M50 36c7 9 10 14 10 20a10 10 0 0 1-20 0c0-6 3-11 10-20z" fill="#F29A2E"/><path d="M28 78h44v10H28z" fill="#6E5524"/><circle cx="50" cy="52" r="34" fill="#FFD36B" opacity=".18"/>`;
  }
  function piece(c, sp) {
    if (c === 9) return `<svg viewBox="0 0 100 100" aria-hidden="true">${lantern()}</svg>`;
    if (sp === 'orb') {
      const id = 'o' + (++gid);
      return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="${id}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#CFE7FF"/><stop offset=".6" stop-color="#C9A6F0"/><stop offset="1" stop-color="#5B3A8C"/></radialGradient></defs><path d="M26 82h48l6 12H20z" fill="#7A5A2C" stroke="#4A3618" stroke-width="2.5"/><circle cx="50" cy="44" r="38" fill="url(#${id})" stroke="#E9DCFF" stroke-width="2.5"/><path d="M28 36a24 24 0 0 1 18-16" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/><circle cx="62" cy="54" r="4" fill="#fff" opacity=".7"/><circle cx="40" cy="60" r="2.5" fill="#fff" opacity=".6"/></svg>`;
    }
    let inner = base(c);
    if (sp === 'cauldron') {
      inner = `<path d="M10 40h80l-6 34a22 22 0 0 1-22 18H38a22 22 0 0 1-22-18z" fill="#1E1824" stroke="${PIECE_COL[c]}" stroke-width="5"/><ellipse cx="50" cy="40" rx="42" ry="9" fill="${PIECE_COL[c]}"/><circle cx="34" cy="30" r="7" fill="${PIECE_COL[c]}" opacity=".8"/><circle cx="56" cy="22" r="9" fill="${PIECE_COL[c]}" opacity=".7"/><circle cx="70" cy="32" r="5" fill="${PIECE_COL[c]}" opacity=".85"/><g transform="translate(30 50) scale(.4)">${base(c)}</g>`;
    }
    if (sp === 'candleH' || sp === 'candleV') {
      const h = sp === 'candleH';
      inner += h
        ? `<path d="M-4 38H104M-4 62H104" stroke="#FFF1C4" stroke-width="5" stroke-linecap="round" opacity=".95"/><path d="M-4 38H104M-4 62H104" stroke="#F2B544" stroke-width="2" stroke-linecap="round"/>`
        : `<path d="M38 -4V104M62 -4V104" stroke="#FFF1C4" stroke-width="5" stroke-linecap="round" opacity=".95"/><path d="M38 -4V104M62 -4V104" stroke="#F2B544" stroke-width="2" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
  }
  function vine() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="2" y="2" width="96" height="96" rx="12" fill="#1F2A1E"/><path d="M8 86C26 60 22 30 50 22s36 22 42 4M10 40c18 4 30 22 44 44M58 92c4-24 20-30 34-36" stroke="#5E9A55" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M30 34c-8-4-10-12-6-16 6 2 8 10 6 16zM70 60c8-2 14 2 14 8-6 2-12-2-14-8zM44 68c-4 8-12 10-16 6 2-6 10-8 16-6z" fill="#8CC47F"/><circle cx="62" cy="34" r="5" fill="#DB8EA3"/></svg>`;
  }
  function stone(hp) {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M8 18 22 6h56l14 12v64L78 94H22L8 82z" fill="#6E6680" stroke="#3E3850" stroke-width="3"/><path d="M8 18l14 8h56l14-8M22 26v60M78 26v60" stroke="#8A83A0" stroke-width="2" fill="none"/><path d="M42 40l16 0-8 24zM50 40v-6" stroke="#DCCBA8" stroke-width="4" fill="none" stroke-linejoin="round"/>${hp < 2 ? '<path d="M30 10l12 22-8 14 14 18-6 26M70 30l-10 20 12 12" stroke="#1E1A28" stroke-width="3.5" fill="none" stroke-linejoin="round"/>' : ''}</svg>`;
  }
  function beast() {
    let mane = '';
    for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; const x1 = 100 + Math.cos(a) * 58, y1 = 98 + Math.sin(a) * 58, x2 = 100 + Math.cos(a + 0.17) * 88, y2 = 98 + Math.sin(a + 0.17) * 88, x3 = 100 + Math.cos(a + 0.34) * 58, y3 = 98 + Math.sin(a + 0.34) * 58; mane += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${x3.toFixed(1)} ${y3.toFixed(1)}z" fill="${k % 2 ? '#C9822E' : '#E0A34A'}"/>`; }
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="98" r="90" fill="#3A2531"/>${mane}<circle cx="100" cy="100" r="58" fill="#F0C77A" stroke="#8C5A22" stroke-width="4"/><path d="M68 84q12-10 22 0M110 84q12-10 22 0" stroke="#3A2531" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="80" cy="92" r="6" fill="#3A2531"/><circle cx="120" cy="92" r="6" fill="#3A2531"/><path d="M90 112h20l-10 12z" fill="#7A3A2E"/><path d="M100 124v8M86 136q14 10 28 0" stroke="#3A2531" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="66" cy="114" r="8" fill="#E8A07A" opacity=".6"/><circle cx="134" cy="114" r="8" fill="#E8A07A" opacity=".6"/></svg>`;
  }
  function ribbon() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M4 44h92v12H4z" fill="#DB8EA3" stroke="#8E3E58" stroke-width="2"/><path d="M50 50l-16-14c-6 0-8 6-4 14 4 8 12 4 20 0zm0 0l16-14c6 0 8 6 4 14-4 8-12 4-20 0z" fill="#EFA9BC" stroke="#8E3E58" stroke-width="2.5" stroke-linejoin="round"/><circle cx="50" cy="50" r="5" fill="#8E3E58"/></svg>`;
  }
  function cat() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M18 18l18 18h28l18-18 4 40c0 22-16 34-36 34S14 80 14 58z" fill="#120E18" stroke="#3E3254" stroke-width="2"/><path d="M24 26l10 12M76 26l-10 12" stroke="#4A3A60" stroke-width="3"/><ellipse cx="36" cy="58" rx="8" ry="9" fill="#E9B94A"/><ellipse cx="64" cy="58" rx="8" ry="9" fill="#E9B94A"/><ellipse cx="36" cy="58" rx="2.5" ry="7" fill="#120E18"/><ellipse cx="64" cy="58" rx="2.5" ry="7" fill="#120E18"/><path d="M46 72h8l-4 4z" fill="#DB8EA3"/><path d="M50 12l3 6 6 1-5 4 2 6-6-4-6 4 2-6-5-4 6-1z" fill="#E9B94A"/></svg>`;
  }
  function veilIcon() { return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="8" y="8" width="84" height="84" rx="16" fill="#5E4884" stroke="#CDB4F0" stroke-width="4"/><path d="M8 30L30 8M8 54L54 8M8 78L78 8M22 92L92 22M46 92L92 46M70 92L92 70M30 92L8 70M54 92L8 46M78 92L8 22M92 78L22 8M92 54L46 8M92 30L70 8" stroke="#CDB4F0" stroke-width="2.5" opacity=".7"/></svg>`; }
  function starIcon() { return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2z" fill="#DDAA4F" stroke="#8C6A2E" stroke-width="3"/></svg>`; }

  // ---------- tarot emblems (ink drawings, original) ----------
  const INK = 'stroke="#2A2131" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const GOLD = '#B9842E';
  function sunRays(cx, cy, r1, r2, n) { let s = ''; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; s += `M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)}L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}`; } return s; }
  function star(cx, cy, r) { let s = ''; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const rr = k % 2 ? r * 0.42 : r; s += (k ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return s + 'z'; }
  const LEM = 'M50 30C60 18 80 18 80 30S60 42 50 30 20 18 20 30 40 42 50 30z';
  const EMB = {
    fool: `<circle cx="72" cy="26" r="10" fill="${GOLD}"/><path d="${sunRays(72, 26, 14, 20, 10)}" ${INK}/><path d="M6 84h44l12-20h32" ${INK}/><path d="M30 84V54m0 0l-8 14m8-14l8 12m-8-12a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM30 48l16-14m0 0l4 4-6 4z" ${INK}/>`,
    magician: `<path d="${LEM}" ${INK}/><path d="M50 48v40M44 50h12M44 86h12" ${INK}/><circle cx="50" cy="48" r="3" fill="${GOLD}"/><path d="M22 70l6-6m44 6l6-6" ${INK}/>`,
    priestess: `<path d="M18 88V24h12v64M70 88V24h12v64M14 24h20M66 24h20" ${INK}/><path d="M58 40a14 14 0 1 1-6-24 11 11 0 1 0 6 24z" fill="${GOLD}"/><path d="M40 60h20v28H40z" ${INK}/>`,
    empress: `<circle cx="50" cy="40" r="16" ${INK}/><path d="M50 56v26M38 70h24" ${INK}/><path d="M18 88c0-30 6-46 10-56M82 88c0-30-6-46-10-56M24 52l-8-4M26 64l-9-3M76 52l8-4M74 64l9-3" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    emperor: `<path d="M28 44h44v40H28zM22 84h56" ${INK}/><path d="M36 44c-16 0-20-20-6-22 8 0 8 10 2 10M64 44c16 0 20-20 6-22-8 0-8 10-2 10" ${INK}/><path d="M42 56h16v16H42z" fill="${GOLD}"/>`,
    hierophant: `<path d="M24 24l52 52M76 24L24 76" ${INK}/><circle cx="24" cy="24" r="7" ${INK}/><circle cx="76" cy="24" r="7" ${INK}/><path d="M68 72l6-6m-14-2l6-6M32 72l-6-6m14-2l-6-6" ${INK}/><circle cx="50" cy="50" r="5" fill="${GOLD}"/>`,
    lovers: `<circle cx="38" cy="58" r="18" ${INK}/><circle cx="62" cy="58" r="18" stroke="${GOLD}" stroke-width="3" fill="none"/><path d="M50 30c-4-8-16-6-14 2 2 6 14 12 14 12s12-6 14-12c2-8-10-10-14-2z" fill="#B2577A"/>`,
    chariot: `<circle cx="50" cy="58" r="22" ${INK}/><path d="M50 36v44M28 58h44M34 42l32 32M66 42L34 74" ${INK}/><circle cx="50" cy="58" r="5" fill="${GOLD}"/><path d="M8 88h84" ${INK}/><path d="${star(50, 18, 8)}" fill="${GOLD}"/>`,
    strength: `<path d="M50 20C55 13 66 13 66 20S55 27 50 20 34 13 34 20 45 27 50 20z" ${INK}/><circle cx="50" cy="60" r="18" ${INK}/><path d="${sunRays(50, 60, 21, 30, 14)}" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M43 58h0M57 58h0" stroke="#2A2131" stroke-width="5" stroke-linecap="round"/><path d="M46 66q4 4 8 0" ${INK}/>`,
    hermit: `<path d="M24 10v82" ${INK}/><path d="M24 20h28v8" ${INK}/><path d="M42 28h20l6 8v28l-6 8H42l-6-8V36z" ${INK}/><path d="${star(52, 50, 10)}" fill="${GOLD}"/>`,
    sun: `<circle cx="50" cy="50" r="18" fill="${GOLD}"/><path d="${sunRays(50, 50, 24, 38, 16)}" ${INK}/><path d="M44 48h0M56 48h0" stroke="#2A2131" stroke-width="4" stroke-linecap="round"/><path d="M44 56q6 4 12 0" ${INK}/>`,
    tower: `<path d="M36 90V34h28v56M32 34h36l-4-10H36z" ${INK}/><path d="M44 50h12v12H44z" ${INK}/><path d="M78 6L58 30h12L52 54" stroke="${GOLD}" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M20 30l-6-6M24 18l-8-2M80 64l8 2" ${INK}/>`,
    wands: `<path d="M30 90L34 14M50 90V10M70 90L66 14" ${INK}/><path d="M34 26c-6-2-8-8-6-10M50 22c6-2 8-8 6-10M66 30c6-2 8-8 6-10" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M14 90h72" ${INK}/>`,
    moon: `<path d="M64 14a24 24 0 1 0 0 40 20 20 0 1 1 0-40z" fill="${GOLD}"/><path d="M14 92V66h12v26M74 92V66h12v26" ${INK}/><path d="M40 66l2 8m8-10l0 10m8-8l-2 8" ${INK}/>`,
    temperance: `<path d="M18 50h22l-3 18H21zM60 60h22l-3 18H63z" ${INK}/><path d="M38 50C48 30 62 34 70 60" stroke="${GOLD}" stroke-width="3" fill="none" stroke-dasharray="4 4"/><path d="${star(50, 20, 8)}" ${INK}/>`,
    star: `<path d="${star(50, 42, 26)}" fill="${GOLD}" stroke="#2A2131" stroke-width="2.5"/><path d="${star(20, 18, 6)}${star(82, 20, 6)}${star(22, 76, 5)}${star(80, 74, 5)}" ${INK}/><path d="M20 92c10-6 50-6 60 0" ${INK}/>`,
    justice: `<path d="M50 12v76M20 30h60M36 88h28" ${INK}/><path d="M20 30l-10 24h20zM80 30l-10 24h20z" ${INK}/><path d="M10 54a10 6 0 0 0 20 0M70 54a10 6 0 0 0 20 0" fill="${GOLD}"/><circle cx="50" cy="12" r="4" fill="${GOLD}"/>`,
    pentacle: `<circle cx="50" cy="50" r="34" ${INK}/><circle cx="50" cy="50" r="28" stroke="${GOLD}" stroke-width="3" fill="none"/><path d="${(() => { let s = ''; for (let k = 0; k <= 5; k++) { const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5; s += (k ? 'L' : 'M') + (50 + Math.cos(a) * 26).toFixed(1) + ' ' + (50 + Math.sin(a) * 26).toFixed(1); } return s; })()}" ${INK}/>`,
    cup: `<path d="M26 20h48c0 26-10 40-24 40S26 46 26 20zM50 60v20M34 86h32" ${INK}/><path d="M30 26h40" stroke="${GOLD}" stroke-width="4"/><path d="M42 12c2 4 0 6-2 8M58 10c2 4 0 6-2 8" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  };
  const CARD_EMB = { sun: 'sun', tower: 'tower', wands: 'wands', moon: 'moon', conjure: 'magician', temperance: 'temperance', wish: 'star', smite: 'justice', sunlight: 'sun', movesLeft: 'pentacle', makeCauldron: 'cup', combo: 'cup', collectCandles: 'pentacle' };
  const LEVEL_EMB = ['fool', 'magician', 'priestess', 'empress', 'emperor', 'hierophant', 'lovers', 'chariot', 'strength', 'hermit'];
  function emblem(k) { return `<svg viewBox="0 0 100 100" aria-hidden="true">${EMB[k] || ''}</svg>`; }
  function tcard(num, name, embKey, extraCls) {
    return `<div class="tcard ${extraCls || ''}"><div class="frame"><span class="rn">${num}</span><span class="em">${emblem(embKey)}</span><span class="nm">${name}</span></div></div>`;
  }
  function tback(cls) { return `<div class="tcard back ${cls || ''}"><div class="frame"><svg viewBox="0 0 100 100" style="width:60%" aria-hidden="true"><path d="M64 14a30 30 0 1 0 0 52 25 25 0 1 1 0-52z" fill="#DDAA4F"/><path d="${star(40, 74, 8)}" fill="#DDAA4F"/></svg></div></div>`; }

  window.HXArt = { PIECE_NAMES, PIECE_COL, piece, vine, stone, beast, ribbon, cat, veilIcon, starIcon, emblem, tcard, tback, CARD_EMB, LEVEL_EMB, lantern: () => `<svg viewBox="0 0 100 100" aria-hidden="true">${lantern()}</svg>` };
})();
