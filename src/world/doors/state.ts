import * as THREE from 'three';
import type { Box, Door } from '../../types';

export const doors: Door[] = [];

/** Glass panes: collision box, where the pane is drawn (its tile's instanced mesh and its instance) and its matrix. */
export const panes: { box: Box; matrix: THREE.Matrix4; mesh: THREE.InstancedMesh | null; index: number }[] = [];

/** Flying glass shards. */
export const shards: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];

/** The door the E key would toggle. */
export const doorFocus = { door: null as Door | null };
