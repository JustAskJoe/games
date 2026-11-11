/* Wormsbound · online 1v1 room. © 2026 justaskjoe. All rights reserved.

   One Room = one online match: a 1v1 (two seats, best of 3, starts when both are ready), a free-for-all
   (mode 'ffa': 2 to 6 seats, one round a match; whoever made the room, or the first seat still here, presses Start)
   or a team battle (mode 'teams': two teams of 2 to 5 units, one player per unit, one round a match, host presses
   Start). In a team battle seats 0-4 are team 0 and seats 5-9 are team 1; a unit slot nobody sits in is played by a
   computer on the server, and so is a player's unit while they are disconnected. No I/O in here: the local Node server (node-server.js) and the
   Cloudflare Durable Object (worker.js) both wrap it, so the rules are tested once and run the same in both places.

   The server is the referee. It runs the same engine the browser runs (../prototype/engine.js), checks every move
   with WB.act(), plays each shot through to the end with WB.resolve(), and tells both players what was played and
   the checksum the game should have afterwards. Each browser replays the move on its own copy (so it can animate it)
   and compares checksums; if they ever differ, it asks for the server's copy (`sync`) and carries on from that.
   So nobody can cheat with a modified page, and tiny differences between browsers' maths can't split the game.

   Messages are JSON, one per WebSocket frame.
   client → server
     { t: 'create', name, mode }      first player in: takes seat 0 (fails with 'code in use' if the room is taken).
                                      mode 'ffa' makes a free-for-all room (up to 6), 'teams' a team battle (up to
                                      5 a side); anything else is a 1v1
     { t: 'team', side }              team battle lobby: move to the other team (if it has a free slot)
     { t: 'size', n }                 team battle lobby, host only: units a side, 2 to 5
     { t: 'join', name }              the next free seat (free-for-all: only between matches)
     { t: 'start' }                   free-for-all only, from the host: start with everyone here (all must be ready)
     { t: 'rejoin', token }           get your seat back after a drop
     { t: 'pick', char }              choose your character (lobby or between matches)
     { t: 'ready', on }               ready up; the match starts when both seats have picked and are ready
     { t: 'act', it }                 a move on your turn: move | weapon | fire | lob | pass (see engine.js act())
     { t: 'aim', angle, power }       where you're aiming right now (just shown to the other player)
     { t: 'next' }                    1v1: ready for the next round (both needed)
     { t: 'rematch' }                 1v1, after the match: play again with the same pair (both needed)
     { t: 'sync' }                    send me the whole state again
   server → client
     { t: 'joined', code, seat, token }               you're in; keep the token to rejoin
     { t: 'room', ... }                                mode, max, host, seats, phase, round, wins, need, teamSeat
                                                       (whenever any of it changes). In a match, side t is seat
                                                       teamSeat[t]; free-for-all seats can have gaps.
     { t: 'round', round, seed, opts, wins, hash }    a round starts: build it with WB.newGame(seed, opts)
     { t: 'applied', seq, by, it, hash, turn }         apply `it` to your copy; after it settles, its hash must match
     { t: 'aim', by, angle, power }                    the other player's aim, to draw
     { t: 'roundover', winner, wins, match }           match = true when someone has won the match (always, in a
                                                       free-for-all, which then goes back to the lobby)
     { t: 'state', ... }                               the full game state (after `sync`, or when you join mid-game)
     { t: 'error', error }
*/
'use strict';
const WB = require('../prototype/engine.js');

