import { noiseBurst } from '../audio/noiseBurst';
import { panFor } from '../audio/panFor';
import { soundMark } from '../hud/soundMarks/soundMark';
import { PLAYER_HEIGHT } from '../config';
import { WEAPONS } from '../data/weapons';
import { tracer } from '../effects/tracer';
import { castRay } from '../physics/castRay';
import { damagePlayer } from '../player/damagePlayer';
import { playerBody, playerVel } from '../player/state';
import { settings } from '../settings/state';
import { clock } from '../sim/state';
import { shatter } from '../world/doors/shatter';
import type { Vec3 } from '../types';
import type { Bot } from './types';
import { hypot } from '../utils/hypot';

/** Bot `b` fires one shot at the player, `dist` away. Long guns keep their accuracy far beyond short ones. */
export const botShoot = (b: Bot, dist: number) => {
  const w = WEAPONS[b.weaponId];

  // far shots take longer to line up
  b.nextShotAt = clock.time
    + Math.max(0.1, w.fireInterval * 1.6 * settings.difficulty.fireDelay)
    + Math.random() * 0.15 * settings.difficulty.fireDelay
    + (dist > 60 ? dist * 0.004 : 0);

  const hc = settings.difficulty.accuracy
    * 0.7
    * Math.max(0.04, 1 - dist / (2 * w.range))
    * (hypot(playerVel.x, playerVel.z) > 3 ? 0.6 : 1)
    * (playerBody.height < PLAYER_HEIGHT ? 0.8 : 1)
    * (b.onGround ? 1 : 0.7);
  // nobody is a sure shot at long range
  const hit = Math.random() < Math.min(dist > 60 ? 0.18 * settings.difficulty.accuracy : 0.95, hc);
  const m = hit ? 0 : 1.8;
  const tp: Vec3 = [
    playerBody.x + (Math.random() - 0.5) * m,
    playerBody.y + 1.1 + (Math.random() - 0.5) * m,
    playerBody.z + (Math.random() - 0.5) * m,
  ];
  const o: Vec3 = [b.x, b.y + 1.3, b.z];
  const ex = tp[0] - o[0];
  const ey = tp[1] - o[1];
  const ez = tp[2] - o[2];
  const el = hypot(ex, ey, ez);
  const wt = Math.min(el, castRay(o, [ex / el, ey / el, ez / el], el));

  shatter(o, [ex / el, ey / el, ez / el], el);
  tracer(o, [o[0] + ex / el * wt, o[1] + ey / el * wt, o[2] + ez / el * wt], 0xff7a55);
  noiseBurst(
    (w.sniper ? 0.6 : 0.22) / (1 + dist * (w.sniper ? 0.03 : 0.12)),
    w.sniper ? 0.4 : 0.12,
    w.sniper ? 900 : 1500,
    panFor(b.x, b.z),
  );
  soundMark(b.x, b.z, true, 1, b);

  if (hit) {
    damagePlayer(
      Math.min(60, w.damage * 0.3 * settings.difficulty.damage) * (0.8 + Math.random() * 0.4) * (w.pellets ? 2 : 1),
      b,
    );
  }
};
