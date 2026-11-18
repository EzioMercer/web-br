import { buildBotGun } from './buildBotGun';
import { drawLabel } from './drawLabel';
import type { Bot } from './types';

export const setBotWeapon = (b: Bot, w: string) => {
  b.weaponId = w;
  buildBotGun(b);
  drawLabel(b);
};
