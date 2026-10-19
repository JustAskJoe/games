(function () {
  const TB = window.TB;
  const root = document.getElementById('story');
  const num = TB.num, N = 27, E = 28, W = 29, S = 30, MIMIC = TB.MIMIC, BL = TB.BLOSSOM;
  const Em = (n) => num(0, n), Ti = (n) => num(1, n), Gr = (n) => num(2, n);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CRIT = [['mole', 'kiln', 'wyrm'], ['reed', 'koi', 'deluge'], ['moss', 'badger', 'elder']];
  const WINDC = ['owl', 'hare', 'fox', 'finch'];

  function parts(t) {
    if (t < 27) { const s = Math.floor(t / 9); return { cls: ['ember', 'tide', 'grove'][s], n: t % 9 + 1, g: CRIT[s][Math.floor((t % 9) / 3)] }; }
    if (t < 31) return { cls: 'wind', n: 'NEWS'[t - 27], g: WINDC[t - 27] };
    if (t < 34) return { cls: ['crimson', 'pale', 'verdant'][t - 31], n: 'CPV'[t - 31], g: 'drake' };
    if (t === BL) return { cls: 'blossom', n: '✿', g: 'bloom' };
    return { cls: 'mimic', n: '?', g: 'mimic' };
  }
  function tile(t, extra, tag, attrs) {
    const p = parts(t); const el = tag || 'span';
    return `<${el} class="tile ${p.cls} ${extra || ''}" aria-label="${TB.tileName(t)}" title="${TB.tileName(t)}" ${attrs || ''}><b class="n">${p.n}</b><i class="g">${p.g}</i></${el}>`;
  }

  // ---------------- Intro ----------------
  const SCENES = [
    { html: `<img class="art" src="img/parlor.jpg" alt="An illustrated mahjong parlor at night, four friends at a table under a crescent moon window"><div class="shade"></div>
      <div class="copy"><span class="eyebrow rise">One Fifty Labs presents</span><h1 class="title rise d1">Tilebound</h1><p class="rise d2">A cozy mahjong adventure.</p><span class="eyebrow rise d3" style="color:#CBBDC8;letter-spacing:1.5px">© 2026 F Lane d/b/a One Fifty Labs · All rights reserved</span></div>` },
    { html: `<img class="art" src="img/tiles.jpg" alt="Three ivory mahjong tiles painted with a mole, a frog and a mouse"><div class="shade"></div>
      <div class="copy"><span class="eyebrow rise">Tessera Isle</span><h2 class="rise d1">Here, every mahjong tile is a critter.</h2><p class="rise d2">Collect them, play them, and watch them grow from plain ivory to carved, jade and gilded.</p></div>` },
    { html: `<div class="trio"><figure><img src="img/ember.jpg" alt="Ember critters by a stove"><figcaption>Ember</figcaption></figure><figure><img src="img/tide.jpg" alt="Tide critters at a moonlit pond"><figcaption>Tide</figcaption></figure><figure><img src="img/grove.jpg" alt="Grove critters in a greenhouse"><figcaption>Grove</figcaption></figure></div><div class="shade"></div>
      <div class="copy"><span class="eyebrow rise">Three suits, three families</span><h2 class="rise d1">Pick a starter. Grow your collection.</h2><p class="rise d2">The numbers 1 to 9 are each critter growing up.</p></div>` },
    { html: `<img class="art" src="img/island.jpg" alt="An illustrated map of a small island with four towns"><div class="shade"></div>
      <div class="copy"><span class="eyebrow rise">Four towns, four parlor masters</span><h2 class="rise d1">Beat the masters. Come home to Mahj Night.</h2><p class="rise d2">Every town has its own House Card of hands to learn.</p></div>`, last: true },
  ];
  let scene = 0;
  function showIntro(i) {
    scene = i; root.hidden = false;
    root.innerHTML = SCENES.map((s, k) => `<section class="scene${k === i ? ' on' : ''}" aria-hidden="${k !== i}">${s.html}</section>`).join('') +
      `<div class="story-nav"><button class="skip" type="button" data-s="skip">Skip intro</button>
       <div class="dots">${SCENES.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div>
       <button class="btn primary" type="button" data-s="next">${SCENES[i].last ? 'Let’s play →' : 'Next →'}</button></div>`;
  }
  function goScene(i) {
    root.querySelectorAll('.scene').forEach((el, k) => { el.classList.toggle('on', k === i); el.setAttribute('aria-hidden', String(k !== i)); });
    scene = i;
    root.querySelectorAll('.dots span').forEach((d, k) => d.classList.toggle('on', k === i));
    root.querySelector('.story-nav .btn').textContent = SCENES[i].last ? 'Let’s play →' : 'Next →';
  }

  // ---------------- Doors ----------------
  function doors() {
    root.hidden = false;
    root.innerHTML = `<div class="screen"><div class="screen-in">
      <div style="display:flex;gap:14px;align-items:center"><img src="img/bev.jpg" alt="Bev" style="width:72px;height:72px;border-radius:50%;object-fit:cover;object-position:50% 15%;border:3px solid var(--gold)"><div><h2>“Hi, I’m Bev. How do you want to play?”</h2><p class="lead">I run the Tile &amp; Teacup club. Pick a door; you can change your mind from the menu any time.</p></div></div>
      <div class="doors">
        <button class="door" type="button" data-s="learn"><span class="tag">New to mahjong</span><b>Learn with Bev</b><span>Five tiny lessons, about three minutes, then I sit with you at the table and tell you every tap.</span></button>
        <button class="door" type="button" data-s="tilebound"><span class="tag">I’ve played</span><b>Tilebound table</b><span>Pick a starter critter and play with abilities. Helpers on, coach off.</span></button>
        <button class="door" type="button" data-s="classic"><span class="tag">Club players</span><b>Classic table</b><span>Just the rules: Charleston, jokers, the card. No critters, no helpers. Judge whether it plays right.</span></button>
      </div>
      <p class="lead">A game is one evening: four hands against Rosa, Lena and me. Afterwards, tell us what you thought.</p>
    </div></div>`;
  }

  // ---------------- Starter pick ----------------
  let starter = 0;
  function starterScreen(then) {
    root.hidden = false;
    const A = TB.ABILITIES;
    const cards = [['ember', 'Cindermole', 'img/ember.jpg', A.ember], ['tide', 'Reedling', 'img/tide.jpg', A.tide], ['grove', 'Mossmouse', 'img/grove.jpg', A.grove]];
    root.innerHTML = `<div class="screen"><div class="screen-in">
      <h2>Pick your starter.</h2><p class="lead">Your starter tucks a few of its suit into every deal and gives you one ability. The others play theirs: Rosa has Cindermole, Lena has Reedling, Bev has Mossmouse.</p>
      <div class="starters">${cards.map(([s, n, img, ab], i) => `<button class="starter ${s}${i === starter ? ' sel' : ''}" type="button" data-st="${i}"><img src="${img}" alt=""><span class="txt"><span class="suit">${s} · ${['1–3 of the suit', '1–3 of the suit', '1–3 of the suit'][i]}</span><b>${n}</b><span class="ab"><b style="font-size:13px;font-family:var(--body)">${esc(ab.name)}:</b> ${esc(ab.when)}, ${esc(ab.does)}</span></span></button>`).join('')}</div>
      <div style="display:flex;justify-content:flex-end;gap:10px"><button class="btn primary" type="button" data-s="${then}" data-focus="1">Go with ${['Cindermole', 'Reedling', 'Mossmouse'][starter]}</button></div>
    </div></div>`;
  }

  // ---------------- Lessons ----------------
  // Mini lessons use 4–8 tile hands against Bev alone, scripted tile by tile.
  const LESSONS = [
    { title: 'Draw, discard, match', goal: { name: 'Ember 111 22', groups: [[Em(1), 3], [Em(2), 2]] }, start: [Em(1), Em(1), Em(2), N],
      steps: [
        { say: 'This is <b>your hand</b>, at the bottom: four tiles. The cream card at the top is your <b>goal</b>: three Ember 1s and two Ember 2s. Match it exactly and you win. Tap <b>Next</b>.', expect: 'next' },
        { say: 'Every turn starts the same way: you <b>draw</b> one tile. Tap the glowing <b>wall</b>.', expect: 'draw', draw: Em(1) },
        { say: 'You drew an Ember 1. That’s three 1s! Every turn also <b>ends with a discard</b>. The North Wind doesn’t fit your goal. Tap the glowing <b>North Wind</b> to throw it away.', expect: { tile: N } },
        { say: 'That was a whole turn: draw one, discard one. Now it’s my turn…', bev: Ti(7), then: 'I threw away a Tide 7. You don’t need it, so let it go. Tap <b>Next</b>.', expect: 'next' },
        { say: 'Your turn again. Tap the <b>wall</b> to draw.', expect: 'draw', draw: Em(2) },
        { say: 'Look at your hand: <b>1 1 1 2 2</b>. It matches your goal exactly. When it does, you call <b>Mahj!</b> Tap the glowing button.', expect: 'mahj' },
        { say: 'That’s mahjong! <b>Draw, discard, match the card.</b> Everything else is just more tiles. Tap <b>Next lesson</b>.', expect: 'next', nextLabel: 'Next lesson' },
      ] },
    { title: 'Mimics are jokers', goal: { name: 'Tide 333 55', groups: [[Ti(3), 3], [Ti(5), 2]] }, start: [Ti(3), Ti(3), MIMIC, Ti(5)],
      steps: [
        { say: 'New goal: three Tide 3s and two Tide 5s. See the purple tile with the question mark? That’s a <b>Mimic</b>, our joker. Tap <b>Next</b>.', expect: 'next' },
        { say: 'A Mimic can stand in for <b>any tile in a group of 3 or more</b>. Here it’s playing your third Tide 3. Now draw: tap the <b>wall</b>.', expect: 'draw', draw: Gr(8) },
        { say: 'A Grove 8. No help at all. Throw it away: tap the glowing <b>Grove 8</b>.', expect: { tile: Gr(8) } },
        { say: 'My turn…', bev: W, then: 'I discarded a West Wind. Not one you need. Tap <b>Next</b>.', expect: 'next' },
        { say: 'Your turn. Tap the <b>wall</b> to draw.', expect: 'draw', draw: Ti(5) },
        { say: 'Tide 3, 3, Mimic, then 5, 5. The Mimic fills your set of 3s, so this matches! Tap <b>Mahj!</b>', expect: 'mahj' },
        { say: 'One rule to remember: Mimics fill groups of <b>3 or more</b>, never a pair. So a Mimic could not have been one of your 5s. Tap <b>Next lesson</b>.', expect: 'next', nextLabel: 'Next lesson' },
      ] },
    { title: 'Grab a discard', goal: { name: 'Grove 666 77', groups: [[Gr(6), 3], [Gr(7), 2]] }, start: [Gr(6), Gr(6), Gr(7), Gr(9)],
      steps: [
        { say: 'Goal: three Grove 6s and two Grove 7s. You have two 6s. Watch what I throw away. Tap <b>Next</b>.', expect: 'next' },
        { say: 'My turn…', bev: Gr(6), then: 'I just threw away a <b>Grove 6</b>, the exact tile you need! When someone’s discard <b>finishes a group of 3 or more</b> for you, you can grab it. Tap <b>Take it</b>.', expect: 'take', take: [Gr(6), 3] },
        { say: 'Your three 6s are now <b>face up</b> for everyone to see. You grabbed a tile instead of drawing one, so now discard. The Grove 9 doesn’t fit: tap it.', expect: { tile: Gr(9) } },
        { say: 'My turn…', bev: Em(4), then: 'An Ember 4. Not for you. Tap <b>Next</b>.', expect: 'next' },
        { say: 'Tap the <b>wall</b> to draw.', expect: 'draw', draw: Gr(7) },
        { say: 'Three 6s face up, plus 7 7 in your hand. That’s your goal! Tap <b>Mahj!</b>', expect: 'mahj' },
        { say: 'Laying a group down also <b>tells the table</b> what you’re building. Good players watch for that and stop throwing you tiles. Tap <b>Next lesson</b>.', expect: 'next', nextLabel: 'Next lesson' },
      ] },
    { title: 'Pick a goal from the card', mini: [
        { name: 'Evens', groups: [[Em(2), 3], [Em(4), 3], [Em(6), 2]] },
        { name: 'Low Tide', groups: [[Ti(1), 3], [Ti(2), 3], [Ti(3), 2]] },
        { name: 'Two Winds', groups: [[N, 3], [E, 3], [W, 2]] },
      ], start: [Em(2), Em(2), Em(4), Em(4), Em(6), Ti(1), Gr(5), N],
      steps: [
        { say: 'Now the real idea. At the table there isn’t one goal, there’s a <b>card</b> of many hands, and you choose which to chase. This card has three. Look at your 8 tiles: which hand are you closest to? Tap it on the card.', expect: 'pickgoal', goal: 0 },
        { say: 'Right: <b>Evens</b>. You already hold 2 2, 4 4 and a 6. Everything else is junk now. Every pass and discard from here serves that choice. Tap the <b>wall</b>.', expect: 'draw', draw: Em(6) },
        { say: 'Ember 6: that makes your pair. Throw away something that isn’t Evens: the <b>North Wind</b>.', expect: { tile: N } },
        { say: 'My turn…', bev: BL, then: 'A Blossom. Not yours. Tap <b>Next</b>.', expect: 'next' },
        { say: 'Tap the <b>wall</b>.', expect: 'draw', draw: Em(2) },
        { say: 'Three 2s now. Discard the <b>Tide 1</b>.', expect: { tile: Ti(1) } },
        { say: 'My turn…', bev: S, then: 'South Wind, no. Tap <b>Next</b>.', expect: 'next' },
        { say: 'Tap the <b>wall</b>.', expect: 'draw', draw: Em(4) },
        { say: '2 2 2, 4 4 4, 6 6 and one Grove 5 too many. Discard the <b>Grove 5</b>… and you’ll have it.', expect: { tile: Gr(5) } },
        { say: 'That’s Evens! Tap <b>Mahj!</b>', expect: 'mahj' },
        { say: 'At the real table the card has <b>ten hands</b> and you’ll pick one or two to chase. The glowing tiles and the hints all point at your choice. Tap <b>Next lesson</b>.', expect: 'next', nextLabel: 'Next lesson' },
      ] },
    { title: 'The Swap', goal: { name: 'Ember 111 222 33', groups: [[Em(1), 3], [Em(2), 3], [Em(3), 2]] }, start: [Em(1), Em(1), Em(1), Em(2), Ti(7), Gr(3), W, S],
      steps: [
        { say: 'Last lesson. Before any tiles are played, everyone <b>passes 3 tiles they don’t want</b> to the player on their right. That’s the Swap. Your goal needs Ember 1s, 2s and 3s, so pick <b>3 of the junk</b>: tap three of Tide 7, Grove 3, West, South.', expect: 'pass3', junk: [Ti(7), Gr(3), W, S], give: [Em(2), Em(3), Em(3)] },
        { say: 'And you got 3 back from the player on your left (that’s me). Look: Ember 2, 3, 3. The Swap is how a messy hand turns into a plan. Now draw: tap the <b>wall</b>.', expect: 'draw', draw: Em(2) },
        { say: '1 1 1, 2 2 2, 3 3, and one leftover. Discard it and you’re there.', expect: 'anyjunk' },
        { say: 'Tap <b>Mahj!</b>', expect: 'mahj' },
        { say: 'You’ve got it all: <b>draw and discard, Mimics, grabbing a discard, choosing from the card, the Swap.</b> The real table is the same game with 14 tiles and four players. I’ll sit with you and tell you every tap. First, pick your starter critter.', expect: 'next', nextLabel: 'Pick my starter' },
      ] },
  ];

  const L = { i: 0, step: 0, hand: [], exps: [], pond: [], bev: 4, busy: false, wrong: false, saying: '', goal: null, sel: [] };

  function startLesson(i) {
    const les = LESSONS[i];
    Object.assign(L, { i, step: 0, hand: les.start.slice().sort((a, b) => a - b), exps: [], pond: [], bev: les.start.length, busy: false, wrong: false, goal: les.goal || null, sel: [] });
    root.hidden = false; enterStep();
  }
  function enterStep() {
    const st = LESSONS[L.i].steps[L.step];
    L.saying = st.say; L.wrong = false; L.sel = [];
    if (st.bev !== undefined) {
      L.busy = true; renderLesson();
      setTimeout(() => { L.pond.push(st.bev); L.saying = st.then; L.busy = false; renderLesson(); }, 1300);
    } else renderLesson();
  }
  function goalTiles(goal) {
    const all = L.hand.slice(); let g = '';
    for (const [t, s] of goal.groups) {
      const laid = L.exps.find((e) => e.t === t && e.s === s); let have = laid ? s : 0;
      if (!laid) for (let k = 0; k < s; k++) { const idx = all.indexOf(t); if (idx >= 0) { all.splice(idx, 1); have++; } }
      g += '<span class="grp">'; for (let k = 0; k < s; k++) g += tile(t, k < have ? '' : 'dim'); g += '</span>';
    }
    return g;
  }
  function goalHTML() {
    const les = LESSONS[L.i];
    if (les.mini) {
      const st = les.steps[L.step];
      return `<b>The card</b><span class="mini">${les.mini.map((m, k) => `<button type="button" data-goal="${k}" class="${L.goal === m ? 'pick' : ''}" ${st.expect === 'pickgoal' ? 'data-focus-soft="1"' : ''}><b>${esc(m.name)}</b>${goalTiles(m)}</button>`).join('')}</span>`;
    }
    return `<b>Your goal</b>${goalTiles(L.goal)}<span style="font-size:12px;color:#5B4D5C">Faded = still needed</span>`;
  }
  function renderLesson() {
    const les = LESSONS[L.i], st = les.steps[L.step];
    const exp = L.busy ? null : st.expect;
    const focusTile = exp && typeof exp === 'object' ? exp.tile : null;
    let focused = false;
    const rack = L.hand.map((t, k) => {
      let f = focusTile === t && !focused; if (f) focused = true;
      if (exp === 'pass3' && st.junk.includes(t)) f = true;
      if (exp === 'anyjunk' && !L.goal.groups.some(([gt]) => gt === t)) f = true;
      const sel = L.sel.includes(k) ? ' sel' : '';
      return tile(t, sel, 'button', `type="button" data-lt="${k}" ${f ? 'data-focus="1"' : ''}`);
    }).join('');
    const backs = Array.from({ length: L.bev }, () => '<span class="back"></span>').join('');
    let acts = '';
    if (exp === 'next') acts = `<button class="btn primary" type="button" data-l="next" data-focus="1">${esc(st.nextLabel || 'Next')}</button>`;
    if (exp === 'mahj') acts = '<button class="btn primary" type="button" data-l="mahj" data-focus="1">Mahj!</button>';
    if (exp === 'take') acts = '<button class="btn" type="button" data-l="pass">Pass</button><button class="btn primary" type="button" data-l="take" data-focus="1">Take it</button>';
    if (exp === 'pass3') acts = `<button class="btn primary" type="button" data-l="pass3" ${L.sel.length === 3 ? 'data-focus="1"' : 'disabled'}>Pass ${L.sel.length}/3 →</button>`;
    root.innerHTML = `<div class="screen"><div class="lesson-in">
      <div class="l-top"><div><span class="eyebrow">Lesson ${L.i + 1} of ${LESSONS.length}</span><h2>${esc(les.title)}</h2></div><button class="skip" type="button" data-s="skiplessons">Skip lessons</button></div>
      <div class="l-goal">${goalHTML()}</div>
      <div class="l-board">
        <div class="l-bev"><img src="img/bev.jpg" alt="Bev"><div><b>Bev</b><div class="backs" aria-label="${L.bev} tiles">${backs}</div></div></div>
        <div class="l-mid">
          <button class="wall" type="button" data-l="draw" ${exp === 'draw' ? 'data-focus="1"' : ''} aria-label="The wall: tap to draw">${exp === 'draw' ? '<span class="tapme">Tap to draw</span>' : ''}<span class="stack">${'<span></span>'.repeat(8)}</span><b>Wall</b></button>
          <div class="l-pond"><span class="lbl">The pond (discards)</span>${L.pond.map((t, k) => tile(t, k === L.pond.length - 1 ? 'last' : '')).join('')}</div>
        </div>
      </div>
      <div class="l-coach" aria-live="polite"><img src="img/bev.jpg" alt=""><p><span class="who">Bev:</span> ${L.busy ? '<i>…thinking…</i> ' + L.saying : L.saying}${L.wrong ? '<br><b style="color:var(--gold)">Not that one: tap the glowing one.</b>' : ''}</p></div>
      <div class="l-hand">
        ${L.exps.length ? `<div class="exps" style="justify-content:center;display:flex;gap:6px;align-items:center">${L.exps.map((e) => '<span class="exp">' + Array.from({ length: e.s }, () => tile(e.t)).join('') + '</span>').join('')}<span style="color:var(--muted);font-size:12px">face up</span></div>` : ''}
        <div class="rack">${rack}</div>
        <div class="l-acts">${acts}</div>
      </div>
    </div></div>`;
    const f = root.querySelector('.rack .tile[data-focus]');
    if (f && exp !== 'pass3' && exp !== 'anyjunk') f.insertAdjacentHTML('beforeend', '<span class="tapme">Tap me</span>');
  }
  function wrong() { L.wrong = true; renderLesson(); const f = root.querySelector('[data-focus]'); if (f) f.classList.add('shake'); }
  function burst(text, after) { const d = document.createElement('div'); d.className = 'burst'; d.innerHTML = `<span>${text}</span>`; root.appendChild(d); setTimeout(() => { d.remove(); after(); }, 1400); }
  function advance() {
    const les = LESSONS[L.i];
    if (L.step + 1 < les.steps.length) { L.step++; enterStep(); return; }
    if (L.i + 1 < LESSONS.length) startLesson(L.i + 1); else starterScreen('tablecoach');
  }
  function act(kind, el) {
    if (L.busy) return;
    const st = LESSONS[L.i].steps[L.step]; const exp = st.expect;
    if (kind === 'goal') { const k = Number(el.dataset.goal); if (exp !== 'pickgoal') return; if (k !== st.goal) return wrong(); L.goal = LESSONS[L.i].mini[k]; return advance(); }
    if (kind === 'tile') {
      const k = Number(el.dataset.lt); const t = L.hand[k];
      if (exp === 'pass3') { if (!st.junk.includes(t)) return wrong(); const i = L.sel.indexOf(k); if (i >= 0) L.sel.splice(i, 1); else if (L.sel.length < 3) L.sel.push(k); return renderLesson(); }
      if (exp === 'anyjunk') { if (L.goal.groups.some(([gt]) => gt === t)) return wrong(); L.hand.splice(k, 1); L.pond.push(t); return advance(); }
      if (!(exp && typeof exp === 'object' && exp.tile === t)) return wrong();
      L.hand.splice(k, 1); L.pond.push(t); return advance();
    }
    if (kind === 'pass3') { if (exp !== 'pass3' || L.sel.length !== 3) return; const out = L.sel.sort((a, b) => b - a).map((k) => L.hand.splice(k, 1)[0]); L.hand.push(...st.give); L.hand.sort((a, b) => a - b); L.pond.push(...out); return advance(); }
    if (kind !== exp && !(kind === 'pass' && exp === 'take')) return wrong();
    if (kind === 'pass') return wrong();
    if (kind === 'next') return advance();
    if (kind === 'draw') { L.hand.push(st.draw); L.hand.sort((a, b) => a - b); return advance(); }
    if (kind === 'take') { const [t, s] = st.take; L.pond.pop(); for (let k = 0; k < s - 1; k++) L.hand.splice(L.hand.indexOf(t), 1); L.exps.push({ t, s }); return advance(); }
    if (kind === 'mahj') { L.busy = true; burst('Mahj!', () => { L.busy = false; advance(); }); }
  }

  function toTable(opts) { root.hidden = true; root.innerHTML = ''; window.TBUI.start(opts); }

  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    const s = b.dataset.s;
    if (s === 'next') { if (scene + 1 < SCENES.length) goScene(scene + 1); else doors(); return; }
    if (s === 'skip') return doors();
    if (s === 'learn') return startLesson(0);
    if (s === 'tilebound') return starterScreen('table');
    if (s === 'classic') return toTable({ mode: 'classic', coach: false, helpers: false });
    if (s === 'table') return toTable({ mode: 'tilebound', coach: false, helpers: true, starter });
    if (s === 'tablecoach') return toTable({ mode: 'tilebound', coach: true, helpers: true, starter });
    if (s === 'skiplessons') return starterScreen('tablecoach');
    if (b.dataset.st !== undefined) { starter = Number(b.dataset.st); const then = root.querySelector('[data-s="table"],[data-s="tablecoach"]').dataset.s; return starterScreen(then); }
    if (b.dataset.goal !== undefined) return act('goal', b);
    if (b.dataset.l) return act(b.dataset.l, b);
    if (b.dataset.lt !== undefined) return act('tile', b);
  });
  document.addEventListener('keydown', (ev) => {
    if (root.hidden || !root.querySelector('.scene.on')) return;
    if (ev.key === 'ArrowRight') { if (scene + 1 < SCENES.length) goScene(scene + 1); else doors(); }
  });

  window.TBStory = { replay() { showIntro(0); }, doors };
  showIntro(0);
})();
