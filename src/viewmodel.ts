import * as THREE from 'three';
import { cam } from './render/renderer';
import { OPTK } from './weapons';
import { state } from './state';
import type { OpticId } from './types';

/** First-person weapon models, attached to the camera. */
export const gun = new THREE.Group();

export const mt = (c: number) => new THREE.MeshLambertMaterial({ color: c });

const gm = mt(0x3a3f44);
const wm = mt(0x7a4a22);
const dm = mt(0x1d2024);
const om = mt(0x3d4a36);
const glass = new THREE.MeshPhongMaterial({ color: 0x7fd0ff, transparent: true, opacity: 0.4, shininess: 120, specular: 0xffffff });

export function bx(g: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, rx?: number) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  if (rx) {
    o.rotation.x = rx;
  }
  g.add(o);
  return o;
}

/** Cylinder along z. */
export function cy(g: THREE.Object3D, r: number, l: number, x: number, y: number, z: number, m: THREE.Material) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 16), m);
  o.rotation.x = Math.PI / 2;
  o.position.set(x, y, z);
  g.add(o);
  return o;
}

/** Viewmodel per weapon id. */
export const VM: Record<string, THREE.Group> = { pistol: new THREE.Group(), rifle: new THREE.Group(), awp: new THREE.Group() };
/** Muzzle z per weapon id. */
export const FZ: Record<string, number> = { pistol: -0.2, rifle: -0.62, awp: -0.9 };
/** Magazine, bolt and loose bullet meshes per weapon id, for the reload and bolt animations. */
const MG: Record<string, THREE.Object3D> = {};
const BOLTS: Record<string, THREE.Object3D> = {};
const BULS: Record<string, THREE.Object3D> = {};
/** Optic meshes per weapon id (the guns that take optics). */
export const VMO: Record<string, Partial<Record<OpticId, THREE.Object3D>>> = {};
let BOLT: THREE.Object3D;
let BUL: THREE.Object3D;
{
  const g = VM.pistol;
  bx(g, 0.045, 0.065, 0.24, 0, 0, -0.04, gm);
  bx(g, 0.04, 0.11, 0.055, 0, -0.075, 0.05, dm, 0.25);
  bx(g, 0.02, 0.02, 0.05, 0, -0.045, -0.01, dm);
  cy(g, 0.01, 0.1, 0, 0.005, -0.2, dm);
  MG.pistol = bx(g, 0.034, 0.05, 0.04, 0, -0.125, 0.065, mt(0x8a8d90), 0.25);
  MG.pistol.userData.y = -0.125;
}
{
  const g = VM.rifle;
  bx(g, 0.06, 0.085, 0.36, 0, 0, -0.05, gm);
  bx(g, 0.068, 0.06, 0.3, 0, -0.005, -0.35, wm);
  cy(g, 0.011, 0.34, 0, 0.02, -0.52, dm);
  MG.rifle = bx(g, 0.038, 0.15, 0.07, 0, -0.11, -0.1, dm, 0.3);
  MG.rifle.userData.y = -0.11;
  bx(g, 0.05, 0.1, 0.26, 0, -0.015, 0.28, wm);
  bx(g, 0.04, 0.1, 0.05, 0, -0.085, 0.1, wm, 0.3);
  bx(g, 0.01, 0.04, 0.01, 0, 0.05, -0.62, dm);
}
{
  const g = VM.awp;
  bx(g, 0.06, 0.09, 0.5, 0, 0, 0, om);
  cy(g, 0.014, 0.62, 0, 0.015, -0.56, dm);
  cy(g, 0.022, 0.06, 0, 0.015, -0.9, dm);
  bx(g, 0.05, 0.12, 0.38, 0, -0.025, 0.4, om);
  bx(g, 0.035, 0.12, 0.05, 0, -0.08, 0.14, om, 0.2);
  BOLT = bx(g, 0.07, 0.015, 0.015, 0.05, 0.02, 0.1, dm);
  bx(g, 0.02, 0.04, 0.03, 0, 0.065, -0.1, dm);
  bx(g, 0.02, 0.04, 0.03, 0, 0.065, 0.06, dm);
  cy(g, 0.028, 0.3, 0, 0.105, -0.02, dm);
  cy(g, 0.038, 0.07, 0, 0.105, -0.19, dm);
  cy(g, 0.034, 0.004, 0, 0.105, -0.227, glass);
  cy(g, 0.024, 0.004, 0, 0.105, 0.132, glass);
}
BUL = new THREE.Group();
cy(BUL, 0.008, 0.05, 0, 0, 0, mt(0xc9a227));
cy(BUL, 0.006, 0.03, 0, 0, -0.04, mt(0xb87333));
BUL.visible = false;
VM.awp.add(BUL);
MG.awp = bx(VM.awp, 0.035, 0.11, 0.07, 0, -0.1, 0.12, dm, 0.1);
MG.awp.userData.y = -0.1;
gun.add(VM.pistol, VM.rifle, VM.awp);

