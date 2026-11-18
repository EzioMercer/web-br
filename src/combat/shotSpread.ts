import { loadout } from '../loadout/state';
import { playerBody } from '../player/state';
import { spray } from './state';

/** Shot spread (radians) at movement speed `sp`. */
export const shotSpread = (sp: number) => {
  if (loadout.weapon.sniper) {
    return loadout.scoped && sp < 1 && playerBody.onGround ? (loadout.weapon.boltAction ? 0.0004 : 0.0016) : 0.06;
  }

  const b = 0.0015 + sp * 0.0012 + (playerBody.onGround ? 0 : 0.035) + Math.min(spray.index, 10) * 0.0003;

  return loadout.scoped ? b * 0.6 : b;
};
