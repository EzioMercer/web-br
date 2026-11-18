import { castRay } from '../physics/castRay';
import { rayBox } from '../physics/rayBox';
import { player } from '../player/state';
import { clock } from '../sim/state';
import { bots } from './state';
import { eyePos } from '../player/eyePos';
import { viewDir } from '../player/viewDir';

export const aimLabels = () => {
  if (player.dead) {
    return;
  }

  const d = viewDir();
  const o = eyePos();
  const wt = castRay(o, d);

  for (const b of bots) {
    if (b.health > 0 && rayBox(o, d, [b.x - 0.35, b.y, b.z - 0.35], [b.x + 0.35, b.y + 1.9, b.z + 0.35]) < wt) {
      b.labelUntil = clock.time + 0.6;
    }

    b.labelSprite.visible = b.health > 0 && clock.time < b.labelUntil;
  }
};
