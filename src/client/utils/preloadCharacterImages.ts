import { characters } from '../data/characters';
import { getCharacterImageUrl } from './characterImages';

export const preloadCharacterImages = (): Promise<void[]> =>
  Promise.all(
    characters.map(
      (character) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = getCharacterImageUrl(character.image);
        })
    )
  );
