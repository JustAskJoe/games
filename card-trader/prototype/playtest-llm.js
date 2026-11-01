// Tier B, API route: Claude plays Card Trader v3 as a persona through play-driver.js (player-visible text only) and
// fills in the playtest questionnaire with source 'agent-llm'. Design and rules: kit/agents/playtester.md.
//
// SPENDS MONEY only with --go. Without it, this prints the estimated tokens and dollars and exits (dry-run, the default).
//   node playtest-llm.js                                  dry-run: 8 personas on claude-haiku-5-5
//   node playtest-llm.js --mock                           plays every run with a scripted stand-in: no API, no key, free
//   node playtest-llm.js --go --max-runs 8 --max-tokens 6000000
// Flags: --personas all|kid,newbie,...  --model <id> (default claude-haiku-5-5; Sonnet for "lead" personas)
//   --max-runs N (default 8)  --max-tokens N per batch (default 6,000,000: stop as soon as it's exceeded)
//   --max-decisions N per run (default 180)  --seed N (first seed, default 3001)  --out <dir> (default ../playtests)
// Key: PLAYTEST_ANTHROPIC_API_KEY from the environment only (its own Console workspace with a $5/month hard limit). Never
// printed or logged. Needs @anthropic-ai/sdk only for --go (the workflow installs it).
// © 2026 justaskjoe. All rights reserved.
const fs = require('fs'), path = require('path');
const D = require('./play-driver.js');
const { PERSONAS } = require('./playtest-agents.js');

// List prices per million tokens, from Anthropic's model table cached Oct 6, 2026. Check before trusting a dollar figure.
// Haiku 5.5's cache-read price isn't in that table: the estimate charges cache reads at the full input price.
const PRICE = { 'claude-haiku-5-5': { in: 0.10, out: 0.50, cacheRead: null }, 'claude-sonnet-5-5': { in: 2, out: 10, cacheRead: 0.20 }, 'claude-opus-5-5': { in: 4, out: 20, cacheRead: 0.20 } };
// Per-run token assumptions for the estimate (the no-API runs had about 100-150 real decision stops).
const EST = { decisions: 140, inPerDecision: 4000, cachedPerDecision: 3000, outPerDecision: 500, finalIn: 20000, finalOut: 2500 };

function args() {
  const a = process.argv.slice(2), o = { go: false, mock: false, personas: 'all', model: 'claude-haiku-5-5', maxRuns: 8, maxTokens: 6e6, maxDecisions: 180, seed: 3001, out: path.resolve(__dirname, '../playtests') };
  for (let i = 0; i < a.length; i++) {
    const k = a[i], v = a[i + 1];
    if (k === '--go') o.go = true; else if (k === '--mock') o.mock = true; else if (k === '--dry-run') o.go = false;
    else if (k === '--personas') { o.personas = v; i++; } else if (k === '--model') { o.model = v; i++; }
    else if (k === '--max-runs') { o.maxRuns = +v; i++; } else if (k === '--max-tokens') { o.maxTokens = +v; i++; }
    else if (k === '--max-decisions') { o.maxDecisions = +v; i++; } else if (k === '--seed') { o.seed = +v; i++; }
    else if (k === '--out') { o.out = path.resolve(v); i++; } else throw new Error('unknown flag ' + k);
  }
  if (o.go && o.mock) throw new Error('--go and --mock together make no sense');
  return o;
}
function pick(o) { const ids = o.personas === 'all' ? PERSONAS.map(p => p.id) : o.personas.split(','); return ids.map(id => { const p = PERSONAS.find(x => x.id === id); if (!p) throw new Error('no persona ' + id); return p; }).slice(0, o.maxRuns); }

function estimate(model, runs) {
  const P = PRICE[model]; if (!P) return { note: 'no price on file for ' + model };
  const inTok = runs * (EST.decisions * EST.inPerDecision + EST.finalIn), cached = runs * EST.decisions * EST.cachedPerDecision, outTok = runs * (EST.decisions * EST.outPerDecision + EST.finalOut);
  const cr = P.cacheRead == null ? P.in : P.cacheRead;
  const usd = ((inTok - cached) * P.in + cached * cr + outTok * P.out) / 1e6;
  return { inTok, cached, outTok, usd: +usd.toFixed(2), cacheNote: P.cacheRead == null ? 'cache reads charged at full input price (price unverified)' : '' };
}

