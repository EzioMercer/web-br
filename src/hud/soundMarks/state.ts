/** One direction mark around the crosshair: where a sound came from, and how long ago. */
export type SoundMark = {
  el: HTMLElement;
  /** What made the sound (a bot), so its next step moves this mark instead of taking another. */
  src: object | null;
  shot: boolean;
  x: number;
  z: number;
  /** Seconds since the sound; the mark is hidden from `SOUND_MARK_LIFE` on. */
  age: number;
  /** Opacity at its brightest (0..1): quieter, farther sounds give fainter marks. */
  strength: number;
};

/** Seconds a mark stays on screen after its sound. */
export const SOUND_MARK_LIFE = 1.3;

/** Distance of the footstep marks from the screen centre (px). */
export const SOUND_MARK_RADIUS = 128;

/** Gunshot marks sit on a wider ring, so a bot's shot and its steps don't cover each other. */
export const SHOT_MARK_RADIUS = 166;

/** The pool of marks, made on first use. */
export const soundMarks: SoundMark[] = [];
