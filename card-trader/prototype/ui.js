// Intergalactic Card Trader · UI. Draws G and turns clicks into CT.act intents. No game rules live here.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const IMG = { keyart: 'img/keyart.jpg', shop: 'img/shop.jpg', dock: 'img/dock.jpg', cardnight: 'img/cardnight.jpg', grader: 'img/grader.jpg', dj: 'img/dj.webp' };
const SP_COLOR = { mollu: '#19C8D8', zekk: '#A6F01E', puffi: '#B28CFF' };
const GAME_COLOR = { shell: '#FF8FC7', hive: '#A6F01E', star: '#8B5CF6' };
const UI = { G: null, sel: null, uvView: false, offer: 0, stock: false, nightGame: null, nightN: 3, lastPull: null, seenEvents: 0 };

// ---------- stage scaling: a 1280x720 world letterboxed into any window ----------
function fit() { const s = Math.min(innerWidth / 1288, innerHeight / 728); $('#stage').style.transform = `translate(-50%, -50%) scale(${s})`; }

function newRun() { UI.G = CT.newGame((Date.now() % 1e9) | 0); UI.sel = null; UI.stock = false; UI.lastPull = null; render(); }
function act(intent) {
  const r = CT.act(UI.G, intent);
  if (!r.ok) toast(r.error);
  return r;
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#stage').appendChild(t); setTimeout(() => t.remove(), 1800); }

// ---------- shared bits ----------
const money = n => Math.round(n) + '₵';
function hud() {
  const G = UI.G, D = CT.DAYS[G.dayIdx] || { name: '', visitors: [] };
  const custN = D.visitors.length, at = Math.max(0, G.visitIdx + 1);
  return `<div id="hud">
    <div class="day">DAY ${G.dayIdx + 1}/3 · ${esc(D.name.toUpperCase())}</div>
    ${G.phase === 'shop' || G.phase === 'visit' ? `<div class="stat"><small>Customer</small>${at}/${custN}</div>` : ''}
    <div class="spacer"></div>
    <div class="stat"><small>Cash</small><span class="cash">${money(G.cash)}</span></div>
    ${G.tab ? `<div class="stat"><small>Tab</small><span class="tabv">${money(G.tab)}</span></div>` : ''}
    <div class="stat"><small>Rep</small>${G.rep}</div>
    <div class="stat"><small>Packs</small>${G.packs.shell + G.packs.hive + G.packs.star}</div>
    <button class="btn white" data-act="stock">Stock (${G.stock.length})</button>
    <button class="btn ${MUSIC.on ? 'lime' : 'white'}" data-act="music" aria-pressed="${MUSIC.on}" title="Lane FM beat">♪</button>
  </div>`;
}
function dj(text) {
  return `<div id="dj"><div class="face" style="background-image:url(${IMG.dj})"></div>
    <div><div class="who">DJ VEE · LANE FM</div><div class="txt">${esc(text)}</div></div><div class="onair">ON AIR</div></div>`;
}
function bg(key, dim) { return `<div class="bg" style="background-image:url(${IMG[key]});background-color:#2a1450"></div>${dim ? '<div class="scrim" style="background:rgba(18,10,31,' + dim + ')"></div>' : '<div class="scrim"></div>'}`; }
function portrait(who) {
  const P = CT.PEOPLE[who];
  return `<div class="portrait" style="background:${SP_COLOR[P.species]}">
    <div class="fallback-face">${P.name[0]}</div>
    <div class="pic" style="background-image:url(img/p-${who}.webp)"></div>
    <span class="chip sp">${CT.SPECIES[P.species].name}</span>
    <div class="nameplate">${P.name}</div></div>`;
}
function badgeFor(c) {
  const G = UI.G;
  if (c.know.uv && c.fake) return 'FAKE';
  if (c.graded) return null;
  if (c.know.loupe) return 'G' + CT.trueGrade(c);
  return null;
}
function card(c, o) { o = o || {}; return ART.cardHTML(c, Object.assign({ readable: CT.readable(UI.G, c), badge: badgeFor(c) }, o)); }
function estText(c) {
  const e = CT.estimate(UI.G, c);
  if (e.fake) return '0₵ (fake)';
  const unsure = e.rarity == null || e.grade == null;
  return (unsure ? '~' : '') + money(e.value) + (unsure ? '?' : '');
}

// ---------- coach: one hint at a time, tied to what's on the counter ----------
function hint() {
  const G = UI.G, v = G.visit;
  if (G.say && G.say.who === 'vee' && (G.phase === 'morning' || G.phase === 'close' || G.phase === 'cardnight' || G.phase === 'end')) return G.say.text;
  if (G.phase === 'shop') {
    if (G.visitIdx < 0) return G.say && G.say.who === 'vee' ? G.say.text : 'Doors are open. Tap NEXT CUSTOMER.';
    return 'Breather! Rip a pack from the back room, check your Stock, or bring in the next customer.';
  }
  if (G.phase !== 'visit' || !v) return '';
  const looked = v.cards.some(c => c.know.loupe || c.know.uv || c.know.read);
  if (v.role === 'sell' || v.role === 'lot' || v.role === 'bulk') {
    if (!looked) return v.role === 'lot' ? 'A whole binder page for one price! Tap cards to inspect. Unreadable scripts hide the big finds, and there\'s often a fake: try the UV lamp.' : 'Tap a card to put it under the Loupe. Each tool costs the customer 1 patience, so pick what matters.';
    if (v.cards.some(c => c.know.loupe && !c.flawUsed && Math.min(c.cen, c.edg, c.sur) <= 6)) return 'You found a flaw! POINT OUT FLAW knocks their price down.';
    return v.species === 'mollu' ? 'Mollu love round numbers: offers ending in 0 make them come down faster.' : v.species === 'zekk' ? 'Zekk split the difference fast but walk fast too.' : 'Puffi care about condition above all. A flaw hits them hard.';
  }
  if (v.role === 'sealed') return v.showing ? 'Name your price for the packs, or take their bid.' : 'They want sealed packs. SHOW PACKS to hear an offer.';
  if (!v.showing) return 'They want ' + CT.wantsText(v.wants) + '. Pick a card from your stock on the right. Today\'s demand and the hot list raise what buyers pay.';
  return 'Name your price. Push too far past what it\'s worth and they\'ll get insulted.';
}

// ---------- screens ----------
function render() {
  const G = UI.G, st = $('#stage');
  let html = '';
  if (G.phase === 'title') html = titleScreen();
  else if (G.phase === 'morning') html = morningScreen();
  else if (G.phase === 'shop' || G.phase === 'visit') html = shopScreen();
  else if (G.phase === 'close') html = closeScreen();
  else if (G.phase === 'cardnight') html = nightScreen();
  else if (G.phase === 'end') html = endScreen();
  if (UI.stock) html += stockDrawer();
  if (UI.sel) html += loupeScreen();
  st.innerHTML = html;
  const sl = $('#offer'); if (sl) sl.addEventListener('input', e => { UI.offer = +e.target.value; const o = $('#offerv'); if (o) o.textContent = money(UI.offer); const b = $('[data-act=offer]'); if (b) b.textContent = (G.visit && (G.visit.showing) ? 'ASK ' : 'OFFER ') + money(UI.offer); });
}

function titleScreen() {
  return `${bg('keyart', .25)}
  <div class="sheet" style="left:60px;top:70px;width:640px">
    <div class="title-logo">INTERGALACTIC<br>CARD TRADER<span>happy space Akihabara</span></div>
  </div>
  <div class="panel tilt-r" style="left:70px;top:390px;width:520px;padding:16px 18px">
    <div class="h" style="font-size:20px;margin-bottom:8px">STALL 7 · CROSSLANE MARKET</div>
    <div style="font-size:16px;line-height:1.4">Three station days. Aliens from three worlds bring cards you can't read.
      Inspect them under the <b>Loupe</b>, <b>haggle</b>, catch the <b>fakes</b>, send gems to the <b>graders</b>,
      and ride the <b>trade lanes</b>.</div>
    <div class="row" style="margin-top:14px"><button class="btn big pink" data-act="start">OPEN STALL 7 ▶</button></div>
    <div class="muted" style="font-size:12px;margin-top:8px">v1 prototype · desktop landscape · ♪ beat starts with your first tap</div>
  </div>`;
}

function demandBars(demand) {
  return `<div class="bars">${Object.keys(CT.GAMES).map(g => { const d = demand[g]; return `<div class="bar"><span>${CT.GAMES[g].name}</span><div class="track"><div class="fill" style="width:${Math.min(100, d / 1.8 * 100)}%;background:${GAME_COLOR[g]}"></div></div><span>×${d.toFixed(2)}</span></div>`; }).join('')}</div>`;
}
function eventsHTML(evts) {
  const G = UI.G, out = [];
  for (const e of evts) {
    if (e.t === 'grade') {
      const c = G.stock.find(x => x.uid === e.uid); if (!c) continue;
      out.push(`<div style="display:flex;flex-direction:column;align-items:center;gap:4px">${card(c, { size: 'sm' })}<div class="stamp" style="font-size:${e.fake ? 30 : 46}px">${e.fake ? 'FAKE!' : e.grade}</div><div class="chip">${CT.GRADERS[e.co].name}</div></div>`);
    } else if (e.t === 'complaint') out.push(`<div class="chip" style="background:var(--coral)">${esc(e.who)} found a fake: refunded ${money(e.price)}, rep −8</div>`);
  }
  return out.join('');
}
function morningScreen() {
  const G = UI.G, D = CT.DAYS[G.dayIdx];
  const ships = D.ships.map(s => `<span class="chip" style="background:${SP_COLOR[s]}">${CT.SPECIES[s].name} ships</span>`).join(' ');
  const hot = G.hotList.map(t => { const tm = CT.tmpl(t); return `<div class="chip" style="background:${GAME_COLOR[tm.game]}">🔥 ${esc(tm.name)} <small>(${CT.GAMES[tm.game].name})</small></div>`; }).join('');
  const ev = eventsHTML(G.events);
  return `${hud()}${bg('dock', .2)}
  <div class="panel tilt-l" style="left:40px;top:86px;width:560px;padding:16px">
    <div class="h" style="font-size:28px">MORNING · ${esc(D.name.toUpperCase())}</div>
    <div style="margin:10px 0">${ships}</div>
    <div class="h" style="font-size:14px;margin:6px 0">TODAY'S DEMAND</div>${demandBars(G.demand)}
    <div class="h" style="font-size:14px;margin:12px 0 6px">HOT LIST · +50%</div><div class="row">${hot}</div>
    <div style="margin-top:8px;font-size:13px">Rent due at close: <b>${money(D.rent)}</b>${D.cardNight ? ' · <b>Card Night</b> after close' : ''}</div>
  </div>
  ${ev ? `<div class="panel tilt-r" style="left:640px;top:96px;width:600px;padding:14px"><div class="h" style="font-size:22px">THE GRADERS SENT BACK…</div><div class="row" style="margin-top:10px;gap:18px">${ev}</div></div>` : ''}
  <div class="sheet" style="right:40px;bottom:96px"><button class="btn big pink" data-act="open">OPEN SHOP ▶</button></div>
  ${dj(hint())}`;
}

function shopScreen() {
  const G = UI.G, v = G.visit;
  let html = `${hud()}${bg('shop')}`;
  if (!v) {
    const D = CT.DAYS[G.dayIdx], left = D.visitors.length - (G.visitIdx + 1);
    html += `<div id="idle">
      <button class="btn big pink pop" data-act="next">${left ? 'NEXT CUSTOMER ▶' : 'CLOSE UP SHOP ▶'}</button>
      <div class="chip">${left} customer${left === 1 ? '' : 's'} left today</div></div>
      <div class="panel tilt-l" style="left:16px;top:96px;width:330px;padding:14px">
        <div class="h" style="font-size:18px">BACK ROOM</div>
        <div style="font-size:14px;margin:6px 0 10px">Rip a pack: 5 cards, one rare slot that can hit a holo or a grail. Or keep them sealed for pack buyers.</div>
        ${Object.keys(CT.GAMES).map(g => `<div class="row" style="align-items:center;margin-bottom:6px"><span class="chip" style="background:${GAME_COLOR[g]};flex:1">${CT.GAMES[g].name} × ${G.packs[g]}</span><button class="btn sm" data-act="crack" data-game="${g}" ${G.packs[g] ? '' : 'disabled'}>RIP</button></div>`).join('')}
        <div style="font-size:13px;margin-top:8px">Bulk bin: <b>${G.bulk}</b> commons (sells 1₵ each)</div>
      </div>
      ${UI.lastPull ? `<div class="panel tilt-r" style="right:16px;top:96px;width:350px;padding:12px"><div class="h" style="font-size:18px">FRESH PULL!</div><div class="row" style="margin-top:8px;justify-content:center">${UI.lastPull.map((c, i) => `<div class="flipin" style="animation-delay:${i * 0.12}s">${card(c, { size: 'xs', act: 'loupe' })}</div>`).join('')}</div></div>` : ''}`;
    return html + dj(hint());
  }
  const P = CT.PEOPLE[v.who], youBuy = v.role === 'sell' || v.role === 'lot' || v.role === 'bulk';
  const pips = Array.from({ length: v.maxPatience }, (_, i) => `<span class="pip ${i < v.patience ? '' : 'off'}"></span>`).join('');
  const bubble = G.say && G.say.who === v.who ? G.say.text : '…';
  html += `<div id="cust" class="panel tilt-l">${portrait(v.who)}
    <div class="pips">Patience ${pips}</div>
    <div class="bubble">${esc(bubble)}</div>
    ${v.wants ? `<div class="wants">Wants: ${esc(CT.wantsText(v.wants))}</div>` : ''}
    <div class="muted" style="font-size:12px">${esc(P.line)}</div></div>`;
  // mat
  if (youBuy) html += `<div id="mat" class="${v.cards.length > 3 ? 'lot' : ''}">${v.cards.map(c => card(c, { size: v.cards.length > 3 ? 'sm' : 'md', act: 'loupe' })).join('')}</div>`;
  else if (v.showing === 'packs') html += `<div id="mat">${Array.from({ length: v.packs }, (_, i) => `<div class="card sm pop" style="--fr:linear-gradient(160deg,#FF2E93,#6A2BD9);animation-delay:${i * .06}s"><div class="inner" style="display:grid;place-items:center;color:#fff;font-family:var(--display);font-size:16px;background:repeating-linear-gradient(45deg,#6A2BD9 0 8px,#FF2E93 8px 16px)">PACK</div></div>`).join('')}</div>`;
  else if (v.showing) { const c = G.stock.find(x => x.uid === v.showing); html += `<div id="mat">${c ? card(c, { act: 'loupe' }) : ''}</div>`; }
  else html += `<div id="mat"><div class="chip" style="font-size:18px">← ${esc(P.name)} is browsing. Pick a card on the right →</div></div>`;
  html += `<div id="deal" class="panel tilt-r">${youBuy ? dealBuyHTML(v) : dealSellHTML(v)}</div>`;
  return html + dj(hint());
}
function dealBuyHTML(v) {
  const G = UI.G;
  let est = 0, unsure = false; for (const c of v.cards) { const e = CT.estimate(G, c); est += e.value; if (!e.fake && (e.rarity == null || e.grade == null)) unsure = true; }
  const max = Math.max(10, Math.round(Math.max(v.ask, est) * 1.1));
  if (!UI.offer || UI.offer > max || UI._for !== v) { UI.offer = Math.max(1, Math.round(v.ask * 0.6 / (v.species === 'mollu' ? 10 : 1)) * (v.species === 'mollu' ? 10 : 1)); UI._for = v; }
  const flawable = v.cards.some(c => c.know.loupe && !c.flawUsed && (Math.min(c.cen, c.edg, c.sur) <= 6 || (c.know.uv && c.fake)));
  return `<div class="h" style="font-size:20px">${v.role === 'lot' ? 'BINDER LOT' : v.role === 'bulk' ? 'SHOEBOX' : 'THEY\'RE SELLING'} · ${v.cards.length} CARD${v.cards.length > 1 ? 'S' : ''}</div>
    <div class="price-row"><span>Their price</span><span class="big">${money(v.ask)}</span></div>
    <div class="est">Your read: <b>${unsure ? '~' : ''}${money(est)}${unsure ? '?' : ''}</b> at today's demand${unsure ? ' (inspect to be sure)' : ''}. You have ${money(G.cash)}.</div>
    <div class="offer-val" id="offerv">${money(UI.offer)}</div>
    <input id="offer" class="slider" type="range" min="1" max="${max}" step="1" value="${UI.offer}" aria-label="Your offer">
    <div class="row"><button class="btn pink" data-act="offer">OFFER ${money(UI.offer)}</button></div>
    <div class="row"><button class="btn lime" data-act="accept" ${G.cash >= v.ask ? '' : 'disabled'}>PAY ${money(v.ask)}</button><button class="btn cyan" data-act="flaw" ${flawable ? '' : 'disabled'}>POINT OUT FLAW</button></div>
    <div class="row"><button class="btn white" data-act="pass">PASS</button></div>
    <div class="muted" style="font-size:12px">Tap a card for the Loupe. Each tool costs 1 patience; each offer costs 1.</div>`;
}
function dealSellHTML(v) {
  const G = UI.G;
  if (!v.showing) {
    if (v.role === 'sealed') {
      const have = G.packs.shell + G.packs.hive + G.packs.star;
      return `<div class="h" style="font-size:20px">SEALED PACKS</div><div>You have <b>${have}</b> packs. They want ${v.packs}.</div>
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
    <div class="est">Your read: <b>${c ? estText(c) : money(est)}</b>${c ? ' (today\'s demand' + (G.hotList.indexOf(c.t) >= 0 ? ', HOT' : '') + ')' : ' at retail'}${c && c.cost ? ` · you paid ${money(c.cost)}` : ''}</div>
    <div class="offer-val" id="offerv">${money(UI.offer)}</div>
    <input id="offer" class="slider" type="range" min="1" max="${max}" step="1" value="${Math.min(UI.offer, max)}" aria-label="Your asking price">
    <div class="row"><button class="btn pink" data-act="offer">ASK ${money(UI.offer)}</button></div>
    <div class="row"><button class="btn lime" data-act="accept">TAKE ${money(v.bid)}</button><button class="btn white" data-act="pass">NO DEAL</button></div>`;
}

function loupeScreen() {
  const G = UI.G, c = G.stock.find(x => x.uid === UI.sel) || (G.visit && G.visit.cards.find(x => x.uid === UI.sel));
  if (!c) { UI.sel = null; return ''; }
  const atCounter = !!(G.visit && G.visit.cards.indexOf(c) >= 0), tm = CT.tmpl(c.t), rd = CT.readable(G, c), e = CT.estimate(G, c);
  const cost = atCounter ? ' · 1 patience' : '';
  const [cl, cr] = CT.centerRatio(c);
  const flawy = c.know.loupe && Math.min(c.cen, c.edg, c.sur) <= 6;
  return `<div id="loupe">
    <div class="side">
      <div class="h" style="font-size:30px;color:var(--sun)">THE LOUPE</div>
      <div class="tools">
        <button class="btn ${c.know.loupe ? 'lime' : ''}" data-act="tool" data-tool="loupe">🔍 CONDITION${c.know.loupe ? ' ✓' : cost}</button>
        <button class="btn ${c.know.uv ? 'lime' : ''}" data-act="tool" data-tool="uv">🟣 UV LAMP${c.know.uv ? ' ✓' : cost}</button>
        <button class="btn ${rd ? 'lime' : ''}" data-act="tool" data-tool="read" ${rd ? 'disabled' : ''}>🔤 DECODE${rd ? ' ✓' : cost}</button>
        <button class="btn cyan" data-act="tool" data-tool="translate" ${rd ? 'disabled' : ''}>TRANSLATOR ${CT.TRANSLATE_FEE}₵</button>
      </div>
      <div class="read"><dl>
        <dt>Card</dt><dd>${rd ? esc(tm.name) + ' · ' + CT.RARITY_NAME[tm.rarity] : '??? <span class="muted">(' + CT.GAMES[tm.game].script + ' script)</span>'}</dd>
        <dt>Game</dt><dd>${CT.GAMES[tm.game].name}</dd>
        <dt>Centering</dt><dd>${c.know.loupe ? cl + '/' + cr + ' (' + c.cen + ')' : '?'}</dd>
        <dt>Edges</dt><dd>${c.know.loupe ? c.edg + '/10' : '?'}</dd>
        <dt>Surface</dt><dd>${c.know.loupe ? c.sur + '/10' + (c.fake === 'stock' ? ' · <b style="color:#c41d1d">wrong card stock!</b>' : '') : '?'}</dd>
        <dt>Grade</dt><dd>${c.graded ? CT.GRADERS[c.graded.co].name + ' ' + c.graded.grade : e.grade != null ? '~' + e.grade : '?'}</dd>
        <dt>UV</dt><dd>${c.know.uv ? (c.fake ? '<b style="color:#c41d1d">FAKE: ' + (c.fake === 'uv' ? 'no watermark' : 'wrong world\'s mark') + '</b>' : 'Genuine watermark') : '?'}</dd>
        <dt>Worth</dt><dd><b>${estText(c)}</b> today</dd>
      </dl></div>
      ${!rd && G.fluency[tm.game] < CT.FLUENT_AT ? `<div style="font-size:13px">Decode ${CT.FLUENT_AT - G.fluency[tm.game]} more ${CT.GAMES[tm.game].name} cards and you'll read the script for free.</div>` : ''}
      <div class="row">
        ${atCounter && flawy && !c.flawUsed ? '<button class="btn cyan" data-act="flaw" data-uid="' + c.uid + '">POINT OUT FLAW</button>' : ''}
        ${!atCounter && (G.phase === 'shop' || G.phase === 'close') && !c.graded ? '<button class="btn white" data-act="toBulk">TOSS TO BULK</button>' : ''}
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
    ${groups.map(g => { const cs = G.stock.filter(c => CT.tmpl(c.t).game === g); return cs.length ? `<div class="h" style="color:#fff;font-size:16px;margin:8px 0">${CT.GAMES[g].name} · demand ×${CT.demandOf(G, g).toFixed(2)}</div><div class="row">${cs.map(c => `<div style="text-align:center;color:#fff">${card(c, { size: 'xs', act: 'loupe' })}<div style="font-size:12px;font-weight:800">${estText(c)}</div></div>`).join('')}</div>` : ''; }).join('')}
  </div>`;
}

function closeScreen() {
  const G = UI.G, D = CT.DAYS[G.dayIdx], next = CT.DAYS[G.dayIdx + 1];
  const rows = G.ledger.filter(l => l.day === G.dayIdx);
  const gradeable = G.stock.filter(c => !c.graded && !(c.know.uv && c.fake)).sort((a, b) => CT.estimate(G, b).value - CT.estimate(G, a).value).slice(0, 12);
  return `${hud()}${bg('shop', .6)}
  <div class="panel tilt-l" style="left:20px;top:76px;width:380px;height:520px;padding:14px;overflow:auto">
    <div class="h" style="font-size:24px">TODAY'S LEDGER</div>
    <table class="ledger">${rows.map(r => `<tr><td>${esc(r.label)}</td><td class="${r.amt >= 0 ? 'pos' : 'neg'}">${r.amt >= 0 ? '+' : ''}${r.amt}</td></tr>`).join('') || '<tr><td>No deals today</td><td></td></tr>'}</table>
    <div class="price-row" style="margin-top:10px"><span>Rent due</span><span class="big neg">${money(D.rent)}</span></div>
    <div style="font-size:13px">${G.cash < D.rent ? 'Short on rent: the rest goes on a tab, and the tab comes off your final score.' : 'Rent is paid when you end the day.'}</div>
  </div>
  <div class="panel" style="left:416px;top:76px;width:470px;height:520px;padding:14px;overflow:auto">
    <div class="h" style="font-size:24px">SEND TO A GRADER</div>
    <div style="font-size:13px;margin:4px 0 8px"><b>QuikSlab</b> ${CT.GRADERS.quik.fee}₵, back tomorrow, ±1 grade. <b>Halo Bureau</b> ${CT.GRADERS.halo.fee}₵, back in 2 days, exact, pays the most. A slab only pays off at grade 9 or 10.${!next ? ' <b>Tonight is Grade Day: everything comes home.</b>' : ''}</div>
    <div class="stocklist">${gradeable.map(c => `<div style="text-align:center">${card(c, { size: 'xs', act: 'loupe' })}<div style="font-size:12px;font-weight:800">${estText(c)}</div>
      <div class="row" style="gap:4px;margin-top:4px"><button class="btn sm cyan" data-act="grade" data-co="quik" data-uid="${c.uid}" style="padding:2px 6px">QUIK</button><button class="btn sm" data-act="grade" data-co="halo" data-uid="${c.uid}" style="padding:2px 6px">HALO</button></div></div>`).join('')}</div>
    ${G.grading.length ? `<div style="margin-top:10px;font-size:13px">At the graders: ${G.grading.map(p => (CT.readable(G, p.card) ? CT.tmpl(p.card.t).name : 'a card') + ' (' + CT.GRADERS[p.co].name + ')').join(', ')}</div>` : ''}
  </div>
  <div class="panel tilt-r" style="right:20px;top:76px;width:360px;height:520px;padding:14px">
    <div class="h" style="font-size:24px">${next ? 'TOMORROW: ' + esc(next.name.toUpperCase()) : 'LAST NIGHT'}</div>
    ${next ? demandBars(next.demand) + `<div class="h" style="font-size:16px;margin:12px 0 6px">RESTOCK · box of ${CT.BOX.packs} for ${CT.BOX.cost}₵</div>
      ${Object.keys(CT.GAMES).map(g => `<div class="row" style="align-items:center;margin-bottom:6px"><span class="chip" style="background:${GAME_COLOR[g]};flex:1">${CT.GAMES[g].name} · have ${G.packs[g]}</span><button class="btn sm" data-act="restock" data-game="${g}" ${G.cash >= CT.BOX.cost ? '' : 'disabled'}>BUY BOX</button></div>`).join('')}` : '<div style="margin:10px 0">No tomorrow: sell-off is over. Grade anything worth slabbing, then end the night.'}
    <div style="margin-top:auto;position:absolute;left:14px;right:14px;bottom:14px"><button class="btn big pink" style="width:100%" data-act="endDay">${next ? (D.cardNight ? 'PAY RENT → CARD NIGHT' : 'PAY RENT · END DAY') : 'PAY RENT → GRADE DAY'}</button></div>
  </div>
  ${dj(hint())}`;
}

function nightScreen() {
  const G = UI.G, done = G.events.find(e => e.t === 'cardNight');
  const g = UI.nightGame || Object.keys(G.packs).sort((a, b) => G.packs[b] - G.packs[a])[0];
  UI.nightGame = g; const maxN = Math.min(6, G.packs[g]); UI.nightN = Math.min(UI.nightN, maxN);
  let body;
  if (!done) body = `<div class="h" style="font-size:20px">FEATURE A GAME</div>
    <div class="row" style="margin:8px 0">${Object.keys(CT.GAMES).map(k => `<button class="btn ${k === g ? 'pink' : 'white'}" data-act="nightGame" data-game="${k}">${CT.GAMES[k].name} (${G.packs[k]})</button>`).join('')}</div>
    <div>Rip <b id="nightv">${UI.nightN}</b> pack${UI.nightN === 1 ? '' : 's'} live on Floss's stream. Every holo or grail you pull adds hype: tomorrow's demand for ${CT.GAMES[g].name} goes up. The crowd buys a few packs and your rep rises.</div>
    <input id="nightn" class="slider" type="range" min="0" max="${maxN}" value="${UI.nightN}" aria-label="Packs to rip">
    <div class="row"><button class="btn big pink" data-act="rip">RIP LIVE!</button></div>`;
  else {
    const pulls = done.uids.map(u => G.stock.find(c => c.uid === u)).filter(Boolean);
    body = `<div class="h" style="font-size:26px">${done.grail ? 'A GRAIL ON STREAM!!' : done.holo ? 'HOLO HYPE!' : 'WHAT A NIGHT'}</div>
      <div class="row" style="margin:10px 0;max-height:300px;overflow:auto">${pulls.map((c, i) => `<div class="flipin" style="animation-delay:${i * .06}s">${card(c, { size: 'xs', act: 'loupe' })}</div>`).join('')}</div>
      <div>${CT.GAMES[done.game].name} hype <b>+${Math.round(done.hype * 100)}%</b> tomorrow · crowd bought ${done.sold} packs · rep +6</div>
      <div class="row" style="margin-top:12px"><button class="btn big pink" data-act="nextMorning">NEXT MORNING ▶</button></div>`;
  }
  return `${hud()}${bg('cardnight', .25)}<div class="panel tilt-r" style="left:200px;top:110px;width:880px;padding:18px">${body}</div>${dj(hint())}`;
}

function endScreen() {
  const G = UI.G, F = G.final, S = G.stats;
  const best = S.bestFlip ? `${CT.tmpl(S.bestFlip.t).name}: +${S.bestFlip.flip}₵` : '—';
  const bg_ = S.bestGrade ? `${CT.tmpl(S.bestGrade.t).name}: ${CT.GRADERS[S.bestGrade.co].name} ${S.bestGrade.grade}` : '—';
  const ev = eventsHTML(G.events);
  return `${hud()}${bg('grader', .3)}
  ${ev ? `<div class="panel tilt-l" style="left:30px;top:80px;width:600px;padding:14px"><div class="h" style="font-size:24px">GRADE DAY</div><div class="row" style="margin-top:10px;gap:18px">${ev}</div></div>` : ''}
  <div class="panel tilt-r" style="right:40px;top:90px;width:560px;padding:18px">
    <div class="h" style="font-size:30px">THREE DAYS ON THE STRIP</div>
    <div class="stamp" style="font-size:44px;margin:14px 0">${esc(F.rank.toUpperCase())}</div>
    <div class="price-row"><span>Shop value</span><span class="big">${money(F.value)}</span></div>
    <div class="price-row"><span>You started with</span><span>${money(F.start)}</span></div>
    <div class="price-row"><span>Change</span><span class="${F.gain >= 0 ? 'pos' : 'neg'}" style="font-family:var(--display);font-size:22px">${F.gain >= 0 ? '+' : ''}${F.gain}₵</span></div>
    <table class="ledger" style="margin-top:10px">
      <tr><td>Best flip</td><td>${esc(best)}</td></tr><tr><td>Best grade</td><td>${esc(bg_)}</td></tr>
      <tr><td>Fakes caught</td><td>${S.fakesCaught}</td></tr><tr><td>Fakes sold</td><td>${S.fakesSold}</td></tr>
      <tr><td>Deals</td><td>${S.deals}</td></tr><tr><td>Packs ripped</td><td>${S.cracked}</td></tr>${F.tab ? `<tr><td>Unpaid tab</td><td class="neg">−${F.tab}</td></tr>` : ''}
    </table>
    <div class="row" style="margin-top:14px"><button class="btn big pink" data-act="again">PLAY AGAIN</button></div>
  </div>${dj(hint())}`;
}

// ---------- input ----------
function onClick(e) {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (!MUSIC.on && !UI.muted) MUSIC.start();
  const a = el.dataset.act, G = UI.G, v = G.visit, uid = el.dataset.uid || el.closest('[data-uid]') && el.closest('[data-uid]').dataset.uid;
  let r = null;
  switch (a) {
    case 'start': r = act({ t: 'start' }); break;
    case 'open': r = act({ t: 'open' }); break;
    case 'next': UI.lastPull = null; r = act({ t: 'next' }); UI.offer = 0; break;
    case 'loupe': UI.sel = uid; UI.uvView = false; UI.stock = false; break;
    case 'closeLoupe': UI.sel = null; break;
    case 'uvview': UI.uvView = !UI.uvView; break;
    case 'tool': { const t = el.dataset.tool; r = act({ t: 'inspect', uid: UI.sel, tool: t }); if (t === 'uv' && r.ok) UI.uvView = true;
      const c = G.stock.find(x => x.uid === UI.sel) || (v && v.cards.find(x => x.uid === UI.sel)); if (t === 'uv' && c && c.fake) MUSIC.sting('fake');
      if (!G.visit && v) UI.sel = null; break; }
    case 'flaw': { const target = el.dataset.uid || (v && (v.cards.find(c => c.know.loupe && !c.flawUsed && (Math.min(c.cen, c.edg, c.sur) <= 6 || (c.know.uv && c.fake))) || {}).uid); r = act({ t: 'flaw', uid: target }); UI.sel = null; break; }
    case 'offer': r = act({ t: 'offer', price: UI.offer }); break;
    case 'accept': r = act({ t: 'accept' }); break;
    case 'pass': r = act({ t: 'pass' }); break;
    case 'show': r = act({ t: 'show', uid }); UI.offer = 0; break;
    case 'showPacks': r = act({ t: 'showPacks' }); UI.offer = 0; break;
    case 'crack': r = act({ t: 'crack', game: el.dataset.game }); if (r.ok) { UI.lastPull = r.pulled; MUSIC.sting('rip'); } break;
    case 'toBulk': r = act({ t: 'toBulk', uid: UI.sel }); UI.sel = null; break;
    case 'grade': r = act({ t: 'grade', uid, co: el.dataset.co }); if (r.ok) toast('Sent to ' + CT.GRADERS[el.dataset.co].name); break;
    case 'restock': r = act({ t: 'restock', game: el.dataset.game }); if (r.ok) toast('+' + CT.BOX.packs + ' ' + CT.GAMES[el.dataset.game].name + ' packs'); break;
    case 'endDay': r = act({ t: 'endDay' }); if (G.phase === 'end') MUSIC.sting('grade'); break;
    case 'nightGame': UI.nightGame = el.dataset.game; UI.nightN = Math.min(3, G.packs[el.dataset.game]); break;
    case 'rip': r = act({ t: 'cardNight', game: UI.nightGame, n: UI.nightN }); MUSIC.sting('rip'); break;
    case 'nextMorning': r = act({ t: 'nextMorning' }); UI.nightGame = null; break;
    case 'stock': UI.stock = !UI.stock; UI.sel = null; break;
    case 'music': if (MUSIC.on) { MUSIC.stop(); UI.muted = true; } else { MUSIC.start(); UI.muted = false; } break;
    case 'again': newRun(); return;
  }
  if (v && !G.visit && G.lastVisit === v) { MUSIC.sting(v.result === 'deal' ? 'deal' : 'walk'); UI.sel = null; }
  for (const ev of G.events.slice(UI.seenEvents)) { if (ev.t === 'fluent') toast('You can read ' + CT.GAMES[ev.game].name + ' now!'); if (ev.t === 'fakeFound') toast('FAKE spotted!'); }
  UI.seenEvents = G.events.length;
  render();
}
function onInput(e) { if (e.target.id === 'nightn') { UI.nightN = +e.target.value; const n = $('#nightv'); if (n) n.textContent = UI.nightN; } }
function onKey(e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[data-act]')) { e.preventDefault(); e.target.click(); } if (e.key === 'Escape' && (UI.sel || UI.stock)) { UI.sel = null; UI.stock = false; render(); } }

// Mark card sheets that haven't been made yet, so cards fall back to a drawn emblem.
function probeArt() { for (const g of Object.keys(CT.GAMES)) { const im = new Image(); im.onerror = () => document.body.classList.add('noart-' + g); im.src = 'img/cards-' + g + '.jpg'; } }
function boot() {
  probeArt(); fit(); addEventListener('resize', fit);
  const st = $('#stage'); st.addEventListener('click', onClick); st.addEventListener('input', onInput); st.addEventListener('keydown', onKey);
  newRun();
}
root.CTUI = UI; root.CTUI.render = render; root.CTUI.newRun = newRun;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(this);
