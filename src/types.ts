import * as THREE from 'three';

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
  magSize: number;
  /** Seconds between shots. */
  fireInterval: number;
  damage: number;
  /** Recoil strength. */
  recoil: number;
  auto: boolean;
  /** Reload time (s). */
  reloadTime: number;
  /** Slot: 1 primary, 2 secondary, 3 melee. */
  slot: number;
  ammoType?: AmmoType;
  /** Pellets per shot (shotguns). */
  pellets?: number;
  boltAction?: boolean;
  /** Scoped field of view (degrees). */
  scopeFov?: number;
  sniper?: boolean;
  melee?: boolean;
}

export interface Difficulty {
  name: string;
  accuracy: number;
  reactionTime: number;
  damage: number;
  speed: number;
  health: number;
  fireDelay: number;
  viewAngle: number;
  memory: number;
}

/** Ammo (and optic) the player holds for one weapon. */
export interface OwnedWeapon {
  ammo: number;
  reserve: number;
  optic?: OpticId;
}

/** Axis-aligned collision box. */
export interface Box {
  min: Vec3;
  max: Vec3;
  /** Query stamp, so a ray tests each box once. */
  rayStamp?: number;
  /** Disabled: broken glass or an open door. */
  disabled?: boolean;
  glass?: boolean;
  /** Index into the glass list. */
  glassIndex?: number;
  door?: boolean;
}

export interface Door {
  box: Box;
  pivot: THREE.Group;
  baseAngle: number;
  axis: 'x' | 'z';
  swingDir: number;
  /** Current open amount, 0..1. */
  openAmount: number;
  /** Target open amount, 0 or 1. */
  target: number;
  x: number;
  z: number;
  y: number;
  reachSq: number;
  /** The player closed it: don't auto-open for them until they walk away. */
  closedByPlayer?: boolean;
}

/** Pickup kinds: weapon, armor, ammo, grenade, optic, health. */
export type PickupKind = 'weapon' | 'armor' | 'ammo' | 'grenade' | 'optic' | 'health';

export interface Pickup {
  mesh: THREE.Group;
  label: THREE.Sprite;
  x: number;
  z: number;
  y: number;
  kind: PickupKind;
  itemId: string | null;
  name: string;
  weaponState?: OwnedWeapon;
}

export interface Circle {
  cx: number;
  cz: number;
  radius: number;
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
  canvas: HTMLCanvasElement;
  /** Pixels per metre. */
  pxPerMetre: number;
  offset: number;
  size: number;
}

// ---- map data

/** Map box: centre x and z, width (along x), depth (along z), height, color, base y (default 0), no collision. */
export type MapBox = [
x: number,
z: number,
width: number,
depth: number,
height: number,
color: number,
y?: number,
noCollision?: boolean,
];

/** Glass pane: centre x and z, width, depth, height, base y. */
export type MapGlass = [x: number, z: number, width: number, depth: number, height: number, y: number];

/** Hinged door in a wall along `axis` at coordinate `wallAt`, centred at `center` along the wall. */
export interface MapDoor {
  axis: 'x' | 'z';
  wallAt: number;
  center: number;
  width: number;
  y: number;
  height: number;
  color: number;
}

/** Loot spawn: x, z, floor y, tier (1 common, 2 better). */
export type MapLoot = [x: number, z: number, y: number, tier: number];

/** Building footprint (for the minimap and placement checks): centre x and z, width, depth, kind. */
export type Footprint = [x: number, z: number, width: number, depth: number, kind: string];

/** Side a structure's door faces: south, north, east, west, or none. */
export type Face = 's' | 'n' | 'e' | 'w' | '-';

/** Stair tower, recorded so bots can climb it. */
export interface Stairwell {
  cx: number;
  cz: number;
  baseY: number;
  /** Lookout floor height above Y. */
  floorHeight: number;
  face: Face;
  /** Tread positions, bottom to top. */
  treads: Vec3[];
  /** Door position [x, z]. */
  door?: number[];
}

/** Something that moves and collides: the player or a bot. Position is at the feet. */
export interface Body {
  x: number;
  y: number;
  z: number;
  /** Height (default: standing height). */
  height?: number;
  /** On the ground. */
  onGround?: boolean;
}

export interface Velocity {
  x: number;
  y: number;
  z: number;
}

export interface Sphere {
  x: number;
  y: number;
  z: number;
  radius: number;
}
