import { loadout } from '../loadout/state';
import { clock } from '../sim/state';
import { smoothstep } from '../utils/smoothstep';
import { active, boltMeshes, bulletMeshes, magMeshes, viewModels } from './models';

/** Bolt handle pose: `l` lifted, `b` pulled back (0..1). */
const boltPose = (l: number, b: number) => {
  active.bolt.rotation.z = 0.9 * l;
  active.bolt.position.set(0.05, 0.02 + 0.035 * l, 0.1 + 0.12 * b);
};

export const animateViewModel = () => {
  if (boltMeshes[loadout.weaponId]) {
    active.bolt = boltMeshes[loadout.weaponId];
    active.bullet = bulletMeshes[loadout.weaponId];
  }

  for (const k in viewModels) {
    viewModels[k].position.set(0, 0, 0);
    viewModels[k].rotation.set(0, 0, 0);
  }

  for (const k in magMeshes) {
    magMeshes[k].position.y = magMeshes[k].userData.y;
  }

  boltPose(0, 0);
  active.bullet.visible = false;

  const vg = viewModels[loadout.weaponId];

  if (loadout.weaponId === 'knife') {
    vg.rotation.set(0.12, -0.3, 0.5);
    vg.position.set(0.02, 0.04, -0.08);

    if (clock.time < loadout.slashEnd) {
      const u = 1 - (loadout.slashEnd - clock.time) / 0.3;
      const sn = Math.sin(u * Math.PI);

      vg.rotation.set(0.12 - 1.0 * sn, -0.3 + 0.9 * sn, 0.5 - 1.6 * sn);
      vg.position.set(0.02 - 0.16 * sn, 0.04 - 0.06 * sn, -0.08 - 0.18 * sn);
    }
  }

  if (loadout.reloading) {
    const u = 1 - (loadout.reloadEnd - clock.time) / loadout.weapon.reloadTime;
    const o = smoothstep(0, 0.18, u) - smoothstep(0.85, 1, u);

    if (loadout.weapon.boltAction) {
      vg.position.set(-0.04 * o, -0.05 * o, 0);
      vg.rotation.set(0.2 * o, 0, -0.45 * o);

      const op = smoothstep(0.12, 0.22, u) - smoothstep(0.85, 0.93, u);

      boltPose(op, op);

      const k = (u - 0.25) / 0.55;

      if (k > 0 && k < 1) {
        const f = (k * 3) % 1;

        active.bullet.visible = true;
        active.bullet.position.set(0.12 * (1 - f), 0.14 - 0.085 * f, 0.14);
        active.bullet.rotation.z = 0.6 * (1 - f);
      }
    } else {
      const p = loadout.weaponId === 'pistol' ? 0.7 : 1;
      const m = magMeshes[loadout.weaponId];

      vg.position.set(-0.05 * o, -0.05 * o - 0.015 * Math.sin(Math.PI * smoothstep(0.65, 0.72, u)), 0.03 * o);
      vg.rotation.set(0.25 * o, 0.2 * o, -0.55 * o * p);
      m.position.y = m.userData.y - 0.28 * (smoothstep(0.25, 0.4, u) - smoothstep(0.5, 0.65, u));
    }
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
