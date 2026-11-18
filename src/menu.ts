import { initAudio } from './audio';
import { $ } from './dom';
import { lockMouse, setPlay } from './input';
import { startMatch } from './match';
import { DIFF } from './weapons';
import { state } from './state';

/** Read-only key bindings shown in Settings → Controls. */
const CONTROLS: [string, string[]][] = [
  ['Move', ['W', 'A', 'S', 'D']],
  ['Look', ['Mouse', 'Arrow keys']],
  ['Run', ['Shift']],
  ['Crouch (while running: slide)', ['Ctrl', 'C']],
  ['Jump / bunnyhop', ['Space']],
  ['Fire / throw grenade', ['Left mouse']],
  ['Aim / scope', ['Right mouse']],
  ['Reload', ['R']],
  ['Primary weapon', ['1']],
  ['Secondary weapon', ['2']],
  ['Knife', ['3']],
  ['HE grenade', ['4']],
  ['Flashbang', ['5']],
  ['Smoke grenade', ['6']],
  ['Switch weapon', ['Mouse wheel']],
  ['Loot / swap / doors', ['E']],
  ['Big map', ['M']],
  ['Pause', ['Esc']],
];

const SAVE_KEY = 'web-br.settings';

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') as { sens?: number; vol?: number; diff?: string };
    if (typeof s.sens === 'number') {
      state.sensMul = s.sens;
    }
    if (typeof s.vol === 'number') {
      state.stepVol = s.vol;
    }
    if (s.diff && DIFF[s.diff]) {
      state.D = DIFF[s.diff];
    }
  } catch { /* Storage unavailable: keep the defaults. */ }
}

function saveSettings() {
  try {
    const diff = Object.keys(DIFF).find(k => DIFF[k] === state.D);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ sens: state.sensMul, vol: state.stepVol, diff }));
  } catch { /* Storage unavailable: settings last for this page only. */ }
}

export function showMenu() {
  state.inMenu = true;
  setPlay(false);
  $('menu').style.display = 'flex';
}

function startGame() {
  openSettings(false);
  startMatch();
  state.inMenu = false;
  $('menu').style.display = 'none';
  initAudio();
  if (state.AC && state.AC.state === 'suspended') {
    state.AC.resume();
  }
  lockMouse();
}

function openSettings(v: boolean) {
  $('settings').classList.toggle('on', v);
}

function selectTab(id: string) {
  document.querySelectorAll<HTMLElement>('#settings .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === id));
  document.querySelectorAll<HTMLElement>('#settings .tpane').forEach(p => p.classList.toggle('on', p.id === id));
}

loadSettings();

$('play').onclick = () => startGame();
$('tomenu').onclick = (e) => {
  e.stopPropagation();
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  showMenu();
};

$('setbtn').onclick = () => openSettings(true);
$('setclose').onclick = () => openSettings(false);
$('settings').onclick = (e) => {
  if (e.target === e.currentTarget) {
    openSettings(false);
  }
};
addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && state.inMenu) {
    openSettings(false);
  }
});
document.querySelectorAll<HTMLElement>('#settings .tab').forEach((t) => {
  t.onclick = () => selectTab(t.dataset.tab!);
});

{
  const dd = $('mdiff');
  for (const k in DIFF) {
    const b = document.createElement('button');
    b.textContent = DIFF[k].n;
    b.className = 'dbtn' + (DIFF[k] === state.D ? ' on' : '');
    b.onclick = () => {
      state.D = DIFF[k];
      [...dd.children].forEach(c => c.classList.toggle('on', c === b));
      saveSettings();
    };
    dd.appendChild(b);
  }
}

{
  const body = $('ctlbody');
  for (const [action, keys] of CONTROLS) {
    const tr = document.createElement('tr');
    const a = document.createElement('td');
    a.textContent = action;
    const k = document.createElement('td');
    for (const key of keys) {
      const kb = document.createElement('kbd');
      kb.textContent = key;
      k.appendChild(kb);
    }
    tr.append(a, k);
    body.appendChild(tr);
  }
}

{
  const sens = $<HTMLInputElement>('sens');
  const fvol = $<HTMLInputElement>('fvol');

  const show = () => {
    $('sensv').textContent = state.sensMul.toFixed(1);
    $('fvolv').textContent = Math.round(state.stepVol * 100) + '%';
  };

  sens.value = String(state.sensMul);
  fvol.value = String(Math.round(state.stepVol * 100));
  show();
  sens.oninput = () => {
    state.sensMul = +sens.value;
    show();
    saveSettings();
  };
  fvol.oninput = () => {
    state.stepVol = +fvol.value / 100;
    show();
    saveSettings();
  };
}
