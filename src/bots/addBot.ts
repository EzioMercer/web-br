import * as THREE from 'three';
import { scene } from '../render/scene';
import { buildBotModel } from './buildBotModel';
import { makeGlint } from './makeGlint';
import { bots } from './state';
import { WeaponId } from '../types';
import { BotMode } from './types';
import type { Bot } from './types';

export const addBot = (i: number) => {
  const g = new THREE.Group();

  scene.add(g);

  const legs: THREE.Group[] = [];
  const knees: THREE.Group[] = [];
  const parts = buildBotModel(i, g, legs, knees);
  const glint = makeGlint();

  scene.add(glint);

  const b: Bot = {
    id: i,
    name: 'Bot ' + (i + 1),
    mesh: g,
    legs,
    knees,
    ...parts,
    labelUntil: 0,
    x: 0,
    y: 0,
    z: 0,
    onGround: true,
    vel: { x: 0, y: 0, z: 0 },
    health: 100,
    weaponId: WeaponId.Ak47,
    targetX: 0,
    targetZ: 0,
    alert: 0,
    mode: BotMode.Roam,
    modeUntil: 0,
    knownX: 0,
    knownY: 0,
    knownZ: 0,
    coverX: 0,
    coverZ: 0,
    inCover: false,
    underFireAt: 0,
    coverAt: 0,
    heardAt: -9,
    sees: false,
    nextSightAt: 0,
    toOverwatch: false,
    lootTarget: null,
    lootUntil: 0,
    nextLootAt: 0,
    upgradeAt: 0,
    glint,
    nextShotAt: 0,
    reactAt: 0,
    stuck: 0,
    faceYaw: 0,
    blindUntil: 0,
    running: false,
    detourUntil: 0,
    detourDir: 1,
    walkPhase: 0,
    crouch: 0,
    crouchAmount: 0,
    nextCrouchAt: 0,
    stepDist: 0,
    corpse: false,
    corpseUntil: 0,
    fallY: 0,
    fallVel: 0,
  };

  bots.push(b);
};
