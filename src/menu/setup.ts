import { DIFFICULTIES } from '../data/difficulties';
import { input } from '../input/state';
import { loadSettings } from '../settings/loadSettings';
import { saveSettings } from '../settings/saveSettings';
import { settings } from '../settings/state';
import { byId } from '../utils/byId';
import { openSettings } from './openSettings';
import { selectTab } from './selectTab';
import { showMenu } from './showMenu';
import { startGame } from './startGame';

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

loadSettings();

byId('play').onclick = () => startGame();

byId('tomenu').onclick = (e) => {
  e.stopPropagation();

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  showMenu();
};

byId('setbtn').onclick = () => openSettings(true);

byId('setclose').onclick = () => openSettings(false);

byId('settings').onclick = (e) => {
  if (e.target === e.currentTarget) {
    openSettings(false);
  }
};

addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && input.inMenu) {
    openSettings(false);
  }
});

document.querySelectorAll<HTMLElement>('#settings .tab').forEach((t) => {
  t.onclick = () => selectTab(t.dataset.tab!);
});

{
  const dd = byId('mdiff');

  for (const k in DIFFICULTIES) {
    const b = document.createElement('button');

    b.textContent = DIFFICULTIES[k].name;
    b.className = 'dbtn' + (DIFFICULTIES[k] === settings.difficulty ? ' on' : '');
    b.onclick = () => {
      settings.difficulty = DIFFICULTIES[k];
      [...dd.children].forEach(c => c.classList.toggle('on', c === b));
      saveSettings();
    };
    dd.appendChild(b);
  }
}

{
  const body = byId('ctlbody');

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
  const sens = byId<HTMLInputElement>('sens');
  const fvol = byId<HTMLInputElement>('fvol');

  const show = () => {
    byId('sensv').textContent = settings.sensitivity.toFixed(1);
    byId('fvolv').textContent = Math.round(settings.footstepVolume * 100) + '%';
  };

  sens.value = String(settings.sensitivity);
  fvol.value = String(Math.round(settings.footstepVolume * 100));
  show();
  sens.oninput = () => {
    settings.sensitivity = +sens.value;
    show();
    saveSettings();
  };
  fvol.oninput = () => {
    settings.footstepVolume = +fvol.value / 100;
    show();
    saveSettings();
  };
}
