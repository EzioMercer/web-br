// Tree shapes, for a tree of size 1 standing at the origin (m). The models (treeGeometry) are built from them, and so
// are the leaf boxes that hide the player from bots (placeTree), so what a bot can't see through is what is drawn.

/** Pine tiers, widest at the bottom: radius, base y, height. */
export const PINE_TIERS = [[2.6, 1.9, 3], [2.1, 3.3, 2.8], [1.55, 4.7, 2.5], [0.95, 6, 2.2]];

/** Broadleaf crown, a cluster of rough blobs: x, y, z, radius. */
export const BROADLEAF_BLOBS = [
  [0, 4.7, 0, 2],
  [1.3, 4.2, 0.4, 1.5],
  [-1.1, 4.3, -0.7, 1.55],
  [0.25, 5.8, -0.25, 1.4],
  [-0.4, 4.1, 1.2, 1.4],
  [0.7, 4.3, -1.15, 1.35],
];

/** The far model's broadleaf crown: three bigger blobs stand in for the six. */
export const BROADLEAF_FAR_BLOBS = [[0.15, 4.8, -0.1, 2.25], [1.05, 4.3, 0.55, 1.7], [-0.95, 4.3, -0.55, 1.75]];
