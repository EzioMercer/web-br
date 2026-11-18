import { scene } from '../render/scene';
import { clock } from '../sim/state';
import { detonate } from './detonate';
import { flyingGrenades, smokes } from './state';
import { stepGrenade } from './stepGrenade';

export const grenadesTick = (dt: number) => {
  for (let i = flyingGrenades.length - 1; i >= 0; i--) {
    const n = flyingGrenades[i];

    stepGrenade(n, dt);
    n.mesh.position.set(n.x, n.y, n.z);

    if (clock.time >= n.fuseAt) {
      scene.remove(n.mesh);
      flyingGrenades.splice(i, 1);
      detonate(n);
    }
  }

  for (let i = smokes.length - 1; i >= 0; i--) {
    if (clock.time >= smokes[i].until) {
      scene.remove(smokes[i].mesh);
      smokes.splice(i, 1);
    }
  }
};
