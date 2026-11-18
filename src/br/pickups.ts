import * as THREE from 'three';
import { grenadeCount } from '../grenades';
import { feedMessage } from '../hud/hud';
import { giveWeapon, carriedGuns, loadout, opticTarget, swapOptic } from '../loadout';
import { scene, srgbTex } from '../render/renderer';
import { viewModels, boxMesh, cylinderMesh, makeOptic, lambert } from '../viewmodel';
import { GRENADE_COLORS, GRENADE_NAMES, OPTICS, WEAPONS } from '../weapons';
import { floorY } from '../world/level';
import { player } from '../player';
import type { AmmoType, GrenadeId, OpticId, OwnedWeapon, Pickup, PickupKind } from '../types';

export const pickups: Pickup[] = [];
/** The pickup E would swap for. */
export const looting = { swapTarget: null as Pickup | null };

function makeLabel(text: string, col: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d')!;
  x.font = 'bold 30px sans-serif';
  x.textAlign = 'center';
  x.lineWidth = 5;
  x.strokeStyle = '#000';
  x.strokeText(text, 128, 40);
  x.fillStyle = col;
  x.fillText(text, 128, 40);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: srgbTex(new THREE.CanvasTexture(c)), transparent: true }));
  sp.scale.set(2.4, 0.6, 1);
  return sp;
}

const AMMO_NAMES: Partial<Record<AmmoType, string>> = { pst: 'Pistol ammo', smg: 'SMG ammo', rif: 'Rifle ammo', shl: 'Shotgun shells', snp: 'Sniper ammo' };

/** Places a pickup of kind `t` (`id` is the weapon, ammo, grenade or optic id) at (x, z), on the floor unless `y0` is given. */
export function spawnPickup(x: number, z: number, t: PickupKind, id: string | null, st?: OwnedWeapon, y0?: number) {
  const col = t === 'weapon' ? 0xf2a23a : t === 'armor' ? 0x4a8cff : t === 'ammo' ? 0xd9d046 : t === 'grenade' ? 0xe05a3a : t === 'optic' ? 0xb98cff : 0x4ad66a;
  const g = new THREE.Group();
  const it = new THREE.Group();
  const k = id!;
  const n = t === 'weapon' ? WEAPONS[k].name + (st && st.optic ? ' + ' + OPTICS[st.optic].shortName : '') : t === 'armor' ? 'Kevlar vest' : t === 'ammo' ? AMMO_NAMES[k as AmmoType]! : t === 'grenade' ? GRENADE_NAMES[k as GrenadeId] : t === 'optic' ? OPTICS[k as OpticId].name : 'Medkit';
  if (t === 'weapon') {
    const m = viewModels[k].clone(true);
    m.visible = true;
    m.position.set(0, 0, 0);
    m.rotation.set(0, 0, 0);
    m.scale.setScalar(WEAPONS[k].slot === 2 ? 2.4 : 1.4);
    it.add(m);
    it.position.y = 0.95;
  } else if (t === 'armor') {
    const b = lambert(0x2f5fb8);
    boxMesh(it, 0.5, 0.6, 0.3, 0, 0, 0, b);
    boxMesh(it, 0.38, 0.4, 0.05, 0, 0, 0.17, lambert(0x1c2a44));
    boxMesh(it, 0.12, 0.2, 0.32, -0.17, 0.38, 0, b);
    boxMesh(it, 0.12, 0.2, 0.32, 0.17, 0.38, 0, b);
    it.position.y = 0.7;
  } else if (t === 'ammo') {
    boxMesh(it, 0.55, 0.28, 0.36, 0, 0, 0, lambert(0x55603a));
    for (const i of [-1, 0, 1]) {
      cylinderMesh(it, 0.05, 0.22, i * 0.14, 0.2, 0, lambert(0xc9a227));
    }
    it.position.y = 0.45;
  } else if (t === 'optic') {
    const m = makeOptic(k as OpticId);
    m.scale.setScalar(4.2);
    m.visible = true;
    it.add(m);
    it.position.y = 0.5;
  } else if (t === 'grenade') {
    it.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshLambertMaterial({ color: GRENADE_COLORS[k as GrenadeId] })));
    cylinderMesh(it, 0.05, 0.12, 0, 0.17, 0, lambert(0x444));
    it.position.y = 0.55;
  } else {
    boxMesh(it, 0.55, 0.36, 0.38, 0, 0, 0, lambert(0xeeeeee));
    boxMesh(it, 0.3, 0.03, 0.08, 0, 0.19, 0, lambert(0xd22222));
    boxMesh(it, 0.08, 0.03, 0.3, 0, 0.19, 0, lambert(0xd22222));
    it.position.y = 0.55;
  }
  g.add(it);
  const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 12, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 }));
  bm.position.y = 6;
  g.add(bm);
  const lab = makeLabel(n, t === 'weapon' ? '#ffcf5a' : t === 'armor' ? '#8fb8ff' : t === 'ammo' ? '#ffe27a' : t === 'grenade' ? '#ff9a7a' : t === 'optic' ? '#d3b2ff' : '#8fffa8');
  lab.position.y = 2.1;
  lab.visible = false;
  g.add(lab);
  const gy = y0 === undefined ? floorY(x, z) : y0;
  g.position.set(x, gy, z);
  scene.add(g);
  pickups.push({ mesh: g, label: lab, x, z, y: gy, kind: t, itemId: id, name: n, weaponState: st });
}

