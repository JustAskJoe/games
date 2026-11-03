// Moonwort & Co. UI: screens, input, save, feedback. Rules live in engine.js; every change to the game goes through MW.*.
// © 2026 justaskjoe. All rights reserved.
(function () {
  const D = window.MW_DATA, MW = window.MW, ART = window.MWART, A = window.MWAUDIO;
  const VERSION = 'p1';
  const SAVE = 'moonwort-v1';
  const LORE = Object.fromEntries(((window.MW_LORE && window.MW_LORE.entries) || []).map(e => [e.id, e]));
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ?date=2026-11-20 pins the sky for testing; otherwise it's tonight's real moon.
  const qd = new URLSearchParams(location.search).get('date');
  const NOW = qd ? new Date(qd + 'T21:00:00') : new Date();
  const U = { mode: 'title', G: null, tab: 'shop', cust: null, mix: [], res: null, sky: MW.moon(NOW), date: NOW, quiz: [], fb: {}, gTab: 'herbs', lastRes: null };
  window.MWUI = U;

  // ---------- save ----------
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(U.G)); } catch (e) {} }
  function load() { try { const g = JSON.parse(localStorage.getItem(SAVE)); return g && g.v === 1 ? g : null; } catch (e) { return null; } }

  // ---------- helpers ----------
  const fam = () => D.FAMILIARS[U.G.familiar];
  const vill = id => D.VILLAGERS[id];
  const today = () => MW.troubles(U.G);
  const servedIdx = () => U.G.served.map(s => s.idx);
  const waiting = () => today().map((t, i) => i).filter(i => !servedIdx().includes(i));
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2200); }
  function showSheet(html) { $('#card').innerHTML = html; $('#sheet').hidden = false; $('#sheet').scrollTop = 0; }
  function hideSheet() { $('#sheet').hidden = true; $('#card').innerHTML = ''; }
  function traitWords(t) {
    const out = [];
    for (const a of ['H', 'M', 'B']) if (t[a]) out.push((t[a] > 0 ? D.AXES[a].pos : D.AXES[a].neg) + ' ' + '●'.repeat(Math.min(Math.abs(t[a]), 4)));
    return out.join(' · ') || 'gentle, no strong traits';
  }
  function bars(p) {
    const row = (a) => {
      const v = Math.max(-6, Math.min(6, p[a])), w = Math.abs(v) / 6 * 50;
      const left = v >= 0 ? 50 : 50 - w;
      return `<span>${D.AXES[a].neg}</span><div class="bar"><i style="left:${left}%;width:${w}%"></i></div><span>${D.AXES[a].pos}</span>`;
    };
    return `<div class="bars">${row('H')}${row('M')}${row('B')}</div>`;
  }
  const stars = n => n ? '<span class="stars">' + '★'.repeat(n) + '☆'.repeat(3 - n) + '</span>' : '';

  // ---------- title, quiz, familiar ----------
  function titleScreen() {
    U.mode = 'title'; $('#app').hidden = true;
    const g = load();
    showSheet(`<div class="frame title"><h1>Moonwort<br>&amp; Co.</h1><div class="sub">a little apothecary at the edge of Little Hollow</div>
      <p class="small" style="text-align:center">Tonight: ${ART.moon(U.sky, 18)} ${U.sky.name}, ${MW.season(U.date)}</p>
      ${g && !g.done ? '<button class="btn pri wide" data-act="continue" type="button">Continue · day ' + (g.day + 1) + '</button><div style="height:8px"></div>' : ''}
      <button class="btn ${g && !g.done ? '' : 'pri'} wide" data-act="new" type="button">${g ? 'New shop' : 'Open the shop'}</button>
      <div class="row"><button class="btn sm" data-act="how" type="button">How to play</button><button class="btn sm" data-act="sound" type="button">Sound: ${A.on ? 'on' : 'off'}</button><button class="btn sm" data-act="feedback" type="button">Feedback</button></div>
      <p class="small" style="margin-top:12px">A game about folklore and plant history. Nothing here is medical advice. Prototype 1 · placeholder art.<br>© 2026 justaskjoe. All rights reserved.</p></div>`);
  }
  function howScreen() {
    showSheet(`<div class="frame"><h2>How to play</h2>
      <p>Neighbors knock with a trouble. They never say what to make; you read what they need.</p>
      <p>Every herb carries traits: <b>warming / cooling</b>, <b>calming / brightening</b>, <b>drying / soothing</b>. How you prepare it changes them: grinding makes the strongest trait stronger, drying makes it drier, and moonlight follows the real moon (a waxing moon brightens, a waning moon calms).</p>
      <p>Put up to three herbs in the mortar, stir, and see what you made. Many recipes work. Wrong mixes make funny duds, never a fail.</p>
      <p>Every herb you use opens a true lore card in your grimoire.</p>
      <button class="btn pri wide" data-act="back" type="button">Back</button></div>`);
  }
  function quizScreen(i) {
    if (i === 0) U.quiz = [];
    if (i >= D.QUIZ.length) return familiarReveal();
    const q = D.QUIZ[i];
    showSheet(`<div class="frame"><p class="small">Before you open, a familiar must choose you. (${i + 1} of ${D.QUIZ.length})</p><h2>${esc(q.q)}</h2>
      ${q.a.map((a, k) => `<button class="choice" data-act="quiz" data-q="${i}" data-a="${k}" type="button">${esc(a.t)}</button>`).join('')}</div>`);
  }
  function familiarReveal() {
    const tally = { cat: 0, toad: 0, crow: 0 };
    U.quiz.forEach(f => tally[f]++);
    const pick = Object.keys(tally).reduce((a, b) => tally[b] > tally[a] ? b : a, 'cat');
    U.pickFam = pick;
    const f = D.FAMILIARS[pick];
    showSheet(`<div class="frame"><p class="small" style="text-align:center">A ${f.kind} steps out of the hedge and sits on your doorstep.</p>
      <div class="fam">${ART.familiar(f.kind)}</div><h2 style="text-align:center">${f.name} the ${f.kind}</h2><p style="text-align:center">${esc(f.blurb)}</p>
      <p class="small" style="text-align:center">${f.name} will drop hints when you're stuck.</p>
      <button class="btn pri wide" data-act="startGame" type="button">Open the shop</button></div>`);
  }
  function startGame() {
    U.G = MW.newGame(U.pickFam || 'cat', new Date());
    save(); dawnScreen();
  }

  // ---------- dawn and dusk ----------
  function dawnScreen() {
    const grown = MW.dawn(U.G); save();
    U.mode = 'play'; U.cust = null; U.mix = [];
    const day = D.DAYS[U.G.day];
    const tip = U.G.day === 0
      ? `Old Pell is already at the door. Tap him in the shop, then brew something calming at the bench. Start with chamomile.`
      : U.G.day === 1 ? `The hedgerow's full this morning. Forage once a day in the garden.` : `Last day of the week. Make it a good one.`;
    showSheet(`<div class="frame"><p class="small">Dawn · ${day.name}</p><h2>${ART.moon(U.sky, 26)} ${U.sky.name}</h2>
      <p class="small">${U.sky.waxing ? 'Waxing: moonlight brightens a herb tonight.' : 'Waning: moonlight calms a herb tonight.'} Season: ${MW.season(U.date)}. (This is the real sky.)</p>
      ${grown.length ? `<p>Ready in the garden: ${grown.map(p => p.yield + ' ' + MW.ING[p.id].name).join(', ')}.</p>` : ''}
      <div class="cust" style="margin-top:10px"><div style="flex:0 0 56px">${ART.familiar(fam().kind).replace('<svg', '<svg width="56" height="56"')}</div><div class="bubble">${esc(tip)}</div></div>
      <div style="height:12px"></div><button class="btn pri wide" data-act="openShop" type="button">Open the shop</button></div>`);
    render();
  }
  function duskScreen() {
    const G = U.G, shelf = G.shelf || 0;
    if (shelf) { G.coin += shelf * D.PAY.dud; G.shelf = 0; }
    const lines = G.served.map(s => { const tr = today()[s.idx]; return `<div class="small">${vill(tr.v).name}: ${esc(s.name)} <span class="tag ${s.g}">${{ best: 'just right', ok: 'helped', other: 'not quite', dud: 'dud' }[s.g]}</span></div>`; }).join('');
    const empty = G.plots.filter(p => !p).length;
    showSheet(`<div class="frame"><p class="small">Dusk · ${D.DAYS[G.day].name}</p><h2>Closing up</h2>${lines}
      ${shelf ? `<p class="small">Sold ${shelf} set-aside brew${shelf > 1 ? 's' : ''} off the shelf for ${shelf * D.PAY.dud} coin.</p>` : ''}
      <p style="margin-top:8px">Coin: <b>${G.coin}</b></p>
      ${empty && G.day < D.DAYS.length - 1 ? `<p class="small">${empty} empty garden plot${empty > 1 ? 's' : ''}. Seeds sown tonight are ready at dawn.</p><button class="btn wide" data-act="tab" data-tab="garden" type="button">Plant before bed</button><div style="height:8px"></div>` : ''}
      <button class="btn pri wide" data-act="sleep" type="button">${G.day < D.DAYS.length - 1 ? 'Sleep' : 'End the week'}</button></div>`);
  }
  function sleep() {
    MW.endDay(U.G); save();
    if (U.G.done) endScreen(); else dawnScreen();
  }
  function endScreen() {
    const G = U.G;
    const found = Object.keys(G.brewsFound).length, cards = Object.keys(G.seen).length;
    const best = G.log.filter(l => l.g === 'best').length;
    U.lastRes = { coin: G.coin, trust: G.trust, best, served: G.log.length, brews: found, lore: cards, firstBrewS: G.firstBrewMs == null ? null : Math.round(G.firstBrewMs / 1000), familiar: G.familiar, moon: U.sky.name };
    showSheet(`<div class="frame"><h2>The end of a good week</h2>
      <p>${best} of ${G.log.length} neighbors got exactly what they needed. You found ${found} of ${D.BREWS.length} brews and opened ${cards} of ${D.INGREDIENTS.length} lore cards.</p>
      <p class="small">Trust: ${Object.entries(G.trust).map(([k, v]) => vill(k).name + ' ' + '♥'.repeat(v)).join(' · ')}</p>
      <p class="small">${fam().name} the ${fam().kind} curls up by the stove. Little Hollow will knock again.</p>
      <button class="btn pri wide" data-act="feedback" type="button">Give feedback</button><div style="height:8px"></div>
      <div class="row"><button class="btn" data-act="grim" type="button">Grimoire</button><button class="btn" data-act="title" type="button">Title</button></div></div>`);
  }

  // ---------- main view ----------
  function render() {
    if (U.mode !== 'play' || !U.G) return;
    $('#app').hidden = false;
    const G = U.G;
    $('#hud').innerHTML = `<span class="day">Day ${Math.min(G.day + 1, D.DAYS.length)}</span>${ART.moon(U.sky, 20)}<span class="sp"></span>
      <span class="pill">◉ <b id="hudCoin">${G.coin}</b></span><span class="pill">♥ <b>${Object.values(G.trust).reduce((a, b) => a + b, 0)}</b></span>
      <button id="menuBtn" type="button" data-act="menu" aria-label="Menu">≡</button>`;
    document.querySelectorAll('#nav button').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === U.tab);
      const dot = b.querySelector('.dot'); if (dot) dot.remove();
      if (b.dataset.tab === 'garden' && !G.foraged && !G.done) b.insertAdjacentHTML('beforeend', '<span class="dot"></span>');
    });
    const v = $('#view');
    v.innerHTML = U.tab === 'shop' ? shopView() : U.tab === 'bench' ? benchView() : U.tab === 'garden' ? gardenView() : grimoireView();
  }
  function shopView() {
    const left = waiting();
    const cards = today().map((tr, i) => {
      const vi = vill(tr.v), s = U.G.served.find(x => x.idx === i);
      return `<div class="box ${s ? 'served' : ''}"><div class="cust">${ART.face(vi)}<div style="flex:1"><div class="who">${vi.name} <span>${vi.role}</span></div>
        <div class="bubble">${esc(tr.text)}</div>
        ${s ? `<div style="margin-top:6px"><span class="tag ${s.g}">${esc(s.name)}</span></div>` : `<div class="row"><button class="btn pri sm" data-act="brewFor" data-i="${i}" type="button">Brew for ${vi.name.replace('Old ', '')}</button></div>`}</div></div></div>`;
    }).join('');
    return `<h2>The shop</h2><p class="small">${left.length ? `${left.length} at the door. Read what they need; they won't tell you what to make.` : 'Everyone has been helped today.'}</p>${cards}
      ${left.length ? '' : '<button class="btn pri wide" data-act="dusk" type="button">Close up for the night</button>'}`;
  }
  function benchView() {
    const G = U.G;
    if (U.cust == null || servedIdx().includes(U.cust)) U.cust = waiting()[0] ?? null;
    const tr = U.cust != null ? today()[U.cust] : null;
    const used = {}; U.mix.forEach(m => used[m.id] = (used[m.id] || 0) + 1);
    const slots = [0, 1, 2].map(k => {
      const m = U.mix[k];
      if (!m) return `<div class="slot">empty</div>`;
      const ing = MW.ING[m.id], pr = D.PROCESSES.find(p => p.id === m.proc);
      return `<div class="slot full">${ART.herb(ing)}<div>${ing.name}</div><button class="proc" data-act="proc" data-k="${k}" type="button">${pr.name} ↻</button><button class="x" data-act="unmix" data-k="${k}" type="button">remove</button></div>`;
    }).join('');
    const p = MW.profile(U.mix, U.sky);
    const herbs = D.INGREDIENTS.filter(i => !i.loreOnly && (G.pantry[i.id] || 0) > 0).map(i => {
      const left = G.pantry[i.id] - (used[i.id] || 0);
      return `<button class="herb" data-act="mix" data-id="${i.id}" type="button" ${left <= 0 || U.mix.length >= 3 ? 'disabled' : ''}><span class="n">${left}</span>${ART.herb(i)}${i.name}${i.outerOnly ? '<span class="tag">pillow only</span>' : ''}</button>`;
    }).join('');
    return `${tr ? `<div class="box"><div class="cust">${ART.face(vill(tr.v))}<div style="flex:1"><div class="who">For ${vill(tr.v).name}</div><div class="bubble">${esc(tr.text)}</div></div></div></div>` : '<div class="box small">Nobody is waiting. You can still experiment; set-aside brews sell at dusk.</div>'}
      <h3>Mortar</h3><div class="slots">${slots}</div>
      ${U.mix.length ? bars(p) : '<p class="small">Tap herbs below to add up to three. Tap a herb\'s preparation to change it.</p>'}
      <div class="row"><button class="btn pri" data-act="stir" type="button" ${U.mix.length ? '' : 'disabled'}>Stir the brew</button>${U.mix.length ? '<button class="btn sm" data-act="clear" type="button">Clear</button>' : ''}</div>
      <h3>Pantry</h3>${U.mix.length ? `<p class="small">${U.mix.map(m => MW.ING[m.id].name + ': ' + traitWords(MW.processed(m.id, m.proc, U.sky))).join('<br>')}</p>` : ''}
      <div class="pantry">${herbs || '<p class="small">The pantry is empty. Try the garden.</p>'}</div>`;
  }
  function gardenView() {
    const G = U.G;
    const plots = G.plots.map((pl, k) => pl
      ? `<div class="box plot"><div class="soil">${ART.herb(MW.ING[pl.id])}</div><div><b>${MW.ING[pl.id].name}</b><div class="small">${pl.day < G.day ? 'Ready' : 'Growing. Ready at dawn.'}</div></div></div>`
      : `<div class="box"><div class="plot"><div class="soil"></div><div><b>Empty plot</b><div class="small">Sow seeds; they're ready at dawn.</div></div></div>
          <div class="seeds">${D.SEEDS.map(s => `<button class="btn sm" data-act="plant" data-k="${k}" data-id="${s.id}" type="button" ${G.coin < s.cost || G.done ? 'disabled' : ''}>${MW.ING[s.id].name} · ${s.cost}◉ → ${s.yield}</button>`).join('')}</div></div>`).join('');
    return `<h2>Garden &amp; hedgerow</h2>
      <div class="box"><b>The hedgerow</b><p class="small">${G.foraged ? 'You foraged today. The hedge needs time to grow back.' : `Gather a little of what the ${MW.season(U.date)} hedge offers. Take only a little, and only what you know.`}</p>
      <button class="btn ${G.foraged ? '' : 'pri'} wide" data-act="forage" type="button" ${G.foraged || G.done ? 'disabled' : ''}>Forage (once a day)</button></div>
      <h3>One garden bed</h3>${plots}`;
  }
  function grimoireView() {
    const G = U.G;
    const tabs = `<div class="tabs"><button class="${U.gTab === 'herbs' ? 'on' : ''}" data-act="gTab" data-t="herbs" type="button">Herbs ${Object.keys(G.seen).length}/${D.INGREDIENTS.length}</button><button class="${U.gTab === 'brews' ? 'on' : ''}" data-act="gTab" data-t="brews" type="button">Brews ${Object.keys(G.brewsFound).length}/${D.BREWS.length}</button></div>`;
    if (U.gTab === 'brews') return `<h2>Grimoire</h2>${tabs}` + D.BREWS.map(b => G.brewsFound[b.id]
      ? `<div class="box"><b>${b.name}</b> ${stars(G.brewsFound[b.id])}<div class="small">${esc(b.blurb)}</div></div>`
      : `<div class="box small">??? · not yet discovered</div>`).join('');
    return `<h2>Grimoire</h2>${tabs}<p class="small">Use a herb to open its lore card.</p><div class="pantry">` + D.INGREDIENTS.map(i => G.seen[i.id]
      ? `<button class="herb" data-act="lore" data-id="${i.id}" type="button">${ART.herb(i)}${i.name}</button>`
      : `<button class="herb locked" type="button" disabled>${ART.herb(i)}???</button>`).join('') + '</div>';
  }

  // ---------- lore card ----------
  function loreScreen(id, back) {
    const ing = MW.ING[id], L = LORE[id] || {};
    const c = L.culpeper, f = L.folklore, s = L.science;
    showSheet(`<div class="frame lore"><div style="display:flex;gap:10px;align-items:center"><div style="width:52px">${ART.herb(ing)}</div><div><h2 style="margin:0">${ing.name}</h2>
      <div class="bot">${esc(L.botanical || '')}${L.family ? ' · ' + esc(L.family) : ''}</div></div></div>
      ${L.card ? `<p>${esc(L.card)}</p>` : '<p class="small">Lore card coming soon.</p>'}
      ${L.true_fact ? `<div class="fact"><b>True fact:</b> ${esc(L.true_fact)}</div>` : ''}
      ${c && c.quote ? `<q>${esc(c.quote)}</q><div class="src">Nicholas Culpeper, <i>The Complete Herbal</i> (1653)${L.planet ? ' · he gave it to ' + esc(L.planet) : ''}</div>` : ''}
      ${f && f.text ? `<h3>Folklore</h3><p class="small">${esc(f.text)}</p>` : ''}
      ${s && s.text ? `<h3>What science says today</h3><p class="small">${esc(s.text)}</p>` : ''}
      ${L.safety ? `<div class="safe">${esc(L.safety)}</div>` : ''}
      ${ing.t ? `<p class="small">In the game: ${traitWords(ing.t)}</p>` : '<p class="small">Lore only. Never picked, never brewed.</p>'}
      ${(L.sources || []).length ? `<div class="src">Sources: ${L.sources.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}</a>`).join(' · ')}</div>` : ''}
      <p class="src">Folklore and history, not medical advice.</p>
      <button class="btn pri wide" data-act="${back || 'close'}" type="button">Close</button></div>`);
  }

  // ---------- brewing ----------
  function stirScreen() {
    U.stir = { turns: 0, last: null, acc: 0 };
    showSheet(`<div class="frame" style="text-align:center"><h2>Stir</h2><p class="small">Draw circles in the cauldron. Two turns.</p>
      <div id="stir"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#1d1526" stroke="#e3b75a" stroke-width="3"/>
      <circle cx="100" cy="100" r="74" fill="${mixColor()}" opacity=".85"/><circle class="ring" id="stirRing" cx="100" cy="100" r="84" fill="none" stroke="#f2d48f" stroke-width="6" stroke-dasharray="528" stroke-dashoffset="528" transform="rotate(-90 100 100)"/>
      <circle id="spoon" cx="100" cy="40" r="9" fill="#c9953e"/></svg></div>
      <button class="btn sm" data-act="autoStir" type="button">Stir for me</button></div>`);
    const el = $('#stir');
    const ang = e => { const r = el.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
    el.addEventListener('pointerdown', e => { U.stir.last = ang(e); el.setPointerCapture && el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => {
      if (U.stir.last == null) return;
      const a = ang(e); let d = a - U.stir.last; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      U.stir.last = a; U.stir.acc += Math.abs(d); stirProgress(a);
    });
    el.addEventListener('pointerup', () => { U.stir.last = null; });
  }
  function mixColor() {
    const cs = U.mix.map(m => MW.ING[m.id].color);
    return cs[0] || '#6b5a7a';
  }
  function stirProgress(a) {
    const f = Math.min(1, U.stir.acc / (4 * Math.PI));
    const ring = $('#stirRing'); if (ring) ring.setAttribute('stroke-dashoffset', String(528 * (1 - f)));
    const sp = $('#spoon'); if (sp && a != null) { sp.setAttribute('cx', 100 + Math.cos(a) * 60); sp.setAttribute('cy', 100 + Math.sin(a) * 60); }
    if (Math.floor(U.stir.acc / Math.PI) > (U.stir.ticks || 0)) { U.stir.ticks = Math.floor(U.stir.acc / Math.PI); A.bubble(); if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) {} }
    if (f >= 1 && !U.stir.done) { U.stir.done = true; setTimeout(finishBrew, 150); }
  }
  function finishBrew() {
    const before = Object.assign({}, U.G.seen);
    const res = MW.brew(U.G, U.mix, U.sky);
    if (!res) { hideSheet(); toast('Not enough in the pantry.'); return; }
    U.res = res; U.res.newLore = Object.keys(U.G.seen).filter(k => !before[k]);
    U.mix = []; save();
    A.chime(!!res.brew);
    const tr = U.cust != null ? today()[U.cust] : null;
    showSheet(`<div class="frame" style="text-align:center"><p class="small">You made…</p><h2>${esc(res.name)}</h2>
      ${res.brew ? stars(res.stars) + `<p class="small">${esc(MW.BREW[res.brew].blurb)}</p>` : '<p class="small">A dud! Still sellable. Nothing is ever wasted in Little Hollow.</p>'}
      ${bars(res.profile)}
      ${res.newLore.length ? `<p class="small" style="margin-top:8px">New in your grimoire: ${res.newLore.map(id => MW.ING[id].name).join(', ')}</p>` : ''}
      <div style="height:10px"></div>
      ${tr ? `<button class="btn pri wide" data-act="give" type="button">Give it to ${vill(tr.v).name}</button><div style="height:8px"></div>` : ''}
      <button class="btn wide" data-act="shelf" type="button">Set it aside and brew again</button></div>`);
  }
  function give() {
    const G = U.G, i = U.cust, tr = today()[i], res = U.res, vi = vill(tr.v);
    const coin0 = G.coin;
    const g = MW.serve(G, i, res, Date.now());
    U.res = null; save();
    const react = {
      best: `${vi.name} sips, and the whole face softens. "That's exactly it. How did you know?"`,
      ok: `${vi.name} smiles. "That helps. Not quite what I had in mind, but it helps."`,
      other: `${vi.name} looks puzzled but polite. "It's lovely... just not for this."`,
      dud: `${vi.name} takes a sip and ${D.DUDS[res.dud] ? D.DUDS[res.dud].fx : 'blinks.'} You both laugh.`,
    }[g];
    const hintLine = g === 'best' ? (res.newLore && res.newLore.length ? `Have a look at the grimoire. ${MW.ING[res.newLore[0]].name} has a story.` : 'Well read.')
      : MW.hint(tr, res.profile);
    const lore = (res.newLore || [])[0];
    showSheet(`<div class="frame"><div class="cust">${ART.face(vi)}<div class="bubble" style="flex:1">${esc(react)}</div></div>
      <p style="margin-top:10px">+${G.coin - coin0} coin${D.TRUST[g] ? ` · +${D.TRUST[g]} trust` : ''}</p>
      <div class="cust"><div style="flex:0 0 48px">${ART.familiar(fam().kind).replace('<svg', '<svg width="48" height="48"')}</div><div class="bubble" style="flex:1"><b>${fam().name}:</b> ${esc(hintLine)}</div></div>
      <div style="height:12px"></div>
      ${lore ? `<button class="btn wide" data-act="lore" data-id="${lore}" data-back="afterGive" type="button">Read the ${MW.ING[lore].name} card</button><div style="height:8px"></div>` : ''}
      <button class="btn pri wide" data-act="afterGive" type="button">${waiting().length ? 'Next neighbor' : 'Close up for the night'}</button></div>`);
  }
  function afterGive() {
    hideSheet();
    if (!waiting().length) return duskScreen();
    U.tab = 'shop'; render();
  }

  // ---------- garden ----------
  function doForage() {
    const r = MW.forage(U.G, U.date); if (!r) return; save(); A.chime(true);
    showSheet(`<div class="frame"><h2>The hedgerow</h2><p>You gather ${r.got.map(id => MW.ING[id].name).join(', ')}.</p>
      ${r.moonwort ? `<div class="box"><div style="display:flex;gap:10px;align-items:center"><div style="width:44px">${ART.herb(MW.ING.moonwort)}</div><div><b>Moonwort!</b><div class="small">A tiny fern with half-moon leaves, the plant the shop is named for. It's rare, so you leave it be and only sketch it in the grimoire.</div></div></div></div>` : ''}
      <p class="small">${fam().name} says: only gather what you know for certain, and leave plenty for the bees.</p>
      ${r.moonwort ? '<button class="btn wide" data-act="lore" data-id="moonwort" data-back="close" type="button">Read the Moonwort card</button><div style="height:8px"></div>' : ''}
      <button class="btn pri wide" data-act="close" type="button">Back</button></div>`);
  }

  // ---------- feedback ----------
  const FQ = [
    { id: 'fun', q: 'How fun was it? (1-5)', o: ['1', '2', '3', '4', '5'] },
    { id: 'again', q: 'Do you want to keep playing?', o: ['Yes', 'Maybe', 'No'] },
    { id: 'found', q: 'Did you find brews without help?', o: ['Yes', 'Sometimes', 'No'] },
  ];
  function feedbackScreen() {
    U.fb = {};
    const qs = FQ.map(f => `<div class="q">${f.q}</div><div class="opts">${f.o.map(o => `<button type="button" data-fq="${f.id}" data-fv="${o}">${o}</button>`).join('')}</div>`).join('');
    showSheet(`<div class="frame fb"><h2>Quick feedback</h2><p class="small">Tap what fits. One answer is enough.</p>${qs}
      <div class="q">One real plant fact you remember (no peeking):</div><textarea id="fbFact"></textarea>
      <div class="q">Anything else?</div><textarea id="fbNote"></textarea><div id="fbErr"></div>
      <button class="btn pri wide" data-act="fbSend" type="button">Send</button><div style="height:8px"></div>
      <button class="btn wide" data-act="${U.G && U.G.done ? 'endBack' : 'back'}" type="button">Back</button><div id="fbCopy" hidden></div></div>`);
  }
  async function sendFeedback() {
    U.fb.fact = $('#fbFact').value.trim(); U.fb.note = $('#fbNote').value.trim();
    if (!FQ.some(f => U.fb[f.id]) && !U.fb.fact && !U.fb.note) { $('#fbErr').textContent = 'Tap at least one answer first.'; return; }
    const body = { version: VERSION, at: new Date().toISOString(), answers: U.fb, result: U.lastRes || (U.G ? { day: U.G.day, coin: U.G.coin } : null) };
    let ok = false;
    try { const db = window.claude && window.claude.use ? await window.claude.use('db') : null; if (db) { await db.collection('feedback').add(body); ok = true; } } catch (e) {}
    if (!ok && location.protocol !== 'file:') { try { const res = await fetch('/forge/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ game: 'moonwort-co' }, body)) }); ok = res.ok; } catch (e) {} }
    if (ok) { toast('Thank you!'); return U.G && U.G.done ? endScreen() : titleScreen(); }
    const txt = 'Moonwort & Co. ' + VERSION + ' feedback\n' + FQ.map(f => f.q + ' ' + (U.fb[f.id] || '-')).join('\n') + '\nPlant fact: ' + (U.fb.fact || '-') + '\nNotes: ' + (U.fb.note || '-') + '\nResult: ' + JSON.stringify(body.result);
    const c = $('#fbCopy'); c.hidden = false;
    c.innerHTML = `<p class="small" style="margin-top:10px">Couldn't send from here. Copy this and paste it to the crew:</p><textarea readonly>${esc(txt)}</textarea>`;
    try { navigator.clipboard && navigator.clipboard.writeText(txt).catch(() => {}); } catch (e) {}
  }

  // ---------- input ----------
  document.addEventListener('click', e => {
    const fq = e.target.closest('[data-fq]');
    if (fq) { U.fb[fq.dataset.fq] = fq.dataset.fv; fq.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === fq)); return; }
    const tabB = e.target.closest('#nav [data-tab]');
    if (tabB) { U.tab = tabB.dataset.tab; A.tap(); render(); $('#view').scrollTop = 0; return; }
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act; A.unlock();
    if (a === 'new') quizScreen(0);
    else if (a === 'continue') { U.G = load(); U.mode = 'play'; hideSheet(); U.tab = 'shop'; render(); if (U.G.phase === 'dawn') dawnScreen(); }
    else if (a === 'how') howScreen();
    else if (a === 'back' || a === 'title') titleScreen();
    else if (a === 'sound') { A.toggle(); titleScreen(); }
    else if (a === 'feedback') feedbackScreen();
    else if (a === 'fbSend') sendFeedback();
    else if (a === 'endBack') endScreen();
    else if (a === 'quiz') { U.quiz.push(D.QUIZ[+b.dataset.q].a[+b.dataset.a].f); A.tap(); quizScreen(+b.dataset.q + 1); }
    else if (a === 'startGame') startGame();
    else if (a === 'openShop') { hideSheet(); U.tab = 'shop'; render(); }
    else if (a === 'brewFor') { U.cust = +b.dataset.i; U.mix = []; U.tab = 'bench'; render(); $('#view').scrollTop = 0; }
    else if (a === 'mix') { if (U.mix.length < 3) { U.mix.push({ id: b.dataset.id, proc: 'steep' }); A.tap(); render(); } }
    else if (a === 'unmix') { U.mix.splice(+b.dataset.k, 1); render(); }
    else if (a === 'proc') { const m = U.mix[+b.dataset.k], ps = D.PROCESSES.map(p => p.id); m.proc = ps[(ps.indexOf(m.proc) + 1) % ps.length]; A.tap(); render(); }
    else if (a === 'clear') { U.mix = []; render(); }
    else if (a === 'stir') stirScreen();
    else if (a === 'autoStir') { U.stir.acc = 4 * Math.PI; stirProgress(null); }
    else if (a === 'give') give();
    else if (a === 'shelf') { if (U.res) U.G.shelf = (U.G.shelf || 0) + 1; U.res = null; save(); hideSheet(); render(); }
    else if (a === 'afterGive') afterGive();
    else if (a === 'dusk') duskScreen();
    else if (a === 'sleep') sleep();
    else if (a === 'tab') { hideSheet(); U.tab = b.dataset.tab; render(); }
    else if (a === 'forage') doForage();
    else if (a === 'plant') { if (MW.plant(U.G, +b.dataset.k, b.dataset.id)) { save(); A.tap(); toast(MW.ING[b.dataset.id].name + ' sown. Ready at dawn.'); } render(); }
    else if (a === 'gTab') { U.gTab = b.dataset.t; render(); }
    else if (a === 'lore') loreScreen(b.dataset.id, b.dataset.back);
    else if (a === 'grim') { hideSheet(); U.mode = 'play'; U.tab = 'grimoire'; render(); }
    else if (a === 'close') { hideSheet(); render(); }
    else if (a === 'menu') showSheet(`<div class="frame"><h2>Menu</h2><div class="row" style="flex-direction:column"><button class="btn wide" data-act="close" type="button">Back to the shop</button><button class="btn wide" data-act="how" type="button">How to play</button><button class="btn wide" data-act="feedback" type="button">Feedback</button><button class="btn wide" data-act="title" type="button">Title screen</button></div></div>`);
  });

  // Test and sim hooks
  window.MWUI_API = { render, startGame, dawnScreen, duskScreen, loreScreen, LORE };
  titleScreen();
})();
