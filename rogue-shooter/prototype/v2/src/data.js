// ─── Classes (design/game-design-v2.md) ───
// Distances and speeds are in art pixels (the scene is about 427×267 on a 1280×800 window).
const BASE = { hp: 100, power: 20, speed: 78, interval: 0.8 };
const CHARS = {
  knight: {
    name: 'Knight', epithet: 'The Juggernaut', color: '#f0a040',
    pct: { hp: 130, pow: 140, spd: 75, atk: 80, crt: 5, arm: 15 },
    attack: 'Sword Slash', ability: 'Shield Bash', cooldown: 8, cdText: '8s',
    plus: 'Fortified: +30% HP, +15% armor', minus: "Heavy: slowest hero, can't kite",
    preferred: ['Vitality', 'Armor'], kind: 'slash', range: 40
  },
  mage: {
    name: 'Mage', epithet: 'The Scholar', color: '#a070e0',
    pct: { hp: 90, pow: 85, spd: 100, atk: 100, crt: 8, arm: 0 },
    attack: 'Magic Bolt', ability: 'Blink', cooldown: 6, cdText: '6s',
    plus: 'Arcane Mind: +20% XP', minus: 'Fragile Power: weakest hits',
    preferred: ['Power', 'Precision'], kind: 'bolt', range: 200, xpMult: 1.2
  },
  marksman: {
    name: 'Marksman', epithet: 'The Sniper', color: '#4a9ad8',
    pct: { hp: 80, pow: 75, spd: 100, atk: 120, crt: 12, arm: 0 },
    attack: 'Piercing Shot', ability: 'Focus Shot', cooldown: 10, cdText: '10s',
    plus: 'Deadeye: crits deal 2.5x', minus: 'Glass Frame: 80% HP, no armor',
    preferred: ['Rapid Fire', 'Precision'], kind: 'pierce', range: 230, critMult: 2.5
  },
  rogue: {
    name: 'Rogue', epithet: 'The Glass Cannon', color: '#5ac860',
    pct: { hp: 70, pow: 60, spd: 130, atk: 150, crt: 8, arm: 0 },
    attack: 'Dagger Flurry', ability: 'Shadow Dash', cooldown: 5, cdText: '5s x2', charges: 2,
    plus: 'Elusive: +30% speed, 15% dodge', minus: 'Paper: 70% HP, no armor',
    preferred: ['Swiftness', 'Momentum'], kind: 'dagger', range: 70, dodge: 0.15
  },
  witch: {
    name: 'Witch', epithet: 'The Ritualist', color: '#d050c0',
    pct: { hp: 85, pow: 100, spd: 90, atk: 50, crt: 5, arm: 5 },
    attack: 'Hex Pulse', ability: 'Ritual Burst', cooldown: 10, cdText: '10s',
    plus: 'Ritual Power: hexed foes take +15%', minus: 'Vulnerable: long gap between pulses',
    preferred: ['Power', 'Thick Skin'], kind: 'pulse', range: 44
  }
};
function classStats(id) {
  const c = CHARS[id], p = c.pct;
  const hp = Math.round(BASE.hp * p.hp / 100);
  return {
    maxHp: hp, hp, damage: Math.round(BASE.power * p.pow / 100), speed: BASE.speed * p.spd / 100,
    attackInterval: BASE.interval * 100 / p.atk, critChance: p.crt / 100, critMult: c.critMult || 2,
    armor: p.arm / 100, dodge: c.dodge || 0, xpMult: c.xpMult || 1, multiShot: 0,
    pickupRange: 36, goldMult: 1, momentum: 0, adrenaline: 0, flatReduce: 0, regen: 0
  };
}

