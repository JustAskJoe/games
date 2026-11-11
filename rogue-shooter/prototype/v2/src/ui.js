// ─── Menus and HUD (DOM over the canvas, built to art/concepts/menus.html and menus-2.html) ───
const KEY = k => '<span class="key">' + k + '</span>';
const fmtTime = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const fmtNum = n => Math.round(n).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function slotHtml(name, s, cls, extra) { return '<div class="' + (cls || 'slot') + '">' + (name ? icon(name, s || 3) : '') + (extra || '') + '</div>'; }

function fitStage() {
  const fit = Math.min(innerWidth / 1280, innerHeight / 800);
  $('stage').style.setProperty('--k', fit >= 1 ? Math.floor(fit) : fit);
}
addEventListener('resize', fitStage);

// Shade and screen-edge effects per screen.
const SCREEN_LOOK = {
  title: { a: 0.42, vig: true }, classes: { a: 0.72 }, battlemap: { a: 0.55 }, levelup: { a: 0.66 }, stats: { a: 0.78 },
  pause: { a: 0.62 }, options: { a: 0.72 }, roundcomplete: { a: 0.7 }, runover: { a: 0.55, red: true }, victory: { a: 0.45, confetti: true }, farmshop: { a: 0.62 }
};
function screenDecor(id) {
  const l = SCREEN_LOOK[id];
  $('shade').hidden = !l; if (l) $('shade').style.setProperty('--a', l.a);
  $('vig').hidden = !(l && l.vig); $('redvig').hidden = !(l && l.red); $('confetti').hidden = !(l && l.confetti);
  menu = null;
}
function showNotification(text, color) {
  const el = $('notification'); $('notif-text').textContent = text;
  el.style.color = color || '#ffcc44'; el.hidden = false; notifTimer = 2.4;
}
let toastT = 0;
function toast(mat) {
  const el = $('toast'), m = MATERIALS[mat];
  el.innerHTML = icon(m.name, 2) + '<span>+1 ' + m.name.toUpperCase() + '<br><span class="dim">' + materials[mat] + ' TOTAL</span></span>';
  el.hidden = false; toastT = 1.8;
}

// ─── Menu navigation: a list of buttons, arrows to move, Enter to pick, mouse too ───
let menu = null;
function setMenu(items, o) {
  menu = Object.assign({ items, i: 0, axis: 'v' }, o || {});
  items.forEach((el, i) => {
    el.addEventListener('mouseenter', () => { if (!el.classList.contains('off')) selectMenu(i); });
    el.addEventListener('click', () => { if (!el.classList.contains('off') && el._act) el._act(); });
  });
  selectMenu(menu.i);
}
function selectMenu(i) {
  if (!menu || !menu.items.length) return;
  const n = menu.items.length; let k = (i + n) % n, guard = 0;
  while (menu.items[k].classList.contains('off') && guard++ < n) k = (k + (i < menu.i ? -1 : 1) + n) % n;
  menu.i = k; menu.items.forEach((el, j) => el.classList.toggle('sel', j === k));
  if (menu.onSelect) menu.onSelect(k);
}
function menuKey(e) {
  if (!menu) return false;
  const k = e.key;
  if (menu.cols) {
    const d = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1, ArrowUp: -menu.cols, w: -menu.cols, W: -menu.cols, ArrowDown: menu.cols, s: menu.cols, S: menu.cols }[k];
    if (d) { e.preventDefault(); const j = menu.i + d; if (j >= 0 && j < menu.items.length) selectMenu(j); return true; }
  }
  const prev = menu.axis === 'v' ? ['ArrowUp', 'w', 'W'] : ['ArrowLeft', 'a', 'A'], next = menu.axis === 'v' ? ['ArrowDown', 's', 'S'] : ['ArrowRight', 'd', 'D'];
  if (prev.includes(k)) { e.preventDefault(); selectMenu(menu.i - 1); return true; }
  if (next.includes(k)) { e.preventDefault(); selectMenu(menu.i + 1); return true; }
  if (k === 'Enter' || k === ' ') { e.preventDefault(); const el = menu.items[menu.i]; if (el && el._act && !el.classList.contains('off')) el._act(); return true; }
  return false;
}
function btn(label, act, cls, sub) {
  const d = document.createElement('div'); d.className = 'btn' + (cls ? ' ' + cls : '');
  d.innerHTML = label + (sub ? '<span class="sub">' + sub + '</span>' : ''); d._act = act; return d;
}

// ─── 1 Title ───
function buildTitle() {
  const s = $('title');
  s.innerHTML = '<div class="abs logo"><div class="word">ROGUE</div><div class="word two">SHOOTER</div><div class="tag">FIGHT · FARM · GROW</div></div>' +
    '<nav class="abs mainmenu panel" aria-label="Main menu"></nav><div class="abs lineup"></div>' +
    '<div class="abs corner" style="left:18px;bottom:18px">V2 PROTOTYPE</div>' +
    '<div class="abs hint" style="right:18px;bottom:12px">' + KEY('&uarr;') + KEY('&darr;') + ' CHOOSE ' + KEY('ENTER') + ' SELECT</div>';
  const nav = s.querySelector('.mainmenu');
  const items = [btn('NEW RUN', showCharSelect), btn('CONTINUE', null, 'off', 'NO SAVED RUN'), btn('OPTIONS', () => showOptions('title'))];
  items.forEach(b => nav.appendChild(b)); setMenu(items);
  const line = s.querySelector('.lineup');
  Object.keys(CHARS).forEach(id => { const e = heroUiSprite(id, 'front', true); line.appendChild(e.c); });
}

