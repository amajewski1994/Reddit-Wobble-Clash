import { DEFAULT_MAP_TITLE } from '../data/consts';
import type { MapTileData } from '../types/mapTile';
import type { PlacedAvatar } from '../types/createMap';

export const calculateMapRating = (
  tiles: MapTileData[],
  placedAvatars: (PlacedAvatar | null)[],
  mapTitle: string
) => {
  const usedTileTypesCount = new Set(tiles.map((tile) => tile.tileName)).size;
  const enemiesCount = placedAvatars.filter((slot) => slot !== null).length;
  const isNameChanged = mapTitle !== DEFAULT_MAP_TITLE;
  const rawRating = usedTileTypesCount * 0.3 + enemiesCount * 0.3 + (isNameChanged ? 0.1 : 0);
  return Math.min(5, Math.round(rawRating * 10) / 10);
};
