/* Tower Defense co-op server. © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
   A thin WebSocket wrapper around GameRoom (room.js). Rooms by 4-letter code, in memory only.

   Protocol: JSON messages, one per WebSocket frame.
   client → server
     { t: 'create', name, seed? }        make a room, take seat 1          → { t: 'joined', code, seat, token } + { t: 'sync', ... }
     { t: 'join', code, name }           take the next seat (before start) → same as create
     { t: 'rejoin', code, token }        get your seat back after a drop   → { t: 'joined', ... } + { t: 'sync', ... }
     { t: 'bot' }                        host only: add a bot seat
     { t: 'start' }                      host only (seat 1): lock seats and begin
     { t: 'intent', it }                 it = { k: 'build', type, c, r } | { k: 'upgrade', c, r, branch } | { k: 'sell', c, r }
                                               | { k: 'ready', on } | { k: 'pick', card } | { k: 'skip' }
     { t: 'sync' }                       ask for the full snapshot again (after a desync)
   server → client
     { t: 'sync', snapshot }             seed + the whole log; rebuild your replica from this
     { t: 'applied', entry }             { seq, by, it }: apply in seq order (see Replica in room.js)
     { t: 'checkpoint', cp }             { wave, seq, phase, hash } after each wave; compare with your replica's hash
     { t: 'seats', seats }  { t: 'started' }  { t: 'error', error }
*/
'use strict';
const { WebSocketServer } = require('ws');
const { GameRoom } = require('./room.js');

const PORT = +process.env.PORT || 8430;
const rooms = new Map();
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join(''); } while (rooms.has(c)); return c; };

function serve(port = PORT) {
  const wss = new WebSocketServer({ port });
  wss.on('connection', (ws) => {
    let room = null, seat = -1, off = null;
    const send = (m) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
    const attach = (r, s, token) => {
      room = r; seat = s; if (off) off();
      off = r.on((msg) => { const { type, ...rest } = msg; send({ t: type, ...rest }); });
      send({ t: 'joined', code: r.code, seat: s, token }); send({ t: 'sync', snapshot: r.snapshot(s) });
    };
    ws.on('message', (raw) => {
      let m; try { m = JSON.parse(raw); } catch (e) { return send({ t: 'error', error: 'bad json' }); }
      if (m.t === 'create') { const r = new GameRoom(newCode(), { seed: m.seed }); rooms.set(r.code, r); const j = r.join(m.name); return attach(r, j.seat, j.token); }
      if (m.t === 'join' || m.t === 'rejoin') {
        const r = rooms.get(String(m.code || '').toUpperCase()); if (!r) return send({ t: 'error', error: 'no room with that code' });
        const j = m.t === 'join' ? r.join(m.name) : r.rejoin(m.token); if (j.error) return send({ t: 'error', error: j.error });
        return attach(r, j.seat, j.token || m.token);
      }
      if (!room) return send({ t: 'error', error: 'join a room first' });
      if (m.t === 'sync') return send({ t: 'sync', snapshot: room.snapshot(seat) });
      if (m.t === 'bot') { if (seat !== 0) return send({ t: 'error', error: 'only the host adds bots' }); if (!room.addBot()) send({ t: 'error', error: 'cannot add a bot now' }); return; }
      if (m.t === 'start') { if (seat !== 0) return send({ t: 'error', error: 'only the host starts' }); const r = room.start(); if (r.error) send({ t: 'error', error: r.error }); return; }
      if (m.t === 'intent') { const r = room.intent(seat, m.it); if (r.error) send({ t: 'error', error: r.error }); return; }
      send({ t: 'error', error: `unknown message ${m.t}` });
    });
    ws.on('close', () => { if (off) off(); if (room) room.leave(seat); });
  });
  // drop rooms nobody has touched in 6 hours
  setInterval(() => { for (const [code, r] of rooms) if (r.seats.every((s) => !s.connected)) { r.idle = (r.idle || 0) + 1; if (r.idle > 36) rooms.delete(code); } else r.idle = 0; }, 10 * 60 * 1000).unref();
  return wss;
}

if (require.main === module) { serve(); console.log(`Tower Defense co-op server on :${PORT}`); }
module.exports = { serve, rooms };