// ─── Level-up cards (12 cards × 4 rarities) ───
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
const RARITY_WEIGHT = [60, 25, 12, 3];
const CARDS = [
  { name: 'Vitality', v: [0.02, 0.04, 0.07, 0.12], pct: true, desc: 'max HP', apply: (p, v) => { const add = Math.round(p.maxHp * v); p.maxHp += add; p.hp += add; } },
  { name: 'Power', v: [0.02, 0.04, 0.07, 0.12], pct: true, desc: 'damage', apply: (p, v) => { p.powerBonus = (p.powerBonus || 0) + v; } },
  { name: 'Swiftness', v: [0.02, 0.04, 0.07, 0.12], pct: true, desc: 'move speed', apply: (p, v) => { p.speed *= 1 + v; } },
  { name: 'Precision', v: [0.01, 0.025, 0.04, 0.08], pct: true, desc: 'crit chance', apply: (p, v) => { p.critChance += v; } },
  { name: 'Armor', v: [0.02, 0.04, 0.07, 0.12], pct: true, desc: 'armor', apply: (p, v) => { p.armor = Math.min(0.75, p.armor + v); } },
  { name: 'Rapid Fire', v: [0.02, 0.04, 0.07, 0.12], pct: true, desc: 'attack speed', apply: (p, v) => { p.attackInterval /= 1 + v; } },
  { name: 'Magnetism', v: [0.05, 0.10, 0.18, 0.30], pct: true, desc: 'pickup radius', apply: (p, v) => { p.pickupRange *= 1 + v; } },
  { name: 'Fortune', v: [0.03, 0.06, 0.10, 0.18], pct: true, desc: 'gold and material drops', apply: (p, v) => { p.goldMult += v; } },
  { name: 'Momentum', v: [0.01, 0.02, 0.035, 0.06], pct: true, desc: 'damage for every second you stay alive', apply: (p, v) => { p.momentum += v; } },
  { name: 'Adrenaline', v: [0.03, 0.06, 0.10, 0.18], pct: true, desc: 'damage while below 50% HP', apply: (p, v) => { p.adrenaline += v; } },
  { name: 'Thick Skin', v: [0.5, 1, 2, 3], pct: false, neg: true, desc: 'damage taken per hit', apply: (p, v) => { p.flatReduce += v; } },
  { name: 'Multi Shot', v: [1, 1, 1, 2], pct: false, desc: 'projectile', bonusDmg: [0, 0, 0.05, 0.08], apply: (p, v, r) => { p.multiShot += v; p.powerBonus = (p.powerBonus || 0) + [0, 0, 0.05, 0.08][r]; } }
];
function cardValueText(c, r) {
  const v = c.v[r];
  if (c.pct) return '+' + (Math.round(v * 1000) / 10) + '%';
  return (c.neg ? '-' : '+') + v;
}

// ─── Materials ───
const MATERIALS = {
  slimeGel: { name: 'Slime Gel', drop: 'slime-gel-drop' },
  batWings: { name: 'Bat Wings', drop: 'bat-wings-drop' },
  boneFragments: { name: 'Bone Fragments', drop: 'bone-fragments-drop' },
  demonEssence: { name: 'Demon Essence', drop: 'demon-essence-drop' },
  wispDust: { name: 'Wisp Dust', drop: 'wisp-dust-drop' },
  sporeDust: { name: 'Spore Dust', drop: 'spore-dust-drop' },
  golemCore: { name: 'Golem Core', drop: 'golem-core-drop' }
};

