import { AMMO_SHORT, AMMO_TYPES } from '../../data/ammo';
import { OPTICS } from '../../data/optics';
import { CLASS_ICONS, CLASS_NAMES, WEAPON_CLASS } from '../../data/weaponClasses';
import { WEAPONS } from '../../data/weapons';
import { grenadeCount } from '../../grenades/state';
import { input } from '../../input/state';
import { carriedGuns } from '../../loadout/carriedGuns';
import { reserve } from '../../loadout/reserve';
import { loadout } from '../../loadout/state';
import { takesOptic } from '../../loadout/takesOptic';
import { player } from '../../player/state';
import { byId } from '../../utils/byId';
import { inventory } from './state';
import { GrenadeId, WeaponId } from '../../types';

/** Grenades: id, name, number key. */
const GRENADES: [GrenadeId, string, number][] = [
  [GrenadeId.HighExplosive, 'HE grenade', 4],
  [GrenadeId.Flashbang, 'Flashbang', 5],
  [GrenadeId.Smoke, 'Smoke', 6],
];

/** A stat bar, `v` from 0 to 1. */
const bar = (name: string, v: number) => '<div class="ivst"><small>' + name + '</small><span><i style="width:'
  + Math.round(Math.max(0.04, Math.min(1, v)) * 100) + '%"></i></span></div>';

/** Card of the gun in slot `n` (or an empty slot). */
const gunCard = (n: number, id: WeaponId | undefined) => {
  if (!id) {
    return '<div class="ivw empty"><div class="ivt"><i>' + n + '</i><b>Empty slot</b></div></div>';
  }

  const w = WEAPONS[id];
  const c = WEAPON_CLASS[id];
  const inHand = id === loadout.weaponId && !loadout.grenade;
  const mag = inHand ? loadout.ammo : loadout.owned[id].ammo;
  const o = loadout.owned[id].optic;
  const optic = takesOptic(id)
    ? (o
        ? '<div class="ivsl"><small>Optic</small>' + OPTICS[o].name + '</div>'
        : '<div class="ivsl none"><small>Optic</small>Empty</div>')
    : '<div class="ivsl fixed"><small>Optic</small>' + (w.sniper ? 'Built-in scope' : 'Iron sights') + '</div>';

  return '<div class="ivw c' + c + (inHand ? ' on' : '') + '">'
    + '<div class="ivt"><i>' + n + '</i><b>' + w.name + '</b><span>' + CLASS_NAMES[c] + '</span></div>'
    + '<div class="ivb"><svg viewBox="0 0 120 40"><path fill="currentColor" d="' + CLASS_ICONS[c] + '"/></svg>'
    + '<div class="ivm"><b>' + mag + '</b>/' + w.magSize + '<small>+' + reserve(id) + ' spare</small></div></div>'
    + '<div class="ivs">' + bar('Damage', w.damage * (w.pellets || 1) / 130) + bar('Fire rate', 0.07 / w.fireInterval)
    + bar('Range', w.range / 300) + '</div>'
    + '<div class="ivsls">' + optic
    + '<div class="ivsl"><small>Ammo</small>' + AMMO_SHORT[w.ammoType!] + '</div></div>'
    + '</div>';
};

let last = '';

/** Draws the inventory panel while it is open: both gun slots, the ammo bag, knife, grenades and armor. */
export const updateInventory = () => {
  const el = byId('inv');
  const show = inventory.open && !input.inMenu && !player.dead;

  el.style.display = show ? 'block' : 'none';

  if (!show) {
    last = '';
    return;
  }

  const guns = carriedGuns();
  const used = new Set(guns.map(k => WEAPONS[k].ammoType));
  let h = '<div class="ivh"><b>Inventory</b><span class="key">Tab</span></div>'
    + gunCard(1, guns[0])
    + gunCard(2, guns[1]);

  h += '<div class="ivsec">Ammo</div><div class="ivam">';

  for (const a of AMMO_TYPES) {
    h += '<div class="am a' + a + (used.has(a) ? ' on' : '') + (loadout.ammoBag[a] ? '' : ' zero') + '"><small>'
      + AMMO_SHORT[a] + '</small><b>' + loadout.ammoBag[a] + '</b></div>';
  }

  h += '</div><div class="ivsec">Equipment</div><div class="ivsm">';

  const knife = loadout.weaponId === WeaponId.Knife && !loadout.grenade;

  h += '<div class="sm' + (knife ? ' on' : '') + '"><i>3</i>Knife</div>';

  for (const [g, name, key] of GRENADES) {
    h += '<div class="sm' + (grenadeCount[g] ? '' : ' zero') + (loadout.grenade === g ? ' on' : '') + '"><i>' + key
      + '</i>' + name + '<b>×' + grenadeCount[g] + '</b></div>';
  }

  h += '<div class="sm' + (player.armor > 0 ? '' : ' zero') + '">Armor<b>' + Math.ceil(player.armor) + '</b></div>';
  h += '</div>';

  if (h !== last) {
    el.innerHTML = h;
    last = h;
  }
};
