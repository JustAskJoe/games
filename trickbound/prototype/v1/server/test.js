// Runs a GameRoom in-process: four bots, then one scripted human who answers every prompt with the engine's own
// suggestion through the intent API (so the validation path is exercised). node test.js
'use strict';
const SP = require('../engine.js');
const { GameRoom, viewFor } = require('./room.js');

async function botsOnly() {
  const room = new GameRoom('TEST', { seed: 7, familiars: ['owlet', 'salamander', 'koi', 'badger'] });
  let events = 0; room.onChange(() => events++);
  await room.start();
  console.log('bots only: hands', room.G.history.length, 'winner team', SP.gameOver(room.G), 'events', events);
}
async function oneHuman() {
  const room = new GameRoom('HUMN', { seed: 11, familiars: ['kilnback', 'owlet', 'frog', 'mouse'], rules: { target: 250, goingDark: true } });
  room.sit(0, { name: 'F', familiar: 'kilnback', token: 'tok' });
  let prompts = 0, rejected = 0, leaks = 0;
  room.onChange((ev) => {
    if (ev.t !== 'prompt' || ev.seat !== 0) return;
    prompts++;
    const v = viewFor(room.G, 0, room);
    // the view must never carry another seat's cards
    for (let i = 1; i < 4; i++) if (room.G.players[i].hand.some((c) => v.hand.includes(c))) leaks++;
    setImmediate(() => {
      const G = room.G; let msg;
      if (ev.kind === 'blind') msg = { t: 'blind', yes: false };
      else if (ev.kind === 'bid') { const b = SP.botBid(G, 0); msg = { t: 'bid', bid: b.bid, nil: b.nil }; }
      else if (ev.kind === 'familiar') { const a = room.botAnswer(0, 'familiar', ev.options); msg = a === null ? { t: 'skip' } : { t: 'familiar', args: a }; }
      else if (ev.kind === 'hopgive') msg = { t: 'hopgive', c: SP.hopPick(G, 0) };
      else if (ev.kind === 'play') {
        // first try an illegal card on purpose, expect a rejection
        const bad = G.players[0].hand.find((c) => !SP.legalPlays(G, 0).includes(c));
        if (bad !== undefined) { const r = room.intent(0, { t: 'play', c: bad }); if (!r.ok) rejected++; }
        const a = room.botAnswer(0, 'play', ev.options); msg = { t: 'play', c: a.c, flare: !!a.flare };
      }
      const r = room.intent(0, msg); if (!r.ok) console.log('unexpected rejection', ev.kind, r.error);
    });
  });
  await room.start();
  console.log('one human: hands', room.G.history.length, 'prompts', prompts, 'illegal plays rejected', rejected, 'hand leaks', leaks, 'winner team', SP.gameOver(room.G));
}
botsOnly().then(oneHuman).catch((e) => { console.error(e); process.exit(1); });
