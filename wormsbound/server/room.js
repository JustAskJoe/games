/* Wormsbound · online 1v1 room. © 2026 justaskjoe. All rights reserved.

   One Room = one online match between two seats. No I/O in here: the local Node server (node-server.js) and the
   Cloudflare Durable Object (worker.js) both wrap it, so the rules are tested once and run the same in both places.

   The server is the referee. It runs the same engine the browser runs (../prototype/engine.js), checks every move
   with WB.act(), plays each shot through to the end with WB.resolve(), and tells both players what was played and
   the checksum the game should have afterwards. Each browser replays the move on its own copy (so it can animate it)
   and compares checksums; if they ever differ, it asks for the server's copy (`sync`) and carries on from that.
   So nobody can cheat with a modified page, and tiny differences between browsers' maths can't split the game.

   Messages are JSON, one per WebSocket frame.
   client → server
     { t: 'create', name }            first player in: takes seat 0 (fails with 'code in use' if the room is taken)
     { t: 'join', name }              second player: takes seat 1
     { t: 'rejoin', token }           get your seat back after a drop
     { t: 'pick', char }              choose your character (lobby or between matches)
     { t: 'ready', on }               ready up; the match starts when both seats have picked and are ready
     { t: 'act', it }                 a move on your turn: move | weapon | fire | lob | pass (see engine.js act())
     { t: 'aim', angle, power }       where you're aiming right now (just shown to the other player)
     { t: 'next' }                    ready for the next round (both needed)
     { t: 'rematch' }                 after the match: play again with the same pair (both needed)
     { t: 'sync' }                    send me the whole state again
   server → client
     { t: 'joined', code, seat, token }               you're in; keep the token to rejoin
     { t: 'room', ... }                                seats, phase, round, wins (whenever any of it changes)
     { t: 'round', round, seed, opts, wins, hash }    a round starts: build it with WB.newGame(seed, opts)
     { t: 'applied', seq, by, it, hash, turn }         apply `it` to your copy; after it settles, its hash must match
     { t: 'aim', by, angle, power }                    the other player's aim, to draw
     { t: 'roundover', winner, wins, match }           match = true when someone has won the match
     { t: 'state', ... }                               the full game state (after `sync`, or when you join mid-game)
     { t: 'error', error }
*/
'use strict';
const WB = require('../prototype/engine.js');

const SEATS = 2, BEST_OF = 3, NEED = Math.ceil(BEST_OF / 2);
const TURN_LIMIT_MS = 50000;   // the browser's turn timer is 30 s; the server only steps in for a vanished player
const NEXT_LIMIT_MS = 30000;   // between rounds: start the next one even if someone didn't tap "next"
const MOVE_KINDS = new Set(['move', 'weapon', 'fire', 'lob', 'pass']);
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O

