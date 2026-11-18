import { zone } from '../../br/zone/state';
import { player, playerBody } from '../../player/state';
import { level } from '../../world/level/state';
import type { MapBg } from '../../types';

/** Draws the map background, the zone and the player's position and view cone. */
export const drawMap = (x: CanvasRenderingContext2D, Sd: number, bg: MapBg | null) => {
  const half = level.terrain!.half;
  const k = Sd / (2 * half);

  const px = (v: number) => (v + half) * k;

  const sc = Sd / 190;

  if (bg) {
    x.drawImage(bg.canvas, 0, 0, Sd, Sd);
  }

  x.beginPath();
  x.rect(0, 0, Sd, Sd);
  x.arc(px(zone.cx), px(zone.cz), zone.radius * k, 0, 6.2832, true);
  x.fillStyle = 'rgba(91,70,224,.4)';
  x.fill();

  if (zone.next) {
    x.beginPath();
    x.arc(px(zone.next.cx), px(zone.next.cz), zone.next.radius * k, 0, 6.2832);
    x.setLineDash([5 * sc, 4 * sc]);
    x.lineWidth = 2 * sc;
    x.strokeStyle = '#ffd24a';
    x.stroke();
    x.setLineDash([]);
  }

  x.beginPath();
  x.arc(px(zone.cx), px(zone.cz), zone.radius * k, 0, 6.2832);
  x.lineWidth = 2 * sc;
  x.strokeStyle = '#ffffff';
  x.stroke();

  const mx = px(playerBody.x);
  const my = px(playerBody.z);
  const an = Math.atan2(-Math.cos(player.yaw), -Math.sin(player.yaw));

  x.beginPath();
  x.moveTo(mx, my);
  x.arc(mx, my, 30 * sc, an - 0.8, an + 0.8);
  x.closePath();
  x.fillStyle = 'rgba(90,209,255,.32)';
  x.fill();
  x.beginPath();
  x.moveTo(mx + Math.cos(an) * 8 * sc, my + Math.sin(an) * 8 * sc);
  x.lineTo(mx + Math.cos(an + 2.5) * 6 * sc, my + Math.sin(an + 2.5) * 6 * sc);
  x.lineTo(mx + Math.cos(an - 2.5) * 6 * sc, my + Math.sin(an - 2.5) * 6 * sc);
  x.closePath();
  x.fillStyle = '#5ad1ff';
  x.fill();
  x.lineWidth = 1.5 * sc;
  x.strokeStyle = '#000';
  x.stroke();
};
