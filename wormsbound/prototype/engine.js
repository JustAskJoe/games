/* Wormsbound (working title) · Prototype 1 engine.
   © 2026 justaskjoe. All rights reserved.

   Pure game logic, no DOM. Runs in the browser as window.WB and in node (sim.js, test.js).
   - Seeded RNG whose state lives in G._s, so G is plain JSON (save = JSON.stringify(G)).
   - Every player input is an intent through act(G, intent). The UI, the bots and (later) online play all use it,
     so seed + intent log replays a match exactly. hash(G) is a checksum for spotting drift.
   - Fixed-step physics at 60 ticks a second while anything is flying or falling (phase 'flight').

   Each team picks one of five characters (CHARS) before the match. A character sets its units' health, armour,
   walking and climbing, and its shots: Shot 1 (unlimited), Shot 2 (its ability, 2 a match) and its SS (Special
   Shot): a big ultimate that charges one notch per turn of yours and is ready every SS_CHARGE turns. Every
   character also carries the Live dud. The idea of characters with their own shots comes from GunBound;
   the characters, names and shots here are our own.

   The map is a grid of terrain cells built by mapgen.js (0 = air; 1 ground, 3 and 4 props: breakable; 2 hard rock:
   blasts can't break it). Units, shells, duds and barrels move in cell units, y pointing down.
   Turn flow: aim (move, pick a shot, fire or lob a live dud, or pass) → flight (step() until everything
   settles) → live duds tick down one → the next turn, with new wind. Last team standing wins.

   Turn delay (GunBound's idea): there is no fixed back-and-forth. Every unit has a delay; whatever it does on its
   turn adds to it (each shot has its own cost, walking adds a little per step, passing isn't free), and the next
   turn always goes to the living unit with the lowest delay. Light shots get you back sooner, heavy ones later. */