function randomToken() {
  const b = new Uint8Array(12); globalThis.crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
function newCode(taken) {
  let c; const b = new Uint8Array(4);
  do { globalThis.crypto.getRandomValues(b); c = Array.from(b, (x) => LETTERS[x % LETTERS.length]).join(''); } while (taken && taken(c));
  return c;
}
const cleanName = (s) => String(s || '').replace(/[^\p{L}\p{N} _.'-]/gu, '').trim().slice(0, 16) || 'Player';
const num = (v, lo, hi) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : NaN);
// Only the fields a move can carry, with numbers clamped: nothing else from the network reaches the engine.
function cleanIntent(it) {
  if (!it || typeof it !== 'object' || !MOVE_KINDS.has(it.k)) return null;
  switch (it.k) {
    case 'move': return { k: 'move', dir: it.dir === 1 ? 1 : it.dir === -1 ? -1 : 0 };
    case 'weapon': return { k: 'weapon', w: String(it.w) };
    case 'fire': return { k: 'fire', angle: num(it.angle, 0, 360), power: num(it.power, 0, 1) };
    case 'lob': return { k: 'lob', dud: it.dud | 0, angle: num(it.angle, 0, 360), power: num(it.power, 0, 1) };
    default: return { k: 'pass' };
  }
}

class Room {
  constructor(code, opts = {}) {
    this.code = code;
    this.seed = (opts.seed >>> 0) || ((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    this.seats = Array.from({ length: SEATS }, () => null); // { name, token, char, ready, connected }
    this.phase = 'lobby';   // lobby | playing | roundover | matchover
    this.round = 1; this.wins = [0, 0]; this.G = null; this.seq = 0; this.opts = null;
    this.deadline = 0; this.next = [false, false]; this.rematch = [false, false];
    this.subs = new Set(); this.touched = Date.now();
  }
  // subscribe(seat, fn): fn(msg) gets every message for everyone plus those for this seat. Returns unsubscribe.
  subscribe(seat, fn) { const s = { seat, fn }; this.subs.add(s); return () => this.subs.delete(s); }
  emit(msg, to) { for (const s of this.subs) if (to == null || s.seat === to) s.fn(msg); }
  pubSeats() { return this.seats.map((s) => (s ? { name: s.name, char: s.char, ready: s.ready, connected: s.connected } : null)); }
  roomMsg() { return { t: 'room', code: this.code, seats: this.pubSeats(), phase: this.phase, round: this.round, wins: this.wins.slice(), bestOf: BEST_OF }; }
  sendRoom() { this.emit(this.roomMsg()); }
  empty() { return this.seats.every((s) => !s || !s.connected); }

  // ---------- seats ----------
  create(name) { if (this.seats[0]) return { error: 'code in use' }; return this.take(0, name); }
  join(name) {
    if (!this.seats[0]) return { error: 'no room with that code' };
    if (this.seats[1]) return { error: 'that room is full' };
    return this.take(1, name);
  }
  take(i, name) {
    this.seats[i] = { name: cleanName(name), token: randomToken(), char: null, ready: false, connected: true };
    this.touched = Date.now(); this.sendRoom();
    return { seat: i, token: this.seats[i].token };
  }
  rejoin(token) {
    const i = this.seats.findIndex((s) => s && s.token === String(token || ''));
    if (i < 0) return { error: 'that seat has gone' };
    this.seats[i].connected = true; this.touched = Date.now(); this.sendRoom();
    return { seat: i, token: this.seats[i].token };
  }
  leave(i) { if (this.seats[i]) { this.seats[i].connected = false; this.sendRoom(); } }

  // ---------- lobby ----------
  pick(i, ch) {
    if (!this.seats[i]) return { error: 'not seated' };
    if (this.phase !== 'lobby' && this.phase !== 'matchover') return { error: 'not now' };
    if (!WB.CHARS[ch]) return { error: 'no such character' };
    this.seats[i].char = ch; this.seats[i].ready = false; this.sendRoom(); return {};
  }
  ready(i, on) {
    const s = this.seats[i]; if (!s) return { error: 'not seated' };
    if (this.phase !== 'lobby') return { error: 'not now' };
    if (!s.char) return { error: 'pick a character first' };
    s.ready = !!on; this.sendRoom();
    if (this.seats.every((x) => x && x.char && x.ready)) this.startMatch();
    return {};
  }
  startMatch() { this.round = 1; this.wins = [0, 0]; this.startRound(); }
  startRound() {
    this.phase = 'playing'; this.seq = 0; this.next = [false, false]; this.rematch = [false, false];
    const seed = (this.seed + this.round * 7919) >>> 0;
    this.opts = { teams: 2, first: (this.round - 1) % 2, chars: this.seats.map((s) => s.char) };
    this.G = WB.newGame(seed, this.opts); this.gameSeed = seed;
    this.deadline = Date.now() + TURN_LIMIT_MS;
    this.sendRoom();
    this.emit({ t: 'round', round: this.round, seed, opts: this.opts, wins: this.wins.slice(), hash: WB.hash(this.G) });
  }

  // ---------- play ----------
  act(i, raw) {
    if (this.phase !== 'playing' || !this.G) return { error: 'no game running' };
    const G = this.G; if (G.phase !== 'aim') return { error: 'wait for the shot to land' };
    if (G.team !== i) return { error: 'not your turn' };
    const it = cleanIntent(raw); if (!it) return { error: 'not a move' };
    if (!WB.act(G, it)) return { error: 'that move isn\'t allowed' };
    if (G.phase === 'flight') WB.resolve(G); // play the shot through to the end, here and now
    this.seq++; this.touched = Date.now();
    this.emit({ t: 'applied', seq: this.seq, by: i, it, hash: WB.hash(G), turn: G.turn });
    if (G.phase === 'aim' && it.k !== 'move' && it.k !== 'weapon') this.deadline = Date.now() + TURN_LIMIT_MS;
    if (G.phase === 'over') this.roundOver();
    return {};
  }
  aim(i, angle, power) {
    if (this.phase !== 'playing' || !this.G || this.G.team !== i) return {};
    const a = num(angle, 0, 360), p = num(power, 0, 1); if (!Number.isFinite(a) || !Number.isFinite(p)) return {};
    this.emit({ t: 'aim', by: i, angle: a, power: p }, 1 - i);
    return {};
  }
  roundOver() {
    const w = this.G.winner;
    if (w >= 0) this.wins[w]++;
    const match = this.wins.some((x) => x >= NEED);
    this.phase = match ? 'matchover' : 'roundover';
    this.deadline = match ? 0 : Date.now() + NEXT_LIMIT_MS;
    this.emit({ t: 'roundover', winner: w, wins: this.wins.slice(), match });
    this.sendRoom();
  }
  nextRound(i) {
    if (this.phase !== 'roundover') return { error: 'not now' };
    this.next[i] = true;
    if (this.next.every(Boolean)) { this.round += this.G && this.G.winner >= 0 ? 1 : 0; this.startRound(); }
    return {};
  }
  wantRematch(i) {
    if (this.phase !== 'matchover') return { error: 'not now' };
    this.rematch[i] = true; this.sendRoom();
    if (this.rematch.every(Boolean)) { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; this.startMatch(); }
    return {};
  }
  // The clock: a player who vanished mid-turn gets their turn passed; a round screen nobody leaves moves on.
  tick(now = Date.now()) {
    if (!this.deadline || now < this.deadline) return;
    if (this.phase === 'playing' && this.G && this.G.phase === 'aim') this.act(this.G.team, { k: 'pass' });
    else if (this.phase === 'roundover') { this.next = [true, true]; this.round += this.G && this.G.winner >= 0 ? 1 : 0; this.startRound(); }
  }
  state(i) {
    return Object.assign(this.roomMsg(), { t: 'state', you: i, seq: this.seq, G: this.G ? JSON.parse(JSON.stringify(this.G)) : null, opts: this.opts, seed: this.gameSeed });
  }

  // One connection's messages. send(msg) goes back to that connection. Returns { onMessage, onClose }.
  connect(send, taken) {
    let seat = -1, off = null;
    const enter = (r) => {
      if (r.error) return send({ t: 'error', error: r.error });
      seat = r.seat; if (off) off();
      off = this.subscribe(seat, send);
      send({ t: 'joined', code: this.code, seat, token: r.token });
      send(this.state(seat));
    };
    return {
      onMessage: (raw) => {
        if (typeof raw !== 'string' || raw.length > 2000) return send({ t: 'error', error: 'message too big' });
        let m; try { m = JSON.parse(raw); } catch (e) { return send({ t: 'error', error: 'bad json' }); }
        if (!m || typeof m !== 'object') return;
        if (m.t === 'create') return enter(this.create(m.name));
        if (m.t === 'join') return enter(this.join(m.name));
        if (m.t === 'rejoin') return enter(this.rejoin(m.token));
        if (seat < 0) return send({ t: 'error', error: 'join the room first' });
        let r = {};
        switch (m.t) {
          case 'pick': r = this.pick(seat, m.char); break;
          case 'ready': r = this.ready(seat, m.on); break;
          case 'act': r = this.act(seat, m.it); break;
          case 'aim': r = this.aim(seat, m.angle, m.power); break;
          case 'next': r = this.nextRound(seat); break;
          case 'rematch': r = this.wantRematch(seat); break;
          case 'sync': send(this.state(seat)); break;
          default: r = { error: 'unknown message ' + String(m.t).slice(0, 20) };
        }
        if (r.error) send({ t: 'error', error: r.error });
      },
      onClose: () => { if (off) off(); if (seat >= 0) this.leave(seat); },
    };
  }
}

module.exports = { Room, newCode, cleanIntent, SEATS, BEST_OF, TURN_LIMIT_MS, NEXT_LIMIT_MS };
