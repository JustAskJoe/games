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
  const COL = { cyan: '#3DF0FF', pink: '#FF3DA8', pink2: '#FF7AD0', violet: '#8B5CFF', gold: '#FFB547', green: '#4BFFA5', red: '#FF4D6D', white: '#FFFFFF', steel: '#1B2148', ink: '#0B0E2C', plum: '#3A1050', bone: '#F2EFE6' };
  const FOG = new T.Color('#1C0B3E');
  const UF = { uFog: { value: FOG }, uFogR: { value: new T.Vector2(30, 60) }, uT: { value: 0 }, uPulse: { value: 0 }, uOC: { value: 0 }, uCharge: { value: 0 } };

  // ---------- geometry helpers: non-indexed parts merged into one mesh, with colour and glow per vertex ----------
  const M = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(new T.Vector3(x || 0, y || 0, z || 0), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx || 1, sy || sx || 1, sz || sx || 1));
  function part(geo, col, glow, m) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m) g.applyMatrix4(m); g.computeVertexNormals();
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

  // ---------- the one material for models: lit body, rim light, glowing parts. Parts take the instance tint unless glow is 2 (own colour, glowing) or 3 (own colour, lit) ----------
  const neonMat = () => new T.ShaderMaterial({
    uniforms: Object.assign({ uGlow: { value: 3.2 } }, UF),
    vertexShader: `attribute vec3 color; attribute float aGlow; attribute vec3 aTint; varying vec3 vC, vN, vW; varying float vG;
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vC = aGlow > 1.5 ? color : color * aTint; vG = aGlow > 2.5 ? 0. : min(aGlow, 1.); gl_Position = projectionMatrix * viewMatrix * w; }`,
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
  const bone = COL.bone;
  // Street Raver: hoodie, LED visor, a light strip down the hood, a chunky blaster. Faces -z, so the squad shows its back
  function runnerGeo() {
    const body = new T.CylinderGeometry(0.17, 0.22, 0.46, 6), hood = new T.CylinderGeometry(0.11, 0.19, 0.3, 6);
    return merge([
      box(0.12, 0.34, 0.14, -0.1, 0.17, 0, COL.ink, 3), box(0.12, 0.34, 0.14, 0.1, 0.17, 0, COL.ink, 3), box(0.14, 0.07, 0.2, -0.1, 0.035, -0.02, bone, 3), box(0.14, 0.07, 0.2, 0.1, 0.035, -0.02, bone, 3),
      part(body, COL.white, 0, M(0, 0.57, 0)), box(0.3, 0.06, 0.26, 0, 0.8, 0, COL.ink, 3), part(hood, COL.white, 0, M(0, 0.97, 0)),
      box(0.06, 0.56, 0.03, 0, 0.78, 0.19, COL.cyan, 2, -0.1), box(0.2, 0.06, 0.03, 0, 0.97, -0.16, COL.cyan, 2),
      box(0.09, 0.09, 0.22, -0.24, 0.5, 0, COL.white), box(0.09, 0.09, 0.3, 0.24, 0.62, -0.08, COL.white),
      box(0.11, 0.13, 0.42, 0.24, 0.62, -0.32, COL.ink, 3), box(0.09, 0.09, 0.05, 0.24, 0.62, -0.55, COL.gold, 2)
    ]);
  }
  // Silencer: a flat saucer with a pink ring, a light pink dome and one mute-bar eye
  function droneGeo() {
    const body = new T.CylinderGeometry(0.66, 0.66, 0.26, 6), dome = new T.CylinderGeometry(0.14, 0.26, 0.15, 6), ring = new T.TorusGeometry(0.72, 0.04, 4, 14), eye = new T.SphereGeometry(0.17, 8, 6);
    return merge([part(body, COL.plum, 3), part(dome, COL.pink2, 2, M(0, 0.2, 0)), part(ring, COL.white, 1, M(0, 0, 0, Math.PI / 2)), part(eye, bone, 2, M(0, 0, 0.56)), box(0.28, 0.06, 0.05, 0, 0, 0.72, COL.ink, 3)]);
  }
  // Mute: a pink diamond with one white bar across it, the mark every Hush unit wears
  function swarmGeo() {
    const body = new T.OctahedronGeometry(0.3, 0);
    return merge([part(body, COL.white, 0, M(0, 0, 0, 0, Math.PI / 4, 0, 1, 1.3, 1)), box(0.46, 0.06, 0.3, 0, 0.02, 0, bone, 3)]);
  }
  // Hush Rider: long and low, wide armoured shoulders, pink visor. Red turns gold below half health
  function bikerGeo() {
    const wheel = new T.CylinderGeometry(0.34, 0.34, 0.16, 10);
    return merge([
      box(0.46, 0.3, 1.5, 0, 0.5, 0, COL.ink, 3), box(0.76, 0.14, 0.9, 0, 0.72, 0.08, COL.white), box(0.14, 0.14, 0.05, 0, 0.56, 0.78, bone, 2),
      box(0.4, 0.56, 0.32, 0, 1.04, 0.08, COL.steel, 3), box(0.92, 0.2, 0.36, 0, 1.3, 0.08, COL.steel, 3), box(0.26, 0.26, 0.4, -0.5, 1.3, 0.08, COL.white), box(0.26, 0.26, 0.4, 0.5, 1.3, 0.08, COL.white),
      box(0.3, 0.28, 0.3, 0, 1.56, 0.08, COL.steel, 3), box(0.25, 0.06, 0.05, 0, 1.58, 0.25, COL.pink, 2),
      part(wheel, COL.ink, 3, M(0, 0.34, 0.62, 0, 0, Math.PI / 2)), part(wheel, COL.ink, 3, M(0, 0.34, -0.62, 0, 0, Math.PI / 2))
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
    return merge([box(0.3, h, 0.3, -w, h / 2, 0, COL.ink), box(0.3, h, 0.3, w, h / 2, 0, COL.ink), box(w * 2 + 0.3, 0.3, 0.3, 0, h, 0, COL.ink), box(0.1, h, 0.34, -w + 0.2, h / 2, 0, COL.white, 1), box(0.1, h, 0.34, w - 0.2, h / 2, 0, COL.white, 1), box(w * 2, 0.1, 0.34, 0, h - 0.2, 0, COL.white, 1), box(0.86, 0.1, 0.36, -0.36, h - 0.46, 0, COL.bone, 2, 0, 0, 0.42), box(0.86, 0.1, 0.36, 0.36, h - 0.46, 0, COL.bone, 2, 0, 0, -0.42)]);
  }

  // ---------- towers: procedural gold, violet and bone windows, one violet line on the roof ----------
  const towerMat = fogR => new T.ShaderMaterial({
    uniforms: Object.assign({}, UF, { uFogR: { value: fogR } }),
    vertexShader: `attribute float aSeed; varying vec3 vP, vN, vW, vS; varying float vR;
      void main(){ vS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vP = position * vS; vN = normal; vR = aSeed;
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uFog; uniform vec2 uFogR; uniform float uPulse, uOC, uCharge; varying vec3 vP, vN, vW, vS; varying float vR;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      void main(){ vec2 uv = abs(vN.x) > .5 ? vec2(vP.z, vP.y) : vec2(vP.x, vP.y); vec2 cell = vec2(.72, .98), id = floor(uv / cell), f = fract(uv / cell);
        float win = step(.18, f.x) * step(f.x, .82) * step(.25, f.y) * step(f.y, .75), r = h(id + floor(vR * 91. + .5)), on = step(.9 - .26 * uCharge - .12 * uOC, r) * win * step(abs(vN.y), .5);
        float pick = h(id * 1.7 + floor(vR * 37. + .5)); const vec3 VIOLET = vec3(.26, .11, 1.), GOLD = vec3(1., .46, .06), BONE = vec3(.89, .86, .79);
        vec3 c = mix(vec3(.002, .0025, .012), vec3(.004, .005, .024), step(.5, abs(vN.x))) * (.7 + .6 * vP.y / vS.y), lit = pick < .55 ? GOLD : pick < .82 ? VIOLET : BONE;
        c += lit * on * (.22 + .22 * uCharge + .22 * uOC + .3 * uPulse * step(.8, r));
        c += mix(VIOLET, GOLD, uOC * step(.5, vR)) * (.5 + 1.1 * uCharge + .8 * uOC) * smoothstep(vS.y - .22, vS.y - .1, vP.y) * step(abs(vN.y), .5);
        gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW))), 1.); }`
  });

  // ---------- state ----------
  let renderer, scene, cam, rtS, rtA, rtB, fsScene, fsCam, fsQuad, mats = {}, W = 1, H = 1, DPR = 1, road, sky, runners, picks, drones, swarm, bikers, crate, boss, arches, rails, near, billboards, towerData = [], gates = [], parts = [], bolts = [], blasts = [], pts, beams, pi = 0;
  const camBase = new T.Vector3(0, 6.6, 9.2), look = new T.Vector3(), PN = 1600, BN = 420, v3 = new T.Vector3(), v4 = new T.Vector3(), ZAX = new T.Vector3(0, 0, 1);
  const ARCH0 = new T.Color(COL.violet), ARCH1 = new T.Color(COL.gold), archCol = new T.Color(), frameMs = [], shocks = []; let lastPerf = 0, slowCheck = 0, shockI = 0, lastBeat = -1, punch = 0, baseFov = 52, bossHp = 0, bossHit = 0;

  function buildRoad() {
    const m = new T.ShaderMaterial({
      uniforms: Object.assign({ uSq: { value: new T.Vector2() }, uSqR: { value: 1 }, uSplit: { value: new T.Vector3() } }, UF), defines: { RW: RW.toFixed(2), ZS: ZS.toFixed(2), BEAT: (GR.B * ZS).toFixed(4) },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 uFog; uniform vec2 uFogR, uSq; uniform vec3 uSplit; uniform float uT, uPulse, uOC, uSqR; varying vec3 vW;
        void main(){ float x = vW.x, ax = abs(x), z = vW.z - uT * ZS, dist = length(cameraPosition - vW), on = 1. - smoothstep(RW * 1.03, RW * 1.05, ax);
          vec3 c = mix(vec3(.003, .003, .01), vec3(.006, .007, .024), on);
          float bz = abs(fract(z / BEAT + .5) - .5) * BEAT, bar = abs(fract(z / (BEAT * 4.) + .5) - .5) * BEAT * 4.;
          vec3 acc = mix(vec3(.3, .14, 1.), vec3(1., .46, .06), uOC);
          c += on * acc * (smoothstep(.05, .0, bz) * (.05 + .14 * uPulse) + smoothstep(.1, .0, bar) * (.2 + .5 * uPulse));
          float lane = abs(fract(x / (RW * .5) + .5) - .5) * RW * .5; c += on * vec3(.3, .15, .9) * smoothstep(.022, .0, lane) * .16;
          float dash = step(fract(z / (BEAT * .5)), .5) * smoothstep(.07, .03, ax); c += vec3(.89, .86, .79) * dash * (.5 + .8 * uPulse);
          float cz = z - ax * .55, chev = min(abs(fract(cz / (BEAT * 8.)) - .5), abs(fract((cz + 1.1) / (BEAT * 8.)) - .5)) * BEAT * 8.; c += on * acc * smoothstep(.13, .07, chev) * step(ax, RW * .72) * (.3 + .4 * uPulse);
          c += vec3(.14, .9, 1.) * smoothstep(.16, .0, abs(ax - RW * 1.04)) * (.9 + 1.1 * uPulse);
          float wet = (sin(x * 1.7 + 1.) * .5 + .5) * (sin(x * 4.3) * .5 + .5) * (sin(z * .09 + x * .4) * .5 + .5);
          float far = smoothstep(4., 46., dist); c += on * (mix(vec3(.3, .14, 1.), vec3(1., .46, .06), uOC) * wet * .16 * far + vec3(.34, .11, .48) * far * far * .22);
          vec2 q = (vW.xz - uSq) / vec2(uSqR + 1.2, (uSqR + 1.2) * .8); c += on * mix(vec3(.05, .7, .9), vec3(.5, .7, .8), uOC) * exp(-dot(q, q) * 1.5) * mix(.28, .12, uOC);
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
          vec3 c = mix(mix(uFog * 2.1, vec3(.05, .008, .08) + .1 * uOC * vec3(.26, .11, 1.), smoothstep(0., .1, y)), vec3(.008, .012, .05), smoothstep(.05, .5, y));
          vec2 sv = vec2(d.x, d.y) / max(-d.z, .05); vec2 s = sv - vec2(0., .24); float r = length(s) / .2, disc = 1. - smoothstep(.97, 1.03, r);
          float cut = s.y > .03 ? 1. : smoothstep(-.06, .06, sin(s.y * 120. + uT * .7) + .9 + s.y * 8.); vec3 sun = mix(vec3(.26, .11, 1.), vec3(1., .46, .06), smoothstep(-.18, .18, s.y));
          c = mix(c, sun * (.34 + .34 * uOC + .16 * uPulse), disc * cut); c += sun * .035 * exp(-r * r * .42) * (.8 + .3 * uPulse);
          vec2 g = floor(d.xy * 190.); c += vec3(.9) * step(.994, h(g)) * smoothstep(.12, .4, y);
          gl_FragColor = vec4(c, 1.); }`
    });
    sky = new T.Mesh(new T.SphereGeometry(420, 24, 16), m); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
  }
  const hash = i => { const v = Math.sin(i * 127.1) * 43758.5453; return v - Math.floor(v); };
  function towerMesh(count, mat) {
    const g = new T.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
    const seed = new Float32Array(count); for (let i = 0; i < count; i++) seed[i] = hash(i + count);
    g.setAttribute('aSeed', new T.InstancedBufferAttribute(seed, 1));
    const mesh = new T.InstancedMesh(g, mat, count); mesh.frustumCulled = false; return mesh;
  }
  function buildCity() {
    const far = towerMesh(70, towerMat(new T.Vector2(120, 340)));
    for (let i = 0; i < 70; i++) { const w = 7 + hash(i) * 10, h = 18 + hash(i + 40) * hash(i + 90) * 80; dm.position.set(-175 + i * 5 + hash(i + 7) * 3, 0, -150 - hash(i + 20) * 60); dm.rotation.set(0, 0, 0); dm.scale.set(w, h, w); dm.updateMatrix(); far.setMatrixAt(i, dm.matrix); }
    scene.add(far);
    const N = 36; near = towerMesh(N, towerMat(new T.Vector2(34, 96))); near.instanceMatrix.setUsage(T.DynamicDrawUsage);
    for (let i = 0; i < N; i++) { const s = i % 2 ? 1 : -1; towerData.push({ s, x: s * (RW * 1.55 + 2.4 + hash(i + 3) * 4), w: 3 + hash(i + 5) * 3, h: 9 + hash(i + 8) * 24, d: 6 + hash(i + 9) * 2, z0: Math.floor(i / 2) * 7.5 + hash(i) * 2 }); }
    scene.add(near);
    // signs: Hush propaganda on the street towers, flipped to a liberated slogan at the drop
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1536; const c = cv.getContext('2d');
    [['HUSH', 'SILENCE IS SAFE', COL.pink], ['OBEY', 'THE QUIET', COL.pink], ['NO MUSIC', 'ZONE 7 · ENFORCED', COL.pink], ['LOUD', 'ZONE 7 LIBERATED', COL.gold], ['FREE THE BEAT', 'HUSH IS OVER', COL.green], ['TURN IT UP', 'ALL NIGHT', COL.bone]].forEach(([a, b, col], i) => {
      const y = i * 256; c.fillStyle = COL.ink; c.fillRect(0, y, 1024, 256); c.strokeStyle = col; c.lineWidth = 20; c.lineJoin = 'round'; c.strokeRect(14, y + 14, 996, 228);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.font = `700 ${a.length > 10 ? 96 : 118}px "Space Grotesk",system-ui,sans-serif`; c.fillText(a, 512, y + 104); c.fillStyle = COL.bone; c.font = '500 46px "Space Grotesk",system-ui,sans-serif'; c.fillText(b, 512, y + 196);
    });
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const pg = new T.PlaneGeometry(9, 2.25), cell = new Float32Array(N); for (let i = 0; i < N; i++) cell[i] = i % 3; pg.setAttribute('aCell', new T.InstancedBufferAttribute(cell, 1));
    billboards = new T.InstancedMesh(pg, new T.ShaderMaterial({
      side: T.DoubleSide, uniforms: Object.assign({ tMap: { value: tex } }, UF, { uFogR: { value: new T.Vector2(30, 92) } }),
      vertexShader: `attribute float aCell; uniform float uOC; varying vec2 vU; varying vec3 vW; void main(){ vU = vec2(uv.x, (5. - (aCell + step(.5, uOC) * 3.) + uv.y) / 6.); vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform sampler2D tMap; uniform vec3 uFog; uniform vec2 uFogR; uniform float uPulse, uOC, uCharge; varying vec2 vU; varying vec3 vW;
        void main(){ vec3 c = texture2D(tMap, vU).rgb * (1. + .5 * uPulse + 1.2 * uCharge * uOC); gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW))), 1.); }`
    }), N);
    billboards.instanceMatrix.setUsage(T.DynamicDrawUsage); billboards.frustumCulled = false; scene.add(billboards);
    // light streaks rushing past: moved in the shader, so they cost nothing per frame
    const n = 150, pos = new Float32Array(n * 6), az = new Float32Array(n * 2), ae = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1, x = s * (RW * 1.1 + hash(i) * 7), y = 0.4 + hash(i + 11) * 9, k = hash(i + 22) * 90; for (const e of [0, 1]) { pos.set([x, y, 0], i * 6 + e * 3); az[i * 2 + e] = k; ae[i * 2 + e] = e; } }
    const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(pos, 3)); lg.setAttribute('aZ', new T.BufferAttribute(az, 1)); lg.setAttribute('aE', new T.BufferAttribute(ae, 1));
    const st = new T.LineSegments(lg, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: UF, defines: { ZS: ZS.toFixed(2) },
      vertexShader: `attribute float aZ, aE; uniform float uT; varying float vA; void main(){ float z = mod(aZ + uT * ZS * 1.5, 90.) - 76. - aE * 2.8; vA = smoothstep(-76., -44., z) * .55; gl_Position = projectionMatrix * viewMatrix * vec4(position.xy, z, 1.); }`,
      fragmentShader: `uniform float uOC; varying float vA; void main(){ gl_FragColor = vec4(mix(vec3(.3, .14, 1.), vec3(1., .46, .06), uOC) * vA, 1.); }`
    }));
    st.frustumCulled = false; scene.add(st);
  }
  function buildFx() {
    beams = inst(merge([box(1, 1, 1, 0, 0, 0, COL.white, 1)]), BN); scene.add(beams);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(PN * 3), 3).setUsage(T.DynamicDrawUsage)); g.setAttribute('aC', new T.BufferAttribute(new Float32Array(PN * 3), 3).setUsage(T.DynamicDrawUsage)); g.setAttribute('aS', new T.BufferAttribute(new Float32Array(PN), 1).setUsage(T.DynamicDrawUsage));
    pts = new T.Points(g, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uPx: { value: 500 } },
      vertexShader: `attribute vec3 aC; attribute float aS; uniform float uPx; varying vec3 vC; void main(){ vC = aC; vec4 v = modelViewMatrix * vec4(position, 1.); gl_PointSize = aS * uPx / -v.z; gl_Position = projectionMatrix * v; }`,
      fragmentShader: `varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5) * 2.; gl_FragColor = vec4(vC * pow(max(1. - d, 0.), 1.6) * 2.5, 1.); }`
    })); pts.frustumCulled = false; scene.add(pts);
    const rg = new T.RingGeometry(0.86, 1, 40);
    for (let i = 0; i < 6; i++) { const m = new T.Mesh(rg, new T.MeshBasicMaterial({ transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); m.visible = false; m.frustumCulled = false; scene.add(m); shocks.push({ m, c: new T.Color(), t0: null, life: 1, size: 8, z: 0 }); }
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
  const GCOL = op => op === 'trade' ? COL.red : op === 'rate' ? COL.gold : op === 'oc' ? COL.pink2 : op === 'weapon' ? COL.cyan : op === 'mod' ? COL.violet : COL.green;
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
  R.setRun = function (G, text) { R.gates(G, text); parts = []; bolts = []; blasts = []; };
  R.gates = function (G, text) {
    if (!R.ok) return;
    for (const g of gates) { scene.remove(g.grp); g.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
    gates = G.ents.filter(e => e.kind === 'gate').map(e => { const grp = new T.Group(); const L = gatePanel(text(e.L), GCOL(e.L.op), -1), R2 = gatePanel(text(e.R), GCOL(e.R.op), 1); grp.add(L, R2); grp.visible = false; scene.add(grp); return { e, grp, L, R: R2 }; });
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
  // ---------- weapon fire: every gun and upgrade has its own shape. t = [{ x, z, y }] in road units, up to 8 ----------
  // head 0 draws the whole line and thins it out, otherwise head is the length of a bolt flying along it. lob arcs it upward
  function bolt(ax, ay, bz0, bx, by, bz, w, c, life, head, lob, delay) { if (bolts.length < BN) bolts.push({ t0: R.t + (delay || 0), life, ax, ay, az: bz0, bx, by, bz, w, c, head: head || 0, lob: lob || 0 }); }
  const AY = 0.72, AZ = -0.5;
  function jag(ax, ay, az, bx, by, bz, w, c, life, n, amp) {
    let px = ax, py = ay, pz = az;
    for (let i = 1; i <= n; i++) { const k = i / n, off = i === n ? 0 : (Math.random() - 0.5) * amp, x = ax + (bx - ax) * k + off, y = ay + (by - ay) * k + off * 0.5, z = az + (bz - az) * k; bolt(px, py, pz, x, y, z, w, c, life); px = x; py = y; pz = z; }
    return { x: px, y: py, z: pz };
  }
  R.volley = function (o) {
    const c = new T.Color(o.col), t = o.t, sx = wx(o.x), sq = wx(o.w) * 0.8, k = (1 + (o.lv - 1) * 0.12) * (o.oc ? 1.3 : 1), M = o.mod, from = () => sx + (Math.random() - 0.5) * sq * 2;
    if (o.weapon === 'pulse') for (const q of t.slice(0, 6)) bolt(from(), AY, AZ, wx(q.x), q.y, wz(q.z), 0.13 * k, c, 0.17, 0.36, 0, Math.random() * 0.05);
    else if (o.weapon === 'arc') for (const q of t.slice(0, 3)) {
      const bx = wx(q.x), bz = wz(q.z), ax = from(), w = (M === 0 ? 0.18 : 0.1) * k, end = jag(ax, AY, AZ, bx, q.y, bz, w, c, 0.2, 7, 0.9);
      if (M === 0) jag(ax, AY, AZ, bx, q.y, bz, 0.08 * k, new T.Color(COL.bone), 0.2, 7, 0.7);
      if (M === 1) for (const s of [-1, 1]) jag(end.x, end.y, end.z, end.x + s * (1.6 + Math.random()), q.y * 0.6, end.z - 1.4, 0.08 * k, c, 0.2, 4, 0.6);
    } else if (o.weapon === 'scatter') {
      const n = M === 1 ? 16 : M === 0 ? 6 : 10, fan = M === 1 ? 5.4 : M === 0 ? 2.2 : 3, w = (M === 0 ? 0.3 : 0.14) * k, cx = t.length ? wx(t[0].x) : sx;
      for (let i = 0; i < n; i++) bolt(from(), AY, AZ, cx + (i / (n - 1) - 0.5) * fan + (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.9, -13 - Math.random() * 5, w, c, 0.24, M === 0 ? 0.3 : 0.22, 0, Math.random() * 0.04);
    } else if (o.weapon === 'rail') {
      const far = t.reduce((m, q) => q.z > m.z ? q : m, t[0] || { x: o.x, z: 1.7, y: 1 }), bx = wx(far.x), by = far.y, bz = Math.min(wz(far.z), -18), bone = new T.Color(COL.cyan);
      for (const s of M === 1 ? [-0.36, 0.36] : [0]) { bolt(sx + s, AY, AZ, bx + s * 0.4, by, bz, (M === 0 ? 0.36 : 0.16) * k, c, 0.3); bolt(sx + s, AY, AZ, bx + s * 0.4, by, bz, (M === 0 ? 0.62 : 0.3) * k, bone, 0.1); }
      for (const q of t.slice(0, 6)) R.burst(q.x, q.z, o.col, M === 1 ? 5 : 3, 5, q.y);
    } else if (o.weapon === 'rocket') for (const q of t.slice(0, M === 1 ? 2 : 3)) {
      const life = 0.3, bx = wx(q.x), bz = wz(q.z), ax = from();
      bolt(ax, AY, AZ, bx, q.y, bz + life * ZS, 0.2 * k, c, life, 0.16, 1.5); bolt(ax, AY, AZ, bx, q.y, bz + life * ZS, 0.09 * k, new T.Color(COL.bone), life, 0.34, 1.5);
      blasts.push({ at: R.t + life, x: q.x, z: q.z, y: q.y, c: o.col, m: M, big: k });
    }
  };

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
    for (let k = k0; k < k0 + 4; k++) { const ta = (k + 0.5) * barT + GR.BAR * 0.5, z = ta - t; if (z < -1.5 || z > 13) continue; put(arches, 0, 0, wz(z), 1, 0, 0, archCol.lerpColors(ARCH0, ARCH1, UF.uOC.value), 0.38 + UF.uPulse.value * 0.26); }
    end(arches);
    begin(rails); for (const s of [-1, 1]) put(rails, s * RW * 1.05, 0.12, -38, 1, 0, 0, COL.cyan, 0.45 + UF.uPulse.value * 0.4); end(rails);
  }
  function drawEnts(G, t, oc) {
    [picks, drones, swarm, bikers, crate, boss].forEach(begin);
    for (let i = G.ei; i < G.ents.length; i++) {
      const e = G.ents[i], z = e.ta - G.t; if (z > GR.BOSS_RANGE + 0.2) break; if (e.done || (z > AHEAD && e.kind !== 'boss')) continue;
      const x = wx(e.x), wZ = wz(z);
      if (e.kind === 'runner') put(picks, x, Math.abs(Math.sin(t * 5 + e.id)) * 0.2, wZ, 1.4, Math.PI + t * 2, 0, COL.cyan, 1.3);
      else if (e.kind === 'drone') put(drones, x, 1.1 + Math.sin(t * 5 + e.id) * 0.16, wZ, 1, Math.sin(t * 2 + e.id) * 0.3, 0, e.hp < e.maxHp ? bone : COL.pink, e.hp < e.maxHp ? 1.5 : 1);
      else if (e.kind === 'swarm') { if (swarm.count < 1000) put(swarm, x, 0.55 + Math.sin(t * 9 + e.id) * 0.1, wZ, 1, 0, Math.sin(t * 3 + e.id) * 0.22, e.hp < e.maxHp ? bone : COL.pink, e.hp < e.maxHp ? 1.3 : 0.62); }
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
      put(runners, cx + Math.cos(a) * r, bob, Math.sin(a) * r * 0.82, s, 0, lean, oc ? COL.bone : COL.cyan, (oc ? 0.78 : 0.85) + UF.uPulse.value * 0.2);
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
    bolts = bolts.filter(q => t - q.t0 < q.life);
    begin(beams);
    for (const q of bolts) {
      const a = t - q.t0; if (a < 0) continue; const k = a / q.life, sc = ZS * a, beam = !q.head, f = beam ? 0 : Math.max(0, k - q.head), n = beam ? 1 : Math.min(1, k + q.head * 0.5), lobA = q.lob * Math.sin(Math.PI * f), lobB = q.lob * Math.sin(Math.PI * n);
      v3.set(q.ax + (q.bx - q.ax) * f, q.ay + (q.by - q.ay) * f + lobA, q.az + (q.bz + sc * 0 - q.az) * f); v4.set(q.ax + (q.bx - q.ax) * n, q.ay + (q.by - q.ay) * n + lobB, q.az + (q.bz - q.az) * n);
      if (beam) { v3.z += sc; v4.z += sc; }
      const mx = (v3.x + v4.x) / 2, my = (v3.y + v4.y) / 2, mz = (v3.z + v4.z) / 2; v4.sub(v3); const len = v4.length(); if (len < 0.01) continue; v4.divideScalar(len);
      const w = q.w * (beam ? 1 - k * k : 1), i = beams.count++; dm.position.set(mx, my, mz); dm.quaternion.setFromUnitVectors(ZAX, v4); dm.scale.set(w, w, len); dm.updateMatrix(); beams.setMatrixAt(i, dm.matrix); beams.tint.setXYZ(i, q.c.r * 0.8, q.c.g * 0.8, q.c.b * 0.8);
    }
    end(beams);
    let blastRing = false; blasts = blasts.filter(b => {
      if (t < b.at) return true; const z = b.z - (t - b.at), N = RMQ() ? 4 : 1;
      if (b.m === 1) for (const s of [-0.16, 0, 0.16]) R.burst(b.x + s, z + s, b.c, 8 / N, 6, b.y);
      else { R.burst(b.x, z, b.c, (b.m === 0 ? 26 : 12) / N, b.m === 0 ? 9 : 6, b.y); if (b.m === 0 && !blastRing) { blastRing = true; R.shock(b.x, z, b.c, 1.4, b.y); } }
      return false;
    });
  }
  const RMQ = () => !R.motion;
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
