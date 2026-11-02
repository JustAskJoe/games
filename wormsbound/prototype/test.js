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
  ok(G.ammo[0].dud === WB.WEAPONS.dud.ammo - 1, 'firing a dud uses one');
}

// 6. A dud ticks down and goes off; a dud in reach can be lobbed.
{
  const G = WB.newGame(5);
  const u = WB.current(G);
  WB.act(G, { k: 'weapon', w: 'dud' }); WB.act(G, { k: 'fire', angle: u.team === 0 ? 80 : 100, power: 0.3 }); WB.resolve(G);
  const d = G.duds[0];
  ok(d && d.fuse === WB.WEAPONS.dud.fuse - 1, 'a fired dud rests with its fuse ticked once');
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

// 7. Rising water ends every match: bots that only pass still finish.
{
  const G = WB.newGame(77); let g = 0;
  while (G.phase !== 'over' && g++ < 200) { WB.act(G, { k: 'pass' }); WB.resolve(G); }
  ok(G.phase === 'over' && !G.timeout, `a match of passes ends by rising water (turn ${G.turn})`);
}

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
