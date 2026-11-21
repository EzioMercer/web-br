import { lineOfSight } from '../physics/lineOfSight';
import { eyePos } from '../player/eyePos';
import { player, playerBody } from '../player/state';
import { settings } from '../settings/state';
import { clock } from '../sim/state';
import { scopeGlint } from './scopeGlint';
import { SPOT_LIMIT } from './constants';
import { spotRange } from './spotRange';
import type { Vec3 } from '../types';
import type { Bot } from './types';

/**
 * Whether bot `b` (eye at `o`, `dist` from the player) sees the player. Far checks are cached for a moment, since
 * they cast long rays.
 */
export const botSees = (b: Bot, o: Vec3, dist: number) => {
  if (player.dead || clock.time < b.blindUntil) {
    return false;
  }

  if (dist > 60 && clock.time < b.nextSightAt) {
    return b.sees;
  }

  b.nextSightAt = clock.time + 0.12 + Math.random() * 0.08;

  const glint = dist > 20 && scopeGlint(b);

  if (dist > (glint ? SPOT_LIMIT : spotRange(b))) {
    return false;
  }

  const da = Math.atan2(playerBody.x - b.x, playerBody.z - b.z) - b.mesh.rotation.y;
  const ang = Math.abs(((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);

  return (glint || b.alert > 0 || dist < 8 || ang < settings.difficulty.viewAngle)
    && lineOfSight(o, eyePos())
    && lineOfSight(o, [playerBody.x, playerBody.y + player.eyeHeight * 0.65, playerBody.z]);
};
