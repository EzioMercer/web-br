import { loadout } from '../loadout/state';
import { playerBody } from '../player/state';
import { settings } from '../settings/state';
import { clock } from '../sim/state';
import { alarmBot } from './alarmBot';
import { Alarm } from './types';
import { bots } from './state';
import { hypot } from '../utils/hypot';

/** Bots in earshot of the player's shot (louder guns carry farther) may come looking. */
export const hearShot = () => {
  const w = loadout.weapon;
  const loud = (w.sniper ? 200 : w.range >= 45 ? 130 : w.pellets ? 90 : 75) * (0.7 + 0.15 * settings.difficulty.memory);

  for (const b of bots) {
    if (b.health <= 0 || b.running || b.alert > 0 || clock.time - b.heardAt < 3) {
      continue;
    }

    const d = hypot(b.x - playerBody.x, b.z - playerBody.z);

    if (d < loud && Math.random() < 1 - 0.6 * d / loud) {
      alarmBot(b, Alarm.Heard);
    }
  }
};
