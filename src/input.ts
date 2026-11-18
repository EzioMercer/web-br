import { initAudio } from './audio';
import { swapPick, wslot } from './br/pickups';
import { SENS } from './config';
import { $, cv } from './dom';
import { nade, throwNade } from './grenades';
import { openBig } from './hud/minimap';
import { canScope, curOpt } from './loadout';
import { reload, switchW } from './player';
import { useDoor } from './world/doors';
import { state } from './state';
import type { GrenadeId } from './types';

/** Keys held, by `KeyboardEvent.code`. */
export const K: Record<string, boolean> = {};

// The game only runs while the mouse is locked (pointerlockchange -> setPlay). If the browser refuses the lock
// (e.g. re-clicking right after Esc), the pause overlay stays up and the next click retries.
export function lockMouse() {
  const fail = (e: unknown) => {
    console.warn('Pointer lock refused:', (e instanceof Error && e.message) || e);
    if (!state.inMenu) {
      setPlay(false);
    }
  };

  try {
    const p = cv.requestPointerLock();
    if (p && p.catch) {
      p.catch(fail);
    }
  } catch (e) {
    fail(e);
  }
}

export function setPlay(v: boolean) {
  state.playing = v;
  if (!v) {
    state.grenHeld = false;
  }
  $('start').style.display = (v || state.inMenu) ? 'none' : 'flex';
  if (!v) {
    state.mouse = false;
    for (const k in K) {
      K[k] = false;
    }
  }
}

$('start').addEventListener('click', () => {
  initAudio();
  if (state.AC && state.AC.state === 'suspended') {
    state.AC.resume();
  }
  lockMouse();
});
document.addEventListener('pointerlockchange', () => setPlay(document.pointerLockElement === cv));
addEventListener('mousemove', (e) => {
  if (!state.playing || state.dead || document.pointerLockElement !== cv) {
    return;
  }
  const s = SENS * state.sensMul * (state.scoped ? (state.WP.snp ? 0.3 : (curOpt()?.sens ?? 0.85)) : 1);
  state.yaw -= e.movementX * s;
  state.pitch = Math.max(-1.5, Math.min(1.5, state.pitch - e.movementY * s));
});
addEventListener('mousedown', (e) => {
  if (state.playing && e.button === 0) {
    state.mouse = true;
    if (state.cg && !state.dead) {
      state.grenHeld = true;
    }
  }
  if (state.playing && e.button === 2 && state.cg && !state.dead) {
    state.lob = !state.lob;
  } else if (state.playing && e.button === 2 && canScope() && !state.dead && (state.scoped || (state.T >= state.cycEnd && !state.reloading))) {
    state.scoped = !state.scoped;
  }
});
addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    state.mouse = false;
    if (state.grenHeld && state.cg && !state.dead && state.playing) {
      throwNade();
    }
    state.grenHeld = false;
  }
});
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (state.playing && !document.pointerLockElement) {
      setPlay(false);
    }
    return;
  }
  if (!state.playing) {
    return;
  }
  K[e.code] = true;
  if (e.code === 'Space' || e.ctrlKey || e.code.startsWith('Arrow')) {
    e.preventDefault();
  }
  if (e.code === 'KeyM') {
    openBig(!state.bigOpen);
    return;
  }
  if (e.code === 'KeyR') {
    reload();
  }
  if (e.code === 'Digit1') {
    state.cg = null;
    switchW(wslot(1));
  }
  if (e.code === 'Digit2') {
    state.cg = null;
    switchW(wslot(2));
  }
  if (e.code === 'KeyE' && !state.dead) {
    if (state.brNear) {
      swapPick(state.brNear);
    } else {
      useDoor();
    }
  }
  if (e.code === 'Digit3') {
    state.cg = null;
    switchW('knife');
  }
  const gk = ({ Digit4: 'he', Digit5: 'fl', Digit6: 'sm' } as Record<string, GrenadeId>)[e.code];

  if (gk && nade[gk] > 0 && !state.dead && !state.reloading) {
    state.cg = state.cg === gk ? null : gk;
  }
});
addEventListener('keyup', (e) => {
  K[e.code] = false;
});
addEventListener('blur', () => {
  state.mouse = false;
  state.grenHeld = false;
  for (const k in K) {
    K[k] = false;
  }
});
addEventListener('wheel', (e) => {
  if (!state.playing || state.dead) {
    return;
  }
  const n = performance.now();
  if (n - state.wheelT < 140) {
    return;
  }
  state.wheelT = n;
  if (state.cg) {
    state.cg = null;
    return;
  }
  const ks = Object.keys(state.owned);
  if (ks.length < 2) {
    return;
  }
  switchW(ks[(ks.indexOf(state.cw) + (e.deltaY > 0 ? 1 : -1) + ks.length) % ks.length]);
}, { passive: true });
