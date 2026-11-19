import * as THREE from 'three';
import { doors } from '../doors/state';
import { mapGroup } from './mapGroup';
import { doorMats, unitGeo } from './materials';
import { boxes } from './state';
import { Axis } from '../../types';
import type { Box, MapDoor } from '../../types';

export const addDoor = (o: MapDoor) => {
  const { axis: ax, wallAt: c, center: m, width: w, y, height: h } = o;
  const x = ax === Axis.X ? m : c;
  const z = ax === Axis.X ? c : m;
  const b: Box = {
    min: ax === Axis.X ? [m - w / 2, y, c - 0.07] : [c - 0.07, y, m - w / 2],
    max: ax === Axis.X ? [m + w / 2, y + h, c + 0.07] : [c + 0.07, y + h, m + w / 2],
    door: true,
  };

  boxes.push(b);

  const grp = new THREE.Group();

  grp.position.set(ax === Axis.X ? m - w / 2 : c, y, ax === Axis.X ? c : m - w / 2);

  const th0 = ax === Axis.X ? 0 : -Math.PI / 2;

  grp.rotation.y = th0;

  const mat = doorMats[o.color] || (doorMats[o.color] = new THREE.MeshLambertMaterial({ color: o.color }));
  const mesh = new THREE.Mesh(unitGeo, mat);

  mesh.scale.set(w, h, 0.12);
  mesh.position.set(w / 2, h / 2, 0);
  grp.add(mesh);

  const kn = new THREE.Mesh(unitGeo, doorMats.k || (doorMats.k = new THREE.MeshLambertMaterial({ color: 0xc9a227 })));

  kn.scale.set(0.1, 0.1, 0.2);
  kn.position.set(w - 0.2, h * 0.45, 0);
  grp.add(kn);
  mapGroup.add(grp);
  doors.push(
    {
      box: b,
      pivot: grp,
      baseAngle: th0,
      axis: ax,
      swingDir: 1,
      openAmount: 0,
      target: 0,
      x,
      z,
      y,
      reachSq: (w / 2 + 1.5) * (w / 2 + 1.5),
    },
  );
};
