// Lightkeeper engine: pure, deterministic, fixed tick. The UI only draws.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
  'use strict';
  const W = 360, H = 640, DT = 1 / 30;
  const LAMP = { x: 180, y: 590 };
  const DOCK_R = 34;          // ships inside this ring are home
  const CALM_R = 72;          // no ship-ship bumps inside the harbor ring
  const SHIP_R = 5;           // hull radius for reef hits
  const BUMP_R = 11;          // ship-ship collision distance
  const TURN = 1.05;          // rad/s a lit ship turns toward the lamp
  const BEAM_SLEW = 5.5;      // rad/s the beam follows your thumb
  const BEAM_HALF = 0.15;     // half-width of the beam in radians
  const BEAM_RANGE = 720, FOG_RANGE = 250;
  const HORN_T = 2.5, HORN_CD = 9, HORN_SLOW = 0.35;
  const MAX_WRECKS = 3;
  const HEADLANDS = [{ x: 104, y: 616, r: 34 }, { x: 256, y: 616, r: 34 }];
  const NAMES = ['Maud', 'Little Wren', 'Saltgrace', 'Pell', 'Old Tansy', 'Brightwater', 'Hester', 'Kittiwake', 'Morrow', 'Fen Lass', 'Juniper', 'Goodhope', 'Dovey', 'Sorrel'];

  // h is the starting heading in degrees: 0 = east, 90 = south (down the screen).
  const NIGHTS = [
    { id: 1, name: 'First Light', log: 'One boat tonight. Find her with the beam and she will turn toward you.',
      v: 26, par: 54, reefs: [],
      ships: [{ t: 1, x: 110, y: -10, h: 60 }, { t: 13, x: 262, y: -10, h: 118 }, { t: 25, x: -10, y: 120, h: 18 }] },
    { id: 2, name: 'The Teeth', log: 'The Teeth are out tonight. A lit boat comes straight at you, rocks or no rocks. Let her run dark until the way is clear.',
      v: 26, par: 54, reefs: [{ x: 180, y: 286, r: 26 }, { x: 124, y: 336, r: 16 }, { x: 240, y: 340, r: 16 }, { x: 180, y: 404, r: 14 }],
      ships: [{ t: 1, x: 60, y: -10, h: 60 }, { t: 10, x: 300, y: -10, h: 110 }, { t: 19, x: 180, y: -10, h: 58 }, { t: 28, x: -10, y: 210, h: 4 }] },
    { id: 3, name: 'Crossing', log: 'Two fleets home at once, port and starboard. Once a boat points at you, she keeps coming in the dark. Move on.',
      v: 26, par: 54, reefs: [{ x: 108, y: 392, r: 22 }, { x: 252, y: 392, r: 22 }],
      ships: [{ t: 1, x: -10, y: 160, h: 10 }, { t: 1.5, x: 370, y: 172, h: 170 }, { t: 11, x: -10, y: 262, h: 4 }, { t: 12, x: 370, y: 250, h: 176 }, { t: 20, x: 146, y: -10, h: 76 }, { t: 21, x: 214, y: -10, h: 104 }] },
    { id: 4, name: 'Set Current', log: 'The tide is running east. Boats you pointed home will drift. Touch them up.',
      v: 25, par: 66, current: { x: 7, y: 0 }, reefs: [{ x: 250, y: 240, r: 22 }, { x: 300, y: 446, r: 20 }, { x: 140, y: 384, r: 18 }],
      ships: [{ t: 1, x: 40, y: -10, h: 82 }, { t: 8, x: 290, y: -10, h: 96 }, { t: 16, x: -10, y: 300, h: -8 }, { t: 23, x: 96, y: -10, h: 96 }, { t: 30, x: -10, y: 124, h: 50 }, { t: 37, x: 310, y: -10, h: 100 }] },
    { id: 5, name: 'Fog', log: 'Fog. The beam reaches half as far, and you will only see a boat when your light finds her. Sweep.',
      v: 24, par: 78, fog: true, reefs: [{ x: 112, y: 420, r: 18 }, { x: 248, y: 412, r: 18 }, { x: 180, y: 476, r: 12 }],
      ships: [{ t: 1, x: 70, y: -10, h: 82 }, { t: 9, x: 290, y: -10, h: 98 }, { t: 17, x: -10, y: 300, h: 30 }, { t: 25, x: 370, y: 330, h: 136 }, { t: 33, x: 180, y: -10, h: 82 }, { t: 41, x: 60, y: -10, h: 72 }] },
    { id: 6, name: 'Storm', log: 'A blow coming in. Gusts knock dark boats off course. Keep them lit, keep them pointed, use the horn.',
      v: 26, par: 70, storm: true, current: { x: -4, y: 0 }, reefs: [{ x: 180, y: 320, r: 20 }, { x: 100, y: 436, r: 18 }, { x: 260, y: 436, r: 18 }],
      ships: [{ t: 1, x: 80, y: -10, h: 70 }, { t: 7, x: 300, y: -10, h: 100 }, { t: 14, x: -10, y: 180, h: 16 }, { t: 20, x: 370, y: 140, h: 162 }, { t: 27, x: 150, y: -10, h: 62 }, { t: 33, x: 250, y: -10, h: 98 }, { t: 40, x: -10, y: 236, h: 0 }, { t: 46, x: 370, y: 350, h: 184 }] },
  ];

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const clampAim = a => Math.max(-Math.PI + 0.04, Math.min(-0.04, a));

  function create(nightIdx, seed) {
    const def = NIGHTS[nightIdx];
    const G = {
      def, night: nightIdx, tick: 0, t: 0, rnd: rng((seed || 1) * 7919 + nightIdx * 131),
      beam: { a: -Math.PI / 2, target: -Math.PI / 2, range: def.fog ? FOG_RANGE : BEAM_RANGE },
      horn: { t: 0, cd: 0 }, ships: [], next: 0, docked: 0, wrecks: 0, over: null, stars: 0,
      gust: { at: Infinity, flash: 0, dir: 0 }, ev: [], log: [],
    };
    G.gust.at = def.storm ? 3 + G.rnd() * 3 : Infinity;
    return G;
  }

  function reefsOf(G) { return G.def.reefs.concat(HEADLANDS); }

  function inBeam(G, s) {
    const dx = s.x - LAMP.x, dy = s.y - LAMP.y, d = Math.hypot(dx, dy);
    if (d > G.beam.range || d < 1) return d < 1;
    return Math.abs(wrap(Math.atan2(dy, dx) - G.beam.a)) < BEAM_HALF + 7 / d;
  }

  function act(G, intent) {
    if (G.over) return false;
    if (intent.k === 'aim') { intent = { k: 'aim', a: +(+intent.a).toFixed(4) }; if (!isFinite(intent.a)) return false; G.beam.target = clampAim(intent.a); }
    else if (intent.k === 'horn') { if (G.horn.cd > 0) return false; G.horn.t = HORN_T; G.horn.cd = HORN_CD; G.ev.push({ k: 'horn' }); }
    else return false;
    G.log.push([G.tick, intent.k, intent.a === undefined ? null : +intent.a.toFixed(4)]);
    return true;
  }

  // Move one ship one tick. Shared by the game and the forecast so they always agree.
  function moveShip(G, s, lit, slow) {
    if (lit) { const want = Math.atan2(LAMP.y - s.y, LAMP.x - s.x); const d = wrap(want - s.h); s.h = wrap(s.h + Math.max(-TURN * DT, Math.min(TURN * DT, d))); }
    const k = slow ? HORN_SLOW : 1, c = G.def.current || { x: 0, y: 0 };
    s.x += (Math.cos(s.h) * G.def.v + c.x) * k * DT;
    s.y += (Math.sin(s.h) * G.def.v + c.y) * k * DT;
  }
  function fate(G, s) {
    if (Math.hypot(s.x - LAMP.x, s.y - LAMP.y) < DOCK_R) return 'dock';
    for (const r of reefsOf(G)) if (Math.hypot(s.x - r.x, s.y - r.y) < r.r + SHIP_R) return 'wreck';
    if (s.x < -40 || s.x > W + 40 || s.y < -60 || s.y > H + 20) return 'lost';
    return null;
  }

  // Where does this ship end up if it is lit (or dark) from now on, alone? Used by the bot and the dotted course line.
  function forecast(G, s, lit, maxT, pts) {
    const g = { x: s.x, y: s.y, h: s.h };
    const n = Math.round((maxT || 30) / DT);
    for (let i = 0; i < n; i++) {
      moveShip(G, g, lit && Math.hypot(g.x - LAMP.x, g.y - LAMP.y) <= G.beam.range, false);
      if (pts && i % 6 === 5) pts.push(g.x, g.y);
      const f = fate(G, g); if (f) return { res: f, t: (i + 1) * DT, x: g.x, y: g.y };
    }
    return { res: 'sail', t: maxT, x: g.x, y: g.y };
  }

  function step(G) {
    if (G.over) return;
    G.tick++; G.t = G.tick * DT;
    const def = G.def;
    while (G.next < def.ships.length && def.ships[G.next].t <= G.t) {
      const sp = def.ships[G.next];
      G.ships.push({ id: G.next, name: NAMES[(G.next + G.night * 3) % NAMES.length], x: sp.x, y: sp.y, h: sp.h * Math.PI / 180, st: 'sail', lit: false, litT: 0 });
      G.ev.push({ k: 'spawn', id: G.next }); G.next++;
    }
    const d = wrap(G.beam.target - G.beam.a);
    G.beam.a = clampAim(G.beam.a + Math.max(-BEAM_SLEW * DT, Math.min(BEAM_SLEW * DT, d)));
    if (G.horn.t > 0) G.horn.t = Math.max(0, G.horn.t - DT);
    if (G.horn.cd > 0) G.horn.cd = Math.max(0, G.horn.cd - DT);
    if (G.gust.flash > 0) G.gust.flash = Math.max(0, G.gust.flash - DT);
    if (G.t >= G.gust.at) {
      const kick = (G.rnd() < 0.5 ? -1 : 1) * (0.18 + G.rnd() * 0.16);
      for (const s of G.ships) if (s.st === 'sail' && !inBeam(G, s)) s.h = wrap(s.h + kick);
      G.gust.at = G.t + 6 + G.rnd() * 3; G.gust.flash = 0.8; G.gust.dir = kick; G.ev.push({ k: 'gust' });
    }
    const slow = G.horn.t > 0;
    for (const s of G.ships) {
      if (s.st !== 'sail') continue;
      s.lit = inBeam(G, s); if (s.lit) s.litT += DT;
      moveShip(G, s, s.lit, slow);
      const f = fate(G, s);
      if (f === 'dock') { s.st = 'dock'; G.docked++; G.ev.push({ k: 'dock', id: s.id, n: G.docked }); }
      else if (f) { s.st = f === 'wreck' ? 'wreck' : 'lost'; G.wrecks++; G.ev.push({ k: f, id: s.id, x: s.x, y: s.y }); }
    }
    const live = G.ships.filter(s => s.st === 'sail');
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      if (a.st !== 'sail' || b.st !== 'sail') continue;
      if (Math.hypot(a.x - LAMP.x, a.y - LAMP.y) < CALM_R && Math.hypot(b.x - LAMP.x, b.y - LAMP.y) < CALM_R) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < BUMP_R) { a.st = b.st = 'wreck'; G.wrecks += 2; G.ev.push({ k: 'wreck', id: a.id, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, both: true }); }
    }
    if (G.wrecks >= MAX_WRECKS) { G.over = 'lost'; G.stars = 0; G.ev.push({ k: 'over', won: false }); return; }
    if (G.next >= def.ships.length && !G.ships.some(s => s.st === 'sail')) {
      G.over = 'won'; G.stars = 1 + (G.wrecks === 0 ? 1 : 0) + (G.t <= def.par ? 1 : 0); G.ev.push({ k: 'over', won: true });
    }
  }

  function hash(G) { let h = G.tick | 0; for (const s of G.ships) h = (Math.imul(h, 31) + Math.round(s.x * 10) * 7 + Math.round(s.y * 10) * 13 + Math.round(s.h * 1000)) | 0; return (h >>> 0).toString(16); }

  // Replay a seed + intent log (for tests and future daily nights).
  function replay(nightIdx, seed, log, maxTicks) {
    const G = create(nightIdx, seed); let i = 0;
    while (!G.over && G.tick < (maxTicks || 9000)) { while (i < log.length && log[i][0] <= G.tick) { const [, k, a] = log[i++]; act(G, k === 'aim' ? { k, a } : { k }); } step(G); }
    return G;
  }

  const API = { W, H, DT, LAMP, DOCK_R, CALM_R, BEAM_HALF, HEADLANDS, NIGHTS, MAX_WRECKS, create, act, step, inBeam, forecast, hash, replay, reefsOf, wrap };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.LK = API;
})(typeof window !== 'undefined' ? window : globalThis);
