import { bots } from '../bots/state';
import { ZONE_STAGES } from '../br/zone/constants';
import { zone } from '../br/zone/state';
import { BOT_COUNT } from '../config';
import { match } from '../match/state';
import { player, playerBody } from '../player/state';
import { clock } from '../sim/state';
import { byId } from '../utils/byId';
import { writeDom } from '../utils/dom/writeDom';
import { ctx2d } from '../utils/ctx2d';
import { formatTime } from '../utils/formatTime';
import { level } from '../world/level/state';
import { drawMap } from './minimap/drawMap';
import { maps, MINIMAP_SIZE } from './minimap/state';
import { pad2 } from '../utils/pad2';
import { Phase } from '../types';
import { ZonePhase } from '../br/zone/types';
import type { MapBg } from '../types';

const PLAYER_ICON = '<svg width="22" height="22" viewBox="0 0 20 20">'
  + '<circle cx="10" cy="6" r="4" fill="currentColor"/>'
  + '<path d="M2 19c0-5 3-8 8-8s8 3 8 8z" fill="currentColor"/></svg>';

let miniCtx: CanvasRenderingContext2D | null = null;

/** What the minimap and the big map last drew (see mapKey). */
let lastMapKey = '';

let lastBigKey = '';

let lastMini: MapBg | null = null;

let lastBig: MapBg | null = null;

/** Battle Royale HUD: player count, minimap, big map and zone strip (shown once the island is loaded). */
export const mapHud = () => {
  document.body.classList.toggle('br', Boolean(level.terrain));

  if (!level.terrain) {
    return;
  }

  const alive = bots.filter(b => b.health > 0).length + (player.dead ? 0 : 1);

  writeDom(byId('pcount'), 'html', PLAYER_ICON + alive + ' / ' + (BOT_COUNT + 1));

  const hdr = match.phase === Phase.Start
    ? 'Match starts in ' + Math.max(0, Math.ceil(match.phaseEnd - clock.time)) + ' s'
    : zone.phase === ZonePhase.Hold
      ? 'Zone ' + zone.stage + '/' + ZONE_STAGES.length + ' · shrinks in ' + formatTime(zone.timeLeft)
      : zone.phase === ZonePhase.Shrink
        ? 'Zone ' + zone.stage + '/' + ZONE_STAGES.length + ' · shrinking, ' + formatTime(zone.timeLeft) + ' left'
        : 'Final zone';

  writeDom(byId('mmh'), 'text', hdr);

  // ----- mini map
  const c = byId<HTMLCanvasElement>('mmc');
  const dpr = Math.min(devicePixelRatio || 1, 2);

  if (!miniCtx || c.width !== MINIMAP_SIZE * dpr) {
    c.width = c.height = MINIMAP_SIZE * dpr;
    miniCtx = ctx2d(c);
    lastMapKey = '';
  }

  // what the maps show: redrawn only when it changes (not while the player stands still with the zone holding)
  const nz = zone.next;
  const mapKey = playerBody.x + ',' + playerBody.z + ',' + player.yaw + ',' + zone.cx + ',' + zone.cz + ','
    + zone.radius + (nz ? ',' + nz.cx + ',' + nz.cz + ',' + nz.radius : '');

  if (mapKey !== lastMapKey || maps.mini !== lastMini) {
    lastMapKey = mapKey;
    lastMini = maps.mini;
    miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    miniCtx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
    drawMap(miniCtx, MINIMAP_SIZE, maps.mini);
  }

  const T = level.terrain!;
  const rg = T.region(playerBody.x, playerBody.z);

  if (maps.bigOpen && maps.big) {
    const bc = byId<HTMLCanvasElement>('bmc');
    const S = maps.big.size;

    if (bc.width !== S) {
      bc.width = S;
      bc.height = S;
      lastBigKey = '';
    }

    if (mapKey !== lastBigKey || maps.big !== lastBig) {
      const bx = ctx2d(bc);

      lastBigKey = mapKey;
      lastBig = maps.big;
      bx.setTransform(1, 0, 0, 1, 0, 0);
      bx.clearRect(0, 0, S, S);
      drawMap(bx, S, maps.big);
    }

    const where = rg === 255 ? 'open sea' : T.regions[rg].name;

    writeDom(byId('bmt'), 'text', hdr + '   ·   You are in: ' + where + '   ·   M to close');
  }

  // ----- zone strip (one line): time left, the safe area along the line from you to its centre, and the distance to
  // its edge
  {
    const ph = match.phase === Phase.Start ? Phase.Start : zone.phase;
    const tl = ph === Phase.Start ? Math.max(0, match.phaseEnd - clock.time) : zone.timeLeft;
    const ti = Math.max(0, Math.ceil(tl));

    writeDom(byId('ztv'), 'text', ph === ZonePhase.Final ? '--:--' : pad2(Math.floor(ti / 60)) + ':' + pad2(ti % 60));
    writeDom(byId('ztv'), 'color', ph === ZonePhase.Shrink ? '#ff7a6a' : '#fff');
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

  // whole tenths of a percent: finer steps are invisible and would rewrite the styles every frame
  writeDom(byId('zsafe'), 'left', sl.toFixed(1) + '%');
  writeDom(byId('zsafe'), 'width', sw.toFixed(1) + '%');
  writeDom(byId('zrun'), 'left', pc(0).toFixed(1) + '%');
  {
    const out = dC > zone.radius;
    const d = Math.round(Math.abs(dC - zone.radius));
    const zd = byId('zdist');

    writeDom(zd, 'text', d + 'm');
    writeDom(zd, 'color', out ? '#ff8a7a' : '#fff');
  }
};
