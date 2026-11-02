// Lightkeeper UI: input, sheets, HUD, save, feedback. Every player action goes through LK.act().
// © 2026 justaskjoe. All rights reserved.
(function () {
  'use strict';
  const LK = window.LK, R = window.LKR, A = window.LKA;
  const $ = id => document.getElementById(id);
  const cv = $('cv'), sheet = $('sheet'), card = $('card');
  const SAVE_KEY = 'lightkeeper-v1';
  const VERSION = 'v1';

  function readSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && Array.isArray(s.stars)) return s; } catch (e) {} return { stars: LK.NIGHTS.map(() => 0), sound: true }; }
  function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(U.save)); } catch (e) {} }

  const U = {
    G: LK.create(0, 1), mode: 'title', night: 0, save: readSave(), speed: 1, test: false,
    acc: 0, last: 0, wakes: {}, fx: [], fb: {}, lastRes: null, keys: {}, down: false, toastT: 0, seed: 1,
  };
  A.setOn(U.save.sound !== false);

  const unlocked = i => U.test || i === 0 || U.save.stars[i - 1] > 0;
  const fmtT = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const starStr = n => '★'.repeat(n) + '<span class="off">' + '★'.repeat(3 - n) + '</span>';
  const TWIST = [
    'Drag anywhere to swing the beam. A lit boat turns toward the lighthouse.',
    'Dotted lines show where a dark boat is heading. Light her only once that line is clear of rocks.',
    'A boat pointing at you keeps coming in the dark. Point one, then move to the next.',
    'The current pushes boats east, even ones you already pointed home.',
    'You can only see a boat when your light finds her. Watch for faint lantern glimmers.',
    'Gusts knock dark boats off course. Lit boats hold steady. The horn buys time.',
  ];

  // ---------- sheets ----------
  function showSheet(html) { card.innerHTML = html; sheet.hidden = false; card.scrollTop = 0; sheet.scrollTop = 0; }
  function hideSheet() { sheet.hidden = true; }
  function setHud(on) { ['hudL', 'hudR', 'menuBtn', 'hornBtn'].forEach(id => { $(id).hidden = !on; }); }

  function titleScreen() {
    U.mode = 'title'; setHud(false); U.G = LK.create(0, 1); U.wakes = {};
    const total = U.save.stars.reduce((a, b) => a + b, 0);
    showSheet(`<span class="tag">Prototype ${VERSION} · six nights</span>
      <h1>Light<em>keeper</em></h1>
      <p>Boats are coming home in the dark, and your lamp is the only thing they can see. Sweep the beam: every boat in your light turns toward the harbor. Every boat in the dark holds her course.</p>
      <button class="btn pri" data-act="nights" type="button">${total ? 'Choose a night' : 'Light the lamp'}</button>
      <button class="btn" data-act="how" type="button">How to play</button>
      <div class="row"><button class="btn sm" data-act="sound" type="button">Sound: ${A.on ? 'on' : 'off'}</button><button class="btn sm" data-act="feedback" type="button">Feedback</button></div>
      <div class="small">${total ? `${total} of 18 stars` : 'Sound on. One thumb.'} · © 2026 justaskjoe</div>`);
  }
  function howScreen() {
    showSheet(`<h2>How to keep the light</h2>
      <ul>
        <li><b>Drag anywhere</b> to swing the beam (arrow keys on a keyboard).</li>
        <li>A <b>lit boat turns toward you</b>. A <b>dark boat sails straight</b>, along her dotted line.</li>
        <li>You never steer a boat. You choose <b>when</b> to light her, so she clears the rocks first.</li>
        <li>Once a boat points at the lighthouse she keeps coming in the dark. Move on to the next one.</li>
        <li><b>Horn</b> (or Space) slows every boat for a moment. It needs a few seconds to recover.</li>
        <li>Three wrecks and the night is lost. Boats that sail off the edge are lost too.</li>
        <li>Stars: every boat home, no wrecks, under par time.</li>
      </ul>
      <button class="btn pri" data-act="nights" type="button">Choose a night</button>
      <button class="btn" data-act="title" type="button">Back</button>`);
  }
  function nightsScreen() {
    U.mode = 'title'; setHud(false);
    const btns = LK.NIGHTS.map((d, i) => `<button class="night" data-night="${i}" type="button" ${unlocked(i) ? '' : 'disabled'}>Night ${d.id}<small>${d.name}</small><span class="st">${unlocked(i) ? starStr(U.save.stars[i]) : 'locked'}</span></button>`).join('');
    showSheet(`<h2>Nights</h2><div class="nights">${btns}</div>
      <button class="btn" data-act="title" type="button">Back</button>
      ${U.test ? '<div class="small">Tester mode: every night is open. Runs are tagged in feedback.</div>' : ''}`);
  }
  function logScreen(i) {
    U.night = i; const d = LK.NIGHTS[i];
    showSheet(`<span class="tag">Night ${d.id} of ${LK.NIGHTS.length} · ${d.ships.length} boats</span>
      <h2>${d.name}</h2>
      <p class="log">${d.log}</p>
      <p>${TWIST[i]}</p>
      <button class="btn pri" data-act="start" type="button">Light the lamp</button>
      <button class="btn" data-act="nights" type="button">Back</button>`);
  }
  function pauseScreen() {
    if (U.mode !== 'play') return; U.mode = 'pause';
    showSheet(`<h2>Paused</h2><p>Night ${U.G.def.id}: ${U.G.def.name}. Home ${U.G.docked} of ${U.G.def.ships.length}.</p>
      <button class="btn pri" data-act="resume" type="button">Resume</button>
      <button class="btn" data-act="retry" type="button">Restart night</button>
      <button class="btn" data-act="nights" type="button">Nights</button>
      <div class="row"><button class="btn sm" data-act="sound" type="button">Sound: ${A.on ? 'on' : 'off'}</button><button class="btn sm" data-act="how" type="button">How to play</button></div>
      <button class="btn sm" data-act="tester" type="button">${U.test ? 'Tester mode is on' : 'Tester: open every night'}</button>`);
  }
  function resultsScreen() {
    const G = U.G, d = G.def, won = G.over === 'won';
    U.mode = 'done'; setHud(false); $('toast').classList.remove('on');
    if (won && !U.test) { U.save.stars[U.night] = Math.max(U.save.stars[U.night], G.stars); writeSave(); }
    U.lastRes = { night: d.id, won, stars: G.stars, home: G.docked, boats: d.ships.length, wrecks: G.wrecks, time: +G.t.toFixed(1), par: d.par, horns: G.log.filter(l => l[1] === 'horn').length };
    const last = U.night === LK.NIGHTS.length - 1;
    const head = won ? (G.wrecks === 0 ? 'Every boat home' : 'The light held') : 'A hard night';
    const msg = won ? (last ? 'You kept the light through all six nights. That is the whole prototype, thank you for playing.' : `${G.docked} of ${d.ships.length} boats made harbor.`)
      : 'Three boats were lost. The sea will be the same next time, so you can plan for it.';
    showSheet(`<span class="tag">Night ${d.id} · ${d.name}</span><h2>${head}</h2>
      <div class="stars">${starStr(won ? G.stars : 0)}</div>
      <p>${msg}</p>
      <div class="stat"><span>Home</span><b>${G.docked} / ${d.ships.length}</b></div>
      <div class="stat"><span>Wrecks</span><b>${G.wrecks}</b></div>
      <div class="stat"><span>Time</span><b>${fmtT(G.t)} (par ${fmtT(d.par)})</b></div>
      ${won && !last ? '<button class="btn pri" data-act="next" type="button">Next night</button>' : ''}
      <button class="btn ${won ? '' : 'pri'}" data-act="retry" type="button">${won ? 'Play it again' : 'Try again'}</button>
      <div class="row"><button class="btn sm" data-act="nights" type="button">Nights</button><button class="btn sm" data-act="feedback" type="button">Give feedback</button></div>`);
  }

  // ---------- feedback ----------
  const FQ = [
    { id: 'fun', q: 'How fun was it?', o: ['1', '2', '3', '4', '5'] },
    { id: 'clear', q: 'Did you get what the light does by Night 2?', o: ['Yes', 'Sort of', 'No'] },
    { id: 'again', q: 'Did you want to play another night?', o: ['Yes', 'Maybe', 'No'] },
    { id: 'hard', q: 'Difficulty?', o: ['Too easy', 'About right', 'Too hard'] },
  ];
  function feedbackScreen() {
    U.fb = {};
    const qs = FQ.map(f => `<div class="fq"><div class="q">${f.q}</div><div class="opts">${f.o.map(o => `<button type="button" data-fq="${f.id}" data-fv="${o}" aria-pressed="false">${o}</button>`).join('')}</div></div>`).join('');
    showSheet(`<h2>Quick feedback</h2><p>Tap what fits. One answer is enough.</p>${qs}
      <textarea id="fbNote" placeholder="Anything else? What confused you, what you loved."></textarea>
      <input type="text" id="fbName" placeholder="Your first name (optional)" maxlength="40">
      <div class="err" id="fbErr"></div>
      <button class="btn pri" data-act="fbSend" type="button">Send</button>
      <button class="btn" data-act="back" type="button">Back</button>`);
  }
  async function sendFeedback() {
    U.fb.note = ($('fbNote') || {}).value || ''; U.fb.name = ($('fbName') || {}).value || '';
    if (!FQ.some(f => U.fb[f.id])) { $('fbErr').textContent = 'Tap at least one answer first.'; return; }
    const body = { answers: Object.fromEntries(FQ.map(f => [f.id, U.fb[f.id] || null])), notes: U.fb.note, name: U.fb.name, result: U.lastRes, tester: U.test, version: VERSION, at: new Date().toISOString() };
    let ok = false;
    try { const db = window.claude && window.claude.use ? await window.claude.use('db') : null; if (db) { await db.collection('feedback').add(body); ok = true; } } catch (e) {}
    if (!ok && location.protocol !== 'file:') { try { const res = await fetch('/forge/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ game: 'lightkeeper' }, body)) }); ok = res.ok; } catch (e) {} }
    if (ok) showSheet(`<h2>Thank you</h2><p>Your answers went to the crew.</p><button class="btn pri" data-act="nights" type="button">Back to the nights</button><button class="btn" data-act="title" type="button">Title</button>`);
    else {
      const txt = 'Lightkeeper ' + VERSION + ' feedback\n' + FQ.map(f => f.q + ' ' + (U.fb[f.id] || '-')).join('\n') + '\nNotes: ' + (U.fb.note || '-') + '\nResult: ' + JSON.stringify(U.lastRes);
      showSheet(`<h2>Couldn't send</h2><p>This copy isn't connected to the Lab. Copy your answers and paste them to the crew.</p><textarea readonly id="fbCopy">${txt.replace(/</g, '&lt;')}</textarea><button class="btn pri" data-act="fbCopy" type="button">Copy answers</button><button class="btn" data-act="title" type="button">Title</button>`);
    }
  }

  // ---------- run ----------
  function startNight(i) {
    A.ensure(); A.startBed();
    U.night = i; U.G = LK.create(i, U.seed); U.wakes = {}; U.fx = []; U.acc = 0; U.mode = 'play';
    hideSheet(); setHud(true); hud(true);
    toast(LK.NIGHTS[i].name);
  }
  function resume() { if (U.mode === 'pause') { U.mode = 'play'; hideSheet(); } }

  function toast(text) { const t = $('toast'); t.textContent = text; t.classList.add('on'); U.toastT = performance.now() + 1900; }

  let hudKey = '';
  function hud(force) {
    const G = U.G, d = G.def;
    const key = [G.docked, G.wrecks, Math.floor(G.t), Math.ceil(G.horn.cd), U.night].join('|');
    if (key === hudKey && !force) return; hudKey = key;
    $('hudNight').textContent = `Night ${d.id} · ${d.name}`;
    $('hudDock').textContent = `Home ${G.docked} / ${d.ships.length}`;
    $('hudWreck').innerHTML = Array.from({ length: LK.MAX_WRECKS }, (_, i) => `<i class="${i < G.wrecks ? 'on' : ''}"></i>`).join('');
    $('hudTime').textContent = fmtT(G.t) + ' · par ' + fmtT(d.par);
    const hb = $('hornBtn'), cd = G.horn.cd;
    hb.disabled = cd > 0;
    $('hornLbl').textContent = cd > 0 ? Math.ceil(cd) + 's' : 'Horn';
    $('hornRing').style.boxShadow = cd > 0 ? 'none' : '0 0 0 2px rgba(255,190,92,.55)';
  }

  function drainEvents() {
    const G = U.G;
    for (const e of G.ev) {
      const s = e.id !== undefined ? G.ships[e.id] : null;
      if (e.k === 'dock') { s.endT = U.clock; U.fx.push({ k: 'dock', x: s.x, y: s.y, t0: U.clock }); A.bell(e.n - 1); toast(`${s.name} is home`); }
      else if (e.k === 'wreck') { if (s) s.endT = U.clock; U.fx.push({ k: 'wreck', x: e.x, y: e.y, t0: U.clock }); A.knock(); toast(e.both ? 'Two boats collided' : `${s.name} hit the rocks`); if (navigator.vibrate) try { navigator.vibrate(60); } catch (er) {} }
      else if (e.k === 'lost') { s.endT = U.clock; A.knock(); toast(`${s.name} is lost at sea`); }
      else if (e.k === 'horn') A.horn();
      else if (e.k === 'gust') A.gust();
      else if (e.k === 'spawn') A.tick();
      else if (e.k === 'over') { A.chord(e.won); setTimeout(resultsScreen, 1100); }
    }
    G.ev.length = 0;
  }

  // ---------- input ----------
  function aimAtScreen(px, py) {
    if (U.mode !== 'play') return;
    const w = R.toWorld(px, py); let a = Math.atan2(w.y - LK.LAMP.y, w.x - LK.LAMP.x);
    if (a > 0) a = a > Math.PI / 2 ? -Math.PI + 0.04 : -0.04;
    LK.act(U.G, { k: 'aim', a });
  }
  const game = $('game');
  game.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    A.ensure(); U.down = true; try { game.setPointerCapture(e.pointerId); } catch (er) {}
    aimAtScreen(e.clientX, e.clientY); e.preventDefault();
  });
  game.addEventListener('pointermove', e => { if (U.down || e.pointerType === 'mouse') aimAtScreen(e.clientX, e.clientY); });
  const up = () => { U.down = false; };
  game.addEventListener('pointerup', up); game.addEventListener('pointercancel', up);
  $('menuBtn').addEventListener('click', pauseScreen);
  $('hornBtn').addEventListener('click', () => { if (U.mode === 'play') LK.act(U.G, { k: 'horn' }); });
  addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') { U.keys[e.key] = true; e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'h') { if (U.mode === 'play') { LK.act(U.G, { k: 'horn' }); e.preventDefault(); } }
    else if (e.key === 'Escape' || e.key === 'p') { if (U.mode === 'play') pauseScreen(); else if (U.mode === 'pause') resume(); }
  });
  addEventListener('keyup', e => { delete U.keys[e.key]; });
  addEventListener('resize', () => R.resize());
  document.addEventListener('visibilitychange', () => { if (document.hidden && U.mode === 'play') pauseScreen(); });

  card.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.fq) { U.fb[b.dataset.fq] = b.dataset.fv; card.querySelectorAll(`[data-fq="${b.dataset.fq}"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
    if (b.dataset.night !== undefined) { logScreen(+b.dataset.night); return; }
    const a = b.dataset.act;
    if (a === 'nights') nightsScreen();
    else if (a === 'how') howScreen();
    else if (a === 'title') titleScreen();
    else if (a === 'start') startNight(U.night);
    else if (a === 'retry') startNight(U.night);
    else if (a === 'next') logScreen(U.night + 1);
    else if (a === 'resume') resume();
    else if (a === 'sound') { A.setOn(!A.on); U.save.sound = A.on; writeSave(); b.textContent = 'Sound: ' + (A.on ? 'on' : 'off'); if (A.on) { A.ensure(); A.startBed(); } }
    else if (a === 'tester') { U.test = true; b.textContent = 'Tester mode is on'; }
    else if (a === 'feedback') feedbackScreen();
    else if (a === 'fbSend') sendFeedback();
    else if (a === 'back') { if (U.lastRes && U.mode === 'done') resultsScreen(); else titleScreen(); }
    else if (a === 'fbCopy') { const ta = $('fbCopy'); ta.select(); try { navigator.clipboard.writeText(ta.value); b.textContent = 'Copied'; } catch (er) { try { document.execCommand('copy'); } catch (er2) {} } }
  });

  // ---------- loop ----------
  U.clock = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - (U.last || now)) / 1000); U.last = now; U.clock += dt;
    const G = U.G;
    if (U.mode === 'play') {
      const turn = (U.keys.ArrowLeft || U.keys.a ? -1 : 0) + (U.keys.ArrowRight || U.keys.d ? 1 : 0);
      if (turn) LK.act(G, { k: 'aim', a: G.beam.target + turn * 2.4 * dt });
      U.acc += dt * U.speed;
      while (U.acc >= LK.DT && !G.over) {
        LK.step(G); U.acc -= LK.DT;
        if (G.tick % 6 === 0) for (const s of G.ships) if (s.st === 'sail') { const w = U.wakes[s.id] || (U.wakes[s.id] = []); w.push([s.x, s.y]); if (w.length > 6) w.shift(); }
      }
      drainEvents(); hud();
    } else if (U.mode === 'title' || U.mode === 'done') {
      G.beam.a = -Math.PI / 2 + Math.sin(U.clock * 0.5) * 1.1;
    }
    if (U.toastT && now > U.toastT) { $('toast').classList.remove('on'); U.toastT = 0; }
    R.draw(G, U, U.clock, { demo: U.mode !== 'play' && U.mode !== 'pause' });
  }

  R.init(cv);
  titleScreen();
  requestAnimationFrame(frame);
  window.LKUI = { U, startNight, toScreen: R.toScreen, pauseScreen, resume };
})();
