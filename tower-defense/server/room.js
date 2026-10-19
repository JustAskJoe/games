/* Tower Defense co-op room. © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

   One room = one shared run. The server owns the true game (the same engine.js the phone runs) and an
   ordered log of every action that changed it. Clients send intents; the server checks them, applies them,
   and broadcasts them with a sequence number. Every client applies the same intents in the same order to
   its own copy of the engine, so everyone sees the same game without streaming positions. During a wave
   nobody acts (players watch), so each client just runs step() locally; the engine is deterministic.

   Why this shape (borrowed from Trickbound's table server, adapted for a real-time game):
   1. One action path. Humans, bots and (later) the 3v1 wave player all produce intents that go through
      TD.act(). The room never branches on who sent it beyond "is it your turn to do this".
   2. Intents, not state. A client says "build arrow at 3,3"; it never sends gold or health. A modified
      client can't cheat.
   3. Seeded + logged. seed + log replays the run exactly. Checkpoints carry a hash so a client can tell
      it has drifted (and ask for a resync) instead of quietly playing a different game.

   Co-op rules in this first pass (Prototype 1 engine, so still one shared purse):
   - Gold and keep health are shared. Anyone can build, upgrade or sell during the build phase.
   - The wave starts when every human seat has tapped Ready (any build action un-readies you).
   - The draft rotates: after wave 1 seat 1 picks, after wave 2 seat 2, and so on. Bots pick by the bot rule.
   - Per-player gold, gifting and buy-back come with the co-op engine (see README, "Next").
*/
'use strict';
const crypto = require('crypto');
const TD = require('../prototype/engine.js');

const MAX_SEATS = 4;
const BUILD_INTENTS = new Set(['build', 'upgrade', 'sell']);

class Seat {
  constructor(i, kind, name) {
    this.i = i; this.kind = kind; this.name = name;
    this.token = kind === 'human' ? crypto.randomBytes(12).toString('hex') : null;
    this.ready = kind !== 'human'; this.connected = kind !== 'human';
  }
  pub() { return { i: this.i, kind: this.kind, name: this.name, ready: this.ready, connected: this.connected }; }
}

class GameRoom {
  constructor(code, opts = {}) {
    this.code = code;
    this.seed = opts.seed >>> 0 || (1 + crypto.randomInt(1, 1e9));
    this.G = TD.newGame(this.seed);
    this.seats = [];
    this.log = [];           // [{ seq, by, it }] every applied intent, in order
    this.checkpoints = [];   // [{ wave, seq, hash }] state after each wave resolves
    this.started = false;
    this.listeners = new Set();
  }

  // ---------- seats ----------
  join(name) {
    if (this.seats.length >= MAX_SEATS) return { error: 'room is full' };
    if (this.started) return { error: 'run already started; rejoin with your token' };
    const s = new Seat(this.seats.length, 'human', String(name || `Player ${this.seats.length + 1}`).slice(0, 24));
    s.connected = true; this.seats.push(s); this.emit({ type: 'seats' });
    return { seat: s.i, token: s.token };
  }
  rejoin(token) { const s = this.seats.find((x) => x.token && x.token === token); if (!s) return { error: 'unknown token' }; s.connected = true; this.emit({ type: 'seats' }); return { seat: s.i }; }
  leave(seatI) { const s = this.seats[seatI]; if (s) { s.connected = false; this.emit({ type: 'seats' }); } }
  addBot() { if (this.seats.length >= MAX_SEATS || this.started) return false; this.seats.push(new Seat(this.seats.length, 'bot', `Bot ${this.seats.length + 1}`)); this.emit({ type: 'seats' }); return true; }
  // 3v1 hook: a 'waves' seat would choose the next wave's groups instead of building. Not built yet; the engine
  // needs a wave-composition intent first. Keeping the kind here so the lobby and protocol already allow it.
  addWavePlayer() { return { error: '3v1 wave player is not built yet' }; }

  // ---------- turn rules ----------
  drafter() { return this.seats.length ? (this.G.wave - 1 + this.seats.length) % this.seats.length : 0; }
  start() { if (!this.seats.length) return { error: 'nobody here' }; this.started = true; this.emit({ type: 'started' }); this.runBots(); return { ok: true }; }

