// ─── Input ───
const keys = {};
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  const k = e.key;
  if (k === 'Tab' || k === ' ' || k.startsWith('Arrow')) e.preventDefault();
  switch (state) {
    case 'title': case 'map': case 'roundComplete': case 'dead': case 'won':
      if (state === 'map' && k === 'Escape') { enterFarm(); return; }
      menuKey(e); return;
    case 'start':
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') selectChar(charSel - 1);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') selectChar(charSel + 1);
      else if (k === 'Enter' || k === ' ') startRun(Object.keys(CHARS)[charSel]);
      else if (/^[1-5]$/.test(k)) startRun(Object.keys(CHARS)[+k - 1]);
      else if (k === 'Escape') showTitle();
      return;
    case 'levelup':
      if (k === 'Tab') { showStats('levelup'); return; }
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') selectLvl(lvlSel - 1);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') selectLvl(lvlSel + 1);
      else if (k === 'Enter' || k === ' ') pickLvl(lvlSel);
      else if (/^[1-4]$/.test(k)) pickLvl(+k - 1);
      return;
    case 'stats':
      if (k === 'Tab' || k === 'Escape') closeStats();
      return;
    case 'paused':
      if (k === 'Escape') { resumeGame(); return; }
      if (k === 'Tab') { showStats('paused'); return; }
      menuKey(e); return;
    case 'options':
      if (k === 'Escape') { closeOptions(); return; }
      menuKey(e); return;
    case 'playing':
      if (k === ' ') useAbility();
      else if (k === 'Escape') pauseGame();
      else if (k === 'Tab') showStats('playing');
      else if (k === 'q' || k === 'Q') drinkPotion(0);
      else if (k === 'e' || k === 'E') drinkPotion(1);
      else if (k === 'r' || k === 'R') drinkPotion(2);
      return;
    case 'farm':
      if (farmShopOpen) { if (shopKeys && shopKeys(k, e)) return; if (k === 'Escape') closeFarmShop(); else menuKey(e); return; }
      if (k === 'Enter' || k === ' ') farmAction();
      return;
  }
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
// Potions (Q / E / R) are drunk in buildings.js: drinkPotion(slot).
