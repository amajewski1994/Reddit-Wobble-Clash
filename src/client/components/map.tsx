import { Canvas, extend, ThreeElement, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mapTilesData } from './mapTilesData';

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

const GrassTile = ({ position, rotation, name }: { position?: [number, number, number], rotation?: [number, number, number], name?: string }) => {
  const path = `/assets/tiles/${name}.glb`
  const gltf = useLoader(GLTFLoader, path);
  const scene = useMemo(() => gltf.scene.clone(), [gltf]);
  return <primitive object={scene} position={position} rotation={rotation} />;
};

const MapTiles = () => {
  return (
    <>
      {mapTilesData.map(({ id, positionX, positionZ, rotationY, tileName }) => (
        <GrassTile
          key={id}
          position={[positionX, 0, positionZ]}
          rotation={[0, (rotationY * Math.PI) / 180, 0]}
          name={tileName}
        />
      ))}
    </>
  );
};

export const Map = () => {
  return (
    <Canvas camera={{ position: [0, 12, 0.01], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <MapTiles />
      <CameraControls />
    </Canvas>
  );
};
