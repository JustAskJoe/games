// node test.js — engine rule checks: determinism, replays, saves, and that act() refuses bad intents.
// © 2026 justaskjoe. All rights reserved.
const WB = require('./engine.js');
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('FAIL', msg); } };
// Let the shot land, then end the retreat that follows it (v3): the turn has passed when this returns.
const endTurn = (G) => { WB.resolve(G); if (G.phase === 'aim' && G.retreat) { WB.act(G, { k: 'pass' }); WB.resolve(G); } };
// A dead-flat map with the floor at row 60 and the units spread along it: abilities can be checked without the terrain getting in the way.
const flatGame = (o = {}, xs) => { const G = WB.newGame(11, Object.assign({ map: { preset: 'hills', hazards: 0, caves: 0, props: 0 }, crates: false, relic: false }, o)); for (let x = 0; x < G.cols; x++) for (let y = 0; y < G.rows; y++) G.T[y * G.cols + x] = y >= 60 ? 1 : 0; G.units.forEach((u, i) => { u.y = 60; u.air = false; u.x = xs ? xs[i] : 40.5 + i * (70 / Math.max(1, G.units.length - 1)); }); G.wind = 0; return G; };
const cells = (G) => G.T.filter((v) => v).length;

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
  ok(!WB.act(G, { k: 'lob', dud: 12345, angle: 45, power: 0.5 }) && !WB.act(G, { k: 'weapon', w: 'dud' }) && !WB.act(G, { k: 'weapon', w: 'gear' }), 'duds, lobs and gear are gone: those intents are refused');
  ok(!WB.act(G, { k: 'jump', dir: 0 }) && !WB.act(G, { k: 'wind' }), 'a jump needs a direction, and only Gale turns the wind');
  let steps = 0; while (WB.act(G, { k: 'move', dir: 1 })) steps++;
  ok(steps <= WB.MOVE_STEPS, `walking stops at ${WB.MOVE_STEPS} steps (walked ${steps})`);
  ok(WB.act(G, { k: 'fire', angle: 60, power: 0.5 }), 'fire the basic shot');
  ok(!WB.act(G, { k: 'fire', angle: 60, power: 0.5 }), 'no second shot while the first is flying');
  WB.resolve(G);
  ok(G.phase !== 'aim' || !G.retreat || G.moves > 0, 'a retreat only happens with steps left');
}

