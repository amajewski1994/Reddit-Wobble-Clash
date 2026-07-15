import type { PublishedMap } from '../../shared/types/savedMap';
import type { DuelMapTileData, MapTileData } from '../../shared/types/mapTile';
import { IMPASSABLE_TILE_NAME_PARTS } from '../data/consts';

const isBlockedTile = (tileName: string): boolean =>
  IMPASSABLE_TILE_NAME_PARTS.some((part) => tileName.includes(part));

export function buildPublishedDuelTiles(
  baseTiles: MapTileData[],
  publishedMap: PublishedMap
): DuelMapTileData[] {
  const savedTilesById = new Map(
    publishedMap.tiles.map((tile) => [tile.id, tile])
  );

  return baseTiles.map((baseTile) => {
    const savedTile = savedTilesById.get(baseTile.id);
    const tileName = savedTile?.tileName ?? baseTile.tileName;

    return {
      ...baseTile,
      tileName,
      rotationY: savedTile?.rotationY ?? baseTile.rotationY,
      blocked: isBlockedTile(tileName),
    };
  });
}
