(function () {
  // Trickbound: Books on the Line — Leg 1 (the Pits). Train map, depots, packs, deck builder, quests, bracket, scenes.
  // © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
  const SP = window.SP;
  const root = document.getElementById('story');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FAM = ['dusk', 'ember', 'tide', 'grove'], FAM_NAME = ['Dusk', 'Ember', 'Tide', 'Grove'];
  const FAM_COLOR = { 0: 'var(--gold)', 1: 'var(--ember)', 2: 'var(--tide)', 3: 'var(--grove)' };
  const CATCH = window.TBCatch;
  const FAM_ICON = {}; CATCH.ROSTER.forEach((c) => { FAM_ICON[c.id] = c.icon; });
  const PERSONA_FAM = { dee: 'salamander', tally: 'owlet', foreman: 'badger', jo: 'koi', marcus: 'kilnback', tasha: 'raven' };
  const C = (s, r) => SP.card(s, r);
  const mood = (k) => { if (window.TBMusic) window.TBMusic.mood(k); }; // music: platform (cold) · depot (warm) · table (quiet)
  const ava = (p, big) => `<span class="ava${big ? ' big' : ''}" style="background:${{ dee: 'var(--ember)', tally: 'var(--tide)', foreman: 'var(--grove)', jo: 'var(--dusk)', marcus: '#7a3f5a', tasha: '#7a3f5a' }[p.key] || '#6a5a4a'}">${esc(p.name[0])}</span>`;
  function card(c, extra, tag, attrs, version) {
    const s = SP.suit(c), r = SP.rank(c); const el = tag || 'span'; const v = version || 'base'; const vcls = v === 'base' ? '' : ' v-' + v.split(':')[0];
    return `<${el} class="pc ${FAM[s]}${vcls} ${extra || ''}" aria-label="${SP.cardName(c)}" ${attrs || ''}><span class="r">${SP.RANKS[r]}</span><span class="su">${SP.SUIT_SYM[s]}</span><span class="big">${SP.SUIT_SYM[s]}</span><span class="fam">${FAM_NAME[s]}</span>${v.startsWith('lamp') ? '<span class="shine"></span>' : ''}</${el}>`;
  }

  // ---------------- The Pits ----------------
  const TOWNS = [
    { id: 'cinder', name: 'Cinder Hollow', kind: 'depot', family: 1, rule: 'standard', ruleName: 'Short shift', ruleText: 'Standard Books, first to 150. A short first night.', rules: { target: 150 }, maxTier: 'young', house: ['gus', 'birdie'], houseFam: { gus: 'salamander', birdie: 'badger' }, stake: 10, packPrice: 15,
      blurb: 'Where the Line starts. A stove, a kettle, and a table that’s never been empty.', img: 'img/depot.jpg',
      quest: { id: 'q_cinder', who: 'Birdie', text: 'Make a nil at my table and I’ll give you my brass lantern.', check: (st) => st.nilsMade > 0, reward: { lantern: 'brass' }, rewardText: '🏮 Brass lantern' },
      regulars: [['Gus', 'Books is books. Don’t let the critters fool you, it’s still the cards.'], ['Birdie', 'Dee won the Long Table before you were born. Watch how she bids.'], ['Pike', 'Every crew on the Line’s got a critter asleep on the table. Play the way it likes and it might wake up for you.']], open: () => true },
    { id: 'lamplight', name: 'Lamplight', kind: 'depot', family: 1, rule: 'goingDark', ruleName: 'Going dark', ruleText: 'Blind nil any hand, ±200. First to 250.', rules: { target: 250, goingDark: true }, maxTier: 'young', house: ['ada', 'abe'], houseFam: { ada: 'koi', abe: 'owlet' }, stake: 15, packPrice: 15,
      blurb: 'The twins run the back room. Half the town goes dark on the first hand just to feel something.', img: 'img/depot.jpg',
      quest: { id: 'q_lamp', who: 'Abe', text: 'Win a night without taking a single bag. There’s a Moonstone in it.', check: (st, r) => r.won && st.bags === 0, reward: { stone: 'moonstone' }, rewardText: '🌙 Moonstone' },
      regulars: [['Ada', 'You can go dark whenever you like here. Most people regret it.'], ['Abe', 'A Moonstone wakes a young critter all the way up. Don’t waste it.']], open: (P) => won(P, 'cinder') },
    { id: 'copperbank', name: 'Copperbank', kind: 'depot', family: 1, rule: 'nilNight', ruleName: 'The long night', ruleText: 'One partner on each team must bid nil every hand. First to 250.', rules: { target: 250, nilNight: true }, maxTier: 'grown', house: ['wick', 'soot'], houseFam: { wick: 'mouse', soot: 'kilnback' }, stake: 20, packPrice: 15, misprints: true,
      blurb: 'The old card press is still here, and it still jams. That’s where the misprints come from.', img: 'img/depot.jpg',
      quest: { id: 'q_copper', who: 'Wick', text: 'Set the house twice in one night and I’ll give you my Frog.', check: (st) => st.setsInflicted >= 2, reward: { familiar: 'frog' }, rewardText: '🐸 Frog · Hop' },
      regulars: [['Wick', 'The long night is simple: somebody on your side goes nil, every hand, no exceptions.'], ['Soot', 'Packs from our press come out wrong sometimes. Collectors pay for wrong.']], open: (P) => won(P, 'lamplight') },
    { id: 'ironmere', name: 'Ironmere', kind: 'junction', family: 1, ruleName: 'Junction bracket', ruleText: 'Three tables in a row. Lose one and the bracket resets. Entry 30 marks.', maxTier: 'grown', stake: 0, entry: 30, packPrice: 20,
      blurb: 'The first junction. Three tables, a brass ticket punch for the winners, and Tasha and Marcus waiting at the second one.', img: 'img/longtable.jpg',
      tables: [
        { name: 'Table one · Hal & June', house: ['hal', 'june'], houseFam: { hal: 'badger', june: 'owlet' }, rules: { target: 250 }, ruleText: 'Standard Books, first to 250.' },
        { name: 'Table two · Tasha & Marcus', house: ['tasha', 'marcus'], houseFam: { tasha: 'raven', marcus: 'kilnback' }, rules: { target: 250, mirror: true }, ruleText: 'The miner’s count: bid your night.' },
        { name: 'Table three · The Foreman & Tally', house: ['foreman', 'tally'], houseFam: { foreman: 'badger', tally: 'owlet' }, rules: { target: 250, goingDark: true }, ruleText: 'Going dark: blind nil any hand.' },
      ],
      badge: { familiar: 'kilnback', promo: { c: C(1, 12), v: 'promo:ironmere', name: 'Ironmere Lantern Ace' } },
      regulars: [['The Foreman', 'Three tables. Nobody gets a seat at the Long Table without a punch from every junction.']], open: (P) => won(P, 'copperbank') },
  ];
  const town = (id) => TOWNS.find((t) => t.id === id);
  const won = (P, id) => (P.towns[id] && P.towns[id].won > 0);

  // ---------------- Progress ----------------
  const P = {};
  let dbDoc = null;
  function fresh() { return { v: 3, partner: 'dee', owned: [], critters: [], seen: [], lanterns: { tin: 0, brass: 0, glass: 0 }, enc: {}, growth: {}, marks: 30, cards: {}, deck: {}, towns: {}, quests: {}, promos: [], stones: { moonstone: 0 }, flags: {}, nights: 0, lastFam: null, voices: 'quiet', seated: false }; }
  function assignProg(src) { const f = fresh(); Object.assign(P, f, src || {}); for (const k of ['towns', 'quests', 'cards', 'deck', 'growth', 'flags', 'stones', 'lanterns', 'enc']) P[k] = Object.assign({}, f[k], (src && src[k]) || {}); P.owned = (P.owned || []).filter((id) => SP.FAMILIARS[id]); P.promos = P.promos || []; P.critters = (P.critters || []).filter((c) => c && SP.FAMILIARS[c.id]); P.seen = P.seen || [];
    for (const id of P.owned) if (!P.critters.some((c) => c.id === id)) P.critters.push(CATCH.makeCritter(id)); // older saves: give every critter a temperament
    for (const c of P.critters) if (!P.owned.includes(c.id)) P.owned.push(c.id);
    for (const id of P.owned) if (!P.seen.includes(id)) P.seen.push(id); }
  const inst = (id) => P.critters.find((c) => c.id === id) || null;
  function wake(id, opts) { const c = CATCH.makeCritter(id, opts); P.critters.push(c); if (!P.owned.includes(id)) P.owned.push(id); if (!P.seen.includes(id)) P.seen.push(id); return c; }
  async function loadProgress() {
    let local = null; try { local = JSON.parse(localStorage.getItem('tb-line') || 'null'); } catch (e) { /* none */ }
    assignProg(local);
    try {
      const user = window.claude && window.claude.use ? await window.claude.use('user') : null;
      const db = window.claude && window.claude.use ? await window.claude.use('db') : null;
      const uid = user ? await user.id() : null;
      if (db && uid) { dbDoc = db.doc('data/users/' + uid + '/line'); const snap = await dbDoc.get(); if (snap.exists) { const d = snap.data(); if (!local || (d.nights || 0) >= (local.nights || 0)) assignProg(d); } }
    } catch (e) { dbDoc = null; }
  }
  function save() {
    const body = JSON.parse(JSON.stringify(P));
    try { localStorage.setItem('tb-line', JSON.stringify(body)); } catch (e) { /* ignore */ }
    if (dbDoc) dbDoc.set(body).catch(() => { /* keep local */ });
  }
  const owned = (id) => P.owned.includes(id);
  const tierOk = (id, cap) => SP.TIER_RANK[SP.FAMILIARS[id].tier] <= SP.TIER_RANK[cap];
  const versionsOf = (c) => ['base'].concat(P.cards[c] || []);
  const haveVersion = (c, v) => v === 'base' || (P.cards[c] || []).includes(v);
  function addVersion(c, v) { if (haveVersion(c, v)) return false; (P.cards[c] = P.cards[c] || []).push(v); return true; }

  // ---------------- Scenes (the conversation car) ----------------
  function scene(lines, then, opts) {
    root.hidden = false; mood('platform'); let i = 0; const img = (opts && opts.img) || 'img/car.jpg';
    const draw = () => {
      const L = lines[i];
      root.innerHTML = `<section class="scene on"><img class="art" src="${img}" alt=""><div class="shade"></div>
        <div class="copy" style="gap:14px"><span class="eyebrow">${esc((opts && opts.where) || 'The conversation car')}</span>
        <div class="line-box"><b>${esc(L[0])}</b><p>${L[1]}</p></div></div></section>
        <div class="story-nav"><button class="skip" type="button" data-s="sceneskip">Skip</button><div class="dots">${lines.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div><button class="btn primary" type="button" data-s="scenenext">${i + 1 < lines.length ? 'Next →' : esc((opts && opts.last) || 'Continue →')}</button></div>`;
    };
    sceneState = { next: () => { if (i + 1 < lines.length) { i++; draw(); } else then(); }, skip: then };
    draw();
  }
  let sceneState = null;

  const SCENES = {
    arrive: [['Dee', 'You got off at the right stop. Cinder Hollow. That deck in your bag, that was your grandmother’s. Mind if I look?'],
      ['Dee', 'Thought so. The critters are asleep. They do that when nobody plays. We play Books here, every night the train doesn’t come, which is most nights.'],
      ['Dee', 'Rules are simple. Bid your books, follow suit, night beats everything. I’ll sit across from you. Pick two critters to wake first.']],
    cinderWin: [['Dee', 'See? They woke up. Gus hates losing to a new deck. Lamplight’s next up the Line; the twins run it, and they go dark for sport.'],
      ['Tasha', '(from the platform) Cute deck. We’ll be at Ironmere when you’re done with the kiddie tables.']],
    lampWin: [['Dee', 'Going dark at the first hand. Every time. I love the twins but they’ve got no sense.'],
      ['Dee', 'Copperbank’s the last stop before the junction. The press is still running there. Ask about the misprints.']],
    copperWin: [['Dee', 'The long night. Hardest rule on the Line and you ran it. Ironmere’s a junction: three tables, and a brass punch if you take all three.'],
      ['Marcus', '(across the car) Tasha says you’re good. Tasha says that about nobody. Table two. Don’t be late.']],
    deeLeaves: [['Dee', 'Three tables. A junction punch. Your grandmother would have been insufferable about this.'],
      ['Dee', 'There was a letter at the depot. My sister, back home. I’m taking the morning train.'],
      ['Dee', 'No. Don’t. You keep going up the Line. I’ll be at Terminus for the Long Table if I have to walk the rails. Play Books, kid.'],
      ['Marcus', '(later, from the next seat) Tasha signed with the Stationmaster this morning. Didn’t tell me. So. I guess I’m riding with you to the Reach.']],
  };

  // ---------------- Intro + starter ----------------
  const INTRO = [
    { html: `<img class="art" src="img/depot.jpg" alt="A depot card room at night"><div class="shade"></div><div class="copy"><span class="eyebrow rise">One Fifty Labs presents</span><h1 class="title rise d1">Trickbound</h1><p class="rise d2" style="font-family:var(--display);font-size:clamp(22px,4vw,40px);color:var(--gold)">Books on the Line</p><span class="eyebrow rise d3" style="color:#CBBDC8;letter-spacing:1.5px">© 2026 F Lane d/b/a One Fifty Labs · AI mood reference, not final art</span></div>` },
    { html: `<img class="art" src="img/critters.jpg" alt="Lantern critters waking from cards"><div class="shade"></div><div class="copy"><span class="eyebrow rise">Lantern critters</span><h2 class="rise d1">Miners kept them in their decks for luck. They wake at a real table.</h2><p class="rise d2">Each one bends a rule when it counts, and each one has a voice.</p></div>` },
    { html: `<img class="art" src="img/longtable.jpg" alt="The Long Table at Terminus"><div class="shade"></div><div class="copy"><span class="eyebrow rise">The Line</span><h2 class="rise d1">As long as the Long Table is played, the trains keep running.</h2><p class="rise d2">This is the last season. Get off at Cinder Hollow.</p></div>`, last: true },
  ];
  let sc = 0;
  function showIntro(i) {
    sc = i; root.hidden = false; mood('platform');
    root.innerHTML = INTRO.map((s, k) => `<section class="scene${k === i ? ' on' : ''}">${s.html}</section>`).join('') +
      `<div class="story-nav"><button class="skip" type="button" data-s="introskip">Skip</button><div class="dots">${INTRO.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div><button class="btn primary" type="button" data-s="intronext">${INTRO[i].last ? 'Get off here →' : 'Next →'}</button></div>`;
  }
  function afterIntro() { if (!P.flags.started) return opening(); map(); }
  // The walkable opening (world.js): look + name, the train, the platform, Dee, then a short first duel.
  let openingStarter = null;
  function opening() {
    if (!window.TBWorld) return scene(SCENES.arrive, () => starterScreen(), { where: 'Cinder Hollow depot', last: 'Wake two critters' });
    window.TBWorld.start(P, {
      save,
      starter(cb) { starterSel = []; openingStarter = cb; starterScreen(); },
      duel() {
        const t = TOWNS[0]; const fam = P.owned[0] || 'owlet'; P.lastFam = fam; save();
        night = { town: t, familiar: fam, tableIx: 0, tutorial: true };
        root.hidden = true; root.innerHTML = ''; mood('table');
        window.TBUI.start({ mode: 'familiar', coach: P.voices === 'full', helpers: true, voices: P.voices, seated: P.seated, partner: P.partner, familiar: fam, owned: P.owned.slice(), deckVersions: Object.assign({}, P.deck),
          club: { id: 'tutorial', name: 'Cinder Hollow · first night', target: 100, rules: { target: 100 }, house: t.house, houseFam: t.houseFam, stake: 0, tableIx: 0 } });
      },
    });
  }
  let starterSel = [];
  function famCard(F, sel, attr, dim) {
    const nxt = SP.FAM_NEXT[F.id]; const g = P.growth[F.id] || 0; const c = inst(F.id); const need = c && CATCH.isPatient(c) ? 2 : 3;
    return `<button class="fam-card${sel ? ' sel' : ''}${dim ? ' dim' : ''}${c && c.lamp ? ' lamp' : ''}" type="button" data-fk="${F.id}" ${attr || ''}><span class="ic">${FAM_ICON[F.id]}</span><span><span class="fm" style="color:${FAM_COLOR[F.family]}">${esc(FAM_NAME[F.family])} · ${esc(F.tier)}${F.tier !== 'young' && !F.perHand ? ' · once a night' : ''}</span><br><b>${esc(F.name)} · ${esc(F.ability)}</b><br><span class="ab">${esc(F.desc)}${c && CATCH.isSharp(c) && F.sharpDesc ? ' <b style="color:var(--gold)">Sharp: ' + esc(F.sharpDesc) + '</b>' : ''}</span>${c ? `<br><span class="ab">${c.lamp ? '✨ lamp-lit · ' : ''}${esc(c.nature)} · ${esc(CATCH.temperWords(c.temper))}</span>` : ''}${owned(F.id) && nxt && !owned(nxt) ? `<br><span class="ab">Growth ${Math.min(g, need)}/${need} → ${FAM_ICON[nxt]} ${esc(SP.FAMILIARS[nxt].name)}</span>` : ''}</span></button>`;
  }
  function starterScreen() {
    root.hidden = false; const young = Object.values(SP.FAMILIARS).filter((F) => F.tier === 'young');
    root.innerHTML = `<div class="screen"><div class="screen-in"><span class="eyebrow">Your grandmother’s deck</span><h2>Wake two critters.</h2><p class="lead">You bring one to each table. The rest wake as you play: grow them, trade for them, earn them at the junctions.</p>
      <div class="fam-pick">${young.map((F) => famCard(F, starterSel.includes(F.id))).join('')}</div>
      <div style="display:flex;justify-content:flex-end"><button class="btn primary" type="button" data-s="starterdone" ${starterSel.length === 2 ? 'data-focus="1"' : 'disabled'}>Wake ${starterSel.map((id) => FAM_ICON[id]).join(' ') || '…'}</button></div></div></div>`;
  }

  // ---------------- The map ----------------
  function topbar(extra) {
    return `<div class="home-top"><div><span class="eyebrow">The Line · the Pits</span><h2>${extra || 'Where to?'}</h2></div><div style="display:flex;gap:8px;align-items:center"><span class="marks">◉ ${P.marks} marks</span><button class="btn sm" type="button" data-s="binder">Binder</button></div></div>`;
  }
  function partnerRow() {
    const pp = SP.PERSONAS[P.partner]; const pf = SP.FAMILIARS[PERSONA_FAM[P.partner] || 'owlet'];
    return `<div class="partner-row">${ava(pp)}<div><b>${esc(pp.name)}</b>, your partner · brings ${FAM_ICON[pf.id]} ${esc(pf.name)}<br><span class="ab">${esc(pp.blurb)}</span></div></div>`;
  }
  function map(flash) {
    root.hidden = false; mood('platform'); window.TBUI && (window.TBUI.ui && (window.TBUI.ui.seated = P.seated));
    const stops = TOWNS.map((t, i) => {
      const st = P.towns[t.id] || { won: 0, played: 0 }; const isOpen = t.open(P);
      const status = !isOpen ? 'Locked' : t.kind === 'junction' ? (st.won ? 'Punched ✓' : st.bracket ? `Table ${st.bracket + 1} of 3` : 'Open') : st.won ? `Won ${st.won} of ${st.played}` : st.played ? `0 of ${st.played}` : 'Open';
      return `<button class="stop${isOpen ? '' : ' locked'}${t.kind === 'junction' ? ' junction' : ''}" type="button" data-town="${t.id}" ${isOpen ? '' : 'disabled'}><span class="dot"></span><span class="stop-body"><span class="club-top"><span class="fm" style="color:${FAM_COLOR[t.family]}">${esc(t.ruleName)} · ${esc(t.maxTier)}</span><span class="status">${status}</span></span><b>${esc(t.name)}</b><span class="ab">${esc(t.blurb)}</span></span></button>`;
    }).join('');
    root.innerHTML = `<div class="screen"><div class="screen-in">${flash ? `<div class="flash">${flash}</div>` : ''}${topbar()}${partnerRow()}
      <div class="rail">${stops}<div class="stop locked next"><span class="dot"></span><span class="stop-body"><span class="fm" style="color:var(--tide)">The River Reach</span><b>Millrace</b><span class="ab">Next leg. Coming later.</span></span></div></div>
      <div class="home-foot"><button class="btn" type="button" data-s="classic" title="Plain Books, no critters, no progress">Practice table (no progress)</button><button class="btn" type="button" data-s="deckbuilder">Deck</button><button class="btn" type="button" data-s="settings">Voices: ${esc(P.voices)}</button><button class="btn" type="button" data-s="jump" title="Dev: jump to any scene">Jump ⏩</button><span class="ab">Progress saves to this device${dbDoc ? ' and your account' : ''}.</span></div>
      </div></div>`;
  }

  // ---------------- Depot ----------------
  let cur = null; // current town
  function depot(t, flash) {
    cur = t; root.hidden = false; mood('depot'); const st = P.towns[t.id] || { won: 0, played: 0 };
    const q = t.quest; const qdone = q && P.quests[q.id];
    const back = t.kind === 'junction'
      ? `<div class="card-ish"><span class="fm" style="color:var(--gold)">The bracket · entry ${t.entry} marks</span><b>${esc(t.ruleText)}</b>${t.tables.map((tb, i) => `<div class="tbl-row${(st.bracket || 0) === i && !st.won ? ' now' : ''}"><span>${(st.bracket || 0) > i || st.won ? '✓ ' : ''}${esc(tb.name)}</span><span class="ab">${esc(tb.ruleText)} · ${tb.house.map((k) => FAM_ICON[tb.houseFam[k]]).join(' ')}</span></div>`).join('')}<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn primary" type="button" data-s="sitdown" ${P.marks < t.entry && !(st.bracket > 0) ? 'disabled' : ''}>${st.won ? 'Play the bracket again' : st.bracket ? `Table ${st.bracket + 1}` : `Enter (${t.entry} marks)`}</button></div></div>`
      : `<div class="card-ish"><span class="fm" style="color:var(--gold)">The back room · stake ${t.stake} marks</span><b>${esc(t.ruleName)}: ${esc(t.ruleText)}</b><span class="ab">House: ${t.house.map((k) => `${esc(SP.PERSONAS[k].name)} ${FAM_ICON[t.houseFam[k]]}`).join(' · ')}. A night is a full game: first team to ${t.rules.target} points, usually several hands. Win the night: +${t.stake * 2} marks and the next stop opens. Lose: −${t.stake}.</span><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn primary" type="button" data-s="sitdown">Sit down</button></div></div>`;
    root.innerHTML = `<div class="screen"><div class="screen-in">${flash ? `<div class="flash">${flash}</div>` : ''}
      <div class="depot-art">${HUB_TOWNS[t.id] && window.TBWorld ? '<canvas role="img" aria-label="The waiting-hall card room"></canvas>' : `<img src="${t.img}" alt="">`}<div class="depot-title"><span class="eyebrow">${t.kind === 'junction' ? 'Junction' : 'Depot'}</span><h2>${esc(t.name)}</h2></div><span class="marks">◉ ${P.marks}</span></div>
      ${back}
      ${HUB_TOWNS[t.id] && window.TBWorld ? '' : crewsHTML(t)}
      <div class="card-ish"><span class="fm" style="color:var(--ember)">The counter</span>
        <div class="tbl-row"><span>🏮 Tin lantern · +10% to wake a critter${P.lanterns.tin ? ` · you have ${P.lanterns.tin}` : ''}</span><button class="btn sm" type="button" data-s="buylantern:tin" ${P.marks < CATCH.LANTERNS.tin.price ? 'disabled' : ''}>Buy · ${CATCH.LANTERNS.tin.price}</button></div>
        <div class="tbl-row"><span>🏮 Brass lantern · +20%${P.lanterns.brass ? ` · you have ${P.lanterns.brass}` : ''}</span><button class="btn sm" type="button" data-s="buylantern:brass" ${P.marks < CATCH.LANTERNS.brass.price ? 'disabled' : ''}>Buy · ${CATCH.LANTERNS.brass.price}</button></div>
        <div class="tbl-row"><span>Pits pack · 5 cards${t.misprints ? ', from the jammed press' : ''}</span><button class="btn sm primary" type="button" data-s="buypack" ${P.marks < t.packPrice ? 'disabled' : ''}>Buy · ${t.packPrice}</button></div>
        ${P.stones.moonstone > 0 ? `<div class="tbl-row"><span>🌙 Moonstone × ${P.stones.moonstone} · wakes a young critter all the way up</span><button class="btn sm" type="button" data-s="usestone">Use</button></div>` : ''}
        <div class="tbl-row"><span>Deck · ${Object.values(P.cards).reduce((a, v) => a + v.length, 0)} special cards owned</span><button class="btn sm" type="button" data-s="deckbuilder">Build</button></div></div>
      ${q ? `<div class="card-ish"><span class="fm" style="color:var(--tide)">Quest board</span><b>${esc(q.who)}: “${esc(q.text)}”</b><span class="ab">${qdone ? 'Done. ' + esc(q.rewardText) + ' is yours.' : 'Reward: ' + esc(q.rewardText)}</span></div>` : ''}
      <div class="card-ish"><span class="fm" style="color:var(--grove)">Regulars</span>${t.regulars.map(([w, l]) => `<p class="reg"><b>${esc(w)}:</b> ${esc(l)}</p>`).join('')}</div>
      <div class="home-foot">${HUB_TOWNS[t.id] ? '<button class="btn primary" type="button" data-s="hub">Walk outside</button>' : ''}<button class="btn" type="button" data-s="map">Back to the train</button><button class="btn" type="button" data-s="jump">Jump ⏩</button></div>
    </div></div>`;
    // Cinder Hollow's hall is the isometric diorama (#21): Lamp-lit once the back room is won
    const hall = root.querySelector('.depot-art canvas'); if (hall) window.TBWorld.drawHall(hall, { lit: !!st.won });
  }

  // ---------------- Pickup crews (catching) ----------------
  function encounters(t) {
    const crews = CATCH.CREWS[t.id] || []; const list = P.enc[t.id] || (P.enc[t.id] = []);
    crews.forEach((c, i) => { if (!list[i]) list[i] = CATCH.genEncounter(t.id, i); });
    return list;
  }
  function rerollEncounter(t, i) { if (P.enc[t.id]) P.enc[t.id][i] = CATCH.genEncounter(t.id, i); }
  function critterLine(enc, seen) {
    const c = CATCH.BY_ID[enc.id];
    return `<span class="ab">${seen ? c.icon : '❔'} <b>${seen ? esc(c.name) : '???'}</b> asleep on the table${enc.lamp ? ' · <b style="color:var(--gold)">lamp-lit</b>' : ''}. Likes: ${c.likes.map((k) => esc(CATCH.LIKES[k].name.toLowerCase())).join(', ')}.</span>`;
  }
  function crewsHTML(t) {
    const crews = CATCH.CREWS[t.id]; if (!crews || !crews.length) return '';
    const encs = encounters(t);
    return `<div class="card-ish"><span class="fm" style="color:var(--gold)">Around town · pickup games</span><span class="ab">Everyone on the Line plays. Short games to 100. Each crew brings a sleeping critter; play the way it likes and you might wake it.</span>
      ${crews.map((c, i) => `<div class="tbl-row" style="flex-direction:column;align-items:stretch;gap:4px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${esc(c.name)}</b><button class="btn sm primary" type="button" data-s="pickup:${i}" ${P.marks < c.stake ? 'disabled' : ''}>Play · ${c.stake}</button></div><span class="ab">${esc(c.blurb)}</span>${critterLine(encs[i], P.seen.includes(encs[i].id))}</div>`).join('')}</div>`;
  }
  function wakeScreen(t, pk, notes) {
    root.hidden = false; const c = CATCH.BY_ID[pk.enc.id]; const seen = P.seen.includes(c.id);
    const opt = (key, label, bonus) => { const p = CATCH.wakeChance(pk.meter, pk.won, bonus); return `<button class="btn${key === 'none' ? ' primary' : ''}" type="button" data-s="wake:${key}" style="justify-content:space-between">${label}<span>${Math.round(p * 100)}%</span></button>`; };
    const opts = [opt('none', 'Just try', 0)].concat(['tin', 'brass', 'glass'].filter((k) => P.lanterns[k] > 0).map((k) => opt(k, `Use a ${CATCH.LANTERNS[k].name.toLowerCase()} (${P.lanterns[k]})`, CATCH.LANTERNS[k].bonus)));
    const likes = c.likes.map((k) => `<span class="like${pk.hits[k] ? ' hit' : ''}">${pk.hits[k] ? '✓ ' : ''}${esc(CATCH.LIKES[k].short)}</span>`).join('');
    root.innerHTML = `<div class="screen"><div class="screen-in"><span class="eyebrow">${esc(t.name)} · after the game</span><h2>${pk.won ? 'You took it.' : 'They took it.'} The critter stirs.</h2>
      <div class="flash">${notes.join('<br>')}</div>
      <div class="card-ish" style="align-items:center;text-align:center"><span class="wild-ico${pk.enc.lamp ? ' lamp' : ''}" style="font-size:54px">${c.icon}</span><b>${esc(c.name)}${pk.enc.lamp ? ' · lamp-lit ✨' : ''}</b><span class="ab">${esc(FAM_NAME[c.family])} · ${esc(c.tier)} · ${esc(SP.FAMILIARS[c.id] ? SP.FAMILIARS[c.id].ability + ': ' + SP.FAMILIARS[c.id].desc : 'Its ability isn’t known yet.')}</span><div class="likes" style="justify-content:center">${likes}</div><div class="meter" style="width:100%"><span style="width:${pk.meter}%"></span></div><span class="ab">Wake meter ${pk.meter}%${pk.won ? '' : ' · halved for the loss'}${seen ? '' : ' · first time you’ve seen one'}</span></div>
      <div class="menu" style="display:grid;gap:8px">${opts.join('')}<button class="btn" type="button" data-s="wake:skip">Leave it sleeping</button></div>
    </div></div>`;
  }
  function wakeResult(t, pk, key) {
    const c = CATCH.BY_ID[pk.enc.id]; const bonus = key === 'none' || key === 'skip' ? 0 : CATCH.LANTERNS[key].bonus; if (bonus) P.lanterns[key]--;
    if (!P.seen.includes(c.id)) P.seen.push(c.id);
    const p = key === 'skip' ? 0 : CATCH.wakeChance(pk.meter, pk.won, bonus); const ok = Math.random() < p;
    rerollEncounter(t, pk.crewIx);
    let html;
    if (ok) {
      const inst0 = wake(c.id, { lamp: pk.enc.lamp, temper: pk.enc.temper, nature: pk.enc.nature, town: t.id });
      const dup = P.critters.filter((x) => x.id === c.id).length > 1;
      html = `<h2>${c.icon} ${esc(c.name)} wakes up.</h2><p class="lead">${pk.enc.lamp ? 'It’s lamp-lit. It glows. The crew goes quiet. ' : ''}${dup ? 'Another one for the binder; the sharper of the two rides with you. ' : 'It climbs into your bag like it’s always been there. '}<b>${esc(inst0.nature)}</b> · ${esc(CATCH.temperWords(inst0.temper))}${CATCH.isSharp(inst0) ? ' · <b style="color:var(--gold)">sharp</b>' : ''}.</p>`;
    } else html = `<h2>${key === 'skip' ? 'You leave it be.' : 'It curls back up.'}</h2><p class="lead">${key === 'skip' ? 'It’ll be around.' : pick(['Not tonight. It’ll be at a table in this town again.', 'It opens one eye, thinks about it, and goes back to sleep.', 'Close. The crew says it nearly stood up.'])}</p>`;
    save();
    root.innerHTML = `<div class="screen"><div class="screen-in"><span class="eyebrow">${esc(t.name)}</span>${html}<div style="display:flex;justify-content:flex-end;gap:10px"><button class="btn" type="button" data-s="binder">Binder</button><button class="btn primary" type="button" data-s="town" data-focus="1">${HUB_TOWNS[t.id] ? 'Back outside' : 'Back to the depot'}</button></div></div></div>`;
  }

  // ---------------- Walkable town (Cinder Hollow) ----------------
  const HUB_TOWNS = { cinder: true };
  function hub(t, from) {
    if (!window.TBWorld || !HUB_TOWNS[t.id]) return depot(t);
    cur = t; const encs = encounters(t); save();
    const crews = CATCH.CREWS[t.id].map((crew, i) => {
      const e = encs[i]; const c = CATCH.BY_ID[e.id]; const seen = P.seen.includes(e.id);
      return { name: crew.name, stake: crew.stake, badge: seen ? c.icon : '❔', lamp: e.lamp, dim: !seen,
        onTalk: () => {
          const who = crew.house.map((k) => SP.PERSONAS[k].name);
          const intro = i === 0 ? [[who[0], 'Warm side of the heap’s ours. Five marks a seat, first to a hundred.'], [who[1], `${seen ? 'That ' + c.name : 'Whatever that is'} has been asleep on our table all week. Likes it when somebody ${c.likes.map((k) => CATCH.LIKES[k].name.toLowerCase()).join(', or ')}.`]]
            : [[who[0], 'You play? We play. Five marks. Don’t tell our mum.'], [who[1], `${seen ? 'The ' + c.name : 'The thing in the jar'} wakes up sometimes. It likes when you ${c.likes.map((k) => CATCH.LIKES[k].name.toLowerCase()).join(', or ')}.`]];
          if (e.lamp) intro.push(['', '(It’s glowing. Faintly, but it’s glowing.)']);
          window.TBWorld.say(intro, null, P.marks >= crew.stake ? [{ label: `Sit down · ${crew.stake} marks`, fn: () => { night = { town: t, familiar: night && night.familiar, tableIx: -1, pickup: { crewIx: i, crew, enc: e } }; familiarScreen(t, -1); } }, { label: 'Not now' }] : [{ label: 'Not enough marks' }]);
        } };
    });
    const st = P.towns[t.id] || { won: 0 };
    const dee = () => st.won ? [['Dee', 'Lamplight’s next up the Line when you’re ready. Train’s on the platform. Or stay and empty the crews’ pockets a while.']]
      : P.flags.firstDuel ? [['Dee', 'Back room’s through the door: first to 150, ten a seat. Win it and Lamplight opens.'], ['Dee', 'Out here the crews play for pocket money, and every table’s got a critter asleep on it. Play the way it likes and it might wake for you.']]
      : [['Dee', 'Go on in.']];
    const intro = !P.flags.hubIntro ? (P.flags.hubIntro = true, save(), [['Dee', `This is Cinder Hollow, ${P.name || 'kid'}. Small, but everybody plays.`], ['Dee', 'The back room is the real game. Win there and the Line opens up.'], ['Dee', 'Those crews — Moss and Pike at the heap, the kids on the platform — they’ll play you for pocket money. See the critters asleep over their tables? Those are the ones you can wake.']]) : null;
    window.TBWorld.hub(P, { door: () => depot(t), train: () => { if (P.enc[t.id]) delete P.enc[t.id]; cur = null; save(); map(); } }, { from, crews, dee, intro, lit: !!st.won });
  }

  // ---------------- Packs ----------------
  function genPack(t) {
    const r = Math.random; const out = [];
    const rand = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    for (let k = 0; k < 3; k++) out.push({ c: C(rand(0, 3), rand(0, 8)), v: 'pits', tier: 'common' });
    out.push({ c: C(rand(0, 3), rand(9, 12)), v: 'pits', tier: rand(9, 12) === 12 ? 'rare' : 'uncommon' });
    const x = r(); const anyc = C(rand(0, 3), rand(0, 12));
    if (x < 0.2) out.push({ c: anyc, v: 'lamp', tier: 'lamp-lit' });
    else if (t.misprints && x < 0.35) out.push({ c: anyc, v: 'mis', tier: 'misprint' });
    else out.push({ c: C(rand(0, 3), rand(0, 8)), v: 'pits', tier: 'common' });
    return out;
  }
  const SELL = { common: 3, uncommon: 5, rare: 8, 'lamp-lit': 10, misprint: 12 };
  let pack = null;
  function ripScreen() {
    root.hidden = false;
    const cards = pack.cards.map((k, i) => `<button class="rip${k.flipped ? ' up' : ''}" type="button" data-rip="${i}"><span class="rip-inner"><span class="rip-back"></span><span class="rip-front">${card(k.c, '', 'span', '', k.v)}</span></span><span class="rip-cap">${k.flipped ? `${esc(k.tier)}${k.dup ? ' · dup +' + SELL[k.tier] : ' · new'}` : ''}</span></button>`).join('');
    const done = pack.cards.every((k) => k.flipped);
    root.innerHTML = `<div class="screen"><div class="screen-in"><span class="eyebrow">${esc(cur.name)} · the counter</span><h2>${done ? 'That’s the pack.' : 'Tap a card to turn it.'}</h2>
      <div class="rip-row">${cards}</div>
      ${done ? `<p class="lead">${pack.lantern ? '🏮 A tin lantern was tucked in the pack. ' : ''}${pack.cards.filter((k) => !k.dup).length} new, ${pack.cards.filter((k) => k.dup).length} duplicates sold back for ${pack.cards.filter((k) => k.dup).reduce((a, k) => a + SELL[k.tier], 0)} marks. ◉ ${P.marks} marks.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" type="button" data-s="deckbuilder">Put them in the deck</button><button class="btn primary" type="button" data-s="depot" data-focus="1">Back to the counter</button></div>` : '<p class="lead">Five cards from the Pits set. One of them is uncommon or better.</p>'}
    </div></div>`;
  }
  function flip(i) {
    const k = pack.cards[i]; if (k.flipped) return; k.flipped = true;
    if (addVersion(k.c, k.v)) k.dup = false; else { k.dup = true; P.marks += SELL[k.tier]; }
    save(); ripScreen();
  }

  // ---------------- Binder + deck builder ----------------
  function binder() {
    root.hidden = false;
    const TN = { cinder: 'Cinder Hollow', lamplight: 'Lamplight', copperbank: 'Copperbank', ironmere: 'Ironmere' };
    const towns = CATCH.TOWNS.map((tid) => {
      const slots = CATCH.ROSTER.filter((c) => c.town === tid).map((c) => {
        const have = owned(c.id); const seen = P.seen.includes(c.id); const ci = inst(c.id); const nxt = SP.FAM_NEXT[c.id]; const g = P.growth[c.id] || 0; const need = ci && CATCH.isPatient(ci) ? 2 : 3;
        const F = SP.FAMILIARS[c.id];
        return `<div class="slot${have ? '' : seen ? ' missing' : ' missing soon'}${ci && ci.lamp ? ' lamp' : ''}"><span class="ic${have ? '' : ' sil'}">${seen || have ? c.icon : '❔'}</span><span class="ab"><b>${have || seen ? esc(c.name) : '???'}</b><br>${esc(c.tier)}${have && F ? ' · ' + esc(F.ability) : ''}${ci ? `<br>${ci.lamp ? '✨ ' : ''}${esc(ci.nature)}${CATCH.isSharp(ci) ? ' · sharp' : ''}` : ''}${have && nxt && !owned(nxt) ? `<br>growth ${Math.min(g, need)}/${need}` : ''}${!have ? '<br>' + (seen ? 'seen, asleep' : esc(c.hint)) : ''}</span></div>`;
      }).join('');
      return `<div class="binder-town">${esc(TN[tid])} <span class="ab">${CATCH.ROSTER.filter((c) => c.town === tid && owned(c.id)).length} of 6</span></div><div class="binder-row six">${slots}</div>`;
    }).join('');
    const specials = Object.values(P.cards).reduce((a, v) => a + v.length, 0); const lamps = P.critters.filter((c) => c.lamp).length;
    root.innerHTML = `<div class="screen"><div class="screen-in"><div class="home-top"><div><span class="eyebrow">Binder</span><h2>${P.owned.length} of ${CATCH.ROSTER.length} critters awake</h2></div><button class="btn" type="button" data-s="${cur ? 'depot' : 'map'}">Back</button></div>
      <p class="lead">Every crew on the Line keeps a sleeping critter on the table. Play the way it likes, then try to wake it. ${P.seen.length} seen · ${lamps} lamp-lit · lanterns: ${P.lanterns.tin} tin, ${P.lanterns.brass} brass${P.lanterns.glass ? ', ' + P.lanterns.glass + ' lamp-glass' : ''}.</p>
      <div class="binder">${towns}</div>
      <div class="card-ish"><span class="fm" style="color:var(--gold)">Cards</span><b>${specials} special cards · ${P.promos.length} promos</b><span class="ab">Base set is complete. Pits set, lamp-lit foils, misprints and promos come from packs and feats.</span><div style="display:flex;justify-content:flex-end"><button class="btn sm" type="button" data-s="deckbuilder">Deck builder</button></div></div>
    </div></div>`;
  }
  function deckBuilder() {
    root.hidden = false;
    const rows = [0, 1, 2, 3].map((s) => `<div class="deck-row"><div class="fm" style="color:${FAM_COLOR[s]}">${esc(FAM_NAME[s])} ${SP.SUIT_SYM[s]}</div><div class="deck-cards">${Array.from({ length: 13 }, (_, r) => { const c = C(s, r); const vs = versionsOf(c); const v = P.deck[c] || 'base'; return card(c, vs.length > 1 ? 'has' : 'only', 'button', `type="button" data-dc="${c}" title="${vs.length} version${vs.length > 1 ? 's' : ''}"`, v); }).join('')}</div></div>`).join('');
    root.innerHTML = `<div class="screen"><div class="screen-in"><div class="home-top"><div><span class="eyebrow">Deck builder</span><h2>Your 52.</h2></div><button class="btn" type="button" data-s="${cur ? 'depot' : 'map'}">Done</button></div>
      <p class="lead">Tap a card to switch between the versions you own. Looks only; the cards play the same. Cards with a gold corner have more than one version.</p>
      <div class="deck-list">${rows}</div>
      ${P.promos.length ? `<div class="card-ish"><span class="fm" style="color:var(--gold)">Promos</span>${P.promos.map((p) => `<p class="reg"><b>${esc(p.name)}</b> · ${SP.cardName(p.c)} · ${esc(p.how)}</p>`).join('')}</div>` : ''}
    </div></div>`;
  }
  function cycleVersion(c) { const vs = versionsOf(c); const i = vs.indexOf(P.deck[c] || 'base'); P.deck[c] = vs[(i + 1) % vs.length]; save(); deckBuilder(); }

  // ---------------- Nights ----------------
  let night = null;
  function familiarScreen(t, tableIx) {
    root.hidden = false; const pk = night.pickup; const cap = pk ? 'grown' : t.maxTier;
    const can = P.owned.filter((id) => tierOk(id, cap)); if (!night.familiar || !can.includes(night.familiar)) night.familiar = can.includes(P.lastFam) ? P.lastFam : can[0];
    const tooHigh = P.owned.filter((id) => !tierOk(id, cap));
    const tb = pk ? Object.assign({ ruleText: 'Short game, first to 100.' }, pk.crew) : t.kind === 'junction' ? t.tables[tableIx] : t;
    root.innerHTML = `<div class="screen"><div class="screen-in"><span class="eyebrow">${esc(t.name)}${pk ? ' · ' + esc(pk.crew.name) : t.kind === 'junction' ? ' · ' + esc(tb.name) : ''}</span>${pk ? `<div class="card-ish">${critterLine(pk.enc, P.seen.includes(pk.enc.id))}</div>` : ''}<h2>Bring one critter.</h2><p class="lead">${esc(tb.ruleText)} This table allows ${esc(cap)} critters${cap === 'grown' ? ' and below' : ' only'}. ${esc(SP.PERSONAS[P.partner].name)} brings ${FAM_ICON[PERSONA_FAM[P.partner]]}. House: ${tb.house.map((k) => `${esc(SP.PERSONAS[k].name)} ${FAM_ICON[tb.houseFam[k]]}`).join(', ')}.</p>
      <div class="fam-pick">${can.map((id) => famCard(SP.FAMILIARS[id], id === night.familiar)).join('')}${tooHigh.map((id) => famCard(SP.FAMILIARS[id], false, 'disabled', true)).join('')}</div>
      <div style="display:flex;justify-content:flex-end;gap:10px"><button class="btn" type="button" data-s="${pk ? 'town' : 'depot'}">Back</button><button class="btn primary" type="button" data-s="deal" data-focus="1">Sit down with ${FAM_ICON[night.familiar]} ${esc(SP.FAMILIARS[night.familiar].name)}</button></div></div></div>`;
  }
  function startNight() {
    const t = night.town; P.lastFam = night.familiar; save(); const pk = night.pickup;
    const tb = pk ? pk.crew : t.kind === 'junction' ? t.tables[night.tableIx] : t;
    root.hidden = true; root.innerHTML = ''; mood('table');
    const ci = inst(night.familiar);
    window.TBUI.start({ mode: 'familiar', coach: P.voices === 'full', helpers: true, voices: P.voices, seated: P.seated, partner: P.partner, familiar: night.familiar, sharp: CATCH.isSharp(ci), nature: ci ? ci.nature : null, owned: P.owned.slice(), deckVersions: Object.assign({}, P.deck),
      club: pk ? { id: t.id, name: pk.crew.name, target: 100, rules: { target: 100 }, house: pk.crew.house, houseFam: pk.crew.houseFam, stake: pk.crew.stake, tableIx: -1, pickup: pk.enc, pickupSeen: P.seen.includes(pk.enc.id), crewIx: pk.crewIx }
        : { id: t.id, name: t.kind === 'junction' ? `${t.name} · table ${night.tableIx + 1}` : t.name, target: tb.rules.target, rules: tb.rules, house: tb.house, houseFam: tb.houseFam, stake: t.kind === 'junction' ? 0 : t.stake, tableIx: night.tableIx } });
  }
  function nightOver(r) {
    if (r.townId === 'tutorial') {
      P.flags.started = true; P.flags.firstDuel = r.won ? 'won' : 'lost'; P.nights++; P.marks += 10; save(); cur = TOWNS[0];
      const lines = r.won
        ? [['Gus', 'Beginner’s luck. I want a rematch, and this time there’s money on the table.'], ['Dee', `Not bad, ${P.name || 'kid'}. Not bad at all. Your grandmother lost her first night, you know.`], ['Dee', 'The back room’s open for real now: first to 150, ten marks a seat. Win it and the Line opens up.']]
        : [['Birdie', 'Don’t look so sad. Nobody wins their first night at this table. Nobody.'], ['Dee', `You were closer than you think, ${P.name || 'kid'}. Your grandmother lost her first night too.`], ['Dee', 'The back room’s open for real now: first to 150, ten marks a seat. Win it and the Line opens up.']];
      return scene(lines, () => hub(TOWNS[0], 'door'), { where: 'Cinder Hollow depot', img: 'img/depot.jpg', last: 'Step outside' });
    }
    mood('depot'); const t = town(r.townId); const st = P.towns[t.id] || (P.towns[t.id] = { won: 0, played: 0, bracket: 0 }); P.nights++;
    const notes = []; const stats = r.stats || {};
    if (r.pickup) {
      const crew = CATCH.CREWS[t.id][r.pickup.crewIx]; cur = t;
      if (r.won) { P.marks += crew.stake * 2; notes.push(`Pickup game won: +${crew.stake * 2} marks.`); } else { P.marks = Math.max(0, P.marks - crew.stake); notes.push(`Pickup game lost: −${crew.stake} marks.`); }
      growthNote(notes, r);
      night.pickupResult = { crewIx: r.pickup.crewIx, enc: r.pickup.enc, meter: r.pickup.meter, hits: r.pickup.hits, won: r.won };
      save(); return wakeScreen(t, night.pickupResult, notes);
    }
    // marks
    if (t.kind !== 'junction') { st.played++; if (r.won) { st.won++; P.marks += t.stake * 2; notes.push(`Stake won: +${t.stake * 2} marks.`); } else { P.marks = Math.max(0, P.marks - t.stake); notes.push(`Stake lost: −${t.stake} marks.`); } }
    else { if (r.won) { st.bracket = (st.bracket || 0) + 1; if (st.bracket >= t.tables.length) { st.won++; st.bracket = 0; st.played++; notes.push('Three tables. The brass punch is yours.'); } else notes.push(`Table ${st.bracket} down. ${t.tables.length - st.bracket} to go.`); } else { st.bracket = 0; st.played++; notes.push('The bracket resets. Pay the entry to try again.'); } }
    growthNote(notes, r);
    // quest
    const q = t.quest; if (q && !P.quests[q.id] && q.check(stats, r)) { P.quests[q.id] = true; if (q.reward.familiar && !owned(q.reward.familiar)) wake(q.reward.familiar, { town: t.id }); if (q.reward.lantern) P.lanterns[q.reward.lantern]++; if (q.reward.stone) P.stones[q.reward.stone] = (P.stones[q.reward.stone] || 0) + 1; notes.push(`Quest done: ${esc(q.who)} hands you ${esc(q.rewardText)}.`); }
    // hidden familiar + promos
    if (stats.lowBooksHand && !owned('mouse')) { wake('mouse', { town: t.id }); notes.push('A soot-grey <b>Mouse</b> crept out of your deck. Every book you took in a hand was won by a 2, 3, 4 or 5. Nobody told you that was a thing.'); }
    const promo = (c, v, name, how) => { if (P.promos.some((p) => p.v === v)) return; P.promos.push({ c, v, name, how }); addVersion(c, v); notes.push(`Hidden promo: <b>${name}</b> (${SP.cardName(c)}). ${how}`); };
    if (stats.blindNilMade) promo(C(0, 0), 'promo:dark', 'Going Dark Deuce', 'You went dark and made it.');
    if (stats.fullShift) promo(C(0, 12), 'promo:shift', 'Full Shift Ace', 'All thirteen books in one hand.');
    if (stats.deuceBook) promo(C(2, 0), 'promo:brake', 'Brakeman’s Deuce', 'You won a book with the 2 of night.');
    // junction badge
    let after = null;
    if (t.kind === 'junction' && r.won && st.won > 0 && st.bracket === 0 && !P.flags.ironmereBadge) { P.flags.ironmereBadge = true; if (!owned(t.badge.familiar)) wake(t.badge.familiar, { town: t.id }); P.promos.push({ c: t.badge.promo.c, v: t.badge.promo.v, name: t.badge.promo.name, how: 'Ironmere junction badge.' }); addVersion(t.badge.promo.c, t.badge.promo.v); P.marks += 60; notes.push(`Ironmere badge: ${FAM_ICON[t.badge.familiar]} <b>${SP.FAMILIARS[t.badge.familiar].name}</b> wakes, the <b>${t.badge.promo.name}</b> is yours, and the purse pays 60 marks.`); after = 'deeLeaves'; }
    else if (t.kind !== 'junction' && r.won && st.won === 1) after = { cinder: 'cinderWin', lamplight: 'lampWin', copperbank: 'copperWin' }[t.id];
    save();
    root.hidden = false;
    const line = r.won ? pick(['“Not bad,” says nobody out loud.', 'The stove ticks. Somebody puts the kettle on.', 'Chairs scrape. The regulars pretend not to be impressed.']) : pick(['The house pockets the stake and says nothing.', 'The regulars go back to their tea.', 'Dee shrugs. “Run it back.”']);
    root.innerHTML = `<div class="screen"><div class="screen-in"><span class="eyebrow">${esc(t.name)}</span><h2>${r.won ? 'You took the night.' : 'Their night.'}</h2><p class="lead">${esc(line)} Final: us ${r.score[0]}, them ${r.score[1]}.</p>
      <div class="flash">${notes.join('<br>')}</div>
      <div style="display:flex;justify-content:flex-end;gap:10px">${!r.won ? '<button class="btn" type="button" data-s="runback">Run it back</button>' : ''}<button class="btn primary" type="button" data-s="${after ? 'after:' + after : 'depot'}" data-focus="1">${after ? 'Continue' : 'Back to the depot'}</button></div></div></div>`;
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function growthNote(notes, r) {
    const fid = night.familiar; const nxt = SP.FAM_NEXT[fid]; const c = inst(fid); const need = c && CATCH.isPatient(c) ? 2 : 3;
    if (r.growthUses > 0 && nxt && !owned(nxt)) { P.growth[fid] = (P.growth[fid] || 0) + Math.min(2, r.growthUses); if (P.growth[fid] >= need) { const g = wake(nxt, { temper: c ? c.temper : null, nature: c ? c.nature : null, lamp: c ? c.lamp : false, town: c ? c.town : null }); notes.push(`${FAM_ICON[fid]} ${SP.FAMILIARS[fid].name} grew into ${FAM_ICON[nxt]} <b>${SP.FAMILIARS[nxt].name} · ${SP.FAMILIARS[nxt].ability}</b>${g.lamp ? ' (still lamp-lit)' : ''}.`); } else notes.push(`${FAM_ICON[fid]} ${SP.FAMILIARS[fid].name} growth ${P.growth[fid]}/${need}.`); }
  }
  function afterScene(key) {
    if (key === 'deeLeaves') { scene(SCENES.deeLeaves, () => { P.partner = 'marcus'; P.flags.deeLeft = true; save(); map('Dee took the morning train. Marcus rides with you now. The River Reach is the next leg; the Pits stay open for packs and practice.'); }, { where: 'Ironmere platform, morning', last: 'Back to the train' }); return; }
    scene(SCENES[key], () => depot(cur), {});
  }

  // ---------------- Settings ----------------
  function settings() {
    root.hidden = false;
    root.innerHTML = `<div class="screen"><div class="screen-in"><div class="home-top"><div><span class="eyebrow">Settings</span><h2>How much do the critters talk?</h2></div><button class="btn" type="button" data-s="map">Back</button></div>
      <div class="doors">${[['off', 'Off', 'No voices. Just the table.'], ['quiet', 'Quiet', 'They speak at the bid and when a critter can act.'], ['full', 'Full', 'They talk every play and glow the card they’d play. The coach, basically.']].map(([k, n, d]) => `<button class="door${P.voices === k ? ' sel' : ''}" type="button" data-voices="${k}"><b>${n}</b><span>${d}</span></button>`).join('')}</div>
      <div class="doors"><button class="door${P.seated ? ' sel' : ''}" type="button" data-s="tseated"><b>Seated view (layout mock) · ${P.seated ? 'on' : 'off'}</b><span>Bigger faces, a darker table. A first look at the seated table, no real art yet.</span></button></div>
      <div class="home-foot"><button class="btn" type="button" data-s="jump">Dev · jump ahead ⏩</button><button class="btn danger" type="button" data-s="reset">Start the Line over</button></div>
    </div></div>`;
  }

  // ---------------- Dev: jump ahead ----------------
  // Test any scene or screen without playing the whole leg. Presets rewrite progress (saved), so use "Start the Line over" afterwards.
  const PRESETS = {
    fresh: { name: 'Fresh arrival', text: 'Intro done, two critters awake, 30 marks, nothing won.', apply(p) { Object.assign(p, fresh()); p.flags.started = true; p.owned = []; p.critters = []; p.seen = []; ['owlet', 'salamander'].forEach((id) => p.critters.push(CATCH.makeCritter(id, { town: 'cinder' }))); p.owned = ['owlet', 'salamander']; p.seen = ['owlet', 'salamander']; } },
    cinderWon: { name: 'Cinder Hollow won', text: 'Lamplight open. Koi from Birdie’s quest.', apply(p) { PRESETS.fresh.apply(p); p.towns.cinder = { won: 1, played: 1 }; p.quests.q_cinder = true; p.owned.push('koi'); p.marks = 60; } },
    pitsOpen: { name: 'All three depots won', text: 'Ironmere open, 120 marks, a Moonstone, Frog, some Pits cards.', apply(p) { PRESETS.cinderWon.apply(p); p.towns.lamplight = { won: 1, played: 2 }; p.towns.copperbank = { won: 1, played: 1 }; p.quests.q_lamp = true; p.quests.q_copper = true; p.stones.moonstone = 1; p.owned.push('badger', 'frog'); p.marks = 120; for (let i = 0; i < 12; i++) addVersion(C(i % 4, (i * 5) % 13), i % 3 ? 'pits' : 'lamp'); } },
    table2: { name: 'Ironmere · table two', text: 'Table one beaten, bracket at Tasha & Marcus.', apply(p) { PRESETS.pitsOpen.apply(p); p.towns.ironmere = { won: 0, played: 0, bracket: 1 }; p.marks = 90; } },
    table3: { name: 'Ironmere · table three', text: 'Two tables down, the Foreman & Tally next.', apply(p) { PRESETS.pitsOpen.apply(p); p.towns.ironmere = { won: 0, played: 0, bracket: 2 }; p.marks = 90; } },
    legDone: { name: 'Leg 1 complete', text: 'Badge, Kilnback, Lantern Ace, Dee gone, Marcus riding.', apply(p) { PRESETS.pitsOpen.apply(p); p.towns.ironmere = { won: 1, played: 1, bracket: 0 }; p.flags.ironmereBadge = true; p.flags.deeLeft = true; p.partner = 'marcus'; p.owned.push('kilnback', 'mouse', 'raven'); p.promos.push({ c: C(1, 12), v: 'promo:ironmere', name: 'Ironmere Lantern Ace', how: 'Ironmere junction badge.' }); addVersion(C(1, 12), 'promo:ironmere'); p.marks = 180; p.nights = 9; } },
  };
  function jump() {
    root.hidden = false; const btn = (s, label, sub) => `<button class="btn" type="button" data-jump="${s}" style="justify-content:space-between;text-align:left">${label}${sub ? `<span class="ab">${sub}</span>` : ''}</button>`;
    const grid = (items) => `<div class="menu" style="display:grid;gap:8px">${items.join('')}</div>`;
    root.innerHTML = `<div class="screen"><div class="screen-in"><div class="home-top"><div><span class="eyebrow">Dev · jump ahead</span><h2>Test any scene.</h2></div><button class="btn" type="button" data-s="map">Back</button></div>
      <p class="lead">Scenes and screens open as they are; presets rewrite your progress. At the table, the ☰ menu has autoplay and “end night now”. Marks: ◉ ${P.marks} · partner ${esc(SP.PERSONAS[P.partner].name)} · ${P.owned.length} critters.</p>
      <div class="card-ish"><span class="fm" style="color:var(--gold)">Scenes</span>${grid([btn('scene:intro', 'Title cards'), btn('scene:opening', 'Walkable opening (resets starters)'), btn('scene:arrive', 'Arrive · Dee in the car'), btn('scene:starter', 'Wake two critters'), btn('scene:cinderWin', 'After Cinder Hollow'), btn('scene:lampWin', 'After Lamplight'), btn('scene:copperWin', 'After Copperbank'), btn('scene:deeLeaves', 'Dee leaves (no side effects)')])}</div>
      <div class="card-ish"><span class="fm" style="color:var(--ember)">Screens</span>${grid([btn('screen:map', 'The train map'), btn('screen:hub', 'Walk Cinder Hollow'), ...TOWNS.map((t) => btn('depot:' + t.id, `${esc(t.name)} ${t.kind === 'junction' ? 'junction' : 'depot'}`, t.open(P) ? '' : 'locked, opens anyway')), btn('screen:rip', 'Rip a free pack (Copperbank press)'), btn('screen:fam', 'Pick a critter for Ironmere table two'), btn('screen:binder', 'Binder'), btn('screen:deck', 'Deck builder'), btn('screen:nightWin', 'Night-end screen · win (applies rewards)'), btn('screen:nightLose', 'Night-end screen · loss')])}</div>
      <div class="card-ish"><span class="fm" style="color:var(--tide)">Progress presets</span>${grid(Object.entries(PRESETS).map(([k, p]) => btn('preset:' + k, p.name, p.text)))}</div>
      <div class="card-ish"><span class="fm" style="color:var(--grove)">Cheats</span>${grid([btn('cheat:marks', '+100 marks'), btn('cheat:fams', 'Wake every critter'), btn('cheat:stone', '+1 Moonstone'), btn('cheat:lanterns', '+3 tin, +2 brass, +1 lamp-glass lantern'), btn('cheat:seen', 'Mark all 24 critters as seen'), btn('cheat:promos', 'All hidden promos'), btn('cheat:cards', 'Fill the deck with Pits, lamp-lit and misprint versions'), btn('cheat:voices', `Voices: ${esc(P.voices)} → next`)])}</div>
    </div></div>`;
  }
  function doJump(s) {
    const [kind, arg] = s.split(':');
    if (kind === 'scene') {
      if (arg === 'intro') return showIntro(0);
      if (arg === 'opening') { P.flags.started = false; return opening(); }
      if (arg === 'starter') { starterSel = []; return starterScreen(); }
      const where = { arrive: 'Cinder Hollow depot', deeLeaves: 'Ironmere platform, morning' }[arg];
      return scene(SCENES[arg], () => jump(), { where, last: 'Back to jump' });
    }
    if (kind === 'depot') { return depot(town(arg), 'Dev jump: opened directly.'); }
    if (kind === 'screen') {
      if (arg === 'map') return map('Dev jump.');
      if (arg === 'hub') return hub(TOWNS[0], 'train');
      if (arg === 'binder') return binder();
      if (arg === 'deck') return deckBuilder();
      if (arg === 'rip') { cur = town('copperbank'); pack = { cards: genPack(cur).map((k) => Object.assign({ flipped: false }, k)) }; return ripScreen(); }
      if (arg === 'fam') { cur = town('ironmere'); night = { town: cur, familiar: night && night.familiar, tableIx: 1 }; return familiarScreen(cur, 1); }
      if (arg === 'nightWin' || arg === 'nightLose') {
        cur = cur || town('cinder'); night = night && night.town ? night : { town: cur, familiar: P.owned[0] || 'owlet', tableIx: 0 }; const won = arg === 'nightWin';
        return nightOver({ won, townId: night.town.id, tableIx: night.tableIx, growthUses: won ? 2 : 0, stats: { nilsMade: won ? 1 : 0, blindNilMade: false, fullShift: false, deuceBook: false, lowBooksHand: false, bags: 0, setsInflicted: 0, handsWon: won ? 3 : 1 }, score: won ? [262, 141] : [138, 251], hands: 5 });
      }
    }
    if (kind === 'preset') { assignProg(null); PRESETS[arg].apply(P); assignProg(JSON.parse(JSON.stringify(P))); save(); cur = null; night = null; return map(`Preset: ${PRESETS[arg].name}.`); }
    if (kind === 'cheat') {
      if (arg === 'marks') P.marks += 100;
      if (arg === 'fams') Object.keys(SP.FAMILIARS).forEach((id) => { if (!owned(id)) wake(id); });
      if (arg === 'lanterns') { P.lanterns.tin += 3; P.lanterns.brass += 2; P.lanterns.glass += 1; }
      if (arg === 'seen') CATCH.ROSTER.forEach((c) => { if (!P.seen.includes(c.id)) P.seen.push(c.id); });
      if (arg === 'stone') P.stones.moonstone++;
      if (arg === 'promos') { const add = (c, v, name, how) => { if (!P.promos.some((p) => p.v === v)) { P.promos.push({ c, v, name, how }); addVersion(c, v); } }; add(C(0, 0), 'promo:dark', 'Going Dark Deuce', 'You went dark and made it.'); add(C(0, 12), 'promo:shift', 'Full Shift Ace', 'All thirteen books in one hand.'); add(C(2, 0), 'promo:brake', 'Brakeman’s Deuce', 'You won a book with the 2 of night.'); add(C(1, 12), 'promo:ironmere', 'Ironmere Lantern Ace', 'Ironmere junction badge.'); }
      if (arg === 'cards') for (let c = 0; c < 52; c++) { addVersion(c, 'pits'); if (c % 3 === 0) addVersion(c, 'lamp'); if (c % 7 === 0) addVersion(c, 'mis'); }
      if (arg === 'voices') P.voices = { off: 'quiet', quiet: 'full', full: 'off' }[P.voices];
      save(); return jump();
    }
  }

  // ---------------- Clicks ----------------
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return; const s = b.dataset.s;
    if (b.dataset.jump) return doJump(b.dataset.jump);
    if (s === 'jump') return jump();
    if (s === 'intronext') { if (sc + 1 < INTRO.length) { showIntro(sc + 1); } else afterIntro(); return; }
    if (s === 'introskip') return afterIntro();
    if (s === 'scenenext') return sceneState && sceneState.next();
    if (s === 'sceneskip') return sceneState && sceneState.skip();
    if (s === 'starterdone' && openingStarter) { if (starterSel.length !== 2) return; P.owned = []; P.critters = []; starterSel.forEach((id) => wake(id, { town: 'cinder' })); save(); const cb = openingStarter; openingStarter = null; return cb(starterSel.map((id) => FAM_ICON[id] + ' ' + SP.FAMILIARS[id].name).join(' and ')); }
    if (s === 'starterdone') { if (starterSel.length !== 2) return; P.owned = []; P.critters = []; starterSel.forEach((id) => wake(id, { town: 'cinder' })); P.flags.started = true; save(); return depot(TOWNS[0], `${starterSel.map((id) => FAM_ICON[id] + ' ' + SP.FAMILIARS[id].name).join(' and ')} are awake. Dee is waiting in the back room.`); }
    if (s === 'map') { if (cur && P.enc[cur.id]) { delete P.enc[cur.id]; save(); } cur = null; return map(); }
    if (s === 'depot') return depot(cur || TOWNS[0]);
    if (s === 'binder') return binder();
    if (s === 'deckbuilder') return deckBuilder();
    if (s === 'settings') return settings();
    if (s === 'tseated') { P.seated = !P.seated; save(); return settings(); }
    if (s === 'reset') { b.dataset.s = 'resetyes'; b.textContent = 'Tap again to wipe your save and start over'; b.classList.add('primary'); return; }
    if (s === 'resetyes') { assignProg(null); save(); cur = null; night = null; return showIntro(0); }
    if (s === 'classic') { mood('table'); root.hidden = true; root.innerHTML = ''; window.TBUI.start({ mode: 'classic', coach: false, helpers: false, voices: 'off', partner: P.partner, familiar: null, club: null, seated: P.seated }); return; }
    if (b.dataset.town) { const t = town(b.dataset.town); if (t && t.open(P)) return HUB_TOWNS[t.id] && window.TBWorld ? hub(t, 'train') : depot(t); return; }
    if (s === 'hub') return hub(cur || TOWNS[0], 'door');
    if (s === 'town') return cur && HUB_TOWNS[cur.id] ? hub(cur, 'door') : depot(cur || TOWNS[0]);
    if (s === 'sitdown') { const t = cur; const st = P.towns[t.id] || (P.towns[t.id] = { won: 0, played: 0, bracket: 0 }); if (t.kind === 'junction' && !(st.bracket > 0)) { if (P.marks < t.entry) return; P.marks -= t.entry; save(); } night = { town: t, familiar: night && night.familiar, tableIx: t.kind === 'junction' ? (st.bracket || 0) : 0 }; return familiarScreen(t, night.tableIx); }
    if (s === 'runback') { const t = cur; const st = P.towns[t.id]; if (t.kind === 'junction') { if (P.marks < t.entry) return depot(t, 'Not enough marks for the entry. Win a back room first.'); P.marks -= t.entry; save(); } night = { town: t, familiar: night && night.familiar, tableIx: t.kind === 'junction' ? (st.bracket || 0) : 0 }; return familiarScreen(t, night.tableIx); }
    if (s === 'deal') return startNight();
    if (s && s.startsWith('after:')) return afterScene(s.slice(6));
    if (s === 'buypack') { if (P.marks < cur.packPrice) return; P.marks -= cur.packPrice; pack = { cards: genPack(cur).map((k) => Object.assign({ flipped: false }, k)), lantern: Math.random() < 0.12 }; if (pack.lantern) P.lanterns.tin++; save(); return ripScreen(); }
    if (s && s.startsWith('buylantern:')) { const k = s.slice(11); const L = CATCH.LANTERNS[k]; if (!L || P.marks < L.price) return; P.marks -= L.price; P.lanterns[k]++; save(); return depot(cur, `🏮 ${L.name} bought. You have ${P.lanterns[k]}.`); }
    if (s && s.startsWith('pickup:')) { const i = Number(s.slice(7)); const crew = CATCH.CREWS[cur.id][i]; if (!crew || P.marks < crew.stake) return; const enc = encounters(cur)[i]; night = { town: cur, familiar: night && night.familiar, tableIx: -1, pickup: { crewIx: i, crew, enc } }; return familiarScreen(cur, -1); }
    if (s && s.startsWith('wake:')) { return wakeResult(night.town, night.pickupResult, s.slice(5)); }
    if (b.dataset.rip !== undefined) return flip(Number(b.dataset.rip));
    if (s === 'usestone') { const cands = P.owned.filter((id) => SP.FAM_NEXT[id] && !owned(SP.FAM_NEXT[id])); if (!cands.length) return depot(cur, 'No young critter left to wake with it.'); const id = cands[0]; const nxt = SP.FAM_NEXT[id]; P.stones.moonstone--; P.owned.push(nxt); save(); return depot(cur, `🌙 The Moonstone wakes ${FAM_ICON[id]} ${SP.FAMILIARS[id].name} all the way into ${FAM_ICON[nxt]} ${SP.FAMILIARS[nxt].name}.`); }
    if (b.dataset.dc !== undefined) return cycleVersion(Number(b.dataset.dc));
    if (b.dataset.voices) { P.voices = b.dataset.voices; save(); return settings(); }
    if (b.dataset.fk) { const id = b.dataset.fk; if (root.querySelector('[data-s="starterdone"]')) { const i = starterSel.indexOf(id); if (i >= 0) starterSel.splice(i, 1); else { starterSel.push(id); if (starterSel.length > 2) starterSel.shift(); } return starterScreen(); } if (night && !b.disabled) { night.familiar = id; return familiarScreen(night.town, night.tableIx); } }
  });

  window.TBLine = { nightOver, leave() { root.hidden = false; cur ? depot(cur) : map(); }, get progress() { return P; }, map };
  window.TBStory = { home: () => map(), doors: () => map() };
  showIntro(0);
  loadProgress().then(() => { /* read when the intro ends */ });
})();
