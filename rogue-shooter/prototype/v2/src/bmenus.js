// ─── Farm menus: building sites, the six building menus (art/concepts/buildings.html), cabin storage,
// planting, the seed shop and the general store (art/concepts/menus-2.html) ───
// © 2026 justaskjoe. All rights reserved.
let shopKeys = null;   // extra keys for the open menu (U upgrade, E equip, R reroll...); return true when handled

function farmScreen(html) { farmShopOpen = true; shopKeys = null; hideFarmHud(); const s = $('farmshop'); s.innerHTML = html; setScreen('farmshop'); return s; }
function closeFarmShop() { farmShopOpen = null; shopKeys = null; setScreen(null); $('farmhud').hidden = false; transCooldown = 0.3; worldChanged(); syncWeapons(); }
function wallet(withMats) {
  let h = '<div class="w g">' + icon('Gold', 2) + coins + '</div>';
  if (withMats) for (const k of Object.keys(MATERIALS)) h += '<div class="w">' + icon(MATERIALS[k].name, 2) + materials[k] + '</div>';
  return h;
}
const bad = t => showNotification(t, '#ff8a70');
const good = t => showNotification(t, '#8fe07a');
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function npcFace(key) {
  const img = IMG['farm/' + key + '-idle-front.png'], c = document.createElement('canvas'); c.width = 96; c.height = 90; c.className = 'spr';
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 2, 32, 30, 0, 0, 96, 90); return c;
}

// ─── Shared building frame: header with tier pips, wallet, upgrade footer ───
function bFrame(id, inner, hints) {
  const B = BUILDINGS[id], t = bld[id];
  let pips = ''; for (let i = 0; i < 3; i++) pips += '<i class="' + (i < t ? 'on' : '') + '"></i>';
  const up = t < 3 ? '<b>UPGRADE TO T' + (t + 1) + '</b><br>' + B.tiers[t].unlocks.toUpperCase() + '<br>' + costHtml(B.tiers[t].cost)
    : '<b>' + B.name.toUpperCase() + ' T3</b><br>' + B.tiers[2].unlocks.toUpperCase() + '<br><span class="dim">FULLY UPGRADED</span>';
  return '<div class="' + B.theme + '" style="position:absolute;inset:0">' +
    '<div class="abs bhead panel">' + slotHtml(B.icon, 4) + '<div class="t"><div class="nm gold">' + B.name.toUpperCase() + '</div><div class="tier"><span class="dim">TIER</span>' + pips + '<span class="sub" style="margin-left:6px">' + B.sub + '</span></div></div></div>' +
    '<div class="abs wallet panel">' + wallet(true) + '</div>' + inner +
    '<div class="abs bfoot"><div class="upg panel' + (t < 3 && canPay(B.tiers[t].cost) ? ' can' : '') + '" id="upg">' + slotHtml('Upgrade', 2) + '<div>' + up + '</div></div>' +
    '<div class="hint">' + hints + (t < 3 ? ' ' + KEY('U') + ' UPGRADE' : '') + ' ' + KEY('ESC') + ' LEAVE</div></div></div>';
}
function upgradeBuilding(id, reopen) {
  const t = bld[id]; if (t >= 3) return;
  const c = BUILDINGS[id].tiers[t].cost;
  if (!canPay(c)) return bad(needText(c));
  pay(c); bld[id]++; worldChanged(); syncWeapons();
  showNotification(BUILDINGS[id].name.toUpperCase() + ' UPGRADED TO TIER ' + bld[id], '#ffcc44');
  reopen();
}
// Every building menu: wire the upgrade footer and the U key, plus the menu's own keys.
function bWire(s, id, reopen, keysFn) {
  const u = s.querySelector('#upg'); if (u) u.addEventListener('click', () => upgradeBuilding(id, reopen));
  shopKeys = (k, e) => {
    if (k === 'u' || k === 'U') { upgradeBuilding(id, reopen); return true; }
    return keysFn ? keysFn(k, e) : false;
  };
}

// ─── Building site: what it is, what it does, what it costs, Build ───
function builtPreview(id) {
  const ss = worldMaps.farm.sprites.filter(s => s.g === 'built:' + id);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of ss) { x0 = Math.min(x0, s.x); y0 = Math.min(y0, s.y); x1 = Math.max(x1, s.x + s.w); y1 = Math.max(y1, s.y + s.h); }
  // paint at 1x, trim to what is actually drawn, then blow it up as far as the frame allows
  const t = document.createElement('canvas'); t.width = x1 - x0; t.height = y1 - y0;
  const tg = t.getContext('2d');
  for (const s of ss.filter(s => s.flat).concat(ss.filter(s => !s.flat).sort((a, b) => a.sy - b.sy))) tg.drawImage(s.img, s.at[1], s.at[2], s.w, s.h, s.x - x0, s.y - y0, s.w, s.h);
  const d = tg.getImageData(0, 0, t.width, t.height).data; let a0 = t.width, b0 = t.height, a1 = 0, b1 = 0;
  for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) if (d[(y * t.width + x) * 4 + 3] > 40) { if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y; }
  const bw = a1 - a0 + 1, bh = b1 - b0 + 1, k = Math.max(1, Math.min(4, Math.floor(Math.min(540 / bw, 290 / bh))));
  const c = document.createElement('canvas'); c.width = bw * k; c.height = bh * k; c.className = 'spr';
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(t, a0, b0, bw, bh, 0, 0, bw * k, bh * k);
  return c;
}
function needRows(c) {
  const row = (name, have, need) => '<div class="ing">' + slotHtml(name, 2) + '<span>' + need + ' ' + name.toUpperCase() + '</span><span class="have' + (have >= need ? '' : ' short') + '">' + have + ' / ' + need + '</span></div>';
  let h = '';
  if (c.g) h += row('Gold', coins, c.g);
  for (const k in c.m || {}) h += row(MATERIALS[k].name, materials[k] || 0, c.m[k]);
  if (c.any) h += '<div class="ing"><div class="slot"></div><span>' + c.any + ' MATERIALS OF ANY KIND</span><span class="have' + (spareMats() >= c.any ? '' : ' short') + '">' + spareMats() + ' / ' + c.any + '</span></div>';
  return h;
}
function openSite(id) {
  const B = BUILDINGS[id], c = B.tiers[0].cost, ok = canPay(c);
  const later = B.tiers.slice(1).map((t, i) => '<div class="tierrow"><span class="tagk dim">T' + (i + 2) + '</span><span class="t8">' + t.unlocks.toUpperCase() + '</span>' + costHtml(t.cost) + '</div>').join('');
  const s = farmScreen('<div class="' + B.theme + '" style="position:absolute;inset:0">' +
    '<div class="abs bhead panel">' + slotHtml(B.icon, 4) + '<div class="t"><div class="nm gold">' + B.name.toUpperCase() + '</div><div class="tier"><span class="dim">BUILDING SITE · NOT BUILT YET</span></div></div></div>' +
    '<div class="abs wallet panel">' + wallet(true) + '</div>' +
    '<div class="abs panel site-l" style="left:24px;top:120px;width:620px;height:560px;padding:21px;display:grid;gap:12px;align-content:start">' +
    '<span class="lbl">WHAT IT IS</span><div class="desc site-desc">' + esc(B.what) + '</div><div class="rule2"></div>' +
    '<span class="lbl">WHAT IT DOES</span><ul class="does">' + B.does.map(d => '<li>' + esc(d) + '</li>').join('') + '</ul><div class="rule2"></div>' +
    '<span class="lbl">UPGRADES LATER</span>' + later + '</div>' +
    '<div class="abs panel" style="left:660px;top:120px;width:596px;height:560px;padding:18px 21px;display:grid;gap:9px;align-content:start;justify-items:center">' +
    '<div class="preview" id="site-prev"></div><span class="lbl" style="justify-self:start">TO BUILD · TIER 1: ' + B.tiers[0].unlocks.toUpperCase() + '</span>' +
    '<div class="ingr site-cost" style="width:100%">' + needRows(c) + '</div><div class="site-btns" id="site-btns"></div></div>' +
    '<div class="abs bfoot"><div class="hint">' + KEY('&larr;') + KEY('&rarr;') + ' CHOOSE ' + KEY('ENTER') + ' SELECT ' + KEY('ESC') + ' LEAVE</div></div></div>');
  s.querySelector('#site-prev').appendChild(builtPreview(id));
  const b1 = btn('BUILD THE ' + B.name.toUpperCase(), () => {
    if (!canPay(c)) return bad(needText(c));
    pay(c); bld[id] = 1; worldChanged(); syncWeapons(); closeFarmShop();
    showNotification(B.name.toUpperCase() + ' BUILT · WALK IN THROUGH THE DOOR', '#ffcc44');
  }, 'primary' + (ok ? '' : ' cant')), b2 = btn('NOT YET', closeFarmShop);
  if (!ok) b1.insertAdjacentHTML('beforeend', '<span class="sub">' + needText(c) + '</span>');
  const bb = s.querySelector('#site-btns'); bb.appendChild(b1); bb.appendChild(b2);
  setMenu([b1, b2], { axis: 'h' });
}