// ---------- the prompt ----------
// Fixed text first, byte-identical every call, so it caches (512-token minimum on the 5.5 models).
const RULES = `You are playtesting "Intergalactic Card Trader" v3, a 10-day card-shop game, as the persona below. Play the way that person would, not optimally. You only know what the screen text shows you.

Each turn you get the current screen. Reply with JSON only, matching the schema:
- "moves": the moves to make now, in order. Each move is either a game action object or a macro string.
  Game actions (use the uids shown on screen): {"t":"unpack"}, {"t":"open"}, {"t":"place","uid":"c1","to":"case"|"cbinder"|"rack"|"tlbinder"}, {"t":"sleeve","uid":"c1","prot":"penny"|"hard"|"mag"}, {"t":"tag","uid":"c1","price":30}, {"t":"movePacks","game":"shell"|"hive"|"star","n":3,"to":"rack"|"shelf"}, {"t":"openGood","uid":"g5"}, {"t":"inspect","uid":"c9","tool":"uv"|"loupe"|"read"}, {"t":"offer","price":40}, {"t":"accept"}, {"t":"pass"}, {"t":"show","uid":"c3"}, {"t":"showPacks"}, {"t":"watch"}, {"t":"security"}, {"t":"letGo","parent":true}|{"t":"letGo","work":true}, {"t":"inform"}, {"t":"refuse"}, {"t":"sellBehind"}, {"t":"inspectPacks"}, {"t":"flaw","uid":"c9"}, {"t":"restock","game":"hive"}, {"t":"order","item":"box"|"blister"|"tin"|"collector"|"premium"|"hard"|"penny"|"mag"|"poster"|"deckbox","game":"hive"}, {"t":"unlock","k":"lock"|"binder"|"camera"|"scale"|"riser"|"tlbinder"|"sorter"|...}, {"t":"upgrade","k":"lens"|"spec"|"hands"}, {"t":"grade","uid":"c1","co":"quik"|"halo"}, {"t":"policy","limit2":true}, {"t":"endDay"}, {"t":"pickNight","ev":"cardnight"|"tourney"|"dig"|"auction"|"swap"}, {"t":"cardNight","game":"star","n":2}, {"t":"tourney","game":"shell","prize":null}, {"t":"bid"}, {"t":"drop"}, {"t":"dig","i":3}, {"t":"swap","i":0,"accept":false}, {"t":"nextMorning"}.
  Macros: "setup" (do what the open checklist asks), "showBest" (show your best card that fits the customer), "sell" (haggle, accept a bid near the card's estimate), "inspectAll" (UV, loupe and read every card on the counter while patience lasts), "buyBelow:0.65" (buy if the ask is under 65% of the estimate, haggling up to it).
- "orders": standing orders for kinds of customer you have now met, as [{"kind":"sell","moves":["inspectAll","buyBelow:0.65"]}]. Routine visitors of that kind then play themselves, which saves your time. Only order a kind after meeting it.
- "note": one short sentence when something confuses you, contradicts something else, drags, or delights you; otherwise "".

Mornings: open the shop with {"t":"open"} after setting up. Close: buy what you want, then {"t":"endDay"}. Night: pick a flyer, play it, then {"t":"nextMorning"}. A refused move shows as "✗" in the next screen: adapt.`;
const SCHEMA_MOVES = { type: 'object', additionalProperties: false, required: ['moves', 'orders', 'note'], properties: {
  moves: { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'object' }] } },
  orders: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['kind', 'moves'], properties: { kind: { type: 'string' }, moves: { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'object' }] } } } } },
  note: { type: 'string' } } };
