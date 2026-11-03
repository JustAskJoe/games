// Moonwort & Co. placeholder art: herbs, familiars, villagers and the moon, all drawn in code as SVG. No image model.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
  const svg = (inner, vb) => `<svg viewBox="${vb || '0 0 40 40'}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  const stem = '<path d="M20 38 C20 30 20 24 20 18" stroke="#6f8a4f" stroke-width="2" fill="none" stroke-linecap="round"/>';

  function herb(h) {
    const c = h.color;
    switch (h.shape) {
      case 'flower': {
        let petals = '';
        for (let i = 0; i < 8; i++) petals += `<ellipse cx="20" cy="9" rx="3.4" ry="7" fill="${c}" transform="rotate(${i * 45} 20 16)"/>`;
        return svg(stem + `<g transform="translate(0,0)">${petals}</g><circle cx="20" cy="16" r="4" fill="#e9b13a"/>`);
      }
      case 'spray': {
        let buds = '';
        for (let i = 0; i < 6; i++) buds += `<ellipse cx="${i % 2 ? 23 : 17}" cy="${6 + i * 4.5}" rx="3" ry="2.2" fill="${c}"/>`;
        return svg('<path d="M20 38 L20 4" stroke="#6f8a4f" stroke-width="2" stroke-linecap="round"/>' + buds);
      }
      case 'leaf':
        return svg(stem + `<path d="M20 30 C6 24 8 8 20 3 C32 8 34 24 20 30Z" fill="${c}"/><path d="M20 29 L20 6" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>`);
      case 'root':
        return svg(`<path d="M10 14 C14 6 26 6 30 14 C34 22 26 34 20 36 C14 34 6 22 10 14Z" fill="${c}"/><path d="M14 16 L18 18 M24 22 L28 20 M17 26 L21 28" stroke="rgba(0,0,0,.25)" stroke-width="1.4"/>`);
      case 'berry': {
        let s = '';
        for (let i = 0; i < 7; i++) s += `<ellipse cx="${10 + (i % 4) * 6 + (i > 3 ? 3 : 0)}" cy="${i > 3 ? 24 : 16}" rx="2.3" ry="4.2" fill="${c}" transform="rotate(${i * 13 - 30} 20 20)"/>`;
        return svg(s);
      }
      case 'cone':
        return svg(stem + `<path d="M20 4 C30 10 30 24 20 32 C10 24 10 10 20 4Z" fill="${c}"/><path d="M14 12 L26 12 M12 18 L28 18 M14 24 L26 24" stroke="rgba(0,0,0,.2)" stroke-width="1.4"/>`);
      case 'bulb':
        return svg(`<path d="M20 4 C21 10 30 14 30 24 C30 32 25 36 20 36 C15 36 10 32 10 24 C10 14 19 10 20 4Z" fill="${c}"/><path d="M20 10 L20 34 M15 16 C14 24 15 30 17 34 M25 16 C26 24 25 30 23 34" stroke="rgba(0,0,0,.18)" stroke-width="1.2" fill="none"/>`);
      case 'fern': {
        let s = '<path d="M20 38 L20 6" stroke="#6f8a4f" stroke-width="2"/>';
        for (let i = 0; i < 5; i++) s += `<path d="M20 ${30 - i * 5} a6 4 0 0 0 -${9 - i} -2 M20 ${30 - i * 5} a6 4 0 0 1 ${9 - i} -2" fill="${c}" stroke="${c}" stroke-width="1"/>`;
        return svg(s + `<circle cx="20" cy="5" r="2.5" fill="${c}"/>`);
      }
      default: return svg(`<circle cx="20" cy="20" r="12" fill="${c}"/>`);
    }
  }

  function familiar(kind) {
    const glow = '<circle cx="60" cy="62" r="54" fill="rgba(227,183,90,.12)"/>';
    if (kind === 'cat') return svg(glow + '<path d="M34 100 C30 70 38 50 60 50 C82 50 90 70 86 100Z" fill="#3b2f3f"/><path d="M40 52 L36 28 L54 44 M80 52 L84 28 L66 44" fill="#3b2f3f"/><circle cx="60" cy="56" r="20" fill="#3b2f3f"/><path d="M38 40 L36 22 L52 36Z M82 40 L84 22 L68 36Z" fill="#3b2f3f"/><ellipse cx="52" cy="54" rx="3.5" ry="5" fill="#e3b75a"/><ellipse cx="68" cy="54" rx="3.5" ry="5" fill="#e3b75a"/><path d="M86 96 C104 96 104 76 96 72" stroke="#3b2f3f" stroke-width="7" fill="none" stroke-linecap="round"/>', '0 0 120 120');
    if (kind === 'toad') return svg(glow + '<ellipse cx="60" cy="80" rx="38" ry="24" fill="#6b7a3c"/><ellipse cx="60" cy="66" rx="30" ry="20" fill="#7c8c48"/><circle cx="46" cy="50" r="9" fill="#7c8c48"/><circle cx="74" cy="50" r="9" fill="#7c8c48"/><circle cx="46" cy="50" r="4.5" fill="#e3b75a"/><circle cx="74" cy="50" r="4.5" fill="#e3b75a"/><path d="M44 72 C54 78 66 78 76 72" stroke="#3c4422" stroke-width="2.5" fill="none"/><circle cx="50" cy="84" r="2.5" fill="#56622f"/><circle cx="70" cy="88" r="3" fill="#56622f"/>', '0 0 120 120');
    return svg(glow + '<path d="M30 92 C40 60 58 44 74 46 C90 48 92 66 84 80 C76 94 52 100 30 92Z" fill="#1f2230"/><circle cx="76" cy="44" r="15" fill="#1f2230"/><path d="M88 42 L106 48 L88 52Z" fill="#3a3a44"/><circle cx="80" cy="40" r="3" fill="#e3b75a"/><path d="M50 98 L46 108 M60 98 L60 108" stroke="#3a3a44" stroke-width="3"/><path d="M34 90 L14 100 L36 84" fill="#1f2230"/>', '0 0 120 120');
  }

  function face(v) { return `<div class="face" style="background:${v.color}">${v.name.replace('Old ', '')[0]}</div>`; }

  // The moon as it really is tonight: lit fraction and which side.
  function moon(sky, size) {
    const s = size || 22, r = s / 2 - 1, cx = s / 2, cy = s / 2;
    const k = Math.cos(2 * Math.PI * sky.age / 29.530588853); // 1 new, -1 full
    const rx = Math.abs(k) * r;
    const lightRight = sky.waxing;
    const outer = `M${cx} ${cy - r} A${r} ${r} 0 0 ${lightRight ? 1 : 0} ${cx} ${cy + r}`;
    const inner = `A${rx} ${r} 0 0 ${(k > 0) === lightRight ? 0 : 1} ${cx} ${cy - r}`;
    return `<svg class="moon" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-label="${sky.name}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#3b3346"/><path d="${outer} ${inner}Z" fill="#f2e6c4"/></svg>`;
  }

  root.MWART = { herb, familiar, face, moon };
})(window);
