/* Tower Defense Prototype 1 — UI. © 2026 F Lane d/b/a One Fifty Labs. All rights reserved. */
(function () {
  'use strict';
  const TD = window.TD, A = window.TDArt;
  const $ = (q) => document.querySelector(q);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  let G = null;
  const ui = { sel: null, pick: 'arrow', speed: 1, coach: true, lesson: 0, over: false, fx: [], flash: null, tplay: 0, lastT: 0, raf: 0, feedbackDone: false, started: false, runs: 0, fast: false };
  const FB = { q: {}, text: '', nm: '', saved: null };
  const icons = {};

  // ---------- render: HUD, controls, coach, sheet ----------
  function hud() {
    const hpPct = Math.max(0, 100 * G.health / G.maxHealth);
    $('#hud').innerHTML = `
      <div class="stat hp"><span>Keep</span><b>${G.health}</b><div class="bar"><i style="width:${hpPct}%"></i></div></div>
      <div class="stat gold"><span>Gold</span><b>${G.gold}</b></div>
      <div class="stat wave"><span>Wave</span><b>${Math.min(G.wave + 1, TD.WAVES.length)}<small style="font-size:14px;color:var(--muted)">/${TD.WAVES.length}</small></b></div>`;
  }
  function nextRow() {
    const w = TD.WAVES[G.wave]; if (!w) return '';
    const need = TD.nextWaveNeeds(G);
    const grows = w.stage > G.stage;
    return `<div class="next grow"><span class="lbl">${G.phase === 'wave' ? 'This wave' : 'Next wave'}${grows ? ' · the road grows first' : ''}</span><div class="row">${Object.entries(need).map(([t, n]) => `<span class="pill"><i style="background:${TD.ENEMIES[t].color}"></i>${n} ${esc(TD.ENEMIES[t].name)}${n > 1 ? 's' : ''}</span>`).join('')}</div></div>`;
  }
  function ctl() {
    const inBuild = G.phase === 'build';
    $('#ctl').innerHTML = nextRow() + (inBuild
      ? `<button class="btn primary" data-act="start" type="button" id="bStart">Send the wave</button>`
      : G.phase === 'wave' ? `<button class="btn ${ui.speed > 1 ? 'gold' : ''}" data-act="speed" type="button" aria-pressed="${ui.speed > 1}">${ui.speed > 1 ? '3×' : '1×'}</button>` : '');
  }
  function coachLine() {
    if (!ui.coach) { $('#coach').innerHTML = ''; $('#coach').style.display = 'none'; return; }
    $('#coach').style.display = '';
    let t;
    if (G.phase === 'build') {
      const free = TD.spots(G).filter(([c, r]) => !TD.towerAt(G, c, r));
      const need = TD.nextWaveNeeds(G);
      if (!G.towers.length) t = 'Pick a tower below, then tap a glowing <b>+</b> spot on the map to build it. Arrows are a good start.';
      else if (need.flyer && !G.towers.some((x) => x.type === 'spark' || x.type === 'arrow')) t = 'Flyers are coming. Cannons can’t hit them; <b>Spark</b> or Arrows can.';
      else if ((need.brute || need.boss) && !G.towers.some((x) => x.type === 'cannon')) t = 'Armored <b>Brutes</b> shrug off arrows. A <b>Cannon</b> (or Spark) cracks them.';
      else if (G.towers.some((x) => x.tier === 1 && TD.canUpgrade(G, x)) && (!free.length || G.gold > 150)) t = 'Tap one of your towers to <b>upgrade</b> it. Each has two paths; pick one.';
      else if (free.length && G.gold >= TD.cost(G, 'arrow')) t = `You can afford another tower. ${free.length} spot${free.length > 1 ? 's' : ''} open.`;
      else t = 'Ready? Hit <b>Send the wave</b>. You can’t build while it runs, so spend first.';
    } else if (G.phase === 'wave') t = ui.speed > 1 ? 'Watch the road. Tap <b>1×</b> if it gets hairy.' : 'Watch your build work. Tap <b>3×</b> to speed up.';
    else if (G.phase === 'draft') t = 'Wave cleared! Pick <b>one card</b>. It stays for the whole run.';
    else t = '';
    $('#coach').innerHTML = `<div class="av">${A.COACH_SVG}</div><p><b class="who">Pell:</b> ${t}</p>`;
  }
  function towerIcon(type) { if (!icons[type]) icons[type] = A.towerIconSVG(type); return `<img src="${icons[type]}" alt="${esc(TD.TOWERS[type].name)}" width="40" height="40">`; }
  function sheet() {
    const el = $('#sheet');
    if (G.phase === 'draft' && G.offer) {
      const best = TD.botPick(G);
      el.innerHTML = `<div><span class="eyebrow">Wave ${G.wave} cleared</span><h2>Draft a card</h2></div>
        <div class="cards">${G.offer.map((id) => { const c = TD.CARDS.find((x) => x.id === id); return `<button class="card ${c.kind} ${ui.coach && id === best ? 'hint' : ''}" data-pick="${id}" type="button"><span class="kind">${c.kind}</span><b>${esc(c.name)}</b><small>${esc(c.text)}</small></button>`; }).join('')}</div>
        ${deckHTML()}`;
      return;
    }
    if (G.phase === 'won' || G.phase === 'lost') { el.innerHTML = `<div class="acts"><button class="btn primary" data-act="again" type="button">Play again</button><button class="btn" data-act="feedback" type="button">Give feedback</button></div>`; return; }
    if (G.phase === 'wave') { el.innerHTML = `<div class="waves">${TD.WAVES.map((w, i) => `<i class="${i < G.wave ? 'done' : i === G.wave ? 'now' : ''}"></i>`).join('')}</div>${deckHTML()}`; return; }
    // build phase
    const sel = ui.sel ? TD.towerAt(G, ui.sel[0], ui.sel[1]) : null;
    if (sel) {
      const s = TD.stats(G, sel); const base = TD.TOWERS[sel.type];
      const canUp = TD.canUpgrade(G, sel);
      el.innerHTML = `<div class="twinfo">${towerIcon(sel.type).replace('width="40" height="40"', 'width="56" height="56"')}<div class="txt"><b>${esc(base.name)}${sel.tier === 2 ? ' · ' + esc(base.up[sel.branch].name) : ''}</b><small>${esc(sel.tier === 2 ? base.up[sel.branch].desc : base.desc)}</small><small>Damage ${s.dmg.toFixed(0)} · ${s.rate.toFixed(1)}/s · range ${s.range.toFixed(1)} · ${sel.kills} kills</small></div></div>
        ${sel.tier === 1 ? `<h3>Upgrade · ${TD.upCost(G, sel)} gold</h3><div class="branches">${['A', 'B'].map((b) => `<button type="button" data-up="${b}" ${canUp ? '' : 'disabled'}><b>${esc(base.up[b].name)}</b><small>${esc(base.up[b].desc)}</small></button>`).join('')}</div>` : '<p class="muted">Fully upgraded.</p>'}
        <div class="acts"><button class="btn sm ghost" data-act="sell" type="button">Sell for ${TD.sellValue(G, sel)}</button><button class="btn sm" data-act="unsel" type="button">Done</button></div>`;
      return;
    }
    const free = TD.spots(G).filter(([c, r]) => !TD.towerAt(G, c, r)).length;
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><h3>Build</h3><span class="muted" style="font-size:13px">${free} spot${free === 1 ? '' : 's'} open · tap a tower to upgrade</span></div>
      <div class="shop">${Object.entries(TD.TOWERS).map(([k, t]) => `<button type="button" data-pick="${k}" aria-pressed="${ui.pick === k}" ${G.gold < TD.cost(G, k) ? 'disabled' : ''} class="${ui.coach && !G.towers.length && k === 'arrow' ? 'hint' : ''}">${towerIcon(k)}<b>${esc(t.name)}</b><small>${TD.cost(G, k)}</small></button>`).join('')}</div>
      <p class="muted" style="font-size:13.5px">${esc(TD.TOWERS[ui.pick].desc)}</p>
      ${deckHTML()}`;
  }
  function deckHTML() { return G.cards.length ? `<div class="deck">${G.cards.map((c) => `<span class="pill" title="${esc(c.text)}">${esc(c.name)}</span>`).join('')}</div>` : ''; }
  function renderAll() { hud(); ctl(); coachLine(); sheet(); draw(); }

  // ---------- canvas ----------
  const cv = $('#map'), cx = cv.getContext('2d');
  const CELL = 80; // canvas px per cell; canvas is 960x640 = 12x8
  function cellAt(evX, evY) {
    const r = cv.getBoundingClientRect(); const x = (evX - r.left) / r.width * TD.COLS, y = (evY - r.top) / r.height * TD.ROWS;
    return [Math.floor(x), Math.floor(y)];
  }
  function draw() {
    const t = ui.tplay;
    const path = TD.path(G), pathSet = new Set(path.map(([x, y]) => x + ',' + y));
    const nextStage = TD.WAVES[G.wave] && TD.WAVES[G.wave].stage > G.stage ? TD.WAVES[G.wave].stage : null;
    const futureSet = new Set(nextStage !== null ? TD.PATHS[nextStage].map(([x, y]) => x + ',' + y) : []);
    for (let r = 0; r < TD.ROWS; r++) for (let c = 0; c < TD.COLS; c++) {
      const k = c + ',' + r;
      if (pathSet.has(k)) A.road(cx, c * CELL, r * CELL, CELL, c * 7 + r * 13);
      else { A.grass(cx, c * CELL, r * CELL, CELL, c * 7 + r * 13); if (futureSet.has(k)) A.road(cx, c * CELL, r * CELL, CELL, 0, true); }
    }
    // future spots
    if (nextStage !== null) TD.SPOTS[nextStage].forEach(([c, r]) => { cx.save(); cx.globalAlpha = .35; A.spot(cx, c * CELL, r * CELL, CELL, true, false); cx.restore(); });
    // spots
    const inBuild = G.phase === 'build';
    TD.spots(G).forEach(([c, r]) => { const tw = TD.towerAt(G, c, r); if (!tw) A.spot(cx, c * CELL, r * CELL, CELL, true, inBuild && G.gold >= TD.cost(G, ui.pick)); else A.spot(cx, c * CELL, r * CELL, CELL, false, false); });
    // entrance marker
    const [ex, ey] = path[0]; cx.fillStyle = A.RUST; cx.beginPath(); cx.moveTo(ex * CELL + 10, ey * CELL + 20); cx.lineTo(ex * CELL + 34, ey * CELL + 40); cx.lineTo(ex * CELL + 10, ey * CELL + 60); cx.closePath(); cx.fill(); cx.strokeStyle = A.INK; cx.lineWidth = 3; cx.stroke();
    // keep
    const [kx, ky] = TD.keep(G); A.keepArt(cx, kx * CELL, ky * CELL - 6, CELL, G.health <= 5);
    // range ring for selected / picked
    if (inBuild && ui.sel) { const tw = TD.towerAt(G, ui.sel[0], ui.sel[1]); const rg = tw ? TD.stats(G, tw).range : TD.TOWERS[ui.pick].range * G.mods.range; cx.save(); cx.fillStyle = 'rgba(78,143,134,.18)'; cx.strokeStyle = 'rgba(58,37,24,.6)'; cx.lineWidth = 2; cx.setLineDash([8, 6]); cx.beginPath(); cx.arc((ui.sel[0] + .5) * CELL, (ui.sel[1] + .5) * CELL, rg * CELL, 0, Math.PI * 2); cx.fill(); cx.stroke(); cx.restore(); }
    // towers
    const firing = new Set(ui.fx.filter((f) => f.k === 'shot' && t - f.t < .12).map((f) => f.tw));
    for (const tw of G.towers) A.towerArt(cx, tw.type, tw.c * CELL, tw.r * CELL - 8, CELL, tw.tier, tw.branch, firing.has(tw.id));
    if (inBuild && ui.sel && TD.towerAt(G, ui.sel[0], ui.sel[1])) { cx.strokeStyle = A.GOLD; cx.lineWidth = 4; cx.strokeRect(ui.sel[0] * CELL + 4, ui.sel[1] * CELL + 4, CELL - 8, CELL - 8); }
    // enemies (ground first, flyers on top)
    const ens = G.enemies.filter((e) => !e.dead).sort((a, b) => (a.flying - b.flying) || (a.y - b.y));
    for (const e of ens) A.enemyArt(cx, e.type, (e.x + .5) * CELL, (e.y + .5) * CELL, CELL, t + e.id, e.hp / e.maxHp, e.slowT > 0);
    // fx
    ui.fx = ui.fx.filter((f) => t - f.t < .6);
    for (const f of ui.fx) {
      const age = t - f.t;
      if (f.k === 'shot') {
        const [fx0, fy0] = [(f.from[0] + .5) * CELL, (f.from[1] + .1) * CELL], [tx, ty] = [(f.to[0] + .5) * CELL, (f.to[1] + .4) * CELL];
        if (age < .14) {
          cx.strokeStyle = f.type === 'spark' ? A.SPARK : f.type === 'frost' ? A.FROST : f.type === 'cannon' ? '#3A2518' : '#FFF4D6'; cx.lineWidth = f.type === 'spark' ? 3 : 2.5;
          if (f.chain) { cx.beginPath(); cx.moveTo(fx0, fy0); f.chain.forEach(([x, y]) => cx.lineTo((x + .5) * CELL + (Math.random() - .5) * 8, (y + .4) * CELL + (Math.random() - .5) * 8)); cx.stroke(); }
          else { cx.beginPath(); cx.moveTo(fx0, fy0); cx.lineTo(tx, ty); cx.stroke(); }
        }
        if (f.splash && age < .3) { cx.strokeStyle = f.frost ? A.FROST : A.RUST; cx.lineWidth = 3; cx.globalAlpha = 1 - age / .3; cx.beginPath(); cx.arc(tx, ty, f.splash * CELL * (age / .3), 0, Math.PI * 2); cx.stroke(); cx.globalAlpha = 1; }
      } else if (f.k === 'kill') { cx.globalAlpha = 1 - age / .6; cx.fillStyle = '#FFE9A8'; cx.strokeStyle = A.INK; cx.lineWidth = 3; cx.font = 'bold 22px Bricolage Grotesque, sans-serif'; cx.textAlign = 'center'; cx.strokeText('+' + f.bounty, (f.x + .5) * CELL, (f.y + .2) * CELL - age * 60); cx.fillText('+' + f.bounty, (f.x + .5) * CELL, (f.y + .2) * CELL - age * 60); cx.globalAlpha = 1; }
    }
  }

  // ---------- game loop ----------
  let acc = 0;
  function frame(ts) {
    ui.raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, (ts - (ui.lastT || ts)) / 1000); ui.lastT = ts; ui.tplay += dt;
    if (G.phase === 'wave') {
      acc += dt * ui.speed;
      let changed = false;
      while (acc >= TD.TICK) {
        acc -= TD.TICK; const evs = TD.step(G); changed = true;
        for (const e of evs) {
          if (e.k === 'shot' || e.k === 'kill') ui.fx.push(Object.assign({ t: ui.tplay }, e));
          if (e.k === 'leak') { $('#mapWrap').classList.remove('shake'); void $('#mapWrap').offsetWidth; $('#mapWrap').classList.add('shake'); hud(); }
          if (e.k === 'waveClear') { banner('Wave ' + (e.wave + 1) + ' held! +' + e.bonus); }
          if (e.k === 'won') { setTimeout(() => endScreen(true), 600); }
          if (e.k === 'lost') { setTimeout(() => endScreen(false), 400); }
        }
        if (G.phase !== 'wave') { ui.speed = 1; renderAll(); break; }
      }
      if (changed) { hud(); }
    }
    draw();
  }
  function banner(text) { const h = $('#bannerHost'); h.innerHTML = `<div class="banner">${esc(text)}</div>`; setTimeout(() => { h.innerHTML = ''; }, 1600); }

  // ---------- actions ----------
  function newRun(seed) {
    G = TD.newGame(seed || ((Date.now() % 100000) + 1)); ui.sel = null; ui.pick = 'arrow'; ui.speed = 1; ui.fx = []; ui.feedbackDone = false; ui.runs++;
    $('#modeTag').textContent = `Prototype 1 · solo run${ui.runs > 1 ? ' · run ' + ui.runs : ''} · seed ${G.seed}`;
    renderAll();
    if (!ui.raf) ui.raf = requestAnimationFrame(frame);
  }
  function tapCell(c, r) {
    if (G.phase !== 'build') return;
    const tw = TD.towerAt(G, c, r);
    if (tw) { ui.sel = [c, r]; renderAll(); return; }
    if (TD.isSpot(G, c, r)) {
      if (TD.canBuild(G, ui.pick, c, r)) { TD.build(G, ui.pick, c, r); ui.sel = null; banner(''); renderAll(); }
      else { ui.sel = [c, r]; $('#mapWrap').classList.remove('shake'); void $('#mapWrap').offsetWidth; $('#mapWrap').classList.add('shake'); renderAll(); }
      return;
    }
    ui.sel = null; renderAll();
  }
  cv.addEventListener('click', (e) => { const [c, r] = cellAt(e.clientX, e.clientY); tapCell(c, r); });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pick && G.phase === 'build') { ui.pick = b.dataset.pick; ui.sel = null; renderAll(); return; }
    if (b.dataset.pick && G.phase === 'draft') { TD.pick(G, b.dataset.pick); if (G.events && G.events[0] && G.events[0].k === 'grow') banner('The road grows!'); ui.sel = null; renderAll(); return; }
    if (b.dataset.up) { const tw = TD.towerAt(G, ui.sel[0], ui.sel[1]); if (tw && TD.upgrade(G, tw, b.dataset.up)) renderAll(); return; }
    const a = b.dataset.act; if (!a) return;
    if (a === 'start') { if (TD.startWave(G)) { ui.sel = null; acc = 0; renderAll(); } }
    else if (a === 'speed') { ui.speed = ui.speed > 1 ? 1 : 3; ctl(); coachLine(); }
    else if (a === 'sell') { const tw = TD.towerAt(G, ui.sel[0], ui.sel[1]); if (tw) { TD.sell(G, tw); ui.sel = null; renderAll(); } }
    else if (a === 'unsel') { ui.sel = null; renderAll(); }
    else if (a === 'again') { closeOverlay(); newRun(); }
    else if (a === 'menu') showOverlay(menuHTML());
    else if (a === 'close') closeOverlay();
    else if (a === 'how') showOverlay(howHTML());
    else if (a === 'feedback') showOverlay(feedbackHTML());
    else if (a === 'fbsend') sendFeedback();
    else if (a === 'fbcopy') { const t = feedbackText(); navigator.clipboard && navigator.clipboard.writeText(t).catch(() => {}); const box = $('#fbCopy'); if (box) { const rg = document.createRange(); rg.selectNodeContents(box); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); } }
    else if (a === 'tCoach') { ui.coach = !ui.coach; lsSet('td-coach', ui.coach ? '1' : '0'); showOverlay(menuHTML()); coachLine(); }
    else if (a === 'intro') { closeOverlay(); showIntro(0); }
    else if (a === 'newrun') { closeOverlay(); newRun(); }
    else if (a === 'sim') showOverlay(simHTML());
    else if (a === 'runsim') { runSim(); }
    else if (b.dataset.s === 'next') showIntro(ui.lesson + 1);
    else if (a === 'skipintro') { hideStory(); if (!ui.started) { ui.started = true; newRun(); } }
  });
  for (const k of ['fbText', 'fbName']) document.addEventListener('input', (e) => { if (e.target.id === k) FB[k === 'fbText' ? 'text' : 'nm'] = e.target.value; });
  document.addEventListener('click', (e) => { const b = e.target.closest('button[data-fq]'); if (!b) return; FB.q[b.dataset.fq] = b.dataset.fv; document.querySelectorAll(`button[data-fq="${b.dataset.fq}"]`).forEach((x) => x.setAttribute('aria-pressed', x === b)); });

  // ---------- overlays ----------
  function showOverlay(html) { $('#overlay').innerHTML = `<div class="veil-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`; }
  function closeOverlay() { $('#overlay').innerHTML = ''; }
  function menuHTML() {
    const on = (b) => (b ? 'On' : 'Off');
    return `<h2>Menu</h2><div class="menu">
      <button class="btn" data-act="how" type="button">How to play <span>›</span></button>
      <button class="btn" data-act="tCoach" type="button" aria-pressed="${ui.coach}">Pell coaches you <span>${on(ui.coach)}</span></button>
      <button class="btn" data-act="newrun" type="button">New run <span>›</span></button>
      <button class="btn" data-act="intro" type="button">Replay the intro <span>›</span></button>
      <button class="btn" data-act="sim" type="button">Bot simulation (for testers) <span>›</span></button>
      <button class="btn" data-act="feedback" type="button">Give feedback <span>›</span></button>
    </div><div class="acts"><button class="btn primary" data-act="close" type="button">Close</button></div>`;
  }
  function howHTML() {
    return `<h2>How to play</h2>
      <ol><li><b>Build:</b> pick a tower, tap a <b>+</b> spot. Tap a built tower to upgrade it (two paths, pick one) or sell it.</li>
      <li><b>Send the wave:</b> enemies walk the road to your keep. Each one that reaches it costs health. At 0 the run is over.</li>
      <li><b>Draft:</b> after each wave, pick one of three cards. Buffs, gold, or keep repairs. They last the whole run.</li>
      <li><b>The road grows</b> before wave 4 and wave 7. The keep moves out and new spots open. Old towers stay where they are.</li></ol>
      <p><b>Counters:</b> Cannons crack armored Brutes but can’t hit Flyers. Spark loves Flyers and packs. Frost slows everything so the rest get more shots. Arrows are cheap and steady.</p>
      <div class="acts"><button class="btn primary" data-act="close" type="button">Got it</button></div>`;
  }
  function endScreen(won) {
    cancelSpeed();
    showOverlay(`<span class="eyebrow">${won ? 'The keep stands' : 'The keep has fallen'}</span><h2>${won ? 'You held all 10 waves.' : 'Lost on wave ' + (G.wave + 1) + '.'}</h2>
      <div class="endstats"><div><b>${G.stats.kills}</b><span>Kills</span></div><div><b>${G.stats.wavesCleared}</b><span>Waves held</span></div><div><b>${G.cards.length}</b><span>Cards</span></div></div>
      ${G.cards.length ? `<p class="muted" style="font-size:14px">Your deck: ${G.cards.map((c) => esc(c.name)).join(', ')}</p>` : ''}
      <p>${won ? 'That’s the whole first slice. Want to run it back and try a different deck?' : 'Every run is different: new cards, same road. Try a different build.'}</p>
      <div class="acts"><button class="btn" data-act="feedback" type="button">Give feedback</button><button class="btn primary" data-act="again" type="button">Play again</button></div>`);
    renderAll();
  }
  function cancelSpeed() { ui.speed = 1; }

  // ---------- feedback ----------
  const FQ = [
    { id: 'fun', q: 'Did you want to play a second run?', opts: ['Yes, right away', 'Maybe later', 'No'] },
    { id: 'draft', q: 'Did the card draft feel like a real choice?', opts: ['Yes', 'Sometimes', 'No'] },
    { id: 'grow', q: 'The road growing: good surprise or annoying?', opts: ['Loved it', 'Fine', 'Annoying'] },
    { id: 'hard', q: 'Difficulty?', opts: ['Too easy', 'About right', 'Too hard'] },
    { id: 'watch', q: 'Watching the wave: tense or boring?', opts: ['Tense', 'OK', 'Boring'] },
    { id: 'read', q: 'Could you tell towers and enemies apart?', opts: ['Always', 'Mostly', 'No'] },
  ];
  function feedbackHTML() {
    const qs = FQ.map((f) => `<div class="field"><label>${esc(f.q)}</label><div class="choices">${f.opts.map((o) => `<button class="btn" type="button" data-fq="${f.id}" data-fv="${esc(o)}" aria-pressed="${FB.q[f.id] === o}">${esc(o)}</button>`).join('')}</div></div>`).join('');
    const summary = feedbackText();
    return `<h2>What did you think?</h2><p class="muted">Six taps plus anything you want to say. Goes to Hunter and Joe.</p>${qs}
      <div class="field"><label for="fbText">What was confusing, or what would you change?</label><textarea id="fbText" rows="3">${esc(FB.text)}</textarea></div>
      <div class="field"><label for="fbName">Your name (optional)</label><input id="fbName" type="text" value="${esc(FB.nm)}"></div>
      ${FB.saved === true ? '<p style="color:var(--good);font-weight:700">Saved. Thank you!</p>' : FB.saved === 'copy' ? `<p class="muted">Couldn’t save from this device, so copy your answers and text them over:</p><div class="copybox" id="fbCopy">${esc(summary)}</div>` : ''}
      <div class="acts">${FB.saved === 'copy' ? '<button class="btn" data-act="fbcopy" type="button">Copy answers</button>' : ''}<button class="btn" data-act="close" type="button">Close</button>${FB.saved !== true ? '<button class="btn primary" data-act="fbsend" type="button">Send</button>' : ''}</div>`;
  }
  function feedbackText() { const lines = FQ.map((f) => `${f.q} ${FB.q[f.id] || '–'}`); lines.push(`Notes: ${FB.text || '–'}`); lines.push(`From: ${FB.nm || 'anonymous'} · seed ${G.seed} · waves held ${G.stats.wavesCleared} · cards ${G.cards.map((c) => c.id).join(',')}`); return 'Tower Defense P1 feedback\n' + lines.join('\n'); }
  async function sendFeedback() {
    const ta = $('#fbText'), nm = $('#fbName'); if (ta) FB.text = ta.value; if (nm) FB.nm = nm.value;
    const body = { answers: Object.assign({}, FB.q), notes: FB.text, name: FB.nm, seed: G.seed, waves: G.stats.wavesCleared, phase: G.phase, cards: G.cards.map((c) => c.id), at: new Date().toISOString() };
    try {
      const db = window.claude && window.claude.use ? await window.claude.use('db') : null;
      if (!db) throw new Error('no db');
      await db.collection('feedback').add(body); FB.saved = true;
    } catch (e) {
      try { const r = await fetch('/forge/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ game: 'tower-defense' }, body)) }); FB.saved = r.ok ? true : 'copy'; } catch (e2) { FB.saved = 'copy'; }
    }
    ui.feedbackDone = true; showOverlay(feedbackHTML());
  }

  // ---------- bot sim (in-page) ----------
  const sim = { res: null, running: false };
  function simHTML() {
    const r = sim.res;
    return `<h2>Bot simulation</h2><p class="muted">Three bots play the whole run with no screen on the same engine. Smart reads the wave preview; Random is a sloppy player.</p>
      ${r ? `<ul>${r.map((x) => `<li><b>${x.style}:</b> wins ${x.wins}%, median waves held ${x.med}, leaks per game ${x.leaks}</li>`).join('')}</ul>` : '<p>Not run yet.</p>'}
      <div class="acts"><button class="btn" data-act="close" type="button">Close</button><button class="btn primary" data-act="runsim" type="button" ${sim.running ? 'disabled' : ''}>${sim.running ? 'Running…' : 'Run 60 games each'}</button></div>`;
  }
  function runSim() {
    sim.running = true; showOverlay(simHTML());
    setTimeout(() => {
      const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
      sim.res = ['smart', 'saver', 'random'].map((style) => { const r = TD.simulate(60, 4242, style); return { style, wins: Math.round(100 * r.wins / 60), med: q(r.waves, .5), leaks: (r.leaks / 60).toFixed(1) }; });
      sim.running = false; showOverlay(simHTML());
    }, 30);
  }

  // ---------- intro ----------
  const SCENES = [
    () => `<div class="hero rise">${HERO_SVG()}</div><h1 class="title rise d1">Tower Defense</h1><p class="lead rise d2">Hold the road. Draft a deck. Build a keep worth holding.</p><p class="copy rise d3">Prototype 1: one road that grows, four towers, ten waves. Solo for now; co-op is next.</p>`,
    () => `<span class="eyebrow rise">Four towers</span><div class="legend rise d1">${Object.entries(TD.TOWERS).map(([k, t]) => `<div>${towerIcon(k).replace('width="40" height="40"', 'width="48" height="48"')}${esc(t.name)}</div>`).join('')}</div><p class="lead rise d2">Each has two upgrade paths. Pick one.</p><p class="copy rise d3">Arrows are cheap and steady. Cannons crack armor but can’t hit flyers. Spark chains through packs and loves flyers. Frost slows everything.</p>`,
    () => `<span class="eyebrow rise">Five enemies</span><div class="legend five rise d1">${['grunt', 'runner', 'flyer', 'brute', 'boss'].map((k) => `<div>${enemyIcon(k)}${esc(TD.ENEMIES[k].name)}</div>`).join('')}</div><p class="lead rise d2">Each one that reaches the keep costs you health.</p><p class="copy rise d3">The next wave is always shown before you send it. Build the counter.</p>`,
    () => `<span class="eyebrow rise">After every wave</span><div class="cards rise d1" style="width:100%;max-width:420px">${['sharp', 'tithe', 'walls'].map((id) => { const c = TD.CARDS.find((x) => x.id === id); return `<div class="card ${c.kind}"><span class="kind">${c.kind}</span><b>${esc(c.name)}</b><small>${esc(c.text)}</small></div>`; }).join('')}</div><p class="lead rise d2">Draft one card. Your deck is your build.</p><p class="copy rise d3">And twice per run, the road grows: the keep moves out and new spots open.</p>`,
  ];
  function enemyIcon(type) { const c = document.createElement('canvas'); c.width = c.height = 96; const ctx = c.getContext('2d'); A.enemyArt(ctx, type, 48, 54, 80, 0.3, 1, false); return `<img src="${c.toDataURL()}" alt="${esc(TD.ENEMIES[type].name)}" width="48" height="48">`; }
  function HERO_SVG() {
    const c = document.createElement('canvas'); c.width = 480; c.height = 270; const ctx = c.getContext('2d'); const s = 40;
    const g = TD.newGame(7); g.stage = 2;
    ctx.fillStyle = '#D9C9C0'; ctx.fillRect(0, 0, 480, 270);
    ctx.save(); ctx.translate(0, -30);
    const pathSet = new Set(TD.path(g).map(([x, y]) => x + ',' + y));
    for (let r = 0; r < 8; r++) for (let cc = 0; cc < 12; cc++) { if (pathSet.has(cc + ',' + r)) A.road(ctx, cc * s, r * s, s, cc * 7 + r * 13); else A.grass(ctx, cc * s, r * s, s, cc * 7 + r * 13); }
    [['arrow', 1, 2], ['cannon', 3, 3], ['spark', 6, 4], ['frost', 9, 4], ['arrow', 10, 3]].forEach(([t, cc, r]) => A.towerArt(ctx, t, cc * s, r * s - 4, s, 1, null, false));
    const [kx, ky] = TD.keep(g); A.keepArt(ctx, kx * s, ky * s - 4, s, false);
    [['grunt', 0.5, 3], ['grunt', 1.6, 3], ['runner', 2.5, 2], ['brute', 4.2, 1.9], ['flyer', 5, 4.6]].forEach(([t, x, y]) => A.enemyArt(ctx, t, (x + .5) * s, (y + .5) * s, s, 0.4, 1, false));
    ctx.restore();
    return `<img src="${c.toDataURL()}" alt="A road winding to a small keep, lined with towers">`;
  }
  function showIntro(i) {
    ui.lesson = i; const s = $('#story'); s.hidden = false;
    const last = i === SCENES.length - 1;
    s.innerHTML = `<div class="story-in">${SCENES[i]()}<div class="dots">${SCENES.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div>
      <div style="display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap"><button class="skip" data-act="skipintro" type="button">Skip</button><button class="btn primary" data-act="${last ? 'skipintro' : 'next'}" ${last ? '' : 'data-s="next"'} type="button">${last ? 'Start the run' : 'Next'}</button></div></div>`;
    s.scrollTop = 0;
  }
  function hideStory() { const s = $('#story'); s.hidden = true; s.innerHTML = ''; }

  // ---------- boot ----------
  ui.coach = lsGet('td-coach') !== '0';
  $('#bMenu').addEventListener('click', () => showOverlay(menuHTML()));
  G = TD.newGame(1); // placeholder so draw() has state before the first run
  showIntro(0);
  window.TDUI = { get G() { return G; }, ui, newRun, tapCell, showIntro, hideStory, renderAll };
})();
