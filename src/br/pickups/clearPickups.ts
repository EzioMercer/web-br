import { pickups } from './state';
import { clearMeshes } from '../../render/clearMeshes';

export const clearPickups = () => {
  clearMeshes(pickups);
};
