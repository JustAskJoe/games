// ─── The six farm buildings: data, run state, and what they change in a fight ───
// Numbers come from design/game-design-v2.md (Buildings). Menus are in bmenus.js, built to art/concepts/buildings.html.
// © 2026 justaskjoe. All rights reserved.

const BUILDINGS = {
  forge: {
    name: 'Forge', sub: 'WEAPONS', theme: 't-forge', icon: 'Orbital Blades', hot: 'hot',
    what: 'A smithy of riveted iron and an always-hot hearth. Every weapon you carry into a fight is bought and forged here. Weapons never come from level-up cards.',
    does: ['Buy any of the five weapons for 25 gold and 2 of its signature material', 'Equip one weapon (a second slot opens after the round 5 boss)', 'Level weapons up with gold and their signature material; levels stay when you swap', 'Tier 2 adds weapon mods, tier 3 adds evolutions'],
    tiers: [
      { unlocks: 'All 5 weapons, equip 1, level cap 3', cost: { g: 75, m: { boneFragments: 5 } } },
      { unlocks: 'Level cap 5, weapon mods', cost: { g: 200, m: { boneFragments: 15, demonEssence: 3 } } },
      { unlocks: 'Level cap 7, evolutions', cost: { g: 500, m: { golemCore: 2 } } }]
  },
  alchemy: {
    name: 'Alchemy Lab', sub: 'CRAFTING', theme: 't-alch', icon: 'Heal Flask', hot: 'gold',
    what: 'A purple workbench with a bubbling cauldron and a recipe book. Brew potions from your harvest and monster materials, and keep them in the Potion Chest.',
    does: ['Brew potions from crops, materials and gold', 'Opens the Potion Chest (10 potions) in the cabin', 'Turn 3 seeds into 1 seed of the next tier', 'Tier 2: elixirs, a third belt slot (R) and material swaps. Tier 3: legendary tonics, every potion 25% stronger'],
    tiers: [
      { unlocks: 'Basic potions, 2 belt slots, seed conversion', cost: { g: 60, m: { slimeGel: 5, sporeDust: 5 } } },
      { unlocks: 'Elixirs, 3 belt slots, material conversion', cost: { g: 175, m: { wispDust: 10, sporeDust: 5 } } },
      { unlocks: 'Legendary tonics, +25% potency', cost: { g: 400, m: { golemCore: 2, demonEssence: 10 } } }]
  },
  training: {
    name: 'Training Grounds', sub: 'STATS', theme: 't-train', icon: 'Power', hot: 'ink',
    what: 'A sandy yard with straw dummies and a target. After every fight you drill one stat a little higher, for the rest of the run.',
    does: ['Pick one of 7 stats to raise by 3% after each round', 'Luck makes rarer level-up cards show up more often', 'Each stat is capped: 15% at tier 1, 30% at tier 2, 50% at tier 3', 'Tier 3: +4% a round and 4 cards on every level-up'],
    tiers: [
      { unlocks: '+3% a round, cap 15%', cost: { g: 50, m: { boneFragments: 5 } } },
      { unlocks: '+3% a round, cap 30%', cost: { g: 150, m: { boneFragments: 10, batWings: 5 } } },
      { unlocks: '+4% a round, cap 50%, 4 cards per level-up', cost: { g: 350, m: { golemCore: 1, demonEssence: 10 } } }]
  },
  shrine: {
    name: 'Shrine', sub: 'BLESSINGS', theme: 't-shrine', icon: 'Guardian', hot: 'holy',
    what: 'Old stone pillars that glow when you leave an offering. The shrine answers with three blessings; you keep one for the rest of the run.',
    does: ['Offer 10 materials and 30 gold to be shown 3 of the 9 blessings', 'Take one; it lasts the whole run', 'A new blessing can replace an old one when your slots are full', 'Tier 2: 2 slots and a reroll. Tier 3: 3 slots, 2 rerolls, cheaper offerings'],
    tiers: [
      { unlocks: '1 blessing slot', cost: { g: 80, m: { wispDust: 5 } } },
      { unlocks: '2 slots, 1 reroll', cost: { g: 200, m: { wispDust: 10, demonEssence: 5 } } },
      { unlocks: '3 slots, 2 rerolls, cheaper offerings', cost: { g: 450, m: { golemCore: 2 } } }]
  },
  barn: {
    name: 'Barn', sub: 'ANIMALS', theme: 't-barn', icon: 'Cows', hot: 'gold',
    what: 'A red barn with a fenced pen. Animals bring you something after every round, and dogs come into the fight with you.',
    does: ['Keep 1 animal (2 at tier 2, 3 at tier 3)', 'Chickens lay seeds, cows and goats bring materials, pigs bring gold, bees bring Spore Dust', 'Dogs fight beside you', 'Two or three of the same animal give more than double'],
    tiers: [
      { unlocks: '1 animal stall', cost: { g: 60, m: { slimeGel: 5, sporeDust: 5 } } },
      { unlocks: '2 animal stalls', cost: { g: 150, any: 10 } },
      { unlocks: '3 animal stalls', cost: { g: 300, m: { golemCore: 1 } } }]
  },
  arena: {
    name: 'Arena', sub: 'RISK AND REWARD', theme: 't-arena', icon: 'Berserkers', hot: 'gold',
    what: 'A sand ring under red and gold banners. Make the next fight harder with mutators and the crowd pays you more for it.',
    does: ['Pick mutators that make the next round harder', 'Earn more gold and materials for every mutator: +50%, +125%, +225%', 'Tier 1: 1 mutator. Tier 2: up to 2. Tier 3: up to 3 and a guaranteed rare drop', 'Picks stay until you change them'],
    tiers: [
      { unlocks: '1 mutator, +50% gold and materials', cost: { g: 75, m: { demonEssence: 5 } } },
      { unlocks: 'Up to 2 mutators, +125%', cost: { g: 200, m: { demonEssence: 10, boneFragments: 5 } } },
      { unlocks: 'Up to 3 mutators, +225% and a rare drop', cost: { g: 450, m: { golemCore: 2 } } }]
  }
};
const BUILD_ORDER = ['forge', 'alchemy', 'training', 'shrine', 'barn', 'arena'];

