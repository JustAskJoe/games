// node test.js — engine rule checks: determinism, replays, saves, and that act() refuses bad intents.
// © 2026 justaskjoe. All rights reserved.
const WB = require('./engine.js');
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('FAIL', msg); } };

// 1. Same seed, same map.
ok(WB.hash(WB.newGame(7)) === WB.hash(WB.newGame(7)), 'same seed gives the same start');
ok(WB.hash(WB.newGame(7)) !== WB.hash(WB.newGame(8)), 'different seeds give different maps');

// 2. Every unit starts standing on ground, above the water, in its own half.
for (let s = 1; s <= 50; s++) {
  const G = WB.newGame(s);
  for (const u of G.units) {
    ok(WB.solidAt(G, u.x, u.y + 0.05) && !WB.solidAt(G, u.x, u.y - 0.01), `seed ${s}: unit ${u.id} stands on the surface`);
    ok(u.y < G.water, `seed ${s}: unit ${u.id} starts above the water`);
    ok(u.team === 0 ? u.x < WB.COLS / 2 : u.x > WB.COLS / 2, `seed ${s}: unit ${u.id} starts in its half`);
  }
}

// 3. A bot match replays exactly from seed + intent log.
for (const seed of [11, 222, 3333]) {
  const { G, log } = WB.playOut(WB.newGame(seed), ['smart', 'sloppy']);
  const R = WB.replay(seed, log);
  ok(R.phase === 'over' && R.winner === G.winner && WB.hash(R) === WB.hash(G), `seed ${seed}: replay matches (${log.length} intents)`);
}

// 4. A save mid-match (JSON round trip) carries on identically.
{
  const A = WB.newGame(4242);
  for (let i = 0; i < 4; i++) { WB.botTurn(A, 'smart'); WB.resolve(A); }
  const B = JSON.parse(JSON.stringify(A));
  for (let i = 0; i < 4 && A.phase !== 'over'; i++) { WB.botTurn(A, 'smart'); WB.resolve(A); WB.botTurn(B, 'smart'); WB.resolve(B); }
  ok(WB.hash(A) === WB.hash(B), 'a JSON save carries on identically');
}

// 5. act() refuses what a player can't do.
{
  const G = WB.newGame(99);
  ok(!WB.act(G, null) && !WB.act(G, { k: 'nope' }), 'unknown intents are refused');
  ok(!WB.act(G, { k: 'fire', angle: NaN, power: 1 }), 'a fire with no angle is refused');
  ok(!WB.act(G, { k: 'weapon', w: 'nuke' }), 'an unknown weapon is refused');
  ok(!WB.act(G, { k: 'move', dir: 3 }), 'a move must be one step');
  ok(!WB.act(G, { k: 'lob', dud: 12345, angle: 45, power: 0.5 }), 'lobbing a dud that isn\'t there is refused');
  let steps = 0; while (WB.act(G, { k: 'move', dir: 1 })) steps++;
  ok(steps <= WB.MOVE_STEPS, `walking stops at ${WB.MOVE_STEPS} steps (walked ${steps})`);
  ok(WB.act(G, { k: 'weapon', w: 'dud' }) && WB.act(G, { k: 'fire', angle: 60, power: 0.5 }), 'fire a dud');
  ok(!WB.act(G, { k: 'fire', angle: 60, power: 0.5 }), 'no second shot while the first is flying');
  WB.resolve(G);
  ok(G.phase === 'aim' && G.team === 1, 'the turn passes to the other team');
  ok(G.units[0].ammo.dud === WB.DUD.ammo - 1, 'firing a dud uses one');
}

// 6. A dud ticks down and goes off; a dud in reach can be lobbed.
{
  const G = WB.newGame(5, { map: { preset: 'hills', hazards: 0 } }); // no old duds on the map, so the count is ours
  const u = WB.current(G);
  WB.act(G, { k: 'weapon', w: 'dud' }); WB.act(G, { k: 'fire', angle: u.team === 0 ? 80 : 100, power: 0.3 }); WB.resolve(G);
  const d = G.duds[0];
  ok(d && d.fuse === WB.DUD.fuse - 1, 'a fired dud rests with its fuse ticked once');
  if (d) {
    let turns = 0; const blastsBefore = G.stats.dudBlasts;
    while (G.duds.some((x) => x.id === d.id) && turns++ < 6 && G.phase !== 'over') { WB.act(G, { k: 'pass' }); WB.resolve(G); }
    ok(G.stats.dudBlasts === blastsBefore + 1, `the dud went off after ${turns} more turn(s)`);
  }
  // put a dud next to the current unit and lob it
  const H = WB.newGame(6), v = WB.current(H);
  H.duds.push({ id: 999, x: v.x + 1, y: v.y - 0.5, fuse: 2, team: 1, air: false, vy: 0 });
  ok(WB.lobbable(H).length === 1, 'a dud right next to you is lobbable');
  ok(WB.act(H, { k: 'lob', dud: 999, angle: v.team === 0 ? 45 : 135, power: 1 }), 'lob it');
  ok(H.stats.lobs === 1 && H.proj.length === 1 && H.proj[0].fuse === 2, 'the lobbed dud keeps its fuse');
}