// ─── Enemies (art keys from art/sprites/enemies/enemies.json) ───
// hp/spd/dmg are multipliers on the round's base slime numbers. xp/gold are per kill.
const ENEMY = {
  slime:     { hp: 1.0, spd: 1.0, dmg: 1.0, xp: 3, gold: 1, mat: 'slimeGel' },
  bat:       { hp: 0.55, spd: 1.6, dmg: 0.8, xp: 3, gold: 1, mat: 'batWings' },
  wisp:      { hp: 0.3, spd: 2.0, dmg: 0.6, xp: 2, gold: 1, mat: 'wispDust', weave: true },
  beetle:    { hp: 2.5, spd: 0.7, dmg: 1.2, xp: 5, gold: 2, mat: 'boneFragments', armoredFront: true },
  shroomling:{ hp: 1.5, spd: 0.9, dmg: 1.0, xp: 4, gold: 1, mat: 'sporeDust', spores: true },
  archer:    { hp: 0.8, spd: 0.6, dmg: 1.4, xp: 5, gold: 2, mat: 'wispDust', ranged: { keep: 110, every: 2.0, speed: 120 } },
  wolf:      { hp: 1.8, spd: 1.3, dmg: 1.6, xp: 6, gold: 2, mat: 'boneFragments', charge: true },
  golem:     { hp: 8.0, spd: 0.35, dmg: 2.0, xp: 12, gold: 4, mat: 'wispDust', shards: true, tough: true },
  crawler:   { hp: 0.6, spd: 1.9, dmg: 1.0, xp: 4, gold: 1, mat: 'wispDust', hidden: 60 },
  moth:      { hp: 0.5, spd: 0.7, dmg: 0, xp: 6, gold: 2, mat: 'wispDust', healer: true },
  magma:     { hp: 2.0, spd: 0.8, dmg: 1.2, xp: 5, gold: 2, mat: 'demonEssence', trail: true },
  imp:       { hp: 0.7, spd: 1.5, dmg: 1.2, xp: 5, gold: 2, mat: 'demonEssence', teleport: true },
  brute:     { hp: 10, spd: 0.3, dmg: 2.2, xp: 14, gold: 5, mat: 'demonEssence', deathBurst: true, tough: true },
  wraith:    { hp: 2.0, spd: 1.1, dmg: 1.4, xp: 6, gold: 2, mat: 'wispDust', phases: true, trueDmg: true },
  nightmare: { hp: 5.0, spd: 0.5, dmg: 1.2, xp: 9, gold: 3, mat: 'wispDust', fear: true, tough: true },
  shade:     { hp: 0.4, spd: 2.4, dmg: 3.0, xp: 6, gold: 2, mat: 'wispDust', assassin: true },
  voidspawn: { hp: 2.0, spd: 1.0, dmg: 1.2, xp: 5, gold: 2, mat: 'demonEssence', splits: 'voidfrag' },
  voidfrag:  { hp: 0.5, spd: 1.5, dmg: 0.9, xp: 2, gold: 1, mat: 'demonEssence', splits: 'voidshard' },
  voidshard: { hp: 0.1, spd: 2.1, dmg: 0.6, xp: 1, gold: 0, mat: null },
  tear:      { hp: 6.0, spd: 0, dmg: 0, xp: 12, gold: 4, mat: 'wispDust', spawner: true, tough: true },
  anchor:    { hp: 8.0, spd: 0, dmg: 0, xp: 12, gold: 4, mat: 'wispDust', gravity: true, tough: true },
  skeleton:  { hp: 3.0, spd: 0.85, dmg: 1.5, xp: 6, gold: 2, mat: 'boneFragments', melee: true, tough: true },
  demon:     { hp: 6.0, spd: 0.6, dmg: 2.2, xp: 10, gold: 4, mat: 'demonEssence', melee: true, tough: true }
};

// ─── Zones: five rounds each ───
// pool rows: [enemy, weight, first second it can appear in a round]
const ZONES = [
  { id: 'meadow', name: 'Meadow', minis: ['giant_slime', 'alpha_bat'], boss: 'guardian',
    pool: [['slime', 6, 0], ['bat', 3, 0], ['wisp', 2, 30], ['beetle', 2, 45], ['skeleton', 1, 90], ['demon', 1, 110]],
    tip: 'Beetles shrug off hits from the front. Get round the side.' },
  { id: 'forest', name: 'Forest', minis: ['mushroom_king', 'pack_leader'], boss: 'forest_witch',
    pool: [['slime', 4, 0], ['bat', 2, 0], ['shroomling', 3, 20], ['archer', 2, 40], ['wolf', 2, 60], ['skeleton', 1, 90], ['demon', 1, 110]],
    tip: 'Archers keep their distance. Close in fast or out-range them.' },
  { id: 'caverns', name: 'Caverns', minis: ['crystal_titan', 'moth_queen'], boss: 'cavern_wyrm',
    pool: [['slime', 3, 0], ['bat', 2, 0], ['crawler', 3, 20], ['golem', 1, 40], ['moth', 1, 50], ['skeleton', 1, 90], ['demon', 1, 110]],
    tip: 'Healer Moths mend everything near them. Kill them first.' },
  { id: 'volcanic', name: 'Volcanic', minis: ['magma_wyrm', 'inferno_golem'], boss: 'volcano_lord',
    pool: [['slime', 3, 0], ['bat', 2, 0], ['magma', 3, 15], ['imp', 2, 35], ['brute', 1, 60], ['skeleton', 1, 90], ['demon', 1, 110]],
    tip: 'Lava Brutes blow up after they fall. Back off when the ring glows.' },
  { id: 'shadow', name: 'Shadow', minis: ['phantom_lord', 'nightmare_king'], boss: 'sovereign',
    pool: [['slime', 3, 0], ['bat', 2, 0], ['wraith', 3, 15], ['shade', 2, 35], ['nightmare', 1, 45], ['skeleton', 1, 90], ['demon', 1, 110]],
    tip: 'Wraiths ignore armor. Shades strike from behind, then run.' },
  { id: 'void', name: 'Void', minis: ['void_hydra', 'reality_breaker'], boss: 'emperor',
    pool: [['slime', 2, 0], ['bat', 2, 0], ['voidspawn', 3, 15], ['tear', 1, 50], ['anchor', 1, 70], ['skeleton', 1, 90], ['demon', 1, 110]],
    tip: 'Void Spawn split when they die. Close Reality Tears fast.' }
];
const TOTAL_ROUNDS = 30;
function zoneOf(round) { return ZONES[Math.min(ZONES.length - 1, Math.floor((round - 1) / 5))]; }
function isBossRound(round) { return round % 5 === 0; }
// Round timeline (design: opening, build-up, swarm, mini-boss, aftermath).
const PHASES = [
  { id: 'opening', name: 'OPENING', from: 0 },
  { id: 'buildup', name: 'BUILD-UP', from: 30 },
  { id: 'swarm', name: 'SWARM', from: 90 },
  { id: 'miniboss', name: 'MINI-BOSS', from: 135 }
];
const MINIBOSS_AT = 135;
function roundScale(round) {
  const zi = Math.floor((round - 1) / 5), r = round - 1;
  return {
    hp: 40 * Math.pow(1.08, r) * Math.pow(1.2, zi),
    dmg: 8 * Math.pow(1.05, r) * Math.pow(1.1, zi),
    spd: 38 * Math.pow(1.01, r),
    spawn: Math.pow(1.03, r) * Math.pow(1.15, zi)
  };
}

