import { WEAPONS } from '../data/weapons';
import { grenadeCount } from '../grenades/state';
import { carriedGuns } from '../loadout/carriedGuns';
import { currentOptic } from '../loadout/currentOptic';
import { reserve } from '../loadout/reserve';
import { loadout } from '../loadout/state';
import { player } from '../player/state';
import { clock } from '../sim/state';
import { byId } from '../utils/byId';
import { CLASS_ICONS, WEAPON_CLASS } from '../data/weaponClasses';
import { GrenadeId, WeaponClass, WeaponId } from '../types';

/** Grenade chips: grenade, label, number key. */
const GRENADE_CHIPS: [GrenadeId, string, number][] = [
  [GrenadeId.HighExplosive, 'HE', 4],
  [GrenadeId.Flashbang, 'FL', 5],
  [GrenadeId.Smoke, 'SM', 6],
];

let lastWeaponKey: string | null = null;

let lastChips = '';

export const updateHud = () => {
  byId('hpf').style.width = Math.max(0, Math.min(100, player.health)) + '%';
  byId('hpn').textContent = String(Math.ceil(player.health));
  byId('arf').style.width = Math.max(0, Math.min(100, player.armor)) + '%';
  byId('arn').textContent = String(Math.ceil(player.armor));
  byId('hp').classList.toggle('low', player.health < 30 && !player.dead);

  const wk = loadout.weaponId + (currentOptic() ? loadout.owned[loadout.weaponId].optic : '');

  if (lastWeaponKey !== wk) {
    lastWeaponKey = wk;
    byId('wname').textContent = loadout.weapon.name + (currentOptic() ? ' · ' + currentOptic()!.shortName : '');
    byId('wicop').setAttribute('d', CLASS_ICONS[WEAPON_CLASS[loadout.weaponId] || WeaponClass.Rifle]);
  }

  const mel = Boolean(loadout.weapon.melee);

  byId('mag').textContent = mel ? '—' : String(loadout.ammo);
  byId('rsv').textContent = mel ? '' : '/ ' + reserve();
  byId('rlt').textContent = loadout.reloading
    ? 'RELOADING'
    : (loadout.weapon.boltAction && clock.time < loadout.boltCycleEnd ? 'CHAMBERING' : '');

  const gk = carriedGuns();
  let h = '';

  for (const k of gk) {
    h += '<span class="chip'
      + (k === loadout.weaponId && !loadout.grenade ? ' on' : '')
      + '"><i>'
      + (gk.indexOf(k) + 1)
      + '</i>'
      + WEAPONS[k].name
      + '</span>';
  }

  if (loadout.owned[WeaponId.Knife]) {
    h += '<span class="chip'
      + (loadout.weaponId === WeaponId.Knife && !loadout.grenade ? ' on' : '')
      + '"><i>3</i>Knife</span>';
  }

  for (const [k, n, i] of GRENADE_CHIPS) {
    if (grenadeCount[k] > 0) {
      const on = loadout.grenade === k ? ' on' : '';

      h += `<span class="chip${on}"><i>${i}</i>${n} ×${grenadeCount[k]}</span>`;
    }
  }

  if (h !== lastChips) {
    byId('chips').innerHTML = h;
    lastChips = h;
  }
};
