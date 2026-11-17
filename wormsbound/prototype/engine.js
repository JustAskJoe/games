/* Wormsbound (working title) · Prototype 1 engine.
   © 2026 justaskjoe. All rights reserved.

   Pure game logic, no DOM. Runs in the browser as window.WB and in node (sim.js, test.js).
   - Seeded RNG whose state lives in G._s, so G is plain JSON (save = JSON.stringify(G)).
   - Every player input is an intent through act(G, intent). The UI, the bots and (later) online play all use it,
     so seed + intent log replays a match exactly. hash(G) is a checksum for spotting drift.
   - Fixed-step physics at 60 ticks a second while anything is flying or falling (phase 'flight').

   Each team picks characters (CHARS) before the match. A character sets its units' six stats (health, armour, power,
   move, jump, weight) and its kit (v3, Nov 17, 2026): a passive that is always on, a basic shot (unlimited), an
   ability and a move ability (each on a cooldown counted in that unit's own turns) and an ultimate, the SS, which
   charges one notch per turn of yours and is ready every SS_CHARGE turns. Nothing runs out: it just isn't ready.
   The idea of characters with their own shots comes from GunBound; the characters, names and kits here are our own.

   The map is a grid of terrain cells built by mapgen.js (0 = air; 1 ground, 3 and 4 props: breakable; 2 hard rock:
   blasts can't break it). Units, shells, duds and barrels move in cell units, y pointing down.
   Turn flow: aim (walk, jump, use the move ability, pick a shot, fire, or pass) → flight (step() until everything
   settles) → a short retreat (walk with what's left of a third of your movement, or pass) → old duds on the map tick
   down one → the next turn, with new wind. Jumps and move abilities fly too, then hand the turn back. Last team standing wins.

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
  const JUMP = { cost: 3, vx: 7, vy: 17 }; // a jump: costs 3 steps of movement; about 5 cells up and 8 along (× the character's jump stat for height)
  const RETREAT = 1 / 3;        // after firing you may still walk: what's left of your movement, up to this share of it
  const BURN = 6;               // Flint's burn: damage at the start of each of the target's next two turns
  // The Relic (v3): one a round. It lands in the middle once everyone has had about three turns; it has health; whoever
  // lands the last hit takes it for their side: a notch of SS for every unit, and more Power for the rest of the round.
  const RELIC = { rounds: 3, hp: 70, r: 2, ss: 1, power: 1.1 };
  const DASH_DELAY = 150;       // turn delay a move ability adds unless it says otherwise
  const SUDDEN_ROUNDS = 12;     // after this many rounds (a round = one turn per side) the water rises
  const SUDDEN_RISE = 2;        // rows per turn
  const MAX_ROUNDS = 40;        // hard stop (the rising water should end it well before this)
  // a round is one turn per side; bigger crews get more turns before the water rises (2 a side: ×1.35 ... 5 a side: ×2.4)
  const crewTurns = (G) => G.teams * (1 + 0.35 * ((G.size || 1) - 1));
  const suddenTurn = (G) => Math.round(SUDDEN_ROUNDS * crewTurns(G)), maxTurns = (G) => Math.round(MAX_ROUNDS * crewTurns(G));
  const DMG_SPREAD = 1.6;       // damage falls off to 0 at r × 1.6
  const SS_CHARGE = 4;          // the SS is ready on your 4th turn, then every 4th turn after you use it
  // Turn delay: what each action adds to the acting unit's delay (shots carry their own `delay`).
  const DELAY = { move: 12, pass: 520, jump: 40 };
  // Health scale by format: characters' hp numbers are for a crew of two; one unit a side needs more to last.
  const HP_MUL = { duel: 2.6, ffa: 1.8, crew: 1 };
  const CREW_HP = [0, 0, 1.5, 1.25, 1.05, 0.9]; // by units a side (2 to 5): small crews need a bit more health each
  // Supply crates (v2): the middle of a match. One lands between the sides once everyone has had a turn, then every
  // few turns. Walk onto it to open it; a blast destroys it, so you can deny one instead. What's inside shows on the crate.
  const CRATE = { max: 3, reach: 2.2, heal: 0.25, ss: 2, r: 1.5 };
  const CRATE_KINDS = ['cool', 'ss', 'heal']; // cool: ability and move ability ready now · ss: +2 notches · heal: +25% health
  const crateFirst = (G) => G.units.length, crateEvery = (G) => Math.max(3, Math.round(G.units.length * 0.75));
  const START_GAP = 10;         // starting delays alternate teams 0, 10, 20, 30 so the first round goes A B A B

  // Old duds: a map hazard (nobody fires or throws them any more). They tick down each turn and go off; a blast sets them off early.
  const DUD = { name: 'Old dud', r: 6, dmg: 60, fuse: 3 };

  // Shot fields: r crater, dmg centre damage, wind (× wind push), speed (× launch speed), knock (× knockback, negative
  // pulls), bounce (bounces off the ground first), drill (cells it tunnels through), strike (lightning: {w, dmg}),
  // double (a second shot follows), delay (turn delay it adds: heavier = your next turn later), cd (cooldown in the
  // owner's own turns), rain (a fan of shots), storm (three lightning strikes), quake (hits every enemy on the ground),
  // tornado (flings everyone within reach), slow (turn delay added to enemies in the blast).
  // New in v3: wall { w, h } (raises ground in front of you, nothing is fired), ray { range, pull, dmg } (a straight
  // line: the first enemy it touches is pulled towards you), skip { r, dmg } (a small blast at every bounce),
  // zone { w, turns, dmg } (fire left where it lands: ending a turn in it hurts), span { len } (a flat bridge where it lands).
  // Move abilities (dash): kind 'leap' (thrown like a shot: speed, grav, nofall, land { r, dmg, knock } blast where you
  // come down, blast { r, dmg } where you took off, self damage) · 'float' (a straight line, no gravity, up to range)
  // · 'blink' (appear up to range cells away, in open air you can see) · 'charge' (run along the ground up to range,
  // shove the first enemy met) · 'tunnel' (dig a passage up to range long and go through it).
  // Stats: hp, armor (× damage taken), power (× damage dealt), steps and climb (move), jump (× jump height),
  // weight (÷ how far shoves move you). Each verb (design/v3.md) appears at most once in a kit.
  // Balance: the v2 numbers were tuned for 40-60% in 1v1. The v3 kits are a FIRST PASS; see sim.js for where they sit.
  const CHARS = {
    brick: { name: 'Brick', role: 'Tank', cls: 'tank', hp: 110, armor: 0.88, power: 1, steps: 10, climb: 2, jump: 0.8, weight: 2,
      blurb: 'Big, tough and slow. Hard to shove. Builds his own cover and charges through yours.',
      passive: { id: 'plated', name: 'Plated', desc: 'Shoves move him half as far.' },
      shot1: { name: 'Slug', delay: 680, r: 3.5, dmg: 40, wind: 0.45, desc: 'A heavy shell. Wind hardly moves it.' },
      shot2: { name: 'Bulwark', verb: 'Build', cd: 3, delay: 620, r: 0, dmg: 0, wall: { w: 3, h: 7 }, desc: 'Raises a wall of ground in front of him, 3 wide and 7 tall. Aim left or right.' },
      dash: { name: 'Charge', verb: 'Move', cd: 3, kind: 'charge', range: 10, dmg: 14, shove: 1.5, desc: 'Runs up to 10 cells along the ground. The first enemy he meets is shoved hard.' },
      ss: { name: 'Meteor Slam', delay: 1040, r: 6, dmg: 56, wind: 0.3, speed: 0.95, desc: 'A huge, heavy shell: the biggest crater in the game.' } },
    zip: { name: 'Zip', role: 'Scout', cls: 'scout', hp: 110, armor: 1, power: 1, steps: 22, climb: 3, jump: 1.15, weight: 0.9,
      blurb: 'Quick on her feet. Shoots, then gets out: she keeps all her movement after firing.',
      passive: { id: 'slippery', name: 'Slippery', desc: 'Keeps all of her movement after shooting (others keep a third).' },
      shot1: { name: 'Dart', delay: 560, r: 3, dmg: 51, speed: 1.15, wind: 0.8, desc: 'Fast and flat, with a small blast.' },
      shot2: { name: 'Double Tap', verb: 'Blast', cd: 2, delay: 740, r: 3, dmg: 38, speed: 1.15, wind: 0.8, double: true, desc: 'Two darts, one right after the other.' },
      dash: { name: 'Grapple', verb: 'Move', cd: 2, kind: 'leap', speed: 0.72, grav: 0.6, nofall: true, desc: 'Swings fast and flat to where she aims. No fall damage.' },
      ss: { name: 'Bullet Rain', delay: 960, r: 3.2, dmg: 36, speed: 1.15, wind: 0.8, rain: { n: 5, spread: 4 }, desc: 'Five darts fanned out in a quick burst.' } },
    volt: { name: 'Volt', role: 'Gunner', cls: 'gunner', hp: 100, armor: 1, power: 1, steps: 14, climb: 2, jump: 1, weight: 1,
      blurb: 'Steady and simple. Calls lightning down on anyone hiding under cover.',
      passive: { id: 'charged', name: 'Charged', desc: 'Every third hit does half as much again and arcs to another enemy within 8 cells.' },
      shot1: { name: 'Arc Ball', delay: 600, r: 3.2, dmg: 45, desc: 'A plain, reliable shell.' },
      shot2: { name: 'Thunderstrike', verb: 'Blast', cd: 3, delay: 800, r: 3, dmg: 26, strike: { w: 2.2, dmg: 34 }, desc: 'Where it lands, lightning hits everyone close by, cover or not.' },
      dash: { name: 'Blink', verb: 'Move', cd: 3, kind: 'blink', range: 8, desc: 'Appears up to 8 cells away, in open air he can see.' },
      ss: { name: 'Storm Call', delay: 1000, r: 3, dmg: 24, storm: { gap: 7, w: 2.4, dmg: 42 }, desc: 'Three lightning bolts: where it lands and 7 cells to each side.' } },
    digger: { name: 'Digger', role: 'Miner', cls: 'engineer', hp: 110, armor: 0.95, power: 1, steps: 12, climb: 2, jump: 0.9, weight: 1.2,
      blurb: 'Sturdy. Walks through thin walls and tunnels straight to anyone dug in.',
      passive: { id: 'tunnel', name: 'Tunneller', desc: 'Walks straight through ground up to 3 cells thick.' },
      shot1: { name: 'Pick Shell', delay: 620, r: 4, dmg: 40, desc: 'Digs a wide crater.' },
      shot2: { name: 'Drill', verb: 'Dig', cd: 2, delay: 800, r: 4, dmg: 48, drill: 14, desc: 'Bores through up to 14 cells of ground, then explodes.' },
      dash: { name: 'Burrow', verb: 'Move', cd: 3, kind: 'tunnel', range: 9, desc: 'Digs a passage up to 9 cells long where he aims, and goes through it.' },
      ss: { name: 'Earthquake', delay: 1000, r: 5, dmg: 40, quake: { dmg: 20 }, desc: 'A big blast, then a quake that hits every enemy standing on the ground.' } },
    gale: { name: 'Gale', role: 'Wind-rider', cls: 'control', hp: 90, armor: 1, power: 1, steps: 16, climb: 2, jump: 1.2, weight: 0.8,
      blurb: 'Rides the wind and chooses which way it blows. Her Gust throws people into the water.',
      passive: { id: 'tailwind', name: 'Tailwind', desc: 'Once on her turn she can turn the wind round (not how hard it blows).' },
      shot1: { name: 'Kite Bomb', delay: 600, r: 4, dmg: 42, wind: 1.7, desc: 'Strong, but the wind pushes it a lot.' },
      shot2: { name: 'Gust', verb: 'Shove', cd: 3, delay: 780, r: 4.5, dmg: 24, wind: 1.7, knock: 2.2, desc: 'Weak blast, huge shove.' },
      dash: { name: 'Updraft', verb: 'Move', cd: 3, kind: 'leap', speed: 0.68, grav: 0.45, nofall: true, desc: 'Lifts off and glides to where she aims. No fall damage.' },
      ss: { name: 'Tornado', delay: 980, r: 3, dmg: 20, wind: 1.3, tornado: { reach: 11, dmg: 16, push: 26 }, desc: 'Flings everyone within 11 cells away from it, you too.' } },
    // --- the second five: one more for each class ---
    tusk: { name: 'Tusk', role: 'Bruiser', cls: 'tank', hp: 107, armor: 0.92, power: 1, steps: 9, climb: 2, jump: 0.9, weight: 1.5,
      blurb: 'A battering ram. Every hit shoves people where they don\'t want to be, harder the further he ran first.',
      passive: { id: 'momentum', name: 'Momentum', desc: 'Every 4 cells he walked this turn adds 10% to his shoves.' },
      shot1: { name: 'Ram Shell', delay: 660, r: 3.3, dmg: 36, wind: 0.6, knock: 1.4, desc: 'A solid hit with a hard shove.' },
      shot2: { name: 'Hook', verb: 'Shove', cd: 3, delay: 720, r: 0, dmg: 0, wind: 0, speed: 1.1, ray: { range: 16, pull: 8, dmg: 16 }, desc: 'A straight line out to 16 cells. The first enemy it touches is dragged towards him.' },
      dash: { name: 'Leap Slam', verb: 'Move', cd: 3, kind: 'leap', speed: 0.6, nofall: true, land: { r: 3, dmg: 22, knock: 1.2 }, desc: 'A high jump to where he aims, with a blast where he lands.' },
      ss: { name: 'Stampede', delay: 1020, r: 4.2, dmg: 32, wind: 0.6, knock: 1.5, rain: { n: 3, spread: 3.5 }, desc: 'Three ram shells in a row, each with a shove.' } },
    hopper: { name: 'Hopper', role: 'Skirmisher', cls: 'scout', hp: 110, armor: 1, power: 1, steps: 20, climb: 4, jump: 2, weight: 0.9,
      blurb: 'Goes anywhere. Jumps twice as high as anyone and never takes fall damage.',
      passive: { id: 'springy', name: 'Springy', desc: 'No fall damage, and her jump is twice as high.' },
      shot1: { name: 'Pebble', delay: 540, r: 3.1, dmg: 51, speed: 1.2, wind: 0.9, desc: 'Quick and light. The cheapest turn in the game.' },
      shot2: { name: 'Skipping Stone', verb: 'Blast', cd: 2, delay: 720, r: 3.2, dmg: 34, speed: 1.1, wind: 0.9, bounce: 3, skip: { r: 2.2, dmg: 16 }, desc: 'Skips off the ground up to 3 times, with a small blast each time.' },
      dash: { name: 'Pounce', verb: 'Move', cd: 3, kind: 'leap', speed: 0.66, nofall: true, land: { r: 2.6, dmg: 18, knock: 1.3 }, desc: 'A long leap that lands with a blast and a shove.' },
      ss: { name: 'Flurry', delay: 940, r: 2.7, dmg: 30, speed: 1.2, wind: 0.9, rain: { n: 7, spread: 2.6 }, desc: 'Seven pebbles in a tight fan.' } },
    flint: { name: 'Flint', role: 'Gunner', cls: 'gunner', hp: 100, armor: 1, power: 1, steps: 14, climb: 2, jump: 1, weight: 1,
      blurb: 'Sets things on fire. His hits keep hurting, and his fire decides where people can stand.',
      passive: { id: 'burn', name: 'Burn', desc: 'His hits leave a burn: 6 damage at the start of each of the target\'s next two turns.' },
      shot1: { name: 'Flare Shot', delay: 600, r: 3.2, dmg: 38, speed: 1.05, desc: 'A small blast that sets the burn.' },
      shot2: { name: 'Fire Wall', verb: 'Zone', cd: 3, delay: 760, r: 2, dmg: 10, zone: { w: 8, turns: 2, dmg: 14 }, desc: 'Leaves fire 8 cells wide for 2 turns. Ending a turn in it hurts.' },
      dash: { name: 'Rocket Jump', verb: 'Move', cd: 3, kind: 'leap', speed: 0.62, nofall: true, self: 5, blast: { r: 2.5, dmg: 14 }, desc: 'Blasts himself to where he aims. Costs him 5 health and hurts anyone beside him.' },
      ss: { name: 'Inferno', delay: 1000, r: 5.5, dmg: 44, zone: { w: 9, turns: 2, dmg: 14 }, desc: 'A big blast that leaves the crater burning for 2 turns.' } },
    patch: { name: 'Patch', role: 'Engineer', cls: 'engineer', hp: 106, armor: 0.95, power: 1, steps: 13, climb: 2, jump: 1, weight: 1.1,
      blurb: 'Reshapes the map. Bridges gaps, patches up his crew, and shakes the ground out from under people.',
      passive: { id: 'repairs', name: 'Field Repairs', desc: 'At the start of his turn, crewmates within 5 cells heal 6 and he heals 3.' },
      shot1: { name: 'Rivet', delay: 610, r: 3.5, dmg: 41, desc: 'A sturdy shell with a good crater.' },
      shot2: { name: 'Bridge', verb: 'Build', cd: 2, delay: 600, r: 0, dmg: 0, span: { len: 10 }, desc: 'Lays a flat span 10 cells long where it lands.' },
      dash: { name: 'Spring Pad', verb: 'Move', cd: 3, kind: 'leap', speed: 0.85, nofall: true, desc: 'Launches himself a long way. No fall damage.' },
      ss: { name: 'Sinkhole', delay: 1000, r: 7, dmg: 28, drill: 4, quake: { dmg: 14 }, desc: 'A huge crater, and a tremor that hits every enemy on the ground.' } },
    nimbus: { name: 'Nimbus', role: 'Storm-caller', cls: 'control', hp: 109, armor: 1, power: 1, steps: 15, climb: 2, jump: 1.1, weight: 0.8,
      blurb: 'Decides when the fight happens. Her hits slow people down and her ray puts their turn off.',
      passive: { id: 'drizzle', name: 'Drizzle', desc: 'Enemies she hits have half their movement on their next turn.' },
      shot1: { name: 'Raindrop', delay: 590, r: 3.8, dmg: 48, wind: 1.4, knock: -0.5, desc: 'A soft lob that tugs people towards where it lands.' },
      shot2: { name: 'Delay Ray', verb: 'Time', cd: 3, delay: 620, r: 4, dmg: 28, knock: 0.3, slow: 300, desc: 'Barely hurts, but every enemy it catches takes their next turn later.' },
      dash: { name: 'Cloud Ride', verb: 'Move', cd: 3, kind: 'float', range: 14, desc: 'Floats up to 14 cells in a straight line, over gaps and water.' },
      ss: { name: 'Thunderhead', delay: 990, r: 3, dmg: 20, wind: 1.4, storm: { gap: 5, w: 2.1, dmg: 34 }, desc: 'Three lightning bolts close together: where it lands and 5 cells to each side.' } },
  };
  const CHAR_IDS = Object.keys(CHARS);
  const CLASSES = { tank: 'Tank', scout: 'Scout', gunner: 'Gunner', engineer: 'Engineer', control: 'Controller' };
  const WEAPON_IDS = ['shot1', 'shot2', 'dash', 'ss']; // basic shot · ability · move ability · ultimate
  const passiveOf = (u) => CHARS[u.char].passive.id;

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
    if (n) G.tv = (G.tv || 0) + 1; // the ground changed (a renderer can watch this number)
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
      v: 4, seed: seed >>> 0, _s: (seed >>> 0) || 1, _id: 0, cols: COLS, rows: ROWS, map: 'hills', mapName: '', theme: 'hills', windMul: 1, mirror: false,
      phase: 'aim', turn: 0, team: 0, teams, size, actor: 0, spent: 0, chars,
      wind: 0, water: WATER0, moves: 0, weapon: 'shot1', mid: false, fired: false, retreat: false, walked: 0, windFlip: false, zones: [],
      relic: opts.relic === false ? null : { state: 'wait', at: 0, x: 0, y: 0, hp: RELIC.hp, maxHp: RELIC.hp, team: -1, air: false, vy: 0 }, // wait → live → taken (or lost to the water)
      T: null, units: [], proj: [], duds: [], barrels: [], crates: [], fx: [], crateOn: opts.crates !== false, shooter: 0, combo: false,
      fused: false, winner: null,
      stats: { crates: new Array(teams).fill(0), cratesLost: 0, combos: 0, shots: 0, shot2: 0, ss: 0, dash: 0, jumps: 0, retreats: 0, dudBlasts: 0, chains: 0, strikes: 0, drowned: 0, fallKOs: 0, selfDmg: new Array(teams).fill(0), dmg: new Array(teams).fill(0) },
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
        cd: { shot2: 0, dash: 0 }, ss: 0, burn: 0, wet: false, hits: 0 });
    }
    G.units.sort((a, b) => a.team - b.team || a.x - b.x); // ids stay as made; keep the list grouped by side
    // the map's hazards: barrels, and old duds (they tick from turn 1; a blast sets them off early). None right by a spawn.
    for (const f of M.features) {
      if (G.units.some((u) => Math.abs(u.x - (f.x + 0.5)) < 7)) continue;
      if (f.kind === 'barrel') G.barrels.push({ id: ++G._id, x: f.x + 0.5, y: f.y, air: false, vy: 0 });
      else G.duds.push({ id: ++G._id, x: f.x + 0.5, y: f.y, fuse: f.fuse, team: null, air: false, vy: 0, old: true });
    }
    if (G.relic) G.relic.at = RELIC.rounds * G.units.length; // the turn it lands on: about three turns each
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
  // Each unit has its own cooldowns and its own SS charge.
  function chargeSS(G) { const u = current(G); if (u) u.ss = Math.min(SS_CHARGE, u.ss + 1); }
  // who: a unit, a side (its most-charged living unit), or nothing (the unit whose turn it is)
  const ssOf = (G, who) => { if (who && typeof who === 'object') return who.ss; if (who == null) { const u = current(G); return u ? u.ss : 0; } return Math.max(0, ...teamUnits(G, who).map((u) => u.ss)); };
  const ssReady = (G, who) => ssOf(G, who) >= SS_CHARGE;
  const cdOf = (G, u = current(G)) => (u ? u.cd : { shot2: 0, dash: 0 }); // turns until the ability and the move ability are ready (0 = ready)
  const ready = (G, w, u = current(G)) => !!u && (w === 'shot1' || (w === 'ss' ? u.ss >= SS_CHARGE : u.cd[w] === 0));
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
  function delayIf(G, w) { const u = current(G); if (!u) return 0; return u.delay + G.spent + (w === 'pass' ? (G.retreat ? 0 : DELAY.pass) : shotSpec(G, u, w).delay); }
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
    return Object.assign({ wind: 1, speed: 1, knock: 1, delay: DASH_DELAY }, C[w] || C.shot1); // shot1 | shot2 | dash | ss
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
    if (!p.ray) { p.vx += G.wind * (p.wm == null ? 1 : p.wm) * dt; p.vy += GRAV * dt; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.ray) { p.ray -= Math.hypot(p.x - px, p.y - py); if (p.ray <= 0) return 'out'; } // a straight line that runs out
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
      if (real && p.skip) explode(G, p.x, p.y, p.skip.r, p.skip.dmg, p.team, 'shot', 0.6); // Skipping Stone: a small blast at every skip
      p.x = px; p.y = py; p.bounced = true;
      return null;
    }
    return 'ground';
  }
  function newShot(G, u, w, angle, power, team) {
    const s = shotSpec(G, u, w);
    const p = Object.assign(launch(u, angle, s.ray ? 1 : power, s.speed), { id: ++G._id, w, team, char: u.char, from: u.id, age: 0, wm: s.wind });
    if (s.bounce) p.bounce = s.bounce;
    if (s.drill) p.drill = s.drill;
    if (s.skip) p.skip = s.skip;
    if (s.ray) p.ray = s.ray.range;
    if (passiveOf(u) === 'momentum') p.kb = 1 + 0.1 * Math.floor(G.walked / 4); // Tusk: the further he walked, the harder the shove
    return p;
  }

  // ---------- blasts ----------
  function explode(G, x, y, r, dmg, byTeam, kind, knockMul = 1, skipId = 0) { // skipId: a unit the blast leaves alone (the one who made it by landing or taking off)
    carve(G, x, y, r);
    const reach = r * DMG_SPREAD;
    for (const u of G.units) {
      if (!u.alive || u.id === skipId) continue;
      const [cx, cy] = center(u); const d = Math.hypot(cx - x, cy - y);
      if (d > reach) continue;
      const k = 1 - d / reach;
      hurt(G, u, Math.round(dmg * k * CHARS[u.char].armor), byTeam);
      const nx = d > 0.01 ? (cx - x) / d : 0, ny = d > 0.01 ? (cy - y) / d : -1;
      const km = knockMul / CHARS[u.char].weight; // heavy characters are shoved less far
      if (km < 0) { u.vx += -nx * KNOCK * k * -km; u.vy -= 0.45 * KNOCK * k * -km; } // a pull: towards the centre, with a hop
      else { u.vx += nx * KNOCK * k * km; u.vy += (ny - 0.6) * KNOCK * k * km; }
      u.air = true;
    }
    if (G.relic && G.relic.state === 'live') { const q = G.relic, d = Math.hypot(q.x - x, q.y - RELIC.r - y); if (d <= reach + RELIC.r) hitRelic(G, dmg * Math.min(1, 1 - (d - RELIC.r) / reach), byTeam); }
    G.fx.push({ k: 'boom', x, y, r, kind });
    // live duds caught in a blast go off too: chain reactions
    for (const d of G.duds) if (!d.gone && Math.hypot(d.x - x, d.y - y) <= r + 1.5) d.chain = true;
        for (const b of G.barrels) if (!b.gone && Math.hypot(b.x - x, b.y - 1 - y) <= r + 1.5) b.chain = true;
    for (const c of G.crates) if (!c.gone && Math.hypot(c.x - x, c.y - 1 - y) <= r * 0.6 + 0.8) { /* a crate is sturdy: only a blast close to it breaks it */ c.gone = true; G.stats.cratesLost++; G.fx.push({ k: 'cratepop', x: c.x, y: c.y }); }
    // anything standing on carved ground may now fall
    for (const u of G.units) if (u.alive && !supported(G, u)) u.air = true;
    for (const d of G.duds) if (!d.gone && !solidAt(G, d.x, d.y + 0.6)) d.air = true;
    for (const b of G.barrels) if (!b.gone && !solidAt(G, b.x, b.y + 0.6)) b.air = true;
    for (const c of G.crates) if (!c.gone && !solidAt(G, c.x, c.y + 0.6)) c.air = true;
  }
  // Building (Bulwark, Bridge): new ground never goes over a unit, a dud, a barrel, hard rock or the sky band at the top.
  const canBuild = (G, x, y) => x >= 0 && x < G.cols && y >= Math.round(G.rows * 0.1) && y < G.rows && !G.T[y * G.cols + x] && !G.units.some((u) => u.alive && Math.abs(u.x - (x + 0.5)) < 1.6 && y + 0.5 > u.y - UNIT_R * 2 - 0.6 && y < u.y) && !G.duds.some((d) => Math.hypot(d.x - x - 0.5, d.y - y - 0.5) < 1.2) && !G.barrels.some((b) => Math.hypot(b.x - x - 0.5, b.y - 1 - y - 0.5) < 1.6);
  // Bulwark: a wall `w` wide and `h` tall, standing on the ground 3 cells in front of the unit.
  function buildWall(G, u, dir, w, h) {
    let n = 0;
    for (let i = 0; i < w; i++) {
      const x = Math.floor(u.x) + dir * (4 + i); if (x < 0 || x >= G.cols) continue;
      let base = Math.floor(u.y) - 3; while (base < G.rows && !G.T[base * G.cols + x]) base++; // the ground in that column, from just above his feet down
      if (base >= G.water || base - Math.floor(u.y) > 8) continue; // nothing to stand it on (a pit, or the water)
      const top = Math.min(base - h, Math.floor(u.y) - h); // on a downslope it still reaches `h` above his feet
      for (let y = base - 1; y >= top && base - y <= h + 8; y--) if (canBuild(G, x, y)) { G.T[y * G.cols + x] = MapGen.DIRT; n++; }
    }
    G.fx.push({ k: 'fill', x: u.x + dir * 5, y: u.y - h / 2, r: h / 2 }); if (n) G.tv = (G.tv || 0) + 1;
    return n;
  }
  // Bridge: a flat span `len` long and 2 thick, centred where the shot landed, just above it.
  function buildSpan(G, x, y, len) {
    const row = Math.floor(y) - 1; let n = 0;
    for (let cx = Math.floor(x - len / 2); cx < Math.floor(x - len / 2) + len; cx++) for (let k = 0; k < 2; k++) if (canBuild(G, cx, row + k)) { G.T[(row + k) * G.cols + cx] = MapGen.PROP; n++; }
    G.fx.push({ k: 'fill', x, y: row, r: len / 2 }); if (n) G.tv = (G.tv || 0) + 1;
    return n;
  }
  // Fire on the ground (Fire Wall, Inferno): any unit that ends its turn standing in it is hurt. It lasts `turns` turns each.
  function addZone(G, x, y, z, team) {
    G.zones.push({ id: ++G._id, kind: 'fire', x, y, w: z.w, dmg: z.dmg, team, until: G.turn + 1 + z.turns * G.units.filter((u) => u.alive).length });
    G.fx.push({ k: 'zone', x, y, w: z.w });
  }
  const inZone = (z, u) => Math.abs(u.x - z.x) <= z.w / 2 && Math.abs(u.y - z.y) <= 6;
  function hurt(G, u, hit, byTeam) {
    if (hit <= 0 || !u.alive) return;
    // the shooter's power and passive (only for hits on an enemy by the unit that fired this turn, and not for the arc itself)
    const by = byTeam != null && byTeam !== u.team && G.shooter && !G._arc ? G.units.find((v) => v.id === G.shooter && v.team === byTeam) : null;
    if (by) {
      hit = Math.max(1, Math.round(hit * CHARS[by.char].power * (G.relic && G.relic.state === 'taken' && G.relic.team === byTeam ? RELIC.power : 1)));
      const pv = passiveOf(by);
      if (pv === 'burn') { u.burn = 2; u.burnBy = byTeam; }
      if (pv === 'drizzle') u.wet = true;
      if (pv === 'charged' && ++by.hits % 3 === 0) { // every third hit: half as much again, and it arcs to another enemy close by
        const extra = Math.round(hit * 0.5); let near = null;
        for (const v of G.units) if (v.alive && v.team !== byTeam && v !== u && Math.hypot(v.x - u.x, v.y - u.y) <= 8 && (!near || Math.hypot(v.x - u.x, v.y - u.y) < Math.hypot(near.x - u.x, near.y - u.y))) near = v;
        hit += extra; G.fx.push({ k: 'arc', x: u.x, y: u.y, to: near ? near.id : 0 });
        if (near) { G._arc = true; hurt(G, near, extra, byTeam); G._arc = false; }
      }
    }
    u.hp -= hit;
    if (byTeam != null) { if (byTeam === u.team) G.stats.selfDmg[byTeam] += hit; else G.stats.dmg[byTeam] += hit; }
    // Combo (crews): hit an enemy a crewmate has hit since that enemy last had a turn, and the shooter gets a notch of SS. Once a turn.
    if (byTeam != null && byTeam !== u.team && G.shooter && G.size > 1) {
      const sh = G.units.find((v) => v.id === G.shooter);
      if (sh && sh.alive && u.mark && u.mark.team === byTeam && u.mark.by !== sh.id && !G.combo) { G.combo = true; sh.ss = Math.min(SS_CHARGE, sh.ss + 1); G.stats.combos++; G.fx.push({ k: 'combo', x: u.x, y: u.y, by: sh.id }); }
      if (sh) u.mark = { team: byTeam, by: sh.id };
    }
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
    if (G.relic && G.relic.state === 'live' && Math.abs(G.relic.x - x) <= w + RELIC.r) hitRelic(G, dmg, byTeam);
    G.fx.push({ k: 'bolt', x, hits });
  }
  // Damage to the Relic. The hit that empties it takes it for that side. Barrels and old duds (no side) can wear it down but never take it.
  function hitRelic(G, dmg, byTeam) {
    const q = G.relic; dmg = Math.round(dmg); if (!q || q.state !== 'live' || dmg <= 0) return;
    q.hp = byTeam == null ? Math.max(1, q.hp - dmg) : q.hp - dmg;
    if (q.hp > 0) { G.fx.push({ k: 'relichit', x: q.x, y: q.y, hp: q.hp, team: byTeam == null ? -1 : byTeam }); return; }
    q.hp = 0; q.state = 'taken'; q.team = byTeam; const ids = [];
    for (const u of G.units) if (u.alive && u.team === byTeam) { u.ss = Math.min(SS_CHARGE, u.ss + RELIC.ss); ids.push(u.id); }
    G.stats.relic = byTeam; G.fx.push({ k: 'relictake', x: q.x, y: q.y, team: byTeam, ids });
  }
  function ko(G, u, why) {
    if (!u.alive) return; u.alive = false; u.hp = 0; u.why = why;
    if (why === 'water') G.stats.drowned++; if (why === 'fall') G.stats.fallKOs++;
    G.fx.push({ k: 'ko', id: u.id, x: u.x, y: u.y, why });
  }
  const supported = (G, u) => solidAt(G, u.x, u.y + 0.05) || solidAt(G, u.x - 0.6, u.y + 0.05) || solidAt(G, u.x + 0.6, u.y + 0.05);

  // ---------- the physics tick ----------
  function step(G) {
    if (G.fxAct) G.fxAct = false; else G.fx = []; // effects an action set off (a wall going up, a blink) stay for the first tick after it
    if (G.phase !== 'flight') return G.fx;
    for (const p of G.proj) {
      if (p.gone) continue;
      if (p.wait > 0) { p.wait--; continue; } // the second shot of a Double Tap
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
    for (const c of G.crates) { // crates fall when the ground under them goes, and sink
      if (c.gone || !c.air) continue;
      c.vy += GRAV * TICK; c.y += c.vy * TICK;
      if (c.y >= G.water) { c.gone = true; G.stats.cratesLost++; G.fx.push({ k: 'splash', x: c.x, y: G.water }); continue; }
      if (solidAt(G, c.x, c.y + 0.6)) { while (solidAt(G, c.x, c.y + 0.5) && c.y > 0) c.y -= 0.25; c.vy = 0; c.air = false; for (const u of G.units) if (u.alive) openCrates(G, u); }
    }
    G.crates = G.crates.filter((c) => !c.gone);
    if (G.relic && G.relic.state === 'live') { // the Relic falls when the ground under it goes, and is lost if it reaches the water
      const q = G.relic; if (!q.air && !solidAt(G, q.x, q.y + 1)) q.air = true; // a full cell down: where it comes to rest sits a little above the ground
      if (q.air) { q.vy += GRAV * TICK; q.y += q.vy * TICK;
        if (q.y >= G.water) { q.state = 'lost'; q.air = false; G.fx.push({ k: 'splash', x: q.x, y: G.water }); G.fx.push({ k: 'reliclost', x: q.x, y: G.water }); }
        else if (solidAt(G, q.x, q.y + 0.6)) { while (solidAt(G, q.x, q.y + 0.5) && q.y > 0) q.y -= 0.25; q.vy = 0; q.air = false; } }
    }
    for (const u of G.units) if (u.alive && u.air) unitPhysics(G, u);
    if (!G.proj.length && !G.units.some((u) => u.alive && u.air) && !G.duds.some((d) => d.air || d.chain || d.fuseOut) && !G.barrels.some((b) => b.air || b.chain) && !G.crates.some((c) => c.air) && !(G.relic && G.relic.state === 'live' && G.relic.air)) settle(G);
    return G.fx;
  }
  function land(G, p) {
    const s = p.spec || shotSpec(G, p.char || p.team, p.w);
    if (s.ray) { // Hook: the first enemy it touched is dragged towards whoever threw it; ground just stops it
      const t = p.hitUnit && G.units.find((v) => v.id === p.hitUnit), sh = G.units.find((v) => v.id === p.from);
      if (t && t.alive && sh && t.team !== p.team) { hurt(G, t, Math.round(s.ray.dmg * CHARS[t.char].armor), p.team); if (t.alive) { t.vx += Math.sign(sh.x - t.x || 1) * s.ray.pull * 2.4 / CHARS[t.char].weight; t.vy -= 10; t.air = true; } }
      G.fx.push({ k: 'hook', x: p.x, y: p.y, from: p.from, hit: t ? t.id : 0 }); return;
    }
    if (s.span) { buildSpan(G, p.x, p.y, s.span.len); return; }
    explode(G, p.x, p.y, s.r, s.dmg, p.team, p.w === 'ss' ? 'ss' : p.w === 'shot2' ? (p.char || G.chars[p.team]) : 'shot', s.knock * (p.kb || 1));
    if (s.zone) addZone(G, p.x, p.y, s.zone, p.team);
    if (s.slow) { const reach = s.r * DMG_SPREAD, hits = []; for (const u of G.units) { const [cx, cy] = center(u); if (u.alive && u.team !== p.team && Math.hypot(cx - p.x, cy - p.y) <= reach) { u.delay += s.slow; hits.push(u.id); } } G.fx.push({ k: 'slow', x: p.x, y: p.y, hits }); }
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
    if (u.float) { // Cloud Ride: a straight line, no gravity, until it runs out or something is in the way
      const f = u.float, nx = u.x + f.vx * TICK, ny = u.y + f.vy * TICK;
      f.left -= Math.hypot(f.vx, f.vy) * TICK;
      if (f.left <= 0 || nx < 1 || nx > G.cols - 1 || ny < UNIT_R * 2 + 1 || solidAt(G, nx, ny - 0.2) || solidAt(G, nx, ny - UNIT_R) || solidAt(G, nx, ny - UNIT_R * 2)) { u.float = null; u.vx = 0; u.vy = 0; }
      else { u.x = nx; u.y = ny; return; }
    }
    u.vy += GRAV * TICK * (u.leap && u.leap.grav ? u.leap.grav : 1);
    const n = Math.max(1, Math.ceil(Math.hypot(u.vx, u.vy) * TICK / 0.4));
    for (let i = 0; i < n; i++) {
      const nx = u.x + u.vx * TICK / n, ny = u.y + u.vy * TICK / n;
      if (!solidAt(G, nx, ny - UNIT_R) && !solidAt(G, nx, ny - 0.2)) u.x = nx; else u.vx = 0;
      if (u.vy < 0) { if (!solidAt(G, u.x, ny - UNIT_R * 2)) u.y = ny; else u.vy = 0; }
      else if (solidAt(G, u.x, ny)) { // landed
        while (solidAt(G, u.x, u.y - 0.01) && u.y > 0) u.y -= 0.25;
        const v = u.vy, lp = u.leap; u.vy = 0; u.vx = 0; u.air = false; u.leap = null;
        if (v > SAFE_FALL && !(lp && lp.nofall) && passiveOf(u) !== 'springy') { u.hp -= Math.round((v - SAFE_FALL) * FALL_DMG); if (u.hp <= 0) ko(G, u, 'fall'); }
        if (u.alive && lp && lp.land) explode(G, u.x, u.y - 0.5, lp.land.r, lp.land.dmg, u.team, 'shot', lp.land.knock, u.id); // Leap Slam, Pounce
        if (u.alive) openCrates(G, u); // knocked onto a crate: it's yours
        break;
      } else u.y = ny;
    }
    if (u.alive && (u.y >= G.water)) ko(G, u, 'water');
    if (u.alive && (u.x < 0 || u.x >= G.cols)) ko(G, u, 'out');
  }

  // ---------- turns ----------
  function settle(G) {
    if (G.mid) { // a jump or a move ability has come to rest: the turn carries on (unless it ended the match, or the unit)
      G.mid = false; checkWin(G); if (G.phase === 'over') return;
      const u = current(G);
      if (u) { openCrates(G, u); G.phase = 'aim'; G.fx.push({ k: 'resume' }); return; }
    }
    if (!G.fused) {
      G.fused = true;
      let boom = false;
      for (const d of G.duds) { d.fuse--; if (d.fuse <= 0) { d.fuseOut = true; boom = true; } }
      if (boom) return; // let the blasts play out, then settle again
    }
    checkWin(G);
    if (G.phase === 'over') return;
    const u = current(G);
    if (G.fired && !G.retreat && u) { // the shot has landed: a short retreat with what's left of your movement
      const keep = passiveOf(u) === 'slippery' ? G.moves : Math.min(G.moves, Math.ceil(CHARS[u.char].steps * RETREAT));
      if (keep > 0) { G.retreat = true; G.moves = keep; G.phase = 'aim'; G.stats.retreats++; G.fx.push({ k: 'retreat', moves: keep }); return; }
    }
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
    G.spent = 0; G.retreat = false; G.fired = false; G.mid = false; G.walked = 0; G.windFlip = false;
    G.shooter = 0;
    if (was && was.alive) for (const z of G.zones) if (inZone(z, was)) { hurt(G, was, Math.round(z.dmg * CHARS[was.char].armor), z.team === was.team ? null : z.team); G.fx.push({ k: 'scorch', id: was.id, x: was.x, y: was.y }); break; } // ended the turn standing in fire
    G.turn++;
    G.zones = G.zones.filter((z) => G.turn < z.until);
    checkWin(G); if (G.phase === 'over') return;
    if (G.turn >= suddenTurn(G)) {
      G.water = Math.max(4, G.water - Math.max(SUDDEN_RISE, Math.round(SUDDEN_RISE * G.rows / ROWS)));
      for (const u of G.units) if (u.alive && u.y >= G.water) ko(G, u, 'water');
      for (const d of G.duds) if (d.y >= G.water) d.gone = true;
      G.duds = G.duds.filter((d) => !d.gone);
      G.barrels = G.barrels.filter((b) => b.y < G.water); G.crates = G.crates.filter((c) => c.y < G.water);
      if (G.relic && G.relic.state === 'live' && G.relic.y >= G.water) { G.relic.state = 'lost'; G.fx.push({ k: 'reliclost', x: G.relic.x, y: G.water }); }
      checkWin(G); if (G.phase === 'over') return;
    }
    if (G.turn >= maxTurns(G)) { // a stalemate nobody can break: the side with more health left (as a share) wins
      const hp = Array.from({ length: G.teams }, (_, t) => teamUnits(G, t).reduce((a, u) => a + u.hp / u.maxHp, 0)), top = Math.max(...hp);
      G.phase = 'over'; G.winner = hp.filter((h) => h === top).length > 1 ? -1 : hp.indexOf(top); G.timeout = true; return;
    }
    let nx = null;
    for (;;) { // whoever is next; a burn bites first, and if it finishes them the turn passes on
      nx = nextActor(G, was ? was.team : -1); if (!nx) break;
      if (nx.burn > 0) { nx.burn--; hurt(G, nx, BURN, nx.burnBy == null || nx.burnBy === nx.team ? null : nx.burnBy); G.fx.push({ k: 'scorch', id: nx.id, x: nx.x, y: nx.y }); if (!nx.alive) { checkWin(G); if (G.phase === 'over') return; continue; } }
      break;
    }
    G.actor = nx.id; G.team = nx.team;
    nx.mark = null; G.combo = false;
    for (const k of ['shot2', 'dash']) if (nx.cd[k] > 0) nx.cd[k]--;
    if (passiveOf(nx) === 'repairs') { // Patch: his crew close by, and a little for himself
      const got = []; for (const v of G.units) if (v.alive && v.team === nx.team && v.hp < v.maxHp && Math.hypot(v.x - nx.x, v.y - nx.y) <= 5) { v.hp = Math.min(v.maxHp, v.hp + (v === nx ? 3 : 6)); got.push(v.id); }
      if (got.length) G.fx.push({ k: 'mend', ids: got });
    }
    if (G.relic && G.relic.state === 'wait' && G.turn >= G.relic.at) { // the Relic lands: the middle of the map, on dry ground, clear of everyone (or it waits a turn)
      const q = G.relic, x = dryLand(G, Math.floor(G.cols / 2), G.units.filter((u) => u.alive).map((u) => Math.floor(u.x)), 4);
      if (surfaceY(G, x) < G.water - 3 && Math.abs(x - G.cols / 2) < G.cols * 0.3) { q.x = x + 0.5; q.y = surfaceY(G, x); q.state = 'live'; G.fx.push({ k: 'relic', x: q.x, y: q.y }); }
    }
    if (G.crateOn && G.turn >= crateFirst(G) && (G.turn - crateFirst(G)) % crateEvery(G) === 0 && G.crates.length < CRATE.max + (G.cols > COLS ? 1 : 0)) dropCrate(G);
    G.phase = 'aim'; G.moves = nx.wet ? Math.ceil(CHARS[nx.char].steps / 2) : CHARS[nx.char].steps; nx.wet = false; G.fused = false; G.weapon = 'shot1';
    chargeSS(G);
    G.wind = rollWind(G);
    G.fx.push({ k: 'turn', team: G.team, turn: G.turn });
  }

  // ---------- supply crates ----------
  // A crate lands where the fight is: between the two closest enemies, but nearer the one whose side is behind on health
  // (8 to 14 cells from them: one turn's walk for most characters). So crates lean towards a comeback, and the side
  // that's ahead has to choose between its own shot and blowing the crate up.
  function dropCrate(G) {
    const live = G.units.filter((u) => u.alive); if (live.length < 2) return;
    let best = null;
    for (const a of live) for (const b of live) if (a.team < b.team) { const d = Math.abs(a.x - b.x); if (!best || d < best.d) best = { d, a, b }; }
    const share = (t) => teamUnits(G, t).reduce((n, u) => n + u.hp / u.maxHp, 0) / G.size, kind = CRATE_KINDS[Math.floor(R(G) * CRATE_KINDS.length)], coin = R(G), off = 8 + R(G) * 6;
    if (!best) return;
    const sa = share(best.a.team), sb = share(best.b.team), near = sa < sb || (sa === sb && coin < 0.5) ? best.a : best.b, far = near === best.a ? best.b : best.a;
    let x = Math.round(near.x + Math.sign(far.x - near.x || 1) * Math.min(off, best.d * 0.45));
    x = dryLand(G, clamp(x, 6, G.cols - 7), live.map((u) => Math.floor(u.x)), 4);
    if (surfaceY(G, x) >= G.water - 2 || live.some((u) => Math.abs(u.x - x - 0.5) < 3)) return; // nowhere good this time
    const c = { id: ++G._id, x: x + 0.5, y: surfaceY(G, x), kind, air: false, vy: 0 };
    G.crates.push(c); G.fx.push({ k: 'crate', id: c.id, x: c.x, y: c.y, kind });
  }
  // A unit standing on (or next to) a crate opens it.
  function openCrates(G, u) {
    for (const c of G.crates) {
      if (c.gone || c.air || Math.abs(c.x - u.x) > CRATE.reach || Math.abs(c.y - u.y) > 3.5) continue;
      c.gone = true; G.stats.crates[u.team]++; const got = c.kind;
      if (c.kind === 'cool') { u.cd.shot2 = 0; u.cd.dash = 0; }
      else if (c.kind === 'ss') u.ss = Math.min(SS_CHARGE, u.ss + CRATE.ss);
      else u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * CRATE.heal));
      G.fx.push({ k: 'open', id: c.id, unit: u.id, x: c.x, y: c.y, kind: c.kind, got });
    }
    G.crates = G.crates.filter((c) => !c.gone);
  }

  // ---------- moving in the aim phase ----------
  function walk(G, u, dir) {
    const nx = u.x + dir, climb = CHARS[u.char].climb;
    if (nx < 0.5 || nx > G.cols - 0.5) return false;
    let ny = u.y, k = 0; // climb up to `climb` cells, or step down
    while (solidAt(G, nx, ny - 0.01) && k <= climb) { ny -= 1; k++; }
    if (k > climb) { // a wall. Digger walks through it if it is no more than 3 cells thick (and isn't hard rock)
      if (passiveOf(u) !== 'tunnel') return false;
      let thick = 0; while (thick < 4 && solidAt(G, u.x + dir * (1 + thick), u.y - 1)) thick++;
      if (thick > 3) return false;
      const cx = Math.floor(nx); for (let d = 1; d <= 3; d++) if (G.T[(Math.floor(u.y) - d) * G.cols + cx] === MapGen.ROCK) return false;
      for (let d = 1; d <= 3; d++) { const cy = Math.floor(u.y) - d; if (cy >= 0) G.T[cy * G.cols + cx] = 0; }
      G.tv = (G.tv || 0) + 1;
      ny = u.y;
    }
    if (solidAt(G, nx, ny - UNIT_R * 2)) return false; // no headroom
    u.x = nx; u.y = ny; u.face = dir;
    if (!supported(G, u)) { u.air = true; u.vx = 0; u.vy = 0; dropNow(G, u); } // step off a ledge (fall damage counts)
    return true;
  }
  function dropNow(G, u) { let g = 0; while (u.alive && u.air && g++ < 600) unitPhysics(G, u); }
  const fits = (G, x, y) => x > 1 && x < G.cols - 1 && y > UNIT_R * 2 + 1 && y < G.water && !solidAt(G, x, y - 0.2) && !solidAt(G, x, y - UNIT_R) && !solidAt(G, x, y - UNIT_R * 2); // room for a unit with its feet at x, y
  // A move ability. It flies (or happens at once), then the turn carries on: you can still shoot.
  function dash(G, u, sp, angle, power) {
    const a = angle * Math.PI / 180, ox = Math.cos(a), oy = -Math.sin(a), pw = clamp(power, 0.2, 1), dir = ox >= 0 ? 1 : -1;
    u.face = dir;
    if (sp.kind === 'leap') {
      if (sp.blast) explode(G, u.x, u.y - 0.5, sp.blast.r, sp.blast.dmg, u.team, 'shot', 1, u.id); // Rocket Jump: the blast he rides
      if (sp.self) u.hp = Math.max(1, u.hp - sp.self);
      u.vx = ox * pw * VMAX * sp.speed; u.vy = oy * pw * VMAX * sp.speed; u.y -= 0.3; u.air = true;
      u.leap = { nofall: !!sp.nofall, land: sp.land || null, grav: sp.grav || 1 };
    } else if (sp.kind === 'float') {
      u.float = { vx: ox * 22, vy: oy * 22, left: sp.range * pw }; u.leap = { nofall: true }; u.y -= 0.3; u.air = true;
    } else if (sp.kind === 'blink') { // step along the line he can see; stop at the first thing in the way
      let bx = u.x, by = u.y;
      for (let d = 0.5; d <= sp.range * pw; d += 0.5) { const x = u.x + ox * d, y = u.y + oy * d; if (!fits(G, x, y)) break; bx = x; by = y; }
      G.fx.push({ k: 'blink', id: u.id, x0: u.x, y0: u.y, x: bx, y: by });
      u.x = bx; u.y = by; u.vx = 0; u.vy = 0; u.air = true; u.leap = { nofall: true };
    } else if (sp.kind === 'charge') { // run along the ground; the first enemy in the way is shoved
      for (let i = 0; i < sp.range && u.alive; i++) {
        const e = G.units.find((v) => v.alive && v.team !== u.team && (v.x - u.x) * dir > 0 && Math.abs(v.x - u.x) <= UNIT_R * 2 + 0.2 && Math.abs(v.y - u.y) <= 3);
        if (e) { G.shooter = u.id; hurt(G, e, Math.round(sp.dmg * CHARS[e.char].armor), u.team); if (e.alive) { e.vx += dir * KNOCK * sp.shove / CHARS[e.char].weight; e.vy -= 9; e.air = true; } G.fx.push({ k: 'bash', x: e.x, y: e.y }); break; }
        if (!walk(G, u, dir)) break;
      }
    } else if (sp.kind === 'tunnel') { // dig along the aim and follow the passage; hard rock stops it
      for (let d = 0.5; d <= sp.range * pw; d += 0.5) {
        const x = u.x + ox * 0.5, y = u.y + oy * 0.5; if (x < 2 || x > G.cols - 2 || y < UNIT_R * 2 + 2 || y > G.water - 2) break;
        carve(G, x, y - UNIT_R, UNIT_R + 0.3); if (!fits(G, x, y)) break;
        u.x = x; u.y = y;
      }
      G.fx.push({ k: 'dug', id: u.id, x: u.x, y: u.y }); u.vx = 0; u.vy = 0; u.air = true; u.leap = { nofall: true };
      for (const v of G.units) if (v.alive && !supported(G, v)) v.air = true;
    }
    G.mid = true; G.phase = 'flight';
  }

  // ---------- actions: the one way to change a game ----------
  //   { k: 'move', dir: -1|1 }                   walk one cell (the character's steps a turn; in the retreat, what's left)
  //   { k: 'jump', dir: -1|1 }                   jump that way (costs JUMP.cost steps); the turn carries on when you land
  //   { k: 'weapon', w: 'shot1'|'shot2'|'dash'|'ss' }  pick the basic shot, the ability, the move ability or the ultimate
  //   { k: 'fire', angle, power }                 use it (angle in degrees, 0 = right, 90 = up). A shot ends the aiming:
  //                                               once it lands you get the retreat. The move ability doesn't: aim again after.
  //   { k: 'wind' }                               Gale only, once a turn: turn the wind round
  //   { k: 'pass' }                               end the turn (free in the retreat; otherwise it costs turn delay). The UI's timer sends this.
  //   step(G) while phase === 'flight'            the clock, not a player action
  function act(G, it) {
    if (!it || typeof it !== 'object' || G.phase !== 'aim') return false;
    const u = current(G); if (!u) return false;
    if (!G.fxAct) G.fx = []; // an action's effects are left in G.fx: step() returns them with its first tick, or read them here
    const ok = act1(G, u, it); G.fxAct = G.fx.length > 0;
    return ok;
  }
  function act1(G, u, it) {
    switch (it.k) {
      case 'move': {
        if (G.moves <= 0 || (it.dir !== 1 && it.dir !== -1)) return false;
        if (!walk(G, u, it.dir)) return false;
        G.moves--; G.walked++; if (!G.retreat) G.spent += DELAY.move; // steps in the retreat cost no turn delay
        if (!u.alive) G.phase = 'flight'; // walked into the water: end the turn
        else openCrates(G, u);
        return true;
      }
      case 'jump': {
        if (G.moves < JUMP.cost || (it.dir !== 1 && it.dir !== -1)) return false;
        if (solidAt(G, u.x, u.y - UNIT_R * 2 - 0.6)) return false; // no headroom
        G.moves -= JUMP.cost; if (!G.retreat) G.spent += DELAY.jump; G.stats.jumps++;
        u.face = it.dir; u.vx = it.dir * JUMP.vx; u.vy = -JUMP.vy * Math.sqrt(CHARS[u.char].jump); u.y -= 0.3; u.air = true;
        G.mid = true; G.phase = 'flight'; return true;
      }
      case 'weapon': {
        if (G.retreat || WEAPON_IDS.indexOf(it.w) < 0 || !ready(G, it.w, u)) return false;
        G.weapon = it.w; return true;
      }
      case 'wind': {
        if (G.retreat || G.windFlip || passiveOf(u) !== 'tailwind') return false;
        G.wind = -G.wind; G.windFlip = true; return true;
      }
      case 'fire': {
        if (G.retreat || !Number.isFinite(it.angle) || !Number.isFinite(it.power)) return false;
        const w = G.weapon; if (!ready(G, w, u)) return false;
        const sp = shotSpec(G, u, w);
        if (w === 'dash') { u.cd.dash = sp.cd; G.spent += sp.delay; G.stats.dash++; G.weapon = 'shot1'; dash(G, u, sp, it.angle, it.power); return true; }
        if (w === 'ss') { u.ss = 0; G.stats.ss++; }
        if (w === 'shot2') { u.cd.shot2 = sp.cd; G.stats.shot2++; }
        G.shooter = u.id; G.fired = true; G.spent += sp.delay; G.stats.shots++;
        u.face = Math.cos(it.angle * Math.PI / 180) >= 0 ? 1 : -1;
        if (sp.wall) { buildWall(G, u, u.face, sp.wall.w, sp.wall.h); G.phase = 'flight'; return true; } // Bulwark: nothing is fired
        if (sp.rain) { // a fan of shots, one after another
          const n = sp.rain.n;
          for (let i = 0; i < n; i++) { const q = newShot(G, u, w, it.angle + (i - (n - 1) / 2) * sp.rain.spread, it.power * (1 - 0.015 * i), G.team); q.wait = i * 7; G.proj.push(q); }
          G.phase = 'flight'; return true;
        }
        G.proj.push(newShot(G, u, w, it.angle, it.power, G.team));
        if (sp.double) { const q = newShot(G, u, w, it.angle, it.power * 0.96, G.team); q.wait = 20; G.proj.push(q); } // Double Tap: a second dart a third of a second later
        G.phase = 'flight'; return true;
      }
      case 'pass': if (!G.retreat) G.spent += DELAY.pass; G.phase = 'flight'; return true;
      default: return false;
    }
  }

  // Run the clock until the turn settles (for bots, the sim and tests). Returns the ticks used.
  function resolve(G, maxTicks = 20000) {
    let n = 0; while (G.phase === 'flight' && n++ < maxTicks) step(G);
    if (G.phase === 'flight') throw new Error('stuck in flight at turn ' + G.turn);
    return n;
  }

  // ---------- aim prediction (the same advance() the game uses, without changing the ground) ----------
  function predict(G, u, angle, power, w = 'shot1', team = u.team, maxTicks = 900) {
    const s = shotSpec(G, u, w);
    const p = Object.assign(launch(u, angle, s.ray ? 1 : power, s.speed), { wm: s.wind, bounce: s.bounce || 0, drill: s.drill || 0, ray: s.ray ? s.ray.range : 0 });
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
  // style: smart (good aim, uses the whole kit) · sloppy (few tries, shaky hands) · basic (smart aim, but only ever the basic
  // shot and walking: shows what the kits are worth) · nocrate (smart, never goes for a crate).
  const STYLES = {
    smart:  { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, kit: 1, dodge: 1, crate: 1 },
    sloppy: { tries: 10, refine: 0,  noiseA: 5.0, noiseP: 0.07,  kit: 1, dodge: 0, crate: 1 },
    basic:  { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, kit: 0, dodge: 1, crate: 1 },
    nocrate: { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, kit: 1, dodge: 1, crate: 0 },
    // the computer opponents in 1 Player mode
    easy:   { tries: 8,  refine: 0,  noiseA: 7.5, noiseP: 0.10,  kit: 0.5, dodge: 0, ssSkip: 0.5, crate: 1, relic: 0 }, // doesn't go for the Relic (it may still take it by accident)
    medium: { tries: 18, refine: 6,  noiseA: 3.2, noiseP: 0.04,  kit: 1, dodge: 1, crate: 1 },
    hard:   { tries: 36, refine: 14, noiseA: 1.4, noiseP: 0.018, kit: 1, dodge: 1, crate: 1 },
  };
  function botRng(G) { let s = (G.seed ^ Math.imul(G.turn + 1, 2654435761)) >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => (r() + r() + r() - 1.5) * 1.15;

  // Score a landing spot for `team` with weapon w (from the bot's point of view).
  function scoreLanding(G, land, w, team, fuse, char, relicW = 1) { // relicW: how much this bot cares about the Relic (Easy: not at all) // char: the unit firing (or a character id)
    if (land.hit === 'water' || land.hit === 'out' || land.hit === 'timeout') return -1;
    const S = shotSpec(G, char || team, w);
    const s = blastScore(G, land.x, land.y, S.r, S.dmg, team);
    if (S.wall || S.span) return -1; // bots don't build (yet)
    if (S.ray) { // Hook: only worth it if it lands on an enemy; more if that drags them towards water or the edge
      const t = land.hit === 'unit' && G.units.find((x) => x.id === land.unit); if (!t || t.team === team) return -1;
      return Math.min(t.hp, S.ray.dmg) + 14 + (G.water - t.y < 14 ? 12 : 0);
    }
    let sc = s.theirs - 1.4 * s.mine;
    if (S.zone) for (const u of G.units) if (u.alive && Math.abs(u.x - land.x) <= S.zone.w / 2 && Math.abs(u.y - land.y) <= 6) sc += (u.team === team ? -1.4 : 1) * S.zone.dmg * 0.8;
    if (S.skip) sc += 6;
    if (S.double) sc *= 1.8;
    if (S.slow) for (const u of G.units) { if (!u.alive || u.team === team) continue; const [cx, cy] = center(u); if (Math.hypot(cx - land.x, cy - land.y) <= S.r * DMG_SPREAD) sc += S.slow * 0.02; }
    if (S.strike) for (const u of G.units) if (u.alive && Math.abs(u.x - land.x) <= S.strike.w) sc += (u.team === team ? -1.4 : 1) * Math.min(u.hp, S.strike.dmg * CHARS[u.char].armor);
    if (Math.abs(S.knock) > 1) for (const u of G.units) { // a big push near the water or a cliff is worth a lot
      if (!u.alive) continue; const [cx, cy] = center(u); if (Math.hypot(cx - land.x, cy - land.y) > S.r * DMG_SPREAD) continue;
      if (G.water - u.y < 14 || u.x < 10 || u.x > G.cols - 10) sc += (u.team === team ? -1.4 : 1) * 0.6 * u.hp;
    }
    if (S.rain) sc *= 0.64 * S.rain.n;
    if (S.storm) for (const dx of [0, -S.storm.gap, S.storm.gap]) for (const u of G.units) if (u.alive && Math.abs(u.x - land.x - dx) <= S.storm.w) sc += (u.team === team ? -1.4 : 1) * Math.min(u.hp, S.storm.dmg * CHARS[u.char].armor);
    if (S.quake) for (const u of G.units) if (u.alive && u.team !== team) sc += Math.min(u.hp, S.quake.dmg * CHARS[u.char].armor);
    if (S.tornado) for (const u of G.units) {
      if (!u.alive) continue; const [cx, cy] = center(u), d = Math.hypot(cx - land.x, cy - land.y); if (d > S.tornado.reach) continue;
      const k = 1 - d / S.tornado.reach, risky = G.water - u.y < 16 || u.x < 14 || u.x > G.cols - 14;
      sc += (u.team === team ? -1.4 : 1) * (Math.min(u.hp, S.tornado.dmg * k) + (risky ? 0.7 * u.hp * k : 0));
    }
    if (relicW > 0 && G.relic && G.relic.state === 'live' && S.r > 0) { // the Relic: chipping it is worth a little, taking it a lot
      const q = G.relic, reach = S.r * DMG_SPREAD, d = Math.hypot(q.x - land.x, q.y - RELIC.r - land.y);
      if (d <= reach + RELIC.r) { const dm = S.dmg * Math.min(1, 1 - (d - RELIC.r) / reach) * (S.rain ? S.rain.n * 0.6 : S.double ? 1.8 : 1); sc += dm >= q.hp ? 30 : Math.min(q.hp, dm) * 0.35; }
    }
    if (land.unit && G.units.find((x) => x.id === land.unit).team !== team) sc += 4;
    return sc;
  }
  function bestShot(G, u, w, st, rnd, fuse, powerCap = 1) { // fuse: unused since duds stopped being a weapon; kept so call sites read the same
    const enemies = G.units.filter((x) => x.alive && x.team !== u.team);
    let best = { score: -Infinity };
    const tryOne = (angle, power) => {
      power = clamp(power, 0.1, 1) * powerCap;
      const land = predict(G, u, angle, power, w);
      const sc = scoreLanding(G, land, w, u.team, fuse, u, st.relic == null ? 1 : st.relic);
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
  // One full bot turn: sends its intents through act() and returns them. A turn can have several flights now (a jump or
  // a move ability, the shot, then the retreat), so the bot runs the clock itself between them. Give it a copy of the
  // game if you want to play its intents out one by one (the UI and the server do).
  function botTurn(G, style) {
    const st = STYLES[style] || STYLES.smart, rnd = botRng(G), u = current(G); if (!u) return [];
    const sent = [], turn = G.turn;
    const mine = () => G.phase === 'aim' && G.turn === turn && current(G) === u;
    const send = (it) => { if (!act(G, it)) return false; sent.push(it); if (G.phase === 'flight') resolve(G); return true; };
    const walkTo = (dir, n, stop) => { while (n-- > 0 && mine() && G.moves > 0 && !(stop && stop()) && safeStep(G, u, dir) && send({ k: 'move', dir })); };
    const foes = () => G.units.filter((x) => x.alive && x.team !== u.team).sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x));
    if (G.retreat) { retreat(); return sent; }
    if (st.dodge) { // an old dud about to blow next to us: walk away from it
      const near = G.duds.find((d) => d.fuse <= 1 && Math.hypot(d.x - u.x, d.y - u.y) < DUD.r * DMG_SPREAD);
      if (near) walkTo(u.x < near.x ? -1 : 1, 30);
      if (!mine()) return sent;
    }
    if (st.crate && G.crates.length) { // a crate within this turn's steps, on a path that's safe all the way: go and get it, then shoot
      const c = G.crates.filter((q) => !q.air && Math.abs(q.x - u.x) <= Math.min(G.moves, 14) + CRATE.reach && Math.abs(q.y - u.y) < 12).sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
      if (c) { const id = c.id; walkTo(c.x > u.x ? 1 : -1, 40, () => !G.crates.some((q) => q.id === id) || Math.abs(c.x - u.x) <= 0.6); }
      if (!mine()) return sent;
    }
    const useKit = st.kit >= 1 || (st.kit > 0 && rnd() < st.kit);
    // where a leap would come down (null if that's the water, the edge of the map, or nowhere within 10 seconds)
    const leapTo = (sp, ang, pw) => {
      const a = ang * Math.PI / 180; let x = u.x, y = u.y - 0.3, vx = Math.cos(a) * pw * VMAX * sp.speed, vy = -Math.sin(a) * pw * VMAX * sp.speed;
      for (let t = 0; t < 600; t++) { vy += GRAV * TICK * (sp.grav || 1); const nx = x + vx * TICK; if (solidAt(G, nx, y - UNIT_R)) vx = 0; else x = nx; y += vy * TICK; if (x < 6 || x > G.cols - 6 || y >= G.water - 3) return null; if (vy > 0 && solidAt(G, x, y)) return { x, y }; }
      return null;
    };
    const fireDash = (angle, power) => send({ k: 'weapon', w: 'dash' }) && send({ k: 'fire', angle, power });
    if (useKit && ready(G, 'dash', u)) { // a move that hurts is free damage before the shot: a slam onto someone, or a charge into them
      const sp = shotSpec(G, u, 'dash');
      if (sp.kind === 'leap' && sp.land) {
        let best = null;
        for (const e of foes().slice(0, 2)) for (const el of [40, 55, 70]) for (let pw = 0.3; pw <= 1.001; pw += 0.1) {
          const ang = e.x > u.x ? el : 180 - el, at = leapTo(sp, ang, pw); if (!at) continue;
          let sc = 0; for (const v of G.units) { if (!v.alive || v === u) continue; const d = Math.hypot(v.x - at.x, v.y - UNIT_R - at.y + 0.5), reach = sp.land.r * DMG_SPREAD; if (d < reach) sc += (v.team === u.team ? -1.4 : 1) * Math.min(v.hp, sp.land.dmg * (1 - d / reach)); }
          if (sc > 8 && (!best || sc > best.sc)) best = { sc, ang, pw };
        }
        if (best) fireDash(best.ang, best.pw);
      } else if (sp.kind === 'charge') {
        const e = foes().find((v) => Math.abs(v.x - u.x) <= sp.range && Math.abs(v.x - u.x) > 3 && Math.abs(v.y - u.y) <= 2), dir = e && e.x > u.x ? 1 : -1;
        let clear = !!e; for (let i = 1; clear && i < Math.abs(e.x - u.x) - 2; i++) { const x = u.x + dir * i; if (solidAt(G, x, u.y - 2.5) || !solidAt(G, x, u.y + 3)) clear = false; } // level ground all the way to them
        if (clear) fireDash(dir > 0 ? 0 : 180, 1);
      }
      if (!mine()) return sent;
    }
    let s1 = bestShot(G, u, 'shot1', st, rnd, 0);
    if (!(s1.score > 0) && G.cols > COLS) { // big maps: nobody in reach, so close the distance. The move ability first if it's ready, then on foot (never into the water or off a cliff)
      const foe = foes()[0];
      if (foe && useKit && ready(G, 'dash', u) && Math.abs(foe.x - u.x) > 30) {
        const sp = shotSpec(G, u, 'dash'), right = foe.x > u.x;
        const ang = sp.kind === 'charge' || sp.kind === 'tunnel' ? (right ? 0 : 180) : sp.kind === 'float' || sp.kind === 'blink' ? (right ? 25 : 155) : (right ? 55 : 125), pw = sp.kind === 'leap' ? 0.7 : 1;
        if (sp.kind !== 'leap' || leapTo(sp, ang, pw)) fireDash(ang, pw);
        if (!mine()) return sent;
      }
      if (foe) walkTo(foe.x > u.x ? 1 : -1, 60, () => Math.abs(foe.x - u.x) <= 20);
      if (!mine()) return sent;
      s1 = bestShot(G, u, 'shot1', st, rnd, 0);
    }
    if (passiveOf(u) === 'tailwind' && useKit && !G.windFlip) { // Gale: turn the wind round if it helps her basic shot
      const keep = s1.score, flip = JSON.parse(JSON.stringify(G)); flip.wind = -flip.wind;
      const alt = bestShot(flip, flip.units.find((x) => x.id === u.id), 'shot1', st, botRng(G), 0);
      if (alt.score > keep + 4 && send({ k: 'wind' })) s1 = bestShot(G, u, 'shot1', st, rnd, 0);
    }
    const opts = [{ w: 'shot1', ...s1 }];
    if (ssReady(G) && !(st.ssSkip && rnd() < st.ssSkip)) opts.push({ w: 'ss', ...bestShot(G, u, 'ss', st, rnd, 0) });
    if (useKit && ready(G, 'shot2', u)) { const c = bestShot(G, u, 'shot2', st, rnd, 0); opts.push({ w: 'shot2', ...c, score: c.score * 1.05 }); }
    // turn delay: a heavier shot has to be worth the turns it gives away (about 2 points of damage per 100 delay)
    for (const o of opts) o.score -= 0.02 * shotSpec(G, u, o.w).delay;
    opts.sort((a, b) => b.score - a.score);
    const o = opts[0];
    if (!o || o.angle == null) { send({ k: 'pass' }); return sent; }
    const angle = o.angle + gauss(rnd) * st.noiseA, power = clamp(o.power + gauss(rnd) * st.noiseP, 0.05, 1);
    if (o.w !== 'shot1') send({ k: 'weapon', w: o.w });
    if (!send({ k: 'fire', angle, power })) { send({ k: 'pass' }); return sent; }
    if (mine() && G.retreat) retreat();
    else if (mine()) send({ k: 'pass' });
    return sent;
    // after the shot: back away from the nearest enemy while it's safe, then end the turn
    function retreat() {
      const foe = foes()[0];
      if (foe && st.dodge && Math.abs(foe.x - u.x) < 40) walkTo(foe.x > u.x ? -1 : 1, G.moves);
      if (mine()) send({ k: 'pass' });
    }
  }

  // Play a whole match with one bot style per team. Returns the finished game and its intent log.
  function playOut(G, styles) {
    const log = []; let guard = 0;
    while (G.phase !== 'over' && guard++ < maxTurns(G) * 2 + 10) { // a bot turn runs its own flights; this also covers a turn handed over mid-retreat
      const its = botTurn(G, styles[G.team]); log.push(...its);
      if (G.phase === 'flight') resolve(G);
    }
    if (G.phase !== 'over') throw new Error('match did not finish');
    return { G, log };
  }

  // ---------- checksum and replay ----------
  function hash(G) {
    const r = (v) => Math.round(v * 100);
    const parts = [G.map, G.cols, G.turn, G.team, G.actor, G.spent, G.units.map((u) => u.delay).join(','), G.phase, r(G.wind), G.water, G.moves, G.winner, G.chars.join(','), G.retreat ? 1 : 0, G.fired ? 1 : 0, G.relic ? `${G.relic.state},${r(G.relic.x)},${r(G.relic.y)},${G.relic.hp},${G.relic.team}` : '-', G.zones.map((z) => `${r(z.x)},${r(z.y)},${z.until}`).join(';'),
      G.units.map((u) => `${u.id}:${r(u.x)},${r(u.y)},${u.hp},${u.alive ? 1 : 0}`).join(';'),
      G.duds.map((d) => `${d.id}:${r(d.x)},${r(d.y)},${d.fuse}`).join(';'), G.barrels.map((b) => `${b.id}:${r(b.x)},${r(b.y)}`).join(';'), G.crates.map((c) => `${c.id}:${r(c.x)},${r(c.y)},${c.kind}`).join(';'),
      G.units.map((u) => `${u.char},${u.cd.shot2},${u.cd.dash},${u.ss},${u.burn},${u.wet ? 1 : 0},${u.hits}`).join(';'), G.T.join('')];
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

  const WB = { TICK, COLS, ROWS, WATER0, GRAV, VMAX, WIND_MAX, UNIT_R, UNITS_PER_TEAM, HP, MOVE_STEPS, JUMP, RETREAT, BURN, RELIC, SUDDEN_ROUNDS, MAX_ROUNDS, suddenTurn, maxTurns, DMG_SPREAD, SS_CHARGE, DELAY, HP_MUL, CREW_HP,
    MAX_TEAMS, MAX_SIZE, MAX_UNITS, DUD, BARREL, CHARS, CHAR_IDS, CLASSES, CRATE, CRATE_KINDS, crateFirst, crateEvery, WEAPON_IDS, MAPS, MAP_IDS, pickMap, recipeFor, MapGen, STYLES, newGame, act, step, resolve, current, owner, teamUnits, charOf, shotSpec, ssReady, ssOf, cdOf, ready, passiveOf, safeStep, turnOrder, delayIf, solidAt, surfaceY, center, fits,
    predict, blastScore, botTurn, playOut, hash, replay };
  if (typeof module !== 'undefined' && module.exports) module.exports = WB; else root.WB = WB;
})(typeof window !== 'undefined' ? window : globalThis);
