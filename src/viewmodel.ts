import * as THREE from 'three';
import { camera } from './render/renderer';
import { OPTIC_IDS } from './weapons';
import { loadout } from './loadout';
import { simTime } from './sim';
import type { OpticId } from './types';

/** First-person weapon models, attached to the camera. */
export const gunRig = new THREE.Group();

export const lambert = (c: number) => new THREE.MeshLambertMaterial({ color: c });

const gunMetal = lambert(0x3a3f44);
const woodMat = lambert(0x7a4a22);
const darkMat = lambert(0x1d2024);
const oliveMat = lambert(0x3d4a36);
const lensGlass = new THREE.MeshPhongMaterial(
  { color: 0x7fd0ff, transparent: true, opacity: 0.4, shininess: 120, specular: 0xffffff },
);

export const boxMesh = (
  g: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  m: THREE.Material,
  rx?: number,
) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

  o.position.set(x, y, z);

  if (rx) {
    o.rotation.x = rx;
  }

  g.add(o);
  return o;
};

/** Cylinder along z. */
export const cylinderMesh = (
  g: THREE.Object3D,
  r: number,
  l: number,
  x: number,
  y: number,
  z: number,
  m: THREE.Material,
) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 16), m);

  o.rotation.x = Math.PI / 2;
  o.position.set(x, y, z);
  g.add(o);
  return o;
};

/** Viewmodel per weapon id. */
export const viewModels: Record<string, THREE.Group> = {
  pistol: new THREE.Group(),
  rifle: new THREE.Group(),
  awp: new THREE.Group(),
};
/** Muzzle z per weapon id. */
export const muzzleZ: Record<string, number> = { pistol: -0.2, rifle: -0.62, awp: -0.9 };

/** Magazine, bolt and loose bullet meshes per weapon id, for the reload and bolt animations. */
const magMeshes: Record<string, THREE.Object3D> = {};
const boltMeshes: Record<string, THREE.Object3D> = {};
const bulletMeshes: Record<string, THREE.Object3D> = {};

/** Optic meshes per weapon id (the guns that take optics). */
export const opticMeshes: Record<string, Partial<Record<OpticId, THREE.Object3D>>> = {};

let bolt: THREE.Object3D;
let bullet: THREE.Object3D;

{
  const g = viewModels.pistol;

  boxMesh(g, 0.045, 0.065, 0.24, 0, 0, -0.04, gunMetal);
  boxMesh(g, 0.04, 0.11, 0.055, 0, -0.075, 0.05, darkMat, 0.25);
  boxMesh(g, 0.02, 0.02, 0.05, 0, -0.045, -0.01, darkMat);
  cylinderMesh(g, 0.01, 0.1, 0, 0.005, -0.2, darkMat);
  magMeshes.pistol = boxMesh(g, 0.034, 0.05, 0.04, 0, -0.125, 0.065, lambert(0x8a8d90), 0.25);
  magMeshes.pistol.userData.y = -0.125;
}
{
  const g = viewModels.rifle;

  boxMesh(g, 0.06, 0.085, 0.36, 0, 0, -0.05, gunMetal);
  boxMesh(g, 0.068, 0.06, 0.3, 0, -0.005, -0.35, woodMat);
  cylinderMesh(g, 0.011, 0.34, 0, 0.02, -0.52, darkMat);
  magMeshes.rifle = boxMesh(g, 0.038, 0.15, 0.07, 0, -0.11, -0.1, darkMat, 0.3);
  magMeshes.rifle.userData.y = -0.11;
  boxMesh(g, 0.05, 0.1, 0.26, 0, -0.015, 0.28, woodMat);
  boxMesh(g, 0.04, 0.1, 0.05, 0, -0.085, 0.1, woodMat, 0.3);
  boxMesh(g, 0.01, 0.04, 0.01, 0, 0.05, -0.62, darkMat);
}
{
  const g = viewModels.awp;

  boxMesh(g, 0.06, 0.09, 0.5, 0, 0, 0, oliveMat);
  cylinderMesh(g, 0.014, 0.62, 0, 0.015, -0.56, darkMat);
  cylinderMesh(g, 0.022, 0.06, 0, 0.015, -0.9, darkMat);
  boxMesh(g, 0.05, 0.12, 0.38, 0, -0.025, 0.4, oliveMat);
  boxMesh(g, 0.035, 0.12, 0.05, 0, -0.08, 0.14, oliveMat, 0.2);
  bolt = boxMesh(g, 0.07, 0.015, 0.015, 0.05, 0.02, 0.1, darkMat);
  boxMesh(g, 0.02, 0.04, 0.03, 0, 0.065, -0.1, darkMat);
  boxMesh(g, 0.02, 0.04, 0.03, 0, 0.065, 0.06, darkMat);
  cylinderMesh(g, 0.028, 0.3, 0, 0.105, -0.02, darkMat);
  cylinderMesh(g, 0.038, 0.07, 0, 0.105, -0.19, darkMat);
  cylinderMesh(g, 0.034, 0.004, 0, 0.105, -0.227, lensGlass);
  cylinderMesh(g, 0.024, 0.004, 0, 0.105, 0.132, lensGlass);
}
bullet = new THREE.Group();
cylinderMesh(bullet, 0.008, 0.05, 0, 0, 0, lambert(0xc9a227));
cylinderMesh(bullet, 0.006, 0.03, 0, 0, -0.04, lambert(0xb87333));
bullet.visible = false;
viewModels.awp.add(bullet);
magMeshes.awp = boxMesh(viewModels.awp, 0.035, 0.11, 0.07, 0, -0.1, 0.12, darkMat, 0.1);
magMeshes.awp.userData.y = -0.1;
gunRig.add(viewModels.pistol, viewModels.rifle, viewModels.awp);