// ─── Weapons at the Forge ───
const SIG = { orbital: 'boneFragments', lightning: 'wispDust', fireTrail: 'demonEssence', frostNova: 'slimeGel', homing: 'batWings' };
const WPN_ORDER = ['frostNova', 'orbital', 'lightning', 'fireTrail', 'homing'];
const WPN_DESC = {
  orbital: 'Blades circle you and cut whatever they pass through.', lightning: 'Lightning strikes the nearest enemy and jumps to others.',
  fireTrail: 'You leave burning ground behind you as you move.', frostNova: 'A burst of ice around you that slows what it hits.',
  homing: 'Missiles find their own targets.'
};
const LEVEL_COST = [null, { g: 30, n: 3, t: 1 }, { g: 60, n: 6, t: 1 }, { g: 100, n: 10, t: 2 }, { g: 150, n: 15, t: 2 }, { g: 225, n: 20, core: 1, t: 3 }, { g: 325, n: 25, core: 2, t: 3 }];
const LEVEL_CAP = [0, 3, 5, 7];
const MODS = [
  { id: 'piercing', name: 'Piercing', eff: 'Hits +1 more enemy', m: { boneFragments: 10, batWings: 5 } },
  { id: 'siphon', name: 'Siphon', eff: '3% of damage heals you', m: { slimeGel: 10, sporeDust: 5 } },
  { id: 'amplify', name: 'Amplify', eff: '+25% weapon damage', m: { demonEssence: 10, wispDust: 5 } },
  { id: 'velocity', name: 'Velocity', eff: '+30% attack speed', m: { batWings: 10, slimeGel: 5 } },
  { id: 'eruption', name: 'Eruption', eff: 'Kills explode', m: { demonEssence: 10, boneFragments: 5 } },
  { id: 'chill', name: 'Chill', eff: 'Hits briefly slow', m: { slimeGel: 10, wispDust: 5 } }
];
// Main and alternate evolutions (T3, level 5, a stat gate). Stat units match the stats screen.
const EVO_GATES = {
  orbital: [{ name: 'Sawblade Tornado', strip: 'sawblade-tornado', stat: 'speed', val: 155, label: 'SPEED 155' }, { name: 'Phantom Edge', strip: 'phantom-edge', stat: 'crit', val: 25, label: 'CRIT 25%', desc: 'Ghost blades that can crit, +30% damage' }],
  lightning: [{ name: 'Judgement', strip: 'judgement', stat: 'crit', val: 20, label: 'CRIT 20%' }, { name: 'Storm Cage', strip: 'storm-cage', stat: 'armor', val: 25, label: 'ARMOR 25%', desc: 'A ring of lightning shocks everything near you' }],
  fireTrail: [{ name: 'Hellfire', strip: 'hellfire', stat: 'power', val: 130, label: 'POWER 130' }, { name: 'Ember Swarm', strip: 'ember-swarm', stat: 'speed', val: 160, label: 'SPEED 160', desc: 'Embers fly out and set enemies alight' }],
  frostNova: [{ name: 'Absolute Zero', strip: 'absolute-zero', stat: 'armor', val: 30, label: 'ARMOR 30%' }, { name: 'Glacial Tomb', strip: 'glacial-tomb', stat: 'power', val: 135, label: 'POWER 135', desc: 'Freezes enemies solid, +40% damage' }],
  homing: [{ name: 'Missile Barrage', strip: 'missile-barrage', stat: 'multishot', val: 3, label: 'MULTI SHOT 3' }, { name: 'Orbital Cannon', strip: 'orbital-cannon', stat: 'crit', val: 20, label: 'CRIT 20%', desc: 'A beam from the sky on a locked target' }]
};
function heroStat(k) {
  const c = CHARS[selectedCharId], base = classStats(selectedCharId);
  if (k === 'speed') return Math.round(c.pct.spd * player.speed / base.speed);
  if (k === 'power') return Math.round(c.pct.pow * (1 + (player.powerBonus || 0)));
  if (k === 'crit') return Math.round(player.critChance * 100);
  if (k === 'armor') return Math.round(player.armor * 100);
  if (k === 'multishot') return player.multiShot;
  return 0;
}
function statText(k, v) { return k === 'crit' || k === 'armor' ? v + '%' : String(v); }

