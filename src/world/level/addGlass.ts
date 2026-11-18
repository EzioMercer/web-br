import * as THREE from 'three';
import { panes } from '../doors/state';
import { mapGroup } from './mapGroup';
import { glassMat, unitGeo } from './materials';
import { boxes } from './state';
import type { Box, MapGlass } from '../../types';

export const addGlass = (g: MapGlass) => {
  const [x, z, w, d, h, y] = g;
  const b: Box = {
    min: [x - w / 2, y, z - d / 2],
    max: [x + w / 2, y + h, z + d / 2],
    glass: true,
    glassIndex: panes.length,
  };

  boxes.push(b);

  const m = new THREE.Mesh(unitGeo, glassMat);

  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  mapGroup.add(m);
  panes.push({ box: b, mesh: m });
};
