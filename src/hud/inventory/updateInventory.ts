import { AMMO_SHORT, AMMO_TYPES } from '../../data/ammo';
import { OPTICS } from '../../data/optics';
import { CLASS_ICONS, CLASS_NAMES, WEAPON_CLASS } from '../../data/weaponClasses';
import { WEAPONS } from '../../data/weapons';
import { grenadeCount } from '../../grenades/state';
import { input } from '../../input/state';
import { canHoldOptic } from '../../loadout/canHoldOptic';
import { carriedGuns } from '../../loadout/carriedGuns';
import { opticAt } from '../../loadout/opticAt';
import { reserve } from '../../loadout/reserve';
import { loadout } from '../../loadout/state';
import { takesOptic } from '../../loadout/takesOptic';
import { player, supplies } from '../../player/state';
import { byId } from '../../utils/byId';
import { hitAt } from './hitAt';
import { inventory } from './state';
import { MAX_MEDKITS, MAX_VESTS } from '../../config';
import { GrenadeId, WeaponId } from '../../types';
import { writeDom } from '../../utils/dom/writeDom';

/** Grenades: id, name, number key. */
const GRENADES: [GrenadeId, string, number][] = [
  [GrenadeId.HighExplosive, 'HE grenade', 4],
  [GrenadeId.Flashbang, 'Flashbang', 5],
  [GrenadeId.Smoke, 'Smoke', 6],
];

/** A stat bar with its real value `text`, filled to `v` (0..1). */
const bar = (name: string, text: string, v: number) => '<div class="ivst"><small>' + name + '<em>' + text
  + '</em></small><span><i style="width:' + Math.round(Math.max(0.04, Math.min(1, v)) * 100) + '%"></i></span></div>';

/** An optic slot (`key` as in `opticAt`): draggable when it holds an optic. */
const opticSlot = (key: string, label: string) => {
  const o = opticAt(key);

  return '<div class="ivsl opt' + (o ? ' full' : ' none') + '" data-slot="' + key + '"><small>' + label + '</small>'
    + (o ? OPTICS[o].name : 'Empty') + '</div>';
};

/** A medkit or vest button: a click uses one (`ready`: it would do anything). */
const useItem = (id: string, key: number, name: string, n: number, max: number, ready: boolean) => '<div class="sm use'
  + (n ? '' : ' zero') + (n && ready ? ' ready' : '') + '" data-use="' + id + '"><i>' + key + '</i>' + name + '<b>'
  + n + '/' + max + '</b></div>';

/** Card of the gun in slot `n` (or an empty slot). */
const gunCard = (n: number, id: WeaponId | undefined) => {
  if (!id) {
    return '<div class="ivw empty"><div class="ivt"><i>' + n + '</i><b>Empty slot</b></div></div>';
  }

  const w = WEAPONS[id];
  const c = WEAPON_CLASS[id];
  const inHand = id === loadout.weaponId && !loadout.grenade;
  const mag = inHand ? loadout.ammo : loadout.owned[id].ammo;
  const optic = takesOptic(id)
    ? opticSlot('g:' + id, 'Optic')
    : '<div class="ivsl fixed"><small>Optic</small>' + (w.sniper ? 'Built-in scope' : 'Iron sights') + '</div>';
  const rpm = Math.round(60 / w.fireInterval);

  return '<div class="ivw c' + c + (inHand ? ' on' : '') + '">'
    + '<div class="ivt"><i>' + n + '</i><b>' + w.name + '</b><span>' + CLASS_NAMES[c] + '</span></div>'
    + '<div class="ivb"><svg viewBox="0 0 120 40"><path fill="currentColor" d="' + CLASS_ICONS[c] + '"/></svg>'
    + '<div class="ivm"><b>' + mag + '</b>/ ' + reserve(id)
    + '<small>loaded / spare · mag ' + w.magSize + '</small></div></div>'
    // the values the game uses (data/weapons.ts); bars against the strongest gun of all
    + '<div class="ivs">'
    + bar('Damage', w.pellets ? w.pellets + '×' + w.damage : String(w.damage), w.damage * (w.pellets || 1) / 150)
    + bar('Fire rate', rpm + '/min', rpm / 860)
    + bar('Range', w.range + ' m', w.range / 300)
    + '</div>'
    + '<div class="ivsls">' + optic + '<div class="ivsl"><small>Ammo</small>' + AMMO_SHORT[w.ammoType!] + '</div></div>'
    + '</div>';
};

