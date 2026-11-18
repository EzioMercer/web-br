import type * as THREE from 'three';

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

/** Match phase: countdown before the drop, playing, or finished (a new match follows). */
export type Phase = 'start' | 'live' | 'over';
export type GrenadeId = 'he' | 'fl' | 'sm';
export type OpticId = 'rd' | 'ho' | 'x2' | 'x4';
/** Ammo type: pistol, SMG, rifle, shotgun, sniper, or none (knife). */
export type AmmoType = 'pst' | 'smg' | 'rif' | 'shl' | 'snp' | 'none';

export interface Weapon {
  name: string;
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

// ---- map data

/** Map box: centre x and z, width (along x), depth (along z), height, color, base y (default 0), no collision. */
export type MapBox = [x: number, z: number, w: number, d: number, h: number, col: number, y?: number, nc?: boolean];
/** Glass pane: centre x and z, width, depth, height, base y. */
export type MapGlass = [x: number, z: number, w: number, d: number, h: number, y: number];
/** Hinged door in a wall along `ax` at coordinate `c`, centred at `m` along the wall. */
export interface MapDoor {
  ax: 'x' | 'z';
  c: number;
  m: number;
  w: number;
  y: number;
  h: number;
  col: number;
}
/** Loot spawn: x, z, floor y, tier (1 common, 2 better). */
export type MapLoot = [x: number, z: number, y: number, tier: number];
/** Building footprint (for the minimap and placement checks): centre x and z, width, depth, kind. */
export type Footprint = [x: number, z: number, w: number, d: number, kind: string];
/** Side a structure's door faces: south, north, east, west, or none. */
export type Face = 's' | 'n' | 'e' | 'w' | '-';

/** Stair tower, recorded so bots can climb it. */
export interface Stairwell {
  cx: number;
  cz: number;
  Y: number;
  /** Lookout floor height above Y. */
  hf: number;
  face: Face;
  /** Tread positions, bottom to top. */
  tr: Vec3[];
  /** Door position [x, z]. */
  door?: number[];
}

/** Something that moves and collides: the player or a bot. Position is at the feet. */
export interface Body {
  x: number;
  y: number;
  z: number;
  /** Height (default: standing height). */
  h?: number;
  /** On the ground. */
  g?: boolean;
}

export interface Vel {
  x: number;
  y: number;
  z: number;
}

export interface Sphere {
  x: number;
  y: number;
  z: number;
  r: number;
}
