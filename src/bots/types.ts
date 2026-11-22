import * as THREE from 'three';
import type { Pickup, Velocity, WeaponId } from '../types';

/** What a bot is doing. */
export enum BotMode {
  /** Walking between waypoints. */
  Roam = 'roam',
  /** Holding a high spot with a sniper rifle, scanning for targets. */
  Overwatch = 'overwatch',
  /** Shooting at the player. */
  Fight = 'fight',
  /** Running to (and hiding behind) cover from the player. */
  Cover = 'cover',
  /** Moving toward where it thinks the player is. */
  Hunt = 'hunt',
}

/** How a bot found out where the player is. */
export enum Alarm {
  /** It was hit (bullet, knife or grenade). */
  Hit = 'hit',
  /** A shot flew right past it. */
  NearMiss = 'nearMiss',
  /** It heard the player shoot. */
  Heard = 'heard',
}

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
  weaponId: WeaponId;
  /** Walk target. */
  targetX: number;
  targetZ: number;
  /** Seconds left of awareness of the player. */
  alert: number;
  mode: BotMode;
  /** When the current mode runs out (Overwatch, Cover and Hunt). */
  modeUntil: number;
  /** Where the bot believes the player is. */
  knownX: number;
  knownY: number;
  knownZ: number;
  /** Cover spot it runs to, and whether it has reached it. */
  coverX: number;
  coverZ: number;
  inCover: boolean;
  /** Last time it was shot at (hit or near miss), and last time it decided whether to take cover. */
  underFireAt: number;
  coverAt: number;
  /** Last time it heard the player shoot. */
  heardAt: number;
  /** Cached result of the last sight check, and when to check again. */
  sees: boolean;
  nextSightAt: number;
  /** Gun pickup it is walking to, the time it gives up on it, and when it next looks around for one. */
  lootTarget: Pickup | null;
  lootUntil: number;
  nextLootAt: number;
  /** When it next turns up with a better gun looted out of sight. */
  upgradeAt: number;
  /** Walking to a high spot to hold with a sniper rifle. */
  toOverwatch: boolean;
  /** Scope glint shown while it aims a sniper rifle at the player. */
  glint: THREE.Sprite;
  /** Next allowed shot time. */
  nextShotAt: number;
  /** Earliest time to shoot after spotting the player. */
  reactAt: number;
  /** Seconds spent not moving toward the target. */
  stuck: number;
  /** Heading it wants to face (rad); the body turns toward it at the difficulty's `turnRate`. */
  faceYaw: number;
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
