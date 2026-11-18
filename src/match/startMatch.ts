import { addBot } from '../bots/addBot';
import { bots } from '../bots/state';
import { zoneMesh } from '../br/zone/zoneMesh';
import { BOT_COUNT } from '../config';
import { loadMap } from '../world/level/loadMap';
import { newMatch } from './newMatch';

/** Starts a new match from the menu: builds the island (fresh doors and glass) and drops everyone in. */
export const startMatch = () => {
  while (bots.length < BOT_COUNT) {
    addBot(bots.length);
  }

  zoneMesh.visible = true;
  loadMap();
  newMatch();
};
