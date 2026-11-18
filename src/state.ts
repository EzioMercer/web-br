import { DIFF, WPN } from './weapons';
import type { Terrain } from './world/terrain';
import type {
  Box,
  Difficulty,
  Door,
  GrenadeId,
  MapBg,
  OwnedWeapon,
  Phase,
  Pickup,
  Vec2,
  Weapon,
  ZoneStage,
} from './types';

/**
 * Mutable game state shared between modules (formerly the top-level `let`s of the monolith).
 * Plain mutable object on purpose: it changes every simulation step.
 */
export const state = {
  // ---- island
  /** Player landing spot. */
  SPAWN: [0, 0] as Vec2,
  /** Minimap background. */
  MM: null as MapBg | null,
  /** Terrain of the island, null until the first match loads it. */
  TERR: null as Terrain | null,

  // ---- physics
  /** Box hit by the last `wallT` ray. */
  HB: null as Box | null,

  // ---- doors
  /** The door the E key would toggle. */
  doorFocus: null as Door | null,

  // ---- audio
  AC: undefined as AudioContext | undefined,
  stepVol: 0.6,

  // ---- grenades
  /** Right-click toggles a short lob instead of a far throw. */
  lob: false,
  grenHeld: false,

  // ---- viewmodel
  /** End of the bolt-cycle animation. */
  cycEnd: 0,
  /** End of the knife-slash animation. */
  slashEnd: 0,

  // ---- match settings
  D: DIFF.normal as Difficulty,
  /** Start time of the zone schedule. */
  brT0: 0,
  sensMul: 1,

  // ---- match
  phase: 'start' as Phase,
  /** End of the start countdown, or when the next match begins after one ends. */
  phaseEnd: 0,

  // ---- player
  hp: 100,
  armor: 0,
  /** Current eye height (m), eased between standing, crouching and sliding. */
  eye: 1.62,
  yaw: 0,
  pitch: 0,
  /** Recoil offsets. */
  punchP: 0,
  punchY: 0,
  dead: false,

  // ---- weapons
  cw: 'pistol',
  WP: WPN.pistol as Weapon,
  owned: { pistol: { mag: 12, res: 36 }, knife: { mag: 1, res: 0 } } as Record<string, OwnedWeapon>,
  mag: 12,
  res: 36,
  scoped: false,
  reloading: false,
  reloadEnd: 0,
  nextFire: 0,
  lastShot: -9,
  /** Shot number within the current spray. */
  shotIdx: 0,
  /** Selected grenade, if any. */
  cg: null as GrenadeId | null,

  // ---- input
  /** Fire button held. */
  mouse: false,
  /** Pointer locked and the simulation running. */
  playing: false,
  inMenu: true,
  wheelT: 0,

  // ---- movement
  wasCr: false,
  slideEnd: 0,
  slideT0: 0,
  slideCd: 0,
  slideDir: [0, 1] as Vec2,
  slideSp: 8,

  // ---- camera / gun animation
  /** Simulation time (s). */
  T: 0,
  kick: 0,
  flashT: 0,
  bob: 0,
  /** Run, slide and aim-down-sights blend factors, 0..1. */
  runK: 0,
  slK: 0,
  adsK: 0,
  /** Slide camera roll. */
  slR: 0,

  // ---- screen effects
  /** Flashbang whiteout. */
  fbang: 0,
  dmgFlash: 0,
  /** Hit marker timer. */
  hmT: 0,
  /** Damage direction indicator timer. */
  ddT: 0,

  // ---- zone and loot

  brZ: [] as ZoneStage[],
  /** Pickup that E would swap for. */
  brNear: null as Pickup | null,
  brPrompt: '',
  bigOpen: false,
  /** Big map background. */
  MMB: null as MapBg | null,
};
