import { scene } from '../../render/scene';
import { pickups } from './state';
import type { Pickup } from '../../types';
import { disposeObject } from '../../utils/three/disposeObject';

export const removePickup = (k: Pickup) => {
  scene.remove(k.mesh);
  disposeObject(k.mesh);
  pickups.splice(pickups.indexOf(k), 1);
};
