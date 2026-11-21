import * as THREE from 'three';
import { VIEWMODEL_LAYER } from '../config';
import { OPTIC_IDS } from '../data/optics';
import { camera } from '../render/camera';
import { boxMesh } from '../utils/three/boxMesh';
import { cylinderMesh } from '../utils/three/cylinderMesh';
import { lambert } from '../utils/three/lambert';
import { makeOptic } from './makeOptic';
import { darkMat, gunMetal, lensGlass, oliveMat, woodMat } from './materials';
import { WeaponId } from '../types';
import type { OpticId } from '../types';
import { keep } from '../utils/three/keep';

/** First-person weapon models, attached to the camera. */
export const gunRig = new THREE.Group();

/** Viewmodel per weapon id. */
export const viewModels = {
  [WeaponId.Usp]: new THREE.Group(),
  [WeaponId.Ak47]: new THREE.Group(),
  [WeaponId.Awp]: new THREE.Group(),
} as Record<WeaponId, THREE.Group>;

/** Muzzle z per weapon id. */
export const muzzleZ = {
  [WeaponId.Usp]: -0.2,
  [WeaponId.Ak47]: -0.62,
  [WeaponId.Awp]: -0.9,
} as Record<WeaponId, number>;

/** Magazine, bolt and loose bullet meshes per weapon id, for the reload and bolt animations. */
export const magMeshes = {} as Record<WeaponId, THREE.Object3D>;

export const boltMeshes = {} as Record<WeaponId, THREE.Object3D>;

export const bulletMeshes = {} as Record<WeaponId, THREE.Object3D>;

/** Optic meshes per weapon id (the guns that take optics). */
export const opticMeshes = {} as Record<WeaponId, Partial<Record<OpticId, THREE.Object3D>>>;

/** Bolt and loose bullet meshes of the sniper rifle in hand, for the bolt and reload animations. */
export const active = {} as { bolt: THREE.Object3D; bullet: THREE.Object3D };

{
  const g = viewModels[WeaponId.Usp];

  boxMesh(g, 0.045, 0.065, 0.24, 0, 0, -0.04, gunMetal);
  boxMesh(g, 0.04, 0.11, 0.055, 0, -0.075, 0.05, darkMat, 0.25);
  boxMesh(g, 0.02, 0.02, 0.05, 0, -0.045, -0.01, darkMat);
  cylinderMesh(g, 0.01, 0.1, 0, 0.005, -0.2, darkMat);
  magMeshes[WeaponId.Usp] = boxMesh(g, 0.034, 0.05, 0.04, 0, -0.125, 0.065, lambert(0x8a8d90), 0.25);
  magMeshes[WeaponId.Usp].userData.y = -0.125;
}

{
  const g = viewModels[WeaponId.Ak47];

  boxMesh(g, 0.06, 0.085, 0.36, 0, 0, -0.05, gunMetal);
  boxMesh(g, 0.068, 0.06, 0.3, 0, -0.005, -0.35, woodMat);
  cylinderMesh(g, 0.011, 0.34, 0, 0.02, -0.52, darkMat);
  magMeshes[WeaponId.Ak47] = boxMesh(g, 0.038, 0.15, 0.07, 0, -0.11, -0.1, darkMat, 0.3);
  magMeshes[WeaponId.Ak47].userData.y = -0.11;
  boxMesh(g, 0.05, 0.1, 0.26, 0, -0.015, 0.28, woodMat);
  boxMesh(g, 0.04, 0.1, 0.05, 0, -0.085, 0.1, woodMat, 0.3);
  boxMesh(g, 0.01, 0.04, 0.01, 0, 0.05, -0.62, darkMat);
}

{
  const g = viewModels[WeaponId.Awp];

  boxMesh(g, 0.06, 0.09, 0.5, 0, 0, 0, oliveMat);
  cylinderMesh(g, 0.014, 0.62, 0, 0.015, -0.56, darkMat);
  cylinderMesh(g, 0.022, 0.06, 0, 0.015, -0.9, darkMat);
  boxMesh(g, 0.05, 0.12, 0.38, 0, -0.025, 0.4, oliveMat);
  boxMesh(g, 0.035, 0.12, 0.05, 0, -0.08, 0.14, oliveMat, 0.2);
  active.bolt = boxMesh(g, 0.07, 0.015, 0.015, 0.05, 0.02, 0.1, darkMat);
  boxMesh(g, 0.02, 0.04, 0.03, 0, 0.065, -0.1, darkMat);
  boxMesh(g, 0.02, 0.04, 0.03, 0, 0.065, 0.06, darkMat);
  cylinderMesh(g, 0.028, 0.3, 0, 0.105, -0.02, darkMat);
  cylinderMesh(g, 0.038, 0.07, 0, 0.105, -0.19, darkMat);
  cylinderMesh(g, 0.034, 0.004, 0, 0.105, -0.227, lensGlass);
  cylinderMesh(g, 0.024, 0.004, 0, 0.105, 0.132, lensGlass);
}

active.bullet = new THREE.Group();

cylinderMesh(active.bullet, 0.008, 0.05, 0, 0, 0, lambert(0xc9a227));

cylinderMesh(active.bullet, 0.006, 0.03, 0, 0, -0.04, lambert(0xb87333));

active.bullet.visible = false;

viewModels[WeaponId.Awp].add(active.bullet);

magMeshes[WeaponId.Awp] = boxMesh(viewModels[WeaponId.Awp], 0.035, 0.11, 0.07, 0, -0.1, 0.12, darkMat, 0.1);

magMeshes[WeaponId.Awp].userData.y = -0.1;