// 6b. The second team can go first (best-of-3 alternates it).
{
  const G = WB.newGame(31, { first: 1 });
  ok(G.team === 1 && WB.current(G).team === 1, 'opts.first = 1 hands the first turn to team 1');
  WB.act(G, { k: 'pass' }); WB.resolve(G);
  ok(G.team === 0, 'then team 0 plays');
}

// 8. Characters: every pairing builds, replays, and each Shot 2 does its job.
for (const a of WB.CHAR_IDS) {
  const b = WB.CHAR_IDS[(WB.CHAR_IDS.indexOf(a) + 2) % WB.CHAR_IDS.length], opts = { chars: [a, b] };
  const G = WB.newGame(500, opts);
  const hp = Math.round(WB.CHARS[a].hp * WB.HP_MUL.duel);
  ok(G.units.filter((u) => u.team === 0).every((u) => u.char === a && u.hp === hp), `${a}: side 0 is ${a} with ${hp} hp (×${WB.HP_MUL.duel} in a 1v1)`);
  ok(G.moves === WB.CHARS[a].steps && G.units[0].ammo.shot2 === 2 && G.units[0].ammo.dud === 2, `${a}: steps ${WB.CHARS[a].steps}, 2 Shot 2s, 2 duds`);
  const { G: F, log } = WB.playOut(WB.newGame(600, opts), ['smart', 'smart']);
  ok(WB.hash(WB.replay(600, log, opts)) === WB.hash(F), `${a} vs ${b}: a bot match replays exactly`);
}
const shoot = (chars, w, angle, power, setup) => {
  const G = WB.newGame(42, { chars }); if (setup) setup(G);
  WB.act(G, { k: 'weapon', w }); WB.act(G, { k: 'fire', angle, power }); return G;
};
{ // Double Tap: two darts from one shot
  const G = shoot(['zip', 'volt'], 'shot2', 45, 0.8);
  ok(G.proj.length === 2 && G.proj[1].wait > 0, 'Double Tap fires two darts, the second a moment later');
  WB.resolve(G); ok(G.units[0].ammo.shot2 === 1, 'Double Tap uses one Shot 2');
}
{ // Drill: tunnels through ground. Fire straight down into the hill you stand on.
  const G = shoot(['digger', 'volt'], 'shot2', 270, 0.6);
  const u = G.units[0], before = G.T.reduce((a, v) => a + v, 0);
  let maxDepth = 0; for (let i = 0; i < 400 && G.proj.length; i++) { WB.step(G); if (G.proj[0]) maxDepth = Math.max(maxDepth, G.proj[0].y - u.y); }
  WB.resolve(G);
  ok(maxDepth > 6 && G.T.reduce((a, v) => a + v, 0) < before, `the Drill bores ${maxDepth.toFixed(1)} cells into the ground before it explodes`);
}
{ // Wrecking Ball: bounces before exploding
  const G = shoot(['brick', 'volt'], 'shot2', 70, 0.35);
  let bounced = false; for (let i = 0; i < 2000 && G.phase === 'flight'; i++) { if (G.proj.some((p) => p.bounced)) bounced = true; WB.step(G); }
  ok(bounced, 'the Wrecking Ball bounces');
}
{ // Thunderstrike: hits a unit even with ground above it
  const G = WB.newGame(42, { chars: ['volt', 'brick'] }), foe = G.units.find((u) => u.team === 1), hp0 = foe.hp;
  G.fx = []; WB.act(G, { k: 'weapon', w: 'shot2' });
  // put a roof over the target, then let the strike land just beside it
  for (let x = Math.floor(foe.x) - 3; x <= Math.floor(foe.x) + 3; x++) for (let y = Math.floor(foe.y) - 8; y < Math.floor(foe.y) - 5; y++) G.T[y * WB.COLS + x] = 1;
  const p = { id: 999, w: 'shot2', team: 0, from: -1, age: 9, x: foe.x + 1, y: foe.y - 7.5, vx: 0, vy: 1, wm: 1 };
  G.proj.push(p); G.phase = 'flight'; WB.resolve(G);
  ok(G.stats.strikes === 1 && foe.hp < hp0, `Thunderstrike hits a unit under cover (${hp0} → ${foe.hp})`);
}
{ // Brick's armour: the same blast hurts Brick less than Volt
  const a = WB.newGame(9, { chars: ['volt', 'volt'] }), b = WB.newGame(9, { chars: ['brick', 'brick'] });
  for (const G of [a, b]) { const u = G.units[1]; G.phase = 'flight'; G.proj.push({ id: 998, w: 'shot1', team: 1, from: -1, age: 9, x: u.x, y: u.y - 4, vx: 0, vy: 5, wm: 1 }); WB.resolve(G); }
  const lost = (G) => G.units[1].maxHp - G.units[1].hp;
  ok(lost(b) < lost(a), `armour: Brick loses ${lost(b)} where Volt loses ${lost(a)}`);
}
{ // Gust Bomb throws harder than a normal shot
  const kick = (w) => { const G = WB.newGame(9, { chars: ['gale', 'volt'] }), u = G.units.find((x) => x.team === 1); G.phase = 'flight';
    for (let x = Math.floor(u.x) - 4; x <= Math.floor(u.x) + 4; x++) G.T[Math.floor(u.y) * WB.COLS + x] = 1; // flat floor, whatever the map
    G.proj.push({ id: 997, w, team: 0, from: -1, age: 9, x: u.x - 2, y: u.y - 1, vx: 0, vy: 5, wm: 1 });
    let top = 0; for (let i = 0; i < 90 && G.phase === 'flight'; i++) { WB.step(G); top = Math.max(top, Math.hypot(u.vx, u.vy)); } return top; };
  ok(kick('shot2') > kick('shot1') * 1.6, `Gust Bomb knockback ${kick('shot2').toFixed(0)} vs Kite Bomb ${kick('shot1').toFixed(0)}`);
}
{ // the bots' aim prediction is exact for bounce and drill shots
  for (const [c, ang, pw] of [['brick', 60, 0.5], ['digger', 50, 0.55], ['digger', 20, 0.45], ['brick', 30, 0.3]]) {
    const G = WB.newGame(77, { chars: [c, 'volt'] }), u = WB.current(G);
    const guess = WB.predict(G, u, ang, pw, 'shot2');
    WB.act(G, { k: 'weapon', w: 'shot2' }); WB.act(G, { k: 'fire', angle: ang, power: pw });
    let last = null; for (let i = 0; i < 3000 && G.phase === 'flight'; i++) { if (G.proj[0]) last = { x: G.proj[0].x, y: G.proj[0].y }; WB.step(G); }
    ok(last && Math.hypot(last.x - guess.x, last.y - guess.y) < 1.2, `${c}: predicted landing (${guess.hit} at ${guess.x.toFixed(1)}, ${guess.y.toFixed(1)}) matches the real one (${last && last.x.toFixed(1)}, ${last && last.y.toFixed(1)})`);
  }
}

