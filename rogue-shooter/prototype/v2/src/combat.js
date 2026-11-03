// ─── Combat: spawning, enemies, bosses, the hero's attacks, abilities and weapons ───
const TAU = Math.PI * 2;
const SPAWN_DUR = 0.62;            // combat/enemy-spawn.png: the rune plays before the enemy can act
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function norm(x, y) { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; }
function viewFrom(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'back' : 'front'; }
function phaseAt(t) { let p = PHASES[0]; for (const ph of PHASES) if (t >= ph.from) p = ph; return p; }
function shake(t, i) { if (!options.shake) return; shakeTimer = Math.max(shakeTimer, t); shakeIntensity = Math.max(shakeIntensity, i); }
function addFx(dir, key, x, y, o) { fx.push(Object.assign({ dir, key, x, y, t: 0, dur: stripDur(dir, key) }, o || {})); }
function addExtraFx(e, name, x, y, o) {
  const info = extraInfo(e.art, name); if (!info) return null;
  const ms = Array(info.count).fill(o && o.frameMs || 120);
  const f = Object.assign({ extra: info, dirKey: e.dir, x, y, t: 0, ms, dur: animDur(ms) }, o || {});
  fx.push(f); return f;
}

// ─── Spawning ───
function spawnInterval() {
  const t = gameTime;
  const base = t < 30 ? 1.6 : t < 90 ? 1.6 - (t - 30) / 60 * 0.95 : t < MINIBOSS_AT ? 0.55 : 1.5;
  return base / roundSc.spawn / spawnRateMult();
}
function pickZoneEnemy() {
  const pool = zone.pool.filter(p => gameTime >= p[2]);
  let tot = 0; for (const p of pool) tot += p[1];
  let r = Math.random() * tot;
  for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; }
  return pool[0][0];
}
function spawnRing() { return Math.hypot(W() / 2, H() / 2) * 0.82; }
function freeSpot(x, y, r) {
  for (const o of obstacles) if (o.r && Math.hypot(o.x - x, o.y - y) < o.r + r + 4) return false;
  for (const o of blockers) if (insideBlocker(o, x, y, r)) return false;
  return Math.abs(x) < ARENA - 20 && Math.abs(y) < ARENA - 20;
}
function spawnPointNear(cx, cy, minD, maxD, r) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * TAU, d = rnd(minD, maxD);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (freeSpot(x, y, r || 8)) return { x, y };
  }
  const a = Math.random() * TAU;
  return { x: Math.max(-ARENA + 30, Math.min(ARENA - 30, cx + Math.cos(a) * maxD)), y: Math.max(-ARENA + 30, Math.min(ARENA - 30, cy + Math.sin(a) * maxD)) };
}
function makeEnemy(key, x, y, tier) {
  const boss = !!tier, def = boss ? BOSS[key] : ENEMY[key], art = boss ? BJ[key] : EJ[key];
  const mm = enemyMods(tier), hp = Math.max(1, Math.round(roundSc.hp * def.hp * mm.hp));
  spawnCount++;
  return {
    key, def, art, dir: boss ? 'bosses' : 'enemies', tier: tier || null, x, y, hp, maxHp: hp, shield: !boss && mut('shielded') && spawnCount % 5 === 0,
    speed: roundSc.spd * (def.spd || 0) * mm.spd, dmg: roundSc.dmg * (def.dmg || 0) * mm.dmg,
    r: Math.max(5, Math.round(art.frame[0] * 0.35)), t: Math.random() * 5, view: 'front', flip: false,
    spawnT: 0, hitFlash: 0, slowT: 0, slowF: 1, stunT: 0, hexT: 0, buffT: 0,
    act: null, actT: 0, cd: rnd(1, 3), vx: 0, vy: 0, alpha: 1, hidden: !!def.hidden, phased: false,
    attackIdx: 0, dead: false, seen: false
  };
}
function spawnEnemy(key, at, tier) {
  const art = tier ? BJ[key] : EJ[key];
  const p = at || spawnPointNear(player.x, player.y, spawnRing(), spawnRing() + 50, art.frame[0] * 0.35);
  const e = makeEnemy(key, p.x, p.y, tier); enemies.push(e); return e;
}
function spawnAssassin() {
  const a = Math.atan2(player.aim.y, player.aim.x) + Math.PI;
  const x = player.x + Math.cos(a) * 70, y = player.y + Math.sin(a) * 70;
  return spawnEnemy('shade', freeSpot(x, y, 8) ? { x, y } : null);
}
function spawnRegular() {
  const key = pickZoneEnemy();
  if (key === 'shade') return spawnAssassin();
  return spawnEnemy(key);
}
function spawnMiniBoss() {
  const key = isBossRound(currentRound) ? zone.boss : pick(zone.minis);
  const tier = isBossRound(currentRound) ? 'major' : 'mini';
  const e = spawnEnemy(key, spawnPointNear(player.x, player.y, 90, 120, 30), tier);
  bossRef = e; shake(0.5, 8);
  showNotification((tier === 'major' ? 'BOSS: ' : 'MINI-BOSS: ') + e.art.name.toUpperCase(), tier === 'major' ? '#f070ff' : '#c0402f');
  return e;
}

