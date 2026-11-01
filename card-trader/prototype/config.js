// Intergalactic Card Trader's settings for the shared front end (frontend.js): words, art, colors, ticker, saves.
// © 2026 justaskjoe. All rights reserved.
this.FE_CONFIG = {
  id: 'ict.v2', // v1 saves stay under ict.v1 and are ignored (the week is longer now)
  presenter: 'JustAskJoe',
  title1: 'INTERGALACTIC',
  title2: 'CARD TRADER',
  tagline: 'happy space Akihabara',
  keyart: 'img/keyart.jpg', slotsBg: 'img/shop.jpg', settingsBg: 'img/dock.jpg', creditsBg: 'img/cardnight.jpg',
  colors: ['#FF2E93', '#19D3F0', '#A6F01E', '#FFD21F', '#8B5CF6'],
  tickerLabel: 'LANE FM',
  ticker: ['Lane FM, the only station on the station!', 'Mollu pearl-haulers inbound on lane 3.', 'Reminder: Zazza\'s binder is "totally legit".',
    'Grade Day is coming. Shine those slabs.', 'Puffi festival ship spotted near the ring!', 'Hive Gambit prices are buzzing.'],
  credits: `<p><b>Intergalactic Card Trader</b> · v2 prototype</p>
    <p>Made by <b>JustAskJoe</b>: Hunter, with Claude.</p>
    <p>Paintings: Canva AI, directed in-house (the full list is in <code>design/ai-assets.md</code>). Cards, scripts, UI and effects are drawn in code.</p>
    <p>Music: an original synth loop written in code. No licensed music.</p>`,
  load: json => CT.load(json),
  slotLine: G => {
    const done = G.phase === 'end', D = G.week[Math.max(0, G.dayIdx)];
    return { done, top: done ? 'FINISHED' : 'DAY ' + (G.dayIdx + 1) + '/' + CT.DAYS.length, name: done ? G.final.rank : D.name,
      stats: ['₵ ' + Math.round(G.cash), 'Rep ' + G.rep, 'Value ' + Math.round(CT.shopValue(G))] };
  },
};
