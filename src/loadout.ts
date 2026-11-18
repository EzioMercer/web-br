import { mkPick, pickups } from './br/pickups';
import { feed } from './hud/hud';
import { scene } from './render/renderer';
import { OPT, WPN } from './weapons';
import { state } from './state';
import type { OpticId, OwnedWeapon, Pickup } from './types';

/** Weapons carried, except the knife. */
export const gunKeys = () => Object.keys(state.owned).filter(k => k !== 'knife');

/** Optics fit SMGs, rifles and shotguns. */
export const canOpt = (id: string) => {
  const a = WPN[id].at;
  return a === 'smg' || a === 'rif' || a === 'shl';
};

export const curOpt = () => {
  const o = state.owned[state.cw];
  return o && o.opt && canOpt(state.cw) ? OPT[o.opt] : null;
};

export const canScope = () => !!(state.WP.snp || !state.WP.melee);

export const scopeFov = (): number => state.WP.snp ? state.WP.zoom! : curOpt()?.fov ?? (state.WP.sl === 2 ? 66 : 62);

/** The gun a new optic would go on: the current one if free, else another free one, else the current or first one. */
export function optTarget() {
  const ks = gunKeys().filter(canOpt);
  if (!ks.length) {
    return null;
  }
  const cur = ks.includes(state.cw) ? state.cw : null;
  const free = ks.filter(k => !state.owned[k].opt);
  return cur && !state.owned[cur].opt ? cur : free[0] || cur || ks[0];
}

export function swapOpt(k: Pickup) {
  const tg = optTarget();
  if (!tg) {
    return;
  }
  const old = state.owned[tg].opt;
  state.owned[tg].opt = k.id as OpticId;
  if (old) {
    mkPick(k.x, k.z, 'o', old, undefined, k.y);
  }
  scene.remove(k.m);
  pickups.splice(pickups.indexOf(k), 1);
  state.brNear = null;
  feed('Attached ' + OPT[k.id as OpticId].n + ' to ' + WPN[tg].name);
}

/** Gives weapon `id` (with ammo and optic `st` if dropped by someone) and switches to it, dropping `drop` if both slots are full. */
export function giveW(id: string, st?: OwnedWeapon, drop?: string) {
  const w = WPN[id];
  state.owned[state.cw] = Object.assign(state.owned[state.cw] || {}, { mag: state.mag, res: state.res });
  if (state.owned[id]) {
    state.owned[id].res += w.mag;
    if (st && st.opt && !state.owned[id].opt) {
      state.owned[id].opt = st.opt;
    }
  } else {
    if (gunKeys().length >= 2) {
      delete state.owned[drop || (state.cw !== 'knife' ? state.cw : gunKeys()[1])];
    }
    state.owned[id] = st ? { mag: st.mag, res: st.res, opt: st.opt } : { mag: w.mag, res: w.mag };
  }

  state.cw = id;
  state.WP = w;
  ({ mag: state.mag, res: state.res } = state.owned[id]);
  state.reloading = false;
  state.scoped = false;
  state.cg = null;
}