// ─── 2 Class select ───
const STAT_ROWS = [['HP', 'hp', 150, '#c0402f'], ['POW', 'pow', 150, '#f08a2a'], ['SPD', 'spd', 150, '#5fe0c8'], ['ATK', 'atk', 150, '#ffcc44'], ['CRT', 'crt', 15, '#f4a6c6'], ['ARM', 'arm', 15, '#9a9aa4']];
function segBar(v, mx, c) { const on = v ? Math.max(1, Math.round(v / mx * 10)) : 0; let h = '<div class="seg" style="--c:' + c + '">'; for (let i = 0; i < 10; i++) h += '<i class="' + (i < on ? 'on' : '') + '"></i>'; return h + '</div>'; }
let charSel = 0, charCards = [];
function buildCharSelect() {
  const s = $('classes');
  s.innerHTML = '<div class="abs cs-title t24 gold">CHOOSE YOUR HERO</div><div class="abs cs-row" role="listbox" aria-label="Classes"></div>' +
    '<div class="abs cs-foot"><span class="hint">' + KEY('&larr;') + KEY('&rarr;') + ' CHOOSE</span><span class="hint">' + KEY('ENTER') + ' START RUN</span><span class="hint">' + KEY('1') + '-' + KEY('5') + ' QUICK PICK</span><span class="hint">' + KEY('ESC') + ' BACK</span></div>';
  const row = s.querySelector('.cs-row'); charCards = [];
  Object.entries(CHARS).forEach(([id, c], i) => {
    const d = document.createElement('div'); d.className = 'ccard panel'; d.setAttribute('role', 'option'); d.style.position = 'relative';
    const stats = STAT_ROWS.map(([lab, k, mx, col]) => '<span class="dim">' + lab + '</span>' + segBar(c.pct[k], mx, col) + '<span class="v">' + c.pct[k] + (k === 'crt' || k === 'arm' ? '%' : '') + '</span>').join('');
    d.innerHTML = '<span class="key num">' + (i + 1) + '</span><div class="pic"></div><div><div class="nm">' + c.name.toUpperCase() + '</div><div class="ep">' + c.epithet.toUpperCase() + '</div></div>' +
      '<div class="stats">' + stats + '</div><div class="kit">' +
      '<div class="k"><span class="kframe">' + icon(c.attack, 3) + '</span><div><span>' + c.attack.toUpperCase() + '</span><small>AUTO ATTACK</small></div></div>' +
      '<div class="k"><span class="kframe">' + icon(c.ability, 3) + '</span><div><span>' + c.ability.toUpperCase() + '</span><small>SPACE · ' + c.cdText.toUpperCase() + '</small></div></div></div>' +
      '<div class="trait"><b style="color:#8fe07a">+</b>' + esc(c.plus) + '</div><div class="trait minus"><b>&minus;</b>' + esc(c.minus) + '</div>';
    const spr = heroUiSprite(id, 'front', true); d.querySelector('.pic').appendChild(spr.c);
    d.addEventListener('mouseenter', () => selectChar(i)); d.addEventListener('click', () => startRun(id));
    row.appendChild(d); charCards.push(d);
  });
  selectChar(charSel);
}
function selectChar(i) { charSel = (i + charCards.length) % charCards.length; charCards.forEach((d, j) => { d.classList.toggle('sel', j === charSel); d.setAttribute('aria-selected', j === charSel); }); }