// ─── FORGE ───
let forgeSel = 'frostNova';
function openForge(wid, focus) {
  if (wid) forgeSel = wid; const sel = forgeSel, t = bld.forge, cap = LEVEL_CAP[t], lv = forge.owned[sel] || 0, slots = weaponSlotsOpen();
  const rows = WPN_ORDER.map(w => {
    const l = forge.owned[w] || 0, eq = forge.equip.indexOf(w);
    let pips = ''; for (let i = 0; i < 7; i++) pips += '<i class="' + (i < l ? 'on' : i < cap ? 'cap' : 'lock') + '"></i>';
    const tag = !l ? costHtml({ g: 25, m: { [SIG[w]]: 2 } }) : eq >= 0 && eq < slots ? '<span class="tagk">EQUIPPED · SLOT ' + (eq + 1) + '</span>' : '<span class="tagk dim">OWNED</span>';
    return '<div class="wrow' + (l ? '' : ' no') + (w === sel ? ' cur' : '') + '" data-w="' + w + '">' + slotHtml(WEAPONS[w].name, 3) + '<div class="winfo"><span class="t8">' + weaponTitle(w).toUpperCase() + (forge.mods[w] ? ' · ' + forge.mods[w].toUpperCase() : '') + '</span>' + (l ? '<div class="pips">' + pips + '</div>' : '') + tag + '</div></div>';
  }).join('');
  const nextC = lv ? levelCost(sel) : null, lcInfo = LEVEL_COST[lv];
  let act = '';
  if (!lv) act = '<span class="lbl">BUY</span><span style="white-space:nowrap">' + costHtml({ g: 25, m: { [SIG[sel]]: 2 } }) + '</span>';
  else if (lv >= 7 || !lcInfo) act = '<span class="lbl">MAX LEVEL</span>';
  else if (lcInfo.t > t) act = '<span class="lbl">LEVEL ' + lv + ' &rarr; ' + (lv + 1) + '</span><span class="t8 dim">NEEDS FORGE T' + lcInfo.t + '</span>';
  else act = '<span class="lbl">LEVEL ' + lv + ' &rarr; ' + (lv + 1) + '</span><span style="white-space:nowrap">' + costHtml(nextC) + '</span>';
  const modh = MODS.map(m => '<div class="mod' + (forge.mods[sel] === m.id ? ' have' : '') + (t < 2 || !lv ? ' lockd' : '') + '" data-m="' + m.id + '"><span class="hot">' + m.name.toUpperCase() + (forge.mods[sel] === m.id ? ' &#10003;' : '') + '</span><span class="desc" style="font-size:15px;line-height:16px">' + m.eff + '</span>' + costHtml({ m: m.m }) + '</div>').join('');
  const gates = EVO_GATES[sel], evoh = gates.map((g, i) => {
    const you = heroStat(g.stat), ok = you >= g.val && lv >= 5 && t >= 3, done = forge.evo[sel] === (i ? 'alt' : 'main');
    return '<div class="evo' + (ok && !forge.evo[sel] ? ' ok' : '') + (done ? ' have' : '') + '" data-e="' + i + '"><div class="evopic" data-strip="' + g.strip + '"></div><span class="hot">' + g.name.toUpperCase() + (done ? ' &#10003;' : '') + '</span><span>NEEDS ' + g.label + ' + LEVEL 5</span><span class="' + (you >= g.val ? 'ok3' : 'dim') + '">YOU: ' + statText(g.stat, you) + ' · LV ' + lv + '</span></div>';
  }).join('');
  const inner = '<div class="abs panel" style="left:24px;top:120px;width:388px;height:560px;padding:18px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px"><span class="h hot">WEAPONS</span><span class="lbl">SLOTS ' + forge.equip.slice(0, slots).length + '/' + slots + (slots < 2 ? ' · 2ND AFTER R5' : '') + '</span></div>' +
    '<div class="wlist">' + rows + '</div></div>' +
    '<div class="abs panel" style="left:428px;top:120px;width:828px;height:560px;padding:18px;display:grid;gap:12px;align-content:start">' +
    '<div class="anvil">' + slotHtml(WEAPONS[sel].name, 4) + '<div style="display:grid;gap:9px"><span class="t24 hot">' + weaponTitle(sel).toUpperCase() + '</span>' +
    '<span class="desc">' + esc(WPN_DESC[sel]) + ' Signature material: ' + MATERIALS[SIG[sel]].name + '.</span>' +
    '<span class="t8">' + (lv ? 'LEVEL ' + lv + ' / ' + cap + ' <span class="dim">· ' + esc(getWpnDesc(sel, lv)).toUpperCase() + '</span>' : '<span class="dim">NOT OWNED YET</span>') + '</span></div>' +
    '<div style="margin-left:auto;display:grid;gap:9px;justify-items:end;flex:none">' + act + '<div id="f-btns" style="display:flex;gap:9px"></div></div></div>' +
    '<div class="fsec"><div style="display:flex;justify-content:space-between"><span class="lbl">MOD · ONE PER WEAPON' + (t < 2 ? ' · FORGE T2' : '') + '</span><span class="lbl">' + (forge.mods[sel] ? 'NOW: ' + forge.mods[sel].toUpperCase() : 'NO MOD') + '</span></div><div class="mods">' + modh + '</div></div>' +
    '<div class="fsec"><div style="display:flex;justify-content:space-between"><span class="lbl">EVOLUTION · FORGE T3 + LEVEL 5' + (forge.evo[sel] ? ' · DONE, PERMANENT' : '') + '</span>' + costHtml({ g: 200, m: { golemCore: 1 } }) + '</div><div class="evos">' + evoh + '</div></div></div>';
  const s = farmScreen(bFrame('forge', inner, KEY('&uarr;') + KEY('&darr;') + ' CHOOSE ' + KEY('ENTER') + ' BUY / LEVEL ' + KEY('E') + ' EQUIP'));
  for (const p of s.querySelectorAll('.evopic')) { const k = p.dataset.strip, st = CJ[k]; p.appendChild(frameCanvas(IMG['combat/' + k + '.png'], st.w, st.h, Math.min(2, st.frames - 1), 0, st.h > 70 ? 1 : 2)); }
  const items = [];
  for (const r of s.querySelectorAll('.wrow')) { r._act = () => forgeMain(r.dataset.w); items.push(r); }
  const fb = s.querySelector('#f-btns');
  const bMain = btn(!lv ? 'BUY' : 'LEVEL UP', () => forgeMain(sel), 'primary small'); fb.appendChild(bMain); items.push(bMain);
  if (lv) { const bEq = btn(forge.equip.includes(sel) ? 'UNEQUIP' : 'EQUIP', () => forgeEquip(sel), 'small'); fb.appendChild(bEq); items.push(bEq); }
  for (const m of s.querySelectorAll('.mod')) { m._act = () => forgeMod(sel, m.dataset.m); items.push(m); }
  for (const e of s.querySelectorAll('.evo')) { e._act = () => forgeEvolve(sel, +e.dataset.e); items.push(e); }
  const startI = focus !== undefined ? focus : WPN_ORDER.indexOf(sel);
  setMenu(items, { i: Math.min(items.length - 1, startI), onSelect: i => { const w = items[i].dataset && items[i].dataset.w; if (w && w !== forgeSel) openForge(w, i); } });
  bWire(s, 'forge', () => openForge(sel, menu ? menu.i : 0), k => { if (k === 'e' || k === 'E') { forgeEquip(forgeSel); return true; } return false; });
}
function forgeMain(w) {
  const lv = forge.owned[w] || 0, focus = menu ? menu.i : 0;
  if (!lv) {
    const c = { g: 25, m: { [SIG[w]]: 2 } }; if (!canPay(c)) return bad(needText(c));
    pay(c); forge.owned[w] = 1;
    if (forge.equip.length < weaponSlotsOpen()) forge.equip.push(w);
    good(WEAPONS[w].name.toUpperCase() + ' FORGED' + (forge.equip.includes(w) ? ' · EQUIPPED' : '')); syncWeapons(); return openForge(w, focus);
  }
  const lc = LEVEL_COST[lv];
  if (!lc || lv >= 7) return bad('ALREADY AT MAX LEVEL');
  if (lv >= LEVEL_CAP[bld.forge]) return bad('LEVEL CAP ' + LEVEL_CAP[bld.forge] + ' · UPGRADE THE FORGE');
  const c = levelCost(w); if (!canPay(c)) return bad(needText(c));
  pay(c); forge.owned[w]++; syncWeapons(); good(WEAPONS[w].name.toUpperCase() + ' LEVEL ' + forge.owned[w]); openForge(w, focus);
}
function forgeEquip(w) {
  if (!forge.owned[w]) return bad('BUY IT FIRST');
  const i = forge.equip.indexOf(w), slots = weaponSlotsOpen();
  if (i >= 0) forge.equip.splice(i, 1);
  else { if (forge.equip.length >= slots) { const out = forge.equip.splice(slots - 1, 1)[0]; good('SWAPPED OUT ' + WEAPONS[out].name.toUpperCase()); } forge.equip.push(w); }
  syncWeapons(); openForge(w, menu ? menu.i : 0);
}
function forgeMod(w, id) {
  if (bld.forge < 2) return bad('MODS NEED FORGE TIER 2');
  if (!forge.owned[w]) return bad('BUY THE WEAPON FIRST');
  if (forge.mods[w] === id) return bad('ALREADY FITTED');
  const m = MODS.find(x => x.id === id), c = { m: m.m }; if (!canPay(c)) return bad(needText(c));
  pay(c); forge.mods[w] = id; good(m.name.toUpperCase() + ' MOD FITTED'); openForge(w, menu ? menu.i : 0);
}
function forgeEvolve(w, alt) {
  const g = EVO_GATES[w][alt];
  if (bld.forge < 3) return bad('EVOLUTIONS NEED FORGE TIER 3');
  if (forge.evo[w]) return bad('ALREADY EVOLVED · IT CAN\'T GO BACK');
  if ((forge.owned[w] || 0) < 5) return bad('NEEDS WEAPON LEVEL 5');
  if (heroStat(g.stat) < g.val) return bad('NEEDS ' + g.label);
  const c = { g: 200, m: { golemCore: 1 } }; if (!canPay(c)) return bad(needText(c));
  pay(c); forge.evo[w] = alt ? 'alt' : 'main'; syncWeapons(); showNotification('EVOLVED: ' + g.name.toUpperCase(), '#ffcc44'); openForge(w, menu ? menu.i : 0);
}

