import { input } from '../input/state';
import { clock } from '../sim/state';
import { byId } from '../utils/byId';
import { match } from './state';
import { Phase } from '../types';

export const endMatch = (win: boolean) => {
  match.phase = Phase.Over;
  match.phaseEnd = clock.time + 4;
  input.fireHeld = false;

  const m = byId('msg');

  m.style.color = win ? 'var(--xh)' : 'var(--hp)';
  m.textContent = win ? 'VICTORY ROYALE!' : 'Eliminated';
};