// 9. SS (Special Shot): charges one notch a turn, ready on your 4th turn, and each one does its thing.
{
  const G = WB.newGame(321, { chars: ['volt', 'volt'] });
  ok(G.units[0].ss === 1 && !WB.ssReady(G), 'SS starts with one notch on your first turn, not ready');
  ok(G.units[1].ss === 1, 'the team going second starts with a one-notch head start');
  ok(!WB.act(G, { k: 'weapon', w: 'ss' }), 'SS can\'t be picked before it is charged');
  for (let i = 0; i < 6; i++) { WB.act(G, { k: 'pass' }); WB.resolve(G); }
  ok(G.team === 0 && WB.ssReady(G) && G.units[0].ss === WB.SS_CHARGE, `ready on your ${WB.SS_CHARGE}th turn`);
  ok(WB.act(G, { k: 'weapon', w: 'ss' }) && WB.act(G, { k: 'fire', angle: 60, power: 0.6 }), 'fire the SS');
  ok(G.units[0].ss === 0 && G.stats.ss === 1, 'firing it empties the charge');
  WB.resolve(G); let g = 0; while (G.team !== 0 && g++ < 6) { WB.act(G, { k: 'pass' }); WB.resolve(G); } // the delay may give side 1 two turns
  ok(G.units[0].ss === 1, 'and it starts charging again on your next turn');
}
const ssGame = (chars, seed = 11) => { const G = WB.newGame(seed, { chars }); WB.current(G).ss = WB.SS_CHARGE; WB.act(G, { k: 'weapon', w: 'ss' }); return G; };
{ // Bullet Rain: five darts
  const G = ssGame(['zip', 'volt']); WB.act(G, { k: 'fire', angle: 50, power: 0.7 });
  ok(G.proj.length === 5 && G.proj.filter((p) => p.wait > 0).length === 4, 'Bullet Rain fires a fan of 5 darts');
  WB.resolve(G);
}
{ // Storm Call: three strikes
  const G = ssGame(['volt', 'volt']); WB.act(G, { k: 'fire', angle: 60, power: 0.7 }); WB.resolve(G);
  ok(G.stats.strikes === 3 || G.proj.length === 0, `Storm Call strikes 3 times (${G.stats.strikes}) unless it fell in the water`);
}
{ // Earthquake: every grounded enemy loses health, own crew untouched by the quake
  const G = ssGame(['digger', 'brick']), foes = G.units.filter((u) => u.team === 1), before = foes.map((u) => u.hp), mine = G.units.filter((u) => u.team === 0).map((u) => u.hp);
  G.proj.push({ id: 900, w: 'ss', team: 0, from: -1, age: 9, x: 80, y: WB.surfaceY(G, 80) - 1, vx: 0, vy: 4, wm: 1 }); G.phase = 'flight';
  const fx = []; for (let i = 0; i < 4000 && G.phase === 'flight'; i++) fx.push(...WB.step(G));
  const q = fx.find((e) => e.k === 'quake');
  ok(q && q.hits.length === foes.length && foes.every((u, i) => u.hp < before[i]), `Earthquake hits every enemy (${before} → ${foes.map((u) => u.hp)})`);
  ok(G.units.filter((u) => u.team === 0).every((u, i) => u.hp === mine[i]), 'Earthquake doesn\'t touch your own crew far from the blast');
}
{ // Tornado: flings units in reach away from the centre
  const G = ssGame(['gale', 'volt']), foe = G.units.find((u) => u.team === 1), x0 = foe.x, y0 = foe.y;
  G.proj.push({ id: 901, w: 'ss', team: 0, from: -1, age: 9, x: foe.x - 4, y: foe.y - 2, vx: 0, vy: 4, wm: 1 }); G.phase = 'flight';
  let moved = 0; for (let i = 0; i < 4000 && G.phase === 'flight'; i++) { WB.step(G); moved = Math.max(moved, Math.hypot(foe.x - x0, foe.y - y0)); }
  ok(moved > 4 || !foe.alive, `Tornado throws the target away (moved ${moved.toFixed(1)} cells${foe.alive ? '' : ', knocked out'})`);
}
{ // Meteor Slam: the biggest crater
  const crater = (w) => { const G = WB.newGame(5, { chars: ['brick', 'volt'], map: { preset: 'hills', hazards: 0 } }), cells = () => G.T.filter((v) => v).length, before = cells(); G.proj.push({ id: 902, w, team: 0, from: -1, age: 9, x: 80, y: WB.surfaceY(G, 80) - 1, vx: 0, vy: 4, wm: 1 }); G.phase = 'flight'; WB.resolve(G); return before - cells(); };
  ok(crater('ss') > crater('shot2') * 1.3, `Meteor Slam digs ${crater('ss')} cells vs Wrecking Ball ${crater('shot2')}`);
}