// ─── ALCHEMY LAB ───
const ALC_TABS = ['POTIONS', 'ELIXIRS', 'TONICS', 'CONVERT'];
let alcTab = 0, alcSel = 0;
function convertRows() {
  const rows = [];
  if (bld.alchemy >= 1) rows.push({ id: 'seeds', name: 'SEED UPGRADE', icon: 'Wheat', eff: '3 quick seeds become 1 standard seed' });
  if (bld.alchemy >= 2) for (const k of Object.keys(MATERIALS)) if (k !== 'golemCore') rows.push({ id: k, name: '5 TO 3 ' + MATERIALS[k].name.toUpperCase(), icon: MATERIALS[k].name, eff: '5 of what you hold most of become 3 ' + MATERIALS[k].name });
  return rows;
}
function potionCost(P) { return { g: P.g, m: P.m, c: P.c }; }
function openAlchemy(tab, sel) {
  if (tab !== undefined) alcTab = tab; if (sel !== undefined) alcSel = sel;
  const t = bld.alchemy, tabTier = [1, 2, 3, 1][alcTab];
  const tabs = ALC_TABS.map((n, i) => '<span class="' + (i === alcTab ? 'on' : '') + ([1, 2, 3, 1][i] > t ? ' lock' : '') + '" data-t="' + i + '">' + n + ([1, 2, 3, 1][i] > t ? ' T' + [1, 2, 3, 1][i] : '') + '</span>').join('');
  let list = [], right = '';
  if (alcTab < 3) {
    list = Object.keys(POTIONS).filter(k => POTIONS[k].tier === alcTab + 1).map(k => ({ k, P: POTIONS[k] }));
    alcSel = Math.min(alcSel, list.length - 1);
    const { k, P } = list[alcSel], c = potionCost(P);
    const ing = Object.keys(P.c).map(ck => '<div class="ing">' + slotHtml(cropName(ck), 2) + '<span>' + P.c[ck] + ' ' + cropName(ck).toUpperCase() + (CROPS[ck] ? '' : ' <span class="dim">RARE CROP</span>') + '</span><span class="have' + ((harvestBin[ck] || 0) >= P.c[ck] ? '' : ' short') + '">' + (harvestBin[ck] || 0) + '/' + P.c[ck] + '</span></div>').join('') +
      Object.keys(P.m).map(mk => '<div class="ing">' + slotHtml(MATERIALS[mk].name, 2) + '<span>' + P.m[mk] + ' ' + MATERIALS[mk].name.toUpperCase() + '</span><span class="have' + (materials[mk] >= P.m[mk] ? '' : ' short') + '">' + materials[mk] + '/' + P.m[mk] + '</span></div>').join('') +
      '<div class="ing">' + slotHtml('Gold', 2) + '<span>' + P.g + ' GOLD</span><span class="have' + (coins >= P.g ? '' : ' short') + '">' + coins + '/' + P.g + '</span></div>';
    right = '<div class="slot" style="width:90px;height:90px;background:#d8caa4;box-shadow:inset 0 0 0 3px ' + (P.tier === 3 ? '#c89220' : '#5a2486') + '">' + icon(P.name, 4) + '</div>' +
      '<div class="h">' + P.name.toUpperCase() + '</div><div class="desc" style="color:#6a5040">' + esc(P.eff) + (potency() > 1 ? ' (+25% at T3)' : '') + '</div>' +
      '<div class="lbl">ONE BREW = ONE POTION · YOU HAVE ' + potionsHeld(k) + '</div><div class="ingr" style="width:100%;text-align:left;gap:6px">' + ing + '</div>' +
      '<div id="brew"></div>';
  } else {
    list = convertRows().map(r => ({ k: r.id, R: r }));
    alcSel = Math.min(alcSel, Math.max(0, list.length - 1));
    right = list.length ? '<div class="slot" style="width:90px;height:90px;background:#d8caa4">' + icon(list[alcSel].R.icon, 4) + '</div><div class="h">' + list[alcSel].R.name + '</div><div class="desc" style="color:#6a5040">' + esc(list[alcSel].R.eff) + '.</div><div class="lbl">' + (list[alcSel].k === 'seeds' ? 'RARE SEEDS ARE NOT IN THE GAME YET' : 'MATERIAL SWAPS · ALCHEMY T2') + '</div><div id="brew"></div>' : '<div class="desc" style="color:#6a5040">Conversion opens with the Alchemy Lab.</div>';
  }
  const recs = list.map((r, i) => r.P
    ? '<div class="rec' + (canPay(potionCost(r.P)) && r.P.tier <= t ? '' : ' miss') + '" data-i="' + i + '">' + icon(r.P.name, 2) + '<div><div class="n">' + r.P.name.toUpperCase() + '</div><div class="e">' + esc(r.P.eff) + '</div></div></div>'
    : '<div class="rec" data-i="' + i + '">' + icon(r.R.icon, 2) + '<div><div class="n">' + r.R.name + '</div><div class="e">' + esc(r.R.eff) + '</div></div></div>').join('');
  const chest = []; for (let i = 0; i < 10; i++) chest.push(potionChest[i] ? slotHtml(POTIONS[potionChest[i]].name, 3) : '<div class="slot"></div>');
  const beltH = BELT_KEYS.map((k, i) => '<div class="slot" style="width:72px;height:72px' + (i < beltSlots() ? '' : ';opacity:.4') + '"><span class="key" style="position:absolute;left:-9px;top:-12px">' + k + '</span>' + (i >= beltSlots() ? icon('Lock', 2) : belt[i] ? icon(POTIONS[belt[i].id].name, 3) + '<span class="n">' + belt[i].n + '</span>' : '') + '</div>').join('');
  const lbl = ['BASIC POTIONS · 2 CROPS + 3 MATERIALS + 10G', 'ELIXIRS · 4 CROPS + 5 MATERIALS + 25G', 'LEGENDARY TONICS · RARE CROPS + 10 MATERIALS', 'CONVERT · SEEDS AND MATERIALS'][alcTab];
  const inner = '<div class="abs book" style="left:24px;top:144px;width:820px;height:536px"><div class="page"><div class="tabs">' + tabs + '</div>' +
    '<div class="lbl" style="margin-bottom:12px">' + lbl + (tabTier > t ? ' · NEEDS ALCHEMY T' + tabTier : '') + '</div><div class="recipes">' + recs + '</div></div>' +
    '<div class="page" style="display:grid;gap:9px;align-content:start;justify-items:center;text-align:center">' + right + '</div></div>' +
    '<div class="abs panel" style="left:860px;top:144px;width:396px;height:536px;padding:18px;display:grid;gap:15px;align-content:start">' +
    '<div class="lbl">POTION BELT</div><div class="belt" style="display:flex;gap:12px">' + beltH + '</div><div class="rule" style="height:3px;background:#6a3c98"></div>' +
    '<div class="lbl">POTION CHEST · ' + potionChest.length + ' / 10</div><div class="chest">' + chest.join('') + '</div><div class="rule" style="height:3px;background:#6a3c98"></div>' +
    '<div class="desc">Brews go onto the belt when there is room, otherwise into the chest. ' + KEY('1') + '-' + KEY(String(beltSlots())) + ' puts the selected potion from the chest on that belt slot.</div></div>';
  const s = farmScreen(bFrame('alchemy', inner, KEY('&larr;') + KEY('&rarr;') + ' TAB ' + KEY('&uarr;') + KEY('&darr;') + ' RECIPE ' + KEY('ENTER') + ' BREW'));
  for (const sp of s.querySelectorAll('.tabs span')) sp.addEventListener('click', () => openAlchemy(+sp.dataset.t, 0));
  const items = [...s.querySelectorAll('.rec')];
  items.forEach((r, i) => r._act = () => alcBrew(list[i]));
  const br = s.querySelector('#brew');
  if (br && list.length) { const b = btn(alcTab < 3 ? 'BREW' : 'CONVERT', () => alcBrew(list[alcSel]), 'primary'); b.style.justifyContent = 'center'; b.style.width = '100%'; br.appendChild(b); b.addEventListener('click', () => alcBrew(list[alcSel])); }
  if (items.length) setMenu(items, { i: alcSel, onSelect: i => { if (i !== alcSel) openAlchemy(alcTab, i); } });
  bWire(s, 'alchemy', () => openAlchemy(), (k) => {
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { openAlchemy((alcTab + 3) % 4, 0); return true; }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { openAlchemy((alcTab + 1) % 4, 0); return true; }
    if (/^[1-3]$/.test(k) && alcTab < 3 && list[alcSel]) { setBeltFromChest(+k - 1, list[alcSel].k); openAlchemy(); return true; }
    return false;
  });
}
function potionsHeld(id) { return potionChest.filter(x => x === id).length + belt.reduce((a, b) => a + (b && b.id === id ? b.n : 0), 0); }
function alcBrew(r) {
  if (!r) return;
  if (r.P) {
    if (r.P.tier > bld.alchemy) return bad('NEEDS ALCHEMY LAB TIER ' + r.P.tier);
    const c = potionCost(r.P); if (!canPay(c)) return bad(needText(c));
    if (potionChest.length >= 10 && !belt.slice(0, beltSlots()).some(b => !b || b.id === r.k)) return bad('POTION CHEST IS FULL');
    pay(c); const where = stowPotion(r.k); good('BREWED ' + r.P.name.toUpperCase() + (where === 'belt' ? ' · ON THE BELT' : ' · IN THE CHEST')); return openAlchemy();
  }
  if (r.k === 'seeds') {
    const q = Object.keys(seedBag).filter(k => seedBag[k] > 0 && CROPS[k].tier === 'QUICK').sort((a, b) => seedBag[b] - seedBag[a]);
    const have = q.reduce((a, k) => a + seedBag[k], 0); if (have < 3) return bad('NEED 3 QUICK SEEDS');
    for (let n = 3; n > 0;) { const k = q.find(x => seedBag[x] > 0); const take = Math.min(n, seedBag[k]); seedBag[k] -= take; n -= take; }
    const std = pick(Object.keys(CROPS).filter(k => CROPS[k].tier === 'STANDARD')); seedBag[std] = (seedBag[std] || 0) + 1;
    good('+1 ' + CROPS[std].name.toUpperCase() + ' SEED'); return openAlchemy();
  }
  // material swap: 5 of what you hold most of (not the target) become 3 of the target
  let from = null; for (const k of Object.keys(MATERIALS)) if (k !== 'golemCore' && k !== r.k && (!from || materials[k] > materials[from])) from = k;
  if (!from || materials[from] < 5) return bad('NEED 5 OF ANOTHER MATERIAL');
  materials[from] -= 5; materials[r.k] += 3; good('5 ' + MATERIALS[from].name.toUpperCase() + ' → 3 ' + MATERIALS[r.k].name.toUpperCase()); openAlchemy();
}
function setBeltFromChest(slot, id) {
  if (slot >= beltSlots()) return bad('BELT SLOT ' + BELT_KEYS[slot] + ' OPENS AT ALCHEMY T2');
  const i = potionChest.indexOf(id); if (i < 0) return bad('NONE IN THE CHEST');
  const b = belt[slot];
  if (b && b.id !== id) { if (potionChest.length - 1 + b.n > 10) return bad('NO ROOM IN THE CHEST FOR WHAT IS ON ' + BELT_KEYS[slot]); for (let n = 0; n < b.n; n++) potionChest.push(b.id); belt[slot] = null; }
  potionChest.splice(potionChest.indexOf(id), 1);
  if (belt[slot]) belt[slot].n++; else belt[slot] = { id, n: 1 };
  good(POTIONS[id].name.toUpperCase() + ' ON ' + BELT_KEYS[slot]);
}

