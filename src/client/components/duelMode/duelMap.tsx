import { Canvas, extend, ThreeElement, ThreeEvent, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Mesh, TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { duelMapTilesData as initialMapTilesData } from './duelMapTilesData';
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

interface MapProps {
  selectedTileName: string | null;
}

export const DuelMap = ({ selectedTileName }: MapProps) => {
  const [tiles, setTiles] = useState(initialMapTilesData);

  const handleTileClick = (id: number) => {
    return
  };

  return (
    <Canvas camera={{ position: [0, 12, 0.01], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <MapTiles tiles={tiles} onTileClick={handleTileClick} />
      <CameraControls />
    </Canvas>
  );
};
