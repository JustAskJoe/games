// ─── Touch controls (phones and tablets) ───
// Turn on with the first touch, or straight away on a touch-only device. Landscape only.
// - Fights and the farm: a floating stick wherever the left thumb lands (left half of the screen).
//   Fights: the HUD's ability and potion belt sit bottom-right and are tapped; a pause button top-right.
//   Farm: an ACT button (Enter) bottom-right; the prompt above it can be tapped too.
// - Menus: tap a row to pick it, tap it again to use it (lists with a detail panel; plain buttons act on one tap).
//   The keys a screen's hints name (ESC, TAB, U, E, S, G, R, L, C, 1-5) become big buttons in a column on the right.
const STICK_R = 56;   // screen px from the stick's centre to full speed
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };

// Movement from the keyboard or the stick: a unit direction and a speed from 0 to 1.
function moveInput() {
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1;
  let len = Math.hypot(dx, dy);
  if (len) return { dx: dx / len, dy: dy / len, mag: 1 };
  if (stick.id !== null) {
    dx = stick.x - stick.ox; dy = stick.y - stick.oy; len = Math.hypot(dx, dy);
    if (len > 8) return { dx: dx / len, dy: dy / len, mag: Math.max(0.35, Math.min(1, len / STICK_R)) };
  }
  return { dx: 0, dy: 0, mag: 0 };
}

function safeInsets() {
  const p = $('tc-probe'), cs = getComputedStyle(p);
  return { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0 };
}
function enableTouch() {
  if (touchMode) return;
  touchMode = true; document.documentElement.classList.add('touch');
  fitStage();
}
addEventListener('pointerdown', e => { lastPointer = e.pointerType || 'mouse'; if (lastPointer === 'touch') enableTouch(); }, true);
addEventListener('touchstart', () => { lastPointer = 'touch'; enableTouch(); }, { capture: true, passive: true });
if (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches) enableTouch();

// A key press from a touch button goes through the same handler as the keyboard.
function sendKey(key) {
  dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

// ─── The stick ───
(function wireStick() {
  const zone = $('tc-zone'), base = $('tc-base'), knob = $('tc-knob');
  const draw = () => {
    const on = stick.id !== null; base.hidden = !on; if (!on) return;
    let dx = stick.x - stick.ox, dy = stick.y - stick.oy; const l = Math.hypot(dx, dy);
    if (l > STICK_R) { dx *= STICK_R / l; dy *= STICK_R / l; }
    base.style.transform = 'translate(' + (stick.ox - 64) + 'px,' + (stick.oy - 64) + 'px)';
    knob.style.transform = 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px)';
  };
  zone.addEventListener('pointerdown', e => {
    if (stick.id !== null) return;
    e.preventDefault(); zone.setPointerCapture(e.pointerId);
    stick.id = e.pointerId; stick.ox = stick.x = e.clientX; stick.oy = stick.y = e.clientY; draw();
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== stick.id) return;
    stick.x = e.clientX; stick.y = e.clientY;
    // drag past the rim and the stick follows the thumb
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, l = Math.hypot(dx, dy);
    if (l > STICK_R * 1.5) { const k = (l - STICK_R * 1.5) / l; stick.ox += dx * k; stick.oy += dy * k; }
    draw();
  });
  const end = e => { if (e.pointerId === stick.id) { stick.id = null; draw(); } };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
  window.releaseStick = () => { stick.id = null; draw(); };
})();

// ─── Buttons: ability, potions, pause, act ───
$('hud').addEventListener('pointerdown', e => {
  if (!touchMode || state !== 'playing') return;
  const belt = e.target.closest('#hud-belt .slot');
  if (belt) { e.preventDefault(); drinkPotion([...belt.parentNode.children].indexOf(belt)); return; }
  if (e.target.closest('.ability')) { e.preventDefault(); useAbility(); }
});
$('tc-pause').addEventListener('click', () => { if (state === 'playing') { releaseStick(); pauseGame(); } });
$('tc-act').addEventListener('pointerdown', e => { e.preventDefault(); if (state === 'farm' && !farmShopOpen) farmAction(); });
$('farm-prompt').addEventListener('click', () => { if (touchMode && state === 'farm' && !farmShopOpen) farmAction(); });

