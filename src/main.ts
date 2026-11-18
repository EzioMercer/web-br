import './style.css';
import { frame } from './loop';
import { showMenu } from './menu';

requestAnimationFrame(frame);
showMenu();
