import { respawnBot } from '../bots/respawnBot';
import { bots } from '../bots/state';
import { startZone } from '../br/zone/startZone';
import { bullets } from '../combat/state';
import { BAG_SLOTS } from '../config';
import { WEAPONS } from '../data/weapons';
import { flyingGrenades, grenadeCount, smokes } from '../grenades/state';
import { emptyAmmoBag } from '../loadout/emptyAmmoBag';
import { loadout } from '../loadout/state';
import { spawnPlayer } from '../player/spawnPlayer';
import { player } from '../player/state';
import { clock } from '../sim/state';
import { resetHud } from '../hud/resetHud';
import { resetMap } from '../world/level/resetMap';
import { match } from './state';
import { clearMeshes } from '../render/clearMeshes';
import { AmmoType, GrenadeId, Phase, WeaponId } from '../types';
import type { BagItem, OwnedWeapon } from '../types';

/**
 * Starts a round, from the menu or after the last one ended: resets the loadout, the HUD, the map (doors, glass,
 * marks), the zone and loot, and everyone's position, then counts down to the start. Anything a round changes must be
 * put back here (the HUD in `resetHud`, the map in `resetMap`), so no round inherits the last one's state.
 */
export const newMatch = () => {
  loadout.owned = {
    [WeaponId.Usp]: { ammo: 12 },
    [WeaponId.Knife]: { ammo: 1 },
  } as Record<WeaponId, OwnedWeapon>;
  loadout.ammoBag = emptyAmmoBag();
  loadout.ammoBag[AmmoType.Pistol] = 12;
  loadout.bag = new Array<BagItem | null>(BAG_SLOTS).fill(null);
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
  resetHud();
  resetMap();
  spawnPlayer(startZone());

  for (const b of bots) {
    respawnBot(b);
    b.blindUntil = 0;
  }

  match.phase = Phase.Start;
  match.phaseEnd = clock.time + 5;
};
