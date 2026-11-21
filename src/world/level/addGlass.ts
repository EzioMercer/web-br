import * as THREE from 'three';
import { panes } from '../doors/state';
import { boxes } from './state';
import type { Box, MapGlass } from '../../types';

/** Adds a pane's collision box and its slot in `panes`; flushGlass draws it. */
export const addGlass = (g: MapGlass) => {
  const [x, z, w, d, h, y] = g;
  const b: Box = {
    min: [x - w / 2, y, z - d / 2],
    max: [x + w / 2, y + h, z + d / 2],
    glass: true,
    glassIndex: panes.length,
  };

  boxes.push(b);
  panes.push({
    box: b,
    matrix: new THREE.Matrix4().makeScale(w, h, d).setPosition(x, y + h / 2, z),
    mesh: null,
    index: 0,
  });
};
