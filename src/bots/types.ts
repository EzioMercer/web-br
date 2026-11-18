import * as THREE from 'three';
import type { Velocity } from '../types';

export interface Bot {
  id: number;
  name: string;
  mesh: THREE.Group;
  /** Upper body, legs and knees, animated when walking and crouching. */
  upperBody: THREE.Group;
  legs: THREE.Group[];
  knees: THREE.Group[];
  gunGroup: THREE.Group;
  /** Name label: canvas, texture and sprite. */
  labelCanvas: HTMLCanvasElement;
  labelTexture: THREE.CanvasTexture;
  labelSprite: THREE.Sprite;
  /** Label visible until this time. */
  labelUntil: number;
  x: number;
  y: number;
  z: number;
  onGround: boolean;
  height?: number;
  vel: Velocity;
  health: number;
  /** Weapon id. */
  weaponId: string;
  /** Walk target. */
  targetX: number;
  targetZ: number;
  /** Seconds left of awareness of the player. */
  alert: number;
  /** Next allowed shot time. */
  nextShotAt: number;
  /** Earliest time to shoot after spotting the player. */
  reactAt: number;
  /** Seconds spent not moving toward the target. */
  stuck: number;
  /** Blinded by a flashbang until this time. */
  blindUntil: number;
  /** Running for the Battle Royale zone. */
  running: boolean;
  /** Sidestep around an obstacle until `detourUntil`, turning by sign `detourDir`. */
  detourUntil: number;
  detourDir: number;
  /** Walk phase, crouch target (0/1), crouch amount and next crouch decision time. */
  walkPhase: number;
  crouch: number;
  crouchAmount: number;
  nextCrouchAt: number;
  /** Distance since the last footstep. */
  stepDist: number;
  /** Lying dead: falls from height `fallY` at speed `fallVel`, hidden at `corpseUntil`. */
  corpse: boolean;
  corpseUntil: number;
  fallY: number;
  fallVel: number;
}
