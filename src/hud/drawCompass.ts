import { zone } from '../br/zone/state';
import { player, playerBody } from '../player/state';
import { byId } from '../utils/byId';
import { ctx2d } from '../utils/ctx2d';
import { level } from '../world/level/state';

let compassCtx: CanvasRenderingContext2D | null = null;

/** What the compass last drew. */
let lastKey = '';

export const drawCompass = () => {
  const c = byId<HTMLCanvasElement>('cmp');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = 460;
  const Hh = 34;

  if (!compassCtx || c.width !== W * dpr) {
    c.width = W * dpr;
    c.height = Hh * dpr;
    compassCtx = ctx2d(c);
    lastKey = '';
  }

  // redrawn only when the heading or the zone marker changes
  const key = player.yaw + ',' + (level.terrain ? zone.cx + ',' + zone.cz + ',' + zone.radius : '') + ','
    + playerBody.x + ',' + playerBody.z;

  if (key === lastKey) {
    return;
  }

  lastKey = key;

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

  if (level.terrain && zone.radius < 900) {
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
