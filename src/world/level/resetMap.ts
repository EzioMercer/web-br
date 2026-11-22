import { clearBulletMarks } from '../../effects/bulletMark';
import { ripples, transientFx } from '../../effects/state';
import { clearMeshes } from '../../render/clearMeshes';
import { doorAngle } from '../doors/doorAngle';
import { drawDoor } from '../doors/drawDoor';
import { doors, panes, shards } from '../doors/state';

/**
 * Puts the map back as the round found it, without building it again: every door shut, every broken pane whole, and
 * no glass shards, bullet marks, explosion flashes or ripples left over. Anything new that a round can change on the
 * map is reset here too.
 */
export const resetMap = () => {
  for (const d of doors) {
    d.openAmount = 0;
    d.target = 0;
    d.side = 1;
    d.closedByPlayer = false;
    d.box.disabled = false;
    d.pivot.rotation.y = doorAngle(d);
    drawDoor(d);
  }

  for (const p of panes) {
    if (p.box.disabled) {
      p.box.disabled = false;

      if (p.mesh) {
        p.mesh.setMatrixAt(p.index, p.matrix);
        p.mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  clearMeshes(shards);
  clearMeshes(transientFx);
  clearMeshes(ripples);
  clearBulletMarks();
};