// ─── The hero ───
// The crop eaten on the farm for this round (design: harvest and use as a one-round buff).
function cropIs(k) { return player.crop === k; }
function damageMult() {
  let m = 1 + (player.powerBonus || 0);
  m *= 1 + player.momentum * player.aliveT;
  if (player.hp < player.maxHp * 0.5) m *= 1 + player.adrenaline;
  m *= extraDamageMult();
  return m;
}
function rollHit(mult) {
  const crit = Math.random() < player.critChance + extraCrit() + (cropIs('shadow-mushroom') ? 0.1 : 0);
  return { dmg: player.damage * damageMult() * (mult || 1) * (crit ? critMultNow() : 1), crit };
}
function attackSlowdown() {
  let s = 1;
  for (const e of enemies) if (e.def.fear && !e.dead && dist(e, player) < 46) s *= 1.15;
  if (player.dreadT > 0) s *= 1.3;
  return s;
}
function updatePlayer(dt) {
  player.aliveT += dt;
  updateBuildingEffects(dt);
  if (player.invT > 0) player.invT -= dt;
  if (player.stunT > 0) player.stunT -= dt;
  if (player.slowT > 0) player.slowT -= dt;
  if (player.dreadT > 0) player.dreadT -= dt;
  if (player.hurtT !== null) { player.hurtT += dt; if (player.hurtT > 0.48) player.hurtT = null; }
  const regen = mut('noRegen') ? 0 : player.regen + extraRegen() + (cropIs('healing-herb') && gameTime < 30 ? 1 : 0);
  if (regen > 0) player.hp = Math.min(player.maxHp, player.hp + regen * dt);
  if (cropIs('frost-berry')) for (const e of enemies) if (!e.dead && dist(e, player) < 40) { e.slowT = Math.max(e.slowT, 0.2); e.slowF = Math.min(e.slowF, 0.9); }
  // spacebar ability charges and cooldown
  const c = CHARS[selectedCharId];
  if (player.abilityCd > 0) {
    player.abilityCd -= dt;
    if (player.abilityCd <= 0 && c.charges) { player.charges = Math.min(c.charges, player.charges + 1); if (player.charges < c.charges) player.abilityCd = c.cooldown; }
  }
  if (player.ability) { updateAbility(dt); return; }

  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1;
  const len = Math.hypot(dx, dy);
  player.moving = len > 0 && player.stunT <= 0;
  if (player.moving) {
    dx /= len; dy /= len;
    let sp = player.speed;
    if (player.slowT > 0) sp *= 1 - player.slowPct;
    if (inSpores()) sp *= 0.6;
    sp *= extraSpeedMult();
    if (cropIs('pep-root')) sp *= 1.1;
    for (const e of enemies) if (e.def.gravity && !e.dead && dist(e, player) < 56) sp *= 0.75;
    player.x += dx * sp * dt; player.y += dy * sp * dt;
    player.aim = { x: dx, y: dy }; player.view = viewFrom(dx, dy); if (player.view === 'side') player.flip = dx < 0;
    player.walkT += dt;
  }
  // gravity wells pull
  for (const e of enemies) if (e.def.gravity && !e.dead && e.spawnT >= SPAWN_DUR) {
    const d = dist(e, player); if (d < 56 && d > 4) { const n = norm(e.x - player.x, e.y - player.y); player.x += n.x * 22 * dt; player.y += n.y * 22 * dt; }
  }
  if (player.knock) { player.x += player.knock.x * dt; player.y += player.knock.y * dt; player.knock.t -= dt; if (player.knock.t <= 0) player.knock = null; }
  keepInArena(player, 8); pushOut(player, 8);
  hazardTouch(dt);
  // auto attack
  if (player.atk) { player.atk.t += dt; if (player.atk.t >= player.atk.dur) player.atk = null; }
  player.attackTimer -= dt / attackSlowdown() * (cropIs('thunder-turnip') ? 1.2 : 1) * extraAtkSpeed();
  hitCtx = 'base';
  if (player.attackTimer <= 0 && tryAttack()) {
    player.attackTimer = player.attackInterval;
    if (Math.random() < echoChance()) { const n = bullets.length; tryAttack(); for (let i = n; i < bullets.length; i++) { bullets[i].x += rnd(-4, 4); bullets[i].y += rnd(-4, 4); } }
  }
  hitCtx = null;
}
function nearestEnemy(range, visibleOnly) {
  let best = null, bd = range;
  for (const e of enemies) {
    if (e.dead || e.spawnT < SPAWN_DUR || e.phased || (visibleOnly && e.hidden)) continue;
    const d = dist(player, e) - e.r; if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function startAttackAnim(view, flip) {
  const ms = HJ.timing_ms.attack, full = animDur(ms), dur = Math.min(full, player.attackInterval * 0.95);
  player.atk = { t: 0, dur, k: dur / full, view, flip };
}
// Every basic attack aims itself at the nearest enemy; only the spacebar ability uses the way the hero faces.
function attackView(tgt) {
  const v = viewFrom(tgt.x - player.x, tgt.y - player.y);
  return [v, v === 'side' ? tgt.x < player.x : false];
}
function tryAttack() {
  const c = CHARS[selectedCharId], ms = player.multiShot;
  if (c.kind === 'pulse') {
    const tgt = nearestEnemy(c.range * (ms >= 5 ? 2 : ms >= 3 ? 1.5 : 1.15)); if (!tgt) return false;
    witchPulse(1, 2);
    startAttackAnim(...attackView(tgt));
    return true;
  }
  const tgt = nearestEnemy(c.kind === 'slash' ? c.range + 20 : c.kind === 'dagger' ? c.range + 20 : c.range, true); if (!tgt) return false;
  const ty = tgt.y - tgt.art.frame[1] * 0.35, a = Math.atan2(ty - (player.y - 16), tgt.x - player.x);
  if (c.kind === 'bolt') {
    const n = 1 + ms;
    for (let i = 0; i < n; i++) {
      const aa = a + (i - (n - 1) / 2) * 0.28, h = rollHit();
      bullets.push({ kind: 'bolt', x: player.x, y: player.y - 18, vx: Math.cos(aa) * 130, vy: Math.sin(aa) * 130, life: 2.2, dmg: h.dmg, crit: h.crit, pierce: 0, hit: new Set(), target: tgt });
    }
  } else if (c.kind === 'slash') {
    // the arc is centred on the target
    const arc = Math.min(Math.PI * 1.5, Math.PI / 2 + ms * Math.PI / 6), sa = Math.atan2(tgt.y - player.y, tgt.x - player.x);
    for (const e of enemies) {
      if (e.dead || e.spawnT < SPAWN_DUR || e.phased) continue;
      const d = Math.hypot(e.x - player.x, (e.y - e.r * 0.6) - (player.y - 14));
      if (d > c.range + e.r) continue;
      let da = Math.atan2(e.y - player.y, e.x - player.x) - sa; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > arc / 2 && d > e.r + 6) continue;
      const h = rollHit(); hitEnemy(e, h.dmg, h.crit, player);
    }
  } else if (c.kind === 'dagger') {
    const n = 1 + ms;
    for (let i = 0; i < n; i++) {
      const aa = a + (i - (n - 1) / 2) * 0.14, h = rollHit();
      bullets.push({ kind: 'dagger', x: player.x, y: player.y - 16, vx: Math.cos(aa) * 240, vy: Math.sin(aa) * 240, life: 0.32, dmg: h.dmg, crit: h.crit, pierce: 0, hit: new Set() });
    }
  } else if (c.kind === 'pierce') {
    const n = 1 + ms, px = -Math.sin(a), py = Math.cos(a);
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 7, h = rollHit();
      bullets.push({ kind: 'pierce', x: player.x + px * off, y: player.y - 18 + py * off, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 0.85, dmg: h.dmg, crit: h.crit, pierce: 99, hit: new Set() });
    }
  }
  startAttackAnim(...attackView(tgt));
  return true;
}
// Witch: a ring at 44 px, a second band with Multi Shot 3+, a third with 5+. Gaps between bands miss.
function witchRings() {
  const ms = player.multiShot, r = [[0, 44]];
  if (ms >= 3) r.push([52, 66]);
  if (ms >= 5) r.push([74, 88]);
  return r;
}
function witchPulse(mult, hexFor) {
  for (const e of enemies) {
    if (e.dead || e.spawnT < SPAWN_DUR || e.phased) continue;
    const d = dist(player, e) - e.r * 0.5;
    if (!witchRings().some(([a, b]) => d >= a && d <= b)) continue;
    const h = rollHit(mult); hitEnemy(e, h.dmg, h.crit, player); e.hexT = Math.max(e.hexT, hexFor);
  }
  for (const [, b] of witchRings()) rings.push({ x: player.x, y: player.y, r0: 6, r1: b, t: 0, dur: 0.3, color: '#d050c0' });
}

// ─── Spacebar abilities ───
function useAbility() {
  if (state !== 'playing' || player.ability || player.stunT > 0) return;
  const c = CHARS[selectedCharId];
  if (c.charges) { if (player.charges <= 0) return; player.charges--; if (player.abilityCd <= 0) player.abilityCd = c.cooldown; }
  else { if (player.abilityCd > 0) return; player.abilityCd = c.cooldown; }
  player.atk = null;
  player.ability = { t: 0, dur: animDur(HJ.timing_ms.ability), view: player.view, flip: player.flip, dir: { ...player.aim }, x0: player.x, y0: player.y, hit: new Set(), done: {} };
  if (selectedCharId === 'rogue' || selectedCharId === 'knight') addFx('combat', 'dash-dust', player.x, player.y, { anchor: 'feet', flip: player.aim.x < 0 });
}
function abilityImpact(x, y, hitList) {
  // Weapon flavors added to the ability (design: weapon x ability interactions)
  const w = player.weapons;
  if (w.orbital) { for (const e of enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < 30 + e.r) hitEnemy(e, getWpnCfg('orbital', w.orbital).damage, false, { x, y }); }
  if (w.lightning) { const from = hitList[0] || { x, y }; chainLightning(from, 2 + (w.lightning > 2 ? 1 : 0), getWpnCfg('lightning', w.lightning).damage * 0.6, new Set(hitList)); }
  if (w.fireTrail) { const f = getWpnCfg('fireTrail', w.fireTrail); firePatches.push({ x, y, life: f.duration, maxLife: f.duration, radius: f.radius, damage: f.damage, tick: 0 }); }
  if (w.frostNova) { const f = getWpnCfg('frostNova', w.frostNova); for (const e of hitList) { e.slowT = f.slowDur; e.slowF = 1 - f.slowPct; } }
  if (w.homing) { for (let i = 0; i < 3 && i < Math.max(1, hitList.length); i++) launchMissile(hitList[i] || nearestEnemy(200), getWpnCfg('homing', w.homing)); }
}
function updateAbility(dt) {
  const ab = player.ability, id = selectedCharId; ab.t += dt;
  const mv = (from, to, dist_) => {
    if (ab.t < from || ab.t > to + dt) return;
    const step = Math.min(dt, to - Math.max(from, ab.t - dt)) / (to - from) * dist_;
    if (step <= 0) return;
    player.x += ab.dir.x * step; player.y += ab.dir.y * step; keepInArena(player, 8); pushOut(player, 8);
  };
  if (id === 'knight') {
    player.invT = Math.max(player.invT, 0.1);
    mv(0.15, 0.45, 56);
    if (ab.t > 0.15) for (const e of enemies) {
      if (e.dead || ab.hit.has(e) || e.spawnT < SPAWN_DUR) continue;
      if (dist(e, player) < e.r + 16) { ab.hit.add(e); const h = rollHit(2); hitEnemy(e, h.dmg, h.crit, player); e.stunT = 1.5; }
    }
    if (ab.t >= 0.45 && !ab.done.impact) { ab.done.impact = 1; shake(0.2, 4); abilityImpact(player.x, player.y, [...ab.hit]); }
  } else if (id === 'mage') {
    if (ab.t >= 0.38 && !ab.done.blink) {
      ab.done.blink = 1;
      const hits = [];
      for (const e of enemies) if (!e.dead && e.spawnT >= SPAWN_DUR && Math.hypot(e.x - ab.x0, e.y - ab.y0) < 36 + e.r) { const h = rollHit(1.5); hitEnemy(e, h.dmg, h.crit, player); hits.push(e); }
      rings.push({ x: ab.x0, y: ab.y0, r0: 8, r1: 36, t: 0, dur: 0.35, color: '#a070e0' });
      let tx = player.x + ab.dir.x * 80, ty = player.y + ab.dir.y * 80;
      for (let k = 0; k < 8 && !freeSpot(tx, ty, 8); k++) { tx -= ab.dir.x * 10; ty -= ab.dir.y * 10; }
      player.x = tx; player.y = ty; keepInArena(player, 8); player.invT = Math.max(player.invT, 0.3);
      abilityImpact(ab.x0, ab.y0, hits);
    }
  } else if (id === 'marksman') {
    if (ab.t >= 0.5 && !ab.done.shot) {
      ab.done.shot = 1;
      const a = Math.atan2(ab.dir.y, ab.dir.x), h = rollHit(5);
      bullets.push({ kind: 'focus', x: player.x, y: player.y - 18, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: 1.4, dmg: h.dmg, crit: true, pierce: 999, hit: new Set(), slows: true, onEnd: abilityImpact });
      shake(0.25, 5);
    }
  } else if (id === 'rogue') {
    player.invT = Math.max(player.invT, 0.1);
    mv(0.15, 0.36, 72);
    if (ab.t > 0.15) for (const e of enemies) {
      if (e.dead || ab.hit.has(e) || e.spawnT < SPAWN_DUR) continue;
      if (dist(e, player) < e.r + 12) { ab.hit.add(e); const h = rollHit(1.5); hitEnemy(e, h.dmg, h.crit, player); }
    }
    if (ab.t >= 0.36 && !ab.done.impact) { ab.done.impact = 1; addFx('combat', 'dash-dust', player.x, player.y, { anchor: 'feet', flip: ab.dir.x > 0 }); abilityImpact(player.x, player.y, [...ab.hit]); }
  } else if (id === 'witch') {
    if (ab.t >= 0.22 && !ab.done.burst) {
      ab.done.burst = 1;
      const before = new Set(enemies.filter(e => e.hexT > 0));
      witchPulse(1.5, 4);
      abilityImpact(player.x, player.y, enemies.filter(e => e.hexT > 2 && !before.has(e)));
    }
  }
  if (ab.t >= ab.dur) player.ability = null;
}

