import { buildBotGun } from './buildBotGun';
import { drawLabel } from './drawLabel';
import type { Bot } from './types';
import type { WeaponId } from '../types';

export const setBotWeapon = (b: Bot, w: WeaponId) => {
  b.weaponId = w;
  buildBotGun(b);
  drawLabel(b);
};
