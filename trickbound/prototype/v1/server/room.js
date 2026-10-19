// Trickbound multiplayer base: a host-authoritative GameRoom around the shared engine.
// © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
//
// One GameRoom = one table. Every seat is a Seat (bot or human) behind the same decide() interface,
// so the hand loop never cares who is sitting where. Humans answer through intents; bots answer
// through the engine's own brains. Clients only ever receive viewFor(seat), never the full game.
'use strict';
const SP = require('../engine.js');

const DEFAULT_RULES = { target: 250 };

class Seat {
  constructor(ix, opts) {
    this.ix = ix; this.kind = opts.kind || 'bot'; this.name = opts.name || SP.PERSONAS.you.name; this.persona = opts.persona || SP.PERSONAS.you;
    this.familiar = opts.familiar || null; this.token = opts.token || null; this.connected = this.kind === 'bot';
    this.pending = null; // { kind, options, resolve }
  }
  get isHuman() { return this.kind === 'human'; }
}

// What a given seat is allowed to see. Other hands are counts; your own knowledge (Owlet/Raven/Frog) is yours alone.
function viewFor(G, seat, room) {
  const me = G.players[seat];
  return {
    seat, hand: me.hand.slice(), known: (G.known && G.known[seat]) ? G.known[seat].filter((c) => G.players[SP.partnerOf(seat)].hand.includes(c)) : [],
    spadeInfo: G.spadeInfo ? G.spadeInfo[seat] : null,
    players: G.players.map((p, i) => ({ seat: i, name: room.seats[i].name, kind: room.seats[i].kind, connected: room.seats[i].connected, cards: p.hand.length, bid: p.bid, nil: p.nil, blind: p.blind, tricks: p.tricks, familiar: p.familiar, famUsed: p.famUsed, charges: p.famCharges === Infinity ? null : p.famCharges })),
    score: G.score.slice(), bags: G.bags.slice(), handNo: G.handNo, dealer: G.dealer, leader: G.leader, turn: G.turn,
    trick: G.trick.map((x) => ({ seat: x.seat, c: x.c, flare: !!x.flare })), lastTrick: G.lastTrick, spadesBroken: G.spadesBroken, tricksPlayed: G.tricksPlayed,
    rules: G.rules, legal: G.turn === seat && G.trick !== undefined && me.bid !== null && G.players.every((p) => p.bid !== null) ? SP.legalPlays(G, seat) : [],
    history: G.history, over: SP.gameOver(G), phase: room.phase, log: room.log.slice(-6),
  };
}

