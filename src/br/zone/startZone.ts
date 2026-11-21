import { LOOT_TIER1, LOOT_TIER2 } from '../../data/loot';
import { getIsland } from '../../world/level/getIsland';
import { level } from '../../world/level/state';
import { ISLAND_HALF } from '../../world/terrain/constants';
import { clearPickups } from '../pickups/clearPickups';
import { spawnPickup } from '../pickups/spawnPickup';
import { applyZonePhase } from './applyZonePhase';
import { ZONE_STAGES } from './constants';
import { landingSpot } from './landingSpot';
import { schedule, zone } from './state';
import { zoneMesh } from './zoneMesh';
import { AmmoType, GrenadeId, OpticId, PickupKind } from '../../types';
import type { Circle, Vec2 } from '../../types';

/** Plans the zone schedule and scatters the loot. Returns the player's landing spot. */
export const startZone = (): Vec2 => {
  clearPickups();

  const spawnAt = landingSpot(0, false);
  const R0 = ISLAND_HALF * 1.5;

  schedule.stages = [];

  let pv: Circle = { cx: 0, cz: 0, radius: R0 };

  for (const [hold, shrink, f] of ZONE_STAGES) {
    const r = R0 * f;
    let to: Circle = pv;

    for (let k = 0; k < 60; k++) {
      const a = Math.random() * 6.283;
      const dd = Math.random() * (pv.radius - r) * 0.85;
      const cx = pv.cx + Math.cos(a) * dd;
      const cz = pv.cz + Math.sin(a) * dd;

      if (k === 59 || level.terrain!.height(cx, cz) > 1.5) {
        to = { cx, cz, radius: r };
        break;
      }
    }

    schedule.stages.push({ hold, shrink, from: pv, to });
    pv = to;
  }

  zone.cx = 0;
  zone.cz = 0;
  zone.radius = R0;
  schedule.startTime = 0;
  applyZonePhase(0);
  // the wall of the last match's final circle must not linger through the countdown
  zoneMesh.position.set(0, 150, 0);
  zoneMesh.scale.set(R0, 1, R0);

  // sniper rounds are the scarcest ammo
  const AT = [
    AmmoType.Pistol,
    AmmoType.Pistol,
    AmmoType.Smg,
    AmmoType.Smg,
    AmmoType.Rifle,
    AmmoType.Rifle,
    AmmoType.Shotgun,
    AmmoType.Sniper,
  ];
  const GI: GrenadeId[] = [GrenadeId.HighExplosive, GrenadeId.Flashbang, GrenadeId.Smoke];
  const OI: OpticId[] = [
    OpticId.RedDot,
    OpticId.RedDot,
    OpticId.RedDot,
    OpticId.Holographic,
    OpticId.Holographic,
    OpticId.Scope2x,
    OpticId.Scope2x,
    OpticId.Scope4x,
  ];

  for (const [x, z, y, tier] of getIsland().loot) {
    if (Math.random() > 0.74) {
      continue;
    }

    const r = Math.random();
    const t2 = tier >= 2;
    const t: PickupKind = r < (t2 ? 0.40 : 0.26)
      ? PickupKind.Weapon
      : r < (t2 ? 0.58 : 0.50)
        ? PickupKind.Ammo
        : r < (t2 ? 0.68 : 0.58)
          ? PickupKind.Armor
          : r < (t2 ? 0.76 : 0.70)
            ? PickupKind.Health
            : r < (t2 ? 0.90 : 0.82)
              ? PickupKind.Optic
              : PickupKind.Grenade;

    spawnPickup(
      x,
      z,
      t,
      t === PickupKind.Weapon
        ? (t2 ? LOOT_TIER2 : LOOT_TIER1)[Math.random() * (t2 ? LOOT_TIER2 : LOOT_TIER1).length | 0]
        : t === PickupKind.Ammo
          ? AT[Math.random() * AT.length | 0]
          : t === PickupKind.Grenade
            ? GI[Math.random() * 3 | 0]
            : t === PickupKind.Optic
              ? OI[Math.random() * 8 | 0]
              : null,
      undefined,
      y,
    );
  }

  return spawnAt;
};
