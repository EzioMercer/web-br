import { bots } from '../../bots/state';
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

  if (!player.dead && Math.hypot(playerBody.x - z.cx, playerBody.z - z.cz) > z.radius) {
    damagePlayer(dps * dt, null, true);
  }

  for (const b of bots) {
    if (b.health > 0 && Math.hypot(b.x - z.cx, b.z - z.cz) > z.radius) {
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

    const d = Math.hypot(playerBody.x - k.x, playerBody.z - k.z);

    k.label.visible = d < 18;
    k.mesh.visible = d < 170;

    if (player.dead || d > 2.2 || Math.abs(playerBody.y - k.y) > 2) {
      continue;
    }

    let ok = false;

    if (k.kind === PickupKind.Weapon) {
      if (carriedGuns().length < 2 || loadout.owned[k.itemId as WeaponId]) {
        ok = true;
      } else if (d < nd) {
        looting.swapTarget = k;
        nd = d;
      }
    } else if (k.kind === PickupKind.Optic) {
      const tg = opticTarget();

      // onto a gun without one, else into the bag, else E swaps it for the optic on the gun
      if ((tg && !loadout.owned[tg].optic) || loadout.opticBag.includes(null)) {
        ok = true;
      } else if (!tg) {
        hint = 'Optic bag full – Tab, hold Ctrl and drag an optic out to make room';
      } else if (d < nd) {
        looting.swapTarget = k;
        nd = d;
      }
    } else if (k.kind === PickupKind.Armor) {
      ok = player.armor < 100;
    } else if (k.kind === PickupKind.Ammo) {
      ok = true; // ammo goes in the bag whatever guns are carried
    } else if (k.kind === PickupKind.Grenade) {
      ok = grenadeCount[k.itemId as GrenadeId] < 2;
    } else {
      ok = player.health < 100;
    }

    if (ok && k.manual) {
      // something the player dropped stays down until they press E for it
      if (d < td) {
        looting.takeTarget = k;
        td = d;
      }
    } else if (ok) {
      takePickup(k);
      removePickup(k);
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
    looting.prompt = 'Press E to pick up ' + looting.takeTarget.name;
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
