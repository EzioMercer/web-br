import { bullets } from './state';
import { stepBullet } from './stepBullet';

/** Moves the player's bullets in flight. */
export const bulletsTick = (dt: number) => {
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (stepBullet(bullets[i], dt)) {
      bullets.splice(i, 1);
    }
  }
};