// ─── 3 Battle map ───
const MAP_NODES = [[54, 470], [192, 270], [354, 452], [492, 236], [570, 36]];
const MAP_DECO = [[6, 12], [330, 60], [250, 560], [600, 330], [40, 300], [470, 120], [120, 160]];
function enemyPortrait(key, boss) {
  const a = boss ? BJ[key] : EJ[key], [w, h] = a.frame, row = key === 'slime' ? Math.max(0, a.rows.indexOf(zone.id + ' front')) : 0;
  const s = Math.max(w, h) * 2 <= 78 ? 2 : 1;
  return frameCanvas(IMG[(boss ? 'bosses/' : 'enemies/') + a.file], w, h, 0, row, s);
}
function buildBattleMap() {
  const s = $('battlemap'), z = zone, first = (ZONES.indexOf(z)) * 5 + 1, boss = isBossRound(currentRound);
  const ground = ASSET_DATA['biomes/' + z.id + '_ground.png'];
  let path = '';
  const pts = MAP_NODES.map(([x, y], i) => i === 4 ? [x + 54, y + 54] : [x + 42, y + 42]);
  for (let i = 0; i < 4; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], my = (y0 + y1) >> 1; path += '<polyline points="' + x0 + ',' + y0 + ' ' + x0 + ',' + my + ' ' + x1 + ',' + my + ' ' + x1 + ',' + y1 + '" />'; }
  s.innerHTML = '<div class="abs mapbox panel"><div class="t16 gold" style="display:flex;justify-content:space-between"><span>' + z.name.toUpperCase() + '</span><span class="dim t8" style="align-self:center">ROUNDS ' + first + '-' + (first + 4) + '</span></div>' +
    '<div class="ground" style="background-image:url(' + ground + ')"><svg width="714" height="620" style="position:absolute;left:0;top:0" aria-hidden="true"><g fill="none" stroke="#2b1d14" stroke-width="12" shape-rendering="crispEdges">' + path + '</g><g fill="none" stroke="#e4c48c" stroke-width="6" stroke-dasharray="9 9" shape-rendering="crispEdges">' + path + '</g></svg></div></div>' +
    '<div class="abs info panel"></div>';
  const gr = s.querySelector('.ground'), obs = BIO.zones[z.id].obstacles.filter(o => !HAZARD_KIND[o.name]);
  MAP_DECO.forEach(([x, y], i) => {
    const o = obs[i % obs.length], [bx, by, bw, bh] = o.box, c = document.createElement('canvas');
    c.width = bw * 3; c.height = bh * 3; c.className = 'deco'; c.style.left = x + 'px'; c.style.top = y + 'px';
    const cx = c.getContext('2d'); cx.imageSmoothingEnabled = false; cx.drawImage(IMG['biomes/' + z.id + '_obstacles.png'], bx, by, bw, bh, 0, 0, bw * 3, bh * 3);
    gr.appendChild(c);
  });
  MAP_NODES.forEach(([x, y], i) => {
    const r = first + i, st = r < currentRound ? 'done' : r === currentRound ? 'cur' : 'lock', isBoss = i === 4, sz = isBoss ? 108 : 84;
    const n = document.createElement('div'); n.className = 'node notch ' + (isBoss ? 'boss ' : '') + (isBoss && st !== 'cur' && st !== 'done' ? '' : st);
    n.style.left = x + 'px'; n.style.top = y + 'px';
    if (isBoss) { const b = BJ[z.boss], c = frameCanvas(IMG['bosses/' + b.file], b.frame[0], b.frame[1], 0, 0, 1, st !== 'done'); c.style.width = '84px'; c.style.height = Math.round(84 * b.frame[1] / b.frame[0]) + 'px'; n.appendChild(c); }
    else n.textContent = r;
    gr.appendChild(n);
    const lab = document.createElement('div'); lab.className = 'nlabel';
    lab.style.left = (x + sz / 2) + 'px'; lab.style.top = (y + sz + 12) + 'px';
    lab.textContent = 'ROUND ' + r + (st === 'done' ? ' · CLEARED' : st === 'cur' ? ' · NEXT' : isBoss ? ' · BOSS' : '');
    gr.appendChild(lab);
    if (st === 'done') { const ck = document.createElement('div'); ck.className = 'check'; ck.style.left = (x + sz - 18) + 'px'; ck.style.top = (y - 15) + 'px'; gr.appendChild(ck); }
    if (st === 'cur') { const pin = heroUiSprite(selectedCharId, 'front', true, 2); pin.c.className = 'spr hero-pin'; pin.c.style.left = (x + sz / 2 - 32) + 'px'; pin.c.style.top = (y - 92) + 'px'; gr.appendChild(pin.c); }
  });
  const info = s.querySelector('.info'), danger = Math.min(5, 1 + Math.floor((currentRound - 1) / 6));
  let pips = ''; for (let i = 0; i < 5; i++) pips += icon('Kills', 2, i < danger ? '' : 'opacity:.25');
  const pool = z.pool.filter(p => !['skeleton', 'demon'].includes(p[0])).map(p => p[0]);
  let h = '<div><div class="t8 dim">NEXT FIGHT</div><h3 class="t32 gold" style="margin-top:9px">ROUND ' + currentRound + '</h3></div>' +
    '<div class="pips t8"><span class="dim" style="margin-right:6px">DANGER</span>' + pips + '</div><div class="rule"></div>' +
    '<div><div class="t8 dim" style="margin-bottom:9px">ENEMIES</div><div class="portraits" id="bm-enemies"></div></div>';
  if (boss) h += '<div><div class="t8 dim" style="margin-bottom:9px">BOSS</div><div class="portraits" id="bm-boss"><div class="t8" style="align-self:center;line-height:18px;max-width:220px">' + BJ[z.boss].name.toUpperCase() + '<br><span class="dim">' + esc(BOSS_TIPS[z.boss] || '') + '</span></div></div></div>';
  else h += '<div><div class="t8 dim" style="margin-bottom:9px">MINI-BOSS · ONE OF</div><div class="portraits" id="bm-minis"><div class="t8" style="align-self:center;line-height:18px">' + BJ[z.minis[0]].name.toUpperCase() + '<br><span class="dim">OR</span><br>' + BJ[z.minis[1]].name.toUpperCase() + '</div></div></div>';
  h += '<div class="rule"></div><div class="t8" style="line-height:18px"><span class="dim">TIP</span><br>' + esc(z.tip).toUpperCase() + '</div><div class="btns"></div>';
  info.innerHTML = h;
  const ep = info.querySelector('#bm-enemies');
  pool.slice(0, 4).forEach(k => { const sl = document.createElement('div'); sl.className = 'slot'; sl.title = EJ[k].name; sl.appendChild(enemyPortrait(k)); ep.appendChild(sl); });
  if (boss) { const sl = document.createElement('div'); sl.className = 'slot'; const b = BJ[z.boss], c = frameCanvas(IMG['bosses/' + b.file], b.frame[0], b.frame[1], 0, 0, 1, true); c.style.width = '72px'; c.style.height = Math.round(72 * b.frame[1] / b.frame[0]) + 'px'; sl.appendChild(c); info.querySelector('#bm-boss').prepend(sl); }
  else { const mp = info.querySelector('#bm-minis'); z.minis.slice().reverse().forEach(k => { const sl = document.createElement('div'); sl.className = 'slot'; sl.title = BJ[k].name; const c = enemyPortrait(k, true); c.style.width = '72px'; c.style.height = Math.round(72 * BJ[k].frame[1] / BJ[k].frame[0]) + 'px'; sl.appendChild(c); mp.prepend(sl); }); }
  const bb = info.querySelector('.btns'), items = [btn('FIGHT!', fight, 'primary'), btn('RETURN TO FARM', () => { enterFarm(); })];
  items.forEach(b => { b.style.justifyContent = 'center'; bb.appendChild(b); });
  setMenu(items);
}

