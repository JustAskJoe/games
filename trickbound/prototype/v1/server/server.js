// Trickbound multiplayer base: a tiny WebSocket server around GameRoom.
// © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
//
//   npm install && node server.js            (PORT=8420 by default)
//
// Protocol (JSON over WebSocket), client → server:
//   {t:'create', rules?, name, familiar?}          → {t:'joined', room, seat, token} and the room is yours (seat 0)
//   {t:'join', room, name, familiar?, seat?}       → {t:'joined', ...}; empty seats are bots until someone sits
//   {t:'rejoin', room, token}                      → {t:'joined', ...} after a dropped connection
//   {t:'start'}                                    → host only; bots fill the empty seats and the hand loop runs
//   {t:'bid', bid, nil} | {t:'blind', yes} | {t:'play', c, flare?, burrow?, spark?} | {t:'familiar', args} | {t:'skip'} | {t:'hopgive', c}
//   {t:'flag', note}                               → the host-side bug flag, same as the phone's ⚑ button
// server → client:
//   {t:'joined', room, seat, token} · {t:'state', view} (your own view, after every change) · {t:'prompt', kind, options}
//   {t:'event', ...} (bids, plays, familiars, tricks, handEnd, gameOver, log lines) · {t:'error', error}
'use strict';
const http = require('http');
const { WebSocketServer } = require('ws');
const { GameRoom, viewFor } = require('./room.js');

const PORT = Number(process.env.PORT || 8420);
const rooms = new Map();
const code = () => { let s = ''; const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return rooms.has(s) ? code() : s; };
const token = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }); res.end(`Trickbound table server. ${rooms.size} room(s).\n`); });
const wss = new WebSocketServer({ server });

function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function pushState(room) { for (const [ws, c] of clients) if (c.room === room && c.seat !== null) send(ws, { t: 'state', view: viewFor(room.G || emptyGame(room), c.seat, room) }); }
function emptyGame(room) { const SP = require('../engine.js'); const G = SP.newMatch(1, room.seats.map((s) => s.persona), room.rules); SP.deal(G); G.players.forEach((p) => { p.hand = []; }); return G; }

const clients = new Map(); // ws -> { room, seat, token }
function attach(room) {
  if (room._attached) return; room._attached = true;
  room.onChange((ev) => {
    if (ev.t === 'prompt') { for (const [ws, c] of clients) if (c.room === room && c.seat === ev.seat) send(ws, { t: 'prompt', kind: ev.kind, options: ev.options }); }
    else { for (const [ws, c] of clients) if (c.room === room) send(ws, Object.assign({ t: 'event' }, ev)); }
    pushState(room);
  });
}

wss.on('connection', (ws) => {
  clients.set(ws, { room: null, seat: null, token: null });
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch (e) { return send(ws, { t: 'error', error: 'bad json' }); }
    const c = clients.get(ws);
    try {
      if (m.t === 'create') { const room = new GameRoom(code(), { rules: m.rules, botDelay: 600 }); rooms.set(room.code, room); attach(room); const tk = token(); room.sit(0, { name: m.name, familiar: m.familiar, token: tk }); Object.assign(c, { room, seat: 0, token: tk }); send(ws, { t: 'joined', room: room.code, seat: 0, token: tk }); return pushState(room); }
      if (m.t === 'join') { const room = rooms.get(String(m.room || '').toUpperCase()); if (!room) return send(ws, { t: 'error', error: 'no such room' }); const free = m.seat !== undefined ? m.seat : room.seats.findIndex((s) => !s.isHuman); if (free < 0 || room.seats[free].isHuman) return send(ws, { t: 'error', error: 'seat taken' }); const tk = token(); room.sit(free, { name: m.name, familiar: m.familiar, token: tk }); Object.assign(c, { room, seat: free, token: tk }); send(ws, { t: 'joined', room: room.code, seat: free, token: tk }); return pushState(room); }
      if (m.t === 'rejoin') { const room = rooms.get(String(m.room || '').toUpperCase()); if (!room) return send(ws, { t: 'error', error: 'no such room' }); const s = room.reconnect(m.token); if (!s) return send(ws, { t: 'error', error: 'bad token' }); Object.assign(c, { room, seat: s.ix, token: m.token }); send(ws, { t: 'joined', room: room.code, seat: s.ix, token: m.token }); if (s.pending) send(ws, { t: 'prompt', kind: s.pending.kind, options: s.pending.options }); return pushState(room); }
      if (!c.room) return send(ws, { t: 'error', error: 'join a room first' });
      if (m.t === 'start') { if (c.seat !== 0) return send(ws, { t: 'error', error: 'host only' }); c.room.start().catch((e) => console.error(e)); return; }
      if (m.t === 'flag') { const rec = c.room.flag(c.seat, m.note || ''); return send(ws, { t: 'event', ...{ t: 'flagged', rec } }); }
      const r = c.room.intent(c.seat, m); if (!r.ok) send(ws, { t: 'error', error: r.error, legal: r.legal });
    } catch (e) { console.error(e); send(ws, { t: 'error', error: String(e.message || e) }); }
  });
  ws.on('close', () => { const c = clients.get(ws); if (c && c.room && c.seat !== null) c.room.leave(c.seat); clients.delete(ws); });
});

server.listen(PORT, () => console.log(`Trickbound table server on :${PORT}`));
