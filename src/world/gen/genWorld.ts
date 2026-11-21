import { BRIDGES, SITES } from '../terrain/constants';
import { genTerrain } from '../terrain/genTerrain';
import { terrainMesh } from '../terrain/terrainMesh';
import { bridge } from './buildings/bridge';
import { buildAurora } from './sites/buildAurora';
import { buildCapeLight } from './sites/buildCapeLight';
import { buildCentralMall } from './sites/buildCentralMall';
import { buildDustyGulch } from './sites/buildDustyGulch';
import { buildFortRedstone } from './sites/buildFortRedstone';
import { buildFrostpeakLodge } from './sites/buildFrostpeakLodge';
import { buildIronworks } from './sites/buildIronworks';
import { buildMapleHeights } from './sites/buildMapleHeights';
import { buildMeadowbrookFarm } from './sites/buildMeadowbrookFarm';
import { buildPinecrest } from './sites/buildPinecrest';
import { buildPortCalder } from './sites/buildPortCalder';
import { buildSkyfieldAirstrip } from './sites/buildSkyfieldAirstrip';
import { fitDoors } from './place/fitDoors';
import { gen } from './state';
import { placeCabins } from './wilderness/placeCabins';
import { placeBoulders } from './wilderness/placeBoulders';
import { placeGasStations } from './wilderness/placeGasStations';
import { placeRocks } from './wilderness/placeRocks';
import { plantTrees } from './wilderness/plantTrees';
import { scatterLoot } from './wilderness/scatterLoot';

export const genWorld = () => {
  gen.terrain = genTerrain();
  gen.seed = 4242;
  gen.boxes = [];
  gen.glass = [];
  gen.doors = [];
  gen.loot = [];
  gen.footprints = [];
  gen.stairwells = [];
  buildCentralMall();
  buildAurora();
  buildMapleHeights();
  buildPinecrest();
  buildFrostpeakLodge();
  buildFortRedstone();
  buildIronworks();
  buildPortCalder();
  buildMeadowbrookFarm();
  buildDustyGulch();
  buildSkyfieldAirstrip();
  buildCapeLight();

  for (const b of BRIDGES) {
    bridge(b);
  }

  const cabins = placeCabins();
  const gasStations = placeGasStations();
  const treeCount = plantTrees();
  const rockCount = placeRocks();
  const boulders = placeBoulders();

  scatterLoot();
  fitDoors();
  return {
    terrain: gen.terrain,
    mesh: terrainMesh(gen.terrain),
    boxes: gen.boxes,
    glass: gen.glass,
    doors: gen.doors,
    loot: gen.loot,
    footprints: gen.footprints,
    stairs: gen.stairwells,
    pois: SITES,
    counts: { trees: treeCount, rocks: rockCount, boulders, cabins, gas: gasStations },
  };
};