// 10. Turn delay: the lowest delay goes next; heavy shots push your next turn back.
{
  const G = WB.newGame(55, { chars: ['brick', 'zip'] });
  ok(WB.turnOrder(G).map((x) => x.team).join('') === '01', 'the first round alternates the sides');
  const a = WB.current(G); WB.act(G, { k: 'move', dir: 1 }); WB.act(G, { k: 'move', dir: 1 });
  ok(G.spent === 2 * WB.DELAY.move, 'walking adds delay per step');
  ok(WB.delayIf(G, 'ss') > WB.delayIf(G, 'shot2') && WB.delayIf(G, 'shot2') > WB.delayIf(G, 'shot1'), 'SS costs more delay than Shot 2, Shot 2 more than Shot 1');
  WB.act(G, { k: 'weapon', w: 'shot2' }); WB.act(G, { k: 'fire', angle: 60, power: 0.4 }); WB.resolve(G);
  ok(a.delay === 2 * WB.DELAY.move + WB.CHARS.brick.shot2.delay, `Brick's Wrecking Ball adds ${WB.CHARS.brick.shot2.delay} delay`);
  ok(WB.current(G).team === 1, 'then the other team plays');
}
{ // light shots win extra turns: Zip firing Darts against Brick firing Slugs gets more turns over a match
  const G = WB.newGame(56, { chars: ['zip', 'brick'] }); const turns = [0, 0];
  // everyone fires off the edge of the map (no damage), so only the delays decide the turn order
  for (let i = 0; i < 40 && G.phase !== 'over'; i++) { turns[G.team]++; WB.act(G, { k: 'fire', angle: G.team ? 4 : 176, power: 1 }); WB.resolve(G); }
  ok(turns[0] > turns[1], `Zip (Dart, ${WB.CHARS.zip.shot1.delay}) gets more turns than Brick (Slug, ${WB.CHARS.brick.shot1.delay}): ${turns[0]} vs ${turns[1]}`);
}
{ // a team can play twice in a row if the other team throws heavy shots
  const G = WB.newGame(57, { chars: ['volt', 'volt'] }); let twice = false, last = -1;
  for (let i = 0; i < 16 && G.phase !== 'over'; i++) {
    if (G.team === last) twice = true; last = G.team;
    if (G.team === 1) { G.units[1].ss = WB.SS_CHARGE; WB.act(G, { k: 'weapon', w: 'ss' }); WB.act(G, { k: 'fire', angle: 4, power: 1 }); } else WB.act(G, { k: 'fire', angle: 176, power: 1 });
    WB.resolve(G);
  }
  ok(twice, 'heavy shots on one side let the other side play twice in a row');
}

// 11. Free-for-all: four sides, one unit each.
{
  const G = WB.newGame(70, { teams: 4, chars: ['zip', 'brick', 'gale', 'digger'], first: 2 });
  ok(G.units.length === 4 && new Set(G.units.map((u) => u.team)).size === 4, 'four sides, one unit each');
  ok(G.units.every((u) => u.char === G.chars[u.team] && WB.solidAt(G, u.x, u.y + 0.05)), 'each stands on the ground as its own character');
  ok(WB.turnOrder(G).map((x) => x.team).join('') === '2301', 'the first round goes round the table from the side that starts');
  ok(G.units.filter((u) => u.ss === 1).length === 4, 'everyone starts with one SS notch (the first side charges on its turn)');
  const xs = Array.from({ length: 40 }, (_, s2) => WB.newGame(s2 + 1, { teams: 4 }).units.find((u) => u.team === 0).x);
  const quarters = [0, 1, 2, 3].map((q) => xs.filter((x) => Math.floor(x / 40) === q).length);
  ok(quarters.every((k) => k >= 5), `side 0 starts all over the map (by quarter over 40 seeds: ${quarters})`);
  const { G: F, log } = WB.playOut(WB.newGame(71, { teams: 4, chars: ['volt', 'zip', 'gale', 'brick'] }), ['smart', 'easy', 'medium', 'hard']);
  ok(F.phase === 'over' && WB.teamUnits(F, F.winner >= 0 ? F.winner : 0).length <= 1, `a 4-way bot match finishes (winner side ${F.winner}, ${F.turn} turns)`);
  ok(WB.hash(WB.replay(71, log, { teams: 4, chars: ['volt', 'zip', 'gale', 'brick'] })) === WB.hash(F), 'and replays exactly');
}

