import { boxes, leaves, pendingBoxes } from './state';
import type { MapBox } from '../../types';

export const queueBox = (x: number, z: number, w: number, d: number, h: number, col: number, y = 0, nc?: MapBox[7]) => {
  if (!nc) {
    boxes.push({ min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2] });
  } else if (nc === 'leaves') {
    leaves.push({ min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2] });
  }

  pendingBoxes.push([x, y + h / 2, z, w, h, d, col]);
};
