import * as THREE from 'three';
import { stepNoise } from '../../audio/stepNoise';
import { stepThump } from '../../audio/stepThump';
import { scene } from '../../render/scene';
import { settings } from '../../settings/state';
import { glassMat, unitGeo } from '../level/materials';
import { panes, shards } from './state';
import type { Box } from '../../types';

const glassSound = () => {
  stepNoise(0.26 * Math.max(0.3, settings.footstepVolume + 0.4), 0.22, 3200, 0.003);
  stepNoise(0.16, 0.18, 2200, 0.005, 0.04);
  stepThump(900, 500, 0.06, 0.04);
};

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

export const breakGlass = (b: Box) => {
  if (b.disabled) {
    return;
  }

  b.disabled = true;

  const g = panes[b.glassIndex!];

  // a zero matrix folds the pane to a point: nothing left to draw
  if (g.mesh) {
    g.mesh.setMatrixAt(g.index, ZERO);
    g.mesh.instanceMatrix.needsUpdate = true;
  }

  glassSound();

  const cx = (b.min[0] + b.max[0]) / 2;
  const cy = (b.min[1] + b.max[1]) / 2;
  const cz = (b.min[2] + b.max[2]) / 2;

  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(unitGeo, glassMat);

    m.scale.set(0.14, 0.14, 0.02);
    m.position.set(
      cx + (Math.random() - 0.5) * (b.max[0] - b.min[0]),
      cy + (Math.random() - 0.5) * (b.max[1] - b.min[1]),
      cz + (Math.random() - 0.5) * (b.max[2] - b.min[2]),
    );
    scene.add(m);
    shards.push(
      { mesh: m, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, life: 1.1 },
    );
  }
};
