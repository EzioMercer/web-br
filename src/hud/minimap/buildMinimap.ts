import { renderMapBg } from './renderMapBg';
import { maps, MINIMAP_SIZE } from './state';
import type { GeneratedWorld } from '../../world/gen/types';

export const buildMinimap = (m: GeneratedWorld) => {
  maps.mini = renderMapBg(m, Math.round(MINIMAP_SIZE * Math.min(devicePixelRatio || 1, 2)), false);
};