// ─── TRAINING GROUNDS ───
let trainSel = 6;
function openTraining(popup, sel) {
  if (sel !== undefined) trainSel = sel;
  const t = bld.training, cap = TRAIN_CAP[t], g = trainGain(), done = trainedRound === currentRound, cur = TRAIN[trainSel];
  const rows = TRAIN.map((st, i) => {
    const v = trained[st.id] || 0, isSel = i === trainSel; let cells = '';
    for (let k = 0; k < 50; k += 3) cells += '<i class="' + (k < v ? 'on' : isSel && !done && k < Math.min(cap, v + g) ? 'add' : k >= cap ? 't3' : '') + '"></i>';
    return '<div class="srow" data-i="' + i + '">' + slotHtml(st.icon, 2) + '<span class="n">' + st.lab + '</span><div class="track">' + cells + '<b style="left:calc(' + cap + ' / 51 * 100%)"></b></div><span class="v">+' + v + '%</span></div>';
  }).join('');
  const odds = w => w.map((p, i) => '<div class="odd"><span>' + ['COMMON', 'RARE', 'EPIC', 'LEGEND'][i] + '</span><div class="bar"><i style="width:' + p + '%;background:var(--' + ['common', 'rare', 'epic', 'legend'][i] + ')"></i></div><span>' + p + '%</span></div>').join('');
  const v = trained[cur.id] || 0, after = Math.min(cap, v + g);
  const side = cur.id === 'luck'
    ? '<div class="lbl">CARD ODDS NOW · LUCK ' + v + '%</div><div class="odds">' + odds(rarityOdds(v)) + '</div><div class="lbl">AFTER TRAINING · LUCK ' + after + '%</div><div class="odds">' + odds(rarityOdds(after)) + '</div>'
    : '<div class="desc" style="color:var(--ink)">' + { hp: 'More max HP for the rest of the run.', power: 'More damage from every attack and ability.', speed: 'You move faster.', crit: 'More of your hits are critical hits.', armor: 'Every hit you take is smaller (armor caps at 75%).', fire: 'Your basic attack fires more often.' }[cur.id] + '</div><div class="t16 ink">+' + v + '% &rarr; +' + after + '%</div>';
  const inner = '<div class="abs panel" style="left:24px;top:120px;width:796px;height:560px;padding:18px 21px;display:grid;gap:6px;align-content:start">' +
    '<div style="display:flex;justify-content:space-between;align-items:baseline"><span class="h ink">TODAY\'S DRILL</span><span class="lbl">PICK ONE STAT · +' + g + '% · ONCE PER ROUND</span></div><div class="rope"></div>' + rows +
    '<div class="lbl" style="display:flex;justify-content:space-between"><span>BLACK LINE: CAP ' + cap + '% AT TIER ' + t + '</span><span>' + (t < 3 ? 'OUTLINED: LATER TIERS RAISE IT TO 50%' : 'TIER 3: 4 CARDS PER LEVEL-UP') + '</span></div></div>' +
    '<div class="abs panel" style="left:836px;top:120px;width:420px;height:560px;padding:21px;display:grid;gap:15px;align-content:start">' +
    '<div class="npc" style="align-items:center">' + slotHtml(cur.icon, 3) + '<div style="display:grid;gap:6px"><span class="h ink">' + cur.lab + '</span><span class="lbl">' + (cur.id === 'luck' ? 'BETTER LEVEL-UP CARDS' : 'FOR THE REST OF THE RUN') + '</span></div></div><div class="rope"></div>' + side +
    '<div id="t-btn"></div>' + (popup ? '<div class="lbl">AFTER EVERY FIGHT YOU CAN DRILL ONE STAT. ' + KEY('ESC') + ' TO SKIP FOR NOW.</div>' : '') + '</div>';
  const s = farmScreen(bFrame('training', inner, KEY('&uarr;') + KEY('&darr;') + ' CHOOSE ' + KEY('ENTER') + ' TRAIN'));
  const items = [...s.querySelectorAll('.srow')];
  const label = done ? 'TRAINED THIS ROUND · BACK AFTER THE FIGHT' : v >= cap ? 'AT THE CAP · UPGRADE TO RAISE IT' : 'TRAIN ' + cur.lab + ' +' + (after - v) + '%';
  const b = btn(label, () => doTrain(popup), 'primary' + (done || v >= cap ? ' off' : '')); b.style.justifyContent = 'center';
  s.querySelector('#t-btn').appendChild(b); b.addEventListener('click', () => doTrain(popup));
  items.forEach((r, i) => r._act = () => doTrain(popup));
  setMenu(items, { i: trainSel, onSelect: i => { if (i !== trainSel) openTraining(popup, i); } });
  bWire(s, 'training', () => openTraining(popup));
}
function doTrain(popup) {
  const st = TRAIN[trainSel], cap = TRAIN_CAP[bld.training], v = trained[st.id] || 0;
  if (trainedRound === currentRound) return bad('ALREADY TRAINED THIS ROUND');
  if (v >= cap) return bad(st.lab + ' IS AT THE CAP');
  applyTraining(st.id, Math.min(cap, v + trainGain()) - v); trainedRound = currentRound;
  good(st.lab + ' +' + trained[st.id] + '%');
  if (popup) closeFarmShop(); else openTraining(false);
}

