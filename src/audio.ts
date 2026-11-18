// @ts-nocheck -- split from the original monolith, not typed yet
import { state } from './state';

export function initAudio() {
  if (!state.AC) {
    try {
      state.AC = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }
}

export function snd(vol, dur, freq) {
  if (!state.AC) {
    return;
  }
  const n = state.AC.sampleRate * dur | 0;
  const b = state.AC.createBuffer(1, n, state.AC.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  }
  const s = state.AC.createBufferSource();
  const f = state.AC.createBiquadFilter();
  const g = state.AC.createGain();
  s.buffer = b;
  f.type = 'lowpass';
  f.frequency.value = freq;
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(state.AC.destination);
  s.start();
}

export function tone(f0, f1, dur, vol, type) {
  if (!state.AC) {
    return;
  }
  const o = state.AC.createOscillator();
  const g = state.AC.createGain();
  const t = state.AC.currentTime;
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(state.AC.destination);
  o.start(t);
  o.stop(t + dur);
}

export function fireSnd() {
  if (state.WP.snp) {
    const big = state.cw === 'm82';
    snd(big ? 1 : 0.8, big ? 0.7 : 0.55, big ? 800 : 1100);
    snd(0.5, 0.08, 6000);
    tone(big ? 52 : 70, 28, 0.5, 0.9, 'sine');
    if (state.WP.bolt) {
      for (const [ms, f] of [[350, 700], [650, 450], [1050, 1000], [1300, 300]]) {
        setTimeout(() => tone(f, f * 0.5, 0.05, 0.3, 'square'), ms);
      }
    }
  } else if (state.WP.pel) {
    snd(0.9, 0.3, 1500);
    tone(90, 35, 0.3, 0.8, 'sine');
    setTimeout(() => {
      tone(400, 200, 0.05, 0.3, 'square');
      tone(300, 150, 0.06, 0.3, 'square');
    }, 450);
  } else if (state.WP.sl === 2) {
    if (state.cw === 'deagle') {
      snd(0.7, 0.22, 2500);
      tone(160, 40, 0.2, 0.8, 'triangle');
    } else {
      snd(0.4, 0.09, 4200);
      tone(260, 70, 0.1, 0.35, 'triangle');
    }
  } else if (state.WP.rate < 0.1) {
    snd(0.4, 0.07, 5000);
    tone(300, 120, 0.07, 0.3, 'square');
  } else {
    snd(0.5, 0.16, state.cw === 'm4' ? 2800 : 2200);
    tone(state.cw === 'm4' ? 160 : 130, 45, 0.16, 0.5, 'triangle');
  }
}

let stepBus = null;
let stepBusFor = null;

function stepOut() {
  if (!stepBus || stepBusFor !== state.AC) {
    stepBusFor = state.AC;
    stepBus = state.AC.createGain();
    stepBus.gain.value = 1;
    if (state.AC.createDynamicsCompressor) {
      const c = state.AC.createDynamicsCompressor();
      c.threshold.value = -26;
      c.knee.value = 12;
      c.ratio.value = 6;
      c.attack.value = 0.003;
      c.release.value = 0.15;
      stepBus.connect(c);
      c.connect(state.AC.destination);
    } else {
      stepBus.connect(state.AC.destination);
    }
  }
  return stepBus;
}

export function stepNoise(vol, dur, f, att, at) {
  if (!state.AC || vol <= 0) {
    return;
  }
  const t = state.AC.currentTime + (at || 0);
  const n = Math.max(8, state.AC.sampleRate * dur | 0);
  const b = state.AC.createBuffer(1, n, state.AC.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  }
  const src = state.AC.createBufferSource();
  const f1 = state.AC.createBiquadFilter();
  const f2 = state.AC.createBiquadFilter();
  const g = state.AC.createGain();
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
  g.connect(stepOut());
  src.start(t);
}

export function stepThump(f0, f1, dur, vol, at) {
  if (!state.AC || vol <= 0) {
    return;
  }
  const t = state.AC.currentTime + (at || 0);
  const o = state.AC.createOscillator();
  const g = state.AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g);
  g.connect(stepOut());
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function stepSnd(s, v) {
  if (!state.AC || v <= 0) {
    return;
  }
  v = Math.min(v, 1.2) * state.stepVol;
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
}

function rclick(k) {
  if (k === 'out') {
    snd(0.5, 0.07, 1800);
    tone(220, 90, 0.07, 0.5, 'triangle');
  } else if (k === 'in') {
    snd(0.7, 0.06, 3000);
    tone(420, 160, 0.08, 0.6, 'square');
  } else if (k === 'slap') {
    snd(0.6, 0.05, 4500);
    tone(700, 300, 0.05, 0.4, 'square');
  } else if (k === 'bolt') {
    tone(300, 120, 0.09, 0.5, 'sawtooth');
    snd(0.5, 0.1, 2500);
  } else if (k === 'shell') {
    snd(0.4, 0.04, 3500);
    tone(900, 500, 0.04, 0.4, 'square');
  } else if (k === 'pump') {
    snd(0.7, 0.12, 1500);
    tone(180, 70, 0.12, 0.6, 'triangle');
  }
}

export function reloadSeq() {
  const k = state.WP.rt / 2.4;
  const a = state.WP.bolt ? [[500, 'bolt'], [1000, 'in'], [1500, 'in'], [2000, 'in'], [2800, 'bolt']] : state.WP.pel ? [[500, 'shell'], [900, 'shell'], [1300, 'shell'], [1700, 'shell'], [2100, 'shell'], [2400, 'pump']] : state.WP.sl === 2 ? [[600, 'out'], [1250, 'in'], [1600, 'slap']] : [[600, 'out'], [1400, 'in'], [1750, 'slap'], [2050, 'bolt']];
  return a.map(([ms, t]) => [ms * k, t]);
}

export function rsnd(list) {
  const w = state.cw;
  for (const [ms, t] of list) {
    setTimeout(() => {
      if (state.reloading && state.cw === w) {
        rclick(t);
      }
    }, ms);
  }
}
