import * as THREE from 'three';
import { noiseBurst } from '../audio/noiseBurst';
import { GRENADE_COLORS } from '../data/grenades';
import { screenFx } from '../effects/state';
import { input } from '../input/state';
import { loadout } from '../loadout/state';
import { scene } from '../render/scene';
import { clock } from '../sim/state';
import { fuseTime } from './fuseTime';
import { flyingGrenades, grenadeCount, grenadeThrow } from './state';
import { throwStart } from './throwStart';

export const throwGrenade = () => {
  const t = loadout.grenade;

  if (!t || !grenadeCount[t]) {
    return;
  }

  grenadeCount[t]--;
  loadout.grenade = null;
  input.fireHeld = false;
  grenadeThrow.held = false;

  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 8),
    new THREE.MeshLambertMaterial({ color: GRENADE_COLORS[t] }),
  );

  scene.add(m);
  flyingGrenades.push({ ...throwStart(), type: t, mesh: m, fuseAt: clock.time + fuseTime(t) });
  noiseBurst(0.15, 0.05, 3000);
  screenFx.gunKick = -0.05;
};
