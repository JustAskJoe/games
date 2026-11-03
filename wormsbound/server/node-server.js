/* Wormsbound · local room server for testing online 1v1 on your own machine. © 2026 justaskjoe. All rights reserved.
   The same Room (room.js) the Cloudflare version runs, behind a plain Node WebSocket server.

     cd wormsbound/server && npm install && npm start      → ws://localhost:8431
     GET  /new            → { "code": "ABCD" }  a free room code
     WS   /room/ABCD      → the room (then send create / join / rejoin, see room.js)
   In the game: title → ONLINE 1v1 → server ws://localhost:8431 (the default when the page isn't on the Lab).
*/
'use strict';
const http = require('http');
const { WebSocketServer } = require('ws');
const { Room, newCode } = require('./room.js');

function serve(port = +process.env.PORT || 8431) {
  const rooms = new Map();
  const getRoom = (code) => { if (!rooms.has(code)) rooms.set(code, new Room(code)); return rooms.get(code); };
  const server = http.createServer((req, res) => {
    const head = { 'content-type': 'application/json', 'access-control-allow-origin': '*' };
    if (req.url === '/new') { res.writeHead(200, head); return res.end(JSON.stringify({ code: newCode((c) => rooms.has(c)) })); }
    res.writeHead(200, { 'content-type': 'text/plain' }); res.end('Wormsbound room server (local). Rooms: ' + rooms.size + '\n');
  });
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
    const m = /^\/room\/([A-Za-z]{4})$/.exec(req.url || ''); const code = m && m[1].toUpperCase();
    if (!m) { ws.close(1008, 'use /room/ABCD'); return; }
    const room = getRoom(code);
    const conn = room.connect((msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); });
    ws.on('message', (raw) => conn.onMessage(String(raw)));
    ws.on('close', () => conn.onClose());
  });
  const clock = setInterval(() => {
    const now = Date.now();
    for (const [code, r] of rooms) { r.tick(now); if (r.empty() && now - r.touched > 6 * 3600 * 1000) rooms.delete(code); }
  }, 1000);
  clock.unref();
  server.listen(port);
  return { server, wss, rooms, close: () => new Promise((ok) => { clearInterval(clock); for (const c of wss.clients) c.terminate(); wss.close(); server.close(() => ok()); }) };
}

if (require.main === module) { const s = serve(); console.log('Wormsbound room server on ws://localhost:' + s.server.address().port); }
module.exports = { serve };
