import * as THREE from 'three';
import { noiseBurst } from '../audio/noiseBurst';
import { tone } from '../audio/tone';
import { bots } from '../bots/state';
import { killBot } from '../combat/killBot';
import { screenFx, transientFx } from '../effects/state';
import { lineOfSight } from '../physics/lineOfSight';
import { damagePlayer } from '../player/damagePlayer';
import { player, playerBody } from '../player/state';
import { scene } from '../render/scene';
import { clock } from '../sim/state';
import { breakGlass } from '../world/doors/breakGlass';
import { panes } from '../world/doors/state';
import { smokes } from './state';
import type { Vec3 } from '../types';
import type { Grenade } from './types';
import { eyePos } from '../player/eyePos';
import { viewDir } from '../player/viewDir';

export const detonate = (n: Grenade) => {
  const o: Vec3 = [n.x, n.y + 0.2, n.z];

  if (n.type === 'sm') {
    const y = Math.max(n.y, 0.1) + 1.6;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(3.6, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0xb9bec2, transparent: true, opacity: 0.95, side: THREE.DoubleSide }),
    );

    m.position.set(n.x, y, n.z);
    scene.add(m);
    smokes.push({ x: n.x, y, z: n.z, radius: 3.6, until: clock.time + 15, mesh: m });
    noiseBurst(0.2, 0.4, 900);
    return;
  }

  const pd = Math.hypot(playerBody.x - o[0], playerBody.y + 1 - o[1], playerBody.z - o[2]);

  if (n.type === 'fl') {
    noiseBurst(0.6, 0.25, 6000);

    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }),
    );

    m.position.set(...o);
    scene.add(m);
    transientFx.push({ mesh: m, life: 0.3, max: 0.3 });

    if (!player.dead && pd < 30 && lineOfSight(o, eyePos())) {
      const f = viewDir();

      const dot = (f[0] * (o[0] - playerBody.x)
        + f[1] * (o[1] - playerBody.y - player.eyeHeight)
        + f[2] * (o[2] - playerBody.z)) / pd;

      screenFx.flashbang = Math.min(1.3, (1 - pd / 30) * (dot > 0 ? 1.4 : 0.5) + 0.2);
    }

    for (const b of bots) {
      if (b.health > 0 && Math.hypot(b.x - o[0], b.z - o[2]) < 30 && lineOfSight(o, [b.x, 1.4, b.z])) {
        b.blindUntil = clock.time + 4;
      }
    }

    return;
  }

  noiseBurst(1, 0.6, 700);
  tone(60, 25, 0.5, 1, 'sine');

  for (const q of panes) {
    if (!q.box.disabled
      && Math.hypot((q.box.min[0] + q.box.max[0]) / 2 - o[0], (q.box.min[2] + q.box.max[2]) / 2 - o[2]) < 11) {
      breakGlass(q.box);
    }
  }

  const m = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true }),
  );

  m.position.set(...o);
  scene.add(m);
  transientFx.push({ mesh: m, life: 0.45, max: 0.45 });

  for (const b of bots) {
    if (b.health <= 0) {
      continue;
    }

    const bd = Math.hypot(b.x - o[0], 1 - o[1], b.z - o[2]);

    if (bd < 9 && lineOfSight(o, [b.x, b.y + 0.9, b.z])) {
      b.health -= Math.round(160 * (1 - bd / 9));
      b.alert = 1.5;

      if (b.health <= 0) {
        killBot(b, false);
      }
    }
  }

  if (!player.dead && pd < 9 && lineOfSight(o, [playerBody.x, playerBody.y + 1, playerBody.z])) {
    damagePlayer(Math.round(110 * (1 - pd / 9)));
  }
};
