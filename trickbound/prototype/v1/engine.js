// Trickbound engine: Spades rules, bots, scoring, seeded RNG, headless sim.
// © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
// Pure functions, no DOM. Runs in the browser as window.SP and in node via module.exports.
(function (root) {
  // Cards 0..51. suit = floor(c/13): 0 ♠ Dusk (trump), 1 ♥ Ember, 2 ♦ Tide, 3 ♣ Grove. rank = c%13: 0 = 2 … 12 = A.
  const SUITS = ['Dusk', 'Ember', 'Tide', 'Grove'];
  const SUIT_SYM = ['♠', '♥', '♦', '♣'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suit = (c) => Math.floor(c / 13);
  const rank = (c) => c % 13;
  const card = (s, r) => s * 13 + r;
  const cardName = (c) => RANKS[rank(c)] + SUIT_SYM[suit(c)];
  const teamOf = (seat) => seat % 2;
  const partnerOf = (seat) => (seat + 2) % 4;

  // Seeded RNG (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const RULES = {
    target: 500,        // first team to reach wins
    floor: -200,        // a team at or below this loses
    trick: 10,          // points per bid trick made
    setPenalty: 10,     // points lost per bid trick when set
    bagsAt: 10,         // every N bags…
    bagPenalty: 100,    // …costs this much
    nil: 100,           // nil bonus / penalty
    blindNil: 200,      // blind nil bonus / penalty
    blindNilOn: true,   // Special: blind nil allowed
    blindNilBehind: 100,// …only when your team trails by at least this
    breakSpades: true,  // no spade leads until a spade has been played (unless only spades)
    nilTricksAreBags: true, // a failed nil's tricks count as bags, never toward partner's bid
    mirror: false,      // house rule: you must bid exactly the number of spades you hold (none = nil)
    grownCharges: 1,    // grown familiars: uses per night (young and information familiars reset every hand)
    nilNight: false,    // house rule: one partner on each team must bid nil every hand
    goingDark: false,   // house rule: blind nil allowed any time, not only when behind
  };

  // Personas: aggr shifts the bid; nilThresh is how much risk a bot accepts for nil; bagHate makes it duck when bid is made.
  const PERSONAS = {
    dee:    { key: 'dee',    name: 'Dee',        aggr: 0.45, nilThresh: 2.4, bagHate: 0.4, blurb: 'Won the Long Table once. Bids it and makes it.' },
    tally:  { key: 'tally',  name: 'Tally',      aggr: -0.3, nilThresh: 3.2, bagHate: 0.7, blurb: 'Depot bookkeeper. Counts every card.' },
    foreman:{ key: 'foreman',name: 'The Foreman',aggr: 0.05, nilThresh: 2.0, bagHate: 1.0, blurb: 'Ran the mine. Hates bags.' },
    jo:     { key: 'jo',     name: 'Jo',         aggr: 0.25, nilThresh: 4.2, bagHate: 0.3, blurb: 'Young brakeman. Bids nil way too often.' },
    gus:    { key: 'gus',    name: 'Gus',        aggr: 0.1,  nilThresh: 2.8, bagHate: 0.6, blurb: 'Cinder Hollow regular.' },
    birdie: { key: 'birdie', name: 'Birdie',     aggr: 0.2,  nilThresh: 3.0, bagHate: 0.5, blurb: 'Cinder Hollow regular.' },
    ada:    { key: 'ada',    name: 'Ada',        aggr: 0.3,  nilThresh: 3.4, bagHate: 0.4, blurb: 'Lamplight twin. Goes dark on a whim.' },
    abe:    { key: 'abe',    name: 'Abe',        aggr: 0.3,  nilThresh: 3.4, bagHate: 0.4, blurb: 'Lamplight twin. Covers his sister.' },
    wick:   { key: 'wick',   name: 'Wick',       aggr: 0.0,  nilThresh: 3.8, bagHate: 0.6, blurb: 'Copperbank press hand. Lives for the long night.' },
    soot:   { key: 'soot',   name: 'Soot',       aggr: 0.4,  nilThresh: 2.0, bagHate: 0.5, blurb: 'Copperbank press hand. Takes every book he can.' },
    moss:   { key: 'moss',   name: 'Moss',       aggr: 0.3,  nilThresh: 3.4, bagHate: 0.3, blurb: 'Shift crew. Bids like he’s still got a job to get back to.' },
    pike:   { key: 'pike',   name: 'Pike',       aggr: -0.1, nilThresh: 2.6, bagHate: 0.8, blurb: 'Shift crew. Goes nil when the kettle’s on.' },
    ivy:    { key: 'ivy',    name: 'Ivy',        aggr: 0.5,  nilThresh: 3.6, bagHate: 0.1, blurb: 'Platform kid. Overbids on purpose, swears it’s a system.' },
    tom:    { key: 'tom',    name: 'Tom',        aggr: 0.0,  nilThresh: 3.0, bagHate: 0.5, blurb: 'Platform kid. Counts cards out loud by accident.' },
    hal:    { key: 'hal',    name: 'Hal',        aggr: 0.15, nilThresh: 2.8, bagHate: 0.7, blurb: 'Ironmere table one.' },
    june:   { key: 'june',   name: 'June',       aggr: 0.2,  nilThresh: 2.8, bagHate: 0.6, blurb: 'Ironmere table one.' },
    tasha:  { key: 'tasha',  name: 'Tasha',      aggr: 0.3,  nilThresh: 2.6, bagHate: 0.5, blurb: 'Rival. Reads the table.' },
    marcus: { key: 'marcus', name: 'Marcus',     aggr: 0.15, nilThresh: 2.2, bagHate: 0.8, blurb: 'Rival. Never wastes a card.' },
    you:   { key: 'you',   name: 'You',        aggr: 0,    nilThresh: 3.0, bagHate: 0.6, blurb: '' },
  };

  // ---------- match / hand setup ----------
  function newMatch(seed, personas, rules) {
    const G = {
      seed, r: rng(seed), rules: Object.assign({}, RULES, rules || {}),
      players: [0, 1, 2, 3].map((i) => ({ seat: i, persona: personas ? personas[i] : PERSONAS.you, hand: [], bid: null, nil: false, blind: false, tricks: 0, familiar: null, famCharges: null, sharp: false })),
      score: [0, 0], bags: [0, 0], dealer: 0, handNo: 0, history: [],
      trick: [], leader: 0, turn: -1, spadesBroken: false, played: [], voids: [], tricksPlayed: 0, lastTrick: null, log: [],
    };
    return G;
  }
  function deal(G) {
    const deck = []; for (let c = 0; c < 52; c++) deck.push(c);
    for (let i = 51; i > 0; i--) { const j = Math.floor(G.r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    for (let i = 0; i < 4; i++) { const p = G.players[i]; p.hand = deck.slice(i * 13, i * 13 + 13).sort(sortKey); p.bid = null; p.nil = false; p.blind = false; p.tricks = 0; }
    G.trick = []; G.spadesBroken = false; G.played = new Array(52).fill(false); G.voids = [0, 1, 2, 3].map(() => [false, false, false, false]);
    G.tricksPlayed = 0; G.leader = (G.dealer + 1) % 4; G.turn = -1; G.lastTrick = null; G.handBags = [0, 0];
    G.known = [[], [], [], []]; G.spark = -1; G.burrow = -1; G.spadeInfo = [null, null, null, null]; G.famLog = [];
    G.feats = { deuceBook: [false, false, false, false], lowBooks: [true, true, true, true], lastBook: -1, sparkLed: [false, false, false, false] };
    for (const p of G.players) { p.famUsed = false; p.famNote = null; if (p.familiar && p.famCharges === null) p.famCharges = (FAMILIARS[p.familiar].tier === 'young' || FAMILIARS[p.familiar].perHand) ? Infinity : G.rules.grownCharges; }
  }
  // Sort: spades first (high to low), then hearts, diamonds, clubs, each high to low. Good for reading a hand.
  function sortKey(a, b) { return suit(a) - suit(b) || rank(b) - rank(a); }

  // ---------- bidding ----------
  function bySuit(hand) { const s = [[], [], [], []]; for (const c of hand) s[suit(c)].push(rank(c)); for (const x of s) x.sort((a, b) => b - a); return s; }

  // Expected tricks from a hand, the way a careful regular counts them.
  function countTricks(hand) {
    const s = bySuit(hand); const sp = s[0]; const n = sp.length; let t = 0;
    const has = (r) => sp.includes(r);
    if (has(12)) t += 1;
    if (has(11)) t += n >= 2 ? 1 : 0.5;
    if (has(10)) t += n >= 3 ? 0.9 : n === 2 ? 0.5 : 0.25;
    if (has(9)) t += n >= 4 ? 0.7 : n === 3 ? 0.35 : 0.15;
    if (has(8)) t += n >= 4 ? 0.4 : 0.1;
    const honors = [12, 11, 10, 9, 8].filter(has).length;
    t += Math.max(0, n - Math.max(3, honors)) * 0.6; // long trumps win late tricks
    for (let k = 1; k < 4; k++) {
      const x = s[k]; const L = x.length;
      if (x.includes(12)) t += L <= 5 ? 1 : 0.6;
      if (x.includes(11)) t += L >= 2 && L <= 5 ? (x.includes(12) ? 0.9 : 0.6) : L === 1 ? 0.2 : 0.3;
      if (x.includes(10)) t += L >= 3 && L <= 5 ? (x.includes(12) && x.includes(11) ? 0.7 : 0.3) : 0.1;
      // ruffing power: short side suits with spare spades
      if (n >= 3) { if (L === 0) t += Math.min(1.2, (n - 2) * 0.5); else if (L === 1) t += Math.min(0.8, (n - 2) * 0.35); else if (L === 2 && n >= 4) t += 0.25; }
    }
    return t;
  }
  // How dangerous a hand is for a nil bid. Lower is safer.
  function nilRisk(hand) {
    const s = bySuit(hand); let r = 0;
    const sp = s[0];
    for (const x of sp) r += [0.1, 0.1, 0.15, 0.2, 0.3, 0.45, 0.6, 0.8, 1.1, 1.6, 2.2, 2.8, 3.5][x];
    if (sp.length >= 4) r += (sp.length - 3) * 0.9;
    for (let k = 1; k < 4; k++) {
      const x = s[k]; const L = x.length; const low = x.filter((v) => v <= 4).length;
      for (const v of x) {
        if (v === 12) r += 2.2; else if (v === 11) r += L >= 3 && low >= 1 ? 1.1 : 1.8; else if (v === 10) r += L >= 3 && low >= 1 ? 0.5 : 1.1; else if (v === 9) r += L >= 3 ? 0.25 : 0.6; else if (v >= 7) r += 0.2;
      }
      if (L === 1 && x[0] >= 5) r += 0.4;
      if (L >= 6) r += (L - 5) * 0.5;
    }
    return r;
  }
  function mirrorBid(G, seat) { const n = G.players[seat].hand.filter((c) => suit(c) === 0).length; return n === 0 ? { bid: 0, nil: true } : { bid: n, nil: false }; }
  function botBid(G, seat) {
    if (G.rules.mirror) return mirrorBid(G, seat);
    if (G.rules.nilNight) { if (nilNightSeat(G, seat)) return { bid: 0, nil: true }; const p0 = G.players[seat]; let e = Math.round(countTricks(p0.hand) + p0.persona.aggr + 0.8); return { bid: Math.max(1, Math.min(13, e)), nil: false }; }
    const p = G.players[seat]; const P = p.persona; const partner = G.players[partnerOf(seat)];
    const t = teamOf(seat); const behind = G.score[1 - t] - G.score[t];
    let est = countTricks(p.hand); let risk = nilRisk(p.hand);
    const si = G.spadeInfo && G.spadeInfo[seat];
    if (si) { const oppSp = Object.values(si).reduce((a, b) => a + b, 0); if (oppSp >= 8) risk += 0.4; }
    const partnerNil = partner.bid !== null && partner.nil;
    let nilThresh = P.nilThresh + (behind >= 150 ? 0.8 : 0) - (partnerNil ? 9 : 0);
    if (est < 1.6 && risk <= nilThresh) return { bid: 0, nil: true };
    let bid = Math.round(est + P.aggr + (partnerNil ? 0.5 : 0) + (G.r() - 0.5) * 0.3);
    bid = Math.max(1, Math.min(13, bid));
    if (partner.bid !== null && !partner.nil && partner.bid + bid > 12) bid = Math.max(1, 12 - partner.bid);
    return { bid, nil: false };
  }
  // Blind nil: a long shot for a bot, only when far behind and the persona is wild.
  function botBlindNil(G, seat) {
    const t = teamOf(seat); const behind = G.score[1 - t] - G.score[t];
    if (!canBlindNil(G, seat)) return false;
    const partner = G.players[partnerOf(seat)]; if (partner.bid !== null && partner.nil) return false;
    const P = G.players[seat].persona;
    const base = G.rules.goingDark ? 0.5 : 1; return G.r() < base * (P.nilThresh >= 4 ? 0.12 : P.nilThresh >= 3 ? 0.04 : 0.01) + (G.rules.goingDark && behind >= 100 ? 0.06 : 0);
  }
  function canBlindNil(G, seat) {
    if (G.rules.nilNight) return false;
    const t = teamOf(seat); return G.rules.blindNilOn && (G.rules.goingDark || G.score[1 - t] - G.score[t] >= G.rules.blindNilBehind);
  }
  // Nil night: on each team, the partner with the safer nil hand bids nil; the other bids normally.
  function nilNightSeat(G, seat) {
    const p = G.players[seat], q = G.players[partnerOf(seat)];
    if (q.bid !== null) return !q.nil; // partner already bid: I nil only if they didn't
    return nilRisk(p.hand) <= nilRisk(q.hand);
  }
  function setBid(G, seat, b) { const p = G.players[seat]; p.bid = b.nil ? 0 : b.bid; p.nil = !!b.nil; p.blind = !!b.blind; }
  function teamBid(G, t) { return G.players.filter((p) => teamOf(p.seat) === t && !p.nil).reduce((a, p) => a + p.bid, 0); }
  function teamTricks(G, t) { return G.players.filter((p) => teamOf(p.seat) === t && !(G.rules.nilTricksAreBags && p.nil)).reduce((a, p) => a + p.tricks, 0); }

  // ---------- play ----------
  function legalPlays(G, seat) {
    const hand = G.players[seat].hand;
    if (G.trick.length === 0) {
      if (G.rules.breakSpades && !G.spadesBroken && G.spark !== seat && !(G.spark >= 0 && G.players[G.spark].sharp && partnerOf(G.spark) === seat)) { const non = hand.filter((c) => suit(c) !== 0); if (non.length) return non; }
      return hand.slice();
    }
    if (G.burrow === seat) return hand.slice();
    const led = suit(G.trick[0].c); const follow = hand.filter((c) => suit(c) === led);
    return follow.length ? follow : hand.slice();
  }
  const eff = (c, flare) => rank(c) + (flare ? 1.5 : 0); // Kilnback's Flare: counts one rank higher (beats the next rank up)
  function beats(c, w, led, wFlare, cFlare) { // does c beat current winner w, given led suit
    if (suit(c) === suit(w)) return eff(c, cFlare) > eff(w, wFlare);
    if (suit(c) === 0) return true;
    return false;
  }
  function trickWinner(trick) { return trick[trickWinnerIdx(trick)].seat; }
  function playCard(G, seat, c, opts) {
    const p = G.players[seat]; const i = p.hand.indexOf(c); if (i < 0) throw new Error('card not in hand');
    const legal = legalPlays(G, seat); if (!legal.includes(c)) throw new Error('illegal play ' + cardName(c));
    let flare = false;
    if (opts && opts.flare) { if (p.familiar !== 'kilnback' || p.famUsed || !hasCharge(G, seat)) throw new Error('no flare'); flare = true; spend(G, seat); p.famNote = cardName(c); G.famLog.push({ seat, id: 'kilnback', c }); }
    const burrowed = G.burrow === seat && G.trick.length > 0 && suit(c) !== suit(G.trick[0].c) && p.hand.some((x) => suit(x) === suit(G.trick[0].c));
    if (G.burrow === seat) { G.burrow = -1; if (burrowed) { spend(G, seat); p.famNote = cardName(c); G.famLog.push({ seat, id: 'mouse', c }); } }
    p.hand.splice(i, 1); G.played[c] = true;
    if (G.trick.length && suit(c) !== suit(G.trick[0].c) && !burrowed) G.voids[seat][suit(G.trick[0].c)] = true;
    if (suit(c) === 0) G.spadesBroken = true;
    G.trick.push({ seat, c, flare });
    if (G.trick.length === 4) {
      const w = trickWinner(G.trick); G.players[w].tricks++; G.tricksPlayed++;
      const wc = G.trick[trickWinnerIdx(G.trick)].c; if (wc === card(0, 0)) G.feats.deuceBook[w] = true; if (rank(wc) > 3) G.feats.lowBooks[w] = false;
      G.lastTrick = { cards: G.trick.slice(), winner: w }; G.trick = []; G.leader = w; G.turn = w; if (G.tricksPlayed === 13) G.feats.lastBook = w;
      return { done: true, winner: w };
    }
    G.turn = (seat + 1) % 4; return { done: false };
  }

  // Is c the highest card of its suit still unplayed outside my hand?
  function isBoss(G, seat, c) {
    const s = suit(c); const mine = G.players[seat].hand;
    for (let r = rank(c) + 1; r <= 12; r++) { const x = card(s, r); if (!G.played[x] && !mine.includes(x)) return false; }
    return true;
  }
  function isBossFlared(G, seat, c) { const s = suit(c); const mine = G.players[seat].hand; for (let r = rank(c) + 2; r <= 12; r++) { const x = card(s, r); if (!G.played[x] && !mine.includes(x)) return false; } return true; }
  function outstanding(G, seat, s) { // cards of suit s not played and not in my hand
    let n = 0; const mine = G.players[seat].hand; for (let r = 0; r <= 12; r++) { const x = card(s, r); if (!G.played[x] && !mine.includes(x)) n++; } return n;
  }
  function currentWinner(G) { return G.trick.length ? G.trick[trickWinnerIdx(G.trick)].seat : -1; }
  function trickWinnerIdx(trick) { const led = suit(trick[0].c); let bi = 0; for (let i = 1; i < trick.length; i++) if (beats(trick[i].c, trick[bi].c, led, trick[bi].flare, trick[i].flare)) bi = i; return bi; }
  const lowest = (cards) => cards.reduce((a, c) => (rank(c) < rank(a) || (rank(c) === rank(a) && suit(c) !== 0 && suit(a) === 0) ? c : a));
  const highest = (cards) => cards.reduce((a, c) => (rank(c) > rank(a) ? c : a));
  const nonSpades = (cards) => cards.filter((c) => suit(c) !== 0);

  // Which card to throw away when I can't win or don't want to: shed from the shortest side suit, low first; keep boss cards.
  function shedCard(G, seat, legal, wantHigh) {
    const s = bySuit(legal); const side = nonSpades(legal);
    const pool = side.length ? side : legal;
    if (wantHigh) { // dump a dangerous high card that isn't a sure trick we still want
      const dangerous = pool.filter((c) => rank(c) >= 9 && !isBoss(G, seat, c));
      if (dangerous.length) return highest(dangerous);
    }
    // shortest side suit, lowest card
    let best = null, bestLen = 99;
    for (const c of pool) { const L = s[suit(c)].length; if (L < bestLen || (L === bestLen && rank(c) < rank(best))) { best = c; bestLen = L; } }
    return best;
  }

  function botPlay(G, seat) {
    const p = G.players[seat]; const legal = legalPlays(G, seat); if (legal.length === 1) return legal[0];
    const t = teamOf(seat); const partner = partnerOf(seat); const pp = G.players[partner];
    const myNil = p.nil, partnerNil = pp.nil; const opps = [(seat + 1) % 4, (seat + 3) % 4];
    const oppNil = opps.find((o) => G.players[o].nil && G.players[o].tricks === 0);
    const need = teamBid(G, t) - teamTricks(G, t); const needing = need > 0;
    const oppNeed = teamBid(G, 1 - t) - teamTricks(G, 1 - t); const remaining = 13 - G.tricksPlayed;
    const denyMode = oppNeed > 0 && remaining - oppNeed <= 2; // opponents are close to being set: take tricks
    const bagsHurt = p.persona.bagHate * (G.bags[t] >= 6 ? 1.5 : 1);
    const avoid = !needing && !denyMode && (G.r() < Math.min(1, 0.55 + bagsHurt * 0.4));
    const trick = G.trick;
    const known = (G.known && G.known[seat]) ? G.known[seat].filter((c) => pp.hand.includes(c)) : [];

    // ----- leading -----
    if (!trick.length) {
      if (myNil) return lowest(legal);
      if (known.length && (needing || denyMode) && !partnerNil) { // Owlet: lead low into a suit where partner holds the boss
        for (const k of known) { const s = suit(k); if (s !== 0 && isBoss(G, partner, k)) { const mine = legal.filter((c) => suit(c) === s && rank(c) < rank(k)); if (mine.length) return lowest(mine); } }
      }
      if (partnerNil) { // take the lead and keep it: lead boss cards, then high cards
        const boss = legal.filter((c) => isBoss(G, seat, c) && outstanding(G, seat, suit(c)) > 0);
        if (boss.length) return highest(boss);
        return highest(legal);
      }
      if (oppNil !== undefined) { // try to feed the nil bidder a trick: lead low in a side suit they likely hold
        const side = nonSpades(legal).filter((c) => !G.voids[oppNil][suit(c)]);
        if (side.length) return lowest(side);
      }
      if (needing || denyMode) {
        const si = G.spadeInfo && G.spadeInfo[seat];
        if (si) { // Raven: we know the opponents' spade counts
          const oppSp = opps.reduce((a, o) => a + (si[o] || 0), 0); const mySp = legal.filter((c) => suit(c) === 0);
          if (oppSp === 0) { const side = nonSpades(legal); const hi = side.filter((c) => isBoss(G, seat, c)); if (hi.length) return highest(hi); }
          if (oppSp >= 4 && mySp.length >= 2 && mySp.some((c) => isBoss(G, seat, c)) && (G.spadesBroken || G.spark === seat || mySp.length === legal.length)) return highest(mySp);
        }
        const boss = legal.filter((c) => isBoss(G, seat, c) && outstanding(G, seat, suit(c)) > 0 && (suit(c) !== 0 || opps.some((o) => !G.voids[o][0])));
        const sideBoss = boss.filter((c) => suit(c) !== 0 && !opps.some((o) => G.voids[o][suit(c)]));
        if (sideBoss.length) return highest(sideBoss);
        const sp = legal.filter((c) => suit(c) === 0);
        if (boss.some((c) => suit(c) === 0) && sp.length >= 3 && outstanding(G, seat, 0) > 0) return highest(sp); // pull trumps
        if (sideBoss.length === 0 && boss.length) return highest(boss);
        // lead low from the longest side suit, hoping partner wins
        const side = nonSpades(legal); const s = bySuit(side);
        if (side.length) { let bestSuit = -1, L = -1; for (let k = 1; k < 4; k++) if (s[k].length > L) { L = s[k].length; bestSuit = k; } return lowest(side.filter((c) => suit(c) === bestSuit)); }
        return lowest(legal);
      }
      // bid made: lead low, avoid winning
      const side = nonSpades(legal); const pool = side.length ? side : legal;
      const safe = pool.filter((c) => !isBoss(G, seat, c)); return lowest(safe.length ? safe : pool);
    }

    // ----- following -----
    const led = suit(trick[0].c); const wi = trickWinnerIdx(trick); const wseat = trick[wi].seat; const wcard = trick[wi].c;
    const wFlare = trick[wi].flare;
    const winning = legal.filter((c) => beats(c, wcard, led, wFlare)); const losing = legal.filter((c) => !beats(c, wcard, led, wFlare));
    const last = trick.length === 3; const partnerWinning = wseat === partner; const partnerToPlay = !trick.some((x) => x.seat === partner);
    const canFollow = suit(legal[0]) === led;
    // Mouse · Burrow: play off-suit even though I could follow. Decide here; the caller fires it and re-asks.
    if (p.familiar === 'mouse' && !p.famUsed && hasCharge(G, seat) && canFollow && G.burrow !== seat) {
      const sp = p.hand.filter((c) => suit(c) === 0 && led !== 0);
      const off = p.hand.filter((c) => suit(c) !== led);
      if (myNil && !losing.length && off.length) return { burrow: true }; // forced to win otherwise
      if (!myNil && (needing || denyMode) && !winning.length && sp.length && !partnerWinning && (last || rank(wcard) >= 10 || suit(wcard) === 0)) {
        const trumpWins = sp.filter((c) => beats(c, wcard, led, wFlare)); if (trumpWins.length) return { burrow: true };
      }
    }
    // Kilnback · Flare: one card counts a rank higher. Fire when it turns a loss into a win that matters.
    if (p.familiar === 'kilnback' && !p.famUsed && hasCharge(G, seat) && !myNil && (needing || denyMode) && !partnerWinning && !winning.length && canFollow) {
      const cand = losing.filter((c) => suit(c) === suit(wcard) && beats(c, wcard, led, wFlare, true));
      if (cand.length && (last || isBossFlared(G, seat, highest(cand)))) return { flare: highest(cand) };
    }

    if (myNil) { if (losing.length) return highest(losing); return lowest(winning); }
    if (known.length && partnerToPlay && !partnerNil && losing.length && known.some((k) => suit(k) === led && beats(k, wcard, led, wFlare) && (last || isBoss(G, partner, k)))) {
      return canFollow ? lowest(losing) : shedCard(G, seat, legal, false); // Owlet: partner has it covered
    }
    if (partnerNil) {
      if (partnerToPlay) { if (winning.length) return highest(winning); return canFollow ? lowest(losing) : shedCard(G, seat, legal, false); }
      if (partnerWinning) { if (winning.length) return lowest(winning); return lowest(legal); }
      if (needing && winning.length) return last ? lowest(winning) : (winning.some((c) => isBoss(G, seat, c)) ? lowest(winning.filter((c) => isBoss(G, seat, c))) : lowest(winning));
      return losing.length ? (canFollow ? lowest(losing) : shedCard(G, seat, legal, true)) : lowest(winning);
    }
    if (oppNil !== undefined) {
      const nilPlayed = trick.find((x) => x.seat === oppNil);
      if (nilPlayed && wseat === oppNil) { if (losing.length) return canFollow ? highest(losing) : shedCard(G, seat, legal, true); return lowest(winning); }
      if (!nilPlayed) { if (losing.length) return canFollow ? lowest(losing) : shedCard(G, seat, legal, false); return lowest(winning); }
    }
    if (partnerWinning) {
      if (last) return losing.length ? (canFollow ? lowest(losing) : shedCard(G, seat, legal, !avoid)) : lowest(winning);
      const pBoss = isBoss(G, partner, wcard) || (suit(wcard) === 0 && rank(wcard) >= 10);
      if (!pBoss && (needing || denyMode) && winning.length && winning.some((c) => isBoss(G, seat, c))) return lowest(winning.filter((c) => isBoss(G, seat, c)));
      return losing.length ? (canFollow ? lowest(losing) : shedCard(G, seat, legal, !avoid)) : lowest(winning);
    }
    // opponents winning so far
    if (needing || denyMode) {
      if (winning.length) {
        if (last) return lowest(winning);
        const boss = winning.filter((c) => isBoss(G, seat, c)); if (boss.length) return lowest(boss);
        if (!partnerToPlay) return lowest(winning); // partner can't help, win cheaply
        return rank(wcard) >= 9 || suit(wcard) === 0 ? lowest(winning) : (canFollow ? lowest(losing.length ? losing : winning) : lowest(winning));
      }
      return canFollow ? lowest(losing) : shedCard(G, seat, legal, false);
    }
    if (avoid) { // bid made, avoid bags: throw the highest card that doesn't win
      if (losing.length) return canFollow ? highest(losing) : shedCard(G, seat, legal, true);
      return lowest(winning);
    }
    if (winning.length && last) return lowest(winning);
    if (winning.length) { const boss = winning.filter((c) => isBoss(G, seat, c)); return boss.length ? lowest(boss) : (losing.length ? (canFollow ? lowest(losing) : shedCard(G, seat, legal, false)) : lowest(winning)); }
    return canFollow ? lowest(losing) : shedCard(G, seat, legal, false);
  }

  // A plain-language suggestion for the human seat, using the same brain.
  function suggest(G, seat) { return botPlay(G, seat); }


  // ---------- familiars ----------
  // Each familiar bends one rule once per hand. canUse/apply/botUse keep the engine pure; the UI asks the human, bots decide for themselves.
  const FAMILIARS = {
    owlet: { id: 'owlet', name: 'Owlet', ability: 'Peek', family: 0, tier: 'young', when: 'afterBids', desc: 'See 2 random cards in your partner’s hand.',
      canUse(G, seat) { const p = G.players[seat]; return !p.famUsed && hasCharge(G, seat) && bidsDone(G) && G.tricksPlayed === 0 && G.trick.length === 0; },
      apply(G, seat) { const p = G.players[seat]; const ph = G.players[partnerOf(seat)].hand.slice(); const out = []; for (let k = 0; k < (p.sharp ? 3 : 2) && ph.length; k++) out.push(ph.splice(Math.floor(G.r() * ph.length), 1)[0]); G.known[seat].push(...out); spend(G, seat); p.famNote = out.map(cardName).join(' '); G.famLog.push({ seat, id: 'owlet', cards: out }); return { cards: out }; },
      botUse(G, seat) { return true; } },
    salamander: { id: 'salamander', name: 'Salamander', ability: 'Spark', family: 1, tier: 'young', when: 'lead', desc: 'Lead a spade before spades are broken.',
      canUse(G, seat) { const p = G.players[seat]; return !p.famUsed && hasCharge(G, seat) && bidsDone(G) && G.trick.length === 0 && G.turn === seat && G.rules.breakSpades && !G.spadesBroken && p.hand.some((c) => suit(c) === 0) && p.hand.some((c) => suit(c) !== 0); },
      apply(G, seat) { G.spark = seat; G.feats.sparkLed[seat] = true; spend(G, seat); G.famLog.push({ seat, id: 'salamander' }); return {}; },
      botUse(G, seat) { const p = G.players[seat]; const sp = p.hand.filter((c) => suit(c) === 0); const t = teamOf(seat); const need = teamBid(G, t) - teamTricks(G, t); if (need <= 0 || p.nil) return false; const boss = sp.filter((c) => isBoss(G, seat, c)); return boss.length >= 1 && sp.length >= 2 && outstanding(G, seat, 0) >= 3 && !G.players[partnerOf(seat)].nil; } },
    koi: { id: 'koi', name: 'Koi', ability: 'Rethink', family: 2, tier: 'young', when: 'afterTrick1', desc: 'After the first trick, change your bid by 1.',
      canUse(G, seat) { const p = G.players[seat]; return !p.famUsed && hasCharge(G, seat) && G.tricksPlayed === 1 && G.trick.length === 0 && !p.nil; },
      apply(G, seat, args) { const p = G.players[seat]; const d = args && args.delta ? Math.sign(args.delta) : 0; if (!d) return { delta: 0 }; p.bid = Math.max(1, Math.min(13, p.bid + d)); spend(G, seat); p.famNote = (d > 0 ? '+1' : '−1'); G.famLog.push({ seat, id: 'koi', delta: d }); return { delta: d }; },
      botUse(G, seat) { const p = G.players[seat]; const est = countTricks(p.hand) + p.tricks; if (p.bid > 1 && est <= p.bid - 0.6) return { delta: -1 }; if (est >= p.bid + 1.7) return { delta: 1 }; return false; } },
    raven: { id: 'raven', name: 'Raven', ability: 'Count', family: 0, tier: 'grown', when: 'beforeBid', perHand: true, desc: 'Before you bid, learn how many spades each opponent holds.',
      canUse(G, seat) { const p = G.players[seat]; return !p.famUsed && p.bid === null && G.tricksPlayed === 0; },
      apply(G, seat) { const p = G.players[seat]; const o1 = (seat + 1) % 4, o2 = (seat + 3) % 4; const n = (s) => G.players[s].hand.filter((c) => suit(c) === 0).length; const info = {}; info[o1] = n(o1); info[o2] = n(o2); G.spadeInfo[seat] = info; if (info[o1] === 0) G.voids[o1][0] = true; if (info[o2] === 0) G.voids[o2][0] = true; spend(G, seat); p.famNote = `${G.players[o1].persona.name} ${info[o1]}, ${G.players[o2].persona.name} ${info[o2]}`; G.famLog.push({ seat, id: 'raven', info }); return { info }; },
      botUse() { return true; } },
    kilnback: { id: 'kilnback', name: 'Kilnback', ability: 'Flare', family: 1, tier: 'grown', when: 'play', desc: 'One card you play counts one rank higher for that trick.',
      canUse(G, seat) { const p = G.players[seat]; return !p.famUsed && hasCharge(G, seat) && bidsDone(G) && G.turn === seat; },
      apply() { return {}; }, botUse() { return false; } },
    frog: { id: 'frog', name: 'Frog', ability: 'Hop', family: 2, tier: 'grown', when: 'afterBids', desc: 'Swap one card face-down with your partner.',
      canUse(G, seat) { const p = G.players[seat]; return !p.famUsed && hasCharge(G, seat) && bidsDone(G) && G.tricksPlayed === 0 && G.trick.length === 0; },
      apply(G, seat, args) { const p = G.players[seat]; const q = G.players[partnerOf(seat)]; const give = args && args.give !== undefined ? args.give : hopPick(G, seat); const back = args && args.back !== undefined ? args.back : hopPick(G, partnerOf(seat)); if (!p.hand.includes(give) || !q.hand.includes(back)) return {}; p.hand.splice(p.hand.indexOf(give), 1); q.hand.splice(q.hand.indexOf(back), 1); p.hand.push(back); q.hand.push(give); p.hand.sort(sortKey); q.hand.sort(sortKey); G.known[seat].push(give); G.known[partnerOf(seat)].push(back); spend(G, seat); p.famNote = `gave ${cardName(give)}, got ${cardName(back)}`; G.famLog.push({ seat, id: 'frog', give, back }); return { give, back }; },
      botUse() { return true; } },
    mouse: { id: 'mouse', name: 'Mouse', ability: 'Burrow', family: 3, tier: 'grown', when: 'play', desc: 'Once, play off-suit even when you could follow.',
      canUse(G, seat) { const p = G.players[seat]; return !p.famUsed && hasCharge(G, seat) && bidsDone(G) && G.turn === seat && G.trick.length > 0 && G.burrow !== seat; },
      apply(G, seat) { G.burrow = seat; return {}; }, botUse() { return false; } },
    badger: { id: 'badger', name: 'Badger', ability: 'Guard', family: 3, tier: 'young', when: 'scoring', desc: 'Up to 2 overtricks this hand don’t count as bags.', sharpDesc: 'Guards 3 bags.',
      canUse() { return false; }, apply() { return {}; }, botUse() { return false; } },
    sootling: { id: 'sootling', name: 'Sootling', ability: 'Smudge', family: 0, tier: 'young', when: 'afterBids', desc: 'See 1 random card in the hand to your left.', sharpDesc: 'Sees 2 cards.',
      canUse(G, seat) { const p = G.players[seat]; return !p.famUsed && hasCharge(G, seat) && bidsDone(G) && G.tricksPlayed === 0 && G.trick.length === 0; },
      apply(G, seat) { const p = G.players[seat]; const o = (seat + 1) % 4; const oh = G.players[o].hand.slice(); const out = []; for (let k = 0; k < (p.sharp ? 2 : 1) && oh.length; k++) out.push(oh.splice(Math.floor(G.r() * oh.length), 1)[0]); G.known[seat].push(...out); spend(G, seat); p.famNote = out.map(cardName).join(' '); G.famLog.push({ seat, id: 'sootling', cards: out }); return { cards: out, who: o }; },
      botUse() { return true; } },
    cinderwick: { id: 'cinderwick', name: 'Cinderwick', ability: 'Banked coal', family: 1, tier: 'rare', when: 'scoring', perHand: true, desc: 'When your team takes exactly its bid, +10.', sharpDesc: '+15 instead.',
      canUse() { return false; }, apply() { return {}; }, botUse() { return false; } },
  };
  // Frog · Hop: what to hand across. Nil: dump your most dangerous card. Otherwise give a low singleton (makes a void) or your lowest off-suit card.
  function hopPick(G, seat) {
    const p = G.players[seat]; const s = bySuit(p.hand);
    if (p.nil) { const side = p.hand.filter((c) => suit(c) !== 0); const pool = side.length ? side : p.hand; return highest(pool); }
    let best = null, bestScore = -1e9;
    for (const c of p.hand) { const L = s[suit(c)].length; if (suit(c) === 0) continue; const score = (L === 1 ? 6 : L === 2 ? 3 : 0) - rank(c) * 0.5 - (rank(c) >= 11 ? 20 : 0); if (score > bestScore) { bestScore = score; best = c; } }
    return best !== null ? best : lowest(p.hand);
  }
  const FAM_NEXT = { owlet: 'raven', salamander: 'kilnback', koi: 'frog', badger: 'mouse' };
  const TIER_RANK = { young: 0, grown: 1, rare: 1, court: 2, legend: 3 };
  function spend(G, seat) { const p = G.players[seat]; p.famUsed = true; if (p.famCharges !== null && p.famCharges !== Infinity) p.famCharges--; }
  function hasCharge(G, seat) { const p = G.players[seat]; return p.famCharges === null || p.famCharges > 0; }
  function bidsDone(G) { return G.players.every((p) => p.bid !== null); }
  function famOf(G, seat) { const id = G.players[seat].familiar; return id ? FAMILIARS[id] : null; }
  function useFamiliar(G, seat, args) { const F = famOf(G, seat); if (!F || !F.canUse(G, seat)) return null; return Object.assign({ id: F.id }, F.apply(G, seat, args)); }
  // Bots: called at each phase boundary; returns the use record or null.
  function botFamiliar(G, seat) {
    const F = famOf(G, seat); if (!F || !F.canUse(G, seat)) return null;
    const d = F.botUse(G, seat); if (!d) return null;
    return useFamiliar(G, seat, typeof d === 'object' ? d : {});
  }

  // ---------- scoring ----------
  function settle(G) {
    const R = G.rules; const res = { teams: [], players: G.players.map((p) => ({ bid: p.bid, nil: p.nil, blind: p.blind, tricks: p.tricks })) };
    for (let t = 0; t < 2; t++) {
      const members = G.players.filter((p) => teamOf(p.seat) === t);
      let pts = 0, bags = 0; const notes = [];
      const bid = teamBid(G, t); const tricks = teamTricks(G, t);
      for (const p of members) {
        if (p.nil) {
          const v = p.blind ? R.blindNil : R.nil;
          if (p.tricks === 0) { pts += v; notes.push(`${p.persona.name} made ${p.blind ? 'blind ' : ''}nil +${v}`); }
          else { pts -= v; bags += R.nilTricksAreBags ? p.tricks : 0; notes.push(`${p.persona.name} broke ${p.blind ? 'blind ' : ''}nil −${v}`); }
        }
      }
      if (bid > 0 || members.every((p) => p.nil) === false) {
        if (tricks >= bid) { pts += bid * R.trick; const over = tricks - bid; bags += over; pts += over; notes.push(`bid ${bid}, took ${tricks}: +${bid * R.trick}${over ? ` and ${over} bag${over > 1 ? 's' : ''}` : ''}`); }
        else { pts -= bid * R.setPenalty; notes.push(`bid ${bid}, took ${tricks}: set, −${bid * R.setPenalty}`); }
      }
      for (const p of members) {
        if (p.familiar === 'badger' && bags > 0) { const g = Math.min(p.sharp ? 3 : 2, bags); bags -= g; pts -= 0; p.famUsed = true; notes.push(`${p.persona.name}’s Badger guarded ${g} bag${g > 1 ? 's' : ''}`); }
      }
      for (const p of members) { if (p.familiar === 'cinderwick' && bid > 0 && tricks === bid && hasCharge(G, p.seat)) { spend(G, p.seat); const b = p.sharp ? 15 : 10; pts += b; p.famUsed = true; notes.push(`${p.persona.name}’s Cinderwick: exact bid, +${b}`); } }
      G.bags[t] += bags;
      if (G.bags[t] >= R.bagsAt) { G.bags[t] -= R.bagsAt; pts -= R.bagPenalty; notes.push(`${R.bagsAt} bags: −${R.bagPenalty}`); }
      G.score[t] += pts;
      res.teams.push({ pts, bags, notes, bid, tricks, score: G.score[t], totalBags: G.bags[t] });
    }
    G.history.push(res);
    return res;
  }
  function gameOver(G) {
    const R = G.rules; const [a, b] = G.score;
    if ((a >= R.target || b >= R.target) && a !== b) return a > b ? 0 : 1;
    if (a <= R.floor && b <= R.floor) return a > b ? 0 : 1;
    if (a <= R.floor) return 1; if (b <= R.floor) return 0;
    return -1;
  }

  // ---------- headless sim ----------
  function playHandBots(G, hooks) {
    deal(G);
    for (let k = 0; k < 4; k++) { const s = (G.dealer + 1 + k) % 4; botFamiliar(G, s); const blind = botBlindNil(G, s); setBid(G, s, blind ? { bid: 0, nil: true, blind: true } : botBid(G, s)); }
    if (hooks && hooks.afterBids) hooks.afterBids(G);
    for (let k = 0; k < 4; k++) botFamiliar(G, k); // Owlet peeks
    G.turn = G.leader;
    for (let guard = 0; guard < 52; guard++) {
      const s = G.turn;
      if (G.trick.length === 0) { if (G.tricksPlayed === 1) for (let k = 0; k < 4; k++) botFamiliar(G, k); botFamiliar(G, s); } // Koi after trick 1, Spark on lead
      let c = botPlay(G, s); let opts = null;
      if (c && typeof c === 'object') { if (c.burrow) { useFamiliar(G, s); c = botPlay(G, s); if (c && typeof c === 'object') c = legalPlays(G, s)[0]; } else if (c.flare !== undefined) { opts = { flare: true }; c = c.flare; } }
      const legal = legalPlays(G, s); if (!legal.includes(c)) throw new Error('bot illegal');
      playCard(G, s, c, opts);
      if (G.tricksPlayed === 13) break;
    }
    return settle(G);
  }
  function simFamiliars(n, seed) {
    const base = simulate(n, seed, null, [null, null, null, null]);
    const out = { baseline: 100 * base.winsT0 / base.games, byFamiliar: {} };
    for (const id of Object.keys(FAMILIARS)) {
      const st = simulate(n, seed, null, [id, null, id, null]);
      const st2 = simulate(n, seed, null, [null, id, null, id]);
      out.byFamiliar[id] = { withT0: 100 * st.winsT0 / st.games, withT1: 100 * (1 - st2.winsT0 / st2.games), uses: st.famUses[id] / st.hands };
    }
    return out;
  }
  function simulate(n, seed, personas, familiars, rules) {
    const st = { hands: 0, games: 0, handsPerGame: 0, made: 0, set: 0, teamBids: 0, nils: 0, nilMade: 0, blind: 0, blindMade: 0, bags: 0, bagPenalties: 0, bidTotal: 0, tricksTotal: 0, winsT0: 0, byBid: {}, famUses: {} };
    for (let g = 0; g < n; g++) {
      const G = newMatch(seed + g, personas || [PERSONAS.tally, PERSONAS.gus, PERSONAS.dee, PERSONAS.birdie], rules); G.dealer = g % 4;
      if (familiars) G.players.forEach((p, i) => { p.familiar = familiars[i]; });
      let hands = 0;
      while (gameOver(G) < 0 && hands < 40) {
        const res = playHandBots(G); hands++; st.hands++;
        for (const f of G.famLog) st.famUses[f.id] = (st.famUses[f.id] || 0) + 1;
        for (let t = 0; t < 2; t++) { const T = res.teams[t]; st.teamBids++; if (T.tricks >= T.bid) st.made++; else st.set++; st.bags += T.bags; st.bidTotal += T.bid; st.tricksTotal += T.tricks; if (T.notes.some((x) => /bags:/.test(x))) st.bagPenalties++; }
        for (const p of res.players) { if (p.nil) { st.nils++; if (p.tricks === 0) st.nilMade++; if (p.blind) { st.blind++; if (p.tricks === 0) st.blindMade++; } } else { st.byBid[p.bid] = (st.byBid[p.bid] || 0) + 1; } }
        G.dealer = (G.dealer + 1) % 4; G.handNo++;
      }
      st.games++; st.handsPerGame += hands; if (gameOver(G) === 0) st.winsT0++;
    }
    st.handsPerGame /= st.games;
    return st;
  }

  const SP = { SUITS, SUIT_SYM, RANKS, RULES, PERSONAS, suit, rank, card, cardName, teamOf, partnerOf, rng, newMatch, deal, sortKey, bySuit, countTricks, nilRisk, botBid, botBlindNil, canBlindNil, nilNightSeat, setBid, teamBid, teamTricks, legalPlays, beats, trickWinner, playCard, isBoss, outstanding, currentWinner, botPlay, suggest, settle, gameOver, playHandBots, simulate, simFamiliars, FAMILIARS, FAM_NEXT, TIER_RANK, famOf, useFamiliar, botFamiliar, bidsDone, hopPick, mirrorBid, isBossFlared, eff, spend, hasCharge };
  if (typeof module !== 'undefined' && module.exports) module.exports = SP; else root.SP = SP;
})(typeof window !== 'undefined' ? window : globalThis);
