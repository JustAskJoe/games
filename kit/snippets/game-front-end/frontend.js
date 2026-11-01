// Studio game front end: opening (with FX), title menu, 3 save slots, settings, credits, pause menu.
// Reusable: a game sets root.FE_CONFIG (words, art, colors, ticker lines, save key, slot summary) and gives
// CTUI.screen, CTUI.slot, CTUI.startSlot(n, fresh) and CTUI.save(). Needs fx.js (FX) and a MUSIC object with start/stop/sting.
// Saves live in this browser's localStorage (one key per slot). Everything here survives missing or blocked storage.
// The kit copy is kit/snippets/game-front-end/; Intergalactic Card Trader is the first user.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';
const C = Object.assign({ id: 'game', presenter: 'JustAskJoe', title1: 'GAME', title2: 'TITLE', tagline: '', keyart: '', slotsBg: '', settingsBg: '', creditsBg: '',
  colors: ['#FF2E93', '#19D3F0', '#A6F01E', '#FFD21F', '#8B5CF6'], ticker: [], tickerLabel: 'ON AIR', credits: '', load: null,
  slotLine: G => ({ top: 'SAVED GAME', name: '', stats: [], done: false }) }, root.FE_CONFIG || {});
const KEY = n => C.id + '.slot' + n, SETTINGS = C.id + '.settings';
const store = {
  get(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { root.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { root.localStorage.removeItem(k); } catch (e) { /* storage blocked: nothing to delete */ } },
};
const FE = { settings: { music: true, sfx: true, calm: false }, confirm: null, pause: false, inSettings: false, config: C };
try { Object.assign(FE.settings, JSON.parse(store.get(SETTINGS) || '{}')); } catch (e) { /* bad settings: keep defaults */ }
function saveSettings() { store.set(SETTINGS, JSON.stringify(FE.settings)); applySettings(); }
function applySettings() {
  document.body.classList.toggle('calm', !!FE.settings.calm);
  if (!FE.settings.music && MUSIC.on) MUSIC.stop();
}

// ---------- slots ----------
function readSlot(n) {
  const raw = store.get(KEY(n)); if (!raw) return null;
  try { const s = JSON.parse(raw); s.G = C.load ? C.load(s.G) : s.G; return s; } catch (e) { return { broken: true }; }
}
function writeSlot(n, G) { return store.set(KEY(n), JSON.stringify({ savedAt: Date.now(), G })); }
function ago(t) { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; }
function storageOK() { try { const k = C.id + '.test'; root.localStorage.setItem(k, '1'); root.localStorage.removeItem(k); return true; } catch (e) { return false; } }

// ---------- screens ----------
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function logo(big) {
  const word = (w, cls, base) => w.split('').map((ch, i) => `<span class="lt ${cls}" style="animation-delay:${(big ? base : 0) + i * 0.045}s">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  return `<div class="logo ${big ? 'big' : ''}"><div class="l1">${word(C.title1, 'a', 1.95)}</div><div class="l2">${word(C.title2, 'b', 2.55)}</div>
    ${C.tagline ? `<div class="l3 tag">${esc(C.tagline)}</div>` : ''}<div class="sweep"></div></div>`;
}
function flyingCards() {
  let s = ''; for (let i = 0; i < 9; i++) s += `<div class="flycard" style="top:${8 + (i * 37) % 80}%;animation-delay:${3.0 + i * 0.35}s;animation-duration:${3.2 + (i % 3)}s;--rot:${(i % 2 ? 1 : -1) * (200 + i * 40)}deg;background:${C.colors[i % C.colors.length]}"></div>`;
  return s;
}
function opening() {
  return `<div class="fe opening" data-act="fe-press">
    <div class="par" data-depth="14"><div class="bg pan" style="background-image:url(${C.keyart})"></div></div>
    <div class="speed"></div><div class="vignette"></div>
    <div class="halftone-wipe"></div><div class="rgb-flash"></div>
    <div class="presents"><div class="spray tag">${esc(C.presenter)}</div><div class="pr">presents</div></div>
    <div class="band b1"></div><div class="band b2"></div>
    ${flyingCards()}
    <div class="shock"></div>
    <div class="par" data-depth="-20"><div class="logo-wrap">${logo(true)}</div></div>
    <div class="press">PRESS START</div>
  </div>`;
}
function title() {
  const t = C.ticker.map(esc).join(' ★ ') + ' ★ ';
  return `<div class="fe title">
    <div class="par" data-depth="10"><div class="bg pan slow" style="background-image:url(${C.keyart})"></div></div><div class="vignette"></div>
    <div class="par" data-depth="-8"><div class="logo-wrap small">${logo(false)}</div></div>
    <div class="menu">
      <button class="mbtn pink" data-act="fe-slots" style="--d:0s">START</button>
      <button class="mbtn cyan" data-act="fe-settings" style="--d:.08s">SETTINGS</button>
      <button class="mbtn lime" data-act="fe-credits" style="--d:.16s">CREDITS</button>
    </div>
    ${C.ticker.length ? `<div class="marquee"><div class="onair">${esc(C.tickerLabel)}</div><div class="track"><span>${t}</span><span>${t}</span></div></div>` : ''}
  </div>`;
}
function slots() {
  const cards = [1, 2, 3].map(n => {
    const s = readSlot(n), tilt = n === 2 ? 1.5 : -1.5;
    let body;
    if (!s) body = `<div class="empty">EMPTY</div><div class="row"><button class="btn pink" data-act="fe-new" data-slot="${n}">NEW GAME</button></div>`;
    else if (s.broken) body = `<div class="empty">CORRUPT SAVE</div><div class="row"><button class="btn white" data-act="fe-del" data-slot="${n}">DELETE</button></div>`;
    else {
      const L = C.slotLine(s.G);
      body = `<div class="sv-day">${esc(L.top)}</div><div class="sv-name">${esc(L.name)}</div>
        <div class="sv-stats">${L.stats.map(x => `<span>${esc(x)}</span>`).join('')}</div>
        <div class="sv-when">saved ${ago(s.savedAt)}</div>
        <div class="row"><button class="btn pink" data-act="fe-continue" data-slot="${n}">${L.done ? 'VIEW' : 'CONTINUE'}</button></div>
        <div class="row"><button class="btn sm white" data-act="fe-new" data-slot="${n}">NEW</button><button class="btn sm white" data-act="fe-del" data-slot="${n}">DELETE</button></div>`;
    }
    return `<div class="slot" style="--tilt:${tilt}deg;--d:${n * 0.08}s"><div class="slot-n">0${n}</div>${body}</div>`;
  }).join('');
  return `<div class="fe slots"><div class="bg" style="background-image:url(${C.slotsBg || C.keyart})"></div><div class="vignette heavy"></div>
    <div class="fe-h">PICK A SAVE</div><div class="slot-row">${cards}</div>
    <button class="btn white back" data-act="fe-title">◀ BACK</button>
    ${storageOK() ? '' : '<div class="warn">This browser is blocking storage, so saves won\'t survive a reload.</div>'}</div>`;
}
function toggle(key, label, hint) {
  const on = !!FE.settings[key];
  return `<button class="toggle" data-act="fe-toggle" data-key="${key}" aria-pressed="${on}"><span class="tl">${label}<small>${hint}</small></span><span class="sw ${on ? 'on' : ''}"><span></span></span></button>`;
}
function settingsPanel() {
  return `<div class="panel fe-panel">
    <div class="fe-h sm">SETTINGS</div>
    ${toggle('music', 'Music', 'The background beat')}
    ${toggle('sfx', 'Sound effects', 'Stings for deals, rips and reveals')}
    ${toggle('calm', 'Reduced motion', 'No shakes, spins or scrolling text')}
    <button class="btn pink" data-act="${FE.inSettings ? 'fe-pause' : 'fe-title'}">◀ BACK</button></div>`;
}
function settings() { return `<div class="fe set"><div class="bg" style="background-image:url(${C.settingsBg || C.keyart})"></div><div class="vignette heavy"></div>${settingsPanel()}</div>`; }
function credits() {
  return `<div class="fe set"><div class="bg" style="background-image:url(${C.creditsBg || C.keyart})"></div><div class="vignette heavy"></div>
    <div class="panel fe-panel"><div class="fe-h sm">CREDITS</div>${C.credits}
      <p class="muted">© 2026 justaskjoe. All rights reserved.</p>
      <button class="btn pink" data-act="fe-title">◀ BACK</button></div></div>`;
}
function pause() {
  return `<div id="pause"><div class="panel fe-panel"><div class="fe-h sm">PAUSED</div>
    <button class="btn pink" data-act="fe-resume">RESUME</button>
    <button class="btn cyan" data-act="fe-settings">SETTINGS</button>
    <button class="btn white" data-act="fe-quit">SAVE &amp; QUIT TO TITLE</button>
    <div class="muted" style="font-size:13px">Slot ${CTUI.slot}: the game saves itself after every move.</div></div></div>`;
}
function confirmBox() {
  const c = FE.confirm; if (!c) return '';
  return `<div id="pause"><div class="panel fe-panel"><div class="fe-h sm">SURE?</div><p>${esc(c.text)}</p>
    <div class="row"><button class="btn pink" data-act="fe-yes">${esc(c.yes)}</button><button class="btn white" data-act="fe-no">CANCEL</button></div></div></div>`;
}
function render() {
  const s = CTUI.screen;
  const html = s === 'opening' ? opening() : s === 'title' ? title() : s === 'slots' ? slots() : s === 'settings' ? settings() : s === 'credits' ? credits() : '';
  return html + confirmBox();
}
// Drawn on top of the game screen: pause menu, settings opened from pause, confirm.
function overlay() { if (FE.inSettings) return `<div id="pause">${settingsPanel()}</div>`; if (FE.pause) return pause(); return confirmBox(); }

// ---------- opening FX: spray, spark bursts, screen shake, mouse parallax ----------
let fxTimers = [];
function afterRender() {
  fxTimers.forEach(clearTimeout); fxTimers = [];
  const st = document.getElementById('stage'); if (!st || !root.FX) return;
  const calm = FE.settings.calm;
  if (CTUI.screen === 'opening' && !calm && !FE.played) {
    FE.played = true; FX.mount(st);
    fxTimers.push(setTimeout(() => FX.spray(470, 320, 340, C.colors), 120));
    fxTimers.push(setTimeout(() => FX.burst(640, 330, 60, C.colors, 10), 1300));
    fxTimers.push(setTimeout(() => { FX.burst(640, 380, 150, C.colors, 17); FX.shake(st); FX.ring(640, 380); }, 2700));
  }
  FX.parallax((CTUI.screen === 'opening' || CTUI.screen === 'title') && !calm ? st : null);
}

// Returns true when it handled the click.
function click(el) {
  const a = el.dataset.act, n = +el.dataset.slot;
  switch (a) {
    case 'fe-press': if (FE.settings.music) MUSIC.start(); CTUI.screen = 'title'; return true;
    case 'fe-title': FE.pause = false; FE.inSettings = false; CTUI.screen = 'title'; return true;
    case 'fe-slots': CTUI.screen = 'slots'; return true;
    case 'fe-settings': if (FE.pause) { FE.inSettings = true; FE.pause = false; } else CTUI.screen = 'settings'; return true;
    case 'fe-credits': CTUI.screen = 'credits'; return true;
    case 'fe-toggle': { const k = el.dataset.key; FE.settings[k] = !FE.settings[k]; saveSettings(); if (k === 'music' && FE.settings.music) MUSIC.start(); return true; }
    case 'fe-new':
      if (readSlot(n)) { FE.confirm = { text: 'Start over in slot ' + n + '? The save there will be replaced.', yes: 'START OVER', run: () => CTUI.startSlot(n, true) }; return true; }
      CTUI.startSlot(n, true); return true;
    case 'fe-continue': CTUI.startSlot(n, false); return true;
    case 'fe-del': FE.confirm = { text: 'Delete the save in slot ' + n + '? This can\'t be undone.', yes: 'DELETE', run: () => store.del(KEY(n)) }; return true;
    case 'fe-yes': { const r = FE.confirm.run; FE.confirm = null; r(); return true; }
    case 'fe-no': FE.confirm = null; return true;
    case 'fe-menu': FE.pause = true; return true;
    case 'fe-pause': FE.inSettings = false; FE.pause = true; return true;
    case 'fe-resume': FE.pause = false; FE.inSettings = false; return true;
    case 'fe-quit': CTUI.save(); FE.pause = false; FE.inSettings = false; CTUI.screen = 'title'; return true;
  }
  return false;
}

Object.assign(FE, { render, click, overlay, afterRender, readSlot, writeSlot, apply: applySettings });
root.FE = FE;
})(this);