// ─── Hitting enemies ───
function hitEnemy(e, dmg, crit, src) {
  if (e.dead || e.spawnT < SPAWN_DUR || e.phased) return false;
  if (shieldBlocks(e)) return false;
  let d = dmg;
  if (e.hexT > 0) d *= 1.15;
  if (src && e.def.armoredFront && (e.vx || e.vy)) {
    const f = norm(e.vx, e.vy), s = norm(src.x - e.x, src.y - e.y);
    if (f.x * s.x + f.y * s.y > 0.4) d *= 0.5;
  }
  if (e.def.weakBack) d *= player.y < e.y - 8 ? 1.5 : 0.8;
  d = Math.max(1, Math.round(d));
  e.hp -= d; e.hitFlash = 0.1; totalDamage += d;
  if (cropIs('bloodroot')) player.hp = Math.min(player.maxHp, player.hp + d * 0.03);
  if (cropIs('fire-pepper') && !src?.burn && Math.random() < 0.15) e.burnT = 3;
  onHitEffects(e, d);
  addFloatingText(e.x, e.y - e.art.frame[1] * 0.7, d, crit);
  addFx('combat', crit ? 'crit-spark' : 'hit-spark', e.x + rnd(-3, 3), e.y - e.art.frame[1] * 0.4 + rnd(-3, 3));
  if (e.hp <= 0) { killEnemy(e); return true; }
  return false;
}
function killEnemy(e) {
  if (e.dead) return; e.dead = true; e.hp = 0;
  kills++; roundKills++;
  if (e.tier) { addFx('combat', 'boss-death', e.x, e.y - e.art.frame[1] * 0.4); shake(0.6, 10); }
  else addFx('combat', 'death-poof', e.x, e.y - e.art.frame[1] * 0.35);
  dropLoot(e);
  const def = e.def;
  if (def.spores) hazards.push({ kind: 'spores', x: e.x, y: e.y, r: 18, t: 0, life: 3, dps: roundSc.dmg * 0.3, slow: 0.4, extra: extraInfo(EJ.shroomling, 'Spore cloud'), dirKey: 'enemies' });
  if (def.shards) for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + rnd(0, 1);
    eProj.push({ src: e, kind: 'shard', x: e.x, y: e.y - 16, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, life: 1.1, dmg: roundSc.dmg * 1.2, extra: extraInfo(EJ.golem, 'Crystal shard'), dirKey: 'enemies', spin: true });
  }
  if (def.deathBurst) bursts.push({ x: e.x, y: e.y, t: 0, dmg: roundSc.dmg * 3, extra: extraInfo(EJ.brute, 'Death burst') });
  if (def.splits) for (let i = 0; i < 2; i++) { const c = spawnEnemy(def.splits, { x: e.x + (i ? 8 : -8), y: e.y + rnd(-4, 4) }); c.spawnT = SPAWN_DUR - 0.05; }
  if (def.onDeath === 'split4') for (let i = 0; i < 4; i++) { const c = spawnEnemy('slime', { x: e.x + Math.cos(i * TAU / 4) * 16, y: e.y + Math.sin(i * TAU / 4) * 10 }); c.hp = c.maxHp = Math.round(c.maxHp * 2); }
  if (e.tier && e === bossRef) bossDefeated(e);
}
function dropLoot(e) {
  const gm = lootMult();
  if (e.tier) {
    const n = e.tier === 'major' ? 6 : 4, xp = (e.tier === 'major' ? 120 : 50) * (1 + currentRound * 0.1);
    for (let i = 0; i < n; i++) pickups.push(mkPickup('big-xp-gem', e.x + rnd(-24, 24), e.y + rnd(-16, 16), { xp: Math.ceil(xp / n) }));
    pickups.push(mkPickup('gold-pile', e.x, e.y, { gold: Math.round((e.tier === 'major' ? 40 : 15) * gm * (1 + currentRound * 0.1)) }));
    const zm = { meadow: 'slimeGel', forest: 'sporeDust', caverns: 'wispDust', volcanic: 'demonEssence', shadow: 'wispDust', void: 'demonEssence' }[zone.id];
    for (let i = 0; i < 2; i++) pickups.push(mkPickup(MATERIALS[zm].drop, e.x + rnd(-20, 20), e.y + rnd(-14, 14), { mat: zm }));
    if (e.tier === 'major') pickups.push(mkPickup('golem-core-drop', e.x, e.y + 10, { mat: 'golemCore' }));
    return;
  }
  const d = e.def, tough = d.tough;
  if (d.xp) pickups.push(mkPickup(tough ? 'xp-gem' : 'small-xp-gem', e.x + rnd(-4, 4), e.y + rnd(-4, 4), { xp: d.xp }));
  if (d.gold || cropIs('wheat')) {
    const g = Math.max(1, Math.round((d.gold || 0) * gm)) + (cropIs('wheat') ? 5 : 0);
    pickups.push(mkPickup(tough ? 'gold-pile' : 'gold-coin', e.x + rnd(-6, 6), e.y + rnd(-6, 6), { gold: g }));
  }
  if (d.mat && Math.random() < (tough ? 1 : 0.2) * gm) pickups.push(mkPickup(MATERIALS[d.mat].drop, e.x + rnd(-6, 6), e.y + rnd(-6, 6), { mat: d.mat }));
}
function mkPickup(key, x, y, o) { return Object.assign({ key, x, y, t: Math.random(), vx: rnd(-30, 30), vy: rnd(-30, 30) }, o); }
function bossDefeated(e) {
  bossRef = null; lastBossName = e.art.name.toUpperCase();
  if (currentRound >= TOTAL_ROUNDS) { aftermath = 3.5; finalBossDown = true; }
  else aftermath = 4;
  showNotification(e.art.name.toUpperCase() + ' DEFEATED', '#ffcc44');
}

