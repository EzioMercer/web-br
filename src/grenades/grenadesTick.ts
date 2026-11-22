import { scene } from '../render/scene';
import { clock } from '../sim/state';
import { detonate } from './detonate';
import { flyingGrenades, smokes } from './state';
import { stepGrenade } from './stepGrenade';
import { disposeObject } from '../utils/three/disposeObject';
import { hypot } from '../utils/hypot';
import { GrenadeId } from '../types';
import { SMOKE_FADE, SMOKE_POUR, SMOKE_RADIUS, SMOKE_SETTLE_SPEED } from './constants';
import { smoothstep } from '../utils/smoothstep';

export const grenadesTick = (dt: number) => {
  for (let i = flyingGrenades.length - 1; i >= 0; i--) {
    const n = flyingGrenades[i];

    if (stepGrenade(n, dt)) {
      n.landed = true;
    }

    n.mesh.position.set(n.x, n.y, n.z);

    // smoke starts pouring out once the canister has come to rest, wherever that takes
    const settled = n.type === GrenadeId.Smoke && n.landed && hypot(n.vx, n.vy, n.vz) < SMOKE_SETTLE_SPEED;

    if (clock.time >= n.fuseAt || settled) {
      scene.remove(n.mesh);
      disposeObject(n.mesh);
      flyingGrenades.splice(i, 1);
      detonate(n);
    }
  }

  for (let i = smokes.length - 1; i >= 0; i--) {
    const s = smokes[i];

    // sight is blocked as the smoke spreads, until it has nearly cleared
    s.radius = SMOKE_RADIUS
      * smoothstep(0, SMOKE_POUR, clock.time - s.born)
      * Math.min(1, (s.until - clock.time) / (SMOKE_FADE / 2));

    if (clock.time >= s.until) {
      scene.remove(smokes[i].mesh);
      disposeObject(smokes[i].mesh);
      smokes.splice(i, 1);
    }
  }
};
