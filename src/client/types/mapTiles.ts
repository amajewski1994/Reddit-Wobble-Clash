import type { MapTileData } from './mapTile';

export interface MapTilesProps {
  tiles: MapTileData[];
  onTileClick: (id: number) => void;
  dimmedTileIds?: Set<number>;
}
