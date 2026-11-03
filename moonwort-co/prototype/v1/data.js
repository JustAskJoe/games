// Moonwort & Co. data: ingredients (game traits), processes, brews, villagers, troubles, familiar quiz.
// Real-world lore lives in design/lore/ingredients.json; build.py embeds it as MW_LORE.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
  // Traits are three axes. H: warming (+) / cooling (-). M: brightening (+) / calming (-). B: drying (+) / soothing (-).
  // Loosely inspired by old herbals' "hot / cold, dry / moist" (humoral) language. Game numbers, not medicine.
  const AXES = {
    H: { pos: 'warming', neg: 'cooling' },
    M: { pos: 'brightening', neg: 'calming' },
    B: { pos: 'drying', neg: 'soothing' },
  };

  // color = placeholder swatch for the code-drawn icon; shape = leaf | flower | root | berry | bulb | fern | cone | spray
  const INGREDIENTS = [
    { id: 'chamomile',  name: 'Chamomile',   t: { H: 0,  M: -2, B: -1 }, color: '#f2d36b', shape: 'flower' },
    { id: 'lavender',   name: 'Lavender',    t: { H: 0,  M: -2, B: 1 },  color: '#9d86c9', shape: 'spray' },
    { id: 'peppermint', name: 'Peppermint',  t: { H: -2, M: 1,  B: 0 },  color: '#6fbf8a', shape: 'leaf' },
    { id: 'calendula',  name: 'Calendula',   t: { H: 1,  M: 0,  B: -2 }, color: '#f0973a', shape: 'flower' },
    { id: 'rosemary',   name: 'Rosemary',    t: { H: 1,  M: 2,  B: 1 },  color: '#5f8f78', shape: 'spray' },
    { id: 'sage',       name: 'Sage',        t: { H: 1,  M: 1,  B: 2 },  color: '#8fa89a', shape: 'leaf' },
    { id: 'thyme',      name: 'Thyme',       t: { H: 2,  M: 0,  B: 2 },  color: '#7a9a5c', shape: 'spray' },
    { id: 'lemon_balm', name: 'Lemon balm',  t: { H: -1, M: 2,  B: -1 }, color: '#a8d26a', shape: 'leaf' },
    { id: 'elder',      name: 'Elderflower', t: { H: -1, M: 1,  B: 1 },  color: '#efe9cf', shape: 'flower' },
    { id: 'yarrow',     name: 'Yarrow',      t: { H: -1, M: 0,  B: 2 },  color: '#e8dccb', shape: 'flower' },
    { id: 'fennel',     name: 'Fennel seed', t: { H: 1,  M: 0,  B: -1 }, color: '#c7c26a', shape: 'berry' },
    { id: 'ginger',     name: 'Ginger',      t: { H: 3,  M: 1,  B: 0 },  color: '#d9a25b', shape: 'root' },
    { id: 'rose',       name: 'Rose petals', t: { H: -1, M: 1,  B: -2 }, color: '#d97a8c', shape: 'flower' },
    { id: 'nettle',     name: 'Nettle',      t: { H: 1,  M: 1,  B: 1 },  color: '#4f7d4a', shape: 'leaf' },
    { id: 'dandelion',  name: 'Dandelion',   t: { H: -1, M: 1,  B: 2 },  color: '#f5cc3a', shape: 'flower' },
    { id: 'valerian',   name: 'Valerian',    t: { H: 1,  M: -3, B: 0 },  color: '#c9a98a', shape: 'root' },
    { id: 'hops',       name: 'Hops',        t: { H: -1, M: -2, B: 1 },  color: '#b6cf7a', shape: 'cone' },
    { id: 'garlic',     name: 'Garlic',      t: { H: 3,  M: 0,  B: 1 },  color: '#eee6d6', shape: 'bulb' },
    { id: 'mugwort',    name: 'Mugwort',     t: { H: 1,  M: -1, B: 1 },  color: '#9aa79a', shape: 'leaf', outerOnly: true },
    // Lore only: rare, never picked or brewed. Found while foraging and left where it grows.
    { id: 'moonwort',   name: 'Moonwort',    t: null, color: '#cfd8b8', shape: 'fern', loreOnly: true },
  ];

  // How you prepare each ingredient changes its traits. 'moon' depends on the real moon tonight.
  const PROCESSES = [
    { id: 'steep', name: 'Steep', verb: 'steeped', tip: 'As it is.' },
    { id: 'grind', name: 'Grind', verb: 'ground', tip: 'Strongest trait gets stronger.' },
    { id: 'dry',   name: 'Dry',   verb: 'dried', tip: 'A little more drying.' },
    { id: 'moon',  name: 'Moonlight', verb: 'moonlit', tip: 'Waxing moon brightens, waning moon calms.' },
  ];

  // A brew is a point in trait space. The nearest one within reach is what you made; otherwise it's a dud.
  const BREWS = [
    { id: 'sleepwell',  name: 'Sleepwell Tea',      at: { H: 0,  M: -4, B: 0 },  blurb: 'Calming, and never cold.' },
    { id: 'calmnerves', name: 'Calm-Nerves Cup',    at: { H: 0,  M: -2, B: -3 }, blurb: 'Calming and soothing.' },
    { id: 'coolhead',   name: 'Cool-Head Draught',  at: { H: -3, M: -2, B: 0 },  blurb: 'Cooling and calming.' },
    { id: 'cooler',     name: 'Summer Cooler',      at: { H: -3, M: 2,  B: -1 }, blurb: 'Cooling and bright.' },
    { id: 'sunrise',    name: 'Sunrise Cordial',    at: { H: 0,  M: 4,  B: 0 },  blurb: 'Brightening, nothing else.' },
    { id: 'brisk',      name: 'Brisk Tonic',        at: { H: 3,  M: 3,  B: 0 },  blurb: 'Warming and bright.' },
    { id: 'brightwits', name: 'Bright Wits Elixir', at: { H: 1,  M: 3,  B: 3 },  blurb: 'Bright and drying.' },
    { id: 'hearth',     name: 'Hearth Brew',        at: { H: 4,  M: 0,  B: 0 },  blurb: 'Deeply warming.' },
    { id: 'fogclear',   name: 'Fog-Clearing Steam', at: { H: 2,  M: 0,  B: 4 },  blurb: 'Warm and drying.' },
    { id: 'salve',      name: 'Soothing Salve',     at: { H: 0,  M: 0,  B: -4 }, blurb: 'Soothing, for the skin.', external: true },
    { id: 'settling',   name: 'Settling Tisane',    at: { H: 3,  M: 0,  B: -2 }, blurb: 'Warming and soothing.' },
    { id: 'dreams',     name: 'Dream Pillow',       at: { H: 1,  M: -3, B: 3 },  blurb: 'Calming and dry, for under the pillow.', external: true },
    { id: 'balanced',   name: 'Kind Little Blend',  at: { H: 0,  M: 0,  B: 0 },  blurb: 'Three or more, perfectly balanced.', min: 3 },
  ];
  const REACH = 1.75; // farther than this from every brew = a dud

  // Funny named duds, by which way the brew overshoots. Still sellable, never a fail.
  const DUDS = {
    'H+': { name: 'Ember Sneeze Syrup', fx: 'sneezes a tiny puff of smoke.' },
    'H-': { name: 'Shivering Sip', fx: 'goes faintly blue at the ears for a moment.' },
    'M+': { name: 'Fizz of Overexcitement', fx: 'tells you their whole life story at speed.' },
    'M-': { name: 'Tonic of Mild Regret', fx: 'hiccups in Latin.' },
    'B+': { name: 'Dust-Mouth Draught', fx: 'coughs up a small moth.' },
    'B-': { name: 'Very Damp Tea', fx: 'squelches when they walk.' },
  };

  const FAMILIARS = {
    cat:  { name: 'Sorrel', kind: 'cat', blurb: 'Curious, a little smug, always right about drafts.', color: '#3b2f3f' },
    toad: { name: 'Burdock', kind: 'toad', blurb: 'Patient as a stone, fond of damp corners and puns.', color: '#6b7a3c' },
    crow: { name: 'Quill', kind: 'crow', blurb: 'Clever, bold, collects buttons and gossip.', color: '#1f2230' },
  };
  // Three quick questions. Each answer leans toward one familiar; ties go to the cat.
  const QUIZ = [
    { q: 'A rainy evening. Where are you?', a: [
      { t: 'Curled up somewhere warm, watching', f: 'cat' },
      { t: 'Out in the garden, listening to it', f: 'toad' },
      { t: 'At the window, counting who walks by', f: 'crow' } ] },
    { q: 'A neighbor brings you a puzzle.', a: [
      { t: 'I poke at it until it gives up', f: 'cat' },
      { t: 'I sit with it for a week', f: 'toad' },
      { t: 'I ask three friends and solve it by supper', f: 'crow' } ] },
    { q: 'Pick a treasure.', a: [
      { t: 'A sunny windowsill', f: 'cat' },
      { t: 'A smooth river stone', f: 'toad' },
      { t: 'A shiny brass button', f: 'crow' } ] },
  ];

  const VILLAGERS = {
    pell:   { name: 'Old Pell', role: 'the miller', color: '#8a6a4a' },
    wren:   { name: 'Wren', role: "the baker's apprentice", color: '#c47a5a' },
    tamsin: { name: 'Tamsin', role: 'the schoolteacher', color: '#5a6a8a' },
  };

  // Each day every villager brings one trouble. They describe a feeling, never a recipe.
  // want: the best brew; ok: brews that also help.
  const DAYS = [
    { name: 'First day', troubles: [
      { v: 'pell', text: "I lie awake half the night listening to the mill wheel. My mind just won't settle down.", want: 'sleepwell', ok: ['calmnerves', 'dreams'], tutorial: true },
      { v: 'wren', text: "My fingers are red and sore from the oven. Is there something gentle I could put on them?", want: 'salve', ok: ['calmnerves'] },
      { v: 'tamsin', text: "Chalk dust everywhere. My head feels stuffy and thick, like a damp cupboard.", want: 'fogclear', ok: ['brightwits'] } ] },
    { name: 'Second day', troubles: [
      { v: 'pell', text: "Fell in the millrace this morning. I'm chilled right to the bone and can't get warm.", want: 'hearth', ok: ['brisk', 'settling'] },
      { v: 'wren', text: "It's my first market stall tomorrow. My stomach's all flutters and I can't sit still.", want: 'calmnerves', ok: ['sleepwell', 'coolhead'] },
      { v: 'tamsin', text: "Rain all week. Everything feels grey and I can't find my spark.", want: 'sunrise', ok: ['brisk', 'cooler'] } ] },
    { name: 'Third day', troubles: [
      { v: 'pell', text: "Ate far too much at the harvest supper. My belly feels heavy and sorry for itself.", want: 'settling', ok: ['hearth'] },
      { v: 'wren', text: "The bakehouse is boiling and I keep snapping at everyone. I need to cool down.", want: 'coolhead', ok: ['cooler'] },
      { v: 'tamsin', text: "The school play is tonight and I keep forgetting the children's lines. I need my wits sharp.", want: 'brightwits', ok: ['brisk', 'sunrise'] } ] },
  ];

  // Starting pantry, and what the garden and the hedgerow add.
  const START = { coin: 10, pantry: { chamomile: 3, lavender: 2, peppermint: 2, calendula: 2, rosemary: 2, lemon_balm: 2, ginger: 2, fennel: 2, rose: 2, thyme: 2 } };
  const SEEDS = [
    { id: 'sage', cost: 3, yield: 3 }, { id: 'valerian', cost: 4, yield: 2 }, { id: 'hops', cost: 3, yield: 3 },
    { id: 'garlic', cost: 2, yield: 3 }, { id: 'mugwort', cost: 3, yield: 3 }, { id: 'chamomile', cost: 2, yield: 3 },
    { id: 'ginger', cost: 4, yield: 2 }, { id: 'lemon_balm', cost: 2, yield: 3 },
  ];
  const PLOTS = 3;
  // Hedgerow by season (northern hemisphere, from the real date). Day 2 also turns up moonwort, which you leave be.
  const FORAGE = {
    spring: ['nettle', 'dandelion', 'elder'], summer: ['elder', 'yarrow', 'rose'],
    autumn: ['nettle', 'yarrow', 'dandelion', 'rose'], winter: ['nettle', 'yarrow', 'rose'],
  };
  const PAY = { best: 6, ok: 4, other: 2, dud: 1 };
  const TRUST = { best: 2, ok: 1, other: 0, dud: 0 };

  const DATA = { AXES, INGREDIENTS, PROCESSES, BREWS, REACH, DUDS, FAMILIARS, QUIZ, VILLAGERS, DAYS, START, SEEDS, PLOTS, FORAGE, PAY, TRUST };
  root.MW_DATA = DATA;
  if (typeof module !== 'undefined') module.exports = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
