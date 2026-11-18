import { mall } from '../buildings/mall';
import { site } from './site';

/* ===== landmarks ===== */
/** Central Mall. */
export const buildCentralMall = () => {
  const s = site('Central Mall');

  mall(s.x, s.z - 10, s.groundY);
};
