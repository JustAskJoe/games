(function () {
  const SP = window.SP;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FAM = ['dusk', 'ember', 'tide', 'grove'];
  const FAM_NAME = ['Dusk', 'Ember', 'Tide', 'Grove'];
  const POS = ['South', 'West', 'North', 'East'];
  const FAM_ICON = { owlet: '🦉', salamander: '🦎', koi: '🐟', badger: '🦡', raven: '🐦‍⬛', kilnback: '🐉', frog: '🐸', mouse: '🐭', sootling: '🪨', cinderwick: '🕯️' };
  const CATCH = window.TBCatch || null;
  const PERSONA_FAM = { dee: 'salamander', tally: 'owlet', foreman: 'badger', jo: 'koi', gus: 'salamander', birdie: 'badger', ada: 'koi', abe: 'owlet', wick: 'mouse', soot: 'kilnback', hal: 'badger', june: 'owlet', tasha: 'raven', marcus: 'kilnback' };
  const famBadge = (i) => { const F = SP.famOf(G, i); if (!F) return ''; const p = G.players[i]; const spent = p.famUsed || !SP.hasCharge(G, i); return `<span class="fam-badge${spent ? ' used' : ''}" title="${esc(F.desc)}">${FAM_ICON[F.id]} ${esc(F.name)} · ${esc(F.ability)}${p.famUsed ? ' ✓' : !SP.hasCharge(G, i) ? ' · spent' : (F.tier === 'grown' && !F.perHand) ? ' · 1 tonight' : ''}</span>`; };

  let G = null;
  const ui = {
    mode: 'classic', coach: false, helpers: true, fast: false, partner: 'dee', familiar: null, club: null, started: false, flare: false, growthUses: 0,
    voices: 'quiet', owned: [], deckVersions: {}, seated: false, stats: null,
    prompt: null, resolver: null, sel: null, hint: null, bubbles: {}, log: [], over: null, hideHand: false,
    lastBot: null, flags: [], feedbackDone: false, showLast: null, talk: true,
    auto: 'off', devEnd: null, sharp: false, nature: null, wild: null, // wild = { enc, meter, hits:{}, exactCount } // dev: 'off' | 'hand' | 'night' autoplay; devEnd = {won, feats} ends the night now
  };
  try { ui.fast = localStorage.getItem('tb-fast') === 'on'; } catch (e) { /* storage unavailable */ }

  // ---------- helpers ----------
  const me = () => G.players[0];
  const name = (i) => (i === 0 ? 'You' : G.players[i].persona.name);
  // Every pause in the hand loop registers a rejecter so the dev menu can abort a night mid-hand (ABORT) or newmatch can leave cleanly.
  const ABORT = { abort: true };
  const cancels = new Set();
  function cancelAll() { for (const rej of Array.from(cancels)) rej(ABORT); cancels.clear(); }
  const wait = (ms) => new Promise((res, rej) => { cancels.add(rej); const t = setTimeout(() => { cancels.delete(rej); res(); }, ui.auto !== 'off' ? Math.min(ms, 120) : ui.fast ? ms / 3 : ms); });
  const pick = (arr) => arr[Math.floor(G.r() * arr.length)];
  function addLog(s) { ui.log.push(s); if (ui.log.length > 3) ui.log.shift(); }
  function bubble(i, text) {
    ui.bubbles[i] = text; render();
    setTimeout(() => { if (ui.bubbles[i] === text) { delete ui.bubbles[i]; render(); } }, ui.fast ? 900 : 2200);
  }
  function card(c, extra, tag, attrs, mine) {
    const s = SP.suit(c), r = SP.rank(c); const el = tag || 'span';
    const v = mine ? (ui.deckVersions[c] || 'base') : 'base'; const vcls = v === 'base' ? '' : ' v-' + v.split(':')[0];
    return `<${el} class="pc ${FAM[s]}${vcls} ${extra || ''}" aria-label="${SP.cardName(c)}" title="${SP.cardName(c)} · ${FAM_NAME[s]}${v !== 'base' ? ' · ' + v : ''}" ${attrs || ''}><span class="r">${SP.RANKS[r]}</span><span class="su">${SP.SUIT_SYM[s]}</span><span class="big">${SP.SUIT_SYM[s]}</span><span class="fam">${FAM_NAME[s]}</span>${v.startsWith('lamp') ? '<span class="shine"></span>' : ''}</${el}>`;
  }
  const backCard = (extra) => `<span class="pc back ${extra || ''}" aria-hidden="true"></span>`;
  const avatar = (i, extra) => { const p = G.players[i]; return `<span class="ava ${['dusk', 'ember', 'tide', 'grove'][i]} ${extra || ''}">${esc(p.persona.name[0])}</span>`; };
  const bidText = (p) => (p.bid === null ? '—' : p.nil ? (p.blind ? 'Blind nil' : 'Nil') : String(p.bid));

  // ---------- table talk (placeholder lines, to be rewritten with writers from the community) ----------
  const TALK = {
    bidHigh: ['Count ’em.', 'Hold on to your hat.', 'I like my cards.'],
    bidLow: ['Not much here.', 'Carry me, partner.', 'One. Maybe.'],
    nil: ['Nothing. Nil.', 'I’m going nil, cover me.', 'Zero.'],
    tookTrick: ['Mine.', 'Thank you.', 'Book.'],
    tookFromYou: ['Appreciate that.', 'I’ll take it.', 'Too easy.'],
    partnerCover: ['Got you.', 'I’ll take this one.', 'Covered.'],
    set: ['Ugh.', 'That one hurts.', 'Next hand.'],
    made: ['Told you.', 'Easy money.', 'That’s how we do it.'],
    bags: ['Careful, bags.', 'We’re bagging up.'],
  };

  // ---------- rendering ----------
  function render() {
    if (!G) return;
    $('#chipHand').textContent = ui.started ? `Night: ${G.score[0]}–${G.score[1]} · to ${G.rules.target}` : `Hand ${G.handNo + 1}`;
    $('#modeTag').textContent = ui.mode === 'classic' ? 'The old way' : (ui.club ? ui.club.name : 'Familiar table');
    document.body.classList.toggle('seated', !!ui.seated);
    renderPad(); renderSeats(); renderTable(); renderMe(); renderPrompt(); renderSide(); renderOverlay();
  }
  function renderPad() {
    const R = G.rules;
    const col = (t, cls) => {
      const bid = SP.teamBid(G, t); const tricks = SP.teamTricks(G, t); const nils = G.players.filter((p) => SP.teamOf(p.seat) === t && p.nil);
      const bidStr = G.players.some((p) => p.bid === null) ? (G.players.filter((p) => SP.teamOf(p.seat) === t && p.bid !== null).length ? bid + (nils.length ? ' + nil' : '') + '…' : '—') : bid + (nils.length ? (nils.length === 2 ? ' · two nils' : ' + nil') : '');
      return `<div class="v ${cls}"><b>${G.score[t]}</b></div><div class="v">${bidStr}</div><div class="v">${tricks}${nils.some((p) => p.tricks) ? ` <span class="warnb">(+${nils.reduce((a, p) => a + p.tricks, 0)} nil)</span>` : ''}</div><div class="v ${G.bags[t] >= 7 ? 'warnb' : ''}">${G.bags[t]}</div>`;
    };
    const a = col(0, 'us').split('</div>'), b = col(1, 'them').split('</div>');
    $('#pad').innerHTML = `<div class="lbl">Hand ${G.handNo + 1} · to ${R.target}</div><div class="h us">Us</div><div class="h them">Them</div>
      <div class="lbl">Score</div>${a[0]}</div>${b[0]}</div>
      <div class="lbl">Bid</div>${a[1]}</div>${b[1]}</div>
      <div class="lbl">Books</div>${a[2]}</div>${b[2]}</div>
      <div class="lbl">Bags</div>${a[3]}</div>${b[3]}</div>`;
    const wild = $('#wild'); if (wild) wild.innerHTML = wildHTML();
  }
  function wildHTML() {
    const w = ui.wild; if (!w || !CATCH) return '';
    const c = CATCH.BY_ID[w.enc.id]; const seen = w.seen;
    const likes = c.likes.map((k) => `<span class="like${w.hits[k] ? ' hit' : ''}">${w.hits[k] ? '✓ ' : ''}${esc(CATCH.LIKES[k].short)}</span>`).join('');
    return `<div class="wild-row"><span class="wild-ico${w.enc.lamp ? ' lamp' : ''}">${seen ? c.icon : '❔'}</span><div class="wild-body"><b>${seen ? esc(c.name) : '???'} <span class="ab">asleep on the table${w.enc.lamp ? ' · lamp-lit!' : ''}</span></b><div class="likes">likes: ${likes}</div><div class="meter"><span style="width:${w.meter}%"></span></div></div><span class="wild-pct">${w.meter}%</span></div>`;
  }
  function renderSeats() {
    for (let i = 1; i <= 3; i++) {
      const p = G.players[i]; const el = $('#seat' + i);
      el.classList.toggle('turn', G.turn === i && !ui.over);
      const need = p.bid === null ? '' : p.nil ? (p.tricks ? `<span class="warnb" style="color:var(--bad)">broke nil</span>` : (p.blind ? 'dark' : 'nil')) : `${p.tricks}/${p.bid}`;
      el.dataset.initial = p.persona.name[0];
      el.innerHTML = `${ui.bubbles[i] ? `<span class="bubble">${esc(ui.bubbles[i])}</span>` : ''}
        <span class="pos"><span>${POS[i]}${i === G.dealer ? ' · deal' : ''}</span><span>${i === 2 ? 'partner' : ''}</span></span>
        <div class="who"><b>${esc(p.persona.name)}</b></div>
        <div class="bidline">${p.bid === null ? '<span class="sub">bidding…</span>' : `<span class="${p.nil ? 'nil' : ''}">${need}</span> <span class="sub">${p.nil ? '' : 'books'}</span>`}</div>
        <div class="sub">${p.hand.length} cards</div>${famBadge(i)}${i === 2 && G.known && G.known[0].length ? `<div class="sub">You saw: ${G.known[0].filter((c) => p.hand.includes(c)).map((c) => SP.cardName(c)).join(' ') || 'played'}</div>` : ''}`;
    }
  }
  function renderTable() {
    const el = $('#table');
    const trick = ui.showLast ? ui.showLast.cards : G.trick;
    const winner = ui.showLast ? ui.showLast.winner : (G.trick.length ? SP.currentWinner(G) : -1);
    const slot = (seat, cls) => {
      const x = trick.find((t) => t.seat === seat);
      return `<div class="slot ${cls} ${x && winner === seat ? 'win' : ''}"><span class="nm">${esc(name(seat))}${x && x.flare ? ' 🐉+1' : ''}</span>${x ? card(x.c, x.flare ? 'flared' : '', null, null, seat === 0) : `<span class="pc" style="opacity:.12"></span>`}</div>`;
    };
    let mid = '';
    if (ui.showLast) mid = `<b>${esc(name(ui.showLast.winner))}</b> take${ui.showLast.winner === 0 ? '' : 's'} the book`;
    else if (G.turn < 0 || G.players.some((p) => p.bid === null)) mid = 'Bidding';
    else if (!G.trick.length) mid = `${esc(name(G.leader))} lead${G.leader === 0 ? '' : 's'}`;
    else mid = `${esc(SP.SUIT_SYM[SP.suit(G.trick[0].c)])} led · <b>${esc(name(winner))}</b> winning`;
    if (G.spadesBroken && !ui.showLast && G.turn >= 0) mid += '<br><span style="font-size:11px">night is broken</span>';
    el.innerHTML = slot(2, 'n') + slot(1, 'w') + `<div class="mid">${mid}</div>` + slot(3, 'e') + slot(0, 's');
    $('#log').innerHTML = ui.log.map((s) => `<div>${esc(s)}</div>`).join('');
    $('#flagBtn').innerHTML = ui.lastBot ? `<button class="btn sm danger" data-act="flag" type="button" title="Flag the last bot play for F">⚑ Flag ${esc(name(ui.lastBot.seat))}’s ${ui.lastBot.kind === 'bid' ? 'bid' : SP.cardName(ui.lastBot.c)}</button>` : '';
  }
  function renderMe() {
    const p = me(); const P = ui.prompt;
    $('#me').classList.toggle('turn', G.turn === 0 && !ui.over);
    const need = p.bid === null ? 'no bid yet' : p.nil ? (p.tricks ? `<span style="color:var(--bad)">nil broken</span>` : `${p.blind ? 'blind ' : ''}nil · 0 so far`) : `${p.tricks}/${p.bid} books`;
    $('#meTop').innerHTML = `<div class="you"><b>You</b><span class="chip">${POS[0]}${G.dealer === 0 ? ' · deal' : ''}</span></div><span class="bidline">${need}</span>${famBadge(0)}${G.spadeInfo && G.spadeInfo[0] ? `<span class="chip">♠ ${name(1)} ${G.spadeInfo[0][1]} · ${name(3)} ${G.spadeInfo[0][3]}</span>` : ''}`;
    if (ui.hideHand) { $('#hand').innerHTML = p.hand.map(() => backCard()).join(''); return; }
    const legal = P && P.kind === 'play' ? new Set(SP.legalPlays(G, 0)) : (P && (P.kind === 'hop' || P.kind === 'hopgive')) ? new Set(p.hand) : null;
    let prevSuit = -1;
    $('#hand').innerHTML = p.hand.map((c) => {
      const cls = [];
      if (legal && !legal.has(c)) cls.push('off');
      if (ui.sel === c) cls.push('sel');
      if (ui.hint === c) cls.push('hint');
      if (ui.flare && ui.sel === c) cls.push('flared');
      if (ui.helpers && P && P.kind === 'play' && SP.isBoss(G, 0, c) && SP.outstanding(G, 0, SP.suit(c)) > 0) cls.push('boss');
      const s = SP.suit(c); if (s !== prevSuit && prevSuit !== -1) cls.push('gap'); prevSuit = s;
      return card(c, cls.join(' '), 'button', `type="button" data-card="${c}" ${legal && !legal.has(c) ? 'aria-disabled="true"' : ''}`, true);
    }).join('');
  }
  // ---------- critter voices (the coach, made diegetic). Placeholder lines; a writer rewrites these. ----------
  const NATURE_FLAVOR = { gruff: (t) => t.replace(/\.$/, '') + '. Hm.', wry: (t) => t + ' Obviously.', tender: (t) => t.replace(/\.$/, '') + ', okay?', anxious: (t) => 'Oh no. ' + t, proud: (t) => 'Naturally. ' + t, dreamy: (t) => t.replace(/\.$/, '') + '…' };
  const VOICE = {
    sootling: { tone: 'small, sooty, nosy',
      bid: ['I’d say {n}. I can’t see much from down here.'], nil: ['Nil. I’ll hide. I’m good at hiding.'],
      leadboss: ['{card}! Big card! Lead it!'], leadlow: ['{card}. Sneaky. Low.'], nilunder: ['{card}. Under. Under is safe.'], partner: ['{pn} wants this. {card}.'],
      trump: ['{card}. Smudge it.'], win: ['{card} takes it. Chimney-high.'], duck: ['{card}. Lose it on purpose.'], shed: ['Throw {card}. Nobody misses it.'],
      moment: ['Let me smudge a look. One peek, left side.'] },
    cinderwick: { tone: 'warm, patient, few words',
      bid: ['{n}. Exactly {n}. Not one more.'], nil: ['Nil. Sit by the stove.'], leadboss: ['{card}. It’s yours.'], leadlow: ['{card}. Patience.'], nilunder: ['{card}. Under.'], partner: ['{pn}’s. {card}.'],
      trump: ['{card}.'], win: ['{card}. Banked.'], duck: ['{card}. Not this one.'], shed: ['{card}.'] },
    owlet: { tone: 'quiet, precise',
      bid: ['I count {est} sure books. Say {n}.', '{n}. I’ve counted twice.'], nil: ['Nothing here worth a book. Nil, and stay small.'],
      leadboss: ['{card} is the top {fam} left. Lead it, it’s ours.'], leadlow: ['Lead {card}. Low, from your long suit. Let {pn} have it.'],
      nilunder: ['{card}. Highest card that still loses.'], partner: ['{pn} has this one. Give them {card}.'],
      trump: ['Out of {led}. {card} takes it.'], win: ['{card} wins it. We still need books.'], duck: ['Can’t win it. {card}, and keep the rest.'], shed: ['Throw {card}. It shortens a suit.'],
      moment: ['Let me peek. Free information.'] },
    salamander: { tone: 'hot-headed',
      bid: ['{est} books, easy. Say {n}, maybe more.', '{n}. Then make them sweat.'], nil: ['Nil? Fine. Stay out of my way.'],
      leadboss: ['Lead {card}. Make them follow you.'], leadlow: ['Ugh, {card}. Fine. Bait.'],
      nilunder: ['{card}. Keep your head down, I hate this.'], partner: ['{pn}’s got it. {card}, don’t waste a good one.'],
      trump: ['Night on it. {card}, right now.'], win: ['{card}. Take the book.'], duck: ['{card}. We’ll get it back.'], shed: ['Dump {card}.'],
      spark: ['Night isn’t broken. Spark it anyway: you hold the top, lead it.'] },
    koi: { tone: 'calm, second-guessing',
      bid: ['Looks like {est}. Say {n}, and we can rethink after a book.', '{n}. The table will tell us.'], nil: ['Nil. The flow’s against you this hand.'],
      leadboss: ['{card} is safe to lead.'], leadlow: ['{card}, low. See what comes back.'],
      nilunder: ['{card}. Under, always under.'], partner: ['{pn} is winning. {card}.'],
      trump: ['{card}, since you can’t follow.'], win: ['{card} should hold.'], duck: ['Let it go with {card}.'], shed: ['{card}. You won’t miss it.'],
      rethink: ['I count {est2} now against your {bid}. Rethink?'] },
    badger: { tone: 'gruff, protective',
      bid: ['{n}. No more than {n}. Bags bite.', '{est}, so say {n}. Don’t get greedy.'], nil: ['Nil. Dig in and stay low.'],
      leadboss: ['{card}. Take what’s yours, then stop.'], leadlow: ['{card}. Don’t stick your neck out.'],
      nilunder: ['{card}. Lower. Good.'], partner: ['{pn}’s got it. {card}. Save your night.'],
      trump: ['{card}. Only because we need it.'], win: ['{card} wins. Then we sit tight.'], duck: ['{card}. That’s enough books.'], shed: ['Shed {card}.'],
      bags: ['That’s our bid. Duck now. Bags bite.'] },
    raven: { tone: 'sly',
      bid: ['Count the night first. Then {n}.', '{n}, unless they’re holding more night than they let on.'], nil: ['Nil. Nobody’s watching you.'],
      leadboss: ['{card}. They can’t touch it.'], leadlow: ['{card}. Watch who flinches.'],
      nilunder: ['{card}. They never look at you.'], partner: ['{pn} has it. {card}.'],
      trump: ['{card}. They didn’t see that coming.'], win: ['{card}. Book.'], duck: ['{card}. Let them have it.'], shed: ['{card}. Nobody counts those.'],
      count: ['Let me count their night before you bid.'] },
    kilnback: { tone: 'warm, proud',
      bid: ['{n}. If we’re short, I’ll flare one.', '{est}. Say {n}.'], nil: ['Nil. I’ll keep quiet.'],
      leadboss: ['{card}. Lead with heat.'], leadlow: ['{card}. Patience.'],
      nilunder: ['{card}.'], partner: ['{pn} wins it. {card}.'],
      trump: ['{card}. Burn it.'], win: ['{card}. Ours.'], duck: ['{card}. Not this one.'], shed: ['{card}.'],
      flare: ['Flare {card}. One rank higher takes it.'] },
    frog: { tone: 'nervous, helpful',
      bid: ['{n}? {n}. Hop me something useful.', '{est}, say {n}.'], nil: ['Nil. Hop me the bad ones.'],
      leadboss: ['{card}, safe.'], leadlow: ['{card}, low.'],
      nilunder: ['{card}, under.'], partner: ['{pn} has it, {card}.'],
      trump: ['{card}!'], win: ['{card} takes it.'], duck: ['{card}, let it go.'], shed: ['{card}, away.'],
      hop: ['Hop {card} across. A short suit now is a trump later.'] },
    mouse: { tone: 'whispering',
      bid: ['{n}. Keep a way out.', 'Say {n}. Quietly.'], nil: ['Nil. Nobody’s watching your {fam}. Slip it.'],
      leadboss: ['{card}. Then back into the dark.'], leadlow: ['{card}. Small.'],
      nilunder: ['{card}. Under. Stay hidden.'], partner: ['{pn} wins. {card}.'],
      trump: ['{card}, from the side.'], win: ['{card}.'], duck: ['{card}.'], shed: ['{card}. Gone.'],
      burrow: ['Burrow. Play off-suit, they won’t see it coming.'] },
  };
  const pick1 = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function fill(t, v) { return t.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m)); }
  // Returns [{fam, text}]: the brought familiar speaks; in full mode a second owned critter may disagree.
  function voiceLines(P) {
    const mine = G.players[0].familiar || 'owlet'; const pn = G.players[2].persona.name;
    const others = (ui.owned || []).filter((f) => f !== mine && VOICE[f]);
    const out = []; const say = (fam, key, v) => { const V = VOICE[fam]; if (V && V[key]) out.push({ fam, text: fill(pick1(V[key]), v || {}) }); };
    if (P.kind === 'blind') { say(mine, 'nil', { fam: 'hand' }); out[0] && (out[0].text = (G.rules.goingDark ? 'House rule: going dark. ' : `We’re down ${G.score[1] - G.score[0]}. `) + 'Bid nil before you look: ±' + G.rules.blindNil + '. Or look first.'); return out; }
    if (P.kind === 'bid') {
      const est = SP.countTricks(me().hand); const rec = SP.botBid(Object.assign({}, G, { r: () => 0.5 }), 0);
      if (G.rules.nilNight) { const mustNil = SP.nilNightSeat(G, 0); out.push({ fam: mine, text: mustNil ? 'The long night: you’re the nil this hand. Bid it.' : `The long night: ${pn} goes nil, you carry the books. Say ${rec.bid}.` }); return out; }
      if (G.rules.mirror) { const m = SP.mirrorBid(G, 0); out.push({ fam: mine, text: `Miner’s count: bid your night. ${m.nil ? 'None, so nil.' : m.bid + '.'}` }); return out; }
      if (rec.nil) say(mine, 'nil', { fam: FAM_NAME[0] }); else say(mine, 'bid', { est: est.toFixed(1), n: rec.bid });
      if (ui.voices === 'full' && others.length && !rec.nil) { const o = pick1(others); if (o === 'salamander' && est - Math.floor(est) >= 0.4) out.push({ fam: o, text: `${rec.bid}? Push it to ${rec.bid + 1}.` }); else if (o === 'badger' && rec.bid >= 4) out.push({ fam: o, text: `${rec.bid} is plenty. Don’t go higher.` }); }
      return out;
    }
    if (P.kind === 'count') { say('raven', 'count'); return out; }
    if (P.kind === 'peek') { say(G.players[0].familiar === 'sootling' ? 'sootling' : 'owlet', 'moment'); return out; }
    if (P.kind === 'hop') { say('frog', 'hop', { card: SP.cardName(SP.hopPick(G, 0)) }); return out; }
    if (P.kind === 'hopgive') { out.push({ fam: mine, text: `${pn}’s Frog is hopping. Send back ${SP.cardName(SP.hopPick(G, 0))}; you’ll miss it least.` }); return out; }
    if (P.kind === 'rethink') { const d = SP.FAMILIARS.koi.botUse(G, 0); say('koi', 'rethink', { est2: (SP.countTricks(me().hand) + me().tricks).toFixed(1), bid: me().bid }); if (d) out[0].text += ` I’d go ${d.delta > 0 ? '+1' : '−1'}.`; else out[0].text += ' Looks right to me.'; return out; }
    if (P.kind === 'play') {
      const c = ui.hint; if (c === null || c === undefined) return out;
      if (ui.sparkHint) { say('salamander', 'spark'); return out; }
      if (ui.flare && ui.sel !== null) { say('kilnback', 'flare', { card: SP.cardName(ui.sel) }); return out; }
      const legal = SP.legalPlays(G, 0); const led = G.trick.length ? SP.suit(G.trick[0].c) : -1;
      const partnerWinning = G.trick.length && SP.currentWinner(G) === 2;
      const v = { card: SP.cardName(c), fam: FAM_NAME[SP.suit(c)], led: led >= 0 ? FAM_NAME[led] : '', pn };
      let key;
      if (!G.trick.length) key = me().nil ? 'nilunder' : SP.isBoss(G, 0, c) ? 'leadboss' : 'leadlow';
      else if (me().nil) key = 'nilunder';
      else if (partnerWinning) key = 'partner';
      else if (SP.suit(c) === 0 && led !== 0) key = 'trump';
      else { const wi = G.trick.findIndex((x) => x.seat === SP.currentWinner(G)); if (SP.beats(c, G.trick[wi].c, led, G.trick[wi].flare)) key = 'win'; else if (legal.every((x) => SP.suit(x) === led)) key = 'duck'; else key = 'shed'; }
      say(mine, key, v);
      if (ui.voices === 'full') {
        const t = 0; const need = SP.teamBid(G, t) - SP.teamTricks(G, t);
        if (need <= 0 && key === 'win' && ui.owned.includes('badger') && mine !== 'badger') say('badger', 'bags');
        else if (key === 'duck' && ui.owned.includes('salamander') && mine !== 'salamander' && Math.random() < 0.3) out.push({ fam: 'salamander', text: 'Ducking again. Boring.' });
      }
      return out;
    }
    return out;
  }
  function voicesHTML(lines) {
    if (!lines.length) return '';
    return `<div class="voices">${lines.map((l) => { const t = l.fam === G.players[0].familiar && ui.nature && NATURE_FLAVOR[ui.nature] ? NATURE_FLAVOR[ui.nature](l.text) : l.text; return `<div class="voice"><span class="vico">${FAM_ICON[l.fam] || '✦'}</span><span><b>${esc(SP.FAMILIARS[l.fam] ? SP.FAMILIARS[l.fam].name : l.fam)}:</b> ${t}</span></div>`; }).join('')}</div>`;
  }
  function renderPrompt() {
    const P = ui.prompt; const el = $('#prompt'); const pn = G.players[2].persona.name;
    const quietKinds = { bid: 1, blind: 1, count: 1, peek: 1, hop: 1, hopgive: 1, rethink: 1 };
    if (!P) {
      const t = G.turn;
      const msg = ui.over ? '…' : t < 0 ? 'Dealing…' : t === 0 ? 'Your turn.' : `${esc(name(t))} is thinking.`;
      el.innerHTML = `<p>${msg}</p>`; return;
    }
    let text = '', acts = '';
    if (P.kind === 'blind') {
      text = `<b>Go dark?</b> ${G.rules.goingDark ? 'House rule: you may go dark any hand.' : `You’re down ${G.score[1] - G.score[0]}.`} Bid nil without looking: +${G.rules.blindNil} if you take no books, −${G.rules.blindNil} if you take one.`;
      acts = `<button class="btn" data-act="blindno" type="button">Look at my cards</button><button class="btn primary" data-act="blindyes" type="button">Blind nil</button>`;
    } else if (P.kind === 'bid') {
      const rec = ui.helpers ? SP.botBid(Object.assign({}, G, { r: () => 0.5 }), 0) : null;
      const est = SP.countTricks(me().hand);
      text = `<b>Your bid.</b> How many books will you take? ${G.players[2].bid !== null ? `${esc(pn)} bid ${bidText(G.players[2])}.` : ''}`;
      let mir = G.rules.mirror ? SP.mirrorBid(G, 0) : null;
      if (mir) text = `<b>The miner’s count.</b> House rule: you bid exactly the night you hold. You have ${mir.nil ? 'no night, so you bid nil' : mir.bid + ' night card' + (mir.bid > 1 ? 's' : '')}.${G.players[0].familiar === 'koi' ? ' Koi can still rethink it after one book.' : ''}`;
      if (G.rules.nilNight) { const mn = SP.nilNightSeat(G, 0); mir = mn ? { nil: true, bid: 0 } : { nil: false, bid: -1 }; text = `<b>The long night.</b> House rule: one partner on each team bids nil every hand. ${mn ? 'This hand it’s you: bid nil.' : `${esc(pn)} is the nil; you bid for the team.`}`; }
      const btns = []; for (let b = 1; b <= 13; b++) btns.push(`<button class="btn ${rec && !rec.nil && rec.bid === b ? 'rec' : ''}" data-bid="${b}" type="button" ${mir && (mir.nil || (mir.bid > 0 && mir.bid !== b)) ? 'disabled' : ''}>${b}</button>`);
      acts = `<div class="bids"><button class="btn nil ${rec && rec.nil ? 'rec' : ''}" data-bid="0" type="button" ${mir && !mir.nil ? 'disabled' : ''}>Nil</button>${btns.join('')}</div>${ui.helpers && !mir ? `<span class="est">Helper counts about ${est.toFixed(1)} sure books${rec ? `, suggests ${rec.nil ? 'nil' : rec.bid}` : ''}. Nil risk ${SP.nilRisk(me().hand).toFixed(1)} (under 3 is fairly safe).</span>` : ''}`;
    } else if (P.kind === 'count') {
      text = `<b>Raven · Count.</b> Learn how many spades ${esc(name(1))} and ${esc(name(3))} hold before you bid. Once per hand.`;
      acts = `<button class="btn" data-act="famskip" type="button">Skip</button><button class="btn primary" data-act="count" type="button">🐦‍⬛ Count</button>`;
    } else if (P.kind === 'hop' || P.kind === 'hopgive') {
      text = P.kind === 'hop' ? `<b>Frog · Hop.</b> Tap a card to send face-down to ${esc(pn)}; they send one back. Once a night.` : `<b>${esc(pn)}’s Frog hops.</b> Tap a card to send to ${esc(pn)}; you get one of theirs.`;
      acts = `${P.kind === 'hop' ? '<button class="btn" data-act="famskip" type="button">Skip</button>' : ''}<button class="btn primary" data-act="hopsend" type="button" ${ui.sel !== null ? '' : 'disabled'}>Send${ui.sel !== null ? ' ' + SP.cardName(ui.sel) : ''}</button>`;
    } else if (P.kind === 'peek') {
      const soot = G.players[0].familiar === 'sootling';
      text = soot ? `<b>Sootling · Smudge.</b> See ${ui.sharp ? 'two random cards' : 'one random card'} in ${esc(name(1))}’s hand. Once per hand.` : `<b>Owlet · Peek.</b> See ${ui.sharp ? 'three' : 'two'} random cards in ${esc(pn)}’s hand. Once per hand.`;
      acts = `<button class="btn" data-act="famskip" type="button">Skip</button><button class="btn primary" data-act="peek" type="button">${soot ? '🪨 Smudge' : '🦉 Peek'}</button>`;
    } else if (P.kind === 'rethink') {
      text = `<b>Koi · Rethink.</b> You bid ${me().bid} and took ${me().tricks} of the first trick. Change your bid by one?`;
      acts = `<button class="btn" data-act="rethink-" type="button" ${me().bid <= 1 ? 'disabled' : ''}>−1</button><button class="btn" data-act="rethink+" type="button" ${me().bid >= 13 ? 'disabled' : ''}>+1</button><button class="btn primary" data-act="famskip" type="button">Keep ${me().bid}</button>`;
    } else if (P.kind === 'play') {
      const canSpark = G.players[0].familiar === 'salamander' && SP.FAMILIARS.salamander.canUse(G, 0);
      const canFlare = G.players[0].familiar === 'kilnback' && SP.FAMILIARS.kilnback.canUse(G, 0);
      const canBurrow = G.players[0].familiar === 'mouse' && SP.FAMILIARS.mouse.canUse(G, 0) && me().hand.some((c) => SP.suit(c) === SP.suit(G.trick[0].c)) && me().hand.some((c) => SP.suit(c) !== SP.suit(G.trick[0].c));
      text = `<b>Your turn.</b> ${G.trick.length ? `${esc(SP.SUIT_SYM[SP.suit(G.trick[0].c)])} ${FAM_NAME[SP.suit(G.trick[0].c)]} was led.` : 'You lead.'} Tap a card, then tap it again to play it.`;
      acts = `${canSpark ? '<button class="btn" data-act="spark" type="button" style="color:var(--warn);border-color:var(--warn)">🦎 Spark</button>' : ''}${canFlare ? `<button class="btn" data-act="flare" type="button" aria-pressed="${ui.flare}" style="color:var(--warn);border-color:var(--warn)">🐉 Flare${ui.flare ? ' on' : ''}</button>` : ''}${canBurrow ? '<button class="btn" data-act="burrow" type="button" style="color:var(--warn);border-color:var(--warn)">🐭 Burrow</button>' : ''}${ui.helpers && ui.voices !== 'off' ? '<button class="btn" data-act="hint" type="button">Ask ' + (FAM_ICON[G.players[0].familiar] || '✦') + '</button>' : ''}<button class="btn primary" data-act="play" type="button" ${ui.sel !== null ? '' : 'disabled'}>Play${ui.sel !== null ? ' ' + SP.cardName(ui.sel) : ''}${ui.flare && ui.sel !== null ? ' +1' : ''}</button>`;
    }
    let vh = '';
    if (ui.voices !== 'off' && (ui.voices === 'full' || quietKinds[P.kind] || ui.sparkHint)) vh = voicesHTML(voiceLines(P));
    if (ui.coach) {
      const c = vh;
      if (c) { const b = P.kind === 'blind' ? 'data-act="blindno"' : P.kind === 'peek' ? 'data-act="peek"' : P.kind === 'count' ? 'data-act="count"' : (P.kind === 'hop' || P.kind === 'hopgive') ? 'data-act="hopsend"' : P.kind === 'rethink' ? (SP.FAMILIARS.koi.botUse(G, 0) ? `data-act="rethink${SP.FAMILIARS.koi.botUse(G, 0).delta > 0 ? '+' : '-'}"` : 'data-act="famskip"') : ui.sparkHint ? 'data-act="spark"' : P.kind === 'bid' ? `data-bid="${SP.botBid(Object.assign({}, G, { r: () => 0.5 }), 0).nil ? 0 : SP.botBid(Object.assign({}, G, { r: () => 0.5 }), 0).bid}"` : 'data-act="play"'; acts = acts.replace(b, b + ' data-focus="1"'); }
    }
    el.innerHTML = `<p>${text}</p>${vh}<div class="acts">${acts}</div>`;
  }
  function renderSide() {
    const el = $('#sidePanel');
    const rows = G.history.map((h, k) => `<div>${k + 1}</div><div class="${h.teams[0].pts >= 0 ? '' : 'warnb'}">${h.teams[0].bid}${h.players[0].nil || h.players[2].nil ? '+nil' : ''} → ${h.teams[0].pts > 0 ? '+' : ''}${h.teams[0].pts}</div><div>${h.teams[1].bid}${h.players[1].nil || h.players[3].nil ? '+nil' : ''} → ${h.teams[1].pts > 0 ? '+' : ''}${h.teams[1].pts}</div>`).join('');
    const lt = G.lastTrick && !ui.showLast ? `<p class="note">Last trick: ${G.lastTrick.cards.map((x) => `${esc(name(x.seat))} ${SP.cardName(x.c)}`).join(', ')} → ${esc(name(G.lastTrick.winner))}</p>` : '';
    el.innerHTML = `<h2>Hands so far</h2>${G.history.length ? `<div class="hist"><div class="h">#</div><div class="h">Us</div><div class="h">Them</div>${rows}</div>` : '<p class="note">First hand. Game to ' + G.rules.target + '.</p>'}${lt}<p class="note">Partner: ${esc(G.players[2].persona.name)} · ${esc(G.players[2].persona.blurb)}</p>${ui.mode === 'familiar' ? `<p class="note">Familiars at the table: ${[0, 1, 2, 3].map((i) => { const F = SP.famOf(G, i); return F ? `${esc(name(i))} ${FAM_ICON[F.id]}` : ''; }).filter(Boolean).join(' · ')}</p>` : ''}`;
  }

  // ---------- overlays ----------
  function showOverlay(kind, data) { ui.over = { kind, data }; render(); }
  function closeOverlay() { ui.over = null; render(); }
  function howHTML() {
    const R = G.rules;
    return `<h2>How to play</h2>
      <p>Books: Spades rules under a Line name. You and ${esc(G.players[2].persona.name)} (across from you) against ${esc(name(1))} and ${esc(name(3))}.</p>
      <ol>
        <li><b>Deal 13.</b> The player left of the dealer bids first and leads first. A trick is a <b>book</b>; spades are <b>night</b>, the trump suit.</li>
        <li><b>Bid.</b> Say how many books you’ll take. Your bid and your partner’s add up to the team bid. <b>Nil</b> means zero: +${R.nil} if you take none, −${R.nil} if you take any.</li>
        <li><b>Play.</b> Follow the suit led if you can. If you can’t, play anything; a spade beats every other suit. You can’t lead a spade until one has been played, unless spades are all you have.</li>
        <li><b>Score.</b> Make your bid: ${R.trick} points per book bid, plus 1 per extra book. Each extra is a <b>bag</b>; every ${R.bagsAt} bags costs ${R.bagPenalty}. Miss your bid: lose ${R.setPenalty} per book bid.</li>
        <li><b>Win.</b> First team to ${R.target}. A team at −${-R.floor} loses.</li>
        ${R.blindNilOn ? `<li><b>Special · Blind nil.</b> When your team trails by ${R.blindNilBehind} or more, you can bid nil before seeing your cards, for ±${R.blindNil}.</li>` : ''}
      </ol>
      <p class="note" style="color:var(--muted)">A failed nil’s tricks count as bags, not toward the partner’s bid.</p>
      ${ui.mode === 'familiar' ? `<h3>Familiars</h3><p>Everyone brings one critter to the table, shown by each seat. It bends one rule once per hand, and the table sees it happen.</p><ul>${Object.values(SP.FAMILIARS).map((F) => `<li><b>${FAM_ICON[F.id]} ${esc(F.name)} · ${esc(F.ability)}:</b> ${esc(F.desc)}</li>`).join('')}</ul>` : ''}
      <div class="acts"><button class="btn primary" data-act="close" type="button">Back to the table</button></div>`;
  }
  function menuHTML() {
    const on = (b) => (b ? 'On' : 'Off');
    return `<h2>Menu</h2><div class="menu">
      <button class="btn" data-act="how" type="button">How to play <span>›</span></button>
      <button class="btn" data-act="tHelpers" type="button" aria-pressed="${ui.helpers}">Helpers (bid count, hints, ★ sure books) <span>${on(ui.helpers)}</span></button>
      <button class="btn" data-act="tVoices" type="button">Critter voices <span>${ui.voices === 'off' ? 'Off' : ui.voices === 'quiet' ? 'Quiet' : 'Full (coach)'}</span></button>
      <button class="btn" data-act="tSeated" type="button" aria-pressed="${ui.seated}">Seated view (mock) <span>${on(ui.seated)}</span></button>
      <button class="btn" data-act="tTalk" type="button" aria-pressed="${ui.talk}">Table talk (placeholder lines) <span>${on(ui.talk)}</span></button>
      <button class="btn" data-act="tFast" type="button" aria-pressed="${ui.fast}">Fast bots <span>${on(ui.fast)}</span></button>
      <button class="btn" data-act="flags" type="button">Flags this session <span>${ui.flags.length}</span></button>
      <button class="btn" data-act="feedback" type="button">Give feedback <span>›</span></button>
      <button class="btn" data-act="sim" type="button">Bot simulation <span>›</span></button>
      <button class="btn" data-act="newmatch" type="button">New game <span>›</span></button>
    </div>
    <h2 style="margin-top:14px;font-size:15px;color:var(--muted)">Dev · jump ahead</h2><div class="menu">
      <button class="btn" data-act="autoHand" type="button">Autoplay this hand <span>${ui.auto === 'hand' ? 'running' : '▶'}</span></button>
      <button class="btn" data-act="autoNight" type="button">Autoplay to the end <span>${ui.auto === 'night' ? 'running' : '▶▶'}</span></button>
      ${ui.auto !== 'off' ? '<button class="btn" data-act="autoOff" type="button">Stop autoplay <span>■</span></button>' : ''}
      ${ui.club ? `<button class="btn" data-act="devWin" type="button">End night now · win <span>✓</span></button>
      <button class="btn" data-act="devWinFeats" type="button">End night · win with every feat <span>nil, dark, 2♠ book, low books, 13, no bags, 2 sets</span></button>
      <button class="btn" data-act="devLose" type="button">End night now · lose <span>✗</span></button>` : ''}
    </div><p class="note" style="color:var(--muted)">Seed ${G.seed} · hand ${G.handNo + 1}</p><div class="acts"><button class="btn primary" data-act="close" type="button">Close</button></div>`;
  }
  function trickHTML(cards, winner) { return `<div class="trickrow">${cards.map((x) => `<span style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;color:${x.seat === winner ? 'var(--gold)' : 'var(--muted)'}">${card(x.c)}${esc(name(x.seat))}</span>`).join('')}</div>`; }
  function handEndHTML(r) {
    const t0 = r.teams[0], t1 = r.teams[1];
    const line = (t, who) => `<tr><td>${who}</td><td>${t.bid}${r.players.filter((p, i) => SP.teamOf(i) === (who === 'Us' ? 0 : 1) && p.nil).length ? ' + nil' : ''}</td><td>${t.tricks}</td><td class="${t.pts > 0 ? 'ok' : t.pts < 0 ? 'bad' : ''}">${t.pts > 0 ? '+' : ''}${t.pts}</td><td>${t.score}</td></tr>`;
    const over = SP.gameOver(G);
    const notes = [...t0.notes.map((n) => 'Us: ' + n), ...t1.notes.map((n) => 'Them: ' + n)];
    return `<h2>${t0.pts > t1.pts ? 'Good hand.' : t0.pts < t1.pts ? 'Their hand.' : 'Even hand.'}</h2>
      <div class="tbl-wrap"><table><thead><tr><th>Team</th><th>Bid</th><th>Books</th><th>Points</th><th>Score</th></tr></thead><tbody>${line(t0, 'Us')}${line(t1, 'Them')}</tbody></table></div>
      <ul>${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      <p class="note" style="color:var(--muted)">Bags: us ${t0.totalBags}, them ${t1.totalBags}.</p>
      ${r.wildHit && r.wildHit.length ? `<p class="note" style="color:var(--gold)">${ui.wild && ui.wild.seen ? esc(CATCH.BY_ID[ui.wild.enc.id].name) : 'The critter'} liked that: ${r.wildHit.map((k) => esc(CATCH.LIKES[k].name.toLowerCase())).join(', ')}. Wake meter ${ui.wild.meter}%.</p>` : ''}
      ${over < 0 ? `<div class="night-goal"><b>The night isn’t over.</b> This was hand ${G.history.length}. First team to <b>${G.rules.target}</b> wins the night${ui.club ? ' and moves you up the Line' : ''}.<div class="goal-bar"><span class="us" style="width:${Math.max(0, Math.min(100, 100 * t0.score / G.rules.target))}%"></span></div><div class="goal-lbl"><span>Us ${t0.score}</span><span>${Math.max(0, G.rules.target - t0.score)} to go</span></div><div class="goal-bar them"><span style="width:${Math.max(0, Math.min(100, 100 * t1.score / G.rules.target))}%"></span></div><div class="goal-lbl"><span>Them ${t1.score}</span><span>${Math.max(0, G.rules.target - t1.score)} to go</span></div></div>` : ''}
      <div class="acts"><button class="btn primary" data-act="next" type="button" data-focus="1">${over >= 0 ? 'See the result' : 'Next hand'}</button></div>`;
  }
  function matchEndHTML() {
    const w = SP.gameOver(G);
    return `<h2>${w === 0 ? 'You and ' + esc(G.players[2].persona.name) + ' win!' : esc(name(1)) + ' and ' + esc(name(3)) + ' take it.'}</h2>
      ${ui.wild ? `<p>The sleeping critter stirs. Wake meter <b>${ui.wild.meter}%</b>${w === 0 ? '' : ' (halved for the loss)'}. Leave the table to try waking it.</p>` : ''}
      <p>Final score: us ${G.score[0]}, them ${G.score[1]}, in ${G.history.length} hands.${ui.club && ui.club.stake ? (w === 0 ? ` You take the stake: +${ui.club.stake * 2} marks.` : ` The stake goes to the house: −${ui.club.stake} marks.`) : ''}</p>
      ${ui.club ? '' : '<p class="note">This was the practice table, so nothing on the Line changed. To move up the Line, pick a town on the map and sit down in its back room.</p>'}<div class="acts">${ui.club ? '' : '<button class="btn" data-act="newmatch" type="button">Back to the Line</button>'}<button class="btn" data-act="feedback" type="button">Tell F what you thought</button><button class="btn primary" data-act="again" type="button" data-focus="1">${ui.club ? 'Leave the table' : 'Play again'}</button></div>`;
  }
  function flagHTML() {
    const f = ui.flagDraft;
    return `<h2>Flag ${esc(name(f.seat))}’s ${f.kind === 'bid' ? 'bid' : 'play'}</h2>
      <p>${f.kind === 'bid' ? `${esc(name(f.seat))} bid <b>${esc(f.bidText)}</b> with this hand:` : `${esc(name(f.seat))} played <b>${SP.cardName(f.c)}</b> from this hand:`}</p>
      <div class="trickrow">${f.hand.map((c) => card(c, c === f.c ? 'sel' : '')).join('')}</div>
      ${f.trick.length ? `<p class="note" style="color:var(--muted)">On the table before the play:</p>${trickHTML(f.trick, -1)}` : ''}
      <p class="note" style="color:var(--muted)">Bids: ${f.bids}. Books so far: us ${f.tricks[0]}, them ${f.tricks[1]}. Trick ${f.trickNo} of 13. Seed ${G.seed}, hand ${G.handNo + 1}.</p>
      <div class="field"><label for="flagText">What should ${esc(name(f.seat))} have done?</label><textarea id="flagText" rows="2" placeholder="e.g. should have ducked, partner already had it">${esc(f.note || '')}</textarea></div>
      <div class="acts"><button class="btn" data-act="close" type="button">Cancel</button><button class="btn primary" data-act="flagsave" type="button">Save flag</button></div>`;
  }
  function flagsHTML() {
    return `<h2>Flags this session</h2>${ui.flags.length ? `<ul>${ui.flags.map((f) => `<li>Hand ${f.handNo}, trick ${f.trickNo}: ${esc(f.who)} ${f.kind === 'bid' ? 'bid ' + esc(f.bidText) : 'played ' + esc(f.cardName)}${f.note ? ' — ' + esc(f.note) : ''} ${f.saved ? '' : '<i>(not saved to F, copy below)</i>'}</li>`).join('')}</ul>` : '<p>No flags yet. After any bot play, tap the ⚑ button under the table.</p>'}
      ${ui.flags.some((f) => !f.saved) ? `<div class="copybox" id="flagCopy">${esc(ui.flags.filter((f) => !f.saved).map(flagText).join('\n'))}</div><div class="acts"><button class="btn" data-act="flagcopy" type="button">Copy unsaved flags</button></div>` : ''}
      <div class="acts"><button class="btn primary" data-act="close" type="button">Close</button></div>`;
  }
  const flagText = (f) => `FLAG seed ${f.seed} hand ${f.handNo} trick ${f.trickNo}: ${f.who} ${f.kind === 'bid' ? 'bid ' + f.bidText : 'played ' + f.cardName} | hand ${f.hand.map(SP.cardName).join(' ')} | table ${f.trick.map((x) => SP.cardName(x.c)).join(' ')} | bids ${f.bids} | note: ${f.note || '-'}`;

  function renderOverlay() {
    const el = $('#overlay'); const O = ui.over;
    if (!O) { el.innerHTML = ''; return; }
    let inner = '';
    if (O.kind === 'how') inner = howHTML();
    else if (O.kind === 'menu') inner = menuHTML();
    else if (O.kind === 'sim') inner = simHTML();
    else if (O.kind === 'feedback') inner = feedbackHTML();
    else if (O.kind === 'flag') inner = flagHTML();
    else if (O.kind === 'flags') inner = flagsHTML();
    else if (O.kind === 'handEnd') inner = handEndHTML(O.data);
    else if (O.kind === 'matchEnd') inner = matchEndHTML();
    el.innerHTML = `<div class="veil"><div class="modal" role="dialog" aria-modal="true">${inner}</div></div>`;
  }

  // ---------- feedback ----------
  const FB = { q: {}, text: '', nm: '', saved: null };
  const FQ = [
    { id: 'exp', q: 'How much Spades have you played?', opts: ['A ton', 'Some', 'Never'] },
    { id: 'partner', q: 'Did your partner bid and play like a real partner?', opts: ['Yes', 'Mostly', 'Not really', 'No'] },
    { id: 'vs', q: 'Would you rather play with this partner or a random person online?', opts: ['This partner', 'About the same', 'Random person'] },
    { id: 'opps', q: 'Did the other team play like real people?', opts: ['Yes', 'Mostly', 'Not really'] },
    { id: 'fast', q: 'Did the table feel fast enough?', opts: ['Yes', 'A bit slow', 'Too fast'] },
    { id: 'fun', q: 'How fun was it, 1 to 5?', opts: ['1', '2', '3', '4', '5'] },
    { id: 'fam', q: 'Familiars (if you played with them)…', opts: ['Made it better', 'Didn’t matter', 'Got in the way', 'Didn’t play with them'] },
  ];
  function feedbackHTML() {
    const qs = FQ.map((f) => `<div class="field"><label>${esc(f.q)}</label><div class="choices">${f.opts.map((o) => `<button class="btn" type="button" data-fq="${f.id}" data-fv="${esc(o)}" aria-pressed="${FB.q[f.id] === o}">${esc(o)}</button>`).join('')}</div></div>`).join('');
    const summary = feedbackText();
    return `<h2>What did you think?</h2>
      <p class="note" style="color:var(--muted)">Six quick taps plus anything you want to say. Your answers go to F.</p>
      ${qs}
      <div class="field"><label for="fbText">What felt wrong, or what would you change?</label><textarea id="fbText" rows="3">${esc(FB.text)}</textarea></div>
      <div class="field"><label for="fbName">Your name (optional)</label><input id="fbName" type="text" value="${esc(FB.nm)}"></div>
      ${FB.saved === true ? '<p style="color:var(--good);font-weight:700">Saved. Thank you!</p>' : FB.saved === 'copy' ? `<p class="note" style="color:var(--muted)">Couldn’t save from this device, so copy your answers and text them to F:</p><div class="copybox" id="fbCopy">${esc(summary)}</div>` : ''}
      <div class="acts">${FB.saved === 'copy' ? '<button class="btn" data-act="fbcopy" type="button">Copy answers</button>' : ''}<button class="btn" data-act="close" type="button">Close</button>${FB.saved !== true ? '<button class="btn primary" data-act="fbsend" type="button">Send</button>' : ''}</div>`;
  }
  function feedbackText() {
    const lines = FQ.map((f) => `${f.q} ${FB.q[f.id] || '–'}`);
    lines.push(`Notes: ${FB.text || '–'}`); lines.push(`From: ${FB.nm || 'anonymous'} · partner ${G.players[2].persona.name} · ${G.history.length} hands · seed ${G.seed}`);
    return 'Trickbound feedback\n' + lines.join('\n');
  }
  async function getDb() { try { return window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { return null; } }
  async function sendFeedback() {
    FB.text = $('#fbText').value; FB.nm = $('#fbName').value;
    const body = { answers: Object.assign({}, FB.q), notes: FB.text, name: FB.nm, partner: ui.partner, mode: ui.mode, familiar: ui.familiar, seed: G.seed, hands: G.history.length, score: G.score.slice(), at: new Date().toISOString() };
    try { const db = await getDb(); if (!db) throw new Error('no db'); await db.collection('feedback').add(body); FB.saved = true; }
    catch (e) { FB.saved = 'copy'; }
    ui.feedbackDone = true; render();
  }
  async function saveFlag() {
    const f = ui.flagDraft; f.note = $('#flagText').value;
    const rec = { seed: G.seed, handNo: G.handNo + 1, trickNo: f.trickNo, who: name(f.seat), seat: f.seat, kind: f.kind, cardName: f.kind === 'bid' ? null : SP.cardName(f.c), bidText: f.bidText || null, hand: f.hand.map(SP.cardName), trick: f.trick.map((x) => `${name(x.seat)}:${SP.cardName(x.c)}`), bids: f.bids, tricks: f.tricks, partner: ui.partner, note: f.note, at: new Date().toISOString() };
    let saved = false;
    try { const db = await getDb(); if (db) { await db.collection('flags').add(rec); saved = true; } } catch (e) { saved = false; }
    ui.flags.push(Object.assign({ saved, hand: f.hand, trick: f.trick }, rec));
    closeOverlay(); addLog(saved ? 'Flag saved for F.' : 'Flag kept here (couldn’t reach F’s list); copy it from the menu.'); render();
  }

  // ---------- bot simulation ----------
  const sim = { running: false, st: null };
  function simHTML() {
    const st = sim.st; const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(0) + '%';
    let body = '<h2>Bot simulation</h2><p>Four bots play whole games to ' + G.rules.target + ' with no screen, on the same engine as this table.</p>';
    if (st) body += `<div class="tbl-wrap"><table><thead><tr><th>Measure</th><th>Result</th></tr></thead><tbody>
      <tr><td>Games / hands</td><td>${st.games} / ${st.hands}</td></tr>
      <tr><td>Hands per game</td><td>${st.handsPerGame.toFixed(1)}</td></tr>
      <tr><td>Team bids made</td><td class="${st.made / st.teamBids > 0.6 ? 'ok' : 'warn'}">${pct(st.made, st.teamBids)}</td></tr>
      <tr><td>Avg team bid / books</td><td>${(st.bidTotal / st.teamBids).toFixed(2)} / ${(st.tricksTotal / st.teamBids).toFixed(2)}</td></tr>
      <tr><td>Bags per team-hand</td><td>${(st.bags / st.teamBids).toFixed(2)}</td></tr>
      <tr><td>Nil bids (made)</td><td>${st.nils} (${pct(st.nilMade, st.nils)})</td></tr>
      <tr><td>Blind nils (made)</td><td>${st.blind} (${pct(st.blindMade, st.blind)})</td></tr></tbody></table></div>`;
    body += `<div class="acts"><button class="btn" data-act="close" type="button">Close</button><button class="btn primary" data-act="runsim" type="button" ${sim.running ? 'disabled' : ''}>${sim.running ? 'Running…' : 'Run 100 games'}</button></div>`;
    return body;
  }
  function runSim() { sim.running = true; renderOverlay(); setTimeout(() => { sim.st = SP.simulate(100, Math.floor(Math.random() * 1e6)); sim.running = false; if (ui.over && ui.over.kind === 'sim') renderOverlay(); }, 30); }

  // ---------- input ----------
  function ask(prompt) {
    ui.prompt = prompt; ui.sel = null; ui.hint = null;
    ui.flare = false;
    if (prompt.kind === 'play' && ui.coach) { let h = SP.suggest(G, 0); if (h && typeof h === 'object') { if (h.flare !== undefined) { ui.flare = true; h = h.flare; } else h = null; } ui.hint = h; ui.sel = h; }
    if ((prompt.kind === 'hop' || prompt.kind === 'hopgive') && ui.coach) { ui.hint = SP.hopPick(G, 0); ui.sel = ui.hint; }
    render();
    return new Promise((res, rej) => {
      cancels.add(rej); ui.resolver = (v) => { cancels.delete(rej); res(v); };
      if (ui.auto !== 'off') setTimeout(() => { if (ui.prompt === prompt && ui.resolver) answer(autoAnswer(prompt)); }, 150);
    });
  }
  // Dev autoplay: answer seat 0's prompt the way the bot would.
  function autoAnswer(P) {
    if (P.kind === 'blind') return !!SP.botBlindNil(G, 0);
    if (P.kind === 'bid') return SP.botBid(G, 0);
    if (P.kind === 'peek' || P.kind === 'count') return true;
    if (P.kind === 'hop' || P.kind === 'hopgive') return SP.hopPick(G, 0);
    if (P.kind === 'rethink') { const d = SP.FAMILIARS.koi.botUse(G, 0); return d ? d.delta : 0; }
    let c = SP.botPlay(G, 0); let flare = false;
    if (c && typeof c === 'object') { if (c.burrow) { SP.useFamiliar(G, 0); c = SP.botPlay(G, 0); if (c && typeof c === 'object') c = SP.legalPlays(G, 0)[0]; } else if (c.flare !== undefined) { flare = true; c = c.flare; } }
    return { c, flare };
  }
  function answer(v) { const r = ui.resolver; ui.resolver = null; ui.prompt = null; ui.sel = null; ui.hint = null; if (r) r(v); }
  let overResolver = null;
  function overlayWait(kind, data) {
    showOverlay(kind, data); ui.waitOver = { kind, data };
    if (kind === 'handEnd' && ui.auto === 'hand') ui.auto = 'off';
    return new Promise((res, rej) => {
      cancels.add(rej); overResolver = (v) => { cancels.delete(rej); ui.waitOver = null; res(v); };
      if (kind === 'handEnd' && ui.auto === 'night') setTimeout(() => { if (overResolver && ui.over && ui.over.kind === 'handEnd') { closeOverlay(); const r = overResolver; overResolver = null; r('next'); } }, 700);
    });
  }
  // Dev: end the night right now with a chosen result (and optionally every feat, to see rewards fire).
  function devEnd(won, feats) { ui.devEnd = { won, feats }; ui.auto = 'off'; closeOverlay(); cancelAll(); }

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (b.id === 'bMenu') return showOverlay('menu');
    if (b.dataset.fq) { FB.q[b.dataset.fq] = b.dataset.fv; FB.text = ($('#fbText') || {}).value || FB.text; FB.nm = ($('#fbName') || {}).value || FB.nm; return render(); }
    if (act === 'close') { if (ui.backToEnd) { ui.backToEnd = false; return showOverlay('matchEnd'); } if (ui.waitOver && overResolver && ui.over && ui.over.kind !== ui.waitOver.kind) return showOverlay(ui.waitOver.kind, ui.waitOver.data); closeOverlay(); return; }
    if (act === 'how') return showOverlay('how');
    if (act === 'sim') return showOverlay('sim');
    if (act === 'flags') return showOverlay('flags');
    if (act === 'flag') { if (!ui.lastBot) return; ui.flagDraft = Object.assign({ note: '' }, ui.lastBot); return showOverlay('flag'); }
    if (act === 'flagsave') return saveFlag();
    if (act === 'flagcopy') { const t = ui.flags.filter((f) => !f.saved).map(flagText).join('\n'); try { navigator.clipboard.writeText(t).catch(() => selectCopy('#flagCopy')); } catch (e) { selectCopy('#flagCopy'); } return; }
    if (act === 'feedback') { if (ui.over && ui.over.kind === 'matchEnd') ui.backToEnd = true; return showOverlay('feedback'); }
    if (act === 'fbsend') return sendFeedback();
    if (act === 'fbcopy') { const t = feedbackText(); try { navigator.clipboard.writeText(t).catch(() => selectCopy('#fbCopy')); } catch (e) { selectCopy('#fbCopy'); } return; }
    if (act === 'tHelpers') { ui.helpers = !ui.helpers; if (!ui.helpers) ui.hint = null; return render(); }
    if (act === 'tVoices') { ui.voices = ui.voices === 'off' ? 'quiet' : ui.voices === 'quiet' ? 'full' : 'off'; ui.coach = ui.voices === 'full'; if (ui.coach && ui.prompt && ui.prompt.kind === 'play') { let h = SP.suggest(G, 0); if (h && typeof h === 'object') h = h.flare !== undefined ? h.flare : null; ui.hint = h; ui.sel = h; } return render(); }
    if (act === 'tSeated') { ui.seated = !ui.seated; return render(); }
    if (act === 'tTalk') { ui.talk = !ui.talk; return render(); }
    if (act === 'tFast') { ui.fast = !ui.fast; try { localStorage.setItem('tb-fast', ui.fast ? 'on' : 'off'); } catch (e) { /* ignore */ } return render(); }
    if (act === 'newmatch') { closeOverlay(); ui.started = false; ui.auto = 'off'; ui.devEnd = null; cancelAll(); if (window.TBLine) window.TBLine.leave(); return; }
    if (act === 'autoHand' || act === 'autoNight') {
      ui.auto = act === 'autoHand' ? 'hand' : 'night';
      ui.backToEnd = false; const w = ui.waitOver;
      closeOverlay();
      if (ui.prompt && ui.resolver) answer(autoAnswer(ui.prompt));
      else if (w && w.kind === 'handEnd' && overResolver) { if (ui.auto === 'night') { const r = overResolver; overResolver = null; r('next'); } else showOverlay(w.kind, w.data); }
      return;
    }
    if (act === 'autoOff') { ui.auto = 'off'; return render(); }
    if (act === 'devWin') return devEnd(true, false);
    if (act === 'devWinFeats') return devEnd(true, true);
    if (act === 'devLose') return devEnd(false, false);
    if (act === 'runsim') return runSim();
    if (act === 'next' || act === 'again') { closeOverlay(); const r = overResolver; overResolver = null; ui.waitOver = null; if (r) r(act); return; }

    const P = ui.prompt; if (!P) return;
    if (P.kind === 'blind') { if (act === 'blindyes') return answer(true); if (act === 'blindno') return answer(false); }
    if (P.kind === 'peek') { if (act === 'peek') return answer(true); if (act === 'famskip') return answer(false); }
    if (P.kind === 'count') { if (act === 'count') return answer(true); if (act === 'famskip') return answer(false); }
    if (P.kind === 'hop' || P.kind === 'hopgive') { if (b.dataset.card !== undefined) { ui.sel = Number(b.dataset.card); ui.hint = null; return render(); } if (act === 'hopsend' && ui.sel !== null) return answer(ui.sel); if (act === 'famskip') return answer(null); }
    if (P.kind === 'play' && act === 'flare') { ui.flare = !ui.flare; return render(); }
    if (P.kind === 'play' && act === 'burrow') { const r = SP.useFamiliar(G, 0); if (r) { addLog('You use Mouse: Burrow. You may play any card this trick.'); if (ui.coach) { ui.hint = SP.suggest(G, 0); if (ui.hint && typeof ui.hint === 'object') ui.hint = null; ui.sel = ui.hint; } } return render(); }
    if (P.kind === 'rethink') { if (act === 'rethink+') return answer(1); if (act === 'rethink-') return answer(-1); if (act === 'famskip') return answer(0); }
    if (P.kind === 'play' && act === 'spark') { const r = SP.useFamiliar(G, 0); if (r) { announce(0, 'salamander'); ui.sparkHint = false; if (ui.coach) { ui.hint = SP.suggest(G, 0); ui.sel = ui.hint; } } return render(); }
    if (P.kind === 'bid' && b.dataset.bid !== undefined) { const v = Number(b.dataset.bid); return answer(v === 0 ? { bid: 0, nil: true } : { bid: v, nil: false }); }
    if (P.kind === 'play') {
      if (b.dataset.card !== undefined) { const c = Number(b.dataset.card); if (!SP.legalPlays(G, 0).includes(c)) return; if (ui.sel === c) return answer({ c, flare: ui.flare }); ui.sel = c; ui.hint = null; return render(); }
      if (act === 'hint') { let h = SP.suggest(G, 0); if (h && typeof h === 'object') h = h.flare !== undefined ? h.flare : null; ui.hint = h; ui.sel = h; return render(); }
      if (act === 'play' && ui.sel !== null) return answer({ c: ui.sel, flare: ui.flare });
    }
  });
  function selectCopy(sel) { const el = $(sel); if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  // ---------- game flow ----------
  function announce(seat, id, extra) {
    const F = SP.FAMILIARS[id]; const line = { owlet: `${name(seat)} use${seat === 0 ? '' : 's'} Owlet: peeks at ${seat === 0 ? name(2) : name(SP.partnerOf(seat))}’s hand.`, salamander: `${name(seat)} use${seat === 0 ? '' : 's'} Salamander: a spade can be led.`, koi: `${name(seat)} use${seat === 0 ? '' : 's'} Koi: bid changes ${extra && extra.delta > 0 ? 'up' : 'down'} to ${G.players[seat].bid}.`, badger: '', raven: `${name(seat)} use${seat === 0 ? '' : 's'} Raven: counts the spades.`, kilnback: `${name(seat)} use${seat === 0 ? '' : 's'} Kilnback: Flare! ${extra && extra.c !== undefined ? SP.cardName(extra.c) + ' counts a rank higher.' : ''}`, frog: `${name(seat)} use${seat === 0 ? '' : 's'} Frog: a card hops across the table.`, mouse: `${name(seat)} use${seat === 0 ? '' : 's'} Mouse: plays off-suit on purpose.`, sootling: `${name(seat)} use${seat === 0 ? '' : 's'} Sootling: smudges a look at ${name((seat + 1) % 4)}’s hand.`, cinderwick: '' }[id];
    if (line) addLog(line); if (seat !== 0 && ui.talk) bubble(seat, `${FAM_ICON[id]} ${F.ability}!`); render();
  }
  async function familiarPhase(phase) {
    if (ui.mode !== 'familiar') return;
    for (let k = 0; k < 4; k++) {
      const s = (G.leader + k) % 4; const F = SP.famOf(G, s); if (!F || !F.canUse(G, s)) continue;
      if (F.when !== phase) continue;
      if (s === 0) {
        if (F.id === 'owlet' || F.id === 'sootling') { const yes = await ask({ kind: 'peek' }); if (yes) { const r = SP.useFamiliar(G, 0); announce(0, F.id); addLog(`You saw ${r.cards.map(SP.cardName).join(' and ')}${F.id === 'sootling' ? ' in ' + name(1) + '’s hand' : ''}.`); } }
        if (F.id === 'koi') { const d = await ask({ kind: 'rethink' }); if (d) { const r = SP.useFamiliar(G, 0, { delta: d }); announce(0, 'koi', r); } else G.players[0].famUsed = true; }
        if (F.id === 'frog') { const give = await ask({ kind: 'hop' }); if (give !== null) { const r = SP.useFamiliar(G, 0, { give }); announce(0, 'frog', r); addLog(`You sent ${SP.cardName(r.give)} and got ${SP.cardName(r.back)}.`); } }
      } else if (s === 2 && F.id === 'frog') { await wait(450); const back = await ask({ kind: 'hopgive' }); const r = SP.useFamiliar(G, 2, { back }); if (r && r.give !== undefined) { announce(2, 'frog', r); addLog(`${name(2)} sent you ${SP.cardName(r.give)}; you sent ${SP.cardName(r.back)}.`); } }
      else { await wait(450); const r = SP.botFamiliar(G, s); if (r) announce(s, r.id, r); }
    }
  }
  function bidsSummary() { return G.players.map((p) => `${name(p.seat)} ${bidText(p)}`).join(', '); }
  function noteBot(seat, kind, c, bidT) {
    const p = G.players[seat];
    ui.lastBot = { seat, kind, c, bidText: bidT, hand: kind === 'bid' ? p.hand.slice() : p.hand.slice().concat([c]).sort(SP.sortKey), trick: G.trick.slice(), trickNo: G.tricksPlayed + 1, bids: bidsSummary(), tricks: [SP.teamTricks(G, 0), SP.teamTricks(G, 1)] };
  }

  async function playHand() {
    SP.deal(G); ui.log = []; ui.lastBot = null; ui.showLast = null; ui.hideHand = false;
    addLog(`Hand ${G.handNo + 1}. ${name(G.dealer)} deal${G.dealer === 0 ? '' : 's'}; ${name(G.leader)} bid${G.leader === 0 ? '' : 's'} first.`);
    G.turn = -1; render();
    // bidding, left of dealer first
    for (let k = 0; k < 4; k++) {
      const s = (G.dealer + 1 + k) % 4; G.turn = s; render();
      if (ui.mode === 'familiar' && s !== 0) { const r = SP.botFamiliar(G, s); if (r) { announce(s, r.id, r); await wait(400); } }
      if (s === 0) {
        let b = null;
        if (ui.mode === 'familiar' && G.players[0].familiar === 'raven' && SP.FAMILIARS.raven.canUse(G, 0)) { const yes = await ask({ kind: 'count' }); if (yes) { SP.useFamiliar(G, 0); announce(0, 'raven'); } }
        if (SP.canBlindNil(G, 0)) { ui.hideHand = true; const yes = await ask({ kind: 'blind' }); ui.hideHand = false; if (yes) b = { bid: 0, nil: true, blind: true }; }
        if (!b) b = await ask({ kind: 'bid' });
        SP.setBid(G, 0, b); addLog(`You bid ${bidText(me())}.`);
      } else {
        await wait(700);
        const blind = SP.botBlindNil(G, s); const b = blind ? { bid: 0, nil: true, blind: true } : SP.botBid(G, s);
        SP.setBid(G, s, b); const p = G.players[s];
        noteBot(s, 'bid', null, bidText(p));
        addLog(`${name(s)} bids ${bidText(p)}.`);
        if (ui.talk) bubble(s, p.nil ? pick(TALK.nil) : p.bid >= 5 ? pick(TALK.bidHigh) : p.bid <= 1 ? pick(TALK.bidLow) : bidText(p));
      }
      render();
    }
    G.turn = -1; render();
    addLog(`Us ${SP.teamBid(G, 0)}${G.players[0].nil || G.players[2].nil ? ' + nil' : ''}, them ${SP.teamBid(G, 1)}${G.players[1].nil || G.players[3].nil ? ' + nil' : ''}. ${name(G.leader)} lead${G.leader === 0 ? '' : 's'}.`);
    await wait(500);
    await familiarPhase('afterBids');
    // tricks
    G.turn = G.leader;
    while (G.tricksPlayed < 13) {
      const s = G.turn; render();
      if (G.trick.length === 0 && G.tricksPlayed === 1) await familiarPhase('afterTrick1');
      let c;
      let opts = null;
      if (s === 0) { ui.sparkHint = ui.mode === 'familiar' && G.players[0].familiar === 'salamander' && SP.FAMILIARS.salamander.canUse(G, 0) && SP.FAMILIARS.salamander.botUse(G, 0); const a = await ask({ kind: 'play' }); ui.sparkHint = false; c = a.c; if (a.flare && G.players[0].familiar === 'kilnback' && SP.FAMILIARS.kilnback.canUse(G, 0)) opts = { flare: true }; }
      else {
        await wait(G.trick.length === 0 ? 650 : 520);
        if (ui.mode === 'familiar' && G.trick.length === 0) { const r = SP.botFamiliar(G, s); if (r) { announce(s, r.id, r); await wait(500); } }
        c = SP.botPlay(G, s);
        if (c && typeof c === 'object') { if (c.burrow) { SP.useFamiliar(G, s); announce(s, 'mouse'); await wait(400); c = SP.botPlay(G, s); if (c && typeof c === 'object') c = SP.legalPlays(G, s)[0]; } else if (c.flare !== undefined) { opts = { flare: true }; c = c.flare; } }
        noteBot(s, 'play', c);
      }
      const r = SP.playCard(G, s, c, opts);
      if (opts && opts.flare) announce(s, 'kilnback', { c });
      if (s === 0) addLog(`You play ${SP.cardName(c)}${opts && opts.flare ? ' (flared)' : ''}.`); else addLog(`${name(s)} plays ${SP.cardName(c)}${opts && opts.flare ? ' (flared)' : ''}.`);
      render();
      if (r.done) {
        const w = r.winner; const last = G.lastTrick;
        ui.showLast = last; addLog(`${name(w)} take${w === 0 ? '' : 's'} the book.`); render();
        if (ui.talk && w !== 0) { const pw = G.players[w]; if (pw.nil) bubble(w, 'Ugh.'); else if (last.cards.some((x) => x.seat === 0 && SP.rank(x.c) >= 10)) bubble(w, pick(TALK.tookFromYou)); else if (w === 2 && me().nil) bubble(w, pick(TALK.partnerCover)); else if (G.r() < 0.35) bubble(w, pick(TALK.tookTrick)); }
        await wait(1100); ui.showLast = null; G.turn = w; render();
      }
    }
    const myUsed = G.players[0].famUsed; const meP = G.players[0];
    const st = ui.stats; if (st) { if (meP.nil && meP.tricks === 0) { st.nilsMade++; if (meP.blind) st.blindNilMade = true; } if (meP.tricks === 13) st.fullShift = true; if (G.feats.deuceBook[0]) st.deuceBook = true; if (meP.tricks >= 3 && G.feats.lowBooks[0]) st.lowBooksHand = true; }
    const res = SP.settle(G); G.turn = -1;
    if (st) { st.bags += res.teams[0].bags; if (res.teams[1].tricks < res.teams[1].bid) st.setsInflicted++; if (res.teams[0].pts > res.teams[1].pts) st.handsWon++; }
    if (ui.wild && CATCH) {
      const w = ui.wild; const fired = CATCH.likesFromHand(G, res); if (fired.includes('exact')) { w.exactCount = (w.exactCount || 0) + 1; if (w.exactCount >= 2) fired.push('exact2'); }
      const c = CATCH.BY_ID[w.enc.id]; const hit = fired.filter((k) => c.likes.includes(k));
      for (const k of hit) { w.hits[k] = (w.hits[k] || 0) + 1; w.meter = Math.min(100, w.meter + CATCH.METER_PER_LIKE); }
      res.wildHit = hit; if (hit.length) addLog(`${w.seen ? c.name : 'The sleeping critter'} stirs: ${hit.map((k) => CATCH.LIKES[k].name.toLowerCase()).join(', ')}.`);
    }
    if (myUsed && res.teams[0].pts > res.teams[1].pts) ui.growthUses++;
    if (ui.talk) { const t0 = res.teams[0]; if (t0.tricks >= t0.bid && t0.bid > 0) bubble(2, pick(TALK.made)); else if (t0.bid > 0) bubble(2, pick(TALK.set)); else if (G.bags[0] >= 7) bubble(2, pick(TALK.bags)); }
    return res;
  }
  async function playMatch() {
    const partner = SP.PERSONAS[ui.partner] || SP.PERSONAS.dee; const club = ui.club;
    const house = club && club.house && club.house.length === 2 ? club.house.map((k) => SP.PERSONAS[k]) : [SP.PERSONAS.gus, SP.PERSONAS.birdie];
    G = SP.newMatch(Math.floor(Math.random() * 1e9), [SP.PERSONAS.you, house[0], partner, house[1]], club ? Object.assign({ target: club.target }, club.rules || {}) : {});
    ui.growthUses = 0; ui.stats = { nilsMade: 0, blindNilMade: false, fullShift: false, deuceBook: false, lowBooksHand: false, bags: 0, setsInflicted: 0, handsWon: 0 };
    if (ui.mode === 'familiar') { G.players[0].sharp = !!ui.sharp; G.players[0].familiar = ui.familiar || 'owlet'; G.players[1].familiar = (club && club.houseFam && club.houseFam[house[0].key]) || PERSONA_FAM[house[0].key]; G.players[2].familiar = PERSONA_FAM[ui.partner] || 'owlet'; G.players[3].familiar = (club && club.houseFam && club.houseFam[house[1].key]) || PERSONA_FAM[house[1].key]; }
    ui.wild = club && club.pickup ? { enc: club.pickup, seen: !!club.pickupSeen, meter: 0, hits: {}, exactCount: 0 } : null;
    G.dealer = Math.floor(G.r() * 4); G.handNo = 0; ui.auto = 'off'; ui.devEnd = null; ui.waitOver = null; render();
    let a = 'again';
    try {
      for (let h = 0; h < 60; h++) {
        G.handNo = h;
        const res = await playHand();
        await overlayWait('handEnd', res);
        if (SP.gameOver(G) >= 0) break;
        G.dealer = (G.dealer + 1) % 4;
      }
      a = await overlayWait('matchEnd');
    } catch (e) {
      if (e !== ABORT) throw e;
      if (!ui.devEnd) return; // left the table
      const d = ui.devEnd; ui.devEnd = null; ui.prompt = null; ui.resolver = null; overResolver = null; ui.waitOver = null; G.turn = -1;
      const tgt = G.rules.target || 500; G.score = d.won ? [tgt + 10, Math.floor(tgt / 2)] : [Math.floor(tgt / 2), tgt + 10];
      if (d.feats && ui.stats) Object.assign(ui.stats, { nilsMade: 1, blindNilMade: true, fullShift: true, deuceBook: true, lowBooksHand: true, bags: 0, setsInflicted: 2, handsWon: Math.max(3, ui.stats.handsWon) });
      if (d.won) ui.growthUses = Math.max(ui.growthUses, 2);
      if (d.feats && ui.wild) { ui.wild.meter = 100; CATCH.BY_ID[ui.wild.enc.id].likes.forEach((k) => { ui.wild.hits[k] = 1; }); }
      if (!G.history.length) G.history.push({ dev: true, teams: [{ bid: 0, tricks: 0, pts: d.won ? G.score[0] : -G.score[1], score: G.score[0], bags: 0, totalBags: 0, notes: [] }, { bid: 0, tricks: 0, pts: d.won ? -G.score[0] : G.score[1], score: G.score[1], bags: 0, totalBags: 0, notes: [] }], players: G.players.map(() => ({ nil: false })) });
      addLog(`Dev: night ended as a ${d.won ? 'win' : 'loss'}.`); render();
    }
    ui.auto = 'off';
    if (ui.club && window.TBLine) { ui.started = false; window.TBLine.nightOver({ won: G.score[0] > G.score[1], townId: ui.club.id, tableIx: ui.club.tableIx, growthUses: ui.growthUses, stats: ui.stats, score: G.score.slice(), hands: G.history.length, pickup: ui.club.pickup ? { crewIx: ui.club.crewIx, enc: ui.club.pickup, meter: ui.wild ? ui.wild.meter : 0, hits: ui.wild ? ui.wild.hits : {} } : null }); return; }
    if (a === 'again') playMatch();
  }

  G = SP.newMatch(1, [SP.PERSONAS.you, SP.PERSONAS.gus, SP.PERSONAS.dee, SP.PERSONAS.birdie]); SP.deal(G); G.turn = -1; render();
  window.TBUI = {
    start(opts) {
      Object.assign(ui, opts);
      if (opts.voices) ui.coach = opts.voices === 'full';
      ui.started = true; playMatch();
    },
    get started() { return ui.started; },
  };
})();
