import { stepNoise, stepSnd } from './audio';
import { botsTick } from './bots';
import { brTick } from './br/zone';
import { fire } from './combat';
import { H } from './config';
import { ripple } from './effects';
import { nadesTick } from './grenades';
import { K } from './input';
import { newMatch } from './match';
import { accel, hitBox, move, near } from './physics';
import { P, V, reload } from './player';
import { doorsTick } from './world/doors';
import { surfAt, waterF } from './world/level';
import { state } from './state';

let stepD = 0;
let wasW = false;

/** One fixed simulation step. */
export function tick(dt: number) {
  state.T += dt;
  if (state.phase === 'live') {
    brTick(dt);
  } else if (state.phase === 'start') {
    if (state.T >= state.phaseEnd) {
      state.phase = 'live';
    }
  } else if (state.T >= state.phaseEnd) {
    newMatch();
  }
  if (!state.dead) {
    const cr = K.ControlLeft || K.KeyC;
    if (cr && !state.wasCr && P.g && K.ShiftLeft && state.T >= state.slideCd && P.h >= H && Math.hypot(V.x, V.z) > 4.6 && waterF(P.x, P.z, P.y) < 0.2) {
      const s0 = Math.hypot(V.x, V.z);
      state.slideT0 = state.T;
      state.slideEnd = state.T + 0.95;
      state.slideCd = state.T + 1.9;
      state.slideDir = [V.x / s0, V.z / s0];
      state.slideSp = Math.max(s0, 6.6) * 1.3;
      stepNoise(0.3 * Math.max(0.3, state.stepVol), 0.7, 800, 0.05);
    }
    state.wasCr = cr;
    if (!cr) {
      state.slideEnd = 0;
    }
    if (cr) {
      P.h = 1.2;
    } else if (P.h < H) {
      P.h = H;
      if (near(P.x, P.z, 1).some(b => hitBox(P, b))) {
        P.h = 1.2;
      }
    }
    {
      const tr = ((K.ArrowLeft ? 1 : 0) - (K.ArrowRight ? 1 : 0)) * 2.2 * dt;
      const tp = ((K.ArrowUp ? 1 : 0) - (K.ArrowDown ? 1 : 0)) * 1.6 * dt;
      state.yaw += tr;
      state.pitch = Math.max(-1.5, Math.min(1.5, state.pitch + tp));
    }
    const f = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0);
    const s = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0);
    const sy = Math.sin(state.yaw);
    const cy = Math.cos(state.yaw);
    let wx = -sy * f + cy * s;
    let wz = -cy * f - sy * s;
    const wl = Math.hypot(wx, wz);
    if (wl > 0) {
      wx /= wl;
      wz /= wl;
    }
    const wf = waterF(P.x, P.z, P.y);
    const ws = (wl > 0 ? (P.h < H ? 2.4 : K.ShiftLeft ? 6.6 : 3.9) : 0) * (1 - 0.5 * wf);
    if (P.g && K.Space) {
      V.y = 7 - 3 * wf;
      P.g = false;
      state.slideEnd = 0;
    }
    const sliding = state.T < state.slideEnd && P.g;
    if (sliding) {
      const u = Math.min(1, (state.T - state.slideT0) / 0.95);
      const spd = 1.2 + (state.slideSp - 1.2) * (1 - u) * (1 - u);
      V.x = state.slideDir[0] * spd;
      V.z = state.slideDir[1] * spd;
    } else if (P.g) {
      const sp = Math.hypot(V.x, V.z);
      if (sp > 0) {
        const k = Math.max(sp - Math.max(sp, 1.5) * 5 * dt, 0) / sp;
        V.x *= k;
        V.z *= k;
      }
      accel(V, wx, wz, ws, 10 * ws, dt);
    } else if (wl > 0) {
      accel(V, wx, wz, Math.min(ws, 0.9), 62, dt);
    }
    V.y -= 20 * dt;
    move(P, V, dt);
    if (sliding && Math.hypot(V.x, V.z) < 0.6) {
      state.slideEnd = 0;
    }
    {
      const w2 = waterF(P.x, P.z, P.y);
      if (w2 > 0 && !wasW) {
        ripple(P.x, P.z);
        ripple(P.x, P.z);
        stepSnd('water', 1.6);
      }
      wasW = w2 > 0;
      if (P.g) {
        const sp = Math.hypot(V.x, V.z);
        stepD += sp * dt;
        if (stepD > 1.9) {
          stepD = 0;
          if (sp > 1.2 && P.h >= H) {
            stepSnd(surfAt(P.x, P.z, P.y), K.ShiftLeft ? 1 : 0.45);
            if (w2 > 0) {
              ripple(P.x, P.z);
            }
          }
        }
      }
    }
    const dk = Math.exp(-2.4 * dt);
    state.punchP *= dk;
    state.punchY *= dk;
    if (state.T < state.cycEnd) {
      state.scoped = false;
    }
    if (state.reloading && state.T >= state.reloadEnd) {
      const n = Math.min(state.WP.mag - state.mag, state.res);
      state.mag += n;
      state.res -= n;
      state.reloading = false;
    }
    if (state.mouse && !state.cg && !state.reloading && state.T >= state.nextFire) {
      if (state.mag > 0) {
        fire();
        if (!state.WP.auto) {
          state.mouse = false;
        }
      } else {
        reload();
      }
    }
  }
  nadesTick(dt);
  doorsTick(dt);
  if (state.phase !== 'start') {
    botsTick(dt);
  }
}
