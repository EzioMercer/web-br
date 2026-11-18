import { respawnBot } from '../bots/respawnBot';
import { bots } from '../bots/state';
import { startZone } from '../br/zone/startZone';
import { WEAPONS } from '../data/weapons';
import { screenFx } from '../effects/state';
import { flyingGrenades, grenadeCount, smokes } from '../grenades/state';
import { loadout } from '../loadout/state';
import { spawnPlayer } from '../player/spawnPlayer';
import { player } from '../player/state';
import { clock } from '../sim/state';
import { match } from './state';
import { clearMeshes } from '../render/clearMeshes';

/** Resets the loadout, the zone and everyone's position, then counts down to the start. */
export const newMatch = () => {
  loadout.owned = { pistol: { ammo: 12, reserve: 12 }, knife: { ammo: 1, reserve: 0 } };
  loadout.weaponId = 'pistol';
  loadout.weapon = WEAPONS.pistol;
  loadout.scoped = false;
  player.armor = 0;
  grenadeCount.he = grenadeCount.fl = grenadeCount.sm = 0;
  loadout.grenade = null;
  clearMeshes(flyingGrenades);
  clearMeshes(smokes);
  screenFx.flashbang = 0;
  spawnPlayer(startZone());

  for (const b of bots) {
    respawnBot(b);
    b.blindUntil = 0;
  }

  match.phase = 'start';
  match.phaseEnd = clock.time + 5;
};