// ─── Combat HUD ───
function buildHud() {
  const face = $('hud-face'); face.querySelectorAll('canvas').forEach(c => c.remove());
  const c = document.createElement('canvas'); c.width = 66; c.height = 66; c.className = 'spr';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(IMG['heroes/' + selectedCharId + '_front.png'], 5, 0, 22, 22, 0, 0, 66, 66);
  face.prepend(c);
  $('hud-timer').innerHTML = icon('Timer', 2) + '<span id="hud-time">0:00</span>';
  $('hud-gold-box').innerHTML = icon('Gold', 2) + '<span class="gold" id="hud-gold">0</span>';
  $('hud-kill-box').innerHTML = icon('Kills', 2) + '<span id="hud-kills">0</span>';
  const ab = $('ab-slot'); ab.querySelectorAll('.ico').forEach(e => e.remove()); ab.insertAdjacentHTML('afterbegin', icon(CHARS[selectedCharId].ability, 4));
  hudCache = {};
}
let hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function setHtml(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).innerHTML = v; } }
function showHud() { $('hud').hidden = false; buildHud(); updateHUD(); }
function hideHud() { $('hud').hidden = true; $('notification').hidden = true; $('toast').hidden = true; }
function weaponSlotsHtml() {
  const owned = Object.keys(player.weapons).filter(k => player.weapons[k] > 0);
  let h = '';
  for (let i = 0; i < 2; i++) {
    const w = owned[i];
    if (w) {
      const lv = player.weapons[w], cap = Math.max(lv, LEVEL_CAP[bld.forge] || 3); let pips = ''; for (let k = 0; k < cap; k++) pips += '<i class="' + (k < lv ? 'on' : '') + '"></i>';
      h += '<div class="wslot"><div class="slot">' + icon(WEAPONS[w].name, 4) + '</div><div class="lvpips">' + pips + '</div></div>';
    } else if (i === 1 && currentRound <= 5) h += '<div class="wslot empty"><div class="slot">LOCKED</div><div class="dim">AFTER R5</div></div>';
    else h += '<div class="wslot empty"><div class="slot">EMPTY</div><div class="dim">&nbsp;</div></div>';
  }
  return h;
}
function updateHUD() {
  const p = player;
  $('hp-fill').style.width = Math.max(0, p.hp / p.maxHp * 100) + '%'; setText('hp-label', 'HP ' + Math.ceil(p.hp) + ' / ' + p.maxHp);
  $('xp-fill').style.width = (p.xp / p.xpToLevel * 100) + '%'; setText('xp-label', 'XP ' + p.xp + ' / ' + p.xpToLevel);
  setText('hud-lvl', 'LV ' + p.level); setText('hud-round', 'ROUND ' + currentRound); setText('hud-zone', zone.name.toUpperCase());
  setText('hud-time', fmtTime(gameTime)); setText('hud-gold', String(coins)); setText('hud-kills', String(kills));
  setText('hud-phase', aftermath > 0 ? 'ALL CLEAR' : bossRef && bossRef.tier === 'major' ? 'BOSS' : phaseAt(gameTime).name);
  const mats = Object.keys(roundMats).map(m => '<div class="cnt plank">' + icon(MATERIALS[m].name, 2) + '<span>' + roundMats[m] + '</span></div>').join('');
  setHtml('hud-mats', mats);
  setHtml('hud-weapons', weaponSlotsHtml());
  const c = CHARS[selectedCharId];
  const frac = p.abilityCd > 0 ? 1 - p.abilityCd / c.cooldown : 1, steps = Math.floor(frac * 8) / 8 * 360;
  const ready = c.charges ? p.charges > 0 : p.abilityCd <= 0;
  $('ab-cool').style.setProperty('--done', (ready ? 360 : steps) + 'deg');
  setText('ab-num', ready ? '' : String(Math.ceil(p.abilityCd)));
  if (c.charges) { let ch = ''; for (let i = 0; i < c.charges; i++) ch += '<i class="' + (i < p.charges ? 'on' : '') + '"></i>'; setHtml('ab-charges', ch); } else setHtml('ab-charges', '');
  setHtml('hud-belt', beltHudHtml());
  const bb = $('bossbar');
  if (bossRef && !bossRef.dead) {
    bb.hidden = false; setText('boss-name', bossRef.art.name.toUpperCase());
    $('boss-bar').style.setProperty('--c', bossRef.tier === 'major' ? '#c0402f' : '#b066dc');
    $('boss-fill').style.width = Math.max(0, bossRef.hp / bossRef.maxHp * 100) + '%';
  } else bb.hidden = true;
}

// ─── 5 Level up ───
let lvlSel = 0, lvlCards = [], lvlLockUntil = 0, lvlFrom = 1;
function rollRarity() {
  const w = rarityOdds(); let r = Math.random() * 100;   // Luck from the Training Grounds shifts these
  for (let i = 3; i >= 0; i--) { if (r < w[i]) return i; r -= w[i]; }
  return 0;
}
function cardTotalText(c) {
  const v = player.cards[c.name] || 0;
  if (c.pct) return 'NOW +' + (Math.round(v * 1000) / 10) + '%';
  return 'NOW ' + (c.neg ? '-' : '+') + v;
}
function weaponSlotsOpen() { return currentRound > 5 ? 2 : 1; }
function weaponTitle(w) { const e = forge.evo[w]; return e ? EVO_GATES[w][e === 'alt' ? 1 : 0].name : WEAPONS[w].name; }
// Q / E / R belt in the combat HUD (2 slots until the Alchemy Lab reaches T2).
function beltHudHtml() {
  let h = '';
  for (let i = 0; i < beltSlots(); i++) {
    const b = belt[i], on = b && player.buffs && player.buffs[b.id] > 0;
    h += '<div class="slot' + (on ? ' on' : '') + '"' + (b ? '' : ' style="opacity:.55"') + '><span class="key">' + BELT_KEYS[i] + '</span>' + (b ? icon(POTIONS[b.id].name, 3) + '<span class="n">' + b.n + '</span>' : '') + '</div>';
  }
  return h;
}
function showLevelUp() {
  state = 'levelup'; lvlFrom = player.level - pendingLevels; pendingLevels--;
  const c = CHARS[selectedCharId], pool = [];
  for (const card of CARDS) pool.push({ type: 'card', card, w: c.preferred.includes(card.name) ? 1.5 : 1 });
  // Weapons and evolutions come from the Forge only; level-ups offer the 12 cards (4 with Training Grounds T3).
  const chosen = [], used = new Set(), nCards = bld.training >= 3 ? 4 : 3;
  for (let i = 0; i < nCards; i++) {
    let tot = 0; for (const p of pool) if (!used.has(p)) tot += p.w;
    if (!tot) break;
    let r = Math.random() * tot, pick_ = null;
    for (const p of pool) { if (used.has(p)) continue; r -= p.w; if (r <= 0) { pick_ = p; break; } }
    if (!pick_) break; used.add(pick_); chosen.push(pick_);
  }
  const s = $('levelup');
  s.innerHTML = '<div class="abs lu-title"><div class="t32 gold">LEVEL UP!</div><div class="t16 cream">LV ' + lvlFrom + ' &rarr; LV ' + (lvlFrom + 1) + ' · PICK ONE</div></div>' +
    '<div class="abs lu-row cards locked"></div>' +
    '<div class="abs lu-foot"><span class="hint">' + KEY('1') + KEY('2') + KEY('3') + (nCards > 3 ? KEY('4') : '') + ' PICK</span><span class="hint">' + KEY('&larr;') + KEY('&rarr;') + '+' + KEY('ENTER') + '</span><span class="hint">' + KEY('TAB') + ' STATS</span></div>';
  const row = s.querySelector('.lu-row'); lvlCards = [];
  chosen.forEach((p, i) => {
    const d = document.createElement('div'); let rar, iconName, name, val, desc, now, tag = '', apply;
    if (p.type === 'card') {
      const r = rollRarity(); rar = RARITIES[r]; iconName = p.card.name; name = p.card.name; val = cardValueText(p.card, r);
      desc = p.card.name === 'Multi Shot' ? (r >= 2 ? 'projectile, and +' + Math.round(p.card.bonusDmg[r] * 100) + '% damage' : 'projectile: ' + multiShotDesc()) : p.card.desc;
      now = cardTotalText(p.card); if (p.w > 1) tag = '<span class="pref">' + c.name.toUpperCase() + ' PICK</span>';
      apply = () => { p.card.apply(player, p.card.v[r], r); player.cards[p.card.name] = (player.cards[p.card.name] || 0) + p.card.v[r]; player.cardCount[p.card.name] = (player.cardCount[p.card.name] || 0) + 1; };
    }
    const rc = { common: 'var(--common)', rare: 'var(--rare)', epic: 'var(--epic)', legendary: 'var(--legend)' }[rar];
    d.className = 'card' + (rar === 'legendary' ? ' legend' : ''); d.style.setProperty('--r', rc);
    d.innerHTML = '<span class="key num">' + (i + 1) + '</span>' + tag + '<span class="rar">' + rar.toUpperCase() + '</span><div class="art">' + icon(iconName, 4) + '</div>' +
      '<div class="cn">' + name.toUpperCase() + '</div><div class="val">' + val + '</div><div class="desc">' + esc(desc) + '</div><div class="now">' + now + '</div>';
    d._pick = () => { if (state !== 'levelup') return; apply(); $('stats').hidden = true; lvlCards = []; afterLevelPick(); };
    d.addEventListener('click', () => pickLvl(i)); d.addEventListener('mouseenter', () => selectLvl(i));
    row.appendChild(d); lvlCards.push(d);
  });
  setScreen('levelup'); lvlLockUntil = performance.now() + 350;
  setTimeout(() => row.classList.remove('locked'), 350);
  selectLvl(0);
}
function multiShotDesc() { return { knight: 'your sword arc widens', mage: 'one more homing bolt', marksman: 'one more piercing line', rogue: 'one more dagger', witch: 'outer rings at 3 and 5' }[selectedCharId]; }
function selectLvl(i) { if (!lvlCards.length) return; lvlSel = (i + lvlCards.length) % lvlCards.length; lvlCards.forEach((d, j) => d.classList.toggle('sel', j === lvlSel)); }
function pickLvl(i) { if (state !== 'levelup' || performance.now() < lvlLockUntil || !lvlCards[i]) return; lvlCards[i]._pick(); }
function afterLevelPick() {
  if (pendingLevels > 0) { showLevelUp(); return; }
  state = 'playing'; setScreen(null); showHud(); player.invT = Math.max(player.invT, 0.5);
}

