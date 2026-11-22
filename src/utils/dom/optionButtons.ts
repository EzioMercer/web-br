import { byId } from '../byId';

/**
 * Fills the row `id` (a `.seg` element) with one `.dbtn` button per choice; clicking one calls `pick` with its value.
 * Each button keeps its value in `data-v`, so `markOption` can show which one is selected.
 */
export const optionButtons = <T>(id: string, choices: readonly (readonly [T, string])[], pick: (v: T) => void) => {
  const row = byId(id);

  for (const [v, label] of choices) {
    const b = document.createElement('button');

    b.className = 'dbtn';
    b.textContent = label;
    b.dataset.v = String(v);
    b.onclick = () => pick(v);
    row.appendChild(b);
  }
};
