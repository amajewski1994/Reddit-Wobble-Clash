import { Tile } from './Tile';
import type { MapTilesProps } from '../../types/mapTiles';

export const MapTiles = ({ tiles, onTileClick, dimmedTileIds }: MapTilesProps) => {
  return (
    <>
      {tiles.map(({ id, positionX, positionZ, rotationY, tileName }) => (
        <Tile
          key={id}
          position={[positionX, 0, positionZ]}
          rotation={[0, (rotationY * Math.PI) / 180, 0]}
          name={tileName}
          onClick={() => onTileClick(id)}
          dimmed={dimmedTileIds?.has(id)}
        />
      ))}
    </>
  );
};