// 7. Rising water ends every match: bots that only pass still finish.
{
  const G = WB.newGame(77); let g = 0;
  while (G.phase !== 'over' && g++ < 200) { WB.act(G, { k: 'pass' }); WB.resolve(G); }
  ok(G.phase === 'over' && !G.timeout, `a match of passes ends by rising water (turn ${G.turn})`);
}

// 8. Maps: each one is seeded, spawns everyone on dry ground, and plays and replays a whole match.
for (const m of WB.MAP_IDS) {
  ok(WB.hash(WB.newGame(13, { map: m })) === WB.hash(WB.newGame(13, { map: m })), `${m}: same seed gives the same map`);
  for (let s = 0; s < 20; s++) {
    const G = WB.newGame(1000 + s * 31, { map: m, teams: s % 2 ? 4 : 2 });
    if (!G.units.every((u) => u.y < G.water - 4 && WB.solidAt(G, u.x, u.y))) { ok(false, `${m} seed ${1000 + s * 31}: a unit spawned off the ground`); break; }
    if (s === 19) ok(true, `${m}: 20 seeds spawn everyone on dry ground`);
  }
  const opts = { map: m, chars: ['gale', 'brick'] }, { G: F, log } = WB.playOut(WB.newGame(808, opts), ['smart', 'smart']);
  ok(F.phase === 'over' && WB.hash(WB.replay(808, log, opts)) === WB.hash(F), `${m}: a bot match finishes and replays exactly (${F.turn} turns)`);
}
// With no map given, every round rolls a fresh map from its mode's recipe and the round's seed (the online server sends
// no map), so every copy builds the same one.
{
  const seen = {}, codes = {};
  for (let s = 1; s <= 300; s++) { const G = WB.newGame(s * 7919); seen[G.theme] = 1; codes[G.map] = 1; }
  ok(WB.MapGen.THEME_IDS.every((m) => seen[m]), `all ${WB.MapGen.THEME_IDS.length} themes come up from random seeds`);
  ok(Object.keys(codes).length > 100, `rounds roll different settings, not just different layouts (${Object.keys(codes).length} setups in 300 rounds)`);
  ok(WB.hash(WB.newGame(4242)) === WB.hash(WB.newGame(4242)) && !!WB.MapGen.decode(WB.newGame(4242).map), 'the same seed always gives the same map, and G.map is a share code that rebuilds it');
  ok(WB.MAP_IDS.includes(WB.newGame(13, { map: 'nope' }).map), 'an unknown map id falls back to a theme map');
  let wet = 0, close = 0;
  for (const m of WB.MAP_IDS) for (let s = 1; s <= 30; s++) for (const n of [2, 4, 6]) {
    const G = WB.newGame(s * 104729, { teams: n, map: m });
    for (const u of G.units) if (u.y >= G.water - 1 || !WB.solidAt(G, u.x, u.y + 0.5)) wet++;
    const xs = G.units.map((u) => u.x).sort((a, b) => a - b); for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] < 7) close++;
  }
  ok(wet === 0 && close === 0, `every theme, 2, 4 and 6 sides, 30 seeds: everyone starts on dry ground, nobody on top of anyone (${wet} wet, ${close} close)`);
}

