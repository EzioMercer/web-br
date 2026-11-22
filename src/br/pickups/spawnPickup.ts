import * as THREE from 'three';
import { AMMO_NAMES } from '../../data/ammo';
import { GRENADE_COLORS, GRENADE_NAMES } from '../../data/grenades';
import { OPTICS } from '../../data/optics';
import { WEAPONS } from '../../data/weapons';
import { scene } from '../../render/scene';
import { boxMesh } from '../../utils/three/boxMesh';
import { cylinderMesh } from '../../utils/three/cylinderMesh';
import { lambert } from '../../utils/three/lambert';
import { makeOptic } from '../../viewmodel/makeOptic';
import { viewModels } from '../../viewmodel/models';
import { floorY } from '../../world/level/floorY';
import { clearSpot } from './clearSpot';
import { makeLabel } from './makeLabel';
import { pickups } from './state';
import { AmmoType, PickupKind } from '../../types';
import type { GrenadeId, OpticId, OwnedWeapon, Pickup } from '../../types';
import type { WeaponId } from '../../types';
import { mergeMeshes } from '../../utils/three/mergeMeshes';
import { hypot } from '../../utils/hypot';

/**
 * Places a pickup of kind `t` (`id` is the weapon, ammo, grenade or optic id) at (x, z), on the floor unless `y0` is
 * given. Returns the pickup.
 */
export const spawnPickup = (x: number, z: number, t: PickupKind, id: string | null, st?: OwnedWeapon, y0?: number) => {
  const col = t === PickupKind.Weapon
    ? 0xf2a23a
    : t === PickupKind.Armor
      ? 0x4a8cff
      : t === PickupKind.Ammo
        ? 0xd9d046
        : t === PickupKind.Grenade
          ? 0xe05a3a
          : t === PickupKind.Optic
            ? 0xb98cff
            : 0x4ad66a;
  const g = new THREE.Group();
  const it = new THREE.Group();
  const k = id!;
  const n = t === PickupKind.Weapon
    ? WEAPONS[k as WeaponId].name + (st && st.optic ? ' + ' + OPTICS[st.optic].shortName : '')
    : t === PickupKind.Armor
      ? 'Kevlar vest'
      : t === PickupKind.Ammo
        ? AMMO_NAMES[k as AmmoType]!
        : t === PickupKind.Grenade
          ? GRENADE_NAMES[k as GrenadeId]
          : t === PickupKind.Optic
            ? OPTICS[k as OpticId].name
            : 'Medkit';

  if (t === PickupKind.Weapon) {
    const m = viewModels[k as WeaponId].clone(true);

    m.visible = true;
    m.position.set(0, 0, 0);
    m.rotation.set(0, 0, 0);
    m.scale.setScalar(WEAPONS[k as WeaponId].slot === 2 ? 2.4 : 1.4);
    m.traverse((o) => {
      // drawn with the world, not in the first-person pass
      o.layers.set(0);

      // the copy takes whatever optic the player's gun shows right now: show only the one this gun carries
      if (o.name.startsWith('opt_')) {
        o.visible = o.name === 'opt_' + (st?.optic ?? '');
      }
    });
    // spin round the middle of the gun, not its grip
    m.updateMatrixWorld(true);
    m.position.sub(new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()).setY(0));
    it.add(m);
    it.position.y = 0.95;
  } else if (t === PickupKind.Armor) {
    const b = lambert(0x2f5fb8);

    boxMesh(it, 0.5, 0.6, 0.3, 0, 0, 0, b);
    boxMesh(it, 0.38, 0.4, 0.05, 0, 0, 0.17, lambert(0x1c2a44));
    boxMesh(it, 0.12, 0.2, 0.32, -0.17, 0.38, 0, b);
    boxMesh(it, 0.12, 0.2, 0.32, 0.17, 0.38, 0, b);
    it.position.y = 0.7;
  } else if (t === PickupKind.Ammo) {
    boxMesh(it, 0.55, 0.28, 0.36, 0, 0, 0, lambert(0x55603a));

    for (const i of [-1, 0, 1]) {
      cylinderMesh(it, 0.05, 0.22, i * 0.14, 0.2, 0, lambert(0xc9a227));
    }

    it.position.y = 0.45;
  } else if (t === PickupKind.Optic) {
    const m = makeOptic(k as OpticId);

    m.scale.setScalar(4.2);
    m.visible = true;
    it.add(m);
    it.position.y = 0.5;
  } else if (t === PickupKind.Grenade) {
    it.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 10),
        new THREE.MeshLambertMaterial({ color: GRENADE_COLORS[k as GrenadeId] }),
      ),
    );
    cylinderMesh(it, 0.05, 0.12, 0, 0.17, 0, lambert(0x444));
    it.position.y = 0.55;
  } else {
    boxMesh(it, 0.55, 0.36, 0.38, 0, 0, 0, lambert(0xeeeeee));
    boxMesh(it, 0.3, 0.03, 0.08, 0, 0.19, 0, lambert(0xd22222));
    boxMesh(it, 0.08, 0.03, 0.3, 0, 0.19, 0, lambert(0xd22222));
    it.position.y = 0.55;
  }

  // the item's parts in a few draw calls (one per material) instead of one per part
  mergeMeshes(it, true);
  g.add(it);

  // how far the item reaches from the axis it spins round
  let reach = 0.3;

  it.updateMatrixWorld(true);

  const ib = new THREE.Box3().setFromObject(it);

  if (!ib.isEmpty()) {
    reach = Math.max(
      hypot(ib.min.x, ib.min.z),
      hypot(ib.min.x, ib.max.z),
      hypot(ib.max.x, ib.min.z),
      hypot(ib.max.x, ib.max.z),
    );
  }

  const bm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 12, 6),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 }),
  );

  bm.position.y = 6;
  g.add(bm);

  const lab = makeLabel(
    n,
    t === PickupKind.Weapon
      ? '#ffcf5a'
      : t === PickupKind.Armor
        ? '#8fb8ff'
        : t === PickupKind.Ammo
          ? '#ffe27a'
          : t === PickupKind.Grenade
            ? '#ff9a7a'
            : t === PickupKind.Optic
              ? '#d3b2ff'
              : '#8fffa8',
  );

  lab.position.y = 2.1;
  lab.visible = false;
  g.add(lab);

  const [px, py, pz] = clearSpot(x, z, y0 === undefined ? floorY(x, z) : y0, reach + 0.05);

  g.position.set(px, py, pz);
  scene.add(g);

  const pk: Pickup = { mesh: g, label: lab, x: px, z: pz, y: py, kind: t, itemId: id, name: n, weaponState: st };

  pickups.push(pk);
  return pk;
};
