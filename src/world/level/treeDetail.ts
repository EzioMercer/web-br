import { BASE_FOV } from '../../config';
import { camera } from '../../render/camera';
import { hypot } from '../../utils/hypot';
import { treeTiles } from './state';

/**
 * Distance (m) from the camera past which a tile's trees use the far model. Trees that far are a few dozen pixels
 * tall and already fading into the fog. Zooming in (a scope) pushes it out by the zoom.
 */
const FAR_MODEL = 140;

/** Gives each tile of trees the near or far model, by the distance to its closest tree. Run every frame. */
export const treeDetail = () => {
  const far = FAR_MODEL * BASE_FOV / camera.fov;
  const { x, z } = camera.position;

  for (const t of treeTiles) {
    t.mesh.geometry = hypot(t.x - x, t.z - z) - t.radius > far ? t.far : t.near;
  }
};