// 8b. v2: map size grows with the match, squads of up to five, a kit per unit, planned spawns.
{
  const dims = (o) => { const G = WB.newGame(7, o); return G.cols + 'x' + G.rows; };
  ok(dims({}) === '160x90' && dims({ teams: 4 }) === '160x90' && dims({ teams: 6 }) === '200x112' && dims({ size: 4 }) === '240x135' && dims({ size: 5 }) === '320x180',
    `map size by units: 2 and 4 → ${dims({})}, 6 → ${dims({ teams: 6 })}, 8 → ${dims({ size: 4 })}, 10 → ${dims({ size: 5 })}`);
  ok(dims({ size: 5, mapSize: 'huge' }) === '240x135', 'opts.mapSize overrides it');
  ok(WB.newGame(1, { teams: 6, size: 5 }).units.length === 12 && WB.newGame(1, { teams: 2, size: 9 }).size === 5, `never more than ${WB.MAX_UNITS} units or ${WB.MAX_SIZE} a side`);
  // squads: per-unit characters, kits and owners
  const squad = ['brick', 'zip', 'volt', 'digger', 'gale'], G = WB.newGame(21, { size: 5, chars: squad.concat(squad.slice().reverse()), owners: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] });
  ok(G.units.length === 10 && [0, 1].every((t) => WB.teamUnits(G, t).map((u) => u.char).sort().join() === squad.slice().sort().join()), 'a 5v5 with one of each character a side');
  ok(new Set(G.units.map((u) => u.own)).size === 10 && WB.owner(G) === WB.current(G).own, 'every unit can have its own controller; owner(G) is whose turn it is');
  ok(WB.newGame(21, { size: 3, chars: ['gale', 'brick'] }).units.every((u) => u.char === (u.team ? 'brick' : 'gale')), 'one character per side still means the whole crew plays it');
  const u0 = WB.current(G), mate = G.units.find((u) => u.team === u0.team && u.id !== u0.id);
  WB.act(G, { k: 'weapon', w: 'shot2' }); WB.act(G, { k: 'fire', angle: 80, power: 0.2 });
  ok(u0.ammo.shot2 === 1 && mate.ammo.shot2 === 2, 'ammo is per unit: one unit firing its Shot 2 leaves its crewmates full');
  ok(WB.shotSpec(G, u0, 'shot1').name === WB.CHARS[u0.char].shot1.name, 'a unit fires its own character\'s shots');
  WB.resolve(G);
  // spawns: dry, apart, standing with headroom, on every size and layout; sides keeps crews together
  let bad = 0, deep = 0, n = 0;
  for (let s = 1; s <= 40; s++) for (const o of [{ size: 2 }, { size: 3 }, { size: 5 }, { teams: 3, size: 3 }, { teams: 4, size: 2 }, { teams: 6, size: 2 }, { size: 5, recipe: 'teams' }]) {
    const g = WB.newGame(s * 9973, o), xs = g.units.map((u) => u.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] < 5) bad++;
    for (const u of g.units) {
      n++; if (u.y >= g.water - 3 || !WB.solidAt(g, u.x, u.y + 0.5) || WB.solidAt(g, u.x, u.y - 1) || WB.solidAt(g, u.x, u.y - 3)) bad++;
      if (u.y > WB.surfaceY(g, u.x) + 2) deep++;
    }
  }
  ok(bad === 0, `squad spawns: ${n} units over 7 formats and 40 seeds all stand on dry ground with headroom, 5+ cells apart (${bad} bad)`);
  ok(deep > 0 && deep < n * 0.4, `some units start under cover on a ledge or cave floor (${deep} of ${n})`);
  const side = WB.newGame(5, { size: 5, spawn: 'sides' }), mix = WB.newGame(5, { size: 5, spawn: 'mixed', map: 'hills' });
  ok(Math.max(...WB.teamUnits(side, 0).map((u) => u.x)) < Math.min(...WB.teamUnits(side, 1).map((u) => u.x)), "'sides' starts each crew together, side 0 on the left");
  ok(Math.max(...WB.teamUnits(mix, 0).map((u) => u.x)) > Math.min(...WB.teamUnits(mix, 1).map((u) => u.x)), "'mixed' deals the two crews in among each other");
  // whole matches on big maps finish and replay
  for (const [label, o] of [['3v3', { size: 3, chars: ['zip', 'digger'] }], ['5v5 squads', { size: 5, chars: squad.concat(squad) }], ['5v5 team battle', { size: 5, recipe: 'teams', chars: squad.concat(squad) }], ['4 crews of 3', { teams: 4, size: 3 }]]) {
    const { G: F, log } = WB.playOut(WB.newGame(4040, o), new Array(6).fill('smart'));
    ok(F.phase === 'over' && WB.hash(WB.replay(4040, log, o)) === WB.hash(F), `${label} on a ${F.cols} × ${F.rows} map finishes and replays exactly (${F.turn} turns${F.timeout ? ', timed out' : ''})`);
  }
  // bots on a big map walk towards the fight instead of standing out of range, and never into the water
  let walked = 0, lost = 0;
  for (let s = 1; s <= 12; s++) { const { G: F, log } = WB.playOut(WB.newGame(s * 31337, { size: 5, recipe: 'teams' }), ['smart', 'smart']); walked += log.filter((it) => it.k === 'move').length; lost += F.stats.drowned; }
  ok(walked > 50, `bots walk on big maps (${walked} steps in 12 matches, ${lost} units lost to the water in all)`);
}

