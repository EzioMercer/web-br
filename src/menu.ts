import { initAudio } from './audio';
import { $ } from './dom';
import { lockMouse, setPlay } from './input';
import { startMatch } from './match';
import { DIFF } from './weapons';
import { state } from './state';

function card(t: string, d: string, f: () => void) {
  const b = document.createElement('button');
  b.className = 'card';
  b.innerHTML = '<b>' + t + '</b>' + d;
  b.onclick = f;
  $('cards').appendChild(b);
}

export function showMenu() {
  state.inMenu = true;
  setPlay(false);
  $('menu').style.display = 'flex';
  $('cards').innerHTML = '';
  card('Drop in', '900 m island with mountains, rivers, towns, a mall, a port and an airfield. Loot weapons, optics and armor, stay inside the shrinking zone, and be the last one alive.', () => startGame());
}

function startGame() {
  startMatch();
  state.inMenu = false;
  $('menu').style.display = 'none';
  initAudio();
  if (state.AC && state.AC.state === 'suspended') {
    state.AC.resume();
  }
  lockMouse();
}

$('tomenu').onclick = (e) => {
  e.stopPropagation();
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  showMenu();
};
{
  const dd = $('mdiff');
  for (const k in DIFF) {
    const b = document.createElement('button');
    b.textContent = DIFF[k].n;
    b.className = 'dbtn' + (k === 'normal' ? ' on' : '');
    b.onclick = () => {
      state.D = DIFF[k];
      [...dd.children].forEach(c => c.classList.toggle('on', c === b));
    };
    dd.appendChild(b);
  }
}
$('sens').oninput = (e) => {
  state.sensMul = +(e.target as HTMLInputElement).value;
};
$('fvol').oninput = (e) => {
  state.stepVol = +(e.target as HTMLInputElement).value / 100;
};
