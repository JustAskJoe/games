(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.TBCatch = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Trickbound: catching. Everyone on the Line plays Books; every crew brings a sleeping critter; you wake it by
  // playing the way it likes, then roll. Pure data + math so it runs in Node tests and in the phone build.
  // © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.

  const LIKES = {
    nil: { name: 'Make a nil', short: 'nil' },
    dark: { name: 'Go dark and make it', short: 'dark' },
    set: { name: 'Set the house', short: 'set' },
    deuce: { name: 'Win a book with the 2♠', short: '2♠ book' },
    exact: { name: 'Take exactly your bid', short: 'exact bid' },
    nobag: { name: 'A hand with no bags', short: 'no bags' },
    big: { name: 'Win a hand by 50+', short: 'win by 50' },
    last: { name: 'Take the last book', short: 'last book' },
    spark: { name: 'Lead a spade early', short: 'spark' },
    cover: { name: 'Cover your partner’s nil', short: 'cover nil' },
    exact2: { name: 'Exact bid twice in one game', short: 'exact ×2' },
  };
  const NATURES = ['gruff', 'wry', 'tender', 'anxious', 'proud', 'dreamy'];
  const TOWNS = ['cinder', 'lamplight', 'copperbank', 'ironmere'];
  // tier: young (once a hand) · grown (once a night) · rare (once a night, uncommon). weight: encounter rarity.
  const ROSTER = [
    // Cinder Hollow · coal, stoves, soot
    { id: 'owlet', name: 'Owlet', town: 'cinder', family: 0, tier: 'young', icon: '🦉', weight: 1, likes: ['exact', 'nil'], hint: 'Sits with the kids on the platform.' },
    { id: 'salamander', name: 'Salamander', town: 'cinder', family: 1, tier: 'young', icon: '🦎', weight: 1, likes: ['set', 'spark'], hint: 'Lives in the slag-heap stove.' },
    { id: 'koi', name: 'Koi', town: 'cinder', family: 2, tier: 'young', icon: '🐟', weight: 1, likes: ['exact', 'nobag'], hint: 'The kids keep it in a jar.' },
    { id: 'badger', name: 'Badger', town: 'cinder', family: 3, tier: 'young', icon: '🦡', weight: 1, likes: ['nobag', 'big'], hint: 'Under the shift crew’s table.' },
    { id: 'sootling', name: 'Sootling', town: 'cinder', family: 0, tier: 'young', icon: '🪨', weight: 0.8, likes: ['last', 'nil'], hint: 'Comes out of any chimney in town.' },
    { id: 'cinderwick', name: 'Cinderwick', town: 'cinder', family: 1, tier: 'rare', icon: '🕯️', weight: 0.12, likes: ['exact2', 'exact'], hint: 'Only when the stove’s been banked just right.' },
    // Lamplight · moths, glass, going dark
    { id: 'mothling', name: 'Mothling', town: 'lamplight', family: 0, tier: 'young', icon: '🦋', weight: 1, likes: ['dark', 'nil'], hint: 'Circles the one working lamp.' },
    { id: 'glowworm', name: 'Glowworm', town: 'lamplight', family: 2, tier: 'grown', icon: '🐛', weight: 0.5, likes: ['last', 'exact'], hint: 'In the glass shop after dark.' },
    { id: 'lampfox', name: 'Lampfox', town: 'lamplight', family: 1, tier: 'grown', icon: '🦊', weight: 0.5, likes: ['big', 'set'], hint: 'The twins’ back room.' },
    { id: 'wickbat', name: 'Wickbat', town: 'lamplight', family: 0, tier: 'grown', icon: '🦇', weight: 0.5, likes: ['exact', 'nobag'], hint: 'Hangs in the signal box.' },
    { id: 'hare', name: 'Hare', town: 'lamplight', family: 3, tier: 'young', icon: '🐇', weight: 1, likes: ['nil', 'dark'], hint: 'Runs the platform at night.' },
    { id: 'moonmoth', name: 'Moonmoth', town: 'lamplight', family: 0, tier: 'rare', icon: '🌙', weight: 0, story: true, likes: ['dark'], hint: 'One night only. Ask Abe.' },
    // Copperbank · the press, beetles, misprints
    { id: 'frog', name: 'Frog', town: 'copperbank', family: 2, tier: 'grown', icon: '🐸', weight: 0.5, likes: ['set', 'cover'], hint: 'The press workers’ break room.' },
    { id: 'mouse', name: 'Mouse', town: 'copperbank', family: 3, tier: 'grown', icon: '🐭', weight: 0.5, likes: ['last', 'nobag'], hint: 'Only comes out for low books.' },
    { id: 'coppermite', name: 'Coppermite', town: 'copperbank', family: 3, tier: 'young', icon: '🐜', weight: 1, likes: ['exact', 'nobag'], hint: 'In the press bearings.' },
    { id: 'pressbeetle', name: 'Pressbeetle', town: 'copperbank', family: 1, tier: 'young', icon: '🪲', weight: 1, likes: ['nil', 'cover'], hint: 'Under the ink trays.' },
    { id: 'inkeel', name: 'Inkeel', town: 'copperbank', family: 2, tier: 'grown', icon: '🐍', weight: 0.5, likes: ['set', 'deuce'], hint: 'The river behind the press.' },
    { id: 'misprint', name: 'Misprint', town: 'copperbank', family: 2, tier: 'rare', icon: '❓', weight: 0.1, likes: ['exact2'], hint: 'Something went wrong at the press.' },
    // Ironmere · the rail yard, crows, brass
    { id: 'raven', name: 'Raven', town: 'ironmere', family: 0, tier: 'grown', icon: '🐦‍⬛', weight: 0.5, likes: ['set', 'last'], hint: 'The water tower.' },
    { id: 'kilnback', name: 'Kilnback', town: 'ironmere', family: 1, tier: 'grown', icon: '🐉', weight: 0.4, likes: ['big'], hint: 'The junction badge.' },
    { id: 'yardcrow', name: 'Yardcrow', town: 'ironmere', family: 0, tier: 'young', icon: '🐦', weight: 1, likes: ['last', 'set'], hint: 'On every coupling in the yard.' },
    { id: 'railhound', name: 'Railhound', town: 'ironmere', family: 3, tier: 'grown', icon: '🐕', weight: 0.5, likes: ['cover', 'nobag'], hint: 'Follows the brakemen home.' },
    { id: 'switchback', name: 'Switchback', town: 'ironmere', family: 2, tier: 'grown', icon: '🦎', weight: 0.5, likes: ['exact', 'big'], hint: 'In the switch gear.' },
    { id: 'stationcat', name: 'Stationcat', town: 'ironmere', family: 3, tier: 'rare', icon: '🐈', weight: 0, story: true, likes: ['big'], hint: 'Bracket table three. Once.' },
  ];
  const BY_ID = {}; ROSTER.forEach((c) => { BY_ID[c.id] = c; });

  // Pickup crews (slice 1: Cinder Hollow only)
  const CREWS = {
    cinder: [
      { id: 'slag', name: 'Shift crew at the slag heap', blurb: 'Moss and Pike, on break. Play to 100, five marks a seat.', house: ['moss', 'pike'], houseFam: { moss: 'badger', pike: 'salamander' }, pool: ['salamander', 'badger', 'sootling', 'cinderwick'], stake: 5 },
      { id: 'kids', name: 'Kids on the platform', blurb: 'Ivy and Tom, who should be in bed. Play to 100, five marks a seat.', house: ['ivy', 'tom'], houseFam: { ivy: 'owlet', tom: 'koi' }, pool: ['owlet', 'koi', 'sootling', 'cinderwick'], stake: 5 },
    ],
  };

  const LANTERNS = { tin: { name: 'Tin lantern', bonus: 0.10, price: 8 }, brass: { name: 'Brass lantern', bonus: 0.20, price: 18 }, glass: { name: 'Lamp-glass lantern', bonus: 0.35, price: null } };
  const LAMP_ODDS = 1 / 200;

  const rnd = (r) => (r || Math.random)();
  function pickWeighted(pool, r) {
    const items = pool.map((id) => BY_ID[id]).filter((c) => c && c.weight > 0); const total = items.reduce((a, c) => a + c.weight, 0);
    let x = rnd(r) * total; for (const c of items) { x -= c.weight; if (x <= 0) return c.id; } return items[items.length - 1].id;
  }
  function rollTemper(r) { return { nerve: Math.floor(rnd(r) * 16), patience: Math.floor(rnd(r) * 16), spark: Math.floor(rnd(r) * 16) }; }
  function genEncounter(townId, crewIx, r) {
    const crew = (CREWS[townId] || [])[crewIx]; if (!crew) return null;
    const id = pickWeighted(crew.pool, r);
    return { id, uid: Math.random().toString(36).slice(2, 9), lamp: rnd(r) < LAMP_ODDS, temper: rollTemper(r), nature: NATURES[Math.floor(rnd(r) * NATURES.length)] };
  }
  // A woken critter instance (starters and story critters too)
  function makeCritter(id, opts, r) {
    const o = opts || {};
    return { id, uid: o.uid || Math.random().toString(36).slice(2, 9), lamp: !!o.lamp, temper: o.temper || rollTemper(r), nature: o.nature || NATURES[Math.floor(rnd(r) * NATURES.length)], town: o.town || (BY_ID[id] && BY_ID[id].town) || null, at: o.at || Date.now() };
  }
  const isSharp = (c) => !!(c && c.temper && c.temper.nerve >= 12);
  const isPatient = (c) => !!(c && c.temper && c.temper.patience >= 12);
  function temperWords(t) {
    if (!t) return '';
    const w = (v, lo, mid, hi) => (v >= 12 ? hi : v >= 6 ? mid : lo);
    return [w(t.nerve, 'soft nerve', 'steady nerve', 'sharp nerve'), w(t.patience, 'restless', 'patient', 'all patience'), w(t.spark, 'dim', 'some spark', 'all spark')].join(' · ');
  }

  // Which likes fired this hand for seat 0's team. res = settle() result, G after settle.
  function likesFromHand(G, res) {
    const out = []; const t0 = res.teams[0], t1 = res.teams[1]; const me = res.players[0], pd = res.players[2];
    if (me.nil && me.tricks === 0) { out.push('nil'); if (me.blind) out.push('dark'); }
    if (t1.bid > 0 && t1.tricks < t1.bid) out.push('set');
    if (G.feats && G.feats.deuceBook[0]) out.push('deuce');
    if (t0.bid > 0 && t0.tricks === t0.bid) out.push('exact');
    if (t0.bid > 0 && t0.tricks >= t0.bid && t0.bags === 0) out.push('nobag');
    if (t0.pts - t1.pts >= 50) out.push('big');
    if (G.feats && G.feats.lastBook === 0) out.push('last');
    if (G.feats && G.feats.sparkLed[0]) out.push('spark');
    if (pd.nil && pd.tricks === 0) out.push('cover');
    return out;
  }
  const METER_PER_LIKE = 20;
  function wakeChance(meter, won, lanternBonus) {
    let p = Math.min(0.75, 0.15 + Math.max(0, Math.min(100, meter)) / 200);
    if (!won) p /= 2;
    p += lanternBonus || 0;
    return Math.min(0.9, p);
  }

  return { LIKES, NATURES, TOWNS, ROSTER, BY_ID, CREWS, LANTERNS, LAMP_ODDS, METER_PER_LIKE, genEncounter, makeCritter, rollTemper, isSharp, isPatient, temperWords, likesFromHand, wakeChance, pickWeighted };
});
