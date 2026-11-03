// ─── State ───
// loading | title | start (class select) | map (battle map) | playing | levelup | stats | paused | options
// | roundComplete | dying | dead | won | farm
let state = 'loading', selectedCharId = null, prevState = null;
let player, enemies = [], bullets = [], pickups = [], particles = [], floatingTexts = [], fx = [];
let eProj = [], hazards = [], bursts = [], geysers = [], rings = [], chevrons = [], darkZones = [], collapse = null;
let camera = { x: 0, y: 0 }, gameTime = 0, spawnTimer = 0, kills = 0, totalDamage = 0, shakeTimer = 0, shakeIntensity = 0;
let bossRef = null, miniSpawned = false, aftermath = 0, vacuum = false, notifTimer = 0, pendingLevels = 0, levelBurstT = 0, finalBossDown = false;
let orbitalAngle = 0, weaponTimers = {}, firePatches = [], homingMissiles = [], lightningBolts = [], frostPatches = [];
let currentRound = 1, coins = 0, roundKills = 0, roundCoins = 0, roundMats = {}, materials, runStats;
let zone = ZONES[0], roundSc = roundScale(1), dyingT = 0;
let farmArea, farmPlots, farmDecos, farmShopOpen, farmInteract, farmMaps, transCooldown;
const options = { shake: true, damageNumbers: true, flashes: true };

function initRun(charId) {
  selectedCharId = charId;
  const c = CHARS[charId];
  player = Object.assign({
    x: 0, y: 0, weapons: {}, evolvedWeapons: {}, synergy: null, synBonus: {}, cards: {}, cardCount: {}, powerBonus: 0,
    attackTimer: 0.4, invT: 0, stunT: 0, slowT: 0, slowPct: 0, dreadT: 0, hurtT: null, knock: null,
    aim: { x: 0, y: 1 }, view: 'front', flip: false, walkT: 0, moving: false, atk: null, ability: null,
    abilityCd: 0, charges: c.charges || 0, xp: 0, level: 1, xpToLevel: 12, aliveT: 0,
    buffs: {}, altEvo: {}, shield: 0
  }, classStats(charId));
  currentRound = 1; coins = 0; kills = 0; totalDamage = 0;
  materials = Object.fromEntries(Object.keys(MATERIALS).map(k => [k, 0]));
  runStats = { taken: 0, roundsCleared: 0, bossesDown: 0, time: 0, gold: 0, cores: 0 };
  lastHitBy = null; lastBossName = '';
  farmArea = 'farm'; farmShopOpen = null; farmInteract = null; farmMaps = {}; transCooldown = 0;
  initBuildings();
  initFarmState();
}
function initRound() {
  zone = zoneOf(currentRound); roundSc = roundScale(currentRound);
  player.x = 0; player.y = 0; player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.5));
  player.atk = null; player.ability = null; player.hurtT = null; player.knock = null; player.invT = 0; player.stunT = 0; player.aliveT = 0;
  player.abilityCd = 0; player.charges = CHARS[selectedCharId].charges || 0;
  enemies = []; bullets = []; pickups = []; particles = []; floatingTexts = []; fx = [];
  eProj = []; hazards = []; bursts = []; geysers = []; rings = []; chevrons = []; darkZones = []; collapse = null;
  camera = { x: 0, y: 0 }; gameTime = 0; spawnTimer = 1; roundKills = 0; roundCoins = 0; roundMats = {};
  shakeTimer = 0; shakeIntensity = 0; bossRef = null; miniSpawned = false; aftermath = 0; vacuum = false; pendingLevels = 0; levelBurstT = 0;
  orbitalAngle = 0; weaponTimers = { lightning: 0, frostNova: 0, homing: 0, fireTrail: 0 };
  firePatches = []; homingMissiles = []; lightningBolts = []; frostPatches = [];
  buildArena(zone.id);
}

// ─── Screen flow ───
function setScreen(id) {
  for (const el of document.querySelectorAll('.screen')) el.hidden = el.id !== id;
  $('stage').hidden = !id;
  screenDecor(id);
  if (id && player && !$('hud').hidden) $('hud').hidden = true;
  fitStage();
}
function showTitle() { state = 'title'; hideHud(); hideFarmHud(); setScreen('title'); buildTitle(); backdrop('meadow'); }
function showCharSelect() { state = 'start'; hideHud(); hideFarmHud(); setScreen('classes'); buildCharSelect(); backdrop('meadow'); }
function startRun(charId) { initRun(charId); showBattleMap(); }
function hideFarmHud() { $('farmhud').hidden = true; $('farm-prompt').hidden = true; }
function showBattleMap() {
  state = 'map'; hideHud(); hideFarmHud(); zone = zoneOf(currentRound);
  setScreen('battlemap'); buildBattleMap(); backdrop(zone.id);
}
function fight() {
  initRound(); state = 'playing'; setScreen(null); hideFarmHud(); showHud();
  player.crop = player.nextCrop; player.nextCrop = null;
  onRoundStart();
  showNotification(player.crop ? CROPS[player.crop].name.toUpperCase() + ': ' + CROPS[player.crop].buff.toUpperCase() : 'ROUND ' + currentRound + ' · ' + zone.name.toUpperCase(), '#ffcc44');
}
function roundComplete() {
  state = 'roundComplete'; hideHud(); runStats.roundsCleared = currentRound;
  if (isBossRound(currentRound)) runStats.bossesDown++;
  onRoundEnd();
  setScreen('roundcomplete'); buildRoundComplete();
}
function leaveRound() {
  currentRound++;
  enterFarm(true);
}
function startDying() {
  state = 'dying'; dyingT = 0; hideHud(); player.ability = null; player.atk = null;
}
function runOver() { state = 'dead'; setScreen('runover'); buildRunOver(); }
function victory() { state = 'won'; hideHud(); runStats.roundsCleared = TOTAL_ROUNDS; runStats.bossesDown++; setScreen('victory'); buildVictory(); }
function pauseGame() { if (state !== 'playing') return; state = 'paused'; setScreen('pause'); buildPause(); }
function resumeGame() { state = 'playing'; setScreen(null); showHud(); }
function giveUp() { startDying(); setScreen(null); }
