// Injected before the game loads: seeded Math.random, fake pointer lock, WebGL and frame instrumentation.
(() => {
  const seed = Number(new URLSearchParams(location.search).get('seed') || 1);
  let s = seed >>> 0;

  const unseeded = Math.random;

  Math.random = () => {
    // three.js draws random numbers for object ids: those stay unseeded, so a build that makes fewer objects still
    // gets the same random numbers for the game itself
    // (only while the match is set up: a stack trace per call is too slow during play)
    if (!window.__bench?.recording && (new Error().stack || '').split('\n')[2]?.match(/\/assets\/three-|\/deps\/three/)) {
      return unseeded();
    }

    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const preset = new URLSearchParams(location.search).get('preset') || 'high';

  localStorage.setItem('web-br.settings', JSON.stringify({ sens: 1, vol: 0, diff: 'easy', gfx: { preset } }));

  // pointer lock
  let locked = null;

  Object.defineProperty(Document.prototype, 'pointerLockElement', { get: () => locked, configurable: true });
  Element.prototype.requestPointerLock = function () {
    locked = this;
    setTimeout(() => document.dispatchEvent(new Event('pointerlockchange')));
    return Promise.resolve();
  };
  Document.prototype.exitPointerLock = function () {
    locked = null;
    setTimeout(() => document.dispatchEvent(new Event('pointerlockchange')));
  };

  // WebGL
  const B = window.__bench = {
    draws: 0, prims: 0, buffers: 0, bufferBytes: 0, textures: 0, programs: 0,
    frames: [], recording: false,
  };
  const sizes = new WeakMap();
  const P = WebGL2RenderingContext.prototype;
  const wrap = (name, f) => {
    const o = P[name];

    P[name] = function (...a) {
      f.call(this, a);
      return o.apply(this, a);
    };
  };
  const tri = (mode, n) => (mode === 4 ? n / 3 : mode === 1 ? n / 2 : n);

  wrap('drawElements', (a) => { B.draws++; B.prims += tri(a[0], a[1]); });
  wrap('drawArrays', (a) => { B.draws++; B.prims += tri(a[0], a[2]); });
  wrap('drawElementsInstanced', (a) => { B.draws++; B.prims += tri(a[0], a[1]) * a[4]; });
  wrap('drawArraysInstanced', (a) => { B.draws++; B.prims += tri(a[0], a[2]) * a[3]; });

  const oc = P.createBuffer;
  const od = P.deleteBuffer;
  const obd = P.bufferData;
  const ob = P.bindBuffer;
  const bound = new WeakMap();

  P.createBuffer = function () { B.buffers++; return oc.call(this); };
  P.deleteBuffer = function (b) {
    if (b) { B.buffers--; B.bufferBytes -= sizes.get(b) || 0; }
    return od.call(this, b);
  };
  P.bindBuffer = function (t, b) {
    let m = bound.get(this);

    if (!m) { m = {}; bound.set(this, m); }
    m[t] = b;
    return ob.call(this, t, b);
  };
  P.bufferData = function (t, d, ...r) {
    const b = (bound.get(this) || {})[t];
    const n = typeof d === 'number' ? d : (d ? d.byteLength : 0);

    if (b) { B.bufferBytes += n - (sizes.get(b) || 0); sizes.set(b, n); }
    return obd.call(this, t, d, ...r);
  };

  const ot = P.createTexture;
  const odt = P.deleteTexture;

  P.createTexture = function () { B.textures++; return ot.call(this); };
  P.deleteTexture = function (t) { if (t) B.textures--; return odt.call(this, t); };

  const op = P.createProgram;

  P.createProgram = function () { B.programs++; return op.call(this); };

  // three.js objects (via the devtools hook): draws per category and pass, live GPU geometries and textures
  B.cat = {};
  const devtools = new EventTarget();

  window.__THREE_DEVTOOLS__ = devtools;

  const catCache = new WeakMap();
  const categorize = (o, m) => {
    if (m && m.transparent && m.type === 'MeshPhongMaterial' && m.opacity < 0.5) return 'glass';
    if (m && m.type === 'MeshPhongMaterial') return 'water';
    let top = o;
    let parentIsGroup = false;

    while (top.parent && !top.parent.isScene) {
      if (top === o && top.parent.isGroup) parentIsGroup = true;
      top = top.parent;
    }

    if (top.isCamera) return 'gun';
    if (o.isInstancedMesh) return o.name === 'trees' ? 'trees' : 'boxes';
    if (catCache.has(top)) return catCache.get(top);

    let c = 'other';

    if (top.isGroup && top.children.length > 50) {
      // the map group
      c = null;
    } else {
      let beam = false;
      let label = false;

      top.traverse((x) => {
        if (x.geometry && x.geometry.type === 'CylinderGeometry' && x.geometry.parameters.height === 12) beam = true;
        if (x.isSprite) label = true;
      });
      c = beam ? 'pickups' : label ? 'bots' : (top.isMesh ? 'effects' : 'other');
      catCache.set(top, c);
    }

    if (c === null) {
      if (o.geometry.attributes.color) return 'terrain';
      return parentIsGroup || o.parent !== top ? 'doors' : 'map-other';
    }

    return c;
  };

  devtools.addEventListener('observe', (e) => {
    const r = e.detail;

    if (r.isScene) B.scene = r;
    if (!r.isWebGLRenderer || r.__wrapped) return;
    r.__wrapped = true;
    B.renderer = r;

    const orig = r.renderBufferDirect;

    r.renderBufferDirect = function (camera, scene, geometry, material, object, group) {
      if (B.recording) {
        const k = (scene ? '' : 'shadow:') + categorize(object, material);

        B.cat[k] = (B.cat[k] || 0) + 1;
      }

      return orig.call(this, camera, scene, geometry, material, object, group);
    };
  });

  // frames
  const raf = window.requestAnimationFrame.bind(window);
  let lastT = 0;

  window.requestAnimationFrame = cb => raf((t) => {
    B.draws = 0;
    B.prims = 0;

    const st = performance.now();

    cb(t);

    const cpu = performance.now() - st;

    if (B.recording && B.draws > 0) {
      B.frames.push([cpu, t - lastT, B.draws, B.prims]);
    }

    lastT = t;
  });
})();
