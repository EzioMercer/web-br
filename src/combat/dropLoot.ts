import { spawnPickup } from '../br/pickups/spawnPickup';
import { OPTIC_IDS } from '../data/optics';
import { WEAPONS } from '../data/weapons';
import { takesOptic } from '../loadout/takesOptic';
import { groundAt } from '../physics/groundAt';
import { isFreeSpot } from '../physics/isFreeSpot';
import { GrenadeId, PickupKind } from '../types';
import type { Bot } from '../bots/types';
import type { OwnedWeapon } from '../types';

/** Battle Royale: scatters a dead bot's gear around it. */
export const dropLoot = (b: Bot) => {
  const w = b.weaponId;
  const W = WEAPONS[w];
  const items: [PickupKind, string?, OwnedWeapon?][] = [];

  if (!W.melee) {
    items.push(
      [
        PickupKind.Weapon,
        w,
        {
          ammo: Math.max(4, Math.round(W.magSize * (0.35 + Math.random() * 0.65))),
          reserve: W.magSize * (1 + Math.floor(Math.random() * 2)),
          optic: takesOptic(w) && Math.random() < 0.3 ? OPTIC_IDS[Math.random() * 3 | 0] : undefined,
        },
      ],
    );
  }

  if (!W.melee && Math.random() < 0.75) {
    items.push([PickupKind.Ammo, W.ammoType!]);
  }

  if (Math.random() < 0.4) {
    items.push([PickupKind.Armor]);
  }

  if (Math.random() < 0.4) {
    items.push([PickupKind.Health]);
  }

  if (Math.random() < 0.4) {
    items.push(
      [PickupKind.Grenade, [GrenadeId.HighExplosive, GrenadeId.Flashbang, GrenadeId.Smoke][Math.random() * 3 | 0]],
    );
  }

  if (Math.random() < 0.22) {
    items.push([PickupKind.Optic, OPTIC_IDS[Math.random() * 4 | 0]]);
  }

  const n = items.length;
  const a0 = Math.random() * 6.283;

  items.forEach((it, i) => {
    const a = a0 + i / n * 6.283;
    const r = 1.0 + Math.random() * 0.4;
    let x = b.x + Math.cos(a) * r;
    let z = b.z + Math.sin(a) * r;

    if (!isFreeSpot(x, z)) {
      x = b.x;
      z = b.z;
    }

    spawnPickup(x, z, it[0], it[1] ?? null, it[2], groundAt(x, z, b.y + 0.6));
  });
};
