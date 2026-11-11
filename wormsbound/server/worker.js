/* Wormsbound · online room server on Cloudflare: a Worker plus one Durable Object per room. © 2026 justaskjoe.
   All rights reserved.

   The same Room (room.js) the local server runs. Each 4-letter code maps to one Durable Object (idFromName), which
   holds that match in memory and sends moves to both players over WebSockets. An alarm ticks the room's clock every
   few seconds while anyone is connected. Rooms aren't saved to storage: if everyone leaves and Cloudflare evicts the
   object, the room is gone (fine for friends' matches; see README).

     GET /         → a short text line (health check)
     GET /new      → { "code": "ABCD" }  a random room code (create may still say "code in use"; the game retries)
     WS  /room/ABCD → the room

   Deploy: see README.md in this folder (wrangler deploy, with CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID set).
*/
import roomModule from './room.js';
const { Room, newCode } = roomModule;

const CORS = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/new') return new Response(JSON.stringify({ code: newCode() }), { headers: CORS });
    const m = /^\/room\/([A-Za-z]{4})$/.exec(url.pathname);
    if (m) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected a WebSocket', { status: 426 });
      const code = m[1].toUpperCase();
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(new Request(new URL('/room/' + code, url), req));
    }
    return new Response('Wormsbound room server\n', { headers: { 'content-type': 'text/plain' } });
  },
};

export class RoomObject {
  constructor(state) { this.state = state; this.room = null; this.conns = 0; }
  async fetch(req) {
    const code = new URL(req.url).pathname.split('/').pop();
    if (!this.room) this.room = new Room(code);
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    server.accept();
    const conn = this.room.connect((msg) => { try { server.send(JSON.stringify(msg)); } catch (e) { /* closed */ } });
    this.conns++;
    server.addEventListener('message', (ev) => conn.onMessage(typeof ev.data === 'string' ? ev.data : ''));
    const done = () => { conn.onClose(); this.conns = Math.max(0, this.conns - 1); };
    server.addEventListener('close', done); server.addEventListener('error', done);
    await this.state.storage.setAlarm(Date.now() + 3000);
    return new Response(null, { status: 101, webSocket: client });
  }
  async alarm() {
    if (!this.room) return;
    this.room.tick(Date.now());
    if (this.conns > 0) await this.state.storage.setAlarm(Date.now() + 3000);
  }
}
