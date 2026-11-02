// node smoke.js: two real WebSocket clients play a whole online match against the local server.
// © 2026 justaskjoe. All rights reserved.
'use strict';
const WebSocket = require('ws');
const WB = require('../prototype/engine.js');
const { serve } = require('./node-server.js');

const s = serve(0), port = s.server.address().port, url = `ws://localhost:${port}`;
const fail = (m) => { console.log('FAIL', m); s.close().then(() => process.exit(1)); };
setTimeout(() => fail('timed out'), 120000).unref();

function client(name, first) {
  return new Promise((done) => {
    const C = { name, G: null, seat: -1, desync: 0, applied: 0 };
    const ws = new WebSocket(`${url}/room/${code}`);
    C.send = (m) => ws.send(JSON.stringify(m));
    ws.on('open', () => C.send({ t: first ? 'create' : 'join', name }));
    ws.on('message', (raw) => {
      const m = JSON.parse(raw);
      if (m.t === 'error') return fail(name + ': ' + m.error);
      if (m.t === 'joined') { C.seat = m.seat; C.send({ t: 'pick', char: first ? 'digger' : 'zip' }); C.send({ t: 'ready', on: true }); done(C); }
      if (m.t === 'round') { C.round = m.round; C.G = WB.newGame(m.seed, m.opts); maybePlay(C); }
      if (m.t === 'applied') { C.applied++; WB.act(C.G, m.it); if (C.G.phase === 'flight') WB.resolve(C.G); if (WB.hash(C.G) !== m.hash) C.desync++; maybePlay(C); }
      if (m.t === 'roundover') { if (m.match) { C.over = m; finish(); } else C.send({ t: 'next' }); }
    });
    C.ws = ws;
  });
}
function maybePlay(C) {
  if (!C.G || C.G.phase !== 'aim' || C.G.team !== C.seat) return;
  const key = C.round + '/' + C.G.turn; if (C.planned === key) return; C.planned = key; // plan once per turn
  for (const it of WB.botTurn(JSON.parse(JSON.stringify(C.G)), 'smart')) C.send({ t: 'act', it });
}
let code, A, B, finished = 0;
function finish() {
  if (++finished < 2) return;
  const okAll = A.desync === 0 && B.desync === 0 && A.over.wins.join() === B.over.wins.join();
  console.log(`online match over: wins ${A.over.wins.join('-')}, ${A.applied} moves, desyncs ${A.desync}/${B.desync}`);
  if (!okAll) return fail('copies disagreed');
  console.log('smoke test passed'); s.close().then(() => process.exit(0));
}
(async () => {
  const r = await fetch(`http://localhost:${port}/new`); code = (await r.json()).code;
  A = await client('Ana', true); B = await client('Ben', false);
})();
