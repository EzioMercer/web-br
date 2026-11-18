import { unlockAudio } from '../audio/unlockAudio';
import { gunInSlot } from '../br/pickups/gunInSlot';
import { looting } from '../br/pickups/state';
import { swapPickup } from '../br/pickups/swapPickup';
import { MOUSE_SENS } from '../config';
import { grenadeCount, grenadeThrow } from '../grenades/state';
import { throwGrenade } from '../grenades/throwGrenade';
import { openBigMap } from '../hud/minimap/openBigMap';
import { maps } from '../hud/minimap/state';
import { canAim } from '../loadout/canAim';
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
import type { GrenadeId } from '../types';

let lastWheel = 0;

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

  if (e.code === 'Space' || e.ctrlKey || e.code.startsWith('Arrow')) {
    e.preventDefault();
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
    switchWeapon('knife');
  }

  const gk = ({ Digit4: 'he', Digit5: 'fl', Digit6: 'sm' } as Record<string, GrenadeId>)[e.code];

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

  if (n - lastWheel < 140) {
    return;
  }

  lastWheel = n;

  if (loadout.grenade) {
    loadout.grenade = null;
    return;
  }

  const ks = Object.keys(loadout.owned);

  if (ks.length < 2) {
    return;
  }

  switchWeapon(ks[(ks.indexOf(loadout.weaponId) + (e.deltaY > 0 ? 1 : -1) + ks.length) % ks.length]);
}, { passive: true });
