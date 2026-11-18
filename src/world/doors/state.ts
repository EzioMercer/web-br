import * as THREE from 'three';
import type { Box, Door } from '../../types';

export const doors: Door[] = [];

/** Glass panes: collision box and mesh. */
export const panes: { box: Box; mesh: THREE.Mesh }[] = [];

/** Flying glass shards. */
export const shards: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];

/** The door the E key would toggle. */
export const doorFocus = { door: null as Door | null };