// ─── Stats (TAB) ───
let statsReturn = null;
function showStats(from) {
  statsReturn = from || state; state = 'stats';
  const p = player, c = CHARS[selectedCharId], base = classStats(selectedCharId), pct = x => Math.round(x * 100) + '%';
  const bonus = (now, b) => { const d = now - b; return (d >= 0 ? '+' : '') + d; };
  const rows = [
    ['Vitality', 'MAX HP', base.maxHp, bonus(p.maxHp, base.maxHp), p.maxHp],
    ['Power', 'DAMAGE', c.pct.pow + '%', '+' + Math.round((damageMult() - 1) * 100) + '%', Math.round(c.pct.pow * damageMult()) + '%'],
    ['Swiftness', 'MOVE SPEED', c.pct.spd + '%', '+' + Math.round((p.speed / base.speed - 1) * 100) + '%', Math.round(c.pct.spd * p.speed / base.speed) + '%'],
    ['Precision', 'CRIT', pct(base.critChance), '+' + pct(p.critChance - base.critChance), pct(p.critChance)],
    ['Armor', 'ARMOR', pct(base.armor), '+' + pct(p.armor - base.armor), pct(p.armor)],
    ['Rapid Fire', 'ATTACK SPEED', c.pct.atk + '%', '+' + Math.round((base.attackInterval / p.attackInterval - 1) * 100) + '%', Math.round(c.pct.atk * base.attackInterval / p.attackInterval) + '%'],
    ['Magnetism', 'PICKUP RANGE', '100%', '+' + Math.round((p.pickupRange / base.pickupRange - 1) * 100) + '%', Math.round(p.pickupRange / base.pickupRange * 100) + '%'],
    ['Thick Skin', 'DAMAGE BLOCKED', '0', '-' + p.flatReduce, '-' + p.flatReduce]
  ];
  const tr = rows.map(([i, n, b, plus, t]) => '<div class="srow2">' + slotHtml(i, 2) + '<span>' + n + '</span><span class="dim">' + b + '</span><span class="ok">' + plus + '</span><span class="gold">' + t + '</span></div>').join('');
  const cg = CARDS.map(cd => { const n = (p.cardCount || {})[cd.name] || 0; return '<div class="cc' + (n ? '' : ' none') + '">' + slotHtml(cd.name, 3) + '<span class="t8">' + cd.name.toUpperCase() + '</span><span class="cnt2">x' + n + '</span></div>'; }).join('');
  const totalCards = Object.values(p.cardCount || {}).reduce((a, b) => a + b, 0);
  const owned = Object.keys(p.weapons).filter(k => p.weapons[k] > 0);
  let wl = owned.map(w => '<div class="row">' + slotHtml(WEAPONS[w].name, 2) + '<span>' + weaponTitle(w).toUpperCase() + '</span><span class="dim">LV ' + p.weapons[w] + (forge.evo[w] ? ' · EVO' : '') + '</span></div>').join('') || '<div class="desc">No weapons yet. Build the Forge on the farm to make one.</div>';
  if (p.synergy) wl += '<div class="desc" style="color:' + SYNERGIES[p.synergy].color + '">' + SYNERGIES[p.synergy].name + ': ' + SYNERGIES[p.synergy].desc + '</div>';
  const beltH = belt.slice(0, beltSlots()).map(b => b ? slotHtml(POTIONS[b.id].name, 2, 'slot', '<span class="n" style="position:absolute;right:3px;bottom:0;font-size:8px">' + b.n + '</span>') : slotHtml(null, 2)).join('');
  const s = $('stats');
  s.innerHTML = '<div class="abs t24 gold" style="left:36px;top:30px">STATS</div><div class="abs t8 dim" style="left:180px;top:42px">' + c.name.toUpperCase() + ' · LEVEL ' + p.level + ' · ROUND ' + currentRound + '</div>' +
    '<div class="abs panel" style="left:36px;top:84px;width:500px;height:640px;padding:18px;display:grid;gap:6px;align-content:start"><div class="srow2 head"><span></span><span class="lbl">STAT</span><span class="lbl">BASE</span><span class="lbl">BONUS</span><span class="lbl">NOW</span></div>' + tr +
    '<div class="rule2"></div><div class="lbl">BONUS: LEVEL-UP CARDS AND POTIONS</div><div class="row" style="gap:12px"><span id="stats-hero"></span><div class="desc">' + esc(c.plus) + '. ' + esc(c.minus) + '.</div></div></div>' +
    '<div class="abs panel" style="left:552px;top:84px;width:356px;height:640px;padding:18px;display:grid;gap:12px;align-content:start"><div class="lbl">LEVEL-UP CARDS · ' + totalCards + ' TAKEN</div><div class="cgrid">' + cg + '</div><div class="desc">Cards stay for the whole run. Faded cards have not come up yet.</div></div>' +
    '<div class="abs panel" style="left:924px;top:84px;width:320px;height:640px;padding:18px;display:grid;gap:12px;align-content:start"><div class="lbl">WEAPONS</div>' + wl +
    '<div class="lbl" style="margin-top:6px">POTION BELT</div><div style="display:flex;gap:9px">' + beltH + '</div>' +
    '<div class="lbl" style="margin-top:6px">MATERIALS</div><div style="display:flex;gap:9px;flex-wrap:wrap">' + Object.keys(MATERIALS).map(m => slotHtml(MATERIALS[m].name, 2, 'slot', '<span style="position:absolute;right:3px;bottom:0;font-size:8px;text-shadow:3px 3px 0 var(--ink)">' + materials[m] + '</span>')).join('') + '</div></div>' +
    '<div class="abs hint" style="right:36px;top:36px">' + KEY('TAB') + ' CLOSE</div>';
  s.querySelector('#stats-hero').appendChild(heroUiSprite(selectedCharId, 'front', false, 2).c);
  setScreen('stats');
}
function closeStats() {
  const back = statsReturn; statsReturn = null;
  if (back === 'levelup') { state = 'levelup'; setScreen('levelup'); return; }
  if (back === 'paused') { state = 'paused'; setScreen('pause'); buildPause(); return; }
  resumeGame();
}

