import { bots } from '../bots';
import { ZONE_STAGES, pickupPrompt, zone } from '../br/zone';
import { byId, ctx2d } from '../dom';
import { grenadeThrow, grenadeCount } from '../grenades';
import { bigBg, bigMapOpen, drawMap, miniBg, MINIMAP_SIZE } from './minimap';
import { currentOptic, carriedGuns, loadout } from '../loadout';
import { playerBody, player } from '../player';
import { GRENADE_NAMES, WEAPONS } from '../weapons';
import { BOT_COUNT } from '../config';
import { simTime } from '../sim';
import { terrain } from '../world/level';
import { phase, phaseEnd } from '../match';
import type { GrenadeId } from '../types';

/** Grenade selected, or the pickup and door prompt (HTML). */
export const promptText = () => {
  if (player.dead) {
    return '';
  }

  if (loadout.grenade) {
    return GRENADE_NAMES[loadout.grenade]
      + ' ready – hold click to aim, release to throw · Right-click: '
      + (grenadeThrow.lob ? 'far throw' : 'short toss');
  }

  return pickupPrompt;
};

/** Adds a line to the kill feed for 4 s. */

export const feedMessage = (t: string) => {
  const d = document.createElement('div');

  d.textContent = t;
  byId('kf').appendChild(d);
  setTimeout(() => d.remove(), 4000);
};

const PLAYER_ICON = '<svg width="22" height="22" viewBox="0 0 20 20">'
  + '<circle cx="10" cy="6" r="4" fill="currentColor"/>'
  + '<path d="M2 19c0-5 3-8 8-8s8 3 8 8z" fill="currentColor"/></svg>';
let miniCtx: CanvasRenderingContext2D | null = null;

/** Seconds as m:ss. */
const formatTime = (s: number) => {
  const v = Math.max(0, Math.ceil(s));

  return Math.floor(v / 60) + ':' + ('0' + v % 60).slice(-2);
};

/** Weapon class icons (SVG paths): pistol, SMG, rifle, shotgun, sniper, knife. */
const CLASS_ICONS: Record<string, string> = {
  p: 'M10 12h62v9H60l-3 14H46l3-14H34l-3 5H10z',
  s: 'M6 14h74v8H66l-2 14h-9l2-14H44l-2 12h-8l2-12H6z M80 16h30v4H80z',
  r: 'M4 16h40l6-4h30l4 3h30v5H84l-4 3H58l-2 12h-9l1-12H20l-6 7H4z',
  g: 'M4 18h100v5H60v4H40v-4H4z M50 23h14v8H50z',
  n: 'M2 20h104v4H70l-6 4H44l-4 10h-8l3-10H18l-4 3H2z M40 12h30v4H40z',
  k: 'M18 29L76 13l8 2-6 7-58 9z M12 29h10v6H12z',
};
const WEAPON_CLASS: Record<string, string> = {
  pistol: 'p',
  glock: 'p',
  deagle: 'p',
  mp5: 's',
  p90: 's',
  rifle: 'r',
  m4: 'r',
  m3: 'g',
  awp: 'n',
  scout: 'n',
  svd: 'n',
  g3: 'n',
  kar: 'n',
  m82: 'n',
  knife: 'k',
};
let lastWeaponKey: string | null = null;
let lastChips = '';
let compassCtx: CanvasRenderingContext2D | null = null;

