import * as THREE from 'three';

// Canvas-drawn textures hold sRGB colors.
export const srgbTex = <T extends THREE.Texture>(t: T): T => {
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