gunRig.add(viewModels[WeaponId.Usp], viewModels[WeaponId.Ak47], viewModels[WeaponId.Awp]);

/** Registers weapon `id` as a scaled, recolored copy of the `base` model. */
const cloneModel = (id: WeaponId, base: WeaponId, sc: number, col: number) => {
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

  if (base === WeaponId.Awp) {
    boltMeshes[id] = g.children[viewModels[WeaponId.Awp].children.indexOf(active.bolt)];
    bulletMeshes[id] = g.children[viewModels[WeaponId.Awp].children.indexOf(active.bullet)];
  }
};

for (const t of OPTIC_IDS) {
  const g = makeOptic(t);

  g.name = 'opt_' + t;
  g.position.set(0, 0.045, -0.12);
  g.visible = false;
  viewModels[WeaponId.Ak47].add(g);
}

cloneModel(WeaponId.Scout, WeaponId.Awp, 0.85, 0x4a3a28);

cloneModel(WeaponId.Svd, WeaponId.Awp, 0.95, 0x6a4a28);

cloneModel(WeaponId.G3sg1, WeaponId.Awp, 1, 0x2a2c2e);

cloneModel(WeaponId.Kar98k, WeaponId.Awp, 1, 0x5a3a20);

cloneModel(WeaponId.BarrettM82, WeaponId.Awp, 1.25, 0x55584f);

boltMeshes[WeaponId.Awp] = active.bolt;

bulletMeshes[WeaponId.Awp] = active.bullet;

cloneModel(WeaponId.Glock18, WeaponId.Usp, 0.95, 0);

cloneModel(WeaponId.DesertEagle, WeaponId.Usp, 1.3, 0);

cloneModel(WeaponId.M3, WeaponId.Ak47, 1.05, 0x2a1c10);

cloneModel(WeaponId.Mp5, WeaponId.Ak47, 0.75, 0x1c1e20);

cloneModel(WeaponId.P90, WeaponId.Ak47, 0.7, 0x1c1e20);

cloneModel(WeaponId.M4a1, WeaponId.Ak47, 1, 0x25282b);

// iron sights are part of the guns: aiming without an optic raises the gun until the tip of the front sight sits on
// the aim point (sightTip = its height above the gun origin)
export const sightTip = {} as Record<WeaponId, number>;

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

  for (const id of [WeaponId.Ak47, WeaponId.M4a1, WeaponId.Mp5, WeaponId.P90, WeaponId.M3] as WeaponId[]) {
    sightTip[id] = 0.07 * viewModels[id].scale.x;
  }

  for (const id of [WeaponId.Usp, WeaponId.Glock18, WeaponId.DesertEagle] as WeaponId[]) {
    sightTip[id] = 0.0455 * viewModels[id].scale.x;

    const g = viewModels[id];

    boxMesh(g, 0.006, 0.013, 0.008, 0, 0.039, -0.15, dk);
    boxMesh(g, 0.009, 0.014, 0.01, -0.012, 0.039, 0.07, dk);
    boxMesh(g, 0.009, 0.014, 0.01, 0.012, 0.039, 0.07, dk);
  }

  // AK-47: the front post alone. M4A1: rear peep ring round the post. MP5: half-circle rear sight with the post
  // standing in it. P90: ring sight. M3: bead.
  arcM(viewModels[WeaponId.M4a1], 0.016, 0.004, 0.07, 0.08);
  boxMesh(viewModels[WeaponId.M4a1], 0.008, 0.012, 0.01, 0, 0.048, 0.08, dk);
  arcM(viewModels[WeaponId.Mp5], 0.018, 0.0035, 0.07, 0.06, Math.PI);
  boxMesh(viewModels[WeaponId.Mp5], 0.008, 0.008, 0.01, 0, 0.0457, 0.06, dk);
  arcM(viewModels[WeaponId.P90], 0.02, 0.0025, 0.07, 0.03);
  boxMesh(viewModels[WeaponId.P90], 0.005, 0.005, 0.005, 0, 0.07, 0.03, dk);
  boxMesh(viewModels[WeaponId.P90], 0.006, 0.005, 0.008, 0, 0.045, 0.03, dk);
  {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 8, 6), dk);

    b.position.set(0, 0.0735, -0.62);
    viewModels[WeaponId.M3].add(b);
  }
}

{
  const g = viewModels[WeaponId.Knife] = new THREE.Group();
  const steel = lambert(0xb9c0c6);

  boxMesh(g, 0.022, 0.075, 0.34, 0, 0.012, -0.2, steel);
  boxMesh(g, 0.02, 0.05, 0.1, 0, 0.0, -0.42, steel);
  boxMesh(g, 0.09, 0.03, 0.03, 0, -0.012, -0.03, darkMat);
  boxMesh(g, 0.035, 0.045, 0.16, 0, -0.016, 0.07, lambert(0x2a2420));
  gunRig.add(g);
  muzzleZ[WeaponId.Knife] = -0.1;
}

for (const id of [WeaponId.Ak47, WeaponId.M3, WeaponId.Mp5, WeaponId.P90, WeaponId.M4a1] as WeaponId[]) {
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

export const muzzleFlashMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.12, 0.08),
  new THREE.MeshBasicMaterial({ color: 0xffc94d }),
);

muzzleFlashMesh.position.z = -0.34;

muzzleFlashMesh.visible = false;

gunRig.add(muzzleFlashMesh);

gunRig.position.set(0.2, -0.2, -0.45);

// drawn in a pass of its own after the world (renderView)
gunRig.traverse(o => o.layers.set(VIEWMODEL_LAYER));

// pickups show copies of these guns that share their geometry and materials: freeing a pickup must not free them
keep(gunRig);

camera.add(gunRig);
