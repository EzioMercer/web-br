import { addBot, bots, respawnBot } from './bots';
import { startZone, zoneTick, zoneMesh } from './br/zone';
import { BOT_COUNT } from './config';
import { byId } from './dom';
import { grenadeCount, flyingGrenades, smokes } from './grenades';
import { player, spawnPlayer } from './player';
import { scene } from './render/renderer';
import { WEAPONS } from './weapons';
import { loadMap } from './world/level';
import { simTime } from './sim';
import { input } from './input';
import { loadout } from './loadout';
import { screenFx } from './effects';
import type { Phase } from './types';

/** Match phase and when it ends (the start countdown, or the pause before the next match). */
export let phase: Phase = 'start';
export let phaseEnd = 0;

/** Starts a new match from the menu: builds the island (fresh doors and glass) and drops everyone in. */
export const startMatch = () => {
  while (bots.length < BOT_COUNT) {
    addBot(bots.length);
  }

  zoneMesh.visible = true;
  loadMap();
  newMatch();
};

/** Advances the match: zone while live, the countdown before it, and the next match after it ends. */
export const matchTick = (dt: number) => {
  if (phase === 'live') {
    zoneTick(dt);
  } else if (phase === 'start') {
    if (simTime >= phaseEnd) {
      phase = 'live';
    }
  } else if (simTime >= phaseEnd) {
    newMatch();
  }
};

export const endMatch = (win: boolean) => {
  phase = 'over';
  phaseEnd = simTime + 4;
  input.fireHeld = false;

  const m = byId('msg');

  m.style.color = win ? 'var(--xh)' : 'var(--hp)';
  m.textContent = win ? 'VICTORY ROYALE!' : 'Eliminated';
};

/** Resets the loadout, the zone and everyone's position, then counts down to the start. */
export const newMatch = () => {
  loadout.owned = { pistol: { ammo: 12, reserve: 12 }, knife: { ammo: 1, reserve: 0 } };
  loadout.weaponId = 'pistol';
  loadout.weapon = WEAPONS.pistol;
  loadout.scoped = false;
  player.armor = 0;
  grenadeCount.he = grenadeCount.fl = grenadeCount.sm = 0;
  loadout.grenade = null;
  flyingGrenades.forEach(n => scene.remove(n.mesh));
  flyingGrenades.length = 0;
  smokes.forEach(q => scene.remove(q.mesh));
  smokes.length = 0;
  screenFx.flashbang = 0;
  spawnPlayer(startZone());

  for (const b of bots) {
    respawnBot(b);
    b.blindUntil = 0;
  }

  phase = 'start';
  phaseEnd = simTime + 5;
};
