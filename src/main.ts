import './style.css';
import './input/listeners';
import './menu/setup';
import { frame } from './loop/frame';
import { showMenu } from './menu/showMenu';
import { registerOffline } from './offline/registerOffline';

requestAnimationFrame(frame);

showMenu();

registerOffline();
