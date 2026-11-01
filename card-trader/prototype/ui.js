// Intergalactic Card Trader · UI (v3). Draws G and turns clicks into CT.act intents. No game rules live here.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
// Scenes list a fallback after each new v2 painting, so a missing file shows an older scene instead of nothing.
const IMG = { keyart: 'img/keyart.jpg', shop: 'img/shop.jpg', dock: 'img/dock.jpg', cardnight: 'img/cardnight.jpg', grader: 'img/grader.jpg', dj: 'img/dj.webp',
  tourney: 'img/tournament.jpg|img/cardnight.jpg', auction: 'img/auction.jpg|img/dock.jpg', release: 'img/release.jpg|img/dock.jpg', dig: 'img/shop.jpg', swap: 'img/cardnight.jpg' };
const SP_COLOR = { mollu: '#19C8D8', zekk: '#A6F01E', puffi: '#B28CFF' };
const GAME_COLOR = { shell: '#FF8FC7', hive: '#A6F01E', star: '#8B5CF6' };
const PORTRAIT_FILE = { quill: 'glyphsmith', hype: 'hypebros' };
const UI = { screen: 'opening', slot: null, G: null, sel: null, uvView: false, offer: 0, stock: false, nightGame: null, nightN: 3, lastPull: null, seenEvents: 0,
  react: null, lastResult: null, tourGame: null, tourPrize: null, room: false, roomSel: null, binderView: false, catalog: false, drag: null };

// ---------- stage scaling: a 1280x720 world letterboxed into any window ----------
function fit() { const s = Math.min(innerWidth / 1288, innerHeight / 728); const st = $('#stage'); st.style.setProperty('--st', `translate(-50%, -50%) scale(${s})`); st.style.transform = `translate(-50%, -50%) scale(${s})`; }

