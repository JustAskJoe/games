/* Cyberpunk Gate Runner, Prototype 2: WebGL street (three.js r159, window.GRR). Draws only: it reads the engine state
   and never changes it. Everything is built in code: models from boxes and low-poly shapes, the road, sky and towers
   from shaders. Road x is -1..1, z is seconds ahead of the squad. The whole street is laid out once at load and scrolled in the shaders (uS), so scenery costs no work per frame. Quality tiers: 2 full, 1 lighter, 0 no bloom.
   Add #q=0, #q=1 or #q=2 to the URL to lock a tier.
   © 2026 justaskjoe. All rights reserved. */
(function () {
  const T = window.THREE, GR = window.GR;
  const RW = 3.4, ZS = 10, AHEAD = 4.6, SIGN_TILT = 0.24;     // road half width, world units per second of song, seconds drawn ahead
  const wx = x => x * RW, wz = z => -z * ZS;
  const R = { ok: false, quality: 2, locked: false, RW, ZS };
  const COL = { cyan: '#3DF0FF', pink: '#FF3DA8', pink2: '#FF7AD0', violet: '#8B5CFF', gold: '#FFB547', green: '#4BFFA5', red: '#FF4D6D', white: '#FFFFFF', steel: '#1B2148', ink: '#0B0E2C', plum: '#3A1050', bone: '#F2EFE6' };
  const FOG = new T.Color('#1C0B3E'), TONE = [new T.Color('#241038'), new T.Color('#160E44'), new T.Color('#2E1236')];   // market plum, canyon blue, the drop warm
  const UF = { uFog: { value: FOG }, uFogR: { value: new T.Vector2(30, 60) }, uT: { value: 0 }, uPulse: { value: 0 }, uOC: { value: 0 }, uCharge: { value: 0 }, uS: { value: 0 }, uA: { value: new T.Vector3(0.26, 0.11, 1) }, uB: { value: new T.Vector3(1, 0.46, 0.06) }, uFar: { value: 1 }, uBeat: { value: 4.9 } };
  // each street's look, named by pal in the level table. fog, three tones for the song's sections, a and b are the city's two light colours (windows, sky,
  // road accents), arch the street arches, far scales the skyline, rain thins the rain, haze pulls the fog closer. Nothing here rebuilds the city
  const PALS = {
    market: { fog: '#1C0B3E', tone: ['#241038', '#160E44', '#2E1236'], a: [0.26, 0.11, 1], b: [1, 0.46, 0.06], arch: [COL.violet, COL.gold], far: 1, rain: 1, haze: 1 },
    yards: { fog: '#06242A', tone: ['#0B2C30', '#0A2038', '#2A2410'], a: [0.05, 0.55, 0.6], b: [1, 0.62, 0.1], arch: ['#2FD6C4', '#FFB547'], far: 0.6, rain: 0.5, haze: 1 },
    glass: { fog: '#0E2A4A', tone: ['#12304E', '#0C2448', '#1E3A5C'], a: [0.2, 0.5, 1], b: [0.85, 0.92, 1], arch: ['#6FB8FF', '#E8F4FF'], far: 1.6, rain: 1, haze: 1 },
    static: { fog: '#1B1036', tone: ['#21123E', '#170C34', '#1E2A18'], a: [0.45, 0.15, 1], b: [0.55, 1, 0.15], arch: ['#A66BFF', '#B6FF3C'], far: 0.9, rain: 0.7, haze: 0.62 },
  };

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
  const neonMat = (scroll) => new T.ShaderMaterial({
    defines: { SCROLL: (scroll ? ZS : 0).toFixed(2) }, uniforms: Object.assign({ uGlow: { value: scroll ? 1.5 : 3.2 } }, UF),
    vertexShader: `uniform float uS, uPulse, uOC; attribute vec3 color; attribute float aGlow; attribute vec3 aTint; varying vec3 vC, vN, vW; varying float vG;
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); w.z += uS * SCROLL; vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vC = aGlow > 1.5 ? color : color * aTint; vG = aGlow > 2.5 ? 0. : min(aGlow, 1.); if (SCROLL > 0.) vC *= vG > 0. ? .7 + .5 * uPulse * step(.5, fract(instanceMatrix[3].z * .37)) + .9 * uOC : 1.; gl_Position = projectionMatrix * viewMatrix * w; }`,
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
  // Mute Carrier: a wide flying barge with a hull slot for each speaker pod and a pink core
  function carrierGeo() {
    const core = new T.CylinderGeometry(0.75, 0.75, 0.3, 14), ring = new T.TorusGeometry(1.15, 0.08, 5, 24);
    return merge([box(6.4, 0.9, 2.6, 0, 3, 0, COL.violet), box(4.4, 0.6, 2, 0, 3.7, 0, COL.plum), box(6.8, 0.14, 2.8, 0, 2.5, 0, COL.pink, 1), box(6.8, 0.1, 2.8, 0, 3.5, 0, COL.pink2, 1), box(1.6, 1.3, 2, -2.6, 2.4, 0, COL.plum), box(1.6, 1.3, 2, 2.6, 2.4, 0, COL.plum), box(0.5, 0.5, 3.6, -1.6, 3.3, 0, COL.steel, 3), box(0.5, 0.5, 3.6, 1.6, 3.3, 0, COL.steel, 3), part(core, COL.pink, 1, M(0, 3, 1.4, Math.PI / 2)), part(ring, COL.pink2, 1, M(0, 3, 1.42))]);
  }
  function podGeo() {
    const cone = new T.CylinderGeometry(0.72, 0.3, 0.5, 12), mag = new T.CylinderGeometry(0.26, 0.26, 0.2, 10), ring = new T.TorusGeometry(0.78, 0.06, 4, 18);
    return merge([box(1.5, 1.5, 1, 0, 0, -0.3, COL.ink, 3), part(cone, COL.white, 0, M(0, 0, 0.35, -Math.PI / 2)), part(mag, COL.white, 1, M(0, 0, 0.55, Math.PI / 2)), part(ring, COL.white, 1, M(0, 0, 0.6))]);
  }
  // Mirror Warden: tall and thin, long legs, a narrow chest and one slit eye. The mirror is its own model so it can change sides
  function wardenGeo() {
    return merge([box(0.5, 4, 0.6, -0.8, 2, 0, COL.ink), box(0.5, 4, 0.6, 0.8, 2, 0, COL.ink), box(0.9, 0.3, 1.2, -0.8, 0.15, 0.1, COL.plum), box(0.9, 0.3, 1.2, 0.8, 0.15, 0.1, COL.plum), box(2.2, 3.4, 1, 0, 5.4, 0, COL.plum), box(2.5, 0.1, 1.1, 0, 3.9, 0, COL.pink, 1), box(1, 1.2, 0.9, 0, 7.8, 0, COL.ink), box(0.8, 0.12, 0.1, 0, 7.9, 0.48, COL.pink, 1), box(3, 0.5, 0.8, 0, 6.9, 0, COL.ink), box(0.14, 1.6, 0.14, 0, 9, 0, COL.pink, 1)]);
  }
  function mirrorGeo() {
    return merge([box(2.5, 7.2, 0.2, 0, 3.8, 0, COL.white, 1), box(2.8, 0.2, 0.3, 0, 7.5, 0, COL.ink, 3), box(2.8, 0.2, 0.3, 0, 0.1, 0, COL.ink, 3), box(0.2, 7.6, 0.3, -1.35, 3.8, 0, COL.ink, 3), box(0.2, 7.6, 0.3, 1.35, 3.8, 0, COL.ink, 3)]);
  }
  // Echo: a hooded hologram with no legs, one thin ring around it
  function echoGeo() {
    const body = new T.ConeGeometry(1.5, 5.4, 6), head = new T.OctahedronGeometry(0.72, 0), ring = new T.TorusGeometry(1.9, 0.05, 4, 22);
    return merge([part(body, COL.white, 1, M(0, 2.9, 0)), part(head, COL.white, 1, M(0, 6.2, 0)), part(ring, COL.white, 1, M(0, 3.4, 0, Math.PI / 2)), box(0.8, 0.1, 0.1, 0, 6.2, 0.62, COL.bone, 2)]);
  }
  // Director Vale: a slim figure on a floating stage, baton raised, with speaker stacks either side
  function valeGeo() {
    const arc = new T.TorusGeometry(3.6, 0.1, 5, 26, Math.PI);
    return merge([box(7, 0.6, 3, 0, 0.9, 0, COL.ink), box(7.4, 0.1, 3.2, 0, 1.25, 0, COL.gold, 2), box(5, 0.1, 2.4, 0, 0.5, 0, COL.pink, 1), box(1.2, 3.6, 1.2, -3.1, 3, 0, COL.plum), box(1.2, 3.6, 1.2, 3.1, 3, 0, COL.plum), box(0.8, 0.8, 0.1, -3.1, 3.8, 0.62, COL.pink, 1), box(0.8, 0.8, 0.1, 3.1, 3.8, 0.62, COL.pink, 1),
      box(0.4, 1.8, 0.4, -0.3, 2.2, 0, COL.ink), box(0.4, 1.8, 0.4, 0.3, 2.2, 0, COL.ink), box(1.4, 2.2, 0.8, 0, 4.1, 0, COL.bone, 3), box(0.5, 0.1, 0.1, 0, 5, 0.42, COL.pink, 1), box(0.7, 0.8, 0.7, 0, 5.6, 0, COL.ink), box(0.2, 1.6, 0.2, 1.1, 5.3, 0, COL.bone, 3, 0, 0, -0.7), box(0.05, 1.8, 0.05, 1.8, 6.6, 0, COL.white, 1, 0, 0, -0.5), part(arc, COL.pink2, 1, M(0, 3.2, -1))]);
  }
  function orbGeo() { const b = new T.SphereGeometry(0.42, 10, 8), r = new T.TorusGeometry(0.62, 0.04, 4, 14); return merge([part(b, COL.white, 1), part(r, COL.white, 1, M(0, 0, 0, Math.PI / 2))]); }
  function archGeo() {
    const w = RW * 1.32, h = 8;
    return merge([box(0.3, h, 0.3, -w, h / 2, 0, COL.ink), box(0.3, h, 0.3, w, h / 2, 0, COL.ink), box(w * 2 + 0.3, 0.3, 0.3, 0, h, 0, COL.ink), box(0.1, h, 0.34, -w + 0.2, h / 2, 0, COL.white, 1), box(0.1, h, 0.34, w - 0.2, h / 2, 0, COL.white, 1), box(w * 2, 0.1, 0.34, 0, h - 0.2, 0, COL.white, 1), box(0.86, 0.1, 0.36, -0.36, h - 0.46, 0, COL.bone, 2, 0, 0, 0.42), box(0.86, 0.1, 0.36, 0.36, h - 0.46, 0, COL.bone, 2, 0, 0, -0.42)]);
  }

  // ---------- towers: procedural gold, violet and bone windows, one violet line on the roof ----------
  const FOGR = [];    // fog ranges the haze setting pulls in, with their full values
  const fogR = (a, b) => { const v = new T.Vector2(a, b); FOGR.push([v, a, b]); return v; };
  const towerMat = (fr, scroll) => new T.ShaderMaterial({
    defines: { SCROLL: (scroll ? ZS : 0).toFixed(2) }, uniforms: Object.assign({}, UF, { uFogR: { value: fr } }),
    vertexShader: `uniform float uS, uFar; attribute float aSeed; varying vec3 vP, vN, vW, vS; varying float vR;
      void main(){ float fy = SCROLL > 0. ? 1. : uFar; vS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz) * fy, length(instanceMatrix[2].xyz)); vP = position * vS; vN = normal; vR = aSeed;
        vec4 w = modelMatrix * instanceMatrix * vec4(position * vec3(1., fy, 1.), 1.); w.z += uS * SCROLL; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uFog, uA, uB; uniform vec2 uFogR; uniform float uPulse, uOC, uCharge; varying vec3 vP, vN, vW, vS; varying float vR;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      void main(){ vec2 uv = abs(vN.x) > .5 ? vec2(vP.z, vP.y) : vec2(vP.x, vP.y); vec2 cell = vec2(.72, .98), id = floor(uv / cell), f = fract(uv / cell);
        float win = step(.18, f.x) * step(f.x, .82) * step(.25, f.y) * step(f.y, .75), r = h(id + floor(vR * 91. + .5)), on = step(.9 - .26 * uCharge - .12 * uOC, r) * win * step(abs(vN.y), .5);
        float pick = h(id * 1.7 + floor(vR * 37. + .5)); vec3 VIOLET = uA, GOLD = uB; const vec3 BONE = vec3(.89, .86, .79);
        vec3 c = mix(vec3(.002, .0025, .012), vec3(.004, .005, .024), step(.5, abs(vN.x))) * (.7 + .6 * vP.y / vS.y), lit = pick < .55 ? GOLD : pick < .82 ? VIOLET : BONE;
        c += lit * on * (.22 + .22 * uCharge + .22 * uOC + .3 * uPulse * step(.8, r));
        c += mix(VIOLET, GOLD, uOC * step(.5, vR)) * (.5 + 1.1 * uCharge + .8 * uOC) * smoothstep(vS.y - .22, vS.y - .1, vP.y) * step(abs(vN.y), .5);
        gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW))), 1.); }`
  });

  // ---------- state ----------
  let renderer, scene, cam, rtS, rtA, rtB, fsScene, fsCam, fsQuad, mats = {}, W = 1, H = 1, DPR = 1, road, sky, runners, picks, drones, swarm, bikers, crate, boss, BM = {}, BMS = [], pods, orbs, mirror, hazQ = [], arches, rails, near, billboards, steam, rain, detail = [], gates = [], parts = [], bolts = [], blasts = [], flash = { t0: -9, life: 0.1, w: 1, h: 1, c: new T.Color(), m: null }, pts, beams, pi = 0;
  const camBase = new T.Vector3(0, 6.6, 9.2), look = new T.Vector3(), PN = 1600, BN = 420, v3 = new T.Vector3(), v4 = new T.Vector3(), ZAX = new T.Vector3(0, 0, 1);
  const ARCH0 = new T.Color(COL.violet), ARCH1 = new T.Color(COL.gold), archCol = new T.Color(), frameMs = [], shocks = []; let lastPerf = 0, slowCheck = 0, shockI = 0, lastBeat = -1, punch = 0, baseFov = 52, bossHp = 0, bossHit = 0, rainK = 1;

  function buildRoad() {
    const m = new T.ShaderMaterial({
      uniforms: Object.assign({ uSq: { value: new T.Vector2() }, uSqR: { value: 1 }, uSplit: { value: new T.Vector3() } }, UF), defines: { RW: RW.toFixed(2), ZS: ZS.toFixed(2), BEAT: 'uBeat' },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 uFog, uA, uB; uniform vec2 uFogR, uSq; uniform vec3 uSplit; uniform float uT, uPulse, uOC, uSqR, uBeat; varying vec3 vW;
        void main(){ float x = vW.x, ax = abs(x), z = vW.z - uT * ZS, dist = length(cameraPosition - vW), on = 1. - smoothstep(RW * 1.03, RW * 1.05, ax);
          vec3 c = mix(vec3(.003, .003, .01), vec3(.006, .007, .024), on);
          float bz = abs(fract(z / BEAT + .5) - .5) * BEAT, bar = abs(fract(z / (BEAT * 4.) + .5) - .5) * BEAT * 4.;
          vec3 acc = mix(uA * 1.15, uB, uOC);
          c += on * acc * (smoothstep(.05, .0, bz) * (.05 + .14 * uPulse) + smoothstep(.1, .0, bar) * (.2 + .5 * uPulse));
          float lane = abs(fract(x / (RW * .5) + .5) - .5) * RW * .5; c += on * uA * 1.1 * smoothstep(.022, .0, lane) * .16;
          float dash = step(fract(z / (BEAT * .5)), .5) * smoothstep(.07, .03, ax); c += vec3(.89, .86, .79) * dash * (.5 + .8 * uPulse);
          float cz = z - ax * .55, chev = min(abs(fract(cz / (BEAT * 8.)) - .5), abs(fract((cz + 1.1) / (BEAT * 8.)) - .5)) * BEAT * 8.; c += on * acc * smoothstep(.13, .07, chev) * step(ax, RW * .72) * (.3 + .4 * uPulse);
          c += vec3(.14, .9, 1.) * smoothstep(.16, .0, abs(ax - RW * 1.04)) * (.9 + 1.1 * uPulse);
          float wet = (sin(x * 1.7 + 1.) * .5 + .5) * (sin(x * 4.3) * .5 + .5) * (sin(z * .09 + x * .4) * .5 + .5);
          float pud = smoothstep(.55, .8, (sin(x * .9 + z * .13) * .5 + .5) * (sin(z * .31 - x * .7) * .5 + .5) + (sin(z * .07 + x * 2.1) * .5 + .5) * .35), edge = smoothstep(RW * .25, RW * .95, ax);
          float smear = step(.5, fract(z * .023 + step(0., x) * .37)); float smear2 = step(.5, fract(z * .041 + x * .03)); vec3 glowC = mix(mix(uA * 1.15, uB * vec3(1., .65, .5), smear), mix(vec3(.2, 1., .3), uA, .4), smear2 * .55);
          c += glowC * pud * (.1 + .9 * edge) * (.03 + .03 * uPulse + .05 * uOC) * (1. + on); c += (1. - on) * vec3(.008, .007, .02) * (1. + pud);
          float far = smoothstep(4., 46., dist); c += on * (mix(uA * 1.15, uB, uOC) * wet * .16 * far + vec3(.34, .11, .48) * far * far * .22);
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
      fragmentShader: `uniform vec3 uFog, uA, uB; uniform float uPulse, uOC, uT; varying vec3 vD;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
        void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.);
          vec3 c = mix(mix(uFog * 2.1, vec3(.05, .008, .08) * .5 + uFog * .22 + .1 * uOC * uA, smoothstep(0., .1, y)), vec3(.008, .012, .05), smoothstep(.05, .5, y));
          vec2 sv = vec2(d.x, d.y) / max(-d.z, .05); vec2 s = sv - vec2(0., .24); float r = length(s) / .2, disc = 1. - smoothstep(.97, 1.03, r);
          float cut = s.y > .03 ? 1. : smoothstep(-.06, .06, sin(s.y * 120. + uT * .7) + .9 + s.y * 8.); vec3 sun = mix(uA, uB, smoothstep(-.18, .18, s.y));
          c = mix(c, sun * (.34 + .34 * uOC + .16 * uPulse), disc * cut); c += sun * .035 * exp(-r * r * .42) * (.8 + .3 * uPulse);
          for (float i = 0.; i < 3.; i += 1.) { float a = -.6 + i * .6 + sin(uT * .31 + i * 2.1) * .28, off = d.x - a * d.y * 1.6 - (i - 1.) * .38; c += mix(uA, uB, uOC) * smoothstep(.022 + y * .07, .0, abs(off)) * smoothstep(.0, .05, y) * (1. - smoothstep(.1, .62, y)) * (.05 + .09 * uOC); }
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
  // ---------- street furniture, one low-poly model per kind ----------
  const MODELS = {
    vending() { return merge([box(1, 2, 0.8, 0, 1, 0, COL.ink, 3), box(0.8, 1.2, 0.04, 0, 1.25, 0.42, COL.white, 1), box(0.8, 0.14, 0.04, 0, 0.4, 0.42, COL.white, 1)]); },
    stall() { return merge([box(2.4, 1, 1.2, 0, 0.5, 0, COL.ink, 3), box(2.6, 0.1, 1.5, 0, 2.3, 0.1, COL.steel, 3, 0.2), box(2.6, 0.06, 0.06, 0, 2.2, 0.84, COL.white, 1), box(0.08, 1.4, 0.08, -1.2, 1.6, 0.4, COL.steel, 3), box(0.08, 1.4, 0.08, 1.2, 1.6, 0.4, COL.steel, 3), box(2.2, 0.08, 0.04, 0, 1.02, 0.62, COL.white, 1)]); },
    crowd() {
      const P = [], b = new T.CylinderGeometry(0.15, 0.2, 1.05, 5), h = new T.SphereGeometry(0.14, 5, 4);
      [[-1, 0, 1], [-0.5, 0.5, 0.92], [0, -0.3, 1.05], [0.6, 0.3, 0.96], [1.1, -0.2, 1]].forEach(([x, z, k]) => { P.push(part(b, COL.steel, 3, M(x, 0.55 * k, z, 0, 0, 0, 1, k, 1)), part(h, COL.ink, 3, M(x, 1.25 * k, z))); });
      return merge(P);
    },
    barrier() { return merge([box(2, 0.5, 0.2, 0, 0.45, 0, COL.ink, 3), box(2, 0.1, 0.22, 0, 0.6, 0, COL.white, 1), box(0.14, 0.45, 0.5, -0.8, 0.22, 0, COL.steel, 3), box(0.14, 0.45, 0.5, 0.8, 0.22, 0, COL.steel, 3)]); },
    debris() { return merge([box(0.6, 0.3, 0.4, -0.4, 0.15, 0, COL.ink, 3, 0, 0.4), box(0.4, 0.5, 0.4, 0.3, 0.25, 0.2, COL.steel, 3, 0, -0.3), box(0.8, 0.14, 0.3, 0.1, 0.07, -0.5, COL.ink, 3, 0, 0.9)]); },
    escape() { const P = []; for (let i = 0; i < 4; i++) { const y = 2.5 + i * 2.6; P.push(box(0.9, 0.08, 3, 0, y, 0, COL.steel, 3), box(0.04, 0.6, 3, -0.44, y + 0.3, 0, COL.steel, 3), box(0.7, 0.06, 2.9, 0, y + 1.3, 0, COL.ink, 3, i % 2 ? 0.74 : -0.74)); } return merge(P); },
    cable() { const w = 13, P = [box(w * 2, 0.05, 0.05, 0, 0, 0, COL.ink, 3)]; for (let i = -6; i <= 6; i++) P.push(box(0.16, 0.16, 0.16, i * 1.9, -0.18, 0, COL.white, 1)); return merge(P); },
    overpass() { const w = 16; return merge([box(w * 2, 1.7, 3.2, 0, 10.2, 0, COL.ink, 3), box(w * 2, 0.5, 3.4, 0, 9.2, 0, COL.steel, 3), box(w * 2, 0.08, 0.1, 0, 8.9, 1.6, COL.white, 1), box(w * 2, 0.08, 0.1, 0, 8.9, -1.6, COL.white, 1), box(0.9, 9.2, 1.4, -RW * 1.52, 4.6, 0, COL.ink, 3), box(0.9, 9.2, 1.4, RW * 1.52, 4.6, 0, COL.ink, 3), box(w * 2, 0.3, 0.3, 0, 11.4, -1, COL.steel, 3), box(w * 2, 0.3, 0.3, 0, 11.4, 1, COL.steel, 3)]); }
  };
  function scen(kind, list) {
    const m = new T.InstancedMesh(MODELS[kind]().clone(), neonMat(true), list.length), tint = new Float32Array(list.length * 3);
    list.forEach((o, i) => { dm.position.set(o.x, o.y || 0, -o.a * ZS); dm.rotation.set(0, o.ry || 0, 0); dm.scale.setScalar(o.s || 1); dm.updateMatrix(); m.setMatrixAt(i, dm.matrix); tc.set(o.c || COL.violet); tint.set([tc.r, tc.g, tc.b], i * 3); });
    m.geometry.setAttribute('aTint', new T.InstancedBufferAttribute(tint, 3)); m.frustumCulled = false; scene.add(m); return m;
  }
  // the song's sections are places: a low night market, a stacked block, the tall canyon under the rails, the drop, and the way out
  const STREET = 100, place = a => { const bar = a / GR.BAR; return bar < 6 ? 'market' : bar < 12 ? 'blocks' : bar < 20 ? 'canyon' : bar < 28 ? 'drop' : bar < 31 ? 'out' : bar < 40 ? 'canyon' : 'drop'; };   // seconds of street; the longest level sets it
  const SHAPE = { market: [8, 9, 3, 2, 0.7], blocks: [12, 16, 4, 2, 0.3], canyon: [26, 26, 5, 2, 0], drop: [18, 26, 4, 3, 0], out: [10, 10, 3, 2, 0.8] };
  function buildCity() {
    const fars = [[70, -150, 60, 175, 80, new T.Vector2(120, 340)], [46, -105, 24, 120, 46, new T.Vector2(60, 230)]];
    for (const [n, zz, dep, span, tall, fr] of fars) { const far = towerMesh(n, towerMat(fr, false)); for (let i = 0; i < n; i++) { const w = 7 + hash(i) * 10, h = 18 + hash(i + 40) * hash(i + 90) * tall; dm.position.set(-span + i * (span * 2 / n) + hash(i + 7) * 3, 0, zz - hash(i + 20) * dep); dm.rotation.set(0, 0, 0); dm.scale.set(w, h, w); dm.updateMatrix(); far.setMatrixAt(i, dm.matrix); } scene.add(far); }
    // lay out the entire street once: towers and everything hung on them
    const T0 = [], signs = [], ads = [], vert = [], L = { vending: [], stall: [], crowd: [], barrier: [], debris: [], escape: [], cable: [], overpass: [] }, Gn = [COL.gold, COL.violet, COL.bone], vents = [];
    let id = 0;
    for (const s of [-1, 1]) {
      let a = -3.5;
      while (a < STREET) {
        const k = id++, r = n => hash(k * 3 + n), P = SHAPE[place(a)], w = 3 + r(1) * 3, h = P[0] + r(2) * P[1], d = P[2] + r(3) * P[3], x = s * (RW * 1.55 + 2.4 + r(4) * 2.4), wall = x - s * w / 2, z = -a * ZS;
        T0.push({ x, h, w, d, z });
        if (h >= 12 && r(5) < 0.62) { const sw = Math.max(3.4, Math.min(7, (Math.abs(wall) - RW * 0.95) / Math.cos(SIGN_TILT))); signs.push({ x: wall - s * (0.06 + Math.cos(SIGN_TILT) * sw / 2), y: 9.4 + k % 4, z: z - Math.sin(SIGN_TILT) * sw / 2, ry: -s * SIGN_TILT, s: sw / 9, cell: k % 3 }); }
        // every surface sells something: ads stacked up the wall, and tall vertical signs jutting into the street
        const faceW = d * 0.92, faceH = faceW / 4; for (let f = 0, y = 5 + r(6) * 2; y + faceH < h - 0.6 && f < 7; f++, y += faceH + 0.5 + r(f + 20) * 1.4) if (r(f + 30) < 0.8) ads.push({ x: wall - s * 0.05, y, z: z + (r(f + 40) - 0.5) * 0.3, ry: -s * Math.PI / 2, w: faceW, h: faceH, cell: (k + f * 5) % 16 });
        for (let f = 0; f < (h > 22 ? 3 : h > 12 ? 2 : 1); f++) if (r(f + 50) < 0.78) { const vh = 5 + r(f + 55) * 3; vert.push({ x: wall - s * (0.8 + r(f + 60) * 0.4), y: 5.2 + f * (vh + 0.6) + vh / 2 - 2, z: z + (f - 1) * d * 0.28, ry: 0, w: vh / 4.2, h: vh, cell: 16 + (k + f * 3) % 8 }); }
        if (r(11) < 0.3) L.escape.push({ x: wall - s * 0.5, a: a + 0.12 });
        // sidewalk: what stands there depends on the place
        const pl = place(a), sw = s * (RW * 1.24 + r(12) * 0.5), rr = r(13), ry = s > 0 ? -Math.PI / 2 : Math.PI / 2;
        if (pl === 'market' || pl === 'out') { if (rr < 0.55) L.stall.push({ x: sw + s * 0.8, a: a + 0.2, ry, s: 0.85, c: Gn[k % 2] }); else if (rr < 0.85) L.crowd.push({ x: sw, a: a + 0.3, ry, s: 1 }); }
        else if (pl === 'blocks') { if (rr < 0.5) L.vending.push({ x: sw + s * 0.5, a: a + 0.2, ry, c: Gn[k % 3] }); else if (rr < 0.8) L.crowd.push({ x: sw, a: a + 0.2, ry }); else L.debris.push({ x: sw, a: a + 0.3 }); }
        else if (pl === 'canyon') { if (rr < 0.45) L.barrier.push({ x: sw - s * 0.4, a: a + 0.2, ry, c: COL.gold }); else if (rr < 0.7) L.debris.push({ x: sw, a: a + 0.3 }); else L.vending.push({ x: sw + s * 0.5, a: a + 0.2, ry, c: COL.violet }); }
        else { L.crowd.push({ x: sw, a: a + 0.2, ry }); if (rr < 0.6) L.crowd.push({ x: sw + s * 0.9, a: a + 0.45, ry, s: 0.95 }); }
        if (r(14) < 0.3) vents.push([sw - s * 0.4, 0.2, -(a + 0.1) * ZS, hash(k)]);
        a += (d + 0.4 + P[4] * r(15) * 3) / ZS;
      }
    }
    near = towerMesh(T0.length, towerMat(fogR(34, 96), true));
    T0.forEach((q, i) => { dm.position.set(q.x, 0, q.z); dm.rotation.set(0, 0, 0); dm.scale.set(q.w, q.h, q.d); dm.updateMatrix(); near.setMatrixAt(i, dm.matrix); }); scene.add(near);
    for (let bar = 1; bar < 12; bar += 2) L.cable.push({ x: 0, y: 12.5 + (bar % 3), a: bar * GR.BAR + 1, c: COL.gold });
    for (let bar = 13; bar < 50; bar += 3) L.overpass.push({ x: 0, a: bar * GR.BAR + GR.BAR * 0.55, c: bar < 20 ? COL.violet : COL.gold });
    for (let bar = 13; bar < 50; bar += 3) for (const sd of [-1, 1]) ads.push({ x: sd * 7.4, y: 10.25, z: -(bar * GR.BAR + GR.BAR * 0.55) * ZS + 1.68, ry: 0, w: 13.6, h: 1.55, cell: (bar + (sd > 0 ? 4 : 0)) % 16 });
    const meshes = {}; for (const k in L) if (L[k].length) meshes[k] = scen(k, L[k]);
    detail = [[meshes.crowd, L.crowd.length], [meshes.debris, L.debris.length], [meshes.escape, L.escape.length]];
    // hanging signs: Hush propaganda on the street towers, flipped to a liberated slogan at the drop
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1536; const c = cv.getContext('2d');
    [['HUSH', 'SILENCE IS SAFE', COL.pink], ['OBEY', 'THE QUIET', COL.pink], ['NO MUSIC', 'ZONE 7 · ENFORCED', COL.pink], ['LOUD', 'ZONE 7 LIBERATED', COL.gold], ['FREE THE BEAT', 'HUSH IS OVER', COL.green], ['TURN IT UP', 'ALL NIGHT', COL.bone]].forEach(([a, b, col], i) => {
      const y = i * 256; c.fillStyle = COL.ink; c.fillRect(0, y, 1024, 256); c.strokeStyle = col; c.lineWidth = 20; c.lineJoin = 'round'; c.strokeRect(14, y + 14, 996, 228);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.font = `700 ${a.length > 10 ? 96 : 118}px "Space Grotesk",system-ui,sans-serif`; c.fillText(a, 512, y + 104); c.fillStyle = COL.bone; c.font = '500 46px "Space Grotesk",system-ui,sans-serif'; c.fillText(b, 512, y + 196);
    });
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const pg = new T.PlaneGeometry(9, 2.25), cell = new Float32Array(signs.length); signs.forEach((q, i) => { cell[i] = q.cell; }); pg.setAttribute('aCell', new T.InstancedBufferAttribute(cell, 1));
    billboards = new T.InstancedMesh(pg, new T.ShaderMaterial({
      side: T.DoubleSide, uniforms: Object.assign({ tMap: { value: tex } }, UF, { uFogR: { value: fogR(30, 92) } }), defines: { ZS: ZS.toFixed(2) },
      vertexShader: `attribute float aCell; uniform float uOC, uS; varying vec2 vU; varying vec3 vW; void main(){ vU = vec2(uv.x, (5. - (aCell + step(.5, uOC) * 3.) + uv.y) / 6.); vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); w.z += uS * ZS; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform sampler2D tMap; uniform vec3 uFog; uniform vec2 uFogR; uniform float uPulse, uOC, uCharge; varying vec2 vU; varying vec3 vW;
        void main(){ vec3 c = texture2D(tMap, vU).rgb * (1. + .5 * uPulse + 1.2 * uCharge * uOC); gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW))), 1.); }`
    }), signs.length);
    signs.forEach((q, i) => { dm.position.set(q.x, q.y, q.z); dm.rotation.set(0, q.ry, 0); dm.scale.setScalar(q.s); dm.updateMatrix(); billboards.setMatrixAt(i, dm.matrix); }); billboards.frustumCulled = false; scene.add(billboards);
    // corporate signage: all our own made-up brands. Two sheets on one texture: 16 wide ads and 8 tall katakana signs of plain words.
    // City colours stay off exact squad cyan and Hush pink, so the things you play with still pop
    const hc = document.createElement('canvas'); hc.width = 1024; hc.height = 1024; const hg = hc.getContext('2d'), FF = '"Space Grotesk",system-ui,sans-serif', AD = [COL.gold, COL.violet, COL.green, '#FF8A3D', '#C6FF4B', '#C77DFF', COL.bone, '#FFD94A'];
    [['LUMEN TEA', 'STAY UP'], ['HOTEL 404', 'ROOM NOT FOUND'], ['KILOBYTE BBQ', 'OPEN ALL NIGHT'], ['DRIFT SODA', 'FIZZ HARDER'], ['PIXEL PAWN', 'WE BUY MEMORIES'], ['MOTHBALL', 'SYNTH REPAIR'], ['NINE LIVES', 'CLONE INSURANCE'], ['GIGA CURRY', '24 HOUR CALORIES'], ['ORBIT LOANS', 'YOUR DEBT, IN SPACE'], ['HALO DENTAL', 'CHROME SMILES'], ['BYTEBURGER', 'NOW 90% REAL'], ['KARAOKE BOX', 'SOUNDPROOF. LEGAL.'], ['SLEEP.EXE', 'REST, ON SUBSCRIPTION'], ['VANTA MILK', 'DRINK THE DARK'], ['TOTAL CORP', 'WE OWN THIS BLOCK'], ['MEGAMART', 'BUY THE AIR YOU BREATHE']].forEach(([a, b], i) => {
      const x = i % 2 * 512, y = (i >> 1) * 96, col = AD[(i + (i >> 2)) % AD.length], solid = i % 3 === 0;
      hg.fillStyle = solid ? col : '#06071A'; hg.fillRect(x, y, 512, 96); if (!solid) { hg.strokeStyle = col; hg.lineWidth = 8; hg.strokeRect(x + 5, y + 5, 502, 86); }
      hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillStyle = solid ? '#06071A' : col; hg.font = `700 46px ${FF}`; hg.fillText(a, x + 256, y + 36); hg.font = `600 21px ${FF}`; hg.fillText(b, x + 256, y + 74);
    });
    ['ラーメン', 'カラオケ', 'ホテル', 'ゲーム', 'ネオン', 'カレー', 'ソーダ', 'ローン'].forEach((w, i) => {
      const x = i * 128, col = AD[(i * 3 + 1) % AD.length], solid = i % 2 === 0, cw = 256 / w.length; hg.fillStyle = solid ? col : '#06071A'; hg.fillRect(x, 768, 128, 256); if (!solid) { hg.strokeStyle = col; hg.lineWidth = 7; hg.strokeRect(x + 4, 772, 120, 248); }
      hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillStyle = solid ? '#06071A' : col; hg.font = `700 ${Math.min(58, cw * 0.82)}px ${FF}`; [...w].forEach((ch, k) => hg.fillText(ch, x + 64, 768 + cw * (k + 0.5)));
    });
    const htex = new T.CanvasTexture(hc); htex.colorSpace = T.SRGBColorSpace; htex.anisotropy = 4;
    const adMat = new T.ShaderMaterial({
      side: T.DoubleSide, uniforms: Object.assign({ tMap: { value: htex } }, UF, { uFogR: { value: fogR(24, 88) } }), defines: { ZS: ZS.toFixed(2) },
      vertexShader: `attribute float aCell; uniform float uS; varying vec2 vU; varying vec3 vW; varying float vC;
        void main(){ vC = aCell; vec2 q = aCell < 15.5 ? vec2(mod(aCell, 2.) * .5 + uv.x * .5, 1. - (floor(aCell * .5) + 1.) * .09375 + uv.y * .09375) : vec2((aCell - 16. + uv.x) * .125, uv.y * .25); vU = q;
          vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); w.z += uS * ZS; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform sampler2D tMap; uniform vec3 uFog; uniform vec2 uFogR; uniform float uPulse, uOC; varying vec2 vU; varying vec3 vW; varying float vC;
        void main(){ float scan = .8 + .2 * step(.5, fract(vW.y * 5.)), beat = step(.5, fract(vC * .37 + vW.y * .13)); vec3 c = texture2D(tMap, vU).rgb * scan * (.3 + .32 * uPulse * beat + .45 * uOC);
          gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW))), 1.); }`
    });
    const adAll = ads.concat(vert), agg = new T.PlaneGeometry(1, 1), acell = new Float32Array(adAll.length); adAll.forEach((q, i) => { acell[i] = q.cell; }); agg.setAttribute('aCell', new T.InstancedBufferAttribute(acell, 1));
    const adMesh = new T.InstancedMesh(agg, adMat, adAll.length);
    adAll.forEach((q, i) => { dm.position.set(q.x, q.y, q.z); dm.rotation.set(0, q.ry, 0); dm.scale.set(q.w, q.h, 1); dm.updateMatrix(); adMesh.setMatrixAt(i, dm.matrix); }); adMesh.frustumCulled = false; scene.add(adMesh); R.adCount = adAll.length;
    // steam from the vents, moved in the shader
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(new Float32Array(vents.flatMap(v => v.slice(0, 3))), 3)); sg.setAttribute('aK', new T.BufferAttribute(new Float32Array(vents.map(v => v[3])), 1));
    steam = new T.Points(sg, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: UF, defines: { ZS: ZS.toFixed(2) },
      vertexShader: `attribute float aK; uniform float uS, uT; varying float vA; void main(){ float k = fract(uT * .35 + aK); vec3 p = position; p.y += k * 3.4; p.x += sin(k * 5. + aK * 9.) * .3; p.z += uS * ZS; vA = (1. - k) * smoothstep(0., .15, k) * .13; vec4 v = viewMatrix * vec4(p, 1.); gl_PointSize = min(140., (30. + 60. * k) * 40. / max(-v.z, 1.)); gl_Position = projectionMatrix * v; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; gl_FragColor = vec4(vec3(.5, .42, .85) * vA * pow(max(1. - d, 0.), 1.5), 1.); }`
    })); steam.frustumCulled = false; scene.add(steam);
    // rain: thin streaks near the camera, faint over the road so gates and enemies stay clean
    const nR = 420, rp = new Float32Array(nR * 6), re = new Float32Array(nR * 2), rk = new Float32Array(nR * 2);
    for (let i = 0; i < nR; i++) { const x = (hash(i + 500) - 0.5) * 30, z = 6 - hash(i + 700) * 42, k = hash(i + 900); for (const e of [0, 1]) { rp.set([x, 0, z], i * 6 + e * 3); re[i * 2 + e] = e; rk[i * 2 + e] = k; } }
    const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.BufferAttribute(rp, 3)); rg.setAttribute('aE', new T.BufferAttribute(re, 1)); rg.setAttribute('aK', new T.BufferAttribute(rk, 1));
    rain = new T.LineSegments(rg, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: UF,
      vertexShader: `attribute float aE, aK; uniform float uT; varying float vA; void main(){ vec3 p = position; float y = mod(aK * 22. - uT * 24., 22.); p.y = y + aE * .8; p.x += aE * .12; vA = (.04 + .16 * smoothstep(2.5, 7., abs(p.x))); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
      fragmentShader: `varying float vA; void main(){ gl_FragColor = vec4(vec3(.6, .6, .95) * vA, 1.); }`
    })); rain.frustumCulled = false; scene.add(rain);
    // flying traffic crossing the sky far away
    const nF = 30, fp = new Float32Array(nF * 6), fc = new Float32Array(nF * 2), fk = new Float32Array(nF * 2);
    for (let i = 0; i < nF; i++) { const y = 22 + hash(i + 40) * 34, z = -90 - hash(i + 60) * 60; for (const e of [0, 1]) { fp.set([0, y, z], i * 6 + e * 3); fc[i * 2 + e] = e; fk[i * 2 + e] = hash(i + 80); } }
    const fg = new T.BufferGeometry(); fg.setAttribute('position', new T.BufferAttribute(fp, 3)); fg.setAttribute('aE', new T.BufferAttribute(fc, 1)); fg.setAttribute('aK', new T.BufferAttribute(fk, 1));
    const traffic = new T.LineSegments(fg, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: UF,
      vertexShader: `attribute float aE, aK; uniform float uT; varying float vK; void main(){ vK = aK; vec3 p = position; float dir = aK > .5 ? 1. : -1.; p.x = dir * (mod(aK * 400. + uT * (9. + aK * 7.), 240.) - 120.) + aE * 2.6; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
      fragmentShader: `uniform float uOC; uniform vec3 uA, uB; varying float vK; void main(){ gl_FragColor = vec4(mix(uA, uB, step(.5, fract(vK * 5.))) * (.55 + .4 * uOC), 1.); }`
    })); traffic.frustumCulled = false; scene.add(traffic);
    // light streaks rushing past: moved in the shader, so they cost nothing per frame
    const n = 150, pos = new Float32Array(n * 6), az = new Float32Array(n * 2), ae = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1, x = s * (RW * 1.1 + hash(i) * 7), y = 0.4 + hash(i + 11) * 9, k = hash(i + 22) * 90; for (const e of [0, 1]) { pos.set([x, y, 0], i * 6 + e * 3); az[i * 2 + e] = k; ae[i * 2 + e] = e; } }
    const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(pos, 3)); lg.setAttribute('aZ', new T.BufferAttribute(az, 1)); lg.setAttribute('aE', new T.BufferAttribute(ae, 1));
    const st = new T.LineSegments(lg, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: UF, defines: { ZS: ZS.toFixed(2) },
      vertexShader: `attribute float aZ, aE; uniform float uT; varying float vA; void main(){ float z = mod(aZ + uT * ZS * 1.5, 90.) - 76. - aE * 2.8; vA = smoothstep(-76., -44., z) * .55; gl_Position = projectionMatrix * viewMatrix * vec4(position.xy, z, 1.); }`,
      fragmentShader: `uniform float uOC; uniform vec3 uA, uB; varying float vA; void main(){ gl_FragColor = vec4(mix(uA * 1.15, uB, uOC) * vA, 1.); }`
    }));
    st.frustumCulled = false; scene.add(st);
  }
  function buildFx() {
    beams = inst(merge([box(1, 1, 1, 0, 0, 0, COL.white, 1)]), BN); scene.add(beams);
    const fc = document.createElement('canvas'); fc.width = fc.height = 64; const fg = fc.getContext('2d'), gr = fg.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); fg.fillStyle = gr; fg.fillRect(0, 0, 64, 64);
    flash.m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(fc), transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: false, fog: false })); flash.m.visible = false; flash.m.frustumCulled = false; flash.m.renderOrder = 5; scene.add(flash.m);
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
  function setQuality(q) { R.quality = q; if (rain) { rain.geometry.setDrawRange(0, Math.round((q === 2 ? 840 : q === 1 ? 460 : 160) * rainK / 2) * 2); steam.visible = q > 0; for (const [m, n] of detail) if (m) m.count = q === 0 ? n >> 1 : n; } DPR = Math.min(window.devicePixelRatio || 1, q === 2 ? 2 : q === 1 ? 1.25 : 1); renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); makeTargets(); }

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
    BM = { enforcer: boss, carrier: inst(carrierGeo(), 1), warden: inst(wardenGeo(), 1), echo: inst(echoGeo(), 3), vale: inst(valeGeo(), 1) }; BMS = Object.values(BM); pods = inst(podGeo(), 2); orbs = inst(orbGeo(), 12); mirror = inst(mirrorGeo(), 1);
    const hg = new T.PlaneGeometry(1, 1); hg.rotateX(-Math.PI / 2);
    for (let i = 0; i < 4; i++) { const m = new T.Mesh(hg, new T.MeshBasicMaterial({ transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); m.visible = false; m.frustumCulled = false; m.position.y = 0.06; scene.add(m); hazQ.push(m); }
    const railG = merge([box(0.1, 0.1, 110, 0, 0, 0, COL.white, 1)]); rails = inst(railG, 2);
    [runners, picks, drones, swarm, bikers, crate, arches, rails, pods, orbs, mirror].concat(BMS).forEach(o => scene.add(o));
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
  function gatePanel(text, note, col, side) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, col + '14'); gr.addColorStop(1, col + '40'); c.fillStyle = gr; c.fillRect(0, 0, 512, 256);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = '#fff'; c.font = `700 ${text.length > 8 ? 60 : text.length > 5 ? 84 : 124}px "Space Grotesk",system-ui,sans-serif`; c.fillText(text, 256, 104); c.shadowBlur = 8; c.font = '600 46px "Space Grotesk",system-ui,sans-serif'; c.fillText(note, 256, 208);
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const w = RW * 0.97, h = 3.3, grp = new T.Group(), panel = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, color: new T.Color(2.4, 2.4, 2.4), transparent: true, depthWrite: false, side: T.DoubleSide }));
    panel.position.y = h / 2 + 0.2; grp.add(panel);
    const base = new T.Color(col), frame = new T.MeshBasicMaterial({ color: base.clone().multiplyScalar(3) });
    grp.lit = on => { panel.material.color.setScalar(on ? 2.8 : 0.3); frame.color.copy(base).multiplyScalar(on ? 4.5 : 0.25); };
    for (const [bw, bh, x, y] of [[w + 0.14, 0.14, 0, h + 0.2], [w + 0.14, 0.14, 0, 0.2], [0.14, h, -w / 2, h / 2 + 0.2], [0.14, h, w / 2, h / 2 + 0.2]]) { const b = new T.Mesh(new T.BoxGeometry(bw, bh, 0.14), frame); b.position.set(x, y, 0); grp.add(b); }
    grp.position.x = side * RW * 0.52; return grp;
  }
  // a street's look. Only uniforms and colours change, so swapping levels costs nothing
  R.setLevel = function (def) {
    if (!R.ok) return; const P = PALS[def.pal] || PALS.market;
    FOG.set(P.fog); P.tone.forEach((c, i) => TONE[i].set(c)); UF.uA.value.set(...P.a); UF.uB.value.set(...P.b); ARCH0.set(P.arch[0]); ARCH1.set(P.arch[1]); UF.uFar.value = P.far; UF.uBeat.value = GR.B * ZS;
    for (const [v, a, b] of FOGR) v.set(a * P.haze, b * P.haze);
    rainK = P.rain; setQuality(R.quality); R.pal = def.pal;
  };
  // a fight can last 20 seconds, too far to see through the fog, so a boss looms at this distance and closes in at the end. Draw only: the engine keeps the true distance
  R.bossZ = z => Math.min(z, 3.5);
  R.setRun = function (G, text, note) { R.gates(G, text, note); parts = []; bolts = []; blasts = []; };
  R.gates = function (G, text, note) {
    if (!R.ok) return;
    for (const g of gates) { scene.remove(g.grp); g.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
    gates = G.ents.filter(e => e.kind === 'gate').map(e => { const grp = new T.Group(); const L = gatePanel(text(e.L), note(e.L), GCOL(e.L.op), -1), R2 = gatePanel(text(e.R), note(e.R), GCOL(e.R.op), 1); grp.add(L, R2); grp.visible = false; scene.add(grp); return { e, grp, L, R: R2 }; });
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
  function bolt(ax, ay, bz0, bx, by, bz, w, c, life, head, lob, delay, smoke) { if (bolts.length < BN) bolts.push({ t0: R.t + (delay || 0), life, ax, ay, az: bz0, bx, by, bz, w, c, head: head || 0, lob: lob || 0, smoke }); }
  const AY = 0.72, AZ = -0.5;
  function jag(ax, ay, az, bx, by, bz, w, c, life, n, amp) {
    let px = ax, py = ay, pz = az;
    for (let i = 1; i <= n; i++) { const k = i / n, off = i === n ? 0 : (Math.random() - 0.5) * amp, x = ax + (bx - ax) * k + off, y = ay + (by - ay) * k + off * 0.5, z = az + (bz - az) * k; bolt(px, py, pz, x, y, z, w, c, life); px = x; py = y; pz = z; }
    return { x: px, y: py, z: pz };
  }
  // lightning that jumps from target to target, the way a chain of arcs should
  function chain(from, t, w, c, life, amp, fork) {
    let p = from;
    t.forEach((q, i) => {
      const bx = wx(q.x), bz = wz(q.z), e = jag(p.x, p.y, p.z, bx, q.y, bz, w * (1 - i * 0.18), c, life, i ? 4 : 7, amp);
      for (let k = 0; k < 2; k++) jag(e.x, e.y, e.z, e.x + (Math.random() - 0.5) * 1.1, e.y + 0.5 + Math.random() * 0.4, e.z + (Math.random() - 0.5) * 0.9, w * 0.55, c, life * 1.4, 2, 0.4);   // crackle stays on the target
      if (fork) for (const s of [-1, 1]) jag(e.x, e.y, e.z, e.x + s * (1.5 + Math.random()), q.y * 0.6, e.z - 1.3, w * 0.6, c, life, 4, 0.6);
      p = e;
    });
  }
  // n counts eighth notes from the start of the song, so every gun can sit on the beat in its own way
  R.volley = function (o) {
    const c = new T.Color(o.col), t = o.t, sx = wx(o.x), sq = wx(o.w) * 0.8, k = (1 + (o.lv - 1) * 0.12) * (o.oc ? 1.3 : 1), M = o.mod, n = o.n, beat = n % 2 === 0, bar = n % 8 === 0, from = () => sx + (Math.random() - 0.5) * sq * 2, front = AZ - sq;
    if (o.weapon === 'pulse') {
      for (const tap of [0, o.B / 4]) for (const q of t.slice(0, 3)) { const ax = from(); for (const d of [-0.09, 0.09]) bolt(ax + d, AY, front, wx(q.x) + d, q.y, wz(q.z), 0.09 * k, c, 0.16, 0.3, 0, tap); }
      muzzle(sx, front, 1.5 + sq, 1.1, c, 0.07);
      for (const q of t.slice(0, 3)) R.burst(q.x, q.z, o.col, 2, 4, q.y);
    } else if (o.weapon === 'arc') {
      const w = (M === 0 ? 0.17 : 0.1) * k * (beat ? 1.35 : 0.85), T3 = t.slice(0, 4), start = { x: from(), y: AY, z: front };
      if (T3.length) { chain(start, T3, w, c, 0.2, 0.9, M === 1); if (M === 0) chain(start, T3, w * 0.45, new T.Color(COL.bone), 0.2, 0.7, false); }
      muzzle(sx, front, 1.2 + sq, 2.2, c, beat ? 0.11 : 0.06);
    } else if (o.weapon === 'scatter') {
      const heavy = beat, cnt = M === 1 ? 18 : M === 0 ? 7 : 12, N = heavy ? cnt : Math.ceil(cnt / 3), fan = (M === 1 ? 6.4 : M === 0 ? 2.6 : 4) * (heavy ? 1 : 0.7), w = (M === 0 ? 0.26 : 0.1) * k * (heavy ? 1 : 0.7), cx = t.length ? wx(t[0].x) : sx;
      for (let i = 0; i < N; i++) bolt(from(), AY, front, cx + (N > 1 ? i / (N - 1) - 0.5 : 0) * fan + (Math.random() - 0.5) * 0.3, 0.4 + Math.random(), -14 - Math.random() * 6, w, c, 0.26, M === 0 ? 0.14 : 0.1, 0, Math.random() * 0.05);
      muzzle(sx, front, (M === 1 ? 7 : 4.6) * (heavy ? 1 : 0.6) + sq, 1, c, heavy ? 0.12 : 0.06);
      if (heavy) for (const q of t.slice(0, 4)) shards(q, o.col);
    } else if (o.weapon === 'rail') {
      const far = t.reduce((m, q) => q.z > m.z ? q : m, t[0] || { x: o.x, z: 1.7, y: 1 }), bx = wx(far.x), by = far.y, bz = Math.min(wz(far.z), -18), core = new T.Color(COL.cyan), big = bar;
      for (const d of M === 1 ? [-0.36, 0.36] : [0]) {
        const W = (big ? (M === 0 ? 0.5 : 0.28) : 0.07) * k;
        bolt(sx + d, AY, front, bx + d * 0.4, by, bz, W, c, big ? 0.34 : 0.13);
        if (big) { bolt(sx + d, AY, front, bx + d * 0.4, by, bz, W * 1.8, core, 0.1); bolt(sx + d, AY, front, bx + d * 0.4, by, bz, 0.05, core, 0.75); }   // the trail that lingers
      }
      if (n % 8 === 7 && R.motion) muzzle(sx, front, 1.4, 1.4, core, 0.24);                // charging up, the eighth before the big shot
      if (big) { muzzle(sx, front, 3 + sq, 3, c, 0.12); if (R.motion) R.shock(o.x, 0.2, COL.cyan, 1.3, AY); }
      for (const q of t.slice(0, big ? 8 : 3)) R.burst(q.x, q.z, big ? COL.cyan : o.col, big ? (M === 1 ? 6 : 4) : 1, big ? 6 : 3, q.y);
    } else if (o.weapon === 'rocket') {
      const side = n % 2 ? 1 : -1, life = 0.3;
      for (const q of t.slice(0, M === 1 ? 1 : 2)) {
        const bx = wx(q.x), bz = wz(q.z), ax = sx + side * (sq + 0.3);
        bolt(ax, AY, front, bx, q.y, bz + life * ZS, 0.26 * k, c, life, 0.14, 1.6, 0, true); bolt(ax, AY, front, bx, q.y, bz + life * ZS, 0.1 * k, new T.Color(COL.bone), life, 0.3, 1.6);
        blasts.push({ at: R.t + life, x: q.x, z: q.z, y: q.y, c: o.col, m: M, big: k });
      }
      muzzle(sx + side * (sq + 0.3), front, 1.8, 1.6, c, 0.09);
    }
  };
  function shards(q, col) { R.burst(q.x, q.z, col, 5, 8, q.y); }
  function muzzle(x, z, w, h, c, life) { if (!R.motion) return; flash.t0 = R.t; flash.life = life; flash.w = w; flash.h = h; flash.c.copy(c); flash.m.position.set(x, 0.9, z); }
  // pickup moment: a ring around the squad in the gun's colour
  R.pickup = function (x, col) { R.shock(x, 0, col, 9, 0.5); if (R.motion) R.burst(x, 0.2, col, 40, 9, 1); };

  function drawCity(t) {
    begin(arches); const barT = 2 * GR.BAR, k0 = Math.floor((t - 0.5 * GR.BAR) / barT);
    for (let k = k0; k < k0 + 4; k++) { const ta = (k + 0.5) * barT + GR.BAR * 0.5, z = ta - t; if (z < -1.5 || z > 13) continue; put(arches, 0, 0, wz(z), 1, 0, 0, archCol.lerpColors(ARCH0, ARCH1, UF.uOC.value), 0.38 + UF.uPulse.value * 0.26); }
    end(arches);
    begin(rails); for (const s of [-1, 1]) put(rails, s * RW * 1.05, 0.12, -38, 1, 0, 0, COL.cyan, 0.45 + UF.uPulse.value * 0.4); end(rails);
  }
  function drawEnts(G, t, oc) {
    const LIST = [picks, drones, swarm, bikers, crate, pods, orbs, mirror].concat(BMS); LIST.forEach(begin);
    let hi = 0; const zone = (h, k) => { if (hi >= hazQ.length) return; const m = hazQ[hi++], x0 = Math.max(-1, h.x0), x1 = Math.min(1, h.x1); m.visible = true; m.position.set(wx((x0 + x1) / 2), 0.06, -14); m.scale.set((x1 - x0) * RW, 1, 34); m.material.color.set(h.style === 'beam' ? COL.bone : h.style === 'wave' ? COL.violet : COL.red).multiplyScalar(k); };
    for (const h of G.live) zone(h, 0.9);
    for (let i = G.ei; i < G.ents.length; i++) {
      const e = G.ents[i], z = e.ta - G.t; if (z > GR.BOSS_RANGE + 0.2) break;
      if (e.kind === 'haz') { if (!e.done && z < e.warn && !G.bossKilled) zone(e, (0.25 + 0.75 * (1 - z / e.warn)) * (0.7 + 0.3 * Math.sin(t * 22))); continue; }
      if (e.done || (z > AHEAD && e.kind !== 'boss' && e.kind !== 'pod')) continue;
      const x = wx(e.x), wZ = wz(z);
      if (e.kind === 'runner') put(picks, x, Math.abs(Math.sin(t * 5 + e.id)) * 0.2, wZ, 1.4, Math.PI + t * 2, 0, COL.cyan, 1.3);
      else if (e.kind === 'drone') put(drones, x, 1.1 + Math.sin(t * 5 + e.id) * 0.16, wZ, 1, Math.sin(t * 2 + e.id) * 0.3, 0, e.hp < e.maxHp ? bone : COL.pink, e.hp < e.maxHp ? 1.5 : 1);
      else if (e.kind === 'swarm') { if (swarm.count < 1000) put(swarm, x, 0.55 + Math.sin(t * 9 + e.id) * 0.1, wZ, 1, 0, Math.sin(t * 3 + e.id) * 0.22, e.hp < e.maxHp ? bone : COL.pink, e.hp < e.maxHp ? 1.3 : 0.62); }
      else if (e.kind === 'biker') put(bikers, x, 0, wZ, 1.15, 0, Math.sin(t * 7 + e.id) * 0.08, e.hp < e.maxHp * 0.5 ? COL.gold : COL.red, 1);
      else if (e.kind === 'crate') put(crate, x, 0.25 + Math.sin(t * 4) * 0.1, wZ, 1.1, t * 1.4, 0, COL.gold, 1 + UF.uPulse.value * 0.6);
      else if (e.kind === 'orb') { if (!G.bossKilled) put(orbs, x, 1 + Math.sin(t * 6 + e.id) * 0.12, wZ, 1.15, t * 2, 0, e.gold ? COL.gold : COL.red, 1.6); }
      else if (e.kind === 'pod') put(pods, x, 3.4, wz(R.bossZ(z)) + 2.1, 1.25, 0, 0, e.hp < e.maxHp ? COL.gold : COL.pink, 1 + UF.uPulse.value * 0.5);
      else if (e.kind === 'boss') {
        if (e.hp < bossHp) bossHit = 1; bossHp = e.hp; bossHit *= 0.82;
        const m = BM[e.boss] || boss, bz = wz(R.bossZ(z)), bob = Math.abs(Math.sin(t * 3.2)) * 0.25, armored = e.armor, tint = armored ? '#7C86B0' : bossHit > 0.3 ? '#FFD0EC' : COL.white, glow = armored ? 0.8 : 1 + UF.uPulse.value * 0.3 + bossHit * 1.6;
        if (e.boss === 'echo') e.lanes.forEach((lx, i) => { const real = lx === e.x; put(m, wx(lx), 0.3 + bob, bz, 1.5, 0, 0, real ? COL.pink2 : COL.violet, real ? 0.32 + UF.uPulse.value * 1.2 + bossHit * 0.6 : 0.2); });
        else if (e.boss === 'carrier') put(m, 0, 1.1 + bob, bz, 1.5, 0, 0, tint, glow);
        else put(m, 0, bob, bz, e.boss === 'vale' ? 1.3 : 1.5, 0, 0, tint, glow);
        if (e.boss === 'warden') { const st = G.st, flick = st.warn ? 0.2 + 0.5 * Math.abs(Math.sin(t * 16)) : 0.42; put(mirror, st.side * RW * 0.62, 0, bz + 2.4, 1.3, 0, 0, '#CFE8FF', flick); }
      }
    }
    LIST.forEach(end);
    for (let i = hi; i < hazQ.length; i++) hazQ[i].visible = false;
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
    const fk = (t - flash.t0) / flash.life; flash.m.visible = fk >= 0 && fk < 1;
    if (flash.m.visible) { flash.m.quaternion.copy(cam.quaternion); flash.m.scale.set(flash.w * (1 + fk * 0.3), flash.h * (1 - fk * 0.4), 1); flash.m.material.color.copy(flash.c).multiplyScalar(1.5 * (1 - fk)); }
    bolts = bolts.filter(q => t - q.t0 < q.life);
    begin(beams);
    for (const q of bolts) {
      const a = t - q.t0; if (a < 0) continue; const k = a / q.life, sc = ZS * a, beam = !q.head, f = beam ? 0 : Math.max(0, k - q.head), n = beam ? 1 : Math.min(1, k + q.head * 0.5), lobA = q.lob * Math.sin(Math.PI * f), lobB = q.lob * Math.sin(Math.PI * n);
      v3.set(q.ax + (q.bx - q.ax) * f, q.ay + (q.by - q.ay) * f + lobA, q.az + (q.bz + sc * 0 - q.az) * f); v4.set(q.ax + (q.bx - q.ax) * n, q.ay + (q.by - q.ay) * n + lobB, q.az + (q.bz - q.az) * n);
      if (beam) { v3.z += sc; v4.z += sc; }
      if (q.smoke && R.motion) R.burst(v3.x / RW, -v3.z / ZS, '#6E6288', 1, 0.8, v3.y);
      const mx = (v3.x + v4.x) / 2, my = (v3.y + v4.y) / 2, mz = (v3.z + v4.z) / 2; v4.sub(v3); const len = v4.length(); if (len < 0.01) continue; v4.divideScalar(len);
      const w = q.w * (beam ? 1 - k * k : 1), i = beams.count++; dm.position.set(mx, my, mz); dm.quaternion.setFromUnitVectors(ZAX, v4); dm.scale.set(w, w, len); dm.updateMatrix(); beams.setMatrixAt(i, dm.matrix); beams.tint.setXYZ(i, q.c.r * 0.8, q.c.g * 0.8, q.c.b * 0.8);
    }
    end(beams);
    let blastRing = false; blasts = blasts.filter(b => {
      if (t < b.at) return true; const z = b.z - (t - b.at), N = RMQ() ? 4 : 1;
      if (b.m === 1) for (const s of [-0.16, 0, 0.16]) R.burst(b.x + s, z + s, b.c, 8 / N, 6, b.y);
      else { R.burst(b.x, z, b.c, (b.m === 0 ? 30 : 16) / N, b.m === 0 ? 10 : 7, b.y); if (!blastRing) { blastRing = true; R.shock(b.x, z, b.c, b.m === 0 ? 1.8 : 1.1, b.y); } }
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
    UF.uS.value = G ? t : t % 50;
    if (rain) rain.visible = !o.reduced;
    const tone = G ? (G.t < 12 * GR.BAR ? TONE[0] : G.t < GR.DROP_T ? TONE[1] : G.t < GR.DROP_END ? TONE[2] : TONE[0]) : TONE[0]; FOG.lerp(tone, 0.02);
    UF.uCharge.value += ((G ? (G.oc.on || G.oc.done ? 1 : G.meter / 100) : 0.45) - UF.uCharge.value) * 0.05;
    if (oc && !o.reduced) { const b = Math.floor(t / GR.B); if (b !== lastBeat) { lastBeat = b; const s = b % 2 ? 1 : -1; R.burst(s * (2.6 + Math.random() * 1.2), 2.2 + Math.random() * 2, [COL.pink, COL.cyan, COL.gold, COL.green][b % 4], 34, 11, 14 + Math.random() * 6); } }
    UF.uT.value = t; UF.uPulse.value = o.pulse; UF.uOC.value += ((oc ? 1 : 0) - UF.uOC.value) * 0.08;
    const sx = G ? G.sx : 0, aspect = W / H;
    cam.position.set(wx(sx) * 0.3 + (o.shakeX || 0) * 0.02, camBase.y + (aspect > 1 ? 1 : 0.6) + (o.shakeY || 0) * 0.02, camBase.z + (aspect > 1 ? 3.4 : 1.6));
    punch *= 0.9; if (punch < 0.02) punch = 0; cam.fov = baseFov + punch; cam.updateProjectionMatrix();
    look.set(wx(sx) * 0.15, aspect > 1 ? 4.2 : 2.2, -11); cam.lookAt(look); cam.updateMatrixWorld();
    drawCity(t);
    if (G) { R.motion = !o.reduced; drawEnts(G, t, oc); } else { [picks, drones, swarm, bikers, crate, runners, pods, orbs, mirror].concat(BMS).forEach(begin); for (const q of hazQ) q.visible = false; for (const q of gates) q.grp.visible = false; road.material.uniforms.uSqR.value = 0; road.material.uniforms.uSq.value.set(0, 900); }
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
