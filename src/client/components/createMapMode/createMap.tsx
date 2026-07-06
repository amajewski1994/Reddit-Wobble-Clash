import { Canvas, extend, ThreeElement, ThreeEvent, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Mesh, TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mapTilesData as initialMapTilesData } from './createMapTilesData';
import { TILE_NAMES } from '../tileNames';

const TILE_PATHS = TILE_NAMES.map((name) => `/assets/tiles/${name}.glb`);
const ROTATE_LEFT_ICON = '/assets/images/curve-up-arrow.png';
const ROTATE_RIGHT_ICON = '/assets/images/curve-down-arrow.png';

TILE_PATHS.forEach((path) => useLoader.preload(GLTFLoader, path));
useLoader.preload(TextureLoader, ROTATE_LEFT_ICON);
useLoader.preload(TextureLoader, ROTATE_RIGHT_ICON);

extend({ OrbitControls });

declare module '@react-three/fiber' {
  interface ThreeElements {
    orbitControls: ThreeElement<typeof OrbitControls>;
  }
}

const CameraControls = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    controlsRef.current?.update();
  }, []);

  return <orbitControls ref={controlsRef} args={[camera, gl.domElement]} enableDamping />;
};

const Tile = ({
  position,
  rotation,
  name,
  onClick,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  name?: string;
  onClick?: (() => void) | undefined;
}) => {
  const path = `/assets/tiles/${name}.glb`;
  const gltf = useLoader(GLTFLoader, path);
  const scene = useMemo(() => gltf.scene.clone(), [gltf]);
  return <primitive object={scene} position={position} rotation={rotation} onClick={onClick} />;
};

interface MapTilesProps {
  tiles: typeof initialMapTilesData;
  onTileClick: (id: number) => void;
}

const MapTiles = ({ tiles, onTileClick }: MapTilesProps) => {
  return (
    <>
      {tiles.map(({ id, positionX, positionZ, rotationY, tileName }) => (
        <Tile
          key={id}
          position={[positionX, 0, positionZ]}
          rotation={[0, (rotationY * Math.PI) / 180, 0]}
          name={tileName}
          onClick={() => onTileClick(id)}
        />
      ))}
    </>
  );
};

const ROTATE_STEP = 60;
const ROTATE_ARROW_OFFSET = 0.6;
const ROTATE_ARROW_HEIGHT = 0.1;

type TileData = (typeof initialMapTilesData)[number];

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
  tile: TileData;
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

interface MapProps {
  selectedTileName: string | null;
  rotatingTileId: number | null;
  onRotatingTileIdChange: (id: number | null) => void;
}

export const Map = ({ selectedTileName, rotatingTileId, onRotatingTileIdChange }: MapProps) => {
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
    <Canvas camera={{ position: [0, 12, 0.01], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <MapTiles tiles={tiles} onTileClick={handleTileClick} />
      {rotatingTile && <RotateControls tile={rotatingTile} onRotate={handleRotateTile} />}
      <CameraControls />
    </Canvas>
  );
};