// Start a slot: fresh = a new run (straight to the first morning), else load the saved run.
function startSlot(n, fresh) {
  UI.slot = n; UI.sel = null; UI.stock = false; UI.lastPull = null; UI.seenEvents = 0; UI.lastResult = null;
  const s = fresh ? null : FE.readSlot(n);
  if (s && s.G) UI.G = s.G; else { UI.G = CT.newGame((Date.now() % 1e9) | 0); CT.act(UI.G, { t: 'start' }); }
  UI.seenEvents = UI.G.events.length; UI.screen = 'game'; save();
}
function save() { if (UI.slot && UI.G) FE.writeSlot(UI.slot, UI.G); }
const sting = k => { if (FE.settings.sfx) MUSIC.sting(k); };
function act(intent) {
  const r = CT.act(UI.G, intent);
  if (!r.ok) toast(r.error);
  return r;
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#stage').appendChild(t); setTimeout(() => t.remove(), 1800); }

// ---------- shared bits ----------
const money = n => Math.round(n) + '₵';
function hud() {
  const G = UI.G, D = G.week[G.dayIdx] || { name: '', visitors: [] };
  const custN = D.visitors.length, at = Math.max(0, G.visitIdx + 1);
  const ups = Object.keys(CT.UPGRADES).filter(k => G.up[k]).map(k => CT.UPGRADES[k].name.split(' ')[0]).join(' · ');
  return `<div id="hud">
    <div class="day">DAY ${G.dayIdx + 1}/${CT.DAYS.length} · ${esc(D.name.toUpperCase())}</div>
    ${G.phase === 'shop' || G.phase === 'visit' ? `<div class="stat"><small>Customer</small>${at}/${custN}</div>` : ''}
    <div class="spacer"></div>
    ${ups ? `<div class="stat" title="Loupe upgrades"><small>Loupe</small>${esc(ups)}</div>` : ''}
    <div class="stat"><small>Cash</small><span class="cash">${money(G.cash)}</span></div>
    ${G.tab ? `<div class="stat"><small>Tab</small><span class="tabv">${money(G.tab)}</span></div>` : ''}
    <div class="stat"><small>Rep</small>${G.rep}</div>
    <div class="stat"><small>Packs</small>${CT.packTotal(G)}</div>
    ${G.store && roomPhase() ? `<button class="btn ${UI.room ? 'pink' : G.store.crate ? 'lime' : 'white'}" data-act="room" title="Back room (B)" style="white-space:nowrap">${G.store.crate ? '📦 ' : ''}BACK ROOM</button>` : ''}
    <button class="btn white" data-act="stock">Stock (${G.stock.length})</button>
    <button class="btn ${FE.settings.music ? 'lime' : 'white'}" data-act="music" aria-pressed="${FE.settings.music}" title="Lane FM beat">♪</button>
    <button class="btn white" data-act="fe-menu" title="Menu" aria-label="Menu">☰</button>
  </div>`;
}
function dj(text) {
  return `<div id="dj"><div class="face" style="background-image:url(${IMG.dj})"></div>
    <div><div class="who">DJ VEE · LANE FM</div><div class="txt">${esc(text)}</div></div><div class="onair">ON AIR</div></div>`;
}
function bgUrl(key) { return (IMG[key] || IMG.shop).split('|').map(u => `url(${u})`).join(', '); }
function bg(key, dim) { return `<div class="bg" style="background-image:${bgUrl(key)};background-color:#2a1450"></div>${dim ? '<div class="scrim" style="background:rgba(18,10,31,' + dim + ')"></div>' : '<div class="scrim"></div>'}`; }
function portrait(who, cls) {
  const P = CT.PEOPLE[who];
  return `<div class="portrait ${cls || ''}" style="background:${SP_COLOR[P.species]}">
    <div class="fallback-face">${P.name[0]}</div>
    <div class="pic" style="background-image:url(img/p-${PORTRAIT_FILE[who] || who}.webp)"></div>
    <span class="chip sp">${P.bad ? '⚠ ' : ''}${CT.SPECIES[P.species].name}</span>
    <div class="nameplate">${esc(P.name)}</div></div>`;
}
function badgeFor(c) {
  if (c.know.fake) return 'FAKE';
  if (c.graded) return null;
  if (c.trim && c.know.loupe) return 'TRIM';
  if (c.know.loupe) return 'G' + CT.trueGrade(c);
  return null;
}
function findAny(uid) {
  const G = UI.G, N = G.night;
  return G.stock.find(x => x.uid === uid) || (G.visit && G.visit.cards.find(x => x.uid === uid)) ||
    (N && N.swaps && (N.swaps.find(s => s.theirs.uid === uid) || {}).theirs) || (N && N.dig && N.dig.cards.find(x => x.uid === uid && x.flipped)) || null;
}
function card(c, o) { o = o || {}; return ART.cardHTML(c, Object.assign({ readable: CT.readable(UI.G, c), badge: badgeFor(c) }, o)); }
function estText(c) {
  const e = CT.estimate(UI.G, c);
  if (e.fake) return '0₵ (fake)';
  const unsure = e.rarity == null || e.grade == null;
  return (unsure ? '~' : '') + money(e.value) + (unsure ? '?' : '');
}
const isPump = c => UI.G.pump && UI.G.pump.t === c.t;

// ---------- coach: one hint at a time, tied to what's on the counter ----------
function hint() {
  const G = UI.G, v = G.visit;
  if (G.say && G.say.who === 'vee' && ['morning', 'close', 'night', 'end'].indexOf(G.phase) >= 0) return G.say.text;
  if (G.phase === 'shop') {
    if (G.visitIdx < 0) return G.say && G.say.who === 'vee' ? G.say.text : 'Doors are open. Tap NEXT CUSTOMER.';
    return G.store && !CT.where(G, 'case').length ? 'Breather! Your display case is empty: step into the BACK ROOM (B) and put some hard-sleeved cards or slabs on show. Browsers buy from it between customers.' : 'Breather! Rip a pack, tidy the BACK ROOM (B), or bring in the next customer.';
  }
  if (G.phase !== 'visit' || !v) return '';
  if (v.role === 'weigh') return 'The Scale Gang feels packs for the heavy ones: the hits. Let them pick and the packs they leave behind are duds. Sell from behind the counter instead.';
  if (v.role === 'thief') return G.store.locked ? 'Lock\'s on the case. Sticky can still reach the rack. Keep an eye on them?' : 'Fluffy, wandering, very near your unlocked case... Watch them, or lose something.';
  if (v.role === 'switch') return 'Card switchers swap your card for a fake while you\'re not looking. Watch the hands, or only show cards in your stamped hard sleeves, mag cases or slabs.';
  if (v.role === 'reseal') return 'Sealed product way under retail is a classic resealer move: packs opened, searched for hits, glued shut. Check the seams.';
  if (v.who === 'snip' && !v.cards.some(c => c.know.loupe)) return 'Every card a "perfect 10"? Edges that sharp can mean a trim. Put one under the Loupe and look at the size.';
  if (v.role === 'scalp') return G.policy.limit2 ? 'Your Limit 2 sign is up, so Skrimp can only take two packs.' : 'Easy cash now, but scalped packs mean tomorrow\'s pack buyers already have theirs, and the strip remembers. The Limit 2 sign (at close) stops him.';
  const looked = v.cards.some(c => c.know.loupe || c.know.uv || c.know.read);
  if (v.who === 'quill' && !G.up.spec) return 'Perfect promos and serials from a stranger... the basic UV lamp can\'t catch Glyphsmith ring fakes. The Spectrometer can.';
  if (v.who === 'hype') return 'Hype price today. Who\'s docking tomorrow? Check the close-up report before you believe a rumor.';
  if (v.role === 'sell' || v.role === 'lot' || v.role === 'bulk') {
    if (!looked) return v.role === 'lot' ? 'A whole binder page for one price! Old binders hide First Runs, vintage and misprints. Tap cards to inspect.' : 'Tap a card to put it under the Loupe. Look for mirror foil, stamps and serial numbers too.';
    if (v.cards.some(c => c.know.loupe && !c.flawUsed && Math.min(c.cen, c.edg, c.sur) <= 6)) return G.up.lens ? 'You found a flaw! POINT OUT FLAW knocks their price down, unless the Print Lens says it\'s a factory misprint. Then keep quiet and buy it.' : 'You found a flaw! POINT OUT FLAW knocks their price down. (Is it damage, or a misprint? Only the Print Lens can tell.)';
    return v.species === 'mollu' ? 'Mollu love round numbers. They pay extra for First Runs and vintage when they buy.' : v.species === 'zekk' ? 'Zekk split the difference fast. As buyers they love serial numbers and misprints.' : 'Puffi care about condition and pay up for full-art and alt-art.';
  }
  if (v.role === 'sealed') return v.showing ? 'Name your price for the packs, or take their bid.' : 'They want sealed packs. SHOW PACKS to hear an offer.' + (G.week[G.dayIdx].release ? ' Release Day: every 3rd pack sold earns you a release promo.' : '');
  if (!v.showing) return 'They want ' + CT.wantsText(v.wants) + '. Pick a card from your stock on the right.';
  return 'Name your price. Push too far past what it\'s worth and they\'ll get insulted.';
}

// ---------- screens ----------
function render() {
  const G = UI.G, st = $('#stage');
  if (UI.screen !== 'game') { st.innerHTML = FE.render(); FE.afterRender(); return; }
  let html = '';
  if (UI.room && !roomPhase()) UI.room = false;
  if (UI.room) html = roomScreen();
  else if (G.phase === 'morning') html = morningScreen();
  else if (G.phase === 'shop' || G.phase === 'visit') html = shopScreen();
  else if (G.phase === 'close') html = closeScreen();
  else if (G.phase === 'night') html = nightScreen();
  else if (G.phase === 'end') html = endScreen();
  if (UI.stock) html += stockDrawer();
  if (UI.catalog) html += catalogHTML();
  if (UI.sel) html += loupeScreen();
  html += FE.overlay();
  st.innerHTML = html; FE.afterRender(); UI.react = null;
  const sl = $('#offer'); if (sl) sl.addEventListener('input', e => { UI.offer = +e.target.value; const o = $('#offerv'); if (o) o.textContent = money(UI.offer); const b = $('[data-act=offer]'); if (b) b.textContent = (G.visit && (G.visit.showing) ? 'ASK ' : 'OFFER ') + money(UI.offer); });
}

function demandBars(demand) {
  return `<div class="bars">${Object.keys(CT.GAMES).map(g => { const d = demand[g]; return `<div class="bar"><span>${CT.GAMES[g].name}</span><div class="track"><div class="fill" style="width:${Math.min(100, d / 1.8 * 100)}%;background:${GAME_COLOR[g]}"></div></div><span>×${d.toFixed(2)}</span></div>`; }).join('')}</div>`;
}
function eventsHTML(evts) {
  const G = UI.G, out = [];
  for (const e of evts) {
    if (e.t === 'grade') {
      const c = G.stock.find(x => x.uid === e.uid); if (!c) continue;
      out.push(`<div style="display:flex;flex-direction:column;align-items:center;gap:4px">${card(c, { size: 'sm' })}<div class="stamp" style="font-size:${e.fake || e.altered ? 30 : 46}px">${e.fake ? 'FAKE!' : e.altered ? 'ALTERED' : e.grade}</div><div class="chip">${CT.GRADERS[e.co].name}</div></div>`);
    } else if (e.t === 'complaint') out.push(`<div class="chip" style="background:var(--coral)">${esc(e.who)} found a fake: refunded ${money(e.price)}, rep −8</div>`);
  }
  return out.join('') + v3EventsHTML(evts);
}
function morningScreen() {
  const G = UI.G, D = G.week[G.dayIdx];
  const ships = D.ships.map(s => `<span class="chip" style="background:${SP_COLOR[s]}">${CT.SPECIES[s].name} ships</span>`).join(' ');
  const hot = G.hotList.map(t => { const tm = CT.tmpl(t); return `<div class="chip" style="background:${GAME_COLOR[tm.game]}">🔥 ${esc(tm.name)} <small>(${CT.GAMES[tm.game].name})</small></div>`; }).join('');
  const rumor = G.pump ? (G.dayIdx === 3 ? `<div class="chip rumor">📣 RUMOR: ${esc(CT.tmpl(G.pump.t).name)} is "about to spike" (×1.8 today)</div>` : G.dayIdx >= 4 ? `<div class="chip rumor down">📉 ${esc(CT.tmpl(G.pump.t).name)} got reprinted: ×0.5</div>` : '') : '';
  const ev = eventsHTML(G.events);
  return `${hud()}${bg(D.release ? 'release' : 'dock', .2)}
  <div class="panel tilt-l" style="left:40px;top:86px;width:560px;padding:16px">
    <div class="h" style="font-size:28px">MORNING · ${esc(D.name.toUpperCase())}</div>
    <div style="margin:10px 0">${ships}</div>
    <div class="h" style="font-size:14px;margin:6px 0">TODAY'S DEMAND</div>${demandBars(G.demand)}
    <div class="h" style="font-size:14px;margin:12px 0 6px">HOT LIST · +50%</div><div class="row">${hot}${rumor}</div>
    <div style="margin-top:8px;font-size:13px">Rent due at close: <b>${money(D.rent)}</b>${G.dayIdx < CT.DAYS.length - 1 ? ' · <b>After Hours</b> event tonight' : ' · <b>Grade Day</b> tonight'}</div>
  </div>
  ${ev ? `<div class="panel tilt-r" style="left:640px;top:96px;width:600px;padding:14px"><div class="h" style="font-size:22px">OVERNIGHT</div><div class="row" style="margin-top:10px;gap:18px">${ev}</div></div>` : ''}
  <div class="sheet" style="right:40px;bottom:96px">${G.store && G.store.crate ? '<button class="btn big lime" data-act="room" style="margin-right:12px">📦 UNPACK THE CRATE</button>' : ''}<button class="btn big pink" data-act="open">OPEN SHOP ▶</button></div>
  ${dj(hint())}`;
}

function shopScreen() {
  const G = UI.G, v = G.visit;
  let html = `${hud()}${bg('shop')}`;
  if (!v) {
    const D = G.week[G.dayIdx], left = D.visitors.length - (G.visitIdx + 1), L = UI.lastResult;
    html += `<div id="idle">
      ${L ? `<div class="lastvisit ${L.result}">${portrait(L.who, 'mini')}<div class="stamp" style="font-size:30px">${L.result === 'deal' ? 'DEAL!' : L.result === 'walk' ? 'WALKED' : 'PASS'}</div></div>` : ''}
      <button class="btn big pink pop" data-act="next">${left ? 'NEXT CUSTOMER ▶' : 'CLOSE UP SHOP ▶'}</button>
      <div class="chip">${left} customer${left === 1 ? '' : 's'} left today</div></div>
      <div class="panel tilt-l" style="left:16px;top:96px;width:330px;padding:14px">
        <div class="h" style="font-size:18px">BACK ROOM</div>
        <div style="font-size:14px;margin:6px 0 10px">Rip a pack: 5 cards, a rare slot that can hit a holo, grail, full-art or alt-art. Or keep them sealed for pack buyers.</div>
        ${Object.keys(CT.GAMES).map(g => `<div class="row" style="align-items:center;margin-bottom:6px"><span class="chip" style="background:${GAME_COLOR[g]};flex:1">${CT.GAMES[g].name} × ${G.packs[g]}</span><button class="btn sm" data-act="crack" data-game="${g}" ${G.packs[g] ? '' : 'disabled'}>RIP</button></div>`).join('')}
        <div style="font-size:13px;margin-top:8px">Bulk bin: <b>${G.bulk}</b> commons (sells 1₵ each)${G.policy.limit2 ? ' · <b>Limit 2</b> sign is up' : ''}</div>
      </div>
      ${UI.lastPull ? `<div class="panel tilt-r" style="right:16px;top:96px;width:350px;padding:12px"><div class="h" style="font-size:18px">FRESH PULL!</div><div class="row" style="margin-top:8px;justify-content:center">${UI.lastPull.map((c, i) => `<div class="flipin" style="animation-delay:${i * 0.12}s">${card(c, { size: 'xs', act: 'loupe' })}</div>`).join('')}</div></div>` : ''}`;
    return html + dj(hint());
  }
  const P = CT.PEOPLE[v.who], youBuy = v.role === 'sell' || v.role === 'lot' || v.role === 'bulk';
  const pips = Array.from({ length: v.maxPatience }, (_, i) => `<span class="pip ${i < v.patience ? '' : 'off'}"></span>`).join('');
  const bubble = G.say && G.say.who === v.who ? G.say.text : '…';
  html += `<div id="cust" class="panel tilt-l">${portrait(v.who, UI.react || 'enter')}
    <div class="pips">Patience ${pips}</div>
    <div class="bubble">${esc(bubble)}</div>
    ${v.wants ? `<div class="wants">Wants: ${esc(CT.wantsText(v.wants))}</div>` : ''}
    <div class="muted" style="font-size:12px">${esc(P.line)}</div></div>`;
  const v3 = v3DealHTML(v);
  if (v3) html += v3MatHTML(v);
  else if (youBuy) html += `<div id="mat" class="${v.cards.length > 3 ? 'lot' : ''}">${v.cards.map(c => card(c, { size: v.cards.length > 3 ? 'sm' : 'md', act: 'loupe' })).join('')}</div>`;
  else if (v.role === 'scalp') html += `<div id="mat">${Array.from({ length: Math.min(CT.packTotal(G), G.policy.limit2 ? 2 : 12) }, (_, i) => `<div class="card xs pop" style="--fr:linear-gradient(160deg,#FF2E93,#6A2BD9);animation-delay:${i * .04}s"><div class="inner" style="display:grid;place-items:center;color:#fff;font-family:var(--display);font-size:12px;background:repeating-linear-gradient(45deg,#6A2BD9 0 8px,#FF2E93 8px 16px)">PACK</div></div>`).join('') || '<div class="chip">No packs to scalp</div>'}</div>`;
  else if (v.showing === 'packs') html += `<div id="mat">${Array.from({ length: v.packs }, (_, i) => `<div class="card sm pop" style="--fr:linear-gradient(160deg,#FF2E93,#6A2BD9);animation-delay:${i * .06}s"><div class="inner" style="display:grid;place-items:center;color:#fff;font-family:var(--display);font-size:16px;background:repeating-linear-gradient(45deg,#6A2BD9 0 8px,#FF2E93 8px 16px)">PACK</div></div>`).join('')}</div>`;
  else if (v.showing) { const c = G.stock.find(x => x.uid === v.showing); html += `<div id="mat">${c ? card(c, { act: 'loupe' }) : ''}</div>`; }
  else html += `<div id="mat"><div class="chip" style="font-size:18px">${v.role === 'sealed' ? esc(P.name) + ' wants sealed packs →' : '← ' + esc(P.name) + ' is browsing. Pick a card on the right →'}</div></div>`;
  html += `<div id="deal" class="panel tilt-r">${v3 || (v.role === 'scalp' ? dealScalpHTML(v) : youBuy ? dealBuyHTML(v) : dealSellHTML(v))}</div>`;
  return html + dj(hint());
}
function dealScalpHTML(v) {
  const G = UI.G, n = Math.min(CT.packTotal(G), G.policy.limit2 ? 2 : 99);
  const promos = G.policy.limit2 ? [] : G.stock.filter(c => c.v && c.v.promo && !c.know.fake && !c.graded);
  let cash = n * (CT.PACK_RETAIL + 3); for (const c of promos) cash += Math.round(CT.trueValue(G, c) * 0.9);
  return `<div class="h" style="font-size:20px">⚠ THE SCALPER</div>
    <div>Skrimp takes <b>${n} pack${n === 1 ? '' : 's'}</b>${promos.length ? ` and <b>${promos.length} promo${promos.length > 1 ? 's' : ''}</b>` : ''}, no haggling.</div>
    <div class="price-row"><span>Cash now</span><span class="big">${money(cash)}</span></div>
    <div class="est">The catch: tomorrow's pack buyers already bought from him (they'll want fewer), and every pack past 2 and every promo costs rep. ${G.policy.limit2 ? 'Your <b>Limit 2</b> sign caps him at 2 packs.' : 'A <b>Limit 2</b> sign (set at close) would cap him.'}</div>
    <div class="row"><button class="btn lime" data-act="accept" ${n || promos.length ? '' : 'disabled'}>TAKE THE CASH</button><button class="btn white" data-act="pass">NO DEAL</button></div>`;
}
function dealBuyHTML(v) {
  const G = UI.G;
  let est = 0, unsure = false; for (const c of v.cards) { const e = CT.estimate(G, c); est += e.value; if (!e.fake && (e.rarity == null || e.grade == null)) unsure = true; }
  const max = Math.max(10, Math.round(Math.max(v.ask, est) * 1.1));
  if (!UI.offer || UI.offer > max || UI._for !== v) { UI.offer = Math.max(1, Math.round(v.ask * 0.6 / (v.species === 'mollu' ? 10 : 1)) * (v.species === 'mollu' ? 10 : 1)); UI._for = v; }
  const flawable = v.cards.some(c => c.know.loupe && !c.flawUsed && (Math.min(c.cen, c.edg, c.sur) <= 6 || c.know.fake));
  const pumped = v.cards.some(isPump);
  return `<div class="h" style="font-size:20px">${v.role === 'lot' ? 'BINDER LOT' : v.role === 'bulk' ? 'SHOEBOX' : 'THEY\'RE SELLING'} · ${v.cards.length} CARD${v.cards.length > 1 ? 'S' : ''}</div>
    <div class="price-row"><span>Their price</span><span class="big">${money(v.ask)}</span></div>
    <div class="est">Your read: <b>${unsure ? '~' : ''}${money(est)}${unsure ? '?' : ''}</b> at today's prices${unsure ? ' (inspect to be sure)' : ''}.${pumped ? ' <b style="color:#c41d1d">Includes rumor hype.</b>' : ''} You have ${money(G.cash)}.</div>
    <div class="offer-val" id="offerv">${money(UI.offer)}</div>
    <input id="offer" class="slider" type="range" min="1" max="${max}" step="1" value="${UI.offer}" aria-label="Your offer">
    <div class="row"><button class="btn pink" data-act="offer">OFFER ${money(UI.offer)}</button></div>
    <div class="row"><button class="btn lime" data-act="accept" ${G.cash >= v.ask ? '' : 'disabled'}>PAY ${money(v.ask)}</button><button class="btn cyan" data-act="flaw" ${flawable ? '' : 'disabled'}>POINT OUT FLAW</button></div>
    <div class="row"><button class="btn white" data-act="pass">PASS</button></div>
    <div class="muted" style="font-size:12px">Tap a card for the Loupe. Each tool costs 1 patience${G.up.hands ? ' (first tool per card free: Steady Hands)' : ''}; each offer costs 1.</div>`;
}
function dealSellHTML(v) {
  const G = UI.G;
  if (!v.showing) {
    if (v.role === 'sealed') {
      const have = CT.packTotal(G);
      return `<div class="h" style="font-size:20px">SEALED PACKS</div><div>You have <b>${have}</b> packs. They want ${v.packs}.${G.scalpedToday ? ' (Fewer than usual: Skrimp got to them yesterday.)' : ''}</div>
        <div class="row"><button class="btn pink" data-act="showPacks" ${have ? '' : 'disabled'}>SHOW PACKS</button><button class="btn white" data-act="pass">PASS</button></div>`;
    }
    const fits = G.stock.filter(c => CT.matches(G, v.wants, c));
    return `<div class="h" style="font-size:20px">YOUR STOCK</div><div style="font-size:13px">Cards that fit what ${esc(CT.PEOPLE[v.who].name)} wants:</div>
      ${fits.length ? `<div class="stocklist">${fits.map(c => `<div style="text-align:center">${card(c, { size: 'xs', act: 'show' })}<div style="font-size:12px;font-weight:800">${estText(c)}</div></div>`).join('')}</div>` : '<div class="est">Nothing that fits. Pass for now, and remember who wants what.</div>'}
      <div class="row"><button class="btn white" data-act="pass">PASS</button></div>`;
  }
  const c = v.showing === 'packs' ? null : G.stock.find(x => x.uid === v.showing);
  const est = c ? CT.estimate(G, c).value : CT.PACK_RETAIL * v.packs;
  const max = Math.max(10, Math.round(Math.max(est, v.bid) * 2));
  if (!UI.offer || UI._for !== v.showing) { UI.offer = Math.round(Math.max(est, v.bid) * 1.25); UI._for = v.showing; }
  return `<div class="h" style="font-size:20px">THEY'RE BUYING</div>
    <div class="price-row"><span>Their bid</span><span class="big">${money(v.bid)}</span></div>
    <div class="est">Your read: <b>${c ? estText(c) : money(est)}</b>${c ? ' (today\'s demand' + (G.hotList.indexOf(c.t) >= 0 ? ', HOT' : '') + (isPump(c) ? ', RUMOR' : '') + ')' : ' at retail'}${c && c.cost ? ` · you paid ${money(c.cost)}` : ''}</div>
    <div class="offer-val" id="offerv">${money(UI.offer)}</div>
    <input id="offer" class="slider" type="range" min="1" max="${max}" step="1" value="${Math.min(UI.offer, max)}" aria-label="Your asking price">
    <div class="row"><button class="btn pink" data-act="offer">ASK ${money(UI.offer)}</button></div>
    <div class="row"><button class="btn lime" data-act="accept">TAKE ${money(v.bid)}</button><button class="btn white" data-act="pass">NO DEAL</button></div>`;
}

// Print readout lines for the Loupe: what the player has actually learned about this copy.
function printLines(c) {
  const G = UI.G, v = c.v || {}, k = c.know, out = [];
  const fin = v.fin === 'full' || v.fin === 'alt' ? CT.FINISH[v.fin] : k.loupe ? CT.FINISH[v.fin || 'std'] : '?';
  out.push(['Finish', fin]);
  if (k.loupe) {
    const st = [];
    if (v.promo) st.push(CT.PROMOS[v.promo].name);
    if (v.first) st.push('First Run');
    if (v.serial) st.push('#' + v.serial + '/50' + (k.print ? ' ✓' : ' (unverified)'));
    if (v.signed) st.push('Signed' + (k.print ? ' ✓' : ' (unverified)'));
    out.push(['Stamps', st.length ? st.join(' · ') : 'none']);
  } else out.push(['Stamps', '?']);
  out.push(['Set', k.print ? CT.SETS[v.set || 'core'] : G.up.lens ? '? (use Condition)' : '<span class="muted">needs Print Lens</span>']);
  out.push(['Misprint', k.print ? (v.err ? '<b style="color:#0a8a3e">' + CT.ERRORS[v.err] + ': worth ×3, and now you can prove it to buyers!</b>' : 'none') : G.up.lens ? '?' : '<span class="muted">needs Print Lens</span>']);
  return out;
}
function uvLine(c) {
  const G = UI.G, k = c.know;
  if (!k.uv) return '?';
  if (k.fake) return '<b style="color:#c41d1d">FAKE: ' + (c.fake === 'uv' ? 'no watermark' : c.fake === 'stock' ? 'wrong world\'s mark' : 'ring fake, copied mark, wrong spectrum') + '</b>';
  if (G.up.spec && !k.spec) return 'Genuine watermark (basic lamp). <b>Re-scan with the Spectrometer</b>';
  return 'Genuine watermark' + (k.spec ? ' (spectrum checked)' : ' (basic lamp)');
}
function loupeScreen() {
  const G = UI.G, c = findAny(UI.sel);
  if (!c) { UI.sel = null; return ''; }
  const atCounter = !!(G.visit && G.visit.cards.indexOf(c) >= 0), tm = CT.tmpl(c.t), rd = CT.readable(G, c), e = CT.estimate(G, c);
  const cost = atCounter ? (G.up.hands && !c.know.free ? ' · free' : ' · 1 patience') : '';
  const [cl, cr] = CT.centerRatio(c);
  const flawy = c.know.loupe && Math.min(c.cen, c.edg, c.sur) <= 6;
  const rescan = c.know.uv && G.up.spec && !c.know.spec;
  const relens = c.know.loupe && G.up.lens && !c.know.print;
  const inStock = !!G.stock.find(x => x.uid === c.uid);
  return `<div id="loupe">
    <div class="side">
      <div class="h" style="font-size:30px;color:var(--sun)">THE LOUPE</div>
      <div class="tools">
        <button class="btn ${c.know.loupe && !relens ? 'lime' : ''}" data-act="tool" data-tool="loupe">🔍 ${relens ? 'PRINT LENS' : 'CONDITION'}${c.know.loupe && !relens ? ' ✓' : cost}</button>
        <button class="btn ${c.know.uv && !rescan ? 'lime' : ''}" data-act="tool" data-tool="uv">🟣 ${rescan ? 'RE-SCAN' : 'UV LAMP'}${c.know.uv && !rescan ? ' ✓' : cost}</button>
        <button class="btn ${rd ? 'lime' : ''}" data-act="tool" data-tool="read" ${rd ? 'disabled' : ''}>🔤 DECODE${rd ? ' ✓' : cost}</button>
        <button class="btn cyan" data-act="tool" data-tool="translate" ${rd ? 'disabled' : ''}>TRANSLATOR ${CT.TRANSLATE_FEE}₵</button>
      </div>
      <div class="read"><dl>
        <dt>Card</dt><dd>${rd ? esc(tm.name) + ' · ' + CT.RARITY_NAME[tm.rarity] : '??? <span class="muted">(' + CT.GAMES[tm.game].script + ' script)</span>'}</dd>
        <dt>Condition</dt><dd>${c.know.loupe ? `centering ${cl}/${cr} · edges ${c.edg} · surface ${c.sur}${c.fake === 'stock' ? ' · <b style="color:#c41d1d">wrong card stock!</b>' : ''}${c.trim && !c.graded ? ' · <b style="color:#c41d1d">edges too perfect, and it\'s 0.4 mm short: TRIMMED (worth about a third; graders stamp ALTERED)</b>' : ''}` : '?'}</dd>
        ${inStock && G.store ? `<dt>Kept</dt><dd>${c.loc} · ${c.graded ? 'slab' : PROT_NAME[c.prot || 'none']}</dd>` : ''}
        <dt>Grade</dt><dd>${c.graded ? CT.GRADERS[c.graded.co].name + ' ' + c.graded.grade : e.grade != null ? '~' + e.grade : '?'}</dd>
        ${printLines(c).map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}
        <dt>UV</dt><dd>${uvLine(c)}</dd>
        <dt>Worth</dt><dd><b>${estText(c)}</b> today${isPump(c) ? (G.dayIdx === 3 ? ' <b style="color:#c41d1d">(rumor hype ×1.8)</b>' : G.dayIdx >= 4 ? ' <b style="color:#c41d1d">(reprinted ×0.5)</b>' : '') : ''}</dd>
      </dl></div>
      ${!rd && G.fluency[tm.game] < CT.FLUENT_AT ? `<div style="font-size:13px">Decode ${CT.FLUENT_AT - G.fluency[tm.game]} more ${CT.GAMES[tm.game].name} cards and you'll read the script for free.</div>` : ''}
      <div class="row">
        ${atCounter && flawy && !c.flawUsed ? '<button class="btn cyan" data-act="flaw" data-uid="' + c.uid + '">POINT OUT FLAW</button>' : ''}
        ${inStock && (G.phase === 'shop' || G.phase === 'close') && !c.graded ? '<button class="btn white" data-act="toBulk">TOSS TO BULK</button>' : ''}
        <button class="btn pink" data-act="closeLoupe">BACK</button>
      </div>
    </div>
    <div style="position:relative;display:grid;place-items:center">
      <div style="position:relative">${card(c, { size: 'lg', loupe: c.know.loupe, uv: UI.uvView && c.know.uv })}
        ${c.know.loupe ? `<div class="chip" style="position:absolute;left:50%;top:-16px;transform:translateX(-50%);background:var(--sun)">centering ${cl}/${cr}</div>` : ''}</div>
      ${c.know.uv ? `<button class="btn sm white" style="margin-top:14px" data-act="uvview">${UI.uvView ? 'LAMP OFF' : 'LAMP ON'}</button>` : ''}
    </div></div>`;
}

function stockDrawer() {
  const G = UI.G, groups = Object.keys(CT.GAMES);
  return `<div id="loupe" style="display:block;overflow:auto">
    <div class="row" style="align-items:center;margin-bottom:12px"><div class="h" style="font-size:30px;color:var(--sun);flex:1">YOUR STOCK</div>
      <span class="chip">Bulk ${G.bulk}</span>${groups.map(g => `<span class="chip" style="background:${GAME_COLOR[g]}">${CT.GAMES[g].name} packs ${G.packs[g]}</span>`).join('')}
      ${G.grading.length ? `<span class="chip">At graders: ${G.grading.length}</span>` : ''}<button class="btn pink" data-act="stock">CLOSE</button></div>
    ${groups.map(g => { const cs = G.stock.filter(c => CT.tmpl(c.t).game === g); return cs.length ? `<div class="h" style="color:#fff;font-size:16px;margin:8px 0">${CT.GAMES[g].name} · demand ×${CT.demandOf(G, g).toFixed(2)}</div><div class="row">${cs.map(c => `<div style="text-align:center;color:#fff">${card(c, { size: 'xs', act: 'loupe' })}<div style="font-size:12px;font-weight:800">${estText(c)}</div>${G.store ? `<span class="pchip ${c.graded ? 'mag' : c.prot || 'none'}" style="color:var(--ink)">${c.loc}</span>` : ''}</div>`).join('')}</div>` : ''; }).join('')}
  </div>`;
}

function closeScreen() {
  const G = UI.G, D = G.week[G.dayIdx], next = G.week[G.dayIdx + 1];
  const rows = G.ledger.filter(l => l.day === G.dayIdx);
  const gradeable = G.stock.filter(c => !c.graded && !c.know.fake).sort((a, b) => CT.estimate(G, b).value - CT.estimate(G, a).value).slice(0, 12);
  return `${hud()}${bg('shop', .6)}
  <div class="panel tilt-l" style="left:20px;top:76px;width:340px;height:520px;padding:14px;overflow:auto">
    <div class="h" style="font-size:24px">TODAY'S LEDGER</div>
    <table class="ledger">${rows.map(r => `<tr><td>${esc(r.label)}</td><td class="${r.amt >= 0 ? 'pos' : 'neg'}">${r.amt >= 0 ? '+' : ''}${r.amt}</td></tr>`).join('') || '<tr><td>No deals today</td><td></td></tr>'}</table>
    <div class="price-row" style="margin-top:10px"><span>Rent due</span><span class="big neg">${money(D.rent)}</span></div>
    <div style="font-size:13px">${G.cash < D.rent ? 'Short on rent: the rest goes on a tab, and the tab comes off your final score.' : 'Rent is paid when you end the day.'}</div>
  </div>
  <div class="panel" style="left:376px;top:76px;width:500px;height:520px;padding:14px;display:flex;flex-direction:column;gap:8px">
    <div class="h" style="font-size:22px">SEND TO A GRADER</div>
    <div style="font-size:12.5px"><b>QuikSlab</b> ${CT.GRADERS.quik.fee}₵, back tomorrow, ±1. <b>Halo</b> ${CT.GRADERS.halo.fee}₵, 2 days, exact. Slabs pay at grade 9–10. Graders also catch every fake.${!next ? ' <b>Tonight is Grade Day: everything comes home.</b>' : ''}</div>
    <div style="flex:1;overflow:auto"><div class="stocklist">${gradeable.map(c => `<div style="text-align:center">${card(c, { size: 'xs', act: 'loupe' })}<div style="font-size:12px;font-weight:800">${estText(c)}</div>
      <div class="row" style="gap:4px;margin-top:4px"><button class="btn sm cyan" data-act="grade" data-co="quik" data-uid="${c.uid}" style="padding:2px 6px">QUIK</button><button class="btn sm" data-act="grade" data-co="halo" data-uid="${c.uid}" style="padding:2px 6px">HALO</button></div></div>`).join('')}</div>
    ${G.grading.length ? `<div style="margin-top:8px;font-size:12.5px">At the graders: ${G.grading.map(p => (CT.readable(G, p.card) ? CT.tmpl(p.card.t).name : 'a card') + ' (' + CT.GRADERS[p.co].name + ')').join(', ')}</div>` : ''}</div>
    <div class="h" style="font-size:18px;margin-top:4px">LOUPE UPGRADES</div>
    <div class="ups">${Object.keys(CT.UPGRADES).map(k => { const U = CT.UPGRADES[k]; return `<button class="up ${G.up[k] ? 'owned' : ''}" data-act="upgrade" data-k="${k}" ${G.up[k] || G.cash < U.cost ? 'disabled' : ''} title="${esc(U.does)}"><b>${esc(U.name)}</b><span>${G.up[k] ? 'OWNED' : U.cost + '₵'}</span><small>${esc(U.does)}</small></button>`; }).join('')}</div>
    <button class="toggle" data-act="policy" aria-pressed="${G.policy.limit2}" style="margin-top:2px"><span class="tl">"Limit 2 per customer" sign<small>Stops scalpers taking everything. Big pack buyers only get 2 too.</small></span><span class="sw ${G.policy.limit2 ? 'on' : ''}"><span></span></span></button>
  </div>
  <div class="panel tilt-r" style="right:20px;top:76px;width:360px;height:520px;padding:14px">
    <div class="h" style="font-size:22px">${next ? 'TOMORROW: ' + esc(next.name.toUpperCase()) : 'LAST NIGHT'}</div>
    ${next ? `<div style="margin:6px 0">${next.ships.map(s => `<span class="chip" style="background:${SP_COLOR[s]}">${CT.SPECIES[s].name}</span>`).join(' ')}</div>` + demandBars(next.demand) + (next.release && G.pump ? `<div class="chip rumor down" style="margin-top:6px">Wave 3 reprints: ${esc(CT.tmpl(G.pump.t).name)}</div>` : '') + `<div class="h" style="font-size:15px;margin:10px 0 6px">RESTOCK · box of ${CT.BOX.packs} for ${CT.BOX.cost}₵</div>
      <div style="font-size:12px;margin-bottom:6px">Boxes arrive in tomorrow morning's crate. Restock tomorrow's hottest game for a chance at a promo topper.</div>
      ${Object.keys(CT.GAMES).map(g => `<div class="row" style="align-items:center;margin-bottom:6px"><span class="chip" style="background:${GAME_COLOR[g]};flex:1">${CT.GAMES[g].name} · have ${G.packs[g]}</span><button class="btn sm" data-act="restock" data-game="${g}" ${G.cash >= CT.BOX.cost ? '' : 'disabled'}>ORDER BOX</button></div>`).join('')}<div class="row" style="margin-top:6px"><button class="btn cyan" data-act="catalog">📒 CATALOG${G.store.orders.length ? ' (' + G.store.orders.length + ' ordered)' : ''}</button><button class="btn white" data-act="room">BACK ROOM</button></div>` : '<div style="margin:10px 0">No tomorrow: sell-off is over. Grade anything worth slabbing, then end the night.'}
    <div style="position:absolute;left:14px;right:14px;bottom:14px"><button class="btn big pink" style="width:100%" data-act="endDay">${next ? 'PAY RENT → AFTER HOURS' : 'PAY RENT → GRADE DAY'}</button></div>
  </div>
  ${dj(hint())}`;
}

// ---------- After Hours ----------
function nightScreen() {
  const G = UI.G, N = G.night;
  if (!N.pick) {
    const posters = N.flyers.map((k, i) => `<div class="flyer" style="--tilt:${i ? 2 : -2}deg"><div class="h" style="font-size:30px">${esc(CT.NIGHTS[k].name.toUpperCase())}</div><p>${esc(CT.NIGHTS[k].blurb)}</p><button class="btn big pink" data-act="pickNight" data-ev="${k}">PICK ▶</button></div>`).join('');
    return `${hud()}${bg('cardnight', .55)}<div class="fe-h" style="top:76px">AFTER HOURS</div><div class="flyers">${posters}</div>
      <button class="btn white" style="position:absolute;right:30px;bottom:92px;z-index:6" data-act="nextMorning">SKIP TONIGHT</button>${dj(hint())}`;
  }
  const body = { cardnight: nightCardNightHTML, tourney: nightTourneyHTML, auction: nightAuctionHTML, dig: nightDigHTML, swap: nightSwapHTML }[N.pick]();
  return `${hud()}${bg(N.pick, .3)}<div class="panel tilt-r night" style="left:120px;top:84px;width:1040px;max-height:560px;overflow:auto;padding:18px">${body}
    <div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn ${N.done ? 'big pink' : 'white'}" data-act="nextMorning">${N.done ? 'NEXT MORNING ▶' : 'SKIP TO MORNING'}</button></div></div>${dj(hint())}`;
}
function nightCardNightHTML() {
  const G = UI.G, done = G.events.find(e => e.t === 'cardNight');
  if (!done) {
    const g = UI.nightGame || Object.keys(G.packs).sort((a, b) => G.packs[b] - G.packs[a])[0];
    UI.nightGame = g; const maxN = Math.min(6, G.packs[g]); UI.nightN = Math.min(UI.nightN, maxN);
    return `<div class="h" style="font-size:24px">CARD NIGHT · FEATURE A GAME</div>
    <div class="row" style="margin:8px 0">${Object.keys(CT.GAMES).map(k => `<button class="btn ${k === g ? 'pink' : 'white'}" data-act="nightGame" data-game="${k}">${CT.GAMES[k].name} (${G.packs[k]})</button>`).join('')}</div>
    <div>Rip <b id="nightv">${UI.nightN}</b> pack${UI.nightN === 1 ? '' : 's'} live on Floss's stream. Holos and grails add hype to tomorrow's demand. You keep <b>2 Card Night promos</b>, the crowd buys a few packs, and rep goes up.</div>
    <input id="nightn" class="slider" type="range" min="0" max="${maxN}" value="${UI.nightN}" aria-label="Packs to rip">
    <div class="row"><button class="btn big pink" data-act="rip">RIP LIVE!</button></div>`;
  }
  const pulls = done.uids.concat(done.promos || []).map(u => G.stock.find(c => c.uid === u)).filter(Boolean);
  return `<div class="h" style="font-size:26px">${done.grail ? 'A GRAIL ON STREAM!!' : done.holo ? 'HOLO HYPE!' : 'WHAT A NIGHT'}</div>
    <div class="row" style="margin:10px 0">${pulls.map((c, i) => `<div class="flipin" style="animation-delay:${i * .05}s">${card(c, { size: 'xs', act: 'loupe' })}</div>`).join('')}</div>
    <div>${CT.GAMES[done.game].name} hype <b>+${Math.round(done.hype * 100)}%</b> tomorrow · crowd bought ${done.sold} packs · 2 promos · rep +6</div>`;
}
function nightTourneyHTML() {
  const G = UI.G, done = G.events.find(e => e.t === 'tourney');
  if (done) {
    const promos = done.promos.map(u => G.stock.find(c => c.uid === u)).filter(Boolean);
    return `<div class="h" style="font-size:26px">${done.fakePrize ? 'THE PRIZE WAS FAKE…' : done.entrants + ' PLAYERS SHOWED UP!'}</div>
      <div style="margin:8px 0">Entry fees ${money(done.entrants * 5)} · players bought ${done.sold} singles for ${money(done.sales)} · ${CT.GAMES[done.game].name} hype +10% tomorrow${done.fakePrize ? ' · <b style="color:#c41d1d">rep −10</b>' : ''}</div>
      <div class="row">${promos.map(c => `<div class="flipin">${card(c, { size: 'sm', act: 'loupe' })}</div>`).join('')}</div>`;
  }
  const next = G.week[G.dayIdx + 1];
  const g = UI.tourGame || Object.keys(next.demand).sort((a, b) => next.demand[b] - next.demand[a])[0]; UI.tourGame = g;
  const prizes = G.stock.filter(c => !c.graded && !c.know.fake).sort((a, b) => CT.estimate(G, b).value - CT.estimate(G, a).value).slice(0, 12);
  return `<div class="h" style="font-size:24px">TOURNAMENT NIGHT</div>
    <div style="margin:6px 0">Pick the game (players come for tomorrow's demand) and a prize from your stock. A better prize draws more players and more rep. Entry is 5₵; players buy deck fillers of that game from you at +20%. You keep <b>2 prize promos</b>.</div>
    <div class="row" style="margin:6px 0">${Object.keys(CT.GAMES).map(k => `<button class="btn ${k === g ? 'pink' : 'white'}" data-act="tourGame" data-game="${k}">${CT.GAMES[k].name} ×${next.demand[k]}</button>`).join('')}</div>
    <div class="h" style="font-size:15px;margin:6px 0">PRIZE <small style="font-family:var(--body);font-size:12px">(optional: tap a card)</small></div>
    <div class="row">${prizes.map(c => `<div style="text-align:center">${card(c, { size: 'xs', act: 'tourPrize', cls: UI.tourPrize === c.uid ? 'sel' : '' })}<div style="font-size:11px;font-weight:800">${estText(c)}</div></div>`).join('') || '<div class="chip">No cards to offer</div>'}</div>
    <div class="row" style="margin-top:10px"><button class="btn big pink" data-act="hostTourney">HOST THE TOURNAMENT</button></div>`;
}
function nightAuctionHTML() {
  const G = UI.G, N = G.night, A = N.auc;
  const step = Math.max(5, Math.round(A.price * 0.1)), nextP = A.high && A.high !== 'you' ? A.price + step : A.price;
  const res = G.events.find(e => e.t === 'auction');
  return `<div class="h" style="font-size:24px">DOCK AUCTION · CARGO CRATE</div>
    <div class="row" style="margin:8px 0">${A.clues.map(c => `<span class="chip">🔎 ${esc(c)}</span>`).join('')}</div>
    <div class="row" style="align-items:center;gap:20px">
      <div class="crate ${res && res.won ? 'open' : ''}">${res && res.won ? '' : '📦'}</div>
      <div><div class="price-row" style="gap:20px"><span>Current price</span><span class="big">${money(A.price)}</span></div>
      <div>High bidder: <b>${A.high === 'you' ? 'YOU' : esc(A.high || 'nobody yet')}</b> · rivals: Sheelo, Klik</div>
      <div class="muted" style="font-size:12px;max-width:520px">${A.log.slice(-4).map(esc).join(' → ') || 'Bidding opens at ' + A.price + '₵.'}</div></div>
    </div>
    ${N.done ? (res && res.won ? `<div class="h" style="font-size:20px;margin-top:10px">YOU WON! PAID ${money(res.price)} · CRATE WORTH ~${money(res.worth)}</div><div class="row">${A.cards.map((c, i) => `<div class="flipin" style="animation-delay:${i * .05}s">${card(c, { size: 'xs', act: 'loupe' })}</div>`).join('')}</div>` : `<div class="h" style="font-size:18px;margin-top:10px">${res && res.winner !== 'nobody' ? esc(res.winner) + ' took it for ' + money(res.price) : 'No sale'}. It was worth about ${money(A.worth)}.</div>`)
      : `<div class="row" style="margin-top:12px"><button class="btn big pink" data-act="bid" ${G.cash >= nextP ? '' : 'disabled'}>BID ${money(nextP)}</button><button class="btn white" data-act="drop">DROP OUT</button></div>`}`;
}
function nightDigHTML() {
  const G = UI.G, D = G.night.dig;
  return `<div class="h" style="font-size:24px">BULK DIG · ${D.flips} FLIP${D.flips === 1 ? '' : 'S'} LEFT</div>
    <div style="margin:6px 0">16 face-down cards. ✨ means a glint on the back: usually foil. The color is the game. Flipped cards go to your stock; the rest go to the bulk bin.</div>
    <div class="dig">${D.cards.map((c, i) => c.flipped ? `<div class="flipin">${card(c, { size: 'xs', act: 'loupe' })}</div>`
      : `<button class="digback" data-act="dig" data-i="${i}" style="--gc:${GAME_COLOR[c.hint.game]}" ${D.flips ? '' : 'disabled'} aria-label="face-down card">${c.hint.glint ? '✨' : ''}</button>`).join('')}</div>`;
}
function nightSwapHTML() {
  const G = UI.G, N = G.night;
  return `<div class="h" style="font-size:24px">SWAP MEET</div><div style="margin:6px 0">The Loupe is free tonight. Tap any card to check it before you trade.</div>
    ${N.swaps.map((s, i) => { const mine = s.want && G.stock.find(c => c.uid === s.want); return `<div class="swaprow">
      ${portrait(s.who, 'mini')}
      <div style="text-align:center">${card(s.theirs, { size: 'xs', act: 'loupe' })}<div style="font-size:11px;font-weight:800">theirs: ${estText(s.theirs)}</div></div>
      <div class="h" style="font-size:26px">⇄</div>
      <div style="text-align:center">${mine ? card(mine, { size: 'xs', act: 'loupe' }) + `<div style="font-size:11px;font-weight:800">yours: ${estText(mine)}</div>` : '<span class="chip">nothing they want</span>'}</div>
      <div class="row" style="flex-direction:column">${s.done ? `<span class="chip">${s.done === 'yes' ? 'TRADED ✓' : 'DECLINED'}</span>` : `<button class="btn sm lime" data-act="swapYes" data-i="${i}" ${mine ? '' : 'disabled'}>TRADE</button><button class="btn sm white" data-act="swapNo" data-i="${i}">NO THANKS</button>`}</div></div>`; }).join('')}`;
}

function endScreen() {
  const G = UI.G, F = G.final, S = G.stats;
  const best = S.bestFlip ? `${CT.tmpl(S.bestFlip.t).name}: +${S.bestFlip.flip}₵` : '—';
  const bg_ = S.bestGrade ? `${CT.tmpl(S.bestGrade.t).name}: ${CT.GRADERS[S.bestGrade.co].name} ${S.bestGrade.grade}` : '—';
  const pull = S.bestPull ? `${CT.tmpl(S.bestPull.t).name} (${S.bestPull.value}₵)` : '—';
  const ev = eventsHTML(G.events);
  return `${hud()}${bg('grader', .3)}
  ${ev ? `<div class="panel tilt-l" style="left:30px;top:80px;width:600px;padding:14px;max-height:520px;overflow:auto"><div class="h" style="font-size:24px">GRADE DAY</div><div class="row" style="margin-top:10px;gap:18px">${ev}</div></div>` : ''}
  <div class="panel tilt-r" style="right:40px;top:70px;width:560px;padding:14px 18px;max-height:570px;overflow:auto">
    <div class="h" style="font-size:28px">FIVE DAYS ON THE STRIP</div>
    <div class="stamp" style="font-size:40px;margin:10px 0">${esc(F.rank.toUpperCase())}</div>
    <div class="price-row"><span>Shop value</span><span class="big">${money(F.value)}</span></div>
    <div class="price-row"><span>You started with</span><span>${money(F.start)}</span></div>
    <div class="price-row"><span>Change</span><span class="${F.gain >= 0 ? 'pos' : 'neg'}" style="font-family:var(--display);font-size:22px">${F.gain >= 0 ? '+' : ''}${F.gain}₵</span></div>
    <table class="ledger" style="margin-top:8px">
      <tr><td>Best flip</td><td>${esc(best)}</td></tr><tr><td>Best grade</td><td>${esc(bg_)}</td></tr><tr><td>Best card you owned</td><td>${esc(pull)}</td></tr>
      <tr><td>Promos earned</td><td>${S.promos}</td></tr><tr><td>Variants spotted</td><td>${S.variants}</td></tr><tr><td>Misprints found</td><td>${S.misprints}</td></tr>
      <tr><td>Fakes caught / sold</td><td>${S.fakesCaught} / ${S.fakesSold}</td></tr><tr><td>Packs sold to the scalper</td><td>${S.scalpedPacks}</td></tr>
      <tr><td>Deals · packs ripped</td><td>${S.deals} · ${S.cracked}</td></tr>${G.store ? `<tr><td>Back room</td><td>case sold ${G.store.stats.displaySales} · stolen ${G.store.stats.stolen} · switched ${G.store.stats.switched} · dead packs ${G.store.stats.deadPacks} · wear −${money(G.store.stats.wearValue)}</td></tr>` : ""}}${F.tab ? `<tr><td>Unpaid tab</td><td class="neg">−${F.tab}</td></tr>` : ''}
    </table>
    <div class="row" style="margin-top:12px"><button class="btn big pink" data-act="again">PLAY AGAIN</button></div>
  </div>${dj(hint())}`;
}

// ---------- v3: the Back Room ----------
// A second screen (BACK ROOM button or B). Everything you own has a place. Tap a card, then tap where it goes (or drag it).
const PROT_NAME = { none: 'no sleeve', penny: 'penny sleeve', hard: 'hard sleeve', mag: 'mag case' };
const MERCH_COLOR = { poster: '#FF7A1A', playmat: '#19D3F0', deckbox: '#4CF2B5' };
const POLICY_STEPS = { penny: [1, 2, 5, 10, 20, 1e9], hard: [10, 15, 25, 40, 60, 100, 1e9], mag: [50, 100, 150, 250, 400, 1e9] };
const roomPhase = () => ['morning', 'shop', 'visit', 'close'].indexOf(UI.G.phase) >= 0;
const pol = n => n >= 1e9 ? 'off' : n + '₵+';
function tiny(c, extra) { return `<div class="tiny">${card(c, { size: 'xs', act: 'rsel', cls: UI.roomSel === c.uid ? 'selring' : '' })}</div>${extra || ''}`; }
function roomScreen() {
  const G = UI.G, S = G.store, sel = UI.roomSel && G.stock.find(c => c.uid === UI.roomSel);
  const inCase = CT.where(G, 'case');
  let cells = '';
  for (let y = 0; y < CT.STORE.caseH; y++) for (let x = 0; x < CT.STORE.caseW; x++)
    cells += `<button class="cell ${sel && CT.caseFits(G, sel, x, y) && (sel.graded || sel.prot === 'hard' || sel.prot === 'mag') ? 'ok' : ''}" style="left:${x * 52}px;top:${y * 70}px" data-act="cell" data-x="${x}" data-y="${y}" aria-label="case spot ${x + 1},${y + 1}"></button>`;
  const items = inCase.map(c => { const [w, h] = CT.cellSize(c); return `<div class="cell-item" draggable="true" data-uid="${c.uid}" style="left:${c.cx * 52}px;top:${c.cy * 70}px;width:${w * 52}px;height:${h * 70}px">${tiny(c)}<span class="tagp">${money(c.tag || CT.defaultTag(G, c))}</span></div>`; }).join('');
  // rack: packs, then merch; a collector box or poster takes 2 hooks
  const hooks = [];
  for (const g of Object.keys(CT.GAMES)) for (let i = 0; i < G.packs[g]; i++) hooks.push(`<div class="hook pack" style="--gc:${GAME_COLOR[g]}" ${G.phase === 'shop' ? `data-act="crack" data-game="${g}" title="Rip it"` : ''}>PACK<br>${esc(CT.GAMES[g].name.split(' ')[0])}</div>`);
  for (const g of Object.keys(CT.GAMES)) for (let i = 0; i < S.merch.collector[g]; i++) hooks.push(`<div class="hook merch" style="grid-column:span 2;--mc:${GAME_COLOR[g]}" data-act="openCollector" data-game="${g}" title="Open it: a promo and 3 packs">COLLECTOR BOX<br>${esc(CT.GAMES[g].name)} · ${CT.CATALOG.collector.retail}₵</div>`);
  for (const k of ['poster', 'playmat', 'deckbox']) for (let i = 0; i < S.merch[k]; i++) hooks.push(`<div class="hook merch" style="grid-column:span ${CT.HOOKS[k]};--mc:${MERCH_COLOR[k]}">${esc(CT.CATALOG[k].name.toUpperCase())}<br>${CT.CATALOG[k].retail}₵</div>`);
  for (let i = 0; i < CT.rackFree(G); i++) hooks.push('<div class="hook empty"></div>');
  const safe = CT.where(G, 'safe'), slots = Array.from({ length: CT.STORE.safeCap }, (_, i) => `<div class="vault">${safe[i] ? tiny(safe[i]) : ''}</div>`).join('');
  const trayCards = UI.binderView ? CT.where(G, 'binder') : CT.where(G, 'inbox');
  const usedShelf = G.store.shelves - CT.shelfFree(G);
  const right = S.crate ? crateHTML() : sel ? selHTML(sel) : `
    <div class="zone" data-drop="safe" style="left:1000px;top:8px;width:264px;height:170px"><div class="h">SAFE <small>${safe.length}/${CT.STORE.safeCap} · can't be stolen or browsed</small></div><div class="safe">${slots}</div></div>
    <div class="zone" style="left:1000px;top:188px;width:264px;height:158px">${gearHTML()}</div>`;
  return `${hud()}<div id="room">
    <div class="zone" data-drop="case" style="left:16px;top:8px;width:660px;height:338px">
      <div class="h">DISPLAY CASE <small>${inCase.length} item${inCase.length === 1 ? '' : 's'} · browsers buy from it between customers · fair tags sell</small><span class="spacer" style="flex:1"></span>
        <button class="btn sm ${S.locked ? 'lime' : 'white'}" data-act="lockCase" ${S.lock ? '' : 'disabled title="Buy a case lock at close"'}>${S.lock ? (S.locked ? '🔒 LOCKED' : '🔓 UNLOCKED') : '🔓 NO LOCK'}</button></div>
      <div class="case-glass ${S.locked ? 'locked' : ''}">${cells}${items}</div>
    </div>
    <div class="zone" style="left:686px;top:8px;width:304px;height:338px">
      <div class="h">WALL RACK <small>${CT.STORE.rackCap - CT.rackFree(G)}/${CT.STORE.rackCap} hooks</small></div>
      <div class="rack">${hooks.join('')}</div>
      <button class="toggle" data-act="sign" aria-pressed="${S.noTouch}" style="margin-top:6px;width:100%"><span class="tl">"No touching the packs" sign<small>Keeps the Scale Gang off the rack</small></span><span class="sw ${S.noTouch ? 'on' : ''}"><span></span></span></button>
    </div>
    ${right}
    <div class="zone" data-drop="${UI.binderView ? 'binder' : 'inbox'}" style="left:16px;top:356px;width:520px;height:226px">
      <div class="h"><button class="btn sm ${UI.binderView ? 'white' : 'pink'}" data-act="trayView" data-v="inbox">INBOX ${CT.where(G, 'inbox').length}/${CT.STORE.inboxCap}</button>
        <button class="btn sm ${UI.binderView ? 'pink' : 'white'}" data-act="trayView" data-v="binder">BINDERS ${CT.where(G, 'binder').length}/${S.binders * CT.STORE.binderPockets}</button>
        <span style="flex:1"></span><button class="btn sm cyan" data-act="autoStore" title="Grails and slabs to the safe, the rest to binders">AUTO-STORE</button></div>
      <div class="tray">${trayCards.map(c => `<div class="it" draggable="true" data-uid="${c.uid}">${tiny(c)}<div style="font-size:11px;font-weight:800">${estText(c)}</div><span class="pchip ${c.graded ? 'mag' : c.prot || 'none'}">${c.graded ? 'SLAB' : (c.prot || 'none').toUpperCase()}</span></div>`).join('') || `<div class="muted" style="padding:10px;font-weight:800">${UI.binderView ? 'Binders are empty.' : 'Inbox is clear. New stock lands here. Loose cards in the tray wear faster.'}</div>`}</div>
    </div>
    <div class="zone" style="left:546px;top:356px;width:444px;height:226px">
      <div class="h">BACK SHELVES <small>${usedShelf}/${G.store.shelves} slots · a booster box takes 6</small></div>
      <div class="cap"><i style="width:${Math.min(100, usedShelf / G.store.shelves * 100)}%"></i></div>
      ${Object.keys(CT.GAMES).map(g => `<div class="shelfrow"><span class="chip" style="background:${GAME_COLOR[g]};min-width:150px">${CT.GAMES[g].name}</span>${Array.from({ length: S.boxes[g] }, () => `<div class="boxtile" style="--gc:${GAME_COLOR[g]}" title="booster box"></div>`).join('') || '<span class="muted" style="font-size:12px">no boxes</span>'}<span style="flex:1"></span><button class="btn sm" data-act="openBox" data-game="${g}" ${S.boxes[g] ? '' : 'disabled'}>OPEN → RACK</button></div>`).join('')}
      <div style="font-size:12px;margin-top:4px">Bulk bin: <b>${G.bulk}</b> commons · at the graders: <b>${G.grading.length}</b>${G.phase === 'close' ? ' · order more from the catalog at close' : ''}</div>
    </div>
    <button class="btn big pink" style="position:absolute;left:1000px;top:420px;width:264px;z-index:6" data-act="room">${G.phase === 'visit' ? '◀ BACK TO THE COUNTER' : '◀ SHOP FLOOR'}</button>
  </div>${dj(roomHint(sel))}`;
}
function gearHTML() {
  const S = UI.G.store, g = S.gear, p = S.sleeve;
  const stepper = k => `<span class="step"><button class="btn white" data-act="pol" data-k="${k}" data-d="-1" aria-label="lower">−</button><b>${pol(p[k])}</b><button class="btn white" data-act="pol" data-k="${k}" data-d="1" aria-label="raise">+</button></span>`;
  return `<div class="h">GEAR + SLEEVING POLICY</div>
    <div class="gear"><span class="pchip penny">PENNY ${g.penny}</span>${stepper('penny')}<span class="pchip hard">HARD ${g.hard}</span>${stepper('hard')}<span class="pchip mag">MAG ${g.mag}</span>${stepper('mag')}</div>
    <button class="btn sm cyan" style="margin-top:4px" data-act="applyPolicy">SLEEVE STOCK BY POLICY</button>`;
}
function selHTML(c) {
  const G = UI.G, e = CT.estimate(G, c), canCase = c.graded || c.prot === 'hard' || c.prot === 'mag', g = G.store.gear;
  const name = CT.readable(G, c) ? CT.tmpl(c.t).name : 'Unread card';
  return `<div class="zone" style="left:1000px;top:8px;width:264px;height:338px;overflow:auto">
    <div class="h">${esc(name)}</div>
    <div style="font-size:13px;margin:4px 0">Worth ${estText(c)} · in <b>${c.loc}</b> · <span class="pchip ${c.graded ? 'mag' : c.prot || 'none'}">${c.graded ? 'slabbed' : PROT_NAME[c.prot || 'none']}</span>${e.fake ? ' · <b style="color:#c41d1d">FAKE</b>' : ''}</div>
    <div class="h" style="font-size:13px;margin-top:6px">SEND TO</div>
    <div class="row" style="gap:5px;flex-wrap:wrap">
      <button class="btn sm" data-act="placeTo" data-to="case" ${canCase && c.loc !== 'case' ? '' : 'disabled'} title="${canCase ? '' : 'Raw cards need a hard sleeve or mag case'}">CASE</button>
      <button class="btn sm white" data-act="placeTo" data-to="binder" ${c.loc === 'binder' ? 'disabled' : ''}>BINDER</button>
      <button class="btn sm white" data-act="placeTo" data-to="safe" ${c.loc === 'safe' ? 'disabled' : ''}>SAFE</button>
      <button class="btn sm white" data-act="placeTo" data-to="inbox" ${c.loc === 'inbox' ? 'disabled' : ''}>INBOX</button></div>
    ${!canCase ? '<div style="font-size:11px;margin-top:2px">The case needs a hard sleeve or a mag case on raw cards.</div>' : ''}
    ${c.graded ? '' : `<div class="h" style="font-size:13px;margin-top:6px">PROTECT</div><div class="row" style="gap:5px">
      <button class="btn sm white" data-act="sleeve" data-p="penny" ${c.prot && c.prot !== 'none' || !g.penny ? 'disabled' : ''}>PENNY</button>
      <button class="btn sm white" data-act="sleeve" data-p="hard" ${c.prot === 'hard' || c.prot === 'mag' || !g.hard ? 'disabled' : ''}>HARD</button>
      <button class="btn sm white" data-act="sleeve" data-p="mag" ${c.prot === 'mag' || !g.mag ? 'disabled' : ''}>MAG</button></div>`}
    ${c.loc === 'case' ? `<div class="h" style="font-size:13px;margin-top:6px">PRICE TAG</div><div class="step"><button class="btn white" data-act="tagd" data-d="-1">−10%</button><b style="font-size:18px">${money(c.tag || CT.defaultTag(G, c))}</b><button class="btn white" data-act="tagd" data-d="1">+10%</button></div>` : ''}
    <div class="row" style="gap:5px;margin-top:8px"><button class="btn sm cyan" data-act="loupe" data-uid="${c.uid}">LOUPE</button>${G.phase === 'shop' || G.phase === 'close' ? '<button class="btn sm white" data-act="roomBulk">TO BULK</button>' : ''}<button class="btn sm white" data-act="rsel" data-uid="${c.uid}">DONE</button></div>
  </div>`;
}
function crateHTML() {
  const G = UI.G, C = G.store.crate, names = {};
  for (const it of C.items) { const k = (CT.CATALOG[it.item] || { name: it.item }).name + (it.game ? ' · ' + CT.GAMES[it.game].name : ''); names[k] = (names[k] || 0) + 1; }
  return `<div class="zone" style="left:1000px;top:8px;width:264px;height:338px">
    <div class="h">DELIVERY CRATE</div>
    <div style="display:grid;place-items:center;margin:8px 0"><div class="cratebox">📦 ${C.items.length}</div></div>
    <div style="font-size:12.5px;max-height:90px;overflow:auto">${Object.keys(names).map(k => `<div>${names[k]} × ${esc(k)}</div>`).join('')}</div>
    <button class="btn big pink" style="width:100%;margin-top:8px" data-act="unpack">CUT IT OPEN ▶</button>
    <div style="font-size:11px;margin-top:4px">Boxes go on the shelves, merch on the rack, gear in the drawer. Anything with no room stays in the crate.</div></div>`;
}
function roomHint(sel) {
  const G = UI.G, S = G.store;
  if (S.crate) return 'A crate came in! Cut it open: boxes to the shelves, merch on the rack, gear in the drawer.';
  if (sel) return sel.loc === 'case' ? 'Fair tags sell: browsers pay up to about today\'s worth. Tag too high and it just sits there.' : 'Tap a spot in the display case to put it there, or send it to a binder or the safe.';
  if (CT.where(G, 'inbox').length >= CT.STORE.inboxCap - 3) return 'The inbox tray is almost full, and loose cards wear. AUTO-STORE sends slabs and grails to the safe and the rest to binders.';
  if (!CT.where(G, 'case').length) return 'An empty case sells nothing. Put a few hard-sleeved cards or slabs in it, at fair prices.';
  if (!S.lock && G.dayIdx >= 1) return 'Word is Sticky is working the strip. An unlocked case gets lifted from at night. A lock is 30₵ in the catalog at close.';
  return 'Drag cards between the case, the tray, the binders and the safe. Your sleeving policy sleeves new stock automatically while gear lasts.';
}
function catalogHTML() {
  const G = UI.G, C = CT.CATALOG, games = Object.keys(CT.GAMES), S = G.store;
  const row = (k, extra) => { const it = C[k]; const owned = k === 'lock' ? S.lock : k === 'shelves' ? S.shelves > CT.STORE.shelfCap : false;
    const btns = it.game ? games.map(g => `<button class="btn sm" style="background:${GAME_COLOR[g]}" data-act="order" data-item="${k}" data-game="${g}" ${G.cash >= it.cost ? '' : 'disabled'}>${esc(CT.GAMES[g].name.split(' ')[0])}</button>`).join('')
      : `<button class="btn sm" data-act="order" data-item="${k}" ${owned || G.cash < it.cost ? 'disabled' : ''}>${owned ? 'OWNED' : 'ORDER'}</button>`;
    return `<div class="catrow"><div><b>${esc(it.name)}</b> · ${it.cost}₵${it.retail ? ' · sells for ' + it.retail + '₵ off the rack' : ''}<small>${esc(extra)}</small></div><div class="row" style="gap:4px">${btns}</div></div>`; };
  const pending = S.orders.length ? S.orders.map(o => C[o.item].name + (o.game ? ' (' + CT.GAMES[o.game].name + ')' : '')).join(', ') : 'nothing yet';
  return `<div id="loupe" style="display:block;overflow:auto">
    <div class="row" style="align-items:center;margin-bottom:10px"><div class="h" style="font-size:30px;color:var(--sun);flex:1">DISTRIBUTOR CATALOG</div><span class="chip">Cash ${money(G.cash)}</span><button class="btn pink" style="flex:none" data-act="catalog">CLOSE</button></div>
    <div class="panel" style="position:relative;padding:12px 16px">
      ${row('box', 'Arrives tomorrow morning in the crate. Takes 6 shelf slots; open it to put 6 packs on the rack. Restock tomorrow\'s hottest game for a chance at a promo topper.')}
      ${row('collector', 'A promo, 3 packs and a pin. Hangs on the rack (2 hooks) and sells to walk-ins overnight, or open it yourself.')}
      ${row('poster', 'Hangs on 2 hooks. Walk-ins buy them overnight.')}
      ${row('playmat', 'Hangs on 2 hooks.')}
      ${row('deckbox', '1 hook. Cheap, sells often.')}
      ${row('penny', 'Stops new surface wear. Your policy uses them on new stock.')}
      ${row('hard', 'With a penny inside: stops edge wear too. Raw cards need one for the display case. Your stamped sleeves also beat the Switcher.')}
      ${row('mag', 'Full protection, and display buyers pay 10% more.')}
      ${row('binder', 'Here now. 54 more pockets. No theft, no browsing.')}
      ${row('shelves', 'Here now. +12 shelf slots.')}
      ${row('lock', 'Here now. A locked case stops overnight theft and Sticky (browsers buy a bit less often).')}
      <div style="margin-top:8px;font-size:13px">In tomorrow's crate: <b>${esc(pending)}</b></div>
    </div></div>`;
}
// The new bad actors at the counter.
function v3DealHTML(v) {
  const G = UI.G, P = CT.PEOPLE[v.who];
  if (v.role === 'weigh') return `<div class="h" style="font-size:20px">⚠ THE SCALE GANG</div>
    <div>They want to <b>pick their own 3 packs</b> off your rack, feeling for the heavy ones (the hits). Whatever they leave is dead weight.</div>
    <div class="est">Sell from behind the counter and you choose the packs (they'll only take 2). A "no touching" sign in the back room keeps them out.</div>
    <div class="row"><button class="btn lime" data-act="sellBehind" ${CT.packTotal(G) ? '' : 'disabled'}>SELL FROM BEHIND THE COUNTER</button></div>
    <div class="row"><button class="btn white" data-act="accept" ${CT.packTotal(G) ? '' : 'disabled'}>LET THEM PICK (${money(3 * CT.PACK_RETAIL)})</button><button class="btn white" data-act="pass">NO SALE</button></div>`;
  if (v.role === 'thief') return `<div class="h" style="font-size:20px">"JUST BROWSING"</div>
    <div>${esc(P.name)} is drifting around the shop floor. Very fluffy. Lots of places to hide things.</div>
    <div class="est">${G.store.locked ? 'Your case is locked, so the rack is the only target.' : CT.where(G, 'case').length ? 'The display case is <b>unlocked</b>.' : 'Nothing in the case, but the rack is right there.'}</div>
    <div class="row"><button class="btn lime" data-act="watch">KEEP AN EYE ON THEM</button><button class="btn white" data-act="pass">LET THEM BROWSE</button></div>`;
  if (v.role === 'switch') {
    const fits = G.stock.filter(c => CT.matches(G, v.wants, c));
    return `<div class="h" style="font-size:20px">"CAN I SEE IT?"</div>
      <div style="font-size:13px">${v.watched ? 'You\'re watching all four hands.' : esc(P.name) + ' wants to hold it. Up close.'} Cards that fit:</div>
      ${fits.length ? `<div class="stocklist">${fits.slice(0, 6).map(c => `<div style="text-align:center">${card(c, { size: 'xs', act: 'show' })}<div style="font-size:11px;font-weight:800">${c.graded ? 'slab' : PROT_NAME[c.prot || 'none']}</div></div>`).join('')}</div>` : '<div class="est">Nothing that fits.</div>'}
      <div class="row"><button class="btn lime" data-act="watch" ${v.watched ? 'disabled' : ''}>WATCH THEIR HANDS</button><button class="btn white" data-act="pass">NOT TODAY</button></div>`;
  }
  if (v.role === 'reseal') return `<div class="h" style="font-size:20px">"FACTORY SEALED"</div>
    <div class="price-row"><span>${v.packs} ${esc(CT.GAMES[v.packGame].name)} packs</span><span class="big">${money(v.packs * 20)}</span></div>
    <div class="est">Retail is ${CT.PACK_RETAIL}₵ a pack. ${v.knowSeal ? (v.resealed ? '<b style="color:#c41d1d">Glue shine on the seams and creased wrappers: these were opened, searched and glued shut.</b>' : 'Clean factory seams. Looks legit.') : 'Too cheap? Check the seams before you buy.'}</div>
    <div class="row"><button class="btn cyan" data-act="inspectPacks" ${v.knowSeal ? 'disabled' : ''}>CHECK THE SEAMS (1 patience)</button></div>
    <div class="row"><button class="btn lime" data-act="accept" ${G.cash >= v.packs * 20 ? '' : 'disabled'}>BUY THEM</button><button class="btn white" data-act="pass">PASS</button></div>`;
  return null;
}
function v3MatHTML(v) {
  const G = UI.G, pack = (gc, i, glue) => `<div class="card sm pop" style="--fr:linear-gradient(160deg,${gc},#6A2BD9);animation-delay:${i * .06}s"><div class="inner" style="display:grid;place-items:center;color:#fff;font-family:var(--display);font-size:16px;background:repeating-linear-gradient(45deg,#6A2BD9 0 8px,${gc} 8px 16px)">PACK</div>${glue ? '<div class="glue"></div>' : ''}</div>`;
  if (v.role === 'reseal') return `<div id="mat">${Array.from({ length: v.packs }, (_, i) => pack(GAME_COLOR[v.packGame], i, v.knowSeal && v.resealed)).join('')}</div>`;
  if (v.role === 'weigh') { const out = []; for (const g of Object.keys(CT.GAMES)) for (let i = 0; i < Math.min(3, G.packs[g]); i++) out.push(pack(GAME_COLOR[g], out.length)); return `<div id="mat">${out.join('') || '<div class="chip">Your rack is empty</div>'}</div>`; }
  return `<div id="mat"><div class="chip" style="font-size:18px">${v.role === 'thief' ? '👀 Somewhere on the shop floor…' : '← ' + esc(CT.PEOPLE[v.who].name) + ' wants a closer look →'}</div></div>`;
}
const V3_EVENT_TEXT = {
  theft: e => e.from === 'case' ? '🫥 Something is missing from the display case.' : '🫥 A ' + CT.GAMES[e.game].name + ' pack is gone from the rack.',
  displaySale: e => '💸 Display case: a browser bought ' + (CT.tmpl(e.t2).name) + ' for ' + money(e.price),
  searched: () => '⚖ The Scale Gang left your rack lighter on hits. Some packs are now dead weight.',
  gearOut: () => '⚠ Out of sleeves! New cards are going in unprotected.',
  crate: e => '📦 Delivery! A crate with ' + e.n + ' item' + (e.n === 1 ? '' : 's') + ' is in the back room.',
};
function v3EventsHTML(evts) { return evts.filter(e => V3_EVENT_TEXT[e.t] && e.t !== 'displaySale').map(e => `<div class="chip" style="background:${e.t === 'crate' ? 'var(--lime)' : 'var(--coral)'}">${esc(V3_EVENT_TEXT[e.t](e))}</div>`).join(''); }
function roomClick(a, el, uid) {
  const G = UI.G, sel = UI.roomSel;
  switch (a) {
    case 'room': UI.room = !UI.room; UI.roomSel = null; UI.stock = false; return null;
    case 'rsel': UI.roomSel = UI.roomSel === uid ? null : uid; return null;
    case 'cell': { const x = +el.dataset.x, y = +el.dataset.y;
      if (!sel) { const c = CT.where(G, 'case').find(o => { const [w, h] = CT.cellSize(o); return x >= o.cx && x < o.cx + w && y >= o.cy && y < o.cy + h; }); UI.roomSel = c ? c.uid : null; return null; }
      const r = act({ t: 'place', uid: sel, to: 'case', x, y }); if (r.ok) UI.roomSel = null; return r; }
    case 'placeTo': { const r = act({ t: 'place', uid: sel, to: el.dataset.to }); if (r.ok) UI.roomSel = null; return r; }
    case 'sleeve': return act({ t: 'sleeve', uid: sel, prot: el.dataset.p });
    case 'tagd': { const c = G.stock.find(x => x.uid === sel); const cur = c.tag || CT.defaultTag(G, c); return act({ t: 'tag', uid: sel, price: Math.max(1, Math.round(cur * (+el.dataset.d > 0 ? 1.1 : 0.9))) }); }
    case 'roomBulk': { const r = act({ t: 'toBulk', uid: sel }); UI.roomSel = null; return r; }
    case 'lockCase': return act({ t: 'lockCase', on: !G.store.locked });
    case 'sign': return act({ t: 'sign', noTouch: !G.store.noTouch });
    case 'trayView': UI.binderView = el.dataset.v === 'binder'; return null;
    case 'autoStore': return act({ t: 'autoStore' });
    case 'applyPolicy': { const r = act({ t: 'applyPolicy' }); if (r.ok) toast(r.n ? 'Sleeved ' + r.n + ' card' + (r.n === 1 ? '' : 's') : 'Nothing new to sleeve'); return r; }
    case 'pol': { const k = el.dataset.k, steps = POLICY_STEPS[k], cur = G.store.sleeve[k]; let i = steps.findIndex(s => s >= cur); if (i < 0) i = steps.length - 1;
      i = Math.max(0, Math.min(steps.length - 1, i + +el.dataset.d)); return act({ t: 'sleevePolicy', [k]: steps[i] }); }
    case 'unpack': { const r = act({ t: 'unpack' }); if (r.ok) { sting('rip'); toast('Unpacked ' + r.placed + (r.left ? ' · ' + r.left + ' left (no room)' : '')); } return r; }
    case 'openBox': { const r = act({ t: 'openBox', game: el.dataset.game }); if (r.ok) toast('+6 ' + CT.GAMES[el.dataset.game].name + ' packs on the rack'); return r; }
    case 'openCollector': { const r = act({ t: 'openCollector', game: el.dataset.game }); if (r.ok) { sting('rip'); toast('Collector box: 3 packs and a promo!'); } return r; }
    case 'catalog': UI.catalog = !UI.catalog; return null;
    case 'order': { const r = act({ t: 'order', item: el.dataset.item, game: el.dataset.game }); if (r.ok) toast(CT.CATALOG[el.dataset.item].now ? CT.CATALOG[el.dataset.item].name + ': done!' : 'Ordered: arrives tomorrow morning'); return r; }
    case 'watch': return act({ t: 'watch' });
    case 'sellBehind': return act({ t: 'sellBehind' });
    case 'inspectPacks': return act({ t: 'inspectPacks' });
  }
  return undefined;
}
// Drag and drop (desktop): drag a card from the case, tray or safe onto a case spot or a zone.
function onDragStart(e) { const it = e.target.closest('[draggable][data-uid]'); if (!it) return; UI.drag = it.dataset.uid; e.dataTransfer.setData('text/plain', UI.drag); e.dataTransfer.effectAllowed = 'move'; }
function onDragOver(e) { if (!UI.drag) return; const z = e.target.closest('.cell, [data-drop]'); if (z) { e.preventDefault(); } }
function onDrop(e) {
  if (!UI.drag) return; e.preventDefault();
  const uid = UI.drag; UI.drag = null;
  const cell = e.target.closest('.cell'), zone = e.target.closest('[data-drop]');
  if (cell) act({ t: 'place', uid, to: 'case', x: +cell.dataset.x, y: +cell.dataset.y });
  else if (zone && zone.dataset.drop !== 'case') act({ t: 'place', uid, to: zone.dataset.drop });
  else if (zone) act({ t: 'place', uid, to: 'case' });
  UI.roomSel = null; save(); render();
}

// ---------- input ----------
function onClick(e) {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (FE.settings.music && !MUSIC.on) MUSIC.start();
  if (el.dataset.act.indexOf('fe-') === 0) { FE.click(el); render(); return; }
  if (FE.pause || FE.inSettings || FE.confirm) return;
  const a = el.dataset.act, G = UI.G, v = G.visit, uid = el.dataset.uid || el.closest('[data-uid]') && el.closest('[data-uid]').dataset.uid;
  const before = v ? { insulted: !!v.insulted, patience: v.patience, ask: v.ask } : null;
  let r = null;
  const rr = roomClick(a, el, uid);
  if (rr !== undefined) r = rr; else switch (a) {
    case 'open': r = act({ t: 'open' }); break;
    case 'next': UI.lastPull = null; UI.lastResult = null; r = act({ t: 'next' }); UI.offer = 0; break;
    case 'loupe': UI.sel = uid; UI.uvView = false; UI.stock = false; break;
    case 'closeLoupe': UI.sel = null; break;
    case 'uvview': UI.uvView = !UI.uvView; break;
    case 'tool': { const t = el.dataset.tool; r = act({ t: 'inspect', uid: UI.sel, tool: t }); if (t === 'uv' && r.ok) UI.uvView = true;
      const c = findAny(UI.sel); if (t === 'uv' && c && c.know.fake) sting('fake');
      if (!G.visit && v) UI.sel = null; break; }
    case 'flaw': { const target = el.dataset.uid || (v && (v.cards.find(c => c.know.loupe && !c.flawUsed && (Math.min(c.cen, c.edg, c.sur) <= 6 || c.know.fake)) || {}).uid); r = act({ t: 'flaw', uid: target }); UI.sel = null; if (r.ok) UI.react = 'wobble'; break; }
    case 'offer': r = act({ t: 'offer', price: UI.offer }); break;
    case 'accept': r = act({ t: 'accept' }); break;
    case 'pass': r = act({ t: 'pass' }); break;
    case 'show': r = act({ t: 'show', uid }); UI.offer = 0; break;
    case 'showPacks': r = act({ t: 'showPacks' }); UI.offer = 0; break;
    case 'crack': r = act({ t: 'crack', game: el.dataset.game }); if (r.ok) { UI.lastPull = r.pulled; sting('rip'); } break;
    case 'toBulk': r = act({ t: 'toBulk', uid: UI.sel }); UI.sel = null; break;
    case 'grade': r = act({ t: 'grade', uid, co: el.dataset.co }); if (r.ok) toast('Sent to ' + CT.GRADERS[el.dataset.co].name); break;
    case 'restock': r = act({ t: 'restock', game: el.dataset.game }); if (r.ok) toast(CT.GAMES[el.dataset.game].name + ' box ordered: in tomorrow\'s crate' + (r.topper ? ' + a PROMO TOPPER!' : '')); break;
    case 'upgrade': r = act({ t: 'upgrade', k: el.dataset.k }); if (r.ok) { toast(CT.UPGRADES[el.dataset.k].name + ' installed!'); sting('grade'); } break;
    case 'policy': r = act({ t: 'policy', limit2: !G.policy.limit2 }); break;
    case 'endDay': r = act({ t: 'endDay' }); if (G.phase === 'end') sting('grade'); break;
    case 'pickNight': r = act({ t: 'pickNight', ev: el.dataset.ev }); UI.tourGame = null; UI.tourPrize = null; break;
    case 'nightGame': UI.nightGame = el.dataset.game; UI.nightN = Math.min(3, G.packs[el.dataset.game]); break;
    case 'rip': r = act({ t: 'cardNight', game: UI.nightGame, n: UI.nightN }); sting('rip'); break;
    case 'tourGame': UI.tourGame = el.dataset.game; break;
    case 'tourPrize': UI.tourPrize = UI.tourPrize === uid ? null : uid; break;
    case 'hostTourney': r = act({ t: 'tourney', game: UI.tourGame, prize: UI.tourPrize }); if (r.ok) sting('deal'); break;
    case 'bid': r = act({ t: 'bid' }); if (r.ok && G.night.done) sting('rip'); break;
    case 'drop': r = act({ t: 'drop' }); break;
    case 'dig': r = act({ t: 'dig', i: +el.dataset.i }); if (r.ok && r.card && r.card.v.fin !== 'std') sting('rip'); break;
    case 'swapYes': r = act({ t: 'swap', i: +el.dataset.i, accept: true }); if (r.ok) sting('deal'); break;
    case 'swapNo': r = act({ t: 'swap', i: +el.dataset.i, accept: false }); break;
    case 'nextMorning': r = act({ t: 'nextMorning' }); UI.nightGame = null; break;
    case 'stock': UI.stock = !UI.stock; UI.sel = null; break;
    case 'music': FE.settings.music = !FE.settings.music; FE.apply(); try { localStorage.setItem(FE.config.id + '.settings', JSON.stringify(FE.settings)); } catch (e) { /* storage blocked */ } if (FE.settings.music) MUSIC.start(); break;
    case 'again': startSlot(UI.slot, true); render(); return;
  }
  // customers react: a shake when insulted, a bob when they counter, a stamp when they leave
  if (v && G.visit === v && before) { if (!before.insulted && v.insulted) UI.react = 'shake'; else if (!UI.react && v.ask !== before.ask) UI.react = 'bob'; }
  if (v && !G.visit && G.lastVisit === v) { sting(v.result === 'deal' ? 'deal' : 'walk'); UI.sel = null; UI.lastResult = { who: v.who, result: v.result }; }
  for (const ev of G.events.slice(UI.seenEvents)) {
    if (ev.t === 'fluent') toast('You can read ' + CT.GAMES[ev.game].name + ' now!');
    if (ev.t === 'fakeFound') toast('FAKE spotted!');
    if (ev.t === 'promo' && ev.from === 'release') toast('Release promo earned!');
    if ((ev.t === 'displaySale' || ev.t === 'gearOut' || ev.t === 'searched' || ev.t === 'theft' && G.phase !== 'morning') && V3_EVENT_TEXT[ev.t]) toast(V3_EVENT_TEXT[ev.t](ev));
  }
  UI.seenEvents = G.events.length;
  save();
  render();
}
function onInput(e) { if (e.target.id === 'nightn') { UI.nightN = +e.target.value; const n = $('#nightv'); if (n) n.textContent = UI.nightN; } }
function onKey(e) {
  if (UI.screen === 'opening' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const p = $('[data-act=fe-press]'); if (p) p.click(); return; } if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[data-act]')) { e.preventDefault(); e.target.click(); } if (e.key === 'Escape' && (UI.sel || UI.stock || UI.catalog)) { UI.sel = null; UI.stock = false; UI.catalog = false; render(); }
  if ((e.key === 'b' || e.key === 'B') && UI.screen === 'game' && UI.G.store && roomPhase() && !e.target.matches('input')) { UI.room = !UI.room; UI.roomSel = null; render(); } }

// Mark card sheets that haven't been made yet, so cards fall back to a drawn emblem.
function probeArt() { for (const g of Object.keys(CT.GAMES)) { const im = new Image(); im.onerror = () => document.body.classList.add('noart-' + g); im.src = 'img/cards-' + g + '.jpg'; } }
function boot() {
  probeArt(); fit(); addEventListener('resize', fit); FE.apply();
  const st = $('#stage'); st.addEventListener('click', onClick); st.addEventListener('dragstart', onDragStart); st.addEventListener('dragover', onDragOver); st.addEventListener('drop', onDrop); st.addEventListener('input', onInput); addEventListener('keydown', onKey);
  render();
}
root.CTUI = UI; Object.assign(UI, { render, startSlot, save });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(this);
