import { WEAPONS } from '../data/weapons';
import { grenadeCount } from '../grenades/state';
import { carriedGuns } from '../loadout/carriedGuns';
import { currentOptic } from '../loadout/currentOptic';
import { loadout } from '../loadout/state';
import { player } from '../player/state';
import { clock } from '../sim/state';
import { byId } from '../utils/byId';
import { GrenadeId, WeaponId } from '../types';

/** Weapon class, for the HUD icon. */
enum WeaponClass {
  Pistol = 'p',
  Smg = 's',
  Rifle = 'r',
  Shotgun = 'g',
  Sniper = 'n',
  Knife = 'k',
}

/** Weapon class icons (SVG paths). */
const CLASS_ICONS: Record<WeaponClass, string> = {
  [WeaponClass.Pistol]: 'M10 12h62v9H60l-3 14H46l3-14H34l-3 5H10z',
  [WeaponClass.Smg]: 'M6 14h74v8H66l-2 14h-9l2-14H44l-2 12h-8l2-12H6z M80 16h30v4H80z',
  [WeaponClass.Rifle]: 'M4 16h40l6-4h30l4 3h30v5H84l-4 3H58l-2 12h-9l1-12H20l-6 7H4z',
  [WeaponClass.Shotgun]: 'M4 18h100v5H60v4H40v-4H4z M50 23h14v8H50z',
  [WeaponClass.Sniper]: 'M2 20h104v4H70l-6 4H44l-4 10h-8l3-10H18l-4 3H2z M40 12h30v4H40z',
  [WeaponClass.Knife]: 'M18 29L76 13l8 2-6 7-58 9z M12 29h10v6H12z',
};

const WEAPON_CLASS: Record<WeaponId, WeaponClass> = {
  [WeaponId.Usp]: WeaponClass.Pistol,
  [WeaponId.Glock18]: WeaponClass.Pistol,
  [WeaponId.DesertEagle]: WeaponClass.Pistol,
  [WeaponId.Mp5]: WeaponClass.Smg,
  [WeaponId.P90]: WeaponClass.Smg,
  [WeaponId.Ak47]: WeaponClass.Rifle,
  [WeaponId.M4a1]: WeaponClass.Rifle,
  [WeaponId.M3]: WeaponClass.Shotgun,
  [WeaponId.Awp]: WeaponClass.Sniper,
  [WeaponId.Scout]: WeaponClass.Sniper,
  [WeaponId.Svd]: WeaponClass.Sniper,
  [WeaponId.G3sg1]: WeaponClass.Sniper,
  [WeaponId.Kar98k]: WeaponClass.Sniper,
  [WeaponId.BarrettM82]: WeaponClass.Sniper,
  [WeaponId.Knife]: WeaponClass.Knife,
};

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
  byId('rsv').textContent = mel ? '' : '/ ' + loadout.reserve;
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