// ─── Hurting the hero ───
function damagePlayer(amount, src) {
  if (state !== 'playing' || player.invT > 0 || (player.ability && (selectedCharId === 'rogue' || selectedCharId === 'knight'))) return;
  if (Math.random() < player.dodge + extraDodge()) { addFloatingText(player.x, player.y - 46, 'DODGE', false, '#8ccaf2'); player.invT = 0.25; return; }
  if (src && src.art) lastHitBy = src; else if (src && src.from) lastHitBy = src.from;
  let d = amount;
  const trueDmg = src && (src.trueDmg || (src.def && src.def.trueDmg));
  if (!trueDmg) d *= 1 - Math.max(0, Math.min(0.75, player.armor + extraArmor() + (cropIs('iron-vine') ? 0.15 : 0)));
  d = playerHitFilter(d); if (d < 0) return;
  d = Math.max(1, Math.round(d - player.flatReduce));
  player.hp -= d; player.invT = 0.6; player.hurtT = 0; player.hurtView = player.view; player.hurtFlip = player.flip;
  runStats.taken += d;
  if (src && src.x !== undefined) { const n = norm(player.x - src.x, player.y - src.y); player.knock = { x: n.x * 60, y: n.y * 60, t: 0.1 }; }
  shake(0.2, 4);
  if (player.hp <= 0 && !tryPhoenix()) { player.hp = 0; startDying(); }
}
function inSpores() { for (const h of hazards) if (h.kind === 'spores' && Math.hypot(h.x - player.x, (h.y - player.y) * 1.4) < h.r + 6) return true; return false; }
function hazardTouch(dt) {
  for (const h of hazards) {
    if (!h.dps) continue;
    const inside = Math.hypot(h.x - player.x, (h.y - player.y) * (h.squash || 1.4)) < h.r + 4;
    if (!inside) continue;
    h.tick = (h.tick || 0) - dt;
    if (h.tick <= 0) { h.tick = 0.5; damagePlayer(h.dps * 0.5, { trueDmg: false }); }
    if (h.slow) { player.slowT = 0.3; player.slowPct = h.slow; }
  }
  for (const z of zoneHazards) {
    if (!z.hurts) continue;
    if (Math.hypot(z.x - player.x, (z.y - player.y) * z.sq) > z.rx) continue;
    z.tick = (z.tick || 0) - dt;
    if (z.pull) { const n = norm(z.x - player.x, z.y - player.y); player.x += n.x * 14 * dt; player.y += n.y * 14 * dt; }
    if (z.tick <= 0) { z.tick = 0.6; damagePlayer(roundSc.dmg * 0.6, { trueDmg: true }); }
  }
}

// ─── Enemies ───
function enemyCol(e, name) { return Math.max(0, e.art.columns.indexOf(name)); }
function setAct(e, act, dur) { e.act = act; e.actT = 0; e.actDur = dur; }
function attackDur(e) { return e.art.timing_ms.attack ? animDur(e.art.timing_ms.attack) : 0.6; }
function moveToward(e, tx, ty, sp, dt) {
  const n = norm(tx - e.x, ty - e.y); e.vx = n.x * sp; e.vy = n.y * sp;
  e.x += e.vx * dt; e.y += e.vy * dt;
}
function faceMove(e) {
  if (!e.vx && !e.vy) return;
  const v = viewFrom(e.vx, e.vy);
  if (e.art.rows.includes(v)) { e.view = v; e.flip = v === 'side' && e.vx < 0; }
  else { e.view = e.art.rows[0]; e.flip = false; }
}
function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    e.t += dt;
    if (e.spawnT < SPAWN_DUR) { e.spawnT += dt; continue; }
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.hexT > 0) e.hexT -= dt;
    if (e.burnT > 0) { e.burnT -= dt; e.burnTick = (e.burnTick || 0) - dt; if (e.burnTick <= 0) { e.burnTick = 0.5; hitEnemy(e, player.damage * 0.1, false, { burn: true, x: e.x, y: e.y }); if (e.dead) continue; } }
    if (e.slowT > 0) e.slowT -= dt;
    if (e.buffT > 0) e.buffT -= dt;
    if (e.stunT > 0) { e.stunT -= dt; continue; }
    const slow = e.slowT > 0 ? e.slowF : 1, sp = e.speed * slow * (e.buffT > 0 ? 1.3 : 1);
    if (e.tier) updateBoss(e, dt, sp); else updateRegular(e, dt, sp);
    if (e.speed > 0) { keepInArena(e, e.r); pushOut(e, Math.min(e.r, 10)); }
    faceMove(e);
    // contact damage
    if (!e.dead && e.dmg > 0 && !e.phased && !e.hidden && !e.noContact && dist(e, player) < e.r + 8) {
      let m = 1; for (const a of enemies) if (a.def.gravity && !a.dead && dist(a, e) < 56) m = 1.3;
      if (player.invT <= 0) {
        if (cropIs('thorn-seed')) hitEnemy(e, 3, false, player);
        if (e.def.melee && e.act !== 'attack') setAct(e, 'attack', attackDur(e));
        if (e.key === 'demon') addExtraFx(e, 'Claw rake', player.x, player.y - 20);
        damagePlayer(e.dmg * m, e);
      }
    }
  }
  enemies = enemies.filter(e => !e.dead);
}
function updateRegular(e, dt, sp) {
  const d = e.def, dp = dist(e, player);
  if (e.act) { e.actT += dt; if (e.actT >= e.actDur) { const a = e.act; e.act = null; actDone(e, a); } }
  if (d.hidden) {
    if (e.hidden && dp < d.hidden) { e.hidden = false; setAct(e, 'reveal', attackDur(e)); }
  }
  if (d.phases) {
    const c = (e.t % 3.2);
    e.phased = c > 2.4; e.alpha = e.phased ? 0.35 : 1;
    if (c > 2.1 && c < 2.15 && !e.act) setAct(e, 'phase', attackDur(e));
  }
  if (d.healer) {
    const n = norm(e.x - player.x, e.y - player.y), want = dp < 90 ? 1 : dp > 120 ? -1 : 0;
    e.vx = n.x * sp * want; e.vy = n.y * sp * want; e.x += e.vx * dt; e.y += e.vy * dt;
    e.cd -= dt;
    if (e.cd <= 0) { e.cd = 1.5; addExtraFx(e, 'Heal pulse', e.x, e.y - 15, { frameMs: 160 }); }
    for (const o of enemies) if (o !== e && !o.dead && dist(o, e) < 70) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.02 * dt);
    return;
  }
  if (d.spawner) {
    e.cd -= dt;
    if (e.cd <= 0 && !e.act) { setAct(e, 'spawn', attackDur(e)); e.cd = 5; }
    return;
  }
  if (d.gravity) return;
  if (d.ranged) {
    const r = d.ranged, n = norm(player.x - e.x, player.y - e.y);
    if (!e.act) {
      const dir = dp < r.keep - 10 ? -1 : dp > r.keep + 30 ? 1 : 0;
      e.vx = n.x * sp * dir + (dir === 0 ? -n.y * sp * 0.5 : 0); e.vy = n.y * sp * dir + (dir === 0 ? n.x * sp * 0.5 : 0);
      e.x += e.vx * dt; e.y += e.vy * dt;
    } else { e.vx = n.x * 0.01; e.vy = n.y * 0.01; }
    e.cd -= dt;
    if (e.cd <= 0 && dp < 220 && !e.act) { setAct(e, 'shoot', attackDur(e)); e.cd = r.every; }
    return;
  }
  if (d.charge) {
    if (e.act === 'growl') { e.vx = e.chargeDir.x * 0.01; e.vy = e.chargeDir.y * 0.01; return; }
    if (e.act === 'charge') { e.vx = e.chargeDir.x * sp * 3.4; e.vy = e.chargeDir.y * sp * 3.4; e.x += e.vx * dt; e.y += e.vy * dt;
      if (dist(e, player) < e.r + 8 && player.invT <= 0) { damagePlayer(e.dmg * 1.3, { x: e.x, y: e.y }); player.stunT = 0.4; }
      return; }
    e.cd -= dt;
    if (e.cd <= 0 && dp < 130) { e.chargeDir = norm(player.x - e.x, player.y - e.y); setAct(e, 'growl', 0.6); e.cd = 3.2;
      fx.push({ chargeLine: true, x: e.x, y: e.y - 10, rot: Math.atan2(e.chargeDir.y, e.chargeDir.x), t: 0, dur: 0.6, extra: extraInfo(EJ.wolf, 'Charge line'), dirKey: 'enemies', ms: [200, 200, 200] }); return; }
  }
  if (d.teleport) {
    e.cd -= dt;
    if (e.cd <= 0 && !e.act) {
      addExtraFx(e, 'Teleport puff', e.x, e.y - 14);
      const p = spawnPointNear(player.x, player.y, 60, 100, 8); e.x = p.x; e.y = p.y;
      addExtraFx(e, 'Teleport puff', e.x, e.y - 14);
      setAct(e, 'throw', attackDur(e)); e.cd = 2.6; return;
    }
    if (e.act) return;
  }
  if (d.assassin) {
    if (e.act === 'strike') return;
    if (e.retreatT > 0) { e.retreatT -= dt; const n = norm(e.x - player.x, e.y - player.y); e.vx = n.x * sp; e.vy = n.y * sp; e.x += e.vx * dt; e.y += e.vy * dt; return; }
    if (dp < e.r + 12) { setAct(e, 'strike', attackDur(e)); e.vx = (player.x - e.x) * 0.01; return; }
  }
  if (d.trail) {
    e.cd -= dt;
    if (e.cd <= 0) { e.cd = 0.5; hazards.push({ kind: 'fire', x: e.x, y: e.y, r: 8, t: 0, life: 3, dps: roundSc.dmg * 0.5, extra: extraInfo(EJ.magma, 'Fire trail'), dirKey: 'enemies', squash: 2 }); }
  }
  let a = Math.atan2(player.y - e.y, player.x - e.x);
  if (d.weave) a += Math.sin(e.t * 2.4 + e.r) * 0.9;
  const s = e.hidden ? sp * 0.7 : sp;
  e.vx = Math.cos(a) * s; e.vy = Math.sin(a) * s; e.x += e.vx * dt; e.y += e.vy * dt;
}
function actDone(e, a) {
  const d = e.def;
  if (a === 'shoot') {
    const n = norm(player.x - e.x, player.y - e.y);
    eProj.push({ src: e, kind: 'arrow', x: e.x, y: e.y - 18, vx: n.x * d.ranged.speed, vy: n.y * d.ranged.speed, life: 2.4, dmg: e.dmg, extra: extraInfo(EJ.archer, 'Arrow'), dirKey: 'enemies' });
  } else if (a === 'growl') { setAct(e, 'charge', 0.5); }
  else if (a === 'throw') {
    const n = norm(player.x - e.x, player.y - e.y);
    eProj.push({ src: e, kind: 'fireball', x: e.x, y: e.y - 18, vx: n.x * 140, vy: n.y * 140, life: 2, dmg: e.dmg, extra: extraInfo(EJ.imp, 'Fireball'), dirKey: 'enemies' });
  } else if (a === 'strike') {
    if (dist(e, player) < e.r + 22) { damagePlayer(e.dmg, { x: e.x, y: e.y }); addExtraFx(e, 'Strike', player.x, player.y - 20); }
    e.retreatT = 1.4;
  } else if (a === 'spawn') {
    const pool = zone.pool.filter(p => !ENEMY[p[0]].tough && !ENEMY[p[0]].spawner && p[0] !== 'shade');
    spawnEnemy(pick(pool)[0], { x: e.x + rnd(-14, 14), y: e.y + rnd(6, 14) });
  }
}

