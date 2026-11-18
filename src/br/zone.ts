import * as THREE from 'three';
import { bots } from '../bots';
import { clearPickups, looting, spawnPickup, pickups, takePickup } from './pickups';
import { layBodyDown } from '../combat';
import { grenadeCount } from '../grenades';
import { carriedGuns, loadout, opticTarget } from '../loadout';
import { endMatch } from '../match';
import { isFreeSpot } from '../physics';
import { damagePlayer, playerBody, player } from '../player';
import { scene } from '../render/renderer';
import { LOOT_TIER1, LOOT_TIER2, OPTICS, WEAPONS } from '../weapons';
import { getIsland, terrain } from '../world/level';
import { ISLAND_HALF } from '../world/terrain';
import { simTime } from '../sim';
import { focusedDoor } from '../world/doors';
import type { Circle, GrenadeId, OpticId, PickupKind, Vec2, ZoneStage } from '../types';

type ZonePhase = 'hold' | 'shrink' | 'final';

/** The current safe zone, its schedule phase, stage number, seconds left in the phase and the next circle. */
export const zone: Circle & { phase: ZonePhase; stage: number; timeLeft: number; next: Circle | null } = { cx: 0, cz: 0, radius: 999, phase: 'final', stage: 0, timeLeft: 0, next: null };
/** Pickup or door prompt for the HUD. */
export let pickupPrompt = '';
let zoneStartTime = 0;
let stages: ZoneStage[] = [];
/** Zone stages: hold seconds, shrink seconds, radius as a fraction of the start radius. */
export const ZONE_STAGES: [number, number, number][] = [[75, 70, 0.55], [55, 60, 0.36], [45, 50, 0.22], [35, 40, 0.12], [30, 35, 0.05]];
export const zoneMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 420, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x3a7bff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
zoneMesh.visible = false;
scene.add(zoneMesh);

/** A random clear, dry, flat spot on the island, at least `minD` from the player if `fromP`. */
function landingSpot(minD: number, fromP: boolean): Vec2 {
  const T = terrain!;
  for (let i = 0; i < 300; i++) {
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * 330;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (T.height(x, z) > 2 && T.slope(x, z) < 0.35 && [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]].every(([p, q]) => isFreeSpot(x + p, z + q)) && (!fromP || Math.hypot(x - playerBody.x, z - playerBody.z) > minD)) {
      return [x, z];
    }
  }
  return [0, 0];
}

export function botDropSpot() {
  return landingSpot(110, true);
}

/** Plans the zone schedule and scatters the loot. Returns the player's landing spot. */
export function startZone(): Vec2 {
  clearPickups();
  const spawnAt = landingSpot(0, false);
  const R0 = ISLAND_HALF * 1.5;
  stages = [];
  let pv: Circle = { cx: 0, cz: 0, radius: R0 };
  for (const [hold, shrink, f] of ZONE_STAGES) {
    const r = R0 * f;
    let to: Circle = pv;
    for (let k = 0; k < 60; k++) {
      const a = Math.random() * 6.283;
      const dd = Math.random() * (pv.radius - r) * 0.85;
      const cx = pv.cx + Math.cos(a) * dd;
      const cz = pv.cz + Math.sin(a) * dd;
      if (k === 59 || terrain!.height(cx, cz) > 1.5) {
        to = { cx, cz, radius: r };
        break;
      }
    }
    stages.push({ hold, shrink, from: pv, to });
    pv = to;
  }
  zone.cx = 0;
  zone.cz = 0;
  zone.radius = R0;
  zoneStartTime = 0;
  applyZonePhase(0);
  const AT = ['pst', 'smg', 'rif', 'shl', 'snp'];
  const GI: GrenadeId[] = ['he', 'fl', 'sm'];
  const OI: OpticId[] = ['rd', 'rd', 'rd', 'ho', 'ho', 'x2', 'x2', 'x4'];
  for (const [x, z, y, tier] of getIsland().loot) {
    if (Math.random() > 0.74) {
      continue;
    }
    const r = Math.random();
    const t2 = tier >= 2;
    const t: PickupKind = r < (t2 ? 0.40 : 0.26) ? 'weapon' : r < (t2 ? 0.58 : 0.50) ? 'ammo' : r < (t2 ? 0.68 : 0.58) ? 'armor' : r < (t2 ? 0.76 : 0.70) ? 'health' : r < (t2 ? 0.90 : 0.82) ? 'optic' : 'grenade';
    spawnPickup(x, z, t, t === 'weapon' ? (t2 ? LOOT_TIER2 : LOOT_TIER1)[Math.random() * (t2 ? LOOT_TIER2 : LOOT_TIER1).length | 0] : t === 'ammo' ? AT[Math.random() * AT.length | 0] : t === 'grenade' ? GI[Math.random() * 3 | 0] : t === 'optic' ? OI[Math.random() * 8 | 0] : null, undefined, y);
  }
  return spawnAt;
}