export const updateHud = () => {
  byId('hpf').style.width = Math.max(0, Math.min(100, player.health)) + '%';
  byId('hpn').textContent = String(Math.ceil(player.health));
  byId('arf').style.width = Math.max(0, Math.min(100, player.armor)) + '%';
  byId('arn').textContent = String(Math.ceil(player.armor));
  byId('hp').classList.toggle('low', player.health < 30 && !player.dead);

  const wk = loadout.weaponId + (currentOptic() ? loadout.owned[loadout.weaponId].optic : '');

  if (lastWeaponKey !== wk) {
    lastWeaponKey = wk;
    byId('wname').textContent = loadout.weapon.name + (currentOptic() ? ' · ' + currentOptic()!.shortName : '');
    byId('wicop').setAttribute('d', CLASS_ICONS[WEAPON_CLASS[loadout.weaponId] || 'r']);
  }

  const mel = !!loadout.weapon.melee;

  byId('mag').textContent = mel ? '—' : String(loadout.ammo);
  byId('rsv').textContent = mel ? '' : '/ ' + loadout.reserve;
  byId('rlt').textContent = loadout.reloading
    ? 'RELOADING'
    : (loadout.weapon.boltAction && simTime < loadout.boltCycleEnd ? 'CHAMBERING' : '');

  const gk = carriedGuns();
  let h = '';

  for (const k of gk) {
    h += '<span class="chip'
      + (k === loadout.weaponId && !loadout.grenade ? ' on' : '')
      + '"><i>'
      + (gk.indexOf(k) + 1)
      + '</i>'
      + WEAPONS[k].name
      + '</span>';
  }

  if (loadout.owned.knife) {
    h += '<span class="chip'
      + (loadout.weaponId === 'knife' && !loadout.grenade ? ' on' : '')
      + '"><i>3</i>Knife</span>';
  }

  ([['he', 'HE', 4], ['fl', 'FL', 5], ['sm', 'SM', 6]] as [GrenadeId, string, number][]).forEach(([k, n, i]) => {
    if (grenadeCount[k] > 0) {
      h += '<span class="chip'
        + (loadout.grenade === k ? ' on' : '')
        + '"><i>'
        + i
        + '</i>'
        + n
        + ' ×'
        + grenadeCount[k]
        + '</span>';
    }
  });

  if (h !== lastChips) {
    byId('chips').innerHTML = h;
    lastChips = h;
  }
};

export const drawCompass = () => {
  const c = byId<HTMLCanvasElement>('cmp');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = 460;
  const Hh = 34;

  if (!compassCtx || c.width !== W * dpr) {
    c.width = W * dpr;
    c.height = Hh * dpr;
    compassCtx = ctx2d(c);
  }

  const x = compassCtx;

  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, W, Hh);
  x.fillStyle = 'rgba(12,16,20,.7)';
  x.fillRect(0, 0, W, Hh);

  const hdg = ((-player.yaw * 180 / Math.PI) % 360 + 360) % 360;
  const span = 100;
  const ppd = W / span;
  const NAMES: Record<number, string> = {
    0: 'N',
    45: 'NE',
    90: 'E',
    135: 'SE',
    180: 'S',
    225: 'SW',
    270: 'W',
    315: 'NW',
  };

  x.textAlign = 'center';
  x.textBaseline = 'middle';

  for (let d = Math.ceil((hdg - span / 2) / 5) * 5; d <= hdg + span / 2; d += 5) {
    const px = W / 2 + (d - hdg) * ppd;
    const dg = ((d % 360) + 360) % 360;

    if (dg % 45 === 0) {
      x.fillStyle = dg === 0 ? '#ff6a5a' : '#fff';
      x.font = '700 17px Rajdhani, Arial Narrow, sans-serif';
      x.fillText(NAMES[dg], px, 15);
    } else if (dg % 15 === 0) {
      x.fillStyle = 'rgba(255,255,255,.75)';
      x.font = '600 12px Rajdhani, Arial Narrow, sans-serif';
      x.fillText(String(dg), px, 12);
      x.fillRect(px - 0.5, 23, 1, 6);
    } else {
      x.fillStyle = 'rgba(255,255,255,.4)';
      x.fillRect(px - 0.5, 25, 1, 4);
    }
  }

  if (terrain && zone.radius < 900) {
    const bz = Math.atan2(zone.cx - playerBody.x, -(zone.cz - playerBody.z)) * 180 / Math.PI;
    const rel = ((bz - hdg + 540) % 360) - 180;
    const mx = W / 2 + Math.max(-span / 2 + 2, Math.min(span / 2 - 2, rel)) * ppd;
    const edge = Math.abs(rel) > span / 2 - 2;

    x.fillStyle = Math.hypot(zone.cx - playerBody.x, zone.cz - playerBody.z) > zone.radius ? '#ff7a6a' : '#ffd24a';
    x.beginPath();
    x.moveTo(mx, edge ? 17 : 21);
    x.lineTo(mx + 6, edge ? 23 : 27);
    x.lineTo(mx, edge ? 29 : 33);
    x.lineTo(mx - 6, edge ? 23 : 27);
    x.closePath();
    x.fill();
  }

  x.fillStyle = 'rgba(12,16,20,.9)';
  x.fillRect(0, 0, 22, Hh);
  x.fillRect(W - 22, 0, 22, Hh);
  x.fillStyle = 'rgba(12,16,20,.5)';
  x.fillRect(22, 0, 16, Hh);
  x.fillRect(W - 38, 0, 16, Hh);
  x.fillStyle = '#f2b134';
  x.beginPath();
  x.moveTo(W / 2 - 6, 0);
  x.lineTo(W / 2 + 6, 0);
  x.lineTo(W / 2, 8);
  x.closePath();
  x.fill();
};

