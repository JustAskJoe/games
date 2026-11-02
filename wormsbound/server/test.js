// node test.js: the room's rules, with two in-process players speaking the real message protocol.
// Each player keeps its own copy of the game (as the browser does), replays what the server says was played, and
// checks its checksum against the server's after every move.
// © 2026 justaskjoe. All rights reserved.
'use strict';
const WB = require('../prototype/engine.js');
const { Room, TURN_LIMIT_MS } = require('./room.js');
let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('FAIL', msg); } };

// A test player: a connection plus a replica of the game built only from server messages.
function player(room, name) {
  const P = { inbox: [], seat: -1, G: null, desyncs: 0, errors: [], token: null, aims: [] };
  P.conn = room.connect((m) => {
    P.inbox.push(m);
    if (m.t === 'joined') { P.seat = m.seat; P.token = m.token; }
    if (m.t === 'round') P.G = WB.newGame(m.seed, m.opts);
    if (m.t === 'state' && m.G) P.G = m.G;
    if (m.t === 'applied') { WB.act(P.G, m.it); if (P.G.phase === 'flight') WB.resolve(P.G); if (WB.hash(P.G) !== m.hash) P.desyncs++; }
    if (m.t === 'error') P.errors.push(m.error);
    if (m.t === 'aim') P.aims.push(m);
  });
  P.send = (m) => P.conn.onMessage(JSON.stringify(m));
  P.name = name;
  return P;
}
// On your turn, decide like a bot on a copy of your replica and send the moves.
function botMove(P, style = 'smart') {
  const plan = WB.botTurn(JSON.parse(JSON.stringify(P.G)), style);
  for (const it of plan) P.send({ t: 'act', it });
}

{ // a whole best-of-3 between two bot players, with every checksum matching
  const room = new Room('TEST', { seed: 12345 });
  const A = player(room, 'Ana'), B = player(room, 'Ben');
  A.send({ t: 'create', name: 'Ana' }); B.send({ t: 'join', name: 'Ben' });
  ok(A.seat === 0 && B.seat === 1, 'create takes seat 0, join takes seat 1');
  const C = player(room, 'Cy'); C.send({ t: 'join', name: 'Cy' });
  ok(C.errors.includes('that room is full'), 'a third player is turned away');
  A.send({ t: 'ready', on: true });
  ok(A.errors.includes('pick a character first'), 'you must pick before readying');
  A.send({ t: 'pick', char: 'zip' }); B.send({ t: 'pick', char: 'brick' });
  B.send({ t: 'pick', char: 'chuck norris' }); ok(B.errors.includes('no such character'), 'only real characters can be picked');
  A.send({ t: 'ready', on: true }); ok(room.phase === 'lobby', 'one ready player doesn\'t start the match');
  B.send({ t: 'ready', on: true }); ok(room.phase === 'playing' && A.G && B.G, 'both ready: the match starts and both build round 1');
  ok(WB.hash(A.G) === WB.hash(room.G) && WB.hash(B.G) === WB.hash(room.G), 'both copies of round 1 match the server');
  ok(A.G.chars.join() === 'zip,brick', 'each side plays its pick');

  // cheating and mistakes
  const other = room.G.team === 0 ? B : A, mover = room.G.team === 0 ? A : B;
  other.send({ t: 'act', it: { k: 'fire', angle: 45, power: 1 } }); ok(other.errors.includes('not your turn'), 'you can\'t play on the other side\'s turn');
  mover.send({ t: 'act', it: { k: 'teleport' } }); ok(mover.errors.includes('not a move'), 'unknown moves are refused');
  mover.send({ t: 'act', it: { k: 'weapon', w: 'ss' } }); ok(mover.errors.includes('that move isn\'t allowed'), 'an uncharged SS is refused by the engine');
  mover.send({ t: 'act', it: { k: 'fire', angle: 'lots', power: 2 } }); ok(mover.errors.length >= 3, 'a shot with no real angle is refused');
  mover.send({ t: 'aim', angle: 60, power: 0.5 });
  ok(other.aims.length === 1 && mover.aims.length === 0, 'your aim is shown to the other player only');
  A.conn.onMessage('x'.repeat(5000)); ok(A.errors.includes('message too big'), 'oversized messages are dropped');

  // play it out
  let guard = 0;
  while (room.phase !== 'matchover' && guard++ < 600) {
    if (room.phase === 'roundover') { A.send({ t: 'next' }); B.send({ t: 'next' }); continue; }
    botMove(room.G.team === 0 ? A : B);
  }
  ok(room.phase === 'matchover' && Math.max(...room.wins) === 2, `the match finishes (wins ${room.wins.join('-')}, ${room.round} rounds)`);
  ok(A.desyncs === 0 && B.desyncs === 0, `no checksum ever disagrees (${A.inbox.filter((m) => m.t === 'applied').length} moves)`);
  ok(A.inbox.some((m) => m.t === 'roundover' && m.match), 'both hear that the match is over');

  // rematch
  A.send({ t: 'rematch' }); ok(room.phase === 'matchover', 'one rematch request isn\'t enough');
  B.send({ t: 'rematch' }); ok(room.phase === 'playing' && room.round === 1 && room.wins.join() === '0,0', 'both want a rematch: a new match starts');
}

{ // dropping out and coming back, and the clock
  const room = new Room('DROP', { seed: 99 });
  const A = player(room, 'A'), B = player(room, 'B');
  A.send({ t: 'create', name: 'A' }); B.send({ t: 'join', name: 'B' });
  A.send({ t: 'pick', char: 'volt' }); B.send({ t: 'pick', char: 'gale' }); A.send({ t: 'ready', on: true }); B.send({ t: 'ready', on: true });
  const turnTeam = room.G.team, P = turnTeam === 0 ? A : B;
  P.conn.onClose(); ok(room.seats[turnTeam].connected === false, 'a dropped player shows as disconnected');
  const back = player(room, 'again'); back.send({ t: 'rejoin', token: P.token });
  ok(back.seat === turnTeam && back.G && WB.hash(back.G) === WB.hash(room.G), 'rejoining with your token gives you your seat and the current game');
  const bad = player(room, 'x'); bad.send({ t: 'rejoin', token: 'nope' }); ok(bad.errors.includes('that seat has gone'), 'a wrong token can\'t take a seat');
  const t0 = room.G.turn; room.tick(Date.now() + TURN_LIMIT_MS + 1);
  ok(room.G.turn === t0 + 1 || room.G.phase === 'over', 'a turn nobody plays is passed when the clock runs out');
  const Z = player(room, 'z'); Z.send({ t: 'create', name: 'z' }); ok(Z.errors.includes('code in use'), 'creating a room whose code is taken says so');
}

{ // join before anyone created the room
  const room = new Room('NONE'); const P = player(room, 'p'); P.send({ t: 'join', name: 'p' });
  ok(P.errors.includes('no room with that code'), 'joining an empty code says there is no room');
}

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
