import { addBot, bots, respawnBot } from './bots';
import { brStart, zoneM } from './br/zone';
import { BOTS } from './config';
import { $ } from './dom';
import { nade, nades, smokes } from './grenades';
import { spawn } from './player';
import { scene } from './render/renderer';
import { WPN } from './weapons';
import { loadMap } from './world/level';
import { state } from './state';

/** Starts a new match from the menu: builds the island (fresh doors and glass) and drops everyone in. */
export function startMatch() {
  while (bots.length < BOTS) {
    addBot(bots.length);
  }
  zoneM.visible = true;
  loadMap();
  newMatch();
}

export function endMatch(win: boolean) {
  state.phase = 'over';
  state.phaseEnd = state.T + 4;
  state.mouse = false;
  const m = $('msg');
  m.style.color = win ? 'var(--xh)' : 'var(--hp)';
  m.textContent = win ? 'VICTORY ROYALE!' : 'Eliminated';
}

/** Resets the loadout, the zone and everyone's position, then counts down to the start. */
export function newMatch() {
  state.owned = { pistol: { mag: 12, res: 12 }, knife: { mag: 1, res: 0 } };
  state.cw = 'pistol';
  state.WP = WPN.pistol;
  state.scoped = false;
  state.armor = 0;
  nade.he = nade.fl = nade.sm = 0;
  state.cg = null;
  nades.forEach(n => scene.remove(n.m));
  nades.length = 0;
  smokes.forEach(q => scene.remove(q.m));
  smokes.length = 0;
  state.fbang = 0;
  brStart();
  spawn();
  for (const b of bots) {
    respawnBot(b);
    b.blind = 0;
  }
  state.phase = 'start';
  state.phaseEnd = state.T + 5;
}
