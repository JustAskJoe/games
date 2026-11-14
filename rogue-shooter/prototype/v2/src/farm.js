// ─── The farm, the town and the building interiors ───
// Everything here is the farm-hub art itself (art/concepts/farm-hub.html, town.html, buildings.html), exported by
// art/tools/farmhub/export_world.py into art/sprites/world: a flat base per map, a collision mask, and every
// building, prop, plot cover and crop bed as its own sprite so the hero can walk behind them.
// The sketches are drawn at WS = 2 art pixels per sketch pixel so the 32×44 hero fits the doors and plots.
// © 2026 justaskjoe. All rights reserved.
const WJ = ASSET_JSON['world/world.json'];
const WS = WJ.scale;
const AREA_NAME = { farm: 'THE FARM', town: 'TOWN', in_cabin: 'CABIN', in_forge: 'FORGE', in_alchemy: 'ALCHEMY LAB', in_training: 'TRAINING GROUNDS', in_shrine: 'SHRINE', in_barn: 'BARN', in_arena: 'ARENA' };
const TOWN_KEEPERS = [{ key: 'seed-keeper', x: 112, y: 250, shop: 'seeds' }, { key: 'shopkeeper', x: 576, y: 252, shop: 'store' }];
const ROOM_PEOPLE = { in_barn: 'farmer', in_arena: 'arena-warrior' };
let worldMaps = null, farmTime = 0, penAnimals = [];

// ─── Map data, built once from world.json ───
function maskOf(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data, m = new Uint8Array(img.width * img.height);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4] > 127 ? 1 : 0;
  return m;
}
function initWorld() {
  if (worldMaps) return;
  worldMaps = {};
  for (const [id, mj] of Object.entries(WJ.maps)) {
    const base = IMG['world/' + mj.base], sol = IMG['world/' + mj.solid];
    worldMaps[id] = { id, j: mj, w: base.width, h: base.height, base, mask: maskOf(sol), sprites: [], rects: [] };
  }
  for (const s of WJ.sprites) {
    const m = worldMaps[s.map]; if (!m || s.g === 'x') continue;
    m.sprites.push(Object.assign({ img: IMG['world/' + WJ.atlases[s.at[0]]] }, s));
  }
  for (const m of Object.values(worldMaps)) m.sprites.sort((a, b) => a.sy - b.sy);
}
// Which export groups show right now: lots until a building is built, plot covers until a plot is cleared.
function spriteOn(s) {
  const g = s.g;
  if (g === 'static') return true;
  const i = g.indexOf(':'), kind = i < 0 ? g : g.slice(0, i), arg = i < 0 ? '' : g.slice(i + 1);
  if (kind === 'lot') return !bld[arg];
  if (kind === 'built') return bld[arg] > 0;
  if (kind === 'cover') return !farmPlots[+arg - 1].open;
  if (kind === 'bed') return farmPlots[+arg - 1].open;
  if (kind === 'scarecrow') return farmPlots.filter(p => p.open).length > 4;
  return false;
}
function refreshCollision(m) {
  m.rects = m.sprites.filter(s => s.solid && spriteOn(s)).map(s => s.solid);
  if (m.id === 'town') for (const k of TOWN_KEEPERS) m.rects.push([k.x - 5, k.y - 3, 10, 4]);
  if (ROOM_PEOPLE[m.id] && m.j.people.length) { const [x, y] = m.j.people[0]; m.rects.push([x - 5, y - 3, 10, 4]); }
}
function worldChanged() { if (worldMaps) for (const m of Object.values(worldMaps)) refreshCollision(m); }
// Collision in sketch pixels: the exported mask (water, cliffs, walls) plus the footprints of what is standing.
function blockedAt(m, wx, wy) {
  const x = Math.floor(wx / WS), y = Math.floor(wy / WS);
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
  if (m.mask[y * m.w + x]) return true;
  for (const r of m.rects) if (x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]) return true;
  return false;
}
function heroBlocked(m, x, y) { return blockedAt(m, x - 5, y) || blockedAt(m, x + 5, y) || blockedAt(m, x, y - 3) || blockedAt(m, x - 4, y - 2) || blockedAt(m, x + 4, y - 2); }

