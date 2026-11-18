let stepBus: GainNode | null = null;

let stepBusFor: AudioContext | null = null;

/** Footstep output bus (through a compressor), rebuilt when the audio context changes. */
export const footstepBus = (ac: AudioContext) => {
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