// ─── SHRINE ───
let shrineSel = 1, shrineReplace = null;
function rollOffer() { const pool = BLESSINGS.filter(b => !blessings.includes(b.id)).map(b => b.id); const out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return out; }
function openShrine() {
  const t = bld.shrine, slots = shrineSlots(), oc = offeringCost();
  let act = '';
  for (let i = 0; i < 3; i++) {
    const b = blessings[i];
    if (b) act += '<div class="aslot' + (shrineReplace ? ' pickme' : '') + '" data-i="' + i + '">' + slotHtml(BLESS[b].icon, 3) + '<div style="display:grid;gap:6px"><span class="t8 holy">' + BLESS[b].name.toUpperCase() + '</span><span class="desc" style="font-size:15px;line-height:16px;color:#c4cee6">' + BLESS[b].eff + '</span></div></div>';
    else if (i < slots) act += '<div class="aslot empty"><div class="slot"></div><span class="t8 dim">EMPTY SLOT</span></div>';
    else act += '<div class="aslot lockd"><div class="slot">' + icon('Lock', 2) + '</div><span class="t8 dim">SHRINE T' + (i + 1) + '</span></div>';
  }
  const codex = BLESSINGS.map(b => '<div class="' + (blessings.includes(b.id) ? 'got' : '') + '">' + slotHtml(b.icon, 3) + '<span>' + b.name.toUpperCase() + '</span></div>').join('');
  let mid;
  if (shrineReplace) mid = '<span class="h holy">REPLACE WHICH BLESSING?</span><div class="bcard sel">' + slotHtml(BLESS[shrineReplace].icon, 4) + '<span class="n holy">' + BLESS[shrineReplace].name.toUpperCase() + '</span><span class="desc" style="color:#c4cee6">' + BLESS[shrineReplace].eff + '</span></div><div class="desc" style="color:#c4cee6">Your slots are full. Pick an active blessing on the left to give up, or ' + KEY('ESC') + ' to go back.</div>';
  else if (shrineOffer) mid = '<span class="h holy">THE SHRINE ANSWERS</span><div class="blessings" style="margin-top:9px">' + shrineOffer.picks.map(id => '<div class="bcard" data-b="' + id + '">' + slotHtml(BLESS[id].icon, 4) + '<span class="n holy">' + BLESS[id].name.toUpperCase() + '</span><span class="desc" style="color:#c4cee6">' + BLESS[id].eff + '</span></div>').join('') + '</div><div style="display:flex;gap:12px" id="sh-btns"></div>';
  else mid = '<span class="h holy">LEAVE AN OFFERING</span><div class="desc" style="color:#c4cee6;text-align:center;max-width:520px">Lay ' + oc.any + ' materials and ' + oc.g + ' gold in the bowl and the shrine shows you three blessings. Your most plentiful materials go first.</div>' +
    '<div style="display:grid;gap:9px;justify-items:center"><span class="lbl">YOUR OFFERING</span><div class="bowl">' + costHtml(oc) + '</div></div><div id="sh-btns"></div>';
  const inner = '<div class="abs panel" style="left:24px;top:120px;width:276px;height:560px;padding:18px;display:grid;gap:12px;align-content:start"><span class="lbl">ACTIVE BLESSINGS · ' + blessings.length + ' / ' + slots + '</span><div class="active">' + act + '</div><div class="desc" style="color:#c4cee6">A new blessing can replace an active one when your slots are full.</div></div>' +
    '<div class="abs panel" style="left:316px;top:120px;width:648px;height:560px;padding:21px;display:grid;gap:18px;align-content:start;justify-items:center">' + mid + '</div>' +
    '<div class="abs panel" style="left:980px;top:120px;width:276px;height:560px;padding:18px;display:grid;gap:12px;align-content:start"><span class="lbl">ALL 9 BLESSINGS</span><div class="codex">' + codex + '</div></div>';
  const s = farmScreen(bFrame('shrine', inner, shrineOffer ? KEY('&larr;') + KEY('&rarr;') + ' CHOOSE ' + KEY('ENTER') + ' TAKE ' + KEY('R') + ' REROLL' : KEY('ENTER') + ' OFFER'));
  let items = [];
  if (shrineReplace) { items = [...s.querySelectorAll('.aslot.pickme')]; items.forEach(a => a._act = () => { blessings[+a.dataset.i] = shrineReplace; good(BLESS[shrineReplace].name.toUpperCase() + ' BLESSING'); shrineReplace = null; shrineOffer = null; openShrine(); }); setMenu(items); }
  else if (shrineOffer) {
    items = [...s.querySelectorAll('.bcard')];
    items.forEach(c => c._act = () => takeBlessing(c.dataset.b));
    const bb = s.querySelector('#sh-btns'), rr = btn('REROLL · ' + shrineOffer.rerolls + ' LEFT', shrineReroll, 'small' + (shrineOffer.rerolls ? '' : ' off'));
    bb.appendChild(rr); rr.addEventListener('click', shrineReroll);
    setMenu(items, { axis: 'h', i: Math.min(shrineSel, items.length - 1), onSelect: i => { shrineSel = i; } });
  } else {
    const b = btn('MAKE THE OFFERING', () => {
      const c = offeringCost(); if (!canPay(c)) return bad(needText(c));
      pay(c); shrineOffer = { picks: rollOffer(), rerolls: shrineRerolls() }; shrineSel = 1; openShrine();
    }, 'primary'); s.querySelector('#sh-btns').appendChild(b); setMenu([b]);
  }
  bWire(s, 'shrine', openShrine, k => {
    if ((k === 'r' || k === 'R') && shrineOffer && !shrineReplace) { shrineReroll(); return true; }
    if (k === 'Escape' && shrineReplace) { shrineReplace = null; openShrine(); return true; }
    return false;
  });
}
function shrineReroll() { if (!shrineOffer || !shrineOffer.rerolls) return bad(bld.shrine < 2 ? 'REROLLS OPEN AT SHRINE TIER 2' : 'NO REROLLS LEFT'); shrineOffer.rerolls--; shrineOffer.picks = rollOffer(); openShrine(); }
function takeBlessing(id) {
  if (blessings.length < shrineSlots()) { blessings.push(id); shrineOffer = null; showNotification(BLESS[id].name.toUpperCase() + ' BLESSING', '#5fe0c8'); return openShrine(); }
  shrineReplace = id; openShrine();
}

