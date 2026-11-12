// node test.js: the room's rules, with two in-process players speaking the real message protocol.
// Each player keeps its own copy of the game (as the browser does), replays what the server says was played, and
// checks its checksum against the server's after every move.
// © 2026 justaskjoe. All rights reserved.
'use strict';
const WB = require('../prototype/engine.js');
const { Room, TURN_LIMIT_MS, GONE_LIMIT_MS } = require('./room.js');
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

{ // free-for-all: up to 6 players, the host starts, one round, then back to the lobby
  const room = new Room('FFA6', { seed: 4242 });
  const names = ['Ana', 'Ben', 'Cy', 'Dee', 'Eli', 'Fay'], P = names.map((n) => player(room, n));
  P[0].send({ t: 'create', name: 'Ana', mode: 'ffa' });
  ok(room.mode === 'ffa' && room.max === 6, 'create with mode ffa makes a 6-seat free-for-all room');
  for (const p of P.slice(1)) p.send({ t: 'join', name: p.name });
  ok(P.map((p) => p.seat).join() === '0,1,2,3,4,5', 'six players take seats 0–5');
  const G7 = player(room, 'Gus'); G7.send({ t: 'join', name: 'Gus' }); ok(G7.errors.includes('that room is full'), 'a seventh player is turned away');
  P.forEach((p, i) => p.send({ t: 'pick', char: WB.CHAR_IDS[i % 5] }));
  P[0].send({ t: 'start' }); ok(P[0].errors.includes('not everyone is ready'), 'the host can\'t start until everyone is ready');
  P.forEach((p) => p.send({ t: 'ready', on: true }));
  ok(room.phase === 'lobby', 'everyone ready doesn\'t start a free-for-all by itself');
  P[3].send({ t: 'start' }); ok(P[3].errors.includes('only the room\'s host can start'), 'only the host can start');
  P[0].send({ t: 'start' });
  ok(room.phase === 'playing' && room.G.teams === 6 && P.every((p) => p.G && WB.hash(p.G) === WB.hash(room.G)), 'the host starts: a 6-way game, every copy matches the server');
  ok(room.G.chars.join() === P.map((p, i) => WB.CHAR_IDS[i % 5]).join(), 'each side plays its pick');
  const late = player(room, 'Late'); late.send({ t: 'join', name: 'Late' });
  ok(late.errors.some((e) => /started/.test(e)), 'nobody can join a free-for-all once it has started');
  const mover = P[room.seatOf(room.G.team)], notMe = P[room.seatOf((room.G.team + 1) % 6)];
  notMe.send({ t: 'act', it: { k: 'pass' } }); ok(notMe.errors.includes('not your turn'), 'only the side whose turn it is can play');
  mover.send({ t: 'aim', angle: 70, power: 0.6 });
  ok(P.filter((p) => p !== mover).every((p) => p.aims.length === 1) && mover.aims.length === 0, 'your aim is shown to all five others, not you');

  // a player who drops mid-match has their turns passed quickly
  const goneSeat = room.seatOf(room.G.team), gone = P[goneSeat];
  gone.conn.onClose();
  const t0 = room.G.turn; room.tick(Date.now() + GONE_LIMIT_MS + 50);
  ok(room.G.turn === t0 + 1 || room.G.phase === 'over', `a disconnected player's turn passes after ${GONE_LIMIT_MS / 1000} s, not 50`);
  const back = player(room, 'back'); back.send({ t: 'rejoin', token: gone.token });
  ok(back.seat === goneSeat && back.G && WB.hash(back.G) === WB.hash(room.G), 'they can rejoin mid-match and get the current game');
  P[goneSeat] = back;

  let guard = 0;
  while (room.phase === 'playing' && guard++ < 2000) botMove(P[room.seatOf(room.G.team)]);
  ok(room.phase === 'lobby', `the game ends (${room.G.turn} turns, winner side ${room.G.winner}) and the room goes back to the lobby`);
  ok(P.every((p) => p.desyncs === 0), `no checksum ever disagrees on any of the six copies (${P[0].inbox.filter((m) => m.t === 'applied').length} moves)`);
  ok(P.every((p) => p.inbox.some((m) => m.t === 'roundover' && m.match)), 'all six hear the result');
  ok(room.seats.every((x) => x && !x.ready), 'everyone has to ready up again');

  // between games: someone leaves, someone new joins, then a 3-way with gaps in the seats
  for (const i of [2, 4, 5]) P[i].conn.onClose();
  const H = player(room, 'Hal'); H.send({ t: 'join', name: 'Hal' });
  ok(H.seat === 2, 'a newcomer takes the seat of someone who left');
  H.send({ t: 'pick', char: 'gale' });
  for (const p of [P[0], P[1], H]) p.send({ t: 'ready', on: true });
  P[0].send({ t: 'start' }); ok(P[0].errors.includes('not everyone is ready'), 'a connected player who isn\'t ready blocks the start');
  P[3].send({ t: 'ready', on: true }); P[0].send({ t: 'start' });
  ok(room.phase === 'playing' && room.G.teams === 4 && room.teamSeat.join() === '0,1,2,3', 'it starts with the 4 who are here; the 2 who left lose their seats');
  ok(room.seats[4] === null && room.seats[5] === null, 'seats of players who left are free again');
  ok(H.G && WB.hash(H.G) === WB.hash(room.G), 'the newcomer gets the game too');
}

