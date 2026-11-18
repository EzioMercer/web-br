import { stepNoise } from '../audio/stepNoise';
import { stepThump } from '../audio/stepThump';
import { bots } from '../bots/state';
import { screenFx } from '../effects/state';
import { loadout } from '../loadout/state';
import { castRay } from '../physics/castRay';
import { rayBox } from '../physics/rayBox';
import { collision } from '../physics/state';
import { clock } from '../sim/state';
import { breakGlass } from '../world/doors/breakGlass';
import { killBot } from './killBot';
import type { Bot } from '../bots/types';
import { eyePos } from '../player/eyePos';
import { viewDir } from '../player/viewDir';

export const knifeAttack = () => {
  loadout.nextShotAt = clock.time + loadout.weapon.fireInterval;
  loadout.slashEnd = clock.time + 0.3;
  stepNoise(0.22, 0.18, 1500, 0.03);

  const d = viewDir();
  const o = eyePos();
  let best = castRay(o, d, 2.6);
  let tgt: Bot | null = null;

  if (collision.lastHit && collision.lastHit.glass && best < 2.6) {
    breakGlass(collision.lastHit);
    best = 2.6;
  }

  for (const b of bots) {
    if (b.health <= 0) {
      continue;
    }

    const t = rayBox(o, d, [b.x - 0.45, b.y, b.z - 0.45], [b.x + 0.45, b.y + 1.9, b.z + 0.45]);

    if (t < Math.min(best, 2.4)) {
      best = t;
      tgt = b;
    }
  }

  if (tgt) {
    tgt.health -= loadout.weapon.damage;
    tgt.alert = 1.5;
    tgt.reactAt = clock.time + 0.15;
    screenFx.hitMarker = 1;
    stepNoise(0.4, 0.08, 900, 0.004);
    stepThump(140, 70, 0.1, 0.25);

    if (tgt.health <= 0) {
      killBot(tgt, false);
    }
  }
};
