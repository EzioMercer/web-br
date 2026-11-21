import { fasterGpu } from '../graphics/fasterGpu';
import { gpuLabel } from '../graphics/gpuLabel';
import { isSoftwareGpu } from '../graphics/isSoftwareGpu';
import { byId } from '../utils/byId';

/**
 * Fills the read-only Graphics card row: the GPU the game draws with and, if the browser shows one, a faster GPU it
 * does not use. Only when the settings open: looking for other GPUs can wake a laptop's graphics card.
 */
export const showGpu = () => {
  const gpu = gpuLabel();

  byId('ggpu').textContent = isSoftwareGpu(gpu.toLowerCase()) ? 'None: software rendering' : gpu || 'Unknown';
  void fasterGpu().then((g) => {
    byId('ggpunote').textContent = g ? 'Not in use: ' + g + ' (faster)' : '';
  });
};