{ // free-for-all host handover, and a 2-player minimum
  const room = new Room('HOST'); const A = player(room, 'A'), B = player(room, 'B'), C = player(room, 'C');
  A.send({ t: 'create', name: 'A', mode: 'ffa' }); B.send({ t: 'join', name: 'B' });
  B.send({ t: 'pick', char: 'zip' }); B.send({ t: 'ready', on: true });
  A.conn.onClose(); ok(room.host() === 1, 'if the host leaves, the next player becomes host');
  B.send({ t: 'start' }); ok(B.errors.includes('needs at least 2 players'), 'a free-for-all needs at least 2 players');
  C.send({ t: 'join', name: 'C' }); C.send({ t: 'pick', char: 'volt' }); C.send({ t: 'ready', on: true }); B.send({ t: 'start' });
  ok(room.phase === 'playing' && room.G.teams === 2 && room.teamSeat.join() === '1,2', 'two players can play a free-for-all; side 0 is seat 1');
  const side = room.G.team, mover = side === 0 ? B : C; botMove(mover);
  const got = C.inbox.filter((m) => m.t === 'applied');
  ok(B.desyncs === 0 && C.desyncs === 0 && got.length > 0 && got.every((m) => m.by === side), 'moves reach both, labelled by side (not seat)');
  const old = player(room, 'old'); old.send({ t: 'create', name: 'x', mode: 'duel' });
  ok(old.errors.includes('code in use') && room.mode === 'ffa', 'nobody can turn a room in use into another kind');
}

{ // a 1v1 room is unchanged by any of this
  const room = new Room('DUEL'); const A = player(room, 'A'); A.send({ t: 'create', name: 'A' });
  ok(room.mode === 'duel' && room.max === 2, 'create without a mode still makes a 1v1 room');
  A.send({ t: 'start' }); ok(A.errors.some((e) => /1v1/.test(e)), 'start is only for free-for-alls');
}

{ // join before anyone created the room
  const room = new Room('NONE'); const P = player(room, 'p'); P.send({ t: 'join', name: 'p' });
  ok(P.errors.includes('no room with that code'), 'joining an empty code says there is no room');
}