// ─── Alchemy ───
const RARE_CROPS = { 'dragon-fruit': 'Dragon Fruit', 'crystal-bloom': 'Crystal Bloom', 'ironbark-root': 'Ironbark Root', 'life-tree-sapling': 'Life Tree Sapling', 'void-blossom': 'Void Blossom' };
function cropName(k) { return CROPS[k] ? CROPS[k].name : RARE_CROPS[k] || k; }
const POTIONS = {
  heal: { name: 'Heal Flask', tier: 1, c: { 'healing-herb': 2 }, m: { slimeGel: 3 }, g: 10, dur: 0, eff: 'Restore 25% of your HP at once.' },
  speed: { name: 'Speed Draught', tier: 1, c: { 'pep-root': 2 }, m: { batWings: 3 }, g: 10, dur: 30, eff: '+25% move speed for 30 seconds.' },
  power: { name: 'Power Tonic', tier: 1, c: { 'thorn-seed': 1, 'wheat': 1 }, m: { demonEssence: 3 }, g: 10, dur: 30, eff: '+20% damage for 30 seconds.' },
  iron: { name: 'Iron Brew', tier: 1, c: { 'wheat': 2 }, m: { boneFragments: 3 }, g: 10, dur: 30, eff: '+20% armor for 30 seconds.' },
  focus: { name: 'Focus Drops', tier: 1, c: { 'glow-moss': 2 }, m: { wispDust: 3 }, g: 10, dur: 30, eff: '+15% crit chance for 30 seconds.' },
  cleanse: { name: 'Cleansing Salve', tier: 1, c: { 'healing-herb': 1, 'glow-moss': 1 }, m: { sporeDust: 3 }, g: 10, dur: 15, eff: 'Clears slows and stuns, then keeps them off for 15 seconds.' },
  berserk: { name: 'Berserker Brew', tier: 2, c: { 'fire-pepper': 3, 'thorn-seed': 1 }, m: { demonEssence: 5 }, g: 25, dur: 45, eff: '+25% damage and attack speed, -15% armor for 45 seconds.' },
  stoneskin: { name: 'Stone Skin Elixir', tier: 2, c: { 'iron-vine': 3, 'wheat': 1 }, m: { boneFragments: 5 }, g: 25, dur: 30, eff: '+35% armor, and no hit takes more than 10% HP, for 30 seconds.' },
  ghost: { name: 'Ghost Oil', tier: 2, c: { 'pep-root': 2, 'frost-berry': 2 }, m: { batWings: 5 }, g: 25, dur: 30, eff: '+20% speed and 15% dodge for 30 seconds.' },
  vampiric: { name: 'Vampiric Serum', tier: 2, c: { 'bloodroot': 2, 'healing-herb': 2 }, m: { slimeGel: 5 }, g: 25, dur: 45, eff: '+15% damage and 5% lifesteal for 45 seconds.' },
  shadow: { name: 'Shadow Extract', tier: 2, c: { 'shadow-mushroom': 3, 'glow-moss': 1 }, m: { wispDust: 5 }, g: 25, dur: 30, eff: '+20% crit, and crits deal 3x, for 30 seconds.' },
  moon: { name: 'Harvest Moon Tonic', tier: 2, c: { 'glow-moss': 2, 'wheat': 2 }, m: { sporeDust: 5 }, g: 25, dur: 45, eff: '+30% XP, gold and materials for 45 seconds.' },
  frost: { name: 'Frost Elixir', tier: 2, c: { 'frost-berry': 3, 'healing-herb': 1 }, m: { slimeGel: 5 }, g: 25, dur: 30, eff: 'Your attacks slow enemies by 15% for 30 seconds.' },
  storm: { name: 'Storm Surge', tier: 2, c: { 'thunder-turnip': 2, 'echo-bloom': 1, 'pep-root': 1 }, m: { wispDust: 5 }, g: 25, dur: 30, eff: '+30% attack speed and chain sparks for 30 seconds.' },
  rage: { name: 'Rage Infusion', tier: 3, c: { 'dragon-fruit': 1, 'fire-pepper': 3 }, m: { demonEssence: 10 }, g: 50, dur: 8, eff: 'Triple damage for 8 seconds.' },
  timestop: { name: 'Time Stop Flask', tier: 3, c: { 'crystal-bloom': 1, 'frost-berry': 3 }, m: { wispDust: 10 }, g: 50, dur: 4, eff: 'Every enemy freezes for 4 seconds.' },
  invincible: { name: 'Invincibility Draught', tier: 3, c: { 'ironbark-root': 1, 'iron-vine': 2, 'wheat': 1 }, m: { boneFragments: 10 }, g: 50, dur: 5, eff: 'Take no damage for 5 seconds.' },
  phoenix: { name: 'Phoenix Draught', tier: 3, c: { 'life-tree-sapling': 1, 'healing-herb': 3 }, m: { slimeGel: 10 }, g: 75, dur: 0, eff: 'Revive once at 50% HP. Works straight from the belt.' },
  void: { name: 'Void Elixir', tier: 3, c: { 'void-blossom': 1, 'shadow-mushroom': 2, 'glow-moss': 1 }, m: { demonEssence: 10, wispDust: 5 }, g: 75, dur: 10, eff: 'All weapon effects doubled for 10 seconds.' },
  magnet: { name: 'Mega Magnet', tier: 3, c: { 'glow-moss': 3, 'wheat': 2, 'pep-root': 1 }, m: { sporeDust: 10 }, g: 30, dur: 0, eff: 'Pulls in every drop on screen.' }
};
const BELT_KEYS = ['Q', 'E', 'R'];
function beltSlots() { return bld.alchemy >= 2 ? 3 : 2; }
function potency() { return bld.alchemy >= 3 ? 1.25 : 1; }
function chestCount() { return potionChest.length; }
// Add a potion: onto a matching belt stack, else an empty belt slot, else the chest (once the Alchemy Lab exists).
function stowPotion(id) {
  const n = beltSlots();
  for (let i = 0; i < n; i++) if (belt[i] && belt[i].id === id) { belt[i].n++; return 'belt'; }
  for (let i = 0; i < n; i++) if (!belt[i]) { belt[i] = { id, n: 1 }; return 'belt'; }
  if (bld.alchemy && potionChest.length < 10) { potionChest.push(id); return 'chest'; }
  return null;
}