// ─── Bosses ───
function bossFace(e) {
  if (e.key === 'guardian') { e.view = player.y < e.y - 8 ? 'back' : 'front'; e.flip = false; return true; }
  if (e.charging && e.art.rows.includes('side')) { e.view = Math.abs(e.vx) > Math.abs(e.vy) ? 'side' : 'front'; e.flip = e.view === 'side' && e.vx < 0; return true; }
  return false;
}
function updateBoss(e, dt, sp) {
  const d = e.def, dp = dist(e, player);
  if (d.phases) {
    const ph = e.hp < e.maxHp / 3 ? 3 : e.hp < e.maxHp * 2 / 3 ? 2 : 1;
    if (ph !== e.phase) { e.phase = ph; if (ph > 1) { showNotification('THE VOID EMPEROR ' + (ph === 3 ? 'ENRAGES' : 'GROWS STRONGER'), '#f070ff'); shake(0.5, 8); }
      if (ph === 3) collapse = { x: e.x, y: e.y, r: 300, min: 70 }; }
  }
  if (d.phasing) { const c = e.t % 6; e.phased = c > 4.5; e.alpha = e.phased ? 0.3 : 1; }
  if (e.act === 'attack') {
    e.actT += dt; e.vx = e.vy = 0;
    const at = e.art.timing_ms.attack, hitAt = (at[0] + at[1]) / 1000;
    if (!e.fired && e.actT >= hitAt) { e.fired = true; bossAttackHits(e); }
    if (e.actT >= e.actDur) { e.act = null; }
    bossFace(e); return;
  }
  if (e.charging) {
    e.chargeT -= dt;
    if (e.chargeT > 0.5) { e.vx = e.chargeDir.x * 0.01; e.vy = e.chargeDir.y * 0.01; bossFace(e); return; }
    e.vx = e.chargeDir.x * sp * 3.6; e.vy = e.chargeDir.y * sp * 3.6; e.x += e.vx * dt; e.y += e.vy * dt;
    if (dp < e.r + 10 && player.invT <= 0) damagePlayer(e.dmg * 1.4, { x: e.x, y: e.y });
    if (e.chargeT <= 0) e.charging = false;
    bossFace(e); return;
  }
  if (e.clone) { e.life -= dt; if (e.life <= 0) e.dead = true; }
  // walk toward the hero, but keep a little room
  const keep = e.r + 18;
  if (dp > keep) moveToward(e, player.x, player.y, sp * (e.phase === 3 ? 1.3 : 1), dt); else { e.vx = (player.x - e.x) * 0.01; e.vy = (player.y - e.y) * 0.01; }
  bossFace(e);
  if (e.clone) return;
  e.cd -= dt * (e.phase === 3 ? 1.5 : 1);
  if (e.cd <= 0 && dp < 200) {
    const atk = d.attacks[e.attackIdx++ % d.attacks.length];
    e.cd = d.cd;
    if (atk === 'charge') { e.charging = true; e.chargeT = 1.1; e.chargeDir = norm(player.x - e.x, player.y - e.y); chevrons.push({ x: e.x, y: e.y, dir: e.chargeDir, t: 0, dur: 0.6 }); return; }
    e.atk = atk; e.fired = false; e.aimA = Math.atan2(player.y - (e.y - 20), player.x - e.x);
    setAct(e, 'attack', attackDur(e));
    bossTelegraph(e, atk);
  }
}
function bossTelegraph(e, atk) {
  const red = '#c0402f', purple = '#b066dc';
  if (atk === 'slam') rings.push({ x: e.x, y: e.y, r0: 40, r1: 40, t: 0, dur: 0.5, color: red, warn: true });
  if (atk === 'fireRing' || atk === 'screech' || atk === 'howl' || atk === 'dreadRoar') rings.push({ x: e.x, y: e.y, r0: 12, r1: 18, t: 0, dur: 0.4, color: atk === 'fireRing' ? red : purple, warn: true });
  if (atk === 'poisonRain' || atk === 'geysers') {
    e.spots = [0, 1, 2].map(i => { const p = { x: player.x + rnd(-40, 40), y: player.y + rnd(-26, 26) }; if (i === 0) { p.x = player.x; p.y = player.y; } return p; });
    for (const p of e.spots) rings.push({ x: p.x, y: p.y, r0: 12, r1: 12, t: 0, dur: 0.6, color: atk === 'geysers' ? red : purple, warn: true });
  }
}
function lineHits(x0, y0, a, len, half) {
  const cx = Math.cos(a), cy = Math.sin(a), px = player.x - x0, py = (player.y - 14) - y0;
  const along = px * cx + py * cy, across = Math.abs(-px * cy + py * cx);
  return along > 0 && along < len && across < half;
}
function coneHits(x0, y0, a, len, spread) {
  const dx = player.x - x0, dy = (player.y - 14) - y0, d = Math.hypot(dx, dy);
  if (d > len) return false;
  let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
  return Math.abs(da) < spread;
}
function bossAttackHits(e) {
  const a = e.aimA, cx = e.x, cy = e.y - e.art.frame[1] * 0.45, dmg = e.dmg, nm = e.key;
  const ex = n => extraInfo(e.art, n);
  const effect = (name, x, y, o) => addExtraFx(e, name, x, y, o);
  switch (e.atk) {
    case 'slam': rings.push({ x: e.x, y: e.y, r0: 10, r1: 42, t: 0, dur: 0.3, color: '#5ea23c' }); if (dist(e, player) < 42 + 6) damagePlayer(dmg, e); shake(0.25, 5); break;
    case 'screech': effect('Screech', e.x, e.y + 10, { frameMs: 160 }); for (let i = 0; i < 3; i++) spawnEnemy('bat', spawnPointNear(e.x, e.y, 30, 60, 8)); break;
    case 'sporeStorm': hazards.push({ kind: 'storm', x: e.x, y: e.y, r: 44, t: 0, life: 4, dps: dmg * 0.35, slow: 0.4, extra: ex('Spore storm'), dirKey: 'bosses' });
      for (let i = 0; i < 2; i++) spawnEnemy('shroomling', spawnPointNear(e.x, e.y, 24, 50, 8)); break;
    case 'howl': effect('Howl', e.x, e.y - 10, { frameMs: 180 }); for (const o of enemies) o.buffT = 5; break;
    case 'spikeWave': effect('Spike wave', cx + Math.cos(a) * 52, cy + 14 + Math.sin(a) * 52, { rot: a, frameMs: 140 }); if (lineHits(cx, cy, a, 100, 12)) damagePlayer(dmg, e); shake(0.3, 6); break;
    case 'royalBloom': effect('Royal bloom', e.x, e.y - 20, { frameMs: 180 }); e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.06); for (let i = 0; i < 2; i++) spawnEnemy('moth', spawnPointNear(e.x, e.y, 20, 40, 8)); break;
    case 'fireBreath': effect('Fire breath', cx + Math.cos(a) * 36, cy + Math.sin(a) * 36, { rot: a - Math.PI / 2, frameMs: 150 }); if (coneHits(cx, cy, a, 76, 0.45)) damagePlayer(dmg, e);
      for (let i = 1; i <= 2; i++) hazards.push({ kind: 'lava', x: cx + Math.cos(a) * 28 * i, y: cy + 14 + Math.sin(a) * 28 * i, r: 10, t: 0, life: 4, dps: dmg * 0.4, extra: extraInfo(EJ.magma, 'Fire trail'), dirKey: 'enemies', squash: 2 }); break;
    case 'fireRing': effect('Fire ring', e.x, e.y, { frameMs: 160 }); rings.push({ x: e.x, y: e.y, r0: 12, r1: 56, t: 0, dur: 0.5, color: '#f05a28', hurts: dmg, hit: false }); break;
    case 'mirror': for (let i = 0; i < 2; i++) { const p = spawnPointNear(e.x, e.y, 24, 40, 10); const c = spawnEnemy(e.key, p, e.tier); c.clone = true; c.hp = c.maxHp = 1; c.life = 8; c.spawnT = SPAWN_DUR; c.cd = 99; } break;
    case 'dreadRoar': effect('Dread roar', e.x, e.y - 14, { frameMs: 170 }); if (dist(e, player) < 64) player.dreadT = 4; spawnAssassin(); break;
    case 'tripleStrike': for (let i = -1; i <= 1; i++) { const aa = a + i * 0.35; eProj.push({ src: e, kind: 'bite', x: cx + i * 16, y: cy, vx: Math.cos(aa) * 150, vy: Math.sin(aa) * 150, life: 1.2, dmg, color: '#f070ff' }); } break;
    case 'breakStep': { const old = { x: e.x, y: e.y + 6 }; const p = spawnPointNear(player.x, player.y, 60, 80, e.r); e.x = p.x; e.y = p.y; spawnEnemy('tear', old); addFx('combat', 'enemy-spawn', e.x, e.y, { anchor: 'feet' }); break; }
    case 'rootSlam': effect('Root spikes', cx + Math.cos(a) * 52, e.y + Math.sin(a) * 52 - 10, { rot: a, frameMs: 150 }); if (lineHits(cx, e.y - 10, a, 100, 12)) damagePlayer(dmg, e); shake(0.3, 6);
      if ((e.attackIdx % 3) === 0) for (let i = 0; i < 2; i++) spawnEnemy('beetle', spawnPointNear(e.x, e.y, 30, 60, 10)); break;
    case 'webBall': { const n = norm(player.x - cx, player.y - 14 - cy); eProj.push({ src: e, kind: 'web', x: cx, y: cy, vx: n.x * 110, vy: n.y * 110, life: 2.4, dmg: dmg * 0.6, slow: 0.4, extra: ex('Web ball'), dirKey: 'bosses' }); break; }
    case 'poisonRain': for (const p of e.spots || []) hazards.push({ kind: 'rain', x: p.x, y: p.y, r: 12, t: 0, life: 3, dps: dmg * 0.4, slow: 0.25, extra: ex('Poison rain'), dirKey: 'bosses', drop: true }); break;
    case 'crystalBreath': effect('Crystal breath', cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, { rot: a - Math.PI / 2, frameMs: 150 }); if (coneHits(cx, cy, a, 82, 0.4)) damagePlayer(dmg, e); break;
    case 'boulder': { const n = norm(player.x - cx, player.y - 14 - cy); eProj.push({ src: e, kind: 'boulder', x: cx, y: cy - 20, vx: n.x * 120, vy: n.y * 120, life: 2.2, dmg: dmg * 1.2, extra: ex('Boulder'), dirKey: 'bosses', spin: true, splash: 16 }); break; }
    case 'geysers': for (const p of e.spots || []) geysers.push({ x: p.x, y: p.y, t: 0, dmg: dmg * 0.9, extra: ex('Geyser') }); break;
    case 'darkOrb': { const n = norm(player.x - cx, player.y - cy); eProj.push({ src: e, kind: 'orb', x: cx, y: cy, vx: n.x * 100, vy: n.y * 100, life: 1.4, dmg: dmg * 0.5, color: '#2a1840', lands: { x: player.x, y: player.y }, zoneExtra: ex('Darkness zone') }); break; }
    case 'voidBeam': effect('Void beam', cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, { rot: a, frameMs: 120 }); if (lineHits(cx, cy, a, 124, 9)) damagePlayer(dmg * 1.2, e); shake(0.3, 5); break;
    case 'summonVoid': for (let i = 0; i < (e.phase === 3 ? 3 : 2); i++) spawnEnemy('voidspawn', spawnPointNear(e.x, e.y, 40, 80, 12)); break;
  }
}