{ // team battle: one player per unit, computers in the empty slots, a dropped player's unit carries on
  const { TEAM_SLOTS } = require('./room.js');
  const room = new Room('TEAM', { seed: 777 });
  const A = player(room, 'Ana'), B = player(room, 'Ben'), C = player(room, 'Cy'), D = player(room, 'Di');
  A.send({ t: 'create', name: 'Ana', mode: 'teams' }); B.send({ t: 'join', name: 'Ben' }); C.send({ t: 'join', name: 'Cy' }); D.send({ t: 'join', name: 'Di' });
  ok(room.mode === 'teams' && [A.seat, B.seat, C.seat, D.seat].join() === [0, TEAM_SLOTS, 1, TEAM_SLOTS + 1].join(), `joining fills the two teams evenly (seats ${[A.seat, B.seat, C.seat, D.seat]})`);
  D.send({ t: 'team', side: 0 });
  ok(D.seat === 2 && room.seats[TEAM_SLOTS + 1] === null, 'a player can move to the other team');
  B.send({ t: 'size', n: 3 }); ok(B.errors.includes('only the room\'s host can change that'), 'only the host sets the team size');
  A.send({ t: 'size', n: 2 }); ok(A.errors.includes('someone is sitting in a slot that would close') && room.size === 5, 'the size can\'t close a slot someone is in');
  A.send({ t: 'size', n: 3 }); ok(room.size === 3, 'the host sets 3 a side');
  const all = [A, B, C, D], pick = ['brick', 'zip', 'volt', 'gale'];
  all.forEach((P, i) => { P.send({ t: 'pick', char: pick[i] }); P.send({ t: 'ready', on: true }); });
  B.send({ t: 'start' }); ok(room.phase === 'lobby', 'only the host can start');
  A.send({ t: 'start' });
  const G = room.G;
  ok(room.phase === 'playing' && G.units.length === 6 && G.cols === 200, `3 v 3 starts on a ${G.cols} × ${G.rows} map`);
  ok(G.units.filter((u) => u.own >= 0).length === 4 && G.units.filter((u) => u.own < 0).length === 2, 'four units have players, two are computers');
  ok(G.units.find((u) => u.own === A.seat).char === 'brick' && G.units.find((u) => u.own === B.seat).team === 1, 'each player gets their own character on their own team');
  // play it out: players move on their turns, the clock plays the computers; Cy drops out half way
  let now = Date.now(), guard = 0, botTurns = 0, dropped = false, wrong = 0;
  while (room.phase === 'playing' && guard++ < 4000) {
    const seat = room.ownerSeat(), P = all.find((x) => x.seat === seat && !x.gone);
    if (!dropped && room.G.turn >= 6) { dropped = true; C.gone = true; C.conn.onClose(); continue; }
    if (P) { const other = all.find((x) => x !== P && !x.gone); const e = other.errors.length; other.send({ t: 'act', it: { k: 'pass' } }); if (other.errors.length === e) wrong++; botMove(P); }
    else { const t = room.G.turn; now += 4000; room.tick(now); if (room.G.turn !== t || room.phase !== 'playing') botTurns++; }
  }
  ok(room.phase === 'lobby' && room.G.phase === 'over', `the team battle plays to the end (${room.G.turn} turns, ${botTurns} computer turns)`);
  ok(wrong === 0, 'nobody can move on someone else\'s turn');
  ok(botTurns > 2 && dropped, 'computers played the empty slots and the dropped player\'s unit');
  ok([A, B, D].every((P) => P.desyncs === 0 && WB.hash(P.G) === WB.hash(room.G)), `every player's copy matches the server's (${[A, B, D].map((P) => P.desyncs)})`);
  ok(room.wins.reduce((a, b) => a + b, 0) <= 1 && room.seats.every((st) => !st || !st.ready), 'one round a match, then everyone readies up again');
}
{ // a team room with one person: you and four computers against five computers
  const room = new Room('SOLO', { seed: 31 });
  const A = player(room, 'Ana'); A.send({ t: 'create', name: 'Ana', mode: 'teams' }); A.send({ t: 'pick', char: 'digger' }); A.send({ t: 'ready', on: true }); A.send({ t: 'start' });
  ok(room.phase === 'playing' && room.G.units.length === 10 && room.G.cols === 320, 'one player can start a 5 v 5 with nine computers on a Giant map');
  let now = Date.now(), guard = 0;
  while (room.phase === 'playing' && guard++ < 6000) { if (room.ownerSeat() === A.seat) botMove(A); else { now += 4000; room.tick(now); } }
  ok(room.phase === 'lobby' && A.desyncs === 0 && WB.hash(A.G) === WB.hash(room.G), `and it finishes in step with the server (${room.G.turn} turns)`);
}

{ // a drawn 1v1 round is played again, on a new map
  const room = new Room('DRAW', { seed: 99 });
  const A = player(room, 'Ana'), B = player(room, 'Ben');
  A.send({ t: 'create', name: 'Ana' }); B.send({ t: 'join', name: 'Ben' });
  for (const P of [A, B]) { P.send({ t: 'pick', char: 'volt' }); P.send({ t: 'ready', on: true }); }
  const seed1 = room.gameSeed; for (const u of room.G.units) u.alive = false; room.G.phase = 'over'; room.G.winner = -1; room.roundOver();
  A.send({ t: 'next' }); B.send({ t: 'next' });
  ok(room.phase === 'playing' && room.round === 1 && room.gameSeed !== seed1 && room.wins.join() === '0,0', 'after a draw the same round number starts again with a new seed');
}

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