function phaseAt(t: number): { phase: ZonePhase; stage: number; timeLeft: number; next: Circle | null } {
  let acc = 0;
  for (let i = 0; i < stages.length; i++) {
    const q = stages[i];
    if (t < acc + q.hold) {
      return { phase: 'hold', stage: i + 1, timeLeft: acc + q.hold - t, next: q.to };
    }
    if (t < acc + q.hold + q.shrink) {
      return { phase: 'shrink', stage: i + 1, timeLeft: acc + q.hold + q.shrink - t, next: q.to };
    }
    acc += q.hold + q.shrink;
  }
  return { phase: 'final', stage: stages.length, timeLeft: 0, next: null };
}

function applyZonePhase(t: number) {
  const zp = phaseAt(t);
  zone.phase = zp.phase;
  zone.stage = zp.stage;
  zone.timeLeft = zp.timeLeft;
  zone.next = zp.next;
}

export function zoneTick(dt: number) {
  if (!zoneStartTime) {
    zoneStartTime = simTime;
  }
  const t = simTime - zoneStartTime;
  let acc = 0;
  let z: Circle | null = null;
  let st = 0;
  for (let i = 0; i < stages.length; i++) {
    const q = stages[i];
    st = i;
    if (t < acc + q.hold) {
      z = q.from;
      break;
    }
    if (t < acc + q.hold + q.shrink) {
      const u = (t - acc - q.hold) / q.shrink;
      z = { cx: q.from.cx + (q.to.cx - q.from.cx) * u, cz: q.from.cz + (q.to.cz - q.from.cz) * u, radius: q.from.radius + (q.to.radius - q.from.radius) * u };
      break;
    }
    acc += q.hold + q.shrink;
  }
  if (!z) {
    z = stages[stages.length - 1].to;
  }
  zone.cx = z.cx;
  zone.cz = z.cz;
  zone.radius = z.radius;
  applyZonePhase(t);
  zoneMesh.position.set(z.cx, 150, z.cz);
  zoneMesh.scale.set(z.radius, 1, z.radius);
  const dps = 1.5 + st * 1.5;
  if (!player.dead && Math.hypot(playerBody.x - z.cx, playerBody.z - z.cz) > z.radius) {
    damagePlayer(dps * dt, null, true);
  }
  for (const b of bots) {
    if (b.health > 0 && Math.hypot(b.x - z.cx, b.z - z.cz) > z.radius) {
      b.health -= dps * dt * 0.5;
      if (b.health <= 0 && !b.corpse) {
        layBodyDown(b);
      }
    }
  }
  pickupPrompt = '';
  looting.swapTarget = null;
  let nd = 2.2;
  let hint = '';
  for (let i = pickups.length - 1; i >= 0; i--) {
    const k = pickups[i];
    k.mesh.rotation.y += dt * 2;
    const d = Math.hypot(playerBody.x - k.x, playerBody.z - k.z);
    k.label.visible = d < 18;
    k.mesh.visible = d < 170;
    if (player.dead || d > 2.2 || Math.abs(playerBody.y - k.y) > 2) {
      continue;
    }
    let ok = false;
    if (k.kind === 'weapon') {
      if (carriedGuns().length < 2 || loadout.owned[k.itemId!]) {
        ok = true;
      } else if (d < nd) {
        looting.swapTarget = k;
        nd = d;
      }
    } else if (k.kind === 'optic') {
      const tg = opticTarget();
      if (!tg) {
        hint = 'Optics fit rifles, SMGs and shotguns – not pistols or snipers';
      } else if (!loadout.owned[tg].optic) {
        ok = true;
      } else if (d < nd) {
        looting.swapTarget = k;
        nd = d;
      }
    } else if (k.kind === 'armor') {
      ok = player.armor < 100;
    } else if (k.kind === 'ammo') {
      ok = Object.keys(loadout.owned).some(q => WEAPONS[q].ammoType === k.itemId);
    } else if (k.kind === 'grenade') {
      ok = grenadeCount[k.itemId as GrenadeId] < 2;
    } else {
      ok = player.health < 100;
    }
    if (ok) {
      takePickup(k);
      scene.remove(k.mesh);
      pickups.splice(i, 1);
    }
  }
  if (looting.swapTarget) {
    pickupPrompt = looting.swapTarget.kind === 'optic' ? 'Press E to swap ' + OPTICS[loadout.owned[opticTarget()!].optic!].name + ' for ' + looting.swapTarget.name : 'Press E to swap ' + WEAPONS[loadout.weaponId !== 'knife' ? loadout.weaponId : carriedGuns()[1]].name + ' for ' + looting.swapTarget.name;
  } else if (hint) {
    pickupPrompt = hint;
  } else if (focusedDoor && !loadout.grenade) {
    pickupPrompt = 'Press E to ' + (focusedDoor.target ? 'close' : 'open') + ' the door';
  }
  if (player.dead) {
    endMatch(false);
  } else if (bots.every(b => b.health <= 0)) {
    endMatch(true);
  }
}
