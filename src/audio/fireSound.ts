import { loadout } from '../loadout/state';
import { noiseBurst } from './noiseBurst';
import { tone } from './tone';

export const fireSound = () => {
  if (loadout.weapon.sniper) {
    const big = loadout.weaponId === 'm82';

    noiseBurst(big ? 1 : 0.8, big ? 0.7 : 0.55, big ? 800 : 1100);
    noiseBurst(0.5, 0.08, 6000);
    tone(big ? 52 : 70, 28, 0.5, 0.9, 'sine');

    if (loadout.weapon.boltAction) {
      for (const [ms, f] of [[350, 700], [650, 450], [1050, 1000], [1300, 300]]) {
        setTimeout(() => tone(f, f * 0.5, 0.05, 0.3, 'square'), ms);
      }
    }
  } else if (loadout.weapon.pellets) {
    noiseBurst(0.9, 0.3, 1500);
    tone(90, 35, 0.3, 0.8, 'sine');
    setTimeout(() => {
      tone(400, 200, 0.05, 0.3, 'square');
      tone(300, 150, 0.06, 0.3, 'square');
    }, 450);
  } else if (loadout.weapon.slot === 2) {
    if (loadout.weaponId === 'deagle') {
      noiseBurst(0.7, 0.22, 2500);
      tone(160, 40, 0.2, 0.8, 'triangle');
    } else {
      noiseBurst(0.4, 0.09, 4200);
      tone(260, 70, 0.1, 0.35, 'triangle');
    }
  } else if (loadout.weapon.fireInterval < 0.1) {
    noiseBurst(0.4, 0.07, 5000);
    tone(300, 120, 0.07, 0.3, 'square');
  } else {
    noiseBurst(0.5, 0.16, loadout.weaponId === 'm4' ? 2800 : 2200);
    tone(loadout.weaponId === 'm4' ? 160 : 130, 45, 0.16, 0.5, 'triangle');
  }
};
