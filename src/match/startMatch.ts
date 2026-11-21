import { addBot } from '../bots/addBot';
import { bots } from '../bots/state';
import { zoneMesh } from '../br/zone/zoneMesh';
import { BOT_COUNT } from '../config';
import { markShadows } from '../graphics/markShadows';
import { loadMap } from '../world/level/loadMap';
import { newMatch } from './newMatch';
import { camera } from '../render/camera';
import { renderer } from '../render/renderer';
import { scene } from '../render/scene';

/** Starts a new match from the menu: builds the island (fresh doors and glass) and drops everyone in. */
export const startMatch = () => {
  while (bots.length < BOT_COUNT) {
    addBot(bots.length);
  }

  zoneMesh.visible = true;
  loadMap();
  newMatch();
  markShadows();

  // compile every shader the match needs now, during the countdown, instead of a stall the first time each one comes
  // into view
  renderer?.compile(scene, camera);
};
