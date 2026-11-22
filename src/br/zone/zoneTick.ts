import { bots } from '../../bots/state';
import { MAX_GRENADES } from '../../config';
import { layBodyDown } from '../../combat/layBodyDown';
import { OPTICS } from '../../data/optics';
import { WEAPONS } from '../../data/weapons';
import { grenadeCount } from '../../grenades/state';
import { carriedGuns } from '../../loadout/carriedGuns';
import { opticTarget } from '../../loadout/opticTarget';
import { loadout } from '../../loadout/state';
import { endMatch } from '../../match/endMatch';
import { damagePlayer } from '../../player/damagePlayer';
import { player, playerBody } from '../../player/state';
import { clock } from '../../sim/state';
import { doorFocus } from '../../world/doors/state';
import { looting, pickups } from '../pickups/state';
import { takePickup } from '../pickups/takePickup';
import { applyZonePhase } from './applyZonePhase';
import { schedule, zone } from './state';
import { zoneMesh } from './zoneMesh';
import type { Circle, GrenadeId } from '../../types';
import { removePickup } from '../pickups/removePickup';
import { PickupKind, WeaponId } from '../../types';
import { hypot } from '../../utils/hypot';

export const zoneTick = (dt: number) => {
  if (!schedule.startTime) {
    schedule.startTime = clock.time;
  }

  const t = clock.time - schedule.startTime;
  let acc = 0;
  let z: Circle | null = null;
  let st = 0;

  for (let i = 0; i < schedule.stages.length; i++) {
    const q = schedule.stages[i];

    st = i;

    if (t < acc + q.hold) {
      z = q.from;
      break;
    }

    if (t < acc + q.hold + q.shrink) {
      const u = (t - acc - q.hold) / q.shrink;

      z = {
        cx: q.from.cx + (q.to.cx - q.from.cx) * u,
        cz: q.from.cz + (q.to.cz - q.from.cz) * u,
        radius: q.from.radius + (q.to.radius - q.from.radius) * u,
      };
      break;
    }

    acc += q.hold + q.shrink;
  }

  if (!z) {
    z = schedule.stages[schedule.stages.length - 1].to;
  }

  zone.cx = z.cx;
  zone.cz = z.cz;
  zone.radius = z.radius;
  applyZonePhase(t);
  zoneMesh.position.set(z.cx, 150, z.cz);
  zoneMesh.scale.set(z.radius, 1, z.radius);

  const dps = 1.5 + st * 1.5;

  if (!player.dead && hypot(playerBody.x - z.cx, playerBody.z - z.cz) > z.radius) {
    damagePlayer(dps * dt, null, true);
  }

  for (const b of bots) {
    if (b.health > 0 && hypot(b.x - z.cx, b.z - z.cz) > z.radius) {
      b.health -= dps * dt * 0.5;

      if (b.health <= 0 && !b.corpse) {
        layBodyDown(b);
      }
    }
  }

  looting.prompt = '';
  looting.swapTarget = null;
  looting.takeTarget = null;

  let nd = 2.2;
  let td = 2.2;
  let hint = '';

  for (let i = pickups.length - 1; i >= 0; i--) {
    const k = pickups[i];

    k.mesh.rotation.y += dt * 2;

    const d = hypot(playerBody.x - k.x, playerBody.z - k.z);

    k.label.visible = d < 18;
    k.mesh.visible = d < 170;

    if (player.dead || d > 2.2 || Math.abs(playerBody.y - k.y) > 2) {
      continue;
    }

    // Walking over an item picks it up only when it fills an empty place (a free gun slot, a gun without an optic) or
    // is ammo, a medkit or a vest; anything else waits for E.
    let auto = false;
    let take = false;
    let swap = false;

    if (k.kind === PickupKind.Weapon) {
      if (loadout.owned[k.itemId as WeaponId]) {
        take = true; // a second copy: E takes its rounds (and its optic if ours has none)
      } else if (carriedGuns().length < 2) {
        auto = true;
      } else {
        swap = true;
      }
    } else if (k.kind === PickupKind.Optic) {
      const tg = opticTarget();

      // onto a gun without one by itself; with E into the bag, else E swaps it for the optic on the gun
      if (tg && !loadout.owned[tg].optic) {
        auto = true;
      } else if (loadout.bag.includes(null)) {
        take = true;
      } else if (tg) {
        swap = true;
      } else {
        hint = 'Bag full – Tab and drag something out to make room';
      }
    } else if (k.kind === PickupKind.Armor || k.kind === PickupKind.Health) {
      // into a free bag slot
      auto = loadout.bag.includes(null);
      hint = auto ? hint : 'Bag full – Tab and drag something out to make room';
    } else if (k.kind === PickupKind.Ammo) {
      auto = true; // ammo goes in the bag whatever guns are carried
    } else if (grenadeCount[k.itemId as GrenadeId] < MAX_GRENADES) {
      take = true;
    } else {
      hint = 'Carrying the most ' + k.name + 's (' + MAX_GRENADES + ')';
    }

    if (auto && !k.manual) {
      takePickup(k);
      removePickup(k);
    } else if ((auto || take) && d < td) {
      // something the player dropped stays down until they press E for it
      looting.takeTarget = k;
      td = d;
    } else if (swap && d < nd) {
      looting.swapTarget = k;
      nd = d;
    }
  }

  // E acts on the nearest item
  if (looting.swapTarget && looting.takeTarget) {
    if (nd < td) {
      looting.takeTarget = null;
    } else {
      looting.swapTarget = null;
    }
  }

  if (looting.swapTarget) {
    looting.prompt = looting.swapTarget.kind === PickupKind.Optic
      ? 'Press E to swap ' + OPTICS[loadout.owned[opticTarget()!].optic!].name + ' for ' + looting.swapTarget.name
      : 'Press E to swap '
        + WEAPONS[loadout.weaponId !== WeaponId.Knife ? loadout.weaponId : carriedGuns()[1]].name
        + ' for '
        + looting.swapTarget.name;
  } else if (looting.takeTarget) {
    const k = looting.takeTarget;

    looting.prompt = k.kind === PickupKind.Weapon && loadout.owned[k.itemId as WeaponId]
      ? 'Press E to take the rounds from ' + k.name
      : 'Press E to pick up ' + k.name;
  } else if (hint) {
    looting.prompt = hint;
  } else if (doorFocus.door && !loadout.grenade) {
    looting.prompt = 'Press E to ' + (doorFocus.door.target ? 'close' : 'open') + ' the door';
  }

  if (player.dead) {
    endMatch(false);
  } else if (bots.every(b => b.health <= 0)) {
    endMatch(true);
  }
};
