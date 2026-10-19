// Hexed UI: map, level intro + spread draw, board rendering/animation, input, coach, feedback.
// © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
(function () {
  const HX = window.HX, A = window.HXArt;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const N = 8; const PCT = 100 / N;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 60) : ms));

  // ---------- progress (per-viewer convenience) ----------
  const STORE = 'hexed-proto-v1';
  let prog = { unlocked: 1, stars: [], spells: {}, all: false, coach: true, seen: false };
  try { const raw = localStorage.getItem(STORE); if (raw) prog = Object.assign(prog, JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(prog)); } catch (e) { /* ignore */ } }

  // ---------- state ----------
  let S = null, LV = 0, busy = false, sel = null, idleT = null, targeting = null, freeSwap = false;
  const els = new Map(); // piece id -> element
  let guidedLeft = 0, lastCoach = '', madeTip = {};

  // ---------- board static layers ----------
  const pos = (r, c) => `left:${c * PCT}%;top:${r * PCT}%`;
  function buildStatic() {
    let cells = '', dark = '';
    const hermit = S.def.goal.type === 'item';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!S.mask[r][c]) continue;
      const path = hermit && r >= N - 2;
      cells += `<div class="cell bg ${(r + c) % 2 ? 'alt' : ''} ${path ? 'path' : ''}" style="${pos(r, c)}"></div>`;
      if (S.dark) dark += `<div class="dark" data-d="${r * N + c}" style="${pos(r, c)}"></div>`;
    }
    $('#lCells').innerHTML = cells;
    $('#lDark').innerHTML = dark;
    $('#lPieces').innerHTML = ''; els.clear();
    $('#lFx').innerHTML = '';
    $('#lPieces').style.cssText = 'overflow:hidden;border-radius:16px';
  }
  function place(el, r, c) { el.style.transform = `translate(${c * 100}%, ${r * 100}%)`; }
  function pieceEl(p) {
    const el = document.createElement('div'); el.className = 'piece';
    el.dataset.id = p.id; el.dataset.k = p.c + ':' + (p.sp || '');
    el.innerHTML = `<div class="in">${A.piece(p.c, p.sp)}</div>`;
    return el;
  }
  function renderOverlays(f) {
    $('#lVeil').innerHTML = f.veil.map(([r, c]) => `<div class="veil" style="${pos(r, c)}"></div>`).join('');
    let b = '';
    for (const x of f.blk) { if (x.t === 'vine') b += `<div class="blk" style="${pos(x.r, x.c)}">${A.vine()}</div>`; if (x.t === 'stone') b += `<div class="blk" style="${pos(x.r, x.c)}">${A.stone(x.hp)}</div>`; }
    if (f.beast && f.beast.hp > 0) b += `<div class="beast" id="beast" style="${pos(f.beast.r, f.beast.c)}">${A.beast()}<div class="hp"><i style="width:${(100 * f.beast.hp) / f.beast.max}%"></i></div></div>`;
    $('#lBlk').innerHTML = b;
    $('#lLock').innerHTML = f.lock.map((x) => `<div class="lock" style="${pos(x.r, x.c)}">${A.ribbon()}</div>`).join('');
    if (f.lit) document.querySelectorAll('#lDark .dark').forEach((d) => { const k = +d.dataset.d; d.classList.toggle('lit', f.lit[Math.floor(k / N)][k % N]); });
  }
  // Render one frame; returns how long to wait.
  async function renderFrame(f, prevKind) {
    const present = new Set();
    const spawning = [];
    for (const p of f.pieces) {
      present.add(p.id);
      let el = els.get(p.id);
      if (!el) {
        el = pieceEl(p); els.set(p.id, el); $('#lPieces').appendChild(el);
        if (f.spawn && f.spawn[p.id]) { el.style.transition = 'none'; place(el, f.spawn[p.id][0], f.spawn[p.id][1]); spawning.push([el, p]); }
        else { place(el, p.r, p.col); if (f.kind !== 'init') el.classList.add('born'); }
        continue;
      }
      const k = p.c + ':' + (p.sp || '');
      if (el.dataset.k !== k) { el.dataset.k = k; el.querySelector('.in').innerHTML = A.piece(p.c, p.sp); el.classList.remove('born'); void el.offsetWidth; el.classList.add('born'); }
      place(el, p.r, p.col);
    }
    if (spawning.length) { void $('#lPieces').offsetWidth; for (const [el, p] of spawning) { el.style.transition = ''; place(el, p.r, p.col); } }
    for (const [id, el] of els) if (!present.has(id)) { els.delete(id); el.classList.add('gone'); setTimeout(() => el.remove(), 260); }
    renderOverlays(f);
    if (f.fx) for (const x of f.fx) fx(x);
    if (f.spell) spellText(f.spell);
    if (f.kind === 'clear' && f.cascade >= 2) cheer(f.cascade);
    $('#score b').textContent = f.score.toLocaleString();
    const t = { init: 0, swap: 170, swapback: 190, clear: 260, fall: 250, vine: 320, shuffle: 420, convert: 380, rest: 0 }[f.kind] || 0;
    if (f.kind === 'shuffle') coachSay('No moves left, so the cards shuffled themselves.');
    return t;
  }
  function fx(x) {
    const L = $('#lFx'); const d = document.createElement('div');
    if (x.t === 'row') { d.className = 'beam'; d.style.cssText = `left:0;width:100%;top:${x.r * PCT}%;height:${PCT}%`; }
    else if (x.t === 'col') { d.className = 'beam v'; d.style.cssText = `top:0;height:100%;left:${x.c * PCT}%;width:${PCT}%`; }
    else if (x.t === 'blast') { const s = (2 * x.rad + 1) * PCT; d.className = 'ring'; d.style.cssText = `left:${(x.c + 0.5) * PCT - s / 2}%;top:${(x.r + 0.5) * PCT - s / 2}%;width:${s}%;height:${s}%`; }
    else if (x.t === 'color' || x.t === 'all') { d.className = 'ring'; d.style.cssText = 'left:0;top:0;width:100%;height:100%'; }
    else if (x.t === 'beast') { const b = $('#beast'); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); } return; }
    else if (x.t === 'item') { d.className = 'spark'; d.style.cssText = pos(x.r, x.c); d.textContent = '+1'; }
    else return;
    L.appendChild(d); setTimeout(() => d.remove(), 950);
  }
  function spellText(t) { const d = document.createElement('div'); d.className = 'spellname'; d.textContent = t; $('#board').appendChild(d); setTimeout(() => d.remove(), 1350); }
  function cheer(n) { spellText(n >= 4 ? 'Enchanted!' : n === 3 ? 'Charmed!' : 'Blessed!'); }

  async function play(frames) {
    for (const f of frames) { const t = await renderFrame(f); if (t) await wait(t); }
  }

  // ---------- HUD ----------
  function goalIcon(def) {
    const g = def.goal;
    if (g.type === 'score') return A.starIcon();
    if (g.type === 'make') return A.piece(1, 'candleH');
    if (g.type === 'veil') return A.veilIcon();
    if (g.type === 'vine') return A.vine();
    if (g.type === 'stone') return A.stone(2);
    if (g.type === 'collect') return A.piece(g.color);
    if (g.type === 'lock') return A.ribbon();
    if (g.type === 'beast') return A.beast();
    if (g.type === 'item') return A.lantern();
    return '';
  }
  function goalText(def) {
    const g = def.goal;
    return { score: `Score ${g.n && g.n.toLocaleString()} points`, make: `Make ${g.n} Candles`, veil: 'Lift every veil', vine: 'Cut back every vine', stone: 'Break every stone', collect: `Collect ${g.n} ${g.color !== undefined ? A.PIECE_NAMES[g.color].toLowerCase() + (g.color === 2 ? 'ves' : 's') : ''}`.replace('leafves', 'leaves'), lock: 'Free every bound pair', beast: 'Tame the beast', item: `Bring ${g.n} lanterns down` }[g.type];
  }
  function hud() {
    const p = HX.progress(S);
    $('#moves b').textContent = S.moves;
    $('#moves').classList.toggle('low', S.moves <= 3);
    let big, small;
    if (S.def.goal.type === 'vine') { big = `${p.left} left`; small = 'vines to cut'; }
    else if (S.def.goal.type === 'beast') { big = `${p.left} left`; small = 'beast’s strength'; }
    else { big = `${Math.min(p.have, p.need).toLocaleString()} / ${p.need.toLocaleString()}`; small = goalText(S.def); }
    const pct = S.def.goal.type === 'vine' ? Math.max(0, 100 - (100 * p.left) / Math.max(1, S.totals.vine)) : (100 * Math.min(p.have, p.need)) / Math.max(1, p.need);
    $('#goal').innerHTML = `${goalIcon(S.def)}<div class="gt"><b>${big}</b><span>${esc(small)}</span><div class="bar"><i style="width:${pct}%"></i></div></div>`;
    $('#goal').classList.toggle('done', p.have >= p.need);
    $('#score b').textContent = S.score.toLocaleString();
    renderSpread();
  }
  function renderSpread() {
    const sp = S.def.spread; const el = $('#spread');
    if (!sp) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    const card = (pos, k) => {
      const C = HX.CARDS[k]; const isPow = pos === 'present' && C.power;
      const used = isPow && S.powerUsed; const met = pos === 'future' && S.over && S.bonusMet;
      const label = { past: 'Past', present: 'Present', future: 'Future' }[pos];
      const tag = isPow && !used ? `<span class="use">${targeting || freeSwap ? 'Cancel' : 'Use power'}</span>` : '';
      return `<${isPow && !used ? 'button type="button" data-act="power"' : 'div'} class="sc ${isPow ? 'power' : ''} ${used ? 'used' : ''} ${met ? 'met' : ''}"><span class="pos">${label}</span><b>${esc(C.name)}</b><small>${esc(C.does)}</small>${tag}</${isPow && !used ? 'button' : 'div'}>`;
    };
    el.innerHTML = card('past', sp.past) + card('present', sp.present) + card('future', sp.future);
  }

  // ---------- coach (Sable) ----------
  const INTRO = [
    'I’m Sable, your familiar. Swipe a piece into its neighbor to line up 3 of a kind. Try the glowing pair.',
    'Line up 4 in a row and you make a Candle. Match a Candle and it burns its whole row or column. Make 4 Candles.',
    'The purple lace is a veil. Make a match on top of a veil to lift it. Lift them all.',
    'Vines creep over a piece every other turn you don’t cut one. Match right next to a vine to cut it back.',
    'Stone blocks take two hits. Match beside them, or catch them in a Candle’s flame.',
    'Your first spread. The Past card already changed the board. Tap the Present card to use its power once. The Future card is a bonus goal.',
    'Ribbons tie two pieces together. Match either piece of a pair and both go free.',
    'The Chariot drives left. Pieces slide left and new ones arrive from the right.',
    'The beast is all bluster. Matches beside it calm it a little. Spells that reach it calm it more.',
    'It’s dark in here. Matches light the board for a few turns, and lanterns glow on their own. Bring 3 lanterns down to the golden path.',
  ];
  function coachSay(html) {
    lastCoach = html;
    $('#coach').innerHTML = `<span class="cat">${A.cat()}</span><p><b class="who">Sable:</b> ${html}</p>`;
  }
  const DIRW = (a, b) => (b[0] > a[0] ? 'down' : b[0] < a[0] ? 'up' : b[1] > a[1] ? 'right' : 'left');
  function pieceName(p) { if (!p) return 'piece'; if (p.c === 9) return 'Lantern'; if (p.sp === 'orb') return 'Crystal Ball'; if (p.sp === 'cauldron') return 'Cauldron'; if (p.sp) return 'Candle'; return A.PIECE_NAMES[p.c]; }
  function showHint(say) {
    clearHint();
    const h = HX.hint(S); if (!h) return;
    for (const [r, c] of [h.a, h.b]) { const p = S.grid[r][c]; const el = p && els.get(p.id); if (el) el.classList.add('hint'); }
    if (say) {
      const p = S.grid[h.a[0]][h.a[1]];
      coachSay(`Swipe the glowing <b>${esc(pieceName(p))}</b> ${DIRW(h.a, h.b)}.${h.v >= 10 ? ' That one makes a spell piece.' : ''}`);
    }
  }
  function clearHint() { document.querySelectorAll('.piece.hint').forEach((e) => e.classList.remove('hint')); }
  function armIdle() {
    clearTimeout(idleT);
    if (!prog.coach || !S || S.over) return;
    idleT = setTimeout(() => { if (!busy && !targeting) showHint(false); }, 7000);
  }
  function afterMoveCoach(res) {
    const p = HX.progress(S);
    if (guidedLeft > 0 && !S.over) { guidedLeft--; showHint(true); return; }
    const made = { candle: S.stats.candle, cauldron: S.stats.cauldron, orb: S.stats.orb };
    for (const k of ['orb', 'cauldron', 'candle']) {
      if (made[k] > 0 && !madeTip[k]) {
        madeTip[k] = true;
        coachSay({ candle: 'That’s a <b>Candle</b>! Match it, or swap it into another spell piece, and it burns a whole line.', cauldron: 'A <b>Cauldron</b>! Match it and it boils over the 3×3 around it.', orb: 'A <b>Crystal Ball</b>! Swap it with any piece to clear every piece of that kind.' }[k]);
        return;
      }
    }
    if (res && res.combo && res.combo !== 'on') { coachSay(`You cast <b>${esc(HX.SPELLS[res.combo].name)}</b>. It’s in your Grimoire now.`); return; }
    if (S.moves <= 3 && p.have < p.need) { coachSay(`${S.moves} move${S.moves === 1 ? '' : 's'} left. Look for spell pieces, they reach farther.`); return; }
    const left = S.def.goal.type === 'vine' || S.def.goal.type === 'beast' ? p.left : p.need - p.have;
    if (left > 0 && Math.random() < 0.35) coachSay(`${left.toLocaleString()} to go. ${pickTip()}`);
  }
  const TIPS = ['Matches near the bottom shake up more of the board.', 'Two spell pieces swapped together cast a bigger spell.', 'A line of 5 makes a Crystal Ball.', 'An L or T shape makes a Cauldron.', 'Tap Hint in the menu if you get stuck.'];
  const pickTip = () => TIPS[Math.floor(Math.random() * TIPS.length)];

  // ---------- input ----------
  const board = $('#board');
  let drag = null;
  function cellAt(ev) {
    const r = board.getBoundingClientRect();
    const c = Math.floor(((ev.clientX - r.left) / r.width) * N), rr = Math.floor(((ev.clientY - r.top) / r.height) * N);
    if (c < 0 || c >= N || rr < 0 || rr >= N) return null; return [rr, c];
  }
  board.addEventListener('pointerdown', (ev) => {
    if (busy || !S || S.over) return;
    const cell = cellAt(ev); if (!cell) return;
    drag = { cell, x: ev.clientX, y: ev.clientY, done: false };
    try { board.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  });
  board.addEventListener('pointermove', (ev) => {
    if (!drag || drag.done || targeting) return;
    const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; const size = board.getBoundingClientRect().width / N;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < size * 0.35) return;
    drag.done = true;
    const [r, c] = drag.cell; const to = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    setSel(null); trySwap(drag.cell, to);
  });
  board.addEventListener('pointerup', (ev) => {
    if (!drag) return; const d = drag; drag = null;
    if (d.done || busy) return;
    const cell = d.cell;
    if (targeting) return usePowerAt(cell);
    if (sel && Math.abs(sel[0] - cell[0]) + Math.abs(sel[1] - cell[1]) === 1) { const a = sel; setSel(null); return trySwap(a, cell); }
    if (sel && sel[0] === cell[0] && sel[1] === cell[1]) return setSel(null);
    setSel(S.grid[cell[0]][cell[1]] ? cell : null);
  });
  board.addEventListener('pointercancel', () => { drag = null; });
  function setSel(cell) {
    document.querySelectorAll('.piece.sel').forEach((e) => e.classList.remove('sel'));
    sel = cell;
    if (cell) { const p = S.grid[cell[0]][cell[1]]; const el = p && els.get(p.id); if (el) el.classList.add('sel'); }
  }
  async function trySwap(a, b) {
    if (busy || S.over) return;
    if (!HX.canSwap(S, a, b)) { if (S.lock[a[0]] && (S.lock[a[0]][a[1]] || (S.lock[b[0]] && S.lock[b[0]][b[1]]))) coachSay('Bound pieces can’t move. Match next to them, or line them up from the side.'); board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake'); return; }
    busy = true; clearTimeout(idleT); clearHint();
    const free = freeSwap;
    const res = HX.move(S, a, b, { free });
    if (free && res.ok) { freeSwap = false; S.powerUsed = true; board.classList.remove('targeting'); }
    await play(res.frames);
    busy = false;
    if (!res.ok) { coachSay(guidedLeft > 0 ? 'That swap doesn’t make a line of 3. Try the glowing pair.' : 'No line of 3 there, so the pieces swapped back.'); if (guidedLeft > 0) showHint(true); armIdle(); return; }
    saveSpells(); hud(); afterMoveCoach(res);
    if (S.over) return finish();
    armIdle();
  }
  function saveSpells() { Object.assign(prog.spells, S.spells); save(); }

  // ---------- powers ----------
  async function powerTap() {
    if (busy || !S || S.over || S.powerUsed) return;
    const k = S.power;
    if (targeting || freeSwap) { targeting = null; freeSwap = false; board.classList.remove('targeting'); coachSay('Power put away. Tap the card again when you want it.'); return hud(); }
    if (k === 'conjure' || k === 'smite') { targeting = k; board.classList.add('targeting'); coachSay(k === 'conjure' ? 'Tap any piece to turn it into a <b>Candle</b>.' : 'Tap a spot. <b>Justice</b> blasts the 3×3 around it.'); return hud(); }
    if (k === 'wish') { freeSwap = true; board.classList.add('targeting'); coachSay('<b>The Star</b> grants a wish: swap any two neighbors, even without a match.'); return hud(); }
    if (k === 'sunlight') { busy = true; const res = HX.usePower(S); await play(res.frames); busy = false; coachSay('<b>The Sun</b> lights the whole board for 3 turns. Look for the lanterns.'); hud(); armIdle(); }
  }
  async function usePowerAt(cell) {
    const k = targeting; busy = true;
    const res = HX.usePower(S, cell);
    if (!res.ok) { busy = false; coachSay(k === 'conjure' ? 'Pick a regular piece, not a blocker or a bound piece.' : 'Pick a spot on the board.'); return; }
    targeting = null; board.classList.remove('targeting');
    await play(res.frames); busy = false; saveSpells(); hud();
    coachSay(k === 'conjure' ? 'There’s your Candle. Match it to burn its row.' : 'Justice is done. Keep going.');
    if (S.over) return finish();
    armIdle();
  }

  // ---------- sheets ----------
  function sheet(html, opts) {
    $('#sheet').innerHTML = html ? `<div class="veil-bg" data-close="${opts && opts.noClose ? '' : '1'}"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>` : '';
    const f = $('#sheet [data-focus]'); if (f) f.focus({ preventScroll: true });
  }
  const closeSheet = () => sheet('');

  function levelCard(i, w) { const d = HX.LEVELS[i]; return A.tcard(d.num, d.card, A.LEVEL_EMB[i], w || ''); }

  function openLevel(i) {
    LV = i; const d = HX.LEVELS[i];
    const goal = `<div class="goalline">${goalIcon(d)}<span>${esc(goalText(d))} in ${d.moves} moves</span></div>`;
    let html = `<div class="intro-card">${levelCard(i)}<div class="txt"><span class="eyebrow">Card ${d.num} of the Fool’s Journey</span><h2>${esc(d.card)}</h2><span class="theme">${esc(d.theme)}</span></div></div>
      <div class="twist">${esc(d.twist)}</div>${goal}`;
    if (d.spread) html += `<p class="muted">Before you play, draw three cards. The Past changes the board, the Present gives you a power, and the Future sets a bonus goal.</p><div class="acts"><button class="btn ghost" data-act="close" type="button">Not yet</button><button class="btn primary" data-act="draw" type="button" data-focus="1">Draw your spread</button></div>`;
    else html += `<div class="acts"><button class="btn ghost" data-act="close" type="button">Not yet</button><button class="btn primary" data-act="begin" type="button" data-focus="1">Begin</button></div>`;
    sheet(html);
  }
  async function drawSpread() {
    const d = HX.LEVELS[LV]; const sp = d.spread;
    const slot = (pos, k) => { const C = HX.CARDS[k]; return `<div class="slot"><span class="pos">${pos}</span><div class="flip" data-flip><div class="inner"><div class="face">${A.tback()}</div><div class="face front">${A.tcard(C.num, C.name, A.CARD_EMB[k])}</div></div></div><span class="does"><b>${esc(C.meaning)}.</b> ${esc(C.does)}</span></div>`; };
    sheet(`<span class="eyebrow">${esc(d.card)} · your spread</span><h2>Past, Present, Future</h2>
      <div class="drawn">${slot('Past', sp.past)}${slot('Present', sp.present)}${slot('Future', sp.future)}</div>
      <p class="muted" style="font-size:13px">Spreads are hand-picked for now. Random draws and reversed cards come later.</p>
      <div class="acts"><button class="btn primary" data-act="begin" type="button" data-focus="1" id="bBegin" disabled>Begin</button></div>`);
    const flips = document.querySelectorAll('[data-flip]');
    for (const f of flips) { await wait(450); f.classList.add('on'); }
    await wait(500); const b = $('#bBegin'); if (b) { b.disabled = false; b.focus({ preventScroll: true }); }
  }

  async function startLevel(i) {
    closeSheet(); hideStory();
    LV = i; const d = HX.LEVELS[i];
    S = HX.newLevel(d, (Date.now() ^ (i * 977)) >>> 0);
    targeting = null; freeSwap = false; sel = null; madeTip = {}; board.classList.remove('targeting');
    guidedLeft = prog.coach && i <= 1 ? 3 : 0;
    $('#lvTitle').textContent = d.card; $('#lvSub').textContent = `Card ${d.num} · ${d.theme}`;
    buildStatic();
    await renderFrame(HX.snap(S, 'init'));
    hud();
    coachSay(INTRO[i]);
    if (guidedLeft > 0) { guidedLeft--; setTimeout(() => showHint(false), 900); }
    armIdle();
  }

  function finish() {
    clearTimeout(idleT); hud();
    const d = HX.LEVELS[LV]; const st = HX.stars(S);
    if (S.won) {
      prog.stars[LV] = Math.max(prog.stars[LV] || 0, st); prog.unlocked = Math.max(prog.unlocked, LV + 2); save();
      const last = LV === HX.LEVELS.length - 1;
      const bonus = d.spread ? `<p>${S.bonusMet ? '✓' : '✗'} <b>Future, ${esc(HX.CARDS[d.spread.future].name)}:</b> ${S.bonusMet ? 'fulfilled, +1,500.' : 'not this time.'}</p>` : '';
      coachSay(last ? 'You walked the whole first half of the Journey. I’m impressed, and I’m a cat.' : 'Well cast. On to the next card.');
      sheet(`<span class="eyebrow">Card ${d.num} · complete</span><h2>${esc(d.card)}, fulfilled</h2>
        <div class="endstars"><span class="${st >= 1 ? 'on' : ''}">★</span><span class="${st >= 2 ? 'on' : ''}">★</span><span class="${st >= 3 ? 'on' : ''}">★</span></div>
        <p><b>${S.score.toLocaleString()}</b> points, with ${S.moves} move${S.moves === 1 ? '' : 's'} to spare (+150 each).</p>${bonus}
        ${last ? '<p>That’s the prototype’s ten cards. The Journey continues at X, the Wheel of Fortune, in a later build.</p>' : ''}
        <div class="acts"><button class="btn" data-act="map" type="button">Journey map</button>${last ? '<button class="btn primary" data-act="feedback" type="button" data-focus="1">Tell us what you thought</button>' : `<button class="btn primary" data-act="next" type="button" data-focus="1">Next card: ${esc(HX.LEVELS[LV + 1].card)}</button>`}</div>`, { noClose: true });
    } else {
      const p = HX.progress(S);
      coachSay('The cards weren’t with you that time. Every reading is different, so try again.');
      const how = S.def.goal.type === 'vine' ? `${p.left} vines were still growing.` : S.def.goal.type === 'beast' ? `The beast had ${p.left} strength left.` : `You got ${Math.min(p.have, p.need).toLocaleString()} of ${p.need.toLocaleString()}.`;
      sheet(`<span class="eyebrow">Out of moves</span><h2>Not this reading</h2><p>${esc(how)}</p>
        <div class="acts"><button class="btn" data-act="map" type="button">Journey map</button><button class="btn primary" data-act="retry" type="button" data-focus="1">Try again</button></div>`, { noClose: true });
    }
  }

  // ---------- map ----------
  function showMap() {
    clearTimeout(idleT);
    const s = $('#story'); s.hidden = false;
    const tiles = HX.LEVELS.map((d, i) => {
      const open = prog.all || i < prog.unlocked; const st = prog.stars[i] || 0; const next = open && !st && (i === prog.unlocked - 1);
      return `<button class="cardtile ${open ? '' : 'locked'} ${next ? 'next' : ''}" type="button" data-lv="${i}" ${open ? '' : 'aria-disabled="true"'}>${next ? '<span class="tag">Next</span>' : ''}${levelCard(i)}<span class="ti"><b>${d.num}. ${esc(d.card)}</b><small>${esc(d.theme)}</small><span class="st">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span></span></button>`;
    }).join('');
    s.innerHTML = `<div class="stars-bg"></div><div class="app" style="position:relative"><div class="map-head"><div><span class="eyebrow">Hexed · prototype</span><h2>The Fool’s Journey</h2></div><button class="btn icon ghost" data-act="menu" type="button" aria-label="Menu">☰</button></div>
      <p class="muted" style="margin:0">Each level is a card of the Major Arcana, 0 to IX. From V on, you draw a three-card spread before you play.</p>
      <div class="journey">${tiles}</div>
      <div class="map-acts"><button class="btn" data-act="grimoire" type="button">Grimoire</button><button class="btn" data-act="how" type="button">How to play</button><button class="btn" data-act="feedback" type="button">Give feedback</button></div>
      <p class="foot">© 2026 F Lane d/b/a One Fifty Labs. All rights reserved. Prototype.</p></div>`;
    s.scrollTop = 0;
  }
  function hideStory() { const s = $('#story'); s.hidden = true; s.innerHTML = ''; }

  // ---------- intro ----------
  const SCENES = [
    () => `<span class="eyebrow rise">A tarot match-three · prototype</span><h1 class="title rise d1">Hexed</h1><p class="lead rise d2">Light the candles, read the cards, and brew your way through the Fool’s Journey.</p>`,
    () => `<span class="eyebrow rise">Every level is a card</span><div class="fan rise d1">${levelCard(0)}${levelCard(2)}${levelCard(6)}${levelCard(9)}</div><p class="lead rise d2">Walk the Major Arcana from the Fool to the Hermit.</p><p class="copy rise d3">Each card changes the board in a way that fits its meaning. The High Priestess hides things. The Empress grows vines. The Hermit puts out the lights.</p>`,
    () => `<span class="eyebrow rise">Match ingredients, cast spells</span><div class="legend rise d1">${[0, 1, 2, 3, 4, 5].map((c) => `<div>${A.piece(c)}<span>${A.PIECE_NAMES[c]}</span></div>`).join('')}</div><p class="copy rise d2">Line up 3 of a kind. Lines of 4 make Candles, L and T shapes make Cauldrons, and 5 in a row makes a Crystal Ball. Swap two spell pieces together for something bigger.</p>`,
    () => `<span class="eyebrow rise">Then the cards answer</span><div class="fan three rise d1">${A.tcard('XIX', 'The Sun', 'sun')}${A.tcard('XVI', 'The Tower', 'tower')}${A.tcard('XVII', 'The Star', 'star')}</div><p class="lead rise d2">Past, Present, Future.</p><p class="copy rise d3">From card V on, you draw a spread before each level. The Past bends the board, the Present grants a power, and the Future sets a bonus goal.</p>`,
  ];
  let sceneI = 0;
  function showIntro(i) {
    sceneI = i || 0; const s = $('#story'); s.hidden = false;
    const last = sceneI === SCENES.length - 1;
    s.innerHTML = `<div class="stars-bg"></div><div class="story-in">${SCENES[sceneI]()}
      <div class="dots">${SCENES.map((_, k) => `<span class="${k === sceneI ? 'on' : ''}"></span>`).join('')}</div>
      <div style="display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap"><button class="skip" data-act="skipintro" type="button">Skip</button><button class="btn primary" data-act="${last ? 'skipintro' : 'scene'}" type="button" data-s="next">${last ? 'Begin the Journey' : 'Next'}</button></div></div>`;
  }

  // ---------- menu, how, grimoire, feedback ----------
  function menuHTML() {
    const on = (b) => (b ? 'On' : 'Off');
    const inGame = $('#story').hidden && S && !S.over;
    return `<h2>Menu</h2><div class="menu">
      ${inGame ? '<button class="btn" data-act="hint" type="button">Show me a move <span>›</span></button>' : ''}
      <button class="btn" data-act="how" type="button">How to play <span>›</span></button>
      <button class="btn" data-act="grimoire" type="button">Grimoire (spells found) <span>›</span></button>
      <button class="btn" data-act="tCoach" type="button" aria-pressed="${prog.coach}">Sable coaches and hints <span>${on(prog.coach)}</span></button>
      <button class="btn" data-act="tAll" type="button" aria-pressed="${prog.all}">Unlock all cards (for testers) <span>${on(prog.all)}</span></button>
      <button class="btn" data-act="intro" type="button">Replay the intro <span>›</span></button>
      <button class="btn" data-act="feedback" type="button">Give feedback <span>›</span></button>
      ${inGame ? '<button class="btn" data-act="map" type="button">Leave this level <span>›</span></button>' : ''}
      <button class="btn" data-act="resetAsk" type="button">Reset my progress <span>›</span></button>
      <div id="resetBox"></div>
    </div><div class="acts"><button class="btn primary" data-act="close" type="button">Close</button></div>`;
  }
  function howHTML() {
    const row = (svg, t, d) => `<div class="spell"><span>${svg}</span><span><b>${t}</b><small>${d}</small></span></div>`;
    return `<h2>How to play</h2>
      <ol><li>Swipe a piece into a neighbor, or tap one and then the other. The swap has to line up 3 or more of a kind.</li>
      <li>Reach the card’s goal before you run out of moves. Leftover moves are worth 150 points each.</li>
      <li>Bigger matches leave a spell piece behind. Match it to cast it.</li></ol>
      <div class="spells">${row(A.piece(1, 'candleH'), 'Candle', 'Match 4 in a line. Burns its row or column.')}${row(A.piece(3, 'cauldron'), 'Cauldron', 'Match in an L or T. Boils over the 3×3 around it.')}${row(A.piece(0, 'orb'), 'Crystal Ball', 'Match 5 in a line. Swap it with any piece to clear all of that kind.')}</div>
      <p>Swap two spell pieces together to cast a combo. Check the Grimoire to see which ones you’ve found.</p>
      <p><b>Spreads (cards V to IX):</b> the Past card changes the board, the Present card is a one-time power you tap to use, and the Future card is a bonus goal worth 1,500.</p>
      <div class="acts"><button class="btn primary" data-act="close" type="button">Got it</button></div>`;
  }
  function grimoireHTML() {
    const icon = { candle: A.piece(1, 'candleV'), cauldron: A.piece(2, 'cauldron'), orb: A.piece(0, 'orb'), cc: A.piece(1, 'candleH'), ck: A.piece(4, 'cauldron'), kk: A.piece(5, 'cauldron'), oc: A.piece(3, 'orb'), ok: A.piece(2, 'orb'), oo: A.piece(5, 'orb') };
    const n = Object.keys(HX.SPELLS).filter((k) => prog.spells[k]).length;
    return `<span class="eyebrow">${n} of ${Object.keys(HX.SPELLS).length} found</span><h2>Grimoire</h2><div class="spells">${Object.entries(HX.SPELLS).map(([k, s]) => {
      const got = prog.spells[k];
      return `<div class="spell ${got ? '' : 'unknown'}"><span>${icon[k]}</span><span><b>${got ? esc(s.name) : 'Unknown spell'}</b><small>${esc(s.how)}</small></span></div>`;
    }).join('')}</div><div class="acts"><button class="btn primary" data-act="close" type="button">Close</button></div>`;
  }
  const FB = { q: {}, text: '', nm: '', saved: null };
  const FQ = [
    { id: 'm3', q: 'How often do you play Candy Crush-style games?', opts: ['Daily', 'Sometimes', 'Rarely', 'Never'] },
    { id: 'witchy', q: 'Tarot and witchy stuff is…', opts: ['Very me', 'A bit me', 'Neutral', 'Not my thing'] },
    { id: 'spread', q: 'The three-card spread before levels V to IX…', opts: ['Loved it', 'Fine', 'Confusing', 'Didn’t reach it'] },
    { id: 'fun', q: 'How fun was it, 1 to 5?', opts: ['1', '2', '3', '4', '5'] },
    { id: 'fav', q: 'Favorite card so far?', opts: HX.LEVELS.map((d) => d.card.replace('The ', '')) },
    { id: 'play', q: 'Would you play this?', opts: ['Yes', 'Maybe', 'No'] },
  ];
  function feedbackHTML() {
    const qs = FQ.map((f) => `<div class="field"><label>${esc(f.q)}</label><div class="choices">${f.opts.map((o) => `<button class="btn" type="button" data-fq="${f.id}" data-fv="${esc(o)}" aria-pressed="${FB.q[f.id] === o}">${esc(o)}</button>`).join('')}</div></div>`).join('');
    return `<h2>What did you think?</h2><p class="muted">Six quick taps and anything else you want to say. Your answers go to F.</p>${qs}
      <div class="field"><label for="fbText">What was confusing, or what would you change?</label><textarea id="fbText" rows="3">${esc(FB.text)}</textarea></div>
      <div class="field"><label for="fbName">Your name (optional)</label><input id="fbName" type="text" value="${esc(FB.nm)}"></div>
      ${FB.saved === true ? '<p style="color:var(--moss);font-weight:700">Saved. Thank you!</p>' : FB.saved === 'copy' ? `<p class="muted">This device couldn’t save it, so copy your answers and text them to F:</p><div class="copybox" id="fbCopy">${esc(feedbackText())}</div>` : ''}
      <div class="acts">${FB.saved === 'copy' ? '<button class="btn" data-act="fbcopy" type="button">Copy answers</button>' : ''}<button class="btn" data-act="close" type="button">Close</button>${FB.saved !== true ? '<button class="btn primary" data-act="fbsend" type="button">Send</button>' : ''}</div>`;
  }
  function feedbackText() {
    const lines = FQ.map((f) => `${f.q} ${FB.q[f.id] || '–'}`);
    lines.push(`Notes: ${FB.text || '–'}`); lines.push(`From: ${FB.nm || 'anonymous'} · stars ${HX.LEVELS.map((_, i) => prog.stars[i] || 0).join(',')}`);
    return 'Hexed feedback\n' + lines.join('\n');
  }
  async function sendFeedback() {
    FB.text = $('#fbText').value; FB.nm = $('#fbName').value;
    const body = { answers: Object.assign({}, FB.q), notes: FB.text, name: FB.nm, stars: HX.LEVELS.map((_, i) => prog.stars[i] || 0), spells: Object.keys(prog.spells), at: new Date().toISOString() };
    try {
      const db = window.claude && window.claude.use ? await window.claude.use('db') : null;
      if (!db) throw new Error('no db');
      await db.collection('feedback').add(body);
      FB.saved = true;
    } catch (e) { FB.saved = 'copy'; }
    sheet(feedbackHTML());
  }
  function selectCopy() { const el = $('#fbCopy'); if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  // ---------- clicks ----------
  document.addEventListener('click', (ev) => {
    const bg = ev.target.classList && ev.target.classList.contains('veil-bg') ? ev.target : null;
    if (bg) { if (bg.dataset.close === '1') closeSheet(); return; }
    const b = ev.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (b.id === 'bMenu' || act === 'menu') return sheet(menuHTML());
    if (b.id === 'bMap') { if (S && !S.over && S.used > 0) return sheet(`<h2>Leave this card?</h2><p>Your moves on ${esc(S.def.card)} won’t be saved.</p><div class="acts"><button class="btn" data-act="close" type="button">Keep playing</button><button class="btn primary" data-act="map" type="button">Leave</button></div>`); return showMap(); }
    if (b.dataset.lv !== undefined) { const i = +b.dataset.lv; if (!(prog.all || i < prog.unlocked)) return; return openLevel(i); }
    if (b.dataset.fq) { FB.q[b.dataset.fq] = b.dataset.fv; FB.text = ($('#fbText') || {}).value || FB.text; FB.nm = ($('#fbName') || {}).value || FB.nm; const sc = $('.sheet').scrollTop; sheet(feedbackHTML()); $('.sheet').scrollTop = sc; return; }
    switch (act) {
      case 'close': return closeSheet();
      case 'scene': return showIntro(sceneI + 1);
      case 'skipintro': prog.seen = true; save(); return showMap();
      case 'draw': return drawSpread();
      case 'begin': return startLevel(LV);
      case 'retry': return startLevel(LV);
      case 'next': return openLevel(LV + 1);
      case 'map': closeSheet(); return showMap();
      case 'power': return powerTap();
      case 'how': return sheet(howHTML());
      case 'grimoire': return sheet(grimoireHTML());
      case 'feedback': FB.saved = FB.saved === true ? true : null; return sheet(feedbackHTML());
      case 'fbsend': return sendFeedback();
      case 'fbcopy': { const t = feedbackText(); try { navigator.clipboard.writeText(t).catch(selectCopy); } catch (e) { selectCopy(); } return; }
      case 'intro': closeSheet(); return showIntro(0);
      case 'hint': closeSheet(); return showHint(true);
      case 'tCoach': prog.coach = !prog.coach; save(); if (!prog.coach) clearHint(); return sheet(menuHTML());
      case 'tAll': prog.all = !prog.all; save(); sheet(menuHTML()); if (!$('#story').hidden) showMap(); return;
      case 'resetAsk': $('#resetBox').innerHTML = '<div class="confirm"><span>This clears your stars, unlocked cards and Grimoire on this device.</span><div class="acts"><button class="btn sm" data-act="resetNo" type="button">Keep them</button><button class="btn sm primary" data-act="resetYes" type="button">Reset</button></div></div>'; return;
      case 'resetNo': $('#resetBox').innerHTML = ''; return;
      case 'resetYes': prog = { unlocked: 1, stars: [], spells: {}, all: false, coach: true, seen: true }; save(); closeSheet(); return showMap();
    }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && $('#sheet').innerHTML && $('.veil-bg').dataset.close === '1') closeSheet(); });

  // ---------- boot ----------
  // A board sits behind the map so the page never looks empty.
  S = HX.newLevel(HX.LEVELS[0], 7); buildStatic(); renderFrame(HX.snap(S, 'init')); hud(); coachSay(INTRO[0]);
  if (prog.seen) showMap(); else showIntro(0);
  window.HXUI = { startLevel, showMap, get S() { return S; } };
})();