// ─── Enemy projectiles, hazards, bursts, rings ───
function updateHazards(dt) {
  for (const p of eProj) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.kind === 'orb' && p.lands && Math.hypot(p.x - p.lands.x, p.y - p.lands.y) < 6) p.life = 0;
    if (p.life <= 0) { if (p.kind === 'orb') darkZones.push({ x: p.x, y: p.y + 10, t: 0, life: 5, extra: p.zoneExtra }); continue; }
    if (Math.hypot(p.x - player.x, p.y - (player.y - 16)) < 10) {
      damagePlayer(p.dmg, { x: p.x - p.vx, y: p.y - p.vy, from: p.src });
      if (p.slow) { player.slowT = 2; player.slowPct = p.slow; }
      if (p.splash) rings.push({ x: p.x, y: p.y + 14, r0: 4, r1: p.splash, t: 0, dur: 0.25, color: '#f05a28' });
      p.life = 0;
    }
  }
  eProj = eProj.filter(p => p.life > 0);
  for (const h of hazards) h.t += dt;
  hazards = hazards.filter(h => h.t < h.life);
  for (const z of darkZones) z.t += dt;
  darkZones = darkZones.filter(z => z.t < z.life);
  for (const b of bursts) {
    b.t += dt;
    if (b.t >= 1.5 && !b.done) {
      b.done = true; shake(0.3, 7);
      if (Math.hypot(b.x - player.x, (b.y - player.y) * 1.2) < 36) damagePlayer(b.dmg, b);
      for (const e of enemies) if (!e.dead && Math.hypot(b.x - e.x, b.y - e.y) < 36) hitEnemy(e, b.dmg * 0.5, false);
    }
  }
  bursts = bursts.filter(b => b.t < 1.9);
  for (const g of geysers) {
    g.t += dt;
    if (g.t >= 1.0 && !g.done) { g.done = true; if (Math.hypot(g.x - player.x, (g.y - player.y) * 1.4) < 14) damagePlayer(g.dmg, g); }
  }
  geysers = geysers.filter(g => g.t < 1.6);
  for (const r of rings) {
    r.t += dt;
    if (r.hurts && !r.hit) {
      const cur = r.r0 + (r.r1 - r.r0) * Math.min(1, r.t / r.dur), d = Math.hypot(player.x - r.x, (player.y - r.y) * 1.4);
      if (Math.abs(d - cur) < 6) { r.hit = true; damagePlayer(r.hurts, r); }
    }
  }
  rings = rings.filter(r => r.t < r.dur);
  for (const c of chevrons) c.t += dt;
  chevrons = chevrons.filter(c => c.t < c.dur);
  if (collapse) {
    collapse.r = Math.max(collapse.min, collapse.r - 4 * dt);
    if (Math.hypot(player.x - collapse.x, player.y - collapse.y) > collapse.r) { collapse.tick = (collapse.tick || 0) - dt; if (collapse.tick <= 0) { collapse.tick = 0.5; damagePlayer(player.maxHp * 0.04, { trueDmg: true }); } }
  }
}

