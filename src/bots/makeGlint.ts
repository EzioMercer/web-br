import * as THREE from 'three';

let glintTexture: THREE.CanvasTexture | null = null;

/** A bright lens-flare sprite for a bot's sniper scope (hidden until it aims at the player). */
export const makeGlint = () => {
  if (!glintTexture) {
    const c = document.createElement('canvas');

    c.width = c.height = 64;

    const g = c.getContext('2d')!;
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);

    // a white-hot core in a warm halo, so it stands out on sky, grass and white walls alike
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.16, 'rgba(255,252,225,1)');
    rg.addColorStop(0.3, 'rgba(255,170,40,0.9)');
    rg.addColorStop(0.6, 'rgba(255,120,20,0.35)');
    rg.addColorStop(1, 'rgba(255,100,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(255,235,170,0.85)';
    g.fillRect(0, 31, 64, 2);
    g.fillRect(31, 0, 2, 64);
    glintTexture = new THREE.CanvasTexture(c);
    glintTexture.colorSpace = THREE.SRGBColorSpace;
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
