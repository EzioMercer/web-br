import type * as THREE from 'three';

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export type GameMode = 'casual' | 'sniper' | 'arms' | 'br';
export type Phase = 'buy' | 'live' | 'over';
export type GrenadeId = 'he' | 'fl' | 'sm';
export type OpticId = 'rd' | 'ho' | 'x2' | 'x4';
/** Ammo type: pistol, SMG, rifle, shotgun, sniper, or none (knife). */
export type AmmoType = 'pst' | 'smg' | 'rif' | 'shl' | 'snp' | 'none';

export interface Weapon {
  name: string;
  cost: number;
  mag: number;
  res: number;
  /** Seconds between shots. */
  rate: number;
  dmg: number;
  /** Recoil strength. */
  rec: number;
  auto: boolean;
  /** Reload time (s). */
  rt: number;
  /** Slot: 1 primary, 2 secondary, 3 melee. */
  sl: number;
  at?: AmmoType;
  /** Pellets per shot (shotguns). */
  pel?: number;
  bolt?: boolean;
  /** Scoped field of view (degrees). */
  zoom?: number;
  snp?: boolean;
  melee?: boolean;
}

export interface Difficulty {
  n: string;
  acc: number;
  react: number;
  dmg: number;
  spd: number;
  hp: number;
  cool: number;
  fov: number;
  mem: number;
  hunt: number;
}

/** Ammo (and optic) the player holds for one weapon. */
export interface OwnedWeapon {
  mag: number;
  res: number;
  opt?: OpticId;
}

/** Axis-aligned collision box. */
export interface Box {
  min: Vec3;
  max: Vec3;
  /** Query stamp, so a ray tests each box once. */
  s?: number;
  /** Disabled: broken glass or an open door. */
  off?: boolean;
  glass?: boolean;
  /** Index into the glass list. */
  gi?: number;
  door?: boolean;
}

export interface Door {
  b: Box;
  g: THREE.Group;
  th0: number;
  ax: 'x' | 'z';
  sgn: number;
  /** Current open amount, 0..1. */
  a: number;
  /** Target open amount, 0 or 1. */
  tgt: number;
  t: number;
  x: number;
  z: number;
  y: number;
  r2: number;
  /** The player closed it: don't auto-open for them until they walk away. */
  lockP?: boolean;
}

/** Pickup kinds: weapon, armor, ammo, grenade, optic, health. */
export type PickupKind = 'w' | 'a' | 'm' | 'g' | 'o' | 'h';

export interface Pickup {
  m: THREE.Group;
  lab: THREE.Sprite;
  x: number;
  z: number;
  y: number;
  t: PickupKind;
  id: string | null;
  n: string;
  st?: OwnedWeapon;
}

export interface Circle {
  cx: number;
  cz: number;
  r: number;
}

export interface ZoneStage {
  /** Seconds the zone holds before shrinking. */
  hold: number;
  /** Seconds the shrink takes. */
  shrink: number;
  from: Circle;
  to: Circle;
}

/** A pre-rendered map background. */
export interface MapBg {
  c: HTMLCanvasElement;
  /** Pixels per metre. */
  k: number;
  o: number;
  S: number;
}