/** Registers weapon `id` as a scaled, recolored copy of the `base` model. */
const cloneModel = (id: string, base: string, sc: number, col: number) => {
  const g = viewModels[base].clone(true);

  g.scale.setScalar(sc);

  if (col) {
    g.traverse((o) => {
      if (o instanceof THREE.Mesh && (o.material === woodMat || o.material === oliveMat)) {
        o.material = lambert(col);
      }
    });
  }

  viewModels[id] = g;
  gunRig.add(g);
  magMeshes[id] = g.children[viewModels[base].children.indexOf(magMeshes[base])];
  muzzleZ[id] = muzzleZ[base] * sc;

  if (base === 'awp') {
    boltMeshes[id] = g.children[viewModels.awp.children.indexOf(bolt)];
    bulletMeshes[id] = g.children[viewModels.awp.children.indexOf(bullet)];
  }
};

const opticBlack = lambert(0x151719);

const lensMat = (t: OpticId) => new THREE.MeshBasicMaterial(
  { color: t === 'rd' ? 0xff4030 : t === 'ho' ? 0xff6a50 : 0x7fb8ff, transparent: true, opacity: 0.8 },
);

/** Optic model (also used for Battle Royale pickups). */
export const makeOptic = (t: OpticId) => {
  const bk = opticBlack;
  const g = new THREE.Group();
  const l = lensMat(t);

  if (t === 'rd') {
    boxMesh(g, 0.03, 0.012, 0.08, 0, 0.006, 0, bk);
    boxMesh(g, 0.036, 0.045, 0.016, 0, 0.034, 0.03, bk);
    boxMesh(g, 0.036, 0.012, 0.07, 0, 0.06, 0, bk);
    boxMesh(g, 0.026, 0.034, 0.004, 0, 0.036, -0.03, l);
  } else if (t === 'ho') {
    boxMesh(g, 0.04, 0.012, 0.09, 0, 0.006, 0, bk);
    boxMesh(g, 0.006, 0.05, 0.07, -0.02, 0.037, 0, bk);
    boxMesh(g, 0.006, 0.05, 0.07, 0.02, 0.037, 0, bk);
    boxMesh(g, 0.046, 0.008, 0.07, 0, 0.066, 0, bk);
    boxMesh(g, 0.034, 0.04, 0.004, 0, 0.04, -0.034, l);
  } else if (t === 'x2') {
    boxMesh(g, 0.03, 0.02, 0.08, 0, 0.012, 0, bk);
    cylinderMesh(g, 0.02, 0.14, 0, 0.045, 0, bk);
    cylinderMesh(g, 0.026, 0.03, 0, 0.045, -0.08, bk);
    cylinderMesh(g, 0.017, 0.003, 0, 0.045, -0.097, l);
    cylinderMesh(g, 0.015, 0.003, 0, 0.045, 0.071, l);
  } else {
    boxMesh(g, 0.04, 0.03, 0.1, 0, 0.018, 0, bk);
    cylinderMesh(g, 0.026, 0.17, 0, 0.052, 0, bk);
    cylinderMesh(g, 0.034, 0.04, 0, 0.052, -0.1, bk);
    cylinderMesh(g, 0.02, 0.04, 0, 0.052, 0.1, bk);
    cylinderMesh(g, 0.03, 0.003, 0, 0.052, -0.121, l);
    cylinderMesh(g, 0.014, 0.003, 0, 0.052, 0.121, l);
    cylinderMesh(g, 0.006, 0.12, 0, 0.088, 0, lambert(0xff9a2a));
  }

  return g;
};