// ─── Bosses (art keys from art/sprites/bosses/bosses.json) ───
// hp is a multiple of that round's base slime HP. attacks rotate in order.
const BOSS = {
  giant_slime:    { hp: 5, spd: 0.6, dmg: 1.5, attacks: ['slam'], cd: 4, onDeath: 'split4' },
  alpha_bat:      { hp: 5, spd: 1.2, dmg: 1.2, attacks: ['screech'], cd: 6 },
  mushroom_king:  { hp: 9, spd: 0.5, dmg: 1.5, attacks: ['sporeStorm'], cd: 6 },
  pack_leader:    { hp: 9, spd: 1.2, dmg: 1.6, attacks: ['howl', 'charge'], cd: 4 },
  crystal_titan:  { hp: 15, spd: 0.35, dmg: 2.0, attacks: ['spikeWave'], cd: 4.5 },
  moth_queen:     { hp: 13, spd: 0.6, dmg: 1.0, attacks: ['royalBloom'], cd: 7 },
  magma_wyrm:     { hp: 24, spd: 0.5, dmg: 2.0, attacks: ['fireBreath'], cd: 4.5 },
  inferno_golem:  { hp: 26, spd: 0.3, dmg: 2.2, attacks: ['fireRing'], cd: 5 },
  phantom_lord:   { hp: 34, spd: 0.8, dmg: 1.8, attacks: ['mirror'], cd: 8 },
  nightmare_king: { hp: 38, spd: 0.45, dmg: 2.0, attacks: ['dreadRoar'], cd: 7 },
  void_hydra:     { hp: 56, spd: 0.4, dmg: 2.2, attacks: ['tripleStrike'], cd: 4 },
  reality_breaker:{ hp: 52, spd: 0.7, dmg: 2.0, attacks: ['breakStep'], cd: 6 },
  guardian:       { hp: 8, spd: 0.4, dmg: 2.0, attacks: ['rootSlam'], cd: 4, weakBack: true },
  forest_witch:   { hp: 15, spd: 0.5, dmg: 2.2, attacks: ['webBall', 'poisonRain'], cd: 3.5 },
  cavern_wyrm:    { hp: 25, spd: 0.45, dmg: 2.6, attacks: ['crystalBreath', 'charge'], cd: 4 },
  volcano_lord:   { hp: 40, spd: 0.4, dmg: 2.8, attacks: ['boulder', 'geysers'], cd: 3.5 },
  sovereign:      { hp: 60, spd: 0.5, dmg: 2.4, attacks: ['darkOrb'], cd: 5, phasing: true },
  emperor:        { hp: 100, spd: 0.5, dmg: 3.0, attacks: ['voidBeam', 'summonVoid'], cd: 3.5, phases: 3 }
};
const BOSS_TIPS = {
  guardian: 'Its weak spot is the glowing knot on its back.',
  forest_witch: 'Webs slow you. Keep moving between the poison drops.',
  cavern_wyrm: 'It charges in a straight line. Step aside.',
  volcano_lord: 'Watch the ground: geysers bubble before they burst.',
  sovereign: 'It fades in and out. Hit it while you can see it.',
  emperor: 'Three phases. In the last, the arena closes in.'
};