// ─── Key column for menus: built from the hints on the screen that is showing ───
const KEY_NAMES = { 'ESC': 'Escape', 'TAB': 'Tab', 'ENTER': 'Enter', 'SPACE': ' ', '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' };
const KEY_SKIP = new Set(['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);   // taps do these
let tcKeysSig = '';
function screenKeys(scr) {
  const out = [], seen = new Set();
  const tapPicks = scr.id === 'classes' || scr.id === 'levelup';   // their number keys are the cards, which are tapped
  // ENTER gets a button where a tap only picks (cards, lists with a detail panel), to use the picked one
  const okKey = tapPicks || !!(menu && menu.onSelect);
  const add = (key, label) => { if ((!KEY_SKIP.has(key) || (okKey && key === 'Enter')) && !seen.has(key)) { seen.add(key); out.push({ key, label }); } };
  for (const k of scr.querySelectorAll('.hint .key, .bfoot .key, .desc .key')) {
    const t = k.textContent.trim(), key = KEY_NAMES[t] || (t.length === 1 ? t.toLowerCase() : null);
    if (!key || (tapPicks && /^\d$/.test(key))) continue;
    // the words after the key, up to the next key
    let label = '', n = k.nextSibling;
    for (; n && !(n.nodeType === 1 && n.classList.contains('key')); n = n.nextSibling) label += n.textContent;
    // "1-5": every number in the range
    if (/^\d$/.test(key) && label.trim() === '-' && n && /^\d$/.test(n.textContent.trim())) {
      const to = +n.textContent.trim();
      for (let d = +key; d <= to; d++) add(String(d), '');
      continue;
    }
    label = label.split('·')[0].replace(/^[\s+\-/]+|[\s+\-/]+$/g, '').replace(/^TO /, '').replace(/\.$/, '').trim();
    if (key === 'Escape' && (!label || /GO BACK/.test(label))) label = 'BACK';
    if (key === 'Escape' && /SKIP/.test(label)) label = 'SKIP';
    if (key === 'Enter' && !label) label = 'TAKE';
    add(key, label.length > 12 ? label.split(' ')[0] : label);
  }
  // Escape (back) at the top, then Enter, numbers in a row at the bottom
  const rank = k => k === 'Escape' ? 0 : k === 'Enter' ? 1 : /^\d$/.test(k) ? 3 : 2;
  return out.sort((a, b) => rank(a.key) - rank(b.key));
}
function updateKeyColumn() {
  const col = $('tc-keys');
  const scr = touchMode && !$('stage').hidden ? document.querySelector('#stage .screen:not([hidden])') : null;
  const list = scr ? screenKeys(scr) : [];
  const sig = list.map(k => k.key + ':' + k.label).join('|');
  if (sig === tcKeysSig) return;
  tcKeysSig = sig; col.innerHTML = ''; col.hidden = !list.length;
  for (const k of list) {
    const b = document.createElement('button');
    const face = k.key === 'Escape' ? 'ESC' : k.key === 'Tab' ? 'TAB' : k.key === ' ' ? 'SPACE' : k.key.toUpperCase();
    b.className = 'tck' + (/^\d$/.test(k.key) ? ' num' : '') + (k.key === 'Escape' ? ' back' : '') + (k.key === 'Enter' ? ' ok' : '');
    b.innerHTML = k.label ? '<span>' + esc(k.label) + '</span><small>' + face + '</small>' : '<span>' + face + '</span>';
    b.addEventListener('click', () => sendKey(k.key));
    col.appendChild(b);
  }
}

// Called every frame from main.js: which controls show.
function touchTick() {
  const portrait = touchMode && innerHeight > innerWidth;
  $('tc-rotate').hidden = !portrait;
  if (portrait && state === 'playing') { releaseStick(); pauseGame(); }
  const play = state === 'playing', farm = state === 'farm' && !farmShopOpen;
  const show = touchMode && (play || farm);
  $('touch').hidden = !show;
  if (!show && stick.id !== null) releaseStick();
  if (show) {
    $('tc-pause').hidden = !play; $('tc-act').hidden = !farm;
    if (farm) $('tc-act').classList.toggle('off', !farmInteract);
  }
  updateKeyColumn();
}