/** Swaps the held weapon (or optic) for pickup `k`, dropping the old one. */
export function swapPickup(k: Pickup) {
  if (k.kind === 'optic') {
    swapOptic(k);
    return;
  }
  if (carriedGuns().length < 2 || loadout.owned[k.itemId!]) {
    return;
  }
  const drop = loadout.weaponId !== 'knife' ? loadout.weaponId : carriedGuns()[1];
  const st: OwnedWeapon = drop === loadout.weaponId ? { ammo: loadout.ammo, reserve: loadout.reserve, optic: loadout.owned[loadout.weaponId] && loadout.owned[loadout.weaponId].optic } : { ammo: loadout.owned[drop].ammo, reserve: loadout.owned[drop].reserve, optic: loadout.owned[drop].optic };
  spawnPickup(k.x, k.z, 'weapon', drop, st, k.y);
  giveWeapon(k.itemId!, k.weaponState, drop);
  scene.remove(k.mesh);
  pickups.splice(pickups.indexOf(k), 1);
  looting.swapTarget = null;
}

/** The n-th gun carried. */
export function gunInSlot(n: number) {
  return carriedGuns()[n - 1];
}

export function clearPickups() {
  for (const k of pickups) {
    scene.remove(k.mesh);
  }
  pickups.length = 0;
}

export function takePickup(k: Pickup) {
  if (k.kind === 'weapon') {
    giveWeapon(k.itemId!, k.weaponState);
  } else if (k.kind === 'armor') {
    player.armor = 100;
  } else if (k.kind === 'grenade') {
    grenadeCount[k.itemId as GrenadeId]++;
  } else if (k.kind === 'optic') {
    const tg = opticTarget();
    if (tg) {
      loadout.owned[tg].optic = k.itemId as OpticId;

      feedMessage('Attached ' + k.name + ' to ' + WEAPONS[tg].name);
    }
    return;
  } else if (k.kind === 'ammo') {
    let add = 0;
    for (const q in loadout.owned) {
      if (WEAPONS[q].ammoType === k.itemId) {
        add = WEAPONS[q].magSize * 2;
        if (q === loadout.weaponId) {
          loadout.reserve += add;
        } else {
          loadout.owned[q].reserve += add;
        }
      }
    }
    feedMessage('Picked up ' + k.name + ' (+' + add + ' rounds)');
    return;
  } else {
    player.health = Math.min(100, player.health + 50);
  }
  feedMessage('Picked up ' + k.name);
}
