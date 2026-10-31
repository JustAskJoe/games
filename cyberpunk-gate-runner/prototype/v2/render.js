/* Cyberpunk Gate Runner, Prototype 2: WebGL street (three.js r159, window.GRR). Draws only: it reads the engine state
   and never changes it. Everything is built in code: models from boxes and low-poly shapes, the road, sky and towers
   from shaders. Road x is -1..1, z is seconds ahead of the squad. Quality tiers: 2 full, 1 lighter, 0 no bloom.
   Add #q=0, #q=1 or #q=2 to the URL to lock a tier.
   © 2026 justaskjoe. All rights reserved. */
(function () {
  const T = window.THREE, GR = window.GR;
  const RW = 3.4, ZS = 10, AHEAD = 4.6, SIGN_TILT = 0.24;     // road half width, world units per second of song, seconds drawn ahead
  const wx = x => x * RW, wz = z => -z * ZS;
  const R = { ok: false, quality: 2, locked: false, RW, ZS };
  const COL = { cyan: '#3DF0FF', pink: '#FF3DA8', pink2: '#FF7AD0', violet: '#8B5CFF', gold: '#FFB547', green: '#4BFFA5', red: '#FF4D6D', white: '#FFFFFF', steel: '#1B2148', ink: '#0B0E2C', plum: '#3A1050' };
  const FOG = new T.Color('#1C0B3E');
  const UF = { uFog: { value: FOG }, uFogR: { value: new T.Vector2(30, 60) }, uT: { value: 0 }, uPulse: { value: 0 }, uOC: { value: 0 }, uCharge: { value: 0 } };

  // ---------- geometry helpers: non-indexed parts merged into one mesh, with colour and glow per vertex ----------
  const M = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(new T.Vector3(x || 0, y || 0, z || 0), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx || 1, sy || sx || 1, sz || sx || 1));
  function part(geo, col, glow, m) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m) g.applyMatrix4(m);
    const n = g.attributes.position.count, c = new T.Color(col), ca = new Float32Array(n * 3), ga = new Float32Array(n).fill(glow || 0);
    for (let i = 0; i < n; i++) { ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T.BufferAttribute(ca, 3)); g.setAttribute('aGlow', new T.BufferAttribute(ga, 1)); return g;
  }
  const box = (w, h, d, x, y, z, col, glow, rx, ry, rz) => part(new T.BoxGeometry(w, h, d), col, glow, M(x, y, z, rx, ry, rz));
  function merge(list) {
    const out = new T.BufferGeometry();
    for (const [name, size] of [['position', 3], ['normal', 3], ['color', 3], ['aGlow', 1]]) {
      const total = list.reduce((a, g) => a + g.attributes[name].array.length, 0), arr = new Float32Array(total); let o = 0;
      for (const g of list) { arr.set(g.attributes[name].array, o); o += g.attributes[name].array.length; }
      out.setAttribute(name, new T.BufferAttribute(arr, size));
    }
    return out;
  }

  // ---------- the one material for models: lit body, rim light, glowing parts ----------
  const neonMat = () => new T.ShaderMaterial({
    uniforms: Object.assign({ uGlow: { value: 3.2 } }, UF),
    vertexShader: `attribute vec3 color; attribute float aGlow; attribute vec3 aTint; varying vec3 vC, vN, vW; varying float vG;
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vC = color * aTint; vG = aGlow; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uFog; uniform vec2 uFogR; uniform float uGlow; varying vec3 vC, vN, vW; varying float vG;
      void main(){ vec3 V = normalize(cameraPosition - vW), N = normalize(vN); float d = max(dot(N, normalize(vec3(.3, .8, .5))), 0.), rim = pow(1. - max(dot(N, V), 0.), 2.5);
        vec3 c = vC * (.34 + .66 * d) + vC * rim * .9; c = mix(c, vC * uGlow, vG);
        gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW))), 1.); }`
  });
  function inst(geo, cap) {
    const g = geo.clone(), mesh = new T.InstancedMesh(g, neonMat(), cap);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.frustumCulled = false; mesh.count = 0;
    const a = new T.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3); a.setUsage(T.DynamicDrawUsage); g.setAttribute('aTint', a); mesh.tint = a;
    return mesh;
  }
  const dm = new T.Object3D(), tc = new T.Color();
  function put(mesh, x, y, z, s, ry, rz, col, boost) {
    const i = mesh.count++; dm.position.set(x, y, z); dm.rotation.set(0, ry || 0, rz || 0); dm.scale.setScalar(s || 1); dm.updateMatrix(); mesh.setMatrixAt(i, dm.matrix);
    tc.set(col || COL.white); const b = boost || 1; mesh.tint.setXYZ(i, tc.r * b, tc.g * b, tc.b * b);
  }
  const begin = m => { m.count = 0; };
  const end = m => { m.instanceMatrix.needsUpdate = true; m.tint.needsUpdate = true; };

  // ---------- models ----------
  function runnerGeo() {
    const s = new T.SphereGeometry(0.15, 8, 6);
    return merge([
      box(0.3, 0.42, 0.2, 0, 0.58, 0, COL.white), box(0.34, 0.1, 0.24, 0, 0.72, 0, COL.ink), part(s, COL.steel, 0, M(0, 0.93, 0)), box(0.26, 0.06, 0.04, 0, 0.94, -0.14, COL.white, 1),
      box(0.11, 0.36, 0.13, -0.09, 0.18, 0, COL.ink), box(0.11, 0.36, 0.13, 0.09, 0.18, 0, COL.ink),
      box(0.07, 0.07, 0.46, 0.2, 0.6, -0.2, COL.ink), box(0.03, 0.03, 0.16, 0.2, 0.6, -0.48, COL.white, 1)
    ]);
  }
  function droneGeo() {
    const body = new T.OctahedronGeometry(0.46, 0), ring = new T.TorusGeometry(0.62, 0.035, 4, 14), core = new T.SphereGeometry(0.16, 8, 6);
    return merge([part(body, COL.plum, 0, M(0, 0, 0, 0, 0, 0, 1, 0.72, 1)), part(ring, COL.white, 1, M(0, 0, 0, Math.PI / 2)), part(core, COL.white, 1, M(0, 0, 0.32))]);
  }
  function swarmGeo() {
    const body = new T.OctahedronGeometry(0.3, 0), core = new T.SphereGeometry(0.1, 6, 4);
    return merge([part(body, COL.plum, 0, M(0, 0, 0, 0, 0, 0, 1, 1.3, 1)), box(0.5, 0.03, 0.05, 0, 0.02, 0, COL.white, 1), part(core, COL.white, 1, M(0, 0.05, 0.24))]);
  }
  function bikerGeo() {
    const wheel = new T.CylinderGeometry(0.34, 0.34, 0.16, 10);
    return merge([
      box(0.46, 0.34, 1.5, 0, 0.5, 0, COL.ink), box(0.5, 0.1, 1.54, 0, 0.72, 0, COL.white, 1), box(0.4, 0.62, 0.34, 0, 1.02, 0.1, COL.white), box(0.3, 0.26, 0.3, 0, 1.46, 0.02, COL.ink), box(0.26, 0.06, 0.06, 0, 1.48, 0.16, COL.gold, 1),
      part(wheel, COL.ink, 0, M(0, 0.34, 0.62, 0, 0, Math.PI / 2)), part(wheel, COL.ink, 0, M(0, 0.34, -0.62, 0, 0, Math.PI / 2)), box(0.34, 0.1, 0.05, 0, 0.56, -0.78, COL.white, 1)
    ]);
  }
  function crateGeo() {
    return merge([box(1, 1, 1, 0, 0.5, 0, COL.gold), box(1.06, 0.07, 1.06, 0, 0.98, 0, COL.white, 1), box(1.06, 0.07, 1.06, 0, 0.02, 0, COL.white, 1), box(1.06, 0.07, 1.06, 0, 0.5, 0, COL.white, 1), box(0.4, 0.4, 1.04, 0, 0.5, 0, COL.white, 1)]);
  }
  function bossGeo() {
    const eye = new T.CylinderGeometry(0.42, 0.42, 0.2, 12), ring = new T.TorusGeometry(2.9, 0.07, 5, 28);
    return merge([
      box(1, 2.5, 1, -1.05, 1.25, 0, COL.ink), box(1, 2.5, 1, 1.05, 1.25, 0, COL.ink), box(1.3, 0.34, 1.5, -1.05, 0.17, 0.12, COL.plum), box(1.3, 0.34, 1.5, 1.05, 0.17, 0.12, COL.plum),
      box(3.5, 2.5, 1.7, 0, 3.6, 0, COL.plum), box(2.5, 1.5, 0.2, 0, 3.8, 0.92, COL.ink), box(4.2, 0.1, 1.8, 0, 2.5, 0, COL.pink, 1), box(4.2, 0.1, 1.8, 0, 4.8, 0, COL.pink, 1),
      box(1.8, 1.05, 1.3, 0, 5.4, 0, COL.ink), box(1.5, 0.2, 0.1, 0, 5.46, 0.7, COL.white, 1), box(0.12, 0.8, 0.12, -0.7, 6.2, 0, COL.pink, 1), box(0.12, 0.8, 0.12, 0.7, 6.2, 0, COL.pink, 1),
      part(eye, COL.pink, 1, M(0, 3.8, 1.02, Math.PI / 2)),
      box(1.2, 1.2, 1.5, -2.55, 4.5, 0, COL.ink), box(1.2, 1.2, 1.5, 2.55, 4.5, 0, COL.ink), box(0.95, 2.5, 1, -2.7, 2.9, 0, COL.plum), box(0.95, 2.5, 1, 2.7, 2.9, 0, COL.plum),
      box(0.55, 0.55, 1.8, -2.7, 1.8, 0.6, COL.ink), box(0.55, 0.55, 1.8, 2.7, 1.8, 0.6, COL.ink), box(0.3, 0.3, 0.1, -2.7, 1.8, 1.54, COL.white, 1), box(0.3, 0.3, 0.1, 2.7, 1.8, 1.54, COL.white, 1),
      part(ring, COL.pink2, 1, M(0, 3.4, -0.9))
    ]);
  }
  function archGeo() {
    const w = RW * 1.32, h = 8;
    return merge([box(0.3, h, 0.3, -w, h / 2, 0, COL.ink), box(0.3, h, 0.3, w, h / 2, 0, COL.ink), box(w * 2 + 0.3, 0.3, 0.3, 0, h, 0, COL.ink), box(0.1, h, 0.34, -w + 0.2, h / 2, 0, COL.white, 1), box(0.1, h, 0.34, w - 0.2, h / 2, 0, COL.white, 1), box(w * 2, 0.1, 0.34, 0, h - 0.2, 0, COL.white, 1)]);
  }

  // ---------- towers: procedural lit windows, a neon line on the roof ----------
  const towerMat = fogR => new T.ShaderMaterial({
    uniforms: Object.assign({}, UF, { uFogR: { value: fogR } }),
    vertexShader: `attribute vec3 aTint; attribute float aSeed; varying vec3 vP, vN, vW, vT, vS; varying float vR;
      void main(){ vS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vP = position * vS; vN = normal; vT = aTint; vR = aSeed;
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uFog; uniform vec2 uFogR; uniform float uPulse, uOC, uCharge; varying vec3 vP, vN, vW, vT, vS; varying float vR;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      void main(){ vec2 uv = abs(vN.x) > .5 ? vec2(vP.z, vP.y) : vec2(vP.x, vP.y); vec2 cell = vec2(.72, .98), id = floor(uv / cell), f = fract(uv / cell);
        float win = step(.18, f.x) * step(f.x, .82) * step(.25, f.y) * step(f.y, .75), r = h(id + floor(vR * 91. + .5)), on = step(.9 - .26 * uCharge - .12 * uOC, r) * win * step(abs(vN.y), .5);
        vec3 c = vec3(.006, .007, .024) + vec3(.008, .005, .03) * (vP.y / vS.y), lit = mix(vT, vec3(1., .78, .5), step(.84, r));
        c += lit * on * (.5 + .7 * uPulse * step(.8, r));
        c += vT * (.5 + 1.5 * uCharge + 1.2 * uOC) * smoothstep(vS.y - .26, vS.y - .12, vP.y) * step(abs(vN.y), .5);
        gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW))), 1.); }`
  });

  // ---------- state ----------
  let renderer, scene, cam, rtS, rtA, rtB, fsScene, fsCam, fsQuad, mats = {}, W = 1, H = 1, DPR = 1, road, sky, runners, picks, drones, swarm, bikers, crate, boss, arches, rails, near, billboards, towerData = [], gates = [], parts = [], tracers = [], pts, lines, pi = 0;
  const camBase = new T.Vector3(0, 6.6, 9.2), look = new T.Vector3(), PN = 1600, TN = 90, v3 = new T.Vector3();
  const frameMs = [], shocks = []; let lastPerf = 0, slowCheck = 0, shockI = 0, lastBeat = -1, punch = 0, baseFov = 52, bossHp = 0, bossHit = 0;

  function buildRoad() {
    const m = new T.ShaderMaterial({
      uniforms: Object.assign({ uSq: { value: new T.Vector2() }, uSqR: { value: 1 }, uSplit: { value: new T.Vector3() } }, UF), defines: { RW: RW.toFixed(2), ZS: ZS.toFixed(2), BEAT: (GR.B * ZS).toFixed(4) },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 uFog; uniform vec2 uFogR, uSq; uniform vec3 uSplit; uniform float uT, uPulse, uOC, uSqR; varying vec3 vW;
        void main(){ float x = vW.x, ax = abs(x), z = vW.z - uT * ZS, dist = length(cameraPosition - vW), on = 1. - smoothstep(RW * 1.03, RW * 1.05, ax);
          vec3 c = mix(vec3(.003, .003, .01), vec3(.006, .007, .024), on);
          float bz = abs(fract(z / BEAT + .5) - .5) * BEAT, bar = abs(fract(z / (BEAT * 4.) + .5) - .5) * BEAT * 4.;
          vec3 acc = mix(vec3(.55, .25, 1.), vec3(1., .16, .6), uOC);
          c += on * acc * (smoothstep(.05, .0, bz) * (.05 + .14 * uPulse) + smoothstep(.1, .0, bar) * (.2 + .5 * uPulse));
          float lane = abs(fract(x / (RW * .5) + .5) - .5) * RW * .5; c += on * vec3(.15, .4, .6) * smoothstep(.022, .0, lane) * .22;
          float dash = step(fract(z / (BEAT * .5)), .5) * smoothstep(.07, .03, ax); c += vec3(1., .16, .6) * dash * (.9 + 1.2 * uPulse);
          c += vec3(.14, .9, 1.) * smoothstep(.16, .0, abs(ax - RW * 1.04)) * (.9 + 1.1 * uPulse);
          float wet = (sin(x * 1.7 + 1.) * .5 + .5) * (sin(x * 4.3) * .5 + .5) * (sin(z * .09 + x * .4) * .5 + .5);
          float far = smoothstep(4., 46., dist); c += on * (mix(vec3(.9, .2, .75), vec3(1., .3, .5), uOC) * wet * .16 * far + vec3(.34, .11, .48) * far * far * .22);
          vec2 q = (vW.xz - uSq) / vec2(uSqR + 1.2, (uSqR + 1.2) * .8); c += on * mix(vec3(.05, .7, .9), vec3(1., .9, .9), uOC) * exp(-dot(q, q) * 1.5) * .28;
          float zone = step(uSplit.y, vW.z) * step(vW.z, 3.) * uSplit.z, mine = step(0., x * uSplit.x);
          if (zone > 0.) { float cv = fract((vW.z + abs(x - uSplit.x * RW * .5) * .9 + uT * 16.) / 3.4);
            c *= 1. - .62 * zone * (1. - mine) * on; c += on * zone * mine * vec3(.1, .75, 1.) * (.09 + .55 * step(cv, .22)); c += vec3(1.) * smoothstep(.14, .05, ax) * zone * 1.6; }
          float grid = max(smoothstep(.04, .0, abs(fract(x / 2.) - .5) * 2.), smoothstep(.04, .0, abs(fract(z / 2.) - .5) * 2.)); c += (1. - on) * vec3(.04, .025, .1) * grid;
          gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x + 8., uFogR.y + 40., dist)), 1.); }`
    });
    const g = new T.PlaneGeometry(240, 300); g.rotateX(-Math.PI / 2); road = new T.Mesh(g, m); road.position.z = -120; road.frustumCulled = false; scene.add(road);
  }
  function buildSky() {
    const m = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, uniforms: UF,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform vec3 uFog; uniform float uPulse, uOC, uT; varying vec3 vD;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
        void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.);
          vec3 c = mix(mix(uFog * 2.1, vec3(.32, .05, .34) + .22 * uOC * vec3(1., .1, .5), smoothstep(0., .1, y)), vec3(.008, .012, .05), smoothstep(.05, .5, y));
          vec2 sv = vec2(d.x, d.y) / max(-d.z, .05); vec2 s = sv - vec2(0., .24); float r = length(s) / .2, disc = 1. - smoothstep(.97, 1.03, r);
          float cut = s.y > .03 ? 1. : smoothstep(-.06, .06, sin(s.y * 120. + uT * .7) + .9 + s.y * 8.); vec3 sun = mix(vec3(1., .1, .55), vec3(1., .8, .3), smoothstep(-.18, .18, s.y));
          c = mix(c, sun * (.95 + .3 * uPulse), disc * cut); c += sun * .13 * exp(-r * r * .42) * (.8 + .3 * uPulse);
          vec2 g = floor(d.xy * 190.); c += vec3(.9) * step(.994, h(g)) * smoothstep(.12, .4, y);
          gl_FragColor = vec4(c, 1.); }`
    });
    sky = new T.Mesh(new T.SphereGeometry(420, 24, 16), m); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
  }
  const hash = i => { const v = Math.sin(i * 127.1) * 43758.5453; return v - Math.floor(v); };
  function towerMesh(count, mat) {
    const g = new T.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
    const tint = new Float32Array(count * 3), seed = new Float32Array(count), pal = [COL.pink, COL.cyan, COL.violet, COL.gold, COL.cyan, COL.pink2];
    for (let i = 0; i < count; i++) { tc.set(pal[i % pal.length]); tint.set([tc.r, tc.g, tc.b], i * 3); seed[i] = hash(i + count); }
    g.setAttribute('aTint', new T.InstancedBufferAttribute(tint, 3)); g.setAttribute('aSeed', new T.InstancedBufferAttribute(seed, 1));
    const mesh = new T.InstancedMesh(g, mat, count); mesh.frustumCulled = false; return mesh;
  }
  function buildCity() {
    const far = towerMesh(70, towerMat(new T.Vector2(120, 340)));
    for (let i = 0; i < 70; i++) { const w = 7 + hash(i) * 10, h = 18 + hash(i + 40) * hash(i + 90) * 80; dm.position.set(-175 + i * 5 + hash(i + 7) * 3, 0, -150 - hash(i + 20) * 60); dm.rotation.set(0, 0, 0); dm.scale.set(w, h, w); dm.updateMatrix(); far.setMatrixAt(i, dm.matrix); }
    scene.add(far);
    const N = 36; near = towerMesh(N, towerMat(new T.Vector2(34, 96))); near.instanceMatrix.setUsage(T.DynamicDrawUsage);
    for (let i = 0; i < N; i++) { const s = i % 2 ? 1 : -1; towerData.push({ s, x: s * (RW * 1.55 + 2.4 + hash(i + 3) * 4), w: 3 + hash(i + 5) * 3, h: 9 + hash(i + 8) * 24, d: 6 + hash(i + 9) * 2, z0: Math.floor(i / 2) * 7.5 + hash(i) * 2 }); }
    scene.add(near);
    // billboards: Hush propaganda on the street towers
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 2048; const c = cv.getContext('2d');
    [['HUSH', 'SILENCE IS SAFE', '#FF3DA8'], ['NO MUSIC', 'ZONE 7 · ENFORCED', '#3DF0FF'], ['OBEY', 'THE QUIET', '#FFB547'], ['NEON CITY', '2089', '#8B5CFF'], ['FREE THE BEAT', 'HUSH IS OVER', '#4BFFA5'], ['LOUD', 'ZONE 7 LIBERATED', '#FF3DA8'], ['TURN IT UP', 'ALL NIGHT', '#FFB547'], ['OVERCLOCK', 'NEON CITY UNMUTED', '#3DF0FF']].forEach(([a, b, col], i) => {
      const y = i * 256; c.fillStyle = '#080A22'; c.fillRect(0, y, 1024, 256); c.strokeStyle = col; c.lineWidth = 12; c.strokeRect(10, y + 10, 1004, 236);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.font = `700 ${a.length > 10 ? 96 : 118}px "Space Grotesk",system-ui,sans-serif`; c.fillText(a, 512, y + 104); c.fillStyle = '#F2EFE6'; c.font = '500 46px "Space Grotesk",system-ui,sans-serif'; c.fillText(b, 512, y + 196);
    });
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const pg = new T.PlaneGeometry(9, 2.25), cell = new Float32Array(N); for (let i = 0; i < N; i++) cell[i] = i % 4; pg.setAttribute('aCell', new T.InstancedBufferAttribute(cell, 1));
    billboards = new T.InstancedMesh(pg, new T.ShaderMaterial({
      side: T.DoubleSide, uniforms: Object.assign({ tMap: { value: tex } }, UF, { uFogR: { value: new T.Vector2(30, 92) } }),
      vertexShader: `attribute float aCell; uniform float uOC; varying vec2 vU; varying vec3 vW; void main(){ vU = vec2(uv.x, (7. - (aCell + step(.5, uOC) * 4.) + uv.y) / 8.); vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform sampler2D tMap; uniform vec3 uFog; uniform vec2 uFogR; uniform float uPulse, uOC, uCharge; varying vec2 vU; varying vec3 vW;
        void main(){ vec3 c = texture2D(tMap, vU).rgb * (1.2 + .6 * uPulse + 1.4 * uCharge * uOC); gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW))), 1.); }`
    }), N);
    billboards.instanceMatrix.setUsage(T.DynamicDrawUsage); billboards.frustumCulled = false; scene.add(billboards);
    // light streaks rushing past: moved in the shader, so they cost nothing per frame
    const n = 150, pos = new Float32Array(n * 6), az = new Float32Array(n * 2), ae = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1, x = s * (RW * 1.1 + hash(i) * 7), y = 0.4 + hash(i + 11) * 9, k = hash(i + 22) * 90; for (const e of [0, 1]) { pos.set([x, y, 0], i * 6 + e * 3); az[i * 2 + e] = k; ae[i * 2 + e] = e; } }
    const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(pos, 3)); lg.setAttribute('aZ', new T.BufferAttribute(az, 1)); lg.setAttribute('aE', new T.BufferAttribute(ae, 1));
    const st = new T.LineSegments(lg, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: UF, defines: { ZS: ZS.toFixed(2) },
      vertexShader: `attribute float aZ, aE; uniform float uT; varying float vA; void main(){ float z = mod(aZ + uT * ZS * 1.5, 90.) - 76. - aE * 2.8; vA = smoothstep(-76., -44., z) * .55; gl_Position = projectionMatrix * viewMatrix * vec4(position.xy, z, 1.); }`,
      fragmentShader: `uniform float uOC; varying float vA; void main(){ gl_FragColor = vec4(mix(vec3(.25, .85, 1.), vec3(1., .3, .7), uOC) * vA, 1.); }`
    }));
    st.frustumCulled = false; scene.add(st);
  }
  function buildFx() {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(PN * 3), 3).setUsage(T.DynamicDrawUsage)); g.setAttribute('aC', new T.BufferAttribute(new Float32Array(PN * 3), 3).setUsage(T.DynamicDrawUsage)); g.setAttribute('aS', new T.BufferAttribute(new Float32Array(PN), 1).setUsage(T.DynamicDrawUsage));
    pts = new T.Points(g, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uPx: { value: 500 } },
      vertexShader: `attribute vec3 aC; attribute float aS; uniform float uPx; varying vec3 vC; void main(){ vC = aC; vec4 v = modelViewMatrix * vec4(position, 1.); gl_PointSize = aS * uPx / -v.z; gl_Position = projectionMatrix * v; }`,
      fragmentShader: `varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5) * 2.; gl_FragColor = vec4(vC * pow(max(1. - d, 0.), 1.6) * 2.5, 1.); }`
    })); pts.frustumCulled = false; scene.add(pts);
    const l = new T.BufferGeometry(); l.setAttribute('position', new T.BufferAttribute(new Float32Array(TN * 6), 3).setUsage(T.DynamicDrawUsage)); l.setAttribute('color', new T.BufferAttribute(new Float32Array(TN * 6), 3).setUsage(T.DynamicDrawUsage));
    const rg = new T.RingGeometry(0.86, 1, 40);
    for (let i = 0; i < 6; i++) { const m = new T.Mesh(rg, new T.MeshBasicMaterial({ transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); m.visible = false; m.frustumCulled = false; scene.add(m); shocks.push({ m, c: new T.Color(), t0: null, life: 1, size: 8, z: 0 }); }
    lines = new T.LineSegments(l, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); lines.frustumCulled = false; scene.add(lines);
  }

  // ---------- post: bloom, tone curve, vignette ----------
  function buildPost() {
    fsScene = new T.Scene(); fsCam = new T.Camera();
    const vs = `varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
    const blurFs = `uniform sampler2D tS; uniform vec2 uDir; varying vec2 vU; void main(){ vec3 c = texture2D(tS, vU).rgb * .227; c += (texture2D(tS, vU + uDir * 1.385).rgb + texture2D(tS, vU - uDir * 1.385).rgb) * .316; c += (texture2D(tS, vU + uDir * 3.231).rgb + texture2D(tS, vU - uDir * 3.231).rgb) * .07; gl_FragColor = vec4(c, 1.); }`;
    mats.bright = new T.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tS: { value: null } }, vertexShader: vs, fragmentShader: `uniform sampler2D tS; varying vec2 vU; void main(){ vec3 c = texture2D(tS, vU).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(min(c * smoothstep(1.1, 2.2, l), vec3(4.)), 1.); }` });
    mats.blur = new T.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tS: { value: null }, uDir: { value: new T.Vector2() } }, vertexShader: vs, fragmentShader: blurFs });
    mats.out = new T.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tS: { value: null }, tB: { value: null }, uBloom: { value: 0.8 } }, vertexShader: vs,
      fragmentShader: `uniform sampler2D tS, tB; uniform float uBloom; varying vec2 vU;
        void main(){ vec3 c = texture2D(tS, vU).rgb + texture2D(tB, vU).rgb * uBloom; vec2 p = vU - .5; c *= 1. - dot(p, p) * .75; c = 1. - exp(-c * 1.5); gl_FragColor = vec4(pow(c, vec3(1. / 2.2)), 1.); }` });
    fsQuad = new T.Mesh(new T.PlaneGeometry(2, 2), mats.out); fsQuad.frustumCulled = false; fsScene.add(fsQuad);
  }
  function pass(mat, target) { fsQuad.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }
  function makeTargets() {
    for (const t of [rtS, rtA, rtB]) if (t) t.dispose();
    const pw = Math.max(2, Math.floor(W * DPR)), ph = Math.max(2, Math.floor(H * DPR)), opt = { type: T.HalfFloatType, depthBuffer: false };
    rtS = new T.WebGLRenderTarget(pw, ph, { type: T.HalfFloatType, depthBuffer: true, samples: R.quality === 2 ? 4 : 0 });
    rtA = new T.WebGLRenderTarget(pw >> 2, ph >> 2, opt); rtB = new T.WebGLRenderTarget(pw >> 2, ph >> 2, opt);
    mats.blackout = mats.blackout || new T.DataTexture(new Uint8Array(4), 1, 1); mats.blackout.needsUpdate = true;
  }
  function setQuality(q) { R.quality = q; DPR = Math.min(window.devicePixelRatio || 1, q === 2 ? 2 : q === 1 ? 1.25 : 1); renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); makeTargets(); }

  // ---------- public ----------
  R.init = function (canvas) {
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
      if (!renderer.capabilities.isWebGL2) return false;
    } catch (e) { return false; }
    const m = /[#&]q=([012])/.exec(location.hash); if (m) { R.quality = +m[1]; R.locked = true; }
    renderer.setClearColor(0x000000, 1); scene = new T.Scene(); scene.fog = new T.Fog(FOG, 32, 66);
    cam = new T.PerspectiveCamera(55, 1, 0.1, 900);
    buildSky(); buildRoad(); buildCity(); buildFx(); buildPost();
    runners = inst(runnerGeo(), 240); picks = inst(runnerGeo(), 16); drones = inst(droneGeo(), 40); swarm = inst(swarmGeo(), 1000); bikers = inst(bikerGeo(), 12); crate = inst(crateGeo(), 2); boss = inst(bossGeo(), 1); arches = inst(archGeo(), 4);
    const railG = merge([box(0.1, 0.1, 110, 0, 0, 0, COL.white, 1)]); rails = inst(railG, 2);
    [runners, picks, drones, swarm, bikers, crate, boss, arches, rails].forEach(o => scene.add(o));
    R.ok = true; return true;
  };
  R.resize = function (w, h) {
    W = w; H = h; if (!R.ok) return;
    const aspect = W / H; cam.aspect = aspect;
    baseFov = cam.fov = Math.max(52, 2 * Math.atan(Math.tan(23 * Math.PI / 180) / aspect) * 180 / Math.PI); cam.updateProjectionMatrix();
    pts.material.uniforms.uPx.value = H * Math.min(window.devicePixelRatio || 1, 2) * 0.09;
    setQuality(R.quality);
  };
  // one gate = two lit panels; the panels are rebuilt each run because sides are shuffled
  const GCOL = op => op === 'trade' ? COL.red : op === 'rate' ? COL.gold : op === 'oc' ? COL.pink2 : op === 'weapon' ? COL.cyan : op === 'power' ? COL.violet : COL.green;
  function gatePanel(text, col, side) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, col + '14'); gr.addColorStop(1, col + '40'); c.fillStyle = gr; c.fillRect(0, 0, 512, 256);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = '#fff'; c.font = `700 ${text.length > 8 ? 60 : text.length > 5 ? 84 : 140}px "Space Grotesk",system-ui,sans-serif`; c.fillText(text, 256, 134);
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const w = RW * 0.97, h = 3.3, grp = new T.Group(), panel = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, color: new T.Color(2.4, 2.4, 2.4), transparent: true, depthWrite: false, side: T.DoubleSide }));
    panel.position.y = h / 2 + 0.2; grp.add(panel);
    const base = new T.Color(col), frame = new T.MeshBasicMaterial({ color: base.clone().multiplyScalar(3) });
    grp.lit = on => { panel.material.color.setScalar(on ? 2.8 : 0.5); frame.color.copy(base).multiplyScalar(on ? 4.5 : 0.45); };
    for (const [bw, bh, x, y] of [[w + 0.14, 0.14, 0, h + 0.2], [w + 0.14, 0.14, 0, 0.2], [0.14, h, -w / 2, h / 2 + 0.2], [0.14, h, w / 2, h / 2 + 0.2]]) { const b = new T.Mesh(new T.BoxGeometry(bw, bh, 0.14), frame); b.position.set(x, y, 0); grp.add(b); }
    grp.position.x = side * RW * 0.52; return grp;
  }
  R.setRun = function (G, text) {
    if (!R.ok) return;
    for (const g of gates) { scene.remove(g.grp); g.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
    gates = G.ents.filter(e => e.kind === 'gate').map(e => { const grp = new T.Group(); const L = gatePanel(text(e.L), GCOL(e.L.op), -1), R2 = gatePanel(text(e.R), GCOL(e.R.op), 1); grp.add(L, R2); grp.visible = false; scene.add(grp); return { e, grp, L, R: R2 }; });
    parts = []; tracers = [];
  };
  R.project = function (x, z, y) { v3.set(wx(x), y || 0, wz(z)).project(cam); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; };
  R.burst = function (x, z, col, n, speed, y) {
    const c = new T.Color(col), px = wx(x), pz = wz(z), py = y == null ? 1 : y, s = speed || 6;
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, k = Math.random() * s; parts[pi] = { t0: R.t, life: 0.35 + Math.random() * 0.35, x: px, y: py, z: pz, vx: Math.cos(a) * k, vy: Math.random() * s * 0.8, vz: Math.sin(a) * k + ZS, c, s: 0.25 + Math.random() * 0.35 }; pi = (pi + 1) % PN; }
  };
  R.shock = function (x, z, col, size, y) {
    const s = shocks[shockI]; shockI = (shockI + 1) % shocks.length; s.t0 = R.t; s.life = 0.55; s.size = size || 8; s.z = wz(z); s.c.set(col); s.m.position.set(wx(x), y == null ? 1 : y, s.z);
  };
  R.punch = function (v) { punch = Math.max(punch, v); };
  R.tracer = function (x0, x1, z1, col, y1) { if (tracers.length < TN) tracers.push({ t0: R.t, x0: wx(x0), x1: wx(x1), z1: wz(z1), y1: y1 == null ? 1 : y1, c: new T.Color(col) }); };

  function drawCity(t) {
    const L = 135, N = towerData.length; billboards.count = 0;
    for (let i = 0; i < N; i++) {
      const d = towerData[i], z = ((d.z0 + t * ZS) % L + L) % L - L + 22;
      dm.rotation.set(0, 0, 0); dm.position.set(d.x, 0, z); dm.scale.set(d.w, d.h, d.d); dm.updateMatrix(); near.setMatrixAt(i, dm.matrix);
      if (i % 3 === 0 || d.h < 12) continue;
      // signs hang off the wall over the street, hinged at the wall so no part can cut into a tower
      const wall = d.x - d.s * d.w / 2, sw = Math.max(3.4, Math.min(7, (Math.abs(wall) - RW * 0.95) / Math.cos(SIGN_TILT)));
      dm.position.set(wall - d.s * (0.06 + Math.cos(SIGN_TILT) * sw / 2), 9.4 + (i % 4), z - Math.sin(SIGN_TILT) * sw / 2);
      dm.rotation.set(0, -d.s * SIGN_TILT, 0); dm.scale.setScalar(sw / 9); dm.updateMatrix(); billboards.setMatrixAt(billboards.count++, dm.matrix);
    }
    near.instanceMatrix.needsUpdate = true; billboards.instanceMatrix.needsUpdate = true;
    begin(arches); const barT = 2 * GR.BAR, k0 = Math.floor((t - 0.5 * GR.BAR) / barT);
    for (let k = k0; k < k0 + 4; k++) { const ta = (k + 0.5) * barT + GR.BAR * 0.5, z = ta - t; if (z < -1.5 || z > 13) continue; put(arches, 0, 0, wz(z), 1, 0, 0, k % 2 ? COL.pink : COL.cyan, 0.9 + UF.uPulse.value * 0.7); }
    end(arches);
    begin(rails); for (const s of [-1, 1]) put(rails, s * RW * 1.05, 0.12, -38, 1, 0, 0, COL.cyan, 0.45 + UF.uPulse.value * 0.4); end(rails);
  }
  function drawEnts(G, t, oc) {
    [picks, drones, swarm, bikers, crate, boss].forEach(begin);
    for (let i = G.ei; i < G.ents.length; i++) {
      const e = G.ents[i], z = e.ta - G.t; if (z > GR.BOSS_RANGE + 0.2) break; if (e.done || (z > AHEAD && e.kind !== 'boss')) continue;
      const x = wx(e.x), wZ = wz(z);
      if (e.kind === 'runner') put(picks, x, Math.abs(Math.sin(t * 5 + e.id)) * 0.2, wZ, 1.4, Math.PI + t * 2, 0, COL.cyan, 1.3);
      else if (e.kind === 'drone') put(drones, x, 1.1 + Math.sin(t * 5 + e.id) * 0.16, wZ, 1, t * 2 + e.id, 0, e.hp < e.maxHp ? COL.white : COL.pink, e.hp < e.maxHp ? 1.5 : 1);
      else if (e.kind === 'swarm') { if (swarm.count < 1000) put(swarm, x, 0.55 + Math.sin(t * 9 + e.id) * 0.1, wZ, 1, t * 3 + e.id, 0, e.hp < e.maxHp ? COL.white : COL.pink, e.hp < e.maxHp ? 1.6 : 1); }
      else if (e.kind === 'biker') put(bikers, x, 0, wZ, 1.15, 0, Math.sin(t * 7 + e.id) * 0.08, e.hp < e.maxHp * 0.5 ? COL.gold : COL.red, 1);
      else if (e.kind === 'crate') put(crate, x, 0.25 + Math.sin(t * 4) * 0.1, wZ, 1.1, t * 1.4, 0, COL.gold, 1 + UF.uPulse.value * 0.6);
      else if (e.kind === 'boss') { if (e.hp < bossHp) bossHit = 1; bossHp = e.hp; bossHit *= 0.82; put(boss, 0, Math.abs(Math.sin(t * 3.2)) * 0.25, wZ, 1.5, 0, 0, bossHit > 0.3 ? '#FFD0EC' : COL.white, 1 + UF.uPulse.value * 0.3 + bossHit * 1.6); }
    }
    [picks, drones, swarm, bikers, crate, boss].forEach(end);
    // the next gate splits the road: your side lights up and the other dims, flipping as you cross the middle
    let split = null; const side = G.sx < 0 ? -1 : 1;
    for (const g of gates) {
      const z = g.e.ta - G.t; g.grp.visible = !g.e.done && z < AHEAD && z > -0.2; if (!g.grp.visible) continue;
      g.grp.position.z = wz(z); if (!split) split = { g, z };
      const near = split.g === g; g.L.lit(!near || side < 0); g.R.lit(!near || side > 0);
    }
    const us = road.material.uniforms.uSplit.value; if (split) us.set(side, wz(split.z), Math.min(1, (AHEAD - split.z) / 1.2)); else us.z = 0;
    // squad
    const n = G.n, show = Math.min(n, 180), rad = GR.width(n) * RW * 1.5, cx = wx(G.sx), lean = (G.sx - G.tx) * 0.42, s = Math.max(0.74, 1.12 - show / 420);
    begin(runners);
    for (let i = 0; i < show; i++) {
      const r = Math.sqrt(i / Math.max(1, show)) * rad, a = i * 2.39996, bob = R.motion ? Math.abs(Math.sin(t * 11 + i * 1.7)) * 0.1 : 0;
      put(runners, cx + Math.cos(a) * r, bob, Math.sin(a) * r * 0.82, s, Math.PI, lean, i === 0 ? '#FFFFFF' : oc ? '#D8FBFF' : COL.cyan, (oc ? 1.15 : 0.7) + UF.uPulse.value * 0.25);
    }
    end(runners);
    road.material.uniforms.uSq.value.set(cx, 0); road.material.uniforms.uSqR.value = rad;
  }
  function drawShocks(t) {
    shocks.forEach(s => {
      const k = s.t0 == null ? 1 : (t - s.t0) / s.life; s.m.visible = k >= 0 && k < 1; if (!s.m.visible) return;
      s.m.position.z = s.z + ZS * (t - s.t0); const r = 0.4 + s.size * Math.sqrt(k); s.m.scale.set(r, r, 1); s.m.material.color.copy(s.c).multiplyScalar(3 * (1 - k));
    });
  }
  function drawFx(t) {
    const pa = pts.geometry.attributes.position, ca = pts.geometry.attributes.aC, sa = pts.geometry.attributes.aS; let n = 0;
    for (const p of parts) {
      if (!p) continue; const a = t - p.t0, k = a / p.life; if (k >= 1 || k < 0) continue;
      pa.setXYZ(n, p.x + p.vx * a, Math.max(0.05, p.y + p.vy * a - 7 * a * a), p.z + p.vz * a); const f = 1 - k; ca.setXYZ(n, p.c.r * f, p.c.g * f, p.c.b * f); sa.setX(n, p.s); n++;
    }
    pts.geometry.setDrawRange(0, n); pa.needsUpdate = ca.needsUpdate = sa.needsUpdate = true;
    tracers = tracers.filter(q => t - q.t0 < 0.1 && t >= q.t0);
    const lp = lines.geometry.attributes.position, lc = lines.geometry.attributes.color;
    tracers.forEach((q, i) => { const f = 1 - (t - q.t0) / 0.1, j = i * 2; lp.setXYZ(j, q.x0, 0.7, 0); lp.setXYZ(j + 1, q.x1, q.y1, q.z1 + ZS * (t - q.t0)); lc.setXYZ(j, q.c.r * f * 3, q.c.g * f * 3, q.c.b * f * 3); lc.setXYZ(j + 1, q.c.r * f, q.c.g * f, q.c.b * f); });
    lines.geometry.setDrawRange(0, tracers.length * 2); lp.needsUpdate = lc.needsUpdate = true;
  }
  function autoQuality(now) {
    if (R.locked) return; if (lastPerf) { frameMs.push(now - lastPerf); if (frameMs.length > 60) frameMs.shift(); } lastPerf = now;
    if (R.quality === 0 || frameMs.length < 60 || now < slowCheck) return;
    const avg = frameMs.reduce((a, b) => a + b, 0) / frameMs.length;
    if (avg > 25) { setQuality(R.quality - 1); frameMs.length = 0; slowCheck = now + 1500; }
  }
  // t is song time (or wall time on the title screen); G may be null
  R.frame = function (t, G, o) {
    R.t = t; const oc = !!o.oc;
    UF.uCharge.value += ((G ? (G.oc.on || G.oc.done ? 1 : G.meter / 100) : 0.45) - UF.uCharge.value) * 0.05;
    if (oc && !o.reduced) { const b = Math.floor(t / GR.B); if (b !== lastBeat) { lastBeat = b; const s = b % 2 ? 1 : -1; R.burst(s * (2.6 + Math.random() * 1.2), 2.2 + Math.random() * 2, [COL.pink, COL.cyan, COL.gold, COL.green][b % 4], 34, 11, 14 + Math.random() * 6); } }
    UF.uT.value = t; UF.uPulse.value = o.pulse; UF.uOC.value += ((oc ? 1 : 0) - UF.uOC.value) * 0.08;
    const sx = G ? G.sx : 0, aspect = W / H;
    cam.position.set(wx(sx) * 0.3 + (o.shakeX || 0) * 0.02, camBase.y + (aspect > 1 ? 1 : 0.6) + (o.shakeY || 0) * 0.02, camBase.z + (aspect > 1 ? 3.4 : 1.6));
    punch *= 0.9; if (punch < 0.02) punch = 0; cam.fov = baseFov + punch; cam.updateProjectionMatrix();
    look.set(wx(sx) * 0.15, aspect > 1 ? 4.2 : 2.2, -11); cam.lookAt(look); cam.updateMatrixWorld();
    drawCity(t);
    if (G) { R.motion = !o.reduced; drawEnts(G, t, oc); } else { [picks, drones, swarm, bikers, crate, boss, runners].forEach(begin); for (const q of gates) q.grp.visible = false; road.material.uniforms.uSqR.value = 0; road.material.uniforms.uSq.value.set(0, 900); }
    drawFx(t); drawShocks(t);
    renderer.setRenderTarget(rtS); renderer.clear(); renderer.render(scene, cam);
    mats.out.uniforms.tS.value = rtS.texture;
    if (R.quality > 0) {
      mats.bright.uniforms.tS.value = rtS.texture; pass(mats.bright, rtA);
      const px = 1 / rtA.width, py = 1 / rtA.height, b = mats.blur.uniforms;
      for (const k of [1, 2]) { b.tS.value = rtA.texture; b.uDir.value.set(px * k, 0); pass(mats.blur, rtB); b.tS.value = rtB.texture; b.uDir.value.set(0, py * k); pass(mats.blur, rtA); }
      mats.out.uniforms.tB.value = rtA.texture; mats.out.uniforms.uBloom.value = 0.42 + (oc ? 0.12 : 0);
    } else { mats.out.uniforms.tB.value = mats.blackout; mats.out.uniforms.uBloom.value = 0; }
    pass(mats.out, null);
    if (o.live) autoQuality(performance.now()); else { lastPerf = 0; frameMs.length = 0; }
  };
  window.GRR = R;
})();
