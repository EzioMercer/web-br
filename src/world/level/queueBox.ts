import { boxes, pendingBoxes } from './state';

/** Adds a map box's collision box (unless `nc`) and queues it to be drawn (unless `hidden`; see flushBoxes). */
export const queueBox = (
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  col: number,
  y = 0,
  nc?: boolean,
  hidden?: boolean,
) => {
  if (!nc) {
    boxes.push({ min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2] });
  }

  if (!hidden) {
    pendingBoxes.push([x, y + h / 2, z, w, h, d, col]);
  }
};
