import { getIsSoundEnabled } from './musicState';

const SOUND_BASE_URL = '/assets/music';

export const playSound = (fileName: string) => {
  if (!getIsSoundEnabled()) return;

  const audio = new Audio(`${SOUND_BASE_URL}/${fileName}`);
  void audio.play().catch(() => {});
};

const MOVE_SOUND_STEP_DELAY_MS = 750;
const MOVE_SOUND_FILES = ['move_1.mp3', 'move_2.mp3', 'move_3.mp3'];

// Footstep foley for a move action: play the three move sounds one after
// another, spaced out as if hearing someone run, instead of all at once.
export const playMoveSoundSequence = () => {
  MOVE_SOUND_FILES.forEach((fileName, index) => {
    setTimeout(() => playSound(fileName), index * MOVE_SOUND_STEP_DELAY_MS);
  });
};