// ─── Player projectiles ───
function updateBullets(dt) {
  for (const b of bullets) {
    if (b.kind === 'bolt' && b.target && !b.target.dead) {
      const ta = Math.atan2(b.target.y - 14 - b.y, b.target.x - b.x), ca = Math.atan2(b.vy, b.vx);
      let da = ta - ca; da = Math.atan2(Math.sin(da), Math.cos(da));
      const na = ca + da * Math.min(1, 4 * dt), sp = Math.hypot(b.vx, b.vy);
      b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) { if (b.onEnd) b.onEnd(b.x, b.y + 18, [...b.hit]); continue; }
    for (const e of enemies) {
      if (e.dead || b.hit.has(e) || e.spawnT < SPAWN_DUR || e.phased) continue;
      if (Math.hypot(e.x - b.x, (e.y - e.art.frame[1] * 0.35) - b.y) < e.r + 4) {
        b.hit.add(e);
        hitCtx = b.kind === 'focus' ? null : 'base';
        hitEnemy(e, b.dmg, b.crit, { x: b.x - b.vx, y: b.y - b.vy });
        hitCtx = null;
        if (b.slows) { e.slowT = 2; e.slowF = 0.5; }
        if (b.kind === 'bolt') rings.push({ x: b.x, y: b.y + 14, r0: 3, r1: 12, t: 0, dur: 0.2, color: '#a070e0' });
        if (b.pierce <= 0) { b.life = 0; break; }
        b.pierce--;
      }
    }
  }
  bullets = bullets.filter(b => b.life > 0);
}

// ─── Pickups ───
function updatePickups(dt) {
  for (const p of pickups) {
    p.t += dt;
    if (p.vx || p.vy) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; if (Math.abs(p.vx) + Math.abs(p.vy) < 2) p.vx = p.vy = 0; }
    const d = Math.hypot(p.x - player.x, p.y - player.y);
    if (vacuum || d < player.pickupRange) {
      const n = norm(player.x - p.x, player.y - p.y), sp = vacuum ? 260 : 120 + (player.pickupRange - d) * 4;
      p.x += n.x * sp * dt; p.y += n.y * sp * dt;
    }
    if (d < 8) { p.taken = true; collect(p); }
  }
  pickups = pickups.filter(p => !p.taken);
}
function collect(p) {
  if (p.xp) {
    player.xp += Math.round(p.xp * player.xpMult * gainMult() * (cropIs('glow-moss') ? 1.15 : 1));
    while (player.xp >= player.xpToLevel) { player.xp -= player.xpToLevel; player.level++; player.xpToLevel = Math.floor(player.xpToLevel * 1.16); pendingLevels++; }
  }
  if (p.gold) { coins += p.gold; roundCoins += p.gold; runStats.gold += p.gold; }
  if (p.mat) {
    materials[p.mat] = (materials[p.mat] || 0) + 1; roundMats[p.mat] = (roundMats[p.mat] || 0) + 1; toast(p.mat);
    if (p.mat === 'golemCore') runStats.cores++;
  }
}