// ─── Training ───
const TRAIN = [
  { id: 'hp', lab: 'HP', icon: 'Vitality' }, { id: 'power', lab: 'POWER', icon: 'Power' }, { id: 'speed', lab: 'SPEED', icon: 'Swiftness' },
  { id: 'crit', lab: 'CRIT', icon: 'Precision' }, { id: 'armor', lab: 'ARMOR', icon: 'Armor' }, { id: 'fire', lab: 'FIRE RATE', icon: 'Rapid Fire' }, { id: 'luck', lab: 'LUCK', icon: 'Luck' }
];
const TRAIN_CAP = [0, 15, 30, 50];
function trainGain() { return bld.training >= 3 ? 4 : 3; }
function applyTraining(id, v) {
  const base = classStats(selectedCharId), f = v / 100;
  if (id === 'hp') { const add = Math.round(base.maxHp * f); player.maxHp += add; player.hp += add; }
  else if (id === 'power') player.powerBonus = (player.powerBonus || 0) + f;
  else if (id === 'speed') player.speed += base.speed * f;
  else if (id === 'crit') player.critChance += f;
  else if (id === 'armor') player.armor = Math.min(0.75, player.armor + f);
  else if (id === 'fire') player.attackInterval /= 1 + f;
  trained[id] = (trained[id] || 0) + v;
}
// Luck shifts the card rarity odds (design table at 0 / 15 / 30 / 50%).
const LUCK_TABLE = [[0, [60, 25, 12, 3]], [15, [48, 30, 16, 6]], [30, [36, 33, 21, 10]], [50, [20, 35, 28, 17]]];
function rarityOdds(luck) {
  const l = Math.max(0, Math.min(50, luck === undefined ? (trained.luck || 0) : luck));
  for (let i = 0; i < LUCK_TABLE.length - 1; i++) {
    const [a, wa] = LUCK_TABLE[i], [b, wb] = LUCK_TABLE[i + 1];
    if (l <= b) { const k = (l - a) / (b - a); const w = wa.map((x, j) => Math.round(x + (wb[j] - x) * k)); w[0] = 100 - w[1] - w[2] - w[3]; return w; }
  }
  return LUCK_TABLE[3][1];
}

// ─── Shrine ───
const BLESSINGS = [
  { id: 'thorns', name: 'Thorns', icon: 'Thorns', eff: 'Enemies next to you take 8 damage a second' },
  { id: 'vampirism', name: 'Vampirism', icon: 'Vampirism', eff: '2% lifesteal on all damage' },
  { id: 'guardian', name: 'Guardian', icon: 'Guardian', eff: 'A shield soaks the first hit each round (20% max HP)' },
  { id: 'resilience', name: 'Resilience', icon: 'Resilience', eff: 'No single hit takes more than 12% max HP' },
  { id: 'swiftness', name: 'Swiftness', icon: 'Swiftness (blessing)', eff: '+12% move speed' },
  { id: 'fortune', name: 'Fortune', icon: 'Fortune (blessing)', eff: '+30% gold and material drops' },
  { id: 'wrath', name: 'Wrath', icon: 'Wrath', eff: '+1% damage per second in a fight; resets each round' },
  { id: 'renewal', name: 'Renewal', icon: 'Renewal', eff: 'Regenerate 1% max HP a second' },
  { id: 'echo', name: 'Echo', icon: 'Echo', eff: '10% chance any attack fires twice' }
];
const BLESS = Object.fromEntries(BLESSINGS.map(b => [b.id, b]));
function shrineSlots() { return bld.shrine || 0; }
function shrineRerolls() { return Math.max(0, (bld.shrine || 0) - 1); }
function offeringCost() { return bld.shrine >= 3 ? { g: 15, any: 5 } : { g: 30, any: 10 }; }

// ─── Barn ───
const ANIMALS = [
  { id: 'chickens', name: 'Chickens', y: [2, 5, 9], unit: 'seeds a round', art: 'chicken' },
  { id: 'cows', name: 'Cows', y: [5, 12, 20], unit: 'random materials', art: 'cow' },
  { id: 'pigs', name: 'Pigs', y: [25, 60, 100], unit: 'gold', art: 'pig' },
  { id: 'goats', name: 'Goats', y: [3, 7, 12], unit: 'materials you choose', art: 'goat' },
  { id: 'bees', name: 'Bees', y: [3, 7, 12], unit: 'Spore Dust' },
  { id: 'dogs', name: 'Dogs', y: [1, 2, 3], unit: 'combat companions' }
];
const ANIMAL = Object.fromEntries(ANIMALS.map(a => [a.id, a]));
const ANIMAL_PRICE = 150;   // proposed in the design (not set yet)
function animalSellPrice() { return Math.round(BUILDINGS.barn.tiers[Math.max(0, bld.barn - 1)].cost.g / 2); }
function animalCount(id) { return barnStalls.filter(a => a === id).length; }
function animalYield(id) { const n = animalCount(id); return n ? ANIMAL[id].y[Math.min(3, n) - 1] : 0; }

