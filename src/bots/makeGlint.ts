import * as THREE from 'three';

let glintTexture: THREE.CanvasTexture | null = null;

/** A bright lens-flare sprite for a bot's sniper scope (hidden until it aims at the player). */
export const makeGlint = () => {
  if (!glintTexture) {
    const c = document.createElement('canvas');

    c.width = c.height = 64;

    const g = c.getContext('2d')!;
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);

    // a white-hot core in a soft white halo, like sunlight off a lens
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.18, 'rgba(255,255,255,1)');
    rg.addColorStop(0.32, 'rgba(240,246,255,0.85)');
    rg.addColorStop(0.6, 'rgba(225,235,255,0.3)');
    rg.addColorStop(1, 'rgba(220,230,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(0, 31, 64, 2);
    g.fillRect(31, 0, 2, 64);
    glintTexture = new THREE.CanvasTexture(c);
    glintTexture.colorSpace = THREE.SRGBColorSpace;
    glintTexture.userData.keep = true;
  }

  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glintTexture,
      depthWrite: false,
      fog: false,
      transparent: true,
    }),
  );

  s.visible = false;
  return s;
};