let last = '';

/**
 * Draws the inventory panel while it is open (both gun slots, spare optics, the ammo bag, knife, grenades, medkits,
 * vests and armor), with its cursor and the optic being dragged.
 */
export const updateInventory = () => {
  const el = byId('inv');
  const show = inventory.open && !input.inMenu && !player.dead;
  const cur = byId('ivcur');
  const ghost = byId('ivdrag');

  writeDom(el, 'display', show ? 'block' : 'none');
  writeDom(cur, 'display', show ? 'block' : 'none');
  writeDom(ghost, 'display', show && inventory.drag ? 'block' : 'none');

  if (!show) {
    last = '';
    return;
  }

  const guns = carriedGuns();
  const used = new Set(guns.map(k => WEAPONS[k].ammoType));
  let h = '<div class="ivh"><b>Inventory</b><span class="key">Tab</span></div>'
    + gunCard(1, guns[0])
    + gunCard(2, guns[1]);

  h += '<div class="ivsec">Optics</div><div class="ivop">';

  for (let i = 0; i < loadout.opticBag.length; i++) {
    h += opticSlot('b:' + i, String(i + 1));
  }

  h += '</div><div class="ivsec">Ammo</div><div class="ivam">';

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
  h += '</div><div class="ivsec">Medical</div><div class="ivsm">'
    + useItem('medkit', 7, 'Medkit', supplies.medkits, MAX_MEDKITS, player.health < 100)
    + useItem('vest', 8, 'Kevlar vest', supplies.vests, MAX_VESTS, player.armor < 100)
    + '</div><div class="ivhint">Click a medkit or vest to use it. Drag an optic onto another slot to swap them, '
    + 'out of the panel or right-click it to drop it.</div>';

  if (h !== last) {
    el.innerHTML = h;
    last = h;

    // shrink to fit between the top of the screen and the health panel on short or narrow screens
    const room = Math.min((innerHeight - el.offsetTop - 120) / el.offsetHeight, (innerWidth - 36) / el.offsetWidth);

    el.style.transform = room < 1 ? 'scale(' + Math.max(0.5, room).toFixed(3) + ')' : '';
  }

  // the first time, the cursor starts in the middle of the panel
  if (inventory.x < 0) {
    const r = el.getBoundingClientRect();

    inventory.x = r.left + r.width / 2;
    inventory.y = r.top + Math.min(r.height / 2, 200);
  }

  // cursor, dragged optic, and which slot it would land on
  const hov = hitAt(inventory.x, inventory.y, 'slot');
  const use = hov ? null : hitAt(inventory.x, inventory.y, 'use');
  const d = inventory.drag;
  const usable = use === 'medkit'
    ? supplies.medkits > 0 && player.health < 100
    : use === 'vest' && supplies.vests > 0 && player.armor < 100;

  // its shape says what a click does: grab an optic, use a medkit or vest, or nothing
  writeDom(cur, 'class', 'hud ' + (d ? 'grabbing' : hov && opticAt(hov) ? 'grab' : usable ? 'point' : 'arrow'));
  writeDom(cur, 'transform', 'translate(' + inventory.x + 'px,' + inventory.y + 'px)');

  if (d) {
    const o = opticAt(d);

    ghost.textContent = o ? OPTICS[o].name : '';
    writeDom(ghost, 'transform', 'translate(' + (inventory.x + 32) + 'px,' + (inventory.y + 8) + 'px)');
  }

  for (const s of el.querySelectorAll<HTMLElement>('[data-use]')) {
    s.classList.toggle('hov', s.dataset.use === use);
  }

  for (const s of el.querySelectorAll<HTMLElement>('[data-slot]')) {
    const k = s.dataset.slot!;
    const target = Boolean(d) && k === hov && k !== d;
    // a swap needs both slots able to hold the other's optic
    const bad = target && (!canHoldOptic(k) || (Boolean(opticAt(k)) && !canHoldOptic(d!)));

    s.classList.toggle('drag', k === d);
    s.classList.toggle('hov', k === hov && !bad);
    s.classList.toggle('bad', bad);
  }

  el.classList.toggle('out', Boolean(d) && !hov && (() => {
    const r = el.getBoundingClientRect();

    return inventory.x < r.left || inventory.x > r.right || inventory.y < r.top || inventory.y > r.bottom;
  })());
};
