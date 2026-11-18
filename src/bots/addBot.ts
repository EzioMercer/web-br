import * as THREE from 'three';
import { scene } from '../render/scene';
import { buildBotModel } from './buildBotModel';
import { bots } from './state';
import type { Bot } from './types';

export const addBot = (i: number) => {
  const g = new THREE.Group();

  scene.add(g);

  const legs: THREE.Group[] = [];
  const knees: THREE.Group[] = [];
  const parts = buildBotModel(i, g, legs, knees);
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
    weaponId: 'rifle',
    targetX: 0,
    targetZ: 0,
    alert: 0,
    nextShotAt: 0,
    reactAt: 0,
    stuck: 0,
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
