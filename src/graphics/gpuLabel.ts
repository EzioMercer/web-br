import { gpuName } from './gpuName';

/**
 * The GPU's name for people: "NVIDIA GeForce RTX 4060 Laptop GPU" from Chrome's
 * "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU (0x000028E0) Direct3D11 vs_5_0 ps_5_0, D3D11)".
 */
export const gpuLabel = () => {
  const n = gpuName();
  const angle = /^ANGLE \([^,]*, (.*?)(?: \(0x[0-9a-f]+\))?(?: Direct3D[^,]*)?(?:, [^,]*)?\)$/i.exec(n);

  return (angle ? angle[1] : n).replace(/^ANGLE Metal Renderer: /, '').trim();
};
