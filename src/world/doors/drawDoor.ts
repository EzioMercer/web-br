import type { Door } from '../../types';

/** Moves door `d`'s instances to where its pivot (and the panel and knob under it) now is. */
export const drawDoor = (d: Door) => {
  if (!d.drawn) {
    return;
  }

  const { panels, knobs, index } = d.drawn;

  d.pivot.updateMatrixWorld(true);
  panels.setMatrixAt(index, d.pivot.children[0].matrixWorld);
  knobs.setMatrixAt(index, d.pivot.children[1].matrixWorld);
  panels.instanceMatrix.needsUpdate = true;
  knobs.instanceMatrix.needsUpdate = true;
};