(function (root) {
  'use strict';
  const MapGen = typeof module !== 'undefined' && module.exports ? require('./mapgen.js') : root.MapGen;

  // ---------- tuning (everything a balance pass might touch lives here) ----------
  const TICK = 1 / 60;          // seconds per physics tick
  const COLS = 160, ROWS = 90;  // the one-screen terrain grid, in cells (8 px each on a 1280×720 stage). A match's own
                                // grid is G.cols × G.rows: bigger matches get bigger maps (MapGen.sizeFor) and a camera.
  const WATER0 = 82;            // water surface row on the one-screen grid; the map sets each match's own (G.water)
  const GRAV = 30;              // cells / s²
  const VMAX = 60;              // launch speed at full power, cells / s
  const WIND_MAX = 7;           // strongest wind push, cells / s² sideways
  const UNIT_R = 1.5;           // unit body radius, cells
  const MAX_TEAMS = 6;          // online free-for-all takes up to 6 players
  const UNITS_PER_TEAM = 1;     // default side size: 1v1 and the 4-way free-for-all both use one unit a side
  const MAX_SIZE = 5;           // most units a side (squads and 5v5)
  const MAX_UNITS = 12;         // most units in one match (6 sides of 2, 4 of 3, 2 of 5...)
  const HP = 100;               // a "standard" unit; characters scale from it
  const MOVE_STEPS = 14;        // default steps a turn (characters override)
  const CLIMB = 2;              // default highest ledge a step can climb
  const SAFE_FALL = 22;         // landing speed (cells/s) before fall damage
  const FALL_DMG = 2.2;         // hp per cell/s over SAFE_FALL
  const KNOCK = 26;             // knockback speed at the blast centre
  const LOB_RANGE = 5;          // how close a unit must be to pick up a live dud
  const LOB_POWER = 0.65;       // a thrown dud tops out below a full-power shot
  const SUDDEN_ROUNDS = 12;     // after this many rounds (a round = one turn per side) the water rises
  const SUDDEN_RISE = 2;        // rows per turn
  const MAX_ROUNDS = 40;        // hard stop (the rising water should end it well before this)
  // a round is one turn per side; bigger crews get more turns before the water rises (2 a side: ×1.35 ... 5 a side: ×2.4)
  const crewTurns = (G) => G.teams * (1 + 0.35 * ((G.size || 1) - 1));
  const suddenTurn = (G) => Math.round(SUDDEN_ROUNDS * crewTurns(G)), maxTurns = (G) => Math.round(MAX_ROUNDS * crewTurns(G));
  const DMG_SPREAD = 1.6;       // damage falls off to 0 at r × 1.6
  const SS_CHARGE = 4;          // the SS is ready on your 4th turn, then every 4th turn after you use it
  // Turn delay: what each action adds to the acting unit's delay (shots carry their own `delay`).
  const DELAY = { move: 12, pass: 520, lob: 620, dud: 720 };
  // Health scale by format: characters' hp numbers are for a crew of two; one unit a side needs more to last.
  const HP_MUL = { duel: 2.6, ffa: 1.8, crew: 1 };
  const CREW_HP = [0, 0, 1.5, 1.25, 1.05, 0.9]; // by units a side (2 to 5): small crews need a bit more health each
  const START_GAP = 10;         // starting delays alternate teams 0, 10, 20, 30 so the first round goes A B A B

  // The Live dud: every character has 2. Lands without exploding, ticks down 3 turns, anyone near can lob it.
  const DUD = { name: 'Live dud', ammo: 2, r: 6, dmg: 60, fuse: 3, delay: DELAY.dud, desc: 'Lands without exploding and ticks for 3 turns. Anyone close can lob it on.' };

  // Shot fields: r crater, dmg centre damage, wind (× wind push), speed (× launch speed), knock (× knockback),
  // bounce (bounces off the ground first), drill (cells it tunnels through), strike (lightning: {w, dmg}),
  // double (a second shot follows), ammo (-1 = unlimited), delay (turn delay it adds: heavier = your next turn later).
  // SS-only fields: rain (a fan of darts), storm (three lightning strikes), quake (hits every enemy on the ground),
  // tornado (flings everyone within reach).
  // Numbers tuned Nov 2, 2026 (1v1, one unit a side, with SS and turn delay) so every character wins 40-60% of
  // smart-bot matches across the roster (sim.js). Health here is the base; HP_MUL scales it by format.
  const CHARS = {
    brick: { name: 'Brick', role: 'Tank', hp: 110, armor: 0.88, steps: 10, climb: 2,
      blurb: 'Big, tough and slow. Takes 12% less damage. His heavy shots barely feel the wind.',
      shot1: { name: 'Slug', ammo: -1, delay: 680, r: 3.5, dmg: 40, wind: 0.45, desc: 'A heavy shell. Wind hardly moves it.' },
      shot2: { name: 'Wrecking Ball', ammo: 2, delay: 840, r: 5, dmg: 56, wind: 0.45, bounce: 1, desc: 'Bounces once, then a big blast.' },
      ss: { name: 'Meteor Slam', delay: 1040, r: 6, dmg: 56, wind: 0.3, speed: 0.95, desc: 'A huge, heavy shell: the biggest crater in the game.' } },
    zip: { name: 'Zip', role: 'Scout', hp: 105, armor: 1, steps: 22, climb: 3,
      blurb: 'Quick on her feet. Walks twice as far as most and climbs higher ledges.',
      shot1: { name: 'Dart', ammo: -1, delay: 560, r: 3, dmg: 46, speed: 1.15, wind: 0.8, desc: 'Fast and flat, with a small blast.' },
      shot2: { name: 'Double Tap', ammo: 2, delay: 740, r: 3, dmg: 38, speed: 1.15, wind: 0.8, double: true, desc: 'Two darts, one right after the other.' },
      ss: { name: 'Bullet Rain', delay: 960, r: 3.2, dmg: 36, speed: 1.15, wind: 0.8, rain: { n: 5, spread: 4 }, desc: 'Five darts fanned out in a quick burst.' } },
    volt: { name: 'Volt', role: 'All-rounder', hp: 100, armor: 1, steps: 14, climb: 2,
      blurb: 'Steady and simple. Calls lightning down on anyone hiding under cover.',
      shot1: { name: 'Arc Ball', ammo: -1, delay: 600, r: 3.2, dmg: 46, desc: 'A plain, reliable shell.' },
      shot2: { name: 'Thunderstrike', ammo: 2, delay: 800, r: 3, dmg: 26, strike: { w: 2.2, dmg: 34 }, desc: 'Where it lands, lightning hits everyone close by, cover or not.' },
      ss: { name: 'Storm Call', delay: 1000, r: 3, dmg: 24, storm: { gap: 7, w: 2.4, dmg: 42 }, desc: 'Three lightning bolts: where it lands and 7 cells to each side.' } },
    digger: { name: 'Digger', role: 'Miner', hp: 110, armor: 0.95, steps: 12, climb: 2,
      blurb: 'Sturdy. Can tunnel straight through hills to reach someone dug in.',
      shot1: { name: 'Pick Shell', ammo: -1, delay: 620, r: 4, dmg: 40, desc: 'Digs a wide crater.' },
      shot2: { name: 'Drill', ammo: 2, delay: 800, r: 4, dmg: 48, drill: 14, desc: 'Bores through up to 14 cells of ground, then explodes.' },
      ss: { name: 'Earthquake', delay: 1000, r: 5, dmg: 40, quake: { dmg: 20 }, desc: 'A big blast, then a quake that hits every enemy standing on the ground.' } },
    gale: { name: 'Gale', role: 'Wind-rider', hp: 90, armor: 1, steps: 16, climb: 2,
      blurb: 'Rides the wind. Her shots curve hard, and her Gust throws people into the water.',
      shot1: { name: 'Kite Bomb', ammo: -1, delay: 600, r: 4, dmg: 42, wind: 1.7, desc: 'Strong, but the wind pushes it a lot.' },
      shot2: { name: 'Gust Bomb', ammo: 2, delay: 780, r: 4.5, dmg: 24, wind: 1.7, knock: 2.2, desc: 'Weak blast, huge knockback.' },
      ss: { name: 'Tornado', delay: 980, r: 3, dmg: 20, wind: 1.3, tornado: { reach: 11, dmg: 16, push: 26 }, desc: 'Flings everyone within 11 cells away from it, you too.' } },
  };
  const CHAR_IDS = Object.keys(CHARS);
  const WEAPON_IDS = ['shot1', 'shot2', 'dud', 'ss'];

  // ---------- seeded RNG (state in G._s) ----------
  function R(G) { G._s = (G._s + 0x6D2B79F5) >>> 0; let t = G._s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- terrain ----------
  const solidAt = (G, x, y) => { const cx = Math.floor(x), cy = Math.floor(y); if (cx < 0 || cx >= G.cols || cy >= G.rows) return false; if (cy < 0) return false; return G.T[cy * G.cols + cx] !== 0; };
  function surfaceY(G, x) { const cx = clamp(Math.floor(x), 0, G.cols - 1); for (let y = 0; y < G.rows; y++) if (G.T[y * G.cols + cx]) return y; return G.rows; }

  // Maps come from the map generator (mapgen.js): ten themes, each a preset you can tweak, plus share codes.
  // MAPS lists the theme maps a round can deal; opts.map also takes any preset id, share code or settings object.
  // With no opts.map, each round's map comes from its seed (pickMap), so every copy of the game (server, both
  // browsers) builds the same one without sending anything extra.
  const MAPS = {}; for (const id of MapGen.MAP_IDS) MAPS[id] = { name: MapGen.PRESETS[id].name, blurb: MapGen.PRESETS[id].blurb };
  const MAP_IDS = MapGen.MAP_IDS;
  function pickMap(seed) { let h = (seed >>> 0) ^ 0x9E3779B9; h = Math.imul(h ^ (h >>> 16), 0x45D9F3B) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x45D9F3B) >>> 0; return MAP_IDS[((h ^ (h >>> 16)) >>> 0) % MAP_IDS.length]; }
  const BARREL = { r: 4.5, dmg: 44 }; // a map hazard: blows up when a blast reaches it (and sets off the next one)
  function carve(G, cx, cy, r) {
    const COLS = G.cols, x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(COLS - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(G.rows - 1, Math.ceil(cy + r));
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r && G.T[y * COLS + x] && G.T[y * COLS + x] !== MapGen.ROCK) { G.T[y * COLS + x] = 0; n++; }
    }
    return n;
  }

  // ---------- game state ----------
  // opts.teams: sides, 2 to 6. opts.size: units a side, 1 to 5 (at most MAX_UNITS in a match). opts.first: which side
  // shoots first. opts.chars: a character id per side, or one per unit (side 0's units first); default Volt.
  // opts.owners: who controls each unit (same order as per-unit chars); default: its side. The online server uses it for
  // one player per unit, and gives the seats nobody took to bots.
  // opts.map: a preset id, a share code or a settings object for MapGen. With none, the round rolls a fresh map from
  // opts.recipe (default: the recipe for this format), so every copy of the match (server, every browser, a replay)
  // builds the same one from the seed. opts.mapSize: a MapGen size id; default grows with the number of units.
  // opts.spawn: 'sides' | 'mixed' (default: the recipe's). opts.under: share of units that may start below the surface.
  const recipeFor = (teams, size) => (size > 1 ? 'squads' : teams > 2 ? 'ffa' : 'duel');
  function newGame(seed, opts = {}) {
    const teams = Math.max(2, Math.min(MAX_TEAMS, opts.teams | 0));
    const size = Math.max(1, Math.min(MAX_SIZE, Math.floor(MAX_UNITS / teams), opts.size || UNITS_PER_TEAM)), spots = teams * size;
    const perUnit = !!opts.chars && opts.chars.length === spots && size > 1;
    const charAt = (t, i) => { const c = opts.chars && (perUnit ? opts.chars[t * size + i] : opts.chars[t]); return CHARS[c] ? c : 'volt'; };
    const chars = Array.from({ length: teams }, (_, t) => charAt(t, 0)); // each side's lead character (the HUD's label)
    const G = {
      v: 3, seed: seed >>> 0, _s: (seed >>> 0) || 1, _id: 0, cols: COLS, rows: ROWS, map: 'hills', mapName: '', theme: 'hills', windMul: 1, mirror: false,
      phase: 'aim', turn: 0, team: 0, teams, size, actor: 0, spent: 0, chars,
      wind: 0, water: WATER0, moves: 0, weapon: 'shot1',
      T: null, units: [], proj: [], duds: [], barrels: [], fx: [],
      fused: false, winner: null,
      stats: { shots: 0, shot2: 0, ss: 0, lobs: 0, dudBlasts: 0, chains: 0, strikes: 0, drowned: 0, fallKOs: 0, selfDmg: new Array(teams).fill(0), dmg: new Array(teams).fill(0) },
    };
    const recipe = MapGen.RECIPES[opts.recipe] ? opts.recipe : recipeFor(teams, size), Rc = MapGen.RECIPES[recipe];
    const Z = MapGen.SIZES[opts.mapSize] || MapGen.SIZES[MapGen.sizeFor(spots)];
    const M = MapGen.generate(opts.map || MapGen.roll(recipe, G.seed), { w: Z.w, h: Z.h, seed: G.seed });
    Object.assign(G, { cols: M.w, rows: M.h, map: M.id, mapName: M.name, theme: M.theme, T: M.T, water: M.water, windMul: M.windMul, mirror: M.mirror });
    // where everyone starts: spots spread across the map, each on dry ground and clear of everyone else. 'sides' keeps
    // each side together (side 0 on the left in a two-sided match); 'mixed' deals the spots out one side at a time.
    // With more than two sides the order is shuffled so nobody always gets the same place.
    const order = Array.from({ length: teams }, (_, t) => t);
    if (teams > 2) for (let i = teams - 1; i > 0; i--) { const j = Math.floor(R(G) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let layout = opts.spawn || (opts.map ? 'sides' : Rc.spawn);
    if (layout === 'any') layout = R(G) < 0.5 ? 'sides' : 'mixed';
    if (size === 1 || G.mirror) layout = 'sides';
    const under = opts.under != null ? opts.under : opts.map ? 0 : (Rc.under || 0);
    const mul = opts.hpMul || (size > 1 ? CREW_HP[size] : teams > 2 ? HP_MUL.ffa : HP_MUL.duel);
    const gap = clamp(Math.floor(G.cols * 0.84 / spots * 0.6), 5, 8), n = new Array(teams).fill(0);
    for (let k = 0; k < spots; k++) {
      const t = layout === 'mixed' ? order[k % teams] : order[Math.floor(k / size)], i = n[t]++, ch = charAt(t, i), C = CHARS[ch], hp = Math.round(C.hp * mul);
      let x = Math.round(G.cols * (0.08 + 0.84 * (k + 0.3 + R(G) * 0.4) / spots));
      x = dryLand(G, x, G.units.map((v) => Math.floor(v.x)), gap);
      const mirrored = G.mirror && spots % 2 === 0 && k >= spots / 2;
      if (mirrored) x = G.cols - 1 - Math.floor(G.units[spots - 1 - k].x); // mirror maps mirror the spawns
      const deep = R(G) < under && !mirrored ? floorsAt(G, x).slice(1) : [];
      const y = deep.length ? deep[Math.floor(R(G) * deep.length)] : surfaceY(G, x);
      const own = opts.owners && Number.isInteger(opts.owners[t * size + i]) ? opts.owners[t * size + i] : t;
      G.units.push({ id: ++G._id, team: t, own, char: ch, x: x + 0.5, y, vx: 0, vy: 0, hp, maxHp: hp, alive: true, air: false, face: x < G.cols / 2 ? 1 : -1, delay: 0,
        ammo: { shot1: C.shot1.ammo, shot2: C.shot2.ammo, dud: DUD.ammo }, ss: 0 });
    }
    G.units.sort((a, b) => a.team - b.team || a.x - b.x); // ids stay as made; keep the list grouped by side
    // the map's hazards: barrels, and old live duds (anyone can lob them; they tick from turn 1). None right by a spawn.
    for (const f of M.features) {
      if (G.units.some((u) => Math.abs(u.x - (f.x + 0.5)) < 7)) continue;
      if (f.kind === 'barrel') G.barrels.push({ id: ++G._id, x: f.x + 0.5, y: f.y, air: false, vy: 0 });
      else G.duds.push({ id: ++G._id, x: f.x + 0.5, y: f.y, fuse: f.fuse, team: null, air: false, vy: 0, old: true });
    }
    // who shoots first (a best-of-3 alternates it, since going first is worth a few points);
    // starting delays alternate the teams: first team's unit 1, other team's unit 1, first team's unit 2, ...
    G.first = Number.isInteger(opts.first) && opts.first >= 0 && opts.first < teams ? opts.first : 0;
    for (const u of G.units) { const i = G.units.filter((v) => v.team === u.team).indexOf(u), rank = (u.team - G.first + teams) % teams; u.delay = (i * teams + rank) * START_GAP; }
    const a0 = nextActor(G); G.actor = a0.id; G.team = a0.team;
    G.moves = CHARS[a0.char].steps;
    for (const u of G.units) if (u.team !== G.team) u.ss = 1; // sides that don't shoot first get a one-notch SS head start (first turn wins 58% → 51% in the 1v1 sim)
    chargeSS(G);
    G.wind = rollWind(G);
    return G;
  }
  // the nearest column to x with ground well above the water and 5 cells from a channel's edge (spawns must never land in one),
  // and at least `gap` cells from anyone already placed
  function dryLand(G, x, taken = [], gap = 8) {
    const dry = (c) => c >= 0 && c < G.cols && surfaceY(G, c) < G.water - 4; // the map's own water line (the generator sets it)
    const ok = (c) => c >= 3 && c < G.cols - 3 && dry(c - 5) && dry(c) && dry(c + 5) && taken.every((t) => Math.abs(t - c) >= gap);
    for (let d = 0; d < G.cols; d++) { if (ok(x - d)) return x - d; if (ok(x + d)) return x + d; }
    return x;
  }
  // every floor a unit can stand on in column x, top first: ground with 5 clear cells above it (and beside it), well above the water
  function floorsAt(G, x) {
    const out = [], clear = (c, y) => { for (let k = 1; k <= 5; k++) if (solidAt(G, c, y - k)) return false; return true; };
    for (let y = 1; y < G.water - 4; y++) if (solidAt(G, x, y) && clear(x, y) && clear(x - 1, y) && clear(x + 1, y)) out.push(y);
    return out;
  }
  // One notch of SS charge at the start of each of your turns.
  // Each unit has its own kit: Shot 2 and dud ammo, and its own SS charge.
  function chargeSS(G) { const u = current(G); if (u) u.ss = Math.min(SS_CHARGE, u.ss + 1); }
  // who: a unit, a side (its most-charged living unit), or nothing (the unit whose turn it is)
  const ssOf = (G, who) => { if (who && typeof who === 'object') return who.ss; if (who == null) { const u = current(G); return u ? u.ss : 0; } return Math.max(0, ...teamUnits(G, who).map((u) => u.ss)); };
  const ssReady = (G, who) => ssOf(G, who) >= SS_CHARGE;
  const ammoOf = (G, u = current(G)) => (u ? u.ammo : { shot1: 0, shot2: 0, dud: 0 });
  const owner = (G) => { const u = current(G); return u ? u.own : -1; }; // who controls the unit whose turn it is
  const rollWind = (G) => Math.round((R(G) * 2 - 1) * WIND_MAX * (G.windMul || 1) * 10) / 10; // calm maps halve it, gale maps ×1.6
  const teamUnits = (G, t) => G.units.filter((u) => u.team === t && u.alive);
  function current(G) { return G.units.find((u) => u.id === G.actor && u.alive) || null; }
  // The living unit with the lowest delay goes next. Ties: the team that didn't just play, then the older unit.
  function nextActor(G, lastTeam = -1) {
    let best = null;
    for (const u of G.units) {
      if (!u.alive) continue;
      if (!best || u.delay < best.delay || (u.delay === best.delay && ((best.team === lastTeam && u.team !== lastTeam) || (u.team === best.team && u.id < best.id)))) best = u;
    }
    return best;
  }
  // What this turn will have cost so far if you fire `w` now (or pass): for the UI's turn-order preview.
  function delayIf(G, w) { const u = current(G); if (!u) return 0; return u.delay + G.spent + (w === 'pass' ? DELAY.pass : w === 'lob' ? DELAY.lob : shotSpec(G, u, w).delay); }
  // The coming turns, in order, if every unit's delay stays as it is now (the current unit counted with `extra`).
  function turnOrder(G, extra = 0, n = 6) {
    const live = G.units.filter((u) => u.alive).map((u) => ({ id: u.id, team: u.team, d: u.delay + (u.id === G.actor ? G.spent + extra : 0) }));
    return live.sort((a, b) => a.d - b.d || a.id - b.id).slice(0, n);
  }
  const center = (u) => [u.x, u.y - UNIT_R];
  const charOf = (G, t) => CHARS[G.chars[t]];
  // The full spec of a weapon: { name, r, dmg, wind, speed, ... } with defaults filled in. who: a unit, a character id,
  // or a side (its lead character).
  function shotSpec(G, who, w) {
    const C = who && typeof who === 'object' ? CHARS[who.char] : CHARS[who] || charOf(G, who);
    const s = w === 'dud' ? DUD : C[w];  // shot1 | shot2 | ss
    return Object.assign({ wind: 1, speed: 1, knock: 1 }, s);
  }

  // ---------- flight ----------
  // angle in degrees, 0 = right, 90 = straight up. power 0..1.
  function launch(u, angle, power, speedMul = 1) {
    const a = angle * Math.PI / 180, s = clamp(power, 0.05, 1) * VMAX * speedMul;
    const [cx, cy] = center(u);
    const ox = Math.cos(a), oy = -Math.sin(a);
    return { x: cx + ox * (UNIT_R + 0.6), y: cy + oy * (UNIT_R + 0.6), vx: ox * s, vy: oy * s };
  }
  const subSteps = (p) => Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy) * TICK / 0.5));
  function unitHit(G, p, ignoreId) {
    for (const u of G.units) {
      if (!u.alive || u.id === ignoreId) continue;
      const [cx, cy] = center(u), dx = p.x - cx, dy = p.y - cy;
      if (dx * dx + dy * dy <= (UNIT_R + 0.3) * (UNIT_R + 0.3)) return u.id;
    }
    return 0;
  }
  // One sub-step for anything ballistic, including bounce and drill. Shared by the real game (real = true:
  // drills carve) and the bots' aim prediction (real = false: the ground is left alone, but the path is the same).
  // Returns null while flying, or 'ground' | 'unit' | 'water' | 'out' when it lands.
  function advance(G, p, dt, ignoreId, real) {
    const px = p.x, py = p.y;
    p.vx += G.wind * (p.wm == null ? 1 : p.wm) * dt; p.vy += GRAV * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < -4 || p.x > G.cols + 4) return 'out';
    if (p.y >= G.water) return 'water';
    const hu = unitHit(G, p, ignoreId);
    if (hu) { p.hitUnit = hu; return 'unit'; }
    // Drill: from the first touch of ground it bores on for p.drill cells (ground or not), then explodes.
    // Counting distance, not solid cells, keeps the real path and the bots' prediction identical.
    if (p.drilled || (p.drill > 0 && solidAt(G, p.x, p.y))) {
      p.drilled = true; p.drill -= Math.hypot(p.x - px, p.y - py);
      if (real && solidAt(G, p.x, p.y)) carve(G, p.x, p.y, 1.3);
      return p.drill > 0 ? null : 'ground';
    }
    if (!solidAt(G, p.x, p.y)) return null;
    if (p.bounce > 0) { // bounce: off a wall sideways, otherwise off the floor
      p.bounce--;
      if (solidAt(G, p.x, py) && !solidAt(G, px, p.y)) { p.vx = -p.vx * 0.6; p.vy *= 0.8; } else { p.vy = -Math.abs(p.vy) * 0.55; p.vx *= 0.8; }
      p.x = px; p.y = py; p.bounced = true;
      return null;
    }
    return 'ground';
  }
  function newShot(G, u, w, angle, power, team) {
    const s = shotSpec(G, u, w);
    const p = Object.assign(launch(u, angle, power, s.speed), { id: ++G._id, w, team, char: u.char, from: u.id, age: 0, wm: s.wind });
    if (s.bounce) p.bounce = s.bounce;
    if (s.drill) p.drill = s.drill;
    if (w === 'dud') p.fuse = DUD.fuse;
    return p;
  }

  // ---------- blasts ----------
  function explode(G, x, y, r, dmg, byTeam, kind, knockMul = 1) {
    carve(G, x, y, r);
    const reach = r * DMG_SPREAD;
    for (const u of G.units) {
      if (!u.alive) continue;
      const [cx, cy] = center(u); const d = Math.hypot(cx - x, cy - y);
      if (d > reach) continue;
      const k = 1 - d / reach;
      hurt(G, u, Math.round(dmg * k * CHARS[u.char].armor), byTeam);
      const nx = d > 0.01 ? (cx - x) / d : 0, ny = d > 0.01 ? (cy - y) / d : -1;
      u.vx += nx * KNOCK * k * knockMul; u.vy += (ny - 0.6) * KNOCK * k * knockMul; u.air = true;
    }
    G.fx.push({ k: 'boom', x, y, r, kind });
    // live duds caught in a blast go off too: chain reactions
    for (const d of G.duds) if (!d.gone && Math.hypot(d.x - x, d.y - y) <= r + 1.5) d.chain = true;
    for (const p of G.proj) if (p.w === 'dud' && !p.gone && Math.hypot(p.x - x, p.y - y) <= r + 1.5) p.chain = true;
    for (const b of G.barrels) if (!b.gone && Math.hypot(b.x - x, b.y - 1 - y) <= r + 1.5) b.chain = true;
    // anything standing on carved ground may now fall
    for (const u of G.units) if (u.alive && !supported(G, u)) u.air = true;
    for (const d of G.duds) if (!d.gone && !solidAt(G, d.x, d.y + 0.6)) d.air = true;
    for (const b of G.barrels) if (!b.gone && !solidAt(G, b.x, b.y + 0.6)) b.air = true;
  }
  function hurt(G, u, hit, byTeam) {
    if (hit <= 0 || !u.alive) return;
    u.hp -= hit;
    if (byTeam != null) { if (byTeam === u.team) G.stats.selfDmg[byTeam] += hit; else G.stats.dmg[byTeam] += hit; }
    if (u.hp <= 0) ko(G, u, 'blast');
  }
  // Thunderstrike: lightning straight down at x hits every unit within w cells sideways, whatever is above them.
  function strike(G, x, w, dmg, byTeam) {
    G.stats.strikes++;
    const hits = [];
    for (const u of G.units) {
      if (!u.alive || Math.abs(u.x - x) > w) continue;
      hurt(G, u, Math.round(dmg * CHARS[u.char].armor), byTeam); hits.push(u.id);
    }
    G.fx.push({ k: 'bolt', x, hits });
  }
  function ko(G, u, why) {
    if (!u.alive) return; u.alive = false; u.hp = 0; u.why = why;
    if (why === 'water') G.stats.drowned++; if (why === 'fall') G.stats.fallKOs++;
    G.fx.push({ k: 'ko', id: u.id, x: u.x, y: u.y, why });
  }
  const supported = (G, u) => solidAt(G, u.x, u.y + 0.05) || solidAt(G, u.x - 0.6, u.y + 0.05) || solidAt(G, u.x + 0.6, u.y + 0.05);

  // ---------- the physics tick ----------
  function step(G) {
    G.fx = [];
    if (G.phase !== 'flight') return G.fx;
    for (const p of G.proj) {
      if (p.gone) continue;
      if (p.wait > 0) { p.wait--; continue; } // the second shot of a Double Tap
      if (p.chain) { p.gone = true; blowDud(G, p); continue; }
      const n = subSteps(p);
      for (let i = 0; i < n && !p.gone; i++) {
        const hit = advance(G, p, TICK / n, p.age < 6 ? p.from : -1, true);
        if (!hit) continue;
        p.gone = true;
        if (hit === 'water' || hit === 'out') { G.fx.push({ k: hit === 'water' ? 'splash' : 'lost', x: p.x, y: Math.min(p.y, G.water) }); break; }
        land(G, p);
      }
      p.age = (p.age || 0) + 1;
    }
    G.proj = G.proj.filter((p) => !p.gone);
    for (const d of G.duds) { // resting or falling duds
      if (d.gone) continue;
      if (d.chain || d.fuseOut) { if (d.chain) G.stats.chains++; blowDud(G, d); continue; }
      if (!d.air) continue;
      d.vy = (d.vy || 0) + GRAV * TICK; d.y += d.vy * TICK;
      if (d.y >= G.water) { d.gone = true; G.fx.push({ k: 'splash', x: d.x, y: G.water }); continue; }
      if (solidAt(G, d.x, d.y + 0.6)) { while (solidAt(G, d.x, d.y + 0.5) && d.y > 0) d.y -= 0.25; d.vy = 0; d.air = false; }
    }
    G.duds = G.duds.filter((d) => !d.gone);
    for (const b of G.barrels) { // barrels: blow when a blast reached them, fall when the ground under them goes
      if (b.gone) continue;
      if (b.chain) { b.gone = true; G.stats.barrels = (G.stats.barrels || 0) + 1; explode(G, b.x, b.y - 1, BARREL.r, BARREL.dmg, null, 'barrel'); continue; }
      if (!b.air) continue;
      b.vy += GRAV * TICK; b.y += b.vy * TICK;
      if (b.y >= G.water) { b.gone = true; G.fx.push({ k: 'splash', x: b.x, y: G.water }); continue; }
      if (solidAt(G, b.x, b.y + 0.6)) { while (solidAt(G, b.x, b.y + 0.5) && b.y > 0) b.y -= 0.25; b.vy = 0; b.air = false; }
    }
    G.barrels = G.barrels.filter((b) => !b.gone);
    for (const u of G.units) if (u.alive && u.air) unitPhysics(G, u);
    if (!G.proj.length && !G.units.some((u) => u.alive && u.air) && !G.duds.some((d) => d.air || d.chain || d.fuseOut) && !G.barrels.some((b) => b.air || b.chain)) settle(G);
    return G.fx;
  }
  function land(G, p) {
    if (p.w === 'dud') { // back off out of the ground, then rest there ticking
      let x = p.x - p.vx * TICK * 0.5, y = p.y - p.vy * TICK * 0.5, g = 0;
      while (solidAt(G, x, y) && g++ < 40) y -= 0.25;
      const d = { id: p.dudId || ++G._id, x, y, fuse: p.fuse, team: p.team, air: !solidAt(G, x, y + 0.6), vy: 0 };
      G.duds.push(d); G.fx.push({ k: 'dud', id: d.id, x, y, fuse: d.fuse });
      return;
    }
    const s = shotSpec(G, p.char || p.team, p.w);
    explode(G, p.x, p.y, s.r, s.dmg, p.team, p.w === 'ss' ? 'ss' : p.w === 'shot2' ? (p.char || G.chars[p.team]) : 'shot', s.knock);
    if (s.strike) strike(G, p.x, s.strike.w, s.strike.dmg, p.team);
    if (s.storm) for (const dx of [0, -s.storm.gap, s.storm.gap]) strike(G, p.x + dx, s.storm.w, s.storm.dmg, p.team);
    if (s.quake) { // every enemy standing on the ground takes damage and is bounced up a little
      const hits = [];
      for (const u of G.units) if (u.alive && u.team !== p.team && !u.air) { hurt(G, u, Math.round(s.quake.dmg * CHARS[u.char].armor), p.team); u.vy = -9; u.air = true; hits.push(u.id); }
      G.fx.push({ k: 'quake', x: p.x, hits });
    }
    if (s.tornado) { // fling everyone in reach away from the centre (own crew too)
      const T = s.tornado, hits = [];
      for (const u of G.units) {
        if (!u.alive) continue; const [cx, cy] = center(u), d = Math.hypot(cx - p.x, cy - p.y); if (d > T.reach) continue;
        const k = 1 - d / T.reach, dir = cx >= p.x ? 1 : -1;
        hurt(G, u, Math.round(T.dmg * k * CHARS[u.char].armor), p.team);
        u.vx += dir * (T.push * k + 8); u.vy -= 26 * k + 10; u.air = true; hits.push(u.id);
      }
      G.fx.push({ k: 'tornado', x: p.x, y: p.y, hits });
    }
  }
  function blowDud(G, d) { d.gone = true; G.stats.dudBlasts++; explode(G, d.x, d.y, DUD.r, DUD.dmg, null, 'dud'); }
  function unitPhysics(G, u) {
    u.vy += GRAV * TICK;
    const n = Math.max(1, Math.ceil(Math.hypot(u.vx, u.vy) * TICK / 0.4));
    for (let i = 0; i < n; i++) {
      const nx = u.x + u.vx * TICK / n, ny = u.y + u.vy * TICK / n;
      if (!solidAt(G, nx, ny - UNIT_R) && !solidAt(G, nx, ny - 0.2)) u.x = nx; else u.vx = 0;
      if (u.vy < 0) { if (!solidAt(G, u.x, ny - UNIT_R * 2)) u.y = ny; else u.vy = 0; }
      else if (solidAt(G, u.x, ny)) { // landed
        while (solidAt(G, u.x, u.y - 0.01) && u.y > 0) u.y -= 0.25;
        const v = u.vy; u.vy = 0; u.vx = 0; u.air = false;
        if (v > SAFE_FALL) { u.hp -= Math.round((v - SAFE_FALL) * FALL_DMG); if (u.hp <= 0) ko(G, u, 'fall'); }
        break;
      } else u.y = ny;
    }
    if (u.alive && (u.y >= G.water)) ko(G, u, 'water');
    if (u.alive && (u.x < 0 || u.x >= G.cols)) ko(G, u, 'out');
  }

  // ---------- turns ----------
  function settle(G) {
    if (!G.fused) {
      G.fused = true;
      let boom = false;
      for (const d of G.duds) { d.fuse--; if (d.fuse <= 0) { d.fuseOut = true; boom = true; } }
      if (boom) return; // let the blasts play out, then settle again
    }
    checkWin(G);
    if (G.phase === 'over') return;
    nextTurn(G);
  }
  function checkWin(G) {
    const alive = []; for (let t = 0; t < G.teams; t++) if (teamUnits(G, t).length) alive.push(t);
    if (alive.length > 1) return;
    G.phase = 'over'; G.winner = alive.length ? alive[0] : -1; // -1 = draw
    G.fx.push({ k: 'over', winner: G.winner });
  }
  function nextTurn(G) {
    const was = G.units.find((u) => u.id === G.actor); if (was) was.delay += G.spent;
    G.spent = 0;
    G.turn++;
    if (G.turn >= suddenTurn(G)) {
      G.water = Math.max(4, G.water - Math.max(SUDDEN_RISE, Math.round(SUDDEN_RISE * G.rows / ROWS)));
      for (const u of G.units) if (u.alive && u.y >= G.water) ko(G, u, 'water');
      for (const d of G.duds) if (d.y >= G.water) d.gone = true;
      G.duds = G.duds.filter((d) => !d.gone);
      G.barrels = G.barrels.filter((b) => b.y < G.water);
      checkWin(G); if (G.phase === 'over') return;
    }
    if (G.turn >= maxTurns(G)) { // a stalemate nobody can break: the side with more health left (as a share) wins
      const hp = Array.from({ length: G.teams }, (_, t) => teamUnits(G, t).reduce((a, u) => a + u.hp / u.maxHp, 0)), top = Math.max(...hp);
      G.phase = 'over'; G.winner = hp.filter((h) => h === top).length > 1 ? -1 : hp.indexOf(top); G.timeout = true; return;
    }
    const nx = nextActor(G, was ? was.team : -1); G.actor = nx.id; G.team = nx.team;
    G.phase = 'aim'; G.moves = CHARS[nx.char].steps; G.fused = false; G.weapon = 'shot1';
    chargeSS(G);
    G.wind = rollWind(G);
    G.fx.push({ k: 'turn', team: G.team, turn: G.turn });
  }

  // ---------- moving in the aim phase ----------
  function walk(G, u, dir) {
    const nx = u.x + dir, climb = CHARS[u.char].climb;
    if (nx < 0.5 || nx > G.cols - 0.5) return false;
    let ny = u.y, k = 0; // climb up to `climb` cells, or step down
    while (solidAt(G, nx, ny - 0.01) && k <= climb) { ny -= 1; k++; }
    if (k > climb) return false;                       // a wall
    if (solidAt(G, nx, ny - UNIT_R * 2)) return false; // no headroom
    u.x = nx; u.y = ny; u.face = dir;
    if (!supported(G, u)) { u.air = true; u.vx = 0; u.vy = 0; dropNow(G, u); } // step off a ledge (fall damage counts)
    return true;
  }
  function dropNow(G, u) { let g = 0; while (u.alive && u.air && g++ < 600) unitPhysics(G, u); }

  // ---------- actions: the one way to change a game ----------
  //   { k: 'move', dir: -1|1 }                   walk one cell (the character's steps a turn)
  //   { k: 'weapon', w: 'shot1'|'shot2'|'dud' }  pick a shot
  //   { k: 'fire', angle, power }                 fire it (angle in degrees, 0 = right, 90 = up)
  //   { k: 'lob', dud, angle, power }             pick up a live dud within LOB_RANGE and throw it
  //   { k: 'pass' }                               end the turn without shooting (the UI's turn timer sends this)
  //   step(G) while phase === 'flight'            the clock, not a player action
  function act(G, it) {
    if (!it || typeof it !== 'object' || G.phase !== 'aim') return false;
    const u = current(G); if (!u) return false;
    switch (it.k) {
      case 'move': {
        if (G.moves <= 0 || (it.dir !== 1 && it.dir !== -1)) return false;
        if (!walk(G, u, it.dir)) return false;
        G.moves--; G.spent += DELAY.move;
        if (!u.alive) G.phase = 'flight'; // walked into the water: end the turn
        return true;
      }
      case 'weapon': {
        if (WEAPON_IDS.indexOf(it.w) < 0) return false;
        if (it.w === 'ss' ? !ssReady(G) : u.ammo[it.w] === 0) return false;
        G.weapon = it.w; return true;
      }
      case 'fire': {
        if (!Number.isFinite(it.angle) || !Number.isFinite(it.power)) return false;
        const w = G.weapon, am = u.ammo;
        if (w === 'ss') { if (!ssReady(G)) return false; u.ss = 0; G.stats.ss++; }
        else { if (am[w] === 0) return false; if (am[w] > 0) am[w]--; }
        const sp = shotSpec(G, u, w);
        G.spent += sp.delay;
        if (sp.rain) { // Bullet Rain: a fan of darts, one after another
          const n = sp.rain.n;
          for (let i = 0; i < n; i++) { const q = newShot(G, u, w, it.angle + (i - (n - 1) / 2) * sp.rain.spread, it.power * (1 - 0.015 * i), G.team); q.wait = i * 7; G.proj.push(q); }
          G.stats.shots++; u.face = Math.cos(it.angle * Math.PI / 180) >= 0 ? 1 : -1; G.phase = 'flight'; return true;
        }
        const p = newShot(G, u, w, it.angle, it.power, G.team);
        G.proj.push(p); G.stats.shots++; if (w === 'shot2') G.stats.shot2++;
        if (sp.double) { // Double Tap: a second dart a third of a second later
          const q = newShot(G, u, w, it.angle, it.power * 0.96, G.team); q.wait = 20; G.proj.push(q);
        }
        u.face = Math.cos(it.angle * Math.PI / 180) >= 0 ? 1 : -1;
        G.phase = 'flight'; return true;
      }
      case 'lob': {
        if (!Number.isFinite(it.angle) || !Number.isFinite(it.power)) return false;
        const d = G.duds.find((x) => x.id === it.dud && !x.air);
        if (!d || !canLob(G, u, d)) return false;
        G.duds = G.duds.filter((x) => x !== d);
        const p = Object.assign(launch(u, it.angle, Math.min(it.power, 1) * LOB_POWER), { id: ++G._id, w: 'dud', dudId: d.id, fuse: d.fuse, team: G.team, from: u.id, age: 0, wm: 1 });
        G.proj.push(p); G.stats.lobs++; G.spent += DELAY.lob;
        G.phase = 'flight'; return true;
      }
      case 'pass': G.spent += DELAY.pass; G.phase = 'flight'; return true;
      default: return false;
    }
  }
  function canLob(G, u, d) { const [cx, cy] = center(u); return Math.hypot(d.x - cx, d.y - cy) <= LOB_RANGE; }
  const lobbable = (G) => { const u = current(G); return u && G.phase === 'aim' ? G.duds.filter((d) => !d.air && canLob(G, u, d)) : []; };

  // Run the clock until the turn settles (for bots, the sim and tests). Returns the ticks used.
  function resolve(G, maxTicks = 20000) {
    let n = 0; while (G.phase === 'flight' && n++ < maxTicks) step(G);
    if (G.phase === 'flight') throw new Error('stuck in flight at turn ' + G.turn);
    return n;
  }

  // ---------- aim prediction (the same advance() the game uses, without changing the ground) ----------
  function predict(G, u, angle, power, w = 'shot1', team = u.team, maxTicks = 900) {
    const s = shotSpec(G, u, w);
    const p = Object.assign(launch(u, angle, power, s.speed), { wm: s.wind, bounce: s.bounce || 0, drill: s.drill || 0 });
    let t = 0;
    while (t++ < maxTicks) {
      const n = subSteps(p);
      for (let i = 0; i < n; i++) { const hit = advance(G, p, TICK / n, t < 6 ? u.id : -1, false); if (hit) return { x: p.x, y: p.y, hit, t, unit: p.hitUnit || null }; }
    }
    return { x: p.x, y: p.y, hit: 'timeout', t };
  }
  // Same falloff as explode() (with armour), without changing anything.
  function blastScore(G, x, y, r, dmg, team) {
    const reach = r * DMG_SPREAD; let mine = 0, theirs = 0;
    for (const u of G.units) { if (!u.alive) continue; const [cx, cy] = center(u); const d = Math.hypot(cx - x, cy - y); if (d > reach) continue; const h = Math.min(u.hp, dmg * (1 - d / reach) * CHARS[u.char].armor); if (u.team === team) mine += h; else theirs += h; }
    return { mine, theirs };
  }

  // ---------- bots (for the sim; later a "vs bot" mode) ----------
  // Bots read only what a player sees: the map, the units, the wind and the live duds.
  // style: smart (good aim, uses everything) · sloppy (few tries, shaky hands) · nodud (smart, never fires or lobs duds)
  // · duder (smart, loves duds: shows whether the mechanic is too strong).
  const STYLES = {
    smart:  { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, dud: 1, lob: 1, dodge: 1 },
    sloppy: { tries: 10, refine: 0,  noiseA: 5.0, noiseP: 0.07,  dud: 1, lob: 1, dodge: 0 },
    nodud:  { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, dud: 0, lob: 0, dodge: 1 },
    duder:  { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, dud: 2.2, lob: 1, dodge: 1 },
    // the computer opponents in 1 Player mode
    easy:   { tries: 8,  refine: 0,  noiseA: 7.5, noiseP: 0.10,  dud: 0.6, lob: 0, dodge: 0, ssSkip: 0.5 },
    medium: { tries: 18, refine: 6,  noiseA: 3.2, noiseP: 0.04,  dud: 1, lob: 1, dodge: 1 },
    hard:   { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, dud: 1, lob: 1, dodge: 1 },
  };
  function botRng(G) { let s = (G.seed ^ Math.imul(G.turn + 1, 2654435761)) >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => (r() + r() + r() - 1.5) * 1.15;

  // Score a landing spot for `team` with weapon w (from the bot's point of view).
  function scoreLanding(G, land, w, team, fuse, char) {
    if (land.hit === 'water' || land.hit === 'out' || land.hit === 'timeout') return -1;
    if (w === 'dud') { // a dud is a threat over time, minus the risk it gets lobbed back
      const s = blastScore(G, land.x, land.y, DUD.r, DUD.dmg, team);
      const sure = fuse <= 1 ? 1 : fuse === 2 ? 0.55 : 0.4;
      return sure * s.theirs - 1.4 * s.mine;
    }
    const S = shotSpec(G, char || team, w);
    const s = blastScore(G, land.x, land.y, S.r, S.dmg, team);
    let sc = s.theirs - 1.4 * s.mine;
    if (S.double) sc *= 1.8;
    if (S.strike) for (const u of G.units) if (u.alive && Math.abs(u.x - land.x) <= S.strike.w) sc += (u.team === team ? -1.4 : 1) * Math.min(u.hp, S.strike.dmg * CHARS[u.char].armor);
    if (S.knock > 1) for (const u of G.units) { // a big push near the water or a cliff is worth a lot
      if (!u.alive) continue; const [cx, cy] = center(u); if (Math.hypot(cx - land.x, cy - land.y) > S.r * DMG_SPREAD) continue;
      if (G.water - u.y < 14 || u.x < 10 || u.x > G.cols - 10) sc += (u.team === team ? -1.4 : 1) * 0.6 * u.hp;
    }
    if (S.rain) sc *= 3.2;
    if (S.storm) for (const dx of [0, -S.storm.gap, S.storm.gap]) for (const u of G.units) if (u.alive && Math.abs(u.x - land.x - dx) <= S.storm.w) sc += (u.team === team ? -1.4 : 1) * Math.min(u.hp, S.storm.dmg * CHARS[u.char].armor);
    if (S.quake) for (const u of G.units) if (u.alive && u.team !== team) sc += Math.min(u.hp, S.quake.dmg * CHARS[u.char].armor);
    if (S.tornado) for (const u of G.units) {
      if (!u.alive) continue; const [cx, cy] = center(u), d = Math.hypot(cx - land.x, cy - land.y); if (d > S.tornado.reach) continue;
      const k = 1 - d / S.tornado.reach, risky = G.water - u.y < 16 || u.x < 14 || u.x > G.cols - 14;
      sc += (u.team === team ? -1.4 : 1) * (Math.min(u.hp, S.tornado.dmg * k) + (risky ? 0.7 * u.hp * k : 0));
    }
    if (land.unit && G.units.find((x) => x.id === land.unit).team !== team) sc += 4;
    return sc;
  }
  function bestShot(G, u, w, st, rnd, fuse, powerCap = 1) {
    const enemies = G.units.filter((x) => x.alive && x.team !== u.team);
    let best = { score: -Infinity };
    const tryOne = (angle, power) => {
      power = clamp(power, 0.1, 1) * powerCap;
      const land = predict(G, u, angle, power, w);
      const sc = scoreLanding(G, land, w, u.team, fuse, u.char);
      if (sc > best.score) best = { score: sc, angle, power: power / powerCap };
    };
    for (let i = 0; i < st.tries; i++) {
      const e = enemies[Math.floor(rnd() * enemies.length)] || enemies[0];
      const right = !e || e.x >= u.x;
      tryOne(right ? 10 + rnd() * 75 : 95 + rnd() * 75, 0.3 + rnd() * 0.7);
    }
    for (let i = 0; i < st.refine && best.angle != null; i++) tryOne(best.angle + gauss(rnd) * 4, best.power + gauss(rnd) * 0.06);
    return best;
  }
  // Would one step this way be safe? The same checks as walk(), plus where the unit would end up: not in the water, not a long drop.
  function safeStep(G, u, dir) {
    const nx = u.x + dir, climb = CHARS[u.char].climb; if (nx < 2 || nx > G.cols - 2) return false;
    let ny = u.y, k = 0; while (solidAt(G, nx, ny - 0.01) && k <= climb) { ny -= 1; k++; }
    if (k > climb || solidAt(G, nx, ny - UNIT_R * 2)) return false;
    let drop = 0; while (!solidAt(G, nx, ny + drop + 0.05) && ny + drop < G.water) drop++;
    return ny + drop < G.water - 3 && drop <= 7;
  }
  // One full bot turn: sends its intents through act() and returns them.
  function botTurn(G, style) {
    const st = STYLES[style] || STYLES.smart, rnd = botRng(G), u = current(G); if (!u) return [];
    const sent = [];
    const send = (it) => { if (act(G, it)) sent.push(it); return G.phase; };
    if (st.dodge) { // a live dud about to blow next to us and nothing to lob it with: walk away from it
      const near = G.duds.find((d) => d.fuse <= 1 && Math.hypot(d.x - u.x, d.y - u.y) < DUD.r * DMG_SPREAD);
      if (near && !(st.lob && canLob(G, u, near))) { const dir = u.x < near.x ? -1 : 1; for (let i = 0; i < 30 && G.phase === 'aim'; i++) if (!act(G, { k: 'move', dir })) break; else sent.push({ k: 'move', dir }); }
      if (G.phase !== 'aim') return sent;
    }
    const opts = [];
    let s1 = bestShot(G, u, 'shot1', st, rnd, 0);
    if (!(s1.score > 0) && G.cols > COLS) { // big maps: nobody in reach, so walk towards the nearest enemy first (never into the water or off a cliff)
      const foe = G.units.filter((x) => x.alive && x.team !== u.team).sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
      if (foe) { const dir = foe.x > u.x ? 1 : -1; while (G.phase === 'aim' && G.moves > 0 && Math.abs(foe.x - u.x) > 20 && safeStep(G, u, dir) && act(G, { k: 'move', dir })) sent.push({ k: 'move', dir }); }
      if (G.phase !== 'aim') return sent;
      s1 = bestShot(G, u, 'shot1', st, rnd, 0);
    }
    opts.push({ w: 'shot1', ...s1 });
    if (ssReady(G) && !(st.ssSkip && rnd() < st.ssSkip)) { const x = bestShot(G, u, 'ss', st, rnd, 0); opts.push({ w: 'ss', ...x }); }
    if (u.ammo.shot2 !== 0) { const c = bestShot(G, u, 'shot2', st, rnd, 0); opts.push({ w: 'shot2', ...c, score: c.score * 1.05 }); }
    if (st.dud && u.ammo.dud !== 0) { const d = bestShot(G, u, 'dud', st, rnd, DUD.fuse); opts.push({ w: 'dud', ...d, score: d.score * st.dud }); }
    if (st.lob) for (const d of lobbable(G)) {
      const b = bestShot(G, u, 'dud', st, rnd, d.fuse - 1 <= 0 ? 1 : d.fuse, LOB_POWER);
      const here = blastScore(G, d.x, d.y, DUD.r, DUD.dmg, u.team); // getting a dud away from our own units is worth something
      opts.push({ lob: d.id, ...b, score: b.score + here.mine * (d.fuse <= 1 ? 1.2 : 0.5) });
    }
    // turn delay: a heavier shot has to be worth the turns it gives away (about 2 points of damage per 100 delay)
    for (const o of opts) o.score -= 0.02 * (o.lob ? DELAY.lob : shotSpec(G, u, o.w).delay);
    opts.sort((a, b) => b.score - a.score);
    const o = opts[0];
    if (!o || o.angle == null) { send({ k: 'pass' }); return sent; }
    const angle = o.angle + gauss(rnd) * st.noiseA, power = clamp(o.power + gauss(rnd) * st.noiseP, 0.05, 1);
    if (o.lob) send({ k: 'lob', dud: o.lob, angle, power });
    else { if (o.w !== 'shot1') send({ k: 'weapon', w: o.w }); send({ k: 'fire', angle, power }); }
    if (G.phase === 'aim') send({ k: 'pass' });
    return sent;
  }

  // Play a whole match with one bot style per team. Returns the finished game and its intent log.
  function playOut(G, styles) {
    const log = []; let guard = 0;
    while (G.phase !== 'over' && guard++ < maxTurns(G) + 5) {
      const its = botTurn(G, styles[G.team]); log.push(...its);
      resolve(G);
    }
    if (G.phase !== 'over') throw new Error('match did not finish');
    return { G, log };
  }

  // ---------- checksum and replay ----------
  function hash(G) {
    const r = (v) => Math.round(v * 100);
    const parts = [G.map, G.cols, G.turn, G.team, G.actor, G.spent, G.units.map((u) => u.delay).join(','), G.phase, r(G.wind), G.water, G.moves, G.winner, G.chars.join(','),
      G.units.map((u) => `${u.id}:${r(u.x)},${r(u.y)},${u.hp},${u.alive ? 1 : 0}`).join(';'),
      G.duds.map((d) => `${d.id}:${r(d.x)},${r(d.y)},${d.fuse}`).join(';'), G.barrels.map((b) => `${b.id}:${r(b.x)},${r(b.y)}`).join(';'),
      G.units.map((u) => `${u.char},${u.ammo.shot2},${u.ammo.dud},${u.ss}`).join(';'), G.T.join('')];
    let h = 2166136261; const s = parts.join('|');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(16);
  }
  // Replay: same seed + options + intents = same game.
  function replay(seed, log, opts) {
    const G = newGame(seed, opts);
    for (const it of log) { if (G.phase === 'flight') resolve(G); if (!act(G, it)) throw new Error('replay: intent refused ' + JSON.stringify(it)); }
    if (G.phase === 'flight') resolve(G);
    return G;
  }

  const WB = { TICK, COLS, ROWS, WATER0, GRAV, VMAX, WIND_MAX, UNIT_R, UNITS_PER_TEAM, HP, MOVE_STEPS, LOB_RANGE, LOB_POWER, SUDDEN_ROUNDS, MAX_ROUNDS, suddenTurn, maxTurns, DMG_SPREAD, SS_CHARGE, DELAY, HP_MUL, CREW_HP,
    MAX_TEAMS, MAX_SIZE, MAX_UNITS, DUD, BARREL, CHARS, CHAR_IDS, WEAPON_IDS, MAPS, MAP_IDS, pickMap, recipeFor, MapGen, STYLES, newGame, act, step, resolve, current, owner, teamUnits, charOf, shotSpec, ssReady, ssOf, ammoOf, safeStep, turnOrder, delayIf, solidAt, surfaceY, center, lobbable, canLob,
    predict, blastScore, botTurn, playOut, hash, replay };
  if (typeof module !== 'undefined' && module.exports) module.exports = WB; else root.WB = WB;
})(typeof window !== 'undefined' ? window : globalThis);
