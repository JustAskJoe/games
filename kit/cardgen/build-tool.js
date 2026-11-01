// Copies the current CardGen core and the example profiles into tool.html, so the tool stays one offline file.
// Run after changing cardgen.js or an example: node kit/cardgen/build-tool.js (the kit test fails if tool.html is stale).
// © 2026 justaskjoe. All rights reserved.
'use strict';
const fs = require('fs'), path = require('path');
const here = p => path.join(__dirname, p), read = p => fs.readFileSync(here(p), 'utf8');
const CardGen = require('./cardgen.js');
// JSON inside <script type="application/json">: escape "</" so a string can never close the tag.
const inline = o => JSON.stringify(o).replace(/<\//g, '<\\/');
const ct = CardGen.load(JSON.parse(read('../../card-trader/data/cardgen-profile.json')), JSON.parse(read('../../card-trader/data/template-stats.json')));
const duel = CardGen.load(JSON.parse(read('examples/duel-profile.json')));
let html = read('tool.html');
const swap = (re, text) => { if (!re.test(html)) throw new Error('tool.html is missing ' + re); html = html.replace(re, () => text); };
swap(/\/\*CARDGEN-CORE\*\/[\s\S]*?\/\*END-CARDGEN-CORE\*\//, '/*CARDGEN-CORE*/\n' + read('cardgen.js') + '\n/*END-CARDGEN-CORE*/');
swap(/(<script type="application\/json" id="ex-duel">)[\s\S]*?(<\/script>)/, '<script type="application/json" id="ex-duel">' + inline(duel) + '</script>');
swap(/(<script type="application\/json" id="ex-ct">)[\s\S]*?(<\/script>)/, '<script type="application/json" id="ex-ct">' + inline(ct) + '</script>');
fs.writeFileSync(here('tool.html'), html);
console.log('tool.html rebuilt (' + (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB)');
