import { unlockAudio } from '../audio/unlockAudio';
import { gunInSlot } from '../br/pickups/gunInSlot';
import { looting } from '../br/pickups/state';
import { swapPickup } from '../br/pickups/swapPickup';
import { MOUSE_SENS } from '../config';
import { grenadeCount, grenadeThrow } from '../grenades/state';
import { throwGrenade } from '../grenades/throwGrenade';
import { inventory } from '../hud/inventory/state';
import { openBigMap } from '../hud/minimap/openBigMap';
import { maps } from '../hud/minimap/state';
import { canAim } from '../loadout/canAim';
import { carriedGuns } from '../loadout/carriedGuns';
import { currentOptic } from '../loadout/currentOptic';
import { reload } from '../loadout/reload';
import { loadout } from '../loadout/state';
import { switchWeapon } from '../loadout/switchWeapon';
import { player } from '../player/state';
import { glCanvas } from '../render/glCanvas';
import { settings } from '../settings/state';
import { clock } from '../sim/state';
import { byId } from '../utils/byId';
import { useDoor } from '../world/doors/useDoor';
import { lockMouse } from './lockMouse';
import { setPlaying } from './setPlaying';
import { input, keys } from './state';
import { GrenadeId, WeaponId } from '../types';

/** Last wheel event, delta summed since the last step, and end of the pause after a step. */
let lastWheel = 0;

let wheelSum = 0;

let wheelQuietUntil = 0;

byId('go').addEventListener('click', () => {
  unlockAudio();
  lockMouse();
});

document.addEventListener('pointerlockchange', () => setPlaying(document.pointerLockElement === glCanvas));

addEventListener('mousemove', (e) => {
  if (!input.playing || player.dead || document.pointerLockElement !== glCanvas) {
    return;
  }

  const s = MOUSE_SENS * settings.sensitivity * (loadout.scoped
    ? (loadout.weapon.sniper ? 0.3 : (currentOptic()?.sensitivity ?? 0.85))
    : 1);

  player.yaw -= e.movementX * s;
  player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch - e.movementY * s));
});

addEventListener('mousedown', (e) => {
  if (input.playing && e.button === 0) {
    input.fireHeld = true;

    if (loadout.grenade && !player.dead) {
      grenadeThrow.held = true;
    }
  }

  if (input.playing && e.button === 2 && loadout.grenade && !player.dead) {
    grenadeThrow.lob = !grenadeThrow.lob;
  } else if (input.playing
    && e.button === 2
    && canAim()
    && !player.dead
    && (loadout.scoped || (clock.time >= loadout.boltCycleEnd && !loadout.reloading))) {
    loadout.scoped = !loadout.scoped;
  }
});

addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    input.fireHeld = false;

    if (grenadeThrow.held && loadout.grenade && !player.dead && input.playing) {
      throwGrenade();
    }

    grenadeThrow.held = false;
  }
});

addEventListener('contextmenu', e => e.preventDefault());

addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (input.playing && !document.pointerLockElement) {
      setPlaying(false);
    }

    return;
  }

  if (!input.playing) {
    return;
  }

  keys[e.code] = true;

  if (e.code === 'Space' || e.code === 'Tab' || e.ctrlKey || e.code.startsWith('Arrow')) {
    e.preventDefault();
  }

  if (e.code === 'Tab') {
    if (!e.repeat) {
      inventory.open = !inventory.open;
    }

    return;
  }

  if (e.code === 'KeyM') {
    openBigMap(!maps.bigOpen);
    return;
  }

  if (e.code === 'KeyR') {
    reload();
  }

  if (e.code === 'Digit1') {
    loadout.grenade = null;
    switchWeapon(gunInSlot(1));
  }

  if (e.code === 'Digit2') {
    loadout.grenade = null;
    switchWeapon(gunInSlot(2));
  }

  if (e.code === 'KeyE' && !player.dead) {
    if (looting.swapTarget) {
      swapPickup(looting.swapTarget);
    } else {
      useDoor();
    }
  }

  if (e.code === 'Digit3') {
    loadout.grenade = null;
    switchWeapon(WeaponId.Knife);
  }

  const gk = ({
    Digit4: GrenadeId.HighExplosive,
    Digit5: GrenadeId.Flashbang,
    Digit6: GrenadeId.Smoke,
  } as Record<string, GrenadeId>)[e.code];

  if (gk && grenadeCount[gk] > 0 && !player.dead && !loadout.reloading) {
    loadout.grenade = loadout.grenade === gk ? null : gk;
  }
});

addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

addEventListener('blur', () => {
  input.fireHeld = false;
  grenadeThrow.held = false;

  for (const k in keys) {
    keys[k] = false;
  }
});

addEventListener('wheel', (e) => {
  if (!input.playing || player.dead) {
    return;
  }

  const n = performance.now();

  // a notch of a mouse wheel is about 100 px; a trackpad sends many small deltas. Add them up and step once per notch,
  // and ignore the tail of a fast flick for a moment so a single notch never moves two slots.
  if (n - lastWheel > 250) {
    wheelSum = 0;
  }

  lastWheel = n;

  if (n < wheelQuietUntil) {
    return;
  }

  wheelSum += e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 800 : 1);

  if (Math.abs(wheelSum) < 50) {
    return;
  }

  const step = wheelSum > 0 ? 1 : -1;

  wheelSum = 0;
  wheelQuietUntil = n + 120;

  if (loadout.grenade) {
    loadout.grenade = null;
    return;
  }

  // slot order: 1, 2, 3 (knife). Down goes 1 to 3, up 3 to 1, stopping at the ends.
  const ks = [...carriedGuns(), WeaponId.Knife].filter(k => loadout.owned[k]);
  const i = ks.indexOf(loadout.weaponId) + step;

  if (i >= 0 && i < ks.length) {
    switchWeapon(ks[i]);
  }
}, { passive: true });
