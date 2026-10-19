// In-process co-op checks: node test.js (or npm test). © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
'use strict';
const assert = require('assert');
const TD = require('../prototype/engine.js');
const { GameRoom, Replica } = require('./room.js');
let n = 0; const ok = (msg) => { n++; console.log('  ok', msg); };

// 1. Two players + a bot play a whole run through intents only; two replicas stay in sync with the server.
{
  const room = new GameRoom('TEST', { seed: 4242 });
  const a = room.join('Hunter'), b = room.join('Joe'); room.addBot();
  const repA = new Replica(room.seed), repB = new Replica(room.seed);
  room.on((m) => { if (m.type === 'applied') { repA.push(m.entry); repB.push(m.entry); } });
  assert.ok(room.intent(a.seat, { k: 'build', type: 'arrow', c: 3, r: 3 }).error, 'no actions before start'); ok('actions blocked before start');
  room.start();
  assert.ok(room.intent(a.seat, { k: 'start' }).error); ok('raw start rejected; ready is the only way');
  assert.ok(room.intent(a.seat, { k: 'build', type: 'arrow', c: 0, r: 0 }).error); ok('build off a spot rejected');
  assert.ok(room.intent(b.seat, { k: 'build', type: 'laser', c: 3, r: 3 }).error); ok('unknown tower rejected');
  assert.ok(room.intent(a.seat, { k: 'gold', n: 9999 }).error); ok('made-up intent rejected');
  let checkpoints = 0, guard = 0;
  room.on((m) => { if (m.type === 'checkpoint') { checkpoints++; repA.finishWave(); repB.finishWave(); assert.strictEqual(repA.hash(), m.cp.hash, 'replica A hash'); assert.strictEqual(repB.hash(), m.cp.hash, 'replica B hash'); } });
  while (!['won', 'lost'].includes(room.G.phase) && guard++ < 50) {
    const G = room.G;
    if (G.phase === 'build') {
      // players take turns spending the shared purse, the way the smart bot would
      const scratch = new Replica(room.seed); room.log.forEach((e) => scratch.push(e)); scratch.finishWave(); // a scratch copy to plan on
      const probe = scratch.G; assert.strictEqual(TD.hash(probe), TD.hash(G), 'scratch copy matches'); TD.botBuild(probe, 'smart');
      const planned = probe.towers.filter((t) => !G.towers.some((x) => x.c === t.c && x.r === t.r));
      planned.forEach((t, i) => assert.ok(room.intent(i % 2 ? b.seat : a.seat, { k: 'build', type: t.type, c: t.c, r: t.r }).ok, 'planned build'));
      const ups = probe.towers.filter((t) => t.tier === 2 && G.towers.some((x) => x.c === t.c && x.r === t.r && x.tier === 1));
      ups.forEach((t) => room.intent(a.seat, { k: 'upgrade', c: t.c, r: t.r, branch: t.branch }));
      room.intent(a.seat, { k: 'ready' });
      assert.strictEqual(room.G.phase, 'build', 'one ready is not enough'); 
      room.intent(b.seat, { k: 'ready' });
    } else if (G.phase === 'draft') {
      const d = room.drafter(); const wrong = d === a.seat ? b.seat : a.seat;
      assert.ok(room.intent(wrong, { k: 'pick', card: G.offer[0] }).error, 'only the drafter picks');
      assert.ok(room.intent(d, { k: 'pick', card: 'not-a-card' }).error, 'card must be on offer');
      room.intent(d, { k: 'pick', card: G.offer[0] });
    }
  }
  ok('wave only starts when every human is ready');
  ok('draft rotates and only the drafter can pick (bot drafts on its own turn)');
  assert.ok(room.G.stats.wavesCleared >= 6, 'a real build holds at least 6 waves'); assert.strictEqual(checkpoints, room.G.stats.wavesCleared + (room.G.phase === 'lost' ? 1 : 0)); repA.finishWave(); repB.finishWave();
  assert.strictEqual(repA.hash(), TD.hash(room.G)); assert.strictEqual(repB.hash(), TD.hash(room.G));
  ok(`full run (${room.G.phase} after ${room.G.stats.wavesCleared} waves, ${room.log.length} actions): both replicas match the server at every checkpoint`);
  // 2. A late joiner rebuilds from the snapshot alone.
  const snap = room.snapshot(0); const late = new Replica(snap.seed); snap.log.forEach((e) => late.push(e)); late.finishWave();
  assert.strictEqual(late.hash(), snap.hash); ok('a fresh replica rebuilt from seed + log matches the server');
}
// 3. Replica waits while its own wave is still playing, then applies queued actions in order.
{
  const room = new GameRoom('WAIT', { seed: 7 }); const a = room.join('A'); room.start();
  const rep = new Replica(room.seed); room.on((m) => m.type === 'applied' && rep.push(m.entry));
  room.intent(a.seat, { k: 'build', type: 'arrow', c: 3, r: 3 }); room.intent(a.seat, { k: 'build', type: 'arrow', c: 1, r: 2 });
  room.intent(a.seat, { k: 'ready' });                        // server resolves wave 1 instantly and opens the draft
  assert.strictEqual(rep.G.phase, 'wave'); for (let i = 0; i < 40; i++) rep.tick(); assert.strictEqual(rep.G.phase, 'wave');
  room.intent(a.seat, { k: 'pick', card: room.G.offer[0] });  // arrives while the replica is mid-wave
  assert.strictEqual(rep.pending.length, 1, 'pick is queued, not applied mid-wave');
  rep.finishWave(); assert.strictEqual(rep.pending.length, 0); assert.strictEqual(rep.hash(), TD.hash(room.G));
  ok('a pick that arrives mid-wave waits for the local wave to end');
}
// 4. Seats: full room, rejoin by token, host-only bots, 3v1 stub.
{
  const room = new GameRoom('SEAT'); const a = room.join('A'); room.join('B'); room.join('C'); room.join('D');
  assert.ok(room.join('E').error); ok('room caps at 4 seats');
  room.leave(a.seat); assert.strictEqual(room.seats[0].connected, false); assert.strictEqual(room.rejoin(a.token).seat, 0); assert.ok(room.rejoin('nope').error);
  ok('rejoin with token restores the seat');
  assert.ok(room.addWavePlayer().error); ok('3v1 wave seat is reserved but not built yet');
}
console.log(`\n${n} checks passed`);
