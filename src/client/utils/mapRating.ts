import { DEFAULT_MAP_TITLE } from '../data/consts';
import type { MapTileData } from '../../shared/types/mapTile';
import type { PlacedAvatar } from '../../shared/types/createMap';

const MIN_TILE_TYPE_CLUSTER_SIZE = 3;
const TILE_TYPE_CLUSTER_BONUS = 0.15;

export const calculateMapRating = (
  tiles: MapTileData[],
  placedAvatars: (PlacedAvatar | null)[],
  mapTitle: string
) => {
  const tileNameCounts = new Map<string, number>();
  tiles.forEach((tile) => {
    tileNameCounts.set(tile.tileName, (tileNameCounts.get(tile.tileName) ?? 0) + 1);
  });
  const usedTileTypesCount = tileNameCounts.size;
  const tileClusterBonus = Array.from(tileNameCounts.values()).filter(
    (count) => count >= MIN_TILE_TYPE_CLUSTER_SIZE
  ).length * TILE_TYPE_CLUSTER_BONUS;
  const enemiesCount = placedAvatars.filter((slot) => slot !== null).length;
  const isNameChanged = mapTitle !== DEFAULT_MAP_TITLE;
  const rawRating =
    usedTileTypesCount * 0.15 +
    tileClusterBonus +
    enemiesCount * 0.3 +
    (isNameChanged ? 0.1 : 0);
  return Math.min(5, Math.round(rawRating * 10) / 10);
};
