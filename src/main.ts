import './style.css';
import { addBot } from './bots';
import { frame } from './loop';
import { showMenu } from './menu';
import { loadMap } from './world/level';

loadMap('blockout', false);
for (let i = 0; i < 5; i++) {
  addBot(i);
}
requestAnimationFrame(frame);
showMenu();
