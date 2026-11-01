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
  react: null, lastResult: null, tourGame: null, tourPrize: null, room: null, roomSel: null, catalog: false, board: false, drag: null, rot: 0, rp: null };

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
    <div class="day">DAY ${G.dayIdx + 1}/${G.week.length} · ${esc(D.name.toUpperCase())}</div>
    ${G.phase === 'shop' || G.phase === 'visit' ? `<div class="stat"><small>Customer</small>${at}/${custN}</div>` : ''}
    <div class="spacer"></div>
    ${ups ? `<div class="stat" title="Loupe upgrades"><small>Loupe</small>${esc(ups)}</div>` : ''}
    <div class="stat"><small>Cash</small><span class="cash">${money(G.cash)}</span></div>
    ${G.tab ? `<div class="stat"><small>Tab</small><span class="tabv">${money(G.tab)}</span></div>` : ''}
    <div class="stat"><small>Rep</small>${G.rep}</div>
    ${G.rating ? `<div class="stat" title="Store rating"><small>Rating</small>${G.rating.stars.toFixed(1)}★</div>` : `<div class="stat"><small>Packs</small>${CT.packTotal(G)}</div>`}
    ${G.store && roomPhase() ? `<button class="btn ${UI.room ? 'pink' : G.store.crate ? 'lime' : 'white'}" data-act="room" title="Floor (F) and back (B)" style="white-space:nowrap">${G.store.crate ? '📦 ' : ''}STOCK ROOM</button>` : ''}
    ${G.board ? `<button class="btn ${UI.board ? 'pink' : 'white'}" data-act="board" title="Known offenders">📌 ${G.board.length}</button>` : ''}
    <button class="btn white" data-act="stock" title="Every card you own">📇 ${G.stock.length}</button>
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
    return G.store && !CT.onGrid(G, 'case').length ? 'Breather! Your display case is empty: open the STOCK ROOM (F for the floor) and put some hard-sleeved cards or slabs on show. Browsers buy from it between customers.' : 'Breather! Rip a pack, tidy the BACK ROOM (B), or bring in the next customer.';
  }
  if (G.phase !== 'visit' || !v) return '';
  if (v.role === 'distract') return v.tellsShown >= 2 ? 'Two tells. Going to the back leaves the floor to their "friend". Watch them first, or say no.' : 'They want something from the back. Fetching costs patience, and leaves the floor alone. Read them first.';
  if (v.role === 'browse') return v.showing ? 'They found this on your floor. A fair tag sells; ask the full tag if it\'s already fair.' : 'Nothing on your floor caught their eye.';
  if (v.role === 'sealedc') return 'Sealed collectors pay market for sealed product in good shape. Fetching from the shelves costs patience.';
  if (v.role === 'vintage') return 'Vintage sealed is rare. Displayed (with a riser) it lifts your rating; graded sealed proves it was never opened. Resealed vintage exists.';
  if (v.caught) return v.hard === 'kid' ? 'A kid. A light lesson (call the parent) usually beats security, and people are watching.' : v.hard === 'drifter' ? 'Hard times. Security, let it go, or give him a reason not to steal.' : 'Caught in the act: security pays a bounty and puts them on your board.';
  if (G.store && v.react && v.cards.some(c => c.know.fake || c.trim && c.know.loupe)) return 'You proved a fake. Read their reaction: schemers get reported, victims get told kindly. Reporting a victim costs rep.';
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
  if (UI.board) html += boardHTML();
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
    <div style="margin-top:8px;font-size:13px">Rent due at close: <b>${money(D.rent)}</b>${G.dayIdx < G.week.length - 1 ? ' · <b>After Hours</b> event tonight' : ' · <b>Grade Day</b> tonight'}</div>
  </div>
  ${G.rating ? `<div class="panel" style="left:40px;top:470px;width:560px;padding:10px 14px"><div class="h" style="font-size:16px">STORE RATING ${G.rating.stars.toFixed(1)}★ <small style="font-family:var(--body)">(${G.rating.n} reviews${G.rating.last ? ', ' + (G.rating.last > 0 ? '+' : '') + G.rating.last + ' yesterday' : ''})</small></div>${(G.rating.reviews || []).map(t => `<div style="font-size:13px;font-style:italic">"${esc(t)}"</div>`).join('')}</div>` : ''}
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
    ${G.store ? tellsHTML(v) : ''}
    <div class="muted" style="font-size:12px">${esc(P.line)}</div></div>`;
  const v3 = v3DealHTML(v);
  if (v3) html += v3MatHTML(v);
  else if (youBuy) html += `<div id="mat" class="${v.cards.length > 3 ? 'lot' : ''}">${v.cards.map(c => card(c, { size: v.cards.length > 3 ? 'sm' : 'md', act: 'loupe' })).join('')}</div>`;
  else if (v.role === 'scalp') html += `<div id="mat">${Array.from({ length: Math.min(CT.packTotal(G), G.policy.limit2 ? 2 : 12) }, (_, i) => `<div class="card xs pop" style="--fr:linear-gradient(160deg,#FF2E93,#6A2BD9);animation-delay:${i * .04}s"><div class="inner" style="display:grid;place-items:center;color:#fff;font-family:var(--display);font-size:12px;background:repeating-linear-gradient(45deg,#6A2BD9 0 8px,#FF2E93 8px 16px)">PACK</div></div>`).join('') || '<div class="chip">No packs to scalp</div>'}</div>`;
  else if (v.showing === 'packs') html += `<div id="mat">${Array.from({ length: v.packs }, (_, i) => `<div class="card sm pop" style="--fr:linear-gradient(160deg,#FF2E93,#6A2BD9);animation-delay:${i * .06}s"><div class="inner" style="display:grid;place-items:center;color:#fff;font-family:var(--display);font-size:16px;background:repeating-linear-gradient(45deg,#6A2BD9 0 8px,#FF2E93 8px 16px)">PACK</div></div>`).join('')}</div>`;
  else if (v.showing) { const c = G.store ? CT.findThing(G, v.showing) : G.stock.find(x => x.uid === v.showing); html += `<div id="mat">${c ? (c.t ? card(c, { act: 'loupe' }) : goodTile(c, 180, 120)) : ''}</div>`; }
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
  return `${G.store ? fakeDecisionHTML(v) : ''}<div class="h" style="font-size:20px">${v.role === 'lot' ? 'BINDER LOT' : v.role === 'bulk' ? 'SHOEBOX' : 'THEY\'RE SELLING'} · ${v.cards.length} CARD${v.cards.length > 1 ? 'S' : ''}</div>
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
    const fits = G.stock.filter(c => CT.matches(G, v.wants, c)).sort((x, y) => (CT.isFloor(x.loc) ? 0 : 1) - (CT.isFloor(y.loc) ? 0 : 1));
    return `<div class="h" style="font-size:20px">YOUR STOCK</div><div style="font-size:13px">Cards that fit what ${esc(CT.PEOPLE[v.who].name)} wants (⏳ = fetching from the back costs patience):</div>
      ${fits.length ? `<div class="stocklist">${fits.map(c => `<div style="text-align:center">${card(c, { size: 'xs', act: 'show' })}<div style="font-size:12px;font-weight:800">${estText(c)}</div>${G.store ? `<div style="font-size:10px">${esc(where_(c))}</div>` : ''}</div>`).join('')}</div>` : '<div class="est">Nothing that fits. Pass for now, and remember who wants what.</div>'}
      <div class="row"><button class="btn white" data-act="pass">PASS</button></div>`;
  }
  const c = v.showing === 'packs' ? null : G.store ? CT.findThing(G, v.showing) : G.stock.find(x => x.uid === v.showing);
  const est = c ? (c.t ? CT.estimate(G, c).value : CT.goodValue(G, c)) : CT.PACK_RETAIL * v.packs;
  const max = Math.max(10, Math.round(Math.max(est, v.bid) * 2));
  if (!UI.offer || UI._for !== v.showing) { UI.offer = Math.round(Math.max(est, v.bid) * 1.25); UI._for = v.showing; }
  return `<div class="h" style="font-size:20px">THEY'RE BUYING</div>
    <div class="price-row"><span>Their bid</span><span class="big">${money(v.bid)}</span></div>
    <div class="est">Your read: <b>${c ? (c.t ? estText(c) : '~' + money(est)) : money(est)}</b>${c && c.t ? ' (today\'s demand' + (G.hotList.indexOf(c.t) >= 0 ? ', HOT' : '') + (isPump(c) ? ', RUMOR' : '') + ')' : ' at retail'}${c && c.cost ? ` · you paid ${money(c.cost)}` : ''}</div>
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
    ${G.store && G.goods.some(o => CT.GOODS[o.type].packs || CT.GOODS[o.type].vintage) ? `<div class="h" style="font-size:14px;margin-top:6px">SEALED GRADING <small style="font-family:var(--body)">(double fee; proves it was never opened)</small></div><div class="row" style="flex-wrap:wrap;gap:6px">${G.goods.filter(o => !o.sgrade && (CT.GOODS[o.type].packs || CT.GOODS[o.type].vintage)).slice(0, 6).map(o => `<div style="text-align:center">${goodTile(o, 80, 46)}<div class="row" style="gap:3px"><button class="btn sm cyan" style="padding:2px 6px" data-act="gradeSealed" data-co="quik" data-uid="${o.uid}">Q</button><button class="btn sm" style="padding:2px 6px" data-act="gradeSealed" data-co="halo" data-uid="${o.uid}">H</button></div></div>`).join('')}</div>` : ''}
    ${G.grading.length ? `<div style="margin-top:8px;font-size:12.5px">At the graders: ${G.grading.map(p => p.good ? CT.GOODS[p.good.type].name : (CT.readable(G, p.card) ? CT.tmpl(p.card.t).name : 'a card') + ' (' + CT.GRADERS[p.co].name + ')').join(', ')}</div>` : ''}</div>
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
      <tr><td>Deals · packs ripped</td><td>${S.deals} · ${S.cracked}</td></tr>${G.store ? `<tr><td>Store rating</td><td>${G.rating.stars.toFixed(1)}★ · ${G.board.length} on your board · ${G.store.stats.bounties} bounties · ${G.store.stats.wrongCalls} wrong calls</td></tr><tr><td>Stock room</td><td>browsers bought ${G.store.stats.browseSales} · stolen ${G.store.stats.stolen} · dead packs ${G.store.stats.deadPacks} · wear −${money(G.store.stats.wearValue)}</td></tr>` : ''}${F.tab ? `<tr><td>Unpaid tab</td><td class="neg">−${F.tab}</td></tr>` : ''}
    </table>
    <div class="row" style="margin-top:12px"><button class="btn big pink" data-act="again">PLAY AGAIN</button></div>
  </div>${dj(hint())}`;
}

