import { byId } from '../byId';

/** Marks the button whose value is `v` in a row made by `optionButtons`. */
export const markOption = (id: string, v: unknown) => {
  for (const b of byId(id).children) {
    b.classList.toggle('on', (b as HTMLElement).dataset.v === String(v));
  }
};