for (const t of OPTIC_IDS) {
  const g = makeOptic(t);

  g.name = 'opt_' + t;
  g.position.set(0, 0.045, -0.12);
  g.visible = false;
  viewModels.rifle.add(g);
}

cloneModel('scout', 'awp', 0.85, 0x4a3a28);
cloneModel('svd', 'awp', 0.95, 0x6a4a28);
cloneModel('g3', 'awp', 1, 0x2a2c2e);
cloneModel('kar', 'awp', 1, 0x5a3a20);
cloneModel('m82', 'awp', 1.25, 0x55584f);
boltMeshes.awp = bolt;
bulletMeshes.awp = bullet;
cloneModel('glock', 'pistol', 0.95, 0);
cloneModel('deagle', 'pistol', 1.3, 0);
cloneModel('m3', 'rifle', 1.05, 0x2a1c10);
cloneModel('mp5', 'rifle', 0.75, 0x1c1e20);
cloneModel('p90', 'rifle', 0.7, 0x1c1e20);
cloneModel('m4', 'rifle', 1, 0x25282b);
// iron sights are part of the guns: aiming without an optic raises the gun until the tip of the front sight sits on
// the aim point (sightTip = its height above the gun origin)
export const sightTip: Record<string, number> = {};
{
  const dk = lambert(0x0e0e0e);

  const arcM = (g: THREE.Object3D, r: number, t: number, y: number, z: number, arc?: number) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, 18, arc || Math.PI * 2), dk);

    m.position.set(0, y, z);

    if (arc) {
      m.rotation.z = Math.PI;
    }

    g.add(m);
  };

  for (const id of ['rifle', 'm4', 'mp5', 'p90', 'm3']) {
    sightTip[id] = 0.07 * viewModels[id].scale.x;
  }

  for (const id of ['pistol', 'glock', 'deagle']) {
    sightTip[id] = 0.0455 * viewModels[id].scale.x;

    const g = viewModels[id];

    boxMesh(g, 0.006, 0.013, 0.008, 0, 0.039, -0.15, dk);
    boxMesh(g, 0.009, 0.014, 0.01, -0.012, 0.039, 0.07, dk);
    boxMesh(g, 0.009, 0.014, 0.01, 0.012, 0.039, 0.07, dk);
  }

  // AK-47: the front post alone. M4A1: rear peep ring round the post. MP5: half-circle rear sight with the post
  // standing in it. P90: ring sight. M3: bead.
  arcM(viewModels.m4, 0.016, 0.004, 0.07, 0.08);
  boxMesh(viewModels.m4, 0.008, 0.012, 0.01, 0, 0.048, 0.08, dk);
  arcM(viewModels.mp5, 0.018, 0.0035, 0.07, 0.06, Math.PI);
  boxMesh(viewModels.mp5, 0.008, 0.008, 0.01, 0, 0.0457, 0.06, dk);
  arcM(viewModels.p90, 0.02, 0.0025, 0.07, 0.03);
  boxMesh(viewModels.p90, 0.005, 0.005, 0.005, 0, 0.07, 0.03, dk);
  boxMesh(viewModels.p90, 0.006, 0.005, 0.008, 0, 0.045, 0.03, dk);
  {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 8, 6), dk);

    b.position.set(0, 0.0735, -0.62);
    viewModels.m3.add(b);
  }
}
{
  const g = viewModels.knife = new THREE.Group();
  const steel = lambert(0xb9c0c6);

  boxMesh(g, 0.022, 0.075, 0.34, 0, 0.012, -0.2, steel);
  boxMesh(g, 0.02, 0.05, 0.1, 0, 0.0, -0.42, steel);
  boxMesh(g, 0.09, 0.03, 0.03, 0, -0.012, -0.03, darkMat);
  boxMesh(g, 0.035, 0.045, 0.16, 0, -0.016, 0.07, lambert(0x2a2420));
  gunRig.add(g);
  muzzleZ.knife = -0.1;
}

for (const id of ['rifle', 'm3', 'mp5', 'p90', 'm4']) {
  opticMeshes[id] = {};

  for (const t of OPTIC_IDS) {
    opticMeshes[id][t] = viewModels[id].children.find(c => c.name === 'opt_' + t)!;
  }
}