const SYS = ['opening', 'stockroom', 'fetch', 'browsers', 'tags', 'sleeves', 'sealed', 'vintage', 'reprints', 'repacks', 'rating', 'fakes', 'thieves', 'board', 'upgrades', 'loupe', 'nights'];
const n15 = { anyOf: [{ type: 'integer', minimum: 1, maximum: 5 }, { type: 'null' }] }, band = (...e) => ({ type: 'string', enum: e });
const PACE = { type: 'object', additionalProperties: false, required: ['money', 'energy'], properties: { money: band('broke', 'tight', 'ok', 'flush'), energy: band('drag', 'fine', 'exciting') } };
const SCHEMA_ANSWERS = { type: 'object', additionalProperties: false,
  required: ['setupClear', 'setupFeel', 'floorBack', 'counterFloor', 'grids', 'rearranged', 'sys', 'pace', 'drag', 'contra', 'confused', 'best', 'worst', 'change', 'bugs', 'again'],
  properties: { setupClear: n15, setupFeel: band('fun', 'fine', 'busywork', 'confusing'), floorBack: n15, counterFloor: n15, grids: n15, rearranged: band('yes', 'no', 'once'),
    sys: { type: 'object', additionalProperties: false, required: SYS, properties: Object.fromEntries(SYS.map(k => [k, { type: 'object', additionalProperties: false, required: ['clear', 'fun', 'missed'], properties: { clear: n15, fun: n15, missed: { type: 'boolean' } } }])) },
    pace: { type: 'object', additionalProperties: false, required: ['early', 'mid', 'late'], properties: { early: PACE, mid: PACE, late: PACE } },
    drag: { anyOf: [band('1', '2', '3', '4', '5', '6', '7', '8', '9', '10'), { type: 'null' }] },
    contra: { type: 'string' }, confused: { type: 'string' }, best: { type: 'string' }, worst: { type: 'string' }, change: { type: 'string' }, bugs: { type: 'string' }, again: { type: 'integer', minimum: 1, maximum: 5 } } };
const FINAL = `The run is over. Fill in the playtest questionnaire as the persona, in their own voice, using only what happened (your notes and the day log below). 1-5 scales: 5 = very clear / very fun. "missed" = you never used that system. Systems: ${SYS.join(', ')}. pace: early = days 1-3, mid = 4-7, late = 8-10. drag = the day it started to drag, or null. Cite days and numbers in the text answers. Reply with JSON only.`;

// ---------- one run ----------
function validMove(m) { return typeof m === 'string' ? /^(setup|showBest|sell|inspectAll|sleeveFloor|buyBelow:0?\.\d+)$/.test(m) : m && typeof m === 'object' && typeof m.t === 'string' && m.t.length < 20; }
// When a reply moves nothing on, do the minimum to keep the game going (and count it).
function nudge(S) { const p = S.G.phase; return p === 'visit' ? [{ t: 'pass' }] : p === 'morning' ? ['setup', { t: 'open' }] : p === 'close' ? [{ t: 'endDay' }] : p === 'night' ? (S.G.night.pick ? [{ t: 'nextMorning' }] : [{ t: 'pickNight', ev: S.G.night.flyers[0] }, { t: 'nextMorning' }]) : [{ t: 'next' }]; }
function stamp(S) { const G = S.G; return G.phase + '|' + G.dayIdx + '|' + G.visitIdx + '|' + S.moves; }

async function playRun(P, seed, o, ask, budget) {
  const answers = P.answers(n => seed % n), S = D.newSession(seed, answers), dayLog = [], usage = { in: 0, cached: 0, cacheWrite: 0, out: 0, calls: 0, refusals: 0 };
  const persona = 'PERSONA: ' + P.name + '. ' + P.blurb;
  let decisions = 0, nudges = 0, stopped = null;
  D.advance(S);
  while (S.G.phase !== 'end') {
    if (decisions >= o.maxDecisions) { stopped = 'max decisions'; break; }
    if (budget.used() >= o.maxTokens) { stopped = 'max tokens'; break; }
    const screen = D.view(S), recent = S.notes.slice(-6).map(n => 'day ' + n.day + ': ' + n.text).join('\n');
    const r = await ask({ system: RULES + '\n\n' + persona, user: (recent ? 'Your notes so far:\n' + recent + '\n\n' : '') + screen, schema: SCHEMA_MOVES, maxTokens: 2000, S });
    decisions++; add(usage, r.usage); budget.add(r.usage);
    const before = stamp(S);
    if (r.json) {
      for (const od of r.json.orders || []) if (od && typeof od.kind === 'string' && Array.isArray(od.moves) && od.moves.every(validMove)) S.orders[od.kind] = od.moves;
      if (r.json.note) S.notes.push({ day: S.G.dayIdx + 1, phase: S.G.phase, text: String(r.json.note).slice(0, 400) });
      D.apply(S, (r.json.moves || []).filter(validMove).slice(0, 40));
    } else usage.refusals++;
    if (S.G.phase === 'visit' && S.G.visit && stamp(S) === before) { D.apply(S, nudge(S)); nudges++; }
    else if (stamp(S) === before) { D.apply(S, nudge(S)); nudges++; }
    const dBefore = S.G.days.length; D.advance(S);
    if (S.G.days.length > dBefore || S.G.phase === 'end') { const d = S.G.days[S.G.days.length - 1]; if (d) dayLog.push('day ' + (d.day + 1) + ': cash ' + d.cash + ', shop value ' + d.value + ', rating ' + (S.G.rating.stars || '-')); }
  }
  let run = null;
  if (S.G.phase === 'end') {
    const r = await ask({ system: RULES + '\n\n' + persona, user: FINAL + '\n\nNotes:\n' + S.notes.map(n => 'day ' + n.day + ' (' + n.phase + '): ' + n.text).join('\n') + '\n\nDay log:\n' + dayLog.join('\n') + '\n\nResult: ' + JSON.stringify(S.G.final) + ', rating ' + S.G.rating.stars, schema: SCHEMA_ANSWERS, maxTokens: 4000, final: true, S });
    add(usage, r.usage); budget.add(r.usage);
    if (r.json) run = Object.assign({ day: 'end', mins: Math.round((S.moves * 4 + 300) / 60), rank: S.G.final.rank, focus: answers.focus, split: answers.split, home: answers.home }, r.json,
      { at: new Date().toISOString(), build: 'v3', source: 'agent-llm', persona: P.id, seed, model: o.mock ? 'mock' : o.model });
  }
  return { persona: P.id, seed, run, stopped, decisions, nudges, moves: S.moves, final: S.G.final || null, usage, notes: S.notes };
}
function add(u, x) { if (!x) return; u.in += x.in || 0; u.cached += x.cached || 0; u.cacheWrite += x.cacheWrite || 0; u.out += x.out || 0; u.calls++; }