// ─── BARN ───
let barnSel = 0;
function openBarn(sel) {
  if (sel !== undefined) barnSel = sel;
  const t = bld.barn, sell = animalSellPrice();
  let stalls = '';
  for (let i = 0; i < 3; i++) {
    const a = barnStalls[i];
    if (i >= t) stalls += '<div class="stall lockd"><div class="pen">' + icon('Lock', 3) + '</div><span class="n">STALL ' + (i + 1) + '</span><span class="desc">Opens at Barn T' + (i + 1) + '</span></div>';
    else if (!a) stalls += '<div class="stall"><div class="pen"></div><span class="n">EMPTY</span><span class="desc">Buy an animal from the list</span></div>';
    else stalls += '<div class="stall"><div class="pen">' + icon(ANIMAL[a].name, 4) + '</div><span class="n">' + ANIMAL[a].name.toUpperCase() + '</span><span class="desc">' + (a === 'dogs' ? 'Fights beside you' : ANIMAL[a].y[0] + ' ' + ANIMAL[a].unit) + '</span><div class="btn small sellb" data-i="' + i + '">SELL · ' + sell + 'G</div></div>';
  }
  const rows = ANIMALS.map((a, i) => '<div class="arow" data-i="' + i + '">' + slotHtml(a.name, 3) + '<div style="display:grid;gap:6px"><span class="n">' + a.name.toUpperCase() + (animalCount(a.id) ? ' <span class="tagk green" style="margin-left:6px">OWN ' + animalCount(a.id) + '</span>' : '') + '</span><span class="yl">' + a.y.join(' / ') + ' ' + a.unit + '</span></div>' + costHtml({ g: ANIMAL_PRICE }) + '</div>').join('');
  const next = ANIMALS.filter(a => animalCount(a.id)).map(a => '<span style="display:flex;gap:6px;align-items:center">' + icon(a.name, 2) + (a.id === 'dogs' ? '+' + animalCount('dogs') + ' COMPANION' + (animalCount('dogs') > 1 ? 'S' : '') : '+' + animalYield(a.id) + ' ' + (a.id === 'pigs' ? 'GOLD' : a.id === 'chickens' ? 'SEEDS' : a.id === 'goats' ? MATERIALS[goatPick].name.toUpperCase() : a.id === 'bees' ? 'SPORE DUST' : 'MATERIALS')) + '</span>').join('') || '<span class="dim">NOTHING YET</span>';
  const says = animalCount('goats') ? 'Goats bring whatever you ask for. Press G to choose: ' + MATERIALS[goatPick].name + ' right now.' : barnStalls.length ? 'Two of the same animal give more than double. Three cows bring you 20 materials a round!' : 'Every stall can hold one animal. Chickens are a cheap start: seeds every round.';
  const full = barnStalls.length >= t;
  const inner = '<div class="abs panel" style="left:24px;top:120px;width:752px;height:372px;padding:24px"><div class="stalls">' + stalls + '</div></div>' +
    '<div class="abs panel hay" style="left:24px;top:508px;width:752px;height:172px;padding:18px;display:grid;gap:12px;align-content:start"><div class="npc" id="b-npc"><div class="say">' + esc(says) + '</div></div>' +
    '<div class="t8" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><span class="dim">NEXT ROUND</span>' + next + '</div></div>' +
    '<div class="abs panel hay" style="left:792px;top:120px;width:464px;height:560px;padding:18px;display:grid;gap:9px;align-content:start">' +
    '<div style="display:flex;justify-content:space-between"><span class="h gold">BUY AN ANIMAL</span><span class="lbl" style="align-self:center">YIELD X1 / X2 / X3</span></div><div class="market">' + rows + '</div>' +
    (full ? '<div class="btn primary small off" style="justify-content:center">STALLS FULL · SELL ONE FIRST</div>' : '<div class="lbl">' + (t - barnStalls.length) + ' STALL' + (t - barnStalls.length > 1 ? 'S' : '') + ' FREE · ANIMAL PRICES ARE PROPOSED</div>') + '</div>';
  const s = farmScreen(bFrame('barn', inner, KEY('&uarr;') + KEY('&darr;') + ' CHOOSE ' + KEY('ENTER') + ' BUY ' + KEY('S') + ' SELL' + (animalCount('goats') ? ' ' + KEY('G') + ' GOATS' : '')));
  s.querySelector('#b-npc').prepend(npcFace('farmer'));
  const items = [...s.querySelectorAll('.arow')];
  items.forEach((r, i) => r._act = () => {
    if (barnStalls.length >= bld.barn) return bad('STALLS FULL · SELL ONE FIRST');
    if (coins < ANIMAL_PRICE) return bad('NEED ' + ANIMAL_PRICE + ' GOLD');
    coins -= ANIMAL_PRICE; barnStalls.push(ANIMALS[i].id); good('+1 ' + ANIMALS[i].name.toUpperCase()); openBarn(i);
  });
  const sellAt = i => { const a = barnStalls[i]; if (!a) return; barnStalls.splice(i, 1); coins += sell; good('SOLD ' + ANIMAL[a].name.toUpperCase() + ' · +' + sell + 'G'); openBarn(); };
  for (const sb of s.querySelectorAll('.sellb')) sb.addEventListener('click', () => sellAt(+sb.dataset.i));
  setMenu(items, { i: barnSel, onSelect: i => { barnSel = i; } });
  bWire(s, 'barn', () => openBarn(), k => {
    if (k === 's' || k === 'S') { if (!barnStalls.length) bad('NO ANIMALS TO SELL'); else { const i = barnStalls.lastIndexOf(ANIMALS[barnSel].id); sellAt(i >= 0 ? i : barnStalls.length - 1); } return true; }
    if ((k === 'g' || k === 'G') && animalCount('goats')) { const ks = Object.keys(MATERIALS).filter(m => m !== 'golemCore'); goatPick = ks[(ks.indexOf(goatPick) + 1) % ks.length]; openBarn(); return true; }
    return false;
  });
}

// ─── ARENA ───
function openArena(sel) {
  const t = bld.arena, max = t, n = arenaPicks.length;
  const cells = MUTATORS.map((m, i) => '<div class="mut' + (arenaPicks.includes(m.id) ? ' sel2' : '') + (m.t > t ? ' lockd' : '') + '" data-i="' + i + '">' + slotHtml(m.name, 3) + '<span class="n">' + m.name.toUpperCase() + '</span><span class="e">' + m.eff + '</span></div>').join('');
  const says = !n ? 'Pick a mutator and the crowd pays you for the trouble.' : n === 1 ? MUT[arenaPicks[0]].name + '? A fair start. Let\'s see you sweat.' : arenaPicks.map(id => MUT[id].name).join(' and ') + '? The crowd will love you. Or bury you.';
  const danger = Math.min(5, 1 + Math.floor((currentRound - 1) / 6) + n); let dp = ''; for (let i = 0; i < 5; i++) dp += icon('Kills', 2, i < danger ? '' : 'opacity:.25');
  const inner = '<div class="abs panel" style="left:24px;top:120px;width:812px;height:560px;padding:24px 18px 18px;display:grid;gap:12px;align-content:start"><div class="banners">' + '<i></i>'.repeat(9) + '</div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:24px"><span class="h gold">PICK UP TO ' + max + ' MUTATOR' + (max > 1 ? 'S' : '') + '</span><span class="lbl" style="align-self:center">' + (t < 3 ? 'ROW ' + (t + 1) + ' OPENS AT ARENA T' + (t + 1) : 'ALL 15 OPEN AT T3') + '</span></div><div class="mgrid">' + cells + '</div></div>' +
    '<div class="abs panel" style="left:852px;top:120px;width:404px;height:560px;padding:21px;display:grid;gap:15px;align-content:start"><div class="banners">' + '<i></i>'.repeat(5) + '</div>' +
    '<div class="npc" id="a-npc" style="margin-top:24px"><div class="say">' + esc(says) + '</div></div><div class="lbl">REWARD FOR ROUND ' + currentRound + '</div>' +
    '<div class="big">+' + arenaReward(n) + '%</div><div class="t8">GOLD AND MATERIALS' + (n >= 3 ? ' + A GUARANTEED RARE DROP' : '') + '</div>' +
    '<div class="t8" style="display:flex;gap:9px;align-items:center"><span class="dim">DANGER</span>' + dp + '</div><div class="desc">Your picks stay for every fight until you change them.</div><div id="a-btns" style="display:grid;gap:12px;margin-top:6px"></div></div>';
  const s = farmScreen(bFrame('arena', inner, KEY('ENTER') + ' TOGGLE ' + KEY('L') + ' LOCK IN ' + KEY('C') + ' CLEAR'));
  s.querySelector('#a-npc').prepend(npcFace('arena-warrior'));
  const items = [...s.querySelectorAll('.mut')];
  items.forEach((c, i) => c._act = () => {
    const m = MUTATORS[i];
    if (m.t > bld.arena) return bad(m.name.toUpperCase() + ' OPENS AT ARENA TIER ' + m.t);
    const j = arenaPicks.indexOf(m.id);
    if (j >= 0) arenaPicks.splice(j, 1); else { if (arenaPicks.length >= bld.arena) arenaPicks.shift(); arenaPicks.push(m.id); }
    openArena(i);
  });
  const ab = s.querySelector('#a-btns'), lock = btn('LOCK IN', closeFarmShop, 'primary'), clr = btn('CLEAR ALL', () => { arenaPicks = []; openArena(); }, 'small');
  lock.style.justifyContent = clr.style.justifyContent = 'center'; ab.appendChild(lock); ab.appendChild(clr);
  lock.addEventListener('click', closeFarmShop); clr.addEventListener('click', () => { arenaPicks = []; openArena(); });
  setMenu(items, { cols: 5, i: sel || 0 });
  bWire(s, 'arena', () => openArena(menu ? menu.i : 0), k => {
    if (k === 'l' || k === 'L') { closeFarmShop(); if (arenaPicks.length) showNotification('ARENA: ' + arenaPicks.map(id => MUT[id].name.toUpperCase()).join(' + ') + ' · +' + arenaReward(arenaPicks.length) + '%', '#ffcc44'); return true; }
    if (k === 'c' || k === 'C') { arenaPicks = []; openArena(); return true; }
    return false;
  });
}