// ─── Arena ───
const MUTATORS = [
  { id: 'swarm', name: 'Swarm', eff: '+40% spawn rate', t: 1 }, { id: 'haste', name: 'Haste', eff: 'Enemies 25% faster', t: 1 },
  { id: 'toughHide', name: 'Tough Hide', eff: 'Enemies +30% HP', t: 1 }, { id: 'fog', name: 'Fog of War', eff: 'Vision -40%', t: 1 },
  { id: 'noRegen', name: 'No Regen', eff: 'No HP regen', t: 1 },
  { id: 'berserkers', name: 'Berserkers', eff: 'Enemies +40% damage', t: 2 }, { id: 'shielded', name: 'Shielded', eff: 'Every 5th enemy shielded', t: 2 },
  { id: 'drought', name: 'Drought', eff: 'No potions', t: 2 }, { id: 'gravity', name: 'Gravity Well', eff: 'You move 20% slower', t: 2 },
  { id: 'thorned', name: 'Thorned', eff: 'Hits make you bleed', t: 2 },
  { id: 'ironWill', name: 'Iron Will', eff: 'Boss HP doubled', t: 3 }, { id: 'darkness', name: 'Darkness', eff: 'Screen slowly dims', t: 3 },
  { id: 'mirror', name: 'Mirror', eff: 'Enemies reflect 10%', t: 3 }, { id: 'frenzy', name: 'Frenzy', eff: 'Spawns double late', t: 3 },
  { id: 'cursed', name: 'Cursed', eff: 'A weapon is disabled', t: 3 }
];
const MUT = Object.fromEntries(MUTATORS.map(m => [m.id, m]));
const ARENA_REWARD = [0, 50, 125, 225];
function arenaReward(n) { return ARENA_REWARD[Math.min(3, n === undefined ? roundMuts.length : n)]; }

// ─── Run state ───
let bld, forge, belt, potionChest, blessings, shrineOffer, trained, trainedRound, barnStalls, goatPick, arenaPicks;
let roundMuts = [], cursedWpn = null, dogs = [], yieldRound = 1, roundBonus = null, hitCtx = null, mirrorAcc = 0, thornsT = 0, cannonStrikes = [], spawnCount = 0;
function initBuildings() {
  bld = { forge: 0, alchemy: 0, training: 0, shrine: 0, barn: 0, arena: 0 };
  forge = { owned: {}, mods: {}, evo: {}, equip: [] };
  belt = [null, null, null]; potionChest = [];
  blessings = []; shrineOffer = null;
  trained = {}; trainedRound = 0;
  barnStalls = []; goatPick = 'slimeGel'; arenaPicks = [];
  roundMuts = []; cursedWpn = null; dogs = []; yieldRound = 1; roundBonus = null;
}

// ─── Costs: { g: gold, m: { material: n }, c: { crop: n }, any: n materials of any kind } ───
function spareMats() { return Object.keys(MATERIALS).filter(k => k !== 'golemCore').reduce((a, k) => a + (materials[k] || 0), 0); }
function canPay(c) {
  if (coins < (c.g || 0)) return false;
  for (const k in c.m || {}) if ((materials[k] || 0) < c.m[k]) return false;
  for (const k in c.c || {}) if ((harvestBin[k] || 0) < c.c[k]) return false;
  if (c.any) { let left = spareMats(); for (const k in c.m || {}) if (k !== 'golemCore') left -= c.m[k]; if (left < c.any) return false; }
  return true;
}
function pay(c) {
  coins -= c.g || 0;
  for (const k in c.m || {}) materials[k] -= c.m[k];
  for (const k in c.c || {}) harvestBin[k] -= c.c[k];
  for (let n = c.any || 0; n > 0; n--) {   // take from whatever you hold most of
    let best = null; for (const k of Object.keys(MATERIALS)) if (k !== 'golemCore' && (materials[k] || 0) > 0 && (!best || materials[k] > materials[best])) best = k;
    if (!best) break; materials[best]--;
  }
}
function costHtml(c, big) {
  const s = big ? 2 : 2, out = [];
  if (c.g) out.push('<span class="' + (coins < c.g ? 'short' : '') + '">' + icon('Gold', s) + c.g + 'G</span>');
  for (const k in c.m || {}) out.push('<span class="' + ((materials[k] || 0) < c.m[k] ? 'short' : '') + '" title="' + MATERIALS[k].name + '">' + icon(MATERIALS[k].name, s) + c.m[k] + '</span>');
  for (const k in c.c || {}) out.push('<span class="' + ((harvestBin[k] || 0) < c.c[k] ? 'short' : '') + '" title="' + cropName(k) + '">' + icon(cropName(k), s) + c.c[k] + '</span>');
  if (c.any) out.push('<span class="' + (spareMats() < c.any ? 'short' : '') + '">' + c.any + ' ANY MATERIALS</span>');
  return '<span class="cost">' + out.join('') + '</span>';
}
function needText(c) {
  const miss = [];
  if (coins < (c.g || 0)) miss.push((c.g - coins) + ' GOLD');
  for (const k in c.m || {}) if ((materials[k] || 0) < c.m[k]) miss.push((c.m[k] - (materials[k] || 0)) + ' ' + MATERIALS[k].name.toUpperCase());
  for (const k in c.c || {}) if ((harvestBin[k] || 0) < c.c[k]) miss.push((c.c[k] - (harvestBin[k] || 0)) + ' ' + cropName(k).toUpperCase());
  if (c.any && spareMats() < c.any) miss.push('MORE MATERIALS');
  return 'NEED ' + (miss.join(', ') || 'MORE');
}