// ─── Pause ───
function buildPause() {
  const s = $('pause'), p = player, c = CHARS[selectedCharId];
  const mats = Object.keys(roundMats).map(m => '<div class="row">' + slotHtml(MATERIALS[m].name, 2) + '<span>' + MATERIALS[m].name.toUpperCase() + '</span><span>' + roundMats[m] + '</span></div>').join('');
  const wl = Object.keys(p.weapons).filter(k => p.weapons[k] > 0).map(w => '<div class="row">' + slotHtml(WEAPONS[w].name, 2) + '<span>' + WEAPONS[w].name.toUpperCase() + '</span><span class="dim">LV ' + p.weapons[w] + '</span></div>').join('');
  s.innerHTML = '<div class="abs panel" id="pause-main" style="left:432px;top:150px;width:416px;padding:24px;display:grid;gap:15px"><div class="t32 gold" style="text-align:center">PAUSED</div><div class="t8 dim" style="text-align:center">ROUND ' + currentRound + ' · ' + zone.name.toUpperCase() + ' · ' + fmtTime(gameTime) + '</div></div>' +
    '<div class="abs panel side" style="left:888px;top:150px;width:356px;padding:18px;display:grid;gap:12px"><div class="lbl">YOUR BUILD</div><div class="row big"><span id="pause-hero"></span><div style="display:grid;gap:6px"><span class="t16">' + c.name.toUpperCase() + '</span><span class="t8 dim">LEVEL ' + p.level + '</span></div></div>' + wl + '</div>' +
    '<div class="abs panel side" style="left:36px;top:150px;width:356px;padding:18px;display:grid;gap:12px"><div class="lbl">THIS ROUND SO FAR</div>' +
    '<div class="row">' + slotHtml('Kills', 2) + '<span>KILLS</span><span class="gold">' + roundKills + '</span></div><div class="row">' + slotHtml('Gold', 2) + '<span>GOLD</span><span class="gold">' + roundCoins + '</span></div>' + mats + '</div>' +
    '<div class="abs hint" style="left:0;right:0;bottom:24px;justify-content:center">' + KEY('&uarr;') + KEY('&darr;') + ' CHOOSE ' + KEY('ENTER') + ' SELECT ' + KEY('ESC') + ' RESUME</div>';
  s.querySelector('#pause-hero').appendChild(heroUiSprite(selectedCharId, 'front', false, 2).c);
  const main = s.querySelector('#pause-main'), items = [btn('RESUME', resumeGame, '', 'ESC'), btn('STATS', () => showStats('paused'), '', 'TAB'), btn('OPTIONS', () => showOptions('paused')), btn('GIVE UP RUN', giveUp)];
  items.forEach(b => main.appendChild(b)); setMenu(items);
}

// ─── Options ───
let optionsReturn = 'title';
function showOptions(from) { optionsReturn = from; state = 'options'; setScreen('options'); buildOptions(); }
function buildOptions() {
  const s = $('options');
  const tog = (k, n, sub) => { const d = document.createElement('div'); d.className = 'opt'; d._act = () => { options[k] = !options[k]; paint(); }; d.dataset.k = k; d.dataset.n = n; d.dataset.sub = sub || ''; return d; };
  const full = document.createElement('div'); full.className = 'opt';
  full._act = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); setTimeout(paint, 200); };
  const keys = [['MOVE', 'W A S D'], ['ABILITY', 'SPACE'], ['POTIONS', 'Q E R'], ['STATS', 'TAB'], ['PAUSE', 'ESC'], ['INTERACT', 'ENTER']];
  s.innerHTML = '<div class="abs t24 gold" style="left:60px;top:42px">OPTIONS</div>' +
    '<div class="abs panel" id="opt-main" style="left:340px;top:100px;width:440px;padding:21px;display:grid;gap:15px;align-content:start"><div class="lbl">AUDIO</div><div class="desc">No sound yet: music and effects are still to come.</div><div class="lbl" style="margin-top:9px">SCREEN</div></div>' +
    '<div class="abs panel" style="left:800px;top:100px;width:420px;padding:21px;display:grid;gap:12px;align-content:start"><div class="lbl">CONTROLS</div>' + keys.map(([n, v]) => '<div class="opt" style="cursor:default"><span>' + n + '</span><span>' + v.split(' ').map(KEY).join('') + '</span><span></span></div>').join('') + '<div class="desc">Gamepad and touch controls are still to be designed.</div></div>' +
    '<div class="abs panel" id="opt-side" style="left:60px;top:100px;width:260px;padding:15px;display:grid;gap:9px"></div>' +
    '<div class="abs hint" style="left:60px;bottom:30px">' + KEY('&uarr;') + KEY('&darr;') + ' CHOOSE ' + KEY('ENTER') + ' CHANGE ' + KEY('ESC') + ' BACK</div>';
  const main = s.querySelector('#opt-main'), opts = [full, tog('shake', 'SCREEN SHAKE'), tog('damageNumbers', 'DAMAGE NUMBERS'), tog('flashes', 'HIT FLASH', 'Turn off for softer hits and boss deaths')];
  function paint() {
    const fs = !!document.fullscreenElement;
    full.innerHTML = '<span>FULLSCREEN</span><div class="tog' + (fs ? ' on' : '') + '"><i></i></div><span class="v">' + (fs ? 'ON' : 'OFF') + '</span>';
    for (const o of opts.slice(1)) { const on = options[o.dataset.k]; o.innerHTML = '<span>' + o.dataset.n + (o.dataset.sub ? '<small>' + o.dataset.sub + '</small>' : '') + '</span><div class="tog' + (on ? ' on' : '') + '"><i></i></div><span class="v">' + (on ? 'ON' : 'OFF') + '</span>'; }
  }
  opts.forEach(o => main.appendChild(o)); paint();
  const back = btn('BACK', closeOptions); s.querySelector('#opt-side').appendChild(back);
  setMenu(opts.concat([back]));
}
function closeOptions() { if (optionsReturn === 'paused') { state = 'paused'; setScreen('pause'); buildPause(); } else showTitle(); }

