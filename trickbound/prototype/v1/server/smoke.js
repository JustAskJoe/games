// Smoke test over real WebSockets: F creates a room, a friend joins, bots fill the rest, both answer prompts.
const { spawn } = require('child_process'); const WebSocket = require('ws'); const SP = require('../engine.js');
const srv = spawn('node', ['server.js'], { env: Object.assign({}, process.env, { PORT: '8421' }), stdio: 'inherit' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function client(name, onJoin) {
  const ws = new WebSocket('ws://127.0.0.1:8421'); let view = null; let seat = null; const st = { prompts: 0, errors: 0, states: 0, over: false };
  ws.on('message', (raw) => {
    const m = JSON.parse(raw);
    if (m.t === 'joined') { seat = m.seat; onJoin(ws, m); }
    if (m.t === 'state') { view = m.view; st.states++; if (view.over >= 0 && view.phase === 'over') st.over = true; }
    if (m.t === 'error') { st.errors++; console.log(name, 'error', m.error); }
    if (m.t === 'prompt') {
      st.prompts++;
      // answer with the engine's suggestion computed from the VIEW only (what a real client has)
      if (m.kind === 'blind') ws.send(JSON.stringify({ t: 'blind', yes: false }));
      else if (m.kind === 'bid') { const est = Math.max(1, Math.round(SP.countTricks(view.hand))); ws.send(JSON.stringify(m.options.mustNil ? { t: 'bid', bid: 0, nil: true } : m.options.mirror ? { t: 'bid', bid: m.options.mirror.bid, nil: m.options.mirror.nil } : { t: 'bid', bid: est, nil: false })); }
      else if (m.kind === 'familiar') ws.send(JSON.stringify({ t: 'skip' }));
      else if (m.kind === 'hopgive') ws.send(JSON.stringify({ t: 'hopgive', c: view.hand[0] }));
      else if (m.kind === 'play') ws.send(JSON.stringify({ t: 'play', c: m.options.legal[0] }));
    }
  });
  return { ws, st };
}
(async () => {
  await wait(600);
  let roomCode = null;
  const a = client('F', (ws, m) => { roomCode = m.room; });
  a.ws.on('open', () => a.ws.send(JSON.stringify({ t: 'create', name: 'F', familiar: 'owlet', rules: { target: 150 } })));
  await wait(400);
  const b = client('Friend', () => {});
  b.ws.on('open', () => b.ws.send(JSON.stringify({ t: 'join', room: roomCode, name: 'Friend', familiar: 'badger' })));
  await wait(400);
  a.ws.send(JSON.stringify({ t: 'start' }));
  for (let i = 0; i < 400 && !(a.st.over); i++) await wait(250);
  console.log('room', roomCode, 'F', a.st, 'Friend', b.st);
  a.ws.close(); b.ws.close(); srv.kill(); process.exit(a.st.over && a.st.errors === 0 ? 0 : 1);
})();