  // An intent from a seat. Returns { ok } or { error }. Never throws on bad input.
  intent(seatI, it) {
    const s = this.seats[seatI], G = this.G;
    if (!s) return { error: 'no such seat' };
    if (!this.started) return { error: 'run not started' };
    if (!it || typeof it.k !== 'string') return { error: 'bad intent' };
    if (it.k === 'ready') {
      if (G.phase !== 'build') return { error: 'not the build phase' };
      s.ready = it.on !== false; this.emit({ type: 'seats' });
      if (this.seats.every((x) => x.ready)) this.apply(-1, { k: 'start' });
      return { ok: true };
    }
    if (BUILD_INTENTS.has(it.k)) {
      if (G.phase !== 'build') return { error: 'can only build between waves' };
      const clean = { k: it.k, type: it.type, c: it.c | 0, r: it.r | 0, branch: it.branch };
      Object.keys(clean).forEach((k) => clean[k] === undefined && delete clean[k]);
      if (!this.apply(seatI, clean)) return { error: 'not allowed (gold, spot or tower)' };
      this.seats.forEach((x) => { if (x.kind === 'human') x.ready = false; }); // the board changed: everyone re-confirms
      this.emit({ type: 'seats' });
      return { ok: true };
    }
    if (it.k === 'pick' || it.k === 'skip') {
      if (G.phase !== 'draft') return { error: 'no draft open' };
      if (seatI !== this.drafter()) return { error: `seat ${this.drafter() + 1} drafts this time` };
      if (!this.apply(seatI, it.k === 'pick' ? { k: 'pick', card: String(it.card) } : { k: 'skip' })) return { error: 'that card is not on offer' };
      return { ok: true };
    }
    if (it.k === 'start') return { error: 'use ready; the wave starts when everyone is ready' };
    return { error: `unknown intent ${it.k}` };
  }

  // ---------- applying ----------
  apply(by, it) {
    if (!TD.act(this.G, it)) return false;
    const entry = { seq: this.log.length, by, it };
    this.log.push(entry); this.emit({ type: 'applied', entry });
    if (it.k === 'start') this.resolveWave();
    if (this.G.phase === 'build') this.seats.forEach((x) => { x.ready = x.kind !== 'human'; });
    this.runBots();
    return true;
  }
  // The server plays the wave out instantly; clients watch theirs in real time and catch up to the checkpoint.
  resolveWave() {
    const G = this.G; let guard = 0;
    while (G.phase === 'wave' && guard++ < 200000) TD.step(G);
    const cp = { wave: G.stats.wavesCleared, seq: this.log.length, phase: G.phase, hash: TD.hash(G) };
    this.checkpoints.push(cp); this.emit({ type: 'checkpoint', cp });
  }
  // Bots act through the same intents. They ready up instantly and pick by the bot rule on their draft turn.
  runBots() {
    const G = this.G;
    if (G.phase === 'draft') { const d = this.seats[this.drafter()]; if (d && d.kind === 'bot') this.apply(d.i, { k: 'pick', card: TD.botPick(G) }); }
  }

  // ---------- views ----------
  // Everything a client needs to rebuild the game: seed + the full log (cheap: intents only).
  snapshot(forSeat) {
    return { code: this.code, seed: this.seed, you: forSeat, started: this.started, seats: this.seats.map((s) => s.pub()),
      drafter: this.drafter(), log: this.log, checkpoints: this.checkpoints, hash: TD.hash(this.G), phase: this.G.phase };
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(msg) { if (msg.type === 'seats') msg.seats = this.seats.map((s) => s.pub()); for (const fn of this.listeners) fn(msg); }
}

// Client side of the same contract, usable in node (tests) and in the browser (co-op UI, Prototype 2).
// Feed it every 'applied' entry; it applies them in order, waiting while a local wave is still playing.
class Replica {
  constructor(seed) { this.G = TD.newGame(seed); this.next = 0; this.pending = []; }
  push(entry) { this.pending.push(entry); this.pending.sort((a, b) => a.seq - b.seq); this.drain(); }
  drain() {
    while (this.pending.length && this.pending[0].seq === this.next && this.G.phase !== 'wave') {
      const e = this.pending.shift(); if (!TD.act(this.G, e.it)) throw new Error(`desync at seq ${e.seq}`); this.next++;
    }
  }
  tick() { if (this.G.phase === 'wave') { TD.step(this.G); if (this.G.phase !== 'wave') this.drain(); } } // call 20x/sec (or faster to catch up)
  // Fast-forward: finish the current wave, apply what's queued, and repeat until fully caught up (late join, resync).
  finishWave() {
    let g = 0;
    do { while (this.G.phase === 'wave' && g++ < 2000000) TD.step(this.G); this.drain(); } while (this.G.phase === 'wave' && g < 2000000);
  }
  hash() { return TD.hash(this.G); }
}

module.exports = { GameRoom, Replica, MAX_SEATS };
