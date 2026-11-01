// Studio FX: a canvas particle layer over the stage (spray paint, spark bursts, shockwave rings), screen shake and
// mouse parallax. No dependencies; works in stage pixels (1280x720) so it scales with the letterboxed stage.
// Reusable across games (kit/snippets/game-front-end/). Respect reduced motion by not calling it.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
'use strict';
let cv = null, ctx = null, parts = [], rings = [], raf = 0, host = null;
function mount(stage) {
  if (cv && cv.parentNode === stage) return;
  cv = document.createElement('canvas'); cv.width = 1280; cv.height = 720; cv.className = 'fx-layer';
  stage.appendChild(cv); ctx = cv.getContext('2d'); parts = []; rings = [];
}
function loop() {
  if (!ctx || !cv.isConnected) { raf = 0; return; }
  ctx.clearRect(0, 0, 1280, 720);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.life--;
    const a = Math.min(1, p.life / p.fade);
    ctx.globalAlpha = a; ctx.fillStyle = p.c;
    if (p.kind === 'spark') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.fillRect(-p.s * 2, -p.s / 3, p.s * 4, p.s * 0.66); ctx.restore(); }
    else if (p.kind === 'drip') { ctx.fillRect(p.x - 1.5, p.y0, 3, p.y - p.y0); ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); }
  }
  rings = rings.filter(r => r.t < 1);
  for (const r of rings) { r.t += 0.035; ctx.globalAlpha = 1 - r.t; ctx.strokeStyle = '#fff'; ctx.lineWidth = 10 * (1 - r.t) + 1; ctx.beginPath(); ctx.arc(r.x, r.y, 40 + r.t * 520, 0, 7); ctx.stroke(); }
  ctx.globalAlpha = 1;
  raf = parts.length || rings.length ? requestAnimationFrame(loop) : 0;
}
function kick() { if (!raf) raf = requestAnimationFrame(loop); }
// A spray-paint pass left to right across a band: soft dots, overspray and a few drips.
// ms sets the pace per step (46 steps); 14 is a quick pass, 26 matches a slower tag reveal.
function spray(cx, cy, width, colors, ms) {
  const steps = 46; ms = ms || 14;
  for (let i = 0; i < steps; i++) setTimeout(() => {
    const x = cx + (i / steps) * width, c = colors[i % colors.length];
    for (let k = 0; k < 14; k++) parts.push({ kind: 'dot', x: x + (Math.random() - 0.5) * 30, y: cy + (Math.random() - 0.5) * 60, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, g: 0, drag: 0.96, s: Math.random() * 2.4 + 0.6, c, life: 50 + Math.random() * 30, fade: 25 });
    if (i % 9 === 4) { const y = cy + 20; parts.push({ kind: 'drip', x, y, y0: y, vx: 0, vy: 0.9, g: 0.02, drag: 1, s: 2, c, life: 70, fade: 20 }); }
    kick();
  }, i * ms);
}
// A burst of sparks and confetti from a point.
function burst(x, y, n, colors, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = (Math.random() * 0.7 + 0.3) * speed;
    parts.push({ kind: i % 3 ? 'spark' : 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: 0.25, drag: 0.965, s: Math.random() * 3 + 2, c: colors[i % colors.length], life: 45 + Math.random() * 35, fade: 20 });
  }
  kick();
}
function ring(x, y) { rings.push({ x, y, t: 0 }); kick(); }
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 500); }
// Layers marked .par[data-depth] drift against the mouse for depth.
function onMove(e) {
  if (!host) return;
  const r = host.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
  for (const el of host.querySelectorAll('.par')) { const d = +el.dataset.depth || 0; el.style.transform = `translate(${nx * d}px, ${ny * d}px)`; }
}
function parallax(stage) { host = stage; if (!parallax.bound) { addEventListener('mousemove', onMove); parallax.bound = true; } }
root.FX = { mount, spray, burst, ring, shake, parallax };
})(this);
