import { unlockAudio } from './audio';
import { looting, swapPickup, gunInSlot } from './br/pickups';
import { MOUSE_SENS } from './config';
import { byId, glCanvas } from './dom';
import { grenadeThrow, grenadeCount, throwGrenade } from './grenades';
import { bigMapOpen, openBigMap } from './hud/minimap';
import { canAim, currentOptic, loadout } from './loadout';
import { player, reload, switchWeapon } from './player';
import { useDoor } from './world/doors';
import { settings } from './settings';
import { simTime } from './sim';
import type { GrenadeId } from './types';

/** Keys held, by `KeyboardEvent.code`. */
export const keys: Record<string, boolean> = {};
export const input = {
  /** Fire button held. */
  fireHeld: false,
  /** Pointer locked and the simulation running. */
  playing: false,
  inMenu: true,
};
let lastWheel = 0;

// The game only runs while the mouse is locked (pointerlockchange -> setPlaying). If the browser refuses the lock
// (e.g. re-clicking right after Esc), the pause overlay stays up and the next click retries.
export function lockMouse() {
  const fail = (e: unknown) => {
    console.warn('Pointer lock refused:', (e instanceof Error && e.message) || e);
    if (!input.inMenu) {
      setPlaying(false);
    }
  };

  try {
    const p = glCanvas.requestPointerLock();
    if (p && p.catch) {
      p.catch(fail);
    }
  } catch (e) {
    fail(e);
  }
}

export function setPlaying(v: boolean) {
  input.playing = v;
  if (!v) {
    grenadeThrow.held = false;
  }
  byId('start').style.display = (v || input.inMenu) ? 'none' : 'flex';
  if (!v) {
    input.fireHeld = false;
    for (const k in keys) {
      keys[k] = false;
    }
  }
}

byId('go').addEventListener('click', () => {
  unlockAudio();
  lockMouse();
});
document.addEventListener('pointerlockchange', () => setPlaying(document.pointerLockElement === glCanvas));
addEventListener('mousemove', (e) => {
  if (!input.playing || player.dead || document.pointerLockElement !== glCanvas) {
    return;
  }
  const s = MOUSE_SENS * settings.sensitivity * (loadout.scoped ? (loadout.weapon.sniper ? 0.3 : (currentOptic()?.sensitivity ?? 0.85)) : 1);
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
  } else if (input.playing && e.button === 2 && canAim() && !player.dead && (loadout.scoped || (simTime >= loadout.boltCycleEnd && !loadout.reloading))) {
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
    openBigMap(!bigMapOpen);
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
