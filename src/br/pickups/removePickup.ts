import { scene } from '../../render/scene';
import { pickups } from './state';
import type { Pickup } from '../../types';

export const removePickup = (k: Pickup) => {
  scene.remove(k.mesh);
  pickups.splice(pickups.indexOf(k), 1);
};