class GameRoom {
  constructor(code, opts) {
    this.code = code; this.rules = Object.assign({}, DEFAULT_RULES, (opts && opts.rules) || {});
    this.seats = [0, 1, 2, 3].map((i) => new Seat(i, { kind: 'bot', persona: [SP.PERSONAS.tally, SP.PERSONAS.gus, SP.PERSONAS.dee, SP.PERSONAS.birdie][i], name: [SP.PERSONAS.tally, SP.PERSONAS.gus, SP.PERSONAS.dee, SP.PERSONAS.birdie][i].name, familiar: (opts && opts.familiars && opts.familiars[i]) || null }));
    this.G = null; this.phase = 'lobby'; this.log = []; this.listeners = new Set(); this.flags = []; this.botDelay = (opts && opts.botDelay) || 0; this.seed = (opts && opts.seed) || Math.floor(Math.random() * 1e9);
    this.running = false;
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(event) { for (const fn of this.listeners) fn(event); }
  say(line) { this.log.push(line); if (this.log.length > 40) this.log.shift(); this.emit({ t: 'log', line }); }

  // ---- lobby ----
  sit(ix, opts) { const s = this.seats[ix]; Object.assign(s, { kind: 'human', name: opts.name || 'Player', persona: Object.assign({}, SP.PERSONAS.you, { name: opts.name || 'Player' }), familiar: opts.familiar || s.familiar, token: opts.token, connected: true }); this.emit({ t: 'seats' }); return s; }
  leave(ix) { const s = this.seats[ix]; if (!s.isHuman) return; s.connected = false; this.emit({ t: 'seats' }); }
  reconnect(token) { const s = this.seats.find((x) => x.token === token); if (!s) return null; s.connected = true; this.emit({ t: 'seats' }); return s; }
  botFill(ix) { const s = this.seats[ix]; s.kind = 'bot'; s.token = null; s.connected = true; if (s.pending) { const p = s.pending; s.pending = null; p.resolve(this.botAnswer(ix, p.kind, p.options)); } this.emit({ t: 'seats' }); }

  // ---- decisions: the one interface every seat shares ----
  decide(ix, kind, options) {
    const s = this.seats[ix];
    if (!s.isHuman || !s.connected) return Promise.resolve(this.botAnswer(ix, kind, options));
    return new Promise((resolve) => { s.pending = { kind, options, resolve }; this.emit({ t: 'prompt', seat: ix, kind, options }); });
  }
  botAnswer(ix, kind, options) {
    const G = this.G;
    if (kind === 'blind') return SP.botBlindNil(G, ix);
    if (kind === 'bid') return SP.botBid(G, ix);
    if (kind === 'familiar') { const F = SP.famOf(G, ix); if (!F) return null; const d = F.botUse(G, ix); return d ? (typeof d === 'object' ? d : {}) : null; }
    if (kind === 'hopgive') return { back: SP.hopPick(G, ix) };
    if (kind === 'play') { let c = SP.botPlay(G, ix); if (c && typeof c === 'object') { if (c.burrow) { SP.useFamiliar(G, ix); c = SP.botPlay(G, ix); if (c && typeof c === 'object') c = SP.legalPlays(G, ix)[0]; return { c, burrowed: true }; } if (c.flare !== undefined) return { c: c.flare, flare: true }; } return { c }; }
    return null;
  }
  // A human's answer arrives as an intent. Validation happens here, against the engine, so a bad client can't cheat.
  intent(ix, msg) {
    const s = this.seats[ix]; const p = s.pending; if (!p) return { ok: false, error: 'nothing to decide' };
    const G = this.G; let v;
    if (p.kind === 'blind' && msg.t === 'blind') v = !!msg.yes;
    else if (p.kind === 'bid' && msg.t === 'bid') {
      const b = { bid: Number(msg.bid) || 0, nil: !!msg.nil };
      if (G.rules.mirror) { const m = SP.mirrorBid(G, ix); if (m.nil !== b.nil || (!m.nil && m.bid !== b.bid)) return { ok: false, error: 'miner’s count: bid your night' }; }
      if (G.rules.nilNight) { const mn = SP.nilNightSeat(G, ix); if (mn !== b.nil) return { ok: false, error: 'the long night: one of you bids nil' }; }
      if (!b.nil && (b.bid < 1 || b.bid > 13)) return { ok: false, error: 'bid 1–13 or nil' };
      v = b;
    } else if (p.kind === 'familiar' && (msg.t === 'familiar' || msg.t === 'skip')) v = msg.t === 'skip' ? null : (msg.args || {});
    else if (p.kind === 'hopgive' && msg.t === 'hopgive') { if (!G.players[ix].hand.includes(msg.c)) return { ok: false, error: 'not your card' }; v = { back: msg.c }; }
    else if (p.kind === 'play' && msg.t === 'play') {
      if (msg.burrow) { if (!(G.players[ix].familiar === 'mouse' && SP.FAMILIARS.mouse.canUse(G, ix))) return { ok: false, error: 'no burrow' }; SP.useFamiliar(G, ix); this.emit({ t: 'familiar', seat: ix, id: 'mouse' }); }
      if (msg.spark) { if (!(G.players[ix].familiar === 'salamander' && SP.FAMILIARS.salamander.canUse(G, ix))) return { ok: false, error: 'no spark' }; SP.useFamiliar(G, ix); this.emit({ t: 'familiar', seat: ix, id: 'salamander' }); }
      if (!SP.legalPlays(G, ix).includes(msg.c)) return { ok: false, error: 'illegal play', legal: SP.legalPlays(G, ix) };
      if (msg.flare && !(G.players[ix].familiar === 'kilnback' && SP.FAMILIARS.kilnback.canUse(G, ix))) return { ok: false, error: 'no flare' };
      v = { c: msg.c, flare: !!msg.flare };
    } else return { ok: false, error: `expected ${p.kind}` };
    s.pending = null; p.resolve(v); return { ok: true };
  }
  flag(ix, note) { const G = this.G; const rec = { seat: ix, note, handNo: G.handNo, trick: G.trick.slice(), lastTrick: G.lastTrick, seed: this.seed, at: Date.now() }; this.flags.push(rec); return rec; }

  // ---- the hand loop (same shape as the phone client's playHand, with decide() in place of ask()) ----
  async start() {
    if (this.running) return; this.running = true; this.phase = 'playing';
    const personas = this.seats.map((s) => s.persona);
    const G = this.G = SP.newMatch(this.seed, personas, this.rules); G.dealer = Math.floor(G.r() * 4);
    this.seats.forEach((s, i) => { G.players[i].familiar = s.familiar; });
    for (let h = 0; h < 60; h++) {
      G.handNo = h; await this.playHand(); this.emit({ t: 'handEnd', result: G.history[G.history.length - 1] });
      if (SP.gameOver(G) >= 0) break; G.dealer = (G.dealer + 1) % 4;
    }
    this.phase = 'over'; this.emit({ t: 'gameOver', winner: SP.gameOver(G) }); this.running = false;
  }
  async wait(ms) { if (this.botDelay) await new Promise((r) => setTimeout(r, Math.min(ms, this.botDelay))); }
  async familiarPhase(phase) {
    const G = this.G;
    for (let k = 0; k < 4; k++) {
      const s = (G.leader + k) % 4; const F = SP.famOf(G, s); if (!F || F.when !== phase || !F.canUse(G, s)) continue;
      if (F.id === 'frog') {
        const p = SP.partnerOf(s); const giveAns = await this.decide(s, 'familiar', { id: 'frog', pickCard: true }); if (!giveAns) continue;
        const backAns = await this.decide(p, 'hopgive', { from: s }); const r = SP.useFamiliar(G, s, { give: giveAns.give, back: backAns.back });
        if (r && r.give !== undefined) this.emit({ t: 'familiar', seat: s, id: 'frog' });
        continue;
      }
      const a = await this.decide(s, 'familiar', { id: F.id }); if (a === null || a === undefined) continue;
      const r = SP.useFamiliar(G, s, a); if (r) this.emit({ t: 'familiar', seat: s, id: F.id, info: F.id === 'koi' ? r : undefined });
    }
  }
  async playHand() {
    const G = this.G; SP.deal(G); this.say(`Hand ${G.handNo + 1}. ${this.seats[G.dealer].name} deals.`); this.emit({ t: 'deal' });
    for (let k = 0; k < 4; k++) {
      const s = (G.dealer + 1 + k) % 4; G.turn = s; this.emit({ t: 'turn', seat: s, what: 'bid' });
      const F = SP.famOf(G, s); if (F && F.when === 'beforeBid' && F.canUse(G, s)) { const a = await this.decide(s, 'familiar', { id: F.id }); if (a !== null && a !== undefined) { SP.useFamiliar(G, s, a); this.emit({ t: 'familiar', seat: s, id: F.id }); } }
      let b = null;
      if (SP.canBlindNil(G, s)) { const yes = await this.decide(s, 'blind', {}); if (yes) b = { bid: 0, nil: true, blind: true }; }
      if (!b) b = await this.decide(s, 'bid', { mirror: G.rules.mirror ? SP.mirrorBid(G, s) : null, mustNil: G.rules.nilNight ? SP.nilNightSeat(G, s) : null });
      SP.setBid(G, s, b); this.say(`${this.seats[s].name} bids ${b.nil ? (b.blind ? 'blind nil' : 'nil') : b.bid}.`); this.emit({ t: 'bid', seat: s, bid: G.players[s].bid, nil: G.players[s].nil, blind: G.players[s].blind });
      await this.wait(500);
    }
    await this.familiarPhase('afterBids');
    G.turn = G.leader;
    while (G.tricksPlayed < 13) {
      const s = G.turn;
      if (G.trick.length === 0 && G.tricksPlayed === 1) await this.familiarPhase('afterTrick1');
      if (G.trick.length === 0) { const F = SP.famOf(G, s); if (F && F.id === 'salamander' && F.canUse(G, s) && !this.seats[s].isHuman) { if (F.botUse(G, s)) { SP.useFamiliar(G, s); this.emit({ t: 'familiar', seat: s, id: 'salamander' }); } } }
      this.emit({ t: 'turn', seat: s, what: 'play' });
      const a = await this.decide(s, 'play', { legal: SP.legalPlays(G, s) });
      if (a.burrowed) this.emit({ t: 'familiar', seat: s, id: 'mouse' });
      const r = SP.playCard(G, s, a.c, a.flare ? { flare: true } : null);
      if (a.flare) this.emit({ t: 'familiar', seat: s, id: 'kilnback', c: a.c });
      this.emit({ t: 'play', seat: s, c: a.c, flare: !!a.flare });
      await this.wait(400);
      if (r.done) { this.say(`${this.seats[r.winner].name} takes the book.`); this.emit({ t: 'trick', winner: r.winner, cards: G.lastTrick.cards }); await this.wait(900); }
    }
    const res = SP.settle(G); G.turn = -1; return res;
  }
}

module.exports = { GameRoom, Seat, viewFor };
