// Intergalactic Card Trader · its card universe: the shared CardGen core (kit/cardgen/) with Card Trader's profile.
// Node: require('./cardgen.js'). Browser: inline kit/cardgen/cardgen.js, then
//   window.CG_PROFILE = <data/cardgen-profile.json>; window.CG_TEMPLATE = <data/template-stats.json>;
// then this file. CG.build(seed) → U. Swap guide: design/card-generator-integration.md.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';
const node = typeof module !== 'undefined' && module.exports && typeof require === 'function';
const core = node ? require('../../kit/cardgen/cardgen.js') : root.CardGen;
const profile = node ? require('../data/cardgen-profile.json') : root.CG_PROFILE;
const stats = node ? require('../data/template-stats.json') : root.CG_TEMPLATE;
const config = core.load(profile, stats); // throws with a readable list if the profile or stats are broken

// build(seed) for the game; build(seed, otherStats) to try a refit; opts: { blocklist: [real names] } (private check only)
function build(seed, s, opts) { return core.build(seed, s && s !== config ? core.load(profile, s) : config, opts); }

const CG = { build, config, core, hash: core.hash, near: core.near };
if (node) module.exports = CG; else root.CG = CG;
})(this);