// ─── Forge actions ───
function syncWeapons() {
  if (!player) return;
  player.weapons = {}; player.evolvedWeapons = {}; player.altEvo = {};
  for (const wid of forge.equip.slice(0, weaponSlotsOpen())) {
    player.weapons[wid] = forge.owned[wid];
    if (forge.evo[wid] === 'main') player.evolvedWeapons[wid] = true;
    if (forge.evo[wid] === 'alt') player.altEvo[wid] = true;
  }
  updateSynergy();
}
function weaponMod(wid) { return forge && forge.mods[wid] || null; }
function levelCost(wid) { const lv = forge.owned[wid], lc = LEVEL_COST[lv]; if (!lc) return null; const c = { g: lc.g, m: { [SIG[wid]]: lc.n } }; if (lc.core) c.m.golemCore = lc.core; return c; }

// ─── What the buildings, potions, blessings and mutators change in a fight (called from combat.js) ───
function bOn(id) { return !!(player.buffs && player.buffs[id] > 0); }
function blessed(id) { return blessings && blessings.includes(id); }
function mut(id) { return roundMuts.includes(id); }
function extraDamageMult() {
  const p = potency(); let m = 1;
  if (bOn('power')) m *= 1 + 0.2 * p;
  if (bOn('berserk')) m *= 1 + 0.25 * p;
  if (bOn('vampiric')) m *= 1 + 0.15 * p;
  if (bOn('rage')) m *= 3;
  if (blessed('wrath')) m *= 1 + 0.01 * player.aliveT;
  return m;
}
function extraCrit() { const p = potency(); return (bOn('focus') ? 0.15 * p : 0) + (bOn('shadow') ? 0.2 * p : 0); }
function critMultNow() { return bOn('shadow') ? Math.max(3, player.critMult) : player.critMult; }
function extraArmor() { const p = potency(); return (bOn('iron') ? 0.2 * p : 0) + (bOn('stoneskin') ? 0.35 * p : 0) - (bOn('berserk') ? 0.15 : 0); }
function extraDodge() { return bOn('ghost') ? 0.15 * potency() : 0; }
function extraSpeedMult() {
  const p = potency(); let m = 1;
  if (bOn('speed')) m *= 1 + 0.25 * p;
  if (bOn('ghost')) m *= 1 + 0.2 * p;
  if (blessed('swiftness')) m *= 1.12;
  if (mut('gravity')) m *= 0.8;
  return m;
}
function extraAtkSpeed() { const p = potency(); return (bOn('berserk') ? 1 + 0.25 * p : 1) * (bOn('storm') ? 1 + 0.3 * p : 1); }
function extraRegen() { return blessed('renewal') ? player.maxHp * 0.01 : 0; }
function lifesteal() { return (blessed('vampirism') ? 0.02 : 0) + (bOn('vampiric') ? 0.05 * potency() : 0); }
function gainMult() { return bOn('moon') ? 1 + 0.3 * potency() : 1; }
function lootMult() { return player.goldMult * (blessed('fortune') ? 1.3 : 1) * gainMult(); }
function hitCap() { let c = Infinity; if (blessed('resilience')) c = player.maxHp * 0.12; if (bOn('stoneskin')) c = Math.min(c, player.maxHp * 0.10); return c; }
function echoChance() { return (cropIs('echo-bloom') ? 0.1 : 0) + (blessed('echo') ? 0.1 : 0); }
function enemyMods(tier) {
  const m = { hp: 1, spd: 1, dmg: 1 };
  if (mut('toughHide')) m.hp *= 1.3;
  if (mut('ironWill') && tier) m.hp *= 2;
  if (mut('haste')) m.spd *= 1.25;
  if (mut('berserkers')) m.dmg *= 1.4;
  return m;
}
function spawnRateMult() {
  let m = 1;
  if (mut('swarm')) m *= 1.4;
  if (mut('frenzy') && gameTime >= MINIBOSS_AT - 30 && gameTime < MINIBOSS_AT) m *= 2;
  return m;
}
// Called from hitEnemy after the damage lands.
function onHitEffects(e, d) {
  const ls = lifesteal(); if (ls > 0) player.hp = Math.min(player.maxHp, player.hp + d * ls);
  if (mut('mirror')) mirrorAcc += d * 0.1;
  if (hitCtx === 'base') {
    if (bOn('frost')) { e.slowT = Math.max(e.slowT, 1); e.slowF = Math.min(e.slowF, 1 - 0.15 * potency()); }
    if (bOn('storm') && Math.random() < 0.15) { const h = hitCtx; hitCtx = null; chainLightning(e, 2, d * 0.3, new Set([e])); hitCtx = h; }
  } else if (hitCtx && WEAPONS[hitCtx]) {
    const mod = weaponMod(hitCtx);
    if (mod === 'siphon') player.hp = Math.min(player.maxHp, player.hp + d * 0.03);
    if (mod === 'chill') { e.slowT = Math.max(e.slowT, 0.8); e.slowF = Math.min(e.slowF, 0.7); }
    if (mod === 'eruption' && e.hp <= 0) {
      const h = hitCtx; hitCtx = null;
      rings.push({ x: e.x, y: e.y, r0: 4, r1: 22, t: 0, dur: 0.25, color: '#f08a2a' });
      for (const o of enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 22 + o.r) hitEnemy(o, Math.round(d * 0.4), false, e);
      hitCtx = h;
    }
  }
}
// Shield (Shielded mutator) blocks one hit.
function shieldBlocks(e) {
  if (!e.shield) return false;
  e.shield = false; addFloatingText(e.x, e.y - e.art.frame[1] * 0.7, 'BLOCK', false, '#8ccaf2'); return true;
}
// Called from damagePlayer. Returns the damage after shields and caps, or -1 if nothing lands.
function playerHitFilter(d) {
  if (bOn('invincible')) return -1;
  if (player.shield > 0) { player.shield = 0; addFloatingText(player.x, player.y - 46, 'SHIELD', false, '#5fe0c8'); player.invT = 0.4; return -1; }
  d = Math.min(d, hitCap());
  if (mut('thorned')) player.bleedT = 3;
  return d;
}
function tryPhoenix() {
  let i = belt.findIndex(b => b && b.id === 'phoenix');
  if (!player.phoenixArmed && i < 0) return false;
  if (player.phoenixArmed) player.phoenixArmed = false; else { belt[i].n--; if (belt[i].n <= 0) belt[i] = null; }
  player.hp = Math.round(player.maxHp * 0.5); player.invT = 2;
  addFx('combat', 'level-up-burst', player.x, player.y + 6, { anchor: 'feet', follow: player });
  showNotification('PHOENIX DRAUGHT · BACK ON YOUR FEET', '#ffcc44');
  return true;
}
// Per-frame extras for the hero: buff timers, thorns, bleed, mirror.
function updateBuildingEffects(dt) {
  for (const k in player.buffs) if (player.buffs[k] > 0) player.buffs[k] -= dt;
  if (bOn('cleanse')) { player.slowT = 0; player.stunT = 0; player.dreadT = 0; }
  if (player.bleedT > 0) { player.bleedT -= dt; player.hp -= player.maxHp * 0.015 * dt; }
  if (blessed('thorns')) {
    thornsT -= dt;
    if (thornsT <= 0) { thornsT = 1; for (const e of enemies) if (!e.dead && e.spawnT >= SPAWN_DUR && dist(e, player) < e.r + 16) hitEnemy(e, 8, false, player); }
  }
  if (mirrorAcc >= 1) { const d = Math.floor(mirrorAcc); mirrorAcc -= d; player.hp -= d; }
  if (player.hp <= 0 && state === 'playing' && !tryPhoenix()) { player.hp = 0; startDying(); }
  updateDogs(dt);
}
// ─── Potions in a fight (Q / E / R) ───
function drinkPotion(i) {
  const b = belt[i]; if (!b || i >= beltSlots() || state !== 'playing') return;
  if (mut('drought')) { showNotification('DROUGHT · NO POTIONS THIS ROUND', '#ff8a70'); return; }
  const P = POTIONS[b.id], p = potency();
  b.n--; if (b.n <= 0) belt[i] = null;
  if (b.id === 'heal') { player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.25 * p)); addFx('combat', 'heal', player.x, player.y, { anchor: 'feet', follow: player }); }
  else if (b.id === 'timestop') { for (const e of enemies) e.stunT = Math.max(e.stunT, 4 * p); rings.push({ x: player.x, y: player.y, r0: 6, r1: 120, t: 0, dur: 0.5, color: '#8ccaf2' }); }
  else if (b.id === 'invincible') { player.buffs.invincible = 5 * p; player.invT = Math.max(player.invT, 5 * p); }
  else if (b.id === 'phoenix') player.phoenixArmed = true;
  else if (b.id === 'magnet') { for (const pk of pickups) { collect(pk); pk.taken = true; } pickups = []; }
  else if (b.id === 'cleanse') { player.buffs.cleanse = 15 * p; player.slowT = 0; player.stunT = 0; player.dreadT = 0; player.bleedT = 0; }
  else player.buffs[b.id] = P.dur;
  showNotification(P.name.toUpperCase(), '#8fe07a');
}