// ─── Cabin storage: potion belt, Potion Chest and harvest bin (menus-2.html) ───
function openCabin(sel) {
  const binKeys = Object.keys(harvestBin).filter(k => harvestBin[k] > 0), total = binKeys.reduce((a, k) => a + harvestBin[k], 0);
  let bin = ''; for (let i = 0; i < 20; i++) { const k = binKeys[i]; bin += '<div class="slot binslot" data-k="' + (k || '') + '">' + (k ? icon(CROPS[k].name, 3) + '<span class="n">' + harvestBin[k] + '</span>' : '') + '</div>'; }
  const beltH = BELT_KEYS.map((key, i) => '<div class="slot belt beltslot" data-i="' + i + '"' + (i < beltSlots() ? '' : ' style="opacity:.4"') + '><span class="key">' + key + '</span>' + (i >= beltSlots() ? icon('Lock', 2) : belt[i] ? icon(POTIONS[belt[i].id].name, 3) + '<span class="n">' + belt[i].n + '</span>' : '') + '</div>').join('');
  let chest = ''; for (let i = 0; i < 10; i++) chest += '<div class="slot chestslot" data-i="' + i + '">' + (potionChest[i] ? icon(POTIONS[potionChest[i]].name, 3) : '') + '</div>';
  const s = farmScreen('<div class="abs bhead panel">' + slotHtml('Heal Flask', 3) + '<div class="t"><div class="nm gold">CABIN</div><div class="t8 dim">STORAGE</div></div></div>' +
    '<div class="abs wallet panel">' + wallet(true) + '</div>' +
    '<div class="abs panel" style="left:24px;top:120px;width:420px;height:548px;padding:18px;display:grid;gap:12px;align-content:start"><span class="h gold">POTION BELT</span><div class="lbl">TAKEN INTO THE FIGHT · ' + beltSlots() + ' SLOTS</div><div style="display:flex;gap:12px">' + beltH + '</div>' +
    '<div class="rule2"></div><span class="h gold">POTION CHEST</span>' + (bld.alchemy ? '<div class="lbl">' + potionChest.length + ' / 10 · ENTER MOVES A POTION TO THE BELT</div><div class="chest">' + chest + '</div>' : '<div class="desc">The Potion Chest opens with the Alchemy Lab. Until then, potions from the general store go straight onto the belt.</div>') + '</div>' +
    '<div class="abs panel" style="left:460px;top:120px;width:796px;height:548px;padding:18px;display:grid;gap:12px;align-content:start"><div style="display:flex;justify-content:space-between"><span class="h gold">HARVEST BIN</span><span class="lbl" style="align-self:center">' + total + ' / 20 CROPS</span></div>' +
    '<div class="bin">' + bin + '</div><div class="rule2"></div><div class="pick" id="cabin-pick"></div></div>' +
    '<div class="abs bfoot"><div class="hint">' + KEY('&larr;') + KEY('&rarr;') + ' CHOOSE ' + KEY('ENTER') + ' USE ' + KEY('ESC') + ' LEAVE</div></div>');
  const items = [];
  for (const c of s.querySelectorAll('.chestslot')) { const id = potionChest[+c.dataset.i]; if (!id) continue; c._kind = 'chest'; c._act = () => { const n = beltSlots(); let slot = belt.slice(0, n).findIndex(b => b && b.id === id); if (slot < 0) slot = belt.slice(0, n).findIndex(b => !b); if (slot < 0) return bad('BELT IS FULL'); setBeltFromChest(slot, id); openCabin(items.indexOf(c)); }; items.push(c); }
  for (const c of s.querySelectorAll('.beltslot')) { const i = +c.dataset.i, b = belt[i]; if (!b || i >= beltSlots()) continue; c._kind = 'belt'; c._act = () => { if (!bld.alchemy) return bad('NO CHEST YET · IT OPENS WITH THE ALCHEMY LAB'); if (potionChest.length >= 10) return bad('POTION CHEST IS FULL'); potionChest.push(b.id); b.n--; if (b.n <= 0) belt[i] = null; openCabin(items.indexOf(c)); }; items.push(c); }
  for (const e of s.querySelectorAll('.binslot')) { if (!e.dataset.k) continue; e._kind = 'bin'; e._act = () => { const k = e.dataset.k; if (player.nextCrop) harvestBin[player.nextCrop] = (harvestBin[player.nextCrop] || 0) + 1; player.nextCrop = k; harvestBin[k]--; good('EAT ' + CROPS[k].name.toUpperCase() + ' BEFORE THE FIGHT'); openCabin(); }; items.push(e); }
  const pick_ = s.querySelector('#cabin-pick');
  const uses = k => Object.values(POTIONS).filter(P => P.c[k]).map(P => P.name).slice(0, 3);
  const show = i => {
    const it = items[i];
    if (it && it._kind === 'bin') {
      const k = it.dataset.k, u = uses(k);
      pick_.innerHTML = slotHtml(CROPS[k].name, 4) + '<div style="display:grid;gap:9px"><span class="t16">' + CROPS[k].name.toUpperCase() + ' x' + harvestBin[k] + '</span><span class="desc">' + CROPS[k].buff + '</span></div>' +
        '<div class="usebtn sel"><span class="t8 gold">EAT FOR NEXT ROUND</span><span class="desc">' + CROPS[k].buff + ' for one round</span></div><div class="usebtn"' + (bld.alchemy ? '' : ' style="opacity:.5"') + '><span class="t8">KEEP FOR ALCHEMY</span><span class="desc">' + (u.length ? 'Goes in ' + u.join(', ') : 'Not in a recipe') + (bld.alchemy ? '' : ' (build the Alchemy Lab)') + '</span></div>';
    } else if (it) {
      const id = it._kind === 'chest' ? potionChest[+it.dataset.i] : belt[+it.dataset.i].id, P = POTIONS[id];
      pick_.innerHTML = slotHtml(P.name, 4) + '<div style="display:grid;gap:9px"><span class="t16">' + P.name.toUpperCase() + '</span><span class="desc">' + esc(P.eff) + '</span></div><div class="usebtn sel"><span class="t8 gold">' + (it._kind === 'chest' ? 'PUT ON THE BELT' : 'BACK TO THE CHEST') + '</span><span class="desc">' + (it._kind === 'chest' ? 'Drink it in a fight with Q, E or R' : 'Frees the belt slot') + '</span></div>';
    } else pick_.innerHTML = '<div class="desc" style="grid-column:1/-1">' + (player.nextCrop ? 'Eating ' + CROPS[player.nextCrop].name + ' before the next fight: ' + CROPS[player.nextCrop].buff + '.' : 'Harvest ripe crops on the farm; they wait here until you eat one before a fight or brew with them.') + '</div>';
  };
  if (items.length) setMenu(items, { axis: 'h', i: Math.max(0, Math.min(items.length - 1, sel || 0)), onSelect: show }); else show(-1);
}

