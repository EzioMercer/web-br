import { looting, spawnPickup, pickups } from './br/pickups';
import { feedMessage } from './hud/hud';
import { scene } from './render/renderer';
import { OPTICS, WEAPONS } from './weapons';
import type { GrenadeId, OpticId, OwnedWeapon, Pickup, Weapon } from './types';

/** The weapons the player carries and the state of the one in hand. */
export const loadout = {
  weaponId: 'pistol',
  weapon: WEAPONS.pistol as Weapon,
  owned: { pistol: { ammo: 12, reserve: 36 }, knife: { ammo: 1, reserve: 0 } } as Record<string, OwnedWeapon>,
  /** Rounds in the magazine and in reserve for the weapon in hand. */
  ammo: 12,
  reserve: 36,
  scoped: false,
  reloading: false,
  reloadEnd: 0,
  nextShotAt: 0,
  lastShotAt: -9,
  /** Selected grenade, if any. */
  grenade: null as GrenadeId | null,
  /** End of the bolt-cycle animation. */
  boltCycleEnd: 0,
  /** End of the knife-slash animation. */
  slashEnd: 0,
};

/** Weapons carried, except the knife. */
export const carriedGuns = () => Object.keys(loadout.owned).filter(k => k !== 'knife');

/** Optics fit SMGs, rifles and shotguns. */
export const takesOptic = (id: string) => {
  const a = WEAPONS[id].ammoType;

  return a === 'smg' || a === 'rif' || a === 'shl';
};

export const currentOptic = () => {
  const o = loadout.owned[loadout.weaponId];

  return o && o.optic && takesOptic(loadout.weaponId) ? OPTICS[o.optic] : null;
};

export const canAim = () => !!(loadout.weapon.sniper || !loadout.weapon.melee);

export const aimFov = (): number => loadout.weapon.sniper
  ? loadout.weapon.scopeFov!
  : currentOptic()?.fov ?? (loadout.weapon.slot === 2 ? 66 : 62);

/** The gun a new optic would go on: the current one if free, else another free one, else the current or first one. */
export const opticTarget = () => {
  const ks = carriedGuns().filter(takesOptic);

  if (!ks.length) {
    return null;
  }

  const cur = ks.includes(loadout.weaponId) ? loadout.weaponId : null;
  const free = ks.filter(k => !loadout.owned[k].optic);

  return cur && !loadout.owned[cur].optic ? cur : free[0] || cur || ks[0];
};

export const swapOptic = (k: Pickup) => {
  const tg = opticTarget();

  if (!tg) {
    return;
  }

  const old = loadout.owned[tg].optic;

  loadout.owned[tg].optic = k.itemId as OpticId;

  if (old) {
    spawnPickup(k.x, k.z, 'optic', old, undefined, k.y);
  }

  scene.remove(k.mesh);
  pickups.splice(pickups.indexOf(k), 1);
  looting.swapTarget = null;
  feedMessage('Attached ' + OPTICS[k.itemId as OpticId].name + ' to ' + WEAPONS[tg].name);
};

/**
 * Gives weapon `id` (with ammo and optic `st` if dropped by someone) and switches to it, dropping `drop` if both
 * slots are full.
 */
export const giveWeapon = (id: string, st?: OwnedWeapon, drop?: string) => {
  const w = WEAPONS[id];

  loadout.owned[loadout.weaponId] = Object.assign(
    loadout.owned[loadout.weaponId] || {},
    { ammo: loadout.ammo, reserve: loadout.reserve } satisfies Partial<OwnedWeapon>,
  );

  if (loadout.owned[id]) {
    loadout.owned[id].reserve += w.magSize;

    if (st && st.optic && !loadout.owned[id].optic) {
      loadout.owned[id].optic = st.optic;
    }
  } else {
    if (carriedGuns().length >= 2) {
      delete loadout.owned[drop || (loadout.weaponId !== 'knife' ? loadout.weaponId : carriedGuns()[1])];
    }

    loadout.owned[id] = st
      ? { ammo: st.ammo, reserve: st.reserve, optic: st.optic }
      : { ammo: w.magSize, reserve: w.magSize };
  }

  loadout.weaponId = id;
  loadout.weapon = w;
  ({ ammo: loadout.ammo, reserve: loadout.reserve } = loadout.owned[id]);
  loadout.reloading = false;
  loadout.scoped = false;
  loadout.grenade = null;
};
