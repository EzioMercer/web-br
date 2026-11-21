import { WEAPONS } from '../data/weapons';
import type { Bot } from './types';
import { boxMesh } from '../utils/three/boxMesh';
import { lambert } from '../utils/three/lambert';
import { WeaponId } from '../types';
import { disposeObject } from '../utils/three/disposeObject';
import { mergeMeshes } from '../utils/three/mergeMeshes';

export const buildBotGun = (b: Bot) => {
  const G = b.gunGroup;

  while (G.children.length) {
    disposeObject(G.children[0]);
    G.remove(G.children[0]);
  }

  const w = b.weaponId;
  const W = WEAPONS[w];

  const add = (sx: number, sy: number, sz: number, z: number, y: number, c: number) => {
    boxMesh(G, sx, sy, sz, 0, y, z, lambert(c));
  };

  if (W.sniper) {
    const L = w === WeaponId.BarrettM82 ? 0.95 : w === WeaponId.Scout ? 0.6 : 0.75;

    add(0.07, 0.1, L, 0, 0, 0x3d4a36);
    add(0.03, 0.03, L * 0.7, L * 0.8, 0.02, 0x1d2024);
    add(0.06, 0.06, 0.3, 0, 0.09, 0x1d2024);
  } else if (W.pellets) {
    add(0.07, 0.09, 0.6, 0.1, 0, 0x2a1c10);
    add(0.04, 0.04, 0.35, 0.5, 0.02, 0x1d2024);
  } else if (W.melee) {
    add(0.025, 0.07, 0.3, 0.2, 0, 0xb9c0c6);
    add(0.03, 0.04, 0.1, 0.02, 0, 0x2a2420);
  } else if (W.slot === 2) {
    add(0.05, 0.08, 0.22, 0.05, 0, 0x3a3f44);
  } else if (W.fireInterval < 0.1) {
    add(0.06, 0.09, 0.4, 0.05, 0, 0x1c1e20);
    add(0.04, 0.12, 0.05, 0, -0.1, 0x1c1e20);
  } else {
    add(0.06, 0.09, 0.5, 0.1, 0, w === WeaponId.Ak47 ? 0x3a3f44 : 0x25282b);
    add(0.07, 0.07, 0.25, 0.4, 0, 0x6b4a2a);
    add(0.04, 0.14, 0.07, 0.05, -0.1, 0x1d2024);
  }

  mergeMeshes(G);
};
