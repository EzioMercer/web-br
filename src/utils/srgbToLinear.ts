// Terrain colors are authored in sRGB (the minimap canvas uses them as-is); vertex colors must be linear.
export const srgbToLinear = (a: Float32Array) => {
  const o = new Float32Array(a.length);

  for (let i = 0; i < a.length; i++) {
    const c = a[i];

    o[i] = c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
  }

  return o;
};