/** Registers weapon `id` as a scaled, recolored copy of the `base` model. */
function clone(id: string, base: string, sc: number, col: number) {
  const g = VM[base].clone(true);
  g.scale.setScalar(sc);
  if (col) {
    g.traverse((o) => {
      if (o instanceof THREE.Mesh && (o.material === wm || o.material === om)) {
        o.material = mt(col);
      }
    });
  }
  VM[id] = g;
  gun.add(g);
  MG[id] = g.children[VM[base].children.indexOf(MG[base])];
  FZ[id] = FZ[base] * sc;
  if (base === 'awp') {
    BOLTS[id] = g.children[VM.awp.children.indexOf(BOLT)];
    BULS[id] = g.children[VM.awp.children.indexOf(BUL)];
  }
}

const optBk = mt(0x151719);

const lens = (t: OpticId) => new THREE.MeshBasicMaterial({ color: t === 'rd' ? 0xff4030 : t === 'ho' ? 0xff6a50 : 0x7fb8ff, transparent: true, opacity: 0.8 });

/** Optic model (also used for Battle Royale pickups). */
export function mkOptic(t: OpticId) {
  const bk = optBk;
  const g = new THREE.Group();
  const l = lens(t);
  if (t === 'rd') {
    bx(g, 0.03, 0.012, 0.08, 0, 0.006, 0, bk);
    bx(g, 0.036, 0.045, 0.016, 0, 0.034, 0.03, bk);
    bx(g, 0.036, 0.012, 0.07, 0, 0.06, 0, bk);
    bx(g, 0.026, 0.034, 0.004, 0, 0.036, -0.03, l);
  } else if (t === 'ho') {
    bx(g, 0.04, 0.012, 0.09, 0, 0.006, 0, bk);
    bx(g, 0.006, 0.05, 0.07, -0.02, 0.037, 0, bk);
    bx(g, 0.006, 0.05, 0.07, 0.02, 0.037, 0, bk);
    bx(g, 0.046, 0.008, 0.07, 0, 0.066, 0, bk);
    bx(g, 0.034, 0.04, 0.004, 0, 0.04, -0.034, l);
  } else if (t === 'x2') {
    bx(g, 0.03, 0.02, 0.08, 0, 0.012, 0, bk);
    cy(g, 0.02, 0.14, 0, 0.045, 0, bk);
    cy(g, 0.026, 0.03, 0, 0.045, -0.08, bk);
    cy(g, 0.017, 0.003, 0, 0.045, -0.097, l);
    cy(g, 0.015, 0.003, 0, 0.045, 0.071, l);
  } else {
    bx(g, 0.04, 0.03, 0.1, 0, 0.018, 0, bk);
    cy(g, 0.026, 0.17, 0, 0.052, 0, bk);
    cy(g, 0.034, 0.04, 0, 0.052, -0.1, bk);
    cy(g, 0.02, 0.04, 0, 0.052, 0.1, bk);
    cy(g, 0.03, 0.003, 0, 0.052, -0.121, l);
    cy(g, 0.014, 0.003, 0, 0.052, 0.121, l);
    cy(g, 0.006, 0.12, 0, 0.088, 0, mt(0xff9a2a));
  }
  return g;
}

