import { loadout } from './loadout';
import { settings } from './settings';

let ctx: AudioContext | undefined;

/** Ground surface, for footstep sounds. */
export type Surface = 'dust' | 'grass' | 'snow' | 'water';

/** Creates the audio context on first use and resumes it (browsers start it suspended until a click). */
export const unlockAudio = () => {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { /* No Web Audio: the game runs silently. */ }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
};

/** Filtered noise burst. */
export const noiseBurst = (vol: number, dur: number, freq: number) => {
  if (!ctx) {
    return;
  }
  const n = ctx.sampleRate * dur | 0;
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  }
  const s = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  s.buffer = b;
  f.type = 'lowpass';
  f.frequency.value = freq;
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  s.start();
};

/** Pitch sweep from `f0` to `f1` Hz. */
export const tone = (f0: number, f1: number, dur: number, vol: number, type?: OscillatorType) => {
  if (!ctx) {
    return;
  }
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime;
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
};

export const fireSound = () => {
  if (loadout.weapon.sniper) {
    const big = loadout.weaponId === 'm82';
    noiseBurst(big ? 1 : 0.8, big ? 0.7 : 0.55, big ? 800 : 1100);
    noiseBurst(0.5, 0.08, 6000);
    tone(big ? 52 : 70, 28, 0.5, 0.9, 'sine');
    if (loadout.weapon.boltAction) {
      for (const [ms, f] of [[350, 700], [650, 450], [1050, 1000], [1300, 300]]) {
        setTimeout(() => tone(f, f * 0.5, 0.05, 0.3, 'square'), ms);
      }
    }
  } else if (loadout.weapon.pellets) {
    noiseBurst(0.9, 0.3, 1500);
    tone(90, 35, 0.3, 0.8, 'sine');
    setTimeout(() => {
      tone(400, 200, 0.05, 0.3, 'square');
      tone(300, 150, 0.06, 0.3, 'square');
    }, 450);
  } else if (loadout.weapon.slot === 2) {
    if (loadout.weaponId === 'deagle') {
      noiseBurst(0.7, 0.22, 2500);
      tone(160, 40, 0.2, 0.8, 'triangle');
    } else {
      noiseBurst(0.4, 0.09, 4200);
      tone(260, 70, 0.1, 0.35, 'triangle');
    }
  } else if (loadout.weapon.fireInterval < 0.1) {
    noiseBurst(0.4, 0.07, 5000);
    tone(300, 120, 0.07, 0.3, 'square');
  } else {
    noiseBurst(0.5, 0.16, loadout.weaponId === 'm4' ? 2800 : 2200);
    tone(loadout.weaponId === 'm4' ? 160 : 130, 45, 0.16, 0.5, 'triangle');
  }
};

let stepBus: GainNode | null = null;
let stepBusFor: AudioContext | null = null;

/** Footstep output bus (through a compressor), rebuilt when the audio context changes. */
const footstepBus = (ac: AudioContext) => {
  if (!stepBus || stepBusFor !== ac) {
    stepBusFor = ac;
    stepBus = ac.createGain();
    stepBus.gain.value = 1;
    if (ac.createDynamicsCompressor) {
      const c = ac.createDynamicsCompressor();
      c.threshold.value = -26;
      c.knee.value = 12;
      c.ratio.value = 6;
      c.attack.value = 0.003;
      c.release.value = 0.15;
      stepBus.connect(c);
      c.connect(ac.destination);
    } else {
      stepBus.connect(ac.destination);
    }
  }
  return stepBus;
};

export const stepNoise = (vol: number, dur: number, f: number, att: number, at?: number) => {
  if (!ctx || vol <= 0) {
    return;
  }
  const t = ctx.currentTime + (at || 0);
  const n = Math.max(8, ctx.sampleRate * dur | 0);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  }
  const src = ctx.createBufferSource();
  const f1 = ctx.createBiquadFilter();
  const f2 = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = b;
  f1.type = f2.type = 'lowpass';
  f1.frequency.value = f2.frequency.value = f;
  if (f1.Q) {
    f1.Q.value = f2.Q.value = 0.5;
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + att);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f1);
  f1.connect(f2);
  f2.connect(g);
  g.connect(footstepBus(ctx));
  src.start(t);
};