// ─── Run state for the farm ───
let seedBag = {}, harvestBin = {}, lastGrowRound = 1;
function initFarmState() {
  initWorld();
  farmPlots = WJ.maps.farm.plots.map((r, i) => {
    const row = Math.floor(i / 6), c = i % 6;
    const group = Math.min(6, row < 2 ? Math.floor(c / 2) : 3 + (row < 4 ? Math.floor(c / 2) : 3));
    return { n: i + 1, rect: r, group, open: group === 0, crop: null, growLeft: 0 };
  });
  seedBag = { 'wheat': 2, 'healing-herb': 2 }; harvestBin = {}; player.nextCrop = null; player.crop = null; lastGrowRound = 1;
  farmMaps = worldMaps; penAnimals = [];
  worldChanged();
}
function groupOpenRound(g) { return PLOT_GROUPS[g][0]; }
function groupCost(g) { return PLOT_GROUPS[g][1]; }
function openPlotGroup(g) { for (const p of farmPlots) if (p.group === g) p.open = true; worldChanged(); }

function enterFarm(fromRound) {
  state = 'farm'; setScreen(null); hideHud(); farmShopOpen = null; shopKeys = null;
  player.crop = null; player.hurtT = null; player.atk = null; player.ability = null; player.invT = 0; player.buffs = {};
  syncWeapons();
  if (lastGrowRound < currentRound) {               // a round has passed: crops grow
    for (const p of farmPlots) if (p.crop && p.growLeft > 0) p.growLeft -= currentRound - lastGrowRound;
    lastGrowRound = currentRound;
  }
  const sp = WJ.maps.farm.spawn;
  goArea('farm', sp[0] * WS, sp[1] * WS);
  player.view = 'front'; player.flip = false;
  const got = collectYields();
  showNotification(got.length ? 'THE BARN: ' + got.join(' · ') : 'THE FARM · ROUND ' + currentRound, '#8fe07a');
  $('farmhud').hidden = false; updateFarmHud();
  // Training Grounds: pick a stat after every fight (design: a popup after each round)
  if (fromRound && bld.training && trainedRound !== currentRound) setTimeout(() => { if (state === 'farm' && !farmShopOpen) openTraining(true); }, 350);
}
function goArea(id, x, y) {
  farmArea = id; player.x = x; player.y = y; player.moving = false; transCooldown = 0.4;
  const m = worldMaps[id]; refreshCollision(m); placeCamera(m, true);
}
function placeCamera(m) {
  const mw = m.w * WS, mh = m.h * WS, vw = W(), vh = H();
  camera.x = mw <= vw ? mw / 2 : Math.max(vw / 2, Math.min(mw - vw / 2, player.x));
  camera.y = mh <= vh ? mh / 2 : Math.max(vh / 2, Math.min(mh - vh / 2, player.y - 16));
}
// Leaving an interior puts the hero back outside its door.
function doorOf(id) { return id === 'cabin' ? WJ.maps.farm.cabin_door : WJ.maps.farm.sites[id].door; }
function enterRoom(id) {
  const m = WJ.maps['in_' + id], e = m.exit;
  goArea('in_' + id, (e[0] + e[2] / 2) * WS, (e[1] - 4) * WS);
  player.view = 'back'; player.flip = false;
  showNotification(AREA_NAME['in_' + id], '#ffcc44');
}
function leaveRoom() {
  const id = farmArea.slice(3), d = doorOf(id);
  goArea('farm', d[0] * WS, (d[1] + 12) * WS);
  player.view = 'front'; player.flip = false;
}

