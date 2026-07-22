import { useSyncExternalStore } from 'react';
import {
  getIsSoundEnabled,
  setIsSoundEnabled,
  subscribeSoundEnabled,
} from '../../utils/musicState';

export const MusicToggleButton = () => {
  const isSoundEnabled = useSyncExternalStore(
    subscribeSoundEnabled,
    getIsSoundEnabled
  );

  return (
    <button
      type="button"
      aria-label={isSoundEnabled ? 'Wyłącz dźwięk' : 'Włącz dźwięk'}
      aria-pressed={isSoundEnabled}
      onClick={() => setIsSoundEnabled(!isSoundEnabled)}
      className="game-button-secondary fixed bottom-6 left-4 z-60 flex h-7 w-7 items-center justify-center rounded-full p-0 text-lg"
    >
      {isSoundEnabled ? '🔊' : '🔇'}
    </button>
  );
};