const SEATS = 2, FFA_SEATS = 6, BEST_OF = 3, NEED = Math.ceil(BEST_OF / 2);
const TEAM_SLOTS = 5, TEAM_SEATS = TEAM_SLOTS * 2; // team battle: seat = team * 5 + slot
const BOT_STYLE = 'medium';    // how the server plays a unit nobody controls
const BOT_THINK_MS = 1500;     // a computer waits this long after the last shot has landed on everyone's screen
const TURN_LIMIT_MS = 50000;   // the browser's turn timer is 30 s; the server only steps in for a vanished player
const NEXT_LIMIT_MS = 30000;   // between rounds: start the next one even if someone didn't tap "next"
const GONE_LIMIT_MS = 8000;    // a disconnected player's turn passes after this (so 5 others aren't kept waiting)
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
    this.mode = opts.mode === 'ffa' ? 'ffa' : opts.mode === 'teams' ? 'teams' : 'duel'; this.max = this.mode === 'ffa' ? FFA_SEATS : this.mode === 'teams' ? TEAM_SEATS : SEATS;
    this.size = TEAM_SLOTS; this.botAt = 0; // team battle: units a side, and when the next computer turn is due
    this.seats = Array.from({ length: this.max }, () => null); // { name, token, char, ready, connected }
    this.phase = 'lobby';   // lobby | playing | roundover | matchover (a free-for-all goes from playing back to lobby)
    this.round = 1; this.wins = [0, 0]; this.G = null; this.seq = 0; this.opts = null;
    this.teamSeat = this.mode === 'duel' ? [0, 1] : []; // side t in the game = seat teamSeat[t] (not used in a team battle)
    this.deadline = 0; this.turnAt = 0; this.next = [false, false]; this.rematch = [false, false];
    this.subs = new Set(); this.touched = Date.now();
  }
  // subscribe(seat, fn): fn(msg) gets every message for everyone plus those for this seat. Returns unsubscribe.
  subscribe(seat, fn) { const s = { seat, fn }; this.subs.add(s); return () => this.subs.delete(s); }
  emit(msg, to, except) { for (const s of this.subs) if ((to == null || s.seat === to) && s.seat !== except) s.fn(msg); }
  ffa() { return this.mode === 'ffa'; }
  teams() { return this.mode === 'teams'; }
  oneRound() { return this.mode !== 'duel'; } // free-for-all and team battle: one round a match, then back to the lobby
  need() { return this.oneRound() ? 1 : NEED; }
  // team battle: which seat plays the unit whose turn it is (-1: a computer, or a player who has dropped)
  ownerSeat() { const o = this.G ? WB.owner(this.G) : -1, st = o >= 0 ? this.seats[o] : null; return st && st.connected ? o : -1; }
  // whose move the server will take right now: a seat, or -1 for a computer
  turnSeat() { return this.teams() ? this.ownerSeat() : this.seatOf(this.G.team); }
  host() { return this.seats.findIndex((s) => s && s.connected); }
  sideOf(seat) { return this.teams() ? (seat >= TEAM_SLOTS ? 1 : 0) : this.teamSeat.indexOf(seat); }
  seatOf(side) { return this.teamSeat[side]; }
  pubSeats() { return this.seats.map((s) => (s ? { name: s.name, char: s.char, ready: s.ready, connected: s.connected } : null)); }
  roomMsg() {
    return { t: 'room', code: this.code, mode: this.mode, max: this.max, host: this.host(), seats: this.pubSeats(), phase: this.phase,
      round: this.round, wins: this.wins.slice(), bestOf: this.oneRound() ? 1 : BEST_OF, need: this.need(), teamSeat: this.teamSeat.slice(), size: this.size };
  }
  sendRoom() { this.emit(this.roomMsg()); }
  empty() { return this.seats.every((s) => !s || !s.connected); }

  // ---------- seats ----------
  // the first player in decides what kind of room it is
  setMode(mode) {
    this.mode = mode === 'ffa' ? 'ffa' : mode === 'teams' ? 'teams' : 'duel'; this.max = this.ffa() ? FFA_SEATS : this.teams() ? TEAM_SEATS : SEATS;
    this.seats = Array.from({ length: this.max }, () => null); this.teamSeat = this.mode === 'duel' ? [0, 1] : [];
  }
  create(name) { if (this.seats.some(Boolean)) return { error: 'code in use' }; return this.take(0, name); }
  join(name) {
    if (!this.seats.some(Boolean)) return { error: 'no room with that code' };
    if (this.oneRound() && this.phase !== 'lobby') return { error: 'that match has started: join when it ends' };
    if (this.teams()) { // the team with fewer players, its first free slot
      const free = (t) => { for (let k = 0; k < this.size; k++) { const st = this.seats[t * TEAM_SLOTS + k]; if (!st || !st.connected) return t * TEAM_SLOTS + k; } return -1; };
      const count = (t) => this.seats.slice(t * TEAM_SLOTS, t * TEAM_SLOTS + TEAM_SLOTS).filter((st) => st && st.connected).length;
      const t = count(1) < count(0) ? 1 : 0, at = free(t) >= 0 ? free(t) : free(1 - t);
      return at < 0 ? { error: 'that room is full' } : this.take(at, name);
    }
    let i = this.seats.findIndex((s) => !s);
    // a free-for-all lobby can hand a seat whose player has gone to someone new
    if (i < 0 && this.ffa()) i = this.seats.findIndex((s) => s && !s.connected);
    if (i < 0) return { error: 'that room is full' };
    return this.take(i, name);
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
  leave(i) {
    if (!this.seats[i]) return;
    this.seats[i].connected = false; this.seats[i].ready = this.oneRound() && this.phase === 'lobby' ? false : this.seats[i].ready;
    if (this.teams()) { if (this.phase === 'playing' && this.G && this.G.phase === 'aim' && WB.owner(this.G) === i) this.botAt = Date.now() + BOT_THINK_MS; } // a computer takes over their unit
    else if (this.phase === 'playing' && this.G && this.G.phase === 'aim' && this.sideOf(i) === this.G.team) this.deadline = Math.min(this.deadline, Date.now() + GONE_LIMIT_MS);
    this.sendRoom();
  }

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
    if (!this.oneRound() && this.seats.every((x) => x && x.char && x.ready)) this.startMatch();
    return {};
  }
  // team battle lobby: change teams, and (the host) how many units a side
  setTeam(i, side) {
    if (!this.teams() || this.phase !== 'lobby' || !this.seats[i]) return { error: 'not now' };
    const t = side === 1 ? 1 : 0; if (this.sideOf(i) === t) return {};
    let at = -1; for (let k = 0; k < this.size && at < 0; k++) { const st = this.seats[t * TEAM_SLOTS + k]; if (!st || !st.connected) at = t * TEAM_SLOTS + k; }
    if (at < 0) return { error: 'that team is full' };
    this.seats[at] = this.seats[i]; this.seats[i] = null; this.seats[at].ready = false; this.sendRoom();
    return { seat: at, token: this.seats[at].token, moved: true };
  }
  setSize(i, n) {
    if (!this.teams() || this.phase !== 'lobby') return { error: 'not now' };
    if (i !== this.host()) return { error: 'only the room\'s host can change that' };
    n = Math.max(2, Math.min(TEAM_SLOTS, n | 0));
    for (const t of [0, 1]) for (let k = n; k < TEAM_SLOTS; k++) { const st = this.seats[t * TEAM_SLOTS + k]; if (st && st.connected) return { error: 'someone is sitting in a slot that would close' }; }
    for (const t of [0, 1]) for (let k = n; k < TEAM_SLOTS; k++) this.seats[t * TEAM_SLOTS + k] = null;
    this.size = n; for (const st of this.seats) if (st) st.ready = false; this.sendRoom(); return {};
  }
  // free-for-all: the host starts with everyone who's here; they must all have picked and be ready
  start(i) {
    if (!this.oneRound()) return { error: '1v1 rooms start when both are ready' };
    if (this.phase !== 'lobby') return { error: 'not now' };
    if (i !== this.host()) return { error: 'only the room\'s host can start' };
    const here = this.seats.map((s, j) => (s && s.connected ? j : -1)).filter((j) => j >= 0);
    if (here.length < (this.teams() ? 1 : 2)) return { error: 'needs at least 2 players' };
    if (here.some((j) => !this.seats[j].char || !this.seats[j].ready)) return { error: 'not everyone is ready' };
    this.seats = this.seats.map((s) => (s && s.connected ? s : null)); // players who left before the start lose their seat
    if (!this.teams()) this.teamSeat = here;
    this.startMatch();
    return {};
  }
  startMatch() { this.round = 1; this.wins = new Array(this.teams() ? 2 : this.teamSeat.length).fill(0); this.startRound(); }
  startRound() {
    this.phase = 'playing'; this.seq = 0; this.next = [false, false]; this.rematch = [false, false];
    const n = this.teams() ? 2 : this.teamSeat.length;
    if (this.oneRound()) { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; this.matches = (this.matches || 0) + 1; }
    const seed = (this.seed + this.round * 7919) >>> 0;
    const first = this.oneRound() ? (this.matches - 1) % n : (this.round - 1) % 2; // who goes first rotates
    if (this.teams()) { // one unit per slot: the player sitting there, or a computer with a character picked from the seed
      let r = seed; const rnd = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 4294967296; };
      const chars = [], owners = [];
      for (const t of [0, 1]) for (let k = 0; k < this.size; k++) { const j = t * TEAM_SLOTS + k, st = this.seats[j]; chars.push(st ? st.char : WB.CHAR_IDS[Math.floor(rnd() * WB.CHAR_IDS.length)]); owners.push(st ? j : -1); }
      this.opts = { teams: 2, size: this.size, first, chars, owners, recipe: 'teams' };
    } else this.opts = { teams: n, first, chars: this.teamSeat.map((j) => this.seats[j].char) };
    this.G = WB.newGame(seed, this.opts); this.gameSeed = seed;
    this.turnAt = Date.now(); this.deadline = this.turnAt + this.turnLimit(); this.botAt = this.turnAt + BOT_THINK_MS * 2;
    this.sendRoom();
    this.emit({ t: 'round', round: this.round, seed, opts: this.opts, wins: this.wins.slice(), teamSeat: this.teamSeat.slice(), hash: WB.hash(this.G) });
  }

  // ---------- play ----------
  act(i, raw) {
    if (this.phase !== 'playing' || !this.G) return { error: 'no game running' };
    const G = this.G; if (G.phase !== 'aim') return { error: 'wait for the shot to land' };
    if (this.turnSeat() !== i) return { error: 'not your turn' };
    const it = cleanIntent(raw); if (!it) return { error: 'not a move' };
    return this.apply(it);
  }
  // Play one checked move on the server's game and tell everyone. Used for players and for the server's computers.
  apply(it) {
    const G = this.G, by = G.team;
    if (!WB.act(G, it)) return { error: 'that move isn\'t allowed' };
    const ticks = G.phase === 'flight' ? WB.resolve(G) : 0; // play the shot through to the end, here and now
    this.seq++; this.touched = Date.now();
    this.emit({ t: 'applied', seq: this.seq, by, it, hash: WB.hash(G), turn: G.turn });
    if (G.phase === 'aim' && it.k !== 'move' && it.k !== 'weapon') { // a new turn: its clock starts when the shot has landed on the players' screens
      this.turnAt = Date.now() + (this.teams() ? ticks * WB.TICK * 1000 : 0); this.deadline = this.turnAt + this.turnLimit(); this.botAt = this.turnAt + BOT_THINK_MS;
    }
    if (G.phase === 'over') this.roundOver();
    return {};
  }
  // A computer's whole turn: decided on a copy (the same way the browser's 1 Player computers do), then played move by move.
  botTurn() {
    const plan = WB.botTurn(JSON.parse(JSON.stringify(this.G)), BOT_STYLE), turn = this.G.turn;
    for (const it of plan) { if (this.phase !== 'playing' || this.G.phase !== 'aim' || this.G.turn !== turn) break; this.apply(it); }
    if (this.phase === 'playing' && this.G.phase === 'aim' && this.G.turn === turn) this.apply({ k: 'pass' });
  }
  aim(i, angle, power) {
    if (this.phase !== 'playing' || !this.G || this.turnSeat() !== i) return {};
    const a = num(angle, 0, 360), p = num(power, 0, 1); if (!Number.isFinite(a) || !Number.isFinite(p)) return {};
    this.emit({ t: 'aim', by: this.G.team, angle: a, power: p }, null, i);
    return {};
  }
  roundOver() {
    const w = this.G.winner;
    if (w >= 0) this.wins[w]++;
    const match = this.oneRound() || this.wins.some((x) => x >= NEED);
    this.phase = this.oneRound() ? 'lobby' : match ? 'matchover' : 'roundover';
    this.deadline = match ? 0 : Date.now() + NEXT_LIMIT_MS;
    if (this.oneRound()) for (const s of this.seats) if (s) s.ready = false; // back to the lobby: ready up for the next one
    this.emit({ t: 'roundover', winner: w, wins: this.wins.slice(), match });
    this.sendRoom();
  }
  nextRound(i) {
    if (this.phase !== 'roundover' || this.oneRound()) return { error: 'not now' };
    this.next[i] = true;
    if (this.next.every(Boolean)) { this.round += this.G && this.G.winner >= 0 ? 1 : 0; this.startRound(); }
    return {};
  }
  wantRematch(i) {
    if (this.phase !== 'matchover' || this.oneRound()) return { error: 'not now' };
    this.rematch[i] = true; this.sendRoom();
    if (this.rematch.every(Boolean)) { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; this.startMatch(); }
    return {};
  }
  // The clock: a player who vanished mid-turn gets their turn passed; a round screen nobody leaves moves on.
  turnLimit() { if (this.teams()) return TURN_LIMIT_MS; const s = this.G && this.seats[this.seatOf(this.G.team)]; return s && !s.connected ? GONE_LIMIT_MS : TURN_LIMIT_MS; }
  tick(now = Date.now()) {
    if (this.teams() && this.phase === 'playing' && this.G && this.G.phase === 'aim') { // computers play their units (one turn a tick, so every shot gets watched)
      if (this.ownerSeat() < 0) { if (now >= this.botAt) this.botTurn(); return; }
      if (now >= this.deadline) this.apply({ k: 'pass' }); // a player who is here but ran out of time
      return;
    }
    if (this.phase === 'playing' && this.G && this.G.phase === 'aim') this.deadline = Math.min(this.deadline, this.turnAt + this.turnLimit());
    if (!this.deadline || now < this.deadline) return;
    if (this.phase === 'playing' && this.G && this.G.phase === 'aim') this.act(this.seatOf(this.G.team), { k: 'pass' });
    else if (this.phase === 'roundover') { this.next = [true, true]; this.round += this.G && this.G.winner >= 0 ? 1 : 0; this.startRound(); }
  }
  state(i) {
    const live = this.G && this.phase !== 'lobby';
    return Object.assign(this.roomMsg(), { t: 'state', you: i, seq: this.seq, G: live ? JSON.parse(JSON.stringify(this.G)) : null, opts: this.opts, seed: this.gameSeed });
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
        if (m.t === 'create') { if (!this.seats.some(Boolean) && this.phase === 'lobby') this.setMode(m.mode); return enter(this.create(m.name)); }
        if (m.t === 'join') return enter(this.join(m.name));
        if (m.t === 'rejoin') return enter(this.rejoin(m.token));
        if (seat < 0) return send({ t: 'error', error: 'join the room first' });
        let r = {};
        switch (m.t) {
          case 'pick': r = this.pick(seat, m.char); break;
          case 'ready': r = this.ready(seat, m.on); break;
          case 'start': r = this.start(seat); break;
          case 'team': r = this.setTeam(seat, m.side); if (r.moved) { seat = r.seat; if (off) off(); off = this.subscribe(seat, send); send({ t: 'joined', code: this.code, seat, token: r.token }); r = {}; } break;
          case 'size': r = this.setSize(seat, m.n); break;
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

module.exports = { Room, newCode, cleanIntent, SEATS, FFA_SEATS, TEAM_SLOTS, TEAM_SEATS, BOT_THINK_MS, BEST_OF, TURN_LIMIT_MS, NEXT_LIMIT_MS, GONE_LIMIT_MS };
