import { stepThump } from '../../audio/stepThump';
import { settings } from '../../settings/state';

export const doorSound = () => {
  stepThump(110, 70, 0.12, 0.12 * settings.footstepVolume);
};