// ─── Round complete ───
function buildRoundComplete() {
  const s = $('roundcomplete'), killed = lastBossName || 'THE MINI-BOSS', zi = (currentRound - 1) % 5 + 1;
  const mh = Object.keys(roundMats).map(m => '<div class="loot">' + slotHtml(MATERIALS[m].name, 3) + '<span>+' + roundMats[m] + '</span></div>').join('') || '<div class="desc">No materials this round.</div>';
  const ready = farmPlots.filter(p => p.crop && p.growLeft <= 1).length;
  s.innerHTML = '<div class="abs" style="left:0;right:0;top:48px;text-align:center"><div class="t48 gold">ROUND ' + currentRound + ' CLEAR!</div><div class="t16 cream" style="margin-top:12px">' + killed + ' DOWN · ' + zone.name.toUpperCase() + ' ' + zi + ' / 5</div></div>' +
    '<div class="abs panel" style="left:190px;top:200px;width:560px;padding:21px;display:grid;gap:12px"><div class="lbl">REWARDS</div>' +
    '<div class="tally big2"><span>' + icon('Gold', 2) + 'GOLD PICKED UP</span><span class="gold">+' + roundCoins + '</span></div><div class="rule2"></div>' +
    '<div class="lbl">MATERIALS</div><div class="loots">' + mh + '</div>' +
    (roundBonus ? '<div class="rule2"></div><div class="tally big2"><span>' + icon('Berserkers', 2) + 'ARENA BONUS +' + roundBonus.pct + '%</span><span class="gold">+' + roundBonus.g + 'G</span></div><div class="loots">' + Object.keys(roundBonus.mats).map(m => '<div class="loot">' + slotHtml(MATERIALS[m].name, 2) + '<span>+' + roundBonus.mats[m] + '</span></div>').join('') + (roundBonus.core ? '<div class="loot">' + slotHtml('Golem Core', 2) + '<span>RARE DROP</span></div>' : '') + '</div>' : '') + '</div>' +
    '<div class="abs panel" style="left:770px;top:200px;width:320px;padding:21px;display:grid;gap:12px"><div class="lbl">THE FIGHT</div>' +
    '<div class="tally"><span>' + icon('Kills', 2) + 'KILLS</span><span>' + roundKills + '</span></div><div class="tally"><span>' + icon('Timer', 2) + 'TIME</span><span>' + fmtTime(gameTime) + '</span></div>' +
    '<div class="tally"><span>' + icon('Vitality', 2) + 'HP LEFT</span><span>' + Math.ceil(player.hp) + '</span></div><div class="tally"><span>' + icon('XP Gem', 2) + 'LEVEL</span><span>' + player.level + '</span></div>' +
    '<div class="rule2"></div><div class="lbl">BACK ON THE FARM</div><div class="desc">' + (ready ? ready + ' crop' + (ready > 1 ? 's' : '') + ' ready to harvest.' : 'Plant crops and spend your gold before the next fight.') + '</div></div>' +
    '<div class="abs" id="rc-btns" style="left:0;right:0;bottom:60px;display:flex;justify-content:center;gap:18px"></div>' +
    '<div class="abs hint" style="left:0;right:0;bottom:18px;justify-content:center">' + KEY('ENTER') + ' CONTINUE</div>';
  const b = btn('TO THE FARM', leaveRound, 'primary'); b.id = 'rc-farm-btn'; s.querySelector('#rc-btns').appendChild(b); setMenu([b]);
}

