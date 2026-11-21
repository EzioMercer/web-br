import * as THREE from 'three';
import { doors } from '../doors/state';
import { boxes } from './state';
import { Axis } from '../../types';
import { doorAngle } from '../doors/doorAngle';
import type { Box, Door, MapDoor } from '../../types';

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

  const hinge = o.hinge ?? -1;

  grp.position.set(ax === Axis.X ? m + hinge * w / 2 : c, y, ax === Axis.X ? c : m + hinge * w / 2);

  // the panel and its knob, placed relative to the hinge; not in the scene: flushDoors draws them as instances
  const mesh = new THREE.Object3D();

  mesh.scale.set(w, h, 0.12);
  mesh.position.set(w / 2, h / 2, 0);
  grp.add(mesh);

  const kn = new THREE.Object3D();

  kn.scale.set(0.1, 0.1, 0.2);
  kn.position.set(w - 0.2, h * 0.45, 0);
  grp.add(kn);

  const d: Door = {
    box: b,
    pivot: grp,
    axis: ax,
    hinge,
    side: 1,
    maxOpen: o.open ?? [1, 1],
    openAmount: 0,
    target: 0,
    x,
    z,
    y,
    reachSq: (w / 2 + 1.5) * (w / 2 + 1.5),
    color: o.color,
    width: w,
    drawn: null,
  };

  grp.rotation.y = doorAngle(d);
  doors.push(d);
};
