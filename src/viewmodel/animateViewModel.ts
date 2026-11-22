import { loadout } from '../loadout/state';
import { clock } from '../sim/state';
import { smoothstep } from '../utils/smoothstep';
import type * as THREE from 'three';
import { ReloadPhase } from '../loadout/types';
import { active, boltMeshes, bulletMeshes, magMeshes, shotgunShell, viewModels } from './models';
import { WeaponId } from '../types';

/** Bolt handle pose: `l` lifted, `b` pulled back (0..1). */
const boltPose = (l: number, b: number) => {
  active.bolt.rotation.z = 0.9 * l;
  active.bolt.position.set(0.05, 0.02 + 0.035 * l, 0.1 + 0.12 * b);
};

/**
 * Shell-by-shell reload of the gun `vg`: the gun tilts while the action opens, each round slides in over one
 * `reloadTime`, and the gun comes back as the bolt closes or the pump racks. Each step has its own clock, so the
 * reload can stop after any round.
 */
const singleLoadPose = (vg: THREE.Object3D) => {
  const ph = loadout.reloadPhase;
  const q = Math.min(1, (clock.time - loadout.reloadFrom) / (loadout.reloadEnd - loadout.reloadFrom));
  const o = ph === ReloadPhase.Open ? smoothstep(0, 1, q) : ph === ReloadPhase.Close ? 1 - smoothstep(0.2, 1, q) : 1;

  if (loadout.weapon.boltAction) {
    const op = ph === ReloadPhase.Open
      ? smoothstep(0.35, 1, q)
      : ph === ReloadPhase.Close ? 1 - smoothstep(0, 0.5, q) : 1;

    vg.position.set(-0.04 * o, -0.05 * o, 0);
    vg.rotation.set(0.2 * o, 0, -0.45 * o);
    boltPose(op, op);

    if (ph === ReloadPhase.Round && q < 0.85) {
      const f = smoothstep(0.1, 0.8, q);

      active.bullet.visible = true;
      active.bullet.position.set(0.12 * (1 - f), 0.14 - 0.085 * f, 0.14);
      active.bullet.rotation.z = 0.6 * (1 - f);
    }

    return;
  }

  // pump shotgun: rolled to show the loading port under the receiver; the shell is thumbed up and forward into the
  // tube, the gun nudges as it clicks home, and closing racks the pump (a short jolt back)
  const push = ph === ReloadPhase.Round ? Math.sin(Math.PI * smoothstep(0.6, 0.85, q)) : 0;
  const rack = ph === ReloadPhase.Close ? Math.sin(Math.PI * smoothstep(0, 0.55, q)) : 0;

  vg.position.set(-0.07 * o, 0.05 * o - 0.006 * push, 0.04 * o + 0.035 * rack);
  vg.rotation.set(0.3 * o - 0.05 * rack, 0.15 * o, -0.9 * o);

  if (ph === ReloadPhase.Round && q < 0.75) {
    const f = smoothstep(0.05, 0.7, q);

    shotgunShell.visible = true;
    shotgunShell.position.set(-0.03 * (1 - f), -0.16 + 0.1 * f, 0.08 - 0.12 * f);
    shotgunShell.rotation.x = -0.5 * (1 - f);
  }
};

export const animateViewModel = () => {
  if (boltMeshes[loadout.weaponId]) {
    active.bolt = boltMeshes[loadout.weaponId];
    active.bullet = bulletMeshes[loadout.weaponId];
  }

  for (const k of Object.keys(viewModels) as WeaponId[]) {
    viewModels[k].position.set(0, 0, 0);
    viewModels[k].rotation.set(0, 0, 0);
  }

  for (const k of Object.keys(magMeshes) as WeaponId[]) {
    magMeshes[k].position.y = magMeshes[k].userData.y;
  }

  boltPose(0, 0);
  active.bullet.visible = false;
  shotgunShell.visible = false;

  const vg = viewModels[loadout.weaponId];

  if (loadout.weaponId === WeaponId.Knife) {
    vg.rotation.set(0.12, -0.3, 0.5);
    vg.position.set(0.02, 0.04, -0.08);

    if (clock.time < loadout.slashEnd) {
      const u = 1 - (loadout.slashEnd - clock.time) / 0.3;
      const sn = Math.sin(u * Math.PI);

      vg.rotation.set(0.12 - sn, -0.3 + 0.9 * sn, 0.5 - 1.6 * sn);
      vg.position.set(0.02 - 0.16 * sn, 0.04 - 0.06 * sn, -0.08 - 0.18 * sn);
    }
  }

  if (loadout.reloading && loadout.weapon.singleLoad) {
    singleLoadPose(vg);
  } else if (loadout.reloading) {
    const u = (clock.time - loadout.reloadFrom) / (loadout.reloadEnd - loadout.reloadFrom);
    const o = smoothstep(0, 0.18, u) - smoothstep(0.85, 1, u);
    const p = loadout.weaponId === WeaponId.Usp ? 0.7 : 1;
    const m = magMeshes[loadout.weaponId];

    vg.position.set(-0.05 * o, -0.05 * o - 0.015 * Math.sin(Math.PI * smoothstep(0.65, 0.72, u)), 0.03 * o);
    vg.rotation.set(0.25 * o, 0.2 * o, -0.55 * o * p);
    m.position.y = m.userData.y - 0.28 * (smoothstep(0.25, 0.4, u) - smoothstep(0.5, 0.65, u));
  } else if (loadout.weapon.boltAction && clock.time < loadout.boltCycleEnd) {
    const u = 1 - (loadout.boltCycleEnd - clock.time) / loadout.weapon.fireInterval;
    const lift = smoothstep(0.15, 0.28, u) - smoothstep(0.8, 0.92, u);
    const back = smoothstep(0.3, 0.45, u) - smoothstep(0.65, 0.78, u);
    const bf = smoothstep(0.42, 0.62, u);

    boltPose(lift, back);
    vg.rotation.z = -0.05 * lift;

    if (u > 0.42 && u < 0.66) {
      active.bullet.visible = true;
      active.bullet.position.set(0.12 * (1 - bf), 0.14 - 0.085 * bf, 0.14);
      active.bullet.rotation.z = 0.6 * (1 - bf);
    }
  }
};
