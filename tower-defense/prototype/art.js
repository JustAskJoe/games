/* Tower Defense Prototype 1 — vector art. Ink linework over flat painterly color.
   © 2026 F Lane d/b/a One Fifty Labs. All rights reserved.
   Everything here draws on a canvas 2D context in cell units (the renderer scales).
   Placeholder art in the chosen direction: teal slate, warm timber, cream plaster, moss. */
(function () {
  'use strict';
  const INK = '#3A2518', TEAL = '#4E8F86', TEAL2 = '#3A6E67', TIMBER = '#6B4226', TIMBER2 = '#4E2F1A', PLASTER = '#F7EEDC', PLASTER2 = '#E6D6B8', MOSS = '#6E9A4C', MOSS2 = '#4F7A33', GOLD = '#D9A441', RUST = '#B8533A', FROST = '#8FC8D8', SPARK = '#4F8FD6', STONE = '#9A9CA3', STONE2 = '#6F7178';

  function ink(ctx, w) { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
  function poly(ctx, pts, fill, lw) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ink(ctx, lw); ctx.stroke(); } }
  function rect(ctx, x, y, w, h, fill, lw, r) {
    ctx.beginPath(); if (r) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ink(ctx, lw); ctx.stroke(); }
  }
  function circ(ctx, x, y, r, fill, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ink(ctx, lw); ctx.stroke(); } }
  function shade(ctx, x, y, w, h, a) { ctx.fillStyle = `rgba(58,37,24,${a})`; ctx.fillRect(x, y, w, h); }

  // ---------- ground ----------
  function grass(ctx, x, y, s, seed) {
    ctx.fillStyle = (seed % 3 === 0) ? '#75A152' : MOSS; ctx.fillRect(x, y, s, s);
    // a few blades
    ctx.strokeStyle = MOSS2; ctx.lineWidth = s * .03;
    for (let i = 0; i < 3; i++) { const gx = x + ((seed * 37 + i * 53) % 80) / 100 * s + s * .1, gy = y + ((seed * 19 + i * 71) % 80) / 100 * s + s * .1; ctx.beginPath(); ctx.moveTo(gx, gy + s * .08); ctx.lineTo(gx + s * .03, gy - s * .06); ctx.stroke(); }
  }
  function road(ctx, x, y, s, seed, future) {
    if (future) { ctx.fillStyle = 'rgba(241,228,204,.35)'; ctx.fillRect(x, y, s, s); ctx.setLineDash([s * .12, s * .1]); ink(ctx, s * .04); ctx.strokeStyle = 'rgba(58,37,24,.55)'; ctx.strokeRect(x + s * .08, y + s * .08, s * .84, s * .84); ctx.setLineDash([]); return; }
    ctx.fillStyle = '#C9A77A'; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#B8935F';
    for (let i = 0; i < 3; i++) { const px = x + ((seed * 31 + i * 47) % 70) / 100 * s + s * .1, py = y + ((seed * 13 + i * 59) % 70) / 100 * s + s * .1; circ(ctx, px, py, s * .05, '#B8935F'); }
  }
  function spot(ctx, x, y, s, free, hot) {
    ctx.save(); ctx.translate(x + s / 2, y + s / 2);
    // a stone plinth
    poly(ctx, [[-s * .36, s * .1], [s * .36, s * .1], [s * .3, s * .3], [-s * .3, s * .3]], STONE2, 0);
    poly(ctx, [[-s * .36, -s * .06], [s * .36, -s * .06], [s * .36, s * .1], [-s * .36, s * .1]], STONE, s * .035);
    if (free) { ctx.setLineDash([s * .08, s * .07]); ink(ctx, s * .04); ctx.strokeStyle = hot ? GOLD : 'rgba(58,37,24,.6)'; circ(ctx, 0, 0, s * .4, null, s * .04); ctx.setLineDash([]); if (hot) { ctx.fillStyle = GOLD; ctx.font = `bold ${s * .5}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', 0, -s * .02); } }
    ctx.restore();
  }

  // ---------- the keep ----------
  function keepArt(ctx, x, y, s, hurt) {
    ctx.save(); ctx.translate(x + s / 2, y + s / 2);
    const k = s * 1.15; // slightly bigger than a cell
    // walls
    rect(ctx, -k * .42, -k * .12, k * .84, k * .5, PLASTER, k * .045, k * .04);
    shade(ctx, -k * .42, k * .22, k * .84, k * .16, .12);
    // timber frame lines
    ctx.strokeStyle = TIMBER; ctx.lineWidth = k * .035;
    ctx.beginPath(); ctx.moveTo(-k * .42, k * .12); ctx.lineTo(k * .42, k * .12); ctx.moveTo(-k * .14, -k * .12); ctx.lineTo(-k * .14, k * .38); ctx.moveTo(k * .14, -k * .12); ctx.lineTo(k * .14, k * .38); ctx.stroke();
    // door
    rect(ctx, -k * .09, k * .1, k * .18, k * .28, TIMBER2, k * .035, [k * .09, k * .09, 0, 0]);
    // towers either side
    rect(ctx, -k * .5, -k * .28, k * .2, k * .66, PLASTER2, k * .045, k * .02);
    rect(ctx, k * .3, -k * .28, k * .2, k * .66, PLASTER2, k * .045, k * .02);
    // teal slate roofs
    poly(ctx, [[-k * .54, -k * .28], [-k * .4, -k * .55], [-k * .26, -k * .28]], TEAL, k * .045);
    poly(ctx, [[k * .26, -k * .28], [k * .4, -k * .55], [k * .54, -k * .28]], TEAL, k * .045);
    poly(ctx, [[-k * .34, -k * .12], [0, -k * .44], [k * .34, -k * .12]], TEAL2, k * .045);
    // slate lines
    ctx.strokeStyle = 'rgba(58,37,24,.35)'; ctx.lineWidth = k * .02;
    ctx.beginPath(); ctx.moveTo(-k * .2, -k * .25); ctx.lineTo(k * .2, -k * .25); ctx.moveTo(-k * .1, -k * .34); ctx.lineTo(k * .1, -k * .34); ctx.stroke();
    // banner
    ctx.fillStyle = hurt ? RUST : GOLD; ctx.beginPath(); ctx.moveTo(0, -k * .44); ctx.lineTo(0, -k * .62); ctx.lineTo(k * .16, -k * .57); ctx.lineTo(0, -k * .52); ctx.closePath(); ctx.fill(); ink(ctx, k * .03); ctx.stroke();
    // ivy
    circ(ctx, -k * .3, k * .3, k * .09, MOSS); circ(ctx, -k * .22, k * .36, k * .07, MOSS2); circ(ctx, k * .36, k * .34, k * .08, MOSS);
    ctx.restore();
  }

  // ---------- towers ----------
  const TOWER_ART = {
    arrow(ctx, s, tier, branch) {
      // wooden archer platform with a teal slate cap
      rect(ctx, -s * .22, -s * .1, s * .44, s * .42, TIMBER, s * .04, s * .03);
      ctx.strokeStyle = TIMBER2; ctx.lineWidth = s * .025; ctx.beginPath(); ctx.moveTo(-s * .22, -s * .1); ctx.lineTo(s * .22, s * .32); ctx.moveTo(s * .22, -s * .1); ctx.lineTo(-s * .22, s * .32); ctx.stroke();
      rect(ctx, -s * .28, -s * .22, s * .56, s * .14, PLASTER, s * .04, s * .02);
      poly(ctx, [[-s * .32, -s * .22], [0, -s * .5], [s * .32, -s * .22]], TEAL, s * .04);
      // bow
      ink(ctx, s * .035); ctx.beginPath(); ctx.arc(s * .02, -s * .32, s * .12, -Math.PI * .5, Math.PI * .5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * .02, -s * .44); ctx.lineTo(s * .02, -s * .2); ctx.stroke();
      if (tier === 2) { ctx.fillStyle = branch === 'A' ? RUST : GOLD; circ(ctx, s * .2, -s * .42, s * .07, null, s * .03); circ(ctx, s * .2, -s * .42, s * .07, branch === 'A' ? RUST : GOLD); }
    },
    cannon(ctx, s, tier, branch) {
      rect(ctx, -s * .28, -s * .04, s * .56, s * .38, STONE, s * .04, s * .04);
      ctx.strokeStyle = STONE2; ctx.lineWidth = s * .02; ctx.beginPath(); ctx.moveTo(-s * .28, s * .15); ctx.lineTo(s * .28, s * .15); ctx.moveTo(0, -s * .04); ctx.lineTo(0, s * .15); ctx.moveTo(-s * .14, s * .15); ctx.lineTo(-s * .14, s * .34); ctx.moveTo(s * .14, s * .15); ctx.lineTo(s * .14, s * .34); ctx.stroke();
      // barrel
      ctx.save(); ctx.translate(0, -s * .12); ctx.rotate(-0.5);
      rect(ctx, -s * .08, -s * .3, s * .16, s * .34, tier === 2 ? '#3F3A44' : '#55505C', s * .04, s * .04);
      circ(ctx, 0, -s * .3, s * .09, '#2A262E', s * .035);
      ctx.restore();
      circ(ctx, 0, s * .02, s * .1, TIMBER, s * .035);
      if (tier === 2) circ(ctx, s * .2, -s * .18, s * .07, branch === 'A' ? RUST : GOLD, s * .03);
    },
    spark(ctx, s, tier, branch) {
      // tall copper spire
      poly(ctx, [[-s * .16, s * .34], [s * .16, s * .34], [s * .08, -s * .2], [-s * .08, -s * .2]], '#B07A3C', s * .04);
      poly(ctx, [[-s * .08, -s * .2], [s * .08, -s * .2], [0, -s * .48]], '#8E5F2C', s * .04);
      circ(ctx, 0, -s * .5, s * .09, SPARK, s * .035);
      ctx.strokeStyle = '#DCEFFF'; ctx.lineWidth = s * .03; ctx.beginPath(); ctx.moveTo(-s * .05, -s * .62); ctx.lineTo(s * .02, -s * .54); ctx.lineTo(-s * .02, -s * .5); ctx.lineTo(s * .05, -s * .4); ctx.stroke();
      if (tier === 2) { ctx.strokeStyle = SPARK; ctx.lineWidth = s * .03; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -s * .5, s * .16 + i * s * .06, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
    },
    frost(ctx, s, tier, branch) {
      rect(ctx, -s * .22, s * .02, s * .44, s * .32, PLASTER2, s * .04, s * .03);
      ctx.strokeStyle = TIMBER; ctx.lineWidth = s * .03; ctx.beginPath(); ctx.moveTo(-s * .22, s * .18); ctx.lineTo(s * .22, s * .18); ctx.stroke();
      // crystal
      poly(ctx, [[-s * .14, s * .02], [0, -s * .5], [s * .14, s * .02]], FROST, s * .04);
      poly(ctx, [[-s * .14, s * .02], [0, -s * .5], [-s * .02, s * .02]], '#C7E6EE', 0);
      poly(ctx, [[-s * .24, -s * .1], [-s * .12, -s * .34], [-s * .06, -s * .02]], FROST, s * .035);
      poly(ctx, [[s * .24, -s * .1], [s * .12, -s * .3], [s * .06, -s * .02]], FROST, s * .035);
      if (tier === 2) circ(ctx, 0, -s * .58, s * .07, branch === 'A' ? '#DCEFFF' : GOLD, s * .03);
    },
  };
  function towerArt(ctx, type, x, y, s, tier, branch, firing) {
    ctx.save(); ctx.translate(x + s / 2, y + s / 2 + s * .02);
    // shadow
    ctx.fillStyle = 'rgba(58,37,24,.25)'; ctx.beginPath(); ctx.ellipse(0, s * .36, s * .3, s * .09, 0, 0, Math.PI * 2); ctx.fill();
    if (firing) { ctx.translate(0, -s * .02); }
    TOWER_ART[type](ctx, s, tier, branch);
    if (tier === 2) { // tier ribbon
      ctx.fillStyle = branch === 'A' ? RUST : GOLD; ctx.font = `bold ${s * .18}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      rect(ctx, -s * .12, s * .3, s * .24, s * .16, branch === 'A' ? RUST : GOLD, s * .025, s * .04); ctx.fillStyle = INK; ctx.fillText('II', 0, s * .385);
    }
    ctx.restore();
  }
  function towerIconSVG(type) {
    // for buttons: render once to an offscreen canvas and return a data URL
    const c = document.createElement('canvas'); c.width = c.height = 96; const ctx = c.getContext('2d');
    towerArt(ctx, type, 0, 6, 84, 1, null, false);
    return c.toDataURL();
  }

  // ---------- enemies ----------
  const ENEMY_ART = {
    grunt(ctx, s, t) {
      const bob = Math.sin(t * 9) * s * .02;
      poly(ctx, [[-s * .16, s * .16], [s * .16, s * .16], [s * .13, -s * .12 + bob], [-s * .13, -s * .12 + bob]], '#8C6D4F', s * .035); // body
      circ(ctx, 0, -s * .2 + bob, s * .13, '#C9A077', s * .035); // head
      circ(ctx, -s * .05, -s * .22 + bob, s * .02, INK); circ(ctx, s * .05, -s * .22 + bob, s * .02, INK);
      rect(ctx, s * .1, -s * .3 + bob, s * .05, s * .34, TIMBER, s * .025); // club
    },
    runner(ctx, s, t) {
      const lean = Math.sin(t * 16) * s * .03;
      poly(ctx, [[-s * .14, s * .14], [s * .1, s * .14], [s * .16 + lean, -s * .08], [-s * .06 + lean, -s * .12]], '#D9A441', s * .035);
      circ(ctx, s * .1 + lean, -s * .18, s * .1, '#F0C66A', s * .035);
      circ(ctx, s * .13 + lean, -s * .19, s * .02, INK);
      ctx.strokeStyle = INK; ctx.lineWidth = s * .03; ctx.beginPath(); ctx.moveTo(-s * .1, s * .14); ctx.lineTo(-s * .2 - lean, s * .24); ctx.moveTo(s * .06, s * .14); ctx.lineTo(s * .12 + lean, s * .26); ctx.stroke();
    },
    flyer(ctx, s, t) {
      const flap = Math.sin(t * 14) * s * .12;
      ctx.translate(0, -s * .14 + Math.sin(t * 5) * s * .03);
      poly(ctx, [[-s * .06, 0], [-s * .34, -s * .1 - flap], [-s * .3, s * .06 - flap * .5]], '#9FB7E8', s * .03);
      poly(ctx, [[s * .06, 0], [s * .34, -s * .1 - flap], [s * .3, s * .06 - flap * .5]], '#9FB7E8', s * .03);
      ctx.beginPath(); ctx.ellipse(0, 0, s * .1, s * .14, 0, 0, Math.PI * 2); ctx.fillStyle = '#7A93CC'; ctx.fill(); ink(ctx, s * .035); ctx.stroke();
      circ(ctx, 0, -s * .1, s * .07, '#B9CBF0', s * .03); circ(ctx, -s * .025, -s * .11, s * .015, INK); circ(ctx, s * .025, -s * .11, s * .015, INK);
    },
    brute(ctx, s, t) {
      const bob = Math.sin(t * 6) * s * .02;
      poly(ctx, [[-s * .24, s * .2], [s * .24, s * .2], [s * .22, -s * .16 + bob], [-s * .22, -s * .16 + bob]], '#5E6B73', s * .04); // armored body
      ctx.strokeStyle = '#3F474D'; ctx.lineWidth = s * .025; ctx.beginPath(); ctx.moveTo(-s * .2, 0 + bob); ctx.lineTo(s * .2, 0 + bob); ctx.moveTo(-s * .18, s * .1); ctx.lineTo(s * .18, s * .1); ctx.stroke();
      rect(ctx, -s * .14, -s * .34 + bob, s * .28, s * .2, '#7E8A91', s * .035, s * .04); // helm
      rect(ctx, -s * .09, -s * .26 + bob, s * .18, s * .04, INK); // visor
      rect(ctx, -s * .36, -s * .22 + bob, s * .09, s * .4, '#8C6D4F', s * .03, s * .02); // shield
    },
    boss(ctx, s, t) {
      const bob = Math.sin(t * 4) * s * .03;
      poly(ctx, [[-s * .34, s * .3], [s * .34, s * .3], [s * .3, -s * .18 + bob], [-s * .3, -s * .18 + bob]], '#A3382E', s * .045);
      shade(ctx, -s * .3, s * .1, s * .6, s * .2, .15);
      rect(ctx, -s * .18, -s * .4 + bob, s * .36, s * .26, '#7A2A22', s * .04, s * .05);
      // horns
      poly(ctx, [[-s * .18, -s * .36 + bob], [-s * .36, -s * .62 + bob], [-s * .1, -s * .42 + bob]], '#E6D6B8', s * .035);
      poly(ctx, [[s * .18, -s * .36 + bob], [s * .36, -s * .62 + bob], [s * .1, -s * .42 + bob]], '#E6D6B8', s * .035);
      circ(ctx, -s * .07, -s * .28 + bob, s * .03, GOLD); circ(ctx, s * .07, -s * .28 + bob, s * .03, GOLD);
      rect(ctx, s * .3, -s * .5 + bob, s * .06, s * .7, TIMBER2, s * .03); poly(ctx, [[s * .33, -s * .5 + bob], [s * .2, -s * .6 + bob], [s * .46, -s * .6 + bob]], STONE, s * .03); // axe
    },
  };
  function enemyArt(ctx, type, x, y, s, t, hpFrac, slowed) {
    ctx.save(); ctx.translate(x, y);
    const sz = type === 'boss' ? s * 1.5 : type === 'brute' ? s * 1.15 : s * .95;
    if (type !== 'flyer') { ctx.fillStyle = 'rgba(58,37,24,.25)'; ctx.beginPath(); ctx.ellipse(0, sz * .22, sz * .22, sz * .07, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(58,37,24,.15)'; ctx.beginPath(); ctx.ellipse(0, sz * .3, sz * .16, sz * .05, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ENEMY_ART[type](ctx, sz, t); ctx.restore();
    if (slowed) { ctx.fillStyle = 'rgba(143,200,216,.45)'; circ(ctx, 0, -sz * .05, sz * .3, 'rgba(143,200,216,.4)'); ctx.strokeStyle = FROST; ctx.lineWidth = sz * .03; ctx.beginPath(); ctx.arc(0, -sz * .05, sz * .3, 0, Math.PI * 2); ctx.stroke(); }
    if (hpFrac < 1) { // hp bar
      const w = sz * .5; rect(ctx, -w / 2, -sz * .5, w, sz * .07, '#2A1A12', 0, 2);
      rect(ctx, -w / 2, -sz * .5, w * hpFrac, sz * .07, hpFrac > .5 ? '#7FC06C' : hpFrac > .25 ? GOLD : RUST, 0, 2);
      ink(ctx, sz * .018); ctx.strokeRect(-w / 2, -sz * .5, w, sz * .07);
    }
    ctx.restore();
  }

  // ---------- the coach's face ----------
  const COACH_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="20" fill="#F0C66A" stroke="#3A2518" stroke-width="3"/><path d="M12 30 Q32 6 52 30 Q44 22 32 24 Q20 22 12 30z" fill="#4E8F86" stroke="#3A2518" stroke-width="3" stroke-linejoin="round"/><circle cx="25" cy="36" r="2.5" fill="#3A2518"/><circle cx="39" cy="36" r="2.5" fill="#3A2518"/><path d="M24 44 Q32 50 40 44" stroke="#3A2518" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M46 26 l6 -10" stroke="#3A2518" stroke-width="3" stroke-linecap="round"/></svg>`;

  window.TDArt = { towerArt, towerIconSVG, enemyArt, keepArt, grass, road, spot, COACH_SVG, INK, GOLD, RUST, FROST, SPARK, TEAL, MOSS, PLASTER };
})();
