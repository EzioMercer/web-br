import { WEAPONS } from '../data/weapons';

/** Optics fit SMGs, rifles and shotguns. */
export const takesOptic = (id: string) => {
  const a = WEAPONS[id].ammoType;

  return a === 'smg' || a === 'rif' || a === 'shl';
};