// ─── Weapons (bought, levelled, modded and evolved at the Forge: buildings.js) ───
const WEAPONS = {
  orbital: { name: 'Orbital Blades', color: '#ffcc44', levels: [
    { blades: 2, damage: 10, radius: 30, speed: 2.6 }, { blades: 3, damage: 15, radius: 33, speed: 3.0 }, { blades: 5, damage: 22, radius: 38, speed: 3.4 }] },
  lightning: { name: 'Chain Lightning', color: '#ffe040', levels: [
    { damage: 18, interval: 2.5, chains: 0 }, { damage: 25, interval: 2.0, chains: 2 }, { damage: 35, interval: 1.5, chains: 4 }] },
  fireTrail: { name: 'Fire Trail', color: '#f05a28', levels: [
    { damage: 8, radius: 10, duration: 2.0 }, { damage: 12, radius: 12, duration: 3.0 }, { damage: 18, radius: 14, duration: 4.0 }] },
  frostNova: { name: 'Frost Nova', color: '#8ccaf2', levels: [
    { damage: 15, radius: 46, slowPct: 0.3, slowDur: 2, interval: 4 }, { damage: 22, radius: 48, slowPct: 0.5, slowDur: 3, interval: 3 }, { damage: 35, radius: 50, slowPct: 0.65, slowDur: 4, interval: 2.5 }] },
  homing: { name: 'Homing Missiles', color: '#d07a3a', levels: [
    { count: 1, damage: 20, interval: 2.0, splash: 0 }, { count: 2, damage: 28, interval: 2.0, splash: 0 }, { count: 3, damage: 35, interval: 1.5, splash: 22 }] }
};
function getWpnCfg(wid, lvl) {
  const w = WEAPONS[wid]; let cfg;
  if (lvl <= 3) cfg = { ...w.levels[lvl - 1] };
  else {
    const b = w.levels[2], n = lvl - 3;
    switch (wid) {
      case 'orbital': cfg = { blades: Math.min(8, b.blades + Math.floor(n / 2)), damage: b.damage + n * 6, radius: b.radius + n * 2, speed: b.speed + n * 0.15 }; break;
      case 'lightning': cfg = { damage: b.damage + n * 8, interval: Math.max(0.5, b.interval - n * 0.1), chains: Math.min(8, b.chains + n) }; break;
      case 'fireTrail': cfg = { damage: b.damage + n * 5, radius: b.radius + n, duration: Math.min(8, b.duration + n * 0.3) }; break;
      case 'frostNova': cfg = { damage: b.damage + n * 8, radius: b.radius, slowPct: Math.min(0.85, b.slowPct + n * 0.02), slowDur: Math.min(6, b.slowDur + n * 0.3), interval: Math.max(1.0, b.interval - n * 0.15) }; break;
      case 'homing': cfg = { count: Math.min(8, b.count + Math.floor(n / 2)), damage: b.damage + n * 8, interval: Math.max(0.5, b.interval - n * 0.08), splash: b.splash + n * 3 }; break;
    }
  }
  if (player && player.evolvedWeapons && player.evolvedWeapons[wid]) {
    switch (wid) {
      case 'orbital': cfg.damage = Math.round(cfg.damage * 1.5); cfg.speed *= 1.4; cfg.evoSplash = 14; cfg.blades = Math.max(cfg.blades, 6); break;
      case 'lightning': cfg.damage = Math.round(cfg.damage * 2); cfg.chains += 3; break;
      case 'fireTrail': cfg.damage = Math.round(cfg.damage * 1.8); cfg.radius = Math.round(cfg.radius * 1.4); break;
      case 'frostNova': cfg.slowPct = 1.0; cfg.damage = Math.round(cfg.damage * 1.5); cfg.radius = 60; break;
      case 'homing': cfg.count = Math.min(12, cfg.count * 2); cfg.splash = Math.max(24, cfg.splash); cfg.interval *= 0.7; break;
    }
  }
  const mod = player && typeof weaponMod === 'function' ? weaponMod(wid) : null;
  if (mod === 'amplify') cfg.damage = Math.round(cfg.damage * 1.25);
  if (mod === 'velocity') { if (cfg.interval) cfg.interval /= 1.3; if (cfg.speed) cfg.speed *= 1.3; if (wid === 'fireTrail') cfg.duration *= 1.3; }
  if (mod === 'piercing') { if (wid === 'lightning') cfg.chains += 1; if (wid === 'homing') cfg.count += 1; if (wid === 'orbital') cfg.blades += 1; if (wid === 'frostNova') cfg.radius += 6; if (wid === 'fireTrail') cfg.radius += 2; }
  if (player && player.buffs && player.buffs.void > 0) cfg.damage *= 2;
  if (player && player.synBonus) {
    const sb = player.synBonus;
    if (wid === 'orbital') { if (sb.orbDmg) cfg.damage = Math.round(cfg.damage * sb.orbDmg); if (sb.orbBlades) cfg.blades += sb.orbBlades; }
    if (wid === 'lightning') { if (sb.ltDmg) cfg.damage = Math.round(cfg.damage * sb.ltDmg); if (sb.ltChains) cfg.chains += sb.ltChains; }
    if (wid === 'fireTrail') { if (sb.fireDmg) cfg.damage = Math.round(cfg.damage * sb.fireDmg); if (sb.fireDur) cfg.duration *= sb.fireDur; }
    if (wid === 'frostNova') { if (sb.frostDmg) cfg.damage = Math.round(cfg.damage * sb.frostDmg); }
    if (wid === 'homing') { if (sb.homCount) cfg.count += sb.homCount; if (sb.homSplash) cfg.splash += sb.homSplash; }
  }
  return cfg;
}
function getWpnDesc(wid, lvl) {
  const c = getWpnCfg(wid, lvl);
  switch (wid) {
    case 'orbital': return c.blades + ' blades, ' + c.damage + ' damage each';
    case 'lightning': return c.damage + ' damage, ' + c.chains + ' chains, every ' + c.interval.toFixed(1) + 's';
    case 'fireTrail': return c.damage + ' damage flames that last ' + c.duration.toFixed(1) + 's';
    case 'frostNova': return c.damage + ' damage, ' + Math.round(c.slowPct * 100) + '% slow, every ' + c.interval.toFixed(1) + 's';
    case 'homing': return c.count + ' missiles, ' + c.damage + ' damage' + (c.splash > 0 ? ', splash' : '');
  }
}
const EVOLUTIONS = {
  orbital: { name: 'Sawblade Tornado', strip: 'sawblade-tornado', req: { stat: 'speed', val: 155 / 100 * BASE.speed, label: 'Speed 155+' }, lvl: 5, desc: 'Six spinning saws that splash' },
  lightning: { name: 'Judgement', strip: 'judgement', req: { stat: 'critChance', val: 0.20, label: 'Crit 20%+' }, lvl: 5, desc: 'A pillar of light: double damage, +3 chains' },
  fireTrail: { name: 'Hellfire', strip: 'hellfire', req: { stat: 'powerBonus', val: 0.30, label: 'Power +30%' }, lvl: 5, desc: 'Taller, darker flames, +80% fire damage' },
  frostNova: { name: 'Absolute Zero', strip: 'absolute-zero', req: { stat: 'armor', val: 0.30, label: 'Armor 30%+' }, lvl: 5, desc: 'A huge freezing burst with ice spikes' },
  homing: { name: 'Missile Barrage', strip: 'missile-barrage', req: { stat: 'multiShot', val: 3, label: 'Multi Shot 3+' }, lvl: 5, desc: 'Double the missiles, all with splash' }
};
const SYNERGIES = {
  'fireTrail+orbital': { name: 'Blazing Orbit', desc: 'Orbital +30% damage, fire +50% damage', color: '#f08a2a' },
  'lightning+orbital': { name: 'Arc Blades', desc: 'Orbital +30% damage, +2 lightning chains', color: '#ffe040' },
  'frostNova+orbital': { name: 'Frozen Edge', desc: 'Orbital hits slow enemies 25%', color: '#8ccaf2' },
  'homing+orbital': { name: 'Guided Blades', desc: '+2 orbital blades, +1 missile', color: '#ffcc44' },
  'fireTrail+lightning': { name: 'Storm Fire', desc: 'Lightning +50% damage, fire +30% damage', color: '#f08a2a' },
  'frostNova+lightning': { name: 'Shatter Storm', desc: 'Lightning deals double to frozen enemies', color: '#8ccaf2' },
  'homing+lightning': { name: 'Tesla Lock', desc: '+2 lightning chains, missiles splash wider', color: '#ffe040' },
  'fireTrail+frostNova': { name: 'Thermal Shock', desc: 'Fire deals double to frozen enemies', color: '#f4a6c6' },
  'fireTrail+homing': { name: 'Napalm Strike', desc: 'Missiles leave fire, fire lasts 30% longer', color: '#f05a28' },
  'frostNova+homing': { name: 'Cryo Missiles', desc: 'Missiles slow, frost +20% damage', color: '#8ccaf2' }
};