/** Battle Royale HUD: player count, minimap, big map and zone strip (shown once the island is loaded). */
export const mapHud = () => {
  document.body.classList.toggle('br', !!terrain);

  if (!terrain) {
    return;
  }

  const alive = bots.filter(b => b.health > 0).length + (player.dead ? 0 : 1);

  byId('pcount').innerHTML = PLAYER_ICON + alive + ' / ' + (BOT_COUNT + 1);

  const hdr = phase === 'start'
    ? 'Match starts in ' + Math.max(0, Math.ceil(phaseEnd - simTime)) + ' s'
    : zone.phase === 'hold'
      ? 'Zone ' + zone.stage + '/' + ZONE_STAGES.length + ' · shrinks in ' + formatTime(zone.timeLeft)
      : zone.phase === 'shrink'
        ? 'Zone ' + zone.stage + '/' + ZONE_STAGES.length + ' · shrinking, ' + formatTime(zone.timeLeft) + ' left'
        : 'Final zone';

  byId('mmh').textContent = hdr;

  // ----- mini map
  const c = byId<HTMLCanvasElement>('mmc');
  const dpr = Math.min(devicePixelRatio || 1, 2);

  if (!miniCtx || c.width !== MINIMAP_SIZE * dpr) {
    c.width = c.height = MINIMAP_SIZE * dpr;
    miniCtx = ctx2d(c);
  }

  miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  miniCtx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
  drawMap(miniCtx, MINIMAP_SIZE, miniBg);

  const T = terrain!;
  const rg = T.region(playerBody.x, playerBody.z);

  if (bigMapOpen && bigBg) {
    const bc = byId<HTMLCanvasElement>('bmc');
    const S = bigBg.size;

    if (bc.width !== S) {
      bc.width = S;
      bc.height = S;
    }

    const bx = ctx2d(bc);

    bx.setTransform(1, 0, 0, 1, 0, 0);
    bx.clearRect(0, 0, S, S);
    drawMap(bx, S, bigBg);
    byId('bmt').textContent = hdr
      + '   ·   You are in: '
      + (rg === 255 ? 'open sea' : T.regions[rg].name)
      + '   ·   M to close';
  }

  // ----- zone strip (one line): time left, the safe area along the line from you to its centre, and the distance to
  // its edge
  {
    const ph = phase === 'start' ? 'start' : zone.phase;
    const tl = ph === 'start' ? Math.max(0, phaseEnd - simTime) : zone.timeLeft;
    const ti = Math.max(0, Math.ceil(tl));

    const p2 = (n: number) => ('0' + n).slice(-2);

    byId('ztv').textContent = ph === 'final' ? '--:--' : p2(Math.floor(ti / 60)) + ':' + p2(ti % 60);
    byId('ztv').style.color = ph === 'shrink' ? '#ff7a6a' : '#fff';
  }

  const dx = zone.cx - playerBody.x;
  const dz = zone.cz - playerBody.z;
  const dC = Math.hypot(dx, dz);
  const lo = dC - zone.radius;
  const hi = dC + zone.radius;
  const pad = Math.max(25, (hi - Math.min(lo, 0)) * 0.12);
  const a = Math.min(0, lo) - pad;
  const b = Math.max(0, hi) + pad;
  const W = b - a;

  const pc = (t: number) => Math.max(
    0,
    Math.min(100, (t - a) / W * 100),
  );

  const mw = 6;
  let sl = pc(lo);
  let sw = pc(hi) - sl;

  if (sw < mw) {
    sl = Math.max(0, Math.min(100 - mw, sl + sw / 2 - mw / 2));
    sw = mw;
  }

  byId('zsafe').style.left = sl + '%';
  byId('zsafe').style.width = sw + '%';
  byId('zrun').style.left = pc(0) + '%';
  {
    const out = dC > zone.radius;
    const d = Math.round(Math.abs(dC - zone.radius));
    const zd = byId('zdist');

    zd.textContent = d + 'm';
    zd.style.color = out ? '#ff8a7a' : '#fff';
  }
};
