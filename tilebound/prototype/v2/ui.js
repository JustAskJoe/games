(function () {
  const TB = window.TB;
  const $ = (s) => document.querySelector(s);
  const SEAT_WIND = ['East', 'South', 'West', 'North'];
  const SUIT_CLS = ['ember', 'tide', 'grove'];
  const CRITTER = [['mole', 'kiln', 'wyrm'], ['reed', 'koi', 'deluge'], ['moss', 'badger', 'elder']];
  const CRITTER_FULL = [['Cindermole', 'Kilnback', 'Forgewyrm'], ['Reedling', 'Marshkoi', 'Delugeon'], ['Mossmouse', 'Thornbadger', 'Elderroot']];
  const WIND_CRIT = ['owl', 'hare', 'fox', 'finch'];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let G = null;
  const ui = {
    mode: 'tilebound', coach: true, helpers: true, fast: false, words: 'plain', starter: null,
    targets: [], expanded: new Set(), sel: [], prompt: null, resolver: null,
    received: [], drawn: null, hint: [], bubbles: {}, log: [], over: null, started: false, toured: false,
    peek: null, used: {}, last: null, danger: new Set(), feedbackDone: false,
  };
  try { ui.fast = localStorage.getItem('tb-fast') === 'on'; } catch (e) { /* storage unavailable */ }

  // ---------- words ----------
  const WORDS = {
    plain: { swap: 'the Swap', Swap: 'The Swap', mimic: 'Mimic', mimics: 'Mimics', mahj: 'Mahj!', set: 'set', blossom: 'Blossom', drake: 'Drake', ready: 'Ready', card: 'House Card', courtesy: 'the courtesy trade' },
    table: { swap: 'the Charleston', Swap: 'The Charleston', mimic: 'Joker', mimics: 'Jokers', mahj: 'Mahjong!', set: 'pung', blossom: 'Flower', drake: 'Dragon', ready: 'Ready', card: 'Card', courtesy: 'the courtesy pass' },
  };
  const V = (k) => WORDS[ui.words][k];
  function tileLabel(t) {
    if (t < 27) { const s = Math.floor(t / 9), n = t % 9; return CRITTER[s][Math.floor(n / 3)]; }
    if (t < 31) return WIND_CRIT[t - 27];
    if (t < 34) return ui.words === 'table' ? 'dragon' : 'drake';
    if (t === TB.BLOSSOM) return ui.words === 'table' ? 'flower' : 'bloom';
    return ui.words === 'table' ? 'joker' : 'mimic';
  }
  function tName(t) {
    const n = TB.tileName(t);
    if (ui.words !== 'table') return n;
    return n.replace('Drake', 'Dragon').replace('Blossom', 'Flower').replace('Mimic', 'Joker');
  }
  const setWord = (s) => (ui.words === 'table' ? ({ 3: 'pung', 4: 'kong', 5: 'quint' }[s] || 'set') : `set of ${s}`);

  // ---------- helpers ----------
  const me = () => G.players[0];
  const name = (i) => (i === 0 ? 'You' : G.players[i].persona.name);
  const seatWind = (i) => SEAT_WIND[(i - G.dealer + 4) % 4];
  const wait = (ms) => new Promise((r) => setTimeout(r, ui.fast ? ms / 3 : ms));
  const targetSet = () => (ui.targets.length ? new Set(ui.targets) : null);

  function tileParts(t) {
    if (t < 27) { const s = Math.floor(t / 9); return { cls: SUIT_CLS[s], n: t % 9 + 1 }; }
    if (t < 31) return { cls: 'wind', n: 'NEWS'[t - 27] };
    if (t < 34) return { cls: ['crimson', 'pale', 'verdant'][t - 31], n: 'CPV'[t - 31] };
    if (t === TB.BLOSSOM) return { cls: 'blossom', n: '✿' };
    return { cls: 'mimic', n: '?' };
  }
  function tile(t, extra, tag, attrs) {
    const p = tileParts(t); const el = tag || 'span';
    return `<${el} class="tile ${p.cls} ${extra || ''}" title="${tName(t)}" aria-label="${tName(t)}" ${attrs || ''}><b class="n">${p.n}</b><i class="g">${tileLabel(t)}</i></${el}>`;
  }
  function expHTML(e) {
    let h = '<span class="exp">';
    for (let k = 0; k < e.s; k++) h += tile(k < e.s - e.j ? e.t : TB.MIMIC, 'sm');
    return h + '</span>';
  }
  function addLog(s) { ui.log.push(s); if (ui.log.length > 3) ui.log.shift(); }
  function bubble(i, text) {
    ui.bubbles[i] = text; render();
    setTimeout(() => { if (ui.bubbles[i] === text) { delete ui.bubbles[i]; render(); } }, ui.fast ? 800 : 1800);
  }
  const pick = (arr) => arr[Math.floor(G.r() * arr.length)];

  function away() {
    const p = me();
    if (TB.handSize(p) >= 14) {
      if (TB.isWin(p)) return 0;
      const ch = TB.discardChoices(p, targetSet());
      return ch.length ? ch[0].b : 99;
    }
    return TB.best(p).d;
  }
  function closest() {
    const bh = TB.byHand(me());
    return bh.map((x, h) => ({ h, d: x.d, T: x.T })).filter((x) => x.d < 99).sort((a, b) => a.d - b.d || TB.HANDS[b.h].pts - TB.HANDS[a.h].pts);
  }
  function primaryTarget() {
    const bh = TB.byHand(me());
    const t = ui.targets.map((h) => ({ h, d: bh[h].d, T: bh[h].T })).filter((x) => x.T && x.d < 99).sort((a, b) => a.d - b.d);
    if (t.length) return t[0];
    const c = closest(); return c[0] || null;
  }
  function bestDiscard() {
    const ch = TB.discardChoices(me(), targetSet());
    if (!ch.length) return null;
    if (ui.danger.size) { const safe = ch.filter((x) => !ui.danger.has(x.t) && x.b <= ch[0].b + 1); if (safe.length) return safe[0]; }
    return ch[0];
  }
  function rackTiles() {
    const p = me(); const list = [];
    for (let t = 0; t < TB.TYPES; t++) for (let k = 0; k < p.c[t]; k++) list.push({ t, key: t + ':' + k });
    return list;
  }
  const typeOf = (key) => Number(key.split(':')[0]);
  function keysFor(types) {
    const used = {}; const out = [];
    for (const t of types) { const k = used[t] || 0; used[t] = k + 1; out.push(t + ':' + (me().c[t] - 1 - k)); }
    return out;
  }
  function opponentBuilding(o) {
    const d = TB.dangerFor(G, o);
    if (!d) return null;
    const hands = [...d.hands].slice(0, 2).map((h) => TB.HANDS[h].name);
    return { hands, tiles: d.tiles };
  }

  // ---------- rendering ----------
  function render() {
    if (!G) return;
    $('#chipHand').textContent = `Hand ${G.handNo + 1} of ${G.hands}`;
    $('#chipWall').textContent = `Wall ${G.wall ? G.wall.length : 0}`;
    $('#modeTag').textContent = ui.mode === 'classic' ? 'Classic table' : (ui.starter !== null ? `Tilebound · ${CRITTER_FULL[ui.starter][0]}` : 'Tilebound table');
    renderSeats(); renderPond(); renderMe(); renderPrompt(); renderCard(); renderOverlay();
  }

  function renderSeats() {
    for (let i = 1; i <= 3; i++) {
      const p = G.players[i];
      const n = TB.handSize(p) - p.exps.reduce((a, e) => a + e.s, 0);
      const el = $('#seat' + i);
      el.classList.toggle('turn', G.turn === i && !ui.over);
      const tell = (p.persona.name === 'Bev' && TB.best(p).d <= 1 && TB.handSize(p) >= 13) ? '<span class="tell">taps her tiles…</span>' : '';
      const ab = ui.mode === 'tilebound' && p.suit !== undefined ? `<span title="${esc(TB.ABILITIES[SUIT_CLS[p.suit]].name)}">· ${esc(CRITTER_FULL[p.suit][0])}</span>` : '';
      el.innerHTML = `${ui.bubbles[i] ? `<span class="bubble">${esc(ui.bubbles[i])}</span>` : ''}
        <span class="wind">${seatWind(i)}${i === G.dealer ? ' · dealer' : ''}</span>
        <div class="who"><b>${esc(p.persona.name)}</b><span class="score">${p.score}</span></div>
        <div class="sub"><span>${n} tiles</span>${ab}${tell}</div>
        <div class="exps">${p.exps.map(expHTML).join('')}</div>`;
    }
  }

  function renderPond() {
    const rows = [];
    for (let k = 0; k < 4; k++) {
      const i = (G.dealer + k) % 4; const p = G.players[i];
      rows.push(`<div class="prow"><span class="pn">${esc(name(i))}</span><span class="pt">${p.pond.map((t, idx) => tile(t, 'sm' + (ui.last && ui.last.i === i && ui.last.k === idx ? ' last' : ''))).join('') || '<span style="color:var(--line);font-size:11px">—</span>'}</span></div>`);
    }
    $('#pondRows').innerHTML = rows.join('');
    const total = G.players.reduce((a, p) => a + p.pond.length, 0);
    $('#pondCount').textContent = total ? `${total} out` : '';
    $('#log').innerHTML = ui.log.map((s) => `<div>${esc(s)}</div>`).join('');
  }

  function renderMe() {
    const p = me();
    $('#me').classList.toggle('turn', G.turn === 0 && !ui.over);
    $('#myWind').textContent = `You · ${seatWind(0)}${G.dealer === 0 ? ' · dealer' : ''} · ${p.score} pts`;
    $('#myExps').innerHTML = p.exps.map(expHTML).join('');
    const a = away();
    const pt = primaryTarget();
    if (ui.helpers) {
      const txt = a === 0 ? [V('mahj'), 'your tiles match a hand on the card'] : a === 1 ? ['1', `tile from ${V('mahj').replace('!', '')} · ${V('ready')}!`] : a >= 99 ? ['–', 'no hand fits your laid-down sets'] : [String(a), `tiles from ${V('mahj').replace('!', '')}`];
      $('#counter').innerHTML = `<span class="big">${txt[0]}</span><span><span class="lbl">${txt[1]}</span><br><span class="sub">${pt ? (ui.targets.length ? 'Chasing ' : 'Closest: ') + esc(TB.HANDS[pt.h].name) : ''}</span></span>`;
    } else $('#counter').innerHTML = `<span class="lbl">${ui.mode === 'classic' ? 'Classic rules' : 'Helpers off'}</span>`;

    const fits = {}; if (ui.helpers && pt) for (const [t, s] of pt.T.g) fits[t] = s;
    const hintKeys = new Set(ui.hint);
    const newCount = {}; ui.received.forEach((t) => { newCount[t] = (newCount[t] || 0) + 1; });
    if (ui.drawn !== null) newCount[ui.drawn] = (newCount[ui.drawn] || 0) + 1;
    const mode = ui.prompt && ui.prompt.kind;
    const usedFits = {};
    $('#rack').innerHTML = rackTiles().map((x) => {
      const cls = [];
      if (ui.sel.includes(x.key)) cls.push('sel');
      if (hintKeys.has(x.key)) cls.push('hint');
      const k = Number(x.key.split(':')[1]); const cnt = p.c[x.t];
      if (newCount[x.t] && k >= cnt - newCount[x.t]) cls.push('new');
      if (fits[x.t] !== undefined) { usedFits[x.t] = (usedFits[x.t] || 0) + 1; if (usedFits[x.t] <= fits[x.t]) cls.push('fits'); }
      else if (x.t === TB.MIMIC && ui.helpers && pt && !TB.HANDS[pt.h].noJ) cls.push('fits');
      else if (ui.helpers && ui.danger.has(x.t)) cls.push('danger');
      const pickable = mode === 'swap' || mode === 'courtesy' || mode === 'discard' || mode === 'selfMahj';
      const off = (mode === 'swap' || mode === 'courtesy') && x.t === TB.MIMIC;
      return tile(x.t, cls.join(' ') + (off ? ' off' : ''), 'button', `type="button" data-key="${x.key}" ${!pickable || off ? 'aria-disabled="true"' : ''}`);
    }).join('');

    // ability strip
    const ab = $('#abil');
    if (ui.mode === 'tilebound' && ui.starter !== null) {
      const A = TB.ABILITIES[SUIT_CLS[ui.starter]];
      const can = ui.prompt && ui.prompt.kind === 'discard' && !ui.used[A.name];
      const extra = ui.starter === 2 ? (away() <= 2 ? '' : ' (needs 2 or fewer from Mahj)') : '';
      let act = '';
      if (ui.starter === 1) act = can ? '<button class="btn sm primary" data-act="peek" type="button">Peek</button>' : '';
      if (ui.starter === 2) act = can && away() <= 2 ? '<button class="btn sm primary" data-act="extra" type="button">Extra draw</button>' : '';
      ab.innerHTML = `<div class="abil"><span><b>${esc(CRITTER_FULL[ui.starter][0])} · ${esc(A.name)}</b> · ${esc(A.when.toLowerCase())}, ${esc(A.does)}${ui.used[A.name] ? ' <i>(used this hand)</i>' : esc(extra)}</span>${act}</div>`;
    } else ab.innerHTML = '';
  }

  function coachLine(P) {
    const pt = primaryTarget(); const bn = pt ? TB.HANDS[pt.h].name : 'your hand';
    const nm = (keys) => keys.map((k) => tName(typeOf(k))).join(', ');
    if (P.kind === 'swap') {
      let intro = '';
      if (!ui.toured && P.step === 1 && !P.second) intro = `Welcome to the real table. You sit at the bottom; Rosa, Lena and I sit around you. The House Card is below your tiles. First, ${V('swap')}: everyone passes 3 tiles they don’t want. `;
      if (ui.sel.length === 3 && ui.hint.length) return `${intro}Pass the 3 glowing tiles (${nm(ui.sel)}). None of them help ${esc(bn)}. Tap <b>Pass</b>.`;
      return `${intro}Pick 3 tiles that don’t help ${esc(bn)}, then tap <b>Pass</b>.`;
    }
    if (P.kind === 'vote') return `Say <b>Yes</b>. A second ${V('swap').replace('the ', '')} is a free chance to trade junk for tiles you need. It only happens if all four agree.`;
    if (P.kind === 'courtesy') return ui.sel.length ? `Trade the ${ui.sel.length} glowing tile${ui.sel.length > 1 ? 's' : ''} with ${esc(name(2))} across from you. Tap <b>Trade</b>.` : `Your hand is in good shape, so skip ${V('courtesy')}. Tap <b>Skip</b>.`;
    if (P.kind === 'discard') {
      const warn = [1, 2, 3].map((o) => ({ o, b: opponentBuilding(o) })).find((x) => x.b && ui.sel.length === 1 && x.b.tiles.has(typeOf(ui.sel[0])));
      if (warn) return `Careful: ${esc(name(warn.o))} has sets down and looks to be building ${esc(warn.b.hands.join(' or '))}. ${tName(typeOf(ui.sel[0]))} could feed them. Pick something safer if you can.`;
      if (ui.hint.length && ui.sel.length === 1 && ui.sel[0] === ui.hint[0]) return `You drew, so now you discard one. Throw away the glowing <b>${tName(typeOf(ui.hint[0]))}</b>; it doesn’t help ${esc(bn)}. Tap <b>Discard</b>.`;
      return `Pick the tile to throw away, then tap <b>Discard</b>. Tiles with a green line under them belong to ${esc(bn)}.`;
    }
    if (P.kind === 'discard2') return 'Extra draw done. Now discard <b>two</b>: tap the first glowing tile, then <b>Discard</b>, and again.';
    if (P.kind === 'selfMahj') return `That’s a winning hand! Tap <b>${V('mahj')}</b>`;
    if (P.kind === 'claimMahj') return `That ${tName(P.t)} is your winning tile. Tap <b>${V('mahj')}</b>`;
    if (P.kind === 'claimSet') return `Grab it! The ${tName(P.t)} gives you a ${setWord(P.opt.s)} for ${esc(TB.HANDS[P.opt.T.h].name)}. Tap <b>Take it</b>, then you’ll discard.`;
    if (P.kind === 'jswap') return `${esc(name(P.opt.owner))} has a ${V('mimic')} in a laid-down set of ${tName(P.opt.t)}s, and you hold a real ${tName(P.opt.t)}. Swap them and the ${V('mimic')} is yours. Tap <b>Swap</b>.`;
    return '';
  }
  const coachBtn = (P) => ({ swap: 'pass', vote: 'yes', courtesy: ui.sel.length ? 'trade' : 'skip', discard: 'discard', discard2: 'discard', selfMahj: 'mahj', claimMahj: 'mahj', claimSet: 'take', jswap: 'jswap' }[P.kind]);

  function renderPrompt() {
    const P = ui.prompt; const el = $('#prompt');
    if (P && P.kind === 'swap' && P.step === 2) ui.toured = true;
    const wrapCoach = (txt) => (ui.coach ? `<span class="coach"><img src="img/bev.jpg" alt="Bev"><span><b>Bev:</b> ${txt}</span></span>` : `<span>${txt}</span>`);
    if (!P) {
      const t = G.turn;
      const msg = ui.over || t < 0 ? 'Dealing…' : t === 0 ? 'Your turn.' : `${esc(name(t))} is taking a turn.${ui.coach ? ' If their discard helps you, I’ll say so.' : ''}`;
      el.innerHTML = `<p>${ui.coach && t > 0 ? wrapCoach(msg) : msg}</p>`;
      return;
    }
    let text = '', acts = '';
    const H = ui.helpers;
    if (P.kind === 'swap') {
      text = `<b>${V('Swap')} · pass ${P.step} of 3${P.second ? ' (second)' : ''}.</b> Pick 3 tiles to pass ${P.label} to ${esc(P.toName)}. ${V('mimics')} can’t be passed.`;
      acts = `${H ? '<button class="btn" data-act="suggest" type="button">Suggest 3</button>' : ''}<button class="btn primary" data-act="pass" type="button" ${ui.sel.length === 3 ? '' : 'disabled'}>Pass ${ui.sel.length}/3 ${P.arrow}</button>`;
    } else if (P.kind === 'vote') {
      text = `<b>First ${V('swap').replace('the ', '')} done.</b> Do a second one? It happens only if all four players agree.`;
      acts = '<button class="btn" data-act="no" type="button">No, play</button><button class="btn primary" data-act="yes" type="button">Yes, again</button>';
    } else if (P.kind === 'courtesy') {
      text = `<b>Courtesy trade with ${esc(name(2))} (across).</b> Pick 0–3 tiles to trade; you both give the same number.`;
      acts = `<button class="btn" data-act="skip" type="button">Skip</button><button class="btn primary" data-act="trade" type="button" ${ui.sel.length ? '' : 'disabled'}>Trade ${ui.sel.length}</button>`;
    } else if (P.kind === 'discard' || P.kind === 'discard2') {
      text = P.kind === 'discard2' ? '<b>Discard two.</b> Tap a tile, then Discard; then once more.' : `<b>Your turn.</b> Tap a tile, then Discard${H ? ', or ask for a hint' : ''}. Tap a raised tile again to discard it.`;
      const js = P.kind === 'discard' ? TB.jokerSwapOptions(G, 0) : [];
      acts = `${js.length ? `<button class="btn" data-act="jswapgo" type="button">Swap a ${V('mimic')} out</button>` : ''}${H ? '<button class="btn" data-act="hint" type="button">Hint</button>' : ''}<button class="btn primary" data-act="discard" type="button" ${ui.sel.length === 1 ? '' : 'disabled'}>Discard</button>`;
      if (ui.peek) text += `<br><span class="peek">Next in the wall: ${ui.peek.map((t) => tile(t)).join('')}</span>`;
    } else if (P.kind === 'selfMahj') {
      text = `<b>Your tiles make ${esc(TB.HANDS[P.T.h].name)}!</b> Declare it to win the hand.`;
      acts = `<button class="btn" data-act="keep" type="button">Keep playing</button><button class="btn primary" data-act="mahj" type="button">${V('mahj')}</button>`;
    } else if (P.kind === 'claimMahj') {
      text = `<b>${esc(name(P.from))} discarded ${tName(P.t)}.</b> It completes ${esc(TB.HANDS[P.T.h].name)}. Claim it to win.`;
      acts = `<button class="btn" data-act="pass" type="button">Pass</button><button class="btn primary" data-act="mahj" type="button">${V('mahj')}</button>`;
    } else if (P.kind === 'claimSet') {
      const o = P.opt;
      text = `<b>${esc(name(P.from))} discarded ${tName(P.t)}.</b> Take it to lay down a ${setWord(o.s)}${o.need ? ` (using ${o.need} ${V(o.need > 1 ? 'mimics' : 'mimic')})` : ''} toward ${esc(TB.HANDS[o.T.h].name)}? Laid-down sets lock you into hands that use them.`;
      acts = '<button class="btn" data-act="pass" type="button">Pass</button><button class="btn primary" data-act="take" type="button">Take it</button>';
    } else if (P.kind === 'jswap') {
      text = `<b>Swap a ${V('mimic')} out?</b> ${esc(name(P.opt.owner))}’s laid-down ${tName(P.opt.t)}s hold a ${V('mimic')}; you have a real ${tName(P.opt.t)}.`;
      acts = '<button class="btn" data-act="pass" type="button">Not now</button><button class="btn primary" data-act="jswap" type="button">Swap</button>';
    } else if (P.kind === 'targets') {
      text = `<b>Pick the hands you’ll chase.</b> Open the ${V('card')} and star 1 or 2 hands. Your hints will aim at them.`;
      acts = '<button class="btn primary" data-act="opencard" type="button">Open the card</button>';
    }
    if (ui.coach) {
      const c = coachLine(P);
      if (c) { text = wrapCoach(c); const b = coachBtn(P); acts = acts.replace(`data-act="${b}"`, `data-act="${b}" data-focus="1"`); }
    }
    el.innerHTML = `<p>${text}</p><div class="acts">${acts}</div>`;
  }

  function handRow(x, opts) {
    const H = TB.HANDS[x.h]; const p = me();
    const isT = ui.targets.includes(x.h);
    const open = isT || ui.expanded.has(x.h) || (opts && opts.openAll);
    let tiles = '';
    if (x.T) {
      const expT = new Set(p.exps.map((e) => e.t + ':' + e.s));
      for (const [t, s] of x.T.g) {
        const laid = expT.has(t + ':' + s); const have = laid ? s : Math.min(p.c[t], s);
        let g = '<span class="grp">'; for (let k = 0; k < s; k++) g += tile(t, 'sm' + (k < have ? '' : ' dim')); tiles += g + '</span>';
      }
    } else tiles = `<span class="note">${esc(H.pattern)}</span>`;
    const awayTxt = x.d === 0 ? V('mahj') : x.d >= 99 ? 'blocked' : `${x.d} away`;
    return `<div class="hand${isT ? ' target' : ''}${open ? '' : ' collapsed'}" data-h="${x.h}">
      <button class="star" type="button" data-star="${x.h}" aria-pressed="${isT}" aria-label="${isT ? 'Stop chasing' : 'Chase'} ${esc(H.name)}">${isT ? '★' : '☆'}</button>
      <button class="nm" type="button" data-open="${x.h}" style="background:none;border:0;padding:0;color:inherit;cursor:pointer">${esc(H.name)} <small>${H.x ? 'X' : 'C'} · ${H.pts}</small></button>
      <span class="away${x.d > 6 ? ' far' : ''}">${awayTxt}</span>
      <span class="tiles">${tiles}</span>
      <span class="rule">${esc(H.rule)}</span></div>`;
  }

  function renderCard() {
    const el = $('#cardPanel');
    const bh = TB.byHand(me());
    const rows = TB.HANDS.map((H, h) => ({ h, d: bh[h].d, T: bh[h].T }));
    const ts = rows.filter((x) => ui.targets.includes(x.h)).sort((a, b) => ui.targets.indexOf(a.h) - ui.targets.indexOf(b.h));
    const rest = rows.filter((x) => !ui.targets.includes(x.h)).sort((a, b) => a.d - b.d || TB.HANDS[b.h].pts - TB.HANDS[a.h].pts);
    let h = `<div class="card-head"><h2>${V('card')} · ${TB.HANDS.length} hands</h2><span class="note">${ui.targets.length ? 'Chasing ' + ui.targets.length : 'Star hands to chase'}</span></div>`;
    h += ts.map((x) => handRow(x)).join('') + rest.map((x) => handRow(x)).join('');
    h += `<p class="note">Tap a name to see its tiles; faded tiles are ones you still need. X = may lay down sets; C = stays hidden until you win. ${V('mimics')} fill any group of 3 or more.</p>`;
    el.innerHTML = h;
  }

  // ---------- overlays ----------
  function showOverlay(kind, data) { ui.over = { kind, data }; render(); }
  function closeOverlay() { ui.over = null; render(); }

  function howHTML() {
    return `<h2>How to play</h2>
      <p>Make one hand from the ${V('card')} with exactly 14 tiles. You play against Rosa, Lena and Bev.</p>
      <ol>
        <li><b>${V('Swap')}.</b> Before play, pass 3 tiles you don’t want: right, across, then left. All four can agree to a second round, then you and the player across may trade up to 3.</li>
        <li><b>Your turn.</b> Draw a tile, then discard one. You hold 13 between turns.</li>
        <li><b>Grab a discard.</b> If someone’s discard finishes a group of 3 or more for an X hand, you may take it and lay the group face up. Any discard can be taken to win.</li>
        <li><b>${V('mimics')}.</b> Jokers: they fill any group of 3 or more, never a pair. If a laid-down group holds one and you have the real tile, you may swap it out on your turn.</li>
        <li><b>${V('mahj')}</b> When your 14 tiles match a hand on the card exactly, you win. The discarder pays double; a self-drawn win, everyone pays double; no ${V('mimics')} in your hand doubles it again.</li>
      </ol>
      ${ui.mode === 'tilebound' ? '<p><b>Tilebound twists:</b> your starter critter favors your suit at the deal and gives you one ability. Rosa plays Ember, Lena plays Tide, Bev plays Grove.</p>' : ''}
      <div class="acts"><button class="btn primary" data-act="close" type="button">Back to the table</button></div>`;
  }

  function menuHTML() {
    const on = (b) => (b ? 'On' : 'Off');
    return `<h2>Menu</h2><div class="menu">
      <button class="btn" data-act="how" type="button">How to play <span>›</span></button>
      <button class="btn" data-act="intro" type="button">Intro, starters &amp; lessons <span>›</span></button>
      <button class="btn" data-act="tHelpers" type="button" aria-pressed="${ui.helpers}">Helpers (counter, hints, closest hands) <span>${on(ui.helpers)}</span></button>
      <button class="btn" data-act="tCoach" type="button" aria-pressed="${ui.coach}">Bev coaches every step <span>${on(ui.coach)}</span></button>
      <button class="btn" data-act="tWords" type="button" aria-pressed="${ui.words === 'table'}">Table words (Charleston, Joker, pung) <span>${on(ui.words === 'table')}</span></button>
      <button class="btn" data-act="tFast" type="button" aria-pressed="${ui.fast}">Fast bots <span>${on(ui.fast)}</span></button>
      <button class="btn" data-act="feedback" type="button">Give feedback <span>›</span></button>
      <button class="btn" data-act="sim" type="button">Bot simulation <span>›</span></button>
      <button class="btn" data-act="newmatch" type="button">Start a new evening <span>›</span></button>
    </div><div class="acts"><button class="btn primary" data-act="close" type="button">Close</button></div>`;
  }

  function targetsHTML() {
    const bh = TB.byHand(me());
    const rows = TB.HANDS.map((H, h) => ({ h, d: bh[h].d, T: bh[h].T })).sort((a, b) => a.d - b.d || TB.HANDS[b.h].pts - TB.HANDS[a.h].pts);
    return `<h2>Pick 1–2 hands to chase</h2>
      <p class="note" style="color:var(--muted)">${ui.coach ? 'Bev: I’ve starred the two your tiles lean toward. Tap a star to change your mind, then tap <b>Chase these</b>.' : 'Sorted by how close you are. Your hints and the green lines under your tiles aim at starred hands. You can change them any time from the card.'}</p>
      <div class="card" style="padding:0;border:0;background:transparent">${rows.map((x) => handRow(x, { openAll: true })).join('')}</div>
      <div class="acts"><button class="btn primary" data-act="chase" type="button" ${ui.targets.length ? '' : 'disabled'} data-focus="1">Chase ${ui.targets.length ? ui.targets.map((h) => TB.HANDS[h].name).join(' + ') : 'these'}</button></div>`;
  }

  function handTilesHTML(snap) {
    let h = '<div class="win-tiles">';
    for (let t = 0; t < TB.TYPES; t++) for (let k = 0; k < snap.c[t]; k++) h += tile(t);
    for (const e of snap.exps) h += expHTML(e);
    return h + '</div>';
  }

  function renderOverlay() {
    const el = $('#overlay'); const O = ui.over;
    if (!O) { el.innerHTML = ''; return; }
    let inner = '';
    if (O.kind === 'how') inner = howHTML();
    else if (O.kind === 'menu') inner = menuHTML();
    else if (O.kind === 'targets') inner = targetsHTML();
    else if (O.kind === 'sim') inner = simHTML();
    else if (O.kind === 'feedback') inner = feedbackHTML();
    else if (O.kind === 'handEnd') {
      const r = O.data;
      if (r.wall) inner = '<h2>Wall game</h2><p>The wall ran out and nobody made a hand, so nobody pays.</p>';
      else {
        const who = r.winner === 0 ? 'You win' : name(r.winner) + ' wins';
        const how = r.from === null ? 'drawn from the wall' : `on ${r.from === 0 ? 'your' : name(r.from) + '’s'} discard`;
        inner = `<h2>${who} with ${esc(r.hand.name)}</h2><p>${esc(r.hand.pattern)}, ${how}. ${r.hand.pts} points${r.clean ? `, doubled for using no ${V('mimics')}` : ''}.</p>${handTilesHTML(r.snap)}`;
        inner += '<div class="tbl-wrap"><table><thead><tr><th>Player</th><th>This hand</th><th>Total</th></tr></thead><tbody>' + G.players.map((p, i) => `<tr><td>${esc(name(i))}</td><td class="${r.pays[i] > 0 ? 'ok' : ''}">${r.pays[i] > 0 ? '+' : ''}${r.pays[i]}</td><td>${p.score}</td></tr>`).join('') + '</tbody></table></div>';
      }
      if (O.data.mine) inner += `<p class="note" style="color:var(--muted)">You finished ${O.data.mine}.</p>`;
      inner += `<div class="acts"><button class="btn primary" data-act="next" type="button">${G.handNo + 1 >= G.hands ? 'See the results' : 'Next hand'}</button></div>`;
    } else if (O.kind === 'matchEnd') {
      const ranks = G.players.map((p, i) => ({ i, s: p.score })).sort((a, b) => b.s - a.s); const top = ranks[0];
      inner = `<h2>${top.i === 0 ? 'You win the evening' : esc(name(top.i)) + ' wins the evening'}</h2>
        <div class="tbl-wrap"><table><thead><tr><th>Place</th><th>Player</th><th>Score</th></tr></thead><tbody>${ranks.map((r, k) => `<tr><td>${k + 1}</td><td>${esc(name(r.i))}</td><td>${r.s}</td></tr>`).join('')}</tbody></table></div>
        <p class="note" style="color:var(--muted)">${G.history.map((h, k) => `Hand ${k + 1}: ${h.wall ? 'wall game' : esc(name(h.winner)) + ', ' + esc(h.hand.name)}`).join(' · ')}</p>
        <div class="acts"><button class="btn" data-act="again" type="button">Play another evening</button><button class="btn primary" data-act="feedback" type="button" data-focus="1">Tell us what you thought</button></div>`;
    }
    el.innerHTML = `<div class="veil"><div class="modal" role="dialog" aria-modal="true">${inner}</div></div>`;
  }

  // ---------- feedback ----------
  const FB = { q: {}, text: '', nm: '', saved: null };
  const FQ = [
    { id: 'exp', q: 'Have you played American mahjong before?', opts: ['In a club or weekly game', 'A few times', 'Never'] },
    { id: 'rules', q: 'Did the rules feel like real American mahjong?', opts: ['Yes', 'Mostly', 'Not really', 'Can’t tell'] },
    { id: 'help', q: 'The helpers (counter, closest hands, Bev)…', opts: ['Helped', 'Fine', 'Got in the way', 'Didn’t use them'] },
    { id: 'fun', q: 'How fun was it, 1 to 5?', opts: ['1', '2', '3', '4', '5'] },
    { id: 'critters', q: 'The critters and abilities…', opts: ['Loved them', 'Nice', 'Didn’t notice', 'Didn’t like them'] },
    { id: 'play', q: 'Would you play this game?', opts: ['Yes', 'Maybe', 'No'] },
  ];
  function feedbackHTML() {
    const qs = FQ.map((f) => `<div class="field"><label>${esc(f.q)}</label><div class="choices">${f.opts.map((o) => `<button class="btn" type="button" data-fq="${f.id}" data-fv="${esc(o)}" aria-pressed="${FB.q[f.id] === o}">${esc(o)}</button>`).join('')}</div></div>`).join('');
    const summary = feedbackText();
    return `<h2>What did you think?</h2>
      <p class="note" style="color:var(--muted)">Six quick taps plus anything you want to say. Your answers go to F, no names needed.</p>
      ${qs}
      <div class="field"><label for="fbText">What was confusing, or what would you change?</label><textarea id="fbText" rows="3">${esc(FB.text)}</textarea></div>
      <div class="field"><label for="fbName">Your name (optional)</label><input id="fbName" type="text" value="${esc(FB.nm)}"></div>
      ${FB.saved === true ? '<p style="color:var(--good);font-weight:700">Saved. Thank you!</p>' : FB.saved === 'copy' ? `<p class="note" style="color:var(--muted)">Couldn’t save from this device, so copy your answers and text them to F:</p><div class="copybox" id="fbCopy">${esc(summary)}</div>` : ''}
      <div class="acts">${FB.saved === 'copy' ? '<button class="btn" data-act="fbcopy" type="button">Copy answers</button>' : ''}<button class="btn" data-act="close" type="button">Close</button>${FB.saved !== true ? '<button class="btn primary" data-act="fbsend" type="button">Send</button>' : ''}</div>`;
  }
  function feedbackText() {
    const lines = FQ.map((f) => `${f.q} ${FB.q[f.id] || '–'}`);
    lines.push(`Notes: ${FB.text || '–'}`); lines.push(`From: ${FB.nm || 'anonymous'} · mode ${ui.mode}${ui.starter !== null ? ' · ' + CRITTER_FULL[ui.starter][0] : ''}`);
    return 'Tilebound feedback\n' + lines.join('\n');
  }
  async function sendFeedback() {
    FB.text = $('#fbText').value; FB.nm = $('#fbName').value;
    const body = { answers: Object.assign({}, FB.q), notes: FB.text, name: FB.nm, mode: ui.mode, starter: ui.starter, at: new Date().toISOString(), hands: G ? G.history.length : 0 };
    try {
      const db = window.claude && window.claude.use ? await window.claude.use('db') : null;
      if (!db) throw new Error('no db');
      await db.collection('feedback').add(body);
      FB.saved = true;
    } catch (e) { FB.saved = 'copy'; }
    ui.feedbackDone = true; render();
  }

  // ---------- bot simulation ----------
  const sim = { running: false, st: null, n: 0, target: 200 };
  function simHTML() {
    const st = sim.st;
    let body = '<h2>Bot simulation</h2><p>Four bots play full hands with no screen, on the same rules engine as the table. Step 1 of the prototype plan: do the rules work?</p>';
    if (st && st.hands) {
      const w = Math.max(1, st.wins); const pct = (x, n) => (100 * x / n).toFixed(0) + '%';
      const rounds = st.rounds / st.hands, wallP = st.wall / st.hands, eastP = st.east / w;
      body += `<p><b>${st.hands}</b> hands played${sim.running ? '…' : ''}.</p><div class="tbl-wrap"><table><thead><tr><th>Measure</th><th>Result</th><th>Target</th></tr></thead><tbody>
        <tr><td>Rounds per hand</td><td class="${rounds >= 12 && rounds <= 20 ? 'ok' : 'warn'}">${rounds.toFixed(1)}</td><td>12–20</td></tr>
        <tr><td>Wall games (nobody wins)</td><td class="${wallP <= 0.25 ? 'ok' : 'warn'}">${pct(st.wall, st.hands)}</td><td>under 25%</td></tr>
        <tr><td>Dealer wins</td><td class="${Math.abs(eastP - 0.25) <= 0.05 ? 'ok' : 'warn'}">${pct(st.east, w)}</td><td>about 25%</td></tr>
        <tr><td>Won on a self-drawn tile</td><td>${pct(st.self, w)}</td><td>–</td></tr></tbody></table></div>
        <h3>Which hands win</h3><div class="tbl-wrap"><table><thead><tr><th>Hand</th><th>Share of wins</th></tr></thead><tbody>${TB.HANDS.map((H, i) => `<tr><td>${esc(H.name)}</td><td class="${st.byHand[i] / w > 0.35 ? 'warn' : ''}">${pct(st.byHand[i], w)}</td></tr>`).join('')}</tbody></table></div>`;
    }
    body += `<div class="acts"><button class="btn" data-act="close" type="button">Close</button><button class="btn primary" data-act="runsim" type="button" ${sim.running ? 'disabled' : ''}>${sim.running ? 'Running…' : 'Run 200 hands'}</button></div>`;
    return body;
  }
  function runSim() {
    sim.running = true; sim.n = 0;
    sim.st = { hands: 0, wall: 0, rounds: 0, byHand: TB.HANDS.map(() => 0), east: 0, wins: 0, self: 0 };
    const seed0 = Math.floor(Math.random() * 1e6);
    const step = () => {
      for (let k = 0; k < 10 && sim.n < sim.target; k++, sim.n++) {
        const S = TB.newMatch(seed0 + sim.n); S.dealer = sim.n % 4; S.secondSwap = true; S.courtesy = true;
        const res = TB.simHand(S); const st = sim.st; st.hands++; st.rounds += res.draws / 4;
        if (res.wall) st.wall++; else { st.wins++; st.byHand[res.T.h]++; if (res.winner === S.dealer) st.east++; if (res.self) st.self++; }
      }
      if (sim.n >= sim.target) sim.running = false;
      if (ui.over && ui.over.kind === 'sim') renderOverlay();
      if (sim.running) setTimeout(step, 0);
    };
    renderOverlay(); setTimeout(step, 30);
  }

  // ---------- input ----------
  function ask(prompt) {
    ui.prompt = prompt; ui.sel = []; ui.hint = [];
    if (ui.coach || (ui.helpers && prompt.kind === 'courtesy')) {
      if (prompt.kind === 'swap') { const tmp = { c: me().c.slice(), exps: [], persona: {} }; const picks = pickPass(tmp, 3); ui.sel = keysFor(picks); ui.hint = ui.sel.slice(); }
      if (prompt.kind === 'courtesy') { const tmp = { c: me().c.slice(), exps: [], persona: {} }; const far = TB.best(me()).d >= 4; const picks = far ? pickPass(tmp, 3) : []; ui.sel = keysFor(picks); ui.hint = ui.sel.slice(); }
      if ((prompt.kind === 'discard' || prompt.kind === 'discard2') && ui.coach) { const b = bestDiscard(); if (b) { ui.hint = keysFor([b.t]); ui.sel = ui.hint.slice(); } }
    }
    render();
    return new Promise((res) => { ui.resolver = res; });
  }
  // Pass picks that respect the player's chosen targets.
  function pickPass(tmp, n) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const ch = TB.discardChoices(tmp, targetSet()).filter((x) => x.t !== TB.MIMIC);
      if (!ch.length) break;
      tmp.c[ch[0].t]--; out.push(ch[0].t);
    }
    return out;
  }
  function answer(v) {
    const r = ui.resolver; ui.resolver = null; ui.prompt = null; ui.sel = []; ui.hint = [];
    if (r) r(v);
  }
  let overResolver = null;
  function overlayWait(kind, data) { showOverlay(kind, data); return new Promise((res) => { overResolver = res; }); }

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (b.id === 'bMenu') return showOverlay('menu');
    if (b.dataset.star !== undefined) {
      const h = Number(b.dataset.star); const i = ui.targets.indexOf(h);
      if (i >= 0) ui.targets.splice(i, 1); else { ui.targets.push(h); if (ui.targets.length > 2) ui.targets.shift(); }
      if (ui.prompt && (ui.prompt.kind === 'discard' || ui.prompt.kind === 'swap') && ui.coach) { const bd = ui.prompt.kind === 'discard' ? bestDiscard() : null; if (bd) { ui.hint = keysFor([bd.t]); ui.sel = ui.hint.slice(); } }
      return render();
    }
    if (b.dataset.open !== undefined) { const h = Number(b.dataset.open); if (ui.expanded.has(h)) ui.expanded.delete(h); else ui.expanded.add(h); return render(); }
    if (b.dataset.fq) { FB.q[b.dataset.fq] = b.dataset.fv; FB.text = ($('#fbText') || {}).value || FB.text; FB.nm = ($('#fbName') || {}).value || FB.nm; return render(); }

    if (act === 'close') { closeOverlay(); return; }
    if (act === 'how') return showOverlay('how');
    if (act === 'sim') return showOverlay('sim');
    if (act === 'feedback') { if (ui.over && ui.over.kind === 'matchEnd') { const r = overResolver; overResolver = null; if (r) r('feedback'); } return showOverlay('feedback'); }
    if (act === 'fbsend') return sendFeedback();
    if (act === 'fbcopy') { const t = feedbackText(); try { navigator.clipboard.writeText(t).catch(() => selectCopy()); } catch (e) { selectCopy(); } return; }
    if (act === 'intro') { closeOverlay(); if (window.TBStory) window.TBStory.replay(); return; }
    if (act === 'tHelpers') { ui.helpers = !ui.helpers; if (!ui.helpers) { ui.hint = []; } return render(); }
    if (act === 'tCoach') { ui.coach = !ui.coach; return render(); }
    if (act === 'tWords') { ui.words = ui.words === 'table' ? 'plain' : 'table'; return render(); }
    if (act === 'tFast') { ui.fast = !ui.fast; try { localStorage.setItem('tb-fast', ui.fast ? 'on' : 'off'); } catch (e) { /* ignore */ } return render(); }
    if (act === 'newmatch') { closeOverlay(); ui.started = false; if (window.TBStory) window.TBStory.doors(); return; }
    if (act === 'runsim') return runSim();
    if (act === 'opencard') return showOverlay('targets');
    if (act === 'chase') { closeOverlay(); return answer(ui.targets.slice()); }
    if (act === 'next' || act === 'again') { closeOverlay(); const r = overResolver; overResolver = null; if (r) r(act); return; }

    const P = ui.prompt;
    if (b.dataset.key && P) return tapTile(b.dataset.key);
    if (!P) return;
    if (P.kind === 'swap') {
      if (act === 'suggest') { const tmp = { c: me().c.slice(), exps: [], persona: {} }; ui.sel = keysFor(pickPass(tmp, 3)); return render(); }
      if (act === 'pass' && ui.sel.length === 3) return answer(ui.sel.map(typeOf));
    } else if (P.kind === 'vote') {
      if (act === 'yes') return answer(true); if (act === 'no') return answer(false);
    } else if (P.kind === 'courtesy') {
      if (act === 'skip') return answer([]); if (act === 'trade') return answer(ui.sel.map(typeOf));
    } else if (P.kind === 'discard' || P.kind === 'discard2' || P.kind === 'selfMahj') {
      if (act === 'hint') { me().av = null; const bd = bestDiscard(); if (bd) { ui.hint = keysFor([bd.t]); ui.sel = ui.hint.slice(); } return render(); }
      if (act === 'discard' && ui.sel.length === 1) return answer({ discard: typeOf(ui.sel[0]) });
      if (act === 'mahj') return answer({ mahj: true });
      if (act === 'keep') { ui.prompt = { kind: 'discard' }; return render(); }
      if (act === 'peek') return answer({ peek: true });
      if (act === 'extra') return answer({ extra: true });
      if (act === 'jswapgo') return answer({ jswap: true });
    } else if (P.kind === 'claimMahj') return answer(act === 'mahj' ? 'mahj' : 'pass');
    else if (P.kind === 'claimSet') return answer(act === 'take' ? 'take' : 'pass');
    else if (P.kind === 'jswap') return answer(act === 'jswap' ? 'swap' : 'pass');
  });
  function selectCopy() { const el = $('#fbCopy'); if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  function tapTile(key) {
    const P = ui.prompt; const t = typeOf(key);
    if (P.kind === 'swap' || P.kind === 'courtesy') {
      if (t === TB.MIMIC) return;
      const i = ui.sel.indexOf(key);
      if (i >= 0) ui.sel.splice(i, 1); else if (ui.sel.length < 3) ui.sel.push(key);
      return render();
    }
    if (P.kind === 'discard' || P.kind === 'discard2' || P.kind === 'selfMahj') {
      if (ui.sel.length === 1 && ui.sel[0] === key) return answer({ discard: t });
      ui.sel = [key]; ui.hint = []; return render();
    }
  }

  // ---------- game flow ----------
  function snap(p) { return { c: p.c.slice(), exps: p.exps.map((e) => Object.assign({}, e)) }; }
  function finish(w, T, from) {
    const res = TB.settle(G, w, T, from); res.snap = snap(G.players[w]);
    addLog(`${name(w)} ${w === 0 ? 'declare' : 'declares'} ${V('mahj')} with ${res.hand.name}`);
    if (w !== 0) bubble(w, V('mahj'));
    return res;
  }
  function discardTile(seat, t) {
    const p = G.players[seat]; p.c[t]--; p.pond.push(t); TB.see(G, t); ui.last = { i: seat, k: p.pond.length - 1 };
  }
  function undoDiscard(seat) { const p = G.players[seat]; p.pond.pop(); ui.last = null; }
  function refreshDanger() { ui.danger = ui.helpers ? TB.dangerTiles(G, 0) : new Set(); }
  function botAbility(seat, when) {
    const p = G.players[seat]; if (ui.mode !== 'tilebound' || p.suit === undefined) return false;
    if (when === 'expose' && p.suit === 0) { const b = TB.burnWall(G); if (b !== null) { addLog(`${name(seat)}’s Cindermole burns the next wall tile (${tName(b)}).`); G.seen[b]++; return true; } }
    if (when === 'turn' && p.suit === 2 && !p.usedAb && TB.best(p).d <= 2 && G.wall.length > 2) {
      p.usedAb = true; p.c[G.wall.pop()]++; G.draws++;
      TB.setAvail(G, p); const d = TB.botDiscard(p, G.r); discardTile(seat, d);
      addLog(`${name(seat)}’s Mossmouse sprouts an extra draw; ${name(seat)} discards ${tName(d)} with it.`); return true;
    }
    return false;
  }

  async function swapRound(dirs, second) {
    for (let i = 0; i < dirs.length; i++) {
      const [dir, label, arrow] = dirs[i]; const to = dir % 4;
      const mine = await ask({ kind: 'swap', step: i + 1, label, arrow, toName: G.players[to].persona.name, second });
      for (const t of mine) me().c[t]--;
      const passes = [mine]; for (let s = 1; s <= 3; s++) passes[s] = TB.botPass(G.players[s], G.r);
      const from = (4 - dir) % 4;
      TB.applyPass(G, passes, dir); ui.received = passes[from].slice();
      addLog(`You passed 3 ${label}; ${name(from)} passed you 3.`); render();
    }
  }

  async function playHand() {
    TB.deal(G);
    ui.received = []; ui.drawn = null; ui.log = []; ui.last = null; ui.peek = null; ui.used = {}; ui.targets = []; ui.expanded = new Set(); ui.danger = new Set();
    for (const p of G.players) p.usedAb = false;
    if (ui.mode === 'tilebound' && ui.starter !== null) { const n = TB.favorSuit(G, 0, ui.starter, 4); if (n) addLog(`${CRITTER_FULL[ui.starter][0]} tucked ${n} ${TB.SUITS[ui.starter]} tiles into your deal.`); }
    addLog(`Hand ${G.handNo + 1}. ${name(G.dealer)} ${G.dealer === 0 ? 'are' : 'is'} East and start${G.dealer === 0 ? '' : 's'} with 14 tiles.`);
    G.turn = -1; render();

    if (ui.helpers) {
      const c = closest(); ui.targets = c.slice(0, 2).map((x) => x.h);
      await ask({ kind: 'targets' });
    }
    await swapRound([[1, 'right', '→'], [2, 'across', '↑'], [3, 'left', '←']], false);
    const yes = await ask({ kind: 'vote' });
    const botsYes = [1, 2, 3].every((i) => TB.best(G.players[i]).d >= 4);
    if (yes && botsYes) { addLog('Everyone agreed to a second round.'); await swapRound([[3, 'left', '←'], [2, 'across', '↑'], [1, 'right', '→']], true); }
    else if (yes) addLog(`${[1, 2, 3].filter((i) => TB.best(G.players[i]).d < 4).map(name).join(' and ')} said no, so no second round.`);
    else addLog('No second round.');
    const give = await ask({ kind: 'courtesy' });
    if (give.length) {
      const q = G.players[2]; const tmp = { c: q.c.slice(), exps: [], persona: {} }; const theirs = pickPass(tmp, give.length);
      for (const t of give) me().c[t]--; for (const t of theirs) q.c[t]--;
      for (const t of give) q.c[t]++; for (const t of theirs) me().c[t]++;
      ui.received = theirs.slice(); addLog(`You and ${name(2)} traded ${theirs.length}.`);
    }

    let seat = G.dealer, needDraw = false;
    for (let guard = 0; guard < 600; guard++) {
      G.turn = seat; refreshDanger(); render();
      const p = G.players[seat];
      if (needDraw) {
        if (!G.wall.length) { addLog('The wall is empty.'); return { wall: true }; }
        const t = G.wall.pop(); p.c[t]++; G.draws++;
        if (seat === 0) { ui.drawn = t; ui.received = []; addLog(`You draw ${tName(t)}.`); }
      }
      let T = TB.isWin(p);
      if (T && seat !== 0) { await wait(500); return finish(seat, T, null); }

      let t, extraPending = false;
      if (seat === 0) {
        // Joker swap offer first, then ability, then discard.
        let a = await ask(T ? { kind: 'selfMahj', T } : { kind: 'discard' });
        while (a.jswap || a.peek || a.extra) {
          if (a.jswap) { const opt = TB.jokerSwapOptions(G, 0)[0]; const c = await ask({ kind: 'jswap', opt }); if (c === 'swap') { TB.applyJokerSwap(G, 0, opt); addLog(`You swapped a real ${tName(opt.t)} for ${name(opt.owner)}’s ${V('mimic')}.`); if (opt.owner !== 0) bubble(opt.owner, 'Hey!'); } }
          if (a.peek) { ui.used[TB.ABILITIES.tide.name] = true; ui.peek = TB.peekWall(G, 3); addLog('Reedling shows you the next three wall tiles.'); }
          if (a.extra) { ui.used[TB.ABILITIES.grove.name] = true; const x = G.wall.pop(); p.c[x]++; G.draws++; ui.drawn = x; addLog(`Mossmouse sprouts an extra draw: ${tName(x)}.`); extraPending = true; }
          T = extraPending ? null : TB.isWin(p);
          a = await ask(T ? { kind: 'selfMahj', T } : { kind: extraPending ? 'discard2' : 'discard' });
        }
        if (a.mahj) return finish(0, T, null);
        t = a.discard;
        ui.peek = null;
        if (extraPending) {
          discardTile(0, t); addLog(`You discard ${tName(t)}.`); render();
          T = TB.isWin(p);
          const a2 = await ask(T ? { kind: 'selfMahj', T } : { kind: 'discard2' });
          if (a2.mahj) return finish(0, T, null);
          t = a2.discard;
        }
      } else {
        await wait(650);
        const js = TB.jokerSwapOptions(G, seat).filter((o) => o.owner !== seat);
        if (js.length && G.r() < (p.persona.name === 'Rosa' ? 1 : 0.7)) { TB.applyJokerSwap(G, seat, js[0]); addLog(`${name(seat)} swaps a real ${tName(js[0].t)} for ${name(js[0].owner)}’s ${V('mimic')}.`); bubble(seat, 'Mine now.'); render(); await wait(400); }
        if (botAbility(seat, 'turn')) { render(); await wait(300); }
        TB.setAvail(G, p);
        t = TB.botDiscard(p, G.r, TB.dangerTiles(G, seat));
      }
      discardTile(seat, t); ui.drawn = null; ui.received = [];
      addLog(`${name(seat)} discard${seat === 0 ? '' : 's'} ${tName(t)}.`); render();

      // Claims: a win beats a set; nearest in turn order first.
      for (let k = 1; k <= 3; k++) {
        const o = (seat + k) % 4, q = G.players[o]; const WT = TB.winWith(q, t); if (!WT) continue;
        if (o === 0) { const c = await ask({ kind: 'claimMahj', t, from: seat, T: WT }); if (c !== 'mahj') continue; } else await wait(400);
        undoDiscard(seat); q.c[t]++; return finish(o, WT, seat);
      }
      let claimed = false;
      for (let k = 1; k <= 3 && !claimed; k++) {
        const o = (seat + k) % 4, q = G.players[o]; const opt = TB.exposeOption(q, t); if (!opt) continue;
        let take;
        if (o === 0) take = (await ask({ kind: 'claimSet', t, from: seat, opt })) === 'take'; else take = TB.botWantsCall(q, opt, G.r);
        if (take) {
          undoDiscard(seat); TB.applyExpose(q, opt); TB.see(G, TB.MIMIC, opt.need); TB.see(G, t, opt.real);
          addLog(`${name(o)} ${o === 0 ? 'take' : 'takes'} the ${tName(t)} and lay${o === 0 ? '' : 's'} down a ${setWord(opt.s)}.`);
          if (o !== 0) bubble(o, seat === 0 ? pick(['Thank you!', 'Mine!', 'I’ll take that.']) : pick(['Mine!', 'Ooh, yes.', 'Thanks, ' + name(seat) + '.']));
          botAbility(o, 'expose');
          if (o === 0 && ui.mode === 'tilebound' && ui.starter === 0) { const b = TB.burnWall(G); if (b !== null) { G.seen[b]++; addLog(`Cindermole’s Hot Hands burns the next wall tile (${tName(b)}).`); } }
          seat = o; needDraw = false; claimed = true; render(); await wait(450);
        }
      }
      if (!claimed) { seat = (seat + 1) % 4; needDraw = true; await wait(120); }
    }
    return { wall: true };
  }

  async function playMatch() {
    G = TB.newMatch(Math.floor(Math.random() * 1e9)); G.hands = 4;
    if (ui.mode === 'tilebound') { G.players[1].suit = 0; G.players[2].suit = 1; G.players[3].suit = 2; }
    for (let h = 0; h < G.hands; h++) {
      G.handNo = h; G.dealer = h % 4;
      const res = await playHand();
      if (res.wall) res.pays = [0, 0, 0, 0];
      if (!res.wall && res.winner !== 0) { const d = TB.best(me()).d; res.mine = d < 99 ? `${d} tile${d === 1 ? '' : 's'} from ${V('mahj').replace('!', '')}` : 'with no hand left that fits your sets'; }
      G.history.push(res); G.turn = -1;
      await overlayWait('handEnd', res);
    }
    const a = await overlayWait('matchEnd');
    if (a === 'again') playMatch();
  }

  G = TB.newMatch(1); TB.deal(G); G.turn = -1; render();
  window.TBUI = {
    start(opts) {
      Object.assign(ui, opts);
      if (ui.mode === 'classic') { ui.coach = false; ui.helpers = opts.helpers !== undefined ? opts.helpers : false; ui.words = 'table'; ui.starter = null; }
      else { ui.words = 'plain'; }
      ui.started = true; playMatch();
    },
    get started() { return ui.started; },
  };
})();