// ─── Moving about ───
function inBox(b, x, y, pad) { const sx = x / WS, sy = y / WS, p = pad || 0; return sx >= b[0] - p && sx < b[0] + b[2] + p && sy >= b[1] - p && sy < b[1] + b[3] + p; }
function updateFarm(dt) {
  const m = worldMaps[farmArea]; if (!m) return;
  farmTime += dt;
  updatePenAnimals(dt);
  if (farmShopOpen) return;
  const mv = moveInput();   // keyboard or touch stick (touch.js)
  let dx = mv.dx, dy = mv.dy;
  const len = Math.hypot(dx, dy);
  player.moving = len > 0;
  if (player.moving) {
    dx /= len; dy /= len;
    const sp = player.speed * 1.6 * mv.mag * dt;
    const nx = player.x + dx * sp, ny = player.y + dy * sp;
    if (!heroBlocked(m, nx, player.y)) player.x = nx;
    if (!heroBlocked(m, player.x, ny)) player.y = ny;
    player.view = viewFrom(dx, dy); if (player.view === 'side') player.flip = dx < 0;
    player.walkT += dt;
  }
  placeCamera(m);
  if (transCooldown > 0) transCooldown -= dt;
  else if (checkExits(m)) return;
  findInteraction(m);
  updateFarmHud();
}
function checkExits(m) {
  if (m.id.startsWith('in_')) { if (inBox(m.j.exit, player.x, player.y) && moveInput().dy > 0.5) { leaveRoom(); return true; } return false; }
  for (const ex of m.j.exits || []) if (inBox(ex.box, player.x, player.y, 2)) {
    if (ex.to === 'battle') { hideFarmHud(); showBattleMap(); return true; }
    const back = (WJ.maps[ex.to].exits || []).find(e => e.to === m.id);
    goArea(ex.to, back.arrive[0] * WS, back.arrive[1] * WS);
    showNotification(AREA_NAME[ex.to], ex.to === 'town' ? '#5fe0c8' : '#8fe07a');
    return true;
  }
  return false;
}
// What Enter does here, nearest first.
function findInteraction(m) {
  farmInteract = null;
  const sx = player.x / WS, sy = player.y / WS, near = (p, r) => Math.hypot(p[0] - sx, p[1] - sy) < r;
  if (m.id === 'farm') {
    if (near(m.j.cabin_door, 14)) farmInteract = { type: 'room', id: 'cabin', label: 'ENTER THE CABIN' };
    for (const id of BUILD_ORDER) {
      if (farmInteract) break;
      const site = m.j.sites[id];
      if (bld[id] && near(site.door, 16)) farmInteract = { type: 'room', id, label: 'ENTER THE ' + BUILDINGS[id].name.toUpperCase() };
      else if (!bld[id] && (near(site.sign, 18) || near(site.door, 18))) farmInteract = { type: 'site', id, label: BUILDINGS[id].name.toUpperCase() + ' SITE · LOOK' };
    }
    if (!farmInteract) {
      let best = null, bd = 13;
      for (const p of farmPlots) { const r = p.rect, d = Math.hypot(r[0] + r[2] / 2 - sx, r[1] + r[3] / 2 - (sy - 2)); if (d < bd) { bd = d; best = p; } }
      if (best) {
        if (!best.open) {
          const g = best.group, open = currentRound >= groupOpenRound(g);
          farmInteract = { type: 'clear', plot: best, label: open ? 'CLEAR ' + (g === 6 ? 6 : 4) + ' PLOTS · ' + groupCost(g) + 'G' : 'OPENS AT ROUND ' + groupOpenRound(g), quiet: !open };
        } else if (!best.crop) farmInteract = { type: 'plant', plot: best, label: 'PLANT A SEED' };
        else if (best.growLeft <= 0) farmInteract = { type: 'harvest', plot: best, label: 'HARVEST ' + CROPS[best.crop].name.toUpperCase() };
        else farmInteract = { type: 'growing', plot: best, label: CROPS[best.crop].name.toUpperCase() + ' · ' + best.growLeft + ' ROUND' + (best.growLeft > 1 ? 'S' : '') + ' LEFT', quiet: true };
      }
    }
  } else if (m.id === 'town') {
    for (const [shop, door] of Object.entries(m.j.shops)) if (near(door, 16)) farmInteract = { type: shop, label: 'ENTER THE ' + (shop === 'seeds' ? 'SEED SHOP' : 'GENERAL STORE') };
    if (!farmInteract) for (const k of TOWN_KEEPERS) if (near([k.x, k.y], 16)) farmInteract = { type: k.shop, label: 'TALK TO THE ' + (k.shop === 'seeds' ? 'SEED KEEPER' : 'SHOPKEEPER') };
  } else {
    for (const [what, x, y, r] of m.j.stations) if (near([x, y], r * 0.8 + 6)) { farmInteract = { type: 'station', id: what, label: stationLabel(what) }; break; }
    if (!farmInteract && inBox(m.j.exit, player.x, player.y, 4)) farmInteract = { type: 'leave', label: 'LEAVE', quiet: false };
  }
  const el = $('farm-prompt');
  if (farmInteract) { el.hidden = false; setHtmlEl(el, (farmInteract.quiet ? '' : KEY('ENTER') + ' ') + farmInteract.label); } else el.hidden = true;
}
function stationLabel(id) {
  return { storage: 'OPEN STORAGE', forge: 'USE THE ANVIL', alchemy: 'OPEN THE RECIPE BOOK', training: 'START TRAINING', shrine: 'MAKE AN OFFERING', barn: 'TALK TO THE FARMER', arena: 'TALK TO THE ARENA WARRIOR' }[id] || 'USE';
}
function setHtmlEl(el, h) { if (el._h !== h) { el._h = h; el.innerHTML = h; } }
function updateFarmHud() {
  setHtmlEl($('farm-gold'), icon('Gold', 2) + '<span class="gold">' + coins + '</span>');
  setHtmlEl($('farm-where'), '<span class="gold">ROUND ' + currentRound + '</span><span class="dim t8">' + (AREA_NAME[farmArea] || '') + '</span>' + (player.nextCrop ? '<span class="t8" style="display:flex;gap:6px;align-items:center">' + icon(CROPS[player.nextCrop].name, 2) + 'NEXT ROUND</span>' : ''));
}

