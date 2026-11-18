import { WEAPONS } from '../data/weapons';
import { grenadeCount } from '../grenades/state';
import { carriedGuns } from '../loadout/carriedGuns';
import { currentOptic } from '../loadout/currentOptic';
import { loadout } from '../loadout/state';
import { player } from '../player/state';
import { clock } from '../sim/state';
import { byId } from '../utils/byId';
import type { GrenadeId } from '../types';

/** Weapon class icons (SVG paths): pistol, SMG, rifle, shotgun, sniper, knife. */
const CLASS_ICONS: Record<string, string> = {
  p: 'M10 12h62v9H60l-3 14H46l3-14H34l-3 5H10z',
  s: 'M6 14h74v8H66l-2 14h-9l2-14H44l-2 12h-8l2-12H6z M80 16h30v4H80z',
  r: 'M4 16h40l6-4h30l4 3h30v5H84l-4 3H58l-2 12h-9l1-12H20l-6 7H4z',
  g: 'M4 18h100v5H60v4H40v-4H4z M50 23h14v8H50z',
  n: 'M2 20h104v4H70l-6 4H44l-4 10h-8l3-10H18l-4 3H2z M40 12h30v4H40z',
  k: 'M18 29L76 13l8 2-6 7-58 9z M12 29h10v6H12z',
};

const WEAPON_CLASS: Record<string, string> = {
  pistol: 'p',
  glock: 'p',
  deagle: 'p',
  mp5: 's',
  p90: 's',
  rifle: 'r',
  m4: 'r',
  m3: 'g',
  awp: 'n',
  scout: 'n',
  svd: 'n',
  g3: 'n',
  kar: 'n',
  m82: 'n',
  knife: 'k',
};

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
    byId('wicop').setAttribute('d', CLASS_ICONS[WEAPON_CLASS[loadout.weaponId] || 'r']);
  }

  const mel = !!loadout.weapon.melee;

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

  if (loadout.owned.knife) {
    h += '<span class="chip'
      + (loadout.weaponId === 'knife' && !loadout.grenade ? ' on' : '')
      + '"><i>3</i>Knife</span>';
  }

  ([['he', 'HE', 4], ['fl', 'FL', 5], ['sm', 'SM', 6]] as [GrenadeId, string, number][]).forEach(([k, n, i]) => {
    if (grenadeCount[k] > 0) {
      h += '<span class="chip'
        + (loadout.grenade === k ? ' on' : '')
        + '"><i>'
        + i
        + '</i>'
        + n
        + ' ×'
        + grenadeCount[k]
        + '</span>';
    }
  });

  if (h !== lastChips) {
    byId('chips').innerHTML = h;
    lastChips = h;
  }
};
