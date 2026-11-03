// Moonwort & Co. audio: tiny synthesized sounds (taps, bubbles, chimes). No samples, no licensed music.
// © 2026 justaskjoe. All rights reserved.
(function (root) {
  let ctx = null;
  const A = { on: true };
  try { A.on = localStorage.getItem('moonwort-sound') !== 'off'; } catch (e) {}
  A.unlock = () => { if (!ctx && A.on) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ctx && ctx.state === 'suspended') ctx.resume(); };
  A.toggle = () => { A.on = !A.on; try { localStorage.setItem('moonwort-sound', A.on ? 'on' : 'off'); } catch (e) {} };
  function tone(f, dur, type, vol, slide) {
    if (!A.on || !ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  A.tap = () => tone(520, 0.06, 'triangle', 0.05);
  A.bubble = () => tone(220 + Math.random() * 120, 0.18, 'sine', 0.07, 520);
  A.chime = good => { (good ? [523, 659, 784] : [392, 370, 349]).forEach((f, i) => setTimeout(() => tone(f, 0.35, 'sine', 0.06), i * 110)); };
  root.MWAUDIO = A;
})(window);
