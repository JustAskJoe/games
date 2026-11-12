// node smoke.js [https://live-host] [--ffa N]: real WebSocket clients play a whole online match against the local
// server, or against a deployed one when an address is given (e.g. https://wormsbound-rooms.<sub>.workers.dev).
// Default: a 1v1 (best of 3) between two clients. --ffa N: an N-player free-for-all (2–6), started by the host.
// Every client replays each move on its own copy and checks the server's checksum.
// © 2026 justaskjoe. All rights reserved.
'use strict';
const WebSocket = require('ws');
const WB = require('../prototype/engine.js');
const { serve } = require('./node-server.js');

const args = process.argv.slice(2), fi = args.indexOf('--ffa');
const FFA = fi >= 0 ? Math.max(2, Math.min(6, +args[fi + 1] || 6)) : 0;
const LIVE = (args.find((a) => /^https?:/.test(a)) || '').replace(/\/+$/, '');
const N = FFA || 2, NAMES = ['Ana', 'Ben', 'Cy', 'Dee', 'Eli', 'Fay'];
const s = LIVE ? { close: async () => {} } : serve(0);
const http = LIVE || `http://localhost:${s.server.address().port}`, url = http.replace(/^http/, 'ws');
const fail = (m) => { console.log('FAIL', m); s.close().then(() => process.exit(1)); };
setTimeout(() => fail("timed out " + JSON.stringify(clients.map((c) => c.G && ({ turn: c.G.turn, phase: c.G.phase, team: c.G.team, side: c.side, planned: c.planned, round: c.round, room: c.room && c.room.phase })))), +process.env.SMOKE_MS || (FFA ? 240000 : 120000)).unref();

let code, clients = [], finished = 0;
function client(i) {
  return new Promise((done) => {
    const name = NAMES[i], C = { name, G: null, seat: -1, side: -1, desync: 0, applied: 0 };
    const ws = new WebSocket(`${url}/room/${code}`);
    C.send = (m) => ws.send(JSON.stringify(m));
    ws.on('open', () => C.send(i === 0 ? { t: 'create', name, mode: FFA ? 'ffa' : 'duel' } : { t: 'join', name }));
    ws.on('message', (raw) => {
      const m = JSON.parse(raw);
      if (m.t === 'error') return fail(name + ': ' + m.error);
      if (m.t === 'joined') { C.seat = m.seat; C.send({ t: 'pick', char: WB.CHAR_IDS[i % WB.CHAR_IDS.length] }); C.send({ t: 'ready', on: true }); done(C); }
      if (m.t === 'room') {
        C.room = m;
        // the host starts a free-for-all once everyone has joined and is ready
        if (FFA && i === 0 && m.phase === 'lobby' && !C.started && m.seats.filter((x) => x && x.connected && x.ready).length === N) { C.started = true; C.send({ t: 'start' }); }
      }
      if (m.t === 'round') { C.round = m.round; C.side = m.teamSeat.indexOf(C.seat); C.G = WB.newGame(m.seed, m.opts); maybePlay(C); }
      if (m.t === 'applied') { C.applied++; WB.act(C.G, m.it); if (C.G.phase === 'flight') WB.resolve(C.G); if (WB.hash(C.G) !== m.hash) C.desync++; maybePlay(C); }
      if (m.t === 'roundover') { if (m.match) { C.over = m; finish(); } else C.send({ t: 'next' }); }
    });
    C.ws = ws;
  });
}
function maybePlay(C) {
  if (!C.G || C.G.phase !== 'aim' || C.G.team !== C.side) return;
  const key = C.G.seed + '/' + C.G.turn; if (C.planned === key) return; C.planned = key; // plan once per turn
  for (const it of WB.botTurn(JSON.parse(JSON.stringify(C.G)), 'smart')) C.send({ t: 'act', it });
}
function finish() {
  if (++finished < N) return;
  const A = clients[0], hashes = new Set(clients.map((c) => WB.hash(c.G)));
  const okAll = clients.every((c) => c.desync === 0 && c.over.wins.join() === A.over.wins.join()) && hashes.size === 1;
  const what = FFA ? `${N}-player free-for-all over: winner side ${A.over.winner}, ${A.G.turn} turns` : `online match over: wins ${A.over.wins.join('-')}`;
  console.log(`${what}, ${A.applied} moves, desyncs ${clients.map((c) => c.desync).join('/')}`);
  if (!okAll) return fail('copies disagreed');
  console.log('smoke test passed'); s.close().then(() => process.exit(0));
}
(async () => {
  const r = await fetch(`${http}/new`); code = (await r.json()).code;
  clients.push(await client(0));
  for (let i = 1; i < N; i++) clients.push(await client(i));
})();
