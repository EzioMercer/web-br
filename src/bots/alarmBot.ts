import { playerBody } from '../player/state';
import { clock } from '../sim/state';
import { Alarm, BotMode } from './types';
import type { Bot } from './types';

/** Bot `b` learns roughly where the player is and turns that way; being shot at sends it looking for cover. */
export const alarmBot = (b: Bot, how: Alarm) => {
  const dist = Math.hypot(playerBody.x - b.x, playerBody.z - b.z);
  const err = how === Alarm.Heard ? dist * 0.12 : how === Alarm.NearMiss ? 1 : 0;

  b.knownX = playerBody.x + (Math.random() - 0.5) * 2 * err;
  b.knownY = playerBody.y;
  b.knownZ = playerBody.z + (Math.random() - 0.5) * 2 * err;
  b.mesh.rotation.y = Math.atan2(b.knownX - b.x, b.knownZ - b.z);

  if (how === Alarm.Heard) {
    b.heardAt = clock.time;

    if (b.mode === BotMode.Roam || b.mode === BotMode.Overwatch) {
      b.mode = BotMode.Hunt;
      b.modeUntil = clock.time + 25;
    }

    return;
  }

  if (b.alert <= 0 || how === Alarm.Hit) {
    // aiming takes longer the farther away the shooter is
    b.reactAt = clock.time + (how === Alarm.Hit ? 0.15 : 0.3) + dist * 0.004;
  }

  b.alert = Math.max(b.alert, how === Alarm.Hit ? 1.5 : 1);
  b.underFireAt = clock.time;
};
