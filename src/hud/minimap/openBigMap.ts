import { byId } from '../../utils/byId';
import { getIsland } from '../../world/level/getIsland';
import { renderMapBg } from './renderMapBg';
import { maps } from './state';

export const openBigMap = (v: boolean) => {
  maps.bigOpen = v;
  byId('bigmap').style.display = maps.bigOpen ? 'block' : 'none';

  if (maps.bigOpen && !maps.big) {
    const S = Math.max(360, Math.min(780, Math.floor(Math.min(innerWidth, innerHeight) * 0.84)));

    maps.big = renderMapBg(getIsland(), S, true);
  }
};
