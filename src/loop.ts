import { aimLabels } from './bots';
import { spread } from './combat';
import { FOV, H, STEP } from './config';
import { $ } from './dom';
import { fx, ripples } from './effects';
import { aimUpdate } from './grenades';
import { brHud, drawCompass, hudUpdate, promptText } from './hud/hud';
import { K } from './input';
import { canScope, curOpt, scopeFov } from './loadout';
import { P, V } from './player';
import { cam, ren, scene } from './render/renderer';
import { tick } from './sim';
import { FZ, NV, TIP, VM, VMO, animVM, flash, gun } from './viewmodel';
import { NC, OPTK } from './weapons';
import { shards } from './world/doors';
import { waterMs } from './world/level';
import { state } from './state';

let last = performance.now();
let acc = 0;

/** Render loop: runs the fixed-step simulation, then updates the camera, viewmodel, effects and HUD. */
export function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (state.playing) {
    acc += dt;
    while (acc >= STEP) {
      tick(STEP);
      acc -= STEP;
    }
  }
  const sp = Math.hypot(V.x, V.z);
  const isSl = state.T < state.slideEnd && !state.dead;
  state.eye += ((isSl ? 0.78 : P.h < H ? 1.1 : 1.62) - state.eye) * Math.min(1, dt * 14);
  cam.position.set(P.x, P.y + state.eye - (state.dead ? 1.2 : 0), P.z);
  state.slR += ((isSl ? 0.06 : 0) - state.slR) * Math.min(1, dt * 9);
  cam.rotation.set(state.pitch + state.punchP, state.yaw + state.punchY, state.dead ? 0.9 : state.slR);
  const runNow = !!(K.ShiftLeft && sp > 4.8 && P.g && P.h >= H && !state.dead && !state.reloading && !state.cg && !state.scoped && state.T - state.lastShot > 0.3 && !isSl);
  state.runK += ((runNow ? 1 : 0) - state.runK) * Math.min(1, dt * 7);
  state.slK += ((isSl ? 1 : 0) - state.slK) * Math.min(1, dt * 9);
  const adsT = state.scoped && !state.WP.snp && !state.reloading ? 1 : 0;
  state.adsK += (adsT - state.adsK) * Math.min(1, dt * 12);
  if (state.scoped && (!canScope() || state.cg || state.dead)) {
    state.scoped = false;
  }
  aimLabels();
  const tf = state.scoped ? scopeFov() : FOV + 4 * state.runK + 3 * state.slK;
  if (Math.abs(cam.fov - tf) > 0.01) {
    cam.fov = tf;
    cam.updateProjectionMatrix();
  }
  gun.visible = !(state.scoped && (state.WP.snp || (curOpt() && state.adsK > 0.4)));
  for (const k in VM) {
    VM[k].visible = k === state.cw && !state.cg;
  }
  NV.visible = !!state.cg;
  if (state.cg) {
    NV.material.color.set(NC[state.cg]);
    NV.position.set(state.grenHeld ? 0.02 : 0, state.grenHeld ? -0.02 : -0.05, state.grenHeld ? -0.05 : -0.15);
  }
  aimUpdate();
  animVM();
  flash.position.z = FZ[state.cw];
  const sc = state.scoped && !state.dead && state.WP.snp;
  const ads = state.scoped && !state.dead && !state.WP.snp && state.adsK > 0.4;
  const so = ads && !!curOpt();
  const oc = so ? state.owned[state.cw].opt : '';
  const mg = oc === 'x2' || oc === 'x4';
  {
    const sk = $('scope');
    sk.style.display = sc || mg ? 'block' : 'none';
    if (mg) {
      sk.className = 'op';
      sk.style.setProperty('--sr', oc === 'x4' ? '27vmin' : '33vmin');
    } else if (sk.className) {
      sk.className = '';
      sk.style.removeProperty('--sr');
    }
  }
  $('xh').style.display = sc || ads ? 'none' : ''; {
    const r = $('reti');
    const cl = so ? 'hud ' + oc : 'hud';
    if (r.className !== cl) {
      r.className = cl;
      r.style.display = so ? 'block' : 'none';
    }
  }
  state.kick = Math.max(0, state.kick - dt * 0.5);
  state.flashT = Math.max(0, state.flashT - dt);
  {
    const o = state.owned[state.cw];
    const t = curOpt() && o.opt;
    const vo = VMO[state.cw];
    if (vo) {
      for (const k of OPTK) {
        if (vo[k]) {
          vo[k].visible = k === t && state.adsK < 0.4;
        }
      }
    }
  }
  if (P.g) {
    state.bob += sp * dt * (1.35 + 0.75 * state.runK);
  }
  {
    const wk = Math.min(1, sp / 4) * (P.g ? 1 : 0) * (1 - state.runK) * (1 - state.adsK);
    const bs = Math.sin(state.bob * 2);
    const bc = Math.cos(state.bob);
    // walk: a small, slow sway.  run: the gun is lowered and angled across the body and bounces harder.  slide: tilted and dropped.
    gun.position.set(0.2 * (1 - state.adsK) - 0.075 * state.runK + bc * (0.0045 * wk + 0.013 * state.runK) + 0.03 * state.slK, -0.2 * (1 - state.adsK) - (TIP[state.cw] || 0.1) * state.adsK - 0.055 * state.runK - 0.07 * state.slK + bs * (0.006 * wk + 0.016 * state.runK), -0.45 + state.kick + 0.03 * state.runK - 0.02 * state.adsK);
    gun.rotation.set(-0.42 * state.runK + bs * 0.012 * state.runK - 0.1 * state.slK, 0.5 * state.runK + bc * 0.02 * state.runK, -0.3 * state.runK + bc * 0.02 * state.runK + 0.3 * state.slK + bs * 0.004 * wk);
  }
  flash.visible = state.flashT > 0;
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.t -= dt;
    if (f.max) {
      f.m.material.opacity = Math.max(0, f.t / f.max);
    }
    if (f.t <= 0) {
      scene.remove(f.m);
      fx.splice(i, 1);
    }
  }
  for (let i = ripples.length - 1; i >= 0; i--) {
    const q = ripples[i];
    q.t += dt;
    const k = q.t / 0.9;
    q.m.scale.setScalar(1 + k * 6);
    q.m.material.opacity = 0.7 * (1 - k);
    if (k >= 1) {
      scene.remove(q.m);
      ripples.splice(i, 1);
    }
  }
  waterMs.forEach((w, i) => {
    w.position.y = -0.05 + Math.sin(state.T * 1.3 + i * 2) * 0.02;
  });
  for (let i = shards.length - 1; i >= 0; i--) {
    const q = shards[i];
    q.t -= dt;
    q.vy -= 14 * dt;
    q.m.position.x += q.vx * dt;
    q.m.position.y += q.vy * dt;
    q.m.position.z += q.vz * dt;
    q.m.rotation.x += dt * 6;
    if (q.t <= 0) {
      scene.remove(q.m);
      shards.splice(i, 1);
    }
  }
  state.dmgFlash = Math.max(0, state.dmgFlash - dt * 1.6);
  state.hmT = Math.max(0, state.hmT - dt * 4);
  $('vg').style.opacity = String(state.dmgFlash * 0.8);
  state.fbang = Math.max(0, state.fbang - dt * 0.3);
  $('fb').style.opacity = String(Math.min(1, state.fbang * 1.4));
  $('hm').className = 'hud' + (state.hmT > 0.7 ? ' on' : '');
  $('hm').style.opacity = String(state.hmT > 0.7 ? 1 : state.hmT);
  const ppr = (innerHeight / 2) / Math.tan(cam.fov * Math.PI / 360);
  $('xh').style.setProperty('--g', (spread(sp) * ppr * 0.9 + 3).toFixed(1) + 'px');
  hudUpdate();
  drawCompass();
  state.ddT = Math.max(0, state.ddT - dt);
  $('dd').style.opacity = String(Math.min(1, state.ddT * 1.4));

  brHud();
  $('prompt').innerHTML = promptText();
  // The main menu covers the screen with its own backdrop, so the 3D scene is not drawn behind it.
  if (!state.inMenu) {
    ren.render(scene, cam);
  }
}