// ---------- v3: the shop floor and the back (rev 2) ----------
// Two views of your stock: FLOOR (what customers can see and buy today) and BACK (what you're holding). The case, rack
// and shelves are shape grids; tap a thing, then tap a spot (R rotates), or drag on desktop. Loose packs fill the gaps.
const PROT_NAME = { none: 'no sleeve', penny: 'penny sleeve', hard: 'hard sleeve', mag: 'mag case' };
const GOOD_COLOR = { blister: '#FF7A1A', tin: '#19D3F0', collector: '#B28CFF', box: '#FFD21F', premium: '#FF2E93', vpack: '#C9A227', vbox: '#C9A227', repack: '#4CF2B5', brick: '#9A8F7A', poster: '#FF7A1A', playmat: '#19D3F0', deckbox: '#4CF2B5' };
const POLICY_STEPS = { penny: [1, 2, 5, 10, 20, 1e9], hard: [10, 15, 25, 40, 60, 100, 1e9], mag: [50, 100, 150, 250, 400, 1e9] };
const roomPhase = () => ['morning', 'shop', 'visit', 'close'].indexOf(UI.G.phase) >= 0;
const pol = n => n >= 1e9 ? 'off' : n + '₵+';
const fixName = f => CT.FIX[f] ? CT.FIX[f].name : f;
function where_(c) { return fixName(c.loc) + (CT.FIX[c.loc] && CT.FIX[c.loc].fetch ? ' · ⏳' + CT.FIX[c.loc].fetch : ''); }
function tiny(c) { return `<div class="tiny">${card(c, { size: 'xs', act: 'rsel', cls: UI.roomSel === c.uid ? 'selring' : '' })}</div>`; }
function goodTile(o, w, h) {
  const D = CT.GOODS[o.type], gc = o.game ? GAME_COLOR[o.game] : '#ddd', vint = D.vintage;
  const label = (vint ? '★ ' : '') + D.name.replace('Vintage ', 'Vtg ').replace('Collector ', 'Coll. ').toUpperCase();
  const badges = (o.sgrade ? `<span class="gb">${o.sgrade}</span>` : o.caught ? '<span class="gb bad">ALTERED</span>' : '') + (o.weighed ? `<span class="gb">${o.heavy ? 'HEAVY' : 'LIGHT'}</span>` : '') + (o.type === 'repack' ? `<span class="gb">1/${o.sign.every}</span>` : '');
  return `<div class="good ${vint ? 'vint' : ''} ${UI.roomSel === o.uid ? 'selring' : ''}" data-act="rsel" data-uid="${o.uid}" style="--gc:${gc};--tc:${GOOD_COLOR[o.type]};width:${w}px;height:${h}px">
    <span class="gl">${esc(label)}</span>${o.game ? `<span class="gg">${esc(CT.GAMES[o.game].name)}</span>` : ''}${badges}</div>`;
}
// A fixture grid: cells (drop targets), placed things, then loose packs filling the free cells in reading order.
function gridHTML(f, cw, ch) {
  const G = UI.G, [w, h] = CT.sizeOf(G, f), sel = UI.roomSel && CT.findThing(G, UI.roomSel), occ = {};
  let cells = '', items = '';
  for (const o of CT.onGrid(G, f)) { const [sw, sh] = CT.shapeOf(o); for (let y = o.y; y < o.y + sh; y++) for (let x = o.x; x < o.x + sw; x++) occ[x + ',' + y] = 1;
    items += `<div class="cell-item" draggable="true" data-uid="${o.uid}" style="left:${o.x * cw}px;top:${o.y * ch}px;width:${sw * cw}px;height:${sh * ch}px">${o.t ? tiny(o) : goodTile(o, sw * cw - 4, sh * ch - 4)}${CT.isFloor(f) && o.type !== 'repack' ? `<span class="tagp">${money(o.tag || CT.defaultTag(G, o))}</span>` : ''}</div>`; }
  const okRule = sel && !CT.placeRule(G, sel, f);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells += `<button class="cell ${okRule && CT.gridFits(G, f, sel, x, y, UI.rot ? 1 : 0) ? 'ok' : ''}" style="left:${x * cw}px;top:${y * ch}px;width:${cw}px;height:${ch}px" data-act="cell" data-f="${f}" data-x="${x}" data-y="${y}" aria-label="${fixName(f)} spot ${x + 1},${y + 1}"></button>`;
  const loose = f === 'rack' ? G.packs : f === 'shelf' ? G.store.backPacks : null;
  if (loose) { const q = []; for (const g of Object.keys(CT.GAMES)) for (let i = 0; i < loose[g]; i++) q.push(g);
    for (let y = 0; y < h && q.length; y++) for (let x = 0; x < w && q.length; x++) if (!occ[x + ',' + y]) { const g = q.shift(); items += `<div class="looseP ${UI.roomSel === 'p:' + g + ':' + f ? 'selring' : ''}" data-act="psel" data-game="${g}" data-f="${f}" style="left:${x * cw + 3}px;top:${y * ch + 3}px;width:${cw - 6}px;height:${ch - 6}px;--gc:${GAME_COLOR[g]}">PACK</div>`; } }
  return `<div class="gridbox" style="width:${w * cw + 6}px;height:${h * ch + 6}px"><div class="gridin">${cells}${items}</div></div>`;
}
function pocketList(f, empty) {
  const G = UI.G, cs = CT.where(G, f);
  return `<div class="tray">${cs.map(c => `<div class="it" draggable="true" data-uid="${c.uid}">${tiny(c)}<div style="font-size:11px;font-weight:800">${CT.isFloor(f) ? money(c.tag || CT.defaultTag(G, c)) : estText(c)}</div><span class="pchip ${c.graded ? 'mag' : c.prot || 'none'}">${c.graded ? 'SLAB' : (c.prot || 'none').toUpperCase()}</span></div>`).join('') || `<div class="muted" style="padding:10px;font-weight:800">${esc(empty)}</div>`}</div>`;
}
function zone(f, style, title, body) { return `<div class="zone" data-drop="${f}" style="${style}"><div class="h">${title}</div>${body}</div>`; }
function roomScreen() {
  const G = UI.G, S = G.store, view = UI.room, selThing = UI.roomSel && UI.roomSel.indexOf('p:') !== 0 ? CT.findThing(G, UI.roomSel) : null;
  const right = S.crate && view === 'back' ? crateHTML() : selThing ? selHTML(selThing) : UI.roomSel ? packSelHTML() : view === 'floor' ? floorInfoHTML() : `<div class="zone" style="left:896px;top:8px;width:368px;height:330px">${gearHTML()}</div>`;
  const [cw, chh] = CT.sizeOf(G, 'case'), cCell = Math.min(60, Math.floor(528 / cw)), cH = Math.min(66, Math.floor(262 / chh));
  let body;
  if (view === 'floor') body = `
    ${zone('case', 'left:16px;top:8px;width:560px;height:330px', `DISPLAY CASE <small>${CT.onGrid(G, 'case').length} items · browsers buy what's fairly tagged</small><span style="flex:1"></span><button class="btn sm ${S.locked ? 'lime' : 'white'}" data-act="lockCase" ${S.up.lock ? '' : 'disabled title="Buy a case lock at close"'}>${S.up.lock ? (S.locked ? '🔒 LOCKED' : '🔓 UNLOCKED') : '🔓 NO LOCK'}</button>`, gridHTML('case', cCell, cH))}
    ${zone('rack', 'left:586px;top:8px;width:300px;height:330px', `WALL RACK <small>${CT.gridFree(G, 'rack')} free</small>`, gridHTML('rack', 66, 62))}
    ${right}
    ${zone('cbinder', 'left:16px;top:348px;width:560px;height:236px', `COUNTER BINDER <small>${CT.where(G, 'cbinder').length}/${CT.sizeOf(G, 'cbinder')} · sleeved mid singles · browsers flip it</small>`, pocketList('cbinder', 'Empty. Sleeved cards worth 6–60₵ sell well here; cheap ones make the binder look like bulk.'))}
    ${S.up.tlbinder ? zone('tlbinder', 'left:586px;top:348px;width:300px;height:236px', `TOP-LOADERS <small>${CT.where(G, 'tlbinder').length}/${CT.sizeOf(G, 'tlbinder')}</small>`, pocketList('tlbinder', 'High-end raw cards in hard sleeves.'))
      : `<div class="zone" style="left:586px;top:348px;width:300px;height:236px"><div class="h">BULK BIN</div><div style="font-size:30px;font-family:var(--display);margin-top:10px">${G.bulk}<small style="font-size:14px"> / ${CT.BULK_CAP}</small></div><div style="font-size:12px">Commons sell for 1₵ each. Nubb digs it. The bulk sorter (at close) turns it into repacks.</div><div style="font-size:12px;margin-top:8px">A top-loader binder for high-end raw cards is an upgrade at close.</div></div>`}
    <div style="position:absolute;left:896px;top:348px;width:368px;display:flex;flex-direction:column;gap:8px">
      <button class="btn big white" data-act="roomView" data-v="back">THE BACK ▶</button>
      <button class="btn big pink" data-act="room">${G.phase === 'visit' ? '◀ BACK TO THE COUNTER' : '◀ CLOSE THE ROOM'}</button></div>`;
  else body = `
    ${zone('shelf', 'left:16px;top:8px;width:620px;height:330px', `BACK SHELVES <small>${CT.gridFree(G, 'shelf')} free · boxes, sealed, slabs, bricks · fetching costs ⏳2</small>`, gridHTML('shelf', Math.min(64, Math.floor(588 / CT.sizeOf(G, 'shelf')[0])), 64))}
    ${zone('safe', 'left:646px;top:8px;width:240px;height:160px', `SAFE <small>${CT.where(G, 'safe').length}/${CT.sizeOf(G, 'safe')} · ⏳2</small>`, pocketList('safe', 'Grails and slabs. Never stolen.'))}
    ${zone('inbox', 'left:646px;top:176px;width:240px;height:162px', `INBOX <small>${CT.where(G, 'inbox').length}/${CT.sizeOf(G, 'inbox')} · loose cards wear</small><span style="flex:1"></span><button class="btn sm cyan" data-act="autoStore">FILE</button>`, pocketList('inbox', 'New buys land here.'))}
    ${right}
    ${zone('bbinder', 'left:16px;top:348px;width:620px;height:236px', `BACK BINDERS <small>${CT.where(G, 'bbinder').length}/${CT.sizeOf(G, 'bbinder')} · holding · fetching costs ⏳1</small>`, pocketList('bbinder', 'Empty.'))}
    ${S.up.sorter ? repackHTML() : `<div class="zone" style="left:646px;top:348px;width:240px;height:236px"><div class="h">BULK</div><div style="font-size:26px;font-family:var(--display)">${G.bulk}</div><div style="font-size:12px">The bulk sorter (an upgrade at close) builds repacks with a posted hit sign.</div></div>`}
    <div style="position:absolute;left:896px;top:348px;width:368px;display:flex;flex-direction:column;gap:8px">
      <button class="btn big white" data-act="roomView" data-v="floor">◀ THE FLOOR</button>
      <button class="btn big pink" data-act="room">${G.phase === 'visit' ? '◀ BACK TO THE COUNTER' : 'CLOSE THE ROOM'}</button></div>`;
  return `${hud()}<div id="room" class="${view}">${body}</div>${dj(roomHint(selThing))}`;
}
function floorInfoHTML() {
  const G = UI.G, S = G.store;
  return `<div class="zone" style="left:896px;top:8px;width:368px;height:330px">
    <div class="h">THE FLOOR TODAY</div>
    <div style="font-size:13px;margin:4px 0">Store rating <b>${G.rating.stars.toFixed(1)}★</b> (${G.rating.n} reviews). Stocked, fairly tagged floors raise it.</div>
    <button class="btn sm cyan" data-act="retag">RE-TAG EVERYTHING TO TODAY'S MARKET</button>
    <button class="toggle" data-act="sign" aria-pressed="${S.noTouch}" style="margin-top:8px;width:100%"><span class="tl">"No touching the packs" sign<small>Keeps the Scale Gang off the rack</small></span><span class="sw ${S.noTouch ? 'on' : ''}"><span></span></span></button>
    <div style="font-size:12px;margin-top:8px">Tap anything to move it, tag it or open it. On a grid, tap a spot to place; <b>R</b> rotates. Loose packs fill the gaps on the rack and shelves.</div>
  </div>`;
}
function gearHTML() {
  const S = UI.G.store, g = S.gear, p = S.sleeve;
  const stepper = k => `<span class="step"><button class="btn white" data-act="pol" data-k="${k}" data-d="-1" aria-label="lower">−</button><b>${pol(p[k])}</b><button class="btn white" data-act="pol" data-k="${k}" data-d="1" aria-label="raise">+</button></span>`;
  return `<div class="h">GEAR + SLEEVING POLICY</div>
    <div class="gear"><span class="pchip penny">PENNY ${g.penny}</span>${stepper('penny')}<span class="pchip hard">HARD ${g.hard}</span>${stepper('hard')}<span class="pchip mag">MAG ${g.mag}</span>${stepper('mag')}</div>
    <button class="btn sm cyan" style="margin-top:6px" data-act="applyPolicy">SLEEVE STOCK BY POLICY</button>
    <div style="font-size:12px;margin-top:8px">New stock is sleeved by value while gear lasts. The case needs hard sleeves on raw cards; the counter binder needs at least a penny sleeve.</div>`;
}
function sendButtons(o) {
  const G = UI.G, spots = o.t ? ['case', 'cbinder', 'tlbinder', 'bbinder', 'safe', 'inbox', 'shelf'] : ['case', 'rack', 'shelf'];
  return spots.filter(f => f !== o.loc && (f !== 'tlbinder' || G.store.up.tlbinder)).map(f => { const bad = CT.placeRule(G, o, f); return `<button class="btn sm ${CT.isFloor(f) ? '' : 'white'}" data-act="placeTo" data-to="${f}" ${bad ? `disabled title="${esc(bad)}"` : ''}>${esc(fixName(f).replace('Display ', '').replace('Back ', '').replace('Counter ', 'Ctr ').toUpperCase())}</button>`; }).join('');
}
function selHTML(o) {
  const G = UI.G, g = G.store.gear;
  if (!o.t) {
    const D = CT.GOODS[o.type], val = CT.goodValue(G, o);
    return `<div class="zone" style="left:896px;top:8px;width:368px;height:330px;overflow:auto">
      <div class="h">${esc(D.name)}${o.game ? ' · ' + esc(CT.GAMES[o.game].name) : ''}</div>
      <div style="font-size:13px;margin:4px 0">Market ~${money(val)} · in <b>${esc(fixName(o.loc))}</b>${o.set != null && !D.vintage && CT.SET_NAMES[o.set] ? ' · ' + CT.SET_NAMES[o.set] : ''}${D.vintage ? ' · vintage' + (o.weighed ? (o.heavy ? ' · HEAVY' : ' · light') : '') : ''}${o.sgrade ? ' · sealed grade ' + o.sgrade : ''}${o.type === 'repack' ? ` · sign: 1 in ${o.sign.every} has ${o.sign.min}₵+` : ''}</div>
      <div class="h" style="font-size:13px;margin-top:6px">MOVE TO</div><div class="row" style="gap:5px;flex-wrap:wrap">${sendButtons(o)}<button class="btn sm white" data-act="rotate">↻ ROTATE (R)</button></div>
      ${CT.isFloor(o.loc) ? `<div class="h" style="font-size:13px;margin-top:6px">PRICE TAG</div><div class="step"><button class="btn white" data-act="tagd" data-d="-1">−10%</button><b style="font-size:18px">${money(o.tag || CT.defaultTag(G, o))}</b><button class="btn white" data-act="tagd" data-d="1">+10%</button></div>` : ''}
      <div class="row" style="gap:5px;margin-top:8px;flex-wrap:wrap">
        ${D.packs ? `<button class="btn sm" data-act="openGood">OPEN (${D.packs} packs${D.promo ? ' + promo' : ''})</button>` : ''}
        ${o.type === 'vpack' ? `<button class="btn sm" data-act="openVintage">RIP IT</button><button class="btn sm white" data-act="weigh" ${G.store.up.scale ? '' : 'disabled title="needs the pack scale"'}>WEIGH</button>` : ''}
        <button class="btn sm white" data-act="rsel" data-uid="${o.uid}">DONE</button></div>
      ${D.vintage && !G.store.up.riser ? '<div style="font-size:11px;margin-top:6px">A display riser (at close) makes vintage sealed in the case raise your rating every day.</div>' : ''}
    </div>`;
  }
  const c = o, e = CT.estimate(G, c), name = CT.readable(G, c) ? CT.tmpl(c.t).name : 'Unread card';
  return `<div class="zone" style="left:896px;top:8px;width:368px;height:330px;overflow:auto">
    <div class="h">${esc(name)}</div>
    <div style="font-size:13px;margin:4px 0">Worth ${estText(c)} · ${esc(c.era || 'modern')} · in <b>${esc(fixName(c.loc))}</b> · <span class="pchip ${c.graded ? 'mag' : c.prot || 'none'}">${c.graded ? 'slabbed' : PROT_NAME[c.prot || 'none']}</span>${e.fake ? ' · <b style="color:#c41d1d">FAKE</b>' : ''}</div>
    <div class="h" style="font-size:13px;margin-top:6px">MOVE TO</div><div class="row" style="gap:5px;flex-wrap:wrap">${sendButtons(c)}</div>
    ${c.graded ? '' : `<div class="h" style="font-size:13px;margin-top:6px">PROTECT</div><div class="row" style="gap:5px">
      <button class="btn sm white" data-act="sleeve" data-p="penny" ${c.prot && c.prot !== 'none' || !g.penny ? 'disabled' : ''}>PENNY</button>
      <button class="btn sm white" data-act="sleeve" data-p="hard" ${c.prot === 'hard' || c.prot === 'mag' || !g.hard ? 'disabled' : ''}>HARD</button>
      <button class="btn sm white" data-act="sleeve" data-p="mag" ${c.prot === 'mag' || !g.mag ? 'disabled' : ''}>MAG</button></div>`}
    ${CT.isFloor(c.loc) ? `<div class="h" style="font-size:13px;margin-top:6px">PRICE TAG</div><div class="step"><button class="btn white" data-act="tagd" data-d="-1">−10%</button><b style="font-size:18px">${money(c.tag || CT.defaultTag(G, c))}</b><button class="btn white" data-act="tagd" data-d="1">+10%</button></div>` : ''}
    <div class="row" style="gap:5px;margin-top:8px"><button class="btn sm cyan" data-act="loupe" data-uid="${c.uid}">LOUPE</button>${G.phase === 'shop' || G.phase === 'close' ? '<button class="btn sm white" data-act="roomBulk">TO BULK</button>' : ''}<button class="btn sm white" data-act="rsel" data-uid="${c.uid}">DONE</button></div>
  </div>`;
}
function packSelHTML() {
  const G = UI.G, [, g, f] = UI.roomSel.split(':'), n = f === 'rack' ? G.packs[g] : G.store.backPacks[g], to = f === 'rack' ? 'shelf' : 'rack';
  return `<div class="zone" style="left:896px;top:8px;width:368px;height:330px">
    <div class="h">${esc(CT.GAMES[g].name)} PACKS</div><div style="font-size:13px;margin:4px 0">${n} loose on the ${f === 'rack' ? 'rack (pack buyers take these)' : 'back shelves'}.</div>
    <div class="row" style="gap:5px;flex-wrap:wrap"><button class="btn sm" data-act="movePacks" data-game="${g}" data-n="1" data-to="${to}">MOVE 1 TO ${to.toUpperCase()}</button><button class="btn sm white" data-act="movePacks" data-game="${g}" data-n="${n}" data-to="${to}">MOVE ALL</button>
    ${G.phase === 'shop' ? `<button class="btn sm pink" data-act="crack" data-game="${g}">RIP ONE</button>` : ''}<button class="btn sm white" data-act="psel">DONE</button></div></div>`;
}
function repackHTML() {
  const G = UI.G, P = UI.rp || (UI.rp = { n: 8, per: 15, every: 4, min: 12, honest: true, price: 12 });
  const st = (k, d, label) => `<span class="step"><button class="btn white" data-act="rp" data-k="${k}" data-d="-${d}">−</button><b>${label}</b><button class="btn white" data-act="rp" data-k="${k}" data-d="${d}">+</button></span>`;
  return `<div class="zone" style="left:646px;top:348px;width:240px;height:236px;font-size:12px">
    <div class="h">REPACKS <small>bulk ${G.bulk}</small></div>
    <div>${st('n', 1, P.n + ' packs')} of ${st('per', 5, P.per)}</div>
    <div>Sign: 1 in ${st('every', 1, P.every)} has ${st('min', 4, P.min + '₵+')}</div>
    <div>Price ${st('price', 1, money(P.price))}</div>
    <button class="toggle" data-act="rpHonest" aria-pressed="${P.honest}" style="width:100%;margin-top:4px"><span class="tl">${P.honest ? 'Seed hits as the sign says' : 'Seed half (stingy)'}</span><span class="sw ${P.honest ? 'on' : ''}"><span></span></span></button>
    <button class="btn sm pink" style="margin-top:4px;width:100%" data-act="makeRepacks">MAKE ${P.n} REPACKS</button></div>`;
}
function crateHTML() {
  const G = UI.G, C = G.store.crate, names = {};
  for (const it of C.items) { const k = it.good ? CT.GOODS[it.good.type].name : (CT.CATALOG[it.item] || { name: it.item }).name; const kk = k + (it.game ? ' · ' + CT.GAMES[it.game].name : ''); names[kk] = (names[kk] || 0) + 1; }
  return `<div class="zone" style="left:896px;top:8px;width:368px;height:330px">
    <div class="h">DELIVERY CRATE</div>
    <div style="display:grid;place-items:center;margin:8px 0"><div class="cratebox">📦 ${C.items.length}</div></div>
    <div style="font-size:12.5px;max-height:90px;overflow:auto">${Object.keys(names).map(k => `<div>${names[k]} × ${esc(k)}</div>`).join('')}</div>
    <button class="btn big pink" style="width:100%;margin-top:8px" data-act="unpack">CUT IT OPEN ▶</button>
    <div style="font-size:11px;margin-top:4px">Sealed goes on the shelves (or the rack), gear in the drawer. Anything with no room stays in the crate.</div></div>`;
}
function roomHint(sel) {
  const G = UI.G, S = G.store;
  if (S.crate && UI.room === 'back') return 'A crate came in! Cut it open: sealed to the shelves, gear in the drawer.';
  if (S.crate) return 'A delivery crate is waiting in THE BACK.';
  if (sel) return sel.t ? (CT.isFloor(sel.loc) ? 'On the floor, customers can see it and buy it, and thieves can reach it. Fair tags sell.' : 'In the back it\'s safe and it doesn\'t sell. Buyers wait while you fetch it.') : 'Sealed product: hold it, open it into loose packs, or put it out on the floor. Some sets climb if they never get reprinted.';
  if (UI.room === 'floor' && !CT.onGrid(G, 'case').length) return 'An empty case sells nothing and hurts your rating. Put out hard-sleeved cards, slabs or sealed at fair tags.';
  if (CT.where(G, 'inbox').length >= CT.sizeOf(G, 'inbox') - 3) return 'The inbox is nearly full, and loose cards wear. FILE sends slabs and grails to the safe, mid cards to the counter binder, the rest to back binders.';
  return UI.room === 'floor' ? 'This is what customers see today. Tap anything to move it, tag it or open it.' : 'This is what you\'re holding. Fetching from here costs a waiting customer patience.';
}
function catalogHTML() {
  const G = UI.G, C = CT.CATALOG, games = Object.keys(CT.GAMES), S = G.store;
  const set = CT.currentSet(G);
  const row = (k, extra) => { const it = C[k];
    const btns = it.game ? games.map(g => `<button class="btn sm" style="background:${GAME_COLOR[g]}" data-act="order" data-item="${k}" data-game="${g}" ${G.cash >= it.cost ? '' : 'disabled'}>${esc(CT.GAMES[g].name.split(' ')[0])}</button>`).join('')
      : `<button class="btn sm" data-act="order" data-item="${k}" ${G.cash < it.cost ? 'disabled' : ''}>ORDER</button>`;
    return `<div class="catrow"><div><b>${esc(it.name)}</b> · ${it.cost}₵${CT.GOODS[it.goods] && CT.GOODS[it.goods].msrp ? ' · retail ' + CT.GOODS[it.goods].msrp + '₵' : ''}<small>${esc(extra)}</small></div><div class="row" style="gap:4px">${btns}</div></div>`; };
  const up = k => { const U = CT.UNLOCKS[k], have = S.up[k] && !U.repeat; return `<div class="catrow"><div><b>${esc(U.name)}</b> · ${U.cost}₵<small>${esc(U.does)}</small></div><button class="btn sm ${have ? 'lime' : ''}" data-act="unlock" data-k="${k}" ${have || G.cash < U.cost ? 'disabled' : ''}>${have ? 'OWNED' : 'BUY'}</button></div>`; };
  const pending = S.orders.length ? S.orders.map(o => C[o.item].name + (o.game ? ' (' + CT.GAMES[o.game].name + ')' : '')).join(', ') : 'nothing yet';
  return `<div id="loupe" style="display:block;overflow:auto">
    <div class="row" style="align-items:center;margin-bottom:10px"><div class="h" style="font-size:30px;color:var(--sun);flex:1">DISTRIBUTOR CATALOG</div><span class="chip">Cash ${money(G.cash)}</span><button class="btn pink" style="flex:none" data-act="catalog">CLOSE</button></div>
    <div class="row" style="gap:14px;align-items:flex-start">
    <div class="panel" style="position:relative;padding:12px 16px;flex:1">
      <div class="h" style="font-size:18px">SEALED · current set: ${esc(CT.SET_NAMES[set])}</div>
      ${row('box', 'Arrives tomorrow. 2×3 on the shelves; open it into 6 loose packs.')}
      ${row('premium', '3×2. Collectors hold these. Some sets climb if they never get reprinted.')}
      ${row('tin', '2×2. 4 packs and a promo.')}
      ${row('collector', '2×2. 3 packs and a promo.')}
      ${row('blister', '1×2 on the rack. Kids love them.')}
      <div class="h" style="font-size:18px;margin-top:8px">MERCH + GEAR</div>
      ${row('poster', '')}${row('playmat', '')}${row('deckbox', '')}${row('penny', '')}${row('hard', '')}${row('mag', '')}
      <div style="margin-top:8px;font-size:13px">In tomorrow's crate: <b>${esc(pending)}</b></div>
    </div>
    <div class="panel" style="position:relative;padding:12px 16px;width:430px">
      <div class="h" style="font-size:18px">SHOP UPGRADES · installed now</div>
      ${Object.keys(CT.UNLOCKS).map(up).join('')}
    </div></div></div>`;
}
function boardHTML() {
  const G = UI.G;
  return `<div id="loupe" style="display:block;overflow:auto">
    <div class="row" style="align-items:center;margin-bottom:10px"><div class="h" style="font-size:30px;color:var(--sun);flex:1">KNOWN OFFENDERS</div><button class="btn pink" style="flex:none" data-act="board">CLOSE</button></div>
    <div style="color:#fff;margin-bottom:10px">Only people you caught yourself go up here. They come back, sometimes in a hat and a new coat, but the signature tell never changes. Spot one at the door and REFUSE them.</div>
    <div class="row" style="gap:14px;flex-wrap:wrap">${G.board.map(b => `<div class="panel" style="position:relative;width:280px;padding:10px">${portrait(b.who, 'mini')}<div class="h" style="font-size:18px;margin-top:6px">${esc(b.name)}</div>
      <div style="font-size:13px">${b.kind === 'thief' ? 'Thief' : 'Passes fakes on purpose'} · ${esc(b.crimes.join(', '))}</div>${b.sig ? `<div class="chip" style="margin-top:6px;background:var(--sun)">Tell: ${esc(b.sig)}</div>` : ''}</div>`).join('') || '<div class="chip">Nobody yet. Catch them in the act, or prove the fake, then call security.</div>'}</div></div>`;
}
// The counter: the new visitors.
function tellsHTML(v) {
  const G = UI.G, onBoard = CT.boardHas(G, v.who), shown = (v.tells || []).slice(0, v.tellsShown || 0);
  const sigSeen = v.sig && (onBoard || G.store.up.camera);
  return `${shown.length || sigSeen ? `<div class="tells">${shown.map(t => `<span class="chip tell">👀 ${esc(t)}</span>`).join('')}${sigSeen ? `<span class="chip tell sig">🔎 ${esc(v.sig)}</span>` : ''}</div>` : ''}
    ${onBoard && v.disguised ? `<div class="chip" style="background:var(--coral)">⚠ Matches your board: ${esc(onBoard.name)}</div>` : ''}
    <div class="row" style="gap:6px;margin-top:4px"><button class="btn sm white" data-act="refuse" title="Turn them away">🚫 REFUSE</button><button class="btn sm white" data-act="security" title="Right: a bounty and a board entry. Wrong: rep and rating.">🚨 SECURITY</button></div>`;
}
function fakeDecisionHTML(v) {
  if (!v.react || !v.cards.some(c => c.know.fake || c.trim && c.know.loupe)) return '';
  return `<div class="est" style="border-color:#c41d1d"><b>You found a fake.</b> How do they react? ${v.react.map(t => `<span class="chip tell">${esc(t)}</span>`).join(' ')}
    <div class="row" style="gap:6px;margin-top:6px"><button class="btn sm" data-act="security">REPORT (SECURITY)</button><button class="btn sm cyan" data-act="inform">INFORM THEM</button></div>
    <div style="font-size:11px">Schemers know it's fake: report them. Victims got burned: tell them, kindly. Reporting a victim costs rep.</div></div>`;
}
function v3DealHTML(v) {
  const G = UI.G, P = CT.PEOPLE[v.who];
  if (v.role === 'weigh') return `<div class="h" style="font-size:20px">⚠ THE SCALE GANG</div>
    <div>They want to <b>pick their own 3 packs</b> off your rack, feeling for the heavy ones (the hits). Whatever they leave is dead weight.</div>
    <div class="row"><button class="btn lime" data-act="sellBehind" ${CT.packTotal(G) ? '' : 'disabled'}>SELL FROM BEHIND THE COUNTER</button></div>
    <div class="row"><button class="btn white" data-act="accept" ${CT.packTotal(G) ? '' : 'disabled'}>LET THEM PICK (${money(3 * CT.PACK_RETAIL)})</button><button class="btn white" data-act="pass">NO SALE</button></div>`;
  if (v.role === 'thief') {
    if (v.caught) return `<div class="h" style="font-size:20px">CAUGHT IN THE ACT</div><div>${v.hard === 'kid' ? 'It\'s a kid. A pack up the sleeve.' : v.hard === 'drifter' ? 'Down on his luck, and he knows cards are money.' : 'A pack in the fluff. Classic.'}</div>
      <div class="row" style="flex-wrap:wrap">${v.hard === 'kid' ? '<button class="btn lime" data-act="letGo" data-parent="1">CALL THEIR PARENT</button>' : ''}${v.hard === 'drifter' ? '<button class="btn lime" data-act="letGo" data-work="1">BUY HIS BULK FINDS (12₵)</button>' : ''}
      <button class="btn" data-act="security">🚨 SECURITY</button><button class="btn white" data-act="letGo">LET IT GO</button></div>`;
    return `<div class="h" style="font-size:20px">"JUST BROWSING"</div><div>${esc(P.name)} is drifting around the shop floor.</div>
      <div class="est">${G.store.locked ? 'Your case is locked, so the rack is the target.' : CT.onGrid(G, 'case').length ? 'The display case is <b>unlocked</b>.' : 'Nothing in the case, but the rack is right there.'}</div>
      <div class="row"><button class="btn lime" data-act="watch">KEEP AN EYE ON THEM</button><button class="btn white" data-act="pass">LET THEM BROWSE</button></div>`;
  }
  if (v.role === 'distract') {
    const far = G.stock.filter(c => !CT.isFloor(c.loc) && CT.matches(G, v.wants, c) && !c.know.fake).slice(0, 6);
    return `<div class="h" style="font-size:20px">"GOT ANYTHING IN THE BACK?"</div><div style="font-size:13px">${v.foiled ? 'Their friend has stopped drifting.' : 'Going to the back leaves the floor alone. Check the tells first.'}</div>
      ${far.length ? `<div class="stocklist">${far.map(c => `<div style="text-align:center">${card(c, { size: 'xs', act: 'show' })}<div style="font-size:11px;font-weight:800">${esc(where_(c))}</div></div>`).join('')}</div>` : '<div class="est">Nothing in the back that fits.</div>'}
      <div class="row"><button class="btn lime" data-act="watch" ${v.watched ? 'disabled' : ''}>WATCH THEM AND THEIR FRIEND</button><button class="btn white" data-act="pass">NOT TODAY</button></div>`;
  }
  if (v.role === 'switch') {
    const fits = G.stock.filter(c => CT.matches(G, v.wants, c));
    return `<div class="h" style="font-size:20px">"CAN I SEE IT?"</div>
      <div style="font-size:13px">${v.watched ? 'You\'re watching all four hands.' : esc(P.name) + ' wants to hold it. Up close.'} Cards that fit:</div>
      ${fits.length ? `<div class="stocklist">${fits.slice(0, 6).map(c => `<div style="text-align:center">${card(c, { size: 'xs', act: 'show' })}<div style="font-size:11px;font-weight:800">${c.graded ? 'slab' : PROT_NAME[c.prot || 'none']}</div></div>`).join('')}</div>` : '<div class="est">Nothing that fits.</div>'}
      <div class="row"><button class="btn lime" data-act="watch" ${v.watched ? 'disabled' : ''}>WATCH THEIR HANDS</button><button class="btn white" data-act="pass">NOT TODAY</button></div>`;
  }
  if (v.role === 'reseal') return `<div class="h" style="font-size:20px">"FACTORY SEALED"</div>
    <div class="price-row"><span>${v.packs} ${esc(CT.GAMES[v.packGame].name)} packs</span><span class="big">${money(v.packs * 20)}</span></div>
    <div class="est">Retail is ${CT.PACK_RETAIL}₵ a pack. ${v.knowSeal ? (v.resealed ? '<b style="color:#c41d1d">Glue shine on the seams and creased wrappers: opened, searched and glued shut.</b>' : 'Clean factory seams. Looks legit.') : 'Too cheap? Check the seams before you buy.'}</div>
    <div class="row"><button class="btn cyan" data-act="inspectPacks" ${v.knowSeal ? 'disabled' : ''}>CHECK THE SEAMS (1 patience)</button></div>
    <div class="row"><button class="btn lime" data-act="accept" ${G.cash >= v.packs * 20 ? '' : 'disabled'}>BUY THEM</button><button class="btn white" data-act="pass">PASS</button></div>`;
  if (v.role === 'browse') {
    const o = v.showing && CT.findThing(G, v.showing); if (!o) return `<div class="h" style="font-size:20px">JUST LOOKING</div><div class="row"><button class="btn white" data-act="pass">OKAY</button></div>`;
    const tag = o.tag || CT.defaultTag(G, o);
    return `<div class="h" style="font-size:20px">FOUND IT ON YOUR FLOOR</div>
      <div class="price-row"><span>Your tag</span><span class="big">${money(tag)}</span></div><div class="price-row"><span>They offer</span><span class="big">${money(v.bid)}</span></div>
      <div class="est">Your read: <b>${o.t ? estText(o) : '~' + money(CT.goodValue(G, o))}</b>. A fair tag sells; a greedy one gets haggled.</div>
      <div class="row"><button class="btn lime" data-act="accept">TAKE ${money(v.bid)}</button><button class="btn pink" data-act="askTag" data-p="${tag}">ASK FULL TAG</button></div>
      <div class="row"><button class="btn white" data-act="pass">NO DEAL</button></div>`;
  }
  if (v.role === 'sealedc' && !v.showing) {
    const W = v.wantsGood, fits = G.goods.filter(o => o.type === W.type && o.game === W.game);
    return `<div class="h" style="font-size:20px">SEALED COLLECTOR</div><div style="font-size:13px">Wants a ${esc(CT.GOODS[W.type].name.toLowerCase())}, ${esc(CT.GAMES[W.game].name)}.</div>
      ${fits.length ? fits.map(o => `<div class="row" style="align-items:center">${goodTile(o, 90, 50)}<span style="font-size:12px">${esc(fixName(o.loc))}${CT.FIX[o.loc].fetch ? ' · ⏳' + CT.FIX[o.loc].fetch : ''}</span><button class="btn sm" data-act="show" data-uid="${o.uid}">SHOW</button></div>`).join('') : '<div class="est">You don\'t have one. Order sealed at close.</div>'}
      <div class="row"><button class="btn white" data-act="pass">PASS</button></div>`;
  }
  if (v.role === 'vintage') { const val = CT.goodValue(G, v.lot); return `<div class="h" style="font-size:20px">VINTAGE SEALED</div>
    <div class="row" style="justify-content:center">${goodTile(v.lot, 150, 90)}</div>
    <div class="price-row"><span>Estate asks</span><span class="big">${money(v.ask)}</span></div>
    <div class="est">Market guide: ~${money(val)}. Old sealed is rare. On display (with a riser) it pulls people in and lifts your rating; sealed-graded, it proves it was never opened. Resealed vintage exists.</div>
    <div class="row"><button class="btn lime" data-act="accept" ${G.cash >= v.ask ? '' : 'disabled'}>BUY ${money(v.ask)}</button><button class="btn pink" data-act="vOffer" data-p="${Math.round(v.ask * 0.8)}">OFFER ${money(Math.round(v.ask * 0.8))}</button></div>
    <div class="row"><button class="btn white" data-act="pass">PASS</button></div>`; }
  return null;
}
function v3MatHTML(v) {
  const G = UI.G, pack = (gc, i, glue) => `<div class="card sm pop" style="--fr:linear-gradient(160deg,${gc},#6A2BD9);animation-delay:${i * .06}s"><div class="inner" style="display:grid;place-items:center;color:#fff;font-family:var(--display);font-size:16px;background:repeating-linear-gradient(45deg,#6A2BD9 0 8px,${gc} 8px 16px)">PACK</div>${glue ? '<div class="glue"></div>' : ''}</div>`;
  if (v.role === 'reseal') return `<div id="mat">${Array.from({ length: v.packs }, (_, i) => pack(GAME_COLOR[v.packGame], i, v.knowSeal && v.resealed)).join('')}</div>`;
  if (v.role === 'weigh') { const out = []; for (const g of Object.keys(CT.GAMES)) for (let i = 0; i < Math.min(3, G.packs[g]); i++) out.push(pack(GAME_COLOR[g], out.length)); return `<div id="mat">${out.join('') || '<div class="chip">Your rack is empty</div>'}</div>`; }
  if (v.role === 'browse' && v.showing) { const o = CT.findThing(G, v.showing); return `<div id="mat">${o ? (o.t ? card(o, { act: 'loupe' }) : goodTile(o, 180, 120)) : ''}</div>`; }
  if (v.role === 'vintage') return `<div id="mat">${goodTile(v.lot, 200, 130)}</div>`;
  if (v.role === 'sealedc' && v.showing) { const o = CT.findThing(G, v.showing); return `<div id="mat">${o ? goodTile(o, 180, 120) : ''}</div>`; }
  return `<div id="mat"><div class="chip" style="font-size:18px">${v.role === 'thief' ? (v.caught ? '✋ Caught.' : '👀 Somewhere on the shop floor…') : v.role === 'distract' ? '👀 ' + esc(CT.PEOPLE[v.who].name) + ' and a "friend"' : v.role === 'sealedc' ? 'Sealed only →' : '← ' + esc(CT.PEOPLE[v.who].name) + ' wants a closer look →'}</div></div>`;
}
const V3_EVENT_TEXT = {
  theft: e => e.from === 'case' ? '🫥 Something is missing from the display case.' : '🫥 Something is gone from the rack.',
  searched: () => '⚖ The Scale Gang left your rack lighter on hits. Some packs are now dead weight.',
  gearOut: () => '⚠ Out of sleeves! New cards are going in unprotected.',
  crate: e => '📦 Delivery! A crate with ' + e.n + ' item' + (e.n === 1 ? '' : 's') + ' is in the back.',
  release: e => '🚀 ' + CT.SET_NAMES[e.set] + ' is out today.',
  reprint: e => '📉 Reprint announced: ' + CT.SET_NAMES[e.set] + '.',
  grateful: () => '💛 Someone you helped is back, with real cards to sell.',
  board: e => '📌 ' + CT.PEOPLE[e.who].name + ' is on your Known Offenders board.',
  distracted: e => e.got ? '🫥 While you were in the back, their friend lifted something off the floor.' : '🫥 Their friend tried the floor while you were in the back.',
  repackHit: () => '🎉 Someone pulled a hit from your repack!',
  repackScam: () => '⚠ Word is your repacks don\'t match their sign.',
  switched: () => null,
};
function v3EventsHTML(evts) { return evts.filter(e => V3_EVENT_TEXT[e.t] && V3_EVENT_TEXT[e.t](e)).map(e => `<div class="chip" style="background:${['crate', 'release', 'grateful', 'board', 'repackHit'].indexOf(e.t) >= 0 ? 'var(--lime)' : 'var(--coral)'}">${esc(V3_EVENT_TEXT[e.t](e))}</div>`).join(''); }
function roomClick(a, el, uid) {
  const G = UI.G, sel = UI.roomSel;
  switch (a) {
    case 'room': UI.room = UI.room ? null : (G.store.crate ? 'back' : 'floor'); UI.roomSel = null; UI.stock = false; return null;
    case 'roomView': UI.room = el.dataset.v; UI.roomSel = null; return null;
    case 'rsel': UI.roomSel = UI.roomSel === uid ? null : uid; UI.rot = 0; return null;
    case 'psel': { const k = el.dataset.game ? 'p:' + el.dataset.game + ':' + el.dataset.f : null; UI.roomSel = UI.roomSel === k ? null : k; return null; }
    case 'cell': { const f = el.dataset.f, x = +el.dataset.x, y = +el.dataset.y;
      if (!sel || sel.indexOf('p:') === 0) { UI.roomSel = null; return null; }
      const r = act({ t: 'place', uid: sel, to: f, x, y, rot: UI.rot }); if (r.ok) UI.roomSel = null; return r; }
    case 'placeTo': { const r = act({ t: 'place', uid: sel, to: el.dataset.to }); if (r.ok) UI.roomSel = null; return r; }
    case 'rotate': { const o = CT.findThing(G, sel); UI.rot = UI.rot ? 0 : 1; if (o && CT.FIX[o.loc] && CT.FIX[o.loc].grid) return act({ t: 'place', uid: sel, to: o.loc, x: o.x, y: o.y, rot: o.rot ? 0 : 1 }); return null; }
    case 'sleeve': return act({ t: 'sleeve', uid: sel, prot: el.dataset.p });
    case 'tagd': { const o = CT.findThing(G, sel); const cur = o.tag || CT.defaultTag(G, o); return act({ t: 'tag', uid: sel, price: Math.max(1, Math.round(cur * (+el.dataset.d > 0 ? 1.1 : 0.9))) }); }
    case 'roomBulk': { const r = act({ t: 'toBulk', uid: sel }); UI.roomSel = null; return r; }
    case 'lockCase': return act({ t: 'lockCase', on: !G.store.locked });
    case 'sign': return act({ t: 'sign', noTouch: !G.store.noTouch });
    case 'retag': { const r = act({ t: 'retag' }); if (r.ok) toast('Tags set to today\'s market +15%'); return r; }
    case 'autoStore': return act({ t: 'autoStore' });
    case 'applyPolicy': { const r = act({ t: 'applyPolicy' }); if (r.ok) toast(r.n ? 'Sleeved ' + r.n + ' card' + (r.n === 1 ? '' : 's') : 'Nothing new to sleeve'); return r; }
    case 'pol': { const k = el.dataset.k, steps = POLICY_STEPS[k], cur = G.store.sleeve[k]; let i = steps.findIndex(s => s >= cur); if (i < 0) i = steps.length - 1;
      i = Math.max(0, Math.min(steps.length - 1, i + +el.dataset.d)); return act({ t: 'sleevePolicy', [k]: steps[i] }); }
    case 'unpack': { const r = act({ t: 'unpack' }); if (r.ok) { sting('rip'); toast('Unpacked ' + r.placed + (r.left ? ' · ' + r.left + ' left (no room)' : '')); } return r; }
    case 'openGood': { const r = act({ t: 'openGood', uid: sel }); if (r.ok) { UI.roomSel = null; sting('rip'); toast(r.packs + ' loose packs' + (r.promos.length ? ' + ' + r.promos.length + ' promo' + (r.promos.length > 1 ? 's' : '') + ' (inbox)' : '')); } return r; }
    case 'openVintage': { const r = act({ t: 'openVintage', uid: sel }); if (r.ok) { UI.roomSel = null; UI.lastPull = r.pulled; sting('rip'); toast(r.hit ? 'A VINTAGE HIT!' : 'No hit this time.'); } return r; }
    case 'weigh': { const r = act({ t: 'weigh', uid: sel }); if (r.ok) toast(r.heavy ? 'HEAVY. Promising.' : 'Light. Probably no hit.'); return r; }
    case 'movePacks': { const r = act({ t: 'movePacks', game: el.dataset.game, n: +el.dataset.n, to: el.dataset.to }); if (r.ok) UI.roomSel = null; return r; }
    case 'rp': { const P = UI.rp, k = el.dataset.k, d = +el.dataset.d; P[k] = Math.max(k === 'n' || k === 'every' || k === 'price' ? 1 : 5, P[k] + d); return null; }
    case 'rpHonest': UI.rp.honest = !UI.rp.honest; return null;
    case 'makeRepacks': { const P = UI.rp; const r = act({ t: 'repack', n: P.n, per: P.per, every: P.every, min: P.min, price: P.price, seed: P.honest ? null : Math.floor(P.n / P.every / 2) }); if (r.ok) toast('Made ' + r.made + ' repacks, ' + r.seeded + ' with hits'); return r; }
    case 'catalog': UI.catalog = !UI.catalog; return null;
    case 'board': UI.board = !UI.board; return null;
    case 'order': { const r = act({ t: 'order', item: el.dataset.item, game: el.dataset.game }); if (r.ok) toast('Ordered: arrives tomorrow morning'); return r; }
    case 'unlock': { const r = act({ t: 'unlock', k: el.dataset.k }); if (r.ok) { toast(CT.UNLOCKS[el.dataset.k].name + ' installed!'); sting('grade'); } return r; }
    case 'watch': return act({ t: 'watch' });
    case 'security': { const r = act({ t: 'security' }); if (r.ok) { toast(r.right ? (r.kid ? 'Security came. The kid is crying. People saw.' : 'Caught! Bounty paid. They\'re on your board.') : r.noProof ? 'No proof. They walked.' : 'Wrong call. They were innocent.'); sting(r.right ? 'deal' : 'walk'); } return r; }
    case 'refuse': return act({ t: 'refuse' });
    case 'inform': return act({ t: 'inform' });
    case 'letGo': return act({ t: 'letGo', parent: !!el.dataset.parent, work: !!el.dataset.work });
    case 'sellBehind': return act({ t: 'sellBehind' });
    case 'inspectPacks': return act({ t: 'inspectPacks' });
    case 'askTag': return act({ t: 'offer', price: +el.dataset.p });
    case 'vOffer': return act({ t: 'offer', price: +el.dataset.p });
    case 'gradeSealed': { const r = act({ t: 'gradeSealed', uid, co: el.dataset.co }); if (r.ok) toast('Sealed sent to ' + CT.GRADERS[el.dataset.co].name); return r; }
  }
  return undefined;
}
// Drag and drop (desktop): drag a thing onto a grid spot or a zone.
function onDragStart(e) { const it = e.target.closest('[draggable][data-uid]'); if (!it) return; UI.drag = it.dataset.uid; e.dataTransfer.setData('text/plain', UI.drag); e.dataTransfer.effectAllowed = 'move'; }
function onDragOver(e) { if (!UI.drag) return; const z = e.target.closest('.cell, [data-drop]'); if (z) { e.preventDefault(); } }
function onDrop(e) {
  if (!UI.drag) return; e.preventDefault();
  const uid = UI.drag; UI.drag = null;
  const cell = e.target.closest('.cell'), zone_ = e.target.closest('[data-drop]');
  const r = cell ? act({ t: 'place', uid, to: cell.dataset.f, x: +cell.dataset.x, y: +cell.dataset.y, rot: UI.rot }) : zone_ ? act({ t: 'place', uid, to: zone_.dataset.drop }) : null;
  UI.roomSel = null; save(); render(); return r;
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
    if (['gearOut', 'searched', 'distracted', 'repackHit', 'repackScam', 'board'].indexOf(ev.t) >= 0 || ev.t === 'theft' && G.phase !== 'morning') { const t = V3_EVENT_TEXT[ev.t] && V3_EVENT_TEXT[ev.t](ev); if (t) toast(t); }
  }
  UI.seenEvents = G.events.length;
  save();
  render();
}
function onInput(e) { if (e.target.id === 'nightn') { UI.nightN = +e.target.value; const n = $('#nightv'); if (n) n.textContent = UI.nightN; } }
function onKey(e) {
  if (UI.screen === 'opening' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const p = $('[data-act=fe-press]'); if (p) p.click(); return; } if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[data-act]')) { e.preventDefault(); e.target.click(); } if (e.key === 'Escape' && (UI.sel || UI.stock || UI.catalog || UI.board)) { UI.sel = null; UI.stock = false; UI.catalog = false; UI.board = false; render(); }
  const k = (e.key || '').toLowerCase(), inGame = UI.screen === 'game' && UI.G && UI.G.store && roomPhase() && !e.target.matches('input');
  if (inGame && k === 'b') { UI.room = UI.room === 'back' ? null : 'back'; UI.roomSel = null; render(); }
  else if (inGame && k === 'f') { UI.room = UI.room === 'floor' ? null : 'floor'; UI.roomSel = null; render(); }
  else if (inGame && k === 'r' && UI.room && UI.roomSel) { roomClick('rotate', { dataset: {} }); save(); render(); } }

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
