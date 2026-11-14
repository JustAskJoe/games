// ─── Main loop ───
let lastTime = 0, gameClock = 0;
const MENU_STATES = new Set(['title', 'start', 'map', 'options']);
const MAX_ENEMIES = 140;
function updateRound(dt) {
  gameTime += dt; runStats.time += dt;
  if (aftermath > 0) {
    aftermath -= dt; vacuum = true;
    if (aftermath <= 0) { if (finalBossDown) victory(); else roundComplete(); return false; }
  } else {
    spawnTimer -= dt;
    if (spawnTimer <= 0) { if (enemies.length < MAX_ENEMIES) spawnRegular(); spawnTimer = spawnInterval(); }
    if (!miniSpawned && gameTime >= MINIBOSS_AT) { miniSpawned = true; spawnMiniBoss(); }
  }
  updatePlayer(dt); updateBullets(dt); updateEnemies(dt); updateHazards(dt); updateWeapons(dt); updatePickups(dt);
  if (state !== 'playing') return false;
  if (pendingLevels > 0 && levelBurstT === 0) {
    levelBurstT = 0.001; player.invT = Math.max(player.invT, 0.8);
    fx.push({ dir: 'combat', key: 'level-up-burst', x: player.x, y: player.y + 6, anchor: 'feet', t: 0, dur: stripDur('combat', 'level-up-burst'), follow: player, behind: true });
  }
  if (levelBurstT > 0) { levelBurstT += dt; if (levelBurstT >= 0.55) { levelBurstT = 0; showLevelUp(); } }
  return true;
}
function frame(now, dt) {
  gameClock += dt;
  tickUiSprites(now);
  if (notifTimer > 0) { notifTimer -= dt; if (notifTimer <= 0) $('notification').hidden = true; }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').hidden = true; }
  if (shakeTimer > 0) { shakeTimer -= dt; shakeOX = Math.round((Math.random() - 0.5) * shakeIntensity * 0.6); shakeOY = Math.round((Math.random() - 0.5) * shakeIntensity * 0.6); }
  else { shakeOX = shakeOY = 0; shakeIntensity = 0; }
  if (state === 'loading') return;
  if (state === 'farm') { updateFarm(dt); drawFarmWorld(); return; }
  if (MENU_STATES.has(state) && !(state === 'options' && optionsReturn === 'paused')) {
    camera.x = Math.round(Math.sin(gameClock * 0.05) * 120); camera.y = Math.round(Math.cos(gameClock * 0.04) * 60);
    drawCombatWorld(true); return;
  }
  if (state === 'playing') { if (updateRound(dt)) { updateFloaters(dt); updateCamera(dt); updateHUD(); } }
  else if (state === 'dying') {
    dyingT += dt; updateFloaters(dt);
    for (const e of enemies) { e.t += dt; if (e.spawnT < SPAWN_DUR) e.spawnT += dt; }
    if (dyingT > stripDur('combat', selectedCharId + '-death') + 0.8) runOver();
  }
  drawCombatWorld(false);
}
function gameLoop(now) {
  requestAnimationFrame(gameLoop);
  const dt = Math.max(0, Math.min((now - lastTime) / 1000, 0.05)); lastTime = now;
  beginFrame(PIXEL_SCALE);
  frame(now, dt);
  endFrame();
  if (state === 'playing' || state === 'dying') drawDamageNumbers();
  touchTick();
}
function backdrop(zid) { if (arenaZone !== zid) buildArena(zid); }

loadAssets().then(() => {
  $('loading').hidden = true;
  showTitle();
  requestAnimationFrame(gameLoop);
});
