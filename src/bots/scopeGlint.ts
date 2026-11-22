import { currentOptic } from '../loadout/currentOptic';
import { loadout } from '../loadout/state';
import { eyePos } from '../player/eyePos';
import { viewDir } from '../player/viewDir';
import type { Bot } from './types';
import { hypot } from '../utils/hypot';

/** cos(8 degrees): a bot this close to the middle of the player's scope sees the lens glint. */
const GLINT_COS = Math.cos(8 * Math.PI / 180);

/** The player looks at bot `b` through a magnifying scope, so the bot can see the lens glint. */
export const scopeGlint = (b: Bot) => {
  if (!loadout.scoped || !(loadout.weapon.sniper || (currentOptic()?.fov ?? 99) <= 38)) {
    return false;
  }

  const o = eyePos();
  const d = viewDir();
  const dx = b.x - o[0];
  const dy = b.y + 1.4 - o[1];
  const dz = b.z - o[2];
  const l = hypot(dx, dy, dz) || 1;

  return (dx * d[0] + dy * d[1] + dz * d[2]) / l > GLINT_COS;
};
