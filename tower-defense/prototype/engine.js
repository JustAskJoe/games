/* Tower Defense (working title) — Prototype 1 engine.
   © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
   Pure game logic, no DOM. Runs in the browser as window.TD and in node (sim.js).
   Fixed-step simulation (20 ticks/sec). One map whose path grows twice. */
(function (root) {
  'use strict';
  const TICK = 1 / 20; // seconds per tick

  // ---------- seeded RNG ----------
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    next.int = (n) => Math.floor(next() * n);
    next.pick = (a) => a[next.int(a.length)];
    return next;
  }

  // ---------- map: 12 cols x 8 rows; the path grows in three stages ----------
  const COLS = 12, ROWS = 8;
  // stage 0: enemies walk from the left edge to the keep's old gate at (5,3)
  // stage 1: the path extends and the keep moves out; stage 2 again. Enemies always walk toward the LAST cell.
  const PATHS = [
    [[0, 3], [1, 3], [2, 3], [2, 2], [3, 2], [4, 2], [4, 3], [5, 3]],
    [[5, 4], [5, 5], [6, 5], [7, 5], [8, 5], [8, 4], [8, 3]],
    [[9, 3], [9, 2], [10, 2], [11, 2], [11, 3], [11, 4]],
  ];
  const SPOTS = [
    [[1, 2], [3, 3], [3, 1], [5, 2]],
    [[6, 4], [7, 6], [9, 4]],
    [[10, 3], [9, 1], [10, 5]],
  ];
  function pathUpTo(stage) { return PATHS.slice(0, stage + 1).flat(); }
  function spotsUpTo(stage) { return SPOTS.slice(0, stage + 1).flat(); }
  function keepCell(stage) { const p = PATHS[stage]; return p[p.length - 1]; }

  // ---------- towers ----------
  // Each tower has two upgrade branches (A/B). Upgrading picks one; tier 2 = that branch.
  const TOWERS = {
    arrow: { name: 'Arrow', cost: 60, range: 2.8, rate: 1.4, dmg: 13, color: '#B8873A', hit: 'single',
      desc: 'Steady single-target shots. Cheap and reliable.',
      up: { A: { name: 'Pierce', cost: 70, desc: 'Arrows pass through, hitting up to 3 enemies in a line.', dmg: 15, pierce: 3 },
            B: { name: 'Multishot', cost: 70, desc: 'Fires twice as fast.', rate: 2.8, dmg: 11 } } },
    cannon: { name: 'Cannon', cost: 90, range: 2.4, rate: 0.55, dmg: 30, color: '#6B5B7A', hit: 'splash', splash: 0.9,
      desc: 'Slow, heavy splash damage. Great against packs. Can\'t hit flyers.', ground: true,
      up: { A: { name: 'Big Shot', cost: 90, desc: 'Much bigger blast radius.', splash: 1.5, dmg: 34 },
            B: { name: 'Siege', cost: 90, desc: 'Double damage to armored enemies.', armorMul: 2, dmg: 32 } } },
    spark: { name: 'Spark', cost: 85, range: 2.6, rate: 1.0, dmg: 16, color: '#4F8FD6', hit: 'chain', chain: 3,
      desc: 'Chain lightning jumps between enemies. Strong against flyers.', vsFlying: 1.6,
      up: { A: { name: 'Storm', cost: 80, desc: 'Chains to 5 enemies.', chain: 5 },
            B: { name: 'Overload', cost: 80, desc: 'Each jump does full damage, not less.', decay: 1 } } },
    frost: { name: 'Frost', cost: 70, range: 2.4, rate: 0.9, dmg: 6, color: '#8FC8D8', hit: 'splash', splash: 1.0, slow: 0.45, slowT: 1.6,
      desc: 'Slows everything it touches so other towers get more shots.',
      up: { A: { name: 'Deep Freeze', cost: 75, desc: 'Slows much harder, for longer.', slow: 0.65, slowT: 2.4 },
            B: { name: 'Shatter', cost: 75, desc: 'Slowed enemies take 30% more damage from everything.', brittle: 1.3 } } },
  };
  const SELL_RATE = 0.7;

  // ---------- enemies ----------
  const ENEMIES = {
    grunt:  { name: 'Grunt',  hp: 40,  speed: 1.2, bounty: 6,  leak: 1, color: '#8C6D4F' },
    runner: { name: 'Runner', hp: 22,  speed: 2.1, bounty: 5,  leak: 1, color: '#D9A441' },
    flyer:  { name: 'Flyer',  hp: 30,  speed: 1.4, bounty: 7,  leak: 1, color: '#9FB7E8', flying: true },
    brute:  { name: 'Brute',  hp: 140, speed: 0.85, bounty: 16, leak: 2, color: '#5E6B73', armor: 4 },
    boss:   { name: 'Warlord', hp: 1100, speed: 0.7, bounty: 80, leak: 5, color: '#A3382E', armor: 6, boss: true },
  };

  // ---------- waves (10) ----------
  // each: list of [type, count, gap seconds]; groups run in sequence. stage: which path stage must be unlocked BEFORE the wave.
  const WAVES = [
    { stage: 0, groups: [['grunt', 6, 1.4]] },
    { stage: 0, groups: [['grunt', 8, 1.0], ['runner', 4, 0.8]] },
    { stage: 0, groups: [['runner', 8, 0.6], ['grunt', 6, 0.9]] },
    { stage: 1, groups: [['grunt', 10, 0.7], ['flyer', 4, 0.9]] },            // path grows before wave 4
    { stage: 1, groups: [['brute', 2, 2.0], ['grunt', 10, 0.6]] },
    { stage: 1, groups: [['flyer', 8, 0.6], ['runner', 10, 0.45]] },
    { stage: 2, groups: [['grunt', 14, 0.5], ['brute', 3, 1.8]] },            // path grows before wave 7
    { stage: 2, groups: [['runner', 14, 0.4], ['flyer', 8, 0.6], ['brute', 2, 2]] },
    { stage: 2, groups: [['brute', 5, 1.4], ['flyer', 10, 0.5], ['grunt', 12, 0.5]] },
    { stage: 2, groups: [['grunt', 10, 0.5], ['boss', 1, 0], ['runner', 10, 0.4]] },
  ];
  let SCALE = 0.5, BOUNTY_MUL = 0.8, BONUS_MUL = 0.8, SPEED = 0.1; // tuned 2026-10-19: smart bot ~63% wins, random ~29%
  const HP_SCALE = (w) => 1 + w * SCALE; // enemy hp grows per wave index

  // ---------- cards (drafted after each wave; 3 offered, pick 1) ----------
  const CARDS = [
    { id: 'sharp', name: 'Sharpened Steel', text: '+15% damage for all Arrow towers.', kind: 'buff', apply: (G) => { G.mods.arrowDmg *= 1.15; } },
    { id: 'powder', name: 'Black Powder', text: '+20% Cannon damage.', kind: 'buff', apply: (G) => { G.mods.cannonDmg *= 1.2; } },
    { id: 'rod', name: 'Copper Rods', text: 'Spark chains one extra enemy.', kind: 'buff', apply: (G) => { G.mods.sparkChain += 1; } },
    { id: 'rime', name: 'Rime', text: 'Frost slows last 50% longer.', kind: 'buff', apply: (G) => { G.mods.frostSlowT *= 1.5; } },
    { id: 'scope', name: 'Spyglass', text: '+12% range for every tower.', kind: 'buff', apply: (G) => { G.mods.range *= 1.12; } },
    { id: 'drill', name: 'Drill Sergeant', text: 'All towers fire 10% faster.', kind: 'buff', apply: (G) => { G.mods.rate *= 1.1; } },
    { id: 'tithe', name: 'Tithe', text: '+2 gold per kill.', kind: 'economy', apply: (G) => { G.mods.bounty += 2; } },
    { id: 'interest', name: 'Banker', text: 'Earn 5% interest on saved gold at the start of each wave (max 25).', kind: 'economy', apply: (G) => { G.mods.interest += 0.05; } },
    { id: 'levy', name: 'War Levy', text: '+40 gold now.', kind: 'economy', apply: (G) => { G.gold += 40; } },
    { id: 'mason', name: 'Guild Masons', text: 'Building and upgrading costs 15% less.', kind: 'economy', apply: (G) => { G.mods.cost *= 0.85; } },
    { id: 'walls', name: 'Stone Walls', text: 'Restore 3 health to the keep.', kind: 'keep', apply: (G) => { G.health = Math.min(G.maxHealth, G.health + 3); } },
    { id: 'rally', name: 'Rally Horn', text: 'Towers near the keep (within 2 tiles) do +25% damage.', kind: 'keep', apply: (G) => { G.mods.rally = 1.25; } },
    { id: 'fletch', name: 'Fletcher\'s Guild', text: 'Arrow towers cost half.', kind: 'economy', apply: (G) => { G.mods.arrowCost = 0.5; } },
    { id: 'frostbite', name: 'Frostbite', text: 'Slowed enemies take +15% damage.', kind: 'buff', apply: (G) => { G.mods.brittle = Math.max(G.mods.brittle, 1.15); } },
  ];

  // ---------- game state ----------
  function newGame(seed) {
    return {
      seed, rnd: rng(seed), t: 0, tick: 0,
      stage: 0, wave: 0, phase: 'build',   // build | wave | draft | won | lost
      gold: 200, health: 20, maxHealth: 20,
      towers: [], enemies: [], shots: [], nextId: 1,
      spawnQueue: [], spawnT: 0, spawnedThisWave: 0,
      mods: { arrowDmg: 1, cannonDmg: 1, sparkChain: 0, frostSlowT: 1, range: 1, rate: 1, bounty: 0, interest: 0, cost: 1, rally: 1, arrowCost: 1, brittle: 1 },
      cards: [], offer: null, stats: { kills: 0, leaks: 0, goldEarned: 0, wavesCleared: 0 },
      log: [],
      test: { used: false, invincible: false }, // tester tools; `used` marks the run so feedback and stats can ignore it
    };
  }
  const path = (G) => pathUpTo(G.stage);
  const spots = (G) => spotsUpTo(G.stage);
  const keep = (G) => keepCell(G.stage);
  function isSpot(G, c, r) { return spots(G).some(([x, y]) => x === c && y === r); }
  function towerAt(G, c, r) { return G.towers.find((t) => t.c === c && t.r === r); }

  function cost(G, type) {
    let k = TOWERS[type].cost * G.mods.cost;
    if (type === 'arrow') k *= G.mods.arrowCost;
    return Math.round(k);
  }
  function upCost(G, tw) { return Math.round(TOWERS[tw.type].up.A.cost * G.mods.cost); }
  function canBuild(G, type, c, r) { return G.phase === 'build' && isSpot(G, c, r) && !towerAt(G, c, r) && G.gold >= cost(G, type); }
  function build(G, type, c, r) {
    if (!canBuild(G, type, c, r)) return false;
    G.gold -= cost(G, type);
    G.towers.push({ id: G.nextId++, type, c, r, tier: 1, branch: null, cd: 0, kills: 0 });
    return true;
  }
  function canUpgrade(G, tw) { return G.phase === 'build' && tw.tier === 1 && G.gold >= upCost(G, tw); }
  function upgrade(G, tw, branch) {
    if (!canUpgrade(G, tw)) return false;
    G.gold -= upCost(G, tw); tw.tier = 2; tw.branch = branch; return true;
  }
  function sellValue(G, tw) { const base = TOWERS[tw.type].cost + (tw.tier === 2 ? TOWERS[tw.type].up.A.cost : 0); return Math.round(base * SELL_RATE); }
  function sell(G, tw) { if (G.phase !== 'build') return false; G.gold += sellValue(G, tw); G.towers = G.towers.filter((t) => t !== tw); return true; }

  function stats(G, tw) {
    const base = TOWERS[tw.type]; const s = Object.assign({}, base);
    if (tw.tier === 2) Object.assign(s, base.up[tw.branch]);
    s.range *= G.mods.range; s.rate *= G.mods.rate;
    if (tw.type === 'arrow') s.dmg *= G.mods.arrowDmg;
    if (tw.type === 'cannon') s.dmg *= G.mods.cannonDmg;
    if (tw.type === 'spark') s.chain += G.mods.sparkChain;
    if (tw.type === 'frost') s.slowT *= G.mods.frostSlowT;
    const k = keep(G); if (G.mods.rally > 1 && Math.abs(k[0] - tw.c) + Math.abs(k[1] - tw.r) <= 2) s.dmg *= G.mods.rally;
    return s;
  }

  // ---------- waves ----------
  function startWave(G) {
    if (G.phase !== 'build' || G.wave >= WAVES.length) return false;
    const w = WAVES[G.wave];
    if (G.mods.interest > 0) { const i = Math.min(25, Math.floor(G.gold * G.mods.interest)); G.gold += i; G.stats.goldEarned += i; }
    G.spawnQueue = [];
    let t = 0.5;
    for (const [type, n, gap] of w.groups) { for (let i = 0; i < n; i++) { G.spawnQueue.push({ type, at: t }); t += gap; } t += 1.2; }
    G.waveT = 0; G.phase = 'wave'; G.spawnedThisWave = 0; G.enemies = []; G.shots = [];
    return true;
  }
  function spawn(G, type) {
    const e = ENEMIES[type]; const p = path(G);
    const hp = Math.round(e.hp * HP_SCALE(G.wave)); const spd = e.speed * (1 + G.wave * SPEED);
    G.enemies.push({ id: G.nextId++, type, hp, maxHp: hp, speed: spd, idx: 0, prog: 0, slow: 0, slowT: 0, flying: !!e.flying, armor: e.armor || 0, dead: false, x: p[0][0], y: p[0][1] });
  }

  // position along the path as (x, y) in cell units
  function posOf(G, en) {
    const p = path(G); const a = p[Math.min(en.idx, p.length - 1)]; const b = p[Math.min(en.idx + 1, p.length - 1)];
    return [a[0] + (b[0] - a[0]) * en.prog, a[1] + (b[1] - a[1]) * en.prog];
  }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  function damage(G, en, amount, src) {
    let d = amount;
    if (en.armor) d = Math.max(1, d - en.armor * (src.armorMul ? 0 : 1)); // Siege ignores armor (via armorMul) then doubles
    if (src.armorMul && en.armor) d *= src.armorMul;
    if (en.slowT > 0 && G.mods.brittle > 1) d *= G.mods.brittle;
    if (en.slowT > 0 && src.brittle) d *= src.brittle;
    en.hp -= d;
    if (en.hp <= 0 && !en.dead) {
      en.dead = true; G.stats.kills++;
      const b = Math.round(ENEMIES[en.type].bounty * BOUNTY_MUL) + G.mods.bounty; G.gold += b; G.stats.goldEarned += b;
      if (src.tower) src.tower.kills++;
      G.events.push({ k: 'kill', id: en.id, x: en.x, y: en.y, bounty: b });
    }
  }

  function step(G) {
    G.events = [];
    if (G.phase !== 'wave') return G.events;
    G.t += TICK; G.tick++; G.waveT += TICK;
    // spawn
    while (G.spawnQueue.length && G.spawnQueue[0].at <= G.waveT) { spawn(G, G.spawnQueue.shift().type); G.spawnedThisWave++; }
    const p = path(G); const last = p.length - 1;
    // move enemies
    for (const en of G.enemies) {
      if (en.dead) continue;
      if (en.slowT > 0) en.slowT -= TICK;
      const sp = en.speed * (en.slowT > 0 ? 1 - en.slow : 1);
      en.prog += sp * TICK;
      while (en.prog >= 1 && en.idx < last) { en.prog -= 1; en.idx++; }
      if (en.idx >= last) { // reached the keep
        en.dead = true; en.leaked = true; const l = ENEMIES[en.type].leak; if (!G.test.invincible) G.health -= l; G.stats.leaks++;
        G.events.push({ k: 'leak', id: en.id, leak: l });
        if (G.health <= 0) { G.health = 0; G.phase = 'lost'; G.events.push({ k: 'lost' }); return G.events; }
      }
      [en.x, en.y] = posOf(G, en);
    }
    G.enemies = G.enemies.filter((e) => !e.dead || G.tick - (e.deadTick || (e.deadTick = G.tick)) < 6);
    // towers fire
    const alive = G.enemies.filter((e) => !e.dead);
    for (const tw of G.towers) {
      tw.cd -= TICK; if (tw.cd > 0) continue;
      const s = stats(G, tw);
      const inRange = alive.filter((e) => !(s.ground && e.flying) && dist(tw.c, tw.r, e.x, e.y) <= s.range);
      if (!inRange.length) continue;
      // target: furthest along the path
      inRange.sort((a, b) => (b.idx + b.prog) - (a.idx + a.prog));
      const tgt = inRange[0]; tw.cd = 1 / s.rate;
      const src = Object.assign({ tower: tw }, s);
      let dmg = s.dmg * (tgt.flying && s.vsFlying ? s.vsFlying : 1);
      if (s.hit === 'single') {
        if (s.pierce) { // line: the next few enemies behind the target along the path
          const line = inRange.slice(0, s.pierce); line.forEach((e) => damage(G, e, dmg, src));
          G.events.push({ k: 'shot', tw: tw.id, type: tw.type, from: [tw.c, tw.r], to: [tgt.x, tgt.y], hits: line.map((e) => e.id) });
        } else { damage(G, tgt, dmg, src); G.events.push({ k: 'shot', tw: tw.id, type: tw.type, from: [tw.c, tw.r], to: [tgt.x, tgt.y], hits: [tgt.id] }); }
      } else if (s.hit === 'splash') {
        const hits = alive.filter((e) => !(s.ground && e.flying) && dist(tgt.x, tgt.y, e.x, e.y) <= s.splash);
        for (const e of hits) { if (s.slow) { e.slow = s.slow; e.slowT = s.slowT; } damage(G, e, dmg, src); }
        G.events.push({ k: 'shot', tw: tw.id, type: tw.type, from: [tw.c, tw.r], to: [tgt.x, tgt.y], splash: s.splash, hits: hits.map((e) => e.id), frost: !!s.slow });
      } else if (s.hit === 'chain') {
        const hits = [tgt]; let cur = tgt; let d = dmg;
        for (let i = 1; i < s.chain; i++) {
          const nxt = alive.filter((e) => !hits.includes(e) && dist(cur.x, cur.y, e.x, e.y) <= 1.6).sort((a, b) => dist(cur.x, cur.y, a.x, a.y) - dist(cur.x, cur.y, b.x, b.y))[0];
          if (!nxt) break; hits.push(nxt); cur = nxt;
        }
        hits.forEach((e, i) => damage(G, e, d * (s.decay ? 1 : Math.pow(0.7, i)), src));
        G.events.push({ k: 'shot', tw: tw.id, type: tw.type, from: [tw.c, tw.r], to: [tgt.x, tgt.y], chain: hits.map((e) => [e.x, e.y]), hits: hits.map((e) => e.id) });
      }
    }
    // wave over?
    if (!G.spawnQueue.length && !G.enemies.some((e) => !e.dead)) {
      G.stats.wavesCleared++;
      const bonus = Math.round((20 + G.wave * 5) * BONUS_MUL); G.gold += bonus; G.stats.goldEarned += bonus;
      G.events.push({ k: 'waveClear', wave: G.wave, bonus });
      G.wave++;
      if (G.wave >= WAVES.length) { G.phase = 'won'; G.events.push({ k: 'won' }); }
      else { G.phase = 'draft'; G.offer = drawOffer(G); }
    }
    return G.events;
  }

  // ---------- draft ----------
  function drawOffer(G) {
    const taken = new Set(G.cards.map((c) => c.id));
    const pool = CARDS.filter((c) => !taken.has(c.id) || c.id === 'levy' || c.id === 'walls');
    const out = []; const used = new Set();
    while (out.length < 3 && pool.length) { const c = G.rnd.pick(pool); if (used.has(c.id)) continue; used.add(c.id); out.push(c); }
    return out.map((c) => c.id);
  }
  function pick(G, cardId) {
    if (G.phase !== 'draft' || !G.offer.includes(cardId)) return false;
    const c = CARDS.find((x) => x.id === cardId); c.apply(G); G.cards.push(c); G.offer = null;
    // the path grows when the next wave needs a higher stage
    const need = WAVES[G.wave].stage;
    if (need > G.stage) { G.stage = need; G.events = [{ k: 'grow', stage: G.stage }]; }
    G.phase = 'build';
    return true;
  }
  function skipDraft(G) { if (G.phase !== 'draft') return false; G.offer = null; const need = WAVES[G.wave].stage; if (need > G.stage) G.stage = need; G.phase = 'build'; return true; }

  // ---------- bot (for the sim and the coach's hints) ----------
  function nextWaveNeeds(G) {
    const w = WAVES[G.wave]; if (!w) return {};
    const n = {}; for (const [t, c] of w.groups) n[t] = (n[t] || 0) + c; return n;
  }
  function botBuild(G, style) {
    // style: 'smart' reads the wave preview and builds counters; 'saver' keeps a reserve; 'random' is a sloppy player.
    let guard = 0;
    while (guard++ < 14) {
      const free = spots(G).filter(([c, r]) => !towerAt(G, c, r));
      const reserve = style === 'saver' && G.towers.length >= 3 ? 50 : 0;
      const need = nextWaveNeeds(G);
      const has = (t) => G.towers.filter((x) => x.type === t).length;
      let type;
      if (style === 'random') type = G.rnd.pick(Object.keys(TOWERS));
      else if ((need.brute || need.boss) && has('cannon') < 1 + (need.boss ? 1 : 0)) type = 'cannon';
      else if (need.flyer && has('spark') < 1 + (need.flyer > 6 ? 1 : 0)) type = 'spark';
      else if (G.towers.length >= 2 && has('frost') < 1) type = 'frost';
      else if (G.towers.length >= 5 && has('cannon') < 2) type = 'cannon';
      else type = 'arrow';
      const up = G.towers.find((t) => t.tier === 1 && G.gold - reserve >= upCost(G, t));
      if (up && (!free.length || (G.towers.length >= 4 && G.rnd() < 0.5))) {
        const br = up.type === 'cannon' && (need.brute || need.boss) ? 'B' : (up.type === 'spark' ? 'A' : (G.rnd() < 0.5 ? 'A' : 'B'));
        upgrade(G, up, br); continue;
      }
      if (!free.length) break;
      if (G.gold - reserve < cost(G, type)) { if (type !== 'arrow' && G.gold - reserve >= cost(G, 'arrow') && G.towers.length < 2) type = 'arrow'; else break; }
      const p = path(G);
      const score = ([c, r]) => p.filter(([x, y]) => dist(c, r, x, y) <= TOWERS[type].range).length + (style === 'random' ? G.rnd() * 5 : 0);
      free.sort((a, b) => score(b) - score(a));
      build(G, type, free[0][0], free[0][1]);
    }
  }
  function botPick(G) { const o = G.offer; const prefer = ['scope', 'drill', 'sharp', 'tithe', 'rod', 'rime', 'powder', 'mason', 'frostbite', 'rally', 'interest', 'fletch', 'levy', 'walls']; return o.slice().sort((a, b) => prefer.indexOf(a) - prefer.indexOf(b))[0]; }

  function playOut(G, style) {
    let guard = 0;
    while (G.phase !== 'won' && G.phase !== 'lost' && guard++ < 200000) {
      if (G.phase === 'build') { botBuild(G, style); startWave(G); }
      else if (G.phase === 'wave') step(G);
      else if (G.phase === 'draft') pick(G, botPick(G));
    }
    return G;
  }
  function simulate(n, seed, style) {
    const res = { n, wins: 0, waves: [], health: [], gold: [], leaks: 0, cards: {} };
    for (let i = 0; i < n; i++) {
      const G = playOut(newGame(seed + i * 7919), style);
      if (G.phase === 'won') res.wins++;
      res.waves.push(G.stats.wavesCleared); res.health.push(G.health); res.gold.push(G.gold); res.leaks += G.stats.leaks;
      G.cards.forEach((c) => { res.cards[c.id] = (res.cards[c.id] || 0) + 1; });
    }
    return res;
  }

  // ---------- actions: the one way to change a game ----------
  // Every player input is an intent object. The phone UI, bots and the co-op server all go through act(),
  // so a log of intents replays a run exactly (same seed + same intents = same game).
  //   { k: 'build', type, c, r }  { k: 'upgrade', c, r, branch }  { k: 'sell', c, r }
  //   { k: 'start' }  { k: 'pick', card }  { k: 'skip' }
  function act(G, it) {
    if (!it || typeof it !== 'object') return false;
    const tw = () => towerAt(G, it.c | 0, it.r | 0);
    switch (it.k) {
      case 'build': return !!TOWERS[it.type] && build(G, it.type, it.c | 0, it.r | 0);
      case 'upgrade': return (it.branch === 'A' || it.branch === 'B') && !!tw() && upgrade(G, tw(), it.branch);
      case 'sell': return !!tw() && sell(G, tw());
      case 'start': return startWave(G);
      case 'pick': return pick(G, it.card);
      case 'skip': return skipDraft(G);
      default: return false;
    }
  }
  // Small checksum of everything that matters, for spotting co-op desyncs. Same state, same number.
  function hash(G) {
    const parts = [G.tick, G.wave, G.stage, G.phase, G.gold, G.health, G.stats.kills, G.stats.leaks,
      G.towers.map((t) => `${t.type}${t.c}${t.r}${t.tier}${t.branch || ''}`).join('.'), G.cards.map((c) => c.id).join('.')];
    let h = 2166136261; const str = parts.join('|');
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(16);
  }

  // ---------- tester tools (menu → Tester tools) ----------
  // Jump ahead with a fair board: the smart bot plays every wave before `target` (0-based), then hands over at build.
  function testJump(G, target) {
    G.test.used = true; const inv = G.test.invincible; G.test.invincible = true;
    let guard = 0;
    while (G.wave < target && G.phase !== 'won' && G.phase !== 'lost' && guard++ < 200000) {
      if (G.phase === 'build') { botBuild(G, 'smart'); startWave(G); }
      else if (G.phase === 'wave') step(G);
      else if (G.phase === 'draft') pick(G, botPick(G));
    }
    if (G.phase === 'draft') pick(G, botPick(G));
    G.test.invincible = inv; G.enemies = []; G.shots = [];
    return G;
  }
  function testGold(G, n) { G.test.used = true; G.gold += n; }
  function testHeal(G) { G.test.used = true; G.health = G.maxHealth; }
  function testCard(G, id) { const c = CARDS.find((x) => x.id === id); if (!c) return false; G.test.used = true; c.apply(G); G.cards.push(c); return true; }

  const TD = { TICK, COLS, ROWS, PATHS, SPOTS, TOWERS, ENEMIES, WAVES, CARDS, SELL_RATE, rng, newGame, path, spots, keep, isSpot, towerAt, cost, upCost, canBuild, build, canUpgrade, upgrade, sellValue, sell, stats, startWave, step, pick, skipDraft, drawOffer, botBuild, botPick, playOut, simulate, posOf, nextWaveNeeds, act, hash, testJump, testGold, testHeal, testCard, _setScale: (v) => { SCALE = v; }, _setEcon: (b, w) => { BOUNTY_MUL = b; BONUS_MUL = w; }, _setSpeed: (v) => { SPEED = v; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = TD; else root.TD = TD;
})(typeof window !== 'undefined' ? window : globalThis);