// ─── Planting, seed shop and general store (menus-2.html) ───
function bagSlots() {
  const keys_ = Object.keys(seedBag).filter(k => seedBag[k] > 0);
  let h = ''; for (let i = 0; i < 12; i++) { const k = keys_[i]; h += '<div class="slot bagslot" data-k="' + (k || '') + '">' + (k ? icon(CROPS[k].name, 3) + '<span class="n">' + seedBag[k] + '</span>' : '') + '</div>'; }
  return h;
}
function openPlanting(plot) {
  const keys_ = Object.keys(seedBag).filter(k => seedBag[k] > 0);
  if (!keys_.length) return bad('NO SEEDS · BUY SOME IN TOWN');
  const s = farmScreen('<div class="abs bhead panel">' + slotHtml('Wheat', 3) + '<div class="t"><div class="nm gold">PLANTING</div><div class="t8 dim">PLOT ' + plot.n + ' · ' + farmPlots.filter(p => p.open).length + ' / 30 PLOTS OPEN</div></div></div>' +
    '<div class="abs wallet panel">' + wallet(false) + '</div>' +
    '<div class="abs panel" style="left:394px;top:150px;width:492px;padding:18px;display:grid;gap:12px;align-content:start"><div class="lbl">SEED BAG · ' + keys_.length + ' / 12</div><div class="bag">' + bagSlots() + '</div><div class="rule2"></div><div class="pick" id="plant-pick" style="grid-template-columns:72px 1fr"></div></div>' +
    '<div class="abs bfoot"><div class="hint">' + KEY('&larr;') + KEY('&rarr;') + ' PICK SEED ' + KEY('ENTER') + ' PLANT ' + KEY('ESC') + ' DONE</div></div>');
  const slots = [...s.querySelectorAll('.bagslot')].filter(e => e.dataset.k), pk = s.querySelector('#plant-pick');
  slots.forEach(e => e._act = () => { const k = e.dataset.k; seedBag[k]--; plot.crop = k; plot.growLeft = CROPS[k].grow; good('PLANTED ' + CROPS[k].name.toUpperCase()); closeFarmShop(); });
  setMenu(slots, { axis: 'h', onSelect: i => { const k = slots[i].dataset.k, c = CROPS[k]; pk.innerHTML = slotHtml(c.name, 4) + '<div style="display:grid;gap:6px"><span class="t16">' + c.name.toUpperCase() + '</span><span class="t8"><span class="tagk" style="background:' + (c.tier === 'QUICK' ? '#6cb046' : '#c9a03c') + '">' + c.tier + '</span> <span class="dim">' + c.grow + ' ROUND' + (c.grow > 1 ? 'S' : '') + ' · 1x1</span></span><span class="desc">' + c.buff + ' when eaten.</span></div>'; } });
}
function shopItem(iconName, title, sub, desc, price, act) {
  const d = document.createElement('div'); d.className = 'item' + (price > coins ? ' cant' : '');
  d.innerHTML = slotHtml(iconName, 3) + '<div style="display:grid;gap:6px"><span class="t8">' + title + '</span>' + (sub ? '<span class="t8">' + sub + '</span>' : '') + '<span class="e">' + esc(desc) + '</span></div><span class="price">' + icon('Gold', 2) + price + '</span>';
  d._act = () => { if (price > coins) { bad('NEED ' + price + ' GOLD'); return; } act(); };
  return d;
}
function keeperPanel(key, says) {
  const p = document.createElement('div'); p.className = 'abs panel'; p.style.cssText = 'left:24px;top:120px;width:300px;height:548px;padding:18px;display:grid;gap:12px;align-content:start;justify-items:center';
  const k = document.createElement('div'); k.className = 'keeper'; k.appendChild(uiSprite({ img: IMG['farm/' + key + '-idle-front.png'], fw: 32, fh: 44, cols: [0, 1], ms: 700, scale: 4 }).c);
  p.appendChild(k); p.insertAdjacentHTML('beforeend', '<div class="say" style="width:100%">' + esc(says) + '</div>');
  return p;
}
function openSeedShop(selKey) {
  const stock = cropsInStock();
  const s = farmScreen('<div class="t-seed" style="position:absolute;inset:0"><div class="abs bhead panel">' + slotHtml('Healing Herb', 3) + '<div class="t"><div class="nm gold">SEED SHOP</div><div class="t8 dim">' + zoneOf(currentRound).name.toUpperCase() + ' STOCK · NEW SEEDS EVERY ROUND</div></div></div>' +
    '<div class="abs wallet panel" style="width:auto">' + wallet(false) + '</div>' +
    '<div class="abs panel" style="left:340px;top:120px;width:580px;height:548px;padding:18px;display:grid;gap:9px;align-content:start"><div style="display:flex;justify-content:space-between"><span class="h gold">TODAY\'S SEEDS</span><span class="lbl" style="align-self:center">' + (currentRound >= 6 ? 'QUICK + STANDARD' : 'QUICK CROPS') + '</span></div><div class="stock" id="seed-stock"></div><div class="lbl">' + (currentRound >= 6 ? 'RARE SEEDS FROM ROUND 11 · LEGENDARY FROM ROUND 16' : 'STANDARD SEEDS FROM ROUND 6') + '</div></div>' +
    '<div class="abs panel" style="left:936px;top:120px;width:320px;height:548px;padding:18px;display:grid;gap:12px;align-content:start"><div class="lbl">YOUR SEED BAG · ' + Object.keys(seedBag).filter(k => seedBag[k] > 0).length + ' / 12 SLOTS</div><div class="bag" style="grid-template-columns:repeat(4, 60px)">' + bagSlots() + '</div></div>' +
    '<div class="abs bfoot"><div class="hint">' + KEY('&uarr;') + KEY('&darr;') + ' CHOOSE ' + KEY('ENTER') + ' BUY ' + KEY('ESC') + ' LEAVE</div></div></div>');
  s.querySelector('.t-seed').appendChild(keeperPanel('seed-keeper', currentRound >= 6 ? CHARS[selectedCharId].name + "s do well on Iron Vine. Plant it twice and you'll feel it." : 'Quick crops are ready by the next round. Eat one before you head out.'));
  const st = s.querySelector('#seed-stock'), items = [];
  for (const k of stock.slice(0, 7)) {
    const c = CROPS[k];
    const it = shopItem(c.name, c.name.toUpperCase(), '<span class="tagk" style="background:' + (c.tier === 'QUICK' ? '#6cb046' : '#c9a03c') + '">' + c.tier + '</span> <span class="dim">' + c.grow + ' ROUND' + (c.grow > 1 ? 'S' : '') + ' · 1x1</span>', c.buff, c.price, () => {
      const used = Object.keys(seedBag).filter(x => seedBag[x] > 0).length;
      if (!seedBag[k] && used >= 12) return bad('SEED BAG IS FULL');
      coins -= c.price; seedBag[k] = (seedBag[k] || 0) + 1; good('+1 ' + c.name.toUpperCase() + ' SEED'); openSeedShop(k);
    });
    it.dataset.k = k; st.appendChild(it); items.push(it);
  }
  setMenu(items, { i: Math.max(0, items.findIndex(e => e.dataset.k === selKey)) });
}
function openStore(sel) {
  const s = farmScreen('<div class="t-store" style="position:absolute;inset:0"><div class="abs bhead panel">' + slotHtml('Gold', 3) + '<div class="t"><div class="nm gold">GENERAL STORE</div><div class="t8 dim">BUY AND SELL</div></div></div>' +
    '<div class="abs wallet panel">' + wallet(true) + '</div>' +
    '<div class="abs panel" style="left:340px;top:120px;width:500px;height:548px;padding:18px;display:grid;gap:9px;align-content:start"><div class="h gold" style="margin-bottom:6px">BUY</div><div class="stock" id="buy"></div></div>' +
    '<div class="abs panel" style="left:856px;top:120px;width:400px;height:548px;padding:18px;display:grid;gap:9px;align-content:start"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="h gold">SELL</span><span class="lbl" style="align-self:center">FROM YOUR BIN AND BAG</span></div><div class="stock sellp" id="sell"></div></div>' +
    '<div class="abs bfoot"><div class="hint">' + KEY('&uarr;') + KEY('&darr;') + ' CHOOSE ' + KEY('ENTER') + ' BUY OR SELL ' + KEY('ESC') + ' LEAVE</div></div></div>');
  s.querySelector('.t-store').appendChild(keeperPanel('shopkeeper', bld.alchemy ? 'Brewing your own now? I still sell the basics, for when the cauldron runs dry.' : 'More field, more crops. And a flask or two never hurt anyone.'));
  const items = [], buy = s.querySelector('#buy'), sell = s.querySelector('#sell');
  for (const c of CONSUMABLE_SHOP) {
    const it = shopItem(c.icon, c.name.toUpperCase(), '', c.desc + ' (you have ' + potionsHeld(c.id) + ')', c.cost, () => {
      const where = stowPotion(c.id);
      if (!where) return bad(bld.alchemy ? 'BELT AND CHEST ARE FULL' : 'NO ROOM ON THE BELT');
      coins -= c.cost; good('+1 ' + c.name.toUpperCase() + (where === 'chest' ? ' · IN THE CHEST' : ' · ON THE BELT')); openStore(items.indexOf(it));
    });
    buy.appendChild(it); items.push(it);
  }
  const next = farmPlots.find(p => !p.open && currentRound >= groupOpenRound(p.group));
  if (next) { const g = next.group, it = shopItem('Upgrade', 'FIELD EXPANSION', '', 'Clears ' + (g === 6 ? 6 : 4) + ' more crop plots', groupCost(g), () => { coins -= groupCost(g); openPlotGroup(g); good('PLOTS CLEARED'); openStore(items.indexOf(it)); }); buy.appendChild(it); items.push(it); }
  const sellRow = (iconName, label, count, price, act) => { const d = document.createElement('div'); d.className = 'item'; d.innerHTML = slotHtml(iconName, 3, 'slot', '<span class="n">' + count + '</span>') + '<span class="t8">' + label + '</span><span class="price">' + icon('Gold', 2) + price + ' EA</span>'; d._act = act; sell.appendChild(d); items.push(d); };
  for (const k of Object.keys(harvestBin)) if (harvestBin[k] > 0) sellRow(CROPS[k].name, CROPS[k].name.toUpperCase(), harvestBin[k], Math.round(CROPS[k].price * 0.4), () => { harvestBin[k]--; coins += Math.round(CROPS[k].price * 0.4); openStore(); });
  for (const k of Object.keys(materials)) if (materials[k] > 0 && k !== 'golemCore') sellRow(MATERIALS[k].name, MATERIALS[k].name.toUpperCase(), materials[k], 2, () => { materials[k]--; coins += 2; openStore(); });
  setMenu(items, { i: Math.min(items.length - 1, sel || 0) });
}
