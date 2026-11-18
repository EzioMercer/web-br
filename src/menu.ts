// @ts-nocheck -- split from the original monolith, not typed yet
import { initAudio } from './audio';
import { $ } from './dom';
import { lockMouse, setPlay } from './input';
import { setMode } from './modes';
import { DIFF } from './weapons';
import { state } from './state';

let menuMode = null;
const MD = { blockout: 'Open arena with crates and walls', mansion: 'Two-floor house with a garden', dust2: 'Both bombsites: A long and short, B tunnels, mid, CT spawn', br: '900 m island: mountains, rivers, a mall, a port, an airfield and more' };
const MODES = [['casual', 'Casual', 'Buy phase, shop, grenades and money. Win rounds by eliminating all bots.'], ['sniper', 'Only Sniper', 'Everyone carries only an AWP. Every shot counts.'], ['arms', 'Arms Race', 'Every kill upgrades your weapon. Finish the ladder first.'], ['br', 'Battle Royale', 'Huge island, loot, shrinking zone. Last one alive wins.']];
const MMAPS = { casual: ['blockout', 'mansion', 'dust2'], sniper: ['blockout', 'dust2'], arms: ['blockout', 'mansion', 'dust2'], br: ['br'] };

function card(t, d, f) {
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
  $('mback').style.display = 'none';
  card('Drop in', '900 m island with mountains, rivers, towns, a mall, a port and an airfield. Loot weapons, optics and armor, stay inside the shrinking zone, and be the last one alive.', () => startGame('br', 'br'));
}

function startGame(m, k) {
  state.lastMap = k;
  setMode(m);
  state.inMenu = false;
  $('menu').style.display = 'none';
  initAudio();
  if (state.AC && state.AC.state === 'suspended') {
    state.AC.resume();
  }
  lockMouse();
}

$('mback').onclick = () => showMenu();
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
  state.sensMul = +e.target.value;
};
$('fvol').oninput = (e) => {
  state.stepVol = +e.target.value / 100;
};
