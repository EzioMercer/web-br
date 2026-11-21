import { removePickup } from '../br/pickups/removePickup';
import { pickups } from '../br/pickups/state';
import { zone } from '../br/zone/state';
import { WEAPONS } from '../data/weapons';
import { liveTime } from '../match/liveTime';
import { playerBody } from '../player/state';
import { clock } from '../sim/state';
import { BOT_FOUND_WEAPONS, LOOT_REACH, SNIPER_DELAY } from './constants';
import { gunValue } from './gunValue';
import { setBotWeapon } from './setBotWeapon';
import { steer } from './steer';
import { PickupKind } from '../types';
import type { WeaponId } from '../types';
import type { Bot } from './types';

/** Gun `id` is better than what bot `b` holds, and not a sniper rifle while the match is young. */
const wants = (b: Bot, id: WeaponId) => gunValue(id) > gunValue(b.weaponId)
  && (!WEAPONS[id].sniper || liveTime() > SNIPER_DELAY);

/**
 * A roaming bot goes for a better gun lying nearby and picks it up. Out of the player's sight it also turns up with a
 * better gun now and then, as if it had looted a building. Returns true while it walks to a gun (moving at `speed`).
 */
export const botLoot = (b: Bot, speed: number) => {
  const k = b.lootTarget;

  if (k) {
    if (!pickups.includes(k) || clock.time > b.lootUntil) {
      b.lootTarget = null;
    } else if (Math.hypot(k.x - b.x, k.z - b.z) < 1.3 && Math.abs(k.y - b.y) < 1.5) {
      if (wants(b, k.itemId as WeaponId)) {
        setBotWeapon(b, k.itemId as WeaponId);
        removePickup(k);
      }

      b.lootTarget = null;
    } else if (steer(b, k.x, k.z, speed) < 0) {
      b.lootTarget = null;
      b.nextLootAt = clock.time + 6;
    } else {
      return true;
    }
  }

  if (clock.time > b.upgradeAt) {
    b.upgradeAt = clock.time + 60 + Math.random() * 90;

    const far = Math.hypot(playerBody.x - b.x, playerBody.z - b.z) > 60;
    const pool = BOT_FOUND_WEAPONS.filter(id => wants(b, id));

    if (far && pool.length) {
      setBotWeapon(b, pool[Math.random() * pool.length | 0]);
    }
  }

  if (clock.time < b.nextLootAt) {
    return false;
  }

  b.nextLootAt = clock.time + 0.8 + Math.random() * 0.6;

  let best = null;
  let bd = LOOT_REACH;

  for (const q of pickups) {
    if (q.kind !== PickupKind.Weapon || Math.abs(q.y - b.y) > 3) {
      continue;
    }

    const d = Math.hypot(q.x - b.x, q.z - b.z);

    if (d < bd && Math.hypot(q.x - zone.cx, q.z - zone.cz) < zone.radius - 5 && wants(b, q.itemId as WeaponId)) {
      bd = d;
      best = q;
    }
  }

  if (!best) {
    return false;
  }

  b.lootTarget = best;
  b.lootUntil = clock.time + bd / 2 + 8;
  return steer(b, best.x, best.z, speed) >= 0;
};