// ─── Crops (quick and standard; rare and legendary need the multi-plot planting preview) ───
// price: seed shop placeholders (menus-2.html shows Wheat 12, Healing Herb 10, Frost Berry/Fire Pepper 30, Iron Vine 35, Echo Bloom 40).
const CROPS = {
  'healing-herb': { name: 'Healing Herb', tier: 'QUICK', grow: 1, price: 10, buff: 'Regen 1 HP/s for 30s' },
  'pep-root': { name: 'Pep Root', tier: 'QUICK', grow: 1, price: 12, buff: '+10% move speed' },
  'glow-moss': { name: 'Glow Moss', tier: 'QUICK', grow: 1, price: 14, buff: '+15% XP gain' },
  'wheat': { name: 'Wheat', tier: 'QUICK', grow: 1, price: 12, buff: '+5 gold per enemy killed' },
  'thorn-seed': { name: 'Thorn Seed', tier: 'QUICK', grow: 1, price: 12, buff: 'Enemies take 3 damage on contact' },
  'fire-pepper': { name: 'Fire Pepper', tier: 'STANDARD', grow: 2, price: 30, buff: '15% chance attacks ignite' },
  'frost-berry': { name: 'Frost Berry', tier: 'STANDARD', grow: 2, price: 30, buff: 'Passive 10% slow aura' },
  'thunder-turnip': { name: 'Thunder Turnip', tier: 'STANDARD', grow: 2, price: 32, buff: '+20% attack speed' },
  'shadow-mushroom': { name: 'Shadow Mushroom', tier: 'STANDARD', grow: 2, price: 32, buff: '+10% crit chance' },
  'iron-vine': { name: 'Iron Vine', tier: 'STANDARD', grow: 2, price: 35, buff: '+15% armor' },
  'bloodroot': { name: 'Bloodroot', tier: 'STANDARD', grow: 2, price: 35, buff: '3% lifesteal' },
  'echo-bloom': { name: 'Echo Bloom', tier: 'STANDARD', grow: 2, price: 40, buff: '10% chance projectiles double' }
};
function cropsInStock() { return Object.keys(CROPS).filter(k => CROPS[k].tier === 'QUICK' || currentRound >= 6); }
// Plot groups from the design's unlock table: [first round, cost]; 4 plots each (6 for the last).
const PLOT_GROUPS = [[1, 0], [2, 50], [5, 75], [8, 100], [12, 150], [17, 200], [22, 300]];
// Potions sold in town (design T1 potions). They go on the belt, or into the Potion Chest once the Alchemy Lab is built.
const CONSUMABLE_SHOP = [
  { id: 'heal', name: 'Heal Flask', icon: 'Heal Flask', cost: 15, desc: 'Restore 25% HP' },
  { id: 'speed', name: 'Speed Draught', icon: 'Speed Draught', cost: 20, desc: '+25% speed for 30s' },
  { id: 'power', name: 'Power Tonic', icon: 'Power Tonic', cost: 20, desc: '+20% damage for 30s' }
];