// ─── Weapons ───
const WPN_UPDATE = { orbital: dt => updateOrbital(dt), lightning: dt => updateLightning(dt), fireTrail: dt => updateFireTrail(dt), frostNova: dt => updateFrostNova(dt), homing: dt => updateHoming(dt) };
function updateWeapons(dt) {
  for (const wid in WPN_UPDATE) if (player.weapons[wid] && wid !== cursedWpn) { hitCtx = wid; WPN_UPDATE[wid](dt); }
  hitCtx = null;
  for (const b of lightningBolts) b.t += dt;
  lightningBolts = lightningBolts.filter(b => b.t < b.dur);
}
function bladePositions() {
  const cfg = getWpnCfg('orbital', player.weapons.orbital), out = [];
  for (let i = 0; i < cfg.blades; i++) { const a = orbitalAngle + TAU * i / cfg.blades; out.push({ x: player.x + Math.cos(a) * cfg.radius, y: player.y - 14 + Math.sin(a) * cfg.radius * 0.7, a }); }
  return out;
}
function updateOrbital(dt) {
  const cfg = getWpnCfg('orbital', player.weapons.orbital);
  orbitalAngle += cfg.speed * dt;
  for (const bp of bladePositions()) for (const e of enemies) {
    if (e.dead || e.orbT > 0 || e.spawnT < SPAWN_DUR) continue;
    if (Math.hypot(e.x - bp.x, (e.y - e.art.frame[1] * 0.35) - bp.y) < e.r + 6) {
      const crit = player.altEvo.orbital && Math.random() < player.critChance + extraCrit();
      e.orbT = 0.5; hitEnemy(e, crit ? Math.round(cfg.damage * critMultNow()) : cfg.damage, crit, bp);
      if (player.synBonus.orbSlow) { e.slowT = 1.5; e.slowF = 0.75; }
      if (cfg.evoSplash) for (const s of enemies) if (s !== e && !s.dead && Math.hypot(s.x - bp.x, s.y - bp.y) < cfg.evoSplash) hitEnemy(s, Math.round(cfg.damage * 0.4), false, bp);
    }
  }
  for (const e of enemies) if (e.orbT > 0) e.orbT -= dt;
}
function chainLightning(from, chains, dmg, hit) {
  const pts = [{ x: from.x, y: from.y - (from.art ? from.art.frame[1] * 0.4 : 14) }]; let cur = from;
  for (let c = 0; c < chains; c++) {
    let next = null, nd = 90;
    for (const e of enemies) { if (e.dead || hit.has(e) || e.spawnT < SPAWN_DUR) continue; const d = dist(cur, e); if (d < nd) { nd = d; next = e; } }
    if (!next) break; hit.add(next);
    const m = player.synBonus.ltVsSlow && next.slowT > 0 ? player.synBonus.ltVsSlow : 1;
    pts.push({ x: next.x, y: next.y - next.art.frame[1] * 0.4 });
    hitEnemy(next, Math.round(dmg * m), m > 1, cur);
    cur = next;
  }
  if (pts.length > 1) lightningBolts.push({ pts, t: 0, dur: 0.28 });
}
function updateLightning(dt) {
  const cfg = getWpnCfg('lightning', player.weapons.lightning);
  weaponTimers.lightning -= dt;
  if (weaponTimers.lightning > 0) return;
  if (player.altEvo.lightning) {
    if (!nearestEnemy(56)) return;
    weaponTimers.lightning = cfg.interval;
    addFx('combat', 'storm-cage', player.x, player.y - 12, { follow: player });
    for (const e of enemies) if (!e.dead && e.spawnT >= SPAWN_DUR && dist(e, player) < 52 + e.r) hitEnemy(e, Math.round(cfg.damage * 1.3), false, player);
    return;
  }
  const target = nearestEnemy(200, true); if (!target) return;
  weaponTimers.lightning = cfg.interval;
  if (player.evolvedWeapons.lightning) { fx.push({ dir: 'combat', key: 'judgement', x: target.x, y: target.y, anchor: 'feet', t: 0, dur: stripDur('combat', 'judgement'), follow: target }); }
  const m = player.synBonus.ltVsSlow && target.slowT > 0 ? player.synBonus.ltVsSlow : 1;
  const evo = !!player.evolvedWeapons.lightning;
  lightningBolts.push({ pts: [{ x: player.x, y: player.y - 22 }, { x: target.x, y: target.y - target.art.frame[1] * 0.4 }], t: 0, dur: 0.28 });
  hitEnemy(target, Math.round(cfg.damage * m), evo || m > 1, player);
  chainLightning(target, cfg.chains, cfg.damage * 0.5, new Set([target]));
}
function updateFireTrail(dt) {
  const cfg = getWpnCfg('fireTrail', player.weapons.fireTrail);
  weaponTimers.fireTrail -= dt;
  if (player.altEvo.fireTrail) {
    if (weaponTimers.fireTrail <= 0 && nearestEnemy(130, true)) {
      weaponTimers.fireTrail = 0.9;
      addFx('combat', 'ember-swarm', player.x, player.y - 16);
      const near = enemies.filter(e => !e.dead && e.spawnT >= SPAWN_DUR && !e.hidden && dist(e, player) < 130).sort((a, b) => dist(a, player) - dist(b, player)).slice(0, 3);
      for (const e of near) firePatches.push({ x: e.x, y: e.y, life: cfg.duration, maxLife: cfg.duration, radius: Math.round(cfg.radius * 1.3), damage: Math.round(cfg.damage * 1.5), tick: 0 });
    }
    tickFirePatches(dt); return;
  }
  if (player.moving && weaponTimers.fireTrail <= 0) { firePatches.push({ x: player.x, y: player.y, life: cfg.duration, maxLife: cfg.duration, radius: cfg.radius, damage: cfg.damage, tick: 0 }); weaponTimers.fireTrail = 0.18; }
  tickFirePatches(dt);
}
function tickFirePatches(dt) {
  for (const p of firePatches) {
    p.life -= dt; p.tick -= dt;
    if (p.tick > 0) continue; p.tick = 0.3;
    for (const e of enemies) if (!e.dead && Math.hypot(p.x - e.x, (p.y - e.y) * 1.5) < p.radius + e.r * 0.6) {
      const m = player.synBonus.fireVsSlow && e.slowT > 0 ? player.synBonus.fireVsSlow : 1;
      hitEnemy(e, Math.round(p.damage * m), false);
    }
  }
  firePatches = firePatches.filter(p => p.life > 0);
}
function updateFrostNova(dt) {
  const cfg = getWpnCfg('frostNova', player.weapons.frostNova), evo = player.evolvedWeapons.frostNova;
  weaponTimers.frostNova -= dt;
  if (weaponTimers.frostNova <= 0) {
    weaponTimers.frostNova = cfg.interval;
    const tomb = player.altEvo.frostNova; let n = 0;
    for (const e of enemies) if (!e.dead && Math.hypot(player.x - e.x, (player.y - e.y) * 1.5) < cfg.radius + e.r) {
      e.slowT = cfg.slowDur; e.slowF = 1 - cfg.slowPct; hitEnemy(e, tomb ? Math.round(cfg.damage * 1.4) : cfg.damage, false, player);
      if (tomb && !e.dead) { e.stunT = Math.max(e.stunT, 1.2); if (n++ < 8) addFx('combat', 'glacial-tomb', e.x, e.y + 2, { anchor: 'feet' }); }
    }
    addFx('combat', evo ? 'absolute-zero' : 'frost-nova', player.x, player.y - 4);
    frostPatches.push({ x: player.x, y: player.y, radius: cfg.radius, life: cfg.slowDur + 2, slowPct: cfg.slowPct, tick: 0 });
  }
  for (const fp of frostPatches) {
    fp.life -= dt; fp.tick -= dt;
    if (fp.tick > 0) continue; fp.tick = 0.4;
    for (const e of enemies) if (Math.hypot(fp.x - e.x, (fp.y - e.y) * 1.5) < fp.radius * 0.5 + e.r) { e.slowT = Math.max(e.slowT, 0.6); e.slowF = Math.min(e.slowF, 1 - fp.slowPct); }
  }
  frostPatches = frostPatches.filter(f => f.life > 0);
}
function launchMissile(t, cfg) {
  if (!t) return;
  const a = Math.random() * TAU;
  homingMissiles.push({ x: player.x + Math.cos(a) * 8, y: player.y - 18 + Math.sin(a) * 8, angle: a, speed: 150, damage: cfg.damage, target: t, life: 3, splash: cfg.splash });
}
function updateHoming(dt) {
  const cfg = getWpnCfg('homing', player.weapons.homing);
  weaponTimers.homing -= dt;
  if (player.altEvo.homing) {
    if (weaponTimers.homing <= 0) {
      const live = enemies.filter(e => !e.dead && e.spawnT >= SPAWN_DUR && !e.hidden && dist(e, player) < 220);
      if (live.length) {
        weaponTimers.homing = cfg.interval * 1.4;
        const t = live.reduce((a, b) => (b.tier ? 1e9 : b.hp) > (a.tier ? 1e9 : a.hp) ? b : a);
        addFx('combat', 'orbital-cannon', t.x, t.y + 2, { anchor: 'feet', follow: t });
        cannonStrikes.push({ t: 0.5, target: t, x: t.x, y: t.y, dmg: Math.round(cfg.damage * cfg.count * 1.5), splash: 30 });
      }
    }
    for (const c of cannonStrikes) {
      c.t -= dt; if (c.target && !c.target.dead) { c.x = c.target.x; c.y = c.target.y; }
      if (c.t <= 0) { const crit = Math.random() < player.critChance + extraCrit(); for (const e of enemies) if (!e.dead && Math.hypot(e.x - c.x, e.y - c.y) < c.splash + e.r) hitEnemy(e, crit ? Math.round(c.dmg * critMultNow()) : c.dmg, crit, c); shake(0.15, 3); }
    }
    cannonStrikes = cannonStrikes.filter(c => c.t > 0);
    return;
  }
  if (weaponTimers.homing <= 0 && enemies.length) {
    weaponTimers.homing = cfg.interval;
    const live = enemies.filter(e => !e.dead && e.spawnT >= SPAWN_DUR && !e.hidden);
    for (let i = 0; i < cfg.count && live.length; i++) launchMissile(pick(live), cfg);
  }
  for (const m of homingMissiles) {
    m.life -= dt;
    if (!m.target || m.target.dead) { const live = enemies.filter(e => !e.dead && e.spawnT >= SPAWN_DUR); m.target = live.length ? pick(live) : null; }
    if (m.target) {
      const ta = Math.atan2(m.target.y - 14 - m.y, m.target.x - m.x);
      let da = ta - m.angle; da = Math.atan2(Math.sin(da), Math.cos(da));
      m.angle += da * Math.min(1, 7 * dt);
    }
    m.x += Math.cos(m.angle) * m.speed * dt; m.y += Math.sin(m.angle) * m.speed * dt;
    for (const e of enemies) {
      if (e.dead || e.spawnT < SPAWN_DUR || e.phased) continue;
      if (Math.hypot(e.x - m.x, (e.y - 14) - m.y) < e.r + 4) {
        hitEnemy(e, m.damage, false, m);
        addFx('combat', 'missile-hit', m.x, m.y);
        if (player.synBonus.homSlow) { e.slowT = 2; e.slowF = 0.7; }
        if (m.splash > 0) for (const s of enemies) if (s !== e && !s.dead && Math.hypot(s.x - m.x, s.y - m.y) < m.splash) hitEnemy(s, Math.round(m.damage * 0.5), false, m);
        if (player.synBonus.homFire) firePatches.push({ x: m.x, y: m.y + 14, life: 1.5, maxLife: 1.5, radius: 10, damage: 8, tick: 0 });
        m.life = 0; break;
      }
    }
  }
  homingMissiles = homingMissiles.filter(m => m.life > 0);
}

// ─── Synergy & evolution ───
function updateSynergy() {
  const prev = player.synergy;
  player.synergy = null; player.synBonus = {};
  const owned = Object.keys(player.weapons).filter(k => player.weapons[k] > 0).sort();
  if (owned.length !== 2) return;
  const key = owned[0] + '+' + owned[1], syn = SYNERGIES[key]; if (!syn) return;
  player.synergy = key;
  player.synBonus = {
    'fireTrail+orbital': { orbDmg: 1.3, fireDmg: 1.5 }, 'lightning+orbital': { orbDmg: 1.3, ltChains: 2 }, 'frostNova+orbital': { orbSlow: true },
    'homing+orbital': { orbBlades: 2, homCount: 1 }, 'fireTrail+lightning': { ltDmg: 1.5, fireDmg: 1.3 }, 'frostNova+lightning': { ltVsSlow: 2.0 },
    'homing+lightning': { ltChains: 2, homSplash: 8 }, 'fireTrail+frostNova': { fireVsSlow: 2.0 }, 'fireTrail+homing': { homFire: true, fireDur: 1.3 },
    'frostNova+homing': { homSlow: true, frostDmg: 1.2 }
  }[key];
  if (!prev) showNotification('SYNERGY: ' + syn.name.toUpperCase(), syn.color);
}
function checkEvolution() {
  for (const [wid, evo] of Object.entries(EVOLUTIONS)) {
    if (!player.weapons[wid] || player.weapons[wid] < evo.lvl || player.evolvedWeapons[wid]) continue;
    if ((player[evo.req.stat] || 0) >= evo.req.val) return wid;
  }
  return null;
}

// ─── Arena bounds ───
function keepInArena(o, r) { o.x = Math.max(-ARENA + r, Math.min(ARENA - r, o.x)); o.y = Math.max(-ARENA + r, Math.min(ARENA - r, o.y)); }

// ─── Simple square particles (the farm still uses these) ───
function spawnParticles(wx, wy, count, color) { for (let i = 0; i < count; i++) { const a = Math.random() * TAU, s = 60 + Math.random() * 120; particles.push({ x: wx, y: wy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3 + Math.random() * 0.3, maxLife: 0.6, color, size: 2 + Math.random() * 2 }); } }
function updateParticles(dt) { for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= 0.95; p.vy *= 0.95; } particles = particles.filter(p => p.life > 0); }
