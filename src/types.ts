import * as THREE from 'three';

export type Vec2 = [number, number];

export type Vec3 = [number, number, number];

/** Match phase: countdown before the drop, playing, or finished (a new match follows). */
/** Horizontal axis a wall, door or bridge runs along. */
export enum Axis {
  X = 'x',
  Z = 'z',
}

/** Weapon id (the key of the weapon table). */
export enum WeaponId {
  Usp = 'pistol',
  Glock18 = 'glock',
  DesertEagle = 'deagle',
  M3 = 'm3',
  Mp5 = 'mp5',
  P90 = 'p90',
  Ak47 = 'rifle',
  M4a1 = 'm4',
  Awp = 'awp',
  Scout = 'scout',
  Svd = 'svd',
  G3sg1 = 'g3',
  Kar98k = 'kar',
  BarrettM82 = 'm82',
  Knife = 'knife',
}

/** What a building footprint is, for the minimap and placement checks. */
export enum FootprintKind {
  House = 'house',
  Villa = 'villa',
  Shop = 'shop',
  Mall = 'mall',
  CarPark = 'carpark',
  Warehouse = 'warehouse',
  Tower = 'tower',
  Lookout = 'lookout',
  FortTower = 'fortTower',
  Lighthouse = 'lighthouse',
  Containers = 'containers',
  Plaza = 'plaza',
  Smokestack = 'stack',
  Tank = 'tank',
  Silo = 'silo',
  Paddock = 'paddock',
  Mill = 'mill',
  WaterTower = 'wtower',
  Well = 'well',
  Runway = 'runway',
  GasStation = 'gas',
}

export enum Phase {
  Start = 'start',
  Live = 'live',
  Over = 'over',
}

export enum GrenadeId {
  HighExplosive = 'he',
  Flashbang = 'fl',
  Smoke = 'sm',
}

export enum OpticId {
  RedDot = 'rd',
  Holographic = 'ho',
  Scope2x = 'x2',
  Scope4x = 'x4',
}

/** Ammo type: pistol, SMG, rifle, shotgun, sniper, or none (knife). */
export enum AmmoType {
  Pistol = 'pst',
  Smg = 'smg',
  Rifle = 'rif',
  Shotgun = 'shl',
  Sniper = 'snp',
  None = 'none',
}

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
  /**
   * Effective range (m) in a bot's hands: its hit chance halves at this distance, and it holds fire beyond 2.5 times
   * it (420 m at most).
   */
  range: number;
  /** Muzzle velocity of the player's bullets (m/s): far targets need leading, and bullets drop over distance. */
  bulletSpeed: number;
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
/** A gun carried (or lying on the ground): rounds in its magazine and its optic. Spare rounds are in the ammo bag. */
export interface OwnedWeapon {
  ammo: number;
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
  axis: Axis;
  /** Hinged end of the opening: -1 the low end, +1 the high end (along the wall). */
  hinge: number;
  /** Side it swings to: -1 or +1 along the wall normal (+z for a wall along x, +x for a wall along z). */
  side: number;
  /** How far it may swing toward the -normal and +normal side before it would hit something, 0..1 of 90 degrees. */
  maxOpen: [number, number];
  /** Current open amount, 0..1 of `maxOpen` on its side. */
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
export enum PickupKind {
  Weapon = 'weapon',
  Armor = 'armor',
  Ammo = 'ammo',
  Grenade = 'grenade',
  Optic = 'optic',
  Health = 'health',
}

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
  axis: Axis;
  wallAt: number;
  center: number;
  width: number;
  y: number;
  height: number;
  color: number;
  /** Hinged end of the opening: -1 the low end (default), +1 the high end. Set by `fitDoors`. */
  hinge?: number;
  /** How far the door may open toward the -normal and +normal side, 0..1 of 90 degrees. Set by `fitDoors`. */
  open?: [number, number];
}

/** Loot spawn: x, z, floor y, tier (1 common, 2 better). */
export type MapLoot = [x: number, z: number, y: number, tier: number];

/** Building footprint (for the minimap and placement checks): centre x and z, width, depth, kind. */
export type Footprint = [x: number, z: number, width: number, depth: number, kind: FootprintKind];

/** Side a structure's door faces: south, north, east, west, or none. */
export enum Face {
  South = 's',
  North = 'n',
  East = 'e',
  West = 'w',
  None = '-',
}

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

/** Weapon class, for HUD icons and the inventory. */
export enum WeaponClass {
  Pistol = 'p',
  Smg = 's',
  Rifle = 'r',
  Shotgun = 'g',
  Sniper = 'n',
  Knife = 'k',
}