for (const t of OPTK) {
  const g = mkOptic(t);
  g.name = 'opt_' + t;
  g.position.set(0, 0.045, -0.12);
  g.visible = false;
  VM.rifle.add(g);
}
clone('scout', 'awp', 0.85, 0x4a3a28);
clone('svd', 'awp', 0.95, 0x6a4a28);
clone('g3', 'awp', 1, 0x2a2c2e);
clone('kar', 'awp', 1, 0x5a3a20);
clone('m82', 'awp', 1.25, 0x55584f);
BOLTS.awp = BOLT;
BULS.awp = BUL;
clone('glock', 'pistol', 0.95, 0);
clone('deagle', 'pistol', 1.3, 0);
clone('m3', 'rifle', 1.05, 0x2a1c10);
clone('mp5', 'rifle', 0.75, 0x1c1e20);
clone('p90', 'rifle', 0.7, 0x1c1e20);
clone('m4', 'rifle', 1, 0x25282b);
// iron sights are part of the guns: aiming without an optic raises the gun until the tip of the front sight sits on the aim point (TIP = its height above the gun origin)
export const TIP: Record<string, number> = {};
{
  const dk = mt(0x0e0e0e);

  const arcM = (g: THREE.Object3D, r: number, t: number, y: number, z: number, arc?: number) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, 18, arc || Math.PI * 2), dk);
    m.position.set(0, y, z);
    if (arc) {
      m.rotation.z = Math.PI;
    }
    g.add(m);
  };

  for (const id of ['rifle', 'm4', 'mp5', 'p90', 'm3']) {
    TIP[id] = 0.07 * VM[id].scale.x;
  }
  for (const id of ['pistol', 'glock', 'deagle']) {
    TIP[id] = 0.0455 * VM[id].scale.x;
    const g = VM[id];
    bx(g, 0.006, 0.013, 0.008, 0, 0.039, -0.15, dk);
    bx(g, 0.009, 0.014, 0.01, -0.012, 0.039, 0.07, dk);
    bx(g, 0.009, 0.014, 0.01, 0.012, 0.039, 0.07, dk);
  }
  // AK-47: the front post alone.  M4A1: rear peep ring round the post.  MP5: half-circle rear sight with the post standing in it.  P90: ring sight.  M3: bead.
  arcM(VM.m4, 0.016, 0.004, 0.07, 0.08);
  bx(VM.m4, 0.008, 0.012, 0.01, 0, 0.048, 0.08, dk);
  arcM(VM.mp5, 0.018, 0.0035, 0.07, 0.06, Math.PI);
  bx(VM.mp5, 0.008, 0.008, 0.01, 0, 0.0457, 0.06, dk);
  arcM(VM.p90, 0.02, 0.0025, 0.07, 0.03);
  bx(VM.p90, 0.005, 0.005, 0.005, 0, 0.07, 0.03, dk);
  bx(VM.p90, 0.006, 0.005, 0.008, 0, 0.045, 0.03, dk);
  {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 8, 6), dk);
    b.position.set(0, 0.0735, -0.62);
    VM.m3.add(b);
  }
}
{
  const g = VM.knife = new THREE.Group();
  const steel = mt(0xb9c0c6);
  bx(g, 0.022, 0.075, 0.34, 0, 0.012, -0.2, steel);
  bx(g, 0.02, 0.05, 0.1, 0, 0.0, -0.42, steel);
  bx(g, 0.09, 0.03, 0.03, 0, -0.012, -0.03, dm);
  bx(g, 0.035, 0.045, 0.16, 0, -0.016, 0.07, mt(0x2a2420));
  gun.add(g);
  FZ.knife = -0.1;
}
for (const id of ['rifle', 'm3', 'mp5', 'p90', 'm4']) {
  VMO[id] = {};
  for (const t of OPTK) {
    VMO[id][t] = VM[id].children.find(c => c.name === 'opt_' + t)!;
  }
}
export const NV = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshLambertMaterial({ color: 0x3c5a3a }));
NV.position.set(0, -0.05, -0.15);
NV.visible = false;
gun.add(NV);