// ---------- the model ----------
function apiAsk(o) {
  const key = process.env.PLAYTEST_ANTHROPIC_API_KEY;
  if (!key) throw new Error('PLAYTEST_ANTHROPIC_API_KEY is not set (see kit/agents/playtester.md)');
  const sdk = require('@anthropic-ai/sdk'), Anthropic = sdk.default || sdk, client = new Anthropic({ apiKey: key });
  return async ({ system, user, schema, maxTokens }) => {
    try {
      const res = await client.messages.create({ model: o.model, max_tokens: maxTokens, output_config: { effort: 'low', format: { type: 'json_schema', schema } },
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: user }] });
      const u = res.usage || {}, usage = { in: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0), cached: u.cache_read_input_tokens || 0, cacheWrite: u.cache_creation_input_tokens || 0, out: u.output_tokens || 0 };
      if (res.stop_reason === 'refusal') return { json: null, usage };
      const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
      try { return { json: JSON.parse(text), usage }; } catch (e) { return { json: null, usage }; }
    } catch (e) {
      // Never echo the request (it carries the key in headers): name and status only.
      const msg = (e && e.constructor && e.constructor.name) + (e && e.status ? ' ' + e.status : '');
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError || e instanceof Anthropic.BadRequestError) throw new Error('API error: ' + msg);
      return { json: null, usage: null, error: msg };
    }
  };
}
// A free stand-in that plays plausibly from the screen text, to test the whole loop without the API.
function mockAsk() {
  const T = s => Math.ceil(s.length / 4);
  return async ({ system, user, schema, S }) => {
    const usage = { in: T(system) + T(user), cached: T(system), cacheWrite: 0, out: 120 };
    if (schema === SCHEMA_ANSWERS) {
      const sys = Object.fromEntries(SYS.map(k => [k, { clear: 3, fun: 3, missed: false }]));
      return { usage, json: { setupClear: 4, setupFeel: 'fine', floorBack: 3, counterFloor: 3, grids: 3, rearranged: 'once', sys, pace: { early: { money: 'ok', energy: 'fine' }, mid: { money: 'ok', energy: 'fine' }, late: { money: 'ok', energy: 'fine' } }, drag: null, contra: 'mock', confused: 'mock', best: 'mock', worst: 'mock', change: 'mock', bugs: '', again: 3 } };
    }
    const G = S.G, p = G.phase, v = G.visit;
    let moves = [];
    if (p === 'morning') moves = [{ t: 'unpack' }, 'setup', { t: 'open' }];
    else if (p === 'close') moves = [{ t: 'endDay' }];
    else if (p === 'night') moves = G.night.pick ? [{ t: 'nextMorning' }] : [{ t: 'pickNight', ev: G.night.flyers[0] }, { t: 'nextMorning' }];
    else if (p === 'visit') moves = v.cards.length ? ['inspectAll', 'buyBelow:0.6', { t: 'pass' }] : v.role === 'browse' ? [{ t: 'accept' }] : v.wants ? ['showBest', 'sell'] : [{ t: 'watch' }, { t: 'pass' }];
    const orders = p === 'visit' ? [{ kind: D.kindOf(v), moves: moves.slice() }] : [];
    return { usage, json: { moves, orders, note: p === 'close' && G.dayIdx === 4 ? 'mock note: halfway' : '' } };
  };
}

