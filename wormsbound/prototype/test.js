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
  ok(G.ammo[0].dud === WB.DUD.ammo - 1, 'firing a dud uses one');
}

// 6. A dud ticks down and goes off; a dud in reach can be lobbed.
{
  const G = WB.newGame(5);
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
  ok(G.units.filter((u) => u.team === 0).every((u) => u.char === a && u.hp === WB.CHARS[a].hp), `${a}: team 0 units are ${a} with ${WB.CHARS[a].hp} hp`);
  ok(G.moves === WB.CHARS[a].steps && G.ammo[0].shot2 === 2 && G.ammo[0].dud === 2, `${a}: steps ${WB.CHARS[a].steps}, 2 Shot 2s, 2 duds`);
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
  WB.resolve(G); ok(G.ammo[0].shot2 === 1, 'Double Tap uses one Shot 2');
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
  const kick = (w) => { const G = WB.newGame(9, { chars: ['gale', 'volt'] }), u = G.units[2]; G.phase = 'flight'; G.proj.push({ id: 997, w, team: 0, from: -1, age: 9, x: u.x - 2, y: u.y - 1, vx: 0, vy: 5, wm: 1 });
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
  ok(G.ss[0] === 1 && !WB.ssReady(G), 'SS starts with one notch on your first turn, not ready');
  ok(G.ss[1] === 1, 'the team going second starts with a one-notch head start');
  ok(!WB.act(G, { k: 'weapon', w: 'ss' }), 'SS can\'t be picked before it is charged');
  for (let i = 0; i < 6; i++) { WB.act(G, { k: 'pass' }); WB.resolve(G); }
  ok(G.team === 0 && WB.ssReady(G) && G.ss[0] === WB.SS_CHARGE, `ready on your ${WB.SS_CHARGE}th turn`);
  ok(WB.act(G, { k: 'weapon', w: 'ss' }) && WB.act(G, { k: 'fire', angle: 60, power: 0.6 }), 'fire the SS');
  ok(G.ss[0] === 0 && G.stats.ss === 1, 'firing it empties the charge');
  WB.resolve(G); WB.act(G, { k: 'pass' }); WB.resolve(G);
  ok(G.ss[0] === 1, 'and it starts charging again');
}
const ssGame = (chars, seed = 11) => { const G = WB.newGame(seed, { chars }); G.ss[G.team] = WB.SS_CHARGE; WB.act(G, { k: 'weapon', w: 'ss' }); return G; };
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
  ok(q && q.hits.length === 2 && foes.every((u, i) => u.hp < before[i]), `Earthquake hits both enemies (${before} → ${foes.map((u) => u.hp)})`);
  ok(G.units.filter((u) => u.team === 0).every((u, i) => u.hp === mine[i]), 'Earthquake doesn\'t touch your own crew far from the blast');
}
{ // Tornado: flings units in reach away from the centre
  const G = ssGame(['gale', 'volt']), foe = G.units.find((u) => u.team === 1), x0 = foe.x, y0 = foe.y;
  G.proj.push({ id: 901, w: 'ss', team: 0, from: -1, age: 9, x: foe.x - 4, y: foe.y - 2, vx: 0, vy: 4, wm: 1 }); G.phase = 'flight';
  let moved = 0; for (let i = 0; i < 4000 && G.phase === 'flight'; i++) { WB.step(G); moved = Math.max(moved, Math.hypot(foe.x - x0, foe.y - y0)); }
  ok(moved > 4 || !foe.alive, `Tornado throws the target away (moved ${moved.toFixed(1)} cells${foe.alive ? '' : ', knocked out'})`);
}
{ // Meteor Slam: the biggest crater
  const crater = (w) => { const G = WB.newGame(5, { chars: ['brick', 'volt'] }), before = G.T.reduce((a, v) => a + v, 0); G.proj.push({ id: 902, w, team: 0, from: -1, age: 9, x: 80, y: WB.surfaceY(G, 80) - 1, vx: 0, vy: 4, wm: 1 }); G.phase = 'flight'; WB.resolve(G); return before - G.T.reduce((a, v) => a + v, 0); };
  ok(crater('ss') > crater('shot2') * 1.3, `Meteor Slam digs ${crater('ss')} cells vs Wrecking Ball ${crater('shot2')}`);
}

// 7. Rising water ends every match: bots that only pass still finish.
{
  const G = WB.newGame(77); let g = 0;
  while (G.phase !== 'over' && g++ < 200) { WB.act(G, { k: 'pass' }); WB.resolve(G); }
  ok(G.phase === 'over' && !G.timeout, `a match of passes ends by rising water (turn ${G.turn})`);
}

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
