import './style.css';
import './input/listeners';
import './menu/setup';
import { frame } from './loop/frame';
import { showMenu } from './menu/showMenu';

requestAnimationFrame(frame);

showMenu();
