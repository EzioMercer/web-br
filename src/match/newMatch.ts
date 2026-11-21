import { respawnBot } from '../bots/respawnBot';
import { bots } from '../bots/state';
import { startZone } from '../br/zone/startZone';
import { bullets } from '../combat/state';
import { WEAPONS } from '../data/weapons';
import { screenFx } from '../effects/state';
import { flyingGrenades, grenadeCount, smokes } from '../grenades/state';
import { loadout } from '../loadout/state';
import { spawnPlayer } from '../player/spawnPlayer';
import { player } from '../player/state';
import { clock } from '../sim/state';
import { match } from './state';
import { clearMeshes } from '../render/clearMeshes';
import { GrenadeId, Phase, WeaponId } from '../types';
import type { OwnedWeapon } from '../types';

/** Resets the loadout, the zone and everyone's position, then counts down to the start. */
export const newMatch = () => {
  loadout.owned = {
    [WeaponId.Usp]: { ammo: 12, reserve: 12 },
    [WeaponId.Knife]: { ammo: 1, reserve: 0 },
  } as Record<WeaponId, OwnedWeapon>;
  loadout.weaponId = WeaponId.Usp;
  loadout.weapon = WEAPONS[WeaponId.Usp];
  loadout.scoped = false;
  player.armor = 0;
  grenadeCount[GrenadeId.HighExplosive] = grenadeCount[GrenadeId.Flashbang] = grenadeCount[GrenadeId.Smoke] = 0;
  loadout.grenade = null;
  clearMeshes(flyingGrenades);
  clearMeshes(smokes);
  clearMeshes(bullets.map(b => ({ mesh: b.streak })));
  bullets.length = 0;
  screenFx.flashbang = 0;
  spawnPlayer(startZone());

  for (const b of bots) {
    respawnBot(b);
    b.blindUntil = 0;
  }

  match.phase = Phase.Start;
  match.phaseEnd = clock.time + 5;
};