export const heldGrenade = new THREE.Mesh(
  new THREE.SphereGeometry(0.05, 12, 10),
  new THREE.MeshLambertMaterial({ color: 0x3c5a3a }),
);
heldGrenade.position.set(0, -0.05, -0.15);
heldGrenade.visible = false;
gunRig.add(heldGrenade);

const smoothstep = (a: number, b: number, u: number) => {
  const x = Math.min(1, Math.max(0, (u - a) / (b - a)));

  return x * x * (3 - 2 * x);
};

/** Bolt handle pose: `l` lifted, `b` pulled back (0..1). */
const boltPose = (l: number, b: number) => {
  bolt.rotation.z = 0.9 * l;
  bolt.position.set(0.05, 0.02 + 0.035 * l, 0.1 + 0.12 * b);
};

export const animateViewModel = () => {
  if (boltMeshes[loadout.weaponId]) {
    bolt = boltMeshes[loadout.weaponId];
    bullet = bulletMeshes[loadout.weaponId];
  }

  for (const k in viewModels) {
    viewModels[k].position.set(0, 0, 0);
    viewModels[k].rotation.set(0, 0, 0);
  }

  for (const k in magMeshes) {
    magMeshes[k].position.y = magMeshes[k].userData.y;
  }

  boltPose(0, 0);
  bullet.visible = false;

  const vg = viewModels[loadout.weaponId];

  if (loadout.weaponId === 'knife') {
    vg.rotation.set(0.12, -0.3, 0.5);
    vg.position.set(0.02, 0.04, -0.08);

    if (simTime < loadout.slashEnd) {
      const u = 1 - (loadout.slashEnd - simTime) / 0.3;
      const sn = Math.sin(u * Math.PI);

      vg.rotation.set(0.12 - 1.0 * sn, -0.3 + 0.9 * sn, 0.5 - 1.6 * sn);
      vg.position.set(0.02 - 0.16 * sn, 0.04 - 0.06 * sn, -0.08 - 0.18 * sn);
    }
  }

  if (loadout.reloading) {
    const u = 1 - (loadout.reloadEnd - simTime) / loadout.weapon.reloadTime;
    const o = smoothstep(0, 0.18, u) - smoothstep(0.85, 1, u);

    if (loadout.weapon.boltAction) {
      vg.position.set(-0.04 * o, -0.05 * o, 0);
      vg.rotation.set(0.2 * o, 0, -0.45 * o);

      const op = smoothstep(0.12, 0.22, u) - smoothstep(0.85, 0.93, u);

      boltPose(op, op);

      const k = (u - 0.25) / 0.55;

      if (k > 0 && k < 1) {
        const f = (k * 3) % 1;

        bullet.visible = true;
        bullet.position.set(0.12 * (1 - f), 0.14 - 0.085 * f, 0.14);
        bullet.rotation.z = 0.6 * (1 - f);
      }
    } else {
      const p = loadout.weaponId === 'pistol' ? 0.7 : 1;
      const m = magMeshes[loadout.weaponId];

      vg.position.set(-0.05 * o, -0.05 * o - 0.015 * Math.sin(Math.PI * smoothstep(0.65, 0.72, u)), 0.03 * o);
      vg.rotation.set(0.25 * o, 0.2 * o, -0.55 * o * p);
      m.position.y = m.userData.y - 0.28 * (smoothstep(0.25, 0.4, u) - smoothstep(0.5, 0.65, u));
    }
  } else if (loadout.weapon.boltAction && simTime < loadout.boltCycleEnd) {
    const u = 1 - (loadout.boltCycleEnd - simTime) / loadout.weapon.fireInterval;
    const lift = smoothstep(0.15, 0.28, u) - smoothstep(0.8, 0.92, u);
    const back = smoothstep(0.3, 0.45, u) - smoothstep(0.65, 0.78, u);
    const bf = smoothstep(0.42, 0.62, u);

    boltPose(lift, back);
    vg.rotation.z = -0.05 * lift;

    if (u > 0.42 && u < 0.66) {
      bullet.visible = true;
      bullet.position.set(0.12 * (1 - bf), 0.14 - 0.085 * bf, 0.14);
      bullet.rotation.z = 0.6 * (1 - bf);
    }
  }
};

export const muzzleFlashMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.12, 0.08),
  new THREE.MeshBasicMaterial({ color: 0xffc94d }),
);
muzzleFlashMesh.position.z = -0.34;
muzzleFlashMesh.visible = false;
gunRig.add(muzzleFlashMesh);
gunRig.position.set(0.2, -0.2, -0.45);
camera.add(gunRig);
