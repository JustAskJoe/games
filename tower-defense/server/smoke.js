// Two real WebSocket clients create/join a room, build, ready up and play to the end. node smoke.js
// © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
'use strict';
const WebSocket = require('ws');
const { serve } = require('./server.js');
const { Replica } = require('./room.js');
const PORT = 8439; const wss = serve(PORT);
const fail = (e) => { console.error('SMOKE FAILED', e); process.exit(1); };
setTimeout(() => fail('timeout'), 20000).unref();

function client(name) {
  const ws = new WebSocket(`ws://localhost:${PORT}`); const c = { ws, name, rep: null, seat: -1, code: null, waits: [] };
  const send = (m) => ws.send(JSON.stringify(m)); c.send = send;
  ws.on('message', (raw) => {
    const m = JSON.parse(raw);
    if (m.t === 'joined') { c.seat = m.seat; c.code = m.code; }
    if (m.t === 'sync') { c.rep = new Replica(m.snapshot.seed); m.snapshot.log.forEach((e) => c.rep.push(e)); }
    if (m.t === 'applied') c.rep.push(m.entry);
    if (m.t === 'checkpoint') { c.rep.finishWave(); if (c.rep.hash() !== m.cp.hash) fail(`${name} desync at wave ${m.cp.wave}`); c.last = m.cp; }
    c.waits = c.waits.filter((w) => !w(m));
  });
  c.until = (pred) => new Promise((res) => c.waits.push((m) => { if (pred(m)) { res(m); return true; } return false; }));
  c.open = new Promise((res) => ws.on('open', res));
  return c;
}
(async () => {
  const h = client('Hunter'); await h.open; h.send({ t: 'create', name: 'Hunter', seed: 99 });
  await h.until((m) => m.t === 'sync');
  const j = client('Joe'); await j.open; j.send({ t: 'join', code: h.code, name: 'Joe' }); await j.until((m) => m.t === 'sync');
  j.send({ t: 'start' }); const e = await j.until((m) => m.t === 'error'); if (!/host/.test(e.error)) fail('non-host could start');
  h.send({ t: 'start' }); await h.until((m) => m.t === 'started');
  const plan = [['arrow', 3, 3], ['arrow', 1, 2], ['frost', 5, 2]];
  for (const [type, c, r] of plan) { h.send({ t: 'intent', it: { k: 'build', type, c, r } }); await j.until((m) => m.t === 'applied'); }
  h.send({ t: 'intent', it: { k: 'ready' } }); j.send({ t: 'intent', it: { k: 'ready' } });
  const cp = await j.until((m) => m.t === 'checkpoint');
  console.log('  wave 1 resolved:', cp.cp.phase, 'hash', cp.cp.hash, '| Hunter', h.rep.hash(), '| Joe', j.rep.hash());
  if (h.rep.hash() !== j.rep.hash()) fail('clients differ');
  console.log('SMOKE OK: create, join, host-only start, builds, ready, wave, matching hashes over real sockets');
  h.ws.close(); j.ws.close(); wss.close(); process.exit(0);
})().catch(fail);
