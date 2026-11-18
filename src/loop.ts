import { aimLabels } from './bots';
import { shotSpread } from './combat';
import { BASE_FOV, PLAYER_HEIGHT, SIM_STEP } from './config';
import { byId } from './dom';
import { transientFx, ripples, screenFx } from './effects';
import { updateAimPath, grenadeThrow } from './grenades';
import { mapHud, drawCompass, updateHud, promptText } from './hud/hud';
import { input, keys } from './input';
import { canAim, currentOptic, loadout, aimFov } from './loadout';
import { playerBody, player, playerVel } from './player';
import { camera, renderer, scene } from './render/renderer';
import { isSliding, simTime, tick } from './sim';
import { muzzleZ, heldGrenade, sightTip, viewModels, opticMeshes, animateViewModel, muzzleFlashMesh, gunRig } from './viewmodel';
import { GRENADE_COLORS, OPTIC_IDS } from './weapons';
import { shards } from './world/doors';
import { waterMeshes } from './world/level';

let lastFrame = performance.now();
let accumulator = 0;
/** Walk bob phase; run, slide and aim-down-sights blends (0..1); slide camera roll. */
let bobPhase = 0;
let runBlend = 0;
let slideBlend = 0;
let aimBlend = 0;
let slideRoll = 0;

/** Render loop: runs the fixed-step simulation, then updates the camera, viewmodel, effects and HUD. */
export function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (input.playing) {
    accumulator += dt;
    while (accumulator >= SIM_STEP) {
      tick(SIM_STEP);
      accumulator -= SIM_STEP;
    }
  }
  const sp = Math.hypot(playerVel.x, playerVel.z);
  const isSl = isSliding() && !player.dead;
  player.eyeHeight += ((isSl ? 0.78 : playerBody.height < PLAYER_HEIGHT ? 1.1 : 1.62) - player.eyeHeight) * Math.min(1, dt * 14);
  camera.position.set(playerBody.x, playerBody.y + player.eyeHeight - (player.dead ? 1.2 : 0), playerBody.z);
  slideRoll += ((isSl ? 0.06 : 0) - slideRoll) * Math.min(1, dt * 9);
  camera.rotation.set(player.pitch + player.recoilPitch, player.yaw + player.recoilYaw, player.dead ? 0.9 : slideRoll);
  const runNow = !!(keys.ShiftLeft && sp > 4.8 && playerBody.onGround && playerBody.height >= PLAYER_HEIGHT && !player.dead && !loadout.reloading && !loadout.grenade && !loadout.scoped && simTime - loadout.lastShotAt > 0.3 && !isSl);
  runBlend += ((runNow ? 1 : 0) - runBlend) * Math.min(1, dt * 7);
  slideBlend += ((isSl ? 1 : 0) - slideBlend) * Math.min(1, dt * 9);
  const adsT = loadout.scoped && !loadout.weapon.sniper && !loadout.reloading ? 1 : 0;
  aimBlend += (adsT - aimBlend) * Math.min(1, dt * 12);
  if (loadout.scoped && (!canAim() || loadout.grenade || player.dead)) {
    loadout.scoped = false;
  }
  aimLabels();
  const tf = loadout.scoped ? aimFov() : BASE_FOV + 4 * runBlend + 3 * slideBlend;
  if (Math.abs(camera.fov - tf) > 0.01) {
    camera.fov = tf;
    camera.updateProjectionMatrix();
  }
  gunRig.visible = !(loadout.scoped && (loadout.weapon.sniper || (currentOptic() && aimBlend > 0.4)));
  for (const k in viewModels) {
    viewModels[k].visible = k === loadout.weaponId && !loadout.grenade;
  }
  heldGrenade.visible = !!loadout.grenade;
  if (loadout.grenade) {
    heldGrenade.material.color.set(GRENADE_COLORS[loadout.grenade]);
    heldGrenade.position.set(grenadeThrow.held ? 0.02 : 0, grenadeThrow.held ? -0.02 : -0.05, grenadeThrow.held ? -0.05 : -0.15);
  }
  updateAimPath();
  animateViewModel();
  muzzleFlashMesh.position.z = muzzleZ[loadout.weaponId];
  const sc = loadout.scoped && !player.dead && loadout.weapon.sniper;
  const ads = loadout.scoped && !player.dead && !loadout.weapon.sniper && aimBlend > 0.4;
  const so = ads && !!currentOptic();
  const oc = so ? loadout.owned[loadout.weaponId].optic : '';
  const mg = oc === 'x2' || oc === 'x4';
  {
    const sk = byId('scope');
    sk.style.display = sc || mg ? 'block' : 'none';
    if (mg) {
      sk.className = 'op';
      sk.style.setProperty('--sr', oc === 'x4' ? '27vmin' : '33vmin');
    } else if (sk.className) {
      sk.className = '';
      sk.style.removeProperty('--sr');
    }
  }
  byId('xh').style.display = sc || ads ? 'none' : ''; {
    const r = byId('reti');
    const cl = so ? 'hud ' + oc : 'hud';
    if (r.className !== cl) {
      r.className = cl;
      r.style.display = so ? 'block' : 'none';
    }
  }
  screenFx.gunKick = Math.max(0, screenFx.gunKick - dt * 0.5);
  screenFx.muzzleFlash = Math.max(0, screenFx.muzzleFlash - dt);
  {
    const o = loadout.owned[loadout.weaponId];
    const t = currentOptic() && o.optic;
    const vo = opticMeshes[loadout.weaponId];
    if (vo) {
      for (const k of OPTIC_IDS) {
        if (vo[k]) {
          vo[k].visible = k === t && aimBlend < 0.4;
        }
      }
    }
  }
  if (playerBody.onGround) {
    bobPhase += sp * dt * (1.35 + 0.75 * runBlend);
  }
  {
    const wk = Math.min(1, sp / 4) * (playerBody.onGround ? 1 : 0) * (1 - runBlend) * (1 - aimBlend);
    const bs = Math.sin(bobPhase * 2);
    const bc = Math.cos(bobPhase);
    // walk: a small, slow sway.  run: the gun is lowered and angled across the body and bounces harder.  slide: tilted and dropped.
    gunRig.position.set(0.2 * (1 - aimBlend) - 0.075 * runBlend + bc * (0.0045 * wk + 0.013 * runBlend) + 0.03 * slideBlend, -0.2 * (1 - aimBlend) - (sightTip[loadout.weaponId] || 0.1) * aimBlend - 0.055 * runBlend - 0.07 * slideBlend + bs * (0.006 * wk + 0.016 * runBlend), -0.45 + screenFx.gunKick + 0.03 * runBlend - 0.02 * aimBlend);
    gunRig.rotation.set(-0.42 * runBlend + bs * 0.012 * runBlend - 0.1 * slideBlend, 0.5 * runBlend + bc * 0.02 * runBlend, -0.3 * runBlend + bc * 0.02 * runBlend + 0.3 * slideBlend + bs * 0.004 * wk);
  }
  muzzleFlashMesh.visible = screenFx.muzzleFlash > 0;
  for (let i = transientFx.length - 1; i >= 0; i--) {
    const f = transientFx[i];
    f.life -= dt;
    if (f.max) {
      f.mesh.material.opacity = Math.max(0, f.life / f.max);
    }
    if (f.life <= 0) {
      scene.remove(f.mesh);
      transientFx.splice(i, 1);
    }
  }
  for (let i = ripples.length - 1; i >= 0; i--) {
    const q = ripples[i];
    q.age += dt;
    const k = q.age / 0.9;
    q.mesh.scale.setScalar(1 + k * 6);
    q.mesh.material.opacity = 0.7 * (1 - k);
    if (k >= 1) {
      scene.remove(q.mesh);
      ripples.splice(i, 1);
    }
  }
  waterMeshes.forEach((w, i) => {
    w.position.y = -0.05 + Math.sin(simTime * 1.3 + i * 2) * 0.02;
  });
  for (let i = shards.length - 1; i >= 0; i--) {
    const q = shards[i];
    q.life -= dt;
    q.vy -= 14 * dt;
    q.mesh.position.x += q.vx * dt;
    q.mesh.position.y += q.vy * dt;
    q.mesh.position.z += q.vz * dt;
    q.mesh.rotation.x += dt * 6;
    if (q.life <= 0) {
      scene.remove(q.mesh);
      shards.splice(i, 1);
    }
  }
  screenFx.damageFlash = Math.max(0, screenFx.damageFlash - dt * 1.6);
  screenFx.hitMarker = Math.max(0, screenFx.hitMarker - dt * 4);
  byId('vg').style.opacity = String(screenFx.damageFlash * 0.8);
  screenFx.flashbang = Math.max(0, screenFx.flashbang - dt * 0.3);
  byId('fb').style.opacity = String(Math.min(1, screenFx.flashbang * 1.4));
  byId('hm').className = 'hud' + (screenFx.hitMarker > 0.7 ? ' on' : '');
  byId('hm').style.opacity = String(screenFx.hitMarker > 0.7 ? 1 : screenFx.hitMarker);
  const ppr = (innerHeight / 2) / Math.tan(camera.fov * Math.PI / 360);
  byId('xh').style.setProperty('--g', (shotSpread(sp) * ppr * 0.9 + 3).toFixed(1) + 'px');
  updateHud();
  drawCompass();
  screenFx.damageDir = Math.max(0, screenFx.damageDir - dt);
  byId('dd').style.opacity = String(Math.min(1, screenFx.damageDir * 1.4));

  mapHud();
  byId('prompt').innerHTML = promptText();
  // The main menu covers the screen with its own backdrop, so the 3D scene is not drawn behind it.
  if (!input.inMenu) {
    renderer.render(scene, camera);
  }
}