// 8c. v2 cast and gear: ten characters in five classes, one gear item per unit.
{
  const cls = {}; for (const c of WB.CHAR_IDS) (cls[WB.CHARS[c].cls] = cls[WB.CHARS[c].cls] || []).push(c);
  ok(WB.CHAR_IDS.length === 10 && Object.keys(cls).length === 5 && Object.values(cls).every((v) => v.length === 2), `10 characters, 2 in each of 5 classes (${Object.entries(cls).map(([k, v]) => k + ': ' + v.join(' + ')).join('; ')})`);
  ok(WB.GEAR_IDS.length === 14 && WB.CHAR_IDS.every((c) => WB.gearFor(c).length === 6 && WB.gearFor(c).includes(WB.CHARS[c].gear)), 'every character can carry 6 gear items (4 anyone\'s + 2 for its class), its default among them');
  const g0 = WB.newGame(3, { chars: ['brick', 'gale'], gear: ['thermite', 'well'] });
  ok(g0.units[0].gear === 'ricochet' && g0.units[1].gear === 'well', 'gear from another class falls back to the character\'s own default');
  ok(WB.newGame(3, { gear: ['none', ''] }).units.every((u) => u.gear === null && u.ammo.gear === 0), "'none' means no gear");
  const flat = (map, o) => { const G = WB.newGame(11, Object.assign({ map: { preset: 'hills', hazards: 0, caves: 0, props: 0 } }, o)), foe = G.units[1]; for (let x = 0; x < G.cols; x++) for (let y = 0; y < G.rows; y++) G.T[y * G.cols + x] = y >= 60 ? 1 : 0; for (const u of G.units) { u.y = 60; u.air = false; } G.units[0].x = 40.5; foe.x = 110.5; return G; };
  const shoot = (G, x, y) => { const u = WB.current(G), s = WB.shotSpec(G, u, 'gear'); G.proj.push({ id: 950, w: 'gear', team: u.team, char: u.char, gear: u.gear, from: -1, age: 9, x, y, vx: 0, vy: 3, wm: 1 }); G.phase = 'flight'; WB.resolve(G); return s; };
  { const G = flat(0, { gear: ['pistol', 'none'] }); WB.act(G, { k: 'weapon', w: 'gear' }); const a0 = G.units[0].ammo.gear; WB.act(G, { k: 'fire', angle: 80, power: 0.3 }); ok(a0 === 3 && G.units[0].ammo.gear === 2 && G.stats.gear === 1, 'firing gear uses one of its own ammo'); WB.resolve(G); }
  { const G = flat(0, { gear: ['none', 'none'] }); ok(!WB.act(G, { k: 'weapon', w: 'gear' }), 'a unit with no gear can\'t pick the gear slot'); }
  { const G = flat(0, { chars: ['nimbus', 'volt'], gear: ['well', 'none'] }), foe = G.units[1], x0 = foe.x; shoot(G, foe.x - 5, 58); ok(foe.x < x0 - 0.5, `Gravity Well pulls a unit towards the blast (${x0} → ${foe.x.toFixed(1)})`); }
  { const G = flat(0, { chars: ['nimbus', 'volt'], gear: ['delayray', 'none'] }), foe = G.units[1], d0 = foe.delay; shoot(G, foe.x, 58); ok(foe.delay >= d0 + 300, `Delay Ray adds 300 turn delay to an enemy it catches (${d0} → ${foe.delay})`); }
  { const G = flat(0, { chars: ['patch', 'volt'], gear: ['dirt', 'none'] }), foe = G.units[1], n0 = G.T.filter((v) => v).length, hp = foe.hp; shoot(G, foe.x + 6, 57); const n1 = G.T.filter((v) => v).length; ok(n1 > n0 + 20 && foe.hp === hp && !WB.solidAt(G, foe.x, foe.y - 1.5), `Dirt Cannon adds ground (${n1 - n0} cells), hurts nobody and never buries a unit`); }
  { const G = flat(0, { gear: ['popcorn', 'none'] }); const before = G.T.filter((v) => v).length; shoot(G, 75, 58); const booms = before - G.T.filter((v) => v).length; const G2 = flat(0, { gear: ['pistol', 'none'] }); const b2 = G2.T.filter((v) => v).length; shoot(G2, 75, 58); ok(booms > (b2 - G2.T.filter((v) => v).length) * 2, 'Popcorn Bomb\'s bomblets dig far more than one small shell'); }
  let bad = [];
  for (const c of WB.CHAR_IDS) for (const g of WB.gearFor(c)) { const o = { chars: [c, WB.CHAR_IDS[(WB.CHAR_IDS.indexOf(c) + 3) % 10]], gear: [g, 'none'] }, { G: F, log } = WB.playOut(WB.newGame(777, o), ['smart', 'smart']); if (F.phase !== 'over' || WB.hash(WB.replay(777, log, o)) !== WB.hash(F)) bad.push(c + '/' + g); }
  ok(!bad.length, `a match with every character carrying each gear it can finishes and replays exactly (60 loadouts) ${bad.slice(0, 3)}`);
}