// ─── Round start and end ───
function onRoundStart() {
  player.buffs = {}; player.shield = blessed('guardian') ? Math.round(player.maxHp * 0.2) : 0; player.bleedT = 0; player.phoenixArmed = false;
  roundMuts = arenaPicks.filter(id => MUT[id].t <= bld.arena).slice(0, bld.arena);
  mirrorAcc = 0; thornsT = 1; cannonStrikes = []; spawnCount = 0;
  syncWeapons();
  cursedWpn = null;
  if (mut('cursed')) { const eq = Object.keys(player.weapons); if (eq.length) cursedWpn = pick(eq); }
  const nd = animalCount('dogs');
  dogs = [];
  for (let i = 0; i < nd; i++) dogs.push({ x: player.x + DOG_SPOTS[i][0], y: player.y + DOG_SPOTS[i][1], hp: Math.round(player.maxHp * 0.4), maxHp: Math.round(player.maxHp * 0.4), ko: false, t: Math.random(), biteT: 0, bite: null, view: 'front', flip: false, moving: false });
}
// Arena rewards on top of what was picked up this round.
function onRoundEnd() {
  roundBonus = null;
  const pct = arenaReward();
  if (!pct) return;
  const g = Math.round(roundCoins * pct / 100), mats = {};
  coins += g; runStats.gold += g;
  for (const k in roundMats) { const n = Math.round(roundMats[k] * pct / 100); if (n) { mats[k] = n; materials[k] += n; } }
  let core = false;
  if (roundMuts.length >= 3) { materials.golemCore++; runStats.cores++; core = true; }
  roundBonus = { pct, g, mats, core, muts: roundMuts.slice() };
}
// Barn yields, once for every round that has passed since the last visit.
function collectYields() {
  const out = [];
  for (; yieldRound < currentRound; yieldRound++) {
    for (const a of ANIMALS) {
      const y = animalYield(a.id); if (!y || a.id === 'dogs') continue;
      if (a.id === 'chickens') {
        const pool = Object.keys(CROPS).filter(k => CROPS[k].tier === 'QUICK' || currentRound >= 6);
        for (let i = 0; i < y; i++) { const k = pick(pool); if (seedBag[k] || Object.keys(seedBag).filter(x => seedBag[x] > 0).length < 12) seedBag[k] = (seedBag[k] || 0) + 1; }
        out.push('+' + y + ' SEEDS');
      } else if (a.id === 'cows') { const keys = Object.keys(MATERIALS).filter(k => k !== 'golemCore'); for (let i = 0; i < y; i++) materials[pick(keys)]++; out.push('+' + y + ' MATERIALS'); }
      else if (a.id === 'pigs') { coins += y; out.push('+' + y + ' GOLD'); }
      else if (a.id === 'goats') { materials[goatPick] += y; out.push('+' + y + ' ' + MATERIALS[goatPick].name.toUpperCase()); }
      else if (a.id === 'bees') { materials.sporeDust += y; out.push('+' + y + ' SPORE DUST'); }
    }
  }
  return out;
}