// ---------- main ----------
async function main() {
  const o = args(), ps = pick(o), e = estimate(o.model, ps.length);
  console.log('Personas: ' + ps.map(p => p.id).join(', ') + ' · model ' + o.model + ' · max ' + o.maxDecisions + ' decisions a run · batch cap ' + o.maxTokens.toLocaleString() + ' tokens');
  console.log('Estimate: ~' + (e.inTok || 0).toLocaleString() + ' input tokens (' + (e.cached || 0).toLocaleString() + ' cacheable), ~' + (e.outTok || 0).toLocaleString() + ' output · about $' + e.usd + (e.cacheNote ? ' (' + e.cacheNote + ')' : '') + (e.note ? ' · ' + e.note : ''));
  console.log('Prices are list prices cached Oct 6, 2026. Check them before a real run.');
  if (!o.go && !o.mock) { console.log('Dry-run: nothing was called. Add --go to spend (Hunter OKs the first run), or --mock to test the loop for free.'); return; }
  if (o.go) console.log('LIVE RUN: spending on PLAYTEST_ANTHROPIC_API_KEY.');
  const ask = o.go ? apiAsk(o) : mockAsk();
  let used = 0; const budget = { add: u => { if (u) used += u.in + u.out; }, used: () => used };
  const results = [];
  for (let i = 0; i < ps.length; i++) {
    if (used >= o.maxTokens) { console.log('Batch token cap reached: stopping before ' + ps[i].id); break; }
    const r = await playRun(ps[i], o.seed + i, o, ask, budget); results.push(r);
    const P = PRICE[o.model], usd = o.go && P ? (((r.usage.in - r.usage.cached) * P.in + r.usage.cached * (P.cacheRead == null ? P.in : P.cacheRead) + r.usage.out * P.out) / 1e6).toFixed(3) : '0';
    console.log(ps[i].id + ' seed ' + (o.seed + i) + ': ' + (r.final ? r.final.rank + ' ' + r.final.start + '→' + r.final.value + '₵' : 'unfinished (' + r.stopped + ')') + ' · ' + r.decisions + ' decisions, ' + r.nudges + ' nudges · tokens in ' + r.usage.in + ' (cached ' + r.usage.cached + ') out ' + r.usage.out + ' · ~$' + usd);
  }
  const date = new Date().toISOString().slice(0, 10), tag = o.mock ? 'mock' : 'llm';
  fs.mkdirSync(o.out, { recursive: true });
  const file = path.join(o.out, tag + '-' + date + '.json');
  fs.writeFileSync(file, JSON.stringify({ about: 'Tier B API-route playtests (' + (o.mock ? 'MOCK: scripted stand-in, no API' : o.model) + '). Made by card-trader/prototype/playtest-llm.js. © 2026 justaskjoe. All rights reserved.', model: o.mock ? 'mock' : o.model, totalTokens: used, results }, null, 1));
  const writes = results.filter(r => r.run).map(r => ({ op: 'set', collection: 'playtests', doc_id: 'agent-llm-' + r.persona, data: { source: 'agent-llm', persona: r.persona, runs: [r.run] } }));
  if (!o.mock) fs.writeFileSync(path.join(o.out, tag + '-' + date + '-batch.json'), JSON.stringify({ about: 'ArtifactData batch for the questionnaire artifact; a person pushes it after review. © 2026 justaskjoe. All rights reserved.', url: 'https://claude.ai/artifact/UcN4Lpz8yMHSyDCK69DmYM', action: 'batch', writes }, null, 1));
  console.log('Wrote ' + file + ' · batch tokens ' + used.toLocaleString());
}
if (require.main === module) main().catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
module.exports = { estimate, SCHEMA_ANSWERS, SCHEMA_MOVES };