// ─── Run over ───
let lastHitBy = null, lastBossName = '';
function buildRunOver() {
  const s = $('runover'), c = CHARS[selectedCharId];
  const owned = Object.keys(player.weapons).filter(k => player.weapons[k] > 0).sort((a, b) => player.weapons[b] - player.weapons[a]);
  const best = owned.length ? WEAPONS[owned[0]].name.toUpperCase() + ' LV ' + player.weapons[owned[0]] : 'BASE ATTACK';
  s.innerHTML = '<div class="abs" style="left:0;right:0;top:54px;text-align:center"><div class="t48" style="color:#ff6a50;text-shadow:3px 3px 0 #3a0806">RUN OVER</div><div class="t16 cream" style="margin-top:12px">FELL IN ROUND ' + currentRound + ' · ' + zone.name.toUpperCase() + '</div></div>' +
    '<div class="abs" style="left:150px;top:230px;width:360px;display:grid;justify-items:center;gap:12px"><div class="fallen" id="ro-hero"></div><div class="panel" id="ro-killer" style="padding:12px 15px;display:flex;gap:12px;align-items:center"></div></div>' +
    '<div class="abs panel" style="left:560px;top:200px;width:560px;padding:21px;display:grid;gap:12px"><div class="lbl">THIS RUN</div>' +
    '<div class="tally"><span>' + icon('Timer', 2) + 'ROUNDS CLEARED</span><span>' + (currentRound - 1) + ' / ' + TOTAL_ROUNDS + '</span></div>' +
    '<div class="tally"><span>' + icon('Kills', 2) + 'ENEMIES DEFEATED</span><span>' + fmtNum(kills) + '</span></div>' +
    '<div class="tally"><span>' + icon('Gold', 2) + 'GOLD EARNED</span><span class="gold">' + fmtNum(runStats.gold || 0) + '</span></div>' +
    '<div class="tally"><span>' + icon('XP Gem', 2) + 'HERO LEVEL</span><span>' + player.level + '</span></div>' +
    '<div class="tally"><span>' + icon(owned.length ? WEAPONS[owned[0]].name : c.attack, 2) + 'BEST WEAPON</span><span>' + best + '</span></div>' +
    '<div class="rule2"></div><div class="desc">Runs start fresh: nothing carries over yet (meta-progression is still undecided).</div></div>' +
    '<div class="abs" id="ro-btns" style="left:560px;top:620px;display:flex;gap:18px"></div><div class="abs hint" style="right:36px;bottom:18px">' + KEY('&larr;') + KEY('&rarr;') + ' CHOOSE ' + KEY('ENTER') + ' SELECT</div>';
  const kf = IMG['combat/' + selectedCharId + '-death.png'], dc = frameCanvas(kf, 56, 48, 2, 0, 4); s.querySelector('#ro-hero').appendChild(dc);
  const k = s.querySelector('#ro-killer');
  if (lastHitBy) {
    const a = lastHitBy.art, cv = frameCanvas(IMG[lastHitBy.dir + '/' + a.file], a.frame[0], a.frame[1], 0, lastHitBy.key === 'slime' ? Math.max(0, a.rows.indexOf(zone.id + ' front')) : 0, a.frame[0] > 40 ? 1 : 2);
    k.appendChild(cv);
    k.insertAdjacentHTML('beforeend', '<div style="display:grid;gap:6px"><span class="lbl">DEFEATED BY</span><span class="t16" style="color:#ff8a70">' + a.name.toUpperCase() + '</span><span class="t8 dim">' + (lastHitBy.tier ? (lastHitBy.tier === 'major' ? 'BOSS' : 'MINI-BOSS') : zone.name.toUpperCase()) + '</span></div>');
  } else k.hidden = true;
  const bb = s.querySelector('#ro-btns'), items = [btn('TRY AGAIN', () => startRun(selectedCharId)), btn('NEW HERO', showCharSelect), btn('TITLE', showTitle)];
  items.forEach(b => bb.appendChild(b)); setMenu(items, { axis: 'h' });
}

// ─── Victory ───
function buildVictory() {
  const s = $('victory'), c = CHARS[selectedCharId];
  const conf = $('confetti'); let ch = '';
  for (let i = 0; i < 70; i++) ch += '<i style="left:' + Math.floor(Math.random() * 100) + 'vw;top:' + Math.floor(Math.random() * 100) + 'vh;background:' + ['#ffcc44', '#fff3b0', '#5fe0c8', '#f4a6c6', '#df6448'][i % 5] + ';animation-delay:-' + (Math.random() * 3).toFixed(2) + 's"></i>';
  conf.innerHTML = ch;
  const build = Object.keys(player.weapons).filter(k => player.weapons[k] > 0).map(w => slotHtml(WEAPONS[w].name, 3)).join('');
  s.innerHTML = '<div class="abs" style="left:0;right:0;top:36px;text-align:center"><div class="t48 gold">VICTORY!</div><div class="t16 cream" style="margin-top:12px">ALL 30 ROUNDS CLEARED · THE VOID EMPEROR FALLS</div></div>' +
    '<div class="abs" id="v-art" style="left:110px;top:170px;width:400px;height:420px"></div>' +
    '<div class="abs panel" style="left:560px;top:170px;width:600px;padding:21px;display:grid;gap:12px"><div class="lbl">' + c.name.toUpperCase() + ' · ' + c.epithet.toUpperCase() + '</div>' +
    '<div class="tally"><span>' + icon('Timer', 2) + 'ROUNDS CLEARED</span><span>30 / 30</span></div><div class="tally"><span>' + icon('Kills', 2) + 'ENEMIES DEFEATED</span><span>' + fmtNum(kills) + '</span></div>' +
    '<div class="tally"><span>' + icon('Gold', 2) + 'GOLD EARNED</span><span class="gold">' + fmtNum(runStats.gold || 0) + '</span></div><div class="tally"><span>' + icon('XP Gem', 2) + 'HERO LEVEL</span><span>' + player.level + '</span></div>' +
    '<div class="tally"><span>' + icon('Golem Core', 2) + 'GOLEM CORES FOUND</span><span>' + (runStats.cores || 0) + '</span></div><div class="rule2"></div><div class="lbl">FINAL BUILD</div><div style="display:flex;gap:9px;flex-wrap:wrap">' + (build || '<div class="desc">Base attack only.</div>') + '</div></div>' +
    '<div class="abs" id="v-btns" style="left:560px;top:640px;display:flex;gap:18px"></div>';
  const art = s.querySelector('#v-art'), burst = uiSprite({ img: IMG['combat/level-up-burst.png'], fw: 72, fh: 96, cols: [0, 1, 2, 3, 4, 5], ms: 110 });
  burst.c.style.position = 'absolute'; burst.c.style.left = '92px'; burst.c.style.top = '0'; art.appendChild(burst.c);
  const hero = heroUiSprite(selectedCharId, 'front', false, 4); hero.c.style.position = 'absolute'; hero.c.style.left = '144px'; hero.c.style.top = '120px'; art.appendChild(hero.c);
  const em = BJ.emperor, ec = frameCanvas(IMG['bosses/' + em.file], em.frame[0], em.frame[1], 0, 0, 1); ec.style.cssText = 'position:absolute;left:250px;top:250px;opacity:.55;filter:grayscale(1) brightness(.6)'; art.appendChild(ec);
  const bb = s.querySelector('#v-btns'), items = [btn('NEW RUN', showCharSelect, 'primary'), btn('TITLE', showTitle)];
  items.forEach(b => bb.appendChild(b)); setMenu(items, { axis: 'h' });
}