// 9. The map generator (mapgen.js) on its own: settings, codes, every preset, random settings, sizes.
{
  const MG = WB.MapGen, same = (a, b) => a.T.join('') === b.T.join('') && JSON.stringify(a.features) === JSON.stringify(b.features);
  ok(MG.THEME_IDS.length === 10 && MG.LANDFORM_IDS.length === 11, `10 themes and 11 landforms (${MG.THEME_IDS.length}, ${MG.LANDFORM_IDS.length})`);
  ok(MG.THEME_IDS.every((t) => MG.LANDFORMS[MG.THEMES[t].landform] && MG.THEMES[t].props.every(([k]) => MG.THEMES[t] && k)), 'every theme names a real landform and its props');
  let bad = [];
  for (const id of MG.PRESET_IDS) for (let k = 0; k < 15; k++) {
    const m = MG.generate(id, { w: 160, h: 90, seed: 1 + k * 7919 });
    if (!m.stats.ok) bad.push(`${id}/${k}: ${m.stats.problems}`);
    if (m.T.slice(0, m.sky * m.w).some((v) => v)) bad.push(`${id}/${k}: ground in the sky band`);
    if (k === 0 && !same(m, MG.generate(id, { w: 160, h: 90, seed: 1 }))) bad.push(`${id}: not deterministic`);
  }
  ok(!bad.length, `all ${MG.PRESET_IDS.length} presets pass the map checks on 15 seeds each ${bad.slice(0, 3)}`);
  bad = [];
  for (let k = 1; k <= 200; k++) {
    const s = MG.randomSettings(k), code = MG.encode(s), back = MG.decode(code);
    if (!back || MG.encode(back) !== code) { bad.push('code ' + code); continue; }
    const a = MG.generate(code), b = MG.generate(s);
    if (!same(a, b)) bad.push('code rebuilds a different map: ' + code);
    if (!a.stats.ok) bad.push(code + ' ' + a.stats.problems);
    if (s.symmetry) for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w / 2; x++) if (a.T[y * a.w + x] !== a.T[y * a.w + a.w - 1 - x]) { bad.push('not mirrored ' + code); y = a.h; break; }
  }
  ok(!bad.length, `200 random settings: share codes round-trip, rebuild the same map and pass the checks ${bad.slice(0, 3)}`);
  ok(['nope', 'hills-auto-12-x', 'frost-peak-9999999999999-1', '', null].every((c) => MG.decode(c) === null), 'bad share codes are refused');
  ok(MG.SIZE_IDS.every((z) => { const m = MG.generate({ preset: 'classic', size: z, seed: 5 }); return m.w === MG.SIZES[z].w && m.h === MG.SIZES[z].h && m.T.length === m.w * m.h && m.stats.ok; }), 'every size builds a good map of its own dimensions');
  const lv = [0, 1, 2, 3].map((w) => MG.generate({ preset: 'hills', water: w, seed: 3 }).water);
  ok(lv.join() === '86,82,78,74', `liquid levels Low..Flooded start at rows ${lv}`);
  // hard rock: never within 4 cells of air when the map is made, and blasts can't break it
  const R = MG.generate({ preset: 'fortress', seed: 9 }); let near = 0, rocks = 0;
  for (let i = 0; i < R.T.length; i++) if (R.T[i] === MG.ROCK) { rocks++; const x = i % R.w, y = (i / R.w) | 0; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < R.w && yy < R.h && !R.T[yy * R.w + xx]) near++; } }
  ok(rocks > 100 && near === 0, `Fortress has hard rock (${rocks} cells), all of it buried 5+ deep`);
  const G = WB.newGame(9, { map: { preset: 'fortress', seed: 9 } }), i0 = G.T.indexOf(MG.ROCK), rx = i0 % WB.COLS, ry = (i0 / WB.COLS) | 0;
  G.phase = 'flight'; G.proj.push({ id: 990, w: 'shot1', team: 0, from: -1, age: 9, x: rx + 0.5, y: ry + 0.5, vx: 0, vy: 0.1, wm: 1 }); WB.resolve(G);
  ok(G.T[i0] === MG.ROCK, 'a blast right on hard rock leaves it standing');
  // themes play their way: wind strength, barrels that chain, old duds that tick
  const windOf = (map) => Math.max(...Array.from({ length: 40 }, (_, k) => Math.abs(WB.newGame(k + 1, { map }).wind)));
  ok(windOf('fungal') <= WB.WIND_MAX * 0.5 && windOf('frost') > WB.WIND_MAX, `Fungal Hollow's wind tops out at ${windOf('fungal')}, Frostbite Peaks' at ${windOf('frost')}`);
  const B = WB.newGame(21, { map: 'scrap' });
  ok(B.barrels.length > 0 && B.barrels.every((b) => B.units.every((u) => Math.abs(u.x - b.x) >= 7)), `Scrap Yard starts with ${B.barrels.length} oil drums, none by a spawn`);
  const b0 = B.barrels[0]; B.barrels.push({ id: 991, x: b0.x + 3, y: b0.y, air: false, vy: 0 });
  B.phase = 'flight'; B.proj.push({ id: 992, w: 'shot1', team: 0, from: -1, age: 9, x: b0.x, y: b0.y - 2, vx: 0, vy: 3, wm: 1 }); WB.resolve(B);
  ok(B.barrels.every((b) => b.id !== b0.id && b.id !== 991) && B.stats.barrels >= 2, `a hit drum blows and sets off the one next to it (${B.stats.barrels} blew)`);
  const D = WB.newGame(4, { map: 'haunt' }), old = D.duds.filter((d) => d.old);
  ok(old.length > 0 && old.every((d) => d.fuse >= 4 && d.team === null), `Haunted Hollow starts with ${old.length} restless duds, fuses 4-6`);
  const mir = WB.newGame(12, { map: 'classic' });
  ok(Math.abs(mir.units[0].x + mir.units[1].x - WB.COLS) <= 1.01, `mirror maps mirror the spawns (${mir.units.map((u) => u.x)})`);
  const code = MG.encode(MG.randomSettings(77)), g1 = WB.newGame(5, { map: code }), g2 = WB.newGame(99, { map: code });
  ok(g1.T.join('') === g2.T.join('') && g1.map === code, 'a share code with a seed gives the same map whatever the match seed');
  const { G: F, log } = WB.playOut(WB.newGame(31, { map: code, chars: ['zip', 'digger'] }), ['smart', 'smart']);
  ok(F.phase === 'over' && WB.hash(WB.replay(31, log, { map: code, chars: ['zip', 'digger'] })) === WB.hash(F), `a match on a shared custom map finishes and replays (${F.turn} turns)`);
}

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
