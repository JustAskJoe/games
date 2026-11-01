# CardGen in Studio HQ's Workshop (notes for a later PR)

© 2026 justaskjoe. All rights reserved.

**Status:** notes only. Nothing in `JustAskJoe/forge` or `ARCHITECTURE.md` changes in this PR. The Workshop step is a separate PR in the forge repo.

## What to vendor
- **`kit/cardgen/tool.html`** is the whole tool in one file: the core, both example profiles and the UI. It makes no external requests and needs no build step on the forge side. Copy it into the forge Worker's static assets, or fetch it from the games repo's raw URL at deploy time and pin it to a commit.
- **If the Workshop wants its own UI,** vendor only `kit/cardgen/cardgen.js`. It's browser-safe (no DOM, no node APIs) and sets the global `CardGen`. Then call `CardGen.validate`, `load` and `build` from the forge page.
- **Pin the copy to a games-repo commit,** and note it in the forge PR. When the core changes here, re-run `node kit/cardgen/build-tool.js` and re-vendor.

## Route
- **Path:** suggested `/workshop/<game>/cardgen`, under each game's Workshop page, with `/workshop/cardgen` as the general entry point (start from an example).
- **Loading a game's saved profile:** the page reads it from a query parameter or a small inline `<script type="application/json" id="ex-...">`, the same way `tool.html` embeds its examples. Swap in the game's profile there.

## Where profiles live
- **Each game keeps its profile in its own folder:** `<game>/data/cardgen-profile.json`, plus an optional `<game>/data/template-stats.json`. Card Trader already does this.
- **The Workshop lists a game's profile** by reading that path from the games repo. "Download profile JSON" in the tool produces exactly that file. A crew member commits it through a normal PR.
- **Every profile carries `"schema": 1`.** The Workshop should refuse an unknown schema version (`CardGen.validate` already says so in plain words) rather than guess.

## Not for the Workshop
- **No real-name blocklist ships to the browser.** The private name check runs on Hunter's or Zach's machine (`CG_BLOCKLIST=… node card-trader/prototype/cardgen-test.js`).
- **No raw hobby data.** Profiles and stats are aggregates only.