const ss = (a: number, b: number, u: number) => {
  const x = Math.min(1, Math.max(0, (u - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/** Bolt handle pose: `l` lifted, `b` pulled back (0..1). */
function boltPose(l: number, b: number) {
  BOLT.rotation.z = 0.9 * l;
  BOLT.position.set(0.05, 0.02 + 0.035 * l, 0.1 + 0.12 * b);
}

export function animVM() {
  if (BOLTS[state.cw]) {
    BOLT = BOLTS[state.cw];
    BUL = BULS[state.cw];
  }
  for (const k in VM) {
    VM[k].position.set(0, 0, 0);
    VM[k].rotation.set(0, 0, 0);
  }
  for (const k in MG) {
    MG[k].position.y = MG[k].userData.y;
  }
  boltPose(0, 0);
  BUL.visible = false;
  const vg = VM[state.cw];
  if (state.cw === 'knife') {
    vg.rotation.set(0.12, -0.3, 0.5);
    vg.position.set(0.02, 0.04, -0.08);
    if (state.T < state.slashEnd) {
      const u = 1 - (state.slashEnd - state.T) / 0.3;
      const sn = Math.sin(u * Math.PI);
      vg.rotation.set(0.12 - 1.0 * sn, -0.3 + 0.9 * sn, 0.5 - 1.6 * sn);
      vg.position.set(0.02 - 0.16 * sn, 0.04 - 0.06 * sn, -0.08 - 0.18 * sn);
    }
  }
  if (state.reloading) {
    const u = 1 - (state.reloadEnd - state.T) / state.WP.rt;
    const o = ss(0, 0.18, u) - ss(0.85, 1, u);
    if (state.WP.bolt) {
      vg.position.set(-0.04 * o, -0.05 * o, 0);
      vg.rotation.set(0.2 * o, 0, -0.45 * o);
      const op = ss(0.12, 0.22, u) - ss(0.85, 0.93, u);
      boltPose(op, op);
      const k = (u - 0.25) / 0.55;
      if (k > 0 && k < 1) {
        const f = (k * 3) % 1;
        BUL.visible = true;
        BUL.position.set(0.12 * (1 - f), 0.14 - 0.085 * f, 0.14);
        BUL.rotation.z = 0.6 * (1 - f);
      }
    } else {
      const p = state.cw === 'pistol' ? 0.7 : 1;
      const m = MG[state.cw];
      vg.position.set(-0.05 * o, -0.05 * o - 0.015 * Math.sin(Math.PI * ss(0.65, 0.72, u)), 0.03 * o);
      vg.rotation.set(0.25 * o, 0.2 * o, -0.55 * o * p);
      m.position.y = m.userData.y - 0.28 * (ss(0.25, 0.4, u) - ss(0.5, 0.65, u));
    }
  } else if (state.WP.bolt && state.T < state.cycEnd) {
    const u = 1 - (state.cycEnd - state.T) / state.WP.rate;
    const lift = ss(0.15, 0.28, u) - ss(0.8, 0.92, u);
    const back = ss(0.3, 0.45, u) - ss(0.65, 0.78, u);
    const bf = ss(0.42, 0.62, u);
    boltPose(lift, back);
    vg.rotation.z = -0.05 * lift;
    if (u > 0.42 && u < 0.66) {
      BUL.visible = true;
      BUL.position.set(0.12 * (1 - bf), 0.14 - 0.085 * bf, 0.14);
      BUL.rotation.z = 0.6 * (1 - bf);
    }
  }
}

export const flash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xffc94d }));
flash.position.z = -0.34;
flash.visible = false;
gun.add(flash);
gun.position.set(0.2, -0.2, -0.45);
cam.add(gun);
