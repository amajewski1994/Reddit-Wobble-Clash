import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getIsSoundEnabled, subscribeSoundEnabled } from '../utils/musicState';

const MUSIC_BASE_URL = '/assets/music';

export const useBackgroundMusic = (fileName: string | null) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSoundEnabled = useSyncExternalStore(
    subscribeSoundEnabled,
    getIsSoundEnabled
  );

  useEffect(() => {
    if (!fileName || !isSoundEnabled) {
      audioRef.current?.pause();
      audioRef.current = null;
      return;
    }

    const audio = new Audio(`${MUSIC_BASE_URL}/${fileName}`);
    audio.loop = true;
    audioRef.current = audio;
    void audio.play().catch(() => {});

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [fileName, isSoundEnabled]);
};