// ─── Actions ───
function farmAction() {
  const z = farmInteract; if (!z || farmShopOpen) return;
  if (z.type === 'room') return enterRoom(z.id);
  if (z.type === 'leave') return leaveRoom();
  if (z.type === 'site') return openSite(z.id);
  if (z.type === 'station') return openStation(z.id);
  if (z.type === 'seeds') return openSeedShop();
  if (z.type === 'store') return openStore();
  if (z.type === 'plant') return openPlanting(z.plot);
  if (z.type === 'clear') {
    const g = z.plot.group;
    if (currentRound < groupOpenRound(g)) return showNotification('OPENS AT ROUND ' + groupOpenRound(g), '#ff8a70');
    if (coins < groupCost(g)) return showNotification('NEED ' + groupCost(g) + ' GOLD', '#ff8a70');
    coins -= groupCost(g); openPlotGroup(g);
    showNotification('PLOTS CLEARED', '#8fe07a'); return;
  }
  if (z.type === 'harvest') {
    const n = Object.values(harvestBin).reduce((a, b) => a + b, 0);
    if (n >= 20) return showNotification('HARVEST BIN IS FULL', '#ff8a70');
    harvestBin[z.plot.crop] = (harvestBin[z.plot.crop] || 0) + 1;
    showNotification('+1 ' + CROPS[z.plot.crop].name.toUpperCase() + ' · TO THE BIN', '#8fe07a');
    z.plot.crop = null;
  }
}
function openStation(id) {
  if (id === 'storage') return openCabin();
  ({ forge: openForge, alchemy: openAlchemy, training: openTraining, shrine: openShrine, barn: openBarn, arena: openArena })[id]();
}

// ─── Animals in the pen (barn) ───
function updatePenAnimals(dt) {
  if (farmArea !== 'farm') return;
  const want = bld.barn ? barnStalls.filter(a => ANIMAL[a].art) : [];
  if (penAnimals.map(a => a.id).join() !== want.join()) {
    const pen = WJ.maps.farm.pen;
    penAnimals = want.map((id, i) => ({ id, x: pen[0] + 22 + i * 30, y: pen[1] + 40 + (i % 2) * 24, tx: 0, ty: 0, t: Math.random() * 3, flip: i % 2 === 1, walk: 0 }));
  }
  const pen = WJ.maps.farm.pen;
  for (const a of penAnimals) {
    a.t -= dt;
    if (a.t <= 0) { a.t = 2 + Math.random() * 3; a.tx = pen[0] + 14 + Math.random() * (pen[2] - 28); a.ty = pen[1] + 26 + Math.random() * (pen[3] - 40); a.walk = 1.4; }
    if (a.walk > 0) {
      a.walk -= dt; const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
      if (d > 1) { a.x += dx / d * 10 * dt; a.y += dy / d * 10 * dt; a.flip = dx < 0; } else a.walk = 0;
    }
  }
}

