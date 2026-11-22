import { DIFFICULTIES } from '../data/difficulties';
import { applyGraphics } from '../graphics/applyGraphics';
import { detectTier } from '../graphics/detectTier';
import { graphics } from '../graphics/state';
import { input } from '../input/state';
import { loadSettings } from '../settings/loadSettings';
import { saveSettings } from '../settings/saveSettings';
import { settings } from '../settings/state';
import { byId } from '../utils/byId';
import { markOption } from '../utils/dom/markOption';
import { optionButtons } from '../utils/dom/optionButtons';
import { ON_OFF_CHOICES } from './graphicsChoices';
import { openSettings } from './openSettings';
import { selectTab } from './selectTab';
import { setupGraphicsTab } from './setupGraphicsTab';
import { showGraphicsOptions } from './showGraphicsOptions';
import { showMenu } from './showMenu';
import { startGame } from './startGame';

/** Read-only key bindings shown in Settings → Controls. */
const CONTROLS: [string, string[]][] = [
  ['Move forward', ['W']],
  ['Move left', ['A']],
  ['Move backward', ['S']],
  ['Move right', ['D']],
  ['Look', ['Mouse', 'Arrow keys']],
  ['Run', ['Shift']],
  ['Crouch (while running: slide)', ['C', 'Ctrl']],
  ['Inventory cursor (inventory open)', ['Alt']],
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
  ['Inventory', ['Tab']],
  ['Big map', ['M']],
  ['Pause', ['Esc']],
];

loadSettings();
graphics.autoTier = detectTier();
applyGraphics();
setupGraphicsTab();

byId('play').onclick = () => startGame();

byId('tomenu').onclick = (e) => {
  e.stopPropagation();

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  showMenu();
};

byId('setbtn').onclick = () => {
  // Auto may have lowered its tier during the last match.
  showGraphicsOptions();
  openSettings(true);
};

// the same settings from the pause screen; the game stays paused behind them
byId('pauseset').onclick = (e) => {
  e.stopPropagation();
  showGraphicsOptions();
  openSettings(true);
};

byId('setclose').onclick = () => openSettings(false);

byId('settings').onclick = (e) => {
  if (e.target === e.currentTarget) {
    openSettings(false);
  }
};

addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && !input.playing) {
    openSettings(false);
  }
});

document.querySelectorAll<HTMLElement>('#settings .tab').forEach((t) => {
  t.onclick = () => selectTab(t.dataset.tab!);
});

{
  const key = () => Object.keys(DIFFICULTIES).find(k => DIFFICULTIES[k] === settings.difficulty);

  optionButtons('mdiff', Object.keys(DIFFICULTIES).map(k => [k, DIFFICULTIES[k].name] as const), (k) => {
    settings.difficulty = DIFFICULTIES[k];
    markOption('mdiff', k);
    saveSettings();
  });
  markOption('mdiff', key());
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
    settings.sensitivity = Number(sens.value);
    show();
    saveSettings();
  };
  fvol.oninput = () => {
    settings.footstepVolume = Number(fvol.value) / 100;
    show();
    saveSettings();
  };
  optionButtons('msnd', ON_OFF_CHOICES, (v) => {
    settings.soundMarks = v;
    markOption('msnd', v);
    saveSettings();
  });
  markOption('msnd', settings.soundMarks);
}