// ─── Dogs: the one animal that fights (barn) ───
const DOG_SPOTS = [[-28, 4], [28, 4], [0, 22]];   // where they wait beside the hero
function dogDps() { const n = dogs.length; return n ? player.damage / player.attackInterval * [0.05, 0.075, 0.1][Math.min(3, n) - 1] : 0; }
function updateDogs(dt) {
  for (const d of dogs) {
    d.t += dt;
    if (d.ko) continue;
    if (d.bite) { d.bite.t += dt; if (d.bite.t >= stripDur('combat', 'dog-bite-side')) d.bite = null; }
    d.biteT -= dt;
    let tgt = null, bd = 90;
    for (const e of enemies) { if (e.dead || e.spawnT < SPAWN_DUR || e.phased || e.hidden) continue; const dd = Math.hypot(e.x - player.x, e.y - player.y); if (dd < bd) { bd = dd; tgt = e; } }
    let tx, ty;
    if (tgt) { tx = tgt.x; ty = tgt.y; } else { const o = DOG_SPOTS[dogs.indexOf(d) % 3]; tx = player.x + o[0]; ty = player.y + o[1]; }
    const dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy), reach = tgt ? tgt.r + 8 : 6;
    d.moving = dd > reach;
    if (d.moving) { const sp = player.speed * 1.15 * dt, k = Math.min(1, sp / dd); d.x += dx * k; d.y += dy * k; }
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) { d.view = viewFrom(dx, dy); if (d.view === 'side') d.flip = dx < 0; }
    if (tgt && !d.moving && d.biteT <= 0) {
      d.biteT = 1; d.bite = { t: 0 };
      const h = hitCtx; hitCtx = 'dog'; hitEnemy(tgt, Math.max(1, Math.round(dogDps())), false, d); hitCtx = h;
      if (dogs.length >= 3) tgt.stunT = Math.max(tgt.stunT, 0.3);
    }
    for (const e of enemies) if (!e.dead && e.dmg > 0 && e.spawnT >= SPAWN_DUR && Math.hypot(e.x - d.x, e.y - d.y) < e.r + 6) d.hp -= e.dmg * 0.6 * dt;
    if (d.hp <= 0) { d.ko = true; d.hp = 0; showNotification('A DOG IS KNOCKED OUT · BACK NEXT ROUND', '#ff8a70'); }
  }
}
function drawDog(d) {
  const p = worldToCanvas(d.x, d.y);
  if (!onScreen(p, 30)) return;
  drawShadow(p.x, p.y, 16, false);
  if (d.ko) { drawStrip('combat', 'dog-knocked-out', 0, p.x, p.y + 2, { anchor: 'feet', flip: d.flip }); return; }
  const key = (d.bite ? 'dog-bite-' : 'dog-walk-') + d.view;
  const i = d.bite ? playStrip('combat', key, d.bite.t, false) : d.moving ? playStrip('combat', key, d.t, true) : 0;
  drawStrip('combat', key, i, p.x, p.y + 2, { anchor: 'feet', flip: d.view === 'side' && d.flip });
}
// Fog of War and Darkness (arena mutators).
function drawMutatorOverlay() {
  if (!roundMuts.length) return;
  const p = worldToCanvas(player.x, player.y - 16);
  if (mut('fog')) {
    // stepped rings rather than a smooth gradient, so the edge stays pixel-hard
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W(), H()); ctx.ellipse(p.x, p.y, 78 + i * 12, 60 + i * 9, 0, 0, TAU, true);
      ctx.fillStyle = 'rgba(18,22,30,' + (0.28 + i * 0.0) + ')'; ctx.fill('evenodd'); ctx.restore();
    }
  }
  if (mut('darkness')) { ctx.fillStyle = 'rgba(6,4,12,' + Math.min(0.72, gameTime / MINIBOSS_AT * 0.72).toFixed(2) + ')'; ctx.fillRect(0, 0, W(), H()); }
}
