import { TILE_NAMES } from '../data/consts';
import { getTileImageUrl } from './tileImages';

export const preloadTileImages = (): Promise<void[]> =>
  Promise.all(
    TILE_NAMES.map(
      (tileName) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = getTileImageUrl(tileName);
        })
    )
  );
