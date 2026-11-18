import type { Sphere, Vec3 } from '../types';

export const segmentHitsSphere = (o: Vec3, p: Vec3, s: Sphere) => {
  const dx = p[0] - o[0];
  const dy = p[1] - o[1];
  const dz = p[2] - o[2];
  const l2 = dx * dx + dy * dy + dz * dz || 1;
  let t = ((s.x - o[0]) * dx + (s.y - o[1]) * dy + (s.z - o[2]) * dz) / l2;

  t = Math.max(0, Math.min(1, t));
  return Math.hypot(o[0] + dx * t - s.x, o[1] + dy * t - s.y, o[2] + dz * t - s.z) < s.radius;
};