export const stepThump = (f0: number, f1: number, dur: number, vol: number, at?: number) => {
  if (!ctx || vol <= 0) {
    return;
  }
  const t = ctx.currentTime + (at || 0);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g);
  g.connect(footstepBus(ctx));
  o.start(t);
  o.stop(t + dur + 0.02);
};

export const footstep = (s: Surface, v: number) => {
  if (!ctx || v <= 0) {
    return;
  }
  v = Math.min(v, 1.2) * settings.footstepVolume;
  const r = 0.85 + Math.random() * 0.3;
  if (s === 'dust') {
    stepNoise(0.30 * v, 0.10, 1100 * r, 0.006);
    stepThump(120 * r, 65, 0.09, 0.20 * v);
  } else if (s === 'grass') {
    stepNoise(0.22 * v, 0.14, 720 * r, 0.012);
  } else if (s === 'snow') {
    stepNoise(0.20 * v, 0.07, 1900 * r, 0.008);
    stepNoise(0.15 * v, 0.07, 1500 * r, 0.008, 0.05);
    stepThump(95 * r, 60, 0.10, 0.10 * v);
  } else if (s === 'water') {
    stepNoise(0.30 * v, 0.26, 650 * r, 0.012);
    stepThump(230 * r, 110, 0.13, 0.13 * v);
    stepNoise(0.12 * v, 0.12, 900 * r, 0.01, 0.09);
    stepThump(320 * r, 190, 0.10, 0.06 * v, 0.11);
  }
};

type ReloadClick = 'out' | 'in' | 'slap' | 'bolt' | 'shell' | 'pump';

const reloadClick = (k: ReloadClick) => {
  if (k === 'out') {
    noiseBurst(0.5, 0.07, 1800);
    tone(220, 90, 0.07, 0.5, 'triangle');
  } else if (k === 'in') {
    noiseBurst(0.7, 0.06, 3000);
    tone(420, 160, 0.08, 0.6, 'square');
  } else if (k === 'slap') {
    noiseBurst(0.6, 0.05, 4500);
    tone(700, 300, 0.05, 0.4, 'square');
  } else if (k === 'bolt') {
    tone(300, 120, 0.09, 0.5, 'sawtooth');
    noiseBurst(0.5, 0.1, 2500);
  } else if (k === 'shell') {
    noiseBurst(0.4, 0.04, 3500);
    tone(900, 500, 0.04, 0.4, 'square');
  } else if (k === 'pump') {
    noiseBurst(0.7, 0.12, 1500);
    tone(180, 70, 0.12, 0.6, 'triangle');
  }
};

/** Reload sound cues: [delay in ms, click], scaled to the weapon's reload time. */
export const reloadCues = (): [number, ReloadClick][] => {
  const k = loadout.weapon.reloadTime / 2.4;
  const a: [number, ReloadClick][] = loadout.weapon.boltAction ? [[500, 'bolt'], [1000, 'in'], [1500, 'in'], [2000, 'in'], [2800, 'bolt']] : loadout.weapon.pellets ? [[500, 'shell'], [900, 'shell'], [1300, 'shell'], [1700, 'shell'], [2100, 'shell'], [2400, 'pump']] : loadout.weapon.slot === 2 ? [[600, 'out'], [1250, 'in'], [1600, 'slap']] : [[600, 'out'], [1400, 'in'], [1750, 'slap'], [2050, 'bolt']];
  return a.map(([ms, t]) => [ms * k, t]);
};

export const playReloadCues = (list: [number, ReloadClick][]) => {
  const w = loadout.weaponId;
  for (const [ms, t] of list) {
    setTimeout(() => {
      if (loadout.reloading && loadout.weaponId === w) {
        reloadClick(t);
      }
    }, ms);
  }
};
