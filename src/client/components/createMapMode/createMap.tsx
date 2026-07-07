import { ThreeEvent, useLoader } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Mesh, TextureLoader } from 'three';
import { mapTilesData as initialMapTilesData } from './createMapTilesData';
import { MapCanvas } from '../shared/MapCanvas';
import { MapTiles } from '../shared/MapTiles';
import { ROTATE_LEFT_ICON } from '../shared/tileAssets';
import type { MapTileData } from '../../types/mapTile';
import type { CreateMapProps } from '../../types/createMap';

const ROTATE_STEP = 60;
const ROTATE_ARROW_OFFSET = 0.6;
const ROTATE_ARROW_HEIGHT = 0.1;

const RotateArrow = ({
  direction,
  position,
  iconUrl,
  onClick,
}: {
  direction: 'RIGHT' | 'LEFT';
  position: [number, number, number];
  iconUrl: string;
  onClick: () => void;
}) => {
  const texture = useLoader(TextureLoader, iconUrl);
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const originalRaycast = mesh.raycast.bind(mesh);
    // Rotate arrows sit low above the ground and can overlap a neighboring
    // tile's raised terrain (hills/mountains). Force any real intersection
    // with this plane to report distance 0 so it always sorts ahead of
    // whatever tile geometry happens to be underneath it.
    mesh.raycast = (raycaster, intersects) => {
      const before = intersects.length;
      originalRaycast(raycaster, intersects);
      for (let i = before; i < intersects.length; i++) {
        intersects[i]!.distance = 0;
      }
    };
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, direction === 'RIGHT' ? -0.5 : 0.5]}
      scale={[direction === 'RIGHT' ? -1 : 1, 1, 1]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick();
      }}
      renderOrder={999}
    >
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} side={2} />
    </mesh>
  );
};

const RotateControls = ({
  tile,
  onRotate,
}: {
  tile: MapTileData;
  onRotate: (id: number, delta: number) => void;
}) => {
  return (
    <>
      <RotateArrow
        direction="RIGHT"
        position={[tile.positionX - ROTATE_ARROW_OFFSET, ROTATE_ARROW_HEIGHT, tile.positionZ]}
        iconUrl={ROTATE_LEFT_ICON}
        onClick={() => onRotate(tile.id, -ROTATE_STEP)}
      />
      <RotateArrow
        direction="LEFT"
        position={[tile.positionX + ROTATE_ARROW_OFFSET, ROTATE_ARROW_HEIGHT, tile.positionZ]}
        iconUrl={ROTATE_LEFT_ICON}
        onClick={() => onRotate(tile.id, ROTATE_STEP)}
      />
    </>
  );
};

export const Map = ({
  selectedTileName,
  rotatingTileId,
  onRotatingTileIdChange,
}: CreateMapProps) => {
  const [tiles, setTiles] = useState(initialMapTilesData);

  const handleTileClick = (id: number) => {
    if (selectedTileName) {
      setTiles((prev) =>
        prev.map((tile) => (tile.id === id ? { ...tile, tileName: selectedTileName } : tile))
      );
      return;
    }
    onRotatingTileIdChange(rotatingTileId === id ? null : id);
  };

  const handleRotateTile = (id: number, delta: number) => {
    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === id ? { ...tile, rotationY: (tile.rotationY + delta + 360) % 360 } : tile
      )
    );
  };

  const rotatingTile = tiles.find((tile) => tile.id === rotatingTileId) ?? null;

  return (
    <MapCanvas>
      <MapTiles tiles={tiles} onTileClick={handleTileClick} />
      {rotatingTile && <RotateControls tile={rotatingTile} onRotate={handleRotateTile} />}
    </MapCanvas>
  );
};
