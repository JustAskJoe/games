// Hexed match-3 engine. Pure: no DOM. Runs in the browser (window.HX) and in node (module.exports).
// © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
(function (root) {
  'use strict';
  const ROWS = 8, COLS = 8;
  const ITEM = 9; // lantern
  const SPELLS = {
    candle: { name: 'Candle Flame', how: 'Match 4 in a line. Burns its whole row or column.' },
    cauldron: { name: 'Cauldron Boil', how: 'Match in an L or T shape. Boils over the 3×3 around it.' },
    orb: { name: 'Scrying', how: 'Match 5 in a line for a Crystal Ball. Swap it with a piece to clear every piece of that kind.' },
    cc: { name: 'Crossroads Hex', how: 'Swap two Candles together. Burns a full row and column.' },
    ck: { name: 'Witch Storm', how: 'Swap a Candle with a Cauldron. Burns three rows and three columns.' },
    kk: { name: 'Full Moon', how: 'Swap two Cauldrons together. Boils over a 5×5 area.' },
    oc: { name: 'Starfall', how: 'Swap a Crystal Ball with a Candle. Every piece of that kind becomes a Candle and burns.' },
    ok: { name: 'Coven Brew', how: 'Swap a Crystal Ball with a Cauldron. Every piece of that kind becomes a Cauldron and boils.' },
    oo: { name: 'Great Arcanum', how: 'Swap two Crystal Balls together. Clears the whole board.' },
  };

  // ---------- rng ----------
  function rngNew(seed) { return { s: (seed >>> 0) || 1 }; }
  function rnd(R) { R.s = (R.s + 0x6D2B79F5) >>> 0; let t = R.s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const ri = (R, n) => Math.floor(rnd(R) * n);

  // ---------- levels ----------
  // Layout chars: '.' cell, '#' hole, 'v' veil, 'V' vine, 'S' stone (2 hits), 's' cracked stone (1 hit), 'B' beast (top-left of 2×2), 'L' bound pair (pairs left to right in a row)
  const LEVELS = [
    { id: 0, num: '0', card: 'The Fool', theme: 'New beginnings', moves: 15, colors: 5,
      goal: { type: 'score', n: 2400 },
      twist: 'No obstacles. Just learn the craft.',
      layout: ['........', '........', '........', '........', '........', '........', '........', '........'] },
    { id: 1, num: 'I', card: 'The Magician', theme: 'Skill and willpower', moves: 18, colors: 5,
      goal: { type: 'make', sp: 'candle', n: 4 },
      twist: 'Match 4 in a row to make a Candle. Make 4 of them.',
      layout: ['#......#', '........', '........', '........', '........', '........', '........', '#......#'] },
    { id: 2, num: 'II', card: 'The High Priestess', theme: 'Intuition and hidden things', moves: 18, colors: 5,
      goal: { type: 'veil' },
      twist: 'Veiled tiles hide the board. Make a match on a veil to lift it.',
      layout: ['##....##', '#.vvvv.#', '.vvvvvv.', '.vv..vv.', '.vv..vv.', '.vvvvvv.', '#.vvvv.#', '##....##'] },
    { id: 3, num: 'III', card: 'The Empress', theme: 'Abundance and growth', moves: 25, colors: 5,
      goal: { type: 'vine' },
      twist: 'Vines grow over a piece every turn you don’t cut one back. Match next to a vine to cut it.',
      layout: ['........', '........', '........', '........', '........', '.V....V.', 'VV....VV', 'VVV..VVV'] },
    { id: 4, num: 'IV', card: 'The Emperor', theme: 'Structure and order', moves: 22, colors: 5,
      goal: { type: 'stone' },
      twist: 'Stone blocks take two hits. Match next to them, or blast them with a spell.',
      layout: ['........', '........', '........', '.S.SS.S.', '.S....S.', 'SS.SS.SS', '........', '........'] },
    { id: 5, num: 'V', card: 'The Hierophant', theme: 'Tradition and teaching', moves: 22, colors: 6,
      goal: { type: 'collect', color: 2, n: 28 },
      twist: 'Your first tarot spread. Three cards change the level before you play.',
      spread: { past: 'sun', present: 'conjure', future: 'movesLeft' },
      layout: ['........', '........', '........', '........', '........', '........', '........', '........'] },
    { id: 6, num: 'VI', card: 'The Lovers', theme: 'Union and choices', moves: 22, colors: 6,
      goal: { type: 'lock' },
      twist: 'Bound pairs are tied with a ribbon. Match either piece of a pair to free both.',
      spread: { past: 'tower', present: 'temperance', future: 'makeCauldron' },
      layout: ['........', '.LL..LL.', '........', 'LL....LL', '........', '.LL..LL.', '........', '...LL...'] },
    { id: 7, num: 'VII', card: 'The Chariot', theme: 'Willpower and direction', moves: 22, colors: 6, gravity: 'left',
      goal: { type: 'collect', color: 0, n: 26 },
      twist: 'The board drives sideways. Pieces fall to the left and new ones arrive from the right.',
      spread: { past: 'wands', present: 'wish', future: 'combo' },
      layout: ['#......#', '........', '........', '........', '........', '........', '........', '#......#'] },
    { id: 8, num: 'VIII', card: 'Strength', theme: 'Courage and gentle power', moves: 24, colors: 6,
      goal: { type: 'beast', hp: 18 },
      twist: 'A beast sits on the board. Match next to it or hit it with spells to tame it.',
      spread: { past: 'tower', present: 'smite', future: 'movesLeft' },
      layout: ['........', '........', '........', '...B....', '........', '........', '........', '........'] },
    { id: 9, num: 'IX', card: 'The Hermit', theme: 'Solitude and inner light', moves: 26, colors: 6, dark: true,
      goal: { type: 'item', n: 3 },
      twist: 'The board is dark. Matches light it up for a few turns. Bring 3 lanterns down to the glowing path along the bottom two rows.',
      spread: { past: 'moon', present: 'sunlight', future: 'collectCandles' },
      layout: ['........', '........', '........', '........', '........', '........', '........', '........'] },
  ];

  // Spread cards: original wording, traditional meanings.
  const CARDS = {
    sun: { name: 'The Sun', num: 'XIX', pos: 'past', meaning: 'Warmth and success', does: 'Start with 2 Candles already on the board.' },
    tower: { name: 'The Tower', num: 'XVI', pos: 'past', meaning: 'Sudden upheaval', does: 'Three cracked stones fall onto the board.' },
    wands: { name: 'Three of Wands', num: '3', pos: 'past', meaning: 'Plans in motion', does: 'Start with a Cauldron already on the board.' },
    moon: { name: 'The Moon', num: 'XVIII', pos: 'past', meaning: 'Illusion and uncertainty', does: 'Darker night. Matches light a smaller area.' },
    conjure: { name: 'The Magician', num: 'I', pos: 'present', meaning: 'Skill made real', does: 'Once: tap any piece to turn it into a Candle.', power: true },
    temperance: { name: 'Temperance', num: 'XIV', pos: 'present', meaning: 'Patience and balance', does: '+3 moves this level.' },
    wish: { name: 'The Star', num: 'XVII', pos: 'present', meaning: 'Hope and renewal', does: 'Once: swap any two neighbors, even without a match.', power: true },
    smite: { name: 'Justice', num: 'XI', pos: 'present', meaning: 'Cause and effect', does: 'Once: tap a spot to blast the 3×3 around it.', power: true },
    sunlight: { name: 'The Sun', num: 'XIX', pos: 'present', meaning: 'Clarity', does: 'Once: light the whole board for 3 turns.', power: true },
    movesLeft: { name: 'Eight of Pentacles', num: '8', pos: 'future', meaning: 'Diligence', does: 'Bonus if you finish with 5 or more moves left.' },
    makeCauldron: { name: 'Ace of Cups', num: 'A', pos: 'future', meaning: 'New feeling', does: 'Bonus if you make a Cauldron.' },
    combo: { name: 'Seven of Cups', num: '7', pos: 'future', meaning: 'Many choices', does: 'Bonus if you cast a spell combo (swap two specials together).' },
    collectCandles: { name: 'Page of Pentacles', num: 'P', pos: 'future', meaning: 'A student’s focus', does: 'Bonus if you collect 25 candle flames.' },
  };

  // ---------- state ----------
  const key = (r, c) => r * COLS + c;
  const inB = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const grid2 = (v) => Array.from({ length: ROWS }, () => Array(COLS).fill(v));
  const isColor = (p) => p && p.c >= 0 && p.c < 6;

  function newLevel(def, seed) {
    const R = rngNew(seed);
    const S = {
      def, R, rows: ROWS, cols: COLS, nextId: 1, ncolors: def.colors,
      mask: grid2(true), grid: grid2(null), blk: grid2(null), veil: grid2(false), lock: grid2(null), lit: grid2(0),
      gravity: def.gravity || 'down', dark: !!def.dark, lightR: 2,
      moves: def.moves, used: 0, score: 0, over: false, won: false,
      stats: { candle: 0, cauldron: 0, orb: 0, combos: 0, col: [0, 0, 0, 0, 0, 0], veils: 0, vines: 0, stones: 0, locks: 0, items: 0 },
      totals: { veil: 0, vine: 0, stone: 0, lock: 0 },
      beast: null, itemsSpawned: 0, spells: {}, power: null, powerUsed: false, bonusMet: false, litAll: 0,
    };
    const L = def.layout;
    const pend = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const ch = L[r][c];
      if (ch === '#') { S.mask[r][c] = false; continue; }
      if (ch === 'v') { S.veil[r][c] = true; S.totals.veil++; }
      if (ch === 'V') { S.blk[r][c] = { t: 'vine', hp: 1 }; }
      if (ch === 'S') { S.blk[r][c] = { t: 'stone', hp: 2 }; S.totals.stone++; }
      if (ch === 's') { S.blk[r][c] = { t: 'stone', hp: 1 }; S.totals.stone++; }
      if (ch === 'L') pend.push([r, c]);
      if (ch === 'B') {
        S.beast = { hp: def.goal.hp || 12, max: def.goal.hp || 12, r, c };
        for (const [dr, dc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) S.blk[r + dr][c + dc] = { t: 'beast', hp: 1 };
      }
    }
    for (let i = 0; i + 1 < pend.length; i += 2) {
      const [a, b] = [pend[i], pend[i + 1]];
      S.lock[a[0]][a[1]] = { p: b }; S.lock[b[0]][b[1]] = { p: a }; S.totals.lock++;
    }
    fillInitial(S);
    const sp = def.spread;
    if (sp) {
      S.power = sp.present;
      if (sp.present === 'temperance') S.moves += 3;
      if (sp.past === 'moon') S.lightR = 1;
      if (sp.past === 'sun') convertRandom(S, 2, () => (rnd(R) < 0.5 ? 'candleH' : 'candleV'));
      if (sp.past === 'wands') convertRandom(S, 1, () => 'cauldron');
      if (sp.past === 'tower') {
        let n = 0;
        for (let g = 0; g < 200 && n < 3; g++) {
          const r = 1 + ri(R, ROWS - 2), c = ri(R, COLS);
          if (!S.mask[r][c] || S.blk[r][c] || S.lock[r][c] || !isColor(S.grid[r][c])) continue;
          S.grid[r][c] = null; S.blk[r][c] = { t: 'stone', hp: 1 }; S.totals.stone++; n++;
        }
      }
    }
    if (S.def.goal.type === 'vine') S.totals.vine = countBlk(S, 'vine');
    if (S.dark) S.litAll = 2; // a first look before the lights go out
    ensureMoves(S);
    return S;
  }

  function countBlk(S, t) { let n = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (S.blk[r][c] && S.blk[r][c].t === t) n++; return n; }
  function playable(S, r, c) { return inB(r, c) && S.mask[r][c] && !S.blk[r][c]; }
  function mk(S, c, sp) { return { id: S.nextId++, c, sp: sp || null }; }

  function convertRandom(S, n, spFn) {
    let k = 0;
    for (let g = 0; g < 200 && k < n; g++) {
      const r = ri(S.R, ROWS), c = ri(S.R, COLS); const p = S.grid[r][c];
      if (!isColor(p) || p.sp || S.lock[r][c]) continue;
      p.sp = spFn(); k++;
    }
  }

  function fillInitial(S) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!playable(S, r, c)) continue;
      let col, tries = 0;
      do {
        col = ri(S.R, S.ncolors); tries++;
      } while (tries < 30 && ((c >= 2 && sameC(S, r, c - 1, col) && sameC(S, r, c - 2, col)) || (r >= 2 && sameC(S, r - 1, c, col) && sameC(S, r - 2, c, col))));
      S.grid[r][c] = mk(S, col);
    }
    if (S.def.goal.type === 'item') { // first lantern near the top
      for (const [r, c] of [[1, 2], [3, 5]]) if (playable(S, r, c)) { S.grid[r][c] = mk(S, ITEM); S.itemsSpawned++; }
    }
  }
  function sameC(S, r, c, col) { const p = S.grid[r][c]; return p && p.c === col; }

  // ---------- matching ----------
  function findGroups(S) {
    const runs = [];
    const scan = (horiz) => {
      for (let a = 0; a < (horiz ? ROWS : COLS); a++) {
        let b = 0; const N = horiz ? COLS : ROWS;
        while (b < N) {
          const r0 = horiz ? a : b, c0 = horiz ? b : a; const p = S.grid[r0][c0];
          if (!isColor(p)) { b++; continue; }
          let e = b + 1;
          while (e < N) { const q = horiz ? S.grid[a][e] : S.grid[e][a]; if (!isColor(q) || q.c !== p.c) break; e++; }
          if (e - b >= 3) { const cells = []; for (let k = b; k < e; k++) cells.push(horiz ? [a, k] : [k, a]); runs.push({ horiz, cells, color: p.c }); }
          b = e;
        }
      }
    };
    scan(true); scan(false);
    // union runs that share cells
    const groups = [];
    const owner = new Map();
    for (const run of runs) {
      let g = null;
      for (const [r, c] of run.cells) { const o = owner.get(key(r, c)); if (o) { g = o; break; } }
      if (!g) { g = { runs: [], cells: new Map(), color: run.color }; groups.push(g); }
      g.runs.push(run);
      for (const [r, c] of run.cells) { g.cells.set(key(r, c), [r, c]); owner.set(key(r, c), g); }
    }
    for (const g of groups) {
      const h = g.runs.filter((x) => x.horiz), v = g.runs.filter((x) => !x.horiz);
      const maxLen = Math.max(...g.runs.map((x) => x.cells.length));
      if (maxLen >= 5) g.sp = 'orb';
      else if (h.length && v.length) g.sp = 'cauldron';
      else if (maxLen === 4) g.sp = h.length ? 'candleH' : 'candleV';
      else g.sp = null;
    }
    return groups;
  }

  function wouldMatch(S, r, c) {
    const p = S.grid[r][c]; if (!isColor(p)) return false;
    let n = 1; for (let k = c - 1; k >= 0 && sameC(S, r, k, p.c); k--) n++; for (let k = c + 1; k < COLS && sameC(S, r, k, p.c); k++) n++;
    if (n >= 3) return true;
    n = 1; for (let k = r - 1; k >= 0 && sameC(S, k, c, p.c); k--) n++; for (let k = r + 1; k < ROWS && sameC(S, k, c, p.c); k++) n++;
    return n >= 3;
  }

  function canSwap(S, a, b) {
    if (!inB(a[0], a[1]) || !inB(b[0], b[1])) return false;
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return false;
    for (const [r, c] of [a, b]) { if (!playable(S, r, c) || !S.grid[r][c] || S.lock[r][c]) return false; }
    return true;
  }
  function swapCells(S, a, b) { const t = S.grid[a[0]][a[1]]; S.grid[a[0]][a[1]] = S.grid[b[0]][b[1]]; S.grid[b[0]][b[1]] = t; }
  function comboKind(pa, pb) {
    const t = (p) => (!p.sp ? 'n' : p.sp === 'orb' ? 'o' : p.sp === 'cauldron' ? 'k' : 'c');
    const k = [t(pa), t(pb)].sort().join('');
    if (k === 'nn' || k === 'cn' || k === 'kn') return null;
    if (pa.c === ITEM || pb.c === ITEM) return k.includes('o') ? null : null;
    return { cc: 'cc', ck: 'ck', kk: 'kk', co: 'oc', ko: 'ok', oo: 'oo', no: 'on' }[k] || null;
  }
  function isValidMove(S, a, b) {
    if (!canSwap(S, a, b)) return false;
    const pa = S.grid[a[0]][a[1]], pb = S.grid[b[0]][b[1]];
    if (comboKind(pa, pb) && pa.c !== ITEM && pb.c !== ITEM) return true;
    swapCells(S, a, b); const ok = wouldMatch(S, a[0], a[1]) || wouldMatch(S, b[0], b[1]); swapCells(S, a, b);
    return ok;
  }
  function validMoves(S) {
    const out = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (isValidMove(S, [r, c], [r, c + 1])) out.push([[r, c], [r, c + 1]]);
      if (isValidMove(S, [r, c], [r + 1, c])) out.push([[r, c], [r + 1, c]]);
    }
    return out;
  }

  // ---------- snapshots for the UI ----------
  function snap(S, kind, extra) {
    const pieces = []; const blk = []; const veil = []; const lock = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const p = S.grid[r][c]; if (p) pieces.push({ id: p.id, c: p.c, sp: p.sp, r, col: c });
      const b = S.blk[r][c]; if (b) blk.push({ r, c, t: b.t, hp: b.hp });
      if (S.veil[r][c]) veil.push([r, c]);
      if (S.lock[r][c]) lock.push({ r, c, p: S.lock[r][c].p });
    }
    return Object.assign({ kind, pieces, blk, veil, lock, lit: S.dark ? litMap(S) : null, beast: S.beast ? Object.assign({}, S.beast) : null, score: S.score }, extra || {});
  }
  function litMap(S) {
    const m = S.lit.map((row) => row.map((v) => v > 0 || S.litAll > 0));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const p = S.grid[r][c];
      if (p && p.c === ITEM) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (inB(r + dr, c + dc)) m[r + dr][c + dc] = true;
    }
    return m;
  }

  // ---------- clearing ----------
  function areaCells(S, sp, r, c) {
    const out = [];
    if (sp === 'candleH' || sp === 'row') for (let k = 0; k < COLS; k++) out.push([r, k]);
    if (sp === 'candleV' || sp === 'col') for (let k = 0; k < ROWS; k++) out.push([k, c]);
    if (sp === 'cauldron' || sp === 'r1') for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (inB(r + dr, c + dc)) out.push([r + dr, c + dc]);
    if (sp === 'r2') for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (inB(r + dr, c + dc)) out.push([r + dr, c + dc]);
    return out;
  }
  function mostCommonColor(S) {
    const n = [0, 0, 0, 0, 0, 0];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = S.grid[r][c]; if (isColor(p)) n[p.c]++; }
    let best = 0; for (let i = 1; i < 6; i++) if (n[i] > n[best]) best = i; return best;
  }

  // One clear pass. groups: match groups; seeds: {cells:[], acts:[{sp,r,c,color}]} for combos/powers.
  function clearPass(S, groups, seeds, pref, cascade) {
    const toClear = new Map(); // key -> [r,c]
    const fx = [];
    const queue = [];
    const activated = new Set();
    const blkHits = new Map(); // key -> hits
    let beastHits = 0; let vineHit = false;
    const newSpecials = [];
    const hitBlock = (r, c, n) => {
      const b = inB(r, c) && S.blk[r][c]; if (!b) return false;
      if (b.t === 'beast') { beastHits += n; return true; }
      blkHits.set(key(r, c), Math.max(blkHits.get(key(r, c)) || 0, n)); return true;
    };
    const addCell = (r, c) => {
      if (!inB(r, c) || !S.mask[r][c]) return;
      if (S.blk[r][c]) return;
      const p = S.grid[r][c];
      if (!p && !S.veil[r][c]) return;
      if (p && p.c === ITEM) return;
      toClear.set(key(r, c), [r, c]);
      if (p && p.sp && !activated.has(p.id)) { activated.add(p.id); queue.push({ sp: p.sp === 'orb' ? 'orbAuto' : p.sp, r, c, color: p.c }); }
    };
    for (const g of groups) {
      const cells = [...g.cells.values()];
      for (const [r, c] of cells) addCell(r, c);
      const hitThis = new Set(); let beastAdj = false;
      for (const [r, c] of cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc; const b = inB(rr, cc) && S.blk[rr][cc];
        if (!b) continue;
        if (b.t === 'beast') beastAdj = true; else hitThis.add(key(rr, cc));
      }
      for (const k of hitThis) blkHits.set(k, (blkHits.get(k) || 0) + 1);
      if (beastAdj) beastHits += 1;
      if (g.sp) {
        let at = cells.find(([r, c]) => pref && pref.some((q) => q[0] === r && q[1] === c));
        if (!at) at = cells[Math.floor(cells.length / 2)];
        newSpecials.push({ r: at[0], c: at[1], sp: g.sp, color: g.color });
      }
    }
    if (seeds) {
      for (const [r, c] of seeds.cells || []) addCell(r, c);
      for (const a of seeds.acts || []) queue.push(a);
    }
    while (queue.length) {
      const a = queue.shift();
      if (a.sp === 'orbAuto') { a.sp = 'color'; a.color = mostCommonColor(S); }
      if (a.sp === 'color') {
        fx.push({ t: 'color', r: a.r, c: a.c, color: a.color });
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = S.grid[r][c]; if (isColor(p) && p.c === a.color) addCell(r, c); }
        continue;
      }
      if (a.sp === 'all') { fx.push({ t: 'all' }); for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { addCell(r, c); if (S.blk[r][c]) hitBlock(r, c, 2); } continue; }
      const cells = areaCells(S, a.sp, a.r, a.c);
      fx.push({ t: a.sp === 'candleH' || a.sp === 'row' ? 'row' : a.sp === 'candleV' || a.sp === 'col' ? 'col' : 'blast', r: a.r, c: a.c, rad: a.sp === 'r2' ? 2 : 1 });
      let beastInArea = false;
      for (const [r, c] of cells) {
        const b = S.blk[r][c];
        if (b) { if (b.t === 'beast') beastInArea = true; else blkHits.set(key(r, c), (blkHits.get(key(r, c)) || 0) + 1); continue; }
        addCell(r, c);
      }
      if (beastInArea) beastHits += 2;
    }
    // apply clears
    let cleared = 0; const litCells = [];
    for (const [r, c] of toClear.values()) {
      const p = S.grid[r][c];
      if (S.lock[r][c]) {
        const pr = S.lock[r][c].p; S.lock[r][c] = null; if (S.lock[pr[0]] && S.lock[pr[0]][pr[1]]) S.lock[pr[0]][pr[1]] = null;
        S.stats.locks++; S.score += 50; litCells.push([r, c]);
        if (p) p.sp = null;
        continue;
      }
      if (S.veil[r][c]) { S.veil[r][c] = false; S.stats.veils++; S.score += 40; }
      if (p) { if (isColor(p)) S.stats.col[p.c]++; S.grid[r][c] = null; cleared++; }
      litCells.push([r, c]);
    }
    S.score += Math.round(cleared * 12 * (1 + cascade * 0.5));
    for (const [k, n] of blkHits) {
      const r = Math.floor(k / COLS), c = k % COLS; const b = S.blk[r][c]; if (!b) continue;
      b.hp -= n;
      if (b.t === 'vine') vineHit = true;
      if (b.hp <= 0) {
        S.blk[r][c] = null; S.score += 60;
        if (b.t === 'vine') S.stats.vines++;
        if (b.t === 'stone') S.stats.stones++;
      }
    }
    if (S.beast && beastHits) {
      S.beast.hp = Math.max(0, S.beast.hp - beastHits); S.score += 40 * beastHits;
      fx.push({ t: 'beast', n: beastHits });
      if (S.beast.hp === 0) {
        const { r, c } = S.beast;
        for (const [dr, dc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) S.blk[r + dr][c + dc] = null;
        S.score += 1000;
      }
    }
    for (const ns of newSpecials) {
      let { r, c } = ns;
      if (S.grid[r][c]) { // spot kept (locked); find an empty cell nearby
        let found = null;
        for (const [rr, cc] of areaCells(S, 'r1', r, c)) if (playable(S, rr, cc) && !S.grid[rr][cc]) { found = [rr, cc]; break; }
        if (!found) continue; [r, c] = found;
      }
      if (!playable(S, r, c)) continue;
      S.grid[r][c] = mk(S, ns.color, ns.sp);
      const kind = ns.sp === 'orb' ? 'orb' : ns.sp === 'cauldron' ? 'cauldron' : 'candle';
      S.stats[kind]++; S.spells[kind] = true; S.score += 60;
    }
    if (S.dark) for (const [r, c] of litCells) for (let dr = -S.lightR; dr <= S.lightR; dr++) for (let dc = -S.lightR; dc <= S.lightR; dc++) {
      if (Math.abs(dr) + Math.abs(dc) <= S.lightR && inB(r + dr, c + dc)) S.lit[r + dr][c + dc] = 3;
    }
    return { cleared: toClear.size, fx, vineHit, made: newSpecials.length };
  }

  // ---------- gravity ----------
  function lines(S) {
    const out = [];
    if (S.gravity === 'left') {
      for (let r = 0; r < ROWS; r++) { const L = []; for (let c = 0; c < COLS; c++) L.push([r, c]); out.push({ cells: L, spawn: [0, 1] }); }
    } else {
      for (let c = 0; c < COLS; c++) { const L = []; for (let r = ROWS - 1; r >= 0; r--) L.push([r, c]); out.push({ cells: L, spawn: [-1, 0] }); }
    }
    return out;
  }
  function gravity(S) {
    const spawnFrom = {};
    for (const line of lines(S)) {
      let seg = [];
      const flush = (isTopSeg) => {
        if (!seg.length) return;
        const pieces = seg.map(([r, c]) => S.grid[r][c]).filter(Boolean);
        seg.forEach(([r, c], i) => { S.grid[r][c] = pieces[i] || null; });
        let k = 0;
        for (let i = pieces.length; i < seg.length; i++) {
          const [r, c] = seg[i];
          const p = spawnPiece(S, isTopSeg && S.gravity === 'down');
          S.grid[r][c] = p;
          const top = seg[seg.length - 1];
          spawnFrom[p.id] = [top[0] + line.spawn[0] * (k + 1), top[1] + line.spawn[1] * (k + 1)];
          k++;
        }
        seg = [];
      };
      const N = line.cells.length; let lastBreak = -1;
      for (let i = 0; i < N; i++) {
        const [r, c] = line.cells[i];
        if (!S.mask[r][c] || S.blk[r][c] || S.lock[r][c]) { flush(false); lastBreak = i; continue; }
        seg.push([r, c]);
      }
      flush(true);
    }
    return spawnFrom;
  }
  function spawnPiece(S, topOk) {
    if (S.def.goal.type === 'item' && topOk) {
      let onBoard = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = S.grid[r][c]; if (p && p.c === ITEM) onBoard++; }
      const need = S.def.goal.n - S.stats.items;
      if (onBoard < 2 && S.itemsSpawned < S.def.goal.n + 2 && need > 0) { S.itemsSpawned++; return mk(S, ITEM); }
    }
    return mk(S, ri(S.R, S.ncolors));
  }
  function collectItems(S) {
    let n = 0; const fxs = [];
    for (let c = 0; c < COLS; c++) {
      let floor = -1; for (let r = ROWS - 1; r >= 0; r--) if (S.mask[r][c]) { floor = r; break; }
      if (floor < 0) continue;
      for (const r of [floor, floor - 1]) {
        const p = r >= 0 && S.grid[r][c];
        if (p && p.c === ITEM) { S.grid[r][c] = null; S.stats.items++; n++; S.score += 500; fxs.push({ t: 'item', r, c }); }
      }
    }
    return { n, fx: fxs };
  }

  // ---------- moves ----------
  function settle(S, frames, firstGroupsOrSeeds, pref) {
    let cascade = 0; let vineHit = false; let seeds = firstGroupsOrSeeds;
    for (let guard = 0; guard < 60; guard++) {
      const groups = findGroups(S);
      if (!groups.length && !seeds) break;
      const res = clearPass(S, groups, seeds, cascade === 0 ? pref : null, cascade);
      seeds = null; vineHit = vineHit || res.vineHit;
      frames.push(snap(S, 'clear', { fx: res.fx, cascade }));
      for (let g2 = 0; g2 < 10; g2++) {
        const spawn = gravity(S);
        frames.push(snap(S, 'fall', { spawn }));
        const it = collectItems(S);
        if (!it.n) break;
        frames.push(snap(S, 'clear', { fx: it.fx, cascade }));
      }
      cascade++;
    }
    return { vineHit, cascades: cascade };
  }

  function endOfMove(S, frames, vineHit) {
    if (S.def.goal.type === 'vine' && !vineHit && !isDone(S) && (S.vineCalm = !S.vineCalm) === false) {
      const vines = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (S.blk[r][c] && S.blk[r][c].t === 'vine') vines.push([r, c]);
      const opts = [];
      for (const [r, c] of vines) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc; if (!playable(S, rr, cc)) continue; const p = S.grid[rr][cc];
        if (isColor(p) && !p.sp && !S.lock[rr][cc]) opts.push([rr, cc]);
      }
      if (opts.length) {
        const [r, c] = opts[ri(S.R, opts.length)]; S.grid[r][c] = null; S.blk[r][c] = { t: 'vine', hp: 1 };
        frames.push(snap(S, 'vine', { fx: [{ t: 'vine', r, c }] }));
      }
    }
    if (S.dark) { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (S.lit[r][c] > 0) S.lit[r][c]--; if (S.litAll > 0) S.litAll--; }
    checkEnd(S);
    if (!S.over && ensureMoves(S)) frames.push(snap(S, 'shuffle'));
    frames.push(snap(S, 'rest'));
  }

  // Returns {ok, frames}
  function move(S, a, b, opts) {
    const free = opts && opts.free;
    const frames = [];
    if (S.over || !canSwap(S, a, b)) return { ok: false, frames };
    const pa = S.grid[a[0]][a[1]], pb = S.grid[b[0]][b[1]];
    const combo = pa.c !== ITEM && pb.c !== ITEM ? comboKind(pa, pb) : null;
    swapCells(S, a, b);
    frames.push(snap(S, 'swap'));
    let seeds = null;
    if (combo) {
      const spellKey = combo === 'on' ? 'orb' : combo; S.spells[spellKey] = true; if (combo !== 'on') S.stats.combos++;
      const [r, c] = b; // the spot the player swiped toward
      const A = S.grid[b[0]][b[1]], B = S.grid[a[0]][a[1]]; // A is pa now at b
      const orbP = A.sp === 'orb' ? A : B.sp === 'orb' ? B : null; const other = orbP === A ? B : A;
      A.sp = A.sp; // keep
      const consume = (p) => { p.sp = null; };
      seeds = { cells: [a, b], acts: [], spell: SPELLS[spellKey].name };
      if (combo === 'on') { consume(orbP); seeds.acts.push({ sp: 'color', r, c, color: other.c }); }
      else if (combo === 'oo') { consume(A); consume(B); seeds.acts.push({ sp: 'all', r, c }); }
      else if (combo === 'oc' || combo === 'ok') {
        const col = other.c; consume(orbP); consume(other);
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) {
          const p = S.grid[rr][cc]; if (isColor(p) && p.c === col && !S.lock[rr][cc]) { p.sp = combo === 'ok' ? 'cauldron' : (rnd(S.R) < 0.5 ? 'candleH' : 'candleV'); }
        }
        frames.push(snap(S, 'convert', { spell: SPELLS[spellKey].name }));
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) { const p = S.grid[rr][cc]; if (isColor(p) && p.c === col && p.sp) seeds.cells.push([rr, cc]); }
      } else if (combo === 'cc') { consume(A); consume(B); seeds.acts.push({ sp: 'row', r, c }, { sp: 'col', r, c }); }
      else if (combo === 'ck') { consume(A); consume(B); for (let d = -1; d <= 1; d++) { if (inB(r + d, c)) seeds.acts.push({ sp: 'row', r: r + d, c }); if (inB(r, c + d)) seeds.acts.push({ sp: 'col', r, c: c + d }); } }
      else if (combo === 'kk') { consume(A); consume(B); seeds.acts.push({ sp: 'r2', r, c }); }
    } else if (!free && !wouldMatch(S, a[0], a[1]) && !wouldMatch(S, b[0], b[1])) {
      swapCells(S, a, b); frames.push(snap(S, 'swapback'));
      return { ok: false, frames };
    }
    S.moves--; S.used++;
    const st = settle(S, frames, seeds, [a, b]);
    if (seeds && seeds.spell && frames.length > 1) frames[1].spell = seeds.spell;
    endOfMove(S, frames, st.vineHit);
    return { ok: true, frames, combo };
  }

  // Present-card powers. Returns {ok, frames}
  function usePower(S, cell) {
    const frames = [];
    if (S.over || S.powerUsed || !S.power) return { ok: false, frames };
    const [r, c] = cell || [0, 0];
    if (S.power === 'conjure') {
      const p = inB(r, c) && S.grid[r][c];
      if (!isColor(p) || S.lock[r][c]) return { ok: false, frames };
      p.sp = 'candleH'; S.powerUsed = true; frames.push(snap(S, 'convert', { spell: 'The Magician' })); frames.push(snap(S, 'rest'));
      return { ok: true, frames };
    }
    if (S.power === 'smite') {
      if (!inB(r, c) || !S.mask[r][c]) return { ok: false, frames };
      S.powerUsed = true;
      const st = settle(S, frames, { cells: [], acts: [{ sp: 'r1', r, c }] }, null);
      if (frames.length) frames[0].spell = 'Justice';
      endOfMoveNoSpend(S, frames, st.vineHit);
      return { ok: true, frames };
    }
    if (S.power === 'sunlight') {
      S.powerUsed = true; S.litAll = 4; frames.push(snap(S, 'rest', { spell: 'The Sun' })); return { ok: true, frames };
    }
    return { ok: false, frames };
  }
  function endOfMoveNoSpend(S, frames, vineHit) {
    checkEnd(S); if (!S.over && ensureMoves(S)) frames.push(snap(S, 'shuffle')); frames.push(snap(S, 'rest'));
  }

  function ensureMoves(S) {
    if (validMoves(S).length) return false;
    for (let t = 0; t < 60; t++) {
      const cells = []; const cols = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = S.grid[r][c]; if (isColor(p) && !S.lock[r][c]) { cells.push(p); cols.push(p.c); } }
      for (let i = cols.length - 1; i > 0; i--) { const j = ri(S.R, i + 1); [cols[i], cols[j]] = [cols[j], cols[i]]; }
      cells.forEach((p, i) => { p.c = cols[i]; });
      if (!findGroups(S).length && validMoves(S).length) return true;
    }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = S.grid[r][c]; if (isColor(p) && !p.sp) p.c = ri(S.R, S.ncolors); }
    return true;
  }

  // ---------- goals ----------
  function progress(S) {
    const g = S.def.goal;
    switch (g.type) {
      case 'score': return { have: S.score, need: g.n, label: 'points' };
      case 'make': return { have: S.stats.candle, need: g.n, label: 'Candles made' };
      case 'veil': return { have: S.stats.veils, need: S.totals.veil, label: 'veils lifted' };
      case 'vine': { const left = countBlk(S, 'vine'); return { have: left === 0 ? 1 : 0, need: 1, left, label: 'vines left' }; }
      case 'stone': return { have: S.stats.stones, need: S.totals.stone, label: 'stones broken' };
      case 'collect': return { have: Math.min(S.stats.col[g.color], g.n), need: g.n, label: 'collected', color: g.color };
      case 'lock': return { have: S.stats.locks, need: S.totals.lock, label: 'pairs freed' };
      case 'beast': return { have: S.beast.max - S.beast.hp, need: S.beast.max, left: S.beast.hp, label: 'beast tamed' };
      case 'item': return { have: S.stats.items, need: g.n, label: 'lanterns' };
    }
    return { have: 0, need: 1, label: '' };
  }
  function isDone(S) { const p = progress(S); return p.have >= p.need; }
  function bonusCheck(S) {
    const f = S.def.spread && S.def.spread.future; if (!f) return false;
    if (f === 'movesLeft') return S.moves >= 5;
    if (f === 'makeCauldron') return S.stats.cauldron > 0;
    if (f === 'combo') return S.stats.combos > 0;
    if (f === 'collectCandles') return S.stats.col[1] >= 25;
    return false;
  }
  function checkEnd(S) {
    if (isDone(S)) {
      S.over = true; S.won = true;
      S.bonusMet = bonusCheck(S);
      S.score += S.moves * 150 + (S.bonusMet ? 1500 : 0);
    } else if (S.moves <= 0) { S.over = true; S.won = false; }
  }
  function stars(S) {
    if (!S.won) return 0;
    const base = S.def.goal.type === 'score' ? S.def.goal.n : 2500;
    return S.score >= base * 2.2 ? 3 : S.score >= base * 1.5 ? 2 : 1;
  }

  // ---------- bots and sim ----------
  function clone(S) {
    const C = Object.assign({}, S);
    C.R = { s: S.R.s };
    C.grid = S.grid.map((row) => row.map((p) => (p ? Object.assign({}, p) : null)));
    C.blk = S.blk.map((row) => row.map((b) => (b ? Object.assign({}, b) : null)));
    C.veil = S.veil.map((row) => row.slice());
    C.lock = S.lock.map((row) => row.map((l) => (l ? { p: l.p } : null)));
    C.lit = S.lit.map((row) => row.slice());
    C.mask = S.mask;
    C.stats = Object.assign({}, S.stats, { col: S.stats.col.slice() });
    C.spells = Object.assign({}, S.spells);
    C.beast = S.beast ? Object.assign({}, S.beast) : null;
    return C;
  }
  function goalValue(S) {
    const p = progress(S); let v = Math.min(p.have, p.need) / Math.max(1, p.need);
    if (S.def.goal.type === 'item') { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const q = S.grid[r][c]; if (q && q.c === ITEM) v += (r / ROWS) * 0.25 / p.need; } }
    if (S.def.goal.type === 'vine') v -= countBlk(S, 'vine') * 0.03;
    return v;
  }
  // Rank moves by actually playing them on a copy. Returns [{a,b,v}] best first.
  function rankMoves(S) {
    const list = validMoves(S); const out = [];
    const g0 = goalValue(S);
    for (const [a, b] of list) {
      const C = clone(S); move(C, a, b);
      const v = (goalValue(C) - g0) * 4000 + (C.score - S.score) + (C.won ? 100000 : 0) + ((C.stats.candle + C.stats.cauldron + C.stats.orb) - (S.stats.candle + S.stats.cauldron + S.stats.orb)) * 120;
      out.push({ a, b, v });
    }
    out.sort((x, y) => y.v - x.v);
    return out;
  }
  // Quick hint without simulation: prefer moves that make specials or combos.
  function hint(S) {
    const list = validMoves(S); if (!list.length) return null;
    let best = null, bv = -1;
    for (const [a, b] of list) {
      const pa = S.grid[a[0]][a[1]], pb = S.grid[b[0]][b[1]]; let v = 1;
      if (comboKind(pa, pb)) v = 50;
      else {
        swapCells(S, a, b);
        const groups = findGroups(S);
        for (const g of groups) { if (g.cells.has(key(a[0], a[1])) || g.cells.has(key(b[0], b[1]))) { v = Math.max(v, g.cells.size + (g.sp === 'orb' ? 30 : g.sp === 'cauldron' ? 15 : g.sp ? 10 : 0)); } }
        swapCells(S, a, b);
      }
      if (v > bv) { bv = v; best = { a, b, v }; }
    }
    return best;
  }
  function simulate(levelIdx, n, seed0, skill) {
    const def = LEVELS[levelIdx]; let wins = 0, bonus = 0; const left = []; const st = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      const S = newLevel(def, (seed0 || 1) + i * 7919);
      const R = rngNew(9 + i);
      if (S.power === 'conjure') { const h = validMoves(S)[0]; if (h) usePower(S, h[0]); }
      if (S.power === 'sunlight') usePower(S);
      let smiteDone = false;
      while (!S.over) {
        if (S.power === 'smite' && !smiteDone && S.beast) { smiteDone = true; usePower(S, [S.beast.r, S.beast.c - 1]); continue; }
        const ranked = skill === 'random' ? null : rankMoves(S);
        let m;
        if (!ranked) { const v = validMoves(S); m = v[ri(R, v.length)]; m = { a: m[0], b: m[1] }; }
        else { const k = skill === 'casual' && ranked.length > 2 && rnd(R) < 0.45 ? 1 + ri(R, Math.min(3, ranked.length - 1)) : 0; m = ranked[k]; }
        move(S, m.a, m.b);
      }
      if (S.won) { wins++; left.push(S.moves); if (S.bonusMet) bonus++; }
      st[stars(S)]++;
    }
    left.sort((a, b) => a - b);
    return { level: def.card, n, winRate: wins / n, medianMovesLeft: left.length ? left[Math.floor(left.length / 2)] : null, bonusRate: wins ? bonus / wins : 0, stars: st };
  }

  const API = { ROWS, COLS, ITEM, LEVELS, CARDS, SPELLS, newLevel, move, usePower, validMoves, canSwap, hint, progress, stars, simulate, rankMoves, snap, isValidMove };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.HX = API;
})(typeof window !== 'undefined' ? window : globalThis);
