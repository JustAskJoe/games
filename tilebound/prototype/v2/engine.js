// Tilebound prototype rules engine. Pure logic, no DOM. Follows the Prototype Rules Sheet.
(function (root) {
  const SUITS = ['Ember', 'Tide', 'Grove'];
  const WINDS = ['North', 'East', 'West', 'South'];
  const DRAKES = ['Crimson', 'Pale', 'Verdant'];
  const N = 27, E = 28, W = 29, S = 30, BLOSSOM = 34, MIMIC = 35, TYPES = 36;
  const num = (s, n) => s * 9 + n - 1;
  const drakeOf = (s) => 31 + s;

  function tileName(t) {
    if (t < 27) return SUITS[Math.floor(t / 9)] + ' ' + (t % 9 + 1);
    if (t < 31) return WINDS[t - 27] + ' Wind';
    if (t < 34) return DRAKES[t - 31] + ' Drake';
    return t === BLOSSOM ? 'Blossom' : 'Mimic';
  }

  const HANDS = [
    { id: 'kettle', name: 'Kettle Kick', pts: 25, x: true, pattern: '111 222 3333 4444', rule: 'One suit, four numbers in a row: two sets of 3 and two sets of 4, in any order' },
    { id: 'shores', name: 'Two Shores', pts: 25, x: true, pattern: '111 2222 · 333 4444', rule: 'Four numbers in a row, the first two in one suit and the last two in another' },
    { id: 'friends', name: 'Three Friends', pts: 25, x: true, pattern: '5555 5555 5555 NN', rule: 'One number in all three suits, plus a pair of any Wind or Drake' },
    { id: 'lanterns', name: 'Harbor Lights', pts: 30, x: true, pattern: '7777 CCC · 7777 PPP', rule: 'One number in two suits, each with its own matching Drake' },
    { id: 'evens', name: 'Evens Garden', pts: 25, x: true, pattern: 'BB 222 444 666 888', rule: 'One suit, with a pair of Blossoms or of its matching Drake' },
    { id: 'winds', name: 'Four Winds Walk', pts: 30, x: true, pattern: 'NNN EEE WWW SSS DD', rule: 'All four Winds, plus a pair of any Drake' },
    { id: 'drakes', name: "Drake's Hoard", pts: 35, x: true, pattern: 'CCC PPP VVV 55555', rule: 'All three Drakes, plus five of any one number (Mimics help)' },
    { id: 'odd', name: 'Odd Tide', pts: 35, x: false, pattern: '11 333 5555 777 99', rule: 'One suit' },
    { id: 'blossom', name: 'Blossom Run', pts: 40, x: false, pattern: 'BBBB 123456 DDDD', rule: 'One suit, 1 to 6, with its matching Drake; the singles take no Mimics' },
    { id: 'mirror', name: 'Mirror Pairs', pts: 50, x: false, noJ: true, pattern: 'NN EE WW SS 11 22 33', rule: 'One suit, three numbers in a row; pairs only, no Mimics' },
  ];

  // Every concrete way to make each hand: a list of [tile, size] groups (tiles are distinct within a target).
  const TARGETS = [];
  const add = (h, g) => TARGETS.push({ h, g, id: TARGETS.length });
  const PERMS4 = [[3, 3, 4, 4], [3, 4, 3, 4], [3, 4, 4, 3], [4, 3, 3, 4], [4, 3, 4, 3], [4, 4, 3, 3]];
  for (let s = 0; s < 3; s++) for (let a = 1; a <= 6; a++) for (const z of PERMS4) add(0, [[num(s, a), z[0]], [num(s, a + 1), z[1]], [num(s, a + 2), z[2]], [num(s, a + 3), z[3]]]);
  for (let s = 0; s < 3; s++) for (let u = 0; u < 3; u++) if (u !== s) for (let a = 1; a <= 6; a++) add(1, [[num(s, a), 3], [num(s, a + 1), 4], [num(u, a + 2), 3], [num(u, a + 3), 4]]);
  for (let n = 1; n <= 9; n++) for (let w = N; w <= 33; w++) add(2, [[num(0, n), 4], [num(1, n), 4], [num(2, n), 4], [w, 2]]);
  for (let s = 0; s < 3; s++) for (let u = s + 1; u < 3; u++) for (let n = 1; n <= 9; n++) add(3, [[num(s, n), 4], [drakeOf(s), 3], [num(u, n), 4], [drakeOf(u), 3]]);
  for (let s = 0; s < 3; s++) for (const f of [BLOSSOM, drakeOf(s)]) add(4, [[f, 2], [num(s, 2), 3], [num(s, 4), 3], [num(s, 6), 3], [num(s, 8), 3]]);
  for (let d = 31; d <= 33; d++) add(5, [[N, 3], [E, 3], [W, 3], [S, 3], [d, 2]]);
  for (let s = 0; s < 3; s++) for (let n = 1; n <= 9; n++) add(6, [[31, 3], [32, 3], [33, 3], [num(s, n), 5]]);
  for (let s = 0; s < 3; s++) add(7, [[num(s, 1), 2], [num(s, 3), 3], [num(s, 5), 4], [num(s, 7), 3], [num(s, 9), 2]]);
  for (let s = 0; s < 3; s++) {
    const g = [[BLOSSOM, 4]];
    for (let k = 1; k <= 6; k++) g.push([num(s, k), 1]);
    g.push([drakeOf(s), 4]);
    add(8, g);
  }
  for (let s = 0; s < 3; s++) for (let a = 1; a <= 7; a++) add(9, [[N, 2], [E, 2], [W, 2], [S, 2], [num(s, a), 2], [num(s, a + 1), 2], [num(s, a + 2), 2]]);

  // ---------- RNG ----------
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- Distance ("tiles from Mahj") ----------
  // counts: Int array of 36 (index 35 = Mimics). exps: [{t, s, j}]. Returns tiles still missing for target T (99 = impossible).
  function distTo(c, exps, T, av) {
    const H = HANDS[T.h];
    let used = 0;
    if (exps.length) {
      if (!H.x) return 99;
      for (const e of exps) {
        let f = -1;
        for (let i = 0; i < T.g.length; i++) {
          if (!((used >> i) & 1) && T.g[i][0] === e.t && T.g[i][1] === e.s) { f = i; break; }
        }
        if (f < 0) return 99;
        used |= 1 << f;
      }
    }
    let miss = 0, jokerable = 0, mustJ = 0;
    for (let i = 0; i < T.g.length; i++) {
      if ((used >> i) & 1) continue;
      const t = T.g[i][0], s = T.g[i][1];
      const have = c[t] < s ? c[t] : s;
      const m = s - have;
      miss += m;
      if (s >= 3 && !H.noJ) jokerable += m;
      if (av && m > av[t]) {
        if (s < 3 || H.noJ) return 99;
        mustJ += m - av[t];
      }
    }
    if (av && mustJ > c[MIMIC] + av[MIMIC]) return 99;
    return miss - Math.min(c[MIMIC], jokerable);
  }

  function ranked(p) {
    const out = [];
    for (const T of TARGETS) {
      const d = distTo(p.c, p.exps, T);
      if (d < 99) out.push({ T, d });
    }
    out.sort((a, b) => a.d - b.d || HANDS[b.T.h].pts - HANDS[a.T.h].pts);
    return out;
  }

  function best(p) {
    let b = 99, bt = null;
    for (const T of TARGETS) {
      const d = distTo(p.c, p.exps, T);
      if (d < b) { b = d; bt = T; }
    }
    return { d: b, T: bt };
  }

  // Best distance for each hand on the card (index = hand), plus the target that gives it.
  function byHand(p) {
    const out = HANDS.map(() => ({ d: 99, T: null }));
    for (const T of TARGETS) {
      const d = distTo(p.c, p.exps, T);
      if (d < out[T.h].d) out[T.h] = { d, T };
    }
    return out;
  }

  // Score a hand state for discard decisions: lower best distance first, then more nearby options.
  // `hands`: optional Set of hand indexes the player is chasing; other hands count only a little.
  function score(p, hands) {
    let b = 99;
    const ds = new Array(TARGETS.length);
    for (let i = 0; i < TARGETS.length; i++) {
      if (hands && !hands.has(TARGETS[i].h)) { ds[i] = 99; continue; }
      const d = distTo(p.c, p.exps, TARGETS[i], p.av); ds[i] = d; if (d < b) b = d;
    }
    if (b === 99 && hands) return score(p, null);
    let near = 0;
    for (let i = 0; i < ds.length; i++) {
      if (ds[i] === b) near += 4 + HANDS[TARGETS[i].h].pts / 50;
      else if (ds[i] === b + 1) near += 1;
      else if (ds[i] === b + 2) near += 0.15;
    }
    return { b, near };
  }

  // Ranked discard choices for a 14-tile (or any) hand. Never suggests a Mimic unless nothing else is left.
  function discardChoices(p, hands) {
    const res = [];
    for (let t = 0; t < MIMIC; t++) {
      if (!p.c[t]) continue;
      p.c[t]--;
      const sc = score(p, hands);
      p.c[t]++;
      res.push({ t, b: sc.b, near: sc.near });
    }
    if (!res.length && p.c[MIMIC]) res.push({ t: MIMIC, b: 99, near: 0 });
    res.sort((a, b) => a.b - b.b || b.near - a.near);
    return res;
  }

  const TOTAL = new Array(TYPES).fill(4); TOTAL[BLOSSOM] = 8; TOTAL[MIMIC] = 8;
  // Tiles this player could still get: total minus everything visible (ponds, exposures) minus own hand.
  function setAvail(G, p) {
    const av = p.av || (p.av = new Array(TYPES));
    for (let t = 0; t < TYPES; t++) av[t] = TOTAL[t] - G.seen[t] - p.c[t];
    return av;
  }
  function see(G, t, k) { G.seen[t] += (k || 1); }

  function isWin(p) {
    for (const T of TARGETS) if (distTo(p.c, p.exps, T) === 0) return T;
    return null;
  }

  // Can seat p win with discard t?
  function winWith(p, t) {
    if (t === MIMIC) return null;
    p.c[t]++;
    const T = isWin(p);
    p.c[t]--;
    return T;
  }

  // Best exposure option for seat p on discard t, or null. Only offers calls that bring the hand closer.
  function exposeOption(p, t) {
    if (t === MIMIC) return null;
    const cur = best(p).d;
    let opt = null;
    for (const T of TARGETS) {
      if (!HANDS[T.h].x) continue;
      for (const [gt, s] of T.g) {
        if (gt !== t || s < 3) continue;
        const real = Math.min(p.c[t], s - 1);
        const need = s - 1 - real;
        if (need > p.c[MIMIC]) continue;
        if (real === 0 && need > 0 && s - 1 > 2) continue; // never expose a set made mostly of Mimics with no real tile
        p.c[t] -= real; p.c[MIMIC] -= need; p.exps.push({ t, s, j: need });
        const d = distTo(p.c, p.exps, T);
        p.exps.pop(); p.c[t] += real; p.c[MIMIC] += need;
        if (d < cur && (!opt || d < opt.d || (d === opt.d && need < opt.need))) opt = { T, t, s, real, need, d };
      }
    }
    return opt;
  }

  function applyExpose(p, opt) {
    p.c[opt.t] -= opt.real;
    p.c[MIMIC] -= opt.need;
    p.exps.push({ t: opt.t, s: opt.s, j: opt.need });
  }

  function handSize(p) {
    let n = 0;
    for (let t = 0; t < TYPES; t++) n += p.c[t];
    for (const e of p.exps) n += e.s;
    return n;
  }

  function jokersUsed(p) {
    let j = p.c[MIMIC];
    for (const e of p.exps) j += e.j;
    return j;
  }

  // ---------- Table ----------
  const PERSONAS = [
    { name: 'You', callRate: 1, blunder: 0, style: '' },
    { name: 'Rosa', callRate: 0.9, blunder: 0.03, style: 'Racer: calls everything', callMax: 7 },
    { name: 'Lena', callRate: 0.7, blunder: 0.02, style: 'Reader: careful, rarely feeds you', callMax: 6, defend: true },
    { name: 'Bev', callRate: 0.5, blunder: 0.08, style: 'Gentle: patient, sometimes slips', callMax: 5 },
  ];

  function newPlayer(i, persona) {
    return { i, c: new Array(TYPES).fill(0), exps: [], pond: [], score: 0, persona };
  }

  function buildWall(r) {
    const w = [];
    for (let t = 0; t < 34; t++) for (let k = 0; k < 4; k++) w.push(t);
    for (let k = 0; k < 8; k++) { w.push(BLOSSOM); w.push(MIMIC); }
    for (let i = w.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = w[i]; w[i] = w[j]; w[j] = x; }
    return w;
  }

  function newMatch(seed, personas) {
    const r = rng(seed);
    const ps = (personas || PERSONAS).map((pp, i) => newPlayer(i, pp));
    return { r, seed, players: ps, dealer: 0, handNo: 0, hands: 4, log: [], history: [] };
  }

  function deal(G) {
    G.wall = buildWall(G.r);
    G.draws = 0;
    G.lastDiscard = null;
    G.seen = new Array(TYPES).fill(0);
    for (const p of G.players) { p.c.fill(0); p.exps = []; p.pond = []; p.av = null; }
    for (let k = 0; k < 13; k++) for (let i = 0; i < 4; i++) { const p = G.players[(G.dealer + i) % 4]; p.c[G.wall.pop()]++; }
    G.players[G.dealer].c[G.wall.pop()]++;
    G.turn = G.dealer;
  }

  // Bot picks 3 tiles to pass in the Swap (never Mimics).
  function botPass(p, r) {
    const out = [];
    for (let k = 0; k < 3; k++) {
      const ch = discardChoices(p).filter((x) => x.t !== MIMIC);
      let pick = ch[0];
      if (r && r() < (p.persona.blunder || 0) && ch.length > 2) pick = ch[Math.floor(r() * ch.length)];
      p.c[pick.t]--; out.push(pick.t);
    }
    return out;
  }

  // One Swap pass: passes[i] = tiles seat i gives. dir: 1 right, 2 across, 3 left (seat i gives to seat i+dir).
  function applyPass(G, passes, dir) {
    for (let i = 0; i < 4; i++) {
      const to = G.players[(i + dir) % 4];
      for (const t of passes[i]) to.c[t]++;
    }
  }

  function botDiscard(p, r, danger) {
    let ch = discardChoices(p);
    if (danger && danger.size && p.persona.defend) {
      const safe = ch.filter((x) => !danger.has(x.t) && x.b <= ch[0].b + 1);
      if (safe.length) ch = safe;
    }
    let pick = ch[0];
    const ties = ch.filter((x) => x.b === ch[0].b && Math.abs(x.near - ch[0].near) < 0.01);
    if (ties.length > 1) pick = ties[Math.floor(r() * ties.length)];
    if (r() < (p.persona.blunder || 0)) {
      const ok = ch.filter((x) => x.t !== MIMIC && x.b <= ch[0].b + 1);
      if (ok.length) pick = ok[Math.floor(r() * ok.length)];
    }
    return pick.t;
  }

  function botWantsCall(p, opt, r) {
    if (!opt) return false;
    const max = p.persona.callMax || 5;
    if (opt.d > max) return false;
    return r() < p.persona.callRate;
  }

  // Payment for a win. from = seat that discarded, or null for a self-drawn win.
  function settle(G, w, T, from) {
    const p = G.players[w];
    const H = HANDS[T.h];
    let v = H.pts;
    const clean = !H.noJ && jokersUsed(p) === 0;
    if (clean) v *= 2;
    const pays = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      if (i === w) continue;
      const amt = from === null ? 2 * v : (i === from ? 2 * v : v);
      pays[i] = -amt; pays[w] += amt;
    }
    for (let i = 0; i < 4; i++) G.players[i].score += pays[i];
    return { winner: w, T, hand: H, from, clean, value: v, pays };
  }

  // Fully automatic hand (all bots). Used by the simulator.
  function simHand(G) {
    deal(G);
    for (const dir of [1, 2, 3]) {
      const passes = G.players.map((p) => botPass(p, G.r));
      applyPass(G, passes, dir);
    }
    if (G.secondSwap && G.players.every((p) => best(p).d >= 4)) {
      for (const dir of [3, 2, 1]) {
        const passes = G.players.map((p) => botPass(p, G.r));
        applyPass(G, passes, dir);
      }
    }
    if (G.courtesy) {
      for (const [a, b] of [[0, 2], [1, 3]]) {
        const pa = botPass(G.players[a], G.r), pb = botPass(G.players[b], G.r);
        for (const t of pa) G.players[b].c[t]++;
        for (const t of pb) G.players[a].c[t]++;
      }
    }
    let seat = G.dealer, needDraw = false, rounds = 0;
    for (let guard = 0; guard < 400; guard++) {
      const p = G.players[seat];
      if (needDraw) {
        if (!G.wall.length) return { wall: true, draws: G.draws };
        p.c[G.wall.pop()]++; G.draws++;
      }
      const T = isWin(p);
      if (T) return Object.assign(settle(G, seat, T, null), { draws: G.draws, self: true });
      setAvail(G, p);
      const t = botDiscard(p, G.r);
      p.c[t]--; p.pond.push(t); see(G, t);
      let claimed = false;
      for (let k = 1; k <= 3; k++) {
        const o = (seat + k) % 4, q = G.players[o];
        const WT = winWith(q, t);
        if (WT) { q.c[t]++; return Object.assign(settle(G, o, WT, seat), { draws: G.draws, self: false }); }
      }
      for (let k = 1; k <= 3 && !claimed; k++) {
        const o = (seat + k) % 4, q = G.players[o];
        const opt = exposeOption(q, t);
        if (botWantsCall(q, opt, G.r)) {
          p.pond.pop(); applyExpose(q, opt); see(G, MIMIC, opt.need); see(G, t, opt.real); seat = o; needDraw = false; claimed = true;
        }
      }
      if (!claimed) { seat = (seat + 1) % 4; needDraw = true; }
    }
    return { wall: true, draws: G.draws, stuck: true };
  }

  function simulate(n, seed, opts) {
    const st = { hands: 0, wall: 0, rounds: 0, byHand: HANDS.map(() => 0), east: 0, wins: 0, mimicWins: 0, self: 0, calls: 0 };
    for (let g = 0; g < n; g++) {
      const G = newMatch((seed || 1) * 7919 + g);
      G.dealer = g % 4;
      if (opts && opts.secondSwap) G.secondSwap = true;
      if (opts && opts.courtesy) G.courtesy = true;
      const res = simHand(G);
      st.hands++; st.rounds += res.draws / 4;
      if (res.wall) { st.wall++; continue; }
      st.wins++; st.byHand[res.T.h]++;
      if (res.winner === G.dealer) st.east++;
      if (!res.clean && !res.hand.noJ) st.mimicWins++;
      if (res.self) st.self++;
    }
    return st;
  }

  // ---------- v2 rules: joker swaps, favored tiles, abilities ----------
  // Mimics sitting in laid-down sets that seat `me` could swap out with a real tile from hand.
  function jokerSwapOptions(G, me) {
    const p = G.players[me]; const out = [];
    G.players.forEach((q, o) => q.exps.forEach((e, k) => {
      if (e.j > 0 && p.c[e.t] > 0) out.push({ owner: o, k, t: e.t });
    }));
    return out;
  }
  function applyJokerSwap(G, me, opt) {
    const p = G.players[me]; const e = G.players[opt.owner].exps[opt.k];
    p.c[e.t]--; e.j--; p.c[MIMIC]++;
    G.seen[e.t]++; G.seen[MIMIC]--;
  }

  // Favored tiles: after the deal, up to `n` of seat `me`'s least useful non-suit tiles trade places with
  // suit tiles still in the wall. The 152-tile set never changes; only where tiles sit does.
  function favorSuit(G, me, suit, n) {
    const p = G.players[me]; let done = 0;
    const lo = suit * 9, hi = suit * 9 + 8;
    for (let w = G.wall.length - 1; w >= 0 && done < n; w--) {
      const wt = G.wall[w];
      if (wt < lo || wt > hi) continue;
      const ch = discardChoices(p).filter((x) => x.t < lo || x.t > hi);
      if (!ch.length) break;
      const give = ch[0].t;
      p.c[give]--; p.c[wt]++; G.wall[w] = give; done++;
    }
    return done;
  }

  // What an opponent with laid-down sets is probably building: tiles that would complete any hand
  // within 4 of their exposures. Used by defensive bots and by the coach's warnings.
  function dangerFor(G, seat) {
    const q = G.players[seat];
    if (!q.exps.length) return null;
    const tiles = new Set(); let hands = new Set(); let bestD = 99;
    for (const T of TARGETS) {
      const d = distTo(q.c.map(() => 0), q.exps, T);
      if (d >= 99) continue;
      // d here counts the whole remainder; use exposure count as the signal and collect the groups
      hands.add(T.h);
      for (const [t] of T.g) tiles.add(t);
      if (d < bestD) bestD = d;
    }
    return { tiles, hands, exps: q.exps.length };
  }
  function dangerTiles(G, me) {
    const out = new Set();
    for (let o = 0; o < 4; o++) {
      if (o === me) continue;
      const d = dangerFor(G, o);
      if (d && d.exps >= 1) d.tiles.forEach((t) => out.add(t));
    }
    return out;
  }

  function burnWall(G) { return G.wall.length > 1 ? G.wall.pop() : null; }
  function peekWall(G, n) { return G.wall.slice(-n).reverse(); }

  const ABILITIES = {
    ember: { critter: 'Cindermole', name: 'Hot Hands', when: 'When you lay down a set', does: 'the next wall tile burns up, so the game speeds toward you.' },
    tide: { critter: 'Reedling', name: 'Clear Water', when: 'Once per hand, on your turn', does: 'peek at the next three wall tiles before you discard.' },
    grove: { critter: 'Mossmouse', name: 'Second Sprout', when: 'Once per hand, when you are 2 or fewer tiles from Mahj', does: 'draw an extra tile, then discard two.' },
  };

  const api = { SUITS, WINDS, DRAKES, HANDS, TARGETS, BLOSSOM, MIMIC, TYPES, tileName, rng, distTo, ranked, best, byHand, discardChoices, jokerSwapOptions, applyJokerSwap, favorSuit, burnWall, peekWall, ABILITIES, dangerFor, dangerTiles, isWin, winWith, exposeOption, applyExpose, handSize, jokersUsed, PERSONAS, newMatch, deal, botPass, applyPass, botDiscard, botWantsCall, settle, simHand, simulate, setAvail, see, TOTAL, num, drakeOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TB = api;
})(typeof window !== 'undefined' ? window : globalThis);
