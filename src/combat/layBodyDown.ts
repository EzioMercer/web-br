import { groundAt } from '../physics/groundAt';
import { clock } from '../sim/state';
import { dropLoot } from './dropLoot';
import type { Bot } from '../bots/types';

// the body stays where it fell (lying down) with its gear dropped around it
export const layBodyDown = (b: Bot) => {
  b.corpse = true;
  b.corpseUntil = clock.time + 150;
  b.mesh.rotation.order = 'YXZ';
  b.mesh.rotation.x = -Math.PI / 2;
  b.fallY = b.y;
  b.fallVel = 0;
  b.y = groundAt(b.x, b.z, b.y + 0.6);

  if (b.fallY < b.y) {
    b.fallY = b.y;
  }

  b.mesh.position.set(b.x, b.fallY + 0.2, b.z);
  b.labelSprite.visible = false;
  dropLoot(b);
};
