import { placeBox } from '../place/placeBox';
import type { Bridge } from '../../terrain/types';

/* ----- bridge: thin deck on pillars, so the river can still be waded underneath ----- */
export const bridge = (b: Bridge) => {
  const Y = b.deckY! + 0.2;
  const z = b.axis === 'z';

  placeBox(b.x, b.z, z ? 6 : b.length, z ? b.length : 6, 0.4, 0x8a6a4a, Y - 0.4);
  placeBox(b.x + (z ? -2.8 : 0), b.z + (z ? 0 : -2.8), z ? 0.4 : b.length, z ? b.length : 0.4, 1.1, 0x6b4a2a, Y);
  placeBox(b.x + (z ? 2.8 : 0), b.z + (z ? 0 : 2.8), z ? 0.4 : b.length, z ? b.length : 0.4, 1.1, 0x6b4a2a, Y);

  for (const k of [-b.length / 4, b.length / 4]) {
    placeBox(b.x + (z ? 0 : k), b.z + (z ? k : 0), z ? 5.6 : 1, z ? 1 : 5.6, Y + 0.3, 0x77695a, -1.2);
  }
};