// ─── Drawing ───
function cropFrame(p) {
  const c = CROPS[p.crop], s = FJ[p.crop], frac = (c.grow - p.growLeft) / c.grow;
  if (p.growLeft <= 0) return s.frames === 5 ? 3 + Math.floor(farmTime / 0.7) % 2 : 3;
  return frac >= 0.5 ? 2 : frac >= 0.25 ? 1 : 0;
}
function drawFarmWorld() {
  const m = worldMaps[farmArea]; if (!m) return;
  ctx.fillStyle = farmArea.startsWith('in_') ? '#07060a' : '#2f5a22'; ctx.fillRect(0, 0, W(), H());
  const ox = Math.round(W() / 2 - camera.x), oy = Math.round(H() / 2 - camera.y);
  ctx.drawImage(m.base, 0, 0, m.w, m.h, ox, oy, m.w * WS, m.h * WS);
  const vis = s => { const x = ox + s.x * WS, y = oy + s.y * WS; return x < W() && y < H() && x + s.w * WS > 0 && y + s.h * WS > 0; };
  const draw = s => ctx.drawImage(s.img, s.at[1], s.at[2], s.w, s.h, ox + s.x * WS, oy + s.y * WS, s.w * WS, s.h * WS);
  const items = [];
  for (const s of m.sprites) {
    if (!spriteOn(s) || !vis(s)) continue;
    if (s.flat) draw(s); else items.push({ y: s.sy * WS, s });
  }
  if (m.id === 'farm') {
    for (const p of farmPlots) if (p.open && p.crop) items.push({ y: (p.rect[1] + p.rect[3] - 2) * WS, plot: p });
    for (const a of penAnimals) items.push({ y: a.y * WS, animal: a });
  }
  if (m.id === 'town') for (const k of TOWN_KEEPERS) items.push({ y: k.y * WS, npc: k.key, x: k.x * WS });
  if (ROOM_PEOPLE[m.id] && m.j.people.length) items.push({ y: m.j.people[0][1] * WS, npc: ROOM_PEOPLE[m.id], x: m.j.people[0][0] * WS });
  items.push({ y: player.y, hero: true });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    if (it.hero) { drawHero(); continue; }
    if (it.s) { draw(it.s); continue; }
    if (it.plot) {
      // crop strips are 16 px wide, drawn at the world scale and stood on the bed
      const p = it.plot, s = FJ[p.crop], r = p.rect, x = ox + (r[0] + r[2] / 2) * WS - s.w * WS / 2, y = oy + (r[1] + r[3] - 1) * WS - s.h * WS;
      ctx.drawImage(IMG['farm/' + p.crop + '.png'], cropFrame(p) * s.w, 0, s.w, s.h, Math.round(x), Math.round(y), s.w * WS, s.h * WS);
      continue;
    }
    if (it.animal) {
      const a = it.animal, key = ANIMAL[a.id].art + (a.walk > 0 ? '-walk' : '-idle'), s = FJ[key], i = Math.floor(farmTime / 0.18) % s.frames;
      const x = ox + a.x * WS, y = oy + a.y * WS;
      drawShadow(x, y, s.w * 0.6, false);
      blit(IMG['farm/' + key + '.png'], i * s.w, 0, s.w, s.h, Math.round(x - s.w / 2), Math.round(y - s.h), a.flip);
      continue;
    }
    if (it.npc) {
      const key = it.npc + '-idle-front', s = FJ[key], i = Math.floor(farmTime / 0.8) % s.frames, p = worldToCanvas(it.x, it.y);
      drawShadow(p.x, p.y, 18, false);
      ctx.drawImage(IMG['farm/' + key + '.png'], i * s.w, 0, s.w, s.h, p.x - (s.w >> 1), p.y - s.h, s.w, s.h);
    }
  }
}