// 6. The turn has three parts now: aim, the shot, then a retreat with what's left of a third of your movement.
{
  const G = WB.newGame(99), u = WB.current(G), t0 = G.turn;
  WB.act(G, { k: 'fire', angle: u.x < G.cols / 2 ? 60 : 120, power: 0.9 }); WB.resolve(G);
  ok(G.phase === 'aim' && G.retreat && WB.current(G) === u && G.turn === t0, 'after the shot lands, the same unit gets a retreat');
  ok(G.moves === Math.ceil(WB.CHARS.volt.steps * WB.RETREAT), `with ${G.moves} steps (a third of ${WB.CHARS.volt.steps})`);
  ok(!WB.act(G, { k: 'fire', angle: 60, power: 0.5 }) && !WB.act(G, { k: 'weapon', w: 'shot2' }), 'no shooting or picking in the retreat');
  const d0 = G.spent; ok(WB.act(G, { k: 'pass' }) && G.spent === d0, 'ending the retreat costs no turn delay');
  WB.resolve(G);
  ok(G.phase === 'aim' && !G.retreat && G.turn === t0 + 1 && WB.current(G) !== u, 'then the turn passes');
  ok(u.delay === WB.CHARS.volt.shot1.delay, 'and the shooter was charged for the shot only');
  const Z = WB.newGame(99, { chars: ['zip', 'volt'] }); WB.act(Z, { k: 'move', dir: 1 }); const left = Z.moves; WB.act(Z, { k: 'fire', angle: 60, power: 0.9 }); WB.resolve(Z);
  ok(Z.retreat && Z.moves === left, `Slippery: Zip keeps all ${left} of her remaining steps`);
  const W = WB.newGame(99); while (WB.act(W, { k: 'move', dir: -1 }) && W.moves > 0); if (W.phase === 'aim') { W.moves = 0; WB.act(W, { k: 'fire', angle: 60, power: 0.9 }); WB.resolve(W); ok(!W.retreat && W.turn === 1, 'no steps left means no retreat: the turn passes at once'); }
  // old duds are a map hazard: they tick down each turn and go off
  const D = WB.newGame(5, { map: { preset: 'hills', hazards: 0 } }), v = WB.current(D);
  D.duds.push({ id: 999, x: v.x + 30, y: WB.surfaceY(D, v.x + 30) - 0.4, fuse: 2, team: null, air: false, vy: 0, old: true });
  let turns = 0; while (D.duds.length && turns++ < 6 && D.phase !== 'over') { WB.act(D, { k: 'pass' }); WB.resolve(D); }
  ok(D.stats.dudBlasts === 1 && turns === 2, `an old dud with 2 on its fuse goes off after ${turns} turns`);
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
  ok(G.moves === WB.CHARS[a].steps && G.units[0].cd.shot2 === 0 && G.units[0].cd.dash === 0, `${a}: steps ${WB.CHARS[a].steps}, ability and move ready at the start`);
  const K = WB.CHARS[a]; ok(K.passive && K.passive.id && K.shot1 && K.shot2.cd >= 2 && K.shot2.verb && K.dash.cd >= 2 && K.dash.kind && K.ss && [K.power, K.jump, K.weight].every((v) => v > 0), `${a}: a whole kit (passive ${K.passive.name}, ${K.shot1.name}, ${K.shot2.name}, ${K.dash.name}, ${K.ss.name}) and six stats`);
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
  ok(G.units[0].cd.shot2 === WB.CHARS.zip.shot2.cd, `Double Tap goes on a ${WB.CHARS.zip.shot2.cd}-turn cooldown`); WB.resolve(G);
}
{ // Drill: tunnels through ground. Fire straight down into the hill you stand on.
  const G = shoot(['digger', 'volt'], 'shot2', 270, 0.6);
  const u = G.units[0], before = G.T.reduce((a, v) => a + v, 0);
  let maxDepth = 0; for (let i = 0; i < 400 && G.proj.length; i++) { WB.step(G); if (G.proj[0]) maxDepth = Math.max(maxDepth, G.proj[0].y - u.y); }
  WB.resolve(G);
  ok(maxDepth > 6 && G.T.reduce((a, v) => a + v, 0) < before, `the Drill bores ${maxDepth.toFixed(1)} cells into the ground before it explodes`);
}
{ // Skipping Stone: skips off the ground with a small blast each time
  const G = flatGame({ chars: ['hopper', 'volt'] }, [30.5, 140.5]); WB.act(G, { k: 'weapon', w: 'shot2' }); WB.act(G, { k: 'fire', angle: 25, power: 0.55 });
  let booms = 0, bounced = false; for (let i = 0; i < 3000 && G.proj.length; i++) { if (G.proj.some((p) => p.bounced)) bounced = true; booms += WB.step(G).filter((e) => e.k === 'boom').length; }
  ok(bounced && booms >= 3, `the Skipping Stone skips, with a blast each time (${booms} blasts)`);
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
  ok(kick('shot2') > kick('shot1') * 1.6, `Gust knockback ${kick('shot2').toFixed(0)} vs Kite Bomb ${kick('shot1').toFixed(0)}`);
}
{ // the bots' aim prediction is exact for bounce and drill shots
  for (const [c, ang, pw] of [['tusk', 60, 0.5], ['digger', 50, 0.55], ['digger', 20, 0.45], ['tusk', 20, 0.3]]) { // a straight-line Hook and a Drill
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
  endTurn(G); let g = 0; while (G.team !== 0 && g++ < 6) { WB.act(G, { k: 'pass' }); WB.resolve(G); } // the delay may give side 1 two turns
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
  ok(crater('ss') > crater('shot1') * 1.3, `Meteor Slam digs ${crater('ss')} cells vs Slug ${crater('shot1')}`);
}

// 10. Turn delay: the lowest delay goes next; heavy shots push your next turn back.
{
  const G = WB.newGame(55, { chars: ['brick', 'zip'] });
  ok(WB.turnOrder(G).map((x) => x.team).join('') === '01', 'the first round alternates the sides');
  const a = WB.current(G); WB.act(G, { k: 'move', dir: 1 }); WB.act(G, { k: 'move', dir: 1 });
  ok(G.spent === 2 * WB.DELAY.move, 'walking adds delay per step');
  ok(WB.delayIf(G, 'ss') > WB.delayIf(G, 'shot1') && WB.delayIf(G, 'pass') < WB.delayIf(G, 'shot1'), 'the SS costs more delay than the basic shot, and passing less');
  WB.act(G, { k: 'weapon', w: 'shot2' }); WB.act(G, { k: 'fire', angle: 60, power: 0.4 }); endTurn(G);
  ok(a.delay === 2 * WB.DELAY.move + WB.CHARS.brick.shot2.delay, `Brick's Bulwark adds ${WB.CHARS.brick.shot2.delay} delay`);
  ok(WB.current(G).team === 1, 'then the other team plays');
}
{ // light shots win extra turns: Zip firing Darts against Brick firing Slugs gets more turns over a match
  const G = WB.newGame(56, { chars: ['zip', 'brick'] }); const turns = [0, 0];
  // everyone fires off the edge of the map (no damage), so only the delays decide the turn order
  for (let i = 0; i < 40 && G.phase !== 'over'; i++) { turns[G.team]++; WB.act(G, { k: 'fire', angle: G.team ? 4 : 176, power: 1 }); endTurn(G); }
  ok(turns[0] > turns[1], `Zip (Dart, ${WB.CHARS.zip.shot1.delay}) gets more turns than Brick (Slug, ${WB.CHARS.brick.shot1.delay}): ${turns[0]} vs ${turns[1]}`);
}
{ // a team can play twice in a row if the other team throws heavy shots
  const G = WB.newGame(57, { chars: ['volt', 'volt'] }); let twice = false, last = -1;
  for (let i = 0; i < 16 && G.phase !== 'over'; i++) {
    if (G.team === last) twice = true; last = G.team;
    if (G.team === 1) { G.units[1].ss = WB.SS_CHARGE; WB.act(G, { k: 'weapon', w: 'ss' }); WB.act(G, { k: 'fire', angle: 4, power: 1 }); } else WB.act(G, { k: 'fire', angle: 176, power: 1 });
    endTurn(G);
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
  ok(u0.cd.shot2 > 0 && mate.cd.shot2 === 0, 'cooldowns are per unit: one unit using its ability leaves its crewmates ready');
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

// 8c. v3 kits: ten characters in five classes; an ability and a move ability on cooldowns; jumps; passives.
{
  const cls = {}; for (const c of WB.CHAR_IDS) (cls[WB.CHARS[c].cls] = cls[WB.CHARS[c].cls] || []).push(c);
  ok(WB.CHAR_IDS.length === 10 && Object.keys(cls).length === 5 && Object.values(cls).every((v) => v.length === 2), `10 characters, 2 in each of 5 classes (${Object.entries(cls).map(([k, v]) => k + ': ' + v.join(' + ')).join('; ')})`);
  ok(WB.GEAR_IDS === undefined && WB.WEAPON_IDS.join() === 'shot1,shot2,dash,ss', 'no gear list; four slots: basic, ability, move, SS');
  ok(new Set(WB.CHAR_IDS.map((c) => WB.CHARS[c].passive.id)).size === 10, 'ten different passives');
  const use = (G, w, angle, power = 0.7) => WB.act(G, { k: 'weapon', w }) && WB.act(G, { k: 'fire', angle, power });
  { // cooldowns: counted in the unit's own turns
    const G = flatGame({ chars: ['volt', 'brick'] }), u = G.units[0]; use(G, 'shot2', 80, 0.2); endTurn(G);
    const seen = []; for (let i = 0; i < 12 && seen.length < 4; i++) { if (WB.current(G) === u) seen.push(u.cd.shot2); WB.act(G, { k: 'pass' }); WB.resolve(G); }
    ok(seen.join() === '2,1,0,0' && WB.CHARS.volt.shot2.cd === 3, `Thunderstrike is ready again on Volt's third turn after it (left at each of his turns: ${seen})`);
    const H = flatGame({ chars: ['volt', 'brick'] }); use(H, 'shot2', 80, 0.2); endTurn(H); while (WB.current(H) !== H.units[0]) { WB.act(H, { k: 'pass' }); WB.resolve(H); }
    ok(!WB.act(H, { k: 'weapon', w: 'shot2' }) && !WB.ready(H, 'shot2') && WB.ready(H, 'shot1'), 'an ability on cooldown can\'t be picked');
  }
  { // jumping: costs steps, lands you further on, and the turn carries on
    const G = flatGame({ chars: ['volt', 'hopper'] }), u = G.units[0], x0 = u.x, m0 = G.moves;
    ok(WB.act(G, { k: 'jump', dir: 1 }) && G.phase === 'flight', 'a jump takes off');
    let top = 99; for (let i = 0; i < 600 && G.phase === 'flight'; i++) { WB.step(G); top = Math.min(top, u.y); }
    ok(G.phase === 'aim' && !G.retreat && WB.current(G) === u && u.x > x0 + 5 && G.moves === m0 - WB.JUMP.cost && u.hp === u.maxHp, `a jump lands ${(u.x - x0).toFixed(1)} cells on, costs ${WB.JUMP.cost} steps and the turn carries on`);
    WB.act(G, { k: 'pass' }); WB.resolve(G);
    const h = G.units[1]; WB.act(G, { k: 'jump', dir: -1 }); let top2 = 99; for (let i = 0; i < 600 && G.phase === 'flight'; i++) { WB.step(G); top2 = Math.min(top2, h.y); }
    ok(60 - top2 > (60 - top) * 1.7, `Springy: Hopper jumps ${(60 - top2).toFixed(1)} cells high, Volt ${(60 - top).toFixed(1)}`);
    G.moves = 2; ok(!WB.act(G, { k: 'jump', dir: 1 }), 'no jump without the steps for it');
  }
  { // a move ability doesn't end the turn
    const G = flatGame({ chars: ['tusk', 'volt'] }, [40.5, 140.5]), u = G.units[0], x0 = u.x;
    ok(use(G, 'dash', 55, 0.7), 'Leap Slam takes off'); const before = cells(G); WB.resolve(G);
    ok(G.phase === 'aim' && !G.retreat && WB.current(G) === u && u.x > x0 + 8 && u.cd.dash === 3 && G.weapon === 'shot1', `Leap Slam lands ${(u.x - x0).toFixed(1)} cells on and Tusk can still shoot`);
    ok(cells(G) < before && u.hp === u.maxHp, 'it blasts a crater where he lands and doesn\'t hurt him');
    ok(WB.act(G, { k: 'fire', angle: 60, power: 0.5 }), 'and he fires after it');
  }
  { // Charge: runs along the ground and shoves the first enemy
    const G = flatGame({ chars: ['brick', 'volt'] }, [40.5, 47.5]), u = G.units[0], foe = G.units[1], hp = foe.hp;
    use(G, 'dash', 0, 1); let far = foe.x; for (let i = 0; i < 2000 && G.phase === 'flight'; i++) { WB.step(G); far = Math.max(far, foe.x); }
    ok(u.x > 42 && far > 50 && foe.hp < hp, `Charge runs Brick into Volt and shoves him ${(far - 47.5).toFixed(1)} cells (${hp} → ${foe.hp})`);
  }
  { // Blink, Cloud Ride, Burrow, and the gliders
    const B = flatGame({ chars: ['volt', 'brick'] }), v = B.units[0], bx = v.x; use(B, 'dash', 20, 1); WB.resolve(B);
    ok(Math.abs(v.x - bx - 8 * Math.cos(20 * Math.PI / 180)) < 0.6 && Math.abs(v.y - 60) < 0.5 && v.hp === v.maxHp, `Blink puts Volt ${(v.x - bx).toFixed(1)} cells along and he drops unhurt`);
    const C = flatGame({ chars: ['nimbus', 'brick'] }), n = C.units[0], nx = n.x; for (let x = 45; x < 52; x++) for (let y = 60; y < C.rows; y++) C.T[y * C.cols + x] = 0; // a gap to the water
    use(C, 'dash', 0, 1); WB.resolve(C);
    ok(n.alive && n.x > nx + 12 && Math.abs(n.y - 60) < 0.5, `Cloud Ride carries Nimbus ${(n.x - nx).toFixed(1)} cells across a gap`);
    const D = flatGame({ chars: ['digger', 'brick'] }), d = D.units[0], dx = d.x, c0 = cells(D); use(D, 'dash', 320, 1); WB.resolve(D);
    ok(d.alive && d.x > dx + 4 && d.y > 63 && cells(D) < c0 - 20, `Burrow digs Digger down and along (now ${(d.x - dx).toFixed(1)} across, ${(d.y - 60).toFixed(1)} down)`);
    for (const c of ['zip', 'gale', 'patch', 'hopper', 'flint']) { const G = flatGame({ chars: [c, 'brick'] }, [40.5, 140.5]), u = G.units[0], x0 = u.x; use(G, 'dash', 50, 0.7); WB.resolve(G);
      ok(G.phase === 'aim' && WB.current(G) === u && u.x > x0 + 6 && u.hp >= u.maxHp - 5, `${c}: ${WB.CHARS[c].dash.name} carries it ${(u.x - x0).toFixed(1)} cells (health ${u.hp}/${u.maxHp})`); }
    const F = flatGame({ chars: ['flint', 'brick'] }, [40.5, 43.5]), f = F.units[0], near = F.units[1], h0 = near.hp; use(F, 'dash', 120, 0.7); WB.resolve(F);
    ok(f.hp === f.maxHp - 5 && near.hp < h0, `Rocket Jump costs Flint 5 and hurts whoever was beside him (${h0} → ${near.hp})`);
  }
  { // Bulwark and Bridge build; nobody is hurt or buried
    const G = flatGame({ chars: ['brick', 'volt'] }, [40.5, 46.5]), c0 = cells(G), foe = G.units[1], hp = foe.hp; use(G, 'shot2', 20, 0.5);
    ok(cells(G) === c0 + 21 - 0 || cells(G) > c0 + 10, `Bulwark raises a wall (${cells(G) - c0} cells)`);
    ok([44, 45, 46].some((x) => WB.solidAt(G, x + 0.5, 55.5)) && foe.hp === hp && !WB.solidAt(G, foe.x, foe.y - 1.5), 'in front of him, without burying or hurting the unit standing there');
    WB.resolve(G); ok(G.retreat, 'building is his shot: the retreat follows');
    const P = flatGame({ chars: ['patch', 'volt'] }), p0 = cells(P); P.proj.push({ id: 951, w: 'shot2', team: 0, char: 'patch', from: -1, age: 9, x: 80, y: 52, vx: 0, vy: 3, wm: 1 }); for (let y = 56; y < 60; y++) P.T[y * P.cols + 80] = 1; P.phase = 'flight'; WB.resolve(P);
    const span = P.T.filter((v) => v === WB.MapGen.PROP).length;
    ok(span >= 16 && cells(P) >= p0 + 16, `Bridge lays a span (${span} cells) where it lands`);
  }
  { // Hook drags the first enemy it touches towards Tusk
    const G = flatGame({ chars: ['tusk', 'volt'] }, [40.5, 52.5]), foe = G.units[1], hp = foe.hp; use(G, 'shot2', 2, 1);
    let near = foe.x; for (let i = 0; i < 3000 && G.phase === 'flight'; i++) { WB.step(G); near = Math.min(near, foe.x); }
    ok(near < 49 && foe.hp < hp, `Hook drags Volt ${(52.5 - near).toFixed(1)} cells towards Tusk (${hp} → ${foe.hp})`);
    const M = flatGame({ chars: ['tusk', 'volt'] }, [40.5, 80.5]); use(M, 'shot2', 2, 1); WB.resolve(M); ok(M.units[1].hp === M.units[1].maxHp, 'and runs out after 16 cells');
  }
  { // Fire Wall: ending a turn standing in it hurts
    const G = flatGame({ chars: ['flint', 'volt'] }), foe = G.units[1]; G.proj.push({ id: 952, w: 'shot2', team: 0, char: 'flint', from: -1, age: 9, x: foe.x + 3, y: 56, vx: 0, vy: 3, wm: 1 }); G.phase = 'flight'; G.shooter = G.units[0].id; WB.resolve(G);
    ok(G.zones.length === 1, 'Fire Wall leaves fire on the ground');
    while (WB.current(G) !== foe) { WB.act(G, { k: 'pass' }); WB.resolve(G); } const hp = foe.hp; foe.burn = 0; WB.act(G, { k: 'pass' }); WB.resolve(G);
    ok(foe.hp === hp - WB.CHARS.flint.shot2.zone.dmg, `ending a turn in it costs ${hp - foe.hp}`);
    let g = 0; while (G.zones.length && g++ < 12) { WB.act(G, { k: 'pass' }); WB.resolve(G); } ok(!G.zones.length && g <= 6, `and it burns out (${g} more turns)`);
  }
  { // Delay Ray puts an enemy's next turn off
    const G = flatGame({ chars: ['nimbus', 'volt'] }), foe = G.units[1], d0 = foe.delay; G.proj.push({ id: 953, w: 'shot2', team: 0, char: 'nimbus', from: -1, age: 9, x: foe.x, y: 58, vx: 0, vy: 3, wm: 1 }); G.phase = 'flight'; WB.resolve(G);
    ok(foe.delay >= d0 + 300, `Delay Ray adds 300 turn delay to an enemy it catches (${d0} → ${foe.delay})`);
  }
  // passives. hit(): one basic shell from G.units[0] landing right beside G.units[1].
  const hit = (G, w = 'shot1') => { const a = G.units[0], foe = G.units[1]; G.actor = a.id; G.team = a.team; G.shooter = a.id; G.phase = 'flight'; G.proj.push({ id: ++G._id, w, team: a.team, char: a.char, from: -1, age: 9, x: foe.x + 3, y: 57, vx: 0, vy: 3, wm: 1 }); let t = 0; while (G.proj.length && t++ < 4000) WB.step(G); };
  { const lostTo = (c) => { const G = flatGame({ chars: ['gale', c] }), foe = G.units[1]; G.proj.push({ id: 954, w: 'shot2', team: 0, char: 'gale', from: -1, age: 9, x: foe.x - 2, y: 59, vx: 0, vy: 5, wm: 1 }); G.phase = 'flight'; let top = 0; for (let i = 0; i < 60; i++) { WB.step(G); top = Math.max(top, Math.hypot(foe.vx, foe.vy)); } return top; };
    ok(lostTo('brick') < lostTo('volt') * 0.6, `Plated: the same Gust moves Brick at ${lostTo('brick').toFixed(0)}, Volt at ${lostTo('volt').toFixed(0)}`); }
  { const G = flatGame({ chars: ['flint', 'volt'] }), foe = G.units[1]; foe.hp = foe.maxHp = 9999; hit(G); WB.resolve(G);
    ok(foe.burn === 2, 'Burn: a hit from Flint sets a 2-turn burn'); while (WB.current(G) !== foe) { WB.act(G, { k: 'pass' }); WB.resolve(G); }
    const h1 = foe.hp + WB.BURN; WB.act(G, { k: 'pass' }); WB.resolve(G); while (WB.current(G) !== foe) { WB.act(G, { k: 'pass' }); WB.resolve(G); }
    ok(foe.burn === 0 && foe.hp === h1 - 2 * WB.BURN, `it bites for ${WB.BURN} at the start of each of the next two turns, then stops`); }
  { const G = flatGame({ chars: ['nimbus', 'volt'] }), foe = G.units[1]; foe.hp = foe.maxHp = 9999; hit(G); WB.resolve(G); while (WB.current(G) !== foe) { WB.act(G, { k: 'pass' }); WB.resolve(G); }
    ok(G.moves === Math.ceil(WB.CHARS.volt.steps / 2), `Drizzle: a unit Nimbus hit has ${G.moves} steps on its next turn, not ${WB.CHARS.volt.steps}`); WB.act(G, { k: 'pass' }); WB.resolve(G); while (WB.current(G) !== foe) { WB.act(G, { k: 'pass' }); WB.resolve(G); } ok(G.moves === WB.CHARS.volt.steps, 'and all of them the turn after'); }
  { const G = flatGame({ chars: ['volt', 'brick'] }), foe = G.units[1]; foe.hp = foe.maxHp = 9999; const d = []; for (let i = 0; i < 3; i++) { const h = foe.hp; hit(G); d.push(h - foe.hp); for (let x = 0; x < G.cols; x++) for (let y = 0; y < G.rows; y++) G.T[y * G.cols + x] = y >= 60 ? 1 : 0; foe.vx = foe.vy = 0; foe.x = 110.5; foe.y = 60; foe.air = false; }
    ok(d[0] === d[1] && d[2] === d[0] + Math.round(d[0] * 0.5), `Charged: Volt's third hit does half as much again (${d})`); }
  { const G = flatGame({ chars: ['gale', 'volt'] }); G.wind = 3; ok(WB.act(G, { k: 'wind' }) && G.wind === -3 && !WB.act(G, { k: 'wind' }), 'Tailwind: Gale turns the wind round, once a turn');
    WB.act(G, { k: 'pass' }); WB.resolve(G); ok(!WB.act(G, { k: 'wind' }), 'nobody else can'); }
  { const G = flatGame({ chars: ['patch', 'volt', 'brick', 'brick'], size: 2 }, [40.5, 43.5, 100.5, 110.5]), p = G.units.find((u) => u.char === 'patch'), mate = G.units.find((u) => u.team === p.team && u !== p); p.hp -= 20; mate.hp -= 20; const a = p.hp, b = mate.hp;
    let g = 0; do { WB.act(G, { k: 'pass' }); WB.resolve(G); } while (WB.current(G) !== p && g++ < 8);
    ok(p.hp === a + 3 && mate.hp === b + 6, `Field Repairs: at the start of Patch's turn he heals 3 and a crewmate beside him 6`); }
  { const G = flatGame({ chars: ['hopper', 'volt'] }), u = G.units[0]; u.y = 20; u.air = true; G.phase = 'flight'; G.mid = true; WB.resolve(G); ok(u.hp === u.maxHp, 'Springy: Hopper takes no fall damage');
    const H = flatGame({ chars: ['volt', 'hopper'] }), v = H.units[0]; v.y = 20; v.air = true; H.phase = 'flight'; H.mid = true; WB.resolve(H); ok(v.hp < v.maxHp, 'the same fall hurts Volt'); }
  { const wall = (G) => { for (let x = 44; x < 46; x++) for (let y = 50; y < 60; y++) G.T[y * G.cols + x] = 1; };
    const G = flatGame({ chars: ['digger', 'volt'] }); wall(G); let n = 0; while (WB.act(G, { k: 'move', dir: 1 }) && n++ < 10); ok(G.units[0].x > 46, `Tunneller: Digger walks through a wall 2 thick (reached ${G.units[0].x})`);
    const H = flatGame({ chars: ['volt', 'digger'] }); wall(H); n = 0; while (WB.act(H, { k: 'move', dir: 1 }) && n++ < 10); ok(H.units[0].x < 44, 'Volt is stopped by it'); }
  { const G = flatGame({ chars: ['tusk', 'volt'] }); for (let i = 0; i < 8; i++) WB.act(G, { k: 'move', dir: 1 }); WB.act(G, { k: 'fire', angle: 60, power: 0.5 });
    ok(Math.abs(G.proj[0].kb - 1.2) < 1e-9, 'Momentum: 8 cells walked makes Tusk\'s shove 20% harder'); }
  { // a recharge crate readies both cooldowns
    const G = flatGame({ chars: ['volt', 'brick'] }), u = G.units[0]; u.cd.shot2 = 2; u.cd.dash = 3; G.crates.push({ id: 955, x: u.x + 2, y: 60, kind: 'cool', air: false, vy: 0 }); WB.act(G, { k: 'move', dir: 1 });
    ok(u.cd.shot2 === 0 && u.cd.dash === 0 && !G.crates.length, 'a recharge crate makes the ability and the move ready now'); }
  // every pair of characters plays a whole match that finishes and replays exactly, and uses its kit
  let bad = [], used = { shot2: 0, dash: 0, retreats: 0 };
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) { const o = { chars: [WB.CHAR_IDS[i], WB.CHAR_IDS[j]] }, { G: F, log } = WB.playOut(WB.newGame(777 + i * 31 + j, o), ['smart', 'smart']); for (const k in used) used[k] += F.stats[k]; if (F.phase !== 'over' || WB.hash(WB.replay(777 + i * 31 + j, log, o)) !== WB.hash(F)) bad.push(o.chars.join('/')); }
  ok(!bad.length, `all 45 pairings finish and replay exactly ${bad.slice(0, 3)}`);
  ok(used.shot2 > 60 && used.retreats > 300, `the computer uses abilities and retreats (in 45 one-screen matches: ${used.shot2} abilities, ${used.dash} moves, ${used.retreats} retreats)`);
  { let mv = 0; for (let s2 = 1; s2 <= 4; s2++) mv += WB.playOut(WB.newGame(s2 * 31337, { size: 5, recipe: 'teams' }), ['smart', 'smart']).G.stats.dash; ok(mv >= 4, `and its move abilities to cross big maps (${mv} in four 5v5 matches)`); }
  const { G: K } = WB.playOut(WB.newGame(4242, { chars: ['zip', 'flint'] }), ['basic', 'basic']); ok(K.stats.shot2 === 0 && K.stats.dash === 0, "the 'basic' bot style never touches its kit");
}

// 8c2. The Relic: lands in the middle after about three turns each; the last hit takes it for that side.
{
  const pass = (G) => { WB.act(G, { k: 'pass' }); WB.resolve(G); };
  const shell = (G, by, x, y, w = 'shot1') => { G.actor = by.id; G.team = by.team; G.shooter = by.id; G.phase = 'flight'; G.proj.push({ id: ++G._id, w, team: by.team, char: by.char, from: -1, age: 9, x, y, vx: 0, vy: 3, wm: 1 }); let t = 0; while (G.proj.length && t++ < 4000) WB.step(G); };
  const G = flatGame({ relic: true, chars: ['volt', 'brick'] }), q = G.relic;
  ok(q.state === 'wait' && q.at === 6, 'the Relic is due on turn 6 of a 1v1 (three turns each)');
  let landed = null; for (let i = 0; i < 6; i++) { WB.act(G, { k: 'pass' }); let t = 0; while (G.phase === 'flight' && t++ < 4000) for (const e of WB.step(G)) if (e.k === 'relic') landed = e; }
  ok(q.state === 'live' && landed && G.turn === 6 && Math.abs(q.x - G.cols / 2) < 6 && q.y === 60 && q.hp === WB.RELIC.hp, `it lands on turn ${G.turn} in the middle (x ${q.x}) with ${q.hp} health`);
  const a = G.units[0], b = G.units[1], ss0 = [a.ss, b.ss];
  shell(G, a, q.x + 1, 56); ok(q.state === 'live' && q.hp < WB.RELIC.hp && q.hp > 0, `a shell beside it wears it down (${WB.RELIC.hp} → ${q.hp})`);
  G.barrels.push({ id: 970, x: q.x + 2, y: 60, air: false, vy: 0, chain: true }); G.phase = 'flight'; q.hp = 5; WB.resolve(G);
  ok(q.state === 'live' && q.hp === 1, 'a barrel can wear it down but never take it');
  shell(G, b, q.x, 56);
  ok(q.state === 'taken' && q.team === 1 && G.stats.relic === 1 && b.ss === Math.min(WB.SS_CHARGE, ss0[1] + 1) && a.ss === ss0[0], 'the last hit takes it: a notch of SS for that side only');
  const dmgTo = (taken) => { const H = flatGame({ relic: true, chars: ['volt', 'volt'] }), foe = H.units[0], sh = H.units[1]; foe.hp = foe.maxHp = 9999; if (taken) { H.relic.state = 'taken'; H.relic.team = 1; } shell(H, sh, foe.x + 2, 57); return 9999 - foe.hp; };
  ok(dmgTo(true) === Math.round(dmgTo(false) * WB.RELIC.power), `and +10% Power: the same shell does ${dmgTo(true)} instead of ${dmgTo(false)}`);
  { const H = flatGame({ relic: true }); H.relic.state = 'live'; H.relic.x = 80.5; H.relic.y = 60; for (let x = 76; x < 86; x++) for (let y = 60; y < H.rows; y++) H.T[y * H.cols + x] = 0; H.phase = 'flight'; H.mid = true; WB.resolve(H);
    ok(H.relic.state === 'lost', 'with the ground gone from under it, it falls into the water and nobody gets it'); }
  ok(WB.newGame(5, { relic: false }).relic === null, 'opts.relic: false turns it off');
  let took = 0, n = 0, bad = 0;
  for (let s = 1; s <= 30; s++) { const o = { chars: [WB.CHAR_IDS[s % 10], WB.CHAR_IDS[(s * 7 + 3) % 10]] }, { G: F, log } = WB.playOut(WB.newGame(s * 6007, o), ['smart', 'smart']); n++; if (F.relic.state === 'taken') took++; if (F.phase !== 'over' || WB.hash(WB.replay(s * 6007, log, o)) !== WB.hash(F)) bad++; }
  ok(bad === 0 && took >= 5, `30 matches with the Relic finish and replay exactly; the computer took it in ${took}`);
}

// 8d. v2 mid-match: supply crates and crew combos.
{
  const flat = (o) => { const G = WB.newGame(11, Object.assign({ map: { preset: 'hills', hazards: 0, caves: 0, props: 0 } }, o)); for (let x = 0; x < G.cols; x++) for (let y = 0; y < G.rows; y++) G.T[y * G.cols + x] = y >= 60 ? 1 : 0; G.units.forEach((u, i) => { u.y = 60; u.air = false; u.x = 30.5 + i * (100 / Math.max(1, G.units.length - 1)); }); return G; };
  const pass = (G) => { WB.act(G, { k: 'pass' }); WB.resolve(G); };
  { // a crate lands once everyone has had a turn, between the sides, clear of everyone
    const G = flat({}); ok(G.crates.length === 0 && WB.crateFirst(G) === 2, 'no crate at the start; the first is due on turn 2 of a 1v1');
    pass(G); pass(G);
    const c = G.crates[0];
    ok(G.crates.length === 1 && WB.CRATE_KINDS.includes(c.kind) && c.x > 30 && c.x < 131 && G.units.every((u) => Math.abs(u.x - c.x) >= 3) && WB.solidAt(G, c.x, c.y + 0.5), `a ${c && c.kind} crate lands at x ${c && c.x}, between the two units`);
    ok(G.units.some((u) => Math.abs(u.x - c.x) <= 16), 'within a turn\'s walk of one of them');
    // walk onto it
    const u = G.units.reduce((a, b) => (Math.abs(a.x - c.x) < Math.abs(b.x - c.x) ? a : b)); while (WB.current(G) !== u) pass(G);
    u.cd.shot2 = 2; u.cd.dash = 2; const before = { ss: u.ss, hp: (u.hp = Math.round(u.maxHp / 2)) }, dir = c.x > u.x ? 1 : -1, kind = c.kind;
    G.moves = 30; let guard = 0; while (G.crates.some((q) => q.id === c.id) && guard++ < 30) WB.act(G, { k: 'move', dir });
    ok(!G.crates.some((q) => q.id === c.id) && G.stats.crates[u.team] === 1, 'walking onto a crate opens it');
    ok(kind === 'cool' ? u.cd.shot2 === 0 && u.cd.dash === 0 : kind === 'ss' ? u.ss === Math.min(WB.SS_CHARGE, before.ss + WB.CRATE.ss) : u.hp > before.hp, `and gives what it showed (${kind})`);
  }
  { // a blast right on a crate destroys it; a nearby one doesn't
    const G = flat({}); pass(G); pass(G); const c = G.crates[0];
    G.phase = 'flight'; G.proj.push({ id: 960, w: 'shot1', team: 0, char: 'volt', from: -1, age: 9, x: c.x + 7, y: 58, vx: 0, vy: 3, wm: 1 }); WB.resolve(G);
    ok(G.crates.some((q) => q.id === c.id), 'a blast 7 cells away leaves the crate');
    G.phase = 'flight'; G.proj.push({ id: 961, w: 'shot1', team: 0, char: 'volt', from: -1, age: 9, x: c.x, y: c.y - 3, vx: 0, vy: 3, wm: 1 }); WB.resolve(G);
    ok(!G.crates.some((q) => q.id === c.id) && G.stats.cratesLost === 1, 'a blast on the crate destroys it: nobody gets it');
  }
  { const G = flat({ crates: false }); for (let i = 0; i < 8; i++) pass(G); ok(G.crates.length === 0, 'opts.crates: false turns them off'); }
  { // crates lean towards the side that is behind
    let near = 0, n = 0;
    for (let s = 1; s <= 40; s++) { const G = WB.newGame(s * 977, { map: 'hills' }); G.units[0].hp = Math.round(G.units[0].maxHp * 0.3); pass(G); pass(G); const c = G.crates[0]; if (!c) continue; n++; if (Math.abs(c.x - G.units[0].x) < Math.abs(c.x - G.units[1].x)) near++; }
    ok(n > 25 && near / n > 0.8, `a crate lands nearer the unit that's behind on health (${near} of ${n})`);
  }
  { // combo: a second crewmate's hit on the same enemy, before that enemy's next turn, charges the shooter's SS
    const G = flat({ size: 2, crates: false }), foe = G.units.find((u) => u.team === 1), a = G.units.find((u) => u.team === 0), b = G.units.find((u) => u.team === 0 && u !== a);
    const hit = (by) => { G.actor = by.id; G.team = by.team; G.shooter = by.id; G.combo = false; G.phase = 'flight'; G.proj.push({ id: ++G._id, w: 'shot1', team: by.team, char: by.char, from: -1, age: 9, x: foe.x + 3, y: 57, vx: 0, vy: 3, wm: 1 }); const ss = by.ss; let t = 0; while (G.proj.length && t++ < 4000) WB.step(G); return by.ss - ss; };
    foe.hp = foe.maxHp = 9999;
    const first = hit(a), again = hit(a), second = hit(b);
    ok(first === 0 && again === 0 && second === 1 && G.stats.combos === 1, `a crewmate following up on the same enemy gets a notch of SS (first hit ${first}, same unit again ${again}, crewmate ${second})`);
  }
  let bad = 0, opened = 0;
  for (let s = 1; s <= 30; s++) { const o = { chars: [WB.CHAR_IDS[s % 10], WB.CHAR_IDS[(s * 3) % 10]] }, { G: F, log } = WB.playOut(WB.newGame(s * 5557, o), ['smart', 'smart']); opened += F.stats.crates[0] + F.stats.crates[1]; if (F.phase !== 'over' || WB.hash(WB.replay(s * 5557, log, o)) !== WB.hash(F)) bad++; }
  ok(bad === 0 && opened > 5, `30 matches with crates finish and replay exactly (${opened} crates opened)`);
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
