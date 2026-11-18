import { WEAPONS } from '../data/weapons';
import type { Bot } from './types';
import { drawOutlinedText } from '../utils/drawOutlinedText';

export const drawLabel = (b: Bot) => {
  const x = b.labelCanvas.getContext('2d')!;

  x.clearRect(0, 0, 256, 64);
  drawOutlinedText(x, b.name + ' · ' + WEAPONS[b.weaponId].name, '#ffcf5a');
  b.labelTexture.needsUpdate = true;
};
